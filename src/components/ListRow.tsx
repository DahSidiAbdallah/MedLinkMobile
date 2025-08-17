import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { colors } from '../theme';
export function ListRow({ title, subtitle, imageUri, right, onPress }:{
  title:string; subtitle?:string; imageUri?:string; right?:React.ReactNode; onPress?:()=>void;
}) {
  return (
    <Pressable onPress={onPress} style={s.row}>
      {imageUri?<Image source={{uri:imageUri}} style={s.avatar}/> : <View style={[s.avatar,{backgroundColor:'#EEF2FF'}]}/>}
      <View style={{flex:1}}>
        <Text style={s.title}>{title}</Text>
        {subtitle?<Text style={s.sub}>{subtitle}</Text>:null}
      </View>
      {right}
    </Pressable>
  );
}
const s = StyleSheet.create({
  row:{ flexDirection:'row', alignItems:'center', gap:12 },
  avatar:{ width:44, height:44, borderRadius:22 },
  title:{ fontSize:16, fontWeight:'700', color:'#0F172A' },
  sub:{ fontSize:13, color: colors.muted },
});
