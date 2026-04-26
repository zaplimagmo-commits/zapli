import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bell,
  MessageSquare,
  Settings,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import { useProspectContext } from '@/hooks/ProspectContext';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: ROUTE_PATHS.HOME },
  { label: 'Prospecções', icon: Users, to: ROUTE_PATHS.PROSPECTS },
  { label: 'Notificações', icon: Bell, to: ROUTE_PATHS.NOTIFICATIONS },
  { label: 'Modelos de Msg', icon: MessageSquare, to: ROUTE_PATHS.TEMPLATES },
  { label: 'Configurações', icon: Settings, to: ROUTE_PATHS.SETTINGS },
];

export function Sidebar() {
  const { stats } = useProspectContext();
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-30"
      style={{ background: 'var(--sidebar)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--primary)' }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">ProspectArq</p>
            <p className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Prospecção Inteligente
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to));
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative"
              style={{
                background: isActive ? 'rgba(59,130,246,0.18)' : 'transparent',
                color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
              }}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" style={{ width: 18, height: 18 }} />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {item.label === 'Notificações' && stats.unreadNotifications > 0 && (
                <span className="text-xs font-semibold text-white px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--primary)', minWidth: 20, textAlign: 'center', fontSize: 11 }}>
                  {stats.unreadNotifications}
                </span>
              )}
              {item.label === 'Prospecções' && stats.pendingFollowUps > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: '#d97706', color: 'white', minWidth: 20, textAlign: 'center', fontSize: 11 }}>
                  {stats.pendingFollowUps}
                </span>
              )}
              {isActive && (
                <ChevronRight style={{ width: 14, height: 14, opacity: 0.5 }} />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'var(--primary)' }}>
            CC
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">Comercial</p>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Construtora Exemplo
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
