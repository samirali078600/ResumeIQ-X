import type { ResumeAnalysisRecord } from '../types/resume';

export interface CareerRoleTrack {
  id: string;
  title: string;
  category: string;
  coreSkills: string[];
  recommendedSkills: string[];
  projectIdeas: { title: string; outcome: string; skillsUsed: string[] }[];
}

export const CAREER_ROLE_TRACKS: CareerRoleTrack[] = [
  {
    id: 'frontend-engineer',
    title: 'Frontend Engineer',
    category: 'Software Engineering',
    coreSkills: ['TypeScript', 'JavaScript', 'React', 'HTML5', 'CSS3', 'Tailwind CSS', 'Git', 'Responsive Design'],
    recommendedSkills: ['Next.js', 'Web Accessibility', 'Vitest', 'Playwright', 'Performance Optimization', 'REST APIs'],
    projectIdeas: [
      {
        title: 'Accessible Design System & Component Library',
        outcome: 'Demonstrates WCAG AA keyboard accessibility, component API design, and automated visual/unit tests.',
        skillsUsed: ['TypeScript', 'React', 'Web Accessibility', 'Vitest'],
      },
      {
        title: 'Real-Time Analytics Dashboard with Virtualized Tables',
        outcome: 'Proves state management, bundle splitting, and Core Web Vitals performance optimization.',
        skillsUsed: ['React', 'Performance Optimization', 'Data Visualization'],
      },
    ],
  },
  {
    id: 'fullstack-developer',
    title: 'Full-Stack Software Engineer',
    category: 'Software Engineering',
    coreSkills: ['TypeScript', 'JavaScript', 'React', 'Node.js', 'SQL', 'PostgreSQL', 'REST APIs', 'Git'],
    recommendedSkills: ['Next.js', 'Docker', 'CI/CD', 'Redis', 'Authentication', 'Unit Testing'],
    projectIdeas: [
      {
        title: 'Multi-Tenant SaaS Workflow Platform',
        outcome: 'Evidences end-to-end API design, relational schema modeling, authentication, and CI/CD deployment.',
        skillsUsed: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
      },
    ],
  },
  {
    id: 'backend-engineer',
    title: 'Backend Engineer',
    category: 'Software Engineering',
    coreSkills: ['Node.js', 'Python', 'SQL', 'PostgreSQL', 'REST APIs', 'Docker', 'Git', 'System Design'],
    recommendedSkills: ['Go', 'Redis', 'Microservices', 'Message Queues', 'Kubernetes', 'AWS'],
    projectIdeas: [
      {
        title: 'High-Throughput Event Ingestion & Worker Pipeline',
        outcome: 'Showcases idempotency, queue backpressure handling, database indexing, and observability.',
        skillsUsed: ['PostgreSQL', 'Redis', 'Message Queues', 'Docker'],
      },
    ],
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist / ML Practitioner',
    category: 'Data & Analytics',
    coreSkills: ['Python', 'SQL', 'Pandas', 'NumPy', 'Scikit-learn', 'Machine Learning', 'Statistical Analysis'],
    recommendedSkills: ['PyTorch', 'Natural Language Processing', 'Data Visualization', 'ETL Pipelines', 'Docker'],
    projectIdeas: [
      {
        title: 'End-to-End Churn Prediction & Feature Importance Pipeline',
        outcome: 'Proves rigorous cross-validation, feature engineering, baseline comparisons, and business interpretability.',
        skillsUsed: ['Python', 'Pandas', 'Scikit-learn', 'Statistical Analysis'],
      },
    ],
  },
  {
    id: 'data-analyst',
    title: 'Data & Business Intelligence Analyst',
    category: 'Data & Analytics',
    coreSkills: ['SQL', 'Python', 'Data Visualization', 'Statistical Analysis', 'Pandas', 'Communication'],
    recommendedSkills: ['ETL Pipelines', 'PostgreSQL', 'Stakeholder Management', 'Technical Writing'],
    projectIdeas: [
      {
        title: 'Executive Revenue Cohort & Funnel Attribution Model',
        outcome: 'Demonstrates SQL window functions, cohort retention analysis, and clear executive storytelling.',
        skillsUsed: ['SQL', 'Data Visualization', 'Statistical Analysis'],
      },
    ],
  },
  {
    id: 'devops-cloud',
    title: 'DevOps / Cloud Platform Engineer',
    category: 'Infrastructure',
    coreSkills: ['Docker', 'Kubernetes', 'Linux', 'CI/CD', 'Terraform', 'AWS', 'Git'],
    recommendedSkills: ['Google Cloud Platform', 'Prometheus', 'Nginx', 'Python', 'Bash', 'Network Security'],
    projectIdeas: [
      {
        title: 'Zero-Downtime Terraform + Kubernetes Cluster Blueprint',
        outcome: 'Demonstrates repeatable Infrastructure-as-Code, automated rollbacks, and Prometheus alerting.',
        skillsUsed: ['Terraform', 'Kubernetes', 'CI/CD', 'Prometheus'],
      },
    ],
  },
  {
    id: 'cybersecurity-analyst',
    title: 'Cybersecurity / AppSec Engineer',
    category: 'Security',
    coreSkills: ['Application Security', 'Network Security', 'Linux', 'IAM', 'Cryptography', 'Python'],
    recommendedSkills: ['Penetration Testing', 'SIEM', 'SOC 2', 'Docker', 'Authentication'],
    projectIdeas: [
      {
        title: 'Automated OWASP Dependency & Secret Scanner in CI',
        outcome: 'Shows practical vulnerability remediation, threat modeling, and DevSecOps integration.',
        skillsUsed: ['Application Security', 'CI/CD', 'Python'],
      },
    ],
  },
  {
    id: 'ui-ux-designer',
    title: 'Product / UI-UX Designer',
    category: 'Design',
    coreSkills: ['Figma', 'UI/UX Design', 'Wireframing', 'Design Systems', 'User Research', 'Responsive Design'],
    recommendedSkills: ['Web Accessibility', 'HTML5', 'CSS3', 'Cross-functional Collaboration'],
    projectIdeas: [
      {
        title: 'Multi-Platform Design Token & Accessibility Audit',
        outcome: 'Demonstrates systems thinking, WCAG contrast validation, and developer handoff precision.',
        skillsUsed: ['Figma', 'Design Systems', 'Web Accessibility'],
      },
    ],
  },
  {
    id: 'qa-automation',
    title: 'QA & Test Automation Engineer',
    category: 'Quality Engineering',
    coreSkills: ['Playwright', 'Cypress', 'Jest', 'Integration Testing', 'Unit Testing', 'JavaScript', 'CI/CD'],
    recommendedSkills: ['TypeScript', 'Python', 'Pytest', 'Postman', 'Performance Optimization'],
    projectIdeas: [
      {
        title: 'Cross-Browser E2E & API Contract Regression Suite',
        outcome: 'Proves flaky-test elimination, parallel CI execution, and contract test coverage.',
        skillsUsed: ['Playwright', 'Postman', 'CI/CD'],
      },
    ],
  },
  {
    id: 'technical-pm',
    title: 'Technical Product Manager',
    category: 'Product & Leadership',
    coreSkills: ['Project Management', 'Agile / Scrum', 'Stakeholder Management', 'Cross-functional Collaboration', 'Strategic Planning'],
    recommendedSkills: ['SQL', 'Data Visualization', 'User Research', 'Technical Writing', 'REST APIs'],
    projectIdeas: [
      {
        title: 'Data-Backed Product Discovery & Prioritization Case Study',
        outcome: 'Evidences structured user research, metric-driven roadmap tradeoffs, and engineering alignment.',
        skillsUsed: ['Strategic Planning', 'User Research', 'Data Visualization'],
      },
    ],
  },
];

export interface RoleReadinessEvaluation {
  role: CareerRoleTrack;
  readinessScore: number;
  readinessTier: 'Strong Alignment' | 'Developing Fit' | 'Early Transition';
  matchedCoreSkills: string[];
  matchedRecommendedSkills: string[];
  missingCoreSkills: string[];
  missingRecommendedSkills: string[];
  evidenceSummary: string[];
  improvementPriorities: string[];
}

export function evaluateCareerReadiness(analysis: ResumeAnalysisRecord): RoleReadinessEvaluation[] {
  const resumeSkillMap = new Map(
    analysis.nlp.skills.found.map((s) => [s.name, s])
  );

  const evaluations: RoleReadinessEvaluation[] = CAREER_ROLE_TRACKS.map((role) => {
    const matchedCoreSkills = role.coreSkills.filter((s) => resumeSkillMap.has(s));
    const missingCoreSkills = role.coreSkills.filter((s) => !resumeSkillMap.has(s));
    const matchedRecommendedSkills = role.recommendedSkills.filter((s) => resumeSkillMap.has(s));
    const missingRecommendedSkills = role.recommendedSkills.filter((s) => !resumeSkillMap.has(s));

    const coreRatio = role.coreSkills.length > 0 ? matchedCoreSkills.length / role.coreSkills.length : 0;
    const recRatio =
      role.recommendedSkills.length > 0
        ? matchedRecommendedSkills.length / role.recommendedSkills.length
        : 0;

    // Bonus only for skills backed by experience or projects
    const evidencedMatched = [...matchedCoreSkills, ...matchedRecommendedSkills].filter(
      (name) => resumeSkillMap.get(name)?.hasEvidence
    );
    const totalMatched = matchedCoreSkills.length + matchedRecommendedSkills.length;
    const evidenceRatio = totalMatched > 0 ? evidencedMatched.length / totalMatched : 0;

    const readinessScore = Math.min(
      100,
      Math.round(coreRatio * 62 + recRatio * 23 + evidenceRatio * 15)
    );

    let readinessTier: RoleReadinessEvaluation['readinessTier'] = 'Early Transition';
    if (readinessScore >= 65) readinessTier = 'Strong Alignment';
    else if (readinessScore >= 38) readinessTier = 'Developing Fit';

    const evidenceSummary: string[] = [];
    if (matchedCoreSkills.length > 0) {
      evidenceSummary.push(
        `Matched ${matchedCoreSkills.length}/${role.coreSkills.length} core skills: ${matchedCoreSkills.join(', ')}.`
      );
    } else {
      evidenceSummary.push('No core dictionary skills for this track were detected in the resume.');
    }

    if (evidencedMatched.length > 0) {
      evidenceSummary.push(
        `${evidencedMatched.length} matched skills appear in Experience, Projects, or Summary context.`
      );
    }

    const titleMatches = analysis.nlp.entities.jobTitles.filter((t) =>
      role.title.toLowerCase().split(' ').some((w) => w.length > 3 && t.value.toLowerCase().includes(w))
    );
    if (titleMatches.length > 0) {
      evidenceSummary.push(
        `Detected overlapping role title(s): ${titleMatches.map((t) => t.value).join(', ')}.`
      );
    }

    const improvementPriorities: string[] = [];
    if (missingCoreSkills.length > 0) {
      improvementPriorities.push(
        `Priority 1 (Core Foundations): Build demonstrable experience with ${missingCoreSkills.slice(0, 4).join(', ')}.`
      );
    }
    if (totalMatched > evidencedMatched.length) {
      improvementPriorities.push(
        'Priority 2 (Evidence): Move listed skills into quantified Experience or Project bullets.'
      );
    }
    if (missingRecommendedSkills.length > 0) {
      improvementPriorities.push(
        `Priority 3 (Differentiators): Add ${missingRecommendedSkills.slice(0, 3).join(', ')} to deepen role competitiveness.`
      );
    }

    return {
      role,
      readinessScore,
      readinessTier,
      matchedCoreSkills,
      matchedRecommendedSkills,
      missingCoreSkills,
      missingRecommendedSkills,
      evidenceSummary,
      improvementPriorities,
    };
  });

  evaluations.sort((a, b) => b.readinessScore - a.readinessScore);
  return evaluations;
}
