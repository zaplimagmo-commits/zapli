import { useState } from 'react';
import { useProspect } from '@/hooks/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MessageSquare, Edit2, Save, X, Info } from 'lucide-react';

const TYPE_LABELS: Record<string, { label: string; desc: string; color: string }> = {
  initial: { label: 'Mensagem Inicial', desc: 'Primeiro contato com o lead', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  followup_1: { label: 'Follow-up 1', desc: '+3 dias sem resposta', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  followup_2: { label: 'Follow-up 2', desc: '+6 dias sem resposta', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  followup_3: { label: 'Follow-up 3', desc: 'Última tentativa (+9 dias)', color: 'bg-red-50 text-red-700 border-red-200' },
};

export default function AppTemplates() {
  const { templates, updateTemplate } = useProspect();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editName, setEditName] = useState('');

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-3xl mx-auto">
        <PageHeader title="Modelos de Mensagem" subtitle="Personalize os textos enviados em cada etapa da cadência" />

        <div className="flex items-start gap-3 p-4 rounded-xl border mb-6" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <Info size={15} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-medium text-blue-800">Variáveis disponíveis</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Use <code className="bg-blue-100 px-1 rounded">[Nome]</code> (primeiro nome do contato),{' '}
              <code className="bg-blue-100 px-1 rounded">[Empresa]</code> (sua empresa) e{' '}
              <code className="bg-blue-100 px-1 rounded">[EmpresaContato]</code> (empresa do lead).
            </p>
          </div>
        </div>

        {/* Cadence flow */}
        <div className="bg-card rounded-xl border border-border p-5 mb-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Fluxo de Cadência</p>
          <div className="flex items-center gap-2 flex-wrap">
            {[{ l: 'Cadastro', c: '#6366f1' }, null, { l: 'Dia 0', c: '#3b82f6' }, null, { l: '+3 dias', c: '#d97706' }, null, { l: '+6 dias', c: '#ea580c' }, null, { l: '+9 dias', c: '#dc2626' }, null, { l: 'Arquivado', c: '#9ca3af' }].map((item, i) => (
              item === null ? <span key={i} className="text-muted-foreground font-bold text-sm">→</span> : (
                <div key={i} className="text-center">
                  <div className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: item.c }}>{item.l}</div>
                </div>
              )
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">✅ Resposta positiva interrompe o fluxo e notifica a equipe comercial.</p>
        </div>

        <div className="space-y-4">
          {templates.map(tpl => {
            const info = TYPE_LABELS[tpl.type] || { label: tpl.type, desc: '', color: 'bg-gray-50 text-gray-600 border-gray-200' };
            const isEditing = editingId === tpl.id;
            return (
              <div key={tpl.id} className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}>
                      <MessageSquare size={14} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                      {isEditing ? (
                        <Input value={editName} onChange={e => setEditName(e.target.value)} className="text-sm h-7 w-44 font-medium" />
                      ) : (
                        <h3 className="font-semibold text-sm text-foreground">{tpl.name}</h3>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full border inline-block mt-0.5 ${info.color}`}>
                        {info.label} {info.desc && `· ${info.desc}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { updateTemplate(tpl.id, editContent, editName); setEditingId(null); }}>
                          <Save size={11} /> Salvar
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingId(null)}>
                          <X size={11} />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setEditingId(tpl.id); setEditContent(tpl.content); setEditName(tpl.name); }}>
                        <Edit2 size={11} /> Editar
                      </Button>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  {isEditing ? (
                    <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={7} className="text-sm resize-none" style={{ fontSize: 13 }} />
                  ) : (
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed" style={{ fontSize: 13 }}>{tpl.content}</p>
                  )}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {tpl.variables.map(v => (
                      <code key={v} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">[{v}]</code>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
