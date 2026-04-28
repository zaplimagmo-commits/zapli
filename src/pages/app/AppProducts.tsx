import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Package, Save, X, Loader2 } from 'lucide-react';
import { db } from '@/lib/supabase';
import type { Product } from '@/lib/index';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#ec4899','#14b8a6'];

export default function AppProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', category: 'Serviços', color: '#6366f1' });

  useEffect(() => {
    if (user?.tenantId) loadProducts();
  }, [user?.tenantId]);

  async function loadProducts() {
    setLoading(true);
    try {
      const { data } = await db.from('products').select('*').eq('tenant_id', user?.tenantId);
      if (data) {
        setProducts(data.map(p => ({
          id: p.id,
          userId: p.user_id,
          name: p.name,
          description: p.description,
          category: p.category,
          color: p.color,
          templates: p.templates || { initial: '', followup_1: '', followup_2: '', followup_3: '' },
          createdAt: new Date(p.created_at)
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.name || !user?.tenantId) return;
    try {
      if (editingId) {
        await db.from('products').update({
          name: form.name,
          description: form.description,
          category: form.category,
          color: form.color
        }).eq('id', editingId);
      } else {
        await db.from('products').insert({
          tenant_id: user.tenantId,
          name: form.name,
          description: form.description,
          category: form.category,
          color: form.color,
          templates: { initial: '', followup_1: '', followup_2: '', followup_3: '' }
        });
      }
      loadProducts();
      setShowAdd(false);
      setEditingId(null);
      setForm({ name: '', description: '', category: 'Serviços', color: '#6366f1' });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este produto?')) return;
    try {
      await db.from('products').delete().eq('id', id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-5xl mx-auto">
        <PageHeader title="Produtos Reais" subtitle="Gerencie suas ofertas e serviços integrados ao banco de dados"
          action={<Button onClick={() => { setEditingId(null); setForm({ name: '', description: '', category: 'Serviços', color: '#6366f1' }); setShowAdd(true); }} className="gap-2 text-sm text-white" style={{ background: 'var(--emerald)' }}><Plus size={15} /> Novo Produto</Button>} />

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-card rounded-xl border border-border p-5 flex items-start gap-4 shadow-sm" style={{ borderLeft: `4px solid ${p.color}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${p.color}18` }}><Package size={18} style={{ color: p.color }} /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{p.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.description || 'Sem descrição'}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground mt-2 inline-block">{p.category}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(p.id); setForm({ name: p.name, description: p.description, category: p.category, color: p.color }); setShowAdd(true); }} className="text-muted-foreground hover:text-primary"><Edit2 size={13} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
            {products.length === 0 && <div className="col-span-2 py-20 text-center text-muted-foreground text-sm">Nenhum produto cadastrado.</div>}
          </div>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Editar Produto' : 'Novo Produto'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-xs mb-1.5 block">Nome do Produto *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">Cor de Identificação</Label>
              <div className="flex gap-2 flex-wrap">{COLORS.map(c => <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={`w-6 h-6 rounded-full border-2 ${form.color === c ? 'border-foreground' : 'border-transparent'}`} style={{ background: c }} />)}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="text-white" style={{ background: 'var(--primary)' }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
