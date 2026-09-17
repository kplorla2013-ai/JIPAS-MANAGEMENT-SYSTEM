import React, { useState, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Student, 
  StudentBill, 
  PaymentRecord, 
  SchoolExpenseRecord,
  SecretaryDailySummary,
  CalendarEvent,
  NotificationItem
} from '../types';
import { 
  getStoredExpenses, 
  saveStoredExpenses,
  getStoredSecretarySummaries,
  saveStoredSecretarySummaries,
  getStoredDepartments,
  getStoredClasses
} from '../services/storageService';
import { saveStudent } from '../services/dbService';
import JIPASLogo from './common/JIPASLogo';
import QuickActionSpeedDial from './common/QuickActionSpeedDial';
import ExpenseManager from './common/ExpenseManager';
import BankDepositManager from './common/BankDepositManager';
import PhotoUploader from './common/PhotoUploader';
import OverdueFeeAlertsManager from './admin/OverdueFeeAlertsManager';
import { 
  DollarSign, 
  Receipt, 
  Search, 
  Plus, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  FileText, 
  Printer, 
  Layers, 
  AlertCircle, 
  ArrowUpRight, 
  TrendingUp, 
  QrCode, 
  Download, 
  UserCheck, 
  Wallet, 
  Sparkles,
  ShieldCheck,
  Building,
  RefreshCw,
  CreditCard,
  Send,
  Eye,
  X,
  Phone,
  BookOpen,
  Users,
  Building2,
  User as UserIcon,
  UserPlus,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface SecretaryPortalProps {
  secretary: User;
  students: Student[];
  bills: StudentBill[];
  payments: PaymentRecord[];
  calendarEvents?: CalendarEvent[];
  notifications?: NotificationItem[];
  onAddPayment: (payment: PaymentRecord) => void;
  onAddNotification?: (notif: NotificationItem) => void;
  onAddStudent?: (newStudent: Student) => void;
  onUpdateBills?: (bills: StudentBill[]) => void;
  onLogout?: () => void;
}

type SecretaryActiveTab = 
  | 'fee_collection' 
  | 'expenses' 
  | 'daily_reconcile' 
  | 'students_lookup' 
  | 'bank_deposits'
  | 'enroll_student'
  | 'overdue_alerts'
  | 'collections_log';

export default function SecretaryPortal({
  secretary,
  students,
  bills,
  payments,
  calendarEvents = [],
  notifications = [],
  onAddPayment,
  onAddNotification,
  onAddStudent,
  onUpdateBills,
  onLogout
}: SecretaryPortalProps) {
  const [activeTab, setActiveTab] = useState<SecretaryActiveTab>('fee_collection');
  const [expenses, setExpenses] = useState<SchoolExpenseRecord[]>(() => getStoredExpenses());
  const [summaries, setSummaries] = useState<SecretaryDailySummary[]>(() => getStoredSecretarySummaries());

  // Enroll New Student State
  const [enrollmentActiveTab, setEnrollmentActiveTab] = useState<'form' | 'submissions'>('form');
  const [enrollFullName, setEnrollFullName] = useState('');
  const [enrollGender, setEnrollGender] = useState<'Male' | 'Female'>('Male');
  const [enrollDob, setEnrollDob] = useState('2020-05-15');
  const [enrollDepartment, setEnrollDepartment] = useState('Primary School');
  const [enrollClassName, setEnrollClassName] = useState('Basic 1');
  const [enrollHouse, setEnrollHouse] = useState('Blue');
  const [enrollParentName, setEnrollParentName] = useState('');
  const [enrollParentPhone, setEnrollParentPhone] = useState('');
  const [enrollPhoto, setEnrollPhoto] = useState('');
  const [enrollNotes, setEnrollNotes] = useState('');
  const [isSubmittingEnrollment, setIsSubmittingEnrollment] = useState(false);
  const [enrollmentToast, setEnrollmentToast] = useState<string | null>(null);

  // Payment Collections Log states
  const [collectionsSearchQuery, setCollectionsSearchQuery] = useState('');
  const [collectionsFilterDepartment, setCollectionsFilterDepartment] = useState('All');
  const [collectionsFilterClass, setCollectionsFilterClass] = useState('All');
  const [collectionsFilterMethod, setCollectionsFilterMethod] = useState('All');
  const [collectionsFilterDateRange, setCollectionsFilterDateRange] = useState<'All' | 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'Custom'>('All');
  const [collectionsFilterStartDate, setCollectionsFilterStartDate] = useState('');
  const [collectionsFilterEndDate, setCollectionsFilterEndDate] = useState('');
  const [collectionsFilterPaymentStatus, setCollectionsFilterPaymentStatus] = useState<'All' | 'Completed' | 'Pending'>('All');
  const [collectionsSortBy, setCollectionsSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'name_asc' | 'class_asc'>('date_desc');

  // Fee Collection State
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Mobile Money' | 'Bank Transfer'>('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [collectedByName, setCollectedByName] = useState(secretary.name || 'Front Desk Secretary');
  const [lastIssuedReceipt, setLastIssuedReceipt] = useState<PaymentRecord | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Secretary Student Enrollment Submission (Pending Admin Approval)
  const handleSubmitSecretaryEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollFullName.trim() || !enrollParentPhone.trim()) {
      alert('Please fill out the Student Full Name and Parent Phone number.');
      return;
    }

    setIsSubmittingEnrollment(true);
    try {
      const newStudent: Student = {
        id: `st-enroll-${Date.now()}`,
        name: enrollFullName.trim().toUpperCase(),
        fullName: enrollFullName.trim().toUpperCase(),
        gender: enrollGender,
        dob: enrollDob,
        department: enrollDepartment,
        className: enrollClassName,
        rollNo: String(students.filter(s => s.className === enrollClassName).length + 1),
        house: enrollHouse,
        parentName: enrollParentName.trim() || 'Parent',
        parentPhone: enrollParentPhone.trim(),
        admissionNo: `ADM/26/${String(students.length + 1).padStart(4, '0')}`,
        academicYear: '2026/2027',
        term: 'Term 1',
        isCurrent: true,
        enrollmentDate: new Date().toISOString().split('T')[0],
        photo: enrollPhoto || (enrollGender === 'Male' 
          ? 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80'),
        status: 'Pending',
        approvalStatus: 'Pending',
        isApproved: false,
        enrolledBy: `${secretary.name} (Secretary)`,
        submissionDate: new Date().toISOString().split('T')[0]
      };

      // Save student to Firestore database for cross-device synchronization
      await saveStudent(newStudent);

      if (onAddStudent) {
        onAddStudent(newStudent);
      }

      setEnrollmentToast(`Student application for "${newStudent.fullName}" submitted successfully! It is awaiting Admin/Headmaster approval.`);
      
      // Reset form
      setEnrollFullName('');
      setEnrollParentName('');
      setEnrollParentPhone('');
      setEnrollPhoto('');
      setEnrollNotes('');
      setEnrollmentActiveTab('submissions');
      setTimeout(() => setEnrollmentToast(null), 5000);
    } catch (err) {
      console.error('Failed to submit student enrollment:', err);
      alert('Failed to submit enrollment. Please check connection and try again.');
    } finally {
      setIsSubmittingEnrollment(false);
    }
  };

  // Hierarchical Filter States for Fee Payment
  const [paymentDept, setPaymentDept] = useState<string>('All');
  const [customDeptInput, setCustomDeptInput] = useState<string>('');
  const [paymentClass, setPaymentClass] = useState<string>('All');
  const [studentRosterSearch, setStudentRosterSearch] = useState<string>('');

  // Extract departments from stored data and student records
  const availableDepartments = useMemo(() => {
    const stored = getStoredDepartments().map(d => d.name);
    const fromStudents = students.map(s => s.department).filter(Boolean);
    const list = Array.from(new Set([...stored, ...fromStudents]));
    return list.length > 0 ? list : ['Pre School', 'Primary School', 'Junior High School', 'Senior High School'];
  }, [students]);

  // Extract classes (filtered by selected department if not 'All')
  const availableClasses = useMemo(() => {
    const allStoredClasses = getStoredClasses();
    const effectiveDept = customDeptInput.trim() || paymentDept;
    
    if (effectiveDept && effectiveDept !== 'All') {
      const matchingStored = allStoredClasses.filter(c => {
        const deptItem = getStoredDepartments().find(d => d.name === effectiveDept || d.name === c.department || d.id === (c as any).departmentId);
        return (c.department && c.department.toLowerCase() === effectiveDept.toLowerCase()) ||
               (deptItem && (c as any).departmentId === deptItem.id) ||
               ((c as any).departmentName === effectiveDept);
      }).map(c => c.name);

      const matchingFromStudents = students
        .filter(s => (s.department && s.department.toLowerCase() === effectiveDept.toLowerCase()))
        .map(s => s.currentClass || s.className)
        .filter(Boolean);

      let classList = Array.from(new Set([...matchingStored, ...matchingFromStudents]));

      if (classList.length === 0) {
        const lower = effectiveDept.toLowerCase();
        if (lower.includes('primary')) {
          classList = ['Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6'];
        } else if (lower.includes('junior') || lower.includes('jhs')) {
          classList = ['JHS 1', 'JHS 2', 'JHS 3'];
        } else if (lower.includes('pre') || lower.includes('nursery') || lower.includes('creche') || lower.includes('kg')) {
          classList = ['Creche', 'Nursery 1', 'Nursery 2', 'KG 1', 'KG 2'];
        } else if (lower.includes('senior') || lower.includes('shs')) {
          classList = ['SHS 1', 'SHS 2', 'SHS 3'];
        }
      }

      if (classList.length > 0) return classList;
    }

    const allStudentClasses = students.map(s => s.currentClass || s.className).filter(Boolean);
    return Array.from(new Set([...allStoredClasses.map(c => c.name), ...allStudentClasses]));
  }, [students, paymentDept, customDeptInput]);

  // Filtered students for fee payment based on department, class, and name search
  const filteredStudentsForPayment = useMemo(() => {
    const effectiveDept = customDeptInput.trim() || paymentDept;

    return students.filter(st => {
      // Department filter
      if (effectiveDept && effectiveDept !== 'All') {
        const deptMatches = 
          (st.department && st.department.toLowerCase().includes(effectiveDept.toLowerCase())) ||
          (effectiveDept.toLowerCase().includes('primary') && (st.currentClass || st.className)?.toLowerCase().includes('basic')) ||
          (effectiveDept.toLowerCase().includes('junior') && (st.currentClass || st.className)?.toLowerCase().includes('jhs')) ||
          (effectiveDept.toLowerCase().includes('pre') && ((st.currentClass || st.className)?.toLowerCase().includes('kg') || (st.currentClass || st.className)?.toLowerCase().includes('nursery') || (st.currentClass || st.className)?.toLowerCase().includes('creche'))) ||
          (effectiveDept.toLowerCase().includes('senior') && (st.currentClass || st.className)?.toLowerCase().includes('shs'));
        if (!deptMatches) return false;
      }

      // Class level filter
      if (paymentClass !== 'All') {
        if ((st.currentClass || st.className) !== paymentClass) return false;
      }

      // Search query (search students by name, admission no, or roll no)
      if (studentRosterSearch.trim()) {
        const query = studentRosterSearch.toLowerCase();
        const matchesName = (st.name || st.fullName || '').toLowerCase().includes(query);
        const matchesAdm = (st.admissionNo || '').toLowerCase().includes(query);
        const matchesRoll = (st.rollNo || '').toLowerCase().includes(query);
        if (!matchesName && !matchesAdm && !matchesRoll) return false;
      }

      return true;
    });
  }, [students, paymentDept, customDeptInput, paymentClass, studentRosterSearch]);

  const handleStudentSelect = (studentId: string) => {
    const foundStudent = students.find(s => s.id === studentId);
    if (!foundStudent) return;
    setSelectedStudent(foundStudent);
    
    const studentBills = bills.filter(b => b.studentId === studentId);
    const totalBilled = studentBills.reduce((acc, b) => acc + b.amount, 0);
    const studentPayments = payments.filter(p => p.studentId === studentId && p.status === 'Completed');
    const totalPaid = studentPayments.reduce((acc, p) => acc + p.amount, 0);
    const arrears = Math.max(0, totalBilled - totalPaid);

    if (arrears > 0) {
      setPaymentAmount(arrears.toString());
    } else {
      setPaymentAmount('715');
    }
  };

  // Daily Handover State
  const [handoverNotes, setHandoverNotes] = useState('');
  const [isHandoverSubmitted, setIsHandoverSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtered student list for search
  const filteredStudents = useMemo(() => {
    if (!searchStudentQuery.trim()) return [];
    const query = searchStudentQuery.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.admissionNo.toLowerCase().includes(query) ||
      (s.currentClass && s.currentClass.toLowerCase().includes(query)) ||
      (s.parentPhone && s.parentPhone.includes(query))
    ).slice(0, 8);
  }, [students, searchStudentQuery]);

  // Selected student's financial overview
  const studentFinancials = useMemo(() => {
    if (!selectedStudent) return null;
    const studentBills = bills.filter(b => b.studentId === selectedStudent.id);
    const totalBilled = studentBills.reduce((acc, b) => acc + b.amount, 0);
    const studentPayments = payments.filter(p => p.studentId === selectedStudent.id && p.status === 'Completed');
    const totalPaid = studentPayments.reduce((acc, p) => acc + p.amount, 0);
    const outstandingArrears = Math.max(0, totalBilled - totalPaid);

    return {
      bills: studentBills,
      payments: studentPayments,
      totalBilled,
      totalPaid,
      outstandingArrears
    };
  }, [selectedStudent, bills, payments]);

  // Today's collections by this secretary
  const todaySecretaryPayments = useMemo(() => {
    return payments.filter(p => {
      const isToday = p.date === todayStr;
      const isSecretary = p.receivedBy?.toLowerCase().includes('secretary') || 
                          p.receivedBy?.toLowerCase().includes(secretary.name.toLowerCase()) ||
                          p.collectorRole === 'secretary';
      return isToday && isSecretary;
    });
  }, [payments, todayStr, secretary.name]);

  const totalFeesCollectedToday = useMemo(() => {
    return todaySecretaryPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [todaySecretaryPayments]);

  const collectionsAvailableDepartments = useMemo(() => {
    return ['All', ...availableDepartments];
  }, [availableDepartments]);

  // Financial Dashboard Totals for Secretary (in GH₵)
  const totalCollections = useMemo(() => bills.reduce((sum, b) => sum + (b.paid || 0), 0), [bills]);
  const totalOutstanding = useMemo(() => bills.reduce((sum, b) => sum + (b.balance || 0), 0), [bills]);

  // Group bills by class for the dashboard bar chart
  const barDataByClass = useMemo(() => {
    const groups: { [className: string]: { class: string; collected: number; outstanding: number } } = {};
    bills.forEach(b => {
      const cls = b.className || 'Unknown';
      if (!groups[cls]) {
        groups[cls] = { class: cls, collected: 0, outstanding: 0 };
      }
      groups[cls].collected += b.paid || 0;
      groups[cls].outstanding += b.balance || 0;
    });
    // Return top 6-8 classes to prevent overcrowding in the visual chart
    return Object.values(groups).slice(0, 6);
  }, [bills]);

  const collectionsAvailableClasses = useMemo(() => {
    return ['All', ...availableClasses];
  }, [availableClasses]);

  const filteredCollectionsPayments = useMemo(() => {
    return payments
      .filter(p => {
        // Search query
        const q = collectionsSearchQuery.trim().toLowerCase();
        const matchesQuery = !q || 
          p.studentName.toLowerCase().includes(q) ||
          p.admissionNo.toLowerCase().includes(q) ||
          (p.receiptNo && p.receiptNo.toLowerCase().includes(q));

        if (!matchesQuery) return false;

        // Department filter
        if (collectionsFilterDepartment !== 'All') {
          const student = students.find(s => s.id === p.studentId || s.admissionNo === p.admissionNo);
          const dept = p.department || student?.department || 'General';
          if (dept.toLowerCase() !== collectionsFilterDepartment.toLowerCase()) return false;
        }

        // Class filter
        if (collectionsFilterClass !== 'All') {
          if (p.className.toLowerCase() !== collectionsFilterClass.toLowerCase()) return false;
        }

        // Method filter
        if (collectionsFilterMethod !== 'All') {
          if (p.method && p.method.toLowerCase() !== collectionsFilterMethod.toLowerCase()) return false;
          if (p.paymentMethod && p.paymentMethod.toLowerCase() !== collectionsFilterMethod.toLowerCase()) return false;
        }

        // Payment status filter
        if (collectionsFilterPaymentStatus !== 'All') {
          const statusValue = p.status || 'Completed';
          if (statusValue.toLowerCase() !== collectionsFilterPaymentStatus.toLowerCase()) return false;
        }

        // Date range filter
        if (collectionsFilterDateRange !== 'All') {
          const pDate = new Date(p.date);
          const today = new Date();
          const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const dPayment = new Date(pDate.getFullYear(), pDate.getMonth(), pDate.getDate());

          if (collectionsFilterDateRange === 'Today') {
            if (dPayment.getTime() !== dToday.getTime()) return false;
          } else if (collectionsFilterDateRange === 'Yesterday') {
            const dYesterday = new Date(dToday);
            dYesterday.setDate(dYesterday.getDate() - 1);
            if (dPayment.getTime() !== dYesterday.getTime()) return false;
          } else if (collectionsFilterDateRange === 'This Week') {
            const oneWeekAgo = new Date(dToday);
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            if (dPayment.getTime() < oneWeekAgo.getTime() || dPayment.getTime() > dToday.getTime()) return false;
          } else if (collectionsFilterDateRange === 'This Month') {
            if (pDate.getFullYear() !== today.getFullYear() || pDate.getMonth() !== today.getMonth()) return false;
          } else if (collectionsFilterDateRange === 'Custom') {
            if (collectionsFilterStartDate) {
              const start = new Date(collectionsFilterStartDate);
              const dStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
              if (dPayment.getTime() < dStart.getTime()) return false;
            }
            if (collectionsFilterEndDate) {
              const end = new Date(collectionsFilterEndDate);
              const dEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
              if (dPayment.getTime() > dEnd.getTime()) return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (collectionsSortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (collectionsSortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (collectionsSortBy === 'amount_desc') return (b.amount || b.paid) - (a.amount || a.paid);
        if (collectionsSortBy === 'amount_asc') return (a.amount || a.paid) - (b.amount || b.paid);
        if (collectionsSortBy === 'name_asc') return a.studentName.localeCompare(b.studentName);
        if (collectionsSortBy === 'class_asc') return a.className.localeCompare(b.className);
        return 0;
      });
  }, [payments, students, collectionsSearchQuery, collectionsFilterDepartment, collectionsFilterClass, collectionsFilterMethod, collectionsFilterDateRange, collectionsFilterStartDate, collectionsFilterEndDate, collectionsFilterPaymentStatus, collectionsSortBy]);

  // Today's expenses logged by this secretary
  const todaySecretaryExpenses = useMemo(() => {
    return expenses.filter(e => {
      const isToday = e.date === todayStr;
      const isSecretary = e.recorderRole === 'secretary' || e.recordedBy?.toLowerCase().includes(secretary.name.toLowerCase());
      return isToday && isSecretary && e.status !== 'Void';
    });
  }, [expenses, todayStr, secretary.name]);

  const totalExpensesLoggedToday = useMemo(() => {
    return todaySecretaryExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [todaySecretaryExpenses]);

  // Net Cash on Hand
  const netCashOnHand = useMemo(() => {
    return totalFeesCollectedToday - totalExpensesLoggedToday;
  }, [totalFeesCollectedToday, totalExpensesLoggedToday]);

  // Handle Recording Student Fee Payment
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Please search and select a student first.');
      return;
    }

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid payment amount greater than 0.');
      return;
    }

    const receiptNo = `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const newPayment: PaymentRecord = {
      id: `pmt-sec-${Date.now()}`,
      receiptNo,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name || selectedStudent.fullName || 'Student',
      admissionNo: selectedStudent.admissionNo,
      className: selectedStudent.currentClass || selectedStudent.className || 'Basic 1',
      classAssigned: selectedStudent.currentClass || selectedStudent.className,
      amount: amountNum,
      paid: amountNum,
      method: (paymentMethod as any) || 'Cash',
      date: todayStr,
      paymentMethod,
      referenceNo: paymentReference.trim() || `SEC-${Date.now().toString().slice(-6)}`,
      receivedBy: `${secretary.name} (Secretary Desk)`,
      collectorRole: 'secretary',
      status: 'Completed',
      notes: paymentNotes.trim() || 'Paid at Secretarial Front Desk',
      academicYear: '2025-2026',
      term: 'Third Term'
    };

    onAddPayment(newPayment);
    setLastIssuedReceipt(newPayment);
    setShowReceiptModal(true);
    showToast(`Payment of GH₵ ${(amountNum || 0).toFixed(2)} received for ${selectedStudent.name}.`);

    // Reset Form
    setPaymentAmount('');
    setPaymentReference('');
    setPaymentNotes('');
  };

  // Submit Daily Cash Handover to Bursar
  const handleSubmitDailyHandover = () => {
    const newSummary: SecretaryDailySummary = {
      id: `sum-${todayStr}-${Date.now().toString().slice(-4)}`,
      date: todayStr,
      secretaryId: secretary.id,
      secretaryName: secretary.name,
      totalFeesCollected: totalFeesCollectedToday,
      totalExpensesLogged: totalExpensesLoggedToday,
      netCashOnHand,
      feesCount: todaySecretaryPayments.length,
      expensesCount: todaySecretaryExpenses.length,
      isReconciled: false,
      notes: handoverNotes.trim() || 'Daily end-of-day cash handover to Main Bursary.',
      createdAt: new Date().toISOString()
    };

    const updated = [newSummary, ...summaries.filter(s => s.date !== todayStr || s.secretaryId !== secretary.id)];
    setSummaries(updated);
    saveStoredSecretarySummaries(updated);
    setIsHandoverSubmitted(true);
    showToast('Daily cash handover submitted for Bursar reconciliation.');
  };

  // Print Receipt
  const handlePrintReceipt = (rec: PaymentRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official School Fee Receipt - ${rec.referenceNo}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #0f172a; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            .school-title { font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 0; }
            .sub-title { font-size: 11px; color: #64748b; margin: 2px 0 0 0; }
            .receipt-badge { display: inline-block; background: #0f172a; color: #fff; font-size: 11px; font-weight: bold; padding: 3px 10px; border-radius: 4px; margin-top: 8px; }
            .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dotted #cbd5e1; font-size: 13px; }
            .label { font-weight: 600; color: #64748b; }
            .value { font-weight: 700; color: #0f172a; }
            .amount-card { background: #f8fafc; border: 2px solid #0f172a; border-radius: 8px; padding: 14px; text-align: center; margin: 20px 0; }
            .amount-val { font-size: 26px; font-weight: 900; color: #059669; }
            .qr-sec { text-align: center; margin-top: 20px; font-size: 10px; color: #64748b; }
            .footer-sig { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; }
            .sig-line { border-top: 1px solid #0f172a; width: 180px; text-align: center; padding-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="school-title">JIPAS Educational Complex</h1>
            <p class="sub-title">GES Accredited • P.O. Box 1234, Accra, Ghana • Tel: +233 24 975 5593</p>
            <div class="receipt-badge">OFFICIAL SECRETARIAL FEE RECEIPT</div>
          </div>

          <div class="row">
            <span class="label">Receipt Reference No:</span>
            <span class="value">${rec.referenceNo}</span>
          </div>
          <div class="row">
            <span class="label">Date & Time:</span>
            <span class="value">${rec.date}</span>
          </div>
          <div class="row">
            <span class="label">Student Name:</span>
            <span class="value">${rec.studentName}</span>
          </div>
          <div class="row">
            <span class="label">Admission Number:</span>
            <span class="value">${rec.admissionNo}</span>
          </div>
          <div class="row">
            <span class="label">Class:</span>
            <span class="value">${rec.classAssigned || 'Assigned Class'}</span>
          </div>
          <div class="row">
            <span class="label">Payment Method:</span>
            <span class="value">${rec.paymentMethod}</span>
          </div>
          <div class="row">
            <span class="label">Received By:</span>
            <span class="value">${rec.receivedBy}</span>
          </div>

          <div class="amount-card">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-bottom: 2px;">Amount Received</div>
            <div class="amount-val">GH₵ ${(rec?.amount || 0).toFixed(2)}</div>
            <div style="font-size: 11px; color: #059669; font-weight: bold; margin-top: 2px;">STATUS: VERIFIED & CLEARED</div>
          </div>

          <div class="footer-sig">
            <div class="sig-line">Secretary Signature</div>
            <div class="sig-line">Official Stamp / Seal</div>
          </div>

          <div class="qr-sec">
            <p>Verification Token: <strong>SEC-VERIFY-${rec.id.slice(-8).toUpperCase()}</strong></p>
            <p>Thank you for your timely payment. Education is Wealth.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Welcome & Today's Cash Summary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Receipt className="w-5 h-5" />
              </div>
              <span className="text-xs font-black tracking-wider uppercase text-blue-600">
                Front Desk & Secretarial Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Welcome, {secretary.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Front desk point-of-sale fee collection, instant official receipts, petty cash disbursements, and daily reconciliation with the main bursary.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Desk Active • {todayStr}
            </span>
          </div>
        </div>

        {/* 3 Key Daily Tally Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Fees Collected Today</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-900 font-mono">
              GH₵ {(totalFeesCollectedToday || 0).toFixed(2)}
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold mt-1">
              {todaySecretaryPayments.length} student payments received
            </span>
          </div>

          <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-700 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Expenses Logged Today</span>
              <Receipt className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-900 font-mono">
              GH₵ {(totalExpensesLoggedToday || 0).toFixed(2)}
            </div>
            <span className="text-[10px] text-rose-700 font-semibold mt-1">
              {todaySecretaryExpenses.length} petty cash outlays
            </span>
          </div>

          <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-700 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Net Cash on Hand</span>
              <Wallet className="w-4 h-4 text-blue-600" />
            </div>
            <div className={`text-2xl font-black font-mono ${netCashOnHand >= 0 ? 'text-blue-900' : 'text-rose-900'}`}>
              GH₵ {(netCashOnHand || 0).toFixed(2)}
            </div>
            <span className="text-[10px] text-blue-700 font-semibold mt-1">
              Ready for Bursar handover
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-xs flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('fee_collection')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'fee_collection'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Collect School Fees</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Record Daily Expenses</span>
        </button>

        <button
          onClick={() => setActiveTab('daily_reconcile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'daily_reconcile'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Daily Handover & Reconciliation</span>
        </button>

        <button
          onClick={() => setActiveTab('students_lookup')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'students_lookup'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Student Records & Arrears</span>
        </button>

        <button
          onClick={() => setActiveTab('bank_deposits')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'bank_deposits'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4 text-emerald-300" />
          <span>Bank Deposits & Slips</span>
        </button>

        <button
          onClick={() => setActiveTab('enroll_student')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'enroll_student'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Enroll New Student</span>
        </button>

        <button
          onClick={() => setActiveTab('overdue_alerts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'overdue_alerts'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Overdue Fee Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab('collections_log')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'collections_log'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Payment Collections Log</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: COLLECT SCHOOL FEES                                    */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'fee_collection' && (
        <div className="space-y-6">
          {/* Header Card with Hierarchical Filters */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    Desk Terminal
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Department & Class Level Hierarchy</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Student Fee Collection Desk
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Select or enter the academic department, choose the class level, inspect the student roster or search students by name to record front-desk fee payments.
                </p>
              </div>

              {/* Quick Status Pill */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
                <Users className="w-4 h-4 text-blue-600" />
                <div className="text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Roster In View</span>
                  <span className="font-extrabold text-slate-900">{filteredStudentsForPayment.length} Students</span>
                </div>
              </div>
            </div>

            {/* Hierarchical Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
              {/* 1. Department Filter */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  1. Department Level
                </label>
                <div className="space-y-2">
                  <select
                    value={paymentDept}
                    onChange={(e) => {
                      setPaymentDept(e.target.value);
                      setCustomDeptInput('');
                      setPaymentClass('All');
                    }}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  >
                    <option value="All">All Departments</option>
                    {availableDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Or enter custom department..."
                    value={customDeptInput}
                    onChange={(e) => {
                      setCustomDeptInput(e.target.value);
                      if (e.target.value.trim()) {
                        setPaymentDept('Custom');
                      } else {
                        setPaymentDept('All');
                      }
                    }}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-700 focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 2. Class Level Filter */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  2. Class Level
                </label>
                <select
                  value={paymentClass}
                  onChange={(e) => setPaymentClass(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 shadow-2xs"
                >
                  <option value="All">All Classes ({availableClasses.length})</option>
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>

                {/* Quick Class Pills */}
                <div className="flex flex-wrap gap-1 pt-1 max-h-16 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setPaymentClass('All')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                      paymentClass === 'All' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All
                  </button>
                  {availableClasses.slice(0, 5).map(cls => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setPaymentClass(cls)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                        paymentClass === cls ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                  {availableClasses.length > 5 && (
                    <span className="text-[10px] text-slate-400 self-center">+{availableClasses.length - 5} more</span>
                  )}
                </div>
              </div>

              {/* 3. Search Student by Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  3. Search Student
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by student name or ID..."
                    value={studentRosterSearch}
                    onChange={(e) => setStudentRosterSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 shadow-2xs font-medium"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  {studentRosterSearch && (
                    <button
                      type="button"
                      onClick={() => setStudentRosterSearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Filtered: <strong>{filteredStudentsForPayment.length}</strong> of {students.length}</span>
                  {(paymentDept !== 'All' || paymentClass !== 'All' || studentRosterSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentDept('All');
                        setCustomDeptInput('');
                        setPaymentClass('All');
                        setStudentRosterSearch('');
                      }}
                      className="text-blue-700 hover:underline font-bold"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main 2-Column Grid: Left = Class Roster Directory, Right = Payment Entry Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Student Roster List */}
            <div className="lg:col-span-6 bg-white rounded-3xl shadow-xs border border-slate-200/80 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-black text-slate-900">
                    Class Roster Directory
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Click student to record payment
                </span>
              </div>

              {filteredStudentsForPayment.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No students match current filters</p>
                  <p className="text-xs text-slate-500 mt-1">Try selecting a different department, class or clearing the search keyword.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentDept('All');
                      setCustomDeptInput('');
                      setPaymentClass('All');
                      setStudentRosterSearch('');
                    }}
                    className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                  {filteredStudentsForPayment.map(st => {
                    const stId = st.id;
                    const studentBills = bills.filter(b => b.studentId === stId);
                    const totalBilled = studentBills.reduce((acc, b) => acc + b.amount, 0);
                    const studentPayments = payments.filter(p => p.studentId === stId && p.status === 'Completed');
                    const totalPaid = studentPayments.reduce((acc, p) => acc + p.amount, 0);
                    const balance = Math.max(0, totalBilled - totalPaid);
                    const isSelected = st.id === selectedStudent?.id;
                    const hasArrears = balance > 0;

                    return (
                      <div
                        key={st.id}
                        onClick={() => handleStudentSelect(st.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {(st.name || st.fullName).slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-extrabold text-slate-900 truncate">
                                {st.name || st.fullName}
                              </h5>
                              {isSelected && (
                                <span className="text-[9px] bg-blue-600 text-white font-black px-1.5 py-0.2 rounded-sm uppercase">
                                  Selected
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono text-slate-600 font-bold">{st.admissionNo}</span>
                              <span>•</span>
                              <span className="bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.2 rounded">
                                {st.currentClass || st.className}
                              </span>
                              {(st.department) && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-400 truncate max-w-[100px]">{st.department}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Balance Badge */}
                        <div className="text-right shrink-0">
                          {hasArrears ? (
                            <span className="text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg block">
                              GH₵ {balance.toFixed(2)}
                              <span className="block text-[9px] font-medium text-rose-500 uppercase">Balance Due</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg block">
                              ✓ Fully Paid
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Active Payment Terminal & Form */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-6 space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-slate-900">Payment Details</h4>
                    <p className="text-xs text-slate-500">Selected student billing information</p>
                  </div>
                  {selectedStudent && (
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                      {selectedStudent.currentClass || selectedStudent.className}
                    </span>
                  )}
                </div>

                {selectedStudent ? (
                  <form onSubmit={handleProcessPayment} className="space-y-4">
                    {/* Selected Student Banner */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">Selected Student</span>
                          <h4 className="text-base font-black text-white">{selectedStudent.name || selectedStudent.fullName}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase text-slate-400 font-medium">Admission ID</span>
                          <p className="text-xs font-mono font-bold text-slate-200">{selectedStudent.admissionNo}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Class Level</span>
                          <span className="font-bold text-white">{selectedStudent.currentClass || selectedStudent.className}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Department</span>
                          <span className="font-bold text-white truncate block">{selectedStudent.department || 'General'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Guardian Phone</span>
                          <span className="font-bold text-white">{selectedStudent.parentPhone || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Bill Status Card */}
                    {studentFinancials && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Billing Term</span>
                            <span className="font-bold text-slate-800">{selectedStudent.currentClass || selectedStudent.className} • 2025-2026 Third Term</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Remaining Arrears</span>
                            <span className="font-mono font-black text-rose-600 text-base">GH₵ {studentFinancials.outstandingArrears.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center text-xs">
                          <div className="bg-white p-2 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-400 uppercase block font-bold">Payable</span>
                            <span className="font-bold text-slate-800">GH₵ {(studentFinancials.totalBilled || 0).toFixed(2)}</span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-400 uppercase block font-bold">Paid to Date</span>
                            <span className="font-bold text-emerald-600">GH₵ {(studentFinancials.totalPaid || 0).toFixed(2)}</span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-400 uppercase block font-bold">Net Balance</span>
                            <span className="font-black text-rose-600">GH₵ {studentFinancials.outstandingArrears.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Amount Paid input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          Amount Paid (GH₵) *
                        </label>
                        {studentFinancials && studentFinancials.outstandingArrears > 0 && (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPaymentAmount(studentFinancials.outstandingArrears.toString())}
                              className="text-[10px] font-black bg-rose-100 hover:bg-rose-200 text-rose-800 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            >
                              Pay Full Balance ({studentFinancials.outstandingArrears.toFixed(0)} GH₵)
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentAmount((studentFinancials.outstandingArrears / 2).toFixed(2))}
                              className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            >
                              50%
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base font-black text-emerald-700 bg-white focus:ring-2 focus:ring-blue-500 shadow-2xs"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Payment Method *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { key: 'Cash', label: 'Cash (Desk)' },
                          { key: 'Mobile Money', label: 'MoMo' },
                          { key: 'Bank Transfer', label: 'Bank Transfer' }
                        ] as const).map(item => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setPaymentMethod(item.key)}
                            className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer truncate ${
                              paymentMethod === item.key
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Transaction Reference */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Transaction Ref / MoMo Txn ID
                      </label>
                      <input
                        type="text"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="e.g. MOM-44912 or Cash Ref"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs"
                      />
                    </div>

                    {/* Receipt Notes */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Receipt Notes & Bill Description
                      </label>
                      <input
                        type="text"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="e.g. Tuition fee part-payment for Term 3"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800"
                      />
                    </div>

                    {/* Collector Info */}
                    <div className="text-[11px] text-slate-500 flex items-center justify-between bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                      <span>Collector Attribution:</span>
                      <span className="font-bold text-slate-800">
                        {secretary.name} (Secretary Desk)
                      </span>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-900/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Process Payment & Issue Official Receipt
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <UserIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold">Please select a student from the class roster list to proceed.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: DAILY EXPENSES                                         */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'expenses' && (
        <ExpenseManager
          currentUser={secretary}
          canApprove={false}
          canAdd={true}
          canDelete={true}
          highlightRecorder="secretary"
          onRefreshStats={() => setExpenses(getStoredExpenses())}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: DAILY HANDOVER & RECONCILIATION                        */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'daily_reconcile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">End-of-Day Cash Handover</h3>
                  <p className="text-xs text-slate-500">Reconcile desk collections and submit cash to Accountant</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-600">Total Student Fees Collected:</span>
                    <span className="font-bold text-emerald-700 font-mono">+ GH₵ {(totalFeesCollectedToday || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-600">Total Operational Expenses Logged:</span>
                    <span className="font-bold text-rose-700 font-mono">- GH₵ {(totalExpensesLoggedToday || 0).toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm">
                    <span className="text-slate-900">Net Physical Cash to Hand Over:</span>
                    <span className="text-blue-700 font-mono">GH₵ {(netCashOnHand || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Handover Notes / Discrepancy Remarks</label>
                  <textarea
                    rows={3}
                    value={handoverNotes}
                    onChange={(e) => setHandoverNotes(e.target.value)}
                    placeholder="e.g. GH₵ 500 cash in envelope handed over to Bursar Kofi Mensah. All receipts verified."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white"
                  />
                </div>

                <button
                  onClick={handleSubmitDailyHandover}
                  id="btn-submit-secretary-handover"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Certify & Submit Daily Handover Summary</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                  Handover History & Bursar Sign-Off
                </h3>
              </div>

              {summaries.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-1">
                  <Layers className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                  <p className="text-xs font-bold text-slate-600">No Past Handover Summaries</p>
                  <p className="text-[10px]">Submitted summaries for Bursar reconciliation will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {summaries.map(s => (
                    <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">{s.date}</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.isReconciled 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {s.isReconciled ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {s.isReconciled ? 'Reconciled by Bursar' : 'Pending Bursar Sign-Off'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] font-medium pt-1">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Fees</span>
                          <span className="font-bold text-emerald-700">GH₵ {(s.totalFeesCollected || 0).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Expenses</span>
                          <span className="font-bold text-rose-700">GH₵ {(s.totalExpensesLogged || 0).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Net Cash</span>
                          <span className="font-bold text-blue-700">GH₵ {(s.netCashOnHand || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      {s.notes && (
                        <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                          {s.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: STUDENTS LOOKUP                                        */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'students_lookup' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-base">Enrolled Students & Arrears Directory</h3>
              <p className="text-xs text-slate-500">Quick student profile, class, parent contacts, and fee balances</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Adm No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Parent Phone</th>
                  <th className="py-3 px-4 text-right">Fee Arrears</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {students.map(st => {
                  const stBills = bills.filter(b => b.studentId === st.id).reduce((s, b) => s + b.amount, 0);
                  const stPmts = payments.filter(p => p.studentId === st.id && p.status === 'Completed').reduce((s, p) => s + p.amount, 0);
                  const arrears = Math.max(0, stBills - stPmts);

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{st.admissionNo}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{st.name}</td>
                      <td className="py-3 px-4 text-slate-600">{st.currentClass}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{st.parentPhone || 'N/A'}</td>
                      <td className={`py-3 px-4 text-right font-mono font-black ${arrears > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        GH₵ {(arrears || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedStudent(st);
                            setActiveTab('fee_collection');
                          }}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] cursor-pointer"
                        >
                          Collect Fee
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: BANK DEPOSITS                                          */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'bank_deposits' && (
        <BankDepositManager userRole="secretary" userName={secretary.name} />
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: ENROLL NEW STUDENT                                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'enroll_student' && (
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  Secretary Admissions
                </span>
                <h2 className="text-xl font-black text-slate-900">Enroll New Student</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Submit student admission details directly. New enrollments will be queued for Admin/Headmaster review & approval.
              </p>
            </div>

            {/* Sub tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setEnrollmentActiveTab('form')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  enrollmentActiveTab === 'form'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-950'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Admission Form</span>
              </button>
              <button
                type="button"
                onClick={() => setEnrollmentActiveTab('submissions')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  enrollmentActiveTab === 'submissions'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-950'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Submitted Records ({students.filter(s => s.status === 'Pending' || s.approvalStatus === 'Pending' || s.enrolledBy?.includes(secretary.name)).length})</span>
              </button>
            </div>
          </div>

          {enrollmentToast && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-black text-sm text-emerald-950">Enrollment Submitted Successfully!</div>
                <div className="text-emerald-800 font-medium text-xs mt-0.5">{enrollmentToast}</div>
              </div>
            </div>
          )}

          {enrollmentActiveTab === 'form' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  Students enrolled through the Secretary Portal will receive a temporary <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">PENDING-APPROVAL</code> status. 
                  Once approved by the Admin or Headmaster, their full profile is unlocked and their customized terminal billing schedule automatically synchronizes.
                </p>
              </div>

              <form onSubmit={handleSubmitSecretaryEnrollment} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase">Student Full Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. JOHN MENSAH OKAI"
                      value={enrollFullName}
                      onChange={(e) => setEnrollFullName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase">Gender <span className="text-rose-500">*</span></label>
                    <select
                      value={enrollGender}
                      onChange={(e) => setEnrollGender(e.target.value as 'Male' | 'Female')}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase">Date of Birth <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={enrollDob}
                      onChange={(e) => setEnrollDob(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase">Department <span className="text-rose-500">*</span></label>
                    <select
                      value={enrollDepartment}
                      onChange={(e) => setEnrollDepartment(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white"
                    >
                      <option value="Pre School">Pre School</option>
                      <option value="Primary School">Primary School</option>
                      <option value="Junior High School">Junior High School</option>
                      <option value="Senior High School">Senior High School</option>
                    </select>
                  </div>

                  {/* Class Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase">Class <span className="text-rose-500">*</span></label>
                    <select
                      value={enrollClassName}
                      onChange={(e) => setEnrollClassName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white"
                    >
                      <option value="Creche">Creche</option>
                      <option value="Nursery 1">Nursery 1</option>
                      <option value="Nursery 2">Nursery 2</option>
                      <option value="KG 1">KG 1</option>
                      <option value="KG 2">KG 2</option>
                      <option value="Basic 1">Basic 1</option>
                      <option value="Basic 2">Basic 2</option>
                      <option value="Basic 3">Basic 3</option>
                      <option value="Basic 4">Basic 4</option>
                      <option value="Basic 5">Basic 5</option>
                      <option value="Basic 6">Basic 6</option>
                      <option value="JHS 1">JHS 1</option>
                      <option value="JHS 2">JHS 2</option>
                      <option value="JHS 3">JHS 3</option>
                      <option value="SHS 1">SHS 1</option>
                      <option value="SHS 2">SHS 2</option>
                      <option value="SHS 3">SHS 3</option>
                    </select>
                  </div>

                  {/* House */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase">School House</label>
                    <select
                      value={enrollHouse}
                      onChange={(e) => setEnrollHouse(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white"
                    >
                      <option value="Blue">Blue House (Redeemer)</option>
                      <option value="Green">Green House (Peace)</option>
                      <option value="Red">Red House (Victory)</option>
                      <option value="Yellow">Yellow House (Glory)</option>
                    </select>
                  </div>

                  {/* Parent Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase">Parent / Guardian Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Samuel Okai"
                      value={enrollParentName}
                      onChange={(e) => setEnrollParentName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white"
                    />
                  </div>

                  {/* Parent Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase">Parent Phone Number <span className="text-rose-500">*</span></label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +233 24 123 4567"
                      value={enrollParentPhone}
                      onChange={(e) => setEnrollParentPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white"
                    />
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase">Student Passport Photograph</label>
                  <PhotoUploader
                    currentPhoto={enrollPhoto}
                    onPhotoChange={(url) => setEnrollPhoto(url)}
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                  <div>
                    Enrolled by: <strong className="text-slate-800">{secretary.name} (Secretary)</strong>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEnrollFullName('');
                        setEnrollParentName('');
                        setEnrollParentPhone('');
                        setEnrollPhoto('');
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingEnrollment}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-black shadow-md shadow-emerald-600/10 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSubmittingEnrollment ? (
                        <span>Submitting...</span>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" /> Submit Enrollment for Approval
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {enrollmentActiveTab === 'submissions' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Submitted Secretary Admission Registry</h3>
                  <p className="text-[11px] text-slate-500">History of student registration applications queued for school approval.</p>
                </div>

                <button
                  onClick={() => setEnrollmentActiveTab('form')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> New Application
                </button>
              </div>

              <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
                {students
                  .filter(s => s.status === 'Pending' || s.approvalStatus === 'Pending' || s.enrolledBy?.includes(secretary.name))
                  .map(st => (
                    <div key={st.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={st.photo || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=150'}
                          alt={st.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900">{st.fullName}</h4>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {st.gender} • DOB: {st.dob} • Class: <span className="font-bold text-slate-700">{st.className}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 justify-between sm:justify-end text-[11px] font-medium">
                        <div className="text-right">
                          <span className="block text-[9px] uppercase text-slate-400">Enrolled By</span>
                          <span className="font-bold text-slate-700">{st.enrolledBy || `${secretary.name} (Secretary)`}</span>
                        </div>

                        <div>
                          {st.isApproved || st.status === 'Active' ? (
                            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved & Enrolled
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" /> Awaiting Approval
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                {students.filter(s => s.status === 'Pending' || s.approvalStatus === 'Pending' || s.enrolledBy?.includes(secretary.name)).length === 0 && (
                  <div className="py-8 text-center text-slate-400 font-medium">
                    No submitted admission applications found. Click "+ New Application" above to enroll a student.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 7: OVERDUE FEE ALERTS & REMINDERS                         */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'overdue_alerts' && (
        <OverdueFeeAlertsManager
          students={students}
          bills={bills}
          payments={payments}
          onAddNotification={onAddNotification}
          onUpdateBills={onUpdateBills}
          onRecordPaymentClick={(studentId) => {
            const student = students.find(s => s.id === studentId);
            if (student) {
              setSelectedStudent(student);
              const bill = bills.find(b => b.studentId === studentId);
              if (bill && bill.balance > 0) {
                setPaymentAmount(bill.balance.toString());
              }
              setActiveTab('fee_collection');
            }
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 8: PAYMENT COLLECTIONS LOG                                */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'collections_log' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Payment Collections Log</h3>
                <span className="bg-cyan-100 text-cyan-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  {filteredCollectionsPayments.length} Receipts
                </span>
              </div>
              <p className="text-xs text-slate-500">Repository of all issued receipts and collected tuition/fee payments.</p>
            </div>
          </div>

          {/* FINANCIAL INSIGHTS DASHBOARD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 border border-slate-200/80 rounded-3xl p-6 text-slate-900">
            {/* Summary Cards */}
            <div className="space-y-4 flex flex-col justify-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Billed Fees</span>
                <h4 className="text-2xl font-black text-slate-900 font-mono">
                  GH₵ {(totalCollections + totalOutstanding).toFixed(2)}
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-100/60 border border-emerald-200 p-3 rounded-2xl">
                  <span className="text-[9px] font-black uppercase text-emerald-800">Collected</span>
                  <h5 className="text-base font-bold text-emerald-950 font-mono">GH₵ {totalCollections.toFixed(2)}</h5>
                </div>
                <div className="bg-rose-100/60 border border-rose-200 p-3 rounded-2xl">
                  <span className="text-[9px] font-black uppercase text-rose-800">Outstanding</span>
                  <h5 className="text-base font-bold text-rose-950 font-mono">GH₵ {totalOutstanding.toFixed(2)}</h5>
                </div>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/60 flex flex-col items-center justify-center min-h-[180px]">
              <span className="text-[10px] font-black uppercase text-slate-500 mb-2">Collections vs. Debt Ratio</span>
              <div className="w-full h-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Collected', value: totalCollections },
                        { name: 'Outstanding', value: totalOutstanding }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f43f5e" />
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`GH₵ ${Number(value).toFixed(2)}`, '']}
                      contentStyle={{ borderRadius: '12px', fontSize: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 text-[10px] font-bold text-slate-600 mt-2">
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Collected ({Math.round(totalCollections / ((totalCollections + totalOutstanding) || 1) * 100)}%)</div>
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Outstanding ({Math.round(totalOutstanding / ((totalCollections + totalOutstanding) || 1) * 100)}%)</div>
              </div>
            </div>

            {/* Bar Chart by Class */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/60 flex flex-col justify-between min-h-[180px]">
              <span className="text-[10px] font-black uppercase text-slate-500 text-center mb-1">Financial Standing by Class (Top 6)</span>
              <div className="w-full h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barDataByClass} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="class" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(value: any) => [`GH₵ ${Number(value).toFixed(2)}`, '']}
                      contentStyle={{ borderRadius: '12px', fontSize: '10px' }}
                    />
                    <Bar dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="outstanding" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 2-COLUMN SIDEBAR & TABLE LAYOUT */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Quick Filter Sidebar */}
            <div className="w-full lg:w-64 shrink-0 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-5 text-slate-950">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-500" /> Quick Filters
                </h4>
                <p className="text-[10px] text-slate-500 leading-normal">Narrow down Front Desk collections logs instantly.</p>
              </div>

              {/* Search Box */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400">Search Query</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search receipt, student or ID..."
                    value={collectionsSearchQuery}
                    onChange={(e) => setCollectionsSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-1 focus:ring-cyan-500 font-semibold text-slate-900"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Date Range Selector */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400">Date Range</label>
                <select
                  value={collectionsFilterDateRange}
                  onChange={(e) => setCollectionsFilterDateRange(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value="All">All Time</option>
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="This Week">This Week (7 Days)</option>
                  <option value="This Month">This Month</option>
                  <option value="Custom">Custom Range</option>
                </select>

                {collectionsFilterDateRange === 'Custom' && (
                  <div className="grid grid-cols-2 gap-2 pt-1.5">
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Start</span>
                      <input
                        type="date"
                        value={collectionsFilterStartDate}
                        onChange={(e) => setCollectionsFilterStartDate(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded-lg text-[10px] bg-white font-medium text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">End</span>
                      <input
                        type="date"
                        value={collectionsFilterEndDate}
                        onChange={(e) => setCollectionsFilterEndDate(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded-lg text-[10px] bg-white font-medium text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Class Group */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400">Class Group</label>
                <select
                  value={collectionsFilterClass}
                  onChange={(e) => setCollectionsFilterClass(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  {collectionsAvailableClasses.map(c => (
                    <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>
                  ))}
                </select>
              </div>

              {/* Payment Status Selector */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400">Payment Status</label>
                <select
                  value={collectionsFilterPaymentStatus}
                  onChange={(e) => setCollectionsFilterPaymentStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value="All">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Extra Original Filters */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400">Dept</span>
                  <select
                    value={collectionsFilterDepartment}
                    onChange={(e) => setCollectionsFilterDepartment(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-[10px] font-semibold text-slate-700"
                  >
                    {collectionsAvailableDepartments.map(d => (
                      <option key={d} value={d}>{d === 'All' ? 'All' : d}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400">Method</span>
                  <select
                    value={collectionsFilterMethod}
                    onChange={(e) => setCollectionsFilterMethod(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-[10px] font-semibold text-slate-700"
                  >
                    <option value="All">All</option>
                    <option value="Mobile Money">MoMo</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank</option>
                  </select>
                </div>
              </div>

              {/* Automated Alerts Trigger */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('overdue_alerts');
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer font-sans"
              >
                <AlertTriangle className="w-4 h-4 animate-pulse shrink-0" />
                <span>Bulk Overdue Alerts</span>
              </button>

              {/* Reset Filters button */}
              <button
                type="button"
                onClick={() => {
                  setCollectionsSearchQuery('');
                  setCollectionsFilterDateRange('All');
                  setCollectionsFilterStartDate('');
                  setCollectionsFilterEndDate('');
                  setCollectionsFilterClass('All');
                  setCollectionsFilterPaymentStatus('All');
                  setCollectionsFilterMethod('All');
                  setCollectionsFilterDepartment('All');
                }}
                className="w-full py-1.5 bg-slate-200/80 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Reset Active Filters
              </button>
            </div>

            {/* Table Area */}
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200/60">
                <span className="text-xs font-bold text-slate-500">
                  Showing <span className="font-extrabold text-slate-900">{filteredCollectionsPayments.length}</span> matching entries
                </span>

                {/* Sort By Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Sort:</span>
                  <select
                    value={collectionsSortBy}
                    onChange={(e) => setCollectionsSortBy(e.target.value as any)}
                    className="px-2.5 py-1.5 border border-indigo-200 bg-indigo-50/60 rounded-xl text-xs font-black text-indigo-900 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="date_desc">Date (Newest First)</option>
                    <option value="date_asc">Date (Oldest First)</option>
                    <option value="amount_desc">Amount (High to Low)</option>
                    <option value="amount_asc">Amount (Low to High)</option>
                    <option value="name_asc">Student Name (A-Z)</option>
                    <option value="class_asc">Class Name (A-Z)</option>
                  </select>
                </div>
              </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="p-3 w-12">#</th>
                  <th className="p-3">Receipt No</th>
                  <th className="p-3">Date / Time</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Admission No</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Paid As</th>
                  <th className="p-3">Method</th>
                  <th className="p-3 text-right">Amount Paid</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCollectionsPayments.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-400 font-medium">
                      No payment collection records found matching your selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredCollectionsPayments.map((p, idx) => {
                    const student = students.find(s => s.id === p.studentId || s.admissionNo === p.admissionNo);
                    const deptDisplay = p.department || student?.department || 'General';
                    const displayAmt = p.amount || p.paid || 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-blue-600">{p.receiptNo}</td>
                        <td className="p-3 text-slate-500 font-mono">{p.date}</td>
                        <td className="p-3 font-bold text-slate-900">{p.studentName}</td>
                        <td className="p-3 font-mono text-indigo-700 font-bold">{p.admissionNo}</td>
                        <td className="p-3 font-semibold text-slate-600">{deptDisplay}</td>
                        <td className="p-3 font-bold text-slate-800">{p.className}</td>
                        <td className="p-3 text-slate-600 truncate max-w-[160px]">{p.paidAs || 'Fees'}</td>
                        <td className="p-3">
                          <span className="bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            {p.method || p.paymentMethod || 'Cash'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-black text-emerald-700 text-sm">
                          GH₵ {displayAmt.toFixed(2)}
                        </td>
                        <td className="p-3">
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            {p.status || 'Completed'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setLastIssuedReceipt(p);
                              setShowReceiptModal(true);
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Printer className="w-3 h-3" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Official Receipt Pop-up                                */}
      {/* ------------------------------------------------------------- */}
      {showReceiptModal && lastIssuedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-in text-slate-900">
            <div className="text-center space-y-2 mb-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg text-slate-900">Fee Payment Successful</h3>
              <p className="text-xs text-slate-500">Official receipt generated and registered in school database.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs mb-5">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt Ref:</span>
                <span className="font-mono font-bold text-slate-900">{lastIssuedReceipt.referenceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-900">{lastIssuedReceipt.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-black text-emerald-700 font-mono text-sm">GH₵ {(lastIssuedReceipt.amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold text-slate-800">{lastIssuedReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Received By:</span>
                <span className="font-bold text-slate-800">{lastIssuedReceipt.receivedBy}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handlePrintReceipt(lastIssuedReceipt)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Printer className="w-4 h-4" /> Print Official Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
