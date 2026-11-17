import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { ResumePreview } from '../components/builder/ResumePreview';
import { createEmptyResumeDraft, RESUME_TEMPLATES } from '../utils/builderDefaults';
import { useAppStore } from '../store/useAppStore';
import type { ResumeBuilderData, TemplateId } from '../types/resume';

export default function TemplatesGallery() {
  const resumes = useAppStore((s) => s.resumes);
  const [previewTemplateId, setPreviewTemplateId] = useState<TemplateId | null>(null);

  const buildPreviewData = (templateId: TemplateId): ResumeBuilderData => {
    const tmpl = RESUME_TEMPLATES.find((t) => t.id === templateId)!;
    if (resumes.length > 0) {
      return {
        ...resumes[0],
        templateId,
        fontFamily: tmpl.recommendedFont,
        accentColor: tmpl.defaultAccent,
      };
    }
    const base = createEmptyResumeDraft(templateId);
    base.personal = {
      fullName: '[Your Full Name]',
      headline: `${tmpl.name} Layout Preview`,
      email: '[your.email@domain.com]',
      phone: '[Phone Number]',
      location: '[City, State]',
      linkedin: '[linkedin.com/in/your-handle]',
      website: '[portfolio-url]',
    };
    base.summary =
      'Layout demonstration showing spacing, section dividers, and typography hierarchy. Enter your own verified career history inside the Resume Builder.';
    base.experience = [
      {
        id: 'spec-1',
        role: '[Role Title]',
        company: '[Organization Name]',
        location: '[City, State]',
        startDate: '[Start Date]',
        endDate: '[End Date]',
        current: false,
        bullets: [
          'Achievement statement demonstrating bullet spacing and indentation.',
          'Quantified outcome statement illustrating right-aligned date alignment.',
        ],
      },
    ];
    base.skills = [
      { id: 'spec-sk', category: 'Core Competencies', items: ['[Skill 1]', '[Skill 2]', '[Skill 3]'] },
    ];
    base.education = [
      {
        id: 'spec-ed',
        degree: '[Degree & Major]',
        institution: '[University / Institution]',
        location: '[City, State]',
        graduationDate: '[Year]',
        gpaOrHonors: '',
      },
    ];
    return base;
  };

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Resume Templates
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Select a layout to launch directly in the Resume Builder with live preview and PDF export.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {RESUME_TEMPLATES.map((tmpl) => (
            <Card key={tmpl.id} className="flex flex-col justify-between">
              <div>
                <div
                  className="h-2 w-full rounded-t-md mb-4"
                  style={{ backgroundColor: tmpl.defaultAccent }}
                />
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {tmpl.audience}
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-white">
                  {tmpl.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {tmpl.description}
                </p>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Default typography: {tmpl.recommendedFont.toUpperCase()}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewTemplateId(tmpl.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview</span>
                </button>
                <Link
                  to={`/resume-builder?template=${tmpl.id}`}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap"
                >
                  Use This Template
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal
        open={Boolean(previewTemplateId)}
        onClose={() => setPreviewTemplateId(null)}
        title={
          previewTemplateId
            ? `${RESUME_TEMPLATES.find((t) => t.id === previewTemplateId)?.name} Preview`
            : 'Template Preview'
        }
        description={
          resumes.length > 0
            ? 'Rendering your latest saved resume draft with this template.'
            : 'Showing structural layout specimen. Fill in your details inside the Resume Builder.'
        }
        maxWidth="xl"
      >
        {previewTemplateId && (
          <div className="space-y-4">
            <ResumePreview data={buildPreviewData(previewTemplateId)} />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreviewTemplateId(null)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-medium"
              >
                Close
              </button>
              <Link
                to={`/resume-builder?template=${previewTemplateId}`}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white"
              >
                Open in Resume Builder
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </WorkspaceLayout>
  );
}
