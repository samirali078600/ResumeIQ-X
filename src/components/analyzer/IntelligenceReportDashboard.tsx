import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Copy,
  Download,
  FileCheck2,
  FolderGit2,
  HelpCircle,
  Layers,
  Microscope,
  Save,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardHeader } from '../ui/Card';
import { ChartTooltipContent } from '../ui/ChartTooltip';
import { ProgressBar } from '../ui/ProgressBar';
import { formatFileSize } from '../../utils/documentParser';
import { generateBulletCoachSuggestions } from '../../nlp/bulletCoach';
import { ResumeVsJobComparisonPanel } from './ResumeVsJobComparisonPanel';
import type {
  GapBucket,
  InterviewPrepQuestion,
  RequirementStatus,
  ResumeJobIntelligenceReport,
} from '../../nlp/jobIntelligenceEngine';
import type { JobMatchResult, ResumeAnalysisRecord } from '../../types/resume';

export type IntelligenceTabId =
  | 'overview'
  | 'vs-comparison'
  | 'requirements'
  | 'skill-gaps'
  | 'skills-evidence'
  | 'compatibility'
  | 'ats-assessment'
  | 'improvements'
  | 'projects'
  | 'roadmap'
  | 'interview-prep'
  | 'final-report';

const REPORT_TABS: { id: IntelligenceTabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'vs-comparison', label: 'Resume vs. Job Comparison' },
  { id: 'requirements', label: 'Job Requirements' },
  { id: 'skill-gaps', label: 'Skill Gap Analysis' },
  { id: 'skills-evidence', label: 'Skills Evidence' },
  { id: 'compatibility', label: 'Job Compatibility' },
  { id: 'ats-assessment', label: 'ATS Assessment' },
  { id: 'improvements', label: 'Resume Improvements' },
  { id: 'projects', label: 'Project Recommendations' },
  { id: 'roadmap', label: 'Learning Roadmap' },
  { id: 'interview-prep', label: 'Interview Preparation' },
  { id: 'final-report', label: 'Final Report' },
];

const STATUS_META: Record<
  RequirementStatus,
  { label: string; toneClass: string }
> = {
  'found-evidenced': {
    label: 'Skill Found',
    toneClass: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60',
  },
  'mentioned-no-evidence': {
    label: 'Mentioned Without Evidence',
    toneClass: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/60',
  },
  'partially-matched': {
    label: 'Partially Matched',
    toneClass: 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-900/60',
  },
  'alternative-satisfied': {
    label: 'Alternative Requirement Satisfied',
    toneClass: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-900/60',
  },
  missing: {
    label: 'Skill Missing',
    toneClass: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/60',
  },
  'not-applicable': {
    label: 'Not Applicable',
    toneClass: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700',
  },
};

interface IntelligenceReportDashboardProps {
  analysis: ResumeAnalysisRecord;
  jobMatch: JobMatchResult | null;
  intelligence: ResumeJobIntelligenceReport;
  companyName: string;
  targetRole: string;
  isSavedInDb: boolean;
  rawArrayBufferPresent: boolean;
  persistOriginal: boolean;
  onTogglePersistOriginal: (checked: boolean) => void;
  onSaveLocal: () => void;
  editableText: string;
  onChangeEditableText: (val: string) => void;
  isEditingText: boolean;
  onToggleEditingText: (editing: boolean) => void;
  onApplyEditedText: () => void;
  onCopyText: (text: string, label: string) => void;
  onExportPdf: () => void;
  onJumpToJobSection: () => void;
}

function NoJobPrompt({ onJumpToJobSection }: { onJumpToJobSection: () => void }) {
  return (
    <Card>
      <div className="py-8 text-center max-w-lg mx-auto space-y-3">
        <Briefcase className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto" />
        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
          Add Target Job &amp; Company Details to Unlock This Section
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Your resume has been parsed and scored locally. Enter a Target Company Name, Target Job Title, and Job Description in Section 02 above to evaluate employer-specific requirements and compatibility.
        </p>
        <button
          type="button"
          onClick={onJumpToJobSection}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white"
        >
          <span>Enter Target Job Details</span>
        </button>
      </div>
    </Card>
  );
}

export function IntelligenceReportDashboard({
  analysis,
  jobMatch,
  intelligence,
  companyName,
  targetRole,
  isSavedInDb,
  rawArrayBufferPresent,
  persistOriginal,
  onTogglePersistOriginal,
  onSaveLocal,
  editableText,
  onChangeEditableText,
  isEditingText,
  onToggleEditingText,
  onApplyEditedText,
  onCopyText,
  onExportPdf,
  onJumpToJobSection,
}: IntelligenceReportDashboardProps) {
  const [activeTab, setActiveTab] = useState<IntelligenceTabId>('overview');

  // Filters & expandable states
  const [reqSearch, setReqSearch] = useState('');
  const [reqStatusFilter, setReqStatusFilter] = useState<'all' | RequirementStatus>('all');
  const [skillSearch, setSkillSearch] = useState('');
  const [skillCategoryFilter, setSkillCategoryFilter] = useState('all');
  const [gapBucketFilter, setGapBucketFilter] = useState<'all' | GapBucket>('all');
  const [expandedGapIds, setExpandedGapIds] = useState<Record<string, boolean>>({});
  const [interviewCategoryFilter, setInterviewCategoryFilter] = useState<string>('all');
  const [interviewDifficultyFilter, setInterviewDifficultyFilter] = useState<string>('all');
  const [showRawText, setShowRawText] = useState(false);

  const bulletCoachItems = useMemo(
    () => generateBulletCoachSuggestions(analysis.nlp.bulletQuality, 6),
    [analysis]
  );

  const radarData = useMemo(() => {
    const pick = (key: string) =>
      analysis.ats.categories.find((c) => c.key === key)?.score || 0;
    return [
      { axis: 'Structure', score: pick('resumeStructure') },
      { axis: 'Experience', score: pick('workExperience') },
      { axis: 'Skills', score: pick('skills') },
      { axis: 'Impact', score: pick('achievements') },
      { axis: 'Readability', score: pick('readability') },
      { axis: 'Bullets', score: pick('bulletQuality') },
    ];
  }, [analysis]);

  const filteredRequirements = useMemo(() => {
    return intelligence.requirements.filter((r) => {
      const matchQuery =
        !reqSearch.trim() ||
        r.name.toLowerCase().includes(reqSearch.toLowerCase()) ||
        r.bucket.toLowerCase().includes(reqSearch.toLowerCase());
      const matchStatus = reqStatusFilter === 'all' || r.status === reqStatusFilter;
      return matchQuery && matchStatus;
    });
  }, [intelligence.requirements, reqSearch, reqStatusFilter]);

  const skillCategoriesPresent = useMemo(
    () => Array.from(new Set(intelligence.existingSkills.map((s) => s.category))),
    [intelligence.existingSkills]
  );

  const filteredExistingSkills = useMemo(() => {
    return intelligence.existingSkills.filter((s) => {
      const q = !skillSearch.trim() || s.name.toLowerCase().includes(skillSearch.toLowerCase());
      const c = skillCategoryFilter === 'all' || s.category === skillCategoryFilter;
      return q && c;
    });
  }, [intelligence.existingSkills, skillSearch, skillCategoryFilter]);

  const filteredGaps = useMemo(() => {
    return intelligence.skillGaps.filter(
      (g) => gapBucketFilter === 'all' || g.bucket === gapBucketFilter
    );
  }, [intelligence.skillGaps, gapBucketFilter]);

  const filteredQuestions = useMemo(() => {
    return intelligence.interviewPrep.filter((q) => {
      const catOk = interviewCategoryFilter === 'all' || q.category === interviewCategoryFilter;
      const diffOk =
        interviewDifficultyFilter === 'all' || q.difficulty === interviewDifficultyFilter;
      return catOk && diffOk;
    });
  }, [intelligence.interviewPrep, interviewCategoryFilter, interviewDifficultyFilter]);

  const toggleGapExpand = (id: string) => {
    setExpandedGapIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const ov = intelligence.executiveOverview;
  const displayCompany = companyName.trim() || jobMatch?.company || 'No company specified';
  const displayRole = targetRole.trim() || jobMatch?.jobTitle || 'No target position specified';

  return (
    <div className="space-y-6 animate-panel-in">
      {/* Dashboard Header */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Your Resume Intelligence Report
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              A detailed assessment of your resume, professional skills, and compatibility with your target job.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {!isSavedInDb && (
              <button
                type="button"
                onClick={onSaveLocal}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save to Local History</span>
              </button>
            )}
            <button
              type="button"
              onClick={onExportPdf}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Metadata bar (unboxed clean separators) */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <p className="text-slate-500 dark:text-slate-400">Resume File Name</p>
            <p className="mt-0.5 font-semibold text-slate-900 dark:text-white truncate">
              {analysis.fileName}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Target Company</p>
            <p className="mt-0.5 font-semibold text-slate-900 dark:text-white truncate">
              {displayCompany}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Target Position</p>
            <p className="mt-0.5 font-semibold text-slate-900 dark:text-white truncate">
              {displayRole}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Analysis Date</p>
            <p className="mt-0.5 font-mono tabular-nums text-slate-800 dark:text-slate-200">
              {new Date(analysis.updatedAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Analysis Status</p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                {intelligence.hasJobDescription
                  ? 'Full Resume + Job Audit Ready'
                  : 'Resume Audit Ready (No JD)'}
              </span>
            </p>
          </div>
        </div>

        {!isSavedInDb && rawArrayBufferPresent && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={persistOriginal}
                onChange={(e) => onTogglePersistOriginal(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                Also store original uploaded file ({formatFileSize(analysis.fileSize)}) in local IndexedDB when saving
              </span>
            </label>
            <span>
              Storage status: {isSavedInDb ? 'Saved in IndexedDB' : 'Session memory only'}
            </span>
          </div>
        )}
      </Card>

      {/* Consistency & Parsing Warnings */}
      {intelligence.consistencyWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/90 dark:bg-amber-950/30 p-4 space-y-2">
          {intelligence.consistencyWarnings.map((w) => (
            <div key={w.id} className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950 dark:text-amber-100">
                <p className="font-semibold">{w.title}</p>
                <p className="mt-0.5 opacity-90">{w.message}</p>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={onJumpToJobSection}
            className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline"
          >
            Review or correct Target Company / Job Title above →
          </button>
        </div>
      )}

      {analysis.parsingWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
            {analysis.parsingWarnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* 11-Tab Navigation Bar */}
      <nav aria-label="Resume intelligence report sections" className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto pb-2 no-scrollbar">
          {REPORT_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive Overview 6 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card padding="sm">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Overall Resume Quality Score
              </p>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                {ov.resumeQualityScore}
                <span className="text-sm font-normal text-slate-400">/100</span>
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Rule-based 14-category rubric
              </p>
            </Card>

            <Card padding="sm">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Job Compatibility Score
              </p>
              <p className="mt-2 font-mono text-lg sm:text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                {ov.jobCompatibilityScore !== null ? `${ov.jobCompatibilityScore}%` : 'Not available'}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {ov.jobCompatibilityScore !== null ? 'TF-IDF + skills + evidence' : 'Add JD to compute'}
              </p>
            </Card>

            <Card padding="sm">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Required Skill Coverage
              </p>
              <p className="mt-2 font-mono text-lg sm:text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {ov.requiredSkillCoverage !== null ? `${ov.requiredSkillCoverage}%` : 'Not available'}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Includes OR-alternatives
              </p>
            </Card>

            <Card padding="sm">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Preferred Skill Coverage
              </p>
              <p className="mt-2 font-mono text-lg sm:text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                {ov.preferredSkillCoverage !== null ? `${ov.preferredSkillCoverage}%` : 'Not available'}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Nice-to-have stack overlap
              </p>
            </Card>

            <Card padding="sm">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Identified Technical Skills
              </p>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {ov.identifiedTechnicalSkills}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {analysis.nlp.skills.unsubstantiated.length} without context proof
              </p>
            </Card>

            <Card padding="sm">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Missing Job Requirements
              </p>
              <p className="mt-2 font-mono text-lg sm:text-xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
                {ov.missingJobRequirements !== null ? ov.missingJobRequirements : 'Not available'}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {ov.missingJobRequirements !== null ? 'Required/preferred gaps' : 'Requires JD'}
              </p>
            </Card>
          </div>

          {/* Radar + Quick Action Plan Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5">
              <CardHeader
                title="Resume Dimension Profile"
                subtitle="Calculated locally across 6 core ATS areas"
              />
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                    <PolarGrid stroke="rgba(148,163,184,0.24)" />
                    <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94A3B8' }} />
                    <Tooltip content={<ChartTooltipContent suffix="/100" />} />
                    <Radar name="Score" dataKey="score" stroke="#7C3AED" fill="#6366F1" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="lg:col-span-7">
              <CardHeader
                title="Immediate Assessment Highlights"
                subtitle="Transparent rule-based, statistical, and evidence findings"
                action={
                  <div className="flex items-center gap-2">
                    <Link
                      to="/ats-intelligence"
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>ATS Weights</span>
                    </Link>
                    <Link
                      to="/nlp-laboratory"
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <Microscope className="h-3.5 w-3.5" />
                      <span>NLP Lab</span>
                    </Link>
                  </div>
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Strongest Resume Areas
                  </p>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                    {intelligence.finalActionPlan.strongestAreas.map((s) => (
                      <li key={s} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Recommended Next Steps
                  </p>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                    {intelligence.finalActionPlan.immediateNextSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                {intelligence.hasJobDescription ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('vs-comparison')}
                      className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-semibold text-white"
                    >
                      Open Resume vs. Job Comparison
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('skill-gaps')}
                      className="rounded-lg bg-slate-900 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white"
                    >
                      Inspect Skill Gaps ({intelligence.skillGaps.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('requirements')}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200"
                    >
                      View Parsed Requirements ({intelligence.requirements.length})
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onJumpToJobSection}
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-semibold text-white"
                  >
                    Add Target Company &amp; Job Description →
                  </button>
                )}
              </div>
            </Card>
          </div>

          {/* Expandable Extracted Text Viewer & Live Re-Analyze Editor */}
          <Card>
            <CardHeader
              title="Extracted Resume Content"
              subtitle={`${analysis.nlp.tokenStats.totalWords} words · ${analysis.nlp.tokenStats.sentenceCount} sentences · FK Grade ${analysis.nlp.tokenStats.readingGradeLevel}`}
              action={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRawText((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    <span>{showRawText ? 'Hide Extracted Text' : 'Inspect / Edit Text'}</span>
                    {showRawText ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              }
            />
            {showRawText && (
              <div className="space-y-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingText) {
                        onApplyEditedText();
                      } else {
                        onChangeEditableText(analysis.extractedText);
                        onToggleEditingText(true);
                      }
                    }}
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    {isEditingText ? 'Apply & Re-analyze' : 'Edit & Re-run Analysis'}
                  </button>
                  {isEditingText && (
                    <button
                      type="button"
                      onClick={() => {
                        onChangeEditableText(analysis.extractedText);
                        onToggleEditingText(false);
                      }}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {isEditingText ? (
                  <textarea
                    rows={14}
                    value={editableText}
                    onChange={(e) => onChangeEditableText(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                ) : (
                  <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-4 font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {analysis.extractedText}
                  </pre>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: RESUME VS JOB COMPARISON */}
      {activeTab === 'vs-comparison' && (
        !intelligence.hasJobDescription || !jobMatch ? (
          <NoJobPrompt onJumpToJobSection={onJumpToJobSection} />
        ) : (
          <ResumeVsJobComparisonPanel
            analysis={analysis}
            jobMatch={jobMatch}
            intelligence={intelligence}
          />
        )
      )}

      {/* TAB 3: JOB REQUIREMENTS */}
      {activeTab === 'requirements' && (
        !intelligence.hasJobDescription ? (
          <NoJobPrompt onJumpToJobSection={onJumpToJobSection} />
        ) : (
          <Card>
            <CardHeader
              title="Complete Job Requirement Analysis"
              subtitle="Categorized requirements parsed deterministically with alternative (OR) stack detection"
            />
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reqSearch}
                  onChange={(e) => setReqSearch(e.target.value)}
                  placeholder="Filter requirements or categories..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <select
                value={reqStatusFilter}
                onChange={(e) => setReqStatusFilter(e.target.value as 'all' | RequirementStatus)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="found-evidenced">Skill Found</option>
                <option value="alternative-satisfied">Alternative Satisfied</option>
                <option value="mentioned-no-evidence">Mentioned Without Evidence</option>
                <option value="partially-matched">Partially Matched</option>
                <option value="missing">Skill Missing</option>
              </select>
            </div>

            {filteredRequirements.length === 0 ? (
              <p className="text-sm text-slate-500">No parsed requirements match the active filter.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 pr-4 font-semibold">Requirement</th>
                      <th className="py-2.5 pr-4 font-semibold">Category</th>
                      <th className="py-2.5 pr-4 font-semibold">Type / Priority</th>
                      <th className="py-2.5 pr-4 font-semibold">Match Status</th>
                      <th className="py-2.5 font-semibold">Evidence / Reasoning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {filteredRequirements.map((req) => {
                      const st = STATUS_META[req.status];
                      return (
                        <tr key={req.id} className="align-top">
                          <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white max-w-[240px]">
                            {req.name}
                            {req.alternativesGroup && (
                              <span className="block text-[11px] font-normal text-indigo-600 dark:text-indigo-400 mt-0.5">
                                Alternative group: {req.alternativesGroup}
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {req.bucket}
                          </td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {req.requirementType === 'required' ? 'Required' : 'Preferred'} · {req.importance}
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap">
                            <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ${st.toneClass}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-300 max-w-sm">
                            <p>{req.reason}</p>
                            {req.evidenceSnippet && (
                              <p className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                “{req.evidenceSnippet}”
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )
      )}

      {/* TAB 3: SKILL GAP ANALYSIS */}
      {activeTab === 'skill-gaps' && (
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Skills &amp; Requirements You Need to Improve"
              subtitle="Grouped by missing priority, partial matches, practical experience gaps, and skills lacking context proof"
              action={
                <select
                  value={gapBucketFilter}
                  onChange={(e) => setGapBucketFilter(e.target.value as 'all' | GapBucket)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                >
                  <option value="all">All Gap Categories ({intelligence.skillGaps.length})</option>
                  <option value="Critical Missing Skills">Critical Missing Skills</option>
                  <option value="High-Priority Skill Gaps">High-Priority Skill Gaps</option>
                  <option value="Important Preferred Skills">Important Preferred Skills</option>
                  <option value="Partially Matched Skills">Partially Matched Skills</option>
                  <option value="Missing Practical Experience">Missing Practical Experience</option>
                  <option value="Skills Mentioned Without Evidence">Skills Mentioned Without Evidence</option>
                </select>
              }
            />

            {filteredGaps.length === 0 ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                {intelligence.hasJobDescription
                  ? 'No skill gaps detected for this filter — review Evidence and Compatibility tabs to verify depth.'
                  : 'All detected skills include experience or project context. Add a target job description to inspect employer-specific gaps.'}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredGaps.map((gap) => {
                  const open = Boolean(expandedGapIds[gap.id]);
                  return (
                    <div
                      key={gap.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-4"
                    >
                      <button
                        type="button"
                        onClick={() => toggleGapExpand(gap.id)}
                        className="w-full flex items-center justify-between gap-4 text-left"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {gap.bucket}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{gap.requirementStatus}</span>
                            <span aria-hidden="true">·</span>
                            <span>Priority: {gap.priority}</span>
                            <span aria-hidden="true">·</span>
                            <span>{gap.estimatedDuration}</span>
                          </div>
                          <h3 className="mt-1 font-display text-base font-semibold text-slate-900 dark:text-white">
                            {gap.skillOrRequirement}
                          </h3>
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 inline-flex items-center gap-1 shrink-0">
                          {open ? 'Hide Plan' : 'View Learning Plan'}
                          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                      </button>

                      {open && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-2.5">
                            <p className="text-slate-700 dark:text-slate-300">
                              <strong>Why target job requires it:</strong> {gap.whyJobRequiresIt}
                            </p>
                            <p className="text-slate-700 dark:text-slate-300">
                              <strong>Related skills already in your resume:</strong>{' '}
                              {gap.relatedSkillsInResume.length > 0
                                ? gap.relatedSkillsInResume.join(', ')
                                : 'None detected in resume'}
                            </p>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">What to learn:</p>
                              <ul className="mt-1 list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                                {gap.whatToLearn.map((t) => (
                                  <li key={t}>{t}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">Practical exercises:</p>
                              <ul className="mt-1 list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                                {gap.practicalExercises.map((ex) => (
                                  <li key={ex}>{ex}</li>
                                ))}
                              </ul>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300">
                              <strong>Recommended project:</strong> {gap.recommendedProject}
                            </p>
                            <p className="rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              <strong>Resume wording (once genuinely built):</strong> {gap.howToDemonstrateInResume}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: SKILLS EVIDENCE */}
      {activeTab === 'skills-evidence' && (
        <Card>
          <CardHeader
            title="Skills Found in Your Resume"
            subtitle="Separates demonstrated skills inside Experience/Projects from unsubstantiated keyword mentions"
          />
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Search detected skills..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <select
              value={skillCategoryFilter}
              onChange={(e) => setSkillCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              {skillCategoriesPresent.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {filteredExistingSkills.length === 0 ? (
            <p className="text-sm text-slate-500">No skills matched your search criteria.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 pr-4 font-semibold">Skill Name</th>
                    <th className="py-2.5 pr-4 font-semibold">Category</th>
                    <th className="py-2.5 pr-4 font-semibold">Target Job Role</th>
                    <th className="py-2.5 pr-4 font-semibold">Sections Found</th>
                    <th className="py-2.5 pr-4 font-semibold">Evidence Status</th>
                    <th className="py-2.5 font-semibold">Resume Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {filteredExistingSkills.map((sk) => (
                    <tr key={sk.name} className="align-top">
                      <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {sk.name}{' '}
                        <span className="font-mono text-[11px] font-normal text-slate-400">
                          ({sk.count}x)
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {sk.category}
                      </td>
                      <td className="py-3 pr-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {sk.requiredByJob}
                      </td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                        {sk.sectionsAppearing.join(', ') || 'Body'}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                            sk.matchStatus === 'Demonstrated in Experience/Projects'
                              ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                              : sk.matchStatus === 'Summary Context Only'
                                ? 'border-sky-200 dark:border-sky-900/60 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400'
                                : 'border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {sk.matchStatus}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
                        {sk.evidenceSnippet ? `“${sk.evidenceSnippet}”` : 'Listed without bullet context'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 5: JOB COMPATIBILITY */}
      {activeTab === 'compatibility' && (
        !intelligence.hasJobDescription ? (
          <NoJobPrompt onJumpToJobSection={onJumpToJobSection} />
        ) : (
          <div className="space-y-5">
            <Card>
              <CardHeader
                title="Detailed Job Compatibility Assessment"
                subtitle="Transparent rule-based, TF-IDF statistical, and evidence breakdown across 9 evaluation dimensions"
                action={
                  <Link
                    to="/job-matching"
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Open Dedicated Job Match Studio →
                  </Link>
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {intelligence.compatibilityDimensions.map((dim) => (
                  <div
                    key={dim.key}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-4 space-y-2.5"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                        {dim.title}
                      </h3>
                      <span className="font-mono text-sm font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                        {dim.score}%
                      </span>
                    </div>
                    <ProgressBar value={dim.score} />
                    <p className="text-xs text-slate-600 dark:text-slate-400">{dim.reasoning}</p>
                    {dim.matched.length > 0 && (
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        <strong>Matched:</strong> {dim.matched.slice(0, 6).join(', ')}
                      </p>
                    )}
                    {dim.missing.length > 0 && (
                      <p className="text-[11px] text-rose-700 dark:text-rose-400">
                        <strong>Missing:</strong> {dim.missing.slice(0, 5).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )
      )}

      {/* TAB 6: ATS ASSESSMENT */}
      {activeTab === 'ats-assessment' && (
        <Card>
          <CardHeader
            title="Comprehensive Resume Quality Audit"
            subtitle="19-point evaluation preserving your custom ATS weights alongside formatting, grammar repetition, and parseability checks"
            action={
              <Link
                to="/ats-intelligence"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Adjust Custom ATS Weights →
              </Link>
            }
          />
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            {analysis.ats.disclaimer}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {intelligence.qualityAudit.map((qa) => (
              <div
                key={qa.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    {qa.dimension}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold tabular-nums text-slate-800 dark:text-slate-200">
                      {qa.score}/100
                    </span>
                    <span
                      className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        qa.severity === 'pass'
                          ? 'border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                          : qa.severity === 'low'
                            ? 'border-sky-200 dark:border-sky-900/60 text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50'
                            : qa.severity === 'medium'
                              ? 'border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50'
                              : 'border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50'
                      }`}
                    >
                      {qa.severity}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{qa.explanation}</p>
                {qa.severity !== 'pass' && (
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    <strong>Suggested fix:</strong> {qa.suggestedCorrection}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 7: RESUME IMPROVEMENTS */}
      {activeTab === 'improvements' && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="How to Improve Your Resume"
              subtitle="Section-level suggestions without fabricating metrics or unverified claims"
            />
            {intelligence.improvementRecommendations.length === 0 ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                No major structural or phrasing gaps detected in your current resume text.
              </p>
            ) : (
              <div className="space-y-4">
                {intelligence.improvementRecommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs"
                  >
                    <p className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                      {rec.section}
                    </p>
                    <p className="text-amber-700 dark:text-amber-400">
                      <strong>Current issue:</strong> {rec.currentIssue}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      <strong>Why it matters:</strong> {rec.whyItMatters}
                    </p>
                    <p className="text-slate-700 dark:text-slate-200">
                      <strong>Recommended improvement:</strong> {rec.recommendedImprovement}
                    </p>
                    <div className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3">
                      <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {rec.exampleRevisedWording}
                      </p>
                      <button
                        type="button"
                        onClick={() => onCopyText(rec.exampleRevisedWording, 'Template wording')}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 shrink-0"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Line-by-Line Bullet Point Coach"
              subtitle="Rewrites passive openers and prompts where genuine verified metrics fit"
            />
            {bulletCoachItems.length === 0 ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                All parsed experience and project bullets begin with strong action verbs and measurable details.
              </p>
            ) : (
              <div className="space-y-3">
                {bulletCoachItems.map((b, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-slate-800 dark:text-slate-200">
                        <strong>Original ({b.section}):</strong> {b.original}
                      </p>
                      <button
                        type="button"
                        onClick={() => onCopyText(b.guidedTemplate, 'Guided bullet template')}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] font-medium shrink-0"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <p className="text-amber-700 dark:text-amber-400">
                      Flags: {b.issues.join(' · ')}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      <strong>Action verbs to consider:</strong> {b.suggestedVerbs.join(', ')}
                    </p>
                    <p className="rounded bg-indigo-50/70 dark:bg-indigo-950/40 px-3 py-2 font-mono text-[11px] text-indigo-900 dark:text-indigo-200">
                      {b.guidedTemplate}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 8: PROJECT RECOMMENDATIONS */}
      {activeTab === 'projects' && (
        <Card>
          <CardHeader
            title="Projects That Can Strengthen Your Profile"
            subtitle="Tailored from your missing & unsubstantiated skills. Do not add a recommended project to your resume until built."
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {intelligence.projectRecommendations.map((proj) => (
              <div
                key={proj.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between space-y-4 text-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {proj.difficulty} Level
                    </span>
                    <FolderGit2 className="h-4 w-4 text-slate-400" />
                  </div>
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    {proj.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>Stack:</strong> {proj.technologies.join(', ')}
                  </p>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Main features:</p>
                    <ul className="mt-1 list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                      {proj.mainFeatures.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Development steps:</p>
                    <ol className="mt-1 list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                      {proj.developmentSteps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>After completion wording:</strong> {proj.resumeTemplate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 9: LEARNING ROADMAP */}
      {activeTab === 'roadmap' && (
        <Card>
          <CardHeader
            title="Your Personalized Skill Development Roadmap"
            subtitle="Progression plan derived from your actual gaps. Durations are realistic self-paced estimates, not guarantees."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {intelligence.learningRoadmap.map((phase) => (
              <div
                key={phase.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    {phase.phaseLabel}
                  </h3>
                  <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400">{phase.durationNote}</p>
                {phase.skillsToLearn.length > 0 && (
                  <p className="text-slate-700 dark:text-slate-200">
                    <strong>Focus skills:</strong> {phase.skillsToLearn.join(', ')}
                  </p>
                )}
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Topics &amp; exercises:</p>
                  <ul className="mt-1 list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                    {[...phase.topicsToCover, ...phase.practicalExercises].map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Milestone:</strong> {phase.projectMilestones.join('; ')}
                </p>
                <p className="text-indigo-700 dark:text-indigo-300">
                  <strong>Portfolio proof:</strong> {phase.portfolioEvidence}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 10: INTERVIEW PREPARATION */}
      {activeTab === 'interview-prep' && (
        <Card>
          <CardHeader
            title="Job-Specific Interview Preparation"
            subtitle="Practice questions generated deterministically from your parsed job requirements and resume. These are study prompts, not guaranteed employer questions."
          />
          <div className="flex flex-wrap items-center gap-3 mb-5 text-xs">
            <select
              value={interviewCategoryFilter}
              onChange={(e) => setInterviewCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
            >
              <option value="all">All Question Categories</option>
              {(
                [
                  'Technical Questions',
                  'Programming Questions',
                  'Database Questions',
                  'Framework Questions',
                  'Project-Based Questions',
                  'Resume-Based Questions',
                  'HR Questions',
                  'Scenario-Based Questions',
                ] as InterviewPrepQuestion['category'][]
              ).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={interviewDifficultyFilter}
              onChange={(e) => setInterviewDifficultyFilter(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
            >
              <option value="all">All Difficulty Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {q.category} · {q.difficulty}
                  </span>
                  <span>{q.sourceBasis}</span>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {q.question}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <strong>Preparation approach:</strong> {q.prepGuidance}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 11: FINAL REPORT */}
      {activeTab === 'final-report' && (
        <Card>
          <CardHeader
            title="Your Career Improvement Action Plan"
            subtitle="Complete synthesis of your strongest assets, job matches, critical gaps, and immediate next actions"
            action={
              <button
                type="button"
                onClick={onExportPdf}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-semibold text-white"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Complete PDF</span>
              </button>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Strongest Resume Areas</span>
                </h3>
                <ul className="mt-2 list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                  {intelligence.finalActionPlan.strongestAreas.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Best Job Matches</span>
                </h3>
                <p className="mt-1.5 text-slate-600 dark:text-slate-300">
                  {intelligence.finalActionPlan.bestJobMatches.length > 0
                    ? intelligence.finalActionPlan.bestJobMatches.join(', ')
                    : 'Supply a target job description to evaluate role-specific skill matches.'}
                </p>
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <span>Critical Skill Gaps</span>
                </h3>
                <p className="mt-1.5 text-slate-600 dark:text-slate-300">
                  {intelligence.finalActionPlan.criticalSkillGaps.length > 0
                    ? intelligence.finalActionPlan.criticalSkillGaps.join(', ')
                    : 'None flagged for current criteria.'}
                </p>
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileCheck2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>Important Resume Issues</span>
                </h3>
                <ul className="mt-2 list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                  {intelligence.finalActionPlan.importantResumeIssues.length > 0 ? (
                    intelligence.finalActionPlan.importantResumeIssues.map((item) => (
                      <li key={item}>{item}</li>
                    ))
                  ) : (
                    <li>No high/medium quality issues detected.</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>Missing Practical Experience / Context</span>
                </h3>
                <p className="mt-1.5 text-slate-600 dark:text-slate-300">
                  {intelligence.finalActionPlan.missingPracticalExperience.length > 0
                    ? intelligence.finalActionPlan.missingPracticalExperience.join(', ')
                    : 'Skills found are backed by Experience or Project sections.'}
                </p>
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FolderGit2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Recommended Practice Projects</span>
                </h3>
                <ul className="mt-2 list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                  {intelligence.finalActionPlan.recommendedProjects.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Compass className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Learning &amp; Interview Priorities</span>
                </h3>
                <ul className="mt-2 list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                  {intelligence.finalActionPlan.interviewPriorities.map((ip) => (
                    <li key={ip}>{ip}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 p-4">
                <h3 className="font-display text-sm font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  <span>Immediate Next Steps (Start Here First)</span>
                </h3>
                <ul className="mt-2 space-y-1.5 text-indigo-900 dark:text-indigo-200">
                  {intelligence.finalActionPlan.immediateNextSteps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
