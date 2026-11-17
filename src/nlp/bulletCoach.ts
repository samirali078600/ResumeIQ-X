import type { BulletQualityItem } from '../types/resume';

export interface BulletCoachSuggestion {
  original: string;
  section: string;
  issues: string[];
  suggestedVerbs: string[];
  metricPrompt: string;
  guidedTemplate: string;
}

const VERB_SUGGESTIONS_BY_CONTEXT: { pattern: RegExp; verbs: string[] }[] = [
  {
    pattern: /\b(build|built|create|created|develop|developed|code|coded|program|app|web|frontend|backend|api)\b/i,
    verbs: ['Engineered', 'Architected', 'Implemented', 'Shipped'],
  },
  {
    pattern: /\b(lead|led|manage|managed|team|mentor|mentored|supervise|supervised|coordinate)\b/i,
    verbs: ['Directed', 'Spearheaded', 'Mentored', 'Orchestrated'],
  },
  {
    pattern: /\b(data|analy|report|sql|dashboard|metric|research|model|test)\b/i,
    verbs: ['Analyzed', 'Automated', 'Validated', 'Synthesized'],
  },
  {
    pattern: /\b(fast|faster|speed|latency|optimiz|improv|reduce|cost|save|bug|fix)\b/i,
    verbs: ['Accelerated', 'Streamlined', 'Reduced', 'Resolved'],
  },
  {
    pattern: /\b(design|ui|ux|user|client|customer|support|present|write|doc)\b/i,
    verbs: ['Designed', 'Delivered', 'Elevated', 'Authored'],
  },
];

const DEFAULT_STRONG_VERBS = ['Delivered', 'Engineered', 'Streamlined', 'Spearheaded'];

const WEAK_OPENER_REGEX =
  /^(?:responsible for|helped with|worked on|assisted with|assisted in|tasked with|involved in|participated in|duties included)\s+/i;

export function generateBulletCoachSuggestions(
  bullets: BulletQualityItem[],
  limit = 6
): BulletCoachSuggestion[] {
  const candidates = bullets.filter((b) => b.issues.length > 0);
  const selected = candidates.slice(0, limit);

  return selected.map((b) => {
    let matchedVerbs = DEFAULT_STRONG_VERBS;
    for (const rule of VERB_SUGGESTIONS_BY_CONTEXT) {
      if (rule.pattern.test(b.text)) {
        matchedVerbs = rule.verbs;
        break;
      }
    }

    const cleanedCore = b.text
      .replace(WEAK_OPENER_REGEX, '')
      .replace(/^[-•*]\s*/, '')
      .trim();

    const firstCharLower =
      cleanedCore.length > 0
        ? cleanedCore.charAt(0).toLowerCase() + cleanedCore.slice(1)
        : 'this deliverable';

    const metricPrompt = b.hasQuantifiedResult
      ? 'Keep your existing quantitative metric prominent near the start of the bullet.'
      : 'Add a real, verifiable outcome (for example: reduced time by [X%], served [N] users, or saved [N] hours/week).';

    const primaryVerb = matchedVerbs[0];
    const guidedTemplate = b.hasQuantifiedResult
      ? `${primaryVerb} ${firstCharLower}`
      : `${primaryVerb} ${firstCharLower.replace(/\.$/, '')}, resulting in [measurable outcome, e.g., X% faster delivery or N users impacted].`;

    return {
      original: b.text,
      section: b.section,
      issues: b.issues,
      suggestedVerbs: matchedVerbs,
      metricPrompt,
      guidedTemplate,
    };
  });
}
