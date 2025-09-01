import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Platform, UIManager, Modal, Pressable, AccessibilityInfo } from 'react-native'
import { colors } from '../theme'
import { summarizeText, safeJoinArrayField } from '../utils/textHelpers'

type Props = {
  labelInfo?: { indications?: string; dosage?: string; sideEffects?: string } | null
  label?: any
  truncateLimit?: number
}

const FieldBlock: React.FC<{ title: string; raw: string; fieldKey: string; limit: number; onOpenModal: (title: string, content: string) => void }>= ({ title, raw, fieldKey, limit, onOpenModal }) => {
  const { display, truncated, remainder } = summarizeText(raw, limit)
  // local expansion state is now handled by modal
  // Enable LayoutAnimation on Android
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    // safe to call multiple times
    // @ts-ignore
    UIManager.setLayoutAnimationEnabledExperimental(true)
  }
  return (
    <View style={{ marginTop: 6 }}>
      <Text style={{ fontWeight: 'bold', color: colors.primary }}>{title}</Text>
      <Text style={{ color: colors.text }}>{display}{truncated ? '…' : ''}</Text>
      {truncated && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Read more about ${title}`}
          onPress={() => {
            // announce and open modal via parent
            try { AccessibilityInfo.announceForAccessibility(`Opening details for ${title}`) } catch {}
            onOpenModal(title, `${display}${remainder}`)
          }}
          style={{ marginTop: 6 }}
        >
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Read more</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const LabelInfoView: React.FC<Props> = ({ labelInfo, label, truncateLimit = 300 }) => {
  const indicationsRaw = (labelInfo?.indications ?? safeJoinArrayField(label?.indications_and_usage)) || safeJoinArrayField(label?.indications)
  const dosageRaw = (labelInfo?.dosage ?? safeJoinArrayField(label?.dosage_and_administration)) || safeJoinArrayField(label?.dosage)
  const sideEffectsRaw = (labelInfo?.sideEffects ?? safeJoinArrayField(label?.adverse_reactions)) || safeJoinArrayField(label?.adverse)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalContent, setModalContent] = useState('')

  function openModal(title: string, content: string) {
    setModalTitle(title)
    setModalContent(content)
    setModalVisible(true)
  }

  function closeModal() {
    setModalVisible(false)
    setModalTitle('')
    setModalContent('')
  }

  return (
    <View>
      <FieldBlock title="Indications & Usage" raw={indicationsRaw || 'N/A'} fieldKey="indications" limit={truncateLimit} onOpenModal={openModal} />
      <FieldBlock title="Dosage & Administration" raw={dosageRaw || 'N/A'} fieldKey="dosage" limit={truncateLimit} onOpenModal={openModal} />
      <FieldBlock title="Adverse Reactions" raw={sideEffectsRaw || 'N/A'} fieldKey="sideEffects" limit={truncateLimit} onOpenModal={openModal} />

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeModal}
        transparent={false}
        accessibilityViewIsModal
      >
        <View style={{ flex: 1, padding: 20, backgroundColor: 'white' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>{modalTitle}</Text>
          <Text style={{ color: colors.text, flex: 1 }}>{modalContent}</Text>
          <Pressable accessibilityRole="button" onPress={closeModal} style={{ marginTop: 20 }}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  )
}

export default LabelInfoView
