import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, Upload } from 'lucide-react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { ChartTooltipContent } from '../components/ui/ChartTooltip';
import { EmptyState, ErrorState } from '../components/ui/StateViews';
import { parseResumeFile } from '../utils/documentParser';
import { analyzeResumeTextAsync, buildAnalysisRecord } from '../nlp/analyzeResume';
import { exportComparisonReportPdf } from '../utils/pdfExport';
import { useAppStore } from '../store/useAppStore';
import type { ResumeAnalysisRecord } from '../types/resume';

export default function ResumeComparison() {
  const analyses = useAppStore((s) => s.analyses);
  const activeAnalysis = useAppStore((s) => s.activeAnalysis);
  const customSkills = useAppStore((s) => s.customSkills);
  const atsWeights = useAppStore((s) => s.atsWeights);
  const addToast = useAppStore((s) => s.addToast);

  // Pool combines saved analyses + active analysis + temporarily uploaded comparison files
  const [tempRecords, setTempRecords] = useState<ResumeAnalysisRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const ids = analyses.slice(0, 2).map((a) => a.id);
    if (activeAnalysis && !ids.includes(activeAnalysis.id)) ids.unshift(activeAnalysis.id);
    return ids.slice(0, 3);
  });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const allCandidates: ResumeAnalysisRecord[] = [];
  const seen = new Set<string>();
  for (const r of [activeAnalysis, ...analyses, ...tempRecords]) {
    if (r && !seen.has(r.id)) {
      seen.add(r.id);
      allCandidates.push(r);
    }
  }

  const selectedRecords = allCandidates.filter((r) => selectedIds.includes(r.id));

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleUploadExtra = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const parsed = await parseResumeFile(file);
      const { nlp, ats } = await analyzeResumeTextAsync({
        text: parsed.text,
        customSkills,
        weights: atsWeights,
      });
      const rec = buildAnalysisRecord({
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
      setTempRecords((prev) => [rec, ...prev]);
      setSelectedIds((prev) => [...prev, rec.id]);
      addToast({ type: 'success', title: `Added ${parsed.fileName} to comparison` });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to extract readable text from file.';
      setUploadError(
        `Document excluded from comparison: ${msg}`
      );
    } finally {
      setUploading(false);
    }
  };

  const chartData = [
    {
      metric: 'Overall ATS',
      ...Object.fromEntries(selectedRecords.map((r) => [r.id, r.ats.overallScore])),
    },
    {
      metric: 'Structure',
      ...Object.fromEntries(
        selectedRecords.map((r) => [
          r.id,
          r.ats.categories.find((c) => c.key === 'resumeStructure')?.score || 0,
        ])
      ),
    },
    {
      metric: 'Skills',
      ...Object.fromEntries(
        selectedRecords.map((r) => [
          r.id,
          r.ats.categories.find((c) => c.key === 'skills')?.score || 0,
        ])
      ),
    },
    {
      metric: 'Experience',
      ...Object.fromEntries(
        selectedRecords.map((r) => [
          r.id,
          r.ats.categories.find((c) => c.key === 'workExperience')?.score || 0,
        ])
      ),
    },
    {
      metric: 'Bullet Quality',
      ...Object.fromEntries(
        selectedRecords.map((r) => [
          r.id,
          r.ats.categories.find((c) => c.key === 'bulletQuality')?.score || 0,
        ])
      ),
    },
    {
      metric: 'Readability',
      ...Object.fromEntries(
        selectedRecords.map((r) => [
          r.id,
          r.ats.categories.find((c) => c.key === 'readability')?.score || 0,
        ])
      ),
    },
  ];

  const barColors = ['#4F46E5', '#7C3AED', '#0EA5E9', '#10B981'];

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Resume Comparison
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Compare two or more validated resumes across ATS score, skills depth, readability, and formatting indicators.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap">
              <Upload className="h-4 w-4" />
              <span>{uploading ? 'Parsing...' : 'Add File to Compare'}</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={handleUploadExtra}
                disabled={uploading}
              />
            </label>
            {selectedRecords.length >= 2 && (
              <button
                type="button"
                onClick={() => exportComparisonReportPdf(selectedRecords)}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white whitespace-nowrap"
              >
                <Download className="h-4 w-4" />
                <span>Export Comparison PDF</span>
              </button>
            )}
          </div>
        </div>

        {uploadError && (
          <ErrorState title="Comparison Guardrail: Extraction Failed" message={uploadError} />
        )}

        {allCandidates.length > 0 && (
          <Card padding="sm">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Select 2 or more resumes to compare ({selectedRecords.length} selected):
            </p>
            <div className="flex flex-wrap gap-2">
              {allCandidates.map((rec) => {
                const checked = selectedIds.includes(rec.id);
                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => toggleSelection(rec.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                      checked
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {rec.fileName} ({rec.ats.overallScore}/100)
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {selectedRecords.length < 2 ? (
          <EmptyState
            title="Select or upload at least 2 resumes to compare"
            description="Use 'Add File to Compare' above or analyze multiple resume versions in the Resume Analyzer first."
          />
        ) : (
          <>
            <Card>
              <CardHeader
                title="Category Comparison Chart"
                subtitle="Side-by-side comparison across core ATS evaluation dimensions"
              />
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <Tooltip content={<ChartTooltipContent suffix="/100" />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    {selectedRecords.map((rec, idx) => (
                      <Bar
                        key={rec.id}
                        dataKey={rec.id}
                        name={rec.fileName}
                        fill={barColors[idx % barColors.length]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title="Detailed Comparison Matrix" />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-3 pr-4">Metric</th>
                      {selectedRecords.map((rec) => (
                        <th key={rec.id} className="py-3 px-4">
                          {rec.fileName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 tabular-nums">
                    <tr className="h-11 hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 pr-4 font-medium">Overall ATS Score</td>
                      {selectedRecords.map((r) => (
                        <td key={r.id} className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {r.ats.overallScore}/100
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium">Sections Detected</td>
                      {selectedRecords.map((r) => (
                        <td key={r.id} className="py-3 px-4 font-mono">
                          {Object.keys(r.nlp.sectionsDetected).filter((k) => k !== 'header').length}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium">Skills Found</td>
                      {selectedRecords.map((r) => (
                        <td key={r.id} className="py-3 px-4 font-mono">
                          {r.nlp.skills.found.length} ({r.nlp.skills.usedInExperience.length} in exp)
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium">Word Count</td>
                      {selectedRecords.map((r) => (
                        <td key={r.id} className="py-3 px-4 font-mono">
                          {r.nlp.tokenStats.totalWords}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium">Readability (FK Grade)</td>
                      {selectedRecords.map((r) => (
                        <td key={r.id} className="py-3 px-4 font-mono">
                          {r.nlp.tokenStats.readingGradeLevel}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium">Quantified Achievements</td>
                      {selectedRecords.map((r) => (
                        <td key={r.id} className="py-3 px-4 font-mono">
                          {r.nlp.quantifiedAchievements.length}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium">Action Verbs / Weak Phrases</td>
                      {selectedRecords.map((r) => (
                        <td key={r.id} className="py-3 px-4 font-mono">
                          {r.nlp.actionVerbs.length} / {r.nlp.weakPhrases.length}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium">Projects Section Score</td>
                      {selectedRecords.map((r) => (
                        <td key={r.id} className="py-3 px-4 font-mono">
                          {r.ats.categories.find((c) => c.key === 'projects')?.score || 0}/100
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </WorkspaceLayout>
  );
}
