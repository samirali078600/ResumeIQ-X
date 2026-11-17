import { DEFAULT_SKILLS_DICTIONARY, type SkillDefinition } from '../skillsDictionary';
import { tokenizeWords } from './preprocessing';
import type {
  BulletQualityItem,
  CustomSkillEntry,
  FoundSkill,
  SkillsAnalysis,
} from '../../types/resume';

export const STRONG_ACTION_VERBS = new Set([
  'accelerated', 'achieved', 'administered', 'analyzed', 'architected', 'automated', 'built',
  'championed', 'collaborated', 'consolidated', 'coordinated', 'created', 'customized', 'decreased',
  'delivered', 'deployed', 'designed', 'developed', 'devised', 'diagnosed', 'directed', 'drove',
  'eliminated', 'engineered', 'enhanced', 'established', 'evaluated', 'executed', 'expanded',
  'expedited', 'facilitated', 'formulated', 'founded', 'generated', 'governed', 'guided',
  'implemented', 'improved', 'increased', 'influenced', 'initiated', 'innovated', 'instituted',
  'integrated', 'introduced', 'launched', 'led', 'maintained', 'managed', 'maximized', 'mentored',
  'migrated', 'minimized', 'modernized', 'monitored', 'negotiated', 'optimized', 'orchestrated',
  'organized', 'overhauled', 'owned', 'partnered', 'pioneered', 'planned', 'prepared', 'presented',
  'prioritized', 'produced', 'programmed', 'projected', 'published', 'rebuilt', 'reconciled',
  'redesigned', 'reduced', 'refactored', 'refined', 'remediated', 'resolved', 'restructured',
  'revamped', 'reviewed', 'scaled', 'scheduled', 'secured', 'shaped', 'simplified', 'solved',
  'spearheaded', 'standardized', 'streamlined', 'strengthened', 'structured', 'supervised',
  'supported', 'surpassed', 'tested', 'trained', 'transformed', 'troubleshot', 'unified',
  'upgraded', 'validated', 'verified',
]);

export const WEAK_PHRASES = [
  'responsible for',
  'duties included',
  'helped with',
  'worked on',
  'assisted with',
  'tasked with',
  'in charge of',
  'participated in',
  'dealt with',
  'handled various',
  'hardworking',
  'self-starter',
  'team player',
  'detail-oriented',
  'go-getter',
  'think outside the box',
  'synergy',
  'rockstar',
  'ninja',
  'guru',
];

const QUANTIFIED_METRIC_REGEX =
  /(?:\$\s?\d[\d,.]*[kmbKMB]?|\d+(?:\.\d+)?%|\b\d+(?:\.\d+)?x\b|\b\d+(?:\.\d+)?[kKmMbB]\+?\b|\b\d[\d,]*\+|\b(?:increased|reduced|improved|saved|grew|scaled|delivered|served|managed|led|cutting)\b[^.\n]{0,40}\b\d+(?:\.\d+)?\b)/gi;

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countSkillOccurrences(text: string, term: string): number {
  const escaped = escapeRegex(term.trim());
  if (!escaped) return 0;
  const startBoundary = /^[a-zA-Z0-9]/.test(term) ? '(?<![a-zA-Z0-9])' : '(?<!\\S)';
  const endBoundary = /[a-zA-Z0-9]$/.test(term) ? '(?![a-zA-Z0-9])' : '(?!\\S)';
  try {
    const regex = new RegExp(`${startBoundary}${escaped}${endBoundary}`, 'gi');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}

export function analyzeSkills(
  text: string,
  sections: Record<string, string>,
  customSkills: CustomSkillEntry[] = []
): SkillsAnalysis {
  const combinedDict: (SkillDefinition & { isCustom?: boolean })[] = [
    ...DEFAULT_SKILLS_DICTIONARY,
    ...customSkills.map((c) => ({
      name: c.name,
      category: c.category,
      aliases: c.aliases,
      isCustom: true,
    })),
  ];

  const found: FoundSkill[] = [];
  const usedInProjects: string[] = [];
  const usedInExperience: string[] = [];
  const unsubstantiated: string[] = [];
  const byCategory: Record<string, string[]> = {};
  const customSkillsApplied: string[] = [];

  const expText = sections.experience || '';
  const projText = sections.projects || '';
  const sumText = sections.summary || '';

  for (const def of combinedDict) {
    const terms = [def.name, ...(def.aliases || [])];
    let totalCount = 0;
    for (const term of terms) {
      totalCount += countSkillOccurrences(text, term);
    }

    if (totalCount > 0) {
      const presentSections: string[] = [];
      for (const [secKey, secContent] of Object.entries(sections)) {
        const secHits = terms.reduce((acc, t) => acc + countSkillOccurrences(secContent, t), 0);
        if (secHits > 0) presentSections.push(secKey);
      }

      const inExp = terms.some((t) => countSkillOccurrences(expText, t) > 0);
      const inProj = terms.some((t) => countSkillOccurrences(projText, t) > 0);
      const inSum = terms.some((t) => countSkillOccurrences(sumText, t) > 0);
      const hasEvidence = inExp || inProj || inSum;

      if (inExp) usedInExperience.push(def.name);
      if (inProj) usedInProjects.push(def.name);
      if (!inExp && !inProj) unsubstantiated.push(def.name);

      if (!byCategory[def.category]) byCategory[def.category] = [];
      if (!byCategory[def.category].includes(def.name)) {
        byCategory[def.category].push(def.name);
      }

      if (def.isCustom) customSkillsApplied.push(def.name);

      found.push({
        name: def.name,
        category: def.category,
        count: totalCount,
        sections: presentSections,
        hasEvidence,
        isCustom: def.isCustom,
      });
    }
  }

  found.sort((a, b) => b.count - a.count);

  const repeated = found
    .filter((s) => s.count >= 2)
    .map((s) => ({ name: s.name, count: s.count, category: s.category }));

  return {
    found,
    repeated,
    usedInProjects: Array.from(new Set(usedInProjects)),
    usedInExperience: Array.from(new Set(usedInExperience)),
    unsubstantiated: Array.from(new Set(unsubstantiated)),
    byCategory,
    customSkillsApplied: Array.from(new Set(customSkillsApplied)),
  };
}

export function analyzeActionVerbsAndWeakPhrases(
  tokens: string[],
  lines: string[]
): {
  actionVerbs: { verb: string; count: number }[];
  weakPhrases: { phrase: string; context: string }[];
} {
  const verbMap = new Map<string, number>();
  for (const tok of tokens) {
    if (STRONG_ACTION_VERBS.has(tok)) {
      verbMap.set(tok, (verbMap.get(tok) || 0) + 1);
    }
  }
  const actionVerbs = Array.from(verbMap.entries())
    .map(([verb, count]) => ({ verb, count }))
    .sort((a, b) => b.count - a.count);

  const weakPhrases: { phrase: string; context: string }[] = [];
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    for (const wp of WEAK_PHRASES) {
      if (lowerLine.includes(wp)) {
        weakPhrases.push({ phrase: wp, context: line });
      }
    }
  }

  return { actionVerbs, weakPhrases };
}

export function analyzeQuantifiedAchievements(
  lines: string[]
): { text: string; metrics: string[] }[] {
  const quantifiedAchievements: { text: string; metrics: string[] }[] = [];
  for (const line of lines) {
    if (line.length < 15) continue;
    const matches = line.match(QUANTIFIED_METRIC_REGEX);
    if (matches && matches.length > 0) {
      const nonYearMetrics = matches.filter((m) => !/^(19|20)\d{2}$/.test(m.trim()));
      if (nonYearMetrics.length > 0) {
        quantifiedAchievements.push({
          text: line.replace(/^[\s•\-*]+/, ''),
          metrics: Array.from(new Set(nonYearMetrics)),
        });
      }
    }
  }
  return quantifiedAchievements;
}

export function analyzeBulletQuality(
  sectionsDetected: Record<string, string>
): BulletQualityItem[] {
  const bulletQuality: BulletQualityItem[] = [];
  const checkBulletSections = ['experience', 'projects', 'achievements'];

  for (const secKey of checkBulletSections) {
    const content = sectionsDetected[secKey];
    if (!content) continue;
    const secLines = content.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const raw of secLines) {
      const isBullet =
        /^[•\-*]/.test(raw) ||
        (raw.length > 35 && !/^(19|20)\d{2}/.test(raw) && raw.split(/\s+/).length >= 6);
      if (!isBullet) continue;
      const clean = raw.replace(/^[\s•\-*]+/, '').trim();
      const bTokens = tokenizeWords(clean);
      if (bTokens.length < 4) continue;
      const firstWord = bTokens[0];
      const hasActionVerb =
        STRONG_ACTION_VERBS.has(firstWord) ||
        bTokens.slice(0, 3).some((w) => STRONG_ACTION_VERBS.has(w));
      const actionVerbFound = bTokens.slice(0, 3).find((w) => STRONG_ACTION_VERBS.has(w));
      const qMatches = (clean.match(QUANTIFIED_METRIC_REGEX) || []).filter(
        (m) => !/^(19|20)\d{2}$/.test(m.trim())
      );
      const hasQuantifiedResult = qMatches.length > 0;
      const lowerClean = clean.toLowerCase();
      const foundWeak = WEAK_PHRASES.filter((wp) => lowerClean.includes(wp));

      const issues: string[] = [];
      if (!hasActionVerb) issues.push('Missing strong opening action verb');
      if (!hasQuantifiedResult) issues.push('No measurable metric or quantified outcome');
      if (foundWeak.length > 0) issues.push(`Contains weak phrasing (${foundWeak.join(', ')})`);
      if (bTokens.length > 38) issues.push('Bullet exceeds 38 words; consider tightening');
      if (bTokens.length < 7) issues.push('Bullet is very brief; add technical or business context');

      bulletQuality.push({
        text: clean,
        section: secKey,
        hasActionVerb,
        actionVerbFound,
        hasQuantifiedResult,
        quantifiedMatches: qMatches,
        weakPhrases: foundWeak,
        wordCount: bTokens.length,
        issues,
      });
    }
  }
  return bulletQuality;
}
