import { useAuth } from '@/hooks/AppContext';
import type { TenantRole } from '@/lib/index';
import { ROUTES } from '@/lib/index';

// ── Matriz de permissões por papel ────────────────────────────
//    Define quais rotas cada papel pode acessar
export const ROLE_PERMISSIONS: Record<TenantRole | 'admin', string[]> = {
  admin: ['*'],   // tudo

  gestor: [
    ROUTES.APP_DASHBOARD,
    ROUTES.APP_CONTACTS, ROUTES.APP_CONTACT_DETAIL,
    ROUTES.APP_CRM,
    ROUTES.APP_CLIENTS, ROUTES.APP_CLIENT_DETAIL, ROUTES.APP_CLIENT_METRICS,
    ROUTES.APP_PRODUCTS,
    ROUTES.APP_TEMPLATES,
    ROUTES.APP_QUEUE,
    ROUTES.APP_NOTIFICATIONS,
    ROUTES.APP_CAMPAIGNS,
    ROUTES.APP_INSTAGRAM,
    ROUTES.APP_BOT,
    ROUTES.APP_TEAM,
    ROUTES.APP_WHATSAPP,
    ROUTES.APP_SUBSCRIPTION,
    ROUTES.APP_SETTINGS,
  ],

  // Vendedor: foco em FECHAR negócios — CRM, Clientes, seus leads atribuídos
  vendedor: [
    ROUTES.APP_DASHBOARD,
    ROUTES.APP_CONTACTS, ROUTES.APP_CONTACT_DETAIL,
    ROUTES.APP_CRM,
    ROUTES.APP_CLIENTS, ROUTES.APP_CLIENT_DETAIL, ROUTES.APP_CLIENT_METRICS,
    ROUTES.APP_TEMPLATES,
    ROUTES.APP_NOTIFICATIONS,
    ROUTES.APP_WHATSAPP,
    ROUTES.APP_SETTINGS,
  ],

  // SDR: foco em PROSPECTAR — leads, disparos, campanhas, bot
  sdr: [
    ROUTES.APP_DASHBOARD,
    ROUTES.APP_CONTACTS, ROUTES.APP_CONTACT_DETAIL,
    ROUTES.APP_QUEUE,
    ROUTES.APP_CAMPAIGNS,
    ROUTES.APP_BOT,
    ROUTES.APP_TEMPLATES,
    ROUTES.APP_NOTIFICATIONS,
    ROUTES.APP_WHATSAPP,
    ROUTES.APP_INSTAGRAM,
    ROUTES.APP_SETTINGS,
  ],
};

// ── Nav items por papel ────────────────────────────────────────
export interface NavItem {
  label: string;
  icon: string;    // nome do ícone Lucide
  to: string;
  badge?: string;
  group?: string;  // para separadores visuais
}

export const NAV_BY_ROLE: Record<TenantRole | 'admin', NavItem[]> = {
  admin: [],   // admin usa nav própria do admin

  gestor: [
    // Prospecção
    { label: 'Dashboard',     icon: 'LayoutDashboard', to: ROUTES.APP_DASHBOARD, group: 'Visão Geral' },
    { label: 'Contatos',      icon: 'Users',           to: ROUTES.APP_CONTACTS },
    { label: 'Equipe',        icon: 'Users2',          to: ROUTES.APP_TEAM },
    // Comercial
    { label: 'CRM',           icon: 'Kanban',          to: ROUTES.APP_CRM, group: 'Comercial' },
    { label: 'Clientes',      icon: 'UserRoundCheck',  to: ROUTES.APP_CLIENTS },
    { label: 'Métricas',      icon: 'BarChart2',       to: ROUTES.APP_CLIENT_METRICS },
    // Operação
    { label: 'Produtos',      icon: 'Package',         to: ROUTES.APP_PRODUCTS, group: 'Operação' },
    { label: 'Fila de Envio', icon: 'ListOrdered',     to: ROUTES.APP_QUEUE },
    { label: 'Campanhas',     icon: 'Megaphone',       to: ROUTES.APP_CAMPAIGNS },
    { label: 'Bot',           icon: 'Bot',             to: ROUTES.APP_BOT },
    { label: 'Modelos',       icon: 'MessageSquare',   to: ROUTES.APP_TEMPLATES },
    // Integrações
    { label: 'WhatsApp',      icon: 'MessageCircle',   to: ROUTES.APP_WHATSAPP, group: 'Integrações' },
    { label: 'Instagram', icon: 'Instagram', to: ROUTES.APP_INSTAGRAM, badge: 'Em breve' },
    // Conta
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
    { label: 'Instagram', icon: 'Instagram', to: ROUTES.APP_INSTAGRAM, badge: 'Em breve' },
    { label: 'Notificações',  icon: 'Bell',            to: ROUTES.APP_NOTIFICATIONS, badge: 'notif', group: 'Conta' },
    { label: 'Configurações', icon: 'Settings',        to: ROUTES.APP_SETTINGS },
  ],
};

// Papel e cor legível
export const ROLE_LABEL: Record<string, { label: string; color: string; bg: string; badge: string }> = {
  gestor:   { label: 'Gestor',   color: '#6366f1', bg: '#eef2ff',  badge: 'GESTOR' },
  vendedor: { label: 'Vendedor', color: '#059669', bg: '#f0fdf4',  badge: 'VENDEDOR' },
  sdr:      { label: 'SDR',      color: '#f59e0b', bg: '#fffbeb',  badge: 'SDR' },
  admin:    { label: 'Admin',    color: '#ef4444', bg: '#fef2f2',  badge: 'ADMIN' },
  user:     { label: 'Usuário',  color: '#6b7280', bg: '#f9fafb',  badge: 'USER' },
};

// ── Hook principal ─────────────────────────────────────────────
export function useRole() {
  const { user } = useAuth();

  const role: TenantRole | 'admin' | null = user?.role === 'admin'
    ? 'admin'
    : (user?.tenantRole ?? null);

  const isGestor  = role === 'gestor' || role === 'admin';
  const isVendedor = role === 'vendedor';
  const isSDR     = role === 'sdr';
  const isAdmin   = role === 'admin';

  function can(feature: string): boolean {
    if (!role) return false;
    if (role === 'admin') return true;
    return ROLE_PERMISSIONS[role]?.includes(feature) ?? false;
  }

  // Pode ver qualquer coisa (acima de Vendedor/SDR)?
  const canSeeTeam     = isGestor;
  const canManageTeam  = isGestor;
  const canSeeAllLeads = isGestor;
  const canDeleteAny   = isGestor;
  const canAccessCRM   = isGestor || isVendedor;
  const canAccessQueue = isGestor || isSDR;
  const canAccessBots  = isGestor || isSDR;
  const canAccessCampaigns = isGestor || isSDR;
  const canAccessProducts  = isGestor;
  const canAccessSubscription = isGestor;

  const navItems = role ? (NAV_BY_ROLE[role] ?? NAV_BY_ROLE.vendedor) : [];

  return {
    role, isGestor, isVendedor, isSDR, isAdmin,
    can, navItems,
    canSeeTeam, canManageTeam, canSeeAllLeads, canDeleteAny,
    canAccessCRM, canAccessQueue, canAccessBots, canAccessCampaigns,
    canAccessProducts, canAccessSubscription,
    roleLabel: ROLE_LABEL[role ?? 'user'],
  };
}
