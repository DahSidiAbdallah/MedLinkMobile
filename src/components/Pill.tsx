import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';
export function Pill({ children, tone='primary' }:{children:string; tone?:'primary'|'warn'|'neutral'}) {
  const map = { primary:['#E8F0FF', colors.primary], warn:['#FFF7E6', colors.warn], neutral:['#EEF2F7', colors.muted] } as any;
  const [bg, fg] = map[tone];
  return <View style={[styles.pill,{backgroundColor:bg}]}><Text style={[styles.txt,{color:fg}]}>{children}</Text></View>;
}
const styles = StyleSheet.create({ pill:{ borderRadius:999, paddingHorizontal:12, paddingVertical:6 }, txt:{ fontSize:12, fontWeight:'700' } });
