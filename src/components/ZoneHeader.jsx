import React from 'react';
import { useNavigate } from 'react-router-dom';
import { C, Z, GLASS_CARD } from '../constants/colors.js';
import { useApp } from '../context/AppContext.jsx';

/**
 * ZoneHeader — top bar shown on zone index pages and game screens.
 * Props:
 *   zoneKey  — 'arcade' | 'stage' | 'oracle' | 'wall' | 'worldcup'
 *   title    — override zone name (optional)
 *   backTo   — navigate target on back (defaults to '/')
 *   right    — optional JSX for right side
 */
export default function ZoneHeader({ zoneKey, title, backTo = '/', right }) {
  const navigate = useNavigate();
  const { playFx } = useApp();
  const zone = zoneKey ? Z[zoneKey] : null;
  const primary = zone?.primary ?? C.cyan;
  const displayTitle = title ?? zone?.name ?? '';

  const handleBack = () => {
    playFx('back');
    navigate(backTo);
  };

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      padding: '10px 16px 10px',
      display: 'flex', alignItems: 'center', gap: 10,
      borderBottom: `1px solid ${primary}20`,
      ...GLASS_CARD,
    }}>
      <button
        onClick={handleBack}
        style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: C.text, fontSize: 14, flexShrink: 0,
        }}
      >
        ←
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        {zone?.icon && (
          <div style={{ fontSize: 10, color: primary, fontWeight: 700, letterSpacing: 1, marginBottom: 1 }}>
            {zone.icon} {zone.sub}
          </div>
        )}
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1 }}>
          {displayTitle}
        </div>
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}
