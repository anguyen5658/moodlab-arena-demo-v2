import React, { useState, useEffect } from 'react';
import { C } from '../constants/colors.js';
import { UNIVERSAL_PUFF_CONFIG } from '../constants/ble.js';

/**
 * UniversalPuffBar — shared puff power meter used in 15+ games.
 * Props:
 *   power      — 0-100 number (current fill %)
 *   charging   — bool (true while puff held)
 *   opts       — { width, blinkerUsed }
 */
export default function UniversalPuffBar({ power = 0, charging = false, opts = {} }) {
  const { width = '100%', blinkerUsed = false } = opts;

  // Randomized sweet spot — persists until component unmounts
  const [sweetSpot] = useState(() => UNIVERSAL_PUFF_CONFIG.randomizeSweetSpot());

  const getZone = (p) => {
    if (p >= UNIVERSAL_PUFF_CONFIG.blinkerThreshold) return 'blinker';
    if (p >= 65) return 'perfect';
    if (p >= 40) return 'good';
    if (p >= 15) return 'short';
    return 'tap';
  };

  const zone = getZone(power);
  const zoneColor = zone === 'perfect' ? C.lime : zone === 'blinker' ? C.red : zone === 'good' ? C.cyan : zone === 'short' ? C.gold : C.text3;
  const zoneLabel = zone === 'perfect' ? 'PERFECT 👑'
    : zone === 'blinker' ? (blinkerUsed ? 'BLINKER (used) 💀' : 'BLINKER BONUS! 💀')
    : zone === 'good' ? 'Good 👌'
    : zone === 'short' ? 'Short' : 'Tap';

  const fillGradient = zone === 'perfect'
    ? `linear-gradient(90deg, ${C.cyan}, ${C.lime})`
    : zone === 'blinker'
    ? `linear-gradient(90deg, ${C.cyan}, ${C.lime}, ${C.red})`
    : `linear-gradient(90deg, ${C.cyan}, ${C.green})`;

  return (
    <div style={{ width, animation: 'fadeIn 0.3s ease' }}>
      {/* Zone label + power */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3, padding: '0 2px' }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: zoneColor }}>{charging ? zoneLabel : 'PUFF POWER'}</span>
        <span style={{ fontSize: 10, fontWeight: 900, color: zoneColor, fontFamily: 'monospace' }}>{Math.round(power)}%</span>
      </div>
      {/* Power bar */}
      <div style={{
        height: 22, borderRadius: 11,
        background: 'rgba(255,255,255,0.04)',
        overflow: 'hidden',
        border: `2px solid ${charging ? zoneColor + '60' : 'rgba(255,255,255,0.1)'}`,
        position: 'relative', transition: 'border-color 0.2s',
        boxShadow: charging ? `0 0 12px ${zoneColor}25` : 'none',
      }}>
        {/* Sweet spot highlight */}
        <div style={{ position: 'absolute', left: `${sweetSpot.min}%`, width: `${sweetSpot.max - sweetSpot.min}%`, height: '100%', background: `${C.lime}12`, borderLeft: `1px solid ${C.lime}35`, borderRight: `1px solid ${C.lime}35` }} />
        <div style={{ position: 'absolute', left: `${sweetSpot.min + 1}%`, top: 2, fontSize: 6, color: `${C.lime}60`, fontWeight: 800, zIndex: 2 }}>SWEET</div>
        {/* Blinker zone */}
        <div style={{ position: 'absolute', left: '95%', width: '5%', height: '100%', background: `${C.red}15`, borderLeft: `1px solid ${C.red}30` }} />
        {/* Fill bar */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${power}%`, background: fillGradient, borderRadius: 10, transition: 'width 0.05s linear', boxShadow: charging ? `0 0 15px ${zoneColor}40` : 'none', zIndex: 1 }} />
        {/* Power % overlay */}
        {power > 8 && (
          <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 10, fontWeight: 900, color: '#fff', textShadow: '0 0 6px rgba(0,0,0,1)', zIndex: 3 }}>
            {Math.round(power)}%
          </div>
        )}
        {/* Zone divider markers */}
        {UNIVERSAL_PUFF_CONFIG.zones.slice(0, -1).map((z, i) => (
          <div key={i} style={{ position: 'absolute', top: 0, left: `${z.max}%`, width: 1, height: '100%', background: 'rgba(255,255,255,0.1)', zIndex: 2 }} />
        ))}
      </div>
      {/* Zone labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, padding: '0 2px' }}>
        {UNIVERSAL_PUFF_CONFIG.zones.map((z, i) => (
          <span key={i} style={{ fontSize: 6, color: z.name === 'PERFECT' ? C.lime : z.name === 'BLINKER' ? C.red : C.text3, fontWeight: z.name === 'PERFECT' ? 700 : 400 }}>
            {z.name}{z.name === 'PERFECT' ? ' 💨' : z.name === 'BLINKER' ? ' 💀' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
