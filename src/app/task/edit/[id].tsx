import React from 'react';
import { ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../components/common/Screen';
import { Header } from '../../../components/common/Header';
import { TaskForm } from '../../../components/task/TaskForm';
import { useAppSelector } from '../../../hooks/store';
export default function EditTask(){const{id}=useLocalSearchParams<{id:string}>();const task=useAppSelector(s=>s.tasks.items.find(t=>t.id===id));return <Screen scroll header={<Header title="Edit task" back/>} contentStyle={{paddingTop:4}}>{task?<TaskForm task={task}/>:<ActivityIndicator/>}</Screen>;}
