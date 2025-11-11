/**
 * Comprehensive Drug Interaction and Safety Checker
 * 
 * This module provides real drug interaction checking using:
 * - RxNorm API for drug identification and interactions
 * - OpenFDA for contraindications and warnings
 * - Profile-based safety checks (allergies, conditions, medications)
 */

import { fetchWithRetries } from './network';
import type { Profile } from '../core/userProfile';

export interface SafetyCheck {
  type: 'interaction' | 'allergy' | 'contraindication' | 'duplicate' | 'warning';
  severity: 'critical' | 'high' | 'moderate' | 'low';
  message: string;
  detail: string;
  source: string;
}

export interface DrugSafetyResult {
  safe: boolean;
  overallSeverity: 'safe' | 'warning' | 'danger';
  checks: SafetyCheck[];
  scannedDrugInfo?: {
    name?: string;
    activeIngredients?: string[];
    rxcui?: string;
  };
}

interface RxNormConcept {
  rxcui: string;
  name: string;
}

interface DrugInteraction {
  minConcept: RxNormConcept[];
  severity: string;
  description: string;
}

/**
 * Find RxCUI (RxNorm Concept Unique Identifier) for a drug name
 * This is the standard medical identifier used for drug interactions
 */
export async function findRxcuiByDrugName(drugName: string): Promise<string | null> {
  if (!drugName || drugName.trim().length === 0) return null;
  
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(drugName)}&search=1`;
    const resp = await fetchWithRetries(url, undefined, { retries: 2, timeoutMs: 5000 });
    
    if (!resp?.ok) return null;
    
    const data = await resp.json();
    const rxcui = data?.idGroup?.rxnormId?.[0];
    return rxcui || null;
  } catch (e) {
    console.warn('RxNorm lookup failed:', e);
    return null;
  }
}

/**
 * Get drug interactions for a list of RxCUIs using RxNorm Interaction API
 */
export async function checkDrugInteractions(rxcuis: string[]): Promise<DrugInteraction[]> {
  if (!rxcuis || rxcuis.length === 0) return [];
  
  try {
    const rxcuiList = rxcuis.join('+');
    const url = `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcuiList}`;
    const resp = await fetchWithRetries(url, undefined, { retries: 2, timeoutMs: 8000 });
    
    if (!resp?.ok) return [];
    
    const data = await resp.json();
    const interactions: DrugInteraction[] = [];
    
    // Parse interaction data
    const fullInteractionTypeGroup = data?.fullInteractionTypeGroup || [];
    for (const group of fullInteractionTypeGroup) {
      const interactionTypes = group?.fullInteractionType || [];
      for (const interactionType of interactionTypes) {
        const interactionPairs = interactionType?.interactionPair || [];
        for (const pair of interactionPairs) {
          interactions.push({
            minConcept: pair.interactionConcept || [],
            severity: pair.severity || 'N/A',
            description: pair.description || 'Interaction detected',
          });
        }
      }
    }
    
    return interactions;
  } catch (e) {
    console.warn('Drug interaction check failed:', e);
    return [];
  }
}

/**
 * Extract active ingredients from OpenFDA label data
 */
export function extractActiveIngredients(labelData: any): string[] {
  const ingredients: string[] = [];
  
  if (!labelData) return ingredients;
  
  // Try openfda.substance_name (most reliable)
  if (labelData.openfda?.substance_name) {
    ingredients.push(...labelData.openfda.substance_name);
  }
  
  // Try active_ingredient
  if (labelData.active_ingredient && Array.isArray(labelData.active_ingredient)) {
    ingredients.push(...labelData.active_ingredient);
  }
  
  // Try openfda.generic_name
  if (labelData.openfda?.generic_name) {
    ingredients.push(...labelData.openfda.generic_name);
  }
  
  // Deduplicate and clean
  return [...new Set(ingredients)]
    .map(i => i.trim().toLowerCase())
    .filter(i => i.length > 0);
}

/**
 * Check if scanned drug ingredients match user allergies
 */
export function checkAllergyRisks(
  activeIngredients: string[],
  userAllergies: string[]
): SafetyCheck[] {
  const checks: SafetyCheck[] = [];
  
  if (!userAllergies || userAllergies.length === 0) return checks;
  
  for (const allergy of userAllergies) {
    const allergyLower = allergy.toLowerCase().trim();
    
    // Check exact ingredient match
    for (const ingredient of activeIngredients) {
      if (ingredient.includes(allergyLower) || allergyLower.includes(ingredient)) {
        checks.push({
          type: 'allergy',
          severity: 'critical',
          message: `⚠️ ALLERGY ALERT: Contains ${allergy}`,
          detail: `This medication contains ${ingredient}, which may be related to your allergy to ${allergy}. Do not take without consulting your doctor.`,
          source: 'Profile Allergies',
        });
      }
    }
    
    // Check drug class allergies (e.g., "penicillin" in "amoxicillin")
    const classKeywords: Record<string, string[]> = {
      penicillin: ['penicillin', 'amoxicillin', 'ampicillin', 'oxacillin'],
      sulfa: ['sulfa', 'sulfamethoxazole', 'sulfadiazine', 'sulfasalazine'],
      cephalosporin: ['cephalosporin', 'cefazolin', 'cephalexin', 'ceftriaxone'],
      nsaid: ['ibuprofen', 'naproxen', 'diclofenac', 'aspirin', 'indomethacin'],
      statin: ['statin', 'atorvastatin', 'simvastatin', 'rosuvastatin'],
    };
    
    for (const [drugClass, keywords] of Object.entries(classKeywords)) {
      if (allergyLower.includes(drugClass)) {
        for (const ingredient of activeIngredients) {
          for (const keyword of keywords) {
            if (ingredient.includes(keyword)) {
              checks.push({
                type: 'allergy',
                severity: 'critical',
                message: `⚠️ DRUG CLASS ALLERGY: ${drugClass.toUpperCase()}`,
                detail: `This medication (${ingredient}) belongs to the ${drugClass} class, which you are allergic to. DO NOT TAKE.`,
                source: 'Drug Class Analysis',
              });
            }
          }
        }
      }
    }
  }
  
  return checks;
}

/**
 * Check contraindications based on medical conditions
 */
export function checkContraindications(
  labelData: any,
  medicalConditions: string[]
): SafetyCheck[] {
  const checks: SafetyCheck[] = [];
  
  if (!medicalConditions || medicalConditions.length === 0) return checks;
  
  // Combine contraindications and warnings text
  const contraindicationsText = (
    (labelData?.contraindications || []).join(' ') + ' ' +
    (labelData?.warnings || []).join(' ') + ' ' +
    (labelData?.warnings_and_cautions || []).join(' ') + ' ' +
    (labelData?.precautions || []).join(' ')
  ).toLowerCase();
  
  // Condition keyword mapping
  const conditionKeywords: Record<string, string[]> = {
    diabetes: ['diabetes', 'diabetic', 'hyperglycemia', 'blood glucose', 'insulin'],
    hypertension: ['hypertension', 'high blood pressure', 'blood pressure'],
    asthma: ['asthma', 'bronchospasm', 'respiratory', 'breathing'],
    'kidney disease': ['renal', 'kidney', 'nephro', 'creatinine', 'gfr'],
    'liver disease': ['hepatic', 'liver', 'cirrhosis', 'hepatitis', 'alt', 'ast'],
    'heart disease': ['cardiac', 'heart', 'cardiovascular', 'coronary', 'arrhythmia'],
    pregnancy: ['pregnancy', 'pregnant', 'fetal', 'teratogenic'],
    glaucoma: ['glaucoma', 'intraocular pressure', 'iop'],
    epilepsy: ['seizure', 'epilepsy', 'convulsion'],
    ulcer: ['ulcer', 'gastric', 'peptic', 'gi bleed'],
  };
  
  for (const condition of medicalConditions) {
    const conditionLower = condition.toLowerCase().trim();
    
    // Direct keyword match
    if (contraindicationsText.includes(conditionLower)) {
      checks.push({
        type: 'contraindication',
        severity: 'high',
        message: `⚠️ Contraindication: ${condition}`,
        detail: `This medication has warnings for people with ${condition}. Consult your doctor before use.`,
        source: 'FDA Label Contraindications',
      });
    }
    
    // Check related keywords
    for (const [key, keywords] of Object.entries(conditionKeywords)) {
      if (conditionLower.includes(key) || key.includes(conditionLower)) {
        for (const keyword of keywords) {
          if (contraindicationsText.includes(keyword)) {
            checks.push({
              type: 'contraindication',
              severity: 'high',
              message: `⚠️ Medical Condition Warning: ${condition}`,
              detail: `This medication may not be suitable for people with ${condition}. The label mentions ${keyword}. Please consult your doctor.`,
              source: 'FDA Label Analysis',
            });
            break; // Only report once per condition
          }
        }
      }
    }
  }
  
  return checks;
}

/**
 * Check for duplicate therapy (same drug or drug class)
 */
export async function checkDuplicateTherapy(
  scannedDrugName: string,
  currentMedications: string[]
): Promise<SafetyCheck[]> {
  const checks: SafetyCheck[] = [];
  
  if (!currentMedications || currentMedications.length === 0) return checks;
  
  const scannedLower = scannedDrugName.toLowerCase();
  
  // Check for exact or similar drug names
  for (const med of currentMedications) {
    const medLower = med.toLowerCase();
    
    // Exact match or substring match
    if (scannedLower === medLower || scannedLower.includes(medLower) || medLower.includes(scannedLower)) {
      checks.push({
        type: 'duplicate',
        severity: 'moderate',
        message: `Duplicate Medication Detected`,
        detail: `You are already taking "${med}". Taking the same medication twice could lead to overdose.`,
        source: 'Profile Medications',
      });
    }
  }
  
  return checks;
}

/**
 * Main function: Comprehensive drug safety check against user profile
 */
export async function checkDrugSafety(
  labelData: any,
  profile: Profile
): Promise<DrugSafetyResult> {
  const allChecks: SafetyCheck[] = [];
  
  // Extract drug information
  const drugName = labelData?.openfda?.brand_name?.[0] || 
                   labelData?.openfda?.generic_name?.[0] || 
                   'Unknown Drug';
  
  const activeIngredients = extractActiveIngredients(labelData);
  
  // 1. Check allergies against active ingredients
  const allergyChecks = checkAllergyRisks(
    activeIngredients,
    profile.allergies || []
  );
  allChecks.push(...allergyChecks);
  
  // 2. Check contraindications against medical conditions
  const contraindicationChecks = checkContraindications(
    labelData,
    profile.medical_conditions || []
  );
  allChecks.push(...contraindicationChecks);
  
  // 3. Check for duplicate therapy
  const duplicateChecks = await checkDuplicateTherapy(
    drugName,
    profile.medications || []
  );
  allChecks.push(...duplicateChecks);
  
  // 4. Check drug-drug interactions using RxNorm
  if (profile.medications && profile.medications.length > 0) {
    try {
      // Get RxCUI for scanned drug
      const scannedRxcui = await findRxcuiByDrugName(drugName);
      
      if (scannedRxcui) {
        // Get RxCUIs for user's current medications
        const currentRxcuis = await Promise.all(
          profile.medications.map(med => findRxcuiByDrugName(med))
        );
        
        const validRxcuis = [scannedRxcui, ...currentRxcuis.filter(r => r !== null)] as string[];
        
        if (validRxcuis.length > 1) {
          const interactions = await checkDrugInteractions(validRxcuis);
          
          for (const interaction of interactions) {
            let severity: 'critical' | 'high' | 'moderate' | 'low' = 'moderate';
            
            if (interaction.severity.toLowerCase().includes('high') || 
                interaction.severity.toLowerCase().includes('contraindicated')) {
              severity = 'critical';
            } else if (interaction.severity.toLowerCase().includes('moderate')) {
              severity = 'moderate';
            } else {
              severity = 'low';
            }
            
            allChecks.push({
              type: 'interaction',
              severity,
              message: `Drug Interaction: ${interaction.severity}`,
              detail: interaction.description,
              source: 'RxNorm Interaction API',
            });
          }
        }
      }
    } catch (e) {
      console.warn('Drug interaction API check failed:', e);
    }
  }
  
  // Determine overall safety
  const hasCritical = allChecks.some(c => c.severity === 'critical');
  const hasHigh = allChecks.some(c => c.severity === 'high');
  
  let overallSeverity: 'safe' | 'warning' | 'danger' = 'safe';
  if (hasCritical) {
    overallSeverity = 'danger';
  } else if (hasHigh || allChecks.length > 0) {
    overallSeverity = 'warning';
  }
  
  return {
    safe: allChecks.length === 0,
    overallSeverity,
    checks: allChecks,
    scannedDrugInfo: {
      name: drugName,
      activeIngredients,
    },
  };
}

