import { jsPDF } from 'jspdf';
import type {
  JobMatchResult,
  ResumeAnalysisRecord,
  ResumeBuilderData,
} from '../types/resume';

/**
 * Built-in jsPDF standard fonts (Helvetica, Times, Courier) use WinAnsiEncoding.
 * Normalize unsupported Unicode punctuation/arrows/symbols/emojis so exported PDFs never render garbled glyphs.
 */
export function sanitizePdfText(input: string): string {
  return input
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\u2192\u2794\u27A1]/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/\u2194/g, '<->')
    .replace(/[\u2713\u2714\u2611]/g, '[x]')
    .replace(/[\u2717\u2718]/g, '[ ]')
    .replace(/[\u2022\u2023\u25AA\u25CF\u25CB\u25B8\u25BA\u25E6]/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Strip characters outside printable Latin-1 / Windows-1252 safe subset
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA1-\xFF]/g, '');
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  pageHeight: number,
  marginBottom = 18
): number {
  const safe = sanitizePdfText(text);
  const lines = doc.splitTextToSize(safe, maxWidth) as string[];
  let cursorY = y;
  for (const line of lines) {
    if (cursorY > pageHeight - marginBottom) {
      doc.addPage();
      cursorY = 20;
    }
    doc.text(line, x, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return [79, 70, 229];
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [isNaN(r) ? 79 : r, isNaN(g) ? 70 : g, isNaN(b) ? 229 : b];
}

export function buildAnalysisReportPdfDoc(
  analysis: ResumeAnalysisRecord,
  jobMatch?: JobMatchResult | null
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('ResumeIQ X -- Intelligence & ATS Report', margin, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    sanitizePdfText(
      `Document: ${analysis.fileName}  |  Analyzed: ${new Date(analysis.createdAt).toLocaleString()}`
    ),
    margin,
    24
  );
  y = 44;

  // Overall score summary
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`Overall Heuristic ATS Score: ${analysis.ats.overallScore} / 100`, margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  y = addWrappedText(doc, analysis.ats.disclaimer, margin, y, contentWidth, 4.2, pageHeight);
  y += 4;

  // Category scores table
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Category Breakdown (Weighted)', margin, y);
  y += 5;

  doc.setFontSize(8.5);
  for (const cat of analysis.ats.categories) {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 18;
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(sanitizePdfText(cat.label), margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Score: ${cat.score}/100  |  Weight: ${cat.weight}%  |  Contrib: ${cat.weightedContribution}`,
      pageWidth - margin,
      y,
      { align: 'right' }
    );
    y += 4;
    doc.setTextColor(100, 116, 139);
    y = addWrappedText(doc, cat.details, margin + 2, y, contentWidth - 4, 3.8, pageHeight);
    y += 1.5;
  }

  y += 4;
  // Skills & Entities
  if (y > pageHeight - 35) {
    doc.addPage();
    y = 18;
  }
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Skills Analysis', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const foundNames =
    analysis.nlp.skills.found.map((s) => `${s.name} (${s.count}x)`).join(', ') || 'None detected';
  y = addWrappedText(
    doc,
    `Detected Skills (${analysis.nlp.skills.found.length}): ${foundNames}`,
    margin,
    y,
    contentWidth,
    4.2,
    pageHeight
  );
  y += 2;
  if (analysis.nlp.skills.unsubstantiated.length > 0) {
    y = addWrappedText(
      doc,
      `Skills Without Experience/Project Context: ${analysis.nlp.skills.unsubstantiated.join(', ')}`,
      margin,
      y,
      contentWidth,
      4.2,
      pageHeight
    );
    y += 2;
  }

  // Entities
  y += 3;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Extracted Entities & Keyword Summary', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const entityLines = [
    `Names: ${analysis.nlp.entities.names.map((e) => e.value).join(', ') || 'Not detected'}`,
    `Emails: ${analysis.nlp.entities.emails.map((e) => e.value).join(', ') || 'Not detected'}`,
    `Phones: ${analysis.nlp.entities.phones.map((e) => e.value).join(', ') || 'Not detected'}`,
    `Job Titles: ${analysis.nlp.entities.jobTitles.map((e) => e.value).join(', ') || 'Not detected'}`,
    `Top Keywords: ${analysis.nlp.wordFrequency.slice(0, 12).map((w) => `${w.word} (${w.count})`).join(', ')}`,
  ];
  for (const el of entityLines) {
    y = addWrappedText(doc, el, margin, y, contentWidth, 4.2, pageHeight);
  }

  // Job match if available
  if (jobMatch) {
    y += 4;
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 18;
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    y = addWrappedText(
      doc,
      `Job Match Results: ${jobMatch.jobTitle} (${jobMatch.company})`,
      margin,
      y,
      contentWidth,
      4.8,
      pageHeight
    );
    y += 1;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    y = addWrappedText(
      doc,
      `Overall Match: ${jobMatch.overallMatchScore}% | Skills Match: ${jobMatch.skillsMatchScore}% | TF-IDF Cosine: ${jobMatch.tfidfCosineSimilarity}% | Keyword Overlap: ${jobMatch.keywordOverlapScore}%`,
      margin,
      y,
      contentWidth,
      4.2,
      pageHeight
    );
    y = addWrappedText(
      doc,
      `Matched Skills: ${jobMatch.matchedSkills.join(', ') || 'None'}`,
      margin,
      y,
      contentWidth,
      4.2,
      pageHeight
    );
    y = addWrappedText(
      doc,
      `Missing Required Skills: ${jobMatch.missingRequiredSkills.join(', ') || 'None'}`,
      margin,
      y,
      contentWidth,
      4.2,
      pageHeight
    );
  }

  // Strengths, Weaknesses & Improvement Checklist
  y += 4;
  if (y > pageHeight - 40) {
    doc.addPage();
    y = 18;
  }
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Strengths, Weaknesses & Improvement Checklist', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  for (const st of analysis.ats.strengths.slice(0, 5)) {
    y = addWrappedText(doc, `[+] ${st}`, margin, y, contentWidth, 4.2, pageHeight);
  }
  for (const wk of analysis.ats.weaknesses.slice(0, 5)) {
    y = addWrappedText(doc, `[-] ${wk}`, margin, y, contentWidth, 4.2, pageHeight);
  }
  for (const sug of analysis.ats.suggestions) {
    y = addWrappedText(
      doc,
      `[${sug.priority.toUpperCase()}] ${sug.title}: ${sug.description}`,
      margin,
      y,
      contentWidth,
      4.2,
      pageHeight
    );
    y += 1;
  }

  return doc;
}

export function exportAnalysisReportPdf(
  analysis: ResumeAnalysisRecord,
  jobMatch?: JobMatchResult | null
): void {
  const doc = buildAnalysisReportPdfDoc(analysis, jobMatch);
  const safeName =
    analysis.fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'Resume';
  doc.save(`${safeName}_ResumeIQX_Report.pdf`);
}

export function buildComparisonReportPdfDoc(records: ResumeAnalysisRecord[]): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ResumeIQ X -- Multi-Resume Comparison Report', margin, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Comparing ${records.length} resumes | Generated ${new Date().toLocaleString()}`,
    margin,
    23
  );
  y = 42;

  for (const r of records) {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 18;
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    y = addWrappedText(
      doc,
      `${r.fileName} -- ATS Score: ${r.ats.overallScore}/100`,
      margin,
      y,
      contentWidth,
      4.8,
      pageHeight
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const summaryLine = `Words: ${r.nlp.tokenStats.totalWords} | FK Grade: ${r.nlp.tokenStats.readingGradeLevel} | Skills Detected: ${r.nlp.skills.found.length} | Quantified Bullets: ${r.nlp.quantifiedAchievements.length} | Action Verbs: ${r.nlp.actionVerbs.length}`;
    y = addWrappedText(doc, summaryLine, margin, y, contentWidth, 4.2, pageHeight);
    const topSkills = r.nlp.skills.found.slice(0, 12).map((s) => s.name).join(', ');
    y = addWrappedText(
      doc,
      `Top Skills: ${topSkills || 'None'}`,
      margin,
      y,
      contentWidth,
      4.2,
      pageHeight
    );
    y += 4;
  }

  return doc;
}

export function exportComparisonReportPdf(records: ResumeAnalysisRecord[]): void {
  const doc = buildComparisonReportPdfDoc(records);
  doc.save(`ResumeIQX_Comparison_${Date.now()}.pdf`);
}

export function buildCoverLetterPdfDoc(content: string): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 22;
  const contentWidth = pageWidth - margin * 2;

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);

  addWrappedText(doc, content, margin, 24, contentWidth, 5.4, pageHeight, 22);
  return doc;
}

export function exportCoverLetterPdf(title: string, content: string): void {
  const doc = buildCoverLetterPdfDoc(content);
  const safeName = (title || 'Cover_Letter').replace(/[^a-zA-Z0-9_-]/g, '_') || 'Cover_Letter';
  doc.save(`${safeName}.pdf`);
}

export function buildResumeBuilderPdfDoc(resume: ResumeBuilderData): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin =
    resume.pageMargin === 'compact' ? 12 : resume.pageMargin === 'spacious' ? 20 : 16;
  const contentWidth = pageWidth - margin * 2;
  const [ar, ag, ab] = hexToRgb(resume.accentColor || '#4F46E5');
  const fontFace =
    resume.fontFamily === 'serif'
      ? 'times'
      : resume.fontFamily === 'mono'
        ? 'courier'
        : 'helvetica';

  let y = margin + 4;

  // Header styling varies gently by template
  if (
    resume.templateId === 'modern-professional' ||
    resume.templateId === 'creative-professional'
  ) {
    doc.setFillColor(ar, ag, ab);
    doc.rect(0, 0, pageWidth, 3.5, 'F');
  }

  doc.setFont(fontFace, 'bold');
  doc.setFontSize(19);
  doc.setTextColor(15, 23, 42);
  const fullName = sanitizePdfText(resume.personal.fullName.trim() || 'Candidate Name');
  if (resume.templateId === 'classic-corporate') {
    doc.text(fullName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  } else {
    doc.text(fullName, margin, y);
  }
  y += 6;

  if (resume.personal.headline.trim()) {
    doc.setFont(fontFace, 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(ar, ag, ab);
    const headline = sanitizePdfText(resume.personal.headline.trim());
    if (resume.templateId === 'classic-corporate') {
      doc.text(headline, pageWidth / 2, y, { align: 'center' });
    } else {
      doc.text(headline, margin, y);
    }
    y += 5;
  }

  const contacts = [
    resume.personal.email,
    resume.personal.phone,
    resume.personal.location,
    resume.personal.linkedin,
    resume.personal.website,
  ]
    .map((c) => sanitizePdfText(c.trim()))
    .filter(Boolean)
    .join('  |  ');

  if (contacts) {
    doc.setFont(fontFace, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    if (resume.templateId === 'classic-corporate') {
      const contactLines = doc.splitTextToSize(contacts, contentWidth) as string[];
      for (const line of contactLines) {
        doc.text(line, pageWidth / 2, y, { align: 'center' });
        y += 4;
      }
      y += 1.5;
    } else {
      y = addWrappedText(doc, contacts, margin, y, contentWidth, 4, pageHeight);
      y += 2;
    }
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  const drawSectionHeading = (label: string) => {
    if (y > pageHeight - 25) {
      doc.addPage();
      y = margin + 4;
    }
    doc.setFont(fontFace, 'bold');
    doc.setFontSize(10.5);
    if (resume.templateId === 'minimal-ats') {
      doc.setTextColor(15, 23, 42);
    } else {
      doc.setTextColor(ar, ag, ab);
    }
    doc.text(sanitizePdfText(label.toUpperCase()), margin, y);
    y += 1.5;
    doc.setDrawColor(ar, ag, ab);
    doc.setLineWidth(0.35);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4.5;
    doc.setTextColor(30, 41, 59);
  };

  for (const secKey of resume.sectionOrder) {
    if (secKey === 'summary' && resume.summary.trim()) {
      drawSectionHeading('Professional Summary');
      doc.setFont(fontFace, 'normal');
      doc.setFontSize(9.5);
      y = addWrappedText(doc, resume.summary.trim(), margin, y, contentWidth, 4.3, pageHeight);
      y += 4;
    }

    if (secKey === 'experience' && resume.experience.length > 0) {
      drawSectionHeading('Work Experience');
      for (const exp of resume.experience) {
        if (y > pageHeight - 25) {
          doc.addPage();
          y = margin + 4;
        }
        const dateStr = sanitizePdfText(
          `${exp.startDate}${exp.startDate ? ' - ' : ''}${exp.current ? 'Present' : exp.endDate}`
        ).trim();
        const roleHeading = sanitizePdfText(`${exp.role || 'Role'} -- ${exp.company || 'Company'}`);
        const leftWidth = dateStr ? Math.max(60, contentWidth - 46) : contentWidth;

        if (dateStr) {
          doc.setFont(fontFace, 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(dateStr, pageWidth - margin, y, { align: 'right' });
        }

        doc.setFont(fontFace, 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        y = addWrappedText(doc, roleHeading, margin, y, leftWidth, 4.2, pageHeight);

        if (exp.location) {
          doc.setFont(fontFace, 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(sanitizePdfText(exp.location), margin, y);
          y += 3.8;
        }
        doc.setFont(fontFace, 'normal');
        doc.setFontSize(9.2);
        doc.setTextColor(51, 65, 85);
        for (const b of exp.bullets.filter((x) => x.trim())) {
          y = addWrappedText(doc, `- ${b.trim()}`, margin + 2, y, contentWidth - 2, 4.1, pageHeight);
        }
        y += 3;
      }
    }

    if (secKey === 'skills' && resume.skills.some((g) => g.items.length > 0)) {
      drawSectionHeading('Skills');
      doc.setFontSize(9.2);
      for (const grp of resume.skills.filter((g) => g.items.length > 0)) {
        doc.setFont(fontFace, 'normal');
        doc.setTextColor(30, 41, 59);
        const lineText = `${grp.category}: ${grp.items.join(', ')}`;
        y = addWrappedText(doc, lineText, margin, y, contentWidth, 4.2, pageHeight);
      }
      y += 3;
    }

    if (secKey === 'projects' && resume.projects.length > 0) {
      drawSectionHeading('Projects');
      for (const proj of resume.projects) {
        if (y > pageHeight - 25) {
          doc.addPage();
          y = margin + 4;
        }
        doc.setFont(fontFace, 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        y = addWrappedText(
          doc,
          `${proj.name || 'Project'}${proj.roleOrTech ? ` (${proj.roleOrTech})` : ''}`,
          margin,
          y,
          contentWidth,
          4.2,
          pageHeight
        );
        doc.setFont(fontFace, 'normal');
        doc.setFontSize(9.2);
        doc.setTextColor(51, 65, 85);
        if (proj.description.trim()) {
          y = addWrappedText(doc, proj.description.trim(), margin, y, contentWidth, 4.1, pageHeight);
        }
        for (const b of proj.bullets.filter((x) => x.trim())) {
          y = addWrappedText(doc, `- ${b.trim()}`, margin + 2, y, contentWidth - 2, 4.1, pageHeight);
        }
        y += 2.5;
      }
    }

    if (secKey === 'education' && resume.education.length > 0) {
      drawSectionHeading('Education');
      for (const edu of resume.education) {
        if (y > pageHeight - 22) {
          doc.addPage();
          y = margin + 4;
        }
        const gradDate = sanitizePdfText(edu.graduationDate || '').trim();
        const eduLeftWidth = gradDate ? Math.max(60, contentWidth - 40) : contentWidth;

        if (gradDate) {
          doc.setFont(fontFace, 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(gradDate, pageWidth - margin, y, { align: 'right' });
        }

        doc.setFont(fontFace, 'bold');
        doc.setFontSize(9.8);
        doc.setTextColor(15, 23, 42);
        y = addWrappedText(
          doc,
          `${edu.degree || 'Degree'} -- ${edu.institution || 'Institution'}`,
          margin,
          y,
          eduLeftWidth,
          4.0,
          pageHeight
        );
        doc.setFont(fontFace, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        if (edu.gpaOrHonors || edu.location) {
          y = addWrappedText(
            doc,
            [edu.location, edu.gpaOrHonors].filter(Boolean).join(' | '),
            margin,
            y,
            contentWidth,
            4,
            pageHeight
          );
        }
        y += 2;
      }
    }

    if (secKey === 'certifications' && resume.certifications.length > 0) {
      drawSectionHeading('Certifications');
      doc.setFont(fontFace, 'normal');
      doc.setFontSize(9.2);
      for (const cert of resume.certifications) {
        y = addWrappedText(
          doc,
          `- ${cert.name}${cert.issuer ? ` -- ${cert.issuer}` : ''}${cert.date ? ` (${cert.date})` : ''}`,
          margin,
          y,
          contentWidth,
          4.1,
          pageHeight
        );
      }
      y += 3;
    }

    if (secKey === 'achievements' && resume.achievements.length > 0) {
      drawSectionHeading('Achievements');
      doc.setFont(fontFace, 'normal');
      doc.setFontSize(9.2);
      for (const ach of resume.achievements) {
        y = addWrappedText(
          doc,
          `- ${ach.title}${ach.description ? `: ${ach.description}` : ''}`,
          margin,
          y,
          contentWidth,
          4.1,
          pageHeight
        );
      }
      y += 3;
    }

    if (secKey === 'languages' && resume.languages.length > 0) {
      drawSectionHeading('Languages');
      doc.setFont(fontFace, 'normal');
      doc.setFontSize(9.2);
      const langLine = resume.languages
        .map((l) => `${l.language}${l.proficiency ? ` (${l.proficiency})` : ''}`)
        .join('  |  ');
      y = addWrappedText(doc, langLine, margin, y, contentWidth, 4.2, pageHeight);
      y += 3;
    }

    if (secKey === 'custom' && resume.customSections.length > 0) {
      for (const cs of resume.customSections) {
        drawSectionHeading(cs.title || 'Additional Information');
        doc.setFont(fontFace, 'normal');
        doc.setFontSize(9.2);
        for (const item of cs.items.filter((x) => x.trim())) {
          y = addWrappedText(doc, `- ${item.trim()}`, margin, y, contentWidth, 4.1, pageHeight);
        }
        y += 3;
      }
    }
  }

  return doc;
}

export function exportResumeBuilderPdf(resume: ResumeBuilderData): void {
  const doc = buildResumeBuilderPdfDoc(resume);
  const safeTitle =
    (resume.title || resume.personal.fullName || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_') ||
    'Resume';
  doc.save(`${safeTitle}.pdf`);
}
