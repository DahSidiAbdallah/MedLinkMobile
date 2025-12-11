import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Try to import React Native persistence
let initializeAuth: any = null;
let getReactNativePersistence: any = null;
try {
  // @ts-ignore - Dynamic import for React Native persistence
  const authRN = require('@firebase/auth/react-native');
  initializeAuth = authRN.initializeAuth;
  getReactNativePersistence = authRN.getReactNativePersistence;
} catch (e) {
  // Fallback to web auth
  console.log('React Native auth persistence not available, using web auth:', e);
}

const firebaseConfig = {
  apiKey: "AIzaSyC_WM7fG6nIvv-7PQimBZbNgPgdnIsv_ww",
  authDomain: "medrim-z5rzzt.firebaseapp.com",
  projectId: "medrim-z5rzzt",
  storageBucket: "medrim-z5rzzt.firebasestorage.app",
  messagingSenderId: "760537272144",
  appId: "1:760537272144:web:cd01a3d21e9bdd98156655"
};

const app = initializeApp(firebaseConfig);

// Initialize auth with React Native persistence if available
const auth = (initializeAuth && getReactNativePersistence)
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    })
  : getAuth(app);

const db = getFirestore(app);

// Optional: connect to Firestore emulator when running locally and the flag is set.
// Set environment variable REACT_APP_USE_FIRESTORE_EMULATOR=1 or set
// `window.__USE_FIRESTORE_EMULATOR__ = true` in the browser console.
try {
  const useEmulator = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_USE_FIRESTORE_EMULATOR === '1')
    || (typeof window !== 'undefined' && (window as any).__USE_FIRESTORE_EMULATOR__ === true);
  if (useEmulator) {
    // Import connectFirestoreEmulator dynamically so web builds that don't want it
    // won't be affected.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { connectFirestoreEmulator } = require('firebase/firestore');
    // Default host/port for emulator. Adjust if your emulator uses different settings.
    connectFirestoreEmulator(db, 'localhost', 8080);
    // eslint-disable-next-line no-console
    console.info('Firestore emulator connected: localhost:8080');
  }
} catch (e) {
  // If emulator connection fails, just continue and allow Firestore to operate normally.
  // eslint-disable-next-line no-console
  console.warn('Failed to connect to Firestore emulator (if requested):', e);
}

export { app, auth, db };