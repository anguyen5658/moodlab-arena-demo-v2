export type ArenaTabId = 'arena' | 'live' | 'me';

export type ArenaZoneId = 'hub' | 'arcade' | 'stage' | 'oracle' | 'wall' | 'worldcup';

export type GameZoneId = Exclude<ArenaZoneId, 'hub'>;

export interface GameDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  zone: GameZoneId;
}

export interface ZoneDefinition {
  id: ArenaZoneId;
  title: string;
  subtitle: string;
  accent: string;
  media: {
    image: string;
    video?: string;
  };
  summary: string;
  route: string;
  games: GameDefinition[];
}

const arcadeGames: GameDefinition[] = [
  { id: 'finalkick', name: 'Final Kick', emoji: '⚽', description: 'Skill-based penalty kick showdown.', zone: 'arcade' },
  { id: 'finalkick2', name: 'Final Kick 2', emoji: '⚽🔥', description: 'Dual-axis precision aiming.', zone: 'arcade' },
  { id: 'finalkick3', name: 'Final Kick 3D', emoji: '⚽🌐', description: 'Three.js behind-the-ball experience.', zone: 'arcade' },
  { id: 'wildwest', name: 'Wild West Duel', emoji: '🤠', description: 'Reaction-speed showdown.', zone: 'arcade' },
  { id: 'hotpotato', name: 'Hot Potato', emoji: '💣', description: 'Pass the bomb before it explodes.', zone: 'arcade' },
  { id: 'russian', name: 'Russian Roulette', emoji: '🎲', description: 'Risk-based survival game.', zone: 'arcade' },
  { id: 'balloon', name: 'Balloon Pop', emoji: '🎈', description: 'Hold timing and pressure control.', zone: 'arcade' },
  { id: 'puffpong', name: 'Puff Pong', emoji: '🏓', description: 'Virtual ping-pong with puff controls.', zone: 'arcade' },
  { id: 'rhythm', name: 'Rhythm Puff', emoji: '🎵', description: 'Hit the beat with accurate puffs.', zone: 'arcade' },
  { id: 'tugofwar', name: 'Tug of War', emoji: '💪', description: 'Team strength by puff power.', zone: 'arcade' },
  { id: 'hooked', name: 'Hooked', emoji: '🎣', description: 'Fishing-style precision game.', zone: 'arcade' },
  { id: 'rps', name: 'Puff RPS', emoji: '✊', description: 'Rock Paper Scissors with puff timing.', zone: 'arcade' },
  { id: 'beatdrop', name: 'Beat Drop', emoji: '🎧', description: 'Music-timed hold and release.', zone: 'arcade' },
  { id: 'puffclock', name: 'Puff Clock', emoji: '⏱️', description: 'Precision timing challenge.', zone: 'arcade' },
  { id: 'pufflimbo', name: 'Puff Limbo', emoji: '🎪', description: 'Endurance under pressure.', zone: 'arcade' },
  { id: 'puffderby', name: 'Puff Derby', emoji: '🏇', description: 'Race pacing and burst control.', zone: 'arcade' },
];

const stageGames: GameDefinition[] = [
  { id: 'vibecheck', name: 'Vibe Check', emoji: '🧠', description: 'Trivia game show format.', zone: 'stage' },
  { id: 'higherlower', name: 'Higher or Lower', emoji: '📊', description: 'Crowd knowledge showdown.', zone: 'stage' },
  { id: 'pricepuff', name: 'The Price is Puff', emoji: '💰', description: 'Price guessing with puff power.', zone: 'stage' },
  { id: 'survivaltrivia', name: 'Survival Trivia', emoji: '🏆', description: 'Elimination trivia rounds.', zone: 'stage' },
  { id: 'simonpuffs', name: 'Simon Puffs', emoji: '🔴', description: 'Memory sequence show.', zone: 'stage' },
  { id: 'puffauction', name: 'Puff Auction', emoji: '🔨', description: 'Auction strategy game.', zone: 'stage' },
];

const oracleGames: GameDefinition[] = [
  { id: 'crystalball', name: 'Crystal Ball', emoji: '🔮', description: 'Yes/no prediction oracle.', zone: 'oracle' },
  { id: 'strainbattle', name: 'Strain Battle', emoji: '🌿', description: 'Voting and prediction duel.', zone: 'oracle' },
  { id: 'matchpredictor', name: 'Match Predictor', emoji: '🏟️', description: 'World Cup prediction hub.', zone: 'oracle' },
  { id: 'dailypicks', name: 'Daily Picks', emoji: '📅', description: 'Streak-based predictions.', zone: 'oracle' },
  { id: 'puffslots', name: 'Puff Slots', emoji: '🎰', description: 'Slot machine luck game.', zone: 'oracle' },
  { id: 'puffblackjack', name: 'Puff Blackjack', emoji: '🃏', description: 'Blackjack with puff control.', zone: 'oracle' },
  { id: 'coinflip', name: 'Coin Flip', emoji: '🪙', description: 'Simple 50/50 prediction.', zone: 'oracle' },
  { id: 'crapsnclouds', name: 'Craps & Clouds', emoji: '🎲', description: 'Dice-based luck game.', zone: 'oracle' },
  { id: 'mysterybox', name: 'Mystery Box', emoji: '📦', description: 'Hidden reveal choice game.', zone: 'oracle' },
  { id: 'scratchpuff', name: 'Scratch & Puff', emoji: '🪄', description: 'Scratch ticket style luck.', zone: 'oracle' },
  { id: 'fortunecookie', name: 'Fortune Cookie', emoji: '🥠', description: 'Cookie crack fortune reveal.', zone: 'oracle' },
  { id: 'treasuremap', name: 'Treasure Map', emoji: '🗺️', description: 'Find the treasure tiles.', zone: 'oracle' },
];

const worldCupGames: GameDefinition[] = [
  { id: 'wc-predict-1', name: 'Opening Prediction', emoji: '⚽', description: 'World Cup match forecast.', zone: 'worldcup' },
  { id: 'wc-predict-2', name: 'Knockout Forecast', emoji: '🥅', description: 'Bracket-based prediction flow.', zone: 'worldcup' },
  { id: 'wc-predict-3', name: 'Golden Boot', emoji: '👟', description: 'Top scorer predictions.', zone: 'worldcup' },
  { id: 'wc-predict-4', name: 'Champion Pick', emoji: '🏆', description: 'Final winner forecast.', zone: 'worldcup' },
];

export const arenaTabs: Array<{ id: ArenaTabId; label: string; route: string }> = [
  { id: 'arena', label: 'Arena', route: '/arena' },
  { id: 'live', label: 'Live', route: '/live' },
  { id: 'me', label: 'Me', route: '/me' },
];

export const arenaZones: ZoneDefinition[] = [
  {
    id: 'hub',
    title: 'Arena Hub',
    subtitle: 'Choose a zone to enter.',
    accent: '#00E5FF',
    media: { image: '/assets/arena/hub.png', video: '/assets/arena/hub.mp4' },
    summary: 'Central lobby for all zones and live entry points.',
    route: '/arena/hub',
    games: [],
  },
  {
    id: 'arcade',
    title: 'The Arcade',
    subtitle: 'Skill and reaction games.',
    accent: '#00E5FF',
    media: { image: '/assets/arena/arcade.png', video: '/assets/arena/arcade.mp4' },
    summary: 'Sixteen high-energy arcade games with puff-based input.',
    route: '/arena/arcade',
    games: arcadeGames,
  },
  {
    id: 'stage',
    title: 'The Stage',
    subtitle: 'Live show formats.',
    accent: '#FFD93D',
    media: { image: '/assets/arena/stage.png', video: '/assets/arena/stage.mp4' },
    summary: 'Audience-facing live shows and multiplayer formats.',
    route: '/arena/stage',
    games: stageGames,
  },
  {
    id: 'oracle',
    title: 'The Oracle',
    subtitle: 'Prediction and fortune games.',
    accent: '#FFD93D',
    media: { image: '/assets/arena/oracle.png', video: '/assets/arena/oracle.mp4' },
    summary: 'Luck, casino, and prediction mechanics in one place.',
    route: '/arena/oracle',
    games: oracleGames,
  },
  {
    id: 'wall',
    title: 'The Wall',
    subtitle: 'Leaderboards and records.',
    accent: '#FB923C',
    media: { image: '/assets/arena/wall.png', video: '/assets/arena/wall.mp4' },
    summary: 'Leaderboard and champion display surfaces.',
    route: '/arena/wall',
    games: [],
  },
  {
    id: 'worldcup',
    title: 'World Cup 2026',
    subtitle: 'Sports prediction hub.',
    accent: '#FFD93D',
    media: { image: '/assets/arena/worldcup.png', video: '/assets/arena/worldcup.mp4' },
    summary: 'World Cup prediction and tournament flows.',
    route: '/arena/worldcup',
    games: worldCupGames,
  },
];

export const arenaZoneMap = Object.fromEntries(arenaZones.map((zone) => [zone.id, zone])) as Record<ArenaZoneId, ZoneDefinition>;

export const allGames = [...arcadeGames, ...stageGames, ...oracleGames, ...worldCupGames];

export const gameMap = Object.fromEntries(allGames.map((game) => [game.id, game])) as Record<string, GameDefinition>;