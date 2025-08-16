import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc } from 'firebase/firestore';
import { doctors, pharmacies, medications, reminders, mockUserProfile } from '../data';
import { getDatabase, ref, set } from 'firebase/database';

// Your web app's Firebase configuration
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
const firestore = getFirestore(app);
const database = getDatabase(app);

async function initializeFirestore() {
  try {
    console.log("Starting Firestore initialization...");
    
    // Create doctors collection
    console.log("Creating doctors collection...");
    for (const doctor of doctors) {
      await setDoc(doc(firestore, 'doctors', doctor.id), doctor);
    }
    
    // Create pharmacies collection
    console.log("Creating pharmacies collection...");
    for (const pharmacy of pharmacies) {
      await setDoc(doc(firestore, 'pharmacies', pharmacy.id), pharmacy);
    }
    
    // Create medications collection
    console.log("Creating medications collection...");
    for (const medication of medications) {
      await setDoc(doc(firestore, 'medications', medication.id), medication);
    }
    
    // Create reminders collection
    console.log("Creating reminders collection...");
    for (const reminder of reminders) {
      await setDoc(doc(firestore, 'reminders', reminder.id), reminder);
    }
    
    // Create profiles collection with mock user
    console.log("Creating profiles collection...");
    await setDoc(doc(firestore, 'profiles', mockUserProfile.id), {
      name: mockUserProfile.name,
      email: mockUserProfile.email,
      phone: mockUserProfile.phone,
      date_of_birth: mockUserProfile.dateOfBirth,
      blood_type: mockUserProfile.bloodType,
      allergies: mockUserProfile.allergies,
      medical_conditions: mockUserProfile.conditions,
      medications: mockUserProfile.medications,
      emergency_contacts: mockUserProfile.emergencyContacts,
      insurance_info: mockUserProfile.insuranceInfo
    });
    
    // Create notificationPreferences collection
    console.log("Creating notificationPreferences collection...");
    await setDoc(doc(firestore, 'notificationPreferences', mockUserProfile.id), {
      emailEnabled: true,
      pushEnabled: true,
      reminderAdvanceMinutes: 30,
      quietHoursStart: '22:00',
      quietHoursEnd: '06:00'
    });
    
    // Create appointments collection with a sample appointment
    console.log("Creating appointments collection...");
    await addDoc(collection(firestore, 'appointments'), {
      user_id: mockUserProfile.id,
      doctor_id: doctors[0].id,
      datetime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      status: 'scheduled',
      notes: 'Follow-up appointment',
      type: 'in-person'
    });

    console.log("Firestore initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing Firestore:", error);
  }
}

async function initializeRealtimeDatabase() {
  try {
    console.log("Starting Realtime Database initialization...");
    
    // Create doctors node
    console.log("Creating doctors node...");
    await set(ref(database, 'doctors'), doctors);
    
    // Create pharmacies node
    console.log("Creating pharmacies node...");
    await set(ref(database, 'pharmacies'), pharmacies);
    
    // Create medications node
    console.log("Creating medications node...");
    await set(ref(database, 'medications'), medications);
    
    // Create reminders node
    console.log("Creating reminders node...");
    await set(ref(database, 'reminders'), reminders);
    
    // Create profiles node with mock user
    console.log("Creating profiles node...");
    await set(ref(database, `profiles/${mockUserProfile.id}`), {
      name: mockUserProfile.name,
      email: mockUserProfile.email,
      phone: mockUserProfile.phone,
      date_of_birth: mockUserProfile.dateOfBirth,
      blood_type: mockUserProfile.bloodType,
      allergies: mockUserProfile.allergies,
      medical_conditions: mockUserProfile.conditions,
      medications: mockUserProfile.medications,
      emergency_contacts: mockUserProfile.emergencyContacts,
      insurance_info: mockUserProfile.insuranceInfo
    });
    
    // Create notificationPreferences node
    console.log("Creating notificationPreferences node...");
    await set(ref(database, `notificationPreferences/${mockUserProfile.id}`), {
      emailEnabled: true,
      pushEnabled: true,
      reminderAdvanceMinutes: 30,
      quietHoursStart: '22:00',
      quietHoursEnd: '06:00'
    });
    
    // Create appointments node with a sample appointment
    console.log("Creating appointments node...");
    await set(ref(database, 'appointments/sample-appointment'), {
      user_id: mockUserProfile.id,
      doctor_id: doctors[0].id,
      datetime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      status: 'scheduled',
      notes: 'Follow-up appointment',
      type: 'in-person'
    });

    console.log("Realtime Database initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing Realtime Database:", error);
  }
}

// Choose which database type to initialize (Firestore or Realtime Database)
const useFirestore = true; // Set to false to use Realtime Database instead

async function init() {
  try {
    if (useFirestore) {
      await initializeFirestore();
    } else {
      await initializeRealtimeDatabase();
    }
    console.log("Database initialization completed!");
  } catch (error) {
    console.error("Error during initialization:", error);
  }
}

// Run the initialization
init();
