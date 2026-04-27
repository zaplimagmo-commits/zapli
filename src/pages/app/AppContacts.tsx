import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useProspect } from '@/hooks/AppContext';
import { useRole } from '@/hooks/useRole';
import { useConfirm } from '@/components/ConfirmDialog';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge, PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Plus, Search, MessageCircle, Clock, ArrowRight, Trash2, ExternalLink,
  AlertTriangle, FileSpreadsheet, Package, LayoutList, LayoutGrid,
  Flame, TrendingUp, Filter, ChevronDown, Star, MapPin, Mail,
  Users, CheckCircle2, Reply, Eye
} from 'lucide-react';
import ExcelImport from '@/components/ExcelImport';
import type { Contact, ContactStatus } from '@/lib/index';
import { formatPhone, formatDate, daysSince, getWhatsAppLink, STATUS_LABELS, PLANS } from '@/lib/index';
import { defaultProducts } from '@/data/sendData';

// ── Lead Score ─────────────────────────────────────────────
function getLeadScore(c: Contact): { score: number; label: string; color: string; bg: string } {
  let score = 0;
  if (c.messages.length > 0) score += 20;
  if (c.status === 'respondido') score += 30;
  if (c.status === 'followup') score += 15;
  if (c.status === 'convertido') score = 100;
  if (c.email) score += 10;
  if (c.segment) score += 10;
  if (c.city) score += 5;
  const days = c.lastContactAt ? daysSince(c.lastContactAt) : 999;
  if (days <= 1) score += 10;
  else if (days <= 3) score += 5;
  score = Math.min(score, 100);
  if (score >= 80) return { score, label: 'Quente', color: '#ef4444', bg: '#fef2f2' };
  if (score >= 50) return { score, label: 'Morno', color: '#f59e0b', bg: '#fffbeb' };
  if (score >= 25) return { score, label: 'Frio', color: '#0ea5e9', bg: '#f0f9ff' };
  return { score, label: 'Novo', color: '#6b7280', bg: '#f9fafb' };
}

// ── Constants ──────────────────────────────────────────────
const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const FILTER_OPTS: { label: string; value: ContactStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Aguardando', value: 'aguardando' },
  { label: 'Follow-up', value: 'followup' },
  { label: 'Respondido', value: 'respondido' },
  { label: 'Convertido', value: 'convertido' },
  { label: 'Arquivado', value: 'arquivado' },
];
const STATUS_COLORS: Record<string, string> = {
  aguardando: '#6366f1', followup: '#f59e0b', respondido: '#0ea5e9',
  convertido: '#059669', arquivado: '#6b7280', fila: '#8b5cf6',
};

export default function AppContacts() {
  const { user } = useAuth();
  const { contacts, addContact, sendInitialMessage, sendFollowUp, deleteContact, stats } = useProspect();
  const { isGestor, isSDR } = useRole();
  const { confirm, ConfirmNode } = useConfirm();
  const plan = PLANS[user?.planId ?? 'starter'];

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ContactStatus | 'all'>('all');
  const [filterSegment, setFilterSegment] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'date'>('date');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [showAdd, setShowAdd] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [waModal, setWaModal] = useState<{ contact: Contact; message: string; link: string } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState({
    name: '', company: '', phone: '', city: '', state: 'SP',
    segment: '', email: '', notes: '', productId: '',
  });

  const segments = useMemo(() => {
    const s = new Set(contacts.map(c => c.segment).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [contacts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = contacts.filter(c =>
      (c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.phone.includes(q)) &&
      (filterStatus === 'all' || c.status === filterStatus) &&
      (filterSegment === 'all' || c.segment === filterSegment)
    );
    if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'score') list = [...list].sort((a, b) => getLeadScore(b).score - getLeadScore(a).score);
    else list = [...list].sort((a, b) => (b.lastContactAt ? new Date(b.lastContactAt).getTime() : 0) - (a.lastContactAt ? new Date(a.lastContactAt).getTime() : 0));
    return list;
  }, [contacts, search, filterStatus, filterSegment, sortBy]);

  async function handleDeleteContact(id: string, name: string) {
    const ok = await confirm({
      title: 'Excluir contato',
      message: `Tem certeza que deseja excluir "${name}"? Esta ação é irreversível e todos os dados e histórico serão perdidos.`,
      confirmLabel: 'Sim, excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (ok) deleteContact(id);
  }

  function handleAdd() {
    if (!form.name || !form.phone || !form.company) return;
    addContact({ ...form });
    setForm({ name: '', company: '', phone: '', city: '', state: 'SP', segment: '', email: '', notes: '', productId: '' });
    setShowAdd(false);
  }

  function openWa(result: { contact: Contact; message: string } | null) {
    if (!result) return;
    setWaModal({ contact: result.contact, message: result.message, link: getWhatsAppLink(result.contact.phone, result.message) });
  }

  const hotLeads = contacts.filter(c => getLeadScore(c).score >= 80).length;
  const followUpLeads = contacts.filter(c => c.status === 'followup').length;

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <PageHeader
          title="Contatos"
          subtitle={`${contacts.length} contatos na base`}
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowImport(true)} className="flex items-center gap-2 text-sm">
                <FileSpreadsheet size={15} /> Importar
              </Button>
              <Button onClick={() => setShowAdd(true)} className="flex items-center gap-2 text-sm text-white" style={{ background: 'var(--emerald)' }}>
                <Plus size={15} /> Novo Contato
              </Button>
            </div>
          }
        />

        {/* ── KPIs mini ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            { label: 'Total',       v: contacts.length,                                                   color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', icon: Users },
            { label: '🔥 Quentes',  v: hotLeads,                                                           color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: Flame },
            { label: 'Follow-up',   v: followUpLeads,                                                      color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: Clock },
            { label: 'Responderam', v: contacts.filter(c => c.status === 'respondido').length,             color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', icon: Reply },
            { label: 'Convertidos', v: contacts.filter(c => c.status === 'convertido').length,             color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', icon: CheckCircle2 },
          ].map(({ label, v, color, bg, border, icon: Icon }) => (
            <div key={label} className="rounded-xl border p-3 flex items-center gap-2.5 cursor-pointer hover:shadow-sm transition-all"
              style={{ background: bg, borderColor: border }}
              onClick={() => {
                if (label === 'Follow-up') setFilterStatus('followup');
                else if (label === 'Responderam') setFilterStatus('respondido');
                else if (label === 'Convertidos') setFilterStatus('convertido');
                else setFilterStatus('all');
              }}>
              <Icon size={15} style={{ color, flexShrink: 0 }} />
              <div>
                <p className="text-lg font-black leading-none" style={{ color }}>{v}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Alerta de follow-up ── */}
        {followUpLeads > 0 && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ background: '#fffbeb', borderColor: '#fcd34d' }}>
            <AlertTriangle size={15} style={{ color: '#d97706', flexShrink: 0 }} />
            <p className="text-sm font-medium text-amber-800">
              <strong>{followUpLeads} lead{followUpLeads > 1 ? 's precisam' : ' precisa'}</strong> de follow-up hoje. Não deixe esfriar!
            </p>
            <button className="ml-auto text-xs font-semibold text-amber-700 underline" onClick={() => setFilterStatus('followup')}>
              Filtrar follow-ups
            </button>
          </div>
        )}

        {/* ── Barra de busca + filtros ── */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-52">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome, empresa ou telefone..." value={search}
              onChange={e => setSearch(e.target.value)} className="pl-9 text-sm" />
          </div>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground">
            <option value="date">↓ Mais recentes</option>
            <option value="score">↓ Maior score</option>
            <option value="name">A–Z Nome</option>
          </select>

          {/* Segmento */}
          {segments.length > 0 && (
            <select value={filterSegment} onChange={e => setFilterSegment(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground">
              <option value="all">Todos segmentos</option>
              {segments.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setView('list')}
              className="px-3 py-2 transition-colors"
              style={{ background: view === 'list' ? '#6366f1' : 'transparent', color: view === 'list' ? 'white' : 'var(--muted-foreground)' }}>
              <LayoutList size={14} />
            </button>
            <button onClick={() => setView('grid')}
              className="px-3 py-2 transition-colors"
              style={{ background: view === 'grid' ? '#6366f1' : 'transparent', color: view === 'grid' ? 'white' : 'var(--muted-foreground)' }}>
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>

        {/* ── Status pills ── */}
        <div className="flex gap-1.5 flex-wrap mb-5">
          {FILTER_OPTS.map(opt => {
            const cnt = opt.value === 'all' ? contacts.length : contacts.filter(c => c.status === opt.value).length;
            return (
              <button key={opt.value} onClick={() => setFilterStatus(opt.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={{
                  background: filterStatus === opt.value ? (STATUS_COLORS[opt.value] ?? '#6366f1') : 'transparent',
                  color: filterStatus === opt.value ? 'white' : 'var(--muted-foreground)',
                  borderColor: filterStatus === opt.value ? (STATUS_COLORS[opt.value] ?? '#6366f1') : 'var(--border)',
                }}>
                {opt.label} <span className="opacity-75 ml-0.5">({cnt})</span>
              </button>
            );
          })}
          <span className="ml-auto text-xs text-muted-foreground self-center">{filtered.length} resultados</span>
        </div>

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {['Contato', 'Score', 'Empresa', 'Segmento', 'Status', 'Último contato', 'Ações'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-14">
                        <Search size={28} className="mx-auto text-muted-foreground opacity-30 mb-3" />
                        <p className="text-sm text-muted-foreground">Nenhum contato encontrado</p>
                      </td>
                    </tr>
                  ) : filtered.map(c => (
                    <ContactRow key={c.id} contact={c}
                      onSendInitial={() => openWa(sendInitialMessage(c.id, user?.companyName ?? ''))}
                      onSendFollowUp={() => openWa(sendFollowUp(c.id, user?.companyName ?? ''))}
                      onDelete={() => handleDeleteContact(c.id, c.name)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── GRID VIEW ── */}
        {view === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.length === 0 ? (
              <div className="col-span-3 text-center py-14 bg-card rounded-2xl border border-border">
                <Search size={28} className="mx-auto text-muted-foreground opacity-30 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum contato encontrado</p>
              </div>
            ) : filtered.map(c => <ContactCard key={c.id} contact={c}
              onSendInitial={() => openWa(sendInitialMessage(c.id, user?.companyName ?? ''))}
              onSendFollowUp={() => openWa(sendFollowUp(c.id, user?.companyName ?? ''))}
              onDelete={() => handleDeleteContact(c.id, c.name)} />)}
          </div>
        )}
      </div>

      <ExcelImport open={showImport} onClose={() => setShowImport(false)}
        onImport={rows => {
          rows.forEach(row => {
            if (row.name && row.phone && row.company) {
              addContact({ name: row.name as string, phone: row.phone as string, company: row.company as string,
                email: row.email as string || '', city: row.city as string || '', state: row.state as string || 'SP',
                segment: row.segment as string || '', notes: row.notes as string || '' });
            }
          });
          setShowImport(false);
        }} />

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Cadastrar Novo Contato</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2"><Label className="text-xs mb-1.5 block">Nome completo *</Label><Input placeholder="Ex: João Silva" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="col-span-2"><Label className="text-xs mb-1.5 block">Empresa *</Label><Input placeholder="Ex: Silva Engenharia" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">WhatsApp *</Label><Input placeholder="11987654321" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">E-mail</Label><Input placeholder="joao@empresa.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">Cidade</Label><Input placeholder="São Paulo" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">Estado</Label>
              <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-xs mb-1.5 block">Segmento / Área</Label><Input placeholder="Ex: Engenharia, Tecnologia, Saúde..." value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))} /></div>
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block flex items-center gap-1.5"><Package size={12} className="text-primary" /> Produto a ser ofertado</Label>
              <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Selecionar produto (opcional)</option>
                {defaultProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={!form.name || !form.phone || !form.company} style={{ background: 'var(--emerald)' }} className="text-white">Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {waModal && (
        <Dialog open={!!waModal} onOpenChange={() => setWaModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><MessageCircle size={17} style={{ color: '#25D366' }} /> Enviar via WhatsApp</DialogTitle></DialogHeader>
            <div className="py-2 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'var(--primary)' }}>
                  {waModal.contact.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{waModal.contact.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPhone(waModal.contact.phone)}</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-sm whitespace-pre-wrap border border-border" style={{ maxHeight: 180, overflowY: 'auto' }}>{waModal.message}</div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWaModal(null)}>Fechar</Button>
              <a href={waModal.link} target="_blank" rel="noopener noreferrer">
                <Button className="gap-2 text-white" style={{ background: '#25D366' }}><ExternalLink size={13} /> Abrir WhatsApp</Button>
              </a>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {ConfirmNode}
    </AppLayout>
  );
}

// ── Contact Row (List View) ─────────────────────────────────
function ContactRow({ contact: c, onSendInitial, onSendFollowUp, onDelete }: {
  contact: Contact; onSendInitial: () => void; onSendFollowUp: () => void; onDelete: () => void;
}) {
  const ls = getLeadScore(c);
  return (
    <tr className={`hover:bg-muted/20 transition-colors ${c.status === 'followup' ? 'bg-amber-50/20' : ''}`}>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: STATUS_COLORS[c.status] ?? 'var(--primary)' }}>
            {c.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <Link to={`/app/contatos/${c.id}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors">{c.name}</Link>
            {c.email && <p className="text-xs text-muted-foreground truncate max-w-[140px]">{c.email}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${ls.score}%`, background: ls.color }} />
          </div>
          <span className="text-xs font-bold" style={{ color: ls.color }}>{ls.score}</span>
          {ls.score >= 80 && <span title="Lead quente!" className="text-xs">🔥</span>}
        </div>
        <p className="text-xs" style={{ color: ls.color }}>{ls.label}</p>
      </td>
      <td className="px-4 py-3.5 text-sm text-foreground">{c.company}</td>
      <td className="px-4 py-3.5">
        {c.segment ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">{c.segment}</span>
        ) : <span className="text-xs text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-3.5"><StatusBadge status={c.status} size="sm" /></td>
      <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
        {c.lastContactAt ? (daysSince(c.lastContactAt) === 0 ? '🟢 Hoje' : `${daysSince(c.lastContactAt)}d atrás`) : '—'}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          {c.messages.length === 0 && (
            <button onClick={onSendInitial} className="text-xs px-2 py-1.5 rounded-lg font-medium flex items-center gap-1 text-white" style={{ background: '#25D366' }}>
              <MessageCircle size={10} /> Enviar
            </button>
          )}
          {c.status === 'followup' && c.followUpCount < c.maxFollowUps && (
            <button onClick={onSendFollowUp} className="text-xs px-2 py-1.5 rounded-lg font-medium flex items-center gap-1 text-white" style={{ background: '#f59e0b' }}>
              <Clock size={10} /> FU
            </button>
          )}
          <Link to={`/app/contatos/${c.id}`} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center">
            <ArrowRight size={12} />
          </Link>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Contact Card (Grid View) ───────────────────────────────
function ContactCard({ contact: c, onSendInitial, onSendFollowUp, onDelete }: {
  contact: Contact; onSendInitial: () => void; onSendFollowUp: () => void; onDelete: () => void;
}) {
  const ls = getLeadScore(c);
  return (
    <div className={`bg-card rounded-2xl border overflow-hidden hover:shadow-md transition-all ${c.status === 'followup' ? 'border-amber-200' : 'border-border'}`}>
      {/* Header com gradiente */}
      <div className="px-4 py-4" style={{ background: `linear-gradient(135deg, ${ls.bg}, white)` }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-sm"
              style={{ background: STATUS_COLORS[c.status] ?? 'var(--primary)' }}>
              {c.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <Link to={`/app/contatos/${c.id}`} className="font-bold text-sm text-foreground hover:text-primary">{c.name}</Link>
              <p className="text-xs text-muted-foreground">{c.company}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <span className="text-xs font-black" style={{ color: ls.color }}>{ls.score}</span>
              {ls.score >= 80 && <span>🔥</span>}
            </div>
            <p className="text-xs font-semibold" style={{ color: ls.color }}>{ls.label}</p>
          </div>
        </div>
        {/* Score bar */}
        <div className="mt-3 h-1.5 rounded-full bg-white/60 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${ls.score}%`, background: ls.color }} />
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-1.5">
        {c.segment && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star size={10} /> <span>{c.segment}</span>
          </div>
        )}
        {(c.city || c.state) && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin size={10} /> <span>{[c.city, c.state].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {c.email && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
            <Mail size={10} /> <span className="truncate">{c.email}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <StatusBadge status={c.status} size="sm" />
          <span className="text-xs text-muted-foreground">
            {c.lastContactAt ? (daysSince(c.lastContactAt) === 0 ? '🟢 Hoje' : `${daysSince(c.lastContactAt)}d`) : 'Nunca'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-1.5">
        {c.messages.length === 0 && (
          <button onClick={onSendInitial} className="flex-1 text-xs py-2 rounded-xl font-semibold text-white flex items-center justify-center gap-1" style={{ background: '#25D366' }}>
            <MessageCircle size={11} /> Enviar
          </button>
        )}
        {c.status === 'followup' && c.followUpCount < c.maxFollowUps && (
          <button onClick={onSendFollowUp} className="flex-1 text-xs py-2 rounded-xl font-semibold text-white flex items-center justify-center gap-1" style={{ background: '#f59e0b' }}>
            <Clock size={11} /> Follow-up
          </button>
        )}
        <Link to={`/app/contatos/${c.id}`} className="flex-1 text-xs py-2 rounded-xl font-semibold border border-border text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
          <Eye size={11} /> Ver perfil
        </Link>
        <button onClick={onDelete} className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
