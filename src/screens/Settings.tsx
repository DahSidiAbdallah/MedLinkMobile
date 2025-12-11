import React, { useEffect, useState } from 'react'
import { View, Text, Switch, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
// Guard AsyncStorage: require lazily to avoid module-eval crashes on some runtimes
let AsyncStorage: any = null;
function getAsyncStorage() {
  if (AsyncStorage) return AsyncStorage;
  try {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (e) {
    // fallback minimal in-memory implementation
    const store: Record<string, string> = {};
    AsyncStorage = {
      getItem: async (k: string) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
      setItem: async (k: string, v: string) => { store[k] = v; },
      removeItem: async (k: string) => { delete store[k]; },
    };
  }
  return AsyncStorage;
}
import { colors, spacing } from '../theme'
import ScreenContainer from '../components/ScreenContainer'
import Card from '../components/Card'

const TELEMETRY_KEY = 'settings_telemetry_enabled_v1'
const HAPTICS_KEY = 'settings_haptics_enabled_v1'

export default function Settings() {
  const { t } = useTranslation()
  const [telemetry, setTelemetry] = useState(true)
  const [haptics, setHaptics] = useState(true)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const storage = getAsyncStorage();
        const t = await storage.getItem(TELEMETRY_KEY)
        const h = await storage.getItem(HAPTICS_KEY)
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
    try {
      await getAsyncStorage().setItem(TELEMETRY_KEY, v ? '1' : '0')
      setSaveMessage('Telemetry setting saved')
      setTimeout(() => setSaveMessage(null), 2000)
    } catch (e) {
      setSaveMessage('Failed to save setting')
      setTimeout(() => setSaveMessage(null), 2000)
    }
  }
  const setHapticsToggle = async (v: boolean) => {
    setHaptics(v)
    try {
      await getAsyncStorage().setItem(HAPTICS_KEY, v ? '1' : '0')
      setSaveMessage('Haptics setting saved')
      setTimeout(() => setSaveMessage(null), 2000)
    } catch (e) {
      setSaveMessage('Failed to save setting')
      setTimeout(() => setSaveMessage(null), 2000)
    }
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      {saveMessage && (
        <View style={styles.saveMessageBanner}>
          <Text style={styles.saveMessageText}>{saveMessage}</Text>
        </View>
      )}
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.textBlock}>
            <Text style={styles.label}>{t('settings.sendAnonymousTelemetry', 'Send anonymous telemetry')}</Text>
            <Text style={styles.description}>Share usage insights to help us improve.</Text>
          </View>
          <Switch value={telemetry} onValueChange={setTelemetryToggle} />
        </View>
      </Card>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.textBlock}>
            <Text style={styles.label}>{t('settings.enableHaptics', 'Enable haptics')}</Text>
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
  saveMessageBanner: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  saveMessageText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
