import { createAsyncThunk,createSlice } from '@reduxjs/toolkit';
import { CategoryRepository } from '../../database/repositories/categoryRepository';
import type { Category } from '../../types';
const repository=new CategoryRepository();
export const loadCategories=createAsyncThunk('categories/load',async(userId:string)=>{await repository.seedDefaults(userId);return repository.list(userId);});
export const createCategory=createAsyncThunk('categories/create',async({userId,input}:{userId:string;input:{name:string;color:string}})=>repository.create(userId,input));
export const updateCategory=createAsyncThunk('categories/update',async({id,input}:{id:string;input:{name:string;color:string}})=>repository.update(id,input));
export const deleteCategory=createAsyncThunk('categories/delete',async(id:string)=>{await repository.remove(id);return id;});
export default createSlice({name:'categories',initialState:{items:[] as Category[],error:null as string|null},reducers:{},extraReducers:builder=>{builder.addCase(loadCategories.fulfilled,(s,a)=>{s.items=a.payload;}).addCase(createCategory.fulfilled,(s,a)=>{s.items.push(a.payload);}).addCase(updateCategory.fulfilled,(s,a)=>{const i=s.items.findIndex(x=>x.id===a.payload.id);if(i>=0)s.items[i]=a.payload;}).addCase(deleteCategory.fulfilled,(s,a)=>{s.items=s.items.filter(x=>x.id!==a.payload);});for(const t of [loadCategories,createCategory,updateCategory,deleteCategory])builder.addCase(t.rejected,(s,a)=>{s.error=a.error.message??'Category operation failed';});}}).reducer;
