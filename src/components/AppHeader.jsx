import { C } from '../constants/colors.js';
import { useApp } from '../context/AppContext.jsx';

/**
 * AppHeader — sticky top bar for tab-level pages (Me, Live).
 * Shows Brand | BLE pill | Coins — matching the monolith's persistent header.
 * No back button (these are tab-root pages, not game screens).
 */
export default function AppHeader() {
  const { coins, bleConnected, setShowBlePopup, playFx } = useApp();

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 30,
      padding: '8px 14px 6px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: 'rgba(5,5,16,0.95)', backdropFilter: 'blur(8px)',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
        <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>
          Powered by <span style={{ fontWeight: 900, letterSpacing: 2 }}>MOOD LAB</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <div
          onClick={() => { playFx('tap'); setShowBlePopup(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            padding: '2px 8px', borderRadius: 100, cursor: 'pointer',
            background: bleConnected ? 'rgba(52,211,153,0.1)' : 'rgba(251,146,60,0.1)',
            border: `1px solid ${bleConnected ? 'rgba(52,211,153,0.25)' : 'rgba(251,146,60,0.25)'}`,
          }}
        >
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: bleConnected ? C.green : C.orange }} />
          <span style={{ fontSize: 8, fontWeight: 700, color: bleConnected ? C.green : C.orange }}>
            {bleConnected ? 'Puff' : 'Connect'}
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          padding: '2px 7px', borderRadius: 100,
          background: 'rgba(255,217,61,0.06)', border: '1px solid rgba(255,217,61,0.12)',
        }}>
          <span style={{ fontSize: 9 }}>🪙</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, fontFamily: "'Courier New',monospace" }}>
            {coins.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
