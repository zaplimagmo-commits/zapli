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
import type { Campaign, CampaignStatus, CampaignChannel } from '@/lib/index';
import {
  Plus, MessageCircle, Instagram,
  Users, Send, Reply, TrendingUp,
  Calendar, Zap, Trash2
} from 'lucide-react';

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

const SEGMENTS = ['Arquitetura', 'Engenharia', 'Consultoria', 'Tecnologia', 'Saúde', 'Educação', 'Varejo', 'Indústria', 'Construção'];

export default function AppCampaigns() {
  const { contacts } = useProspect();
  const { confirm, ConfirmNode } = useConfirm();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

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
          subtitle="Dispare mensagens segmentadas para sua base de leads"
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
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(c.id, c.name); }}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
          {campaigns.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap size={24} className="text-muted-foreground" />
              </div>
              <h3 className="font-bold text-foreground">Nenhuma campanha ativa</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">Crie sua primeira campanha para disparar mensagens em massa para seus leads.</p>
              <Button onClick={() => setShowCreate(true)} className="mt-6 gap-2 text-white" style={{ background: 'var(--emerald)' }}>
                <Plus size={15} /> Criar Campanha
              </Button>
            </div>
          )}
        </div>

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Campanha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {step === 1 ? (
                <div className="space-y-4">
                  <div>
                    <Label>Nome da Campanha</Label>
                    <Input placeholder="Ex: Lançamento Maio 2026" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Mensagem</Label>
                    <Textarea placeholder="Olá [Nome]! 👋..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={5} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Segmentos</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {SEGMENTS.map(s => (
                          <button key={s} onClick={() => toggleSeg(s)} className={`px-2 py-1 rounded-md text-xs border transition-colors ${form.segments.includes(s) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-background text-muted-foreground border-border'}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                  <h3 className="font-bold text-lg">Tudo pronto!</h3>
                  <p className="text-sm text-muted-foreground">Sua campanha será enviada para {previewCount} leads.</p>
                </div>
              )}
            </div>
            <DialogFooter>
              {step === 1 ? (
                <Button onClick={() => setStep(2)} disabled={!form.name || !form.message}>Próximo</Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
                  <Button onClick={createCampaign} style={{ background: 'var(--emerald)' }}>Confirmar e Enviar</Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <ConfirmNode />
      </div>
    </AppLayout>
  );
}
