import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProspect } from '@/hooks/AppContext';
import { useConfirm } from '@/components/ConfirmDialog';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DEAL_STAGES, type Deal, type DealStage, type DealTimelineEvent } from '@/lib/index';
import {
  Plus, Zap, TrendingUp, DollarSign, MoreHorizontal,
  Phone, Building2, ArrowRight, Trash2, Edit2, ExternalLink, Package,
  Target, Award, ChevronRight, Clock, User, History, MessageSquare, ChevronDown
} from 'lucide-react';

// Win probability por estágio
const STAGE_PROBABILITY: Record<string, number> = {
  contato: 10, qualificacao: 25, proposta: 50, negociacao: 75, fechado: 100, perdido: 0,
};

const TIMELINE_LABELS: Record<string, { emoji: string; color: string }> = {
  contact_added:    { emoji: '➕', color: '#6366f1' },
  deal_created:     { emoji: '🎯', color: '#059669' },
  contact_assigned: { emoji: '👤', color: '#8b5cf6' },
  deal_moved:       { emoji: '➡️', color: '#0ea5e9' },
  note_added:       { emoji: '📝', color: '#6b7280' },
  deal_won:         { emoji: '🏆', color: '#059669' },
  deal_lost:        { emoji: '❌', color: '#ef4444' },
  followup_sent:    { emoji: '🔄', color: '#f59e0b' },
  message_received: { emoji: '💬', color: '#0ea5e9' },
  message_sent:     { emoji: '📤', color: '#6366f1' },
  status_changed:   { emoji: '🔀', color: '#8b5cf6' },
};

function timeAgo(d: Date) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatCurrency(v?: number) {
  if (!v) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
}

function DealCard({ deal, onMove, onDelete, onEdit }: {
  deal: Deal;
  onMove: (stage: DealStage) => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const stg = DEAL_STAGES.find(s => s.id === deal.stage)!;

  return (
    <div className="bg-card rounded-xl border border-border space-y-0 relative group"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

      {/* Responsável pill — topo do card */}
      {deal.assignedToName && (
        <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-0">
          <div className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
            style={{ background: deal.assignedToColor ?? '#6366f1', fontSize: 8 }}>
            {deal.assignedToName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs font-semibold" style={{ color: deal.assignedToColor ?? '#6366f1' }}>{deal.assignedToName}</span>
        </div>
      )}

      <div className="p-3.5 pt-2 space-y-2.5">
        {/* Origem badge */}
        {deal.fromProspecting && (
          <span className="absolute top-2.5 right-2.5 flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: '#f0fdf4', color: '#059669', fontSize: 9 }}>
            <Zap size={8} /> Zapli
          </span>
        )}

        <div className="flex items-start gap-2.5 pr-16">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: stg.color }}>
            {deal.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{deal.name}</p>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <Building2 size={10} /> {deal.company}
            </p>
          </div>
        </div>

        {deal.value && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#059669' }}>
              <DollarSign size={12} /> {formatCurrency(deal.value)}
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: '#d97706' }}>
              <Target size={10} /> {STAGE_PROBABILITY[deal.stage]}% prob.
            </div>
          </div>
        )}

        {deal.productName && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Package size={10} /> {deal.productName}
          </div>
        )}

        {deal.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2 italic">"{deal.notes}"</p>
        )}

        <div className="flex items-center gap-1.5 pt-1 border-t border-border">
          <a href={`https://wa.me/55${deal.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 h-7 rounded-lg text-xs font-medium border transition-colors hover:bg-muted"
            style={{ borderColor: '#25D366', color: '#25D366' }}>
            <Phone size={11} /> WA
          </a>
          {deal.contactId && (
            <Link to={`/app/contatos/${deal.contactId}`}
              className="flex-1 flex items-center justify-center gap-1 h-7 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-colors">
              <ExternalLink size={11} /> Ver
            </Link>
          )}
          {/* Botão timeline */}
          {deal.timeline && deal.timeline.length > 0 && (
            <button onClick={() => setShowTimeline(!showTimeline)}
              className="flex items-center justify-center gap-0.5 h-7 px-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
              title={`${deal.timeline.length} eventos`}>
              <History size={11} />
              <span>{deal.timeline.length}</span>
            </button>
          )}
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
              <MoreHorizontal size={13} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 z-20 bg-card border border-border rounded-xl shadow-xl py-1.5 w-44"
                onMouseLeave={() => setShowMenu(false)}>
                <p className="text-xs font-semibold text-muted-foreground px-3 py-1 uppercase tracking-wide">Mover para</p>
                {DEAL_STAGES.filter(s => s.id !== deal.stage).map(s => (
                  <button key={s.id} onClick={() => { onMove(s.id); setShowMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                    {s.label}
                  </button>
                ))}
                <div className="border-t border-border mt-1 pt-1">
                  <button onClick={() => { onEdit(); setShowMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2 text-foreground">
                    <Edit2 size={11} /> Editar
                  </button>
                  <button onClick={() => { onDelete(); setShowMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 flex items-center gap-2 text-red-500">
                    <Trash2 size={11} /> Remover
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline inline */}
        {showTimeline && deal.timeline && deal.timeline.length > 0 && (
          <div className="border-t border-border pt-2.5 space-y-1.5 mt-0">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><History size={10} /> Histórico</p>
            {deal.timeline.map(ev => {
              const cfg = TIMELINE_LABELS[ev.type] ?? { emoji: '•', color: '#6b7280' };
              return (
                <div key={ev.id} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5"
                    style={{ background: `${ev.memberColor}20` }}>
                    <span style={{ fontSize: 9 }}>{ev.memberName.split(' ')[0][0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: ev.memberColor }}>{ev.memberName.split(' ')[0]}</span>
                      <span className="text-xs">{cfg.emoji}</span>
                      {ev.fromStage && ev.toStage && (
                        <span className="text-xs text-muted-foreground">{ev.fromStage} → <strong style={{ color: cfg.color }}>{ev.toStage}</strong></span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight line-clamp-2">{ev.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{timeAgo(ev.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default function AppCRM() {
  const { deals, addDeal, moveDeal, updateDeal, deleteDeal } = useProspect();
  const { confirm, ConfirmNode } = useConfirm();

  async function handleDeleteDeal(id: string, name: string, company: string) {
    const ok = await confirm({
      title: 'Excluir deal',
      message: `Tem certeza que deseja excluir o deal de "${name}" (${company})? Esta ação é irreversível.`,
      confirmLabel: 'Sim, excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (ok) deleteDeal(id);
  }

  const [showAdd, setShowAdd] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', value: '', notes: '', stage: 'contato' as DealStage });

  const totalValue = deals.filter(d => d.stage !== 'perdido').reduce((s, d) => s + (d.value ?? 0), 0);
  const closedValue = deals.filter(d => d.stage === 'fechado').reduce((s, d) => s + (d.value ?? 0), 0);
  const fromProspecting = deals.filter(d => d.fromProspecting).length;
  // Receita ponderada por probabilidade
  const weightedPipeline = deals.filter(d => d.stage !== 'perdido' && d.stage !== 'fechado')
    .reduce((s, d) => s + ((d.value ?? 0) * (STAGE_PROBABILITY[d.stage] ?? 0) / 100), 0);
  const activeDeals = deals.filter(d => d.stage !== 'perdido' && d.stage !== 'fechado').length;
  const winRate = deals.filter(d => d.stage === 'fechado' || d.stage === 'perdido').length > 0
    ? Math.round((deals.filter(d => d.stage === 'fechado').length / deals.filter(d => d.stage === 'fechado' || d.stage === 'perdido').length) * 100)
    : 0;

  function resetForm() {
    setForm({ name: '', company: '', phone: '', email: '', value: '', notes: '', stage: 'contato' });
    setEditingDeal(null);
  }

  function handleSave() {
    if (!form.name || !form.company || !form.phone) return;
    const base = {
      name: form.name, company: form.company, phone: form.phone,
      email: form.email || undefined, value: form.value ? Number(form.value) : undefined,
      notes: form.notes || undefined, stage: form.stage, fromProspecting: false,
    };
    if (editingDeal) {
      updateDeal(editingDeal.id, base);
    } else {
      addDeal(base);
    }
    resetForm();
    setShowAdd(false);
  }

  function startEdit(deal: Deal) {
    setEditingDeal(deal);
    setForm({
      name: deal.name, company: deal.company, phone: deal.phone,
      email: deal.email ?? '', value: deal.value ? String(deal.value) : '',
      notes: deal.notes ?? '', stage: deal.stage,
    });
    setShowAdd(true);
  }

  return (
    <AppLayout>
      <div className="px-6 py-7 max-w-full">
        <PageHeader
          title="CRM — Funil de Negociação"
          subtitle="Gerencie oportunidades comerciais abertas. Leads convertidos entram automaticamente."
          action={
            <Button onClick={() => { resetForm(); setShowAdd(true); }}
              className="flex items-center gap-2 text-sm text-white"
              style={{ background: 'var(--emerald)' }}>
              <Plus size={15} /> Nova Oportunidade
            </Button>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            { label: 'Deals ativos',      value: activeDeals,                    icon: TrendingUp,  color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
            { label: 'Pipeline total',    value: formatCurrency(totalValue),     icon: DollarSign,  color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Receita ponderada', value: formatCurrency(weightedPipeline), icon: Target,    color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
            { label: 'Fechado no mês',    value: formatCurrency(closedValue),    icon: Award,       color: '#10b981', bg: '#f0fdf4', border: '#a7f3d0' },
            { label: 'Win rate',          value: `${winRate}%`,                  icon: Zap,         color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className="rounded-xl border p-3.5 flex items-center gap-3"
              style={{ background: bg, borderColor: border }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${color}18` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-black" style={{ color }}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline health bar */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl border mb-5 bg-card">
          <p className="text-xs font-semibold text-muted-foreground shrink-0">Pipeline por estágio:</p>
          <div className="flex-1 flex gap-1 h-3 rounded-full overflow-hidden">
            {DEAL_STAGES.filter(s => s.id !== 'perdido').map(stage => {
              const count = deals.filter(d => d.stage === stage.id).length;
              const total = deals.filter(d => d.stage !== 'perdido').length || 1;
              const w = Math.round((count / total) * 100);
              return w > 0 ? (
                <div key={stage.id} title={`${stage.label}: ${count}`}
                  className="h-full transition-all" style={{ width: `${w}%`, background: stage.color }} />
              ) : null;
            })}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {DEAL_STAGES.filter(s => s.id !== 'perdido').map(s => {
              const c = deals.filter(d => d.stage === s.id).length;
              return c > 0 ? (
                <div key={s.id} className="flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{c}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>

        {/* Banner como vem do Zapli */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl border mb-5"
          style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <Zap size={14} style={{ color: '#059669', flexShrink: 0 }} />
          <p className="text-xs text-emerald-800">
            <strong>Integração automática:</strong> Quando um lead é marcado como <strong>Convertido</strong> na prospecção, ele entra automaticamente neste funil na etapa <em>Contato Feito</em>.
            Você também pode adicionar oportunidades diretas — esses contatos <strong>não passam pelo follow-up automático</strong>.
          </p>
        </div>

        {/* Kanban */}
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 500 }}>
          {DEAL_STAGES.map(stage => {
            const stageDeals = deals.filter(d => d.stage === stage.id);
            const stageValue = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0);
            return (
              <div key={stage.id} className="shrink-0 w-64 flex flex-col">
                {/* Header da coluna */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: stage.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{stage.label}</p>
                    {stageValue > 0 && (
                      <p className="text-xs text-muted-foreground">{formatCurrency(stageValue)}</p>
                    )}
                  </div>
                  <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full"
                    style={{ background: stage.color, minWidth: 22, textAlign: 'center' }}>
                    {stageDeals.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2.5 p-2 rounded-xl"
                  style={{ background: `${stage.color}08`, border: `1px solid ${stage.color}20`, minHeight: 120 }}>
                  {stageDeals.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-xs text-muted-foreground italic opacity-60">{stage.description}</p>
                    </div>
                  ) : stageDeals.map(deal => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onMove={s => moveDeal(deal.id, s)}
                      onDelete={() => handleDeleteDeal(deal.id, deal.name, deal.company)}
                      onEdit={() => startEdit(deal)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd} onOpenChange={() => { setShowAdd(false); resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDeal ? 'Editar Oportunidade' : 'Nova Oportunidade'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block">Nome do contato *</Label>
              <Input placeholder="Ex: João Silva" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block">Empresa *</Label>
              <Input placeholder="Ex: Silva Engenharia" value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">WhatsApp *</Label>
              <Input placeholder="11987654321" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">E-mail</Label>
              <Input placeholder="joao@empresa.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Valor estimado (R$)</Label>
              <Input type="number" placeholder="50000" value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Etapa inicial</Label>
              <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as DealStage }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {DEAL_STAGES.filter(s => s.id !== 'perdido').map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block">Observações</Label>
              <Input placeholder="Contexto da negociação..." value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.company || !form.phone}
              style={{ background: 'var(--emerald)' }} className="text-white">
              {editingDeal ? 'Salvar' : 'Adicionar ao CRM'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {ConfirmNode}
    </AppLayout>
  );
}

