import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  CopyPlus,
  Download,
  Plus,
  Printer,
  Save,
  Trash2,
} from 'lucide-react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/Modal';
import { ResumePreview } from '../components/builder/ResumePreview';
import {
  createEmptyResumeDraft,
  RESUME_TEMPLATES,
  SECTION_LABELS,
} from '../utils/builderDefaults';
import { exportResumeBuilderPdf } from '../utils/pdfExport';
import { useAppStore } from '../store/useAppStore';
import type {
  BuilderSectionKey,
  ResumeBuilderData,
  TemplateId,
} from '../types/resume';

export default function ResumeBuilder() {
  const [searchParams] = useSearchParams();
  const resumes = useAppStore((s) => s.resumes);
  const profile = useAppStore((s) => s.profile);
  const activeAnalysis = useAppStore((s) => s.activeAnalysis);
  const saveBuilderResume = useAppStore((s) => s.saveBuilderResume);
  const deleteBuilderResume = useAppStore((s) => s.deleteBuilderResume);
  const addToast = useAppStore((s) => s.addToast);

  const [draft, setDraft] = useState<ResumeBuilderData>(() => {
    const paramTemplate = searchParams.get('template') as TemplateId | null;
    if (resumes.length > 0 && !paramTemplate) {
      return resumes[0];
    }
    const base = createEmptyResumeDraft(paramTemplate || 'modern-professional');
    if (profile.displayName) base.personal.fullName = profile.displayName;
    if (profile.email) base.personal.email = profile.email;
    if (profile.phone) base.personal.phone = profile.phone;
    if (profile.location) base.personal.location = profile.location;
    if (profile.linkedin) base.personal.linkedin = profile.linkedin;
    if (profile.portfolio) base.personal.website = profile.portfolio;
    return base;
  });

  const [activeTab, setActiveTab] = useState<'content' | 'layout'>('content');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const paramTemplate = searchParams.get('template') as TemplateId | null;
    if (paramTemplate && RESUME_TEMPLATES.some((t) => t.id === paramTemplate)) {
      const tmpl = RESUME_TEMPLATES.find((t) => t.id === paramTemplate)!;
      setDraft((prev) => ({
        ...prev,
        templateId: paramTemplate,
        fontFamily: tmpl.recommendedFont,
        accentColor: tmpl.defaultAccent,
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('import') === 'analysis' && activeAnalysis) {
      const ent = activeAnalysis.nlp.entities;
      const secs = activeAnalysis.nlp.sectionsDetected;
      const foundSkills = activeAnalysis.nlp.skills.found.map((s) => s.name);
      setDraft((prev) => ({
        ...prev,
        title: `${activeAnalysis.fileName.replace(/\.[^/.]+$/, '')} Draft`,
        personal: {
          ...prev.personal,
          fullName: prev.personal.fullName || ent.names[0]?.value || '',
          email: prev.personal.email || ent.emails[0]?.value || '',
          phone: prev.personal.phone || ent.phones[0]?.value || '',
          location: prev.personal.location || ent.locations[0]?.value || '',
        },
        summary: prev.summary || secs.summary || '',
        skills:
          foundSkills.length > 0
            ? [{ id: 'sg-imported', category: 'Detected Skills', items: foundSkills }]
            : prev.skills,
      }));
    }
  }, [searchParams, activeAnalysis]);

  const handleSaveDraft = async () => {
    const persisted = await saveBuilderResume(draft);
    if (persisted) {
      addToast({ type: 'success', title: `Saved "${draft.title}"` });
    }
  };

  const handleDuplicateVersion = async () => {
    const now = new Date().toISOString();
    const copy: ResumeBuilderData = {
      ...draft,
      id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${draft.title} (v${draft.version + 1})`,
      version: draft.version + 1,
      createdAt: now,
      updatedAt: now,
    };
    setDraft(copy);
    const persisted = await saveBuilderResume(copy);
    if (persisted) {
      addToast({ type: 'success', title: 'Created new version copy' });
    }
  };

  const handleNewBlank = () => {
    const fresh = createEmptyResumeDraft(draft.templateId);
    setDraft(fresh);
    addToast({ type: 'info', title: 'Started new blank resume draft' });
  };

  const handleImportFromAnalysis = () => {
    if (!activeAnalysis) return;
    const ent = activeAnalysis.nlp.entities;
    const secs = activeAnalysis.nlp.sectionsDetected;
    const foundSkills = activeAnalysis.nlp.skills.found.map((s) => s.name);

    setDraft((prev) => ({
      ...prev,
      title: prev.title === 'Untitled Resume Draft' ? `${activeAnalysis.fileName.replace(/\.[^/.]+$/, '')} Draft` : prev.title,
      personal: {
        ...prev.personal,
        fullName: prev.personal.fullName || ent.names[0]?.value || '',
        email: prev.personal.email || ent.emails[0]?.value || '',
        phone: prev.personal.phone || ent.phones[0]?.value || '',
        location: prev.personal.location || ent.locations[0]?.value || '',
      },
      summary: prev.summary || secs.summary || '',
      skills:
        foundSkills.length > 0
          ? [{ id: 'sg-imported', category: 'Detected Skills', items: foundSkills }]
          : prev.skills,
    }));
    addToast({
      type: 'success',
      title: 'Populated fields from active analysis',
      description: 'Review and expand your work experience and education entries.',
    });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.sectionOrder.length) return;
    const next = [...draft.sectionOrder];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setDraft({ ...draft, sectionOrder: next });
  };

  const handleDeleteSaved = async (id: string) => {
    await deleteBuilderResume(id);
    if (draft.id === id) {
      setDraft(createEmptyResumeDraft());
    }
    addToast({ type: 'info', title: 'Deleted resume draft' });
  };

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 no-print">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Resume Builder
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Author, reorder sections, manage local versions, and export ATS-friendly PDFs.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {activeAnalysis && (
              <button
                type="button"
                onClick={handleImportFromAnalysis}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                Import Entities from Analysis
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              onClick={handleDuplicateVersion}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <CopyPlus className="h-3.5 w-3.5" />
              <span>Duplicate Version</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const hasContent =
                  draft.personal.fullName.trim() ||
                  draft.summary.trim() ||
                  draft.experience.length > 0 ||
                  draft.education.length > 0 ||
                  draft.skills.some((s) => s.items.length > 0);
                if (!hasContent) {
                  addToast({
                    type: 'warning',
                    title: 'Resume draft is empty',
                    description: 'Add your name, summary, skills, or experience before exporting PDF.',
                  });
                  return;
                }
                try {
                  exportResumeBuilderPdf(draft);
                  addToast({ type: 'success', title: 'Resume PDF exported' });
                } catch (err) {
                  addToast({
                    type: 'error',
                    title: 'PDF export failed',
                    description: err instanceof Error ? err.message : 'Unable to export resume PDF.',
                  });
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Saved Drafts Bar */}
        {resumes.length > 0 && (
          <Card padding="sm" className="no-print">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Saved Local Versions:
                </span>
                {resumes.map((r) => (
                  <div key={r.id} className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDraft(r)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        draft.id === r.id
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {r.title}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(r.id)}
                      aria-label={`Delete ${r.title}`}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleNewBlank}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
              >
                + New Blank Draft
              </button>
            </div>
          </Card>
        )}

        {/* Main Split: Editor (Left) + Live Preview (Right) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Editor */}
          <div className="xl:col-span-6 space-y-5 no-print">
            {/* Switcher tabs */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'content'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Content Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('layout')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'layout'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Template &amp; Section Order
              </button>
            </div>

            {activeTab === 'layout' ? (
              <Card>
                <CardHeader title="Template, Typography &amp; Section Order" />
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Draft Title
                    </label>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Template
                      </label>
                      <select
                        value={draft.templateId}
                        onChange={(e) => {
                          const id = e.target.value as TemplateId;
                          const tmpl = RESUME_TEMPLATES.find((t) => t.id === id)!;
                          setDraft({
                            ...draft,
                            templateId: id,
                            fontFamily: tmpl.recommendedFont,
                            accentColor: tmpl.defaultAccent,
                          });
                        }}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 text-sm"
                      >
                        {RESUME_TEMPLATES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Font Family
                      </label>
                      <select
                        value={draft.fontFamily}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            fontFamily: e.target.value as ResumeBuilderData['fontFamily'],
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 text-sm"
                      >
                        <option value="sans">Clean Sans-Serif</option>
                        <option value="serif">Editorial Serif</option>
                        <option value="mono">Technical Monospace</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Page Margins
                      </label>
                      <select
                        value={draft.pageMargin}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            pageMargin: e.target.value as ResumeBuilderData['pageMargin'],
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 text-sm"
                      >
                        <option value="compact">Compact</option>
                        <option value="standard">Standard</option>
                        <option value="spacious">Spacious</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Accent Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={draft.accentColor}
                          onChange={(e) => setDraft({ ...draft, accentColor: e.target.value })}
                          className="h-9 w-12 rounded border border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer"
                        />
                        <span className="font-mono text-xs text-slate-500">{draft.accentColor}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Reorder Resume Sections
                    </p>
                    <div className="space-y-1.5">
                      {draft.sectionOrder.map((secKey: BuilderSectionKey, idx: number) => (
                        <div
                          key={secKey}
                          className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {SECTION_LABELS[secKey]}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveSection(idx, -1)}
                              aria-label={`Move ${SECTION_LABELS[secKey]} up`}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === draft.sectionOrder.length - 1}
                              onClick={() => moveSection(idx, 1)}
                              aria-label={`Move ${SECTION_LABELS[secKey]} down`}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                {/* Personal Details */}
                <Card>
                  <CardHeader title="Personal Details" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={draft.personal.fullName}
                      onChange={(e) =>
                        setDraft({ ...draft, personal: { ...draft.personal, fullName: e.target.value } })
                      }
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Target Role Headline"
                      value={draft.personal.headline}
                      onChange={(e) =>
                        setDraft({ ...draft, personal: { ...draft.personal, headline: e.target.value } })
                      }
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={draft.personal.email}
                      onChange={(e) =>
                        setDraft({ ...draft, personal: { ...draft.personal, email: e.target.value } })
                      }
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={draft.personal.phone}
                      onChange={(e) =>
                        setDraft({ ...draft, personal: { ...draft.personal, phone: e.target.value } })
                      }
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="City, State / Country"
                      value={draft.personal.location}
                      onChange={(e) =>
                        setDraft({ ...draft, personal: { ...draft.personal, location: e.target.value } })
                      }
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="LinkedIn URL"
                      value={draft.personal.linkedin}
                      onChange={(e) =>
                        setDraft({ ...draft, personal: { ...draft.personal, linkedin: e.target.value } })
                      }
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Portfolio / GitHub URL"
                      value={draft.personal.website}
                      onChange={(e) =>
                        setDraft({ ...draft, personal: { ...draft.personal, website: e.target.value } })
                      }
                      className="sm:col-span-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
                    />
                  </div>
                </Card>

                {/* Summary */}
                <Card>
                  <CardHeader title="Professional Summary" />
                  <textarea
                    rows={3}
                    placeholder="Concise 2–4 sentence overview of your real experience and technical strengths..."
                    value={draft.summary}
                    onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white p-3 text-sm"
                  />
                </Card>

                {/* Work Experience */}
                <Card>
                  <CardHeader
                    title="Work Experience"
                    action={
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            experience: [
                              ...draft.experience,
                              {
                                id: `exp-${Date.now()}`,
                                role: '',
                                company: '',
                                location: '',
                                startDate: '',
                                endDate: '',
                                current: false,
                                bullets: [''],
                              },
                            ],
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-medium text-white"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Role</span>
                      </button>
                    }
                  />
                  <div className="space-y-4">
                    {draft.experience.length === 0 && (
                      <p className="text-xs text-slate-500">No work experience entries added yet.</p>
                    )}
                    {draft.experience.map((exp, idx) => (
                      <div
                        key={exp.id}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-slate-500">
                            Role #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                experience: draft.experience.filter((e) => e.id !== exp.id),
                              })
                            }
                            className="text-xs text-rose-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                          <input
                            type="text"
                            placeholder="Job Title"
                            value={exp.role}
                            onChange={(e) => {
                              const next = [...draft.experience];
                              next[idx] = { ...exp, role: e.target.value };
                              setDraft({ ...draft, experience: next });
                            }}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5"
                          />
                          <input
                            type="text"
                            placeholder="Company"
                            value={exp.company}
                            onChange={(e) => {
                              const next = [...draft.experience];
                              next[idx] = { ...exp, company: e.target.value };
                              setDraft({ ...draft, experience: next });
                            }}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5"
                          />
                          <input
                            type="text"
                            placeholder="Start (e.g., Jan 2022)"
                            value={exp.startDate}
                            onChange={(e) => {
                              const next = [...draft.experience];
                              next[idx] = { ...exp, startDate: e.target.value };
                              setDraft({ ...draft, experience: next });
                            }}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              disabled={exp.current}
                              placeholder="End (e.g., Dec 2024)"
                              value={exp.current ? 'Present' : exp.endDate}
                              onChange={(e) => {
                                const next = [...draft.experience];
                                next[idx] = { ...exp, endDate: e.target.value };
                                setDraft({ ...draft, experience: next });
                              }}
                              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5 disabled:opacity-60"
                            />
                            <label className="inline-flex items-center gap-1 text-xs whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={exp.current}
                                onChange={(e) => {
                                  const next = [...draft.experience];
                                  next[idx] = { ...exp, current: e.target.checked };
                                  setDraft({ ...draft, experience: next });
                                }}
                              />
                              <span>Current</span>
                            </label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                            Achievement Bullets (one per line)
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Reduced API response latency by 35% by introducing Redis caching..."
                            value={exp.bullets.join('\n')}
                            onChange={(e) => {
                              const next = [...draft.experience];
                              next[idx] = { ...exp, bullets: e.target.value.split('\n') };
                              setDraft({ ...draft, experience: next });
                            }}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white p-2.5 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Skills */}
                <Card>
                  <CardHeader
                    title="Skills Groups"
                    action={
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            skills: [
                              ...draft.skills,
                              { id: `sg-${Date.now()}`, category: 'Tools & Platforms', items: [] },
                            ],
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Group</span>
                      </button>
                    }
                  />
                  <div className="space-y-3">
                    {draft.skills.map((grp, idx) => (
                      <div key={grp.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Category"
                          value={grp.category}
                          onChange={(e) => {
                            const next = [...draft.skills];
                            next[idx] = { ...grp, category: e.target.value };
                            setDraft({ ...draft, skills: next });
                          }}
                          className="sm:col-span-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Comma-separated skills (e.g., TypeScript, React, SQL)"
                          value={grp.items.join(', ')}
                          onChange={(e) => {
                            const next = [...draft.skills];
                            next[idx] = {
                              ...grp,
                              items: e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            };
                            setDraft({ ...draft, skills: next });
                          }}
                          className="sm:col-span-7 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              skills: draft.skills.filter((s) => s.id !== grp.id),
                            })
                          }
                          aria-label="Remove skill group"
                          className="sm:col-span-1 text-rose-500 hover:text-rose-700 justify-self-end"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Projects */}
                <Card>
                  <CardHeader
                    title="Projects"
                    action={
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            projects: [
                              ...draft.projects,
                              {
                                id: `proj-${Date.now()}`,
                                name: '',
                                roleOrTech: '',
                                link: '',
                                description: '',
                                bullets: [],
                              },
                            ],
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Project</span>
                      </button>
                    }
                  />
                  <div className="space-y-3">
                    {draft.projects.length === 0 && (
                      <p className="text-xs text-slate-500">No projects added yet.</p>
                    )}
                    {draft.projects.map((proj, idx) => (
                      <div key={proj.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5 text-xs">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-500">Project #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                projects: draft.projects.filter((p) => p.id !== proj.id),
                              })
                            }
                            className="text-rose-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Project Name"
                            value={proj.name}
                            onChange={(e) => {
                              const next = [...draft.projects];
                              next[idx] = { ...proj, name: e.target.value };
                              setDraft({ ...draft, projects: next });
                            }}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5"
                          />
                          <input
                            type="text"
                            placeholder="Tech Stack / Role"
                            value={proj.roleOrTech}
                            onChange={(e) => {
                              const next = [...draft.projects];
                              next[idx] = { ...proj, roleOrTech: e.target.value };
                              setDraft({ ...draft, projects: next });
                            }}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5"
                          />
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Concise project summary & measurable outcome..."
                          value={proj.description}
                          onChange={(e) => {
                            const next = [...draft.projects];
                            next[idx] = { ...proj, description: e.target.value };
                            setDraft({ ...draft, projects: next });
                          }}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white p-2.5"
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Education */}
                <Card>
                  <CardHeader
                    title="Education"
                    action={
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            education: [
                              ...draft.education,
                              {
                                id: `edu-${Date.now()}`,
                                degree: '',
                                institution: '',
                                location: '',
                                graduationDate: '',
                                gpaOrHonors: '',
                              },
                            ],
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Education</span>
                      </button>
                    }
                  />
                  <div className="space-y-3">
                    {draft.education.length === 0 && (
                      <p className="text-xs text-slate-500">No education entries added yet.</p>
                    )}
                    {draft.education.map((edu, idx) => (
                      <div key={edu.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-500">Education #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                education: draft.education.filter((x) => x.id !== edu.id),
                              })
                            }
                            className="text-rose-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Degree & Major"
                            value={edu.degree}
                            onChange={(e) => {
                              const next = [...draft.education];
                              next[idx] = { ...edu, degree: e.target.value };
                              setDraft({ ...draft, education: next });
                            }}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5"
                          />
                          <input
                            type="text"
                            placeholder="University / Institution"
                            value={edu.institution}
                            onChange={(e) => {
                              const next = [...draft.education];
                              next[idx] = { ...edu, institution: e.target.value };
                              setDraft({ ...draft, education: next });
                            }}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5"
                          />
                          <input
                            type="text"
                            placeholder="Graduation Date"
                            value={edu.graduationDate}
                            onChange={(e) => {
                              const next = [...draft.education];
                              next[idx] = { ...edu, graduationDate: e.target.value };
                              setDraft({ ...draft, education: next });
                            }}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5"
                          />
                          <input
                            type="text"
                            placeholder="Honors / GPA (optional)"
                            value={edu.gpaOrHonors}
                            onChange={(e) => {
                              const next = [...draft.education];
                              next[idx] = { ...edu, gpaOrHonors: e.target.value };
                              setDraft({ ...draft, education: next });
                            }}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Certifications, Achievements, Languages & Custom */}
                <Card>
                  <CardHeader title="Certifications, Achievements &amp; Languages" />
                  <div className="space-y-4 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Certifications</span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              certifications: [
                                ...draft.certifications,
                                { id: `cert-${Date.now()}`, name: '', issuer: '', date: '' },
                              ],
                            })
                          }
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          + Add Certification
                        </button>
                      </div>
                      {draft.certifications.map((c, idx) => (
                        <div key={c.id} className="grid grid-cols-12 gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Certification Name"
                            value={c.name}
                            onChange={(e) => {
                              const next = [...draft.certifications];
                              next[idx] = { ...c, name: e.target.value };
                              setDraft({ ...draft, certifications: next });
                            }}
                            className="col-span-5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-2.5 py-1.5"
                          />
                          <input
                            type="text"
                            placeholder="Issuer"
                            value={c.issuer}
                            onChange={(e) => {
                              const next = [...draft.certifications];
                              next[idx] = { ...c, issuer: e.target.value };
                              setDraft({ ...draft, certifications: next });
                            }}
                            className="col-span-4 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-2.5 py-1.5"
                          />
                          <input
                            type="text"
                            placeholder="Year"
                            value={c.date}
                            onChange={(e) => {
                              const next = [...draft.certifications];
                              next[idx] = { ...c, date: e.target.value };
                              setDraft({ ...draft, certifications: next });
                            }}
                            className="col-span-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-2.5 py-1.5"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                certifications: draft.certifications.filter((x) => x.id !== c.id),
                              })
                            }
                            className="col-span-1 text-rose-500 justify-self-end"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Achievements</span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              achievements: [
                                ...draft.achievements,
                                { id: `ach-${Date.now()}`, title: '', description: '' },
                              ],
                            })
                          }
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          + Add Achievement
                        </button>
                      </div>
                      {draft.achievements.map((a, idx) => (
                        <div key={a.id} className="grid grid-cols-12 gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Title"
                            value={a.title}
                            onChange={(e) => {
                              const next = [...draft.achievements];
                              next[idx] = { ...a, title: e.target.value };
                              setDraft({ ...draft, achievements: next });
                            }}
                            className="col-span-4 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-2.5 py-1.5"
                          />
                          <input
                            type="text"
                            placeholder="Details"
                            value={a.description}
                            onChange={(e) => {
                              const next = [...draft.achievements];
                              next[idx] = { ...a, description: e.target.value };
                              setDraft({ ...draft, achievements: next });
                            }}
                            className="col-span-7 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-2.5 py-1.5"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                achievements: draft.achievements.filter((x) => x.id !== a.id),
                              })
                            }
                            className="col-span-1 text-rose-500 justify-self-end"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Languages</span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              languages: [
                                ...draft.languages,
                                { id: `lang-${Date.now()}`, language: '', proficiency: '' },
                              ],
                            })
                          }
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          + Add Language
                        </button>
                      </div>
                      {draft.languages.map((l, idx) => (
                        <div key={l.id} className="grid grid-cols-12 gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Language"
                            value={l.language}
                            onChange={(e) => {
                              const next = [...draft.languages];
                              next[idx] = { ...l, language: e.target.value };
                              setDraft({ ...draft, languages: next });
                            }}
                            className="col-span-5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-2.5 py-1.5"
                          />
                          <input
                            type="text"
                            placeholder="Proficiency (e.g., Native, Fluent)"
                            value={l.proficiency}
                            onChange={(e) => {
                              const next = [...draft.languages];
                              next[idx] = { ...l, proficiency: e.target.value };
                              setDraft({ ...draft, languages: next });
                            }}
                            className="col-span-6 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-2.5 py-1.5"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                languages: draft.languages.filter((x) => x.id !== l.id),
                              })
                            }
                            className="col-span-1 text-rose-500 justify-self-end"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Custom Sections</span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              customSections: [
                                ...draft.customSections,
                                { id: `cs-${Date.now()}`, title: 'Volunteer Work', items: [''] },
                              ],
                            })
                          }
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          + Add Custom Section
                        </button>
                      </div>
                      {draft.customSections.map((cs, idx) => (
                        <div key={cs.id} className="space-y-2 mb-3 rounded border border-slate-200 dark:border-slate-800 p-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Section Heading"
                              value={cs.title}
                              onChange={(e) => {
                                const next = [...draft.customSections];
                                next[idx] = { ...cs, title: e.target.value };
                                setDraft({ ...draft, customSections: next });
                              }}
                              className="flex-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-2.5 py-1.5"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setDraft({
                                  ...draft,
                                  customSections: draft.customSections.filter((x) => x.id !== cs.id),
                                })
                              }
                              className="text-rose-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            placeholder="One bullet item per line..."
                            value={cs.items.join('\n')}
                            onChange={(e) => {
                              const next = [...draft.customSections];
                              next[idx] = { ...cs, items: e.target.value.split('\n') };
                              setDraft({ ...draft, customSections: next });
                            }}
                            className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white p-2"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>

          {/* Right Live Preview */}
          <div className="xl:col-span-6 xl:sticky xl:top-20">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 no-print">
              <span>Live Template Preview ({RESUME_TEMPLATES.find((t) => t.id === draft.templateId)?.name})</span>
              <span className="font-mono">v{draft.version}</span>
            </div>
            <ResumePreview data={draft} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) handleDeleteSaved(confirmDeleteId);
        }}
        title="Delete Resume Draft"
        message="This will permanently remove this saved resume draft from your browser's IndexedDB."
        confirmLabel="Delete Draft"
        destructive
      />
    </WorkspaceLayout>
  );
}
