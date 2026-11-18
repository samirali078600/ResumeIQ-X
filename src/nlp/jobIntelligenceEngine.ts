import { DEFAULT_SKILLS_DICTIONARY } from './skillsDictionary';
import {
  analyzeSkills,
  computeTfIdfCosineSimilarity,
  STOPWORDS,
  stemWord,
  tokenizeWords,
} from './classicalNlp';
import type {
  CustomSkillEntry,
  JobMatchResult,
  ResumeAnalysisRecord,
  SkillCategory,
} from '../types/resume';

export type RequirementStatus =
  | 'found-evidenced'
  | 'mentioned-no-evidence'
  | 'partially-matched'
  | 'alternative-satisfied'
  | 'missing'
  | 'not-applicable';

export type JobRequirementBucket =
  | 'Mandatory Technical Skills'
  | 'Preferred Technical Skills'
  | 'Programming Languages'
  | 'Frameworks and Libraries'
  | 'Database Requirements'
  | 'Tools and Technologies'
  | 'Education Requirements'
  | 'Experience Requirements'
  | 'Professional Responsibilities'
  | 'Soft Skills'
  | 'Certifications'
  | 'Domain Knowledge'
  | 'Additional Eligibility Conditions';

export interface CategorizedJobRequirement {
  id: string;
  name: string;
  bucket: JobRequirementBucket;
  requirementType: 'required' | 'preferred';
  importance: 'critical' | 'high' | 'medium';
  status: RequirementStatus;
  evidenceSnippet?: string;
  alternativesGroup?: string;
  reason: string;
}

export type ExistingSkillDisplayCategory =
  | 'Programming Languages'
  | 'Frontend Development'
  | 'Backend Development'
  | 'Frameworks and Libraries'
  | 'Databases'
  | 'Cloud Technologies'
  | 'DevOps'
  | 'Testing Tools'
  | 'Developer Tools'
  | 'Computer Science Fundamentals'
  | 'Soft Skills'
  | 'Domain-Specific Skills';

export interface ExistingSkillIntelItem {
  name: string;
  category: ExistingSkillDisplayCategory;
  rawCategory: SkillCategory;
  count: number;
  requiredByJob: 'Required' | 'Preferred' | 'Not Listed in JD' | 'No JD Supplied';
  sectionsAppearing: string[];
  evidenceSnippet?: string;
  matchStatus:
    | 'Demonstrated in Experience/Projects'
    | 'Summary Context Only'
    | 'Mentioned Without Evidence';
}

export type GapBucket =
  | 'Critical Missing Skills'
  | 'High-Priority Skill Gaps'
  | 'Important Preferred Skills'
  | 'Partially Matched Skills'
  | 'Missing Practical Experience'
  | 'Skills Mentioned Without Evidence';

export interface SkillGapDetail {
  id: string;
  bucket: GapBucket;
  skillOrRequirement: string;
  whyJobRequiresIt: string;
  requirementStatus: 'Required' | 'Preferred' | 'Weak Evidence' | 'Experience Depth';
  priority: 'Critical' | 'High' | 'Medium';
  relatedSkillsInResume: string[];
  whatToLearn: string[];
  practicalExercises: string[];
  recommendedProject: string;
  howToDemonstrateInResume: string;
  estimatedDuration: string;
}

export interface CompatibilityDimension {
  key: string;
  title: string;
  score: number;
  matched: string[];
  partial: string[];
  missing: string[];
  evidence: string[];
  reasoning: string;
}

export interface QualityAuditItem {
  id: string;
  dimension: string;
  score: number;
  severity: 'pass' | 'low' | 'medium' | 'high';
  explanation: string;
  suggestedCorrection: string;
}

export interface ImprovementCoachRecommendation {
  id: string;
  section: string;
  currentIssue: string;
  whyItMatters: string;
  recommendedImprovement: string;
  exampleRevisedWording: string;
}

export interface RecommendedProjectItem {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  technologies: string[];
  skillsDemonstrated: string[];
  mainFeatures: string[];
  developmentSteps: string[];
  expectedOutcomes: string[];
  resumeTemplate: string;
}

export interface RoadmapPhase {
  id: string;
  phaseLabel: 'First 7 Days' | '30-Day Learning Plan' | '60-Day Practical Development Plan' | '90-Day Career Preparation Plan';
  durationNote: string;
  skillsToLearn: string[];
  topicsToCover: string[];
  practicalExercises: string[];
  projectMilestones: string[];
  revisionTasks: string[];
  portfolioEvidence: string;
}

export interface InterviewPrepQuestion {
  id: string;
  category:
    | 'Technical Questions'
    | 'Programming Questions'
    | 'Database Questions'
    | 'Framework Questions'
    | 'Project-Based Questions'
    | 'Resume-Based Questions'
    | 'HR Questions'
    | 'Scenario-Based Questions';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  question: string;
  sourceBasis: string;
  prepGuidance: string;
}

export interface ConsistencyWarning {
  id: string;
  type: 'company-mismatch' | 'title-mismatch';
  title: string;
  message: string;
}

export interface ResumeJobIntelligenceReport {
  hasJobDescription: boolean;
  consistencyWarnings: ConsistencyWarning[];
  executiveOverview: {
    resumeQualityScore: number;
    jobCompatibilityScore: number | null;
    requiredSkillCoverage: number | null;
    preferredSkillCoverage: number | null;
    identifiedTechnicalSkills: number;
    missingJobRequirements: number | null;
  };
  requirements: CategorizedJobRequirement[];
  existingSkills: ExistingSkillIntelItem[];
  skillGaps: SkillGapDetail[];
  compatibilityDimensions: CompatibilityDimension[];
  qualityAudit: QualityAuditItem[];
  improvementRecommendations: ImprovementCoachRecommendation[];
  projectRecommendations: RecommendedProjectItem[];
  learningRoadmap: RoadmapPhase[];
  interviewPrep: InterviewPrepQuestion[];
  finalActionPlan: {
    strongestAreas: string[];
    bestJobMatches: string[];
    criticalSkillGaps: string[];
    importantResumeIssues: string[];
    missingPracticalExperience: string[];
    recommendedProjects: string[];
    learningPriorities: string[];
    interviewPriorities: string[];
    immediateNextSteps: string[];
  };
}

interface SkillGuideSpec {
  why: string;
  topics: string[];
  exercises: string[];
  project: string;
  resumeFraming: string;
  duration: string;
}

const SKILL_KNOWLEDGE_BASE: Record<string, SkillGuideSpec> = {
  Python: {
    why: 'Core scripting, backend service development, automation, and data workflows.',
    topics: ['Data structures & comprehension idioms', 'Virtual environments & packaging', 'Async I/O & error handling', 'Unit testing with pytest'],
    exercises: ['Build a CLI parser that cleans CSV/JSON logs', 'Write 15 pytest unit tests with parametrize fixtures'],
    project: 'RESTful Task & Data Ingestion Service with FastAPI/Flask and automated tests',
    resumeFraming: 'Developed Python services for [specific task], verified with pytest coverage ([X]% or [N] test cases).',
    duration: 'Estimate: 2–3 weeks (intermediate practice)',
  },
  TypeScript: {
    why: 'Provides compile-time type safety across large frontend and Node.js codebases.',
    topics: ['Discriminated unions & generics', 'Strict null checks & type narrowing', 'API schema validation (Zod)'],
    exercises: ['Migrate a plain JS module to strict TypeScript with zero `any` types', 'Model discriminated API state transitions'],
    project: 'Strongly Typed Dashboard Client with Shared Schema Contracts',
    resumeFraming: 'Authored strict TypeScript modules across [module/app], preventing runtime contract mismatches.',
    duration: 'Estimate: 1–2 weeks (for JS developers)',
  },
  React: {
    why: 'Standard component architecture for interactive single-page web interfaces.',
    topics: ['Hooks lifecycle & custom hooks', 'State synchronization & memoization', 'Accessible forms & keyboard navigation'],
    exercises: ['Implement a filterable, keyboard-accessible data table', 'Refactor prop drilling using clean state boundaries'],
    project: 'Interactive Analytics & Filterable Workspace SPA',
    resumeFraming: 'Built reusable React components for [workflow], supporting [measurable UX or scale metric].',
    duration: 'Estimate: 2–3 weeks',
  },
  Django: {
    why: 'Batteries-included Python web framework for structured APIs, auth, and ORM models.',
    topics: ['Django ORM migrations & query optimization', 'Django REST Framework serializers & permissions', 'Middleware & auth flows'],
    exercises: ['Design multi-model relational migrations with select_related', 'Build role-protected DRF endpoints'],
    project: 'Multi-Role Issue & Workflow Tracker with Django REST Framework',
    resumeFraming: 'Engineered Django backend endpoints and ORM queries handling [entity/workflow].',
    duration: 'Estimate: 2–3 weeks (with Python foundation)',
  },
  FastAPI: {
    why: 'High-throughput Python API framework with automatic OpenAPI docs and Pydantic validation.',
    topics: ['Pydantic v2 models & validation', 'Dependency injection', 'Async database sessions'],
    exercises: ['Build validated CRUD endpoints with Swagger docs', 'Write async integration tests with TestClient'],
    project: 'Async Document Indexing & Search API in FastAPI',
    resumeFraming: 'Built FastAPI REST services with Pydantic validation and automated OpenAPI schemas.',
    duration: 'Estimate: 1–2 weeks (with Python foundation)',
  },
  Flask: {
    why: 'Lightweight Python micro-framework for modular APIs and internal tooling.',
    topics: ['Blueprints & application factory pattern', 'SQLAlchemy integration', 'Request validation & error handlers'],
    exercises: ['Structure a multi-blueprint Flask API with pytest coverage'],
    project: 'Lightweight Webhook & Job Queue Microservice in Flask',
    resumeFraming: 'Implemented modular Flask REST endpoints using SQLAlchemy and application factories.',
    duration: 'Estimate: 1–2 weeks',
  },
  PostgreSQL: {
    why: 'Production relational database for transactional integrity, indexing, and complex queries.',
    topics: ['Schema normalization & foreign keys', 'B-tree / composite indexing & EXPLAIN ANALYZE', 'Transactions & isolation levels'],
    exercises: ['Optimize a slow multi-join query using EXPLAIN ANALYZE', 'Write transactional SQL migrations'],
    project: 'Relational Inventory & Audit Ledger Backed by PostgreSQL',
    resumeFraming: 'Designed PostgreSQL schemas and indexed queries to support [application/workload].',
    duration: 'Estimate: 2 weeks',
  },
  SQL: {
    why: 'Foundational querying language for filtering, aggregating, and joining structured business data.',
    topics: ['INNER/LEFT JOINs & aggregations', 'CTEs & window functions', 'Query indexing basics'],
    exercises: ['Solve 15 SQL reporting problems using CTEs and ROW_NUMBER()', 'Rewrite subqueries into clean joins'],
    project: 'Analytical SQL Reporting Pack over a Sales & Operations Dataset',
    resumeFraming: 'Authored SQL queries using CTEs and joins to power [dashboard/report].',
    duration: 'Estimate: 1–2 weeks',
  },
  Docker: {
    why: 'Ensures consistent local-to-production environments through container packaging.',
    topics: ['Multi-stage Dockerfiles', 'Docker Compose for app + DB stacks', 'Image size & layer caching optimization'],
    exercises: ['Containerize a web app + Postgres database using Compose', 'Shrink image size via multi-stage builds'],
    project: 'Containerized Full-Stack App with Multi-Service Docker Compose Setup',
    resumeFraming: 'Containerized [application/services] with multi-stage Dockerfiles and Docker Compose for reproducible builds.',
    duration: 'Estimate: 1 week',
  },
  Kubernetes: {
    why: 'Orchestrates scaling, rolling updates, health probes, and service discovery for containers.',
    topics: ['Deployments, Services & ConfigMaps', 'Liveness/Readiness probes', 'Rolling updates & resource limits'],
    exercises: ['Deploy a stateless API and database locally on kind/minikube', 'Simulate zero-downtime rolling updates'],
    project: 'Local Kubernetes Deployment Manifests with Health Probes & HPA',
    resumeFraming: 'Configured Kubernetes Deployments, Services, and readiness probes for [service].',
    duration: 'Estimate: 2–4 weeks (after Docker)',
  },
  AWS: {
    why: 'Widely adopted cloud infrastructure for compute, object storage, IAM, and managed databases.',
    topics: ['IAM least-privilege roles', 'EC2 / ECS / Lambda compute choices', 'S3 & RDS basics'],
    exercises: ['Deploy a static frontend to S3 and an API container or serverless function', 'Configure scoped IAM policies'],
    project: 'Cloud-Hosted File Processing App Using S3 and Managed Compute',
    resumeFraming: 'Deployed [workload] using AWS ([specific services used]) with scoped IAM permissions.',
    duration: 'Estimate: 2–3 weeks',
  },
  'REST APIs': {
    why: 'Core communication pattern connecting client interfaces, microservices, and partner systems.',
    topics: ['HTTP semantics, status codes & idempotency', 'Pagination, filtering & versioning', 'Auth & rate limiting'],
    exercises: ['Design and document an OpenAPI spec before coding endpoints', 'Add consistent error envelopes'],
    project: 'Versioned REST API with OpenAPI Documentation and Integration Tests',
    resumeFraming: 'Designed and documented REST APIs with consistent pagination, validation, and status handling.',
    duration: 'Estimate: 1–2 weeks',
  },
  'CI/CD': {
    why: 'Automates linting, test execution, and reliable builds before code merges.',
    topics: ['GitHub Actions / GitLab CI workflows', 'Automated test & typecheck gates', 'Artifact caching'],
    exercises: ['Add a GitHub Actions workflow running typecheck, lint, tests, and build on PRs'],
    project: 'Automated PR Quality & Release Pipeline in GitHub Actions',
    resumeFraming: 'Configured CI/CD pipelines running automated build and test verification on pull requests.',
    duration: 'Estimate: 4–7 days',
  },
  GraphQL: {
    why: 'Typed API query language enabling clients to fetch exact nested data shapes.',
    topics: ['Schema design & resolvers', 'N+1 prevention with DataLoader', 'Client caching'],
    exercises: ['Build a typed GraphQL endpoint with resolver unit tests'],
    project: 'Typed GraphQL Catalog API with DataLoader Batching',
    resumeFraming: 'Built GraphQL schemas and batched resolvers for [client/domain].',
    duration: 'Estimate: 1–2 weeks',
  },
  Redis: {
    why: 'In-memory store used for caching hot reads, sessions, rate limits, and lightweight queues.',
    topics: ['TTL caching & cache invalidation', 'Sliding-window rate limiting', 'Pub/Sub & streams'],
    exercises: ['Add Redis read-through caching and measure local response latency difference'],
    project: 'Rate-Limited API Gateway with Redis Token Bucket & Cache Layer',
    resumeFraming: 'Implemented Redis caching and rate limiting for [endpoint/service].',
    duration: 'Estimate: 1 week',
  },
};

function mapCategoryDisplay(raw: SkillCategory): ExistingSkillDisplayCategory {
  switch (raw) {
    case 'Programming Languages':
      return 'Programming Languages';
    case 'Frontend Development':
      return 'Frontend Development';
    case 'Backend Development':
      return 'Backend Development';
    case 'Frameworks':
      return 'Frameworks and Libraries';
    case 'Databases':
      return 'Databases';
    case 'Cloud Platforms':
      return 'Cloud Technologies';
    case 'DevOps':
      return 'DevOps';
    case 'Testing':
      return 'Testing Tools';
    case 'Developer Tools':
      return 'Developer Tools';
    case 'Communication':
    case 'Leadership':
      return 'Soft Skills';
    case 'Problem-Solving':
    case 'Data Science':
    case 'Cybersecurity':
    case 'Design':
      return raw === 'Problem-Solving' ? 'Computer Science Fundamentals' : 'Domain-Specific Skills';
    default:
      return 'Domain-Specific Skills';
  }
}

function mapSkillBucket(raw: SkillCategory, isRequired: boolean): JobRequirementBucket {
  if (raw === 'Programming Languages') return 'Programming Languages';
  if (raw === 'Frameworks') return 'Frameworks and Libraries';
  if (raw === 'Databases') return 'Database Requirements';
  if (raw === 'Communication' || raw === 'Leadership' || raw === 'Problem-Solving') {
    return 'Soft Skills';
  }
  if (raw === 'Developer Tools' || raw === 'Testing' || raw === 'DevOps' || raw === 'Cloud Platforms') {
    return 'Tools and Technologies';
  }
  return isRequired ? 'Mandatory Technical Skills' : 'Preferred Technical Skills';
}

function normalizeCompanyToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|corporation|pvt|private|limited|technologies|systems|solutions|co)\b/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function verifyCompanyAndTitleConsistency(params: {
  companyName: string;
  targetRole: string;
  jobDescription: string;
}): ConsistencyWarning[] {
  const { companyName, targetRole, jobDescription } = params;
  const warnings: ConsistencyWarning[] = [];
  const jdLower = jobDescription.toLowerCase();

  // Check company name consistency
  const normCompany = normalizeCompanyToken(companyName);
  if (normCompany.length >= 2) {
    const companyTokens = normCompany.split(' ').filter((t) => t.length >= 2);
    const fullMatch = jdLower.includes(normCompany);
    const partialMatch = companyTokens.some((t) => jdLower.includes(t));

    // Also try detecting an explicit company mention in JD like "About [Company]" or "at [Company]"
    const jdCompanyHints: string[] = [];
    const aboutMatches = jobDescription.matchAll(
      /\b(?:about|join|at|welcome to)\s+([A-Z][A-Za-z0-9&.-]+(?:\s+[A-Z][A-Za-z0-9&.-]+){0,2})\b/g
    );
    for (const m of aboutMatches) {
      const candidate = m[1].trim();
      if (
        candidate.length >= 3 &&
        !/^(Our|The|This|We|You|Role|Team|Company|Engineering|Product)$/i.test(candidate)
      ) {
        jdCompanyHints.push(candidate);
      }
    }

    if (!fullMatch && !partialMatch) {
      const hintText =
        jdCompanyHints.length > 0
          ? ` Detected organization phrase(s) in the posting: ${Array.from(new Set(jdCompanyHints)).slice(0, 3).join(', ')}.`
          : '';
      warnings.push({
        id: 'warn-company-mismatch',
        type: 'company-mismatch',
        title: `Company name "${companyName.trim()}" was not found in the job description`,
        message: `Verify that the pasted job description belongs to ${companyName.trim()} before relying on these results.${hintText}`,
      });
    }
  }

  // Check job title consistency
  const titleTokens = tokenizeWords(targetRole).filter(
    (w) => !STOPWORDS.has(w) && w.length >= 3
  );
  if (titleTokens.length > 0) {
    const jdTokenStems = new Set(tokenizeWords(jobDescription).map((w) => stemWord(w)));
    const matchedTitleTokens = titleTokens.filter((t) => jdTokenStems.has(stemWord(t)));
    if (matchedTitleTokens.length === 0) {
      warnings.push({
        id: 'warn-title-mismatch',
        type: 'title-mismatch',
        title: `Target job title "${targetRole.trim()}" does not appear in the job description`,
        message:
          'None of the core words from your entered Target Job Title were found in the pasted job description. Confirm the title matches the posting so role alignment checks stay accurate.',
      });
    }
  }

  return warnings;
}

function buildEvidenceSnippet(text: string, terms: string[]): string | undefined {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (terms.some((t) => lower.includes(t.toLowerCase()))) {
      return line.length > 165 ? `${line.slice(0, 162)}...` : line;
    }
  }
  return undefined;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectAlternativeSkillGroups(
  jobDescription: string,
  allSkillDefs: { name: string; aliases?: string[] }[]
): Map<string, string[]> {
  // Detects patterns like "Django or Flask", "PostgreSQL / MySQL", "React, Vue, or Angular"
  const groups = new Map<string, string[]>();

  // Pre-build longest-first term lookup with word boundaries so e.g. "PostgreSQL" beats "SQL" and "Django" never hits "Go"
  const termMatchers: { skillName: string; termLen: number; regex: RegExp }[] = [];
  for (const def of allSkillDefs) {
    for (const term of [def.name, ...(def.aliases || [])]) {
      const clean = term.trim();
      if (!clean) continue;
      termMatchers.push({
        skillName: def.name,
        termLen: clean.length,
        regex: new RegExp(`(?:^|[^A-Za-z0-9_+#.])${escapeRegex(clean)}(?:$|[^A-Za-z0-9_+#.])`, 'i'),
      });
    }
  }
  termMatchers.sort((a, b) => b.termLen - a.termLen);

  const findSkillForPhrase = (phrase: string): string | null => {
    const cleaned = phrase
      .replace(/^(?:using|with|such as|including|e\.g\.|like|in|for|or|and)\s+/i, '')
      .replace(/\s+(?:and|or|in|with|for|databases?|frameworks?|tools?)$/i, '')
      .trim();
    if (!cleaned) return null;
    for (const matcher of termMatchers) {
      if (matcher.regex.test(cleaned)) {
        return matcher.skillName;
      }
    }
    return null;
  };

  // Match "A or B", "A / B", "A, B, or C"
  const altRegex =
    /([A-Za-z0-9.+#/-]{2,25}(?:\s+[A-Za-z0-9.+#/-]{2,20})?(?:\s*,\s*[A-Za-z0-9.+#/-]{2,25}(?:\s+[A-Za-z0-9.+#/-]{2,20})?)*)\s*(?:,?\s*(?:or|\/)\s+)\s*([A-Za-z0-9.+#/-]{2,25}(?:\s+[A-Za-z0-9.+#/-]{2,20})?)/gi;

  for (const line of jobDescription.split('\n')) {
    const matches = line.matchAll(altRegex);
    for (const m of matches) {
      const leftParts = m[1].split(',').map((p) => p.trim()).filter(Boolean);
      const candidates = [...leftParts, m[2].trim()];
      const resolved = Array.from(
        new Set(candidates.map((c) => findSkillForPhrase(c)).filter((s): s is string => Boolean(s)))
      );
      if (resolved.length >= 2) {
        const merged = Array.from(
          new Set(resolved.flatMap((skill) => groups.get(skill) || [skill]))
        );
        for (const item of merged) {
          groups.set(item, merged);
        }
      }
    }
  }
  return groups;
}

function getSkillGuide(skillName: string): SkillGuideSpec {
  if (SKILL_KNOWLEDGE_BASE[skillName]) return SKILL_KNOWLEDGE_BASE[skillName];
  return {
    why: `Listed in the target job description as a relevant technical or domain competency (${skillName}).`,
    topics: [
      `Core concepts, architecture patterns, and standard workflows of ${skillName}`,
      `Common failure modes, testing, and debugging practices in ${skillName}`,
    ],
    exercises: [
      `Complete an end-to-end documentation walkthrough and build one small standalone exercise using ${skillName}`,
      `Document concrete tradeoffs or integration steps in a GitHub README`,
    ],
    project: `Focused Mini-Project Integrating ${skillName} with Your Existing Stack`,
    resumeFraming: `Applied ${skillName} to build [component/workflow], validated via [tests or documented outcome].`,
    duration: 'Estimate: 1–2 weeks (self-paced focused practice)',
  };
}

export function buildResumeJobIntelligence(params: {
  analysis: ResumeAnalysisRecord;
  companyName: string;
  targetRole: string;
  jobDescription: string;
  jobMatch: JobMatchResult | null;
  customSkills?: CustomSkillEntry[];
}): ResumeJobIntelligenceReport {
  const { analysis, companyName, targetRole, jobDescription, jobMatch, customSkills = [] } = params;
  const hasJobDescription = jobDescription.trim().length >= 30;
  const resumeText = analysis.extractedText;
  const sections = analysis.nlp.sectionsDetected;
  const expText = sections.experience || '';
  const projText = sections.projects || '';
  const sumText = sections.summary || '';

  const allSkillDefs = [
    ...DEFAULT_SKILLS_DICTIONARY,
    ...customSkills.map((c) => ({
      name: c.name,
      category: c.category,
      aliases: c.aliases,
    })),
  ];
  const skillDefByName = new Map(allSkillDefs.map((d) => [d.name, d]));
  const resumeSkillMap = new Map(analysis.nlp.skills.found.map((s) => [s.name, s]));
  const resumeSkillNames = new Set(analysis.nlp.skills.found.map((s) => s.name));

  // 1. Consistency check
  const consistencyWarnings = hasJobDescription
    ? verifyCompanyAndTitleConsistency({ companyName, targetRole, jobDescription })
    : [];

  // 2. Categorized Job Requirements
  const requirements: CategorizedJobRequirement[] = [];
  const requiredSkillSet = new Set<string>();
  const preferredSkillSet = new Set<string>();

  if (hasJobDescription) {
    const jdLines = jobDescription.split('\n').map((l) => l.trim()).filter(Boolean);
    const reqLines: string[] = [];
    const prefLines: string[] = [];
    let bucketState: 'required' | 'preferred' = 'required';

    for (const line of jdLines) {
      if (/^(preferred|nice to have|bonus|plus|optional|desired|good to have)/i.test(line)) {
        bucketState = 'preferred';
      } else if (/^(required|minimum|must have|qualifications|requirements|responsibilities|what you.*bring)/i.test(line)) {
        bucketState = 'required';
      }
      if (bucketState === 'preferred') prefLines.push(line);
      else reqLines.push(line);
    }

    const reqText = reqLines.join('\n') || jobDescription;
    const prefText = prefLines.join('\n');

    const jdAllSkills = analyzeSkills(jobDescription, { summary: jobDescription }, customSkills);
    const jdReqSkills = analyzeSkills(reqText, { summary: reqText }, customSkills);
    const jdPrefSkills = prefText
      ? analyzeSkills(prefText, { summary: prefText }, customSkills)
      : { found: [] };

    jdReqSkills.found.forEach((s) => requiredSkillSet.add(s.name));
    jdPrefSkills.found.forEach((s) => {
      if (!requiredSkillSet.has(s.name)) preferredSkillSet.add(s.name);
    });
    // Ensure any skill present in JD is accounted for
    jdAllSkills.found.forEach((s) => {
      if (!requiredSkillSet.has(s.name) && !preferredSkillSet.has(s.name)) {
        requiredSkillSet.add(s.name);
      }
    });

    const altGroups = detectAlternativeSkillGroups(jobDescription, allSkillDefs);

    const evaluateSkillRequirement = (
      skillName: string,
      reqType: 'required' | 'preferred',
      rawCat: SkillCategory
    ): CategorizedJobRequirement => {
      const def = skillDefByName.get(skillName);
      const found = resumeSkillMap.get(skillName);
      const altPeers = altGroups.get(skillName) || [];
      const satisfiedPeer = altPeers.find((peer) => peer !== skillName && resumeSkillNames.has(peer));
      const relatedPresent = (def && 'related' in def ? def.related || [] : []).filter((r) =>
        resumeSkillNames.has(r)
      );

      let status: RequirementStatus = 'missing';
      let reason = 'Not detected in extracted resume text.';
      let evidenceSnippet: string | undefined;

      if (found) {
        const terms = [found.name, ...(def?.aliases || [])];
        const inExpOrProj =
          found.sections.includes('experience') || found.sections.includes('projects');
        if (inExpOrProj) {
          status = 'found-evidenced';
          evidenceSnippet =
            buildEvidenceSnippet(expText, terms) ||
            buildEvidenceSnippet(projText, terms) ||
            buildEvidenceSnippet(resumeText, terms);
          reason = `Demonstrated inside ${found.sections.filter((s) => s === 'experience' || s === 'projects').join(' & ')} (${found.count}x total).`;
        } else {
          status = 'mentioned-no-evidence';
          evidenceSnippet = buildEvidenceSnippet(resumeText, terms);
          reason = `Mentioned in ${found.sections.join(', ') || 'Skills list'}, without supporting project or work experience bullets.`;
        }
      } else if (satisfiedPeer) {
        status = 'alternative-satisfied';
        const peerFound = resumeSkillMap.get(satisfiedPeer);
        evidenceSnippet = buildEvidenceSnippet(resumeText, [satisfiedPeer]);
        reason = `Alternative requirement satisfied via "${satisfiedPeer}" (${peerFound?.hasEvidence ? 'backed by context' : 'listed in resume'}) — OR group: ${altPeers.join(' / ')}.`;
      } else if (relatedPresent.length > 0) {
        status = 'partially-matched';
        reason = `Adjacent skill(s) found (${relatedPresent.join(', ')}), though "${skillName}" itself is missing.`;
      }

      return {
        id: `req-skill-${skillName}`,
        name: skillName,
        bucket: mapSkillBucket(rawCat, reqType === 'required'),
        requirementType: reqType,
        importance: reqType === 'required' ? 'critical' : 'medium',
        status,
        evidenceSnippet,
        alternativesGroup: altPeers.length > 1 ? altPeers.join(' OR ') : undefined,
        reason,
      };
    };

    for (const sk of requiredSkillSet) {
      const def = skillDefByName.get(sk);
      if (def) requirements.push(evaluateSkillRequirement(sk, 'required', def.category));
    }
    for (const sk of preferredSkillSet) {
      const def = skillDefByName.get(sk);
      if (def) requirements.push(evaluateSkillRequirement(sk, 'preferred', def.category));
    }

    // Education requirement from JD
    const eduMatch = jobDescription.match(
      /(bachelor'?s|master'?s|ph\.?d|b\.?tech|b\.?e\.?|b\.?s\.?|m\.?s\.?|computer science|engineering degree|relevant degree)[^.\n]{0,80}/i
    );
    if (eduMatch) {
      const hasEdu =
        Boolean(sections.education) || analysis.nlp.entities.education.length > 0;
      requirements.push({
        id: 'req-education',
        name: eduMatch[0].trim(),
        bucket: 'Education Requirements',
        requirementType: 'required',
        importance: 'high',
        status: hasEdu ? 'found-evidenced' : 'missing',
        evidenceSnippet: analysis.nlp.entities.education[0]?.value || (sections.education ? sections.education.split('\n')[0] : undefined),
        reason: hasEdu
          ? 'Education section / degree entry found in resume; verify exact degree major alignment.'
          : 'Posting states an educational qualification, but no Education section or degree entry was detected.',
      });
    }

    // Experience requirement from JD
    const expMatch = jobDescription.match(
      /(\d+\+?(?:\s*(?:-|to)\s*\d+)?\s+years?\s+(?:of\s+)?(?:relevant\s+|industry\s+|software\s+|hands-on\s+)?experience[^.\n]{0,60}|fresh(?:er| graduate)|entry[- ]level|internship experience)/i
    );
    if (expMatch) {
      const hasExpSection = Boolean(sections.experience);
      const dateCount = analysis.nlp.entities.dates.length;
      requirements.push({
        id: 'req-experience',
        name: expMatch[0].trim(),
        bucket: 'Experience Requirements',
        requirementType: 'required',
        importance: 'critical',
        status: hasExpSection && dateCount >= 2 ? 'found-evidenced' : hasExpSection ? 'partially-matched' : 'missing',
        evidenceSnippet: sections.experience ? sections.experience.split('\n')[0] : undefined,
        reason: hasExpSection
          ? `Work Experience section detected with ${dateCount} timeline marker(s). Confirm total years match employer criteria.`
          : 'Posting specifies experience expectations, but no Work Experience section was detected.',
      });
    }

    // Certifications mentioned in JD
    const jdCerts = jobDescription.match(
      /\b(AWS Certified[^,\n.]{0,35}|Azure\s+(?:Administrator|Developer|Solutions Architect)|GCP\s+Associate|CKA|CKAD|CompTIA\s+\w+|PMP|Scrum Master|CISSP)\b/gi
    );
    if (jdCerts && jdCerts.length > 0) {
      const uniqueCerts = Array.from(new Set(jdCerts.map((c) => c.trim())));
      const resCertText = (sections.certifications || '') + ' ' + resumeText;
      for (const cert of uniqueCerts.slice(0, 4)) {
        const matched = resCertText.toLowerCase().includes(cert.toLowerCase());
        requirements.push({
          id: `req-cert-${cert}`,
          name: cert,
          bucket: 'Certifications',
          requirementType: /preferred|bonus|plus/i.test(jobDescription) ? 'preferred' : 'required',
          importance: 'medium',
          status: matched ? 'found-evidenced' : 'missing',
          evidenceSnippet: matched ? buildEvidenceSnippet(resumeText, [cert]) : undefined,
          reason: matched
            ? 'Matching certification keyword found in resume.'
            : 'Certification mentioned in posting was not detected in resume.',
        });
      }
    }

    // Responsibilities parsed from JD bullet lines
    const respLines = jdLines
      .filter((l) => /^[•\-*]/.test(l) || /\b(design|build|develop|maintain|collaborate|implement|test|deploy|optimize|analyze|support)\b/i.test(l))
      .filter((l) => l.length >= 25 && l.length <= 160)
      .slice(0, 6);
    respLines.forEach((line, idx) => {
      const cleanLine = line.replace(/^[•\-*]\s*/, '').trim();
      const lineTerms = tokenizeWords(cleanLine)
        .filter((w) => !STOPWORDS.has(w) && w.length >= 4)
        .map((w) => stemWord(w));
      const resumeStems = new Set(tokenizeWords(expText + '\n' + projText).map((w) => stemWord(w)));
      const overlap = lineTerms.filter((t) => resumeStems.has(t));
      const ratio = lineTerms.length > 0 ? overlap.length / lineTerms.length : 0;
      requirements.push({
        id: `req-resp-${idx}`,
        name: cleanLine,
        bucket: 'Professional Responsibilities',
        requirementType: 'required',
        importance: 'high',
        status: ratio >= 0.45 ? 'found-evidenced' : ratio >= 0.2 ? 'partially-matched' : 'missing',
        reason:
          ratio >= 0.45
            ? `Strong lexical overlap (${Math.round(ratio * 100)}%) with your Experience/Project bullets.`
            : ratio >= 0.2
              ? `Partial keyword overlap (${Math.round(ratio * 100)}%) — consider highlighting closer experience.`
              : 'Low direct overlap in your current Experience or Project bullets.',
      });
    });

    // Domain knowledge terms in JD
    const domainTerms = [
      'Microservices',
      'SaaS',
      'FinTech',
      'E-commerce',
      'Healthcare',
      'Distributed Systems',
      'Accessibility',
      'Cloud-Native',
      'Data Pipelines',
      'Machine Learning',
      'Security',
    ];
    for (const dom of domainTerms) {
      if (new RegExp(`\\b${dom.replace('-', '[-\\s]?')}\\b`, 'i').test(jobDescription)) {
        const matched = new RegExp(`\\b${dom.replace('-', '[-\\s]?')}\\b`, 'i').test(resumeText);
        requirements.push({
          id: `req-dom-${dom}`,
          name: dom,
          bucket: 'Domain Knowledge',
          requirementType: 'preferred',
          importance: 'medium',
          status: matched ? 'found-evidenced' : 'missing',
          evidenceSnippet: matched ? buildEvidenceSnippet(resumeText, [dom]) : undefined,
          reason: matched
            ? `Domain keyword "${dom}" appears in your resume.`
            : `Posting mentions "${dom}", which was not found in your resume text.`,
        });
      }
    }

    // Additional eligibility conditions
    const eligMatch = jobDescription.match(
      /\b(hybrid|remote|on-site|onsite|relocation|work authorization|full-time|shift|background check|202\d\s*(?:batch|graduate))\b[^.\n]{0,55}/gi
    );
    if (eligMatch) {
      Array.from(new Set(eligMatch.map((e) => e.trim())))
        .slice(0, 3)
        .forEach((cond, idx) => {
          requirements.push({
            id: `req-elig-${idx}`,
            name: cond,
            bucket: 'Additional Eligibility Conditions',
            requirementType: 'required',
            importance: 'medium',
            status: 'not-applicable',
            reason: 'Operational or location eligibility condition stated by employer — confirm manually before applying.',
          });
        });
    }
  }

  // 3. Existing Skills Intelligence
  const existingSkills: ExistingSkillIntelItem[] = analysis.nlp.skills.found.map((sk) => {
    const def = skillDefByName.get(sk.name);
    const terms = [sk.name, ...(def?.aliases || [])];
    const inExpOrProj =
      sk.sections.includes('experience') || sk.sections.includes('projects');
    const inSummary = sk.sections.includes('summary');

    const snippet =
      buildEvidenceSnippet(expText, terms) ||
      buildEvidenceSnippet(projText, terms) ||
      buildEvidenceSnippet(sumText, terms);

    const requiredByJob: ExistingSkillIntelItem['requiredByJob'] = !hasJobDescription
      ? 'No JD Supplied'
      : requiredSkillSet.has(sk.name)
        ? 'Required'
        : preferredSkillSet.has(sk.name)
          ? 'Preferred'
          : 'Not Listed in JD';

    return {
      name: sk.name,
      category: mapCategoryDisplay(sk.category),
      rawCategory: sk.category,
      count: sk.count,
      requiredByJob,
      sectionsAppearing: sk.sections.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
      evidenceSnippet: snippet,
      matchStatus: inExpOrProj
        ? 'Demonstrated in Experience/Projects'
        : inSummary
          ? 'Summary Context Only'
          : 'Mentioned Without Evidence',
    };
  });

  // 4. Skill Gap Analysis (6 dedicated buckets)
  const skillGaps: SkillGapDetail[] = [];

  if (hasJobDescription) {
    const technicalReqs = requirements.filter(
      (r) => r.id.startsWith('req-skill-') && (r.status === 'missing' || r.status === 'partially-matched' || r.status === 'mentioned-no-evidence')
    );

    for (const req of technicalReqs) {
      const def = skillDefByName.get(req.name);
      const relatedInResume = (def && 'related' in def ? def.related || [] : []).filter((r) =>
        resumeSkillNames.has(r)
      );
      const guide = getSkillGuide(req.name);

      let bucket: GapBucket;
      let priority: SkillGapDetail['priority'];
      let reqStatus: SkillGapDetail['requirementStatus'];

      if (req.status === 'mentioned-no-evidence') {
        bucket = 'Skills Mentioned Without Evidence';
        priority = 'High';
        reqStatus = 'Weak Evidence';
      } else if (req.status === 'partially-matched') {
        bucket = 'Partially Matched Skills';
        priority = req.requirementType === 'required' ? 'High' : 'Medium';
        reqStatus = req.requirementType === 'required' ? 'Required' : 'Preferred';
      } else if (req.requirementType === 'required') {
        const isCoreStack =
          req.bucket === 'Programming Languages' ||
          req.bucket === 'Frameworks and Libraries' ||
          req.bucket === 'Database Requirements' ||
          req.bucket === 'Mandatory Technical Skills';
        bucket = isCoreStack ? 'Critical Missing Skills' : 'High-Priority Skill Gaps';
        priority = isCoreStack ? 'Critical' : 'High';
        reqStatus = 'Required';
      } else {
        bucket = 'Important Preferred Skills';
        priority = 'Medium';
        reqStatus = 'Preferred';
      }

      skillGaps.push({
        id: `gap-${req.name}`,
        bucket,
        skillOrRequirement: req.name,
        whyJobRequiresIt: guide.why,
        requirementStatus: reqStatus,
        priority,
        relatedSkillsInResume: relatedInResume,
        whatToLearn: guide.topics,
        practicalExercises: guide.exercises,
        recommendedProject: guide.project,
        howToDemonstrateInResume: guide.resumeFraming,
        estimatedDuration: guide.duration,
      });
    }

    // Check missing practical experience gap
    const expReq = requirements.find((r) => r.id === 'req-experience');
    if (expReq && (expReq.status === 'missing' || expReq.status === 'partially-matched')) {
      skillGaps.push({
        id: 'gap-practical-experience',
        bucket: 'Missing Practical Experience',
        skillOrRequirement: expReq.name,
        whyJobRequiresIt: 'Employers evaluate whether candidates have applied required tools in real or project-based production scenarios.',
        requirementStatus: 'Experience Depth',
        priority: 'Critical',
        relatedSkillsInResume: analysis.nlp.skills.usedInProjects.slice(0, 5),
        whatToLearn: [
          'End-to-end delivery lifecycle (requirements -> build -> automated tests -> deployment)',
          'Documenting technical decisions and measurable system behavior',
        ],
        practicalExercises: [
          'Complete a 1–2 week scoped capstone project integrating the target job stack',
          'Add architecture notes, automated test results, and clear bullet points describing your actual work',
        ],
        recommendedProject: 'Production-Style Portfolio Capstone Aligned With Target Role Stack',
        howToDemonstrateInResume:
          'Add an Experience, Internship, or Academic Projects entry detailing specific components you engineered, tested, and shipped.',
        estimatedDuration: 'Estimate: 3–6 weeks (for a portfolio project)',
      });
    }
  } else {
    // Even without a JD, surface skills mentioned without experience/project evidence
    for (const unsub of analysis.nlp.skills.unsubstantiated.slice(0, 8)) {
      const guide = getSkillGuide(unsub);
      const def = skillDefByName.get(unsub);
      skillGaps.push({
        id: `gap-unsub-${unsub}`,
        bucket: 'Skills Mentioned Without Evidence',
        skillOrRequirement: unsub,
        whyJobRequiresIt: 'Skills listed only in a Skills section carry less credibility unless backed by Experience or Project bullets.',
        requirementStatus: 'Weak Evidence',
        priority: 'Medium',
        relatedSkillsInResume: (def && 'related' in def ? def.related || [] : []).filter((r) =>
          resumeSkillNames.has(r)
        ),
        whatToLearn: guide.topics,
        practicalExercises: guide.exercises,
        recommendedProject: guide.project,
        howToDemonstrateInResume: guide.resumeFraming,
        estimatedDuration: guide.duration,
      });
    }
  }

  // 5. Coverage Calculations (excluding non-applicable & valuing satisfied alternatives honestly)
  const reqSkillReqs = requirements.filter((r) => r.id.startsWith('req-skill-') && r.requirementType === 'required');
  const prefSkillReqs = requirements.filter((r) => r.id.startsWith('req-skill-') && r.requirementType === 'preferred');

  const isSatisfied = (status: RequirementStatus) =>
    status === 'found-evidenced' || status === 'mentioned-no-evidence' || status === 'alternative-satisfied';

  const requiredSkillCoverage =
    reqSkillReqs.length > 0
      ? Math.round((reqSkillReqs.filter((r) => isSatisfied(r.status)).length / reqSkillReqs.length) * 100)
      : hasJobDescription
        ? jobMatch?.skillsMatchScore ?? 0
        : null;

  const preferredSkillCoverage =
    prefSkillReqs.length > 0
      ? Math.round((prefSkillReqs.filter((r) => isSatisfied(r.status)).length / prefSkillReqs.length) * 100)
      : hasJobDescription
        ? null
        : null;

  const trulyMissingCount = hasJobDescription
    ? requirements.filter((r) => r.status === 'missing' && r.id.startsWith('req-skill-')).length
    : null;

  // Adjusted job compatibility accounting fairly for satisfied OR-alternatives
  const baseCompatScore = jobMatch
    ? jobMatch.overallMatchScore
    : hasJobDescription
      ? computeTfIdfCosineSimilarity(resumeText, jobDescription).similarity
      : null;

  // 6. Detailed Resume vs Job Compatibility (9 dimensions)
  const compatibilityDimensions: CompatibilityDimension[] = [];
  if (hasJobDescription) {
    const toolsReqs = requirements.filter((r) => r.bucket === 'Tools and Technologies');
    const softReqs = requirements.filter((r) => r.bucket === 'Soft Skills');
    const respReqs = requirements.filter((r) => r.bucket === 'Professional Responsibilities');
    const eduReq = requirements.find((r) => r.id === 'req-education');
    const expReq = requirements.find((r) => r.id === 'req-experience');

    const ratioScore = (list: CategorizedJobRequirement[], fallback = 0) => {
      if (list.length === 0) return fallback;
      const pts = list.reduce(
        (acc, r) =>
          acc +
          (r.status === 'found-evidenced' || r.status === 'alternative-satisfied'
            ? 1
            : r.status === 'mentioned-no-evidence'
              ? 0.7
              : r.status === 'partially-matched'
                ? 0.45
                : 0),
        0
      );
      return Math.round((pts / list.length) * 100);
    };

    const projMatched = requirements.filter(
      (r) => r.id.startsWith('req-skill-') && analysis.nlp.skills.usedInProjects.includes(r.name)
    );
    const expMatched = requirements.filter(
      (r) => r.id.startsWith('req-skill-') && analysis.nlp.skills.usedInExperience.includes(r.name)
    );

    compatibilityDimensions.push(
      {
        key: 'req-skills',
        title: 'Required Skill Coverage',
        score: requiredSkillCoverage ?? 0,
        matched: reqSkillReqs.filter((r) => isSatisfied(r.status)).map((r) => r.name),
        partial: reqSkillReqs.filter((r) => r.status === 'partially-matched').map((r) => r.name),
        missing: reqSkillReqs.filter((r) => r.status === 'missing').map((r) => r.name),
        evidence: reqSkillReqs
          .map((r) => r.evidenceSnippet)
          .filter((x): x is string => Boolean(x))
          .slice(0, 3),
        reasoning: `Measures how many required job skills (including satisfied OR-alternatives) appear in your resume.`,
      },
      {
        key: 'pref-skills',
        title: 'Preferred Skill Coverage',
        score: preferredSkillCoverage ?? 100,
        matched: prefSkillReqs.filter((r) => isSatisfied(r.status)).map((r) => r.name),
        partial: prefSkillReqs.filter((r) => r.status === 'partially-matched').map((r) => r.name),
        missing: prefSkillReqs.filter((r) => r.status === 'missing').map((r) => r.name),
        evidence: prefSkillReqs
          .map((r) => r.evidenceSnippet)
          .filter((x): x is string => Boolean(x))
          .slice(0, 3),
        reasoning:
          prefSkillReqs.length > 0
            ? 'Evaluates bonus / nice-to-have skills separated under Preferred sections of the posting.'
            : 'Posting did not separate explicit preferred technical skills.',
      },
      {
        key: 'keywords',
        title: 'Technical Keyword Alignment (TF-IDF & Stemmed Overlap)',
        score: jobMatch ? Math.round((jobMatch.tfidfCosineSimilarity + jobMatch.keywordOverlapScore) / 2) : 0,
        matched: jobMatch?.matchedKeywords.slice(0, 10) || [],
        partial: [],
        missing: jobMatch?.missingKeywords.slice(0, 8) || [],
        evidence: [],
        reasoning:
          'Statistical lexical comparison (TF-IDF cosine + stemmed token overlap). Similarity alone does not prove mastery.',
      },
      {
        key: 'exp-relevance',
        title: 'Experience Relevance',
        score: expReq
          ? expReq.status === 'found-evidenced'
            ? 85
            : 50
          : expMatched.length > 0
            ? Math.min(100, 45 + expMatched.length * 15)
            : sections.experience
              ? 55
              : 15,
        matched: expMatched.map((e) => e.name),
        partial: [],
        missing: expReq?.status === 'missing' ? [expReq.name] : [],
        evidence: expText ? expText.split('\n').slice(0, 2) : [],
        reasoning:
          'Checks presence of Work Experience bullets demonstrating target job technologies and chronological dates.',
      },
      {
        key: 'edu-compat',
        title: 'Education Compatibility',
        score: eduReq ? (eduReq.status === 'found-evidenced' ? 95 : 20) : sections.education ? 90 : 40,
        matched: eduReq?.status === 'found-evidenced' ? [eduReq.name] : [],
        partial: [],
        missing: eduReq?.status === 'missing' ? [eduReq.name] : [],
        evidence: analysis.nlp.entities.education.map((e) => e.value).slice(0, 2),
        reasoning: eduReq ? eduReq.reason : 'Education section checked against typical employer screening.',
      },
      {
        key: 'proj-rel',
        title: 'Project Relevance',
        score:
          reqSkillReqs.length > 0
            ? Math.min(100, Math.round((projMatched.length / Math.max(1, Math.min(4, reqSkillReqs.length))) * 100))
            : sections.projects
              ? 75
              : 25,
        matched: projMatched.map((p) => p.name),
        partial: [],
        missing: [],
        evidence: projText ? projText.split('\n').slice(0, 2) : [],
        reasoning: `${projMatched.length} job-relevant skill(s) are explicitly demonstrated in your Projects section.`,
      },
      {
        key: 'resp-align',
        title: 'Responsibility Alignment',
        score: ratioScore(respReqs, jobMatch?.keywordOverlapScore || 50),
        matched: respReqs.filter((r) => r.status === 'found-evidenced').map((r) => r.name),
        partial: respReqs.filter((r) => r.status === 'partially-matched').map((r) => r.name),
        missing: respReqs.filter((r) => r.status === 'missing').map((r) => r.name),
        evidence: [],
        reasoning: 'Compares stemmed action & domain terms in JD responsibility bullets against your Experience/Projects.',
      },
      {
        key: 'tools-compat',
        title: 'Tools & Technology Compatibility',
        score: ratioScore(toolsReqs, 70),
        matched: toolsReqs.filter((r) => isSatisfied(r.status)).map((r) => r.name),
        partial: toolsReqs.filter((r) => r.status === 'partially-matched').map((r) => r.name),
        missing: toolsReqs.filter((r) => r.status === 'missing').map((r) => r.name),
        evidence: toolsReqs.map((r) => r.evidenceSnippet).filter((x): x is string => Boolean(x)).slice(0, 2),
        reasoning: 'Evaluates testing, DevOps, cloud platforms, and developer workflow tooling coverage.',
      },
      {
        key: 'soft-align',
        title: 'Soft Skill Alignment',
        score: ratioScore(softReqs, 75),
        matched: softReqs.filter((r) => isSatisfied(r.status)).map((r) => r.name),
        partial: [],
        missing: softReqs.filter((r) => r.status === 'missing').map((r) => r.name),
        evidence: [],
        reasoning: 'Checks communication, leadership, Agile collaboration, and problem-solving terms present in the JD.',
      }
    );
  }

  // 7. Comprehensive 19-Point Resume Quality Audit
  const findCat = (key: string) => analysis.ats.categories.find((c) => c.key === key);
  const sevFromScore = (score: number): QualityAuditItem['severity'] =>
    score >= 80 ? 'pass' : score >= 60 ? 'low' : score >= 40 ? 'medium' : 'high';

  const hasInternship = /\bintern(?:ship)?\b/i.test(resumeText);
  const hasAcademicProjects =
    Boolean(sections.projects) || /\bacademic\s+project|\bcapstone\b/i.test(resumeText);
  const dupWordMatches = resumeText.match(/\b([a-z]{3,})\s+\1\b/gi) || [];
  const grammarIssuesCount =
    dupWordMatches.length + analysis.nlp.duplicateSentences.length + analysis.nlp.weakPhrases.length;
  const grammarScore = Math.max(30, 100 - dupWordMatches.length * 15 - analysis.nlp.duplicateSentences.length * 15 - Math.min(25, analysis.nlp.weakPhrases.length * 6));
  const parseCompatScore =
    analysis.parsingWarnings.length > 0
      ? 65
      : analysis.nlp.tokenStats.totalWords >= 120
        ? 95
        : 60;

  const qualityAudit: QualityAuditItem[] = [
    {
      id: 'qa-contact',
      dimension: 'Contact Information',
      score: findCat('contactInfo')?.score ?? 0,
      severity: sevFromScore(findCat('contactInfo')?.score ?? 0),
      explanation: findCat('contactInfo')?.details || '',
      suggestedCorrection: 'Include full name, plain-text email, phone number, city/country, and GitHub/LinkedIn URL.',
    },
    {
      id: 'qa-summary',
      dimension: 'Professional Summary',
      score: findCat('professionalSummary')?.score ?? 0,
      severity: sevFromScore(findCat('professionalSummary')?.score ?? 0),
      explanation: findCat('professionalSummary')?.details || '',
      suggestedCorrection: 'Place a concise 2–4 sentence summary below your contact header highlighting core stack and target focus.',
    },
    {
      id: 'qa-skills',
      dimension: 'Technical Skills',
      score: findCat('skills')?.score ?? 0,
      severity: sevFromScore(findCat('skills')?.score ?? 0),
      explanation: findCat('skills')?.details || '',
      suggestedCorrection: 'Group skills cleanly (Languages, Frameworks, Databases, Tools) and prove them in Experience/Projects.',
    },
    {
      id: 'qa-experience',
      dimension: 'Work Experience',
      score: findCat('workExperience')?.score ?? 0,
      severity: sevFromScore(findCat('workExperience')?.score ?? 0),
      explanation: findCat('workExperience')?.details || '',
      suggestedCorrection: 'Structure roles with title, company, Month Year range, and 3–5 action-led bullets.',
    },
    {
      id: 'qa-internship',
      dimension: 'Internship Experience',
      score: hasInternship ? 90 : sections.experience ? 75 : 40,
      severity: hasInternship ? 'pass' : sections.experience ? 'low' : 'medium',
      explanation: hasInternship
        ? 'Internship experience keywords detected inside resume.'
        : sections.experience
          ? 'Full-time or general work experience present; no explicit internship label found (optional if experienced).'
          : 'No internship or work experience detected — vital for students and early-career applicants.',
      suggestedCorrection: 'If you completed internships or co-ops, list them under Work Experience or Internships with deliverables built.',
    },
    {
      id: 'qa-projects',
      dimension: 'Academic & Technical Projects',
      score: findCat('projects')?.score ?? (hasAcademicProjects ? 75 : 0),
      severity: sevFromScore(findCat('projects')?.score ?? (hasAcademicProjects ? 75 : 0)),
      explanation: findCat('projects')?.details || '',
      suggestedCorrection: 'Include 2–3 substantial projects naming the technologies used, architecture decisions, and real results.',
    },
    {
      id: 'qa-education',
      dimension: 'Education',
      score: findCat('education')?.score ?? 0,
      severity: sevFromScore(findCat('education')?.score ?? 0),
      explanation: findCat('education')?.details || '',
      suggestedCorrection: 'List degree, major, institution name, and graduation year.',
    },
    {
      id: 'qa-certifications',
      dimension: 'Certifications',
      score: findCat('certifications')?.score ?? 0,
      severity: sevFromScore(findCat('certifications')?.score ?? 0),
      explanation: findCat('certifications')?.details || '',
      suggestedCorrection: 'Add verified technical certifications with issuing organization and completion year if applicable.',
    },
    {
      id: 'qa-achievements',
      dimension: 'Achievements',
      score: Math.min(100, (sections.achievements ? 50 : 0) + Math.min(50, analysis.nlp.quantifiedAchievements.length * 15)),
      severity: sevFromScore(Math.min(100, (sections.achievements ? 50 : 0) + Math.min(50, analysis.nlp.quantifiedAchievements.length * 15))),
      explanation: `${sections.achievements ? 'Dedicated Achievements section detected.' : 'No separate Achievements heading.'} ${analysis.nlp.quantifiedAchievements.length} quantified line(s) found.`,
      suggestedCorrection: 'Highlight awards, hackathon placements, or verified quantitative results where accurate.',
    },
    {
      id: 'qa-structure',
      dimension: 'Resume Structure',
      score: findCat('resumeStructure')?.score ?? 0,
      severity: sevFromScore(findCat('resumeStructure')?.score ?? 0),
      explanation: findCat('resumeStructure')?.details || '',
      suggestedCorrection: 'Use clear standard headings: Summary, Experience, Projects, Skills, Education.',
    },
    {
      id: 'qa-formatting',
      dimension: 'Formatting',
      score: findCat('formattingIndicators')?.score ?? 0,
      severity: sevFromScore(findCat('formattingIndicators')?.score ?? 0),
      explanation: findCat('formattingIndicators')?.details || '',
      suggestedCorrection: 'Use consistent bullet symbols, clean single-column hierarchy, and avoid dense paragraphs.',
    },
    {
      id: 'qa-readability',
      dimension: 'Readability',
      score: findCat('readability')?.score ?? 0,
      severity: sevFromScore(findCat('readability')?.score ?? 0),
      explanation: findCat('readability')?.details || '',
      suggestedCorrection: 'Target crisp 12–22 word bullets and 300–900 total words for early/mid roles.',
    },
    {
      id: 'qa-keywords',
      dimension: 'Keyword Usage',
      score: findCat('keywordRelevance')?.score ?? 0,
      severity: sevFromScore(findCat('keywordRelevance')?.score ?? 0),
      explanation: findCat('keywordRelevance')?.details || '',
      suggestedCorrection: 'Use varied technical terms and authentic employer phrasing without keyword stuffing.',
    },
    {
      id: 'qa-grammar',
      dimension: 'Grammar, Repetition & Cliches',
      score: grammarScore,
      severity: sevFromScore(grammarScore),
      explanation:
        grammarIssuesCount === 0
          ? 'Zero repeated adjacent words, duplicate sentences, or cliché openers flagged by rule checks.'
          : `${dupWordMatches.length} repeated-word pattern(s), ${analysis.nlp.duplicateSentences.length} duplicate sentence(s), and ${analysis.nlp.weakPhrases.length} cliché/passive phrase(s) found.`,
      suggestedCorrection: 'Proofread for repeated words and replace vague openers like "Responsible for" with strong action verbs.',
    },
    {
      id: 'qa-bullets',
      dimension: 'Bullet Point Quality',
      score: findCat('bulletQuality')?.score ?? 0,
      severity: sevFromScore(findCat('bulletQuality')?.score ?? 0),
      explanation: findCat('bulletQuality')?.details || '',
      suggestedCorrection: 'Start every bullet with a direct action verb followed by method and verified outcome.',
    },
    {
      id: 'qa-quantified',
      dimension: 'Quantifiable Achievements',
      score: findCat('achievements')?.score ?? 0,
      severity: sevFromScore(findCat('achievements')?.score ?? 0),
      explanation: findCat('achievements')?.details || '',
      suggestedCorrection: 'Where measurable impact exists, include real percentages, latency/time savings, or user/test scale.',
    },
    {
      id: 'qa-org',
      dimension: 'Section Organization',
      score: analysis.ats.missingSections.length === 0 ? 95 : Math.max(35, 95 - analysis.ats.missingSections.length * 18),
      severity: analysis.ats.missingSections.length === 0 ? 'pass' : 'medium',
      explanation:
        analysis.ats.missingSections.length === 0
          ? 'All standard top-level sections are cleanly organized.'
          : `Missing standard section heading(s): ${analysis.ats.missingSections.join(', ')}.`,
      suggestedCorrection: 'Order your strongest sections first (Experience for professionals; Education + Projects for fresh graduates).',
    },
    {
      id: 'qa-dates',
      dimension: 'Date Consistency',
      score: findCat('dateConsistency')?.score ?? 0,
      severity: sevFromScore(findCat('dateConsistency')?.score ?? 0),
      explanation: findCat('dateConsistency')?.details || '',
      suggestedCorrection: 'Format every timeline consistently as "Mon YYYY – Mon YYYY" or "Mon YYYY – Present".',
    },
    {
      id: 'qa-parsing',
      dimension: 'Document Parsing Compatibility',
      score: parseCompatScore,
      severity: sevFromScore(parseCompatScore),
      explanation:
        analysis.parsingWarnings.length > 0
          ? analysis.parsingWarnings.join(' ')
          : `Text extracted cleanly (${analysis.fileType.toUpperCase()}, ${analysis.nlp.tokenStats.totalWords} words).`,
      suggestedCorrection: 'Export selectable-text PDF or DOCX files; avoid multi-column tables or text embedded inside images.',
    },
  ];

  // 8. Resume Improvement Coach Recommendations (no invented metrics!)
  const improvementRecommendations: ImprovementCoachRecommendation[] = [];
  if (!sections.summary || sections.summary.split(/\s+/).length < 20) {
    improvementRecommendations.push({
      id: 'imp-summary',
      section: 'Professional Summary',
      currentIssue: sections.summary
        ? 'Summary is shorter than recommended (fewer than 20 words).'
        : 'No Professional Summary section detected.',
      whyItMatters: 'Recruiters scan the top third of a resume first to confirm role alignment and core skills.',
      recommendedImprovement: 'Add a concise 2–3 sentence summary naming your role focus, real tools/technologies used, and project domain.',
      exampleRevisedWording: `${targetRole || '[Your Target Role]'} specializing in ${analysis.nlp.skills.found.slice(0, 4).map((s) => s.name).join(', ') || '[Core Technologies]'}, experienced in building and testing [type of projects you completed].`,
    });
  }

  if (analysis.nlp.skills.unsubstantiated.length > 0) {
    improvementRecommendations.push({
      id: 'imp-skills',
      section: 'Technical Skills & Project Evidence',
      currentIssue: `${analysis.nlp.skills.unsubstantiated.slice(0, 5).join(', ')} appear without usage details in Experience or Projects.`,
      whyItMatters: 'Hiring managers and technical interviewers verify whether listed skills were actually applied in real work.',
      recommendedImprovement: 'For each skill you genuinely used, reference it inside an Experience or Project bullet explaining what you built with it.',
      exampleRevisedWording: `Built [feature/module] using ${analysis.nlp.skills.unsubstantiated[0]}, handling [core requirement] and verifying behavior via [tests/manual checks].`,
    });
  }

  if (analysis.nlp.weakPhrases.length > 0) {
    const firstWeak = analysis.nlp.weakPhrases[0];
    improvementRecommendations.push({
      id: 'imp-bullets',
      section: 'Bullet Points & Work Experience',
      currentIssue: `Weak passive phrase detected: "${firstWeak.phrase}".`,
      whyItMatters: 'Passive phrases describe duties rather than personal ownership and technical contribution.',
      recommendedImprovement: 'Lead each bullet with a concrete verb (Built, Implemented, Automated, Refactored, Tested) plus real scope.',
      exampleRevisedWording: 'Engineered [specific feature/API] using [verified stack], reducing [verified bottleneck or manual step — insert exact figure only if measured].',
    });
  }

  if (analysis.nlp.quantifiedAchievements.length < 2) {
    improvementRecommendations.push({
      id: 'imp-achievements',
      section: 'Achievements & Measurable Context',
      currentIssue: `Only ${analysis.nlp.quantifiedAchievements.length} bullet(s) include numeric scale or measurable outcomes.`,
      whyItMatters: 'Numbers help reviewers grasp scope (endpoints built, test cases, dataset size, latency, or users) without guessing.',
      recommendedImprovement: 'Audit your real projects and work history and add accurate counts or measured before/after changes.',
      exampleRevisedWording: 'Implemented [N] REST endpoints and [N] automated unit tests for [project], verified locally against [criteria].',
    });
  }

  if (!sections.projects) {
    improvementRecommendations.push({
      id: 'imp-projects',
      section: 'Project Descriptions',
      currentIssue: 'No dedicated Projects section found.',
      whyItMatters: 'Projects are essential proof of practical capability, especially when targeting missing job requirements.',
      recommendedImprovement: 'Add 2–3 key technical or academic projects listing stack, key feature, and link to repository or demo.',
      exampleRevisedWording: '[Project Title] ([Tech Stack]) — Built [key capability] to solve [problem]; tested with [test suite/edge cases].',
    });
  }

  if (dupWordMatches.length > 0 || analysis.nlp.duplicateSentences.length > 0) {
    improvementRecommendations.push({
      id: 'imp-grammar',
      section: 'Grammar & Formatting',
      currentIssue: 'Duplicate phrases or repeated adjacent words were detected in the extracted text.',
      whyItMatters: 'Repeated sentences reduce readability and signal rushed editing.',
      recommendedImprovement: 'Deduplicate repeated bullets and verify uniform punctuation across all sections.',
      exampleRevisedWording: 'Consolidate overlapping bullets into one crisp statement highlighting the distinct technical implementation.',
    });
  }

  // 9. Project Recommendations based on actual missing/weak skills
  const priorityMissingSkills = Array.from(
    new Set([
      ...skillGaps.filter((g) => g.priority === 'Critical').map((g) => g.skillOrRequirement),
      ...skillGaps.filter((g) => g.priority === 'High').map((g) => g.skillOrRequirement),
      ...skillGaps.map((g) => g.skillOrRequirement),
    ])
  ).filter((s) => s.length < 40);

  const projectRecommendations: RecommendedProjectItem[] = [];
  const baseStack = analysis.nlp.skills.found.slice(0, 3).map((s) => s.name);
  const gap1 = priorityMissingSkills[0] || baseStack[0] || 'REST APIs';
  const gap2 = priorityMissingSkills[1] || baseStack[1] || 'SQL';
  const gap3 = priorityMissingSkills[2] || baseStack[2] || 'Docker';

  projectRecommendations.push(
    {
      id: 'proj-beginner',
      title: `Core ${gap1} & ${gap2} Practice Tracker`,
      difficulty: 'Beginner',
      technologies: Array.from(new Set([gap1, gap2, ...baseStack.slice(0, 1)])),
      skillsDemonstrated: [gap1, gap2, 'Unit Testing'],
      mainFeatures: [
        `Structured CRUD workflow using ${gap1}`,
        `Persistent data modeling and validation in ${gap2}`,
        'Clear README documenting setup and test cases',
      ],
      developmentSteps: [
        `Set up project structure and environment for ${gap1}`,
        'Implement core data schema, input validation, and error handling',
        'Write unit tests covering valid, empty, and malformed inputs',
      ],
      expectedOutcomes: [
        `Hands-on familiarity with ${gap1} syntax, validation, and testing conventions`,
      ],
      resumeTemplate: `${gap1} & ${gap2} Practice Tracker (Recommended only after completing) — Built a validated CRUD service with [N] unit tests covering input and schema edge cases.`,
    },
    {
      id: 'proj-intermediate',
      title: `${targetRole || 'Role-Aligned'} Full-Stack / API Integration App`,
      difficulty: 'Intermediate',
      technologies: Array.from(new Set([gap1, gap2, ...baseStack.slice(0, 2), 'Git'])),
      skillsDemonstrated: [gap1, gap2, 'REST APIs', 'Authentication'],
      mainFeatures: [
        'Role-aware API endpoints with structured validation and pagination',
        `Integration with ${gap2} queries and indexing`,
        'Automated test suite and CI workflow on pull requests',
      ],
      developmentSteps: [
        'Draft API contract and database schema',
        'Implement backend logic and client integration',
        'Run automated integration tests and capture real local benchmarks',
      ],
      expectedOutcomes: [
        'End-to-end architecture experience connecting API, storage, and validation',
      ],
      resumeTemplate: `Role-Aligned Integration App — Designed and tested REST endpoints backed by ${gap2}, verified by automated integration tests.`,
    },
    {
      id: 'proj-advanced',
      title: `Containerized ${gap1} + ${gap3} Observable Pipeline`,
      difficulty: 'Advanced',
      technologies: Array.from(new Set([gap1, gap2, gap3, 'CI/CD'])),
      skillsDemonstrated: [gap1, gap3, 'CI/CD', 'System Design'],
      mainFeatures: [
        `Containerized multi-service setup using ${gap3}`,
        'Health check endpoints, structured logging, and retry handling',
        'CI build + automated test verification gate',
      ],
      developmentSteps: [
        `Containerize application & datastore with ${gap3}`,
        'Add health checks, graceful error recovery, and load testing notes',
        'Document architecture tradeoffs and real test outcomes in repository',
      ],
      expectedOutcomes: [
        'Demonstrates deployment readiness, reliability thinking, and multi-component integration',
      ],
      resumeTemplate: `Containerized Service Pipeline — Packaged ${gap1} service and datastore via ${gap3} with automated health checks and CI verification.`,
    }
  );

  // 10. Career Learning Roadmap (7d, 30d, 60d, 90d — labeled as estimates)
  const topGaps = priorityMissingSkills.slice(0, 6);
  const learningRoadmap: RoadmapPhase[] = [
    {
      id: 'rm-7',
      phaseLabel: 'First 7 Days',
      durationNote: 'Estimated onboarding & quick resume fixes (~5–8 hrs)',
      skillsToLearn: topGaps.slice(0, 2),
      topicsToCover: [
        'Fix immediate resume formatting, weak bullet openers, and missing sections',
        topGaps[0] ? `Core fundamentals & setup of ${topGaps[0]}` : 'Review existing core skill syntax & edge cases',
      ],
      practicalExercises: [
        'Rewrite passive bullets in your resume using strong action verbs',
        topGaps[0] ? `Complete one small documented exercise using ${topGaps[0]}` : 'Add automated unit tests to an existing repo',
      ],
      projectMilestones: ['Set up repository and project plan for Beginner Practice Tracker'],
      revisionTasks: ['Update Professional Summary and organize Technical Skills by category'],
      portfolioEvidence: 'Cleaned resume draft + starter GitHub repository with README',
    },
    {
      id: 'rm-30',
      phaseLabel: '30-Day Learning Plan',
      durationNote: 'Estimated core gap build phase (~3–4 weeks)',
      skillsToLearn: topGaps.slice(0, 3),
      topicsToCover: [
        topGaps[0] ? `${topGaps[0]} core workflows and testing` : 'Primary stack depth',
        topGaps[1] ? `${topGaps[1]} schema/API fundamentals` : 'Database / API reliability',
      ],
      practicalExercises: [
        'Implement CRUD, validation, and automated unit tests',
        'Measure and log real edge-case behaviors',
      ],
      projectMilestones: [`Complete & document ${projectRecommendations[0].title}`],
      revisionTasks: ['Update Projects section ONLY once the project is genuinely built & tested'],
      portfolioEvidence: 'Working Beginner/Core repository with passing test suite',
    },
    {
      id: 'rm-60',
      phaseLabel: '60-Day Practical Development Plan',
      durationNote: 'Estimated applied integration phase (~4 weeks)',
      skillsToLearn: topGaps.slice(1, 5),
      topicsToCover: [
        'End-to-end integration, authentication, error states, and API contracts',
        'Containerization or CI automation basics',
      ],
      practicalExercises: [
        'Add CI checks (typecheck + lint + test) on pull requests',
        'Write concise architecture decision notes in README',
      ],
      projectMilestones: [`Ship ${projectRecommendations[1].title}`],
      revisionTasks: ['Align bullet wording with authentic terminology from target job postings'],
      portfolioEvidence: 'Tested full-stack/API project + CI status history',
    },
    {
      id: 'rm-90',
      phaseLabel: '90-Day Career Preparation Plan',
      durationNote: 'Estimated portfolio polish & interview readiness (~4 weeks)',
      skillsToLearn: topGaps,
      topicsToCover: [
        'System design & debugging fundamentals relevant to target role',
        'Structured walkthroughs of every project and skill listed on your resume',
      ],
      practicalExercises: [
        'Practice explaining architecture decisions and tradeoffs aloud in 3 minutes',
        'Run targeted job compatibility audits before tailoring each application',
      ],
      projectMilestones: [`Polish ${projectRecommendations[2].title} & deploy a live preview or repository if applicable`],
      revisionTasks: ['Tailor resume bullets and summary per target employer'],
      portfolioEvidence: 'Complete portfolio of verified projects ready for technical interviews',
    },
  ];

  // 11. Job-Specific Interview Preparation
  const interviewPrep: InterviewPrepQuestion[] = [];
  const jdLanguages = requirements.filter((r) => r.bucket === 'Programming Languages').map((r) => r.name);
  const jdDatabases = requirements.filter((r) => r.bucket === 'Database Requirements').map((r) => r.name);
  const jdFrameworks = requirements.filter((r) => r.bucket === 'Frameworks and Libraries').map((r) => r.name);
  const primarySkill = jdLanguages[0] || analysis.nlp.skills.found[0]?.name || 'your primary language';
  const secondarySkill = jdFrameworks[0] || priorityMissingSkills[0] || analysis.nlp.skills.found[1]?.name || 'your main framework';
  const dbSkill = jdDatabases[0] || 'relational databases';

  interviewPrep.push(
    {
      id: 'iq-tech-1',
      category: 'Technical Questions',
      difficulty: 'Intermediate',
      question: `In a ${targetRole || 'target'} system using ${primarySkill} and ${secondarySkill}, how do you structure input validation and error handling cleanly across boundaries?`,
      sourceBasis: `Derived from posting focus on ${primarySkill} / ${secondarySkill}`,
      prepGuidance: 'Walk through validation schemas, HTTP status codes, and defensive null/type guards you have implemented.',
    },
    {
      id: 'iq-prog-1',
      category: 'Programming Questions',
      difficulty: 'Beginner',
      question: `Explain memory/time tradeoffs or common pitfalls in ${primarySkill} when processing large collections or async requests.`,
      sourceBasis: `Programming language requirement: ${primarySkill}`,
      prepGuidance: 'Give one concrete code example contrasting an O(n^2) approach with an indexed/hash-map O(n) approach.',
    },
    {
      id: 'iq-db-1',
      category: 'Database Questions',
      difficulty: 'Intermediate',
      question: `How would you design indexes and handle transactional integrity in ${dbSkill} for a write-heavy workflow?`,
      sourceBasis: `Database requirement: ${dbSkill}`,
      prepGuidance: 'Discuss primary/foreign keys, composite index column order, and avoiding N+1 queries.',
    },
    {
      id: 'iq-fw-1',
      category: 'Framework Questions',
      difficulty: 'Intermediate',
      question: `What architectural patterns in ${secondarySkill} keep state predictable and components/services easy to test?`,
      sourceBasis: `Framework / stack requirement: ${secondarySkill}`,
      prepGuidance: 'Reference separation of concerns, dependency injection or hooks, and deterministic unit/integration testing.',
    },
    {
      id: 'iq-proj-1',
      category: 'Project-Based Questions',
      difficulty: 'Intermediate',
      question:
        analysis.nlp.skills.usedInProjects.length > 0
          ? `Walk through a project where you applied ${analysis.nlp.skills.usedInProjects.slice(0, 3).join(', ')}. What bottleneck or design decision proved hardest?`
          : 'Walk through your strongest technical project end-to-end: data flow, edge cases, and what you would redesign today.',
      sourceBasis: 'Derived from your resume Projects section',
      prepGuidance: 'Focus strictly on your personal contributions, real constraints faced, and verified outcomes.',
    },
    {
      id: 'iq-res-1',
      category: 'Resume-Based Questions',
      difficulty: 'Beginner',
      question:
        analysis.nlp.skills.unsubstantiated.length > 0
          ? `Your resume lists ${analysis.nlp.skills.unsubstantiated.slice(0, 2).join(' and ')}. Where have you applied them in practice, and what scope did you build?`
          : `Looking at your experience with ${analysis.nlp.skills.found.slice(0, 3).map((s) => s.name).join(', ') || 'your core tools'}, which bullet best represents your depth?`,
      sourceBasis: 'Derived from your actual resume skills inventory',
      prepGuidance: 'Prepare a 60-second STAR-style explanation backed by exact deliverables.',
    },
    {
      id: 'iq-hr-1',
      category: 'HR Questions',
      difficulty: 'Beginner',
      question: `Why does the ${targetRole || 'target role'} at ${companyName.trim() || 'this organization'} align with your recent projects and next-step goals?`,
      sourceBasis: 'Role & organization context',
      prepGuidance: 'Connect two real strengths from your resume directly to responsibilities mentioned in the job description.',
    },
    {
      id: 'iq-scen-1',
      category: 'Scenario-Based Questions',
      difficulty: 'Advanced',
      question: `Suppose a feature using ${secondarySkill} fails intermittently under concurrent load after deployment. How do you reproduce, isolate, and prevent regression?`,
      sourceBasis: 'Production debugging & reliability scenario',
      prepGuidance: 'Outline logging/telemetry checks, reproducing race conditions, fixing root cause, and adding a regression test.',
    }
  );

  // 12. Final Action Plan
  const strongestAreas = analysis.ats.categories
    .filter((c) => c.score >= 78)
    .slice(0, 4)
    .map((c) => `${c.label} (${c.score}/100)`);

  const bestJobMatches = requirements
    .filter((r) => r.status === 'found-evidenced' || r.status === 'alternative-satisfied')
    .slice(0, 6)
    .map((r) => `${r.name}${r.alternativesGroup ? ` (Satisfies: ${r.alternativesGroup})` : ''}`);

  const criticalSkillGapsList = skillGaps
    .filter((g) => g.bucket === 'Critical Missing Skills' || g.bucket === 'High-Priority Skill Gaps')
    .slice(0, 6)
    .map((g) => g.skillOrRequirement);

  const importantResumeIssues = qualityAudit
    .filter((q) => q.severity === 'high' || q.severity === 'medium')
    .slice(0, 5)
    .map((q) => `${q.dimension} (${q.score}/100): ${q.suggestedCorrection}`);

  const missingPracticalExp = skillGaps
    .filter((g) => g.bucket === 'Missing Practical Experience' || g.bucket === 'Skills Mentioned Without Evidence')
    .slice(0, 5)
    .map((g) => g.skillOrRequirement);

  const immediateNextSteps: string[] = [];
  if (importantResumeIssues.length > 0) {
    immediateNextSteps.push(`1. Address high-impact resume audit items: ${importantResumeIssues[0]}`);
  }
  if (analysis.nlp.skills.unsubstantiated.length > 0) {
    immediateNextSteps.push(
      `2. Strengthen evidence for listed skills (${analysis.nlp.skills.unsubstantiated.slice(0, 3).join(', ')}) inside Experience or Project bullets.`
    );
  }
  if (criticalSkillGapsList.length > 0) {
    immediateNextSteps.push(
      `3. Prioritize learning & building hands-on proof for critical JD gaps: ${criticalSkillGapsList.slice(0, 3).join(', ')}.`
    );
  } else if (!hasJobDescription) {
    immediateNextSteps.push('3. Add a Target Company, Job Title, and Job Description in Section 02 to unlock full job compatibility and gap intelligence.');
  } else {
    immediateNextSteps.push('3. Practice the generated Interview Preparation questions and tailor your resume bullets before applying.');
  }

  return {
    hasJobDescription,
    consistencyWarnings,
    executiveOverview: {
      resumeQualityScore: analysis.ats.overallScore,
      jobCompatibilityScore: baseCompatScore,
      requiredSkillCoverage,
      preferredSkillCoverage,
      identifiedTechnicalSkills: analysis.nlp.skills.found.filter(
        (s) => s.category !== 'Communication' && s.category !== 'Leadership'
      ).length,
      missingJobRequirements: trulyMissingCount,
    },
    requirements,
    existingSkills,
    skillGaps,
    compatibilityDimensions,
    qualityAudit,
    improvementRecommendations,
    projectRecommendations,
    learningRoadmap,
    interviewPrep,
    finalActionPlan: {
      strongestAreas: strongestAreas.length > 0 ? strongestAreas : ['Review ATS Assessment tab for baseline category breakdown.'],
      bestJobMatches,
      criticalSkillGaps: criticalSkillGapsList,
      importantResumeIssues,
      missingPracticalExperience: missingPracticalExp,
      recommendedProjects: projectRecommendations.map((p) => `${p.difficulty}: ${p.title}`),
      learningPriorities: topGaps.slice(0, 4),
      interviewPriorities: interviewPrep.slice(0, 4).map((q) => `${q.category}: ${q.sourceBasis}`),
      immediateNextSteps,
    },
  };
}
