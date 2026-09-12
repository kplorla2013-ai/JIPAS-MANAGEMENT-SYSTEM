import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Student, Teacher, TermReport, StudentBill, PaymentRecord, CalendarEvent, NotificationItem, LoginLog,
  AcademicYearItem, TermItem, DepartmentItem, ClassItem, HouseItem, SubjectItem, ClassFeeTariffItem, ClassReportBroadcast,
  ThemePaletteConfig, CourseItem
} from './types';
import { INITIAL_LOGIN_LOGS } from './data/mockData';
import {
  getStoredStudents,
  getStoredTeachers,
  getStoredAcademicYears,
  getStoredTerms,
  getStoredDepartments,
  getStoredCourses,
  getStoredClasses,
  getStoredHouses,
  getStoredSubjects,
  getStoredReports,
  getStoredBills,
  getStoredPayments,
  getStoredCalendarEvents,
  getStoredNotifications,
  saveStoredStudents,
  saveStoredTeachers,
  saveStoredReports,
  saveStoredBills,
  saveStoredPayments,
  saveStoredAcademicYears,
  saveStoredTerms,
  saveStoredDepartments,
  saveStoredCourses,
  saveStoredClasses,
  saveStoredHouses,
  saveStoredSubjects,
  saveStoredCalendarEvents,
  saveStoredNotifications,
  getStoredUsers,
  getStoredClassFeeTariffs,
  getStoredClassBroadcasts,
  saveStoredClassBroadcasts
} from './services/storageService';
import LoginScreen from './components/LoginScreen';
import AdminPortal from './components/AdminPortal';
import TeacherPortal from './components/TeacherPortal';
import AccountantPortal from './components/AccountantPortal';
import StudentPortal from './components/StudentPortal';
import JIPASLogo from './components/common/JIPASLogo';
import LanguageSwitcher from './components/common/LanguageSwitcher';
import { useI18n } from './i18n/I18nContext';
import { LogOut, UserCheck, ShieldCheck, Shield, Calculator, BookOpen, UserCog, Database } from 'lucide-react';
import { 
  seedInitialDatabase, 
  subscribeStudents, 
  subscribeTeachers, 
  subscribeAcademicYears,
  subscribeTerms,
  subscribeDepartments,
  subscribeCourses,
  subscribeClasses,
  subscribeHouses,
  subscribeSubjects,
  subscribeReports, 
  subscribeBills, 
  subscribePayments,
  subscribeCalendarEvents,
  subscribeNotifications,
  saveStudent,
  deleteStudent,
  saveTeacher,
  deleteTeacher,
  saveAllAcademicYears,
  saveAllTerms,
  saveAllDepartments,
  saveAllCourses,
  saveAllClasses,
  saveAllHouses,
  saveAllSubjects,
  saveReport,
  saveBill,
  savePayment,
  saveCalendarEvent,
  saveNotification,
  signOutFirebaseUser,
  subscribeAuthState,
  getUserProfile,
  forceSyncCollections,
  subscribeClassFeeTariffs,
  subscribeClassBroadcasts,
  saveClassBroadcast,
  deleteBill,
  deleteReport,
  getStoredThemePalette,
  applyThemePaletteToDom,
  subscribeThemePalette,
  saveThemePalette
} from './services/dbService';

export default function App() {
  const { t } = useI18n();
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('jipas_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    return localStorage.getItem('jipas_session_id') || null;
  });
  const [dbSynced, setDbSynced] = useState(false);
  
  // App state - local-first persistence guarantees immediate data availability on refresh
  const [students, setStudents] = useState<Student[]>(() => getStoredStudents());
  const [teachers, setTeachers] = useState<Teacher[]>(() => getStoredTeachers());
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>(() => getStoredAcademicYears());
  const [terms, setTerms] = useState<TermItem[]>(() => getStoredTerms());
  const [departments, setDepartments] = useState<DepartmentItem[]>(() => getStoredDepartments());
  const [courses, setCourses] = useState<CourseItem[]>(() => getStoredCourses());
  const [classes, setClasses] = useState<ClassItem[]>(() => getStoredClasses());
  const [houses, setHouses] = useState<HouseItem[]>(() => getStoredHouses());
  const [subjects, setSubjects] = useState<SubjectItem[]>(() => getStoredSubjects());
  const [reports, setReports] = useState<TermReport[]>(() => getStoredReports());
  const [bills, setBills] = useState<StudentBill[]>(() => getStoredBills());
  const [payments, setPayments] = useState<PaymentRecord[]>(() => getStoredPayments());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => getStoredCalendarEvents());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getStoredNotifications());
  const [classFeeTariffs, setClassFeeTariffs] = useState<ClassFeeTariffItem[]>(() => getStoredClassFeeTariffs());
  const [broadcasts, setBroadcasts] = useState<ClassReportBroadcast[]>(() => getStoredClassBroadcasts());
  const [themePalette, setThemePalette] = useState<ThemePaletteConfig>(() => getStoredThemePalette());
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>(INITIAL_LOGIN_LOGS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddNotification = async (notif: NotificationItem) => {
    try {
      await saveNotification(notif);
      const updated = getStoredNotifications();
      setNotifications(updated);
      triggerToast('Notification sent successfully.');
    } catch (err) {
      console.warn('saveNotification error:', err);
      setNotifications(prev => [notif, ...prev]);
    }
  };

  // Initialize and subscribe to Firestore on mount
  useEffect(() => {
    // 1. Seed database with foundational data if collection is empty
    seedInitialDatabase().then(async () => {
      // Forced Sync Check: If app initialized but local data is empty, trigger a deep refetch from Firestore.
      // This ensures that if Device B has no data, it pulls everything from Device A's remote Firestore immediately.
      const localStudents = getStoredStudents();
      const localUsers = getStoredUsers();
      
      if (localStudents.length === 0 || localUsers.length === 0) {
        console.log('[App] Data sync check: No local records found. Triggering forced Firestore synchronization...');
        const syncSuccess = await forceSyncCollections();
        if (syncSuccess) {
          // Re-load state from storage after successful sync
          setStudents(getStoredStudents());
          setTeachers(getStoredTeachers());
          setAcademicYears(getStoredAcademicYears());
          setTerms(getStoredTerms());
          setDepartments(getStoredDepartments());
          setClasses(getStoredClasses());
          setHouses(getStoredHouses());
          setSubjects(getStoredSubjects());
          setReports(getStoredReports());
          setBills(getStoredBills());
          setPayments(getStoredPayments());
          setCalendarEvents(getStoredCalendarEvents());
          setNotifications(getStoredNotifications());
          console.log('[App] Local state re-hydrated from forced sync.');
        }
      }
      setDbSynced(true);
    }).catch((err) => {
      console.warn('Initial database seed notice:', err);
      setDbSynced(true);
    });

    // 2. Real-time subscriptions to Firestore collections
    const unsubStudents = subscribeStudents((data) => {
      setStudents(data);
    });

    const unsubTeachers = subscribeTeachers((data) => {
      setTeachers(data);
    });

    const unsubAy = subscribeAcademicYears((data) => {
      setAcademicYears(data);
    });

    const unsubTerms = subscribeTerms((data) => {
      setTerms(data);
    });

    const unsubDepts = subscribeDepartments((data) => {
      setDepartments(data);
    });

    const unsubCourses = subscribeCourses((data) => {
      setCourses(data);
    });

    const unsubClasses = subscribeClasses((data) => {
      setClasses(data);
    });

    const unsubHouses = subscribeHouses((data) => {
      setHouses(data);
    });

    const unsubSubjects = subscribeSubjects((data) => {
      setSubjects(data);
    });

    const unsubReports = subscribeReports((data) => {
      setReports(data);
    });

    const unsubBills = subscribeBills((data) => {
      setBills(data);
    });

    const unsubPayments = subscribePayments((data) => {
      setPayments(data);
    });

    const unsubEvents = subscribeCalendarEvents((data) => {
      setCalendarEvents(data);
    });

    const unsubNotifs = subscribeNotifications((data) => {
      setNotifications(data);
    });

    const unsubTariffs = subscribeClassFeeTariffs((data) => {
      setClassFeeTariffs(data);
    });

    const unsubBroadcasts = subscribeClassBroadcasts((data) => {
      setBroadcasts(data);
    });

    const unsubTheme = subscribeThemePalette((palette) => {
      if (palette) {
        setThemePalette(palette);
        applyThemePaletteToDom(palette);
      }
    });

    const unsubAuth = subscribeAuthState(async (fbUser) => {
      if (fbUser) {
        const profile = await getUserProfile(fbUser.uid);
        if (profile) {
          setCurrentUser(profile);
          setCurrentSessionId(prev => prev || `log-restored-${Date.now()}`);
          try {
            localStorage.setItem('jipas_current_user', JSON.stringify(profile));
          } catch (e) {
            console.warn('Could not store session in localStorage:', e);
          }
        }
      }
    });

    return () => {
      unsubStudents();
      unsubTeachers();
      unsubAy();
      unsubTerms();
      unsubDepts();
      unsubCourses();
      unsubClasses();
      unsubHouses();
      unsubSubjects();
      unsubReports();
      unsubBills();
      unsubPayments();
      unsubEvents();
      unsubNotifs();
      unsubTariffs();
      unsubBroadcasts();
      unsubTheme();
      unsubAuth();
    };
  }, []);

  const formatTimestamp = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const handleLogin = (user: User) => {
    const now = new Date();
    const timeFormatted = formatTimestamp(now);
    const logId = `log-${Date.now()}`;

    // Detect browser & device
    const ua = navigator.userAgent;
    let browser = 'Chrome';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edge') || ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

    let os = 'Windows 10';
    if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Macintosh')) os = 'macOS';

    const newLog: LoginLog = {
      id: logId,
      user: user.name,
      role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
      email: user.email,
      ipAddress: '154.162.113.93',
      device: window.innerWidth < 768 ? 'Mobile' : 'Desktop',
      browser: browser,
      os: os,
      loginTime: timeFormatted,
      logoutTime: 'Active Session',
      status: 'Success'
    };

    setLoginLogs(prev => [newLog, ...prev]);
    setCurrentSessionId(logId);
    setCurrentUser(user);

    // Save session to localStorage so refresh doesn't go back to login screen
    try {
      localStorage.setItem('jipas_current_user', JSON.stringify(user));
      localStorage.setItem('jipas_session_id', logId);
    } catch (e) {
      console.warn('Could not store session in localStorage:', e);
    }
  };

  const handleLogout = async () => {
    if (currentSessionId) {
      const now = new Date();
      const logoutFormatted = formatTimestamp(now);
      setLoginLogs(prev => prev.map(log => 
        log.id === currentSessionId ? { ...log, logoutTime: logoutFormatted } : log
      ));
    }
    await signOutFirebaseUser();
    setCurrentUser(null);
    setCurrentSessionId(null);
    try {
      localStorage.removeItem('jipas_current_user');
      localStorage.removeItem('jipas_session_id');
    } catch (e) {
      console.warn('Could not clear session in localStorage:', e);
    }
  };

  const handleAddStudent = async (newStudent: Student) => {
    try {
      // 1. Wait for Firestore persistence promise to resolve first (wait-for-completion)
      await saveStudent(newStudent);

      const newBill: StudentBill = {
        id: `bill-${Date.now()}`,
        studentId: newStudent.id,
        studentName: newStudent.fullName,
        admissionNo: newStudent.admissionNo,
        className: newStudent.className,
        academicYear: newStudent.academicYear || '2025-2026',
        term: newStudent.term || 'Third Term',
        items: [
          { name: 'Tuition Fee', amount: 350 },
          { name: 'Classes Fee', amount: 50 },
          { name: 'Bus-User Fee', amount: 200 },
          { name: 'Printing Fee', amount: 20 },
          { name: 'PTA Dues', amount: 50 },
          { name: 'Sports Levy', amount: 25 },
          { name: 'Clinic Levy', amount: 20 }
        ],
        subTotal: 715,
        arrears: 0,
        discount: 0,
        payable: 715,
        paid: 0,
        balance: 715,
        status: 'Unpaid'
      };
      await saveBill(newBill);

      const newReport: TermReport = {
        id: `rep-${Date.now()}`,
        studentId: newStudent.id,
        studentName: newStudent.fullName,
        admissionNo: newStudent.admissionNo,
        className: newStudent.className,
        academicYear: newStudent.academicYear || '2025-2026',
        term: newStudent.term || 'Third Term',
        attendancePresent: 65,
        attendanceTotal: 70,
        conduct: 'Good & respectful',
        attitude: 'Attentive and eager to learn',
        interest: 'Reading, Science and Football',
        teacherComment: 'A very promising student. Shows dedication to studies.',
        headmasterComment: 'Good performance. Keep up the high standard.',
        scores: [
          { subject: 'Mathematics', classScore: 26, examScore: 58, total: 84, grade: '1', remark: 'Higher' },
          { subject: 'English Language', classScore: 24, examScore: 54, total: 78, grade: '2', remark: 'Higher' },
          { subject: 'Integrated Science', classScore: 28, examScore: 60, total: 88, grade: '1', remark: 'Higher' },
          { subject: 'Computing', classScore: 25, examScore: 55, total: 80, grade: '1', remark: 'Higher' },
          { subject: 'Creative Arts', classScore: 27, examScore: 56, total: 83, grade: '1', remark: 'Higher' },
          { subject: 'Our World Our People', classScore: 25, examScore: 56, total: 81, grade: '1', remark: 'Higher' },
          { subject: 'Religious & Moral Edu.', classScore: 26, examScore: 54, total: 80, grade: '1', remark: 'Higher' }
        ],
        totalScore: 574,
        averageScore: 82.0,
        position: '3rd'
      };
      await saveReport(newReport);

      // 2. Force-sync UI state after confirmed persistence
      setStudents(getStoredStudents());
      setBills(getStoredBills());
      setReports(getStoredReports());
      triggerToast(`Student ${newStudent.fullName} successfully added and synced to Firestore!`);
    } catch (err: any) {
      console.error('handleAddStudent error:', err);
      triggerToast('Error saving student to backend database.');
    }
  };

  const handleUpdateStudent = async (student: Student) => {
    try {
      await saveStudent(student);
      setStudents(getStoredStudents());
      triggerToast(`Student ${student.fullName} updated and synced successfully.`);
    } catch (err) {
      console.error('handleUpdateStudent error:', err);
      triggerToast('Failed to update student.');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await deleteStudent(studentId);
      setStudents(getStoredStudents());
      triggerToast('Student deleted successfully from database.');
    } catch (err) {
      console.error('handleDeleteStudent error:', err);
      triggerToast('Failed to delete student.');
    }
  };

  const handleAddTeacher = async (teacher: Teacher) => {
    try {
      await saveTeacher(teacher);
      setTeachers(getStoredTeachers());
      triggerToast(`Teacher ${teacher.name} added and synced successfully.`);
    } catch (err) {
      console.error('handleAddTeacher error:', err);
      triggerToast('Failed to save teacher.');
    }
  };

  const handleUpdateTeacher = async (teacher: Teacher) => {
    try {
      await saveTeacher(teacher);
      setTeachers(getStoredTeachers());
      triggerToast(`Teacher ${teacher.name} updated successfully.`);
    } catch (err) {
      console.error('handleUpdateTeacher error:', err);
      triggerToast('Failed to update teacher.');
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    try {
      await deleteTeacher(teacherId);
      setTeachers(getStoredTeachers());
      triggerToast('Teacher removed successfully from database.');
    } catch (err) {
      console.error('handleDeleteTeacher error:', err);
      triggerToast('Failed to delete teacher.');
    }
  };

  const handleUpdateAcademicYears = async (newAys: AcademicYearItem[]) => {
    setAcademicYears(newAys);
    saveStoredAcademicYears(newAys);
    try {
      await saveAllAcademicYears(newAys);
    } catch (err) {
      console.warn('saveAllAcademicYears sync notice:', err);
    }
  };

  const handleUpdateTerms = async (newTerms: TermItem[]) => {
    setTerms(newTerms);
    saveStoredTerms(newTerms);
    try {
      await saveAllTerms(newTerms);
    } catch (err) {
      console.warn('saveAllTerms sync notice:', err);
    }
  };

  const handleUpdateDepartments = async (newDepts: DepartmentItem[]) => {
    setDepartments(newDepts);
    saveStoredDepartments(newDepts);
    try {
      await saveAllDepartments(newDepts);
    } catch (err) {
      console.warn('saveAllDepartments sync notice:', err);
    }
  };

  const handleUpdateCourses = async (newCourses: CourseItem[]) => {
    setCourses(newCourses);
    saveStoredCourses(newCourses);
    try {
      await saveAllCourses(newCourses);
    } catch (err) {
      console.warn('saveAllCourses sync notice:', err);
    }
  };

  const handleUpdateClasses = async (newClasses: ClassItem[]) => {
    setClasses(newClasses);
    saveStoredClasses(newClasses);
    try {
      await saveAllClasses(newClasses);
    } catch (err) {
      console.warn('saveAllClasses sync notice:', err);
    }
  };

  const handleUpdateHouses = async (newHouses: HouseItem[]) => {
    setHouses(newHouses);
    saveStoredHouses(newHouses);
    try {
      await saveAllHouses(newHouses);
    } catch (err) {
      console.warn('saveAllHouses sync notice:', err);
    }
  };

  const handleUpdateSubjects = async (newSubjects: SubjectItem[]) => {
    setSubjects(newSubjects);
    saveStoredSubjects(newSubjects);
    try {
      await saveAllSubjects(newSubjects);
    } catch (err) {
      console.warn('saveAllSubjects sync notice:', err);
    }
  };

  const handleAddEvent = async (newEvent: CalendarEvent) => {
    setCalendarEvents(prev => {
      const updated = [newEvent, ...prev];
      saveStoredCalendarEvents(updated);
      return updated;
    });
    try {
      await saveCalendarEvent(newEvent);
    } catch (err) {
      console.warn('saveCalendarEvent sync notice:', err);
    }
  };

  const handleAddPayment = async (newPayment: PaymentRecord) => {
    setPayments(prev => {
      const updated = [newPayment, ...prev];
      saveStoredPayments(updated);
      return updated;
    });
    try {
      await savePayment(newPayment);
    } catch (err) {
      console.warn('savePayment sync notice:', err);
    }

    // Real-time synchronization with StudentBill:
    let updatedTargetBill: StudentBill | null = null;
    const updatedBills = bills.map(bill => {
      if (bill.studentId === newPayment.studentId || bill.admissionNo === newPayment.admissionNo) {
        const newPaid = bill.paid + newPayment.paid;
        const newBal = Math.max(0, bill.payable - newPaid);
        const newStatus = newBal === 0 ? 'Fully Paid' : (newPaid > 0 ? 'Partially Paid' : 'Unpaid');
        const b = {
          ...bill,
          paid: newPaid,
          balance: newBal,
          status: newStatus as any
        };
        updatedTargetBill = b;
        return b;
      }
      return bill;
    });

    setBills(updatedBills);
    saveStoredBills(updatedBills);
    if (updatedTargetBill) {
      try {
        await saveBill(updatedTargetBill);
      } catch (err) {
        console.warn('saveBill after payment sync notice:', err);
      }
    }
  };

  const handleUpdateReports = async (updatedReports: TermReport[]) => {
    setReports(updatedReports);
    saveStoredReports(updatedReports);
    for (const r of updatedReports) {
      try {
        await saveReport(r);
      } catch (err) {
        console.warn('saveReport sync notice:', err);
      }
    }
  };

  const handleCleanOrphanedRecords = async () => {
    const validStudentIds = new Set(students.map(s => s.id));
    const validAdmissionNos = new Set(students.map(s => s.admissionNo.toLowerCase().trim()).filter(Boolean));

    const isStudentAlive = (studentId?: string, admissionNo?: string) => {
      if (studentId && validStudentIds.has(studentId)) return true;
      if (admissionNo && validAdmissionNos.has(admissionNo.toLowerCase().trim())) return true;
      return false;
    };

    const orphanedBills = bills.filter(b => !isStudentAlive(b.studentId, b.admissionNo));
    const orphanedReports = reports.filter(r => !isStudentAlive(r.studentId, r.admissionNo));

    if (orphanedBills.length === 0 && orphanedReports.length === 0) {
      return { cleanedBillsCount: 0, cleanedReportsCount: 0, totalCleaned: 0 };
    }

    const nextBills = bills.filter(b => isStudentAlive(b.studentId, b.admissionNo));
    const nextReports = reports.filter(r => isStudentAlive(r.studentId, r.admissionNo));

    setBills(nextBills);
    saveStoredBills(nextBills);

    setReports(nextReports);
    saveStoredReports(nextReports);

    for (const b of orphanedBills) {
      try {
        await deleteBill(b.id);
      } catch (err) {
        console.error('Failed to delete orphaned bill:', err);
      }
    }
    for (const r of orphanedReports) {
      try {
        await deleteReport(r.id);
      } catch (err) {
        console.error('Failed to delete orphaned report:', err);
      }
    }

    triggerToast(`Quick Clean: Removed ${orphanedBills.length} orphaned bills and ${orphanedReports.length} orphaned reports.`);
    return {
      cleanedBillsCount: orphanedBills.length,
      cleanedReportsCount: orphanedReports.length,
      totalCleaned: orphanedBills.length + orphanedReports.length
    };
  };

  const handleUpdateSingleReport = async (updatedReport: TermReport) => {
    setReports(prev => {
      const updated = prev.map(r => r.id === updatedReport.id ? updatedReport : r);
      saveStoredReports(updated);
      return updated;
    });
    try {
      await saveReport(updatedReport);
    } catch (err) {
      console.warn('saveReport sync notice:', err);
    }
  };

  const handleUpdateBroadcasts = async (updatedBroadcasts: ClassReportBroadcast[]) => {
    setBroadcasts(updatedBroadcasts);
    saveStoredClassBroadcasts(updatedBroadcasts);
    for (const b of updatedBroadcasts) {
      try {
        await saveClassBroadcast(b);
      } catch (err) {
        console.warn('saveClassBroadcast sync notice:', err);
      }
    }
  };

  const handleRestoreData = async (data: {
    students?: Student[];
    teachers?: Teacher[];
    reports?: TermReport[];
    bills?: StudentBill[];
    payments?: PaymentRecord[];
  }) => {
    if (data.students && Array.isArray(data.students)) {
      setStudents(data.students);
      saveStoredStudents(data.students);
    }
    if (data.teachers && Array.isArray(data.teachers)) {
      setTeachers(data.teachers);
      saveStoredTeachers(data.teachers);
    }
    if (data.reports && Array.isArray(data.reports)) {
      setReports(data.reports);
      saveStoredReports(data.reports);
    }
    if (data.bills && Array.isArray(data.bills)) {
      setBills(data.bills);
      saveStoredBills(data.bills);
    }
    if (data.payments && Array.isArray(data.payments)) {
      setPayments(data.payments);
      saveStoredPayments(data.payments);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <LoginScreen 
              onLogin={handleLogin} 
              studentsList={students.map(s => ({ 
                id: s.id, 
                name: s.fullName, 
                admissionNo: s.admissionNo,
                parentPhone: s.parentPhone
              }))}
              teachersList={teachers.map(t => ({
                id: t.id,
                name: t.name,
                email: t.email,
                classAssigned: t.classesTeaching?.[0]
              }))}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Find active student record if role is student
  const activeStudent = students.find(s => s.id === currentUser.id || s.admissionNo === currentUser.admissionNo) || students[0];
  const activeTeacher = teachers.find(t => t.email === currentUser.email) || teachers[0];

  return (
    <div 
      className="min-h-screen flex flex-col font-sans relative overflow-x-hidden selection:bg-blue-600 selection:text-white"
      style={{
        backgroundColor: themePalette.backgroundColor,
        color: themePalette.textColor
      }}
    >
      {/* Ambient glowing wave graphics matching theme design */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top subtle blue glow */}
        <div 
          className="absolute -top-40 left-1/4 w-[600px] h-[350px] rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: themePalette.primaryColor }}
        />
        {/* Bottom right futuristic silk wave glow */}
        <div className="absolute -bottom-24 right-0 w-[800px] h-[500px] bg-gradient-to-tl from-blue-700/20 via-indigo-600/15 to-purple-600/10 blur-3xl rounded-full" />
        <svg className="absolute bottom-0 right-0 w-full max-w-4xl h-96 opacity-40 mix-blend-screen" viewBox="0 0 1000 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 400 C 300 350, 500 200, 1000 250 L 1000 400 L 0 400 Z" fill="url(#wave-grad-1)" />
          <path d="M100 400 C 400 320, 700 150, 1000 180 L 1000 400 L 100 400 Z" fill="url(#wave-grad-2)" opacity="0.6" />
          <defs>
            <linearGradient id="wave-grad-1" x1="0" y1="200" x2="1000" y2="400" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#2563eb" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="wave-grad-2" x1="100" y1="150" x2="1000" y2="400" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#9333ea" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B142A] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border border-blue-800/60 animate-fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navbar */}
      <header 
        className="border-b sticky top-0 z-40 backdrop-blur-md shadow-lg shadow-black/20"
        style={{
          backgroundColor: `${themePalette.headerBgColor || themePalette.cardBackgroundColor}f2`,
          borderColor: `${themePalette.primaryColor}30`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <JIPASLogo size="md" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                {t('app.name', 'JIPAS')}
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-indigo-400 truncate">
                  {t('app.subtitle', 'Système de Gestion Scolaire • Fondé en 1990')}
                </p>
                {dbSynced && (
                  <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full whitespace-nowrap">
                    <Database className="w-2.5 h-2.5 text-emerald-400" />
                    {t('app.dbSynced', 'Firestore Synced')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Top Navigation Language Switcher for all users */}
            <LanguageSwitcher />

            {/* Role Badge */}
            <div className="hidden sm:flex items-center gap-2 bg-[#0B142A] px-3.5 py-1.5 rounded-xl border border-blue-900/50 text-xs font-bold text-slate-200 shadow-inner">
              {currentUser.role === 'admin' && <ShieldCheck className="w-4 h-4 text-rose-500" />}
              {currentUser.role === 'sub_admin' && <Shield className="w-4 h-4 text-amber-400" />}
              {currentUser.role === 'teacher' && <UserCheck className="w-4 h-4 text-emerald-400" />}
              {currentUser.role === 'accountant' && <Calculator className="w-4 h-4 text-cyan-400" />}
              {currentUser.role === 'student' && <BookOpen className="w-4 h-4 text-indigo-400" />}
              {currentUser.role === 'clerk' && <UserCog className="w-4 h-4 text-purple-400" />}
              <span className="capitalize">{t('app.role', 'Rôle')}: {t(`app.role.${currentUser.role}`, currentUser.role === 'admin' ? 'Administrateur' : currentUser.role)}</span>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-800/80 pl-3 sm:pl-4">
              <div className="text-right hidden md:block">
                <span className="block text-sm font-bold text-white">{currentUser.name}</span>
                <span className="block text-xs text-slate-400">{currentUser.email}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-md shadow-blue-500/20 shrink-0">
                <div className="w-full h-full rounded-full bg-[#070D1E] flex items-center justify-center overflow-hidden">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-black text-blue-400">{currentUser.name?.charAt(0) || 'U'}</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                id="header-logout-btn"
                title={t('app.logout', 'Logout')}
                className="flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 px-3 py-2 rounded-xl text-xs font-bold border border-rose-900/50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span className="hidden sm:inline">{t('app.logout', 'Déconnexion')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentUser.role}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {(currentUser.role === 'admin' || currentUser.role === 'sub_admin' || currentUser.role === 'clerk') && (
              <AdminPortal
                currentUser={currentUser}
                themePalette={themePalette}
                onUpdateThemePalette={(newPalette) => {
                  setThemePalette(newPalette);
                  saveThemePalette(newPalette);
                }}
                students={students}
                teachers={teachers}
                academicYears={academicYears}
                terms={terms}
                departments={departments}
                courses={courses}
                classes={classes}
                houses={houses}
                subjects={subjects}
                reports={reports}
                bills={bills}
                payments={payments}
                calendarEvents={calendarEvents}
                notifications={notifications}
                classFeeTariffs={classFeeTariffs}
                broadcasts={broadcasts}
                loginLogs={loginLogs}
                onAddStudent={handleAddStudent}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
                onAddTeacher={handleAddTeacher}
                onUpdateTeacher={handleUpdateTeacher}
                onDeleteTeacher={handleDeleteTeacher}
                onUpdateAcademicYears={handleUpdateAcademicYears}
                onUpdateTerms={handleUpdateTerms}
                onUpdateDepartments={handleUpdateDepartments}
                onUpdateCourses={handleUpdateCourses}
                onUpdateClasses={handleUpdateClasses}
                onUpdateHouses={handleUpdateHouses}
                onUpdateSubjects={handleUpdateSubjects}
                onAddEvent={handleAddEvent}
                onAddPayment={handleAddPayment}
                onUpdateReports={handleUpdateReports}
                onUpdateBroadcasts={handleUpdateBroadcasts}
                onAddNotification={handleAddNotification}
                onRestoreData={handleRestoreData}
                onLogout={handleLogout}
                onCleanOrphaned={handleCleanOrphanedRecords}
              />
            )}

            {currentUser.role === 'teacher' && (
              <TeacherPortal
                teacher={activeTeacher}
                students={students}
                teachers={teachers}
                reports={reports}
                bills={bills}
                payments={payments}
                calendarEvents={calendarEvents}
                notifications={notifications}
                broadcasts={broadcasts}
                onUpdateReport={handleUpdateSingleReport}
                onUpdateBroadcasts={handleUpdateBroadcasts}
                onAddStudent={handleAddStudent}
                onRestoreData={handleRestoreData}
                onLogout={handleLogout}
              />
            )}

            {currentUser.role === 'accountant' && (
              <AccountantPortal
                bills={bills}
                payments={payments}
                students={students}
                onAddPayment={handleAddPayment}
                onAddNotification={handleAddNotification}
                onUpdateBills={(updatedBills) => {
                  setBills(updatedBills);
                  saveStoredBills(updatedBills);
                }}
                onLogout={handleLogout}
              />
            )}

            {currentUser.role === 'student' && (
              <StudentPortal
                student={activeStudent}
                reports={reports}
                bills={bills}
                payments={payments}
                calendarEvents={calendarEvents}
                notifications={notifications}
                broadcasts={broadcasts}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-[#040814]/90 border-t border-slate-800/60 py-6 text-center text-xs text-slate-400 relative z-10">
        <p>© 2026 JIPAS. All rights reserved. Powered by Academy Cloud Services & Firebase Firestore.</p>
      </footer>
    </div>
  );
}
