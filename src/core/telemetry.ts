type LookupLatencies = Record<string, number | undefined>

export type ScanTelemetry = {
  scanType: string
  decodeTimeMs?: number
  lookupLatencyMs?: LookupLatencies
  cacheHit?: boolean
  lookupSuccess?: boolean
  errorCodes?: string[]
  timestamp?: number
}

const store: ScanTelemetry[] = []

export function recordScanTelemetry(t: ScanTelemetry) {
  const entry = { timestamp: Date.now(), ...t }
  store.push(entry)
  return entry
}

export function getTelemetry() { return [...store] }

export function clearTelemetry() { store.length = 0 }
