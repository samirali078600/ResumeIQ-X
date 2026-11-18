import { jsPDF } from 'jspdf';
import type {
  JobMatchResult,
  ResumeAnalysisRecord,
} from '../types/resume';

export interface ReportExportOptions {
  includeCategoryBreakdown?: boolean;
  includeSkillsAndEntities?: boolean;
  includeJobComparison?: boolean;
  includeChecklist?: boolean;
  includeExtractedText?: boolean;
}

const DEFAULT_REPORT_OPTIONS: Required<ReportExportOptions> = {
  includeCategoryBreakdown: true,
  includeSkillsAndEntities: true,
  includeJobComparison: true,
  includeChecklist: true,
  includeExtractedText: false,
};

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

function addPageFooters(doc: jsPDF, documentLabel: string): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let p = 1; p <= pageCount; p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(sanitizePdfText(`ResumeIQ  |  ${documentLabel}`), 16, pageHeight - 9);
    doc.text(`Page ${p} of ${pageCount}`, pageWidth - 16, pageHeight - 9, { align: 'right' });
  }
}

export function buildAnalysisReportPdfDoc(
  analysis: ResumeAnalysisRecord,
  jobMatch?: JobMatchResult | null,
  options?: ReportExportOptions
): jsPDF {
  const opts = { ...DEFAULT_REPORT_OPTIONS, ...options };
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
  doc.text('ResumeIQ -- Intelligence & ATS Report', margin, 15);
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
  doc.text(
    `Words: ${analysis.nlp.tokenStats.totalWords}  |  FK Grade: ${analysis.nlp.tokenStats.readingGradeLevel}  |  Skills Detected: ${analysis.nlp.skills.found.length}  |  Quantified Bullets: ${analysis.nlp.quantifiedAchievements.length}`,
    margin,
    y
  );
  y += 5;
  y = addWrappedText(doc, analysis.ats.disclaimer, margin, y, contentWidth, 4.2, pageHeight);
  y += 4;

  // Category scores table
  if (opts.includeCategoryBreakdown) {
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Category Breakdown (Weighted)', margin, y);
    y += 5;

    doc.setFontSize(8.5);
    for (const cat of analysis.ats.categories) {
      if (y > pageHeight - 22) {
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
  }

  // Skills & Entities
  if (opts.includeSkillsAndEntities) {
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
      `Organizations: ${analysis.nlp.entities.organizations.map((e) => e.value).join(', ') || 'Not detected'}`,
      `Top Keywords: ${analysis.nlp.wordFrequency.slice(0, 14).map((w) => `${w.word} (${w.count})`).join(', ')}`,
    ];
    for (const el of entityLines) {
      y = addWrappedText(doc, el, margin, y, contentWidth, 4.2, pageHeight);
    }
  }

  // Job match if available
  if (opts.includeJobComparison && jobMatch) {
    y += 4;
    if (y > pageHeight - 45) {
      doc.addPage();
      y = 18;
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    y = addWrappedText(
      doc,
      `Resume vs. Job Comparison: ${jobMatch.jobTitle} (${jobMatch.company})`,
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
    y += 1.5;
    y = addWrappedText(
      doc,
      `1. What Is Same (Matched Skills): ${jobMatch.matchedSkills.join(', ') || 'None detected'}`,
      margin,
      y,
      contentWidth,
      4.2,
      pageHeight
    );
    if (jobMatch.matchedKeywords.length > 0) {
      y = addWrappedText(
        doc,
        `1b. Matched Job Keywords: ${jobMatch.matchedKeywords.slice(0, 15).join(', ')}`,
        margin,
        y,
        contentWidth,
        4.2,
        pageHeight
      );
    }
    y = addWrappedText(
      doc,
      `2. What Is Missing (Required Skills): ${jobMatch.missingRequiredSkills.join(', ') || 'None'}`,
      margin,
      y,
      contentWidth,
      4.2,
      pageHeight
    );
    if (jobMatch.missingPreferredSkills.length > 0) {
      y = addWrappedText(
        doc,
        `2b. What Is Missing (Preferred Skills): ${jobMatch.missingPreferredSkills.join(', ')}`,
        margin,
        y,
        contentWidth,
        4.2,
        pageHeight
      );
    }
    if (jobMatch.missingKeywords.length > 0) {
      y = addWrappedText(
        doc,
        `2c. Missing Job Keywords: ${jobMatch.missingKeywords.slice(0, 15).join(', ')}`,
        margin,
        y,
        contentWidth,
        4.2,
        pageHeight
      );
    }
    const unverifiedMatched = jobMatch.matchedSkills.filter((sk) =>
      analysis.nlp.skills.unsubstantiated.some((u) => u.toLowerCase() === sk.toLowerCase())
    );
    if (unverifiedMatched.length > 0) {
      y = addWrappedText(
        doc,
        `3. What to Improve (Skills Without Project/Work Proof): ${unverifiedMatched.join(', ')}`,
        margin,
        y,
        contentWidth,
        4.2,
        pageHeight
      );
    }
    if (jobMatch.experienceGapNote) {
      y = addWrappedText(
        doc,
        `Experience Check: ${jobMatch.experienceGapNote}`,
        margin,
        y,
        contentWidth,
        4.2,
        pageHeight
      );
    }
    for (const rec of jobMatch.suggestions.slice(0, 5)) {
      y = addWrappedText(doc, `- ${rec}`, margin + 2, y, contentWidth - 2, 4.1, pageHeight);
    }
  }

  // Strengths, Weaknesses & Improvement Checklist
  if (opts.includeChecklist) {
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
    for (const st of analysis.ats.strengths.slice(0, 6)) {
      y = addWrappedText(doc, `[+] ${st}`, margin, y, contentWidth, 4.2, pageHeight);
    }
    for (const wk of analysis.ats.weaknesses.slice(0, 6)) {
      y = addWrappedText(doc, `[-] ${wk}`, margin, y, contentWidth, 4.2, pageHeight);
    }
    for (const sug of analysis.ats.suggestions) {
      const doneTag = sug.completed ? '[DONE]' : `[${sug.priority.toUpperCase()}]`;
      y = addWrappedText(
        doc,
        `${doneTag} ${sug.title}: ${sug.description}`,
        margin,
        y,
        contentWidth,
        4.2,
        pageHeight
      );
      y += 1;
    }
  }

  // Optional Extracted Resume Text Appendix
  if (opts.includeExtractedText && analysis.extractedText.trim()) {
    y += 5;
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 18;
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Extracted Resume Text Appendix', margin, y);
    y += 5;
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(51, 65, 85);
    addWrappedText(doc, analysis.extractedText.trim(), margin, y, contentWidth, 3.8, pageHeight);
  }

  addPageFooters(doc, analysis.fileName);
  return doc;
}

export function exportAnalysisReportPdf(
  analysis: ResumeAnalysisRecord,
  jobMatch?: JobMatchResult | null,
  options?: ReportExportOptions
): void {
  const doc = buildAnalysisReportPdfDoc(analysis, jobMatch, options);
  const safeName =
    analysis.fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'Resume';
  doc.save(`${safeName}_ResumeIQ_Report.pdf`);
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
  doc.text('ResumeIQ -- Multi-Resume Comparison Report', margin, 15);
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

  addPageFooters(doc, `Comparison (${records.length} resumes)`);
  return doc;
}

export function exportComparisonReportPdf(records: ResumeAnalysisRecord[]): void {
  const doc = buildComparisonReportPdfDoc(records);
  doc.save(`ResumeIQ_Comparison_${Date.now()}.pdf`);
}

export function buildAnalysisMarkdownReport(
  analysis: ResumeAnalysisRecord,
  jobMatch?: JobMatchResult | null,
  options?: ReportExportOptions
): string {
  const opts = { ...DEFAULT_REPORT_OPTIONS, ...options };
  const lines: string[] = [
    `# ResumeIQ Intelligence Report: ${analysis.fileName}`,
    '',
    `- **Analyzed:** ${new Date(analysis.createdAt).toLocaleString()}`,
    `- **Overall Heuristic ATS Score:** ${analysis.ats.overallScore}/100`,
    `- **Word Count:** ${analysis.nlp.tokenStats.totalWords}`,
    `- **Reading Grade Level (Flesch-Kincaid):** ${analysis.nlp.tokenStats.readingGradeLevel}`,
    `- **Skills Detected:** ${analysis.nlp.skills.found.length}`,
    `- **Quantified Bullets:** ${analysis.nlp.quantifiedAchievements.length}`,
    '',
  ];

  if (opts.includeCategoryBreakdown) {
    lines.push('## 14-Category ATS Breakdown', '');
    lines.push('| Category | Score | Weight | Notes |');
    lines.push('| --- | ---: | ---: | --- |');
    for (const cat of analysis.ats.categories) {
      lines.push(`| ${cat.label} | ${cat.score}/100 | ${cat.weight}% | ${cat.details.replace(/\|/g, '/')} |`);
    }
    lines.push('');
  }

  if (opts.includeSkillsAndEntities) {
    lines.push('## Skills & Entities', '');
    lines.push(
      `**Detected Skills (${analysis.nlp.skills.found.length}):** ${
        analysis.nlp.skills.found.map((s) => `${s.name} (${s.count}x)`).join(', ') || 'None'
      }`
    );
    if (analysis.nlp.skills.unsubstantiated.length > 0) {
      lines.push(
        `**Unsubstantiated Skills (Add Experience/Project Proof):** ${analysis.nlp.skills.unsubstantiated.join(', ')}`
      );
    }
    lines.push(
      `**Names:** ${analysis.nlp.entities.names.map((e) => e.value).join(', ') || 'Not detected'}`,
      `**Emails:** ${analysis.nlp.entities.emails.map((e) => e.value).join(', ') || 'Not detected'}`,
      `**Job Titles:** ${analysis.nlp.entities.jobTitles.map((e) => e.value).join(', ') || 'Not detected'}`,
      `**Top Keywords:** ${analysis.nlp.wordFrequency.slice(0, 12).map((w) => `${w.word} (${w.count})`).join(', ')}`,
      ''
    );
  }

  if (opts.includeJobComparison && jobMatch) {
    lines.push(`## Resume vs. Job Comparison: ${jobMatch.jobTitle} (${jobMatch.company})`, '');
    lines.push(
      `- **Overall Match Score:** ${jobMatch.overallMatchScore}%`,
      `- **Skills Match:** ${jobMatch.skillsMatchScore}%`,
      `- **TF-IDF Cosine Similarity:** ${jobMatch.tfidfCosineSimilarity}%`,
      `- **Keyword Overlap:** ${jobMatch.keywordOverlapScore}%`,
      '',
      `### 1. What Is Same (Matched)`,
      jobMatch.matchedSkills.length > 0 ? jobMatch.matchedSkills.map((s) => `- ${s}`).join('\n') : '- No direct skill matches detected',
      '',
      `### 2. What Is Missing`,
      `- **Missing Required Skills:** ${jobMatch.missingRequiredSkills.join(', ') || 'None'}`,
      `- **Missing Preferred Skills:** ${jobMatch.missingPreferredSkills.join(', ') || 'None'}`,
      `- **Missing Job Keywords:** ${jobMatch.missingKeywords.slice(0, 15).join(', ') || 'None'}`,
      '',
      `### 3. What to Improve`,
      ...(analysis.nlp.skills.unsubstantiated.length > 0
        ? [`- **Add Project/Experience Evidence For:** ${analysis.nlp.skills.unsubstantiated.join(', ')}`]
        : []),
      ...(jobMatch.experienceGapNote ? [`- ${jobMatch.experienceGapNote}`] : []),
      ...jobMatch.suggestions.map((r) => `- ${r}`),
      ''
    );
  }

  if (opts.includeChecklist) {
    lines.push('## Strengths, Weaknesses & Improvement Checklist', '');
    if (analysis.ats.strengths.length > 0) {
      lines.push('### Observed Strengths', ...analysis.ats.strengths.map((s) => `- ${s}`), '');
    }
    if (analysis.ats.weaknesses.length > 0) {
      lines.push('### Observed Weaknesses', ...analysis.ats.weaknesses.map((w) => `- ${w}`), '');
    }
    lines.push(
      '### Checklist',
      ...analysis.ats.suggestions.map(
        (s) => `- [${s.completed ? 'x' : ' '}] **${s.title}** (${s.priority}): ${s.description}`
      ),
      ''
    );
  }

  if (opts.includeExtractedText && analysis.extractedText.trim()) {
    lines.push('## Extracted Resume Text', '', '```text', analysis.extractedText.trim(), '```', '');
  }

  return lines.join('\n');
}

export function buildAnalysisTextReport(
  analysis: ResumeAnalysisRecord,
  jobMatch?: JobMatchResult | null,
  options?: ReportExportOptions
): string {
  return buildAnalysisMarkdownReport(analysis, jobMatch, options)
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/```text\n?/g, '')
    .replace(/```/g, '');
}
