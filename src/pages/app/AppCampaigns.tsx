import { useState, useMemo } from 'react';
import { useProspect } from '@/hooks/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { useConfirm } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Campaign, CampaignStatus, CampaignChannel } from '@/lib/index';
import {
  Plus, Play, Pause, BarChart2, MessageCircle, Instagram,
  Users, Send, CheckCircle2, Eye, Reply, TrendingUp,
  Calendar, Clock, Zap, Filter, ChevronDown, ChevronUp, Trash2, Copy
} from 'lucide-react';

const fc = (n: number, total: number) => total > 0 ? `${Math.round((n / total) * 100)}%` : '0%';

const STATUS_CFG: Record<CampaignStatus, { label: string; color: string; bg: string; dot: string }> = {
  rascunho:  { label: 'Rascunho',  color: '#6b7280', bg: '#f9fafb', dot: '#9ca3af' },
  agendada:  { label: 'Agendada',  color: '#0ea5e9', bg: '#f0f9ff', dot: '#0ea5e9' },
  enviando:  { label: 'Enviando',  color: '#6366f1', bg: '#eef2ff', dot: '#6366f1' },
  concluida: { label: 'Concluída', color: '#059669', bg: '#f0fdf4', dot: '#10b981' },
  pausada:   { label: 'Pausada',   color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
  cancelada: { label: 'Cancelada', color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' },
};

const CHANNEL_CFG: Record<CampaignChannel, { label: string; icon: React.ReactNode; color: string }> = {
  whatsapp:  { label: 'WhatsApp',          icon: <MessageCircle size={13} />, color: '#25D366' },
  instagram: { label: 'Instagram',          icon: <Instagram size={13} />,    color: '#E1306C' },
  ambos:     { label: 'WA + Instagram',     icon: <><MessageCircle size={11} /><Instagram size={11} /></>, color: '#6366f1' },
};

const CONTACT_STATUSES = ['aguardando', 'followup', 'respondido', 'arquivado'];
const STATUS_LABEL: Record<string, string> = { aguardando: 'Aguardando', followup: 'Follow-up', respondido: 'Respondido', arquivado: 'Arquivado' };

const mockCampaigns: Campaign[] = [
  {
    id: 'cp1', userId: 'u1', name: 'Lançamento Parceria Premium 2026', channel: 'whatsapp', status: 'concluida',
    description: 'Apresentação do novo programa de parceria para escritórios selecionados.',
    message: 'Olá [Nome]! 🚀\n\nTemos uma novidade exclusiva para a [EmpresaContato].\n\nLançamos nosso *Programa de Parceria Premium* com condições nunca antes vistas.\n\nTem 5 minutinhos para eu apresentar? Responda aqui!',
    audience: { segments: ['Arquitetura', 'Engenharia'], contactStatuses: ['aguardando', 'followup'], tags: [], productIds: [], total: 148 },
    metrics: { total: 148, sent: 148, delivered: 141, read: 98, replied: 34, converted: 12, failed: 7, optOut: 3 },
    startedAt: new Date(Date.now() - 5 * 86400000), finishedAt: new Date(Date.now() - 4 * 86400000),
    createdAt: new Date(Date.now() - 7 * 86400000), updatedAt: new Date(Date.now() - 4 * 86400000),
  },
  {
    id: 'cp2', userId: 'u1', name: 'Reativação Base Fria — Abril', channel: 'ambos', status: 'enviando',
    message: 'Oi [Nome]! Passando para retomar o contato. Temos novidades para a [EmpresaContato] que podem ser do seu interesse. Podemos conversar rapidinho? 😊',
    audience: { segments: [], contactStatuses: ['arquivado'], tags: [], productIds: [], total: 67 },
    metrics: { total: 67, sent: 43, delivered: 40, read: 22, replied: 7, converted: 2, failed: 4, optOut: 1 },
    startedAt: new Date(), createdAt: new Date(Date.now() - 1 * 86400000), updatedAt: new Date(),
  },
  {
    id: 'cp3', userId: 'u1', name: 'Follow-up Evento BIM World SP', channel: 'whatsapp', status: 'agendada',
    description: 'Pós-evento — contatos que visitaram nosso estande.',
    message: 'Olá [Nome]! Foi um prazer te conhecer no BIM World SP! 🏗️\n\nComo combinamos, estou enviando mais informações sobre nossa solução para a [EmpresaContato].\n\nQuando podemos marcar uma conversa rápida?',
    audience: { segments: ['Arquitetura'], contactStatuses: ['aguardando'], tags: ['bim-world'], productIds: [], total: 31 },
    metrics: { total: 31, sent: 0, delivered: 0, read: 0, replied: 0, converted: 0, failed: 0, optOut: 0 },
    scheduledAt: new Date(Date.now() + 2 * 86400000),
    createdAt: new Date(Date.now() - 1 * 86400000), updatedAt: new Date(Date.now() - 1 * 86400000),
  },
];

const SEGMENTS = ['Arquitetura', 'Engenharia', 'Consultoria', 'Tecnologia', 'Saúde', 'Educação', 'Varejo', 'Indústria', 'Construção'];

export default function AppCampaigns() {
  const { contacts } = useProspect();
  const { confirm, ConfirmNode } = useConfirm();
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);

  async function handleDeleteCampaign(id: string, name: string) {
    const ok = await confirm({
      title: 'Excluir campanha',
      message: `Tem certeza que deseja excluir a campanha "${name}"? Esta ação é irreversível.`,
      confirmLabel: 'Sim, excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (ok) setCampaigns(p => p.filter(x => x.id !== id));
  }
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: '', description: '', channel: 'whatsapp' as CampaignChannel,
    message: '', scheduleNow: true, scheduledAt: '',
    segments: [] as string[], statuses: [] as string[],
  });

  const previewCount = useMemo(() => {
    let filtered = contacts;
    if (form.segments.length) filtered = filtered.filter(c => form.segments.includes(c.segment ?? ''));
    if (form.statuses.length) filtered = filtered.filter(c => form.statuses.includes(c.status));
    return filtered.length;
  }, [contacts, form.segments, form.statuses]);

  const totalSent = campaigns.reduce((s, c) => s + c.metrics.sent, 0);
  const totalReplied = campaigns.reduce((s, c) => s + c.metrics.replied, 0);
  const totalConverted = campaigns.reduce((s, c) => s + c.metrics.converted, 0);

  function toggleSeg(seg: string) { setForm(f => ({ ...f, segments: f.segments.includes(seg) ? f.segments.filter(s => s !== seg) : [...f.segments, seg] })); }
  function toggleStatus(s: string) { setForm(f => ({ ...f, statuses: f.statuses.includes(s) ? f.statuses.filter(x => x !== s) : [...f.statuses, s] })); }

  function createCampaign() {
    if (!form.name || !form.message) return;
    const nc: Campaign = {
      id: `cp_${Date.now()}`, userId: 'u1', name: form.name, description: form.description,
      channel: form.channel, status: form.scheduleNow ? 'enviando' : 'agendada',
      message: form.message,
      audience: { segments: form.segments, contactStatuses: form.statuses, tags: [], productIds: [], total: previewCount },
      metrics: { total: previewCount, sent: 0, delivered: 0, read: 0, replied: 0, converted: 0, failed: 0, optOut: 0 },
      scheduledAt: form.scheduleNow ? undefined : new Date(form.scheduledAt),
      startedAt: form.scheduleNow ? new Date() : undefined,
      createdAt: new Date(), updatedAt: new Date(),
    };
    setCampaigns(prev => [nc, ...prev]);
    setShowCreate(false);
    setStep(1);
    setForm({ name: '', description: '', channel: 'whatsapp', message: '', scheduleNow: true, scheduledAt: '', segments: [], statuses: [] });
  }

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-6xl mx-auto">
        <PageHeader
          title="Campanhas"
          subtitle="Dispare mensagens segmentadas para sua base de leads — WhatsApp e Instagram"
          action={
            <Button onClick={() => setShowCreate(true)} className="gap-2 text-sm text-white" style={{ background: 'var(--emerald)' }}>
              <Plus size={15} /> Nova Campanha
            </Button>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Campanhas',      value: campaigns.length,  icon: Zap,        color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
            { label: 'Total enviados', value: totalSent,         icon: Send,       color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
            { label: 'Responderam',    value: totalReplied,      icon: Reply,      color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
            { label: 'Convertidos',    value: totalConverted,    icon: TrendingUp, color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className="rounded-xl border p-4 flex items-center gap-3" style={{ background: bg, borderColor: border }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={17} style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Campaign List */}
        <div className="space-y-3">
          {campaigns.map(c => {
            const st = STATUS_CFG[c.status];
            const ch = CHANNEL_CFG[c.channel];
            const isExp = expanded === c.id;
            return (
              <div key={c.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(isExp ? null : c.id)}>
                  {/* Canal */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center gap-0.5 shrink-0"
                    style={{ background: `${ch.color}15`, color: ch.color }}>
                    {ch.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-foreground">{c.name}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: st.bg, color: st.color }}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ background: st.dot }} />
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Users size={10} /> {c.audience.total} leads</span>
                      <span style={{ color: ch.color }} className="flex items-center gap-1">{ch.icon} {ch.label}</span>
                      {c.scheduledAt && <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(c.scheduledAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                      {c.description && <span className="truncate max-w-xs opacity-70">{c.description}</span>}
                    </div>
                  </div>
                  {/* Mini métricas */}
                  {c.metrics.sent > 0 && (
                    <div className="hidden md:flex items-center gap-4 shrink-0">
                      {[
                        { label: 'Enviados', value: c.metrics.sent, color: '#6366f1' },
                        { label: 'Lidos', value: c.metrics.read, color: '#0ea5e9', pct: fc(c.metrics.read, c.metrics.sent) },
                        { label: 'Respostas', value: c.metrics.replied, color: '#d97706', pct: fc(c.metrics.replied, c.metrics.sent) },
                        { label: 'Convertidos', value: c.metrics.converted, color: '#059669', pct: fc(c.metrics.converted, c.metrics.sent) },
                      ].map(m => (
                        <div key={m.label} className="text-center">
                          <p className="text-sm font-bold" style={{ color: m.color }}>{m.value}</p>
                          {m.pct && <p className="text-xs text-muted-foreground">{m.pct}</p>}
                          <p className="text-xs text-muted-foreground" style={{ fontSize: 9 }}>{m.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 shrink-0">
                    {c.status === 'rascunho' && <Button size="sm" className="h-7 text-xs gap-1 text-white" style={{ background: 'var(--emerald)' }}><Play size={11} /> Iniciar</Button>}
                    {c.status === 'enviando' && <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Pause size={11} /> Pausar</Button>}
                    <button className="text-muted-foreground hover:text-red-500 p-1" onClick={e => { e.stopPropagation(); handleDeleteCampaign(c.id, c.name); }}><Trash2 size={13} /></button>
                    {isExp ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded metrics */}
                {isExp && (
                  <div className="border-t border-border px-5 py-4 bg-muted/20">
                    <div className="grid md:grid-cols-4 gap-4 mb-4">
                      {[
                        { label: '📤 Enviados',    v: c.metrics.sent,      t: c.metrics.total,  color: '#6366f1' },
                        { label: '✅ Entregues',   v: c.metrics.delivered, t: c.metrics.sent,   color: '#0ea5e9' },
                        { label: '👁️ Lidos',       v: c.metrics.read,      t: c.metrics.sent,   color: '#8b5cf6' },
                        { label: '💬 Responderam', v: c.metrics.replied,   t: c.metrics.sent,   color: '#d97706' },
                        { label: '🎯 Convertidos', v: c.metrics.converted, t: c.metrics.replied, color: '#059669' },
                        { label: '❌ Falharam',    v: c.metrics.failed,    t: c.metrics.total,  color: '#ef4444' },
                        { label: '🚫 Opt-out',     v: c.metrics.optOut,    t: c.metrics.sent,   color: '#6b7280' },
                        { label: '🏆 Taxa conv.',  v: 0, t: 0, custom: fc(c.metrics.converted, c.metrics.total), color: '#059669' },
                      ].map(m => (
                        <div key={m.label} className="bg-card rounded-lg p-3 border border-border">
                          <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                          <p className="text-lg font-bold" style={{ color: m.color }}>{m.custom ?? m.v}</p>
                          {!m.custom && m.t > 0 && <div className="h-1.5 rounded-full bg-muted mt-1.5 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.round((m.v / m.t) * 100)}%`, background: m.color }} /></div>}
                        </div>
                      ))}
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">MENSAGEM DA CAMPANHA</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{c.message}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {campaigns.length === 0 && (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <Zap size={28} className="mx-auto text-muted-foreground mb-3 opacity-40" />
              <p className="text-sm font-medium text-muted-foreground">Nenhuma campanha ainda.</p>
              <p className="text-xs text-muted-foreground mt-1">Crie sua primeira campanha para disparar mensagens em massa.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreate} onOpenChange={() => { setShowCreate(false); setStep(1); }}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Campanha — Passo {step} de 3</DialogTitle>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex-1 h-1.5 rounded-full transition-all"
                  style={{ background: s <= step ? 'var(--emerald)' : '#e5e7eb' }} />
              ))}
            </div>
          </DialogHeader>

          {/* Step 1: Info básica */}
          {step === 1 && (
            <div className="space-y-4 py-2">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Informações da Campanha</p>
              <div>
                <Label className="text-xs mb-1.5 block">Nome da campanha *</Label>
                <Input placeholder="Ex: Lançamento Produto X — Maio 2026" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Descrição (opcional)</Label>
                <Input placeholder="Contexto interno da campanha" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Canal de envio</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['whatsapp', 'instagram', 'ambos'] as CampaignChannel[]).map(ch => {
                    const cfg = CHANNEL_CFG[ch];
                    return (
                      <button key={ch} onClick={() => setForm(f => ({ ...f, channel: ch }))}
                        className="flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium"
                        style={{ borderColor: form.channel === ch ? cfg.color : '#e5e7eb', background: form.channel === ch ? `${cfg.color}12` : 'transparent', color: form.channel === ch ? cfg.color : '#6b7280' }}>
                        {cfg.icon} {cfg.label}
                      </button>
                    );
                  })}
                </div>
                {form.channel === 'instagram' && (
                  <p className="text-xs text-amber-700 mt-2 p-2 bg-amber-50 rounded-lg">
                    ⚠️ Instagram: apenas para seguidores ou quem já interagiu com sua conta.
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Envio</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setForm(f => ({ ...f, scheduleNow: true }))}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${form.scheduleNow ? 'border-[#6366f1] bg-[#6366f115] text-[#6366f1]' : 'border-border text-muted-foreground'}`}>
                    <Zap size={14} className="mx-auto mb-1" /> Enviar agora
                  </button>
                  <button onClick={() => setForm(f => ({ ...f, scheduleNow: false }))}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${!form.scheduleNow ? 'border-[#6366f1] bg-[#6366f115] text-[#6366f1]' : 'border-border text-muted-foreground'}`}>
                    <Clock size={14} className="mx-auto mb-1" /> Agendar
                  </button>
                </div>
                {!form.scheduleNow && (
                  <Input type="datetime-local" className="mt-2" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                )}
              </div>
            </div>
          )}

          {/* Step 2: Audiência */}
          {step === 2 && (
            <div className="space-y-4 py-2">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Segmentação de Público</p>
              <div className="p-4 rounded-xl border-2 flex items-center gap-3"
                style={{ background: '#f0fdf4', borderColor: '#10b981' }}>
                <Users size={18} style={{ color: '#059669' }} />
                <div>
                  <p className="text-base font-bold text-emerald-800">{previewCount} leads selecionados</p>
                  <p className="text-xs text-emerald-700">{form.segments.length === 0 && form.statuses.length === 0 ? 'Todos os contatos (sem filtro)' : 'Com os filtros aplicados abaixo'}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs mb-2 block font-semibold">Segmentos</Label>
                <div className="flex flex-wrap gap-2">
                  {SEGMENTS.map(s => (
                    <button key={s} onClick={() => toggleSeg(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                      style={{ background: form.segments.includes(s) ? 'var(--primary)' : 'transparent', color: form.segments.includes(s) ? 'white' : 'var(--muted-foreground)', borderColor: form.segments.includes(s) ? 'var(--primary)' : 'var(--border)' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs mb-2 block font-semibold">Status do contato</Label>
                <div className="flex flex-wrap gap-2">
                  {CONTACT_STATUSES.map(s => (
                    <button key={s} onClick={() => toggleStatus(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                      style={{ background: form.statuses.includes(s) ? '#f59e0b' : 'transparent', color: form.statuses.includes(s) ? 'white' : 'var(--muted-foreground)', borderColor: form.statuses.includes(s) ? '#f59e0b' : 'var(--border)' }}>
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/30 text-xs text-muted-foreground">
                <strong>💡 Dica:</strong> Para reativar base fria, selecione <em>Arquivado</em>. Para lançamento de produto, selecione <em>Aguardando + Follow-up</em> + segmento.
              </div>
            </div>
          )}

          {/* Step 3: Mensagem */}
          {step === 3 && (
            <div className="space-y-4 py-2">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Mensagem da Campanha</p>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs block">Mensagem *</Label>
                  <span className="text-xs text-muted-foreground">Vars: [Nome] [Empresa] [EmpresaContato]</span>
                </div>
                <Textarea
                  placeholder="Olá [Nome]! 👋&#10;&#10;Temos uma novidade exclusiva para a [EmpresaContato]..."
                  rows={7} className="text-sm resize-none" value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>
              {form.message && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
                    <p className="text-xs font-semibold text-muted-foreground">👁️ Preview (simulado com dados ficticios)</p>
                  </div>
                  <div className="p-4">
                    <div className="max-w-xs ml-auto bg-primary text-white rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed">
                      {form.message.replace('[Nome]', 'Carlos').replace('[Empresa]', 'Construtora ABC').replace('[EmpresaContato]', 'RF Engenharia')}
                    </div>
                  </div>
                </div>
              )}
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <strong>⏱️ Anti-bloqueio ativo:</strong> As mensagens serão enviadas com intervalo de 45–120s entre cada envio, respeitando o limite diário e o horário comercial configurados na Fila de Envio.
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => step > 1 ? setStep(s => s - 1) : setShowCreate(false)}>
                {step === 1 ? 'Cancelar' : '← Voltar'}
              </Button>
              {step < 3 ? (
                <Button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !form.name} style={{ background: 'var(--emerald)' }} className="text-white">
                  Próximo →
                </Button>
              ) : (
                <Button onClick={createCampaign} disabled={!form.message} style={{ background: 'var(--emerald)' }} className="text-white gap-1.5">
                  <Send size={13} /> {form.scheduleNow ? 'Disparar agora' : 'Agendar campanha'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {ConfirmNode}
    </AppLayout>
  );
}
