import React, { useState } from 'react';
import { 
  AcademicYearItem, TermItem, DepartmentItem, ClassItem, HouseItem, SubjectItem, Student, Teacher, CourseItem 
} from '../types';
import { 
  Plus, Edit2, Trash2, CheckCircle, Search, Filter, Calendar, BookOpen, 
  Building2, School, Shield, Check, X, Sliders, AlertTriangle, Users, 
  ChevronRight, ArrowRight, Sparkles, Award, GraduationCap, Layers
} from 'lucide-react';
import { deleteAcademicYear, deleteTerm, deleteDepartment, deleteClass, deleteHouse, deleteSubject, deleteCourse } from '../services/dbService';
import { INITIAL_SHS_COURSES } from '../data/setupData';

interface AcademicSetupManagerProps {
  activeModule: string;
  onNavigate?: (module: string) => void;
  students: Student[];
  teachers: Teacher[];
  academicYears: AcademicYearItem[];
  onUpdateAcademicYears: (years: AcademicYearItem[]) => void;
  terms: TermItem[];
  onUpdateTerms: (terms: TermItem[]) => void;
  departments: DepartmentItem[];
  onUpdateDepartments: (departments: DepartmentItem[]) => void;
  courses?: CourseItem[];
  onUpdateCourses?: (courses: CourseItem[]) => void;
  classes: ClassItem[];
  onUpdateClasses: (classes: ClassItem[]) => void;
  houses: HouseItem[];
  onUpdateHouses: (houses: HouseItem[]) => void;
  subjects: SubjectItem[];
  onUpdateSubjects: (subjects: SubjectItem[]) => void;
}

export default function AcademicSetupManager({
  activeModule,
  onNavigate,
  students,
  teachers,
  academicYears,
  onUpdateAcademicYears,
  terms,
  onUpdateTerms,
  departments,
  onUpdateDepartments,
  courses = INITIAL_SHS_COURSES,
  onUpdateCourses,
  classes,
  onUpdateClasses,
  houses,
  onUpdateHouses,
  subjects,
  onUpdateSubjects
}: AcademicSetupManagerProps) {
  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ==========================================
  // 1. ACADEMIC YEARS STATE & MODALS
  // ==========================================
  const [aySearch, setAySearch] = useState('');
  const [showAyModal, setShowAyModal] = useState(false);
  const [editingAy, setEditingAy] = useState<AcademicYearItem | null>(null);
  const [ayFormName, setAyFormName] = useState('');
  const [ayFormStartDate, setAyFormStartDate] = useState('');
  const [ayFormEndDate, setAyFormEndDate] = useState('');
  const [ayFormStatus, setAyFormStatus] = useState<'Current' | 'Active' | 'Upcoming' | 'Completed'>('Upcoming');

  const openAddAyModal = () => {
    setEditingAy(null);
    setAyFormName('');
    setAyFormStartDate('');
    setAyFormEndDate('');
    setAyFormStatus('Upcoming');
    setShowAyModal(true);
  };

  const openEditAyModal = (ay: AcademicYearItem) => {
    setEditingAy(ay);
    setAyFormName(ay.name);
    setAyFormStartDate(ay.startDate);
    setAyFormEndDate(ay.endDate);
    setAyFormStatus(ay.status);
    setShowAyModal(true);
  };

  const handleSaveAy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ayFormName || !ayFormStartDate || !ayFormEndDate) {
      showToast('Please fill in all required academic year fields.');
      return;
    }

    if (editingAy) {
      const updated = academicYears.map(item => {
        if (item.id === editingAy.id) {
          return {
            ...item,
            name: ayFormName,
            startDate: ayFormStartDate,
            endDate: ayFormEndDate,
            status: ayFormStatus
          };
        }
        // If user set this year as current, change other current to Active
        if (ayFormStatus === 'Current' && item.status === 'Current') {
          return { ...item, status: 'Active' as const };
        }
        return item;
      });
      onUpdateAcademicYears(updated);
      showToast(`Academic Year ${ayFormName} updated successfully.`);
    } else {
      const newAy: AcademicYearItem = {
        id: `ay-${Date.now()}`,
        name: ayFormName,
        startDate: ayFormStartDate,
        endDate: ayFormEndDate,
        status: ayFormStatus,
        hasRecords: false
      };
      let list = [...academicYears];
      if (ayFormStatus === 'Current') {
        list = list.map(a => a.status === 'Current' ? { ...a, status: 'Active' as const } : a);
      }
      onUpdateAcademicYears([newAy, ...list]);
      showToast(`Academic Year ${ayFormName} created successfully.`);
    }
    setShowAyModal(false);
  };

  const handleSetCurrentAy = (id: string) => {
    const updated = academicYears.map(ay => {
      if (ay.id === id) return { ...ay, status: 'Current' as const };
      if (ay.status === 'Current') return { ...ay, status: 'Active' as const };
      return ay;
    });
    onUpdateAcademicYears(updated);
    showToast('Current Academic Year updated.');
  };

  const handleDeleteAy = async (id: string, name: string) => {
    const item = academicYears.find(a => a.id === id);
    if (item?.status === 'Current') {
      showToast('Cannot delete the active Current Academic Year.');
      return;
    }
    if (confirm(`Are you sure you want to delete Academic Year "${name}"?`)) {
      onUpdateAcademicYears(academicYears.filter(a => a.id !== id));
      showToast(`Academic Year ${name} deleted.`);
      try { await deleteAcademicYear(id); } catch(e) { console.error(e); }
    }
  };

  const filteredAy = academicYears.filter(a => a.name.toLowerCase().includes(aySearch.toLowerCase()));
  const currentAy = academicYears.find(a => a.status === 'Current') || academicYears[0];

  // ==========================================
  // 2. TERMS STATE & MODALS
  // ==========================================
  const [selectedAyForTerms, setSelectedAyForTerms] = useState<string>(currentAy?.name || '2025-2026');
  const [termSearch, setTermSearch] = useState('');
  const [showTermModal, setShowTermModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<TermItem | null>(null);
  const [termFormName, setTermFormName] = useState('First Term');
  const [termFormStartDate, setTermFormStartDate] = useState('');
  const [termFormEndDate, setTermFormEndDate] = useState('');
  const [termFormDaysOpen, setTermFormDaysOpen] = useState(60);
  const [termFormNextDate, setTermFormNextDate] = useState('');
  const [termFormHolidays, setTermFormHolidays] = useState(2);
  const [termFormStatus, setTermFormStatus] = useState<'Current' | 'Completed' | 'Upcoming'>('Upcoming');
  const [showParametersConfig, setShowParametersConfig] = useState(false);

  // Term parameters state
  const [assessmentClassRatio, setAssessmentClassRatio] = useState(40);
  const [assessmentExamRatio, setAssessmentExamRatio] = useState(60);
  const [passingMark, setPassingMark] = useState(50);
  const [allowStudentReportDownload, setAllowStudentReportDownload] = useState(true);

  const openAddTermModal = () => {
    setEditingTerm(null);
    setTermFormName('First Term');
    setTermFormStartDate('');
    setTermFormEndDate('');
    setTermFormDaysOpen(60);
    setTermFormNextDate('');
    setTermFormHolidays(2);
    setTermFormStatus('Upcoming');
    setShowTermModal(true);
  };

  const openEditTermModal = (term: TermItem) => {
    setEditingTerm(term);
    setTermFormName(term.name);
    setTermFormStartDate(term.startDate);
    setTermFormEndDate(term.endDate);
    setTermFormDaysOpen(term.daysOpen);
    setTermFormNextDate(term.nextTermDate);
    setTermFormHolidays(term.holidays);
    setTermFormStatus(term.status);
    setShowTermModal(true);
  };

  const handleSaveTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termFormName || !termFormStartDate || !termFormEndDate) {
      showToast('Please fill in required term fields.');
      return;
    }

    if (editingTerm) {
      const updated = terms.map(item => {
        if (item.id === editingTerm.id) {
          return {
            ...item,
            name: termFormName,
            startDate: termFormStartDate,
            endDate: termFormEndDate,
            daysOpen: Number(termFormDaysOpen),
            nextTermDate: termFormNextDate,
            holidays: Number(termFormHolidays),
            status: termFormStatus
          };
        }
        if (termFormStatus === 'Current' && item.academicYear === selectedAyForTerms && item.status === 'Current') {
          return { ...item, status: 'Completed' as const };
        }
        return item;
      });
      onUpdateTerms(updated);
      showToast(`Term "${termFormName}" updated.`);
    } else {
      const newTerm: TermItem = {
        id: `term-${Date.now()}`,
        academicYear: selectedAyForTerms,
        name: termFormName,
        startDate: termFormStartDate,
        endDate: termFormEndDate,
        daysOpen: Number(termFormDaysOpen),
        nextTermDate: termFormNextDate,
        holidays: Number(termFormHolidays),
        status: termFormStatus
      };
      let list = [...terms];
      if (termFormStatus === 'Current') {
        list = list.map(t => (t.academicYear === selectedAyForTerms && t.status === 'Current') ? { ...t, status: 'Completed' as const } : t);
      }
      onUpdateTerms([...list, newTerm]);
      showToast(`Term "${termFormName}" added to ${selectedAyForTerms}.`);
    }
    setShowTermModal(false);
  };

  const handleSetCurrentTerm = (id: string) => {
    const term = terms.find(t => t.id === id);
    if (!term) return;
    const updated = terms.map(t => {
      if (t.id === id) return { ...t, status: 'Current' as const };
      if (t.academicYear === term.academicYear && t.status === 'Current') {
        return { ...t, status: 'Completed' as const };
      }
      return t;
    });
    onUpdateTerms(updated);
    showToast(`"${term.name}" is now the Current Term.`);
  };

  const handleDeleteTerm = async (id: string, name: string) => {
    if (confirm(`Delete ${name}?`)) {
      onUpdateTerms(terms.filter(t => t.id !== id));
      showToast(`Term ${name} deleted.`);
      try { await deleteTerm(id); } catch(e) { console.error(e); }
    }
  };

  const filteredTerms = terms
    .filter(t => t.academicYear === selectedAyForTerms)
    .filter(t => t.name.toLowerCase().includes(termSearch.toLowerCase()));

  // ==========================================
  // 3. DEPARTMENTS STATE & MODALS
  // ==========================================
  const [deptSearch, setDeptSearch] = useState('');
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [deptFormName, setDeptFormName] = useState('');
  const [deptFormCode, setDeptFormCode] = useState('');
  const [deptFormHOD, setDeptFormHOD] = useState('');
  const [deptFormDesc, setDeptFormDesc] = useState('');

  const openAddDeptModal = () => {
    setEditingDept(null);
    setDeptFormName('');
    setDeptFormCode('');
    setDeptFormHOD('');
    setDeptFormDesc('');
    setShowDeptModal(true);
  };

  const openEditDeptModal = (dept: DepartmentItem) => {
    setEditingDept(dept);
    setDeptFormName(dept.name);
    setDeptFormCode(dept.code || '');
    setDeptFormHOD(dept.headOfDept || '');
    setDeptFormDesc(dept.description);
    setShowDeptModal(true);
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptFormName) {
      showToast('Department name is required.');
      return;
    }

    if (editingDept) {
      const updated = departments.map(d => d.id === editingDept.id ? {
        ...d,
        name: deptFormName,
        code: deptFormCode,
        headOfDept: deptFormHOD,
        description: deptFormDesc
      } : d);
      onUpdateDepartments(updated);
      showToast(`Department "${deptFormName}" updated.`);
    } else {
      const newDept: DepartmentItem = {
        id: `dept-${Date.now()}`,
        name: deptFormName,
        code: deptFormCode || deptFormName.substring(0, 3).toUpperCase(),
        headOfDept: deptFormHOD,
        description: deptFormDesc || '--'
      };
      onUpdateDepartments([...departments, newDept]);
      showToast(`Department "${deptFormName}" created.`);
    }
    setShowDeptModal(false);
  };

  const handleDeleteDept = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete Department "${name}"?`)) {
      onUpdateDepartments(departments.filter(d => d.id !== id));
      showToast(`Department ${name} removed.`);
      try { await deleteDepartment(id); } catch(e) { console.error(e); }
    }
  };

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) || 
    (d.code && d.code.toLowerCase().includes(deptSearch.toLowerCase()))
  );

  // ==========================================
  // 3B. SHS COURSES & PROGRAMMES STATE & MODALS
  // ==========================================
  const [courseSearch, setCourseSearch] = useState('');
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [courseFormName, setCourseFormName] = useState('');
  const [courseFormCode, setCourseFormCode] = useState('');
  const [courseFormDept, setCourseFormDept] = useState('Senior High School');
  const [courseFormHod, setCourseFormHod] = useState('');
  const [courseFormDesc, setCourseFormDesc] = useState('');
  const [courseFormElectives, setCourseFormElectives] = useState('');

  const openAddCourseModal = () => {
    setEditingCourse(null);
    setCourseFormName('');
    setCourseFormCode('');
    setCourseFormDept('Senior High School');
    setCourseFormHod('');
    setCourseFormDesc('');
    setCourseFormElectives('');
    setShowCourseModal(true);
  };

  const openEditCourseModal = (course: CourseItem) => {
    setEditingCourse(course);
    setCourseFormName(course.name);
    setCourseFormCode(course.code);
    setCourseFormDept(course.department);
    setCourseFormHod(course.headOfProgramme || '');
    setCourseFormDesc(course.description || '');
    setCourseFormElectives(course.electiveSubjects ? course.electiveSubjects.join(', ') : '');
    setShowCourseModal(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseFormName.trim()) {
      showToast('Course name is required.');
      return;
    }

    const electivesArray = courseFormElectives
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const generatedCode = courseFormCode.trim() || courseFormName.substring(0, 3).toUpperCase();

    if (editingCourse) {
      const oldCourseName = editingCourse.name;
      const updatedCourses = courses.map(c => c.id === editingCourse.id ? {
        ...c,
        name: courseFormName.trim(),
        code: generatedCode,
        department: courseFormDept,
        headOfProgramme: courseFormHod.trim(),
        description: courseFormDesc.trim(),
        electiveSubjects: electivesArray,
        levels: ['1', '2', '3'] as ('1' | '2' | '3')[]
      } : c);

      if (onUpdateCourses) {
        onUpdateCourses(updatedCourses);
      }

      // Update associated classes if course name changed
      if (oldCourseName !== courseFormName.trim()) {
        const updatedClasses = classes.map(cls => {
          if (cls.course === oldCourseName || cls.name.startsWith(oldCourseName)) {
            const levelPart = cls.level || cls.name.replace(oldCourseName, '').trim() || '1';
            return {
              ...cls,
              name: `${courseFormName.trim()} ${levelPart}`,
              course: courseFormName.trim(),
              level: levelPart
            };
          }
          return cls;
        });
        onUpdateClasses(updatedClasses);
      }

      showToast(`SHS Course "${courseFormName}" updated.`);
    } else {
      const newCourse: CourseItem = {
        id: `course-${Date.now()}`,
        name: courseFormName.trim(),
        code: generatedCode,
        department: courseFormDept,
        headOfProgramme: courseFormHod.trim(),
        description: courseFormDesc.trim(),
        levels: ['1', '2', '3'],
        electiveSubjects: electivesArray
      };

      const updatedCourses = [...courses, newCourse];
      if (onUpdateCourses) {
        onUpdateCourses(updatedCourses);
      }

      // Automatically generate the 3 levels (classes: Course 1, Course 2, Course 3) for SHS
      const levels: ('1' | '2' | '3')[] = ['1', '2', '3'];
      const newClassesToAdd: ClassItem[] = [];
      levels.forEach(lvl => {
        const streamName = `${courseFormName.trim()} ${lvl}`;
        if (!classes.some(c => c.name.toLowerCase() === streamName.toLowerCase())) {
          newClassesToAdd.push({
            id: `cls-shs-${generatedCode.toLowerCase()}-${lvl}-${Date.now()}`,
            name: streamName,
            department: courseFormDept || 'Senior High School',
            course: courseFormName.trim(),
            level: lvl,
            classTeacher: courseFormHod.trim() || 'Unassigned',
            roomNumber: `SHS Room ${generatedCode}-${lvl}`,
            capacity: 45,
            status: 'Active'
          });
        }
      });

      if (newClassesToAdd.length > 0) {
        onUpdateClasses([...classes, ...newClassesToAdd]);
      }

      showToast(`SHS Course "${courseFormName}" created with Levels 1, 2, & 3 classes.`);
    }

    setShowCourseModal(false);
  };

  const handleDeleteCourse = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete SHS Course "${name}"?`)) {
      const updated = courses.filter(c => c.id !== id);
      if (onUpdateCourses) {
        onUpdateCourses(updated);
      }
      showToast(`Course "${name}" removed.`);
      try { await deleteCourse(id); } catch(e) { console.error(e); }
    }
  };

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
    (c.headOfProgramme && c.headOfProgramme.toLowerCase().includes(courseSearch.toLowerCase()))
  );

  // ==========================================
  // 4. CLASSES STATE & MODALS
  // ==========================================
  const [classSearch, setClassSearch] = useState('');
  const [classFilterDept, setClassFilterDept] = useState('All');
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [classFormName, setClassFormName] = useState('');
  const [classFormDept, setClassFormDept] = useState(departments[0]?.name || 'Primary School');
  const [classFormTeacher, setClassFormTeacher] = useState('');
  const [classFormRoom, setClassFormRoom] = useState('');
  const [classFormCapacity, setClassFormCapacity] = useState(35);
  const [classFormStatus, setClassFormStatus] = useState<'Active' | 'Inactive'>('Active');

  const openAddClassModal = () => {
    setEditingClass(null);
    setClassFormName('');
    setClassFormDept(departments[0]?.name || 'Primary School');
    setClassFormTeacher('');
    setClassFormRoom('');
    setClassFormCapacity(35);
    setClassFormStatus('Active');
    setShowClassModal(true);
  };

  const openEditClassModal = (cls: ClassItem) => {
    setEditingClass(cls);
    setClassFormName(cls.name);
    setClassFormDept(cls.department);
    setClassFormTeacher(cls.classTeacher);
    setClassFormRoom(cls.roomNumber);
    setClassFormCapacity(cls.capacity);
    setClassFormStatus(cls.status);
    setShowClassModal(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classFormName) {
      showToast('Class name is required.');
      return;
    }

    if (editingClass) {
      const updated = classes.map(c => c.id === editingClass.id ? {
        ...c,
        name: classFormName,
        department: classFormDept,
        classTeacher: classFormTeacher || 'Unassigned',
        roomNumber: classFormRoom || '--',
        capacity: Number(classFormCapacity),
        status: classFormStatus
      } : c);
      onUpdateClasses(updated);
      showToast(`Class "${classFormName}" updated.`);
    } else {
      const newClassItem: ClassItem = {
        id: `cls-${Date.now()}`,
        name: classFormName,
        department: classFormDept,
        classTeacher: classFormTeacher || 'Unassigned',
        roomNumber: classFormRoom || '--',
        capacity: Number(classFormCapacity),
        status: classFormStatus
      };
      onUpdateClasses([...classes, newClassItem]);
      showToast(`Class "${classFormName}" added.`);
    }
    setShowClassModal(false);
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete Class "${name}"?`)) {
      onUpdateClasses(classes.filter(c => c.id !== id));
      showToast(`Class ${name} removed.`);
      try { await deleteClass(id); } catch(e) { console.error(e); }
    }
  };

  const filteredClasses = classes.filter(c => {
    const matchesDept = classFilterDept === 'All' || c.department === classFilterDept;
    const matchesSearch = c.name.toLowerCase().includes(classSearch.toLowerCase()) || 
                          c.classTeacher.toLowerCase().includes(classSearch.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // ==========================================
  // 5. HOUSES STATE & MODALS
  // ==========================================
  const [houseSearch, setHouseSearch] = useState('');
  const [showHouseModal, setShowHouseModal] = useState(false);
  const [editingHouse, setEditingHouse] = useState<HouseItem | null>(null);
  const [houseFormName, setHouseFormName] = useState('');
  const [houseFormColor, setHouseFormColor] = useState('#2563eb');
  const [houseFormMaster, setHouseFormMaster] = useState('');
  const [houseFormPatron, setHouseFormPatron] = useState('');
  const [houseFormMotto, setHouseFormMotto] = useState('');

  const openAddHouseModal = () => {
    setEditingHouse(null);
    setHouseFormName('');
    setHouseFormColor('#2563eb');
    setHouseFormMaster('');
    setHouseFormPatron('');
    setHouseFormMotto('');
    setShowHouseModal(true);
  };

  const openEditHouseModal = (h: HouseItem) => {
    setEditingHouse(h);
    setHouseFormName(h.name);
    setHouseFormColor(h.color);
    setHouseFormMaster(h.master);
    setHouseFormPatron(h.patron || '');
    setHouseFormMotto(h.motto);
    setShowHouseModal(true);
  };

  const handleSaveHouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseFormName) {
      showToast('House name is required.');
      return;
    }

    if (editingHouse) {
      const updated = houses.map(h => h.id === editingHouse.id ? {
        ...h,
        name: houseFormName,
        color: houseFormColor,
        master: houseFormMaster || 'Staff Warden',
        patron: houseFormPatron,
        motto: houseFormMotto || 'Excellence & Discipline'
      } : h);
      onUpdateHouses(updated);
      showToast(`House "${houseFormName}" updated.`);
    } else {
      const newH: HouseItem = {
        id: `house-${Date.now()}`,
        name: houseFormName,
        color: houseFormColor,
        master: houseFormMaster || 'Staff Warden',
        patron: houseFormPatron,
        motto: houseFormMotto || 'Excellence & Discipline'
      };
      onUpdateHouses([...houses, newH]);
      showToast(`House "${houseFormName}" created.`);
    }
    setShowHouseModal(false);
  };

  const handleDeleteHouse = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      onUpdateHouses(houses.filter(h => h.id !== id));
      showToast(`${name} deleted.`);
      try { await deleteHouse(id); } catch(e) { console.error(e); }
    }
  };

  const filteredHouses = houses.filter(h => h.name.toLowerCase().includes(houseSearch.toLowerCase()));

  // ==========================================
  // 6. SUBJECTS STATE & MODALS
  // ==========================================
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectFilterDept, setSubjectFilterDept] = useState('All');
  const [subjectFilterCat, setSubjectFilterCat] = useState('All');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [subjectFormName, setSubjectFormName] = useState('');
  const [subjectFormCode, setSubjectFormCode] = useState('');
  const [subjectFormDept, setSubjectFormDept] = useState(departments[0]?.name || 'Primary School');
  const [subjectFormCat, setSubjectFormCat] = useState<'Core' | 'Elective'>('Core');

  const openAddSubjectModal = () => {
    setEditingSubject(null);
    setSubjectFormName('');
    setSubjectFormCode('');
    setSubjectFormDept(departments[0]?.name || 'Primary School');
    setSubjectFormCat('Core');
    setShowSubjectModal(true);
  };

  const openEditSubjectModal = (sub: SubjectItem) => {
    setEditingSubject(sub);
    setSubjectFormName(sub.name);
    setSubjectFormCode(sub.code);
    setSubjectFormDept(sub.department);
    setSubjectFormCat(sub.category);
    setShowSubjectModal(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectFormName) {
      showToast('Subject name is required.');
      return;
    }

    if (editingSubject) {
      const updated = subjects.map(s => s.id === editingSubject.id ? {
        ...s,
        name: subjectFormName,
        code: subjectFormCode || `${subjectFormName.substring(0, 3).toUpperCase()}001`,
        department: subjectFormDept,
        category: subjectFormCat
      } : s);
      onUpdateSubjects(updated);
      showToast(`Subject "${subjectFormName}" updated.`);
    } else {
      const newSub: SubjectItem = {
        id: `sub-${Date.now()}`,
        name: subjectFormName,
        code: subjectFormCode || `${subjectFormName.substring(0, 3).toUpperCase()}001`,
        department: subjectFormDept,
        category: subjectFormCat
      };
      onUpdateSubjects([...subjects, newSub]);
      showToast(`Subject "${subjectFormName}" added.`);
    }
    setShowSubjectModal(false);
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete Subject "${name}"?`)) {
      onUpdateSubjects(subjects.filter(s => s.id !== id));
      showToast(`Subject ${name} removed.`);
      try { await deleteSubject(id); } catch(e) { console.error(e); }
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const matchesDept = subjectFilterDept === 'All' || s.department === subjectFilterDept;
    const matchesCat = subjectFilterCat === 'All' || s.category === subjectFilterCat;
    const matchesSearch = s.name.toLowerCase().includes(subjectSearch.toLowerCase()) || 
                          s.code.toLowerCase().includes(subjectSearch.toLowerCase());
    return matchesDept && matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Dynamic Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-up">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 0. MASTER SETUP MANAGEMENT HUB (Overview) */}
      {/* ==================================================================== */}
      {(activeModule === 'setup_management' || activeModule === 'academic_setup') && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-indigo-700/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                  Core Institution Framework
                </span>
                <h2 className="text-2xl font-black mt-1">Setup Management Command Center</h2>
                <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
                  Configure structural building blocks of the institution: academic sessions, term scoring parameters, departments, classrooms, student houses, and subject curricula.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Active Session: {currentAy?.name || '2025-2026'}
                </span>
              </div>
            </div>
          </div>

          {/* Module Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: Academic Years */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {academicYears.length} Sessions
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Academic Years</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage active school calendar, archive previous academic years, and set start/end term dates.
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={openAddAyModal}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Year
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('setup_academic_years')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  Configure <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 2: Term / Parameters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    {terms.length} Terms
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Term / Parameters</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Set terminal durations, days open, resumption dates, class/exam scoring weightings, and report rules.
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={openAddTermModal}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Term
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('setup_term_parameters')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  Configure <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 3: Departments */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    {departments.length} Depts
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Departments</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Organize Primary, JHS, Senior High School, and assign Heads of Department (HODs).
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={openAddDeptModal}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Dept
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('setup_departments')}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  Configure <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 3B: SHS Courses & Programmes */}
            <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {courses.length} SHS Courses
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">SHS Courses / Programmes</h3>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700">SHS</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Science, Visual Arts, Home Economics, etc. Students are placed under courses with automatic Levels 1, 2 & 3.
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={openAddCourseModal}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Course
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('setup_shs_courses')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  Configure <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 4: Classes */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <School className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {classes.length} Classes
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Classes</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage class streams, room assignments, class teacher allocation, and student enrollment capacities.
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={openAddClassModal}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Class
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('setup_classes')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  Configure <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 5: Houses */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    {houses.length} Houses
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Houses</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Setup student competitive houses (Aggrey, Nkrumah, Gbewaa, Yaa Asantewaa), house colors, and masters.
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={openAddHouseModal}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add House
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('setup_houses')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  Configure <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 6: Subjects */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    {subjects.length} Subjects
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Subjects</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage core and elective subject curricula, course codes, departments, and terminal assessment rules.
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={openAddSubjectModal}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Subject
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('setup_subjects')}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  Configure <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. ACADEMIC YEARS MODULE */}
      {/* ==================================================================== */}
      {activeModule === 'setup_academic_years' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">School Calendar & Framework</span>
              <h3 className="text-xl font-bold text-slate-900">Academic Years Management</h3>
              <p className="text-xs text-slate-500">Configure, activate, and archive school academic sessions</p>
            </div>
            <button
              onClick={openAddAyModal}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Add Academic Year
            </button>
          </div>

          {/* Quick Search */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={aySearch}
                onChange={(e) => setAySearch(e.target.value)}
                placeholder="Search academic year (e.g. 2026-2027)..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <span className="text-xs text-slate-500 font-semibold">{filteredAy.length} Records Found</span>
          </div>

          {/* Current Academic Year Highlight Card */}
          {currentAy && (
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-200">School-Wide Active Session</span>
                <span className="bg-emerald-400 text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  Currently Active
                </span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="text-2xl font-black">{currentAy.name}</h4>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Duration: {currentAy.startDate} to {currentAy.endDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditAyModal(currentAy)}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Edit Dates
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase text-[10px]">
                  <th className="p-3 w-14 text-center">S/N</th>
                  <th className="p-3">Academic Session</th>
                  <th className="p-3">Start Date</th>
                  <th className="p-3">End Date</th>
                  <th className="p-3">System Status</th>
                  <th className="p-3">Historical Records</th>
                  <th className="p-3 w-36 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAy.map((ay, idx) => (
                  <tr key={ay.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <span>{ay.name}</span>
                      {ay.status === 'Current' && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600 font-mono">{ay.startDate}</td>
                    <td className="p-3 text-slate-600 font-mono">{ay.endDate}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ay.status === 'Current' ? 'bg-emerald-600 text-white' :
                        ay.status === 'Active' ? 'bg-indigo-100 text-indigo-800' :
                        ay.status === 'Upcoming' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {ay.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold ${ay.hasRecords ? 'text-rose-600' : 'text-slate-400'}`}>
                        {ay.hasRecords ? '● Has Student Records' : '○ No Data'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {ay.status !== 'Current' && (
                          <button
                            title="Set as Current"
                            onClick={() => handleSetCurrentAy(ay.id)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-[10px] cursor-pointer"
                          >
                            Set Current
                          </button>
                        )}
                        <button
                          title="Edit"
                          onClick={() => openEditAyModal(ay)}
                          className="w-7 h-7 bg-amber-500 hover:bg-amber-600 text-white rounded flex items-center justify-center cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => handleDeleteAy(ay.id, ay.name)}
                          className="w-7 h-7 bg-rose-600 hover:bg-rose-700 text-white rounded flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ==================================================================== */}
      {/* 2. TERM / PARAMETERS MODULE */}
      {/* ==================================================================== */}
      {activeModule === 'setup_term_parameters' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Terminal Framework & Assessment</span>
              <h3 className="text-xl font-bold text-slate-900">Terms & Parameters Management</h3>
              <p className="text-xs text-slate-500">Configure academic terms, duration, holidays, and scoring rules</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowParametersConfig(!showParametersConfig)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" /> {showParametersConfig ? 'Hide Parameters' : 'Grading Parameters'}
              </button>
              <button
                onClick={openAddTermModal}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" /> Add Term
              </button>
            </div>
          </div>

          {/* Academic Year Switcher Bar */}
          <div className="bg-indigo-900 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-indigo-200 uppercase tracking-wide">Selected Academic Year:</span>
              <select
                value={selectedAyForTerms}
                onChange={(e) => setSelectedAyForTerms(e.target.value)}
                className="bg-white text-slate-900 font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                {academicYears.map(ay => (
                  <option key={ay.id} value={ay.name}>
                    {ay.name} {ay.status === 'Current' ? '(Current Active)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-700/70 border border-indigo-500 px-3 py-1 rounded-full text-[11px] font-bold">
                {filteredTerms.length} Terms in this Session
              </span>
            </div>
          </div>

          {/* Parameters Settings Collapsible */}
          {showParametersConfig && (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-600" /> Continuous Assessment & Terminal Parameters
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class Assessment Score Ratio (%)</label>
                  <input
                    type="number"
                    value={assessmentClassRatio}
                    onChange={(e) => setAssessmentClassRatio(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Default GES is 40%</span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exam Score Ratio (%)</label>
                  <input
                    type="number"
                    value={assessmentExamRatio}
                    onChange={(e) => setAssessmentExamRatio(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Default GES is 60%</span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pass Mark Threshold (%)</label>
                  <input
                    type="number"
                    value={passingMark}
                    onChange={(e) => setPassingMark(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Minimum score for Grade 1</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowStudentReportDownload}
                    onChange={(e) => setAllowStudentReportDownload(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="font-semibold text-slate-700">Allow Students/Parents to Download Reports for this Session</span>
                </label>
                <button
                  onClick={() => showToast('Parameters saved successfully.')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                >
                  Save Parameters
                </button>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={termSearch}
                onChange={(e) => setTermSearch(e.target.value)}
                placeholder="Search term by name..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <button
              onClick={() => setTermSearch('')}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Terms List */}
          <div className="space-y-3">
            {filteredTerms.map((term, idx) => (
              <div key={term.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-600 text-sm">{idx + 1}.</span>
                      <h4 className="font-bold text-slate-900 text-sm">{term.name}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        term.status === 'Current' ? 'bg-emerald-600 text-white' :
                        term.status === 'Completed' ? 'bg-slate-200 text-slate-700' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {term.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                      <span>📅 {term.startDate} to {term.endDate}</span>
                      <span>⏳ {term.daysOpen} days open</span>
                      <span>🏖️ {term.holidays} holidays</span>
                      {term.nextTermDate && <span>➔ Next term begins: {term.nextTermDate}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {term.status !== 'Current' && (
                      <button
                        onClick={() => handleSetCurrentTerm(term.id)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-xs cursor-pointer"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => openEditTermModal(term)}
                      className="w-8 h-8 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center justify-center cursor-pointer shadow-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTerm(term.id, term.name)}
                      className="w-8 h-8 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center justify-center cursor-pointer shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredTerms.length === 0 && (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs">
                No terms configured for academic session {selectedAyForTerms}. Click "Add Term" above to create one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. DEPARTMENTS MODULE */}
      {/* ==================================================================== */}
      {activeModule === 'setup_departments' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">Institutional Divisions</span>
              <h3 className="text-xl font-bold text-slate-900">Departments Management</h3>
              <p className="text-xs text-slate-500">Manage academic departments, faculty leads, and curricula</p>
            </div>
            <button
              onClick={openAddDeptModal}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Add Department
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                placeholder="Search department by name or code..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <span className="text-xs font-semibold text-slate-500">{filteredDepts.length} Departments</span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase text-[10px]">
                  <th className="p-3 w-14 text-center">S/N</th>
                  <th className="p-3">Department Name</th>
                  <th className="p-3">Code</th>
                  <th className="p-3">Head of Department</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-center">Classes Count</th>
                  <th className="p-3 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDepts.map((dept, idx) => {
                  const deptClassesCount = classes.filter(c => c.department.toLowerCase() === dept.name.toLowerCase()).length;
                  return (
                    <tr key={dept.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{dept.name}</td>
                      <td className="p-3 font-mono font-bold text-cyan-700">{dept.code || '--'}</td>
                      <td className="p-3 text-slate-700">{dept.headOfDept || 'Not Assigned'}</td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{dept.description}</td>
                      <td className="p-3 text-center">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                          {deptClassesCount} Classes
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="Edit"
                            onClick={() => openEditDeptModal(dept)}
                            className="w-7 h-7 bg-amber-500 hover:bg-amber-600 text-white rounded flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Delete"
                            onClick={() => handleDeleteDept(dept.id, dept.name)}
                            className="w-7 h-7 bg-rose-600 hover:bg-rose-700 text-white rounded flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* ==================================================================== */}
      {/* 3B. SHS COURSES & PROGRAMMES MODULE */}
      {/* ==================================================================== */}
      {(activeModule === 'setup_shs_courses' || activeModule === 'shs_courses' || activeModule === 'courses') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Senior High School Structure</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">SHS Programmes</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-1">SHS Courses & Programmes Management</h3>
              <p className="text-xs text-slate-500">Configure academic programmes (Science, Visual Arts, Home Economics, etc.) with automatic Level 1, 2, & 3 class streams.</p>
            </div>
            <button
              onClick={openAddCourseModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Add SHS Course
            </button>
          </div>

          {/* Architecture Concept Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 border border-blue-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-blue-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider">SHS Placement Hierarchy</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed max-w-4xl">
              In Senior High School, students are enrolled under specific <strong className="text-blue-300">Courses</strong> (e.g. Science, Visual Arts, Home Economics, General Arts, Business) and placed into <strong className="text-blue-300">Levels 1, 2 & 3</strong>. This automatically establishes the class streams (<strong className="text-amber-300">Science 1, Science 2, Science 3</strong>) across all grading sheets, transcripts, terminal reports, and student registers.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
              <span className="bg-blue-800/80 border border-blue-600/50 px-3 py-1 rounded-lg font-mono text-blue-100">
                SHS &rarr; Course: Science &rarr; Science 1, 2, 3
              </span>
              <span className="bg-purple-800/80 border border-purple-600/50 px-3 py-1 rounded-lg font-mono text-purple-100">
                SHS &rarr; Course: Visual Arts &rarr; Visual Arts 1, 2, 3
              </span>
              <span className="bg-emerald-800/80 border border-emerald-600/50 px-3 py-1 rounded-lg font-mono text-emerald-100">
                SHS &rarr; Course: Home Economics &rarr; Home Economics 1, 2, 3
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700">Total SHS Courses</span>
                <h4 className="text-2xl font-black text-slate-900 mt-0.5">{courses.length} Programmes</h4>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600 opacity-70" />
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-700">SHS Students Enrolled</span>
                <h4 className="text-2xl font-black text-slate-900 mt-0.5">
                  {students.filter(s => s.department === 'Senior High School' || s.department === 'SHS' || (s.course && s.course.trim().length > 0)).length} Students
                </h4>
              </div>
              <Users className="w-8 h-8 text-indigo-600 opacity-70" />
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700">Total Stream Classes</span>
                <h4 className="text-2xl font-black text-slate-900 mt-0.5">
                  {classes.filter(c => c.department === 'Senior High School' || c.course).length} Classes
                </h4>
              </div>
              <School className="w-8 h-8 text-emerald-600 opacity-70" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search SHS courses by name, code, coordinator..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            {courseSearch && (
              <button
                onClick={() => setCourseSearch('')}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Courses Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase text-[10px]">
                  <th className="p-3 w-14 text-center">S/N</th>
                  <th className="p-3">Course / Programme</th>
                  <th className="p-3">Code</th>
                  <th className="p-3">Head of Programme / HOD</th>
                  <th className="p-3">Generated Level Streams (Classes)</th>
                  <th className="p-3">Elective Subjects</th>
                  <th className="p-3 text-center">Enrolled</th>
                  <th className="p-3 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCourses.map((course, idx) => {
                  const enrolledCount = students.filter(s => 
                    s.course?.toLowerCase() === course.name.toLowerCase() || 
                    s.className.toLowerCase().startsWith(course.name.toLowerCase())
                  ).length;

                  return (
                    <tr key={course.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-sm">{course.name}</div>
                        {course.description && (
                          <div className="text-[11px] text-slate-500 max-w-xs truncate">{course.description}</div>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-700">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                          {course.code || '--'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">
                        {course.headOfProgramme || 'Unassigned'}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {['1', '2', '3'].map((lvl) => (
                            <span 
                              key={lvl}
                              className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-semibold"
                            >
                              {course.name} {lvl}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        {course.electiveSubjects && course.electiveSubjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {course.electiveSubjects.map((sub, sIdx) => (
                              <span key={sIdx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                                {sub}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None specified</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold text-xs">
                          {enrolledCount} Students
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="Edit Course"
                            onClick={() => openEditCourseModal(course)}
                            className="w-7 h-7 bg-amber-500 hover:bg-amber-600 text-white rounded flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Delete Course"
                            onClick={() => handleDeleteCourse(course.id, course.name)}
                            className="w-7 h-7 bg-rose-600 hover:bg-rose-700 text-white rounded flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* ==================================================================== */}
      {/* 4. CLASSES MODULE */}
      {/* ==================================================================== */}
      {activeModule === 'setup_classes' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Classrooms & Grade Streams</span>
              <h3 className="text-xl font-bold text-slate-900">Classes Management</h3>
              <p className="text-xs text-slate-500">Configure grade levels, assign class teachers, and monitor capacities</p>
            </div>
            <button
              onClick={openAddClassModal}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Add Class
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700">Total Classes</span>
                <h4 className="text-2xl font-black text-slate-900 mt-0.5">{classes.length} Streams</h4>
              </div>
              <School className="w-8 h-8 text-emerald-600 opacity-70" />
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700">Enrolled Students</span>
                <h4 className="text-2xl font-black text-slate-900 mt-0.5">{students.length} Pupils</h4>
              </div>
              <Users className="w-8 h-8 text-blue-600 opacity-70" />
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-700">Average Capacity</span>
                <h4 className="text-2xl font-black text-slate-900 mt-0.5">
                  {Math.round(classes.reduce((a, c) => a + c.capacity, 0) / Math.max(1, classes.length))} Seats
                </h4>
              </div>
              <Sparkles className="w-8 h-8 text-amber-600 opacity-70" />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                placeholder="Search by class name or teacher..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Department:</span>
              <select
                value={classFilterDept}
                onChange={(e) => setClassFilterDept(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
              >
                <option value="All">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Classes Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase text-[10px]">
                  <th className="p-3 w-14 text-center">S/N</th>
                  <th className="p-3">Class / Stream</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Form Master / Teacher</th>
                  <th className="p-3">Room / Hall</th>
                  <th className="p-3 text-center">Enrolled</th>
                  <th className="p-3 text-center">Capacity</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredClasses.map((cls, idx) => {
                  const enrolledCount = students.filter(s => s.className.toLowerCase() === cls.name.toLowerCase()).length;
                  const isNearCapacity = enrolledCount >= cls.capacity * 0.9;
                  return (
                    <tr key={cls.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{cls.name}</td>
                      <td className="p-3 text-slate-700">{cls.department}</td>
                      <td className="p-3 text-slate-800 font-semibold">{cls.classTeacher}</td>
                      <td className="p-3 text-slate-500 font-mono">{cls.roomNumber}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold font-mono ${
                          isNearCapacity ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {enrolledCount} Pupils
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600">{cls.capacity}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cls.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {cls.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="Edit"
                            onClick={() => openEditClassModal(cls)}
                            className="w-7 h-7 bg-amber-500 hover:bg-amber-600 text-white rounded flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Delete"
                            onClick={() => handleDeleteClass(cls.id, cls.name)}
                            className="w-7 h-7 bg-rose-600 hover:bg-rose-700 text-white rounded flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* ==================================================================== */}
      {/* 5. HOUSES MODULE */}
      {/* ==================================================================== */}
      {activeModule === 'setup_houses' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Co-Curricular & Sports</span>
              <h3 className="text-xl font-bold text-slate-900">School Houses Management</h3>
              <p className="text-xs text-slate-500">Configure school houses, color traditions, house masters, and student distribution</p>
            </div>
            <button
              onClick={openAddHouseModal}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Add House
            </button>
          </div>

          {/* Quick Search */}
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={houseSearch}
                onChange={(e) => setHouseSearch(e.target.value)}
                placeholder="Search house by name..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <span className="text-xs font-semibold text-slate-500">{filteredHouses.length} Registered Houses</span>
          </div>

          {/* Houses Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredHouses.map((house) => {
              const count = students.filter(s => s.house?.toLowerCase().includes(house.name.toLowerCase().replace(' house', ''))).length;
              return (
                <div key={house.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden space-y-3">
                  <div 
                    className="absolute top-0 left-0 right-0 h-2" 
                    style={{ backgroundColor: house.color }}
                  />
                  <div className="flex justify-between items-start pt-1">
                    <div>
                      <h4 className="font-bold text-base text-slate-900">{house.name}</h4>
                      <p className="text-[11px] text-slate-500 italic">"{house.motto}"</p>
                    </div>
                    <div 
                      className="w-5 h-5 rounded-full border border-slate-300 shadow-xs flex-shrink-0"
                      style={{ backgroundColor: house.color }}
                    />
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">House Master:</span>
                      <span className="font-bold text-slate-800">{house.master}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Patron:</span>
                      <span className="font-medium text-slate-700">{house.patron || '--'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-400">Members:</span>
                      <span className="font-bold text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {count} Students
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openEditHouseModal(house)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteHouse(house.id, house.name)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. SUBJECTS MODULE */}
      {/* ==================================================================== */}
      {activeModule === 'setup_subjects' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Curriculum & Academics</span>
              <h3 className="text-xl font-bold text-slate-900">Subjects Management</h3>
              <p className="text-xs text-slate-500">Configure courses, subject codes, and curriculum classifications</p>
            </div>
            <button
              onClick={openAddSubjectModal}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-teal-50 rounded-xl border border-teal-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-700">Total Subjects</span>
                <h4 className="text-2xl font-black text-slate-900 mt-0.5">{subjects.length} Courses</h4>
              </div>
              <BookOpen className="w-8 h-8 text-teal-600 opacity-70" />
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-700">Core Subjects</span>
                <h4 className="text-2xl font-black text-slate-900 mt-0.5">
                  {subjects.filter(s => s.category === 'Core').length} Core
                </h4>
              </div>
              <Award className="w-8 h-8 text-indigo-600 opacity-70" />
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-700">Elective Subjects</span>
                <h4 className="text-2xl font-black text-slate-900 mt-0.5">
                  {subjects.filter(s => s.category === 'Elective').length} Electives
                </h4>
              </div>
              <Sparkles className="w-8 h-8 text-amber-600 opacity-70" />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                placeholder="Search subject by name or code..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Department:</span>
              <select
                value={subjectFilterDept}
                onChange={(e) => setSubjectFilterDept(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
              >
                <option value="All">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Category:</span>
              <select
                value={subjectFilterCat}
                onChange={(e) => setSubjectFilterCat(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
              >
                <option value="All">All Categories</option>
                <option value="Core">Core</option>
                <option value="Elective">Elective</option>
              </select>
            </div>
          </div>

          {/* Subjects Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase text-[10px]">
                  <th className="p-3 w-14 text-center">S/N</th>
                  <th className="p-3">Subject Name</th>
                  <th className="p-3">Subject Code</th>
                  <th className="p-3">Department</th>
                  <th className="p-3 text-center">Curriculum Type</th>
                  <th className="p-3 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSubjects.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{sub.name}</td>
                    <td className="p-3 font-mono font-bold text-teal-700">{sub.code}</td>
                    <td className="p-3 text-slate-700">{sub.department}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sub.category === 'Core' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sub.category}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          title="Edit"
                          onClick={() => openEditSubjectModal(sub)}
                          className="w-7 h-7 bg-amber-500 hover:bg-amber-600 text-white rounded flex items-center justify-center cursor-pointer shadow-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => handleDeleteSubject(sub.id, sub.name)}
                          className="w-7 h-7 bg-rose-600 hover:bg-rose-700 text-white rounded flex items-center justify-center cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ==================================================================== */}
      {/* MODAL 1: ACADEMIC YEAR FORM MODAL */}
      {/* ==================================================================== */}
      {showAyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingAy ? 'Edit Academic Year' : 'Add Academic Year'}
              </h3>
              <button onClick={() => setShowAyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAy} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Academic Year Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2028-2029"
                  value={ayFormName}
                  onChange={(e) => setAyFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={ayFormStartDate}
                    onChange={(e) => setAyFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={ayFormEndDate}
                    onChange={(e) => setAyFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={ayFormStatus}
                  onChange={(e: any) => setAyFormStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Active">Active</option>
                  <option value="Current">Current (System Active)</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAyModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Academic Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: TERM FORM MODAL */}
      {/* ==================================================================== */}
      {showTermModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingTerm ? 'Edit Term Details' : `Add Term to ${selectedAyForTerms}`}
              </h3>
              <button onClick={() => setShowTermModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTerm} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Term Name *</label>
                <select
                  value={termFormName}
                  onChange={(e) => setTermFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={termFormStartDate}
                    onChange={(e) => setTermFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={termFormEndDate}
                    onChange={(e) => setTermFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Days Open</label>
                  <input
                    type="number"
                    value={termFormDaysOpen}
                    onChange={(e) => setTermFormDaysOpen(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Holidays Count</label>
                  <input
                    type="number"
                    value={termFormHolidays}
                    onChange={(e) => setTermFormHolidays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Next Term Resumes</label>
                <input
                  type="date"
                  value={termFormNextDate}
                  onChange={(e) => setTermFormNextDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={termFormStatus}
                  onChange={(e: any) => setTermFormStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Current">Current (Active)</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTermModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Term
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: DEPARTMENT FORM MODAL */}
      {/* ==================================================================== */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingDept ? 'Edit Department' : 'Add Department'}
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveDept} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Department"
                  value={deptFormName}
                  onChange={(e) => setDeptFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SCI"
                    value={deptFormCode}
                    onChange={(e) => setDeptFormCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Head of Dept (HOD)</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Kwame Boateng"
                    value={deptFormHOD}
                    onChange={(e) => setDeptFormHOD(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Department curriculum and focus..."
                  value={deptFormDesc}
                  onChange={(e) => setDeptFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: CLASS FORM MODAL */}
      {/* ==================================================================== */}
      {showClassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingClass ? 'Edit Class Details' : 'Add Class / Stream'}
              </h3>
              <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Class / Form Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basic 4 or JHS 1 B"
                  value={classFormName}
                  onChange={(e) => setClassFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department *</label>
                <select
                  value={classFormDept}
                  onChange={(e) => setClassFormDept(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Class Teacher / Form Master</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Evans Lamptey"
                  value={classFormTeacher}
                  onChange={(e) => setClassFormTeacher(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Room / Hall</label>
                  <input
                    type="text"
                    placeholder="e.g. Block B - 102"
                    value={classFormRoom}
                    onChange={(e) => setClassFormRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student Capacity</label>
                  <input
                    type="number"
                    value={classFormCapacity}
                    onChange={(e) => setClassFormCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={classFormStatus}
                  onChange={(e: any) => setClassFormStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 5: HOUSE FORM MODAL */}
      {/* ==================================================================== */}
      {showHouseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingHouse ? 'Edit House' : 'Add School House'}
              </h3>
              <button onClick={() => setShowHouseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveHouse} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">House Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blue House or Nkrumah House"
                  value={houseFormName}
                  onChange={(e) => setHouseFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">House Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={houseFormColor}
                    onChange={(e) => setHouseFormColor(e.target.value)}
                    className="w-10 h-10 p-0.5 rounded-lg border border-slate-300 cursor-pointer"
                  />
                  <div className="flex gap-2">
                    {['#2563eb', '#16a34a', '#ca8a04', '#dc2626', '#9333ea', '#0d9488'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setHouseFormColor(c)}
                        className="w-6 h-6 rounded-full border border-slate-300"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">House Master / Mistress</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Evans Lamptey"
                  value={houseFormMaster}
                  onChange={(e) => setHouseFormMaster(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patron</label>
                <input
                  type="text"
                  placeholder="e.g. Board of Governors"
                  value={houseFormPatron}
                  onChange={(e) => setHouseFormPatron(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">House Motto / Slogan</label>
                <input
                  type="text"
                  placeholder="e.g. Truth, Integrity and Diligence"
                  value={houseFormMotto}
                  onChange={(e) => setHouseFormMotto(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowHouseModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save House
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 6: SUBJECT FORM MODAL */}
      {/* ==================================================================== */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingSubject ? 'Edit Subject' : 'Add Subject'}
              </h3>
              <button onClick={() => setShowSubjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSubject} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={subjectFormName}
                  onChange={(e) => setSubjectFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject Code</label>
                  <input
                    type="text"
                    placeholder="e.g. MAT001"
                    value={subjectFormCode}
                    onChange={(e) => setSubjectFormCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Curriculum Category</label>
                  <select
                    value={subjectFormCat}
                    onChange={(e: any) => setSubjectFormCat(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="Core">Core Subject</option>
                    <option value="Elective">Elective Subject</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department</label>
                <select
                  value={subjectFormDept}
                  onChange={(e) => setSubjectFormDept(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3B: SHS COURSE FORM MODAL */}
      {/* ==================================================================== */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingCourse ? 'Edit SHS Course / Programme' : 'Add SHS Course / Programme'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Senior High School Curriculum & Stream Definition</p>
                </div>
              </div>
              <button onClick={() => setShowCourseModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Course / Programme Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science, Visual Arts, Home Economics, General Arts"
                  value={courseFormName}
                  onChange={(e) => setCourseFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Students will be enrolled under this course with automatic Levels 1, 2, and 3 classes.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SCI, VA, HE"
                    value={courseFormCode}
                    onChange={(e) => setCourseFormCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={courseFormDept}
                    onChange={(e) => setCourseFormDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium bg-white"
                  >
                    <option value="Senior High School">Senior High School</option>
                    {departments.filter(d => d.name !== 'Senior High School').map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Head of Programme / Coordinator</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Kwesi Boateng"
                  value={courseFormHod}
                  onChange={(e) => setCourseFormHod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Elective Subjects (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Physics, Chemistry, Biology, Elective Mathematics"
                  value={courseFormElectives}
                  onChange={(e) => setCourseFormElectives(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Programme Description / Overview</label>
                <textarea
                  rows={2}
                  placeholder="Brief overview of the SHS programme curriculum..."
                  value={courseFormDesc}
                  onChange={(e) => setCourseFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Automatic stream creation note */}
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Automatic Class Generation:</strong> Saving will automatically establish and configure classes for <strong>{courseFormName || 'Course'} 1, {courseFormName || 'Course'} 2, & {courseFormName || 'Course'} 3</strong> under Senior High School.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  {editingCourse ? 'Update SHS Course' : 'Create SHS Course & Streams'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
