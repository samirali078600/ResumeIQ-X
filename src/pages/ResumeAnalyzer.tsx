import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Copy,
  Download,
  FilePlus2,
  FileText,
  Microscope,
  PenTool,
  Save,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { ChartTooltipContent } from '../components/ui/ChartTooltip';
import { FileUploadZone } from '../components/ui/FileUploadZone';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ErrorState } from '../components/ui/StateViews';
import {
  arrayBufferToBase64,
  DocumentParseError,
  formatFileSize,
  parseResumeFile,
} from '../utils/documentParser';
import { analyzeResumeTextAsync, buildAnalysisRecord } from '../nlp/analyzeResume';
import { runJobDescriptionMatch } from '../nlp/matching';
import { generateBulletCoachSuggestions } from '../nlp/bulletCoach';
import {
  computeSemanticSimilarityWithModel,
  getLoadedModelStatus,
} from '../nlp/transformersEngine';
import { exportAnalysisReportPdf } from '../utils/pdfExport';
import { useAppStore } from '../store/useAppStore';
import type { ResumeAnalysisRecord } from '../types/resume';

export default function ResumeAnalyzer() {
  const customSkills = useAppStore((s) => s.customSkills);
  const atsWeights = useAppStore((s) => s.atsWeights);
  const profile = useAppStore((s) => s.profile);
  const saveProfile = useAppStore((s) => s.saveProfile);
  const activeAnalysis = useAppStore((s) => s.activeAnalysis);
  const setActiveAnalysis = useAppStore((s) => s.setActiveAnalysis);
  const saveAnalysisToLocal = useAppStore((s) => s.saveAnalysisToLocal);
  const analyses = useAppStore((s) => s.analyses);
  const activeJobMatch = useAppStore((s) => s.activeJobMatch);
  const saveJobMatch = useAppStore((s) => s.saveJobMatch);
  const setActiveJobMatch = useAppStore((s) => s.setActiveJobMatch);
  const addToast = useAppStore((s) => s.addToast);

  // Resume input modes: File (PDF/DOCX/TXT) OR Paste Text (.txt)
  const [resumeInputMode, setResumeInputMode] = useState<'file' | 'text'>('file');
  const [pastedResumeTitle, setPastedResumeTitle] = useState('Pasted_Resume.txt');
  const [pastedResumeText, setPastedResumeText] = useState('');

  const [parsing, setParsing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [rawArrayBuffer, setRawArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [editableText, setEditableText] = useState(activeAnalysis?.extractedText || '');
  const [isEditingText, setIsEditingText] = useState(false);
  const [persistOriginal, setPersistOriginal] = useState(profile.saveOriginalDocs);

  // Integrated Company & Job Description comparison state
  const [jdInputMode, setJdInputMode] = useState<'text' | 'file'>('text');
  const [companyName, setCompanyName] = useState(activeJobMatch?.company || '');
  const [targetRole, setTargetRole] = useState(activeJobMatch?.jobTitle || '');
  const [jdText, setJdText] = useState(activeJobMatch?.jobDescription || '');
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [jdParsing, setJdParsing] = useState(false);
  const [comparingJd, setComparingJd] = useState(false);

  const isSavedInDb = activeAnalysis
    ? analyses.some((a) => a.id === activeAnalysis.id)
    : false;

  const currentMatchForActive = useMemo(() => {
    if (!activeAnalysis || !activeJobMatch) return null;
    return activeJobMatch.analysisId === activeAnalysis.id ? activeJobMatch : null;
  }, [activeAnalysis, activeJobMatch]);

  const bulletCoachItems = useMemo(() => {
    if (!activeAnalysis) return [];
    return generateBulletCoachSuggestions(activeAnalysis.nlp.bulletQuality, 5);
  }, [activeAnalysis]);

  const radarData = useMemo(() => {
    if (!activeAnalysis) return [];
    const pick = (key: string) =>
      activeAnalysis.ats.categories.find((c) => c.key === key)?.score || 0;
    return [
      { axis: 'Structure', score: pick('resumeStructure') },
      { axis: 'Experience', score: pick('workExperience') },
      { axis: 'Skills', score: pick('skills') },
      { axis: 'Impact', score: pick('quantifiedAchievements') },
      { axis: 'Readability', score: pick('readability') },
      { axis: 'Bullets', score: pick('bulletQuality') },
    ];
  }, [activeAnalysis]);

  const runOptionalComparison = async (record: ResumeAnalysisRecord) => {
    if (jdText.trim().length < 30) return null;
    let semanticScore: number | undefined;
    if (getLoadedModelStatus() === 'ready') {
      const sim = await computeSemanticSimilarityWithModel(record.extractedText, jdText);
      if (typeof sim === 'number') semanticScore = sim;
    }
    const match = runJobDescriptionMatch({
      analysis: record,
      jobTitle: targetRole.trim() || 'Target Role',
      company: companyName.trim() || 'Target Company',
      requiredExperience: '',
      jobLocation: '',
      jobDescription: jdText,
      customSkills,
      semanticModelScore: semanticScore,
    });
    await saveJobMatch(match);
    return match;
  };

  const handleFileSelected = async (file: File) => {
    setParseError(null);
    setParsing(true);
    setProgressPct(5);
    setProgressStage('Validating resume file...');

    try {
      const parsed = await parseResumeFile(file, (pct, stage) => {
        setProgressPct(Math.round(pct * 0.7));
        setProgressStage(stage);
      });

      setProgressPct(78);
      setProgressStage('Running Web Worker language rules & ATS heuristics...');

      const { nlp, ats } = await analyzeResumeTextAsync({
        text: parsed.text,
        customSkills,
        weights: atsWeights,
      });

      setProgressPct(100);
      setProgressStage('Analysis complete.');
      setRawArrayBuffer(parsed.arrayBuffer);
      setEditableText(parsed.text);
      setIsEditingText(false);

      const record = buildAnalysisRecord({
        fileName: parsed.fileName,
        fileSize: parsed.fileSize,
        fileType: parsed.fileType,
        extractedText: parsed.text,
        pageCount: parsed.pageCount,
        parsingWarnings: parsed.warnings,
        nlp,
        ats,
        weightsUsed: atsWeights,
      });

      setActiveAnalysis(record);
      const match = await runOptionalComparison(record);

      addToast({
        type: 'success',
        title: match
          ? 'Resume analyzed & compared against company posting'
          : 'Document parsed & analyzed locally',
        description: match
          ? `ATS Score: ${ats.overallScore}/100 · ${match.company} Match: ${match.overallMatchScore}%`
          : `Heuristic ATS score: ${ats.overallScore}/100. Kept in memory until you choose to save.`,
      });
    } catch (err) {
      const msg =
        err instanceof DocumentParseError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unexpected error during document parsing.';
      setParseError(msg);
      addToast({ type: 'error', title: 'Document extraction failed', description: msg });
    } finally {
      setParsing(false);
    }
  };

  const handleAnalyzePastedResume = async (e: React.FormEvent) => {
    e.preventDefault();
    setParseError(null);
    const trimmed = pastedResumeText.trim();
    if (trimmed.length < 40) {
      addToast({
        type: 'warning',
        title: 'Resume text too short',
        description: 'Paste at least 40 characters of resume text so sections and skills can be evaluated.',
      });
      return;
    }

    setParsing(true);
    setProgressPct(35);
    setProgressStage('Analyzing pasted plain text...');

    try {
      const { nlp, ats } = await analyzeResumeTextAsync({
        text: trimmed,
        customSkills,
        weights: atsWeights,
      });

      setProgressPct(100);
      setProgressStage('Analysis complete.');
      setRawArrayBuffer(null);
      setEditableText(trimmed);
      setIsEditingText(false);

      const safeTitle = (pastedResumeTitle.trim() || 'Pasted_Resume').replace(/\.txt$/i, '') + '.txt';
      const byteSize = new TextEncoder().encode(trimmed).length;

      const record = buildAnalysisRecord({
        fileName: safeTitle,
        fileSize: byteSize,
        fileType: 'txt',
        extractedText: trimmed,
        parsingWarnings: [],
        nlp,
        ats,
        weightsUsed: atsWeights,
      });

      setActiveAnalysis(record);
      const match = await runOptionalComparison(record);

      addToast({
        type: 'success',
        title: match
          ? 'Resume text analyzed & matched against company posting'
          : 'Resume text analyzed locally',
        description: match
          ? `ATS Score: ${ats.overallScore}/100 · ${match.company} Match: ${match.overallMatchScore}%`
          : `Heuristic ATS score: ${ats.overallScore}/100.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to analyze resume text.';
      setParseError(msg);
      addToast({ type: 'error', title: 'Analysis failed', description: msg });
    } finally {
      setParsing(false);
    }
  };

  const handleJdFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setJdParsing(true);
    try {
      const parsed = await parseResumeFile(file);
      setJdText(parsed.text);
      setJdFileName(parsed.fileName);
      setJdInputMode('text');
      addToast({
        type: 'success',
        title: `Loaded job description from ${parsed.fileName}`,
        description: `${parsed.text.split(/\s+/).filter(Boolean).length} words extracted.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not read job description file.';
      addToast({ type: 'error', title: 'Job description file error', description: msg });
    } finally {
      setJdParsing(false);
    }
  };

  const handleCompareWithCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAnalysis) {
      addToast({
        type: 'warning',
        title: 'Analyze a resume first',
        description: 'Upload a resume file or paste resume text before running company comparison.',
      });
      return;
    }
    if (!companyName.trim()) {
      addToast({
        type: 'warning',
        title: 'Company name required',
        description: 'Enter the target company name to compare against.',
      });
      return;
    }
    if (jdText.trim().length < 30) {
      addToast({
        type: 'warning',
        title: 'Job description too short',
        description: 'Paste or upload at least 30 characters of the company job posting.',
      });
      return;
    }

    setComparingJd(true);
    try {
      const match = await runOptionalComparison(activeAnalysis);
      if (match) {
        addToast({
          type: 'success',
          title: `Compared against ${match.company}`,
          description: `Overall Match Score: ${match.overallMatchScore}%`,
        });
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Comparison failed',
        description: err instanceof Error ? err.message : 'Unable to compare resume against posting.',
      });
    } finally {
      setComparingJd(false);
    }
  };

  const handleReanalyzeEditedText = async () => {
    if (!activeAnalysis) return;
    if (editableText.trim().length < 20) {
      addToast({
        type: 'warning',
        title: 'Text too short',
        description: 'Provide at least 20 characters to run analysis and ATS scoring.',
      });
      return;
    }

    setParsing(true);
    setProgressPct(50);
    setProgressStage('Re-running language checks & ATS heuristics...');
    try {
      const { nlp, ats } = await analyzeResumeTextAsync({
        text: editableText,
        customSkills,
        weights: atsWeights,
      });
      const updated = {
        ...activeAnalysis,
        extractedText: editableText,
        nlp,
        ats,
        weightsUsed: atsWeights,
        updatedAt: new Date().toISOString(),
      };
      setActiveAnalysis(updated);
      if (isSavedInDb) {
        await saveAnalysisToLocal(updated);
      }
      if (jdText.trim().length >= 30) {
        await runOptionalComparison(updated);
      }
      setIsEditingText(false);
      addToast({ type: 'success', title: 'Re-analysis complete' });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Re-analysis failed',
        description: err instanceof Error ? err.message : 'Could not re-analyze edited text.',
      });
    } finally {
      setParsing(false);
    }
  };

  const handleSaveWithConsent = async () => {
    if (!activeAnalysis) return;
    let recordToSave = activeAnalysis;
    if (persistOriginal && rawArrayBuffer) {
      recordToSave = {
        ...activeAnalysis,
        savedOriginalBase64: arrayBufferToBase64(rawArrayBuffer),
      };
    }
    if (!profile.consentToSaveLocal) {
      await saveProfile({ consentToSaveLocal: true, saveOriginalDocs: persistOriginal });
    }
    const ok = await saveAnalysisToLocal(recordToSave);
    if (ok && currentMatchForActive) {
      await saveJobMatch(currentMatchForActive);
    }
    if (ok) {
      addToast({
        type: 'success',
        title: 'Saved to local IndexedDB',
        description: persistOriginal
          ? 'Analysis metadata and original file bytes saved locally.'
          : 'Analysis metadata and extracted text saved locally (original file kept out of storage).',
      });
    }
  };

  const handleRemoveCurrent = () => {
    setActiveAnalysis(null);
    setActiveJobMatch(null);
    setRawArrayBuffer(null);
    setEditableText('');
    setParseError(null);
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast({ type: 'success', title: `${label} copied to clipboard` });
    } catch {
      addToast({ type: 'error', title: 'Clipboard access blocked' });
    }
  };

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Resume Analyzer &amp; Company Comparison
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Upload PDF, DOCX, or TXT — or paste raw resume text — and compare directly against a target company and job posting.
            </p>
          </div>
          {activeAnalysis && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => exportAnalysisReportPdf(activeAnalysis, currentMatchForActive)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                <span>
                  {currentMatchForActive ? 'Export Combined PDF' : 'Export PDF Report'}
                </span>
              </button>
              <Link
                to="/resume-builder?import=analysis"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
              >
                <FilePlus2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Open in Builder</span>
              </Link>
              <Link
                to="/cover-letter-studio"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap"
              >
                <PenTool className="h-3.5 w-3.5" />
                <span>Draft Cover Letter</span>
              </Link>
            </div>
          )}
        </div>

        {/* Dual-Column Intake: Resume Input (File OR Text) + Company Job Description Comparison */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left: Resume Input */}
          <Card className="xl:col-span-6">
            <CardHeader
              title="1. Resume Source"
              subtitle="Files stay in browser memory by default"
              action={
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => setResumeInputMode('file')}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                      resumeInputMode === 'file'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeInputMode('text')}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                      resumeInputMode === 'text'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Paste Text (.txt)
                  </button>
                </div>
              }
            />

            {resumeInputMode === 'file' ? (
              <FileUploadZone
                onFileSelected={handleFileSelected}
                selectedFile={
                  activeAnalysis
                    ? {
                        name: activeAnalysis.fileName,
                        size: activeAnalysis.fileSize,
                        type: activeAnalysis.fileType,
                        pageCount: activeAnalysis.pageCount,
                      }
                    : null
                }
                onRemoveFile={activeAnalysis ? handleRemoveCurrent : undefined}
                disabled={parsing}
              />
            ) : (
              <form onSubmit={handleAnalyzePastedResume} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Document Label (.txt)
                  </label>
                  <input
                    type="text"
                    value={pastedResumeTitle}
                    onChange={(e) => setPastedResumeTitle(e.target.value)}
                    placeholder="My_Resume.txt"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Paste Full Resume Text
                    </label>
                    <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {pastedResumeText.trim() ? pastedResumeText.trim().split(/\s+/).length : 0} words
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={pastedResumeText}
                    onChange={(e) => setPastedResumeText(e.target.value)}
                    placeholder="Paste your summary, work experience, skills, projects, and education text here..."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setPastedResumeText('')}
                    disabled={!pastedResumeText}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40"
                  >
                    Clear Text
                  </button>
                  <button
                    type="submit"
                    disabled={parsing}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Analyze Resume Text</span>
                  </button>
                </div>
              </form>
            )}

            {parsing && (
              <div className="mt-5">
                <ProgressBar value={progressPct} label={progressStage} />
              </div>
            )}

            {parseError && (
              <div className="mt-5">
                <ErrorState title="Could not extract readable text" message={parseError} />
              </div>
            )}
          </Card>

          {/* Right: Target Company & Job Description Comparison */}
          <Card className="xl:col-span-6">
            <CardHeader
              title="2. Company &amp; Job Description Comparison"
              subtitle="Optional — compare your resume against a company role (paste text or upload TXT/PDF/DOCX)"
              action={
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => setJdInputMode('text')}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                      jdInputMode === 'text'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Paste JD
                  </button>
                  <button
                    type="button"
                    onClick={() => setJdInputMode('file')}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                      jdInputMode === 'file'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Upload JD File
                  </button>
                </div>
              }
            />

            <form onSubmit={handleCompareWithCompany} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Company Name *
                  </label>
                  <div className="relative">
                    <Building2 className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g., Northstar Systems"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g., Full-Stack Engineer"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {jdInputMode === 'file' ? (
                <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 text-center space-y-2.5">
                  <Upload className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mx-auto" />
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {jdParsing
                      ? 'Extracting job description text...'
                      : 'Upload a Job Description file (.txt, .pdf, .docx)'}
                  </p>
                  {jdFileName && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Loaded: {jdFileName}
                    </p>
                  )}
                  <label className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white cursor-pointer">
                    <span>Choose JD File</span>
                    <input
                      type="file"
                      accept=".txt,.pdf,.docx"
                      className="hidden"
                      onChange={handleJdFileUpload}
                      disabled={jdParsing}
                    />
                  </label>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Job Description Text {jdFileName ? `(from ${jdFileName})` : ''}
                    </label>
                    <label className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                      Load .txt/.pdf/.docx
                      <input
                        type="file"
                        accept=".txt,.pdf,.docx"
                        className="hidden"
                        onChange={handleJdFileUpload}
                        disabled={jdParsing}
                      />
                    </label>
                  </div>
                  <textarea
                    rows={6}
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste the company's job posting, responsibilities, and required tech stack here..."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs leading-relaxed text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Uses TF-IDF cosine similarity + required/preferred skill evidence.
                </span>
                <button
                  type="submit"
                  disabled={comparingJd || parsing}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 disabled:opacity-60 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{comparingJd ? 'Comparing...' : 'Compare Resume vs. Company'}</span>
                </button>
              </div>
            </form>
          </Card>
        </div>

        {/* Active Analysis Results */}
        {activeAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Local Save Consent Banner */}
            <Card>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isSavedInDb ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Save className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {isSavedInDb
                        ? 'Saved in Local IndexedDB History'
                        : 'Memory-Only Session — Save to Local History?'}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Browser storage is local to this device. Clearing site data removes saved records unless you export a JSON backup.
                  </p>
                  {!isSavedInDb && rawArrayBuffer && (
                    <label className="inline-flex items-center gap-2 pt-1 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={persistOriginal}
                        onChange={(e) => setPersistOriginal(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>
                        Also store original binary document ({formatFileSize(activeAnalysis.fileSize)}) in IndexedDB
                      </span>
                    </label>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {!isSavedInDb && (
                    <button
                      type="button"
                      onClick={handleSaveWithConsent}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Analysis Locally</span>
                    </button>
                  )}
                  <Link
                    to="/ats-intelligence"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Full ATS Breakdown</span>
                  </Link>
                  <Link
                    to="/nlp-laboratory"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                  >
                    <Microscope className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Language Lab</span>
                  </Link>
                </div>
              </div>
            </Card>

            {activeAnalysis.parsingWarnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  {activeAnalysis.parsingWarnings.map((w, i) => (
                    <p key={i}>{w}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Overview Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card padding="sm">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Heuristic ATS Score
                </p>
                <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                  {activeAnalysis.ats.overallScore}
                  <span className="text-base font-normal text-slate-400"> / 100</span>
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Method: Weighted 14-category rubric
                </p>
              </Card>

              <Card padding="sm">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Extracted Volume
                </p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {activeAnalysis.nlp.tokenStats.totalWords} words
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {activeAnalysis.nlp.tokenStats.sentenceCount} sentences · FK Grade{' '}
                  {activeAnalysis.nlp.tokenStats.readingGradeLevel}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                  Method: Tokenization &amp; Flesch-Kincaid
                </p>
              </Card>

              <Card padding="sm">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Skills Detected
                </p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {activeAnalysis.nlp.skills.found.length}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {activeAnalysis.nlp.skills.usedInExperience.length} in experience ·{' '}
                  {activeAnalysis.nlp.skills.unsubstantiated.length} unsubstantiated
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                  Method: Exact &amp; alias dictionary
                </p>
              </Card>

              <Card padding="sm">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {currentMatchForActive
                    ? `Match vs. ${currentMatchForActive.company}`
                    : 'Quantified Outcomes'}
                </p>
                {currentMatchForActive ? (
                  <>
                    <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {currentMatchForActive.overallMatchScore}%
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      Skills {currentMatchForActive.skillsMatchScore}% · TF-IDF{' '}
                      {currentMatchForActive.tfidfCosineSimilarity}%
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                      Method: {typeof currentMatchForActive.semanticModelScore === 'number' ? 'TF-IDF + Local Transformer' : 'Lexical TF-IDF + Skills'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                      {activeAnalysis.nlp.quantifiedAchievements.length}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {activeAnalysis.nlp.actionVerbs.length} action verbs ·{' '}
                      {activeAnalysis.nlp.weakPhrases.length} weak phrases
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                      Method: Quantitative regex &amp; verb lexicon
                    </p>
                  </>
                )}
              </Card>
            </div>

            {/* Integrated Company Comparison Breakdown (when run) */}
            {currentMatchForActive && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <Card>
                  <CardHeader
                    title={`Company Comparison: ${currentMatchForActive.jobTitle} at ${currentMatchForActive.company}`}
                    subtitle={`Methods: ${currentMatchForActive.methodBreakdown.join(' · ')}`}
                    action={
                      <Link
                        to="/job-matching"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <span>Full Match View</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    }
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
                    {[
                      {
                        label: 'Overall Match',
                        val: `${currentMatchForActive.overallMatchScore}%`,
                        method:
                          typeof currentMatchForActive.semanticModelScore === 'number'
                            ? 'Hybrid Classical + MiniLM'
                            : 'Weighted Classical',
                      },
                      {
                        label: 'Skills Coverage',
                        val: `${currentMatchForActive.skillsMatchScore}%`,
                        method: 'Skills Dictionary',
                      },
                      {
                        label: 'TF-IDF Cosine',
                        val: `${currentMatchForActive.tfidfCosineSimilarity}%`,
                        method: 'Lexical TF-IDF Vector',
                      },
                      {
                        label: 'Keyword Overlap',
                        val: `${currentMatchForActive.keywordOverlapScore}%`,
                        method: 'Stemmed Token Set',
                      },
                      {
                        label: 'Section Evidence',
                        val: `${currentMatchForActive.sectionRelevanceScore}%`,
                        method: 'Experience/Project Proof',
                      },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3"
                      >
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{m.label}</p>
                        <p className="mt-1 font-mono text-lg font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                          {m.val}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                          {m.method}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
                    <div>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">
                        Matched Skills ({currentMatchForActive.matchedSkills.length})
                      </p>
                      <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                        {currentMatchForActive.matchedSkills.join(', ') || 'None matched'}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-rose-700 dark:text-rose-400 mb-1.5">
                        Missing Required Skills ({currentMatchForActive.missingRequiredSkills.length})
                      </p>
                      <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                        {currentMatchForActive.missingRequiredSkills.join(', ') ||
                          'No required dictionary skills missing'}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                        Resume Evidence Snippets
                      </p>
                      {currentMatchForActive.relevantEvidence.length === 0 ? (
                        <p className="text-slate-500">No direct line snippets matched.</p>
                      ) : (
                        <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                          {currentMatchForActive.relevantEvidence.slice(0, 3).map((ev, i) => (
                            <li key={i} className="truncate">
                              <strong className="text-indigo-600 dark:text-indigo-400">
                                {ev.skillOrKeyword}:
                              </strong>{' '}
                              {ev.snippet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Advanced Visual Diagnostics: Radar Chart + Parseability Diagnostics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Card className="lg:col-span-5">
                <CardHeader
                  title="Core Readiness Radar"
                  subtitle="Visual profile across 6 core resume dimensions"
                />
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                      <PolarGrid stroke="rgba(148,163,184,0.24)" />
                      <PolarAngleAxis
                        dataKey="axis"
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fontSize: 9, fill: '#94A3B8' }}
                      />
                      <Tooltip content={<ChartTooltipContent suffix="/100" />} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#7C3AED"
                        fill="#6366F1"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="lg:col-span-7">
                <CardHeader
                  title="Action Verb &amp; Bullet Improvement Coach"
                  subtitle="Deterministic suggestions to sharpen weak openers and prompt measurable outcomes"
                />
                {bulletCoachItems.length === 0 ? (
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    All inspected experience/project bullets open with strong action verbs and measurable metrics.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {bulletCoachItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 text-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-slate-700 dark:text-slate-300">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              Original ({item.section}):
                            </span>{' '}
                            {item.original}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCopyText(item.guidedTemplate, 'Guided template')}
                            title="Copy guided template"
                            className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                        <p className="text-amber-700 dark:text-amber-400">
                          Issues: {item.issues.join(' · ')}
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                          <strong>Suggested openers:</strong> {item.suggestedVerbs.join(', ')}
                        </p>
                        <p className="rounded bg-indigo-50/70 dark:bg-indigo-950/40 px-2.5 py-1.5 font-mono text-[11px] text-indigo-900 dark:text-indigo-200">
                          {item.guidedTemplate}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Extracted Document Text + Sections & Priority Suggestions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Card className="lg:col-span-7">
                <CardHeader
                  title="Extracted Document Text"
                  subtitle="Inspect raw parsed output or edit text and re-run scoring"
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditingText) {
                          handleReanalyzeEditedText();
                        } else {
                          setEditableText(activeAnalysis.extractedText);
                          setIsEditingText(true);
                        }
                      }}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                    >
                      {isEditingText ? 'Apply & Re-analyze' : 'Edit Extracted Text'}
                    </button>
                  }
                />

                {isEditingText ? (
                  <div className="space-y-3">
                    <textarea
                      value={editableText}
                      onChange={(e) => setEditableText(e.target.value)}
                      rows={16}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditableText(activeAnalysis.extractedText);
                          setIsEditingText(false);
                        }}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleReanalyzeEditedText}
                        className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-medium text-white"
                      >
                        Re-run Analysis
                      </button>
                    </div>
                  </div>
                ) : (
                  <pre className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-4 font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {activeAnalysis.extractedText}
                  </pre>
                )}
              </Card>

              <div className="lg:col-span-5 space-y-6">
                <Card>
                  <CardHeader
                    title="Parseability &amp; Entities"
                    subtitle="Deterministic section &amp; contact diagnostics"
                  />
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Sections Found
                      </p>
                      <p className="mt-1 text-slate-800 dark:text-slate-200">
                        {Object.keys(activeAnalysis.nlp.sectionsDetected)
                          .filter((k) => k !== 'header')
                          .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
                          .join(' · ') || 'No standard headings detected'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Contact &amp; Candidate Hints
                      </p>
                      <p className="mt-1 text-slate-800 dark:text-slate-200">
                        {[
                          activeAnalysis.nlp.entities.names[0]?.value,
                          activeAnalysis.nlp.entities.emails[0]?.value,
                          activeAnalysis.nlp.entities.phones[0]?.value,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'No contact fields detected'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Top Skills Found
                      </p>
                      <p className="mt-1 text-slate-800 dark:text-slate-200 leading-relaxed">
                        {activeAnalysis.nlp.skills.found
                          .slice(0, 14)
                          .map((s) => `${s.name} (${s.count}x)`)
                          .join(', ') || 'No dictionary skills matched'}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                      <span className="text-slate-600 dark:text-slate-400">
                        Duplicate lines:{' '}
                        <strong className="font-mono text-slate-900 dark:text-white">
                          {activeAnalysis.nlp.duplicateSentences.length}
                        </strong>
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        Richness:{' '}
                        <strong className="font-mono text-slate-900 dark:text-white">
                          {activeAnalysis.nlp.tokenStats.vocabularyRichness}%
                        </strong>
                      </span>
                    </div>
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Priority Suggestions" />
                  {activeAnalysis.ats.suggestions.length === 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      No high-priority structural gaps flagged.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {activeAnalysis.ats.suggestions.slice(0, 4).map((s) => (
                        <li key={s.id} className="text-sm">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {s.title}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                            {s.description}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </WorkspaceLayout>
  );
}
