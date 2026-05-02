// Two pluggable readers for GERHR data: live Firestore (firebase-admin) and
// pre-exported JSON files. Same interface so the mapping logic is unchanged.
//
// Live mode: set FIREBASE_SERVICE_ACCOUNT_PATH to a service-account JSON
// downloaded from Firebase Console → Project Settings → Service accounts.
//
// JSON mode: dump each collection as `<dir>/<collection>.json` containing
//   [ { _id: '<firestoreId>', ...fields }, ... ]
// Useful for offline testing without sharing creds.

import fs from 'node:fs';
import path from 'node:path';

export class JsonReader {
  constructor(dir) { this.dir = dir; }
  async read(collection) {
    const file = path.join(this.dir, `${collection}.json`);
    if (!fs.existsSync(file)) return [];
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(raw) ? raw : [];
  }
}

export class FirestoreReader {
  constructor(serviceAccountPath) {
    this._saPath = serviceAccountPath;
    this._initialized = false;
  }

  async _ensureInit() {
    if (this._initialized) return;
    const { initializeApp, cert } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    const sa = JSON.parse(fs.readFileSync(this._saPath, 'utf8'));
    this._app = initializeApp({ credential: cert(sa) }, 'gerhr-migration');
    this._db  = getFirestore(this._app);
    this._initialized = true;
  }

  async read(collection) {
    await this._ensureInit();
    const snap = await this._db.collection(collection).get();
    return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
  }
}

export const buildReader = ({ mode, source }) => {
  if (mode === 'live') return new FirestoreReader(source);
  if (mode === 'json') return new JsonReader(source);
  throw new Error(`Unknown reader mode: ${mode}`);
};
