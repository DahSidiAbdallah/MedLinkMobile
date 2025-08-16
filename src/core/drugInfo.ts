// Core drug info logic for cross-platform use
import { medications } from '../data';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export type DataMedication = typeof medications[0];

export async function searchDrug(query: string): Promise<DataMedication | null> {
  // Search in local data
  const drug = medications.find(med => 
    med.name.toLowerCase() === query.toLowerCase() ||
    (med.generic_name && med.generic_name.toLowerCase() === query.toLowerCase())
  );
  return drug || null;
}

export function getDrugSuggestions(query: string): string[] {
  if (!query.trim()) return [];
  return medications
    .filter(med => 
      med.name.toLowerCase().includes(query.toLowerCase()) ||
      (med.generic_name && med.generic_name.toLowerCase().includes(query.toLowerCase()))
    )
    .map(med => med.name);
}

export async function verifyDrugByQrCode(qrData: string): Promise<{ drug: DataMedication | null; verified: boolean; message: string; similarityScore?: number; imageMatch?: boolean }> {
  // Parse QR code data
  if (!qrData.startsWith('MedLink:AUTH:')) {
    return {
      drug: null,
      verified: false,
      message: 'Invalid QR code format'
    };
  }
  const authenticityCode = qrData.replace('MedLink:AUTH:', '');
  // Find medication by authenticity code
  const drug = medications.find(med => med.authenticity_code === authenticityCode);
  if (drug) {
    return {
      drug,
      verified: true,
      message: 'Drug authenticity verified',
      similarityScore: 1,
      imageMatch: true
    };
  }
  // Try to find it in the cloud database
  try {
    const medicationsRef = collection(db, 'medications');
    const q = query(medicationsRef, where('authenticity_code', '==', authenticityCode));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      return {
        drug: docData as DataMedication,
        verified: true,
        message: 'Drug authenticity verified (cloud)',
        similarityScore: 1,
        imageMatch: true
      };
    }
  } catch (err) {
    // ignore cloud error
  }
  return {
    drug: null,
    verified: false,
    message: 'Drug not found'
  };
}
