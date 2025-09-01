import express from 'express';
import { analyzeScanAgainstProfile } from '../analyze';

const router = express.Router();

// POST /analyze
// body: { scanned: { name: string, ingredients: string[] }, profile: PatientProfile }
router.post('/', async (req, res) => {
  try {
    const { scanned, profile } = req.body;
    if (!scanned || !profile) return res.status(400).json({ error: 'missing scanned or profile' });
    const advisory = await analyzeScanAgainstProfile(scanned, profile);
    return res.json(advisory);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'server error' });
  }
});

export default router;
