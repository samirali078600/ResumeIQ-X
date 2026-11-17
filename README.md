# ResumeIQ X

**Your Career. Analyzed. Optimized. Elevated.**

ResumeIQ X is a complete browser-based resume intelligence platform built with React, TypeScript, Vite, and Tailwind CSS. All document extraction, language analysis, ATS scoring, job description matching, resume authoring, and PDF generation run strictly inside the user's browser without external cloud services, backend servers, or remote databases.

## Core Capabilities

- **Client-Side Document Parsing**: Extracts text from `.pdf` (PDF.js), `.docx` (Mammoth.js), and `.txt` files with empty-file validation, size limits, malformed file handling, and scanned/image-PDF detection.
- **Hybrid NLP Engine**:
  - **Classical NLP & Heuristics**: Compromise.js POS/NER, tokenization, stopword filtering, Porter-style stemming, n-gram extraction, duplicate detection, action verbs, weak phrases, and bullet quality auditing executed inside a Web Worker.
  - **Statistical Matching**: TF-IDF vectorization, cosine similarity, keyword overlap, and section-aware skill evidence matching.
  - **Optional Local Transformer Inference**: Optional in-browser loading of `Xenova/all-MiniLM-L6-v2` via `@huggingface/transformers` with download progress and graceful fallback to classical NLP.
- **Transparent ATS Scoring**: 14 configurable weighted categories with exact score contributions, document evidence, improvement checklists, and explicit heuristic disclaimers.
- **Resume Builder & 6 Templates**: Modern Professional, Minimal ATS, Classic Corporate, Technical Developer, Fresh Graduate, and Creative Professional — with live preview, section reordering, local versioning, print layout, and jsPDF export.
- **Cover Letter Studio**: Deterministic rule-based cover letter composer across 5 tones grounded strictly in verified user resume data.
- **Career Intelligence, Skills Gap & Multi-Resume Comparison**: Track readiness evaluation and side-by-side comparison charts with PDF export.
- **Local-First Storage**: IndexedDB persistence via Dexie.js (only on user consent), localStorage UI preferences, JSON backup export/import with schema validation, and storage quota diagnostics.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The development server runs at `http://localhost:3000`.

## Type-Check & Build

```bash
npm run lint
npm run build
```

Production assets are emitted to `dist/`.

## Deployment

Because ResumeIQ X is a purely static client-side Single Page Application (SPA):

1. Run `npm run build` to generate the `dist/` directory.
2. Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, or Nginx).
3. Configure SPA fallback rewrites so all routes (`/workspace`, `/analyzer`, `/ats-intelligence`, etc.) serve `index.html`.
