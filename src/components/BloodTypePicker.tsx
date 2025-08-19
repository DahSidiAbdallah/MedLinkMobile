import React from 'react';

interface BloodTypePickerProps {
  readonly value: string;
  readonly onChange: (v: string) => void;
}

export default function BloodTypePicker({ value, onChange }: BloodTypePickerProps) {
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
