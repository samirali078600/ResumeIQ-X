import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  FileCheck2,
  FileSpreadsheet,
  GitCompare,
  History,
  LayoutDashboard,
  Microscope,
  MoreVertical,
  Settings,
  ShieldCheck,
  Target,
  User,
} from 'lucide-react';
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

const FEATURE_GUIDE = [
  {
    icon: LayoutDashboard,
    name: 'Workspace Dashboard (/workspace)',
    purpose: 'Your central command view showing real metrics from your saved IndexedDB records.',
    howToUse:
      'Open Workspace to view your Saved Analyses count, Average ATS Heuristic score, Highest ATS Score, Builder Drafts, ATS Score History chart, Skills Distribution chart, interactive Improvement Tasks checklist, and Recent Activity log.',
  },
  {
    icon: FileCheck2,
    name: 'Resume Analyzer (/analyzer)',
    purpose: 'Upload PDF, DOCX, or TXT files (or paste text) and run full resume + job compatibility evaluation.',
    howToUse:
      'Step 1: Upload a file or paste resume content in Section 01. Step 2: Enter Target Company Name, Target Job Title, and paste or upload the Job Description in Section 02. Step 3: Explore the 12-tab report below (Overview, Resume vs. Job Comparison, Job Requirements, Skill Gaps, Skills Evidence, Job Compatibility, ATS Assessment, Improvements, Projects, Roadmap, Interview Prep, and Final Report). Analyses save automatically to Analysis History when auto-save is enabled.',
  },
  {
    icon: Briefcase,
    name: 'Resume vs. Job Comparison (/job-matching)',
    purpose: 'Side-by-side comparison showing exactly what matches, what is missing, and what to improve.',
    howToUse:
      'Paste or upload a target job description and click "Run Job Match Analysis". The comparison cleanly separates: (1) What Is Same — matched skills, keywords, and section proof; (2) What Is Missing — missing required and preferred requirements; (3) What to Improve — unsubstantiated skills, weak phrasing, and tailoring steps.',
  },
  {
    icon: ShieldCheck,
    name: 'ATS Intelligence (/ats-intelligence)',
    purpose: 'Transparent 14-category heuristic evaluation of your active resume.',
    howToUse:
      'Review category scores (Contact Info, Resume Structure, Work Experience, Skills, Bullets, Achievements, Readability, etc.). Click "Configure Weights" to customize category percentages to match your industry, or check off improvement checklist items as you revise.',
  },
  {
    icon: Microscope,
    name: 'NLP Laboratory (/nlp-laboratory)',
    purpose: 'Deep inspection of language tokens, n-grams, TF-IDF terms, entities, and optional local models.',
    howToUse:
      'Inspect word frequencies, bigrams/trigrams, TF-IDF keyword relevance, edit/verify extracted names/organizations/titles, add custom domain skills to the matching dictionary, copy guided bullet rewrites, or optionally download the local Transformers.js MiniLM embedding model.',
  },
  {
    icon: Target,
    name: 'Skills Gap & Career Intelligence (/skills-gap, /career-intelligence)',
    purpose: 'Benchmark your resume against 10 curated role tracks or custom skill lists.',
    howToUse:
      'In Career Intelligence, compare readiness scores across roles like Frontend, Full-Stack, Backend, Data Analyst, DevOps, or Product Management. In Skills Gap, pick a target role or enter comma-separated skills to test coverage and get project ideas.',
  },
  {
    icon: GitCompare,
    name: 'Compare Resumes (/resume-comparison)',
    purpose: 'Compare two or more resume versions side by side.',
    howToUse:
      'Select two or more saved analyses (or upload extra resume files right on the page) to compare ATS scores, sections detected, skills count, readability grade, and quantified achievements, then export a comparison PDF.',
  },
  {
    icon: History,
    name: 'Analysis History & Reports Center (/analysis-history, /reports)',
    purpose: 'Manage saved analyses, restore JSON backups, and generate downloadable PDF reports.',
    howToUse:
      'In Analysis History, search by filename, skill, or target company, filter by PDF/DOCX/TXT, click "Open Report" to reload an analysis into the Analyzer (with its linked job comparison), export/import full JSON backups, or clear records. In Reports Center, bundle a selected resume and optional job match into a structured PDF.',
  },
  {
    icon: User,
    name: 'Local Profile & Settings (/profile, /settings)',
    purpose: 'Manage your local workspace identity, theme, NLP engine preference, and privacy controls.',
    howToUse:
      'Update your display name and career target in Local Profile. In Settings, switch Light/Dark/System themes, pick Classical NLP vs. Hybrid Local Model mode, toggle auto-save consent, inspect IndexedDB usage, export/import full JSON backups, or permanently delete all local data.',
  },
] as const;

const THREE_DOT_GUIDE = [
  {
    group: 'Core Workspace (Quick Access)',
    items: 'Home, Workspace Dashboard, Resume Analyzer, Resume vs Job Match — jump straight into the main daily tools from any page.',
  },
  {
    group: 'Analysis & History (Quick Access)',
    items: 'ATS Intelligence, NLP Laboratory, Skills Gap, Career Intelligence, Compare Resumes, Analysis History, Reports Center — switch directly between deep-dive evaluation views without opening the sidebar.',
  },
  {
    group: 'Account & Info (Quick Access)',
    items: 'Local Profile, Settings, About & Feature Guide, Contact — manage local preferences, backups, theme, or read documentation.',
  },
  {
    group: 'Before Signing In (Logged-Out State)',
    items: 'Shows Home, About & Guide, Contact, Sign In, and Get Started (Sign Up), plus shortcuts to Resume Analyzer, Resume vs Job Match, and History (which prompt login first so your local workspace stays protected).',
  },
] as const;

export default function AboutPage() {
  const authSession = useAppStore((s) => s.authSession);

  const content = (
    <div className="max-w-4xl space-y-8 animate-panel-in">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          About ResumeIQ &amp; Complete User Guide
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
          A complete breakdown of every feature, workflow, and menu item inside ResumeIQ.
        </p>
      </div>

      {/* Step-by-Step Quick Start */}
      <Card>
        <CardHeader
          title="How ResumeIQ Works (Step-by-Step Overview)"
          subtitle="From signing in to understanding your resume against a job posting"
        />
        <div className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            <strong>1. Create a Local Account &amp; Sign In:</strong> Your account credentials are stored locally in your browser&apos;s IndexedDB (hashed with Web Crypto PBKDF2). Workspace tools require login so your saved analyses and history remain scoped to your session.
          </p>
          <p>
            <strong>2. Upload or Paste Your Resume:</strong> Go to <strong>Resume Analyzer</strong> and upload a PDF, DOCX, or TXT file (or paste text directly). PDF.js and Mammoth.js extract selectable text locally without sending your document to an external server.
          </p>
          <p>
            <strong>3. Enter Target Company &amp; Job Description:</strong> Add the target company name, job title, and job description in Section 02 to unlock the dedicated <strong>Resume vs. Job Comparison</strong> (what is the same, what is missing, and what to improve), skill gap roadmaps, and practice interview prompts.
          </p>
          <p>
            <strong>4. Review, Improve &amp; Export:</strong> Revisit any past analysis in <strong>Analysis History</strong> or <strong>Workspace</strong>, tune ATS weights in <strong>ATS Intelligence</strong>, compare resume versions side by side, and export structured PDF reports or JSON backups anytime in <strong>Reports Center</strong>.
          </p>
        </div>
      </Card>

      {/* Three-Dot Quick Menu Guide */}
      <Card>
        <CardHeader
          title="How the Three-Dot Quick Menu (⋮) Works"
          subtitle="Located in the top-right navigation bar on every page for instant one-click switching"
          action={<MoreVertical className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
        />
        <div className="space-y-3.5 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            Clicking the <strong>Three-Dot (⋮) icon</strong> next to the theme toggle opens the Quick Navigation Menu. It gives you immediate access to every module in ResumeIQ without needing to expand the desktop sidebar or scroll back to the home page:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {THREE_DOT_GUIDE.map((entry) => (
              <div
                key={entry.group}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-3.5"
              >
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {entry.group}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {entry.items}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Complete Feature-by-Feature Guide */}
      <Card>
        <CardHeader
          title="Every Feature in ResumeIQ &amp; How to Use It"
          subtitle="Detailed reference for every page and workspace tool"
        />
        <div className="space-y-4">
          {FEATURE_GUIDE.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.name}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <h2 className="font-display text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                    {feat.name}
                  </h2>
                </div>
                <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  {feat.purpose}
                </p>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  <strong>How to use:</strong> {feat.howToUse}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Technical Architecture & Honesty */}
      <Card>
        <CardHeader
          title="Architecture, Privacy &amp; Scoring Transparency"
          action={<Settings className="h-5 w-5 text-slate-400" />}
        />
        <div className="space-y-3.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            <strong>Browser-Only Processing:</strong> ResumeIQ runs inside your web browser with no application backend database or remote resume upload service. Your uploaded files and analysis history remain on your current browser and device.
          </p>
          <p>
            <strong>Document Parsing Limits:</strong> PDF text is extracted via Mozilla PDF.js using coordinate-aware line reconstruction, DOCX files via Mammoth.js, and TXT files via UTF-8 decoding. If a PDF contains only scanned images without selectable text, ResumeIQ notifies you that OCR is unavailable rather than fabricating text.
          </p>
          <p>
            <strong>Method Transparency:</strong> Core analysis relies on deterministic rules, Compromise.js part-of-speech checks, Porter-style stemming, n-gram extraction, TF-IDF vectorization, and cosine similarity. Every score labels the exact method behind it. Optionally, you may download a compact Transformers.js sentence-embedding model into browser cache (which requires network access during download).
          </p>
          <p>
            <strong>Storage &amp; Backups:</strong> Browser IndexedDB storage is device and browser dependent, does not synchronize automatically across devices, and clearing browser site data removes locally saved records unless you export a JSON backup from <strong>Analysis History</strong> or <strong>Settings</strong>.
          </p>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link
          to={authSession ? '/analyzer' : '/signup'}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FileCheck2 className="h-4 w-4" />
          <span>{authSession ? 'Open Resume Analyzer' : 'Sign Up to Analyze'}</span>
        </Link>
        {authSession ? (
          <>
            <Link
              to="/workspace"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Open Workspace</span>
            </Link>
            <Link
              to="/reports"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Reports Center</span>
            </Link>
          </>
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
