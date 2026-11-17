import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '../components/layout/Navbar';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { useAppStore } from '../store/useAppStore';

function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
      <LandingNavbar />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {children}
      </main>
    </div>
  );
}

export default function AboutPage() {
  const authSession = useAppStore((s) => s.authSession);

  const content = (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          About ResumeIQ X
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Your Career. Analyzed. Optimized. Elevated. — Transparent, browser-based resume intelligence.
        </p>
      </div>

      <Card>
        <CardHeader title="Architecture &amp; Methodology" />
        <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            ResumeIQ X runs entirely inside your web browser. There is no server-side database, no external tracking backend, and no external third-party cloud service collecting or processing your personal documents.
          </p>
          <p>
            <strong>Document Parsing:</strong> PDF files are extracted via Mozilla PDF.js using coordinate-aware line reconstruction, DOCX files via Mammoth.js, and TXT files via UTF-8 decoding. If a PDF contains only scanned images without an embedded text layer, ResumeIQ X notifies you explicitly rather than simulating OCR.
          </p>
          <p>
            <strong>Hybrid NLP Transparency:</strong> Core analysis relies on deterministic regular expressions, Compromise.js part-of-speech heuristics, Porter-style stemming, n-gram extraction, TF-IDF vectorization, and cosine similarity. Because keyword matching and TF-IDF do not constitute full human language comprehension, every view clearly labels the method behind each finding. Optionally, you may download a compact Transformers.js sentence-embedding model locally into browser cache.
          </p>
          <p>
            <strong>Local Accounts &amp; Persistence:</strong> Access to the Analyzer and Workspace requires signing in to a local browser account hashed with Web Crypto PBKDF2 in IndexedDB. Analysis records, job matches, resume drafts, and cover letters are stored locally in IndexedDB only on consent.
          </p>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link
          to={authSession ? '/analyzer' : '/signup'}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          {authSession ? 'Open Resume Analyzer' : 'Sign Up to Analyze'}
        </Link>
        {authSession ? (
          <Link
            to="/settings"
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Manage Local Data &amp; Privacy
          </Link>
        ) : (
          <Link
            to="/login"
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Login to Existing Account
          </Link>
        )}
      </div>
    </div>
  );

  return authSession ? <WorkspaceLayout>{content}</WorkspaceLayout> : <PublicShell>{content}</PublicShell>;
}
