import * as Crypto from 'expo-crypto';
import { getDatabase, type DatabaseAdapter } from '../sqlite';
import { localDateKey, nowIso } from '../../utils/date';
import { taskSchema } from '../../utils/validation';
import type { ID, Subtask, SyncOperation, Task, TaskFilters, TaskInput, TaskStatus } from '../../types';

interface TaskRow {
  id: string; user_id: string; title: string; description: string; priority: Task['priority'];
  status: TaskStatus; due_date: string | null; due_time: string | null; category_id: string | null;
  project_id: string | null; created_at: string; updated_at: string; completed_at: string | null;
  archived: number; position: number; deleted_at: string | null; sync_status: Task['syncStatus']; version: number;
}

export function mapTask(row: TaskRow, tags: string[] = [], subtasks: Subtask[] = []): Task {
  return {
    id: row.id, userId: row.user_id, title: row.title, description: row.description,
    priority: row.priority, status: row.status, dueDate: row.due_date, dueTime: row.due_time,
    categoryId: row.category_id, projectId: row.project_id, createdAt: row.created_at,
    updatedAt: row.updated_at, completedAt: row.completed_at, archived: Boolean(row.archived),
    position: row.position, deletedAt: row.deleted_at, syncStatus: row.sync_status,
    version: row.version, tags, subtasks,
  };
}

export class TaskRepository {
  constructor(
    private readonly db?: DatabaseAdapter,
    private readonly uuid: () => string = () => Crypto.randomUUID(),
    private readonly clock: () => string = nowIso,
  ) {}

  private async connection(): Promise<DatabaseAdapter> { return this.db ?? getDatabase(); }

  private async hydrate(rows: TaskRow[], db: DatabaseAdapter): Promise<Task[]> {
    if (!rows.length) return [];
    const ids = rows.map((row) => row.id);
    const placeholders = ids.map(() => '?').join(',');
    const [tagRows, subtaskRows] = await Promise.all([
      db.getAllAsync<{ task_id: string; name: string }>(`SELECT tt.task_id, t.name FROM task_tags tt JOIN tags t ON t.id=tt.tag_id WHERE tt.task_id IN (${placeholders}) ORDER BY t.name`, ids),
      db.getAllAsync<{ id: string; task_id: string; title: string; completed: number; position: number }>(`SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY position`, ids),
    ]);
    return rows.map((row) => mapTask(
      row,
      tagRows.filter((tag) => tag.task_id === row.id).map((tag) => tag.name),
      subtaskRows.filter((item) => item.task_id === row.id).map((item) => ({ id: item.id, taskId: item.task_id, title: item.title, completed: Boolean(item.completed), position: item.position })),
    ));
  }

  async list(userId: ID, filters: TaskFilters = {}, includeDeleted = false): Promise<Task[]> {
    const db = await this.connection();
    const where = ['user_id=?'];
    const params: (string | number)[] = [userId];
    if (!includeDeleted) where.push('deleted_at IS NULL');
    if (!filters.includeArchived) where.push('archived=0');
    if (filters.query?.trim()) {
      const query = `%${filters.query.trim()}%`;
      where.push('(title LIKE ? OR description LIKE ? OR id IN (SELECT tt.task_id FROM task_tags tt JOIN tags tg ON tg.id=tt.tag_id WHERE tg.name LIKE ?))');
      params.push(query, query, query);
    }
    for (const [key, column] of [['priority', 'priority'], ['status', 'status'], ['projectId', 'project_id'], ['categoryId', 'category_id']] as const) {
      const value = filters[key];
      if (value) { where.push(`${column}=?`); params.push(value); }
    }
    const today = localDateKey();
    if (filters.due === 'today') { where.push('due_date=?'); params.push(filters.date ?? today); }
    if (filters.due === 'date' && filters.date) { where.push('due_date=?'); params.push(filters.date); }
    if (filters.due === 'upcoming') { where.push('due_date>?', "status!='completed'"); params.push(today); }
    if (filters.due === 'overdue') { where.push('due_date<?', "status!='completed'"); params.push(today); }
    if (filters.due === 'completed') where.push("status='completed'");
    const order = filters.sort === 'priority'
      ? "CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, due_date IS NULL, due_date"
      : filters.sort === 'deadline' ? 'due_date IS NULL, due_date ASC, due_time ASC'
        : filters.sort === 'position' ? 'position ASC, created_at ASC' : 'created_at DESC';
    const rows = await db.getAllAsync<TaskRow>(`SELECT * FROM tasks WHERE ${where.join(' AND ')} ORDER BY ${order}`, params);
    return this.hydrate(rows, db);
  }

  async get(id: ID): Promise<Task | null> {
    const db = await this.connection();
    const row = await db.getFirstAsync<TaskRow>('SELECT * FROM tasks WHERE id=?', [id]);
    return row ? (await this.hydrate([row], db))[0] ?? null : null;
  }

  private async queue(db: DatabaseAdapter, task: Task, operation: 'upsert' | 'delete'): Promise<void> {
    const at = this.clock();
    const queueId = this.uuid();
    await db.runAsync(`INSERT INTO sync_queue(id,entity,entity_id,operation,payload,attempts,next_attempt_at,created_at)
      VALUES(?,?,?,?,?,0,?,?) ON CONFLICT(entity,entity_id) DO UPDATE SET id=excluded.id,operation=excluded.operation,payload=excluded.payload,next_attempt_at=excluded.next_attempt_at`,
    [queueId, 'task', task.id, operation, JSON.stringify(task), at, at]);
  }

  private async saveTagsAndSubtasks(db: DatabaseAdapter, task: Task): Promise<void> {
    await db.runAsync('DELETE FROM task_tags WHERE task_id=?', [task.id]);
    for (const name of [...new Set(task.tags)]) {
      const tagId = this.uuid();
      await db.runAsync('INSERT INTO tags(id,user_id,name) VALUES(?,?,?) ON CONFLICT(user_id,name) DO NOTHING', [tagId, task.userId, name]);
      const tag = await db.getFirstAsync<{ id: string }>('SELECT id FROM tags WHERE user_id=? AND name=?', [task.userId, name]);
      if (tag) await db.runAsync('INSERT OR IGNORE INTO task_tags(task_id,tag_id) VALUES(?,?)', [task.id, tag.id]);
    }
    await db.runAsync('DELETE FROM subtasks WHERE task_id=?', [task.id]);
    for (const [index, item] of task.subtasks.entries()) {
      await db.runAsync('INSERT INTO subtasks(id,task_id,title,completed,position) VALUES(?,?,?,?,?)', [item.id, task.id, item.title, item.completed ? 1 : 0, index]);
    }
  }

  async create(userId: ID, input: TaskInput): Promise<Task> {
    const valid = taskSchema.parse(input);
    const db = await this.connection();
    const at = this.clock();
    const task: Task = {
      id: this.uuid(), userId, title: valid.title, description: input.description?.trim() ?? '',
      priority: input.priority ?? 'medium', status: input.status ?? 'todo', dueDate: input.dueDate ?? null,
      dueTime: input.dueTime ?? null, categoryId: input.categoryId ?? null, projectId: input.projectId ?? null,
      createdAt: at, updatedAt: at, completedAt: input.status === 'completed' ? at : null,
      archived: input.archived ?? false, position: Date.now(), deletedAt: null, syncStatus: 'pending', version: 1,
      tags: [...new Set(input.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [])],
      subtasks: (input.subtasks ?? []).filter((item) => item.title.trim()).map((item, position) => ({ id: item.id ?? this.uuid(), taskId: '', title: item.title.trim(), completed: item.completed ?? false, position })),
    };
    task.subtasks.forEach((item) => { item.taskId = task.id; });
    await db.withTransactionAsync(async () => {
      await db.runAsync(`INSERT INTO tasks(id,user_id,title,description,priority,status,due_date,due_time,category_id,project_id,created_at,updated_at,completed_at,archived,position,deleted_at,sync_status,version)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [task.id, userId, task.title, task.description, task.priority, task.status, task.dueDate, task.dueTime, task.categoryId, task.projectId, task.createdAt, task.updatedAt, task.completedAt, task.archived ? 1 : 0, task.position, null, 'pending', 1]);
      await this.saveTagsAndSubtasks(db, task);
      await this.queue(db, task, 'upsert');
    });
    return task;
  }

  async update(id: ID, input: Partial<TaskInput>): Promise<Task> {
    const current = await this.get(id);
    if (!current || current.deletedAt) throw new Error('Task not found');
    taskSchema.parse({ ...current, ...input });
    const at = this.clock();
    const status = input.status ?? current.status;
    const next: Task = {
      ...current, ...input, title: input.title?.trim() ?? current.title,
      description: input.description?.trim() ?? current.description, status,
      tags: input.tags ?? current.tags,
      subtasks: (input.subtasks ?? current.subtasks).map((item, position) => ({ ...item, id: item.id ?? this.uuid(), taskId: id, title: item.title.trim(), completed: item.completed ?? false, position })),
      completedAt: status === 'completed' ? (current.completedAt ?? at) : null,
      updatedAt: at, syncStatus: 'pending', version: current.version + 1,
    };
    const db = await this.connection();
    await db.withTransactionAsync(async () => {
      await db.runAsync(`UPDATE tasks SET title=?,description=?,priority=?,status=?,due_date=?,due_time=?,category_id=?,project_id=?,completed_at=?,archived=?,updated_at=?,sync_status='pending',version=? WHERE id=? AND deleted_at IS NULL`,
        [next.title, next.description, next.priority, next.status, next.dueDate, next.dueTime, next.categoryId, next.projectId, next.completedAt, next.archived ? 1 : 0, at, next.version, id]);
      await this.saveTagsAndSubtasks(db, next);
      await this.queue(db, next, 'upsert');
    });
    return next;
  }

  async setCompleted(id: ID, completed: boolean): Promise<Task> {
    return this.update(id, { status: completed ? 'completed' : 'todo' });
  }

  async remove(id: ID): Promise<void> {
    const task = await this.get(id);
    if (!task) return;
    const at = this.clock();
    const tombstone = { ...task, deletedAt: at, updatedAt: at, syncStatus: 'pending' as const, version: task.version + 1 };
    const db = await this.connection();
    await db.withTransactionAsync(async () => {
      await db.runAsync("UPDATE tasks SET deleted_at=?,updated_at=?,sync_status='pending',version=? WHERE id=?", [at, at, tombstone.version, id]);
      await this.queue(db, tombstone, 'delete');
    });
  }

  async duplicate(id: ID): Promise<Task> {
    const task = await this.get(id);
    if (!task) throw new Error('Task not found');
    return this.create(task.userId, { ...task, title: `${task.title} (copy)`, status: 'todo', subtasks: task.subtasks.map(({ title }) => ({ title })) });
  }

  async reorder(userId: ID, orderedIds: ID[]): Promise<void> {
    const db = await this.connection();
    await db.withTransactionAsync(async () => {
      for (const [position, id] of orderedIds.entries()) {
        await db.runAsync("UPDATE tasks SET position=?,updated_at=?,sync_status='pending',version=version+1 WHERE id=? AND user_id=?", [position, this.clock(), id, userId]);
      }
    });
  }

  async pendingOperations(limit = 50): Promise<SyncOperation[]> {
    const db = await this.connection();
    const rows = await db.getAllAsync<{ id: string; entity: SyncOperation['entity']; entity_id: string; operation: SyncOperation['operation']; payload: string; attempts: number; next_attempt_at: string; created_at: string }>(
      "SELECT * FROM sync_queue WHERE next_attempt_at<=? AND entity='task' ORDER BY created_at LIMIT ?", [this.clock(), limit]);
    return rows.map((row) => ({ id: row.id, entity: row.entity, entityId: row.entity_id, operation: row.operation, payload: row.payload, attempts: row.attempts, nextAttemptAt: row.next_attempt_at, createdAt: row.created_at }));
  }

  async markSynced(id: ID, version: number): Promise<void> {
    const db = await this.connection();
    await db.withTransactionAsync(async () => {
      const current = await db.getFirstAsync<{ version: number }>('SELECT version FROM tasks WHERE id=?', [id]);
      if (!current || current.version > version) return;
      await db.runAsync("UPDATE tasks SET sync_status='synced',version=? WHERE id=?", [version, id]);
      await db.runAsync('DELETE FROM sync_queue WHERE entity=? AND entity_id=?', ['task', id]);
    });
  }
}
