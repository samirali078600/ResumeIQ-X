import type {
  ATSCategoryScore,
  ATSScoreResult,
  ATSSuggestion,
  ATSWeights,
  NLPAnalysisResult,
} from '../types/resume';

export const DEFAULT_ATS_WEIGHTS: ATSWeights = {
  contactInfo: 8,
  resumeStructure: 8,
  professionalSummary: 6,
  workExperience: 16,
  education: 7,
  skills: 12,
  projects: 7,
  certifications: 4,
  achievements: 5,
  keywordRelevance: 8,
  readability: 5,
  formattingIndicators: 5,
  dateConsistency: 4,
  bulletQuality: 5,
};

export const ATS_CATEGORY_LABELS: Record<keyof ATSWeights, string> = {
  contactInfo: 'Contact Information',
  resumeStructure: 'Resume Structure',
  professionalSummary: 'Professional Summary',
  workExperience: 'Work Experience',
  education: 'Education',
  skills: 'Skills Coverage',
  projects: 'Projects',
  certifications: 'Certifications',
  achievements: 'Quantified Achievements',
  keywordRelevance: 'Keyword Density & Variety',
  readability: 'Readability',
  formattingIndicators: 'Formatting Indicators',
  dateConsistency: 'Date Consistency',
  bulletQuality: 'Bullet Point Quality',
};

export const ATS_DISCLAIMER =
  'Transparent Heuristic Estimate: This ATS score is computed locally from deterministic rules (section completeness, contact parseability, bullet quality, quantified outcomes, and readability). Automated Applicant Tracking Systems vary widely by employer and recruiter configuration; no score can guarantee screening passage or interviews.';

export function normalizeWeights(weights: ATSWeights): ATSWeights {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (sum <= 0) return { ...DEFAULT_ATS_WEIGHTS };
  const normalized = { ...weights };
  (Object.keys(weights) as (keyof ATSWeights)[]).forEach((k) => {
    normalized[k] = Number(((weights[k] / sum) * 100).toFixed(2));
  });
  return normalized;
}

function classifyStatus(score: number): ATSCategoryScore['status'] {
  if (score >= 80) return 'strong';
  if (score >= 55) return 'fair';
  if (score > 0) return 'needs-work';
  return 'missing';
}

export function calculateATSScore(
  rawText: string,
  nlp: NLPAnalysisResult,
  customWeights: ATSWeights = DEFAULT_ATS_WEIGHTS
): ATSScoreResult {
  const weights = normalizeWeights(customWeights);
  const { entities, sectionsDetected, skills, tokenStats, bulletQuality, quantifiedAchievements, duplicateSentences } = nlp;

  const categories: ATSCategoryScore[] = [];
  const missingSections: string[] = [];
  const suggestions: ATSSuggestion[] = [];

  // 1. Contact Information
  let contactScore = 0;
  const contactEvidence: string[] = [];
  if (entities.emails.length > 0) {
    contactScore += 35;
    contactEvidence.push(`Email found (${entities.emails[0].value})`);
  }
  if (entities.phones.length > 0) {
    contactScore += 25;
    contactEvidence.push(`Phone found (${entities.phones[0].value})`);
  }
  if (entities.names.length > 0) {
    contactScore += 20;
    contactEvidence.push(`Name candidate (${entities.names[0].value})`);
  }
  if (entities.locations.length > 0) {
    contactScore += 10;
    contactEvidence.push(`Location detected (${entities.locations[0].value})`);
  }
  if (/linkedin\.com|github\.com|portfolio|https?:\/\//i.test(rawText)) {
    contactScore += 10;
    contactEvidence.push('Professional profile / portfolio URL present');
  }
  categories.push({
    key: 'contactInfo',
    label: ATS_CATEGORY_LABELS.contactInfo,
    score: Math.min(100, contactScore),
    maxScore: 100,
    weight: weights.contactInfo,
    weightedContribution: Number(((Math.min(100, contactScore) * weights.contactInfo) / 100).toFixed(2)),
    status: classifyStatus(contactScore),
    details:
      contactScore >= 80
        ? 'Essential contact channels (email, phone, name) are cleanly parseable.'
        : 'Missing one or more standard contact fields (email, phone, name, or location).',
    evidence: contactEvidence.length > 0 ? contactEvidence : ['No contact details parsed'],
  });
  if (entities.emails.length === 0) {
    suggestions.push({
      id: 'sug-email',
      title: 'Add a plain-text email address',
      description: 'No email address was parsed. Ensure your email is text-selectable in the top header rather than embedded in an image.',
      priority: 'high',
      category: 'Contact Information',
    });
  }

  // 2. Resume Structure
  const expectedCore = ['experience', 'education', 'skills'];
  const presentCore = expectedCore.filter((k) => Boolean(sectionsDetected[k]));
  const optionalSec = ['summary', 'projects', 'certifications', 'achievements'].filter((k) =>
    Boolean(sectionsDetected[k])
  );
  const structureScore = Math.min(100, Math.round((presentCore.length / 3) * 75 + Math.min(25, optionalSec.length * 8)));
  expectedCore.forEach((sec) => {
    if (!sectionsDetected[sec]) missingSections.push(sec.charAt(0).toUpperCase() + sec.slice(1));
  });
  if (!sectionsDetected.summary) missingSections.push('Professional Summary');
  categories.push({
    key: 'resumeStructure',
    label: ATS_CATEGORY_LABELS.resumeStructure,
    score: structureScore,
    maxScore: 100,
    weight: weights.resumeStructure,
    weightedContribution: Number(((structureScore * weights.resumeStructure) / 100).toFixed(2)),
    status: classifyStatus(structureScore),
    details: `Detected ${Object.keys(sectionsDetected).filter((k) => k !== 'header').length} distinct resume sections.`,
    evidence: Object.keys(sectionsDetected).filter((k) => k !== 'header'),
  });

  // 3. Professional Summary
  const sumText = sectionsDetected.summary || '';
  const sumWords = sumText ? sumText.split(/\s+/).filter(Boolean).length : 0;
  let sumScore = 0;
  if (sumWords >= 25 && sumWords <= 90) sumScore = 100;
  else if (sumWords >= 12) sumScore = 72;
  else if (sumWords > 0) sumScore = 45;
  categories.push({
    key: 'professionalSummary',
    label: ATS_CATEGORY_LABELS.professionalSummary,
    score: sumScore,
    maxScore: 100,
    weight: weights.professionalSummary,
    weightedContribution: Number(((sumScore * weights.professionalSummary) / 100).toFixed(2)),
    status: classifyStatus(sumScore),
    details:
      sumWords > 0
        ? `Summary section has ${sumWords} words (recommended 25–85 concise words).`
        : 'No dedicated Professional Summary or Objective heading detected.',
    evidence: sumWords > 0 ? [`${sumWords} words in summary`] : ['Section not found'],
  });
  if (sumScore < 60) {
    suggestions.push({
      id: 'sug-summary',
      title: 'Include a concise 2–4 sentence Professional Summary',
      description: 'Add a focused summary near the top stating your role focus, years of domain focus, and core technical/functional strengths.',
      priority: 'medium',
      category: 'Professional Summary',
    });
  }

  // 4. Work Experience
  const expText = sectionsDetected.experience || '';
  const expWords = expText ? expText.split(/\s+/).filter(Boolean).length : 0;
  const expBullets = bulletQuality.filter((b) => b.section === 'experience');
  let expScore = 0;
  if (expWords > 0) {
    expScore += 40;
    if (expWords >= 120) expScore += 25;
    else if (expWords >= 50) expScore += 15;
    if (expBullets.length >= 4) expScore += 20;
    else if (expBullets.length >= 1) expScore += 10;
    if (entities.jobTitles.length > 0 || entities.organizations.length > 0) expScore += 15;
  }
  categories.push({
    key: 'workExperience',
    label: ATS_CATEGORY_LABELS.workExperience,
    score: Math.min(100, expScore),
    maxScore: 100,
    weight: weights.workExperience,
    weightedContribution: Number(((Math.min(100, expScore) * weights.workExperience) / 100).toFixed(2)),
    status: classifyStatus(expScore),
    details:
      expWords > 0
        ? `${expWords} words, ${expBullets.length} parsed experience bullets, ${entities.jobTitles.length} role titles.`
        : 'No Work Experience section detected.',
    evidence: expWords > 0 ? [`${expWords} words`, `${expBullets.length} bullets`] : ['Section missing'],
  });
  if (expScore < 60) {
    suggestions.push({
      id: 'sug-experience',
      title: 'Strengthen Work Experience section depth',
      description: 'Use a standard "Work Experience" or "Experience" heading with clear job titles, organizations, dates, and 3–5 bullet points per role.',
      priority: 'high',
      category: 'Work Experience',
    });
  }

  // 5. Education
  const hasEduSec = Boolean(sectionsDetected.education);
  const eduCount = entities.education.length;
  const eduScore = hasEduSec ? (eduCount > 0 ? 100 : 70) : eduCount > 0 ? 65 : 0;
  categories.push({
    key: 'education',
    label: ATS_CATEGORY_LABELS.education,
    score: eduScore,
    maxScore: 100,
    weight: weights.education,
    weightedContribution: Number(((eduScore * weights.education) / 100).toFixed(2)),
    status: classifyStatus(eduScore),
    details: hasEduSec
      ? `Education section detected with ${eduCount} degree/institution match(es).`
      : 'No standard Education heading detected.',
    evidence: entities.education.slice(0, 3).map((e) => e.value),
  });

  // 6. Skills
  const skillCount = skills.found.length;
  const evidencedCount = skills.found.filter((s) => s.hasEvidence).length;
  let skillsScore = 0;
  if (skillCount >= 12 && evidencedCount >= 5) skillsScore = 100;
  else if (skillCount >= 8) skillsScore = 82;
  else if (skillCount >= 4) skillsScore = 62;
  else if (skillCount > 0) skillsScore = 35;
  categories.push({
    key: 'skills',
    label: ATS_CATEGORY_LABELS.skills,
    score: skillsScore,
    maxScore: 100,
    weight: weights.skills,
    weightedContribution: Number(((skillsScore * weights.skills) / 100).toFixed(2)),
    status: classifyStatus(skillsScore),
    details: `${skillCount} dictionary/custom skills found across ${Object.keys(skills.byCategory).length} categories (${evidencedCount} backed by experience/project context).`,
    evidence: skills.found.slice(0, 6).map((s) => `${s.name} (${s.count}x)`),
  });
  if (skills.unsubstantiated.length > 3) {
    suggestions.push({
      id: 'sug-unsub-skills',
      title: 'Demonstrate listed skills in Experience or Projects',
      description: `${skills.unsubstantiated.length} skills (${skills.unsubstantiated.slice(0, 4).join(', ')}) appear without supporting usage in Experience or Projects.`,
      priority: 'medium',
      category: 'Skills Coverage',
    });
  }

  // 7. Projects
  const projText = sectionsDetected.projects || '';
  const projWords = projText ? projText.split(/\s+/).filter(Boolean).length : 0;
  const projScore = projWords >= 40 ? 100 : projWords >= 15 ? 70 : projWords > 0 ? 45 : 0;
  categories.push({
    key: 'projects',
    label: ATS_CATEGORY_LABELS.projects,
    score: projScore,
    maxScore: 100,
    weight: weights.projects,
    weightedContribution: Number(((projScore * weights.projects) / 100).toFixed(2)),
    status: classifyStatus(projScore),
    details:
      projWords > 0
        ? `Projects section includes ${projWords} words and ${skills.usedInProjects.length} demonstrated skills.`
        : 'No dedicated Projects section found (especially valuable for technical and early-career resumes).',
    evidence: entities.projects.slice(0, 3).map((p) => p.value),
  });

  // 8. Certifications
  const certCount = entities.certifications.length;
  const certSec = Boolean(sectionsDetected.certifications);
  const certScore = certSec && certCount > 0 ? 100 : certCount > 0 ? 75 : certSec ? 50 : 0;
  categories.push({
    key: 'certifications',
    label: ATS_CATEGORY_LABELS.certifications,
    score: certScore,
    maxScore: 100,
    weight: weights.certifications,
    weightedContribution: Number(((certScore * weights.certifications) / 100).toFixed(2)),
    status: classifyStatus(certScore),
    details:
      certCount > 0
        ? `${certCount} certification/credential reference(s) detected.`
        : 'No certifications section or verified credential pattern detected.',
    evidence: entities.certifications.slice(0, 3).map((c) => c.value),
  });

  // 9. Achievements (Quantified impact)
  const qCount = quantifiedAchievements.length;
  const achScore = qCount >= 5 ? 100 : qCount >= 3 ? 80 : qCount >= 1 ? 55 : 15;
  categories.push({
    key: 'achievements',
    label: ATS_CATEGORY_LABELS.achievements,
    score: achScore,
    maxScore: 100,
    weight: weights.achievements,
    weightedContribution: Number(((achScore * weights.achievements) / 100).toFixed(2)),
    status: classifyStatus(achScore),
    details: `${qCount} line(s) contain quantified metrics (percentages, dollar impact, scale, or multipliers).`,
    evidence: quantifiedAchievements.slice(0, 3).map((a) => a.metrics.join(', ')),
  });
  if (qCount < 3) {
    suggestions.push({
      id: 'sug-quantify',
      title: 'Quantify more achievements with concrete metrics',
      description: 'Only a few measurable results were detected. Where truthful, add percentages, time savings, user scale, or revenue/cost figures.',
      priority: 'high',
      category: 'Quantified Achievements',
    });
  }

  // 10. Keyword Relevance & Diversity
  const richness = tokenStats.vocabularyRichness;
  const verbVariety = nlp.actionVerbs.length;
  let kwScore = 0;
  if (verbVariety >= 8 && richness >= 35) kwScore = 95;
  else if (verbVariety >= 5) kwScore = 75;
  else if (verbVariety >= 2) kwScore = 50;
  else kwScore = 25;
  if (nlp.repeatedKeywords.length > 10) kwScore = Math.max(30, kwScore - 15);
  categories.push({
    key: 'keywordRelevance',
    label: ATS_CATEGORY_LABELS.keywordRelevance,
    score: kwScore,
    maxScore: 100,
    weight: weights.keywordRelevance,
    weightedContribution: Number(((kwScore * weights.keywordRelevance) / 100).toFixed(2)),
    status: classifyStatus(kwScore),
    details: `${verbVariety} distinct strong action verbs; ${richness}% lexical vocabulary richness.`,
    evidence: nlp.actionVerbs.slice(0, 5).map((v) => v.verb),
  });

  // 11. Readability
  const words = tokenStats.totalWords;
  const grade = tokenStats.readingGradeLevel;
  let readScore = 70;
  if (words >= 250 && words <= 1100 && grade >= 8 && grade <= 15) readScore = 95;
  else if (words < 150) readScore = 40;
  else if (words > 1500) readScore = 60;
  categories.push({
    key: 'readability',
    label: ATS_CATEGORY_LABELS.readability,
    score: readScore,
    maxScore: 100,
    weight: weights.readability,
    weightedContribution: Number(((readScore * weights.readability) / 100).toFixed(2)),
    status: classifyStatus(readScore),
    details: `${words} total words; Flesch-Kincaid Grade Level ${grade}; average ${tokenStats.avgWordsPerSentence} words/sentence.`,
    evidence: [`${words} words`, `FK Grade ${grade}`],
  });

  // 12. Formatting Indicators
  const bulletLines = (rawText.match(/^\s*[•\-*]/gm) || []).length;
  let fmtScore = 65;
  if (bulletLines >= 6) fmtScore += 25;
  else if (bulletLines >= 2) fmtScore += 10;
  if (duplicateSentences.length === 0) fmtScore += 10;
  else fmtScore -= Math.min(25, duplicateSentences.length * 10);
  fmtScore = Math.max(20, Math.min(100, fmtScore));
  categories.push({
    key: 'formattingIndicators',
    label: ATS_CATEGORY_LABELS.formattingIndicators,
    score: fmtScore,
    maxScore: 100,
    weight: weights.formattingIndicators,
    weightedContribution: Number(((fmtScore * weights.formattingIndicators) / 100).toFixed(2)),
    status: classifyStatus(fmtScore),
    details: `${bulletLines} explicit bullet lines detected; ${duplicateSentences.length} duplicate sentence(s).`,
    evidence: [`${bulletLines} bullets`, `${duplicateSentences.length} duplicates`],
  });

  // 13. Date Consistency
  const dateCount = entities.dates.length;
  const dateScore = dateCount >= 4 ? 95 : dateCount >= 2 ? 75 : dateCount === 1 ? 45 : 15;
  categories.push({
    key: 'dateConsistency',
    label: ATS_CATEGORY_LABELS.dateConsistency,
    score: dateScore,
    maxScore: 100,
    weight: weights.dateConsistency,
    weightedContribution: Number(((dateScore * weights.dateConsistency) / 100).toFixed(2)),
    status: classifyStatus(dateScore),
    details:
      dateCount > 0
        ? `${dateCount} chronological date/range marker(s) parsed.`
        : 'No clear role or graduation dates detected.',
    evidence: entities.dates.slice(0, 4).map((d) => d.value),
  });
  if (dateCount < 2) {
    suggestions.push({
      id: 'sug-dates',
      title: 'Add clear Month Year date ranges',
      description: 'Use consistent formatting such as "Jan 2022 – Present" for work history and graduation years for education.',
      priority: 'medium',
      category: 'Date Consistency',
    });
  }

  // 14. Bullet Point Quality
  const totalBullets = bulletQuality.length;
  const strongBullets = bulletQuality.filter(
    (b) => b.hasActionVerb && b.weakPhrases.length === 0
  ).length;
  const bQualityScore =
    totalBullets > 0
      ? Math.round((strongBullets / totalBullets) * 75 + (quantifiedAchievements.length > 0 ? 25 : 0))
      : 35;
  categories.push({
    key: 'bulletQuality',
    label: ATS_CATEGORY_LABELS.bulletQuality,
    score: Math.min(100, bQualityScore),
    maxScore: 100,
    weight: weights.bulletQuality,
    weightedContribution: Number(((Math.min(100, bQualityScore) * weights.bulletQuality) / 100).toFixed(2)),
    status: classifyStatus(bQualityScore),
    details:
      totalBullets > 0
        ? `${strongBullets} of ${totalBullets} analyzed bullets begin with strong action verbs and avoid weak clichés.`
        : 'Few structured bullet statements found for quality auditing.',
    evidence: [`${strongBullets}/${totalBullets} strong bullets`],
  });
  if (nlp.weakPhrases.length > 0) {
    suggestions.push({
      id: 'sug-weak-phrases',
      title: 'Replace passive or cliché phrases with action verbs',
      description: `Found ${nlp.weakPhrases.length} weak phrase(s) such as "${nlp.weakPhrases[0].phrase}". Lead bullets with direct verbs like Built, Reduced, Led, or Automated.`,
      priority: 'medium',
      category: 'Bullet Point Quality',
    });
  }

  const overallScore = Math.round(
    categories.reduce((acc, c) => acc + c.weightedContribution, 0)
  );

  const strengths = categories
    .filter((c) => c.score >= 78)
    .map((c) => `${c.label} (${c.score}/100): ${c.details}`);

  const weaknesses = categories
    .filter((c) => c.score < 55)
    .map((c) => `${c.label} (${c.score}/100): ${c.details}`);

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    disclaimer: ATS_DISCLAIMER,
    categories,
    strengths,
    weaknesses,
    missingSections: Array.from(new Set(missingSections)),
    suggestions,
  };
}
