import React, { type PropsWithChildren, type ReactNode } from 'react';
import { RefreshControl,ScrollView,StyleSheet,View,type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
export function Screen({children,scroll=false,refreshing,onRefresh,contentStyle,header}:PropsWithChildren<{scroll?:boolean;refreshing?:boolean;onRefresh?:()=>void;contentStyle?:ViewStyle;header?:ReactNode}>){const{colors}=useTheme();return <SafeAreaView style={[styles.safe,{backgroundColor:colors.background}]} edges={['top','left','right']}>{header}{scroll?<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content,contentStyle]} refreshControl={onRefresh?<RefreshControl refreshing={refreshing??false} onRefresh={onRefresh} tintColor={colors.primary}/>:undefined}>{children}</ScrollView>:<View style={[styles.content,contentStyle]}>{children}</View>}</SafeAreaView>;}
const styles=StyleSheet.create({safe:{flex:1},content:{flexGrow:1,padding:20}});
