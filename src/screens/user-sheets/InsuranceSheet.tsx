import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Animated, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  profile: any;
};

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
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
        <Animated.View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24, width: '100%', maxHeight: '80%', transform: [{ translateY }] }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: spacing.md }}>{t('profile.insurance', 'Insurance')}</Text>
          {profile?.insurance_info ? (
            <>
              <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>{t('profile.provider', 'Provider')}: <Text style={{ color: colors.muted }}>{profile.insurance_info.provider || t('common.notSet', 'Not set')}</Text></Text>
              <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>{t('profile.policyNumber', 'Policy #')}: <Text style={{ color: colors.muted }}>{profile.insurance_info.policy_number || t('common.notSet', 'Not set')}</Text></Text>
            </>
          ) : <Text style={{ color: colors.muted }}>{t('profile.noInsuranceInfo', 'No insurance info.')}</Text>}
          <Pressable style={{ paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginTop: spacing.lg }} onPress={() => { Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(onClose); }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>{t('common.close', 'Close')}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
