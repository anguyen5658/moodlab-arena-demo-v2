import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GLASS_CLEAR, C } from '../constants/colors.js';
import { useApp } from '../context/AppContext.jsx';

const TABS = [
  { id: 'control', label: 'Control', icon: '🎛', color: C.cyan,   path: '/control' },
  { id: 'arena',   label: 'Arena',   icon: '🎮', color: C.cyan,   path: '/' },
  { id: 'live',    label: 'Live',    icon: '📡', color: C.pink,   path: '/live' },
  { id: 'me',      label: 'Me',      icon: '👤', color: C.purple, path: '/me' },
];

export default function NavBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { playFx, notify } = useApp();

  // Hide on arena hub (root with no zone)
  if (pathname === '/') return null;

  const activeTab = TABS.find(t =>
    t.path === '/'
      ? pathname === '/'
      : pathname.startsWith(t.path)
  ) ?? TABS[1];

  const handleTab = (tab) => {
    if (tab.id === 'control') {
      notify('Coming Soon — Arena Demo Only', C.cyan);
      return;
    }
    playFx('nav');
    navigate(tab.path);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 50, display: 'flex', justifyContent: 'center',
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        padding: '4px 5px', borderRadius: 100, ...GLASS_CLEAR,
      }}>
        {TABS.map(t => {
          const active = activeTab.id === t.id;
          return (
            <div
              key={t.id}
              onClick={() => handleTab(t)}
              style={{
                display: 'flex', alignItems: 'center', gap: active ? 5 : 0,
                padding: active ? '9px 14px' : '9px 12px',
                borderRadius: 100, cursor: 'pointer', minHeight: 44,
                background: active ? `${t.color}20` : 'transparent',
                transition: 'all 0.3s ease', position: 'relative',
              }}
            >
              <span style={{ fontSize: 16, opacity: active ? 1 : 0.4, transition: 'opacity 0.3s' }}>
                {t.icon}
              </span>
              {active && (
                <span style={{ fontSize: 11, fontWeight: 700, color: t.color, whiteSpace: 'nowrap' }}>
                  {t.label}
                </span>
              )}
              {t.id === 'live' && (
                <div style={{
                  position: 'absolute', top: 3, right: active ? 8 : 4,
                  width: 5, height: 5, borderRadius: '50%',
                  background: C.red, animation: 'pulse 1.5s infinite',
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
