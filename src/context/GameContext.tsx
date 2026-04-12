import React, { createContext, useContext, useEffect, useState } from 'react'
import { WC_LIVE_MATCHES, ARENA_IMAGES } from '../constants'
import type { ActiveGame } from '../types'

interface GameContextValue {
  // ── Start Screen / Lobby ──
  selectedGame: ActiveGame | null
  setSelectedGame: React.Dispatch<React.SetStateAction<ActiveGame | null>>
  ssMode: string | null
  setSsMode: React.Dispatch<React.SetStateAction<string | null>>
  ssRole: string | null
  setSsRole: React.Dispatch<React.SetStateAction<string | null>>
  ssOpponent: string | null
  setSsOpponent: React.Dispatch<React.SetStateAction<string | null>>
  ssFortune: string | null
  setSsFortune: React.Dispatch<React.SetStateAction<string | null>>
  ssInput: string | null
  setSsInput: React.Dispatch<React.SetStateAction<string | null>>
  showHowToPlay: boolean
  setShowHowToPlay: React.Dispatch<React.SetStateAction<boolean>>
  startMode: string | null
  setStartMode: React.Dispatch<React.SetStateAction<string | null>>
  startOpp: string
  setStartOpp: React.Dispatch<React.SetStateAction<string>>
  startRole: string | null
  setStartRole: React.Dispatch<React.SetStateAction<string | null>>

  // ── Active Game ──
  gameActive: ActiveGame | null
  setGameActive: React.Dispatch<React.SetStateAction<ActiveGame | null>>
  matchmaking: any | null
  setMatchmaking: React.Dispatch<React.SetStateAction<any | null>>
  puffLocking: boolean
  setPuffLocking: React.Dispatch<React.SetStateAction<boolean>>

  // ── Game Chat ──
  gameChatMsgs: any[]
  setGameChatMsgs: React.Dispatch<React.SetStateAction<any[]>>
  gameChatOpen: boolean
  setGameChatOpen: React.Dispatch<React.SetStateAction<boolean>>
  gameChatInput: string
  setGameChatInput: React.Dispatch<React.SetStateAction<string>>

  // ── UI Overlays ──
  showInputPanel: boolean
  setShowInputPanel: React.Dispatch<React.SetStateAction<boolean>>
  showBlePopup: boolean
  setShowBlePopup: React.Dispatch<React.SetStateAction<boolean>>

  // ── Input Config ──
  inputMode: string
  setInputMode: React.Dispatch<React.SetStateAction<string>>
  primaryInput: string
  setPrimaryInput: React.Dispatch<React.SetStateAction<string>>
  sessionInput: string | null
  setSessionInput: React.Dispatch<React.SetStateAction<string | null>>

  // ── Puff Event System ──
  puffEvent: any | null
  setPuffEvent: React.Dispatch<React.SetStateAction<any | null>>
  puffEventResult: any | null
  setPuffEventResult: React.Dispatch<React.SetStateAction<any | null>>
  puffEventSchedule: any
  setPuffEventSchedule: React.Dispatch<React.SetStateAction<any>>

  // ── Halftime ──
  halftimeGame: any | null
  setHalftimeGame: React.Dispatch<React.SetStateAction<any | null>>
  halftimeResult: any | null
  setHalftimeResult: React.Dispatch<React.SetStateAction<any | null>>

  // ── World Cup ──
  wcTeam: any | null
  setWcTeam: React.Dispatch<React.SetStateAction<any | null>>
  wcTournament: any | null
  setWcTournament: React.Dispatch<React.SetStateAction<any | null>>
  wcGameId: string
  setWcGameId: React.Dispatch<React.SetStateAction<string>>
  wcPhase: string | null
  setWcPhase: React.Dispatch<React.SetStateAction<string | null>>
  wcCooldown: number | null
  setWcCooldown: React.Dispatch<React.SetStateAction<number | null>>
  wcMatchday: number
  setWcMatchday: React.Dispatch<React.SetStateAction<number>>
  wcBracket: any | null
  setWcBracket: React.Dispatch<React.SetStateAction<any | null>>
  wcDrawAnim: boolean
  setWcDrawAnim: React.Dispatch<React.SetStateAction<boolean>>
  wcGroupResult: string | null
  setWcGroupResult: React.Dispatch<React.SetStateAction<string | null>>
  wcFinalResult: string | null
  setWcFinalResult: React.Dispatch<React.SetStateAction<string | null>>
  wcViewTab: string
  setWcViewTab: React.Dispatch<React.SetStateAction<string>>
  wcLiveMatches: any[]
  setWcLiveMatches: React.Dispatch<React.SetStateAction<any[]>>
  wcLivePrediction: Record<string, string>
  setWcLivePrediction: React.Dispatch<React.SetStateAction<Record<string, string>>>
  wcLiveTab: string
  setWcLiveTab: React.Dispatch<React.SetStateAction<string>>
  wcDeviceInput: string | null
  setWcDeviceInput: React.Dispatch<React.SetStateAction<string | null>>
  wcHubTab: string
  setWcHubTab: React.Dispatch<React.SetStateAction<string>>
  fanMode: string | null
  setFanMode: React.Dispatch<React.SetStateAction<string | null>>
  fanTeam: any | null
  setFanTeam: React.Dispatch<React.SetStateAction<any | null>>
  fanDevice: any | null
  setFanDevice: React.Dispatch<React.SetStateAction<any | null>>

  // ── Predictions ──
  selectedMatch: any | null
  setSelectedMatch: React.Dispatch<React.SetStateAction<any | null>>
  selectedOutcome: any | null
  setSelectedOutcome: React.Dispatch<React.SetStateAction<any | null>>
  betAmount: number
  setBetAmount: React.Dispatch<React.SetStateAction<number>>
  predictLocked: Record<string, any>
  setPredictLocked: React.Dispatch<React.SetStateAction<Record<string, any>>>

  // ── Fortune ──
  fortuneJackpot: number
  setFortuneJackpot: React.Dispatch<React.SetStateAction<number>>
  fortuneLuckyHour: boolean
  setFortuneLuckyHour: React.Dispatch<React.SetStateAction<boolean>>

  // ── Spin & Win ──
  swPhase: string | null
  setSwPhase: React.Dispatch<React.SetStateAction<string | null>>
  swAngle: number
  setSwAngle: React.Dispatch<React.SetStateAction<number>>
  swSpinning: boolean
  setSwSpinning: React.Dispatch<React.SetStateAction<boolean>>
  swPrize: any | null
  setSwPrize: React.Dispatch<React.SetStateAction<any | null>>
  swRound: number
  setSwRound: React.Dispatch<React.SetStateAction<number>>
  swTotalWon: number
  setSwTotalWon: React.Dispatch<React.SetStateAction<number>>
  swBonusRound: boolean
  setSwBonusRound: React.Dispatch<React.SetStateAction<boolean>>
  swShowBust: boolean
  setSwShowBust: React.Dispatch<React.SetStateAction<boolean>>
  swShowJackpot: boolean
  setSwShowJackpot: React.Dispatch<React.SetStateAction<boolean>>

  // ── Loyalty/Me Tab ──
  loyaltyTab: string
  setLoyaltyTab: React.Dispatch<React.SetStateAction<string>>
  meTab: string
  setMeTab: React.Dispatch<React.SetStateAction<string>>

  // ── Live Tab ──
  liveTab: string
  setLiveTab: React.Dispatch<React.SetStateAction<string>>
  liveScreen: string
  setLiveScreen: React.Dispatch<React.SetStateAction<string>>
  liveCategory: string
  setLiveCategory: React.Dispatch<React.SetStateAction<string>>
  liveHeroIdx: number
  setLiveHeroIdx: React.Dispatch<React.SetStateAction<number>>
  liveHeroProgress: number
  setLiveHeroProgress: React.Dispatch<React.SetStateAction<number>>
  selectedStream: any | null
  setSelectedStream: React.Dispatch<React.SetStateAction<any | null>>
  liveChatMsgs: any[]
  setLiveChatMsgs: React.Dispatch<React.SetStateAction<any[]>>
  liveViewers: number
  setLiveViewers: React.Dispatch<React.SetStateAction<number>>
  livePuffCount: number
  setLivePuffCount: React.Dispatch<React.SetStateAction<number>>
  liveFollowed: Record<string, boolean>
  setLiveFollowed: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  liveFloatingReactions: any[]
  setLiveFloatingReactions: React.Dispatch<React.SetStateAction<any[]>>
  liveChatInput: string
  setLiveChatInput: React.Dispatch<React.SetStateAction<string>>
  liveShowTip: boolean
  setLiveShowTip: React.Dispatch<React.SetStateAction<boolean>>
  liveIsFollowingHost: boolean
  setLiveIsFollowingHost: React.Dispatch<React.SetStateAction<boolean>>
  liveActiveCard: string
  setLiveActiveCard: React.Dispatch<React.SetStateAction<string>>

  // ── Arena Navigation ──
  arenaView: string
  setArenaView: React.Dispatch<React.SetStateAction<string>>
  walking: boolean
  walkFrom: string | null
  arenaLoading: boolean
  setArenaLoading: React.Dispatch<React.SetStateAction<boolean>>
  walkTo: (target: string) => void
  walkBack: () => void

  // ── Arena Chat ──
  chatPanel: boolean
  setChatPanel: React.Dispatch<React.SetStateAction<boolean>>
  chatMessages: any[]
  setChatMessages: React.Dispatch<React.SetStateAction<any[]>>
  chatInput: string
  setChatInput: React.Dispatch<React.SetStateAction<string>>

  // ── Control / Live misc ──
  controlHeat: number[]
  setControlHeat: React.Dispatch<React.SetStateAction<number[]>>
  liveScore: { home: number; away: number; min: number }
  setLiveScore: React.Dispatch<React.SetStateAction<{ home: number; away: number; min: number }>>

  // ── Derived / misc ──
  tick: number
  mainStage: number
  setMainStage: React.Dispatch<React.SetStateAction<number>>

  // actions
  exitGame: () => void
  sendChat: (msg?: string) => void
}

const GameCtx = createContext<GameContextValue>(null!)
export const useGameContext = () => useContext(GameCtx)

export const GameProvider: React.FC<{ children: React.ReactNode; bleConnected?: boolean }> = ({ children, bleConnected = false }) => {
  // ── Tick / timer ──
  const [tick, setTick] = useState(0)
  const [mainStage, setMainStage] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    const t = setInterval(() => setMainStage(p => (p + 1) % 3), 5000)
    return () => clearInterval(t)
  }, [])

  // ── Start Screen ──
  const [selectedGame, setSelectedGame] = useState<ActiveGame | null>(null)
  const [ssMode, setSsMode] = useState<string | null>(null)
  const [ssRole, setSsRole] = useState<string | null>(null)
  const [ssOpponent, setSsOpponent] = useState<string | null>(null)
  const [ssFortune, setSsFortune] = useState<string | null>(null)
  const [ssInput, setSsInput] = useState<string | null>(null)
  const [showHowToPlay, setShowHowToPlay] = useState(false)
  const [startMode, setStartMode] = useState<string | null>(null)
  const [startOpp, setStartOpp] = useState("ai")
  const [startRole, setStartRole] = useState<string | null>(null)

  // Reset start screen when game changes
  useEffect(() => {
    setSsMode(null)
    setSsRole(null)
    setSsOpponent(null)
    setSsFortune(null)
    setSsInput(bleConnected ? null : "tap")
    setShowHowToPlay(false)
  }, [selectedGame?.id])

  // ── Active Game ──
  const [gameActive, setGameActive] = useState<ActiveGame | null>(null)
  const [matchmaking, setMatchmaking] = useState<any | null>(null)
  const [puffLocking, setPuffLocking] = useState(false)

  // ── Chat ──
  const [gameChatMsgs, setGameChatMsgs] = useState<any[]>([])
  const [gameChatOpen, setGameChatOpen] = useState(true)
  const [gameChatInput, setGameChatInput] = useState("")

  // ── UI Overlays ──
  const [showInputPanel, setShowInputPanel] = useState(false)
  const [showBlePopup, setShowBlePopup] = useState(false)

  // ── Input Config ──
  const [inputMode, setInputMode] = useState("auto")
  const [primaryInput, setPrimaryInput] = useState("puff")
  const [sessionInput, setSessionInput] = useState<string | null>(null)

  // ── Puff Event ──
  const [puffEvent, setPuffEvent] = useState<any | null>(null)
  const [puffEventResult, setPuffEventResult] = useState<any | null>(null)
  const [puffEventSchedule, setPuffEventSchedule] = useState(() => {
    const types = ["countdown", "blinker", "chain", "420"]
    return { nextType: types[Math.floor(Math.random() * types.length)], nextAt: Date.now() + (120000 + Math.random() * 60000) }
  })

  // ── Halftime ──
  const [halftimeGame, setHalftimeGame] = useState<any | null>(null)
  const [halftimeResult, setHalftimeResult] = useState<any | null>(null)

  // ── World Cup ──
  const [wcTeam, setWcTeam] = useState<any | null>(null)
  const [wcTournament, setWcTournament] = useState<any | null>(null)
  const [wcGameId, setWcGameId] = useState("finalkick")
  const [wcPhase, setWcPhase] = useState<string | null>(null)
  const [wcCooldown, setWcCooldown] = useState<number | null>(null)
  const [wcMatchday, setWcMatchday] = useState(0)
  const [wcBracket, setWcBracket] = useState<any | null>(null)
  const [wcDrawAnim, setWcDrawAnim] = useState(false)
  const [wcGroupResult, setWcGroupResult] = useState<string | null>(null)
  const [wcFinalResult, setWcFinalResult] = useState<string | null>(null)
  const [wcViewTab, setWcViewTab] = useState("mygroup")
  const [wcLiveMatches, setWcLiveMatches] = useState(WC_LIVE_MATCHES)
  const [wcLivePrediction, setWcLivePrediction] = useState<Record<string, string>>({})
  const [wcLiveTab, setWcLiveTab] = useState("live")
  const [wcDeviceInput, setWcDeviceInput] = useState<string | null>(null)
  const [wcHubTab, setWcHubTab] = useState("games")
  const [fanMode, setFanMode] = useState<string | null>(null)
  const [fanTeam, setFanTeam] = useState<any | null>(null)
  const [fanDevice, setFanDevice] = useState<any | null>(null)

  // ── Predictions ──
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null)
  const [selectedOutcome, setSelectedOutcome] = useState<any | null>(null)
  const [betAmount, setBetAmount] = useState(50)
  const [predictLocked, setPredictLocked] = useState<Record<string, any>>({})

  // ── Fortune ──
  const [fortuneJackpot, setFortuneJackpot] = useState(4200)
  const [fortuneLuckyHour, setFortuneLuckyHour] = useState(false)

  useEffect(() => { if (tick % 30 === 0) setFortuneJackpot(j => j + Math.floor(Math.random() * 50) + 10) }, [tick])
  useEffect(() => {
    if (tick % 300 === 0 && Math.random() < 0.1) setFortuneLuckyHour(true)
    if (fortuneLuckyHour && tick % 3600 === 0) setFortuneLuckyHour(false)
  }, [tick, fortuneLuckyHour])

  // ── Spin & Win ──
  const [swPhase, setSwPhase] = useState<string | null>(null)
  const [swAngle, setSwAngle] = useState(0)
  const [swSpinning, setSwSpinning] = useState(false)
  const [swPrize, setSwPrize] = useState<any | null>(null)
  const [swRound, setSwRound] = useState(0)
  const [swTotalWon, setSwTotalWon] = useState(0)
  const [swBonusRound, setSwBonusRound] = useState(false)
  const [swShowBust, setSwShowBust] = useState(false)
  const [swShowJackpot, setSwShowJackpot] = useState(false)

  // ── Loyalty/Me Tab ──
  const [loyaltyTab, setLoyaltyTab] = useState("overview")
  const [meTab, setMeTab] = useState("stats")

  // ── Live Tab ──
  const [liveTab, setLiveTab] = useState("now")
  const [liveScreen, setLiveScreen] = useState("explore")
  const [liveCategory, setLiveCategory] = useState("All")
  const [liveHeroIdx, setLiveHeroIdx] = useState(0)
  const [liveHeroProgress, setLiveHeroProgress] = useState(0)
  const [selectedStream, setSelectedStream] = useState<any | null>(null)
  const [liveChatMsgs, setLiveChatMsgs] = useState<any[]>([
    { user: "PuffDaddy", msg: "LET'S GO! 🔥", c: "#FFD93D" },
    { user: "CloudRider", msg: "Puff wave!! 💨", c: "#00E5FF" },
    { user: "VibeCheck", msg: "This is amazing", c: "#34D399" },
  ])
  const [liveViewers, setLiveViewers] = useState(0)
  const [livePuffCount, setLivePuffCount] = useState(0)
  const [liveFollowed, setLiveFollowed] = useState<Record<string, boolean>>({})
  const [liveFloatingReactions, setLiveFloatingReactions] = useState<any[]>([])
  const [liveChatInput, setLiveChatInput] = useState("")
  const [liveShowTip, setLiveShowTip] = useState(false)
  const [liveIsFollowingHost, setLiveIsFollowingHost] = useState(false)
  const [liveActiveCard, setLiveActiveCard] = useState("prediction")

  // ── Arena Navigation ──
  const [arenaView, setArenaView] = useState("hub")
  const [walking, setWalking] = useState(false)
  const [walkFrom, setWalkFrom] = useState<string | null>(null)
  const [arenaLoading, setArenaLoading] = useState(true)

  // Preload arena images then dismiss loading screen
  useEffect(() => {
    let loaded = 0
    const srcs = Object.values(ARENA_IMAGES)
    const total = srcs.length
    srcs.forEach((src: string) => {
      const img = new Image()
      img.onload = img.onerror = () => { loaded++; if (loaded >= total) setTimeout(() => setArenaLoading(false), 1200) }
      img.src = src
    })
    const fallback = setTimeout(() => setArenaLoading(false), 2500)
    return () => clearTimeout(fallback)
  }, [])

  const walkTo = (target: string) => {
    if (walking || arenaView === target) return
    setWalkFrom(arenaView)
    setWalking(true)
    setTimeout(() => {
      setArenaView(target)
      setTimeout(() => { setWalking(false); setWalkFrom(null) }, 50)
    }, 400)
  }
  const walkBack = () => walkTo("hub")

  // ── Arena Chat ──
  const [chatPanel, setChatPanel] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([
    { u: "Steve", m: "This is lit 🔥", c: "#00E5FF", isYou: true },
    { u: "PuffDaddy", m: "LET'S GO!", c: "#FFD93D" },
  ])
  const [chatInput, setChatInput] = useState("")

  // ── Control/Live misc ──
  const [controlHeat, setControlHeat] = useState([2, 1])
  const [liveScore, setLiveScore] = useState({ home: 1, away: 0, min: 34 })

  const exitGame = () => {
    setGameActive(null)
    setMatchmaking(null)
  }

  const sendChat = (msg?: string) => {
    const t = msg || chatInput.trim()
    if (!t) return
    setChatMessages(p => [...p.slice(-20), { u: "Steve", m: t, c: "#00E5FF", isYou: true }])
    setChatInput("")
  }

  return (
    <GameCtx.Provider value={{
      selectedGame, setSelectedGame, ssMode, setSsMode, ssRole, setSsRole,
      ssOpponent, setSsOpponent, ssFortune, setSsFortune, ssInput, setSsInput,
      showHowToPlay, setShowHowToPlay, startMode, setStartMode, startOpp, setStartOpp, startRole, setStartRole,
      gameActive, setGameActive, matchmaking, setMatchmaking, puffLocking, setPuffLocking,
      gameChatMsgs, setGameChatMsgs, gameChatOpen, setGameChatOpen, gameChatInput, setGameChatInput,
      showInputPanel, setShowInputPanel, showBlePopup, setShowBlePopup,
      inputMode, setInputMode, primaryInput, setPrimaryInput, sessionInput, setSessionInput,
      puffEvent, setPuffEvent, puffEventResult, setPuffEventResult, puffEventSchedule, setPuffEventSchedule,
      halftimeGame, setHalftimeGame, halftimeResult, setHalftimeResult,
      wcTeam, setWcTeam, wcTournament, setWcTournament, wcGameId, setWcGameId,
      wcPhase, setWcPhase, wcCooldown, setWcCooldown, wcMatchday, setWcMatchday,
      wcBracket, setWcBracket, wcDrawAnim, setWcDrawAnim, wcGroupResult, setWcGroupResult,
      wcFinalResult, setWcFinalResult, wcViewTab, setWcViewTab,
      wcLiveMatches, setWcLiveMatches, wcLivePrediction, setWcLivePrediction,
      wcLiveTab, setWcLiveTab, wcDeviceInput, setWcDeviceInput, wcHubTab, setWcHubTab,
      fanMode, setFanMode, fanTeam, setFanTeam, fanDevice, setFanDevice,
      selectedMatch, setSelectedMatch, selectedOutcome, setSelectedOutcome,
      betAmount, setBetAmount, predictLocked, setPredictLocked,
      fortuneJackpot, setFortuneJackpot, fortuneLuckyHour, setFortuneLuckyHour,
      swPhase, setSwPhase, swAngle, setSwAngle, swSpinning, setSwSpinning,
      swPrize, setSwPrize, swRound, setSwRound, swTotalWon, setSwTotalWon,
      swBonusRound, setSwBonusRound, swShowBust, setSwShowBust, swShowJackpot, setSwShowJackpot,
      loyaltyTab, setLoyaltyTab, meTab, setMeTab,
      liveTab, setLiveTab, liveScreen, setLiveScreen, liveCategory, setLiveCategory,
      liveHeroIdx, setLiveHeroIdx, liveHeroProgress, setLiveHeroProgress,
      selectedStream, setSelectedStream, liveChatMsgs, setLiveChatMsgs,
      liveViewers, setLiveViewers, livePuffCount, setLivePuffCount,
      liveFollowed, setLiveFollowed, liveFloatingReactions, setLiveFloatingReactions,
      liveChatInput, setLiveChatInput, liveShowTip, setLiveShowTip,
      liveIsFollowingHost, setLiveIsFollowingHost, liveActiveCard, setLiveActiveCard,
      tick, mainStage, setMainStage, exitGame, sendChat,
      arenaView, setArenaView, walking, walkFrom, arenaLoading, setArenaLoading, walkTo, walkBack,
      chatPanel, setChatPanel, chatMessages, setChatMessages, chatInput, setChatInput,
      controlHeat, setControlHeat, liveScore, setLiveScore,
    }}>
      {children}
    </GameCtx.Provider>
  )
}
