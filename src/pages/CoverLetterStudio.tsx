import { useState } from 'react';
import { Copy, Download, Info, PenTool, Save, Trash2 } from 'lucide-react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { generateRuleBasedCoverLetter } from '../utils/coverLetterGenerator';
import { exportCoverLetterPdf } from '../utils/pdfExport';
import { useAppStore } from '../store/useAppStore';
import type { CoverLetterRecord, CoverLetterTone } from '../types/resume';

export default function CoverLetterStudio() {
  const profile = useAppStore((s) => s.profile);
  const analyses = useAppStore((s) => s.analyses);
  const activeAnalysis = useAppStore((s) => s.activeAnalysis);
  const activeJobMatch = useAppStore((s) => s.activeJobMatch);
  const resumes = useAppStore((s) => s.resumes);
  const coverLetters = useAppStore((s) => s.coverLetters);
  const saveCoverLetter = useAppStore((s) => s.saveCoverLetter);
  const deleteCoverLetter = useAppStore((s) => s.deleteCoverLetter);
  const addToast = useAppStore((s) => s.addToast);

  const [candidateName, setCandidateName] = useState(
    profile.displayName || activeAnalysis?.nlp.entities.names[0]?.value || ''
  );
  const [candidateEmail, setCandidateEmail] = useState(
    profile.email || activeAnalysis?.nlp.entities.emails[0]?.value || ''
  );
  const [candidatePhone, setCandidatePhone] = useState(
    profile.phone || activeAnalysis?.nlp.entities.phones[0]?.value || ''
  );
  const [candidateLocation, setCandidateLocation] = useState(
    profile.location || activeAnalysis?.nlp.entities.locations[0]?.value || ''
  );

  const [jobTitle, setJobTitle] = useState(activeJobMatch?.jobTitle || '');
  const [company, setCompany] = useState(activeJobMatch?.company || '');
  const [tone, setTone] = useState<CoverLetterTone>('professional');
  const [sourceRef, setSourceRef] = useState<string>(
    activeAnalysis ? `analysis:${activeAnalysis.id}` : resumes[0] ? `builder:${resumes[0].id}` : 'none'
  );
  const [jobDescription, setJobDescription] = useState(activeJobMatch?.jobDescription || '');
  const [content, setContent] = useState('');
  const [currentId, setCurrentId] = useState<string | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !company.trim()) {
      addToast({
        type: 'warning',
        title: 'Job title and company required',
        description: 'Enter the target role and company name to compose your cover letter.',
      });
      return;
    }

    const selectedBuilderResume = sourceRef.startsWith('builder:')
      ? resumes.find((r) => `builder:${r.id}` === sourceRef)
      : undefined;
    const selectedAnalysis = sourceRef.startsWith('analysis:')
      ? analyses.find((a) => `analysis:${a.id}` === sourceRef) || (activeAnalysis ?? undefined)
      : undefined;

    const generated = generateRuleBasedCoverLetter({
      candidateName,
      candidateEmail,
      candidatePhone,
      candidateLocation,
      jobTitle,
      company,
      tone,
      jobDescription,
      selectedAnalysis,
      selectedBuilderResume,
    });

    setContent(generated);
    addToast({
      type: 'success',
      title: 'Cover letter composed locally',
      description: 'Review and personalize the draft before exporting.',
    });
  };

  const handleCopy = async () => {
    if (!content.trim()) return;
    try {
      await navigator.clipboard.writeText(content);
      addToast({ type: 'success', title: 'Copied cover letter to clipboard' });
    } catch {
      addToast({ type: 'error', title: 'Clipboard access blocked by browser' });
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    const now = new Date().toISOString();
    const record: CoverLetterRecord = {
      id: currentId || `cl-${Date.now()}`,
      title: `${jobTitle || 'Role'} — ${company || 'Company'}`,
      candidateName,
      candidateEmail,
      candidatePhone,
      candidateLocation,
      jobTitle,
      company,
      tone,
      resumeId: sourceRef,
      jobDescription,
      content,
      createdAt: now,
      updatedAt: now,
    };
    setCurrentId(record.id);
    const persisted = await saveCoverLetter(record);
    if (persisted) {
      addToast({ type: 'success', title: 'Cover letter saved to local IndexedDB' });
    }
  };

  const handleLoadSaved = (cl: CoverLetterRecord) => {
    setCurrentId(cl.id);
    setCandidateName(cl.candidateName);
    setCandidateEmail(cl.candidateEmail);
    setCandidatePhone(cl.candidatePhone);
    setCandidateLocation(cl.candidateLocation);
    setJobTitle(cl.jobTitle);
    setCompany(cl.company);
    setTone(cl.tone);
    setJobDescription(cl.jobDescription);
    setContent(cl.content);
  };

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Cover Letter Studio
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Compose tailored cover letters using your actual resume skills and experience without inventing credentials.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <strong>Rule-Based Local Writing:</strong> Cover letters are assembled deterministically inside your browser using structured templates and only the skills, roles, and highlights present in your selected resume.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form */}
          <Card className="lg:col-span-5">
            <CardHeader title="Letter Inputs" />
            <form onSubmit={handleGenerate} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={candidateLocation}
                  onChange={(e) => setCandidateLocation(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Target Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Frontend Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Northstar Systems"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Source Resume
                  </label>
                  <select
                    value={sourceRef}
                    onChange={(e) => setSourceRef(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 text-xs"
                  >
                    <option value="none">Manual inputs only</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={`builder:${r.id}`}>
                        Draft: {r.title}
                      </option>
                    ))}
                    {activeAnalysis && !analyses.some((a) => a.id === activeAnalysis.id) && (
                      <option value={`analysis:${activeAnalysis.id}`}>
                        Active: {activeAnalysis.fileName}
                      </option>
                    )}
                    {analyses.map((a) => (
                      <option key={a.id} value={`analysis:${a.id}`}>
                        Analyzed: {a.fileName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as CoverLetterTone)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 text-xs"
                  >
                    <option value="professional">Professional</option>
                    <option value="confident">Confident</option>
                    <option value="concise">Concise</option>
                    <option value="entry-level">Entry-Level</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Job Description (Optional — aligns verified skills)
                </label>
                <textarea
                  rows={5}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste target role requirements..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white p-3 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <PenTool className="h-4 w-4" />
                <span>Compose Rule-Based Draft</span>
              </button>
            </form>
          </Card>

          {/* Editor & Saved Letters */}
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <CardHeader
                title="Editable Cover Letter"
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      disabled={!content.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={!content.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Locally</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          exportCoverLetterPdf(`${company}_${jobTitle}`, content);
                          addToast({ type: 'success', title: 'Cover letter PDF downloaded' });
                        } catch (err) {
                          addToast({
                            type: 'error',
                            title: 'PDF export failed',
                            description: err instanceof Error ? err.message : 'Unable to generate PDF.',
                          });
                        }
                      }}
                      disabled={!content.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export PDF</span>
                    </button>
                  </div>
                }
              />
              <textarea
                rows={18}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Click 'Compose Rule-Based Draft' or write your cover letter directly here..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-sm leading-relaxed text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </Card>

            {coverLetters.length > 0 && (
              <Card>
                <CardHeader title="Saved Cover Letters" />
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {coverLetters.map((cl) => (
                    <div key={cl.id} className="flex items-center justify-between gap-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => handleLoadSaved(cl)}
                        className="text-left min-w-0 flex-1"
                      >
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {cl.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Tone: {cl.tone} · Updated {new Date(cl.updatedAt).toLocaleDateString()}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCoverLetter(cl.id)}
                        aria-label={`Delete ${cl.title}`}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
