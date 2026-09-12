import React, { useState, useEffect } from 'react';
import { 
  FileText, DollarSign, Plus, Settings, AlertTriangle, 
  Pin, PinOff, ChevronRight, Menu, X, CheckCircle2, 
  TrendingUp, Sparkles, User, ShieldCheck, Wallet
} from 'lucide-react';
import JIPASLogo from '../common/JIPASLogo';

export type AccountantTabType = 'collections' | 'bills' | 'new-payment' | 'fee-settings' | 'overdue-alerts';

interface AccountantSidebarProps {
  activeTab: AccountantTabType;
  onSelectTab: (tab: AccountantTabType) => void;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  collectionsCount: number;
  billsCount: number;
  overdueCount: number;
  actionRequiredCount?: number;
}

export default function AccountantSidebar({
  activeTab,
  onSelectTab,
  totalCollected,
  totalOutstanding,
  collectionRate,
  collectionsCount,
  billsCount,
  overdueCount,
  actionRequiredCount = 0
}: AccountantSidebarProps) {
  // Auto hide/show on hover state
  const [isHovered, setIsHovered] = useState(false);
  // Optional pin state so user can lock sidebar open if desired (persisted across reloads)
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jipas_accountant_sidebar_pinned');
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return false;
  });
  // Mobile drawer state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('jipas_accountant_sidebar_pinned', String(isPinned));
    } catch (e) {
      console.warn('Could not store accountant sidebar pin state:', e);
    }
  }, [isPinned]);

  const isExpanded = isHovered || isPinned;

  const navItems: {
    id: AccountantTabType;
    label: string;
    sublabel: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
    isPrimaryAction?: boolean;
  }[] = [
    {
      id: 'collections',
      label: 'Collections & Receipts',
      sublabel: `${collectionsCount} verified payments`,
      icon: FileText,
      badge: collectionsCount > 0 ? collectionsCount : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'bills',
      label: 'Bills & Arrears',
      sublabel: actionRequiredCount > 0 ? `${actionRequiredCount} Action Required` : `${billsCount} student term bills`,
      icon: DollarSign,
      badge: actionRequiredCount > 0 ? `${actionRequiredCount} Action` : (billsCount > 0 ? billsCount : undefined),
      badgeColor: actionRequiredCount > 0 ? 'bg-rose-600 text-white font-black animate-pulse' : 'bg-blue-100 text-blue-800'
    },
    {
      id: 'new-payment',
      label: 'Collect Fee Payment',
      sublabel: 'Generate official receipt',
      icon: Plus,
      badge: 'New',
      badgeColor: 'bg-emerald-500 text-white',
      isPrimaryAction: true
    },
    {
      id: 'fee-settings',
      label: 'Fee Settings & Tariffs',
      sublabel: 'Configure school fee items',
      icon: Settings
    },
    {
      id: 'overdue-alerts',
      label: 'Overdue Fee Alerts',
      sublabel: 'Defaulters & SMS notices',
      icon: AlertTriangle,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse'
    }
  ];

  const handleSelect = (tab: AccountantTabType) => {
    onSelectTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* STATIC FLOATING TOGGLE ICON ON SCREEN (Docked to left edge) */}
      {/* ========================================================================= */}
      <button
        onClick={() => {
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setIsMobileOpen(true);
          } else {
            setIsPinned(prev => !prev);
          }
        }}
        title="Toggle Finance Navigation Menu"
        id="accountant-static-sidebar-open-btn"
        className="fixed left-0 top-24 z-40 bg-cyan-950/95 hover:bg-cyan-800 text-white pl-2.5 pr-3 py-2.5 rounded-r-xl shadow-2xl border-y border-r border-cyan-700 backdrop-blur-xs transition-all flex items-center gap-2 cursor-pointer group animate-fadeIn"
        aria-label="Toggle Finance Navigation Menu"
      >
        <Menu className="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors" />
        <span className="text-[11px] font-bold tracking-wide hidden sm:inline">Finance</span>
      </button>

      {/* ========================================================================= */}
      {/* MOBILE TRIGGER BAR (< lg screens) */}
      {/* ========================================================================= */}
      <div className="lg:hidden w-full bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileOpen(true)}
            id="accountant-mobile-sidebar-toggle"
            className="p-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-xl border border-cyan-200 transition-colors cursor-pointer"
            aria-label="Open Finance Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Finance Navigation</span>
            <span className="text-[10px] text-cyan-700 font-semibold uppercase tracking-wider">
              Active: {navItems.find(n => n.id === activeTab)?.label}
            </span>
          </div>
        </div>

        <button
          onClick={() => handleSelect('new-payment')}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Collect Fee</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE BACKDROP DRAWER */}
      {/* ========================================================================= */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-slate-900 text-white flex flex-col h-full shadow-2xl z-10 p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <JIPASLogo size="sm" />
                <div>
                  <h3 className="text-sm font-bold text-white">Bursary Portal</h3>
                  <span className="text-[10px] text-cyan-400 font-medium">Financial Management</span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation in mobile */}
            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-cyan-600 text-white font-bold shadow-sm' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-cyan-400'}`} />
                      <div>
                        <div className="text-xs font-semibold">{item.label}</div>
                        <div className="text-[10px] text-slate-400">{item.sublabel}</div>
                      </div>
                    </div>
                    {item.badge !== undefined && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Footer summary */}
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Collection Rate</span>
                <span className="font-bold text-cyan-300">{collectionRate}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, collectionRate)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR WITH AUTO HIDE/SHOW ON MOUSE HOVER */}
      {/* ========================================================================= */}
      <aside
        id="accountant-hover-sidebar"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden lg:flex flex-col flex-shrink-0 sticky top-24 bg-white border border-slate-200 rounded-3xl shadow-sm transition-all duration-300 ease-in-out z-20 overflow-hidden ${
          isExpanded ? 'w-72 shadow-xl border-cyan-200' : 'w-18'
        }`}
        style={{ minHeight: '520px', maxHeight: 'calc(100vh - 120px)' }}
        aria-label="Accountant Portal Sidebar"
      >
        {/* SIDEBAR HEADER */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 bg-cyan-600 text-white rounded-xl shadow-xs shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            {isExpanded && (
              <div className="overflow-hidden whitespace-nowrap animate-fadeIn">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 leading-tight">
                  Finance Portal
                </h2>
                <span className="text-[10px] text-cyan-700 font-semibold block">
                  Bursary & Accounts
                </span>
              </div>
            )}
          </div>

          {/* Pin toggle button when expanded */}
          {isExpanded && (
            <button
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? "Unpin sidebar (enable auto-hide on hover)" : "Pin sidebar open"}
              id="accountant-sidebar-pin-toggle"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                isPinned 
                  ? 'bg-cyan-100 text-cyan-700 font-bold' 
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* HOVER STATUS CHIP (Visible when expanded) */}
        {isExpanded && (
          <div className="px-3.5 pt-2 pb-1">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 bg-cyan-50/70 border border-cyan-100 rounded-lg px-2.5 py-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                {isPinned ? 'Sidebar Pinned Open' : 'Auto-hide on Hover Active'}
              </span>
              <span className="text-[9px] text-cyan-800 font-bold uppercase tracking-wider">
                {isPinned ? 'Locked' : 'Hover'}
              </span>
            </div>
          </div>
        )}

        {/* ACCOUNTANT PROFILE SUMMARY (Expanded only) */}
        {isExpanded && (
          <div className="px-3.5 py-2.5 mx-3 mt-1 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-2.5 animate-fadeIn">
            <div className="w-9 h-9 rounded-xl bg-cyan-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              DM
            </div>
            <div className="overflow-hidden whitespace-nowrap">
              <span className="text-xs font-bold text-slate-900 block truncate">Denis Mawutor</span>
              <span className="text-[10px] text-slate-500 font-medium block truncate">Accountant / Bursar</span>
            </div>
          </div>
        )}

        {/* NAVIGATION ITEMS */}
        <nav className="flex-1 p-2 space-y-1.5 overflow-y-auto mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => handleSelect(item.id)}
                title={!isExpanded ? `${item.label} (${item.sublabel})` : undefined}
                className={`w-full group flex items-center rounded-2xl transition-all cursor-pointer relative ${
                  isExpanded ? 'px-3 py-2.5 justify-between' : 'p-3 justify-center'
                } ${
                  isActive
                    ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/10'
                    : item.isPrimaryAction
                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/70'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`shrink-0 flex items-center justify-center ${
                    isActive ? 'text-white' : item.isPrimaryAction ? 'text-emerald-600' : 'text-slate-500 group-hover:text-cyan-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {isExpanded && (
                    <div className="text-left overflow-hidden whitespace-nowrap">
                      <div className={`text-xs font-bold truncate leading-tight ${
                        isActive ? 'text-white' : 'text-slate-900'
                      }`}>
                        {item.label}
                      </div>
                      <div className={`text-[10px] truncate ${
                        isActive ? 'text-cyan-100' : 'text-slate-400'
                      }`}>
                        {item.sublabel}
                      </div>
                    </div>
                  )}
                </div>

                {/* Badge rendering */}
                {item.badge !== undefined && (
                  isExpanded ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : item.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  ) : (
                    // Small dot indicator in collapsed state
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white ring-1 ring-rose-200" />
                  )
                )}
              </button>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/80">
          {isExpanded ? (
            <div className="space-y-2 animate-fadeIn">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="font-semibold">Collection Rate</span>
                  <span className="font-bold text-cyan-700">{collectionRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-cyan-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, collectionRate)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                  <span>Outstanding:</span>
                  <span className="font-mono font-bold text-rose-600">
                    {totalOutstanding.toLocaleString()} CFA
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
                <span>Move mouse away to auto-hide</span>
              </div>
            </div>
          ) : (
            // Collapsed indicator hint
            <div 
              className="flex flex-col items-center justify-center text-slate-400 hover:text-cyan-600 cursor-pointer py-1"
              title="Hover to auto-expand sidebar"
            >
              <ChevronRight className="w-4 h-4 text-cyan-600 animate-pulse" />
              <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                Hover
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
