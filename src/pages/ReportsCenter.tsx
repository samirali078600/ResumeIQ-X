import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Check,
  CheckCircle2,
  Clipboard,
  Download,
  FileCode2,
  FileSpreadsheet,
  FileText,
  GitCompare,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/ui/StateViews';
import {
  buildAnalysisMarkdownReport,
  buildAnalysisTextReport,
  exportAnalysisReportPdf,
  exportComparisonReportPdf,
  type ReportExportOptions,
} from '../utils/pdfExport';
import { useAppStore } from '../store/useAppStore';

type ReportMode = 'single' | 'comparison';

function triggerTextDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsCenter() {
  const hydrated = useAppStore((s) => s.hydrated);
  const storageError = useAppStore((s) => s.storageError);
  const analyses = useAppStore((s) => s.analyses);
  const activeAnalysis = useAppStore((s) => s.activeAnalysis);
  const jobMatches = useAppStore((s) => s.jobMatches);
  const activeJobMatch = useAppStore((s) => s.activeJobMatch);
  const logActivity = useAppStore((s) => s.logActivity);
  const addToast = useAppStore((s) => s.addToast);

  const pool = useMemo(
    () => [
      ...(activeAnalysis && !analyses.some((a) => a.id === activeAnalysis.id)
        ? [activeAnalysis]
        : []),
      ...analyses,
    ],
    [activeAnalysis, analyses]
  );

  const allMatches = useMemo(
    () => [
      ...(activeJobMatch && !jobMatches.some((j) => j.id === activeJobMatch.id)
        ? [activeJobMatch]
        : []),
      ...jobMatches,
    ],
    [activeJobMatch, jobMatches]
  );

  const [mode, setMode] = useState<ReportMode>('single');
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>(pool[0]?.id || '');
  const [selectedJobMatchId, setSelectedJobMatchId] = useState<string>(
    activeJobMatch?.id || 'none'
  );
  const [options, setOptions] = useState<Required<ReportExportOptions>>({
    includeCategoryBreakdown: true,
    includeSkillsAndEntities: true,
    includeJobComparison: true,
    includeChecklist: true,
    includeExtractedText: false,
  });

  // Comparison selection state
  const [compareIds, setCompareIds] = useState<string[]>(() =>
    pool.slice(0, 3).map((r) => r.id)
  );

  // Sync defaults after IndexedDB hydration
  useEffect(() => {
    if (pool.length === 0) return;
    if (!selectedAnalysisId || !pool.some((a) => a.id === selectedAnalysisId)) {
      const nextId = activeAnalysis?.id || pool[0].id;
      setSelectedAnalysisId(nextId);
      const linked = allMatches.find((m) => m.analysisId === nextId);
      setSelectedJobMatchId(linked?.id || 'none');
    }
    setCompareIds((prev) => {
      const valid = prev.filter((id) => pool.some((p) => p.id === id));
      return valid.length > 0 ? valid : pool.slice(0, 3).map((r) => r.id);
    });
  }, [pool, allMatches, activeAnalysis, selectedAnalysisId]);

  const selectedAnalysis = pool.find((a) => a.id === selectedAnalysisId) || pool[0];
  const selectedMatch =
    selectedJobMatchId === 'none'
      ? null
      : allMatches.find((j) => j.id === selectedJobMatchId) || null;

  const selectedComparisonRecords = useMemo(
    () => pool.filter((r) => compareIds.includes(r.id)),
    [pool, compareIds]
  );

  const handleAnalysisChange = (nextId: string) => {
    setSelectedAnalysisId(nextId);
    const linked = allMatches.find((m) => m.analysisId === nextId);
    setSelectedJobMatchId(linked?.id || 'none');
  };

  const toggleOption = (key: keyof Required<ReportExportOptions>) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCompareId = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (!hydrated) {
    return (
      <WorkspaceLayout>
        <LoadingSkeleton variant="dashboard" rows={5} />
      </WorkspaceLayout>
    );
  }

  if (!selectedAnalysis) {
    return (
      <WorkspaceLayout>
        <div className="space-y-4">
          {storageError && <ErrorState title="Browser Storage Notice" message={storageError} />}
          <EmptyState
            title="No analysis available for report generation"
            description="Analyze a resume first so ResumeIQ can compile your ATS scores, extracted entities, skills inventory, and job comparison into downloadable PDF, Markdown, or JSON reports."
            action={
              <Link
                to="/analyzer"
                className="inline-flex items-center rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Analyze a Resume
              </Link>
            }
          />
        </div>
      </WorkspaceLayout>
    );
  }

  const baseFileName =
    selectedAnalysis.fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_') ||
    'Resume';

  const handleGeneratePdf = async () => {
    try {
      exportAnalysisReportPdf(selectedAnalysis, selectedMatch, options);
      await logActivity(
        'export',
        `Exported PDF report for ${selectedAnalysis.fileName}`,
        `Score: ${selectedAnalysis.ats.overallScore}/100`
      );
      addToast({ type: 'success', title: 'PDF Intelligence Report downloaded' });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'PDF export failed',
        description: err instanceof Error ? err.message : 'Unable to compile PDF report.',
      });
    }
  };

  const handleExportMarkdown = async () => {
    const md = buildAnalysisMarkdownReport(selectedAnalysis, selectedMatch, options);
    triggerTextDownload(`${baseFileName}_ResumeIQ_Report.md`, md, 'text/markdown;charset=utf-8');
    await logActivity('export', `Exported Markdown report for ${selectedAnalysis.fileName}`, 'Format: .md');
    addToast({ type: 'success', title: 'Markdown report downloaded' });
  };

  const handleExportText = async () => {
    const txt = buildAnalysisTextReport(selectedAnalysis, selectedMatch, options);
    triggerTextDownload(`${baseFileName}_ResumeIQ_Report.txt`, txt, 'text/plain;charset=utf-8');
    await logActivity('export', `Exported Plain Text report for ${selectedAnalysis.fileName}`, 'Format: .txt');
    addToast({ type: 'success', title: 'Plain Text report downloaded' });
  };

  const handleExportJson = async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      source: 'ResumeIQ Reports Center',
      analysis: selectedAnalysis,
      jobMatch: selectedMatch,
    };
    triggerTextDownload(
      `${baseFileName}_ResumeIQ_Report.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8'
    );
    await logActivity('export', `Exported JSON report for ${selectedAnalysis.fileName}`, 'Format: .json');
    addToast({ type: 'success', title: 'JSON report downloaded' });
  };

  const handleCopySummary = async () => {
    const text = buildAnalysisTextReport(selectedAnalysis, selectedMatch, options);
    try {
      await navigator.clipboard.writeText(text);
      addToast({ type: 'success', title: 'Full report text copied to clipboard' });
    } catch {
      addToast({ type: 'error', title: 'Clipboard access blocked in this browser' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportComparisonPdf = async () => {
    if (selectedComparisonRecords.length < 2) {
      addToast({
        type: 'warning',
        title: 'Select at least 2 resumes',
        description: 'Choose two or more saved analyses to generate a comparison report.',
      });
      return;
    }
    exportComparisonReportPdf(selectedComparisonRecords);
    await logActivity(
      'export',
      `Exported comparison PDF (${selectedComparisonRecords.length} resumes)`,
      selectedComparisonRecords.map((r) => r.fileName).join(', ')
    );
    addToast({ type: 'success', title: 'Comparison PDF downloaded' });
  };

  const handleExportComparisonCsv = async () => {
    if (selectedComparisonRecords.length < 2) {
      addToast({
        type: 'warning',
        title: 'Select at least 2 resumes',
        description: 'Choose two or more saved analyses to export a comparison CSV.',
      });
      return;
    }
    const headers = [
      'File Name',
      'File Type',
      'Analyzed At',
      'ATS Score',
      'Skills Detected',
      'Unsubstantiated Skills',
      'Total Words',
      'FK Grade Level',
      'Quantified Bullets',
      'Action Verbs',
    ];
    const escapeCsv = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
    const rows = selectedComparisonRecords.map((r) =>
      [
        r.fileName,
        r.fileType.toUpperCase(),
        new Date(r.createdAt).toISOString(),
        r.ats.overallScore,
        r.nlp.skills.found.length,
        r.nlp.skills.unsubstantiated.length,
        r.nlp.tokenStats.totalWords,
        r.nlp.tokenStats.readingGradeLevel,
        r.nlp.quantifiedAchievements.length,
        r.nlp.actionVerbs.length,
      ]
        .map(escapeCsv)
        .join(',')
    );
    const csv = [headers.map(escapeCsv).join(','), ...rows].join('\n');
    triggerTextDownload(`ResumeIQ_Comparison_${Date.now()}.csv`, csv, 'text/csv;charset=utf-8');
    await logActivity(
      'export',
      `Exported comparison CSV (${selectedComparisonRecords.length} resumes)`,
      'Format: .csv'
    );
    addToast({ type: 'success', title: 'Comparison CSV downloaded' });
  };

  return (
    <WorkspaceLayout>
      <div className="space-y-6 animate-panel-in">
        {/* Header & Mode Tabs */}
        <div className="flex flex-wrap items-start justify-between gap-4 no-print">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Reports Center
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Preview complete resume &amp; job comparison reports and export as PDF, Markdown, Plain Text, CSV, or JSON.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Report generation modes"
            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'single'}
              onClick={() => setMode('single')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'single'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Single Resume Report</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'comparison'}
              onClick={() => setMode('comparison')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'comparison'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" />
              <span>Comparison Report ({pool.length})</span>
            </button>
          </div>
        </div>

        {storageError && <ErrorState title="Browser Storage Notice" message={storageError} />}

        {mode === 'single' ? (
          <>
            {/* Configuration + Multi-Format Export Toolbar */}
            <Card className="no-print">
              <CardHeader
                title="Configure &amp; Export Report"
                subtitle="Select the resume record, optional job comparison, and sections to bundle"
              />
              <div className="space-y-5 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="report-analysis-select"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Resume Analysis Record
                    </label>
                    <select
                      id="report-analysis-select"
                      value={selectedAnalysis.id}
                      onChange={(e) => handleAnalysisChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
                    >
                      {pool.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.fileName} — {r.ats.overallScore}/100 ({new Date(r.createdAt).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="report-job-select"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Include Resume vs. Job Comparison (Optional)
                    </label>
                    <select
                      id="report-job-select"
                      value={selectedJobMatchId}
                      onChange={(e) => setSelectedJobMatchId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
                    >
                      <option value="none">Do not include job comparison</option>
                      {allMatches.map((jm) => (
                        <option key={jm.id} value={jm.id}>
                          {jm.jobTitle} at {jm.company} ({jm.overallMatchScore}% match)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Section Inclusion Toggles */}
                <div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Included Report Sections
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'includeCategoryBreakdown', label: '14-Category ATS Breakdown' },
                      { key: 'includeSkillsAndEntities', label: 'Skills & Extracted Entities' },
                      { key: 'includeJobComparison', label: 'Resume vs. Job Comparison' },
                      { key: 'includeChecklist', label: 'Strengths & Checklist' },
                      { key: 'includeExtractedText', label: 'Full Extracted Text Appendix' },
                    ].map((opt) => {
                      const k = opt.key as keyof Required<ReportExportOptions>;
                      const active = options[k];
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => toggleOption(k)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            active
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <Check className={`h-3.5 w-3.5 ${active ? 'opacity-100' : 'opacity-25'}`} />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Multi-format Export Action Row */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleGeneratePdf}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportMarkdown}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
                  >
                    <FileCode2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Markdown (.md)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportText}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <span>Plain Text (.txt)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>JSON (.json)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
                  >
                    <Clipboard className="h-3.5 w-3.5 text-slate-500" />
                    <span>Copy Report</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-500" />
                    <span>Print Preview</span>
                  </button>
                </div>
              </div>
            </Card>

            {/* Full Live Report Preview (Printable) */}
            <div className="print-only-container space-y-6">
              <Card>
                <CardHeader
                  title={`Report Preview: ${selectedAnalysis.fileName}`}
                  subtitle={`Analyzed ${new Date(selectedAnalysis.createdAt).toLocaleString()} · ${selectedAnalysis.fileType.toUpperCase()}`}
                  action={<ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Overall ATS Score</p>
                    <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                      {selectedAnalysis.ats.overallScore}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Detected Skills</p>
                    <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                      {selectedAnalysis.nlp.skills.found.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Quantified Bullets</p>
                    <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                      {selectedAnalysis.nlp.quantifiedAchievements.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Word Count / Grade</p>
                    <p className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                      {selectedAnalysis.nlp.tokenStats.totalWords} · FK {selectedAnalysis.nlp.tokenStats.readingGradeLevel}
                    </p>
                  </div>
                </div>

                {/* 14-Category Breakdown Preview */}
                {options.includeCategoryBreakdown && (
                  <div className="mt-5 space-y-3">
                    <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                      14-Category Heuristic ATS Breakdown
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedAnalysis.ats.categories.map((cat) => (
                        <div
                          key={cat.key}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white truncate">
                              {cat.label}
                            </span>
                            <span className="font-mono font-bold tabular-nums text-indigo-600 dark:text-indigo-400 shrink-0">
                              {cat.score}/100 ({cat.weight}%)
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500"
                              style={{ width: `${Math.min(100, Math.max(0, cat.score))}%` }}
                            />
                          </div>
                          <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            {cat.details}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills & Entities Preview */}
                {options.includeSkillsAndEntities && (
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-2">
                      <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                        Skills Inventory &amp; Evidence Audit
                      </h3>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        <strong>Detected ({selectedAnalysis.nlp.skills.found.length}):</strong>{' '}
                        {selectedAnalysis.nlp.skills.found
                          .slice(0, 20)
                          .map((s) => `${s.name} (${s.count}x)`)
                          .join(', ') || 'None'}
                      </p>
                      {selectedAnalysis.nlp.skills.unsubstantiated.length > 0 && (
                        <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
                          <strong>Missing Project/Work Context:</strong>{' '}
                          {selectedAnalysis.nlp.skills.unsubstantiated.join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                        Extracted Entities &amp; Top Keywords
                      </h3>
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong>Email / Phone:</strong>{' '}
                        {selectedAnalysis.nlp.entities.emails.map((e) => e.value).join(', ') || 'Not detected'}
                        {selectedAnalysis.nlp.entities.phones.length > 0
                          ? ` · ${selectedAnalysis.nlp.entities.phones.map((p) => p.value).join(', ')}`
                          : ''}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong>Detected Titles:</strong>{' '}
                        {selectedAnalysis.nlp.entities.jobTitles.map((e) => e.value).join(', ') || 'Not detected'}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        <strong>Top Keywords:</strong>{' '}
                        {selectedAnalysis.nlp.wordFrequency
                          .slice(0, 12)
                          .map((w) => `${w.word} (${w.count})`)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Resume vs. Job Comparison Preview */}
                {options.includeJobComparison && selectedMatch && (
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                          Resume vs. Job Comparison: {selectedMatch.jobTitle} ({selectedMatch.company})
                        </h3>
                      </div>
                      <span className="font-mono text-xs font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                        Match: {selectedMatch.overallMatchScore}% · Skills: {selectedMatch.skillsMatchScore}% · Cosine: {selectedMatch.tfidfCosineSimilarity}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="rounded-lg border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 space-y-1.5">
                        <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                          1. What Is Same (Matched)
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {selectedMatch.matchedSkills.join(', ') || 'No direct skill overlaps detected'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 p-3.5 space-y-1.5">
                        <p className="font-semibold text-rose-800 dark:text-rose-300">
                          2. What Is Missing
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          <strong>Required:</strong>{' '}
                          {selectedMatch.missingRequiredSkills.join(', ') || 'None'}
                        </p>
                        {selectedMatch.missingPreferredSkills.length > 0 && (
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            <strong>Preferred:</strong>{' '}
                            {selectedMatch.missingPreferredSkills.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="rounded-lg border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-3.5 space-y-1.5">
                        <p className="font-semibold text-amber-800 dark:text-amber-300">
                          3. What to Improve
                        </p>
                        <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                          {selectedAnalysis.nlp.skills.unsubstantiated.length > 0 && (
                            <li>
                              • Add bullet evidence for: {selectedAnalysis.nlp.skills.unsubstantiated.slice(0, 5).join(', ')}
                            </li>
                          )}
                          {selectedMatch.experienceGapNote && (
                            <li>• {selectedMatch.experienceGapNote}</li>
                          )}
                          {selectedMatch.suggestions.slice(0, 3).map((rec) => (
                            <li key={rec}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Strengths, Weaknesses & Checklist */}
                {options.includeChecklist && (
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                    <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                      Strengths &amp; Actionable Checklist ({selectedAnalysis.ats.suggestions.length} items)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                        {selectedAnalysis.ats.strengths.map((s) => (
                          <li key={s} className="flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                      <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                        {selectedAnalysis.ats.suggestions.slice(0, 6).map((sug) => (
                          <li key={sug.id}>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              [{sug.priority.toUpperCase()}] {sug.title}:
                            </span>{' '}
                            {sug.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Extracted Text Appendix */}
                {options.includeExtractedText && (
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                      Extracted Resume Text
                    </h3>
                    <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                      {selectedAnalysis.extractedText}
                    </pre>
                  </div>
                )}
              </Card>
            </div>
          </>
        ) : (
          /* Multi-Resume Comparison Report Mode */
          <div className="space-y-6">
            <Card className="no-print">
              <CardHeader
                title="Multi-Resume Comparison Report"
                subtitle="Select 2 or more saved resume analyses to benchmark side-by-side and export PDF or CSV"
              />
              {pool.length < 2 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Save at least 2 resume analyses in the Resume Analyzer to unlock multi-resume comparison exports.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pool.map((item) => {
                      const checked = compareIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleCompareId(item.id)}
                          className={`text-left rounded-xl border p-3.5 transition-colors ${
                            checked
                              ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {item.fileName}
                            </span>
                            <span className="font-mono text-xs font-bold tabular-nums text-indigo-600 dark:text-indigo-400 shrink-0">
                              {item.ats.overallScore}/100
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                            {item.nlp.skills.found.length} skills · {item.nlp.tokenStats.totalWords} words ·{' '}
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleExportComparisonPdf}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Comparison PDF ({selectedComparisonRecords.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportComparisonCsv}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Export Comparison CSV</span>
                    </button>
                  </div>
                </div>
              )}
            </Card>

            {selectedComparisonRecords.length >= 2 && (
              <Card>
                <CardHeader
                  title="Side-by-Side Metrics Preview"
                  subtitle={`Comparing ${selectedComparisonRecords.length} selected analyses`}
                />
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                        <th className="py-2.5 pr-3">Document</th>
                        <th className="py-2.5 px-2 text-right">ATS Score</th>
                        <th className="py-2.5 px-2 text-right">Skills</th>
                        <th className="py-2.5 px-2 text-right">Words</th>
                        <th className="py-2.5 px-2 text-right">FK Grade</th>
                        <th className="py-2.5 px-2 text-right">Quantified</th>
                        <th className="py-2.5 pl-2 text-right">Action Verbs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {selectedComparisonRecords.map((r) => (
                        <tr key={r.id} className="h-11">
                          <td className="py-2 pr-3 font-medium text-slate-900 dark:text-white max-w-[220px] truncate">
                            {r.fileName}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                            {r.ats.overallScore}/100
                          </td>
                          <td className="py-2 px-2 text-right font-mono tabular-nums">
                            {r.nlp.skills.found.length}
                          </td>
                          <td className="py-2 px-2 text-right font-mono tabular-nums">
                            {r.nlp.tokenStats.totalWords}
                          </td>
                          <td className="py-2 px-2 text-right font-mono tabular-nums">
                            {r.nlp.tokenStats.readingGradeLevel}
                          </td>
                          <td className="py-2 px-2 text-right font-mono tabular-nums">
                            {r.nlp.quantifiedAchievements.length}
                          </td>
                          <td className="py-2 pl-2 text-right font-mono tabular-nums">
                            {r.nlp.actionVerbs.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
}
