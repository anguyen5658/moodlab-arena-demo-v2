import React from 'react';
import { Outlet } from 'react-router-dom';
import { useApp } from './context/AppContext.jsx';
import NavBar from './components/NavBar.jsx';
import FloatingReward from './components/FloatingReward.jsx';
import AchievementPopup from './components/AchievementPopup.jsx';
import BLEPopup from './components/BLEPopup.jsx';

/**
 * AppShell — rendered inside the router, reads context from AppProvider.
 * Renders shared chrome (overlays, nav) + page content via <Outlet />.
 * Kept separate from App so it can safely consume AppContext.
 */
export default function AppShell() {
  const { notification, screenShake, screenFlash, confettiParticles } = useApp();

  return (
    <div
      style={{
        position: 'relative',
        width: '100%', height: '100%',
        animation: screenShake ? 'shake 0.5s ease' : 'none',
      }}
    >
      {/* Screen flash overlay */}
      {screenFlash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
          background: screenFlash === 'red'
            ? 'rgba(255,50,50,0.25)'
            : screenFlash === 'gold'
            ? 'rgba(255,217,61,0.25)'
            : 'rgba(0,229,255,0.2)',
          animation: 'fadeIn 0.1s ease',
        }} />
      )}

      {/* Toast notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, padding: '8px 16px', borderRadius: 20,
          background: `${notification.color}15`,
          border: `1px solid ${notification.color}40`,
          color: notification.color, fontSize: 12, fontWeight: 700,
          animation: 'fadeIn 0.3s ease', pointerEvents: 'none',
          whiteSpace: 'nowrap', maxWidth: '85vw',
          textAlign: 'center', backdropFilter: 'blur(8px)',
        }}>
          {notification.msg}
        </div>
      )}

      {/* Confetti particles */}
      {confettiParticles.map(p => (
        <div key={p.id} style={{
          position: 'fixed', zIndex: 500, pointerEvents: 'none',
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          background: p.color, borderRadius: 2,
          transform: `rotate(${p.rot}deg)`,
          animation: 'confettiFall 3s ease-out forwards',
        }} />
      ))}

      {/* Global overlays */}
      <FloatingReward />
      <AchievementPopup />
      <BLEPopup />

      {/* Page content */}
      <Outlet />

      {/* Bottom nav */}
      <NavBar />
    </div>
  );
}
