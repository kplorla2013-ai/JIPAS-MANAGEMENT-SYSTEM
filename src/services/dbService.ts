import { 
  db, 
  auth, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc,
  writeBatch, 
  onSnapshot,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  FirebaseUser,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import firebaseConfigRaw from '../../firebase-applet-config.json';

// Initialize Firestore explicitly using firestoreDatabaseId from firebase-applet-config.json
export const firestoreDatabaseId = (firebaseConfigRaw as any).firestoreDatabaseId || 'ai-studio-jipas-b61eff80-5f1a-48b5-8f47-9b6fa98b798b';
export { db };

/**
 * Forced synchronization: Manually fetches critical collections from Firestore to ensure 
 * local storage and UI are perfectly in sync with the remote database.
 * This is used as a safety check when the app initializes but has no local data.
 */
export async function forceSyncCollections() {
  console.log('[dbService] Starting forced synchronization...');
  try {
    const collectionsToSync = [
      { name: 'students', save: saveStoredStudents },
      { name: 'teachers', save: saveStoredTeachers },
      { name: 'academicYears', save: saveStoredAcademicYears },
      { name: 'terms', save: saveStoredTerms },
      { name: 'departments', save: saveStoredDepartments },
      { name: 'classes', save: saveStoredClasses },
      { name: 'houses', save: saveStoredHouses },
      { name: 'subjects', save: saveStoredSubjects },
      { name: 'reports', save: saveStoredReports },
      { name: 'bills', save: saveStoredBills },
      { name: 'transactions', save: saveStoredPayments },
      { name: 'events', save: saveStoredCalendarEvents },
      { name: 'notifications', save: saveStoredNotifications },
      { name: 'users', save: saveStoredUsers },
      { name: 'classFeeTariffs', save: saveStoredClassFeeTariffs },
      { name: 'classReportBroadcasts', save: saveStoredClassBroadcasts }
    ];

    for (const col of collectionsToSync) {
      try {
        const snap = await getDocs(collection(db, col.name));
        if (!snap.empty) {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          col.save(data as any);
          console.log(`[dbService] Synced collection: ${col.name} (${data.length} items)`);
        } else {
          console.log(`[dbService] Collection ${col.name} is empty in Firestore.`);
        }
      } catch (colErr) {
        console.warn(`[dbService] Failed to sync individual collection ${col.name}:`, colErr);
        // We don't throw here to allow other collections to try and sync
      }
    }
    return true;
  } catch (err) {
    console.error('[dbService] Force sync failed:', err);
    return false;
  }
}

/**
 * Recursively sanitizes objects before saving to Firestore.
 * Firestore setDoc/updateDoc/addDoc calls throw exceptions if an object or nested array
 * contains any `undefined` values.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) {
    return null as any;
  }
  if (typeof data !== 'object') {
    return data;
  }
  if (data instanceof Date) {
    return data.toISOString() as any;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as any;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, val] of Object.entries(data as Record<string, any>)) {
    if (val !== undefined) {
      cleanObj[key] = sanitizeForFirestore(val);
    }
  }
  return cleanObj as T;
}

// Initialize IndexedDB offline persistence is now handled by initializeFirestore in lib/firebase.ts
import { 
  Student, 
  Teacher, 
  TermReport, 
  PaymentRecord, 
  StudentBill, 
  CalendarEvent, 
  NotificationItem, 
  User,
  AcademicYear,
  Term,
  Department,
  SchoolClass,
  House,
  Subject,
  AcademicYearItem,
  TermItem,
  DepartmentItem,
  ClassItem,
  HouseItem,
  SubjectItem,
  UserAccountItem,
  ClassFeeTariffItem,
  PaymentSettingsConfig,
  FeeSubmissionItem,
  ClassReportBroadcast,
  ThemePaletteConfig,
  CourseItem
} from '../types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_TEACHERS, 
  INITIAL_TERM_REPORTS, 
  INITIAL_PAYMENTS, 
  INITIAL_BILLS, 
  INITIAL_CALENDAR_EVENTS, 
  INITIAL_NOTIFICATIONS 
} from '../data/mockData';
import { 
  INITIAL_ACADEMIC_YEARS, 
  INITIAL_TERMS, 
  INITIAL_DEPARTMENTS, 
  INITIAL_CLASSES, 
  INITIAL_HOUSES, 
  INITIAL_SUBJECTS,
  INITIAL_SHS_COURSES
} from '../data/setupData';
import {
  getStoredStudents,
  saveStoredStudents,
  getStoredTeachers,
  saveStoredTeachers,
  getStoredUsers,
  saveStoredUsers,
  INITIAL_SYSTEM_USERS,
  getStoredAcademicYears,
  saveStoredAcademicYears,
  getStoredTerms,
  saveStoredTerms,
  getStoredDepartments,
  saveStoredDepartments,
  getStoredCourses,
  saveStoredCourses,
  getStoredClasses,
  saveStoredClasses,
  getStoredHouses,
  saveStoredHouses,
  getStoredSubjects,
  saveStoredSubjects,
  getStoredBills,
  saveStoredBills,
  getStoredPayments,
  saveStoredPayments,
  getStoredReports,
  saveStoredReports,
  getStoredCalendarEvents,
  saveStoredCalendarEvents,
  getStoredNotifications,
  saveStoredNotifications,
  getStoredStaffSecretCode,
  saveStoredStaffSecretCode,
  getStoredStaffSecretCodes,
  saveStoredStaffSecretCodes,
  StaffSecretCodeRecord,
  DEFAULT_STAFF_SECRET_CODE,
  isDemoDataCleared,
  setDemoDataCleared,
  getStoredPaymentSettings,
  saveStoredPaymentSettings,
  getStoredFeeSubmissions,
  saveStoredFeeSubmissions,
  getStoredClassFeeTariffs,
  saveStoredClassFeeTariffs,
  INITIAL_CLASS_FEE_TARIFFS,
  getStoredClassBroadcasts,
  saveStoredClassBroadcasts,
  INITIAL_CLASS_BROADCASTS,
  DEFAULT_THEME_PALETTES,
  DEFAULT_THEME_PALETTE,
  getStoredThemePalette,
  saveStoredThemePalette,
  applyThemePaletteToDom
} from './storageService';

export { 
  getStoredClassFeeTariffs, 
  saveStoredClassFeeTariffs, 
  INITIAL_CLASS_FEE_TARIFFS,
  getStoredClassBroadcasts,
  saveStoredClassBroadcasts,
  INITIAL_CLASS_BROADCASTS,
  DEFAULT_THEME_PALETTES,
  DEFAULT_THEME_PALETTE,
  getStoredThemePalette,
  saveStoredThemePalette,
  applyThemePaletteToDom,
  getStoredCourses,
  saveStoredCourses
};
export type { ThemePaletteConfig };

export { DEFAULT_STAFF_SECRET_CODE, getStoredStaffSecretCodes, saveStoredStaffSecretCodes };
export type { StaffSecretCodeRecord };

export function generateNewStaffSecretCode(adminName: string = 'System Admin'): StaffSecretCodeRecord {
  const codes = getStoredStaffSecretCodes();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const generatedCode = `JIPAS-STAFF-${randomSuffix}`;
  const newRecord: StaffSecretCodeRecord = {
    id: `ssc-${Date.now()}`,
    code: generatedCode,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days validity
    used: false,
    createdBy: adminName
  };
  const updated = [newRecord, ...codes];
  saveStoredStaffSecretCodes(updated);
  saveStoredStaffSecretCode(generatedCode);
  
  // Persist to Firestore across multiple anchors so all remote devices (Device B, C...) immediately sync
  (async () => {
    try {
      await setDoc(doc(db, 'staffSecretCodes', newRecord.id), sanitizeForFirestore(newRecord));
      await setDoc(doc(db, 'systemSettings', 'staffSecretCodes'), sanitizeForFirestore({
        activeCode: generatedCode,
        codes: updated,
        updatedAt: Date.now()
      }), { merge: true });
      await setDoc(doc(db, 'settings', 'general'), { staffSecretCode: generatedCode }, { merge: true });
      console.log('[dbService] Generated staff secret code synced to Firestore for all devices:', generatedCode);
    } catch (err) {
      console.warn('[dbService] Firestore staff secret code sync error:', err);
    }
  })();

  return newRecord;
}

/**
 * Validates and consumes a staff secret code across devices (Device A, B, C...).
 * Queries Firestore directly so changes made on Device A are validated in real time on any device.
 */
export async function validateAndConsumeStaffSecretCode(
  codeStr: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  if (!codeStr || !codeStr.trim()) {
    return { success: false, error: 'Please enter the Staff Authorization Secret Code.' };
  }
  const cleanCode = codeStr.trim().toUpperCase();

  // 1. Allow default fallback code
  if (cleanCode === DEFAULT_STAFF_SECRET_CODE.toUpperCase()) {
    return { success: true };
  }

  // 2. Query Firestore settings/general directly to check active global code on cloud
  try {
    const genDoc = await getDoc(doc(db, 'settings', 'general'));
    if (genDoc.exists()) {
      const genData = genDoc.data() as SchoolSettings;
      if (genData.staffSecretCode) {
        saveStoredStaffSecretCode(genData.staffSecretCode);
        if (cleanCode === genData.staffSecretCode.trim().toUpperCase()) {
          return { success: true };
        }
      }
    }
  } catch (err) {
    console.warn('[dbService] Firestore settings/general read warning:', err);
  }

  // 3. Query Firestore systemSettings/staffSecretCodes
  try {
    const sysDoc = await getDoc(doc(db, 'systemSettings', 'staffSecretCodes'));
    if (sysDoc.exists()) {
      const sysData = sysDoc.data() as { activeCode?: string; codes?: StaffSecretCodeRecord[] };
      if (sysData.activeCode) {
        saveStoredStaffSecretCode(sysData.activeCode);
        if (cleanCode === sysData.activeCode.trim().toUpperCase()) {
          return { success: true };
        }
      }
      if (sysData.codes && Array.isArray(sysData.codes)) {
        saveStoredStaffSecretCodes(sysData.codes);
        const match = sysData.codes.find(c => c.code.trim().toUpperCase() === cleanCode);
        if (match) {
          if (match.used) {
            return { success: false, error: `This secret code has already been used by ${match.usedBy || 'another user'}. Each individual code is single-use.` };
          }
          if (match.expiresAt && Date.now() > match.expiresAt) {
            return { success: false, error: 'This secret code has expired. Please request a fresh code from your Administrator.' };
          }
          // Mark single-use code as used in Firestore and local storage
          const updated = sysData.codes.map(c => c.id === match.id ? { ...c, used: true, usedBy: userEmail, usedAt: Date.now() } : c);
          saveStoredStaffSecretCodes(updated);
          await setDoc(doc(db, 'systemSettings', 'staffSecretCodes'), { codes: updated }, { merge: true });
          return { success: true };
        }
      }
    }
  } catch (err) {
    console.warn('[dbService] Firestore systemSettings/staffSecretCodes read warning:', err);
  }

  // 4. Query staffSecretCodes collection in Firestore
  try {
    const colSnap = await getDocs(collection(db, 'staffSecretCodes'));
    for (const d of colSnap.docs) {
      const rec = d.data() as StaffSecretCodeRecord;
      if (rec.code && rec.code.trim().toUpperCase() === cleanCode) {
        if (rec.used) {
          return { success: false, error: `This secret code has already been used by ${rec.usedBy || 'another user'}. Each individual code is single-use.` };
        }
        if (rec.expiresAt && Date.now() > rec.expiresAt) {
          return { success: false, error: 'This secret code has expired. Please request a fresh code from your Administrator.' };
        }
        // Mark as used in Firestore
        await setDoc(doc(db, 'staffSecretCodes', d.id), {
          used: true,
          usedBy: userEmail,
          usedAt: Date.now()
        }, { merge: true });
        return { success: true };
      }
    }
  } catch (err) {
    console.warn('[dbService] staffSecretCodes collection read warning:', err);
  }

  // 5. Check local cache fallback
  const activeStaffCode = (getStoredStaffSecretCode() || '').trim().toUpperCase();
  if (activeStaffCode && cleanCode === activeStaffCode) {
    return { success: true };
  }

  const codes = getStoredStaffSecretCodes();
  const found = codes.find(c => c.code.trim().toUpperCase() === cleanCode);

  if (!found) {
    return { success: false, error: 'Invalid Staff Secret Code. Please check with your School Administrator or use the active code from System Settings.' };
  }

  if (found.used) {
    return { success: false, error: `This secret code has already been used by ${found.usedBy || 'another user'}. Each individual code is single-use.` };
  }

  const now = Date.now();
  if (found.expiresAt && now > found.expiresAt) {
    return { success: false, error: 'This secret code has expired. Please request a fresh code from your Administrator.' };
  }

  // Mark single-use code as used
  const updated = codes.map(c => c.id === found.id ? { ...c, used: true, usedBy: userEmail } : c);
  saveStoredStaffSecretCodes(updated);

  return { success: true };
}

/**
 * Real-time listener for Staff Authorization Secret Code updates across all devices
 */
export function subscribeStaffSecretCodes(
  callback: (activeCode: string, codes: StaffSecretCodeRecord[]) => void
) {
  try {
    return onSnapshot(doc(db, 'systemSettings', 'staffSecretCodes'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as { activeCode?: string; codes?: StaffSecretCodeRecord[] };
        if (data.activeCode) saveStoredStaffSecretCode(data.activeCode);
        if (data.codes && Array.isArray(data.codes)) saveStoredStaffSecretCodes(data.codes);
        callback(data.activeCode || getStoredStaffSecretCode(), data.codes || getStoredStaffSecretCodes());
      } else {
        callback(getStoredStaffSecretCode(), getStoredStaffSecretCodes());
      }
    }, (err) => {
      console.warn('subscribeStaffSecretCodes listener error:', err);
      callback(getStoredStaffSecretCode(), getStoredStaffSecretCodes());
    });
  } catch (e) {
    callback(getStoredStaffSecretCode(), getStoredStaffSecretCodes());
    return () => {};
  }
}

export interface SchoolSettings {
  schoolName: string;
  schoolMotto: string;
  schoolLogo: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  activeAcademicYear: string;
  activeTerm: string;
  staffSecretCode?: string;
  enableIncompleteReminders?: boolean;
  reminderFrequency?: 'Daily' | 'Weekly' | 'Bi-weekly';
  notifyParentsForMissingGrades?: boolean;
  missingGradeThreshold?: number;
}

export const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: 'JIPAS',
  schoolMotto: 'Education is Wealth • Founded 1990',
  schoolLogo: '',
  phone: '0249755593',
  email: 'info@jipas.com',
  address: 'Accra, Ghana',
  website: 'www.jipas.edu.gh',
  activeAcademicYear: '2025-2026',
  activeTerm: 'Third Term',
  staffSecretCode: DEFAULT_STAFF_SECRET_CODE,
  enableIncompleteReminders: true,
  reminderFrequency: 'Weekly',
  notifyParentsForMissingGrades: true,
  missingGradeThreshold: 1
};

const DEFAULT_ACADEMIC_YEARS: AcademicYear[] = [
  { id: 'ay-1', name: '2025-2026', startDate: '2025-09-01', endDate: '2026-07-24', isCurrent: true, status: 'Active' },
  { id: 'ay-2', name: '2026-2027', startDate: '2026-09-01', endDate: '2027-07-23', isCurrent: false, status: 'Upcoming' },
  { id: 'ay-3', name: '2024-2025', startDate: '2024-09-02', endDate: '2025-07-25', isCurrent: false, status: 'Archived' }
];

const DEFAULT_TERMS: Term[] = [
  { id: 'tm-1', name: 'Third Term', termNumber: 3, academicYear: '2025-2026', startDate: '2026-05-04', endDate: '2026-07-24', isCurrent: true, daysOpen: 70, resumptionDate: '2026-09-08' },
  { id: 'tm-2', name: 'Second Term', termNumber: 2, academicYear: '2025-2026', startDate: '2026-01-06', endDate: '2026-04-10', isCurrent: false, daysOpen: 68, resumptionDate: '2026-05-04' },
  { id: 'tm-3', name: 'First Term', termNumber: 1, academicYear: '2025-2026', startDate: '2025-09-08', endDate: '2025-12-18', isCurrent: false, daysOpen: 72, resumptionDate: '2026-01-06' }
];

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Primary School', code: 'PRIM', hod: 'Ebenezer Frimpong', description: 'Basic 1 to Basic 6 classes and foundational curricula.' },
  { id: 'dept-2', name: 'Junior High School', code: 'JHS', hod: 'Mr. Kwame Elolo', description: 'JHS 1 to JHS 3 preparatory and BECE courses.' },
  { id: 'dept-3', name: 'Pre School', code: 'PRE', hod: 'Mad. Aseye Ama', description: 'Creche, Nursery, and KG foundational development.' }
];

const DEFAULT_CLASSES: SchoolClass[] = [
  { id: 'cls-1', name: 'Basic 1', department: 'Primary School', stream: 'A', roomNo: 'Block A-01', classTeacher: 'Ebenezer Frimpong', capacity: 35 },
  { id: 'cls-2', name: 'Basic 2', department: 'Primary School', stream: 'A', roomNo: 'Block A-02', classTeacher: 'Mr. Agbenyo Kwame', capacity: 35 },
  { id: 'cls-3', name: 'JHS 1A', department: 'Junior High School', stream: 'A', roomNo: 'Block B-01', classTeacher: 'Mr. Kwame Elolo', capacity: 40 },
  { id: 'cls-4', name: 'Creche', department: 'Pre School', stream: 'A', roomNo: 'Pre-01', classTeacher: 'Mad. Aseye Ama', capacity: 25 }
];

const DEFAULT_HOUSES: House[] = [
  { id: 'h-1', name: 'Nkrumah House', color: 'Green', houseMaster: 'Ebenezer Frimpong', motto: 'Forward Ever' },
  { id: 'h-2', name: 'Aggrey House', color: 'Blue', houseMaster: 'Mr. Kwame Elolo', motto: 'Only the Best is Good Enough' },
  { id: 'h-3', name: 'Gbewaa House', color: 'Yellow', houseMaster: 'Denis Mawutor', motto: 'Unity & Strength' },
  { id: 'h-4', name: 'Yaa Asantewaa House', color: 'Red', houseMaster: 'Mad. Aseye Ama', motto: 'Courage and Honour' }
];

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sb-1', name: 'English Language', code: 'ENG', department: 'Primary School', isCore: true },
  { id: 'sb-2', name: 'Mathematics', code: 'MATH', department: 'Primary School', isCore: true },
  { id: 'sb-3', name: 'Science', code: 'SCI', department: 'Primary School', isCore: true },
  { id: 'sb-4', name: 'Creative Arts', code: 'CA', department: 'Primary School', isCore: false },
  { id: 'sb-5', name: 'Computing', code: 'COMP', department: 'Primary School', isCore: false },
  { id: 'sb-6', name: 'Religious & Moral Edu.', code: 'RME', department: 'Primary School', isCore: false },
  { id: 'sb-7', name: 'History', code: 'HIST', department: 'Primary School', isCore: false },
  { id: 'sb-8', name: 'Ghanaian Language', code: 'GHA', department: 'Primary School', isCore: false },
  { id: 'sb-9', name: 'French Language', code: 'FRE', department: 'Primary School', isCore: false },
  { id: 'sb-10', name: 'OWOP', code: 'OWOP', department: 'Primary School', isCore: false }
];

// Seed Firestore initial data if database collections are empty
export async function seedInitialDatabase() {
  if (isDemoDataCleared()) {
    console.log('[dbService] Demo data previously cleared by user, skipping auto-seed.');
    return;
  }
  try {
    const demoStatusSnap = await getDoc(doc(db, 'systemSettings', 'demoStatus'));
    if (demoStatusSnap.exists() && demoStatusSnap.data().demoDataCleared) {
      setDemoDataCleared(true);
      console.log('[dbService] Demo data previously cleared on remote database, skipping auto-seed.');
      return;
    }
  } catch {}
  try {
    const studentsSnap = await getDocs(collection(db, 'students'));
    if (studentsSnap.empty) {
      console.log('Seeding initial students to Firestore...');
      const stored = getStoredStudents();
      const list = stored && stored.length > 0 ? stored : INITIAL_STUDENTS;
      for (const st of list) {
        await setDoc(doc(db, 'students', st.id), sanitizeForFirestore(st));
      }
    }

    const teachersSnap = await getDocs(collection(db, 'teachers'));
    if (teachersSnap.empty) {
      console.log('Seeding initial teachers to Firestore...');
      const stored = getStoredTeachers();
      const list = stored && stored.length > 0 ? stored : INITIAL_TEACHERS;
      for (const t of list) {
        await setDoc(doc(db, 'teachers', t.id), sanitizeForFirestore(t));
      }
    }

    const reportsSnap = await getDocs(collection(db, 'reports'));
    if (reportsSnap.empty) {
      console.log('Seeding initial reports to Firestore...');
      const stored = getStoredReports();
      const list = stored && stored.length > 0 ? stored : INITIAL_TERM_REPORTS;
      for (const r of list) {
        await setDoc(doc(db, 'reports', r.id), sanitizeForFirestore(r));
      }
    }

    const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
    if (!settingsDoc.exists()) {
      await setDoc(doc(db, 'settings', 'general'), sanitizeForFirestore(DEFAULT_SETTINGS));
    }

    const aySnap = await getDocs(collection(db, 'academicYears'));
    if (aySnap.empty) {
      const stored = getStoredAcademicYears();
      const list = stored && stored.length > 0 ? stored : INITIAL_ACADEMIC_YEARS;
      for (const ay of list) {
        await setDoc(doc(db, 'academicYears', ay.id), sanitizeForFirestore(ay));
      }
    }

    const termsSnap = await getDocs(collection(db, 'terms'));
    if (termsSnap.empty) {
      const stored = getStoredTerms();
      const list = stored && stored.length > 0 ? stored : INITIAL_TERMS;
      for (const tm of list) {
        await setDoc(doc(db, 'terms', tm.id), sanitizeForFirestore(tm));
      }
    }

    const deptsSnap = await getDocs(collection(db, 'departments'));
    if (deptsSnap.empty) {
      const stored = getStoredDepartments();
      const list = stored && stored.length > 0 ? stored : INITIAL_DEPARTMENTS;
      for (const d of list) {
        await setDoc(doc(db, 'departments', d.id), sanitizeForFirestore(d));
      }
    }

    const classesSnap = await getDocs(collection(db, 'classes'));
    if (classesSnap.empty) {
      const stored = getStoredClasses();
      const list = stored && stored.length > 0 ? stored : INITIAL_CLASSES;
      for (const c of list) {
        await setDoc(doc(db, 'classes', c.id), sanitizeForFirestore(c));
      }
    }

    const housesSnap = await getDocs(collection(db, 'houses'));
    if (housesSnap.empty) {
      const stored = getStoredHouses();
      const list = stored && stored.length > 0 ? stored : INITIAL_HOUSES;
      for (const h of list) {
        await setDoc(doc(db, 'houses', h.id), sanitizeForFirestore(h));
      }
    }

    const subjectsSnap = await getDocs(collection(db, 'subjects'));
    if (subjectsSnap.empty) {
      const stored = getStoredSubjects();
      const list = stored && stored.length > 0 ? stored : INITIAL_SUBJECTS;
      for (const s of list) {
        await setDoc(doc(db, 'subjects', s.id), sanitizeForFirestore(s));
      }
    }

    const paymentsSnap = await getDocs(collection(db, 'transactions'));
    if (paymentsSnap.empty) {
      const stored = getStoredPayments();
      const list = stored && stored.length > 0 ? stored : INITIAL_PAYMENTS;
      for (const p of list) {
        await setDoc(doc(db, 'transactions', p.id), sanitizeForFirestore(p));
      }
    }

    const billsSnap = await getDocs(collection(db, 'bills'));
    if (billsSnap.empty) {
      const stored = getStoredBills();
      const list = stored && stored.length > 0 ? stored : INITIAL_BILLS;
      for (const b of list) {
        await setDoc(doc(db, 'bills', b.id), sanitizeForFirestore(b));
      }
    }

    const eventsSnap = await getDocs(collection(db, 'events'));
    if (eventsSnap.empty) {
      const stored = getStoredCalendarEvents();
      const list = stored && stored.length > 0 ? stored : INITIAL_CALENDAR_EVENTS;
      for (const ev of list) {
        await setDoc(doc(db, 'events', ev.id), sanitizeForFirestore(ev));
      }
    }

    const notifsSnap = await getDocs(collection(db, 'notifications'));
    if (notifsSnap.empty) {
      const stored = getStoredNotifications();
      const list = stored && stored.length > 0 ? stored : INITIAL_NOTIFICATIONS;
      for (const n of list) {
        await setDoc(doc(db, 'notifications', n.id), sanitizeForFirestore(n));
      }
    }

    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty) {
      const stored = getStoredUsers();
      const list = stored && stored.length > 0 ? stored : INITIAL_SYSTEM_USERS;
      for (const u of list) {
        await setDoc(doc(db, 'users', u.id), sanitizeForFirestore(u));
      }
    }

    const broadcastsSnap = await getDocs(collection(db, 'classReportBroadcasts'));
    if (broadcastsSnap.empty) {
      const stored = getStoredClassBroadcasts();
      const list = stored && stored.length > 0 ? stored : INITIAL_CLASS_BROADCASTS;
      for (const b of list) {
        await setDoc(doc(db, 'classReportBroadcasts', b.id), sanitizeForFirestore(b));
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'multiple');
    }
    console.warn('Database auto-seed notice (permissions/offline fallback):', err);
  }
}

// -------------------------------------------------------------
// Live Real-Time Subscriptions
// -------------------------------------------------------------
export function subscribeUsers(callback: (users: UserAccountItem[]) => void) {
  return onSnapshot(collection(db, 'users'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserAccountItem));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredUsers(items);
      callback(items);
    } else {
      callback(getStoredUsers());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'users');
    }
    console.warn('Firestore users subscription fallback:', err);
    callback(getStoredUsers());
  });
}

export function subscribeStudents(callback: (students: Student[]) => void) {
  return onSnapshot(collection(db, 'students'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredStudents(items);
      callback(items);
    } else {
      callback(getStoredStudents());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'students');
    }
    console.warn('Firestore students subscription fallback:', err);
    callback(getStoredStudents());
  });
}

export function subscribeTeachers(callback: (teachers: Teacher[]) => void) {
  return onSnapshot(collection(db, 'teachers'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Teacher));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredTeachers(items);
      callback(items);
    } else {
      callback(getStoredTeachers());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'teachers');
    }
    console.warn('Firestore teachers subscription fallback:', err);
    callback(getStoredTeachers());
  });
}

export function subscribeReports(callback: (reports: TermReport[]) => void) {
  return onSnapshot(collection(db, 'reports'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as TermReport));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredReports(items);
      callback(items);
    } else {
      callback(getStoredReports());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'reports');
    }
    console.warn('Firestore reports subscription fallback:', err);
    callback(getStoredReports());
  });
}

export function subscribePayments(callback: (payments: PaymentRecord[]) => void) {
  return onSnapshot(collection(db, 'transactions'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentRecord));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredPayments(items);
      callback(items);
    } else {
      callback(getStoredPayments());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'transactions');
    }
    console.warn('Firestore payments subscription fallback:', err);
    callback(getStoredPayments());
  });
}

export function subscribeBills(callback: (bills: StudentBill[]) => void) {
  return onSnapshot(collection(db, 'bills'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentBill));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredBills(items);
      callback(items);
    } else {
      callback(getStoredBills());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'bills');
    }
    console.warn('Firestore bills subscription fallback:', err);
    callback(getStoredBills());
  });
}

export function subscribeSettings(callback: (settings: SchoolSettings) => void) {
  return onSnapshot(doc(db, 'settings', 'general'), (snap) => {
    if (snap.exists()) {
      const data = snap.data() as SchoolSettings;
      if (data.staffSecretCode) saveStoredStaffSecretCode(data.staffSecretCode);
      if ((data as any).demoDataCleared) setDemoDataCleared(true);
      callback(data);
    } else {
      callback(DEFAULT_SETTINGS);
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'settings');
    }
    console.warn('Firestore settings subscription fallback:', err);
    callback(DEFAULT_SETTINGS);
  });
}

export function subscribeThemePalette(callback: (palette: ThemePaletteConfig) => void) {
  // Initialize with local storage cache immediately
  callback(getStoredThemePalette());
  
  return onSnapshot(doc(db, 'settings', 'theme_palette'), (snap) => {
    if (snap.exists()) {
      const data = snap.data() as ThemePaletteConfig;
      saveStoredThemePalette(data);
      applyThemePaletteToDom(data);
      callback(data);
    } else {
      callback(getStoredThemePalette());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'settings');
    }
    console.warn('Firestore theme_palette subscription fallback:', err);
    callback(getStoredThemePalette());
  });
}

export function subscribeAcademicYears(callback: (ays: AcademicYearItem[]) => void) {
  return onSnapshot(collection(db, 'academicYears'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicYearItem));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredAcademicYears(items);
      callback(items);
    } else {
      callback(getStoredAcademicYears());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'academicYears');
    }
    callback(getStoredAcademicYears());
  });
}

export function subscribeTerms(callback: (terms: TermItem[]) => void) {
  return onSnapshot(collection(db, 'terms'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as TermItem));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredTerms(items);
      callback(items);
    } else {
      callback(getStoredTerms());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'terms');
    }
    callback(getStoredTerms());
  });
}

export function subscribeDepartments(callback: (depts: DepartmentItem[]) => void) {
  return onSnapshot(collection(db, 'departments'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as DepartmentItem));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredDepartments(items);
      callback(items);
    } else {
      callback(getStoredDepartments());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'departments');
    }
    callback(getStoredDepartments());
  });
}

export function subscribeCourses(callback: (courses: CourseItem[]) => void) {
  return onSnapshot(collection(db, 'courses'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as CourseItem));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredCourses(items);
      callback(items);
    } else {
      callback(getStoredCourses());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'courses');
    }
    callback(getStoredCourses());
  });
}

export function subscribeClasses(callback: (classes: ClassItem[]) => void) {
  return onSnapshot(collection(db, 'classes'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassItem));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredClasses(items);
      callback(items);
    } else {
      callback(getStoredClasses());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'classes');
    }
    callback(getStoredClasses());
  });
}

export function subscribeHouses(callback: (houses: HouseItem[]) => void) {
  return onSnapshot(collection(db, 'houses'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as HouseItem));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredHouses(items);
      callback(items);
    } else {
      callback(getStoredHouses());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'houses');
    }
    callback(getStoredHouses());
  });
}

export function subscribeSubjects(callback: (subjects: SubjectItem[]) => void) {
  return onSnapshot(collection(db, 'subjects'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as SubjectItem));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredSubjects(items);
      callback(items);
    } else {
      callback(getStoredSubjects());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'subjects');
    }
    callback(getStoredSubjects());
  });
}

export function subscribeCalendarEvents(callback: (events: CalendarEvent[]) => void) {
  return onSnapshot(collection(db, 'events'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as CalendarEvent));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredCalendarEvents(items);
      callback(items);
    } else {
      callback(getStoredCalendarEvents());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'events');
    }
    console.warn('Firestore calendar events subscription fallback:', err);
    callback(getStoredCalendarEvents());
  });
}

export function subscribeNotifications(callback: (notifs: NotificationItem[]) => void) {
  return onSnapshot(collection(db, 'notifications'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as NotificationItem));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredNotifications(items);
      callback(items);
    } else {
      callback(getStoredNotifications());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'notifications');
    }
    console.warn('Firestore notifications subscription fallback:', err);
    callback(getStoredNotifications());
  });
}

export function subscribeClassFeeTariffs(callback: (tariffs: ClassFeeTariffItem[]) => void) {
  return onSnapshot(collection(db, 'classFeeTariffs'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassFeeTariffItem));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredClassFeeTariffs(items);
      callback(items);
    } else {
      callback(getStoredClassFeeTariffs());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'classFeeTariffs');
    }
    console.warn('Firestore classFeeTariffs subscription fallback:', err);
    callback(getStoredClassFeeTariffs());
  });
}

export async function saveClassFeeTariff(tariff: ClassFeeTariffItem) {
  const current = getStoredClassFeeTariffs();
  const idx = current.findIndex(t => t.id === tariff.id);
  let updated: ClassFeeTariffItem[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = tariff;
  } else {
    updated = [tariff, ...current];
  }
  saveStoredClassFeeTariffs(updated);
  try {
    await setDoc(doc(db, 'classFeeTariffs', tariff.id), tariff);
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'classFeeTariffs');
    }
    console.warn('Firestore saveClassFeeTariff fallback to local:', err);
  }
  return updated;
}

export async function deleteClassFeeTariff(id: string) {
  const current = getStoredClassFeeTariffs();
  const updated = current.filter(t => t.id !== id);
  saveStoredClassFeeTariffs(updated);
  try {
    await deleteDoc(doc(db, 'classFeeTariffs', id));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.DELETE, 'classFeeTariffs');
    }
    console.warn('Firestore deleteClassFeeTariff fallback to local:', err);
  }
  return updated;
}

export function subscribeClassBroadcasts(callback: (broadcasts: ClassReportBroadcast[]) => void) {
  return onSnapshot(collection(db, 'classReportBroadcasts'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassReportBroadcast));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredClassBroadcasts(items);
      callback(items);
    } else {
      callback(getStoredClassBroadcasts());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'classReportBroadcasts');
    }
    console.warn('Firestore classReportBroadcasts subscription fallback:', err);
    callback(getStoredClassBroadcasts());
  });
}

export async function saveClassBroadcast(broadcast: ClassReportBroadcast) {
  const current = getStoredClassBroadcasts();
  const idx = current.findIndex(b => b.id === broadcast.id || (b.className === broadcast.className && b.term === broadcast.term && b.academicYear === broadcast.academicYear));
  let updated: ClassReportBroadcast[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = broadcast;
  } else {
    updated = [broadcast, ...current];
  }
  saveStoredClassBroadcasts(updated);
  try {
    await setDoc(doc(db, 'classReportBroadcasts', broadcast.id), sanitizeForFirestore(broadcast));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'classReportBroadcasts');
    }
    console.warn('Firestore saveClassBroadcast fallback to local:', err);
  }
  return updated;
}

export async function saveAllClassBroadcasts(broadcasts: ClassReportBroadcast[]) {
  saveStoredClassBroadcasts(broadcasts);
  try {
    for (const b of broadcasts) {
      await setDoc(doc(db, 'classReportBroadcasts', b.id), sanitizeForFirestore(b));
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'classReportBroadcasts');
    }
    console.warn('Firestore saveAllClassBroadcasts fallback to local:', err);
  }
}

export async function deleteClassBroadcast(id: string) {
  const current = getStoredClassBroadcasts();
  const updated = current.filter(b => b.id !== id);
  saveStoredClassBroadcasts(updated);
  try {
    await deleteDoc(doc(db, 'classReportBroadcasts', id));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.DELETE, 'classReportBroadcasts');
    }
    console.warn('Firestore deleteClassBroadcast fallback to local:', err);
  }
  return updated;
}

// -------------------------------------------------------------
// Database CRUD Operations (Dual-written to localStorage and Firestore)
// -------------------------------------------------------------
export async function saveStudent(student: Student) {
  try {
    await setDoc(doc(db, 'students', student.id), sanitizeForFirestore(student));
    const current = getStoredStudents();
    const idx = current.findIndex(s => s.id === student.id);
    const updated = idx >= 0 ? current.map(s => s.id === student.id ? student : s) : [student, ...current];
    saveStoredStudents(updated);
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'students');
    }
    console.warn('[dbService] saveStudent offline fallback:', err);
    const current = getStoredStudents();
    const idx = current.findIndex(s => s.id === student.id);
    const updated = idx >= 0 ? current.map(s => s.id === student.id ? student : s) : [student, ...current];
    saveStoredStudents(updated);
  }
}

export async function saveAllStudents(studentsList: Student[]) {
  saveStoredStudents(studentsList);
  try {
    const batch = writeBatch(db);
    studentsList.forEach(st => {
      batch.set(doc(db, 'students', st.id), sanitizeForFirestore(st));
    });
    await batch.commit();
  } catch (err) {
    console.warn('[dbService] saveAllStudents batch commit warning:', err);
  }
}

export async function approveStudentAdmission(studentId: string, assignedAdmissionNo?: string) {
  const current = getStoredStudents();
  const student = current.find(s => s.id === studentId);
  if (!student) return;

  const nextAdmNo = assignedAdmissionNo || student.admissionNo || `ADM/26/${String(current.filter(s => s.status === 'Active').length + 1).padStart(4, '0')}`;
  const updatedStudent: Student = {
    ...student,
    admissionNo: nextAdmNo,
    status: 'Active',
    isApproved: true,
    approvalStatus: 'Approved'
  };

  try {
    await setDoc(doc(db, 'students', studentId), sanitizeForFirestore(updatedStudent));
    const updatedList = current.map(s => s.id === studentId ? updatedStudent : s);
    saveStoredStudents(updatedList);
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'students');
    }
    console.warn('[dbService] approveStudentAdmission offline fallback:', err);
    const updatedList = current.map(s => s.id === studentId ? updatedStudent : s);
    saveStoredStudents(updatedList);
  }
  return updatedStudent;
}

export async function rejectStudentAdmission(studentId: string, reason?: string) {
  const current = getStoredStudents();
  const student = current.find(s => s.id === studentId);
  if (!student) return;

  const updatedStudent: Student = {
    ...student,
    status: 'Inactive',
    isApproved: false,
    approvalStatus: 'Rejected',
    rejectionReason: reason || 'Application declined by administration'
  };

  try {
    await setDoc(doc(db, 'students', studentId), sanitizeForFirestore(updatedStudent));
    const updatedList = current.map(s => s.id === studentId ? updatedStudent : s);
    saveStoredStudents(updatedList);
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'students');
    }
    console.warn('[dbService] rejectStudentAdmission offline fallback:', err);
    const updatedList = current.map(s => s.id === studentId ? updatedStudent : s);
    saveStoredStudents(updatedList);
  }
  return updatedStudent;
}

export async function deleteStudent(studentId: string) {
  try {
    await deleteDoc(doc(db, 'students', studentId));
    const current = getStoredStudents();
    const updated = current.filter(s => s.id !== studentId);
    saveStoredStudents(updated);
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.DELETE, 'students');
    }
    console.warn('[dbService] deleteStudent offline fallback:', err);
    const current = getStoredStudents();
    const updated = current.filter(s => s.id !== studentId);
    saveStoredStudents(updated);
  }
}

export async function saveTeacher(teacher: Teacher) {
  try {
    await setDoc(doc(db, 'teachers', teacher.id), sanitizeForFirestore(teacher));
    const current = getStoredTeachers();
    const idx = current.findIndex(t => t.id === teacher.id);
    const updated = idx >= 0 ? current.map(t => t.id === teacher.id ? teacher : t) : [teacher, ...current];
    saveStoredTeachers(updated);
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'teachers');
    }
    console.warn('[dbService] saveTeacher offline fallback:', err);
    const current = getStoredTeachers();
    const idx = current.findIndex(t => t.id === teacher.id);
    const updated = idx >= 0 ? current.map(t => t.id === teacher.id ? teacher : t) : [teacher, ...current];
    saveStoredTeachers(updated);
  }
}

export async function saveAllTeachers(teachersList: Teacher[]) {
  saveStoredTeachers(teachersList);
  try {
    const batch = writeBatch(db);
    teachersList.forEach(t => {
      batch.set(doc(db, 'teachers', t.id), sanitizeForFirestore(t));
    });
    await batch.commit();
  } catch (err) {
    console.warn('[dbService] saveAllTeachers batch commit warning:', err);
  }
}

export async function deleteTeacher(teacherId: string) {
  try {
    await deleteDoc(doc(db, 'teachers', teacherId));
    const current = getStoredTeachers();
    const updated = current.filter(t => t.id !== teacherId);
    saveStoredTeachers(updated);
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.DELETE, 'teachers');
    }
    console.warn('[dbService] deleteTeacher offline fallback:', err);
    const current = getStoredTeachers();
    const updated = current.filter(t => t.id !== teacherId);
    saveStoredTeachers(updated);
  }
}

export async function saveReport(report: TermReport) {
  try {
    await setDoc(doc(db, 'reports', report.id), sanitizeForFirestore(report));
    const current = getStoredReports();
    const idx = current.findIndex(r => r.id === report.id);
    const updated = idx >= 0 ? current.map(r => r.id === report.id ? report : r) : [report, ...current];
    saveStoredReports(updated);
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'reports');
    }
    console.warn('[dbService] saveReport offline fallback:', err);
    const current = getStoredReports();
    const idx = current.findIndex(r => r.id === report.id);
    const updated = idx >= 0 ? current.map(r => r.id === report.id ? report : r) : [report, ...current];
    saveStoredReports(updated);
  }
}

export async function saveAllReports(reportsList: TermReport[]) {
  saveStoredReports(reportsList);
  try {
    for (const rep of reportsList) {
      await setDoc(doc(db, 'reports', rep.id), sanitizeForFirestore(rep));
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'reports');
    }
    console.warn('[dbService] saveAllReports offline/fallback:', err);
  }
}

export async function savePayment(payment: PaymentRecord) {
  const current = getStoredPayments();
  const idx = current.findIndex(p => p.id === payment.id);
  const updated = idx >= 0 ? current.map(p => p.id === payment.id ? payment : p) : [payment, ...current];
  saveStoredPayments(updated);
  try {
    await setDoc(doc(db, 'transactions', payment.id), sanitizeForFirestore(payment));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'transactions');
    }
    console.warn('[dbService] savePayment offline/fallback:', err);
  }
}

export async function saveBill(bill: StudentBill) {
  const current = getStoredBills();
  const idx = current.findIndex(b => b.id === bill.id);
  const updated = idx >= 0 ? current.map(b => b.id === bill.id ? bill : b) : [bill, ...current];
  saveStoredBills(updated);
  try {
    await setDoc(doc(db, 'bills', bill.id), sanitizeForFirestore(bill));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'bills');
    }
    console.warn('[dbService] saveBill offline/fallback:', err);
  }
}

export async function saveCalendarEvent(event: CalendarEvent) {
  const current = getStoredCalendarEvents();
  const idx = current.findIndex(e => e.id === event.id);
  const updated = idx >= 0 ? current.map(e => e.id === event.id ? event : e) : [event, ...current];
  saveStoredCalendarEvents(updated);
  try {
    await setDoc(doc(db, 'events', event.id), sanitizeForFirestore(event));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'events');
    }
    console.warn('[dbService] saveCalendarEvent offline/fallback:', err);
  }
}

export async function saveNotification(notif: NotificationItem) {
  const current = getStoredNotifications();
  const idx = current.findIndex(n => n.id === notif.id);
  const updated = idx >= 0 ? current.map(n => n.id === notif.id ? notif : n) : [notif, ...current];
  saveStoredNotifications(updated);
  try {
    await setDoc(doc(db, 'notifications', notif.id), sanitizeForFirestore(notif));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'notifications');
    }
    console.warn('[dbService] saveNotification offline/fallback:', err);
  }
}

// -------------------------------------------------------------
// System Users & Accounts Management
// -------------------------------------------------------------
export { getStoredUsers, saveStoredUsers, INITIAL_SYSTEM_USERS };

export async function saveUserAccount(user: UserAccountItem) {
  const current = getStoredUsers();
  const idx = current.findIndex(u => u.id === user.id);
  const updated = idx >= 0 ? current.map(u => u.id === user.id ? user : u) : [user, ...current];
  saveStoredUsers(updated);
  try {
    await setDoc(doc(db, 'users', user.id), sanitizeForFirestore(user));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'users');
    }
    console.warn('[dbService] saveUserAccount offline/fallback:', err);
  }
}

export async function saveAllUserAccounts(users: UserAccountItem[]) {
  saveStoredUsers(users);
  try {
    for (const u of users) {
      await setDoc(doc(db, 'users', u.id), sanitizeForFirestore(u));
    }
  } catch (err) {
    console.warn('[dbService] saveAllUserAccounts fallback:', err);
  }
}

export async function deleteUserAccount(userId: string) {
  const current = getStoredUsers();
  const updated = current.filter(u => u.id !== userId);
  saveStoredUsers(updated);
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.DELETE, 'users');
    }
    console.warn('[dbService] deleteUserAccount offline/fallback:', err);
  }
}

export async function approveUserAccount(userId: string, approvedBy: string = 'Administrator') {
  const current = getStoredUsers();
  const user = current.find(u => u.id === userId);
  if (!user) return;
  const updatedUser: UserAccountItem = {
    ...user,
    status: 'Active',
    isApproved: true,
    approvedBy,
    approvedAt: new Date().toISOString()
  };
  await saveUserAccount(updatedUser);
  return updatedUser;
}

export async function rejectUserAccount(userId: string) {
  const current = getStoredUsers();
  const user = current.find(u => u.id === userId);
  if (!user) return;
  const updatedUser: UserAccountItem = {
    ...user,
    status: 'Inactive',
    isApproved: false
  };
  await saveUserAccount(updatedUser);
  return updatedUser;
}

export async function saveSettings(settings: Partial<SchoolSettings>) {
  if (settings.staffSecretCode) {
    saveStoredStaffSecretCode(settings.staffSecretCode);
  }
  try {
    await setDoc(doc(db, 'settings', 'general'), sanitizeForFirestore(settings), { merge: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'settings');
    }
    console.warn('[dbService] saveSettings offline/fallback:', err);
  }
}

export async function saveThemePalette(palette: ThemePaletteConfig): Promise<void> {
  // 1. Immediately apply to local storage and browser DOM
  saveStoredThemePalette(palette);
  applyThemePaletteToDom(palette);

  // 2. Persist to Firestore config document in settings collection
  try {
    const sanitized = sanitizeForFirestore({
      ...palette,
      updatedAt: new Date().toISOString()
    });
    await setDoc(doc(db, 'settings', 'theme_palette'), sanitized, { merge: true });
    console.log('[dbService] Theme palette persisted to Firestore (settings/theme_palette)');
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'settings');
    }
    console.warn('[dbService] saveThemePalette fallback:', err);
  }
}

export function getStaffSecretCode(): string {
  return getStoredStaffSecretCode();
}

export async function saveStaffSecretCode(code: string): Promise<void> {
  const clean = code.trim();
  saveStoredStaffSecretCode(clean);
  const codes = getStoredStaffSecretCodes();
  const existingIdx = codes.findIndex(c => c.code.trim().toUpperCase() === clean.toUpperCase());
  let targetRecord: StaffSecretCodeRecord;
  let updatedCodes: StaffSecretCodeRecord[];
  
  if (existingIdx >= 0) {
    codes[existingIdx].used = false;
    codes[existingIdx].expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    targetRecord = codes[existingIdx];
    updatedCodes = [...codes];
  } else {
    targetRecord = {
      id: `ssc-${Date.now()}`,
      code: clean,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      used: false,
      createdBy: 'System Admin'
    };
    updatedCodes = [targetRecord, ...codes];
  }
  saveStoredStaffSecretCodes(updatedCodes);

  // Sync to Firestore collections & settings so Device B, C immediately have it
  try {
    await setDoc(doc(db, 'staffSecretCodes', targetRecord.id), sanitizeForFirestore(targetRecord), { merge: true });
    await setDoc(doc(db, 'systemSettings', 'staffSecretCodes'), sanitizeForFirestore({
      activeCode: clean,
      codes: updatedCodes,
      updatedAt: Date.now()
    }), { merge: true });
    await saveSettings({ staffSecretCode: clean });
    console.log('[dbService] Staff secret code persisted to Firestore for all devices:', clean);
  } catch (err) {
    console.warn('[dbService] saveStaffSecretCode Firestore sync error:', err);
  }
}

// -------------------------------------------------------------
// Academic Setup CRUD Operations
// -------------------------------------------------------------
export async function saveAcademicYear(ay: AcademicYearItem | AcademicYear) {
  const current = getStoredAcademicYears();
  const idx = current.findIndex(a => a.id === ay.id);
  const updated = idx >= 0 ? current.map(a => a.id === ay.id ? (ay as AcademicYearItem) : a) : [ay as AcademicYearItem, ...current];
  saveStoredAcademicYears(updated);
  try {
    await setDoc(doc(db, 'academicYears', ay.id), sanitizeForFirestore(ay));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'academicYears');
    }
    console.warn('[dbService] saveAcademicYear offline/fallback:', err);
  }
}

export async function saveAllAcademicYears(years: AcademicYearItem[]) {
  saveStoredAcademicYears(years);
  try {
    for (const ay of years) {
      await setDoc(doc(db, 'academicYears', ay.id), sanitizeForFirestore(ay));
    }
  } catch (err) {
    console.warn('[dbService] saveAllAcademicYears fallback:', err);
  }
}

export async function deleteAcademicYear(ayId: string) {
  const current = getStoredAcademicYears();
  const updated = current.filter(a => a.id !== ayId);
  saveStoredAcademicYears(updated);
  try {
    await deleteDoc(doc(db, 'academicYears', ayId));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.DELETE, 'academicYears');
    }
    console.warn('[dbService] deleteAcademicYear fallback:', err);
  }
}

export async function saveTerm(term: TermItem | Term) {
  const current = getStoredTerms();
  const idx = current.findIndex(t => t.id === term.id);
  const updated = idx >= 0 ? current.map(t => t.id === term.id ? (term as TermItem) : t) : [term as TermItem, ...current];
  saveStoredTerms(updated);
  try {
    await setDoc(doc(db, 'terms', term.id), sanitizeForFirestore(term));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'terms');
    }
    console.warn('[dbService] saveTerm offline/fallback:', err);
  }
}

export async function saveAllTerms(terms: TermItem[]) {
  saveStoredTerms(terms);
  try {
    for (const t of terms) {
      await setDoc(doc(db, 'terms', t.id), sanitizeForFirestore(t));
    }
  } catch (err) {
    console.warn('[dbService] saveAllTerms fallback:', err);
  }
}

export async function deleteTerm(termId: string) {
  const current = getStoredTerms();
  const updated = current.filter(t => t.id !== termId);
  saveStoredTerms(updated);
  try {
    await deleteDoc(doc(db, 'terms', termId));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.DELETE, 'terms');
    }
    console.warn('[dbService] deleteTerm fallback:', err);
  }
}

export async function saveDepartment(dept: DepartmentItem | Department) {
  const current = getStoredDepartments();
  const idx = current.findIndex(d => d.id === dept.id);
  const updated = idx >= 0 ? current.map(d => d.id === dept.id ? (dept as DepartmentItem) : d) : [dept as DepartmentItem, ...current];
  saveStoredDepartments(updated);
  try {
    await setDoc(doc(db, 'departments', dept.id), sanitizeForFirestore(dept));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'departments');
    }
    console.warn('[dbService] saveDepartment offline/fallback:', err);
  }
}

export async function saveAllDepartments(depts: DepartmentItem[]) {
  saveStoredDepartments(depts);
  try {
    for (const d of depts) {
      await setDoc(doc(db, 'departments', d.id), sanitizeForFirestore(d));
    }
  } catch (err) {
    console.warn('[dbService] saveAllDepartments fallback:', err);
  }
}

export async function deleteDepartment(deptId: string) {
  const current = getStoredDepartments();
  const updated = current.filter(d => d.id !== deptId);
  saveStoredDepartments(updated);
  try {
    await deleteDoc(doc(db, 'departments', deptId));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.DELETE, 'departments');
    }
    console.warn('[dbService] deleteDepartment fallback:', err);
  }
}

export async function saveCourse(crs: CourseItem) {
  const current = getStoredCourses();
  const idx = current.findIndex(c => c.id === crs.id);
  const updated = idx >= 0 ? current.map(c => c.id === crs.id ? crs : c) : [crs, ...current];
  saveStoredCourses(updated);
  try {
    await setDoc(doc(db, 'courses', crs.id), sanitizeForFirestore(crs));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'courses');
    }
    console.warn('[dbService] saveCourse offline/fallback:', err);
  }
}

export async function saveAllCourses(courses: CourseItem[]) {
  saveStoredCourses(courses);
  try {
    for (const c of courses) {
      await setDoc(doc(db, 'courses', c.id), sanitizeForFirestore(c));
    }
  } catch (err) {
    console.warn('[dbService] saveAllCourses fallback:', err);
  }
}

export async function deleteCourse(courseId: string) {
  const current = getStoredCourses();
  const updated = current.filter(c => c.id !== courseId);
  saveStoredCourses(updated);
  try {
    await deleteDoc(doc(db, 'courses', courseId));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.DELETE, 'courses');
    }
    console.warn('[dbService] deleteCourse fallback:', err);
  }
}

export async function saveClass(cls: ClassItem | SchoolClass) {
  const current = getStoredClasses();
  const idx = current.findIndex(c => c.id === cls.id);
  const updated = idx >= 0 ? current.map(c => c.id === cls.id ? (cls as ClassItem) : c) : [cls as ClassItem, ...current];
  saveStoredClasses(updated);
  try {
    await setDoc(doc(db, 'classes', cls.id), sanitizeForFirestore(cls));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'classes');
    }
    console.warn('[dbService] saveClass offline/fallback:', err);
  }
}

export async function saveAllClasses(classes: ClassItem[]) {
  saveStoredClasses(classes);
  try {
    for (const c of classes) {
      await setDoc(doc(db, 'classes', c.id), sanitizeForFirestore(c));
    }
  } catch (err) {
    console.warn('[dbService] saveAllClasses fallback:', err);
  }
}

export async function deleteClass(classId: string) {
  const current = getStoredClasses();
  const updated = current.filter(c => c.id !== classId);
  saveStoredClasses(updated);
  try {
    await deleteDoc(doc(db, 'classes', classId));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.DELETE, 'classes');
    }
    console.warn('[dbService] deleteClass fallback:', err);
  }
}

export async function saveHouse(house: HouseItem | House) {
  const current = getStoredHouses();
  const idx = current.findIndex(h => h.id === house.id);
  const updated = idx >= 0 ? current.map(h => h.id === house.id ? (house as HouseItem) : h) : [house as HouseItem, ...current];
  saveStoredHouses(updated);
  try {
    await setDoc(doc(db, 'houses', house.id), sanitizeForFirestore(house));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'houses');
    }
    console.warn('[dbService] saveHouse offline/fallback:', err);
  }
}

export async function saveAllHouses(houses: HouseItem[]) {
  saveStoredHouses(houses);
  try {
    for (const h of houses) {
      await setDoc(doc(db, 'houses', h.id), sanitizeForFirestore(h));
    }
  } catch (err) {
    console.warn('[dbService] saveAllHouses fallback:', err);
  }
}

export async function deleteHouse(houseId: string) {
  const current = getStoredHouses();
  const updated = current.filter(h => h.id !== houseId);
  saveStoredHouses(updated);
  try {
    await deleteDoc(doc(db, 'houses', houseId));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.DELETE, 'houses');
    }
    console.warn('[dbService] deleteHouse fallback:', err);
  }
}

export async function saveSubject(subject: SubjectItem | Subject) {
  const current = getStoredSubjects();
  const idx = current.findIndex(s => s.id === subject.id);
  const updated = idx >= 0 ? current.map(s => s.id === subject.id ? (subject as SubjectItem) : s) : [subject as SubjectItem, ...current];
  saveStoredSubjects(updated);
  try {
    await setDoc(doc(db, 'subjects', subject.id), sanitizeForFirestore(subject));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, 'subjects');
    }
    console.warn('[dbService] saveSubject offline/fallback:', err);
  }
}

export async function saveAllSubjects(subjects: SubjectItem[]) {
  saveStoredSubjects(subjects);
  try {
    for (const s of subjects) {
      await setDoc(doc(db, 'subjects', s.id), sanitizeForFirestore(s));
    }
  } catch (err) {
    console.warn('[dbService] saveAllSubjects fallback:', err);
  }
}

export async function deleteSubject(subjectId: string) {
  const current = getStoredSubjects();
  const updated = current.filter(s => s.id !== subjectId);
  saveStoredSubjects(updated);
  try {
    await deleteDoc(doc(db, 'subjects', subjectId));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.DELETE, 'subjects');
    }
    console.warn('[dbService] deleteSubject fallback:', err);
  }
}

// -------------------------------------------------------------
// Firebase Authentication & User Profile Sync
// -------------------------------------------------------------
export async function authenticateWithFirebase(
  email: string, 
  pass: string, 
  role: 'admin' | 'teacher' | 'accountant' | 'student',
  userData: Partial<User>
): Promise<User> {
  let fbUser: FirebaseUser | null = null;

  try {
    // Attempt standard Firebase Auth sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    fbUser = userCredential.user;
  } catch (signInErr: any) {
    // If user not found yet in Firebase Auth, register them
    if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
      try {
        const createCredential = await createUserWithEmailAndPassword(auth, email, pass);
        fbUser = createCredential.user;
      } catch (createErr: any) {
        if (createErr.code === 'auth/email-already-in-use') {
          // Email already exists but wrong password was entered
          throw new Error('Incorrect password for this account.');
        }
        console.warn('Firebase registration notice:', createErr);
      }
    } else if (signInErr.code === 'auth/wrong-password') {
      throw new Error('Incorrect password for this account.');
    }
  }

  const userId = fbUser ? fbUser.uid : (userData.id || `u-${Date.now()}`);

  const userProfile: User = {
    id: userId,
    email: email,
    name: userData.name || (role === 'admin' ? 'JAKRei' : 'User'),
    role: role,
    classAssigned: userData.classAssigned,
    admissionNo: userData.admissionNo,
    allowedModules: userData.allowedModules,
    privilege: userData.privilege,
    avatar: userData.avatar || (role === 'admin' 
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80')
  };

  // Persist user record into Firestore `users` collection
  try {
    await setDoc(doc(db, 'users', userId), sanitizeForFirestore({
      ...userProfile,
      lastLogin: new Date().toISOString(),
      firebaseUid: fbUser?.uid || null,
      isFirebaseAuthenticated: !!fbUser
    }), { merge: true });
  } catch (e) {
    if (e instanceof Error && e.message.includes('permission')) {
      handleFirestoreError(e, OperationType.WRITE, 'users');
    }
    console.warn('Could not update Firestore user document:', e);
  }

  return userProfile;
}

export async function signOutFirebaseUser() {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signOut error:', err);
  }
}

export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const d = await getDoc(doc(db, 'users', userId));
    if (d.exists()) {
      return d.data() as User;
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'users');
    }
    console.warn('Could not fetch user profile:', err);
  }
  return null;
}

export function subscribeAuthState(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function requestPasswordReset(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error: any) {
    console.warn('Password reset email error:', error);
    throw error;
  }
}




export async function checkHasDemoData(): Promise<boolean> {
  if (isDemoDataCleared()) return false;
  const storedStudents = getStoredStudents();
  const storedTeachers = getStoredTeachers();
  const storedYears = getStoredAcademicYears();
  if (
    (storedStudents && storedStudents.length > 0) ||
    (storedTeachers && storedTeachers.length > 0) ||
    (storedYears && storedYears.length > 0)
  ) {
    return true;
  }
  try {
    const snap = await getDocs(collection(db, 'students'));
    return !snap.empty;
  } catch (e) {
    return false;
  }
}

export async function clearDemoData() {
  setDemoDataCleared(true);
  
  // Clear all local storage demo caches
  saveStoredStudents([]);
  saveStoredTeachers([]);
  saveStoredReports([]);
  saveStoredBills([]);
  saveStoredPayments([]);
  saveStoredCalendarEvents([]);
  saveStoredNotifications([]);
  saveStoredAcademicYears([]);
  saveStoredTerms([]);
  saveStoredDepartments([]);
  saveStoredClasses([]);
  saveStoredHouses([]);
  saveStoredSubjects([]);
  saveStoredCourses([]);
  saveStoredClassFeeTariffs([]);
  saveStoredFeeSubmissions([]);
  saveStoredClassBroadcasts([]);

  // Clear demo users except active admin accounts
  try {
    const users = getStoredUsers();
    const preservedAdmins = users.filter(u => u.role === 'admin');
    saveStoredUsers(preservedAdmins);
  } catch {}

  // Sync cleared demo status to Firestore so other devices (Device B, C...) don't re-seed
  try {
    await setDoc(doc(db, 'systemSettings', 'demoStatus'), { 
      demoDataCleared: true, 
      clearedAt: new Date().toISOString() 
    }, { merge: true });
    await setDoc(doc(db, 'settings', 'general'), { 
      demoDataCleared: true 
    }, { merge: true });
  } catch (err) {
    console.warn('[dbService] Demo status sync error:', err);
  }

  // Delete all demo data documents from Firestore
  try {
    const collectionsToClear = [
      'students',
      'teachers',
      'reports',
      'bills',
      'transactions',
      'academicYears',
      'terms',
      'departments',
      'classes',
      'houses',
      'subjects',
      'courses',
      'events',
      'notifications',
      'classFeeTariffs',
      'feeSubmissions',
      'classReportBroadcasts'
    ];

    for (const col of collectionsToClear) {
      try {
        const snap = await getDocs(collection(db, col));
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach(d => {
            batch.delete(d.ref);
          });
          await batch.commit();
        }
      } catch (colErr) {
        console.warn(`[dbService] Clear collection ${col} error:`, colErr);
      }
    }

    // Clear demo users in Firestore, preserving admin users
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      let toDeleteCount = 0;
      usersSnap.docs.forEach(d => {
        const u = d.data();
        if (u.role !== 'admin') {
          batch.delete(d.ref);
          toDeleteCount++;
        }
      });
      if (toDeleteCount > 0) {
        await batch.commit();
      }
    } catch {}

    console.log('[dbService] All pre-stored demo data has been comprehensively cleared from Firestore.');
  } catch (e) {
    if (e instanceof Error && e.message.includes('permission')) {
      handleFirestoreError(e, OperationType.DELETE, 'multiple');
    }
    console.error('Failed to clear demo data from Firestore:', e);
  }
}

// -------------------------------------------------------------
// Payment Settings & Fee Submissions Realtime Listeners & Writers
// -------------------------------------------------------------
export function subscribePaymentSettings(callback: (settings: PaymentSettingsConfig) => void) {
  try {
    const docRef = doc(db, 'systemSettings', 'paymentSettings');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as PaymentSettingsConfig;
        saveStoredPaymentSettings(data);
        callback(data);
      } else {
        callback(getStoredPaymentSettings());
      }
    }, (err) => {
      if (err instanceof Error && err.message.includes('permission')) {
        handleFirestoreError(err, OperationType.GET, 'systemSettings');
      }
      console.warn('subscribePaymentSettings offline notice:', err);
      callback(getStoredPaymentSettings());
    });
  } catch (e) {
    callback(getStoredPaymentSettings());
    return () => {};
  }
}

export async function savePaymentSettings(settings: PaymentSettingsConfig): Promise<void> {
  saveStoredPaymentSettings(settings);
  try {
    const docRef = doc(db, 'systemSettings', 'paymentSettings');
    await setDoc(docRef, sanitizeForFirestore(settings));
  } catch (e) {
    if (e instanceof Error && e.message.includes('permission')) {
      handleFirestoreError(e, OperationType.WRITE, 'systemSettings');
    }
    console.warn('savePaymentSettings Firestore sync notice:', e);
  }
}

export function subscribeFeeSubmissions(callback: (submissions: FeeSubmissionItem[]) => void) {
  try {
    const colRef = collection(db, 'feeSubmissions');
    return onSnapshot(colRef, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as FeeSubmissionItem));
      // Sort newest first
      items.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
      if (items.length > 0 || isDemoDataCleared()) {
        saveStoredFeeSubmissions(items);
        callback(items);
      } else {
        callback(getStoredFeeSubmissions());
      }
    }, (err) => {
      if (err instanceof Error && err.message.includes('permission')) {
        handleFirestoreError(err, OperationType.GET, 'feeSubmissions');
      }
      console.warn('subscribeFeeSubmissions offline notice:', err);
      callback(getStoredFeeSubmissions());
    });
  } catch (e) {
    callback(getStoredFeeSubmissions());
    return () => {};
  }
}

export async function saveFeeSubmission(submission: FeeSubmissionItem): Promise<void> {
  const current = getStoredFeeSubmissions();
  const updated = [submission, ...current.filter(s => s.id !== submission.id)];
  saveStoredFeeSubmissions(updated);
  try {
    const docRef = doc(db, 'feeSubmissions', submission.id);
    await setDoc(docRef, sanitizeForFirestore(submission));
  } catch (e) {
    if (e instanceof Error && e.message.includes('permission')) {
      handleFirestoreError(e, OperationType.WRITE, 'feeSubmissions');
    }
    console.warn('saveFeeSubmission Firestore sync notice:', e);
  }
}

export async function updateFeeSubmissionStatus(
  submissionId: string, 
  status: 'Approved' | 'Rejected', 
  verifierName: string, 
  receiptNo?: string, 
  rejectionReason?: string
): Promise<FeeSubmissionItem | null> {
  const current = getStoredFeeSubmissions();
  let updatedItem: FeeSubmissionItem | null = null;
  const updatedList = current.map(sub => {
    if (sub.id === submissionId) {
      updatedItem = {
        ...sub,
        status,
        verifiedBy: verifierName,
        verifiedAt: new Date().toISOString().split('T')[0],
        receiptNo,
        rejectionReason
      };
      return updatedItem;
    }
    return sub;
  });

  saveStoredFeeSubmissions(updatedList);

  if (updatedItem) {
    try {
      const docRef = doc(db, 'feeSubmissions', submissionId);
      await setDoc(docRef, sanitizeForFirestore(updatedItem), { merge: true });
    } catch (e) {
      if (e instanceof Error && e.message.includes('permission')) {
        handleFirestoreError(e, OperationType.WRITE, 'feeSubmissions');
      }
      console.warn('updateFeeSubmissionStatus Firestore sync notice:', e);
    }
  }

  return updatedItem;
}

export async function deleteBill(billId: string) {
  const current = getStoredBills();
  const updated = current.filter(b => b.id !== billId);
  saveStoredBills(updated);
  try {
    await deleteDoc(doc(db, 'bills', billId));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.DELETE, 'bills');
    }
    console.warn('[dbService] deleteBill offline/fallback:', err);
  }
}

export async function deleteReport(reportId: string) {
  const current = getStoredReports();
  const updated = current.filter(r => r.id !== reportId);
  saveStoredReports(updated);
  try {
    await deleteDoc(doc(db, 'reports', reportId));
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.DELETE, 'reports');
    }
    console.warn('[dbService] deleteReport offline/fallback:', err);
  }
}

