import { useState, useRef, useCallback } from 'react'
import { UNIVERSAL_PUFF_CONFIG } from '@/constants/games'
import type { SweetSpot } from '@/types'

export function usePuffMeter() {
  const [power, setPower] = useState(0)
  const [charging, setCharging] = useState(false)
  const [sweetSpot, setSweetSpot] = useState<SweetSpot>({ min: 40, max: 70 })
  const [blinkerUsed, setBlinkerUsed] = useState(false)

  const chargeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chargeStartRef = useRef<number>(0)

  const randomizeSweetSpot = useCallback(() => {
    const ss = UNIVERSAL_PUFF_CONFIG.randomizeSweetSpot()
    setSweetSpot(ss)
    setBlinkerUsed(false)
    setPower(0)
    return ss
  }, [])

  const getPuffZone = useCallback((p: number) => {
    const zones = UNIVERSAL_PUFF_CONFIG.zones
    for (const z of zones) {
      if (p <= z.max) return z
    }
    return zones[zones.length - 1]
  }, [])

  const getPuffResult = useCallback((p: number, ss: SweetSpot) => {
    const blinker = p >= UNIVERSAL_PUFF_CONFIG.blinkerThreshold
    const inSweet = p >= ss.min && p <= ss.max
    const zone = getPuffZone(p)

    if (blinker) {
      return {
        zone: 'blinker' as const,
        multiplier: 3.0,
        label: 'BLINKER!',
        color: '#FF4444',
        emoji: '💀',
        blinkerBonus: true,
      }
    }
    if (inSweet) {
      return {
        zone: 'perfect' as const,
        multiplier: 2.0,
        label: 'PERFECT!',
        color: '#7FFF00',
        emoji: '🎯',
      }
    }
    const zoneName = zone.name.toLowerCase() as 'tap' | 'short' | 'good' | 'perfect' | 'blinker'
    const multipliers: Record<string, number> = { tap: 0.3, short: 0.6, good: 1.0, perfect: 1.5, blinker: 3.0 }
    const emojis: Record<string, string> = { tap: '👆', short: '💨', good: '👍', perfect: '🎯', blinker: '💀' }
    return {
      zone: zoneName,
      multiplier: multipliers[zoneName] ?? 1.0,
      label: zone.name,
      color: zone.color,
      emoji: emojis[zoneName] ?? '💨',
    }
  }, [getPuffZone])

  const startCharge = useCallback(() => {
    if (charging) return
    setCharging(true)
    setPower(0)
    chargeStartRef.current = Date.now()
    chargeIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - chargeStartRef.current
      const newPower = Math.min(100, (elapsed / 5000) * 100)
      setPower(newPower)
      if (newPower >= 100) {
        if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current)
      }
    }, 16)
  }, [charging])

  const stopCharge = useCallback(() => {
    if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current)
    setCharging(false)
    const elapsed = Date.now() - chargeStartRef.current
    const finalPower = Math.min(100, (elapsed / 5000) * 100)
    if (finalPower >= UNIVERSAL_PUFF_CONFIG.blinkerThreshold) {
      setBlinkerUsed(true)
    }
    return finalPower
  }, [])

  const reset = useCallback(() => {
    if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current)
    setPower(0)
    setCharging(false)
    setBlinkerUsed(false)
  }, [])

  return {
    power,
    setPower,
    charging,
    setCharging,
    sweetSpot,
    blinkerUsed,
    setBlinkerUsed,
    randomizeSweetSpot,
    getPuffZone,
    getPuffResult,
    startCharge,
    stopCharge,
    reset,
    chargeIntervalRef,
    chargeStartRef,
  }
}
