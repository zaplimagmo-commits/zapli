import { useAuth } from '@/hooks/AppContext';
import type { TenantRole } from '@/lib/index';
import { ROUTES } from '@/lib/index';

export const ROLE_PERMISSIONS: Record<TenantRole | 'admin', string[]> = {
  admin: ['*'],
  gestor: [
    ROUTES.APP_DASHBOARD, ROUTES.APP_CONTACTS, ROUTES.APP_CONTACT_DETAIL,
    ROUTES.APP_CRM, ROUTES.APP_CLIENTS, ROUTES.APP_CLIENT_DETAIL, ROUTES.APP_CLIENT_METRICS,
    ROUTES.APP_PRODUCTS, ROUTES.APP_TEMPLATES, ROUTES.APP_QUEUE, ROUTES.APP_NOTIFICATIONS,
    ROUTES.APP_CAMPAIGNS, ROUTES.APP_BOT, ROUTES.APP_TEAM, ROUTES.APP_WHATSAPP,
    ROUTES.APP_SUBSCRIPTION, ROUTES.APP_SETTINGS,
  ],
  vendedor: [
    ROUTES.APP_DASHBOARD, ROUTES.APP_CONTACTS, ROUTES.APP_CONTACT_DETAIL,
    ROUTES.APP_CRM, ROUTES.APP_CLIENTS, ROUTES.APP_CLIENT_DETAIL, ROUTES.APP_CLIENT_METRICS,
    ROUTES.APP_TEMPLATES, ROUTES.APP_NOTIFICATIONS, ROUTES.APP_WHATSAPP, ROUTES.APP_SETTINGS,
  ],
  sdr: [
    ROUTES.APP_DASHBOARD, ROUTES.APP_CONTACTS, ROUTES.APP_CONTACT_DETAIL,
    ROUTES.APP_QUEUE, ROUTES.APP_CAMPAIGNS, ROUTES.APP_BOT, ROUTES.APP_TEMPLATES,
    ROUTES.APP_NOTIFICATIONS, ROUTES.APP_WHATSAPP, ROUTES.APP_SETTINGS,
  ],
};

export interface NavItem {
  label: string;
  icon: string;
  to: string;
  badge?: string;
  group?: string;
}

export const NAV_BY_ROLE: Record<TenantRole | 'admin', NavItem[]> = {
  admin: [],
  gestor: [
    { label: 'Dashboard',     icon: 'LayoutDashboard', to: ROUTES.APP_DASHBOARD, group: 'Visão Geral' },
    { label: 'Contatos',      icon: 'Users',           to: ROUTES.APP_CONTACTS },
    { label: 'Equipe',        icon: 'Users2',          to: ROUTES.APP_TEAM },
    { label: 'CRM',           icon: 'Kanban',          to: ROUTES.APP_CRM, group: 'Comercial' },
    { label: 'Clientes',      icon: 'UserRoundCheck',  to: ROUTES.APP_CLIENTS },
    { label: 'Métricas',      icon: 'BarChart2',       to: ROUTES.APP_CLIENT_METRICS },
    { label: 'Produtos',      icon: 'Package',         to: ROUTES.APP_PRODUCTS, group: 'Operação' },
    { label: 'Fila de Envio', icon: 'ListOrdered',     to: ROUTES.APP_QUEUE },
    { label: 'Campanhas',     icon: 'Megaphone',       to: ROUTES.APP_CAMPAIGNS },
    { label: 'Bot',           icon: 'Bot',             to: ROUTES.APP_BOT },
    { label: 'Modelos',       icon: 'MessageSquare',   to: ROUTES.APP_TEMPLATES },
    { label: 'WhatsApp',      icon: 'MessageCircle',   to: ROUTES.APP_WHATSAPP, group: 'Integrações' },
    { label: 'Notificações',  icon: 'Bell',            to: ROUTES.APP_NOTIFICATIONS, badge: 'notif', group: 'Conta' },
    { label: 'Assinatura',    icon: 'CreditCard',      to: ROUTES.APP_SUBSCRIPTION },
    { label: 'Configurações', icon: 'Settings',        to: ROUTES.APP_SETTINGS },
  ],
  vendedor: [
    { label: 'Dashboard',     icon: 'LayoutDashboard', to: ROUTES.APP_DASHBOARD, group: 'Principal' },
    { label: 'Meus Leads',    icon: 'Users',           to: ROUTES.APP_CONTACTS },
    { label: 'CRM',           icon: 'Kanban',          to: ROUTES.APP_CRM, group: 'Comercial' },
    { label: 'Clientes',      icon: 'UserRoundCheck',  to: ROUTES.APP_CLIENTS },
    { label: 'Métricas',      icon: 'BarChart2',       to: ROUTES.APP_CLIENT_METRICS },
    { label: 'Modelos',       icon: 'MessageSquare',   to: ROUTES.APP_TEMPLATES, group: 'Ferramentas' },
    { label: 'WhatsApp',      icon: 'MessageCircle',   to: ROUTES.APP_WHATSAPP },
    { label: 'Notificações',  icon: 'Bell',            to: ROUTES.APP_NOTIFICATIONS, badge: 'notif', group: 'Conta' },
    { label: 'Configurações', icon: 'Settings',        to: ROUTES.APP_SETTINGS },
  ],
  sdr: [
    { label: 'Dashboard',     icon: 'LayoutDashboard', to: ROUTES.APP_DASHBOARD, group: 'Principal' },
    { label: 'Contatos',      icon: 'Users',           to: ROUTES.APP_CONTACTS },
    { label: 'Fila de Envio', icon: 'ListOrdered',     to: ROUTES.APP_QUEUE, group: 'Prospecção' },
    { label: 'Campanhas',     icon: 'Megaphone',       to: ROUTES.APP_CAMPAIGNS },
    { label: 'Bot',           icon: 'Bot',             to: ROUTES.APP_BOT },
    { label: 'Modelos',       icon: 'MessageSquare',   to: ROUTES.APP_TEMPLATES },
    { label: 'WhatsApp',      icon: 'MessageCircle',   to: ROUTES.APP_WHATSAPP, group: 'Integrações' },
    { label: 'Notificações',  icon: 'Bell',            to: ROUTES.APP_NOTIFICATIONS, badge: 'notif', group: 'Conta' },
    { label: 'Configurações', icon: 'Settings',        to: ROUTES.APP_SETTINGS },
  ],
};

export const ROLE_LABEL: Record<string, { label: string; color: string; bg: string; badge: string }> = {
  gestor:   { label: 'Gestor',   color: '#6366f1', bg: '#eef2ff',  badge: 'GESTOR' },
  vendedor: { label: 'Vendedor', color: '#059669', bg: '#f0fdf4',  badge: 'VENDEDOR' },
  sdr:      { label: 'SDR',      color: '#f59e0b', bg: '#fffbeb',  badge: 'SDR' },
  admin:    { label: 'Admin',    color: '#ef4444', bg: '#fef2f2',  badge: 'ADMIN' },
  user:     { label: 'Usuário',  color: '#6b7280', bg: '#f9fafb',  badge: 'USER' },
};

export function useRole() {
  const { user } = useAuth();
  const role: TenantRole | 'admin' | null = user?.role === 'admin' ? 'admin' : (user?.tenantRole ?? null);
  const isGestor  = role === 'gestor' || role === 'admin';
  const isVendedor = role === 'vendedor';
  const isSDR     = role === 'sdr';
  const isAdmin   = role === 'admin';

  function can(feature: string): boolean {
    if (!role) return false;
    if (role === 'admin') return true;
    return ROLE_PERMISSIONS[role]?.includes(feature) ?? false;
  }

  const navItems = role ? (NAV_BY_ROLE[role] ?? NAV_BY_ROLE.vendedor) : [];

  return {
    role, isGestor, isVendedor, isSDR, isAdmin,
    can, navItems,
    canSeeTeam: isGestor,
    canManageTeam: isGestor,
    canSeeAllLeads: isGestor,
    canDeleteAny: isGestor,
    canAccessCRM: isGestor || isVendedor,
    canAccessQueue: isGestor || isSDR,
    canAccessBots: isGestor || isSDR,
    canAccessCampaigns: isGestor || isSDR,
    canAccessProducts: isGestor,
    canAccessSubscription: isGestor,
    roleLabel: ROLE_LABEL[role ?? 'user'],
  };
}
