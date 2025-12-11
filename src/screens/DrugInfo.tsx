import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import { ListRow } from '../components/ListRow';
import { Pill } from '../components/Pill';
import Chip from '../components/Chip';
import { useDrugInfo } from '../hooks/useDrugInfo';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius, type } from '../theme';

export default function DrugInfo({ navigation }: any) {
  const { searchDrug, suggestions, loading, error } = useDrugInfo();
  const [query, setQuery] = useState('');
  const [drugInfo, setDrugInfo] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState('By Name');
  const { t } = useTranslation();

  const handleSearch = async (value?: string) => {
    const text = value ?? query;
    setQuery(text);
    if (!text) {
      setDrugInfo(null);
      return;
    }
    const result = await searchDrug(text);
    setDrugInfo(result);
  };

  const hero = (
    <LinearGradient colors={colors.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <Text style={styles.heroTitle}>{t('drugs.medicationEncyclopedia', 'Medication encyclopedia')}</Text>
      <Text style={styles.heroSubtitle}>Search trusted sources for drug insights, dosage guidance, and risk highlights.</Text>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search drugs"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleSearch()}
          returnKeyType="search"
        />
        <Pressable
          style={styles.searchAction}
          onPress={() => handleSearch()}
        >
          <Text style={styles.searchActionText}>{t('common.go', 'Go')}</Text>
        </Pressable>
      </View>
      <View style={styles.filterRow}>
        {['By Name', 'By Use', 'By Category'].map(opt => (
          <Chip key={opt} label={opt} selected={activeFilter === opt} onPress={() => setActiveFilter(opt)} />
        ))}
      </View>
    </LinearGradient>
  );

  return (
    <ScreenContainer
      scrollable
      contentContainerStyle={styles.content}
      header={hero}
    >
      {suggestions.length > 0 ? (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('drugs.suggestedMatches', 'Suggested matches')}</Text>
          {suggestions.map(drug => (
            <ListRow
              key={drug}
              title={drug}
              subtitle="Tap to view detailed information"
              onPress={() => handleSearch(drug)}
              right={<Ionicons name="information-circle-outline" size={20} color={colors.primary} />}
            />
          ))}
        </Card>
      ) : null}

      {loading ? <ActivityIndicator size="large" color={colors.primary} /> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {drugInfo ? (
        <Card style={styles.sectionCard}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>{drugInfo.name}</Text>
            {drugInfo.warnings && drugInfo.warnings.length > 0 ? <Pill tone="warn">{t('drugs.warnings', 'Warning')}</Pill> : null}
          </View>
          {drugInfo.description ? <Text style={styles.bodyText}>{drugInfo.description}</Text> : null}
          {drugInfo.dosage ? <Text style={styles.bodyText}>Dosage: {drugInfo.dosage}</Text> : null}
          {drugInfo.side_effects ? <Text style={styles.bodyText}>Side effects: {drugInfo.side_effects.join(', ')}</Text> : null}
          {drugInfo.interactions ? <Text style={styles.bodyText}>Interactions: {drugInfo.interactions.join(', ')}</Text> : null}
        </Card>
      ) : (
        <Card style={styles.emptyState}>
          <Ionicons name="medical-outline" size={26} color={colors.primary} />
          <Text style={styles.emptyTitle}>{t('drugs.noDrugSelected', 'No drug selected')}</Text>
          <Text style={styles.emptyText}>Search to view FDA-backed monographs, interactions, and dosage guides.</Text>
        </Card>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  hero: {
    paddingTop: spacing.xxl * 1.2,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.xl + 6,
    borderBottomRightRadius: radius.xl + 6,
    gap: spacing.md,
  },
  heroTitle: {
    ...type.h1,
    color: '#fff',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  searchAction: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  searchActionText: {
    color: colors.card,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionCard: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...type.h2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  bodyText: {
    color: colors.text,
    lineHeight: 20,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
