import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Edit2, Save, X, Info } from 'lucide-react';
import { messageTemplates as defaultTemplates } from '@/data/index';
import type { MessageTemplate } from '@/lib/index';

const TYPE_LABELS: Record<string, string> = {
  initial: 'Mensagem Inicial',
  followup_1: 'Follow-up 1 (3 dias sem resposta)',
  followup_2: 'Follow-up 2 (6 dias sem resposta)',
  followup_3: 'Follow-up 3 — Final (9 dias sem resposta)',
};

const TYPE_COLORS: Record<string, string> = {
  initial: 'bg-blue-50 text-blue-700 border-blue-200',
  followup_1: 'bg-amber-50 text-amber-700 border-amber-200',
  followup_2: 'bg-orange-50 text-orange-700 border-orange-200',
  followup_3: 'bg-red-50 text-red-700 border-red-200',
};

export default function Templates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>(defaultTemplates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editName, setEditName] = useState('');

  function startEdit(tpl: MessageTemplate) {
    setEditingId(tpl.id);
    setEditContent(tpl.content);
    setEditName(tpl.name);
  }

  function saveEdit(id: string) {
    setTemplates(prev =>
      prev.map(t => t.id === id ? { ...t, content: editContent, name: editName } : t)
    );
    setEditingId(null);
  }

  return (
    <Layout>
      <div className="px-8 py-7 max-w-4xl mx-auto">
        <PageHeader
          title="Modelos de Mensagem"
          subtitle="Personalize os textos enviados em cada etapa da prospecção"
        />

        {/* Info card */}
        <div className="flex items-start gap-3 p-4 rounded-xl border mb-6"
          style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <Info size={16} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-medium text-blue-800">Variáveis disponíveis</p>
            <p className="text-xs text-blue-700 mt-1">
              Use <code className="bg-blue-100 px-1 rounded">[Nome]</code> para o primeiro nome do arquiteto,{' '}
              <code className="bg-blue-100 px-1 rounded">[Construtora]</code> para o nome da sua empresa e{' '}
              <code className="bg-blue-100 px-1 rounded">[Escritório]</code> para o escritório do arquiteto.
              Elas serão substituídas automaticamente ao enviar.
            </p>
          </div>
        </div>

        {/* Flow diagram */}
        <div className="bg-card rounded-xl border border-border p-5 mb-6"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Fluxo de Automação</p>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: 'Cadastro', sub: 'Arquiteto adicionado', color: '#3b82f6' },
              { label: '→', sub: '', color: '' },
              { label: 'Msg Inicial', sub: 'Dia 0', color: '#3b82f6' },
              { label: '→', sub: '', color: '' },
              { label: 'Follow-up 1', sub: '+3 dias', color: '#d97706' },
              { label: '→', sub: '', color: '' },
              { label: 'Follow-up 2', sub: '+6 dias', color: '#ea580c' },
              { label: '→', sub: '', color: '' },
              { label: 'Follow-up 3', sub: '+9 dias', color: '#dc2626' },
              { label: '→', sub: '', color: '' },
              { label: 'Arquivado', sub: 'Sem resposta', color: '#9ca3af' },
            ].map((item, i) => (
              item.label === '→' ? (
                <span key={i} className="text-muted-foreground font-bold">→</span>
              ) : (
                <div key={i} className="text-center">
                  <div className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                    style={{ background: item.color }}>
                    {item.label}
                  </div>
                  {item.sub && <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>}
                </div>
              )
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            ✅ Respostas positivas interrompem o fluxo e notificam a equipe comercial automaticamente.
          </p>
        </div>

        {/* Templates */}
        <div className="space-y-4">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-card rounded-xl border border-border overflow-hidden"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}>
                    <MessageSquare size={15} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    {editingId === tpl.id ? (
                      <Input value={editName} onChange={e => setEditName(e.target.value)}
                        className="text-sm h-7 w-48 font-medium" />
                    ) : (
                      <h3 className="font-semibold text-sm text-foreground">{tpl.name}</h3>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full border inline-block mt-0.5 ${TYPE_COLORS[tpl.type] || ''}`}>
                      {TYPE_LABELS[tpl.type] || tpl.type}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {editingId === tpl.id ? (
                    <>
                      <Button size="sm" onClick={() => saveEdit(tpl.id)} className="h-7 text-xs gap-1">
                        <Save size={12} /> Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-7 text-xs gap-1">
                        <X size={12} /> Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => startEdit(tpl)} className="h-7 text-xs gap-1">
                      <Edit2 size={12} /> Editar
                    </Button>
                  )}
                </div>
              </div>
              <div className="p-5">
                {editingId === tpl.id ? (
                  <Textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={8}
                    className="text-sm font-mono resize-none"
                    style={{ fontFamily: 'inherit', fontSize: 13 }}
                  />
                ) : (
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed"
                    style={{ fontSize: 13 }}>
                    {tpl.content}
                  </p>
                )}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {tpl.variables.map(v => (
                    <code key={v} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      [{v}]
                    </code>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
