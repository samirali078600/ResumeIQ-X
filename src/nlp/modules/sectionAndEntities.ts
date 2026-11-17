import nlp from 'compromise';
import type { EntityMatch, ExtractedEntities } from '../../types/resume';

const SECTION_HEADINGS: { key: string; patterns: RegExp[] }[] = [
  {
    key: 'summary',
    patterns: [
      /^(professional\s+)?summary$/i,
      /^profile$/i,
      /^objective$/i,
      /^career\s+summary$/i,
      /^about(\s+me)?$/i,
      /^executive\s+summary$/i,
    ],
  },
  {
    key: 'experience',
    patterns: [
      /^(work|professional|relevant|employment)\s+experience$/i,
      /^experience$/i,
      /^employment\s+history$/i,
      /^career\s+history$/i,
    ],
  },
  {
    key: 'education',
    patterns: [/^education(\s+&\s+training)?$/i, /^academic\s+background$/i, /^qualifications$/i],
  },
  {
    key: 'skills',
    patterns: [
      /^(technical\s+|core\s+|key\s+)?skills(\s+&\s+competencies)?$/i,
      /^technologies$/i,
      /^technical\s+proficiencies$/i,
      /^competencies$/i,
    ],
  },
  {
    key: 'projects',
    patterns: [/^(key\s+|selected\s+|personal\s+|academic\s+)?projects$/i, /^project\s+experience$/i],
  },
  {
    key: 'certifications',
    patterns: [
      /^certifications?(\s+&\s+licenses)?$/i,
      /^licenses\s+&\s+certifications$/i,
      /^credentials$/i,
    ],
  },
  {
    key: 'achievements',
    patterns: [/^(awards?|honors?|achievements?|publications?|accomplishments?)(\s+&\s+awards)?$/i],
  },
  { key: 'languages', patterns: [/^languages?$/i] },
];

export function detectSections(text: string): Record<string, string> {
  const lines = text.split('\n');
  const sections: Record<string, string[]> = { header: [] };
  let currentSection = 'header';

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      sections[currentSection].push('');
      continue;
    }

    const cleanedHeading = trimmed.replace(/[:|\-–—_]+$/g, '').trim();
    let matchedKey: string | null = null;

    if (cleanedHeading.length <= 45 && cleanedHeading.split(/\s+/).length <= 5) {
      for (const sec of SECTION_HEADINGS) {
        if (sec.patterns.some((p) => p.test(cleanedHeading))) {
          matchedKey = sec.key;
          break;
        }
      }
    }

    if (matchedKey) {
      currentSection = matchedKey;
      if (!sections[currentSection]) sections[currentSection] = [];
    } else {
      sections[currentSection].push(trimmed);
    }
  }

  const out: Record<string, string> = {};
  for (const [k, arr] of Object.entries(sections)) {
    const joined = arr.join('\n').trim();
    if (joined) out[k] = joined;
  }
  return out;
}

export function extractEntitiesDeterministic(
  text: string,
  sections: Record<string, string>
): ExtractedEntities {
  const doc = nlp(text);
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Emails
  const emailMatches = Array.from(
    new Set(text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])
  );
  const emails: EntityMatch[] = emailMatches.map((v, i) => ({
    id: `email-${i}`,
    value: v,
    confidence: 'verified',
    source: 'Deterministic Regex (RFC pattern)',
  }));

  // Phones
  const phoneRegex = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g;
  const rawPhones = (text.match(phoneRegex) || [])
    .map((p) => p.trim())
    .filter((p) => {
      const digits = p.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) return false;
      if (/^(19|20)\d{2}(19|20)\d{2}$/.test(digits)) return false;
      return true;
    });
  const phones: EntityMatch[] = Array.from(new Set(rawPhones)).map((v, i) => ({
    id: `phone-${i}`,
    value: v,
    confidence: 'verified',
    source: 'Deterministic Phone Regex',
  }));

  // Name heuristic (top 4 lines + compromise people)
  const names: EntityMatch[] = [];
  const topLines = (sections.header || lines.slice(0, 5).join('\n')).split('\n').slice(0, 4);
  for (const line of topLines) {
    const clean = line.replace(/[|•·]/g, ' ').trim();
    if (
      clean.length >= 4 &&
      clean.length <= 42 &&
      !clean.includes('@') &&
      !/\d/.test(clean) &&
      !/http|linkedin|github|resume|curriculum/i.test(clean) &&
      /^[A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'.-]+){1,3}$/.test(clean)
    ) {
      names.push({
        id: 'name-0',
        value: clean,
        confidence: 'unverified',
        source: 'Header Rule Heuristic (editable)',
      });
      break;
    }
  }
  if (names.length === 0) {
    const people = doc.people().out('array') as string[];
    if (people.length > 0) {
      names.push({
        id: 'name-nlp-0',
        value: people[0],
        confidence: 'unverified',
        source: 'Compromise.js Person POS/NER (editable)',
      });
    }
  }

  // Locations
  const locationMatches = new Set<string>();
  const cityStateRegex = /\b([A-Z][a-zA-Z.\s]{2,22},\s?(?:[A-Z]{2}|[A-Z][a-zA-Z\s]{2,18}))\b/g;
  let m: RegExpExecArray | null;
  while ((m = cityStateRegex.exec(text)) !== null) {
    const candidate = m[1].trim();
    if (!/\d/.test(candidate) && candidate.length < 36) {
      locationMatches.add(candidate);
    }
  }
  const nlpPlaces = (doc.places().out('array') as string[]).slice(0, 5);
  nlpPlaces.forEach((p) => {
    if (p.length > 2 && p.length < 35) locationMatches.add(p.trim());
  });
  const locations: EntityMatch[] = Array.from(locationMatches)
    .slice(0, 6)
    .map((v, i) => ({
      id: `loc-${i}`,
      value: v,
      confidence: 'unverified',
      source: 'Location Regex + Compromise.js Places',
    }));

  // Dates & ranges
  const dateRegex =
    /\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|(?:19|20)\d{2}\s*(?:[-–—to]+\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+)?(?:(?:19|20)\d{2}|Present|Current|Now))?|(?:0?[1-9]|1[0-2])\/(?:19|20)\d{2})\b/gi;
  const dateMatches = Array.from(new Set((text.match(dateRegex) || []).map((d) => d.trim())));
  const dates: EntityMatch[] = dateMatches.slice(0, 20).map((v, i) => ({
    id: `date-${i}`,
    value: v,
    confidence: 'verified',
    source: 'Deterministic Date Range Regex',
  }));

  // Organizations
  const orgCandidates = new Set<string>();
  const nlpOrgs = doc.organizations().out('array') as string[];
  nlpOrgs.forEach((o) => {
    const cleaned = o.trim().replace(/^[,.;:]+|[,.;:]+$/g, '');
    if (cleaned.length >= 2 && cleaned.length <= 60) orgCandidates.add(cleaned);
  });
  const orgSuffixRegex =
    /\b([A-Z][A-Za-z0-9&.\s]{1,35}\s(?:Inc\.?|LLC|Ltd\.?|Corp\.?|Corporation|Technologies|Systems|Labs|Studio|Solutions|University|Institute|College))\b/g;
  while ((m = orgSuffixRegex.exec(text)) !== null) {
    orgCandidates.add(m[1].trim());
  }
  const organizations: EntityMatch[] = Array.from(orgCandidates)
    .slice(0, 12)
    .map((v, i) => ({
      id: `org-${i}`,
      value: v,
      confidence: 'unverified',
      source: 'Compromise.js Org NER + Company Suffix Regex',
    }));

  // Job titles
  const titleKeywords =
    /(?:Software|Frontend|Front-End|Backend|Back-End|Full[- ]Stack|Senior|Junior|Lead|Principal|Staff|Data|Machine Learning|Cloud|DevOps|Site Reliability|Product|Project|UX|UI|Security|Systems|Mobile|QA|Test|Engineering|Technical|Marketing|Sales|Operations|Business)\s+(?:Engineer|Developer|Architect|Scientist|Analyst|Manager|Designer|Director|Consultant|Administrator|Specialist|Intern|Lead|Coordinator)/gi;
  const titleMatches = Array.from(new Set((text.match(titleKeywords) || []).map((t) => t.trim())));
  const jobTitles: EntityMatch[] = titleMatches.slice(0, 10).map((v, i) => ({
    id: `title-${i}`,
    value: v,
    confidence: 'unverified',
    source: 'Role Title Pattern Dictionary',
  }));

  // Education
  const eduLines = (sections.education || text)
    .split('\n')
    .filter((l) =>
      /\b(bachelor|master|ph\.?d|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?b\.?a\.?|associate|diploma|b\.?tech|m\.?tech|university|college|institute)\b/i.test(
        l
      )
    )
    .slice(0, 8);
  const education: EntityMatch[] = eduLines.map((v, i) => ({
    id: `edu-${i}`,
    value: v.trim(),
    confidence: 'unverified',
    source: 'Degree & Institution Pattern',
  }));

  // Certifications
  const certSource = sections.certifications || text;
  const certLines = certSource
    .split('\n')
    .filter((l) =>
      /\b(certified|certification|aws\s+certified|azure|pmp|scrum\s+master|csm|cissp|comptia|cka|ckad|google\s+cloud|oracle|ccna|cfa|itil)\b/i.test(
        l
      )
    )
    .slice(0, 8);
  const certifications: EntityMatch[] = certLines.map((v, i) => ({
    id: `cert-${i}`,
    value: v.replace(/^[\s•\-*]+/, '').trim(),
    confidence: 'unverified',
    source: 'Certification Keyword Regex',
  }));

  // Projects
  const projects: EntityMatch[] = [];
  if (sections.projects) {
    const projLines = sections.projects
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 3 && l.length < 90 && !l.startsWith('•') && !l.startsWith('-'));
    projLines.slice(0, 8).forEach((l, i) => {
      projects.push({
        id: `proj-${i}`,
        value: l,
        confidence: 'unverified',
        source: 'Projects Section Line Heuristic',
      });
    });
  }

  return {
    names,
    emails,
    phones,
    locations,
    organizations,
    jobTitles,
    dates,
    education,
    certifications,
    projects,
  };
}
