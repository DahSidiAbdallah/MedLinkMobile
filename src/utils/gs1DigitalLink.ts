import AsyncStorage from '@react-native-async-storage/async-storage'
import CONFIG from '../config'

const CACHE_PREFIX = 'gs1_dl_cache_v1_'
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function resolveDigitalLink(gtin: string, ttlMs = DEFAULT_TTL_MS): Promise<Record<string, any> | null> {
  if (!gtin) return null
  const key = `${CACHE_PREFIX}${gtin}`
  try {
    const raw = await AsyncStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.ts && (Date.now() - parsed.ts) < ttlMs) {
        return parsed.value
      }
    }
  } catch (e) {
    // ignore cache parse errors
  }

  // Best-effort resolver: Digital Link canonical resource using GS1 ID resolver pattern.
  // Many implementations expose resolver endpoints; this does a simple GET to a predictable path.
  // In tests we mock fetch so this is safe to call.
  try {
  const base = (CONFIG.GS1_DIGITAL_LINK_ENDPOINT || 'https://id.gs1.org/01').replace(/\/$/, '')
  const url = `${base}/${gtin}`
    const headers: any = { Accept: 'application/json' }
    try {
      const cfg = require('../config').default
      if (cfg?.GS1_DIGITAL_LINK_AUTH_TOKEN) headers['Authorization'] = `Bearer ${cfg.GS1_DIGITAL_LINK_AUTH_TOKEN}`
    } catch {}
    const resp = await fetch(url, { method: 'GET', headers })
    if (!resp.ok) return null
    const value = await resp.json()
    try {
      await AsyncStorage.setItem(key, JSON.stringify({ ts: Date.now(), value }))
    } catch {}
    return value
  } catch (e) {
    return null
  }
}
