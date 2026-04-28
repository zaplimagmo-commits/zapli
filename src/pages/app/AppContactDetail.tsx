import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth, useProspect } from '@/hooks/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Phone, Mail, Building2, MapPin, MessageCircle, Send, CheckCircle2, Clock, Star, AlertTriangle, UserCheck, Trash2 } from 'lucide-react';
import type { ContactStatus } from '@/lib/index';
import { formatPhone, formatDateTime, getWhatsAppLink, STATUS_LABELS, buildMessage } from '@/lib/index';

export default function AppContactDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { contacts, sendInitialMessage, sendFollowUp, markPositiveResponse, markConverted, addMessage, updateStatus, templates, deleteContact } = useProspect();
  const contact = contacts.find(c => c.id === id);
  const [customMsg, setCustomMsg] = useState('');
  const [waModal, setWaModal] = useState<{ message: string; link: string } | null>(null);
  const [showStatus, setShowStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<ContactStatus>('aguardando');

  if (!contact) {
    return <AppLayout><div className="flex items-center justify-center h-96"><p className="text-muted-foreground">Contato não encontrado.</p></div></AppLayout>;
  }

  function open(msg: string) { setWaModal({ message: msg, link: getWhatsAppLink(contact!.phone, msg) }); }

  function handleSendInitial() { const r = sendInitialMessage(contact!.id, user?.companyName ?? ''); if (r) open(r.message); }
  function handleSendFollowUp() { const r = sendFollowUp(contact!.id, user?.companyName ?? ''); if (r) open(r.message); }
  function handleCustom() {
    if (!customMsg.trim()) return;
    addMessage(contact!.id, customMsg.trim(), 'sent', 'human');
    open(customMsg.trim());
    setCustomMsg('');
  }
  
  const nextTpl = () => {
    const num = contact.followUpCount + 1;
    const tpl = templates.find(t => t.type === `followup_${num}`) || templates.find(t => t.type === 'followup_1');
    if (!tpl) return '';
    return buildMessage(tpl.content, { Nome: contact.name.split(' ')[0], Empresa: user?.companyName ?? '', EmpresaContato: contact.company });
  };

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-6xl mx-auto">
        <Link to="/app/contatos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
          <ArrowLeft size={14} /> Voltar para Contatos
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold text-white bg-primary shrink-0">{contact.name.slice(0, 2).toUpperCase()}</div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">{contact.name}</h1>
                  <p className="text-sm text-muted-foreground">{contact.company}</p>
                  <div className="mt-1.5"><StatusBadge status={contact.status} /></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone size={13} /><span className="font-mono">{formatPhone(contact.phone)}</span></div>
                {contact.email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail size={13} /><span>{contact.email}</span></div>}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Ações Reais</p>
              <div className="space-y-2">
                {contact.messages.length === 0 && (
                  <Button onClick={handleSendInitial} className="w-full justify-start gap-2 text-sm" style={{ background: '#25D366', borderColor: '#25D366' }}>
                    <MessageCircle size={14} /> Enviar Mensagem Inicial
                  </Button>
                )}
                {(contact.status === 'aguardando' || contact.status === 'followup') && contact.followUpCount < contact.maxFollowUps && contact.messages.length > 0 && (
                  <Button onClick={handleSendFollowUp} variant="outline" className="w-full justify-start gap-2 text-sm border-amber-300 text-amber-700 hover:bg-amber-50">
                    <Clock size={14} /> Follow-up #{contact.followUpCount + 1}
                  </Button>
                )}
                {contact.status === 'respondido' && (
                  <Button onClick={() => markConverted(contact.id)} className="w-full justify-start gap-2 text-sm" style={{ background: '#059669' }}>
                    <CheckCircle2 size={14} /> Marcar como Convertido
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start gap-2 text-sm text-muted-foreground" onClick={() => setShowStatus(true)}><UserCheck size={14} /> Alterar Status</Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col shadow-sm" style={{ minHeight: 480 }}>
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <MessageCircle size={14} className="text-primary" />
                <h2 className="font-semibold text-sm text-foreground">Histórico Real</h2>
                <span className="text-xs text-muted-foreground">({contact.messages.length})</span>
              </div>
              <div className="flex-1 p-5 space-y-3 overflow-y-auto" style={{ maxHeight: 420 }}>
                {contact.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <MessageCircle size={20} className="text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
                  </div>
                ) : contact.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-sm flex flex-col gap-1 ${msg.type === 'sent' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.type === 'sent' ? 'text-white rounded-br-sm' : 'text-foreground rounded-bl-sm bg-muted'}`}
                        style={msg.type === 'sent' ? { background: msg.isFollowUp ? '#d97706' : (msg.source === 'human' ? '#059669' : 'var(--primary)') } : {}}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-muted-foreground px-1">{formatDateTime(new Date(msg.timestamp))}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border p-4">
                <div className="flex gap-2">
                  <Textarea placeholder="Digite uma mensagem..." value={customMsg} onChange={e => setCustomMsg(e.target.value)} className="resize-none text-sm" rows={2} />
                  <Button onClick={handleCustom} disabled={!customMsg.trim()} className="shrink-0 self-end gap-1.5" style={{ background: '#25D366', borderColor: '#25D366' }}><Send size={13} /> Enviar</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showStatus} onOpenChange={setShowStatus}>
        <DialogContent>
          <DialogHeader><DialogTitle>Alterar Status</DialogTitle></DialogHeader>
          <div className="py-4">
            <select value={newStatus} onChange={e => setNewStatus(e.target.value as ContactStatus)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              {Object.entries(STATUS_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatus(false)}>Cancelar</Button>
            <Button onClick={() => { updateStatus(contact.id, newStatus); setShowStatus(false); }} className="text-white" style={{ background: 'var(--primary)' }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {waModal && (
        <Dialog open={!!waModal} onOpenChange={() => setWaModal(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Enviar via WhatsApp</DialogTitle></DialogHeader>
            <div className="py-4 text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">{waModal.message}</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWaModal(null)}>Fechar</Button>
              <a href={waModal.link} target="_blank" rel="noreferrer"><Button className="text-white" style={{ background: '#25D366' }}>Abrir WhatsApp</Button></a>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
