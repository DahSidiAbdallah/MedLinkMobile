import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Animated, Pressable, StyleSheet } from 'react-native';
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
    gap: spacing.md,
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
  },
  contactCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: 4,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  contactMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  badge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary50,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  close: {
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
          <View style={styles.body}>
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
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
