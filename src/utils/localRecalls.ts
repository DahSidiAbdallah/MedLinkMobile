import emaRecalls from '../data/ema_recalls.json';
import sahpraRecalls from '../data/sahpra_recalls.json';
import nafdacRecalls from '../data/nafdac_recalls.json';
import ppbRecalls from '../data/ppb_recalls.json';
import { RecallNotice } from '../types/recall';

const allRecalls: RecallNotice[] = [
  ...emaRecalls,
  ...sahpraRecalls,
  ...nafdacRecalls,
  ...ppbRecalls,
];

export function findLocalRecall(code: string): RecallNotice | null {
  return allRecalls.find((n) => n.code === code) ?? null;
}
