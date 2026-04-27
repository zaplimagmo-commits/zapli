import { useState, useCallback, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Tipos ────────────────────────────────────────────────────
interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolve: ((v: boolean) => void) | null;
}

// ── ConfirmDialog standalone ────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar', variant = 'danger', onConfirm, onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const colors = {
    danger:  { bg: '#fef2f2', border: '#fecaca', icon: '#ef4444', btn: '#ef4444',  hoverBtn: '#dc2626' },
    warning: { bg: '#fffbeb', border: '#fde68a', icon: '#d97706', btn: '#f59e0b',  hoverBtn: '#d97706' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', icon: '#3b82f6', btn: '#6366f1',  hoverBtn: '#4f46e5' },
  }[variant];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      {/* Dialog */}
      <div className="relative bg-card rounded-2xl border shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95"
        style={{ borderColor: colors.border }}>
        <button onClick={onCancel} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X size={15} />
        </button>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: colors.bg }}>
            <AlertTriangle size={20} style={{ color: colors.icon }} />
          </div>
          <div>
            <p className="font-bold text-foreground text-base">{title ?? 'Confirmar ação'}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-2.5 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel} className="text-sm px-5">
            {cancelLabel}
          </Button>
          <Button size="sm" onClick={onConfirm} className="text-sm px-5 text-white font-semibold"
            style={{ background: colors.btn }}>
            {variant === 'danger' && <Trash2 size={12} className="mr-1.5" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Hook useConfirm — imperativo ────────────────────────────
// Uso: const confirm = useConfirm(); await confirm({ message: '...' })
export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    open: false, message: '', resolve: null,
  });

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setState({ ...opts, open: true, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState(s => ({ ...s, open: false, resolve: null }));
  }, [state]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState(s => ({ ...s, open: false, resolve: null }));
  }, [state]);

  const ConfirmNode = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      variant={state.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmNode };
}
