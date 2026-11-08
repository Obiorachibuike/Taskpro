import * as Crypto from 'expo-crypto';
import { getDatabase, type DatabaseAdapter } from '../sqlite';
import { nowIso } from '../../utils/date';
import { projectSchema } from '../../utils/validation';
import type { ID, Project } from '../../types';

interface ProjectRow { id: string; user_id: string; name: string; description: string; color: string; icon: string; created_at: string; updated_at: string; deleted_at: string | null; sync_status: Project['syncStatus']; version: number }
const map = (row: ProjectRow): Project => ({ id: row.id, userId: row.user_id, name: row.name, description: row.description, color: row.color, icon: row.icon, createdAt: row.created_at, updatedAt: row.updated_at, deletedAt: row.deleted_at, syncStatus: row.sync_status, version: row.version });

export class ProjectRepository {
  constructor(private readonly db?: DatabaseAdapter, private readonly uuid: () => string = () => Crypto.randomUUID(), private readonly clock = nowIso) {}
  private async connection() { return this.db ?? getDatabase(); }

  async list(userId: ID): Promise<Project[]> {
    const db = await this.connection();
    return (await db.getAllAsync<ProjectRow>('SELECT * FROM projects WHERE user_id=? AND deleted_at IS NULL ORDER BY created_at DESC', [userId])).map(map);
  }
  async get(id: ID): Promise<Project | null> {
    const db = await this.connection();
    const row = await db.getFirstAsync<ProjectRow>('SELECT * FROM projects WHERE id=? AND deleted_at IS NULL', [id]);
    return row ? map(row) : null;
  }
  async create(userId: ID, input: { name: string; description?: string; color: string; icon: string }): Promise<Project> {
    const value = projectSchema.parse({ ...input, description: input.description ?? '' });
    const db = await this.connection(); const at = this.clock();
    const project: Project = { id: this.uuid(), userId, ...value, createdAt: at, updatedAt: at, deletedAt: null, syncStatus: 'pending', version: 1 };
    await db.withTransactionAsync(async () => {
      await db.runAsync('INSERT INTO projects(id,user_id,name,description,color,icon,created_at,updated_at,deleted_at,sync_status,version) VALUES(?,?,?,?,?,?,?,?,?,?,?)', [project.id,userId,project.name,project.description,project.color,project.icon,at,at,null,'pending',1]);
      await db.runAsync('INSERT INTO sync_queue(id,entity,entity_id,operation,payload,attempts,next_attempt_at,created_at) VALUES(?,?,?,?,?,0,?,?)', [this.uuid(),'project',project.id,'upsert',JSON.stringify(project),at,at]);
    });
    return project;
  }
  async update(id: ID, input: Partial<{ name: string; description: string; color: string; icon: string }>): Promise<Project> {
    const current = await this.get(id); if (!current) throw new Error('Project not found');
    const value = projectSchema.parse({ ...current, ...input }); const project = { ...current, ...value, updatedAt: this.clock(), version: current.version + 1, syncStatus: 'pending' as const };
    const db = await this.connection();
    await db.withTransactionAsync(async () => {
      await db.runAsync("UPDATE projects SET name=?,description=?,color=?,icon=?,updated_at=?,sync_status='pending',version=? WHERE id=?", [project.name,project.description,project.color,project.icon,project.updatedAt,project.version,id]);
      await db.runAsync("INSERT INTO sync_queue(id,entity,entity_id,operation,payload,attempts,next_attempt_at,created_at) VALUES(?,?,?,?,?,0,?,?) ON CONFLICT(entity,entity_id) DO UPDATE SET id=excluded.id,payload=excluded.payload,operation='upsert',next_attempt_at=excluded.next_attempt_at", [this.uuid(),'project',id,'upsert',JSON.stringify(project),project.updatedAt,project.updatedAt]);
    });
    return project;
  }
  async remove(id: ID): Promise<void> {
    const current = await this.get(id); if (!current) return;
    const db = await this.connection(); const at = this.clock(); const project = { ...current, deletedAt: at, updatedAt: at, version: current.version + 1 };
    await db.withTransactionAsync(async () => {
      await db.runAsync('UPDATE tasks SET project_id=NULL WHERE project_id=?', [id]);
      await db.runAsync("UPDATE projects SET deleted_at=?,updated_at=?,version=?,sync_status='pending' WHERE id=?", [at,at,project.version,id]);
      await db.runAsync("INSERT INTO sync_queue(id,entity,entity_id,operation,payload,attempts,next_attempt_at,created_at) VALUES(?,?,?,?,?,0,?,?) ON CONFLICT(entity,entity_id) DO UPDATE SET id=excluded.id,payload=excluded.payload,operation='delete',next_attempt_at=excluded.next_attempt_at", [this.uuid(),'project',id,'delete',JSON.stringify(project),at,at]);
    });
  }
}
