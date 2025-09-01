// Lightweight barcode normalization, EAN-13 check digit validation, and GS1 AI parsing helpers.
// Meant as a small, dependency-free reference implementation for the app's normalization layer.

export type BarcodeType = 'EAN' | 'UPC' | 'DATAMATRIX' | 'UNKNOWN'

export interface NormalizeResult {
  raw: string
  type: BarcodeType
  gtin?: string // canonical GTIN-13 when available
}

// validate EAN-13 check digit
export function validateEAN13CheckDigit(gtin13: string): boolean {
  if (!/^\d{13}$/.test(gtin13)) return false
  const digits = gtin13.split('').map(d => parseInt(d, 10))
  const check = digits[12]
  const sum = digits.slice(0, 12).reduce((acc, d, i) => {
    // positions: leftmost is index 0 — weights alternate 1,3 starting from left
    const weight = (i % 2 === 0) ? 1 : 3
    return acc + d * weight
  }, 0)
  const calcCheck = (10 - (sum % 10)) % 10
  return calcCheck === check
}

// Normalize raw barcode string to a canonical GTIN-13 when possible and detect type
export function normalizeBarcode(raw: string): NormalizeResult {
  const cleaned = raw.replace(/\s|\r|\n|\t/g, '')

  // DataMatrix often contains non-numeric GS1 payloads which include parentheses or FNC1 separators.
  const hasFnc1 = cleaned.indexOf(String.fromCharCode(29)) !== -1
  const isGs1Like = /\(01\)|\(17\)|\(10\)/.test(cleaned)
  if (hasFnc1 || isGs1Like) {
    // Treat as DataMatrix GS1 payload
    return { raw: cleaned, type: 'DATAMATRIX' }
  }

  // Numeric-only barcodes
  if (/^\d{12}$/.test(cleaned)) {
    // UPC-A 12-digit -> GTIN-13 by prepending 0
    const gtin13 = '0' + cleaned
    return { raw: cleaned, type: 'UPC', gtin: gtin13 }
  }

  if (/^\d{13}$/.test(cleaned)) {
    return { raw: cleaned, type: 'EAN', gtin: cleaned }
  }

  // Some scanners deliver EAN with leading zeros trimmed; attempt to pad to 13 when 8 or fewer digits
  if (/^\d{8,12}$/.test(cleaned)) {
    const padded = cleaned.padStart(13, '0')
    return { raw: cleaned, type: 'EAN', gtin: padded }
  }

  return { raw: cleaned, type: 'UNKNOWN' }
}

// Parse GS1 AI pairs from a DataMatrix or GS1 string payload.
// Supports parentheses notation (01)095... and FNC1 separator (ASCII 29) formats.
export function parseGs1AIs(payload: string): Record<string, string> {
  const result: Record<string, string> = {}

  // If payload contains FNC1, split groups on it. FNC1 is ASCII 29.
  const fnc1 = String.fromCharCode(29)
  if (payload.indexOf(fnc1) >= 0) {
    Object.assign(result, parseFnc1Parts(payload))
    return result
  }

// Helper to parse FNC1-separated groups into AI map
function parseFnc1Parts(payload: string): Record<string, string> {
  const out: Record<string, string> = {}
  const fnc1 = String.fromCharCode(29)
  const parts = payload.split(fnc1).filter(Boolean)
  const knownAIs = ['01', '17', '10']
  for (const part of parts) {
    let matched = false
    for (const ai of knownAIs) {
      if (part.startsWith(ai)) {
        out[ai] = part.slice(ai.length)
        matched = true
        break
      }
    }
    if (!matched) {
      const m = /^(\d{2,4})(.*)$/.exec(part)
      if (m) out[m[1]] = m[2]
    }
  }
  return out
}

  // Parentheses format: (01)095... (17)240101
  const re = /\((\d{2,4})\)([^()]*)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(payload)) !== null) {
    result[m[1]] = m[2]
  }

  // Best-effort heuristics when no parentheses or FNC1 used.
  if (Object.keys(result).length === 0) {
    Object.assign(result, extractGs1Heuristics(payload))
  }

  return result
}

// Helper performing best-effort heuristics for common AIs when no explicit separators present.
function extractGs1Heuristics(payload: string): Record<string, string> {
  const out: Record<string, string> = {}
  const idx01 = payload.indexOf('01')
  if (idx01 >= 0 && payload.length >= idx01 + 16) {
    out['01'] = payload.slice(idx01 + 2, idx01 + 16)
  }
  const idx17 = payload.indexOf('17')
  if (idx17 >= 0 && payload.length >= idx17 + 8) {
    out['17'] = payload.slice(idx17 + 2, idx17 + 8)
  }
  const idx10 = payload.indexOf('10')
  if (idx10 >= 0) {
    out['10'] = payload.slice(idx10 + 2)
  }
  return out
}

// Helper: extract GTIN from parsed AI map if present
export function getGtinFromAIs(ais: Record<string, string>): string | undefined {
  if (ais['01']) {
    // AI 01 is normally 14 digits (GTIN-14). Convert to GTIN-13 where appropriate by trimming leading zero.
    const v = ais['01']
    if (/^\d{14}$/.test(v)) {
      // If leading zero, trim to 13
      if (v.startsWith('0')) return v.slice(1)
      return v
    }
    if (/^\d{13}$/.test(v)) return v
  }
  return undefined
}

// Minimal confidence scoring helper
export function confidenceFromSources(hasGs1: boolean, hasRxNorm: boolean, hasOpenFda: boolean): 'high' | 'low' {
  if (hasGs1 && (hasRxNorm || hasOpenFda)) return 'high'
  if (hasGs1) return 'low'
  if (hasRxNorm) return 'low'
  return 'low'
}
