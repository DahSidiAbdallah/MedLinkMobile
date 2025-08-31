import { fetchWithRetries } from './network';

export interface DrugLabelInfo {
  indications?: string;
  dosage?: string;
  sideEffects?: string;
}

export async function fetchDrugLabelByNDC(ndc: string): Promise<DrugLabelInfo | null> {
  // openFDA expects the NDC without hyphens (10 or 11 digits)
  const url = `https://api.fda.gov/drug/label.json?search=openfda.product_ndc:${ndc}&limit=1`;
  try {
    const resp = await fetchWithRetries(url, undefined, { retries: 2, timeoutMs: 8000 });
    if (!resp.ok) return null;
    const data = await resp.json();
    const result = data.results?.[0];
    if (!result) return null;

    // Extract relevant fields; they are arrays of strings
    const info: DrugLabelInfo = {
      indications: result.indications_and_usage?.[0],
      dosage: result.dosage_and_administration?.[0],
      sideEffects: result.adverse_reactions?.[0]
    };
    return info;
  } catch (e) {
    console.warn('openFDA request failed:', e);
    return null;
  }
}
