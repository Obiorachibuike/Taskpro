import { createSlice,type PayloadAction } from '@reduxjs/toolkit';
import type { ThemeMode } from '../../types';
interface UiState{theme:ThemeMode;haptics:boolean;notificationPreferences:{reminders:boolean;deadlines:boolean;completion:boolean}}
const initialState:UiState={theme:'system',haptics:true,notificationPreferences:{reminders:true,deadlines:true,completion:true}};
const slice=createSlice({name:'ui',initialState,reducers:{setTheme(state,action:PayloadAction<ThemeMode>){state.theme=action.payload;},setHaptics(state,action:PayloadAction<boolean>){state.haptics=action.payload;},setNotificationPreference(state,action:PayloadAction<{key:keyof UiState['notificationPreferences'];value:boolean}>){state.notificationPreferences[action.payload.key]=action.payload.value;}}});
export const {setTheme,setHaptics,setNotificationPreference}=slice.actions;export default slice.reducer;
