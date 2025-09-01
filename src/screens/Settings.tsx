import React, { useEffect, useState } from 'react'
import { View, Text, Switch, StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors, spacing } from '../theme'

const TELEMETRY_KEY = 'settings_telemetry_enabled_v1'
const HAPTICS_KEY = 'settings_haptics_enabled_v1'

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  label: { color: colors.text, fontSize: 16 }
})

export default function Settings() {
  const [telemetry, setTelemetry] = useState(true)
  const [haptics, setHaptics] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const t = await AsyncStorage.getItem(TELEMETRY_KEY)
        const h = await AsyncStorage.getItem(HAPTICS_KEY)
        if (!mounted) return
        setTelemetry(t !== '0')
        setHaptics(h !== '0')
      } catch {}
    }
    load()
    return () => { mounted = false }
  }, [])

  const setTelemetryToggle = async (v: boolean) => {
    setTelemetry(v)
    try { await AsyncStorage.setItem(TELEMETRY_KEY, v ? '1' : '0') } catch {}
  }
  const setHapticsToggle = async (v: boolean) => {
    setHaptics(v)
    try { await AsyncStorage.setItem(HAPTICS_KEY, v ? '1' : '0') } catch {}
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}><Text style={styles.label}>Send anonymous telemetry</Text><Switch value={telemetry} onValueChange={setTelemetryToggle} /></View>
      <View style={styles.row}><Text style={styles.label}>Enable haptics on scan success</Text><Switch value={haptics} onValueChange={setHapticsToggle} /></View>
    </View>
  )
}
