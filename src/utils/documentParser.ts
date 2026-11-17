import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const MAX_RESUME_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface ParsedDocumentResult {
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'docx' | 'txt';
  text: string;
  pageCount?: number;
  warnings: string[];
  arrayBuffer: ArrayBuffer;
}

export class DocumentParseError extends Error {
  public readonly code:
    | 'INVALID_TYPE'
    | 'FILE_TOO_LARGE'
    | 'EMPTY_FILE'
    | 'SCANNED_PDF'
    | 'MALFORMED_DOCUMENT'
    | 'UNREADABLE_TEXT';

  constructor(
    code:
      | 'INVALID_TYPE'
      | 'FILE_TOO_LARGE'
      | 'EMPTY_FILE'
      | 'SCANNED_PDF'
      | 'MALFORMED_DOCUMENT'
      | 'UNREADABLE_TEXT',
    message: string
  ) {
    super(message);
    this.name = 'DocumentParseError';
    this.code = code;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function detectFileType(file: File): 'pdf' | 'docx' | 'txt' | null {
  const name = file.name.trim().toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf';
  if (
    name.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx';
  }
  if (name.endsWith('.txt') || file.type === 'text/plain') return 'txt';
  return null;
}

function cleanExtractedText(raw: string): string {
  return raw
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function parseResumeFile(
  file: File,
  onProgress?: (percent: number, stage: string) => void
): Promise<ParsedDocumentResult> {
  const detectedType = detectFileType(file);
  if (!detectedType) {
    throw new DocumentParseError(
      'INVALID_TYPE',
      `Unsupported file format ("${file.name}"). Please upload a PDF (.pdf), Word (.docx), or plain text (.txt) file.`
    );
  }

  if (file.size === 0) {
    throw new DocumentParseError(
      'EMPTY_FILE',
      `The uploaded file "${file.name}" is empty (0 bytes).`
    );
  }

  if (file.size > MAX_RESUME_FILE_SIZE_BYTES) {
    throw new DocumentParseError(
      'FILE_TOO_LARGE',
      `File size (${formatFileSize(file.size)}) exceeds the 10 MB browser processing limit. Please upload a smaller document.`
    );
  }

  onProgress?.(10, 'Reading file bytes into browser memory...');
  const arrayBuffer = await file.arrayBuffer();
  const warnings: string[] = [];

  if (detectedType === 'txt') {
    onProgress?.(45, 'Decoding plain text document...');
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawText = decoder.decode(arrayBuffer);
    const cleaned = cleanExtractedText(rawText);

    if (cleaned.replace(/\s+/g, '').length < 20) {
      throw new DocumentParseError(
        'EMPTY_FILE',
        'The text file contains too little readable text (fewer than 20 characters). Please upload a complete resume.'
      );
    }

    onProgress?.(100, 'Text extraction complete.');
    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: 'txt',
      text: cleaned,
      warnings,
      arrayBuffer,
    };
  }

  if (detectedType === 'docx') {
    onProgress?.(35, 'Extracting DOCX XML structure via Mammoth.js...');
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      const cleaned = cleanExtractedText(result.value || '');
      if (result.messages && result.messages.length > 0) {
        result.messages.forEach((m) => {
          if (m.message) warnings.push(`DOCX parser note: ${m.message}`);
        });
      }
      if (cleaned.replace(/\s+/g, '').length < 20) {
        throw new DocumentParseError(
          'EMPTY_FILE',
          'No readable text could be extracted from this DOCX document. Ensure the content is not embedded strictly as images.'
        );
      }
      onProgress?.(100, 'DOCX extraction complete.');
      return {
        fileName: file.name,
        fileSize: file.size,
        fileType: 'docx',
        text: cleaned,
        warnings,
        arrayBuffer,
      };
    } catch (err) {
      if (err instanceof DocumentParseError) throw err;
      throw new DocumentParseError(
        'MALFORMED_DOCUMENT',
        `Failed to parse DOCX file "${file.name}". The archive may be corrupted or not a valid .docx document.`
      );
    }
  }

  // PDF parsing via PDF.js
  onProgress?.(20, 'Initializing PDF.js parser...');
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer.slice(0)),
      useWorkerFetch: false,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    if (numPages === 0) {
      throw new DocumentParseError('EMPTY_FILE', 'This PDF document contains 0 pages.');
    }

    const pageTexts: string[] = [];
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Reconstruct lines using vertical Y-coordinates so bullets and headings stay structured
      const lines: { y: number; items: { x: number; str: string }[] }[] = [];
      for (const item of textContent.items) {
        if (!('str' in item) || !item.str) continue;
        const tx = (item as { transform: number[] }).transform;
        const x = tx ? tx[4] : 0;
        const y = tx ? Math.round(tx[5]) : 0;

        let line = lines.find((l) => Math.abs(l.y - y) <= 3);
        if (!line) {
          line = { y, items: [] };
          lines.push(line);
        }
        line.items.push({ x, str: item.str });
      }

      lines.sort((a, b) => b.y - a.y);
      const reconstructed = lines
        .map((line) => {
          line.items.sort((a, b) => a.x - b.x);
          return line.items.map((it) => it.str).join(' ').replace(/\s{2,}/g, ' ').trim();
        })
        .filter(Boolean)
        .join('\n');

      pageTexts.push(reconstructed);
      const pct = Math.min(95, 25 + Math.round((i / numPages) * 70));
      onProgress?.(pct, `Extracting text from PDF page ${i} of ${numPages}...`);
    }

    const combined = cleanExtractedText(pageTexts.join('\n\n'));
    const nonWhitespaceCount = combined.replace(/\s+/g, '').length;

    if (nonWhitespaceCount < 30) {
      throw new DocumentParseError(
        'SCANNED_PDF',
        `Detected ${numPages} PDF page(s), but no extractable text layer was found. This appears to be a scanned image or flattened graphic PDF. ResumeIQ X does not perform fake OCR—please export a text-selectable PDF, DOCX, or TXT file.`
      );
    }

    if (numPages > 4) {
      warnings.push(
        `Document has ${numPages} pages. Most ATS-friendly resumes are 1–2 pages unless targeting academic/executive CV formats.`
      );
    }

    onProgress?.(100, 'PDF text extraction complete.');
    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: 'pdf',
      text: combined,
      pageCount: numPages,
      warnings,
      arrayBuffer,
    };
  } catch (err) {
    if (err instanceof DocumentParseError) throw err;
    const message = err instanceof Error ? err.message : '';
    if (message.toLowerCase().includes('password')) {
      throw new DocumentParseError(
        'MALFORMED_DOCUMENT',
        'This PDF is password-protected or encrypted. Please upload an unlocked version.'
      );
    }
    throw new DocumentParseError(
      'MALFORMED_DOCUMENT',
      `Unable to parse PDF "${file.name}". The file may be corrupted or non-standard.`
    );
  }
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
