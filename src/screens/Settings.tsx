import React, { useEffect, useState } from 'react'
import { View, Text, Switch, StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors, spacing } from '../theme'
import ScreenContainer from '../components/ScreenContainer'
import Card from '../components/Card'

const TELEMETRY_KEY = 'settings_telemetry_enabled_v1'
const HAPTICS_KEY = 'settings_haptics_enabled_v1'

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
    <ScreenContainer contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.textBlock}>
            <Text style={styles.label}>Send anonymous telemetry</Text>
            <Text style={styles.description}>Share usage insights to help us improve.</Text>
          </View>
          <Switch value={telemetry} onValueChange={setTelemetryToggle} />
        </View>
      </Card>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.textBlock}>
            <Text style={styles.label}>Enable haptics</Text>
            <Text style={styles.description}>Vibrate when scans complete successfully.</Text>
          </View>
          <Switch value={haptics} onValueChange={setHapticsToggle} />
        </View>
      </Card>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  card: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  textBlock: {
    flex: 1,
    gap: 6,
  },
  label: { color: colors.text, fontSize: 16, fontWeight: '600' },
  description: { color: colors.muted, fontSize: 13 },
})
