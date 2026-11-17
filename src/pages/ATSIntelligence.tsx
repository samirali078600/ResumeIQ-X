import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Check, Download, Info, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { ChartTooltipContent } from '../components/ui/ChartTooltip';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/StateViews';
import {
  ATS_CATEGORY_LABELS,
  calculateATSScore,
  DEFAULT_ATS_WEIGHTS,
  normalizeWeights,
} from '../ats/atsScoring';
import { exportAnalysisReportPdf } from '../utils/pdfExport';
import { useAppStore } from '../store/useAppStore';
import type { ATSWeights } from '../types/resume';

export default function ATSIntelligence() {
  const activeAnalysis = useAppStore((s) => s.activeAnalysis);
  const atsWeights = useAppStore((s) => s.atsWeights);
  const setAtsWeights = useAppStore((s) => s.setAtsWeights);
  const updateAnalysisRecord = useAppStore((s) => s.updateAnalysisRecord);
  const addToast = useAppStore((s) => s.addToast);

  const [showWeightsEditor, setShowWeightsEditor] = useState(false);
  const [chartView, setChartView] = useState<'bar' | 'radar'>('bar');

  if (!activeAnalysis) {
    return (
      <WorkspaceLayout>
        <EmptyState
          title="No resume selected for ATS evaluation"
          description="Upload and parse a resume in the Resume Analyzer or open a saved record from Analysis History to inspect its 14-category ATS rubric."
          action={
            <Link
              to="/analyzer"
              className="inline-flex items-center rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Go to Resume Analyzer
            </Link>
          }
        />
      </WorkspaceLayout>
    );
  }

  const handleWeightChange = (key: keyof ATSWeights, value: number) => {
    const nextWeights = { ...atsWeights, [key]: Math.max(0, Math.min(50, value)) };
    setAtsWeights(nextWeights);
    const recalculated = calculateATSScore(
      activeAnalysis.extractedText,
      activeAnalysis.nlp,
      nextWeights
    );
    updateAnalysisRecord({
      ...activeAnalysis,
      ats: recalculated,
      weightsUsed: normalizeWeights(nextWeights),
    });
  };

  const handleResetWeights = () => {
    setAtsWeights({ ...DEFAULT_ATS_WEIGHTS });
    const recalculated = calculateATSScore(
      activeAnalysis.extractedText,
      activeAnalysis.nlp,
      DEFAULT_ATS_WEIGHTS
    );
    updateAnalysisRecord({
      ...activeAnalysis,
      ats: recalculated,
      weightsUsed: DEFAULT_ATS_WEIGHTS,
    });
    addToast({ type: 'info', title: 'ATS category weights reset to defaults' });
  };

  const handleToggleChecklist = (suggestionId: string) => {
    const nextSuggestions = activeAnalysis.ats.suggestions.map((s) =>
      s.id === suggestionId ? { ...s, completed: !s.completed } : s
    );
    updateAnalysisRecord({
      ...activeAnalysis,
      ats: {
        ...activeAnalysis.ats,
        suggestions: nextSuggestions,
      },
    });
  };

  const chartData = activeAnalysis.ats.categories.map((c) => ({
    name: c.label.replace('Information', 'Info').replace('Professional ', '').replace('Indicators', ''),
    score: c.score,
    weight: c.weight,
  }));

  const normalized = normalizeWeights(atsWeights);

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              ATS Intelligence
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {activeAnalysis.fileName} · Transparent 14-category heuristic evaluation
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowWeightsEditor((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>{showWeightsEditor ? 'Hide Weights' : 'Configure Weights'}</span>
            </button>
            <button
              type="button"
              onClick={() => exportAnalysisReportPdf(activeAnalysis)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF Report</span>
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {activeAnalysis.ats.disclaimer}
          </p>
        </div>

        {/* Configurable Weights Drawer */}
        {showWeightsEditor && (
          <Card>
            <CardHeader
              title="Configurable ATS Category Weights"
              subtitle="Adjust relative emphasis across categories; weights normalize automatically to 100%."
              action={
                <button
                  type="button"
                  onClick={handleResetWeights}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Defaults</span>
                </button>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.keys(ATS_CATEGORY_LABELS) as (keyof ATSWeights)[]).map((key) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor={`weight-${key}`}
                      className="font-medium text-slate-700 dark:text-slate-300"
                    >
                      {ATS_CATEGORY_LABELS[key]}
                    </label>
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {normalized[key]}%
                    </span>
                  </div>
                  <input
                    id={`weight-${key}`}
                    type="range"
                    min={0}
                    max={30}
                    step={1}
                    value={atsWeights[key]}
                    onChange={(e) => handleWeightChange(key, Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Score Overview + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Calculated Overall Score
              </p>

              {/* Radial ATS Score Ring */}
              <div className="mt-4 flex items-center gap-5">
                {(() => {
                  const score = activeAnalysis.ats.overallScore;
                  const radius = 42;
                  const circumference = 2 * Math.PI * radius;
                  const dashOffset = circumference - (score / 100) * circumference;
                  const strokeColor =
                    score >= 75 ? '#16A34A' : score >= 55 ? '#6366F1' : '#D97706';
                  const tierLabel =
                    score >= 75 ? 'Strong Readiness' : score >= 55 ? 'Moderate Readiness' : 'Needs Improvement';
                  return (
                    <>
                      <div className="relative h-24 w-24 shrink-0">
                        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
                          <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-slate-200 dark:text-slate-800"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            className="transition-[stroke-dashoffset] duration-300 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                            {score}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">/ 100</span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                          {tierLabel}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                          Computed as the sum of each category score multiplied by its normalized weight.
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Strong categories (&ge;80)</span>
                <span className="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {activeAnalysis.ats.categories.filter((c) => c.status === 'strong').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Needs attention (&lt;55)</span>
                <span className="font-mono font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                  {activeAnalysis.ats.categories.filter((c) => c.score < 55).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Missing core sections</span>
                <span className="font-mono font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                  {activeAnalysis.ats.missingSections.length}
                </span>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-8">
            <CardHeader
              title="Category Score Profile"
              subtitle="Unweighted score (0–100) across each evaluated dimension"
              action={
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => setChartView('bar')}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      chartView === 'bar'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Bar Chart
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartView('radar')}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      chartView === 'radar'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Radar Chart
                  </button>
                </div>
              }
            />
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartView === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 28 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis
                      dataKey="name"
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                      height={56}
                      tick={{ fontSize: 10, fill: '#94A3B8' }}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <Tooltip content={<ChartTooltipContent suffix="/100" />} />
                    <Bar dataKey="score" name="Category Score" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="68%">
                    <PolarGrid stroke="rgba(148,163,184,0.28)" />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94A3B8' }} />
                    <Tooltip content={<ChartTooltipContent suffix="/100" />} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#7C3AED"
                      fill="#6366F1"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                )}
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Category Breakdown Table */}
        <Card>
          <CardHeader
            title="Transparent Scoring Breakdown"
            subtitle="Every score, weight, weighted contribution, and supporting document evidence"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 px-3 text-right">Raw Score</th>
                  <th className="py-3 px-3 text-right">Weight</th>
                  <th className="py-3 px-3 text-right">Contribution</th>
                  <th className="py-3 px-3">Assessment</th>
                  <th className="py-3 pl-4">Evidence &amp; Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {activeAnalysis.ats.categories.map((cat) => {
                  const statusLabel =
                    cat.status === 'strong'
                      ? 'Strong'
                      : cat.status === 'fair'
                        ? 'Fair'
                        : cat.status === 'needs-work'
                          ? 'Needs Work'
                          : 'Missing';
                  const statusColor =
                    cat.status === 'strong'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : cat.status === 'fair'
                        ? 'text-indigo-700 dark:text-indigo-400'
                        : cat.status === 'needs-work'
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-rose-700 dark:text-rose-400';

                  return (
                    <tr key={cat.key} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 pr-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        {cat.label}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-900 dark:text-white min-w-[116px]">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14 hidden sm:block">
                            <ProgressBar
                              value={cat.score}
                              size="sm"
                              tone={
                                cat.status === 'strong'
                                  ? 'emerald'
                                  : cat.status === 'fair'
                                    ? 'indigo'
                                    : cat.status === 'needs-work'
                                      ? 'amber'
                                      : 'rose'
                              }
                            />
                          </div>
                          <span>{cat.score}/100</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {cat.weight}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-indigo-600 dark:text-indigo-400">
                        +{cat.weightedContribution}
                      </td>
                      <td className={`py-3 px-3 text-xs font-semibold whitespace-nowrap ${statusColor}`}>
                        {statusLabel}
                      </td>
                      <td className="py-3 pl-4 text-xs text-slate-600 dark:text-slate-300">
                        <p>{cat.details}</p>
                        {cat.evidence.length > 0 && (
                          <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                            Evidence: {cat.evidence.join(' · ')}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Strengths, Weaknesses, Missing Sections & Action Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Strengths &amp; Weaknesses" />
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2">
                  Observed Strengths
                </h3>
                {activeAnalysis.ats.strengths.length === 0 ? (
                  <p className="text-xs text-slate-500">No high-scoring categories (&ge;78) yet.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {activeAnalysis.ats.strengths.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
                  Areas Requiring Improvement
                </h3>
                {activeAnalysis.ats.weaknesses.length === 0 ? (
                  <p className="text-xs text-slate-500">No critical category deficits (&lt;55) detected.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {activeAnalysis.ats.weaknesses.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                )}
              </div>

              {activeAnalysis.ats.missingSections.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-400 mb-2">
                    Missing Standard Sections
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {activeAnalysis.ats.missingSections.join(' · ')}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Actionable Improvement Checklist"
              subtitle="Mark items as resolved while revising your resume"
            />
            {activeAnalysis.ats.suggestions.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No automated improvement suggestions generated for this document.
              </p>
            ) : (
              <div className="space-y-3">
                {activeAnalysis.ats.suggestions.map((sug) => (
                  <button
                    key={sug.id}
                    type="button"
                    onClick={() => handleToggleChecklist(sug.id)}
                    className={`w-full text-left flex items-start gap-3 rounded-lg border p-3.5 transition-colors ${
                      sug.completed
                        ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 opacity-75'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        sug.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {sug.completed && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          sug.completed
                            ? 'line-through text-slate-500 dark:text-slate-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {sug.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Priority: {sug.priority} · {sug.category}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {sug.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
