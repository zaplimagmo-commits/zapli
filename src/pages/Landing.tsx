import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, CheckCircle2, ArrowRight, Star, TrendingUp, Shield, Clock,
  MessageCircle, Instagram, Bot, Megaphone, Target, Users, BarChart2,
  ChevronRight, Menu, X, Play, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLANS, formatCurrency } from '@/lib/index';
import { ROUTES } from '@/lib/index';

const STATS = [
  { value: '34%', label: 'taxa de resposta média', sub: 'vs 8% do e-mail' },
  { value: '12x', label: 'mais reuniões/mês', sub: 'vs prospecção manual' },
  { value: '< 2min', label: 'para criar uma campanha', sub: 'sem nenhum técnico' },
  { value: 'R$0,80', label: 'custo por lead contactado', sub: 'vs R$15+ de ads' },
];

const FEATURES = [
  { icon: '🎯', title: 'Lead Score Inteligente', desc: 'Cada contato recebe uma pontuação automática de 0–100. Foque sua energia nos leads mais quentes.' },
  { icon: '⚡', title: 'Prospecção Ativa WA + IG', desc: 'Dispare mensagens personalizadas pelo WhatsApp e Instagram com variáveis automáticas por contato.' },
  { icon: '🤖', title: 'Bot de Auto-Resposta', desc: 'Configure regras inteligentes: detectar interesse, responder perguntas de preço, escalar para humano.' },
  { icon: '📣', title: 'Campanhas Segmentadas', desc: 'Selecione sua base por segmento, status ou tag. Disparo em massa com anti-bloqueio nativo.' },
  { icon: '🏆', title: 'CRM com Win-Rate', desc: 'Kanban de 6 estágios com receita ponderada, probabilidade de fechamento e pipeline health score.' },
  { icon: '📊', title: 'Dashboard Executivo', desc: 'Funil com drop-off, atividade em tempo real, top produtos, custo por lead e LTV médio.' },
  { icon: '👥', title: 'CRM de Clientes 360°', desc: 'Histórico completo, produtos vendidos, propostas, LTV, MRR e health score por cliente.' },
  { icon: '🛡️', title: 'Anti-Bloqueio Embutido', desc: 'Intervalos aleatórios, warm-up gradual, limites diários e horário comercial — sem risco de ban.' },
];

// Comparativo vs concorrentes
const COMPARISON = [
  { feature: 'Lead Score automático',           zapli: true,  kommo: false, wati: false, rdstation: false },
  { feature: 'Bot com regras por palavra-chave', zapli: true,  kommo: true,  wati: true,  rdstation: false },
  { feature: 'Campanhas WA + Instagram',         zapli: true,  kommo: false, wati: false, rdstation: false },
  { feature: 'Anti-bloqueio nativo',             zapli: true,  kommo: false, wati: false, rdstation: false },
  { feature: 'CRM com win-rate + prob.',         zapli: true,  kommo: true,  wati: false, rdstation: true  },
  { feature: 'Funil de drop-off visual',         zapli: true,  kommo: false, wati: false, rdstation: false },
  { feature: 'Clientes 360° + LTV',             zapli: true,  kommo: false, wati: false, rdstation: false },
  { feature: 'Em português nativo',              zapli: true,  kommo: false, wati: false, rdstation: true  },
  { feature: 'Setup em menos de 5 minutos',      zapli: true,  kommo: false, wati: false, rdstation: false },
];

const TESTIMONIALS = [
  { name: 'Ana Oliveira', role: 'Diretora Comercial', company: 'Construtora ABC', text: 'Em 30 dias conseguimos 12 reuniões com novos clientes. O lead score nos mostrou exatamente onde focar.', rating: 5, avatar: 'AO', color: '#6366f1' },
  { name: 'Carlos Souza', role: 'CEO', company: 'RF Engenharia', text: 'Nossa taxa de resposta saiu de 8% para 34%. O bot responde perguntas de preço automaticamente — libertou meu tempo.', rating: 5, avatar: 'CS', color: '#059669' },
  { name: 'Mariana Lima', role: 'Gerente de Vendas', company: 'Agência MRL', text: 'Testamos Kommo, Wati e 2 outros. Nenhum tinha lead score + campanha + CRM tudo junto assim. O Zapli é diferente.', rating: 5, avatar: 'ML', color: '#E1306C' },
];

const FAQS = [
  { q: 'Precisa de conhecimento técnico?', a: 'Não. Se você sabe usar WhatsApp, sabe usar o Zapli. Sem código, sem API manualmente, sem configuração complexa.' },
  { q: 'Corro risco de ter meu WhatsApp bloqueado?', a: 'O Zapli tem anti-bloqueio embutido com intervalos aleatórios, warm-up gradual e limites diários — seguindo as melhores práticas da Meta.' },
  { q: 'Funciona para qual tipo de negócio?', a: 'Qualquer B2B: construtoras, escritórios de arquitetura/engenharia, consultorias, fornecedores, agências, tecnologia, saúde B2B.' },
  { q: 'Posso importar minha base de contatos?', a: 'Sim. Importação via Excel/CSV na tela de Contatos. Nenhum contato é perdido.' },
  { q: 'Como funciona o Instagram?', a: 'Via Evolution API. Você conecta sua conta comercial e o Zapli gerencia DMs, respostas automáticas e campanhas para seguidores.' },
];

function Tick({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`text-sm font-semibold ${ok ? 'text-emerald-600' : 'text-red-400'}`}>
      {ok ? '✅' : '❌'}
    </span>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingLanding, setBillingLanding] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 border-b border-white/20 backdrop-blur-xl" style={{ background: 'rgba(248,250,252,0.92)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'var(--sidebar)' }}>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-black text-xl tracking-tight text-foreground">Zapli</span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm">
            {['Funcionalidades', 'vs Concorrentes', 'Depoimentos', 'Preços', 'FAQ'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link to={ROUTES.LOGIN}>
              <Button variant="ghost" size="sm" className="text-sm">Entrar</Button>
            </Link>
            <Button onClick={() => navigate(ROUTES.REGISTER)} size="sm" className="text-sm text-white font-semibold"
              style={{ background: 'var(--emerald)' }}>
              Começar grátis →
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-20 pb-24">
        {/* Background decorativo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
          <div className="absolute top-10 right-20 w-40 h-40 rounded-full opacity-5" style={{ background: '#10b981' }} />
        </div>

        <div className="max-w-5xl mx-auto px-6 text-center relative">
          {/* Badge de novidade */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-7 text-sm font-semibold"
            style={{ background: '#eef2ff', borderColor: '#c7d2fe', color: '#6366f1' }}>
            <Zap size={13} /> Novo: Bot + Instagram + Lead Score
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-black tracking-tight text-foreground leading-tight mb-6">
            Prospecte clientes B2B pelo<br />
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              WhatsApp & Instagram
            </span><br />
            de forma inteligente.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-9 leading-relaxed">
            CRM + Bot + Campanhas + Lead Score + Anti-bloqueio — tudo em um MVP criado para times de venda B2B que querem <strong className="text-foreground">resultado, não complexidade</strong>.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Button onClick={() => navigate(ROUTES.REGISTER)} size="lg"
              className="text-base px-8 py-6 font-bold text-white gap-2 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 10px 40px rgba(99,102,241,0.35)' }}>
              Começar agora — grátis <ArrowRight size={16} />
            </Button>
            <Button onClick={() => navigate(ROUTES.LOGIN)} variant="outline" size="lg"
              className="text-base px-8 py-6 font-semibold gap-2">
              <Play size={14} /> Ver demo interativa
            </Button>
          </motion.div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map((s, i) => (
              <motion.div key={s.value} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-white rounded-2xl border border-border p-4 shadow-sm text-center">
                <p className="text-2xl font-black" style={{ color: '#6366f1' }}>{s.value}</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Social proof inline */}
          <div className="flex items-center justify-center gap-2 mt-7 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {['CS', 'AO', 'ML', 'RF', 'JT'].map((initials, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: ['#6366f1','#059669','#E1306C','#f59e0b','#0ea5e9'][i] }}>{initials}</div>
              ))}
            </div>
            <span>+240 times B2B já usam o Zapli</span>
            <div className="flex items-center gap-0.5 ml-1">
              {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#f59e0b" className="text-amber-400" />)}
            </div>
            <span className="font-semibold">4.9/5</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="funcionalidades" className="py-20" style={{ background: 'white' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#6366f1' }}>O que você vai ter</p>
            <h2 className="text-4xl font-black text-foreground">Tudo que um time de vendas B2B precisa</h2>
            <p className="text-muted-foreground mt-3 text-lg max-w-2xl mx-auto">Da prospecção ao cliente. Sem ferramentas separadas. Sem integrações complicadas.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }}
                className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-all hover:border-indigo-200 group">
                <div className="text-3xl mb-3">{f.icon}</div>
                <p className="font-bold text-foreground mb-1.5 group-hover:text-indigo-700 transition-colors">{f.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARATIVO ── */}
      <section id="vs-concorrentes" className="py-20" style={{ background: '#f8fafc' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#6366f1' }}>Comparativo</p>
            <h2 className="text-4xl font-black text-foreground">Por que o Zapli é diferente</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Analisamos Kommo, Wati, RD Station, Treble e Callbell. Aqui está o que faltava em todos.</p>
          </div>
          <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-sm font-semibold text-muted-foreground">Funcionalidade</th>
                    <th className="text-center px-4 py-3 text-sm font-black text-white rounded-t-none" style={{ background: '#6366f1' }}>
                      <div className="flex items-center justify-center gap-1.5"><Zap size={13} /> Zapli</div>
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-muted-foreground">Kommo</th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-muted-foreground">Wati</th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-muted-foreground">RD Station</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={row.feature} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                      <td className="px-5 py-3 text-sm text-foreground font-medium">{row.feature}</td>
                      <td className="px-4 py-3 text-center" style={{ background: '#6366f110' }}><Tick ok={row.zapli} label="" /></td>
                      <td className="px-4 py-3 text-center"><Tick ok={row.kommo} label="" /></td>
                      <td className="px-4 py-3 text-center"><Tick ok={row.wati} label="" /></td>
                      <td className="px-4 py-3 text-center"><Tick ok={row.rdstation} label="" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-border" style={{ background: '#eef2ff' }}>
              <p className="text-xs text-indigo-700 font-semibold text-center">
                ✅ O Zapli é o único com todas essas funcionalidades juntas — na mesma tela, em português
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="depoimentos" className="py-20" style={{ background: 'white' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#6366f1' }}>Depoimentos</p>
            <h2 className="text-4xl font-black text-foreground">Quem já usa tem resultado</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} size={13} fill="#f59e0b" className="text-amber-400" />)}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                    style={{ background: t.color }}>{t.avatar}</div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="preços" className="py-20" style={{ background: '#f8fafc' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-8">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#6366f1' }}>Planos</p>
            <h2 className="text-4xl font-black text-foreground">Preço justo. Sem surpresas.</h2>
            <p className="text-muted-foreground mt-3">Cancele a qualquer momento. Garantia de 7 dias.</p>
          </div>

          {/* Toggle mensal/anual */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 p-1 rounded-2xl border border-border bg-white mb-3">
              {(['monthly','annual'] as const).map(b => (
                <button key={b} onClick={() => setBillingLanding(b)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ background: billingLanding === b ? (b === 'annual' ? '#1e1b4b' : 'white') : 'transparent', color: billingLanding === b ? (b === 'annual' ? 'white' : 'var(--foreground)') : 'var(--muted-foreground)', boxShadow: billingLanding === b ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>
                  {b === 'monthly' ? '📅 Mensal' : '📆 Anual'}
                  {b === 'annual' && <span className="ml-2 text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white">−17%</span>}
                </button>
              ))}
            </div>
            {billingLanding === 'annual'
              ? <p className="text-sm font-bold text-emerald-600">🎁 2 meses grátis — pague 10, leve 12!</p>
              : <p className="text-xs text-muted-foreground">Mude para anual e economize até <strong className="text-emerald-600">R$ 950/ano</strong> no plano Ilimitado</p>
            }
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Essencial', monthly: 97.90,  badge: '', features: ['300 contatos', '3 follow-ups por lead', 'WhatsApp conectado', 'Bot básico', 'Templates personalizados', 'Dashboard analítico'] },
              { name: 'Ilimitado', monthly: 197.90, badge: 'Mais popular', features: ['Contatos ilimitados', 'Follow-ups ilimitados', 'WhatsApp + Instagram', 'Bot avançado + regras', 'Campanhas segmentadas', 'CRM completo + Clientes 360°', 'Lead Score automático', 'Relatórios exportáveis'] },
              { name: 'Enterprise', monthly: 397,   badge: '', features: ['Tudo do Ilimitado', 'Múltiplos usuários', 'Múltiplos números WA', 'Onboarding dedicado', 'SLA de suporte', 'Acesso à API'] },
            ].map((plan, i) => {
              const isHighlight = plan.badge === 'Mais popular';
              const displayPrice = billingLanding === 'annual' ? +(plan.monthly * (1 - 0.17)).toFixed(2) : plan.monthly;
              const annualTotal = Math.round(plan.monthly * 12 * (1 - 0.17));
              return (
                <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                  className="rounded-2xl border flex flex-col relative overflow-hidden transition-all hover:shadow-xl"
                  style={{ borderColor: isHighlight ? '#4f46e5' : '#e5e7eb', transform: isHighlight ? 'scale(1.03)' : undefined }}>
                  {plan.badge && <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0 text-xs font-bold px-4 py-1 text-white" style={{ background: 'var(--emerald)' }}>{plan.badge}</span>}
                  <div className="p-6 flex-1" style={{ background: isHighlight ? 'linear-gradient(135deg, #1e1b4b, #312e81)' : 'white', paddingTop: plan.badge ? '2rem' : '1.5rem' }}>
                    <p className={`font-black text-lg mb-1 ${isHighlight ? 'text-white' : 'text-foreground'}`}>{plan.name}</p>
                    <div className="flex items-end gap-1 mb-1">
                      <span className={`text-4xl font-black transition-all ${isHighlight ? 'text-white' : 'text-foreground'}`}>
                        R$ {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span className={`text-sm mb-1.5 ${isHighlight ? 'text-indigo-300' : 'text-muted-foreground'}`}>/mês</span>
                    </div>
                    {billingLanding === 'annual'
                      ? <p className={`text-xs mb-4 font-semibold ${isHighlight ? 'text-emerald-300' : 'text-emerald-600'}`}>
                          R$ {annualTotal.toLocaleString('pt-BR')}/ano · economize R$ {Math.round(plan.monthly * 12 * 0.17).toLocaleString('pt-BR')}
                        </p>
                      : <p className={`text-xs mb-4 ${isHighlight ? 'text-indigo-400' : 'text-muted-foreground'}`}>
                          ou R$ {+(plan.monthly * (1 - 0.17)).toFixed(0)}/mês no plano anual
                        </p>
                    }
                    <ul className="space-y-2 mb-6">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 size={14} className={`shrink-0 mt-0.5 ${isHighlight ? 'text-emerald-400' : 'text-emerald-500'}`} />
                          <span className={isHighlight ? 'text-indigo-100' : 'text-foreground'}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="px-6 pb-6" style={{ background: isHighlight ? '#312e81' : 'white' }}>
                    <Button onClick={() => navigate(ROUTES.REGISTER)} className="w-full font-bold text-white"
                      style={{ background: isHighlight ? 'var(--emerald)' : '#1e1b4b' }}>
                      Começar {billingLanding === 'annual' ? 'anual' : 'agora'}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">💡 14 dias de teste grátis em todos os planos. Sem cartão de crédito.</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20" style={{ background: 'white' }}>
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-foreground">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className="rounded-xl border border-border overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span className="text-sm font-semibold text-foreground">{f.q}</span>
                  <ChevronRight size={16} className={`text-muted-foreground transition-transform shrink-0 ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #1e1b4b 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="text-5xl mb-5">🚀</div>
          <h2 className="text-4xl font-black text-white mb-4">Pronto para prospectar inteligente?</h2>
          <p className="text-indigo-200 text-lg mb-8">Comece em menos de 5 minutos. Sem cartão de crédito. Sem configuração técnica.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate(ROUTES.REGISTER)} size="lg"
              className="text-base px-10 py-6 font-bold text-white"
              style={{ background: 'var(--emerald)', boxShadow: '0 10px 40px rgba(16,185,129,0.4)' }}>
              Criar conta grátis → <ArrowRight size={16} />
            </Button>
            <Button onClick={() => navigate(ROUTES.LOGIN)} variant="outline" size="lg"
              className="text-base px-10 py-6 font-semibold text-white border-white/30">
              Ver demo sem cadastro
            </Button>
          </div>
          <p className="text-indigo-400 text-sm mt-5">admin@zapli.io / admin123 para entrar como admin e explorar tudo</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 border-t border-border" style={{ background: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--sidebar)' }}>
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="font-black text-foreground">Zapli</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Zapli. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Termos</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="hover:text-foreground transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
