import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useProspect } from '@/hooks/AppContext';
import { useConfirm } from '@/components/ConfirmDialog';
import { formatCurrency, DEAL_STAGES, STAGE_PROBABILITY } from '@/lib/index';
import type { Deal, DealStage } from '@/lib/index';
import { Plus, TrendingUp, DollarSign, Target, Award, Zap, MoreVertical, Trash2, Edit2, ArrowRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

function DealCard({ deal, onMove, onDelete, onEdit }: { deal: Deal; onMove: (s: DealStage) => void; onDelete: () => void; onEdit: () => void }) {
  const stage = DEAL_STAGES.find(s => s.id === deal.stage);
  return (
    <div className="bg-card rounded-lg border border-border p-3 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground truncate">{deal.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{deal.company}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors">
              <MoreVertical size={12} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onEdit} className="text-xs gap-2"><Edit2 size={12} /> Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-xs gap-2 text-red-500"><Trash2 size={12} /> Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs font-black text-foreground">{formatCurrency(deal.value ?? 0)}</p>
        <div className="flex items-center gap-1">
          {DEAL_STAGES.filter(s => s.id !== deal.stage && s.id !== 'perdido').slice(0, 1).map(s => (
            <button key={s.id} onClick={() => onMove(s.id)} 
              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1">
              Mover <ArrowRight size={8} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

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
          subtitle="Gerencie oportunidades comerciais reais. Leads convertidos entram automaticamente."
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

        {/* Kanban */}
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 500 }}>
          {DEAL_STAGES.map(stage => {
            const stageDeals = deals.filter(d => d.stage === stage.id);
            const stageValue = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0);
            return (
              <div key={stage.id} className="shrink-0 w-64 flex flex-col">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: stage.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{stage.label}</p>
                    {stageValue > 0 && <p className="text-xs text-muted-foreground">{formatCurrency(stageValue)}</p>}
                  </div>
                  <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full"
                    style={{ background: stage.color, minWidth: 22, textAlign: 'center' }}>
                    {stageDeals.length}
                  </span>
                </div>

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

      <Dialog open={showAdd} onOpenChange={() => { setShowAdd(false); resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingDeal ? 'Editar Oportunidade' : 'Nova Oportunidade'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2"><Label className="text-xs mb-1.5 block">Nome do contato *</Label><Input placeholder="Ex: João Silva" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="col-span-2"><Label className="text-xs mb-1.5 block">Empresa *</Label><Input placeholder="Ex: Silva Engenharia" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">WhatsApp *</Label><Input placeholder="11987654321" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">E-mail</Label><Input placeholder="joao@empresa.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">Valor estimado (R$)</Label><Input type="number" placeholder="50000" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /></div>
            <div>
              <Label className="text-xs mb-1.5 block">Etapa inicial</Label>
              <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as DealStage }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {DEAL_STAGES.filter(s => s.id !== 'perdido').map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="col-span-2"><Label className="text-xs mb-1.5 block">Observações</Label><Input placeholder="Contexto da negociação..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.company || !form.phone} style={{ background: 'var(--emerald)' }} className="text-white">
              {editingDeal ? 'Salvar' : 'Adicionar ao CRM'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {ConfirmNode}
    </AppLayout>
  );
}
