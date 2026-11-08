import React,{useState} from 'react';
import { Pressable,Text,View } from 'react-native';
import { Link,useRouter } from 'expo-router';
import { Screen } from '../../components/common/Screen';
import { Header } from '../../components/common/Header';
import { TextField } from '../../components/common/TextField';
import { Button } from '../../components/common/Button';
import { useAppDispatch,useAppSelector } from '../../hooks/store';
import { signIn } from '../../store/slices/authSlice';
import { useTheme } from '../../theme';
export default function Login(){const[email,setEmail]=useState('');const[password,setPassword]=useState('');const[error,setError]=useState('');const dispatch=useAppDispatch();const router=useRouter();const loading=useAppSelector(s=>s.auth.loading);const{colors}=useTheme();async function submit(){try{await dispatch(signIn({email,password})).unwrap();router.replace('/(tabs)');}catch(e){setError(e instanceof Error?e.message:'Sign in failed');}}return <Screen scroll header={<Header title="Welcome back" back/>} contentStyle={{justifyContent:'center',gap:18}}><Text style={{color:colors.secondary,fontSize:16,lineHeight:24}}>Sign in to synchronize your tasks. Local task management never requires a connection.</Text><TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email"/><TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password"/>{error?<Text accessibilityRole="alert" style={{color:colors.danger}}>{error}</Text>:null}<Button title="Sign in" onPress={()=>void submit()} loading={loading}/><Link href="/(auth)/forgot-password" asChild><Pressable><Text style={{color:colors.primary,textAlign:'center',fontWeight:'600'}}>Forgot password?</Text></Pressable></Link><View style={{flexDirection:'row',justifyContent:'center',gap:5}}><Text style={{color:colors.secondary}}>New to TaskPro?</Text><Link href="/(auth)/register" style={{color:colors.primary,fontWeight:'700'}}>Create account</Link></View></Screen>;}
