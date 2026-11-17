import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Building2,
  Check,
  Cpu,
  Database,
  FileCode2,
  FileSearch,
  FileText,
  GitCompare,
  Layers,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { LandingNavbar } from '../components/layout/Navbar';
import { useAppStore } from '../store/useAppStore';

const PIPELINE_STAGES = [
  {
    id: 'extract',
    step: '01',
    tab: 'Extract',
    title: 'Document & Text Extraction',
    summary:
      'PDF.js and Mammoth.js read PDF, DOCX, and plain TXT resumes directly in browser memory — or paste raw text directly without saving a file.',
    details: [
      'Coordinate-aware PDF line reconstruction',
      'Instant detection for image-only scanned PDFs',
      '10 MB guardrail with zero remote uploads',
    ],
  },
  {
    id: 'audit',
    step: '02',
    tab: 'Audit',
    title: 'Human-Readable Language & Bullet Review',
    summary:
      'Compromise.js, part-of-speech rules, n-gram checks, and action-verb coaching reveal how clearly your experience reads.',
    details: [
      'Quantified outcome & strong-verb coach',
      '14-category transparent weighted rubric',
      'Optional local Transformers.js embeddings',
    ],
  },
  {
    id: 'compare',
    step: '03',
    tab: 'Match',
    title: 'Company & Job Description Comparison',
    summary:
      'Compare your resume alongside any company posting — pasted or uploaded as TXT, PDF, or DOCX — to uncover matched and missing skills.',
    details: [
      'TF-IDF cosine similarity & keyword overlap',
      'Required vs. preferred skills evidence check',
      'Combined PDF report & builder handoff',
    ],
  },
] as const;

export default function LandingPage() {
  const authSession = useAppStore((s) => s.authSession);
  const [activeStageId, setActiveStageId] = useState<(typeof PIPELINE_STAGES)[number]['id']>('extract');

  const activeStage =
    PIPELINE_STAGES.find((s) => s.id === activeStageId) || PIPELINE_STAGES[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 overflow-x-clip">
      <LandingNavbar />

      <main>
        {/* Cinematic Atmospheric Hero */}
        <section className="relative isolate overflow-hidden border-b border-slate-200/70 dark:border-slate-800/80">
          {/* Restrained midnight-navy / indigo / violet atmospheric illumination */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[920px] rounded-full bg-gradient-to-tr from-indigo-500/12 via-violet-500/10 to-sky-500/8 dark:from-indigo-500/20 dark:via-violet-600/14 dark:to-slate-900/0 blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-20 lg:pt-24 lg:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="lg:col-span-7 flex flex-col justify-center"
              >
                <p className="text-xs font-semibold tracking-wide text-indigo-600 dark:text-indigo-400">
                  Private Browser Workspace · Local Document &amp; Language Intelligence
                </p>
                <h1
                  className="mt-4 font-display font-bold tracking-tight text-slate-900 dark:text-white text-balance leading-[1.06]"
                  style={{ fontSize: 'clamp(2.35rem, 4.3vw, 3.85rem)' }}
                >
                  Your Career. Analyzed. Optimized. Elevated.
                </h1>
                <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                  Understand exactly how recruiters and screening systems read your resume. Upload a PDF, DOCX, or TXT file — or paste raw text — compare it directly against a target company and job posting, strengthen weak bullets, and export tailored PDFs without your files ever leaving your browser.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/analyzer"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all hover:-translate-y-0.5 whitespace-nowrap shrink-0"
                  >
                    <span>Analyze My Resume</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Explore Features</span>
                  </a>
                  {!authSession && (
                    <Link
                      to="/signup"
                      className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-4 whitespace-nowrap"
                    >
                      Create Free Local Account
                    </Link>
                  )}
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {authSession
                    ? `Signed in locally as ${authSession.fullName} — jump straight into the Analyzer or Workspace.`
                    : 'Sign in or create a local browser account to unlock the Analyzer, ATS scoring, Company Job Matching, and Resume Builder.'}
                </p>
              </motion.div>

              {/* Interactive Cinematic Stage Card */}
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0E1424]/95 p-6 sm:p-7 shadow-xl shadow-slate-900/5 dark:shadow-black/30"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                        Interactive Analysis Pipeline
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      100% Client-Side
                    </span>
                  </div>

                  {/* Interactive Stage Tabs */}
                  <div
                    role="tablist"
                    aria-label="Analysis workflow stages"
                    className="mt-4 grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 p-1"
                  >
                    {PIPELINE_STAGES.map((stage) => {
                      const active = stage.id === activeStageId;
                      return (
                        <button
                          key={stage.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setActiveStageId(stage.id)}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                            active
                              ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {stage.step}. {stage.tab}
                        </button>
                      );
                    })}
                  </div>

                  <motion.div
                    key={activeStage.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-5"
                  >
                    <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      Stage {activeStage.step}
                    </p>
                    <h2 className="mt-1 font-display text-base font-semibold text-slate-900 dark:text-white">
                      {activeStage.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {activeStage.summary}
                    </p>
                    <ul className="mt-4 space-y-2 border-t border-slate-200/70 dark:border-slate-800 pt-3.5 text-xs text-slate-700 dark:text-slate-300">
                      {activeStage.details.map((d) => (
                        <li key={d} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>PDF · DOCX · TXT · Paste</span>
                  <span>IndexedDB Local Storage</span>
                </div>
              </motion.div>
            </div>

            {/* Supported Formats Strip */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 border-t border-slate-200 dark:border-slate-800 pt-8"
            >
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">PDF Parsing</p>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                  PDF.js coordinate line reconstruction
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Word Documents</p>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                  Mammoth.js DOCX XML text extraction
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Plain Text &amp; Direct Paste</p>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                  UTF-8 TXT files &amp; inline text comparison
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Document Export</p>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                  jsPDF reports &amp; 6 resume templates
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Highlights Bento Grid */}
        <section
          id="features"
          className="bg-white dark:bg-[#0B1120] py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45 }}
              className="max-w-2xl"
            >
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
                Built for inspectable, honest career decisions
              </h2>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
                Every score, extracted detail, skill match, and bullet recommendation traces straight back to the words inside your document.
              </p>
            </motion.div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4 }}
                className="md:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-6 sm:p-7 hover:border-indigo-300 dark:hover:border-indigo-700/70 transition-colors"
              >
                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="h-5 w-5" />
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    01. Transparent 14-Category ATS Scoring
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl">
                  See exactly how your resume holds up across Contact Details, Section Structure, Summary, Experience, Education, Skills Coverage, Projects, Certifications, Quantified Impact, Keyword Variety, Readability, Formatting, Date Consistency, and Bullet Strength. Customize weights and inspect every calculation.
                </p>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <span>Configurable weights</span>
                  <span aria-hidden="true">·</span>
                  <span>Interactive Radar profile</span>
                  <span aria-hidden="true">·</span>
                  <span>Actionable checklist</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-6 sm:p-7 hover:border-indigo-300 dark:hover:border-indigo-700/70 transition-colors"
              >
                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                  <FileSearch className="h-5 w-5" />
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    02. Language &amp; Bullet Coach
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Inspect word frequency, stems, bigrams, duplicate phrases, weak wording, and action-verb strength. Optionally download a compact local Transformers.js model in your browser.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-6 sm:p-7 hover:border-indigo-300 dark:hover:border-indigo-700/70 transition-colors"
              >
                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                  <Building2 className="h-5 w-5" />
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    03. Company &amp; Job Comparison
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Enter a target company and paste or upload a job description file directly inside the Resume Analyzer to measure skill overlap, TF-IDF similarity, and resume evidence.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-6 sm:p-7 hover:border-indigo-300 dark:hover:border-indigo-700/70 transition-colors"
              >
                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                  <FileText className="h-5 w-5" />
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    04. Resume Builder &amp; Cover Letters
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Send parsed details directly into 6 clean resume templates, compose structured cover letters grounded in your real roles, and export crisp PDFs.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-6 sm:p-7 hover:border-indigo-300 dark:hover:border-indigo-700/70 transition-colors"
              >
                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                  <GitCompare className="h-5 w-5" />
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    05. Side-by-Side Comparison
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Compare multiple resume drafts across ATS scores, skills depth, readability, and quantified achievements, then export comparison PDFs.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works & Workflow */}
        <section id="how-it-works" className="py-20 border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-5">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
                  Clear language inspection without external servers
                </h2>
                <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  We separate deterministic rule checks and statistical TF-IDF from neural embedding models so you always know how a number was produced.
                </p>
                <div className="mt-6 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-1 shrink-0" />
                    <span>
                      <strong>Method 1 — Rule-Based &amp; Compromise.js:</strong> Section detection, date ranges, action verbs, weak phrasing, and entity extraction.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-1 shrink-0" />
                    <span>
                      <strong>Method 2 — Statistical TF-IDF &amp; Cosine Similarity:</strong> Transparent term weighting and skill matching against company job postings.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-1 shrink-0" />
                    <span>
                      <strong>Method 3 — Optional Local Transformers.js:</strong> In-browser embedding similarity with live download progress and classical fallback.
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  {
                    step: 'Step 01',
                    title: 'Upload File or Paste Resume Text',
                    body: 'Drop a PDF, DOCX, or TXT resume — or paste raw resume text directly — and inspect what automated parsers extract.',
                  },
                  {
                    step: 'Step 02',
                    title: 'Compare With a Company Posting',
                    body: 'Add the target company name and paste or upload the job description to measure real skills overlap and gaps.',
                  },
                  {
                    step: 'Step 03',
                    title: 'Strengthen Bullets & ATS Structure',
                    body: 'Follow the Bullet Improvement Coach and 14-category rubric to replace vague openers with measurable outcomes.',
                  },
                  {
                    step: 'Step 04',
                    title: 'Refine, Author & Export PDF',
                    body: 'Send your details into the Resume Builder or Cover Letter Studio and download clean PDFs anytime.',
                  },
                ].map((item, idx) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.4, delay: idx * 0.06 }}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
                  >
                    <p className="text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400">
                      {item.step}
                    </p>
                    <h3 className="mt-2 font-display text-base font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {item.body}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Privacy-First Architecture */}
        <section
          id="privacy"
          className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-8 sm:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                    <Lock className="h-4 w-4" />
                    <span>Privacy-First Local Processing</span>
                  </div>
                  <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
                    Your career history stays inside your browser
                  </h2>
                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    ResumeIQ X has no remote database and sends zero requests to external language servers. Uploaded files remain in browser memory by default; analysis records, drafts, and local preferences are saved in IndexedDB only when you choose. Export a full JSON backup or clear local storage whenever you wish.
                  </p>
                </div>

                <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                    <Cpu className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <p className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-white">
                      Web Worker Engine
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Responsive parsing &amp; scoring off the main UI thread.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                    <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <p className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-white">
                      IndexedDB + JSON Backup
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Export &amp; restore records across devices cleanly.
                    </p>
                  </div>
                  <div className="sm:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Ready to inspect your resume?
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Sign in to your local workspace to analyze and compare.
                      </p>
                    </div>
                    <Link
                      to="/analyzer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0"
                    >
                      <FileCode2 className="h-3.5 w-3.5" />
                      <span>Start Analysis</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#090D16] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="font-display text-base font-bold text-slate-900 dark:text-white">
                ResumeIQ X
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Your Career. Analyzed. Optimized. Elevated. · Local browser processing.
              </p>
            </div>
            <nav className="flex flex-wrap items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <Link to="/" className="hover:text-slate-900 dark:hover:text-white">
                Home
              </Link>
              <Link to="/workspace" className="hover:text-slate-900 dark:hover:text-white">
                Workspace
              </Link>
              <Link to="/analyzer" className="hover:text-slate-900 dark:hover:text-white">
                Analyzer
              </Link>
              <Link to="/templates" className="hover:text-slate-900 dark:hover:text-white">
                Templates
              </Link>
              <Link to="/about" className="hover:text-slate-900 dark:hover:text-white">
                About
              </Link>
              <Link to="/contact" className="hover:text-slate-900 dark:hover:text-white">
                Contact
              </Link>
              <Link to="/settings" className="hover:text-slate-900 dark:hover:text-white">
                Privacy &amp; Data
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
