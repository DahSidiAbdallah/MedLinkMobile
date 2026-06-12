import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Animated, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  profile: any;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxxx,
    borderTopRightRadius: radius.xxxx,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 48,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  item: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 2,
  },
  closeButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
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
          <View style={styles.body}>
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
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
