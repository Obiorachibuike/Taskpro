import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { getSession } from '../../features/authentication/authService';
import { synchronize } from '../../store/slices/syncSlice';
import { store } from '../../store';
export const BACKGROUND_SYNC_TASK='TASKPRO_BACKGROUND_SYNC';
TaskManager.defineTask(BACKGROUND_SYNC_TASK,async()=>{try{const session=await getSession();if(!session?.token)return BackgroundTask.BackgroundTaskResult.Success;const result=await store.dispatch(synchronize({userId:session.user.id,token:session.token}));return synchronize.fulfilled.match(result)?BackgroundTask.BackgroundTaskResult.Success:BackgroundTask.BackgroundTaskResult.Failed;}catch{return BackgroundTask.BackgroundTaskResult.Failed;}});
export async function registerBackgroundSync():Promise<void>{const status=await BackgroundTask.getStatusAsync();if(status!==BackgroundTask.BackgroundTaskStatus.Available)return;await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK,{minimumInterval:15});}
