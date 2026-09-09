import { AcademicYearItem, TermItem, DepartmentItem, ClassItem, HouseItem, SubjectItem } from '../types';

export const INITIAL_ACADEMIC_YEARS: AcademicYearItem[] = [
  {
    id: 'ay-1',
    name: '2025-2026',
    startDate: '2025-09-01',
    endDate: '2026-07-26',
    status: 'Current',
    hasRecords: true
  },
  {
    id: 'ay-2',
    name: '2026-2027',
    startDate: '2026-09-01',
    endDate: '2027-07-24',
    status: 'Upcoming',
    hasRecords: true
  },
  {
    id: 'ay-3',
    name: '2027-2028',
    startDate: '2027-09-01',
    endDate: '2028-07-24',
    status: 'Upcoming',
    hasRecords: false
  },
  {
    id: 'ay-4',
    name: '2024-2025',
    startDate: '2024-09-02',
    endDate: '2025-07-25',
    status: 'Completed',
    hasRecords: true
  }
];

export const INITIAL_TERMS: TermItem[] = [
  {
    id: 'term-1',
    academicYear: '2025-2026',
    name: 'First Term',
    startDate: '2025-01-10',
    endDate: '2025-04-05',
    daysOpen: 60,
    nextTermDate: '2025-04-25',
    holidays: 2,
    status: 'Completed'
  },
  {
    id: 'term-2',
    academicYear: '2025-2026',
    name: 'Second Term',
    startDate: '2025-04-25',
    endDate: '2025-07-20',
    daysOpen: 60,
    nextTermDate: '2025-09-01',
    holidays: 1,
    status: 'Completed'
  },
  {
    id: 'term-3',
    academicYear: '2025-2026',
    name: 'Third Term',
    startDate: '2026-04-21',
    endDate: '2026-07-23',
    daysOpen: 65,
    nextTermDate: '2026-09-08',
    holidays: 3,
    status: 'Current'
  },
  {
    id: 'term-4',
    academicYear: '2026-2027',
    name: 'First Term',
    startDate: '2026-09-08',
    endDate: '2026-12-15',
    daysOpen: 65,
    nextTermDate: '2027-01-10',
    holidays: 2,
    status: 'Upcoming'
  },
  {
    id: 'term-5',
    academicYear: '2026-2027',
    name: 'Second Term',
    startDate: '2027-01-10',
    endDate: '2027-04-08',
    daysOpen: 62,
    nextTermDate: '2027-04-26',
    holidays: 3,
    status: 'Upcoming'
  },
  {
    id: 'term-6',
    academicYear: '2026-2027',
    name: 'Third Term',
    startDate: '2027-04-26',
    endDate: '2027-07-22',
    daysOpen: 64,
    nextTermDate: '2027-09-07',
    holidays: 1,
    status: 'Upcoming'
  }
];

export const INITIAL_DEPARTMENTS: DepartmentItem[] = [
  {
    id: 'dept-1',
    name: 'Pre School',
    code: 'PRE',
    description: 'Early Childhood Education (Creche, Nursery, Kindergarten)',
    headOfDept: 'Mrs. Abigail Mensah'
  },
  {
    id: 'dept-2',
    name: 'Primary School',
    code: 'PRI',
    description: 'Lower and Upper Primary (Basic 1 to Basic 6)',
    headOfDept: 'Mr. Emmanuel Tetteh'
  },
  {
    id: 'dept-3',
    name: 'Junior High School',
    code: 'JHS',
    description: 'Basic 7 to Basic 9 (JHS 1 to JHS 3) BECE Examination Stream',
    headOfDept: 'Mr. Paul Denyo'
  },
  {
    id: 'dept-4',
    name: 'Science Department',
    code: 'SCI',
    description: 'Natural Science, Computing & STEM Laboratories',
    headOfDept: 'Dr. Kwame Boateng'
  },
  {
    id: 'dept-5',
    name: 'Arts Department',
    code: 'ART',
    description: 'Creative Arts, Ghanaian Language, French & Humanities',
    headOfDept: 'Madam Grace Donkor'
  }
];

export const INITIAL_CLASSES: ClassItem[] = [
  { id: 'cls-1', name: 'Nursery 1', department: 'Pre School', classTeacher: 'Miss Rebecca Arthur', roomNumber: 'Block A - 01', capacity: 25, status: 'Active' },
  { id: 'cls-2', name: 'KG 1', department: 'Pre School', classTeacher: 'Mrs. Patience Osei', roomNumber: 'Block A - 02', capacity: 30, status: 'Active' },
  { id: 'cls-3', name: 'KG 2', department: 'Pre School', classTeacher: 'Miss Linda Adams', roomNumber: 'Block A - 03', capacity: 30, status: 'Active' },
  { id: 'cls-4', name: 'Basic 1', department: 'Primary School', classTeacher: 'Mr. Evans Lamptey', roomNumber: 'Block B - 101', capacity: 35, status: 'Active' },
  { id: 'cls-5', name: 'Basic 2', department: 'Primary School', classTeacher: 'Mrs. Sophia Addo', roomNumber: 'Block B - 102', capacity: 35, status: 'Active' },
  { id: 'cls-6', name: 'Basic 3', department: 'Primary School', classTeacher: 'Mr. Gabriel Kwakye', roomNumber: 'Block B - 103', capacity: 35, status: 'Active' },
  { id: 'cls-7', name: 'Basic 4', department: 'Primary School', classTeacher: 'Mr. Dominic Frimpong', roomNumber: 'Block B - 104', capacity: 35, status: 'Active' },
  { id: 'cls-8', name: 'Basic 5', department: 'Primary School', classTeacher: 'Mrs. Sarah Danquah', roomNumber: 'Block B - 105', capacity: 35, status: 'Active' },
  { id: 'cls-9', name: 'Basic 6', department: 'Primary School', classTeacher: 'Mr. Samuel Asare', roomNumber: 'Block B - 106', capacity: 35, status: 'Active' },
  { id: 'cls-10', name: 'JHS 1', department: 'Junior High School', classTeacher: 'Mr. Isaac K. Donkor', roomNumber: 'Block C - 201', capacity: 40, status: 'Active' },
  { id: 'cls-11', name: 'JHS 2', department: 'Junior High School', classTeacher: 'Mrs. Mary Ofori', roomNumber: 'Block C - 202', capacity: 40, status: 'Active' },
  { id: 'cls-12', name: 'JHS 3', department: 'Junior High School', classTeacher: 'Mr. Eric Agbenyega', roomNumber: 'Block C - 203', capacity: 40, status: 'Active' }
];

export const INITIAL_HOUSES: HouseItem[] = [
  {
    id: 'house-1',
    name: 'Blue House',
    color: '#2563eb',
    master: 'Mr. Evans Lamptey',
    patron: 'School Board of Governors',
    motto: 'Truth, Integrity and Diligence'
  },
  {
    id: 'house-2',
    name: 'Green House',
    color: '#16a34a',
    master: 'Mrs. Sophia Addo',
    patron: 'PTA Executive Council',
    motto: 'Growth, Honor and Fruitfulness'
  },
  {
    id: 'house-3',
    name: 'Yellow House',
    color: '#ca8a04',
    master: 'Mr. Dominic Frimpong',
    patron: 'Old Students Association',
    motto: 'Light, Wisdom and Excellence'
  },
  {
    id: 'house-4',
    name: 'Red House',
    color: '#dc2626',
    master: 'Mr. Isaac K. Donkor',
    patron: 'Academic Board',
    motto: 'Valor, Courage and Victory'
  }
];

export const INITIAL_SUBJECTS: SubjectItem[] = [
  { id: 'sub-1', name: 'Numeracy', code: 'Num001', department: 'Pre School', category: 'Core' },
  { id: 'sub-2', name: 'Literacy', code: 'Lit001', department: 'Pre School', category: 'Core' },
  { id: 'sub-3', name: 'English Language', code: 'Eng001', department: 'Primary School', category: 'Core' },
  { id: 'sub-4', name: 'Mathematics', code: 'Mat001', department: 'Primary School', category: 'Core' },
  { id: 'sub-5', name: 'Science', code: 'Sci001', department: 'Primary School', category: 'Core' },
  { id: 'sub-6', name: 'Creative Arts', code: 'Cre001', department: 'Primary School', category: 'Elective' },
  { id: 'sub-7', name: 'Computing', code: 'Com001', department: 'Primary School', category: 'Core' },
  { id: 'sub-8', name: 'Religious & Moral Edu.', code: 'RME001', department: 'Primary School', category: 'Core' },
  { id: 'sub-9', name: 'History', code: 'His001', department: 'Primary School', category: 'Core' },
  { id: 'sub-10', name: 'Ghanaian Language', code: 'Gha001', department: 'Primary School', category: 'Elective' },
  { id: 'sub-11', name: 'French Language', code: 'Fre001', department: 'Primary School', category: 'Elective' },
  { id: 'sub-12', name: 'OWOP', code: 'OWOP001', department: 'Primary School', category: 'Core' },
  { id: 'sub-13', name: 'ENGLISH LANGUAGE', code: 'EL', department: 'Junior High School', category: 'Core' },
  { id: 'sub-14', name: 'Mathematics', code: 'MT', department: 'Junior High School', category: 'Core' },
  { id: 'sub-15', name: 'Science', code: 'SCI', department: 'Junior High School', category: 'Core' },
  { id: 'sub-16', name: 'Social Studies', code: 'SOC', department: 'Junior High School', category: 'Core' },
  { id: 'sub-17', name: 'Religious & Moral Education', code: 'RME', department: 'Junior High School', category: 'Core' },
  { id: 'sub-18', name: 'Computing', code: 'CCOMP', department: 'Junior High School', category: 'Core' },
  { id: 'sub-19', name: 'Career Technology', code: 'C.TECH', department: 'Junior High School', category: 'Elective' },
  { id: 'sub-20', name: 'Creative Arts & Design', code: 'CAD', department: 'Junior High School', category: 'Elective' },
  { id: 'sub-21', name: 'Asante Twi', code: 'TWI', department: 'Junior High School', category: 'Elective' },
  { id: 'sub-22', name: 'French Language', code: 'FRE', department: 'Junior High School', category: 'Elective' }
];
