import { useRef, useCallback } from 'react';

/**
 * useAudio — centralised sound system
 *
 * Exposes:
 *   playFx(type, vol?)    — synthesized sounds via Web Audio API + 3 real audio files
 *   playAudio(src, vol?)  — play any audio file by URL
 *
 * Call this hook once inside AppContext. Pass `audioOn` as a parameter so the
 * context decides when audio is enabled.
 */
export function useAudio(audioOn) {
  const sharedAudioCtx = useRef(null);
  const gameSoundsMuted = useRef(false);

  const playAudio = useCallback((src, vol = 0.5) => {
    if (!audioOn) return;
    try {
      const a = new Audio(src);
      a.volume = vol;
      a.play().catch(() => {});
    } catch (e) {}
  }, [audioOn]);

  const playFx = useCallback((type, vol = 1.0) => {
    if (!audioOn || gameSoundsMuted.current) return;

    // Real audio files for key moments
    const audioFiles = {
      win:   { src: '/assets/arena/win.m4a',   vol: 0.7 },
      lose:  { src: '/assets/arena/lose.m4a',  vol: 0.6 },
      laugh: { src: '/assets/arena/laugh.m4a', vol: 0.6 },
    };
    if (audioFiles[type]) {
      try {
        const a = new Audio(audioFiles[type].src);
        a.volume = audioFiles[type].vol * vol;
        a.play().catch(() => {});
      } catch (e) {}
      return;
    }

    // Web Audio API synthesized sounds
    try {
      if (!sharedAudioCtx.current || sharedAudioCtx.current.state === 'closed') {
        sharedAudioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ac = sharedAudioCtx.current;
      const now = ac.currentTime;

      const tone = (freq, waveType, start, dur, v = 0.15, freqEnd = null) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = waveType;
        osc.frequency.setValueAtTime(freq, now + start);
        if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, now + start + dur);
        gain.gain.setValueAtTime(v * vol, now + start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now + start);
        osc.stop(now + start + dur);
      };

      const noise = (start, dur, v = 0.08) => {
        const buf = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
        const src = ac.createBufferSource();
        const gain = ac.createGain();
        src.buffer = buf;
        gain.gain.setValueAtTime(v * vol, now + start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        src.connect(gain);
        gain.connect(ac.destination);
        src.start(now + start);
        src.stop(now + start + dur);
      };

      switch (type) {
        // Universal UI
        case 'tap': case 'button_tap':
          tone(800, 'sine', 0, 0.06, 0.08); tone(1200, 'sine', 0.02, 0.04, 0.05); break;
        case 'select':
          tone(600, 'sine', 0, 0.05, 0.1); tone(900, 'sine', 0.05, 0.07, 0.08); break;
        case 'nav':
          tone(440, 'sine', 0, 0.08, 0.06, 660); break;
        case 'back': case 'button_back':
          tone(600, 'sine', 0, 0.08, 0.06, 300); break;
        case 'coin_collect': case 'coins':
          tone(1200, 'sine', 0, 0.08, 0.1); tone(1600, 'sine', 0.06, 0.08, 0.1); tone(2000, 'sine', 0.12, 0.12, 0.08); break;
        case 'level_up': case 'rank_up':
          tone(523, 'sine', 0, 0.12, 0.1); tone(659, 'sine', 0.1, 0.12, 0.1); tone(784, 'sine', 0.2, 0.12, 0.1); tone(1047, 'sine', 0.3, 0.2, 0.12); break;
        case 'notification': case 'ping':
          tone(880, 'sine', 0, 0.1, 0.08); tone(1100, 'sine', 0.08, 0.15, 0.06); break;
        case 'error': case 'wrong': case 'wrong_buzzer':
          tone(200, 'sawtooth', 0, 0.15, 0.1); tone(150, 'sawtooth', 0.1, 0.2, 0.08); break;
        case 'countdown_tick': case 'tick':
          tone(800, 'sine', 0, 0.04, 0.1); break;
        case 'countdown_go': case 'go':
          tone(600, 'sine', 0, 0.1, 0.12); tone(900, 'sine', 0.08, 0.15, 0.12); tone(1200, 'sine', 0.16, 0.2, 0.15); noise(0, 0.3, 0.05); break;
        case 'streak_fire':
          tone(400, 'sawtooth', 0, 0.05, 0.06); tone(600, 'sawtooth', 0.04, 0.05, 0.08); tone(900, 'sawtooth', 0.08, 0.1, 0.1); break;
        case 'blinker': case 'blinker_alert':
          tone(300, 'square', 0, 0.1, 0.1); tone(300, 'square', 0.15, 0.1, 0.1); tone(300, 'square', 0.3, 0.1, 0.1); break;
        case 'success':
          tone(523, 'sine', 0, 0.1, 0.1); tone(784, 'sine', 0.08, 0.15, 0.1); break;
        case 'puff':
          tone(80, 'sawtooth', 0, 0.15, 0.12); noise(0, 0.15, 0.06); break;
        case 'miss':
          tone(300, 'sawtooth', 0, 0.1, 0.08, 150); tone(150, 'sawtooth', 0.08, 0.15, 0.06); break;
        // Football / Kick
        case 'kick':
          tone(150, 'triangle', 0, 0.15, 0.12, 80); noise(0, 0.06, 0.06); break;
        case 'goal':
          tone(523, 'square', 0, 0.12, 0.15); tone(659, 'square', 0.1, 0.12, 0.15); tone(784, 'square', 0.2, 0.15, 0.12); break;
        case 'save':
          tone(400, 'triangle', 0, 0.1, 0.08); tone(600, 'triangle', 0.05, 0.1, 0.06); break;
        case 'whistle':
          tone(2800, 'sine', 0, 0.15, 0.1); tone(3200, 'sine', 0.1, 0.15, 0.08, 2800); break;
        case 'charge':
          tone(200, 'sine', 0, 1.5, 0.08, 1200); break;
        case 'crowd': case 'crowd_cheer':
          noise(0, 0.6, 0.1); tone(300, 'sawtooth', 0, 0.5, 0.03, 500); break;
        // Wild West
        case 'gunshot':
          noise(0, 0.15, 0.2); tone(100, 'sawtooth', 0, 0.08, 0.15, 40); break;
        case 'gun_click':
          tone(2000, 'sine', 0, 0.02, 0.1); tone(800, 'sine', 0.015, 0.03, 0.06); break;
        case 'gun_bang':
          noise(0, 0.3, 0.25); tone(80, 'sawtooth', 0, 0.15, 0.2, 30); tone(200, 'square', 0, 0.05, 0.15); break;
        case 'revolver_spin':
          for (let i = 0; i < 8; i++) tone(1500 + i * 100, 'sine', i * 0.04, 0.03, 0.04); break;
        // Balloon Pop
        case 'balloon_inflate':
          tone(200, 'sine', 0, 0.15, 0.06, 400); break;
        case 'balloon_pop':
          noise(0, 0.2, 0.3); tone(2000, 'sine', 0, 0.03, 0.15); tone(100, 'sawtooth', 0, 0.1, 0.1, 40); break;
        // Puff Pong
        case 'pong_hit':
          tone(500, 'square', 0, 0.05, 0.1); break;
        case 'pong_wall':
          tone(300, 'square', 0, 0.04, 0.06); break;
        case 'pong_score':
          tone(800, 'sine', 0, 0.08, 0.1); tone(1000, 'sine', 0.06, 0.1, 0.08); break;
        // Rhythm Puff
        case 'rhythm_hit':
          tone(700, 'sine', 0, 0.06, 0.08); tone(1000, 'sine', 0.03, 0.06, 0.06); break;
        case 'rhythm_miss':
          tone(200, 'sawtooth', 0, 0.1, 0.06); break;
        case 'rhythm_perfect':
          tone(1000, 'sine', 0, 0.06, 0.1); tone(1500, 'sine', 0.04, 0.06, 0.1); tone(2000, 'sine', 0.08, 0.1, 0.08); break;
        // Tug of War
        case 'rope_pull':
          tone(150, 'sawtooth', 0, 0.08, 0.06); noise(0, 0.06, 0.04); break;
        case 'rope_snap':
          noise(0, 0.1, 0.15); tone(400, 'sawtooth', 0, 0.05, 0.1); break;
        case 'mud_splash':
          noise(0, 0.3, 0.12); tone(100, 'sine', 0, 0.2, 0.06, 50); break;
        // Hot Potato
        case 'bomb_tick':
          tone(1200, 'sine', 0, 0.03, 0.08); break;
        case 'bomb_pass':
          tone(500, 'sine', 0, 0.06, 0.06, 800); break;
        case 'bomb_explode': case 'explosion':
          noise(0, 0.4, 0.3); tone(60, 'sawtooth', 0, 0.3, 0.2, 20); tone(150, 'square', 0, 0.1, 0.15); break;
        // Puff RPS
        case 'punch_clash': case 'clash':
          noise(0, 0.12, 0.15); tone(200, 'sawtooth', 0, 0.08, 0.1); tone(400, 'square', 0.03, 0.06, 0.08); break;
        // Hooked Fishing
        case 'fishing_cast':
          tone(400, 'sine', 0, 0.15, 0.06, 800); noise(0.1, 0.1, 0.03); break;
        case 'fishing_reel':
          for (let i = 0; i < 5; i++) tone(600 + i * 50, 'sine', i * 0.05, 0.04, 0.04); break;
        case 'fishing_bite':
          tone(800, 'sine', 0, 0.05, 0.1); tone(1000, 'sine', 0.04, 0.05, 0.1); break;
        case 'fishing_catch':
          tone(600, 'sine', 0, 0.1, 0.1); tone(800, 'sine', 0.08, 0.1, 0.1); tone(1200, 'sine', 0.16, 0.15, 0.08); noise(0, 0.2, 0.04); break;
        case 'fishing_snap': case 'line_break':
          tone(400, 'sawtooth', 0, 0.05, 0.1, 100); noise(0, 0.1, 0.08); break;
        // Beat Drop
        case 'beat_buildup':
          tone(200, 'sine', 0, 0.5, 0.04, 800); break;
        case 'beat_drop':
          tone(80, 'sawtooth', 0, 0.3, 0.2); noise(0, 0.15, 0.1); tone(60, 'square', 0.05, 0.2, 0.15); break;
        // Puff Clock
        case 'clock_tick_precise':
          tone(1000, 'sine', 0, 0.02, 0.06); break;
        // Puff Derby
        case 'horse_gallop':
          tone(200, 'sine', 0, 0.04, 0.05); tone(250, 'sine', 0.06, 0.04, 0.05); break;
        case 'horse_whinny':
          tone(600, 'sine', 0, 0.15, 0.08, 1200); tone(1200, 'sine', 0.1, 0.15, 0.06, 600); break;
        // Puff Limbo
        case 'limbo_bar_raise':
          tone(300, 'sine', 0, 0.15, 0.06, 500); break;
        // Stage Shows
        case 'show_intro': case 'fanfare':
          tone(523, 'sine', 0, 0.12, 0.08); tone(659, 'sine', 0.1, 0.12, 0.08); tone(784, 'sine', 0.2, 0.12, 0.08); tone(1047, 'sine', 0.3, 0.2, 0.1); noise(0, 0.4, 0.03); break;
        case 'correct_ding': case 'correct':
          tone(880, 'sine', 0, 0.08, 0.1); tone(1320, 'sine', 0.06, 0.12, 0.08); break;
        case 'eliminated':
          tone(400, 'sawtooth', 0, 0.1, 0.08, 200); tone(200, 'sawtooth', 0.08, 0.15, 0.06, 100); break;
        case 'timer_urgent':
          tone(1000, 'square', 0, 0.05, 0.08); tone(1000, 'square', 0.1, 0.05, 0.08); tone(1200, 'square', 0.2, 0.08, 0.1); break;
        case 'pattern_tone_1': tone(440, 'sine', 0, 0.2, 0.1); break;
        case 'pattern_tone_2': tone(660, 'sine', 0, 0.2, 0.1); break;
        case 'pattern_tone_3': tone(880, 'sine', 0, 0.2, 0.1); break;
        case 'auction_gavel':
          tone(300, 'square', 0, 0.06, 0.12); tone(200, 'square', 0.04, 0.08, 0.08); noise(0, 0.08, 0.06); break;
        case 'auction_bid':
          tone(600, 'sine', 0, 0.06, 0.06, 900); break;
        case 'disqualified':
          tone(200, 'square', 0, 0.15, 0.12); tone(150, 'square', 0.12, 0.2, 0.1); noise(0, 0.3, 0.06); break;
        case 'reveal_drumroll':
          for (let i = 0; i < 12; i++) noise(i * 0.04, 0.04, 0.03 + i * 0.005); break;
        case 'streak_break':
          tone(500, 'sine', 0, 0.1, 0.08, 200); tone(200, 'sawtooth', 0.08, 0.15, 0.06); break;
        // Fortune — Slots
        case 'slot_spin': case 'spin':
          for (let i = 0; i < 10; i++) tone(800 + Math.random() * 400, 'sine', i * 0.03, 0.025, 0.04); break;
        case 'slot_stop':
          tone(600, 'sine', 0, 0.06, 0.08); tone(400, 'sine', 0.04, 0.08, 0.06); break;
        case 'slot_jackpot': case 'jackpot':
          for (let i = 0; i < 6; i++) tone(523 + i * 100, 'sine', i * 0.08, 0.12, 0.1); noise(0, 0.5, 0.05); break;
        // Fortune — Cards
        case 'card_deal': case 'card_flip':
          noise(0, 0.05, 0.06); tone(2000, 'sine', 0, 0.02, 0.04); break;
        case 'blackjack':
          tone(800, 'sine', 0, 0.1, 0.1); tone(1000, 'sine', 0.08, 0.1, 0.1); tone(1200, 'sine', 0.16, 0.15, 0.12); break;
        // Fortune — Coin Flip
        case 'coin_flip':
          for (let i = 0; i < 8; i++) tone(1500, 'sine', i * 0.06, 0.03, 0.05 - i * 0.005); break;
        case 'coin_land':
          tone(2000, 'sine', 0, 0.04, 0.08); tone(1500, 'sine', 0.03, 0.06, 0.06); noise(0, 0.05, 0.04); break;
        // Fortune — Dice
        case 'dice_shake':
          for (let i = 0; i < 6; i++) noise(i * 0.05, 0.04, 0.05); break;
        case 'dice_roll':
          noise(0, 0.15, 0.08); tone(300, 'sine', 0.1, 0.05, 0.05); tone(500, 'sine', 0.13, 0.04, 0.04); break;
        // Fortune — Mystery
        case 'box_open':
          tone(400, 'sine', 0, 0.1, 0.06, 1200); noise(0.05, 0.1, 0.04); tone(1200, 'sine', 0.1, 0.15, 0.08); break;
        case 'scratch':
          noise(0, 0.12, 0.08); break;
        case 'cookie_crack':
          noise(0, 0.06, 0.1); tone(800, 'sine', 0.03, 0.04, 0.06); tone(1200, 'sine', 0.05, 0.06, 0.04); break;
        case 'treasure_find':
          tone(800, 'sine', 0, 0.08, 0.1); tone(1000, 'sine', 0.06, 0.08, 0.1); tone(1200, 'sine', 0.12, 0.08, 0.1); tone(1600, 'sine', 0.18, 0.15, 0.08); break;
        case 'bomb_hit':
          tone(200, 'square', 0, 0.1, 0.1); noise(0, 0.15, 0.1); break;
        // Fortune — Wheel
        case 'wheel_spin':
          for (let i = 0; i < 15; i++) tone(600 + i * 30, 'sine', i * 0.04, 0.03, 0.04 - i * 0.002); break;
        case 'wheel_tick':
          tone(1500, 'sine', 0, 0.015, 0.06); break;
        case 'wheel_stop':
          tone(800, 'sine', 0, 0.08, 0.08); tone(600, 'sine', 0.06, 0.1, 0.06); break;
        case 'jackpot_alarm':
          for (let i = 0; i < 4; i++) { tone(800, 'square', i * 0.15, 0.1, 0.08); tone(1200, 'square', i * 0.15 + 0.05, 0.1, 0.08); } break;
        // Social / Atmosphere
        case 'crowd_ooh':
          tone(400, 'sine', 0, 0.3, 0.05, 300); noise(0, 0.3, 0.04); break;
        case 'crowd_gasp':
          noise(0, 0.2, 0.06); tone(600, 'sine', 0, 0.15, 0.04, 400); break;
        case 'puff_wave':
          tone(200, 'sine', 0, 0.4, 0.06, 800); noise(0, 0.5, 0.04); break;
        case 'achievement':
          tone(523, 'sine', 0, 0.1, 0.08); tone(659, 'sine', 0.08, 0.1, 0.08); tone(784, 'sine', 0.16, 0.1, 0.08); tone(1047, 'sine', 0.24, 0.2, 0.1); break;
        case 'daily_streak':
          tone(700, 'sine', 0, 0.08, 0.06); tone(900, 'sine', 0.06, 0.08, 0.06); tone(1100, 'sine', 0.12, 0.1, 0.08); break;
        case 'lucky_hour':
          for (let i = 0; i < 3; i++) tone(600 + i * 200, 'sine', i * 0.12, 0.1, 0.08); noise(0, 0.3, 0.03); break;
        case 'chat_message':
          tone(1200, 'sine', 0, 0.04, 0.04); break;
        // World Cup
        case 'stadium_roar':
          noise(0, 1.5, 0.1); tone(200, 'sawtooth', 0, 0.8, 0.04, 400); break;
        case 'vuvuzela':
          tone(233, 'sawtooth', 0, 0.6, 0.06); tone(466, 'sawtooth', 0, 0.6, 0.03); break;
        case 'referee_whistle':
          tone(2800, 'sine', 0, 0.3, 0.1); tone(3200, 'sine', 0.1, 0.2, 0.08); break;
        case 'goal_horn':
          tone(200, 'sawtooth', 0, 0.8, 0.1); tone(250, 'sawtooth', 0, 0.8, 0.08); noise(0, 0.5, 0.05); break;
        default:
          tone(800, 'sine', 0, 0.04, 0.05);
      }
    } catch (e) {}
  }, [audioOn]);

  return { playFx, playAudio, gameSoundsMuted };
}
