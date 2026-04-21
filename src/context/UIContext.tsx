import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { C, SPECTATOR_NAMES, SPECTATOR_EMOJIS, SPECTATOR_TICKER_MSGS } from '../constants'
import { useGameContext } from './GameContext'

interface UIContextValue {
  // ── Screen Effects ──
  screenShake: boolean
  setScreenShake: React.Dispatch<React.SetStateAction<boolean>>
  screenFlash: string | null
  setScreenFlash: React.Dispatch<React.SetStateAction<string | null>>
  dimLights: boolean
  setDimLights: React.Dispatch<React.SetStateAction<boolean>>
  puffBubbles: any[]
  setPuffBubbles: React.Dispatch<React.SetStateAction<any[]>>
  audienceBubbles: any[]
  setAudienceBubbles: React.Dispatch<React.SetStateAction<any[]>>
  floatingReactions: any[]
  setFloatingReactions: React.Dispatch<React.SetStateAction<any[]>>

  // ── Spectators ──
  liveSpectators: any[]
  spectatorCount: number
  setSpectatorCount: React.Dispatch<React.SetStateAction<number>>
  crowdEnergy: number
  setCrowdEnergy: React.Dispatch<React.SetStateAction<number>>
  crowdEruption: boolean
  spectatorTicker: any[]
  spawnSpectatorPuff: (forceColor?: string) => void

  // ── Arena Atmosphere ──
  arenaAtmosphere: {
    smokeLevel: number
    energyLevel: number
    temperature: string
    weather: string
    peakHour: boolean
    onlineCount: number
    is420: boolean
    goldParticles: boolean
  }
}

const UICtx = createContext<UIContextValue>(null!)
export const useUIContext = () => useContext(UICtx)

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const game = useGameContext()

  // ── Screen Effects ──
  const [screenShake, setScreenShake] = useState(false)
  const [screenFlash, setScreenFlash] = useState<string | null>(null)
  const [dimLights, setDimLights] = useState(false)
  const [puffBubbles, setPuffBubbles] = useState<any[]>([])
  const [audienceBubbles, setAudienceBubbles] = useState<any[]>([])
  const [floatingReactions, setFloatingReactions] = useState<any[]>([])

  // ── Spectators ──
  const [liveSpectators, setLiveSpectators] = useState<any[]>([])
  const [spectatorCount, setSpectatorCount] = useState(Math.floor(120 + Math.random() * 80))
  const [crowdEnergy, setCrowdEnergy] = useState(0)
  const [crowdEruption, setCrowdEruption] = useState(false)
  const [spectatorTicker, setSpectatorTicker] = useState<any[]>([])
  const spectatorIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Atmosphere ──
  const [arenaAtmosphere, setArenaAtmosphere] = useState({
    smokeLevel: 12,
    energyLevel: 15,
    temperature: "chill",
    weather: "clear",
    peakHour: false,
    onlineCount: 1247,
    is420: false,
    goldParticles: false,
  })

  const spawnSpectatorPuff = useCallback((forceColor?: string) => {
    const name = SPECTATOR_NAMES[Math.floor(Math.random() * SPECTATOR_NAMES.length)]
    const emoji = SPECTATOR_EMOJIS[Math.floor(Math.random() * SPECTATOR_EMOJIS.length)]
    const puffDur = (1 + Math.random() * 4).toFixed(1)
    const side = Math.floor(Math.random() * 4)
    const tColors = [C.cyan, C.pink, C.purple, C.orange, C.gold, C.green, C.blue]
    const color = forceColor || tColors[Math.floor(Math.random() * tColors.length)]
    let sx = 0, sy = 0, ex = 0, ey = 0
    if (side === 0) { sx = -5; sy = 20 + Math.random() * 60; ex = 40 + Math.random() * 30; ey = 10 + Math.random() * 30 }
    else if (side === 1) { sx = 105; sy = 20 + Math.random() * 60; ex = 30 + Math.random() * 30; ey = 10 + Math.random() * 30 }
    else if (side === 2) { sx = 20 + Math.random() * 60; sy = -5; ex = 30 + Math.random() * 40; ey = 30 + Math.random() * 20 }
    else { sx = 20 + Math.random() * 60; sy = 105; ex = 30 + Math.random() * 40; ey = 40 + Math.random() * 30 }
    const id = `spec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    setLiveSpectators(prev => [...prev.slice(-14), { id, name, emoji, puffDur, color, sx, sy, ex, ey, ts: Date.now() }])
    setCrowdEnergy(prev => Math.min(100, prev + 4 + Math.floor(Math.random() * 6)))
    setSpectatorCount(prev => prev + (Math.random() < 0.3 ? 1 : 0))
    if (Math.random() < 0.4) {
      const msg = SPECTATOR_TICKER_MSGS[Math.floor(Math.random() * SPECTATOR_TICKER_MSGS.length)]
      setSpectatorTicker(prev => [...prev.slice(-4), { name, msg, emoji, ts: Date.now() }])
    }
  }, [])

  // Spectator spawn loop
  useEffect(() => {
    const inGame = !!(game.gameActive || game.matchmaking || game.wcPhase)
    if (inGame) {
      const loop = () => {
        spawnSpectatorPuff()
        spectatorIntervalRef.current = setTimeout(loop, 2000 + Math.random() * 3000)
      }
      spectatorIntervalRef.current = setTimeout(loop, 1000)
      return () => { if (spectatorIntervalRef.current) clearTimeout(spectatorIntervalRef.current) }
    } else {
      setCrowdEnergy(0)
      setLiveSpectators([])
      setSpectatorTicker([])
      if (spectatorIntervalRef.current) clearTimeout(spectatorIntervalRef.current)
    }
  }, [game.gameActive, game.matchmaking, game.wcPhase, spawnSpectatorPuff])

  // Crowd energy decay
  useEffect(() => {
    const d = setInterval(() => setCrowdEnergy(p => Math.max(0, p - 2)), 1500)
    return () => clearInterval(d)
  }, [])

  // Crowd eruption
  useEffect(() => {
    if (crowdEnergy >= 95 && !crowdEruption) {
      setCrowdEruption(true)
      for (let i = 0; i < 5; i++) setTimeout(() => spawnSpectatorPuff(C.gold), i * 200)
      setTimeout(() => setCrowdEruption(false), 3000)
    }
  }, [crowdEnergy, crowdEruption, spawnSpectatorPuff])

  // Cleanup old spectator puffs
  useEffect(() => {
    const c = setInterval(() => {
      const n = Date.now()
      setLiveSpectators(p => p.filter(s => n - s.ts < 4000))
    }, 1000)
    return () => clearInterval(c)
  }, [])

  // Cleanup old floating reactions
  useEffect(() => {
    const c = setInterval(() => {
      setFloatingReactions(p => p.length > 0 ? p.slice(-10) : [])
    }, 3000)
    return () => clearInterval(c)
  }, [])

  // Atmosphere engine
  useEffect(() => {
    const atmosTimer = setInterval(() => {
      setArenaAtmosphere(prev => {
        const inGame = !!game.gameActive
        let smoke = prev.smokeLevel + (Math.random() * 10 - 4) + (inGame ? 3 : -1)
        smoke = Math.max(0, Math.min(100, smoke))
        let energy = prev.energyLevel + (inGame ? (Math.random() * 8 + 2) : (Math.random() * 6 - 5))
        energy = Math.max(0, Math.min(100, energy))
        const temperature = energy < 25 ? "chill" : energy < 50 ? "warm" : energy < 75 ? "hot" : "blazing"
        const weather = smoke < 20 ? "clear" : smoke < 40 ? "hazy" : smoke < 60 ? "cloudy" : smoke < 80 ? "foggy" : "storm"
        let onlineCount = prev.onlineCount + Math.floor(Math.random() * 40 - 18)
        onlineCount = Math.max(800, Math.min(5000, onlineCount))
        const peakHour = energy > 70
        const is420 = onlineCount === 420 || onlineCount === 4200 || String(onlineCount).includes("420")
        return { smokeLevel: smoke, energyLevel: energy, temperature, weather, peakHour, onlineCount, is420, goldParticles: is420 }
      })
    }, 10000)
    return () => clearInterval(atmosTimer)
  }, [game.gameActive])

  return (
    <UICtx.Provider value={{
      screenShake, setScreenShake, screenFlash, setScreenFlash,
      dimLights, setDimLights, puffBubbles, setPuffBubbles,
      audienceBubbles, setAudienceBubbles, floatingReactions, setFloatingReactions,
      liveSpectators, spectatorCount, setSpectatorCount,
      crowdEnergy, setCrowdEnergy, crowdEruption, spectatorTicker, spawnSpectatorPuff,
      arenaAtmosphere,
    }}>
      {children}
    </UICtx.Provider>
  )
}
