// A script to create a profile for the currently logged in user
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_WM7fG6nIvv-7PQimBZbNgPgdnIsv_ww",
  authDomain: "medrim-z5rzzt.firebaseapp.com",
  projectId: "medrim-z5rzzt",
  storageBucket: "medrim-z5rzzt.firebasestorage.app",
  messagingSenderId: "760537272144",
  appId: "1:760537272144:web:cd01a3d21e9bdd98156655"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize user profile
async function initializeUserProfile() {
  // Check if a user is logged in
  const user = auth.currentUser;
  
  if (!user) {
    console.error("No user is currently logged in");
    return;
  }
  
  console.log("Creating profile for user:", user.uid, user.email);
  
  try {
    // Check if profile already exists
    const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
    
    if (profileDoc.exists()) {
      console.log("Profile already exists for this user");
      return;
    }
    
    // Create a default profile for the user
    const defaultProfile = {
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'New User',
      email: user.email || '',
      phone: '',
      date_of_birth: '',
      blood_type: '',
      allergies: [],
      medical_conditions: [],
      medications: [],
      emergency_contacts: [],
      insurance_info: {
        provider: '',
        policy_number: '',
      },
      created_at: new Date().toISOString()
    };
    
    // Save the default profile to Firestore
    await setDoc(doc(db, 'profiles', user.uid), defaultProfile);
    
    // Create default notification preferences
    await setDoc(doc(db, 'notificationPreferences', user.uid), {
      emailEnabled: true,
      pushEnabled: true,
      reminderAdvanceMinutes: 30,
      quietHoursStart: '22:00',
      quietHoursEnd: '06:00'
    });
    
    console.log("Successfully created profile for user:", user.uid);
  } catch (error) {
    console.error("Error creating user profile:", error);
  }
}

// Listen for auth state changes and create profile when user logs in
auth.onAuthStateChanged((user) => {
  if (user) {
    initializeUserProfile();
  }
});

// Keep the script running to listen for auth changes
console.log("Listening for authentication changes...");
setTimeout(() => {
  console.log("Script execution completed.");
}, 10000);
