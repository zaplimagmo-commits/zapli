import { useState } from 'react';
import { useAuth, useProspect } from '@/hooks/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { useConfirm } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { TeamMember, TeamRole, ActivityLog, ActivityType } from '@/lib/index';
import {
  Users, Plus, Crown, UserCheck, Headphones, Activity, BarChart2,
  TrendingUp, Target, Send, MessageCircle, Award, Clock,
  CheckCircle2, Trash2, Edit2, Mail, Phone as PhoneIcon, Wifi, WifiOff,
  ArrowRight, Shield, Eye, ChevronRight, RefreshCw, AlertCircle
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────
const ROLE_CFG: Record<TeamRole, { label: string; icon: React.ReactNode; color: string; bg: string; border: string; desc: string }> = {
  gestor:   { label: 'Gestor',   icon: <Crown size={13} />,     color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', desc: 'Acesso total — gerencia equipe, vê todos os leads e métricas' },
  vendedor: { label: 'Vendedor', icon: <UserCheck size={13} />, color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', desc: 'Gerencia seus leads atribuídos + todos os leads da equipe' },
  sdr:      { label: 'SDR',      icon: <Headphones size={13} />,color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', desc: 'Prospecção ativa — cadastra leads, dispara mensagens, qualifica' },
};

const ACTIVITY_CFG: Record<ActivityType, { label: string; color: string; emoji: string }> = {
  message_sent:     { label: 'Mensagem enviada',     color: '#6366f1', emoji: '📤' },
  followup_sent:    { label: 'Follow-up enviado',    color: '#f59e0b', emoji: '🔄' },
  message_received: { label: 'Lead respondeu',       color: '#0ea5e9', emoji: '💬' },
  status_changed:   { label: 'Status alterado',      color: '#8b5cf6', emoji: '🔀' },
  deal_created:     { label: 'Deal criado',          color: '#059669', emoji: '🎯' },
  deal_moved:       { label: 'Deal movido',          color: '#0ea5e9', emoji: '➡️' },
  deal_won:         { label: 'Deal fechado!',        color: '#059669', emoji: '🏆' },
  deal_lost:        { label: 'Deal perdido',         color: '#ef4444', emoji: '❌' },
  contact_added:    { label: 'Lead cadastrado',      color: '#6366f1', emoji: '➕' },
  contact_assigned: { label: 'Lead atribuído',       color: '#8b5cf6', emoji: '👤' },
  note_added:       { label: 'Nota adicionada',      color: '#6b7280', emoji: '📝' },
};

function timeAgo(d: Date) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
}

// Mock performance por membro (em prod viria de queries aggregadas)
const MOCK_PERF: Record<string, { sent: number; replied: number; converted: number; deals: number; revenue: number; dailyAvg: number }> = {
  'u1':        { sent: 124, replied: 42, converted: 12, deals: 4,  revenue: 94700, dailyAvg: 18 },
  'u_joao':    { sent: 89,  replied: 31, converted: 8,  deals: 6,  revenue: 67200, dailyAvg: 14 },
  'u_mariana': { sent: 167, replied: 48, converted: 5,  deals: 2,  revenue: 21000, dailyAvg: 23 },
  'u_rafael':  { sent: 72,  replied: 19, converted: 4,  deals: 3,  revenue: 38400, dailyAvg: 11 },
};

const COLORS = ['#6366f1','#10b981','#f59e0b','#0ea5e9','#8b5cf6','#ef4444','#E1306C','#059669'];

export default function AppTeam() {
  const { user } = useAuth();
  const { teamMembers, activityLog, addTeamMember, updateTeamMember, removeTeamMember, contacts, deals } = useProspect();
  const { confirm, ConfirmNode } = useConfirm();

  async function handleRemoveMember(id: string, name: string) {
    const ok = await confirm({
      title: 'Remover membro',
      message: `Tem certeza que deseja remover "${name}" da equipe? O acesso será revogado imediatamente.`,
      confirmLabel: 'Sim, remover',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (ok) removeTeamMember(id);
  }

  const [tab, setTab] = useState<'visao' | 'membros' | 'atividade' | 'relatorio'>('visao');
  const [showAdd, setShowAdd] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'vendedor' as TeamRole, dailyGoal: '50', monthlyGoal: '8', avatarColor: '#10b981' });
  const [activityFilter, setActivityFilter] = useState<string>('all');

  const isGestor = user?.tenantRole === 'gestor' || user?.role === 'admin';

  function saveForm() {
    if (!form.name || !form.email) return;
    if (editMember) {
      updateTeamMember(editMember.id, { name: form.name, email: form.email, phone: form.phone, role: form.role, dailyGoal: Number(form.dailyGoal), monthlyGoal: Number(form.monthlyGoal), avatarColor: form.avatarColor });
    } else {
      addTeamMember({ tenantId: user?.tenantId ?? 'tenant1', name: form.name, email: form.email, phone: form.phone, role: form.role, avatarColor: form.avatarColor, isActive: true, dailyGoal: Number(form.dailyGoal), monthlyGoal: Number(form.monthlyGoal) });
    }
    setShowAdd(false);
    setEditMember(null);
    setForm({ name: '', email: '', phone: '', role: 'vendedor', dailyGoal: '50', monthlyGoal: '8', avatarColor: '#10b981' });
  }

  function startEdit(m: TeamMember) {
    setEditMember(m);
    setForm({ name: m.name, email: m.email, phone: m.phone ?? '', role: m.role, dailyGoal: String(m.dailyGoal ?? 50), monthlyGoal: String(m.monthlyGoal ?? 8), avatarColor: m.avatarColor });
    setShowAdd(true);
  }

  const filteredLog = activityFilter === 'all' ? activityLog : activityLog.filter(a => a.memberId === activityFilter);

  // KPIs da equipe
  const totalPerf = Object.values(MOCK_PERF).reduce((acc, p) => ({ sent: acc.sent + p.sent, replied: acc.replied + p.replied, converted: acc.converted + p.converted, revenue: acc.revenue + p.revenue }), { sent: 0, replied: 0, converted: 0, revenue: 0 });

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-6xl mx-auto">
        <PageHeader
          title="Equipe Comercial"
          subtitle={`${teamMembers.filter(m => m.isActive).length} membros ativos — ${user?.companyName}`}
          action={isGestor && (
            <Button onClick={() => setShowAdd(true)} className="gap-2 text-sm text-white" style={{ background: 'var(--emerald)' }}>
              <Plus size={15} /> Convidar Membro
            </Button>
          )}
        />

        {/* Papel do usuário logado */}
        {user?.tenantRole && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl border mb-5"
            style={{ background: ROLE_CFG[user.tenantRole].bg, borderColor: ROLE_CFG[user.tenantRole].border }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${ROLE_CFG[user.tenantRole].color}20` }}>
              <Shield size={16} style={{ color: ROLE_CFG[user.tenantRole].color }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: ROLE_CFG[user.tenantRole].color }}>
                Você é {ROLE_CFG[user.tenantRole].label} nesta empresa
              </p>
              <p className="text-xs text-muted-foreground">{ROLE_CFG[user.tenantRole].desc}</p>
            </div>
          </div>
        )}

        {/* KPIs consolidados */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Mensagens enviadas', v: totalPerf.sent,                      icon: Send,        color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
            { label: 'Leads responderam',  v: totalPerf.replied,                   icon: MessageCircle,color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
            { label: 'Conversões equipe',  v: totalPerf.converted,                 icon: Target,      color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Receita pipeline',   v: `R$${(totalPerf.revenue/1000).toFixed(0)}k`, icon: TrendingUp, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          ].map(({ label, v, icon: Icon, color, bg, border }) => (
            <div key={label} className="rounded-xl border p-3.5 flex items-center gap-3" style={{ background: bg, borderColor: border }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-lg font-black" style={{ color }}>{v}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-muted/30 p-1 rounded-xl w-fit">
          {([['visao','Visão Geral'], ['membros','Membros'], ['atividade','Atividade'], ['relatorio','Relatório']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: tab === v ? 'white' : 'transparent', color: tab === v ? 'var(--foreground)' : 'var(--muted-foreground)', boxShadow: tab === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
              {l}
            </button>
          ))}
        </div>

        {/* ── TAB: VISÃO GERAL — ranking de performance ── */}
        {tab === 'visao' && (
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Performance Individual — Este Mês</p>
            {teamMembers.filter(m => m.isActive).map((m, idx) => {
              const perf = MOCK_PERF[m.id] ?? { sent: 0, replied: 0, converted: 0, deals: 0, revenue: 0, dailyAvg: 0 };
              const roleC = ROLE_CFG[m.role];
              const respRate = perf.sent > 0 ? Math.round((perf.replied / perf.sent) * 100) : 0;
              const convRate = perf.replied > 0 ? Math.round((perf.converted / perf.replied) * 100) : 0;
              const dailyPct = m.dailyGoal ? Math.min(Math.round((perf.dailyAvg / m.dailyGoal) * 100), 100) : 0;
              const myLeads = contacts.filter(c => c.assignedTo === m.id).length;
              const myDeals = deals.filter(d => d.assignedTo === m.id).length;
              return (
                <div key={m.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-4 flex-wrap">
                    {/* Avatar + info */}
                    <div className="flex items-center gap-3 min-w-[180px]">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                          style={{ background: m.avatarColor }}>
                          {m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        {idx === 0 && <span className="absolute -top-1.5 -right-1.5 text-xs">👑</span>}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{m.name}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: roleC.bg, color: roleC.color }}>
                          {roleC.icon} {roleC.label}
                        </span>
                      </div>
                    </div>

                    {/* Métricas */}
                    <div className="flex items-center gap-5 flex-1 flex-wrap">
                      {[
                        { l: 'Enviados', v: perf.sent, c: '#6366f1' },
                        { l: 'Respostas', v: `${perf.replied} (${respRate}%)`, c: '#0ea5e9' },
                        { l: 'Convertidos', v: `${perf.converted} (${convRate}%)`, c: '#059669' },
                        { l: 'Leads atrib.', v: myLeads, c: '#8b5cf6' },
                        { l: 'Deals ativos', v: myDeals, c: '#d97706' },
                        { l: 'Receita', v: `R$${(perf.revenue/1000).toFixed(0)}k`, c: '#059669' },
                      ].map(item => (
                        <div key={item.l} className="text-center">
                          <p className="text-sm font-black" style={{ color: item.c }}>{item.v}</p>
                          <p className="text-xs text-muted-foreground">{item.l}</p>
                        </div>
                      ))}
                    </div>

                    {/* Meta diária */}
                    {m.dailyGoal && (
                      <div className="min-w-[130px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Meta diária</span>
                          <span className="font-bold" style={{ color: dailyPct >= 80 ? '#059669' : '#d97706' }}>{dailyPct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${dailyPct}%`, background: dailyPct >= 80 ? '#10b981' : '#f59e0b' }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{perf.dailyAvg}/{m.dailyGoal} envios/dia</p>
                      </div>
                    )}

                    {isGestor && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => startEdit(m)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Edit2 size={13} /></button>
                        <button onClick={() => handleRemoveMember(m.id, m.name)} className="p-2 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Acesso demo */}
            <div className="p-4 rounded-xl border bg-muted/20 border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">🔑 Credenciais de demonstração da equipe (senha: <code>demo123</code>)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { email: 'pro@demo.com', name: 'Ana (Gestora)' },
                  { email: 'joao@construtorabc.com', name: 'João (Vendedor)' },
                  { email: 'mariana@construtorabc.com', name: 'Mariana (SDR)' },
                  { email: 'rafael@construtorabc.com', name: 'Rafael (Vendedor)' },
                ].map(u => (
                  <div key={u.email} className="text-xs bg-card rounded-lg p-2 border border-border">
                    <p className="font-semibold text-foreground">{u.name}</p>
                    <p className="text-muted-foreground font-mono">{u.email}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: MEMBROS — cards detalhados ── */}
        {tab === 'membros' && (
          <div className="grid md:grid-cols-2 gap-4">
            {teamMembers.map(m => {
              const roleC = ROLE_CFG[m.role];
              const lastSeen = m.lastLoginAt ? timeAgo(m.lastLoginAt) : 'Nunca';
              const isOnline = m.lastLoginAt && (Date.now() - new Date(m.lastLoginAt).getTime()) < 3600000;
              const myLeads = contacts.filter(c => c.assignedTo === m.id).length;
              const myDeals = deals.filter(d => d.assignedTo === m.id).length;
              return (
                <div key={m.id} className={`bg-card rounded-2xl border p-5 ${m.isActive ? 'border-border' : 'border-dashed border-muted opacity-60'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black text-white"
                          style={{ background: m.avatarColor }}>
                          {m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-card ${isOnline ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{m.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1"
                            style={{ background: roleC.bg, color: roleC.color }}>
                            {roleC.icon} {roleC.label}
                          </span>
                          {!m.isActive && <span className="text-xs text-muted-foreground">(inativo)</span>}
                        </div>
                      </div>
                    </div>
                    {isGestor && (
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(m)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><Edit2 size={13} /></button>
                        {m.role !== 'gestor' && <button onClick={() => handleRemoveMember(m.id, m.name)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500"><Trash2 size={13} /></button>}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail size={10} /> <span>{m.email}</span>
                    </div>
                    {m.phone && <div className="flex items-center gap-2 text-xs text-muted-foreground"><PhoneIcon size={10} /> <span>{m.phone}</span></div>}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock size={10} /> Último acesso: <span className={isOnline ? 'text-emerald-600 font-semibold' : ''}>{isOnline ? '🟢 Online agora' : lastSeen}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-t border-border">
                    {[
                      { l: 'Leads atrib.', v: myLeads, c: '#6366f1' },
                      { l: 'Deals ativos', v: myDeals, c: '#d97706' },
                      { l: 'Meta diária', v: `${m.dailyGoal ?? '—'}/dia`, c: '#0ea5e9' },
                    ].map(item => (
                      <div key={item.l} className="text-center">
                        <p className="text-base font-black" style={{ color: item.c }}>{item.v}</p>
                        <p className="text-xs text-muted-foreground">{item.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB: RELATÓRIO DE DESEMPENHO ── */}
        {tab === 'relatorio' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Relatório de Desempenho — Este Mês</p>
              <span className="text-xs text-muted-foreground">Atualizado em tempo real</span>
            </div>

            {/* Cards por membro */}
            {teamMembers.map(m => {
              const memberContacts = contacts.filter(c => c.assignedTo === m.id || c.userId === m.id);
              const responded = memberContacts.filter(c => ['respondido','convertido'].includes(c.status)).length;
              const converted = memberContacts.filter(c => c.status === 'convertido').length;
              const memberDeals = deals.filter(d => d.assignedTo === m.id);
              const closedDeals = memberDeals.filter(d => d.stage === 'fechado');
              const activeDeals = memberDeals.filter(d => !['fechado','perdido'].includes(d.stage));
              const closedValue = closedDeals.reduce((s, d) => s + (d.value ?? 0), 0);
              const pipelineValue = activeDeals.reduce((s, d) => s + (d.value ?? 0), 0);
              const respRate = memberContacts.length > 0 ? Math.round((responded / memberContacts.length) * 100) : 0;
              const convRate = memberContacts.length > 0 ? Math.round((converted / memberContacts.length) * 100) : 0;
              const monthGoalPct = Math.min(100, Math.round((closedDeals.length / Math.max(1, m.monthlyGoal ?? 10)) * 100));
              const memberActivity = activityLog.filter(a => a.memberId === m.id);
              const rc = ROLE_CFG[m.role];
              return (
                <div key={m.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                  {/* Header membro */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ background: m.avatarColor ?? '#6366f1' }}>
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground">{m.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: rc.bg, color: rc.color }}>{rc.label}</span>
                        <span className="text-xs text-muted-foreground">{m.email}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-foreground">{monthGoalPct}%</p>
                      <p className="text-xs text-muted-foreground">meta mensal</p>
                    </div>
                  </div>

                  {/* KPIs grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: 'Leads Atribuídos', value: memberContacts.length, icon: '👤', color: '#6366f1', bg: '#eef2ff' },
                      { label: 'Taxa de Resposta', value: `${respRate}%`, icon: '💬', color: respRate >= 60 ? '#059669' : respRate >= 30 ? '#d97706' : '#ef4444', bg: '#f0fdf4' },
                      { label: 'Conversões', value: converted, icon: '🎯', color: '#059669', bg: '#f0fdf4' },
                      { label: 'Taxa de Conversão', value: `${convRate}%`, icon: '📈', color: convRate >= 20 ? '#059669' : convRate >= 10 ? '#d97706' : '#ef4444', bg: '#fff' },
                    ].map(k => (
                      <div key={k.label} className="rounded-xl p-3.5 border border-border" style={{ background: k.bg }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span>{k.icon}</span>
                          <span className="text-xs text-muted-foreground">{k.label}</span>
                        </div>
                        <p className="text-xl font-black" style={{ color: k.color }}>{k.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* CRM + Financeiro */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: 'Deals Ativos', value: activeDeals.length, icon: '🔥' },
                      { label: 'Deals Fechados', value: closedDeals.length, icon: '✅' },
                      { label: 'Pipeline', value: `R$${(pipelineValue/1000).toFixed(0)}k`, icon: '💼' },
                      { label: 'Receita Fechada', value: `R$${(closedValue/1000).toFixed(0)}k`, icon: '💰' },
                    ].map(k => (
                      <div key={k.label} className="rounded-xl p-3.5 border border-border bg-muted/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span>{k.icon}</span>
                          <span className="text-xs text-muted-foreground">{k.label}</span>
                        </div>
                        <p className="text-lg font-black text-foreground">{k.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Barra de meta + atividades */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Meta mensal ({closedDeals.length}/{m.monthlyGoal ?? 10} fechamentos)</span>
                        <span className="text-xs font-black" style={{ color: monthGoalPct >= 80 ? '#10b981' : monthGoalPct >= 50 ? '#f59e0b' : '#ef4444' }}>{monthGoalPct}%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${monthGoalPct}%`, background: monthGoalPct >= 80 ? '#10b981' : monthGoalPct >= 50 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg px-3 py-2 bg-muted/40 flex-1 text-center">
                        <p className="text-base font-black text-foreground">{memberActivity.length}</p>
                        <p className="text-xs text-muted-foreground">Ações registradas</p>
                      </div>
                      <div className="rounded-lg px-3 py-2 bg-muted/40 flex-1 text-center">
                        <p className="text-base font-black text-foreground">{memberActivity.filter(a => a.type === 'message_sent').length}</p>
                        <p className="text-xs text-muted-foreground">Msgs enviadas</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Ranking consolidado */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <p className="text-sm font-bold text-foreground mb-4">🏆 Ranking da Equipe — Conversões</p>
              <div className="space-y-3">
                {[...teamMembers]
                  .map(m => ({
                    ...m,
                    converted: contacts.filter(c => (c.assignedTo === m.id || c.userId === m.id) && c.status === 'convertido').length,
                    closed: deals.filter(d => d.assignedTo === m.id && d.stage === 'fechado').length,
                  }))
                  .sort((a, b) => (b.closed + b.converted) - (a.closed + a.converted))
                  .map((m, idx) => {
                    const rc = ROLE_CFG[m.role];
                    const top = idx === 0;
                    return (
                      <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: top ? '#fffbeb' : 'var(--muted)/20', border: top ? '1.5px solid #fde68a' : '1px solid var(--border)' }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black"
                          style={{ background: top ? '#f59e0b' : '#e5e7eb', color: top ? 'white' : '#6b7280' }}>
                          {top ? '👑' : idx + 1}
                        </div>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: m.avatarColor ?? '#6366f1' }}>
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-foreground">{m.name} <span className="font-normal text-xs px-1.5 py-0.5 rounded-full ml-1" style={{ background: rc.bg, color: rc.color }}>{rc.label}</span></p>
                        </div>
                        <div className="flex gap-4 text-center">
                          <div><p className="text-sm font-black text-emerald-600">{m.closed}</p><p className="text-xs text-muted-foreground">Fechados</p></div>
                          <div><p className="text-sm font-black text-primary">{m.converted}</p><p className="text-xs text-muted-foreground">Convertidos</p></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: ATIVIDADE — log em tempo real ── */}
        {tab === 'atividade' && (
          <div>
            {/* Filtro por membro */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button onClick={() => setActivityFilter('all')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={{ background: activityFilter === 'all' ? '#6366f1' : 'transparent', color: activityFilter === 'all' ? 'white' : 'var(--muted-foreground)', borderColor: activityFilter === 'all' ? '#6366f1' : 'var(--border)' }}>
                Toda equipe ({activityLog.length})
              </button>
              {teamMembers.filter(m => m.isActive).map(m => (
                <button key={m.id} onClick={() => setActivityFilter(m.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5"
                  style={{ background: activityFilter === m.id ? m.avatarColor : 'transparent', color: activityFilter === m.id ? 'white' : 'var(--muted-foreground)', borderColor: activityFilter === m.id ? m.avatarColor : 'var(--border)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: activityFilter === m.id ? 'rgba(255,255,255,0.6)' : m.avatarColor }} />
                  {m.name.split(' ')[0]} ({activityLog.filter(a => a.memberId === m.id).length})
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredLog.map((a, i) => {
                const actCfg = ACTIVITY_CFG[a.type];
                return (
                  <div key={a.id} className="flex items-start gap-3 p-3.5 bg-card rounded-xl border border-border hover:shadow-sm transition-all">
                    {/* Avatar membro */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
                      style={{ background: teamMembers.find(m => m.id === a.memberId)?.avatarColor ?? '#6366f1' }}>
                      {a.memberName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-foreground">{a.memberName}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: ROLE_CFG[a.memberRole].bg, color: ROLE_CFG[a.memberRole].color }}>{ROLE_CFG[a.memberRole].label}</span>
                        <span className="text-xs font-semibold" style={{ color: actCfg.color }}>{actCfg.emoji} {actCfg.label}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {a.contactName && <span className="font-medium text-foreground">{a.contactName}</span>}
                        {a.contactCompany && <span> · {a.contactCompany}</span>}
                        {a.dealName && !a.contactName && <span className="font-medium text-foreground">{a.dealName}</span>}
                        {a.fromStage && a.toStage && (
                          <span className="text-xs ml-1">
                            <span className="text-muted-foreground">{a.fromStage}</span>
                            {' → '}
                            <span className="font-semibold" style={{ color: actCfg.color }}>{a.toStage}</span>
                          </span>
                        )}
                        {a.note && <p className="mt-0.5 italic text-muted-foreground">"{a.note}"</p>}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{timeAgo(a.createdAt)}</span>
                  </div>
                );
              })}
              {filteredLog.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity size={28} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhuma atividade registrada ainda.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit member dialog */}
      <Dialog open={showAdd} onOpenChange={() => { setShowAdd(false); setEditMember(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editMember ? 'Editar Membro' : 'Convidar Novo Membro'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs mb-1.5 block">Nome completo *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Lucas Silva" /></div>
            <div><Label className="text-xs mb-1.5 block">E-mail (login) *</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="lucas@empresa.com" /></div>
            <div><Label className="text-xs mb-1.5 block">WhatsApp</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="11987654321" /></div>
            <div>
              <Label className="text-xs mb-2 block">Papel na equipe</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['gestor','vendedor','sdr'] as TeamRole[]).map(r => {
                  const rc = ROLE_CFG[r];
                  return (
                    <button key={r} onClick={() => setForm(f => ({ ...f, role: r }))}
                      className="p-2.5 rounded-xl border-2 text-center transition-all"
                      style={{ borderColor: form.role === r ? rc.color : '#e5e7eb', background: form.role === r ? rc.bg : 'transparent' }}>
                      <p className="text-xs font-bold" style={{ color: form.role === r ? rc.color : '#6b7280' }}>{rc.label}</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{ROLE_CFG[form.role].desc}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1.5 block">Meta diária (envios)</Label><Input type="number" value={form.dailyGoal} onChange={e => setForm(f => ({ ...f, dailyGoal: e.target.value }))} /></div>
              <div><Label className="text-xs mb-1.5 block">Meta mensal (conv.)</Label><Input type="number" value={form.monthlyGoal} onChange={e => setForm(f => ({ ...f, monthlyGoal: e.target.value }))} /></div>
            </div>
            <div>
              <Label className="text-xs mb-2 block">Cor do avatar</Label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, avatarColor: c }))}
                    className="w-7 h-7 rounded-lg border-2 transition-all"
                    style={{ background: c, borderColor: form.avatarColor === c ? '#000' : 'transparent' }} />
                ))}
              </div>
            </div>
            {!editMember && (
              <div className="p-3 rounded-xl border border-border bg-muted/20 text-xs text-muted-foreground">
                📧 Um link de convite será enviado para o e-mail informado. A senha inicial será <strong>demo123</strong> (modo demo).
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditMember(null); }}>Cancelar</Button>
            <Button onClick={saveForm} disabled={!form.name || !form.email} className="text-white" style={{ background: 'var(--emerald)' }}>
              {editMember ? 'Salvar alterações' : 'Convidar membro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {ConfirmNode}
    </AppLayout>
  );
}
