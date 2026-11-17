import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Award,
  CheckSquare,
  FileCheck2,
  FilePlus2,
  FolderKanban,
  Gauge,
  UserCheck,
} from 'lucide-react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { ChartTooltipContent } from '../components/ui/ChartTooltip';
import { EmptyState, LoadingSkeleton } from '../components/ui/StateViews';
import { useAppStore } from '../store/useAppStore';
import type { ExperienceLevel } from '../types/resume';

export default function WorkspaceDashboard() {
  const hydrated = useAppStore((s) => s.hydrated);
  const profile = useAppStore((s) => s.profile);
  const saveProfile = useAppStore((s) => s.saveProfile);
  const analyses = useAppStore((s) => s.analyses);
  const resumes = useAppStore((s) => s.resumes);
  const jobMatches = useAppStore((s) => s.jobMatches);
  const activities = useAppStore((s) => s.activities);
  const setActiveAnalysis = useAppStore((s) => s.setActiveAnalysis);
  const addToast = useAppStore((s) => s.addToast);

  const [setupName, setSetupName] = useState(profile.displayName);
  const [setupTarget, setSetupTarget] = useState(profile.careerTarget);
  const [setupLevel, setSetupLevel] = useState<ExperienceLevel>(profile.experienceLevel);

  const stats = useMemo(() => {
    const total = analyses.length;
    if (total === 0) {
      return { total: 0, avgScore: 0, highestScore: 0, totalSkills: 0 };
    }
    const scores = analyses.map((a) => a.ats.overallScore);
    const sum = scores.reduce((acc, s) => acc + s, 0);
    const highest = Math.max(...scores);
    const uniqueSkills = new Set(analyses.flatMap((a) => a.nlp.skills.found.map((s) => s.name)));
    return {
      total,
      avgScore: Math.round(sum / total),
      highestScore: highest,
      totalSkills: uniqueSkills.size,
    };
  }, [analyses]);

  const scoreHistoryData = useMemo(() => {
    return [...analyses]
      .reverse()
      .slice(-10)
      .map((a) => ({
        name: a.fileName.length > 16 ? `${a.fileName.slice(0, 14)}…` : a.fileName,
        score: a.ats.overallScore,
        date: new Date(a.createdAt).toLocaleDateString(),
      }));
  }, [analyses]);

  const skillsDistributionData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of analyses) {
      for (const sk of a.nlp.skills.found) {
        counts.set(sk.category, (counts.get(sk.category) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([category, count]) => ({
        category: category.replace(' Development', '').replace(' Platforms', ''),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [analyses]);

  const pendingTasks = useMemo(() => {
    const latest = analyses[0];
    if (!latest) return [];
    return latest.ats.suggestions.filter((s) => !s.completed).slice(0, 5);
  }, [analyses]);

  const handleQuickSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupName.trim()) {
      addToast({
        type: 'warning',
        title: 'Enter a display name',
        description: 'Provide a name for your local workspace.',
      });
      return;
    }
    await saveProfile({
      displayName: setupName.trim(),
      careerTarget: setupTarget.trim(),
      experienceLevel: setupLevel,
    });
    addToast({ type: 'success', title: 'Local workspace profile saved' });
  };

  if (!hydrated) {
    return (
      <WorkspaceLayout>
        <LoadingSkeleton variant="dashboard" rows={5} />
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="space-y-6 animate-panel-in">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
              {profile.displayName ? `Welcome back, ${profile.displayName}` : 'Local Workspace Dashboard'}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {profile.careerTarget
                ? `Target Role: ${profile.careerTarget} · All metrics derived from your local IndexedDB records`
                : 'Statistics below reflect only your real locally stored analyses and drafts.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/resume-builder"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1526] hover:bg-slate-50 dark:hover:bg-slate-800/70 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span>New Resume Draft</span>
            </Link>
            <Link
              to="/analyzer"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Analyze Resume</span>
            </Link>
          </div>
        </div>

        {/* Local Workspace Setup Prompt (only when displayName is empty) */}
        {!profile.displayName && (
          <Card>
            <CardHeader
              title="Set up your local workspace profile"
              subtitle="This is a browser-only local profile stored in IndexedDB — not a cloud account or authentication system."
            />
            <form onSubmit={handleQuickSetup} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  placeholder="e.g., Jordan Patel"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#080D1A] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Career Target (Optional)
                </label>
                <input
                  type="text"
                  value={setupTarget}
                  onChange={(e) => setSetupTarget(e.target.value)}
                  placeholder="e.g., Senior Frontend Engineer"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#080D1A] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Experience Level
                </label>
                <select
                  value={setupLevel}
                  onChange={(e) => setSetupLevel(e.target.value as ExperienceLevel)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#080D1A] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="entry">Entry Level / Graduate</option>
                  <option value="mid">Mid-Level</option>
                  <option value="senior">Senior</option>
                  <option value="executive">Lead / Executive</option>
                </select>
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white transition-colors whitespace-nowrap"
              >
                <UserCheck className="h-4 w-4" />
                <span>Save Local Profile</span>
              </button>
            </form>
          </Card>
        )}

        {/* KPI Grid from real IndexedDB data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Saved Analyses</p>
              <FolderKanban className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {stats.total}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {jobMatches.length} job match comparison(s)
            </p>
          </Card>

          <Card padding="sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Average ATS Heuristic</p>
              <Gauge className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {stats.total > 0 ? `${stats.avgScore}/100` : '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Weighted 14-category rubric
            </p>
          </Card>

          <Card padding="sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Highest ATS Score</p>
              <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
              {stats.total > 0 ? `${stats.highestScore}/100` : '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {stats.totalSkills} unique dictionary skills
            </p>
          </Card>

          <Card padding="sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Builder Drafts</p>
              <FilePlus2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {resumes.length}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Stored in browser IndexedDB
            </p>
          </Card>
        </div>

        {/* Empty State or Real Charts + Tables */}
        {analyses.length === 0 ? (
          <EmptyState
            title="No saved resume analyses yet"
            description="Upload a PDF, DOCX, or TXT resume in the Resume Analyzer to inspect extracted text, NLP entities, and transparent ATS heuristics. Once you save an analysis, your trends and skill distributions will appear here."
            action={
              <Link
                to="/analyzer"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                <span>Analyze Your First Resume</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader
                  title="ATS Score History"
                  subtitle="Calculated heuristic scores across your saved resume versions"
                />
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={scoreHistoryData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.32} />
                          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <Tooltip content={<ChartTooltipContent suffix="/100" />} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        name="ATS Score"
                        stroke="#6366F1"
                        strokeWidth={2.2}
                        fill="url(#scoreAreaGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="Skills Distribution by Category"
                  subtitle="Aggregated dictionary and custom skills detected across saved analyses"
                />
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={skillsDistributionData}
                      margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                      <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" name="Skills" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Recent Analyses Table */}
              <Card className="lg:col-span-7">
                <CardHeader
                  title="Recent Resume Analyses"
                  subtitle="Latest documents saved to local IndexedDB"
                  action={
                    <Link
                      to="/analysis-history"
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
                    >
                      View all
                    </Link>
                  }
                />
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <th className="py-2.5 pr-3">Document</th>
                        <th className="py-2.5 px-2 text-right">Skills</th>
                        <th className="py-2.5 px-2 text-right">ATS</th>
                        <th className="py-2.5 px-2 text-right hidden sm:table-cell">Saved</th>
                        <th className="py-2.5 pl-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                      {analyses.slice(0, 6).map((item) => (
                        <tr
                          key={item.id}
                          className="h-11 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2 pr-3 max-w-[190px]">
                            <p className="font-medium text-slate-900 dark:text-white truncate">
                              {item.fileName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {item.fileType.toUpperCase()}
                            </p>
                          </td>
                          <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                            {item.nlp.skills.found.length}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">
                            {item.ats.overallScore}/100
                          </td>
                          <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2 pl-2 text-right">
                            <Link
                              to="/ats-intelligence"
                              onClick={() => setActiveAnalysis(item)}
                              className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              Inspect
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Pending Improvement Tasks + Recent Activity */}
              <div className="lg:col-span-5 space-y-6">
                <Card>
                  <CardHeader
                    title="Pending Improvement Tasks"
                    subtitle={analyses[0] ? `From ${analyses[0].fileName}` : undefined}
                  />
                  {pendingTasks.length === 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      All suggestions on your latest resume are checked off.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {pendingTasks.map((task) => (
                        <li key={task.id} className="flex items-start gap-2.5 text-sm">
                          <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white leading-snug">
                              {task.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {task.category} · {task.priority} priority
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card>
                  <CardHeader title="Recent Local Activity" />
                  {activities.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Actions performed in this browser will appear here.
                    </p>
                  ) : (
                    <ul className="space-y-2.5">
                      {activities.slice(0, 4).map((act) => (
                        <li key={act.id} className="flex items-start justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                              {act.title}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 truncate">
                              {act.detail}
                            </p>
                          </div>
                          <span className="font-mono text-slate-400 shrink-0 tabular-nums">
                            {new Date(act.createdAt).toLocaleDateString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </WorkspaceLayout>
  );
}
