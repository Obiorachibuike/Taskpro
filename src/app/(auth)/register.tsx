import React,{useState} from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/common/Screen';
import { Header } from '../../components/common/Header';
import { TextField } from '../../components/common/TextField';
import { Button } from '../../components/common/Button';
import { useAppDispatch,useAppSelector } from '../../hooks/store';
import { signUp } from '../../store/slices/authSlice';
import { useTheme } from '../../theme';
export default function Register(){const[name,setName]=useState('');const[email,setEmail]=useState('');const[password,setPassword]=useState('');const[error,setError]=useState('');const dispatch=useAppDispatch();const router=useRouter();const loading=useAppSelector(s=>s.auth.loading);const{colors}=useTheme();async function submit(){try{await dispatch(signUp({name,email,password})).unwrap();router.replace('/(tabs)');}catch(e){setError(e instanceof Error?e.message:'Registration failed');}}return <Screen scroll header={<Header title="Create account" back/>} contentStyle={{justifyContent:'center',gap:18}}><Text style={{color:colors.secondary,fontSize:16}}>Your existing local tasks remain on this device. New data will be associated with your account.</Text><TextField label="Name" value={name} onChangeText={setName} autoComplete="name"/><TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/><TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password"/>{error?<Text accessibilityRole="alert" style={{color:colors.danger}}>{error}</Text>:null}<Button title="Create account" onPress={()=>void submit()} loading={loading}/><Text style={{color:colors.secondary,textAlign:'center',fontSize:12}}>Passwords are hashed and are never stored in plain text.</Text></Screen>;}
