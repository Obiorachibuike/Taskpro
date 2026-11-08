import React,{useState} from 'react';
import { Text } from 'react-native';
import { Screen } from '../components/common/Screen';
import { Header } from '../components/common/Header';
import { TextField } from '../components/common/TextField';
import { Button } from '../components/common/Button';
import { useAppDispatch,useAppSelector } from '../hooks/store';
import { saveProfile } from '../store/slices/authSlice';
import { useTheme } from '../theme';
export default function Profile(){const user=useAppSelector(s=>s.auth.user);const[name,setName]=useState(user?.name??'');const dispatch=useAppDispatch();const{colors}=useTheme();const[saved,setSaved]=useState(false);return <Screen header={<Header title="Profile" back/>} contentStyle={{gap:18,paddingTop:30}}><TextField label="Display name" value={name} onChangeText={setName}/><TextField label="Email" value={user?.email} editable={false}/><Text style={{color:colors.secondary,fontSize:13}}>{user?.email==='local@taskpro.device'?'Local profile · data is isolated to this device.':'Authenticated account · secure session stored in device secure storage.'}</Text>{saved?<Text style={{color:colors.success}}>Profile updated.</Text>:null}<Button title="Save profile" disabled={!name.trim()} onPress={()=>void dispatch(saveProfile(name.trim())).unwrap().then(()=>setSaved(true))}/></Screen>;}
