import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export function Card({
  children,
  className = '',
  padding = 'md',
  interactive = false,
}: CardProps) {
  const padClass =
    padding === 'none'
      ? ''
      : padding === 'sm'
        ? 'p-4'
        : padding === 'lg'
          ? 'p-6 sm:p-7'
          : 'p-5 sm:p-6';

  return (
    <div
      className={`rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0D1526] text-slate-900 dark:text-slate-100 shadow-xs ${
        interactive
          ? 'transition-colors duration-150 hover:border-indigo-300 dark:hover:border-indigo-700/80'
          : ''
      } ${padClass} ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/80">
      <div className="min-w-0">
        <h2 className="font-display text-base font-semibold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
