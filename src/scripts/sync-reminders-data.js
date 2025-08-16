// Script to fix and sync reminders data
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, addDoc, query, where } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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
const db = getFirestore(app);
const auth = getAuth(app);

// Sample reminders data (for reference/backup)
const sampleReminders = [
  {
    id: 'reminder1',
    userId: '1', // Link to a specific user
    type: 'medication',
    title: 'Take Lisinopril',
    description: 'Take with food and a full glass of water',
    datetime: '2025-01-02T08:00:00.000Z',
    frequency: 'daily',
    active: true,
    medication: 'Lisinopril',
    dosage: '10mg',
    instructions: 'Take with food and a full glass of water'
  },
  {
    id: 'reminder2',
    userId: '1', // Link to a specific user
    type: 'checkup',
    title: 'Cardiology Appointment',
    description: 'Regular checkup with Dr. Mohamed',
    datetime: '2025-01-15T10:30:00.000Z',
    frequency: 'once',
    active: true,
    doctorId: '1'
  }
];

/**
 * Fix and sync reminders
 */
async function fixAndSyncReminders() {
  console.log("Starting reminders validation and synchronization...");
  
  try {
    // Get current reminders from Firestore
    const remindersCollection = collection(db, 'reminders');
    const querySnapshot = await getDocs(remindersCollection);
    const firestoreReminders = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    console.log(`Found ${firestoreReminders.length} reminders in Firestore`);
    
    // Check each reminder for missing fields
    for (const reminder of firestoreReminders) {
      console.log(`Checking reminder ${reminder.id}`);
      let needsUpdate = false;
      let updatedReminder = { ...reminder };
      
      // Check for essential fields and fix if missing
      if (!reminder.title) {
        console.log(`- Missing title, fixing...`);
        updatedReminder.title = reminder.medication || 'Untitled Reminder';
        needsUpdate = true;
      }
      
      if (!reminder.type) {
        console.log(`- Missing type, fixing...`);
        updatedReminder.type = 'medication';
        needsUpdate = true;
      }
      
      if (!reminder.datetime) {
        console.log(`- Missing datetime, fixing...`);
        updatedReminder.datetime = new Date().toISOString();
        needsUpdate = true;
      }
      
      if (!reminder.frequency) {
        console.log(`- Missing frequency, fixing...`);
        updatedReminder.frequency = 'once';
        needsUpdate = true;
      }
      
      if (typeof reminder.active !== 'boolean') {
        console.log(`- Missing active state, fixing...`);
        updatedReminder.active = true;
        needsUpdate = true;
      }
      
      if (!reminder.userId) {
        console.log(`- Missing userId, fixing...`);
        updatedReminder.userId = '1'; // Default user ID
        needsUpdate = true;
      }
      
      // Update the reminder if needed
      if (needsUpdate) {
        console.log(`Updating reminder ${reminder.id} with fixes`);
        await setDoc(doc(db, 'reminders', reminder.id), updatedReminder);
      } else {
        console.log(`Reminder ${reminder.id} is properly formatted`);
      }
    }
    
    // Add sample reminders if none exist
    if (firestoreReminders.length === 0) {
      console.log("No reminders found, adding sample reminders...");
      
      for (const reminder of sampleReminders) {
        const { id, ...reminderData } = reminder;
        await setDoc(doc(db, 'reminders', id), reminderData);
        console.log(`Added sample reminder: ${reminder.title}`);
      }
    }
    
    console.log("Reminders validation and synchronization completed successfully!");
  } catch (error) {
    console.error("Error during reminders sync:", error);
  }
}

// Optional: Add function to clean up old or invalid reminders
async function cleanUpReminders() {
  try {
    console.log("\nChecking for old or invalid reminders...");
    
    // Get reminders from Firestore
    const remindersCollection = collection(db, 'reminders');
    const querySnapshot = await getDocs(remindersCollection);
    
    let cleanupCount = 0;
    
    for (const doc of querySnapshot.docs) {
      const reminder = doc.data();
      
      // Example condition: Remove reminders with empty titles and missing required fields
      if ((!reminder.title || reminder.title.trim() === '') && 
          (!reminder.medication || reminder.medication.trim() === '')) {
        console.log(`Removing invalid reminder: ${doc.id}`);
        await deleteDoc(doc.ref);
        cleanupCount++;
      }
      
      // Example condition: Flag old one-time reminders that have already passed
      if (reminder.frequency === 'once' && reminder.datetime) {
        const reminderDate = new Date(reminder.datetime);
        const now = new Date();
        
        if (reminderDate < now && reminder.active) {
          console.log(`Marking past reminder as inactive: ${reminder.title || doc.id}`);
          await setDoc(doc.ref, { ...reminder, active: false }, { merge: true });
          cleanupCount++;
        }
      }
    }
    
    console.log(`Cleanup completed. Processed ${cleanupCount} reminders.`);
    
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}

// Run the fix and sync operation
fixAndSyncReminders()
  .then(() => cleanUpReminders())
  .then(() => {
    console.log("\nAll reminders have been validated and synchronized!");
  })
  .catch(error => {
    console.error("Operation failed:", error);
  });
