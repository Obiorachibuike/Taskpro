import { createSlice,type PayloadAction } from '@reduxjs/toolkit';
const slice=createSlice({name:'connectivity',initialState:{online:true},reducers:{setOnline(state,action:PayloadAction<boolean>){state.online=action.payload;}}});
export const {setOnline}=slice.actions;export default slice.reducer;
