// Optional local Transformers.js semantic feature extraction
// Core NLP, ATS scoring, and TF-IDF matching operate fully without this model.
// Falls back cleanly to Classical NLP whenever unavailable, offline, or aborted.

export type ModelLifecycleStatus =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'initializing'
  | 'ready'
  | 'unavailable'
  | 'error';

export interface TransformerProgressInfo {
  status: ModelLifecycleStatus;
  progress: number;
  message: string;
  modelId: string;
  activeFile?: string;
  fallbackActive: boolean;
}

export interface BrowserCompatibilityReport {
  supported: boolean;
  wasmSupported: boolean;
  cacheAvailable: boolean;
  online: boolean;
  deviceMemoryGb?: number;
  reason?: string;
}

export const LOCAL_MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

let extractorInstance: ((
  text: string | string[],
  opts?: Record<string, unknown>
) => Promise<{ data: Float32Array; dims: number[] }>) | null = null;
let currentStatus: ModelLifecycleStatus = 'idle';
let activeAbortController: AbortController | null = null;
let currentProgressInfo: TransformerProgressInfo = {
  status: 'idle',
  progress: 0,
  message: 'Classical NLP is active. Optional local Transformers.js model is not loaded.',
  modelId: LOCAL_MODEL_ID,
  fallbackActive: true,
};

const listeners = new Set<(info: TransformerProgressInfo) => void>();

function emitProgress(info: TransformerProgressInfo): void {
  currentProgressInfo = info;
  currentStatus = info.status;
  listeners.forEach((fn) => fn(info));
}

export function subscribeModelProgress(
  listener: (info: TransformerProgressInfo) => void
): () => void {
  listeners.add(listener);
  listener(currentProgressInfo);
  return () => {
    listeners.delete(listener);
  };
}

export function getModelProgressSnapshot(): TransformerProgressInfo {
  return currentProgressInfo;
}

export function checkBrowserModelCompatibility(): BrowserCompatibilityReport {
  const wasmSupported = typeof WebAssembly !== 'undefined';
  const cacheAvailable = typeof caches !== 'undefined' || typeof indexedDB !== 'undefined';
  const online = typeof navigator === 'undefined' ? true : navigator.onLine;
  const deviceMemoryGb =
    typeof navigator !== 'undefined' && 'deviceMemory' in navigator
      ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory)
      : undefined;

  if (!wasmSupported) {
    return {
      supported: false,
      wasmSupported,
      cacheAvailable,
      online,
      deviceMemoryGb,
      reason: 'WebAssembly is disabled or unsupported in this browser. Classical NLP remains active.',
    };
  }

  if (!online && !extractorInstance) {
    return {
      supported: false,
      wasmSupported,
      cacheAvailable,
      online,
      deviceMemoryGb,
      reason:
        'Browser is offline and the local model is not yet loaded in memory. Continuing with Classical NLP.',
    };
  }

  return {
    supported: true,
    wasmSupported,
    cacheAvailable,
    online,
    deviceMemoryGb,
  };
}

export function getLoadedModelStatus(): ModelLifecycleStatus {
  return currentStatus;
}

export function abortLocalModelLoad(): void {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
  emitProgress({
    status: 'idle',
    progress: 0,
    message: 'Local model download cancelled. Graceful fallback to Classical NLP is active.',
    modelId: LOCAL_MODEL_ID,
    fallbackActive: true,
  });
}

export async function loadLocalEmbeddingModel(
  onProgress?: (info: TransformerProgressInfo) => void
): Promise<boolean> {
  if (extractorInstance) {
    const readyInfo: TransformerProgressInfo = {
      status: 'ready',
      progress: 100,
      message: `Local model ${LOCAL_MODEL_ID} is loaded and active.`,
      modelId: LOCAL_MODEL_ID,
      fallbackActive: false,
    };
    emitProgress(readyInfo);
    onProgress?.(readyInfo);
    return true;
  }

  const checkInfo: TransformerProgressInfo = {
    status: 'checking',
    progress: 2,
    message: 'Checking WebAssembly, browser cache, and network compatibility...',
    modelId: LOCAL_MODEL_ID,
    fallbackActive: true,
  };
  emitProgress(checkInfo);
  onProgress?.(checkInfo);

  const compat = checkBrowserModelCompatibility();
  if (!compat.supported) {
    const unavailableInfo: TransformerProgressInfo = {
      status: 'unavailable',
      progress: 0,
      message: compat.reason || 'Local embedding runtime unavailable. Using Classical NLP.',
      modelId: LOCAL_MODEL_ID,
      fallbackActive: true,
    };
    emitProgress(unavailableInfo);
    onProgress?.(unavailableInfo);
    return false;
  }

  activeAbortController = new AbortController();
  const signal = activeAbortController.signal;

  try {
    const startInfo: TransformerProgressInfo = {
      status: 'downloading',
      progress: 6,
      message: 'Loading Transformers.js WebAssembly runtime...',
      modelId: LOCAL_MODEL_ID,
      fallbackActive: true,
    };
    emitProgress(startInfo);
    onProgress?.(startInfo);

    const transformers = await import('@huggingface/transformers');
    if (signal.aborted) return false;

    if (transformers.env) {
      transformers.env.allowLocalModels = false;
      transformers.env.useBrowserCache = true;
    }

    const fileProgress = new Map<string, number>();

    const pipe = await transformers.pipeline('feature-extraction', LOCAL_MODEL_ID, {
      progress_callback: (ev: { status?: string; progress?: number; file?: string }) => {
        if (signal.aborted) return;
        const file = ev.file || 'weights';
        if (typeof ev.progress === 'number') {
          fileProgress.set(file, ev.progress);
        }
        const values = Array.from(fileProgress.values());
        const avgPct =
          values.length > 0
            ? Math.round(values.reduce((acc, v) => acc + v, 0) / values.length)
            : typeof ev.progress === 'number'
              ? Math.round(ev.progress)
              : 15;

        const nextStatus: ModelLifecycleStatus = avgPct >= 98 ? 'initializing' : 'downloading';
        const info: TransformerProgressInfo = {
          status: nextStatus,
          progress: Math.max(6, Math.min(99, avgPct)),
          activeFile: ev.file,
          message:
            nextStatus === 'initializing'
              ? 'Initializing ONNX WebAssembly embedding pipeline...'
              : ev.file
                ? `Downloading ${ev.file} (${avgPct}%)`
                : `Downloading local model weights (${avgPct}%)...`,
          modelId: LOCAL_MODEL_ID,
          fallbackActive: true,
        };
        emitProgress(info);
        onProgress?.(info);
      },
    });

    if (signal.aborted) {
      return false;
    }

    extractorInstance = pipe as unknown as typeof extractorInstance;
    activeAbortController = null;
    const readyInfo: TransformerProgressInfo = {
      status: 'ready',
      progress: 100,
      message: `Local model ${LOCAL_MODEL_ID} ready in browser cache (runs side-by-side with Classical NLP).`,
      modelId: LOCAL_MODEL_ID,
      fallbackActive: false,
    };
    emitProgress(readyInfo);
    onProgress?.(readyInfo);
    return true;
  } catch (err) {
    activeAbortController = null;
    const errInfo: TransformerProgressInfo = {
      status: 'error',
      progress: 0,
      message:
        err instanceof Error
          ? `Model unavailable (${err.message}). Classical NLP remains active.`
          : 'Unable to load local transformer model. Classical NLP remains active.',
      modelId: LOCAL_MODEL_ID,
      fallbackActive: true,
    };
    emitProgress(errInfo);
    onProgress?.(errInfo);
    return false;
  }
}

function cosineSimilarityVec(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dot / denom : 0;
}

export async function computeSemanticSimilarityWithModel(
  textA: string,
  textB: string
): Promise<number | null> {
  if (!extractorInstance) return null;
  try {
    const snippetA = textA.slice(0, 2200);
    const snippetB = textB.slice(0, 2200);
    const outA = await extractorInstance(snippetA, { pooling: 'mean', normalize: true });
    const outB = await extractorInstance(snippetB, { pooling: 'mean', normalize: true });
    const sim = cosineSimilarityVec(outA.data, outB.data);
    return Math.max(0, Math.min(100, Math.round(sim * 100)));
  } catch {
    return null;
  }
}

export async function scoreResumeDomainsWithModel(
  resumeText: string
): Promise<{ label: string; similarity: number }[] | null> {
  if (!extractorInstance) return null;
  const domains = [
    'Software Engineering & Full-Stack Web Development',
    'Data Science, Machine Learning & Analytics',
    'Cloud Architecture, DevOps & Site Reliability',
    'Product Management & Technical Leadership',
    'UX/UI Design & Design Systems',
    'Cybersecurity & Application Security',
  ];
  try {
    const resOut = await extractorInstance(resumeText.slice(0, 2200), {
      pooling: 'mean',
      normalize: true,
    });
    const results: { label: string; similarity: number }[] = [];
    for (const label of domains) {
      const domOut = await extractorInstance(label, { pooling: 'mean', normalize: true });
      const sim = cosineSimilarityVec(resOut.data, domOut.data);
      results.push({ label, similarity: Math.max(0, Math.min(100, Math.round(sim * 100))) });
    }
    results.sort((a, b) => b.similarity - a.similarity);
    return results;
  } catch {
    return null;
  }
}

export function unloadLocalEmbeddingModel(): void {
  extractorInstance = null;
  activeAbortController = null;
  emitProgress({
    status: 'idle',
    progress: 0,
    message: 'Model unloaded from memory. Classical NLP active.',
    modelId: LOCAL_MODEL_ID,
    fallbackActive: true,
  });
}
