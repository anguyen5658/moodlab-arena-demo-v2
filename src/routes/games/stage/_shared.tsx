import React from 'react'
import { C } from '../../../constants'

export interface StageHeaderProps {
  title: string
  titleColor: string
  coins: number
  bleConnected: boolean
  onBack: () => void
  rightText?: string
}

export const StageHeader: React.FC<StageHeaderProps> = ({ title, titleColor, coins, bleConnected, onBack, rightText }) => (
  <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: `1px solid ${titleColor}25` }}>
    <div style={{ padding: '6px 12px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
        <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>Powered by <span style={{ fontWeight: 900, letterSpacing: 2 }}>MOOD LAB</span></span>
      </div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 100, background: bleConnected ? 'rgba(52,211,153,0.1)' : 'rgba(251,146,60,0.1)', border: `1px solid ${bleConnected ? 'rgba(52,211,153,0.25)' : 'rgba(251,146,60,0.25)'}` }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: bleConnected ? C.green : C.orange }} />
          <span style={{ fontSize: 8, fontWeight: 700, color: bleConnected ? C.green : C.orange }}>{bleConnected ? 'Puff' : 'Connect'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 7px', borderRadius: 100, background: 'rgba(255,217,61,0.06)', border: '1px solid rgba(255,217,61,0.12)' }}>
          <span style={{ fontSize: 9 }}>🪙</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, fontFamily: "'Courier New',monospace" }}>{coins.toLocaleString()}</span>
        </div>
      </div>
    </div>
    <div style={{ padding: '2px 12px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
      <div onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '3px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, touchAction: 'none' }}>
        <span style={{ fontSize: 10, color: C.text2 }}>←</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>Back</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: titleColor }}>{title}</span>
      </div>
      {rightText && <span style={{ fontSize: 9, color: C.text3 }}>{rightText}</span>}
    </div>
  </div>
)

export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
