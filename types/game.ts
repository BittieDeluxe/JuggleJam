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

export interface GameState {
  ball: Ball;
  obstacles: Obstacle[];
  score: number;
  isPlaying: boolean;
  gameOver: boolean;
}

export interface GameConfig {
  gravity: number;
  ballRadius: number;
  screenWidth: number;
  screenHeight: number;
  obstacleSpeed: number;
  spawnRate: number;
}