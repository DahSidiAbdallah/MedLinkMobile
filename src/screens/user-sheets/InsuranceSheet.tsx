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
    backgroundColor: 'transparent',
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
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  item: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    lineHeight: 22,
  },
  value: {
    color: colors.textSecondary,
    fontWeight: '400',
    marginLeft: spacing.sm,
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

export default function InsuranceSheet({ visible, onClose, profile }: Readonly<Props>) {
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
            <Text style={styles.title}>{t('profile.insurance', 'Insurance')}</Text>
            {profile?.insurance_info ? (
              <>
                <Text style={styles.item}>
                  {t('profile.provider', 'Provider')}
                  <Text style={styles.value}> {profile.insurance_info.provider || t('common.notSet', 'Not set')}</Text>
                </Text>
                <Text style={styles.item}>
                  {t('profile.policyNumber', 'Policy #')}
                  <Text style={styles.value}> {profile.insurance_info.policy_number || t('common.notSet', 'Not set')}</Text>
                </Text>
              </>
            ) : (
              <Text style={styles.description}>{t('profile.noInsuranceInfo', 'No insurance info.')}</Text>
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
