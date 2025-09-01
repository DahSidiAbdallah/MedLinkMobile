import { verifyScannedCode } from '../src/utils/verification'

// Mock external modules used by verification.ts
jest.mock('../src/utils/gs1', () => ({
  parseGs1DataMatrix: (data: string) => {
    // Return a parsed GS1 structure if the test passes the barcode directly
  // Simulate expiry for a special test barcode
  if (data === 'EXPIRED_GTIN_0001') return { gtin: '0000000000001', expiry: new Date(Date.now() - 1000 * 60 * 60 * 24) }
  return { gtin: data, expiry: null }
  }
}))

jest.mock('../src/utils/gs1DigitalLink', () => ({
  resolveDigitalLink: async (gtin: string) => {
    // Simulate a DL resolution for one of the barcodes
  if (gtin === '3400933071998') return { brand: 'Doliprane', resource: '/product/1', __cacheHit: true }
  if (gtin === '3400936864986') return { brand: 'Nurofen', resource: '/product/2' }
    return null
  }
}))

jest.mock('../src/utils/openfda', () => ({
  getRecallByGTINorNDC: async (code: string) => null,
  getLabelingByGTINorNDC: async (code: string) => {
    // Provide a minimal label object for certain codes
    if (code.includes('3400933071998')) return { brand_name: 'Doliprane', indications: 'Pain relief' }
    if (code.includes('3400936864986')) return { brand_name: 'Nurofen', indications: 'NSAID' }
    if (code.includes('5024071210002')) return { brand_name: 'Paracetamol', indications: 'Analgesic' }
    if (code.includes('312843536371')) return { brand_name: 'Bayer Aspirin', indications: 'Antiplatelet' }
  // Simulate a recall from openfda for a special code
  if (code.includes('LOCAL_RECALL_123')) return { recall: true, source: 'OpenFDA' }
    return null
  }
}))

jest.mock('../src/utils/openfdaDrugInfo', () => ({
  fetchDrugLabelByNDC: async (code: string) => null
}))

jest.mock('../src/utils/webscraperDrugInfo', () => ({
  fetchDrugInfoFromScraper: async (code: string) => {
    if (code.includes('5024071210002')) return { indications: 'Generic paracetamol info' }
    return null
  }
}))

jest.mock('../src/utils/localRecalls', () => ({
  findLocalRecall: (code: string) => {
    if (code === 'LOCAL_RECALL_123') return { source: 'LocalDB', reason: 'Test recall' }
    return null
  }
}))

jest.mock('../src/utils/codeUtils', () => ({
  normalizeGtinTo14: (s: string) => s.padStart(14, '0'),
  normalizeNdc: (s: string) => s,
}))


describe('integration: verifyScannedCode (mocked lookups)', () => {
  const barcodes = [
    '3400933071998', // Doliprane (DL cache hit)
    '3400936864986', // Nurofen
    '5024071210002', // Paracetamol generic
    '312843536371',  // Bayer Aspirin (UPC)
    'EXPIRED_GTIN_0001', // simulated expired GTIN
    'LOCAL_RECALL_123', // simulated local recall
  ]

  test.each(barcodes)('verifies lookup flow for %s', async (bc) => {
    const res = await verifyScannedCode(bc, 'datamatrix')
    expect(res).toBeDefined()
    // We expect either label or webscraper info depending on mock implementation
    const hasLabel = !!res.label
    const hasWeb = !!res.webscraperInfo
    expect(hasLabel || hasWeb || res.recall || res.message).toBeTruthy()
    // telemetry should exist
    expect(res.telemetry).toBeDefined()
    expect(typeof res.message).toBe('string')
  })
})
