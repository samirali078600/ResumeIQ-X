import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const dismissToast = useAppStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0 no-print"
    >
      {toasts.map((t) => {
        const Icon =
          t.type === 'success'
            ? CheckCircle2
            : t.type === 'error'
              ? AlertCircle
              : t.type === 'warning'
                ? AlertTriangle
                : Info;

        const iconColor =
          t.type === 'success'
            ? 'text-emerald-600 dark:text-emerald-400'
            : t.type === 'error'
              ? 'text-rose-600 dark:text-rose-400'
              : t.type === 'warning'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-indigo-600 dark:text-indigo-400';

        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-lg"
          >
            <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.title}</p>
              {t.description && (
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {t.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
