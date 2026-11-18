import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, MotionConfig } from 'motion/react';
import {
  ArrowRight,
  Briefcase,
  Compass,
  Cpu,
  Database,
  FileCheck2,
  GitCompare,
  History,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { LandingNavbar } from '../components/layout/Navbar';
import { Modal } from '../components/ui/Modal';
import { useAppStore } from '../store/useAppStore';

const FEATURE_CARDS = [
  {
    step: '01',
    title: 'Resume Analyzer',
    description:
      'Extract PDF, DOCX, and TXT files locally in browser memory and audit readability, section structure, entities, and bullet strength.',
    to: '/analyzer',
    icon: FileCheck2,
  },
  {
    step: '02',
    title: 'Resume vs. Job Comparison',
    description:
      'See clearly in three separate panels what matches the job posting, what is missing from your resume, and what to improve.',
    to: '/job-matching',
    icon: Briefcase,
  },
  {
    step: '03',
    title: 'Skill Gap Intelligence',
    description:
      'Separate skills demonstrated in Experience and Projects from unsubstantiated keywords and surface missing role requirements.',
    to: '/skills-gap',
    icon: Target,
  },
  {
    step: '04',
    title: 'ATS Intelligence',
    description:
      'Inspect a transparent 14-category heuristic ATS rubric covering contact info, date consistency, quantified outcomes, and custom weights.',
    to: '/ats-intelligence',
    icon: ShieldCheck,
  },
  {
    step: '05',
    title: 'NLP Language Laboratory',
    description:
      'Inspect tokens, n-grams, TF-IDF scores, editable entities, custom skill dictionaries, and optional local Transformers.js embeddings.',
    to: '/nlp-laboratory',
    icon: Sparkles,
  },
  {
    step: '06',
    title: 'Career Learning Roadmap',
    description:
      'Follow prioritized 7-day, 30-day, 60-day, and 90-day study estimates, practice projects, and interview prep tied to real skill gaps.',
    to: '/career-intelligence',
    icon: Compass,
  },
  {
    step: '07',
    title: 'Compare Multiple Resumes',
    description:
      'Compare two or more saved resume drafts side by side across ATS score, skills detected, readability grade, and quantified achievements.',
    to: '/resume-comparison',
    icon: GitCompare,
  },
  {
    step: '08',
    title: 'Analysis History & Reports Center',
    description:
      'Search and reopen saved analyses anytime, preview structured findings, and export PDF, Markdown, TXT, CSV, or JSON backups.',
    to: '/reports',
    icon: History,
  },
] as const;

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Upload Your Resume',
    body: 'Drop a PDF, DOCX, or TXT file (up to 10 MB) or paste resume content directly. All text parsing executes inside your browser.',
  },
  {
    step: '02',
    title: 'Add Target Job Details',
    body: 'Provide the company name, job title, and job description to compare requirements and detect consistency mismatches.',
  },
  {
    step: '03',
    title: 'Review What Matches & Improve',
    body: 'Inspect what is the same, what is missing, and what to improve across your report, then download complete reports anytime.',
  },
] as const;

export default function LandingPage() {
  const authSession = useAppStore((s) => s.authSession);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 overflow-x-clip">
        <LandingNavbar />

        <main>
          {/* Animated Hero Section */}
          <section className="relative isolate overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80">
            {/* Multi-layer Ambient Motion Backdrop */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="animate-float-slow absolute -top-44 left-1/4 h-[480px] w-[660px] rounded-full bg-gradient-to-tr from-indigo-500/18 via-violet-500/14 to-sky-400/10 dark:from-indigo-500/26 dark:via-violet-600/20 dark:to-transparent blur-3xl" />
              <div className="animate-float-reverse absolute -bottom-36 right-1/6 h-[400px] w-[540px] rounded-full bg-gradient-to-bl from-violet-500/14 via-indigo-400/10 to-transparent dark:from-violet-500/20 dark:via-indigo-600/14 dark:to-transparent blur-3xl" />
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.08),transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.14),transparent_60%)]"
              />
              {/* Subtle kinetic horizontal shimmer line along bottom divider */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-slate-200/70 dark:bg-slate-800/70 overflow-hidden">
                <div className="animate-beam-sweep h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent" />
              </div>
            </div>

            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28 text-center">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.06 }}
                  className="text-xs font-semibold tracking-wider uppercase text-indigo-600 dark:text-indigo-400"
                >
                  Browser-Based Resume Intelligence Platform
                </motion.p>

                <motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-4 mx-auto max-w-4xl font-display font-bold tracking-tight text-slate-900 dark:text-white text-balance leading-[1.06]"
                  style={{ fontSize: 'clamp(2.35rem, 4.6vw, 4rem)' }}
                >
                  Your Resume. Your Skills. Your Next Opportunity.
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.24 }}
                  className="mt-6 mx-auto max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300"
                >
                  Analyze your resume locally inside your browser, compare directly against target job requirements to see what matches and what is missing, and export structured intelligence reports.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.34 }}
                  className="mt-9 flex flex-wrap items-center justify-center gap-4"
                >
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      to="/analyzer"
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Analyze My Resume</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      to="/about"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 hover:bg-white dark:hover:bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>How Everything Works</span>
                    </Link>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.55, delay: 0.44 }}
                  className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-400"
                >
                  <span>PDF · DOCX · TXT · Paste Text</span>
                  <span aria-hidden="true">·</span>
                  <span>14-Category ATS Scoring</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {authSession
                      ? `Signed in as ${authSession.fullName}`
                      : 'Local IndexedDB Workspace'}
                  </span>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Features Section — 8 Core Capabilities */}
          <section id="features" className="bg-white dark:bg-[#0B1120] py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-2xl"
              >
                <p className="text-xs font-semibold tracking-wide text-indigo-600 dark:text-indigo-400">
                  Platform Capabilities
                </p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
                  Everything You Need to Analyze &amp; Strengthen Your Resume
                </h2>
                <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
                  Inspect your resume structure, compare directly against job descriptions to see what matches or is missing, and export complete reports.
                </p>
              </motion.div>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {FEATURE_CARDS.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.step}
                      initial={{ opacity: 0, y: 22 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{
                        duration: 0.45,
                        delay: Math.min(idx * 0.06, 0.35),
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      whileHover={{ y: -5, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
                      className="group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/65 p-5 hover:border-indigo-400/80 dark:hover:border-indigo-600/80 hover:shadow-lg hover:shadow-indigo-500/5 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-mono text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                            {card.step}
                          </span>
                        </div>
                        <h3 className="mt-4 font-display text-base font-semibold text-slate-900 dark:text-white">
                          {card.title}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          {card.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800">
                        <Link
                          to={card.to}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline"
                        >
                          <span>Open Tool</span>
                          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 3-Step How It Works */}
          <section id="how-it-works" className="py-20 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#090D16]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-2xl"
              >
                <p className="text-xs font-semibold tracking-wide text-indigo-600 dark:text-indigo-400">
                  3-Step Workflow
                </p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
                  From Uploaded Resume to Target-Role Review
                </h2>
              </motion.div>

              <div className="relative mt-10">
                {/* Animated subtle connector line across steps on desktop */}
                <motion.div
                  aria-hidden="true"
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  style={{ originX: 0 }}
                  className="hidden md:block absolute top-8 left-12 right-12 h-px bg-gradient-to-r from-indigo-500/40 via-violet-500/40 to-indigo-500/40"
                />

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
                  {HOW_IT_WORKS_STEPS.map((item, idx) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, y: 22 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{
                        duration: 0.48,
                        delay: idx * 0.12,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1424] p-6 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700/80 transition-colors"
                    >
                      <span className="inline-flex items-center font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                        Step {item.step}
                      </span>
                      <h3 className="mt-2 font-display text-lg font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {item.body}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Local Data & Architecture Transparency */}
          <section id="privacy" className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0E1424] p-7 sm:p-10"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                      <Lock className="h-4 w-4" />
                      <span>Local Browser Architecture</span>
                    </div>
                    <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
                      Transparent Local Processing &amp; Storage Controls
                    </h2>
                    <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
                      ResumeIQ parses and evaluates your resume directly in your web browser using PDF.js, Mammoth.js, rule-based NLP, and TF-IDF similarity. Resumes are not uploaded to a ResumeIQ server. Saved records reside in this browser&apos;s IndexedDB, are device and browser dependent, do not sync automatically across devices, and can be exported as JSON or cleared anytime.
                    </p>
                  </div>

                  <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, x: 14 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      whileHover={{ y: -3, transition: { duration: 0.18 } }}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-4"
                    >
                      <Cpu className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <p className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-white">
                        Transparent Methods
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        Every score labels exact dictionary, TF-IDF, or rubric rules used.
                      </p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 14 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.4, delay: 0.18 }}
                      whileHover={{ y: -3, transition: { duration: 0.18 } }}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-4"
                    >
                      <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <p className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-white">
                        Local IndexedDB Control
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        Clearing site data removes local records unless you export a JSON backup.
                      </p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Final Call to Action */}
          <section className="relative overflow-hidden border-t border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white py-20">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="animate-float-slow absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-indigo-500/24 blur-3xl" />
              <div className="animate-float-reverse absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-violet-500/18 blur-3xl" />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center"
            >
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-balance">
                Your Next Career Opportunity Starts With Better Preparation.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
                Upload your resume, compare it against your target job description, review what is missing and what to improve, and export structured PDF reports locally.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/analyzer"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 px-6 py-3 text-sm font-semibold text-white transition-colors whitespace-nowrap"
                  >
                    <span>Start Resume Analysis</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/job-matching"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors whitespace-nowrap"
                  >
                    <span>Compare Resume vs. Job</span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D16] py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-md">
                <p className="font-display text-base font-bold text-slate-900 dark:text-white">
                  ResumeIQ
                </p>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  A Browser-Based Resume Intelligence &amp; Career Optimization Platform.
                </p>
              </div>

              <nav
                aria-label="Footer navigation"
                className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400"
              >
                <Link to="/" className="hover:text-slate-900 dark:hover:text-white">
                  Home
                </Link>
                <Link to="/analyzer" className="hover:text-slate-900 dark:hover:text-white">
                  Resume Analyzer
                </Link>
                <Link to="/job-matching" className="hover:text-slate-900 dark:hover:text-white">
                  Resume vs Job Match
                </Link>
                <Link to="/reports" className="hover:text-slate-900 dark:hover:text-white">
                  Reports Center
                </Link>
                <Link to="/about" className="hover:text-slate-900 dark:hover:text-white">
                  About &amp; Guide
                </Link>
                <Link to="/contact" className="hover:text-slate-900 dark:hover:text-white">
                  Contact
                </Link>
                <button
                  type="button"
                  onClick={() => setLegalModal('privacy')}
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  Privacy Policy
                </button>
                <button
                  type="button"
                  onClick={() => setLegalModal('terms')}
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  Terms &amp; Conditions
                </button>
              </nav>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>&copy; {new Date().getFullYear()} ResumeIQ. Local Browser Architecture.</span>
              <span>Browser-based document processing · IndexedDB local storage</span>
            </div>
          </div>
        </footer>

        {/* Privacy Policy Modal */}
        <Modal
          open={legalModal === 'privacy'}
          onClose={() => setLegalModal(null)}
          title="Privacy Policy — Local Browser Storage"
          description="How ResumeIQ handles your documents and locally stored records."
          maxWidth="lg"
        >
          <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              <strong>Browser-Side Document Processing:</strong> Uploaded PDF, DOCX, and TXT resumes, pasted text, and job descriptions are parsed and analyzed inside your web browser using PDF.js, Mammoth.js, and local JavaScript algorithms without uploading your resume documents to a remote ResumeIQ server.
            </p>
            <p>
              <strong>Device-Dependent Storage:</strong> Saved analysis records and local account profiles are stored in your current browser&apos;s IndexedDB and localStorage. Local records do not synchronize automatically across devices, and clearing browser site data can remove saved items.
            </p>
            <p>
              <strong>Network Access Disclosure:</strong> External browser resources such as web fonts or optional Transformers.js model weights (only if you choose to download a local model) require network access when loaded.
            </p>
            <p>
              <strong>User Data Control:</strong> You can export a portable JSON backup or permanently erase local workspace records from Settings at any time.
            </p>
          </div>
        </Modal>

        {/* Terms & Conditions Modal */}
        <Modal
          open={legalModal === 'terms'}
          onClose={() => setLegalModal(null)}
          title="Terms & Conditions"
          description="Usage scope and scoring transparency notice."
          maxWidth="lg"
        >
          <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              <strong>Decision-Support Guidance:</strong> Resume quality scores, job compatibility percentages, learning roadmap estimates, and practice interview questions are rule-based and statistical estimates derived from your supplied text and job descriptions. They do not guarantee ATS approval, interview invitations, or employment selection.
            </p>
            <p>
              <strong>Accuracy &amp; Truthfulness:</strong> You are solely responsible for verifying all dates, titles, skills, and metrics presented on any resume or exported report. ResumeIQ does not fabricate or validate employment history beyond the text you provide.
            </p>
            <p>
              <strong>Optional Local Model Weights:</strong> If you optionally choose to download a local Transformers.js embedding model inside the NLP Laboratory, model weights are fetched into your browser cache for local inference.
            </p>
          </div>
        </Modal>
      </div>
    </MotionConfig>
  );
}
