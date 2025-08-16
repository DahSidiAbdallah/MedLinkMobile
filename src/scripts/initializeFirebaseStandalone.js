// initializeFirebase.js - Complete standalone version
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc } from 'firebase/firestore';
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

// Sample data that doesn't require importing from data.ts
const doctors = [
  {
    id: '1',
    name: 'Dr. Sarah Chen',
    specialty: 'Cardiologist',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300',
    rating: 4.8,
    location: 'Downtown Medical Center',
    availableSlots: ['9:00', '10:30', '14:30', '16:00'],
    experience: 15,
    languages: ['English', 'Mandarin'],
    acceptedInsurance: ['Blue Cross', 'Aetna', 'UnitedHealth'],
    education: ['Stanford Medical School', 'Johns Hopkins Residency'],
    coordinates: {
      lat: 37.7749,
      lng: -122.4194
    }
  },
  {
    id: '2',
    name: 'Dr. Ahmed Mohamed',
    specialty: 'Pediatrician',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300',
    rating: 4.9,
    location: 'Children\'s Wellness Center',
    availableSlots: ['8:30', '11:00', '13:30', '15:00'],
    experience: 12,
    languages: ['English', 'Arabic'],
    acceptedInsurance: ['CNAM', 'CNSS'],
    education: ['UCLA Medical School', 'UCSF Residency'],
    coordinates: {
      lat: 37.7739,
      lng: -122.4312
    }
  }
];

const pharmacies = [
  {
    id: '1',
    name: 'City Care Pharmacy',
    address: '123 Market Street, San Francisco',
    hours: '8:00 AM - 10:00 PM',
    image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=300&h=300',
    distance: '0.3 miles',
    coordinates: {
      lat: 37.7749,
      lng: -122.4194
    },
    hasDelivery: true,
    isOpen: true,
    phoneNumber: '(415) 555-0123',
    services: ['Prescription Filling', 'Vaccinations', 'Health Screenings']
  }
];

const medications = [
  {
    id: '1',
    name: 'Lisinopril',
    generic_name: 'Lisinopril',
    description: 'Used to treat high blood pressure and heart failure',
    side_effects: ['Dizziness', 'Headache', 'Dry cough', 'Fatigue', 'Nausea']
  }
];

const reminders = [
  {
    id: '1',
    medication: 'Vitamin D',
    time: '8:00',
    frequency: 'Daily',
    active: true,
    dosage: '1000 IU',
    instructions: 'Take with food'
  }
];

const mockUserProfile = {
  id: '1',
  name: 'John Smith',
  email: 'john.smith@example.com',
  phone: '(415) 555-0123',
  dateOfBirth: '1985-06-15',
  bloodType: 'O+',
  allergies: ['Penicillin', 'Dust'],
  medications: ['Vitamin D', 'Lisinopril'],
  conditions: ['Hypertension'],
  emergencyContacts: [
    {
      id: '1',
      name: 'Jane Smith',
      relationship: 'Spouse',
      phone: '(415) 555-0124',
      isICE: true
    }
  ],
  insuranceInfo: {
    provider: 'Blue Cross',
    policyNumber: 'BC123456789',
    groupNumber: 'G987654321',
    expiryDate: '2024-12-31'
  }
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
