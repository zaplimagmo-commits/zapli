import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProspectContext } from '@/hooks/ProspectContext';
import { Layout } from '@/components/Layout';
import { StatusBadge, PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Search, Filter, Phone, MapPin, Building2,
  ArrowRight, Clock, AlertTriangle, ExternalLink, Trash2, MessageCircle
} from 'lucide-react';
import type { Prospect, ProspectStatus } from '@/lib/index';
import { STATUS_LABELS, formatPhone, formatDate, daysUntil, daysSince, getWhatsAppLink } from '@/lib/index';
import { messageTemplates, companySettings } from '@/data/index';
import { buildMessage } from '@/lib/index';

const FILTER_OPTIONS: { label: string; value: ProspectStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Aguardando', value: 'aguardando' },
  { label: 'Follow-up', value: 'followup' },
  { label: 'Respondido', value: 'respondido' },
  { label: 'Convertido', value: 'convertido' },
  { label: 'Arquivado', value: 'arquivado' },
];

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function Prospects() {
  const { prospects, addProspect, sendInitialMessage, sendFollowUp, deleteProspect } = useProspectContext();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProspectStatus | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [whatsappModal, setWhatsappModal] = useState<{ prospect: Prospect; message: string; link: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '', office: '', phone: '', city: '', state: 'SP',
    specialization: '', email: '', notes: '',
  });

  const filtered = prospects.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.office.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search);
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function handleAdd() {
    if (!form.name || !form.phone || !form.office) return;
    addProspect({ ...form });
    setForm({ name: '', office: '', phone: '', city: '', state: 'SP', specialization: '', email: '', notes: '' });
    setShowAdd(false);
  }

  function handleSendInitial(id: string) {
    const result = sendInitialMessage(id);
    if (result) {
      const link = getWhatsAppLink(result.prospect.phone, result.message);
      setWhatsappModal({ prospect: result.prospect, message: result.message, link });
    }
  }

  function handleSendFollowUp(id: string) {
    const result = sendFollowUp(id);
    if (result) {
      const link = getWhatsAppLink(result.prospect.phone, result.message);
      setWhatsappModal({ prospect: result.prospect, message: result.message, link });
    }
  }

  const followupCount = prospects.filter(p => p.status === 'followup').length;

  return (
    <Layout>
      <div className="px-8 py-7 max-w-7xl mx-auto">
        <PageHeader
          title="Prospecções"
          subtitle={`${prospects.length} arquitetos cadastrados`}
          action={
            <Button onClick={() => setShowAdd(true)} className="flex items-center gap-2 text-sm">
              <Plus size={16} />
              Novo Arquiteto
            </Button>
          }
        />

        {/* Follow-up banner */}
        {followupCount > 0 && (
          <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border"
            style={{ background: '#fffbeb', borderColor: '#fcd34d' }}>
            <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
            <p className="text-sm font-medium" style={{ color: '#92400e' }}>
              {followupCount} {followupCount === 1 ? 'arquiteto precisa' : 'arquitetos precisam'} de follow-up agora.
              Filtre por <span className="font-bold">Follow-up</span> para ver quem contatar.
            </p>
            <button
              className="text-xs font-semibold ml-auto underline"
              style={{ color: '#d97706' }}
              onClick={() => setFilterStatus('followup')}
            >
              Filtrar
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, escritório ou telefone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filterStatus === opt.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
                }`}
              >
                {opt.label}
                <span className="ml-1.5 opacity-70">
                  ({opt.value === 'all' ? prospects.length : prospects.filter(p => p.status === opt.value).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Arquiteto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Escritório</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">WhatsApp</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cidade</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Último Contato</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-14 text-muted-foreground text-sm">
                      Nenhum arquiteto encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map(p => (
                    <ProspectRow
                      key={p.id}
                      prospect={p}
                      onSendInitial={() => handleSendInitial(p.id)}
                      onSendFollowUp={() => handleSendFollowUp(p.id)}
                      onDelete={() => deleteProspect(p.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Prospect Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Arquiteto</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block">Nome completo *</Label>
              <Input placeholder="Ex: Carlos Mendes" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block">Escritório / Empresa *</Label>
              <Input placeholder="Ex: CM Arquitetura" value={form.office}
                onChange={e => setForm(f => ({ ...f, office: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">WhatsApp (só números) *</Label>
              <Input placeholder="11987654321" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">E-mail</Label>
              <Input placeholder="email@escritorio.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Cidade</Label>
              <Input placeholder="São Paulo" value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Estado</Label>
              <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block">Especialização</Label>
              <Input placeholder="Ex: Residencial alto padrão" value={form.specialization}
                onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block">Observações</Label>
              <Input placeholder="Notas internas..." value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={!form.name || !form.phone || !form.office}>
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Send Modal */}
      {whatsappModal && (
        <Dialog open={!!whatsappModal} onOpenChange={() => setWhatsappModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle size={18} style={{ color: '#25D366' }} />
                Enviar via WhatsApp
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: 'var(--primary)' }}>
                  {whatsappModal.prospect.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{whatsappModal.prospect.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPhone(whatsappModal.prospect.phone)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">MENSAGEM A ENVIAR:</p>
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap border border-border"
                  style={{ maxHeight: 200, overflowY: 'auto', fontSize: 13 }}>
                  {whatsappModal.message}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Clique em <strong>Abrir WhatsApp</strong> para enviar a mensagem pelo WhatsApp Web ou aplicativo.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWhatsappModal(null)}>Fechar</Button>
              <a href={whatsappModal.link} target="_blank" rel="noopener noreferrer">
                <Button className="flex items-center gap-2" style={{ background: '#25D366', borderColor: '#25D366' }}>
                  <ExternalLink size={14} />
                  Abrir WhatsApp
                </Button>
              </a>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}

function ProspectRow({
  prospect: p,
  onSendInitial,
  onSendFollowUp,
  onDelete,
}: {
  prospect: Prospect;
  onSendInitial: () => void;
  onSendFollowUp: () => void;
  onDelete: () => void;
}) {
  const noMessages = p.messages.length === 0;
  const isFollowUpDue = p.status === 'followup';
  const canFollowUp = p.followUpCount < p.maxFollowUps && (p.status === 'aguardando' || p.status === 'followup');
  const isArchived = p.status === 'arquivado';

  return (
    <tr className={`hover:bg-muted/20 transition-colors ${isFollowUpDue ? 'bg-amber-50/30' : ''}`}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'var(--primary)' }}>
            {p.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <Link to={`/prospeccoes/${p.id}`}
              className="font-medium text-foreground hover:text-primary transition-colors text-sm">
              {p.name}
            </Link>
            {p.specialization && (
              <p className="text-xs text-muted-foreground">{p.specialization}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-sm text-muted-foreground">{p.office}</td>
      <td className="px-4 py-3.5">
        <span className="text-sm text-foreground font-mono" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
          {formatPhone(p.phone)}
        </span>
      </td>
      <td className="px-4 py-3.5 text-sm text-muted-foreground">
        {p.city ? `${p.city}/${p.state}` : p.state || '—'}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <StatusBadge status={p.status} size="sm" />
          {p.followUpCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({p.followUpCount}/{p.maxFollowUps})
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3.5 text-sm text-muted-foreground">
        {p.lastContactAt ? (
          <span>{daysSince(p.lastContactAt) === 0 ? 'Hoje' : `${daysSince(p.lastContactAt)}d atrás`}</span>
        ) : '—'}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          {noMessages && !isArchived && (
            <button
              onClick={onSendInitial}
              className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
              style={{ background: '#25D366', color: 'white' }}
              title="Enviar mensagem inicial"
            >
              <MessageCircle size={12} />
              Enviar
            </button>
          )}
          {isFollowUpDue && canFollowUp && (
            <button
              onClick={onSendFollowUp}
              className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
              style={{ background: '#d97706', color: 'white' }}
              title={`Enviar Follow-up #${p.followUpCount + 1}`}
            >
              <Clock size={12} />
              Follow-up
            </button>
          )}
          <Link to={`/prospeccoes/${p.id}`}
            className="text-xs px-2.5 py-1.5 rounded-lg font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center gap-1">
            <ArrowRight size={12} />
            Detalhes
          </Link>
          <button
            onClick={onDelete}
            className="text-xs px-2 py-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Remover"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}
