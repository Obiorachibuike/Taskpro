import React from 'react';
import { Alert,FlatList,RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import type { Task } from '../../types';
import { TaskCard } from './TaskCard';
import { EmptyState } from '../common/EmptyState';
import { useAppDispatch } from '../../hooks/store';
import { archiveTask,deleteTask,duplicateTask,toggleTask } from '../../store/slices/tasksSlice';
import { useTheme } from '../../theme';
export function TaskList({tasks,onRefresh,refreshing=false}:{tasks:Task[];onRefresh?:()=>void;refreshing?:boolean}){const dispatch=useAppDispatch();const router=useRouter();const{colors}=useTheme();return <FlatList data={tasks} keyExtractor={item=>item.id} contentContainerStyle={{padding:20,paddingBottom:110,flexGrow:1}} keyboardShouldPersistTaps="handled" initialNumToRender={12} maxToRenderPerBatch={12} windowSize={8} removeClippedSubviews refreshControl={onRefresh?<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary}/>:undefined} ListEmptyComponent={<EmptyState title="A clear day" message="No tasks match this view. Add a task and make progress, one step at a time." action="Create task" onAction={()=>router.push('/task/new')}/>} renderItem={({item})=><TaskCard task={item} onToggle={()=>void dispatch(toggleTask({task:item,completed:item.status!=='completed'}))} onDuplicate={()=>void dispatch(duplicateTask(item.id))} onArchive={()=>void dispatch(archiveTask({id:item.id,archived:!item.archived}))} onDelete={()=>Alert.alert('Delete task?',`“${item.title}” will be moved to pending deletion.`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>void dispatch(deleteTask(item.id))}])}/>}/>;}
