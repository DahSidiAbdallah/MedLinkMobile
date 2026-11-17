import { doc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

/**
 * Cloned-code detection.
 *
 * Serialised packs (EU anti-falsification DataMatrix, and similar schemes) carry a serial
 * number unique to that one box. Counterfeiters copy a genuine code onto many fake boxes, so
 * the same GTIN + serial being scanned by several different people is a strong warning sign.
 *
 * Each scan records an anonymous per-user hash under serialScans/{gtin}_{serial}. Raw user
 * ids are never stored. Requires Firestore rules allowing signed-in users to read/write
 * this collection (see scripts/registry/README.md).
 */

export interface CloneCheckResult {
  /** Distinct people (other than the current user) who scanned this exact box code. */
  otherScanners: number;
  totalScans: number;
  firstSeen?: Date;
}

const MAX_TRACKED_USERS = 50;

// FNV-1a: enough to make the stored value non-reversible-at-a-glance and stable per user.
function anonId(uid: string): string {
  let h = 0x811c9dc5;
  const s = `medlink:${uid}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function docId(gtin: string, serial: string): string {
  return `${gtin}_${serial.replace(/[^A-Za-z0-9-]/g, '_')}`.slice(0, 120);
}

export async function recordAndCheckSerial(gtin: string, serial: string): Promise<CloneCheckResult | null> {
  const uid = auth.currentUser?.uid;
  if (!uid || !gtin || !serial) return null;
  const me = anonId(uid);
  const ref = doc(db, 'serialScans', docId(gtin, serial));
  try {
    return await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      const data = snap.exists() ? snap.data() : undefined;
      const users: string[] = data?.users ?? [];
      const known = users.includes(me);
      const nextUsers = known || users.length >= MAX_TRACKED_USERS ? users : [...users, me];
      const totalScans = (data?.count ?? 0) + 1;
      tx.set(ref, {
        gtin,
        serial,
        users: nextUsers,
        count: totalScans,
        firstSeen: data?.firstSeen ?? serverTimestamp(),
        lastSeen: serverTimestamp(),
      });
      const first = data?.firstSeen instanceof Timestamp ? data.firstSeen.toDate() : undefined;
      return { otherScanners: nextUsers.filter(u => u !== me).length, totalScans, firstSeen: first };
    });
  } catch (e) {
    // Offline or rules not deployed: clone detection is best-effort.
    console.debug('[cloneCheck] unavailable', (e as any)?.message ?? e);
    return null;
  }
}
