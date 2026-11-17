import {
  BarChart3,
  Briefcase,
  Compass,
  FileCheck2,
  FilePlus2,
  FileSpreadsheet,
  GitCompare,
  History,
  Home,
  Info,
  LayoutDashboard,
  LayoutTemplate,
  Mail,
  Microscope,
  PenTool,
  Settings,
  ShieldCheck,
  Target,
  User,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  group: 'Overview' | 'Intelligence' | 'Authoring' | 'Records' | 'System';
}

export const WORKSPACE_NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: Home, group: 'Overview' },
  { to: '/workspace', label: 'Workspace', icon: LayoutDashboard, group: 'Overview' },
  { to: '/analyzer', label: 'Resume Analyzer', icon: FileCheck2, group: 'Overview' },

  { to: '/ats-intelligence', label: 'ATS Intelligence', icon: ShieldCheck, group: 'Intelligence' },
  { to: '/nlp-laboratory', label: 'NLP Laboratory', icon: Microscope, group: 'Intelligence' },
  { to: '/job-matching', label: 'Job Matching', icon: Briefcase, group: 'Intelligence' },
  { to: '/career-intelligence', label: 'Career Intelligence', icon: Compass, group: 'Intelligence' },
  { to: '/skills-gap', label: 'Skills Gap', icon: Target, group: 'Intelligence' },
  { to: '/resume-comparison', label: 'Compare Resumes', icon: GitCompare, group: 'Intelligence' },

  { to: '/resume-builder', label: 'Resume Builder', icon: FilePlus2, group: 'Authoring' },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate, group: 'Authoring' },
  { to: '/cover-letter-studio', label: 'Cover Letter Studio', icon: PenTool, group: 'Authoring' },

  { to: '/analysis-history', label: 'Analysis History', icon: History, group: 'Records' },
  { to: '/reports', label: 'Reports Center', icon: FileSpreadsheet, group: 'Records' },

  { to: '/profile', label: 'Local Profile', icon: User, group: 'System' },
  { to: '/settings', label: 'Settings', icon: Settings, group: 'System' },
  { to: '/about', label: 'About', icon: Info, group: 'System' },
  { to: '/contact', label: 'Contact', icon: Mail, group: 'System' },
];

export const NAV_GROUPS: NavItem['group'][] = [
  'Overview',
  'Intelligence',
  'Authoring',
  'Records',
  'System',
];

export const ROUTE_TITLES: Record<string, string> = {
  '/workspace': 'Workspace Dashboard',
  '/analyzer': 'Resume Analyzer',
  '/ats-intelligence': 'ATS Intelligence',
  '/nlp-laboratory': 'NLP Laboratory',
  '/job-matching': 'Job Description Matching',
  '/resume-builder': 'Resume Builder',
  '/templates': 'Resume Templates',
  '/cover-letter-studio': 'Cover Letter Studio',
  '/career-intelligence': 'Career Intelligence',
  '/skills-gap': 'Skills Gap Analysis',
  '/resume-comparison': 'Resume Comparison',
  '/analysis-history': 'Analysis History',
  '/reports': 'Reports Center',
  '/profile': 'Local User Profile',
  '/settings': 'Application Settings',
  '/about': 'About ResumeIQ X',
  '/contact': 'Contact & Support',
};

export { BarChart3 };
