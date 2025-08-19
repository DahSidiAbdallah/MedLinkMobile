import emaRecalls from '../data/ema_recalls.json';
import sahpraRecalls from '../data/sahpra_recalls.json';
import nafdacRecalls from '../data/nafdac_recalls.json';
import ppbRecalls from '../data/ppb_recalls.json';
import { RecallNotice } from '../types/recall';

type RawRecall = {
  source: string;
  gtin?: string;
  ndc?: string;
  id?: string;
  reason: string;
};

function normalize(recalls: RawRecall[]): RecallNotice[] {
  return recalls.map((r) => ({
    source: r.source,
    code: r.gtin || r.ndc || r.id || '',
    reason: r.reason,
  }));
}

const allRecalls: RecallNotice[] = [
  ...normalize(emaRecalls as RawRecall[]),
  ...normalize(sahpraRecalls as RawRecall[]),
  ...normalize(nafdacRecalls as RawRecall[]),
  ...normalize(ppbRecalls as RawRecall[]),
];

export function findLocalRecall(code: string): RecallNotice | null {
  return allRecalls.find((n) => n.code === code) ?? null;
}
