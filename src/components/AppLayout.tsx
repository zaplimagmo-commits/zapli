import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useProspect } from '@/hooks/AppContext';
import { useRole } from '@/hooks/useRole';
import { ROUTES } from '@/lib/index';
import {
  LayoutDashboard, Users, Users2, Bell, MessageSquare, Settings,
  CreditCard, LogOut, Zap, ChevronRight,
  BarChart3, UserCog, MessageCircle, Package, ListOrdered,
  Kanban, UserRoundCheck, BarChart2, Megaphone, Instagram, Bot,
} from 'lucide-react';

// Mapa de ícones por string — usa LucideIcon para evitar conflito de tipos
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICONS: Record<string, any> = {
  LayoutDashboard, Users, Users2, Bell, MessageSquare, Settings,
  CreditCard, MessageCircle, Package, ListOrdered,
  Kanban, UserRoundCheck, BarChart2, Megaphone, Instagram, Bot,
};

const adminNav: Array<{ label: string; icon: string; to: string; group?: string; badge?: string }> = [
  { label: 'Visão Geral', icon: 'BarChart3', to: ROUTES.ADMIN_DASHBOARD, group: '' },
  { label: 'Usuários',    icon: 'UserCog',   to: ROUTES.ADMIN_USERS },
  { label: 'Planos',      icon: 'CreditCard',to: ROUTES.ADMIN_PLANS },
];
// BarChart3 e UserCog ficam apenas no admin
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ADMIN_ICONS: Record<string, any> = { BarChart3, UserCog };

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useProspect();
  const { navItems, isGestor, isAdmin, roleLabel } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminUser = user?.role === 'admin';
  const items: Array<{ label: string; icon: string; to: string; group?: string; badge?: string }> = isAdminUser
    ? adminNav
    : navItems;

  function handleLogout() { logout(); navigate('/'); }

  // Agrupa nav por group
  const grouped: { group: string; items: typeof items }[] = [];
  items.forEach(item => {
    const g = item.group ?? '';
    const last = grouped[grouped.length - 1];
    if (!last || last.group !== g) grouped.push({ group: g, items: [item] });
    else last.items.push(item);
  });

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-30"
      style={{ background: 'var(--sidebar)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--emerald)' }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-base tracking-tight">Zapli</span>
          {/* Badge de papel */}
          {roleLabel && (
            <span className="ml-auto text-xs px-1.5 py-0.5 rounded font-bold"
              style={{ background: `${roleLabel.color}30`, color: roleLabel.color, fontSize: 9 }}>
              {roleLabel.badge}
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-thin">
        {grouped.map(({ group, items: gItems }, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-1' : ''}>
            {group && (
              <p className="text-xs font-bold uppercase tracking-widest px-3 py-2 mt-2"
                style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9 }}>
                {group}
              </p>
            )}
            {gItems.map(item => {
              const isNotif = item.badge === 'notif';
              const isActive = location.pathname === item.to ||
                (item.to !== '/' && item.to.includes(':') === false &&
                  location.pathname.startsWith(item.to) &&
                  item.to !== ROUTES.APP_CONTACTS &&
                  item.to !== ROUTES.APP_NOTIFICATIONS);

              const IconComp = ICONS[item.icon] ?? ADMIN_ICONS[item.icon] ?? Settings;

              return (
                <NavLink key={item.label} to={item.to}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 mb-0.5"
                  style={{
                    background: isActive ? 'rgba(99,102,241,0.22)' : 'transparent',
                    color: isActive ? 'white' : 'rgba(255,255,255,0.52)',
                  }}>
                  <IconComp style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <span className="text-sm font-medium flex-1 truncate">{item.label}</span>
                  {isNotif && unreadCount > 0 && (
                    <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded-full"
                      style={{ background: '#ef4444', minWidth: 18, textAlign: 'center', fontSize: 10 }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  {isActive && <ChevronRight style={{ width: 12, height: 12, opacity: 0.45 }} />}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Perfil + sair */}
      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl mb-1"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
            style={{ background: user?.avatarColor ?? (isAdminUser ? '#ef4444' : 'var(--emerald)') }}>
            {user?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isAdminUser ? 'Administrador' : (roleLabel?.label ?? user?.companyName)}
            </p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
          <LogOut style={{ width: 14, height: 14 }} />
          Sair da conta
        </button>
      </div>
    </aside>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      <AppSidebar />
      <main className="flex-1 ml-64 min-h-screen">{children}</main>
    </div>
  );
}
