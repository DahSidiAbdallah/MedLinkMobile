// Script to update reminders in Firestore: remove 'id' field and add 'userId' if missing
// Usage: node scripts/fixReminders.js

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function fixReminders(userUid) {
  const remindersRef = db.collection('reminders');
  const snapshot = await remindersRef.get();
  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    let needsUpdate = false;
    const updateObj = {};
    // Remove 'id' field if present
    if ('id' in data) {
      updateObj['id'] = admin.firestore.FieldValue.delete();
      needsUpdate = true;
    }
    // Add userId if missing
    if (!data.userId && userUid) {
      updateObj['userId'] = userUid;
      needsUpdate = true;
    }
    if (needsUpdate) {
      await doc.ref.update(updateObj);
      updated++;
    }
  }
  console.log(`Updated ${updated} reminders.`);
}

// Usage: node fixReminders.js <userUid>
const userUid = process.argv[2];
if (!userUid) {
  console.error('Usage: node fixReminders.js <userUid>');
  process.exit(1);
}

fixReminders(userUid).then(() => process.exit(0));
