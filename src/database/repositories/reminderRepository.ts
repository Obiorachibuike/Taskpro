import * as Crypto from 'expo-crypto';
import { getDatabase, type DatabaseAdapter } from '../sqlite';
import type { ID, Reminder } from '../../types';

interface Row { id:string;task_id:string;user_id:string;remind_at:string;notification_id:string|null;created_at:string }
const map=(r:Row):Reminder=>({id:r.id,taskId:r.task_id,userId:r.user_id,remindAt:r.remind_at,notificationId:r.notification_id,createdAt:r.created_at});
export class ReminderRepository {
  constructor(private readonly db?:DatabaseAdapter,private readonly uuid:()=>string=()=>Crypto.randomUUID()){}
  private async connection(){return this.db??getDatabase();}
  async list(userId:ID):Promise<Reminder[]>{const db=await this.connection();return (await db.getAllAsync<Row>('SELECT * FROM reminders WHERE user_id=? ORDER BY remind_at',[userId])).map(map);}
  async add(taskId:ID,userId:ID,remindAt:string,notificationId:string|null):Promise<Reminder>{const db=await this.connection();const reminder:Reminder={id:this.uuid(),taskId,userId,remindAt,notificationId,createdAt:new Date().toISOString()};await db.runAsync('INSERT INTO reminders(id,task_id,user_id,remind_at,notification_id,created_at) VALUES(?,?,?,?,?,?)',[reminder.id,taskId,userId,remindAt,notificationId,reminder.createdAt]);return reminder;}
  async replace(taskId:ID,userId:ID,remindAt:string,notificationId:string|null):Promise<Reminder>{const db=await this.connection();const reminder:Reminder={id:this.uuid(),taskId,userId,remindAt,notificationId,createdAt:new Date().toISOString()};await db.withTransactionAsync(async()=>{await db.runAsync('DELETE FROM reminders WHERE task_id=?',[taskId]);await db.runAsync('INSERT INTO reminders(id,task_id,user_id,remind_at,notification_id,created_at) VALUES(?,?,?,?,?,?)',[reminder.id,taskId,userId,remindAt,notificationId,reminder.createdAt]);});return reminder;}
  async cancel(taskId:ID):Promise<Reminder[]>{const db=await this.connection();const rows=await db.getAllAsync<Row>('SELECT * FROM reminders WHERE task_id=?',[taskId]);await db.runAsync('DELETE FROM reminders WHERE task_id=?',[taskId]);return rows.map(map);}
}
