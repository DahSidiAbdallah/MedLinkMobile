import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Facility } from '../types';

export function useFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFacilities() {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'facilities'));
        const data: Facility[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Facility[];
        setFacilities(data);
      } catch (e: any) {
        console.error('Error fetching facilities:', e);
        setError(e.message || 'Failed to load facilities.');
      } finally {
        setLoading(false);
      }
    }
    fetchFacilities();
  }, []);

  const clinics    = facilities.filter(f => f.type === 'clinic');
  const hospitals  = facilities.filter(f => f.type === 'hospital');
  const pharmacies = facilities.filter(f => f.type === 'pharmacy');

  return { facilities, clinics, hospitals, pharmacies, loading, error };
}
