import { parseGs1AIs, getGtinFromAIs, normalizeBarcode } from '../src/core/barcode'
import { createTelemetryService } from '../src/core/telemetryService'

describe('GS1 edge cases and telemetry', () => {
  let svc: any
  beforeEach(() => { svc = createTelemetryService() })
  afterEach(async () => {
    svc.shutdown()
    await svc.clearAndPersistForTest()
  })

  test('parse FNC1-separated payload', () => {
    const fnc1 = String.fromCharCode(29)
    const payload = '01' + '09501101530002' + fnc1 + '17' + '240101' + fnc1 + '10' + 'LOT123'
    const ais = parseGs1AIs(payload)
    expect(ais['01']).toBe('09501101530002')
    expect(ais['17']).toBe('240101')
    expect(ais['10']).toBe('LOT123')
    const gtin = getGtinFromAIs(ais)
    expect(gtin).toBe('9501101530002')
  })

  test('variable-length AI 10 parsing when parentheses absent', () => {
    const payload = '01095011015300021724010110LOT-123-XYZ'
    const ais = parseGs1AIs(payload)
    // Heuristic parser should find 01 and 17 and variable 10
    expect(ais['01']).toBeDefined()
    expect(ais['17']).toBeDefined()
    expect(ais['10']).toBeDefined()
  })

  test('malformed data does not throw and is normalized to UNKNOWN', () => {
    const r = normalizeBarcode('@@@INVALID@@@')
    expect(r.type).toBe('UNKNOWN')
  })

  test('telemetry records scans', () => {
  svc.record({ scanType: 'EAN', decodeTimeMs: 50, lookupSuccess: true })
  const all = svc.getQueue()
  expect(all.length).toBeGreaterThanOrEqual(1)
  expect(all[0].decodeTimeMs).toBe(50)
  })
})
