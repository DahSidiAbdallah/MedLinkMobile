import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Animated, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  profile: any;
};

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
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <Animated.View style={{ backgroundColor: colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24, width: '100%', maxHeight: '80%', transform: [{ translateY }] }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: spacing.md }}>{t('profile.emergencyContacts', 'Emergency Contacts')}</Text>
          {profile?.emergency_contacts && profile.emergency_contacts.length > 0 ? profile.emergency_contacts.map((c: any, i: number) => (
            <View key={c.id || i} style={{ marginBottom: 10 }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{c.name}</Text>
              <Text style={{ color: colors.muted }}>{c.relationship}</Text>
              <Text style={{ color: colors.muted }}>{c.phone}</Text>
              {c.isICE && <Text style={{ color: colors.primary, fontWeight: '600' }}>{t('profile.ice', 'ICE')}</Text>}
            </View>
          )) : <Text style={{ color: colors.muted }}>{t('profile.noEmergencyContacts', 'No emergency contacts')}</Text>}
          <Pressable style={{ paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginTop: spacing.lg }} onPress={() => { Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(onClose); }}>
            <Text style={{ color: colors.card, fontWeight: 'bold', textAlign: 'center' }}>{t('common.close', 'Close')}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
