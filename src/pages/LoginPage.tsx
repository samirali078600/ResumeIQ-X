import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, LogIn, ShieldCheck } from 'lucide-react';
import { LandingNavbar } from '../components/layout/Navbar';
import { useAppStore } from '../store/useAppStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const authSession = useAppStore((s) => s.authSession);
  const signIn = useAppStore((s) => s.signIn);
  const addToast = useAppStore((s) => s.addToast);

  const redirectTo =
    searchParams.get('redirect') ||
    (location.state as { from?: string } | null)?.from ||
    '/workspace';
  const authRequired =
    Boolean(searchParams.get('redirect')) ||
    Boolean((location.state as { authRequired?: boolean } | null)?.authRequired);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (authSession) {
    return <Navigate to={redirectTo.startsWith('/') ? redirectTo : '/workspace'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const session = await signIn({ email, password });
      addToast({
        type: 'success',
        title: `Signed in as ${session.fullName}`,
        description: 'Workspace and Analyzer unlocked.',
      });
      navigate(redirectTo.startsWith('/') ? redirectTo : '/workspace', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
      <LandingNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          {authRequired && (
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/70 bg-indigo-50/70 dark:bg-indigo-950/30 p-4 flex items-start gap-3">
              <Lock className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-indigo-950 dark:text-indigo-200">
                Sign in or create a local account to access the Resume Analyzer, ATS Intelligence, and Workspace tools.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 sm:p-8 shadow-sm">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Sign in to ResumeIQ
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                Access your resume analyzer, ATS scoring, and local workspace.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-200"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-3.5 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>{submitting ? 'Verifying...' : 'Login'}</span>
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400">
              Don&apos;t have an account yet?{' '}
              <Link
                to={`/signup${redirectTo !== '/workspace' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Sign Up
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400 px-1">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <p>
              Browser-only authentication: credentials are salted and hashed locally via Web Crypto PBKDF2 in your browser&apos;s IndexedDB and are never sent to a remote server.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
