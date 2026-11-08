import * as Network from 'expo-network';
import { store } from '../../store';
import { setOnline } from '../../store/slices/connectivitySlice';
import { synchronize } from '../../store/slices/syncSlice';
let previous=true;
export function startConnectivityMonitoring():()=>void{const check=async()=>{try{const state=await Network.getNetworkStateAsync();const online=Boolean(state.isConnected&&state.isInternetReachable!==false);store.dispatch(setOnline(online));if(online&&!previous){const {auth,sync}=store.getState();if(auth.user&&!sync.status.includes('syncing'))void store.dispatch(synchronize({userId:auth.user.id,token:auth.token}));}previous=online;}catch{store.dispatch(setOnline(false));}};void check();const timer=setInterval(check,15000);return()=>clearInterval(timer);}
