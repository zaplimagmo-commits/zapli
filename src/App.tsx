import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ROUTE_PATHS } from '@/lib/index';
import { ProspectProvider } from '@/hooks/ProspectContext';
import Dashboard from '@/pages/Dashboard';
import Prospects from '@/pages/Prospects';
import ProspectDetail from '@/pages/ProspectDetail';
import Notifications from '@/pages/Notifications';
import Templates from '@/pages/Templates';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <ProspectProvider>
      <Router>
        <Routes>
          <Route path={ROUTE_PATHS.HOME} element={<Dashboard />} />
          <Route path={ROUTE_PATHS.PROSPECTS} element={<Prospects />} />
          <Route path={ROUTE_PATHS.PROSPECT_DETAIL} element={<ProspectDetail />} />
          <Route path={ROUTE_PATHS.NOTIFICATIONS} element={<Notifications />} />
          <Route path={ROUTE_PATHS.TEMPLATES} element={<Templates />} />
          <Route path={ROUTE_PATHS.SETTINGS} element={<Settings />} />
        </Routes>
      </Router>
    </ProspectProvider>
  );
}
