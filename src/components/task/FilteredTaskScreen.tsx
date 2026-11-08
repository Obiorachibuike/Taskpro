import React from 'react';
import { View } from 'react-native';
import { Screen } from '../common/Screen';
import { Header } from '../common/Header';
import { TaskList } from './TaskList';
import { FAB } from '../common/FAB';
import { useAppSelector } from '../../hooks/store';
import type { TaskFilters } from '../../types';
import { localDateKey } from '../../utils/date';
export function FilteredTaskScreen({title,filters}:{title:string;filters:TaskFilters}){const tasks=useAppSelector(s=>s.tasks.items);const filtered=tasks.filter(task=>{if(task.deletedAt||task.archived)return false;if(filters.due==='completed')return task.status==='completed';if(filters.due==='today')return task.dueDate===localDateKey();if(filters.due==='upcoming')return task.dueDate&&task.dueDate>localDateKey()&&task.status!=='completed';return true;});return <View style={{flex:1}}><Screen contentStyle={{padding:0}} header={<Header title={title} subtitle={`${filtered.length} tasks`} back/>}><View/></Screen><View style={{position:'absolute',top:66,bottom:0,left:0,right:0}}><TaskList tasks={filtered}/></View><FAB/></View>;}
