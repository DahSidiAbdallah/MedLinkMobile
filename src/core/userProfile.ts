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
  // First try to get current Firebase user
  let user = auth.currentUser;
  let userId: string | null = null;
  let userEmail: string | null = null;
  let userName: string | null = null;
  
  if (user) {
    userId = user.uid;
    userEmail = user.email;
    userName = user.displayName;
  } else {
    // If no current user, try to get from stored auth
    try {
      const { getStoredAuth } = await import('../lib/authPersistence');
      const storedUser = await getStoredAuth();
      if (storedUser) {
        userId = storedUser.uid;
        userEmail = storedUser.email;
        userName = storedUser.displayName;
        console.log('Using stored user ID for profile fetch:', userId);
      }
    } catch (error) {
      console.warn('Failed to get stored auth for profile fetch:', error);
    }
  }
  
  if (!userId) {
    console.log('No user ID available for profile fetch');
    return null;
  }
  
  try {
    console.log('Fetching profile for user:', userId);
    const profileDoc = await getDoc(doc(db, 'profiles', userId));
    if (profileDoc.exists()) {
      const profileData = profileDoc.data() as Profile;
      console.log('Profile fetched successfully:', profileData.name || 'No name');
      return profileData;
    } else {
      console.log('No profile document found, creating basic profile from auth data');
      // Create a basic profile from auth data
      const basicProfile: Profile = {
        id: userId,
        name: userName || userEmail?.split('@')[0] || 'User',
        email: userEmail || '',
        phone: '',
        date_of_birth: '',
        allergies: [],
        medical_conditions: [],
        medications: [],
        emergency_contacts: [],
      };
      return basicProfile;
    }
  } catch (e) {
    // Network/Firestore errors can happen in web dev (offline, DNS issues, blocked network).
    // Instead of letting the exception bubble (which caused unhandled promise rejections),
    // log a friendly message and return null so the UI can render a fallback.
    console.warn('fetchUserProfile: could not reach Firestore, creating basic profile from auth:', e);
    
    // Return basic profile even if Firestore is offline
    if (userId && (userEmail || userName)) {
      return {
        id: userId,
        name: userName || userEmail?.split('@')[0] || 'User',
        email: userEmail || '',
        phone: '',
        date_of_birth: '',
        allergies: [],
        medical_conditions: [],
        medications: [],
        emergency_contacts: [],
      };
    }
    
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
