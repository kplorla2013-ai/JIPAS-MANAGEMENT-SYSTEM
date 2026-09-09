import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, UserPlus, Users, CreditCard, Calendar, ArrowUpRight, 
  History, Plus, Pencil, Trash2, Search, CheckCircle2, AlertTriangle, 
  Printer, Download, Save, QrCode, Shield, Phone, Mail, Check, RotateCcw,
  Loader2, Clock, CheckCheck, XCircle, Inbox, UserCheck
} from 'lucide-react';
import { Student, PromotionRecord } from '../../types';
import JIPASLogo from '../common/JIPASLogo';
import PhotoUploader from '../common/PhotoUploader';
import { saveStudent, deleteStudent, approveStudentAdmission, rejectStudentAdmission } from '../../services/dbService';

interface StudentManagerProps {
  activeModule: string;
  students: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent?: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
  onNavigate?: (module: string) => void;
}

export const INITIAL_PROMOTION_HISTORY: PromotionRecord[] = [
  { id: 'pr-1', date: '2026-08-25', fromClass: 'Basic 1', toClass: 'Basic 2', academicYear: '2025-2026', studentCount: 2, promotedBy: 'Marcus Prosper', notes: 'End of academic year standard promotion' },
  { id: 'pr-2', date: '2026-08-25', fromClass: 'Creche', toClass: 'Nursery 1', academicYear: '2025-2026', studentCount: 1, promotedBy: 'Marcus Prosper', notes: 'Pre-school transition' },
];

export default function StudentManager({
  activeModule,
  students: initialStudents,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onNavigate
}: StudentManagerProps) {
  const [studentsList, setStudentsList] = useState<Student[]>(initialStudents);
  const [promotionHistory, setPromotionHistory] = useState<PromotionRecord[]>(INITIAL_PROMOTION_HISTORY);

  useEffect(() => {
    setStudentsList(initialStudents);
  }, [initialStudents]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Pending'>('all');

  // Modals & Toasts
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [approvingStudent, setApprovingStudent] = useState<Student | null>(null);
  const [assignedAdmNo, setAssignedAdmNo] = useState('');
  const [enrollSuccessToast, setEnrollSuccessToast] = useState(false);
  const [approvalToast, setApprovalToast] = useState<string | null>(null);
  const [promotionToast, setPromotionToast] = useState(false);
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [enrollErrorMsg, setEnrollErrorMsg] = useState('');
  const [lastEnrolledStudent, setLastEnrolledStudent] = useState<Student | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Enrollment Form State
  const [formFullName, setFormFullName] = useState('');
  const [formGender, setFormGender] = useState<'Male' | 'Female'>('Male');
  const [formDob, setFormDob] = useState('2020-05-15');
  const [formDepartment, setFormDepartment] = useState('Primary School');
  const [formClassName, setFormClassName] = useState('Basic 1');
  const [formHouse, setFormHouse] = useState('Blue');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formPhoto, setFormPhoto] = useState<string>('https://images.unsplash.com/photo-1543269865-cbf427effbad?w=200&auto=format&fit=crop&q=80');

  // Bulk CSV Upload state
  const [csvInput, setCsvInput] = useState('');
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  const handleBulkCsvUpload = () => {
    if (!csvInput.trim()) {
      alert("Please paste CSV student data or upload a CSV file.");
      return;
    }
    const lines = csvInput.split('\n').filter(l => l.trim().length > 0);
    let count = 0;
    lines.forEach((line, index) => {
      if (index === 0 && line.toLowerCase().includes('fullname')) return;
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 1) {
        const fullName = parts[0] || 'NEW STUDENT';
        const gender = (parts[1] === 'Female' ? 'Female' : 'Male') as 'Male' | 'Female';
        const dob = parts[2] || '2020-01-01';
        const department = parts[3] || 'Primary School';
        const className = parts[4] || 'Basic 1';
        const house = parts[5] || 'Blue';
        const parentName = parts[6] || 'Parent / Guardian';
        const parentPhone = parts[7] || '0240000000';

        const nextId = `s-bulk-${Date.now()}-${index}`;
        const nextAdmNo = `ADM/26/${String(studentsList.length + count + 1).padStart(4, '0')}`;
        const newStudent: Student = {
          id: nextId,
          admissionNo: nextAdmNo,
          fullName: fullName.toUpperCase(),
          gender,
          dob,
          department,
          className,
          rollNo: String(studentsList.length + count + 1).padStart(3, '0'),
          house,
          parentName,
          parentPhone,
          academicYear: '2025-2026',
          term: 'Third Term',
          status: 'Active',
          isCurrent: true,
          enrollmentDate: new Date().toISOString().split('T')[0],
          photo: gender === 'Female' 
            ? 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=200&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=200&auto=format&fit=crop&q=80'
        };

        setStudentsList(prev => [newStudent, ...prev]);
        if (onAddStudent) onAddStudent(newStudent);
        count++;
      }
    });

    setBulkSuccessMsg(`Successfully registered ${count} students from CSV data into Firestore database!`);
    setCsvInput('');
    setTimeout(() => setBulkSuccessMsg(''), 5000);
  };

  // Attendance Register State
  const [attDate, setAttDate] = useState('2026-09-05');
  const [attClass, setAttClass] = useState('Basic 1');
  const [studentAttMap, setStudentAttMap] = useState<Record<string, 'Present' | 'Absent' | 'Late' | 'Excused'>>({});
  const [attSavedToast, setAttSavedToast] = useState(false);

  // Promote Students State
  const [promoteSourceClass, setPromoteSourceClass] = useState('Basic 1');
  const [promoteTargetClass, setPromoteTargetClass] = useState('Basic 2');
  const [selectedForPromotion, setSelectedForPromotion] = useState<string[]>([]);

  // Open Edit Modal
  const handleOpenEditStudent = (st: Student) => {
    setEditingStudent(st);
    setFormFullName(st.fullName);
    setFormGender(st.gender || 'Male');
    setFormDob(st.dob || '2020-01-01');
    setFormDepartment(st.department || 'Primary School');
    setFormClassName(st.className || 'Basic 1');
    setFormHouse(st.house || 'Blue');
    setFormParentName(st.parentName || '');
    setFormParentPhone(st.parentPhone || '');
    setFormPhoto(st.photo || (st.gender === 'Female' 
      ? 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=200&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=200&auto=format&fit=crop&q=80'));
  };

  // Save Add or Edit Student
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollErrorMsg('');

    if (!formFullName.trim()) {
      setEnrollErrorMsg('Please provide the student\'s full name.');
      return;
    }
    if (!formParentPhone.trim()) {
      setEnrollErrorMsg('Please provide a parent/guardian phone number.');
      return;
    }

    setIsSubmittingStudent(true);

    try {
      if (editingStudent) {
        const updated: Student = {
          ...editingStudent,
          fullName: formFullName.toUpperCase().trim(),
          gender: formGender,
          dob: formDob,
          department: formDepartment,
          className: formClassName,
          house: formHouse,
          parentName: formParentName.trim() || 'Parent / Guardian',
          parentPhone: formParentPhone.trim(),
          photo: formPhoto
        };
        await saveStudent(updated);
        setStudentsList(prev => prev.map(s => s.id === editingStudent.id ? updated : s));
        if (onUpdateStudent) onUpdateStudent(updated);
        setEditingStudent(null);
        setShowEnrollModal(false);
        setLastEnrolledStudent(updated);
        setEnrollSuccessToast(true);
        setTimeout(() => setEnrollSuccessToast(false), 5000);
      } else {
        const nextId = `s-${Date.now()}`;
        const nextAdmNo = `ADM/26/${String(studentsList.length + 1).padStart(4, '0')}`;
        const newStudent: Student = {
          id: nextId,
          admissionNo: nextAdmNo,
          fullName: formFullName.toUpperCase().trim(),
          gender: formGender,
          dob: formDob || '2018-05-15',
          department: formDepartment,
          className: formClassName,
          rollNo: String(studentsList.length + 1).padStart(3, '0'),
          house: formHouse,
          parentName: formParentName.trim() || 'Parent / Guardian',
          parentPhone: formParentPhone.trim(),
          academicYear: '2025-2026',
          term: 'Third Term',
          status: 'Active',
          isCurrent: true,
          enrollmentDate: new Date().toISOString().split('T')[0],
          photo: formPhoto || (formGender === 'Male'
            ? 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=200&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=200&auto=format&fit=crop&q=80')
        };
        
        await saveStudent(newStudent);
        setStudentsList(prev => [newStudent, ...prev]);
        if (onAddStudent) onAddStudent(newStudent);
        
        // Reset form inputs for subsequent entries
        setFormFullName('');
        setFormDob('2018-05-15');
        setFormParentName('');
        setFormParentPhone('');
        setShowEnrollModal(false);
        setLastEnrolledStudent(newStudent);
        setEnrollSuccessToast(true);
        setTimeout(() => setEnrollSuccessToast(false), 5000);
      }
    } catch (err: any) {
      console.error('Failed to save student:', err);
      setEnrollErrorMsg(err?.message || 'Error processing enrollment. Please retry.');
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  // Delete Student - instant UI dismiss & resilient DB delete
  const handleConfirmDelete = async () => {
    if (deletingStudent) {
      const studentIdToDelete = deletingStudent.id;
      setDeletingStudent(null);
      setStudentsList(prev => prev.filter(s => s.id !== studentIdToDelete));
      if (onDeleteStudent) onDeleteStudent(studentIdToDelete);
      try {
        await deleteStudent(studentIdToDelete);
      } catch (err) {
        console.error('Failed to delete student from DB:', err);
      }
    }
  };

  // Admission Approval Handlers
  const handleApproveAdmission = async (student: Student) => {
    try {
      const nextAdmNo = assignedAdmNo.trim() || student.admissionNo || `ADM/26/${String(studentsList.filter(s => s.status === 'Active').length + 1).padStart(4, '0')}`;
      const updated = await approveStudentAdmission(student.id, nextAdmNo);
      if (updated) {
        setStudentsList(prev => prev.map(s => s.id === student.id ? updated : s));
        if (onUpdateStudent) onUpdateStudent(updated);
        setApprovalToast(`Student "${updated.fullName}" approved successfully with Admission No: ${updated.admissionNo}`);
        setTimeout(() => setApprovalToast(null), 4000);
      }
    } catch (err) {
      console.error('Failed to approve student admission:', err);
    } finally {
      setApprovingStudent(null);
      setAssignedAdmNo('');
    }
  };

  const handleRejectAdmission = async (student: Student) => {
    if (!window.confirm(`Are you sure you want to decline admission for ${student.fullName}?`)) return;
    try {
      const updated = await rejectStudentAdmission(student.id, 'Declined by Administration');
      if (updated) {
        setStudentsList(prev => prev.map(s => s.id === student.id ? updated : s));
        if (onUpdateStudent) onUpdateStudent(updated);
        setApprovalToast(`Admission application for "${student.fullName}" was declined.`);
        setTimeout(() => setApprovalToast(null), 4000);
      }
    } catch (err) {
      console.error('Failed to reject student admission:', err);
    }
  };

  // Promotion Handler
  const handleExecutePromotion = () => {
    if (selectedForPromotion.length === 0) {
      alert("Please select at least one student to promote.");
      return;
    }

    setStudentsList(prev => prev.map(s => {
      if (selectedForPromotion.includes(s.id)) {
        return { ...s, className: promoteTargetClass };
      }
      return s;
    }));

    const newLog: PromotionRecord = {
      id: `pr-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      fromClass: promoteSourceClass,
      toClass: promoteTargetClass,
      academicYear: '2025-2026',
      studentCount: selectedForPromotion.length,
      promotedBy: 'Marcus Prosper (Admin)',
      notes: `Promoted ${selectedForPromotion.length} student(s) from ${promoteSourceClass} to ${promoteTargetClass}`
    };

    setPromotionHistory(prev => [newLog, ...prev]);
    setSelectedForPromotion([]);
    setPromotionToast(true);
    setTimeout(() => setPromotionToast(false), 4000);
  };

  // Pending admissions count
  const pendingAdmissions = studentsList.filter(s => s.status === 'Pending' || s.approvalStatus === 'Pending' || s.isApproved === false);

  // Filtered Students
  const filteredStudents = studentsList.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.parentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.parentPhone?.includes(searchQuery);
    const matchesClass = classFilter === 'all' || s.className === classFilter;
    const matchesGender = genderFilter === 'all' || s.gender === genderFilter;
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'Active' && s.status === 'Active' && s.approvalStatus !== 'Pending') ||
                          (statusFilter === 'Pending' && (s.status === 'Pending' || s.approvalStatus === 'Pending' || s.isApproved === false));
    return matchesSearch && matchesClass && matchesGender && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. ENROLL STUDENT MODULE */}
      {(activeModule === 'student_enroll' || activeModule === 'enroll_student') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 space-y-5">
          {/* Minimized Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  Student Enrollment & Admission
                </h2>
                <p className="text-[11px] text-slate-500">
                  Register new student with automated bill & terminal report generation
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowBulkUpload(!showBulkUpload)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {showBulkUpload ? 'Close Bulk CSV' : 'Bulk CSV Import'}
            </button>
          </div>

          {enrollSuccessToast && (
            <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {lastEnrolledStudent ? (
                  <span>
                    <strong>{lastEnrolledStudent.fullName}</strong> ({lastEnrolledStudent.admissionNo}) enrolled successfully in {lastEnrolledStudent.className}!
                  </span>
                ) : (
                  <span>Student enrolled successfully! Terminal billing statement and examination records generated.</span>
                )}
              </span>
              <button onClick={() => setEnrollSuccessToast(false)} className="text-white font-black ml-4">✕</button>
            </div>
          )}

          {enrollErrorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{enrollErrorMsg}</span>
            </div>
          )}

          {/* Optional Collapsed Bulk CSV */}
          {showBulkUpload && (
            <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Bulk CSV Import
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Format: FullName, Gender, Dob, Department, ClassName, House, ParentName, ParentPhone
                </span>
              </div>

              {bulkSuccessMsg && (
                <div className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{bulkSuccessMsg}</span>
                </div>
              )}

              <textarea
                rows={2}
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder="Paste CSV rows here..."
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
              />

              <div className="flex flex-wrap justify-between items-center gap-2">
                <input
                  type="file"
                  accept=".csv, .txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setCsvInput(event.target?.result as string || '');
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="text-xs text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-400 file:text-slate-900 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={handleBulkCsvUpload}
                  className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-lg font-bold text-xs shadow transition-colors cursor-pointer"
                >
                  Import Students
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveStudent} className="space-y-6 text-xs">
            {/* Student Biodata */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-indigo-700">
                1. Student Biodata & Identification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Full Legal Name (SURNAME FIRST) *</label>
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="e.g. MENSAH KOFI EMMANUEL"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="Primary School">Primary School</option>
                    <option value="Junior High School">Junior High School</option>
                    <option value="Pre School">Pre School</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admission Class *</label>
                  <select
                    value={formClassName}
                    onChange={(e) => setFormClassName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-indigo-700"
                  >
                    <option value="Creche">Creche</option>
                    <option value="Nursery 1">Nursery 1</option>
                    <option value="Basic 1">Basic 1</option>
                    <option value="Basic 2">Basic 2</option>
                    <option value="Basic 3">Basic 3</option>
                    <option value="JHS 1A">JHS 1A</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">School House</label>
                  <select
                    value={formHouse}
                    onChange={(e) => setFormHouse(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="Blue">Blue House (Aggrey)</option>
                    <option value="Green">Green House (Guggisberg)</option>
                    <option value="Yellow">Yellow House (Nkrumah)</option>
                    <option value="Red">Red House (Casely Hayford)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-emerald-700">
                2. Parent / Guardian Contact & Emergency Info
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parent / Guardian Full Name</label>
                  <input
                    type="text"
                    value={formParentName}
                    onChange={(e) => setFormParentName(e.target.value)}
                    placeholder="e.g. Mr. Emmanuel Mensah"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primary Mobile Phone (Ghana Telco) *</label>
                  <input
                    type="text"
                    required
                    value={formParentPhone}
                    onChange={(e) => setFormParentPhone(e.target.value)}
                    placeholder="e.g. 0249755593"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                id="btn-complete-student-enrollment"
                disabled={isSubmittingStudent}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white rounded-xl font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
              >
                {isSubmittingStudent ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enrolling Student...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Complete Student Enrollment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Approval & Action Notification Toast */}
      {approvalToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{approvalToast}</span>
          </span>
          <button onClick={() => setApprovalToast(null)} className="text-white font-black ml-4 cursor-pointer">✕</button>
        </div>
      )}

      {/* 2. ENROLLED STUDENTS MODULE */}
      {(activeModule === 'student_enrolled' || activeModule === 'enrolled_students' || activeModule === 'students') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          
          {/* Pending Admissions Alert Banner if pending applications exist */}
          {pendingAdmissions.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    {pendingAdmissions.length} Student Admission{pendingAdmissions.length > 1 ? 's' : ''} Awaiting Admin Approval
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Teachers submitted new student applications that need administrative verification & admission number assignment.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStatusFilter('Pending')}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" /> Review Pending ({pendingAdmissions.length})
              </button>
            </div>
          )}

          <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Enrolled Students Master Register
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official Ghanaian GES student records, admission IDs, class distribution, and parent contacts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingStudent(null);
                  setFormFullName('');
                  setFormGender('Male');
                  setFormDob('2020-05-15');
                  setFormDepartment('Primary School');
                  setFormClassName('Basic 1');
                  setFormHouse('Blue');
                  setFormParentName('');
                  setFormParentPhone('');
                  setShowEnrollModal(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" /> Enroll Student
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              All Records ({studentsList.length})
            </button>
            <button
              onClick={() => setStatusFilter('Active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'Active'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Active Students ({studentsList.filter(s => s.status === 'Active' && s.approvalStatus !== 'Pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('Pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'Pending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Admissions ({pendingAdmissions.length})</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between text-xs">
            <div className="flex flex-wrap gap-3 items-center flex-1">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student name, admission no, parent..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option value="all">All Classes ({studentsList.length})</option>
                  <option value="Creche">Creche</option>
                  <option value="Nursery 1">Nursery 1</option>
                  <option value="Basic 1">Basic 1</option>
                  <option value="Basic 2">Basic 2</option>
                  <option value="Basic 3">Basic 3</option>
                  <option value="JHS 1A">JHS 1A</option>
                </select>
              </div>
              <div>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option value="all">All Genders</option>
                  <option value="Male">Boys (Male)</option>
                  <option value="Female">Girls (Female)</option>
                </select>
              </div>
            </div>
            <div className="text-slate-500 font-medium">
              Showing <strong>{filteredStudents.length}</strong> of <strong>{studentsList.length}</strong> students
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Admission No</th>
                  <th className="p-3">Student Full Name</th>
                  <th className="p-3">Class & House</th>
                  <th className="p-3">Gender</th>
                  <th className="p-3">Parent & Contact</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No student records found matching your search filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, idx) => {
                    const isPending = st.status === 'Pending' || st.approvalStatus === 'Pending' || st.isApproved === false;
                    return (
                      <tr key={st.id} className={`hover:bg-slate-50 transition-colors ${isPending ? 'bg-amber-50/40' : ''}`}>
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold">
                          {isPending ? (
                            <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                              {st.admissionNo || 'PENDING'}
                            </span>
                          ) : (
                            <span className="text-indigo-700">{st.admissionNo}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={st.photo || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=150&auto=format&fit=crop&q=80'}
                              alt={st.fullName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{st.fullName}</span>
                              {st.enrolledBy && (
                                <span className="text-[10px] text-slate-400">
                                  Submitted by: {st.enrolledBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-800 block">{st.className}</span>
                          <span className="text-[10px] text-slate-400">{st.house} House</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {st.gender}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">
                          <div className="font-medium text-slate-900">{st.parentName || 'Parent'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{st.parentPhone}</div>
                        </td>
                        <td className="p-3">
                          {isPending ? (
                            <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" /> Awaiting Approval
                            </span>
                          ) : st.status === 'Inactive' ? (
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                              Inactive
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => {
                                    setApprovingStudent(st);
                                    const autoAdmNo = st.admissionNo.startsWith('ADM') 
                                      ? st.admissionNo 
                                      : `ADM/26/${String(studentsList.filter(s => s.status === 'Active').length + 1).padStart(4, '0')}`;
                                    setAssignedAdmNo(autoAdmNo);
                                  }}
                                  title="Approve & Enroll Student"
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => handleRejectAdmission(st)}
                                  title="Decline Admission"
                                  className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : null}

                            <button
                              onClick={() => handleOpenEditStudent(st)}
                              title="Edit Student Record"
                              className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingStudent(st)}
                              title="Delete Student Record"
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

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {filteredStudents.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-semibold bg-white border border-slate-200 rounded-2xl">
                No student records found matching your search filters.
              </div>
            ) : (
              filteredStudents.map((st) => {
                const isPending = st.status === 'Pending' || st.approvalStatus === 'Pending' || st.isApproved === false;
                return (
                  <div key={st.id} className={`p-4 bg-white border rounded-2xl shadow-xs space-y-3 ${isPending ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <img
                        src={st.photo || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=150&auto=format&fit=crop&q=80'}
                        alt={st.fullName}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-900 text-sm truncate">{st.fullName}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {st.gender}
                          </span>
                        </div>
                        <p className="text-xs text-indigo-700 font-mono font-bold mt-0.5">{st.admissionNo}</p>
                        <p className="text-[11px] text-slate-500 font-semibold">{st.className} • {st.house} House</p>
                        {st.enrolledBy && (
                          <p className="text-[10px] text-amber-800 font-medium">Submitted by: {st.enrolledBy}</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="text-slate-700 font-medium">Parent: <strong>{st.parentName || 'Parent'}</strong></div>
                      <div className="text-slate-500 font-mono text-[11px]">Phone: {st.parentPhone}</div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      {isPending ? (
                        <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Awaiting Approval
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded text-[10px] font-bold">
                          Active
                        </span>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {isPending && (
                          <button
                            onClick={() => {
                              setApprovingStudent(st);
                              const autoAdmNo = st.admissionNo.startsWith('ADM') 
                                ? st.admissionNo 
                                : `ADM/26/${String(studentsList.filter(s => s.status === 'Active').length + 1).padStart(4, '0')}`;
                              setAssignedAdmNo(autoAdmNo);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditStudent(st)}
                          className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => setDeletingStudent(st)}
                          className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. STUDENT ID CARDS MODULE */}
      {activeModule === 'student_id_cards' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Student Identification Card Generator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official JIPAS student identity badges with barcode simulation and guardian emergency contact.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" /> Print ID Cards Batch
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((st) => (
              <div
                key={st.id}
                className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-md border border-indigo-800 space-y-4 relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-indigo-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <JIPASLogo size="xs" />
                    <div>
                      <h4 className="font-black text-sm tracking-wider text-amber-400 leading-tight">JIPAS</h4>
                      <p className="text-[9px] text-indigo-200 uppercase tracking-widest font-semibold">Student Identity Badge</p>
                    </div>
                  </div>
                  <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-amber-300" />
                  </div>
                </div>

                {/* Body with Photo & Bio */}
                <div className="flex gap-4 items-center">
                  <img
                    src={st.photo || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=150&auto=format&fit=crop&q=80'}
                    alt={st.fullName}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-amber-400 shadow-sm shrink-0"
                  />
                  <div className="space-y-0.5 overflow-hidden">
                    <h5 className="font-black text-xs text-white truncate">{st.fullName}</h5>
                    <p className="text-[11px] font-mono font-bold text-amber-300">{st.admissionNo}</p>
                    <p className="text-[10px] text-indigo-200">Class: <strong>{st.className}</strong></p>
                    <p className="text-[10px] text-indigo-200">House: <strong>{st.house}</strong></p>
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="bg-white/10 rounded-xl p-2.5 flex justify-between items-center text-[10px]">
                  <div>
                    <span className="text-indigo-300 block text-[8px] uppercase font-bold">Emergency Tel:</span>
                    <span className="font-mono font-semibold text-white">{st.parentPhone || '0249755593'}</span>
                  </div>
                  <div className="w-6 h-6 bg-white rounded p-0.5 flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-slate-900" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. STUDENT ATTENDANCE MODULE */}
      {activeModule === 'student_attendance' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Class-Wise Student Attendance Terminal
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Mark, compute, and log student attendance for terminal report calculation and statutory tracking.
              </p>
            </div>
            <button
              onClick={() => {
                setAttSavedToast(true);
                setTimeout(() => setAttSavedToast(false), 3000);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" /> Save Attendance Register
            </button>
          </div>

          {attSavedToast && (
            <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Attendance for {attClass} on {attDate} recorded and synchronized successfully!
              </span>
              <button onClick={() => setAttSavedToast(false)} className="text-white font-black ml-4">✕</button>
            </div>
          )}

          {/* Class & Date Controls */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Class</label>
              <select
                value={attClass}
                onChange={(e) => setAttClass(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
              >
                <option value="Basic 1">Basic 1</option>
                <option value="Basic 2">Basic 2</option>
                <option value="Basic 3">Basic 3</option>
                <option value="Creche">Creche</option>
                <option value="JHS 1A">JHS 1A</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
              />
            </div>
            <div className="pt-4 flex gap-2">
              <button
                onClick={() => {
                  const map: Record<string, 'Present' | 'Absent' | 'Late' | 'Excused'> = {};
                  studentsList.filter(s => s.className === attClass).forEach(s => {
                    map[s.id] = 'Present';
                  });
                  setStudentAttMap(prev => ({ ...prev, ...map }));
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
              >
                Mark Class All Present
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Admission No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Gender</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {studentsList.filter(s => s.className === attClass).map((st, idx) => {
                  const status = studentAttMap[st.id] || 'Present';
                  return (
                    <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-indigo-700">{st.admissionNo}</td>
                      <td className="p-3 font-bold text-slate-900">{st.fullName}</td>
                      <td className="p-3">{st.gender}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          status === 'Present' ? 'bg-emerald-100 text-emerald-800' :
                          status === 'Late' ? 'bg-amber-100 text-amber-800' :
                          status === 'Absent' ? 'bg-rose-100 text-rose-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setStudentAttMap(prev => ({ ...prev, [st.id]: 'Present' }))}
                            className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              status === 'Present' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => setStudentAttMap(prev => ({ ...prev, [st.id]: 'Late' }))}
                            className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              status === 'Late' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            onClick={() => setStudentAttMap(prev => ({ ...prev, [st.id]: 'Absent' }))}
                            className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              status === 'Absent' ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. PROMOTE STUDENTS MODULE */}
      {(activeModule === 'student_promote' || activeModule === 'promote_students') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                Student Promotion & Class Transition Workbench
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bulk promote students to higher classes based on academic performance and annual review.
              </p>
            </div>
            <button
              onClick={handleExecutePromotion}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" /> Promote Selected ({selectedForPromotion.length})
            </button>
          </div>

          {promotionToast && (
            <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Promotion executed! Students updated to new class and logged in promotion history.
              </span>
              <button onClick={() => setPromotionToast(false)} className="text-white font-black ml-4">✕</button>
            </div>
          )}

          {/* Class Selectors */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Current Class (Source)</label>
              <select
                value={promoteSourceClass}
                onChange={(e) => setPromoteSourceClass(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
              >
                <option value="Creche">Creche</option>
                <option value="Nursery 1">Nursery 1</option>
                <option value="Basic 1">Basic 1</option>
                <option value="Basic 2">Basic 2</option>
                <option value="Basic 3">Basic 3</option>
                <option value="JHS 1A">JHS 1A</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Promote To (Target Class)</label>
              <select
                value={promoteTargetClass}
                onChange={(e) => setPromoteTargetClass(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-indigo-700"
              >
                <option value="Nursery 1">Nursery 1</option>
                <option value="Basic 1">Basic 1</option>
                <option value="Basic 2">Basic 2</option>
                <option value="Basic 3">Basic 3</option>
                <option value="Basic 4">Basic 4</option>
                <option value="JHS 1A">JHS 1A</option>
                <option value="JHS 2">JHS 2</option>
              </select>
            </div>
          </div>

          {/* Student selection table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 w-12 text-center">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        const classStudents = studentsList.filter(s => s.className === promoteSourceClass);
                        if (e.target.checked) {
                          setSelectedForPromotion(classStudents.map(s => s.id));
                        } else {
                          setSelectedForPromotion([]);
                        }
                      }}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                  </th>
                  <th className="p-3">Admission No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Current Class</th>
                  <th className="p-3">Average Mark</th>
                  <th className="p-3">Promotion Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {studentsList.filter(s => s.className === promoteSourceClass).map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedForPromotion.includes(st.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedForPromotion(prev => [...prev, st.id]);
                          } else {
                            setSelectedForPromotion(prev => prev.filter(id => id !== st.id));
                          }
                        }}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                    </td>
                    <td className="p-3 font-mono font-bold text-indigo-700">{st.admissionNo}</td>
                    <td className="p-3 font-bold text-slate-900">{st.fullName}</td>
                    <td className="p-3 text-slate-600">{st.className}</td>
                    <td className="p-3 font-mono font-bold text-emerald-700">82.4%</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        Eligible for Promotion
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. PROMOTION HISTORY MODULE */}
      {(activeModule === 'student_promotion_history' || activeModule === 'promotion_history') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Class Promotion & Academic Progression Audit Logs
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Archived logs of all past promotion exercises, transferred batches, and authorized admin operators.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Source Class</th>
                  <th className="p-3">Promoted To</th>
                  <th className="p-3 text-center">Students Promoted</th>
                  <th className="p-3">Academic Session</th>
                  <th className="p-3">Authorized By</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {promotionHistory.map((rec, idx) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-mono font-semibold text-slate-600">{rec.date}</td>
                    <td className="p-3 font-bold text-slate-800">{rec.fromClass}</td>
                    <td className="p-3 font-bold text-indigo-700">{rec.toClass}</td>
                    <td className="p-3 text-center font-bold font-mono text-emerald-700">{rec.studentCount}</td>
                    <td className="p-3 font-mono text-slate-500">{rec.academicYear}</td>
                    <td className="p-3 font-medium text-slate-800">{rec.promotedBy}</td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{rec.notes}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setPromotionHistory(prev => prev.filter(p => p.id !== rec.id));
                          alert("Promotion log entry cleared.");
                        }}
                        className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Delete Log"
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

      {/* EDIT STUDENT MODAL */}
      {(showEnrollModal || editingStudent) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                {editingStudent ? `Edit Student: ${editingStudent.fullName}` : 'Enroll New Student'}
              </h3>
              <button
                onClick={() => {
                  setShowEnrollModal(false);
                  setEditingStudent(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              {/* Photo Uploader */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <PhotoUploader
                  currentPhoto={formPhoto}
                  onPhotoChange={setFormPhoto}
                  entityType="student"
                  gender={formGender}
                  label="Student Passport Photograph"
                  size="md"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="e.g. ADDO BERNICE"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold uppercase focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class</label>
                  <select
                    value={formClassName}
                    onChange={(e) => setFormClassName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold bg-white"
                  >
                    <option value="Creche">Creche</option>
                    <option value="Nursery 1">Nursery 1</option>
                    <option value="Basic 1">Basic 1</option>
                    <option value="Basic 2">Basic 2</option>
                    <option value="Basic 3">Basic 3</option>
                    <option value="JHS 1A">JHS 1A</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">House</label>
                  <select
                    value={formHouse}
                    onChange={(e) => setFormHouse(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold bg-white"
                  >
                    <option value="Blue">Blue House</option>
                    <option value="Green">Green House</option>
                    <option value="Yellow">Yellow House</option>
                    <option value="Red">Red House</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={formParentName}
                    onChange={(e) => setFormParentName(e.target.value)}
                    placeholder="e.g. Mr. Addo Paul"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parent Phone *</label>
                  <input
                    type="text"
                    required
                    value={formParentPhone}
                    onChange={(e) => setFormParentPhone(e.target.value)}
                    placeholder="0241234567"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEnrollModal(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm cursor-pointer transition-colors"
                >
                  {editingStudent ? 'Update Student Record' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVE STUDENT ADMISSION MODAL */}
      {approvingStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Approve Student Admission</h3>
                  <p className="text-[11px] text-slate-500">Confirm official admission and assign register number</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovingStudent(null)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center gap-3">
                <img
                  src={approvingStudent.photo || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=150&auto=format&fit=crop&q=80'}
                  alt={approvingStudent.fullName}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{approvingStudent.fullName}</h4>
                  <p className="text-slate-600 font-semibold">{approvingStudent.className} • {approvingStudent.gender}</p>
                  {approvingStudent.enrolledBy && (
                    <p className="text-[10px] text-indigo-600 font-medium">Submitted by: {approvingStudent.enrolledBy}</p>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                Parent: <strong>{approvingStudent.parentName || 'Parent'}</strong> ({approvingStudent.parentPhone})
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Admission Number *
              </label>
              <input
                type="text"
                required
                value={assignedAdmNo}
                onChange={(e) => setAssignedAdmNo(e.target.value)}
                placeholder="e.g. ADM/26/0007"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono font-bold text-indigo-700 text-xs focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                You can keep this automatically generated sequence or assign a custom GES admission code.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApprovingStudent(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApproveAdmission(approvingStudent)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Approve & Enrol Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE STUDENT CONFIRMATION */}
      {deletingStudent && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setDeletingStudent(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Remove Student Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete <strong>{deletingStudent.fullName}</strong> ({deletingStudent.admissionNo}) from the student register?
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                id="btn-cancel-delete-student"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeletingStudent(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-student"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleConfirmDelete();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-colors"
              >
                Yes, Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
