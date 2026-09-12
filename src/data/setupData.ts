import { AcademicYearItem, TermItem, DepartmentItem, ClassItem, HouseItem, SubjectItem, CourseItem } from '../types';

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
    id: 'dept-shs',
    name: 'Senior High School',
    code: 'SHS',
    description: 'Senior High School Department (Courses: Science, Visual Arts, Home Economics, General Arts, Business, Agric)',
    headOfDept: 'Dr. Kwame Boateng'
  }
];

export const INITIAL_SHS_COURSES: CourseItem[] = [
  {
    id: 'crs-1',
    name: 'Science',
    code: 'SCI',
    department: 'Senior High School',
    description: 'General Science Programme (Physics, Chemistry, Biology, Elective Mathematics)',
    coreSubjects: ['English Language', 'Core Mathematics', 'Integrated Science', 'Social Studies'],
    electiveSubjects: ['Physics', 'Chemistry', 'Biology', 'Elective Mathematics'],
    headOfCourse: 'Dr. Kwame Boateng',
    durationYears: 3,
    classesGenerated: ['Science 1', 'Science 2', 'Science 3']
  },
  {
    id: 'crs-2',
    name: 'Visual Arts',
    code: 'V-ART',
    department: 'Senior High School',
    description: 'Visual Arts Programme (Graphic Design, Picture Making, Textiles, Ceramics, General Knowledge in Art)',
    coreSubjects: ['English Language', 'Core Mathematics', 'Integrated Science', 'Social Studies'],
    electiveSubjects: ['General Knowledge in Art', 'Graphic Design', 'Picture Making', 'Textiles', 'Sculpture', 'Ceramics'],
    headOfCourse: 'Madam Grace Donkor',
    durationYears: 3,
    classesGenerated: ['Visual Arts 1', 'Visual Arts 2', 'Visual Arts 3']
  },
  {
    id: 'crs-3',
    name: 'Home Economics',
    code: 'H-ECON',
    department: 'Senior High School',
    description: 'Home Economics Programme (Food & Nutrition, Clothing & Textiles, Management in Living, Biology)',
    coreSubjects: ['English Language', 'Core Mathematics', 'Integrated Science', 'Social Studies'],
    electiveSubjects: ['Food & Nutrition', 'Clothing & Textiles', 'Management in Living', 'General Knowledge in Art', 'Biology'],
    headOfCourse: 'Mrs. Patience Osei',
    durationYears: 3,
    classesGenerated: ['Home Economics 1', 'Home Economics 2', 'Home Economics 3']
  },
  {
    id: 'crs-4',
    name: 'General Arts',
    code: 'G-ART',
    department: 'Senior High School',
    description: 'General Arts Programme (Literature in English, French, Economics, Geography, History, Government, Twi)',
    coreSubjects: ['English Language', 'Core Mathematics', 'Integrated Science', 'Social Studies'],
    electiveSubjects: ['Literature in English', 'Economics', 'Geography', 'Government', 'History', 'French Language', 'Asante Twi'],
    headOfCourse: 'Mr. Paul Denyo',
    durationYears: 3,
    classesGenerated: ['General Arts 1', 'General Arts 2', 'General Arts 3']
  },
  {
    id: 'crs-5',
    name: 'Business',
    code: 'BUS',
    department: 'Senior High School',
    description: 'Business Studies Programme (Financial Accounting, Cost Accounting, Business Management, Economics, Elective Mathematics)',
    coreSubjects: ['English Language', 'Core Mathematics', 'Integrated Science', 'Social Studies'],
    electiveSubjects: ['Financial Accounting', 'Cost Accounting', 'Business Management', 'Economics', 'Elective Mathematics'],
    headOfCourse: 'Mr. Emmanuel Tetteh',
    durationYears: 3,
    classesGenerated: ['Business 1', 'Business 2', 'Business 3']
  },
  {
    id: 'crs-6',
    name: 'Agricultural Science',
    code: 'AGRI',
    department: 'Senior High School',
    description: 'Agricultural Science Programme (General Agriculture, Animal Husbandry, Horticulture, Chemistry, Physics)',
    coreSubjects: ['English Language', 'Core Mathematics', 'Integrated Science', 'Social Studies'],
    electiveSubjects: ['General Agriculture', 'Animal Husbandry', 'Horticulture', 'Chemistry', 'Physics'],
    headOfCourse: 'Mr. Eric Agbenyega',
    durationYears: 3,
    classesGenerated: ['Agric 1', 'Agric 2', 'Agric 3']
  }
];

export const INITIAL_CLASSES: ClassItem[] = [
  // Pre School
  { id: 'cls-1', name: 'Nursery 1', department: 'Pre School', classTeacher: 'Miss Rebecca Arthur', roomNumber: 'Block A - 01', capacity: 25, status: 'Active' },
  { id: 'cls-2', name: 'KG 1', department: 'Pre School', classTeacher: 'Mrs. Patience Osei', roomNumber: 'Block A - 02', capacity: 30, status: 'Active' },
  { id: 'cls-3', name: 'KG 2', department: 'Pre School', classTeacher: 'Miss Linda Adams', roomNumber: 'Block A - 03', capacity: 30, status: 'Active' },
  
  // Primary School
  { id: 'cls-4', name: 'Basic 1', department: 'Primary School', classTeacher: 'Mr. Evans Lamptey', roomNumber: 'Block B - 101', capacity: 35, status: 'Active' },
  { id: 'cls-5', name: 'Basic 2', department: 'Primary School', classTeacher: 'Mrs. Sophia Addo', roomNumber: 'Block B - 102', capacity: 35, status: 'Active' },
  { id: 'cls-6', name: 'Basic 3', department: 'Primary School', classTeacher: 'Mr. Gabriel Kwakye', roomNumber: 'Block B - 103', capacity: 35, status: 'Active' },
  { id: 'cls-7', name: 'Basic 4', department: 'Primary School', classTeacher: 'Mr. Dominic Frimpong', roomNumber: 'Block B - 104', capacity: 35, status: 'Active' },
  { id: 'cls-8', name: 'Basic 5', department: 'Primary School', classTeacher: 'Mrs. Sarah Danquah', roomNumber: 'Block B - 105', capacity: 35, status: 'Active' },
  { id: 'cls-9', name: 'Basic 6', department: 'Primary School', classTeacher: 'Mr. Samuel Asare', roomNumber: 'Block B - 106', capacity: 35, status: 'Active' },
  
  // Junior High School
  { id: 'cls-10', name: 'JHS 1', department: 'Junior High School', classTeacher: 'Mr. Isaac K. Donkor', roomNumber: 'Block C - 201', capacity: 40, status: 'Active' },
  { id: 'cls-11', name: 'JHS 2', department: 'Junior High School', classTeacher: 'Mrs. Mary Ofori', roomNumber: 'Block C - 202', capacity: 40, status: 'Active' },
  { id: 'cls-12', name: 'JHS 3', department: 'Junior High School', classTeacher: 'Mr. Eric Agbenyega', roomNumber: 'Block C - 203', capacity: 40, status: 'Active' },

  // Senior High School (SHS -> Course -> 1, 2, 3)
  { id: 'cls-shs-sci-1', name: 'Science 1', department: 'Senior High School', course: 'Science', level: '1', classTeacher: 'Dr. Kwame Boateng', roomNumber: 'Sci Lab Block - 301', capacity: 40, status: 'Active' },
  { id: 'cls-shs-sci-2', name: 'Science 2', department: 'Senior High School', course: 'Science', level: '2', classTeacher: 'Dr. Kwame Boateng', roomNumber: 'Sci Lab Block - 302', capacity: 40, status: 'Active' },
  { id: 'cls-shs-sci-3', name: 'Science 3', department: 'Senior High School', course: 'Science', level: '3', classTeacher: 'Dr. Kwame Boateng', roomNumber: 'Sci Lab Block - 303', capacity: 40, status: 'Active' },

  { id: 'cls-shs-art-1', name: 'Visual Arts 1', department: 'Senior High School', course: 'Visual Arts', level: '1', classTeacher: 'Madam Grace Donkor', roomNumber: 'Art Studio - 101', capacity: 35, status: 'Active' },
  { id: 'cls-shs-art-2', name: 'Visual Arts 2', department: 'Senior High School', course: 'Visual Arts', level: '2', classTeacher: 'Madam Grace Donkor', roomNumber: 'Art Studio - 102', capacity: 35, status: 'Active' },
  { id: 'cls-shs-art-3', name: 'Visual Arts 3', department: 'Senior High School', course: 'Visual Arts', level: '3', classTeacher: 'Madam Grace Donkor', roomNumber: 'Art Studio - 103', capacity: 35, status: 'Active' },

  { id: 'cls-shs-he-1', name: 'Home Economics 1', department: 'Senior High School', course: 'Home Economics', level: '1', classTeacher: 'Mrs. Patience Osei', roomNumber: 'Home Econ Block - 201', capacity: 35, status: 'Active' },
  { id: 'cls-shs-he-2', name: 'Home Economics 2', department: 'Senior High School', course: 'Home Economics', level: '2', classTeacher: 'Mrs. Patience Osei', roomNumber: 'Home Econ Block - 202', capacity: 35, status: 'Active' },
  { id: 'cls-shs-he-3', name: 'Home Economics 3', department: 'Senior High School', course: 'Home Economics', level: '3', classTeacher: 'Mrs. Patience Osei', roomNumber: 'Home Econ Block - 203', capacity: 35, status: 'Active' },

  { id: 'cls-shs-ga-1', name: 'General Arts 1', department: 'Senior High School', course: 'General Arts', level: '1', classTeacher: 'Mr. Paul Denyo', roomNumber: 'Main Block - 401', capacity: 40, status: 'Active' },
  { id: 'cls-shs-ga-2', name: 'General Arts 2', department: 'Senior High School', course: 'General Arts', level: '2', classTeacher: 'Mr. Paul Denyo', roomNumber: 'Main Block - 402', capacity: 40, status: 'Active' },
  { id: 'cls-shs-ga-3', name: 'General Arts 3', department: 'Senior High School', course: 'General Arts', level: '3', classTeacher: 'Mr. Paul Denyo', roomNumber: 'Main Block - 403', capacity: 40, status: 'Active' },

  { id: 'cls-shs-bus-1', name: 'Business 1', department: 'Senior High School', course: 'Business', level: '1', classTeacher: 'Mr. Emmanuel Tetteh', roomNumber: 'Commerce Block - 101', capacity: 40, status: 'Active' },
  { id: 'cls-shs-bus-2', name: 'Business 2', department: 'Senior High School', course: 'Business', level: '2', classTeacher: 'Mr. Emmanuel Tetteh', roomNumber: 'Commerce Block - 102', capacity: 40, status: 'Active' },
  { id: 'cls-shs-bus-3', name: 'Business 3', department: 'Senior High School', course: 'Business', level: '3', classTeacher: 'Mr. Emmanuel Tetteh', roomNumber: 'Commerce Block - 103', capacity: 40, status: 'Active' },

  { id: 'cls-shs-agr-1', name: 'Agric 1', department: 'Senior High School', course: 'Agricultural Science', level: '1', classTeacher: 'Mr. Eric Agbenyega', roomNumber: 'Agric Science Lab - 01', capacity: 35, status: 'Active' },
  { id: 'cls-shs-agr-2', name: 'Agric 2', department: 'Senior High School', course: 'Agricultural Science', level: '2', classTeacher: 'Mr. Eric Agbenyega', roomNumber: 'Agric Science Lab - 02', capacity: 35, status: 'Active' },
  { id: 'cls-shs-agr-3', name: 'Agric 3', department: 'Senior High School', course: 'Agricultural Science', level: '3', classTeacher: 'Mr. Eric Agbenyega', roomNumber: 'Agric Science Lab - 03', capacity: 35, status: 'Active' }
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
  // Pre School
  { id: 'sub-1', name: 'Numeracy', code: 'Num001', department: 'Pre School', category: 'Core' },
  { id: 'sub-2', name: 'Literacy', code: 'Lit001', department: 'Pre School', category: 'Core' },
  
  // Primary School
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
  
  // Junior High School
  { id: 'sub-13', name: 'ENGLISH LANGUAGE', code: 'EL', department: 'Junior High School', category: 'Core' },
  { id: 'sub-14', name: 'Mathematics', code: 'MT', department: 'Junior High School', category: 'Core' },
  { id: 'sub-15', name: 'Science', code: 'SCI', department: 'Junior High School', category: 'Core' },
  { id: 'sub-16', name: 'Social Studies', code: 'SOC', department: 'Junior High School', category: 'Core' },
  { id: 'sub-17', name: 'Religious & Moral Education', code: 'RME', department: 'Junior High School', category: 'Core' },
  { id: 'sub-18', name: 'Computing', code: 'CCOMP', department: 'Junior High School', category: 'Core' },
  { id: 'sub-19', name: 'Career Technology', code: 'C.TECH', department: 'Junior High School', category: 'Elective' },
  { id: 'sub-20', name: 'Creative Arts & Design', code: 'CAD', department: 'Junior High School', category: 'Elective' },
  { id: 'sub-21', name: 'Asante Twi', code: 'TWI', department: 'Junior High School', category: 'Elective' },
  { id: 'sub-22', name: 'French Language', code: 'FRE', department: 'Junior High School', category: 'Elective' },

  // Senior High School (SHS Core)
  { id: 'sub-shs-1', name: 'English Language', code: 'SHS-ENG', department: 'Senior High School', category: 'Core' },
  { id: 'sub-shs-2', name: 'Core Mathematics', code: 'SHS-MAT', department: 'Senior High School', category: 'Core' },
  { id: 'sub-shs-3', name: 'Integrated Science', code: 'SHS-SCI', department: 'Senior High School', category: 'Core' },
  { id: 'sub-shs-4', name: 'Social Studies', code: 'SHS-SOC', department: 'Senior High School', category: 'Core' },

  // Senior High School (SHS Electives)
  { id: 'sub-shs-5', name: 'Physics', code: 'PHY', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-6', name: 'Chemistry', code: 'CHE', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-7', name: 'Biology', code: 'BIO', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-8', name: 'Elective Mathematics', code: 'E-MAT', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-9', name: 'General Knowledge in Art', code: 'GKA', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-10', name: 'Graphic Design', code: 'GRD', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-11', name: 'Picture Making', code: 'PIC', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-12', name: 'Textiles', code: 'TEX', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-13', name: 'Food & Nutrition', code: 'FN', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-14', name: 'Clothing & Textiles', code: 'CT', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-15', name: 'Management in Living', code: 'MIL', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-16', name: 'Economics', code: 'ECO', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-17', name: 'Geography', code: 'GEO', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-18', name: 'Government', code: 'GOV', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-19', name: 'Literature in English', code: 'LIT', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-20', name: 'Financial Accounting', code: 'ACC', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-21', name: 'Cost Accounting', code: 'C-ACC', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-22', name: 'Business Management', code: 'BM', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-23', name: 'General Agriculture', code: 'G-AGR', department: 'Senior High School', category: 'Elective' },
  { id: 'sub-shs-24', name: 'Animal Husbandry', code: 'AH', department: 'Senior High School', category: 'Elective' }
];
