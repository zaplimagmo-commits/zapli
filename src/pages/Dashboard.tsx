import { useProspectContext } from '@/hooks/ProspectContext';
import { Layout } from '@/components/Layout';
import { StatCard, PageHeader } from '@/components/UIComponents';
import { StatusBadge } from '@/components/UIComponents';
import { Link } from 'react-router-dom';
import {
  Users, TrendingUp, MessageSquare, Bell, CheckCircle2,
  Clock, AlertTriangle, ArrowRight, Building2
} from 'lucide-react';
import { ROUTE_PATHS, formatDate, formatPhone, STATUS_LABELS } from '@/lib/index';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const FUNNEL_COLORS: Record<string, string> = {
  'Aguardando': '#3b82f6',
  'Follow-up': '#d97706',
  'Respondido': '#7c3aed',
  'Convertido': '#059669',
  'Arquivado': '#9ca3af',
};

export default function Dashboard() {
  const { stats, prospects, notifications } = useProspectContext();

  const funnelData = [
    { name: 'Aguardando', value: stats.aguardando },
    { name: 'Follow-up', value: stats.followup },
    { name: 'Respondido', value: stats.respondido },
    { name: 'Convertido', value: stats.convertido },
    { name: 'Arquivado', value: stats.arquivado },
  ];

  const recentProspects = [...prospects]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const unreadNotifs = notifications.filter(n => !n.isRead).slice(0, 4);
  const urgentFollowUps = prospects.filter(p => p.status === 'followup').slice(0, 3);

  return (
    <Layout>
      <div className="px-8 py-7 max-w-7xl mx-auto">
        <PageHeader
          title="Dashboard de Prospecção"
          subtitle="Visão geral da sua estratégia de prospecção de arquitetos"
        />

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <StatCard
            label="Total Prospectados"
            value={stats.totalProspects}
            icon={<Users size={20} />}
            color="var(--primary)"
          />
          <StatCard
            label="Taxa de Resposta"
            value={`${stats.responseRate}%`}
            icon={<TrendingUp size={20} />}
            color="#7c3aed"
            sub="respondidos / enviados"
          />
          <StatCard
            label="Convertidos"
            value={stats.convertido}
            icon={<CheckCircle2 size={20} />}
            color="#059669"
            sub={`${stats.conversionRate}% de conversão`}
          />
          <StatCard
            label="Follow-ups Pendentes"
            value={stats.pendingFollowUps}
            icon={<AlertTriangle size={20} />}
            color="#d97706"
            sub="aguardando envio"
          />
        </div>

        {/* Second row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-7">
          {/* Funnel chart */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-foreground text-sm">Funil de Prospecção</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Distribuição por etapa</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnelData} barSize={36} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--foreground)',
                  }}
                  cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Contatos">
                  {funnelData.map((entry) => (
                    <Cell key={entry.name} fill={FUNNEL_COLORS[entry.name] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick stats */}
          <div className="space-y-3">
            <div className="bg-card rounded-xl border border-border p-4"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p className="text-xs font-medium text-muted-foreground mb-3">STATUS DO PIPELINE</p>
              <div className="space-y-2.5">
                {funnelData.map(item => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: FUNNEL_COLORS[item.name] }} />
                    <span className="text-sm text-foreground flex-1">{item.name}</span>
                    <span className="text-sm font-semibold text-foreground">{item.value}</span>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {stats.totalProspects > 0 ? `${Math.round((item.value / stats.totalProspects) * 100)}%` : '0%'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-4"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare size={14} className="text-primary" />
                <p className="text-xs font-medium text-foreground">Respostas Positivas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.positiveResponses}</p>
              <p className="text-xs text-muted-foreground">arquitetos interessados</p>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Follow-ups urgentes */}
          <div className="bg-card rounded-xl border border-border overflow-hidden"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-amber-500" />
                <h2 className="font-semibold text-sm text-foreground">Follow-ups Pendentes</h2>
                {urgentFollowUps.length > 0 && (
                  <span className="text-xs font-semibold text-white px-1.5 py-0.5 rounded-full"
                    style={{ background: '#d97706', fontSize: 10 }}>
                    {stats.pendingFollowUps}
                  </span>
                )}
              </div>
              <Link to={ROUTE_PATHS.PROSPECTS}
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {urgentFollowUps.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                  Nenhum follow-up pendente 🎉
                </div>
              ) : (
                urgentFollowUps.map(p => (
                  <Link key={p.id} to={`/prospeccoes/${p.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: 'var(--primary)' }}>
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.office}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-amber-600">
                        Follow-up #{p.followUpCount + 1}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatPhone(p.phone)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Notificações recentes */}
          <div className="bg-card rounded-xl border border-border overflow-hidden"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-primary" />
                <h2 className="font-semibold text-sm text-foreground">Alertas Comerciais</h2>
                {stats.unreadNotifications > 0 && (
                  <span className="text-xs font-semibold text-white px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--primary)', fontSize: 10 }}>
                    {stats.unreadNotifications}
                  </span>
                )}
              </div>
              <Link to={ROUTE_PATHS.NOTIFICATIONS}
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {unreadNotifs.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                  Sem novos alertas
                </div>
              ) : (
                unreadNotifs.map(n => (
                  <div key={n.id} className="px-5 py-3.5 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          background: n.type === 'positive_response' ? '#d1fae5' :
                            n.type === 'converted' ? '#dbeafe' : '#fef3c7'
                        }}>
                        <span style={{ fontSize: 13 }}>
                          {n.type === 'positive_response' ? '💬' : n.type === 'converted' ? '🎉' : '⏰'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{n.prospectName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                      </div>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent prospects */}
        <div className="mt-6 bg-card rounded-xl border border-border overflow-hidden"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={15} className="text-primary" />
              <h2 className="font-semibold text-sm text-foreground">Prospecções Recentes</h2>
            </div>
            <Link to={ROUTE_PATHS.PROSPECTS}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Arquiteto</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Escritório</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Cidade</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Cadastrado em</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentProspects.map(p => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: 'var(--primary)' }}>
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{p.office}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{p.city}/{p.state}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Link to={`/prospeccoes/${p.id}`}
                        className="text-xs text-primary font-medium hover:underline">
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
