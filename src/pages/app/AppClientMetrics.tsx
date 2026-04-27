import { useMemo } from 'react';
import { useProspect } from '@/hooks/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { DollarSign, TrendingUp, Users, Package, Star, Award, AlertTriangle, Heart, Zap } from 'lucide-react';

const fc = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });

function healthColor(s: number) {
  if (s >= 80) return '#10b981'; if (s >= 60) return '#f59e0b';
  if (s >= 40) return '#f97316'; return '#ef4444';
}

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6', '#ef4444'];

export default function AppClientMetrics() {
  const { clients } = useProspect();

  const metrics = useMemo(() => {
    const totalLtv = clients.reduce((s, c) => s + c.ltv, 0);
    const totalMrr = clients.reduce((s, c) => s + (c.mrr ?? 0), 0);
    const ativos = clients.filter(c => c.status === 'ativo').length;
    const emRisco = clients.filter(c => c.status === 'em_risco').length;
    const churned = clients.filter(c => c.status === 'churned').length;
    const avgHealth = clients.length ? Math.round(clients.reduce((s, c) => s + c.healthScore, 0) / clients.length) : 0;
    const avgLtv = clients.length ? Math.round(totalLtv / clients.length) : 0;
    const fromProspecting = clients.filter(c => c.fromProspecting).length;
    const totalProposals = clients.reduce((s, c) => s + c.proposals.length, 0);
    const approvedProposals = clients.reduce((s, c) => s + c.proposals.filter(p => p.status === 'aprovada').length, 0);
    const proposalConversion = totalProposals > 0 ? Math.round((approvedProposals / totalProposals) * 100) : 0;

    // Receita por segmento
    const bySegment: Record<string, number> = {};
    clients.forEach(c => { bySegment[c.segment] = (bySegment[c.segment] ?? 0) + c.ltv; });
    const segmentData = Object.entries(bySegment).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

    // Receita por produto
    const byProduct: Record<string, number> = {};
    clients.forEach(c => c.products.forEach(p => { byProduct[p.productName] = (byProduct[p.productName] ?? 0) + p.totalValue; }));
    const productData = Object.entries(byProduct).map(([name, value]) => ({ name: name.length > 22 ? name.slice(0, 22) + '…' : name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

    // Status breakdown para pie chart
    const statusData = [
      { name: 'Ativos', value: ativos, color: '#10b981' },
      { name: 'Em Risco', value: emRisco, color: '#f59e0b' },
      { name: 'Inativos', value: clients.filter(c => c.status === 'inativo').length, color: '#6b7280' },
      { name: 'Churned', value: churned, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // Top clientes por LTV
    const topClients = [...clients].sort((a, b) => b.ltv - a.ltv).slice(0, 5);

    // Simulação de evolução MRR (últimos 6 meses)
    const months = ['Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr'];
    const mrrEvolution = months.map((month, i) => ({
      month,
      mrr: Math.round(totalMrr * (0.5 + i * 0.1)),
      ltv: Math.round(totalLtv * (0.3 + i * 0.15)),
    }));

    return { totalLtv, totalMrr, ativos, emRisco, churned, avgHealth, avgLtv, fromProspecting, proposalConversion, approvedProposals, totalProposals, segmentData, productData, statusData, topClients, mrrEvolution };
  }, [clients]);

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-7xl mx-auto">
        <PageHeader
          title="Métricas de Clientes"
          subtitle="Inteligência comercial em tempo real — receita, retenção, LTV e muito mais"
        />

        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'LTV Médio',          value: fc(metrics.avgLtv),               icon: DollarSign,  color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'MRR Total',           value: fc(metrics.totalMrr),             icon: TrendingUp,  color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
            { label: 'Taxa conv. propostas', value: `${metrics.proposalConversion}%`, icon: Star,        color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
            { label: 'Health Score Médio',   value: `${metrics.avgHealth}%`,          icon: Heart,       color: healthColor(metrics.avgHealth), bg: '#fff7ed', border: '#fed7aa' },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className="rounded-xl border p-4 flex items-center gap-3" style={{ background: bg, borderColor: border }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color }}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Alertas */}
        {metrics.emRisco > 0 && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl border mb-6" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
            <AlertTriangle size={15} style={{ color: '#d97706', flexShrink: 0 }} />
            <p className="text-sm text-amber-800">
              <strong>{metrics.emRisco} cliente{metrics.emRisco > 1 ? 's' : ''} em risco</strong> de churn. Ação necessária — agende uma reunião de retenção.
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Evolução MRR */}
          <div className="md:col-span-2 bg-card rounded-xl border border-border p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><TrendingUp size={14} className="text-primary" /> Evolução MRR — últimos 6 meses</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={metrics.mrrEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fc(v)} />
                <Legend />
                <Line type="monotone" dataKey="mrr" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} name="MRR" />
                <Line type="monotone" dataKey="ltv" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="LTV Acum." />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Pie */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Users size={14} className="text-primary" /> Status da Carteira</h3>
            {metrics.statusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={metrics.statusData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value">
                      {metrics.statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {metrics.statusData.map(s => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />{s.name}</span>
                      <span className="font-bold" style={{ color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Receita por segmento */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Award size={14} className="text-primary" /> LTV por Segmento</h3>
            {metrics.segmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={metrics.segmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip formatter={(v: number) => fc(v)} />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} name="LTV" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados de segmento</p>}
          </div>

          {/* Receita por produto */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Package size={14} className="text-primary" /> Receita por Produto</h3>
            {metrics.productData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={metrics.productData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => fc(v)} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Receita">
                    {metrics.productData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Nenhum produto registrado</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Top clientes */}
          <div className="md:col-span-2 bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2"><Award size={14} className="text-amber-500" /> Top Clientes por LTV</h3>
            </div>
            <div className="divide-y divide-border">
              {metrics.topClients.map((c, i) => (
                <div key={c.id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7c2f' : '#e5e7eb', color: i > 2 ? '#6b7280' : 'white' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{c.companyName}</p>
                    <p className="text-xs text-muted-foreground">{c.segment} · Health: <span style={{ color: healthColor(c.healthScore) }}>{c.healthScore}%</span></p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-600">{fc(c.ltv)}</p>
                    {c.mrr ? <p className="text-xs text-sky-600">{fc(c.mrr)}/mês</p> : null}
                  </div>
                </div>
              ))}
              {metrics.topClients.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">Nenhum cliente com LTV registrado ainda</div>
              )}
            </div>
          </div>

          {/* Funil de conversão */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Zap size={14} className="text-emerald-600" /> Funil Zapli → Cliente</h3>
            <div className="space-y-2">
              {[
                { label: 'Prospecções iniciadas', value: clients.length + 6, color: '#6366f1', pct: 100 },
                { label: 'Responderam', value: clients.length + 3, color: '#0ea5e9', pct: 82 },
                { label: 'Convertidos (CRM)', value: clients.filter(c => c.fromProspecting).length + 2, color: '#f59e0b', pct: 55 },
                { label: 'Clientes ativos', value: metrics.ativos, color: '#10b981', pct: 38 },
              ].map(({ label, value, color, pct }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-bold" style={{ color }}>{value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Via Zapli</span>
                <span className="font-bold text-foreground">{metrics.fromProspecting} clientes</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Propostas aprovadas</span>
                <span className="font-bold text-foreground">{metrics.approvedProposals}/{metrics.totalProposals} ({metrics.proposalConversion}%)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">LTV total da carteira</span>
                <span className="font-bold text-emerald-600">{fc(metrics.totalLtv)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
