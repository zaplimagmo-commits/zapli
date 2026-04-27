import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader, PlanBadge } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { mockUsers } from '@/data/index';
import type { User } from '@/lib/index';
import { formatDate, formatCurrency, SUB_STATUS, PLANS } from '@/lib/index';
import { Search, MoreVertical, Ban, RefreshCw, TrendingUp, Mail } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>(mockUsers.filter(u => u.role === 'user'));
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [detailUser, setDetailUser] = useState<User | null>(null);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.companyName.toLowerCase().includes(q)) &&
      (filterPlan === 'all' || u.planId === filterPlan) &&
      (filterStatus === 'all' || u.subscriptionStatus === filterStatus);
  });

  function cancelUser(id: string) {
    setUsers(prev => prev.map(u => u.id !== id ? u : { ...u, subscriptionStatus: 'cancelled' }));
  }

  function reactivateUser(id: string) {
    setUsers(prev => prev.map(u => u.id !== id ? u : { ...u, subscriptionStatus: 'active' }));
  }

  function upgradePlan(id: string, planId: string) {
    setUsers(prev => prev.map(u => u.id !== id ? u : { ...u, planId: planId as User['planId'] }));
  }

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-7xl mx-auto">
        <PageHeader title="Gerenciar Usuários" subtitle={`${users.length} clientes cadastrados`} />

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
                {filtered.map(u => {
                  const sub = SUB_STATUS[u.subscriptionStatus];
                  const plan = PLANS[u.planId];
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
                            <DropdownMenuItem>
                              <Mail size={13} className="mr-2" /> Enviar e-mail
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
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
                  { label: 'Status', value: SUB_STATUS[detailUser.subscriptionStatus].label },
                  { label: 'Contatos usados', value: `${detailUser.contactsUsed} / ${PLANS[detailUser.planId].maxContacts ?? '∞'}` },
                  { label: 'Cadastrado em', value: formatDate(detailUser.createdAt) },
                  { label: 'Último login', value: formatDate(detailUser.lastLoginAt) },
                  { label: 'MRR', value: detailUser.subscriptionStatus === 'active' ? formatCurrency(PLANS[detailUser.planId].price) : '—' },
                ].map(item => (
                  <div key={item.label} className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                    <div className="text-sm font-medium text-foreground">{item.value}</div>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Alterar Plano</p>
                <div className="flex gap-2">
                  {(['starter', 'pro', 'business'] as const).map(p => (
                    <button key={p} onClick={() => { upgradePlan(detailUser.id, p); setDetailUser(prev => prev ? { ...prev, planId: p } : null); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${detailUser.planId === p ? 'text-white' : 'text-muted-foreground hover:border-primary/50'}`}
                      style={detailUser.planId === p ? { background: 'var(--emerald)', borderColor: 'var(--emerald)' } : {}}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
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
