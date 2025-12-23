import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut, User, onAuthStateChanged, Auth } from 'firebase/auth';
import { auth } from './firebase';

const AUTH_TOKEN_KEY = '@auth_token';
const AUTH_USER_KEY = '@auth_user';
const AUTH_REFRESH_TOKEN_KEY = '@auth_refresh_token';
const SESSION_TIMESTAMP_KEY = '@session_timestamp';

// Session timeout: 30 days
const SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000;

export const persistAuth = async (user: User | null) => {
  try {
    if (user) {
      // Store user info and tokens
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
      };
      
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      
      // Get and store ID token
      const token = await user.getIdToken();
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      
      // Store refresh token if available
      if (user.refreshToken) {
        await AsyncStorage.setItem(AUTH_REFRESH_TOKEN_KEY, user.refreshToken);
      }
      
      // Update session timestamp
      await AsyncStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
      
      console.log('Auth persisted successfully');
    } else {
      // Clear stored auth
      await AsyncStorage.multiRemove([
        AUTH_TOKEN_KEY, 
        AUTH_USER_KEY, 
        AUTH_REFRESH_TOKEN_KEY,
        SESSION_TIMESTAMP_KEY
      ]);
      console.log('Auth cleared from storage');
    }
  } catch (error) {
    console.warn('Failed to persist auth state:', error);
  }
};

export const getStoredAuth = async () => {
  try {
    const userStr = await AsyncStorage.getItem(AUTH_USER_KEY);
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const timestampStr = await AsyncStorage.getItem(SESSION_TIMESTAMP_KEY);
    
    if (userStr && token && timestampStr) {
      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();
      
      // Check if session has expired
      if (now - timestamp > SESSION_TIMEOUT) {
        console.log('Session expired, clearing stored auth');
        await clearStoredAuth();
        return null;
      }
      
      // Update timestamp to extend session
      await AsyncStorage.setItem(SESSION_TIMESTAMP_KEY, now.toString());
      
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
    await AsyncStorage.multiRemove([
      AUTH_TOKEN_KEY, 
      AUTH_USER_KEY, 
      AUTH_REFRESH_TOKEN_KEY,
      SESSION_TIMESTAMP_KEY
    ]);
    console.log('Stored auth cleared');
  } catch (error) {
    console.warn('Failed to clear stored auth:', error);
  }
};

export const refreshAuthToken = async () => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken(true); // Force refresh
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
      return token;
    }
    return null;
  } catch (error) {
    console.warn('Failed to refresh auth token:', error);
    return null;
  }
};

export const isSessionValid = async () => {
  try {
    const timestampStr = await AsyncStorage.getItem(SESSION_TIMESTAMP_KEY);
    if (!timestampStr) return false;
    
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    
    return (now - timestamp) < SESSION_TIMEOUT;
  } catch (error) {
    console.warn('Failed to check session validity:', error);
    return false;
  }
};

// Enhanced sign out that also clears storage
export const signOutCompletely = async () => {
  try {
    console.log('Starting complete sign out...');
    
    // First clear our stored auth
    await clearStoredAuth();
    
    // Then try to sign out from Firebase
    try {
      await signOut(auth);
      console.log('Firebase sign out successful');
    } catch (firebaseError) {
      console.warn('Firebase sign out failed, but continuing:', firebaseError);
    }
    
    console.log('Complete sign out successful');
  } catch (error) {
    console.warn('Failed to sign out:', error);
    throw error;
  }
};

// Initialize auth state restoration
export const initializeAuthPersistence = () => {
  return new Promise<User | null>((resolve) => {
    let resolved = false;
    
    // Set a timeout to prevent infinite waiting
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log('Auth restoration timeout, proceeding without user');
        resolve(null);
      }
    }, 5000); // 5 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (resolved) return;

      try {
        if (user) {
          // User is signed in, persist the auth state
          await persistAuth(user);
          resolved = true;
          clearTimeout(timeout);
          unsubscribe();
          resolve(user);
        } else {
          // User is signed out, check if we have stored auth
          const storedUser = await getStoredAuth();
          if (storedUser && await isSessionValid()) {
            // We have valid stored auth but Firebase auth state is null
            // This can happen on app restart - wait a bit for Firebase to restore
            console.log('Waiting for Firebase to restore session...');
            
            // Set a shorter timeout for session restoration
            setTimeout(async () => {
              if (!resolved) {
                // If still not resolved after waiting, check auth state again
                const currentUser = auth.currentUser;
                if (currentUser) {
                  resolved = true;
                  clearTimeout(timeout);
                  unsubscribe();
                  resolve(currentUser);
                } else {
                  // Firebase didn't restore the session, clear stored auth and proceed
                  console.log('Firebase session restoration failed, clearing stored auth');
                  await clearStoredAuth();
                  resolved = true;
                  clearTimeout(timeout);
                  unsubscribe();
                  resolve(null);
                }
              }
            }, 2000); // Wait 2 seconds for Firebase to restore
          } else {
            // No valid stored auth, user is truly signed out
            await clearStoredAuth();
            resolved = true;
            clearTimeout(timeout);
            unsubscribe();
            resolve(null);
          }
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          unsubscribe();
          resolve(null);
        }
      }
    });
  });
};

// Manual auth restoration from stored data (when Firebase persistence fails)
export const restoreAuthFromStorage = async (): Promise<User | null> => {
  try {
    const storedUser = await getStoredAuth();
    if (storedUser && await isSessionValid()) {
      console.log('Manually restoring auth from storage');
      // Create a minimal user object for the app to use
      // Note: This won't have full Firebase User capabilities, but enough for the app
      return {
        uid: storedUser.uid,
        email: storedUser.email,
        displayName: storedUser.displayName,
        photoURL: storedUser.photoURL,
        emailVerified: storedUser.emailVerified,
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Failed to restore auth from storage:', error);
    return null;
  }
};

// Debug function to check auth state
export const debugAuthState = async () => {
  try {
    const currentUser = auth.currentUser;
    const storedUser = await getStoredAuth();
    const sessionValid = await isSessionValid();
    
    console.log('=== AUTH DEBUG ===');
    console.log('Current Firebase user:', currentUser ? 'exists' : 'null');
    console.log('Stored user:', storedUser ? 'exists' : 'null');
    console.log('Session valid:', sessionValid);
    console.log('================');
    
    return {
      currentUser: !!currentUser,
      storedUser: !!storedUser,
      sessionValid,
    };
  } catch (error) {
    console.error('Debug auth state error:', error);
    return null;
  }
};

// Simpler auth initialization that doesn't wait for Firebase restoration
export const initializeAuthQuick = async (): Promise<User | null> => {
  try {
    // First, check if we have a current user immediately
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('Found current Firebase user immediately');
      await persistAuth(currentUser);
      return currentUser;
    }

    // Check stored auth
    const storedUser = await getStoredAuth();
    if (storedUser && await isSessionValid()) {
      console.log('Found valid stored auth, attempting to restore user');
      
      // Try to restore the user without waiting for Firebase
      // Return the stored user data as a mock User object
      const mockUser = {
        uid: storedUser.uid,
        email: storedUser.email,
        displayName: storedUser.displayName,
        photoURL: storedUser.photoURL,
        emailVerified: storedUser.emailVerified,
        phoneNumber: null,
        providerId: 'firebase',
        // Add minimal required User properties
        isAnonymous: false,
        metadata: {
          creationTime: undefined,
          lastSignInTime: undefined,
        },
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => await AsyncStorage.getItem(AUTH_TOKEN_KEY) || '',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({}),
      } as unknown as User;
      
      console.log('Restored user from stored auth');
      return mockUser;
    }

    // No stored auth, proceed to login
    console.log('No stored auth found, proceeding to login');
    return null;
  } catch (error) {
    console.error('Error in quick auth initialization:', error);
    return null;
  }
};