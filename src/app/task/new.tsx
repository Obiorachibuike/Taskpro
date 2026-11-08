import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../components/common/Screen';
import { Header } from '../../components/common/Header';
import { TaskForm } from '../../components/task/TaskForm';
export default function NewTask(){const{date}=useLocalSearchParams<{date?:string}>();return <Screen scroll header={<Header title="New task" subtitle="Turn your next step into a plan" back/>} contentStyle={{paddingTop:4}}><TaskForm initialDate={date}/></Screen>;}
