import fs from 'fs'
import path from 'path'

const FIXTURES_DIR = path.resolve(__dirname, '..', 'tests', 'fixtures', 'check-meds')

function loadFixture(barcode: string) {
  const p = path.join(FIXTURES_DIR, `${barcode}.json`)
  if (!fs.existsSync(p)) throw new Error('Missing fixture: ' + p)
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

describe('fixture-driven verification (recorded API responses)', () => {
  const barcodes = ['3400933071998', '3400936864986', '5024071210002', '312843536371']

  beforeEach(() => {
    // reset jest module registry so our mocks reapply cleanly
    jest.resetModules()
  })

  test.each(barcodes)('verify using fixture for %s', async (bc) => {
    const fixture = loadFixture(bc)
    // Mock the modules used by verification to return fixture data
    jest.mock('../src/utils/gs1', () => ({
      parseGs1DataMatrix: (data: string) => ({ gtin: data, expiry: null })
    }))
    jest.mock('../src/utils/gs1DigitalLink', () => ({
      resolveDigitalLink: async (gtin: string) => null
    }))
    jest.mock('../src/utils/localRecalls', () => ({ findLocalRecall: (code: string) => null }))

    // openfda module: return the recorded label if present
    jest.mock('../src/utils/openfda', () => ({
      getRecallByGTINorNDC: async (code: string) => null,
      getLabelingByGTINorNDC: async (code: string) => {
        // fixture.label.label may be null
        return fixture.label?.label ?? null
      }
    }))

    jest.mock('../src/utils/openfdaDrugInfo', () => ({
      fetchDrugLabelByNDC: async (code: string) => null
    }))
    jest.mock('../src/utils/webscraperDrugInfo', () => ({
      fetchDrugInfoFromScraper: async (code: string) => null
    }))
    jest.mock('../src/utils/codeUtils', () => ({
      normalizeGtinTo14: (s: string) => s.padStart(14, '0'),
      normalizeNdc: (s: string) => s,
    }))

    // Re-import verification after setting up mocks
    const { verifyScannedCode: verify } = await import('../src/utils/verification')
    const res = await verify(bc, 'datamatrix')

    // Expectations derived from fixture: when label is missing, UI should get no labelInfo
  const fixtureHasLabel = !!fixture.label?.label
    if (fixtureHasLabel) {
      expect(res.label).toBeTruthy()
    } else {
      // No label found in fixtures; verification should reflect that
      expect(res.label).toBeNull()
      // Preferred UI message when no label/info exists
      expect(res.message).toMatch(/No authenticity data available|No drug information found|Unrecognized code format|Product recalled|Product expired/)
    }

    // telemetry must be present
    expect(res.telemetry).toBeDefined()
  })
})
