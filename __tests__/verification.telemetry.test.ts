jest.useRealTimers()

import { verifyScannedCode } from '../src/utils/verification'

// Mock dependent modules to simulate delays and cache hits
jest.mock('../src/utils/openfda', () => ({
  getRecallByGTINorNDC: jest.fn(async (code: string) => {
    // simulate 30ms delay
    await new Promise(r => setTimeout(r, 30))
    return { source: 'openfda', code, __cacheHit: true }
  }),
  getLabelingByGTINorNDC: jest.fn(async (code: string) => {
    await new Promise(r => setTimeout(r, 20))
    return { label: 'test', __cacheHit: false }
  }),
}))

jest.mock('../src/utils/webscraperDrugInfo', () => ({
  fetchDrugInfoFromScraper: jest.fn(async (code: string) => {
    await new Promise(r => setTimeout(r, 15))
    return { scraped: true }
  })
}))

jest.mock('../src/utils/gs1', () => ({
  parseGs1DataMatrix: jest.fn((s: string) => {
    // return a parsed gtin for datamatrix tests
    return { gtin: '09501101530002', expiry: null }
  })
}))

describe('verifyScannedCode telemetry', () => {
  let svc: any
  beforeEach(() => { svc = require('../src/core/telemetryService').createTelemetryService() })
  afterEach(async () => { svc.shutdown(); await svc.clearAndPersistForTest() })

  test('returns telemetry latencies and cacheHits for datamatrix', async () => {
    const res = await verifyScannedCode('(01)09501101530002(17)240101(10)LOT123', 'datamatrix')
    expect(res.telemetry).toBeDefined()
    const lat = res.telemetry?.latencies || {}
    const hits = res.telemetry?.cacheHits || {}
    expect(lat['getRecallByGTINorNDC']).toBeGreaterThanOrEqual(30)
    expect(lat['getLabelingByGTINorNDC']).toBeGreaterThanOrEqual(20)
    expect(hits['getRecallByGTINorNDC']).toBe(true)
  })
})
