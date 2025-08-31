import { normalizeGtinTo14 } from './codeUtils';

export interface Gs1DataMatrix {
  gtin: string; // canonical 14-digit GTIN
  expiry?: Date;
  lot?: string;
}

export function parseGs1DataMatrix(raw: string): Gs1DataMatrix | null {
  if (!raw || typeof raw !== 'string') return null;

  const gs1: Partial<Gs1DataMatrix> = {};

  const parseYYMMDD = (v: string): Date | undefined => {
    if (!/^[0-9]{6}$/.test(v)) return undefined;
    const yy = parseInt(v.substring(0, 2), 10);
    const year = 2000 + yy;
    const month = parseInt(v.substring(2, 4), 10) - 1;
    const day = parseInt(v.substring(4, 6), 10);
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return undefined;
    return new Date(Date.UTC(year, month, day));
  };

  // Parenthesized form: (01)...(17)...(10)...
  const parenRe = /\((\d{2,4})\)([^()]+)/g;
  let m: RegExpExecArray | null;
  let foundParen = false;
  while ((m = parenRe.exec(raw))) {
    foundParen = true;
    const ai = m[1];
    const val = m[2];
    if (ai === '01') gs1.gtin = normalizeGtinTo14(val.substring(0, 14));
    else if (ai === '17') {
      const d = parseYYMMDD(val.substring(0, 6));
      if (d) gs1.expiry = d;
    } else if (ai === '10') gs1.lot = val;
  }
  if (foundParen && gs1.gtin) return gs1 as Gs1DataMatrix;

  // FNC1-separated fields (ASCII 29)
  const FNC1 = String.fromCharCode(29);
  if (raw.includes(FNC1)) {
    const parts = raw.split(FNC1).map(p => p.trim()).filter(Boolean);
    for (const p of parts) {
      for (const len of [2, 3, 4]) {
        const ai = p.substring(0, len);
        const val = p.substring(len);
        if (!/^[0-9]+$/.test(ai)) continue;
        if (ai === '01' && val.length >= 14) gs1.gtin = normalizeGtinTo14(val.substring(0, 14));
        else if (ai === '17' && val.length >= 6) {
          const d = parseYYMMDD(val.substring(0, 6));
          if (d) gs1.expiry = d;
        } else if (ai === '10') gs1.lot = val;
      }
    }
    if (gs1.gtin) return gs1 as Gs1DataMatrix;
  }

  // Concatenated AIs without separators
  const concatRe = /01(\d{14})|17(\d{6})|10([^\x1D\(]+)/g;
  let any = false;
  while ((m = concatRe.exec(raw))) {
    any = true;
    if (m[1]) gs1.gtin = normalizeGtinTo14(m[1]);
    else if (m[2]) {
      const d = parseYYMMDD(m[2]);
      if (d) gs1.expiry = d;
    } else if (m[3]) gs1.lot = m[3];
  }
  if (any && gs1.gtin) return gs1 as Gs1DataMatrix;

  // Heuristic: find any 14/13/12/8 digit run
  const maybe = raw.match(/\d{14}|\d{13}|\d{12}|\d{8}/g);
  if (maybe && maybe.length) {
    gs1.gtin = normalizeGtinTo14(maybe[0]);
    const exp = raw.match(/\d{6}/g);
    if (exp && exp.length) {
      const d = parseYYMMDD(exp[0]);
      if (d) gs1.expiry = d;
    }
    return gs1 as Gs1DataMatrix;
  }

  return null;
}
