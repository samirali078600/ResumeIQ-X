import type { ReactNode } from 'react';
import { AlertCircle, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0D1526] px-6 py-14 shadow-xs animate-panel-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-200/70 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-4">
        {icon || <Inbox className="h-5 w-5" />}
      </div>
      <h3 className="font-display text-base font-semibold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {description}
      </p>
      {action && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  message: string;
  action?: ReactNode;
}

export function ErrorState({ title, message, action }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-200 dark:border-rose-900/70 bg-rose-50/80 dark:bg-rose-950/30 p-5 animate-panel-in"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm font-semibold text-rose-950 dark:text-rose-200">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-rose-800 dark:text-rose-300">
            {message}
          </p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </div>
  );
}

interface LoadingSkeletonProps {
  rows?: number;
  variant?: 'dashboard' | 'table' | 'analysis';
}

export function LoadingSkeleton({ rows = 4, variant = 'dashboard' }: LoadingSkeletonProps) {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading workspace">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 rounded-lg bg-slate-200 dark:bg-slate-800/90" />
          <div className="h-4 w-80 max-w-full rounded-md bg-slate-200/70 dark:bg-slate-800/60" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-slate-200 dark:bg-slate-800/90" />
      </div>

      {variant === 'dashboard' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-[#0D1526] p-4 space-y-3"
            >
              <div className="h-3.5 w-28 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-7 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-32 rounded bg-slate-200/70 dark:bg-slate-800/70" />
            </div>
          ))}
        </div>
      )}

      {variant === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-[#0D1526]" />
          <div className="h-64 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-[#0D1526]" />
        </div>
      )}

      <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-[#0D1526] p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-full rounded-lg bg-slate-100 dark:bg-slate-800/60"
          />
        ))}
      </div>
    </div>
  );
}
