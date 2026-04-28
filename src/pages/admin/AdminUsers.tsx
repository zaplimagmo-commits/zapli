import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader, PlanBadge } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { User } from '@/lib/index';
import { formatDate, formatCurrency, SUB_STATUS, PLANS } from '@/lib/index';
import { Search, MoreVertical, Ban, RefreshCw, TrendingUp, Mail, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { db } from '@/lib/supabase';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [detailUser, setDetailUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data: profileRows } = await db
        .from('users')
        .select('*, tenants(*)')
        .eq('system_role', 'user')
        .order('created_at', { ascending: false });

      if (profileRows) {
        const mapped: User[] = profileRows.map(row => {
          const tenant = row.tenants as any;
          return {
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.system_role,
            tenantRole: row.tenant_role,
            tenantId: row.tenant_id,
            companyName: tenant?.name || 'Sem empresa',
            planId: (tenant?.plan || 'starter') as User['planId'],
            subscriptionStatus: (tenant?.plan_status === 'active' ? 'active' : 'trial') as User['subscriptionStatus'],
            contactsUsed: 0,
            createdAt: new Date(row.created_at),
            lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : new Date(row.created_at),
            avatarColor: '#6366f1'
          };
        });
        setUsers(mapped);
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.companyName.toLowerCase().includes(q)) &&
      (filterPlan === 'all' || u.planId === filterPlan) &&
      (filterStatus === 'all' || u.subscriptionStatus === filterStatus);
  });

  async function cancelUser(id: string) {
    // Implementação futura: Integração com Stripe/Supabase
    setUsers(prev => prev.map(u => u.id !== id ? u : { ...u, subscriptionStatus: 'cancelled' }));
  }

  async function reactivateUser(id: string) {
    setUsers(prev => prev.map(u => u.id !== id ? u : { ...u, subscriptionStatus: 'active' }));
  }

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-7xl mx-auto">
        <PageHeader title="Gerenciar Usuários" subtitle={`${users.length} clientes reais cadastrados`} />

        {/* Summary row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: users.length, color: 'var(--primary)' },
            { label: 'Ativos', value: users.filter(u => u.subscriptionStatus === 'active').length, color: '#059669' },
            { label: 'Trial', value: users.filter(u => u.subscriptionStatus === 'trial').length, color: '#d97706' },
            { label: 'Inadimplentes', value: users.filter(u => u.subscriptionStatus === 'past_due').length, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl border border-border px-4 py-3 flex items-center gap-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome, e-mail ou empresa..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-sm" />
          </div>
          <Select value={filterPlan} onValueChange={setFilterPlan}>
            <SelectTrigger className="w-36 text-sm"><SelectValue placeholder="Plano" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
              <SelectItem value="past_due">Inadimplente</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Cliente', 'E-mail', 'Plano', 'Status', 'Contatos', 'MRR', 'Cadastro', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-20 text-muted-foreground">Carregando usuários...</td></tr>
                ) : filtered.map(u => {
                  const sub = SUB_STATUS[u.subscriptionStatus] || SUB_STATUS.trial;
                  const plan = PLANS[u.planId] || PLANS.starter;
                  return (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'var(--primary)' }}>
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <button onClick={() => setDetailUser(u)} className="font-medium text-foreground hover:text-primary text-sm transition-colors">{u.name}</button>
                            <p className="text-xs text-muted-foreground">{u.companyName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">{u.email}</td>
                      <td className="px-5 py-3.5"><PlanBadge planId={u.planId} /></td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full border" style={{ background: `${sub.color}15`, color: sub.color, borderColor: `${sub.color}30` }}>
                          {sub.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-foreground">
                        {u.contactsUsed} / {plan.maxContacts ?? '∞'}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-foreground">
                        {u.subscriptionStatus === 'active' ? formatCurrency(plan.price) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreVertical size={14} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailUser(u)}>
                              <TrendingUp size={13} className="mr-2" /> Ver detalhes
                            </DropdownMenuItem>
                            {u.subscriptionStatus !== 'active' && (
                              <DropdownMenuItem onClick={() => reactivateUser(u.id)}>
                                <RefreshCw size={13} className="mr-2" /> Reativar
                              </DropdownMenuItem>
                            )}
                            {u.subscriptionStatus === 'active' && (
                              <DropdownMenuItem onClick={() => cancelUser(u.id)} className="text-red-500">
                                <Ban size={13} className="mr-2" /> Cancelar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-20 text-muted-foreground">Nenhum usuário encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User detail modal */}
      {detailUser && (
        <Dialog open={!!detailUser} onOpenChange={() => setDetailUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Detalhes do Cliente</DialogTitle></DialogHeader>
            <div className="py-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white" style={{ background: 'var(--primary)' }}>
                  {detailUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{detailUser.name}</p>
                  <p className="text-sm text-muted-foreground">{detailUser.companyName}</p>
                  <p className="text-xs text-muted-foreground">{detailUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Plano', value: <PlanBadge planId={detailUser.planId} /> },
                  { label: 'Status', value: (SUB_STATUS[detailUser.subscriptionStatus] || SUB_STATUS.trial).label },
                  { label: 'Contatos usados', value: `${detailUser.contactsUsed} / ${(PLANS[detailUser.planId] || PLANS.starter).maxContacts ?? '∞'}` },
                  { label: 'Cadastrado em', value: formatDate(detailUser.createdAt) },
                  { label: 'Último login', value: formatDate(detailUser.lastLoginAt) },
                  { label: 'MRR', value: detailUser.subscriptionStatus === 'active' ? formatCurrency((PLANS[detailUser.planId] || PLANS.starter).price) : '—' },
                ].map(item => (
                  <div key={item.label} className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                    <div className="text-sm font-medium text-foreground">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailUser(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
