export type ThemeMode = 'light' | 'dark' | 'system';

export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive';

export interface UserProfile {
  id: 'local-profile';
  displayName: string;
  careerTarget: string;
  experienceLevel: ExperienceLevel;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  consentToSaveLocal: boolean;
  saveOriginalDocs: boolean;
  nlpModelPreference: 'classical' | 'transformers';
  updatedAt: string;
}

export type EntityConfidence = 'verified' | 'unverified' | 'manual';

export interface EntityMatch {
  id: string;
  value: string;
  confidence: EntityConfidence;
  source: string;
}

export interface ExtractedEntities {
  names: EntityMatch[];
  emails: EntityMatch[];
  phones: EntityMatch[];
  locations: EntityMatch[];
  organizations: EntityMatch[];
  jobTitles: EntityMatch[];
  dates: EntityMatch[];
  education: EntityMatch[];
  certifications: EntityMatch[];
  projects: EntityMatch[];
}

export interface CustomSkillEntry {
  id: string;
  name: string;
  category: SkillCategory;
  aliases: string[];
  createdAt: string;
}

export type SkillCategory =
  | 'Programming Languages'
  | 'Frontend Development'
  | 'Backend Development'
  | 'Frameworks'
  | 'Databases'
  | 'Cloud Platforms'
  | 'DevOps'
  | 'Testing'
  | 'Developer Tools'
  | 'Data Science'
  | 'Cybersecurity'
  | 'Design'
  | 'Communication'
  | 'Leadership'
  | 'Problem-Solving';

export interface FoundSkill {
  name: string;
  category: SkillCategory;
  count: number;
  sections: string[];
  hasEvidence: boolean;
  isCustom?: boolean;
}

export interface SkillsAnalysis {
  found: FoundSkill[];
  repeated: { name: string; count: number; category: SkillCategory }[];
  usedInProjects: string[];
  usedInExperience: string[];
  unsubstantiated: string[];
  byCategory: Record<string, string[]>;
  customSkillsApplied: string[];
}

export interface BulletQualityItem {
  text: string;
  section: string;
  hasActionVerb: boolean;
  actionVerbFound?: string;
  hasQuantifiedResult: boolean;
  quantifiedMatches: string[];
  weakPhrases: string[];
  wordCount: number;
  issues: string[];
}

export interface TokenStats {
  totalChars: number;
  totalWords: number;
  uniqueWords: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  readingGradeLevel: number;
  vocabularyRichness: number;
  lineCount: number;
}

export interface KeywordRelevanceItem {
  keyword: string;
  stem: string;
  count: number;
  tfidfScore: number;
  sections: string[];
  method: string;
}

export interface NLPAnalysisResult {
  methodLabels: {
    preprocessing: string;
    ngrams?: string;
    keywordRelevance?: string;
    cosineSimilarity?: string;
    entityExtraction: string;
    skillsMatching: string;
    actionVerbsAndAchievements?: string;
    optionalModel: string;
  };
  tokenStats: TokenStats;
  wordFrequency: { word: string; stem: string; count: number }[];
  keywordRelevance?: KeywordRelevanceItem[];
  summaryExperienceCosine?: number | null;
  ngrams: {
    bigrams: { phrase: string; count: number }[];
    trigrams: { phrase: string; count: number }[];
  };
  duplicateSentences: { sentence: string; count: number }[];
  repeatedKeywords: { keyword: string; count: number }[];
  actionVerbs: { verb: string; count: number }[];
  weakPhrases: { phrase: string; context: string }[];
  quantifiedAchievements: { text: string; metrics: string[] }[];
  bulletQuality: BulletQualityItem[];
  sectionsDetected: Record<string, string>;
  entities: ExtractedEntities;
  skills: SkillsAnalysis;
  transformersModelResult?: {
    enabled: boolean;
    modelId: string;
    status: string;
    fallbackReason?: string;
    topConcepts?: { label: string; similarity: number }[];
  };
}

export interface ATSWeights {
  contactInfo: number;
  resumeStructure: number;
  professionalSummary: number;
  workExperience: number;
  education: number;
  skills: number;
  projects: number;
  certifications: number;
  achievements: number;
  keywordRelevance: number;
  readability: number;
  formattingIndicators: number;
  dateConsistency: number;
  bulletQuality: number;
}

export interface ATSCategoryScore {
  key: keyof ATSWeights;
  label: string;
  score: number;
  maxScore: number;
  weight: number;
  weightedContribution: number;
  status: 'strong' | 'fair' | 'needs-work' | 'missing';
  details: string;
  evidence: string[];
}

export interface ATSSuggestion {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  completed?: boolean;
}

export interface ATSScoreResult {
  overallScore: number;
  disclaimer: string;
  categories: ATSCategoryScore[];
  strengths: string[];
  weaknesses: string[];
  missingSections: string[];
  suggestions: ATSSuggestion[];
}

export interface ResumeAnalysisRecord {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'docx' | 'txt' | 'builder';
  extractedText: string;
  pageCount?: number;
  parsingWarnings: string[];
  createdAt: string;
  updatedAt: string;
  nlp: NLPAnalysisResult;
  ats: ATSScoreResult;
  weightsUsed: ATSWeights;
  savedOriginalBase64?: string;
}

export interface JobMatchResult {
  id: string;
  analysisId?: string;
  resumeName: string;
  jobTitle: string;
  company: string;
  requiredExperience: string;
  jobLocation: string;
  jobDescription: string;
  overallMatchScore: number;
  tfidfCosineSimilarity: number;
  keywordOverlapScore: number;
  skillsMatchScore: number;
  sectionRelevanceScore: number;
  semanticModelScore?: number;
  methodBreakdown: string[];
  requiredKeywords: string[];
  preferredKeywords: string[];
  matchedSkills: string[];
  missingRequiredSkills: string[];
  missingPreferredSkills: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  relevantEvidence: { skillOrKeyword: string; snippet: string; section: string }[];
  experienceGapNote: string;
  educationNote: string;
  suggestions: string[];
  topTfidfTerms: { term: string; score: number }[];
  createdAt: string;
}

export type TemplateId =
  | 'modern-professional'
  | 'minimal-ats'
  | 'classic-corporate'
  | 'technical-developer'
  | 'fresh-graduate'
  | 'creative-professional';

export type BuilderSectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'achievements'
  | 'languages'
  | 'custom';

export interface BuilderExperience {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface BuilderEducation {
  id: string;
  degree: string;
  institution: string;
  location: string;
  graduationDate: string;
  gpaOrHonors: string;
}

export interface BuilderProject {
  id: string;
  name: string;
  roleOrTech: string;
  link: string;
  description: string;
  bullets: string[];
}

export interface ResumeBuilderData {
  id: string;
  title: string;
  templateId: TemplateId;
  fontFamily: 'sans' | 'serif' | 'mono';
  accentColor: string;
  pageMargin: 'compact' | 'standard' | 'spacious';
  sectionOrder: BuilderSectionKey[];
  personal: {
    fullName: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website: string;
  };
  summary: string;
  experience: BuilderExperience[];
  education: BuilderEducation[];
  skills: { id: string; category: string; items: string[] }[];
  projects: BuilderProject[];
  certifications: { id: string; name: string; issuer: string; date: string }[];
  achievements: { id: string; title: string; description: string }[];
  languages: { id: string; language: string; proficiency: string }[];
  customSections: { id: string; title: string; items: string[] }[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export type CoverLetterTone =
  | 'professional'
  | 'confident'
  | 'concise'
  | 'entry-level'
  | 'technical';

export interface CoverLetterRecord {
  id: string;
  title: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateLocation: string;
  jobTitle: string;
  company: string;
  tone: CoverLetterTone;
  resumeId?: string;
  jobDescription: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogItem {
  id: string;
  type: 'analysis' | 'job-match' | 'builder' | 'cover-letter' | 'export' | 'settings';
  title: string;
  detail: string;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}

export interface LocalAccount {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface AuthSession {
  accountId: string;
  fullName: string;
  email: string;
  signedInAt: string;
}
