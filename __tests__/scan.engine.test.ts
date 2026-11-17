import { parseCode, gtinCheckDigitValid, parseGs1Date } from '../src/scan/parseCode';
import { gs1Country } from '../src/scan/gs1Prefixes';
import { lookupRegistries, expectedRegistries, isExhaustive } from '../src/scan/registries';
import { matchAlerts } from '../src/scan/alerts';
import { assess } from '../src/scan/assess';
import { toEnglishInn, allergyMatches } from '../src/scan/inn';

const GS = '\u001d';
// Real French presentations from the BDPM
const DOLIPRANE_CIP13 = '3400935294227';
const AUGMENTIN_CIP13 = '3400933314019';
const withCheck = (body: string) => {
  for (let d = 0; d <= 9; d++) if (gtinCheckDigitValid(body + d)) return body + d;
  throw new Error('no check digit');
};

describe('parseCode', () => {
  it('parses a French serialised DataMatrix with separators', () => {
    const p = parseCode(`01${'0' + DOLIPRANE_CIP13}21ABC123XYZ${GS}17280430${GS}10LOT42A`, 'datamatrix');
    expect(p.format).toBe('gs1');
    expect(p.gtin).toBe('0' + DOLIPRANE_CIP13);
    expect(p.serial).toBe('ABC123XYZ');
    expect(p.lot).toBe('LOT42A');
    expect(p.expiry?.toISOString().slice(0, 10)).toBe('2028-04-30');
    expect(p.national).toContainEqual({ scheme: 'FR-CIP13', value: DOLIPRANE_CIP13 });
    expect(p.gs1Country).toBe('FR');
    expect(p.issues).toEqual([]);
  });

  it('handles the AIM symbology prefix and leading separator', () => {
    const p = parseCode(`]d201${'0' + DOLIPRANE_CIP13}17280431`, 'datamatrix');
    expect(p.gtin).toBe('0' + DOLIPRANE_CIP13);
  });

  it('recovers fields when the scanner stripped the separators', () => {
    const p = parseCode(`01${'0' + DOLIPRANE_CIP13}10LOT42A17280430`, 'datamatrix');
    expect(p.lot).toBe('LOT42A');
    expect(p.expiry?.toISOString().slice(0, 10)).toBe('2028-04-30');
  });

  it('parses the human-readable parenthesised form', () => {
    const p = parseCode(`(01)${'0' + AUGMENTIN_CIP13}(17)270100(10)B7731`);
    expect(p.gtin).toBe('0' + AUGMENTIN_CIP13);
    expect(p.lot).toBe('B7731');
    // DD = 00 means last day of the month
    expect(p.expiry?.toISOString().slice(0, 10)).toBe('2027-01-31');
  });

  it('reads national numbers from AIs 710–716', () => {
    const p = parseCode(`01${withCheck('0412345678901')}${GS}71012345678`, 'datamatrix');
    expect(p.national).toContainEqual({ scheme: 'DE-PZN', value: '12345678' });
  });

  it('identifies EAN-13 issuing countries across North Africa and key exporters', () => {
    expect(parseCode(withCheck('611123456789')).gs1Country).toBe('MA');
    expect(parseCode(withCheck('613123456789')).gs1Country).toBe('DZ');
    expect(parseCode(withCheck('619123456789')).gs1Country).toBe('TN');
    expect(parseCode(withCheck('622123456789')).gs1Country).toBe('EG');
    expect(parseCode(withCheck('890123456789')).gs1Country).toBe('IN');
    expect(parseCode(withCheck('690123456789')).gs1Country).toBe('CN');
    expect(gs1Country('2001234567890')).toBe('RESTRICTED');
  });

  it('flags a wrong check digit and an impossible expiry date', () => {
    const bad = DOLIPRANE_CIP13.slice(0, 12) + ((Number(DOLIPRANE_CIP13[12]) + 1) % 10);
    expect(parseCode(bad).issues).toContain('gtin_check_digit');
    expect(parseCode(`01${'0' + DOLIPRANE_CIP13}17281399`, 'datamatrix').issues).toContain('invalid_expiry');
  });

  it('extracts the NDC from a US drug UPC', () => {
    const upc = withCheck('30045049820'); // "3" + NDC-10
    expect(parseCode(upc).national).toContainEqual({ scheme: 'US-NDC', value: '0045049820' });
  });

  it('uses the GS1 sliding century window', () => {
    expect(parseGs1Date('991231')?.getUTCFullYear()).toBe(1999 + (new Date().getUTCFullYear() - 49 > 1999 ? 100 : 0));
  });
});

describe('French registry (BDPM)', () => {
  it('identifies a French box from its EAN-13 or DataMatrix', () => {
    const hit = lookupRegistries(parseCode(DOLIPRANE_CIP13));
    expect(hit?.name).toMatch(/^DOLIPRANE 1000 mg/);
    expect(hit?.holder).toBe('OPELLA HEALTHCARE FRANCE');
    expect(hit?.substances).toEqual(['PARACÉTAMOL']);
    expect(hit?.authorisationActive).toBe(true);
  });

  it('knows the French list is complete, so an unknown 3400 code is suspicious', () => {
    const fake = parseCode(withCheck('340099999999'));
    expect(lookupRegistries(fake)).toBeNull();
    expect(expectedRegistries(fake)).toContain('FR');
    expect(isExhaustive('FR')).toBe(true);
  });
});

describe('WHO alert matching', () => {
  it('does not flag every paracetamol product because one paracetamol syrup was alerted', () => {
    expect(matchAlerts({ name: 'DOLIPRANE 1000 mg', substances: ['PARACÉTAMOL'], holder: 'OPELLA HEALTHCARE FRANCE' })).toEqual([]);
    expect(matchAlerts({ name: 'PARACETAMOL BIOGARAN 500 mg', substances: ['PARACÉTAMOL'], holder: 'BIOGARAN' })).toEqual([]);
  });

  it('matches a brand WHO reported as falsified', () => {
    const m = matchAlerts({ name: 'CYTOTEC 200 microgrammes, comprimé', substances: ['MISOPROSTOL'] });
    expect(m[0]?.alert.id).toBe('3/2021');
    expect(m[0]?.strength).toBe('product');
  });

  it('escalates to a batch match when the scanned lot is one WHO listed', () => {
    const m = matchAlerts({ name: 'CYTOTEC', substances: ['MISOPROSTOL'], lot: 'b16519' });
    expect(m[0]?.strength).toBe('batch');
  });

  it('matches a generic only when the stated manufacturer also matches', () => {
    expect(matchAlerts({ name: 'Paracetamol Syrup', substances: ['PARACETAMOL'], holder: 'PT Afi Farma' }).length).toBeGreaterThan(0);
  });
});

describe('assess', () => {
  const base = { expected: [], alerts: [], identifiedElsewhere: false, now: new Date('2026-10-30') };

  it('says "registered, no alerts" for a genuine-looking French box', () => {
    const parsed = parseCode(`01${'0' + DOLIPRANE_CIP13}17280430${GS}10LOT42A`, 'datamatrix');
    const a = assess({ ...base, parsed, registry: lookupRegistries(parsed) });
    expect(a.verdict).toBe('ok');
    expect(a.signals.map(s => s.id)).toEqual(['registered']);
  });

  it('warns when a French-coded box is missing from the complete French list', () => {
    const parsed = parseCode(withCheck('340099999999'));
    const a = assess({ ...base, parsed, registry: null, expected: [{ country: 'FR', exhaustive: true }] });
    expect(a.verdict).toBe('warning');
    expect(a.signals[0].id).toBe('not_in_registry');
  });

  it('marks expired stock as danger', () => {
    const parsed = parseCode(`01${'0' + DOLIPRANE_CIP13}17240101`, 'datamatrix');
    const a = assess({ ...base, parsed, registry: lookupRegistries(parsed) });
    expect(a.verdict).toBe('danger');
    expect(a.signals[0].id).toBe('expired');
  });

  it('treats one serial seen by several people as a likely clone', () => {
    const parsed = parseCode(`01${'0' + DOLIPRANE_CIP13}21SER1`, 'datamatrix');
    const a = assess({ ...base, parsed, registry: lookupRegistries(parsed), clone: { otherScanners: 4, totalScans: 9 } });
    expect(a.verdict).toBe('warning');
    expect(a.signals[0].id).toBe('clone_suspected');
  });

  it('reports "unknown" rather than "authentic" when nothing identifies the product', () => {
    const a = assess({ ...base, parsed: parseCode(withCheck('611123456789')), registry: null });
    expect(a.verdict).toBe('unknown');
  });
});

describe('translations', () => {
  const SIGNALS = [
    'recalled', 'who_batch', 'expired', 'who_product_recent', 'clone_suspected', 'not_in_registry',
    'authorisation_withdrawn', 'check_digit', 'invalid_expiry', 'restricted_prefix', 'clone_possible',
    'not_marketed', 'expires_soon', 'who_product_old', 'registered', 'missing_separators',
    'medlink_verified', 'medlink_invalid',
  ];
  it.each(['en', 'fr', 'ar'])('%s has every verdict and finding', lang => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const locale = require(`../src/i18n/locales/${lang}`).default;
    const scanner = locale.translation?.scanner ?? locale.scanner;
    for (const v of ['danger', 'warning', 'ok', 'unknown']) {
      expect(scanner.verdict[v].title).toBeTruthy();
      expect(scanner.verdict[v].detail).toBeTruthy();
    }
    for (const id of SIGNALS) {
      expect(scanner.signals[id]?.title).toBeTruthy();
      expect(scanner.signals[id]?.detail).toBeTruthy();
    }
  });
});

describe('INN normalisation', () => {
  it.each([
    ['PARACÉTAMOL', 'acetaminophen'],
    ['AMOXICILLINE TRIHYDRATÉE', 'amoxicillin'],
    ['CLAVULANATE DE POTASSIUM', 'clavulanate'],
    ['CHLORHYDRATE DE METFORMINE', 'metformin'],
    ['IBUPROFÈNE', 'ibuprofen'],
    ['CHLOROQUINE', 'chloroquine'],
    ['ACIDE ACÉTYLSALICYLIQUE', 'aspirin'],
  ])('%s → %s', (fr, en) => expect(toEnglishInn(fr)).toBe(en));

  it('matches allergies across languages and drug classes', () => {
    expect(allergyMatches('Paracetamol', ['PARACÉTAMOL'])).toBe(true);
    expect(allergyMatches('acetaminophen', ['PARACÉTAMOL'])).toBe(true);
    expect(allergyMatches('Penicillin', ['AMOXICILLINE TRIHYDRATÉE'])).toBe(true);
    expect(allergyMatches('Ibuprofen', ['PARACÉTAMOL'])).toBe(false);
  });
});
