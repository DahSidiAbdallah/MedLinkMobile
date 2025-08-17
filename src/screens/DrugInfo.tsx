import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrugInfo } from '../hooks/useDrugInfo';
import { colors, spacing, radius, type } from '../theme';
import Card from '../components/Card';
import { ListRow } from '../components/ListRow';
import { Pill } from '../components/Pill';

export default function DrugInfo({ navigation }: any) {
  const { searchDrug, suggestions, loading, error } = useDrugInfo();
  const [query, setQuery] = useState('');
  const [drugInfo, setDrugInfo] = useState<any>(null);

  const handleSearch = async () => {
    const result = await searchDrug(query);
    setDrugInfo(result);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.top}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            style={{ flex: 1, marginLeft: spacing.sm }}
            placeholder="Search drugs"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <View style={styles.filters}>
          {['By Name', 'By Use', 'By Category'].map(opt => (
            <Pressable key={opt} style={styles.chip} android_ripple={{ color: colors.line }}>
              <Text style={styles.chipText}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        {suggestions.map(drug => (
          <Card key={drug}>
            <ListRow
              title={drug}
              onPress={() => {
                setQuery(drug);
                handleSearch();
              }}
              right={<Ionicons name="information-circle-outline" size={20} color={colors.primary} />}
            />
          </Card>
        ))}
        {loading && <ActivityIndicator size="large" color={colors.primary} />}
        {error && <Text style={{ color: colors.danger }}>{error}</Text>}
        {drugInfo && (
          <Card>
            <Text style={[type.h2, { marginBottom: spacing.sm }]}>{drugInfo.name}</Text>
            {drugInfo.description && <Text style={{ marginBottom: spacing.md }}>{drugInfo.description}</Text>}
            {drugInfo.warnings && drugInfo.warnings.length > 0 && (
              <Pill tone="warn">Warning</Pill>
            )}
            {drugInfo.dosage && (
              <Text style={styles.section}>Dosage: {drugInfo.dosage}</Text>
            )}
            {drugInfo.side_effects && (
              <Text style={styles.section}>Side Effects: {drugInfo.side_effects.join(', ')}</Text>
            )}
            {drugInfo.interactions && (
              <Text style={styles.section}>Interactions: {drugInfo.interactions.join(', ')}</Text>
            )}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { padding: spacing.xl },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  filters: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: '#EFF3FF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  chipText: { color: colors.muted, fontWeight: '600' },
  section: { marginTop: spacing.sm },
});
