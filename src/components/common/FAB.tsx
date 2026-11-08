import React from 'react';
import { Pressable,StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
export function FAB({date}:{date?:string}){const{colors}=useTheme();const router=useRouter();return <Pressable testID="create-task-fab" accessibilityRole="button" accessibilityLabel="Create task" onPress={()=>router.push(date?`/task/new?date=${date}`:'/task/new')} style={({pressed})=>[styles.fab,{backgroundColor:colors.primary,transform:[{scale:pressed?0.92:1}]}]}><Ionicons name="add" size={30} color="#fff"/></Pressable>;}
const styles=StyleSheet.create({fab:{position:'absolute',right:22,bottom:24,width:60,height:60,borderRadius:20,alignItems:'center',justifyContent:'center',shadowColor:'#2563EB',shadowOpacity:0.3,shadowRadius:12,shadowOffset:{width:0,height:5},elevation:7}});
