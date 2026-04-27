import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader, StatCard, PlanBadge } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { mockUsers, adminStats } from '@/data/index';
import { ROUTES, formatDate, formatCurrency, SUB_STATUS } from '@/lib/index';
import { TrendingUp, Users, DollarSign, UserX, BarChart3, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AdminDashboard() {
  const users = mockUsers.filter(u => u.role === 'user');

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-7xl mx-auto">
        <PageHeader title="Painel Administrativo" subtitle="Visão geral do SaaS Zapli" />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <StatCard label="MRR" value={formatCurrency(adminStats.mrr)} icon={<DollarSign size={20} />} color="var(--emerald)" sub={`+${adminStats.mrrGrowth}% vs mês anterior`} />
          <StatCard label="Total de Clientes" value={adminStats.totalUsers} icon={<Users size={20} />} color="var(--primary)" sub={`${adminStats.activeUsers} ativos`} />
          <StatCard label="Churn Rate" value={`${adminStats.churnRate}%`} icon={<UserX size={20} />} color="#ef4444" sub="últimos 30 dias" />
          <StatCard label="Trials Ativos" value={adminStats.trialUsers} icon={<Clock size={20} />} color="#d97706" sub="aguardando conversão" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h3 className="font-semibold text-sm text-foreground mb-4">Receita Mensal (MRR)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={adminStats.revenueByMonth} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
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
              <BarChart data={adminStats.newUsersByMonth} barSize={28} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
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
                const count = adminStats.planDistribution[p.key as keyof typeof adminStats.planDistribution];
                const pct = Math.round((count / adminStats.totalUsers) * 100);
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
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">MRR Breakdown</p>
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Starter ({adminStats.planDistribution.starter}×R$97)</span>
                  <span className="font-medium text-foreground">{formatCurrency(adminStats.planDistribution.starter * 97)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Pro ({adminStats.planDistribution.pro}×R$197)</span>
                  <span className="font-medium text-foreground">{formatCurrency(adminStats.planDistribution.pro * 197)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Business ({adminStats.planDistribution.business}×R$397)</span>
                  <span className="font-medium text-foreground">{formatCurrency(adminStats.planDistribution.business * 397)}</span>
                </div>
              </div>
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
                    const sub = SUB_STATUS[u.subscriptionStatus];
                    return (
                      <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'var(--primary)' }}>
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.companyName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><PlanBadge planId={u.planId} /></td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full border" style={{ background: `${sub.color}15`, color: sub.color, borderColor: `${sub.color}30` }}>
                            {sub.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
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
