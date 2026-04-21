import { useCallback } from 'react'
import { WC_TEAMS, WC_PRIZES, C } from '../constants'
import { useGameContext } from '../context/GameContext'
import { usePlayerContext } from '../context/PlayerContext'
import { useAudioContext } from '../context/AudioContext'

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

/**
 * World Cup tournament state machine.
 * Manages: team select → group draw → group play (3 matches) → knockout (5 rounds) → result.
 */
export const useWcTournament = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const audio = useAudioContext()

  const selectTeam = useCallback((team: any) => {
    game.setWcTeam(team)
    audio.playFx('select')
  }, [game, audio])

  const confirmTeam = useCallback(() => {
    const team = game.wcTeam
    if (!team) return
    audio.playFx('crowd')
    // Draw 3 random opponents from different teams
    const others = WC_TEAMS.filter((t: any) => t.id !== team.id)
    const opps: any[] = []
    while (opps.length < 3) {
      const r = pick(others.filter((t: any) => !opps.find(o => o.id === t.id)))
      opps.push(r)
    }
    const groupTeams = [team, ...opps]
    const standings = groupTeams.map((t: any) => ({
      team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0,
    }))
    const groupMatches = [
      { home: 0, away: 1, played: false, homeGoals: 0, awayGoals: 0 },
      { home: 0, away: 2, played: false, homeGoals: 0, awayGoals: 0 },
      { home: 0, away: 3, played: false, homeGoals: 0, awayGoals: 0 },
    ]
    game.setWcTournament({ groupTeams, standings, groupMatches, knockoutRound: 0, knockoutOpps: [], knockoutResults: [] })
    game.setWcMatchday(0)
    game.setWcPhase('group_draw')
    game.setWcDrawAnim(true)
    // After draw animation, show group stage
    setTimeout(() => {
      game.setWcDrawAnim(false)
      game.setWcPhase('group_stage')
    }, 2500)
  }, [game, audio])

  const playGroupMatch = useCallback((matchIdx: number) => {
    const tourn = game.wcTournament
    if (!tourn || matchIdx >= tourn.groupMatches.length) return
    const m = tourn.groupMatches[matchIdx]
    if (m.played) return
    // Launch the game with WC mode flag
    const oppTeam = tourn.groupTeams[m.away]
    game.setGameActive({
      id: game.wcGameId || 'finalkick',
      name: 'Final Kick',
      emoji: '⚽',
      color: C.gold,
      wcMode: true,
      wcKnockout: false,
      wcMatchIdx: matchIdx,
      wcOpponent: oppTeam,
    })
    game.setWcMatchday(matchIdx)
  }, [game])

  const finishGroupMatch = useCallback((matchIdx: number, myScore: number, aiScore: number) => {
    const tourn = { ...game.wcTournament }
    if (!tourn.groupMatches) return
    const gm = [...tourn.groupMatches]
    gm[matchIdx] = { ...gm[matchIdx], played: true, homeGoals: myScore, awayGoals: aiScore }
    // Update standings for user (index 0)
    const standings = [...tourn.standings]
    const userStanding = { ...standings[0] }
    userStanding.played++
    userStanding.gf += myScore
    userStanding.ga += aiScore
    if (myScore > aiScore) { userStanding.won++; userStanding.pts += 3 }
    else if (myScore === aiScore) { userStanding.drawn++; userStanding.pts += 1 }
    else { userStanding.lost++ }
    standings[0] = userStanding
    // Simulate AI matches between opponent teams
    for (let i = 1; i < 4; i++) {
      const s = { ...standings[i] }
      s.played++
      const g1 = Math.floor(Math.random() * 4)
      const g2 = Math.floor(Math.random() * 4)
      s.gf += g1; s.ga += g2
      if (g1 > g2) { s.won++; s.pts += 3 }
      else if (g1 === g2) { s.drawn++; s.pts += 1 }
      else { s.lost++ }
      standings[i] = s
    }
    tourn.groupMatches = gm
    tourn.standings = standings
    game.setWcTournament(tourn)
    // Check if all 3 group matches played
    if (gm.every((m: any) => m.played)) {
      // Sort standings by pts, then GD, then GF
      const sorted = [...standings].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts
        const gdA = a.gf - a.ga, gdB = b.gf - b.ga
        if (gdB !== gdA) return gdB - gdA
        return b.gf - a.gf
      })
      const userRank = sorted.findIndex(s => s.team.id === game.wcTeam?.id)
      if (userRank <= 1) {
        // Advance to knockout
        game.setWcGroupResult('advance')
        // Build 5-round knockout bracket with random opponents
        const koOpps = Array.from({ length: 5 }, () => pick(WC_TEAMS.filter((t: any) => t.id !== game.wcTeam?.id)))
        tourn.knockoutOpps = koOpps
        tourn.knockoutResults = []
        tourn.knockoutRound = 0
        game.setWcTournament({ ...tourn })
        audio.playFx('win')
        player.spawnConfetti(40)
        setTimeout(() => game.setWcPhase('knockout'), 2000)
      } else {
        // Eliminated
        game.setWcGroupResult('eliminated')
        game.setWcFinalResult('group')
        audio.playFx('lose')
        setTimeout(() => game.setWcPhase('result'), 2000)
      }
    }
  }, [game, audio, player])

  const playKnockoutMatch = useCallback(() => {
    const tourn = game.wcTournament
    if (!tourn) return
    const round = tourn.knockoutRound || 0
    const opp = tourn.knockoutOpps?.[round]
    if (!opp) return
    const roundNames = ['Round of 32', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'FINAL']
    game.setGameActive({
      id: game.wcGameId || 'finalkick',
      name: roundNames[round] || 'Knockout',
      emoji: '⚽',
      color: C.gold,
      wcMode: true,
      wcKnockout: true,
      wcMatchIdx: round,
      wcOpponent: opp,
    })
  }, [game])

  const finishKnockoutMatch = useCallback((myScore: number, aiScore: number) => {
    const tourn = { ...game.wcTournament }
    const round = tourn.knockoutRound || 0
    let won = myScore > aiScore
    if (myScore === aiScore) won = Math.random() < 0.55 // draws: slight user advantage
    const results = [...(tourn.knockoutResults || []), { round, won, myScore, aiScore }]
    tourn.knockoutResults = results
    if (won) {
      if (round >= 4) {
        // Won the final!
        game.setWcFinalResult('gold')
        game.setWcPhase('result')
        audio.playFx('win'); audio.playFx('crowd')
        player.spawnConfetti(80, [C.gold, '#fff', C.cyan])
      } else {
        tourn.knockoutRound = round + 1
        game.setWcTournament(tourn)
        audio.playFx('win')
        player.spawnConfetti(30)
      }
    } else {
      // Lost — determine placement
      const placement = round >= 4 ? 'silver' : round >= 3 ? 'bronze' : 'group'
      game.setWcFinalResult(placement)
      game.setWcPhase('result')
      audio.playFx('lose')
    }
    game.setWcTournament(tourn)
  }, [game, audio, player])

  const claimPrize = useCallback(() => {
    const result = game.wcFinalResult
    const prizes = WC_PRIZES as any
    const prize = prizes[result || 'group'] || prizes.group
    player.setCoins((c: number) => c + prize.coins)
    player.awardXP(prize.xp)
    player.notify(`🏆 WC ${result?.toUpperCase()}: +${prize.coins} coins, +${prize.xp} XP!`, result === 'gold' ? C.gold : result === 'silver' ? '#C0C0C0' : C.orange)
    audio.playFx('crowd')
    // Reset tournament
    game.setWcPhase(null)
    game.setWcTeam(null)
    game.setWcTournament(null)
    game.setWcMatchday(0)
    game.setWcBracket(null)
    game.setWcGroupResult(null)
    game.setWcFinalResult(null)
  }, [game, player, audio])

  const abandonTournament = useCallback(() => {
    game.setWcPhase(null)
    game.setWcTeam(null)
    game.setWcTournament(null)
    game.setWcMatchday(0)
    game.setWcBracket(null)
    game.setWcGroupResult(null)
    game.setWcFinalResult(null)
  }, [game])

  return {
    selectTeam,
    confirmTeam,
    playGroupMatch,
    finishGroupMatch,
    playKnockoutMatch,
    finishKnockoutMatch,
    claimPrize,
    abandonTournament,
  }
}
