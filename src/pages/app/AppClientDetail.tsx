import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProspect } from '@/hooks/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ClientContact, ClientProduct, Proposal, ClientInteraction } from '@/lib/index';
import { ROUTES, formatPhone } from '@/lib/index';
import {
  ArrowLeft, Building2, Phone, Mail, Globe, MapPin, Users, Plus, Edit2,
  Trash2, FileText, CheckCircle2, XCircle, Clock, Calendar, DollarSign,
  TrendingUp, Heart, Zap, MessageCircle, Star, Package, AlertTriangle,
  Activity, Download, Send, Briefcase
} from 'lucide-react';

const fc = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
const fd = (d: Date) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

function healthColor(s: number) {
  if (s >= 80) return '#10b981'; if (s >= 60) return '#f59e0b';
  if (s >= 40) return '#f97316'; return '#ef4444';
}

const PROPOSAL_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  rascunho:  { label: 'Rascunho',    color: '#6b7280', bg: '#f9fafb' },
  enviada:   { label: 'Enviada',     color: '#0ea5e9', bg: '#f0f9ff' },
  aprovada:  { label: 'Aprovada ✓',  color: '#059669', bg: '#f0fdf4' },
  rejeitada: { label: 'Rejeitada',   color: '#dc2626', bg: '#fef2f2' },
  expirada:  { label: 'Expirada',    color: '#d97706', bg: '#fffbeb' },
};

const INTERACTION_ICONS: Record<string, { icon: string; label: string }> = {
  reuniao:  { icon: '🤝', label: 'Reunião' },
  ligacao:  { icon: '📞', label: 'Ligação' },
  whatsapp: { icon: '💬', label: 'WhatsApp' },
  email:    { icon: '📧', label: 'E-mail' },
  visita:   { icon: '🏢', label: 'Visita' },
  proposta: { icon: '📄', label: 'Proposta' },
  contrato: { icon: '📝', label: 'Contrato' },
  nota:     { icon: '📌', label: 'Nota' },
};

const PRODUCT_STATUS_CFG: Record<string, { label: string; color: string }> = {
  ativo:     { label: 'Ativo',     color: '#059669' },
  pausado:   { label: 'Pausado',   color: '#d97706' },
  cancelado: { label: 'Cancelado', color: '#dc2626' },
  concluido: { label: 'Concluído', color: '#6366f1' },
};

type Tab = 'visao-geral' | 'contatos' | 'produtos' | 'propostas' | 'historico';

export default function AppClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { clients, updateClient, addClientContact, removeClientContact, addProposal, updateProposal, addInteraction, addClientProduct } = useProspect();
  const client = clients.find(c => c.id === id);

  const [tab, setTab] = useState<Tab>('visao-geral');
  const [showContactForm, setShowContactForm] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState(client?.notes ?? '');

  const [cForm, setCForm] = useState({ name: '', role: '', phone: '', email: '', isPrimary: false });
  const [pForm, setPForm] = useState({ title: '', value: '', status: 'enviada' as Proposal['status'], notes: '', fileName: '', validDays: '30' });
  const [iForm, setIForm] = useState({ type: 'reuniao' as ClientInteraction['type'], title: '', description: '', outcome: 'positivo' as ClientInteraction['outcome'] });
  const [prForm, setPrForm] = useState({ productName: '', quantity: '1', unitValue: '', status: 'ativo' as ClientProduct['status'], notes: '' });

  if (!client) return (
    <AppLayout>
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Cliente não encontrado.</p>
      </div>
    </AppLayout>
  );

  const totalProductsValue = client.products.reduce((s, p) => s + p.totalValue, 0);
  const approvedProposals = client.proposals.filter(p => p.status === 'aprovada');
  const pendingProposals = client.proposals.filter(p => p.status === 'enviada');

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'visao-geral', label: '📊 Visão Geral' },
    { id: 'contatos',    label: '👥 Contatos',    count: client.contacts.length },
    { id: 'produtos',    label: '📦 Produtos',    count: client.products.length },
    { id: 'propostas',   label: '📄 Propostas',   count: client.proposals.length },
    { id: 'historico',   label: '🕐 Histórico',   count: client.interactions.length },
  ];

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-6xl mx-auto">
        <Link to={ROUTES.APP_CLIENTS} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
          <ArrowLeft size={14} /> Voltar para Clientes
        </Link>

        {/* Header */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
              style={{ background: 'var(--primary)' }}>
              {client.companyName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{client.companyName}</h1>
                {client.fromProspecting && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#fef9c3', color: '#854d0e' }}>
                    <Zap size={10} /> Via Zapli
                  </span>
                )}
                {client.cnpj && <span className="text-xs text-muted-foreground font-mono">CNPJ: {client.cnpj}</span>}
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Briefcase size={11} /> {client.segment}</span>
                {client.city && <span className="flex items-center gap-1"><MapPin size={11} /> {client.city}/{client.state}</span>}
                {client.website && <span className="flex items-center gap-1"><Globe size={11} /> {client.website}</span>}
                <span className="flex items-center gap-1"><Calendar size={11} /> Cliente desde {fd(client.acquisitionDate)}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {client.tags.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                ))}
              </div>
            </div>
            {/* Health Score */}
            <div className="shrink-0 text-center">
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
                  <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="2.5"
                    stroke={healthColor(client.healthScore)}
                    strokeDasharray={`${client.healthScore} 100`}
                    strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold"
                  style={{ color: healthColor(client.healthScore) }}>
                  {client.healthScore}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Health Score</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted/40 p-1 rounded-xl overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
              style={{ background: tab === t.id ? 'var(--card)' : 'transparent', color: tab === t.id ? 'var(--foreground)' : 'var(--muted-foreground)', boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
              {t.label} {t.count !== undefined && <span className="text-xs font-bold rounded-full px-1.5" style={{ background: tab === t.id ? 'var(--primary)' : '#e5e7eb', color: tab === t.id ? 'white' : '#6b7280' }}>{t.count}</span>}
            </button>
          ))}
        </div>

        {/* ── VISÃO GERAL ── */}
        {tab === 'visao-geral' && (
          <div className="grid md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-5">
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'LTV Total', value: fc(client.ltv), icon: DollarSign, color: '#059669', bg: '#f0fdf4' },
                  { label: 'MRR Mensal', value: fc(client.mrr ?? 0), icon: TrendingUp, color: '#0ea5e9', bg: '#f0f9ff' },
                  { label: 'Produtos Ativos', value: client.products.filter(p => p.status === 'ativo').length, icon: Package, color: '#6366f1', bg: '#eef2ff' },
                  { label: 'Propostas Abertas', value: pendingProposals.length, icon: FileText, color: '#f59e0b', bg: '#fffbeb' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="rounded-xl p-4 flex items-center gap-3 border border-border" style={{ background: bg }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-base font-bold" style={{ color }}>{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Produtos em destaque */}
              {client.products.length > 0 && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-2"><Package size={14} className="text-primary" /> Produtos / Serviços</h3>
                    <button onClick={() => setTab('produtos')} className="text-xs text-primary hover:underline">Ver todos</button>
                  </div>
                  <div className="divide-y divide-border">
                    {client.products.map((p, i) => (
                      <div key={i} className="px-5 py-3 flex items-center gap-3">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${PRODUCT_STATUS_CFG[p.status].color}18`, color: PRODUCT_STATUS_CFG[p.status].color }}>{PRODUCT_STATUS_CFG[p.status].label}</span>
                        <span className="flex-1 text-sm font-medium text-foreground">{p.productName}</span>
                        <span className="text-sm font-bold text-emerald-600">{fc(p.totalValue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Última interação */}
              {client.interactions.length > 0 && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-2"><Activity size={14} className="text-primary" /> Atividade Recente</h3>
                    <button onClick={() => setTab('historico')} className="text-xs text-primary hover:underline">Ver histórico</button>
                  </div>
                  <div className="divide-y divide-border">
                    {client.interactions.slice(0, 3).map(i => (
                      <div key={i.id} className="px-5 py-3 flex items-start gap-3">
                        <span className="text-base shrink-0">{INTERACTION_ICONS[i.type]?.icon ?? '📋'}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{i.title}</p>
                          {i.description && <p className="text-xs text-muted-foreground line-clamp-1">{i.description}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{fd(i.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Contato principal */}
              {client.contacts.filter(c => c.isPrimary).map(c => (
                <div key={c.id} className="bg-card rounded-xl border border-border p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Contato Principal</p>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'var(--emerald)' }}>
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.role}</p>
                      <div className="mt-2 space-y-1">
                        <a href={`https://wa.me/55${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium hover:text-primary" style={{ color: '#25D366' }}>
                          <MessageCircle size={12} /> {formatPhone(c.phone)}
                        </a>
                        {c.email && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail size={12} /> {c.email}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Notas */}
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Observações</p>
                  <button onClick={() => setEditNotes(!editNotes)} className="text-xs text-primary hover:underline flex items-center gap-1"><Edit2 size={10} /> {editNotes ? 'Fechar' : 'Editar'}</button>
                </div>
                {editNotes ? (
                  <div className="space-y-2">
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="text-sm resize-none" />
                    <Button size="sm" className="text-xs h-7 text-white" style={{ background: 'var(--emerald)' }}
                      onClick={() => { updateClient(client.id, { notes }); setEditNotes(false); }}>
                      <CheckCircle2 size={11} className="mr-1" /> Salvar
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">{client.notes || 'Nenhuma observação.'}</p>
                )}
              </div>

              {/* Próximo follow-up */}
              {client.nextFollowUpAt && (
                <div className="p-4 rounded-xl border" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={13} style={{ color: '#d97706' }} />
                    <p className="text-xs font-bold text-amber-800">Próximo Follow-up</p>
                  </div>
                  <p className="text-sm font-bold text-amber-900">{fd(client.nextFollowUpAt)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CONTATOS ── */}
        {tab === 'contatos' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowContactForm(true)} className="gap-1.5 text-xs text-white" style={{ background: 'var(--emerald)' }}>
                <Plus size={13} /> Novo Contato
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {client.contacts.map(c => (
                <div key={c.id} className="bg-card rounded-xl border border-border p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: c.isPrimary ? 'var(--emerald)' : 'var(--primary)' }}>
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground">{c.name}</p>
                      {c.isPrimary && <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Principal</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{c.role}</p>
                    <div className="mt-2 space-y-1">
                      <a href={`https://wa.me/55${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#25D366' }}>
                        <MessageCircle size={11} /> {formatPhone(c.phone)}
                      </a>
                      {c.email && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail size={11} /> {c.email}</p>}
                    </div>
                  </div>
                  {!c.isPrimary && (
                    <button onClick={() => removeClientContact(client.id, c.id)} className="text-muted-foreground hover:text-red-500 p-1"><Trash2 size={13} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PRODUTOS ── */}
        {tab === 'produtos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">Total em produtos: <span className="text-emerald-600">{fc(totalProductsValue)}</span></p>
              </div>
              <Button size="sm" onClick={() => setShowProductForm(true)} className="gap-1.5 text-xs text-white" style={{ background: 'var(--emerald)' }}>
                <Plus size={13} /> Adicionar Produto
              </Button>
            </div>
            {client.products.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Package size={24} className="mx-auto text-muted-foreground mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">Nenhum produto registrado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {client.products.map((p, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${PRODUCT_STATUS_CFG[p.status].color}15` }}>
                      <Package size={18} style={{ color: PRODUCT_STATUS_CFG[p.status].color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">{p.productName}</p>
                      <p className="text-xs text-muted-foreground">Qtd: {p.quantity} · Unit: {fc(p.unitValue)}</p>
                      {p.renewalDate && <p className="text-xs text-amber-700 mt-0.5 flex items-center gap-1"><Clock size={10} /> Renovação: {fd(p.renewalDate)}</p>}
                      {p.notes && <p className="text-xs text-muted-foreground italic mt-0.5">{p.notes}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-emerald-600">{fc(p.totalValue)}</p>
                      <span className="text-xs font-bold" style={{ color: PRODUCT_STATUS_CFG[p.status].color }}>{PRODUCT_STATUS_CFG[p.status].label}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PROPOSTAS ── */}
        {tab === 'propostas' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Aprovadas', value: approvedProposals.length, color: '#059669', icon: CheckCircle2 },
                { label: 'Em andamento', value: pendingProposals.length, color: '#0ea5e9', icon: Send },
                { label: 'Total em propostas', value: fc(client.proposals.filter(p => p.status === 'aprovada').reduce((s, p) => s + p.value, 0)), color: '#6366f1', icon: DollarSign },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-base font-bold" style={{ color }}>{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowProposalForm(true)} className="gap-1.5 text-xs text-white" style={{ background: 'var(--emerald)' }}>
                <Plus size={13} /> Nova Proposta
              </Button>
            </div>
            {client.proposals.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <FileText size={24} className="mx-auto text-muted-foreground mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">Nenhuma proposta registrada.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {client.proposals.map(p => {
                  const pCfg = PROPOSAL_STATUS[p.status];
                  return (
                    <div key={p.id} className="bg-card rounded-xl border border-border p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: pCfg.bg }}>
                          <FileText size={18} style={{ color: pCfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-sm text-foreground">{p.title}</p>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: pCfg.bg, color: pCfg.color }}>{pCfg.label}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {p.sentAt && <span className="flex items-center gap-1"><Send size={10} /> Enviada: {fd(p.sentAt)}</span>}
                            {p.validUntil && <span className="flex items-center gap-1"><Calendar size={10} /> Válida até: {fd(p.validUntil)}</span>}
                            {p.fileName && <span className="flex items-center gap-1"><Download size={10} /> {p.fileName}</span>}
                          </div>
                          {p.notes && <p className="text-xs text-muted-foreground mt-1 italic">{p.notes}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-emerald-600">{fc(p.value)}</p>
                          <div className="flex gap-1 mt-1">
                            {p.status === 'enviada' && (
                              <>
                                <button onClick={() => updateProposal(client.id, p.id, { status: 'aprovada' })} className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium">✓ Aprovar</button>
                                <button onClick={() => updateProposal(client.id, p.id, { status: 'rejeitada' })} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 font-medium">✕ Rejeitar</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── HISTÓRICO ── */}
        {tab === 'historico' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowInteractionForm(true)} className="gap-1.5 text-xs text-white" style={{ background: 'var(--emerald)' }}>
                <Plus size={13} /> Registrar Interação
              </Button>
            </div>
            {client.interactions.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Activity size={24} className="mx-auto text-muted-foreground mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">Nenhuma interação registrada.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-4">
                  {client.interactions.map(i => (
                    <div key={i.id} className="relative pl-12">
                      <div className="absolute left-3 top-4 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                        style={{ background: i.outcome === 'positivo' ? '#f0fdf4' : i.outcome === 'negativo' ? '#fef2f2' : '#f9fafb', border: `2px solid ${i.outcome === 'positivo' ? '#10b981' : i.outcome === 'negativo' ? '#ef4444' : '#9ca3af'}` }}>
                        {INTERACTION_ICONS[i.type]?.icon ?? '📋'}
                      </div>
                      <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground">{INTERACTION_ICONS[i.type]?.label ?? i.type}</span>
                            <p className="text-sm font-bold text-foreground">{i.title}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{fd(i.date)}</span>
                        </div>
                        {i.description && <p className="text-xs text-muted-foreground">{i.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Adicionar Contato</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2"><Label className="text-xs mb-1.5 block">Nome *</Label><Input value={cForm.name} onChange={e => setCForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">Cargo</Label><Input value={cForm.role} onChange={e => setCForm(f => ({ ...f, role: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">WhatsApp *</Label><Input value={cForm.phone} onChange={e => setCForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="col-span-2"><Label className="text-xs mb-1.5 block">E-mail</Label><Input type="email" value={cForm.email} onChange={e => setCForm(f => ({ ...f, email: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactForm(false)}>Cancelar</Button>
            <Button disabled={!cForm.name || !cForm.phone} onClick={() => { addClientContact(client.id, { ...cForm, whatsapp: cForm.phone, isPrimary: false }); setCForm({ name: '', role: '', phone: '', email: '', isPrimary: false }); setShowContactForm(false); }} className="text-white" style={{ background: 'var(--emerald)' }}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProposalForm} onOpenChange={setShowProposalForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Proposta</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs mb-1.5 block">Título *</Label><Input placeholder="Ex: Proposta Construção Residencial" value={pForm.title} onChange={e => setPForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1.5 block">Valor (R$) *</Label><Input type="number" value={pForm.value} onChange={e => setPForm(f => ({ ...f, value: e.target.value }))} /></div>
              <div><Label className="text-xs mb-1.5 block">Status</Label>
                <Select value={pForm.status} onValueChange={v => setPForm(f => ({ ...f, status: v as Proposal['status'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROPOSAL_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs mb-1.5 block">Nome do arquivo (PDF)</Label><Input placeholder="proposta_empresa.pdf" value={pForm.fileName} onChange={e => setPForm(f => ({ ...f, fileName: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">Observações</Label><Textarea value={pForm.notes} onChange={e => setPForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="resize-none text-sm" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProposalForm(false)}>Cancelar</Button>
            <Button disabled={!pForm.title || !pForm.value} onClick={() => {
              addProposal(client.id, { title: pForm.title, value: Number(pForm.value), status: pForm.status, notes: pForm.notes || undefined, fileName: pForm.fileName || undefined, sentAt: pForm.status !== 'rascunho' ? new Date() : undefined, validUntil: new Date(Date.now() + Number(pForm.validDays) * 86400000) });
              setPForm({ title: '', value: '', status: 'enviada', notes: '', fileName: '', validDays: '30' });
              setShowProposalForm(false);
            }} className="text-white" style={{ background: 'var(--emerald)' }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInteractionForm} onOpenChange={setShowInteractionForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Interação</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1.5 block">Tipo</Label>
                <Select value={iForm.type} onValueChange={v => setIForm(f => ({ ...f, type: v as ClientInteraction['type'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(INTERACTION_ICONS).map(([k, v]) => <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs mb-1.5 block">Resultado</Label>
                <Select value={iForm.outcome} onValueChange={v => setIForm(f => ({ ...f, outcome: v as ClientInteraction['outcome'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="positivo">✅ Positivo</SelectItem><SelectItem value="neutro">➖ Neutro</SelectItem><SelectItem value="negativo">❌ Negativo</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs mb-1.5 block">Título *</Label><Input value={iForm.title} onChange={e => setIForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">Descrição</Label><Textarea value={iForm.description ?? ''} onChange={e => setIForm(f => ({ ...f, description: e.target.value }))} rows={3} className="resize-none text-sm" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInteractionForm(false)}>Cancelar</Button>
            <Button disabled={!iForm.title} onClick={() => { addInteraction(client.id, { ...iForm, date: new Date() }); setIForm({ type: 'reuniao', title: '', description: '', outcome: 'positivo' }); setShowInteractionForm(false); }} className="text-white" style={{ background: 'var(--emerald)' }}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Adicionar Produto/Serviço</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs mb-1.5 block">Nome do produto *</Label><Input value={prForm.productName} onChange={e => setPrForm(f => ({ ...f, productName: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs mb-1.5 block">Qtd</Label><Input type="number" min="1" value={prForm.quantity} onChange={e => setPrForm(f => ({ ...f, quantity: e.target.value }))} /></div>
              <div className="col-span-2"><Label className="text-xs mb-1.5 block">Valor unitário (R$)</Label><Input type="number" value={prForm.unitValue} onChange={e => setPrForm(f => ({ ...f, unitValue: e.target.value }))} /></div>
            </div>
            <div><Label className="text-xs mb-1.5 block">Status</Label>
              <Select value={prForm.status} onValueChange={v => setPrForm(f => ({ ...f, status: v as ClientProduct['status'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PRODUCT_STATUS_CFG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1.5 block">Observações</Label><Input value={prForm.notes} onChange={e => setPrForm(f => ({ ...f, notes: e.target.value }))} /></div>
            {prForm.unitValue && prForm.quantity && <p className="text-xs text-emerald-700 font-semibold">Total: {fc(Number(prForm.unitValue) * Number(prForm.quantity))}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductForm(false)}>Cancelar</Button>
            <Button disabled={!prForm.productName} onClick={() => {
              const qty = Number(prForm.quantity) || 1, uv = Number(prForm.unitValue) || 0;
              addClientProduct(client.id, { productName: prForm.productName, quantity: qty, unitValue: uv, totalValue: qty * uv, status: prForm.status, startDate: new Date(), notes: prForm.notes || undefined });
              setPrForm({ productName: '', quantity: '1', unitValue: '', status: 'ativo', notes: '' });
              setShowProductForm(false);
            }} className="text-white" style={{ background: 'var(--emerald)' }}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
