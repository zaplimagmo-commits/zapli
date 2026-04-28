import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MessageSquare, Edit2, Save, X, Info, Loader2 } from 'lucide-react';
import { db } from '@/lib/supabase';
import type { MessageTemplate } from '@/lib/index';

const TYPE_LABELS: Record<string, { label: string; desc: string; color: string }> = {
  initial: { label: 'Mensagem Inicial', desc: 'Primeiro contato com o lead', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  followup_1: { label: 'Follow-up 1', desc: '+3 dias sem resposta', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  followup_2: { label: 'Follow-up 2', desc: '+6 dias sem resposta', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  followup_3: { label: 'Follow-up 3', desc: 'Última tentativa (+9 dias)', color: 'bg-red-50 text-red-700 border-red-200' },
};

export default function AppTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (user?.tenantId) loadTemplates();
  }, [user?.tenantId]);

  async function loadTemplates() {
    setLoading(true);
    try {
      const { data } = await db
        .from('message_templates')
        .select('*')
        .eq('tenant_id', user?.tenantId);
      
      if (data) {
        setTemplates(data.map(t => ({
          id: t.id,
          userId: t.user_id,
          name: t.name,
          content: t.content,
          type: t.type,
          variables: t.variables || ['Nome', 'Empresa', 'EmpresaContato']
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(id: string) {
    try {
      await db.from('message_templates').update({
        name: editName,
        content: editContent
      }).eq('id', id);
      
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, name: editName, content: editContent } : t));
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-3xl mx-auto">
        <PageHeader title="Modelos de Mensagem Reais" subtitle="Personalize os textos enviados em cada etapa da cadência" />

        <div className="flex items-start gap-3 p-4 rounded-xl border mb-6" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <Info size={15} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-medium text-blue-800">Variáveis disponíveis</p>
            <p className="text-xs text-blue-700 mt-0.5">Use [Nome], [Empresa] e [EmpresaContato].</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4">
            {templates.map(tpl => {
              const info = TYPE_LABELS[tpl.type] || { label: tpl.type, desc: '', color: 'bg-gray-50 text-gray-600 border-gray-200' };
              const isEditing = editingId === tpl.id;
              return (
                <div key={tpl.id} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare size={14} className="text-primary" />
                      <div>
                        {isEditing ? <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 w-44" /> : <h3 className="font-semibold text-sm">{tpl.name}</h3>}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border inline-block mt-0.5 ${info.color}`}>{info.label}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <><Button size="sm" className="h-7 text-xs" onClick={() => handleSave(tpl.id)}><Save size={11} /> Salvar</Button><Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingId(null)}><X size={11} /></Button></>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditingId(tpl.id); setEditContent(tpl.content); setEditName(tpl.name); }}><Edit2 size={11} /> Editar</Button>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    {isEditing ? <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={5} className="text-sm" /> : <p className="text-sm whitespace-pre-wrap">{tpl.content}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
