/**
 * drugInteractionChecker.ts
 *
 * Uses the NIH RxNorm Interaction API to perform real clinical drug-drug
 * interaction checks against a user's current medication list.
 *
 * API docs: https://rxnav.nlm.nih.gov/InteractionAPIs.html
 */

import { findRxcuiByName } from './rxnorm';

// ── Types ─────────────────────────────────────────────────────────────────────

export type InteractionSeverity = 'major' | 'moderate' | 'minor' | 'unknown';

export interface DrugInteraction {
  /** The user's current medication that interacts with the scanned drug */
  medication: string;
  /** Clinical severity level from RxNorm */
  severity: InteractionSeverity;
  /** Human-readable description of the interaction from RxNorm */
  description: string;
}

export interface SafetyCheck {
  /** Name of the scanned/looked-up drug */
  drugName: string;
  /** RxNorm concept unique identifier (null if lookup failed) */
  rxcui: string | null;
  /** List of interactions found with profile medications */
  interactions: DrugInteraction[];
  /** True if any interaction is major or moderate */
  hasSerious: boolean;
  /** True if the RxNorm API call succeeded */
  apiAvailable: boolean;
}

// ── RxNorm Interaction Fetcher ────────────────────────────────────────────────

interface RxNormInteractionPair {
  interactionConcept?: Array<{
    minConceptItem?: { name?: string; rxcui?: string };
    sourceConceptItem?: { name?: string; rxcui?: string };
  }>;
  severity?: string;
  description?: string;
}

async function fetchRxNormInteractions(rxcui: string): Promise<RxNormInteractionPair[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${encodeURIComponent(rxcui)}`;
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!resp.ok) return [];
    const data = await resp.json();

    // The response structure: interactionTypeGroup[].interactionType[].interactionPair[]
    const pairs: RxNormInteractionPair[] = [];
    const groups: any[] = data?.interactionTypeGroup ?? [];
    for (const group of groups) {
      const types: any[] = group?.interactionType ?? [];
      for (const type of types) {
        const typePairs: any[] = type?.interactionPair ?? [];
        pairs.push(...typePairs);
      }
    }
    return pairs;
  } catch (e: any) {
    clearTimeout(timeoutId);
    // AbortError = timeout, network error, etc. — fail gracefully
    return [];
  }
}

function normalizeSeverity(raw: string | undefined): InteractionSeverity {
  if (!raw) return 'unknown';
  const s = raw.toLowerCase();
  if (s.includes('high') || s.includes('major') || s.includes('serious') || s.includes('severe')) return 'major';
  if (s.includes('moderate') || s.includes('medium') || s.includes('significant')) return 'moderate';
  if (s.includes('low') || s.includes('minor') || s.includes('minimal')) return 'minor';
  return 'unknown';
}

// ── Main Export ───────────────────────────────────────────────────────────────

/**
 * Checks a drug (by name) against the user's current medication list using the
 * RxNorm Interaction API. Returns structured interaction results with severity.
 *
 * @param drugName      The name of the scanned / identified drug
 * @param profileMeds   Array of medication names from the user's profile
 */
export async function checkDrugSafety(
  drugName: string,
  profileMeds: string[]
): Promise<SafetyCheck> {
  const empty: SafetyCheck = {
    drugName,
    rxcui: null,
    interactions: [],
    hasSerious: false,
    apiAvailable: false,
  };

  if (!drugName.trim() || !profileMeds.length) return empty;

  // Step 1: Resolve drug name → RXCUI
  const rxcui = await findRxcuiByName(drugName);
  if (!rxcui) return { ...empty, apiAvailable: true };

  // Step 2: Fetch all known interactions for this drug
  const pairs = await fetchRxNormInteractions(rxcui);
  if (!pairs.length) return { ...empty, rxcui, apiAvailable: true };

  // Step 3: Cross-match with profile medications
  const interactions: DrugInteraction[] = [];

  for (const profileMed of profileMeds) {
    const medLower = profileMed.toLowerCase().trim();
    if (!medLower) continue;

    for (const pair of pairs) {
      // Each pair has two interactionConcept entries (the two drugs that interact)
      const concepts = pair.interactionConcept ?? [];
      const conceptNames = concepts.map(c =>
        (c.minConceptItem?.name ?? c.sourceConceptItem?.name ?? '').toLowerCase()
      );

      // Check if any concept name matches the user's medication
      const matched = conceptNames.some(cn =>
        cn.includes(medLower) || medLower.includes(cn.split(' ')[0])
      );

      if (matched) {
        // Avoid duplicates for the same medication
        const alreadyAdded = interactions.some(i => i.medication.toLowerCase() === medLower);
        if (!alreadyAdded) {
          interactions.push({
            medication: profileMed,
            severity: normalizeSeverity(pair.severity),
            description: pair.description ?? 'Potential drug-drug interaction detected.',
          });
        }
        break;
      }
    }
  }

  return {
    drugName,
    rxcui,
    interactions,
    hasSerious: interactions.some(i => i.severity === 'major' || i.severity === 'moderate'),
    apiAvailable: true,
  };
}
