import { useState } from 'react';
import { useAuth, useProspect } from '@/hooks/AppContext';
import { useConfirm } from '@/components/ConfirmDialog';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Users, UserPlus, Crown, UserCheck, Headphones, Trash2, Edit2,
  Activity, BarChart3, Mail, Phone, Calendar, CheckCircle2, Zap
} from 'lucide-react';
import type { TeamMember, TeamRole, ActivityType } from '@/lib/index';

const ROLE_CFG: Record<TeamRole, { label: string; icon: any; color: string; bg: string; border: string; desc: string }> = {
  gestor:   { label: 'Gestor',   icon: <Crown size={13} />,     color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', desc: 'Acesso total — gerencia equipe, vê todos os leads e métricas' },
  vendedor: { label: 'Vendedor', icon: <UserCheck size={13} />, color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', desc: 'Gerencia seus leads atribuídos + todos os leads da equipe' },
  sdr:      { label: 'SDR',      icon: <Headphones size={13} />,color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', desc: 'Prospecção ativa — cadastra leads, dispara mensagens, qualifica' },
};

const ACTIVITY_CFG: Record<ActivityType, { label: string; color: string; emoji: string }> = {
  message_sent:     { label: 'Mensagem enviada',     color: '#6366f1', emoji: '📤' },
  followup_sent:    { label: 'Follow-up enviado',    color: '#f59e0b', emoji: '🔄' },
  message_received: { label: 'Lead respondeu',       color: '#0ea5e9', emoji: '💬' },
  status_changed:   { label: 'Status alterado',      color: '#8b5cf6', emoji: '🔀' },
  deal_created:     { label: 'Deal criado',          color: '#059669', emoji: '🎯' },
  deal_moved:       { label: 'Deal movido',          color: '#0ea5e9', emoji: '➡️' },
  deal_won:         { label: 'Deal fechado!',        color: '#059669', emoji: '🏆' },
  deal_lost:        { label: 'Deal perdido',         color: '#ef4444', emoji: '❌' },
  contact_added:    { label: 'Lead cadastrado',      color: '#6366f1', emoji: '➕' },
  contact_assigned: { label: 'Lead atribuído',       color: '#8b5cf6', emoji: '👤' },
  note_added:       { label: 'Nota adicionada',      color: '#6b7280', emoji: '📝' },
};

function timeAgo(d: Date) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
}

export default function AppTeam() {
  const { user } = useAuth();
  const { teamMembers, activityLog, addTeamMember, updateTeamMember, removeTeamMember } = useProspect();
  const { confirm, ConfirmNode } = useConfirm();
  const [tab, setTab] = useState<'membros' | 'atividade'>('membros');
  const [showAdd, setShowAdd] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'vendedor' as TeamRole });

  async function handleRemoveMember(id: string, name: string) {
    const ok = await confirm({
      title: 'Remover membro',
      message: `Tem certeza que deseja remover "${name}" da equipe? O acesso será revogado imediatamente.`,
      confirmLabel: 'Sim, remover',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (ok) removeTeamMember(id);
  }

  function saveForm() {
    if (!form.name || !form.email) return;
    if (editMember) {
      updateTeamMember(editMember.id, { name: form.name, email: form.email, phone: form.phone, role: form.role });
    } else {
      addTeamMember({ tenantId: user?.tenantId ?? '', name: form.name, email: form.email, phone: form.phone, role: form.role, avatarColor: '#6366f1', isActive: true, dailyGoal: 50, monthlyGoal: 8 });
    }
    setShowAdd(false);
    setEditMember(null);
    setForm({ name: '', email: '', phone: '', role: 'vendedor' });
  }

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-5xl mx-auto">
        <PageHeader
          title="Equipe Comercial"
          subtitle="Gerencie os usuários e acompanhe as atividades em tempo real"
          action={
            <Button onClick={() => setShowAdd(true)} className="gap-2 text-sm text-white" style={{ background: 'var(--emerald)' }}>
              <UserPlus size={15} /> Convidar Membro
            </Button>
          }
        />

        <div className="flex gap-1 p-1 bg-muted/30 rounded-xl border mb-6 w-fit">
          <button onClick={() => setTab('membros')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'membros' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Membros</button>
          <button onClick={() => setTab('atividade')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'atividade' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Atividade</button>
        </div>

        {tab === 'membros' && (
          <div className="grid md:grid-cols-2 gap-4">
            {teamMembers.map(m => {
              const cfg = ROLE_CFG[m.role];
              return (
                <div key={m.id} className="bg-card rounded-xl border border-border p-5 flex items-start gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0" style={{ background: m.avatarColor }}>
                    {m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-sm truncate">{m.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1" style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon} {cfg.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail size={11} /> {m.email}</p>
                    {m.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1"><Phone size={11} /> {m.phone}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleRemoveMember(m.id, m.name)} className="text-muted-foreground hover:text-red-500 p-1"><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'atividade' && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {activityLog.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground text-sm">Nenhuma atividade registrada ainda.</div>
              ) : activityLog.map(a => {
                const cfg = ACTIVITY_CFG[a.type];
                return (
                  <div key={a.id} className="px-5 py-4 flex items-start gap-4 hover:bg-muted/5 transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0" style={{ background: `${cfg.color}15` }}>{cfg.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground"><span className="font-bold">{a.memberName}</span> {cfg.label.toLowerCase()} para <span className="font-medium">{a.contactName}</span></p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.details}</p>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground shrink-0">{timeAgo(a.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Convidar Membro</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-xs mb-1.5 block">Nome Completo *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">E-mail *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1.5 block">Papel na Equipe</Label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as TeamRole }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {Object.entries(ROLE_CFG).map(([id, cfg]) => <option key={id} value={id}>{cfg.label}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={saveForm} className="text-white" style={{ background: 'var(--primary)' }}>Enviar Convite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {ConfirmNode}
    </AppLayout>
  );
}
