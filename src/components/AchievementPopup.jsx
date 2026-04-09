import React from 'react';
import { C } from '../constants/colors.js';
import { useApp } from '../context/AppContext.jsx';

/**
 * AchievementPopup — fullscreen overlay shown on badge unlock.
 * Reads achievementPopup from AppContext. Tap anywhere to dismiss.
 */
export default function AchievementPopup() {
  const { achievementPopup, setAchievementPopup } = useApp();
  if (!achievementPopup) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(5,5,16,0.85)', backdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.3s ease', pointerEvents: 'auto',
      }}
      onClick={() => setAchievementPopup(null)}
    >
      <div style={{ textAlign: 'center', animation: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ fontSize: 14, letterSpacing: 3, color: C.gold, fontWeight: 700, marginBottom: 12 }}>
          ACHIEVEMENT UNLOCKED
        </div>
        <div style={{ fontSize: 72, marginBottom: 12, filter: 'drop-shadow(0 0 20px rgba(255,217,61,0.4))' }}>
          {achievementPopup.icon}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 4 }}>
          {achievementPopup.name}
        </div>
        <div style={{ fontSize: 13, color: C.text2 }}>{achievementPopup.desc}</div>
        <div style={{ marginTop: 16, fontSize: 11, color: C.text3 }}>Tap to continue</div>
      </div>
    </div>
  );
}
