import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';
import { 
  StaffSalaryStructure, 
  PayrollRun, 
  StaffPayslipItem, 
  StaffLoanAdvance, 
  PayrollSettingsConfig,
  Teacher
} from '../types';
import { 
  INITIAL_PAYROLL_SETTINGS, 
  INITIAL_STAFF_SALARY_STRUCTURES, 
  INITIAL_PAYROLL_RUNS, 
  INITIAL_STAFF_LOANS 
} from '../data/mockPayrollData';
import { sanitizeForFirestore } from './dbService';

const STORAGE_KEY_PAYROLL_RUNS = 'jipas_payroll_runs';
const STORAGE_KEY_SALARY_STRUCTURES = 'jipas_staff_salaries';
const STORAGE_KEY_STAFF_LOANS = 'jipas_staff_loans';
const STORAGE_KEY_PAYROLL_SETTINGS = 'jipas_payroll_settings';

// -------------------------------------------------------------
// Local Storage Cache Helpers
// -------------------------------------------------------------

export function getStoredPayrollSettings(): PayrollSettingsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PAYROLL_SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading payroll settings:', e);
  }
  return INITIAL_PAYROLL_SETTINGS;
}

export function saveStoredPayrollSettings(settings: PayrollSettingsConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_PAYROLL_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn('Error writing payroll settings:', e);
  }
}

export function getStoredSalaryStructures(): StaffSalaryStructure[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SALARY_STRUCTURES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading salary structures:', e);
  }
  return INITIAL_STAFF_SALARY_STRUCTURES;
}

export function saveStoredSalaryStructures(structures: StaffSalaryStructure[]) {
  try {
    localStorage.setItem(STORAGE_KEY_SALARY_STRUCTURES, JSON.stringify(structures));
  } catch (e) {
    console.warn('Error saving salary structures:', e);
  }
}

export function getStoredPayrollRuns(): PayrollRun[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PAYROLL_RUNS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading payroll runs:', e);
  }
  return INITIAL_PAYROLL_RUNS;
}

export function saveStoredPayrollRuns(runs: PayrollRun[]) {
  try {
    localStorage.setItem(STORAGE_KEY_PAYROLL_RUNS, JSON.stringify(runs));
  } catch (e) {
    console.warn('Error saving payroll runs:', e);
  }
}

export function getStoredStaffLoans(): StaffLoanAdvance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STAFF_LOANS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading staff loans:', e);
  }
  return INITIAL_STAFF_LOANS;
}

export function saveStoredStaffLoans(loans: StaffLoanAdvance[]) {
  try {
    localStorage.setItem(STORAGE_KEY_STAFF_LOANS, JSON.stringify(loans));
  } catch (e) {
    console.warn('Error saving staff loans:', e);
  }
}

// -------------------------------------------------------------
// Payroll Calculation Utilities
// -------------------------------------------------------------

/**
 * Standard PAYE Progressive Calculation for West African Educational Institutions
 * Takes gross taxable earnings and applies standard tiered progressive brackets
 */
export function calculatePAYETax(taxableIncome: number): number {
  if (taxableIncome <= 400) return 0;
  
  let tax = 0;
  let remaining = taxableIncome;

  // Band 1: First 400 @ 0%
  remaining -= 400;

  // Band 2: Next 110 (401 - 510) @ 5%
  if (remaining > 0) {
    const band = Math.min(remaining, 110);
    tax += band * 0.05;
    remaining -= band;
  }

  // Band 3: Next 130 (511 - 640) @ 10%
  if (remaining > 0) {
    const band = Math.min(remaining, 130);
    tax += band * 0.10;
    remaining -= band;
  }

  // Band 4: Next 3,000 (641 - 3,640) @ 17.5%
  if (remaining > 0) {
    const band = Math.min(remaining, 3000);
    tax += band * 0.175;
    remaining -= band;
  }

  // Band 5: Next 16,395 (3,641 - 20,035) @ 25%
  if (remaining > 0) {
    const band = Math.min(remaining, 16395);
    tax += band * 0.25;
    remaining -= band;
  }

  // Band 6: Exceeding 20,035 @ 30%
  if (remaining > 0) {
    tax += remaining * 0.30;
  }

  return Math.round(tax * 100) / 100;
}

/**
 * Computes a single staff member's payslip given their salary structure,
 * applicable loan deductions, and system settings.
 */
export function computeStaffPayslip(
  structure: StaffSalaryStructure,
  activeLoan: StaffLoanAdvance | undefined,
  settings: PayrollSettingsConfig,
  payrollRunId: string,
  voucherIndex: number,
  month: string,
  payPeriodStart: string,
  payPeriodEnd: string,
  paymentDate: string
): StaffPayslipItem {
  const allow = structure.allowances;
  const totalAllowances = 
    (allow.responsibility || 0) +
    (allow.transport || 0) +
    (allow.housing || 0) +
    (allow.utilityHardship || 0) +
    (allow.overtime || 0) +
    (allow.bonus || 0) +
    (allow.other || 0);

  const grossEarnings = structure.basicSalary + totalAllowances;
  
  // Statutory SSNIT Employee Contribution (5.5% of Basic Salary)
  const ssnitEmployee = Math.round((structure.basicSalary * (settings.ssnitEmployeeRate / 100)) * 100) / 100;
  
  // Taxable Income = Gross Earnings - SSNIT Employee Contribution
  const taxableIncome = Math.max(0, grossEarnings - ssnitEmployee);
  const payeTax = calculatePAYETax(taxableIncome);

  const welfareFund = settings.defaultWelfareDeduction || 25;
  const loanRepayment = activeLoan && activeLoan.status === 'Active' ? Math.min(activeLoan.monthlyDeduction, activeLoan.remainingBalance) : 0;
  const absenteeismPenalty = 0;

  const totalDeductions = Math.round((ssnitEmployee + payeTax + welfareFund + loanRepayment + absenteeismPenalty) * 100) / 100;
  const netSalary = Math.round((grossEarnings - totalDeductions) * 100) / 100;

  // Employer Contributions
  const ssnitEmployer = Math.round((structure.basicSalary * (settings.ssnitEmployerRate / 100)) * 100) / 100;
  const tier2Fund = Math.round((structure.basicSalary * (settings.tier2EmployeeRate / 100)) * 100) / 100;

  const voucherNo = `PAY-${month.replace(/\s+/g, '-').toUpperCase()}-${String(voucherIndex).padStart(3, '0')}`;

  return {
    id: `ps-${payrollRunId}-${structure.staffId}`,
    payrollRunId,
    voucherNo,
    staffId: structure.staffId,
    staffName: structure.staffName,
    staffType: structure.staffType,
    designation: structure.designation,
    department: structure.department,
    month,
    payPeriodStart,
    payPeriodEnd,
    paymentDate,
    bankName: structure.bankName,
    accountNumber: structure.accountNumber,
    ssnitNumber: structure.ssnitNumber,
    tinNumber: structure.tinNumber,
    paymentMethod: structure.paymentMethod,
    basicSalary: structure.basicSalary,
    allowances: { ...structure.allowances },
    totalAllowances,
    grossEarnings,
    deductions: {
      ssnitEmployee,
      payeTax,
      welfareFund,
      loanRepayment,
      absenteeismPenalty,
      other: 0
    },
    totalDeductions,
    netSalary,
    employerContribution: {
      ssnitEmployer,
      tier2Fund
    },
    status: 'Draft'
  };
}

/**
 * Compiles a new Monthly Payroll Batch from all active staff salary structures
 */
export function generateMonthlyPayrollRun(
  month: string,
  academicYear: string,
  term: string,
  createdBy: string,
  structures: StaffSalaryStructure[],
  loans: StaffLoanAdvance[],
  settings: PayrollSettingsConfig
): PayrollRun {
  const runId = `run-${month.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  const batchNumber = `BATCH-${month.toUpperCase().replace(/\s+/g, '-')}`;
  
  const [mName, yStr] = month.split(' ');
  const yearNum = parseInt(yStr, 10) || new Date().getFullYear();
  const monthMap: Record<string, number> = {
    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
    July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
  };
  const mIndex = monthMap[mName] !== undefined ? monthMap[mName] : new Date().getMonth();
  
  const payPeriodStart = new Date(yearNum, mIndex, 1).toISOString().split('T')[0];
  const lastDay = new Date(yearNum, mIndex + 1, 0).getDate();
  const payPeriodEnd = new Date(yearNum, mIndex, lastDay).toISOString().split('T')[0];
  const payDay = Math.min(settings.defaultPayDay || 25, lastDay);
  const paymentDate = new Date(yearNum, mIndex, payDay).toISOString().split('T')[0];

  const activeStructures = structures.filter(s => s.isActive);
  
  const payslips = activeStructures.map((struct, idx) => {
    const loan = loans.find(l => l.staffId === struct.staffId && l.status === 'Active');
    return computeStaffPayslip(
      struct,
      loan,
      settings,
      runId,
      idx + 1,
      month,
      payPeriodStart,
      payPeriodEnd,
      paymentDate
    );
  });

  const totalBasicSalary = payslips.reduce((acc, p) => acc + p.basicSalary, 0);
  const totalAllowances = payslips.reduce((acc, p) => acc + p.totalAllowances, 0);
  const totalGrossPay = payslips.reduce((acc, p) => acc + p.grossEarnings, 0);
  const totalSSNITEmployee = payslips.reduce((acc, p) => acc + p.deductions.ssnitEmployee, 0);
  const totalSSNITEmployer = payslips.reduce((acc, p) => acc + p.employerContribution.ssnitEmployer, 0);
  const totalPAYETax = payslips.reduce((acc, p) => acc + p.deductions.payeTax, 0);
  const totalWelfare = payslips.reduce((acc, p) => acc + p.deductions.welfareFund, 0);
  const totalLoanDeductions = payslips.reduce((acc, p) => acc + p.deductions.loanRepayment, 0);
  const totalDeductions = payslips.reduce((acc, p) => acc + p.totalDeductions, 0);
  const totalNetPayout = payslips.reduce((acc, p) => acc + p.netSalary, 0);

  return {
    id: runId,
    batchNumber,
    month,
    academicYear,
    term,
    totalStaff: payslips.length,
    totalBasicSalary,
    totalAllowances,
    totalGrossPay,
    totalSSNITEmployee,
    totalSSNITEmployer,
    totalPAYETax,
    totalWelfare,
    totalLoanDeductions,
    totalDeductions,
    totalNetPayout,
    status: 'Draft',
    createdAt: new Date().toISOString().split('T')[0],
    createdBy,
    payslips,
    notes: `${month} full faculty and staff payroll schedule.`
  };
}

// -------------------------------------------------------------
// Firestore Sync & Realtime Subscriptions
// -------------------------------------------------------------

export function subscribePayrollRuns(callback: (runs: PayrollRun[]) => void) {
  try {
    const colRef = collection(db, 'payrollRuns');
    return onSnapshot(colRef, (snap) => {
      if (!snap.empty) {
        const runs = snap.docs.map(d => ({ id: d.id, ...d.data() } as PayrollRun));
        // Sort newest first
        runs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        saveStoredPayrollRuns(runs);
        callback(runs);
      } else {
        callback(getStoredPayrollRuns());
      }
    }, (err) => {
      console.warn('[payrollService] subscribePayrollRuns offline:', err);
      callback(getStoredPayrollRuns());
    });
  } catch (e) {
    callback(getStoredPayrollRuns());
    return () => {};
  }
}

export async function savePayrollRun(run: PayrollRun): Promise<void> {
  const current = getStoredPayrollRuns();
  const updated = [run, ...current.filter(r => r.id !== run.id)];
  saveStoredPayrollRuns(updated);

  try {
    const docRef = doc(db, 'payrollRuns', run.id);
    await setDoc(docRef, sanitizeForFirestore(run));
  } catch (e) {
    if (e instanceof Error && e.message.includes('permission')) {
      handleFirestoreError(e, OperationType.WRITE, 'payrollRuns');
    }
    console.warn('[payrollService] savePayrollRun Firestore notice:', e);
  }
}

export async function deletePayrollRun(runId: string): Promise<void> {
  const current = getStoredPayrollRuns();
  const updated = current.filter(r => r.id !== runId);
  saveStoredPayrollRuns(updated);

  try {
    const docRef = doc(db, 'payrollRuns', runId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('[payrollService] deletePayrollRun Firestore notice:', e);
  }
}

export function subscribeSalaryStructures(callback: (structures: StaffSalaryStructure[]) => void) {
  try {
    const colRef = collection(db, 'staffSalaries');
    return onSnapshot(colRef, (snap) => {
      if (!snap.empty) {
        const structures = snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffSalaryStructure));
        saveStoredSalaryStructures(structures);
        callback(structures);
      } else {
        callback(getStoredSalaryStructures());
      }
    }, (err) => {
      console.warn('[payrollService] subscribeSalaryStructures offline:', err);
      callback(getStoredSalaryStructures());
    });
  } catch (e) {
    callback(getStoredSalaryStructures());
    return () => {};
  }
}

export async function saveSalaryStructure(structure: StaffSalaryStructure): Promise<void> {
  const current = getStoredSalaryStructures();
  const updated = current.some(s => s.id === structure.id)
    ? current.map(s => s.id === structure.id ? structure : s)
    : [...current, structure];
  
  saveStoredSalaryStructures(updated);

  try {
    const docRef = doc(db, 'staffSalaries', structure.id);
    await setDoc(docRef, sanitizeForFirestore(structure));
  } catch (e) {
    console.warn('[payrollService] saveSalaryStructure Firestore notice:', e);
  }
}

export async function deleteSalaryStructure(id: string): Promise<void> {
  const current = getStoredSalaryStructures();
  const updated = current.filter(s => s.id !== id);
  saveStoredSalaryStructures(updated);

  try {
    const docRef = doc(db, 'staffSalaries', id);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('[payrollService] deleteSalaryStructure Firestore notice:', e);
  }
}

export function subscribeStaffLoans(callback: (loans: StaffLoanAdvance[]) => void) {
  try {
    const colRef = collection(db, 'staffLoans');
    return onSnapshot(colRef, (snap) => {
      if (!snap.empty) {
        const loans = snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffLoanAdvance));
        saveStoredStaffLoans(loans);
        callback(loans);
      } else {
        callback(getStoredStaffLoans());
      }
    }, (err) => {
      console.warn('[payrollService] subscribeStaffLoans offline:', err);
      callback(getStoredStaffLoans());
    });
  } catch (e) {
    callback(getStoredStaffLoans());
    return () => {};
  }
}

export async function saveStaffLoan(loan: StaffLoanAdvance): Promise<void> {
  const current = getStoredStaffLoans();
  const updated = current.some(l => l.id === loan.id)
    ? current.map(l => l.id === loan.id ? loan : l)
    : [...current, loan];
  
  saveStoredStaffLoans(updated);

  try {
    const docRef = doc(db, 'staffLoans', loan.id);
    await setDoc(docRef, sanitizeForFirestore(loan));
  } catch (e) {
    console.warn('[payrollService] saveStaffLoan Firestore notice:', e);
  }
}

export async function savePayrollSettings(settings: PayrollSettingsConfig): Promise<void> {
  saveStoredPayrollSettings(settings);

  try {
    const docRef = doc(db, 'systemSettings', 'payrollSettings');
    await setDoc(docRef, sanitizeForFirestore(settings));
  } catch (e) {
    console.warn('[payrollService] savePayrollSettings Firestore notice:', e);
  }
}

/**
 * Auto-syncs any teachers in the system who don't yet have salary structures
 */
export function syncTeachersToSalaryStructures(
  teachers: Teacher[], 
  existingStructures: StaffSalaryStructure[]
): StaffSalaryStructure[] {
  const existingStaffIds = new Set(existingStructures.map(s => s.staffId));
  const newStructures: StaffSalaryStructure[] = [];

  teachers.forEach(t => {
    if (!existingStaffIds.has(t.id)) {
      newStructures.push({
        id: `sal-t-${t.id}`,
        staffId: t.id,
        staffName: t.name,
        staffType: 'Teaching',
        designation: t.designation || 'Teacher',
        department: t.department || 'Academic Faculty',
        bankName: 'GCB Bank PLC',
        accountNumber: '104' + Math.floor(1000000000 + Math.random() * 9000000000),
        accountName: t.name,
        ssnitNumber: 'C10' + Math.floor(100000000 + Math.random() * 900000000),
        tinNumber: 'P00' + Math.floor(1000000 + Math.random() * 9000000) + 'X',
        basicSalary: 2500,
        allowances: {
          responsibility: 200,
          transport: 180,
          housing: 200,
          utilityHardship: 80,
          overtime: 100,
          bonus: 50,
          other: 0
        },
        paymentMethod: 'Bank Transfer',
        isActive: true,
        phone: t.phone,
        email: t.email
      });
    }
  });

  if (newStructures.length > 0) {
    const combined = [...existingStructures, ...newStructures];
    saveStoredSalaryStructures(combined);
    return combined;
  }
  return existingStructures;
}
