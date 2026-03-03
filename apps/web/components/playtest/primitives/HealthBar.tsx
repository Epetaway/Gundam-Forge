import { cn } from '@/lib/utils/cn';

interface HealthBarProps {
  current: number;
  max: number;
  label?: string;
  className?: string;
}

export function HealthBar({ current, max, label, className }: HealthBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const color =
    pct > 60 ? 'bg-emerald-500' :
    pct > 30 ? 'bg-yellow-500' :
               'bg-red-500';

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="mb-0.5 flex justify-between text-[10px] text-white">
          <span>{label}</span>
          <span className="text-white">{current}/{max}</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className={cn('h-full rounded-full transition-all duration-300', color)}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
