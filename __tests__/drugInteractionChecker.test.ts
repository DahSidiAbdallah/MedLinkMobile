/**
 * Tests for comprehensive drug interaction checker
 * These tests demonstrate real-world safety checking scenarios
 */

import {
  findRxcuiByDrugName,
  checkDrugInteractions,
  extractActiveIngredients,
  checkAllergyRisks,
  checkContraindications,
  checkDuplicateTherapy,
  checkDrugSafety,
} from '../src/utils/drugInteractionChecker';
import type { Profile } from '../src/core/userProfile';

// Mock network calls for tests
jest.mock('../src/utils/network', () => ({
  fetchWithRetries: jest.fn(),
}));

const mockFetch = require('../src/utils/network').fetchWithRetries;

describe('Drug Interaction Checker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findRxcuiByDrugName', () => {
    it('should find RxCUI for aspirin', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          idGroup: { rxnormId: ['1191'] }
        }),
      });

      const rxcui = await findRxcuiByDrugName('aspirin');
      expect(rxcui).toBe('1191');
    });

    it('should handle drug not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ idGroup: {} }),
      });

      const rxcui = await findRxcuiByDrugName('notarealdrug123');
      expect(rxcui).toBeNull();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const rxcui = await findRxcuiByDrugName('aspirin');
      expect(rxcui).toBeNull();
    });
  });

  describe('checkDrugInteractions', () => {
    it('should detect warfarin-aspirin interaction', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fullInteractionTypeGroup: [{
            fullInteractionType: [{
              interactionPair: [{
                severity: 'high',
                description: 'Increased risk of bleeding',
                interactionConcept: [
                  { rxcui: '11289', name: 'Warfarin' },
                  { rxcui: '1191', name: 'Aspirin' },
                ],
              }],
            }],
          }],
        }),
      });

      const interactions = await checkDrugInteractions(['11289', '1191']);
      expect(interactions.length).toBeGreaterThan(0);
      expect(interactions[0].severity).toBe('high');
      expect(interactions[0].description).toContain('bleeding');
    });
  });

  describe('extractActiveIngredients', () => {
    it('should extract ingredients from OpenFDA label', () => {
      const mockLabel = {
        openfda: {
          substance_name: ['ACETAMINOPHEN'],
          generic_name: ['acetaminophen'],
        },
        active_ingredient: ['Acetaminophen 500mg'],
      };

      const ingredients = extractActiveIngredients(mockLabel);
      expect(ingredients).toContain('acetaminophen');
      expect(ingredients.length).toBeGreaterThan(0);
    });

    it('should handle missing data', () => {
      const ingredients = extractActiveIngredients(null);
      expect(ingredients).toEqual([]);
    });
  });

  describe('checkAllergyRisks', () => {
    it('should detect penicillin allergy with amoxicillin', () => {
      const ingredients = ['amoxicillin'];
      const allergies = ['penicillin'];

      const checks = checkAllergyRisks(ingredients, allergies);
      expect(checks.length).toBeGreaterThan(0);
      expect(checks[0].severity).toBe('critical');
      expect(checks[0].type).toBe('allergy');
    });

    it('should detect NSAID class allergy', () => {
      const ingredients = ['ibuprofen'];
      const allergies = ['nsaid'];

      const checks = checkAllergyRisks(ingredients, allergies);
      expect(checks.length).toBeGreaterThan(0);
      expect(checks[0].message).toContain('DRUG CLASS ALLERGY');
    });

    it('should not flag when no allergies match', () => {
      const ingredients = ['acetaminophen'];
      const allergies = ['penicillin'];

      const checks = checkAllergyRisks(ingredients, allergies);
      expect(checks.length).toBe(0);
    });
  });

  describe('checkContraindications', () => {
    it('should detect diabetes contraindication', () => {
      const mockLabel = {
        contraindications: ['Patients with diabetes should use caution'],
        warnings: [],
      };
      const conditions = ['diabetes'];

      const checks = checkContraindications(mockLabel, conditions);
      expect(checks.length).toBeGreaterThan(0);
      expect(checks[0].type).toBe('contraindication');
      expect(checks[0].severity).toBe('high');
    });

    it('should detect kidney disease warning', () => {
      const mockLabel = {
        contraindications: [],
        warnings: ['Caution in patients with renal impairment'],
      };
      const conditions = ['kidney disease'];

      const checks = checkContraindications(mockLabel, conditions);
      expect(checks.length).toBeGreaterThan(0);
      expect(checks[0].message).toContain('kidney disease');
    });
  });

  describe('checkDuplicateTherapy', () => {
    it('should detect exact duplicate', async () => {
      const checks = await checkDuplicateTherapy('Lipitor', ['Lipitor']);
      expect(checks.length).toBeGreaterThan(0);
      expect(checks[0].type).toBe('duplicate');
    });

    it('should detect case-insensitive duplicate', async () => {
      const checks = await checkDuplicateTherapy('lipitor', ['Lipitor']);
      expect(checks.length).toBeGreaterThan(0);
    });

    it('should not flag different medications', async () => {
      const checks = await checkDuplicateTherapy('Aspirin', ['Tylenol']);
      expect(checks.length).toBe(0);
    });
  });

  describe('checkDrugSafety - Integration', () => {
    it('should perform comprehensive safety check', async () => {
      // Mock RxNorm lookups
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ idGroup: { rxnormId: ['1191'] } }), // Aspirin
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ idGroup: { rxnormId: ['11289'] } }), // Warfarin
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            fullInteractionTypeGroup: [{
              fullInteractionType: [{
                interactionPair: [{
                  severity: 'high',
                  description: 'Increased bleeding risk when taken together',
                  interactionConcept: [],
                }],
              }],
            }],
          }),
        });

      const mockLabel = {
        openfda: {
          brand_name: ['Bayer Aspirin'],
          generic_name: ['aspirin'],
          substance_name: ['ASPIRIN'],
        },
        contraindications: ['Patients with active bleeding'],
        warnings: [],
      };

      const mockProfile: Profile = {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        date_of_birth: '1990-01-01',
        allergies: [],
        medical_conditions: [],
        medications: ['Warfarin'], // Should trigger interaction
      };

      const result = await checkDrugSafety(mockLabel, mockProfile);
      
      expect(result.safe).toBe(false);
      expect(result.overallSeverity).not.toBe('safe');
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.scannedDrugInfo?.name).toBe('Bayer Aspirin');
    });

    it('should flag critical allergy', async () => {
      const mockLabel = {
        openfda: {
          brand_name: ['Amoxil'],
          substance_name: ['AMOXICILLIN'],
        },
      };

      const mockProfile: Profile = {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        date_of_birth: '1990-01-01',
        allergies: ['penicillin'], // Critical: Amoxicillin is a penicillin
        medical_conditions: [],
        medications: [],
      };

      const result = await checkDrugSafety(mockLabel, mockProfile);
      
      expect(result.safe).toBe(false);
      expect(result.overallSeverity).toBe('danger');
      expect(result.checks.some(c => c.severity === 'critical')).toBe(true);
    });

    it('should return safe for no conflicts', async () => {
      const mockLabel = {
        openfda: {
          brand_name: ['Tylenol'],
          generic_name: ['acetaminophen'],
          substance_name: ['ACETAMINOPHEN'],
        },
        contraindications: [],
        warnings: [],
      };

      const mockProfile: Profile = {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        date_of_birth: '1990-01-01',
        allergies: ['penicillin'],
        medical_conditions: [],
        medications: [],
      };

      const result = await checkDrugSafety(mockLabel, mockProfile);
      
      expect(result.safe).toBe(true);
      expect(result.overallSeverity).toBe('safe');
    });
  });
});

describe('Real-World Scenarios', () => {
  it('Scenario 1: User on warfarin scans aspirin (dangerous)', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ idGroup: { rxnormId: ['1191'] } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ idGroup: { rxnormId: ['11289'] } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fullInteractionTypeGroup: [{
            fullInteractionType: [{
              interactionPair: [{
                severity: 'high',
                description: 'Aspirin may enhance the anticoagulant effect of Warfarin',
              }],
            }],
          }],
        }),
      });

    const aspirinLabel = {
      openfda: {
        brand_name: ['Aspirin'],
        substance_name: ['ASPIRIN'],
      },
    };

    const userOnWarfarin: Profile = {
      id: 'test',
      name: 'Test',
      email: 'test@test.com',
      phone: '123',
      date_of_birth: '1980-01-01',
      allergies: [],
      medical_conditions: [],
      medications: ['warfarin'],
    };

    const result = await checkDrugSafety(aspirinLabel, userOnWarfarin);
    expect(result.safe).toBe(false);
    expect(result.checks.some(c => c.type === 'interaction')).toBe(true);
  });

  it('Scenario 2: Penicillin-allergic user scans amoxicillin (critical)', async () => {
    const amoxicillinLabel = {
      openfda: {
        brand_name: ['Amoxil'],
        substance_name: ['AMOXICILLIN'],
      },
    };

    const penicillinAllergic: Profile = {
      id: 'test',
      name: 'Test',
      email: 'test@test.com',
      phone: '123',
      date_of_birth: '1980-01-01',
      allergies: ['penicillin'],
      medical_conditions: [],
      medications: [],
    };

    const result = await checkDrugSafety(amoxicillinLabel, penicillinAllergic);
    expect(result.safe).toBe(false);
    expect(result.overallSeverity).toBe('danger');
    expect(result.checks.some(c => c.severity === 'critical')).toBe(true);
  });

  it('Scenario 3: Diabetic user scans medication with diabetes warning', async () => {
    const steroidLabel = {
      openfda: {
        brand_name: ['Prednisone'],
        substance_name: ['PREDNISONE'],
      },
      warnings: ['May increase blood glucose levels in diabetic patients'],
      contraindications: ['Use caution in diabetes mellitus'],
    };

    const diabeticUser: Profile = {
      id: 'test',
      name: 'Test',
      email: 'test@test.com',
      phone: '123',
      date_of_birth: '1980-01-01',
      allergies: [],
      medical_conditions: ['diabetes'],
      medications: [],
    };

    const result = await checkDrugSafety(steroidLabel, diabeticUser);
    expect(result.safe).toBe(false);
    expect(result.checks.some(c => c.type === 'contraindication')).toBe(true);
  });
});

