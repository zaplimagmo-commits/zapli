import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProspectContext } from '@/hooks/ProspectContext';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, MessageCircle, TrendingUp, Clock, ArrowRight, Phone, ExternalLink } from 'lucide-react';
import { formatDateTime, formatPhone, getWhatsAppLink } from '@/lib/index';
import type { Notification } from '@/lib/index';

const TYPE_ICONS: Record<string, { icon: string; bg: string; label: string; color: string }> = {
  positive_response: { icon: '💬', bg: '#d1fae5', label: 'Resposta Positiva', color: '#065f46' },
  converted: { icon: '🎉', bg: '#dbeafe', label: 'Convertido', color: '#1e40af' },
  followup_needed: { icon: '⏰', bg: '#fef3c7', label: 'Follow-up Pendente', color: '#92400e' },
  new_response: { icon: '✉️', bg: '#f3e8ff', label: 'Nova Resposta', color: '#5b21b6' },
};

export default function Notifications() {
  const { notifications, markNotifRead, markAllNotifsRead, stats } = useProspectContext();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;
  const sorted = [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <Layout>
      <div className="px-8 py-7 max-w-4xl mx-auto">
        <PageHeader
          title="Notificações Comerciais"
          subtitle="Alertas para a equipe comercial sobre respostas e oportunidades"
          action={
            <div className="flex gap-2">
              {stats.unreadNotifications > 0 && (
                <Button variant="outline" onClick={markAllNotifsRead} className="text-sm gap-2">
                  <CheckCheck size={14} />
                  Marcar todas como lidas
                </Button>
              )}
            </div>
          }
        />

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: '#d1fae5' }}>
              💬
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {notifications.filter(n => n.type === 'positive_response').length}
              </p>
              <p className="text-xs text-muted-foreground">Respostas positivas</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: '#dbeafe' }}>
              🎉
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {notifications.filter(n => n.type === 'converted').length}
              </p>
              <p className="text-xs text-muted-foreground">Conversões</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
              <Bell size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.unreadNotifications}</p>
              <p className="text-xs text-muted-foreground">Não lidas</p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {(['all', 'unread'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filter === f
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
              }`}>
              {f === 'all' ? `Todas (${notifications.length})` : `Não lidas (${stats.unreadNotifications})`}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        <div className="space-y-3">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-card rounded-xl border border-border">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell size={20} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            sorted.map(n => <NotificationCard key={n.id} notification={n} onRead={() => markNotifRead(n.id)} />)
          )}
        </div>
      </div>
    </Layout>
  );
}

function NotificationCard({ notification: n, onRead }: { notification: Notification; onRead: () => void }) {
  const typeInfo = TYPE_ICONS[n.type] || TYPE_ICONS['new_response'];

  const getWaMessage = () => {
    if (n.type === 'positive_response') {
      return `Olá ${n.prospectName}! Vi sua mensagem e gostaria de dar continuidade à nossa conversa. Quando podemos nos falar?`;
    }
    return `Olá ${n.prospectName}! Estou entrando em contato da equipe comercial da Construtora Exemplo. Podemos conversar?`;
  };

  return (
    <div
      className={`bg-card rounded-xl border transition-all hover:shadow-sm cursor-pointer ${
        !n.isRead ? 'border-primary/30' : 'border-border'
      }`}
      style={{ boxShadow: n.isRead ? '0 1px 4px rgba(0,0,0,0.04)' : '0 1px 4px rgba(59,130,246,0.1)' }}
      onClick={onRead}
    >
      <div className="p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: typeInfo.bg }}>
          {typeInfo.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: typeInfo.bg, color: typeInfo.color }}>
                {typeInfo.label}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</span>
              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              )}
            </div>
          </div>
          <h3 className="font-semibold text-foreground text-sm mt-1.5">{n.prospectName}</h3>
          <p className="text-xs text-muted-foreground">{n.prospectOffice} · {formatPhone(n.prospectPhone)}</p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{n.message}</p>

          {n.assignedTo && (
            <p className="text-xs text-primary mt-2 font-medium">→ Atribuído a: {n.assignedTo}</p>
          )}

          <div className="flex items-center gap-2 mt-3">
            <Link
              to={`/prospeccoes/${n.prospectId}`}
              onClick={e => e.stopPropagation()}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <ArrowRight size={11} />
              Ver conversa
            </Link>
            {(n.type === 'positive_response' || n.type === 'new_response') && (
              <a
                href={getWhatsAppLink(n.prospectPhone, getWaMessage())}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-xs font-medium flex items-center gap-1 px-2.5 py-1 rounded-lg"
                style={{ background: '#25D366', color: 'white' }}
              >
                <ExternalLink size={11} />
                Responder no WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
