import { useState, useEffect } from 'react';
import { facilities as localFacilities } from '../data';
import type { Facility } from '../types';

export function useFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // For now, use local data. Replace with Firestore fetch if needed.
    setFacilities(localFacilities);
    setLoading(false);
  }, []);

  // Helper filters
  const clinics = facilities.filter(f => f.type === 'clinic');
  const hospitals = facilities.filter(f => f.type === 'hospital');
  const pharmacies = facilities.filter(f => f.type === 'pharmacy');

  return { facilities, clinics, hospitals, pharmacies, loading, error };
}
