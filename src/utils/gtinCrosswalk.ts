import cross from '../../data/gtin_ndc_crosswalk.json'

export function lookupNdcFromGtin(gtin: string): string | null {
  if (!gtin) return null
  return (cross as Record<string, string>)[gtin] || null
}
