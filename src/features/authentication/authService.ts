import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { getDatabase } from '../../database/sqlite';
import type { User } from '../../types';

const SESSION_KEY = 'taskpro.session';
const LOCAL_USER_KEY = 'taskpro.local-user';
export interface AuthSession { user: User; token: string | null }

async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

export async function getSession(): Promise<AuthSession | null> {
  const value = await SecureStore.getItemAsync(SESSION_KEY);
  if (!value) return null;
  try { return JSON.parse(value) as AuthSession; } catch { await SecureStore.deleteItemAsync(SESSION_KEY); return null; }
}

export async function localSession(): Promise<AuthSession> {
  const existing = await getSession();
  if (existing) return existing;
  let id = await SecureStore.getItemAsync(LOCAL_USER_KEY);
  if (!id) { id = Crypto.randomUUID(); await SecureStore.setItemAsync(LOCAL_USER_KEY, id); }
  const user: User = { id, email: 'local@taskpro.device', name: 'Local user', createdAt: new Date().toISOString() };
  const db = await getDatabase();
  await db.runAsync('INSERT OR IGNORE INTO users(id,email,name,created_at) VALUES(?,?,?,?)', [user.id,user.email,user.name,user.createdAt]);
  const session = { user, token: null };
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  return session;
}

async function associateLocalData(previous: AuthSession | null, next: AuthSession): Promise<void> {
  if (!previous || previous.user.id === next.user.id) return;
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('INSERT OR IGNORE INTO users(id,email,name,created_at) VALUES(?,?,?,?)', [next.user.id,next.user.email,next.user.name,next.user.createdAt]);
    for (const table of ['tasks','projects','categories','tags','reminders']) await db.runAsync(`UPDATE ${table} SET user_id=? WHERE user_id=?`, [next.user.id,previous.user.id]);
    const operations = await db.getAllAsync<{id:string;payload:string}>('SELECT id,payload FROM sync_queue');
    for (const operation of operations) {
      const payload = JSON.parse(operation.payload) as Record<string,unknown>;
      if (payload.userId === previous.user.id) await db.runAsync('UPDATE sync_queue SET payload=? WHERE id=?', [JSON.stringify({...payload,userId:next.user.id}),operation.id]);
    }
  });
}

export async function register(name: string, email: string, password: string): Promise<AuthSession> {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (apiUrl) {
    const response = await fetch(`${apiUrl}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
    if (!response.ok) throw new Error((await response.json() as {error?:string}).error ?? 'Registration failed');
    const session = await response.json() as AuthSession;
    await associateLocalData(await getSession(), session);
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    return session;
  }
  const db = await getDatabase(); const id=Crypto.randomUUID(); const salt=Crypto.randomUUID(); const hash=await hashPassword(password,salt);
  const user:User={id,email:email.toLowerCase(),name,createdAt:new Date().toISOString()};
  await db.runAsync('INSERT INTO users(id,email,name,password_hash,password_salt,created_at) VALUES(?,?,?,?,?,?)',[id,user.email,name,hash,salt,user.createdAt]);
  const session={user,token:null};await SecureStore.setItemAsync(SESSION_KEY,JSON.stringify(session));return session;
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (apiUrl) {
    const response = await fetch(`${apiUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!response.ok) throw new Error('Invalid email or password');
    const session = await response.json() as AuthSession;await associateLocalData(await getSession(),session);await SecureStore.setItemAsync(SESSION_KEY,JSON.stringify(session));return session;
  }
  const db=await getDatabase();const row=await db.getFirstAsync<{id:string;email:string;name:string;password_hash:string;password_salt:string;created_at:string}>('SELECT * FROM users WHERE email=?',[email.toLowerCase()]);
  if(!row||await hashPassword(password,row.password_salt)!==row.password_hash)throw new Error('Invalid email or password');
  const session={user:{id:row.id,email:row.email,name:row.name,createdAt:row.created_at},token:null};await SecureStore.setItemAsync(SESSION_KEY,JSON.stringify(session));return session;
}

export async function requestPasswordReset(email:string):Promise<void>{const apiUrl=Constants.expoConfig?.extra?.apiUrl as string|undefined;if(apiUrl){await fetch(`${apiUrl}/auth/forgot-password`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});}}
export async function logout():Promise<void>{await SecureStore.deleteItemAsync(SESSION_KEY);}
export async function updateProfile(name:string):Promise<AuthSession>{const session=await getSession();if(!session)throw new Error('Not signed in');const db=await getDatabase();await db.runAsync('UPDATE users SET name=? WHERE id=?',[name,session.user.id]);const next={...session,user:{...session.user,name}};await SecureStore.setItemAsync(SESSION_KEY,JSON.stringify(next));return next;}
