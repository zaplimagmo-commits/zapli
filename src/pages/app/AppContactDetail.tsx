import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth, useProspect } from '@/hooks/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Phone, Mail, Building2, MapPin, MessageCircle, Send, ExternalLink, CheckCircle2, Clock, Star, AlertTriangle, UserCheck } from 'lucide-react';
import type { ContactStatus } from '@/lib/index';
import { formatPhone, formatDateTime, getWhatsAppLink, daysSince, STATUS_LABELS, buildMessage } from '@/lib/index';

export default function AppContactDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { contacts, sendInitialMessage, sendFollowUp, markPositiveResponse, markConverted, addMessage, updateStatus, templates } = useProspect();
  const contact = contacts.find(c => c.id === id);
  const [customMsg, setCustomMsg] = useState('');
  const [waModal, setWaModal] = useState<{ message: string; link: string } | null>(null);
  const [showStatus, setShowStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<ContactStatus>('aguardando');

  if (!contact) {
    return <AppLayout><div className="flex items-center justify-center h-96"><p className="text-muted-foreground">Contato não encontrado.</p></div></AppLayout>;
  }

  function open(msg: string) { setWaModal({ message: msg, link: getWhatsAppLink(contact!.phone, msg) }); }

  function handleSendInitial() { const r = sendInitialMessage(contact.id, user?.companyName ?? ''); if (r) open(r.message); }
  function handleSendFollowUp() { const r = sendFollowUp(contact.id, user?.companyName ?? ''); if (r) open(r.message); }
  function handleCustom() {
    if (!customMsg.trim()) return;
    addMessage(contact.id, customMsg.trim(), 'sent', 'human');
    open(customMsg.trim());
    setCustomMsg('');
  }
  function handleSimulate() {
    const opts = ['Olá! Sim, tenho interesse. Pode me enviar mais informações?', 'Oi! Que coincidência, estava procurando exatamente isso. Pode ligar?', 'Boa tarde! Podemos conversar semana que vem?'];
    addMessage(contact.id, opts[Math.floor(Math.random() * opts.length)], 'received');
    markPositiveResponse(contact.id);
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
          {/* Left info */}
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0" style={{ background: 'var(--primary)' }}>
                  {contact.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">{contact.name}</h1>
                  <p className="text-sm text-muted-foreground">{contact.company}</p>
                  <div className="mt-1.5"><StatusBadge status={contact.status} /></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone size={13} /><span className="font-mono">{formatPhone(contact.phone)}</span></div>
                {contact.email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail size={13} /><span>{contact.email}</span></div>}
                {contact.city && <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin size={13} /><span>{contact.city}/{contact.state}</span></div>}
                {contact.segment && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Building2 size={13} /><span>{contact.segment}</span></div>}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Ações</p>
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
                {contact.status !== 'convertido' && contact.status !== 'arquivado' && (
                  <Button onClick={handleSimulate} variant="outline" className="w-full justify-start gap-2 text-sm border-purple-300 text-purple-700 hover:bg-purple-50">
                    <Star size={14} /> Simular Resposta Positiva
                  </Button>
                )}
                {contact.status === 'respondido' && (
                  <Button onClick={() => markConverted(contact.id)} className="w-full justify-start gap-2 text-sm" style={{ background: '#059669' }}>
                    <CheckCircle2 size={14} /> Marcar como Convertido
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start gap-2 text-sm text-muted-foreground"
                  onClick={() => { setNewStatus(contact.status); setShowStatus(true); }}>
                  <UserCheck size={14} /> Alterar Status
                </Button>
              </div>
            </div>

            {contact.notes && (
              <div className="rounded-xl border p-4" style={{ background: '#fffbeb', borderColor: '#fcd34d' }}>
                <p className="text-xs font-semibold text-amber-800 mb-1">Observações</p>
                <p className="text-xs text-amber-700">{contact.notes}</p>
              </div>
            )}
          </div>

          {/* Right messages */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', minHeight: 480 }}>
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <MessageCircle size={14} className="text-primary" />
                <h2 className="font-semibold text-sm text-foreground">Histórico de Mensagens</h2>
                <span className="text-xs text-muted-foreground">({contact.messages.length})</span>
              </div>
              <div className="flex-1 p-5 space-y-3 overflow-y-auto" style={{ maxHeight: 420 }}>
                {contact.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <MessageCircle size={20} className="text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
                    <p className="text-xs text-muted-foreground mt-1">Clique em <strong>Enviar Mensagem Inicial</strong>.</p>
                  </div>
                ) : contact.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-sm flex flex-col gap-1 ${msg.type === 'sent' ? 'items-end' : 'items-start'}`}>
                      {/* Nome do remetente humano — exibe em negrito acima da mensagem */}
                      {msg.source === 'human' && msg.type === 'sent' && msg.sentByName && (
                        <span className="text-xs font-bold px-1" style={{ color: 'var(--primary)' }}>
                          {msg.sentByName}:
                        </span>
                      )}
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.type === 'sent' ? 'text-white rounded-br-sm' : 'text-foreground rounded-bl-sm bg-muted'}`}
                        style={msg.type === 'sent' ? { background: msg.isFollowUp ? '#d97706' : (msg.source === 'human' ? '#059669' : 'var(--primary)') } : {}}>
                        {msg.isFollowUp && (
                          <span className="block text-xs font-bold mb-1 opacity-80" style={{ fontSize: 10 }}>
                            🔁 Follow-up #{msg.followUpNumber}
                          </span>
                        )}
                        {msg.source === 'bot' && msg.type === 'sent' && (
                          <span className="block text-xs mb-1 opacity-70" style={{ fontSize: 10 }}>🤖 Bot</span>
                        )}
                        {msg.content}
                      </div>
                      <span className="text-xs text-muted-foreground px-1" style={{ fontSize: 11 }}>
                        {formatDateTime(msg.timestamp)}{msg.type === 'sent' ? ` · ${msg.status === 'read' ? '✓✓' : '✓'}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Mensagem personalizada</p>
                <div className="flex gap-2">
                  <Textarea placeholder="Digite uma mensagem..." value={customMsg} onChange={e => setCustomMsg(e.target.value)} className="resize-none text-sm" rows={2} />
                  <Button onClick={handleCustom} disabled={!customMsg.trim()} className="shrink-0 self-end gap-1.5" style={{ background: '#25D366', borderColor: '#25D366' }}>
                    <Send size={13} /> Enviar
                  </Button>
                </div>
              </div>
            </div>
            {(contact.status === 'aguardando' || contact.status === 'followup') && contact.followUpCount < contact.maxFollowUps && contact.messages.length > 0 && (
              <div className="rounded-xl border p-4" style={{ background: '#fffbeb', borderColor: '#fcd34d' }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={13} style={{ color: '#d97706' }} />
                  <p className="text-xs font-semibold text-amber-800">Pré-visualização — Follow-up #{contact.followUpCount + 1}</p>
                </div>
                <p className="text-xs text-amber-700 whitespace-pre-wrap leading-relaxed pl-5">{nextTpl()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {waModal && (
        <Dialog open={!!waModal} onOpenChange={() => setWaModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><MessageCircle size={17} style={{ color: '#25D366' }} /> Enviar via WhatsApp</DialogTitle></DialogHeader>
            <div className="py-2 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'var(--primary)' }}>
                  {contact.name.slice(0, 2).toUpperCase()}
                </div>
                <div><p className="font-medium text-sm text-foreground">{contact.name}</p><p className="text-xs text-muted-foreground">{formatPhone(contact.phone)}</p></div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap border border-border" style={{ maxHeight: 200, overflowY: 'auto', fontSize: 13 }}>
                {waModal.message}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWaModal(null)}>Fechar</Button>
              <a href={waModal.link} target="_blank" rel="noopener noreferrer">
                <Button className="flex items-center gap-2" style={{ background: '#25D366', borderColor: '#25D366' }}>
                  <ExternalLink size={13} /> Abrir WhatsApp
                </Button>
              </a>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Status Modal */}
      <Dialog open={showStatus} onOpenChange={setShowStatus}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Alterar Status</DialogTitle></DialogHeader>
          <Select value={newStatus} onValueChange={v => setNewStatus(v as ContactStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{(['aguardando', 'followup', 'respondido', 'convertido', 'arquivado'] as ContactStatus[]).map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatus(false)}>Cancelar</Button>
            <Button onClick={() => { updateStatus(contact.id, newStatus); setShowStatus(false); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
