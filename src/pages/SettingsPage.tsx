import { useEffect, useState } from 'react';
import { Download, FileUp, RotateCcw, Trash2 } from 'lucide-react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ConfirmDialog } from '../components/ui/Modal';
import {
  clearAllLocalData,
  exportLocalBackup,
  getStorageAvailability,
  importLocalBackup,
  isQuotaExceededError,
  validateBackupPayload,
} from '../db/database';
import { DEFAULT_ATS_WEIGHTS } from '../ats/atsScoring';
import { formatFileSize } from '../utils/documentParser';
import {
  checkBrowserModelCompatibility,
  unloadLocalEmbeddingModel,
} from '../nlp/transformersEngine';
import { useAppStore } from '../store/useAppStore';

export default function SettingsPage() {
  const profile = useAppStore((s) => s.profile);
  const saveProfile = useAppStore((s) => s.saveProfile);
  const setAtsWeights = useAppStore((s) => s.setAtsWeights);
  const hydrateFromIndexedDb = useAppStore((s) => s.hydrateFromIndexedDb);
  const addToast = useAppStore((s) => s.addToast);

  const [storageInfo, setStorageInfo] = useState<{
    available: boolean;
    usageBytes?: number;
    quotaBytes?: number;
    error?: string;
  } | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [compat] = useState(() => checkBrowserModelCompatibility());

  useEffect(() => {
    getStorageAvailability().then(setStorageInfo);
  }, []);

  const handleExportAll = async () => {
    try {
      const payload = await exportLocalBackup();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ResumeIQX_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', title: 'Full JSON backup exported' });
    } catch {
      addToast({
        type: 'error',
        title: 'Backup export failed',
        description: 'IndexedDB storage is unavailable.',
      });
    }
  };

  const handleImportAll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!validateBackupPayload(parsed)) {
        addToast({ type: 'error', title: 'Invalid backup file schema' });
        return;
      }
      const res = await importLocalBackup(parsed);
      await hydrateFromIndexedDb();
      addToast({
        type: 'success',
        title: 'Local backup restored',
        description: `Imported ${res.analysesImported} analyses, ${res.resumesImported} resumes, ${res.jobMatchesImported} job matches.`,
      });
    } catch (err) {
      if (err instanceof SyntaxError) {
        addToast({ type: 'error', title: 'Could not read JSON backup file' });
      } else if (isQuotaExceededError(err)) {
        addToast({
          type: 'error',
          title: 'Storage quota exceeded',
          description: 'Not enough browser storage space to restore backup.',
        });
      } else {
        addToast({
          type: 'error',
          title: 'Backup restore failed',
          description: err instanceof Error ? err.message : 'Unable to write to IndexedDB.',
        });
      }
    }
  };

  const handleWipeAll = async () => {
    try {
      await clearAllLocalData();
    } catch {
      // continue clearing in-memory session even if IndexedDB was unavailable
    }
    useAppStore.getState().signOut();
    unloadLocalEmbeddingModel();
    setAtsWeights({ ...DEFAULT_ATS_WEIGHTS });
    await hydrateFromIndexedDb();
    getStorageAvailability().then(setStorageInfo);
    addToast({ type: 'info', title: 'All local IndexedDB data deleted' });
  };

  return (
    <WorkspaceLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Application Settings &amp; Privacy
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Configure theme appearance, NLP processing mode, local storage consent, and data backups.
          </p>
        </div>

        {/* Theme */}
        <Card>
          <CardHeader
            title="Appearance &amp; Theme"
            subtitle="Saved in localStorage; system preference is detected automatically on first visit"
          />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm text-slate-700 dark:text-slate-300">Preferred Color Theme</span>
            <ThemeToggle />
          </div>
        </Card>

        {/* NLP Preference */}
        <Card>
          <CardHeader
            title="NLP Engine Preference"
            subtitle="Classical NLP runs instantly with zero downloads; Transformers.js is optional"
          />
          <div className="space-y-3 text-sm">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="nlpPref"
                checked={profile.nlpModelPreference === 'classical'}
                onChange={() => saveProfile({ nlpModelPreference: 'classical' })}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Classical JavaScript NLP + TF-IDF (Recommended Default)
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Zero model downloads, deterministic results, runs in Web Worker.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="nlpPref"
                checked={profile.nlpModelPreference === 'transformers'}
                onChange={() => saveProfile({ nlpModelPreference: 'transformers' })}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Hybrid Classical + Optional Local Transformers.js
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enables downloading local embedding weights in NLP Laboratory &amp; Job Matching.
                </p>
              </div>
            </label>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#080D1A] px-3 py-2 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">WebAssembly</span>
                <span className={compat.wasmSupported ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'font-semibold text-rose-600'}>
                  {compat.wasmSupported ? 'Supported' : 'Unsupported'}
                </span>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#080D1A] px-3 py-2 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Browser Cache</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {compat.cacheAvailable ? 'Available' : 'Memory Only'}
                </span>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#080D1A] px-3 py-2 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Network</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {compat.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Privacy & Local Persistence Controls */}
        <Card>
          <CardHeader
            title="Local Storage &amp; Consent Controls"
            subtitle="IndexedDB data resides unencrypted in your browser and can be cleared by browser privacy settings"
          />
          <div className="space-y-4 text-sm">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.consentToSaveLocal}
                onChange={(e) => saveProfile({ consentToSaveLocal: e.target.checked })}
                className="mt-1 rounded border-slate-300 text-indigo-600"
              />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Allow saving job matches &amp; profile preferences to IndexedDB
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Individual resume analyses still require explicit save confirmation in the Analyzer.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.saveOriginalDocs}
                onChange={(e) => saveProfile({ saveOriginalDocs: e.target.checked })}
                className="mt-1 rounded border-slate-300 text-indigo-600"
              />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Default to storing original binary PDF/DOCX bytes when saving
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Off by default to keep storage usage minimal and keep original files in memory only.
                </p>
              </div>
            </label>

            {storageInfo && (
              <div className="rounded-lg bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-slate-800 p-3.5 text-xs space-y-2">
                {storageInfo.available ? (
                  <>
                    <p className="text-slate-700 dark:text-slate-300 tabular-nums">
                      IndexedDB Status: <strong className="text-emerald-600 dark:text-emerald-400">Available</strong>
                      {typeof storageInfo.usageBytes === 'number' &&
                        typeof storageInfo.quotaBytes === 'number' &&
                        ` · Used ${formatFileSize(storageInfo.usageBytes)} of ${formatFileSize(storageInfo.quotaBytes)} browser quota`}
                    </p>
                    {typeof storageInfo.usageBytes === 'number' &&
                      typeof storageInfo.quotaBytes === 'number' &&
                      storageInfo.quotaBytes > 0 && (
                        <ProgressBar
                          value={Math.max(1, (storageInfo.usageBytes / storageInfo.quotaBytes) * 100)}
                          size="sm"
                          tone="indigo"
                        />
                      )}
                  </>
                ) : (
                  <p className="text-rose-600 dark:text-rose-400">
                    IndexedDB Unavailable: {storageInfo.error}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Data Backup & Reset */}
        <Card>
          <CardHeader title="Data Portability &amp; Reset" />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportAll}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Download className="h-4 w-4" />
              <span>Export All Local Data (JSON)</span>
            </button>

            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
              <FileUp className="h-4 w-4" />
              <span>Import Backup JSON</span>
              <input type="file" accept=".json,application/json" className="hidden" onChange={handleImportAll} />
            </label>

            <button
              type="button"
              onClick={() => {
                setAtsWeights({ ...DEFAULT_ATS_WEIGHTS });
                addToast({ type: 'info', title: 'ATS scoring weights reset to default' });
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset ATS Weights</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmWipe(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-semibold text-white"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete All Local Data</span>
            </button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmWipe}
        onClose={() => setConfirmWipe(false)}
        onConfirm={handleWipeAll}
        title="Delete All Local Data"
        message="This permanently erases your local profile, saved resume analyses, job match history, resume builder drafts, cover letters, and custom skills from IndexedDB."
        confirmLabel="Erase Everything"
        destructive
      />
    </WorkspaceLayout>
  );
}
