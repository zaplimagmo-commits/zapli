import type { ProspectStatus } from '@/lib/index';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/index';

interface StatusBadgeProps {
  status: ProspectStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];
  const dotColors: Record<ProspectStatus, string> = {
    aguardando: '#3b82f6',
    followup: '#d97706',
    respondido: '#7c3aed',
    convertido: '#059669',
    arquivado: '#9ca3af',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${colors.bg} ${colors.text} ${colors.border} ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}
    >
      <span
        className="rounded-full shrink-0"
        style={{ width: 6, height: 6, background: dotColors[status] }}
      />
      {label}
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  sub?: string;
}

export function StatCard({ label, value, icon, color = 'var(--primary)', sub }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex items-start gap-4"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <span className="text-muted-foreground text-xl">📭</span>
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
