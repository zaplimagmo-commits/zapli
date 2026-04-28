import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useProspect } from '@/hooks/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { ROUTES } from '@/lib/index';
import { useRole } from '@/hooks/useRole';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Zap, 
  Flame, Send, UserPlus, Reply, Award, Bot, Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── helpers ────────────────────────────────────────────────
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

const ACTIVITY_CFG = {
  reply:    { icon: Reply,     color: '#f59e0b', bg: '#fffbeb', label: 'Resposta' },
  new:      { icon: UserPlus,  color: '#6366f1', bg: '#eef2ff', label: 'Novo lead' },
  convert:  { icon: Award,     color: '#059669', bg: '#f0fdf4', label: 'Convertido' },
  bot:      { icon: Bot,       color: '#8b5cf6', bg: '#f5f3ff', label: 'Bot' },
  campaign: { icon: Megaphone, color: '#0ea5e9', bg: '#f0f9ff', label: 'Campanha' },
};

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

export default function AppDashboard() {
  const { user } = useAuth();
  const { contacts, activityLog, deals } = useProspect();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  const totalLeads = contacts.length;
  const responded = contacts.filter(c => c.status === 'respondido' || c.isPositiveResponse).length;
  const converted = contacts.filter(c => c.status === 'convertido').length;
  const responseRate = pct(responded + converted, totalLeads);
  const totalRevenue = deals.filter(d => d.stage === 'fechado').reduce((acc, d) => acc + (d.value || 0), 0);

  // Dados reais para o gráfico de área (últimos 7 dias)
  const areaData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        dayName: days[d.getDay()],
        leads: 0,
        responderam: 0,
        convertidos: 0
      };
    });

    contacts.forEach(c => {
      const cDate = new Date(c.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const dayIdx = last7Days.findIndex(d => d.date === cDate);
      if (dayIdx !== -1) {
        last7Days[dayIdx].leads++;
        if (c.status === 'respondido' || c.isPositiveResponse) last7Days[dayIdx].responderam++;
        if (c.status === 'convertido') last7Days[dayIdx].convertidos++;
      }
    });

    return last7Days;
  }, [contacts]);

  // Metas diárias reais
  const dailySent = useMemo(() => {
    const today = new Date().toLocaleDateString('pt-BR');
    return activityLog.filter(a => 
      a.type === 'message_sent' && 
      new Date(a.createdAt).toLocaleDateString('pt-BR') === today
    ).length;
  }, [activityLog]);

  const dailyGoal = 50;
  const dailyPct = pct(dailySent, dailyGoal);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-[1300px] mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">👋</span>
              <h1 className="text-2xl font-black text-foreground">{saudacao}, {user?.name.split(' ')[0]}!</h1>
            </div>
            <p className="text-sm text-muted-foreground">Resumo real da sua operação — <strong className="text-foreground">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></p>
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

        {/* ── Metas diárias ── */}
        <div className="rounded-2xl border p-4 flex items-center gap-4 flex-wrap"
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderColor: '#4338ca' }}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Flame size={18} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Meta do dia: {dailySent}/{dailyGoal} mensagens enviadas</p>
              <p className="text-xs text-indigo-300 mt-0.5">
                {dailySent >= dailyGoal ? 'Parabéns! Meta batida!' : `Faltam ${dailyGoal - dailySent} mensagens para a meta de hoje.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="flex-1 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(dailyPct, 100)}%`, background: dailyPct >= 100 ? '#10b981' : '#f59e0b' }} />
            </div>
            <span className="text-xs font-bold text-white">{dailyPct}%</span>
          </div>
          <Button size="sm" className="text-xs gap-1.5 shrink-0" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
            onClick={() => navigate(ROUTES.APP_QUEUE)}>
            <Send size={12} /> Ir para fila
          </Button>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total de Leads" value={fmt(totalLeads)} sub="na sua base"
            icon={Users} color="#6366f1" bg="#eef2ff" border="#c7d2fe" />
          <KpiCard label="Taxa de Resposta" value={`${responseRate}%`} sub="leads que interagiram"
            icon={Reply} color="#f59e0b" bg="#fffbeb" border="#fde68a" />
          <KpiCard label="Convertidos" value={fmt(converted)} sub="clientes fechados"
            icon={Award} color="#059669" bg="#f0fdf4" border="#bbf7d0" />
          <KpiCard label="Receita Total" value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })} sub="vendas confirmadas"
            icon={Zap} color="#8b5cf6" bg="#f5f3ff" border="#ddd6fe" />
        </div>

        {/* ── Gráficos e Atividade ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-foreground">Desempenho de Prospecção</h3>
                  <p className="text-xs text-muted-foreground">Volume de leads e conversões nos últimos 7 dias</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="leads" name="Novos Leads" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                    <Area type="monotone" dataKey="responderam" name="Respostas" stroke="#f59e0b" strokeWidth={3} fill="transparent" />
                    <Area type="monotone" dataKey="convertidos" name="Conversões" stroke="#10b981" strokeWidth={3} fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold text-foreground mb-4">Atividade Recente</h3>
              <div className="space-y-4">
                {activityLog.slice(0, 6).map((act, i) => {
                  const cfg = ACTIVITY_CFG[act.type as keyof typeof ACTIVITY_CFG] || ACTIVITY_CFG.new;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                        <cfg.icon size={14} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{act.memberName || 'Sistema'}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{act.description}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(act.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                {activityLog.length === 0 && (
                  <p className="text-xs text-center text-muted-foreground py-8">Nenhuma atividade registrada ainda.</p>
                )}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                Ver todo o histórico
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
