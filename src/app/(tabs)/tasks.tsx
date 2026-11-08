import React from 'react';
import { Pressable,ScrollView,StyleSheet,Text,View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/common/Screen';
import { Header } from '../../components/common/Header';
import { TextField } from '../../components/common/TextField';
import { TaskList } from '../../components/task/TaskList';
import { FAB } from '../../components/common/FAB';
import { DraggableTaskList } from '../../components/task/DraggableTaskList';
import { useAppDispatch,useAppSelector } from '../../hooks/store';
import { selectFilteredTasks } from '../../store/selectors/taskSelectors';
import { resetFilters,setFilters } from '../../store/slices/tasksSlice';
import { useTheme } from '../../theme';
export default function Tasks(){const{colors}=useTheme();const dispatch=useAppDispatch();const router=useRouter();const tasks=useAppSelector(selectFilteredTasks);const filters=useAppSelector(s=>s.tasks.filters);const active=tasks.filter(t=>t.status!=='completed').length;return <View style={{flex:1}}><Screen contentStyle={{padding:0}} header={<Header title="My tasks" subtitle={`${active} active · ${tasks.length} shown`} right={<Pressable accessibilityLabel="Search tasks" onPress={()=>router.push('/search')}><Ionicons name="search" size={24} color={colors.text}/></Pressable>}/>}><View style={styles.search}><TextField label="Search tasks" value={filters.query??''} onChangeText={query=>dispatch(setFilters({query}))} placeholder="Title, description, or #tag"/></View><View style={styles.filters}>{([['all','All'],['today','Today'],['upcoming','Upcoming'],['completed','Completed']] as const).map(([value,label])=>{const selected=value==='all'?!filters.due:filters.due===value;return <Pressable key={value} onPress={()=>{dispatch(resetFilters());if(value!=='all')dispatch(setFilters({due:value}));}} style={[styles.filter,{backgroundColor:selected?colors.primary:colors.surface}]}><Text style={{color:selected?'#fff':colors.secondary,fontWeight:'600'}}>{label}</Text></Pressable>;})}<Pressable accessibilityLabel="Task filters" onPress={()=>router.push('/tasks/filters')} style={[styles.sort,{backgroundColor:colors.surface}]}><Ionicons name="options-outline" size={20} color={colors.primary}/></Pressable></View></Screen><View style={styles.list}>{filters.sort==='position'?<ScrollView><DraggableTaskList tasks={tasks}/></ScrollView>:<TaskList tasks={tasks}/>}</View><FAB/></View>;}
const styles=StyleSheet.create({search:{paddingHorizontal:20},filters:{padding:20,paddingBottom:10,flexDirection:'row',gap:7,alignItems:'center',flexWrap:'wrap'},filter:{paddingHorizontal:14,paddingVertical:9,borderRadius:12},sort:{padding:9,borderRadius:12},list:{position:'absolute',top:246,bottom:0,left:0,right:0}});
