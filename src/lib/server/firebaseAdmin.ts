
import * as admin from 'firebase-admin';
import 'server-only';

let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;
let initializationError: Error | null = null;

export function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    // If already initialized, capture the objects.
    if (!db) db = admin.firestore();
    if (!auth) auth = admin.auth();
    return;
  }

  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. The application cannot start.');
    }

    const serviceAccount = JSON.parse(serviceAccountKey);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');
    db = admin.firestore();
    auth = admin.auth();
  } catch (error: any) {
    console.error('CRITICAL: Firebase Admin SDK initialization failed.');
    if (error instanceof SyntaxError) {
      console.error("JSON Parsing Error for FIREBASE_SERVICE_ACCOUNT_KEY. Please ensure it is a valid JSON string.");
    } else {
      console.error(error);
    }
    initializationError = error;
    // Do not re-throw here, as it can crash the server process on startup.
    // Instead, allow getDb/getAuth to handle the uninitialized state.
  }
}

// Initialize on module load.
initializeFirebaseAdmin();


export const getDb = (): admin.firestore.Firestore => {
  if (!db) {
    // This will be true if initialization failed.
    throw new Error('Firestore is not initialized. Check server startup logs for Firebase Admin SDK errors.');
  }
  return db;
};

export const getAuth = (): admin.auth.Auth => {
  if (!auth) {
    // This will be true if initialization failed.
    throw new Error('Firebase Auth is not initialized. Check server startup logs for Firebase Admin SDK errors.');
  }
  return auth;
};

export const getFirebaseInitializationError = (): Error | null => {
  return initializationError;
}
