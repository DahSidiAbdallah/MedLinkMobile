import { gs1Country } from './gs1Prefixes';

/** National pharmaceutical numbers that can be carried in GS1 codes (AIs 710–716) or derived from the GTIN. */
export type NationalCode =
  | { scheme: 'FR-CIP13'; value: string }
  | { scheme: 'US-NDC'; value: string }
  | { scheme: 'DE-PZN'; value: string }
  | { scheme: 'ES-CN'; value: string }
  | { scheme: 'BR-ANVISA'; value: string }
  | { scheme: 'PT-AIM'; value: string }
  | { scheme: 'IT-AIC'; value: string };

export type StructuralIssue =
  | 'gtin_check_digit'      // the GTIN's check digit is wrong: misprint or crude copy
  | 'invalid_expiry'        // expiry date field is not a real date
  | 'missing_separators'    // GS1 field separators absent; lot/serial boundaries were guessed
  | 'unknown_ai'            // an application identifier GS1 does not define
  | 'restricted_prefix';    // in-store/internal barcode range, never used for registered medicines

export interface ParsedCode {
  raw: string;
  format: 'gs1' | 'ean13' | 'ean8' | 'upc' | 'ndc' | 'medlink' | 'text';
  /** Canonical 14-digit GTIN when the code identifies a trade item. */
  gtin?: string;
  expiry?: Date;
  lot?: string;
  serial?: string;
  national: NationalCode[];
  /** ISO country of the GS1 organisation that issued the barcode (not the manufacturing country). */
  gs1Country?: string;
  issues: StructuralIssue[];
  /** Every parsed GS1 element, for debugging and display. */
  elements: Record<string, string>;
}

const GS = '\u001d';

export function gtinCheckDigitValid(digits: string): boolean {
  if (!/^\d{8}$|^\d{12,14}$/.test(digits)) return false;
  const body = digits.slice(0, -1);
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const n = Number(body[body.length - 1 - i]);
    sum += i % 2 === 0 ? n * 3 : n;
  }
  return (10 - (sum % 10)) % 10 === Number(digits[digits.length - 1]);
}

/** GS1 dates are YYMMDD; DD=00 means "end of month". Years follow the GS1 sliding window (−49/+50). */
export function parseGs1Date(v: string): Date | undefined {
  if (!/^\d{6}$/.test(v)) return undefined;
  const yy = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  let dd = Number(v.slice(4, 6));
  if (mm < 1 || mm > 12 || dd > 31) return undefined;
  const thisYear = new Date().getUTCFullYear();
  let year = Math.floor(thisYear / 100) * 100 + yy;
  if (year - thisYear > 50) year -= 100;
  else if (thisYear - year > 49) year += 100;
  if (dd === 0) dd = new Date(Date.UTC(year, mm, 0)).getUTCDate();
  const d = new Date(Date.UTC(year, mm - 1, dd));
  return d.getUTCMonth() === mm - 1 ? d : undefined;
}

// GS1 "predefined length" AIs: the only ones that never need a separator after them.
const FIXED: Record<string, number> = {
  '00': 18, '01': 14, '02': 14, '03': 14, '04': 16,
  '11': 6, '12': 6, '13': 6, '15': 6, '16': 6, '17': 6, '20': 2,
};

function aiLength(s: string): number {
  const two = s.slice(0, 2);
  if (/^(0[0-4]|1[0-7]|2[0-2]|30|37|9\d)$/.test(two)) return 2;
  if (/^(23|24|25|40|41|42|71)$/.test(two)) return 3;
  if (/^(3[1-6]|70|8[0-2])$/.test(two)) return 4;
  return 0;
}

function fixedLength(ai: string): number | undefined {
  if (FIXED[ai] !== undefined) return FIXED[ai];
  if (/^3[1-6]\d\d$/.test(ai)) return 6;
  if (/^41[0-7]$/.test(ai)) return 13;
  return undefined;
}

/** Where a variable-length field probably ends when the separators were stripped by the scanner. */
function guessFieldEnd(s: string, start: number, max: number): number {
  const limit = Math.min(s.length, start + max);
  for (let j = start + 1; j < limit; j++) {
    const rest = s.slice(j);
    if (/^1[1-7]\d{6}/.test(rest) && parseGs1Date(rest.slice(2, 8))) {
      const after = rest.slice(8);
      if (!after || /^(10|21|01|1[1-7])/.test(after)) return j;
    }
    if (/^01\d{14}/.test(rest) && gtinCheckDigitValid(rest.slice(2, 16))) return j;
  }
  return limit;
}

function parseGs1Elements(data: string, issues: StructuralIssue[]): Record<string, string> {
  const elements: Record<string, string> = {};
  const hasSeparators = data.includes(GS);
  let i = 0;
  while (i < data.length) {
    if (data[i] === GS) { i++; continue; }
    const len = aiLength(data.slice(i));
    if (!len) { issues.push('unknown_ai'); break; }
    const ai = data.slice(i, i + len);
    i += len;
    const fixed = fixedLength(ai);
    let value: string;
    if (fixed !== undefined) {
      value = data.slice(i, i + fixed);
      i += fixed;
    } else {
      const gsAt = data.indexOf(GS, i);
      if (gsAt >= 0) {
        value = data.slice(i, gsAt);
        i = gsAt + 1;
      } else if (hasSeparators || i >= data.length) {
        value = data.slice(i);
        i = data.length;
      } else {
        const end = guessFieldEnd(data, i, 20);
        value = data.slice(i, end);
        if (end < data.length && !issues.includes('missing_separators')) issues.push('missing_separators');
        i = end;
      }
    }
    elements[ai] = value;
  }
  return elements;
}

function normalizeRaw(raw: string): { data: string; symbologyGs1: boolean } {
  let s = raw.trim();
  let symbologyGs1 = false;
  // AIM symbology identifiers: ]d2 = GS1 DataMatrix, ]C1 = GS1-128, ]Q3 = GS1 QR, ]e0 = GS1 DataBar
  const sym = s.match(/^\](d2|C1|Q3|e0|J1)/);
  if (sym) { symbologyGs1 = true; s = s.slice(3); }
  // Textual separator stand-ins some scanners and keyboards emit
  s = s.replace(/<GS>|\{GS\}|\^\]|\\x1[dD]|\\u001[dD]/g, GS);
  if (s.startsWith(GS)) { symbologyGs1 = true; s = s.slice(1); }
  return { data: s, symbologyGs1 };
}

function addNationalFromGtin(gtin: string, national: NationalCode[]) {
  const g13 = gtin.slice(1);
  if (gtin.startsWith('0') && g13.startsWith('3400')) national.push({ scheme: 'FR-CIP13', value: g13 });
  // US drug UPC: GTIN-12 "3" + NDC-10 + check → GTIN-14 "003" + NDC-10 + check
  if (gtin.startsWith('003')) national.push({ scheme: 'US-NDC', value: gtin.slice(3, 13) });
  // German PZN embedded in a PPN-derived GTIN ("04150" + PZN8 + check)
  if (gtin.startsWith('04150')) national.push({ scheme: 'DE-PZN', value: gtin.slice(5, 13) });
}

const NHRN: Record<string, NationalCode['scheme']> = {
  '710': 'DE-PZN', '711': 'FR-CIP13', '712': 'ES-CN', '713': 'BR-ANVISA', '714': 'PT-AIM', '715': 'US-NDC', '716': 'IT-AIC',
};

export function parseCode(raw: string, symbology?: string): ParsedCode {
  const issues: StructuralIssue[] = [];
  const national: NationalCode[] = [];
  const base: ParsedCode = { raw, format: 'text', national, issues, elements: {} };
  if (!raw) return base;

  if (raw.startsWith('MedLink:AUTH:')) return { ...base, format: 'medlink' };

  const { data, symbologyGs1 } = normalizeRaw(raw);
  const looksGs1 = symbologyGs1
    || data.includes(GS)
    || /^\(\d{2,4}\)/.test(data)
    || /^01\d{14}(1[0-7]|21|10)/.test(data)
    || ((symbology || '').toLowerCase().includes('datamatrix') && /^01\d{14}/.test(data));

  if (looksGs1) {
    // Human-readable form "(01)…(17)…" → separator form
    const normalized = /^\(\d{2,4}\)/.test(data)
      ? data.replace(/\((\d{2,4})\)/g, (_m, ai, offset) => (offset === 0 ? ai : GS + ai))
      : data;
    const el = parseGs1Elements(normalized, issues);
    const result: ParsedCode = { ...base, format: 'gs1', elements: el };
    if (el['01'] && /^\d{14}$/.test(el['01'])) {
      result.gtin = el['01'];
      if (!gtinCheckDigitValid(el['01'])) issues.push('gtin_check_digit');
      addNationalFromGtin(el['01'], national);
      result.gs1Country = gs1Country(el['01'].slice(1));
    }
    const exp = el['17'] ?? el['12'];
    if (exp !== undefined) {
      result.expiry = parseGs1Date(exp);
      if (!result.expiry) issues.push('invalid_expiry');
    }
    if (el['10']) result.lot = el['10'].trim();
    if (el['21']) result.serial = el['21'].trim();
    for (const [ai, scheme] of Object.entries(NHRN)) {
      if (el[ai] && !national.some(n => n.scheme === scheme && n.value === el[ai])) {
        national.push({ scheme, value: el[ai] } as NationalCode);
      }
    }
    if (result.gs1Country === 'RESTRICTED') issues.push('restricted_prefix');
    return result;
  }

  const digits = data.replace(/[\s-]/g, '');
  if (/^\d{8}$|^\d{12,14}$/.test(digits)) {
    const gtin = digits.padStart(14, '0');
    const format = digits.length === 8 ? 'ean8' : digits.length === 12 ? 'upc' : 'ean13';
    const result: ParsedCode = { ...base, format, gtin };
    if (!gtinCheckDigitValid(digits)) issues.push('gtin_check_digit');
    addNationalFromGtin(gtin, national);
    if (digits.length !== 8) {
      result.gs1Country = gs1Country(gtin.slice(1));
      if (result.gs1Country === 'RESTRICTED') issues.push('restricted_prefix');
    }
    return result;
  }

  // Bare US NDC (10–11 digits, possibly hyphenated)
  if (/^\d{10,11}$/.test(digits)) {
    return { ...base, format: 'ndc', national: [{ scheme: 'US-NDC', value: digits }] };
  }
  return base;
}
