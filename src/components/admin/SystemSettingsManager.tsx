import React, { useState, useEffect } from 'react';
import { 
  Building, Users, ShieldCheck, KeyRound, Plus, Pencil, Trash2, 
  Save, CheckCircle2, Lock, Unlock, RefreshCw, Eye, EyeOff, Search,
  Sliders, UserPlus, Phone, Mail, Award, AlertTriangle, Upload, Image as ImageIcon,
  RotateCcw, Sparkles, Check, X, UserCheck, UserX, Clock, ShieldAlert, GraduationCap, Briefcase,
  Copy, Key, School, Settings, DollarSign, Bell, Shield
} from 'lucide-react';
import { SystemSettingsConfig, UserAccountItem } from '../../types';
import JIPASLogo, { getSchoolLogo, setSchoolLogo, resetSchoolLogo } from '../common/JIPASLogo';
import { 
  subscribeUsers, 
  saveUserAccount, 
  approveUserAccount, 
  rejectUserAccount, 
  deleteUserAccount,
  getStoredUsers,
  subscribeSettings,
  saveSettings,
  getStaffSecretCode,
  saveStaffSecretCode,
  DEFAULT_STAFF_SECRET_CODE
} from '../../services/dbService';

interface SystemSettingsManagerProps {
  activeModule: string;
  onNavigate?: (module: string) => void;
}

export const INITIAL_SYSTEM_SETTINGS: SystemSettingsConfig = {
  schoolName: 'JIPAS',
  schoolMotto: 'Excellence in Knowledge and Character',
  address: 'P.O. Box GP 4412, Accra, Greater Accra Region, Ghana',
  email: 'info@jipas.edu.gh',
  phone: '+233 24 975 5593',
  altPhone: '+233 59 240 9087',
  activeAcademicYear: '2025-2026',
  activeTerm: 'Third Term',
  nextTermBegins: '2026-09-15',
  smsSenderId: 'JIPAS',
  currencySymbol: 'CFA',
  enableStudentPortal: true,
  enableFeeReceiptPrinting: true,
  allowReportDownload: true,
  autoPromotePassingScore: 50
};

export const INITIAL_USER_ACCOUNTS: UserAccountItem[] = [];

export default function SystemSettingsManager({ activeModule, onNavigate }: SystemSettingsManagerProps) {
  const [settings, setSettings] = useState<SystemSettingsConfig>(INITIAL_SYSTEM_SETTINGS);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Users & Roles state
  const [users, setUsers] = useState<UserAccountItem[]>(() => getStoredUsers());
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'Active' | 'Pending' | 'Inactive'>('all');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccountItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserAccountItem | null>(null);
  const [actionFeedbackToast, setActionFeedbackToast] = useState('');

  // New/Edit User Form State
  const [userFormName, setUserFormName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormUsername, setUserFormUsername] = useState('');
  const [userFormRole, setUserFormRole] = useState<'admin' | 'sub_admin' | 'teacher' | 'accountant' | 'clerk' | 'student'>('teacher');
  const [userFormPhone, setUserFormPhone] = useState('');
  const [userFormDepartment, setUserFormDepartment] = useState('Primary School');
  const [userFormClass, setUserFormClass] = useState('Basic 1');
  const [userFormPassword, setUserFormPassword] = useState('Password123');
  const [userFormPrivilege, setUserFormPrivilege] = useState<'read' | 'read_write'>('read_write');
  const [userFormAllowedModules, setUserFormAllowedModules] = useState<string[]>([
    'dashboard', 'setup_management', 'system_settings', 'teachers', 'students', 'exams', 'fees', 'notif_send', 'logs_user'
  ]);

  // RBAC Roles & Permissions Management State
  const [userMgmtTab, setUserMgmtTab] = useState<'users' | 'roles'>('users');
  const [rbacRoles, setRbacRoles] = useState([
    {
      id: 'role-sub-admin-academic',
      name: 'Sub-Admin (Academic Supervisor)',
      description: 'Manages classes, subjects, teacher assignments, and exam grading.',
      modules: {
        setup_management: 'read_write',
        system_settings: 'read',
        teachers: 'read_write',
        students: 'read_write',
        exams: 'read_write',
        fees: 'read',
        notif_send: 'read_write',
        logs_user: 'read'
      }
    },
    {
      id: 'role-sub-admin-finance',
      name: 'Sub-Admin (Financial Bursar)',
      description: 'Manages student fee billing, fee collection, payments, and financial statements.',
      modules: {
        setup_management: 'read',
        system_settings: 'read',
        teachers: 'read',
        students: 'read',
        exams: 'read',
        fees: 'read_write',
        notif_send: 'read_write',
        logs_user: 'read'
      }
    },
    {
      id: 'role-teacher-lead',
      name: 'Senior Teacher / Faculty Lead',
      description: 'Enters exam scores, views student transcripts, and takes attendance.',
      modules: {
        setup_management: 'none',
        system_settings: 'none',
        teachers: 'read',
        students: 'read',
        exams: 'read_write',
        fees: 'none',
        notif_send: 'read',
        logs_user: 'none'
      }
    }
  ]);
  const [selectedRbacRoleIdx, setSelectedRbacRoleIdx] = useState(0);
  const [rbacSuccessToast, setRbacSuccessToast] = useState(false);

  // Student Portal Control state
  const [portalControls, setPortalControls] = useState({
    portalOnline: true,
    viewTerminalReports: true,
    downloadReportPdf: true,
    viewFeeStatements: true,
    allowOnlineFeePayments: true,
    requireFirstLoginPasswordChange: false,
    lockArrearsAbove: 500,
    lockStudentsInArrears: false,
    showAttendanceSummary: true,
    showTimetable: true
  });
  const [portalToast, setPortalToast] = useState(false);

  // Manage Portal Logins state
  const [portalLoginSearch, setPortalLoginSearch] = useState('');
  const [portalLogins, setPortalLogins] = useState([
    { id: 'pl-1', name: 'DENYO SAMUEL YAW', admissionNo: 'ADM/26/0001', className: 'Basic 1', role: 'Student', username: 'ADM/26/0001', passPin: '26001', status: 'Active', lastAccess: '03/09/2026 09:15' },
    { id: 'pl-2', name: 'ADDO BERNICE', admissionNo: 'ADM/26/0002', className: 'Basic 1', role: 'Student', username: 'ADM/26/0002', passPin: '26002', status: 'Active', lastAccess: '03/08/2026 16:20' },
    { id: 'pl-3', name: 'HADZI JANE', admissionNo: 'ADM/26/0003', className: 'Basic 2', role: 'Student', username: 'ADM/26/0003', passPin: '26003', status: 'Active', lastAccess: '03/05/2026 11:05' },
    { id: 'pl-4', name: 'AGBENYO SAM', admissionNo: 'ADM/26/0004', className: 'Basic 2', role: 'Student', username: 'ADM/26/0004', passPin: '26004', status: 'Locked', lastAccess: '02/28/2026 10:00' },
    { id: 'pl-5', name: 'KWESI SEMEY', admissionNo: 'ADM/26/0005', className: 'Creche', role: 'Student', username: 'ADM/26/0005', passPin: '26005', status: 'Active', lastAccess: 'Never' }
  ]);
  const [resetPinModal, setResetPinModal] = useState<{ id: string; name: string; username: string } | null>(null);
  const [newGeneratedPin, setNewGeneratedPin] = useState('');

  // Logo customization state
  const [currentSchoolLogo, setCurrentSchoolLogo] = useState<string>(getSchoolLogo());
  const [logoInputUrl, setLogoInputUrl] = useState('');
  const [logoSuccessToast, setLogoSuccessToast] = useState(false);

  // Dedicated Account Requests state
  const [accountReqSearch, setAccountReqSearch] = useState('');
  const [accountReqFilter, setAccountReqFilter] = useState<'all' | 'faculty' | 'student'>('all');

  // Staff Authorization Secret Code state
  const [staffSecretCode, setStaffSecretCode] = useState<string>(() => getStaffSecretCode());
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [codeSuccessToast, setCodeSuccessToast] = useState(false);

  // Live real-time database subscriptions
  useEffect(() => {
    setCurrentSchoolLogo(getSchoolLogo());

    const unsubUsers = subscribeUsers((loadedUsers) => {
      if (loadedUsers && loadedUsers.length > 0) {
        setUsers(loadedUsers);
      } else {
        setUsers(getStoredUsers());
      }
    });

    const unsubSettings = subscribeSettings((loadedSettings) => {
      if (loadedSettings) {
        setSettings(prev => ({
          ...prev,
          schoolName: loadedSettings.schoolName || prev.schoolName,
          schoolMotto: loadedSettings.schoolMotto || prev.schoolMotto,
          phone: loadedSettings.phone || prev.phone,
          email: loadedSettings.email || prev.email,
          address: loadedSettings.address || prev.address,
          activeAcademicYear: loadedSettings.activeAcademicYear || prev.activeAcademicYear,
          activeTerm: loadedSettings.activeTerm || prev.activeTerm
        }));
      }
    });

    return () => {
      unsubUsers();
      unsubSettings();
    };
  }, []);

  const triggerToast = (msg: string) => {
    setActionFeedbackToast(msg);
    setTimeout(() => setActionFeedbackToast(''), 4500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSchoolLogo(dataUrl);
        setCurrentSchoolLogo(dataUrl);
        setLogoSuccessToast(true);
        setTimeout(() => setLogoSuccessToast(false), 4000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyLogoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoInputUrl.trim()) return;
    setSchoolLogo(logoInputUrl.trim());
    setCurrentSchoolLogo(logoInputUrl.trim());
    setLogoInputUrl('');
    setLogoSuccessToast(true);
    setTimeout(() => setLogoSuccessToast(false), 4000);
  };

  const handleResetToDefaultLogo = () => {
    resetSchoolLogo();
    setCurrentSchoolLogo('/logo.png');
    setLogoSuccessToast(true);
    setTimeout(() => setLogoSuccessToast(false), 4000);
  };

  // Handle Save General System Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSettings({
        schoolName: settings.schoolName,
        schoolMotto: settings.schoolMotto,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        activeAcademicYear: settings.activeAcademicYear,
        activeTerm: settings.activeTerm,
        staffSecretCode: staffSecretCode.trim()
      });
      await saveStaffSecretCode(staffSecretCode.trim());
    } catch (err) {
      console.warn('saveSettings fallback:', err);
    }
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3500);
  };

  const handleCopySecretCode = () => {
    navigator.clipboard.writeText(staffSecretCode);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2500);
  };

  const handleGenerateNewSecretCode = async () => {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCode = `JIPAS-STAFF-${randomSuffix}`;
    setStaffSecretCode(newCode);
    await saveStaffSecretCode(newCode);
    setCodeSuccessToast(true);
    setTimeout(() => setCodeSuccessToast(false), 3000);
  };

  const handleSaveOnlySecretCode = async () => {
    if (!staffSecretCode.trim()) return;
    await saveStaffSecretCode(staffSecretCode.trim());
    setCodeSuccessToast(true);
    setTimeout(() => setCodeSuccessToast(false), 3000);
  };

  // Approve a pending user account
  const handleApproveAccount = async (user: UserAccountItem) => {
    try {
      await approveUserAccount(user.id, 'Administrator');
      triggerToast(`Account for "${user.name}" has been approved and activated!`);
    } catch (err) {
      console.error('Approve account error:', err);
      triggerToast(`Error approving account. Please try again.`);
    }
  };

  // Reject a pending user account
  const handleRejectAccount = async (user: UserAccountItem) => {
    if (confirm(`Reject pending registration for ${user.name} (${user.email || user.username})?`)) {
      try {
        await rejectUserAccount(user.id);
        triggerToast(`Registration for "${user.name}" has been rejected.`);
      } catch (err) {
        console.error('Reject account error:', err);
      }
    }
  };

  // Open Edit User Modal
  const handleOpenEditUser = (user: UserAccountItem) => {
    setEditingUser(user);
    setUserFormName(user.name);
    setUserFormEmail(user.email);
    setUserFormUsername(user.username);
    setUserFormRole(user.role);
    setUserFormPhone(user.phone || '');
    setUserFormDepartment(user.department || 'Primary School');
    setUserFormClass(user.className || 'Basic 1');
    setUserFormPassword('');
    setUserFormPrivilege(user.privilege || 'read_write');
    setUserFormAllowedModules(user.allowedModules || [
      'dashboard', 'setup_management', 'system_settings', 'teachers', 'students', 'exams', 'fees', 'notif_send', 'logs_user'
    ]);
  };

  // Save Add or Edit User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormName.trim() || !userFormUsername.trim()) return;

    if (editingUser) {
      const updatedUser: UserAccountItem = {
        ...editingUser,
        name: userFormName,
        email: userFormEmail,
        username: userFormUsername,
        role: userFormRole,
        phone: userFormPhone,
        department: userFormDepartment,
        className: userFormClass,
        privilege: userFormPrivilege,
        allowedModules: userFormAllowedModules
      };
      await saveUserAccount(updatedUser);
      setEditingUser(null);
      triggerToast(`User "${userFormName}" updated successfully.`);
    } else {
      const newUser: UserAccountItem = {
        id: `usr-${Date.now()}`,
        name: userFormName,
        email: userFormEmail || `${userFormUsername}@jipas.edu.gh`,
        username: userFormUsername,
        role: userFormRole,
        phone: userFormPhone,
        status: 'Active',
        isApproved: true,
        lastLogin: 'Never',
        createdAt: new Date().toISOString().split('T')[0],
        registrationType: userFormRole === 'student' ? 'student' : (userFormRole === 'admin' ? 'admin' : 'faculty'),
        department: userFormDepartment,
        className: userFormClass,
        privilege: userFormPrivilege,
        allowedModules: userFormAllowedModules
      };
      await saveUserAccount(newUser);
      setShowAddUserModal(false);
      triggerToast(`New user account "${userFormName}" created and activated.`);
    }
  };

  // Delete User
  const handleConfirmDeleteUser = async () => {
    if (deletingUser) {
      await deleteUserAccount(deletingUser.id);
      setDeletingUser(null);
      triggerToast(`User "${deletingUser.name}" deleted.`);
    }
  };

  // Toggle User Status
  const handleToggleUserStatus = async (user: UserAccountItem) => {
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    const updated: UserAccountItem = {
      ...user,
      status: nextStatus
    };
    await saveUserAccount(updated);
    triggerToast(`Status for "${user.name}" changed to ${nextStatus}.`);
  };

  // Toggle Portal Login Lock
  const handleTogglePortalLock = (id: string) => {
    setPortalLogins(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, status: p.status === 'Active' ? 'Locked' : 'Active' };
      }
      return p;
    }));
  };

  // Reset PIN
  const handlePerformResetPin = (id: string) => {
    const randomPin = Math.floor(10000 + Math.random() * 90000).toString();
    setPortalLogins(prev => prev.map(p => p.id === id ? { ...p, passPin: randomPin } : p));
    setNewGeneratedPin(randomPin);
  };

  // Pending user accounts count
  const pendingUsers = users.filter(u => u.status === 'Pending' || u.isApproved === false);
  const activeUsersCount = users.filter(u => u.status === 'Active' && u.isApproved !== false).length;
  const inactiveUsersCount = users.filter(u => u.status === 'Inactive' || u.status === 'Locked').length;

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.phone && u.phone.includes(userSearch)) ||
                          (u.admissionNo && u.admissionNo.toLowerCase().includes(userSearch.toLowerCase()));
    
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    
    let matchesStatus = true;
    if (userStatusFilter === 'Pending') {
      matchesStatus = u.status === 'Pending' || u.isApproved === false;
    } else if (userStatusFilter === 'Active') {
      matchesStatus = u.status === 'Active' && u.isApproved !== false;
    } else if (userStatusFilter === 'Inactive') {
      matchesStatus = u.status === 'Inactive' || u.status === 'Locked';
    }

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filtered portal logins
  const filteredPortalLogins = portalLogins.filter(p => 
    p.name.toLowerCase().includes(portalLoginSearch.toLowerCase()) ||
    p.admissionNo.toLowerCase().includes(portalLoginSearch.toLowerCase()) ||
    p.className.toLowerCase().includes(portalLoginSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. SYSTEM SETTINGS MODULE */}
      {(activeModule === 'system_settings' || activeModule === 'settings') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                System Configuration & Institution Profile
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage institution metadata, academic year parameters, SMS sender identification, and portal rules.
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" /> Save System Settings
            </button>
          </div>

          {settingsSavedToast && (
            <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Institutional system parameters updated successfully! Changes applied in real time.
              </span>
              <button onClick={() => setSettingsSavedToast(false)} className="text-white font-black ml-4">✕</button>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
            {/* Institution Profile */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-indigo-700">
                <Building className="w-4 h-4" /> Institution Identity & Branding
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">School / Institution Name *</label>
                  <input
                    type="text"
                    required
                    value={settings.schoolName}
                    onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">School Motto / Tagline</label>
                  <input
                    type="text"
                    value={settings.schoolMotto}
                    onChange={(e) => setSettings({ ...settings, schoolMotto: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Official Postal & Physical Address</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Official Email Address</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Primary Phone</label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Alternate Phone</label>
                    <input
                      type="text"
                      value={settings.altPhone}
                      onChange={(e) => setSettings({ ...settings, altPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* School Logo & Crest Customizer */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      Official School Crest & Brand Logo
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Upload or change the school logo displayed on headers, portal banners, receipts, report cards, and student ID badges.
                    </p>
                  </div>
                  {currentSchoolLogo !== '/logo.png' && (
                    <button
                      type="button"
                      onClick={handleResetToDefaultLogo}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset to Original Logo
                    </button>
                  )}
                </div>

                {logoSuccessToast && (
                  <div className="mb-3 bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    School logo updated successfully! New logo is now live throughout the entire application.
                  </div>
                )}

                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Live Preview */}
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center shrink-0">
                      <JIPASLogo size="xl" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Live Visual Preview</div>
                      <h5 className="font-black text-sm text-slate-900">{settings.schoolName || 'JIPAS'}</h5>
                      <p className="text-xs text-slate-500">{settings.schoolMotto || 'Education is Wealth • Est. 1990'}</p>
                      <span className="inline-block mt-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Applied App-Wide Real-Time
                      </span>
                    </div>
                  </div>

                  {/* Upload Controls */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <label className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-sm transition-all text-center">
                      <Upload className="w-4 h-4" /> Upload New Logo Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={logoInputUrl}
                        onChange={(e) => setLogoInputUrl(e.target.value)}
                        placeholder="Or enter Image URL (https://...)"
                        className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono w-full sm:w-56"
                      />
                      <button
                        type="button"
                        onClick={handleApplyLogoUrl}
                        disabled={!logoInputUrl.trim()}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Authorization Secret Code Manager */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-600" />
                      Staff Authorization Secret Code Management
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Configure the secret access code required for teachers and staff members to register accounts. Share this code only with authorized faculty.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateNewSecretCode}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Generate New Code
                  </button>
                </div>

                {codeSuccessToast && (
                  <div className="mb-3 bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    Staff Secret Code updated successfully!
                  </div>
                )}

                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center shrink-0">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div className="w-full sm:w-80">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Staff Secret Code</label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={staffSecretCode}
                          onChange={(e) => setStaffSecretCode(e.target.value)}
                          placeholder="e.g. JIPAS-STAFF-2026"
                          className="w-full pl-3.5 pr-20 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={handleCopySecretCode}
                          className="absolute right-1 px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {isCopiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {isCopiedCode ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveOnlySecretCode}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Update Staff Code
                  </button>
                </div>
              </div>
            </div>

            {/* Academic & Financial Defaults */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-blue-700">
                <Sliders className="w-4 h-4" /> Academic Defaults & Operational Rules
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Active Academic Year</label>
                  <select
                    value={settings.activeAcademicYear}
                    onChange={(e) => setSettings({ ...settings, activeAcademicYear: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="2025-2026">2025-2026 (Current)</option>
                    <option value="2026-2027">2026-2027 (Upcoming)</option>
                    <option value="2024-2025">2024-2025</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Active Term</label>
                  <select
                    value={settings.activeTerm}
                    onChange={(e) => setSettings({ ...settings, activeTerm: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="Third Term">Third Term (Current)</option>
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Next Term Resumption Date</label>
                  <input
                    type="date"
                    value={settings.nextTermBegins}
                    onChange={(e) => setSettings({ ...settings, nextTermBegins: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">SMS Sender ID (Ghana Gateway)</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={settings.smsSenderId}
                    onChange={(e) => setSettings({ ...settings, smsSenderId: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-indigo-700"
                  />
                </div>
              </div>
            </div>

            {/* Save Button Row */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" /> Save All System Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DEDICATED ACCOUNT REQUESTS QUEUE MODULE */}
      {(activeModule === 'system_account_requests' || activeModule === 'account_requests') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          {/* Action Feedback Banner */}
          {actionFeedbackToast && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{actionFeedbackToast}</span>
              </div>
              <button 
                onClick={() => setActionFeedbackToast('')} 
                className="text-emerald-500 hover:text-emerald-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  Account Registration Requests Queue
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 ${
                  pendingUsers.length > 0 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  <Clock className="w-3 h-3" />
                  {pendingUsers.length} Pending
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and approve newly submitted registration requests from teachers, faculty members, and students/parents.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {pendingUsers.length > 0 && (
                <button
                  onClick={async () => {
                    if (!window.confirm(`Approve and activate all ${pendingUsers.length} pending registration requests?`)) return;
                    for (const u of pendingUsers) {
                      await handleApproveAccount(u);
                    }
                    triggerToast(`All ${pendingUsers.length} pending account requests have been approved!`);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Check className="w-4 h-4" /> Approve All ({pendingUsers.length})
                </button>
              )}
              {onNavigate && (
                <button
                  onClick={() => onNavigate('system_users_roles')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Users className="w-4 h-4" /> View All Users
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-800 uppercase">Total Pending Requests</p>
                <h4 className="text-2xl font-black text-amber-900 mt-0.5">{pendingUsers.length}</h4>
                <p className="text-[10px] text-amber-600 font-medium mt-0.5">Awaiting Administrator Review</p>
              </div>
              <div className="w-10 h-10 bg-amber-200 text-amber-800 rounded-xl flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-indigo-800 uppercase">Teacher / Staff Requests</p>
                <h4 className="text-2xl font-black text-indigo-900 mt-0.5">
                  {pendingUsers.filter(u => u.role !== 'student').length}
                </h4>
                <p className="text-[10px] text-indigo-600 font-medium mt-0.5">Teachers & Administrative Staff</p>
              </div>
              <div className="w-10 h-10 bg-indigo-200 text-indigo-800 rounded-xl flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-blue-800 uppercase">Student / Parent Requests</p>
                <h4 className="text-2xl font-black text-blue-900 mt-0.5">
                  {pendingUsers.filter(u => u.role === 'student').length}
                </h4>
                <p className="text-[10px] text-blue-600 font-medium mt-0.5">Student Portal Registrations</p>
              </div>
              <div className="w-10 h-10 bg-blue-200 text-blue-800 rounded-xl flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-3 text-xs">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Filter:</span>
              <button
                onClick={() => setAccountReqFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  accountReqFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                All Requests ({pendingUsers.length})
              </button>
              <button
                onClick={() => setAccountReqFilter('faculty')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  accountReqFilter === 'faculty'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Teachers & Staff ({pendingUsers.filter(u => u.role !== 'student').length})
              </button>
              <button
                onClick={() => setAccountReqFilter('student')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  accountReqFilter === 'student'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Students & Parents ({pendingUsers.filter(u => u.role === 'student').length})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={accountReqSearch}
                onChange={(e) => setAccountReqSearch(e.target.value)}
                placeholder="Search applicant name, email, phone..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Pending Requests Cards List */}
          {(() => {
            const filteredRequests = pendingUsers.filter(u => {
              if (accountReqFilter === 'faculty' && u.role === 'student') return false;
              if (accountReqFilter === 'student' && u.role !== 'student') return false;
              if (accountReqSearch.trim()) {
                const q = accountReqSearch.toLowerCase();
                const matchName = u.name?.toLowerCase().includes(q);
                const matchEmail = u.email?.toLowerCase().includes(q);
                const matchUsername = u.username?.toLowerCase().includes(q);
                const matchPhone = u.phone?.toLowerCase().includes(q);
                const matchDept = u.department?.toLowerCase().includes(q);
                const matchClass = u.className?.toLowerCase().includes(q);
                const matchAdm = u.admissionNo?.toLowerCase().includes(q);
                return matchName || matchEmail || matchUsername || matchPhone || matchDept || matchClass || matchAdm;
              }
              return true;
            });

            if (filteredRequests.length === 0) {
              return (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 p-8 space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">All Caught Up! No Pending Requests</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    There are currently no new account registrations waiting for review. When new staff or students sign up, they will appear here for approval.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRequests.map(user => (
                  <div
                    key={user.id}
                    className="bg-white border-2 border-amber-200 hover:border-amber-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-base">{user.name}</span>
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              user.role === 'admin' ? 'bg-rose-100 text-rose-800' :
                              user.role === 'teacher' ? 'bg-emerald-100 text-emerald-800' :
                              user.role === 'accountant' ? 'bg-cyan-100 text-cyan-800' :
                              user.role === 'clerk' ? 'bg-purple-100 text-purple-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 font-mono mt-1 flex items-center gap-1.5">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">@{user.username}</span>
                            {user.email && <span className="text-slate-500">({user.email})</span>}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" /> Pending
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {user.phone && (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        {user.staffId && (
                          <div className="text-slate-700 font-mono text-[11px]">
                            Staff ID: <span className="font-bold text-indigo-700">{user.staffId}</span>
                          </div>
                        )}
                        {user.department && (
                          <div className="text-slate-700">
                            Dept: <span className="font-bold text-slate-900">{user.department}</span>
                          </div>
                        )}
                        {user.className && (
                          <div className="text-slate-700">
                            Class: <span className="font-bold text-slate-900">{user.className}</span>
                          </div>
                        )}
                        {user.admissionNo && (
                          <div className="text-slate-700 font-mono text-[11px]">
                            Adm No: <span className="font-bold text-indigo-700">{user.admissionNo}</span>
                          </div>
                        )}
                        {user.parentName && (
                          <div className="text-slate-700 col-span-2">
                            Guardian: <span className="font-bold text-slate-900">{user.parentName}</span>
                          </div>
                        )}
                      </div>

                      {user.registeredAt && (
                        <div className="text-[10px] text-slate-400">
                          Submitted on: {new Date(user.registeredAt).toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleRejectAccount(user)}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditUser(user)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Review / Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveAccount(user)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" /> Approve & Activate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* 2. USERS & ROLES MODULE */}
      {(activeModule === 'system_users_roles' || activeModule === 'users_roles' || activeModule === 'users') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          {/* Action Feedback Banner */}
          {actionFeedbackToast && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{actionFeedbackToast}</span>
              </div>
              <button 
                onClick={() => setActionFeedbackToast('')} 
                className="text-emerald-500 hover:text-emerald-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Staff Users & Role-Based Access Control
                </h2>
                {pendingUsers.length > 0 && (
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[11px] font-extrabold animate-pulse flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    {pendingUsers.length} Pending Approval
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage administrative accounts, approve portal registrations, assign roles, and control system permissions.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingUser(null);
                setUserFormName('');
                setUserFormEmail('');
                setUserFormUsername('');
                setUserFormRole('teacher');
                setUserFormPhone('');
                setUserFormDepartment('Primary School');
                setUserFormClass('Basic 1');
                setUserFormPassword('Password123');
                setShowAddUserModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <UserPlus className="w-4 h-4" /> Add New User
            </button>
          </div>

          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 pt-2">
            <button
              type="button"
              onClick={() => setUserMgmtTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                userMgmtTab === 'users' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              Staff Accounts & Directory ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setUserMgmtTab('roles')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                userMgmtTab === 'roles' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Roles & Permissions Matrix (RBAC)
            </button>
          </div>

          {userMgmtTab === 'roles' ? (
            <div className="space-y-6 animate-fade-in text-xs">
              {rbacSuccessToast && (
                <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Role-based access control (RBAC) permissions matrix updated and synced successfully!
                  </span>
                  <button onClick={() => setRbacSuccessToast(false)} className="text-white font-black ml-4">✕</button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Role Selector Column */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-indigo-700">
                    Configurable Roles
                  </h3>
                  <div className="space-y-2">
                    {rbacRoles.map((role, idx) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRbacRoleIdx(idx)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedRbacRoleIdx === idx
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{role.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedRbacRoleIdx === idx ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            Sub-Admin
                          </span>
                        </div>
                        <p className={`text-[11px] mt-1 line-clamp-2 ${selectedRbacRoleIdx === idx ? 'text-indigo-100' : 'text-slate-500'}`}>
                          {role.description}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        const newRole = {
                          id: `role-${Date.now()}`,
                          name: `Custom Role ${rbacRoles.length + 1}`,
                          description: 'Custom sub-admin operational role.',
                          modules: {
                            setup_management: 'read',
                            system_settings: 'none',
                            teachers: 'read',
                            students: 'read',
                            exams: 'read',
                            fees: 'none',
                            notif_send: 'read',
                            logs_user: 'none'
                          }
                        };
                        setRbacRoles([...rbacRoles, newRole]);
                        setSelectedRbacRoleIdx(rbacRoles.length);
                        triggerToast('New sub-admin role profile created.');
                      }}
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Custom Sub-Admin Role
                    </button>
                  </div>
                </div>

                {/* Permission Matrix for Selected Role */}
                <div className="lg:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">
                        Editing Permissions for: <span className="text-indigo-600">{rbacRoles[selectedRbacRoleIdx]?.name}</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Define whether this role has Read & Write, Read-Only, or No Access to each module.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRbacSuccessToast(true);
                        setTimeout(() => setRbacSuccessToast(false), 3500);
                        triggerToast(`Permissions for "${rbacRoles[selectedRbacRoleIdx]?.name}" successfully updated!`);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Save Role Permissions
                    </button>
                  </div>

                  <div className="space-y-3">
                    {[
                      { id: 'setup_management', label: 'Setup Management (Academic Years, Terms, Classes, Subjects)', icon: School },
                      { id: 'system_settings', label: 'System Settings & User Account Approvals', icon: Settings },
                      { id: 'teachers', label: 'Teacher Management & Staff Attendance', icon: UserCheck },
                      { id: 'students', label: 'Student Enrollment, Attendance & Promotions', icon: Users },
                      { id: 'exams', label: 'Examination Management & Report Cards', icon: Award },
                      { id: 'fees', label: 'Fee Billing, Collections & Financial Statements', icon: DollarSign },
                      { id: 'notif_send', label: 'Notifications, SMS & Broadcast Center', icon: Bell },
                      { id: 'logs_user', label: 'Activity & Login Audit Logs', icon: Shield }
                    ].map(mod => {
                      const currentPermission = rbacRoles[selectedRbacRoleIdx]?.modules[mod.id as keyof typeof rbacRoles[number]['modules']] || 'none';
                      const ModIcon = mod.icon;

                      return (
                        <div key={mod.id} className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                              <ModIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{mod.label}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Module Identifier: {mod.id}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...rbacRoles];
                                updated[selectedRbacRoleIdx].modules[mod.id as keyof typeof updated[number]['modules']] = 'none';
                                setRbacRoles(updated);
                              }}
                              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                                currentPermission === 'none'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              No Access
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...rbacRoles];
                                updated[selectedRbacRoleIdx].modules[mod.id as keyof typeof updated[number]['modules']] = 'read';
                                setRbacRoles(updated);
                              }}
                              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                                currentPermission === 'read'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Read-Only
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...rbacRoles];
                                updated[selectedRbacRoleIdx].modules[mod.id as keyof typeof updated[number]['modules']] = 'read_write';
                                setRbacRoles(updated);
                              }}
                              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                                currentPermission === 'read_write'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Read & Write
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
          {pendingUsers.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      Pending Registration Approval Queue
                      <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-black">
                        {pendingUsers.length}
                      </span>
                    </h3>
                    <p className="text-[11px] text-amber-800">
                      New self-registered teachers, staff, or students awaiting administrator review and access activation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingUsers.map(user => (
                  <div 
                    key={user.id} 
                    className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{user.name}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                            user.role === 'admin' ? 'bg-rose-100 text-rose-800' :
                            user.role === 'teacher' ? 'bg-emerald-100 text-emerald-800' :
                            user.role === 'accountant' ? 'bg-cyan-100 text-cyan-800' :
                            user.role === 'clerk' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 font-mono mt-0.5">
                          @{user.username} {user.email && `• ${user.email}`}
                        </div>
                        {user.phone && (
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {user.phone}
                          </div>
                        )}
                        {(user.department || user.className || user.admissionNo) && (
                          <div className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md mt-1.5 font-medium inline-block">
                            {user.department && `Dept: ${user.department}`}
                            {user.className && ` • Class: ${user.className}`}
                            {user.admissionNo && ` • Adm No: ${user.admissionNo}`}
                          </div>
                        )}
                        {user.registeredAt && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            Registered: {new Date(user.registeredAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleRejectAccount(user)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => handleOpenEditUser(user)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Review / Edit
                      </button>
                      <button
                        onClick={() => handleApproveAccount(user)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" /> Approve & Activate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter, Status Tabs, and Search Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            {/* Status Pills */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Status:</span>
              <button
                onClick={() => setUserStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  userStatusFilter === 'all' 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                All Users ({users.length})
              </button>
              <button
                onClick={() => setUserStatusFilter('Active')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  userStatusFilter === 'Active' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Active ({activeUsersCount})
              </button>
              <button
                onClick={() => setUserStatusFilter('Pending')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  userStatusFilter === 'Pending' 
                    ? 'bg-amber-500 text-white shadow-xs' 
                    : 'bg-white border border-slate-200 text-amber-700 hover:bg-amber-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Pending Approval ({pendingUsers.length})
              </button>
              <button
                onClick={() => setUserStatusFilter('Inactive')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  userStatusFilter === 'Inactive' 
                    ? 'bg-rose-600 text-white shadow-xs' 
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Inactive ({inactiveUsersCount})
              </button>
            </div>

            <div className="flex flex-wrap gap-3 items-center justify-between pt-1">
              <div className="flex flex-wrap gap-3 items-center flex-1">
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name, username, email, phone, admission..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Administrators</option>
                    <option value="teacher">Teachers</option>
                    <option value="accountant">Accountants</option>
                    <option value="clerk">Clerks / Secretary</option>
                    <option value="student">Students / Parents</option>
                  </select>
                </div>
              </div>
              <div className="text-slate-500 font-medium">
                Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> accounts
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Full Name & ID</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Department / Class</th>
                  <th className="p-3">Contact Details</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3">Created / Registered</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No user accounts found matching your query or filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => {
                    const isPending = user.status === 'Pending' || user.isApproved === false;

                    return (
                      <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${isPending ? 'bg-amber-50/40' : ''}`}>
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {user.name}
                            {isPending && (
                              <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] rounded-md font-black">
                                PENDING
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-indigo-600 text-[11px]">@{user.username}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            user.role === 'admin' ? 'bg-rose-100 text-rose-800' :
                            user.role === 'accountant' ? 'bg-cyan-100 text-cyan-800' :
                            user.role === 'teacher' ? 'bg-emerald-100 text-emerald-800' :
                            user.role === 'clerk' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">
                          {user.department || user.className ? (
                            <div>
                              <div className="font-semibold text-slate-800">{user.department || '—'}</div>
                              <div className="text-[10px] text-slate-500">{user.className || 'General'}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          <div className="font-medium text-slate-800">{user.email || '—'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{user.phone || '—'}</div>
                        </td>
                        <td className="p-3">
                          {isPending ? (
                            <button
                              onClick={() => handleApproveAccount(user)}
                              title="Click to approve account"
                              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Clock className="w-3 h-3 text-amber-600" /> Pending Approval
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleUserStatus(user)}
                              title="Click to toggle status"
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                user.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                            >
                              {user.status === 'Active' ? '● Active' : '○ Inactive'}
                            </button>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-500 text-[11px]">
                          {user.createdAt || user.registeredAt || '—'}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleApproveAccount(user)}
                                  title="Approve & Activate Account"
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRejectAccount(user)}
                                  title="Reject Registration"
                                  className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleOpenEditUser(user)}
                              title="Edit User"
                              className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingUser(user)}
                              title="Delete User"
                              className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      )}
      </div>
      )}

      {/* 3. STUDENT PORTAL CONTROL MODULE */}
      {(activeModule === 'system_student_portal_control' || activeModule === 'student_portal_control') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Student Portal Security & Access Control
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enable or restrict features accessible to students and parents through their online portal accounts.
              </p>
            </div>
            <button
              onClick={() => {
                setPortalToast(true);
                setTimeout(() => setPortalToast(false), 3500);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" /> Save Portal Controls
            </button>
          </div>

          {portalToast && (
            <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Student portal access permissions and security locks updated successfully!
              </span>
              <button onClick={() => setPortalToast(false)} className="text-white font-black ml-4">✕</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* General Access */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-indigo-700">
                Core Portal Availability
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 block">Master Portal Online Switch</span>
                    <span className="text-[11px] text-slate-500">Allow students and parents to log in</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={portalControls.portalOnline}
                    onChange={(e) => setPortalControls({ ...portalControls, portalOnline: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 block">Terminal Exam Results Viewing</span>
                    <span className="text-[11px] text-slate-500">Display released term reports and score sheets</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={portalControls.viewTerminalReports}
                    onChange={(e) => setPortalControls({ ...portalControls, viewTerminalReports: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 block">Official PDF Report Card Downloads</span>
                    <span className="text-[11px] text-slate-500">Allow printing stamped terminal report cards</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={portalControls.downloadReportPdf}
                    onChange={(e) => setPortalControls({ ...portalControls, downloadReportPdf: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                </label>
              </div>
            </div>

            {/* Financial Restrictions */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-rose-700">
                Fee & Arrears Security Locks
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 block">Fee Statement & Balance Access</span>
                    <span className="text-[11px] text-slate-500">Display term bills and payment receipts</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={portalControls.viewFeeStatements}
                    onChange={(e) => setPortalControls({ ...portalControls, viewFeeStatements: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 block">Lock Results for Unpaid Fee Arrears</span>
                    <span className="text-[11px] text-slate-500">Hide grades until tuition fees are fully cleared</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={portalControls.lockStudentsInArrears}
                    onChange={(e) => setPortalControls({ ...portalControls, lockStudentsInArrears: e.target.checked })}
                    className="w-5 h-5 text-rose-600 rounded"
                  />
                </label>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <label className="block font-bold text-slate-900 mb-1">Arrears Threshold for Result Lock (CFA)</label>
                  <input
                    type="number"
                    value={portalControls.lockArrearsAbove}
                    onChange={(e) => setPortalControls({ ...portalControls, lockArrearsAbove: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Students owing above this amount will have exam cards restricted.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MANAGE PORTAL LOGINS MODULE */}
      {(activeModule === 'system_manage_portal_logins' || activeModule === 'manage_portal_logins') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                Manage Student & Parent Portal Logins
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect admission credentials, reset access PINs, lock compromised accounts, and monitor last access.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between text-xs">
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={portalLoginSearch}
                onChange={(e) => setPortalLoginSearch(e.target.value)}
                placeholder="Search by student name, admission number, class..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>
            <div className="text-slate-500 font-medium">
              Showing <strong>{filteredPortalLogins.length}</strong> login credentials
            </div>
          </div>

          {/* Portal Logins Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Admission No</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Access PIN / Passcode</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3">Last Portal Session</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPortalLogins.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{item.name}</td>
                    <td className="p-3 font-mono font-bold text-indigo-700">{item.admissionNo}</td>
                    <td className="p-3 text-slate-600">{item.className}</td>
                    <td className="p-3">
                      <span className="font-mono bg-slate-100 px-2.5 py-1 rounded border border-slate-200 text-slate-800 font-bold tracking-wider">
                        {item.passPin}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-500 text-[11px]">{item.lastAccess}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setResetPinModal(item);
                            handlePerformResetPin(item.id);
                          }}
                          title="Generate New PIN"
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" /> Reset PIN
                        </button>
                        <button
                          onClick={() => handleTogglePortalLock(item.id)}
                          title={item.status === 'Active' ? 'Lock Account' : 'Unlock Account'}
                          className={`p-1 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer ${
                            item.status === 'Active' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {item.status === 'Active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT USER MODAL */}
      {(showAddUserModal || editingUser) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                {editingUser ? `Edit User: ${editingUser.name}` : 'Create New System User Account'}
              </h3>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">User Full Name *</label>
                <input
                  type="text"
                  required
                  value={userFormName}
                  onChange={(e) => setUserFormName(e.target.value)}
                  placeholder="e.g. Samuel K. Appiah"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username / Login ID *</label>
                  <input
                    type="text"
                    required
                    value={userFormUsername}
                    onChange={(e) => setUserFormUsername(e.target.value)}
                    placeholder="e.g. samuel.appiah"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">System Role *</label>
                  <select
                    value={userFormRole}
                    onChange={(e) => setUserFormRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="teacher">Teacher / Faculty</option>
                    <option value="admin">Administrator (Full)</option>
                    <option value="sub_admin">Sub-Admin (Restricted / Privileged)</option>
                    <option value="accountant">Accountant / Bursar</option>
                    <option value="clerk">Clerk / Secretary</option>
                    <option value="student">Student / Parent</option>
                  </select>
                </div>
              </div>

              {userFormRole === 'sub_admin' && (
                <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-indigo-800">
                    <ShieldAlert className="w-4 h-4 text-indigo-600" />
                    Sub-Admin Privileges & Portal Module Access
                  </h4>
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1">Access Privilege</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setUserFormPrivilege('read')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                          userFormPrivilege === 'read' ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Read-Only Access
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserFormPrivilege('read_write')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                          userFormPrivilege === 'read_write' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Read & Write Privilege
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1">Allowed Portal Sections / Modules</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 'setup_management', label: 'Setup Management' },
                        { id: 'system_settings', label: 'System Settings & Users' },
                        { id: 'teachers', label: 'Teacher Management' },
                        { id: 'students', label: 'Student Management' },
                        { id: 'exams', label: 'Examination Management' },
                        { id: 'fees', label: 'Fee Management' },
                        { id: 'notif_send', label: 'Notifications & SMS' },
                        { id: 'logs_user', label: 'Activity & Audit Logs' }
                      ].map(mod => {
                        const isChecked = userFormAllowedModules.includes(mod.id);
                        return (
                          <label key={mod.id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setUserFormAllowedModules([...userFormAllowedModules, mod.id]);
                                } else {
                                  setUserFormAllowedModules(userFormAllowedModules.filter(m => m !== mod.id));
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="font-medium text-slate-800">{mod.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={userFormDepartment}
                    onChange={(e) => setUserFormDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Primary School">Primary School</option>
                    <option value="Junior High School">Junior High School</option>
                    <option value="Nursery & KG">Nursery & KG</option>
                    <option value="Creche">Creche</option>
                    <option value="Administration">Administration</option>
                    <option value="Accounts & Finance">Accounts & Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Class (Optional)</label>
                  <select
                    value={userFormClass}
                    onChange={(e) => setUserFormClass(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium bg-white focus:ring-2 focus:ring-indigo-500"
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
                    <option value="All Classes">All Classes / Administrative</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={userFormEmail}
                    onChange={(e) => setUserFormEmail(e.target.value)}
                    placeholder="e.g. user@jipas.edu.gh"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={userFormPhone}
                    onChange={(e) => setUserFormPhone(e.target.value)}
                    placeholder="e.g. 0244123456"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="text"
                    value={userFormPassword}
                    onChange={(e) => setUserFormPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Users will be able to log in immediately with these credentials.</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm cursor-pointer transition-colors"
                >
                  {editingUser ? 'Update User Account' : 'Create & Activate Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete User Account?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete <strong>{deletingUser.name}</strong> ({deletingUser.username})? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-colors"
              >
                Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN RESET SUCCESS MODAL */}
      {resetPinModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">PIN Reset Successful</h3>
              <p className="text-xs text-slate-500 mt-1">
                New access passcode generated for <strong>{resetPinModal.name}</strong>:
              </p>
              <div className="my-3 p-3 bg-slate-100 border border-slate-300 rounded-xl font-mono text-xl font-black text-indigo-700 tracking-widest">
                {newGeneratedPin}
              </div>
              <p className="text-[11px] text-slate-400">
                Please securely communicate this PIN to the student/parent.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setResetPinModal(null)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
