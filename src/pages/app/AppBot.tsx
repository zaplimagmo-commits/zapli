import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useConfirm } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { BotRule, BotAction, CampaignChannel } from '@/lib/index';
import { Bot, Plus, Zap, MessageCircle, Instagram, Play, Pause, Trash2, Info, ChevronRight, Settings, ArrowRight } from 'lucide-react';

const ACTION_CFG: Record<BotAction, { label: string; color: string; bg: string; emoji: string }> = {
  reply:         { label: 'Responder automaticamente', color: '#6366f1', bg: '#eef2ff', emoji: '💬' },
  mark_positive: { label: 'Marcar resposta positiva',   color: '#059669', bg: '#f0fdf4', emoji: '✅' },
  archive:       { label: 'Arquivar contato',            color: '#6b7280', bg: '#f9fafb', emoji: '📁' },
  notify_team:   { label: 'Notificar equipe comercial',  color: '#d97706', bg: '#fffbeb', emoji: '🔔' },
  add_tag:       { label: 'Adicionar tag',               color: '#0ea5e9', bg: '#f0f9ff', emoji: '🏷️' },
  escalate:      { label: 'Escalar para humano',         color: '#8b5cf6', bg: '#f5f3ff', emoji: '👤' },
};

const defaultRules: BotRule[] = [
  {
    id: 'br1', userId: 'u1', channel: 'whatsapp', name: 'Detectar interesse positivo', isActive: true, priority: 1,
    trigger: { type: 'keyword', keywords: ['sim', 'quero', 'interesse', 'pode', 'vamos', 'topei', 'me manda'], matchAll: false },
    action: 'mark_positive',
    notifyMessage: '🎯 Lead com interesse! Entrar em contato agora.',
    createdAt: new Date(),
  },
  {
    id: 'br2', userId: 'u1', channel: 'ambos', name: 'Responder "preço" e "valor"', isActive: true, priority: 2,
    trigger: { type: 'keyword', keywords: ['preço', 'valor', 'quanto', 'custo', 'investimento'] },
    action: 'reply',
    replyMessage: 'Oi! 😊 Para te passar os valores com precisão, preciso entender melhor sua necessidade. Posso te ligar em 5 minutinhos?',
    createdAt: new Date(),
  },
  {
    id: 'br3', userId: 'u1', channel: 'whatsapp', name: 'Detectar recusa', isActive: true, priority: 3,
    trigger: { type: 'keyword', keywords: ['não tenho interesse', 'não preciso', 'para de mandar', 'remova', 'sair da lista'] },
    action: 'archive',
    replyMessage: 'Entendido! Não enviarei mais mensagens. Fico à disposição se precisar no futuro. 🤝',
    createdAt: new Date(),
  },
  {
    id: 'br4', userId: 'u1', channel: 'ambos', name: 'Notificar se lead responder qualquer coisa', isActive: false, priority: 4,
    trigger: { type: 'any_message' },
    action: 'notify_team',
    notifyMessage: '💬 Lead respondeu! Ver conversa no Zapli.',
    createdAt: new Date(),
  },
];

export default function AppBot() {
  const [rules, setRules] = useState<BotRule[]>(defaultRules);
  const { confirm, ConfirmNode } = useConfirm();

  async function handleDeleteRule(id: string, name: string) {
    const ok = await confirm({
      title: 'Excluir regra',
      message: `Tem certeza que deseja excluir a regra "${name}"? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Sim, excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (ok) setRules(prev => prev.filter(r => r.id !== id));
  }
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<{
    name: string; channel: CampaignChannel; triggerType: BotRule['trigger']['type'];
    keywords: string; action: BotAction; replyMessage: string; notifyMessage: string;
  }>({ name: '', channel: 'ambos', triggerType: 'keyword', keywords: '', action: 'reply', replyMessage: '', notifyMessage: '' });

  function toggleRule(id: string) { setRules(prev => prev.map(r => r.id !== id ? r : { ...r, isActive: !r.isActive })); }
  function deleteRule(id: string) { setRules(prev => prev.filter(r => r.id !== id)); }

  function saveRule() {
    if (!form.name) return;
    const nr: BotRule = {
      id: `br_${Date.now()}`, userId: 'u1', channel: form.channel, name: form.name, isActive: true, priority: rules.length + 1,
      trigger: { type: form.triggerType, keywords: form.triggerType === 'keyword' ? form.keywords.split(',').map(k => k.trim()).filter(Boolean) : undefined },
      action: form.action, replyMessage: form.replyMessage || undefined, notifyMessage: form.notifyMessage || undefined,
      createdAt: new Date(),
    };
    setRules(prev => [...prev, nr]);
    setShowAdd(false);
    setForm({ name: '', channel: 'ambos', triggerType: 'keyword', keywords: '', action: 'reply', replyMessage: '', notifyMessage: '' });
  }

  const activeCount = rules.filter(r => r.isActive).length;

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-4xl mx-auto">
        <PageHeader
          title="Bot de Auto-Resposta"
          subtitle="Configure respostas automáticas inteligentes para WhatsApp e Instagram"
          action={
            <Button onClick={() => setShowAdd(true)} className="gap-2 text-sm text-white" style={{ background: 'var(--emerald)' }}>
              <Plus size={15} /> Nova Regra
            </Button>
          }
        />

        {/* Status */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border p-4 flex items-center gap-3" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <Bot size={18} style={{ color: '#059669' }} />
            <div>
              <p className="text-lg font-bold text-emerald-700">{activeCount} ativas</p>
              <p className="text-xs text-emerald-600">Regras rodando agora</p>
            </div>
          </div>
          <div className="rounded-xl border p-4 flex items-center gap-3" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
            <MessageCircle size={18} style={{ color: '#0ea5e9' }} />
            <div>
              <p className="text-lg font-bold text-sky-700">WhatsApp</p>
              <p className="text-xs text-sky-600">{rules.filter(r => r.channel !== 'instagram' && r.isActive).length} regras ativas</p>
            </div>
          </div>
          <div className="rounded-xl border p-4 flex items-center gap-3" style={{ background: '#fdf2f8', borderColor: '#f9a8d4' }}>
            <Instagram size={18} style={{ color: '#E1306C' }} />
            <div>
              <p className="text-lg font-bold" style={{ color: '#E1306C' }}>Instagram</p>
              <p className="text-xs" style={{ color: '#E1306C80' }}>{rules.filter(r => r.channel !== 'whatsapp' && r.isActive).length} regras ativas</p>
            </div>
          </div>
        </div>

        {/* Explicação */}
        <div className="flex items-start gap-3 p-4 rounded-xl border mb-5" style={{ background: '#eef2ff', borderColor: '#c7d2fe' }}>
          <Info size={15} style={{ color: '#6366f1', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-semibold text-indigo-800">Como o bot funciona</p>
            <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
              As regras são avaliadas em ordem de prioridade. Quando um lead manda uma mensagem, o bot verifica cada regra de cima para baixo e executa a <strong>primeira que der match</strong>.
              Você pode ativar/desativar cada regra individualmente.
            </p>
          </div>
        </div>

        {/* Fluxo visual */}
        <div className="bg-card rounded-xl border border-border p-4 mb-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Fluxo do Bot</p>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {[
              { l: 'Lead envia msg', c: '#6366f1' }, null,
              { l: 'Webhook captura', c: '#0ea5e9' }, null,
              { l: 'Bot analisa texto', c: '#8b5cf6' }, null,
              { l: 'Regra com match?', c: '#d97706' }, null,
              { l: 'Ação executada', c: '#059669' }, null,
              { l: 'Log no histórico', c: '#6b7280' },
            ].map((item, i) =>
              item === null
                ? <ArrowRight key={i} size={12} className="text-muted-foreground" />
                : <span key={i} className="px-2.5 py-1 rounded-lg font-medium text-white" style={{ background: item.c }}>{item.l}</span>
            )}
          </div>
        </div>

        {/* Rules list */}
        <div className="space-y-3">
          {rules.map((rule, idx) => {
            const aCfg = ACTION_CFG[rule.action];
            return (
              <div key={rule.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-4">
                  {/* Prioridade */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: rule.isActive ? '#f0fdf4' : '#f9fafb', color: rule.isActive ? '#059669' : '#9ca3af' }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-foreground">{rule.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: aCfg.bg, color: aCfg.color }}>
                        {aCfg.emoji} {aCfg.label}
                      </span>
                      {/* Canal */}
                      <span className="text-xs flex items-center gap-1 text-muted-foreground">
                        {rule.channel === 'whatsapp' && <><MessageCircle size={10} style={{ color: '#25D366' }} /> WA</>}
                        {rule.channel === 'instagram' && <><Instagram size={10} style={{ color: '#E1306C' }} /> IG</>}
                        {rule.channel === 'ambos' && <><MessageCircle size={10} style={{ color: '#25D366' }} /><Instagram size={10} style={{ color: '#E1306C' }} /> Ambos</>}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {rule.trigger.type === 'keyword' && `Palavras: ${rule.trigger.keywords?.join(', ')}`}
                      {rule.trigger.type === 'any_message' && 'Qualquer mensagem recebida'}
                      {rule.trigger.type === 'no_reply_days' && `Sem resposta há ${rule.trigger.days} dias`}
                    </div>
                    {rule.replyMessage && <p className="text-xs text-muted-foreground mt-0.5 italic line-clamp-1">↳ "{rule.replyMessage}"</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle */}
                    <button onClick={() => toggleRule(rule.id)}
                      className="relative w-11 h-6 rounded-full transition-colors"
                      style={{ background: rule.isActive ? 'var(--emerald)' : '#e5e7eb' }}>
                      <span className="absolute top-0.5 transition-all w-5 h-5 rounded-full bg-white shadow"
                        style={{ left: rule.isActive ? '1.375rem' : '0.125rem' }} />
                    </button>
                    <button onClick={() => handleDeleteRule(rule.id, rule.name)} className="text-muted-foreground hover:text-red-500 p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Regra do Bot</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-xs mb-1.5 block">Nome da regra *</Label><Input placeholder="Ex: Detectar interesse" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Canal</Label>
                <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value as CampaignChannel }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Gatilho</Label>
                <select value={form.triggerType} onChange={e => setForm(f => ({ ...f, triggerType: e.target.value as BotRule['trigger']['type'] }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="keyword">Palavra-chave</option>
                  <option value="any_message">Qualquer mensagem</option>
                  <option value="no_reply_days">Sem resposta N dias</option>
                </select>
              </div>
            </div>
            {form.triggerType === 'keyword' && (
              <div><Label className="text-xs mb-1.5 block">Palavras-chave (separadas por vírgula)</Label><Input placeholder="sim, quero, interesse, pode" value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} /></div>
            )}
            <div>
              <Label className="text-xs mb-1.5 block">Ação</Label>
              <select value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value as BotAction }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {Object.entries(ACTION_CFG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
              </select>
            </div>
            {form.action === 'reply' && (
              <div><Label className="text-xs mb-1.5 block">Mensagem de resposta</Label><Textarea value={form.replyMessage} onChange={e => setForm(f => ({ ...f, replyMessage: e.target.value }))} rows={3} className="resize-none text-sm" /></div>
            )}
            {form.action === 'notify_team' && (
              <div><Label className="text-xs mb-1.5 block">Mensagem para equipe</Label><Input value={form.notifyMessage} onChange={e => setForm(f => ({ ...f, notifyMessage: e.target.value }))} placeholder="Ex: Lead quente! Entrar em contato ASAP" /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={saveRule} disabled={!form.name} className="text-white" style={{ background: 'var(--emerald)' }}>Criar Regra</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {ConfirmNode}
    </AppLayout>
  );
}
