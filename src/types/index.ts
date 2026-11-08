export type ID = string;
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type SyncStatus = 'synced' | 'pending' | 'conflict';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface SyncFields {
  id: ID;
  userId: ID;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  syncStatus: SyncStatus;
  version: number;
}

export interface Subtask {
  id: ID;
  taskId: ID;
  title: string;
  completed: boolean;
  position: number;
}

export interface Task extends SyncFields {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;
  dueTime: string | null;
  categoryId: ID | null;
  projectId: ID | null;
  completedAt: string | null;
  archived: boolean;
  position: number;
  tags: string[];
  subtasks: Subtask[];
}

export interface TaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  dueDate?: string | null;
  dueTime?: string | null;
  categoryId?: ID | null;
  projectId?: ID | null;
  tags?: string[];
  subtasks?: (Pick<Subtask, 'title'> & Partial<Pick<Subtask, 'id' | 'completed'>>)[];
  archived?: boolean;
}

export interface Project extends SyncFields {
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface Category extends SyncFields {
  name: string;
  color: string;
  isDefault: boolean;
}

export interface Reminder {
  id: ID;
  taskId: ID;
  userId: ID;
  remindAt: string;
  notificationId: string | null;
  createdAt: string;
}

export interface TaskFilters {
  query?: string;
  priority?: Priority;
  status?: TaskStatus;
  projectId?: ID;
  categoryId?: ID;
  due?: 'today' | 'upcoming' | 'overdue' | 'completed' | 'date';
  date?: string;
  includeArchived?: boolean;
  sort?: 'created' | 'priority' | 'deadline' | 'position';
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  today: number;
  upcoming: number;
  completion: number;
  weekly: { date: string; label: string; completed: number; total: number }[];
}

export interface User {
  id: ID;
  email: string;
  name: string;
  createdAt: string;
}

export interface SyncOperation {
  id: ID;
  entity: 'task' | 'project' | 'category';
  entityId: ID;
  operation: 'upsert' | 'delete';
  payload: string;
  attempts: number;
  nextAttemptAt: string;
  createdAt: string;
}

export interface RemoteRecord extends SyncFields {
  [key: string]: unknown;
}

export interface SyncPullResponse {
  records: RemoteRecord[];
  cursor: string | null;
}

export interface SyncApi {
  push(operation: SyncOperation): Promise<{ accepted: boolean; version: number }>;
  pull(userId: ID, cursor: string | null): Promise<SyncPullResponse>;
}

export type ConflictDecision =
  | { type: 'remote'; record: RemoteRecord }
  | { type: 'local'; record: RemoteRecord }
  | { type: 'conflict'; local: RemoteRecord; remote: RemoteRecord };
