import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProspectContext } from '@/hooks/ProspectContext';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  ArrowLeft, Phone, MapPin, Mail, Building2, Clock,
  MessageCircle, Send, ExternalLink, CheckCircle2,
  AlertTriangle, Star, Archive, UserCheck, ChevronRight
} from 'lucide-react';
import type { ProspectStatus } from '@/lib/index';
import { formatPhone, formatDateTime, getWhatsAppLink, daysSince, STATUS_LABELS } from '@/lib/index';
import { messageTemplates, companySettings } from '@/data/index';
import { buildMessage } from '@/lib/index';

export default function ProspectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    prospects, updateStatus, sendInitialMessage, sendFollowUp,
    markPositiveResponse, markConverted, addMessage
  } = useProspectContext();

  const prospect = prospects.find(p => p.id === id);
  const [customMsg, setCustomMsg] = useState('');
  const [whatsappModal, setWhatsappModal] = useState<{ message: string; link: string } | null>(null);
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [newStatus, setNewStatus] = useState<ProspectStatus>('aguardando');

  if (!prospect) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-muted-foreground">Arquiteto não encontrado.</p>
          <Link to="/prospeccoes" className="text-primary text-sm hover:underline">← Voltar</Link>
        </div>
      </Layout>
    );
  }

  function openWhatsapp(message: string) {
    const link = getWhatsAppLink(prospect!.phone, message);
    setWhatsappModal({ message, link });
  }

  function handleSendInitial() {
    const result = sendInitialMessage(prospect!.id);
    if (result) openWhatsapp(result.message);
  }

  function handleSendFollowUp() {
    const result = sendFollowUp(prospect!.id);
    if (result) openWhatsapp(result.message);
  }

  function handleSendCustom() {
    if (!customMsg.trim()) return;
    addMessage(prospect!.id, customMsg.trim(), 'sent');
    openWhatsapp(customMsg.trim());
    setCustomMsg('');
  }

  function handleSimulateResponse() {
    const responses = [
      'Olá! Sim, tenho interesse. Pode me enviar mais informações?',
      'Oi! Que coincidência, estava procurando construtoras para um projeto. Podemos conversar?',
      'Boa tarde! Sim, pode me ligar amanhã de manhã?',
    ];
    const msg = responses[Math.floor(Math.random() * responses.length)];
    addMessage(prospect!.id, msg, 'received');
    markPositiveResponse(prospect!.id);
  }

  const noMessages = prospect.messages.length === 0;
  const canSendInitial = noMessages;
  const canFollowUp = !noMessages && prospect.followUpCount < prospect.maxFollowUps &&
    (prospect.status === 'aguardando' || prospect.status === 'followup');

  const getTemplateForFollowUp = () => {
    const num = prospect.followUpCount + 1;
    const tpl = messageTemplates.find(t => t.type === `followup_${num}` as 'followup_1' | 'followup_2' | 'followup_3')
      || messageTemplates.find(t => t.type === 'followup_1');
    if (!tpl) return '';
    return buildMessage(tpl.content, {
      Nome: prospect.name.split(' ')[0],
      Construtora: companySettings.name,
      Escritório: prospect.office,
    });
  };

  return (
    <Layout>
      <div className="px-8 py-7 max-w-6xl mx-auto">
        {/* Back */}
        <Link to="/prospeccoes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
          <ArrowLeft size={15} />
          Voltar para Prospecções
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Contact Info */}
          <div className="space-y-4">
            {/* Header card */}
            <div className="bg-card rounded-xl border border-border p-5"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0"
                  style={{ background: 'var(--primary)' }}>
                  {prospect.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">{prospect.name}</h1>
                  <p className="text-sm text-muted-foreground">{prospect.office}</p>
                  <div className="mt-2">
                    <StatusBadge status={prospect.status} />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone size={14} className="shrink-0" />
                  <span className="font-mono text-xs">{formatPhone(prospect.phone)}</span>
                </div>
                {prospect.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={14} className="shrink-0" />
                    <span className="text-xs truncate">{prospect.email}</span>
                  </div>
                )}
                {prospect.city && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={14} className="shrink-0" />
                    <span className="text-xs">{prospect.city}/{prospect.state}</span>
                  </div>
                )}
                {prospect.specialization && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 size={14} className="shrink-0" />
                    <span className="text-xs">{prospect.specialization}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-card rounded-xl border border-border p-5"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Timeline</p>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                    <span style={{ fontSize: 9, color: 'white' }}>✓</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Cadastrado</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(prospect.createdAt)}</p>
                  </div>
                </div>
                {prospect.lastContactAt && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                      <span style={{ fontSize: 9, color: 'white' }}>✉</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">Último contato</p>
                      <p className="text-xs text-muted-foreground">
                        {daysSince(prospect.lastContactAt) === 0 ? 'Hoje' : `Há ${daysSince(prospect.lastContactAt)} dias`}
                        {' — '}{formatDateTime(prospect.lastContactAt)}
                      </p>
                    </div>
                  </div>
                )}
                {prospect.followUpCount > 0 && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: '#d97706' }}>
                      <span style={{ fontSize: 9, color: 'white' }}>↻</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {prospect.followUpCount} follow-up{prospect.followUpCount > 1 ? 's' : ''} enviado{prospect.followUpCount > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Máximo: {prospect.maxFollowUps}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-2"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Ações</p>

              {canSendInitial && (
                <Button onClick={handleSendInitial} className="w-full justify-start gap-2 text-sm"
                  style={{ background: '#25D366', borderColor: '#25D366' }}>
                  <MessageCircle size={15} />
                  Enviar Mensagem Inicial
                </Button>
              )}

              {canFollowUp && (
                <Button onClick={handleSendFollowUp} variant="outline"
                  className="w-full justify-start gap-2 text-sm border-amber-300 text-amber-700 hover:bg-amber-50">
                  <Clock size={15} />
                  Enviar Follow-up #{prospect.followUpCount + 1}
                </Button>
              )}

              {prospect.status !== 'convertido' && prospect.status !== 'arquivado' && (
                <Button onClick={handleSimulateResponse} variant="outline"
                  className="w-full justify-start gap-2 text-sm border-purple-300 text-purple-700 hover:bg-purple-50">
                  <Star size={15} />
                  Simular Resposta Positiva
                </Button>
              )}

              {prospect.status === 'respondido' && (
                <Button onClick={() => markConverted(prospect.id)}
                  className="w-full justify-start gap-2 text-sm"
                  style={{ background: '#059669', borderColor: '#059669' }}>
                  <CheckCircle2 size={15} />
                  Marcar como Convertido
                </Button>
              )}

              <Button variant="outline"
                className="w-full justify-start gap-2 text-sm text-muted-foreground"
                onClick={() => { setNewStatus(prospect.status); setShowStatusChange(true); }}>
                <UserCheck size={15} />
                Alterar Status
              </Button>
            </div>

            {prospect.notes && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                <p className="text-xs font-semibold text-amber-800 mb-1">Observações</p>
                <p className="text-xs text-amber-700">{prospect.notes}</p>
              </div>
            )}
          </div>

          {/* Right: Messages */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', minHeight: 480 }}>
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle size={15} className="text-primary" />
                  <h2 className="font-semibold text-sm text-foreground">Histórico de Mensagens</h2>
                  <span className="text-xs text-muted-foreground">({prospect.messages.length})</span>
                </div>
              </div>

              <div className="flex-1 p-5 space-y-4 overflow-y-auto" style={{ maxHeight: 480 }}>
                {prospect.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <MessageCircle size={20} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use o botão <strong>Enviar Mensagem Inicial</strong> para começar.
                    </p>
                  </div>
                ) : (
                  prospect.messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))
                )}
              </div>

              {/* Custom message input */}
              <div className="border-t border-border p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Mensagem personalizada</p>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Digite uma mensagem personalizada..."
                    value={customMsg}
                    onChange={e => setCustomMsg(e.target.value)}
                    className="resize-none text-sm min-h-0"
                    rows={2}
                  />
                  <Button
                    onClick={handleSendCustom}
                    disabled={!customMsg.trim()}
                    className="shrink-0 self-end gap-1.5"
                    style={{ background: '#25D366', borderColor: '#25D366' }}
                  >
                    <Send size={14} />
                    Enviar
                  </Button>
                </div>
              </div>
            </div>

            {/* Follow-up preview */}
            {canFollowUp && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle size={14} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
                  <p className="text-xs font-semibold text-amber-800">
                    Próximo Follow-up #{prospect.followUpCount + 1} — Pré-visualização
                  </p>
                </div>
                <p className="text-xs text-amber-700 whitespace-pre-wrap pl-5 leading-relaxed">
                  {getTemplateForFollowUp()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Modal */}
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
                  {prospect.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{prospect.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPhone(prospect.phone)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">MENSAGEM:</p>
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap border border-border"
                  style={{ maxHeight: 200, overflowY: 'auto', fontSize: 13 }}>
                  {whatsappModal.message}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Clique em <strong>Abrir WhatsApp</strong> para abrir o WhatsApp Web com a mensagem preenchida.
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

      {/* Status Change Modal */}
      <Dialog open={showStatusChange} onOpenChange={setShowStatusChange}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Alterar Status</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Select value={newStatus} onValueChange={v => setNewStatus(v as ProspectStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['aguardando', 'followup', 'respondido', 'convertido', 'arquivado'] as ProspectStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusChange(false)}>Cancelar</Button>
            <Button onClick={() => { updateStatus(prospect.id, newStatus); setShowStatusChange(false); }}>
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function MessageBubble({ message }: { message: { id: string; type: string; content: string; timestamp: Date; status: string; isFollowUp?: boolean; followUpNumber?: number } }) {
  const isSent = message.type === 'sent';
  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-sm xl:max-w-md ${isSent ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {message.isFollowUp && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: '#fef3c7', color: '#92400e', fontSize: 10 }}>
            Follow-up #{message.followUpNumber}
          </span>
        )}
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isSent
            ? 'text-white rounded-br-sm'
            : 'text-foreground rounded-bl-sm bg-muted'
        }`}
          style={isSent ? { background: 'var(--primary)' } : {}}>
          {message.content}
        </div>
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-xs text-muted-foreground" style={{ fontSize: 11 }}>
            {formatDateTime(message.timestamp)}
          </span>
          {isSent && (
            <span className="text-xs text-muted-foreground" style={{ fontSize: 11 }}>
              · {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
