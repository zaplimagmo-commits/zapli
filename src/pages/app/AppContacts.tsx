import { useState, useMemo } from 'react';
import { useAuth, useProspect } from '@/hooks/AppContext';
import { useRole } from '@/hooks/useRole';
import { useConfirm } from '@/components/ConfirmDialog';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge, PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Plus, Search, MessageCircle, Clock, ArrowRight, Trash2,
  AlertTriangle, FileSpreadsheet, Flame, Filter, Reply, CheckCircle2, Users
} from 'lucide-react';
import ExcelImport from '@/components/ExcelImport';
import type { Contact, ContactStatus } from '@/lib/index';
import { formatPhone, formatDate, daysSince, getWhatsAppLink, STATUS_LABELS } from '@/lib/index';

function getLeadScore(c: Contact): { score: number; label: string; color: string; bg: string } {
  let score = 0;
  if (c.messages.length > 0) score += 20;
  if (c.status === 'respondido') score += 30;
  if (c.status === 'followup') score += 15;
  if (c.status === 'convertido') score = 100;
  if (c.email) score += 10;
  score = Math.min(score, 100);
  if (score >= 80) return { score, label: 'Quente', color: '#ef4444', bg: '#fef2f2' };
  if (score >= 50) return { score, label: 'Morno', color: '#f59e0b', bg: '#fffbeb' };
  if (score >= 25) return { score, label: 'Frio', color: '#0ea5e9', bg: '#f0f9ff' };
  return { score, label: 'Novo', color: '#6b7280', bg: '#f9fafb' };
}

export default function AppContacts() {
  const { contacts, addContact, deleteContact } = useProspect();
  const { confirm, ConfirmNode } = useConfirm();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ContactStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'date'>('date');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', notes: '' });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = contacts.filter(c =>
      (c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.phone.includes(q)) &&
      (filterStatus === 'all' || c.status === filterStatus)
    );
    if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'score') list = [...list].sort((a, b) => getLeadScore(b).score - getLeadScore(a).score);
    else list = [...list].sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0));
    return list;
  }, [contacts, search, filterStatus, sortBy]);

  async function handleDeleteContact(id: string, name: string) {
    const ok = await confirm({
      title: 'Excluir contato',
      message: `Tem certeza que deseja excluir "${name}"? Esta ação é irreversível.`,
      confirmLabel: 'Sim, excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (ok) deleteContact(id);
  }

  function handleAdd() {
    if (!form.name || !form.phone || !form.company) return;
    addContact({ ...form, city: '', state: 'SP', segment: '', productId: '' });
    setForm({ name: '', company: '', phone: '', email: '', notes: '' });
    setShowAdd(false);
  }

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <PageHeader
          title="Contatos Reais"
          subtitle={`${contacts.length} contatos na base`}
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowImport(true)} className="gap-2 text-sm"><FileSpreadsheet size={15} /> Importar</Button>
              <Button onClick={() => setShowAdd(true)} className="gap-2 text-sm text-white" style={{ background: 'var(--emerald)' }}><Plus size={15} /> Novo Contato</Button>
            </div>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            { label: 'Total', v: contacts.length, color: '#6366f1', bg: '#eef2ff', icon: Users },
            { label: '🔥 Quentes', v: contacts.filter(c => getLeadScore(c).score >= 80).length, color: '#ef4444', bg: '#fef2f2', icon: Flame },
            { label: 'Follow-up', v: contacts.filter(c => c.status === 'followup').length, color: '#f59e0b', bg: '#fffbeb', icon: Clock },
            { label: 'Responderam', v: contacts.filter(c => c.status === 'respondido').length, color: '#0ea5e9', bg: '#f0f9ff', icon: Reply },
            { label: 'Convertidos', v: contacts.filter(c => c.status === 'convertido').length, color: '#059669', bg: '#f0fdf4', icon: CheckCircle2 },
          ].map(({ label, v, color, bg, icon: Icon }) => (
            <div key={label} className="rounded-xl border p-3 flex items-center gap-2.5" style={{ background: bg, borderColor: `${color}30` }}>
              <Icon size={15} style={{ color }} />
              <div><p className="text-lg font-black" style={{ color }}>{v}</p><p className="text-xs text-muted-foreground">{label}</p></div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-52">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-sm" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">Todos Status</option>
            {Object.entries(STATUS_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Contato</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Score</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(c => {
                const score = getLeadScore(c);
                return (
                  <tr key={c.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-bold text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.company} · {formatPhone(c.phone)}</p>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: score.bg, color: score.color }}>{score.label} {score.score}%</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteContact(c.id, c.name)} className="text-muted-foreground hover:text-red-500"><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Contato</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-xs mb-1.5 block">Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">Empresa *</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">WhatsApp *</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">E-mail</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={handleAdd} className="text-white" style={{ background: 'var(--emerald)' }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {showImport && <ExcelImport onClose={() => setShowImport(false)} onImport={() => {}} />}
      {ConfirmNode}
    </AppLayout>
  );
}
