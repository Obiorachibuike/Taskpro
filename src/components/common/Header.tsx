import React from 'react';
import { Pressable,StyleSheet,Text,View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
export function Header({title,subtitle,back=false,right}:{title:string;subtitle?:string;back?:boolean;right?:React.ReactNode}){const{colors}=useTheme();const router=useRouter();return <View style={styles.row}>{back?<Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={()=>router.back()} hitSlop={12}><Ionicons name="arrow-back" size={25} color={colors.text}/></Pressable>:null}<View style={styles.copy}><Text style={[styles.title,{color:colors.text}]} numberOfLines={1}>{title}</Text>{subtitle?<Text style={{color:colors.secondary}}>{subtitle}</Text>:null}</View>{right}</View>;}
const styles=StyleSheet.create({row:{minHeight:66,paddingHorizontal:20,flexDirection:'row',alignItems:'center',gap:14},copy:{flex:1},title:{fontSize:25,fontWeight:'800',letterSpacing:-0.5}});
