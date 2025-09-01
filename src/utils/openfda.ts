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
  // If code looks like an NDC (10 or 11 digits), search by product_ndc
  if (/^\d{10,11}$/.test(code)) {
    const url = `${OPEN_FDA}/drug/label.json?search=openfda.product_ndc:${code}&limit=1`;
    const label = await tryJson(url);
    if (label) return label;
  }
  // If code looks like a GTIN (8-14 digits), try extracting plausible NDC-like tails
  if (/^\d{8,14}$/.test(code)) {
    // Try last 11 digits (common UPC/NDC 11-digit form), then 10-digit
    const tails = [11, 10, 9].map(n => code.slice(-n)).filter(t => t.length >= 10 && t.length <= 11)
    for (const t of tails) {
      const url = `${OPEN_FDA}/drug/label.json?search=openfda.product_ndc:${t}&limit=1`;
      const label = await tryJson(url);
      if (label) return label;
    }
  }
  // generic fallback: try a literal search for the code anywhere (less precise)
  const fallbackUrl = `${OPEN_FDA}/drug/label.json?search=${encodeURIComponent(code)}&limit=1`;
  return await tryJson(fallbackUrl);
}

// Try to find labeling by brand or generic name tokens when available.
export async function getLabelingByName(name: string) {
  if (!name) return null;
  // Use the brand name field first with exact phrase matching
  const brand = name.split(/\s+/)[0];
  const q1 = `${OPEN_FDA}/drug/label.json?search=openfda.brand_name:%22${encodeURIComponent(brand)}%22&limit=1`;
  const res1 = await tryJson(q1);
  if (res1) return res1;
  // Try generic name field
  const q2 = `${OPEN_FDA}/drug/label.json?search=openfda.generic_name:%22${encodeURIComponent(brand)}%22&limit=1`;
  const res2 = await tryJson(q2);
  if (res2) return res2;
  // Last resort: search the brand token in the full text
  const q3 = `${OPEN_FDA}/drug/label.json?search=${encodeURIComponent(brand)}&limit=1`;
  return await tryJson(q3);
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
