import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

type Props = {
  value: string;
  onChange: (itemValue: string, itemIndex: number) => void;
};

export default function BloodTypePicker({ value, onChange }: Props) {
  return (
    <View style={styles.pickerWrapper}>
      <Picker
        selectedValue={value}
        style={styles.picker}
        onValueChange={onChange}
      >
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

const styles = StyleSheet.create({
  pickerWrapper: {
    flex: 1,
    height: 44,
  },
  picker: {
    flex: 1,
    height: 44,
  },
});
