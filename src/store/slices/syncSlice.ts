import { createAsyncThunk,createSlice } from '@reduxjs/toolkit';
import Constants from 'expo-constants';
import { SyncRepository } from '../../database/repositories/syncRepository';
import { SyncEngine,type SyncResult } from '../../services/synchronization/engine';
import { HttpSyncApi } from '../../services/synchronization/api';
export const synchronize=createAsyncThunk('sync/run',async({userId,token}:{userId:string;token:string|null},{rejectWithValue})=>{const apiUrl=Constants.expoConfig?.extra?.apiUrl as string|undefined;if(!apiUrl||!token)return rejectWithValue('Configure a backend and sign in to synchronize.');const repository=new SyncRepository();const result=await new SyncEngine(repository,new HttpSyncApi(apiUrl,token)).synchronize(userId);return {...result,lastSync:new Date().toISOString()};});
export const getPendingCount=createAsyncThunk('sync/count',async()=>new SyncRepository().count());
interface State{status:'idle'|'syncing'|'success'|'error';pending:number;lastSync:string|null;error:string|null;result:SyncResult|null}
export default createSlice({name:'sync',initialState:{status:'idle',pending:0,lastSync:null,error:null,result:null} as State,reducers:{},extraReducers:builder=>{builder.addCase(synchronize.pending,s=>{s.status='syncing';s.error=null;}).addCase(synchronize.fulfilled,(s,a)=>{s.status='success';s.lastSync=a.payload.lastSync;s.result=a.payload;}).addCase(synchronize.rejected,(s,a)=>{s.status='error';s.error=String(a.payload??a.error.message??'Synchronization failed');}).addCase(getPendingCount.fulfilled,(s,a)=>{s.pending=a.payload;});}}).reducer;
