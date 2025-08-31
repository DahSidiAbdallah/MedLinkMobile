import emaRecalls from '../data/ema_recalls.json';
import sahpraRecalls from '../data/sahpra_recalls.json';
import nafdacRecalls from '../data/nafdac_recalls.json';
import ppbRecalls from '../data/ppb_recalls.json';
import { RecallNotice } from '../types/recall';
import { normalizeGtinTo14, normalizeNdc } from './codeUtils';

type RawRecall = {
  source: string;
  gtin?: string;
  ndc?: string;
  id?: string;
  reason: string;
};

function normalize(recalls: RawRecall[]): RecallNotice[] {
  return recalls.map((r) => {
  let code = '';
  if (r.gtin) code = normalizeGtinTo14(r.gtin);
  else if (r.ndc) code = normalizeNdc(r.ndc);
  else if (r.id) code = r.id;
    return { source: r.source, code, reason: r.reason };
  });
}

const allRecalls: RecallNotice[] = [
  ...normalize(emaRecalls as RawRecall[]),
  ...normalize(sahpraRecalls as RawRecall[]),
  ...normalize(nafdacRecalls as RawRecall[]),
  ...normalize(ppbRecalls as RawRecall[]),
];

export function findLocalRecall(code: string): RecallNotice | null {
  const canonical = normalizeGtinTo14(code) || normalizeNdc(code) || code;
  return allRecalls.find((n) => n.code === canonical || n.code === code) ?? null;
}
