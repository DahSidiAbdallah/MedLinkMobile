import { db } from '../lib/firebase.js';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';

export async function initializeFirestore() {
  try {
    // Create profiles collection with a sample document
    await setDoc(doc(db, 'profiles', 'sample-user-id'), {
      name: '',
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
        group_number: '',
        expiry_date: ''
      }
    });

    // Create appointments collection with a sample document
    await addDoc(collection(db, 'appointments'), {
      user_id: '',
      doctor_id: '',
      datetime: '',
      status: '',
      notes: ''
    });

    // Create reminders collection with a sample document
    await addDoc(collection(db, 'reminders'), {
      user_id: '',
      type: '',
      title: '',
      description: '',
      datetime: '',
      frequency: '',
      active: false
    });

    // Create notificationPreferences collection with a sample document
    await setDoc(doc(db, 'notificationPreferences', 'sample-user-id'), {
      emailEnabled: false,
      pushEnabled: false,
      reminderAdvanceMinutes: 0,
      quietHoursStart: '',
      quietHoursEnd: ''
    });

    console.log('Firestore initialized successfully');
  } catch (error) {
    console.error('Error initializing Firestore:', error);
  }
}

initializeFirestore();
