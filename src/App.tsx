import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '@/lib/index';
import { AppProvider, useAuth } from '@/hooks/AppContext';
import Landing from '@/pages/Landing';
import { LoginPage, RegisterPage } from '@/pages/Auth';
import AppDashboard from '@/pages/app/AppDashboard';
import AppContacts from '@/pages/app/AppContacts';
import AppContactDetail from '@/pages/app/AppContactDetail';
import AppSubscription from '@/pages/app/AppSubscription';
import AppTemplates from '@/pages/app/AppTemplates';
import AppSettings from '@/pages/app/AppSettings';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminPlans from '@/pages/admin/AdminPlans';
import AppWhatsApp from '@/pages/app/AppWhatsApp';
import AppProducts from '@/pages/app/AppProducts';
import AppQueue from '@/pages/app/AppQueue';
import AppNotifications from '@/pages/app/AppNotifications';
import AppCRM from '@/pages/app/AppCRM';
import AppClients from '@/pages/app/AppClients';
import AppClientDetail from '@/pages/app/AppClientDetail';
import AppClientMetrics from '@/pages/app/AppClientMetrics';
import AppCampaigns from '@/pages/app/AppCampaigns';
import AppInstagram from '@/pages/app/AppInstagram';
import AppBot from '@/pages/app/AppBot';
import AppTeam from '@/pages/app/AppTeam';
import AgentPage from '@/pages/agent/AgentPage';

// Rotas permitidas por perfil de tenant
const GESTOR_ONLY = [ROUTES.APP_TEAM];
const SDR_BLOCKED = [ROUTES.APP_CRM, ROUTES.APP_CLIENTS, ROUTES.APP_CLIENT_DETAIL, ROUTES.APP_CLIENT_METRICS, ROUTES.APP_TEAM, ROUTES.APP_SUBSCRIPTION, ROUTES.APP_SETTINGS];
const VENDEDOR_BLOCKED = [ROUTES.APP_CONTACTS, ROUTES.APP_QUEUE, ROUTES.APP_CAMPAIGNS, ROUTES.APP_BOT, ROUTES.APP_INSTAGRAM, ROUTES.APP_TEAM, ROUTES.APP_SUBSCRIPTION, ROUTES.APP_SETTINGS];

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to={ROUTES.APP_DASHBOARD} replace />;
  return <>{children}</>;
}

function RoleProtectedRoute({ children, routePath }: { children: React.ReactNode; routePath: string }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  const role = user.tenantRole;
  if (role === 'gestor' || user.role === 'admin') return <>{children}</>;
  if (role === 'sdr' && SDR_BLOCKED.includes(routePath)) return <Navigate to={ROUTES.APP_DASHBOARD} replace />;
  if (role === 'vendedor' && VENDEDOR_BLOCKED.includes(routePath)) return <Navigate to={ROUTES.APP_DASHBOARD} replace />;
  // gestor_only routes
  if (GESTOR_ONLY.includes(routePath)) return <Navigate to={ROUTES.APP_DASHBOARD} replace />;
  return <>{children}</>;
}


function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Public */}
      {/* Rota pública do agente — acessível sem login, em qualquer device */}
      <Route path="/agent/:tenantId" element={<AgentPage />} />
      <Route path="/agent" element={<AgentPage />} />

      <Route path={ROUTES.HOME} element={<Landing />} />
      <Route path={ROUTES.LOGIN} element={user ? <Navigate to={user.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.APP_DASHBOARD} /> : <LoginPage />} />
      <Route path={ROUTES.REGISTER} element={user ? <Navigate to={ROUTES.APP_DASHBOARD} /> : <RegisterPage />} />

      {/* User App */}
      <Route path={ROUTES.APP_DASHBOARD} element={<ProtectedRoute><AppDashboard /></ProtectedRoute>} />
      <Route path={ROUTES.APP_CONTACTS} element={<RoleProtectedRoute routePath={ROUTES.APP_CONTACTS}><AppContacts /></RoleProtectedRoute>} />
      <Route path={ROUTES.APP_CONTACT_DETAIL} element={<RoleProtectedRoute routePath={ROUTES.APP_CONTACTS}><AppContactDetail /></RoleProtectedRoute>} />
      <Route path={ROUTES.APP_PRODUCTS} element={<ProtectedRoute><AppProducts /></ProtectedRoute>} />
      <Route path={ROUTES.APP_QUEUE} element={<RoleProtectedRoute routePath={ROUTES.APP_QUEUE}><AppQueue /></RoleProtectedRoute>} />
      <Route path={ROUTES.APP_NOTIFICATIONS} element={<ProtectedRoute><AppNotifications /></ProtectedRoute>} />
      <Route path={ROUTES.APP_CRM} element={<RoleProtectedRoute routePath={ROUTES.APP_CRM}><AppCRM /></RoleProtectedRoute>} />
      <Route path={ROUTES.APP_CLIENTS} element={<RoleProtectedRoute routePath={ROUTES.APP_CLIENTS}><AppClients /></RoleProtectedRoute>} />
      <Route path={ROUTES.APP_CLIENT_DETAIL} element={<RoleProtectedRoute routePath={ROUTES.APP_CLIENT_DETAIL}><AppClientDetail /></RoleProtectedRoute>} />
      <Route path={ROUTES.APP_CLIENT_METRICS} element={<RoleProtectedRoute routePath={ROUTES.APP_CLIENT_METRICS}><AppClientMetrics /></RoleProtectedRoute>} />
      <Route path={ROUTES.APP_TEMPLATES} element={<ProtectedRoute><AppTemplates /></ProtectedRoute>} />
      <Route path={ROUTES.APP_SUBSCRIPTION} element={<RoleProtectedRoute routePath={ROUTES.APP_SUBSCRIPTION}><AppSubscription /></RoleProtectedRoute>} />
      <Route path={ROUTES.APP_SETTINGS} element={<RoleProtectedRoute routePath={ROUTES.APP_SETTINGS}><AppSettings /></RoleProtectedRoute>} />
      <Route path={ROUTES.APP_WHATSAPP} element={<ProtectedRoute><AppWhatsApp /></ProtectedRoute>} />
      <Route path={ROUTES.APP_CAMPAIGNS} element={<RoleProtectedRoute routePath={ROUTES.APP_CAMPAIGNS}><AppCampaigns /></RoleProtectedRoute>} />
      <Route path={ROUTES.APP_INSTAGRAM} element={<RoleProtectedRoute routePath={ROUTES.APP_INSTAGRAM}><AppInstagram /></RoleProtectedRoute>} />
      <Route path={ROUTES.APP_BOT} element={<RoleProtectedRoute routePath={ROUTES.APP_BOT}><AppBot /></RoleProtectedRoute>} />
      <Route path={ROUTES.APP_TEAM} element={<RoleProtectedRoute routePath={ROUTES.APP_TEAM}><AppTeam /></RoleProtectedRoute>} />

      {/* Admin */}
      <Route path={ROUTES.ADMIN_DASHBOARD} element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN_USERS} element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN_PLANS} element={<ProtectedRoute adminOnly><AdminPlans /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}
