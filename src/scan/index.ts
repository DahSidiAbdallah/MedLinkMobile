import { parseCode, ParsedCode } from './parseCode';
import { lookupRegistries, expectedRegistries, isExhaustive, RegistryMatch } from './registries';
import { matchAlerts, AlertMatch } from './alerts';
import { recordAndCheckSerial, CloneCheckResult } from './cloneCheck';
import { assess, Assessment } from './assess';
import { toEnglishInn } from './inn';
import { findLocalRecall } from '../utils/localRecalls';
import { verifyScannedCode, VerificationResult } from '../utils/verification';

export interface ScanReport {
  parsed: ParsedCode;
  registry: RegistryMatch | null;
  verification: VerificationResult | null;
  alerts: AlertMatch[];
  clone: CloneCheckResult | null;
  assessment: Assessment;
  /** Best available display name and English INNs, for profile cross-checks. */
  productName?: string;
  substancesEn: string[];
}

function nameFromVerification(v: VerificationResult | null): string | undefined {
  const label = v?.label;
  const scraper = v?.webscraperInfo;
  return label?.openfda?.brand_name?.[0] || label?.brand_name || label?.openfda?.generic_name?.[0]
    || scraper?.brand_name || scraper?.name || scraper?.title || undefined;
}

function substancesFromVerification(v: VerificationResult | null): string[] {
  const label = v?.label;
  const list: string[] = label?.openfda?.generic_name || label?.openfda?.substance_name || [];
  return list.flatMap((s: string) => s.split(/,| and /i)).map(s => s.trim()).filter(Boolean);
}

/**
 * Full scan pipeline: parse the code → national registries → curated recalls → openFDA /
 * web scraper (when the product isn't already identified locally) → WHO alerts →
 * cloned-serial check → assessment.
 */
export async function scanMedication(raw: string, symbology: string): Promise<ScanReport> {
  const parsed = parseCode(raw, symbology);
  const registry = lookupRegistries(parsed);
  const expected = expectedRegistries(parsed).map(country => ({ country, exhaustive: isExhaustive(country) }));

  const lookupCode = parsed.gtin || parsed.national[0]?.value || raw;
  const localRecall = findLocalRecall(lookupCode, parsed.lot);

  const [verification, clone] = await Promise.all([
    verifyScannedCode(raw, symbology, { skipUsLookups: !!registry && registry.country !== 'US' }).catch(() => null),
    parsed.gtin && parsed.serial ? recordAndCheckSerial(parsed.gtin, parsed.serial) : Promise.resolve(null),
  ]);

  const productName = registry?.name || nameFromVerification(verification);
  const substances = registry?.substances.length ? registry.substances : substancesFromVerification(verification);

  const alerts = matchAlerts({ name: productName, substances, holder: registry?.holder, lot: parsed.lot });
  const recall = localRecall
    ?? (verification?.recall
      ? { source: verification.recall.source || 'openFDA', reason: verification.recall.reason_for_recall || verification.recall.reason || '', url: verification.recall.url }
      : null);

  const identifiedElsewhere = !!(verification?.label || verification?.labelInfo || verification?.webscraperInfo);
  const medlinkAuth = parsed.format === 'medlink' && verification
    ? (verification.verified ? 'valid' as const : 'invalid' as const)
    : undefined;
  const assessment = assess({ parsed, registry, expected, alerts, recall, clone, identifiedElsewhere, medlinkAuth });

  return {
    parsed,
    registry,
    verification,
    alerts,
    clone,
    assessment,
    productName,
    substancesEn: [...new Set(substances.map(toEnglishInn))],
  };
}

export { parseCode } from './parseCode';
export type { ParsedCode } from './parseCode';
export type { Assessment, Signal, Verdict } from './assess';
