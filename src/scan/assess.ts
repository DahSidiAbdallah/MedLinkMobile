import type { ParsedCode } from './parseCode';
import type { RegistryMatch } from './registries';
import type { AlertMatch } from './alerts';
import type { CloneCheckResult } from './cloneCheck';

export type Severity = 'critical' | 'high' | 'medium' | 'info';

/** Rendered via i18n keys `scanner.signals.<id>.title` / `.detail`, interpolated with `params`. */
export interface Signal {
  id:
    | 'recalled' | 'who_batch' | 'expired'
    | 'who_product_recent' | 'clone_suspected' | 'not_in_registry' | 'authorisation_withdrawn'
    | 'check_digit' | 'invalid_expiry' | 'restricted_prefix'
    | 'clone_possible' | 'not_marketed' | 'expires_soon'
    | 'who_product_old' | 'registered' | 'missing_separators'
    | 'medlink_verified' | 'medlink_invalid';
  severity: Severity;
  params?: Record<string, string | number>;
  url?: string;
}

/** danger = do not use; warning = check with a pharmacist; ok = registered with no alerts; unknown = not enough data. */
export type Verdict = 'danger' | 'warning' | 'ok' | 'unknown';

export interface Assessment {
  verdict: Verdict;
  signals: Signal[];
}

export interface AssessInput {
  parsed: ParsedCode;
  registry: RegistryMatch | null;
  /** Registries this barcode should appear in, and whether each is a complete list. */
  expected: Array<{ country: string; exhaustive: boolean }>;
  alerts: AlertMatch[];
  recall?: { source: string; reason: string; url?: string } | null;
  clone?: CloneCheckResult | null;
  /** Some other source (openFDA, scraper) identified the product. */
  identifiedElsewhere: boolean;
  /** Result of a MedLink authenticity QR code check, when one was scanned. */
  medlinkAuth?: 'valid' | 'invalid';
  now?: Date;
}

const DAY = 24 * 3600 * 1000;
const RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, info: 3 };

export function assess(input: AssessInput): Assessment {
  const { parsed, registry, alerts, recall, clone } = input;
  const now = input.now ?? new Date();
  const signals: Signal[] = [];

  if (input.medlinkAuth === 'valid') signals.push({ id: 'medlink_verified', severity: 'info' });
  if (input.medlinkAuth === 'invalid') signals.push({ id: 'medlink_invalid', severity: 'high' });
  if (recall) signals.push({ id: 'recalled', severity: 'critical', params: { source: recall.source, reason: recall.reason }, url: recall.url });

  for (const m of alerts) {
    const params = { alert: m.alert.id, title: m.alert.title, date: m.alert.date ?? '' };
    if (m.strength === 'batch') {
      signals.push({ id: 'who_batch', severity: 'critical', params: { ...params, lot: parsed.lot ?? '' }, url: m.alert.url });
    } else if (m.ageYears <= 3 && m.alert.kind !== 'other') {
      signals.push({ id: 'who_product_recent', severity: 'high', params, url: m.alert.url });
    } else {
      signals.push({ id: 'who_product_old', severity: 'info', params, url: m.alert.url });
    }
  }

  if (parsed.expiry) {
    const days = Math.floor((parsed.expiry.getTime() - now.getTime()) / DAY);
    const date = parsed.expiry.toISOString().slice(0, 10);
    if (days < 0) signals.push({ id: 'expired', severity: 'critical', params: { date } });
    else if (days <= 90) signals.push({ id: 'expires_soon', severity: 'medium', params: { date, days } });
  }

  if (parsed.issues.includes('gtin_check_digit')) signals.push({ id: 'check_digit', severity: 'high' });
  if (parsed.issues.includes('invalid_expiry')) signals.push({ id: 'invalid_expiry', severity: 'high' });
  if (parsed.issues.includes('restricted_prefix')) signals.push({ id: 'restricted_prefix', severity: 'high' });
  if (parsed.issues.includes('missing_separators')) signals.push({ id: 'missing_separators', severity: 'info' });

  if (clone) {
    if (clone.otherScanners >= 3) signals.push({ id: 'clone_suspected', severity: 'high', params: { count: clone.otherScanners } });
    else if (clone.otherScanners === 2) signals.push({ id: 'clone_possible', severity: 'medium', params: { count: clone.otherScanners } });
  }

  if (registry) {
    if (!registry.authorisationActive) {
      signals.push({ id: 'authorisation_withdrawn', severity: 'high', params: { country: registry.country } });
    } else if (!registry.productMarketed || !registry.presentationMarketed) {
      signals.push({ id: 'not_marketed', severity: 'medium', params: { country: registry.country } });
    }
    signals.push({ id: 'registered', severity: 'info', params: { country: registry.country, source: registry.source } });
  } else {
    // Only a complete official list can prove a product is missing; partial lists cannot.
    const complete = input.expected.find(e => e.exhaustive);
    if (complete && !parsed.issues.includes('gtin_check_digit')) {
      signals.push({ id: 'not_in_registry', severity: 'high', params: { country: complete.country } });
    }
  }

  signals.sort((a, b) => RANK[a.severity] - RANK[b.severity]);

  let verdict: Verdict;
  if (signals.some(s => s.severity === 'critical')) verdict = 'danger';
  else if (signals.some(s => s.severity === 'high')) verdict = 'warning';
  else if (registry || input.identifiedElsewhere || input.medlinkAuth === 'valid') verdict = 'ok';
  else verdict = 'unknown';

  return { verdict, signals };
}
