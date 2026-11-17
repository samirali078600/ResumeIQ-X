import { runClassicalNlpAnalysis } from './classicalNlp';
import { calculateATSScore } from '../ats/atsScoring';
import type { ATSWeights, CustomSkillEntry } from '../types/resume';

export interface WorkerAnalyzeRequest {
  id: string;
  text: string;
  customSkills: CustomSkillEntry[];
  weights: ATSWeights;
}

self.onmessage = (event: MessageEvent<WorkerAnalyzeRequest>) => {
  const { id, text, customSkills, weights } = event.data;
  try {
    const nlp = runClassicalNlpAnalysis(text, customSkills);
    const ats = calculateATSScore(text, nlp, weights);
    self.postMessage({ id, ok: true, nlp, ats });
  } catch (err) {
    self.postMessage({
      id,
      ok: false,
      error: err instanceof Error ? err.message : 'Worker analysis failed.',
    });
  }
};
