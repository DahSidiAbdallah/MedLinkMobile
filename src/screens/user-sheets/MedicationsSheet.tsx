import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Animated, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../../theme';
import MyMedicationsList from '../../components/MyMedicationsList';

type Props = {
  visible: boolean;
  onClose: () => void;
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
    maxHeight: '88%',
  },
  gradient: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  close: {
    color: colors.muted,
    fontWeight: '600',
  },
  listWrap: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
});

export default function MedicationsSheet({ visible, onClose }: Readonly<Props>) {
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
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <LinearGradient colors={colors.subtleGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>{t('profile.myMedications', 'My Medications')}</Text>
              <Pressable onPress={() => {
                Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(onClose);
              }} hitSlop={10}>
                <Text style={styles.close}>{t('common.close', 'Close')}</Text>
              </Pressable>
            </View>
            <View style={styles.listWrap}>
              <MyMedicationsList />
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}
