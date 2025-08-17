import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';
export function SegmentedControl({ options, value, onChange }:{
  options:string[]; value:string; onChange:(v:string)=>void;
}) {
  return (
    <View style={styles.wrap}>
      {options.map(opt=>{
        const active = opt===value;
        return (
          <Pressable key={opt} onPress={()=>onChange(opt)} style={[styles.btn, active&&styles.active]}>
            <Text style={[styles.lbl, active&&styles.albl]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap:{ flexDirection:'row', backgroundColor:'#EFF3FF', borderRadius: radius.lg, padding:4, gap:6 },
  btn:{ flex:1, alignItems:'center', paddingVertical:10, borderRadius: radius.md },
  active:{ backgroundColor:'#fff' },
  lbl:{ color: colors.muted, fontWeight:'600' },
  albl:{ color: colors.primary },
});
