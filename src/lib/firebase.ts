import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  sendPasswordResetEmail,
  Auth,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Firestore
} from 'firebase/firestore';
import firebaseConfigRaw from '../../firebase-applet-config.json';

// Retrieve environment variables if configured (e.g. on Vercel / Netlify)
const metaEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};
const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || procEnv.VITE_FIREBASE_API_KEY || firebaseConfigRaw.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || metaEnv.FIREBASE_AUTH_DOMAIN || procEnv.VITE_FIREBASE_AUTH_DOMAIN || procEnv.FIREBASE_AUTH_DOMAIN || firebaseConfigRaw.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || procEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfigRaw.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || procEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigRaw.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || procEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigRaw.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || procEnv.VITE_FIREBASE_APP_ID || firebaseConfigRaw.appId
};

// Initialize Firebase App singleton
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth
export const auth: Auth = getAuth(app);

// Initialize Firestore explicitly using firestoreDatabaseId from firebase-applet-config.json
const firestoreDatabaseId = (firebaseConfigRaw as any).firestoreDatabaseId || 'ai-studio-jipas-b61eff80-5f1a-48b5-8f47-9b6fa98b798b';

// Initialize Firestore with auto-detect long polling to avoid timeout in proxy/iframe environments
let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true
  }, firestoreDatabaseId);
} catch (e) {
  // If already initialized, fallback to getFirestore
  dbInstance = getFirestore(app, firestoreDatabaseId);
}

export const db: Firestore = dbInstance;

// Test connection gracefully
async function validateConnection() {
  try {
    await getDocFromServer(doc(db, 'systemSettings', 'config'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Firestore operating in offline/cached mode.');
    }
  }
}
validateConnection();

/**
 * Handle Firestore Error with metadata as required by security guidelines.
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

console.log(`Firestore initialized explicitly with database ID: ${firestoreDatabaseId}`);

export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  sendPasswordResetEmail,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
  orderBy,
  limit
};
export type { FirebaseUser };

