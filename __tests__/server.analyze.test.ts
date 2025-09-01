import nock from 'nock';
import { analyzeScanAgainstProfile, rxcuiForName } from '../server/analyze';

describe('server/analyze', () => {
  afterEach(() => nock.cleanAll());

  test('happy path - no issues (green)', async () => {
    // mock rxcui for ingredient
    nock('https://rxnav.nlm.nih.gov').get(/rxcui.json/).reply(200, { idGroup: { rxnormId: ['12345'] } });
    // mock interactions -> empty
    nock('https://rxnav.nlm.nih.gov').get(/interaction\/list.json/).reply(200, { fullInteractionTypeGroup: [] });
    // mock openFDA label
    nock('https://api.fda.gov').get(/drug\/label.json/).reply(200, { results: [{ contraindications: [], warnings: [] }] });

    const scanned = { name: 'acetaminophen', ingredients: ['acetaminophen'] };
    const profile = { userId: 'u1', currentMeds: [{ name: 'omeprazole' }], allergies: [] } as any;
    const res = await analyzeScanAgainstProfile(scanned, profile);
    expect(res.status).toBe('green');
  });

  test('allergy detected (red)', async () => {
    nock('https://rxnav.nlm.nih.gov').get(/rxcui.json/).reply(200, { idGroup: { rxnormId: [null] } });
    nock('https://rxnav.nlm.nih.gov').get(/interaction\/list.json/).reply(200, { fullInteractionTypeGroup: [] });
    nock('https://api.fda.gov').get(/drug\/label.json/).reply(200, { results: [{ warnings: ['Contains penicillin'] }] });

    const scanned = { name: 'amoxicillin', ingredients: ['amoxicillin'] };
    const profile = { userId: 'u2', allergies: [{ type: 'drug', value: 'penicillin' }] } as any;
    const res = await analyzeScanAgainstProfile(scanned, profile);
    expect(res.status).toBe('red');
    expect(res.reasons.some(r => r.type === 'allergy')).toBe(true);
  });

  test('interaction detected (red)', async () => {
    // rxcui for scanned & current
    nock('https://rxnav.nlm.nih.gov').get(/rxcui.json\?name=ibuprofen/).reply(200, { idGroup: { rxnormId: ['111'] } });
    nock('https://rxnav.nlm.nih.gov').get(/rxcui.json\?name=warfarin/).reply(200, { idGroup: { rxnormId: ['222'] } });
    // interactions response
    const inter = { fullInteractionTypeGroup: [{ fullInteractionType: [{ interactionPair: [{ severity: 'high', description: 'Major interaction' }] }] }] };
    nock('https://rxnav.nlm.nih.gov').get(/interaction\/list.json/).reply(200, inter);
    nock('https://api.fda.gov').get(/drug\/label.json/).reply(200, { results: [{ contraindications: [], warnings: [] }] });

    const scanned = { name: 'ibuprofen', ingredients: ['ibuprofen'] };
    const profile = { userId: 'u3', currentMeds: [{ name: 'warfarin' }] } as any;
    const res = await analyzeScanAgainstProfile(scanned, profile);
    expect(res.status).toBe('red');
    expect(res.reasons.some(r => r.type === 'interaction')).toBe(true);
  });
});
