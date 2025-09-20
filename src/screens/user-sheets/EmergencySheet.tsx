import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Animated, Pressable, StyleSheet } from 'react-native';
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
    gap: spacing.md,
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
  },
  contactCard: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  contactName: {
    fontWeight: '700',
    color: colors.text,
  },
  contactMeta: {
    color: colors.muted,
  },
  badge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37,99,235,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.primary,
    fontWeight: '600',
  },
  close: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  closeText: {
    color: colors.card,
    fontWeight: '700',
  },
});

export default function EmergencySheet({ visible, onClose, profile }: Readonly<Props>) {
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
            <Text style={styles.title}>{t('profile.emergencyContacts', 'Emergency Contacts')}</Text>
            {profile?.emergency_contacts && profile.emergency_contacts.length > 0 ? (
              profile.emergency_contacts.map((c: any, i: number) => (
                <View key={c.id || i} style={styles.contactCard}>
                  <Text style={styles.contactName}>{c.name}</Text>
                  <Text style={styles.contactMeta}>{c.relationship}</Text>
                  <Text style={styles.contactMeta}>{c.phone}</Text>
                  {c.isICE ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{t('profile.ice', 'ICE')}</Text>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={styles.contactMeta}>{t('profile.noEmergencyContacts', 'No emergency contacts')}</Text>
            )}
            <Pressable style={styles.close} onPress={() => {
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
