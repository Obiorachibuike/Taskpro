import React,{useEffect} from 'react';
import { StyleSheet,Text,View } from 'react-native';
import Animated,{useAnimatedProps,useSharedValue,withTiming} from 'react-native-reanimated';
import Svg,{Circle} from 'react-native-svg';
import { useTheme } from '../../theme';
const AnimatedCircle=Animated.createAnimatedComponent(Circle);
export function ProgressRing({value,size=150}:{value:number;size?:number}){const{colors}=useTheme();const progress=useSharedValue(0);const radius=(size-18)/2;const circumference=2*Math.PI*radius;useEffect(()=>{progress.value=withTiming(Math.max(0,Math.min(100,value)),{duration:700});},[progress,value]);const props=useAnimatedProps(()=>({strokeDashoffset:circumference*(1-progress.value/100)}));return <View style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}><Svg width={size} height={size} style={StyleSheet.absoluteFill}><Circle cx={size/2} cy={size/2} r={radius} stroke={colors.surfaceSecondary} strokeWidth={12} fill="none"/><AnimatedCircle animatedProps={props} cx={size/2} cy={size/2} r={radius} stroke={colors.primary} strokeWidth={12} strokeLinecap="round" fill="none" strokeDasharray={circumference} rotation="-90" origin={`${size/2},${size/2}`}/></Svg><Text style={[styles.value,{color:colors.text}]}>{value}%</Text><Text style={{color:colors.secondary,fontSize:12}}>completed</Text></View>;}
const styles=StyleSheet.create({value:{fontSize:30,fontWeight:'800'}});
