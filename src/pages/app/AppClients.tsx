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
import type { Client, ClientStatus } from '@/lib/index';
import { ROUTES, formatPhone } from '@/lib/index';
import { Building2, Users, DollarSign, TrendingUp, Heart, Plus, Search, Trash2, ArrowRight, MapPin, Phone } from 'lucide-react';

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
  const [search, setSearch] = useState('');
  const [sf, setSf] = useState<ClientStatus | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ companyName: '', segment: '', contactName: '', contactPhone: '', status: 'ativo' as ClientStatus });

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (c.companyName.toLowerCase().includes(q) || c.segment.toLowerCase().includes(q)) && (sf === 'all' || c.status === sf);
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
      companyName: form.companyName, segment: form.segment, city: '', state: 'SP',
      status: form.status, healthScore: 70, ltv: 0, mrr: 0,
      acquisitionDate: new Date(), fromProspecting: false,
      contacts: [{ id: `cc_${Date.now()}`, name: form.contactName, role: 'Sócio', phone: form.contactPhone, email: '', isPrimary: true, whatsapp: form.contactPhone }],
      products: [], proposals: [], interactions: [], tags: [], notes: '',
    });
    setForm({ companyName: '', segment: '', contactName: '', contactPhone: '', status: 'ativo' });
    setShowAdd(false);
  }

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-7xl mx-auto">
        <PageHeader title="Carteira de Clientes" subtitle={`${clients.length} clientes reais ativos`}
          action={<Button onClick={() => setShowAdd(true)} className="gap-2 text-sm text-white" style={{ background: 'var(--emerald)' }}><Plus size={15} /> Novo Cliente</Button>} />

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: kpis.total, icon: Users, color: '#6366f1', bg: '#eef2ff' },
            { label: 'LTV Total', value: fc(kpis.ltv), icon: DollarSign, color: '#059669', bg: '#f0fdf4' },
            { label: 'MRR Atual', value: fc(kpis.mrr), icon: TrendingUp, color: '#0ea5e9', bg: '#f0f9ff' },
            { label: 'Saúde Média', value: `${kpis.health}%`, icon: Heart, color: healthColor(kpis.health), bg: '#fff7ed' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-xl border p-4 flex items-center gap-3" style={{ background: bg, borderColor: `${color}30` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}><Icon size={18} style={{ color }} /></div>
              <div><p className="text-lg font-bold" style={{ color }}>{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-5">
          <div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-sm" /></div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(client => {
            const stCfg = STATUS_CFG[client.status];
            const primary = client.contacts[0];
            return (
              <div key={client.id} className="bg-card rounded-xl border border-border p-5 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white bg-primary shrink-0">{client.companyName.slice(0, 2).toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><p className="font-bold text-foreground truncate text-sm">{client.companyName}</p><p className="text-xs text-muted-foreground truncate">{client.segment}</p></div>
                  <button onClick={() => handleDeleteClient(client.id, client.companyName)} className="text-muted-foreground hover:text-red-500"><Trash2 size={13} /></button>
                </div>
                {primary && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Users size={11} /> <span className="font-medium text-foreground">{primary.name}</span> · <Phone size={11} /> {formatPhone(primary.phone)}</div>}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full border" style={{ background: stCfg.bg, color: stCfg.text, borderColor: stCfg.border }}>{stCfg.label}</span>
                  <div className="flex items-center gap-2"><span className="text-xs font-bold" style={{ color: healthColor(client.healthScore) }}>{client.healthScore}%</span><Heart size={11} style={{ color: healthColor(client.healthScore) }} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                  <div><p className="text-xs text-muted-foreground">LTV</p><p className="text-sm font-bold text-emerald-600">{fc(client.ltv)}</p></div>
                  <div><p className="text-xs text-muted-foreground">MRR</p><p className="text-sm font-bold text-sky-600">{fc(client.mrr ?? 0)}</p></div>
                </div>
                <Link to={`${ROUTES.APP_CLIENTS}/${client.id}`} className="flex items-center justify-center gap-2 py-2 text-xs font-semibold border-t border-border text-muted-foreground hover:text-primary">Ver Detalhes <ArrowRight size={12} /></Link>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-xs mb-1.5 block">Empresa *</Label><Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">Segmento</Label><Input value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">Contato Principal *</Label><Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">WhatsApp *</Label><Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={handleAdd} className="text-white" style={{ background: 'var(--emerald)' }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {ConfirmNode}
    </AppLayout>
  );
}
