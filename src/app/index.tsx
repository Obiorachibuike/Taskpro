import React from 'react';
import { ActivityIndicator,StyleSheet,Text,View } from 'react-native';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../hooks/store';
import { useTheme } from '../theme';
export default function Entry(){const{user,loading,onboarded}=useAppSelector(s=>s.auth);const{colors}=useTheme();if(!loading&&user)return <Redirect href={onboarded?'/(tabs)':'/onboarding'}/>;return <View style={[styles.container,{backgroundColor:colors.primary}]}><View style={styles.logo}><Ionicons name="checkmark-done" size={46} color={colors.primary}/></View><Text style={styles.name}>TaskPro</Text><Text style={styles.tagline}>Make space for what matters.</Text><ActivityIndicator color="#fff" style={{marginTop:36}}/></View>;}
const styles=StyleSheet.create({container:{flex:1,alignItems:'center',justifyContent:'center'},logo:{width:86,height:86,borderRadius:28,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',transform:[{rotate:'-5deg'}]},name:{color:'#fff',fontSize:38,fontWeight:'800',marginTop:24,letterSpacing:-1},tagline:{color:'#DBEAFE',fontSize:16,marginTop:7}});
