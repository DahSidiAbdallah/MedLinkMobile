import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors } from '../theme';

type Props = {
  start?: Date; // defaults to today as center
  days?: number; // total days to show (odd number recommended)
  value?: Date; // selected day
  onChange?: (d: Date) => void;
};

function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function fmt(d: Date) {
  return d.toISOString().slice(5, 10); // MM-DD
}

export default function CalendarStrip({ start, days = 7, value, onChange }: Props) {
  const today = new Date();
  const half = Math.floor(days / 2);
  const center = start || today;
  const items = Array.from({ length: days }, (_, i) => addDays(center, i - half));
  const selectedKey = (value || today).toDateString();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      {items.map(d => {
        const isSel = d.toDateString() === selectedKey;
        return (
          <Pressable
            key={d.toDateString()}
            onPress={() => onChange?.(d)}
            style={{
              minWidth: 44,
              paddingVertical: 8,
              paddingHorizontal: 8,
              borderRadius: 12,
              backgroundColor: isSel ? 'rgba(37,99,235,0.12)' : '#fff',
              borderWidth: 1,
              borderColor: isSel ? colors.primary : 'rgba(2,6,23,0.06)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: isSel ? colors.primary : colors.muted, fontWeight: '700' }}>{d.toLocaleDateString(undefined, { weekday: 'short' })}</Text>
            <Text style={{ color: isSel ? colors.primary : colors.text }}>{fmt(d)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
