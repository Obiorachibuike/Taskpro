import * as Crypto from 'expo-crypto';
import { getDatabase, type DatabaseAdapter } from '../sqlite';
import type { RemoteRecord, SyncOperation } from '../../types';
import { nextRetryDate } from '../../services/synchronization/retry';

interface Row { id:string;entity:SyncOperation['entity'];entity_id:string;operation:SyncOperation['operation'];payload:string;attempts:number;next_attempt_at:string;created_at:string }
const map=(r:Row):SyncOperation=>({id:r.id,entity:r.entity,entityId:r.entity_id,operation:r.operation,payload:r.payload,attempts:r.attempts,nextAttemptAt:r.next_attempt_at,createdAt:r.created_at});
export class SyncRepository {
  constructor(private readonly db?:DatabaseAdapter){}
  private async connection(){return this.db??getDatabase();}
  async ready(limit=50,now=new Date().toISOString()):Promise<SyncOperation[]>{const db=await this.connection();return (await db.getAllAsync<Row>('SELECT * FROM sync_queue WHERE next_attempt_at<=? ORDER BY created_at LIMIT ?',[now,limit])).map(map);}
  async count():Promise<number>{const db=await this.connection();return (await db.getFirstAsync<{count:number}>('SELECT COUNT(*) AS count FROM sync_queue'))?.count??0;}
  async succeed(operation:SyncOperation,version:number):Promise<void>{const db=await this.connection();const table=operation.entity==='task'?'tasks':operation.entity==='project'?'projects':'categories';await db.withTransactionAsync(async()=>{const current=await db.getFirstAsync<{version:number}>(`SELECT version FROM ${table} WHERE id=?`,[operation.entityId]);if(!current||current.version>version)return;await db.runAsync(`UPDATE ${table} SET sync_status='synced',version=? WHERE id=?`,[version,operation.entityId]);await db.runAsync('DELETE FROM sync_queue WHERE id=?',[operation.id]);});}
  async fail(id:string,attempts:number,error:string):Promise<void>{const db=await this.connection();await db.withTransactionAsync(async()=>{await db.runAsync('UPDATE sync_queue SET attempts=?,next_attempt_at=? WHERE id=?',[attempts,nextRetryDate(attempts),id]);await db.runAsync('INSERT INTO sync_metadata(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at',[`error:${id}`,error.slice(0,500),new Date().toISOString()]);});}
  async markConflict(entity:string,id:string,remote?:RemoteRecord):Promise<void>{const db=await this.connection();const table=entity==='task'?'tasks':entity==='project'?'projects':'categories';await db.withTransactionAsync(async()=>{await db.runAsync(`UPDATE ${table} SET sync_status='conflict' WHERE id=?`,[id]);if(remote)await db.runAsync('INSERT INTO sync_metadata(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at',[`conflict:${entity}:${id}`,JSON.stringify(remote),new Date().toISOString()]);});}
  async resolveConflict(entity:'task'|'project'|'category',id:string,useRemote:boolean):Promise<void>{
    const db=await this.connection();
    const raw=await this.metadata(`conflict:${entity}:${id}`);
    if(!raw)throw new Error('Conflict snapshot not found');
    const remote=JSON.parse(raw) as RemoteRecord;
    if(useRemote){
      await this.applyRemote(remote);
      await db.runAsync('DELETE FROM sync_queue WHERE entity=? AND entity_id=?',[entity,id]);
    }else{
      const table=entity==='task'?'tasks':entity==='project'?'projects':'categories';
      const at=new Date().toISOString();
      const version=remote.version+1;
      await db.runAsync(`UPDATE ${table} SET sync_status='pending',version=?,updated_at=? WHERE id=?`,[version,at,id]);
      await db.runAsync("UPDATE sync_queue SET id=?,attempts=0,next_attempt_at=?,payload=(SELECT json_set(payload,'$.version',version,'$.updatedAt',updated_at,'$.syncStatus','pending') FROM "+table+" WHERE id=?) WHERE entity=? AND entity_id=?",[Crypto.randomUUID(),at,id,entity,id]);
    }
    await db.runAsync('DELETE FROM sync_metadata WHERE key=?',[`conflict:${entity}:${id}`]);
  }
  async getLocal(entity:string,id:string):Promise<RemoteRecord|null>{const db=await this.connection();const table=entity==='task'?'tasks':entity==='project'?'projects':'categories';const row=await db.getFirstAsync<Record<string,unknown>>(`SELECT * FROM ${table} WHERE id=?`,[id]);if(!row)return null;return{id:String(row.id),userId:String(row.user_id),createdAt:String(row.created_at),updatedAt:String(row.updated_at),deletedAt:row.deleted_at as string|null,syncStatus:row.sync_status as RemoteRecord['syncStatus'],version:Number(row.version),...row};}
  async applyRemote(record:RemoteRecord):Promise<void>{const db=await this.connection();const entity=String(record.entity??'task');
    if(entity==='project'||entity==='category'){
      if(entity==='project'){
        await db.runAsync(`INSERT INTO projects(id,user_id,name,description,color,icon,created_at,updated_at,deleted_at,sync_status,version) VALUES(?,?,?,?,?,?,?,?,?,'synced',?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at,deleted_at=excluded.deleted_at,sync_status='synced',version=excluded.version`,[record.id,record.userId,String(record.name??''),String(record.description??''),String(record.color??'#2563EB'),String(record.icon??'folder'),record.createdAt,record.updatedAt,record.deletedAt,record.version]);
      }else{
        await db.runAsync(`INSERT INTO categories(id,user_id,name,color,is_default,created_at,updated_at,deleted_at,sync_status,version) VALUES(?,?,?,?,0,?,?,?,'synced',?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,color=excluded.color,updated_at=excluded.updated_at,deleted_at=excluded.deleted_at,sync_status='synced',version=excluded.version`,[record.id,record.userId,String(record.name??''),String(record.color??'#2563EB'),record.createdAt,record.updatedAt,record.deletedAt,record.version]);
      }
      return;
    }
    if(entity!=='task')return;const tags=Array.isArray(record.tags)?record.tags:[];const subtasks=Array.isArray(record.subtasks)?record.subtasks:[];
    await db.withTransactionAsync(async()=>{await db.runAsync(`INSERT INTO tasks(id,user_id,title,description,priority,status,due_date,due_time,category_id,project_id,created_at,updated_at,completed_at,archived,position,deleted_at,sync_status,version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'synced',?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,description=excluded.description,priority=excluded.priority,status=excluded.status,due_date=excluded.due_date,due_time=excluded.due_time,category_id=excluded.category_id,project_id=excluded.project_id,updated_at=excluded.updated_at,completed_at=excluded.completed_at,archived=excluded.archived,deleted_at=excluded.deleted_at,sync_status='synced',version=excluded.version`,[record.id,record.userId,String(record.title??''),String(record.description??''),String(record.priority??'medium'),String(record.status??'todo'),record.dueDate as string|null,record.dueTime as string|null,record.categoryId as string|null,record.projectId as string|null,record.createdAt,record.updatedAt,record.completedAt as string|null,record.archived?1:0,Number(record.position??0),record.deletedAt,record.version]);await db.runAsync('DELETE FROM task_tags WHERE task_id=?',[record.id]);for(const name of tags){const tagId=globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}`;await db.runAsync('INSERT INTO tags(id,user_id,name) VALUES(?,?,?) ON CONFLICT(user_id,name) DO NOTHING',[tagId,record.userId,String(name)]);const tag=await db.getFirstAsync<{id:string}>('SELECT id FROM tags WHERE user_id=? AND name=?',[record.userId,String(name)]);if(tag)await db.runAsync('INSERT OR IGNORE INTO task_tags(task_id,tag_id) VALUES(?,?)',[record.id,tag.id]);}await db.runAsync('DELETE FROM subtasks WHERE task_id=?',[record.id]);for(const [index,value] of subtasks.entries()){const item=value as Record<string,unknown>;await db.runAsync('INSERT INTO subtasks(id,task_id,title,completed,position) VALUES(?,?,?,?,?)',[String(item.id),record.id,String(item.title),item.completed?1:0,index]);}});
  }
  async metadata(key:string):Promise<string|null>{const db=await this.connection();return (await db.getFirstAsync<{value:string}>('SELECT value FROM sync_metadata WHERE key=?',[key]))?.value??null;}
  async setMetadata(key:string,value:string):Promise<void>{const db=await this.connection();await db.runAsync('INSERT INTO sync_metadata(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at',[key,value,new Date().toISOString()]);}
}
