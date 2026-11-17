import whoData from '../data/alerts/who.json';

export interface WhoAlert {
  id: string;
  title: string;
  date?: string;
  url: string;
  kind: 'falsified' | 'substandard' | 'unregistered' | 'other';
  products: string[];
  tokens: string[];
  batches: string[];
  manufacturer?: string;
  countries: string[];
  allBatches: boolean;
  summary?: string;
}

export interface AlertMatch {
  alert: WhoAlert;
  /** 'batch' = the scanned lot is one WHO listed; 'product' = same brand, batch unknown or different. */
  strength: 'batch' | 'product';
  ageYears: number;
}

const alerts = (whoData as { alerts: WhoAlert[] }).alerts;

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const words = (s: string) => fold(s).split(/[^a-z0-9]+/).filter(w => w.length >= 4);
const batchKey = (s: string) => s.toUpperCase().replace(/[\s.]/g, '');

export interface AlertQuery {
  /** Product / brand name from a registry or label lookup. */
  name?: string;
  /** Active substances; a token that is merely the substance needs manufacturer evidence too. */
  substances?: string[];
  holder?: string;
  lot?: string;
}

/**
 * Finds WHO Medical Product Alerts that concern the scanned product.
 *
 * A brand-token match ("cytotec") is a product match. A token that is only the active
 * substance ("paracetamol", "quinine") is too broad on its own — it only counts when the
 * alert's stated manufacturer also matches, or the lot is one WHO listed.
 */
export function matchAlerts(q: AlertQuery): AlertMatch[] {
  const nameWords = new Set(q.name ? words(q.name) : []);
  const substanceWords = new Set((q.substances || []).flatMap(words));
  const holderWords = new Set(q.holder ? words(q.holder) : []);
  const lot = q.lot ? batchKey(q.lot) : undefined;
  const now = Date.now();
  const out: AlertMatch[] = [];

  for (const alert of alerts) {
    const batchHit = !!lot && alert.batches.some(b => batchKey(b) === lot);
    const brandHit = alert.tokens.some(t => nameWords.has(t) && !substanceWords.has(t));
    const substanceHit = alert.tokens.some(t => substanceWords.has(t) || nameWords.has(t));
    const manufacturerHit = !!alert.manufacturer && words(alert.manufacturer).some(w => holderWords.has(w));

    let strength: AlertMatch['strength'] | null = null;
    if (batchHit && (brandHit || substanceHit)) strength = 'batch';
    else if (brandHit || (substanceHit && manufacturerHit)) strength = 'product';
    if (!strength) continue;

    const ageYears = alert.date ? (now - Date.parse(alert.date)) / (365.25 * 24 * 3600 * 1000) : 99;
    out.push({ alert, strength, ageYears });
  }
  return out.sort((a, b) => (a.strength === b.strength ? a.ageYears - b.ageYears : a.strength === 'batch' ? -1 : 1));
}

export const alertsMeta = (whoData as { meta: { generatedAt: string; source: string } }).meta;
