import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '../providers/AppProvider';
export default function RootLayout(){return <GestureHandlerRootView style={{flex:1}}><AppProvider><StatusBar style="auto"/><Stack screenOptions={{headerShown:false,animation:'slide_from_right'}}><Stack.Screen name="index"/><Stack.Screen name="onboarding"/><Stack.Screen name="(tabs)"/><Stack.Screen name="(auth)"/><Stack.Screen name="task/new" options={{presentation:'modal',animation:'slide_from_bottom'}}/><Stack.Screen name="task/edit/[id]" options={{presentation:'modal',animation:'slide_from_bottom'}}/></Stack></AppProvider></GestureHandlerRootView>;}
