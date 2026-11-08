import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
const icons={index:'home',tasks:'checkbox',calendar:'calendar',projects:'folder',settings:'settings'} as const;
export default function TabsLayout(){const{colors}=useTheme();return <Tabs screenOptions={({route})=>({headerShown:false,tabBarActiveTintColor:colors.primary,tabBarInactiveTintColor:colors.secondary,tabBarStyle:{backgroundColor:colors.surface,borderTopColor:colors.border,height:70,paddingBottom:10,paddingTop:7},tabBarLabelStyle:{fontSize:11,fontWeight:'600'},tabBarIcon:({color,size})=><Ionicons name={`${icons[route.name as keyof typeof icons]}-outline`} color={color} size={size}/>})}><Tabs.Screen name="index" options={{title:'Home'}}/><Tabs.Screen name="tasks" options={{title:'Tasks'}}/><Tabs.Screen name="calendar" options={{title:'Calendar'}}/><Tabs.Screen name="projects" options={{title:'Projects'}}/><Tabs.Screen name="settings" options={{title:'Settings'}}/></Tabs>;}
