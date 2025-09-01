import fetch from 'node-fetch';
import { cacheGet, cacheSet, isCacheEnabled } from './cache';
import dotenv from 'dotenv';
dotenv.config();

// Data model types
export type Demographics = {
  age?: number;
  sex?: 'M' | 'F' | 'X';
  weightKg?: number;
  pregnant?: boolean;
};

export type Allergy = { type: 'drug' | 'class' | 'excipient'; value: string };

export type CurrentMed = { name: string; rxcui?: string; dose?: string };

export type PatientProfile = {
  userId: string;
  demographics?: Demographics;
  conditionsICD10?: string[];
  allergies?: Allergy[];
  currentMeds?: CurrentMed[];
  renalImpairment?: 'none' | 'mild' | 'moderate' | 'severe';
  hepaticImpairment?: 'none' | 'mild' | 'moderate' | 'severe';
};

export type Advisory = {
  status: 'red' | 'yellow' | 'green';
  reasons: { type: 'interaction' | 'allergy' | 'condition' | 'dose' | 'population'; detail: string; source?: string }[];
  ingredients: { name: string; rxcui?: string | null }[];
};

// Helpers / Endpoints
const rx = (p: string) => `https://rxnav.nlm.nih.gov/REST/${p}`;
const ofda = (q: string) => `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(q)}&limit=1`;

// Simple in-memory caches
const rxcuiCache = new Map<string, string | null>();
const openFdaCache = new Map<string, any>();

async function fetchJsonWithRetry(url: string, maxRetries = 3): Promise<any> {
  let attempt = 0;
  let lastErr: any = null;
  while (attempt < maxRetries) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'MedLinkMobile/1.0 (rx-check)' } });
      if (!res.ok) {
        lastErr = new Error(`status ${res.status}`);
        // On 429/5xx, retry with backoff
        if (res.status === 429 || res.status >= 500) {
          const wait = Math.pow(2, attempt) * 250 + Math.floor(Math.random() * 100);
          await new Promise(r => setTimeout(r, wait));
          attempt++;
          continue;
        }
        // otherwise throw
        throw lastErr;
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
      attempt++;
      const wait = Math.pow(2, attempt) * 200 + Math.floor(Math.random() * 100);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

export async function rxcuiForName(name: string): Promise<string | null> {
  const key = name.toLowerCase().trim();
  if (rxcuiCache.has(key)) return rxcuiCache.get(key) ?? null;
  // try Redis cache
  if (isCacheEnabled()) {
    const v = await cacheGet(`rxcui:${key}`);
    if (v !== null) return v || null;
  }
  try {
    const url = rx(`rxcui.json?name=${encodeURIComponent(name)}`);
    const j = await fetchJsonWithRetry(url);
    const id = j?.idGroup?.rxnormId?.[0] ?? null;
    rxcuiCache.set(key, id ?? null);
    if (isCacheEnabled()) await cacheSet(`rxcui:${key}`, id ?? '', 60 * 60 * 24 * 7);
    return id ?? null;
  } catch (err) {
    rxcuiCache.set(key, null);
    return null;
  }
}

export async function interactions(rxcuiList: string[]): Promise<{ severity: string; desc: string }[]> {
  if (!rxcuiList || rxcuiList.length < 2) return [];
  // RxNav expects plus-separated rxcuis
  const q = rxcuiList.join('+');
  try {
    const j = await fetchJsonWithRetry(rx(`interaction/list.json?rxcuis=${encodeURIComponent(q)}`));
    const out: { severity: string; desc: string }[] = [];
    for (const tr of j.fullInteractionTypeGroup ?? []) {
      for (const t of tr.fullInteractionType ?? []) {
        for (const i of t.interactionPair ?? []) {
          out.push({ severity: (i.severity || 'N/A').toLowerCase(), desc: i.description || i.minConceptItem?.comment || '' });
        }
      }
    }
    return out;
  } catch (err) {
    return [];
  }
}

export async function openFdaSections(drugName: string) {
  const key = drugName.toLowerCase();
  if (openFdaCache.has(key)) return openFdaCache.get(key);
  if (isCacheEnabled()) {
    const v = await cacheGet(`openfda:${key}`);
    if (v) return JSON.parse(v);
  }
  try {
    const j = await fetchJsonWithRetry(ofda(`(openfda.brand_name:"${drugName}"^2 OR openfda.generic_name:"${drugName}")`));
    const doc = j.results?.[0] ?? {};
    const out = {
      contraindications: Array.isArray(doc.contraindications) ? doc.contraindications.join('\n') : (doc.contraindications || ''),
      warnings: Array.isArray(doc.warnings) ? doc.warnings.join('\n') : (doc.warnings || doc.warnings_and_cautions || ''),
      useInSpecificPopulations: Array.isArray(doc.use_in_specific_populations) ? doc.use_in_specific_populations.join('\n') : (doc.use_in_specific_populations || ''),
      adverseReactions: Array.isArray(doc.adverse_reactions) ? doc.adverse_reactions.join('\n') : (doc.adverse_reactions || '')
    };
    openFdaCache.set(key, out);
  if (isCacheEnabled()) await cacheSet(`openfda:${key}`, JSON.stringify(out), 60 * 60 * 24);
  return out;
  } catch (err) {
    const empty = { contraindications: '', warnings: '', useInSpecificPopulations: '', adverseReactions: '' };
    openFdaCache.set(key, empty);
    return empty;
  }
}

function needle(txt: string, arr: string[]) {
  if (!txt || !arr || arr.length === 0) return false;
  for (const v of arr) {
    if (!v) continue;
    const re = new RegExp(`\\b${v.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')}\\b`, 'i');
    if (re.test(txt)) return true;
  }
  return false;
}

export async function analyzeScanAgainstProfile(scanned: { name: string; ingredients: string[] }, profile: PatientProfile): Promise<Advisory> {
  const reasons: Advisory['reasons'] = [];

  // Normalize ingredients → RxCUI
  const ingr = await Promise.all(scanned.ingredients.map(async n => ({ name: n, rxcui: await rxcuiForName(n) })));
  const scannedRxcuis = ingr.map(i => i.rxcui).filter(Boolean) as string[];

  // Resolve current meds to RxCUI
  const currentRxcuis = (await Promise.all((profile.currentMeds || []).map(async (m) => m.rxcui || await rxcuiForName(m.name)))).filter(Boolean) as string[];

  // Interactions
  if (scannedRxcuis.length && currentRxcuis.length) {
    const pairs = await interactions(Array.from(new Set([...scannedRxcuis, ...currentRxcuis])));
    for (const p of pairs) {
      if (p.severity.includes('high') || p.severity.includes('contraind') || p.severity.includes('major') ) {
        reasons.push({ type: 'interaction', detail: p.desc || 'Severe interaction detected', source: 'RxNav' });
      } else {
        // collect moderate/other as yellow
        reasons.push({ type: 'interaction', detail: p.desc || 'Interaction detected', source: 'RxNav' });
      }
    }
  }

  // Label-based checks
  const label = await openFdaSections(scanned.name);

  // Allergies
  if (profile.allergies?.length) {
    const a = profile.allergies.map(x => x.value);
    if (needle([label.warnings, label.contraindications].join('\n'), a)) {
      reasons.push({ type: 'allergy', detail: `Possible allergy risk found in label text for [${a.join(', ')}]`, source: 'openFDA' });
    }
  }

  // Conditions
  if (needle([label.contraindications, label.warnings].join('\n'), ['asthma', 'ulcer', 'renal', 'hepatic', 'hypertension', 'pregnancy'])) {
    reasons.push({ type: 'condition', detail: 'Condition flagged in contraindications/warnings', source: 'openFDA' });
  }

  // Population checks
  if (profile.demographics?.pregnant && /pregnan/i.test(label.useInSpecificPopulations)) {
    reasons.push({ type: 'population', detail: 'Pregnancy-related caution in label', source: 'openFDA' });
  }

  // Determine status
  const hasRed = reasons.some(r => r.type === 'interaction' || r.type === 'allergy' || r.type === 'condition');
  const status: Advisory['status'] = hasRed ? 'red' : (reasons.length ? 'yellow' : 'green');

  return { status, reasons, ingredients: ingr };
}

// Small CLI runner when executed directly (node -r ts-node/register server/analyze.ts) — for manual testing only
if (require.main === module) {
  (async () => {
    const sample = { name: 'ibuprofen', ingredients: ['ibuprofen'] };
    const profile: PatientProfile = {
      userId: 'demo',
      demographics: { age: 35, sex: 'F', pregnant: false },
      allergies: [{ type: 'drug', value: 'ibuprofen' }],
      currentMeds: [{ name: 'warfarin' }]
    };
    const res = await analyzeScanAgainstProfile(sample, profile);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(res, null, 2));
  })();
}
