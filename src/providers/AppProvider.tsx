import React,{type PropsWithChildren,useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { persistor,store } from '../store';
import { useAppDispatch,useAppSelector } from '../hooks/store';
import { bootstrapAuth,completeOnboarding } from '../store/slices/authSlice';
import { loadTasks } from '../store/slices/tasksSlice';
import { loadProjects } from '../store/slices/projectsSlice';
import { loadCategories } from '../store/slices/categoriesSlice';
import { loadReminders } from '../store/slices/remindersSlice';
import { getPendingCount } from '../store/slices/syncSlice';
import { startConnectivityMonitoring } from '../services/connectivity/connectivityService';
import { registerBackgroundSync } from '../services/background/backgroundSync';
function Bootstrap({children}:PropsWithChildren){const dispatch=useAppDispatch();const router=useRouter();const userId=useAppSelector(s=>s.auth.user?.id);useEffect(()=>{void dispatch(bootstrapAuth());void AsyncStorage.getItem('taskpro.onboarded').then(value=>{if(value)dispatch(completeOnboarding());});const stop=startConnectivityMonitoring();void registerBackgroundSync().catch(()=>undefined);return stop;},[dispatch]);useEffect(()=>{if(userId){void dispatch(loadTasks({userId}));void dispatch(loadProjects(userId));void dispatch(loadCategories(userId));void dispatch(loadReminders(userId));void dispatch(getPendingCount());}},[dispatch,userId]);useEffect(()=>{const subscription=Notifications.addNotificationResponseReceivedListener(response=>{const id=response.notification.request.content.data.taskId;if(typeof id==='string')router.push(`/task/${id}`);});return()=>subscription.remove();},[router]);return children;}
export function AppProvider({children}:PropsWithChildren){return <Provider store={store}><PersistGate loading={null} persistor={persistor}><Bootstrap>{children}</Bootstrap></PersistGate></Provider>;}
