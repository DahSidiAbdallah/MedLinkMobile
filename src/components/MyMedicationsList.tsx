import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getMedications } from '../utils/myMedications';
import { colors } from '../theme';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
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
  const [medications, setMedications] = useState<any[]>([]);

  useEffect(() => {
    getMedications().then(setMedications);
  }, []);

  if (!medications.length) {
    return <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 12 }}>No medications saved.</Text>;
  }

  return (
    <FlatList
      data={medications}
      keyExtractor={(item, idx) => `${item.code}_${idx}`}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.labelInfo?.indications?.slice(0, 40) || 'Medication'}</Text>
          <Text style={styles.label}>Code:</Text>
          <Text style={styles.value}>{item.code}</Text>
          {item.labelInfo?.indications && (
            <>
              <Text style={styles.label}>Indications:</Text>
              <Text style={styles.value}>{item.labelInfo.indications}</Text>
            </>
          )}
          {item.labelInfo?.dosage && (
            <>
              <Text style={styles.label}>Dosage:</Text>
              <Text style={styles.value}>{item.labelInfo.dosage}</Text>
            </>
          )}
          {item.labelInfo?.sideEffects && (
            <>
              <Text style={styles.label}>Side Effects:</Text>
              <Text style={styles.value}>{item.labelInfo.sideEffects}</Text>
            </>
          )}
          {item.recall && (
            <>
              <Text style={[styles.label, { color: colors.danger }]}>Recall:</Text>
              <Text style={[styles.value, { color: colors.danger }]}>{item.recall.reason_for_recall}</Text>
            </>
          )}
        </View>
      )}
    />
  );
}
