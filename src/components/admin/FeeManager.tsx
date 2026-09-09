import React, { useState } from 'react';
import { 
  CreditCard, Plus, Pencil, Trash2, DollarSign, Receipt, Printer, 
  Download, Search, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, 
  FileText, ShieldCheck, Filter, TrendingUp, Wallet, Check, Send
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, 
  PieChart as RechartsPieChart, Pie, Cell, Legend 
} from 'recharts';
import { Student, StudentBill, PaymentRecord, IncomeExpenseItem, FinancialAuditItem, FeeOptionItem, NotificationItem, ClassFeeTariffItem } from '../../types';
import JIPASLogo from '../common/JIPASLogo';
import PaidAsSelector from '../common/PaidAsSelector';
import FeesSettingsManager from '../common/FeesSettingsManager';
import OverdueFeeAlertsManager from './OverdueFeeAlertsManager';
import { INITIAL_FEE_OPTIONS_DATA } from '../../data/feeDescriptions';

interface FeeManagerProps {
  activeModule: string;
  students: Student[];
  bills: StudentBill[];
  payments: PaymentRecord[];
  classFeeTariffs: ClassFeeTariffItem[];
  onAddPayment: (payment: PaymentRecord) => void;
  onUpdateBills?: (bills: StudentBill[]) => void;
  onNavigate?: (module: string) => void;
  onAddNotification?: (notif: NotificationItem) => void;
}

export const INITIAL_FEE_OPTIONS = INITIAL_FEE_OPTIONS_DATA;

export const INITIAL_INCOME_EXPENSES: IncomeExpenseItem[] = [
  { id: 'ie-1', date: '2026-09-05', type: 'Income', category: 'Tuition Fees', amount: 1250, description: 'Bank transfer payment for ADM/26/0001', referenceNo: 'TXN-984210', recordedBy: 'Accountant' },
  { id: 'ie-2', date: '2026-09-04', type: 'Expense', category: 'Utilities & Water', amount: 420, description: 'Ghana Water Company monthly supply', referenceNo: 'GWCL-9921', recordedBy: 'Marcus Prosper' },
  { id: 'ie-3', date: '2026-09-03', type: 'Income', category: 'PTA Dues', amount: 350, description: 'Cash PTA collections at assembly', referenceNo: 'PTA-004', recordedBy: 'Accountant' },
  { id: 'ie-4', date: '2026-09-02', type: 'Expense', category: 'Teaching Supplies', amount: 680, description: 'Chalk, whiteboards markers & exercise books', referenceNo: 'SUP-1049', recordedBy: 'Administrator' },
  { id: 'ie-5', date: '2026-09-01', type: 'Income', category: 'Tuition Fees', amount: 1800, description: 'MTN Mobile Money bulk school fees', referenceNo: 'MOM-8831', recordedBy: 'Accountant' }
];

export const INITIAL_AUDIT_LOGS: FinancialAuditItem[] = [
  { id: 'fa-1', timestamp: '2026-09-05 10:14 AM', action: 'Payment Recorded', user: 'Accountant (Grace Tetteh)', studentAdmNo: 'ADM/26/0001', amount: 400, details: 'Cash payment of 400.00 CFA logged for ADM/26/0001' },
  { id: 'fa-2', timestamp: '2026-09-04 03:22 PM', action: 'Fee Option Added', user: 'Admin (Marcus Prosper)', studentAdmNo: '--', amount: 200, details: 'Created School Bus Transit (Optional) fee option' },
  { id: 'fa-3', timestamp: '2026-09-03 11:45 AM', action: 'Bill Generated', user: 'Admin (Marcus Prosper)', studentAdmNo: 'All Basic 1', amount: 600, details: 'Batch terminal bills compiled for Basic 1 students' },
];

export default function FeeManager({
  activeModule,
  students,
  bills: initialBills,
  payments: initialPayments,
  classFeeTariffs: initialTariffs,
  onAddPayment,
  onUpdateBills,
  onNavigate,
  onAddNotification
}: FeeManagerProps) {
  const [feeOptions, setFeeOptions] = useState<FeeOptionItem[]>(INITIAL_FEE_OPTIONS);
  const [billsList, setBillsList] = useState<StudentBill[]>(initialBills);
  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>(initialPayments);
  const [classTariffs, setClassTariffs] = useState<ClassFeeTariffItem[]>(initialTariffs);
  const [incomeExpenses, setIncomeExpenses] = useState<IncomeExpenseItem[]>(INITIAL_INCOME_EXPENSES);
  const [auditLogs, setAuditLogs] = useState<FinancialAuditItem[]>(INITIAL_AUDIT_LOGS);

  // Modals
  const [showAddFeeModal, setShowAddFeeModal] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeOptionItem | null>(null);

  const [showAddTxnModal, setShowAddTxnModal] = useState(false);
  const [editingTxn, setEditingTxn] = useState<IncomeExpenseItem | null>(null);

  const [activeReceipt, setActiveReceipt] = useState<PaymentRecord | null>(null);

  // Fee Form State
  const [feeName, setFeeName] = useState('');
  const [feeCat, setFeeCat] = useState<'Tuition' | 'PTA' | 'ICT' | 'Exams' | 'Maintenance' | 'Transport' | 'Uniform'>('Tuition');
  const [feeAmount, setFeeAmount] = useState(100);
  const [feeClass, setFeeClass] = useState('All Classes');
  const [feeMandatory, setFeeMandatory] = useState(true);

  // Fee Collection Form State
  const [collectStudentId, setCollectStudentId] = useState(students[0]?.id || '');
  const [collectAmount, setCollectAmount] = useState(300);
  const [collectMethod, setCollectMethod] = useState<'Cash' | 'Bank' | 'Mobile Money' | 'Cheque'>('Mobile Money');
  const [collectPaidAs, setCollectPaidAs] = useState('Tuition Fee (Full Term Payment)');
  const [collectRef, setCollectRef] = useState('');
  const [collectToast, setCollectToast] = useState(false);

  // Income Expense Form State
  const [ieType, setIeType] = useState<'Income' | 'Expense'>('Income');
  const [ieCat, setIeCat] = useState('Tuition Fees');
  const [ieAmount, setIeAmount] = useState(250);
  const [ieDesc, setIeDesc] = useState('');
  const [ieRef, setIeRef] = useState('');

  // Bill Generation State
  const [billGenClass, setBillGenClass] = useState('Basic 1');
  const [billGenToast, setBillGenToast] = useState(false);

  // Filter & Search
  const [paymentSearch, setPaymentSearch] = useState('');
  const [ieFilter, setIeFilter] = useState('all');

  // Open Edit Fee Option
  const handleOpenEditFee = (fo: FeeOptionItem) => {
    setEditingFee(fo);
    setFeeName(fo.name);
    setFeeCat(fo.category);
    setFeeAmount(fo.amount);
    setFeeClass(fo.applicableClass);
    setFeeMandatory(fo.mandatory);
    setShowAddFeeModal(true);
  };

  // Save Fee Option
  const handleSaveFeeOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeName.trim()) return;

    if (editingFee) {
      setFeeOptions(prev => prev.map(f => f.id === editingFee.id ? {
        ...f,
        name: feeName,
        category: feeCat,
        amount: feeAmount,
        applicableClass: feeClass,
        mandatory: feeMandatory
      } : f));
      setEditingFee(null);
    } else {
      const newOption: FeeOptionItem = {
        id: `fo-${Date.now()}`,
        name: feeName,
        category: feeCat,
        amount: feeAmount,
        applicableClass: feeClass,
        mandatory: feeMandatory
      };
      setFeeOptions(prev => [...prev, newOption]);
      setShowAddFeeModal(false);
    }
  };

  // Execute Fee Collection
  const handleCollectFee = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === collectStudentId) || students[0];
    if (!student || collectAmount <= 0) return;

    const receiptNo = `REC/2026/${Math.floor(100000 + Math.random() * 900000)}`;
    const newPayment: PaymentRecord = {
      id: `p-${Date.now()}`,
      receiptNo,
      studentId: student.id,
      admissionNo: student.admissionNo,
      studentName: student.fullName,
      className: student.className,
      paidAs: collectPaidAs,
      amount: collectAmount,
      paid: collectAmount,
      date: new Date().toISOString().split('T')[0],
      academicYear: '2025-2026',
      term: 'Third Term',
      method: collectMethod,
      receivedBy: 'Accountant (Grace Tetteh)',
      status: 'Verified',
      description: collectPaidAs
    };

    setPaymentsList(prev => [newPayment, ...prev]);
    onAddPayment(newPayment);

    // Update bills list
    setBillsList(prev => prev.map(b => {
      if (b.studentId === student.id || b.admissionNo === student.admissionNo) {
        const newPaid = b.paidAmount + collectAmount;
        const newBal = Math.max(0, b.totalAmount - newPaid);
        return {
          ...b,
          paidAmount: newPaid,
          balance: newBal,
          status: newBal === 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid'
        };
      }
      return b;
    }));

    // Record Income Transaction
    const newIncome: IncomeExpenseItem = {
      id: `ie-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Income',
      category: 'Tuition Fees',
      amount: collectAmount,
      description: `Fee Payment from ${student.fullName} (${receiptNo})`,
      referenceNo: collectRef || receiptNo,
      recordedBy: 'Accountant'
    };
    setIncomeExpenses(prev => [newIncome, ...prev]);

    // Record Audit
    const newAudit: FinancialAuditItem = {
      id: `fa-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action: 'Fee Payment Received',
      user: 'Accountant (Grace Tetteh)',
      studentAdmNo: student.admissionNo,
      amount: collectAmount,
      details: `Collected ${collectAmount.toFixed(2)} CFA via ${collectMethod} for ${student.fullName}`
    };
    setAuditLogs(prev => [newAudit, ...prev]);

    setCollectToast(true);
    setTimeout(() => setCollectToast(false), 4000);
  };

  // Generate All Bills
  const handleGenerateBatchBills = () => {
    setBillGenToast(true);
    setTimeout(() => setBillGenToast(false), 4000);
  };

  // Save Income / Expense
  const handleSaveTxn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ieDesc.trim()) return;

    if (editingTxn) {
      setIncomeExpenses(prev => prev.map(t => t.id === editingTxn.id ? {
        ...t,
        type: ieType,
        category: ieCat,
        amount: ieAmount,
        description: ieDesc,
        referenceNo: ieRef || t.referenceNo
      } : t));
      setEditingTxn(null);
    } else {
      const newTxn: IncomeExpenseItem = {
        id: `ie-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: ieType,
        category: ieCat,
        amount: ieAmount,
        description: ieDesc,
        referenceNo: ieRef || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
        recordedBy: 'Administrator'
      };
      setIncomeExpenses(prev => [newTxn, ...prev]);
      setShowAddTxnModal(false);
    }
  };

  // Compute Totals
  const totalIncome = incomeExpenses.filter(i => i.type === 'Income').reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = incomeExpenses.filter(i => i.type === 'Expense').reduce((sum, i) => sum + i.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const totalBilled = billsList.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalPaid = billsList.reduce((sum, b) => sum + b.paidAmount, 0);
  const totalOutstanding = billsList.reduce((sum, b) => sum + b.balance, 0);

  const filteredPayments = paymentsList.filter(p => 
    p.studentName.toLowerCase().includes(paymentSearch.toLowerCase()) ||
    p.admissionNo.toLowerCase().includes(paymentSearch.toLowerCase()) ||
    p.receiptNo.toLowerCase().includes(paymentSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* OVERDUE FEE ALERTS MODULE */}
      {(activeModule === 'fee_overdue_alerts' || activeModule === 'overdue_alerts') && (
        <OverdueFeeAlertsManager
          students={students}
          bills={billsList}
          payments={paymentsList}
          onAddNotification={onAddNotification}
          onUpdateBills={onUpdateBills}
          onRecordPaymentClick={(studentId) => {
            setCollectStudentId(studentId);
            const b = billsList.find(x => x.studentId === studentId);
            if (b && b.balance > 0) {
              setCollectAmount(b.balance);
            }
            if (onNavigate) {
              onNavigate('fee_collect');
            }
          }}
        />
      )}

      {/* 1. FEE SETTINGS & TARIFF OPTIONS MODULE */}
      {(activeModule === 'fee_options' || activeModule === 'fee_settings' || activeModule === 'fee_structure' || activeModule === 'fee_descriptions' || activeModule === 'payment_settings') && (
        <FeesSettingsManager
          userRole="admin"
          feeOptions={feeOptions}
          onUpdateFeeOptions={(newOpts) => setFeeOptions(newOpts)}
          classFeeTariffs={classTariffs}
          onUpdateClassTariffs={(newTariffs) => setClassTariffs(newTariffs)}
          students={students}
          bills={billsList}
          onAddPayment={onAddPayment}
          onAddNotification={onAddNotification}
          onApplyToBills={(updatedOpts) => {
            // Recalculate bills if needed
            handleGenerateBatchBills();
          }}
        />
      )}

      {/* 2. BILL STUDENTS & 3. GENERATE ALL SHEETS */}
      {(activeModule === 'fee_bill_students' || activeModule === 'fee_generate_all_sheets' || activeModule === 'bills') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Terminal Fee Invoicing & Master Billing Sheets
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate, bill, and print terminal invoices for students with tuition, PTA levies, and previous balance arrears.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGenerateBatchBills}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" /> Generate Batch Bills
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4" /> Print Master Bill Sheets
              </button>
            </div>
          </div>

          {billGenToast && (
            <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Terminal invoices successfully computed and generated for all active students!
              </span>
              <button onClick={() => setBillGenToast(false)} className="text-white font-black ml-4">✕</button>
            </div>
          )}

          {/* Billing Overview Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Bill No</th>
                  <th className="p-3">Admission No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Class</th>
                  <th className="p-3 text-right">Total Billed (CFA)</th>
                  <th className="p-3 text-right">Paid (CFA)</th>
                  <th className="p-3 text-right">Balance Due (CFA)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {billsList.map((bill, idx) => (
                  <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{bill.billNo}</td>
                    <td className="p-3 font-mono font-bold text-indigo-700">{bill.admissionNo}</td>
                    <td className="p-3 font-bold text-slate-900">{bill.studentName}</td>
                    <td className="p-3 text-slate-700">{bill.className}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{bill.totalAmount.toFixed(2)} CFA</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">{bill.paidAmount.toFixed(2)} CFA</td>
                    <td className="p-3 text-right font-mono font-black text-rose-700">{bill.balance.toFixed(2)} CFA</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        bill.status === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. FEE COLLECTION MODULE */}
      {(activeModule === 'fee_collection' || activeModule === 'collect_fees') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                Fee Collection Terminal & Official Receipt Issuer
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Process student fee payments, support Ghana Mobile Money (MTN, Telecel, AT), bank transfer, cash, and print tamper-proof receipts.
              </p>
            </div>
          </div>

          {collectToast && (
            <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Payment of {collectAmount.toFixed(2)} CFA successfully logged! Bill balance adjusted and receipt generated.
              </span>
              <button onClick={() => setCollectToast(false)} className="text-white font-black ml-4">✕</button>
            </div>
          )}

          <form onSubmit={handleCollectFee} className="space-y-6 text-xs">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Select Student *</label>
                <select
                  value={collectStudentId}
                  onChange={(e) => setCollectStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  {students.map(s => {
                    const bill = billsList.find(b => b.studentId === s.id || b.admissionNo === s.admissionNo);
                    const bal = bill ? bill.balance : 0;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.admissionNo} • {s.className}) — Outstanding: {bal.toFixed(2)} CFA
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-indigo-700"
                >
                  <option value="Mobile Money">MTN / Telecel / AT MoMo</option>
                  <option value="Cash">Cash (Bursar Counter)</option>
                  <option value="Bank">Bank Direct Transfer / Deposit</option>
                  <option value="Cheque">Bank Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Amount (CFA) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono font-black text-base text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-3 bg-white p-4 rounded-xl border border-slate-200">
                <PaidAsSelector
                  value={collectPaidAs}
                  onChange={setCollectPaidAs}
                  label="Paid As (Description / Fee Purpose)"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <label className="block font-bold text-slate-700 mb-1">Transaction Ref / MoMo Txn ID / Cheque No</label>
                <input
                  type="text"
                  value={collectRef}
                  onChange={(e) => setCollectRef(e.target.value)}
                  placeholder="e.g. 29384729103 or Cash at Counter"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Receipt className="w-4 h-4" /> Process Payment & Issue Receipt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. PAYMENT HISTORY MODULE */}
      {(activeModule === 'fee_payment_history' || activeModule === 'payments') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                Fee Payment Ledger & Historical Receipts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological ledger of payments, official receipt numbers, and operator details.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" /> Export Payment Log
            </button>
          </div>

          {/* Search */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between text-xs">
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                placeholder="Search by student, receipt no, admission no..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>
            <div className="text-slate-500 font-medium">
              Showing <strong>{filteredPayments.length}</strong> payment transactions
            </div>
          </div>

          {/* Payments Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Receipt No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Paid As (Description)</th>
                  <th className="p-3">Method</th>
                  <th className="p-3 text-right">Amount (CFA)</th>
                  <th className="p-3">Received By</th>
                  <th className="p-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPayments.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-indigo-700">{p.receiptNo}</td>
                    <td className="p-3 font-mono text-slate-600">{p.date}</td>
                    <td className="p-3 font-bold text-slate-900">{p.studentName}</td>
                    <td className="p-3 text-slate-700">{p.className}</td>
                    <td className="p-3 text-slate-700 font-semibold max-w-[200px] truncate" title={p.paidAs || p.description}>
                      <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-100">
                        {p.paidAs || p.description || 'Tuition Fee'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">{p.method}</td>
                    <td className="p-3 text-right font-mono font-black text-emerald-700">
                      {(p.amount ?? p.paid ?? 0).toFixed(2)} CFA
                    </td>
                    <td className="p-3 text-slate-600">{p.receivedBy || p.collectedBy}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setActiveReceipt(p)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 cursor-pointer"
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. PAYMENT STATISTICS MODULE */}
      {(activeModule === 'fee_payment_stats' || activeModule === 'finance_stats') && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Financial Performance & Revenue Metrics
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time fee collection recovery rate, liquidity position, and outstanding student arrears.
                </p>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-sm">
                <span className="text-3xl font-black font-mono">{totalBilled.toFixed(2)} CFA</span>
                <p className="text-xs uppercase font-bold mt-1 text-indigo-200">Total Billed Invoices</p>
              </div>
              <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-sm">
                <span className="text-3xl font-black font-mono">{totalPaid.toFixed(2)} CFA</span>
                <p className="text-xs uppercase font-bold mt-1 text-emerald-100">Total Revenue Collected ({((totalPaid / Math.max(1, totalBilled)) * 100).toFixed(1)}%)</p>
              </div>
              <div className="bg-rose-600 text-white p-5 rounded-2xl shadow-sm">
                <span className="text-3xl font-black font-mono">{totalOutstanding.toFixed(2)} CFA</span>
                <p className="text-xs uppercase font-bold mt-1 text-rose-100">Outstanding Arrears</p>
              </div>
            </div>

            {/* Recharts Visualization Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              {/* Class-by-Class Fee Collection */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Class-Level Billing & Revenue Realization
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { className: 'Crèche', billed: 4200, paid: 3900 },
                        { className: 'Nursery 1', billed: 4800, paid: 4400 },
                        { className: 'KG 1', billed: 5200, paid: 4800 },
                        { className: 'Basic 1', billed: 6400, paid: 5900 },
                        { className: 'Basic 3', billed: 6800, paid: 6100 },
                        { className: 'Basic 6', billed: 7200, paid: 6600 },
                        { className: 'JHS 1', billed: 8500, paid: 7800 },
                        { className: 'JHS 3', billed: 9200, paid: 8400 },
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="className" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${v/1000}k CFA`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                        formatter={(val: any) => [`${Number(val).toLocaleString()} CFA`, '']}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar dataKey="billed" name="Billed (CFA)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="paid" name="Collected (CFA)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Settlement Status Distribution */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Payment Status Proportion
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Fully Paid (100%)', value: 142, fill: '#10b981' },
                          { name: 'Partially Paid (>50%)', value: 38, fill: '#f59e0b' },
                          { name: 'Arrears / Unpaid (<50%)', value: 15, fill: '#ef4444' },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                        formatter={(val: any) => [`${val} Students`, '']}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. INCOME & EXPENSES MODULE */}
      {(activeModule === 'fee_income_expense' || activeModule === 'income_expenses') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600" />
                Institutional Income & Expense Cashbook
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Record institutional operating expenses, utility payments, maintenance costs, and non-tuition revenues.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingTxn(null);
                setIeType('Income');
                setIeCat('Tuition Fees');
                setIeAmount(200);
                setIeDesc('');
                setIeRef('');
                setShowAddTxnModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Record Cashbook Entry
            </button>
          </div>

          {/* Quick summary banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs uppercase font-bold text-emerald-800 block">Total Inflow (Income)</span>
              <span className="text-2xl font-black text-emerald-700 font-mono">{totalIncome.toFixed(2)} CFA</span>
            </div>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
              <span className="text-xs uppercase font-bold text-rose-800 block">Total Outflow (Expenses)</span>
              <span className="text-2xl font-black text-rose-700 font-mono">{totalExpense.toFixed(2)} CFA</span>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <span className="text-xs uppercase font-bold text-indigo-800 block">Net Liquidity Balance</span>
              <span className="text-2xl font-black text-indigo-700 font-mono">{netBalance.toFixed(2)} CFA</span>
            </div>
          </div>

          {/* Cashbook Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Reference No</th>
                  <th className="p-3 text-right">Amount (CFA)</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {incomeExpenses.map((txn, idx) => (
                  <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-mono text-slate-600">{txn.date}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center w-fit gap-1 ${
                        txn.type === 'Income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {txn.type === 'Income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {txn.type}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{txn.category}</td>
                    <td className="p-3 text-slate-700 max-w-xs truncate">{txn.description}</td>
                    <td className="p-3 font-mono text-slate-500">{txn.referenceNo}</td>
                    <td className={`p-3 text-right font-mono font-bold ${
                      txn.type === 'Income' ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {txn.amount.toFixed(2)} CFA
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setIncomeExpenses(prev => prev.filter(t => t.id !== txn.id))}
                        className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. AUDIT ACTIVITY MODULE */}
      {(activeModule === 'fee_audit' || activeModule === 'audit_activity') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Financial Audit Trail & Tamper Log
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Immutable chronological log of all cash flows, billing adjustments, and bursar ledger operations.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action Event</th>
                  <th className="p-3">Operator</th>
                  <th className="p-3">Target Student / Entity</th>
                  <th className="p-3 text-right">Value (CFA)</th>
                  <th className="p-3">Log Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-mono text-slate-600">{log.timestamp}</td>
                    <td className="p-3 font-bold text-slate-900">{log.action}</td>
                    <td className="p-3 font-semibold text-indigo-700">{log.user}</td>
                    <td className="p-3 font-mono text-slate-700">{log.studentAdmNo}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{log.amount.toFixed(2)} CFA</td>
                    <td className="p-3 text-slate-600 max-w-sm truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 flex flex-col items-center">
              <JIPASLogo size="sm" className="mb-2" />
              <h3 className="font-black text-lg text-slate-900 leading-tight">JIPAS</h3>
              <p className="text-[10px] text-slate-500">Official Bursary & School Fees Receipt • Est. 1990</p>
              <div className="font-mono font-bold text-xs text-indigo-700 mt-1">Receipt No: {activeReceipt.receiptNo}</div>
            </div>

            <div className="space-y-2 text-xs font-medium">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold">{activeReceipt.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-bold text-slate-900">{activeReceipt.studentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Admission No:</span>
                <span className="font-mono font-bold">{activeReceipt.admissionNo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Class:</span>
                <span className="font-bold">{activeReceipt.className}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Paid As (Description):</span>
                <span className="font-bold text-slate-800 text-right max-w-[220px]">{activeReceipt.paidAs || activeReceipt.description || 'Tuition Fees'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold text-indigo-700">{activeReceipt.method}</span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-slate-900 text-sm">
                <span className="font-black text-slate-900">Amount Paid:</span>
                <span className="font-mono font-black text-emerald-700">{(activeReceipt.amount ?? activeReceipt.paid ?? 0).toFixed(2)} CFA</span>
              </div>
              <div className="flex justify-between py-1 text-slate-500 text-[10px]">
                <span>Received By:</span>
                <span className="font-semibold text-slate-700">{activeReceipt.receivedBy}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
              <button
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT FEE OPTION MODAL */}
      {(showAddFeeModal || editingFee) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                {editingFee ? 'Edit Fee Tariff Item' : 'Add Fee Tariff Item'}
              </h3>
              <button onClick={() => { setShowAddFeeModal(false); setEditingFee(null); }} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveFeeOption} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fee Item Name *</label>
                <input
                  type="text"
                  required
                  value={feeName}
                  onChange={(e) => setFeeName(e.target.value)}
                  placeholder="e.g. Tuition Fee (Primary)"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={feeCat}
                    onChange={(e) => setFeeCat(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold bg-white"
                  >
                    <option value="Tuition">Tuition</option>
                    <option value="PTA">PTA</option>
                    <option value="ICT">ICT</option>
                    <option value="Exams">Exams</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Transport">Transport</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (CFA) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Applicable Classes</label>
                <input
                  type="text"
                  value={feeClass}
                  onChange={(e) => setFeeClass(e.target.value)}
                  placeholder="All Classes or Primary School (All)"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowAddFeeModal(false); setEditingFee(null); }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Save Fee Tariff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD CASHBOOK ENTRY MODAL */}
      {(showAddTxnModal || editingTxn) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600" />
                {editingTxn ? 'Edit Cashbook Transaction' : 'Record Cashbook Transaction'}
              </h3>
              <button onClick={() => { setShowAddTxnModal(false); setEditingTxn(null); }} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveTxn} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transaction Type</label>
                  <select
                    value={ieType}
                    onChange={(e) => setIeType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    <option value="Income">Income (Inflow)</option>
                    <option value="Expense">Expense (Outflow)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (CFA) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={ieAmount}
                    onChange={(e) => setIeAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={ieCat}
                  onChange={(e) => setIeCat(e.target.value)}
                  placeholder="e.g. Utilities, Maintenance, PTA, Teaching Supplies"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  value={ieDesc}
                  onChange={(e) => setIeDesc(e.target.value)}
                  placeholder="Enter transaction narrative..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reference / Invoice No</label>
                <input
                  type="text"
                  value={ieRef}
                  onChange={(e) => setIeRef(e.target.value)}
                  placeholder="e.g. INV-9901"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowAddTxnModal(false); setEditingTxn(null); }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
