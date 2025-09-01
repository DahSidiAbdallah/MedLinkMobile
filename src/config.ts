// Centralized config: read from Expo Constants manifest.extra when available, fallback to process.env
let extras: Record<string, any> = {}
try {
  // dynamic require to avoid breaking node tests
  // eslint-disable-next-line global-require
  const Constants = require('expo-constants')
  extras = (Constants?.manifest?.extra) || (Constants?.expoConfig?.extra) || {}
} catch {}

export const CONFIG = {
  GS1_DIGITAL_LINK_ENDPOINT: extras.GS1_DIGITAL_LINK_ENDPOINT || process.env.GS1_DIGITAL_LINK_ENDPOINT || 'https://id.gs1.org/01',
  GS1_DIGITAL_LINK_AUTH_TOKEN: extras.GS1_DIGITAL_LINK_AUTH_TOKEN || process.env.GS1_DIGITAL_LINK_AUTH_TOKEN || null,
  TELEMETRY_ENDPOINT: extras.TELEMETRY_ENDPOINT || process.env.TELEMETRY_ENDPOINT || 'https://example.com/telemetry',
}

export default CONFIG
