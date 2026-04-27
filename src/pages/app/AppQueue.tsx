import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { ANTI_BLOCKING_RULES, defaultSendSettings, generateMockQueue } from '@/data/sendData';
import type { QueueItem, SendSettings } from '@/lib/index';
import { QueueProcessor, type QueueEvent } from '@/lib/queueProcessor';
import { agentManager } from '@/lib/agentManager';
import {
  Play, Pause, Square, Settings, Clock, Shield, Zap, Info,
  CheckCircle2, AlertCircle, Loader2, Circle, SkipForward,
  TrendingUp, MessageSquare, Wifi, WifiOff
} from 'lucide-react';

const DEMO_CONTACTS = [
  { id: 'c1', name: 'Carlos Silva',  phone: '11999990001', company: 'Arquitetos & Associados' },
  { id: 'c2', name: 'Ana Ferreira',  phone: '11999990002', company: 'Studio Ferreira' },
  { id: 'c3', name: 'Bruno Costa',   phone: '11999990003', company: 'Costa Arquitetura' },
  { id: 'c4', name: 'Juliana Melo',  phone: '11999990004', company: 'Melo Projetos' },
  { id: 'c5', name: 'Pedro Alves',   phone: '11999990005', company: 'Alves & Partners' },
];

const DAYS_LABEL = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

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
  const tenantId = user?.tenantId ?? 'demo';

  const [agentConnected, setAgentConnected] = useState(() => agentManager.isConnected(tenantId));
  const [processor]    = useState(() => new QueueProcessor(defaultSendSettings, tenantId));
  const [queue,        setQueue]        = useState<QueueItem[]>(() => {
    const demo = generateMockQueue(DEMO_CONTACTS, 'Parceria Empresarial');
    processor.setQueue(demo); return demo;
  });
  const [queueRunning, setQueueRunning] = useState(false);
  const [queuePaused,  setQueuePaused]  = useState(false);
  const [sentToday,    setSentToday]    = useState(0);
  const [queueEvents,  setQueueEvents]  = useState<QueueEvent[]>([]);
  const [settings,     setSettingsLocal] = useState<SendSettings>(defaultSendSettings);

  useEffect(() => {
    const unsubAgent = agentManager.on(tenantId, info => setAgentConnected(info.status === 'connected'));
    const onEvent = (event: QueueEvent) => {
      setQueueEvents(prev => [event, ...prev].slice(0, 50));
      if (event.type === 'started')  { setQueueRunning(true);  setQueuePaused(false); }
      if (event.type === 'paused')   { setQueuePaused(true); }
      if (event.type === 'resumed')  { setQueuePaused(false); }
      if (event.type === 'finished' || event.type === 'daily_limit_reached') { setQueueRunning(false); }
      if (event.type === 'message_sent')   { setSentToday(s => s + 1); setQueue(processor.getQueue()); }
      if (event.type === 'message_failed') { setQueue(processor.getQueue()); }
    };
    processor.on(onEvent);
    return () => { unsubAgent(); processor.off(onEvent); processor.stop(); };
  }, [tenantId, processor]);

  const startQueue     = () => processor.start();
  const pauseQueue     = () => processor.pause();
  const resumeQueue    = () => processor.resume();
  const stopQueue      = () => { processor.stop(); setQueueRunning(false); setQueuePaused(false); };
  const updateSettings = (s: SendSettings) => { processor.updateSettings(s); setSettingsLocal(s); };

  const connectionStatus = agentConnected ? 'connected' : 'disconnected';
  const apiConfigured    = agentConnected;

  const [showSettings, setShowSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState<SendSettings>(settings);

  const sent    = queue.filter(q => q.status === 'sent').length;
  const pending = queue.filter(q => q.status === 'pending').length;
  const sending = queue.filter(q => q.status === 'sending').length;
  const failed  = queue.filter(q => q.status === 'failed').length;

  const avgDelay       = (localSettings.minDelaySeconds + localSettings.maxDelaySeconds) / 2;
  const estimatedMins  = Math.ceil((pending * avgDelay) / 60);
  const isConnected    = connectionStatus === 'connected';

  function applySettings() {
    updateSettings(localSettings);
    setShowSettings(false);
  }

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-5xl mx-auto">
        <PageHeader
          title="Fila de Envio"
          subtitle="Envios automáticos com proteção anti-bloqueio integrada"
          action={
            <div className="flex items-center gap-2">

              {/* Indicador de conexão */}
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

              <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)} className="gap-1.5 text-xs">
                <Settings size={13} /> Configurar
              </Button>

              {!queueRunning ? (
                <Button size="sm" onClick={startQueue} className="gap-1.5 text-xs text-white"
                  style={{ background: 'var(--emerald)' }}>
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

        {/* Aviso Evolution API não configurada */}
        {!apiConfigured && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl border mb-5"
            style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
            <Info size={14} style={{ color: '#d97706', flexShrink: 0 }} />
            <p className="text-xs text-amber-800">
              <strong>Modo demo:</strong> Configure <code className="bg-amber-100 px-1 rounded">VITE_EVOLUTION_URL</code> e{' '}
              <code className="bg-amber-100 px-1 rounded">VITE_EVOLUTION_KEY</code> para envios reais.
              Todos os envios aqui são simulações.
            </p>
          </div>
        )}

        {/* KPIs */}
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

        {/* Status banner */}
        {queueRunning && !queuePaused && (
          <div className="flex items-center gap-3 p-4 rounded-xl border mb-5"
            style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm font-medium text-emerald-800">
              Envios em andamento {apiConfigured ? '(Evolution API ativo)' : '(modo demo)'}
            </p>
            <span className="ml-auto text-xs text-emerald-700">
              Delay: {localSettings.minDelaySeconds}–{localSettings.maxDelaySeconds}s entre msgs
            </span>
          </div>
        )}
        {queuePaused && (
          <div className="flex items-center gap-3 p-4 rounded-xl border mb-5"
            style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
            <Pause size={14} style={{ color: '#d97706' }} />
            <p className="text-sm font-medium text-amber-800">Fila pausada — clique em "Retomar" para continuar</p>
          </div>
        )}

        {/* Painel de configurações */}
        {showSettings && (
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <Settings size={15} className="text-primary" /> Configurações de Envio
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Msgs/dia (máx)', key: 'messagesPerDay', min: 10,  max: 300 },
                { label: 'Delay mínimo (s)', key: 'minDelaySeconds', min: 20, max: 300 },
                { label: 'Delay máximo (s)', key: 'maxDelaySeconds', min: 30, max: 600 },
                { label: 'Início envios (h)', key: 'sendingHoursStart', min: 6,  max: 12  },
                { label: 'Fim envios (h)',    key: 'sendingHoursEnd',   min: 16, max: 22  },
              ].map(({ label, key, min, max }) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                  <input
                    type="number" min={min} max={max}
                    value={(localSettings as unknown as Record<string, number>)[key]}
                    onChange={e => setLocalSettings(s => ({ ...s, [key]: +e.target.value }))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
              ))}
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={localSettings.warmUpMode}
                    onChange={e => setLocalSettings(s => ({ ...s, warmUpMode: e.target.checked }))}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm font-medium">Modo Aquecimento</span>
                </label>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Dias de envio</p>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                  <button key={d}
                    onClick={() => setLocalSettings(s => ({
                      ...s,
                      daysOfWeek: s.daysOfWeek.includes(d) ? s.daysOfWeek.filter(x => x !== d) : [...s.daysOfWeek, d],
                    }))}
                    className="w-9 h-9 rounded-lg text-xs font-bold border transition-all"
                    style={{
                      background: localSettings.daysOfWeek.includes(d) ? 'var(--primary)' : 'transparent',
                      color: localSettings.daysOfWeek.includes(d) ? 'white' : 'var(--muted-foreground)',
                      borderColor: localSettings.daysOfWeek.includes(d) ? 'var(--primary)' : 'var(--border)',
                    }}>
                    {DAYS_LABEL[d]}
                  </button>
                ))}
              </div>
              <Button size="sm" onClick={applySettings} style={{ background: 'var(--emerald)' }} className="text-white text-xs gap-1.5">
                <CheckCircle2 size={12} /> Aplicar configurações
              </Button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">

          {/* Tabela da fila */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <MessageSquare size={14} className="text-primary" /> Fila de Mensagens
                </h3>
                <span className="text-xs text-muted-foreground">{queue.length} mensagens · {sentToday} enviadas hoje</span>
              </div>
              <div className="divide-y divide-border">
                {queue.length === 0 ? (
                  <div className="py-12 text-center">
                    <MessageSquare size={24} className="mx-auto text-muted-foreground mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground">Nenhuma mensagem na fila</p>
                    <p className="text-xs text-muted-foreground mt-1">Adicione contatos para gerar a fila de envio</p>
                  </div>
                ) : queue.map((item, i) => (
                  <div key={item.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: '#f1f5f9', color: '#64748b' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.contactName}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.contactCompany}</p>
                      {item.productName && (
                        <p className="text-xs text-primary/70 truncate">📦 {item.productName}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground mb-1">
                        {item.sentAt
                          ? item.sentAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : item.scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Log de eventos */}
            {queueEvents.length > 0 && (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wide">Log de atividade</h3>
                </div>
                <div className="divide-y divide-border max-h-48 overflow-y-auto">
                  {queueEvents.slice(0, 15).map((ev, i) => (
                    <div key={i} className="px-5 py-2.5 flex items-center gap-2.5">
                      <span className="text-base shrink-0">
                        {ev.type === 'message_sent'    ? '✅'
                          : ev.type === 'message_failed' ? '❌'
                          : ev.type === 'paused'         ? '⏸️'
                          : ev.type === 'resumed'        ? '▶️'
                          : ev.type === 'started'        ? '🚀'
                          : ev.type === 'finished'       ? '🏁'
                          : ev.type === 'out_of_hours'   ? '🕐'
                          : ev.type === 'daily_limit_reached' ? '🛑' : '📋'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">
                          {ev.type === 'message_sent'         ? `Enviado para ${ev.name ?? ev.phone}`
                            : ev.type === 'message_failed'    ? `Falha ao enviar para ${ev.phone}: ${ev.error}`
                            : ev.type === 'paused'            ? 'Fila pausada'
                            : ev.type === 'resumed'           ? 'Fila retomada'
                            : ev.type === 'started'           ? 'Envios iniciados'
                            : ev.type === 'finished'          ? `Concluído: ${ev.progress?.sent} enviados`
                            : ev.type === 'out_of_hours'      ? 'Fora do horário de envio — aguardando...'
                            : ev.type === 'daily_limit_reached' ? 'Limite diário atingido'
                            : ev.type}
                        </p>
                        {ev.progress && (
                          <p className="text-xs text-muted-foreground">{ev.progress.sent}/{ev.progress.total} msgs</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coluna direita */}
          <div className="space-y-4">

            {/* Regras anti-bloqueio */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3.5 border-b border-border flex items-center gap-2">
                <Shield size={14} className="text-emerald-600" />
                <h3 className="font-bold text-sm">Proteção Anti-Bloqueio</h3>
              </div>
              <div className="p-4 space-y-3">
                {ANTI_BLOCKING_RULES.map((rule, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">{rule.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{rule.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-border">
                <div className="flex items-start gap-2 p-3 rounded-lg"
                  style={{ background: '#fefce8', borderColor: '#fef08a' }}>
                  <Info size={13} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-xs text-amber-800">
                    Máximo de 100 contatos novos/dia para números sem histórico. Ative o Modo Aquecimento para números novos.
                  </p>
                </div>
              </div>
            </div>

            {/* Estimativas */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-primary" />
                <h3 className="font-bold text-sm">Estimativas</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Limite diário',       value: `${localSettings.messagesPerDay} msgs` },
                  { label: 'Delay médio',          value: `${avgDelay}s por msg` },
                  { label: 'Horário de envio',     value: `${localSettings.sendingHoursStart}h–${localSettings.sendingHoursEnd}h` },
                  { label: 'Enviadas hoje',        value: `${sentToday} msgs` },
                  { label: '100 contatos em',      value: `~${Math.ceil(100 * avgDelay / 3600)}h ${Math.ceil((100 * avgDelay % 3600) / 60)}min` },
                  { label: '1.000 contatos em',    value: `~${Math.ceil(1000 * avgDelay / 3600)}h (${Math.ceil(1000 / localSettings.messagesPerDay)} dias)` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-bold text-foreground">{value}</span>
                  </div>
                ))}
                {localSettings.warmUpMode && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg mt-1" style={{ background: '#f0fdf4' }}>
                    <Zap size={12} style={{ color: '#059669' }} />
                    <p className="text-xs text-emerald-800 font-medium">Modo Aquecimento ativo</p>
                  </div>
                )}
                {failed > 0 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg mt-1" style={{ background: '#fef2f2' }}>
                    <AlertCircle size={12} style={{ color: '#dc2626' }} />
                    <p className="text-xs text-red-800 font-medium">{failed} envio{failed > 1 ? 's falharam' : ' falhou'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
