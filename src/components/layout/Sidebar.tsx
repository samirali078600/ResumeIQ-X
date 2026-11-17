import { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, X } from 'lucide-react';
import { NAV_GROUPS, WORKSPACE_NAV_ITEMS } from './navigation';
import { useAppStore } from '../../store/useAppStore';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const setCollapsed = useAppStore((s) => s.setSidebarCollapsed);
  const profile = useAppStore((s) => s.profile);
  const activeAnalysis = useAppStore((s) => s.activeAnalysis);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen, onCloseMobile]);

  const navContent = (isMobile: boolean) => (
    <div className="flex h-full flex-col bg-white dark:bg-[#090F1E] border-r border-slate-200/90 dark:border-slate-800/80">
      {/* Brand header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200/90 dark:border-slate-800/80 shrink-0">
        <Link
          to="/"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-extrabold text-white shadow-xs">
            RX
          </span>
          {(!collapsed || isMobile) && <span>ResumeIQ X</span>}
        </Link>
        {isMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Navigation groups */}
      <nav aria-label="Workspace navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group) => {
          const items = WORKSPACE_NAV_ITEMS.filter((it) => it.group === group);
          return (
            <div key={group}>
              {(!collapsed || isMobile) && (
                <p className="px-3 mb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500">
                  {group}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onCloseMobile}
                      title={collapsed && !isMobile ? item.label : undefined}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {(!collapsed || isMobile) && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Active session + Local workspace footer */}
      {(!collapsed || isMobile) && (
        <div className="p-3.5 border-t border-slate-200/90 dark:border-slate-800/80 space-y-2.5 shrink-0">
          {activeAnalysis && (
            <Link
              to="/analyzer"
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 px-3 py-2 border border-indigo-200/70 dark:border-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-700 transition-colors"
            >
              <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                  {activeAnalysis.fileName}
                </p>
                <p className="text-[10px] font-mono tabular-nums text-indigo-700 dark:text-indigo-300">
                  ATS {activeAnalysis.ats.overallScore}/100 · {activeAnalysis.nlp.skills.found.length} skills
                </p>
              </div>
            </Link>
          )}
          <Link
            to="/profile"
            onClick={onCloseMobile}
            className="block rounded-lg bg-slate-50 dark:bg-[#0D1526] px-3 py-2.5 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
          >
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {profile.displayName || 'Local Workspace'}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {profile.careerTarget || 'Browser-only profile'}
            </p>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-[width] duration-200 no-print ${
          collapsed ? 'w-[74px]' : 'w-[256px]'
        }`}
      >
        <div className="sticky top-0 h-screen">{navContent(false)}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print" role="dialog" aria-modal="true" aria-label="Workspace navigation drawer">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">{navContent(true)}</div>
        </div>
      )}
    </>
  );
}
