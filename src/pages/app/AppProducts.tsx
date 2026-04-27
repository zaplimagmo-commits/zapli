import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { defaultProducts, ANTI_BLOCKING_RULES } from '@/data/sendData';
import type { Product } from '@/lib/index';
import { Plus, Edit2, Trash2, Package, MessageSquare, Save, X, ChevronDown, ChevronUp } from 'lucide-react';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#ec4899','#14b8a6'];
const CATEGORIES = ['Construção','Parceria','SaaS','Consultoria','Saúde','Educação','Varejo','Serviços','Indústria','Outro'];

const TEMPLATE_LABELS: Record<keyof Product['templates'], string> = {
  initial: '📩 Mensagem Inicial',
  followup_1: '🔁 Follow-up 1 (+3 dias)',
  followup_2: '🔁 Follow-up 2 (+6 dias)',
  followup_3: '🔁 Follow-up 3 — Final',
};

export default function AppProducts() {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Product & { templates: Product['templates'] }>>({
    name: '', description: '', category: 'Serviços', color: '#6366f1',
    templates: { initial: '', followup_1: '', followup_2: '', followup_3: '' },
  });
  const [editingTpl, setEditingTpl] = useState<string | null>(null);

  function resetForm() {
    setForm({ name: '', description: '', category: 'Serviços', color: '#6366f1', templates: { initial: '', followup_1: '', followup_2: '', followup_3: '' } });
  }

  function handleSave() {
    if (!form.name) return;
    if (editingId) {
      setProducts(prev => prev.map(p => p.id !== editingId ? p : { ...p, ...form } as Product));
      setEditingId(null);
    } else {
      const np: Product = {
        id: `prod_${Date.now()}`, userId: 'u1', name: form.name!, description: form.description || '',
        category: form.category || 'Serviços', color: form.color || '#6366f1',
        templates: form.templates || { initial: '', followup_1: '', followup_2: '', followup_3: '' },
        createdAt: new Date(),
      };
      setProducts(prev => [np, ...prev]);
    }
    resetForm(); setShowAdd(false);
  }

  function startEdit(p: Product) {
    setForm({ ...p }); setEditingId(p.id); setShowAdd(true);
  }

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-5xl mx-auto">
        <PageHeader
          title="Produtos e Ofertas"
          subtitle="Crie produtos/serviços com templates de mensagem próprios para cada oferta"
          action={
            <Button onClick={() => { resetForm(); setEditingId(null); setShowAdd(true); }}
              className="flex items-center gap-2 text-sm" style={{ background: 'var(--emerald)' }}>
              <Plus size={15} /> Novo Produto
            </Button>
          }
        />

        {/* Info */}
        <div className="flex items-start gap-3 p-4 rounded-xl border mb-6" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <Package size={15} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-medium text-emerald-800">Como funciona</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Crie um produto/serviço para cada oferta que você prospecta. Ao cadastrar um contato, selecione qual produto será apresentado.
              O sistema usará automaticamente os templates daquele produto nas mensagens.
            </p>
          </div>
        </div>

        {/* Products grid */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-card rounded-xl border border-border">
            <Package size={32} className="text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum produto cadastrado.</p>
            <p className="text-xs text-muted-foreground mt-1">Crie seu primeiro produto para começar a prospectar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map(p => (
              <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', borderLeft: `4px solid ${p.color}` }}>
                <div className="px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${p.color}18` }}>
                    <Package size={18} style={{ color: p.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground text-sm">{p.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full border font-medium"
                        style={{ background: `${p.color}12`, color: p.color, borderColor: `${p.color}30` }}>
                        {p.category}
                      </span>
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {Object.values(p.templates).filter(t => t.trim()).length}/4 templates configurados
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} className="h-8 w-8 p-0">
                      {expandedId === p.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => startEdit(p)} className="h-8 gap-1 text-xs">
                      <Edit2 size={12} /> Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setProducts(prev => prev.filter(x => x.id !== p.id))}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500">
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>

                {/* Templates expanded */}
                {expandedId === p.id && (
                  <div className="border-t border-border">
                    <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
                      {(Object.entries(TEMPLATE_LABELS) as [keyof Product['templates'], string][]).map(([key, label]) => (
                        <div key={key} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-foreground">{label}</p>
                            <button onClick={() => setEditingTpl(editingTpl === `${p.id}-${key}` ? null : `${p.id}-${key}`)}
                              className="text-xs text-primary hover:underline flex items-center gap-1">
                              <Edit2 size={10} /> Editar
                            </button>
                          </div>
                          {editingTpl === `${p.id}-${key}` ? (
                            <div className="space-y-2">
                              <Textarea
                                defaultValue={p.templates[key]}
                                rows={4}
                                className="text-xs resize-none"
                                id={`tpl-${p.id}-${key}`}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" className="h-6 text-xs gap-1"
                                  onClick={() => {
                                    const el = document.getElementById(`tpl-${p.id}-${key}`) as HTMLTextAreaElement;
                                    setProducts(prev => prev.map(prod => prod.id !== p.id ? prod : {
                                      ...prod, templates: { ...prod.templates, [key]: el?.value || '' }
                                    }));
                                    setEditingTpl(null);
                                  }}>
                                  <Save size={10} /> Salvar
                                </Button>
                                <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setEditingTpl(null)}>
                                  <X size={10} />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-4"
                              style={{ minHeight: 60 }}>
                              {p.templates[key] || <span className="italic">Não configurado</span>}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2.5 border-t border-border bg-muted/20">
                      <p className="text-xs text-muted-foreground">
                        Variáveis: <code className="bg-muted px-1 rounded">[Nome]</code>{' '}
                        <code className="bg-muted px-1 rounded">[Empresa]</code>{' '}
                        <code className="bg-muted px-1 rounded">[EmpresaContato]</code>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd} onOpenChange={() => { setShowAdd(false); resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Produto' : 'Novo Produto / Oferta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-xs mb-1.5 block">Nome do produto / serviço *</Label>
                <Input placeholder="Ex: Serviço de Construção Residencial" value={form.name || ''}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs mb-1.5 block">Descrição curta</Label>
                <Input placeholder="Ex: Obras residenciais com acabamento premium" value={form.description || ''}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Categoria</Label>
                <select value={form.category || 'Serviços'} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Cor de identificação</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-lg border-2 transition-all"
                      style={{ background: c, borderColor: form.color === c ? '#000' : 'transparent', transform: form.color === c ? 'scale(1.15)' : 'scale(1)' }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Templates de Mensagem <span className="normal-case font-normal">(use [Nome], [Empresa], [EmpresaContato])</span>
              </p>
              <div className="space-y-4">
                {(Object.entries(TEMPLATE_LABELS) as [keyof Product['templates'], string][]).map(([key, label]) => (
                  <div key={key}>
                    <Label className="text-xs mb-1.5 block font-medium">{label}</Label>
                    <Textarea
                      placeholder={`Texto da ${label.toLowerCase()}...`}
                      value={form.templates?.[key] || ''}
                      onChange={e => setForm(f => ({ ...f, templates: { ...f.templates!, [key]: e.target.value } as Product['templates'] }))}
                      rows={4}
                      className="text-sm resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name} style={{ background: 'var(--emerald)' }}>
              {editingId ? 'Salvar alterações' : 'Criar produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
