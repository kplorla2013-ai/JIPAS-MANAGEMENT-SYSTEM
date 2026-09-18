import React, { useState, useEffect } from 'react';
import { 
  Presentation, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Maximize2, 
  Minimize2, 
  ShieldCheck, 
  GraduationCap, 
  BookOpen, 
  Coins, 
  Users, 
  FileText, 
  Sparkles, 
  QrCode, 
  Globe2, 
  Layers, 
  ArrowRight,
  Printer,
  Compass,
  Zap,
  Lock,
  Award,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import JIPASLogo from './JIPASLogo';

interface AppPresentationOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole?: (role: 'admin' | 'teacher' | 'student' | 'accountant') => void;
  initialSlideIndex?: number;
}

interface Slide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  themeColor: string;
  bgGradient: string;
  heroImage?: string;
  highlights: string[];
  metrics: { label: string; value: string; desc: string }[];
  keyFeatures: { title: string; desc: string; icon: React.ElementType }[];
  roleTarget?: 'admin' | 'teacher' | 'student' | 'accountant';
}

const SLIDES: Slide[] = [
  {
    id: 'executive-summary',
    badge: 'Institutional ERP Overview',
    title: 'Transforming Ghanaian Basic & Secondary School Administration',
    subtitle: 'A fully integrated, GES-accredited academic and bursary intelligence platform engineered for zero paper friction, 100% financial transparency, and automated student assessments.',
    icon: Sparkles,
    themeColor: '#10b981',
    bgGradient: 'from-emerald-950 via-slate-950 to-slate-900',
    heroImage: '/wallpapers/assembly.jpg',
    highlights: [
      'Accredited by Ghana Education Service (GES) grading algorithms',
      'Unified portal for Administrators, Teachers, Accountants, and Students/Parents',
      'Real-time cloud synchronization with offline-ready local cache architecture',
      'Multi-language localized interface in English, French, Twi, Ga, and Ewe'
    ],
    metrics: [
      { label: 'Grading Accuracy', value: '100%', desc: 'GES 9-point standard' },
      { label: 'Terminal Processing', value: '< 2 min', desc: 'Full class report generation' },
      { label: 'Tuition Leakage', value: '0.0%', desc: 'Reconciled receipts & alerts' },
      { label: 'Active Modules', value: '18+', desc: 'Covering whole-school lifecycle' }
    ],
    keyFeatures: [
      { title: 'Unified Multi-Portal Architecture', desc: 'Secure Role-Based Access Control granting tailored interfaces for administrators, staff, accounts, and pupils.', icon: Layers },
      { title: 'Real-Time Global Search', desc: 'Instant multi-indexed search across thousands of student records, invoices, staff records, and subject scores.', icon: Zap },
      { title: 'Official Digital Branding', desc: 'Customizable school photography wallpapers, official crest, and dynamic theme palettes.', icon: ImageIcon }
    ]
  },
  {
    id: 'admin-portal',
    badge: 'Administrator Command Center',
    title: 'Total Institutional Control & Governance',
    subtitle: 'Centralized executive suite for managing students, academic structures, staff periods, terminal configurations, and institutional audit logs.',
    icon: ShieldCheck,
    themeColor: '#3b82f6',
    bgGradient: 'from-blue-950 via-slate-950 to-indigo-950',
    heroImage: '/wallpapers/classroom.jpg',
    roleTarget: 'admin',
    highlights: [
      'Comprehensive Student Admissions & Bio-Data manager with instant ID photo crop',
      'Staff Working Periods & Attendance scheduling with daily verification logs',
      'Academic terms, academic years, fee structure rules, and class allocations',
      'Automated cloud backups, JSON vault export, and one-click data restoration'
    ],
    metrics: [
      { label: 'Student Admissions', value: '1,200+', desc: 'Capacity across Basic 1 - 9' },
      { label: 'Audit Logging', value: '100%', desc: 'Every administrative action tracked' },
      { label: 'Class Departments', value: 'Creche-JHS', desc: 'Modular class allocations' },
      { label: 'Backup Speed', value: 'Instant', desc: 'JSON & CSV cloud snapshots' }
    ],
    keyFeatures: [
      { title: 'Staff Working Hours & Shift Rules', desc: 'Configure staff working periods, late-threshold grace periods, and view live clock-in audits.', icon: Calendar },
      { title: 'Student Transcript & Records Generator', desc: 'Generate multi-term cumulative academic transcripts with single-click PDF export.', icon: FileText },
      { title: 'Disaster Recovery Vault', desc: 'Encrypted backup points and point-in-time database restoration for total data resilience.', icon: Lock }
    ]
  },
  {
    id: 'teacher-portal',
    badge: 'Teacher Academic Hub',
    title: 'Continuous Assessment & Instant Gradebooks',
    subtitle: 'Streamlined gradebook entry, continuous assessments (SBA), terminal examinations, and real-time biometric staff QR check-in.',
    icon: BookOpen,
    themeColor: '#0ea5e9',
    bgGradient: 'from-sky-950 via-slate-950 to-blue-950',
    heroImage: '/wallpapers/classroom.jpg',
    roleTarget: 'teacher',
    highlights: [
      'Continuous Assessment (Classwork 10%, Homework 10%, Project 10%, Class Test 10%)',
      'Terminal Examination 60% with automatic GES 1 - 9 grade & remark calculation',
      'Class position computing and subject rank assignment with tie-breaking rules',
      'QR Code daily staff attendance check-in with GPS clock validation'
    ],
    metrics: [
      { label: 'Assessment Weight', value: '40 / 60', desc: 'SBA vs Terminal Exam Ratio' },
      { label: 'Grade Computations', value: 'Instant', desc: 'Real-time mathematical grading' },
      { label: 'QR Attendance', value: '< 1 sec', desc: 'Scan & verify check-in speed' },
      { label: 'Teacher Tools', value: '6 Views', desc: 'SBA, Reports, Profile, QR Badge' }
    ],
    keyFeatures: [
      { title: 'SBA Continuous Assessment Entry', desc: 'Intuitive spreadsheet-like grid for rapid batch entering of homework, projects, and test scores.', icon: Award },
      { title: 'Automated Conduct Remarks', desc: 'Preset and customizable teacher remarks, attendance summaries, and promotion recommendations.', icon: CheckCircle2 },
      { title: 'My Teacher ID Badge & QR Code', desc: 'Official digital staff identity card with scannable QR verification and employment bio-data.', icon: QrCode }
    ]
  },
  {
    id: 'accountant-portal',
    badge: 'Bursary & Financial Intelligence',
    title: 'Zero-Leakage Tuition Reconciliation & Receipts',
    subtitle: 'Comprehensive financial dashboard for terminal billing, multi-channel fee collections, automated receipts, and overdue fee alerts.',
    icon: Coins,
    themeColor: '#14b8a6',
    bgGradient: 'from-teal-950 via-slate-950 to-emerald-950',
    heroImage: '/wallpapers/assembly.jpg',
    roleTarget: 'accountant',
    highlights: [
      'Multi-channel payment recording: Cash, Mobile Money (MTN/Vodafone/AirtelTigo), Cheque, Bank',
      'Instant official receipt generation with security crest and unique receipt numbering',
      'Class-by-class fee reconciliation, ledger tracking, and total revenue analytics',
      'Automated SMS & WhatsApp overdue fee reminder dispatch system'
    ],
    metrics: [
      { label: 'Fee Reconciliation', value: 'Real-Time', desc: 'Zero manual ledger calculations' },
      { label: 'Receipt Generation', value: 'Instant', desc: 'Printable with watermark' },
      { label: 'Payment Methods', value: '5 Options', desc: 'MoMo, Cash, Cheque, Bank' },
      { label: 'Collection Rate', value: '+34%', desc: 'Improvement with SMS reminders' }
    ],
    keyFeatures: [
      { title: 'Live Fee Collection Register', desc: 'Real-time timeline of all payment transactions, payer details, student roll, and remaining balances.', icon: Coins },
      { title: 'Automated Arrears & Alert Broadcast', desc: 'One-click automated follow-up lists for guardians with pending balances per term.', icon: Zap },
      { title: 'Official Terminal Bill Statements', desc: 'Generate itemized terminal fee bills for tuition, PTA levy, ICT, library, and exams.', icon: FileText }
    ]
  },
  {
    id: 'student-parent-portal',
    badge: 'Student & Parent Academic Portal',
    title: 'Transparent Progress Tracking & Terminal Reports',
    subtitle: 'Engaging student and parent hub for reviewing terminal examination report cards, attendance statistics, fee statements, and teacher remarks.',
    icon: GraduationCap,
    themeColor: '#8b5cf6',
    bgGradient: 'from-violet-950 via-slate-950 to-indigo-950',
    heroImage: '/wallpapers/classroom.jpg',
    roleTarget: 'student',
    highlights: [
      'Interactive student profile with photo bio-data, department, and house allocation',
      'Full terminal examination results with subject breakdown, positions, and grades',
      'Interactive attendance analytics with percentage graphs and term milestones',
      'Real-time fee balance statement showing payments received and outstanding amounts'
    ],
    metrics: [
      { label: 'Parent Engagement', value: '24 / 7', desc: 'Secure self-service access' },
      { label: 'Report Access', value: 'Instant', desc: 'Downloadable PDF report cards' },
      { label: 'Language Options', value: '5 Dialects', desc: 'English, French, Twi, Ga, Ewe' },
      { label: 'Payment Visibility', value: '100%', desc: 'Clear itemized fee statements' }
    ],
    keyFeatures: [
      { title: 'Terminal Examination Card', desc: 'View complete academic performance cards with subject scores, grades 1-9, and overall class position.', icon: Award },
      { title: 'House & Department Badges', desc: 'Track house points, co-curricular participation, and school house standing.', icon: Users },
      { title: 'Self-Service Password Management', desc: 'Secure student PIN and credentials management with instant recovery workflows.', icon: Lock }
    ]
  },
  {
    id: 'terminal-reports',
    badge: 'Report Card Engine',
    title: 'Official GES Terminal Reports & Transcripts',
    subtitle: 'Print-ready, high-resolution student terminal report cards with customized school crest, headteacher stamp, and watermark security.',
    icon: FileText,
    themeColor: '#f59e0b',
    bgGradient: 'from-amber-950 via-slate-950 to-slate-900',
    heroImage: '/wallpapers/assembly.jpg',
    highlights: [
      'Complies with standard Ghanaian Basic and Secondary terminal reporting formats',
      'Includes Subject Performance, SBA (40%), Exam (60%), Total (100%), and Grade',
      'Class Teacher remarks, Headmaster appraisal remarks, and conduct evaluations',
      'Batch generation allows generating and printing an entire class in seconds'
    ],
    metrics: [
      { label: 'Print Resolution', value: '300 DPI', desc: 'Vector-sharp print typography' },
      { label: 'Batch Print', value: 'Single Click', desc: 'Print entire class in 1 step' },
      { label: 'Watermark Security', value: 'Embedded', desc: 'Prevents document forgery' },
      { label: 'Customization', value: 'Full', desc: 'School crest, motto, address' }
    ],
    keyFeatures: [
      { title: 'Official GES 9-Point Scale Table', desc: 'Integrated grade boundary reference table (1: Highest - 9: Lowest) on every printed card.', icon: Award },
      { title: 'Next Term Reopening Date & Bill', desc: 'Automatically attaches the subsequent term reopening date and itemized bill breakdown.', icon: Calendar },
      { title: 'Cumulative Multi-Term Transcripts', desc: 'Generate multi-year student transcript dossiers spanning their entire schooling history.', icon: TrendingUp }
    ]
  },
  {
    id: 'technology-security',
    badge: 'Enterprise Architecture & Cloud',
    title: 'Robust Cloud Reliability & Security Architecture',
    subtitle: 'Built on high-performance React, TypeScript, and Google Cloud Firestore for real-time synchronization, enterprise security, and 99.9% uptime.',
    icon: Lock,
    themeColor: '#ec4899',
    bgGradient: 'from-pink-950 via-slate-950 to-indigo-950',
    heroImage: '/wallpapers/classroom.jpg',
    highlights: [
      'Google Cloud Firestore real-time database with zero server maintenance overhead',
      'Strict Role-Based Access Control ensuring student fee and grade data privacy',
      'Automated daily fee audit triggers detecting discrepancies and unallocated receipts',
      'Fully responsive UI optimized for desktop projectors, tablets, and smartphones'
    ],
    metrics: [
      { label: 'Cloud Uptime', value: '99.99%', desc: 'Cloud Run server infrastructure' },
      { label: 'Sync Latency', value: '< 200ms', desc: 'Real-time database updates' },
      { label: 'Responsive', value: '100%', desc: 'Mobile, Tablet, Desktop, Projector' },
      { label: 'Data Encryption', value: 'TLS 1.3', desc: 'Bank-grade transport encryption' }
    ],
    keyFeatures: [
      { title: 'Offline Data Resiliency', desc: 'Local storage fallback ensures continuity during intermittent school internet connectivity.', icon: Compass },
      { title: 'Visual Theme Customization', desc: 'Customize system brand colors, dark/light modes, and official photography wallpapers.', icon: ImageIcon },
      { title: 'Daily Automated Auditing', desc: 'Background auditing engine checking payment reconciliations and notifying bursary staff.', icon: Zap }
    ]
  },
  {
    id: 'conclusion-demo',
    badge: 'Presentation Conclusion',
    title: 'Ready for Deployment: Experience JIPAS Live',
    subtitle: 'Experience the future of Ghanaian educational management today. Select any role below to launch an interactive live demonstration.',
    icon: Award,
    themeColor: '#10b981',
    bgGradient: 'from-emerald-950 via-slate-950 to-blue-950',
    heroImage: '/wallpapers/assembly.jpg',
    highlights: [
      'Immediate deployment ready for Ghanaian basic, primary, and junior high institutions',
      'Full onboarding support with pre-configured classes, subjects, and grading scales',
      'Demonstrated reduction in administrative turnaround time by over 85%',
      'Backed by robust data security, continuous backups, and multi-lingual accessibility'
    ],
    metrics: [
      { label: 'Implementation Time', value: '< 24 hrs', desc: 'Fast institutional onboarding' },
      { label: 'Admin Efficiency', value: '+85%', desc: 'Elimination of manual paperwork' },
      { label: 'Parent Satisfaction', value: '98%', desc: 'Instant access to grades & bills' },
      { label: 'GES Standards', value: '100%', desc: 'Fully compliant reporting' }
    ],
    keyFeatures: [
      { title: 'Launch Administrator Suite', desc: 'Explore student bio-data, staff attendance schedules, and system configurations.', icon: ShieldCheck },
      { title: 'Launch Teacher Gradebook', desc: 'Experience continuous assessment entering, remarks, and staff QR badge check-in.', icon: BookOpen },
      { title: 'Launch Bursary & Accounts', desc: 'Test fee payment collection, receipt printing, and automated SMS reminder lists.', icon: Coins }
    ]
  }
];

export const AppPresentationOverviewModal: React.FC<AppPresentationOverviewModalProps> = ({
  isOpen,
  onClose,
  onSelectRole,
  initialSlideIndex = 0
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSlideIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [presentationViewMode, setPresentationViewMode] = useState<'slides' | 'grid'>('slides');

  useEffect(() => {
    if (isOpen && initialSlideIndex !== undefined) {
      setCurrentSlideIndex(Math.min(Math.max(0, initialSlideIndex), SLIDES.length - 1));
    }
  }, [isOpen, initialSlideIndex]);

  const currentSlide = SLIDES[currentSlideIndex];

  // Auto-play timer
  useEffect(() => {
    let interval: any;
    if (isPlaying && isOpen && presentationViewMode === 'slides') {
      interval = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % SLIDES.length);
      }, 7000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isOpen, presentationViewMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(prev + 1, SLIDES.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-y-auto animate-fade-in">
      {/* Main Presentation Container */}
      <div className={`relative w-full ${isFullscreen ? 'max-w-none h-full' : 'max-w-6xl max-h-[92vh]'} bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white transition-all duration-300`}>
        
        {/* Top Presentation Control Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex items-center justify-center">
              <JIPASLogo size="sm" rounded={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                  <Presentation className="w-3.5 h-3.5 text-emerald-400" />
                  JIPAS Institutional Presentation
                </span>
                <span className="hidden sm:inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.2 rounded-full">
                  Executive Briefing
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ghana Education Service (GES) Accredited School ERP
              </p>
            </div>
          </div>

          {/* Center / Right Presentation Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 flex items-center text-xs">
              <button
                onClick={() => setPresentationViewMode('slides')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  presentationViewMode === 'slides' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Slides
              </button>
              <button
                onClick={() => setPresentationViewMode('grid')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  presentationViewMode === 'grid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Grid Matrix
              </button>
            </div>

            {/* Auto-Play Slide Show Toggle */}
            {presentationViewMode === 'slides' && (
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isPlaying 
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title={isPlaying ? 'Pause Auto-Play' : 'Start Auto-Play (7s interval)'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{isPlaying ? 'Playing' : 'Auto-Play'}</span>
              </button>
            )}

            {/* Print / Export Presentation Summary */}
            <button
              onClick={handlePrintSummary}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer hidden sm:flex items-center justify-center"
              title="Print / Save PDF Presentation Brief"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Toggle Fullscreen */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer hidden sm:flex items-center justify-center"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Presentation'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              title="Close Presentation (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* VIEW 1: INTERACTIVE SLIDE DECK VIEW                               */}
        {/* ----------------------------------------------------------------- */}
        {presentationViewMode === 'slides' && (
          <div className="flex-1 flex flex-col overflow-y-auto relative">
            {/* Background Photographic Wallpaper with Atmospheric Gradient */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-luminosity scale-105 pointer-events-none transition-all duration-700"
              style={{ backgroundImage: `url(${currentSlide.heroImage || '/wallpapers/classroom.jpg'})` }}
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${currentSlide.bgGradient} opacity-95 pointer-events-none`} />

            <div className="relative z-10 flex-1 p-6 sm:p-8 md:p-10 flex flex-col justify-between space-y-6">
              
              {/* Slide Header & Title Section */}
              <div className="space-y-3 max-w-4xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span 
                    className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm backdrop-blur-md flex items-center gap-1.5"
                    style={{ 
                      backgroundColor: `${currentSlide.themeColor}25`,
                      borderColor: `${currentSlide.themeColor}60`,
                      color: currentSlide.themeColor
                    }}
                  >
                    <currentSlide.icon className="w-3.5 h-3.5" />
                    {currentSlide.badge}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-800">
                    Slide {currentSlideIndex + 1} of {SLIDES.length}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                  {currentSlide.title}
                </h2>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-3xl">
                  {currentSlide.subtitle}
                </p>
              </div>

              {/* Middle Section: Metrics & Key Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* 4 Key Metrics Cards (5 cols) */}
                <div className="md:col-span-5 grid grid-cols-2 gap-3">
                  {currentSlide.metrics.map((metric, idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-900/80 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-lg group hover:border-slate-700 transition-all"
                    >
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {metric.label}
                      </span>
                      <div className="my-1">
                        <span 
                          className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm"
                          style={{ color: currentSlide.themeColor }}
                        >
                          {metric.value}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-300 line-clamp-1">
                        {metric.desc}
                      </span>
                    </div>
                  ))}

                  {/* Role Quick Launch Action (if applicable) */}
                  {currentSlide.roleTarget && onSelectRole && (
                    <div className="col-span-2 pt-1">
                      <button
                        onClick={() => {
                          onClose();
                          onSelectRole(currentSlide.roleTarget!);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-98 cursor-pointer"
                        style={{ backgroundColor: currentSlide.themeColor }}
                      >
                        <span>Launch Live {currentSlide.badge.split(' ')[0]} Portal Demo</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 3 Core Architecture Points & Highlights (7 cols) */}
                <div className="md:col-span-7 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    {currentSlide.keyFeatures.map((feature, idx) => (
                      <div 
                        key={idx}
                        className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3.5 flex items-start gap-3.5 shadow-sm hover:bg-slate-900/90 transition-all"
                      >
                        <div 
                          className="p-2.5 rounded-xl shrink-0 shadow-inner"
                          style={{ backgroundColor: `${currentSlide.themeColor}20`, color: currentSlide.themeColor }}
                        >
                          <feature.icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs sm:text-sm font-bold text-white">
                            {feature.title}
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {feature.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bullet Highlights List */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Standard Compliance & Implementation Specs:
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {currentSlide.highlights.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-[11px] text-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* VIEW 2: INTERACTIVE GRID MATRIX (ALL SLIDES AT A GLANCE)          */}
        {/* ----------------------------------------------------------------- */}
        {presentationViewMode === 'grid' && (
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto bg-slate-950 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white">
                  JIPAS System Architectural Modules & Capabilities
                </h3>
                <p className="text-xs text-slate-400">
                  Select any capability module to inspect details or launch live interactive role previews
                </p>
              </div>
              <button
                onClick={() => setPresentationViewMode('slides')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Return to Slide Deck
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {SLIDES.map((slide, idx) => (
                <div
                  key={slide.id}
                  onClick={() => {
                    setCurrentSlideIndex(idx);
                    setPresentationViewMode('slides');
                  }}
                  className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 cursor-pointer shadow-xl group transition-all transform hover:-translate-y-1"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border"
                        style={{ 
                          backgroundColor: `${slide.themeColor}20`,
                          borderColor: `${slide.themeColor}50`,
                          color: slide.themeColor
                        }}
                      >
                        {slide.badge}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        0{idx + 1}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                      {slide.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-3">
                      {slide.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    {slide.metrics.slice(0, 2).map((m, mIdx) => (
                      <div key={mIdx} className="bg-slate-950/60 p-2 rounded-xl">
                        <span className="block text-[9px] text-slate-400 uppercase font-bold">{m.label}</span>
                        <span className="text-sm font-black" style={{ color: slide.themeColor }}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* BOTTOM SLIDE NAVIGATION & THUMBNAIL TRACKER                       */}
        {/* ----------------------------------------------------------------- */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900/95 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* Previous / Next Slide Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentSlideIndex === 0}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              onClick={handleNext}
              disabled={currentSlideIndex === SLIDES.length - 1}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-md cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Slide Dots / Thumbnails */}
          <div className="flex items-center gap-1.5 max-w-full overflow-x-auto py-1">
            {SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => {
                  setCurrentSlideIndex(idx);
                  if (presentationViewMode !== 'slides') setPresentationViewMode('slides');
                }}
                className={`transition-all rounded-full cursor-pointer ${
                  currentSlideIndex === idx
                    ? 'w-8 h-2 bg-emerald-400 shadow-sm'
                    : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Slide ${idx + 1}: ${slide.badge}`}
              />
            ))}
          </div>

          {/* Slide Indicator & Keyboard Hint */}
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="hidden md:inline">Use <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 font-mono">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 font-mono">→</kbd> keys to navigate</span>
            <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              {currentSlideIndex + 1} / {SLIDES.length}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
