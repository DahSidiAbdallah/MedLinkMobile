import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Animated, Pressable, ScrollView, TextInput, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initial: any;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  gradient: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  cancel: {
    color: colors.muted,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  saveText: {
    color: colors.card,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  label: {
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.15)',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.15)',
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.muted,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryText: {
    color: colors.card,
    fontWeight: '700',
  },
});

export default function EditProfileSheet({ visible, onClose, onSave, initial }: Readonly<Props>) {
  const { t } = useTranslation();
  const anim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const [edit, setEdit] = useState(initial || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 360, useNativeDriver: Platform.OS !== 'web' }).start();
      setEdit(initial || {});
    }
  }, [visible, initial, anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [700, 0] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <LinearGradient
            colors={colors.subtleGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, { paddingBottom: (insets.bottom ?? 0) + spacing.xxl }]}
          >
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Pressable onPress={onClose} hitSlop={10}>
                <Text style={styles.cancel}>{t('common.cancel', 'Cancel')}</Text>
              </Pressable>
              <Text style={styles.headerTitle}>{t('common.editProfile', 'Edit Profile')}</Text>
              <Pressable
                onPress={async () => {
                  setSaving(true);
                  await onSave(edit);
                  setSaving(false);
                }}
                disabled={saving}
                style={[styles.saveButton, saving && { opacity: 0.7 }]}
              >
                <Text style={styles.saveText}>{saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}</Text>
              </Pressable>
            </View>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View>
                <Text style={styles.label}>{t('profile.fullName', 'Full name')}</Text>
                <TextInput
                  value={edit.name}
                  onChangeText={v => setEdit((e: any) => ({ ...e, name: v }))}
                  style={styles.input}
                />
              </View>
              <View>
                <Text style={styles.label}>{t('auth.phone', 'Phone')}</Text>
                <TextInput
                  value={edit.phone}
                  onChangeText={v => setEdit((e: any) => ({ ...e, phone: v }))}
                  style={styles.input}
                  keyboardType="phone-pad"
                />
              </View>
              <View>
                <Text style={styles.label}>{t('auth.bloodType', 'Blood Type')}</Text>
                <View style={styles.pickerWrap}>
                  <Picker selectedValue={edit.blood_type} onValueChange={v => setEdit((e: any) => ({ ...e, blood_type: v }))}>
                    <Picker.Item label={t('common.notSet', 'Not set')} value={''} />
                    <Picker.Item label="A+" value="A+" />
                    <Picker.Item label="A-" value="A-" />
                    <Picker.Item label="B+" value="B+" />
                    <Picker.Item label="B-" value="B-" />
                    <Picker.Item label="AB+" value="AB+" />
                    <Picker.Item label="AB-" value="AB-" />
                    <Picker.Item label="O+" value="O+" />
                    <Picker.Item label="O-" value="O-" />
                  </Picker>
                </View>
              </View>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}
