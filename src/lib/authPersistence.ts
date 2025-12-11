import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, signOut, User } from 'firebase/auth';
import { auth } from './firebase';

const AUTH_TOKEN_KEY = '@auth_token';
const AUTH_USER_KEY = '@auth_user';

export const persistAuth = async (user: User | null) => {
  try {
    if (user) {
      // Store user info and token
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }));
      
      // Get ID token and store it
      const token = await user.getIdToken();
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      // Clear stored auth
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
    }
  } catch (error) {
    console.warn('Failed to persist auth state:', error);
  }
};

export const getStoredAuth = async () => {
  try {
    const userStr = await AsyncStorage.getItem(AUTH_USER_KEY);
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    
    if (userStr && token) {
      return JSON.parse(userStr);
    }
    return null;
  } catch (error) {
    console.warn('Failed to get stored auth:', error);
    return null;
  }
};

export const clearStoredAuth = async () => {
  try {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
  } catch (error) {
    console.warn('Failed to clear stored auth:', error);
  }
};

// Enhanced sign out that also clears storage
export const signOutCompletely = async () => {
  try {
    await signOut(auth);
    await clearStoredAuth();
  } catch (error) {
    console.warn('Failed to sign out:', error);
  }
};
