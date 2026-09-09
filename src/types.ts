export type UserRole = 'admin' | 'sub_admin' | 'teacher' | 'accountant' | 'student' | 'clerk';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  classAssigned?: string;
  admissionNo?: string;
  avatar?: string;
  allowedModules?: string[];
  privilege?: 'all' | 'read' | 'write';
}

export interface Student {
  id: string;
  admissionNo: string;
  fullName: string;
  gender: 'Male' | 'Female';
  dob: string;
  department: string;
  className: string;
  rollNo: string;
  house: string;
  parentPhone: string;
  parentName: string;
  academicYear: string;
  term: string;
  status: 'Active' | 'Inactive' | 'Pending';
  isCurrent: boolean;
  enrollmentDate: string;
  photo?: string;
  isApproved?: boolean;
  approvalStatus?: 'Approved' | 'Pending' | 'Rejected';
  enrolledBy?: string;
  submissionDate?: string;
  rejectionReason?: string;
}

export interface Teacher {
  id: string;
  staffId?: string;
  name: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female';
  academicQualification: string;
  professionalQualification: string;
  designation: string;
  rank: string;
  department?: string;
  ntcLicenseNo?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  dateJoined?: string;
  photo?: string;
  classesTaught: string[];
  subjectsTaught: string[];
}

export interface ScoreItem {
  subject: string;
  classWork?: number;     // Continuous Assessment (Class Work / Task)
  homework?: number;      // Continuous Assessment (Homework / Assignment)
  projectTest?: number;   // Continuous Assessment (Project / Class Test)
  classScore: number;     // Total Continuous Assessment (SBA, e.g. out of 40% or 50%)
  examScore: number;      // Terminal Examination Score (e.g. out of 60% or 50%)
  total: number;          // Total Composite Score (100%)
  grade: string;          // GES Grade (1 - 9)
  position?: string;      // Subject Position
  remark: string;         // Descriptive remark
}

export interface TermReport {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  academicYear: string;
  term: string;
  attendancePresent: number;
  attendanceTotal: number;
  conduct: string;
  attitude: string;
  interest: string;
  teacherComment: string;
  headmasterComment: string;
  scores: ScoreItem[];
  totalScore: number;
  averageScore: number;
  position: string;
}

export interface FeeItem {
  id: string;
  name: string;
  amount: number;
  department: string;
}

export interface FeeOptionItem {
  id: string;
  name: string;
  category: 'Tuition' | 'PTA' | 'ICT' | 'Exams' | 'Maintenance' | 'Transport' | 'Uniform' | 'Health' | 'Feeding' | 'Administrative' | 'Other' | string;
  amount: number;
  applicableClass: string;
  description?: string;
  frequency?: 'Termly' | 'Annually' | 'Monthly' | 'One-Time' | 'Per-Term';
  mandatory: boolean;
  isActive?: boolean;
  code?: string;
}

export interface FeePolicySettings {
  currencySymbol: string;
  defaultPaymentTerm: string;
  allowPartPayments: boolean;
  minDepositPercentage: number;
  lateFeePenaltyPercent: number;
  siblingDiscountPercent: number;
  scholarshipGrantActive: boolean;
  receiptHeaderNote: string;
  receiptFooterNote: string;
}

export interface StudentBill {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  academicYear: string;
  term: string;
  items: { name: string; amount: number }[];
  subTotal: number;
  arrears: number;
  discount: number;
  payable: number;
  paid: number;
  balance: number;
  status: 'Fully Paid' | 'Partially Paid' | 'Unpaid' | 'Overpaid';
  dueDate?: string;
  actionRequired?: boolean;
  actionRequiredReason?: string;
  actionRequiredDate?: string;
  actionSeverity?: 'Critical' | 'Moderate' | 'Warning';
  actionStatus?: 'Pending Follow-up' | 'Contacted' | 'Promised' | 'Resolved';
  lastContactDate?: string;
  promisedDate?: string;
  followUpNotes?: string;
}

export interface DailyFeeAuditSummary {
  lastRunDate: string;
  lastRunTimestamp: string;
  totalStudentsChecked: number;
  flaggedCount: number;
  totalOverdueAmount: number;
  criticalCount: number;
  moderateCount: number;
  warningCount: number;
  items: {
    studentId: string;
    studentName: string;
    admissionNo: string;
    className: string;
    parentName: string;
    parentPhone: string;
    balance: number;
    severity: 'Critical' | 'Moderate' | 'Warning';
    reason: string;
    status: 'Pending Follow-up' | 'Contacted' | 'Promised' | 'Resolved';
    promisedDate?: string;
  }[];
}

export interface PaymentRecord {
  id: string;
  receiptNo: string;
  date: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  paidAs?: string;
  billAmount?: number;
  arrears?: number;
  discount?: number;
  payable?: number;
  paid: number;
  amount?: number;
  balance?: number;
  method: 'Cash' | 'Mobile money' | 'Bank Transfer' | string;
  status: 'Fully Paid' | 'Partially Paid' | 'Verified' | string;
  collectedBy?: string;
  receivedBy?: string;
  description?: string;
  academicYear?: string;
  term?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  category: 'Academic' | 'Holiday' | 'Exam' | 'Sports' | 'Meeting' | 'Cultural';
  description: string;
  location?: string;
}

export type Bill = StudentBill;

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: string;
  recipientGroup?: string;
  targetAudience?: string;
  targetClass?: string;
  date?: string;
  dateSent?: string;
  read?: boolean;
  sender?: string;
  sentBy?: string;
  priority?: 'Normal' | 'Medium' | 'High' | string;
  status?: string;
}

export interface SMSHistoryItem {
  id: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  senderId: string;
  dateSent: string;
  status: 'Delivered' | 'Sent' | 'Failed' | string;
  costGH: number;
  smsCount: number;
}

export interface WhatsAppGroupItem {
  id: string;
  name: string;
  category: 'PTA' | 'Class' | 'Staff' | 'General';
  inviteLink?: string;
  memberCount: number;
  classAssigned?: string;
  description?: string;
}

export interface WhatsAppLogItem {
  id: string;
  groupName: string;
  groupId?: string;
  title: string;
  message: string;
  dateSent: string;
  sentBy: string;
  status: 'Delivered' | 'Dispatched';
  memberCount?: number;
}

export interface OverdueAlertRecord {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  parentName: string;
  parentPhone: string;
  tuitionArrears: number;
  levyArrears: number;
  totalBalance: number;
  dueDate: string;
  status: 'Pending' | 'Reminded' | 'Promised' | 'Flagged' | 'Resolved';
  flagReason?: string;
  internalNotes?: string;
  lastReminderDate?: string;
  reminderCount: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface ParentReminderLog {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  parentName: string;
  parentPhone: string;
  balanceReminded: number;
  channel: 'WhatsApp Direct' | 'WhatsApp Group' | 'SMS' | 'In-App Portal';
  tone: string;
  dateSent: string;
  operator: string;
  status: 'Sent' | 'Delivered' | 'Failed';
  messageSnippet: string;
}

export interface LoginHistoryItem {
  id: string;
  userId: string;
  userName: string;
  role: string;
  ipAddress: string;
  device: string;
  timestamp: string;
  status: 'Success' | 'Failed' | string;
}

export interface LoginLog {
  id: string;
  user: string;
  role: string;
  email: string;
  ipAddress: string;
  device: string;
  browser: string;
  os: string;
  loginTime: string;
  logoutTime?: string;
  status: 'Success' | 'Failed';
  failReason?: string;
}

export interface AcademicYearItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Current' | 'Active' | 'Upcoming' | 'Completed';
  hasRecords: boolean;
}

export interface TermItem {
  id: string;
  academicYear: string;
  name: string;
  startDate: string;
  endDate: string;
  daysOpen: number;
  nextTermDate: string;
  holidays: number;
  status: 'Current' | 'Completed' | 'Upcoming';
}

export interface DepartmentItem {
  id: string;
  name: string;
  code?: string;
  description: string;
  headOfDept?: string;
}

export interface ClassItem {
  id: string;
  name: string;
  department: string;
  classTeacher: string;
  roomNumber: string;
  capacity: number;
  status: 'Active' | 'Inactive';
}

export interface HouseItem {
  id: string;
  name: string;
  color: string;
  master: string;
  patron?: string;
  motto: string;
}

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
  department: string;
  category: 'Core' | 'Elective';
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  status?: 'Active' | 'Upcoming' | 'Archived';
}

export interface Term {
  id: string;
  name: string;
  termNumber?: number;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  daysOpen?: number;
  resumptionDate?: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  hod?: string;
  description?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  department?: string;
  stream?: string;
  roomNo?: string;
  classTeacher?: string;
  capacity?: number;
}

export interface House {
  id: string;
  name: string;
  color?: string;
  houseMaster?: string;
  motto?: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  department?: string;
  isCore?: boolean;
}

export interface SystemSettingsConfig {
  schoolName: string;
  schoolMotto: string;
  address: string;
  email: string;
  phone: string;
  altPhone: string;
  activeAcademicYear: string;
  activeTerm: string;
  nextTermBegins: string;
  smsSenderId: string;
  currencySymbol: string;
  enableStudentPortal: boolean;
  enableFeeReceiptPrinting: boolean;
  allowReportDownload: boolean;
  autoPromotePassingScore: number;
}

export interface UserAccountItem {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'admin' | 'teacher' | 'accountant' | 'clerk' | 'student';
  phone: string;
  status: 'Active' | 'Inactive' | 'Locked' | 'Pending';
  lastLogin: string;
  createdAt: string;
  password?: string;
  isApproved?: boolean;
  registrationType?: 'faculty' | 'student' | 'admin';
  department?: string;
  className?: string;
  admissionNo?: string;
  parentName?: string;
  parentPhone?: string;
  staffId?: string;
  approvedBy?: string;
  approvedAt?: string;
  privilege?: 'read' | 'read_write';
  allowedModules?: string[];
}

export interface TeacherAssignmentItem {
  id: string;
  teacherId: string;
  teacherName: string;
  className: string;
  subjectName: string;
  academicYear: string;
  term: string;
  roleType: 'Class Teacher' | 'Subject Teacher' | 'Assistant';
}

export interface TeacherAttendanceRecord {
  id: string;
  date: string;
  teacherId: string;
  teacherName: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  timeIn?: string;
  remarks?: string;
}

export interface PromotionRecord {
  id: string;
  date: string;
  fromClass: string;
  toClass: string;
  academicYear: string;
  studentCount: number;
  promotedBy: string;
  notes?: string;
}

export interface GradingScaleItem {
  id: string;
  department: string;
  systemName: string;
  academicYear: string;
  term: string;
  bands: {
    minScore: number;
    maxScore: number;
    grade: string;
    remark: string;
  }[];
}

export interface ScoreConversionItem {
  id: string;
  academicYear: string;
  term: string;
  department: string;
  classScoreWeight: number; // e.g., 40 or 30
  examScoreWeight: number;  // e.g., 60 or 70
  description?: string;
}

export interface IncomeExpenseItem {
  id: string;
  date: string;
  type: 'Income' | 'Expense';
  category: string;
  title?: string;
  amount: number;
  paymentMethod?: string;
  recordedBy: string;
  receiptVoucherNo?: string;
  referenceNo?: string;
  notes?: string;
  description?: string;
}

export interface FinancialAuditItem {
  id: string;
  dateTime?: string;
  timestamp?: string;
  user: string;
  role?: string;
  studentName?: string;
  admissionNo?: string;
  studentAdmNo?: string;
  amount?: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PRINT' | 'VOID' | string;
  changes?: string;
  ipAddress?: string;
  details?: string;
}

export interface PaymentMethodConfig {
  id: string;
  type: 'bank' | 'momo' | 'online' | 'cash' | 'other';
  name: string;
  enabled: boolean;
  isPrimary?: boolean;
  accountName: string;
  accountNumber: string;
  bankOrProviderName?: string;
  branchOrSortCode?: string;
  instructions: string;
}

export interface PaymentSettingsConfig {
  methods: PaymentMethodConfig[];
  generalInstructions: string;
  allowPortalSubmission: boolean;
  requireProofReference: boolean;
  supportPhone: string;
  supportEmail: string;
}

export interface FeeSubmissionItem {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  amount: number;
  feeType: string;
  paymentMethod: string;
  transactionId: string;
  datePaid: string;
  submissionDate: string;
  status: 'Pending Verification' | 'Approved' | 'Rejected';
  notes?: string;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  receiptNo?: string;
}

export interface ClassFeeTariffItem {
  id: string;
  classTitle: string;
  dept: string;
  baseTuition: number;
  ptaDues: number;
  ictFee: number;
  examFee: number;
  healthLevy: number;
  busTransit: number;
  notes?: string;
  customBreakdown?: { label: string; amount: number }[];
}
