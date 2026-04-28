import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { PLANS, formatCurrency } from '@/lib/index';
import {
  CheckCircle2, Zap, ArrowRight, CreditCard,
  TrendingDown, Gift, Calendar, CalendarDays, Star, RefreshCw, Loader2
} from 'lucide-react';
import { db } from '@/lib/supabase';

const ANNUAL_DISCOUNT = 0.17;

function monthlyToAnnual(monthlyPrice: number) {
  return Math.round(monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT));
}
function annualMonthly(monthlyPrice: number) {
  return +(monthlyPrice * (1 - ANNUAL_DISCOUNT)).toFixed(2);
}
function savingsAmount(monthlyPrice: number) {
  const saved = Math.round(monthlyPrice * 12 * ANNUAL_DISCOUNT);
  return `Economize R$${saved.toLocaleString('pt-BR')}/ano`;
}

const PLAN_DESCS: Record<string, string> = {
  starter:  'Para quem está começando a prospectar de forma profissional',
  pro:      'Para times que querem escalar com bot, campanhas e CRM completo',
  business: 'Para operações de alto volume com múltiplos usuários',
};

export default function AppSubscription() {
  const { user } = useAuth();
  const currentPlan = PLANS[user?.planId ?? 'starter'];
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.tenantId) loadInvoices();
  }, [user?.tenantId]);

  async function loadInvoices() {
    setLoading(true);
    try {
      const { data } = await db
        .from('invoices')
        .select('*')
        .eq('tenant_id', user?.tenantId)
        .order('created_at', { ascending: false });
      if (data) setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(planId: string) {
    setUpgrading(planId);
    // Simulação de redirecionamento para o Stripe Checkout
    await new Promise(r => setTimeout(r, 1500));
    setUpgrading(null);
    alert(`Redirecionando para o Checkout Seguro...\n\nPlano: ${PLANS[planId as keyof typeof PLANS].name}\nCiclo: ${billing === 'annual' ? 'Anual' : 'Mensal'}`);
  }

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-4xl mx-auto">
        <PageHeader title="Minha Assinatura" subtitle="Gerencie seu plano, ciclo de cobrança e histórico de pagamentos" />

        {/* ── Plano atual ── */}
        <div className="rounded-2xl border p-6 mb-6"
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderColor: '#4338ca' }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Zap size={15} className="text-emerald-400" />
                </div>
                <span className="font-black text-white text-lg">Plano {currentPlan.name}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold text-white"
                  style={{ background: user?.subscriptionStatus === 'active' ? '#10b981' : '#d97706' }}>
                  {user?.subscriptionStatus === 'active' ? '✅ Ativo' : user?.subscriptionStatus === 'trial' ? '⏳ Trial' : '⚠️ Pendente'}
                </span>
              </div>
              <p className="text-4xl font-black text-white">
                {formatCurrency(currentPlan.price)}
                <span className="text-base font-normal text-indigo-300">/mês</span>
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm font-semibold text-white">{user?.contactsUsed ?? 0} / {currentPlan.maxContacts ?? '∞'} contatos</p>
              <p className="text-xs text-indigo-300">{currentPlan.maxFollowUps} follow-ups por contato</p>
              <Button variant="outline" size="sm" className="mt-2 text-xs border-white/30 text-white hover:bg-white/10">
                <CreditCard size={11} className="mr-1.5" /> Gerenciar cartão
              </Button>
            </div>
          </div>
        </div>

        {/* ── Toggle Mensal / Anual ── */}
        <div className="flex flex-col items-center mb-7">
          <div className="flex items-center gap-3 p-1 rounded-2xl border border-border bg-muted/30 mb-3">
            <button onClick={() => setBilling('monthly')}
              className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: billing === 'monthly' ? 'white' : 'transparent', color: billing === 'monthly' ? 'var(--foreground)' : 'var(--muted-foreground)', boxShadow: billing === 'monthly' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>
              <Calendar size={14} className="inline mr-1.5" />
              Mensal
            </button>
            <button onClick={() => setBilling('annual')}
              className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative"
              style={{ background: billing === 'annual' ? '#1e1b4b' : 'transparent', color: billing === 'annual' ? 'white' : 'var(--muted-foreground)', boxShadow: billing === 'annual' ? '0 2px 8px rgba(30,27,75,0.35)' : 'none' }}>
              <CalendarDays size={14} className="inline mr-1.5" />
              Anual
              <span className="ml-2 text-xs font-black px-2 py-0.5 rounded-full"
                style={{ background: billing === 'annual' ? '#10b981' : '#f0fdf4', color: billing === 'annual' ? 'white' : '#059669' }}>
                −17%
              </span>
            </button>
          </div>
          {billing === 'annual' && (
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 animate-pulse">
              <Gift size={15} />
              <span>2 meses grátis — pague 10, leve 12!</span>
              <Gift size={15} />
            </div>
          )}
        </div>

        {/* ── Cards de planos ── */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {Object.values(PLANS).map((plan) => {
            const isCurrent = plan.id === user?.planId;
            const isUpgrade = Object.keys(PLANS).indexOf(plan.id) > Object.keys(PLANS).indexOf(user?.planId ?? 'starter');
            const displayPrice = billing === 'annual' ? annualMonthly(plan.price) : plan.price;
            const annualTotal = monthlyToAnnual(plan.price);
            const isPopular = plan.highlight;

            return (
              <div key={plan.id} className="rounded-2xl border flex flex-col overflow-hidden relative transition-all hover:shadow-lg"
                style={{
                  borderColor: isCurrent ? '#10b981' : isPopular ? '#6366f1' : 'var(--border)',
                  boxShadow: isPopular ? '0 8px 32px rgba(99,102,241,0.18)' : undefined,
                  transform: isPopular ? 'scale(1.03)' : undefined,
                }}>
                <div className="px-5 pt-5 pb-4"
                  style={{ background: isCurrent ? '#f0fdf4' : isPopular ? 'linear-gradient(135deg,#1e1b4b,#312e81)' : 'var(--card)' }}>
                  {isCurrent && (
                    <span className="text-xs font-black px-2.5 py-1 rounded-full text-white mb-2.5 inline-flex items-center gap-1"
                      style={{ background: '#10b981' }}>
                      <CheckCircle2 size={10} /> PLANO ATUAL
                    </span>
                  )}
                  <p className={`font-black text-lg ${isPopular && !isCurrent ? 'text-white' : 'text-foreground'}`}>{plan.name}</p>
                  <p className={`text-xs mt-0.5 mb-3 leading-relaxed ${isPopular && !isCurrent ? 'text-indigo-300' : 'text-muted-foreground'}`}>{PLAN_DESCS[plan.id]}</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-3xl font-black transition-all ${isPopular && !isCurrent ? 'text-white' : 'text-foreground'}`}>
                      {formatCurrency(displayPrice)}
                    </span>
                    <span className={`text-sm mb-1.5 ${isPopular && !isCurrent ? 'text-indigo-300' : 'text-muted-foreground'}`}>/mês</span>
                  </div>
                </div>
                <div className="px-5 py-4 flex-1 bg-card">
                  <ul className="space-y-2">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 size={12} className="shrink-0 mt-0.5 text-emerald-500" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-5 pb-5 bg-card">
                  {!isCurrent && isUpgrade && (
                    <Button onClick={() => handleUpgrade(plan.id)} disabled={upgrading === plan.id}
                      className="w-full text-sm font-bold gap-2 text-white"
                      style={{ background: isPopular ? 'var(--emerald)' : '#1e1b4b' }}>
                      {upgrading === plan.id
                        ? <><RefreshCw size={12} className="animate-spin" /> Processando...</>
                        : <><ArrowRight size={13} /> Fazer upgrade</>
                      }
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Histórico de faturas ── */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/20">
            <h3 className="font-bold text-sm">Histórico de Faturas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Data</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Valor</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={3} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></td></tr>
                ) : invoices.map((inv, i) => (
                  <tr key={i} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-3 text-muted-foreground">{new Date(inv.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-5 py-3 font-semibold">{formatCurrency(inv.amount)}</td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && invoices.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-10 text-muted-foreground">Nenhuma fatura encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
