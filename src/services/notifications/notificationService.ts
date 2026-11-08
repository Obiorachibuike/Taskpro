import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ReminderRepository } from '../../database/repositories/reminderRepository';
import type { Task } from '../../types';
import { combineDateTime } from '../../utils/date';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true }) });
const repository=new ReminderRepository();
export async function requestNotificationPermissions():Promise<boolean>{const current=await Notifications.getPermissionsAsync();if(current.granted)return true;return (await Notifications.requestPermissionsAsync()).granted;}
export async function scheduleTaskReminder(task:Task,customDate?:Date):Promise<string|null>{
  if(task.deletedAt||task.status==='completed')return null;
  const date=customDate??combineDateTime(task.dueDate,task.dueTime);if(!date||date.getTime()<=Date.now())return null;
  if(!await requestNotificationPermissions())return null;
  if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('reminders',{name:'Task reminders',importance:Notifications.AndroidImportance.HIGH});
  const existing=await repository.cancel(task.id);for(const item of existing)if(item.notificationId)await Notifications.cancelScheduledNotificationAsync(item.notificationId).catch(()=>undefined);
  const trigger:Notifications.DateTriggerInput={type:Notifications.SchedulableTriggerInputTypes.DATE,date,channelId:'reminders'};
  const notificationId=await Notifications.scheduleNotificationAsync({content:{title:task.title,body:task.description||'Task reminder',data:{taskId:task.id},sound:true},trigger});
  await repository.replace(task.id,task.userId,date.toISOString(),notificationId);return notificationId;
}
export async function scheduleUpcomingDeadline(task:Task):Promise<string|null>{
  const due=combineDateTime(task.dueDate,task.dueTime);
  if(!due||task.status==='completed')return null;
  const date=new Date(due.getTime()-24*60*60*1000);
  if(date.getTime()<=Date.now()||!await requestNotificationPermissions())return null;
  const notificationId=await Notifications.scheduleNotificationAsync({content:{title:'Upcoming deadline',body:`${task.title} is due tomorrow`,data:{taskId:task.id},sound:true},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date,channelId:'reminders'}});
  await repository.add(task.id,task.userId,date.toISOString(),notificationId);
  return notificationId;
}
export async function cancelTaskReminder(taskId:string):Promise<void>{const reminders=await repository.cancel(taskId);await Promise.all(reminders.map((item)=>item.notificationId?Notifications.cancelScheduledNotificationAsync(item.notificationId).catch(()=>undefined):Promise.resolve()));}
export async function notifyTaskCompleted(task:Task):Promise<void>{await Notifications.scheduleNotificationAsync({content:{title:'Task completed 🎉',body:task.title,data:{taskId:task.id}},trigger:null});}
export async function registerPushToken():Promise<string|null>{if(!await requestNotificationPermissions())return null;try{return (await Notifications.getExpoPushTokenAsync()).data;}catch{return null;}}
