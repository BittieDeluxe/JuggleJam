import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Dimensions, Text } from 'react-native';
import { PanGestureHandler, GestureHandlerGestureEvent, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ball, Obstacle, GameState, GameConfig, Vector2 } from '../types/game';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GAME_CONFIG: GameConfig = {
  gravity: 0.8,
  ballRadius: 25,
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  obstacleSpeed: 3,
  spawnRate: 0.02,
};

export const GameEngine: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    ball: {
      position: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
      velocity: { x: 0, y: 0 },
      radius: GAME_CONFIG.ballRadius,
    },
    obstacles: [],
    score: 0,
    isPlaying: true,
    gameOver: false,
  });

  const ballX = useSharedValue(SCREEN_WIDTH / 2);
  const ballY = useSharedValue(SCREEN_HEIGHT / 2);
  const ballVelX = useSharedValue(0);
  const ballVelY = useSharedValue(0);

  // Physics and game loop
  const updatePhysics = useCallback(() => {
    if (!gameState.isPlaying || gameState.gameOver) return;

    setGameState(prevState => {
      const newState = { ...prevState };

      // Apply gravity
      newState.ball.velocity.y += GAME_CONFIG.gravity;

      // Update ball position
      newState.ball.position.x += newState.ball.velocity.x;
      newState.ball.position.y += newState.ball.velocity.y;

      // Apply friction
      newState.ball.velocity.x *= 0.98;

      // Boundary checks
      if (newState.ball.position.x <= GAME_CONFIG.ballRadius) {
        newState.ball.position.x = GAME_CONFIG.ballRadius;
        newState.ball.velocity.x = Math.abs(newState.ball.velocity.x) * 0.7;
      }
      if (newState.ball.position.x >= SCREEN_WIDTH - GAME_CONFIG.ballRadius) {
        newState.ball.position.x = SCREEN_WIDTH - GAME_CONFIG.ballRadius;
        newState.ball.velocity.x = -Math.abs(newState.ball.velocity.x) * 0.7;
      }

      // Ground collision (game over)
      if (newState.ball.position.y >= SCREEN_HEIGHT - GAME_CONFIG.ballRadius) {
        newState.gameOver = true;
        newState.isPlaying = false;
      }

      // Update obstacles
      newState.obstacles = newState.obstacles
        .map(obstacle => ({
          ...obstacle,
          position: {
            x: obstacle.position.x + obstacle.velocity.x,
            y: obstacle.position.y + obstacle.velocity.y,
          },
        }))
        .filter(obstacle =>
          obstacle.position.x > -100 &&
          obstacle.position.x < SCREEN_WIDTH + 100 &&
          obstacle.position.y > -100 &&
          obstacle.position.y < SCREEN_HEIGHT + 100
        );

      // Spawn new obstacles
      if (Math.random() < GAME_CONFIG.spawnRate) {
        const side = Math.random() < 0.5 ? 'left' : 'right';
        const obstacleType = ['cone', 'goalpost', 'defender'][Math.floor(Math.random() * 3)] as 'cone' | 'goalpost' | 'defender';

        const newObstacle: Obstacle = {
          id: Date.now().toString(),
          position: {
            x: side === 'left' ? -50 : SCREEN_WIDTH + 50,
            y: Math.random() * (SCREEN_HEIGHT - 200) + 100,
          },
          velocity: {
            x: side === 'left' ? GAME_CONFIG.obstacleSpeed : -GAME_CONFIG.obstacleSpeed,
            y: 0,
          },
          type: obstacleType,
          width: obstacleType === 'cone' ? 30 : obstacleType === 'goalpost' ? 20 : 40,
          height: obstacleType === 'cone' ? 40 : obstacleType === 'goalpost' ? 80 : 60,
        };

        newState.obstacles.push(newObstacle);
      }

      // Check collisions
      for (const obstacle of newState.obstacles) {
        const distance = Math.sqrt(
          Math.pow(newState.ball.position.x - (obstacle.position.x + obstacle.width / 2), 2) +
          Math.pow(newState.ball.position.y - (obstacle.position.y + obstacle.height / 2), 2)
        );

        if (distance < GAME_CONFIG.ballRadius + Math.min(obstacle.width, obstacle.height) / 2) {
          newState.gameOver = true;
          newState.isPlaying = false;
        }
      }

      // Update score based on time survived
      newState.score += 1;

      return newState;
    });
  }, [gameState.isPlaying, gameState.gameOver]);

  // Touch handler for ball control
  const handleTouch = useCallback((touchX: number, touchY: number) => {
    setGameState(prevState => {
      const ballPos = prevState.ball.position;
      const deltaX = touchX - ballPos.x;
      const deltaY = touchY - ballPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Calculate force based on distance from ball
      const maxForce = 15;
      const force = Math.min(distance / 100, 1) * maxForce;

      // Calculate direction
      const directionX = distance > 0 ? deltaX / distance : 0;
      const directionY = distance > 0 ? deltaY / distance : 0;

      // Apply force considering current velocity (momentum conservation)
      const newVelX = prevState.ball.velocity.x * 0.3 + directionX * force;
      const newVelY = prevState.ball.velocity.y * 0.3 + directionY * force;

      return {
        ...prevState,
        ball: {
          ...prevState.ball,
          velocity: { x: newVelX, y: newVelY },
        },
      };
    });
  }, []);

  const onPanGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    handleTouch(event.nativeEvent.x, event.nativeEvent.y);
  };

  // Game loop
  useEffect(() => {
    const interval = setInterval(() => {
      updatePhysics();
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [updatePhysics]);

  // Update animated values
  useEffect(() => {
    ballX.value = withTiming(gameState.ball.position.x, { duration: 16 });
    ballY.value = withTiming(gameState.ball.position.y, { duration: 16 });
  }, [gameState.ball.position]);

  const ballStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: ballX.value - GAME_CONFIG.ballRadius },
      { translateY: ballY.value - GAME_CONFIG.ballRadius },
    ],
  }));

  const getObstacleColor = (type: string) => {
    switch (type) {
      case 'cone': return '#FF6B35';
      case 'goalpost': return '#FFD23F';
      case 'defender': return '#FF4081';
      default: return '#FF6B35';
    }
  };

  return (
    <PanGestureHandler onGestureEvent={onPanGestureEvent}>
      <Animated.View style={{ flex: 1, backgroundColor: '#4CAF50' }}>
        {/* Ball */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: GAME_CONFIG.ballRadius * 2,
              height: GAME_CONFIG.ballRadius * 2,
              borderRadius: GAME_CONFIG.ballRadius,
              backgroundColor: '#FFFFFF',
              borderWidth: 2,
              borderColor: '#000000',
            },
            ballStyle,
          ]}
        />

        {/* Obstacles */}
        {gameState.obstacles.map((obstacle) => (
          <View
            key={obstacle.id}
            style={{
              position: 'absolute',
              left: obstacle.position.x,
              top: obstacle.position.y,
              width: obstacle.width,
              height: obstacle.height,
              backgroundColor: getObstacleColor(obstacle.type),
              borderRadius: obstacle.type === 'cone' ? obstacle.width / 2 : 5,
            }}
          />
        ))}

        {/* Score */}
        <View style={{ position: 'absolute', top: 50, left: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
            Score: {Math.floor(gameState.score / 60)}
          </Text>
        </View>

        {/* Game Over */}
        {gameState.gameOver && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 20 }}>
              Game Over!
            </Text>
            <Text style={{ fontSize: 18, color: 'white' }}>
              Final Score: {Math.floor(gameState.score / 60)}
            </Text>
          </View>
        )}
      </Animated.View>
    </PanGestureHandler>
  );
};