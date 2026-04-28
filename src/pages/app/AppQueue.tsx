import { useState, useEffect, useMemo } from 'react';
import { useAuth, useProspect } from '@/hooks/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { defaultSendSettings } from '@/data/sendData';
import type { QueueItem, SendSettings } from '@/lib/index';
import { QueueProcessor, type QueueEvent } from '@/lib/queueProcessor';
import {
  Play, Pause, Square, Settings, Clock, Zap,
  CheckCircle2, AlertCircle, Loader2, Circle, SkipForward,
  Wifi, WifiOff, LayoutList
} from 'lucide-react';
import { useEvolution } from '@/hooks/useEvolution';

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'sent':    return <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs px-2 py-0.5 rounded-full font-medium"><CheckCircle2 size={11} /> Enviado</span>;
    case 'sending': return <span className="flex items-center gap-1 text-sky-700 bg-sky-50 border border-sky-200 text-xs px-2 py-0.5 rounded-full font-medium"><Loader2 size={11} className="animate-spin" /> Enviando...</span>;
    case 'pending': return <span className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-medium"><Circle size={11} /> Pendente</span>;
    case 'failed':  return <span className="flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 text-xs px-2 py-0.5 rounded-full font-medium"><AlertCircle size={11} /> Falhou</span>;
    case 'skipped': return <span className="flex items-center gap-1 text-gray-500 bg-gray-100 border border-gray-200 text-xs px-2 py-0.5 rounded-full font-medium"><SkipForward size={11} /> Ignorado</span>;
    default:        return null;
  }
}

export default function AppQueue() {
  const { user } = useAuth();
  const { contacts } = useProspect();
  const {
    connectionStatus, queue: evoQueue, queueRunning, queuePaused,
    startQueue, pauseQueue, resumeQueue, stopQueue, loadQueue, settings
  } = useEvolution(user?.tenantId);

  const isConnected = connectionStatus === 'connected';

  // Fila real baseada nos contatos que precisam de envio ou follow-up
  const realQueue = useMemo(() => {
    return contacts
      .filter(c => c.status === 'aguardando' || c.status === 'followup')
      .map(c => ({
        id: `q_${c.id}`,
        contactId: c.id,
        contactName: c.name,
        contactPhone: c.phone,
        message: 'Mensagem automática pendente...',
        status: 'pending' as const,
        priority: c.status === 'followup' ? 2 : 1,
        createdAt: new Date(),
      }));
  }, [contacts]);

  useEffect(() => {
    if (evoQueue.length === 0 && realQueue.length > 0 && !queueRunning) {
      loadQueue(realQueue);
    }
  }, [realQueue, evoQueue.length, queueRunning, loadQueue]);

  const sent    = evoQueue.filter(q => q.status === 'sent').length;
  const pending = evoQueue.filter(q => q.status === 'pending').length;
  const sending = evoQueue.filter(q => q.status === 'sending').length;

  const avgDelay       = (settings.minDelaySeconds + settings.maxDelaySeconds) / 2;
  const estimatedMins  = Math.ceil((pending * avgDelay) / 60);

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-5xl mx-auto">
        <PageHeader
          title="Fila de Envio"
          subtitle="Gerencie os disparos automáticos para seus leads"
          action={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium"
                style={{
                  background: isConnected ? '#f0fdf4' : '#f9fafb',
                  borderColor: isConnected ? '#bbf7d0' : '#e5e7eb',
                  color: isConnected ? '#059669' : '#6b7280',
                }}>
                {isConnected
                  ? <><Wifi size={12} /> WhatsApp conectado</>
                  : <><WifiOff size={12} /> WhatsApp desconectado</>}
              </div>

              {!queueRunning ? (
                <Button size="sm" onClick={startQueue} className="gap-1.5 text-xs text-white"
                  style={{ background: 'var(--emerald)' }} disabled={!isConnected || pending === 0}>
                  <Play size={13} /> Iniciar envios
                </Button>
              ) : queuePaused ? (
                <Button size="sm" onClick={resumeQueue} className="gap-1.5 text-xs text-white"
                  style={{ background: 'var(--emerald)' }}>
                  <Play size={13} /> Retomar
                </Button>
              ) : (
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={pauseQueue} className="gap-1.5 text-xs">
                    <Pause size={13} /> Pausar
                  </Button>
                  <Button size="sm" variant="outline" onClick={stopQueue} className="gap-1.5 text-xs text-red-500 border-red-200 hover:bg-red-50">
                    <Square size={13} /> Parar
                  </Button>
                </div>
              )}
            </div>
          }
        />

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Enviados',      value: sent,           icon: CheckCircle2, color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Enviando',      value: sending,        icon: Loader2,      color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
            { label: 'Pendentes',     value: pending,        icon: Circle,       color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
            { label: 'Est. conclusão', value: `~${estimatedMins}min`, icon: Clock, color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className="rounded-xl border p-4 flex items-center gap-3"
              style={{ background: bg, borderColor: border }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={17} style={{ color }} />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color }}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <LayoutList size={15} className="text-primary" /> Itens na Fila ({evoQueue.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Lead</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">WhatsApp</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Prioridade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {evoQueue.map(item => (
                  <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-3 font-medium">{item.contactName}</td>
                    <td className="px-5 py-3 text-muted-foreground">{item.contactPhone}</td>
                    <td className="px-5 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${item.priority === 2 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.priority === 2 ? 'Follow-up' : 'Inicial'}
                      </span>
                    </td>
                  </tr>
                ))}
                {evoQueue.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-20 text-muted-foreground">
                      <Zap size={30} className="mx-auto mb-3 opacity-20" />
                      Nenhum lead pendente de envio na fila.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
