interface ProgressBarProps {
  value: number;
  label?: string;
  sublabel?: string;
  tone?: 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose';
  size?: 'sm' | 'md';
}

export function ProgressBar({
  value,
  label,
  sublabel,
  tone = 'indigo',
  size = 'md',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const fillClass =
    tone === 'emerald'
      ? 'bg-emerald-600 dark:bg-emerald-500'
      : tone === 'amber'
        ? 'bg-amber-600 dark:bg-amber-500'
        : tone === 'rose'
          ? 'bg-rose-600 dark:bg-rose-500'
          : tone === 'violet'
            ? 'bg-violet-600 dark:bg-violet-500'
            : 'bg-indigo-600 dark:bg-indigo-500';

  return (
    <div className="space-y-1.5 w-full">
      {(label || sublabel) && (
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
            {label}
          </span>
          <span className="font-mono font-medium tabular-nums text-slate-600 dark:text-slate-400 shrink-0">
            {sublabel || `${clamped}%`}
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`${
          size === 'sm' ? 'h-1.5' : 'h-2'
        } w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/90`}
      >
        <div
          className={`h-full transition-[width] duration-200 ease-out rounded-full ${fillClass}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
