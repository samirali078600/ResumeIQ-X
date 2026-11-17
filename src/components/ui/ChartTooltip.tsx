interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  suffix?: string;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  suffix = '',
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700/90 bg-white dark:bg-[#0E172A] px-3 py-2 shadow-lg text-xs">
      {label !== undefined && label !== '' && (
        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1 truncate max-w-[200px]">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span
                className="h-2 w-2 rounded-xs shrink-0"
                style={{ backgroundColor: entry.color || '#4F46E5' }}
              />
              <span className="truncate max-w-[140px]">{entry.name || entry.dataKey}</span>
            </span>
            <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
              {entry.value}
              {suffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
