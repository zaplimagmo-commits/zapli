import { Link } from 'react-router-dom';
import { useProspect } from '@/hooks/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, MessageCircle, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/lib/index';

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string; border: string }> = {
  positive_response: { icon: '💬', label: 'Resposta positiva', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  followup_needed:   { icon: '⏰', label: 'Follow-up pendente', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  converted:         { icon: '🎉', label: 'Convertido',         color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
  system_info:       { icon: '🔔', label: 'Equipe',             color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  system_success:    { icon: '✅', label: 'Deal fechado',        color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
  system_warning:    { icon: '⚠️', label: 'Atenção',             color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
};

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1)   return 'agora';
  if (mins < 60)  return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
}

export default function AppNotifications() {
  const { notifications, markNotifRead, markAllNotifsRead, unreadCount } = useProspect();
  const unread = notifications.filter(n => !n.isRead);
  const read   = notifications.filter(n =>  n.isRead);

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-3xl mx-auto">
        <PageHeader
          title="Notificações"
          subtitle={unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo lido'}
          action={
            unreadCount > 0 ? (
              <Button variant="outline" size="sm" onClick={markAllNotifsRead} className="gap-1.5 text-xs">
                <CheckCheck size={13} /> Marcar todas como lidas
              </Button>
            ) : null
          }
        />

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border">
            <Bell size={28} className="text-muted-foreground mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm font-medium">Nenhuma notificação ainda</p>
            <p className="text-xs text-muted-foreground mt-1">As alertas de resposta e conversão aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {unread.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Não lidas ({unread.length})
                </p>
                <div className="space-y-2">
                  {unread.map(n => <NotifCard key={n.id} notif={n} onRead={() => markNotifRead(n.id)} />)}
                </div>
              </div>
            )}
            {read.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Lidas ({read.length})
                </p>
                <div className="space-y-2 opacity-60">
                  {read.map(n => <NotifCard key={n.id} notif={n} onRead={() => {}} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA para CRM */}
        {notifications.some(n => n.type === 'converted') && (
          <div className="mt-6 flex items-center gap-4 p-4 rounded-xl border"
            style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <TrendingUp size={18} style={{ color: '#059669', flexShrink: 0 }} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-800">Leads convertidos aguardam no CRM</p>
              <p className="text-xs text-emerald-700 mt-0.5">Gerencie a negociação no funil comercial.</p>
            </div>
            <Link to={ROUTES.APP_CRM}>
              <Button size="sm" className="gap-1.5 text-xs text-white" style={{ background: '#059669' }}>
                Abrir CRM <ArrowRight size={12} />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function NotifCard({ notif, onRead }: { notif: { id: string; type: string; message: string; title?: string; contactName?: string; contactCompany?: string; contactId?: string; createdAt: Date; isRead: boolean }; onRead: () => void }) {
  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.followup_needed;
  const isSystem = notif.type.startsWith('system_');
  return (
    <div
      onClick={onRead}
      className="flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm"
      style={{ background: notif.isRead ? 'var(--card)' : cfg.bg, borderColor: notif.isRead ? 'var(--border)' : cfg.border }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
        style={{ background: `${cfg.color}15` }}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${cfg.color}15`, color: cfg.color }}>
            {cfg.label}
          </span>
          {!notif.isRead && (
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          )}
        </div>
        {(notif.title || notif.contactName) && (
          <p className="text-sm text-foreground font-medium truncate">
            {notif.title ?? (notif.contactName && `${notif.contactName}${notif.contactCompany ? ` · ${notif.contactCompany}` : ''}`)}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(notif.createdAt)}</span>
        {!isSystem && notif.contactId && (
          <Link to={`/app/contatos/${notif.contactId}`}
            onClick={e => e.stopPropagation()}
            className="text-xs text-primary hover:underline flex items-center gap-1">
            Ver contato <ArrowRight size={10} />
          </Link>
        )}
      </div>
    </div>
  );
}
