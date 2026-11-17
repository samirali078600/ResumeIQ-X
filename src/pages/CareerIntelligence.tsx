import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/StateViews';
import { evaluateCareerReadiness } from '../nlp/careerIntelligence';
import { useAppStore } from '../store/useAppStore';

export default function CareerIntelligence() {
  const activeAnalysis = useAppStore((s) => s.activeAnalysis);

  const evaluations = useMemo(() => {
    if (!activeAnalysis) return [];
    return evaluateCareerReadiness(activeAnalysis);
  }, [activeAnalysis]);

  if (!activeAnalysis) {
    return (
      <WorkspaceLayout>
        <EmptyState
          title="No resume selected for Career Intelligence"
          description="Upload and analyze a resume first to evaluate role readiness indicators, supporting evidence, and missing core skills."
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

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Career Intelligence
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {activeAnalysis.fileName} · Role alignment indicators computed strictly from detected skills and resume evidence
            </p>
          </div>
          <Link
            to="/skills-gap"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white whitespace-nowrap"
          >
            <span>Open Skills Gap Planner</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {evaluations.map((ev) => (
            <Card key={ev.role.id}>
              <CardHeader
                title={ev.role.title}
                subtitle={`${ev.role.category} · ${ev.readinessTier}`}
                action={
                  <span className="font-mono text-lg font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                    {ev.readinessScore}%
                  </span>
                }
              />

              <div className="space-y-4">
                <ProgressBar
                  value={ev.readinessScore}
                  label="Evidence-Weighted Readiness Indicator"
                  tone={
                    ev.readinessScore >= 65
                      ? 'emerald'
                      : ev.readinessScore >= 38
                        ? 'indigo'
                        : 'amber'
                  }
                />

                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-white">Resume Evidence</p>
                  {ev.evidenceSummary.map((line, i) => (
                    <p key={i}>• {line}</p>
                  ))}
                </div>

                {ev.missingCoreSkills.length > 0 && (
                  <div className="text-xs">
                    <p className="font-semibold text-rose-700 dark:text-rose-400">
                      Missing Core Skills ({ev.missingCoreSkills.length})
                    </p>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                      {ev.missingCoreSkills.join(', ')}
                    </p>
                  </div>
                )}

                {ev.improvementPriorities.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    {ev.improvementPriorities.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </WorkspaceLayout>
  );
}
