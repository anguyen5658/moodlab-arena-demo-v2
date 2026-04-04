import { useState, useRef, useCallback } from 'react'

export function useAudio() {
  const [audioOn, setAudioOn] = useState(true)
  const sharedAudioCtx = useRef<AudioContext | null>(null)

  const playAudio = useCallback((src: string, vol = 0.5) => {
    if (!audioOn) return
    try {
      const a = new Audio(src)
      a.volume = vol
      a.play().catch(() => {})
    } catch (e) {}
  }, [audioOn])

  const playFx = useCallback((type: string, vol = 1.0) => {
    if (!audioOn) return

    const audioFiles: Record<string, { src: string; vol: number }> = {
      win:   { src: 'assets/arena/win.m4a',   vol: 0.7 },
      lose:  { src: 'assets/arena/lose.m4a',  vol: 0.6 },
      laugh: { src: 'assets/arena/laugh.m4a', vol: 0.6 },
    }

    if (audioFiles[type]) {
      try {
        const a = new Audio(audioFiles[type].src)
        a.volume = audioFiles[type].vol * vol
        a.play().catch(() => {})
      } catch (e) {}
      return
    }

    try {
      if (!sharedAudioCtx.current || sharedAudioCtx.current.state === 'closed') {
        sharedAudioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ac = sharedAudioCtx.current
      const now = ac.currentTime

      const tone = (freq: number, waveType: OscillatorType, start: number, dur: number, v = 0.15, freqEnd: number | null = null) => {
        const osc = ac.createOscillator()
        const gain = ac.createGain()
        osc.type = waveType
        osc.frequency.setValueAtTime(freq, now + start)
        if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, now + start + dur)
        gain.gain.setValueAtTime(v * vol, now + start)
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur)
        osc.connect(gain)
        gain.connect(ac.destination)
        osc.start(now + start)
        osc.stop(now + start + dur)
      }

      const noise = (start: number, dur: number, v = 0.08) => {
        const buf = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1)
        const src = ac.createBufferSource()
        const gain = ac.createGain()
        src.buffer = buf
        gain.gain.setValueAtTime(v * vol, now + start)
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur)
        src.connect(gain)
        gain.connect(ac.destination)
        src.start(now + start)
        src.stop(now + start + dur)
      }

      switch (type) {
        case 'tap': case 'button_tap':
          tone(800, 'sine', 0, 0.06, 0.08); tone(1200, 'sine', 0.02, 0.04, 0.05); break
        case 'select':
          tone(600, 'sine', 0, 0.05, 0.1); tone(900, 'sine', 0.05, 0.07, 0.08); break
        case 'nav':
          tone(440, 'sine', 0, 0.08, 0.06, 660); break
        case 'back': case 'button_back':
          tone(600, 'sine', 0, 0.08, 0.06, 300); break
        case 'coin_collect': case 'coins': case 'coin':
          tone(1200, 'sine', 0, 0.08, 0.1); tone(1600, 'sine', 0.06, 0.08, 0.1); tone(2000, 'sine', 0.12, 0.12, 0.08); break
        case 'level_up': case 'rank_up':
          tone(523, 'sine', 0, 0.12, 0.1); tone(659, 'sine', 0.1, 0.12, 0.1); tone(784, 'sine', 0.2, 0.12, 0.1); tone(1047, 'sine', 0.3, 0.2, 0.12); break
        case 'notification': case 'ping':
          tone(880, 'sine', 0, 0.1, 0.08); tone(1100, 'sine', 0.08, 0.15, 0.06); break
        case 'error': case 'wrong': case 'wrong_buzzer':
          tone(200, 'sawtooth', 0, 0.15, 0.1); tone(150, 'sawtooth', 0.1, 0.2, 0.08); break
        case 'countdown_tick': case 'tick':
          tone(800, 'sine', 0, 0.04, 0.1); break
        case 'countdown_go': case 'go':
          tone(1200, 'sine', 0, 0.05, 0.15); tone(1600, 'sine', 0.03, 0.08, 0.12); tone(2000, 'sine', 0.08, 0.15, 0.1); break
        case 'success': case 'correct':
          tone(880, 'sine', 0, 0.1, 0.12); tone(1320, 'sine', 0.08, 0.15, 0.1); tone(1760, 'sine', 0.16, 0.2, 0.08); break
        case 'perfect': case 'sweet_spot':
          tone(880, 'sine', 0, 0.08, 0.1); tone(1320, 'sine', 0.06, 0.1, 0.1); tone(1760, 'sine', 0.1, 0.12, 0.1); tone(2200, 'sine', 0.15, 0.2, 0.12); break
        case 'blinker':
          tone(200, 'sawtooth', 0, 0.05, 0.15); tone(150, 'square', 0.03, 0.08, 0.2); noise(0, 0.15, 0.12); tone(100, 'sawtooth', 0.1, 0.1, 0.1); break
        case 'puff_start': case 'charge_start':
          tone(200, 'sine', 0, 0.05, 0.06, 300); break
        case 'puff_end': case 'charge_end':
          tone(400, 'sine', 0, 0.08, 0.08, 200); break
        case 'match_start': case 'whistle':
          tone(1568, 'sine', 0, 0.08, 0.2); tone(1568, 'sine', 0.12, 0.06, 0.15); tone(1568, 'sine', 0.22, 0.1, 0.2); break
        case 'goal': case 'goal_scored':
          tone(523, 'sine', 0, 0.08, 0.15); tone(659, 'sine', 0.06, 0.08, 0.15); tone(784, 'sine', 0.12, 0.08, 0.15); tone(1047, 'sine', 0.18, 0.15, 0.2); tone(1319, 'sine', 0.28, 0.25, 0.2); break
        case 'save': case 'blocked':
          tone(300, 'square', 0, 0.06, 0.12); noise(0, 0.1, 0.08); tone(250, 'sawtooth', 0.05, 0.08, 0.1); break
        case 'gunshot': case 'draw':
          noise(0, 0.06, 0.3); tone(120, 'sawtooth', 0, 0.12, 0.2, 60); break
        case 'crowd': case 'cheer':
          for (let i = 0; i < 8; i++) noise(i * 0.02, 0.15, 0.04 + Math.random() * 0.04); break
        case 'countdown': case 'countdown_3':
          tone(440, 'sine', 0, 0.1, 0.12); break
        case 'streak_fire':
          tone(800, 'sine', 0, 0.05, 0.1); tone(1000, 'sine', 0.04, 0.05, 0.1); tone(1200, 'sine', 0.08, 0.06, 0.1); tone(1400, 'sine', 0.12, 0.08, 0.12); noise(0, 0.2, 0.06); break
        case 'achievement':
          tone(523, 'sine', 0, 0.08, 0.1); tone(659, 'sine', 0.06, 0.08, 0.1); tone(784, 'sine', 0.12, 0.08, 0.1); tone(1047, 'sine', 0.18, 0.1, 0.12); tone(1319, 'sine', 0.25, 0.12, 0.12); tone(1568, 'sine', 0.32, 0.2, 0.15); break
        case 'pop': case 'balloon_pop':
          noise(0, 0.04, 0.25); tone(800, 'sine', 0, 0.03, 0.15, 200); break
        case 'splash': case 'fish_catch':
          noise(0, 0.12, 0.15); tone(300, 'sine', 0, 0.1, 0.1, 150); break
        case 'reel': case 'reel_click':
          tone(600, 'square', 0, 0.02, 0.08); break
        case 'tension_high':
          tone(100, 'sawtooth', 0, 0.1, 0.15, 80); noise(0, 0.1, 0.05); break
        case 'slot_spin':
          tone(400, 'square', 0, 0.04, 0.06); tone(500, 'square', 0.03, 0.04, 0.05); tone(600, 'square', 0.06, 0.04, 0.05); break
        case 'slot_win': case 'jackpot':
          tone(523, 'sine', 0, 0.1, 0.12); tone(659, 'sine', 0.08, 0.1, 0.12); tone(784, 'sine', 0.15, 0.1, 0.12); tone(1047, 'sine', 0.22, 0.15, 0.15); tone(1319, 'sine', 0.3, 0.2, 0.15); tone(1568, 'sine', 0.38, 0.3, 0.18); break
        case 'card_flip':
          noise(0, 0.05, 0.1); tone(800, 'sine', 0, 0.04, 0.08, 400); break
        case 'dice_roll':
          noise(0, 0.08, 0.15); tone(300, 'square', 0.04, 0.05, 0.1); break
        case 'scratch':
          noise(0, 0.06, 0.12); tone(500, 'sawtooth', 0, 0.06, 0.06, 300); break
        case 'mystery_reveal':
          tone(400, 'sine', 0, 0.1, 0.1, 800); tone(600, 'sine', 0.08, 0.1, 0.1, 1200); tone(800, 'sine', 0.16, 0.15, 0.12, 1600); break
        case 'rhythm_hit': case 'note_hit':
          tone(880, 'sine', 0, 0.06, 0.12); tone(1100, 'sine', 0.02, 0.06, 0.1); break
        case 'rhythm_miss': case 'note_miss':
          tone(200, 'sawtooth', 0, 0.08, 0.1); noise(0, 0.06, 0.06); break
        case 'beat_drop':
          tone(60, 'sine', 0, 0.3, 0.3); noise(0, 0.1, 0.2); tone(80, 'sawtooth', 0.05, 0.2, 0.15); break
        case 'horse_gallop':
          noise(0, 0.04, 0.12); tone(200, 'square', 0.02, 0.03, 0.08); break
        case 'auction_bid':
          tone(800, 'sine', 0, 0.06, 0.1); tone(1000, 'sine', 0.04, 0.08, 0.08); break
        case 'auction_win':
          tone(1047, 'sine', 0, 0.12, 0.15); tone(1319, 'sine', 0.1, 0.12, 0.15); tone(1568, 'sine', 0.2, 0.2, 0.18); break
        default:
          tone(440, 'sine', 0, 0.08, 0.08); break
      }
    } catch (e) {}
  }, [audioOn])

  return { audioOn, setAudioOn, playFx, playAudio }
}
