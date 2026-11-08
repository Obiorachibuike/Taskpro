import * as Crypto from 'expo-crypto';
import { getDatabase, type DatabaseAdapter } from '../sqlite';
import { nowIso } from '../../utils/date';
import { categorySchema } from '../../utils/validation';
import type { Category, ID } from '../../types';

export const DEFAULT_CATEGORIES = [
  ['Personal', '#8B5CF6'], ['Work', '#2563EB'], ['Education', '#0EA5E9'],
  ['Shopping', '#F59E0B'], ['Health', '#16A34A'], ['Finance', '#14B8A6'],
] as const;
interface Row { id: string; user_id: string; name: string; color: string; is_default: number; created_at: string; updated_at: string; deleted_at: string | null; sync_status: Category['syncStatus']; version: number }
const map = (r: Row): Category => ({ id:r.id,userId:r.user_id,name:r.name,color:r.color,isDefault:Boolean(r.is_default),createdAt:r.created_at,updatedAt:r.updated_at,deletedAt:r.deleted_at,syncStatus:r.sync_status,version:r.version });

export class CategoryRepository {
  constructor(private readonly db?: DatabaseAdapter, private readonly uuid: () => string = () => Crypto.randomUUID(), private readonly clock = nowIso) {}
  private async connection() { return this.db ?? getDatabase(); }
  async seedDefaults(userId: ID): Promise<void> {
    const db = await this.connection();
    await db.withTransactionAsync(async () => {
      for (const [name,color] of DEFAULT_CATEGORIES) {
        const existing = await db.getFirstAsync('SELECT id FROM categories WHERE user_id=? AND name=?', [userId,name]);
        if (!existing) { const at=this.clock(); await db.runAsync("INSERT INTO categories(id,user_id,name,color,is_default,created_at,updated_at,sync_status,version) VALUES(?,?,?,?,1,?,?,'synced',1)", [this.uuid(),userId,name,color,at,at]); }
      }
    });
  }
  async list(userId: ID): Promise<Category[]> { const db=await this.connection(); return (await db.getAllAsync<Row>('SELECT * FROM categories WHERE user_id=? AND deleted_at IS NULL ORDER BY is_default DESC,name', [userId])).map(map); }
  async create(userId: ID, input: {name:string;color:string}): Promise<Category> {
    const value=categorySchema.parse(input); const db=await this.connection(); const at=this.clock();
    const category:Category={id:this.uuid(),userId,...value,isDefault:false,createdAt:at,updatedAt:at,deletedAt:null,syncStatus:'pending',version:1};
    await db.withTransactionAsync(async()=>{ await db.runAsync('INSERT INTO categories(id,user_id,name,color,is_default,created_at,updated_at,sync_status,version) VALUES(?,?,?,?,0,?,?,?,1)',[category.id,userId,category.name,category.color,at,at,'pending']); await db.runAsync('INSERT INTO sync_queue(id,entity,entity_id,operation,payload,attempts,next_attempt_at,created_at) VALUES(?,?,?,?,?,0,?,?)',[this.uuid(),'category',category.id,'upsert',JSON.stringify(category),at,at]); });
    return category;
  }
  async update(id:ID,input:{name:string;color:string}):Promise<Category>{
    const db=await this.connection();const row=await db.getFirstAsync<Row>('SELECT * FROM categories WHERE id=? AND deleted_at IS NULL',[id]);if(!row)throw new Error('Category not found');const current=map(row);const value=categorySchema.parse(input);const next={...current,...value,updatedAt:this.clock(),version:current.version+1,syncStatus:'pending' as const};
    await db.withTransactionAsync(async()=>{await db.runAsync("UPDATE categories SET name=?,color=?,updated_at=?,version=?,sync_status='pending' WHERE id=?",[next.name,next.color,next.updatedAt,next.version,id]);await db.runAsync("INSERT INTO sync_queue(id,entity,entity_id,operation,payload,attempts,next_attempt_at,created_at) VALUES(?,?,?,?,?,0,?,?) ON CONFLICT(entity,entity_id) DO UPDATE SET id=excluded.id,payload=excluded.payload,operation='upsert',next_attempt_at=excluded.next_attempt_at",[this.uuid(),'category',id,'upsert',JSON.stringify(next),next.updatedAt,next.updatedAt]);});return next;
  }
  async remove(id:ID):Promise<void>{
    const db=await this.connection();const row=await db.getFirstAsync<Row>('SELECT * FROM categories WHERE id=? AND deleted_at IS NULL',[id]);if(!row)return;const current=map(row);if(current.isDefault)throw new Error('Default categories cannot be deleted');const at=this.clock();const next={...current,deletedAt:at,updatedAt:at,version:current.version+1};
    await db.withTransactionAsync(async()=>{await db.runAsync('UPDATE tasks SET category_id=NULL WHERE category_id=?',[id]);await db.runAsync("UPDATE categories SET deleted_at=?,updated_at=?,version=?,sync_status='pending' WHERE id=?",[at,at,next.version,id]);await db.runAsync("INSERT INTO sync_queue(id,entity,entity_id,operation,payload,attempts,next_attempt_at,created_at) VALUES(?,?,?,?,?,0,?,?) ON CONFLICT(entity,entity_id) DO UPDATE SET id=excluded.id,payload=excluded.payload,operation='delete',next_attempt_at=excluded.next_attempt_at",[this.uuid(),'category',id,'delete',JSON.stringify(next),at,at]);});
  }
}
