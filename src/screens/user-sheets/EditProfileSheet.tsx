import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Animated, Pressable, ScrollView, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { colors, spacing } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initial: any;
};

export default function EditProfileSheet({ visible, onClose, onSave, initial }: Readonly<Props>) {
  const { t } = useTranslation();
  const anim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const [edit, setEdit] = useState(initial || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      // avoid useNativeDriver on web / when native driver is not available to prevent console warnings
      Animated.timing(anim, { toValue: 1, duration: 360, useNativeDriver: Platform.OS !== 'web' }).start();
      setEdit(initial || {});
    }
  }, [visible, initial, anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [700, 0] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
        <Animated.View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, width: '100%', maxHeight: '90%', transform: [{ translateY }], overflow: 'hidden', paddingBottom: insets.bottom ?? 0 }}>
          <View style={{ padding: 0 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <Pressable onPress={onClose} style={{ marginRight: 12 }}>
                <Text style={{ color: '#888', fontWeight: 'bold', fontSize: 16 }}>{t('common.cancel', 'Cancel')}</Text>
              </Pressable>
              <Pressable onPress={async () => { setSaving(true); await onSave(edit); setSaving(false); }} disabled={saving} style={{ backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}</Text>
              </Pressable>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, minWidth: 320, paddingBottom: (insets.bottom ?? 0) + 32 }} showsVerticalScrollIndicator={true}>
              <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: spacing.md }}>{t('common.editProfile', 'Edit Profile')}</Text>
              <Text style={{ fontWeight: '600' }}>{t('profile.fullName', 'Full name')}</Text>
              <TextInput value={edit.name} onChangeText={(v) => setEdit((e: any) => ({ ...e, name: v }))} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 12 }} />

              <Text style={{ fontWeight: '600' }}>{t('auth.phone', 'Phone')}</Text>
              <TextInput value={edit.phone} onChangeText={(v) => setEdit((e: any) => ({ ...e, phone: v }))} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 12 }} keyboardType="phone-pad" />

              <Text style={{ fontWeight: '600' }}>{t('auth.bloodType', 'Blood Type')}</Text>
              <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
                <Picker selectedValue={edit.blood_type} onValueChange={(v) => setEdit((e: any) => ({ ...e, blood_type: v }))}>
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

              {/* For brevity we keep only a compact set of edit fields here; other fields remain editable in the main app sheet */}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
