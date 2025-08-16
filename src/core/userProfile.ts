// Core user profile logic for cross-platform use
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  blood_type?: string;
  allergies: string[];
  medical_conditions: string[];
  medications: string[];
  emergency_contacts?: any[];
  insurance_info?: any;
}

export async function fetchUserProfile(): Promise<Profile | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
  if (!profileDoc.exists()) return null;
  return profileDoc.data() as Profile;
}

export async function createOrUpdateUserProfile(profile: Profile): Promise<void> {
  await setDoc(doc(db, 'profiles', profile.id), profile);
}
