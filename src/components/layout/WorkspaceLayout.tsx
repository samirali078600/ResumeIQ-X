import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Briefcase, FileCheck2, History, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { WorkspaceNavbar } from './Navbar';
import { useAppStore } from '../../store/useAppStore';

interface WorkspaceLayoutProps {
  children: ReactNode;
}

const MOBILE_BOTTOM_LINKS = [
  { to: '/workspace', label: 'Home', icon: LayoutDashboard },
  { to: '/analyzer', label: 'Analyze', icon: FileCheck2 },
  { to: '/ats-intelligence', label: 'ATS', icon: ShieldCheck },
  { to: '/job-matching', label: 'Match', icon: Briefcase },
  { to: '/analysis-history', label: 'History', icon: History },
];

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const storageError = useAppStore((s) => s.storageError);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#060A13] text-slate-900 dark:text-slate-100">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-14 lg:pb-0">
        <WorkspaceNavbar onOpenMobileNav={() => setMobileNavOpen(true)} />

        {storageError && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-4 sm:px-6 lg:px-8 py-2.5 text-xs text-amber-900 dark:text-amber-200 no-print">
            {storageError}
          </div>
        )}

        <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>

      {/* Compact Mobile Bottom Quick Navigation (respecting <=15% sticky height cap) */}
      <nav
        aria-label="Mobile quick navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-12 border-t border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-[#090F1E]/95 backdrop-blur-xs grid grid-cols-5 no-print"
      >
        {MOBILE_BOTTOM_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
