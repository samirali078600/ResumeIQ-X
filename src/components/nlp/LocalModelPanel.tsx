import { useEffect, useState } from 'react';
import { CheckCircle2, Cpu, Info, Square, WifiOff } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import {
  abortLocalModelLoad,
  checkBrowserModelCompatibility,
  getModelProgressSnapshot,
  loadLocalEmbeddingModel,
  LOCAL_MODEL_ID,
  subscribeModelProgress,
  unloadLocalEmbeddingModel,
  type TransformerProgressInfo,
} from '../../nlp/transformersEngine';

interface LocalModelPanelProps {
  compact?: boolean;
  onModelReady?: () => void | Promise<void>;
  onModelErrorOrUnavailable?: (reason: string) => void;
}

export function LocalModelPanel({
  compact = false,
  onModelReady,
  onModelErrorOrUnavailable,
}: LocalModelPanelProps) {
  const [modelProgress, setModelProgress] = useState<TransformerProgressInfo>(() =>
    getModelProgressSnapshot()
  );
  const [compat, setCompat] = useState(() => checkBrowserModelCompatibility());

  useEffect(() => {
    const refreshCompat = () => setCompat(checkBrowserModelCompatibility());
    window.addEventListener('online', refreshCompat);
    window.addEventListener('offline', refreshCompat);
    const unsub = subscribeModelProgress((info) => {
      setModelProgress(info);
      setCompat(checkBrowserModelCompatibility());
    });
    return () => {
      window.removeEventListener('online', refreshCompat);
      window.removeEventListener('offline', refreshCompat);
      unsub();
    };
  }, []);

  const isBusy =
    modelProgress.status === 'checking' ||
    modelProgress.status === 'downloading' ||
    modelProgress.status === 'initializing';

  const handleLoad = async () => {
    const ok = await loadLocalEmbeddingModel();
    if (ok) {
      await onModelReady?.();
    } else {
      const latest = getModelProgressSnapshot();
      onModelErrorOrUnavailable?.(latest.message);
    }
  };

  return (
    <Card padding={compact ? 'sm' : 'md'}>
      <CardHeader
        title={`Optional Local Transformer (${LOCAL_MODEL_ID})`}
        subtitle="Runs locally via WebAssembly in your browser. All core NLP, TF-IDF, ATS, and matching features work without downloading this model."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {isBusy && (
              <button
                type="button"
                onClick={abortLocalModelLoad}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 dark:border-amber-800 px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              >
                <Square className="h-3 w-3" />
                <span>Cancel &amp; Use Classical</span>
              </button>
            )}
            {modelProgress.status === 'ready' && (
              <button
                type="button"
                onClick={unloadLocalEmbeddingModel}
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Unload Model
              </button>
            )}
            <button
              type="button"
              onClick={handleLoad}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap"
            >
              <Cpu className="h-4 w-4" />
              <span>
                {isBusy
                  ? modelProgress.status === 'initializing'
                    ? 'Initializing Runtime...'
                    : 'Downloading Weights...'
                  : modelProgress.status === 'ready'
                    ? 'Run Local Model'
                    : 'Load Local Transformer'}
              </span>
            </button>
          </div>
        }
      />

      <div className="space-y-3">
        {/* Browser Compatibility Diagnostics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 px-3 py-2 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">WebAssembly</span>
            <span
              className={`font-semibold ${
                compat.wasmSupported
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {compat.wasmSupported ? 'Supported' : 'Unsupported'}
            </span>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 px-3 py-2 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Browser Cache</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {compat.cacheAvailable ? 'Available' : 'Memory Only'}
            </span>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 px-3 py-2 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Network State</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1">
              {!compat.online && <WifiOff className="h-3 w-3 text-amber-500" />}
              {compat.online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <ProgressBar
          value={modelProgress.progress}
          label={modelProgress.message}
          sublabel={modelProgress.status.toUpperCase()}
          tone={
            modelProgress.status === 'ready'
              ? 'emerald'
              : modelProgress.status === 'error' || modelProgress.status === 'unavailable'
                ? 'amber'
                : 'indigo'
          }
        />

        <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
          {modelProgress.status === 'ready' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          )}
          <p>
            {modelProgress.status === 'ready'
              ? 'Method active: Local Transformers.js embedding vectors alongside deterministic Classical NLP.'
              : 'Graceful fallback active: Classical tokenization, TF-IDF, cosine similarity, skills dictionary, and Compromise.js heuristics operate at 100% capability offline or without downloading model weights.'}
          </p>
        </div>
      </div>
    </Card>
  );
}
