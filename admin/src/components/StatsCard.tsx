type StatsCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'accent' | 'warning' | 'danger';
};

const TONE_CLASS = {
  default: 'border-border-muted',
  accent: 'border-accent',
  warning: 'border-warning',
  danger: 'border-danger',
};

export function StatsCard({
  label,
  value,
  hint,
  tone = 'default',
}: StatsCardProps) {
  return (
    <div
      className={`panel-motion border bg-surface p-4 ${TONE_CLASS[tone]}`}
    >
      <p className="mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
