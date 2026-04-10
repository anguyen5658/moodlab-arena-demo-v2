import React, { useState } from 'react'
import { C } from '../../constants'
import { useGameContext } from '../../context/GameContext'
import { useAudioContext } from '../../context/AudioContext'
import { ZoneHeader } from './ZoneHeader'

const FORTUNE_GAMES = [
  { id: "crystalball", name: "Fortune Teller", emoji: "🔮", type: "Predict", color: "#9333EA", desc: "Yes or No? Puff your prediction!", cat: "sportsbook" },
  { id: "strainbattle", name: "Strain Battle", emoji: "🌿", type: "Predict", color: "#22C55E", desc: "Which strain wins? Vote by puff!", cat: "sportsbook" },
  { id: "matchpredictor", name: "Match Predictor", emoji: "📊", type: "Predict", color: "#3B82F6", desc: "Predict WC match results!", cat: "sportsbook" },
  { id: "dailypicks", name: "Daily Bets", emoji: "📅", type: "Streak", color: "#F97316", desc: "3 bets per day. Build your streak!", cat: "sportsbook" },
  { id: "spinwin", name: "Spin & Win", emoji: "🎡", type: "Luck", color: "#FF4D8D", desc: "Spin the wheel! Puff = spin force!", cat: "luck" },
  { id: "puffslots", name: "Puff Slots", emoji: "🎰", type: "Luck", color: "#FFD700", desc: "3 reels. Puff to spin. Blinker = bonus!", cat: "luck" },
  { id: "coinflip", name: "Coin Flip", emoji: "🪙", type: "50/50", color: "#F59E0B", desc: "Puff confidence = bet multiplier!", cat: "luck" },
  { id: "puffblackjack", name: "Puff Blackjack", emoji: "🃏", type: "Cards", color: "#22C55E", desc: "Short = Hit. Long = Stand. Beat 21!", cat: "table" },
  { id: "crapsnclouds", name: "Craps & Clouds", emoji: "🎲", type: "Dice", color: "#EF4444", desc: "Puff duration = dice roll!", cat: "table" },
  { id: "mysterybox", name: "Mystery Box", emoji: "🎁", type: "Discovery", color: "#FFD700", desc: "3 boxes. Pick one. Puff to reveal!", cat: "mystery" },
  { id: "scratchpuff", name: "Scratch & Puff", emoji: "🎫", type: "Discovery", color: "#EC4899", desc: "6 areas. Puff to scratch. Match 3 wins!", cat: "mystery" },
  { id: "fortunecookie", name: "Fortune Cookie", emoji: "🥠", type: "Fortune", color: "#F97316", desc: "Crack it open! Wisdom + coins inside!", cat: "mystery" },
  { id: "treasuremap", name: "Treasure Map", emoji: "🗺️", type: "Adventure", color: "#FFD700", desc: "16 tiles. Find 3 treasures. Avoid bombs!", cat: "mystery" },
]

const fortuneFeedItems = [
  "🔮 CloudChaser predicted Brazil correctly!",
  "🎰 PuffQueen hit JACKPOT on Slots! +1,000",
  "🌿 Gorilla Glue won Strain Battle 52%-48%",
  "🪙 Coin Flip streak: THC_Tony at 7 in a row!",
  "🃏 BlinkerBetty hit Blackjack! Natural 21!",
]

const recentBets = [
  { q: "Brazil vs Germany", ans: "Brazil", result: "correct", coins: "+100", time: "2h ago" },
  { q: "Gorilla Glue vs Blue Dream", ans: "Gorilla Glue", result: "correct", coins: "+50", time: "5h ago" },
  { q: "FK1 WC Winner", ans: "MoodLab FC", result: "pending", coins: "--", time: "1d ago" },
  { q: "Coin Flip", ans: "Heads", result: "wrong", coins: "-25", time: "1d ago" },
  { q: "Puff Blackjack", ans: "20 vs Dealer 18", result: "correct", coins: "+200", time: "2d ago" },
]

export const OracleZone: React.FC = () => {
  const game = useGameContext()
  const audio = useAudioContext()
  const [tab, setTab] = useState("sportsbook")

  const slideIdx = Math.floor(game.tick / 4) % 4
  const fortuneFeedIdx = Math.floor(game.tick / 3) % fortuneFeedItems.length
  const featGame = FORTUNE_GAMES[Math.floor(game.tick / 16) % FORTUNE_GAMES.length]

  const heroSlides = [
    { emoji: "🏆", title: `Daily Jackpot: ${game.fortuneJackpot.toLocaleString()}`, sub: "Play any game to grow the pot!", color: C.gold, badge: "LIVE" },
    { emoji: featGame.emoji, title: featGame.name, sub: featGame.desc, color: featGame.color, badge: "PLAY" },
    { emoji: "🍀", title: game.fortuneLuckyHour ? "LUCKY HOUR LIVE!" : "Lucky Hour", sub: game.fortuneLuckyHour ? "2x ALL WINS right now!" : "Coming soon...", color: "#7FFF00", badge: game.fortuneLuckyHour ? "2x" : "" },
    { emoji: "🔮", title: "Fortune Teller", sub: "15 yes/no predictions. Blinker = 3x risk!", color: C.purple, badge: "HOT" },
  ]
  const slide = heroSlides[slideIdx]

  const launchGame = (g: typeof FORTUNE_GAMES[0]) => {
    audio.playFx("select")
    game.setSelectedGame({ id: g.id, name: g.name, emoji: g.emoji, color: g.color, desc: g.desc, type: g.type })
  }

  const tabGames = tab === "sportsbook" ? FORTUNE_GAMES.filter(g => g.cat === "sportsbook")
    : tab === "luck" ? FORTUNE_GAMES.filter(g => g.cat === "luck")
    : tab === "table" ? FORTUNE_GAMES.filter(g => g.cat === "table")
    : tab === "mystery" ? FORTUNE_GAMES.filter(g => g.cat === "mystery")
    : []

  return (
    <div style={{ position: "relative" }}>
      {/* Gold particles bg */}
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ position: "absolute", left: `${(i * 13 + 5) % 100}%`, top: `${(i * 27 + 8) % 400}px`, width: 2 + (i % 3), height: 2 + (i % 3), borderRadius: "50%", background: i % 3 === 0 ? C.gold : i % 3 === 1 ? C.green : C.red, opacity: 0.15, animation: `pulse ${2 + (i % 3)}s infinite ${i * 0.25}s`, pointerEvents: "none", zIndex: 0 }} />
      ))}
      <div style={{ position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)", width: 320, height: 220, borderRadius: "50%", background: `radial-gradient(circle, ${C.gold}14, transparent 70%)`, pointerEvents: "none" }} />

      <ZoneHeader zoneKey="oracle" />

      {/* Hero slider */}
      <div onClick={() => { if (slide.badge === "PLAY") launchGame(featGame); else if (slide.badge === "HOT") launchGame(FORTUNE_GAMES[0]) }} style={{ padding: "0 14px", marginBottom: 10, cursor: "pointer", touchAction: "none" }}>
        <div style={{ padding: "14px 16px", borderRadius: 16, position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${slide.color}12, ${slide.color}04)`, border: `1px solid ${slide.color}20` }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: "40%", height: "100%", background: `radial-gradient(circle at 80% 50%, ${slide.color}15, transparent 70%)`, pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 32, filter: `drop-shadow(0 0 8px ${slide.color}60)` }}>{slide.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{slide.title}</div>
                {slide.badge && <span style={{ fontSize: 6, fontWeight: 900, padding: "2px 6px", borderRadius: 4, background: `${C.red}18`, color: C.red, border: `1px solid ${C.red}25` }}>{slide.badge}</span>}
              </div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{slide.sub}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 8 }}>
            {heroSlides.map((_, i) => (
              <div key={i} style={{ width: i === slideIdx ? 16 : 5, height: 5, borderRadius: 3, background: i === slideIdx ? slide.color : `${C.text3}30`, transition: "all 0.3s" }} />
            ))}
          </div>
        </div>
      </div>

      {/* Jackpot banner */}
      <div style={{ padding: "0 14px", marginBottom: 8 }}>
        <div style={{ textAlign: "center", padding: "8px 14px", borderRadius: 12, background: `linear-gradient(135deg, ${C.gold}10, ${C.red}08)`, border: `1px solid ${C.gold}18` }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: C.text3, letterSpacing: 2 }}>DAILY JACKPOT</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.gold, textShadow: `0 0 16px ${C.gold}40` }}>🏆 {game.fortuneJackpot.toLocaleString()} coins</div>
          <div style={{ fontSize: 7, color: C.text3 }}>Play any game for a chance to win</div>
        </div>
      </div>

      {/* Lucky hour */}
      {game.fortuneLuckyHour && (
        <div style={{ padding: "0 14px", marginBottom: 8 }}>
          <div style={{ textAlign: "center", padding: "8px 14px", borderRadius: 12, background: `linear-gradient(135deg, ${C.gold}14, ${C.orange}10)`, border: `1px solid ${C.gold}30`, animation: "pulse 1.5s infinite" }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: C.gold, letterSpacing: 1.5 }}>LUCKY HOUR LIVE! 2x ALL WINS!</div>
            <div style={{ fontSize: 7, color: C.orange, fontWeight: 700, marginTop: 2 }}>47 min left</div>
          </div>
        </div>
      )}

      {/* Feed bar */}
      <div style={{ padding: "0 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100, background: `${C.gold}06`, border: `1px solid ${C.gold}10` }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.green, animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 9, color: C.text2, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fortuneFeedItems[fortuneFeedIdx]}</span>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ padding: "0 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ v: "284", l: "Bets Made", c: C.gold }, { v: "62%", l: "Win Rate", c: C.green }, { v: "🔥5", l: "Streak", c: C.orange }, { v: Math.floor(game.fortuneJackpot / 1000) + "K", l: "Jackpot Pool", c: C.red }].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "6px 0", borderRadius: 8, textAlign: "center", background: `${s.c}06`, border: `1px solid ${s.c}12` }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 6, color: C.text3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 14px" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto", paddingBottom: 2 }}>
          {[{ id: "sportsbook", label: "Sportsbook", emoji: "🔮" }, { id: "luck", label: "Luck", emoji: "🎰" }, { id: "table", label: "Table", emoji: "🃏" }, { id: "mystery", label: "Mystery", emoji: "✨" }, { id: "recent", label: "Recent", emoji: "📜" }].map(t => (
            <div key={t.id} onClick={() => setTab(t.id)} style={{ padding: "6px 12px", borderRadius: 10, cursor: "pointer", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", background: tab === t.id ? `${C.gold}18` : `${C.text3}06`, color: tab === t.id ? C.gold : C.text3, border: `1px solid ${tab === t.id ? C.gold + "35" : C.border}`, display: "flex", alignItems: "center", gap: 4, touchAction: "none" }}>
              <span style={{ fontSize: 11 }}>{t.emoji}</span>{t.label}
            </div>
          ))}
        </div>

        {/* Game grid */}
        {tab !== "recent" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {tabGames.map((g, i) => (
              <div key={g.id} onClick={() => launchGame(g)} style={{ padding: "12px 10px", borderRadius: 14, cursor: "pointer", position: "relative", overflow: "hidden", background: `radial-gradient(ellipse at 50% 0%, ${g.color}10, ${C.bg2} 70%)`, border: `1px solid ${g.color}15`, animation: `fadeIn 0.3s ease ${i * 0.05}s both`, touchAction: "none" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, background: `radial-gradient(circle, ${g.color}18, ${g.color}05)`, border: `1px solid ${g.color}22`, marginBottom: 6 }}>{g.emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.text, marginBottom: 3 }}>{g.name}</div>
                <div style={{ fontSize: 8, color: C.text3, lineHeight: 1.3, marginBottom: 5 }}>{g.desc}</div>
                <span style={{ fontSize: 7, fontWeight: 700, color: g.color, padding: "2px 6px", borderRadius: 4, background: `${g.color}10` }}>{g.type}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recent bets tab */}
        {tab === "recent" && (
          <div style={{ marginBottom: 14 }}>
            {recentBets.map((bet, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, marginBottom: 6, background: bet.result === "correct" ? `${C.green}06` : bet.result === "wrong" ? `${C.red}06` : `${C.gold}04`, border: `1px solid ${bet.result === "correct" ? C.green : bet.result === "wrong" ? C.red : C.gold}15` }}>
                <div style={{ fontSize: 14 }}>{bet.result === "correct" ? "✅" : bet.result === "wrong" ? "❌" : "⏳"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bet.q}</div>
                  <div style={{ fontSize: 8, color: C.text3 }}>{bet.ans} · {bet.time}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 900, color: bet.result === "correct" ? C.green : bet.result === "wrong" ? C.red : C.gold }}>{bet.coins}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ height: 80 }} />
    </div>
  )
}
