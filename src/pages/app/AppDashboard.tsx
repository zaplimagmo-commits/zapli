import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, useProspect } from '@/hooks/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { ROUTES } from '@/lib/index';
import { useRole } from '@/hooks/useRole';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, MessageCircle, Target, Zap, ArrowRight,
  CheckCircle2, Clock, AlertCircle, Star, ChevronRight, Send,
  BarChart2, Activity, Award, Flame, Eye, Reply, PhoneCall,
  CalendarDays, RefreshCw, Bot, Megaphone, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── helpers ────────────────────────────────────────────────
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

// ── mock data ──────────────────────────────────────────────
const areaData = [
  { day: 'Seg', leads: 4, responderam: 1, convertidos: 0 },
  { day: 'Ter', leads: 7, responderam: 3, convertidos: 1 },
  { day: 'Qua', leads: 5, responderam: 2, convertidos: 0 },
  { day: 'Qui', leads: 9, responderam: 5, convertidos: 2 },
  { day: 'Sex', leads: 12, responderam: 6, convertidos: 3 },
  { day: 'Sáb', leads: 3, responderam: 1, convertidos: 0 },
  { day: 'Dom', leads: 1, responderam: 0, convertidos: 0 },
];

const funnelData = [
  { stage: 'Contactados', value: 148, color: '#6366f1', drop: null },
  { stage: 'Entregue',    value: 141, color: '#8b5cf6', drop: 5 },
  { stage: 'Lido',        value: 98,  color: '#0ea5e9', drop: 31 },
  { stage: 'Respondeu',   value: 34,  color: '#f59e0b', drop: 65 },
  { stage: 'Positivo',    value: 19,  color: '#10b981', drop: 44 },
  { stage: 'Convertido',  value: 12,  color: '#059669', drop: 37 },
];

const channelPie = [
  { name: 'WhatsApp', value: 78, color: '#25D366' },
  { name: 'Instagram', value: 15, color: '#E1306C' },
  { name: 'Ambos', value: 7, color: '#6366f1' },
];

const performanceWeek = [
  { day: 'S', meta: 10, real: 8 },
  { day: 'T', meta: 10, real: 12 },
  { day: 'Q', meta: 10, real: 7 },
  { day: 'Q', meta: 10, real: 14 },
  { day: 'S', meta: 10, real: 11 },
  { day: 'S', meta: 5,  real: 4 },
  { day: 'D', meta: 0,  real: 1 },
];

const topProducts = [
  { name: 'Consultoria Premium',  leads: 42, conv: 8, revenue: 'R$ 38.400', color: '#6366f1' },
  { name: 'Análise de Projeto',   leads: 31, conv: 5, revenue: 'R$ 17.500', color: '#8b5cf6' },
  { name: 'BIM 360 Setup',        leads: 18, conv: 3, revenue: 'R$ 14.700', color: '#0ea5e9' },
  { name: 'Laudo Técnico',        leads: 12, conv: 2, revenue: 'R$  9.800', color: '#10b981' },
];

const recentActivity = [
  { type: 'reply',   name: 'Carlos Mendes',    msg: 'Sim, tenho interesse! Pode me ligar?', time: '2min', hot: true },
  { type: 'new',     name: 'Ana Beatriz Costa', msg: 'Lead adicionado via campanha BIM World', time: '8min', hot: false },
  { type: 'convert', name: 'RF Engenharia',     msg: 'Deal criado: Consultoria Premium R$4.800', time: '15min', hot: false },
  { type: 'reply',   name: 'Marcos Pereira',    msg: 'Quanto custa o pacote completo?', time: '23min', hot: true },
  { type: 'bot',     name: 'Bot respondeu',     msg: 'Mensagem automática enviada para Juliana Silva', time: '31min', hot: false },
  { type: 'campaign',name: 'Campanha Abril',    msg: '43/67 mensagens enviadas — 22 lidas', time: '45min', hot: false },
];

const ACTIVITY_CFG = {
  reply:    { icon: Reply,     color: '#f59e0b', bg: '#fffbeb', label: 'Resposta' },
  new:      { icon: UserPlus,  color: '#6366f1', bg: '#eef2ff', label: 'Novo lead' },
  convert:  { icon: Award,     color: '#059669', bg: '#f0fdf4', label: 'Convertido' },
  bot:      { icon: Bot,       color: '#8b5cf6', bg: '#f5f3ff', label: 'Bot' },
  campaign: { icon: Megaphone, color: '#0ea5e9', bg: '#f0f9ff', label: 'Campanha' },
};

// Tooltip customizado para o funil
function FunnelTooltip({ payload, active }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-xl text-xs">
      <p className="font-bold text-sm mb-1">{d.stage}</p>
      <p><span className="text-muted-foreground">Leads: </span><strong>{d.value}</strong></p>
      {d.drop !== null && <p className="text-red-500">↓ {d.drop} saíram nesta etapa ({pct(d.drop, d.value + d.drop)}%)</p>}
    </div>
  );
}

function CustomTooltip({ payload, active, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-xl text-xs min-w-[120px]">
      <p className="font-semibold mb-1.5 text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
}

// ── componentes menores ────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, bg, border, trend, trendUp }: any) {
  return (
    <div className="rounded-2xl border p-5 flex items-start gap-4 transition-all hover:shadow-md"
      style={{ background: bg, borderColor: border }}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: `${color}20` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-black tracking-tight" style={{ color }}>{value}</p>
        <p className="text-xs font-semibold text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5 opacity-75">{sub}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {trend}
          </div>
        )}
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────
export default function AppDashboard() {
  const { user } = useAuth();
  const { contacts, notifications, teamMembers, deals } = useProspect();
  const { isGestor } = useRole();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  const totalLeads = contacts.length;
  const responded = contacts.filter(c => c.status === 'respondido').length;
  const converted = contacts.filter(c => c.status === 'convertido').length;
  const waiting = contacts.filter(c => c.status === 'aguardando').length;
  const followUp = contacts.filter(c => c.status === 'followup').length;
  const convRate = pct(converted, totalLeads);
  const responseRate = pct(responded + converted, totalLeads);

  // Score do dia (simulado)
  const dailySent = 47;
  const dailyGoal = 60;
  const dailyPct = pct(dailySent, dailyGoal);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-[1300px] mx-auto space-y-6">

        {/* ── Header personalizado ── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">👋</span>
              <h1 className="text-2xl font-black text-foreground">{saudacao}, {user?.name.split(' ')[0]}!</h1>
            </div>
            <p className="text-sm text-muted-foreground">Aqui está o resumo da sua prospecção — <strong className="text-foreground">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></p>
          </div>
          <div className="flex items-center gap-2">
            {(['7d', '30d', '90d'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
                style={{ background: period === p ? '#6366f1' : 'transparent', color: period === p ? 'white' : 'var(--muted-foreground)', borderColor: period === p ? '#6366f1' : 'var(--border)' }}>
                {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
            <Button size="sm" className="gap-1.5 text-xs text-white ml-1" style={{ background: 'var(--emerald)' }}
              onClick={() => navigate(ROUTES.APP_CONTACTS)}>
              <UserPlus size={13} /> Novo Lead
            </Button>
          </div>
        </div>

        {/* ── Alerta de metas diárias ── */}
        <div className="rounded-2xl border p-4 flex items-center gap-4 flex-wrap"
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderColor: '#4338ca' }}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Flame size={18} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Meta do dia: {dailySent}/{dailyGoal} mensagens enviadas</p>
              <p className="text-xs text-indigo-300 mt-0.5">Continue! Você está a {dailyGoal - dailySent} mensagens de bater a meta de hoje.</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="flex-1 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${dailyPct}%`, background: dailyPct >= 100 ? '#10b981' : '#f59e0b' }} />
            </div>
            <span className="text-xs font-bold text-white">{dailyPct}%</span>
          </div>
          <Button size="sm" className="text-xs gap-1.5 shrink-0" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
            onClick={() => navigate(ROUTES.APP_QUEUE)}>
            <Send size={12} /> Ir para fila
          </Button>
        </div>

        {/* ── KPIs principais (linha 1) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total de Leads" value={fmt(totalLeads)} sub="na sua base"
            icon={Users} color="#6366f1" bg="#eef2ff" border="#c7d2fe"
            trend="+12 esta semana" trendUp />
          <KpiCard label="Taxa de Resposta" value={`${responseRate}%`} sub={`${responded + converted} responderam`}
            icon={Reply} color="#0ea5e9" bg="#f0f9ff" border="#bae6fd"
            trend="+4pp vs semana passada" trendUp />
          <KpiCard label="Conversão" value={`${convRate}%`} sub={`${converted} convertidos`}
            icon={Target} color="#059669" bg="#f0fdf4" border="#bbf7d0"
            trend="+1pp esta semana" trendUp />
          <KpiCard label="Aguardando" value={waiting + followUp} sub={`${followUp} em follow-up`}
            icon={Clock} color="#d97706" bg="#fffbeb" border="#fde68a"
            trend={`${followUp} precisam de ação`} trendUp={false} />
        </div>

        {/* ── Linha 2: Gráfico área + Funil drop-off ── */}
        <div className="grid md:grid-cols-5 gap-4">
          {/* Área: atividade da semana */}
          <div className="md:col-span-3 bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-foreground">Atividade de Prospecção</p>
                <p className="text-xs text-muted-foreground">Leads, respostas e conversões — últimos 7 dias</p>
              </div>
              <Activity size={16} className="text-muted-foreground" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={areaData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gResp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gConv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="leads" name="Leads" stroke="#6366f1" strokeWidth={2} fill="url(#gLeads)" />
                <Area type="monotone" dataKey="responderam" name="Responderam" stroke="#f59e0b" strokeWidth={2} fill="url(#gResp)" />
                <Area type="monotone" dataKey="convertidos" name="Convertidos" stroke="#10b981" strokeWidth={2} fill="url(#gConv)" />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Funil com drop-off (diferencial vs Kommo/RD) */}
          <div className="md:col-span-2 bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-foreground">Funil de Conversão</p>
                <p className="text-xs text-muted-foreground">Drop-off por etapa</p>
              </div>
              <Target size={16} className="text-muted-foreground" />
            </div>
            <div className="space-y-2">
              {funnelData.map((d, i) => {
                const maxVal = funnelData[0].value;
                const w = pct(d.value, maxVal);
                return (
                  <div key={d.stage}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground font-medium">{d.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: d.color }}>{d.value}</span>
                        {d.drop !== null && (
                          <span className="text-red-400 text-xs">↓{d.drop}</span>
                        )}
                      </div>
                    </div>
                    <div className="h-6 rounded-lg overflow-hidden" style={{ background: 'var(--muted)' }}>
                      <div className="h-full rounded-lg flex items-center px-2 transition-all"
                        style={{ width: `${w}%`, background: d.color, opacity: 0.85 }}>
                        {w > 20 && <span className="text-white text-xs font-bold">{w}%</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Conversão geral</span>
              <span className="text-sm font-black text-emerald-600">{pct(funnelData[5].value, funnelData[0].value)}%</span>
            </div>
          </div>
        </div>

        {/* ── Linha 3: Performance SDR + Canal + Produtos ── */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Performance SDR — diferencial vs Exact Sales Spotter */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-foreground">Performance da Semana</p>
              <Award size={15} className="text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-4">Envios diários vs. meta</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={performanceWeek} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="meta" name="Meta" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="real" name="Real" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
              {[
                { l: 'Enviados', v: '57', c: '#6366f1' },
                { l: 'Meta', v: '70', c: '#9ca3af' },
                { l: 'Atingido', v: '81%', c: '#059669' },
              ].map(m => (
                <div key={m.l} className="text-center">
                  <p className="text-base font-black" style={{ color: m.c }}>{m.v}</p>
                  <p className="text-xs text-muted-foreground">{m.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Canal */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-foreground">Leads por Canal</p>
              <MessageCircle size={15} className="text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-4">Distribuição de origem</p>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={channelPie} cx="50%" cy="50%" innerRadius={42} outerRadius={65}
                  paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {channelPie.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-2">
              {channelPie.map(c => (
                <div key={c.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="text-muted-foreground">{c.name}</span>
                  <span className="font-bold text-foreground">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Produtos */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-foreground">Top Produtos</p>
              <Star size={15} className="text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-4">Conversão e receita gerada</p>
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs font-black w-4" style={{ color: p.color }}>#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct(p.conv, p.leads)}%`, background: p.color }} />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{pct(p.conv, p.leads)}%</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold shrink-0 text-emerald-600">{p.revenue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Linha 4: Atividade recente + Ações rápidas ── */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Feed de atividade */}
          <div className="md:col-span-2 bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-foreground">Atividade em Tempo Real</p>
                <p className="text-xs text-muted-foreground">Últimas interações com seus leads</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Ao vivo
              </div>
            </div>
            <div className="space-y-2">
              {recentActivity.map((a, i) => {
                const cfg = ACTIVITY_CFG[a.type as keyof typeof ACTIVITY_CFG];
                const Icon = cfg.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(ROUTES.APP_CONTACTS)}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: cfg.bg }}>
                      <Icon size={14} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{a.name}</p>
                        {a.hot && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-bold text-white"
                            style={{ background: '#ef4444', fontSize: 9 }}>
                            🔥 QUENTE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{a.msg}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
                  </div>
                );
              })}
            </div>
            <button className="w-full mt-3 text-xs text-indigo-500 hover:text-indigo-700 font-semibold py-2 flex items-center justify-center gap-1"
              onClick={() => navigate(ROUTES.APP_CONTACTS)}>
              Ver todos os contatos <ChevronRight size={13} />
            </button>
          </div>

          {/* Ações rápidas + mini-status */}
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <p className="font-bold text-foreground mb-3">Ações Rápidas</p>
              <div className="space-y-2">
                {[
                  { label: 'Novo lead',         icon: UserPlus,  route: ROUTES.APP_CONTACTS, color: '#6366f1' },
                  { label: 'Iniciar campanha',  icon: Megaphone, route: ROUTES.APP_CAMPAIGNS, color: '#E1306C' },
                  { label: 'Ver funil CRM',     icon: BarChart2, route: ROUTES.APP_CRM, color: '#059669' },
                  { label: 'Configurar bot',    icon: Bot,       route: ROUTES.APP_BOT, color: '#8b5cf6' },
                  { label: 'Fila de envio',     icon: Send,      route: ROUTES.APP_QUEUE, color: '#0ea5e9' },
                ].map(a => {
                  const Icon = a.icon;
                  return (
                    <button key={a.label} onClick={() => navigate(a.route)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left group">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${a.color}15` }}>
                        <Icon size={14} style={{ color: a.color }} />
                      </div>
                      <span className="text-sm text-foreground group-hover:text-indigo-600 font-medium flex-1">{a.label}</span>
                      <ChevronRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status de saúde */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <p className="font-bold text-foreground text-sm mb-3">Status do Sistema</p>
              {[
                { label: 'WhatsApp API',   ok: true  },
                { label: 'Bot ativo',      ok: true  },
                { label: 'Fila de envio',  ok: true  },
                { label: 'Instagram API',  ok: false },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${s.ok ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span className={`text-xs font-semibold ${s.ok ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      {s.ok ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Linha 5: KPIs financeiros ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pipeline Total',     value: 'R$ 94.700',  sub: '12 deals em aberto',    icon: BarChart2,    color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
            { label: 'Receita Fechada',    value: 'R$ 38.400',  sub: 'este mês',               icon: CheckCircle2, color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Custo por Lead',     value: 'R$ 0,80',    sub: 'vs R$1,20 mês passado', icon: Target,       color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', trend: '−33%', trendUp: true },
            { label: 'LTV Médio',          value: 'R$ 8.240',   sub: 'por cliente convertido', icon: TrendingUp,   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          ].map(k => <KpiCard key={k.label} {...k} />)}
        </div>

        {/* ── Seção Equipe (Gestor only) ── */}
        {isGestor && teamMembers.length > 0 && (
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#eef2ff' }}>
                  <Users size={16} style={{ color: '#6366f1' }} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">Performance da Equipe</h3>
                  <p className="text-xs text-muted-foreground">{teamMembers.length} membros · hoje</p>
                </div>
              </div>
              <Link to={ROUTES.APP_TEAM} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                Ver painel completo <ChevronRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {teamMembers.map(m => {
                const memberDeals = deals.filter(d => d.assignedTo === m.id && d.stage !== 'perdido');
                const closedDeals = deals.filter(d => d.assignedTo === m.id && d.stage === 'fechado');
                const memberContacts = contacts.filter(c => c.assignedTo === m.id);
                const goalPct = Math.min(100, Math.round((closedDeals.length / Math.max(1, m.monthlyGoal ?? 10)) * 100));
                const roleColors: Record<string, string> = { gestor: '#6366f1', vendedor: '#10b981', sdr: '#f59e0b' };
                const roleLabels: Record<string, string> = { gestor: 'Gestor', vendedor: 'Vendedor', sdr: 'SDR' };
                return (
                  <div key={m.id} className="rounded-xl border border-border/60 p-3.5 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: m.avatarColor ?? '#6366f1' }}>
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{m.name}</p>
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                          style={{ background: `${roleColors[m.role]}18`, color: roleColors[m.role] }}>
                          {roleLabels[m.role] ?? m.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-xs text-muted-foreground">online</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      <div className="text-center p-1.5 rounded-lg bg-muted/30">
                        <p className="text-sm font-bold text-foreground">{memberContacts.length}</p>
                        <p className="text-xs text-muted-foreground">Leads</p>
                      </div>
                      <div className="text-center p-1.5 rounded-lg bg-muted/30">
                        <p className="text-sm font-bold text-foreground">{memberDeals.length}</p>
                        <p className="text-xs text-muted-foreground">Deals</p>
                      </div>
                      <div className="text-center p-1.5 rounded-lg bg-muted/30">
                        <p className="text-sm font-bold text-emerald-600">{closedDeals.length}</p>
                        <p className="text-xs text-muted-foreground">Fechados</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">Meta mensal</span>
                        <span className="text-xs font-bold" style={{ color: goalPct >= 80 ? '#10b981' : goalPct >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {goalPct}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${goalPct}%`,
                            background: goalPct >= 80 ? '#10b981' : goalPct >= 50 ? '#f59e0b' : '#ef4444'
                          }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Team summary row */}
            <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: 'Total Leads',    value: contacts.length },
                { label: 'Deals Ativos',  value: deals.filter(d => d.stage !== 'perdido' && d.stage !== 'fechado').length },
                { label: 'Fechados',      value: deals.filter(d => d.stage === 'fechado').length },
                { label: 'Taxa Resp.',    value: `${responseRate}%` },
                { label: 'Conversão',     value: `${convRate}%` },
                { label: 'Pipeline',      value: `R$ ${(deals.filter(d => d.stage !== 'perdido').reduce((s, d) => s + (d.value ?? 0), 0) / 1000).toFixed(0)}k` },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-base font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
