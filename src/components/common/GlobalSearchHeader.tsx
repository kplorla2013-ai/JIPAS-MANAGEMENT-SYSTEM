import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, X, User, Users, CreditCard, Settings, ChevronRight, GraduationCap, DollarSign, ArrowUpRight
} from 'lucide-react';
import { Student, Teacher, StudentBill, PaymentRecord } from '../../types';
import { searchGlobalRecords, GlobalSearchResultItem } from '../../services/searchService';

interface GlobalSearchHeaderProps {
  students: Student[];
  teachers: Teacher[];
  bills: StudentBill[];
  payments: PaymentRecord[];
  classFeeTariffs?: any[];
  navGroups?: any[];
  onNavigate: (moduleId: string, tabId?: string) => void;
  placeholder?: string;
  className?: string;
}

export default function GlobalSearchHeader({
  students,
  teachers,
  bills,
  payments,
  classFeeTariffs,
  navGroups,
  onNavigate,
  placeholder = "Search students, teachers, bills, receipts, settings...",
  className = ""
}: GlobalSearchHeaderProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'students' | 'teachers' | 'financial' | 'settings'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcut Listener (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live search results using centralized service
  const searchResults = useMemo(() => {
    return searchGlobalRecords(query, {
      students,
      teachers,
      bills,
      payments,
      navGroups,
      classFeeTariffs
    });
  }, [query, students, teachers, bills, payments, navGroups, classFeeTariffs]);

  const handleSelectResult = (item: GlobalSearchResultItem) => {
    if (item.actionModuleId) {
      onNavigate(item.actionModuleId, item.actionTab);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative z-50 ${className}`}>
      {/* Search Bar Input Container */}
      <div className="relative flex items-center bg-slate-900 border border-slate-700/80 rounded-2xl p-1.5 shadow-md focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
        <Search className="w-4 h-4 text-indigo-400 ml-2.5 mr-2 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none font-medium pr-8"
        />

        {query ? (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer mr-1"
            title="Clear Search"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700 mr-1.5 select-none shrink-0">
            <span>⌘</span>K
          </span>
        )}
      </div>

      {/* Live Dropdown Search Results Overlay */}
      <AnimatePresence>
        {isOpen && query.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-13 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-4 text-white max-h-[75vh] overflow-y-auto space-y-3 z-50"
          >
            {/* Header with Result Count and Category Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <span className="text-xs text-slate-400">
                Found <strong className="text-indigo-400">{searchResults.totalCount}</strong> results for "{query}"
              </span>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-[11px] font-bold">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({searchResults.totalCount})
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'students' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Students ({searchResults.students.length})
                </button>
                <button
                  onClick={() => setActiveTab('teachers')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'teachers' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Teachers ({searchResults.teachers.length})
                </button>
                <button
                  onClick={() => setActiveTab('financial')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'financial' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Financial ({searchResults.financial.length})
                </button>
              </div>
            </div>

            {/* Zero Matches State */}
            {searchResults.totalCount === 0 && (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <Search className="w-8 h-8 mx-auto text-slate-600" />
                <p className="font-bold text-sm text-slate-300">No matching records found</p>
                <p className="text-xs">Try searching by student name, admission number, teacher name, receipt ID, or class.</p>
              </div>
            )}

            {/* 1. Students Results */}
            {(activeTab === 'all' || activeTab === 'students') && searchResults.students.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                  <GraduationCap className="w-3.5 h-3.5" /> Students ({searchResults.students.length})
                </h4>
                {searchResults.students.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectResult(item)}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-800/70 hover:bg-indigo-600/20 rounded-xl border border-slate-700/60 hover:border-indigo-500 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-500/30">
                        {item.title.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-800 shrink-0 flex items-center gap-1">
                      View Student <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* 2. Teachers Results */}
            {(activeTab === 'all' || activeTab === 'teachers') && searchResults.teachers.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                  <User className="w-3.5 h-3.5" /> Teachers & Faculty ({searchResults.teachers.length})
                </h4>
                {searchResults.teachers.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectResult(item)}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-800/70 hover:bg-emerald-600/20 rounded-xl border border-slate-700/60 hover:border-emerald-500 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-500/30">
                        {item.title.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-white group-hover:text-emerald-300 truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800 shrink-0 flex items-center gap-1">
                      Faculty Profile <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* 3. Financial Results */}
            {(activeTab === 'all' || activeTab === 'financial') && searchResults.financial.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                  <CreditCard className="w-3.5 h-3.5" /> Financial Bills & Receipts ({searchResults.financial.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchResults.financial.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectResult(item)}
                      className="flex items-center justify-between p-2.5 bg-slate-800/70 hover:bg-amber-600/20 rounded-xl border border-slate-700/60 hover:border-amber-500 text-left transition-all cursor-pointer group"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-white group-hover:text-amber-300 truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>
                      </div>
                      <span className="font-mono text-xs font-black text-amber-400 shrink-0 bg-amber-950 px-2 py-1 rounded-md border border-amber-800">
                        {item.badgeText}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Settings Results */}
            {(activeTab === 'all' || activeTab === 'settings') && searchResults.settings.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <h4 className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                  <Settings className="w-3.5 h-3.5" /> Settings & System Modules ({searchResults.settings.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchResults.settings.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectResult(item)}
                      className="flex items-center justify-between p-2 bg-slate-800/70 hover:bg-cyan-600/20 rounded-xl border border-slate-700/60 hover:border-cyan-500 text-left transition-all cursor-pointer group"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
