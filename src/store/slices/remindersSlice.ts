import { createAsyncThunk,createSlice } from '@reduxjs/toolkit';
import { ReminderRepository } from '../../database/repositories/reminderRepository';
import { requestNotificationPermissions } from '../../services/notifications/notificationService';
import type { Reminder } from '../../types';
const repository=new ReminderRepository();
export const loadReminders=createAsyncThunk('reminders/load',async(userId:string)=>repository.list(userId));
export const enableNotifications=createAsyncThunk('reminders/permission',async()=>requestNotificationPermissions());
export default createSlice({name:'reminders',initialState:{items:[] as Reminder[],permission:false},reducers:{},extraReducers:builder=>{builder.addCase(loadReminders.fulfilled,(s,a)=>{s.items=a.payload;}).addCase(enableNotifications.fulfilled,(s,a)=>{s.permission=a.payload;});}}).reducer;
