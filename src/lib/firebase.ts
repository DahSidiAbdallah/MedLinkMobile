
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Only import these in native environments
let getReactNativePersistence: any = null;
let ReactNativeAsyncStorage: any = null;
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';
if (!isWeb) {
  try {
    getReactNativePersistence = require('firebase/auth/react-native').getReactNativePersistence;
    ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (e) {
    // Module not found: will use getAuth for Expo Go/web environments
  }
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
const auth = (!isWeb && getReactNativePersistence && ReactNativeAsyncStorage)
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    })
  : getAuth(app);
const db = getFirestore(app);

export { app, auth, db };