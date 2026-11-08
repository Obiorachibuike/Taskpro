import React,{useState} from 'react';
import { View } from 'react-native';
import { Screen } from '../components/common/Screen';
import { Header } from '../components/common/Header';
import { TextField } from '../components/common/TextField';
import { TaskList } from '../components/task/TaskList';
import { useAppSelector } from '../hooks/store';
import { filterAndSortTasks } from '../store/selectors/taskSelectors';
export default function Search(){const[query,setQuery]=useState('');const tasks=useAppSelector(s=>s.tasks.items);const results=filterAndSortTasks(tasks,{query,sort:'deadline'});return <View style={{flex:1}}><Screen contentStyle={{paddingTop:0}} header={<Header title="Search" back/>}><TextField label="Search all tasks" value={query} onChangeText={setQuery} placeholder="Try “report” or “#errands”" autoFocus/></Screen><View style={{position:'absolute',top:155,bottom:0,left:0,right:0}}><TaskList tasks={query?results:[]}/></View></View>;}
