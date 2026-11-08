import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { User } from '../../types';
import { localSession, login, logout, register, updateProfile } from '../../features/authentication/authService';
import { credentialsSchema } from '../../utils/validation';

export const bootstrapAuth=createAsyncThunk('auth/bootstrap',async()=>localSession());
export const signIn=createAsyncThunk('auth/signIn',async({email,password}:{email:string;password:string})=>{credentialsSchema.parse({email,password});return login(email,password);});
export const signUp=createAsyncThunk('auth/signUp',async({name,email,password}:{name:string;email:string;password:string})=>{credentialsSchema.parse({name,email,password});return register(name,email,password);});
export const signOut=createAsyncThunk('auth/signOut',async()=>{await logout();return localSession();});
export const saveProfile=createAsyncThunk('auth/profile',async(name:string)=>updateProfile(name));
interface State{user:User|null;token:string|null;loading:boolean;error:string|null;onboarded:boolean}
const initialState:State={user:null,token:null,loading:true,error:null,onboarded:false};
const slice=createSlice({name:'auth',initialState,reducers:{completeOnboarding(state){state.onboarded=true;},clearAuthError(state){state.error=null;}},extraReducers:(builder)=>{
  builder.addCase(bootstrapAuth.pending,(state)=>{state.loading=true;}).addCase(bootstrapAuth.fulfilled,(state,action)=>{state.user=action.payload.user;state.token=action.payload.token;state.loading=false;}).addCase(bootstrapAuth.rejected,(state,action)=>{state.loading=false;state.error=action.error.message??'Initialization failed';});
  for(const thunk of [signIn,signUp,signOut,saveProfile]){builder.addCase(thunk.pending,(state)=>{state.loading=true;state.error=null;}).addCase(thunk.fulfilled,(state,action)=>{state.user=action.payload.user;state.token=action.payload.token;state.loading=false;}).addCase(thunk.rejected,(state,action)=>{state.loading=false;state.error=action.error.message??'Authentication failed';});}
}});
export const {completeOnboarding,clearAuthError}=slice.actions;
export default slice.reducer;
