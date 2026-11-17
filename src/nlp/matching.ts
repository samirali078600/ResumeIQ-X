import {
  analyzeSkills,
  STOPWORDS,
  stemWord,
  tokenizeWords,
} from './classicalNlp';
import { computeTfIdfCosineSimilarity } from './modules/ngramsAndTfidf';
import { DEFAULT_SKILLS_DICTIONARY } from './skillsDictionary';
import type {
  CustomSkillEntry,
  JobMatchResult,
  ResumeAnalysisRecord,
} from '../types/resume';

export { computeTfIdfCosineSimilarity };

function extractImportantKeywords(text: string): string[] {
  const tokens = tokenizeWords(text).filter(
    (w) => !STOPWORDS.has(w) && w.length >= 3 && !/^\d+$/.test(w)
  );
  const counts = new Map<string, number>();
  for (const t of tokens) {
    counts.set(t, (counts.get(t) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 35)
    .map(([word]) => word);
}

export function runJobDescriptionMatch(params: {
  analysis: ResumeAnalysisRecord;
  jobTitle?: string;
  company?: string;
  requiredExperience?: string;
  jobLocation?: string;
  jobDescription: string;
  customSkills?: CustomSkillEntry[];
  semanticModelScore?: number;
}): JobMatchResult {
  const {
    analysis,
    jobTitle = '',
    company = '',
    requiredExperience = '',
    jobLocation = '',
    jobDescription,
    customSkills = [],
    semanticModelScore,
  } = params;

  const jdLower = jobDescription.toLowerCase();
  const lines = jobDescription.split('\n').map((l) => l.trim()).filter(Boolean);

  // Split JD into required vs preferred lines heuristically
  const requiredLines: string[] = [];
  const preferredLines: string[] = [];
  let currentBucket: 'required' | 'preferred' = 'required';

  for (const line of lines) {
    if (/^(preferred|nice to have|bonus|plus|optional|desired)/i.test(line)) {
      currentBucket = 'preferred';
    } else if (/^(required|minimum|must have|qualifications|requirements|responsibilities)/i.test(line)) {
      currentBucket = 'required';
    }
    if (currentBucket === 'preferred') preferredLines.push(line);
    else requiredLines.push(line);
  }

  const requiredText = requiredLines.join('\n') || jobDescription;
  const preferredText = preferredLines.join('\n');

  // Extract skills from JD
  const jdAllSkills = analyzeSkills(jobDescription, { summary: jobDescription }, customSkills);
  const jdReqSkills = analyzeSkills(requiredText, { summary: requiredText }, customSkills);
  const jdPrefSkills = preferredText
    ? analyzeSkills(preferredText, { summary: preferredText }, customSkills)
    : { found: [] };

  const resumeSkillNames = new Set(analysis.nlp.skills.found.map((s) => s.name));

  // Also check related-skill dictionary matching (credits partial adjacency)
  const relatedMap = new Map<string, string[]>();
  for (const def of DEFAULT_SKILLS_DICTIONARY) {
    if (def.related) relatedMap.set(def.name, def.related);
  }

  const reqSkillNames = Array.from(new Set(jdReqSkills.found.map((s) => s.name)));
  const prefSkillNames = Array.from(
    new Set(jdPrefSkills.found.map((s) => s.name).filter((n) => !reqSkillNames.includes(n)))
  );

  const allJdSkills = Array.from(new Set(jdAllSkills.found.map((s) => s.name)));
  const matchedSkills = allJdSkills.filter((s) => resumeSkillNames.has(s));
  const missingRequiredSkills = reqSkillNames.filter((s) => !resumeSkillNames.has(s));
  const missingPreferredSkills = prefSkillNames.filter((s) => !resumeSkillNames.has(s));

  // TF-IDF & Cosine Similarity
  const tfidfResult = computeTfIdfCosineSimilarity(analysis.extractedText, jobDescription);

  // Keyword overlap
  const jdKeywords = extractImportantKeywords(jobDescription);
  const resumeTokenSet = new Set(tokenizeWords(analysis.extractedText).map((w) => stemWord(w)));
  const matchedKeywords = jdKeywords.filter((kw) => resumeTokenSet.has(stemWord(kw)));
  const missingKeywords = jdKeywords.filter((kw) => !resumeTokenSet.has(stemWord(kw)));

  const keywordOverlapScore =
    jdKeywords.length > 0 ? Math.round((matchedKeywords.length / jdKeywords.length) * 100) : 0;

  // Skills match score with partial related-skill credit (max 25% of missing skill value)
  let skillsEarned = 0;
  const skillsTotal = Math.max(1, reqSkillNames.length * 1.5 + prefSkillNames.length);
  for (const sk of reqSkillNames) {
    if (resumeSkillNames.has(sk)) {
      skillsEarned += 1.5;
    } else {
      const rel = relatedMap.get(sk) || [];
      if (rel.some((r) => resumeSkillNames.has(r))) skillsEarned += 0.35;
    }
  }
  for (const sk of prefSkillNames) {
    if (resumeSkillNames.has(sk)) skillsEarned += 1;
  }
  const skillsMatchScore =
    allJdSkills.length > 0
      ? Math.min(100, Math.round((skillsEarned / skillsTotal) * 100))
      : keywordOverlapScore;

  // Section-aware relevance (higher score if JD skills appear in Experience or Projects rather than just Skills list)
  const expOrProjSet = new Set([
    ...analysis.nlp.skills.usedInExperience,
    ...analysis.nlp.skills.usedInProjects,
  ]);
  const evidencedMatched = matchedSkills.filter((s) => expOrProjSet.has(s)).length;
  const sectionRelevanceScore =
    matchedSkills.length > 0
      ? Math.round((evidencedMatched / matchedSkills.length) * 100)
      : 0;

  // Evidence snippets from resume
  const resumeLines = analysis.extractedText.split('\n').map((l) => l.trim()).filter(Boolean);
  const relevantEvidence: { skillOrKeyword: string; snippet: string; section: string }[] = [];
  for (const sk of matchedSkills.slice(0, 10)) {
    const matchLine = resumeLines.find((l) => l.toLowerCase().includes(sk.toLowerCase()));
    if (matchLine) {
      let sec = 'Resume Body';
      if (analysis.nlp.sectionsDetected.experience?.includes(matchLine)) sec = 'Experience';
      else if (analysis.nlp.sectionsDetected.projects?.includes(matchLine)) sec = 'Projects';
      else if (analysis.nlp.sectionsDetected.skills?.includes(matchLine)) sec = 'Skills';
      relevantEvidence.push({
        skillOrKeyword: sk,
        snippet: matchLine.length > 160 ? `${matchLine.slice(0, 157)}...` : matchLine,
        section: sec,
      });
    }
  }

  // Experience & Education checks
  const jdExpMatch = jobDescription.match(/(\d+)\+?\s*(?:to\s*\d+\s*)?years?\s+(?:of\s+)?experience/i);
  const reqYears = jdExpMatch ? parseInt(jdExpMatch[1], 10) : null;
  const expDatesCount = analysis.nlp.entities.dates.length;
  const experienceGapNote = requiredExperience
    ? `Target role specifies "${requiredExperience}". Resume contains ${expDatesCount} extracted date markers across ${analysis.nlp.entities.jobTitles.length} detected role title(s). Verify total years manually.`
    : reqYears
      ? `Job description mentions ${reqYears}+ years of experience. Resume contains ${expDatesCount} date markers; confirm timeline coverage.`
      : 'No explicit years-of-experience threshold detected in job description.';

  const jdNeedsDegree = /\b(bachelor|master|ph\.?d|b\.?s\.?|m\.?s\.?|computer science|degree)\b/i.test(
    jdLower
  );
  const hasEdu = analysis.nlp.entities.education.length > 0 || Boolean(analysis.nlp.sectionsDetected.education);
  const educationNote = jdNeedsDegree
    ? hasEdu
      ? 'Job description mentions degree requirements, and your resume includes an Education section / degree entries.'
      : 'Job description mentions degree requirements, but no Education section or degree keywords were detected in the extracted text.'
    : hasEdu
      ? 'Education section detected; job description does not highlight strict degree criteria.'
      : 'No strict degree requirement detected in the job description.';

  // Combined weighted match score
  const baseScore =
    skillsMatchScore * 0.42 +
    keywordOverlapScore * 0.25 +
    tfidfResult.similarity * 0.2 +
    sectionRelevanceScore * 0.13;

  const overallMatchScore =
    typeof semanticModelScore === 'number'
      ? Math.round(baseScore * 0.8 + semanticModelScore * 0.2)
      : Math.round(baseScore);

  const suggestions: string[] = [];
  if (missingRequiredSkills.length > 0) {
    suggestions.push(
      `If you genuinely possess any of these required skills (${missingRequiredSkills.slice(0, 5).join(', ')}), add explicit project or work experience bullets demonstrating them.`
    );
  }
  if (matchedSkills.length > 0 && sectionRelevanceScore < 60) {
    suggestions.push(
      'Several matched skills only appear in a skills list. Describe how you applied them in Experience or Projects to strengthen contextual relevance.'
    );
  }
  if (missingKeywords.length > 0) {
    suggestions.push(
      `Review high-frequency domain terms from the posting (${missingKeywords.slice(0, 6).join(', ')}) and mirror authentic terminology where applicable.`
    );
  }
  if (jobTitle && !analysis.extractedText.toLowerCase().includes(jobTitle.toLowerCase())) {
    suggestions.push(
      `Your resume text does not literally mention the target title "${jobTitle}". Consider aligning your headline or summary if accurate to your background.`
    );
  }

  const methodBreakdown = [
    'TF-IDF + Cosine Similarity (token frequency comparison)',
    'Exact & Alias Skills Dictionary Matching',
    'Keyword Overlap & Section-Aware Evidence Scoring',
  ];
  if (typeof semanticModelScore === 'number') {
    methodBreakdown.push('Local Transformers.js Embedding Similarity');
  }

  return {
    id: `jm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    analysisId: analysis.id,
    resumeName: analysis.fileName,
    jobTitle: jobTitle.trim() || 'Target Role',
    company: company.trim() || 'Target Organization',
    requiredExperience: requiredExperience.trim(),
    jobLocation: jobLocation.trim(),
    jobDescription,
    overallMatchScore: Math.max(0, Math.min(100, overallMatchScore)),
    tfidfCosineSimilarity: tfidfResult.similarity,
    keywordOverlapScore,
    skillsMatchScore,
    sectionRelevanceScore,
    semanticModelScore,
    methodBreakdown,
    requiredKeywords: jdKeywords.slice(0, 18),
    preferredKeywords: jdKeywords.slice(18, 30),
    matchedSkills,
    missingRequiredSkills,
    missingPreferredSkills,
    matchedKeywords,
    missingKeywords,
    relevantEvidence,
    experienceGapNote,
    educationNote,
    suggestions,
    topTfidfTerms: tfidfResult.topTerms,
    createdAt: new Date().toISOString(),
  };
}
