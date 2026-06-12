import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';

type Props = {
  value: string;
  onChange: (itemValue: string, itemIndex: number) => void;
};

export default function BloodTypePicker({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.pickerWrapper}>
      <Picker
        selectedValue={value}
        style={styles.picker}
        onValueChange={onChange}
      >
        <Picker.Item label={t('auth.bloodTypeSelect', 'Select...')} value="" />
        <Picker.Item label="A+" value="A+" />
        <Picker.Item label="A-" value="A-" />
        <Picker.Item label="B+" value="B+" />
        <Picker.Item label="B-" value="B-" />
        <Picker.Item label="AB+" value="AB+" />
        <Picker.Item label="AB-" value="AB-" />
        <Picker.Item label="O+" value="O+" />
        <Picker.Item label="O-" value="O-" />
        <Picker.Item label={t('auth.bloodTypeOther', 'Other (type below)')} value="custom" />
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
