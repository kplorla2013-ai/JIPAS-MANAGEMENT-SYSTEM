import { User, UserRole, AppPermission, AppResource, AppModule } from '../types';

/**
 * JIPAS School Management System - Central Role-Based Access Control (RBAC)
 * Authoritative client-side authorization layer complementing Firestore Security Rules.
 */

export interface RoleDefinition {
  name: string;
  description: string;
  permissions: AppPermission[];
  modules: AppModule[];
  allowedCreations: AppResource[];
  allowedUpdates: AppResource[];
  allowedDeletions: AppResource[];
}

// Role Matrix Definitions
export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  super_admin: {
    name: 'Super Administrator',
    description: 'Full unconstrained system root authority across all modules and resources.',
    permissions: [
      'view_students', 'edit_students', 'delete_students',
      'view_teachers', 'edit_teachers',
      'manage_classes', 'enter_grades', 'publish_reports',
      'collect_fees', 'void_payments', 'enter_expenses', 'approve_expenses',
      'run_payroll', 'view_payroll', 'manage_bank_deposits',
      'view_audit_logs', 'manage_users', 'manage_settings'
    ],
    modules: [
      'admin_portal', 'teacher_portal', 'accountant_portal', 'secretary_portal', 'student_portal',
      'payroll_module', 'financial_audit', 'revenue_trends', 'fee_reminders', 'academic_setup', 'settings_module'
    ],
    allowedCreations: ['students', 'teachers', 'classes', 'subjects', 'academic_years', 'terms', 'attendance', 'reports', 'fees', 'payments', 'receipts', 'expenses', 'bank_deposits', 'payroll', 'staff_loans', 'users', 'audit_logs', 'settings', 'calendar'],
    allowedUpdates: ['students', 'teachers', 'classes', 'subjects', 'academic_years', 'terms', 'attendance', 'reports', 'fees', 'payments', 'receipts', 'expenses', 'bank_deposits', 'payroll', 'staff_loans', 'users', 'audit_logs', 'settings', 'calendar'],
    allowedDeletions: ['students', 'teachers', 'classes', 'subjects', 'academic_years', 'terms', 'attendance', 'reports', 'fees', 'payments', 'receipts', 'expenses', 'bank_deposits', 'payroll', 'staff_loans', 'users', 'audit_logs', 'settings', 'calendar']
  },
  admin: {
    name: 'School Administrator',
    description: 'Executive management authority over school operations, academics, and finances.',
    permissions: [
      'view_students', 'edit_students', 'delete_students',
      'view_teachers', 'edit_teachers',
      'manage_classes', 'enter_grades', 'publish_reports',
      'collect_fees', 'void_payments', 'enter_expenses', 'approve_expenses',
      'run_payroll', 'view_payroll', 'manage_bank_deposits',
      'view_audit_logs', 'manage_users', 'manage_settings'
    ],
    modules: [
      'admin_portal', 'teacher_portal', 'accountant_portal', 'secretary_portal', 'student_portal',
      'payroll_module', 'financial_audit', 'revenue_trends', 'fee_reminders', 'academic_setup', 'settings_module'
    ],
    allowedCreations: ['students', 'teachers', 'classes', 'subjects', 'academic_years', 'terms', 'attendance', 'reports', 'fees', 'payments', 'receipts', 'expenses', 'bank_deposits', 'payroll', 'staff_loans', 'users', 'audit_logs', 'settings', 'calendar'],
    allowedUpdates: ['students', 'teachers', 'classes', 'subjects', 'academic_years', 'terms', 'attendance', 'reports', 'fees', 'payments', 'receipts', 'expenses', 'bank_deposits', 'payroll', 'staff_loans', 'users', 'audit_logs', 'settings', 'calendar'],
    allowedDeletions: ['students', 'teachers', 'classes', 'subjects', 'academic_years', 'terms', 'attendance', 'reports', 'fees', 'payments', 'receipts', 'expenses', 'bank_deposits', 'payroll', 'staff_loans', 'users', 'audit_logs', 'settings', 'calendar']
  },
  sub_admin: {
    name: 'Sub-Administrator',
    description: 'Vice principal / Assistant administrative authority with elevated academic rights.',
    permissions: [
      'view_students', 'edit_students',
      'view_teachers', 'edit_teachers',
      'manage_classes', 'enter_grades', 'publish_reports',
      'collect_fees', 'enter_expenses',
      'view_payroll', 'manage_bank_deposits',
      'view_audit_logs', 'manage_users', 'manage_settings'
    ],
    modules: [
      'admin_portal', 'teacher_portal', 'accountant_portal', 'secretary_portal',
      'financial_audit', 'revenue_trends', 'fee_reminders', 'academic_setup'
    ],
    allowedCreations: ['students', 'teachers', 'classes', 'subjects', 'academic_years', 'terms', 'attendance', 'reports', 'fees', 'payments', 'receipts', 'expenses', 'bank_deposits', 'calendar'],
    allowedUpdates: ['students', 'teachers', 'classes', 'subjects', 'academic_years', 'terms', 'attendance', 'reports', 'fees', 'payments', 'receipts', 'expenses', 'bank_deposits', 'calendar'],
    allowedDeletions: ['attendance', 'reports', 'calendar']
  },
  headmaster: {
    name: 'Headmaster / Principal',
    description: 'School principal with overall academic, personnel, and institutional oversight.',
    permissions: [
      'view_students', 'edit_students',
      'view_teachers', 'edit_teachers',
      'manage_classes', 'enter_grades', 'publish_reports',
      'collect_fees', 'enter_expenses', 'approve_expenses',
      'view_payroll', 'manage_bank_deposits',
      'view_audit_logs', 'manage_users', 'manage_settings'
    ],
    modules: [
      'admin_portal', 'teacher_portal', 'accountant_portal', 'secretary_portal',
      'financial_audit', 'revenue_trends', 'fee_reminders', 'academic_setup'
    ],
    allowedCreations: ['students', 'teachers', 'classes', 'subjects', 'academic_years', 'terms', 'attendance', 'reports', 'fees', 'payments', 'receipts', 'expenses', 'bank_deposits', 'calendar'],
    allowedUpdates: ['students', 'teachers', 'classes', 'subjects', 'academic_years', 'terms', 'attendance', 'reports', 'fees', 'payments', 'receipts', 'expenses', 'bank_deposits', 'settings', 'calendar'],
    allowedDeletions: ['attendance', 'reports', 'calendar']
  },
  accountant: {
    name: 'Accountant / Bursar',
    description: 'Primary financial officer in charge of fees, disbursements, bank deposits, and payroll.',
    permissions: [
      'view_students',
      'collect_fees', 'void_payments', 'enter_expenses', 'approve_expenses',
      'run_payroll', 'view_payroll', 'manage_bank_deposits'
    ],
    modules: [
      'accountant_portal', 'payroll_module', 'financial_audit', 'revenue_trends', 'fee_reminders'
    ],
    allowedCreations: ['payments', 'receipts', 'fees', 'expenses', 'bank_deposits', 'payroll', 'staff_loans'],
    allowedUpdates: ['payments', 'receipts', 'fees', 'expenses', 'bank_deposits', 'payroll', 'staff_loans'],
    allowedDeletions: ['expenses', 'bank_deposits']
  },
  sub_accountant: {
    name: 'Sub-Accountant / Assistant Bursar',
    description: 'Assistant bursar managing day-to-day fee collections, receipts, and cash banking.',
    permissions: [
      'view_students',
      'collect_fees', 'enter_expenses',
      'view_payroll', 'manage_bank_deposits'
    ],
    modules: [
      'accountant_portal', 'revenue_trends', 'fee_reminders'
    ],
    allowedCreations: ['payments', 'receipts', 'expenses', 'bank_deposits'],
    allowedUpdates: ['payments', 'receipts', 'expenses', 'bank_deposits'],
    allowedDeletions: []
  },
  secretary: {
    name: 'Front-Desk Secretary',
    description: 'Admissions registrar, front-desk visitor log, and student registration coordinator.',
    permissions: [
      'view_students', 'edit_students',
      'collect_fees'
    ],
    modules: [
      'secretary_portal'
    ],
    allowedCreations: ['students', 'payments', 'receipts'],
    allowedUpdates: ['students'],
    allowedDeletions: []
  },
  hr: {
    name: 'Human Resources Officer',
    description: 'Personnel manager for faculty attendance, contracts, and leave management.',
    permissions: [
      'view_teachers', 'edit_teachers',
      'view_payroll'
    ],
    modules: [
      'admin_portal'
    ],
    allowedCreations: ['teachers', 'attendance'],
    allowedUpdates: ['teachers', 'attendance'],
    allowedDeletions: []
  },
  teacher: {
    name: 'Class / Subject Teacher',
    description: 'Academic educator managing class attendance, continuous assessments, and grades.',
    permissions: [
      'view_students',
      'enter_grades', 'publish_reports'
    ],
    modules: [
      'teacher_portal'
    ],
    allowedCreations: ['reports', 'attendance'],
    allowedUpdates: ['reports', 'attendance'],
    allowedDeletions: []
  },
  student: {
    name: 'Student / Scholar',
    description: 'Student portal for personal terminal reports, academic history, and bills.',
    permissions: [],
    modules: [
      'student_portal'
    ],
    allowedCreations: ['payments'], // online fee submission draft
    allowedUpdates: [],
    allowedDeletions: []
  },
  parent: {
    name: 'Parent / Legal Guardian',
    description: 'Parent portal for monitoring ward performance, tuition payments, and school events.',
    permissions: [],
    modules: [
      'student_portal'
    ],
    allowedCreations: ['payments'], // fee submission slip
    allowedUpdates: [],
    allowedDeletions: []
  },
  clerk: {
    name: 'Administrative Clerk',
    description: 'Data entry and clerical records assistant.',
    permissions: [
      'view_students',
      'collect_fees'
    ],
    modules: [
      'secretary_portal'
    ],
    allowedCreations: ['students', 'payments'],
    allowedUpdates: ['students'],
    allowedDeletions: []
  }
};

/**
 * Checks if a user possesses one or more specified roles.
 */
export function hasRole(user: User | null | undefined, role: UserRole | UserRole[]): boolean {
  if (!user || !user.role) return false;
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  return user.role === role;
}

/**
 * Checks if a user has a specific granular system permission.
 */
export function hasPermission(user: User | null | undefined, permission: AppPermission): boolean {
  if (!user || !user.role) return false;
  if (user.role === 'admin' || user.role === 'super_admin') return true;
  
  const roleDef = ROLE_DEFINITIONS[user.role];
  if (!roleDef) return false;

  // Check specific accountant privileges overrides if defined on the user
  if (user.accountantPrivileges) {
    if (permission === 'void_payments' && user.accountantPrivileges.canVoidPayments !== undefined) {
      return !!user.accountantPrivileges.canVoidPayments;
    }
    if (permission === 'approve_expenses' && user.accountantPrivileges.canApproveExpenses !== undefined) {
      return !!user.accountantPrivileges.canApproveExpenses;
    }
    if (permission === 'run_payroll' && user.accountantPrivileges.canRunPayroll !== undefined) {
      return !!user.accountantPrivileges.canRunPayroll;
    }
  }

  return roleDef.permissions.includes(permission);
}

/**
 * Checks if a user is authorized to access a given UI module.
 */
export function canAccessModule(user: User | null | undefined, module: AppModule): boolean {
  if (!user || !user.role) return false;
  if (user.role === 'admin' || user.role === 'super_admin') return true;

  // Custom allowed modules override if present on user record
  if (user.allowedModules && user.allowedModules.length > 0) {
    if (user.allowedModules.includes(module)) return true;
  }

  const roleDef = ROLE_DEFINITIONS[user.role];
  if (!roleDef) return false;

  return roleDef.modules.includes(module);
}

/**
 * Checks if a user is authorized to CREATE a resource.
 */
export function canCreate(user: User | null | undefined, resource: AppResource): boolean {
  if (!user || !user.role) return false;
  if (user.role === 'admin' || user.role === 'super_admin') return true;

  const roleDef = ROLE_DEFINITIONS[user.role];
  if (!roleDef) return false;

  return roleDef.allowedCreations.includes(resource);
}

/**
 * Checks if a user is authorized to UPDATE a resource.
 */
export function canUpdate(user: User | null | undefined, resource: AppResource): boolean {
  if (!user || !user.role) return false;
  if (user.role === 'admin' || user.role === 'super_admin') return true;

  const roleDef = ROLE_DEFINITIONS[user.role];
  if (!roleDef) return false;

  return roleDef.allowedUpdates.includes(resource);
}

/**
 * Checks if a user is authorized to DELETE a resource.
 */
export function canDelete(user: User | null | undefined, resource: AppResource): boolean {
  if (!user || !user.role) return false;
  if (user.role === 'admin' || user.role === 'super_admin') return true;

  const roleDef = ROLE_DEFINITIONS[user.role];
  if (!roleDef) return false;

  return roleDef.allowedDeletions.includes(resource);
}

/**
 * Returns human-readable role badge styling and label.
 */
export function getRoleBadgeInfo(role: UserRole): { label: string; colorClass: string } {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return { label: 'Administrator', colorClass: 'bg-red-500/20 text-red-300 border-red-500/30' };
    case 'sub_admin':
      return { label: 'Sub-Admin', colorClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
    case 'headmaster':
      return { label: 'Headmaster', colorClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    case 'accountant':
      return { label: 'Accountant', colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    case 'sub_accountant':
      return { label: 'Sub-Accountant', colorClass: 'bg-teal-500/20 text-teal-300 border-teal-500/30' };
    case 'teacher':
      return { label: 'Teacher', colorClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    case 'secretary':
      return { label: 'Secretary', colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    case 'hr':
      return { label: 'HR Officer', colorClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
    case 'student':
      return { label: 'Student', colorClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
    case 'parent':
      return { label: 'Parent', colorClass: 'bg-pink-500/20 text-pink-300 border-pink-500/30' };
    case 'clerk':
    default:
      return { label: 'Clerk / Staff', colorClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
  }
}
