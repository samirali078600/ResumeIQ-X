import { CheckCircle2, AlertCircle, Wrench } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import type { ResumeJobIntelligenceReport } from '../../nlp/jobIntelligenceEngine';
import type { JobMatchResult, ResumeAnalysisRecord } from '../../types/resume';

interface ResumeVsJobComparisonPanelProps {
  analysis: ResumeAnalysisRecord;
  jobMatch: JobMatchResult;
  intelligence: ResumeJobIntelligenceReport;
}

export function ResumeVsJobComparisonPanel({
  analysis,
  jobMatch,
  intelligence,
}: ResumeVsJobComparisonPanelProps) {
  const matchedRequirements = intelligence.requirements.filter(
    (r) => r.status === 'found-evidenced' || r.status === 'alternative-satisfied'
  );
  const partialOrNoProofRequirements = intelligence.requirements.filter(
    (r) => r.status === 'mentioned-no-evidence' || r.status === 'partially-matched'
  );
  const missingRequiredReqs = intelligence.requirements.filter(
    (r) => r.status === 'missing' && r.requirementType === 'required'
  );
  const missingPreferredReqs = intelligence.requirements.filter(
    (r) => r.status === 'missing' && r.requirementType !== 'required'
  );

  const bulletIssuesCount = analysis.nlp.bulletQuality.filter((b) => b.issues.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header Summary Strip */}
      <Card>
        <CardHeader
          title={`Resume vs. Job Comparison: ${jobMatch.jobTitle || 'Target Role'}${jobMatch.company ? ` at ${jobMatch.company}` : ''}`}
          subtitle="Clear side-by-side separation of what matches your resume, what is missing from job requirements, and what you should improve."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>01. Same / Matched</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {jobMatch.matchedSkills.length} skills · {matchedRequirements.length} reqs
            </p>
            <div className="mt-2">
              <ProgressBar value={jobMatch.skillsMatchScore} size="sm" tone="emerald" />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              {jobMatch.matchedKeywords.length} shared job keywords · {jobMatch.overallMatchScore}% overall fit
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>02. Missing from Resume</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {jobMatch.missingRequiredSkills.length} required · {jobMatch.missingPreferredSkills.length} preferred
            </p>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              {jobMatch.missingKeywords.length} posting keywords absent from resume text
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <Wrench className="h-4 w-4 shrink-0" />
              <span>03. Needs Improvement</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {intelligence.improvementRecommendations.length} sections · {bulletIssuesCount} bullets
            </p>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              {analysis.nlp.skills.unsubstantiated.length} skills listed without experience/project proof
            </p>
          </div>
        </div>
      </Card>

      {/* 3 Dedicated Comparison Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Column 1: What Is Same */}
        <Card>
          <CardHeader
            title="1. What Is Same (Matched)"
            subtitle="Skills, requirements, and keywords present in both your resume and the job posting"
            action={<CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          />
          <div className="space-y-4 text-xs">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white mb-1.5">
                Matched Skills ({jobMatch.matchedSkills.length})
              </p>
              {jobMatch.matchedSkills.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">No dictionary skill overlap detected.</p>
              ) : (
                <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                  {jobMatch.matchedSkills.map((skill) => {
                    const ev = jobMatch.relevantEvidence.find(
                      (e) => e.skillOrKeyword.toLowerCase() === skill.toLowerCase()
                    );
                    return (
                      <li
                        key={skill}
                        className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 p-2.5"
                      >
                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {skill}
                          {ev ? ` · Found in ${ev.section}` : ''}
                        </p>
                        {ev && (
                          <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                            {ev.snippet}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {matchedRequirements.some((r) => r.status === 'alternative-satisfied') && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white mb-1">
                  Alternative (OR) Requirements Satisfied
                </p>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                  {matchedRequirements
                    .filter((r) => r.status === 'alternative-satisfied')
                    .map((r) => (
                      <li key={r.id}>• {r.name} — {r.reason}</li>
                    ))}
                </ul>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="font-semibold text-slate-900 dark:text-white mb-1">
                Shared Keywords ({jobMatch.matchedKeywords.length})
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {jobMatch.matchedKeywords.slice(0, 18).join(', ') || 'No stemmed keyword overlap found'}
              </p>
            </div>
          </div>
        </Card>

        {/* Column 2: What Is Missing */}
        <Card>
          <CardHeader
            title="2. What Is Missing"
            subtitle="Job description requirements and keywords not found in your resume"
            action={<AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
          />
          <div className="space-y-4 text-xs">
            <div>
              <p className="font-semibold text-rose-700 dark:text-rose-400 mb-1.5">
                Missing Required Skills &amp; Qualifications ({Math.max(jobMatch.missingRequiredSkills.length, missingRequiredReqs.length)})
              </p>
              {jobMatch.missingRequiredSkills.length === 0 && missingRequiredReqs.length === 0 ? (
                <p className="text-emerald-700 dark:text-emerald-400">
                  No required dictionary skills are missing.
                </p>
              ) : (
                <ul className="space-y-2">
                  {(missingRequiredReqs.length > 0
                    ? missingRequiredReqs.map((r) => ({ title: r.name, detail: `${r.bucket} · ${r.reason}` }))
                    : jobMatch.missingRequiredSkills.map((s) => ({ title: s, detail: 'Listed as required in the job posting' }))
                  ).map((item) => (
                    <li
                      key={item.title}
                      className="rounded-lg border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 p-2.5"
                    >
                      <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">{item.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {(jobMatch.missingPreferredSkills.length > 0 || missingPreferredReqs.length > 0) && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1.5">
                  Missing Preferred / Nice-to-Have Skills
                </p>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {(missingPreferredReqs.length > 0
                    ? missingPreferredReqs.map((r) => r.name)
                    : jobMatch.missingPreferredSkills
                  ).join(', ')}
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="font-semibold text-slate-900 dark:text-white">
                Missing Posting Keywords ({jobMatch.missingKeywords.length})
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {jobMatch.missingKeywords.slice(0, 18).join(', ') || 'None'}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                <strong>Experience &amp; Education:</strong> {jobMatch.experienceGapNote} {jobMatch.educationNote}
              </p>
            </div>
          </div>
        </Card>

        {/* Column 3: What to Improve */}
        <Card>
          <CardHeader
            title="3. What to Improve"
            subtitle="Concrete edits to make your resume stronger and better aligned with this role"
            action={<Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          />
          <div className="space-y-4 text-xs">
            {partialOrNoProofRequirements.length > 0 && (
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1.5">
                  Add Experience / Project Proof ({partialOrNoProofRequirements.length})
                </p>
                <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                  {partialOrNoProofRequirements.slice(0, 6).map((r) => (
                    <li
                      key={r.id}
                      className="rounded-lg border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-2.5"
                    >
                      <p className="font-semibold text-slate-900 dark:text-white">{r.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                        {r.reason} — add a concrete bullet showing how you used it.
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="font-semibold text-slate-900 dark:text-white mb-1.5">
                Resume Structure, Bullets &amp; Tailoring Actions
              </p>
              {intelligence.improvementRecommendations.length === 0 && jobMatch.suggestions.length === 0 ? (
                <p className="text-emerald-700 dark:text-emerald-400">
                  Your resume structure and bullet phrasing are well formatted for this posting.
                </p>
              ) : (
                <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                  {intelligence.improvementRecommendations.slice(0, 4).map((rec) => (
                    <li
                      key={rec.id}
                      className="rounded-lg border border-slate-200/80 dark:border-slate-800 p-2.5"
                    >
                      <p className="font-semibold text-slate-900 dark:text-white">{rec.section}</p>
                      <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                        Issue: {rec.currentIssue}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                        Fix: {rec.recommendedImprovement}
                      </p>
                    </li>
                  ))}
                  {jobMatch.suggestions.slice(0, 3).map((sug, idx) => (
                    <li
                      key={idx}
                      className="rounded-lg border border-slate-200/80 dark:border-slate-800 p-2.5 text-slate-700 dark:text-slate-300"
                    >
                      • {sug}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {intelligence.skillGaps.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white mb-1">
                  Top Skill Gaps to Close Next
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  {intelligence.skillGaps
                    .slice(0, 5)
                    .map((g) => `${g.skillOrRequirement} (${g.estimatedDuration})`)
                    .join(' · ')}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
