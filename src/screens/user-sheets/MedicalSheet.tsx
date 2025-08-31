import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Animated, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  profile: any;
};

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
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
        <Animated.View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24, width: '100%', maxHeight: '80%', transform: [{ translateY }] }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: spacing.md }}>{t('profile.medicalId', 'Medical ID')}</Text>
          <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>{t('auth.bloodType', 'Blood Type')}: <Text style={{ color: colors.muted }}>{profile?.blood_type || t('common.notSet', 'Not set')}</Text></Text>
          <Text style={{ color: colors.text, fontWeight: '600', marginTop: 10, marginBottom: 6 }}>{t('auth.allergies', 'Allergies')}:</Text>
          {profile?.allergies && profile.allergies.length > 0 ? profile.allergies.map((a: string) => <Text key={a} style={{ color: colors.muted, marginLeft: 8 }}>• {a}</Text>) : <Text style={{ color: colors.muted, marginLeft: 8 }}>{t('common.none', 'None')}</Text>}
          <Text style={{ color: colors.text, fontWeight: '600', marginTop: 10, marginBottom: 6 }}>{t('auth.medicalConditions', 'Medical Conditions')}:</Text>
          {profile?.medical_conditions && profile.medical_conditions.length > 0 ? profile.medical_conditions.map((c: string) => <Text key={c} style={{ color: colors.muted, marginLeft: 8 }}>• {c}</Text>) : <Text style={{ color: colors.muted, marginLeft: 8 }}>{t('common.none', 'None')}</Text>}
          <Text style={{ color: colors.text, fontWeight: '600', marginTop: 10, marginBottom: 6 }}>{t('auth.medications', 'Medications')}:</Text>
          {profile?.medications && profile.medications.length > 0 ? profile.medications.map((m: string) => <Text key={m} style={{ color: colors.muted, marginLeft: 8 }}>• {m}</Text>) : <Text style={{ color: colors.muted, marginLeft: 8 }}>{t('common.none', 'None')}</Text>}
          <Pressable style={{ paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginTop: spacing.lg }} onPress={() => { Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(onClose); }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>{t('common.close', 'Close')}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
