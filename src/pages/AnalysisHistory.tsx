import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, FileUp, FolderOpen, Search, Trash2 } from 'lucide-react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/StateViews';
import {
  exportLocalBackup,
  importLocalBackup,
  isQuotaExceededError,
  validateBackupPayload,
} from '../db/database';
import { exportAnalysisReportPdf } from '../utils/pdfExport';
import { useAppStore } from '../store/useAppStore';

export default function AnalysisHistory() {
  const navigate = useNavigate();
  const analyses = useAppStore((s) => s.analyses);
  const setActiveAnalysis = useAppStore((s) => s.setActiveAnalysis);
  const deleteAnalysis = useAppStore((s) => s.deleteAnalysis);
  const clearAnalysesHistory = useAppStore((s) => s.clearAnalysesHistory);
  const hydrateFromIndexedDb = useAppStore((s) => s.hydrateFromIndexedDb);
  const addToast = useAppStore((s) => s.addToast);

  const [rawSearch, setRawSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'docx' | 'txt'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'score-desc' | 'name-asc'>('newest');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Debounce search
  useEffect(() => {
    const id = window.setTimeout(() => setSearchQuery(rawSearch.trim().toLowerCase()), 200);
    return () => window.clearTimeout(id);
  }, [rawSearch]);

  const filtered = useMemo(() => {
    return analyses
      .filter((a) => {
        if (typeFilter !== 'all' && a.fileType !== typeFilter) return false;
        if (searchQuery) {
          const inName = a.fileName.toLowerCase().includes(searchQuery);
          const inSkills = a.nlp.skills.found.some((s) =>
            s.name.toLowerCase().includes(searchQuery)
          );
          return inName || inSkills;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score-desc') return b.ats.overallScore - a.ats.overallScore;
        if (sortBy === 'name-asc') return a.fileName.localeCompare(b.fileName);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [analyses, typeFilter, searchQuery, sortBy]);

  const handleExportBackup = async () => {
    try {
      const payload = await exportLocalBackup();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ResumeIQX_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', title: 'Local JSON backup downloaded' });
    } catch {
      addToast({
        type: 'error',
        title: 'Backup export failed',
        description: 'IndexedDB storage could not be read in this browser context.',
      });
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!validateBackupPayload(parsed)) {
        addToast({
          type: 'error',
          title: 'Invalid backup schema',
          description: 'Selected JSON file does not match the ResumeIQ X backup format.',
        });
        return;
      }
      const res = await importLocalBackup(parsed);
      await hydrateFromIndexedDb();
      addToast({
        type: 'success',
        title: 'Backup restored',
        description: `Imported ${res.analysesImported} analyses and ${res.resumesImported} resume drafts.`,
      });
    } catch (err) {
      if (err instanceof SyntaxError) {
        addToast({
          type: 'error',
          title: 'Failed to import backup',
          description: 'File is not valid JSON.',
        });
      } else if (isQuotaExceededError(err)) {
        addToast({
          type: 'error',
          title: 'Storage quota exceeded',
          description: 'Not enough browser IndexedDB quota to import this backup.',
        });
      } else {
        addToast({
          type: 'error',
          title: 'Backup import failed',
          description: err instanceof Error ? err.message : 'Unable to write backup to IndexedDB.',
        });
      }
    }
  };

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Analysis History &amp; Local Backups
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Clearing browser site data or switching devices removes IndexedDB records unless you export a backup.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Backup JSON</span>
            </button>
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap">
              <FileUp className="h-3.5 w-3.5" />
              <span>Import Backup</span>
              <input type="file" accept=".json,application/json" className="hidden" onChange={handleImportBackup} />
            </label>
            {analyses.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 px-3.5 py-2 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Search, Filter, Sort */}
        <Card padding="sm">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-6 relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                placeholder="Search by filename or detected skill..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                aria-label="Filter by file type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                <option value="all">All File Types</option>
                <option value="pdf">PDF Only</option>
                <option value="docx">DOCX Only</option>
                <option value="txt">TXT Only</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <select
                aria-label="Sort analyses"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="score-desc">Highest ATS Score</option>
                <option value="name-asc">Filename (A–Z)</option>
              </select>
            </div>
          </div>
        </Card>

        {filtered.length === 0 ? (
          <EmptyState
            title={analyses.length === 0 ? 'No saved analyses in IndexedDB' : 'No matching records found'}
            description={
              analyses.length === 0
                ? 'Analyze a resume and consent to save it locally to build your version history.'
                : 'Try clearing your search query or switching the file type filter.'
            }
            action={
              analyses.length === 0 ? (
                <Link
                  to="/analyzer"
                  className="inline-flex items-center rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Analyze a Resume
                </Link>
              ) : undefined
            }
          />
        ) : (
          <Card>
            <CardHeader title={`Saved Analyses (${filtered.length})`} />
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {item.fileName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {item.fileType.toUpperCase()} · {item.nlp.tokenStats.totalWords} words ·{' '}
                      {item.nlp.skills.found.length} skills ·{' '}
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <span className="font-mono text-sm font-bold tabular-nums text-indigo-600 dark:text-indigo-400 mr-2">
                      {item.ats.overallScore}/100
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAnalysis(item);
                        navigate('/ats-intelligence');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      <span>Open</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => exportAnalysisReportPdf(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(item.id)}
                      aria-label={`Delete ${item.fileName}`}
                      className="inline-flex items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900/60 p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (deleteTargetId) {
            await deleteAnalysis(deleteTargetId);
            addToast({ type: 'info', title: 'Deleted analysis record' });
          }
        }}
        title="Delete Saved Analysis"
        message="Remove this resume analysis permanently from your browser's IndexedDB?"
        confirmLabel="Delete"
        destructive
      />

      <ConfirmDialog
        open={confirmClearAll}
        onClose={() => setConfirmClearAll(false)}
        onConfirm={async () => {
          await clearAnalysesHistory();
          addToast({ type: 'info', title: 'Cleared all saved analysis history' });
        }}
        title="Clear All Analysis History"
        message="This will remove every saved analysis record from IndexedDB. Export a JSON backup first if you want to keep a copy."
        confirmLabel="Clear History"
        destructive
      />
    </WorkspaceLayout>
  );
}
