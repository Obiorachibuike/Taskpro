import { useColorScheme } from 'react-native';
import { useAppSelector } from '../hooks/store';
export const palettes={
 light:{background:'#F7F8FA',surface:'#FFFFFF',surfaceSecondary:'#EEF2F7',primary:'#2563EB',text:'#172033',secondary:'#7B8495',success:'#16A34A',warning:'#F59E0B',danger:'#DC2626',border:'#E5EAF0',shadow:'#172033'},
 dark:{background:'#101318',surface:'#191F28',surfaceSecondary:'#222B38',primary:'#60A5FA',text:'#F8FAFC',secondary:'#94A3B8',success:'#4ADE80',warning:'#FBBF24',danger:'#F87171',border:'#2B3543',shadow:'#000000'},
} as const;
export type Colors={background:string;surface:string;surfaceSecondary:string;primary:string;text:string;secondary:string;success:string;warning:string;danger:string;border:string;shadow:string};
export function useTheme():{colors:Colors;dark:boolean}{const preference=useAppSelector(s=>s.ui.theme);const system=useColorScheme();const dark=preference==='dark'||(preference==='system'&&system==='dark');return{colors:dark?palettes.dark:palettes.light,dark};}
export const spacing={xs:4,sm:8,md:12,lg:16,xl:24,xxl:32} as const;
export const priorityColors={low:'#64748B',medium:'#2563EB',high:'#F59E0B',urgent:'#DC2626'} as const;
