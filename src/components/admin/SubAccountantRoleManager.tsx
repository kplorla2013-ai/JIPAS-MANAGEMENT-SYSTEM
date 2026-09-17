import React, { useState, useMemo, FormEvent } from 'react';
import { 
  UserAccountItem, 
  AccountantPrivilegesConfig 
} from '../../types';
import { 
  getStoredUsers, 
  saveStoredUsers 
} from '../../services/storageService';
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Save, 
  Plus, 
  UserPlus, 
  UserCog, 
  Calculator, 
  DollarSign, 
  Receipt, 
  Lock, 
  Check, 
  X, 
  Edit3, 
  Trash2,
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';

interface SubAccountantRoleManagerProps {
  onUsersUpdated?: (users: UserAccountItem[]) => void;
}

const DEFAULT_FULL_ACCOUNTANT_PRIVILEGES: AccountantPrivilegesConfig = {
  canCollectFees: true,
  canEnterExpenses: true,
  canApproveExpenses: true,
  canManageFeeSettings: true,
  canRunPayroll: true,
  canViewFinancialReports: true,
  canPerformAudit: true,
  canVoidPayments: true,
  canExportData: true,
  canManageSecretaryRecords: true
};

const DEFAULT_SUB_ACCOUNTANT_PRIVILEGES: AccountantPrivilegesConfig = {
  canCollectFees: true,
  canEnterExpenses: true,
  canApproveExpenses: false,
  canManageFeeSettings: false,
  canRunPayroll: false,
  canViewFinancialReports: true,
  canPerformAudit: false,
  canVoidPayments: false,
  canExportData: true,
  canManageSecretaryRecords: true
};

export default function SubAccountantRoleManager({
  onUsersUpdated
}: SubAccountantRoleManagerProps) {
  const [users, setUsers] = useState<UserAccountItem[]>(() => getStoredUsers());
  const [selectedUser, setSelectedUser] = useState<UserAccountItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Account State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'accountant' | 'sub_accountant' | 'secretary'>('sub_accountant');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter finance and front desk accounts (accountant, sub_accountant, secretary)
  const financeUsers = useMemo(() => {
    return users.filter(u => 
      u.role === 'accountant' || 
      u.role === 'sub_accountant' || 
      u.role === 'secretary'
    );
  }, [users]);

  // Handle toggling full role between 'accountant' and 'sub_accountant'
  const handleToggleRole = (userId: string, targetRole: 'accountant' | 'sub_accountant' | 'secretary') => {
    const updated = users.map(u => {
      if (u.id === userId) {
        const privileges = targetRole === 'accountant' 
          ? { ...DEFAULT_FULL_ACCOUNTANT_PRIVILEGES }
          : targetRole === 'sub_accountant'
          ? { ...DEFAULT_SUB_ACCOUNTANT_PRIVILEGES }
          : undefined;

        return {
          ...u,
          role: targetRole,
          accountantPrivileges: privileges
        };
      }
      return u;
    });

    setUsers(updated);
    saveStoredUsers(updated);
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser(updated.find(u => u.id === userId) || null);
    }
    if (onUsersUpdated) onUsersUpdated(updated);
    showToast(`Role updated to ${targetRole.replace('_', ' ').toUpperCase()}`);
  };

  // Handle toggling specific privilege for a sub-accountant
  const handleTogglePrivilege = (userId: string, privilegeKey: keyof AccountantPrivilegesConfig) => {
    const updated = users.map(u => {
      if (u.id === userId) {
        const currentPrivileges = u.accountantPrivileges || (u.role === 'accountant' ? { ...DEFAULT_FULL_ACCOUNTANT_PRIVILEGES } : { ...DEFAULT_SUB_ACCOUNTANT_PRIVILEGES });
        const newPrivileges: AccountantPrivilegesConfig = {
          ...currentPrivileges,
          [privilegeKey]: !currentPrivileges[privilegeKey]
        };
        return {
          ...u,
          accountantPrivileges: newPrivileges
        };
      }
      return u;
    });

    setUsers(updated);
    saveStoredUsers(updated);
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser(updated.find(u => u.id === userId) || null);
    }
    if (onUsersUpdated) onUsersUpdated(updated);
    showToast('Privilege permission saved.');
  };

  // Handle Creating a New Accountant / Sub-Accountant Account
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newUsername.trim() || !newPassword.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    const newAccount: UserAccountItem = {
      id: `usr-fin-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      username: newUsername.trim().toLowerCase(),
      phone: newPhone.trim() || '0240000000',
      role: newRole,
      status: 'Active',
      isApproved: true,
      department: 'Accounts & Finance',
      staffId: `STF-FIN-${Date.now().toString().slice(-4)}`,
      password: newPassword,
      lastLogin: 'Never',
      createdAt: new Date().toISOString().split('T')[0],
      isEmailVerified: true,
      accountantPrivileges: newRole === 'accountant'
        ? { ...DEFAULT_FULL_ACCOUNTANT_PRIVILEGES }
        : newRole === 'sub_accountant'
        ? { ...DEFAULT_SUB_ACCOUNTANT_PRIVILEGES }
        : undefined
    };

    const updated = [newAccount, ...users];
    setUsers(updated);
    saveStoredUsers(updated);
    if (onUsersUpdated) onUsersUpdated(updated);

    // Reset Form
    setNewName('');
    setNewEmail('');
    setNewUsername('');
    setNewPhone('');
    setNewPassword('');
    setShowAddModal(false);
    showToast(`New ${newRole.replace('_', ' ').toUpperCase()} account created successfully.`);
  };

  const PRIVILEGE_DEFINITIONS: { key: keyof AccountantPrivilegesConfig; label: string; description: string }[] = [
    { key: 'canCollectFees', label: 'Collect Student Fees', description: 'Record student tuition & bills and issue official receipts' },
    { key: 'canEnterExpenses', label: 'Enter Institutional Expenses', description: 'Log operational costs, supplier bills, and petty cash outlays' },
    { key: 'canApproveExpenses', label: 'Approve & Reconcile Expenses', description: 'Certify and approve pending expense disbursement vouchers' },
    { key: 'canManageFeeSettings', label: 'Configure Tariffs & Bill Items', description: 'Create class fee schedules, tariffs, and batch bill students' },
    { key: 'canRunPayroll', label: 'Execute Staff Payroll & Remuneration', description: 'Process monthly salaries, allowances, SSNIT, and payslips' },
    { key: 'canViewFinancialReports', label: 'View Income & Balance Statements', description: 'Access cash flow summaries, fee arrears statistics, and reports' },
    { key: 'canPerformAudit', label: 'Perform Financial Auditing', description: 'Run discrepancy checks and generate official audit certifications' },
    { key: 'canVoidPayments', label: 'Void Incorrect Receipts', description: 'Cancel fraudulent or erroneous payments with audit logging' },
    { key: 'canExportData', label: 'Export Financial Data (CSV / Excel)', description: 'Download institutional financial ledgers and spreadsheets' },
    { key: 'canManageSecretaryRecords', label: 'Manage Secretary Desk Handover', description: 'Review, certify, and reconcile front-desk cash handover' }
  ];

  return (
    <div className="space-y-6 text-slate-900">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserCog className="w-5 h-5" />
            </div>
            <span className="text-xs font-black tracking-wider uppercase text-indigo-600">
              Role-Based Access Control (RBAC)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Accountant & Sub-Accountant Roles & Privileges
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Grant or restrict granular financial permissions for junior accountants, bursars, and front desk secretaries. Easily toggle fee collection, expense entry, and payroll rights.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          id="btn-add-finance-staff"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Finance Staff</span>
        </button>
      </div>

      {/* Main Grid: Staff List on Left, Granular Privileges Matrix on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Finance Staff List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-700">
                Finance & Accounts Personnel ({financeUsers.length})
              </h3>
              <span className="text-[10px] text-slate-400 font-bold">Select user to manage</span>
            </div>

            <div className="space-y-2.5">
              {financeUsers.map(user => {
                const isSelected = selectedUser?.id === user.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected 
                        ? 'bg-indigo-50/80 border-indigo-300 shadow-xs ring-1 ring-indigo-400' 
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center ${
                          user.role === 'accountant' 
                            ? 'bg-emerald-600 text-white' 
                            : user.role === 'sub_accountant'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{user.name}</div>
                          <div className="text-[10px] text-slate-500">{user.email}</div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        user.role === 'accountant'
                          ? 'bg-emerald-100 text-emerald-800'
                          : user.role === 'sub_accountant'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Role Switcher Pills */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] text-slate-400 font-semibold mr-1">Role:</span>
                      <button
                        onClick={() => handleToggleRole(user.id, 'accountant')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          user.role === 'accountant' 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Accountant
                      </button>
                      <button
                        onClick={() => handleToggleRole(user.id, 'sub_accountant')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          user.role === 'sub_accountant' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Sub-Accountant
                      </button>
                      <button
                        onClick={() => handleToggleRole(user.id, 'secretary')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          user.role === 'secretary' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Secretary
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Privilege Toggle Matrix for Selected User */}
        <div className="lg:col-span-7 space-y-4">
          {selectedUser ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">{selectedUser.name}</h3>
                    <p className="text-[11px] text-slate-500">
                      Managing privileges for <strong className="uppercase text-indigo-700">{selectedUser.role.replace('_', ' ')}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const fullPriv = { ...DEFAULT_FULL_ACCOUNTANT_PRIVILEGES };
                      const updated = users.map(u => u.id === selectedUser.id ? { ...u, accountantPrivileges: fullPriv } : u);
                      setUsers(updated);
                      saveStoredUsers(updated);
                      setSelectedUser({ ...selectedUser, accountantPrivileges: fullPriv });
                      showToast('All privileges granted.');
                    }}
                    className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100 cursor-pointer"
                  >
                    Grant All
                  </button>
                  <button
                    onClick={() => {
                      const subPriv = { ...DEFAULT_SUB_ACCOUNTANT_PRIVILEGES };
                      const updated = users.map(u => u.id === selectedUser.id ? { ...u, accountantPrivileges: subPriv } : u);
                      setUsers(updated);
                      saveStoredUsers(updated);
                      setSelectedUser({ ...selectedUser, accountantPrivileges: subPriv });
                      showToast('Reset to default sub-accountant permissions.');
                    }}
                    className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    Default Sub-Accountant
                  </button>
                </div>
              </div>

              {/* Privileges Matrix */}
              <div className="divide-y divide-slate-100">
                {PRIVILEGE_DEFINITIONS.map(p => {
                  const currentPrivs = selectedUser.accountantPrivileges || 
                    (selectedUser.role === 'accountant' ? DEFAULT_FULL_ACCOUNTANT_PRIVILEGES : DEFAULT_SUB_ACCOUNTANT_PRIVILEGES);
                  const isEnabled = !!currentPrivs[p.key];

                  return (
                    <div key={p.key} className="py-3 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-800">{p.label}</div>
                        <div className="text-[11px] text-slate-500">{p.description}</div>
                      </div>

                      <button
                        onClick={() => handleTogglePrivilege(selectedUser.id, p.key)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                          isEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'
                        }`}
                      >
                        <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 border border-slate-200/80 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-800">Select an Account to Manage</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Click on any Accountant, Sub-Accountant, or Secretary from the list to toggle specific functional privileges.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Create New Finance Staff                               */}
      {/* ------------------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-scale-in text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-base">Add Finance / Accounts Staff</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Abena Mensah"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. abena@jipas.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. amensah"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role / Position *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white"
                  >
                    <option value="sub_accountant">Sub-Accountant</option>
                    <option value="accountant">Full Accountant / Bursar</option>
                    <option value="secretary">Front Desk Secretary</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. 0244123456"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create secure access password..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
