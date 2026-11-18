import {
  BarChart3,
  Briefcase,
  Compass,
  FileCheck2,
  FileSpreadsheet,
  GitCompare,
  History,
  Home,
  Info,
  LayoutDashboard,
  Mail,
  Microscope,
  Settings,
  ShieldCheck,
  Target,
  User,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  group: 'Overview' | 'Intelligence' | 'Records' | 'System';
}

export const WORKSPACE_NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: Home, group: 'Overview' },
  { to: '/workspace', label: 'Workspace', icon: LayoutDashboard, group: 'Overview' },
  { to: '/analyzer', label: 'Resume Analyzer', icon: FileCheck2, group: 'Overview' },

  { to: '/job-matching', label: 'Resume vs Job Match', icon: Briefcase, group: 'Intelligence' },
  { to: '/ats-intelligence', label: 'ATS Intelligence', icon: ShieldCheck, group: 'Intelligence' },
  { to: '/nlp-laboratory', label: 'NLP Laboratory', icon: Microscope, group: 'Intelligence' },
  { to: '/skills-gap', label: 'Skills Gap', icon: Target, group: 'Intelligence' },
  { to: '/career-intelligence', label: 'Career Intelligence', icon: Compass, group: 'Intelligence' },
  { to: '/resume-comparison', label: 'Compare Resumes', icon: GitCompare, group: 'Intelligence' },

  { to: '/analysis-history', label: 'Analysis History', icon: History, group: 'Records' },
  { to: '/reports', label: 'Reports Center', icon: FileSpreadsheet, group: 'Records' },

  { to: '/profile', label: 'Local Profile', icon: User, group: 'System' },
  { to: '/settings', label: 'Settings', icon: Settings, group: 'System' },
  { to: '/about', label: 'About & Guide', icon: Info, group: 'System' },
  { to: '/contact', label: 'Contact', icon: Mail, group: 'System' },
];

export const NAV_GROUPS: NavItem['group'][] = [
  'Overview',
  'Intelligence',
  'Records',
  'System',
];

export const ROUTE_TITLES: Record<string, string> = {
  '/workspace': 'Workspace Dashboard',
  '/analyzer': 'Resume Intelligence & Job Compatibility',
  '/ats-intelligence': 'ATS Intelligence',
  '/nlp-laboratory': 'NLP Laboratory',
  '/job-matching': 'Resume vs. Job Comparison',
  '/career-intelligence': 'Career Intelligence',
  '/skills-gap': 'Skills Gap Analysis',
  '/resume-comparison': 'Compare Multiple Resumes',
  '/analysis-history': 'Analysis History',
  '/reports': 'Reports Center',
  '/profile': 'Local User Profile',
  '/settings': 'Application Settings',
  '/about': 'About & Feature Guide',
  '/contact': 'Contact & Support',
};

export { BarChart3 };
