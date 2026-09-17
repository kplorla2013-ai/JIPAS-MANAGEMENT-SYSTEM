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
  saveStoredSecretarySummaries
} from '../services/storageService';
import JIPASLogo from './common/JIPASLogo';
import QuickActionSpeedDial from './common/QuickActionSpeedDial';
import ExpenseManager from './common/ExpenseManager';
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
  BookOpen
} from 'lucide-react';

interface SecretaryPortalProps {
  secretary: User;
  students: Student[];
  bills: StudentBill[];
  payments: PaymentRecord[];
  calendarEvents?: CalendarEvent[];
  notifications?: NotificationItem[];
  onAddPayment: (payment: PaymentRecord) => void;
  onAddNotification?: (notif: NotificationItem) => void;
  onLogout?: () => void;
}

type SecretaryActiveTab = 'fee_collection' | 'expenses' | 'daily_reconcile' | 'students_lookup';

export default function SecretaryPortal({
  secretary,
  students,
  bills,
  payments,
  calendarEvents = [],
  notifications = [],
  onAddPayment,
  onAddNotification,
  onLogout
}: SecretaryPortalProps) {
  const [activeTab, setActiveTab] = useState<SecretaryActiveTab>('fee_collection');
  const [expenses, setExpenses] = useState<SchoolExpenseRecord[]>(() => getStoredExpenses());
  const [summaries, setSummaries] = useState<SecretaryDailySummary[]>(() => getStoredSecretarySummaries());

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
    showToast(`Payment of GH₵ ${amountNum.toFixed(2)} received for ${selectedStudent.name}.`);

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
            <div class="amount-val">GH₵ ${rec.amount.toFixed(2)}</div>
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
              GH₵ {totalFeesCollectedToday.toFixed(2)}
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
              GH₵ {totalExpensesLoggedToday.toFixed(2)}
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
              GH₵ {netCashOnHand.toFixed(2)}
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
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: COLLECT SCHOOL FEES                                    */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'fee_collection' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Student Search & Payment Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">Student Fee Collection Desk</h2>
                    <p className="text-xs text-slate-500">Search student to load billing and record cash/MoMo</p>
                  </div>
                </div>
              </div>

              {/* Student Search Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  1. Search Student (Name, Admission No, or Class)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchStudentQuery}
                    onChange={(e) => setSearchStudentQuery(e.target.value)}
                    placeholder="e.g. Ama Serwaa, ADM/26/0001, JHS 2..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  {searchStudentQuery && (
                    <button 
                      onClick={() => setSearchStudentQuery('')}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Search Dropdown Results */}
                {filteredStudents.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto z-20">
                    {filteredStudents.map(st => (
                      <div
                        key={st.id}
                        onClick={() => {
                          setSelectedStudent(st);
                          setSearchStudentQuery('');
                        }}
                        className="p-3 hover:bg-blue-50/70 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                            {st.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{st.name}</div>
                            <div className="text-[10px] text-slate-500">{st.admissionNo} • {st.currentClass}</div>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                          Select Student →
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Student Card */}
              {selectedStudent ? (
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                        {selectedStudent.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{selectedStudent.name}</h3>
                        <p className="text-[11px] text-slate-500">
                          {selectedStudent.admissionNo} • {selectedStudent.currentClass} • {selectedStudent.gender}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800"
                    >
                      Change Student
                    </button>
                  </div>

                  {studentFinancials && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-200/60 text-center">
                      <div className="p-2 bg-white rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Billed</span>
                        <span className="text-xs font-black text-slate-900 font-mono">
                          GH₵ {studentFinancials.totalBilled.toFixed(2)}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-emerald-600 block">Total Paid</span>
                        <span className="text-xs font-black text-emerald-700 font-mono">
                          GH₵ {studentFinancials.totalPaid.toFixed(2)}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-rose-600 block">Current Arrears</span>
                        <span className="text-xs font-black text-rose-700 font-mono">
                          GH₵ {studentFinancials.outstandingArrears.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Payment Collection Form */}
                  <form onSubmit={handleProcessPayment} className="pt-3 border-t border-blue-200/60 space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Amount to Pay (GH₵) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-mono font-black text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        {studentFinancials && studentFinancials.outstandingArrears > 0 && (
                          <button
                            type="button"
                            onClick={() => setPaymentAmount(studentFinancials.outstandingArrears.toString())}
                            className="text-[10px] font-bold text-blue-600 hover:underline mt-1 block"
                          >
                            Fill Full Arrears (GH₵ {studentFinancials.outstandingArrears.toFixed(2)})
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Payment Method *
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Cash">Cash (Front Desk)</option>
                          <option value="Mobile Money">Mobile Money (MoMo)</option>
                          <option value="Bank Transfer">Bank Deposit / Transfer</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Transaction Ref / MoMo ID
                        </label>
                        <input
                          type="text"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder="e.g. MOM-44912 or Cash Ref"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Collecting Secretary
                        </label>
                        <input
                          type="text"
                          disabled
                          value={`${secretary.name} (Secretary)`}
                          className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Receipt Notes & Bill Description
                      </label>
                      <input
                        type="text"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="e.g. Tuition fee part-payment for Term 3"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800"
                      />
                    </div>

                    <button
                      type="submit"
                      id="btn-process-fee-collection"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black rounded-xl text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Process Payment & Issue Official Receipt</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                  <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto">
                    <Search className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No Student Selected</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Type a student name or admission number in the search box above to begin fee processing.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Today's Desk Receipts Feed */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                    Today's Desk Collections ({todaySecretaryPayments.length})
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  GH₵ {totalFeesCollectedToday.toFixed(2)}
                </span>
              </div>

              {todaySecretaryPayments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-1">
                  <Clock className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                  <p className="text-xs font-bold text-slate-600">No Payments Received Today</p>
                  <p className="text-[10px]">Transactions collected today will appear here in real-time.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {todaySecretaryPayments.map(p => (
                    <div key={p.id} className="p-3 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl border border-slate-200/60 transition-colors flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-slate-900">{p.studentName}</div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {p.admissionNo} • {p.paymentMethod} • Ref: {p.referenceNo}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-700 font-mono">
                          GH₵ {p.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handlePrintReceipt(p)}
                          title="Print Receipt"
                          className="p-1.5 bg-white text-slate-700 hover:bg-slate-200 rounded-lg border border-slate-200 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                    <span className="font-bold text-emerald-700 font-mono">+ GH₵ {totalFeesCollectedToday.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-600">Total Operational Expenses Logged:</span>
                    <span className="font-bold text-rose-700 font-mono">- GH₵ {totalExpensesLoggedToday.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm">
                    <span className="text-slate-900">Net Physical Cash to Hand Over:</span>
                    <span className="text-blue-700 font-mono">GH₵ {netCashOnHand.toFixed(2)}</span>
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
                          <span className="font-bold text-emerald-700">GH₵ {s.totalFeesCollected.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Expenses</span>
                          <span className="font-bold text-rose-700">GH₵ {s.totalExpensesLogged.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Net Cash</span>
                          <span className="font-bold text-blue-700">GH₵ {s.netCashOnHand.toFixed(2)}</span>
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
                        GH₵ {arrears.toFixed(2)}
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
                <span className="font-black text-emerald-700 font-mono text-sm">GH₵ {lastIssuedReceipt.amount.toFixed(2)}</span>
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
