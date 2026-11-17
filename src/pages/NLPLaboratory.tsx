import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Copy, Info, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { ChartTooltipContent } from '../components/ui/ChartTooltip';
import { LocalModelPanel } from '../components/nlp/LocalModelPanel';
import { EmptyState } from '../components/ui/StateViews';
import { SKILL_CATEGORIES } from '../nlp/skillsDictionary';
import { analyzeResumeTextAsync } from '../nlp/analyzeResume';
import { generateBulletCoachSuggestions } from '../nlp/bulletCoach';
import {
  LOCAL_MODEL_ID,
  scoreResumeDomainsWithModel,
} from '../nlp/transformersEngine';
import { useAppStore } from '../store/useAppStore';
import type { ExtractedEntities, SkillCategory } from '../types/resume';

export default function NLPLaboratory() {
  const activeAnalysis = useAppStore((s) => s.activeAnalysis);
  const customSkills = useAppStore((s) => s.customSkills);
  const atsWeights = useAppStore((s) => s.atsWeights);
  const addCustomSkill = useAppStore((s) => s.addCustomSkill);
  const removeCustomSkill = useAppStore((s) => s.removeCustomSkill);
  const updateAnalysisRecord = useAppStore((s) => s.updateAnalysisRecord);
  const addToast = useAppStore((s) => s.addToast);

  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<SkillCategory>('Programming Languages');
  const [newSkillAliases, setNewSkillAliases] = useState('');
  const [reanalyzing, setReanalyzing] = useState(false);

  const [editedText, setEditedText] = useState(activeAnalysis?.extractedText || '');
  const [editingRaw, setEditingRaw] = useState(false);

  if (!activeAnalysis) {
    return (
      <WorkspaceLayout>
        <EmptyState
          title="No document loaded in NLP Laboratory"
          description="Upload a resume in the Resume Analyzer first to inspect tokens, stems, n-grams, entity extraction, bullet quality, and custom skills."
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

  const { nlp } = activeAnalysis;

  const rerunWithCurrentState = async (textOverride?: string, updatedSkillsList = customSkills) => {
    const targetText = textOverride ?? activeAnalysis.extractedText;
    if (targetText.trim().length < 20) {
      addToast({
        type: 'warning',
        title: 'Text too short',
        description: 'Provide at least 20 characters of resume text to run NLP analysis.',
      });
      return false;
    }
    setReanalyzing(true);
    try {
      const result = await analyzeResumeTextAsync({
        text: targetText,
        customSkills: updatedSkillsList,
        weights: atsWeights,
      });
      await updateAnalysisRecord({
        ...activeAnalysis,
        extractedText: targetText,
        nlp: {
          ...result.nlp,
          transformersModelResult: activeAnalysis.nlp.transformersModelResult,
        },
        ats: result.ats,
      });
      addToast({ type: 'success', title: 'NLP & ATS analysis updated' });
      return true;
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Analysis failed',
        description: err instanceof Error ? err.message : 'Could not re-run NLP analysis.',
      });
      return false;
    } finally {
      setReanalyzing(false);
    }
  };

  const handleAddCustomSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkillName.trim();
    if (!trimmed) return;
    const aliases = newSkillAliases
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);
    await addCustomSkill({ name: trimmed, category: newSkillCategory, aliases });
    setNewSkillName('');
    setNewSkillAliases('');
    const nextSkills = [
      ...customSkills,
      {
        id: 'temp',
        name: trimmed,
        category: newSkillCategory,
        aliases,
        createdAt: new Date().toISOString(),
      },
    ];
    await rerunWithCurrentState(undefined, nextSkills);
  };

  const handleVerifyEntity = (
    group: keyof ExtractedEntities,
    id: string,
    newValue?: string
  ) => {
    const updatedGroup = nlp.entities[group].map((ent) =>
      ent.id === id
        ? {
            ...ent,
            value: newValue !== undefined ? newValue : ent.value,
            confidence: newValue !== undefined ? ('manual' as const) : ('verified' as const),
          }
        : ent
    );
    updateAnalysisRecord({
      ...activeAnalysis,
      nlp: {
        ...nlp,
        entities: {
          ...nlp.entities,
          [group]: updatedGroup,
        },
      },
    });
  };

  const handleModelReady = async () => {
    const domainScores = await scoreResumeDomainsWithModel(activeAnalysis.extractedText);
    if (domainScores) {
      await updateAnalysisRecord({
        ...activeAnalysis,
        nlp: {
          ...nlp,
          methodLabels: {
            ...nlp.methodLabels,
            optionalModel: `Local Transformers.js (${LOCAL_MODEL_ID}) embedding cosine similarity active`,
          },
          transformersModelResult: {
            enabled: true,
            modelId: LOCAL_MODEL_ID,
            status: 'Ready in browser cache',
            topConcepts: domainScores,
          },
        },
      });
      addToast({ type: 'success', title: 'Local transformer embedding comparison complete' });
    }
  };

  const handleModelFallback = async (reason: string) => {
    await updateAnalysisRecord({
      ...activeAnalysis,
      nlp: {
        ...nlp,
        methodLabels: {
          ...nlp.methodLabels,
          optionalModel: 'Graceful fallback to Classical NLP (local model unavailable or declined)',
        },
        transformersModelResult: {
          enabled: false,
          modelId: LOCAL_MODEL_ID,
          status: 'Fallback to Classical NLP',
          fallbackReason: reason,
        },
      },
    });
    addToast({
      type: 'warning',
      title: 'Continuing with Classical NLP',
      description: reason,
    });
  };

  const wordFreqChartData = nlp.wordFrequency.slice(0, 12).map((w) => ({
    word: w.word,
    count: w.count,
  }));

  const entityGroups: { key: keyof ExtractedEntities; label: string }[] = [
    { key: 'names', label: 'Candidate Name' },
    { key: 'emails', label: 'Email' },
    { key: 'phones', label: 'Phone' },
    { key: 'locations', label: 'Locations' },
    { key: 'organizations', label: 'Organizations' },
    { key: 'jobTitles', label: 'Job Titles' },
    { key: 'dates', label: 'Date Ranges' },
    { key: 'education', label: 'Education' },
    { key: 'certifications', label: 'Certifications' },
    { key: 'projects', label: 'Projects' },
  ];

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              NLP Analysis Laboratory
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {activeAnalysis.fileName} · Transparent inspection of classical NLP, lexical patterns, entities, and optional local model weights
            </p>
          </div>
          <button
            type="button"
            onClick={() => rerunWithCurrentState()}
            disabled={reanalyzing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
          >
            <RefreshCw className={`h-4 w-4 ${reanalyzing ? 'animate-spin' : ''}`} />
            <span>Re-run Analysis</span>
          </button>
        </div>

        {/* Honesty & Method Boundary Banner */}
        <div className="rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-[#0D1529] p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <strong>Method Transparency:</strong> Keyword matching, n-gram counts, and TF-IDF measure lexical frequency and surface alignment — not human comprehension. Every panel below labels which engine generated its result, and core analysis runs fully without any downloaded model or external API.
          </p>
        </div>

        {/* Modular Method Provenance Matrix */}
        <Card padding="sm">
          <CardHeader
            title="Active Hybrid NLP Pipeline Provenance"
            subtitle="Exact engine or heuristic behind each computed output"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="font-semibold text-indigo-600 dark:text-indigo-400">1. Preprocessing &amp; N-Grams</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">{nlp.methodLabels.preprocessing}</p>
            </div>
            <div>
              <p className="font-semibold text-indigo-600 dark:text-indigo-400">2. TF-IDF &amp; Cosine Alignment</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                {nlp.methodLabels.keywordRelevance || 'Statistical TF-IDF weighting & vector cosine similarity'}
              </p>
            </div>
            <div>
              <p className="font-semibold text-indigo-600 dark:text-indigo-400">3. Entities &amp; Skills</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">{nlp.methodLabels.entityExtraction}</p>
            </div>
            <div>
              <p className="font-semibold text-indigo-600 dark:text-indigo-400">4. Optional Local Model</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">{nlp.methodLabels.optionalModel}</p>
            </div>
          </div>
        </Card>

        {/* Token Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Characters', val: nlp.tokenStats.totalChars },
            { label: 'Words', val: nlp.tokenStats.totalWords },
            { label: 'Unique Tokens', val: nlp.tokenStats.uniqueWords },
            { label: 'Sentences', val: nlp.tokenStats.sentenceCount },
            { label: 'Avg Words/Sent', val: nlp.tokenStats.avgWordsPerSentence },
            { label: 'FK Grade', val: nlp.tokenStats.readingGradeLevel },
            { label: 'Richness %', val: `${nlp.tokenStats.vocabularyRichness}%` },
          ].map((stat) => (
            <Card key={stat.label} padding="sm">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                {stat.val}
              </p>
            </Card>
          ))}
        </div>

        {/* Word Frequency Chart + N-grams */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-7">
            <CardHeader
              title="Top Non-Stopword Term Frequency"
              subtitle="Method: Classical tokenization + English stopword removal"
            />
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wordFreqChartData} margin={{ top: 8, right: 12, left: -16, bottom: 18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <XAxis
                    dataKey="word"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={46}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" name="Occurrences" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="lg:col-span-5">
            <CardHeader
              title="N-Gram Phrases &amp; Repetition"
              subtitle="Method: Sliding-window bigram/trigram extraction &amp; duplicate sentence check"
            />
            <div className="space-y-4 text-xs">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Top Bigrams (2-word phrases)
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {nlp.ngrams.bigrams
                    .slice(0, 10)
                    .map((b) => `${b.phrase} (${b.count})`)
                    .join(' · ') || 'None'}
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Top Trigrams (3-word phrases)
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {nlp.ngrams.trigrams
                    .slice(0, 8)
                    .map((t) => `${t.phrase} (${t.count})`)
                    .join(' · ') || 'None'}
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Duplicate Sentences ({nlp.duplicateSentences.length})
                </p>
                {nlp.duplicateSentences.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400">No duplicate sentences detected.</p>
                ) : (
                  <ul className="space-y-1 text-amber-700 dark:text-amber-400">
                    {nlp.duplicateSentences.map((d, i) => (
                      <li key={i}>
                        ({d.count}x) {d.sentence}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Intra-Resume TF-IDF Keyword Relevance & Section Cosine Similarity */}
        <Card>
          <CardHeader
            title="TF-IDF Keyword Relevance &amp; Section Alignment"
            subtitle="Method: Classical TF-IDF term weighting across detected resume sections + Summary-to-Experience vector cosine"
            action={
              typeof nlp.summaryExperienceCosine === 'number' ? (
                <span className="font-mono text-xs font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">
                  Summary ↔ Experience Cosine: {nlp.summaryExperienceCosine}%
                </span>
              ) : undefined
            }
          />
          {!nlp.keywordRelevance || nlp.keywordRelevance.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Re-run analysis to compute TF-IDF keyword relevance scores across detected resume sections.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {nlp.keywordRelevance.slice(0, 12).map((kw) => (
                <div
                  key={kw.stem}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                      {kw.keyword}
                    </span>
                    <span className="font-mono font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                      {kw.tfidfScore}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Stem: {kw.stem} · {kw.count}x · {kw.sections.join(', ')}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {kw.method}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Entity Extraction & Manual Correction */}
        <Card>
          <CardHeader
            title="Extracted Entities (Editable)"
            subtitle="Method: Deterministic Regex + Compromise.js POS/NER heuristics (unverified guesses require confirmation)"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entityGroups.map(({ key, label }) => {
              const items = nlp.entities[key];
              return (
                <div
                  key={key}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                      {items.length} detected
                    </span>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">None extracted</p>
                  ) : (
                    <div className="space-y-2">
                      {items.slice(0, 6).map((ent) => (
                        <div key={ent.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={ent.value}
                            onChange={(e) => handleVerifyEntity(key, ent.id, e.target.value)}
                            className="flex-1 min-w-0 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100"
                          />
                          <span
                            className={`text-[11px] font-medium whitespace-nowrap ${
                              ent.confidence === 'verified' || ent.confidence === 'manual'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {ent.confidence}
                            {ent.source ? ` · ${ent.source}` : ''}
                          </span>
                          {ent.confidence === 'unverified' && (
                            <button
                              type="button"
                              onClick={() => handleVerifyEntity(key, ent.id)}
                              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Action Verbs, Weak Phrases & Bullet Quality */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader
              title="Action Verbs &amp; Weak Phrases"
              subtitle="Method: Action verb lexicon &amp; weak-phrase pattern matching"
            />
            <div className="space-y-4 text-xs">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Strong Action Verbs Detected ({nlp.actionVerbs.length})
                </p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {nlp.actionVerbs
                    .slice(0, 20)
                    .map((v) => `${v.verb} (${v.count})`)
                    .join(', ') || 'None detected'}
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Weak or Generic Phrases ({nlp.weakPhrases.length})
                </p>
                {nlp.weakPhrases.length === 0 ? (
                  <p className="text-emerald-600 dark:text-emerald-400">
                    No weak cliché phrases detected.
                  </p>
                ) : (
                  <ul className="space-y-1.5 text-amber-800 dark:text-amber-300">
                    {nlp.weakPhrases.slice(0, 8).map((wp, idx) => (
                      <li key={idx}>
                        <strong>"{wp.phrase}"</strong> in: {wp.context}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Bullet Point Quality Auditor"
              subtitle={`Method: Bullet segmentation, action-verb check & metric regex (${nlp.bulletQuality.length} inspected)`}
            />
            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {nlp.bulletQuality.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No structured experience or project bullet statements found.
                </p>
              ) : (
                nlp.bulletQuality.slice(0, 15).map((b, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs"
                  >
                    <p className="text-slate-800 dark:text-slate-200">{b.text}</p>
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {b.section} · {b.wordCount} words ·{' '}
                      {b.issues.length === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Strong action verb &amp; metric
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">
                          {b.issues.join('; ')}
                        </span>
                      )}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Guided Bullet & Action-Verb Coach */}
        {nlp.bulletQuality.some((b) => b.issues.length > 0) && (
          <Card>
            <CardHeader
              title="Guided Bullet &amp; Action-Verb Coach"
              subtitle="Method: Deterministic phrasing templates preserving your truthful resume facts"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generateBulletCoachSuggestions(nlp.bulletQuality, 6).map((sug, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{sug.original}</p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(sug.guidedTemplate);
                          addToast({ type: 'success', title: 'Copied guided bullet template' });
                        } catch {
                          addToast({ type: 'error', title: 'Clipboard blocked' });
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] font-medium shrink-0"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Try verbs: <strong>{sug.suggestedVerbs.join(', ')}</strong>
                  </p>
                  <p className="rounded bg-indigo-50/70 dark:bg-indigo-950/40 px-2.5 py-1.5 font-mono text-[11px] text-indigo-900 dark:text-indigo-200">
                    {sug.guidedTemplate}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Custom Skills Dictionary */}
        <Card>
          <CardHeader
            title="Skills by Category &amp; Custom Skills Dictionary"
            subtitle="Method: Exact &amp; normalized alias dictionary matching — add domain skills and re-run"
          />
          <form onSubmit={handleAddCustomSkill} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Skill name (e.g., dbt, SolidWorks)"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
            <select
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value as SkillCategory)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
            >
              {SKILL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newSkillAliases}
              onChange={(e) => setNewSkillAliases(e.target.value)}
              placeholder="Aliases comma-separated (optional)"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Add Skill</span>
            </button>
          </form>

          {customSkills.length > 0 && (
            <div className="mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Your Custom Skills ({customSkills.length})
              </p>
              <div className="flex flex-wrap gap-3 text-xs">
                {customSkills.map((cs) => (
                  <span
                    key={cs.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-slate-800 dark:text-slate-200"
                  >
                    <span>
                      {cs.name} ({cs.category})
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCustomSkill(cs.id)}
                      aria-label={`Remove ${cs.name}`}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {Object.entries(nlp.skills.byCategory).map(([cat, list]) => (
              <div key={cat} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5">
                <p className="font-semibold text-slate-900 dark:text-white">{cat}</p>
                <p className="mt-1.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                  {list.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Optional Local Transformers.js Inference */}
        <div className="space-y-4">
          <LocalModelPanel
            onModelReady={handleModelReady}
            onModelErrorOrUnavailable={handleModelFallback}
          />

          {nlp.transformersModelResult?.topConcepts && (
            <Card>
              <CardHeader
                title="Local Embedding Similarity vs. Career Domain Vectors"
                subtitle={`Method: Local Transformers.js (${nlp.transformersModelResult.modelId}) mean-pooled cosine similarity`}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {nlp.transformersModelResult.topConcepts.map((c) => (
                  <div
                    key={c.label}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-slate-700 dark:text-slate-300">{c.label}</span>
                    <span className="font-mono font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                      {c.similarity}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Raw Text Inspector */}
        <Card>
          <CardHeader
            title="Raw Text Inspector"
            subtitle="Correct PDF/DOCX extraction quirks directly and re-run NLP"
            action={
              <button
                type="button"
                onClick={async () => {
                  if (editingRaw) {
                    const ok = await rerunWithCurrentState(editedText);
                    if (ok) setEditingRaw(false);
                  } else {
                    setEditedText(activeAnalysis.extractedText);
                    setEditingRaw(true);
                  }
                }}
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
              >
                {editingRaw ? 'Save & Re-analyze' : 'Edit Text'}
              </button>
            }
          />
          {editingRaw ? (
            <textarea
              rows={12}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-xs text-slate-800 dark:text-slate-200"
            />
          ) : (
            <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-4 font-mono text-xs text-slate-700 dark:text-slate-300">
              {activeAnalysis.extractedText}
            </pre>
          )}
        </Card>
      </div>
    </WorkspaceLayout>
  );
}
