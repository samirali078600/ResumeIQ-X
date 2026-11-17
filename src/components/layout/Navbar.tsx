import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, MoreVertical, X } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAppStore } from '../../store/useAppStore';

function ThreeDotQuickMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const authSession = useAppStore((s) => s.authSession);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const menuLinks = authSession
    ? [
        { to: '/', label: 'Home' },
        { to: '/workspace', label: 'Workspace Dashboard' },
        { to: '/analyzer', label: 'Resume Analyzer' },
        { to: '/job-matching', label: 'Job Matching' },
        { to: '/resume-builder', label: 'Resume Builder' },
        { to: '/about', label: 'About' },
        { to: '/contact', label: 'Contact' },
      ]
    : [
        { to: '/', label: 'Home' },
        { to: '/analyzer', label: 'Analyzer (Login Required)' },
        { to: '/about', label: 'About' },
        { to: '/contact', label: 'Contact' },
        { to: '/login', label: 'Login' },
        { to: '/signup', label: 'Sign Up' },
      ];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Quick navigation menu"
        aria-expanded={open}
        title="Quick menu"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600 shrink-0"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1.5 z-50"
        >
          {menuLinks.map((item) => (
            <Link
              key={item.to + item.label}
              to={item.to}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const authSession = useAppStore((s) => s.authSession);
  const signOut = useAppStore((s) => s.signOut);
  const addToast = useAppStore((s) => s.addToast);
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    setMobileMenuOpen(false);
    addToast({ type: 'info', title: 'Signed out' });
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4 ${
      isActive
        ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#090F1E]/95 backdrop-blur-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <Link
          to="/"
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          ResumeIQ X
        </Link>

        {/* Zone 2: Primary Top Navigation Links (Home, Analyzer, About, Contact) */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7 text-sm font-medium">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/analyzer" className={navLinkClass}>
            Analyzer
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>
        </nav>

        {/* Zone 3: Auth Actions (Login / Sign Up or Workspace / Sign Out) + Theme Toggle + Three-Dot Menu */}
        <div className="flex items-center gap-2.5 shrink-0">
          <ThemeToggle compact />
          <ThreeDotQuickMenu />

          {authSession ? (
            <>
              <Link
                to="/workspace"
                className="hidden sm:inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                Workspace
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="hidden sm:inline-flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0"
              >
                Sign Up
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D16] px-4 py-4 space-y-3">
          <div className="flex flex-col space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="py-1.5">
              Home
            </Link>
            <Link to="/analyzer" onClick={() => setMobileMenuOpen(false)} className="py-1.5">
              Analyzer
            </Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="py-1.5">
              About
            </Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="py-1.5">
              Contact
            </Link>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
            {authSession ? (
              <>
                <Link
                  to="/workspace"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-medium"
                >
                  Workspace
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-center rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-sm font-medium text-white"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

interface WorkspaceNavbarProps {
  onOpenMobileNav: () => void;
}

export function WorkspaceNavbar({ onOpenMobileNav }: WorkspaceNavbarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const authSession = useAppStore((s) => s.authSession);
  const signOut = useAppStore((s) => s.signOut);
  const addToast = useAppStore((s) => s.addToast);

  const pageLabelMap: Record<string, string> = {
    '/workspace': 'Workspace Dashboard',
    '/analyzer': 'Resume Analyzer',
    '/ats-intelligence': 'ATS Intelligence',
    '/nlp-laboratory': 'Language Laboratory',
    '/job-matching': 'Job Matching',
    '/resume-builder': 'Resume Builder',
    '/templates': 'Resume Templates',
    '/cover-letter-studio': 'Cover Letter Studio',
    '/career-intelligence': 'Career Intelligence',
    '/skills-gap': 'Skills Gap Analysis',
    '/resume-comparison': 'Resume Comparison',
    '/analysis-history': 'Analysis History',
    '/reports': 'Reports Center',
    '/profile': 'Local Profile',
    '/settings': 'Settings',
    '/about': 'About',
    '/contact': 'Contact',
  };

  const title = pageLabelMap[pathname] || 'ResumeIQ X';

  const handleSignOut = () => {
    signOut();
    addToast({ type: 'info', title: 'Signed out' });
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#090F1E]/95 backdrop-blur-xs no-print">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Link
              to="/"
              className="hidden sm:inline text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
            >
              Home
            </Link>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700" aria-hidden="true">
              /
            </span>
            <Link
              to="/workspace"
              className="hidden sm:inline text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
            >
              Workspace
            </Link>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700" aria-hidden="true">
              /
            </span>
            <span className="font-semibold text-slate-900 dark:text-white truncate">
              {title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {authSession && (
            <span className="hidden md:inline text-xs font-medium text-slate-600 dark:text-slate-400 truncate max-w-[160px]">
              {authSession.fullName}
            </span>
          )}
          <ThemeToggle compact />
          <ThreeDotQuickMenu />
          <Link
            to="/analyzer"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0"
          >
            Analyze Resume
          </Link>
          {authSession && (
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
