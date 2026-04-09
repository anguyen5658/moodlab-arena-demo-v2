import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';
import ZoneHeader from '../../components/ZoneHeader.jsx';

const FORTUNE_GAMES = [
  // Sportsbook
  { id:'crystalball',   name:'Fortune Teller',  emoji:'🔮', type:'Predict',   color:'#9333EA', desc:'Yes or No? Puff your prediction!',           cat:'sportsbook' },
  { id:'strainbattle',  name:'Strain Battle',   emoji:'🌿', type:'Predict',   color:C.green,   desc:'Which strain wins? Vote by puff!',            cat:'sportsbook' },
  { id:'matchpredictor',name:'Match Predictor', emoji:'📊', type:'Predict',   color:C.blue,    desc:'Predict WC match results!',                   cat:'sportsbook' },
  { id:'dailypicks',    name:'Daily Bets',       emoji:'📅', type:'Streak',    color:C.orange,  desc:'3 bets per day. Build your streak!',          cat:'sportsbook' },
  // Luck
  { id:'puffslots',     name:'Puff Slots',       emoji:'🎰', type:'Luck',      color:C.gold,    desc:'3 reels. Puff to spin. Blinker = bonus!',     cat:'luck' },
  { id:'coinflip',      name:'Coin Flip',         emoji:'🪙', type:'50/50',    color:C.gold,    desc:'Puff confidence = bet multiplier!',           cat:'luck' },
  // Table
  { id:'puffblackjack', name:'Puff Blackjack',   emoji:'🃏', type:'Cards',     color:C.green,   desc:'Short = Hit. Long = Stand. Beat 21!',         cat:'table' },
  { id:'crapsnclouds',  name:'Craps & Clouds',   emoji:'🎲', type:'Dice',      color:C.cyan,    desc:'Puff duration = dice roll!',                  cat:'table' },
  // Mystery
  { id:'mysterybox',    name:'Mystery Box',       emoji:'🎁', type:'Discovery', color:C.gold,    desc:'3 boxes. Pick one. Puff to reveal!',          cat:'mystery' },
  { id:'scratchpuff',   name:'Scratch & Puff',   emoji:'🎫', type:'Discovery', color:C.pink,    desc:'6 areas. Puff to scratch. Match 3 wins!',     cat:'mystery' },
  { id:'fortunecookie', name:'Fortune Cookie',   emoji:'🥠', type:'Fortune',   color:C.orange,  desc:'Crack it open! Wisdom + coins inside!',       cat:'mystery' },
  { id:'treasuremap',   name:'Treasure Map',     emoji:'🗺️',type:'Adventure', color:C.gold,    desc:'16 tiles. Find 3 treasures. Avoid bombs!',    cat:'mystery' },
];

const FORTUNE_TABS = [
  { id:'sportsbook', label:'Sportsbook', emoji:'🔮' },
  { id:'luck',       label:'Luck',       emoji:'🎰' },
  { id:'table',      label:'Table',      emoji:'🃏' },
  { id:'mystery',    label:'Mystery',    emoji:'✨' },
  { id:'recent',     label:'Recent',     emoji:'📜' },
];

const RECENT = [
  { game:'Fortune Teller', result:'Won',   emoji:'🔮', coins:'+50',  time:'2m ago',  color:C.green },
  { game:'Puff Slots',     result:'Bust',  emoji:'🎰', coins:'-20',  time:'8m ago',  color:C.red },
  { game:'Coin Flip',      result:'Won 3x',emoji:'🪙', coins:'+150', time:'15m ago', color:C.gold },
  { game:'Strain Battle',  result:'Voted', emoji:'🌿', coins:'+10',  time:'22m ago', color:C.green },
  { game:'Blackjack',      result:'21!',   emoji:'🃏', coins:'+200', time:'30m ago', color:C.gold },
  { game:'Mystery Box',    result:'Rare!', emoji:'🎁', coins:'+300', time:'45m ago', color:'#9333EA' },
];

const JACKPOT = 12847;

const FEED_ITEMS = [
  '🔮 CloudChaser predicted Brazil correctly!',
  '🎰 PuffQueen hit JACKPOT on Slots! +1,000',
  '🌿 Gorilla Glue won Strain Battle 52%-48%',
  '🪙 Coin Flip streak: THC_Tony at 7 in a row!',
  '🃏 BlinkerBetty hit Blackjack! Natural 21!',
];

export default function OracleZone() {
  const navigate = useNavigate();
  const { playFx } = useApp();
  const [tab, setTab] = useState('sportsbook');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const feedItem = FEED_ITEMS[Math.floor(tick / 3) % FEED_ITEMS.length];
  const tabGames = FORTUNE_GAMES.filter(g => g.cat === tab);
  const slideIdx = Math.floor(tick / 4) % 4;
  const featGame = FORTUNE_GAMES[Math.floor(tick / 16) % FORTUNE_GAMES.length];
  const heroSlides = [
    { emoji: '🏆', title: `Daily Jackpot: ${JACKPOT.toLocaleString()}`, sub: 'Play any game to grow the pot!', color: C.gold, badge: 'LIVE' },
    { emoji: featGame.emoji, title: featGame.name, sub: featGame.desc, color: featGame.color || C.gold, badge: 'PLAY' },
    { emoji: '🍀', title: 'Lucky Hour', sub: 'Coming soon...', color: C.lime, badge: '' },
    { emoji: '🔮', title: 'Fortune Teller', sub: '15 yes/no predictions. Blinker = 3x risk!', color: '#9333EA', badge: 'HOT' },
  ];
  const slide = heroSlides[slideIdx];

  const launch = (g) => { playFx('select'); navigate(`/oracle/${g.id}`); };

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: C.bg, paddingBottom: 80 }}>
      <ZoneHeader zoneKey="oracle" />

      {/* Gold glow + particles */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 320, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${C.gold}14, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ padding: '12px 14px', position: 'relative', zIndex: 1 }}>
          {/* Hero slider */}
          <div onClick={() => launch(featGame)} style={{ marginBottom: 10, cursor: 'pointer' }}>
            <div style={{ padding: '14px 16px', borderRadius: 16, position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${slide.color}12, ${slide.color}04)`, border: `1px solid ${slide.color}20` }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: `radial-gradient(circle at 80% 50%, ${slide.color}15, transparent 70%)`, pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 32, filter: `drop-shadow(0 0 8px ${slide.color}60)` }}>{slide.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{slide.title}</div>
                    {slide.badge && <span style={{ fontSize: 6, fontWeight: 900, padding: '2px 6px', borderRadius: 4, background: `${slide.color}18`, color: slide.color, border: `1px solid ${slide.color}25` }}>{slide.badge}</span>}
                  </div>
                  <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{slide.sub}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
                {heroSlides.map((_, i) => <div key={i} style={{ width: i === slideIdx ? 16 : 5, height: 5, borderRadius: 3, background: i === slideIdx ? slide.color : `${C.text3}30`, transition: 'all 0.3s' }} />)}
              </div>
            </div>
          </div>

          {/* Jackpot banner */}
          <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 12, marginBottom: 8, background: `linear-gradient(135deg, ${C.gold}10, ${C.red}08)`, border: `1px solid ${C.gold}18` }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: C.text3, letterSpacing: 2 }}>DAILY JACKPOT</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.gold, textShadow: `0 0 16px ${C.gold}40` }}>🏆 {JACKPOT.toLocaleString()} coins</div>
            <div style={{ fontSize: 7, color: C.text3 }}>Play any game for a chance to win</div>
          </div>

          {/* Feed bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, marginBottom: 8, background: `${C.gold}06`, border: `1px solid ${C.gold}10` }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.green, animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 9, color: C.text2, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{feedItem}</span>
          </div>

          {/* Stat strip */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {[{ v: 284, l: 'Bets Made', color: C.gold }, { v: '62%', l: 'Win Rate', color: C.green }, { v: '🔥5', l: 'Streak', color: C.orange }, { v: Math.floor(JACKPOT / 1000) + 'K', l: 'Jackpot', color: C.red }].map(s => (
              <div key={s.l} style={{ flex: 1, padding: '6px 0', borderRadius: 8, textAlign: 'center', background: `${s.color}06`, border: `1px solid ${s.color}12` }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: s.color }}>{s.v}</div>
                <div style={{ fontSize: 6, color: C.text3 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Daily bets strip */}
          <div onClick={() => navigate('/oracle/dailypicks')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, cursor: 'pointer', marginBottom: 10, background: `${C.gold}04`, border: `1px solid ${C.gold}12` }}>
            <span style={{ fontSize: 14 }}>📅</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.gold }}>3 DAILY BETS</span>
              <span style={{ fontSize: 8, color: C.text3, marginLeft: 6 }}>🌅 🌤 🌙</span>
            </div>
            <span style={{ fontSize: 8, fontWeight: 700, color: C.green, padding: '2px 8px', borderRadius: 100, background: `${C.green}10`, border: `1px solid ${C.green}20` }}>🔥 5-day · 2x</span>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.gold}18`, marginBottom: 10 }}>
            {FORTUNE_TABS.map(t => (
              <div key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '8px 0', textAlign: 'center', cursor: 'pointer', fontSize: 9, fontWeight: tab === t.id ? 800 : 600, color: tab === t.id ? C.gold : C.text3, borderBottom: tab === t.id ? `2px solid ${C.gold}` : '2px solid transparent' }}>
                <span style={{ marginRight: 2 }}>{t.emoji}</span>{t.label}
              </div>
            ))}
          </div>

          {/* Game grid tabs */}
          {tab !== 'recent' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {tabGames.map((g, i) => (
                <div key={i} onClick={() => launch(g)} style={{ padding: '14px 12px', borderRadius: 14, cursor: 'pointer', textAlign: 'center', position: 'relative', overflow: 'hidden', background: `radial-gradient(ellipse at 50% 0%, ${g.color}10, rgba(255,255,255,0.01) 70%)`, border: `1px solid ${g.color}18`, transition: 'all 0.3s', animation: `fadeIn 0.3s ease ${i * 0.06}s both` }}>
                  <div style={{ fontSize: 28, marginBottom: 4, filter: `drop-shadow(0 0 8px ${g.color}50)` }}>{g.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: g.color }}>{g.name}</div>
                  <div style={{ fontSize: 7, color: C.text3, marginTop: 1 }}>{g.desc}</div>
                  <div style={{ fontSize: 7, fontWeight: 700, color: C.lime, marginTop: 3 }}>PLAY NOW</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.gold, letterSpacing: 1, marginBottom: 8 }}>RECENT ACTIVITY</div>
              {RECENT.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, marginBottom: 4, background: `${r.color}04`, border: `1px solid ${r.color}10` }}>
                  <span style={{ fontSize: 16 }}>{r.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{r.game}</div>
                    <div style={{ fontSize: 8, color: C.text3 }}>{r.result} · {r.time}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: r.color }}>{r.coins}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
