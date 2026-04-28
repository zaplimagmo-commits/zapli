import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PLANS, formatCurrency } from '@/lib/index';
import type { Plan, PlanId } from '@/lib/index';
import { CheckCircle2, Edit2, Save, X, Users, MessageSquare, Zap, Loader2 } from 'lucide-react';
import { db } from '@/lib/supabase';

export default function AdminPlans() {
  const [plans, setPlans] = useState(PLANS);
  const [editingId, setEditingId] = useState<PlanId | null>(null);
  const [editForm, setEditForm] = useState<Partial<Plan>>({});
  const [stats, setStats] = useState<Record<string, { users: number; mrr: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const { data: tenants } = await db.from('tenants').select('plan');
      const newStats: Record<string, { users: number; mrr: number }> = {
        starter: { users: 0, mrr: 0 },
        pro: { users: 0, mrr: 0 },
        business: { users: 0, mrr: 0 },
      };

      tenants?.forEach(t => {
        const pId = t.plan as PlanId;
        if (newStats[pId]) {
          newStats[pId].users++;
          newStats[pId].mrr += PLANS[pId].price;
        }
      });
      setStats(newStats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(plan: Plan) {
    setEditingId(plan.id);
    setEditForm({ ...plan });
  }

  function saveEdit() {
    if (!editingId) return;
    setPlans(prev => ({ ...prev, [editingId]: { ...prev[editingId], ...editForm } }));
    setEditingId(null);
  }

  const planColors: Record<PlanId, string> = {
    starter: '#6366f1', pro: '#10b981', business: '#f59e0b',
  };

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-5xl mx-auto">
        <PageHeader title="Gerenciar Planos Reais" subtitle="Configure os planos e limites do SaaS" />

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {(Object.values(plans) as Plan[]).map(plan => {
              const isEditing = editingId === plan.id;
              const planStat = stats[plan.id] || { users: 0, mrr: 0 };
              const color = planColors[plan.id];
              return (
                <div key={plan.id} className="bg-card rounded-xl border border-border overflow-hidden flex flex-col shadow-sm">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between" style={{ borderTop: `3px solid ${color}` }}>
                    <div className="flex items-center gap-2">
                      <Zap size={14} style={{ color }} />
                      <h3 className="font-bold text-foreground">{plan.name}</h3>
                    </div>
                    <div className="flex gap-1.5">
                      {isEditing ? (
                        <><Button size="sm" className="h-7 text-xs" onClick={saveEdit}><Save size={11} /> Salvar</Button><Button size="sm" variant="outline" className="h-7" onClick={() => setEditingId(null)}><X size={11} /></Button></>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => startEdit(plan)}><Edit2 size={11} /> Editar</Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
                    <div className="px-4 py-3 text-center"><p className="text-lg font-bold" style={{ color }}>{planStat.users}</p><p className="text-xs text-muted-foreground">clientes</p></div>
                    <div className="px-4 py-3 text-center"><p className="text-lg font-bold text-foreground">{formatCurrency(planStat.mrr)}</p><p className="text-xs text-muted-foreground">MRR</p></div>
                  </div>

                  <div className="p-5 flex-1 space-y-3">
                    {isEditing ? (
                      <>
                        <div><Label className="text-xs mb-1 block">Preço (R$/mês)</Label><Input type="number" value={editForm.price ?? plan.price} onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))} className="text-sm h-8" /></div>
                        <div><Label className="text-xs mb-1 block">Máx. contatos</Label><Input type="number" value={editForm.maxContacts ?? (plan.maxContacts || 0)} onChange={e => setEditForm(f => ({ ...f, maxContacts: Number(e.target.value) || null }))} className="text-sm h-8" /></div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Preço</span><span className="text-sm font-bold text-foreground">{formatCurrency(plan.price)}/mês</span></div>
                        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground flex items-center gap-1"><Users size={12} /> Contatos</span><span className="text-sm font-medium text-foreground">{plan.maxContacts ?? '∞'}</span></div>
                        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground flex items-center gap-1"><MessageSquare size={12} /> Follow-ups</span><span className="text-sm font-medium text-foreground">{plan.maxFollowUps}</span></div>
                      </>
                    )}
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Funcionalidades</p>
                      {plan.features.slice(0, 3).map(f => (
                        <div key={f} className="flex items-start gap-1.5 mb-1.5"><CheckCircle2 size={11} className="shrink-0 mt-0.5" style={{ color }} /><span className="text-xs text-muted-foreground">{f}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
