import { NavLink, Outlet } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { arenaTabs } from '../data/arena';

const shellStyle: CSSProperties = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top, rgba(0, 229, 255, 0.18), transparent 30%), linear-gradient(180deg, #04050c 0%, #090b18 45%, #04050c 100%)',
  color: '#f4f7fb',
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const navStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  justifyContent: 'center',
  padding: '1rem',
  position: 'sticky',
  top: 0,
  backdropFilter: 'blur(20px)',
  background: 'rgba(5, 7, 16, 0.65)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  zIndex: 5,
};

const linkStyle = ({ isActive }: { isActive: boolean }): CSSProperties => ({
  color: isActive ? '#050510' : '#d4d9e6',
  background: isActive ? '#00E5FF' : 'rgba(255, 255, 255, 0.08)',
  borderRadius: 999,
  padding: '0.8rem 1.2rem',
  textDecoration: 'none',
  fontWeight: 700,
  letterSpacing: '0.02em',
});

export function AppShell() {
  return (
    <div style={shellStyle}>
      <header style={navStyle}>
        {arenaTabs.map((tab: (typeof arenaTabs)[number]) => (
          <NavLink key={tab.id} to={tab.route} style={linkStyle}>
            {tab.label}
          </NavLink>
        ))}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}