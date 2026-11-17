import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/StateViews';
import { CAREER_ROLE_TRACKS, evaluateCareerReadiness } from '../nlp/careerIntelligence';
import { useAppStore } from '../store/useAppStore';

export default function SkillsGap() {
  const activeAnalysis = useAppStore((s) => s.activeAnalysis);
  const [selectedRoleId, setSelectedRoleId] = useState(CAREER_ROLE_TRACKS[0].id);
  const [customTargetSkills, setCustomTargetSkills] = useState('');

  const evaluations = useMemo(() => {
    if (!activeAnalysis) return [];
    return evaluateCareerReadiness(activeAnalysis);
  }, [activeAnalysis]);

  const selectedEval = evaluations.find((e) => e.role.id === selectedRoleId) || evaluations[0];

  const customComparison = useMemo(() => {
    if (!activeAnalysis || !customTargetSkills.trim()) return null;
    const requested = customTargetSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const lowerResume = activeAnalysis.extractedText.toLowerCase();
    const matched = requested.filter((s) => lowerResume.includes(s.toLowerCase()));
    const missing = requested.filter((s) => !lowerResume.includes(s.toLowerCase()));
    return {
      requested,
      matched,
      missing,
      pct: requested.length > 0 ? Math.round((matched.length / requested.length) * 100) : 0,
    };
  }, [activeAnalysis, customTargetSkills]);

  if (!activeAnalysis || !selectedEval) {
    return (
      <WorkspaceLayout>
        <EmptyState
          title="No resume loaded for Skills Gap Analysis"
          description="Analyze a resume first to compare your verified skills against target career tracks or custom skill requirements."
          action={
            <Link
              to="/analyzer"
              className="inline-flex items-center rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Open Resume Analyzer
            </Link>
          }
        />
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Skills Gap Analysis
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {activeAnalysis.fileName} · Compare existing skills against curated role tracks or custom skill benchmarks
            </p>
          </div>
          <select
            aria-label="Select target career role"
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
          >
            {CAREER_ROLE_TRACKS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Role Gap Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-5">
            <CardHeader
              title={selectedEval.role.title}
              subtitle={`${selectedEval.readinessTier} · ${selectedEval.readinessScore}% readiness`}
            />
            <div className="space-y-4">
              <ProgressBar value={selectedEval.readinessScore} label="Track Alignment Score" />
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {selectedEval.evidenceSummary.map((line, i) => (
                  <p key={i}>• {line}</p>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Learning &amp; Resume Priorities
                </p>
                {selectedEval.improvementPriorities.map((p, i) => (
                  <p key={i} className="text-slate-600 dark:text-slate-400">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-7">
            <CardHeader title="Matched vs. Missing Role Skills" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                  Present Core Skills ({selectedEval.matchedCoreSkills.length})
                </p>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                  {selectedEval.matchedCoreSkills.length === 0 ? (
                    <li className="text-slate-500">None detected</li>
                  ) : (
                    selectedEval.matchedCoreSkills.map((s) => <li key={s}>✓ {s}</li>)
                  )}
                </ul>

                <p className="font-semibold text-indigo-700 dark:text-indigo-400 mt-4 mb-2">
                  Present Recommended Skills ({selectedEval.matchedRecommendedSkills.length})
                </p>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                  {selectedEval.matchedRecommendedSkills.length === 0 ? (
                    <li className="text-slate-500">None detected</li>
                  ) : (
                    selectedEval.matchedRecommendedSkills.map((s) => <li key={s}>✓ {s}</li>)
                  )}
                </ul>
              </div>

              <div>
                <p className="font-semibold text-rose-700 dark:text-rose-400 mb-2">
                  Missing Core Skills ({selectedEval.missingCoreSkills.length})
                </p>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                  {selectedEval.missingCoreSkills.length === 0 ? (
                    <li className="text-emerald-600 dark:text-emerald-400">All core skills present</li>
                  ) : (
                    selectedEval.missingCoreSkills.map((s) => <li key={s}>• {s} (High priority)</li>)
                  )}
                </ul>

                <p className="font-semibold text-amber-700 dark:text-amber-400 mt-4 mb-2">
                  Missing Recommended Skills ({selectedEval.missingRecommendedSkills.length})
                </p>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                  {selectedEval.missingRecommendedSkills.length === 0 ? (
                    <li className="text-emerald-600 dark:text-emerald-400">All recommended skills present</li>
                  ) : (
                    selectedEval.missingRecommendedSkills.map((s) => (
                      <li key={s}>• {s} (Secondary priority)</li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Project Recommendations */}
        <Card>
          <CardHeader
            title={`Portfolio Project Recommendations for ${selectedEval.role.title}`}
            subtitle="Concrete project deliverables to close skill evidence gaps authentically"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedEval.role.projectIdeas.map((proj) => (
              <div
                key={proj.title}
                className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-2"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{proj.title}</h3>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {proj.outcome}
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                  Demonstrates: {proj.skillsUsed.join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Custom Skill Checklist Comparison */}
        <Card>
          <CardHeader
            title="Custom Target Skills Check"
            subtitle="Enter comma-separated skills from any niche role to test coverage in your resume"
          />
          <input
            type="text"
            value={customTargetSkills}
            onChange={(e) => setCustomTargetSkills(e.target.value)}
            placeholder="e.g., TypeScript, GraphQL, Terraform, Snowflake, WCAG"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
          />
          {customComparison && (
            <div className="mt-4 space-y-3 text-xs">
              <ProgressBar value={customComparison.pct} label="Custom Target Coverage" />
              <p className="text-emerald-700 dark:text-emerald-400">
                <strong>Found:</strong> {customComparison.matched.join(', ') || 'None'}
              </p>
              <p className="text-rose-700 dark:text-rose-400">
                <strong>Not Found:</strong> {customComparison.missing.join(', ') || 'None'}
              </p>
            </div>
          )}
        </Card>
      </div>
    </WorkspaceLayout>
  );
}
