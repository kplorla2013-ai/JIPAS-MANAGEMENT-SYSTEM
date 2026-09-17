import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentBill, PaymentRecord, Student, FeeOptionItem, NotificationItem, DailyFeeAuditSummary, SecretaryDailySummary, User as UserType } from '../types';
import JIPASLogo from './common/JIPASLogo';
import PaidAsSelector from './common/PaidAsSelector';
import FeesSettingsManager from './common/FeesSettingsManager';
import OverdueFeeAlertsManager from './admin/OverdueFeeAlertsManager';
import AccountantSidebar from './accountant/AccountantSidebar';
import ActionRequiredFollowUpModal from './accountant/ActionRequiredFollowUpModal';
import AutomatedFeeAlertModal from './accountant/AutomatedFeeAlertModal';
import GlobalSearchHeader from './common/GlobalSearchHeader';
import PayrollManager from './common/PayrollManager';
import ExpenseManager from './common/ExpenseManager';
import BankDepositManager from './common/BankDepositManager';
import FinancialDataImporter from './common/FinancialDataImporter';
import DepartmentalFinancialSummary from './common/DepartmentalFinancialSummary';
import { runDailyFeeAudit, isDailyAuditDueToday, getStoredAuditSummary, getFormattedTimestamp } from '../services/feeAuditService';
import { 
  getStoredSecretarySummaries, 
  saveStoredSecretarySummaries,
  getStoredDepartments,
  getStoredClasses,
  getStoredExpenses,
  saveStoredExpenses
} from '../services/storageService';
import { 
  Calculator, CreditCard, DollarSign, Plus, FileText, 
  Search, Printer, Download, CheckCircle2, ArrowDownRight, Calendar, User, Check, Settings, AlertTriangle, Send,
  RotateCw, Filter, Phone, MessageSquare, Clock, Sparkles, Wallet, Receipt, Layers, ShieldCheck,
  Users, BookOpen, ChevronRight, CheckCircle, RefreshCw, Building2, UserCheck, Building
} from 'lucide-react';

interface AccountantPortalProps {
  bills: StudentBill[];
  payments: PaymentRecord[];
  students: Student[];
  currentUser?: UserType;
  onAddPayment: (payment: PaymentRecord) => void;
  onUpdateBills?: (bills: StudentBill[]) => void;
  onAddNotification?: (notif: NotificationItem) => void;
  onLogout?: () => void;
}

export const VALID_ACCOUNTANT_TABS = new Set<string>([
  'collections',
  'bills',
  'new-payment',
  'fee-settings',
  'overdue-alerts',
  'expenses',
  'secretary-records',
  'payroll',
  'bank-deposits',
  'dept-financial-summary'
]);

export type AccountantTab = 'collections' | 'bills' | 'new-payment' | 'fee-settings' | 'overdue-alerts' | 'expenses' | 'secretary-records' | 'payroll' | 'bank-deposits' | 'dept-financial-summary';

export const getInitialAccountantTab = (): AccountantTab => {
  if (typeof window !== 'undefined') {
    if (localStorage.getItem('jipas_force_dashboard') === 'true') {
      localStorage.removeItem('jipas_force_dashboard');
      window.location.hash = 'accountant/collections';
      return 'collections';
    }
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (hash.startsWith('accountant/')) {
      const tabPart = hash.replace('accountant/', '');
      if (VALID_ACCOUNTANT_TABS.has(tabPart)) {
        return tabPart as AccountantTab;
      }
    } else if (VALID_ACCOUNTANT_TABS.has(hash)) {
      return hash as AccountantTab;
    }
    const saved = localStorage.getItem('jipas_active_page_accountant');
    if (saved && VALID_ACCOUNTANT_TABS.has(saved)) {
      return saved as AccountantTab;
    }
  }
  return 'collections';
};

export default function AccountantPortal({ 
  bills, 
  payments, 
  students, 
  currentUser,
  onAddPayment,
  onUpdateBills,
  onAddNotification
}: AccountantPortalProps) {
  const [activeTab, setActiveTab] = useState<AccountantTab>(() => getInitialAccountantTab());
  const [expenses] = useState(() => getStoredExpenses());

  const handlePrintReceipt = (receipt: PaymentRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official Fee Receipt - ${receipt.receiptNo}</title>
          <style>
            @page { size: A5 landscape; margin: 10mm; }
            body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; padding: 20px; margin: 0; background: #fff; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
            .title { font-size: 18px; font-weight: 900; color: #1e1b4b; text-transform: uppercase; }
            .subtitle { font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin-top: 2px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 11px; margin-bottom: 15px; }
            .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px; }
            th { background: #0f172a; color: white; padding: 6px 10px; text-align: left; font-size: 10px; text-transform: uppercase; }
            td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
            .amount { font-family: monospace; font-weight: bold; text-align: right; }
            .footer { display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; margin-top: 20px; }
            .stamp { border: 2px dashed #94a3b8; padding: 10px 20px; border-radius: 6px; text-align: center; font-weight: bold; font-size: 9px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">JIPAS EDUCATIONAL COMPLEX</div>
            <div class="subtitle">OFFICIAL FEE PAYMENT RECEIPT</div>
            <div style="font-size: 10px; color: #64748b;">Accra, Ghana &bull; Official Bursar & Accounts Desk</div>
          </div>

          <div class="grid">
            <div class="box">
              <strong>STUDENT INFORMATION</strong><br/>
              Name: <strong>${receipt.studentName}</strong><br/>
              Admission No: <strong>${receipt.admissionNo}</strong><br/>
              Class: <strong>${receipt.className}</strong>
            </div>
            <div class="box">
              <strong>RECEIPT DETAILS</strong><br/>
              Receipt No: <strong>${receipt.receiptNo}</strong><br/>
              Date: <strong>${receipt.date}</strong><br/>
              Method: <strong>${receipt.paymentMethod || receipt.method || 'Cash / Mobile Money'}</strong>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount Paid (CFA)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${receipt.paidAs || 'Tuition Fee Payment'}</td>
                <td class="amount">${(receipt.paid ?? 0).toFixed(2)} CFA</td>
              </tr>
              <tr style="background: #f8fafc; font-weight: bold;">
                <td>Remaining Balance Outstanding</td>
                <td class="amount" style="color: #be123c;">${(receipt.balance ?? 0).toFixed(2)} CFA</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <div>
              Cashier / Collected By: <strong>${receipt.collectedBy || 'Accountant'}</strong><br/>
              Thank you for your prompt payment.
            </div>
            <div class="stamp">OFFICIAL BURSAR STAMP</div>
          </div>

          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Department & Class level selection for Fee Payment
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
        .filter(s => s.department?.toLowerCase() === effectiveDept.toLowerCase())
        .map(s => s.className)
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

    const allStudentClasses = students.map(s => s.className).filter(Boolean);
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
          (effectiveDept.toLowerCase().includes('primary') && st.className?.toLowerCase().includes('basic')) ||
          (effectiveDept.toLowerCase().includes('junior') && st.className?.toLowerCase().includes('jhs')) ||
          (effectiveDept.toLowerCase().includes('pre') && (st.className?.toLowerCase().includes('kg') || st.className?.toLowerCase().includes('nursery') || st.className?.toLowerCase().includes('creche'))) ||
          (effectiveDept.toLowerCase().includes('senior') && st.className?.toLowerCase().includes('shs'));
        if (!deptMatches) return false;
      }

      // Class level filter
      if (paymentClass !== 'All') {
        if (st.className !== paymentClass) return false;
      }

      // Search query (search students by name, admission no, or roll no)
      if (studentRosterSearch.trim()) {
        const query = studentRosterSearch.toLowerCase();
        const matchesName = st.fullName.toLowerCase().includes(query);
        const matchesAdm = st.admissionNo.toLowerCase().includes(query);
        const matchesRoll = st.rollNo?.toLowerCase().includes(query);
        if (!matchesName && !matchesAdm && !matchesRoll) return false;
      }

      return true;
    });
  }, [students, paymentDept, customDeptInput, paymentClass, studentRosterSearch]);

  // Sync activeTab to localStorage and URL hash
  useEffect(() => {
    try {
      localStorage.setItem('jipas_active_page_accountant', activeTab);
      window.location.hash = `accountant/${activeTab}`;
    } catch (e) {
      console.warn('Could not sync accountant tab to storage/hash:', e);
    }
  }, [activeTab]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      const tabPart = hash.startsWith('accountant/') ? hash.replace('accountant/', '') : hash;
      if (VALID_ACCOUNTANT_TABS.has(tabPart)) {
        setActiveTab(tabPart as AccountantTab);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [amountPaid, setAmountPaid] = useState('715');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Mobile money' | 'Bank Transfer'>('Mobile money');
  const [paidAs, setPaidAs] = useState('Tuition Fee (Full Term Payment)');

  // Filter & Sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'name_asc' | 'class_asc' | 'receipt_asc'>('date_desc');
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [billsFilter, setBillsFilter] = useState<'all' | 'action-required' | 'unpaid' | 'paid'>('all');
  const [billsSearchQuery, setBillsSearchQuery] = useState('');
  const [activeReceipt, setActiveReceipt] = useState<PaymentRecord | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  // Automated Daily Fee Audit states
  const [auditSummary, setAuditSummary] = useState<DailyFeeAuditSummary | null>(() => getStoredAuditSummary());
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditToastMessage, setAuditToastMessage] = useState<string | null>(null);

  // Fast Follow-up Modal states
  const [activeFollowUpBill, setActiveFollowUpBill] = useState<StudentBill | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  // Automated Templated Fee Alerts Modal states
  const [isAutomatedAlertModalOpen, setIsAutomatedAlertModalOpen] = useState(false);
  const [alertModalPreselectedStudentId, setAlertModalPreselectedStudentId] = useState<string | undefined>(undefined);
  const [alertModalInitialFilter, setAlertModalInitialFilter] = useState<'all' | 'unpaid' | 'partially-paid'>('all');
  const [selectedBillsForBatchAlert, setSelectedBillsForBatchAlert] = useState<string[]>([]);

  // Financial calculations
  const totalCollected = payments.reduce((acc, p) => acc + p.paid, 0);
  const totalOutstanding = bills.reduce((acc, b) => acc + b.balance, 0);
  const totalBilled = bills.reduce((acc, b) => acc + b.payable, 0);

  // Unpaid & Partially Paid breakdown
  const unpaidBills = bills.filter(b => b.balance > 0 && b.paid === 0);
  const partiallyPaidBills = bills.filter(b => b.balance > 0 && b.paid > 0);
  const overdueBillsList = bills.filter(b => b.balance > 0);

  // Action Required overdue fee accounts
  const actionRequiredBills = bills.filter(b => b.actionRequired || b.balance > 0);
  const totalActionRequiredBalance = actionRequiredBills.reduce((acc, b) => acc + b.balance, 0);
  const criticalCount = actionRequiredBills.filter(
    b => b.actionSeverity === 'Critical' || b.balance >= 300 || (b.arrears && b.arrears > 0)
  ).length;

  // Automated Daily Task Execution: Runs automatically on load & checks periodically
  useEffect(() => {
    const checkAndExecuteAudit = () => {
      const due = isDailyAuditDueToday();
      const hasFlags = bills.some(b => b.actionRequired !== undefined);

      if (due || !hasFlags) {
        const { summary } = runDailyFeeAudit(bills, students, onUpdateBills, onAddNotification);
        setAuditSummary(summary);
      } else if (!auditSummary) {
        const stored = getStoredAuditSummary();
        if (stored) setAuditSummary(stored);
      }
    };

    if (bills.length > 0 && students.length > 0) {
      checkAndExecuteAudit();
    }

    // Interval check every 30 minutes for day rollover
    const timer = setInterval(() => {
      if (isDailyAuditDueToday() && bills.length > 0 && students.length > 0) {
        const { summary } = runDailyFeeAudit(bills, students, onUpdateBills, onAddNotification);
        setAuditSummary(summary);
        setAuditToastMessage(`Daily Fee Audit automatically flagged ${summary.flaggedCount} student accounts with 'Action Required'.`);
        setTimeout(() => setAuditToastMessage(null), 5000);
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(timer);
  }, [bills.length, students.length]);

  // Manual Trigger for Automated Daily Fee Audit
  const handleRunDailyAuditNow = () => {
    setIsAuditing(true);
    setTimeout(() => {
      const { summary } = runDailyFeeAudit(bills, students, onUpdateBills, onAddNotification, { force: true });
      setAuditSummary(summary);
      setIsAuditing(false);
      setAuditToastMessage(`Daily Fee Audit finished: ${summary.flaggedCount} students with overdue fees flagged with 'Action Required'.`);
      setTimeout(() => setAuditToastMessage(null), 5000);
    }, 600);
  };

  // Follow-up status updater
  const handleUpdateBillFollowUp = (
    billId: string, 
    status: 'Pending Follow-up' | 'Contacted' | 'Promised' | 'Resolved', 
    notes?: string, 
    promisedDate?: string
  ) => {
    if (!onUpdateBills) return;
    const todayFormatted = getFormattedTimestamp();

    const updated = bills.map(b => {
      if (b.id === billId) {
        return {
          ...b,
          actionStatus: status,
          followUpNotes: notes !== undefined ? notes : b.followUpNotes,
          promisedDate: promisedDate !== undefined ? promisedDate : b.promisedDate,
          lastContactDate: todayFormatted,
          actionRequired: status !== 'Resolved'
        };
      }
      return b;
    });

    onUpdateBills(updated);
  };

  // Find selected student and bill
  const selectedStudent = students.find(s => s.id === selectedStudentId) || students[0];
  const selectedBill = bills.find(b => b.studentId === selectedStudent?.id || b.admissionNo === selectedStudent?.admissionNo);

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    const bill = bills.find(b => b.studentId === studentId);
    if (bill && bill.balance > 0) {
      setAmountPaid(bill.balance.toString());
    } else {
      setAmountPaid('715');
    }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const paidVal = parseFloat(amountPaid) || 0;
    const currentPayable = selectedBill ? selectedBill.payable : 715;
    const currentPaidBefore = selectedBill ? selectedBill.paid : 0;
    const newBal = Math.max(0, currentPayable - (currentPaidBefore + paidVal));

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateFormatted = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const collectorName = currentUser?.name 
      ? `${currentUser.name} (${currentUser.role === 'sub_accountant' ? 'Sub-Accountant' : 'Accountant'})`
      : 'Frank Mensah (Accountant)';

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      receiptNo: `RCT-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
      date: dateFormatted,
      studentId: selectedStudent.id,
      studentName: selectedStudent.fullName,
      admissionNo: selectedStudent.admissionNo,
      className: selectedStudent.className,
      paidAs: paidAs,
      billAmount: selectedBill ? selectedBill.subTotal : 715,
      arrears: selectedBill ? selectedBill.arrears : 0,
      discount: selectedBill ? selectedBill.discount : 0,
      payable: currentPayable,
      paid: paidVal,
      balance: newBal,
      method: paymentMethod,
      status: newBal === 0 ? 'Fully Paid' : 'Partially Paid',
      collectedBy: collectorName
    };

    onAddPayment(newPayment);

    // Real-time bill arrears deduction
    if (onUpdateBills && selectedBill) {
      const updated = bills.map(b => {
        if (b.id === selectedBill.id) {
          const newPaidTotal = (b.paid || 0) + paidVal;
          const updatedBal = Math.max(0, b.payable - newPaidTotal);
          return {
            ...b,
            paid: newPaidTotal,
            balance: updatedBal,
            status: (updatedBal === 0 ? 'Fully Paid' : 'Partially Paid') as any,
            actionRequired: updatedBal > 0 ? b.actionRequired : false
          };
        }
        return b;
      });
      onUpdateBills(updated);
    }

    setActiveReceipt(newPayment);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 4000);
    setActiveTab('collections');
  };

  // Available unique departments & classes for collections filter
  const collectionsAvailableDepartments = useMemo(() => {
    const depts = new Set<string>();
    depts.add('All');
    students.forEach(s => {
      if (s.department) depts.add(s.department);
    });
    payments.forEach(p => {
      if (p.department) depts.add(p.department);
    });
    return Array.from(depts);
  }, [students, payments]);

  const collectionsAvailableClasses = useMemo(() => {
    const cls = new Set<string>();
    cls.add('All');
    students.forEach(s => {
      if (s.className) cls.add(s.className);
    });
    payments.forEach(p => {
      if (p.className) cls.add(p.className);
    });
    return Array.from(cls);
  }, [students, payments]);

  // Enhanced Filtered and Sorted Payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchSearch = 
        p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.receiptNo.toLowerCase().includes(searchQuery.toLowerCase());

      const matchMethod = filterMethod === 'All' || p.method === filterMethod;

      // Department matching
      const student = students.find(s => s.id === p.studentId || s.admissionNo === p.admissionNo);
      const studentDept = p.department || student?.department || 'General';
      const matchDept = filterDepartment === 'All' || studentDept === filterDepartment;

      // Class matching
      const matchClass = filterClass === 'All' || p.className === filterClass;

      return matchSearch && matchMethod && matchDept && matchClass;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'amount_desc') {
        return b.paid - a.paid;
      }
      if (sortBy === 'amount_asc') {
        return a.paid - b.paid;
      }
      if (sortBy === 'name_asc') {
        return a.studentName.localeCompare(b.studentName);
      }
      if (sortBy === 'class_asc') {
        return a.className.localeCompare(b.className);
      }
      if (sortBy === 'receipt_asc') {
        return a.receiptNo.localeCompare(b.receiptNo);
      }
      return 0;
    });
  }, [payments, students, searchQuery, filterMethod, filterDepartment, filterClass, sortBy]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start relative">
      {/* Auto Hide/Show Sidebar on Mouse Hover */}
      <AccountantSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalCollected={totalCollected}
        totalOutstanding={totalOutstanding}
        collectionRate={Math.round((totalCollected / (totalBilled || 1)) * 100)}
        collectionsCount={payments.length}
        billsCount={bills.length}
        overdueCount={bills.filter(b => b.balance > 0).length}
        actionRequiredCount={actionRequiredBills.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 w-full min-w-0 space-y-6">
        {/* Centralized Global Header Search */}
        <div className="flex items-center justify-end w-full px-1">
          <GlobalSearchHeader
            students={students}
            teachers={[]}
            bills={bills}
            payments={payments}
            onNavigate={(_modId, tabId) => {
              if (tabId && (
                tabId === 'collections' ||
                tabId === 'bills' ||
                tabId === 'new-payment' ||
                tabId === 'fee-settings' ||
                tabId === 'overdue-alerts' ||
                tabId === 'payroll'
              )) {
                setActiveTab(tabId as AccountantTab);
              }
            }}
            placeholder="Search students, bills, payment receipts, collection records..."
          />
        </div>

        {/* Accountant Top Banner */}
        <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-cyan-900/40">
          {/* School Wallpaper Backdrop with Gradient Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity scale-105 pointer-events-none"
            style={{ backgroundImage: `url('/wallpapers/assembly.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-950/95 via-slate-950/90 to-teal-950/90 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-5">
            <JIPASLogo size="lg" className="shrink-0 drop-shadow-md" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-cyan-500/30 border border-cyan-400/40 text-cyan-100 text-xs font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  Accountant Portal • Bursary & Collections
                </span>
                <span className="bg-emerald-500/30 border border-emerald-400/40 text-emerald-100 text-xs font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  Live Real-Time Sync
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
                Financial & Accounts Department
              </h1>
              <p className="text-cyan-100/80 text-xs sm:text-sm mt-1">
                Official receipt generator, tuition reconciliation, and terminal billing records • Motto: Education is Wealth
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('bank-deposits')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-indigo-900/30 transition-all cursor-pointer"
            >
              <Building className="w-4 h-4 text-emerald-300" /> Bank Deposits
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
            >
              <Receipt className="w-4 h-4" /> Enter Expenditure
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('new-payment')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Collect Fee Payment
            </button>
          </div>
        </div>

        {/* Sub-Accountant Notice if applicable */}
        {currentUser?.role === 'sub_accountant' && (
          <div className="bg-teal-950/80 border border-teal-500/40 text-teal-200 px-5 py-3 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-5 h-5 text-teal-400 shrink-0" />
              <div>
                <span className="font-bold text-white">Sub-Accountant Active:</span>{' '}
                <span>Logged in as <strong>{currentUser.name}</strong> with role-governed financial privileges managed by Administrator.</span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase bg-teal-800 text-teal-100 px-2.5 py-1 rounded-lg border border-teal-600/50 shrink-0">
              Sub-Accountant Access
            </span>
          </div>
        )}

      {/* Automated Daily Fee Audit Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl p-5 border border-rose-800/50 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Automated Daily Fee Task
              </span>
              <span className="text-[11px] text-rose-300 font-medium">
                Last checked: {auditSummary?.lastRunTimestamp || 'Today (Automated)'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-1">
              {actionRequiredBills.length} Student Accounts Flagged with &ldquo;Action Required&rdquo;
            </h3>
            <p className="text-xs text-rose-200/90 mt-0.5">
              Identified overdue fees totaling <span className="font-mono font-bold text-white">{totalActionRequiredBalance.toFixed(2)} CFA</span> ({criticalCount} Critical Arrears) needing quick bursary follow-up.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setBillsFilter('action-required');
              setActiveTab('bills');
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Filter className="w-4 h-4" />
            View Flagged ({actionRequiredBills.length})
          </button>

          <button
            type="button"
            disabled={isAuditing}
            onClick={handleRunDailyAuditNow}
            title="Re-run daily fee audit now"
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-rose-200 border border-rose-700/50 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin text-rose-400' : ''}`} />
            <span className="hidden sm:inline">Run Audit Now</span>
          </button>
        </div>
      </div>

      {/* Audit Toast Notification */}
      {auditToastMessage && (
        <div className="p-3.5 bg-rose-900/90 border border-rose-700 text-rose-100 rounded-xl text-xs font-medium flex items-center gap-2 shadow-sm animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
          <span>{auditToastMessage}</span>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-600">
          <span className="text-xl sm:text-2xl font-black text-emerald-700">
            {totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })} CFA
          </span>
          <p className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 mt-1">Total Collections</p>
          <span className="text-[10px] text-slate-500">{payments.length} verified receipts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-rose-600">
          <span className="text-xl sm:text-2xl font-black text-rose-600">
            {totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })} CFA
          </span>
          <p className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 mt-1">Outstanding Balance</p>
          <span className="text-[10px] text-slate-500">Uncollected arrears</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-blue-600">
          <span className="text-xl sm:text-2xl font-black text-blue-700">
            {totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })} CFA
          </span>
          <p className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 mt-1">Total Billable Amount</p>
          <span className="text-[10px] text-slate-500">{bills.length} student term bills</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-cyan-600">
          <span className="text-xl sm:text-2xl font-black text-cyan-700">
            {Math.round((totalCollected / (totalBilled || 1)) * 100)}%
          </span>
          <p className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 mt-1">Collection Rate</p>
          <span className="text-[10px] text-slate-500">Academic Year 2025-2026</span>
        </div>
      </div>

      {/* Success Banner */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold">
              Payment recorded successfully! Receipt generated and student balance updated in real-time.
            </span>
          </div>
          {activeReceipt && (
            <button
              onClick={() => {}}
              className="text-xs font-bold text-emerald-700 underline"
            >
              {activeReceipt.receiptNo}
            </button>
          )}
        </div>
      )}

      {/* Navigation Tabs Bar & Main Menu Thumbnail Cards */}
      <div className="space-y-4">
        {/* Main Accountant Navigation Thumbnail Menus */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                Accountant Main Navigation & Bursary Menus
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Select a thumbnail menu below to manage fees, receipts, and parent notifications</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 pt-1">
            {/* Menu 1: Collections Log */}
            <button
              onClick={() => setActiveTab('collections')}
              className={`group p-4 rounded-2xl text-left transition-all duration-200 border cursor-pointer flex flex-col justify-between space-y-3 ${
                activeTab === 'collections'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-md scale-[1.02]'
                  : 'bg-gradient-to-br from-cyan-50/80 to-slate-50 hover:from-cyan-600 hover:to-cyan-700 border-cyan-100 hover:border-cyan-600 hover:text-white shadow-2xs hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-xs ${
                  activeTab === 'collections'
                    ? 'bg-white text-cyan-700'
                    : 'bg-cyan-600 text-white group-hover:bg-white group-hover:text-cyan-700'
                }`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                  activeTab === 'collections'
                    ? 'bg-cyan-800 text-cyan-100'
                    : 'bg-cyan-100 group-hover:bg-cyan-500 text-cyan-800 group-hover:text-white'
                }`}>
                  Receipts
                </span>
              </div>
              <div>
                <h4 className={`font-extrabold text-xs transition-colors flex items-center gap-1 ${
                  activeTab === 'collections' ? 'text-white' : 'text-slate-900 group-hover:text-white'
                }`}>
                  Collections Log
                </h4>
                <p className={`text-[11px] mt-0.5 line-clamp-2 transition-colors ${
                  activeTab === 'collections' ? 'text-cyan-100' : 'text-slate-500 group-hover:text-cyan-100'
                }`}>
                  Repository of all issued fee receipts & collected funds
                </p>
              </div>
            </button>

            {/* Menu 2: Student Fee Bills */}
            <button
              onClick={() => setActiveTab('bills')}
              className={`group p-4 rounded-2xl text-left transition-all duration-200 border cursor-pointer flex flex-col justify-between space-y-3 ${
                activeTab === 'bills'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md scale-[1.02]'
                  : 'bg-gradient-to-br from-amber-50/80 to-slate-50 hover:from-amber-600 hover:to-amber-700 border-amber-100 hover:border-amber-600 hover:text-white shadow-2xs hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-xs ${
                  activeTab === 'bills'
                    ? 'bg-white text-amber-700'
                    : 'bg-amber-600 text-white group-hover:bg-white group-hover:text-amber-700'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                  activeTab === 'bills'
                    ? 'bg-amber-800 text-amber-100'
                    : 'bg-amber-100 group-hover:bg-amber-500 text-amber-800 group-hover:text-white'
                }`}>
                  Invoicing
                </span>
              </div>
              <div>
                <h4 className={`font-extrabold text-xs transition-colors flex items-center gap-1 ${
                  activeTab === 'bills' ? 'text-white' : 'text-slate-900 group-hover:text-white'
                }`}>
                  Fee Bills & Balances
                </h4>
                <p className={`text-[11px] mt-0.5 line-clamp-2 transition-colors ${
                  activeTab === 'bills' ? 'text-amber-100' : 'text-slate-500 group-hover:text-amber-100'
                }`}>
                  Student billings, balances due & payment verification
                </p>
              </div>
            </button>

            {/* Menu 3: Record Payment */}
            <button
              onClick={() => setActiveTab('new-payment')}
              className={`group p-4 rounded-2xl text-left transition-all duration-200 border cursor-pointer flex flex-col justify-between space-y-3 ${
                activeTab === 'new-payment'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                  : 'bg-gradient-to-br from-emerald-50/80 to-slate-50 hover:from-emerald-600 hover:to-emerald-700 border-emerald-100 hover:border-emerald-600 hover:text-white shadow-2xs hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-xs ${
                  activeTab === 'new-payment'
                    ? 'bg-white text-emerald-700'
                    : 'bg-emerald-600 text-white group-hover:bg-white group-hover:text-emerald-700'
                }`}>
                  <Plus className="w-5 h-5" />
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                  activeTab === 'new-payment'
                    ? 'bg-emerald-800 text-emerald-100'
                    : 'bg-emerald-100 group-hover:bg-emerald-500 text-emerald-800 group-hover:text-white'
                }`}>
                  Collect
                </span>
              </div>
              <div>
                <h4 className={`font-extrabold text-xs transition-colors flex items-center gap-1 ${
                  activeTab === 'new-payment' ? 'text-white' : 'text-slate-900 group-hover:text-white'
                }`}>
                  Collect Fee Payment
                </h4>
                <p className={`text-[11px] mt-0.5 line-clamp-2 transition-colors ${
                  activeTab === 'new-payment' ? 'text-emerald-100' : 'text-slate-500 group-hover:text-emerald-100'
                }`}>
                  Process MoMo, cash & bank deposit payment receipts
                </p>
              </div>
            </button>

            {/* Menu 4: Overdue Fee Alerts */}
            <button
              onClick={() => setActiveTab('overdue-alerts')}
              className={`group p-4 rounded-2xl text-left transition-all duration-200 border cursor-pointer flex flex-col justify-between space-y-3 ${
                activeTab === 'overdue-alerts'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-[1.02]'
                  : 'bg-gradient-to-br from-rose-50/80 to-slate-50 hover:from-rose-600 hover:to-rose-700 border-rose-100 hover:border-rose-600 hover:text-white shadow-2xs hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-xs ${
                  activeTab === 'overdue-alerts'
                    ? 'bg-white text-rose-700'
                    : 'bg-rose-600 text-white group-hover:bg-white group-hover:text-rose-700'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                  activeTab === 'overdue-alerts'
                    ? 'bg-rose-800 text-rose-100'
                    : 'bg-rose-100 group-hover:bg-rose-500 text-rose-800 group-hover:text-white'
                }`}>
                  Overdue
                </span>
              </div>
              <div>
                <h4 className={`font-extrabold text-xs transition-colors flex items-center gap-1 ${
                  activeTab === 'overdue-alerts' ? 'text-white' : 'text-slate-900 group-hover:text-white'
                }`}>
                  Overdue Fee Alerts ({bills.filter(b => b.balance > 0).length})
                </h4>
                <p className={`text-[11px] mt-0.5 line-clamp-2 transition-colors ${
                  activeTab === 'overdue-alerts' ? 'text-rose-100' : 'text-slate-500 group-hover:text-rose-100'
                }`}>
                  Dispatch automated WhatsApp & SMS payment reminders
                </p>
              </div>
            </button>

            {/* Menu 5: Fees Settings */}
            <button
              onClick={() => setActiveTab('fee-settings')}
              className={`group p-4 rounded-2xl text-left transition-all duration-200 border cursor-pointer flex flex-col justify-between space-y-3 ${
                activeTab === 'fee-settings'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]'
                  : 'bg-gradient-to-br from-indigo-50/80 to-slate-50 hover:from-indigo-600 hover:to-indigo-700 border-indigo-100 hover:border-indigo-600 hover:text-white shadow-2xs hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-xs ${
                  activeTab === 'fee-settings'
                    ? 'bg-white text-indigo-700'
                    : 'bg-indigo-600 text-white group-hover:bg-white group-hover:text-indigo-700'
                }`}>
                  <Settings className="w-5 h-5" />
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                  activeTab === 'fee-settings'
                    ? 'bg-indigo-800 text-indigo-100'
                    : 'bg-indigo-100 group-hover:bg-indigo-500 text-indigo-800 group-hover:text-white'
                }`}>
                  Tariffs
                </span>
              </div>
              <div>
                <h4 className={`font-extrabold text-xs transition-colors flex items-center gap-1 ${
                  activeTab === 'fee-settings' ? 'text-white' : 'text-slate-900 group-hover:text-white'
                }`}>
                  Fees Settings & Options
                </h4>
                <p className={`text-[11px] mt-0.5 line-clamp-2 transition-colors ${
                  activeTab === 'fee-settings' ? 'text-indigo-100' : 'text-slate-500 group-hover:text-indigo-100'
                }`}>
                  Configure fee breakdown, compulsory items & currencies
                </p>
              </div>
            </button>

            {/* Menu 6: Staff Payroll System */}
            <button
              onClick={() => setActiveTab('payroll')}
              className={`group p-4 rounded-2xl text-left transition-all duration-200 border cursor-pointer flex flex-col justify-between space-y-3 ${
                activeTab === 'payroll'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-[1.02]'
                  : 'bg-gradient-to-br from-purple-50/80 to-slate-50 hover:from-purple-600 hover:to-purple-700 border-purple-100 hover:border-purple-600 hover:text-white shadow-2xs hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-xs ${
                  activeTab === 'payroll'
                    ? 'bg-white text-purple-700'
                    : 'bg-purple-600 text-white group-hover:bg-white group-hover:text-purple-700'
                }`}>
                  <Wallet className="w-5 h-5" />
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                  activeTab === 'payroll'
                    ? 'bg-purple-800 text-purple-100'
                    : 'bg-purple-100 group-hover:bg-purple-500 text-purple-800 group-hover:text-white'
                }`}>
                  Bursary
                </span>
              </div>
              <div>
                <h4 className={`font-extrabold text-xs transition-colors flex items-center gap-1 ${
                  activeTab === 'payroll' ? 'text-white' : 'text-slate-900 group-hover:text-white'
                }`}>
                  Staff Payroll System
                </h4>
                <p className={`text-[11px] mt-0.5 line-clamp-2 transition-colors ${
                  activeTab === 'payroll' ? 'text-purple-100' : 'text-slate-500 group-hover:text-purple-100'
                }`}>
                  Monthly batch payroll, SSNIT, PAYE tax & HD payslips
                </p>
              </div>
            </button>

            {/* Menu 7: Institutional Expenditure */}
            <button
              onClick={() => setActiveTab('expenses')}
              className={`group p-4 rounded-2xl text-left transition-all duration-200 border cursor-pointer flex flex-col justify-between space-y-3 ${
                activeTab === 'expenses'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-[1.02]'
                  : 'bg-gradient-to-br from-rose-50/80 to-slate-50 hover:from-rose-600 hover:to-rose-700 border-rose-100 hover:border-rose-600 hover:text-white shadow-2xs hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-xs ${
                  activeTab === 'expenses'
                    ? 'bg-white text-rose-700'
                    : 'bg-rose-600 text-white group-hover:bg-white group-hover:text-rose-700'
                }`}>
                  <Receipt className="w-5 h-5" />
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                  activeTab === 'expenses'
                    ? 'bg-rose-800 text-rose-100'
                    : 'bg-rose-100 group-hover:bg-rose-500 text-rose-800 group-hover:text-white'
                }`}>
                  Expense
                </span>
              </div>
              <div>
                <h4 className={`font-extrabold text-xs transition-colors flex items-center gap-1 ${
                  activeTab === 'expenses' ? 'text-white' : 'text-slate-900 group-hover:text-white'
                }`}>
                  Expenditure & Vouchers
                </h4>
                <p className={`text-[11px] mt-0.5 line-clamp-2 transition-colors ${
                  activeTab === 'expenses' ? 'text-rose-100' : 'text-slate-500 group-hover:text-rose-100'
                }`}>
                  Log operational expenses, procurement vouchers & petty cash
                </p>
              </div>
            </button>

            {/* Menu 8: Secretary Records */}
            <button
              onClick={() => setActiveTab('secretary-records')}
              className={`group p-4 rounded-2xl text-left transition-all duration-200 border cursor-pointer flex flex-col justify-between space-y-3 ${
                activeTab === 'secretary-records'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md scale-[1.02]'
                  : 'bg-gradient-to-br from-amber-50/80 to-slate-50 hover:from-amber-600 hover:to-amber-700 border-amber-100 hover:border-amber-600 hover:text-white shadow-2xs hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-xs ${
                  activeTab === 'secretary-records'
                    ? 'bg-white text-amber-700'
                    : 'bg-amber-600 text-white group-hover:bg-white group-hover:text-amber-700'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                  activeTab === 'secretary-records'
                    ? 'bg-amber-800 text-amber-100'
                    : 'bg-amber-100 group-hover:bg-amber-500 text-amber-800 group-hover:text-white'
                }`}>
                  Secretary Desk
                </span>
              </div>
              <div>
                <h4 className={`font-extrabold text-xs transition-colors flex items-center gap-1 ${
                  activeTab === 'secretary-records' ? 'text-white' : 'text-slate-900 group-hover:text-white'
                }`}>
                  Secretary Financials
                </h4>
                <p className={`text-[11px] mt-0.5 line-clamp-2 transition-colors ${
                  activeTab === 'secretary-records' ? 'text-amber-100' : 'text-slate-500 group-hover:text-amber-100'
                }`}>
                  Secretary front-desk collections, expenses & daily handovers
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* DYNAMIC ACCOUNTANT TABS WITH ENTRY ANIMATIONS */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {/* OVERDUE ALERTS TAB */}
          {activeTab === 'overdue-alerts' && (
        <OverdueFeeAlertsManager
          students={students}
          bills={bills}
          payments={payments}
          onAddNotification={onAddNotification}
          onUpdateBills={onUpdateBills}
          onRecordPaymentClick={(studentId) => {
            setSelectedStudentId(studentId);
            const bill = bills.find(b => b.studentId === studentId);
            if (bill && bill.balance > 0) {
              setAmountPaid(bill.balance.toString());
            }
            setActiveTab('new-payment');
          }}
        />
      )}

      {/* 1. COLLECTIONS LOG TAB */}
      {activeTab === 'collections' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Payment Collections Log</h3>
                <span className="bg-cyan-100 text-cyan-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  {filteredPayments.length} Receipts
                </span>
              </div>
              <p className="text-xs text-slate-500">Repository of all issued receipts and collected tuition/fee payments.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
              {/* Import Button */}
              <button
                type="button"
                onClick={() => setIsImporterOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5 rotate-180" />
                <span>Import Financial Records</span>
              </button>

              {/* Search */}
              <div className="relative min-w-[180px] flex-1 sm:flex-none">
                <input
                  type="text"
                  placeholder="Search receipt, student or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-1 focus:ring-cyan-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">Dept:</label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold text-slate-700"
                >
                  {collectionsAvailableDepartments.map(d => (
                    <option key={d} value={d}>{d === 'All' ? 'All Depts' : d}</option>
                  ))}
                </select>
              </div>

              {/* Class Filter */}
              <div className="flex items-center gap-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">Class:</label>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold text-slate-700"
                >
                  {collectionsAvailableClasses.map(c => (
                    <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>
                  ))}
                </select>
              </div>

              {/* Payment Method Filter */}
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold text-slate-700"
              >
                <option value="All">All Methods</option>
                <option value="Mobile money">Mobile money</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-2 border border-indigo-200 bg-indigo-50/60 rounded-xl text-xs font-black text-indigo-900 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="date_desc">Date (Newest First)</option>
                  <option value="date_asc">Date (Oldest First)</option>
                  <option value="amount_desc">Amount (High to Low)</option>
                  <option value="amount_asc">Amount (Low to High)</option>
                  <option value="name_asc">Student Name (A-Z)</option>
                  <option value="class_asc">Class Name (A-Z)</option>
                  <option value="receipt_asc">Receipt No</option>
                </select>
              </div>
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
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-400 font-medium">
                      No payment collection records found matching your selected department, class, or search filters.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p, idx) => {
                    const student = students.find(s => s.id === p.studentId || s.admissionNo === p.admissionNo);
                    const deptDisplay = p.department || student?.department || 'General';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-blue-600">{p.receiptNo}</td>
                        <td className="p-3 text-slate-500 font-mono">{p.date}</td>
                        <td className="p-3 font-bold text-slate-900">{p.studentName}</td>
                        <td className="p-3 font-mono text-indigo-700 font-bold">{p.admissionNo}</td>
                        <td className="p-3 font-semibold text-slate-600">{deptDisplay}</td>
                        <td className="p-3 font-bold text-slate-800">{p.className}</td>
                        <td className="p-3 text-slate-600 truncate max-w-[160px]">{p.paidAs}</td>
                        <td className="p-3">
                          <span className="bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            {p.method}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-black text-emerald-700 text-sm">
                          {p.paid.toFixed(2)} CFA
                        </td>
                        <td className="p-3">
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setActiveReceipt(p)}
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
      )}

      {/* 2. STUDENT FEE BILLS TAB */}
      {activeTab === 'bills' && (() => {
        const displayedBills = bills.filter(b => {
          const q = billsSearchQuery.trim().toLowerCase();
          const matchQuery = !q || 
            b.studentName.toLowerCase().includes(q) ||
            b.admissionNo.toLowerCase().includes(q) ||
            b.className.toLowerCase().includes(q);

          if (!matchQuery) return false;

          if (billsFilter === 'action-required') {
            return b.actionRequired || b.balance > 0;
          }
          if (billsFilter === 'unpaid') {
            return b.balance > 0;
          }
          if (billsFilter === 'paid') {
            return b.balance === 0;
          }
          return true;
        });

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">Student Fee Bills & Outstanding Balances</h3>
                  {actionRequiredBills.length > 0 && (
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                      {actionRequiredBills.length} Action Required
                    </span>
                  )}
                  {unpaidBills.length > 0 && (
                    <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                      {unpaidBills.length} Unpaid
                    </span>
                  )}
                  {partiallyPaidBills.length > 0 && (
                    <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                      {partiallyPaidBills.length} Partially Paid
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">Live reconciliation of total charges, daily overdue audits, and automated multi-channel bursary follow-up.</p>
              </div>

              {/* Automated Fee Alerts Quick Trigger */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAlertModalPreselectedStudentId(undefined);
                    setAlertModalInitialFilter('all');
                    setIsAutomatedAlertModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-cyan-900/10 cursor-pointer transition-all animate-pulse"
                  title="Send automated templated SMS/WhatsApp/Notification alerts to parents of unpaid and partially paid students"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Automated Fee Alerts</span>
                  <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-md font-mono">
                    {overdueBillsList.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Filter Tabs & Quick Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBillsFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    billsFilter === 'all' 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({bills.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBillsFilter('action-required')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors ${
                    billsFilter === 'action-required'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  Action Required ({actionRequiredBills.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBillsFilter('unpaid')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    billsFilter === 'unpaid'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  Unpaid Only ({unpaidBills.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBillsFilter('partial')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    (billsFilter as string) === 'partial'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  Partially Paid ({partiallyPaidBills.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBillsFilter('paid')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    billsFilter === 'paid'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  Fully Paid ({bills.filter(b => b.balance === 0).length})
                </button>
              </div>

              {/* Fast Alert Batch Shortcuts */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setAlertModalPreselectedStudentId(undefined);
                    setAlertModalInitialFilter('unpaid');
                    setIsAutomatedAlertModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 h-3 text-rose-500" /> Alert Unpaid ({unpaidBills.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAlertModalPreselectedStudentId(undefined);
                    setAlertModalInitialFilter('partially-paid');
                    setIsAutomatedAlertModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 h-3 text-amber-500" /> Alert Partial ({partiallyPaidBills.length})
                </button>
              </div>
            </div>

            {/* Batch Selection Banner */}
            {selectedBillsForBatchAlert.length > 0 && (
              <div className="bg-cyan-950 text-white p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md border border-cyan-800 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>
                    <strong className="text-cyan-300 font-mono">{selectedBillsForBatchAlert.length}</strong> students selected for alert dispatch
                  </span>
                  <span className="text-cyan-400/60">•</span>
                  <span className="text-cyan-200">
                    Combined Arrears: <strong className="text-white font-mono">{
                      bills.filter(b => selectedBillsForBatchAlert.includes(b.id)).reduce((acc, b) => acc + b.balance, 0).toFixed(2)
                    } CFA</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBillsForBatchAlert([])}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-cyan-200 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Clear Selection
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAlertModalPreselectedStudentId(selectedBillsForBatchAlert[0]);
                      setAlertModalInitialFilter('all');
                      setIsAutomatedAlertModalOpen(true);
                    }}
                    className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Templated Alert to Selected ({selectedBillsForBatchAlert.length})
                  </button>
                </div>
              </div>
            )}

            {/* Search Input & Info */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search student, admission no, class..."
                  value={billsSearchQuery}
                  onChange={(e) => setBillsSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-1 focus:ring-cyan-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              {billsFilter === 'action-required' && (
                <div className="text-xs text-rose-700 font-medium bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>Showing students with overdue fees identified during automated daily scan</span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                    <th className="p-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={displayedBills.length > 0 && displayedBills.filter(b => b.balance > 0).every(b => selectedBillsForBatchAlert.includes(b.id))}
                        onChange={() => {
                          const overdueIds = displayedBills.filter(b => b.balance > 0).map(b => b.id);
                          const allSelected = overdueIds.every(id => selectedBillsForBatchAlert.includes(id));
                          if (allSelected) {
                            setSelectedBillsForBatchAlert(prev => prev.filter(id => !overdueIds.includes(id)));
                          } else {
                            setSelectedBillsForBatchAlert(prev => Array.from(new Set([...prev, ...overdueIds])));
                          }
                        }}
                        className="w-3.5 h-3.5 text-cyan-600 rounded border-slate-400 cursor-pointer"
                        title="Select all overdue for batch alerts"
                      />
                    </th>
                    <th className="p-3 w-10">#</th>
                    <th className="p-3">Admission No</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Class</th>
                    <th className="p-3 text-right">Total Payable</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right">Balance</th>
                    <th className="p-3">Fee Status</th>
                    <th className="p-3 text-center">Actions & Alerts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {displayedBills.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        No student bills match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    displayedBills.map((b, idx) => {
                      const isAction = b.actionRequired || b.balance > 0;
                      const isUnpaid = b.balance > 0 && b.paid === 0;
                      const isPartial = b.balance > 0 && b.paid > 0;
                      const isSelected = selectedBillsForBatchAlert.includes(b.id);
                      const studentObj = students.find(s => s.id === b.studentId || s.admissionNo === b.admissionNo);
                      const phoneClean = (studentObj?.parentPhone || '0240000000').replace(/[^0-9]/g, '');
                      const waPhone = phoneClean.startsWith('0') ? '233' + phoneClean.substring(1) : phoneClean;
                      const waText = `Dear ${studentObj?.parentName || 'Parent'}, gentle fee reminder from JIPAS: ${b.studentName} (${b.className}, ${b.admissionNo}) has an outstanding balance of ${b.balance.toFixed(2)} CFA (Total bill: ${b.payable.toFixed(2)} CFA). Kindly arrange settlement at the bursary office.`;
                      const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`;

                      return (
                        <tr 
                          key={b.id} 
                          className={isAction ? (isSelected ? 'bg-cyan-50/70 border-l-4 border-l-cyan-600' : 'bg-rose-50/25 hover:bg-rose-50/60 border-l-4 border-l-rose-500') : (isSelected ? 'bg-cyan-50/50' : 'hover:bg-slate-50')}
                        >
                          <td className="p-3 text-center">
                            {b.balance > 0 && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedBillsForBatchAlert(prev =>
                                    prev.includes(b.id) ? prev.filter(id => id !== b.id) : [...prev, b.id]
                                  );
                                }}
                                className="w-3.5 h-3.5 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500 cursor-pointer"
                              />
                            )}
                          </td>
                          <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-indigo-700">{b.admissionNo}</td>
                          <td className="p-3 font-bold text-slate-900">
                            <div>{b.studentName}</div>
                            {b.lastContactDate ? (
                              <span className="text-[10px] text-slate-400 font-normal">
                                Contacted: {b.lastContactDate}
                              </span>
                            ) : studentObj?.parentPhone ? (
                              <span className="text-[10px] text-slate-400 font-mono font-normal">
                                Parent: {studentObj.parentPhone}
                              </span>
                            ) : null}
                          </td>
                          <td className="p-3 text-slate-700">{b.className}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800">{b.payable.toFixed(2)} CFA</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">{b.paid.toFixed(2)} CFA</td>
                          <td className={`p-3 text-right font-mono font-black text-sm ${b.balance === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {b.balance.toFixed(2)} CFA
                          </td>
                          <td className="p-3">
                            {isUnpaid ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 bg-rose-100 border border-rose-300 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> Unpaid (0% Paid)
                                </span>
                                <div className="text-[10px] text-rose-700 font-bold">
                                  Bal: {b.balance.toFixed(2)} CFA
                                </div>
                              </div>
                            ) : isPartial ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                  Partially Paid
                                </span>
                                <div className="text-[10px] text-amber-700 font-medium">
                                  {Math.round((b.paid / (b.payable || 1)) * 100)}% Settled
                                </div>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Fully Paid
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  handleStudentSelect(b.studentId);
                                  setActiveTab('new-payment');
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                                title="Collect payment and issue receipt"
                              >
                                Collect
                              </button>

                              {b.balance > 0 && (
                                <>
                                  {/* Send Automated Templated Alert Modal Trigger */}
                                  <button
                                    onClick={() => {
                                      setAlertModalPreselectedStudentId(b.studentId);
                                      setAlertModalInitialFilter(isUnpaid ? 'unpaid' : 'partially-paid');
                                      setIsAutomatedAlertModalOpen(true);
                                    }}
                                    className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Send templated SMS/WhatsApp/Notification fee alert"
                                  >
                                    <Send className="w-3 h-3" />
                                    Alert
                                  </button>

                                  {/* WhatsApp Instant Direct Link */}
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 bg-emerald-100 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center"
                                    title="Open WhatsApp chat with prefilled balance reminder"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </a>

                                  {/* Phone Follow Up */}
                                  <button
                                    onClick={() => {
                                      setActiveFollowUpBill(b);
                                      setIsFollowUpModalOpen(true);
                                    }}
                                    className="p-1.5 bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                                    title="Log phone call / follow-up details"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 3. COLLECT FEE PAYMENT FORM (Department & Class Level Based) */}
      {activeTab === 'new-payment' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    Real-Time Terminal
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Department & Class Level Hierarchy</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Record Real-Time Fee Payment
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Select or enter the academic department, choose the class level, inspect the student roster or search students by name to record instant fee receipts.
                </p>
              </div>

              {/* Quick Status Pill */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
                <Users className="w-4 h-4 text-cyan-600" />
                <div className="text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Roster In View</span>
                  <span className="font-extrabold text-slate-900">{filteredStudentsForPayment.length} Students</span>
                </div>
              </div>
            </div>

            {/* Hierarchical Filters: Department, Class & Student Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
              {/* 1. Department Filter */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-600" />
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
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
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
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-700 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* 2. Class Level Filter */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-600" />
                  2. Class Level
                </label>
                <select
                  value={paymentClass}
                  onChange={(e) => setPaymentClass(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
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
                      paymentClass === 'All' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                        paymentClass === cls ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                  <Search className="w-3.5 h-3.5 text-cyan-600" />
                  3. Search Student
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by student name or ID..."
                    value={studentRosterSearch}
                    onChange={(e) => setStudentRosterSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500 shadow-2xs font-medium"
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
                      className="text-emerald-700 hover:underline font-bold"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main 2-Column Grid: Left = Class Roster / Student List, Right = Payment Entry Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Student Roster List (7 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-3xl shadow-sm border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
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
                    className="mt-3 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                  {filteredStudentsForPayment.map(st => {
                    const studentBill = bills.find(b => b.studentId === st.id || b.admissionNo === st.admissionNo);
                    const isSelected = st.id === selectedStudent?.id;
                    const balance = studentBill ? studentBill.balance : 715;
                    const hasArrears = balance > 0;

                    return (
                      <div
                        key={st.id}
                        onClick={() => handleStudentSelect(st.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {st.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-extrabold text-slate-900 truncate">
                                {st.fullName}
                              </h5>
                              {isSelected && (
                                <span className="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded-sm uppercase">
                                  Selected
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono text-slate-600 font-bold">{st.admissionNo}</span>
                              <span>•</span>
                              <span className="bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.2 rounded">
                                {st.className}
                              </span>
                              {st.department && (
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
                              {balance.toFixed(2)} CFA
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

            {/* Right Column: Active Payment Terminal & Form (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-slate-900">Payment Details</h4>
                    <p className="text-xs text-slate-500">Selected student billing information</p>
                  </div>
                  {selectedStudent && (
                    <span className="bg-cyan-100 text-cyan-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                      {selectedStudent.className}
                    </span>
                  )}
                </div>

                {selectedStudent ? (
                  <form onSubmit={handleRecordPayment} className="space-y-4">
                    {/* Selected Student Banner */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Selected Student</span>
                          <h4 className="text-base font-black text-white">{selectedStudent.fullName}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase text-slate-400 font-medium">Admission ID</span>
                          <p className="text-xs font-mono font-bold text-slate-200">{selectedStudent.admissionNo}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Class Level</span>
                          <span className="font-bold text-white">{selectedStudent.className}</span>
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
                    {selectedBill && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Billing Term</span>
                            <span className="font-bold text-slate-800">{selectedBill.className} • 2025-2026 Third Term</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Remaining Arrears</span>
                            <span className="font-mono font-black text-rose-600 text-base">{selectedBill.balance.toFixed(2)} CFA</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center text-xs">
                          <div className="bg-white p-2 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-400 uppercase block font-bold">Payable</span>
                            <span className="font-bold text-slate-800">{(selectedBill.payable ?? 0).toFixed(2)} CFA</span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-400 uppercase block font-bold">Paid to Date</span>
                            <span className="font-bold text-emerald-600">{(selectedBill.paid ?? 0).toFixed(2)} CFA</span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-400 uppercase block font-bold">Net Balance</span>
                            <span className="font-black text-rose-600">{(selectedBill.balance ?? 0).toFixed(2)} CFA</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Amount Paid input & Presets */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          Amount Paid (CFA) *
                        </label>
                        {selectedBill && selectedBill.balance > 0 && (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setAmountPaid(selectedBill.balance.toString())}
                              className="text-[10px] font-black bg-rose-100 hover:bg-rose-200 text-rose-800 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            >
                              Pay Full Balance ({(selectedBill.balance ?? 0).toFixed(0)} CFA)
                            </button>
                            <button
                              type="button"
                              onClick={() => setAmountPaid(((selectedBill.balance ?? 0) / 2).toFixed(2))}
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
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base font-black text-emerald-700 bg-white focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Payment Method *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Mobile money', 'Cash', 'Bank Transfer'] as const).map(method => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setPaymentMethod(method)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              paymentMethod === method
                                ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Paid As / Purpose */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <PaidAsSelector
                        value={paidAs}
                        onChange={setPaidAs}
                        label="Paid As (Fee Category / Tariff Purpose)"
                        required
                      />
                    </div>

                    {/* Collector Info */}
                    <div className="text-[11px] text-slate-500 flex items-center justify-between bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                      <span>Collector Attribution:</span>
                      <span className="font-bold text-slate-800">
                        {currentUser?.name 
                          ? `${currentUser.name} (${currentUser.role === 'sub_accountant' ? 'Sub-Accountant' : 'Accountant'})`
                          : 'Frank Mensah (Accountant)'}
                      </span>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-900/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <Check className="w-4 h-4" /> Record Payment & Issue Official Receipt
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold">Please select a student from the class roster list to proceed.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. FEE SETTINGS & TARIFFS TAB */}
      {activeTab === 'fee-settings' && (
        <FeesSettingsManager
          userRole="accountant"
          students={students}
          bills={bills}
          onAddPayment={onAddPayment}
          onAddNotification={onAddNotification}
          onApplyToBills={(updatedOpts) => {
            if (onUpdateBills) {
              // Trigger update if parent supports it
            }
          }}
        />
      )}

      {/* 5. INSTITUTIONAL EXPENSES & VOUCHERS */}
      {activeTab === 'expenses' && (
        <ExpenseManager
          currentUser={{
            id: 'acc-1',
            name: 'Denis Mawutor',
            role: 'accountant'
          }}
          canApprove={true}
          canDelete={true}
        />
      )}

      {/* 6. SECRETARY DESK RECORDS & HANDOVER RECONCILIATION */}
      {activeTab === 'secretary-records' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-xs font-black tracking-wider uppercase text-blue-600">
                  Front Desk & Bursary Handover
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Secretary Desk Collections & Cash Reconciliation
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Review daily tuition collections, point-of-sale receipts, petty cash disbursements, and certify daily physical cash handovers from the front desk.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-700">
                Daily Secretarial Handover Summaries ({getStoredSecretarySummaries().length})
              </h3>
              <span className="text-[11px] text-slate-400">Front Desk Reconciliation Ledger</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {getStoredSecretarySummaries().map((summary) => (
                <div key={summary.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900">{summary.date}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        summary.isReconciled 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {summary.isReconciled ? 'Reconciled & Received' : 'Pending Handover Confirmation'}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600 font-medium">Logged by: {summary.secretaryName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Collections: <strong className="text-emerald-700 font-mono">GH₵ {(summary.totalFeesCollected ?? 0).toFixed(2)}</strong> ({summary.receiptsCount} receipts) • Expenses: <strong className="text-rose-600 font-mono">GH₵ {((summary.totalExpensesIncurred ?? summary.totalExpensesLogged) ?? 0).toFixed(2)}</strong> • Net Cash to Bursary: <strong className="text-slate-900 font-mono">GH₵ {(summary.netCashOnHand ?? 0).toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!summary.isReconciled ? (
                      <button
                        onClick={() => {
                          const currentSummaries = getStoredSecretarySummaries();
                          const updated = currentSummaries.map(s => s.id === summary.id ? { ...s, isReconciled: true, reconciledBy: 'Denis Mawutor (Accountant)' } : s);
                          saveStoredSecretarySummaries(updated);
                          alert(`Handover for ${summary.date} marked as Reconciled & Received.`);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Accept & Reconcile</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Reconciled by {summary.reconciledBy || 'Bursary'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. STAFF PAYROLL & REMUNERATION TAB */}
      {activeTab === 'payroll' && (
        <PayrollManager
          currentUserRole="Accountant"
          onAddNotification={onAddNotification}
        />
      )}

      {/* 8. BANK DEPOSITS & SLIPS TAB */}
      {activeTab === 'bank-deposits' && (
        <BankDepositManager
          userRole={currentUser?.role === 'sub_accountant' ? 'sub_accountant' : 'accountant'}
          userName={currentUser?.name || 'Accountant'}
        />
      )}

      {/* 9. DEPARTMENTAL FINANCIAL SUMMARY TAB */}
      {activeTab === 'dept-financial-summary' && (
        <DepartmentalFinancialSummary
          students={students}
          bills={bills}
          payments={payments}
          expenses={expenses}
        />
      )}
        </motion.div>
      </AnimatePresence>

      {/* Official Printable Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 relative">
            <button
              onClick={() => setActiveReceipt(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 font-bold text-sm w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"
            >
              ✕
            </button>

            {/* School Receipt Header */}
            <div className="text-center border-b border-slate-200 pb-4 flex flex-col items-center">
              <JIPASLogo size="sm" className="mb-2" />
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                JIPAS
              </h2>
              <p className="text-[10px] text-slate-500">Official Fees & Tuition Payment Receipt • Est. 1990</p>
              <p className="text-[10px] font-mono text-slate-400 mt-1">Receipt No: <strong className="text-slate-900">{activeReceipt.receiptNo}</strong></p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Student Name</span>
                <span className="font-bold text-slate-900">{activeReceipt.studentName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Admission No</span>
                <span className="font-mono font-bold text-indigo-700">{activeReceipt.admissionNo}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Class</span>
                <span className="font-semibold text-slate-800">{activeReceipt.className}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Date & Time</span>
                <span className="font-mono text-slate-600">{activeReceipt.date}</span>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-bold text-[10px] uppercase">
                <tr>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5 text-right">Amount (CFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="p-2.5">{activeReceipt.paidAs}</td>
                  <td className="p-2.5 text-right font-mono font-bold text-emerald-700">{(activeReceipt.paid ?? 0).toFixed(2)} CFA</td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="p-2.5">Remaining Balance:</td>
                  <td className="p-2.5 text-right font-mono text-rose-600">{(activeReceipt.balance ?? 0).toFixed(2)} CFA</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-100">
              <span>Method: <strong className="text-slate-800">{activeReceipt.method}</strong></span>
              <span>Cashier: <strong className="text-slate-800">{activeReceipt.collectedBy}</strong></span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handlePrintReceipt(activeReceipt)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Generate & Print Official Receipt
              </button>
              <button
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fast Action Required Follow-Up Modal */}
      {isFollowUpModalOpen && activeFollowUpBill && (
        <ActionRequiredFollowUpModal
          isOpen={isFollowUpModalOpen}
          onClose={() => {
            setIsFollowUpModalOpen(false);
            setActiveFollowUpBill(null);
          }}
          bill={activeFollowUpBill}
          student={students.find(s => s.id === activeFollowUpBill.studentId || s.admissionNo === activeFollowUpBill.admissionNo)}
          onUpdateStatus={handleUpdateBillFollowUp}
          onRecordPayment={(studentId) => {
            handleStudentSelect(studentId);
            setActiveTab('new-payment');
          }}
          onSendNotificationAlert={(title, msg, targetStudentId) => {
            if (onAddNotification) {
              onAddNotification({
                id: `notif-${Date.now()}`,
                title,
                message: msg,
                recipientGroup: 'Parent & Student',
                targetAudience: 'student',
                dateSent: getFormattedTimestamp(),
                read: false,
                type: 'fee_alert'
              });
            }
          }}
        />
      )}

      {/* Automated Templated Fee Alerts Modal (SMS / WhatsApp / In-App Notification) */}
      {isAutomatedAlertModalOpen && (
        <AutomatedFeeAlertModal
          isOpen={isAutomatedAlertModalOpen}
          onClose={() => {
            setIsAutomatedAlertModalOpen(false);
            setAlertModalPreselectedStudentId(undefined);
          }}
          students={students}
          bills={bills}
          onAddNotification={onAddNotification}
          onUpdateBills={onUpdateBills}
          preSelectedStudentId={alertModalPreselectedStudentId}
          initialFilterStatus={alertModalInitialFilter}
        />
      )}

      {/* Bursary Financial Data Importer Modal */}
      <FinancialDataImporter
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportPayments={(importedPayments) => {
          importedPayments.forEach(p => onAddPayment(p));
        }}
        onImportBills={(importedBills) => {
          if (onUpdateBills) {
            const existingMap = new Map(bills.map(b => [b.admissionNo || b.id, b]));
            importedBills.forEach(ib => existingMap.set(ib.admissionNo || ib.id, ib));
            onUpdateBills(Array.from(existingMap.values()));
          }
        }}
        onImportExpenses={(importedExpenses) => {
          const existingExpenses = getStoredExpenses();
          const updated = [...importedExpenses, ...existingExpenses];
          saveStoredExpenses(updated);
        }}
      />
      </div>
    </div>
  );
}
