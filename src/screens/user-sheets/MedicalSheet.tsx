import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Animated, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  profile: any;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  gradient: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  item: {
    color: colors.muted,
    marginLeft: spacing.sm,
    marginBottom: 4,
  },
  closeButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  closeText: {
    color: colors.card,
    fontWeight: '700',
  },
});

export default function MedicalSheet({ visible, onClose, profile }: Readonly<Props>) {
  const { t } = useTranslation();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    }
  }, [visible, anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }] }>
          <LinearGradient colors={colors.subtleGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
            <View style={styles.handle} />
            <Text style={styles.title}>{t('profile.medicalId', 'Medical ID')}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>{t('auth.bloodType', 'Blood Type')}</Text>
              <Text style={styles.item}>{profile?.blood_type || t('common.notSet', 'Not set')}</Text>

              <Text style={styles.sectionLabel}>{t('auth.allergies', 'Allergies')}</Text>
              {profile?.allergies && profile.allergies.length > 0
                ? profile.allergies.map((a: string) => (
                    <Text key={a} style={styles.item}>• {a}</Text>
                  ))
                : <Text style={styles.item}>{t('common.none', 'None')}</Text>}

              <Text style={styles.sectionLabel}>{t('auth.medicalConditions', 'Medical Conditions')}</Text>
              {profile?.medical_conditions && profile.medical_conditions.length > 0
                ? profile.medical_conditions.map((c: string) => (
                    <Text key={c} style={styles.item}>• {c}</Text>
                  ))
                : <Text style={styles.item}>{t('common.none', 'None')}</Text>}

              <Text style={styles.sectionLabel}>{t('auth.medications', 'Medications')}</Text>
              {profile?.medications && profile.medications.length > 0
                ? profile.medications.map((m: string) => (
                    <Text key={m} style={styles.item}>• {m}</Text>
                  ))
                : <Text style={styles.item}>{t('common.none', 'None')}</Text>}
            </ScrollView>
            <Pressable style={styles.closeButton} onPress={() => {
              Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(onClose);
            }}>
              <Text style={styles.closeText}>{t('common.close', 'Close')}</Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}
