import type { ContactStatus } from '@/lib/index';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/index';

// ── Status Badge ──────────────────────────────────────────────
export function StatusBadge({ status, size = 'md' }: { status: ContactStatus; size?: 'sm' | 'md' }) {
  const c = STATUS_COLORS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${c.bg} ${c.text} ${c.border} ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}>
      <span className="rounded-full shrink-0" style={{ width: 6, height: 6, background: c.dot }} />
      {STATUS_LABELS[status]}
    </span>
  );
}

// ── Page Header ────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = 'var(--primary)', sub }: {
  label: string; value: string | number; icon: React.ReactNode; color?: string; sub?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex items-start gap-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Plan Badge ─────────────────────────────────────────────────
export function PlanBadge({ planId }: { planId: string }) {
  const styles: Record<string, string> = {
    starter: 'bg-slate-100 text-slate-600 border-slate-200',
    pro: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    business: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  const labels: Record<string, string> = { starter: 'Starter', pro: 'Pro', business: 'Business' };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${styles[planId] || styles.starter}`}>
      {labels[planId] || planId}
    </span>
  );
}

// ── Empty State ─────────────────────────────────────────────────
export function EmptyState({ message, icon = '📭' }: { message: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 text-xl">{icon}</div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

// ── User Avatar ────────────────────────────────────────────────
export function UserAvatar({ name, size = 8, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${className}`}
      style={{ background: 'var(--primary)', width: `${size * 4}px`, height: `${size * 4}px` }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
