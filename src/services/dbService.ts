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
  runTransaction,
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
import {
  executeCloudWrite,
  executeCloudDelete,
  sanitizeForFirestore,
  FirebaseSyncError,
  getCloudSyncStatus,
  subscribeCloudSyncStatus,
  getUnsyncedDrafts,
  retryAllUnsyncedDrafts,
  UnsyncedDraft
} from './syncService';

export {
  executeCloudWrite,
  executeCloudDelete,
  sanitizeForFirestore,
  FirebaseSyncError,
  getCloudSyncStatus,
  subscribeCloudSyncStatus,
  getUnsyncedDrafts,
  retryAllUnsyncedDrafts
};
export type { UnsyncedDraft };

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
    const isAuth = !!auth.currentUser;
    const collectionsToSync = [
      { name: 'academicYears', save: saveStoredAcademicYears },
      { name: 'terms', save: saveStoredTerms },
      { name: 'departments', save: saveStoredDepartments },
      { name: 'courses', save: saveStoredCourses },
      { name: 'classes', save: saveStoredClasses },
      { name: 'houses', save: saveStoredHouses },
      { name: 'subjects', save: saveStoredSubjects },
      { name: 'events', save: saveStoredCalendarEvents },
      { name: 'notifications', save: saveStoredNotifications },
      { name: 'classFeeTariffs', save: saveStoredClassFeeTariffs },
      { name: 'classReportBroadcasts', save: saveStoredClassBroadcasts },
      ...(isAuth ? [
        { name: 'students', save: saveStoredStudents },
        { name: 'teachers', save: saveStoredTeachers },
        { name: 'reports', save: saveStoredReports },
        { name: 'bills', save: saveStoredBills },
        { name: 'transactions', save: saveStoredPayments },
        { name: 'users', save: saveStoredUsers },
        { name: 'teacherAttendance', save: saveStoredTeacherAttendance },
        { name: 'bankDeposits', save: saveStoredBankDeposits },
        { name: 'expenses', save: saveStoredExpenses },
        { name: 'securityAuditLogs', save: saveStoredSecurityAuditLogs }
      ] : [])
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
  CourseItem,
  TeacherAttendanceRecord,
  StaffWorkingHoursConfig,
  SchoolExpenseRecord,
  BankDepositRecord,
  SecurityAuditLog,
  UserRole
} from '../types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_TEACHERS, 
  INITIAL_TERM_REPORTS, 
  INITIAL_PAYMENTS, 
  INITIAL_BILLS, 
  INITIAL_CALENDAR_EVENTS, 
  INITIAL_NOTIFICATIONS,
  INITIAL_EXPENSES,
  INITIAL_BANK_DEPOSITS,
  INITIAL_SECURITY_AUDIT_LOGS
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
  getStoredTeacherAttendance,
  saveStoredTeacherAttendance,
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
  applyThemePaletteToDom,
  getStoredBankDeposits,
  saveStoredBankDeposits,
  getStoredExpenses,
  saveStoredExpenses,
  getStoredSecurityAuditLogs,
  saveStoredSecurityAuditLogs
} from './storageService';

export {
  getStoredExpenses,
  saveStoredExpenses,
  getStoredBankDeposits,
  saveStoredBankDeposits,
  getStoredSecurityAuditLogs,
  saveStoredSecurityAuditLogs
};

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
  workingHours?: StaffWorkingHoursConfig;
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
  missingGradeThreshold: 1,
  workingHours: {
    startTime: '07:30',
    latenessCutoff: '08:00',
    closingTime: '15:30',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    gracePeriodMinutes: 5
  }
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

const DEFAULT_COURSES: CourseItem[] = [
  { id: 'crs-1', name: 'General Arts', code: 'GA', department: 'Primary School', description: 'Foundational language and social studies' },
  { id: 'crs-2', name: 'General Science', code: 'GS', department: 'Primary School', description: 'Elementary science and nature study' },
  { id: 'crs-3', name: 'Basic Education', code: 'BE', department: 'Junior High School', description: 'Comprehensive JHS syllabus' }
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

  const isAuth = !!auth.currentUser;

  // Helper to safely check and seed a collection
  const checkAndSeed = async (
    collectionName: string,
    getStored: () => any[],
    initialFallback: any[]
  ) => {
    try {
      const snap = await getDocs(collection(db, collectionName));
      if (snap.empty) {
        console.log(`Seeding initial ${collectionName} to Firestore...`);
        const stored = getStored();
        const list = stored && stored.length > 0 ? stored : initialFallback;
        for (const item of list) {
          if (item && item.id) {
            await setDoc(doc(db, collectionName, item.id), sanitizeForFirestore(item));
          }
        }
      }
    } catch (err) {
      // Suppress individual collection seed permission/network errors gracefully
      console.warn(`[dbService] Seed check skipped for ${collectionName}:`, err instanceof Error ? err.message : String(err));
    }
  };

  // 1. General Settings (Publicly readable)
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
    if (!settingsDoc.exists() && isAuth) {
      await setDoc(doc(db, 'settings', 'general'), sanitizeForFirestore(DEFAULT_SETTINGS));
    }
  } catch {}

  // 2. Academic Setup & Public Catalogs
  await checkAndSeed('academicYears', getStoredAcademicYears, INITIAL_ACADEMIC_YEARS);
  await checkAndSeed('terms', getStoredTerms, INITIAL_TERMS);
  await checkAndSeed('departments', getStoredDepartments, INITIAL_DEPARTMENTS);
  await checkAndSeed('courses', getStoredCourses, DEFAULT_COURSES);
  await checkAndSeed('classes', getStoredClasses, INITIAL_CLASSES);
  await checkAndSeed('houses', getStoredHouses, INITIAL_HOUSES);
  await checkAndSeed('subjects', getStoredSubjects, INITIAL_SUBJECTS);
  await checkAndSeed('events', getStoredCalendarEvents, INITIAL_CALENDAR_EVENTS);
  await checkAndSeed('notifications', getStoredNotifications, INITIAL_NOTIFICATIONS);
  await checkAndSeed('classFeeTariffs', getStoredClassFeeTariffs, INITIAL_CLASS_FEE_TARIFFS);
  await checkAndSeed('classReportBroadcasts', getStoredClassBroadcasts, INITIAL_CLASS_BROADCASTS);

  // 3. User & Sensitive Collections (Only if authenticated)
  if (isAuth) {
    await checkAndSeed('students', getStoredStudents, INITIAL_STUDENTS);
    await checkAndSeed('teachers', getStoredTeachers, INITIAL_TEACHERS);
    await checkAndSeed('reports', getStoredReports, INITIAL_TERM_REPORTS);
    await checkAndSeed('transactions', getStoredPayments, INITIAL_PAYMENTS);
    await checkAndSeed('bills', getStoredBills, INITIAL_BILLS);
    await checkAndSeed('users', getStoredUsers, INITIAL_SYSTEM_USERS);
    await checkAndSeed('expenses', getStoredExpenses, INITIAL_EXPENSES);
    await checkAndSeed('bankDeposits', getStoredBankDeposits, INITIAL_BANK_DEPOSITS);
    await checkAndSeed('securityAuditLogs', getStoredSecurityAuditLogs, INITIAL_SECURITY_AUDIT_LOGS);
  }
}

// -------------------------------------------------------------
// Live Real-Time Subscriptions
// -------------------------------------------------------------
export function subscribeExpenses(callback: (expenses: SchoolExpenseRecord[]) => void) {
  if (!auth.currentUser) {
    callback(getStoredExpenses());
    return () => {};
  }
  return onSnapshot(collection(db, 'expenses'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolExpenseRecord));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredExpenses(items);
      callback(items);
    } else {
      callback(getStoredExpenses());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'expenses', false);
    }
    console.warn('Firestore expenses subscription fallback:', err);
    callback(getStoredExpenses());
  });
}

export function subscribeBankDeposits(callback: (deposits: BankDepositRecord[]) => void) {
  if (!auth.currentUser) {
    callback(getStoredBankDeposits());
    return () => {};
  }
  return onSnapshot(collection(db, 'bankDeposits'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as BankDepositRecord));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredBankDeposits(items);
      callback(items);
    } else {
      callback(getStoredBankDeposits());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'bankDeposits', false);
    }
    console.warn('Firestore bankDeposits subscription fallback:', err);
    callback(getStoredBankDeposits());
  });
}

export function subscribeSecurityAuditLogs(callback: (logs: SecurityAuditLog[]) => void) {
  if (!auth.currentUser) {
    callback(getStoredSecurityAuditLogs());
    return () => {};
  }
  return onSnapshot(collection(db, 'securityAuditLogs'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as SecurityAuditLog));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredSecurityAuditLogs(items);
      callback(items);
    } else {
      callback(getStoredSecurityAuditLogs());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'securityAuditLogs', false);
    }
    console.warn('Firestore securityAuditLogs subscription fallback:', err);
    callback(getStoredSecurityAuditLogs());
  });
}

export function subscribeUsers(callback: (users: UserAccountItem[]) => void) {
  if (!auth.currentUser) {
    callback(getStoredUsers());
    return () => {};
  }
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
      handleFirestoreError(err, OperationType.GET, 'users', false);
    }
    console.warn('Firestore users subscription fallback:', err);
    callback(getStoredUsers());
  });
}

export function subscribeStudents(callback: (students: Student[]) => void) {
  if (!auth.currentUser) {
    callback(getStoredStudents());
    return () => {};
  }
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
      handleFirestoreError(err, OperationType.GET, 'students', false);
    }
    console.warn('Firestore students subscription fallback:', err);
    callback(getStoredStudents());
  });
}

export function subscribeTeachers(callback: (teachers: Teacher[]) => void) {
  if (!auth.currentUser) {
    callback(getStoredTeachers());
    return () => {};
  }
  return onSnapshot(collection(db, 'teachers'), (snap) => {
    const rawItems = snap.docs.map(d => ({ id: d.id, ...d.data() } as Teacher));
    const items = rawItems.map(t => ({
      ...t,
      classesTaught: Array.isArray(t?.classesTaught) ? t.classesTaught : ['Basic 1'],
      subjectsTaught: Array.isArray(t?.subjectsTaught) ? t.subjectsTaught : ['Mathematics']
    }));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredTeachers(items);
      callback(items);
    } else {
      callback(getStoredTeachers());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'teachers', false);
    }
    console.warn('Firestore teachers subscription fallback:', err);
    callback(getStoredTeachers());
  });
}

export function subscribeTeacherAttendance(callback: (records: TeacherAttendanceRecord[]) => void) {
  if (!auth.currentUser) {
    callback(getStoredTeacherAttendance());
    return () => {};
  }
  return onSnapshot(collection(db, 'teacherAttendance'), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as TeacherAttendanceRecord));
    if (items.length > 0 || isDemoDataCleared()) {
      saveStoredTeacherAttendance(items);
      callback(items);
    } else {
      callback(getStoredTeacherAttendance());
    }
  }, (err) => {
    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, 'teacherAttendance', false);
    }
    console.warn('Firestore teacherAttendance subscription fallback:', err);
    callback(getStoredTeacherAttendance());
  });
}

export function subscribeReports(callback: (reports: TermReport[]) => void) {
  if (!auth.currentUser) {
    callback(getStoredReports());
    return () => {};
  }
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
      handleFirestoreError(err, OperationType.GET, 'reports', false);
    }
    console.warn('Firestore reports subscription fallback:', err);
    callback(getStoredReports());
  });
}

export function subscribePayments(callback: (payments: PaymentRecord[]) => void) {
  if (!auth.currentUser) {
    callback(getStoredPayments());
    return () => {};
  }
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
      handleFirestoreError(err, OperationType.GET, 'transactions', false);
    }
    console.warn('Firestore payments subscription fallback:', err);
    callback(getStoredPayments());
  });
}

export function subscribeBills(callback: (bills: StudentBill[]) => void) {
  if (!auth.currentUser) {
    callback(getStoredBills());
    return () => {};
  }
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
      handleFirestoreError(err, OperationType.GET, 'bills', false);
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
      handleFirestoreError(err, OperationType.GET, 'settings', false);
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
      handleFirestoreError(err, OperationType.GET, 'settings', false);
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
      handleFirestoreError(err, OperationType.GET, 'academicYears', false);
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
      handleFirestoreError(err, OperationType.GET, 'terms', false);
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
      handleFirestoreError(err, OperationType.GET, 'departments', false);
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
      handleFirestoreError(err, OperationType.GET, 'courses', false);
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
      handleFirestoreError(err, OperationType.GET, 'classes', false);
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
      handleFirestoreError(err, OperationType.GET, 'houses', false);
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
      handleFirestoreError(err, OperationType.GET, 'subjects', false);
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
      handleFirestoreError(err, OperationType.GET, 'events', false);
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
      handleFirestoreError(err, OperationType.GET, 'notifications', false);
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
      handleFirestoreError(err, OperationType.GET, 'classFeeTariffs', false);
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
      handleFirestoreError(err, OperationType.GET, 'classReportBroadcasts', false);
    }
    console.warn('Firestore classReportBroadcasts subscription fallback:', err);
    callback(getStoredClassBroadcasts());
  });
}

export async function saveClassBroadcast(broadcast: ClassReportBroadcast) {
  await executeCloudWrite(
    'classReportBroadcasts',
    broadcast.id,
    broadcast,
    () => {
      const current = getStoredClassBroadcasts();
      const idx = current.findIndex(b => b.id === broadcast.id || (b.className === broadcast.className && b.term === broadcast.term && b.academicYear === broadcast.academicYear));
      const updated = idx >= 0 ? current.map((b, i) => i === idx ? broadcast : b) : [broadcast, ...current];
      saveStoredClassBroadcasts(updated);
    },
    undefined,
    `Broadcast: ${broadcast.className} (${broadcast.term})`
  );
  return getStoredClassBroadcasts();
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
  await executeCloudDelete(
    'classReportBroadcasts',
    id,
    () => {
      const current = getStoredClassBroadcasts();
      const updated = current.filter(b => b.id !== id);
      saveStoredClassBroadcasts(updated);
    },
    `Broadcast #${id}`
  );
  return getStoredClassBroadcasts();
}

// -------------------------------------------------------------
// Database CRUD Operations (Authoritative Cloud-First Synchronization)
// -------------------------------------------------------------
export async function saveStudent(student: Student) {
  if (!student.fullName || !student.fullName.trim()) {
    throw new Error('Student validation failed: Full name is required.');
  }
  await ensureFirebaseAuthReady();
  return executeCloudWrite(
    'students',
    student.id,
    student,
    () => {
      const current = getStoredStudents();
      const idx = current.findIndex(s => s.id === student.id);
      const updated = idx >= 0 ? current.map(s => s.id === student.id ? student : s) : [student, ...current];
      saveStoredStudents(updated);
    },
    undefined,
    `Student: ${student.fullName}`
  );
}

export async function saveAllStudents(studentsList: Student[]) {
  const batch = writeBatch(db);
  studentsList.forEach(st => {
    batch.set(doc(db, 'students', st.id), sanitizeForFirestore(st));
  });
  await batch.commit();
  saveStoredStudents(studentsList);
}

export async function bulkPromoteStudents(
  studentIds: string[],
  targetClassName: string,
  targetAcademicYear: string
) {
  const students = getStoredStudents();
  
  const updatedStudents = students.map(st => {
    if (studentIds.includes(st.id)) {
      return { ...st, className: targetClassName, academicYear: targetAcademicYear };
    }
    return st;
  });

  const batch = writeBatch(db);
  studentIds.forEach(id => {
    batch.update(doc(db, 'students', id), {
      className: targetClassName,
      academicYear: targetAcademicYear
    });
  });
  await batch.commit();
  saveStoredStudents(updatedStudents);
}

export function generateUniqueAdmissionNo(existingStudents?: Student[]): string {
  const current = existingStudents || getStoredStudents();
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  let maxNumber = 0;
  const regex = new RegExp(`ADM/${yearSuffix}/(\\d+)`, 'i');
  
  current.forEach(st => {
    if (st.admissionNo && st.admissionNo !== 'PENDING-APPROVAL' && !st.admissionNo.includes('PENDING')) {
      const match = st.admissionNo.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  });

  const nextNumber = maxNumber + 1;
  return `ADM/${yearSuffix}/${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Atomically reserves the next available admission number across concurrent admin sessions
 * using a Firestore transaction counter.
 */
export async function getNextAtomicAdmissionNo(): Promise<string> {
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  const counterDocRef = doc(db, 'counters', `admission_${yearSuffix}`);

  if (auth.currentUser) {
    try {
      const nextSeq = await runTransaction(db, async (txn) => {
        const snap = await txn.get(counterDocRef);
        let currentSeq = 0;
        if (snap.exists() && typeof snap.data().currentSequence === 'number') {
          currentSeq = snap.data().currentSequence;
        } else {
          // Initialize from current highest
          const stored = getStoredStudents();
          const regex = new RegExp(`ADM/${yearSuffix}/(\\d+)`, 'i');
          stored.forEach(st => {
            if (st.admissionNo && !st.admissionNo.includes('PENDING')) {
              const match = st.admissionNo.match(regex);
              if (match && match[1]) {
                const num = parseInt(match[1], 10);
                if (!isNaN(num) && num > currentSeq) currentSeq = num;
              }
            }
          });
        }
        const newSeq = currentSeq + 1;
        txn.set(counterDocRef, {
          currentSequence: newSeq,
          year: yearSuffix,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        return newSeq;
      });

      return `ADM/${yearSuffix}/${String(nextSeq).padStart(4, '0')}`;
    } catch (e) {
      console.warn('[dbService] Atomic counter transaction notice, falling back to safe local generator:', e);
    }
  }

  return generateUniqueAdmissionNo();
}

export async function approveStudentAdmission(studentId: string, assignedAdmissionNo?: string) {
  const current = getStoredStudents();
  const student = current.find(s => s.id === studentId);
  if (!student) return;

  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  let validAdmNo = assignedAdmissionNo && assignedAdmissionNo !== 'PENDING-APPROVAL' 
    ? assignedAdmissionNo 
    : (student.admissionNo && student.admissionNo !== 'PENDING-APPROVAL' ? student.admissionNo : '');

  if (auth.currentUser && !validAdmNo) {
    const counterDocRef = doc(db, 'counters', `admission_${yearSuffix}`);
    const studentDocRef = doc(db, 'students', studentId);
    try {
      validAdmNo = await runTransaction(db, async (txn) => {
        const snap = await txn.get(counterDocRef);
        let currentSeq = 0;
        if (snap.exists() && typeof snap.data().currentSequence === 'number') {
          currentSeq = snap.data().currentSequence;
        } else {
          // Initialize from current highest
          const stored = getStoredStudents();
          const regex = new RegExp(`ADM/${yearSuffix}/(\\d+)`, 'i');
          stored.forEach(st => {
            if (st.admissionNo && !st.admissionNo.includes('PENDING')) {
              const match = st.admissionNo.match(regex);
              if (match && match[1]) {
                const num = parseInt(match[1], 10);
                if (!isNaN(num) && num > currentSeq) currentSeq = num;
              }
            }
          });
        }
        const newSeq = currentSeq + 1;
        const generatedAdmNo = `ADM/${yearSuffix}/${String(newSeq).padStart(4, '0')}`;

        txn.set(counterDocRef, {
          currentSequence: newSeq,
          year: yearSuffix,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        const updatedStudentData: Student = {
          ...student,
          admissionNo: generatedAdmNo,
          status: 'Active',
          isApproved: true,
          approvalStatus: 'Approved'
        };

        txn.set(studentDocRef, sanitizeForFirestore(updatedStudentData), { merge: true });
        return generatedAdmNo;
      });
    } catch (txnErr) {
      console.warn('[dbService] Atomic approval transaction notice:', txnErr);
    }
  }

  if (!validAdmNo) {
    validAdmNo = generateUniqueAdmissionNo(current);
  }

  const updatedStudent: Student = {
    ...student,
    admissionNo: validAdmNo,
    status: 'Active',
    isApproved: true,
    approvalStatus: 'Approved'
  };

  const updatedList = current.map(s => s.id === studentId ? updatedStudent : s);
  saveStoredStudents(updatedList);

  if (auth.currentUser) {
    await executeCloudWrite(
      'students',
      studentId,
      updatedStudent,
      () => {},
      undefined,
      `Approve Admission: ${updatedStudent.fullName} (${validAdmNo})`
    );
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

  await executeCloudWrite(
    'students',
    studentId,
    updatedStudent,
    () => {
      const updatedList = current.map(s => s.id === studentId ? updatedStudent : s);
      saveStoredStudents(updatedList);
    },
    undefined,
    `Reject Admission: ${updatedStudent.fullName}`
  );
  return updatedStudent;
}

export async function deleteStudent(studentId: string) {
  return executeCloudDelete(
    'students',
    studentId,
    () => {
      const current = getStoredStudents();
      const updated = current.filter(s => s.id !== studentId);
      saveStoredStudents(updated);
    },
    `Student #${studentId}`
  );
}

export async function saveTeacher(teacher: Teacher) {
  if (!teacher.name || !teacher.name.trim()) {
    throw new Error('Teacher validation failed: Name is required.');
  }
  return executeCloudWrite(
    'teachers',
    teacher.id,
    teacher,
    () => {
      const current = getStoredTeachers();
      const idx = current.findIndex(t => t.id === teacher.id);
      const updated = idx >= 0 ? current.map(t => t.id === teacher.id ? teacher : t) : [teacher, ...current];
      saveStoredTeachers(updated);
    },
    undefined,
    `Teacher: ${teacher.name}`
  );
}

export async function saveAllTeachers(teachersList: Teacher[]) {
  const batch = writeBatch(db);
  teachersList.forEach(t => {
    batch.set(doc(db, 'teachers', t.id), sanitizeForFirestore(t));
  });
  await batch.commit();
  saveStoredTeachers(teachersList);
}

export async function deleteTeacher(teacherId: string) {
  return executeCloudDelete(
    'teachers',
    teacherId,
    () => {
      const current = getStoredTeachers();
      const updated = current.filter(t => t.id !== teacherId);
      saveStoredTeachers(updated);
    },
    `Teacher #${teacherId}`
  );
}

export async function saveReport(report: TermReport) {
  return executeCloudWrite(
    'reports',
    report.id,
    report,
    () => {
      const current = getStoredReports();
      const idx = current.findIndex(r => r.id === report.id);
      const updated = idx >= 0 ? current.map(r => r.id === report.id ? report : r) : [report, ...current];
      saveStoredReports(updated);
    },
    undefined,
    `Report: ${report.studentName} (${report.term})`
  );
}

export async function saveAllReports(reportsList: TermReport[]) {
  const batch = writeBatch(db);
  reportsList.forEach(rep => {
    batch.set(doc(db, 'reports', rep.id), sanitizeForFirestore(rep));
  });
  await batch.commit();
  saveStoredReports(reportsList);
}

export async function deleteReport(reportId: string) {
  return executeCloudDelete(
    'reports',
    reportId,
    () => {
      const current = getStoredReports();
      const updated = current.filter(r => r.id !== reportId);
      saveStoredReports(updated);
    },
    `Report #${reportId}`
  );
}

export async function savePayment(payment: PaymentRecord) {
  if (!payment.id || !payment.amount || payment.amount <= 0) {
    throw new Error('Invalid payment record: ID and positive amount are required.');
  }

  const current = getStoredPayments();
  // Prevent duplicate payment records by receipt number or identical student+amount+timestamp window
  const duplicate = current.find(p => 
    p.id !== payment.id && (
      (p.receiptNo && payment.receiptNo && p.receiptNo.trim().toUpperCase() === payment.receiptNo.trim().toUpperCase()) ||
      (p.studentId === payment.studentId && p.amount === payment.amount && p.date === payment.date && p.method === payment.method && Math.abs(new Date((p as any).timestamp || p.date).getTime() - new Date((payment as any).timestamp || payment.date).getTime()) < 30000)
    )
  );

  if (duplicate) {
    console.warn(`[dbService] Duplicate payment rejected: Receipt #${payment.receiptNo || payment.id}`);
    throw new Error(`Duplicate payment record detected with receipt ${payment.receiptNo || payment.id}.`);
  }

  // Idempotency: Lock the receipt number in Firestore transaction if authenticated
  if (auth.currentUser && payment.receiptNo) {
    const cleanReceiptKey = payment.receiptNo.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
    const lockDocRef = doc(db, 'receipt_locks', cleanReceiptKey);
    const txDocRef = doc(db, 'transactions', payment.id);
    try {
      await runTransaction(db, async (txn) => {
        const lockSnap = await txn.get(lockDocRef);
        if (lockSnap.exists() && lockSnap.data().paymentId !== payment.id) {
          throw new Error(`Receipt number ${payment.receiptNo} has already been registered for another transaction.`);
        }
        txn.set(lockDocRef, {
          receiptNo: payment.receiptNo,
          paymentId: payment.id,
          studentId: payment.studentId,
          amount: payment.amount,
          createdAt: new Date().toISOString()
        }, { merge: true });
        txn.set(txDocRef, sanitizeForFirestore(payment), { merge: true });
      });
    } catch (txnErr) {
      if (txnErr instanceof Error && txnErr.message.includes('has already been registered')) {
        throw txnErr;
      }
      console.warn('[dbService] Payment receipt lock notice:', txnErr);
    }
  }

  return executeCloudWrite(
    'transactions',
    payment.id,
    payment,
    () => {
      const idx = current.findIndex(p => p.id === payment.id);
      const updated = idx >= 0 ? current.map(p => p.id === payment.id ? payment : p) : [payment, ...current];
      saveStoredPayments(updated);
    },
    undefined,
    `Payment: GHS ${payment.amount} - ${payment.studentName || payment.studentId} (Receipt: ${payment.receiptNo || payment.id})`
  );
}

export async function deletePayment(paymentId: string) {
  const current = getStoredPayments();
  const payment = current.find(p => p.id === paymentId);
  
  return executeCloudDelete(
    'transactions',
    paymentId,
    () => {
      const updated = current.filter(p => p.id !== paymentId);
      saveStoredPayments(updated);
    },
    payment ? `Payment #${payment.receiptNo || payment.id} - ${payment.studentName} (GHS ${payment.amount})` : `Payment #${paymentId}`
  );
}

export async function saveBill(bill: StudentBill) {
  return executeCloudWrite(
    'bills',
    bill.id,
    bill,
    () => {
      const current = getStoredBills();
      const idx = current.findIndex(b => b.id === bill.id);
      const updated = idx >= 0 ? current.map(b => b.id === bill.id ? bill : b) : [bill, ...current];
      saveStoredBills(updated);
    },
    undefined,
    `Bill: ${bill.studentName || bill.studentId} (#${bill.id})`
  );
}

export async function deleteBill(billId: string) {
  return executeCloudDelete(
    'bills',
    billId,
    () => {
      const current = getStoredBills();
      const updated = current.filter(b => b.id !== billId);
      saveStoredBills(updated);
    },
    `Bill #${billId}`
  );
}

export async function saveCalendarEvent(event: CalendarEvent) {
  return executeCloudWrite(
    'events',
    event.id,
    event,
    () => {
      const current = getStoredCalendarEvents();
      const idx = current.findIndex(e => e.id === event.id);
      const updated = idx >= 0 ? current.map(e => e.id === event.id ? event : e) : [event, ...current];
      saveStoredCalendarEvents(updated);
    },
    undefined,
    `Calendar Event: ${event.title}`
  );
}

export async function deleteCalendarEvent(eventId: string) {
  return executeCloudDelete(
    'events',
    eventId,
    () => {
      const current = getStoredCalendarEvents();
      const updated = current.filter(e => e.id !== eventId);
      saveStoredCalendarEvents(updated);
    },
    `Calendar Event #${eventId}`
  );
}

export async function saveNotification(notif: NotificationItem) {
  return executeCloudWrite(
    'notifications',
    notif.id,
    notif,
    () => {
      const current = getStoredNotifications();
      const idx = current.findIndex(n => n.id === notif.id);
      const updated = idx >= 0 ? current.map(n => n.id === notif.id ? notif : n) : [notif, ...current];
      saveStoredNotifications(updated);
    },
    undefined,
    `Notification: ${notif.title}`
  );
}

export async function deleteNotification(notifId: string) {
  return executeCloudDelete(
    'notifications',
    notifId,
    () => {
      const current = getStoredNotifications();
      const updated = current.filter(n => n.id !== notifId);
      saveStoredNotifications(updated);
    },
    `Notification #${notifId}`
  );
}

// -------------------------------------------------------------
// System Users & Accounts Management
// -------------------------------------------------------------
export { getStoredUsers, saveStoredUsers, INITIAL_SYSTEM_USERS };

export async function saveUserAccount(user: UserAccountItem) {
  return executeCloudWrite(
    'users',
    user.id,
    user,
    () => {
      const current = getStoredUsers();
      const idx = current.findIndex(u => u.id === user.id);
      const updated = idx >= 0 ? current.map(u => u.id === user.id ? user : u) : [user, ...current];
      saveStoredUsers(updated);
    },
    undefined,
    `User Account: ${user.name} (${user.role})`
  );
}

export async function saveAllUserAccounts(users: UserAccountItem[]) {
  const batch = writeBatch(db);
  users.forEach(u => {
    batch.set(doc(db, 'users', u.id), sanitizeForFirestore(u));
  });
  await batch.commit();
  saveStoredUsers(users);
}

export async function deleteUserAccount(userId: string) {
  return executeCloudDelete(
    'users',
    userId,
    () => {
      const current = getStoredUsers();
      const updated = current.filter(u => u.id !== userId);
      saveStoredUsers(updated);
    },
    `User Account #${userId}`
  );
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

export async function saveTeacherAttendanceRecord(record: TeacherAttendanceRecord) {
  return executeCloudWrite(
    'teacherAttendance',
    record.id,
    record,
    () => {
      const current = getStoredTeacherAttendance();
      const idx = current.findIndex(r => r.id === record.id || (r.teacherId === record.teacherId && r.date === record.date));
      let updated: TeacherAttendanceRecord[];
      if (idx >= 0) {
        updated = current.map((r, i) => i === idx ? { ...r, ...record } : r);
      } else {
        updated = [record, ...current];
      }
      saveStoredTeacherAttendance(updated);
    },
    undefined,
    `Attendance: ${record.teacherName} (${record.date})`
  );
}

export async function saveAllTeacherAttendanceRecords(records: TeacherAttendanceRecord[]) {
  const batch = writeBatch(db);
  records.forEach(r => {
    batch.set(doc(db, 'teacherAttendance', r.id), sanitizeForFirestore(r));
  });
  await batch.commit();
  saveStoredTeacherAttendance(records);
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
// Academic Setup CRUD Operations (Authoritative Cloud-First Synchronization)
// -------------------------------------------------------------
export async function saveAcademicYear(ay: AcademicYearItem | AcademicYear) {
  return executeCloudWrite(
    'academicYears',
    ay.id,
    ay,
    () => {
      const current = getStoredAcademicYears();
      const idx = current.findIndex(a => a.id === ay.id);
      const updated = idx >= 0 ? current.map(a => a.id === ay.id ? (ay as AcademicYearItem) : a) : [ay as AcademicYearItem, ...current];
      saveStoredAcademicYears(updated);
    },
    undefined,
    `Academic Year: ${ay.name}`
  );
}

export async function saveAllAcademicYears(years: AcademicYearItem[]) {
  const batch = writeBatch(db);
  years.forEach(ay => {
    batch.set(doc(db, 'academicYears', ay.id), sanitizeForFirestore(ay));
  });
  await batch.commit();
  saveStoredAcademicYears(years);
}

export async function deleteAcademicYear(ayId: string) {
  return executeCloudDelete(
    'academicYears',
    ayId,
    () => {
      const current = getStoredAcademicYears();
      const updated = current.filter(a => a.id !== ayId);
      saveStoredAcademicYears(updated);
    },
    `Academic Year #${ayId}`
  );
}

export async function saveTerm(term: TermItem | Term) {
  return executeCloudWrite(
    'terms',
    term.id,
    term,
    () => {
      const current = getStoredTerms();
      const idx = current.findIndex(t => t.id === term.id);
      const updated = idx >= 0 ? current.map(t => t.id === term.id ? (term as TermItem) : t) : [term as TermItem, ...current];
      saveStoredTerms(updated);
    },
    undefined,
    `Term: ${term.name}`
  );
}

export async function saveAllTerms(terms: TermItem[]) {
  const batch = writeBatch(db);
  terms.forEach(t => {
    batch.set(doc(db, 'terms', t.id), sanitizeForFirestore(t));
  });
  await batch.commit();
  saveStoredTerms(terms);
}

export async function deleteTerm(termId: string) {
  return executeCloudDelete(
    'terms',
    termId,
    () => {
      const current = getStoredTerms();
      const updated = current.filter(t => t.id !== termId);
      saveStoredTerms(updated);
    },
    `Term #${termId}`
  );
}

export async function saveDepartment(dept: DepartmentItem | Department) {
  return executeCloudWrite(
    'departments',
    dept.id,
    dept,
    () => {
      const current = getStoredDepartments();
      const idx = current.findIndex(d => d.id === dept.id);
      const updated = idx >= 0 ? current.map(d => d.id === dept.id ? (dept as DepartmentItem) : d) : [dept as DepartmentItem, ...current];
      saveStoredDepartments(updated);
    },
    undefined,
    `Department: ${dept.name}`
  );
}

export async function saveAllDepartments(depts: DepartmentItem[]) {
  const batch = writeBatch(db);
  depts.forEach(d => {
    batch.set(doc(db, 'departments', d.id), sanitizeForFirestore(d));
  });
  await batch.commit();
  saveStoredDepartments(depts);
}

export async function deleteDepartment(deptId: string) {
  return executeCloudDelete(
    'departments',
    deptId,
    () => {
      const current = getStoredDepartments();
      const updated = current.filter(d => d.id !== deptId);
      saveStoredDepartments(updated);
    },
    `Department #${deptId}`
  );
}

export async function saveCourse(crs: CourseItem) {
  return executeCloudWrite(
    'courses',
    crs.id,
    crs,
    () => {
      const current = getStoredCourses();
      const idx = current.findIndex(c => c.id === crs.id);
      const updated = idx >= 0 ? current.map(c => c.id === crs.id ? crs : c) : [crs, ...current];
      saveStoredCourses(updated);
    },
    undefined,
    `Course: ${crs.name}`
  );
}

export async function saveAllCourses(courses: CourseItem[]) {
  const batch = writeBatch(db);
  courses.forEach(c => {
    batch.set(doc(db, 'courses', c.id), sanitizeForFirestore(c));
  });
  await batch.commit();
  saveStoredCourses(courses);
}

export async function deleteCourse(courseId: string) {
  return executeCloudDelete(
    'courses',
    courseId,
    () => {
      const current = getStoredCourses();
      const updated = current.filter(c => c.id !== courseId);
      saveStoredCourses(updated);
    },
    `Course #${courseId}`
  );
}

export async function saveClass(cls: ClassItem | SchoolClass) {
  return executeCloudWrite(
    'classes',
    cls.id,
    cls,
    () => {
      const current = getStoredClasses();
      const idx = current.findIndex(c => c.id === cls.id);
      const updated = idx >= 0 ? current.map(c => c.id === cls.id ? (cls as ClassItem) : c) : [cls as ClassItem, ...current];
      saveStoredClasses(updated);
    },
    undefined,
    `Class: ${cls.name}`
  );
}

export async function saveAllClasses(classes: ClassItem[]) {
  const batch = writeBatch(db);
  classes.forEach(c => {
    batch.set(doc(db, 'classes', c.id), sanitizeForFirestore(c));
  });
  await batch.commit();
  saveStoredClasses(classes);
}

export async function deleteClass(classId: string) {
  return executeCloudDelete(
    'classes',
    classId,
    () => {
      const current = getStoredClasses();
      const updated = current.filter(c => c.id !== classId);
      saveStoredClasses(updated);
    },
    `Class #${classId}`
  );
}

export async function saveHouse(house: HouseItem | House) {
  return executeCloudWrite(
    'houses',
    house.id,
    house,
    () => {
      const current = getStoredHouses();
      const idx = current.findIndex(h => h.id === house.id);
      const updated = idx >= 0 ? current.map(h => h.id === house.id ? (house as HouseItem) : h) : [house as HouseItem, ...current];
      saveStoredHouses(updated);
    },
    undefined,
    `House: ${house.name}`
  );
}

export async function saveAllHouses(houses: HouseItem[]) {
  const batch = writeBatch(db);
  houses.forEach(h => {
    batch.set(doc(db, 'houses', h.id), sanitizeForFirestore(h));
  });
  await batch.commit();
  saveStoredHouses(houses);
}

export async function deleteHouse(houseId: string) {
  return executeCloudDelete(
    'houses',
    houseId,
    () => {
      const current = getStoredHouses();
      const updated = current.filter(h => h.id !== houseId);
      saveStoredHouses(updated);
    },
    `House #${houseId}`
  );
}

export async function saveSubject(subject: SubjectItem | Subject) {
  return executeCloudWrite(
    'subjects',
    subject.id,
    subject,
    () => {
      const current = getStoredSubjects();
      const idx = current.findIndex(s => s.id === subject.id);
      const updated = idx >= 0 ? current.map(s => s.id === subject.id ? (subject as SubjectItem) : s) : [subject as SubjectItem, ...current];
      saveStoredSubjects(updated);
    },
    undefined,
    `Subject: ${subject.name}`
  );
}

export async function saveAllSubjects(subjects: SubjectItem[]) {
  const batch = writeBatch(db);
  subjects.forEach(s => {
    batch.set(doc(db, 'subjects', s.id), sanitizeForFirestore(s));
  });
  await batch.commit();
  saveStoredSubjects(subjects);
}

export async function deleteSubject(subjectId: string) {
  return executeCloudDelete(
    'subjects',
    subjectId,
    () => {
      const current = getStoredSubjects();
      const updated = current.filter(s => s.id !== subjectId);
      saveStoredSubjects(updated);
    },
    `Subject #${subjectId}`
  );
}

// -------------------------------------------------------------
// School Expenses, Bank Deposits & Audit Logs Cloud Operations
// -------------------------------------------------------------
export async function saveExpense(expense: SchoolExpenseRecord) {
  if (!expense.title || expense.amount <= 0) {
    throw new Error('Expense validation failed: Title and positive amount are required.');
  }
  return executeCloudWrite(
    'expenses',
    expense.id,
    expense,
    () => {
      const current = getStoredExpenses();
      const idx = current.findIndex(e => e.id === expense.id);
      const updated = idx >= 0 ? current.map(e => e.id === expense.id ? expense : e) : [expense, ...current];
      saveStoredExpenses(updated);
    },
    undefined,
    `Expense: GHS ${expense.amount} - ${expense.title}`
  );
}

export async function deleteExpense(expenseId: string) {
  return executeCloudDelete(
    'expenses',
    expenseId,
    () => {
      const current = getStoredExpenses();
      const updated = current.filter(e => e.id !== expenseId);
      saveStoredExpenses(updated);
    },
    `Expense #${expenseId}`
  );
}

export async function saveBankDeposit(deposit: BankDepositRecord) {
  if (!deposit.bankName || deposit.amount <= 0) {
    throw new Error('Bank deposit validation failed: Bank name and positive amount are required.');
  }
  return executeCloudWrite(
    'bankDeposits',
    deposit.id,
    deposit,
    () => {
      const current = getStoredBankDeposits();
      const idx = current.findIndex(d => d.id === deposit.id);
      const updated = idx >= 0 ? current.map(d => d.id === deposit.id ? deposit : d) : [deposit, ...current];
      saveStoredBankDeposits(updated);
    },
    undefined,
    `Bank Deposit: GHS ${deposit.amount} (${deposit.bankName})`
  );
}

export async function deleteBankDeposit(depositId: string) {
  return executeCloudDelete(
    'bankDeposits',
    depositId,
    () => {
      const current = getStoredBankDeposits();
      const updated = current.filter(d => d.id !== depositId);
      saveStoredBankDeposits(updated);
    },
    `Bank Deposit #${depositId}`
  );
}

export async function recordSecurityAuditLogInFirestore(
  log: Omit<SecurityAuditLog, 'id' | 'timestamp'>
): Promise<SecurityAuditLog> {
  const newEntry: SecurityAuditLog = {
    ...log,
    id: `SEC-LOG-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };
  await executeCloudWrite(
    'securityAuditLogs',
    newEntry.id,
    newEntry,
    () => {
      const current = getStoredSecurityAuditLogs();
      saveStoredSecurityAuditLogs([newEntry, ...current]);
    },
    undefined,
    `Security Audit: ${newEntry.actionType}`
  );
  return newEntry;
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

export async function ensureFirebaseAuthReady(): Promise<FirebaseUser> {
  if (auth.currentUser && !auth.currentUser.isAnonymous) {
    return auth.currentUser;
  }
  return new Promise((resolve, reject) => {
    let resolved = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous && !resolved) {
        resolved = true;
        unsubscribe();
        resolve(user);
      }
    });
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        if (auth.currentUser && !auth.currentUser.isAnonymous) {
          resolve(auth.currentUser);
        } else {
          reject(new Error('Authentication session is initializing or unavailable. Please re-authenticate.'));
        }
      }
    }, 10000);
  });
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
        handleFirestoreError(err, OperationType.GET, 'systemSettings', false);
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
        handleFirestoreError(err, OperationType.GET, 'feeSubmissions', false);
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
  await executeCloudWrite(
    'feeSubmissions',
    submission.id,
    submission,
    () => {
      const current = getStoredFeeSubmissions();
      const updated = [submission, ...current.filter(s => s.id !== submission.id)];
      saveStoredFeeSubmissions(updated);
    },
    undefined,
    `Fee Submission: ${submission.studentName} (GHS ${submission.amount})`
  );
}

export async function updateFeeSubmissionStatus(
  submissionId: string, 
  status: 'Approved' | 'Rejected', 
  verifierName: string, 
  receiptNo?: string, 
  rejectionReason?: string
): Promise<FeeSubmissionItem | null> {
  const current = getStoredFeeSubmissions();
  const sub = current.find(s => s.id === submissionId);
  if (!sub) return null;

  const updatedItem: FeeSubmissionItem = {
    ...sub,
    status,
    verifiedBy: verifierName,
    verifiedAt: new Date().toISOString().split('T')[0],
    receiptNo,
    rejectionReason
  };

  await executeCloudWrite(
    'feeSubmissions',
    submissionId,
    updatedItem,
    () => {
      const updatedList = current.map(s => s.id === submissionId ? updatedItem : s);
      saveStoredFeeSubmissions(updatedList);
    },
    undefined,
    `Fee Submission #${submissionId} status: ${status}`
  );

  return updatedItem;
}

