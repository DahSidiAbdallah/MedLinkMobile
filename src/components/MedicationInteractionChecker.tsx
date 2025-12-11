import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius } from '../theme';
import Card from './Card';
import Chip from './Chip';

interface Medication {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
}

interface Interaction {
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  recommendation: string;
}

export default function MedicationInteractionChecker({ medications }: { medications: Medication[] }) {
  const { t } = useTranslation();
  
  // Mock interaction database - in production, this would come from an API
  const interactionDatabase: Record<string, Record<string, Interaction>> = {
    'warfarin': {
      'aspirin': {
        severity: 'severe',
        description: t('medicationInteraction.increasedRiskBleeding'),
        recommendation: t('medicationInteraction.avoidConcurrentUse'),
      },
      'ibuprofen': {
        severity: 'moderate',
        description: t('medicationInteraction.mayIncreaseBleedingRisk'),
        recommendation: t('medicationInteraction.monitorBleeding'),
      },
    },
    'lisinopril': {
      'potassium': {
        severity: 'moderate',
        description: t('medicationInteraction.mayCauseHyperkalemia'),
        recommendation: t('medicationInteraction.monitorPotassium'),
      },
      'nsaids': {
        severity: 'mild',
        description: t('medicationInteraction.mayReduceKidneyFunction'),
        recommendation: t('medicationInteraction.monitorKidneyFunction'),
      },
    },
    'metformin': {
      'contrast dye': {
        severity: 'severe',
        description: t('medicationInteraction.riskLacticAcidosis'),
        recommendation: t('medicationInteraction.stopMetforminProcedures'),
      },
    },
    'simvastatin': {
      'clarithromycin': {
        severity: 'severe',
        description: t('medicationInteraction.riskMuscleDamage'),
        recommendation: t('medicationInteraction.avoidConcurrentUseAntibiotics'),
      },
    },
  };

  const [interactions, setInteractions] = useState<Array<{
    med1: string;
    med2: string;
    interaction: Interaction;
  }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (medications.length < 2) {
      setInteractions([]);
      return;
    }

    checkInteractions();
  }, [medications]);

  const checkInteractions = async () => {
    setLoading(true);
    const foundInteractions: any[] = [];

    // Check all pairs of medications
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const med1 = medications[i].name.toLowerCase();
        const med2 = medications[j].name.toLowerCase();

        // Check both directions in the database
        if (interactionDatabase[med1]?.[med2]) {
          foundInteractions.push({
            med1: medications[i].name,
            med2: medications[j].name,
            interaction: interactionDatabase[med1][med2],
          });
        } else if (interactionDatabase[med2]?.[med1]) {
          foundInteractions.push({
            med1: medications[j].name,
            med2: medications[i].name,
            interaction: interactionDatabase[med2][med1],
          });
        }
      }
    }

    setInteractions(foundInteractions);
    setLoading(false);

    // Alert for severe interactions
    const severeInteractions = foundInteractions.filter(i => i.interaction.severity === 'severe');
    if (severeInteractions.length > 0) {
      Alert.alert(
        t('medicationInteraction.severeInteraction'),
        t('medicationInteraction.severeInteractionMessage', { count: severeInteractions.length }),
        [{ text: t('common.ok', 'OK') }]
      );
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return colors.danger;
      case 'moderate': return colors.warn;
      case 'mild': return colors.primary;
      default: return colors.muted;
    }
  };

  const getSeverityVariant = (severity: string): 'danger' | 'warning' | 'default' | 'info' | 'success' => {
    switch (severity) {
      case 'severe': return 'danger';
      case 'moderate': return 'warning';
      case 'mild': return 'info';
      default: return 'default';
    }
  };

  if (medications.length < 2) {
    return (
      <Card>
        <Text style={s.title}>{t('medicationInteraction.title')}</Text>
        <Text style={s.subtitle}>
          {t('medicationInteraction.addMedications')}
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text style={s.title}>{t('medicationInteraction.title')}</Text>
      
      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={s.loadingText}>{t('medicationInteraction.checkingInteractions')}</Text>
        </View>
      ) : interactions.length === 0 ? (
        <View style={s.noInteractions}>
          <Text style={s.noInteractionsText}>{t('medicationInteraction.noInteractions')}</Text>
        </View>
      ) : (
        <ScrollView style={s.interactionsList} showsVerticalScrollIndicator={false}>
          {interactions.map((item, index) => (
            <View key={index} style={s.interactionCard}>
              <View style={s.interactionHeader}>
                <Text style={s.medicationNames}>
                  {item.med1} + {item.med2}
                </Text>
                <Chip
                  label={item.interaction.severity.toUpperCase()}
                  variant={getSeverityVariant(item.interaction.severity)}
                  size="sm"
                />
              </View>
              
              <Text style={s.description}>{item.interaction.description}</Text>
              
              <View style={s.recommendationBox}>
                <Text style={s.recommendationLabel}>{t('medicationInteraction.recommendation')}: {item.interaction.recommendation}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: colors.muted,
  },
  noInteractions: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  noInteractionsText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  interactionsList: {
    maxHeight: 400,
  },
  interactionCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  interactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  medicationNames: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  description: {
    fontSize: 13,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  recommendationBox: {
    backgroundColor: colors.warn100,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warn,
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warn,
    marginBottom: 2,
  },
  recommendation: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
});
