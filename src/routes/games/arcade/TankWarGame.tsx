import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { useUIContext } from '../../../context/UIContext'

// ════════════════════════════════════════════════════════
// TANK WAR — Full monolith port (lines 12060-12468 + 21222-21601)
// 4 modes: 1v1 Duel · 2v2 Teams · Free-for-All · Boss Battle
// 3-tab lobby: BATTLE / SHOP / RANK
// ════════════════════════════════════════════════════════

const TW_W = 860
const TW_H = 600
const TW_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
const TW_GRAVITY = 0.26
const TW_WIND_FACTOR = 0.018
const TW_TURN_TIME = 22

interface TwBoss { name: string; emoji: string; maxHp: number; color: string; attacks: { name: string; dmg: number }[]; hp?: number; x?: number; y?: number }
const TW_BOSSES: TwBoss[] = [
  { name: 'Fire Dragon', emoji: '🐉', maxHp: 600, color: '#FF4500', attacks: [{ name: 'Flame', dmg: 35 }, { name: 'Fireball', dmg: 50 }] },
  { name: 'Iron Titan', emoji: '🤖', maxHp: 500, color: '#708090', attacks: [{ name: 'Laser', dmg: 40 }, { name: 'Slam', dmg: 55 }] },
  { name: 'Death Lord', emoji: '💀', maxHp: 700, color: '#8B0000', attacks: [{ name: 'Scythe', dmg: 45 }, { name: 'Curse', dmg: 30 }] },
  { name: 'Volcano', emoji: '🌋', maxHp: 800, color: '#FF6347', attacks: [{ name: 'Meteor', dmg: 60 }, { name: 'Lava', dmg: 35 }] },
]

const TW_AI_NAMES = ['GreenCloud', 'PuffSniper', 'BlazeTank', 'SmokeRider', 'IronPuff', 'NeonGunner', 'CaliKiller', 'TankMaster']

const TW_RANKS = [
  { name: 'BRONZE', emoji: '🥉', color: '#cd7f32', mn: 0, mx: 100 },
  { name: 'SILVER', emoji: '🥈', color: '#c0c0c0', mn: 100, mx: 250 },
  { name: 'GOLD', emoji: '🥇', color: '#FFD700', mn: 250, mx: 450 },
  { name: 'DIAMOND', emoji: '💎', color: '#b9f2ff', mn: 450, mx: 700 },
  { name: 'MASTER', emoji: '👑', color: '#FF4500', mn: 700, mx: 9999 },
]

interface TwShopItem { id: string; cat: 'skin' | 'trail' | 'boost'; name: string; emoji: string; desc: string; price: number; color: string }
const TW_SHOP: TwShopItem[] = [
  { id: 'skin_default', cat: 'skin', name: 'Military', emoji: '🪖', desc: 'Default camo', price: 0, color: '#4CAF50' },
  { id: 'skin_camo', cat: 'skin', name: 'Jungle', emoji: '🌿', desc: 'Forest blend', price: 50, color: '#5a7247' },
  { id: 'skin_gold', cat: 'skin', name: 'Gold', emoji: '✨', desc: 'Flex mode', price: 150, color: '#DAA520' },
  { id: 'skin_neon', cat: 'skin', name: 'Neon', emoji: '💜', desc: 'Glow up', price: 100, color: '#B44DFF' },
  { id: 'skin_lava', cat: 'skin', name: 'Legendary', emoji: '🔥', desc: 'On fire', price: 300, color: '#FF4500' },
  { id: 'trail_default', cat: 'trail', name: 'Fire', emoji: '🔥', desc: 'Classic orange', price: 0, color: '#FF6B35' },
  { id: 'trail_blue', cat: 'trail', name: 'Ice', emoji: '💙', desc: 'Cold streak', price: 80, color: '#4DB8FF' },
  { id: 'trail_star', cat: 'trail', name: 'Star', emoji: '⭐', desc: 'Sparkle', price: 60, color: '#FFD700' },
  { id: 'trail_toxic', cat: 'trail', name: 'Toxic', emoji: '☠️', desc: 'Deadly', price: 120, color: '#7CFF6B' },
  { id: 'boost_x2xp', cat: 'boost', name: 'x2 XP', emoji: '⚡', desc: 'Next game', price: 25, color: '#FFD93D' },
  { id: 'boost_4bag', cat: 'boost', name: '+1 Bag', emoji: '🎁', desc: '4 mystery bags', price: 30, color: '#FF6B8A' },
]

interface TwZone { k: string; mn: number; mx: number; dmg: number; cr: number; color: string; label: string }
const TW_ZONES: TwZone[] = [
  { k: 'low', mn: 0, mx: 15, dmg: 14, cr: 0.04, color: '#FF8C00', label: 'LOW' },
  { k: 'mid', mn: 15, mx: 45, dmg: 28, cr: 0.09, color: '#7CFF6B', label: 'MID' },
  { k: 'sweet', mn: 45, mx: 80, dmg: 55, cr: 0.28, color: '#7CFF6B', label: 'SWEET!' },
  { k: 'over', mn: 80, mx: 101, dmg: 85, cr: 0.55, color: '#FF5A5A', label: 'OVERLOAD' },
]

const TW_BOT_HIT = ['Direct hit! 🎯', 'That was CLEAN 💀', 'Ez target 😎', 'Ăn đạn! 😈']
const TW_BOT_MISS = ['Wind saved you 😤', 'Next time... 🔥', 'Hmm 🤔']
const TW_BOT_GOTHIT = ['OW! 😭', 'That hurt! 😤', 'Revenge time! 🔥', 'Not bad... 😏']
const TW_ROASTS = [
  'That shot was FILTHY', 'Bro the wind said no', 'THE CROWD GOES INSANE',
  'Did you just heal? COWARD', 'That angle was... creative', 'The terrain is crying right now',
  "CloudChaser420 would've hit that", "That's a war crime, not a shot",
  'Someone call the Geneva Convention', "The wind: 'I gotchu fam'",
  'Absolute SNIPER precision', 'Even the AI felt that one', 'The tank said NOPE',
]
const twRoast = () => TW_ROASTS[Math.floor(Math.random() * TW_ROASTS.length)]

interface Tank { id: number; name: string; hp: number; maxHp: number; x: number; y: number; color: string; team: number; isPlayer: boolean; isAI: boolean; alive: boolean }
interface Bullet { x: number; y: number; vx: number; vy: number; dmg: number; crit: boolean; isPuff: boolean; isBlinker: boolean; mult: number; zone?: TwZone; inSweet?: boolean; trail: { x: number; y: number }[] }
interface ChatMsg { name: string; msg: string; color: string; t: number }
interface Explosion { x: number; y: number; radius: number; isPuff: boolean; isBlinker: boolean; t: number }
interface LastHit { amt: number; crit: boolean; isPuff: boolean; isBlinker: boolean; x: number; y: number; t: number }

type Phase = 'intro' | 'modeselect' | 'aiming' | 'power' | 'puff_charging' | 'puff_angle_set' | 'heal_charging' | 'flying' | 'ai' | 'boss_attack' | 'complete' | null
type Mode = '1v1' | '2v2' | 'ffa' | 'boss'
type LobbyTab = 'battle' | 'shop' | 'rank'

export const TankWarGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()
  const ui = useUIContext()

  // ── State ──
  const [twPhase, setTwPhase] = useState<Phase>(null)
  const [twMode, setTwMode] = useState<Mode>('1v1')
  const [twTanks, setTwTanks] = useState<Tank[]>([])
  const [twBoss, setTwBoss] = useState<TwBoss | null>(null)
  const [twAngle, setTwAngle] = useState(45)
  const [twLockedAngle, setTwLockedAngle] = useState<number | null>(null)
  const [twPower, setTwPower] = useState(0)
  const [twWind, setTwWind] = useState(0)
  const [twTurnIdx, setTwTurnIdx] = useState(0)
  const [twRound, setTwRound] = useState(0)
  const [twLastHit, setTwLastHit] = useState<LastHit | null>(null)
  const [twScore, setTwScore] = useState(0)
  const [twPuffShotReady, setTwPuffShotReady] = useState(false)
  const [twPuffShotCooldown, setTwPuffShotCooldown] = useState(3)
  const [twAction, setTwAction] = useState<'fire' | 'heal'>('fire')
  const [twFlying, setTwFlying] = useState(false)
  const [twExplosion, setTwExplosion] = useState<Explosion | null>(null)
  const [twPuffStreak, setTwPuffStreak] = useState(0)
  const [twPuffPhase, setTwPuffPhase] = useState(0)
  const [twTimer, setTwTimer] = useState(TW_TURN_TIME)
  const [twChatMsgs, setTwChatMsgs] = useState<ChatMsg[]>([])
  const [twLobbyTab, setTwLobbyTab] = useState<LobbyTab>('battle')
  const [twBossIdx, setTwBossIdx] = useState(0)
  const [twSelectedMode, setTwSelectedMode] = useState<Mode | null>(null)
  const [twZoom, setTwZoom] = useState(1)
  const [commentary, setCommentary] = useState('')

  // ── Refs ──
  const twCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const twTerrainRef = useRef<number[] | null>(null)
  const twBulletRef = useRef<Bullet | null>(null)
  const twDrawRafRef = useRef<number | null>(null)
  const twBulletRafRef = useRef<number | null>(null)
  const twPowerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const twPuffStartRef = useRef<number>(0)
  const twTanksRef = useRef<Tank[]>([])
  const twBossRef = useRef<TwBoss | null>(null)
  const twPuffStreakRef = useRef(0)
  const twSweetSpot = useRef({ mn: 45, mx: 78 })
  const twCharging = useRef(false)
  const twTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const twTurnIdxRef = useRef(0)
  const twPhaseRef = useRef<Phase>(null)
  const twAngleRef = useRef(45)
  const twPowerRef = useRef(0)
  const twModeRef = useRef<Mode>('1v1')
  const startedRef = useRef(false)

  useEffect(() => { twPuffStreakRef.current = twPuffStreak }, [twPuffStreak])
  useEffect(() => { twPhaseRef.current = twPhase }, [twPhase])
  useEffect(() => { twAngleRef.current = twAngle }, [twAngle])
  useEffect(() => { twPowerRef.current = twPower }, [twPower])
  useEffect(() => { twModeRef.current = twMode }, [twMode])
  useEffect(() => { twTanksRef.current = twTanks }, [twTanks])
  useEffect(() => { if (twBoss) twBossRef.current = twBoss }, [twBoss])

  // ── Helpers ──
  const triggerShake = useCallback(() => {
    ui.setScreenShake(true); setTimeout(() => ui.setScreenShake(false), 400)
  }, [ui])
  const triggerFlash = useCallback((kind: string) => {
    ui.setScreenFlash(kind); setTimeout(() => ui.setScreenFlash(null), 400)
  }, [ui])

  const twAddChat = useCallback((name: string, msg: string, color: string) => {
    setTwChatMsgs(prev => [...prev.slice(-8), { name, msg, color, t: Date.now() }])
  }, [])

  const twGenTerrain = useCallback((): number[] => {
    const t = new Array(TW_W) as number[]
    let h = TW_H * 0.48 + (Math.random() - 0.5) * 30
    for (let i = 0; i < TW_W; i++) {
      h += (Math.random() - 0.5) * 3
      h = Math.max(TW_H * 0.32, Math.min(TW_H * 0.68, h))
      t[i] = h
    }
    for (let p = 0; p < 3; p++) {
      for (let i = 1; i < TW_W - 1; i++) t[i] = (t[i - 1] + t[i] + t[i + 1]) / 3
    }
    return t
  }, [])

  const twPlaceTanks = useCallback((mode: Mode, terrain: number[]): Tank[] => {
    const w = TW_W
    const tanks: Tank[] = []
    const mk = (id: number, name: string, x: number, color: string, team: number, isP: boolean): Tank => {
      const tx = Math.max(22, Math.min(w - 22, x))
      return { id, name, hp: 100, maxHp: 100, x: tx, y: terrain[Math.floor(tx)], color, team, isPlayer: isP, isAI: !isP, alive: true }
    }
    if (mode === '1v1') {
      tanks.push(mk(0, 'You', 60, '#4CAF50', 0, true))
      tanks.push(mk(1, TW_AI_NAMES[0], w - 60, '#EF4444', 1, false))
    } else if (mode === '2v2') {
      tanks.push(mk(0, 'You', 40, '#4CAF50', 0, true))
      tanks.push(mk(1, TW_AI_NAMES[1], 100, '#66BB6A', 0, false))
      tanks.push(mk(2, TW_AI_NAMES[2], w - 100, '#EF4444', 1, false))
      tanks.push(mk(3, TW_AI_NAMES[3], w - 40, '#E53935', 1, false))
    } else if (mode === 'ffa') {
      tanks.push(mk(0, 'You', 50, '#4CAF50', 0, true))
      tanks.push(mk(1, TW_AI_NAMES[0], Math.floor(w * 0.33), '#EF4444', 1, false))
      tanks.push(mk(2, TW_AI_NAMES[1], Math.floor(w * 0.66), '#3B82F6', 2, false))
      tanks.push(mk(3, TW_AI_NAMES[2], w - 50, '#F59E0B', 3, false))
    } else if (mode === 'boss') {
      tanks.push(mk(0, 'You', 40, '#4CAF50', 0, true))
      tanks.push(mk(1, TW_AI_NAMES[4], 100, '#66BB6A', 0, false))
      tanks.push(mk(2, TW_AI_NAMES[5], 160, '#81C784', 0, false))
      tanks.push(mk(3, TW_AI_NAMES[6], 220, '#A5D6A7', 0, false))
    }
    return tanks
  }, [])

  // ── Damage calculation ──
  const twCalcDmg = useCallback((power: number) => {
    const ss = twSweetSpot.current
    const inSweet = power >= ss.mn && power <= ss.mx
    const zone = TW_ZONES.find(z => power >= z.mn && power < z.mx) || TW_ZONES[3]
    let baseDmg = zone.dmg
    if (inSweet) baseDmg = Math.round(baseDmg * 1.42)
    const crit = Math.random() < zone.cr
    return { baseDmg, crit, zone, inSweet }
  }, [])

  // Forward refs for mutually recursive functions
  const twDrawRef = useRef<() => void>(() => {})
  const twNextRef = useRef<() => void>(() => {})
  const twCheckRef = useRef<() => void>(() => {})
  const twDoAIRef = useRef<(idx: number) => void>(() => {})
  const twBossAtkRef = useRef<() => void>(() => {})
  const twFireShotRef = useRef<(angle: number, power: number, mult: number, isPuff: boolean, isBlinker: boolean) => void>(() => {})
  const twExplodeRef = useRef<(x: number, y: number, dmg: number, crit: boolean, isPuff: boolean, isBlinker: boolean) => void>(() => {})
  const twHitBossRef = useRef<(dmg: number, crit: boolean, isPuff: boolean, isBlinker: boolean) => void>(() => {})
  const twWinGameRef = useRef<() => void>(() => {})
  const twLoseGameRef = useRef<() => void>(() => {})

  const twWinGame = useCallback(() => {
    if (twTimerRef.current) { clearInterval(twTimerRef.current); twTimerRef.current = null }
    setCommentary('VICTORY! ' + twRoast())
    audio.playFx('win')
    player.spawnConfetti(30)
    triggerFlash('goal')
    setTimeout(() => {
      player.recordGameResult(true, 60 + Math.min(twScore, 100), 20, { bleConnected: ble.bleConnected, zone: 'arcade', gameActive: game.gameActive })
      setTwPhase('complete')
    }, 1500)
  }, [audio, player, ble, game, triggerFlash, twScore])

  const twLoseGame = useCallback(() => {
    if (twTimerRef.current) { clearInterval(twTimerRef.current); twTimerRef.current = null }
    setCommentary('Defeated! ' + twRoast())
    audio.playFx('lose')
    setTimeout(() => {
      player.recordGameResult(false, 0, 8, { bleConnected: ble.bleConnected, zone: 'arcade', gameActive: game.gameActive })
      setTwPhase('complete')
    }, 1500)
  }, [audio, player, ble, game])

  useEffect(() => { twWinGameRef.current = twWinGame }, [twWinGame])
  useEffect(() => { twLoseGameRef.current = twLoseGame }, [twLoseGame])

  const twCheck = useCallback(() => {
    const tanks = twTanksRef.current
    const p = tanks.find(t => t.isPlayer)
    const mode = twModeRef.current
    if (mode === '1v1') {
      const e = tanks.find(t => !t.isPlayer)
      if (e && !e.alive) { twWinGameRef.current(); return }
      if (p && !p.alive) { twLoseGameRef.current(); return }
    } else if (mode === '2v2') {
      if (tanks.filter(t => t.team === 1).every(t => !t.alive)) { twWinGameRef.current(); return }
      if (tanks.filter(t => t.team === 0).every(t => !t.alive)) { twLoseGameRef.current(); return }
    } else if (mode === 'ffa') {
      const alive = tanks.filter(t => t.alive)
      if (alive.length <= 1) {
        if (alive.length === 1 && alive[0].isPlayer) twWinGameRef.current()
        else twLoseGameRef.current()
        return
      }
      if (p && !p.alive) { twLoseGameRef.current(); return }
    } else if (mode === 'boss') {
      if (p && !p.alive && tanks.filter(t => t.team === 0 && t.alive).length === 0) { twLoseGameRef.current(); return }
    }
    twNextRef.current()
  }, [])
  useEffect(() => { twCheckRef.current = twCheck }, [twCheck])

  const twNext = useCallback(() => {
    if (twTimerRef.current) { clearInterval(twTimerRef.current); twTimerRef.current = null }
    const tanks = twTanksRef.current
    const alive = tanks.filter(t => t.alive)
    if (alive.length <= 1 && twModeRef.current !== 'boss') { twCheckRef.current(); return }
    let ni = twTurnIdxRef.current
    for (let i = 0; i < tanks.length; i++) {
      ni = (ni + 1) % tanks.length
      if (tanks[ni].alive) break
    }
    twTurnIdxRef.current = ni
    setTwTurnIdx(ni)
    const nt = tanks[ni]
    setTwWind(Math.round((Math.random() - 0.5) * 4.5 * 10) / 10)
    setTwLockedAngle(null)
    setTwPower(0)
    setTwLastHit(null)
    setTwPuffPhase(0)
    const ssMin = 35 + Math.floor(Math.random() * 15)
    const ssMax = ssMin + 12 + Math.floor(Math.random() * 10)
    twSweetSpot.current = { mn: ssMin, mx: Math.min(82, ssMax) }
    setTwPuffShotCooldown(prev => {
      const newCd = prev - 1
      if (newCd <= 0 && nt.isPlayer) {
        setTwPuffShotReady(true)
        player.notify('PUFF SHOT READY!', C.gold)
        return 0
      }
      return Math.max(0, newCd)
    })
    setTwRound(r => r + 1)
    if (twModeRef.current === 'boss' && twBossRef.current && (twBossRef.current.hp || 0) > 0) {
      const pts = tanks.filter(t => t.team === 0 && t.alive)
      const lastP = pts[pts.length - 1]
      if (tanks[twTurnIdxRef.current] === lastP) {
        setTimeout(() => twBossAtkRef.current(), 1000)
        return
      }
    }
    if (nt.isAI) {
      setTwPhase('ai')
      setCommentary(nt.name + "'s turn...")
      setTimeout(() => twDoAIRef.current(ni), 1500)
    } else {
      setTwPhase('aiming')
      setCommentary('Your turn!' + (twPuffShotReady ? ' PUFF SHOT READY!' : ''))
      setTwAction('fire')
      setTwTimer(TW_TURN_TIME)
      if (twTimerRef.current) clearInterval(twTimerRef.current)
      twTimerRef.current = setInterval(() => {
        setTwTimer(t => {
          if (t <= 1) {
            if (twTimerRef.current) { clearInterval(twTimerRef.current); twTimerRef.current = null }
            twNextRef.current()
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
  }, [player, twPuffShotReady])
  useEffect(() => { twNextRef.current = twNext }, [twNext])

  const twDoAI = useCallback((idx: number) => {
    const tanks = twTanksRef.current
    const ai = tanks[idx]
    if (!ai || !ai.alive) { twNextRef.current(); return }
    let target: { x: number; y: number } | undefined
    if (twModeRef.current === 'boss' && twBossRef.current && (twBossRef.current.hp || 0) > 0) {
      target = { x: twBossRef.current.x || 0, y: (twBossRef.current.y || 0) - 20 }
    } else {
      const enemies = tanks.filter((t, i) => t.alive && i !== idx && (twModeRef.current === 'ffa' || t.team !== ai.team))
      if (enemies.length === 0) { twNextRef.current(); return }
      target = enemies[Math.floor(Math.random() * enemies.length)]
    }
    if (!target) { twNextRef.current(); return }
    const dx = target.x - ai.x
    const dy = (target.y - 10) - ai.y
    const ideal = Math.atan2(-dy, Math.abs(dx)) * 180 / Math.PI
    const baseScatter = 16
    const modeBonus = twModeRef.current === 'boss' ? 4 : twModeRef.current === '1v1' ? 2 : 0
    const scatter = Math.max(5, baseScatter - modeBonus + Math.random() * 8)
    const angle = Math.max(10, Math.min(150, ideal + (Math.random() - 0.5) * scatter))
    const power = 45 + Math.random() * 30
    setTwLockedAngle(angle)
    setTwAngle(angle)
    audio.playFx('select')
    setTimeout(() => {
      setTwPower(power)
      audio.playFx('tap')
      setTimeout(() => twFireShotRef.current(angle, power, 1.0, false, false), 400)
    }, 600)
  }, [audio])
  useEffect(() => { twDoAIRef.current = twDoAI }, [twDoAI])

  // ── Boss attack ──
  const twBossAtk = useCallback(() => {
    const boss = twBossRef.current
    if (!boss || (boss.hp || 0) <= 0) { twNextRef.current(); return }
    setTwPhase('boss_attack')
    setCommentary(boss.name + ' attacks! ' + boss.emoji)
    audio.playFx('error')
    triggerShake()
    const atk = boss.attacks[Math.floor(Math.random() * boss.attacks.length)]
    const tanks = twTanksRef.current
    const ap = tanks.filter(t => t.team === 0 && t.alive)
    if (ap.length === 0) { twLoseGameRef.current(); return }
    const target = ap[Math.floor(Math.random() * ap.length)]
    const bd = atk.dmg + Math.floor(Math.random() * 15)
    const terrain = twTerrainRef.current
    if (!terrain) return
    const bossX = boss.x || 0
    const bossY = (boss.y || 0) - 20
    const tgtX = target.x
    const tgtY = target.y - 10
    const bDx = tgtX - bossX
    const bAng = Math.atan2(-(tgtY - bossY), Math.abs(bDx))
    const bSpd = 6 + Math.random() * 3
    const bDir = bDx > 0 ? 1 : -1
    const bossBullet: Bullet = { x: bossX, y: bossY, vx: Math.cos(bAng) * bSpd * bDir, vy: -Math.sin(bAng) * bSpd, dmg: bd, crit: false, isPuff: false, isBlinker: false, mult: 1, trail: [] }
    twBulletRef.current = bossBullet
    setTwFlying(true)
    const bAnim = () => {
      if (!twBulletRef.current) return
      const b = twBulletRef.current
      b.vy += TW_GRAVITY
      b.x += b.vx
      b.y += b.vy
      b.trail.push({ x: b.x, y: b.y })
      if (b.trail.length > 20) b.trail.shift()
      const bx = Math.floor(b.x)
      if (bx >= 0 && bx < TW_W && terrain && b.y >= terrain[bx]) {
        twBulletRef.current = null
        setTwFlying(false)
        const cr = 25
        for (let i = Math.max(0, Math.floor(b.x - cr)); i < Math.min(TW_W, Math.ceil(b.x + cr)); i++) {
          const dd = Math.abs(i - b.x)
          const dep = Math.sqrt(Math.max(0, cr * cr - dd * dd))
          terrain[i] = Math.min(TW_H, terrain[i] + dep * 0.3)
        }
        for (let p = 0; p < 2; p++) {
          for (let i = 1; i < TW_W - 1; i++) terrain[i] = (terrain[i - 1] + terrain[i] + terrain[i + 1]) / 3
        }
        const ut = [...twTanksRef.current]
        let bHit = false
        ut.forEach(t => {
          if (!t.alive || t.team !== 0) return
          const ddx = t.x - b.x
          const ddy = (t.y - 10) - b.y
          if (Math.sqrt(ddx * ddx + ddy * ddy) < cr * 1.2) {
            const ff = Math.max(0.4, 1 - Math.sqrt(ddx * ddx + ddy * ddy) / (cr * 1.5))
            const ad2 = Math.round(bd * ff)
            t.hp = Math.max(0, t.hp - ad2)
            if (terrain) t.y = terrain[Math.floor(t.x)]
            bHit = true
            setTwLastHit({ amt: ad2, crit: false, isPuff: false, isBlinker: false, x: t.x, y: t.y - 20, t: Date.now() })
            if (t.hp <= 0) { t.alive = false; setCommentary(target.name + ' destroyed!') }
            else setCommentary(atk.name + ' hits ' + t.name + ' for ' + ad2 + '!')
          }
        })
        if (!bHit) setCommentary(boss.name + "'s " + atk.name + ' missed! ' + twRoast())
        if (terrain) ut.forEach(t => { if (t.alive) t.y = terrain[Math.floor(t.x)] })
        twTanksRef.current = ut
        setTwTanks([...ut])
        triggerShake()
        setTwExplosion({ x: b.x, y: terrain[bx], radius: cr, isPuff: false, isBlinker: false, t: Date.now() })
        setTimeout(() => { setTwExplosion(null); twCheckRef.current() }, 1000)
        return
      }
      if (b.x < -20 || b.x > TW_W + 20 || b.y > TW_H + 50) {
        twBulletRef.current = null
        setTwFlying(false)
        setCommentary(boss.name + ' missed! ' + twRoast())
        setTimeout(() => twCheckRef.current(), 800)
        return
      }
      twDrawRef.current()
      twBulletRafRef.current = requestAnimationFrame(bAnim)
    }
    twBulletRafRef.current = requestAnimationFrame(bAnim)
  }, [audio, triggerShake])
  useEffect(() => { twBossAtkRef.current = twBossAtk }, [twBossAtk])

  // ── Hit boss ──
  const twHitBoss = useCallback((dmg: number, crit: boolean, isPuff: boolean, isBlinker: boolean) => {
    twBulletRef.current = null
    setTwFlying(false)
    if (!twBossRef.current) return
    const boss = { ...twBossRef.current } as TwBoss
    const ad = crit ? Math.round(dmg * 1.5) : dmg
    boss.hp = Math.max(0, (boss.hp || 0) - ad)
    twBossRef.current = boss
    setTwBoss({ ...boss })
    setTwLastHit({ amt: ad, crit, isPuff, isBlinker, x: boss.x || 0, y: (boss.y || 0) - 30, t: Date.now() })
    triggerShake()
    audio.playFx(crit ? 'crowd' : 'select')
    setCommentary((crit ? 'CRIT! ' : '') + ad + ' dmg to ' + boss.name + '! ' + twRoast())
    if (isPuff) {
      setTwScore(s => s + 25)
      player.notify('Puff Bonus! +25', C.gold)
      player.spawnConfetti(20)
    }
    if ((boss.hp || 0) <= 0) {
      setCommentary(boss.name + ' DEFEATED! ' + twRoast())
      audio.playFx('win')
      player.spawnConfetti(40)
      triggerFlash('goal')
      setTimeout(() => {
        setTwScore(s => s + 200)
        player.recordGameResult(true, 80, 20, { bleConnected: ble.bleConnected, zone: 'arcade', gameActive: game.gameActive })
        setTwPhase('complete')
      }, 1500)
      return
    }
    setTimeout(() => twCheckRef.current(), 800)
  }, [audio, player, ble, game, triggerShake, triggerFlash])
  useEffect(() => { twHitBossRef.current = twHitBoss }, [twHitBoss])

  // ── Explode ──
  const twExplode = useCallback((x: number, y: number, dmg: number, crit: boolean, isPuff: boolean, isBlinker: boolean) => {
    twBulletRef.current = null
    setTwFlying(false)
    const radius = isBlinker ? 50 : isPuff ? 42 : 35
    setTwExplosion({ x, y, radius, isPuff, isBlinker, t: Date.now() })
    audio.playFx(isPuff ? 'crowd' : 'error')
    if (isPuff) triggerFlash('goal')
    triggerShake()
    const terrain = twTerrainRef.current
    if (terrain) {
      for (let i = Math.max(0, Math.floor(x - radius)); i < Math.min(TW_W, Math.ceil(x + radius)); i++) {
        const d = Math.abs(i - x)
        const depth = Math.sqrt(Math.max(0, radius * radius - d * d))
        terrain[i] = Math.min(TW_H, terrain[i] + depth * 0.4)
      }
      for (let p = 0; p < 2; p++) {
        for (let i = 1; i < TW_W - 1; i++) terrain[i] = (terrain[i - 1] + terrain[i] + terrain[i + 1]) / 3
      }
    }
    const tanks = [...twTanksRef.current]
    let hitAny = false
    const shooterIdx = twTurnIdxRef.current
    const shooter = tanks[shooterIdx]
    tanks.forEach((t, i) => {
      if (!t.alive || i === shooterIdx) return
      const dx = t.x - x
      const dy = (t.y - 10) - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < radius * 1.2) {
        const falloff = Math.max(0.3, 1 - dist / (radius * 1.5))
        const ad = Math.round(dmg * falloff)
        t.hp = Math.max(0, t.hp - ad)
        if (terrain) t.y = terrain[Math.floor(t.x)]
        hitAny = true
        setTwLastHit({ amt: ad, crit, isPuff, isBlinker, x: t.x, y: t.y - 20, t: Date.now() })
        if (t.hp <= 0) {
          t.alive = false
          audio.playFx('crowd')
          setCommentary(t.name + ' DESTROYED! ' + twRoast())
          if (isPuff) player.spawnConfetti(30)
          if (shooter && !shooter.isPlayer) twAddChat(shooter.name, TW_BOT_HIT[Math.floor(Math.random() * TW_BOT_HIT.length)], shooter.color)
        } else {
          setCommentary((crit ? 'CRIT! ' : '') + ad + ' dmg to ' + t.name + '! ' + (Math.random() < 0.4 ? twRoast() : ''))
          if (!t.isPlayer && t.isAI) twAddChat(t.name, TW_BOT_GOTHIT[Math.floor(Math.random() * TW_BOT_GOTHIT.length)], t.color)
          if (shooter && !shooter.isPlayer) twAddChat(shooter.name, TW_BOT_HIT[Math.floor(Math.random() * TW_BOT_HIT.length)], shooter.color)
        }
        if (isPuff) {
          setTwScore(s => s + 25)
          player.notify('Puff Bonus! +25', C.gold)
        }
      }
    })
    if (!hitAny) setCommentary('Terrain hit! No direct damage. ' + twRoast())
    if (terrain) tanks.forEach(t => { if (t.alive) t.y = terrain[Math.floor(t.x)] })
    twTanksRef.current = tanks
    setTwTanks([...tanks])
    setTimeout(() => { setTwExplosion(null); twCheckRef.current() }, 800)
  }, [audio, player, triggerFlash, triggerShake, twAddChat])
  useEffect(() => { twExplodeRef.current = twExplode }, [twExplode])

  // ── Fire shot ──
  const twFireShot = useCallback((angle: number, power: number, mult: number, isPuff: boolean, isBlinker: boolean) => {
    if (twTimerRef.current) { clearInterval(twTimerRef.current); twTimerRef.current = null }
    setTwPhase('flying')
    setTwFlying(true)
    const rad = angle * Math.PI / 180
    const speed = (power / 100) * 11 + 3
    const tanks = twTanksRef.current
    const currentIdx = twTurnIdxRef.current
    const shooter = tanks[currentIdx]
    if (!shooter || !shooter.alive) { twNextRef.current(); return }
    const { baseDmg, crit, zone, inSweet } = twCalcDmg(power)
    const dmg = Math.round(baseDmg * mult)
    const finalDmg = crit ? Math.round(dmg * 1.5) : dmg
    const bullet: Bullet = {
      x: shooter.x, y: shooter.y - 12,
      vx: Math.cos(rad) * speed * (shooter.x < TW_W / 2 ? 1 : -1),
      vy: -Math.sin(rad) * speed,
      dmg: finalDmg, crit, isPuff, isBlinker: !!isBlinker, mult, zone, inSweet, trail: [],
    }
    twBulletRef.current = bullet
    const terrain = twTerrainRef.current
    const wind = twWind
    const anim = () => {
      if (!twBulletRef.current) return
      const b = twBulletRef.current
      b.vx += wind * TW_WIND_FACTOR
      b.vy += TW_GRAVITY
      b.x += b.vx
      b.y += b.vy
      b.trail.push({ x: b.x, y: b.y })
      if (b.trail.length > 25) b.trail.shift()
      const bx = Math.floor(b.x)
      if (bx >= 0 && bx < TW_W && terrain && b.y >= terrain[bx]) {
        twExplodeRef.current(b.x, terrain[bx], b.dmg, b.crit, b.isPuff, b.isBlinker)
        return
      }
      const targets = twTanksRef.current.filter((t, i) => i !== currentIdx && t.alive)
      for (const t of targets) {
        const dx = b.x - t.x
        const dy = b.y - (t.y - 10)
        if (Math.sqrt(dx * dx + dy * dy) < 18) {
          twExplodeRef.current(t.x, t.y - 10, b.dmg, b.crit, b.isPuff, b.isBlinker)
          return
        }
      }
      if (twBossRef.current && (twBossRef.current.hp || 0) > 0) {
        const boss = twBossRef.current
        const dx = b.x - (boss.x || 0)
        const dy = b.y - ((boss.y || 0) - 20)
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
          twHitBossRef.current(b.dmg, b.crit, b.isPuff, b.isBlinker)
          return
        }
      }
      if (b.x < -20 || b.x > TW_W + 20 || b.y > TW_H + 50) {
        twBulletRef.current = null
        setTwFlying(false)
        if (shooter.isPlayer) twAddChat('You', 'Miss!', '#999')
        else twAddChat(shooter.name, TW_BOT_MISS[Math.floor(Math.random() * TW_BOT_MISS.length)], shooter.color)
        setCommentary('Miss! ' + twRoast())
        audio.playFx('error')
        setTimeout(() => twNextRef.current(), 1200)
        return
      }
      twDrawRef.current()
      twBulletRafRef.current = requestAnimationFrame(anim)
    }
    twBulletRafRef.current = requestAnimationFrame(anim)
  }, [twCalcDmg, twWind, audio, twAddChat])
  useEffect(() => { twFireShotRef.current = twFireShot }, [twFireShot])

  // ── Angle controls ──
  const twAdjustAngle = useCallback((delta: number) => {
    if (twPhaseRef.current !== 'aiming' || !twTanksRef.current[twTurnIdxRef.current]?.isPlayer) return
    setTwAngle(a => Math.max(5, Math.min(175, Math.round(a + delta))))
    audio.playFx('tap')
  }, [audio])

  // ── Hold-to-charge power ──
  const twStartCharge = useCallback(() => {
    if (twPhaseRef.current !== 'aiming' || !twTanksRef.current[twTurnIdxRef.current]?.isPlayer) return
    twCharging.current = true
    setTwPhase('power')
    if (twPowerIntervalRef.current) clearInterval(twPowerIntervalRef.current)
    let pwr = 0
    twPowerIntervalRef.current = setInterval(() => {
      pwr = Math.min(100, pwr + 1.2)
      setTwPower(pwr)
    }, 33)
  }, [])

  const twReleaseCharge = useCallback(() => {
    // Don't gate on twPhaseRef — it's synced via useEffect AFTER React commit,
    // so a fast press+release race-windows it. twCharging.current is the source
    // of truth (set synchronously in start/release).
    if (!twCharging.current) return
    twCharging.current = false
    if (twPowerIntervalRef.current) { clearInterval(twPowerIntervalRef.current); twPowerIntervalRef.current = null }
    setTwPuffStreak(0)
    audio.playFx('tap')
    twFireShotRef.current(twAngleRef.current, twPowerRef.current, 1.0, false, false)
  }, [audio])

  // ── 1v1 Dual-puff system ──
  const twPuffStart = useCallback(() => {
    if (!twTanksRef.current[twTurnIdxRef.current]?.isPlayer) return
    if (twTimerRef.current) { clearInterval(twTimerRef.current); twTimerRef.current = null }

    if (twModeRef.current === '1v1' && twPhaseRef.current === 'aiming') {
      setTwPuffPhase(0)
      setTwPhase('puff_charging')
      twPuffStartRef.current = Date.now()
      twCharging.current = true
      if (twPowerIntervalRef.current) clearInterval(twPowerIntervalRef.current)
      let pwr = 0
      twPowerIntervalRef.current = setInterval(() => {
        pwr = Math.min(100, pwr + 0.8)
        setTwPower(pwr)
        setTwAngle(10 + (pwr / 100) * 160)
      }, 33)
      audio.playFx('charge')
      return
    }

    if (twPhaseRef.current === 'aiming' || (twModeRef.current === '1v1' && twPuffPhase === 1 && twPhaseRef.current === 'puff_angle_set')) {
      setTwPhase('puff_charging')
      twPuffStartRef.current = Date.now()
      twCharging.current = true
      if (twPowerIntervalRef.current) clearInterval(twPowerIntervalRef.current)
      let pwr = 0
      twPowerIntervalRef.current = setInterval(() => {
        pwr = Math.min(100, pwr + 0.8)
        setTwPower(pwr)
      }, 33)
      audio.playFx('charge')
    }
  }, [audio, twPuffPhase])

  const twPuffStop = useCallback(() => {
    if (!twPuffStartRef.current || !twCharging.current) return
    twCharging.current = false
    if (twPowerIntervalRef.current) { clearInterval(twPowerIntervalRef.current); twPowerIntervalRef.current = null }
    const dur = (Date.now() - twPuffStartRef.current) / 1000
    twPuffStartRef.current = 0

    if (twModeRef.current === '1v1' && twPuffPhase === 0) {
      setTwPuffPhase(1)
      setTwPhase('puff_angle_set')
      setTwPower(0)
      audio.playFx('select')
      player.notify('Angle set! Puff again for POWER', C.gold)
      return
    }

    let inputMult = 1.15
    const isBlinker = dur >= 5.0
    if (isBlinker) inputMult = 1.20
    const newStreak = Math.min(5, twPuffStreakRef.current + 1)
    setTwPuffStreak(newStreak)
    const streakMult = 1 + newStreak * 0.02
    const totalMult = inputMult * streakMult
    audio.playFx(isBlinker ? 'crowd' : 'whistle')
    if (isBlinker) {
      player.notify('BLINKER! +20% LEGENDARY!', C.gold)
      player.spawnConfetti(20)
    }
    twFireShotRef.current(twAngleRef.current, twPowerRef.current, totalMult, true, isBlinker)
  }, [audio, player, twPuffPhase])

  // ── Heal action (Boss only) ──
  const twStartHeal = useCallback(() => {
    if (twPhaseRef.current !== 'aiming' || twAction !== 'heal' || twModeRef.current !== 'boss') return
    twCharging.current = true
    setTwPhase('heal_charging')
    if (twPowerIntervalRef.current) clearInterval(twPowerIntervalRef.current)
    let pwr = 0
    twPowerIntervalRef.current = setInterval(() => {
      pwr = Math.min(100, pwr + 1.0)
      setTwPower(pwr)
    }, 33)
  }, [twAction])

  const twReleaseHeal = useCallback(() => {
    if (!twCharging.current) return
    twCharging.current = false
    if (twPowerIntervalRef.current) { clearInterval(twPowerIntervalRef.current); twPowerIntervalRef.current = null }
    const ss = twSweetSpot.current
    const inSweet = twPowerRef.current >= ss.mn && twPowerRef.current <= ss.mx
    const healPct = inSweet ? 0.40 : 0.22
    const tanks = [...twTanksRef.current]
    const ci = twTurnIdxRef.current
    if (tanks[ci]) {
      const healAmt = Math.round(tanks[ci].maxHp * healPct)
      tanks[ci] = { ...tanks[ci], hp: Math.min(tanks[ci].maxHp, tanks[ci].hp + healAmt) }
      twTanksRef.current = tanks
      setTwTanks([...tanks])
      setCommentary('+' + healAmt + ' HP!' + (inSweet ? ' SWEET SPOT HEAL!' : ''))
      player.notify('+' + healAmt + ' HP' + (inSweet ? ' (Sweet!)' : ''), C.green)
    }
    audio.playFx('select')
    setTwPower(0)
    setTwAction('fire')
    setTimeout(() => twNextRef.current(), 1000)
  }, [audio, player])

  // ── Start game ──
  const startTankWar = useCallback((mode: Mode) => {
    setTwMode(mode)
    twModeRef.current = mode
    const terrain = twGenTerrain()
    twTerrainRef.current = terrain
    const tanks = twPlaceTanks(mode, terrain)
    setTwTanks(tanks)
    twTanksRef.current = tanks
    if (mode === 'boss') {
      const b = TW_BOSSES[twBossIdx]
      const boss: TwBoss = { ...b, hp: b.maxHp, x: TW_W - 40, y: terrain[TW_W - 40] }
      setTwBoss(boss)
      twBossRef.current = boss
    } else {
      setTwBoss(null)
      twBossRef.current = null
    }
    setTwAngle(45); setTwLockedAngle(null); setTwPower(0)
    setTwWind(Math.round((Math.random() - 0.5) * 4.5 * 10) / 10)
    twTurnIdxRef.current = 0
    setTwTurnIdx(0)
    setTwRound(0)
    setTwScore(0)
    setTwPuffShotReady(false)
    setTwPuffShotCooldown(3)
    setTwLastHit(null)
    setTwFlying(false)
    setTwExplosion(null)
    setTwAction('fire')
    setTwPuffStreak(0)
    setTwPuffPhase(0)
    setTwTimer(TW_TURN_TIME)
    setTwChatMsgs([])
    twCharging.current = false
    setTwZoom(1)
    const ssMin = 35 + Math.floor(Math.random() * 15)
    const ssMax = ssMin + 12 + Math.floor(Math.random() * 10)
    twSweetSpot.current = { mn: ssMin, mx: Math.min(82, ssMax) }
    setTwPhase('intro')
    audio.playFx('crowd')
    setCommentary('Tank War! Aim and fire to destroy the enemy!')
    setTimeout(() => {
      setTwPhase('aiming')
      setTwTimer(TW_TURN_TIME)
      if (twTimerRef.current) clearInterval(twTimerRef.current)
      twTimerRef.current = setInterval(() => {
        setTwTimer(t => {
          if (t <= 1) {
            if (twTimerRef.current) { clearInterval(twTimerRef.current); twTimerRef.current = null }
            twNextRef.current()
            return 0
          }
          return t - 1
        })
      }, 1000)
    }, 1800)
  }, [audio, twGenTerrain, twPlaceTanks, twBossIdx])

  // ── Cleanup ──
  const twCleanup = useCallback(() => {
    audio.gameSoundsMuted.current = true
    if (twDrawRafRef.current) { cancelAnimationFrame(twDrawRafRef.current); twDrawRafRef.current = null }
    if (twBulletRafRef.current) { cancelAnimationFrame(twBulletRafRef.current); twBulletRafRef.current = null }
    if (twPowerIntervalRef.current) { clearInterval(twPowerIntervalRef.current); twPowerIntervalRef.current = null }
    if (twTimerRef.current) { clearInterval(twTimerRef.current); twTimerRef.current = null }
    twBulletRef.current = null
    twTerrainRef.current = null
    twPuffStartRef.current = 0
    twTanksRef.current = []
    twBossRef.current = null
    twCharging.current = false
    setTwPuffStreak(0)
    setTwPuffPhase(0)
    setTwChatMsgs([])
    setTwZoom(1)
    setTwPhase(null)
    setTwTanks([])
    setTwBoss(null)
  }, [audio])

  const exitGame = useCallback(() => {
    twCleanup()
    game.exitGame()
  }, [twCleanup, game])

  // ── Canvas draw ──
  const twDraw = useCallback(() => {
    const canvas = twCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = TW_W, h = TW_H
    const terrain = twTerrainRef.current
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(TW_DPR, TW_DPR)

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#06101E')
    sky.addColorStop(0.2, '#0c1a38')
    sky.addColorStop(0.5, '#102240')
    sky.addColorStop(0.8, '#0e1c35')
    sky.addColorStop(1, '#081830')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)

    // Stars
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 137.5) % 1) * w
      const sy = ((i * 73.3) % 0.35) * h
      const bright = 0.08 + ((i * 31) % 60) / 150
      ctx.fillStyle = `rgba(200,210,255,${bright})`
      ctx.fillRect(sx, sy, 1, 1)
    }

    // Moon glow
    ctx.save()
    ctx.globalAlpha = 0.06
    ctx.fillStyle = '#4DB8FF'
    ctx.beginPath()
    ctx.arc(w * 0.8, h * 0.12, 40, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Terrain
    if (terrain) {
      ctx.beginPath()
      ctx.moveTo(0, h)
      for (let i = 0; i < TW_W; i++) ctx.lineTo(i, terrain[i])
      ctx.lineTo(w, h)
      ctx.closePath()
      const tG = ctx.createLinearGradient(0, h * 0.3, 0, h)
      tG.addColorStop(0, '#1a2a45')
      tG.addColorStop(0.4, '#142035')
      tG.addColorStop(1, '#0a1525')
      ctx.fillStyle = tG
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,229,255,0.15)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < TW_W; i++) {
        if (i === 0) ctx.moveTo(i, terrain[i])
        else ctx.lineTo(i, terrain[i])
      }
      ctx.stroke()
      ctx.strokeStyle = 'rgba(0,229,255,0.06)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i < TW_W; i++) {
        if (i === 0) ctx.moveTo(i, terrain[i])
        else ctx.lineTo(i, terrain[i])
      }
      ctx.stroke()
    }

    // Tanks
    const tanks = twTanksRef.current
    const ci = twTurnIdxRef.current
    tanks.forEach((t, idx) => {
      if (!t.alive) return
      const tx = t.x
      const ty = terrain ? terrain[Math.floor(Math.max(0, Math.min(TW_W - 1, t.x)))] : h * 0.6
      const tw2 = 26, th2 = 4
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(tx - tw2 / 2, ty - th2, tw2, th2)
      const bw = 22, bh = 7
      const hullG = ctx.createLinearGradient(tx - bw / 2, ty - th2 - bh, tx + bw / 2, ty - th2)
      hullG.addColorStop(0, t.color)
      hullG.addColorStop(1, t.color + 'AA')
      ctx.fillStyle = hullG
      ctx.fillRect(tx - bw / 2, ty - th2 - bh, bw, bh)
      const trtW = 12, trtH = 5
      ctx.fillStyle = t.color
      ctx.fillRect(tx - trtW / 2, ty - th2 - bh - trtH, trtW, trtH)
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      ctx.beginPath()
      ctx.arc(tx, ty - th2 - bh - trtH / 2, 5, Math.PI, 0)
      ctx.fill()
      const fr = t.x < TW_W / 2
      let ba: number
      const phase = twPhaseRef.current
      if (idx === ci && (twLockedAngle !== null || phase === 'aiming' || phase === 'power' || phase === 'puff_charging' || phase === 'heal_charging' || phase === 'puff_angle_set')) {
        const a = twLockedAngle !== null ? twLockedAngle : twAngleRef.current
        ba = fr ? -a * Math.PI / 180 : -(180 - a) * Math.PI / 180
      } else {
        ba = fr ? -45 * Math.PI / 180 : -135 * Math.PI / 180
      }
      const barrelOriginY = ty - th2 - bh - trtH / 2
      ctx.strokeStyle = t.color
      ctx.lineWidth = 3.5
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(tx, barrelOriginY)
      ctx.lineTo(tx + Math.cos(ba) * 20, barrelOriginY + Math.sin(ba) * 20)
      ctx.stroke()
      ctx.lineCap = 'butt'
      const hp = t.hp / t.maxHp
      const hpY = ty - th2 - bh - trtH - 10
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(tx - 14, hpY, 28, 4)
      ctx.fillStyle = hp > 0.5 ? '#4CAF50' : hp > 0.25 ? '#FF9800' : '#EF4444'
      ctx.fillRect(tx - 14, hpY, 28 * hp, 4)
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = `7px 'Courier New',monospace`
      ctx.textAlign = 'center'
      ctx.fillText(t.name, tx, hpY - 3)
      if (idx === ci) {
        ctx.strokeStyle = C.gold
        ctx.lineWidth = 1.5
        ctx.setLineDash([3, 3])
        ctx.strokeRect(tx - tw2 / 2 - 2, hpY - 6, tw2 + 4, ty - hpY + 8)
        ctx.setLineDash([])
      }
    })

    // Trajectory preview
    const phaseNow = twPhaseRef.current
    if (!twBulletRef.current && tanks[ci]?.isPlayer && tanks[ci]?.alive && (phaseNow === 'aiming' || phaseNow === 'power' || phaseNow === 'puff_charging' || phaseNow === 'heal_charging' || phaseNow === 'puff_angle_set')) {
      const shooter = tanks[ci]
      const sx = shooter.x
      const sy = terrain ? terrain[Math.floor(Math.max(0, Math.min(TW_W - 1, sx)))] : h * 0.6
      const barrelY = sy - 16
      const ang = twAngleRef.current
      const rad = ang * Math.PI / 180
      const fr = sx < TW_W / 2
      const previewPower = phaseNow === 'power' || phaseNow === 'puff_charging' ? twPowerRef.current : 50
      const spd = (previewPower / 100) * 11 + 3
      const vx0 = Math.cos(rad) * spd * (fr ? 1 : -1)
      const vy0 = -Math.sin(rad) * spd
      ctx.save()
      ctx.setLineDash([4, 6])
      ctx.strokeStyle = 'rgba(255,215,0,0.35)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      let px = sx, py = barrelY, pvx = vx0, pvy = vy0
      ctx.moveTo(px, py)
      for (let step = 0; step < 60; step++) {
        pvx += twWind * TW_WIND_FACTOR
        pvy += TW_GRAVITY
        px += pvx
        py += pvy
        if (px < 0 || px > TW_W || py > h || py < -50) break
        const gx = Math.floor(Math.max(0, Math.min(TW_W - 1, px)))
        if (terrain && py >= terrain[gx]) break
        ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(255,215,0,0.5)'
      ctx.beginPath()
      ctx.arc(px, py, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,215,0,0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(px - 8, py); ctx.lineTo(px + 8, py); ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(px, py - 8); ctx.lineTo(px, py + 8); ctx.stroke()
      ctx.restore()
    }

    // Boss
    if (twBossRef.current && (twBossRef.current.hp || 0) > 0) {
      const boss = twBossRef.current
      const bx = boss.x || 0
      const by = terrain ? terrain[Math.floor(Math.min(TW_W - 1, bx))] : h * 0.5
      ctx.fillStyle = boss.color
      ctx.fillRect(bx - 22, by - 22, 44, 22)
      ctx.beginPath()
      ctx.arc(bx, by - 26, 12, 0, Math.PI * 2)
      ctx.fill()
      const bhp = (boss.hp || 0) / boss.maxHp
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(bx - 25, by - 40, 50, 5)
      ctx.fillStyle = bhp > 0.5 ? '#FF4500' : '#FF0000'
      ctx.fillRect(bx - 25, by - 40, 50 * bhp, 5)
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = `8px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(boss.emoji + ' ' + boss.name, bx, by - 44)
    }

    // Bullet
    if (twBulletRef.current) {
      const b = twBulletRef.current
      b.trail.forEach((p, i) => {
        const a = (i / b.trail.length) * 0.6
        ctx.fillStyle = b.isPuff ? `rgba(255,215,0,${a})` : `rgba(255,100,50,${a})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, (b.isPuff ? 3 : 2) + i * 0.06, 0, Math.PI * 2)
        ctx.fill()
      })
      const flightAngle = Math.atan2(b.vy, b.vx)
      ctx.save()
      ctx.translate(b.x, b.y)
      ctx.rotate(flightAngle)
      ctx.shadowColor = b.isPuff ? '#FFD700' : '#FF6B35'
      ctx.shadowBlur = 10
      ctx.fillStyle = b.isPuff ? '#FFD700' : '#FF6B35'
      ctx.beginPath()
      ctx.moveTo(8, 0); ctx.lineTo(-4, -3); ctx.lineTo(-4, 3); ctx.closePath()
      ctx.fill()
      ctx.fillStyle = b.isPuff ? 'rgba(255,180,0,0.7)' : 'rgba(255,80,30,0.7)'
      ctx.beginPath()
      ctx.moveTo(-4, -2); ctx.lineTo(-8, 0); ctx.lineTo(-4, 2); ctx.closePath()
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.restore()
    }

    // Explosion
    if (twExplosion) {
      const e = twExplosion
      const age = (Date.now() - e.t) / 700
      if (age < 1) {
        const r = e.radius * age
        const a = 1 - age
        ctx.fillStyle = e.isBlinker ? `rgba(255,215,0,${a * 0.3})` : `rgba(255,100,50,${a * 0.2})`
        ctx.beginPath(); ctx.arc(e.x, e.y, r * 1.4, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = e.isPuff ? `rgba(255,215,0,${a * 0.6})` : `rgba(255,100,50,${a * 0.5})`
        ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = `rgba(255,255,255,${a * 0.4})`
        ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.3, 0, Math.PI * 2); ctx.fill()
        for (let i = 0; i < 6; i++) {
          const pa = i / 6 * Math.PI * 2 + age * 3
          const pr = r * 0.7
          ctx.fillStyle = `rgba(255,${e.isPuff ? 200 : 80},0,${a * 0.5})`
          ctx.beginPath()
          ctx.arc(e.x + Math.cos(pa) * pr, e.y + Math.sin(pa) * pr, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    ctx.restore()
  }, [twLockedAngle, twWind, twExplosion])
  useEffect(() => { twDrawRef.current = twDraw }, [twDraw])

  // ── Mount: enter mode-select ──
  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'tankwar') return
    startedRef.current = true
    audio.gameSoundsMuted.current = false
    setTwPhase('modeselect')
    setTwLobbyTab('battle')
    setTwSelectedMode(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Animation loop (Rule 4) ──
  // CRITICAL: uses twDrawRafRef (NOT shared with bullet flight) — bullet
  // animations live in twBulletRafRef so a phase-change re-render of this
  // effect doesn't accidentally cancel an in-flight bullet's RAF.
  useEffect(() => {
    if (!twPhase || twPhase === 'intro' || twPhase === 'modeselect' || twPhase === 'complete') return
    if (twDrawRafRef.current) cancelAnimationFrame(twDrawRafRef.current)
    const loop = () => {
      twDraw()
      twDrawRafRef.current = requestAnimationFrame(loop)
    }
    twDrawRafRef.current = requestAnimationFrame(loop)
    return () => { if (twDrawRafRef.current) { cancelAnimationFrame(twDrawRafRef.current); twDrawRafRef.current = null } }
  }, [twDraw, twPhase])

  // ── BLE registration ──
  useEffect(() => {
    if (game.gameActive?.id !== 'tankwar') return
    // Re-enable sound on every run — cleanup mutes on re-run (twMode change) too, not just unmount.
    audio.gameSoundsMuted.current = false
    const isDualPuff = twModeRef.current === '1v1'
    if (isDualPuff) {
      ble.registerPuffHandlers('tankwar', () => twPuffStart(), () => twPuffStop())
    } else {
      ble.registerPuffHandlers('tankwar', () => twStartCharge(), () => twReleaseCharge())
    }
    return () => {
      audio.gameSoundsMuted.current = true
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id, twMode])

  if (!twPhase || game.gameActive?.id !== 'tankwar') return null

  // ── Render ──
  const isPlayerTurn = twTanks[twTurnIdx]?.isPlayer && !twFlying
  const twGC = '#4CAF50'
  const twSS = twSweetSpot.current
  const isGameplay = twPhase !== 'intro' && twPhase !== 'modeselect' && twPhase !== 'complete'
  const is1v1Puff = twMode === '1v1'
  const showControls = isGameplay && twPhase !== 'flying' && twPhase !== 'boss_attack' && twPhase !== 'ai' && (twTanks[twTurnIdx]?.isPlayer || twPhase === 'power' || twPhase === 'puff_charging' || twPhase === 'heal_charging')
  const showAIBar = (twPhase === 'ai' || twPhase === 'boss_attack') && isGameplay

  const handleBack = () => {
    audio.playFx('tap')
    if (isGameplay) {
      twCleanup()
      setTwPhase('modeselect')
      setTwLobbyTab('battle')
      setTwSelectedMode(null)
    } else {
      exitGame()
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column', touchAction: 'none', animation: ui.screenShake ? 'shake 0.4s ease' : 'none' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #06101E 0%, #0c1a38 30%, #102240 60%, #081830 100%)', zIndex: 0 }} />
      {ui.screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0, background: ui.screenFlash === 'goal' ? 'rgba(255,215,0,0.3)' : 'rgba(255,50,50,0.2)', animation: 'flashOverlay 0.4s ease forwards' }} />}

      {/* ══ DEDICATED HEADER (3 rows) ══ */}
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: '1px solid rgba(0,229,255,0.06)' }}>
        {/* Row 1: Brand + BLE + Coins */}
        <div style={{ padding: '6px 12px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
            <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>Powered by <span style={{ fontWeight: 900, letterSpacing: 2 }}>MOOD LAB</span></span>
          </div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 100, background: ble.bleConnected ? 'rgba(52,211,153,0.1)' : 'rgba(251,146,60,0.1)', border: `1px solid ${ble.bleConnected ? 'rgba(52,211,153,0.25)' : 'rgba(251,146,60,0.25)'}` }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: ble.bleConnected ? C.green : C.orange }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: ble.bleConnected ? C.green : C.orange }}>{ble.bleConnected ? 'Puff' : 'Connect'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 7px', borderRadius: 100, background: 'rgba(255,217,61,0.06)', border: '1px solid rgba(255,217,61,0.12)' }}>
              <span style={{ fontSize: 9 }}>🪙</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, fontFamily: "'Courier New',monospace" }}>{player.coins.toLocaleString()}</span>
            </div>
          </div>
        </div>
        {/* Row 2: Back + HP pills */}
        <div style={{ padding: '2px 12px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div onClick={handleBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '3px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, flexShrink: 0, touchAction: 'none' }}>
            <span style={{ fontSize: 10, color: C.text2 }}>←</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>{isGameplay ? 'Lobby' : 'Arcade'}</span>
          </div>
          {isGameplay && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flex: 1, justifyContent: 'center', overflow: 'hidden' }}>
              {twTanks.filter(t => t.alive).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 6, background: twTanks[twTurnIdx] === t ? 'rgba(255,255,255,0.06)' : 'transparent', border: `1px solid ${twTanks[twTurnIdx] === t ? t.color + '50' : 'transparent'}` }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.color }} />
                  <span style={{ fontSize: 7, fontWeight: 700, color: twTanks[twTurnIdx] === t ? t.color : '#999' }}>{t.name}</span>
                  <span style={{ fontSize: 6, color: '#777' }}>{t.hp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Row 3: Wind + Timer + Boss HP */}
        {isGameplay && (
          <div style={{ padding: '2px 12px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(200,220,255,0.6)' }}>{twWind > 0 ? '→' : twWind < 0 ? '←' : '•'} {Math.abs(twWind).toFixed(1)}m/s</span>
            {isPlayerTurn && <span style={{ fontSize: 8, fontWeight: 900, color: twTimer <= 5 ? '#FF5A5A' : C.gold, fontFamily: "'Courier New',monospace" }}>⏱{twTimer}s</span>}
            <div style={{ flex: 1 }} />
            {twPuffStreak > 0 && <span style={{ fontSize: 7, fontWeight: 900, color: C.gold }}>🔥{twPuffStreak}x</span>}
            {twBoss && (twBoss.hp || 0) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9 }}>{twBoss.emoji}</span>
                <div style={{ width: 60, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: ((twBoss.hp || 0) / twBoss.maxHp * 100) + '%', borderRadius: 2, background: `linear-gradient(90deg, ${twBoss.color}, #FF0000)`, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 6, color: '#999' }}>{twBoss.hp}/{twBoss.maxHp}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ GAME AREA ══ */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {/* Canvas */}
        {isGameplay && (
          <canvas ref={twCanvasRef} width={Math.round(TW_W * TW_DPR)} height={Math.round(TW_H * TW_DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: `scale(${twZoom})`, transformOrigin: 'center center', transition: 'transform 0.1s ease' }} />
        )}

        {/* Zoom buttons */}
        {isGameplay && (
          <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 25, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div onClick={(e) => { e.stopPropagation(); setTwZoom(z => Math.min(4, z + 0.5)) }} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,16,30,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc', fontSize: 14, cursor: 'pointer', backdropFilter: 'blur(4px)', touchAction: 'none' }}>+</div>
            <div onClick={(e) => { e.stopPropagation(); setTwZoom(z => Math.max(1, z - 0.5)) }} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,16,30,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc', fontSize: 14, cursor: 'pointer', backdropFilter: 'blur(4px)', touchAction: 'none' }}>−</div>
            {twZoom !== 1 && <div onClick={(e) => { e.stopPropagation(); setTwZoom(1) }} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,16,30,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc', fontSize: 9, cursor: 'pointer', backdropFilter: 'blur(4px)', touchAction: 'none' }}>1x</div>}
          </div>
        )}

        {/* Damage numbers */}
        {twLastHit && Date.now() - twLastHit.t < 1500 && isGameplay && (
          <div style={{ position: 'absolute', left: Math.min(90, Math.max(10, twLastHit.x / 430 * 100)) + '%', top: Math.min(80, Math.max(10, twLastHit.y / 400 * 100)) + '%', transform: 'translate(-50%,-100%)', zIndex: 30, pointerEvents: 'none', animation: 'floatUp 1.5s ease-out forwards' }}>
            <div style={{ fontSize: twLastHit.crit ? 22 : twLastHit.isPuff ? 18 : 14, fontWeight: 900, color: twLastHit.isPuff ? C.gold : twLastHit.crit ? '#FF6B35' : '#EF4444', textShadow: '0 0 10px rgba(0,0,0,0.9),0 2px 4px rgba(0,0,0,0.8)' }}>
              -{twLastHit.amt}{twLastHit.crit ? ' CRIT!' : ''}{twLastHit.isPuff ? ' 💨' : ''}
            </div>
          </div>
        )}

        {/* Commentary toast */}
        {isGameplay && commentary && (
          <div style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 25, pointerEvents: 'none', textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.85)', textShadow: '0 0 12px rgba(0,0,0,0.9),0 2px 6px rgba(0,0,0,0.7)', padding: '6px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', maxWidth: 300 }}>
              {commentary}
            </div>
          </div>
        )}

        {/* Controls panel */}
        {showControls && (
          <div style={{ position: 'absolute', bottom: '25%', left: 0, right: 0, zIndex: 30, padding: '5px 10px 9px' }}>
            {/* Action row (Boss only) */}
            {twMode === 'boss' && twPhase === 'aiming' && (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 5 }}>
                <div onClick={(e) => { e.stopPropagation(); setTwAction('fire') }} style={{ padding: '5px 18px', borderRadius: 8, cursor: 'pointer', background: twAction === 'fire' ? 'rgba(245,180,0,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${twAction === 'fire' ? C.gold + '50' : 'rgba(255,255,255,0.08)'}`, fontSize: 11, fontWeight: 800, color: twAction === 'fire' ? C.gold : '#999', touchAction: 'none' }}>FIRE</div>
                <div onClick={(e) => { e.stopPropagation(); setTwAction('heal') }} style={{ padding: '5px 18px', borderRadius: 8, cursor: 'pointer', background: twAction === 'heal' ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${twAction === 'heal' ? C.green + '50' : 'rgba(255,255,255,0.08)'}`, fontSize: 11, fontWeight: 800, color: twAction === 'heal' ? C.green : '#999', touchAction: 'none' }}>HEAL</div>
              </div>
            )}

            {/* Angle row */}
            {(twPhase === 'aiming' || twPhase === 'power' || twPhase === 'puff_charging') && twAction === 'fire' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 5 }}>
                {!is1v1Puff && (
                  <>
                    <div onClick={(e) => { e.stopPropagation(); twAdjustAngle(-10) }} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid ' + C.gold + '30', fontSize: 11, fontWeight: 900, color: C.gold, touchAction: 'none' }}>«</div>
                    <div onClick={(e) => { e.stopPropagation(); twAdjustAngle(-1) }} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid ' + C.gold + '30', fontSize: 11, fontWeight: 900, color: C.gold, touchAction: 'none' }}>‹</div>
                  </>
                )}
                <div style={{ minWidth: 44, textAlign: 'center', fontSize: 16, fontWeight: 900, color: C.gold, fontFamily: "'Courier New',monospace", textShadow: '0 0 8px ' + C.gold + '40' }}>{Math.round(twAngle)}°</div>
                {is1v1Puff && <div style={{ fontSize: 9, fontWeight: 700, color: C.gold, marginLeft: 6 }}>PUFF 1: ANGLE</div>}
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: 9, fontWeight: 900, color: twTimer <= 5 ? '#FF5A5A' : C.gold, fontFamily: "'Courier New',monospace" }}>{twTimer}s</div>
                {!is1v1Puff && (
                  <>
                    <div onClick={(e) => { e.stopPropagation(); twAdjustAngle(1) }} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid ' + C.gold + '30', fontSize: 11, fontWeight: 900, color: C.gold, touchAction: 'none' }}>›</div>
                    <div onClick={(e) => { e.stopPropagation(); twAdjustAngle(10) }} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid ' + C.gold + '30', fontSize: 11, fontWeight: 900, color: C.gold, touchAction: 'none' }}>»</div>
                  </>
                )}
              </div>
            )}

            {/* 1v1 puff_angle_set label */}
            {twPhase === 'puff_angle_set' && is1v1Puff && (
              <div style={{ textAlign: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.gold }}>Angle: {Math.round(twAngle)}° -- PUFF 2: FIRE</span>
              </div>
            )}

            {/* Power bar (hold to fire) */}
            {(twPhase === 'aiming' || twPhase === 'power' || twPhase === 'puff_charging' || twPhase === 'puff_angle_set') && twAction === 'fire' && (
              <div
                onMouseDown={(e) => { e.stopPropagation(); twStartCharge() }}
                onMouseUp={(e) => { e.stopPropagation(); twReleaseCharge() }}
                onMouseLeave={(e) => { e.stopPropagation(); twReleaseCharge() }}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); twStartCharge() }}
                onTouchEnd={(e) => { e.stopPropagation(); twReleaseCharge() }}
                onTouchCancel={(e) => { e.stopPropagation(); twReleaseCharge() }}
                style={{ position: 'relative', height: 38, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', cursor: 'pointer', touchAction: 'none' }}
              >
                {/* Zone segments */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                  {TW_ZONES.map(z => (<div key={z.k} style={{ flex: z.mx - z.mn, background: z.color + '12', borderRight: '1px solid rgba(255,255,255,0.05)' }} />))}
                </div>
                {/* Sweet spot marker */}
                <div style={{ position: 'absolute', left: twSS.mn + '%', width: (twSS.mx - twSS.mn) + '%', top: 0, bottom: 0, background: 'rgba(124,255,107,0.08)', borderLeft: '2px solid #7CFF6B40', borderRight: '2px solid #7CFF6B40' }} />
                {/* Fill */}
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: twPower + '%', background: twPower < 15 ? '#FF8C00' : twPower < 45 ? '#7CFF6B' : twPower >= twSS.mn && twPower <= twSS.mx ? '#7CFF6B' : '#FF5A5A', transition: 'width 0.02s', opacity: 0.6 }} />
                {/* Labels */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.8)', letterSpacing: 2, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                    {twPhase === 'power' || twPhase === 'puff_charging' ? Math.round(twPower) + '%' : 'HOLD TO FIRE'}
                  </span>
                </div>
                {/* Zone labels */}
                <div style={{ position: 'absolute', bottom: 1, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
                  {TW_ZONES.map(z => (<span key={z.k} style={{ fontSize: 6, fontWeight: 700, color: z.color + '80' }}>{z.label}</span>))}
                </div>
              </div>
            )}

            {/* Heal power bar */}
            {twPhase === 'aiming' && twAction === 'heal' && twMode === 'boss' && (
              <div
                onMouseDown={(e) => { e.stopPropagation(); twStartHeal() }}
                onMouseUp={(e) => { e.stopPropagation(); twReleaseHeal() }}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); twStartHeal() }}
                onTouchEnd={(e) => { e.stopPropagation(); twReleaseHeal() }}
                style={{ position: 'relative', height: 38, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(76,175,80,0.3)', background: 'rgba(0,0,0,0.4)', cursor: 'pointer', touchAction: 'none' }}
              >
                <div style={{ position: 'absolute', left: twSS.mn + '%', width: (twSS.mx - twSS.mn) + '%', top: 0, bottom: 0, background: 'rgba(76,175,80,0.12)', borderLeft: '2px solid #4CAF5040', borderRight: '2px solid #4CAF5040' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: twPower + '%', background: twPower >= twSS.mn && twPower <= twSS.mx ? C.green : '#66BB6A', transition: 'width 0.02s', opacity: 0.5 }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.8)', letterSpacing: 2 }}>
                    {(twPhase as Phase) === 'heal_charging' ? Math.round(twPower) + '%' : 'HOLD TO HEAL'}
                  </span>
                </div>
              </div>
            )}

            {/* Puff charging label */}
            {twPhase === 'puff_charging' && (
              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: C.gold }}>{is1v1Puff && twPuffPhase === 0 ? 'SETTING ANGLE... ' + Math.round(twAngle) + '°' : 'CHARGING... ' + Math.round(twPower) + '%'}</span>
              </div>
            )}

            {/* Heal charging label */}
            {twPhase === 'heal_charging' && (
              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: C.green }}>HEALING... {Math.round(twPower)}%{twPower >= twSS.mn && twPower <= twSS.mx ? ' SWEET SPOT!' : ''}</span>
              </div>
            )}
          </div>
        )}

        {/* AI progress bar */}
        {showAIBar && (
          <div style={{ position: 'absolute', bottom: 48, left: 0, right: 0, zIndex: 30, background: 'linear-gradient(0deg, rgba(3,7,5,0.9), rgba(5,11,8,0.6))', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#ccc', marginBottom: 6 }}>{twPhase === 'boss_attack' ? (twBoss?.name + ' attacks!') : (twTanks[twTurnIdx]?.name + ' aiming...')}</div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '100%', borderRadius: 2, background: 'linear-gradient(90deg, ' + C.gold + ', transparent)', animation: 'aiProgress 1.5s ease infinite' }} />
            </div>
          </div>
        )}

        {/* LOBBY — 3-tab system */}
        {(twPhase === 'intro' || twPhase === 'modeselect') && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20, padding: '16px 14px 60px', overflowY: 'auto', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,229,255,0.04) 0%, transparent 70%), linear-gradient(180deg, #06101E, #0c1a38 50%, #081830)' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 36, marginBottom: 4 }}>🔫</div>
              <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 3, background: 'linear-gradient(135deg, #4CAF50, #81C784)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TANK WAR</div>
              <div style={{ fontSize: 8, color: '#666', letterSpacing: 2, marginTop: 2 }}>MOOD LAB PUFF SYSTEM</div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: 4, marginBottom: 12 }}>
              {[{ id: 'battle' as LobbyTab, emoji: '⚔️', label: 'BATTLE' }, { id: 'shop' as LobbyTab, emoji: '🛒', label: 'SHOP' }, { id: 'rank' as LobbyTab, emoji: '🏆', label: 'RANK' }].map(tab => (
                <div key={tab.id} onClick={(e) => { e.stopPropagation(); audio.playFx('tap'); setTwLobbyTab(tab.id) }} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', position: 'relative', overflow: 'hidden',
                  background: twLobbyTab === tab.id ? `linear-gradient(135deg, rgba(245,180,0,0.14), rgba(245,180,0,0.06))` : 'transparent',
                  border: `1px solid ${twLobbyTab === tab.id ? 'rgba(245,180,0,0.35)' : 'transparent'}`,
                  transition: 'all 0.2s', touchAction: 'none',
                }}>
                  <div style={{ fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <span>{tab.emoji}</span>
                    <span style={{ fontWeight: 700, letterSpacing: 0.5, color: twLobbyTab === tab.id ? C.gold : '#888', fontSize: 9 }}>{tab.label}</span>
                  </div>
                  {twLobbyTab === tab.id && <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, background: C.gold, borderRadius: 2 }} />}
                </div>
              ))}
            </div>

            {/* ═══ BATTLE TAB ═══ */}
            {twLobbyTab === 'battle' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[
                    { m: '1v1' as Mode, emoji: '🎯', name: '1v1 Duel', sub: 'Dual-puff aim+fire', color: twGC },
                    { m: '2v2' as Mode, emoji: '👥', name: '2v2 Teams', sub: 'You + ally vs 2', color: C.cyan },
                    { m: 'ffa' as Mode, emoji: '💀', name: 'Free-for-All', sub: '4 tanks, chaos!', color: C.red },
                    { m: 'boss' as Mode, emoji: '🐉', name: 'Boss Battle', sub: 'Co-op vs mega boss', color: C.gold },
                  ].map(b => {
                    const sel = twSelectedMode === b.m
                    return (
                      <div key={b.m} onClick={(e) => { e.stopPropagation(); audio.playFx('tap'); setTwSelectedMode(b.m); if (b.m !== 'boss') setTwBossIdx(0) }} style={{
                        padding: '14px 8px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                        background: sel ? `${b.color}15` : `${b.color}06`,
                        border: `1px solid ${sel ? b.color + '40' : b.color + '18'}`,
                        boxShadow: sel ? `0 0 16px ${b.color}20` : 'none',
                        transform: sel ? 'scale(1.02)' : 'scale(1)', transition: 'all 0.2s', touchAction: 'none',
                      }}>
                        <div style={{ fontSize: 28, marginBottom: 4 }}>{b.emoji}</div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: sel ? b.color : '#ccc' }}>{b.name}</div>
                        <div style={{ fontSize: 7, color: '#888', marginTop: 2 }}>{b.sub}</div>
                        {sel && <div style={{ marginTop: 4, width: 20, height: 3, borderRadius: 2, background: b.color, margin: '0 auto' }} />}
                      </div>
                    )
                  })}
                </div>

                {/* Boss selector */}
                {twSelectedMode === 'boss' && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: C.red, letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' }}>Choose Boss</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {TW_BOSSES.map((b, i) => {
                        const sel = twBossIdx === i
                        return (
                          <div key={i} onClick={(e) => { e.stopPropagation(); audio.playFx('tap'); setTwBossIdx(i) }} style={{
                            padding: '10px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                            background: sel ? `linear-gradient(135deg, ${b.color}15, ${b.color}05)` : `rgba(255,90,90,0.04)`,
                            border: `1.5px solid ${sel ? b.color + '40' : 'rgba(255,255,255,0.07)'}`,
                            boxShadow: sel ? `0 0 16px ${b.color}15` : 'none', transition: 'all 0.2s', touchAction: 'none',
                          }}>
                            <div style={{ fontSize: 24, marginBottom: 3 }}>{b.emoji}</div>
                            <div style={{ fontSize: 9, fontWeight: 800, color: sel ? '#fff' : '#ccc' }}>{b.name}</div>
                            <div style={{ fontSize: 7, color: b.color, marginTop: 2 }}>HP {b.maxHp}</div>
                            <div style={{ fontSize: 6, color: '#666', marginTop: 1 }}>{b.attacks.map(a => a.name).join(' · ')}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* START button */}
                {twSelectedMode && (
                  <div onClick={(e) => { e.stopPropagation(); startTankWar(twSelectedMode) }} style={{
                    padding: '14px 0', borderRadius: 50, cursor: 'pointer', textAlign: 'center', position: 'relative', overflow: 'hidden',
                    background: 'linear-gradient(135deg, #FFB800, #F5B400, #E09600, #FFB800)', backgroundSize: '200% 100%',
                    boxShadow: '0 8px 32px rgba(245,180,0,0.35)', marginBottom: 12, touchAction: 'none',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 3, color: '#0a0600' }}>✦ START BATTLE ✦</span>
                  </div>
                )}
                {!twSelectedMode && <div style={{ textAlign: 'center', fontSize: 10, color: '#666', marginBottom: 12 }}>Select a mode to begin</div>}
              </>
            )}

            {/* ═══ SHOP TAB ═══ */}
            {twLobbyTab === 'shop' && (
              <>
                <div style={{ fontSize: 9, fontWeight: 800, color: C.gold, letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Shop</span>
                  <span style={{ fontSize: 8, color: '#888', fontWeight: 400 }}>🪙 {player.coins.toLocaleString()}</span>
                </div>
                {(['skin', 'trail', 'boost'] as const).map(cat => (
                  <div key={cat} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>{cat === 'skin' ? '🎨 Skins' : cat === 'trail' ? '✨ Trails' : '⚡ Boosts'}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      {TW_SHOP.filter(s => s.cat === cat).map(item => (
                        <div key={item.id} onClick={(e) => { e.stopPropagation(); audio.playFx('tap'); player.notify('🛒 Shop — Coming in V3!', C.gold) }} style={{
                          padding: '10px 6px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                          background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)',
                          position: 'relative', overflow: 'hidden', touchAction: 'none',
                        }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${item.color}40, transparent)` }} />
                          <div style={{ fontSize: 18, marginBottom: 3 }}>{item.emoji}</div>
                          <div style={{ fontSize: 8, fontWeight: 700, color: '#ddd' }}>{item.name}</div>
                          <div style={{ fontSize: 6, color: '#666', marginTop: 1 }}>{item.desc}</div>
                          {item.price > 0 && <div style={{ fontSize: 7, fontWeight: 800, color: C.gold, marginTop: 3 }}>🪙 {item.price}</div>}
                          {item.price === 0 && <div style={{ fontSize: 6, fontWeight: 700, color: '#4CAF50', marginTop: 3 }}>FREE</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* ═══ RANK TAB ═══ */}
            {twLobbyTab === 'rank' && (
              <>
                <div style={{ fontSize: 9, fontWeight: 800, color: C.gold, letterSpacing: 1.5, marginBottom: 10, textTransform: 'uppercase' }}>Ranking</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {TW_RANKS.map((r, i) => {
                    const isCurrent = i === 0
                    return (
                      <div key={r.name} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10,
                        background: isCurrent ? `rgba(245,180,0,0.06)` : 'rgba(0,0,0,0.25)',
                        border: `1px solid ${isCurrent ? 'rgba(245,180,0,0.3)' : 'rgba(255,255,255,0.05)'}`,
                      }}>
                        <span style={{ fontSize: 20, width: 32, textAlign: 'center' }}>{r.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: r.color }}>{r.name}</div>
                          <div style={{ fontSize: 7, color: '#888' }}>{r.mn} - {r.mx === 9999 ? '∞' : r.mx} RP</div>
                        </div>
                        {isCurrent && <div style={{ fontSize: 7, fontWeight: 800, color: C.gold }}>YOU</div>}
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 8, color: '#888', marginBottom: 4 }}>Your Progress</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>🥉</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 4, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '65%', borderRadius: 3, background: `linear-gradient(90deg, #cd7f32, ${C.gold})`, transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ fontSize: 7, color: '#888', marginTop: 2 }}>65 / 100 RP to Silver</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* COMPLETE */}
        {twPhase === 'complete' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20, padding: 20, paddingBottom: 60, background: 'rgba(0,0,0,0.7)' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{twTanks.find(t => t.isPlayer)?.alive ? '🏆' : '💀'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: twTanks.find(t => t.isPlayer)?.alive ? C.gold : C.red, marginBottom: 8 }}>{twTanks.find(t => t.isPlayer)?.alive ? 'VICTORY!' : 'DEFEATED'}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Score: {twScore}</div>
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>Mode: {twMode === '1v1' ? '1v1 Duel' : twMode === '2v2' ? '2v2 Teams' : twMode === 'ffa' ? 'Free-for-All' : 'Boss Battle'}</div>
            {twPuffStreak > 0 && <div style={{ fontSize: 10, color: C.gold, marginTop: 4 }}>Puff Streak: {twPuffStreak}x</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              <div onClick={(e) => { e.stopPropagation(); const m = twMode; twCleanup(); setTimeout(() => startTankWar(m), 100) }} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: `${twGC}15`, border: `1px solid ${twGC}30`, fontSize: 12, fontWeight: 800, color: twGC, touchAction: 'none' }}>🔄 Replay</div>
              <div onClick={(e) => { e.stopPropagation(); twCleanup(); setTwPhase('modeselect'); setTwLobbyTab('battle'); setTwSelectedMode(null) }} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: `${C.cyan}10`, border: `1px solid ${C.cyan}25`, fontSize: 12, fontWeight: 800, color: C.cyan, touchAction: 'none' }}>⚔️ Change Mode</div>
              <div onClick={(e) => { e.stopPropagation(); exitGame() }} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 12, fontWeight: 800, color: '#999', touchAction: 'none' }}>Done</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
