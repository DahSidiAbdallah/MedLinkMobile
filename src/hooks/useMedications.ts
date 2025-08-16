import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { Medication } from '../types.js';

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedications = async () => {
      setLoading(true);
      try {
        const medicationsCollection = collection(db, 'medications');
        const medicationsQuery = query(medicationsCollection, orderBy('name'));
        const querySnapshot = await getDocs(medicationsQuery);
        
        const medicationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Medication[];
        
        setMedications(medicationsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching medications:', err);
        setError('Failed to load medications');
      } finally {
        setLoading(false);
      }
    };

    fetchMedications();
  }, []);

  const getMedicationById = async (id: string): Promise<Medication | null> => {
    try {
      const medicationDoc = doc(db, 'medications', id);
      const medicationSnapshot = await getDoc(medicationDoc);
      
      if (medicationSnapshot.exists()) {
        return {
          id: medicationSnapshot.id,
          ...medicationSnapshot.data()
        } as Medication;
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching medication by ID:', err);
      return null;
    }
  };

  return {
    medications,
    loading,
    error,
    getMedicationById
  };
}
