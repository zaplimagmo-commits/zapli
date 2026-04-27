// ============================================================
// InstanceStatusBadge — badge de status de hibernação
// Usado em AppWhatsApp e futuramente no sidebar/admin
// ============================================================

import { Moon, Zap, Loader2, Clock, AlertTriangle } from 'lucide-react';
import type { HibernationState } from '@/lib/hibernationManager';

interface InstanceStatusBadgeProps {
  state:             HibernationState;
  minutesUntilSleep?: number | null;
  minutesSleeping?:  number | null;
  size?:             'sm' | 'md' | 'lg';
  showLabel?:        boolean;
}

const CONFIG = {
  locked: {
    icon:  Zap,
    label: 'Bot ativo 24/7 — não hiberna',
    short: 'Bot ativo',
    bg:    'bg-emerald-50',
    border:'border-emerald-200',
    text:  'text-emerald-700',
    dot:   'bg-emerald-500',
    pulse: true,
  },
  active: {
    icon:  Zap,
    label: 'Instância Ativa',
    short: 'Ativa',
    bg:    'bg-emerald-50',
    border:'border-emerald-200',
    text:  'text-emerald-700',
    dot:   'bg-emerald-500',
    pulse: true,
  },
  idle: {
    icon:  Clock,
    label: 'Entrando em repouso',
    short: 'Em repouso',
    bg:    'bg-amber-50',
    border:'border-amber-200',
    text:  'text-amber-700',
    dot:   'bg-amber-400',
    pulse: false,
  },
  hibernating: {
    icon:  Moon,
    label: 'Hibernando...',
    short: 'Hibernando',
    bg:    'bg-slate-50',
    border:'border-slate-200',
    text:  'text-slate-500',
    dot:   'bg-slate-400',
    pulse: false,
  },
  hibernated: {
    icon:  Moon,
    label: 'Hibernando 💤',
    short: 'Dormindo',
    bg:    'bg-slate-100',
    border:'border-slate-200',
    text:  'text-slate-500',
    dot:   'bg-slate-400',
    pulse: false,
  },
  waking: {
    icon:  Loader2,
    label: 'Acordando...',
    short: 'Acordando',
    bg:    'bg-indigo-50',
    border:'border-indigo-200',
    text:  'text-indigo-600',
    dot:   'bg-indigo-400',
    pulse: false,
  },
} as const;

export function InstanceStatusBadge({
  state,
  minutesUntilSleep,
  minutesSleeping,
  size = 'md',
  showLabel = true,
}: InstanceStatusBadgeProps) {
  const cfg   = CONFIG[state] ?? CONFIG.hibernated;
  const Icon  = cfg.icon;
  const isWaking = state === 'waking';

  const sizeClasses = {
    sm:  'text-xs px-1.5 py-0.5 gap-1',
    md:  'text-xs px-2.5 py-1 gap-1.5',
    lg:  'text-sm px-3 py-1.5 gap-2',
  }[size];

  const iconSize = { sm: 10, md: 12, lg: 14 }[size];

  // Texto de detalhe
  let detail: string | null = null;
  if (state === 'active' && minutesUntilSleep != null && minutesUntilSleep < 30) {
    detail = `hiberna em ${minutesUntilSleep}min`;
  }
  if (state === 'idle' && minutesUntilSleep != null) {
    detail = `hiberna em ${minutesUntilSleep}min`;
  }
  if (state === 'hibernated' && minutesSleeping != null) {
    detail = minutesSleeping < 60
      ? `${minutesSleeping}min dormindo`
      : `${Math.floor(minutesSleeping / 60)}h dormindo`;
  }

  return (
    <span
      className={[
        'inline-flex items-center font-medium rounded-full border',
        cfg.bg, cfg.border, cfg.text, sizeClasses,
      ].join(' ')}
      title={cfg.label}
    >
      {/* Dot pulsante para estado ativo */}
      {cfg.pulse ? (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.dot}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
        </span>
      ) : (
        <Icon
          size={iconSize}
          className={isWaking ? 'animate-spin' : ''}
        />
      )}

      {showLabel && (
        <span>{detail ? `${cfg.short} · ${detail}` : cfg.short}</span>
      )}
    </span>
  );
}

// ---- Painel expandido de hibernação (usado em AppWhatsApp) ----

import type { HibernationLock } from '@/lib/hibernationManager';

interface HibernationPanelProps {
  state:              HibernationState;
  instanceName:       string;
  minutesUntilSleep?: number | null;
  minutesSleeping?:   number | null;
  totalSleeps:        number;
  savedRamMb:         number;
  locks?:             HibernationLock[];
  onHibernate:        () => void;
  onWakeUp:           () => void;
}

export function HibernationPanel({
  state, instanceName, minutesUntilSleep, minutesSleeping,
  totalSleeps, savedRamMb, locks = [], onHibernate, onWakeUp,
}: HibernationPanelProps) {
  const isAsleep  = state === 'hibernated' || state === 'hibernating';
  const isWaking  = state === 'waking';
  const isActive  = state === 'active' || state === 'idle';
  const isLocked  = state === 'locked';

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Moon size={15} className="text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Gerenciamento de Instância</span>
        </div>
        <InstanceStatusBadge
          state={state}
          minutesUntilSleep={minutesUntilSleep}
          minutesSleeping={minutesSleeping}
        />
      </div>

      <div className="p-4 space-y-4">
        {/* Info da instância */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Instância:</span>
          <code className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
            {instanceName}
          </code>
        </div>

        {/* Locks ativos — motivos que impedem hibernação */}
        {isLocked && locks.length > 0 && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
              <Zap size={11} /> Bot operando 24/7 — hibernação bloqueada
            </p>
            {locks.map(lock => (
              <div key={lock.reason} className="flex items-center gap-2 text-xs text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                {lock.label}
              </div>
            ))}
            <p className="text-xs text-emerald-600 pt-1 border-t border-emerald-200 mt-1">
              A instância só hibernará quando todas as atividades forem concluídas.
            </p>
          </div>
        )}

        {isLocked && locks.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Verificando estado do bot...</p>
          </div>
        )}

        {/* Status atual */}
        {isAsleep && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <Moon size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-600">Instância hibernando</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {minutesSleeping != null
                  ? `Dormindo há ${minutesSleeping < 60 ? `${minutesSleeping} minutos` : `${Math.floor(minutesSleeping / 60)}h${minutesSleeping % 60}min`}`
                  : 'Instância desconectada para economizar recursos no servidor.'
                }
              </p>
              <p className="text-xs text-slate-400 mt-1">
                O WhatsApp reconecta automaticamente quando você clicar em Acordar.
              </p>
            </div>
          </div>
        )}

        {state === 'idle' && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-700">Entrando em modo de repouso</p>
              <p className="text-xs text-amber-600 mt-0.5">
                {minutesUntilSleep != null
                  ? `A instância vai hibernar em ${minutesUntilSleep} minutos de inatividade.`
                  : 'Nenhuma atividade detectada. A instância vai hibernar em breve.'
                }
              </p>
            </div>
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-lg font-bold text-slate-700">{totalSleeps}</p>
            <p className="text-xs text-slate-500">hibernações</p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
            <p className="text-lg font-bold text-emerald-700">{savedRamMb} MB</p>
            <p className="text-xs text-emerald-600">RAM economizada</p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-indigo-50 border border-indigo-100">
            <p className="text-lg font-bold text-indigo-700">
              {minutesUntilSleep != null && isActive
                ? minutesUntilSleep >= 60
                  ? `${Math.floor(minutesUntilSleep / 60)}h`
                  : `${minutesUntilSleep}min`
                : '—'
              }
            </p>
            <p className="text-xs text-indigo-600">para hibernar</p>
          </div>
        </div>

        {/* Botões de controle */}
        <div className="flex gap-2">
          {/* Botão hibernar só aparece se não houver locks */}
        {isActive && locks.length === 0 && (
            <button
              onClick={onHibernate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Moon size={12} />
              Hibernar agora
            </button>
          )}
          {(isAsleep || isWaking) && (
            <button
              onClick={onWakeUp}
              disabled={isWaking}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isWaking ? (
                <><Loader2 size={12} className="animate-spin" /> Acordando...</>
              ) : (
                <><Zap size={12} /> Acordar instância</>
              )}
            </button>
          )}
        </div>

        {/* Dica */}
        <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">
          💡 A hibernação libera RAM no servidor. Cada instância usa ~256MB — com hibernação, o Zapli suporta 10× mais empresas com a mesma infra.
        </p>
      </div>
    </div>
  );
}
