export interface Vector2 {
  x: number;
  y: number;
}

export interface Ball {
  position: Vector2;
  velocity: Vector2;
  radius: number;
}

export interface Obstacle {
  id: string;
  position: Vector2;
  velocity: Vector2;
  type: 'cone' | 'goalpost' | 'defender';
  width: number;
  height: number;
}

export interface Coin {
  id: string;
  position: Vector2;
  velocity: Vector2;
  radius: number;
  value: number;
}

export type GameScreen = 'menu' | 'playing' | 'gameOver' | 'store' | 'leaderboard' | 'achievements';

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  bestTime: number;
  bestCoins: number;
  bestTimeTimestamp: number;
  bestCoinsTimestamp: number;
  bestTimeSkin: string;
  bestCoinsSkin: string;
}

export type LeaderboardCategory = 'time' | 'coins';

export interface DailyReward {
  day: number;
  coins: number;
  description: string;
  claimed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  requirement: number;
  progress: number;
  completed: boolean;
  reward: number; // coins
  icon: string;
  type: 'time' | 'coins' | 'games' | 'skins' | 'special';
}

export interface BallSkin {
  id: string;
  name: string;
  emoji: string;
  coinPrice: number;
  cashPrice: number; // in cents
  unlocked: boolean;
}

export interface GameState {
  ball: Ball;
  obstacles: Obstacle[];
  coins: Coin[];
  score: number;
  highScore: number;
  collectedCoins: number;
  currentScreen: GameScreen;
  selectedSkin: string;
  unlockedSkins: string[];
  adsRemoved: boolean;
  leaderboard: LeaderboardEntry[];
  playerName: string;
  leaderboardCategory: LeaderboardCategory;
  dailyRewards: DailyReward[];
  lastLoginDate: string;
  currentStreak: number;
  achievements: Achievement[];
  totalGamesPlayed: number;
  canWatchAdToContinue: boolean;
}

export interface GameConfig {
  gravity: number;
  ballRadius: number;
  screenWidth: number;
  screenHeight: number;
  obstacleSpeed: number;
  spawnRate: number;
}