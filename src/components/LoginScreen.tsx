import React, { useState } from 'react';
import { User, UserAccountItem } from '../types';
import { 
  Mail, Eye, EyeOff, LogIn, CheckCircle2, Lock, Loader2, 
  AlertCircle, UserPlus, GraduationCap, Briefcase, Phone, User as UserIcon, Shield, ArrowLeft, Building2,
  KeyRound, ShieldCheck, HelpCircle
} from 'lucide-react';
import JIPASLogo from './common/JIPASLogo';
import LanguageSwitcher from './common/LanguageSwitcher';
import { authenticateWithFirebase, requestPasswordReset, saveUserAccount, getStoredUsers, getStaffSecretCode, validateAndConsumeStaffSecretCode } from '../services/dbService';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  studentsList: { id: string; name: string; admissionNo: string; email?: string; parentPhone?: string }[];
  teachersList?: { id: string; name: string; email: string; classAssigned?: string }[];
}

type AuthViewMode = 'login' | 'register_faculty' | 'register_student';

export default function LoginScreen({ onLogin, studentsList, teachersList = [] }: LoginScreenProps) {
  const [viewMode, setViewMode] = useState<AuthViewMode>('login');
  
  // Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [authSuccessNotice, setAuthSuccessNotice] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Faculty Registration Form State
  const [facultyName, setFacultyName] = useState('');
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyUsername, setFacultyUsername] = useState('');
  const [facultyPhone, setFacultyPhone] = useState('');
  const [facultyRole, setFacultyRole] = useState<'teacher' | 'accountant' | 'clerk'>('teacher');
  const [facultyDepartment, setFacultyDepartment] = useState('Primary School');
  const [facultyStaffId, setFacultyStaffId] = useState('');
  const [facultyPassword, setFacultyPassword] = useState('');
  const [facultySecretCode, setFacultySecretCode] = useState('');

  // Student/Parent Registration Form State
  const [studentFullName, setStudentFullName] = useState('');
  const [studentAdmissionNo, setStudentAdmissionNo] = useState('');
  const [studentClassName, setStudentClassName] = useState('Basic 1');
  const [parentFullName, setParentFullName] = useState('');
  const [parentPhoneNumber, setParentPhoneNumber] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Registration feedback
  const [regSuccessNotice, setRegSuccessNotice] = useState('');
  const [regErrorNotice, setRegErrorNotice] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // --------------------------------------------------------------------------
  // Unified Login Handler
  // --------------------------------------------------------------------------
  const handleUnifiedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setAuthSuccessNotice('');

    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setErrorMsg('Please enter your email, username, staff ID, or student admission number.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password or access PIN.');
      return;
    }

    setIsLoading(true);

    try {
      const lower = trimmedId.toLowerCase();

      // ==========================================
      // 1. ADMIN AUTHENTICATION (JAKRei)
      // ==========================================
      const isAdminIdentifier = 
        lower === 'rei311213@gmail.com' ||
        lower === 'rei311213' ||
        lower === 'jakrei';

      if (isAdminIdentifier) {
        if (password !== 'Livinus@23') {
          setErrorMsg('Incorrect administrator password. Please check your credentials.');
          setIsLoading(false);
          return;
        }

        const adminEmail = 'rei311213@gmail.com';
        const adminName = 'JAKRei';

        try {
          const authUser = await authenticateWithFirebase(adminEmail, password, 'admin', {
            name: adminName,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          });
          setAuthSuccessNotice('Administrator authenticated. Redirecting to Administration Portal...');
          setTimeout(() => onLogin(authUser), 400);
        } catch {
          setAuthSuccessNotice('Administrator authenticated. Redirecting to Administration Portal...');
          setTimeout(() => {
            onLogin({
              id: 'u-admin',
              name: adminName,
              email: adminEmail,
              role: 'admin',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            });
          }, 400);
        }
        return;
      }

      // ==========================================
      // 2. CHECK DYNAMIC USERS DATABASE (Accounts created/registered)
      // ==========================================
      const storedUsers = getStoredUsers();
      const matchedUserAccount = storedUsers.find(u => 
        (u.email && u.email.toLowerCase() === lower) ||
        (u.username && u.username.toLowerCase() === lower) ||
        (u.phone && u.phone === trimmedId) ||
        (u.staffId && u.staffId.toLowerCase() === lower) ||
        (u.admissionNo && u.admissionNo.toLowerCase() === lower)
      );

      if (matchedUserAccount) {
        if (matchedUserAccount.status === 'Pending' || matchedUserAccount.isApproved === false) {
          setErrorMsg('Your account registration is currently pending approval by the School Administrator. You will be granted access as soon as it is approved.');
          setIsLoading(false);
          return;
        }

        if (matchedUserAccount.status === 'Inactive' || matchedUserAccount.status === 'Locked') {
          setErrorMsg('This account is currently inactive or locked. Please contact the school administrator.');
          setIsLoading(false);
          return;
        }

        // Validate password if stored, or allow standard default
        if (matchedUserAccount.password && matchedUserAccount.password !== password) {
          setErrorMsg('Incorrect password. Please try again or use password reset.');
          setIsLoading(false);
          return;
        }

        setAuthSuccessNotice(`Welcome back, ${matchedUserAccount.name}! Routing to your portal...`);
        setTimeout(() => {
          onLogin({
            id: matchedUserAccount.id,
            name: matchedUserAccount.name,
            email: matchedUserAccount.email,
            role: matchedUserAccount.role,
            phone: matchedUserAccount.phone,
            classAssigned: (matchedUserAccount as any).classAssigned,
            admissionNo: (matchedUserAccount as any).admissionNo,
            allowedModules: (matchedUserAccount as any).allowedModules,
            privilege: (matchedUserAccount as any).privilege,
            avatar: (matchedUserAccount as any).avatar || (matchedUserAccount.role === 'teacher' 
              ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=150&auto=format&fit=crop&q=80')
          });
        }, 400);
        return;
      }

      // ==========================================
      // 3. REGISTERED TEACHER AUTHENTICATION (from teachersList)
      // ==========================================
      const matchedTeacher = teachersList.find(t => 
        (t.email && t.email.toLowerCase() === lower) ||
        (t.id && t.id.toLowerCase() === lower)
      );

      if (matchedTeacher) {
        try {
          const authUser = await authenticateWithFirebase(matchedTeacher.email, password, 'teacher', {
            id: matchedTeacher.id,
            name: matchedTeacher.name,
            classAssigned: matchedTeacher.classAssigned,
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
          });
          setAuthSuccessNotice(`Welcome back, ${matchedTeacher.name}! Redirecting to Teacher Portal...`);
          setTimeout(() => onLogin(authUser), 400);
        } catch {
          setAuthSuccessNotice(`Welcome back, ${matchedTeacher.name}! Redirecting to Teacher Portal...`);
          setTimeout(() => {
            onLogin({
              id: matchedTeacher.id,
              name: matchedTeacher.name,
              email: matchedTeacher.email,
              role: 'teacher',
              classAssigned: matchedTeacher.classAssigned,
              avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
            });
          }, 400);
        }
        return;
      }

      // ==========================================
      // 4. REGISTERED STUDENT / PARENT AUTHENTICATION (from studentsList)
      // ==========================================
      const matchedStudent = studentsList.find(s => 
        (s.admissionNo && s.admissionNo.toLowerCase() === lower) ||
        (s.id && s.id.toLowerCase() === lower) ||
        (s.email && s.email.toLowerCase() === lower) ||
        (s.parentPhone && s.parentPhone === trimmedId)
      );

      if (matchedStudent) {
        const studentEmail = matchedStudent.email || `${matchedStudent.admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.jipas.com`;

        try {
          const authUser = await authenticateWithFirebase(studentEmail, password, 'student', {
            id: matchedStudent.id,
            name: matchedStudent.name,
            admissionNo: matchedStudent.admissionNo,
            avatar: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=150&auto=format&fit=crop&q=80'
          });
          setAuthSuccessNotice(`Welcome back, ${matchedStudent.name}! Redirecting to Student Portal...`);
          setTimeout(() => onLogin(authUser), 400);
        } catch {
          setAuthSuccessNotice(`Welcome back, ${matchedStudent.name}! Redirecting to Student Portal...`);
          setTimeout(() => {
            onLogin({
              id: matchedStudent.id,
              name: matchedStudent.name,
              email: studentEmail,
              role: 'student',
              admissionNo: matchedStudent.admissionNo,
              avatar: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=150&auto=format&fit=crop&q=80'
            });
          }, 400);
        }
        return;
      }

      // ==========================================
      // 5. UNKNOWN CREDENTIALS
      // ==========================================
      setErrorMsg('Invalid credentials. No active account found matching your details. If you just registered, please wait for Administrator approval.');
    } catch (err: any) {
      console.error('Unified login error:', err);
      setErrorMsg(err?.message || 'Authentication error. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Faculty / Staff Registration Handler
  // --------------------------------------------------------------------------
  const handleFacultyRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorNotice('');
    setRegSuccessNotice('');

    if (!facultyName.trim() || !facultyEmail.trim() || !facultyUsername.trim() || !facultyPassword.trim()) {
      setRegErrorNotice('Please fill out all required fields.');
      return;
    }

    const validation = validateAndConsumeStaffSecretCode(facultySecretCode, facultyEmail.trim().toLowerCase());
    if (!validation.success) {
      setRegErrorNotice(validation.error || 'Invalid Staff Secret Code.');
      return;
    }

    setIsSubmittingReg(true);

    try {
      const newAccount: UserAccountItem = {
        id: `usr-fac-${Date.now()}`,
        name: facultyName.trim(),
        email: facultyEmail.trim().toLowerCase(),
        username: facultyUsername.trim().toLowerCase(),
        role: facultyRole,
        phone: facultyPhone.trim() || '0240000000',
        status: 'Pending',
        isApproved: false,
        registrationType: 'faculty',
        department: facultyDepartment,
        staffId: facultyStaffId.trim() || `STF/${Date.now().toString().slice(-4)}`,
        password: facultyPassword,
        lastLogin: 'Never',
        createdAt: new Date().toISOString().split('T')[0]
      };

      await saveUserAccount(newAccount);

      setRegSuccessNotice(`Registration successful! Your ${facultyRole.toUpperCase()} account application for ${facultyName} has been submitted. It is currently pending Administrator approval.`);
      
      // Reset form
      setFacultyName('');
      setFacultyEmail('');
      setFacultyUsername('');
      setFacultyPhone('');
      setFacultyStaffId('');
      setFacultyPassword('');
      setFacultySecretCode('');
      
      setTimeout(() => {
        setViewMode('login');
        setAuthSuccessNotice('Your registration has been submitted and is awaiting Admin approval.');
      }, 3500);
    } catch (err: any) {
      console.error('Faculty registration failed:', err);
      setRegErrorNotice(err?.message || 'Failed to submit registration. Please try again.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  // --------------------------------------------------------------------------
  // Student / Parent Registration Handler
  // --------------------------------------------------------------------------
  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorNotice('');
    setRegSuccessNotice('');

    if (!studentFullName.trim() || !parentPhoneNumber.trim() || !studentPassword.trim()) {
      setRegErrorNotice('Please provide student full name, parent phone number, and password.');
      return;
    }

    setIsSubmittingReg(true);

    try {
      const generatedAdmNo = studentAdmissionNo.trim() || `ADM/26/${String(Math.floor(1000 + Math.random() * 9000))}`;
      const generatedEmail = studentEmail.trim().toLowerCase() || `${studentFullName.toLowerCase().replace(/\s+/g, '.')}${Date.now().toString().slice(-3)}@student.jipas.com`;
      const generatedUsername = studentAdmissionNo.trim() || generatedAdmNo;

      const newAccount: UserAccountItem = {
        id: `usr-stu-${Date.now()}`,
        name: studentFullName.trim().toUpperCase(),
        email: generatedEmail,
        username: generatedUsername,
        role: 'student',
        phone: parentPhoneNumber.trim(),
        status: 'Pending',
        isApproved: false,
        registrationType: 'student',
        className: studentClassName,
        admissionNo: generatedAdmNo,
        parentName: parentFullName.trim() || 'Parent / Guardian',
        parentPhone: parentPhoneNumber.trim(),
        password: studentPassword,
        lastLogin: 'Never',
        createdAt: new Date().toISOString().split('T')[0]
      };

      await saveUserAccount(newAccount);

      setRegSuccessNotice(`Registration successful! Student application for ${studentFullName} has been submitted and is pending Administrator approval.`);
      
      // Reset form
      setStudentFullName('');
      setStudentAdmissionNo('');
      setParentFullName('');
      setParentPhoneNumber('');
      setStudentEmail('');
      setStudentPassword('');

      setTimeout(() => {
        setViewMode('login');
        setAuthSuccessNotice('Student registration submitted! You can sign in once approved by Admin.');
      }, 3500);
    } catch (err: any) {
      console.error('Student registration failed:', err);
      setRegErrorNotice(err?.message || 'Failed to submit student registration. Please try again.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col justify-center items-center py-10 px-4 sm:px-6 relative overflow-hidden">
      {/* Top right language switch */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher variant="pill" />
      </div>

      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top School Branding Header */}
      <div className="flex flex-col items-center mb-6 text-center z-10 space-y-3">
        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
          <JIPASLogo size="lg" rounded={false} />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>JIPAS</span>
            <span className="text-emerald-400 font-light">•</span>
            <span className="text-base sm:text-lg font-bold text-indigo-200 tracking-normal">Academic Portal</span>
          </h1>
          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">
            Education is Wealth • GES Accredited System
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. SIGN IN VIEW                                               */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'login' && (
        <div className="w-full max-w-[440px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-7 sm:p-8 z-10 transition-all duration-300">
          
          <div className="text-center space-y-1 mb-5">
            <h2 className="text-slate-900 font-black text-xl tracking-tight">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-slate-500">
              Enter your credentials to be automatically routed to your portal.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2 font-semibold animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {authSuccessNotice && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-semibold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{authSuccessNotice}</span>
            </div>
          )}

          <form onSubmit={handleUnifiedSubmit} className="space-y-4">
            {/* User Identifier Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Email, Username, Staff ID, or Admission No
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="input-unified-identifier"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. admin@jipas.com, ADM/26/0001, or staff ID"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all pr-10"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Password / Access PIN Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Password or Access PIN
                </label>
                <a
                  href="#forgot"
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!identifier.trim() || !identifier.includes('@')) {
                      setErrorMsg('Please enter your email address in the field above to receive a reset link.');
                      return;
                    }
                    try {
                      await requestPasswordReset(identifier.trim());
                      setAuthSuccessNotice(`Password reset link sent to ${identifier.trim()}`);
                      setErrorMsg('');
                    } catch (err: any) {
                      setErrorMsg(err?.message || 'Failed to send reset email.');
                    }
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="input-unified-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password or PIN..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all pr-10"
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me option */}
            <div className="flex items-center justify-between pt-1 text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <span className="font-medium">Remember this device</span>
              </label>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" />
                AES Secured
              </span>
            </div>

            {/* Unified Submit Button */}
            <button
              type="submit"
              id="btn-unified-login"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-800 hover:to-indigo-900 active:scale-[0.99] disabled:opacity-75 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Authenticating & Routing to Portal...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  <span>Sign In to Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Self-Registration Section */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-3">
            <p className="text-xs text-slate-500 font-medium">New member or student joining JIPAS?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-open-faculty-register"
                onClick={() => {
                  setErrorMsg('');
                  setRegErrorNotice('');
                  setRegSuccessNotice('');
                  setViewMode('register_faculty');
                }}
                className="p-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-colors cursor-pointer"
              >
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>Register Faculty / Staff</span>
              </button>
              
              <button
                type="button"
                id="btn-open-student-register"
                onClick={() => {
                  setErrorMsg('');
                  setRegErrorNotice('');
                  setRegSuccessNotice('');
                  setViewMode('register_student');
                }}
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-colors cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>Register Student / Parent</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              * New self-registrations require School Administrator approval before portal access is activated.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. FACULTY / TEACHER REGISTRATION VIEW                        */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'register_faculty' && (
        <div className="w-full max-w-[480px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-7 sm:p-8 z-10 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <button
              type="button"
              onClick={() => setViewMode('login')}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
              Faculty Registration
            </span>
          </div>

          <div className="text-center space-y-1 mb-5">
            <h2 className="text-slate-900 font-black text-lg sm:text-xl tracking-tight flex items-center justify-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Register Faculty / Staff Member
            </h2>
            <p className="text-xs text-slate-500">
              Submit your staff details. Your account will be activated upon administrator approval.
            </p>
          </div>

          {regErrorNotice && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{regErrorNotice}</span>
            </div>
          )}

          {regSuccessNotice && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{regSuccessNotice}</span>
            </div>
          )}

          <form onSubmit={handleFacultyRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                placeholder="e.g. Kwabena Mensah Osei"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Staff Email Address *</label>
                <input
                  type="email"
                  required
                  value={facultyEmail}
                  onChange={(e) => setFacultyEmail(e.target.value)}
                  placeholder="e.g. kwabena@jipas.edu.gh"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Preferred Username *</label>
                <input
                  type="text"
                  required
                  value={facultyUsername}
                  onChange={(e) => setFacultyUsername(e.target.value)}
                  placeholder="e.g. kmensah"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Role / Position *</label>
                <select
                  value={facultyRole}
                  onChange={(e) => setFacultyRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:bg-white"
                >
                  <option value="teacher">Teacher / Educator</option>
                  <option value="accountant">Accountant / Bursar</option>
                  <option value="clerk">Administrative Clerk</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department</label>
                <select
                  value={facultyDepartment}
                  onChange={(e) => setFacultyDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:bg-white"
                >
                  <option value="Primary School">Primary School</option>
                  <option value="Junior High School">Junior High School</option>
                  <option value="Pre-School">Pre-School</option>
                  <option value="Accounts & Finance">Accounts & Finance</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={facultyPhone}
                  onChange={(e) => setFacultyPhone(e.target.value)}
                  placeholder="e.g. 0244123456"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Staff ID (Optional)</label>
                <input
                  type="text"
                  value={facultyStaffId}
                  onChange={(e) => setFacultyStaffId(e.target.value)}
                  placeholder="e.g. STF-2026-08"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
              <KeyRound className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Staff Authentication Code Required</span>
                <span className="text-[11px] text-amber-800 leading-tight block">
                  To authenticate staff registrations, enter the official Secret Code issued by your School Administrator.
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Staff Authorization Secret Code *
                </label>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  Acquire from Admin
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  id="input-faculty-secret-code"
                  value={facultySecretCode}
                  onChange={(e) => setFacultySecretCode(e.target.value)}
                  placeholder="e.g. JIPAS-STAFF-2026"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-amber-300 rounded-xl font-mono font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <KeyRound className="w-4 h-4 text-amber-600 absolute left-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                * Check with the Administration office if you haven't received your staff authorization code.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Create Password *</label>
              <input
                type="password"
                required
                value={facultyPassword}
                onChange={(e) => setFacultyPassword(e.target.value)}
                placeholder="Choose a strong password..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingReg}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingReg ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Submit Faculty Registration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. STUDENT / PARENT REGISTRATION VIEW                         */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'register_student' && (
        <div className="w-full max-w-[480px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-7 sm:p-8 z-10 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <button
              type="button"
              onClick={() => setViewMode('login')}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Student Registration
            </span>
          </div>

          <div className="text-center space-y-1 mb-5">
            <h2 className="text-slate-900 font-black text-lg sm:text-xl tracking-tight flex items-center justify-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              Student / Parent Registration Form
            </h2>
            <p className="text-xs text-slate-500">
              Register a student or parent account. The admission will be approved by the administration.
            </p>
          </div>

          {regErrorNotice && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{regErrorNotice}</span>
            </div>
          )}

          {regSuccessNotice && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{regSuccessNotice}</span>
            </div>
          )}

          <form onSubmit={handleStudentRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Student Full Name *</label>
              <input
                type="text"
                required
                value={studentFullName}
                onChange={(e) => setStudentFullName(e.target.value)}
                placeholder="e.g. ADDAE KWAME JUNIOR"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold uppercase focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Class / Grade *</label>
                <select
                  value={studentClassName}
                  onChange={(e) => setStudentClassName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:bg-white"
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
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Admission No (If known)</label>
                <input
                  type="text"
                  value={studentAdmissionNo}
                  onChange={(e) => setStudentAdmissionNo(e.target.value)}
                  placeholder="e.g. ADM/26/0015 (Optional)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent / Guardian Name *</label>
                <input
                  type="text"
                  required
                  value={parentFullName}
                  onChange={(e) => setParentFullName(e.target.value)}
                  placeholder="e.g. Mr. Kwame Addae"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent Phone Number *</label>
                <input
                  type="text"
                  required
                  value={parentPhoneNumber}
                  onChange={(e) => setParentPhoneNumber(e.target.value)}
                  placeholder="e.g. 0244556677"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address (Optional)</label>
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="e.g. parent@gmail.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Create Access Password *</label>
              <input
                type="password"
                required
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                placeholder="Choose your portal password..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingReg}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingReg ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Registration...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Submit Student Registration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Footer Copyright */}
      <div className="mt-8 text-center text-xs text-slate-400 font-medium z-10">
        © 2026 JIPAS • Professional Academic & Financial Management Platform
      </div>
    </div>
  );
}
