import recalls from '../data/alerts/recalls.json';
import { RecallNotice } from '../types/recall';
import { normalizeGtinTo14, normalizeNdc } from './codeUtils';

/**
 * Curated national recalls and batch withdrawals (ANSM, AMMPS, NAFDAC, …) that are not
 * covered by the WHO alert feed. Entries are added to src/data/alerts/recalls.json:
 *   { source, country?, gtin?, ndc?, batches?: string[], product?, reason, date?, url? }
 * An entry with `batches` only matches scans of those batches.
 */
type RawRecall = {
  source: string;
  country?: string;
  gtin?: string;
  ndc?: string;
  batches?: string[];
  product?: string;
  reason: string;
  date?: string;
  url?: string;
};

const all = (recalls as RawRecall[]).map(r => ({
  ...r,
  code: r.gtin ? normalizeGtinTo14(r.gtin) : r.ndc ? normalizeNdc(r.ndc) : '',
  batches: (r.batches || []).map(b => b.toUpperCase().replace(/\s+/g, '')),
}));

export function findLocalRecall(code: string, lot?: string): RecallNotice | null {
  if (!code) return null;
  const candidates = new Set([code, normalizeGtinTo14(code), normalizeNdc(code)].filter(Boolean));
  const lotKey = lot?.toUpperCase().replace(/\s+/g, '');
  const hit = all.find(r =>
    r.code && candidates.has(r.code) && (r.batches.length === 0 || (!!lotKey && r.batches.includes(lotKey))),
  );
  return hit ? { source: hit.source, code: hit.code, reason: hit.reason, url: hit.url } : null;
}
