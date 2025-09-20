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
  try {
    const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
    if (!profileDoc.exists()) return null;
    return profileDoc.data() as Profile;
  } catch (e) {
    // Network/Firestore errors can happen in web dev (offline, DNS issues, blocked network).
    // Instead of letting the exception bubble (which caused unhandled promise rejections),
    // log a friendly message and return null so the UI can render a fallback.
    // eslint-disable-next-line no-console
    console.warn('fetchUserProfile: could not reach Firestore, running offline:', e);
    return null;
  }
}

export async function createOrUpdateUserProfile(profile: Profile): Promise<void> {
  try {
    await setDoc(doc(db, 'profiles', profile.id), profile);
  } catch (e) {
    // Fail gracefully in dev when the backend can't be reached.
    // eslint-disable-next-line no-console
    console.error('createOrUpdateUserProfile failed:', e);
    throw e;
  }
}
