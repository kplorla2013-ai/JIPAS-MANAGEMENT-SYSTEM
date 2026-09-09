import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Plus, UserPlus, Users, Edit3, Send, FileText, Printer, 
  CheckCircle2, Award, KeyRound, DollarSign, X, ChevronUp, Sparkles, MessageSquare
} from 'lucide-react';

interface QuickActionSpeedDialProps {
  portalType: 'admin' | 'teacher';
  onAction: (actionKey: string) => void;
}

export default function QuickActionSpeedDial({
  portalType,
  onAction
}: QuickActionSpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false);

  const adminActions = [
    {
      id: 'student_add',
      label: 'New Student Registration',
      description: 'Admit and register a new student account',
      icon: UserPlus,
      color: 'bg-indigo-500 text-white'
    },
    {
      id: 'teacher_add',
      label: 'New Teacher / Staff',
      description: 'Register staff member & assign classes',
      icon: Users,
      color: 'bg-blue-500 text-white'
    },
    {
      id: 'score_entry',
      label: 'Score & Grade Entry Terminal',
      description: 'Input SBA continuous marks & terminal exam scores',
      icon: Edit3,
      color: 'bg-emerald-500 text-white'
    },
    {
      id: 'send_notif',
      label: 'Broadcast SMS & Notifications',
      description: 'Dispatch parent alerts & fee reminders',
      icon: Send,
      color: 'bg-amber-500 text-white'
    },
    {
      id: 'create_bill',
      label: 'Generate Bill & Receive Payment',
      description: 'Issue student billing invoices or log payments',
      icon: DollarSign,
      color: 'bg-purple-500 text-white'
    },
    {
      id: 'print_reports',
      label: 'Generate Terminal Report Cards',
      description: 'Print or export official student terminal report sheets',
      icon: Printer,
      color: 'bg-rose-500 text-white'
    }
  ];

  const teacherActions = [
    {
      id: 'teacher_score_entry',
      label: 'Score & Grade Entry',
      description: 'Input subject marks & automatic grade calculation',
      icon: Edit3,
      color: 'bg-emerald-500 text-white'
    },
    {
      id: 'mark_attendance',
      label: 'Daily Class Attendance',
      description: 'Mark present, late, or absent for today',
      icon: CheckCircle2,
      color: 'bg-indigo-500 text-white'
    },
    {
      id: 'terminal_remarks',
      label: 'Character & Terminal Remarks',
      description: 'Auto-select or customize conduct & teacher comments',
      icon: Award,
      color: 'bg-purple-500 text-white'
    },
    {
      id: 'view_roster',
      label: 'Class Roster & Ranks',
      description: 'View class performance breakdown and student rankings',
      icon: FileText,
      color: 'bg-blue-500 text-white'
    },
    {
      id: 'change_password',
      label: 'Account Security',
      description: 'Update password & security settings',
      icon: KeyRound,
      color: 'bg-slate-700 text-white'
    }
  ];

  const actions = portalType === 'admin' ? adminActions : teacherActions;

  const handleSelect = (id: string) => {
    setIsOpen(false);
    onAction(id);
  };

  return (
    <div className="fixed right-6 bottom-6 z-50">
      {/* Backdrop overlay when open */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40"
        />
      )}

      <div className="relative z-50 flex flex-col items-end">
        {/* Expanded Speed Dial Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="mb-3 w-80 max-w-[calc(100vw-3rem)] bg-slate-900/95 text-white backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-700/80 space-y-2.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-extrabold text-xs uppercase tracking-wider text-slate-200">
                    {portalType === 'admin' ? 'Admin Quick Actions' : 'Teacher Quick Actions'}
                  </span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {actions.map((act) => {
                  const IconComponent = act.icon;
                  return (
                    <button
                      key={act.id}
                      onClick={() => handleSelect(act.id)}
                      className="w-full p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600/90 text-left transition-all duration-150 flex items-start gap-3 cursor-pointer group border border-slate-700/50 hover:border-indigo-400/50"
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${act.color} group-hover:scale-105 transition-transform shadow-sm`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">
                          {act.label}
                        </div>
                        <div className="text-[10px] text-slate-400 group-hover:text-slate-200 truncate mt-0.5">
                          {act.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-4 py-3 rounded-2xl font-bold text-xs text-white shadow-2xl flex items-center gap-2.5 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20 ${
            isOpen 
              ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/30 ring-4 ring-rose-500/20' 
              : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-900/40 ring-4 ring-indigo-500/20'
          }`}
        >
          {isOpen ? (
            <>
              <X className="w-5 h-5 text-white" />
              <span>Close Menu</span>
            </>
          ) : (
            <>
              <div className="relative">
                <Zap className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
              </div>
              <span className="font-black tracking-wide">Quick Actions</span>
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-md font-mono">
                ⌘K
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
