import React from 'react';
import { StyleSheet,Text,View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Button } from './Button';
export function EmptyState({title,message,action,onAction}:{title:string;message:string;action?:string;onAction?:()=>void}){const{colors}=useTheme();return <View style={styles.container}><View style={[styles.icon,{backgroundColor:colors.surfaceSecondary}]}><Ionicons name="checkmark-done" size={36} color={colors.primary}/></View><Text style={[styles.title,{color:colors.text}]}>{title}</Text><Text style={[styles.message,{color:colors.secondary}]}>{message}</Text>{action&&onAction?<Button title={action} onPress={onAction}/>:null}</View>;}
const styles=StyleSheet.create({container:{alignItems:'center',justifyContent:'center',padding:36,gap:12},icon:{width:76,height:76,borderRadius:28,alignItems:'center',justifyContent:'center'},title:{fontSize:21,fontWeight:'800'},message:{textAlign:'center',lineHeight:21}});
