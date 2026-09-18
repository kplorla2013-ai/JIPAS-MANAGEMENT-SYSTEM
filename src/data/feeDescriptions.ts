import { FeeOptionItem, FeePolicySettings } from '../types';

export interface FeeDescriptionCategory {
  id: string;
  category: string;
  description?: string;
  options: string[];
}

export const INITIAL_FEE_DESCRIPTION_CATEGORIES: FeeDescriptionCategory[] = [
  {
    id: 'fdc-1',
    category: 'Tuition & Academic Term Fees',
    description: 'Core tuition and termly academic fees across departments',
    options: [
      'Tuition Fee (Full Term Payment)',
      'Tuition Fee (Part Payment / 1st Installment)',
      'Tuition Fee (Part Payment / 2nd Installment)',
      'First Term School Fees',
      'Second Term School Fees',
      'Third Term School Fees',
      'Full Academic Year Fees (Advance Payment)',
    ]
  },
  {
    id: 'fdc-2',
    category: 'Statutory Levies & Development',
    description: 'Mandatory infrastructural, PTA, and computer lab levies',
    options: [
      'P.T.A Development Levy',
      'ICT & Computer Lab Levy',
      'Terminal Examination & Printing Fee',
      'First Aid & Clinic Health Levy',
      'Sports, Games & Cultural Levy',
      'Library & Resource Center Levy',
      'School Maintenance & Utility Levy'
    ]
  },
  {
    id: 'fdc-3',
    category: 'Student Welfare & Auxiliary Services',
    description: 'Transit, canteen, uniform, and educational tours',
    options: [
      'School Bus Transit Service (Monthly/Termly)',
      'School Feeding & Canteen Fee',
      'School Uniforms & Sports Wear Package',
      'Textbooks, Exercise Books & Stationery',
      'Excursion / Educational Tour Fee',
      'Extra / Saturday Remedial Classes'
    ]
  },
  {
    id: 'fdc-4',
    category: 'Administrative & Special Charges',
    description: 'Registration, ID card, graduation, and clearance fees',
    options: [
      'New Admission & Registration Fee',
      'Graduation & Speech & Prize-Giving Day Fee',
      'BECE / External Mock Registration Fee',
      'Student ID Card & Badge Replacement',
      'Transcript & Official Document Processing',
      'Previous Academic Arrears Clearance'
    ]
  }
];

export const PAID_AS_CATEGORIES = INITIAL_FEE_DESCRIPTION_CATEGORIES;

export const QUICK_PAID_AS_SUGGESTIONS = [
  'Tuition Fee (Full Payment)',
  'Tuition Fee (Part Payment)',
  'Third Term School Fees',
  'P.T.A Development Levy',
  'ICT & Computer Lab Levy',
  'School Bus Transit Service',
  'Feeding & Canteen Fee',
  'Arrears Clearance'
];

export const INITIAL_FEE_OPTIONS_DATA: FeeOptionItem[] = [
  { 
    id: 'fo-1', 
    code: 'TUI-PRI', 
    name: 'Tuition Fee (Primary School)', 
    category: 'Tuition', 
    amount: 350, 
    applicableClass: 'Primary School (All)', 
    description: 'Core classroom academic instruction, textbooks handling, and continuous assessment for Basic 1-6.',
    frequency: 'Termly', 
    mandatory: true, 
    isActive: true 
  },
  { 
    id: 'fo-2', 
    code: 'TUI-JHS', 
    name: 'Tuition Fee (Junior High School)', 
    category: 'Tuition', 
    amount: 450, 
    applicableClass: 'Junior High School (All)', 
    description: 'Specialized subject instruction, BECE mock preparation, and science laboratory practicals for JHS 1-3.',
    frequency: 'Termly', 
    mandatory: true, 
    isActive: true 
  },
  { 
    id: 'fo-3', 
    code: 'TUI-PRE', 
    name: 'Tuition Fee (Pre-School / Creche)', 
    category: 'Tuition', 
    amount: 300, 
    applicableClass: 'Pre School', 
    description: 'Early childhood development, play-based learning materials, and nursery child care.',
    frequency: 'Termly', 
    mandatory: true, 
    isActive: true 
  },
  { 
    id: 'fo-4', 
    code: 'LEV-PTA', 
    name: 'P.T.A Development Levy', 
    category: 'PTA', 
    amount: 50, 
    applicableClass: 'All Classes', 
    description: 'Parent-Teacher Association development fund for campus security and facility upgrades.',
    frequency: 'Termly', 
    mandatory: true, 
    isActive: true 
  },
  { 
    id: 'fo-5', 
    code: 'LEV-ICT', 
    name: 'ICT & Computer Lab Levy', 
    category: 'ICT', 
    amount: 40, 
    applicableClass: 'All Classes', 
    description: 'Computer lab maintenance, high-speed fiber internet, and practical programming software licenses.',
    frequency: 'Termly', 
    mandatory: true, 
    isActive: true 
  },
  { 
    id: 'fo-6', 
    code: 'LEV-EXM', 
    name: 'Terminal Examination & Printing Fee', 
    category: 'Exams', 
    amount: 35, 
    applicableClass: 'All Classes', 
    description: 'Printing of end-of-term examination booklets, mid-term tests, and official terminal report cards.',
    frequency: 'Termly', 
    mandatory: true, 
    isActive: true 
  },
  { 
    id: 'fo-7', 
    code: 'LEV-MED', 
    name: 'First Aid & Clinic Health Levy', 
    category: 'Health', 
    amount: 20, 
    applicableClass: 'All Classes', 
    description: 'Infirmary medical supplies, first-aid treatment, emergency nursing, and campus sanitation.',
    frequency: 'Termly', 
    mandatory: true, 
    isActive: true 
  },
  { 
    id: 'fo-8', 
    code: 'SRV-BUS', 
    name: 'School Bus Transit Service (Optional)', 
    category: 'Transport', 
    amount: 200, 
    applicableClass: 'All Classes', 
    description: 'Safe morning pick-up and afternoon drop-off bus service on designated school routes.',
    frequency: 'Termly', 
    mandatory: false, 
    isActive: true 
  },
  { 
    id: 'fo-9', 
    code: 'SRV-CAN', 
    name: 'School Feeding & Canteen Meal Plan', 
    category: 'Feeding', 
    amount: 300, 
    applicableClass: 'All Classes', 
    description: 'Nutritious daily hot lunch and fruit break prepared under strict hygienic standards.',
    frequency: 'Termly', 
    mandatory: false, 
    isActive: true 
  },
  { 
    id: 'fo-10', 
    code: 'ADM-REG', 
    name: 'New Admission & Registration Pack', 
    category: 'Administrative', 
    amount: 150, 
    applicableClass: 'New Admissions', 
    description: 'Student cumulative record file, official student badge, orientation packet, and registration fee.',
    frequency: 'One-Time', 
    mandatory: true, 
    isActive: true 
  },
  { 
    id: 'fo-11', 
    code: 'LEV-SPT', 
    name: 'Sports, Games & Cultural Activities', 
    category: 'Maintenance', 
    amount: 25, 
    applicableClass: 'All Classes', 
    description: 'Inter-house athletic sports equipment, cultural dance costumes, and inter-school sports league dues.',
    frequency: 'Termly', 
    mandatory: true, 
    isActive: true 
  }
];

export const DEFAULT_FEE_POLICY: FeePolicySettings = {
  currencySymbol: 'CFA',
  defaultPaymentTerm: 'Third Term (2025-2026)',
  allowPartPayments: true,
  minDepositPercentage: 40,
  lateFeePenaltyPercent: 5,
  siblingDiscountPercent: 10,
  scholarshipGrantActive: true,
  receiptHeaderNote: 'Official Receipt of JIPAS • Education is Wealth',
  receiptFooterNote: 'Fees once paid are non-refundable. Thank you for your continued partnership.'
};

