import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
      <div className="max-w-md w-full text-center space-y-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
        <p className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">404</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Page not found
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          The requested route does not exist in ResumeIQ X. Return to the landing page or your local workspace.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <Link
            to="/workspace"
            className="inline-flex items-center rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
