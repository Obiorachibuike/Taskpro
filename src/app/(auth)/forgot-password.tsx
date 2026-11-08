import React,{useState} from 'react';
import { Text } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { Header } from '../../components/common/Header';
import { TextField } from '../../components/common/TextField';
import { Button } from '../../components/common/Button';
import { requestPasswordReset } from '../../features/authentication/authService';
import { useTheme } from '../../theme';
export default function ForgotPassword(){const[email,setEmail]=useState('');const[sent,setSent]=useState(false);const{colors}=useTheme();return <Screen header={<Header title="Reset password" back/>} contentStyle={{justifyContent:'center',gap:20}}><Text style={{color:colors.secondary,fontSize:16,lineHeight:24}}>Enter your account email. If an account exists, the configured backend will send reset instructions.</Text><TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>{sent?<Text style={{color:colors.success}}>Reset instructions requested. Check your email.</Text>:null}<Button title="Send reset instructions" disabled={!email.includes('@')} onPress={()=>void requestPasswordReset(email).then(()=>setSent(true))}/></Screen>;}
