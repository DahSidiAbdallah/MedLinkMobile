import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Animated, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius } from '../../theme';
import MyMedicationsList from '../../components/MyMedicationsList';

type Props = {
  visible: boolean;
  onClose: () => void;
};

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
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <Animated.View style={{ backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: 32, paddingHorizontal: 20, minHeight: '50%', maxHeight: '90%', overflow: 'hidden', transform: [{ translateY }] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 22, color: colors.text }}>{t('profile.myMedications', 'My Medications')}</Text>
            <Pressable onPress={() => { Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(onClose); }} hitSlop={10}>
              <Text style={{ color: colors.muted, fontWeight: '600', fontSize: 16 }}>{t('common.close', 'Close')}</Text>
            </Pressable>
          </View>
          <MyMedicationsList />
        </Animated.View>
      </View>
    </Modal>
  );
}
