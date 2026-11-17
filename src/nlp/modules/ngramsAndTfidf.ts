import type { KeywordRelevanceItem } from '../../types/resume';
import { removeStopwords, stemWord, tokenizeWords } from './preprocessing';

export function computeWordFrequency(
  tokens: string[],
  limit = 40
): { word: string; stem: string; count: number }[] {
  const contentTokens = removeStopwords(tokens);
  const freqMap = new Map<string, { count: number; stem: string }>();

  for (const tok of contentTokens) {
    const stem = stemWord(tok);
    const existing = freqMap.get(tok);
    if (existing) existing.count += 1;
    else freqMap.set(tok, { count: 1, stem });
  }

  return Array.from(freqMap.entries())
    .map(([word, v]) => ({ word, stem: v.stem, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function extractNgrams(tokens: string[]): {
  bigrams: { phrase: string; count: number }[];
  trigrams: { phrase: string; count: number }[];
} {
  const contentTokens = removeStopwords(tokens);
  const bigramMap = new Map<string, number>();
  const trigramMap = new Map<string, number>();

  for (let i = 0; i < contentTokens.length - 1; i++) {
    const bg = `${contentTokens[i]} ${contentTokens[i + 1]}`;
    bigramMap.set(bg, (bigramMap.get(bg) || 0) + 1);
    if (i < contentTokens.length - 2) {
      const tg = `${contentTokens[i]} ${contentTokens[i + 1]} ${contentTokens[i + 2]}`;
      trigramMap.set(tg, (trigramMap.get(tg) || 0) + 1);
    }
  }

  const bigrams = Array.from(bigramMap.entries())
    .filter(([, count]) => count >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([phrase, count]) => ({ phrase, count }));

  const trigrams = Array.from(trigramMap.entries())
    .filter(([, count]) => count >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([phrase, count]) => ({ phrase, count }));

  return { bigrams, trigrams };
}

export function findDuplicateSentences(sentences: string[]): { sentence: string; count: number }[] {
  const sentenceCounts = new Map<string, { raw: string; count: number }>();
  for (const s of sentences) {
    const key = s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    if (key.length < 20) continue;
    const prev = sentenceCounts.get(key);
    if (prev) prev.count += 1;
    else sentenceCounts.set(key, { raw: s, count: 1 });
  }
  return Array.from(sentenceCounts.values())
    .filter((v) => v.count > 1)
    .map((v) => ({ sentence: v.raw, count: v.count }));
}

export function computeTfIdfCosineSimilarity(
  docAText: string,
  docBText: string
): { similarity: number; topTerms: { term: string; score: number }[] } {
  const tokenizeStemmed = (txt: string) =>
    removeStopwords(tokenizeWords(txt)).map((w) => stemWord(w));

  const tokensA = tokenizeStemmed(docAText);
  const tokensB = tokenizeStemmed(docBText);

  if (tokensA.length === 0 || tokensB.length === 0) {
    return { similarity: 0, topTerms: [] };
  }

  const vocab = Array.from(new Set([...tokensA, ...tokensB]));
  const tfA = new Map<string, number>();
  const tfB = new Map<string, number>();

  for (const t of tokensA) tfA.set(t, (tfA.get(t) || 0) + 1 / tokensA.length);
  for (const t of tokensB) tfB.set(t, (tfB.get(t) || 0) + 1 / tokensB.length);

  let dot = 0;
  let normA = 0;
  let normB = 0;
  const termContributions: { term: string; score: number }[] = [];

  for (const term of vocab) {
    const inA = tfA.has(term) ? 1 : 0;
    const inB = tfB.has(term) ? 1 : 0;
    const df = inA + inB;
    const idf = Math.log((2 + 1) / (df + 0.5)) + 1;
    const wA = (tfA.get(term) || 0) * idf;
    const wB = (tfB.get(term) || 0) * idf;

    dot += wA * wB;
    normA += wA * wA;
    normB += wB * wB;

    if (wA > 0 && wB > 0) {
      termContributions.push({ term, score: Number((wA * wB * 1000).toFixed(2)) });
    }
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  const cosine = denom > 0 ? dot / denom : 0;
  termContributions.sort((a, b) => b.score - a.score);

  return {
    similarity: Math.min(100, Math.round(cosine * 100)),
    topTerms: termContributions.slice(0, 15),
  };
}

/**
 * Computes statistical TF-IDF keyword relevance across detected resume sections.
 * Clearly labeled as lexical TF-IDF term weighting rather than semantic comprehension.
 */
export function computeIntraResumeKeywordRelevance(
  tokens: string[],
  sectionsDetected: Record<string, string>,
  limit = 16
): KeywordRelevanceItem[] {
  const contentTokens = removeStopwords(tokens).filter((t) => t.length >= 3);
  if (contentTokens.length === 0) return [];

  const sectionEntries = Object.entries(sectionsDetected).filter(([, text]) => text.trim().length > 0);
  const docEntries = sectionEntries.length > 0 ? sectionEntries : [['body', contentTokens.join(' ')]];
  const totalDocs = docEntries.length;

  const sectionTokenSets = docEntries.map(([secKey, secText]) => ({
    secKey,
    stemmedSet: new Set(removeStopwords(tokenizeWords(secText)).map((t) => stemWord(t))),
  }));

  const termCounts = new Map<string, { display: string; count: number }>();
  for (const tok of contentTokens) {
    const stem = stemWord(tok);
    const existing = termCounts.get(stem);
    if (existing) {
      existing.count += 1;
    } else {
      termCounts.set(stem, { display: tok, count: 1 });
    }
  }

  const items: KeywordRelevanceItem[] = [];
  for (const [stem, info] of termCounts.entries()) {
    const tf = info.count / contentTokens.length;
    const presentSections = sectionTokenSets
      .filter((s) => s.stemmedSet.has(stem))
      .map((s) => s.secKey);
    const df = Math.max(1, presentSections.length);
    const idf = Math.log((totalDocs + 1) / df) + 1;
    // Slight bonus when keyword is corroborated across experience or projects
    const contextFactor =
      presentSections.includes('experience') || presentSections.includes('projects') ? 1.15 : 1;
    const tfidfScore = Number((tf * idf * contextFactor * 100).toFixed(2));

    items.push({
      keyword: info.display,
      stem,
      count: info.count,
      tfidfScore,
      sections: presentSections,
      method: 'Classical TF-IDF + Section Coverage',
    });
  }

  items.sort((a, b) => b.tfidfScore - a.tfidfScore);
  return items.slice(0, limit);
}
