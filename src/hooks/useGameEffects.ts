import { useState, useRef, useCallback } from 'react'
import { C, UNIVERSAL_PUFF_CONFIG } from '../constants'

// ── Puff Power Calculation ──
// Maps puff duration (seconds) to power percentage (0-100%)
export const getPuffPower = (elapsed: number): number => {
  if (elapsed < 0.5) return Math.round(elapsed / 0.5 * 15) // 0-15% TAP
  if (elapsed < 1.5) return Math.round(15 + (elapsed - 0.5) / 1.0 * 25) // 15-40% SHORT
  if (elapsed < 2.5) return Math.round(40 + (elapsed - 1.5) / 1.0 * 30) // 40-70% GOOD
  if (elapsed < 3.5) return Math.round(70 + (elapsed - 2.5) / 1.0 * 25) // 70-95% SWEET SPOT
  if (elapsed < 4.5) return Math.round(95 - (elapsed - 3.5) / 1.0 * 20) // 95→75% dropping
  if (elapsed < 5.0) return Math.round(75 - (elapsed - 4.5) / 0.5 * 45) // 75→30% BLINKER ZONE
  return 30 // capped at blinker
}

// ── Puff Zone Classification ──
export const getUniversalPuffZone = (power: number, sweetSpot: { min: number; max: number }): string => {
  if (power >= sweetSpot.min && power <= sweetSpot.max) return "perfect"
  if (power >= UNIVERSAL_PUFF_CONFIG.blinkerThreshold) return "blinker"
  if (power >= 65) return "good"
  if (power >= 40) return "good"
  if (power >= 15) return "short"
  return "tap"
}

// ── Puff Result (with multiplier, label, color) ──
export const getUniversalPuffResult = (
  power: number,
  sweetSpot: { min: number; max: number },
  blinkerUsed: boolean
) => {
  const zone = getUniversalPuffZone(power, sweetSpot)
  if (zone === "perfect") return { zone, multiplier: 1.5, label: "PERFECT PUFF!", color: C.lime, emoji: "👑" }
  if (zone === "blinker" && !blinkerUsed) return { zone, multiplier: 2.0, label: "BLINKER BONUS!", color: C.red, emoji: "💀", blinkerBonus: true }
  if (zone === "blinker" && blinkerUsed) return { zone, multiplier: 0.5, label: "BLINKER (used)", color: C.red, emoji: "💀" }
  if (zone === "good") return { zone, multiplier: 1.0, label: "Good puff", color: C.cyan, emoji: "👌" }
  if (zone === "short") return { zone, multiplier: 0.7, label: "Short puff", color: C.gold, emoji: "😐" }
  return { zone, multiplier: 0.3, label: "Barely a tap", color: C.text3, emoji: "👎" }
}

// ── Randomize Sweet Spot ──
export const randomizeSweetSpot = (): { min: number; max: number } => {
  return UNIVERSAL_PUFF_CONFIG.randomizeSweetSpot()
}

// ── Canvas DPR helper ──
export const getCanvasDPR = (): number => {
  return typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
}

// ── Hook: Universal Puff State ──
// Manages puff charging, power tracking, sweet spot, and blinker state
export const usePuffState = () => {
  const [universalSweetSpot, setUniversalSweetSpot] = useState({ min: 55, max: 80 })
  const [blinkerUsed, setBlinkerUsed] = useState(false)
  const [puffPower, setPuffPower] = useState(0)
  const [puffCharging, setPuffCharging] = useState(false)
  const puffStartTime = useRef<number | null>(null)
  const puffInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const startPuff = useCallback(() => {
    puffStartTime.current = Date.now()
    setPuffCharging(true)
    if (puffInterval.current) clearInterval(puffInterval.current)
    puffInterval.current = setInterval(() => {
      if (!puffStartTime.current) return
      const elapsed = (Date.now() - puffStartTime.current) / 1000
      setPuffPower(getPuffPower(elapsed))
    }, 50)
  }, [])

  const endPuff = useCallback(() => {
    if (puffInterval.current) clearInterval(puffInterval.current)
    puffInterval.current = null
    setPuffCharging(false)
    const elapsed = puffStartTime.current ? (Date.now() - puffStartTime.current) / 1000 : 0
    puffStartTime.current = null
    const power = getPuffPower(elapsed)
    setPuffPower(power)
    const result = getUniversalPuffResult(power, universalSweetSpot, blinkerUsed)
    if (result.zone === "blinker" && !blinkerUsed) setBlinkerUsed(true)
    return { power, elapsed, result }
  }, [universalSweetSpot, blinkerUsed])

  const resetRound = useCallback(() => {
    const ss = randomizeSweetSpot()
    setUniversalSweetSpot(ss)
    setBlinkerUsed(false)
    setPuffPower(0)
    setPuffCharging(false)
    return ss
  }, [])

  return {
    universalSweetSpot, setUniversalSweetSpot,
    blinkerUsed, setBlinkerUsed,
    puffPower, setPuffPower,
    puffCharging, setPuffCharging,
    puffStartTime,
    startPuff, endPuff, resetRound,
  }
}

// ── Render Universal Puff Bar ──
// Returns JSX for the puff power meter overlay
export const renderUniversalPuffBar = (
  power: number,
  charging: boolean,
  sweetSpot: { min: number; max: number },
  blinkerUsed: boolean,
  opts: { width?: string; showButton?: boolean } = {}
) => {
  const { width = "100%" } = opts
  const zone = getUniversalPuffZone(power, sweetSpot)
  const zoneColor = zone === "perfect" ? C.lime : zone === "blinker" ? C.red : zone === "good" ? C.cyan : zone === "short" ? C.gold : C.text3
  const zoneLabel = zone === "perfect" ? "PERFECT 👑" : zone === "blinker" ? (blinkerUsed ? "BLINKER (used) 💀" : "BLINKER BONUS! 💀") : zone === "good" ? "Good 👌" : zone === "short" ? "Short" : "Tap"

  return {
    width, zone, zoneColor, zoneLabel, power, charging, sweetSpot, blinkerUsed,
    zones: UNIVERSAL_PUFF_CONFIG.zones,
  }
}
