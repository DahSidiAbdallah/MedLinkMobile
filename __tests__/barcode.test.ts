import { validateEAN13CheckDigit, normalizeBarcode, parseGs1AIs, getGtinFromAIs } from '../src/core/barcode'

describe('barcode utilities', () => {
  test('valid EAN-13 check digit', () => {
    // Example GTIN from GS1 spec
    expect(validateEAN13CheckDigit('4006381333931')).toBe(true)
  })

  test('invalid EAN-13 check digit', () => {
    expect(validateEAN13CheckDigit('4006381333930')).toBe(false)
  })

  test('UPC-A normalization to GTIN-13', () => {
    const r = normalizeBarcode('03600029145') // 11? intentionally wrong length -> should pad
    // use a 12-digit example instead
    const r2 = normalizeBarcode('036000291452')
    expect(r2.type).toBe('UPC')
    expect(r2.gtin).toBe('0036000291452')
  })

  test('EAN-13 normalization', () => {
    const r = normalizeBarcode('4006381333931')
    expect(r.type).toBe('EAN')
    expect(r.gtin).toBe('4006381333931')
  })

  test('parse GS1 AIs in parentheses format', () => {
    const payload = '(01)09501101530002(17)240101(10)LOT123'
    const ais = parseGs1AIs(payload)
    expect(ais['01']).toBe('09501101530002')
    expect(ais['17']).toBe('240101')
    expect(ais['10']).toBe('LOT123')
    const gtin = getGtinFromAIs(ais)
    // AI 01 is 14 digits -> GTIN-14; our helper will trim leading zero to 13
    expect(gtin).toBe('9501101530002')
  })
})
