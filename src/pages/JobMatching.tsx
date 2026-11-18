import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Download, Info, Sparkles, Upload } from 'lucide-react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { LocalModelPanel } from '../components/nlp/LocalModelPanel';
import { ResumeVsJobComparisonPanel } from '../components/analyzer/ResumeVsJobComparisonPanel';
import { EmptyState } from '../components/ui/StateViews';
import { ProgressBar } from '../components/ui/ProgressBar';
import { parseResumeFile } from '../utils/documentParser';
import { runJobDescriptionMatch } from '../nlp/matching';
import { buildResumeJobIntelligence } from '../nlp/jobIntelligenceEngine';
import { computeSemanticSimilarityWithModel, getLoadedModelStatus } from '../nlp/transformersEngine';
import { exportAnalysisReportPdf } from '../utils/pdfExport';
import { useAppStore } from '../store/useAppStore';

export default function JobMatching() {
  const analyses = useAppStore((s) => s.analyses);
  const activeAnalysis = useAppStore((s) => s.activeAnalysis);
  const setActiveAnalysis = useAppStore((s) => s.setActiveAnalysis);
  const customSkills = useAppStore((s) => s.customSkills);
  const activeJobMatch = useAppStore((s) => s.activeJobMatch);
  const saveJobMatch = useAppStore((s) => s.saveJobMatch);
  const addToast = useAppStore((s) => s.addToast);

  const [jobTitle, setJobTitle] = useState(activeJobMatch?.jobTitle || '');
  const [company, setCompany] = useState(activeJobMatch?.company || '');
  const [requiredExperience, setRequiredExperience] = useState(
    activeJobMatch?.requiredExperience || ''
  );
  const [jobLocation, setJobLocation] = useState(activeJobMatch?.jobLocation || '');
  const [jobDescription, setJobDescription] = useState(activeJobMatch?.jobDescription || '');
  const [jdFileLoading, setJdFileLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const comparisonIntelligence = useMemo(() => {
    if (!activeAnalysis || !activeJobMatch) return null;
    return buildResumeJobIntelligence({
      analysis: activeAnalysis,
      companyName: activeJobMatch.company,
      targetRole: activeJobMatch.jobTitle,
      jobDescription: activeJobMatch.jobDescription,
      jobMatch: activeJobMatch,
      customSkills,
    });
  }, [activeAnalysis, activeJobMatch, customSkills]);

  const handleJdFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setJdFileLoading(true);
    try {
      const parsed = await parseResumeFile(file);
      setJobDescription(parsed.text);
      addToast({
        type: 'success',
        title: `Loaded job description from ${parsed.fileName}`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not parse job description file',
        description: err instanceof Error ? err.message : 'Unsupported file.',
      });
    } finally {
      setJdFileLoading(false);
    }
  };

  const handleRunMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAnalysis) return;
    if (jobDescription.trim().length < 30) {
      addToast({
        type: 'warning',
        title: 'Job description too short',
        description: 'Paste at least 30 characters from the job posting for accurate TF-IDF and skill matching.',
      });
      return;
    }

    setRunning(true);
    try {
      let semanticScore: number | undefined;
      if (getLoadedModelStatus() === 'ready') {
        const sim = await computeSemanticSimilarityWithModel(
          activeAnalysis.extractedText,
          jobDescription
        );
        if (typeof sim === 'number') semanticScore = sim;
      }

      const result = runJobDescriptionMatch({
        analysis: activeAnalysis,
        jobTitle,
        company,
        requiredExperience,
        jobLocation,
        jobDescription,
        customSkills,
        semanticModelScore: semanticScore,
      });

      await saveJobMatch(result);
      addToast({
        type: 'success',
        title: 'Job description match calculated',
        description: `Composite Match Score: ${result.overallMatchScore}%`,
      });
    } finally {
      setRunning(false);
    }
  };

  if (!activeAnalysis) {
    return (
      <WorkspaceLayout>
        <EmptyState
          title="Upload a resume before matching a job description"
          description="ResumeIQ matches your actual parsed resume text against a target job posting using TF-IDF cosine similarity, keyword overlap, and skills extraction."
          action={
            <Link
              to="/analyzer"
              className="inline-flex items-center rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Upload Resume First
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
              Resume vs. Job Description Comparison
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Compare your resume against any target job posting to clearly see what is the same, what is missing, and what to improve.
            </p>
          </div>
          {activeJobMatch && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => exportAnalysisReportPdf(activeAnalysis, activeJobMatch)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                <Download className="h-4 w-4" />
                <span>Export Match Report PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Input Form */}
        <Card>
          <CardHeader
            title="Target Job Posting"
            subtitle={`Comparing against: ${activeAnalysis.fileName}`}
            action={
              analyses.length > 1 ? (
                <select
                  aria-label="Select resume to match"
                  value={activeAnalysis.id}
                  onChange={(e) => {
                    const found = analyses.find((a) => a.id === e.target.value);
                    if (found) setActiveAnalysis(found);
                  }}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                >
                  {analyses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fileName} ({a.ats.overallScore}/100)
                    </option>
                  ))}
                </select>
              ) : undefined
            }
          />

          <form onSubmit={handleRunMatch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Job Title (Optional)
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Senior Full-Stack Engineer"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Company (Optional)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Enter target company name"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Required Experience (Optional)
                </label>
                <input
                  type="text"
                  value={requiredExperience}
                  onChange={(e) => setRequiredExperience(e.target.value)}
                  placeholder="e.g., 4+ years"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                  placeholder="e.g., Remote / Austin, TX"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Full Job Description
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{jdFileLoading ? 'Reading file...' : 'Load JD File (.txt/.pdf/.docx)'}</span>
                  <input
                    type="file"
                    accept=".txt,.pdf,.docx"
                    className="hidden"
                    onChange={handleJdFileUpload}
                    disabled={jdFileLoading}
                  />
                </label>
              </div>
              <textarea
                rows={8}
                required
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job responsibilities, required qualifications, and preferred skills here..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Missing skills are reported as learning or tailoring gaps — ResumeIQ never inserts unverified skills into your resume.
              </p>
              <button
                type="submit"
                disabled={running}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap"
              >
                <Briefcase className="h-4 w-4" />
                <span>{running ? 'Calculating Match...' : 'Run Job Match Analysis'}</span>
              </button>
            </div>
          </form>
        </Card>

        {/* Optional Local Transformer Control */}
        <LocalModelPanel compact />

        {/* Match Results */}
        {activeJobMatch && (
          <>
            {comparisonIntelligence && (
              <ResumeVsJobComparisonPanel
                analysis={activeAnalysis}
                jobMatch={activeJobMatch}
                intelligence={comparisonIntelligence}
              />
            )}

            <div className="rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-[#0D1529] p-4 flex items-start gap-3">
              <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                <strong>Method Transparency:</strong> Classical job matching uses dictionary skill matching, stemmed token overlap, and lexical TF-IDF cosine similarity — not deep language comprehension. Optional local Transformers.js adds vector cosine scoring when loaded, and no unverified qualifications are ever fabricated.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card padding="sm">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Overall Match</p>
                <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                  {activeJobMatch.overallMatchScore}%
                </p>
                <div className="mt-2">
                  <ProgressBar value={activeJobMatch.overallMatchScore} size="sm" tone="indigo" />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {typeof activeJobMatch.semanticModelScore === 'number'
                    ? 'Weighted Hybrid + Local Model'
                    : 'Weighted Classical Composite'}
                </p>
              </Card>
              <Card padding="sm">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Skills Overlap</p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {activeJobMatch.skillsMatchScore}%
                </p>
                <div className="mt-2">
                  <ProgressBar value={activeJobMatch.skillsMatchScore} size="sm" tone="violet" />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Method: Skills Dictionary
                </p>
              </Card>
              <Card padding="sm">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">TF-IDF Cosine</p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {activeJobMatch.tfidfCosineSimilarity}%
                </p>
                <div className="mt-2">
                  <ProgressBar value={activeJobMatch.tfidfCosineSimilarity} size="sm" tone="indigo" />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Method: Lexical TF-IDF Vector
                </p>
              </Card>
              <Card padding="sm">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Keyword Overlap</p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {activeJobMatch.keywordOverlapScore}%
                </p>
                <div className="mt-2">
                  <ProgressBar value={activeJobMatch.keywordOverlapScore} size="sm" tone="violet" />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Method: Stemmed Token Set
                </p>
              </Card>
              <Card padding="sm">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {typeof activeJobMatch.semanticModelScore === 'number'
                    ? 'Transformer Cosine'
                    : 'Section Evidence'}
                </p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {typeof activeJobMatch.semanticModelScore === 'number'
                    ? `${activeJobMatch.semanticModelScore}%`
                    : `${activeJobMatch.sectionRelevanceScore}%`}
                </p>
                <div className="mt-2">
                  <ProgressBar
                    value={
                      typeof activeJobMatch.semanticModelScore === 'number'
                        ? activeJobMatch.semanticModelScore
                        : activeJobMatch.sectionRelevanceScore
                    }
                    size="sm"
                    tone="emerald"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {typeof activeJobMatch.semanticModelScore === 'number'
                    ? 'Method: Transformers.js MiniLM'
                    : 'Method: Experience/Project Proof'}
                </p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader
                  title="Skills Alignment Breakdown"
                  subtitle={`Methods used: ${activeJobMatch.methodBreakdown.join(' · ')}`}
                />
                <div className="space-y-4 text-sm">
                  <ProgressBar
                    value={activeJobMatch.skillsMatchScore}
                    label="Dictionary Skills Coverage"
                  />
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                      Matched Skills ({activeJobMatch.matchedSkills.length})
                    </p>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      {activeJobMatch.matchedSkills.join(', ') || 'None matched'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1">
                      Missing Required Skills ({activeJobMatch.missingRequiredSkills.length})
                    </p>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      {activeJobMatch.missingRequiredSkills.join(', ') || 'No required dictionary skills missing'}
                    </p>
                  </div>
                  {activeJobMatch.missingPreferredSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                        Missing Preferred Skills ({activeJobMatch.missingPreferredSkills.length})
                      </p>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                        {activeJobMatch.missingPreferredSkills.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="Relevant Resume Evidence"
                  subtitle="Method: Sentence/line matching against detected resume sections"
                />
                {activeJobMatch.relevantEvidence.length === 0 ? (
                  <p className="text-xs text-slate-500">No direct skill line snippets matched.</p>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto">
                    {activeJobMatch.relevantEvidence.map((ev, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs"
                      >
                        <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {ev.skillOrKeyword} · {ev.section}
                        </p>
                        <p className="mt-1 text-slate-700 dark:text-slate-300">{ev.snippet}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader
                  title="Keyword Overlap &amp; Top TF-IDF Contributors"
                  subtitle="Method: Stopword-filtered stemmed tokens &amp; shared TF-IDF term weights"
                />
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Matched Keywords ({activeJobMatch.matchedKeywords.length})
                    </p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                      {activeJobMatch.matchedKeywords.join(', ') || 'None'}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Missing Posting Keywords ({activeJobMatch.missingKeywords.length})
                    </p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                      {activeJobMatch.missingKeywords.join(', ') || 'None'}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Top Shared Stemmed TF-IDF Terms
                    </p>
                    <p className="mt-1 font-mono text-slate-600 dark:text-slate-400">
                      {activeJobMatch.topTfidfTerms
                        .slice(0, 10)
                        .map((t) => t.term)
                        .join(' · ') || 'None'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="Alignment Notes &amp; Tailoring Suggestions"
                  subtitle="Method: Deterministic years-of-experience, degree regex &amp; gap rules"
                />
                <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <p>
                    <strong>Experience check:</strong> {activeJobMatch.experienceGapNote}
                  </p>
                  <p>
                    <strong>Education check:</strong> {activeJobMatch.educationNote}
                  </p>
                  {activeJobMatch.suggestions.length > 0 && (
                    <ul className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {activeJobMatch.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </WorkspaceLayout>
  );
}
