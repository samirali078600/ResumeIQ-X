import type { BuilderSectionKey, ResumeBuilderData, TemplateId } from '../types/resume';

export interface TemplateMetadata {
  id: TemplateId;
  name: string;
  audience: string;
  description: string;
  recommendedFont: 'sans' | 'serif' | 'mono';
  defaultAccent: string;
}

export const RESUME_TEMPLATES: TemplateMetadata[] = [
  {
    id: 'modern-professional',
    name: 'Modern Professional',
    audience: 'Product, Engineering & Operations',
    description: 'Balanced two-column header with crisp indigo rule dividers and structured bullet hierarchy.',
    recommendedFont: 'sans',
    defaultAccent: '#4F46E5',
  },
  {
    id: 'minimal-ats',
    name: 'Minimal ATS',
    audience: 'High-Compliance Enterprise ATS',
    description: 'Single-column linear layout with maximum parser legibility and zero visual distractions.',
    recommendedFont: 'sans',
    defaultAccent: '#1E293B',
  },
  {
    id: 'classic-corporate',
    name: 'Classic Corporate',
    audience: 'Finance, Consulting & Executive',
    description: 'Centered editorial masthead with traditional serif styling and formal section rules.',
    recommendedFont: 'serif',
    defaultAccent: '#0F172A',
  },
  {
    id: 'technical-developer',
    name: 'Technical Developer',
    audience: 'Software, Data & Cloud Engineers',
    description: 'Skills-forward architecture emphasizing technical stack, projects, and quantified engineering metrics.',
    recommendedFont: 'mono',
    defaultAccent: '#4338CA',
  },
  {
    id: 'fresh-graduate',
    name: 'Fresh Graduate',
    audience: 'University Graduates & Early Career',
    description: 'Highlights education, academic projects, and core skills before early work or internship history.',
    recommendedFont: 'sans',
    defaultAccent: '#6366F1',
  },
  {
    id: 'creative-professional',
    name: 'Creative Professional',
    audience: 'Design, Content & Brand Strategy',
    description: 'Asymmetric masthead accent bar with generous whitespace and expressive typographic rhythm.',
    recommendedFont: 'sans',
    defaultAccent: '#7C3AED',
  },
];

export const DEFAULT_SECTION_ORDER: BuilderSectionKey[] = [
  'summary',
  'experience',
  'skills',
  'projects',
  'education',
  'certifications',
  'achievements',
  'languages',
  'custom',
];

export const SECTION_LABELS: Record<BuilderSectionKey, string> = {
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  achievements: 'Achievements',
  languages: 'Languages',
  custom: 'Custom Sections',
};

export function createEmptyResumeDraft(templateId: TemplateId = 'modern-professional'): ResumeBuilderData {
  const tmpl = RESUME_TEMPLATES.find((t) => t.id === templateId) || RESUME_TEMPLATES[0];
  const order: BuilderSectionKey[] =
    templateId === 'fresh-graduate'
      ? ['summary', 'education', 'projects', 'skills', 'experience', 'certifications', 'achievements', 'languages', 'custom']
      : templateId === 'technical-developer'
        ? ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements', 'languages', 'custom']
        : [...DEFAULT_SECTION_ORDER];

  const now = new Date().toISOString();
  return {
    id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: 'Untitled Resume Draft',
    templateId,
    fontFamily: tmpl.recommendedFont,
    accentColor: tmpl.defaultAccent,
    pageMargin: 'standard',
    sectionOrder: order,
    personal: {
      fullName: '',
      headline: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: [
      { id: 'sg-1', category: 'Core Skills', items: [] },
    ],
    projects: [],
    certifications: [],
    achievements: [],
    languages: [],
    customSections: [],
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}
