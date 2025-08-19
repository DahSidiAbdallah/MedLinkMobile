import React from 'react';
import { Platform, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface BloodTypePickerProps {
  readonly value: string;
  readonly onChange: (v: string) => void;
}

export default function BloodTypePicker({ value, onChange }: BloodTypePickerProps) {
  if (Platform.OS === 'web') {
    return (
      <select
        style={{ flex: 1, height: 44, borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 8, padding: 8, backgroundColor: '#F9FAFB', fontSize: 16 }}
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Select...</option>
        <option value="A+">A+</option>
        <option value="A-">A-</option>
        <option value="B+">B+</option>
        <option value="B-">B-</option>
        <option value="AB+">AB+</option>
        <option value="AB-">AB-</option>
        <option value="O+">O+</option>
        <option value="O-">O-</option>
        <option value="custom">Other (type below)</option>
      </select>
    );
  }

  return (
    <View style={{ flex: 1, height: 44, borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 8, backgroundColor: '#F9FAFB', justifyContent: 'center', paddingLeft: 4 }}>
      <Picker selectedValue={value} onValueChange={v => onChange(String(v))} style={{ flex: 1 }}>
        <Picker.Item label="Select..." value="" />
        <Picker.Item label="A+" value="A+" />
        <Picker.Item label="A-" value="A-" />
        <Picker.Item label="B+" value="B+" />
        <Picker.Item label="B-" value="B-" />
        <Picker.Item label="AB+" value="AB+" />
        <Picker.Item label="AB-" value="AB-" />
        <Picker.Item label="O+" value="O+" />
        <Picker.Item label="O-" value="O-" />
        <Picker.Item label="Other (type below)" value="custom" />
      </Picker>
    </View>
  );
}
