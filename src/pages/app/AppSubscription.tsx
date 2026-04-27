import { useState } from 'react';
import { useAuth } from '@/hooks/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { PLANS, formatCurrency } from '@/lib/index';
import {
  CheckCircle2, Zap, ArrowRight, AlertTriangle, CreditCard,
  TrendingDown, Gift, Calendar, CalendarDays, Star, Shield, RefreshCw
} from 'lucide-react';

// ── Desconto anual: 2 meses grátis = ~17% off ──────────────
const ANNUAL_DISCOUNT = 0.17;  // 17% (equivale a 2 meses grátis)

function monthlyToAnnual(monthlyPrice: number) {
  return Math.round(monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT));
}
function annualMonthly(monthlyPrice: number) {
  return +(monthlyPrice * (1 - ANNUAL_DISCOUNT)).toFixed(2);
}

// Savings badge
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

  const invoicesMonthly = [
    { date: '01/04/2026', amount: formatCurrency(currentPlan.price), status: 'Pago', type: 'Mensal' },
    { date: '01/03/2026', amount: formatCurrency(currentPlan.price), status: 'Pago', type: 'Mensal' },
    { date: '01/02/2026', amount: formatCurrency(currentPlan.price), status: 'Pago', type: 'Mensal' },
  ];
  const invoicesAnnual = [
    { date: '01/01/2026', amount: formatCurrency(monthlyToAnnual(currentPlan.price)), status: 'Pago', type: 'Anual' },
  ];

  async function handleUpgrade(planId: string) {
    setUpgrading(planId);
    await new Promise(r => setTimeout(r, 1200));
    setUpgrading(null);
    alert(`💳 Stripe em breve!\n\nPlano: ${PLANS[planId as keyof typeof PLANS].name} — ${billing === 'annual' ? 'Anual' : 'Mensal'}\nO checkout automático será ativado quando a chave Stripe for configurada.`);
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
              <p className="text-sm text-indigo-300 mt-1 flex items-center gap-1">
                <CalendarDays size={13} /> Próxima cobrança em 01/05/2026
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm font-semibold text-white">{user?.contactsUsed ?? 0} / {currentPlan.maxContacts ?? '∞'} contatos</p>
              <p className="text-xs text-indigo-300">{currentPlan.maxFollowUps} follow-ups por contato</p>
              <p className="text-xs text-indigo-300">{currentPlan.maxUsers ?? '∞'} usuário{(currentPlan.maxUsers ?? 2) > 1 ? 's' : ''}</p>
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
          {billing === 'monthly' && (
            <p className="text-xs text-muted-foreground">Mude para anual e economize até <strong className="text-emerald-600">R$ 950/ano</strong> no plano Ilimitado</p>
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

                {/* Header colorido */}
                <div className="px-5 pt-5 pb-4"
                  style={{ background: isCurrent ? '#f0fdf4' : isPopular ? 'linear-gradient(135deg,#1e1b4b,#312e81)' : 'var(--card)' }}>

                  {isCurrent && (
                    <span className="text-xs font-black px-2.5 py-1 rounded-full text-white mb-2.5 inline-flex items-center gap-1"
                      style={{ background: '#10b981' }}>
                      <CheckCircle2 size={10} /> PLANO ATUAL
                    </span>
                  )}
                  {isPopular && !isCurrent && (
                    <span className="text-xs font-black px-2.5 py-1 rounded-full text-white mb-2.5 inline-flex items-center gap-1"
                      style={{ background: '#f59e0b' }}>
                      <Star size={10} /> MAIS POPULAR
                    </span>
                  )}

                  <p className={`font-black text-lg ${isPopular && !isCurrent ? 'text-white' : 'text-foreground'}`}>{plan.name}</p>
                  <p className={`text-xs mt-0.5 mb-3 leading-relaxed ${isPopular && !isCurrent ? 'text-indigo-300' : 'text-muted-foreground'}`}>{PLAN_DESCS[plan.id]}</p>

                  {/* Preço com animação de troca */}
                  <div className="flex items-end gap-1">
                    <span className={`text-3xl font-black transition-all ${isPopular && !isCurrent ? 'text-white' : 'text-foreground'}`}>
                      {formatCurrency(displayPrice)}
                    </span>
                    <span className={`text-sm mb-1.5 ${isPopular && !isCurrent ? 'text-indigo-300' : 'text-muted-foreground'}`}>/mês</span>
                  </div>

                  {billing === 'annual' && (
                    <div className="mt-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <TrendingDown size={11} className="text-emerald-400" />
                        <span className={`font-semibold ${isPopular && !isCurrent ? 'text-emerald-300' : 'text-emerald-600'}`}>
                          {savingsAmount(plan.price)}
                        </span>
                      </div>
                      <p className={`text-xs ${isPopular && !isCurrent ? 'text-indigo-400' : 'text-muted-foreground'}`}>
                        cobrado anualmente: {formatCurrency(annualTotal)}
                      </p>
                    </div>
                  )}
                  {billing === 'monthly' && (
                    <p className={`text-xs mt-1 ${isPopular && !isCurrent ? 'text-indigo-400' : 'text-muted-foreground'}`}>
                      ou {formatCurrency(annualMonthly(plan.price))}/mês no plano anual
                    </p>
                  )}
                </div>

                {/* Features */}
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

                {/* CTA */}
                <div className="px-5 pb-5 bg-card">
                  {!isCurrent && isUpgrade && (
                    <Button onClick={() => handleUpgrade(plan.id)} disabled={upgrading === plan.id}
                      className="w-full text-sm font-bold gap-2 text-white"
                      style={{ background: isPopular ? 'var(--emerald)' : '#1e1b4b' }}>
                      {upgrading === plan.id
                        ? <><RefreshCw size={12} className="animate-spin" /> Processando...</>
                        : <><ArrowRight size={13} /> Fazer upgrade {billing === 'annual' ? '— Anual' : ''}</>
                      }
                    </Button>
                  )}
                  {!isCurrent && !isUpgrade && (
                    <Button variant="outline" className="w-full text-sm text-muted-foreground" disabled>
                      Plano inferior ao atual
                    </Button>
                  )}
                  {isCurrent && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                        <CheckCircle2 size={13} /> Seu plano atual
                      </div>
                      {billing === 'annual' && (
                        <button className="text-xs text-indigo-600 font-semibold hover:underline">
                          Migrar para anual →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Destaque do plano anual ── */}
        {billing === 'monthly' && (
          <div className="rounded-2xl border p-5 mb-6 flex items-center gap-4 flex-wrap cursor-pointer hover:shadow-md transition-all"
            style={{ background: 'linear-gradient(135deg, #fffbeb, #fef9c3)', borderColor: '#fde68a' }}
            onClick={() => setBilling('annual')}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: '#f59e0b20' }}>
              <Gift size={22} style={{ color: '#d97706' }} />
            </div>
            <div className="flex-1">
              <p className="font-black text-amber-800">💡 Dica: mude para o plano anual e economize até R$ 950/ano</p>
              <p className="text-xs text-amber-700 mt-0.5">No plano Ilimitado anual você paga R$ 164/mês (vs R$ 197,90/mês). São 2 meses completamente grátis.</p>
            </div>
            <Button className="shrink-0 font-bold text-white gap-2" style={{ background: '#d97706' }}>
              Ver planos anuais <ArrowRight size={13} />
            </Button>
          </div>
        )}

        {/* ── Garantia ── */}
        <div className="grid md:grid-cols-3 gap-3 mb-6">
          {[
            { icon: Shield,       title: 'Garantia de 7 dias',       desc: 'Não ficou satisfeito? Devolvemos 100% do valor — sem perguntas.' },
            { icon: RefreshCw,    title: 'Cancele quando quiser',     desc: 'Sem fidelidade, sem multa. Cancele com 1 clique a qualquer momento.' },
            { icon: CreditCard,   title: 'Pagamento seguro',          desc: 'Cartão de crédito ou PIX. Processado via Stripe com criptografia SSL.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card rounded-xl border border-border p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#eef2ff' }}>
                <Icon size={15} style={{ color: '#6366f1' }} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Histórico de pagamentos ── */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={15} className="text-primary" />
              <h3 className="font-bold text-sm text-foreground">Histórico de Pagamentos</h3>
            </div>
            <button className="text-xs text-indigo-600 font-semibold hover:underline">Baixar todos</button>
          </div>
          <div className="divide-y divide-border">
            {invoicesMonthly.map((inv, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/20 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-foreground">Plano {currentPlan.name} — {inv.type}</p>
                  <p className="text-xs text-muted-foreground">{inv.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground">{inv.amount}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: '#d1fae5', color: '#065f46' }}>
                    ✓ {inv.status}
                  </span>
                  <button className="text-xs text-indigo-600 hover:underline">PDF</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stripe notice ── */}
        <div className="mt-5 flex items-start gap-3 p-4 rounded-xl border" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <AlertTriangle size={15} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-bold text-blue-800">Checkout via Stripe (em breve)</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Quando a chave Stripe for configurada, o checkout — incluindo plano mensal vs anual — será ativado automaticamente.
              Suporte a cartão de crédito, débito e PIX.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
