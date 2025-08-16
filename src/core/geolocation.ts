// Core geolocation logic for cross-platform use
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import type { Doctor, Pharmacy } from '../types.js';

export async function fetchDoctors(): Promise<Doctor[]> {
  const doctorsCollection = collection(db, 'doctors');
  const doctorsSnapshot = await getDocs(doctorsCollection);
  return doctorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Doctor[];
}

export async function fetchPharmacies(): Promise<Pharmacy[]> {
  const pharmaciesCollection = collection(db, 'pharmacies');
  const pharmaciesSnapshot = await getDocs(pharmaciesCollection);
  return pharmaciesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Pharmacy[];
}
