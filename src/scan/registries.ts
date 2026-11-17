import type { ParsedCode } from './parseCode';
import { REGISTRY_LOADERS } from '../data/registries';

/**
 * Registry file schema (written by scripts/registry/*.js):
 *   meta.codePrefix — shared prefix stripped from every code key (e.g. "3400" for French CIP13)
 *   meta.exhaustive — true when the file lists every authorised product, so "not found" is meaningful
 *   holders[]       — marketing-authorisation holders, referenced by index
 *   products[id]    — [name, holderIndex, flags (1 = marketed, 2 = authorisation active), substances ";"-joined]
 *   codes[code]     — productId * 4 + flags (1 = presentation marketed, 2 = presentation active)
 * Products with non-numeric ids store codes[code] = "id|flags".
 */
export interface RegistryFile {
  meta: {
    country: string;
    source: string;
    url?: string;
    generatedAt: string;
    codePrefix?: string;
    exhaustive?: boolean;
    gtinPrefixes?: string[];
  };
  holders: string[];
  products: Record<string, [string, number, number, string]>;
  codes: Record<string, number | string>;
}

export interface RegistryMatch {
  country: string;
  source: string;
  name: string;
  holder?: string;
  substances: string[];
  productMarketed: boolean;
  authorisationActive: boolean;
  presentationMarketed: boolean;
  presentationActive: boolean;
}

const cache = new Map<string, RegistryFile | null>();

function load(country: string): RegistryFile | null {
  if (cache.has(country)) return cache.get(country)!;
  let reg: RegistryFile | null = null;
  try {
    reg = REGISTRY_LOADERS[country]?.() ?? null;
  } catch (e) {
    console.warn(`[registry] failed to load ${country}`, e);
  }
  cache.set(country, reg);
  return reg;
}

export function availableRegistries(): string[] {
  return Object.keys(REGISTRY_LOADERS);
}

function lookupIn(reg: RegistryFile, code: string): RegistryMatch | null {
  const prefix = reg.meta.codePrefix ?? '';
  if (prefix && !code.startsWith(prefix)) return null;
  const entry = reg.codes[code.slice(prefix.length)];
  if (entry === undefined) return null;
  let id: string;
  let flags: number;
  if (typeof entry === 'number') {
    id = String(Math.floor(entry / 4));
    flags = entry % 4;
  } else {
    const [i, f] = entry.split('|');
    id = i;
    flags = Number(f) || 0;
  }
  const p = reg.products[id];
  if (!p) return null;
  return {
    country: reg.meta.country,
    source: reg.meta.source,
    name: p[0],
    holder: reg.holders[p[1]],
    substances: p[3] ? p[3].split(';') : [],
    productMarketed: (p[2] & 1) === 1,
    authorisationActive: (p[2] & 2) === 2,
    presentationMarketed: (flags & 1) === 1,
    presentationActive: (flags & 2) === 2,
  };
}

/** Candidate lookup keys for a scan, most specific first. */
function keysFor(parsed: ParsedCode): string[] {
  const keys: string[] = [];
  for (const n of parsed.national) keys.push(n.value);
  if (parsed.gtin) {
    keys.push(parsed.gtin.slice(1)); // GTIN-13 / EAN-13
    keys.push(parsed.gtin);
    keys.push(parsed.gtin.replace(/^0+/, '')); // GTIN-12 / GTIN-8 forms
  }
  return [...new Set(keys.filter(Boolean))];
}

/**
 * Registries this scan is expected to be listed in: the ones whose code scheme it uses,
 * plus the registry of the country that issued the barcode.
 */
export function expectedRegistries(parsed: ParsedCode): string[] {
  const out = new Set<string>();
  if (parsed.national.some(n => n.scheme === 'FR-CIP13')) out.add('FR');
  if (parsed.gs1Country && REGISTRY_LOADERS[parsed.gs1Country]) out.add(parsed.gs1Country);
  return [...out];
}

export function lookupRegistries(parsed: ParsedCode): RegistryMatch | null {
  const keys = keysFor(parsed);
  if (!keys.length) return null;
  // Check the expected registries first, then every other one (imported stock keeps its origin code).
  const order = [...new Set([...expectedRegistries(parsed), ...availableRegistries()])];
  for (const country of order) {
    const reg = load(country);
    if (!reg) continue;
    for (const key of keys) {
      const hit = lookupIn(reg, key);
      if (hit) return hit;
    }
  }
  return null;
}

/** True when `country`'s registry lists every authorised product, so a miss is a red flag. */
export function isExhaustive(country: string): boolean {
  return !!load(country)?.meta.exhaustive;
}

export function registryMeta(country: string) {
  return load(country)?.meta;
}
