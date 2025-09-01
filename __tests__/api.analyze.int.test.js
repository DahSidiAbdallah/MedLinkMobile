const nock = require('nock');
const request = require('supertest');
const express = require('express');
const analyzeRouter = require('../server/api/analyze').default;

const app = express();
app.use(express.json());
app.use('/analyze', analyzeRouter);

describe('POST /analyze', () => {
  afterEach(() => nock.cleanAll());

  test('returns advisory for scanned product', async () => {
    nock('https://rxnav.nlm.nih.gov').get(/rxcui.json/).reply(200, { idGroup: { rxnormId: ['111'] } });
    nock('https://rxnav.nlm.nih.gov').get(/interaction\/list.json/).reply(200, { fullInteractionTypeGroup: [] });
    nock('https://api.fda.gov').get(/drug\/label.json/).reply(200, { results: [{ contraindications: [], warnings: [] }] });

    const body = { scanned: { name: 'acetaminophen', ingredients: ['acetaminophen'] }, profile: { userId: 'u1', currentMeds: [] } };
    const res = await request(app).post('/analyze').send(body).expect(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('reasons');
  });
});
