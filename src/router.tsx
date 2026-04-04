import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { GameRoute } from './pages/GameRoute';
import { LivePage } from './pages/LivePage';
import { MePage } from './pages/MePage';
import { TabPage } from './pages/TabPage';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Navigate to="/arena" replace /> },
      { path: '/arena', element: <TabPage tab="arena" /> },
      { path: '/arena/:zoneId', element: <TabPage tab="arena" /> },
      { path: '/arena/:zoneId/:gameId', element: <GameRoute /> },
      { path: '/live', element: <LivePage /> },
      { path: '/me', element: <MePage /> },
      { path: '*', element: <Navigate to="/arena" replace /> },
    ],
  },
]);