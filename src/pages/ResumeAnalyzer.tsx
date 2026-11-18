import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Download,
  FileText,
  History,
  RotateCcw,
  Sparkles,
  Upload,
} from 'lucide-react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { FileUploadZone } from '../components/ui/FileUploadZone';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ErrorState } from '../components/ui/StateViews';
import { IntelligenceReportDashboard } from '../components/analyzer/IntelligenceReportDashboard';
import {
  arrayBufferToBase64,
  DocumentParseError,
  parseResumeFile,
} from '../utils/documentParser';
import { analyzeResumeTextAsync, buildAnalysisRecord } from '../nlp/analyzeResume';
import { runJobDescriptionMatch } from '../nlp/matching';
import {
  buildResumeJobIntelligence,
  verifyCompanyAndTitleConsistency,
} from '../nlp/jobIntelligenceEngine';
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

  const resumeSectionRef = useRef<HTMLDivElement | null>(null);
  const jobSectionRef = useRef<HTMLDivElement | null>(null);

  // Section 01: Resume Import state (Upload PDF/DOCX/TXT OR Paste Resume Content)
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

  // Section 02: Target Job & Company Details state
  const [jdInputMode, setJdInputMode] = useState<'text' | 'file'>('text');
  const [companyName, setCompanyName] = useState(activeJobMatch?.company || '');
  const [targetRole, setTargetRole] = useState(activeJobMatch?.jobTitle || '');
  const [jdText, setJdText] = useState(activeJobMatch?.jobDescription || '');
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [jdParsing, setJdParsing] = useState(false);
  const [comparingJd, setComparingJd] = useState(false);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  const lastSyncedMatchIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeAnalysis) {
      setEditableText(activeAnalysis.extractedText);
      setIsEditingText(false);
    }
  }, [activeAnalysis?.id, activeAnalysis?.extractedText]);

  useEffect(() => {
    if (
      activeAnalysis &&
      activeJobMatch &&
      activeJobMatch.analysisId === activeAnalysis.id &&
      lastSyncedMatchIdRef.current !== activeJobMatch.id
    ) {
      lastSyncedMatchIdRef.current = activeJobMatch.id;
      setCompanyName(activeJobMatch.company);
      setTargetRole(activeJobMatch.jobTitle);
      setJdText(activeJobMatch.jobDescription);
    }
  }, [activeAnalysis, activeJobMatch]);

  const isSavedInDb = activeAnalysis
    ? analyses.some((a) => a.id === activeAnalysis.id)
    : false;

  const currentMatchForActive = useMemo(() => {
    if (!activeAnalysis || !activeJobMatch) return null;
    return activeJobMatch.analysisId === activeAnalysis.id ? activeJobMatch : null;
  }, [activeAnalysis, activeJobMatch]);

  const liveConsistencyWarnings = useMemo(() => {
    if (jdText.trim().length < 30) return [];
    return verifyCompanyAndTitleConsistency({
      companyName,
      targetRole,
      jobDescription: jdText,
    });
  }, [companyName, targetRole, jdText]);

  const intelligence = useMemo(() => {
    if (!activeAnalysis) return null;
    const effectiveCompany = currentMatchForActive?.company ?? companyName;
    const effectiveRole = currentMatchForActive?.jobTitle ?? targetRole;
    const effectiveJd = currentMatchForActive?.jobDescription ?? '';
    return buildResumeJobIntelligence({
      analysis: activeAnalysis,
      companyName: effectiveCompany,
      targetRole: effectiveRole,
      jobDescription: effectiveJd,
      jobMatch: currentMatchForActive,
      customSkills,
    });
  }, [activeAnalysis, currentMatchForActive, companyName, targetRole, customSkills]);

  const runJobComparisonForRecord = async (record: ResumeAnalysisRecord) => {
    if (jdText.trim().length < 30 || !companyName.trim() || !targetRole.trim()) return null;
    let semanticScore: number | undefined;
    if (getLoadedModelStatus() === 'ready') {
      const sim = await computeSemanticSimilarityWithModel(record.extractedText, jdText);
      if (typeof sim === 'number') semanticScore = sim;
    }
    const match = runJobDescriptionMatch({
      analysis: record,
      jobTitle: targetRole.trim(),
      company: companyName.trim(),
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
      setProgressStage('Running Web Worker language checks & scoring rubric...');

      const { nlp, ats } = await analyzeResumeTextAsync({
        text: parsed.text,
        customSkills,
        weights: atsWeights,
      });

      setProgressPct(100);
      setProgressStage('Resume analysis complete.');
      setRawArrayBuffer(parsed.arrayBuffer);
      setEditableText(parsed.text);
      setIsEditingText(false);

      const baseRecord = buildAnalysisRecord({
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

      const recordToSave =
        profile.consentToSaveLocal && persistOriginal && parsed.arrayBuffer
          ? { ...baseRecord, savedOriginalBase64: arrayBufferToBase64(parsed.arrayBuffer) }
          : baseRecord;

      setActiveAnalysis(recordToSave);
      let savedToHistory = false;
      if (profile.consentToSaveLocal) {
        savedToHistory = await saveAnalysisToLocal(recordToSave);
      }
      const match = await runJobComparisonForRecord(recordToSave);

      addToast({
        type: 'success',
        title: match
          ? 'Resume analyzed & compared against target job'
          : savedToHistory
            ? 'Resume analyzed & saved to History'
            : 'Document parsed & analyzed locally',
        description: match
          ? `Quality Score: ${ats.overallScore}/100 · ${match.company} Compatibility: ${match.overallMatchScore}%`
          : `Resume quality score: ${ats.overallScore}/100. Add Target Job & Company Details in Section 02 to compare against a role.`,
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
    setProgressStage('Analyzing pasted resume content...');

    try {
      const { nlp, ats } = await analyzeResumeTextAsync({
        text: trimmed,
        customSkills,
        weights: atsWeights,
      });

      setProgressPct(100);
      setProgressStage('Resume analysis complete.');
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
      let savedToHistory = false;
      if (profile.consentToSaveLocal) {
        savedToHistory = await saveAnalysisToLocal(record);
      }
      const match = await runJobComparisonForRecord(record);

      addToast({
        type: 'success',
        title: match
          ? 'Resume content analyzed & matched against target job'
          : savedToHistory
            ? 'Resume analyzed & saved to History'
            : 'Resume content analyzed locally',
        description: match
          ? `Quality Score: ${ats.overallScore}/100 · ${match.company} Compatibility: ${match.overallMatchScore}%`
          : `Resume quality score: ${ats.overallScore}/100.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to analyze resume content.';
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
      setFormValidationError(null);
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

  const handleAnalyzeCompatibility = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    if (!activeAnalysis) {
      const msg = 'Upload a resume before starting the analysis.';
      setFormValidationError(msg);
      addToast({ type: 'warning', title: 'Resume required first', description: msg });
      resumeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!companyName.trim()) {
      const msg = 'Enter the Target Company Name before running analysis.';
      setFormValidationError(msg);
      addToast({ type: 'warning', title: 'Target Company Name required', description: msg });
      return;
    }
    if (!targetRole.trim()) {
      const msg = 'Enter the Target Job Title before running analysis.';
      setFormValidationError(msg);
      addToast({ type: 'warning', title: 'Target Job Title required', description: msg });
      return;
    }
    if (jdText.trim().length < 30) {
      const msg = 'Add the job description so we can compare your resume with the role.';
      setFormValidationError(msg);
      addToast({ type: 'warning', title: 'Job description too short', description: msg });
      return;
    }

    setComparingJd(true);
    try {
      const match = await runJobComparisonForRecord(activeAnalysis);
      if (match) {
        addToast({
          type: 'success',
          title: `Intelligence report updated for ${match.jobTitle} at ${match.company}`,
          description: `Job Compatibility Score: ${match.overallMatchScore}% · Skills Coverage: ${match.skillsMatchScore}%`,
        });
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Compatibility analysis failed',
        description: err instanceof Error ? err.message : 'Unable to evaluate resume against target job.',
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
      if (isSavedInDb || profile.consentToSaveLocal) {
        await saveAnalysisToLocal(updated);
      }
      if (jdText.trim().length >= 30 && companyName.trim() && targetRole.trim()) {
        await runJobComparisonForRecord(updated);
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
    setIsEditingText(false);
  };

  const handleStartNewAnalysis = () => {
    handleRemoveCurrent();
    setPastedResumeText('');
    setPastedResumeTitle('Pasted_Resume.txt');
    setCompanyName('');
    setTargetRole('');
    setJdText('');
    setJdFileName(null);
    setFormValidationError(null);
    resumeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    addToast({
      type: 'info',
      title: 'Workspace session reset',
      description: 'Saved records in Analysis History remain untouched.',
    });
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast({ type: 'success', title: `${label} copied to clipboard` });
    } catch {
      addToast({ type: 'error', title: 'Clipboard access blocked' });
    }
  };

  const handleJumpToJobSection = () => {
    jobSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        {/* Top Header + Quick Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Resume Intelligence &amp; Job Compatibility
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Get a comprehensive assessment of your resume against your target job. Understand your strengths, identify missing requirements, evaluate your skills, and discover exactly what you should improve.
            </p>
          </div>

          {activeAnalysis && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => exportAnalysisReportPdf(activeAnalysis, currentMatchForActive)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Complete Analysis</span>
              </button>
              <Link
                to="/analysis-history"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
              >
                <History className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Analysis History</span>
              </Link>
              <button
                type="button"
                onClick={handleStartNewAnalysis}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Start New Analysis</span>
              </button>
            </div>
          )}
        </div>

        {/* Section 01 (Resume Import) + Section 02 (Target Job & Company Details) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* 01. Resume Import */}
          <div ref={resumeSectionRef} className="xl:col-span-6">
            <Card>
              <CardHeader
                title="01. Resume Import"
                subtitle="PDF, DOCX, or TXT up to 10 MB — or paste your resume content directly"
                action={
                  <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                    <button
                      type="button"
                      onClick={() => setResumeInputMode('file')}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
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
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                        resumeInputMode === 'text'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Or Paste Resume Content
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
                    <label
                      htmlFor="pasted-resume-title"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Document Label (.txt)
                    </label>
                    <input
                      id="pasted-resume-title"
                      type="text"
                      value={pastedResumeTitle}
                      onChange={(e) => setPastedResumeTitle(e.target.value)}
                      placeholder="My_Resume.txt"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="pasted-resume-content"
                        className="text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        Paste Resume Content
                      </label>
                      <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {pastedResumeText.trim() ? pastedResumeText.trim().split(/\s+/).length : 0} words
                      </span>
                    </div>
                    <textarea
                      id="pasted-resume-content"
                      rows={8}
                      value={pastedResumeText}
                      onChange={(e) => setPastedResumeText(e.target.value)}
                      placeholder="Paste your summary, work experience, skills, projects, and education content here..."
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
                      <span>Analyze Resume Content</span>
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
          </div>

          {/* 02. Target Job & Company Details */}
          <div ref={jobSectionRef} className="xl:col-span-6">
            <Card>
              <CardHeader
                title="02. Target Job &amp; Company Details"
                subtitle="Enter target company, job title, and job requirements to unlock compatibility & skill-gap intelligence"
                action={
                  <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                    <button
                      type="button"
                      onClick={() => setJdInputMode('text')}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
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
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
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

              <form onSubmit={handleAnalyzeCompatibility} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="target-company-name"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Target Company Name *
                    </label>
                    <div className="relative">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="target-company-name"
                        type="text"
                        value={companyName}
                        onChange={(e) => {
                          setCompanyName(e.target.value);
                          setFormValidationError(null);
                        }}
                        placeholder="Enter target company name"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="target-job-title"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Target Job Title *
                    </label>
                    <div className="relative">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="target-job-title"
                        type="text"
                        value={targetRole}
                        onChange={(e) => {
                          setTargetRole(e.target.value);
                          setFormValidationError(null);
                        }}
                        placeholder="Enter target job title"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {jdInputMode === 'file' ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 text-center space-y-2.5 bg-slate-50/60 dark:bg-slate-950/40">
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
                      <span>Browse Files</span>
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
                      <label
                        htmlFor="job-description-textarea"
                        className="text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        Job Description * {jdFileName ? `(from ${jdFileName})` : ''}
                      </label>
                      <label className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                        Import .txt/.pdf/.docx
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
                      id="job-description-textarea"
                      rows={6}
                      value={jdText}
                      onChange={(e) => {
                        setJdText(e.target.value);
                        setFormValidationError(null);
                      }}
                      placeholder="Paste the complete job requirements here."
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs leading-relaxed text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                )}

                {formValidationError && (
                  <div className="rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span>{formValidationError}</span>
                  </div>
                )}

                {liveConsistencyWarnings.length > 0 && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 px-3 py-2.5 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Company &amp; Job Title vs. Job Description Consistency Notice</span>
                    </div>
                    {liveConsistencyWarnings.map((w, i) => (
                      <p key={i} className="leading-relaxed">
                        {w.message}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    TF-IDF similarity + OR-group &amp; required/preferred skill evidence.
                  </span>
                  <button
                    type="submit"
                    disabled={comparingJd || parsing}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>
                      {comparingJd
                        ? 'Analyzing Compatibility...'
                        : 'Analyze Resume & Job Compatibility'}
                    </span>
                  </button>
                </div>
              </form>
            </Card>
          </div>
        </div>

        {/* 11-Tab Resume Intelligence Report Dashboard */}
        {activeAnalysis && intelligence && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <IntelligenceReportDashboard
              analysis={activeAnalysis}
              jobMatch={currentMatchForActive}
              intelligence={intelligence}
              companyName={currentMatchForActive?.company ?? companyName}
              targetRole={currentMatchForActive?.jobTitle ?? targetRole}
              isSavedInDb={isSavedInDb}
              rawArrayBufferPresent={Boolean(rawArrayBuffer)}
              persistOriginal={persistOriginal}
              onTogglePersistOriginal={setPersistOriginal}
              onSaveLocal={handleSaveWithConsent}
              editableText={editableText}
              onChangeEditableText={setEditableText}
              isEditingText={isEditingText}
              onToggleEditingText={setIsEditingText}
              onApplyEditedText={handleReanalyzeEditedText}
              onCopyText={handleCopyText}
              onExportPdf={() => exportAnalysisReportPdf(activeAnalysis, currentMatchForActive)}
              onJumpToJobSection={handleJumpToJobSection}
            />
          </motion.div>
        )}
      </div>
    </WorkspaceLayout>
  );
}
