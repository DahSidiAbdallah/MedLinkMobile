import { fetchWithRetries } from './network';
const OPEN_FDA = 'https://api.fda.gov';

export async function getRecallByGTINorNDC(code: string) {
  // search both GTIN and NDC; openFDA uses product_ndc for NDC searches
  const url = `${OPEN_FDA}/drug/enforcement.json?search=openfda.product_ndc:${code}&limit=1`;
  const recall = await tryJson(url);
  if (recall) return recall;
  // Some records may have gtin in openfda fields - try generic search
  const fallbackUrl = `${OPEN_FDA}/drug/enforcement.json?search=${encodeURIComponent(code)}&limit=1`;
  return await tryJson(fallbackUrl);
}

export async function getLabelingByGTINorNDC(code: string) {
  // drug labeling uses product_ndc or set_id; try product_ndc
  const url = `${OPEN_FDA}/drug/label.json?search=openfda.product_ndc:${code}&limit=1`;
  const label = await tryJson(url);
  if (label) return label;
  const fallbackUrl = `${OPEN_FDA}/drug/label.json?search=${encodeURIComponent(code)}&limit=1`;
  return await tryJson(fallbackUrl);
}

async function tryJson(url: string) {
  try {
    const resp = await fetchWithRetries(url, undefined, { retries: 2, timeoutMs: 8000 });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.results?.[0] ?? null;
  } catch (e) {
    return null;
  }
}
