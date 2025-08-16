import { useState, useEffect } from 'react';
import { fetchDoctors, fetchPharmacies } from '../core/geolocation';
import type { Doctor, Pharmacy } from '../types';

export function useDoctorsAndPharmacies() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const doctorsData = await fetchDoctors();
        const pharmaciesData = await fetchPharmacies();
        setDoctors(doctorsData);
        setPharmacies(pharmaciesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { doctors, pharmacies, loading, error };
}
