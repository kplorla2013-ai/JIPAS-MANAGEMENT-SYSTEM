import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentBill, PaymentRecord, Student, FeeOptionItem, NotificationItem, DailyFeeAuditSummary } from '../types';
import JIPASLogo from './common/JIPASLogo';
import PaidAsSelector from './common/PaidAsSelector';
import FeesSettingsManager from './common/FeesSettingsManager';
import OverdueFeeAlertsManager from './admin/OverdueFeeAlertsManager';
import AccountantSidebar from './accountant/AccountantSidebar';
import ActionRequiredFollowUpModal from './accountant/ActionRequiredFollowUpModal';
import GlobalSearchHeader from './common/GlobalSearchHeader';
import { runDailyFeeAudit, isDailyAuditDueToday, getStoredAuditSummary, getFormattedTimestamp } from '../services/feeAuditService';
import { 
  Calculator, CreditCard, DollarSign, Plus, FileText, 
  Search, Printer, Download, CheckCircle2, ArrowDownRight, Calendar, User, Check, Settings, AlertTriangle, Send,
  RotateCw, Filter, Phone, MessageSquare, Clock, Sparkles
} from 'lucide-react';

interface AccountantPortalProps {
  bills: StudentBill[];
  payments: PaymentRecord[];
  students: Student[];
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
  'overdue-alerts'
]);

export type AccountantTab = 'collections' | 'bills' | 'new-payment' | 'fee-settings' | 'overdue-alerts';

export const getInitialAccountantTab = (): AccountantTab => {
  if (typeof window !== 'undefined') {
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
  onAddPayment,
  onUpdateBills,
  onAddNotification
}: AccountantPortalProps) {
  const [activeTab, setActiveTab] = useState<AccountantTab>(() => getInitialAccountantTab());

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

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('All');
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

  // Financial calculations
  const totalCollected = payments.reduce((acc, p) => acc + p.paid, 0);
  const totalOutstanding = bills.reduce((acc, b) => acc + b.balance, 0);
  const totalBilled = bills.reduce((acc, b) => acc + b.payable, 0);

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
      collectedBy: 'Denis Mawutor (Accountant)'
    };

    onAddPayment(newPayment);
    setActiveReceipt(newPayment);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 4000);
    setActiveTab('collections');
  };

  const filteredPayments = payments.filter(p => {
    const matchSearch = p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.receiptNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMethod = filterMethod === 'All' || p.method === filterMethod;
    return matchSearch && matchMethod;
  });

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
              tabId === 'overdue-alerts'
            )) {
              setActiveTab(tabId as AccountantTab);
            }
          }}
          placeholder="Search students, bills, payment receipts, collection records..."
        />

        {/* Accountant Top Banner */}
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-cyan-900/40">
        <div className="flex items-center gap-5">
          <JIPASLogo size="lg" className="shrink-0" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-cyan-500/30 border border-cyan-400/40 text-cyan-100 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Accountant Portal • Bursary & Collections
              </span>
              <span className="bg-emerald-500/30 border border-emerald-400/40 text-emerald-100 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Live Real-Time Sync
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Financial & Accounts Department
            </h1>
            <p className="text-cyan-100/80 text-xs sm:text-sm mt-1">
              Official receipt generator, tuition reconciliation, and terminal billing records • Motto: Education is Wealth
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('new-payment')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Collect Fee Payment
          </button>
        </div>
      </div>

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

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
        <button
          onClick={() => setActiveTab('collections')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'collections' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Payment Collections & Receipts Log
        </button>
        <button
          onClick={() => setActiveTab('bills')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'bills' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Student Fee Bills & Outstanding Arrears
        </button>
        <button
          onClick={() => setActiveTab('new-payment')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'new-payment' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Collect Fee Payment
        </button>
        <button
          onClick={() => setActiveTab('fee-settings')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'fee-settings' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          Fees Settings & Tariffs
        </button>
        <button
          onClick={() => setActiveTab('overdue-alerts')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'overdue-alerts' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          Overdue Fee Alerts ({bills.filter(b => b.balance > 0).length})
        </button>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Payment Collections Log</h3>
              <p className="text-xs text-slate-500">Real-time repository of all issued receipts and collected funds.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search receipt, student or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-1 focus:ring-cyan-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold text-slate-700"
              >
                <option value="All">All Methods</option>
                <option value="Mobile money">Mobile money</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
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
                  <th className="p-3">Class</th>
                  <th className="p-3">Paid As</th>
                  <th className="p-3">Method</th>
                  <th className="p-3 text-right">Amount Paid</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPayments.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-blue-600">{p.receiptNo}</td>
                    <td className="p-3 text-slate-500 font-mono">{p.date}</td>
                    <td className="p-3 font-bold text-slate-900">{p.studentName}</td>
                    <td className="p-3 font-mono text-indigo-700 font-bold">{p.admissionNo}</td>
                    <td className="p-3 text-slate-700">{p.className}</td>
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
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs flex items-center gap-1 mx-auto"
                      >
                        <Printer className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                ))}
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
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">Student Fee Bills & Outstanding Balances</h3>
                  {actionRequiredBills.length > 0 && (
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                      {actionRequiredBills.length} Action Required
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">Live reconciliation of total charges, daily overdue audits, and bursary follow-up.</p>
              </div>

              {/* Filter Tabs */}
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
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  Unpaid Arrears ({bills.filter(b => b.balance > 0).length})
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
            </div>

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
                    <th className="p-3 w-12">#</th>
                    <th className="p-3">Admission No</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Class</th>
                    <th className="p-3 text-right">Total Payable</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right">Balance</th>
                    <th className="p-3">Audit / Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {displayedBills.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No student bills match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    displayedBills.map((b, idx) => {
                      const isAction = b.actionRequired || b.balance > 0;
                      return (
                        <tr 
                          key={b.id} 
                          className={isAction ? 'bg-rose-50/25 hover:bg-rose-50/60 border-l-4 border-l-rose-500' : 'hover:bg-slate-50'}
                        >
                          <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-indigo-700">{b.admissionNo}</td>
                          <td className="p-3 font-bold text-slate-900">
                            <div>{b.studentName}</div>
                            {b.lastContactDate && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                Contacted: {b.lastContactDate}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-700">{b.className}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800">{b.payable.toFixed(2)} CFA</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">{b.paid.toFixed(2)} CFA</td>
                          <td className={`p-3 text-right font-mono font-black text-sm ${b.balance === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {b.balance.toFixed(2)} CFA
                          </td>
                          <td className="p-3">
                            {isAction ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 bg-rose-100 border border-rose-300 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> Action Required
                                </span>
                                <div className="flex items-center gap-1 text-[10px]">
                                  <span className={`font-bold ${
                                    b.actionSeverity === 'Critical' || (!b.actionSeverity && b.balance >= 300)
                                      ? 'text-rose-700' 
                                      : 'text-amber-700'
                                  }`}>
                                    {b.actionSeverity || (b.balance >= 300 ? 'Critical' : 'Moderate')}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-600 font-medium">{b.actionStatus || 'Pending Follow-up'}</span>
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
                              >
                                Collect
                              </button>
                              {isAction && (
                                <button
                                  onClick={() => {
                                    setActiveFollowUpBill(b);
                                    setIsFollowUpModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Fast follow-up with parent via WhatsApp/Call/Portal"
                                >
                                  <Phone className="w-3 h-3" />
                                  Follow Up
                                </button>
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

      {/* 3. COLLECT FEE PAYMENT FORM */}
      {activeTab === 'new-payment' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900">Record Real-Time Fee Payment</h3>
            <p className="text-xs text-slate-500">Issue an authentic receipt and deduct student fee arrears in real time.</p>
          </div>

          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Student *</label>
              <select
                value={selectedStudentId}
                onChange={(e) => handleStudentSelect(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-cyan-500"
              >
                {students.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.admissionNo} • {st.className})
                  </option>
                ))}
              </select>
            </div>

            {selectedBill && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 block">Current Bill Status</span>
                  <span className="font-bold text-slate-800">{selectedBill.className} • 2025-2026 Third Term</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Remaining Balance</span>
                  <span className="font-mono font-black text-rose-600 text-sm">{selectedBill.balance.toFixed(2)} CFA</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount Paid (CFA) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-black text-emerald-700 bg-white focus:ring-2 focus:ring-cyan-500 text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="Mobile money">Mobile money</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <PaidAsSelector
                value={paidAs}
                onChange={setPaidAs}
                label="Paid As (Description / Purpose of Payment)"
                required
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" /> Record Payment & Issue Official Receipt
              </button>
            </div>
          </form>
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
                  <td className="p-2.5 text-right font-mono font-bold text-emerald-700">{activeReceipt.paid.toFixed(2)} CFA</td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="p-2.5">Remaining Balance:</td>
                  <td className="p-2.5 text-right font-mono text-rose-600">{activeReceipt.balance.toFixed(2)} CFA</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-100">
              <span>Method: <strong className="text-slate-800">{activeReceipt.method}</strong></span>
              <span>Cashier: <strong className="text-slate-800">{activeReceipt.collectedBy}</strong></span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
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
      </div>
    </div>
  );
}
