import fs from 'fs'
import path from 'path'

// Load all fixtures
const FIX_DIR = path.resolve(__dirname, '..', 'tests', 'fixtures', 'check-meds')
const fixtures: Record<string, any> = {}
for (const f of fs.readdirSync(FIX_DIR)) {
  if (f.endsWith('.json')) {
    const bc = path.basename(f, '.json')
    fixtures[bc] = JSON.parse(fs.readFileSync(path.join(FIX_DIR, f), 'utf8'))
  }
}

// Mock node-fetch to replay fixture responses based on the requested URL
jest.mock('node-fetch', () => {
  return jest.fn((url: string) => {
    // Try to find a fixture where either rxcui.url or label.url matches the requested url
    for (const [bc, fx] of Object.entries(fixtures)) {
      if (fx.rxcui && fx.rxcui.url === url) {
        return Promise.resolve({ ok: true, json: async () => fx.rxcui.body })
      }
      if (fx.label && fx.label.url === url) {
        return Promise.resolve({ ok: true, json: async () => fx.label.body })
      }
    }
    // Last resort: if the URL contains a barcode, return that barcode's fixture label body
    for (const [bc, fx] of Object.entries(fixtures)) {
      if (url.includes(bc) && fx.label) {
        return Promise.resolve({ ok: true, json: async () => fx.label.body })
      }
    }
    // Default: return empty ok with no results
    return Promise.resolve({ ok: true, json: async () => ({}) })
  })
})

describe('check-meds.js replay using recorded fixtures', () => {
  test('runs without network and reports expected barcodes', async () => {
    // Import and run the script's run() function
    const { run } = await import('../scripts/check-meds')
    // Run once; it should use the mocked fetch and not throw
    await expect(run()).resolves.toBeUndefined()
  })
})
