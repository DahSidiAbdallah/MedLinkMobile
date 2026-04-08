// Core drug info logic — Firestore primary, local data as offline fallback
import { medications as localMedications } from '../data';
import { db } from '../lib/firebase';
import { collection, query as fsQuery, where, getDocs, orderBy, limit } from 'firebase/firestore';

export type DataMedication = typeof localMedications[0];

/** Search Firestore medications collection, fall back to local data if offline */
export async function searchDrug(name: string): Promise<DataMedication | null> {
  if (!name.trim()) return null;
  const needle = name.trim().toLowerCase();

  // Try Firestore first
  try {
    const ref = collection(db, 'medications');

    // Exact name match
    const exactSnap = await getDocs(fsQuery(ref, where('name_lower', '==', needle), limit(1)));
    if (!exactSnap.empty) return exactSnap.docs[0].data() as DataMedication;

    // Generic name match
    const genericSnap = await getDocs(fsQuery(ref, where('generic_name_lower', '==', needle), limit(1)));
    if (!genericSnap.empty) return genericSnap.docs[0].data() as DataMedication;

    // All docs for prefix matching (acceptable for small collections)
    const allSnap = await getDocs(ref);
    for (const doc of allSnap.docs) {
      const d = doc.data() as DataMedication;
      if (
        d.name?.toLowerCase().includes(needle) ||
        (d as any).generic_name?.toLowerCase().includes(needle)
      ) {
        return d;
      }
    }
  } catch {
    // Offline or permission error — fall through to local data
  }

  // Local fallback
  return localMedications.find(
    med =>
      med.name.toLowerCase() === needle ||
      ((med as any).generic_name && (med as any).generic_name.toLowerCase() === needle)
  ) ?? null;
}

/** Get autocomplete suggestions — Firestore primary, local fallback */
export async function getDrugSuggestionsAsync(name: string): Promise<string[]> {
  if (!name.trim()) return [];
  const needle = name.trim().toLowerCase();

  try {
    const allSnap = await getDocs(collection(db, 'medications'));
    const results: string[] = [];
    for (const doc of allSnap.docs) {
      const d = doc.data() as DataMedication;
      if (d.name?.toLowerCase().includes(needle)) results.push(d.name);
    }
    if (results.length > 0) return results.slice(0, 10);
  } catch {
    // fall through
  }

  // Local fallback (synchronous)
  return localMedications
    .filter(
      med =>
        med.name.toLowerCase().includes(needle) ||
        ((med as any).generic_name && (med as any).generic_name.toLowerCase().includes(needle))
    )
    .map(med => med.name)
    .slice(0, 10);
}

/** Synchronous suggestions from local data (for immediate UI response) */
export function getDrugSuggestions(name: string): string[] {
  if (!name.trim()) return [];
  const needle = name.trim().toLowerCase();
  return localMedications
    .filter(
      med =>
        med.name.toLowerCase().includes(needle) ||
        ((med as any).generic_name && (med as any).generic_name.toLowerCase().includes(needle))
    )
    .map(med => med.name)
    .slice(0, 10);
}

/** Verify drug authenticity by QR code — Firestore primary, local fallback */
export async function verifyDrugByQrCode(qrData: string): Promise<{
  drug: DataMedication | null;
  verified: boolean;
  message: string;
  similarityScore?: number;
  imageMatch?: boolean;
}> {
  if (!qrData.startsWith('MedLink:AUTH:')) {
    return { drug: null, verified: false, message: 'Invalid QR code format' };
  }

  const authenticityCode = qrData.replace('MedLink:AUTH:', '');

  // Firestore lookup first
  try {
    const ref = collection(db, 'medications');
    const snap = await getDocs(fsQuery(ref, where('authenticity_code', '==', authenticityCode), limit(1)));
    if (!snap.empty) {
      return {
        drug: snap.docs[0].data() as DataMedication,
        verified: true,
        message: 'Drug authenticity verified',
        similarityScore: 1,
        imageMatch: true,
      };
    }
  } catch {
    // fall through
  }

  // Local fallback
  const local = localMedications.find(med => (med as any).authenticity_code === authenticityCode);
  if (local) {
    return { drug: local, verified: true, message: 'Drug authenticity verified (offline)', similarityScore: 1, imageMatch: true };
  }

  return { drug: null, verified: false, message: 'Drug not found' };
}
