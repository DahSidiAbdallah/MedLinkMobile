const OPEN_FDA = 'https://api.fda.gov';

export async function getRecallByGTINorNDC(code: string) {
  // search both GTIN and NDC; openFDA uses product_ndc for NDC searches
  const url = `${OPEN_FDA}/drug/enforcement.json?search=openfda.product_ndc:${code}&limit=1`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.results?.[0] ?? null;
}

export async function getLabelingByGTINorNDC(code: string) {
  // drug labeling uses product_ndc or set_id; try product_ndc
  const url = `${OPEN_FDA}/drug/label.json?search=openfda.product_ndc:${code}&limit=1`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.results?.[0] ?? null;
}
