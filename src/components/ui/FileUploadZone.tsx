import { useRef, useState, type DragEvent } from 'react';
import { FileCheck2, FileText, RefreshCw, ShieldCheck, Trash2, UploadCloud } from 'lucide-react';
import { formatFileSize } from '../../utils/documentParser';

interface FileUploadZoneProps {
  onFileSelected: (file: File) => void;
  selectedFile: { name: string; size: number; type: string; pageCount?: number } | null;
  onRemoveFile?: () => void;
  disabled?: boolean;
  acceptLabel?: string;
}

export function FileUploadZone({
  onFileSelected,
  selectedFile,
  onRemoveFile,
  disabled = false,
  acceptLabel = 'PDF, DOCX, or TXT up to 10 MB',
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;
    onFileSelected(files[0]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload resume document"
        className={`group relative overflow-hidden flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed px-6 py-9 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-600 ${
          dragging
            ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 scale-[0.995]'
            : 'border-slate-300 dark:border-slate-700/90 hover:border-indigo-400 dark:hover:border-indigo-500/80 bg-slate-50/70 dark:bg-[#0A1120]'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
          disabled={disabled}
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-200/80 dark:border-indigo-800/70 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 mb-4 transition-transform duration-150 group-hover:-translate-y-0.5">
          <UploadCloud className="h-6 w-6" />
        </div>

        <p className="font-display text-sm font-semibold text-slate-900 dark:text-white">
          {dragging ? 'Release file to analyze locally' : 'Drop your resume here, or click to browse'}
        </p>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {acceptLabel}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Zero server upload</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <FileCheck2 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            <span>PDF.js &amp; Mammoth.js extraction</span>
          </span>
        </div>
      </div>

      {selectedFile && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1222] px-4 py-3 animate-panel-in">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {formatFileSize(selectedFile.size)}
                {' · '}
                {selectedFile.type.toUpperCase()}
                {selectedFile.pageCount ? ` · ${selectedFile.pageCount} page(s)` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Replace</span>
            </button>
            {onRemoveFile && (
              <button
                type="button"
                onClick={onRemoveFile}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors whitespace-nowrap shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
