import React from 'react'
import { useBLEContext } from '../../context/BLEContext'
import { useGameContext } from '../../context/GameContext'

const SLOT_COLORS = ["#00E5FF", "#60A5FA", "#FFD93D", "#FF6B8A"]
const SLOT_LABELS = ["P1", "P2", "P3", "P4"]

export const BLEPopup: React.FC = () => {
  const { showBlePopup, setShowBlePopup } = useGameContext()
  const { bleDevices, bleScanning, partyPlayerNames, connectBleSlot, disconnectBleSlot } = useBLEContext()

  if (!showBlePopup) return null

  const connectedCount = bleDevices.filter(d => d.connected).length

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}>
      <div style={{ width: "90%", maxWidth: 380, borderRadius: 20, padding: 20, background: "rgba(6,16,30,0.95)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 2, background: "linear-gradient(135deg, #00E5FF, #C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>DEVICE HUB</div>
          <div style={{ fontSize: 10, color: "rgba(232,235,246,0.4)", marginTop: 4 }}>Connect up to 4 Cali Clear devices</div>
        </div>

        {[0, 1, 2, 3].map(slot => {
          const dev = bleDevices.find(d => d.slot === slot)
          const isConnected = dev && dev.connected
          const playerName = partyPlayerNames[slot] || ("Player " + (slot + 1))
          const color = SLOT_COLORS[slot]
          return (
            <div key={slot} style={{ padding: "10px 14px", borderRadius: 14, marginBottom: 8, background: isConnected ? color + "10" : "rgba(255,255,255,0.02)", border: "1px solid " + (isConnected ? color + "30" : "rgba(255,255,255,0.05)"), display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: isConnected ? color : "rgba(255,255,255,0.15)", boxShadow: isConnected ? "0 0 8px " + color + "60" : "none", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: isConnected ? color : "rgba(232,235,246,0.4)" }}>{SLOT_LABELS[slot]}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: isConnected ? "rgba(232,235,246,0.8)" : "rgba(232,235,246,0.3)" }}>{isConnected ? playerName : "Empty"}</span>
                </div>
                {isConnected && <div style={{ fontSize: 8, color: "rgba(232,235,246,0.3)", marginTop: 2 }}>{dev!.deviceName || "Cali Clear"}</div>}
              </div>
              {isConnected ? (
                <div onClick={() => disconnectBleSlot(slot)} style={{ touchAction: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.2)", fontSize: 9, fontWeight: 700, color: "#FF6B6B" }}>Disconnect</div>
              ) : (
                <div onClick={() => { if (!bleScanning) connectBleSlot(slot) }} style={{ touchAction: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", background: color + "12", border: "1px solid " + color + "25", fontSize: 9, fontWeight: 700, color }}>
                  {bleScanning ? "Scanning..." : "Connect"}
                </div>
              )}
            </div>
          )
        })}

        <div style={{ textAlign: "center", marginTop: 12, padding: "8px 0", borderRadius: 10, background: "rgba(255,255,255,0.02)" }}>
          <div style={{ fontSize: 10, color: "rgba(232,235,246,0.5)" }}>
            {connectedCount === 0 ? "No devices connected — tap Connect to start" : connectedCount + " device" + (connectedCount > 1 ? "s" : "") + " connected — " + connectedCount + " player" + (connectedCount > 1 ? "s" : "")}
          </div>
          <div style={{ fontSize: 8, color: "rgba(232,235,246,0.25)", marginTop: 2 }}>Each person holds their own Cali Clear as a controller</div>
        </div>

        <div onClick={() => setShowBlePopup(false)} style={{ touchAction: "none", textAlign: "center", marginTop: 12, padding: "10px 0", borderRadius: 12, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12, fontWeight: 700, color: "rgba(232,235,246,0.6)" }}>Close</div>
      </div>
    </div>
  )
}
