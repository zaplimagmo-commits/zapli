import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProspect } from '@/hooks/AppContext';
import { useConfirm } from '@/components/ConfirmDialog';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Client, ClientStatus } from '@/lib/index';
import { ROUTES, formatPhone } from '@/lib/index';
import { Building2, Users, DollarSign, TrendingUp, Heart, Plus, Search, Trash2, ArrowRight, Zap, Phone, MapPin } from 'lucide-react';

const fc = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });

const STATUS_CFG: Record<ClientStatus, { label: string; bg: string; text: string; border: string }> = {
  ativo:    { label: 'Ativo',        bg: '#f0fdf4', text: '#059669', border: '#bbf7d0' },
  inativo:  { label: 'Inativo',      bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb' },
  em_risco: { label: 'Em Risco ⚠️', bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  churned:  { label: 'Churned',      bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
};

function healthColor(s: number) {
  if (s >= 80) return '#10b981';
  if (s >= 60) return '#f59e0b';
  if (s >= 40) return '#f97316';
  return '#ef4444';
}

export default function AppClients() {
  const { clients, addClient, deleteClient } = useProspect();
  const { confirm, ConfirmNode } = useConfirm();

  async function handleDeleteClient(id: string, name: string) {
    const ok = await confirm({
      title: 'Excluir cliente',
      message: `Tem certeza que deseja excluir "${name}"? Todos os dados, contatos e histórico serão perdidos permanentemente.`,
      confirmLabel: 'Sim, excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (ok) deleteClient(id);
  }

  const [search, setSearch] = useState('');
  const [sf, setSf] = useState<ClientStatus | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    companyName: '', segment: '', city: '', state: 'SP',
    contactName: '', contactPhone: '', contactEmail: '', contactRole: 'Sócio',
    notes: '', status: 'ativo' as ClientStatus,
  });

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (c.companyName.toLowerCase().includes(q) || c.segment.toLowerCase().includes(q)) &&
      (sf === 'all' || c.status === sf);
  });

  const kpis = useMemo(() => ({
    total: clients.length,
    ltv: clients.reduce((s, c) => s + c.ltv, 0),
    mrr: clients.reduce((s, c) => s + (c.mrr ?? 0), 0),
    health: clients.length ? Math.round(clients.reduce((s, c) => s + c.healthScore, 0) / clients.length) : 0,
  }), [clients]);

  function handleAdd() {
    if (!form.companyName || !form.contactName || !form.contactPhone) return;
    addClient({
      companyName: form.companyName, segment: form.segment,
      city: form.city, state: form.state,
      status: form.status, healthScore: 70, ltv: 0, mrr: 0,
      acquisitionDate: new Date(), fromProspecting: false,
      contacts: [{ id: `cc_${Date.now()}`, name: form.contactName, role: form.contactRole, phone: form.contactPhone, email: form.contactEmail, isPrimary: true, whatsapp: form.contactPhone }],
      products: [], proposals: [], interactions: [],
      tags: [], notes: form.notes,
    });
    setForm({ companyName: '', segment: '', city: '', state: 'SP', contactName: '', contactPhone: '', contactEmail: '', contactRole: 'Sócio', notes: '', status: 'ativo' });
    setShowAdd(false);
  }

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-7xl mx-auto">
        <PageHeader
          title="Clientes"
          subtitle={`${clients.length} clientes na base — sua carteira completa`}
          action={
            <Button onClick={() => setShowAdd(true)} className="gap-2 text-sm text-white" style={{ background: 'var(--emerald)' }}>
              <Plus size={15} /> Novo Cliente
            </Button>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total de clientes', value: kpis.total,        icon: Users,       color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
            { label: 'LTV acumulado',      value: fc(kpis.ltv),     icon: DollarSign,  color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'MRR mensal',         value: fc(kpis.mrr),     icon: TrendingUp,  color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
            { label: 'Health médio',       value: `${kpis.health}%`, icon: Heart,       color: healthColor(kpis.health), bg: '#fff7ed', border: '#fed7aa' },
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

        {/* Filtros */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar empresa ou segmento..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-sm" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'ativo', 'em_risco', 'inativo', 'churned'] as const).map(s => (
              <button key={s} onClick={() => setSf(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${sf === s ? 'text-white border-transparent' : 'bg-card text-muted-foreground border-border hover:border-primary/30'}`}
                style={sf === s ? { background: 'var(--primary)' } : {}}>
                {s === 'all' ? `Todos (${clients.length})` : `${STATUS_CFG[s].label} (${clients.filter(c => c.status === s).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border">
            <Building2 size={30} className="text-muted-foreground mb-3 opacity-40" />
            <p className="text-sm font-medium text-muted-foreground">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(client => {
              const stCfg = STATUS_CFG[client.status];
              const primary = client.contacts.find(c => c.isPrimary) ?? client.contacts[0];
              return (
                <div key={client.id} className="bg-card rounded-xl border border-border flex flex-col overflow-hidden hover:shadow-md transition-shadow"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div className="p-5 flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: 'var(--primary)' }}>
                        {client.companyName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate text-sm">{client.companyName}</p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          {client.segment} {client.city && <><MapPin size={10} /> {client.city}/{client.state}</>}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteClient(client.id, client.companyName)}
                        className="text-muted-foreground hover:text-red-500 transition-colors p-1">
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Contato */}
                    {primary && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users size={11} /> <span className="font-medium text-foreground">{primary.name}</span>
                        <span className="opacity-50">·</span>
                        <Phone size={11} /> {formatPhone(primary.phone)}
                      </div>
                    )}

                    {/* Status + Health */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full border"
                        style={{ background: stCfg.bg, color: stCfg.text, borderColor: stCfg.border }}>
                        {stCfg.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: healthColor(client.healthScore) }}>{client.healthScore}%</span>
                        <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${client.healthScore}%`, background: healthColor(client.healthScore) }} />
                        </div>
                        <Heart size={11} style={{ color: healthColor(client.healthScore) }} />
                      </div>
                    </div>

                    {/* LTV/MRR */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">LTV</p>
                        <p className="text-sm font-bold text-emerald-600">{fc(client.ltv)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">MRR</p>
                        <p className="text-sm font-bold text-sky-600">{fc(client.mrr ?? 0)}</p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {client.fromProspecting && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: '#fef9c3', color: '#854d0e' }}>
                          <Zap size={9} /> Via Zapli
                        </span>
                      )}
                      {client.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
                      ))}
                      {client.products.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {client.products.length} produto{client.products.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link to={`/app/clientes/${client.id}`}
                    className="flex items-center justify-center gap-2 py-3 text-xs font-semibold border-t border-border transition-colors text-muted-foreground hover:text-primary hover:bg-primary/5">
                    Ver perfil completo <ArrowRight size={12} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Cadastrar Novo Cliente</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block">Empresa *</Label>
              <Input placeholder="Razão social ou nome fantasia" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Segmento *</Label>
              <Input placeholder="Ex: Engenharia Civil" value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as ClientStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="em_risco">Em Risco</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1.5 block">Cidade</Label><Input placeholder="São Paulo" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">UF</Label><Input placeholder="SP" maxLength={2} value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} /></div>

            <div className="col-span-2 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contato Principal *</p>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Nome *</Label>
              <Input placeholder="João Silva" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Cargo</Label>
              <Input placeholder="Sócio / Diretor" value={form.contactRole} onChange={e => setForm(f => ({ ...f, contactRole: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">WhatsApp *</Label>
              <Input placeholder="11987654321" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">E-mail</Label>
              <Input type="email" placeholder="joao@empresa.com" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={!form.companyName || !form.contactName || !form.contactPhone} className="text-white" style={{ background: 'var(--emerald)' }}>
              Cadastrar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {ConfirmNode}
    </AppLayout>
  );
}
