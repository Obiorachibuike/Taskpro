import React,{useState} from 'react';
import { Alert,Pressable,Text,View } from 'react-native';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { Header } from '../../components/common/Header';
import { TaskList } from '../../components/task/TaskList';
import { ProjectEditor } from '../../components/modals/ProjectEditor';
import { useAppDispatch,useAppSelector } from '../../hooks/store';
import { loadTasks } from '../../store/slices/tasksSlice';
import { deleteProject,updateProject } from '../../store/slices/projectsSlice';
export default function ProjectDetails(){const{id}=useLocalSearchParams<{id:string}>();const router=useRouter();const dispatch=useAppDispatch();const project=useAppSelector(s=>s.projects.items.find(p=>p.id===id));const tasks=useAppSelector(s=>s.tasks.items.filter(t=>t.projectId===id&&!t.deletedAt));const[edit,setEdit]=useState(false);const userId=useAppSelector(s=>s.auth.user?.id);if(!project)return <Screen header={<Header title="Project" back/>}><Text>Project not found.</Text></Screen>;return <View style={{flex:1}}><Screen contentStyle={{padding:0}} header={<Header title={project.name} subtitle={`${tasks.filter(t=>t.status==='completed').length}/${tasks.length} completed`} back right={<Pressable accessibilityLabel="Edit project" onPress={()=>setEdit(true)}><Ionicons name="create-outline" size={24}/></Pressable>}/>}><Text style={{paddingHorizontal:20,paddingBottom:12}}>{project.description}</Text><Pressable accessibilityLabel="Delete project" onPress={()=>Alert.alert('Delete project?','Tasks will be kept but unassigned from this project.',[{text:'Cancel'},{text:'Delete',style:'destructive',onPress:()=>{void dispatch(deleteProject(project.id)).unwrap().then(()=>{if(userId)return dispatch(loadTasks({userId}));});router.back();}}])} style={{alignSelf:'flex-end',paddingHorizontal:20}}><Text>Delete project</Text></Pressable></Screen><View style={{position:'absolute',top:145,bottom:0,left:0,right:0}}><TaskList tasks={tasks}/></View><ProjectEditor visible={edit} project={project} onClose={()=>setEdit(false)} onSave={input=>{void dispatch(updateProject({id:project.id,input})).unwrap().then(()=>setEdit(false));}}/></View>;}
