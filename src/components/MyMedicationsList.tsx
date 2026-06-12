import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMedications } from '../utils/myMedications';
import { colors } from '../theme';

const styles = StyleSheet.create({
  card: {
  backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.primary,
    marginBottom: 4,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 2,
  },
  value: {
    color: colors.text,
    fontSize: 15,
    marginBottom: 2,
  },
});

export default function MyMedicationsList() {
  const { t } = useTranslation();
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMedications()
      .then(setMedications)
      .catch((err) => {
        // Failed to load medications
      })
      .finally(() => setLoading(false));
  }, []);

  const deleteMedication = (idx: number) => {
    Alert.alert(
      t('profile.deleteMedicationTitle', 'Delete Medication'),
      t('profile.deleteMedicationMessage', 'Are you sure you want to delete this medication?'),
      [
      { text: t('common.cancel', 'Cancel'), style: 'cancel' },
      { text: t('common.delete', 'Delete'), style: 'destructive', onPress: async () => {
        const updated = medications.filter((_, i) => i !== idx);
        await AsyncStorage.setItem('myMedications', JSON.stringify(updated));
        setMedications(updated);
      } }
    ]);
  };

  if (loading) {
    return (
      <View style={{ alignItems: 'center', marginTop: 12 }}>
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: 8 }}>{t('profile.loadingMedications', 'Loading medications...')}</Text>
      </View>
    );
  }

  if (!medications.length) {
    return <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 12 }}>{t('profile.noMedications', 'No medications saved.')}</Text>;
  }

  return (
    <View>
      {medications.map((item, index) => (
        <View key={`${item.code}_${index}`} style={styles.card}>
          <Text style={styles.title}>{item.labelInfo?.indications?.slice(0, 40) || 'Medication'}</Text>
          <Text style={styles.label}>{t('drugs.code', 'Code')}:</Text>
          <Text style={styles.value}>{item.code}</Text>
          {item.labelInfo?.indications && (
            <>
              <Text style={styles.label}>{t('scanner.indications', 'Indications')}:</Text>
              <Text style={styles.value}>{item.labelInfo.indications}</Text>
            </>
          )}
          {item.labelInfo?.dosage && (
            <>
              <Text style={styles.label}>{t('scanner.dosage', 'Dosage')}:</Text>
              <Text style={styles.value}>{item.labelInfo.dosage}</Text>
            </>
          )}
          {item.labelInfo?.sideEffects && (
            <>
              <Text style={styles.label}>{t('scanner.sideEffects', 'Side Effects')}:</Text>
              <Text style={styles.value}>{item.labelInfo.sideEffects}</Text>
            </>
          )}
          {item.recall && (
            <>
              <Text style={[styles.label, { color: colors.danger }]}>{t('scanner.recallAlert', 'Recall')}:</Text>
              <Text style={[styles.value, { color: colors.danger }]}>{item.recall.reason_for_recall}</Text>
            </>
          )}
          <TouchableOpacity
            onPress={() => deleteMedication(index)}
            style={{
              marginTop: 10,
              alignSelf: 'flex-end',
              backgroundColor: colors.danger,
              borderRadius: 6,
              paddingVertical: 6,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ color: colors.card, fontWeight: 'bold' }}>{t('actions.delete', 'Delete')}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}
