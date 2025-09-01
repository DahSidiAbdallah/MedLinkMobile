import { fetchWithRetries } from './network';
import { findRxcuiByName } from './rxnorm';
import { lookupNdcFromGtin } from './gtinCrosswalk';
const OPEN_FDA = 'https://api.fda.gov';

export async function getRecallByGTINorNDC(code: string) {
  // search both GTIN and NDC; openFDA uses product_ndc for NDC searches
  // Try explicit NDC/product fields first
  const q1 = `${OPEN_FDA}/drug/enforcement.json?search=openfda.product_ndc:${code}&limit=1`;
  let recall = await tryJson(q1);
  if (recall) return recall;
  // Some enforcement records use package_ndc
  const q2 = `${OPEN_FDA}/drug/enforcement.json?search=openfda.package_ndc:${code}&limit=1`;
  recall = await tryJson(q2);
  if (recall) return recall;
  // Last resort: generic search across fields
  const fallbackUrl = `${OPEN_FDA}/drug/enforcement.json?search=${encodeURIComponent(code)}&limit=1`;
  return await tryJson(fallbackUrl);
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export async function getLabelingByGTINorNDC(code: string) {
  // Helper to try a set of query templates in order
  async function tryFieldQueries(templates: string[]) {
    for (const tmpl of templates) {
      const url = tmpl.replace('{code}', encodeURIComponent(code));
      const res = await tryJson(url);
      if (res) return res;
    }
    return null;
  }

  // If code looks like an NDC (10 or 11 digits), search product/package ndc first
  if (/^\d{10,11}$/.test(code)) {
    const templates = [
      `${OPEN_FDA}/drug/label.json?search=openfda.product_ndc:{code}&limit=1`,
      `${OPEN_FDA}/drug/label.json?search=openfda.package_ndc:{code}&limit=1`,
    ];
    const r = await tryFieldQueries(templates);
    if (r) return r;
  }

  // If code looks like a GTIN (8-14 digits), try plausible NDC tails
  if (/^\d{8,14}$/.test(code)) {
    // Try explicit crosswalk first
    const mapped = lookupNdcFromGtin(code)
    if (mapped) {
      const byCross = await tryJson(`${OPEN_FDA}/drug/label.json?search=openfda.product_ndc:${mapped}&limit=1`)
      if (byCross) return byCross
      const byCrossPkg = await tryJson(`${OPEN_FDA}/drug/label.json?search=openfda.package_ndc:${mapped}&limit=1`)
      if (byCrossPkg) return byCrossPkg
    }
    const candidateLens = [11, 10, 9, 8];
    for (const n of candidateLens) {
      const t = code.slice(-n);
      const tailsToTry = [t, t.replace(/^0+/, '')].filter(Boolean);
      for (const tt of tailsToTry) {
        if (tt.length < 8) continue;
        const templates = [
          `${OPEN_FDA}/drug/label.json?search=openfda.product_ndc:${tt}&limit=1`,
          `${OPEN_FDA}/drug/label.json?search=openfda.package_ndc:${tt}&limit=1`,
        ];
        for (const url of templates) {
          const res = await tryJson(url);
          if (res) return res;
        }
      }
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
  // Try RxNorm lookup to get an rxcui, then search openFDA by rxcui if possible
  try {
    const rxcui = await findRxcuiByName(name)
    if (rxcui) {
      const qR = `${OPEN_FDA}/drug/label.json?search=openfda.rxcui:${encodeURIComponent(rxcui)}&limit=1`
      const rr = await tryJson(qR)
      if (rr) return rr
    }
  } catch {}
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
  // surface a debug message to aid diagnosing occasional network or API errors
  // eslint-disable-next-line no-console
  console.debug('openfda.tryJson error', (e as any)?.message ?? e)
  return null;
  }
}
