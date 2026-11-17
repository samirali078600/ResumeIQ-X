import type { TokenStats } from '../../types/resume';

export const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as',
  'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can',
  'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
  'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my',
  'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what',
  'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'you', 'your', 'yours',
  'yourself', 'yourselves', 'using', 'used', 'via', 'including', 'within', 'across', 'per', 'etc',
]);

// Lightweight deterministic Porter-inspired suffix stemmer
export function stemWord(word: string): string {
  let w = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (w.length < 4) return w;
  if (w.endsWith('ies') && w.length > 4) w = w.slice(0, -3) + 'y';
  else if (w.endsWith('es') && w.length > 4 && !w.endsWith('ses')) w = w.slice(0, -2);
  else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) w = w.slice(0, -1);

  if (w.endsWith('ing') && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith('ed') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('ment') && w.length > 6) w = w.slice(0, -4);
  else if (w.endsWith('tion') && w.length > 6) w = w.slice(0, -3) + 'e';
  else if (w.endsWith('ly') && w.length > 4) w = w.slice(0, -2);
  return w;
}

export function normalizeText(text: string): string {
  return text
    .replace(/\u2022|\u25CF|\u25E6|\u25AA|\u2013|\u2014/g, (m) =>
      m === '\u2013' || m === '\u2014' ? '-' : '•'
    )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-/\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^[.\-/]+|[.\-/]+$/g, ''))
    .filter((t) => t.length >= 2 && /[a-z0-9]/.test(t));
}

export function removeStopwords(tokens: string[]): string[] {
  return tokens.filter((tok) => !STOPWORDS.has(tok) && !/^\d+$/.test(tok));
}

export function segmentSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replace(/^[\s•\-*]+/, '').trim())
    .filter((s) => s.length >= 12);
}

function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 1;
  if (clean.length <= 3) return 1;
  const vowelGroups = clean.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, vowelGroups ? vowelGroups.length : 1);
}

export function computeTokenStats(
  normalizedText: string,
  tokens: string[],
  sentences: string[],
  linesCount: number
): TokenStats {
  const totalWords = tokens.length;
  const uniqueSet = new Set(tokens);
  const sentenceCount = Math.max(1, sentences.length);
  const avgWordsPerSentence = totalWords / sentenceCount;
  const totalSyllables = tokens.reduce((acc, w) => acc + countSyllables(w), 0);
  const avgSyllablesPerWord = totalWords > 0 ? totalSyllables / totalWords : 1.5;
  const readingGradeLevel = Math.max(
    1,
    Math.min(20, Number((0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59).toFixed(1)))
  );

  return {
    totalChars: normalizedText.length,
    totalWords,
    uniqueWords: uniqueSet.size,
    sentenceCount,
    avgWordsPerSentence: Number(avgWordsPerSentence.toFixed(1)),
    readingGradeLevel,
    vocabularyRichness: totalWords > 0 ? Number(((uniqueSet.size / totalWords) * 100).toFixed(1)) : 0,
    lineCount: linesCount,
  };
}
