import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Student, Teacher, TermReport, StudentBill, PaymentRecord, CalendarEvent, NotificationItem, LoginLog,
  AcademicYearItem, TermItem, DepartmentItem, ClassItem, HouseItem, SubjectItem, ClassFeeTariffItem,
  ClassReportBroadcast, ThemePaletteConfig, CourseItem
} from '../types';
import SchoolCalendarView from './SchoolCalendarView';
import AcademicSetupManager from './AcademicSetupManager';
import SystemSettingsManager from './admin/SystemSettingsManager';
import TeacherManager from './admin/TeacherManager';
import StudentManager from './admin/StudentManager';
import ExaminationManager from './admin/ExaminationManager';
import TerminalReportManager from './admin/TerminalReportManager';
import FeeManager from './admin/FeeManager';
import CommunicationLogsManager from './admin/CommunicationLogsManager';
import AdminDashboardCharts from './admin/AdminDashboardCharts';
import StudentTranscriptManager from './admin/StudentTranscriptManager';
import BackupRecoveryManager from './admin/BackupRecoveryManager';
import QuickActionSpeedDial from './common/QuickActionSpeedDial';
import JIPASLogo from './common/JIPASLogo';
import GlobalSearchHeader from './common/GlobalSearchHeader';
import { useI18n } from '../i18n/I18nContext';

import { 
  INITIAL_ACADEMIC_YEARS, INITIAL_TERMS, INITIAL_DEPARTMENTS, 
  INITIAL_CLASSES, INITIAL_HOUSES, INITIAL_SUBJECTS 
} from '../data/setupData';
import { checkHasDemoData, clearDemoData } from '../services/dbService';
import { 
  LayoutDashboard, Users, UserCheck, CreditCard, Award, Calendar, Bell, 
  FileText, Shield, Plus, Search, CheckCircle, AlertCircle, ArrowUpRight, DollarSign, BookOpen,
  Settings, UserCog, GraduationCap, ClipboardCheck, BarChart3, MessageSquare, KeyRound, Layers, Building2, School, Bookmark,
  Send, Eye, History, RefreshCw, CheckCircle2, Mail, Clock, AlertTriangle, LogOut, Printer, Wallet, TrendingUp, ChevronRight, ChevronDown,
  PanelLeftClose, PanelLeftOpen, MessageCircle, Database, Trash2, X, Sparkles, Palette, Download
} from 'lucide-react';

interface AdminPortalProps {
  currentUser?: any;
  themePalette?: ThemePaletteConfig;
  onUpdateThemePalette?: (palette: ThemePaletteConfig) => void;
  students: Student[];
  teachers: Teacher[];
  reports: TermReport[];
  bills: StudentBill[];
  payments: PaymentRecord[];
  calendarEvents: CalendarEvent[];
  notifications: NotificationItem[];
  classFeeTariffs: ClassFeeTariffItem[];
  broadcasts?: ClassReportBroadcast[];
  loginLogs: LoginLog[];
  academicYears: AcademicYearItem[];
  terms: TermItem[];
  departments: DepartmentItem[];
  courses?: CourseItem[];
  classes: ClassItem[];
  houses: HouseItem[];
  subjects: SubjectItem[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent?: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
  onAddTeacher?: (teacher: Teacher) => void;
  onUpdateTeacher?: (teacher: Teacher) => void;
  onDeleteTeacher?: (teacherId: string) => void;
  onUpdateAcademicYears: (years: AcademicYearItem[]) => void;
  onUpdateTerms: (terms: TermItem[]) => void;
  onUpdateDepartments: (departments: DepartmentItem[]) => void;
  onUpdateCourses?: (courses: CourseItem[]) => void;
  onUpdateClasses: (classes: ClassItem[]) => void;
  onUpdateHouses: (houses: HouseItem[]) => void;
  onUpdateSubjects: (subjects: SubjectItem[]) => void;
  onAddEvent: (event: CalendarEvent) => void;
  onAddPayment?: (payment: PaymentRecord) => void;
  onUpdateReports?: (reports: TermReport[]) => void;
  onUpdateBroadcasts?: (broadcasts: ClassReportBroadcast[]) => void;
  onAddNotification?: (notif: NotificationItem) => void;
  onRestoreData?: (data: any) => void;
  onLogout?: () => void;
  onCleanOrphaned?: () => Promise<{ cleanedBillsCount: number, cleanedReportsCount: number }>;
  onClearAllData?: () => void;
}

// Valid administrative module identifiers for URL hash routing and refresh persistence
const VALID_ADMIN_MODULES = new Set([
  'dashboard',
  // Setup
  'setup_management', 'setup_academic_years', 'setup_term_parameters', 'setup_departments',
  'setup_shs_courses', 'shs_courses', 'courses',
  'setup_classes', 'setup_houses', 'setup_subjects', 'academic_setup',
  // System
  'system_settings', 'system_theme_palette', 'theme_palette', 'color_palette', 'system_account_requests', 'account_requests', 'system_backup_restore', 'backup_recovery', 'backup_restore',
  'system_users_roles', 'users_roles', 'system_student_portal_ctrl', 'student_portal_control',
  'system_manage_logins', 'manage_portal_logins',
  // Teacher
  'teacher_profile', 'teachers', 'teacher_id_cards', 'teacher_assign',
  'teacher_attendance', 'teacher_attendance_report', 'teacher_attendance_stats',
  // Student
  'student_enroll', 'enroll_student', 'student_enrolled', 'enrolled_students',
  'student_transcript', 'exam_transcripts', 'transcripts', 'student_id_cards',
  'student_attendance', 'student_promote', 'promote_students', 'student_promotion_history', 'promotion_history',
  'admin_terminal_reports', 'terminal_reports', 'class_broadcasts',
  // Examination
  'exam_grading_system', 'grading_system', 'exam_score_conversion', 'score_conversion',
  'exam_enter_results', 'enter_results', 'exam_report_sheets', 'report_sheets',
  // Fee
  'fee_options', 'fees', 'fee_bill_students', 'bills', 'fee_generate_sheets',
  'fee_collection', 'payments', 'fee_payment_history', 'fee_payment_stats',
  'fee_income_expenses', 'income_expenses', 'fee_overdue_alerts', 'fee_audit_activity', 'audit_activity', 'payment_settings',
  // Notifications & SMS & Activity
  'notif_send', 'send_notification', 'whatsapp_broadcast', 'whatsapp_groups',
  'whatsapp_history', 'notif_history', 'notification_history', 'sms_compose',
  'compose_sms', 'sms_history', 'logs_student', 'student_login_history',
  'logs_user', 'user_login_history'
]);

const getCategoryForModule = (mod: string): string => {
  if (mod.startsWith('setup_') || mod === 'academic_setup') return 'setup';
  if (mod.startsWith('system_') || mod === 'backup_recovery' || mod === 'backup_restore' || mod === 'users_roles' || mod === 'student_portal_control' || mod === 'manage_portal_logins' || mod === 'account_requests') return 'system';
  if (mod.startsWith('teacher_') || mod === 'teachers') return 'teacher';
  if (mod === 'student_transcript' || mod === 'exam_transcripts' || mod === 'transcripts') return 'student';
  if (mod === 'admin_terminal_reports' || mod === 'terminal_reports' || mod === 'class_broadcasts') return 'exam';
  if (mod.startsWith('student_') || mod === 'students' || mod === 'enroll_student' || mod === 'enrolled_students' || mod === 'promote_students' || mod === 'promotion_history') return 'student';
  if (mod.startsWith('exam_') || mod === 'grading_system' || mod === 'score_conversion' || mod === 'enter_results' || mod === 'report_sheets') return 'exam';
  if (mod.startsWith('fee_') || mod === 'fees' || mod === 'bills' || mod === 'payments' || mod === 'income_expenses' || mod === 'audit_activity') return 'fee';
  if (mod.startsWith('notif_') || mod.startsWith('sms_') || mod.startsWith('whatsapp_') || mod === 'send_notification' || mod === 'notification_history' || mod === 'compose_sms' || mod === 'sms_history') return 'notif';
  if (mod.startsWith('logs_') || mod === 'student_login_history' || mod === 'user_login_history') return 'logs';
  return 'dashboard';
};

const ADMIN_NAV_GROUPS = [
  {
    id: 'setup',
    title: 'Setup Management',
    icon: School,
    items: [
      { id: 'setup_academic_years', label: 'Academic Years', icon: Calendar },
      { id: 'setup_term_parameters', label: 'Term / Parameters', icon: Bookmark },
      { id: 'setup_departments', label: 'Departments', icon: Building2 },
      { id: 'setup_shs_courses', label: 'SHS Courses / Programmes', icon: BookOpen },
      { id: 'setup_classes', label: 'Classes', icon: School },
      { id: 'setup_houses', label: 'Houses', icon: Shield },
      { id: 'setup_subjects', label: 'Subject Management', icon: BookOpen },
    ]
  },
  {
    id: 'system',
    title: 'System Setting',
    icon: Settings,
    items: [
      { id: 'system_settings', label: 'System Settings', icon: Settings },
      { id: 'system_theme_palette', label: 'Theme & Color Palette', icon: Palette },
      { id: 'system_account_requests', label: 'Account Requests', icon: UserCheck },
      { id: 'system_users_roles', label: 'Users & Roles', icon: UserCog },
      { id: 'system_student_portal_ctrl', label: 'Student Portal Control', icon: GraduationCap },
      { id: 'system_manage_logins', label: 'Manage Portal Logins', icon: KeyRound },
      { id: 'system_backup_restore', label: 'Backup & Recovery', icon: Database },
    ]
  },
  {
    id: 'teacher',
    title: 'Teacher Management',
    icon: UserCheck,
    items: [
      { id: 'teacher_profile', label: 'Teacher Profile', icon: UserCheck },
      { id: 'teacher_id_cards', label: 'Staff ID Cards', icon: CreditCard },
      { id: 'teacher_assign', label: 'Assign Teacher', icon: Users },
      { id: 'teacher_attendance', label: 'Teacher Attendance', icon: ClipboardCheck },
      { id: 'teacher_attendance_report', label: 'Attendance Report', icon: FileText },
      { id: 'teacher_attendance_stats', label: 'Attendance Statistics', icon: BarChart3 },
    ]
  },
  {
    id: 'student',
    title: 'Student Management',
    icon: Users,
    items: [
      { id: 'student_enroll', label: 'Enroll Student', icon: Plus },
      { id: 'student_enrolled', label: 'Enrolled Students', icon: Users },
      { id: 'admin_terminal_reports', label: 'Terminal Reports & Broadcast', icon: Award },
      { id: 'student_transcript', label: "Students' Transcripts", icon: Award },
      { id: 'student_id_cards', label: 'Student ID Cards', icon: Award },
      { id: 'student_attendance', label: 'Student Attendance', icon: ClipboardCheck },
      { id: 'student_promote', label: 'Promote Students', icon: ArrowUpRight },
      { id: 'student_promotion_history', label: 'Promotion History', icon: History },
    ]
  },
  {
    id: 'exam',
    title: 'Examination Management',
    icon: Award,
    items: [
      { id: 'admin_terminal_reports', label: 'Terminal Reports & Broadcast', icon: Send },
      { id: 'exam_grading_system', label: 'Grading System', icon: Award },
      { id: 'exam_score_conversion', label: 'Score Conversion', icon: Layers },
      { id: 'exam_enter_results', label: 'Enter Results', icon: FileText },
      { id: 'exam_report_sheets', label: 'Exam Report Sheets', icon: BookOpen },
      { id: 'exam_transcripts', label: 'Official Transcripts', icon: Award },
    ]
  },
  {
    id: 'fee',
    title: 'Fee Management',
    icon: DollarSign,
    items: [
      { id: 'payment_settings', label: 'Payment Channels & Proofs', icon: CreditCard },
      { id: 'fee_options', label: 'Fee Settings & Tariffs', icon: CreditCard },
      { id: 'fee_bill_students', label: 'Bill Students', icon: FileText },
      { id: 'fee_generate_sheets', label: 'Generate All Sheets', icon: Layers },
      { id: 'fee_collection', label: 'Fee Collection', icon: DollarSign },
      { id: 'fee_payment_history', label: 'Payment History', icon: Calendar },
      { id: 'fee_payment_stats', label: 'Payment Statistics', icon: BarChart3 },
      { id: 'fee_income_expenses', label: 'Income & Expenses', icon: Wallet },
      { id: 'fee_overdue_alerts', label: 'Overdue Fee Alerts', icon: AlertCircle },
      { id: 'fee_audit_activity', label: 'Audit Activity', icon: Shield },
    ]
  },
  {
    id: 'notif',
    title: 'Notifications & SMS',
    icon: Bell,
    items: [
      { id: 'notif_send', label: 'Send Notification', icon: Bell },
      { id: 'whatsapp_broadcast', label: 'WhatsApp Broadcast', icon: MessageCircle },
      { id: 'whatsapp_groups', label: 'WhatsApp Groups', icon: Users },
      { id: 'whatsapp_history', label: 'WhatsApp Logs', icon: History },
      { id: 'notif_history', label: 'Notification History', icon: FileText },
      { id: 'sms_compose', label: 'Compose SMS', icon: MessageSquare },
      { id: 'sms_history', label: 'SMS History', icon: MessageSquare },
    ]
  },
  {
    id: 'logs',
    title: 'Activity Logs',
    icon: Shield,
    items: [
      { id: 'logs_student', label: 'Student Login History', icon: Users },
      { id: 'logs_user', label: 'User Login History', icon: Shield },
    ]
  }
];

export default function AdminPortal({
  currentUser: propCurrentUser,
  themePalette,
  onUpdateThemePalette,
  students,
  teachers,
  reports,
  bills,
  payments,
  calendarEvents,
  notifications,
  classFeeTariffs,
  broadcasts = [],
  loginLogs,
  academicYears,
  terms,
  departments,
  courses = [],
  classes,
  houses,
  subjects,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onUpdateAcademicYears,
  onUpdateTerms,
  onUpdateDepartments,
  onUpdateCourses,
  onUpdateClasses,
  onUpdateHouses,
  onUpdateSubjects,
  onAddEvent,
  onAddPayment,
  onUpdateReports,
  onUpdateBroadcasts,
  onAddNotification,
  onRestoreData,
  onLogout,
  onCleanOrphaned,
  onClearAllData
}: AdminPortalProps) {
  const { t } = useI18n();
  
  // Persistent active module: reloads current page directly on refresh from URL hash or localStorage
  const [activeModule, setActiveModule] = useState<string>(() => {
    if (localStorage.getItem('jipas_force_dashboard') === 'true') {
      localStorage.removeItem('jipas_force_dashboard');
      window.location.hash = 'dashboard';
      return 'dashboard';
    }
    const hash = window.location.hash.replace('#', '');
    if (hash && VALID_ADMIN_MODULES.has(hash)) return hash;
    const saved = localStorage.getItem('jipas_active_page_admin');
    if (saved && VALID_ADMIN_MODULES.has(saved)) return saved;
    return 'dashboard';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return false;
    }
    try {
      const saved = localStorage.getItem('jipas_admin_sidebar_open');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleSidebar = (openState: boolean) => {
    setIsSidebarOpen(openState);
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      try {
        localStorage.setItem('jipas_admin_sidebar_open', JSON.stringify(openState));
      } catch {}
    }
  };

  // Accordion category collapse/expand state - collapsed by default for a clean, professional sidebar layout
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const [menuFilter, setMenuFilter] = useState('');

  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (propCurrentUser) return propCurrentUser;
    try {
      const stored = localStorage.getItem('jipas_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (propCurrentUser) {
      setCurrentUser(propCurrentUser);
    }
  }, [propCurrentUser]);

  const filteredNavGroups = ADMIN_NAV_GROUPS.map(group => {
    if (currentUser?.role === 'sub_admin' && Array.isArray(currentUser?.allowedModules) && currentUser.allowedModules.length > 0) {
      const allowedItems = group.items.filter(item => {
        return currentUser.allowedModules.some((mod: string) => {
          if (!mod) return false;
          const cleanMod = mod.toLowerCase().trim();
          const cleanGroupId = group.id.toLowerCase().trim();
          const cleanItemId = item.id.toLowerCase().trim();

          if (cleanMod === cleanGroupId || cleanMod === cleanItemId) return true;
          if (cleanGroupId === 'setup' && (cleanMod === 'setup_management' || cleanMod.startsWith('setup') || cleanMod === 'academic_setup')) return true;
          if (cleanGroupId === 'system' && (cleanMod === 'system_settings' || cleanMod.startsWith('system') || cleanMod === 'settings')) return true;
          if (cleanGroupId === 'teacher' && (cleanMod === 'teachers' || cleanMod.startsWith('teacher') || cleanMod === 'faculty')) return true;
          if (cleanGroupId === 'student' && (cleanMod === 'students' || cleanMod.startsWith('student') || cleanMod === 'enrollment')) return true;
          if (cleanGroupId === 'exam' && (cleanMod === 'exams' || cleanMod.startsWith('exam') || cleanMod === 'academics')) return true;
          if (cleanGroupId === 'fee' && (cleanMod === 'fees' || cleanMod.startsWith('fee') || cleanMod === 'finance' || cleanMod === 'bills' || cleanMod === 'payments')) return true;
          if (cleanGroupId === 'notif' && (cleanMod === 'notif_send' || cleanMod.startsWith('notif') || cleanMod.startsWith('sms') || cleanMod.startsWith('whatsapp') || cleanMod === 'broadcast')) return true;
          if (cleanGroupId === 'logs' && (cleanMod === 'logs_user' || cleanMod.startsWith('logs') || cleanMod === 'audit')) return true;
          return cleanItemId.includes(cleanMod) || cleanMod.includes(cleanItemId);
        });
      });
      return { ...group, items: allowedItems };
    }
    return group;
  }).filter(group => group.items.length > 0);

  // Sync active module with URL hash and localStorage so refresh keeps the exact current page
  useEffect(() => {
    window.location.hash = activeModule;
    try {
      localStorage.setItem('jipas_active_page_admin', activeModule);
    } catch (e) {
      console.warn('Could not save active page:', e);
    }
  }, [activeModule]);

  // Listen to hash changes (for browser back/forward buttons)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && VALID_ADMIN_MODULES.has(hash)) {
        setActiveModule(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Persist sidebar open state
  useEffect(() => {
    try {
      localStorage.setItem('jipas_admin_sidebar_open', JSON.stringify(isSidebarOpen));
    } catch (e) {
      console.warn('Could not save sidebar preference:', e);
    }
  }, [isSidebarOpen]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const [hasDemoData, setHasDemoData] = useState<boolean>(true);
  const [isClearingDemo, setIsClearingDemo] = useState<boolean>(false);
  const [showClearDemoModal, setShowClearDemoModal] = useState<boolean>(false);

  useEffect(() => {
    checkHasDemoData().then(val => {
      setHasDemoData(val);
    });
  }, []);

  const handleConfirmClearDemoData = async () => {
    setIsClearingDemo(true);
    try {
      await clearDemoData();
      setHasDemoData(false);
      setShowClearDemoModal(false);
      
      // Update memory state across all modules
      if (onClearAllData) {
        onClearAllData();
      }
      onUpdateAcademicYears([]);
      onUpdateTerms([]);
      onUpdateDepartments([]);
      onUpdateClasses([]);
      onUpdateHouses([]);
      onUpdateSubjects([]);
      if (onUpdateCourses) onUpdateCourses([]);
      if (onUpdateReports) onUpdateReports([]);
      
      alert("All initial demo data has been permanently cleared from Firestore database and local storage. You can now enter your own real school data!");
    } catch (err) {
      console.error('Failed to clear demo data:', err);
      alert("Failed to clear demo data. Please check your network connection.");
    } finally {
      setIsClearingDemo(false);
    }
  };

  // Financial calculations
  const totalRevenue = payments.reduce((acc, p) => acc + (p.paid || 0), 0);
  const totalPending = bills.reduce((acc, b) => acc + (b.balance || 0), 0);
  
  // Notification calculations
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Manual Backup Database states & handler
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  const handleBackupDatabase = () => {
    setIsBackingUp(true);
    try {
      const backupPayload = {
        meta: {
          system: 'JIPAS School Management System',
          version: '2026.3.1',
          exportedAt: new Date().toISOString(),
          schoolMotto: 'Education is Wealth',
          environment: 'Admin Manual Backup'
        },
        data: {
          students,
          teachers,
          reports,
          bills,
          payments,
          calendarEvents,
          notifications
        },
        counts: {
          students: students.length,
          teachers: teachers.length,
          reports: reports.length,
          bills: bills.length,
          payments: payments.length,
          events: calendarEvents.length
        }
      };

      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `jipas_db_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 4000);
    } catch (err: any) {
      alert(`Database backup failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDashboardBulkExport = () => {
    try {
      const exportRows = students.map(s => {
        const studentReports = (reports || []).filter(r => r.admissionNo === s.admissionNo || r.studentId === s.id);
        const latestReport = studentReports[studentReports.length - 1];
        return {
          'Admission No': s.admissionNo,
          'Full Name': s.fullName,
          'Gender': s.gender,
          'Date of Birth': s.dob,
          'Department': s.department,
          'Class Name': s.className,
          'House': s.house,
          'Parent Name': s.parentName,
          'Parent Phone': s.parentPhone,
          'Status': s.status,
          'Academic Year': s.academicYear,
          'Term': s.term,
          'Total Academic Reports': studentReports.length,
          'Latest Total Score': latestReport ? latestReport.totalScore : '--',
          'Latest Average': latestReport ? latestReport.averageScore : '--',
          'Latest Position': latestReport ? latestReport.position : '--',
          'Promotion Status': latestReport ? (latestReport.promotionStatus || '--') : '--'
        };
      });

      if (exportRows.length === 0) {
        alert('No student records available to export.');
        return;
      }

      const headers = Object.keys(exportRows[0]);
      const csvRows = [headers.join(',')];
      for (const row of exportRows) {
        const values = headers.map(h => {
          const val = (row as any)[h];
          const escaped = ('' + (val ?? '')).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `jipas_dashboard_bulk_student_academic_archive_${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Bulk export failed: ${err?.message || 'Unknown error'}`);
    }
  };

  const [isCleaningOrphaned, setIsCleaningOrphaned] = useState(false);
  const [cleanSuccessMsg, setCleanSuccessMsg] = useState('');

  const handleQuickClean = async () => {
    if (!onCleanOrphaned) {
      alert("Database cleaning is currently unavailable.");
      return;
    }
    if (confirm("Are you sure you want to run 'Quick Clean'? This will find and permanently delete any bills or terminal reports belonging to student IDs that no longer exist in the system. This action cannot be undone.")) {
      setIsCleaningOrphaned(true);
      setCleanSuccessMsg('');
      try {
        const result = await onCleanOrphaned();
        if (result.cleanedBillsCount === 0 && result.cleanedReportsCount === 0) {
          setCleanSuccessMsg("No orphaned records found. System is already clean! ✨");
        } else {
          setCleanSuccessMsg(`Clean completed! Removed ${result.cleanedBillsCount} orphaned bills and ${result.cleanedReportsCount} orphaned reports. 🧹`);
        }
        setTimeout(() => setCleanSuccessMsg(''), 6000);
      } catch (err: any) {
        alert(`Failed to clean orphaned records: ${err?.message || 'Unknown error'}`);
      } finally {
        setIsCleaningOrphaned(false);
      }
    }
  };

  // Quick module switcher helper
  const handleNavigate = (mod: string) => {
    setActiveModule(mod);
    // Auto-hide sidebar after selecting an item only on mobile screen widths
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickAction = (actionKey: string) => {
    switch (actionKey) {
      case 'student_add':
        handleNavigate('student_enroll');
        break;
      case 'teacher_add':
        handleNavigate('teacher_profile');
        break;
      case 'score_entry':
        handleNavigate('exam_enter_results');
        break;
      case 'send_notif':
        handleNavigate('notif_send');
        break;
      case 'create_bill':
        handleNavigate('fee_bill_students');
        break;
      case 'print_reports':
        handleNavigate('exam_report_sheets');
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative flex flex-col lg:flex-row gap-6 w-full">
      {/* Floating Toggle Icon (Docked to left edge when sidebar is minimized) */}
      {!isSidebarOpen && (
        <button
          onClick={() => toggleSidebar(true)}
          title="Open Navigation Menu"
          id="jipas-static-sidebar-open-btn"
          className="fixed left-0 top-24 z-40 bg-[#0A1226]/95 hover:bg-blue-600 text-white pl-2.5 pr-3.5 py-2.5 rounded-r-xl shadow-2xl border-y border-r border-blue-800/60 backdrop-blur-xs transition-all flex items-center gap-2 cursor-pointer group animate-fadeIn"
        >
          <PanelLeftOpen className="w-4 h-4 text-blue-400 group-hover:text-white transition-colors" />
          <span className="text-[11px] font-bold tracking-wide">Menu</span>
        </button>
      )}

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => toggleSidebar(false)}
          aria-hidden="true"
        />
      )}

      {/* RESPONSIVE NAVIGATION SIDEBAR: Full slide-over drawer on mobile, docked sticky sidebar on desktop */}
      {isSidebarOpen && (
        <aside
          id="jipas-admin-sidebar"
          className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full bg-[#070D1E]/95 text-slate-300 shadow-2xl flex flex-col border-r border-blue-950/80 lg:static lg:inset-auto lg:z-30 lg:w-64 xl:w-72 lg:shrink-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6.5rem)] lg:rounded-2xl lg:border lg:border-blue-900/40 overflow-hidden backdrop-blur-md"
          aria-label="Admin Navigation Sidebar"
        >
          {/* Header with static close toggle */}
          <div className="p-3.5 border-b border-blue-950/80 flex items-center justify-between shrink-0 bg-[#050A18]/80">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <JIPASLogo size="sm" className="shrink-0" />
              <div className="whitespace-nowrap overflow-hidden">
                <h2 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                  JIPAS Portal
                  {currentUser?.role === 'sub_admin' && (
                    <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded text-[9px] font-black uppercase">
                      Sub-Admin
                    </span>
                  )}
                </h2>
                <p className="text-[10px] text-indigo-400 font-medium">Administrator Console</p>
              </div>
            </div>
            <button
              onClick={() => toggleSidebar(false)}
              title="Minimize Navigation Sidebar"
              id="jipas-static-sidebar-close-btn"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer shrink-0 border border-slate-700/50"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Search/Filter Bar for Fast Access */}
          <div className="px-3 pt-2.5 pb-1 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={menuFilter}
                onChange={(e) => setMenuFilter(e.target.value)}
                placeholder="Filter menu items..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-[#0A142A] border border-blue-900/50 rounded-xl text-[11px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Scrollable Navigation Groups (Accordion minimizes vertical length) */}
          <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1.5 text-xs font-medium scrollbar-thin scrollbar-thumb-slate-700">
            {/* Dashboard Link */}
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeModule === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Dashboard</span>
              </span>
            </button>

            {/* Accordion Categories */}
            {filteredNavGroups.map((group) => {
              const GroupIcon = group.icon;
              const hasActiveChild = group.items.some(it => it.id === activeModule);
              const filteredItems = menuFilter.trim()
                ? group.items.filter(it => it.label.toLowerCase().includes(menuFilter.toLowerCase()))
                : group.items;

              if (menuFilter.trim() && filteredItems.length === 0) {
                return null;
              }

              const isExpanded = menuFilter.trim() ? true : (expandedCategories[group.id] !== undefined ? expandedCategories[group.id] : hasActiveChild);

              return (
                <div key={group.id} className="border border-blue-950/70 rounded-xl overflow-hidden bg-[#0A1329]/50">
                  <button
                    onClick={() => toggleCategory(group.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-left transition-colors cursor-pointer ${
                      hasActiveChild
                        ? 'bg-blue-950/70 text-blue-300 font-bold'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                      <GroupIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="whitespace-nowrap">{group.title}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800/80 text-slate-400">
                        {group.items.length}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="p-1 space-y-0.5 bg-[#050A18]/60 border-t border-blue-950/60">
                      {filteredItems.map(item => {
                        const ItemIcon = item.icon;
                        const isSelected = activeModule === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-all cursor-pointer text-xs ${
                              isSelected
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30'
                                : 'hover:bg-slate-800/60 text-slate-300 hover:text-white'
                            }`}
                          >
                            <ItemIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Logout button at bottom of sidebar */}
            <div className="pt-2 border-t border-blue-950/80">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to log out of JIPAS?')) {
                    onLogout?.();
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-950/30 hover:text-rose-400 transition-colors text-xs font-bold cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0 w-full space-y-6">
        {/* UNIVERSAL GLOBAL SEARCH BAR (Available on every page in Admin Portal) */}
        <GlobalSearchHeader
          students={students}
          teachers={teachers}
          bills={bills}
          payments={payments}
          classFeeTariffs={classFeeTariffs}
          navGroups={ADMIN_NAV_GROUPS}
          onNavigate={(modId) => handleNavigate(modId)}
          placeholder="Search students, teachers, fee bills, receipts, settings..."
        />

        {/* Top Header Banner - Only show on dashboard */}
        {activeModule === 'dashboard' && (
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <JIPASLogo size="lg" className="shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                    JIPAS
                  </span>
                  <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                    Active Term: Third Term 2025/2026
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  School Management System Dashboard
                </h1>
                <p className="text-blue-100 text-xs mt-1">
                  P.O. Box GP 4412, Accra - Ghana | info@jipas.edu.gh | +233 24 975 5593 | Motto: Education is Wealth
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => setShowClearDemoModal(true)}
                disabled={isClearingDemo}
                id="admin-clear-demo-data-btn"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer border bg-rose-600/90 hover:bg-rose-600 border-rose-400/50 text-white"
                title="Clear all initial demo records and start fresh"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>{isClearingDemo ? 'Clearing...' : 'Clear Initial Demo Data'}</span>
              </button>
              
              <button
                onClick={handleBackupDatabase}
                disabled={isBackingUp}
                id="admin-manual-db-backup"
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold shadow-lg transition-all cursor-pointer border ${
                  backupSuccess 
                    ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white' 
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700/80 text-indigo-200'
                }`}
              >
                <Database className={`w-4 h-4 ${backupSuccess ? 'text-white' : 'text-indigo-400'}`} />
                <span>{isBackingUp ? 'Compiling JSON...' : backupSuccess ? 'Backup Downloaded! ✓' : 'Backup Database'}</span>
              </button>

              <button
                onClick={handleQuickClean}
                disabled={isCleaningOrphaned}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg transition-all cursor-pointer border border-indigo-500"
              >
                <Sparkles className={`w-4 h-4 ${isCleaningOrphaned ? 'animate-spin' : ''}`} />
                <span>{isCleaningOrphaned ? 'Cleaning...' : 'Quick Clean'}</span>
              </button>

              <button
                onClick={() => setActiveModule('student_enroll')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5" /> Enroll New Student
              </button>
            </div>
          </div>
        )}

        {cleanSuccessMsg && (
          <div className="bg-emerald-600/90 text-white px-5 py-3.5 rounded-2xl shadow-lg border border-emerald-500 flex items-center justify-between animate-fade-in text-sm font-semibold">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-200" />
              <span>{cleanSuccessMsg}</span>
            </div>
            <button
              onClick={() => setCleanSuccessMsg('')}
              className="p-1 hover:bg-emerald-700 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4 text-emerald-100" />
            </button>
          </div>
        )}

        {/* DYNAMIC MODULE VIEWS WITH ENTRY ANIMATIONS */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* 1. DASHBOARD MODULE */}
            {activeModule === 'dashboard' && (
              <div className="space-y-6">
                {/* Dashboard Header with Bulk Export Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Administrator Dashboard & Analytics</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Overview of school enrollment, financial status, and academic progress.</p>
                  </div>
                  <button
                    onClick={handleDashboardBulkExport}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Bulk Export Students & Academic Records (CSV)</span>
                  </button>
                </div>

            {/* Top Stat Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
              <div 
                onClick={() => setActiveModule('student_enrolled')}
                className="bg-slate-800 text-white p-5 rounded-2xl shadow-sm border border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-750 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('dashboard.totalEnrolled', 'Total Enrolled')}</p>
                  <h3 className="text-3xl font-black mt-1">{students.length}</h3>
                  <p className="text-xs text-emerald-400 font-semibold mt-1">{t('dashboard.activeStudents', 'Active Students')}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-600/30 rounded-2xl flex items-center justify-center text-indigo-400">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div 
                onClick={() => setActiveModule('fee_bill_students')}
                className="bg-purple-700 text-white p-5 rounded-2xl shadow-sm border border-purple-600 flex items-center justify-between cursor-pointer hover:bg-purple-650 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-200">{t('dashboard.pendingPayments', 'Pending Payments')}</p>
                  <h3 className="text-3xl font-black mt-1 font-mono">{totalPending.toFixed(2)} CFA</h3>
                  <p className="text-xs text-purple-100 font-semibold mt-1">{t('dashboard.outstandingBalances', 'Outstanding Balances')}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div 
                onClick={() => setActiveModule('dashboard')}
                className="bg-rose-700 text-white p-5 rounded-2xl shadow-sm border border-rose-600 flex items-center justify-between cursor-pointer hover:bg-rose-650 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-200">{t('dashboard.newNotifications', 'New Notifications')}</p>
                  <h3 className="text-3xl font-black mt-1">{unreadNotifications}</h3>
                  <p className="text-xs text-rose-100 font-semibold mt-1">{t('dashboard.unreadAlerts', 'Unread Alerts')}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                  <Bell className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Interactive Visual Charts Hub (Recharts) */}
            <AdminDashboardCharts
              students={students}
              teachers={teachers}
              reports={reports}
              bills={bills}
              payments={payments}
              onNavigate={(mod) => setActiveModule(mod)}
            />

            {/* LIVE TERMINAL EXAMINATION REPORTS & CLASS BROADCAST CONSOLE */}
            <div className="bg-[#0B142A] border border-blue-900/60 rounded-2xl p-6 shadow-xl space-y-5 text-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-blue-950/80 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white tracking-tight">
                        Terminal Reports Class Broadcast Console
                      </h3>
                      <span className="bg-blue-950 text-blue-300 border border-blue-800/80 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Third Term 2025/2026
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Admins hold exclusive authorization to broadcast terminal reports on a class basis before students can access them.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setActiveModule('admin_terminal_reports')}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    <span>Open Full Broadcast Manager</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Class Broadcast Status Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6',
                  'JHS 1A', 'JHS 1B', 'JHS 2', 'JHS 3'
                ].map((className) => {
                  const bcast = broadcasts?.find(b => b.className.toLowerCase() === className.toLowerCase() && b.term.toLowerCase().includes('third'));
                  const isBroadcasted = bcast?.isBroadcasted ?? (className === 'Basic 1' || className === 'JHS 1A');
                  const classStudentCount = students.filter(s => s.className.toLowerCase() === className.toLowerCase()).length || 24;

                  return (
                    <div
                      key={className}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isBroadcasted 
                          ? 'bg-emerald-950/30 border-emerald-800/50 hover:border-emerald-700/80' 
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{className}</span>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isBroadcasted 
                              ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700/60' 
                              : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                          }`}>
                            {isBroadcasted ? '🟢 Published Live' : '🟡 Draft / Pending'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {classStudentCount} students • {isBroadcasted ? 'Accessible on Student Portal' : 'Hidden from students'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={async () => {
                            const newStatus = isBroadcasted ? 'Draft' : 'Published';
                            const updatedRecord: ClassReportBroadcast = {
                              id: bcast?.id || `broadcast-${className.replace(/\s+/g, '-').toLowerCase()}-third-term`,
                              className,
                              academicYear: '2025-2026',
                              term: 'Third Term',
                              isBroadcasted: !isBroadcasted,
                              broadcastedAt: !isBroadcasted ? new Date().toLocaleDateString('en-GB') : undefined,
                              broadcastedBy: currentUser?.name || 'Administrator',
                              status: newStatus as any,
                              releaseNotes: !isBroadcasted ? 'Terminal assessment released by Administration.' : 'Draft mode'
                            };
                            const all = broadcasts || [];
                            const idx = all.findIndex(b => b.className.toLowerCase() === className.toLowerCase() && b.term.toLowerCase().includes('third'));
                            let nextList: ClassReportBroadcast[];
                            if (idx >= 0) {
                              nextList = [...all];
                              nextList[idx] = updatedRecord;
                            } else {
                              nextList = [updatedRecord, ...all];
                            }
                            onUpdateBroadcasts?.(nextList);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-sm ${
                            isBroadcasted
                              ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                          }`}
                        >
                          {isBroadcasted ? 'Revoke' : 'Broadcast Live'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Action Matrix Grid */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Administrative Command Hub
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <button
                  onClick={() => setActiveModule('student_enroll')}
                  className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <Plus className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-xs text-slate-900">Enroll Student</div>
                  <div className="text-[10px] text-slate-500">Add new Ghanaian student</div>
                </button>
                <button
                  onClick={() => setActiveModule('student_transcript')}
                  className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <Award className="w-5 h-5 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-xs text-slate-900">Transcripts</div>
                  <div className="text-[10px] text-slate-500">Generate, PDF & Share</div>
                </button>
                <button
                  onClick={() => setActiveModule('fee_collection')}
                  className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <DollarSign className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-xs text-slate-900">Collect Fees</div>
                  <div className="text-[10px] text-slate-500">Record MoMo & Cash</div>
                </button>
                <button
                  onClick={() => setActiveModule('exam_enter_results')}
                  className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <FileText className="w-5 h-5 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-xs text-slate-900">Enter Exam Marks</div>
                  <div className="text-[10px] text-slate-500">SBA & terminal scores</div>
                </button>
                <button
                  onClick={() => setActiveModule('sms_compose')}
                  className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <MessageSquare className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-xs text-slate-900">Send Bulk SMS</div>
                  <div className="text-[10px] text-slate-500">MTN / Telecel / AT gateway</div>
                </button>
              </div>
            </div>

            {/* Quick Students & Teachers Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enrolled Students preview */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" /> Recent Student Admissions
                  </h3>
                  <button
                    onClick={() => setActiveModule('student_enrolled')}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-bold cursor-pointer"
                  >
                    View All ({students.length}) →
                  </button>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {students.slice(0, 5).map(s => (
                    <div key={s.id} className="py-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900 block">{s.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{s.admissionNo} • {s.className}</span>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        {s.status || 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teaching Faculty preview */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" /> Teaching Faculty
                  </h3>
                  <button
                    onClick={() => setActiveModule('teacher_profile')}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-bold cursor-pointer"
                  >
                    Manage Faculty ({teachers.length}) →
                  </button>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {teachers.slice(0, 5).map(t => (
                    <div key={t.id} className="py-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900 block">{t.name}</span>
                        <span className="text-[10px] text-indigo-600">{t.designation} • {t.academicQualification}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{t.phone}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ACADEMIC SETUP MANAGEMENT MODULES */}
        {(activeModule.startsWith('setup_') || activeModule === 'academic_setup' || activeModule === 'shs_courses' || activeModule === 'courses') && (
          <AcademicSetupManager
            activeModule={activeModule}
            onNavigate={setActiveModule}
            students={students}
            teachers={teachers}
            academicYears={academicYears}
            onUpdateAcademicYears={onUpdateAcademicYears}
            terms={terms}
            onUpdateTerms={onUpdateTerms}
            departments={departments}
            onUpdateDepartments={onUpdateDepartments}
            courses={courses}
            onUpdateCourses={onUpdateCourses}
            classes={classes}
            onUpdateClasses={onUpdateClasses}
            houses={houses}
            onUpdateHouses={onUpdateHouses}
            subjects={subjects}
            onUpdateSubjects={onUpdateSubjects}
          />
        )}

        {/* 3. SYSTEM SETTINGS & USERS & ROLES & PORTAL CONTROL */}
        {activeModule !== 'system_backup_restore' && (activeModule.startsWith('system_') || activeModule === 'system_settings' || activeModule === 'users_roles' || activeModule === 'student_portal_control' || activeModule === 'manage_portal_logins' || activeModule === 'manage_user_logins' || activeModule === 'manage_logins') && (
          <SystemSettingsManager
            activeModule={activeModule}
            onNavigate={handleNavigate}
            themePalette={themePalette}
            onUpdateThemePalette={onUpdateThemePalette}
          />
        )}

        {/* BACKUP & RECOVERY MODULE */}
        {(activeModule === 'system_backup_restore' || activeModule === 'backup_recovery' || activeModule === 'backup_restore') && (
          <BackupRecoveryManager
            students={students}
            teachers={teachers}
            reports={reports}
            bills={bills}
            payments={payments}
            calendarEvents={calendarEvents}
            notifications={notifications}
            onRestoreData={onRestoreData}
          />
        )}

        {/* 4. TEACHER MANAGEMENT MODULES */}
        {(activeModule.startsWith('teacher_') || activeModule === 'teachers' || activeModule === 'attendance_report' || activeModule === 'attendance_stats' || activeModule === 'attendance_statistics') && (
          <TeacherManager
            activeModule={activeModule}
            teachers={teachers}
            onAddTeacher={onAddTeacher}
            onUpdateTeacher={onUpdateTeacher}
            onDeleteTeacher={onDeleteTeacher}
            onNavigate={handleNavigate}
          />
        )}

        {/* 5. STUDENT TRANSCRIPT GENERATOR MODULE */}
        {(activeModule === 'student_transcript' || activeModule === 'exam_transcripts' || activeModule === 'transcripts') && (
          <StudentTranscriptManager
            students={students}
            reports={reports}
            onNavigate={handleNavigate}
          />
        )}

        {/* 5B. STUDENT TERMINAL REPORT & CLASS BROADCAST MANAGER */}
        {(activeModule === 'admin_terminal_reports' || activeModule === 'terminal_reports' || activeModule === 'class_broadcasts') && (
          <TerminalReportManager
            students={students}
            reports={reports}
            broadcasts={broadcasts}
            classes={classes}
            academicYears={academicYears}
            terms={terms}
            subjects={subjects}
            currentUser={currentUser}
            onUpdateReports={onUpdateReports}
            onUpdateBroadcasts={onUpdateBroadcasts}
          />
        )}

        {/* 6. STUDENT MANAGEMENT MODULES */}
        {activeModule !== 'student_transcript' && (activeModule.startsWith('student_') || activeModule === 'students' || activeModule === 'enroll_student' || activeModule === 'enrolled_students' || activeModule === 'promote_students' || activeModule === 'promotion_history') && (
          <StudentManager
            activeModule={activeModule}
            students={students}
            courses={courses}
            classes={classes}
            departments={departments}
            houses={houses}
            onAddStudent={onAddStudent}
            onUpdateStudent={onUpdateStudent}
            onDeleteStudent={onDeleteStudent}
            onNavigate={handleNavigate}
            onCleanOrphaned={onCleanOrphaned}
          />
        )}

        {/* 7. EXAMINATION MANAGEMENT MODULES */}
        {activeModule !== 'exam_transcripts' && (activeModule.startsWith('exam_') || activeModule === 'grading_system' || activeModule === 'score_conversion' || activeModule === 'enter_results' || activeModule === 'report_sheets') && (
          <ExaminationManager
            activeModule={activeModule}
            students={students}
            reports={reports}
            onUpdateReports={onUpdateReports}
            onNavigate={handleNavigate}
            subjects={subjects}
          />
        )}

        {/* 7. FEE MANAGEMENT MODULES */}
        {(activeModule.startsWith('fee_') || activeModule === 'fees' || activeModule === 'bills' || activeModule === 'payments' || activeModule === 'income_expenses' || activeModule === 'audit_activity' || activeModule === 'payment_settings' || activeModule === 'payment_channels' || activeModule === 'payment_proofs') && (
          <FeeManager
            activeModule={activeModule}
            students={students}
            bills={bills}
            payments={payments}
            classFeeTariffs={classFeeTariffs}
            onAddPayment={onAddPayment || (() => {})}
            onNavigate={handleNavigate}
            onAddNotification={onAddNotification}
          />
        )}

        {/* 8. NOTIFICATIONS & SMS & WHATSAPP & ACTIVITY LOGS MODULES */}
        {(activeModule.startsWith('notif_') || activeModule.startsWith('sms_') || activeModule.startsWith('whatsapp_') || activeModule.startsWith('logs_') || activeModule === 'send_notification' || activeModule === 'notification_history' || activeModule === 'compose_sms' || activeModule === 'sms_history' || activeModule === 'student_login_history' || activeModule === 'user_login_history' || activeModule === 'student_logins_history' || activeModule === 'user_logins_history' || activeModule === 'students_logins_history') && (
          <CommunicationLogsManager
            activeModule={activeModule}
            students={students}
            onNavigate={handleNavigate}
          />
        )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Clear Demo Data Confirmation Modal */}
      {showClearDemoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Clear Initial Demo Data?</h3>
                <p className="text-xs text-slate-500 font-medium">Permanent database reset for live deployment</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                This will permanently remove pre-stored sample records:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px] pl-1">
                <li>Demo students & admission records</li>
                <li>Demo teachers & faculty assignments</li>
                <li>Demo terminal reports, assessments & grades</li>
                <li>Demo fee bills, transactions & receipts</li>
                <li>Demo academic years, terms, classes, houses & subjects</li>
              </ul>
              <p className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 p-2 rounded-lg mt-2">
                ✓ Your Admin account, credentials, and custom system settings will be safely preserved.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearDemoModal(false)}
                disabled={isClearingDemo}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearDemoData}
                disabled={isClearingDemo}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors flex items-center gap-2"
              >
                {isClearingDemo ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Wiping Demo Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Permanently Clear All Demo Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Quick Action Speed Dial */}
      <QuickActionSpeedDial portalType="admin" onAction={handleQuickAction} />
    </div>
  );
}
