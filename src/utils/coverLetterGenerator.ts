import { analyzeSkills } from '../nlp/classicalNlp';
import type {
  CoverLetterTone,
  ResumeAnalysisRecord,
  ResumeBuilderData,
} from '../types/resume';

export interface CoverLetterInput {
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateLocation: string;
  jobTitle: string;
  company: string;
  tone: CoverLetterTone;
  jobDescription: string;
  selectedAnalysis?: ResumeAnalysisRecord;
  selectedBuilderResume?: ResumeBuilderData;
}

export function generateRuleBasedCoverLetter(input: CoverLetterInput): string {
  const name = input.candidateName.trim() || '[Your Name]';
  const company = input.company.trim() || '[Company Name]';
  const jobTitle = input.jobTitle.trim() || '[Target Role]';
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Extract genuine evidence strictly from user's selected resume or analysis
  let verifiedSkills: string[] = [];
  let recentRole = '';
  let recentOrg = '';
  let highlightBullet = '';
  let educationLine = '';

  if (input.selectedBuilderResume) {
    const b = input.selectedBuilderResume;
    verifiedSkills = b.skills.flatMap((g) => g.items).filter(Boolean);
    if (b.experience.length > 0) {
      recentRole = b.experience[0].role;
      recentOrg = b.experience[0].company;
      highlightBullet = b.experience[0].bullets.find((x) => x.trim().length > 10) || '';
    }
    if (b.education.length > 0) {
      educationLine = `${b.education[0].degree} from ${b.education[0].institution}`;
    }
  } else if (input.selectedAnalysis) {
    const an = input.selectedAnalysis;
    verifiedSkills = an.nlp.skills.found.map((s) => s.name);
    recentRole = an.nlp.entities.jobTitles[0]?.value || '';
    recentOrg = an.nlp.entities.organizations[0]?.value || '';
    highlightBullet =
      an.nlp.quantifiedAchievements[0]?.text ||
      an.nlp.bulletQuality.find((b) => b.hasActionVerb)?.text ||
      '';
    educationLine = an.nlp.entities.education[0]?.value || '';
  }

  // Match verified skills against JD if JD provided — never invent skills not in resume
  let alignedSkills = verifiedSkills.slice(0, 6);
  if (input.jobDescription.trim().length > 20 && verifiedSkills.length > 0) {
    const jdSkills = analyzeSkills(input.jobDescription, { summary: input.jobDescription });
    const jdSet = new Set(jdSkills.found.map((s) => s.name));
    const overlap = verifiedSkills.filter((s) => jdSet.has(s));
    if (overlap.length > 0) {
      alignedSkills = overlap.slice(0, 6);
    }
  }

  const contactHeader = [
    name,
    [input.candidateLocation, input.candidatePhone, input.candidateEmail].filter(Boolean).join(' | '),
    today,
  ]
    .filter(Boolean)
    .join('\n');

  const skillsPhrase =
    alignedSkills.length > 0
      ? alignedSkills.join(', ')
      : '[insert verified skills from your resume]';

  const backgroundClause = recentRole
    ? recentOrg
      ? `most recently as ${recentRole} at ${recentOrg}`
      : `with experience as ${recentRole}`
    : educationLine
      ? `backed by my academic foundation (${educationLine})`
      : 'with practical experience documented in my enclosed resume';

  const evidenceParagraph = highlightBullet
    ? `In my previous work, I delivered measurable outcomes—for example: "${highlightBullet.replace(/\.$/, '')}." Applying ${skillsPhrase}, I focus on reliable execution, clear collaboration, and maintainable results.`
    : `Across my projects and roles, I have applied ${skillsPhrase} to solve practical technical and operational problems while maintaining high quality standards.`;

  let opening = '';
  let closing = '';

  switch (input.tone) {
    case 'confident':
      opening = `I am writing to apply for the ${jobTitle} position at ${company}. As a practitioner ${backgroundClause}, I bring direct experience in ${skillsPhrase} that aligns closely with your team's priorities.`;
      closing = `I welcome the opportunity to discuss how my hands-on background in ${alignedSkills[0] || 'this domain'} can contribute immediately to ${company}. Thank you for your time and consideration.`;
      break;
    case 'concise':
      opening = `Please accept my application for the ${jobTitle} role at ${company}. My background ${backgroundClause} centers on ${skillsPhrase}.`;
      closing = `Thank you for reviewing my resume. I would appreciate a brief conversation regarding how I can support ${company}'s goals.`;
      break;
    case 'entry-level':
      opening = `I am excited to apply for the ${jobTitle} opportunity at ${company}. ${educationLine ? `Having completed ${educationLine}, ` : ''}I have built foundational strength in ${skillsPhrase} through dedicated coursework and hands-on projects.`;
      closing = `I am eager to bring curiosity, structured problem-solving, and my foundation in ${skillsPhrase} to ${company}. Thank you for considering my application.`;
      break;
    case 'technical':
      opening = `I am applying for the ${jobTitle} opening at ${company}. My technical background ${backgroundClause} focuses on ${skillsPhrase}, with emphasis on clean architecture, reliability, and measurable engineering outcomes.`;
      closing = `I look forward to discussing your engineering stack, technical roadmap, and how my experience with ${skillsPhrase} fits ${company}.`;
      break;
    case 'professional':
    default:
      opening = `I am writing to express my interest in the ${jobTitle} role at ${company}. ${backgroundClause ? `With a background ${backgroundClause}, ` : ''}I bring verified hands-on experience in ${skillsPhrase}.`;
      closing = `Thank you for considering my application. I would welcome the chance to speak with your team about how my skills and experience align with ${company}'s needs.`;
      break;
  }

  const companyAlignment =
    input.jobDescription.trim().length > 20
      ? `Reviewing your description for the ${jobTitle} role, I noted the emphasis on ${alignedSkills.length > 0 ? alignedSkills.slice(0, 3).join(' and ') : 'core role delivery'}. I am confident my existing work provides a solid foundation for stepping into these responsibilities thoughtfully.`
      : `I admire ${company}'s focus and would value the opportunity to contribute my experience directly to your team's upcoming initiatives.`;

  return `${contactHeader}

Hiring Team
${company}

Dear Hiring Manager,

${opening}

${evidenceParagraph}

${companyAlignment}

${closing}

Sincerely,
${name}`;
}
