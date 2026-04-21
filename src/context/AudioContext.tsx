import React, { createContext, useContext, useRef, useState } from 'react'

interface AudioContextValue {
  audioOn: boolean
  setAudioOn: (v: boolean) => void
  sharedAudioCtx: React.MutableRefObject<AudioContext | null>
  gameSoundsMuted: React.MutableRefObject<boolean>
  playFx: (type: string, vol?: number) => void
  playAudio: (src: string, vol?: number) => void
}

const AudioCtx = createContext<AudioContextValue>(null!)
export const useAudioContext = () => useContext(AudioCtx)

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [audioOn, setAudioOn] = useState(true)
  const sharedAudioCtx = useRef<AudioContext | null>(null)
  const gameSoundsMuted = useRef(false)

  const getACtx = (): AudioContext | null => {
    if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') return null
    if (!sharedAudioCtx.current || sharedAudioCtx.current.state === 'closed') {
      sharedAudioCtx.current = new (AudioContext || (window as any).webkitAudioContext)()
    }
    if (sharedAudioCtx.current.state === 'suspended') {
      sharedAudioCtx.current.resume().catch(() => {})
    }
    return sharedAudioCtx.current
  }

  const playFx = (type: string, vol = 0.5) => {
    if (!audioOn || gameSoundsMuted.current) return
    try {
      const ac = getACtx()
      if (!ac) return
      const now = ac.currentTime
      const gain = ac.createGain()
      gain.connect(ac.destination)
      gain.gain.setValueAtTime(Math.min(1, vol), now)

      const makeOsc = (freq: number, type2: OscillatorType, duration: number, gainVal?: number) => {
        const osc = ac.createOscillator()
        const g = ac.createGain()
        osc.type = type2
        osc.frequency.setValueAtTime(freq, now)
        g.gain.setValueAtTime(gainVal ?? vol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + duration)
        osc.connect(g)
        g.connect(ac.destination)
        osc.start(now)
        osc.stop(now + duration)
      }

      const makeNoise = (duration: number, gainVal: number, freqLow: number, freqHigh: number) => {
        const bufSize = ac.sampleRate * duration
        const buf = ac.createBuffer(1, bufSize, ac.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
        const src = ac.createBufferSource()
        src.buffer = buf
        const filter = ac.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.setValueAtTime((freqLow + freqHigh) / 2, now)
        filter.Q.setValueAtTime(1.0, now)
        const g = ac.createGain()
        g.gain.setValueAtTime(gainVal, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + duration)
        src.connect(filter)
        filter.connect(g)
        g.connect(ac.destination)
        src.start(now)
      }

      switch (type) {
        case 'puff_start':
          makeNoise(0.15, vol * 0.7, 200, 800)
          makeOsc(220, 'sine', 0.1, vol * 0.3)
          break
        case 'puff_end':
          makeNoise(0.1, vol * 0.5, 150, 600)
          break
        case 'blinker':
          makeNoise(0.25, vol * 0.8, 100, 500)
          makeOsc(180, 'sine', 0.2, vol * 0.4)
          makeOsc(280, 'sine', 0.15, vol * 0.3)
          break
        case 'click':
          makeOsc(800, 'square', 0.05, vol * 0.3)
          break
        case 'success':
          makeOsc(523, 'sine', 0.15, vol * 0.6)
          setTimeout(() => { try { makeOsc(659, 'sine', 0.15, vol * 0.6) } catch(e) {} }, 100)
          setTimeout(() => { try { makeOsc(784, 'sine', 0.2, vol * 0.6) } catch(e) {} }, 200)
          break
        case 'win':
          makeOsc(523, 'sine', 0.1); makeOsc(659, 'sine', 0.1); makeOsc(784, 'sine', 0.1)
          setTimeout(() => { try { makeOsc(1047, 'sine', 0.4, vol * 0.8) } catch(e) {} }, 150)
          setTimeout(() => { try { makeNoise(0.4, vol * 0.3, 300, 1200) } catch(e) {} }, 200)
          break
        case 'lose':
          makeOsc(400, 'sawtooth', 0.2, vol * 0.5)
          setTimeout(() => { try { makeOsc(300, 'sawtooth', 0.3, vol * 0.5) } catch(e) {} }, 150)
          setTimeout(() => { try { makeOsc(200, 'sawtooth', 0.3, vol * 0.4) } catch(e) {} }, 300)
          break
        case 'error':
          makeOsc(200, 'sawtooth', 0.2, vol * 0.6)
          setTimeout(() => { try { makeOsc(150, 'sawtooth', 0.2, vol * 0.5) } catch(e) {} }, 100)
          break
        case 'coin_collect':
          makeOsc(1047, 'sine', 0.1, vol * 0.7)
          setTimeout(() => { try { makeOsc(1319, 'sine', 0.1, vol * 0.7) } catch(e) {} }, 80)
          setTimeout(() => { try { makeOsc(1568, 'sine', 0.15, vol * 0.7) } catch(e) {} }, 160)
          break
        case 'achievement':
          for (let i = 0; i < 5; i++) {
            setTimeout(() => { try { makeOsc(523 + i * 150, 'sine', 0.2, vol * 0.6) } catch(e) {} }, i * 80)
          }
          setTimeout(() => { try { makeNoise(0.5, vol * 0.2, 400, 1600) } catch(e) {} }, 400)
          break
        case 'level_up':
          [523, 659, 784, 1047].forEach((f, i) => {
            setTimeout(() => { try { makeOsc(f, 'sine', 0.25, vol * 0.7) } catch(e) {} }, i * 100)
          })
          setTimeout(() => { try { makeNoise(0.6, vol * 0.3, 300, 1500) } catch(e) {} }, 400)
          break
        case 'crowd':
          makeNoise(1.0, vol * 0.4, 200, 800)
          setTimeout(() => { try { makeNoise(0.8, vol * 0.3, 400, 1200) } catch(e) {} }, 200)
          break
        case 'crowd_chant': {
          const freqs = [300, 350, 400, 350, 300]
          freqs.forEach((f, i) => {
            setTimeout(() => { try { makeOsc(f, 'triangle', 0.2, vol * 0.4) } catch(e) {} }, i * 150)
          })
          break
        }
        case 'horn':
          makeOsc(150, 'sawtooth', 0.8, vol * 0.8)
          makeOsc(180, 'sawtooth', 0.8, vol * 0.6)
          break
        case 'whistle':
          makeOsc(2000, 'sine', 0.3, vol * 0.8)
          makeOsc(2200, 'sine', 0.2, vol * 0.5)
          break
        case 'kick':
          makeNoise(0.05, vol * 0.9, 60, 200)
          makeOsc(80, 'sine', 0.15, vol * 0.8)
          break
        case 'save':
          makeNoise(0.08, vol * 0.8, 100, 400)
          makeOsc(120, 'square', 0.1, vol * 0.6)
          break
        case 'goal':
          makeNoise(0.6, vol * 0.6, 400, 1600)
          ;[523, 698, 880, 1047].forEach((f, i) => {
            setTimeout(() => { try { makeOsc(f, 'sine', 0.3, vol * 0.7) } catch(e) {} }, i * 80)
          })
          setTimeout(() => { try { makeNoise(1.0, vol * 0.5, 600, 2000) } catch(e) {} }, 320)
          break
        case 'post':
          makeOsc(250, 'square', 0.3, vol * 0.8)
          setTimeout(() => { try { makeNoise(0.4, vol * 0.5, 200, 800) } catch(e) {} }, 100)
          break
        case 'countdown': {
          const pitch = vol > 0.5 ? 440 : 330
          makeOsc(pitch, 'sine', 0.15, vol * 0.7)
          break
        }
        case 'shot_power':
          makeNoise(0.12, vol * 0.5, 80, 300)
          makeOsc(100, 'sine', 0.1, vol * 0.4)
          break
        case 'pong_hit':
          makeOsc(600, 'square', 0.05, vol * 0.5)
          break
        case 'pong_bounce':
          makeOsc(300, 'square', 0.04, vol * 0.4)
          break
        case 'pong_score':
          [400, 600, 800].forEach((f, i) => {
            setTimeout(() => { try { makeOsc(f, 'sine', 0.15, vol * 0.6) } catch(e) {} }, i * 80)
          })
          break
        case 'balloon_pop':
          makeNoise(0.08, vol * 0.9, 400, 2000)
          makeOsc(200, 'square', 0.06, vol * 0.7)
          break
        case 'tension':
          makeOsc(220, 'sawtooth', 0.3, vol * 0.3)
          makeOsc(221, 'sawtooth', 0.3, vol * 0.3)
          break
        case 'gunshot':
          makeNoise(0.15, vol * 0.9, 300, 3000)
          makeOsc(150, 'square', 0.1, vol * 0.7)
          break
        case 'gun_cock':
          makeOsc(400, 'square', 0.08, vol * 0.6)
          setTimeout(() => { try { makeOsc(600, 'square', 0.05, vol * 0.4) } catch(e) {} }, 60)
          break
        case 'rps_reveal':
          makeOsc(880, 'sine', 0.1, vol * 0.5)
          setTimeout(() => { try { makeOsc(1108, 'sine', 0.15, vol * 0.6) } catch(e) {} }, 80)
          break
        case 'beat_kick':
          makeNoise(0.06, vol * 0.9, 60, 200)
          makeOsc(80, 'sine', 0.1, vol * 0.8)
          break
        case 'beat_snare':
          makeNoise(0.06, vol * 0.8, 300, 1200)
          makeOsc(220, 'square', 0.04, vol * 0.5)
          break
        case 'beat_hihat':
          makeNoise(0.04, vol * 0.5, 2000, 8000)
          break
        case 'perfect':
          [880, 1047, 1319, 1568].forEach((f, i) => {
            setTimeout(() => { try { makeOsc(f, 'sine', 0.2, vol * 0.7) } catch(e) {} }, i * 60)
          })
          break
        case 'miss':
          makeOsc(300, 'sawtooth', 0.15, vol * 0.4)
          setTimeout(() => { try { makeOsc(250, 'sawtooth', 0.2, vol * 0.4) } catch(e) {} }, 100)
          break
        case 'tick_tock':
          makeOsc(800, 'square', 0.05, vol * 0.4)
          break
        case 'fish_splash':
          makeNoise(0.08, vol * 0.6, 200, 1000)
          makeOsc(440, 'sine', 0.06, vol * 0.3)
          break
        case 'explosion':
          makeNoise(0.3, vol * 0.9, 100, 500)
          makeOsc(120, 'sawtooth', 0.25, vol * 0.8)
          break
        case 'powerup':
          [330, 440, 550, 660].forEach((f, i) => {
            setTimeout(() => { try { makeOsc(f, 'sine', 0.15, vol * 0.6) } catch(e) {} }, i * 70)
          })
          break
        case 'lucky_hour':
          [523, 659, 784, 1047, 1319].forEach((f, i) => {
            setTimeout(() => { try { makeOsc(f, 'sine', 0.2, vol * 0.6) } catch(e) {} }, i * 80)
          })
          break
        case 'streak_fire':
          [300, 400, 500].forEach((f, i) => {
            setTimeout(() => { try { makeOsc(f, 'sawtooth', 0.15, vol * 0.5) } catch(e) {} }, i * 60)
          })
          makeNoise(0.3, vol * 0.4, 200, 800)
          break
        case 'tug_pull':
          makeNoise(0.08, vol * 0.6, 150, 500)
          makeOsc(160, 'sawtooth', 0.06, vol * 0.4)
          break
        case 'derby_boost':
          makeNoise(0.1, vol * 0.5, 200, 800)
          makeOsc(300, 'sine', 0.08, vol * 0.4)
          break
        case 'spin':
          makeNoise(0.15, vol * 0.4, 300, 1200)
          break
        case 'scratch':
          makeNoise(0.1, vol * 0.6, 800, 3000)
          break
        case 'reveal':
          makeOsc(660, 'sine', 0.1, vol * 0.6)
          setTimeout(() => { try { makeOsc(880, 'sine', 0.15, vol * 0.7) } catch(e) {} }, 100)
          break
        case 'slot_spin':
          makeNoise(0.08, vol * 0.4, 400, 1600)
          break
        case 'slot_stop':
          makeOsc(440, 'square', 0.06, vol * 0.5)
          break
        case 'jackpot':
          for (let i = 0; i < 8; i++) {
            setTimeout(() => { try { makeOsc(440 + i * 80, 'sine', 0.15, vol * 0.6) } catch(e) {} }, i * 60)
          }
          setTimeout(() => { try { makeNoise(1.0, vol * 0.5, 600, 2000) } catch(e) {} }, 500)
          break
        case 'card_flip':
          makeOsc(700, 'square', 0.04, vol * 0.4)
          break
        case 'card_deal':
          makeOsc(500, 'square', 0.03, vol * 0.35)
          break
        case 'dice_roll':
          makeNoise(0.12, vol * 0.6, 300, 1200)
          break
        case 'crystal':
          makeOsc(880, 'sine', 0.3, vol * 0.5)
          makeOsc(1760, 'sine', 0.3, vol * 0.3)
          break
        case 'mystical':
          [220, 330, 440, 550].forEach((f, i) => {
            setTimeout(() => { try { makeOsc(f, 'sine', 0.4, vol * 0.4) } catch(e) {} }, i * 120)
          })
          break
        default:
          makeOsc(440, 'sine', 0.1, vol * 0.3)
      }
    } catch (e) {}
  }

  const playAudio = (src: string, vol = 0.5) => {
    if (!audioOn) return
    try {
      const a = new Audio(src)
      a.volume = vol
      a.play().catch(() => {})
    } catch (e) {}
  }

  return (
    <AudioCtx.Provider value={{ audioOn, setAudioOn, sharedAudioCtx, gameSoundsMuted, playFx, playAudio }}>
      {children}
    </AudioCtx.Provider>
  )
}
