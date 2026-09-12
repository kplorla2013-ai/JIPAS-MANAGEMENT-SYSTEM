import { 
  Student, 
  Teacher, 
  TermReport, 
  PaymentRecord, 
  StudentBill, 
  CalendarEvent, 
  NotificationItem, 
  AcademicYearItem, 
  TermItem, 
  DepartmentItem, 
  ClassItem, 
  HouseItem, 
  SubjectItem,
  UserAccountItem,
  PaymentSettingsConfig,
  PaymentMethodConfig,
  FeeSubmissionItem,
  ClassFeeTariffItem,
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

// Storage keys
export const STORAGE_KEYS = {
  STUDENTS: 'jipas_students_records',
  TEACHERS: 'jipas_teachers_records',
  USERS: 'jipas_system_users_records',
  ACADEMIC_YEARS: 'jipas_academic_years',
  TERMS: 'jipas_terms',
  DEPARTMENTS: 'jipas_departments',
  COURSES: 'jipas_courses',
  CLASSES: 'jipas_classes',
  HOUSES: 'jipas_houses',
  SUBJECTS: 'jipas_subjects',
  BILLS: 'jipas_bills_records',
  PAYMENTS: 'jipas_payments_records',
  REPORTS: 'jipas_reports_records',
  CALENDAR_EVENTS: 'jipas_calendar_events',
  NOTIFICATIONS: 'jipas_notifications_records',
  STAFF_SECRET_CODE: 'jipas_staff_secret_code',
  STAFF_SECRET_CODES: 'jipas_staff_secret_codes_list',
  PAYMENT_SETTINGS: 'jipas_payment_settings_config',
  FEE_SUBMISSIONS: 'jipas_fee_submissions_queue',
  CLASS_FEE_TARIFFS: 'jipas_class_fee_tariffs_matrix',
  CLASS_BROADCASTS: 'jipas_class_report_broadcasts',
  DEMO_CLEARED: 'jipas_demo_data_cleared',
  THEME_PALETTE: 'jipas_global_theme_palette'
} as const;

export interface StaffSecretCodeRecord {
  id: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
  usedBy?: string;
  createdBy: string;
}

export const DEFAULT_STAFF_SECRET_CODE = 'JIPAS-STAFF-2026';

export const INITIAL_STAFF_SECRET_CODES: StaffSecretCodeRecord[] = [
  {
    id: 'ssc-init-1',
    code: DEFAULT_STAFF_SECRET_CODE,
    createdAt: Date.now(),
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year valid for default
    used: false,
    createdBy: 'System Admin'
  }
];

export const INITIAL_SYSTEM_USERS: UserAccountItem[] = [
  {
    id: 'usr-admin-1',
    name: 'JAKRei (Administrator)',
    email: 'rei311213@gmail.com',
    username: 'rei311213',
    role: 'admin',
    phone: '0249755593',
    status: 'Active',
    lastLogin: 'Active Now',
    createdAt: '2026-01-10',
    isApproved: true,
    registrationType: 'admin'
  },
  {
    id: 'usr-acc-1',
    name: 'Frank Mensah (Accountant)',
    email: 'accountant@jipas.edu.gh',
    username: 'accountant',
    role: 'accountant',
    phone: '0592409087',
    status: 'Active',
    lastLogin: 'Today 08:30',
    createdAt: '2026-01-15',
    isApproved: true,
    registrationType: 'faculty',
    department: 'Accounts & Finance'
  },
  {
    id: 'usr-teach-1',
    name: 'Ebenezer Frimpong',
    email: 'teacher@jipas.edu.gh',
    username: 'teacher',
    role: 'teacher',
    phone: '0244112233',
    status: 'Active',
    lastLogin: 'Today 09:15',
    createdAt: '2026-01-15',
    isApproved: true,
    registrationType: 'faculty',
    department: 'Primary School'
  }
];

// Safe localStorage JSON reader
function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return parsed ?? fallback;
  } catch (err) {
    console.warn(`[StorageService] Failed to parse key "${key}":`, err);
    return fallback;
  }
}

// Safe localStorage JSON writer
function writeStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[StorageService] Failed to write key "${key}":`, err);
  }
}

// -------------------------------------------------------------
// Entity Getters (Synchronous for instantaneous UI rendering)
// -------------------------------------------------------------
export function getStoredStudents(): Student[] {
  return readStorage<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
}

export function getStoredTeachers(): Teacher[] {
  return readStorage<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
}

export function getStoredAcademicYears(): AcademicYearItem[] {
  return readStorage<AcademicYearItem[]>(STORAGE_KEYS.ACADEMIC_YEARS, INITIAL_ACADEMIC_YEARS);
}

export function getStoredTerms(): TermItem[] {
  return readStorage<TermItem[]>(STORAGE_KEYS.TERMS, INITIAL_TERMS);
}

export function getStoredDepartments(): DepartmentItem[] {
  return readStorage<DepartmentItem[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
}

export function getStoredCourses(): CourseItem[] {
  return readStorage<CourseItem[]>(STORAGE_KEYS.COURSES, INITIAL_SHS_COURSES);
}

export function getStoredClasses(): ClassItem[] {
  return readStorage<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
}

export function getStoredHouses(): HouseItem[] {
  return readStorage<HouseItem[]>(STORAGE_KEYS.HOUSES, INITIAL_HOUSES);
}

export function getStoredSubjects(): SubjectItem[] {
  return readStorage<SubjectItem[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
}

export function getStoredBills(): StudentBill[] {
  return readStorage<StudentBill[]>(STORAGE_KEYS.BILLS, INITIAL_BILLS);
}

export function getStoredPayments(): PaymentRecord[] {
  return readStorage<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
}

export function getStoredReports(): TermReport[] {
  return readStorage<TermReport[]>(STORAGE_KEYS.REPORTS, INITIAL_TERM_REPORTS);
}

export function getStoredCalendarEvents(): CalendarEvent[] {
  return readStorage<CalendarEvent[]>(STORAGE_KEYS.CALENDAR_EVENTS, INITIAL_CALENDAR_EVENTS);
}

export function getStoredNotifications(): NotificationItem[] {
  return readStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
}

export function getStoredUsers(): UserAccountItem[] {
  return readStorage<UserAccountItem[]>(STORAGE_KEYS.USERS, INITIAL_SYSTEM_USERS);
}

// -------------------------------------------------------------
// Entity Setters (Updates localStorage immediately)
// -------------------------------------------------------------
export function saveStoredStudents(students: Student[]): void {
  writeStorage(STORAGE_KEYS.STUDENTS, students);
}

export function saveStoredTeachers(teachers: Teacher[]): void {
  writeStorage(STORAGE_KEYS.TEACHERS, teachers);
}

export function saveStoredUsers(users: UserAccountItem[]): void {
  writeStorage(STORAGE_KEYS.USERS, users);
}

export function saveStoredAcademicYears(years: AcademicYearItem[]): void {
  writeStorage(STORAGE_KEYS.ACADEMIC_YEARS, years);
}

export function saveStoredTerms(terms: TermItem[]): void {
  writeStorage(STORAGE_KEYS.TERMS, terms);
}

export function saveStoredDepartments(departments: DepartmentItem[]): void {
  writeStorage(STORAGE_KEYS.DEPARTMENTS, departments);
}

export function saveStoredCourses(courses: CourseItem[]): void {
  writeStorage(STORAGE_KEYS.COURSES, courses);
}

export function saveStoredClasses(classes: ClassItem[]): void {
  writeStorage(STORAGE_KEYS.CLASSES, classes);
}

export function saveStoredHouses(houses: HouseItem[]): void {
  writeStorage(STORAGE_KEYS.HOUSES, houses);
}

export function saveStoredSubjects(subjects: SubjectItem[]): void {
  writeStorage(STORAGE_KEYS.SUBJECTS, subjects);
}

export function saveStoredBills(bills: StudentBill[]): void {
  writeStorage(STORAGE_KEYS.BILLS, bills);
}

export function saveStoredPayments(payments: PaymentRecord[]): void {
  writeStorage(STORAGE_KEYS.PAYMENTS, payments);
}

export function saveStoredReports(reports: TermReport[]): void {
  writeStorage(STORAGE_KEYS.REPORTS, reports);
}

export function saveStoredCalendarEvents(events: CalendarEvent[]): void {
  writeStorage(STORAGE_KEYS.CALENDAR_EVENTS, events);
}

export function saveStoredNotifications(notifications: NotificationItem[]): void {
  writeStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
}

export function isDemoDataCleared(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.DEMO_CLEARED) === 'true';
}

export function getStoredStaffSecretCodes(): StaffSecretCodeRecord[] {
  return readStorage<StaffSecretCodeRecord[]>(STORAGE_KEYS.STAFF_SECRET_CODES, INITIAL_STAFF_SECRET_CODES);
}

export function saveStoredStaffSecretCodes(codes: StaffSecretCodeRecord[]): void {
  writeStorage(STORAGE_KEYS.STAFF_SECRET_CODES, codes);
}

export function getStoredStaffSecretCode(): string {
  return readStorage<string>(STORAGE_KEYS.STAFF_SECRET_CODE, DEFAULT_STAFF_SECRET_CODE);
}

export function saveStoredStaffSecretCode(code: string): void {
  writeStorage(STORAGE_KEYS.STAFF_SECRET_CODE, code);
}

export const INITIAL_PAYMENT_SETTINGS: PaymentSettingsConfig = {
  generalInstructions: 'Please make school fee payments strictly through the official approved payment channels listed below. After making payment, submit your Transaction ID/Reference Number on this portal for immediate verification by the Admin and Accountant.',
  allowPortalSubmission: true,
  requireProofReference: true,
  supportPhone: '0249755593',
  supportEmail: 'accounts@jipas.edu.gh',
  methods: [
    {
      id: 'pm-1',
      type: 'bank',
      name: 'GCB Bank Official Account',
      enabled: true,
      isPrimary: true,
      bankOrProviderName: 'GCB Bank Ghana',
      accountName: 'JIPAS Educational Complex',
      accountNumber: '10211839001',
      branchOrSortCode: 'Accra Central Branch',
      instructions: 'Pay at any GCB Bank branch or via GCB Mobile App. Enter Student Admission No as Deposit / Payment Reference.'
    },
    {
      id: 'pm-2',
      type: 'momo',
      name: 'MTN Mobile Money (MoMo Pay)',
      enabled: true,
      isPrimary: true,
      bankOrProviderName: 'MTN Ghana',
      accountName: 'JIPAS School Fees Collector',
      accountNumber: '0249755593',
      instructions: 'Send money or MoMo Pay to 0249755593 (Merchant: JIPAS). Enter Student Name & Admission No as Reference and save your MoMo Transaction ID.'
    },
    {
      id: 'pm-3',
      type: 'momo',
      name: 'Telecel Cash / AT Money',
      enabled: true,
      bankOrProviderName: 'Telecel Ghana',
      accountName: 'JIPAS School Accounts',
      accountNumber: '0201122334',
      instructions: 'Transfer to 0201122334. Note down the Transaction ID provided in your SMS receipt.'
    },
    {
      id: 'pm-4',
      type: 'cash',
      name: 'School Cashier Desk (Bursar Office)',
      enabled: true,
      accountName: 'JIPAS Bursar Office',
      accountNumber: 'Cash / Bank Cheque Deposit',
      instructions: 'Walk in to the School Accounts Office during working hours (8:00 AM - 4:00 PM Monday-Friday) for direct cash payment and printed paper receipt.'
    }
  ]
};

export const INITIAL_FEE_SUBMISSIONS: FeeSubmissionItem[] = [
  {
    id: 'sub-101',
    studentId: 'st-001',
    studentName: 'Kofi Mensah',
    admissionNo: 'ADM/26/0001',
    className: 'Basic 1',
    amount: 350,
    feeType: 'Tuition Fee (Full Term Payment)',
    paymentMethod: 'MTN Mobile Money (MoMo Pay)',
    transactionId: 'MOM-8842109',
    datePaid: '2026-09-06',
    submissionDate: '2026-09-06 10:15 AM',
    status: 'Pending Verification',
    notes: 'Paid via mother\'s MTN MoMo account.'
  }
];

export function getStoredPaymentSettings(): PaymentSettingsConfig {
  return readStorage<PaymentSettingsConfig>(STORAGE_KEYS.PAYMENT_SETTINGS, INITIAL_PAYMENT_SETTINGS);
}

export function saveStoredPaymentSettings(settings: PaymentSettingsConfig): void {
  writeStorage(STORAGE_KEYS.PAYMENT_SETTINGS, settings);
}

export function getStoredFeeSubmissions(): FeeSubmissionItem[] {
  return readStorage<FeeSubmissionItem[]>(STORAGE_KEYS.FEE_SUBMISSIONS, INITIAL_FEE_SUBMISSIONS);
}

export function saveStoredFeeSubmissions(submissions: FeeSubmissionItem[]): void {
  writeStorage(STORAGE_KEYS.FEE_SUBMISSIONS, submissions);
}

export const INITIAL_CLASS_FEE_TARIFFS: ClassFeeTariffItem[] = [
  { id: 'tariff-1', classTitle: 'Creche / Nursery', dept: 'Pre School', baseTuition: 300, ptaDues: 50, ictFee: 40, examFee: 35, healthLevy: 20, busTransit: 200, notes: 'Includes early childhood learning kits and afternoon rest care.' },
  { id: 'tariff-2', classTitle: 'Basic 1', dept: 'Primary School', baseTuition: 350, ptaDues: 50, ictFee: 40, examFee: 35, healthLevy: 20, busTransit: 200, notes: 'Standard primary education curriculum with computer lab access.' },
  { id: 'tariff-3', classTitle: 'Basic 2', dept: 'Primary School', baseTuition: 350, ptaDues: 50, ictFee: 40, examFee: 35, healthLevy: 20, busTransit: 200, notes: 'Standard primary education curriculum.' },
  { id: 'tariff-4', classTitle: 'Basic 3 - 6', dept: 'Primary School', baseTuition: 350, ptaDues: 50, ictFee: 40, examFee: 35, healthLevy: 20, busTransit: 200, notes: 'Upper primary curriculum including science practicals.' },
  { id: 'tariff-5', classTitle: 'JHS 1A', dept: 'Junior High School', baseTuition: 450, ptaDues: 50, ictFee: 40, examFee: 35, healthLevy: 20, busTransit: 200, notes: 'JHS entry level with STEM and mock assessment prep.' },
  { id: 'tariff-6', classTitle: 'JHS 2 & 3', dept: 'Junior High School', baseTuition: 450, ptaDues: 50, ictFee: 40, examFee: 35, healthLevy: 20, busTransit: 200, notes: 'BECE candidate preparation and intensive weekend mock exams.' }
];

export function getStoredClassFeeTariffs(): ClassFeeTariffItem[] {
  return readStorage<ClassFeeTariffItem[]>(STORAGE_KEYS.CLASS_FEE_TARIFFS, INITIAL_CLASS_FEE_TARIFFS);
}

export function saveStoredClassFeeTariffs(tariffs: ClassFeeTariffItem[]): void {
  writeStorage(STORAGE_KEYS.CLASS_FEE_TARIFFS, tariffs);
}

export const INITIAL_CLASS_BROADCASTS: ClassReportBroadcast[] = [
  {
    id: 'broadcast-basic-1',
    className: 'Basic 1',
    academicYear: '2025-2026',
    term: 'Third Term',
    isBroadcasted: true,
    broadcastedAt: '2026-09-08 14:30',
    broadcastedBy: 'Headmaster / Admin',
    status: 'Published',
    releaseNotes: 'Official Third Term terminal examination reports released. All continuous assessment scores finalized.',
    nextTermBegins: '2026-10-12',
    vacationDate: '2026-09-18',
    totalStudentsCount: 28,
    classAverage: 82.4,
    allowDownload: true
  },
  {
    id: 'broadcast-basic-2',
    className: 'Basic 2',
    academicYear: '2025-2026',
    term: 'Third Term',
    isBroadcasted: false,
    status: 'Draft',
    releaseNotes: 'Pending final review of teacher remarks and composite scores.',
    nextTermBegins: '2026-10-12',
    vacationDate: '2026-09-18',
    totalStudentsCount: 25,
    classAverage: 79.1,
    allowDownload: false
  },
  {
    id: 'broadcast-basic-3',
    className: 'Basic 3',
    academicYear: '2025-2026',
    term: 'Third Term',
    isBroadcasted: false,
    status: 'Draft',
    releaseNotes: 'Awaiting submission of religious & moral education scores.',
    nextTermBegins: '2026-10-12',
    vacationDate: '2026-09-18',
    totalStudentsCount: 24,
    classAverage: 76.5,
    allowDownload: false
  },
  {
    id: 'broadcast-jhs-1a',
    className: 'JHS 1A',
    academicYear: '2025-2026',
    term: 'Third Term',
    isBroadcasted: true,
    broadcastedAt: '2026-09-09 10:00',
    broadcastedBy: 'Academic Board',
    status: 'Published',
    releaseNotes: 'JHS 1A Terminal results and Stanine 9-point scale calculations published for portal access.',
    nextTermBegins: '2026-10-12',
    vacationDate: '2026-09-18',
    totalStudentsCount: 32,
    classAverage: 78.6,
    allowDownload: true
  }
];

export function getStoredClassBroadcasts(): ClassReportBroadcast[] {
  return readStorage<ClassReportBroadcast[]>(STORAGE_KEYS.CLASS_BROADCASTS, INITIAL_CLASS_BROADCASTS);
}

export function saveStoredClassBroadcasts(broadcasts: ClassReportBroadcast[]): void {
  writeStorage(STORAGE_KEYS.CLASS_BROADCASTS, broadcasts);
}

export function setDemoDataCleared(cleared: boolean): void {
  if (typeof window === 'undefined') return;
  if (cleared) {
    localStorage.setItem(STORAGE_KEYS.DEMO_CLEARED, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.DEMO_CLEARED);
  }
}

export const DEFAULT_THEME_PALETTES: ThemePaletteConfig[] = [
  {
    id: 'default',
    name: 'JIPAS Royal Blue (Default)',
    primaryColor: '#2563eb',
    primaryHoverColor: '#1d4ed8',
    primaryLightColor: '#eff6ff',
    backgroundColor: '#040814',
    cardBackgroundColor: '#0B142A',
    sidebarBgColor: '#070D1E',
    headerBgColor: '#070D1E',
    textColor: '#f8fafc',
    accentColor: '#38bdf8',
    mode: 'dark'
  },
  {
    id: 'emerald-academy',
    name: 'Emerald Academy',
    primaryColor: '#059669',
    primaryHoverColor: '#047857',
    primaryLightColor: '#ecfdf5',
    backgroundColor: '#051b14',
    cardBackgroundColor: '#0b2e23',
    sidebarBgColor: '#051b14',
    headerBgColor: '#0b2e23',
    textColor: '#f0fdf4',
    accentColor: '#10b981',
    mode: 'dark'
  },
  {
    id: 'ghana-gold',
    name: 'Ghana Gold & Amber',
    primaryColor: '#d97706',
    primaryHoverColor: '#b45309',
    primaryLightColor: '#fffbeb',
    backgroundColor: '#181106',
    cardBackgroundColor: '#2a1d0b',
    sidebarBgColor: '#181106',
    headerBgColor: '#2a1d0b',
    textColor: '#fefce8',
    accentColor: '#f59e0b',
    mode: 'dark'
  },
  {
    id: 'clean-slate-light',
    name: 'Clean Slate Light',
    primaryColor: '#4f46e5',
    primaryHoverColor: '#4338ca',
    primaryLightColor: '#eef2ff',
    backgroundColor: '#f8fafc',
    cardBackgroundColor: '#ffffff',
    sidebarBgColor: '#0f172a',
    headerBgColor: '#1e293b',
    textColor: '#0f172a',
    accentColor: '#10b981',
    mode: 'light'
  },
  {
    id: 'warm-ivory-light',
    name: 'Warm Ivory Light',
    primaryColor: '#0284c7',
    primaryHoverColor: '#0369a1',
    primaryLightColor: '#f0f9ff',
    backgroundColor: '#faf8f5',
    cardBackgroundColor: '#ffffff',
    sidebarBgColor: '#1c1917',
    headerBgColor: '#292524',
    textColor: '#1c1917',
    accentColor: '#f59e0b',
    mode: 'light'
  },
  {
    id: 'crimson-prestige',
    name: 'Crimson Prestige',
    primaryColor: '#dc2626',
    primaryHoverColor: '#b91c1c',
    primaryLightColor: '#fef2f2',
    backgroundColor: '#170609',
    cardBackgroundColor: '#2a0c12',
    sidebarBgColor: '#170609',
    headerBgColor: '#2a0c12',
    textColor: '#fff1f2',
    accentColor: '#f43f5e',
    mode: 'dark'
  },
  {
    id: 'midnight-charcoal',
    name: 'Midnight Charcoal',
    primaryColor: '#8b5cf6',
    primaryHoverColor: '#7c3aed',
    primaryLightColor: '#f5f3ff',
    backgroundColor: '#121216',
    cardBackgroundColor: '#1a1a22',
    sidebarBgColor: '#121216',
    headerBgColor: '#1a1a22',
    textColor: '#f5f3ff',
    accentColor: '#a78bfa',
    mode: 'dark'
  }
];

export const DEFAULT_THEME_PALETTE: ThemePaletteConfig = DEFAULT_THEME_PALETTES[0];

export function getStoredThemePalette(): ThemePaletteConfig {
  return readStorage<ThemePaletteConfig>(STORAGE_KEYS.THEME_PALETTE, DEFAULT_THEME_PALETTE);
}

export function saveStoredThemePalette(palette: ThemePaletteConfig): void {
  writeStorage(STORAGE_KEYS.THEME_PALETTE, palette);
}

export type { ThemePaletteConfig };

export function applyThemePaletteToDom(palette: ThemePaletteConfig): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  root.style.setProperty('--color-primary', palette.primaryColor);
  root.style.setProperty('--color-primary-hover', palette.primaryHoverColor || palette.primaryColor);
  root.style.setProperty('--color-primary-light', palette.primaryLightColor || '#eff6ff');
  root.style.setProperty('--color-app-bg', palette.backgroundColor);
  root.style.setProperty('--color-card-bg', palette.cardBackgroundColor);
  root.style.setProperty('--color-text-main', palette.textColor);

  if (body) {
    body.style.backgroundColor = palette.backgroundColor;
  }
}
