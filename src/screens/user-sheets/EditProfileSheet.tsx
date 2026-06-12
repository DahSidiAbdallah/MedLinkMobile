import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Animated, Pressable, ScrollView, TextInput, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
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
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxxx,
    borderTopRightRadius: radius.xxxx,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  cancel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    height: 36,
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  saveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  pickerWrap: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bgSecondary,
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
          <View style={[styles.body, { paddingBottom: (insets.bottom ?? 0) + spacing.xxl }]}>
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
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
