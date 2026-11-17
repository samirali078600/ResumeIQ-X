import {
  computeTokenStats,
  normalizeText,
  removeStopwords,
  segmentSentences,
  stemWord,
  STOPWORDS,
  tokenizeWords,
} from './modules/preprocessing';
import {
  computeIntraResumeKeywordRelevance,
  computeTfIdfCosineSimilarity,
  computeWordFrequency,
  extractNgrams,
  findDuplicateSentences,
} from './modules/ngramsAndTfidf';
import {
  detectSections,
  extractEntitiesDeterministic,
} from './modules/sectionAndEntities';
import {
  analyzeActionVerbsAndWeakPhrases,
  analyzeBulletQuality,
  analyzeQuantifiedAchievements,
  analyzeSkills,
  STRONG_ACTION_VERBS,
  WEAK_PHRASES,
} from './modules/skillsAndImpact';
import type { CustomSkillEntry, NLPAnalysisResult } from '../types/resume';

export {
  STOPWORDS,
  STRONG_ACTION_VERBS,
  WEAK_PHRASES,
  stemWord,
  normalizeText,
  tokenizeWords,
  removeStopwords,
  segmentSentences,
  detectSections,
  extractEntitiesDeterministic,
  analyzeSkills,
  computeTfIdfCosineSimilarity,
  computeIntraResumeKeywordRelevance,
};

export function runClassicalNlpAnalysis(
  rawText: string,
  customSkills: CustomSkillEntry[] = []
): NLPAnalysisResult {
  const normalized = normalizeText(rawText);
  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Preprocessing: tokenization, sentence segmentation, stopword filtering, readability
  const tokens = tokenizeWords(normalized);
  const sentences = segmentSentences(normalized);
  const tokenStats = computeTokenStats(normalized, tokens, sentences, lines.length);

  // 2. Section Segmentation & Entity Recognition
  const sectionsDetected = detectSections(normalized);
  const entities = extractEntitiesDeterministic(normalized, sectionsDetected);

  // 3. Word Frequency, N-Grams, Duplicate Sentences, TF-IDF Keyword Relevance & Section Cosine
  const wordFrequency = computeWordFrequency(tokens, 40);
  const ngrams = extractNgrams(tokens);
  const duplicateSentences = findDuplicateSentences(sentences);
  const repeatedKeywords = wordFrequency
    .filter((w) => w.count >= 4)
    .map((w) => ({ keyword: w.word, count: w.count }))
    .slice(0, 20);

  const keywordRelevance = computeIntraResumeKeywordRelevance(tokens, sectionsDetected, 16);

  const summaryExperienceCosine =
    sectionsDetected.summary && sectionsDetected.experience
      ? computeTfIdfCosineSimilarity(sectionsDetected.summary, sectionsDetected.experience).similarity
      : null;

  // 4. Skills Extraction, Action Verbs, Weak Phrases, Quantified Achievements & Bullet Audit
  const skills = analyzeSkills(normalized, sectionsDetected, customSkills);
  const { actionVerbs, weakPhrases } = analyzeActionVerbsAndWeakPhrases(tokens, lines);
  const quantifiedAchievements = analyzeQuantifiedAchievements(lines);
  const bulletQuality = analyzeBulletQuality(sectionsDetected);

  return {
    methodLabels: {
      preprocessing: 'Classical Tokenization, Sentence Segmentation, Stopword Removal & Porter-Style Stemming',
      ngrams: 'Adjacent Non-Stopword Bigram & Trigram Sliding-Window Extraction',
      keywordRelevance: 'Statistical TF-IDF Term Weighting Across Detected Sections (Lexical, Not Semantic AI)',
      cosineSimilarity: 'TF-IDF Vector Cosine Similarity Between Summary & Experience Sections',
      entityExtraction: 'Deterministic Regex + Compromise.js POS/NER Heuristics (Editable & Verify-Flagged)',
      skillsMatching: 'Boundary-Aware Exact & Alias Dictionary Matching + Custom Skills (Deterministic)',
      actionVerbsAndAchievements: 'Rule-Based Action Verb Lexicon, Cliché Patterns & Quantitative Metric Regex',
      optionalModel: 'Classical NLP Active (Optional Local Transformers.js Model Not Downloaded)',
    },
    tokenStats,
    wordFrequency,
    keywordRelevance,
    summaryExperienceCosine,
    ngrams,
    duplicateSentences,
    repeatedKeywords,
    actionVerbs,
    weakPhrases,
    quantifiedAchievements,
    bulletQuality,
    sectionsDetected,
    entities,
    skills,
  };
}
