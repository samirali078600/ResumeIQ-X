import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileSpreadsheet } from 'lucide-react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/StateViews';
import { exportAnalysisReportPdf } from '../utils/pdfExport';
import { useAppStore } from '../store/useAppStore';

export default function ReportsCenter() {
  const analyses = useAppStore((s) => s.analyses);
  const activeAnalysis = useAppStore((s) => s.activeAnalysis);
  const jobMatches = useAppStore((s) => s.jobMatches);
  const activeJobMatch = useAppStore((s) => s.activeJobMatch);
  const logActivity = useAppStore((s) => s.logActivity);
  const addToast = useAppStore((s) => s.addToast);

  const pool = [
    ...(activeAnalysis && !analyses.some((a) => a.id === activeAnalysis.id) ? [activeAnalysis] : []),
    ...analyses,
  ];

  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>(pool[0]?.id || '');
  const [selectedJobMatchId, setSelectedJobMatchId] = useState<string>(
    activeJobMatch?.id || 'none'
  );

  const selectedAnalysis = pool.find((a) => a.id === selectedAnalysisId) || pool[0];
  const allMatches = [
    ...(activeJobMatch && !jobMatches.some((j) => j.id === activeJobMatch.id) ? [activeJobMatch] : []),
    ...jobMatches,
  ];
  const selectedMatch =
    selectedJobMatchId === 'none'
      ? null
      : allMatches.find((j) => j.id === selectedJobMatchId) || null;

  if (!selectedAnalysis) {
    return (
      <WorkspaceLayout>
        <EmptyState
          title="No analysis available for report generation"
          description="Analyze a resume first so ResumeIQ X can compile your ATS scores, extracted entities, skills inventory, and improvement checklist into a PDF report."
          action={
            <Link
              to="/analyzer"
              className="inline-flex items-center rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Analyze a Resume
            </Link>
          }
        />
      </WorkspaceLayout>
    );
  }

  const handleGeneratePdf = async () => {
    try {
      exportAnalysisReportPdf(selectedAnalysis, selectedMatch);
      await logActivity('export', `Exported PDF report for ${selectedAnalysis.fileName}`, `Score: ${selectedAnalysis.ats.overallScore}/100`);
      addToast({ type: 'success', title: 'PDF Intelligence Report downloaded' });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'PDF export failed',
        description: err instanceof Error ? err.message : 'Unable to compile PDF report.',
      });
    }
  };

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Reports Center
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Compile real local analysis metrics, extracted entities, skills, and checklists into a downloadable PDF report.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGeneratePdf}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>Generate &amp; Download PDF</span>
          </button>
        </div>

        <Card>
          <CardHeader title="Configure Report Contents" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Resume Analysis Record
              </label>
              <select
                value={selectedAnalysis.id}
                onChange={(e) => setSelectedAnalysisId(e.target.value)}
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Include Job Match Section (Optional)
              </label>
              <select
                value={selectedJobMatchId}
                onChange={(e) => setSelectedJobMatchId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
              >
                <option value="none">Do not include job match results</option>
                {allMatches.map((jm) => (
                  <option key={jm.id} value={jm.id}>
                    {jm.jobTitle} at {jm.company} ({jm.overallMatchScore}% match)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Report Content Preview */}
        <Card>
          <CardHeader
            title="Report Data Preview"
            subtitle={`Document: ${selectedAnalysis.fileName} · Analyzed ${new Date(selectedAnalysis.createdAt).toLocaleString()}`}
            action={<FileSpreadsheet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
          />
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Overall Heuristic Score</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                  {selectedAnalysis.ats.overallScore}/100
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Skills Included</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
                  {selectedAnalysis.nlp.skills.found.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Checklist Items</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
                  {selectedAnalysis.ats.suggestions.length}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white mb-2">
                  Included Sections
                </p>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                  <li>• 14-Category Weighted ATS Score Table</li>
                  <li>• Extracted Entities (Contact, Dates, Organizations, Titles, Education)</li>
                  <li>• Skills Inventory &amp; Unsubstantiated Skills Audit</li>
                  <li>• Top Keyword Frequencies</li>
                  {selectedMatch && (
                    <li>
                      • Job Match Breakdown ({selectedMatch.jobTitle} — {selectedMatch.overallMatchScore}%)
                    </li>
                  )}
                  <li>• Observed Strengths, Weaknesses &amp; Improvement Checklist</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-slate-900 dark:text-white mb-2">
                  Top Keywords &amp; Skills Preview
                </p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>Skills:</strong>{' '}
                  {selectedAnalysis.nlp.skills.found
                    .slice(0, 12)
                    .map((s) => s.name)
                    .join(', ') || 'None'}
                </p>
                <p className="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>Keywords:</strong>{' '}
                  {selectedAnalysis.nlp.wordFrequency
                    .slice(0, 10)
                    .map((w) => `${w.word} (${w.count})`)
                    .join(', ')}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </WorkspaceLayout>
  );
}
