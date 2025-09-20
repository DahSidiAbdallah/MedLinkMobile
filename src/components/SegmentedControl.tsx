import { View, Pressable, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../theme';
export function SegmentedControl({ options, value, onChange }:{
  options:string[]; value:string; onChange:(v:string)=>void;
}) {
  return (
    <View style={styles.wrap}>
      {options.map(opt=>{
        const active = opt===value;
        const content = (
          <View style={[styles.btn, active && styles.active]}>
            <Text style={[styles.lbl, active && styles.albl]}>{opt}</Text>
          </View>
        );
        return (
          <Pressable key={opt} onPress={()=>onChange(opt)} style={styles.pressable}>
            {active ? (
              <LinearGradient colors={colors.primaryGradient} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.gradientWrap}>
                {content}
              </LinearGradient>
            ) : content}
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap:{ flexDirection:'row', backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: radius.lg, padding:4, gap:6 },
  pressable:{ flex:1, borderRadius: radius.md, overflow:'hidden' },
  gradientWrap:{ flex:1, borderRadius: radius.md, padding:1, ...shadow.soft },
  btn:{ flex:1, alignItems:'center', justifyContent:'center', paddingVertical:10, borderRadius: radius.md, backgroundColor: 'rgba(248,250,255,0.7)' },
  active:{ backgroundColor: 'rgba(255,255,255,0.2)' },
  lbl:{ color: colors.muted, fontWeight:'600' },
  albl:{ color: '#fff' },
});
