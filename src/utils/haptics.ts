// Lightweight haptics wrapper: prefer Expo Haptics if present, else fallback to Vibration
let hasExpoHaptics = false
let ExpoHaptics: any = null
try {
  // dynamic require to avoid bundling errors in environments without Expo
  // eslint-disable-next-line global-require
  ExpoHaptics = require('expo-haptics')
  hasExpoHaptics = !!ExpoHaptics
} catch {}

import { Vibration } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const HAPTICS_KEY = 'settings_haptics_enabled_v1'

async function hapticsAllowed() {
  try {
    const v = await AsyncStorage.getItem(HAPTICS_KEY)
    return v !== '0'
  } catch { return true }
}

export async function hapticSuccess() {
  if (!await hapticsAllowed()) return
  if (hasExpoHaptics && ExpoHaptics.impactAsync) {
    try { ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium) } catch { Vibration.vibrate(50) }
  } else {
    Vibration.vibrate(50)
  }
}

export async function hapticTick() {
  if (!await hapticsAllowed()) return
  if (hasExpoHaptics && ExpoHaptics.notificationAsync) {
    try { ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success) } catch { Vibration.vibrate(20) }
  } else {
    Vibration.vibrate(20)
  }
}
