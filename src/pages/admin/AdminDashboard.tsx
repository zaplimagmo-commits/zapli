import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader, StatCard, PlanBadge } from '@/components/UIComponents';
import { ROUTES, formatDate, formatCurrency, SUB_STATUS, PLANS } from '@/lib/index';
import { Users, DollarSign, UserX, Clock, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { db } from '@/lib/supabase';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data } = await db
          .from('users')
          .select('*, tenants(*)')
          .eq('system_role', 'user')
          .order('created_at', { ascending: false });
        if (data) setUsers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.tenants?.plan_status === 'active').length;
    const trial = users.filter(u => u.tenants?.plan_status !== 'active').length;
    
    let mrr = 0;
    const planDist = { starter: 0, pro: 0, business: 0 };
    
    users.forEach(u => {
      const pId = (u.tenants?.plan || 'starter') as 'starter' | 'pro' | 'business';
      if (u.tenants?.plan_status === 'active') {
        mrr += PLANS[pId]?.price || 0;
      }
      if (planDist[pId] !== undefined) planDist[pId]++;
    });

    return { total, active, trial, mrr, planDist };
  }, [users]);

  // Dados simulados para os gráficos baseados nos usuários reais (distribuídos por mês de criação)
  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    return months.map((m, i) => ({
      month: m,
      users: users.filter(u => new Date(u.created_at).getMonth() === (new Date().getMonth() - (5 - i) + 12) % 12).length,
      revenue: stats.mrr * (0.5 + (i * 0.1)) // Simulação de crescimento proporcional ao MRR atual
    }));
  }, [users, stats.mrr]);

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-7xl mx-auto">
        <PageHeader title="Painel Administrativo" subtitle="Visão geral real do SaaS Zapli" />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <StatCard label="MRR Real" value={formatCurrency(stats.mrr)} icon={<DollarSign size={20} />} color="var(--emerald)" sub="Baseado em planos ativos" />
          <StatCard label="Total de Clientes" value={stats.total} icon={<Users size={20} />} color="var(--primary)" sub={`${stats.active} ativos`} />
          <StatCard label="Churn Rate" value="0%" icon={<UserX size={20} />} color="#ef4444" sub="últimos 30 dias" />
          <StatCard label="Trials Ativos" value={stats.trial} icon={<Clock size={20} />} color="#d97706" sub="aguardando conversão" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h3 className="font-semibold text-sm text-foreground mb-4">Crescimento de Receita (Estimado)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [formatCurrency(v), 'MRR']} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h3 className="font-semibold text-sm text-foreground mb-4">Novos Clientes/Mês</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="users" radius={[4, 4, 0, 0]} fill="var(--primary)" name="Novos clientes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan distribution + recent users */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h3 className="font-semibold text-sm text-foreground mb-4">Distribuição por Plano</h3>
            <div className="space-y-3">
              {[{ label: 'Starter', key: 'starter', color: '#6366f1' }, { label: 'Pro', key: 'pro', color: '#10b981' }, { label: 'Business', key: 'business', color: '#f59e0b' }].map(p => {
                const count = stats.planDist[p.key as keyof typeof stats.planDist] || 0;
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={p.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground">{p.label}</span>
                      <span className="text-xs text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">Clientes Recentes</h3>
              <Link to={ROUTES.ADMIN_USERS} className="text-xs text-primary font-medium hover:underline">Ver todos →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {['Cliente', 'Plano', 'Status', 'Cadastro'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.slice(0, 5).map(u => {
                    const planId = u.tenants?.plan || 'starter';
                    const status = u.tenants?.plan_status === 'active' ? 'active' : 'trial';
                    const sub = SUB_STATUS[status] || SUB_STATUS.trial;
                    return (
                      <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'var(--primary)' }}>
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.tenants?.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><PlanBadge planId={planId} /></td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full border" style={{ background: `${sub.color}15`, color: sub.color, borderColor: `${sub.color}30` }}>
                            {sub.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(new Date(u.created_at))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
