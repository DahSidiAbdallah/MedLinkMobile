import { initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyC_WM7fG6nIvv-7PQimBZbNgPgdnIsv_ww",
  authDomain: "medrim-z5rzzt.firebaseapp.com",
  projectId: "medrim-z5rzzt",
  storageBucket: "medrim-z5rzzt.firebasestorage.app",
  messagingSenderId: "760537272144",
  appId: "1:760537272144:web:cd01a3d21e9bdd98156655"
};

const app = initializeApp(firebaseConfig);

// Initialize auth with durable persistence so sessions survive app restarts.
// On web, getAuth defaults to localStorage persistence. On native, the session
// must be explicitly stored in AsyncStorage via getReactNativePersistence —
// otherwise Firebase keeps it in memory only and the user is signed out on close.
let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    // getReactNativePersistence is exposed through the react-native bundle of
    // firebase/auth (resolved by Metro); TS types don't always declare it.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getReactNativePersistence } = require('firebase/auth');
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    console.log('Firebase Auth initialized with AsyncStorage persistence');
  } catch (error: any) {
    console.log('initializeAuth failed, using getAuth:', error?.message);
    auth = getAuth(app);
  }
}

const db = getFirestore(app);

// Optional: connect to Firestore emulator when running locally and the flag is set.
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
    console.log('Connected to Firestore emulator');
  }
} catch (e) {
  console.log('Firestore emulator connection failed or not needed:', e);
}

export { auth, db };