import { runClassicalNlpAnalysis } from './classicalNlp';
import { calculateATSScore, DEFAULT_ATS_WEIGHTS } from '../ats/atsScoring';
import {
  getLoadedModelStatus,
  LOCAL_MODEL_ID,
  scoreResumeDomainsWithModel,
} from './transformersEngine';
import type {
  ATSScoreResult,
  ATSWeights,
  CustomSkillEntry,
  NLPAnalysisResult,
  ResumeAnalysisRecord,
} from '../types/resume';

async function attachOptionalLocalModel(
  text: string,
  nlp: NLPAnalysisResult
): Promise<NLPAnalysisResult> {
  if (getLoadedModelStatus() !== 'ready') {
    return nlp;
  }
  try {
    const topConcepts = await scoreResumeDomainsWithModel(text);
    if (!topConcepts) return nlp;
    return {
      ...nlp,
      methodLabels: {
        ...nlp.methodLabels,
        optionalModel: `Local Transformers.js (${LOCAL_MODEL_ID}) embedding cosine similarity active`,
      },
      transformersModelResult: {
        enabled: true,
        modelId: LOCAL_MODEL_ID,
        status: 'Ready in browser cache',
        topConcepts,
      },
    };
  } catch {
    return nlp;
  }
}

export async function analyzeResumeTextAsync(params: {
  text: string;
  customSkills?: CustomSkillEntry[];
  weights?: ATSWeights;
}): Promise<{ nlp: NLPAnalysisResult; ats: ATSScoreResult }> {
  const { text, customSkills = [], weights = DEFAULT_ATS_WEIGHTS } = params;

  if (typeof Worker !== 'undefined') {
    try {
      const workerResult = await new Promise<{ nlp: NLPAnalysisResult; ats: ATSScoreResult }>(
        (resolve, reject) => {
          const worker = new Worker(new URL('./nlpWorker.ts', import.meta.url), {
            type: 'module',
          });
          const reqId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const timeout = window.setTimeout(() => {
            worker.terminate();
            reject(new Error('Worker timed out'));
          }, 15000);

          worker.onmessage = (ev) => {
            window.clearTimeout(timeout);
            worker.terminate();
            if (ev.data?.ok) {
              resolve({ nlp: ev.data.nlp, ats: ev.data.ats });
            } else {
              reject(new Error(ev.data?.error || 'Worker returned error'));
            }
          };

          worker.onerror = (err) => {
            window.clearTimeout(timeout);
            worker.terminate();
            reject(err);
          };

          worker.postMessage({ id: reqId, text, customSkills, weights });
        }
      );
      const enrichedNlp = await attachOptionalLocalModel(text, workerResult.nlp);
      return { nlp: enrichedNlp, ats: workerResult.ats };
    } catch {
      // Fallback gracefully to main thread async microtask if worker fails
    }
  }

  const classicalResult = await new Promise<{ nlp: NLPAnalysisResult; ats: ATSScoreResult }>(
    (resolve) => {
      window.setTimeout(() => {
        const nlp = runClassicalNlpAnalysis(text, customSkills);
        const ats = calculateATSScore(text, nlp, weights);
        resolve({ nlp, ats });
      }, 0);
    }
  );
  const enrichedNlp = await attachOptionalLocalModel(text, classicalResult.nlp);
  return { nlp: enrichedNlp, ats: classicalResult.ats };
}

export function buildAnalysisRecord(params: {
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'docx' | 'txt' | 'builder';
  extractedText: string;
  pageCount?: number;
  parsingWarnings?: string[];
  nlp: NLPAnalysisResult;
  ats: ATSScoreResult;
  weightsUsed: ATSWeights;
  savedOriginalBase64?: string;
}): ResumeAnalysisRecord {
  const now = new Date().toISOString();
  return {
    id: `an-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fileName: params.fileName,
    fileSize: params.fileSize,
    fileType: params.fileType,
    extractedText: params.extractedText,
    pageCount: params.pageCount,
    parsingWarnings: params.parsingWarnings || [],
    createdAt: now,
    updatedAt: now,
    nlp: params.nlp,
    ats: params.ats,
    weightsUsed: params.weightsUsed,
    savedOriginalBase64: params.savedOriginalBase64,
  };
}
