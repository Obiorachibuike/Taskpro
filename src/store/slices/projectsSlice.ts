import { createAsyncThunk,createSlice } from '@reduxjs/toolkit';
import { ProjectRepository } from '../../database/repositories/projectRepository';
import type { Project } from '../../types';
const repository=new ProjectRepository();
export const loadProjects=createAsyncThunk('projects/load',async(userId:string)=>repository.list(userId));
export const createProject=createAsyncThunk('projects/create',async({userId,input}:{userId:string;input:{name:string;description?:string;color:string;icon:string}})=>repository.create(userId,input));
export const updateProject=createAsyncThunk('projects/update',async({id,input}:{id:string;input:Partial<{name:string;description:string;color:string;icon:string}>})=>repository.update(id,input));
export const deleteProject=createAsyncThunk('projects/delete',async(id:string)=>{await repository.remove(id);return id;});
export default createSlice({name:'projects',initialState:{items:[] as Project[],loading:false,error:null as string|null},reducers:{},extraReducers:builder=>{builder.addCase(loadProjects.fulfilled,(s,a)=>{s.items=a.payload;s.loading=false;}).addCase(loadProjects.pending,s=>{s.loading=true;}).addCase(createProject.fulfilled,(s,a)=>{s.items.unshift(a.payload);}).addCase(updateProject.fulfilled,(s,a)=>{const i=s.items.findIndex(x=>x.id===a.payload.id);if(i>=0)s.items[i]=a.payload;}).addCase(deleteProject.fulfilled,(s,a)=>{s.items=s.items.filter(x=>x.id!==a.payload);});for(const t of [loadProjects,createProject,updateProject,deleteProject])builder.addCase(t.rejected,(s,a)=>{s.loading=false;s.error=a.error.message??'Project operation failed';});}}).reducer;
