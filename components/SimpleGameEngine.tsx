import React, { useEffect, useState, useCallback } from 'react';
import { View, Dimensions, Text, TouchableOpacity, TouchableWithoutFeedback, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ball, Obstacle, Coin, GameState, GameConfig, Vector2, GameScreen, BallSkin, LeaderboardEntry, LeaderboardCategory, DailyReward, Achievement } from '../types/game';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_CONFIG: GameConfig = {
  gravity: 0.3,
  ballRadius: 25,
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  obstacleSpeed: 1.5,
  spawnRate: 0.008,
};

// Difficulty scaling function
const getDifficultyMultiplier = (score: number): { speedMultiplier: number; spawnMultiplier: number } => {
  const timeInSeconds = score / 60;

  // Progressive difficulty that caps out to prevent impossibility
  const speedMultiplier = Math.min(1 + (timeInSeconds / 120) * 0.8, 2.2); // Max 2.2x speed after 2 minutes
  const spawnMultiplier = Math.min(1 + (timeInSeconds / 90) * 2, 3.5); // Max 3.5x spawn rate after 1.5 minutes

  return { speedMultiplier, spawnMultiplier };
};

// Ball skins data
const BALL_SKINS: BallSkin[] = [
  { id: 'classic', name: 'Classic', emoji: '⚽', coinPrice: 0, cashPrice: 0, unlocked: true },
  { id: 'basketball', name: 'Basketball', emoji: '🏀', coinPrice: 100, cashPrice: 99, unlocked: false },
  { id: 'tennis', name: 'Tennis Ball', emoji: '🎾', coinPrice: 150, cashPrice: 99, unlocked: false },
  { id: 'volleyball', name: 'Volleyball', emoji: '🏐', coinPrice: 200, cashPrice: 149, unlocked: false },
  { id: 'football', name: 'American Football', emoji: '🏈', coinPrice: 250, cashPrice: 149, unlocked: false },
  { id: 'baseball', name: 'Baseball', emoji: '⚾', coinPrice: 300, cashPrice: 199, unlocked: false },
  { id: 'golf', name: 'Golf Ball', emoji: '⛳', coinPrice: 350, cashPrice: 199, unlocked: false },
  { id: 'crystal', name: 'Crystal Ball', emoji: '🔮', coinPrice: 500, cashPrice: 299, unlocked: false },
];

// Daily rewards data
const DAILY_REWARDS: DailyReward[] = [
  { day: 1, coins: 10, description: "Welcome back!", claimed: false },
  { day: 2, coins: 15, description: "Keep it up!", claimed: false },
  { day: 3, coins: 20, description: "Great streak!", claimed: false },
  { day: 4, coins: 25, description: "You're on fire!", claimed: false },
  { day: 5, coins: 30, description: "Amazing dedication!", claimed: false },
  { day: 6, coins: 40, description: "Almost there!", claimed: false },
  { day: 7, coins: 50, description: "Weekly champion!", claimed: false },
];

// Achievements data
const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_game', title: 'Getting Started', description: 'Play your first game', requirement: 1, progress: 0, completed: false, reward: 10, icon: '🎮', type: 'games' },
  { id: 'collect_50_coins', title: 'Coin Collector', description: 'Collect 50 coins in total', requirement: 50, progress: 0, completed: false, reward: 20, icon: '🪙', type: 'coins' },
  { id: 'survive_60s', title: 'Survivor', description: 'Survive for 60 seconds in one game', requirement: 60, progress: 0, completed: false, reward: 30, icon: '⏱️', type: 'time' },
  { id: 'play_10_games', title: 'Dedicated Player', description: 'Play 10 games', requirement: 10, progress: 0, completed: false, reward: 25, icon: '🏆', type: 'games' },
  { id: 'collect_3_skins', title: 'Fashion Forward', description: 'Unlock 3 different ball skins', requirement: 3, progress: 1, completed: false, reward: 40, icon: '👕', type: 'skins' },
  { id: 'collect_100_one_game', title: 'Treasure Hunter', description: 'Collect 100 coins in one game', requirement: 100, progress: 0, completed: false, reward: 50, icon: '💰', type: 'coins' },
  { id: 'survive_120s', title: 'Master Survivor', description: 'Survive for 2 minutes in one game', requirement: 120, progress: 0, completed: false, reward: 75, icon: '🥇', type: 'time' },
  { id: 'login_streak', title: 'Daily Champion', description: 'Login for 7 days in a row', requirement: 7, progress: 0, completed: false, reward: 100, icon: '📅', type: 'special' },
];

export const SimpleGameEngine: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    ball: {
      position: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
      velocity: { x: 0, y: 0 },
      radius: BASE_CONFIG.ballRadius,
    },
    obstacles: [],
    coins: [],
    score: 0,
    highScore: 0,
    collectedCoins: 0,
    currentScreen: 'menu',
    selectedSkin: 'classic',
    unlockedSkins: ['classic'],
    adsRemoved: false,
    leaderboard: [],
    playerName: 'Player',
    leaderboardCategory: 'time',
    dailyRewards: DAILY_REWARDS.map(reward => ({ ...reward })),
    lastLoginDate: '',
    currentStreak: 0,
    achievements: INITIAL_ACHIEVEMENTS.map(achievement => ({ ...achievement })),
    totalGamesPlayed: 0,
    canWatchAdToContinue: false,
  });

  // Load saved data on app start
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const [savedHighScore, savedCoins, savedSkins, savedSelectedSkin, savedAdsRemoved, savedLeaderboard, savedPlayerName, savedDailyRewards, savedLastLoginDate, savedCurrentStreak, savedAchievements, savedTotalGamesPlayed] = await Promise.all([
          AsyncStorage.getItem('juggleJamHighScore'),
          AsyncStorage.getItem('juggleJamCoins'),
          AsyncStorage.getItem('juggleJamUnlockedSkins'),
          AsyncStorage.getItem('juggleJamSelectedSkin'),
          AsyncStorage.getItem('juggleJamAdsRemoved'),
          AsyncStorage.getItem('juggleJamLeaderboard'),
          AsyncStorage.getItem('juggleJamPlayerName'),
          AsyncStorage.getItem('juggleJamDailyRewards'),
          AsyncStorage.getItem('juggleJamLastLoginDate'),
          AsyncStorage.getItem('juggleJamCurrentStreak'),
          AsyncStorage.getItem('juggleJamAchievements'),
          AsyncStorage.getItem('juggleJamTotalGamesPlayed'),
        ]);

        setGameState(prev => ({
          ...prev,
          highScore: savedHighScore ? parseInt(savedHighScore, 10) : 0,
          collectedCoins: savedCoins ? parseInt(savedCoins, 10) : 0,
          unlockedSkins: savedSkins ? JSON.parse(savedSkins) : ['classic'],
          selectedSkin: savedSelectedSkin || 'classic',
          adsRemoved: savedAdsRemoved === 'true',
          leaderboard: savedLeaderboard ? JSON.parse(savedLeaderboard) : [],
          playerName: savedPlayerName || 'Player',
          dailyRewards: savedDailyRewards ? JSON.parse(savedDailyRewards) : DAILY_REWARDS.map(reward => ({ ...reward })),
          lastLoginDate: savedLastLoginDate || '',
          currentStreak: savedCurrentStreak ? parseInt(savedCurrentStreak, 10) : 0,
          achievements: savedAchievements ? JSON.parse(savedAchievements) : INITIAL_ACHIEVEMENTS.map(achievement => ({ ...achievement })),
          totalGamesPlayed: savedTotalGamesPlayed ? parseInt(savedTotalGamesPlayed, 10) : 0,
        }));

        // Check daily login rewards after loading data
        checkDailyLoginReward();
      } catch (error) {
        console.log('Error loading saved data:', error);
      }
    };
    loadSavedData();
  }, []);

  // Physics and game loop
  const updatePhysics = useCallback(() => {
    if (gameState.currentScreen !== 'playing') return;

    setGameState(prevState => {
      const newState = { ...prevState };

      // Get current difficulty multipliers
      const { speedMultiplier, spawnMultiplier } = getDifficultyMultiplier(newState.score);

      // Apply gravity
      newState.ball.velocity.y += BASE_CONFIG.gravity;

      // Update ball position
      newState.ball.position.x += newState.ball.velocity.x;
      newState.ball.position.y += newState.ball.velocity.y;

      // Apply friction (more aggressive)
      newState.ball.velocity.x *= 0.95;
      newState.ball.velocity.y *= 0.99;

      // Boundary checks
      if (newState.ball.position.x <= BASE_CONFIG.ballRadius) {
        newState.ball.position.x = BASE_CONFIG.ballRadius;
        newState.ball.velocity.x = Math.abs(newState.ball.velocity.x) * 0.7;
      }
      if (newState.ball.position.x >= SCREEN_WIDTH - BASE_CONFIG.ballRadius) {
        newState.ball.position.x = SCREEN_WIDTH - BASE_CONFIG.ballRadius;
        newState.ball.velocity.x = -Math.abs(newState.ball.velocity.x) * 0.7;
      }

      // Ground collision (game over)
      if (newState.ball.position.y >= SCREEN_HEIGHT - BASE_CONFIG.ballRadius) {
        newState.currentScreen = 'gameOver';
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

      // Spawn new obstacles with dynamic difficulty
      if (Math.random() < BASE_CONFIG.spawnRate * spawnMultiplier) {
        const side = Math.random() < 0.5 ? 'left' : 'right';
        const obstacleType = ['cone', 'goalpost', 'defender'][Math.floor(Math.random() * 3)] as 'cone' | 'goalpost' | 'defender';

        const newObstacle: Obstacle = {
          id: Date.now().toString(),
          position: {
            x: side === 'left' ? -50 : SCREEN_WIDTH + 50,
            y: Math.random() * (SCREEN_HEIGHT - 200) + 100,
          },
          velocity: {
            x: side === 'left' ? BASE_CONFIG.obstacleSpeed * speedMultiplier : -BASE_CONFIG.obstacleSpeed * speedMultiplier,
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

        if (distance < BASE_CONFIG.ballRadius + Math.min(obstacle.width, obstacle.height) / 2) {
          newState.currentScreen = 'gameOver';
        }
      }

      // Update score based on time survived
      newState.score += 1;

      // Update coins
      newState.coins = newState.coins
        .map(coin => ({
          ...coin,
          position: {
            x: coin.position.x + coin.velocity.x,
            y: coin.position.y + coin.velocity.y,
          },
        }))
        .filter(coin =>
          coin.position.x > -100 &&
          coin.position.x < SCREEN_WIDTH + 100 &&
          coin.position.y > -100 &&
          coin.position.y < SCREEN_HEIGHT + 100
        );

      // Spawn new coins occasionally
      if (Math.random() < 0.005) { // Lower spawn rate than obstacles
        const side = Math.random() < 0.5 ? 'left' : 'right';
        const coinValue = Math.random() < 0.8 ? 1 : 5; // 80% chance for 1 coin, 20% for 5 coins

        const newCoin: Coin = {
          id: Date.now().toString() + '_coin',
          position: {
            x: side === 'left' ? -30 : SCREEN_WIDTH + 30,
            y: Math.random() * (SCREEN_HEIGHT - 200) + 100,
          },
          velocity: {
            x: side === 'left' ? speedMultiplier * 1.5 : -speedMultiplier * 1.5,
            y: 0,
          },
          radius: 15,
          value: coinValue,
        };

        newState.coins.push(newCoin);
      }

      // Check coin collection
      for (let i = newState.coins.length - 1; i >= 0; i--) {
        const coin = newState.coins[i];
        const distance = Math.sqrt(
          Math.pow(newState.ball.position.x - coin.position.x, 2) +
          Math.pow(newState.ball.position.y - coin.position.y, 2)
        );

        if (distance < BASE_CONFIG.ballRadius + coin.radius) {
          // Collect the coin
          newState.collectedCoins += coin.value;
          newState.coins.splice(i, 1);
          // Save coins immediately when collected
          saveCoins(newState.collectedCoins);
        }
      }

      return newState;
    });
  }, [gameState.currentScreen]);

  // Touch handler for ball control
  const handleTouch = useCallback((touchX: number, touchY: number) => {
    if (gameState.currentScreen !== 'playing') return;

    setGameState(prevState => {
      const ballPos = prevState.ball.position;

      // Always apply upward force (Flappy Bird style)
      const upwardForce = -5; // Negative because Y decreases upward

      // Determine horizontal direction based on tap position relative to ball
      const deltaX = touchX - ballPos.x;
      const horizontalForce = deltaX > 0 ? 2 : deltaX < 0 ? -2 : 0;

      // Apply forces considering current velocity
      const newVelX = prevState.ball.velocity.x * 0.7 + horizontalForce;
      const newVelY = upwardForce; // Always override Y velocity for consistent "flap"

      // Cap maximum velocity
      const maxVelX = 4;
      const maxVelY = 8;
      const clampedVelX = Math.max(-maxVelX, Math.min(maxVelX, newVelX));
      const clampedVelY = Math.max(-maxVelY, Math.min(maxVelY, newVelY));

      return {
        ...prevState,
        ball: {
          ...prevState.ball,
          velocity: { x: clampedVelX, y: clampedVelY },
        },
      };
    });
  }, [gameState.currentScreen]);

  const handleScreenPress = (evt: any) => {
    const { locationX, locationY } = evt.nativeEvent;
    handleTouch(locationX, locationY);
  };

  // Game loop
  useEffect(() => {
    const interval = setInterval(() => {
      updatePhysics();
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [updatePhysics]);

  // Save functions
  const saveData = async (key: string, value: string | number | boolean | string[] | LeaderboardEntry[] | DailyReward[] | Achievement[]) => {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value.toString();
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      console.log(`Error saving ${key}:`, error);
    }
  };

  const saveHighScore = async (score: number) => saveData('juggleJamHighScore', score);
  const saveCoins = async (coins: number) => saveData('juggleJamCoins', coins);
  const saveUnlockedSkins = async (skins: string[]) => saveData('juggleJamUnlockedSkins', skins);
  const saveSelectedSkin = async (skin: string) => saveData('juggleJamSelectedSkin', skin);
  const saveAdsRemoved = async (removed: boolean) => saveData('juggleJamAdsRemoved', removed);
  const saveLeaderboard = async (leaderboard: LeaderboardEntry[]) => saveData('juggleJamLeaderboard', leaderboard);
  const savePlayerName = async (name: string) => saveData('juggleJamPlayerName', name);
  const saveDailyRewards = async (rewards: DailyReward[]) => saveData('juggleJamDailyRewards', rewards);
  const saveLastLoginDate = async (date: string) => saveData('juggleJamLastLoginDate', date);
  const saveCurrentStreak = async (streak: number) => saveData('juggleJamCurrentStreak', streak);
  const saveAchievements = async (achievements: Achievement[]) => saveData('juggleJamAchievements', achievements);
  const saveTotalGamesPlayed = async (total: number) => saveData('juggleJamTotalGamesPlayed', total);

  // Daily login reward system
  const checkDailyLoginReward = () => {
    const today = new Date().toDateString();
    const lastLogin = gameState.lastLoginDate;

    if (lastLogin !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();

      let newStreak = 1;
      if (lastLogin === yesterdayString) {
        // Consecutive day
        newStreak = gameState.currentStreak + 1;
      }

      // Cap streak at 7 days (weekly cycle)
      if (newStreak > 7) {
        newStreak = 1;
        // Reset all daily rewards for new cycle
        setGameState(prev => ({
          ...prev,
          dailyRewards: DAILY_REWARDS.map(reward => ({ ...reward, claimed: false })),
          lastLoginDate: today,
          currentStreak: newStreak,
        }));
        saveDailyRewards(DAILY_REWARDS.map(reward => ({ ...reward, claimed: false })));
        saveLastLoginDate(today);
        saveCurrentStreak(newStreak);
      } else {
        setGameState(prev => ({
          ...prev,
          lastLoginDate: today,
          currentStreak: newStreak,
        }));
        saveLastLoginDate(today);
        saveCurrentStreak(newStreak);
      }

      // Update login streak achievement
      updateAchievementProgress('login_streak', newStreak);
    }
  };

  const claimDailyReward = (day: number) => {
    const rewardIndex = day - 1;
    if (rewardIndex >= 0 && rewardIndex < gameState.dailyRewards.length) {
      const reward = gameState.dailyRewards[rewardIndex];
      if (!reward.claimed && day <= gameState.currentStreak) {
        const updatedRewards = [...gameState.dailyRewards];
        updatedRewards[rewardIndex] = { ...reward, claimed: true };

        setGameState(prev => ({
          ...prev,
          dailyRewards: updatedRewards,
          collectedCoins: prev.collectedCoins + reward.coins,
        }));

        saveDailyRewards(updatedRewards);
        saveCoins(gameState.collectedCoins + reward.coins);
      }
    }
  };

  // Achievement system
  const updateAchievementProgress = (achievementId: string, progress: number) => {
    setGameState(prev => {
      const updatedAchievements = prev.achievements.map(achievement => {
        if (achievement.id === achievementId && !achievement.completed) {
          const newProgress = Math.max(achievement.progress, progress);
          const completed = newProgress >= achievement.requirement;

          if (completed && !achievement.completed) {
            // Award coins for completing achievement
            const newCoins = prev.collectedCoins + achievement.reward;
            saveCoins(newCoins);
            setTimeout(() => {
              setGameState(prevState => ({
                ...prevState,
                collectedCoins: newCoins
              }));
            }, 0);
          }

          return {
            ...achievement,
            progress: newProgress,
            completed: completed,
          };
        }
        return achievement;
      });

      saveAchievements(updatedAchievements);
      return {
        ...prev,
        achievements: updatedAchievements,
      };
    });
  };

  // Game control functions
  const startGame = () => {
    setGameState(prev => {
      const newTotalGamesPlayed = prev.totalGamesPlayed + 1;
      saveTotalGamesPlayed(newTotalGamesPlayed);

      // Update achievements for first game and total games played
      updateAchievementProgress('first_game', newTotalGamesPlayed);
      updateAchievementProgress('play_10_games', newTotalGamesPlayed);

      return {
        ...prev,
        ball: {
          position: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
          velocity: { x: 0, y: 0 },
          radius: BASE_CONFIG.ballRadius,
        },
        obstacles: [],
        coins: [],
        score: 0,
        currentScreen: 'playing',
        totalGamesPlayed: newTotalGamesPlayed,
        canWatchAdToContinue: true, // Enable watch ad for continue for each new game
      };
    });
  };

  const returnToMenu = () => {
    setGameState(prev => ({ ...prev, currentScreen: 'menu' }));
  };

  const goToStore = () => {
    setGameState(prev => ({ ...prev, currentScreen: 'store' }));
  };

  const goToLeaderboard = () => {
    setGameState(prev => ({ ...prev, currentScreen: 'leaderboard' }));
  };

  const goToAchievements = () => {
    setGameState(prev => ({ ...prev, currentScreen: 'achievements' }));
  };

  const restartGame = () => {
    startGame();
  };

  const watchAdToContinue = () => {
    // In a real app, this would trigger an ad SDK (e.g., AdMob, Unity Ads)
    // For demo purposes, we'll simulate ad completion
    alert('Ad would play here! In real app, this would integrate with ad networks.');

    // Continue the game by resetting ball position and some velocity
    setGameState(prev => ({
      ...prev,
      ball: {
        position: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
        velocity: { x: 0, y: -3 }, // Give a small upward boost
        radius: BASE_CONFIG.ballRadius,
      },
      currentScreen: 'playing',
      canWatchAdToContinue: false, // Disable for this session
    }));
  };

  // Leaderboard functions
  const submitScore = (finalScore: number, coinsEarned: number) => {
    const currentTime = Date.now();
    const playerName = gameState.playerName;
    const skinUsed = gameState.selectedSkin;

    // Find existing player entry or create new one
    const existingPlayerIndex = gameState.leaderboard.findIndex(entry => entry.playerName === playerName);

    let updatedLeaderboard = [...gameState.leaderboard];

    if (existingPlayerIndex >= 0) {
      // Update existing player's best scores
      const existingEntry = updatedLeaderboard[existingPlayerIndex];
      const updatedEntry: LeaderboardEntry = {
        ...existingEntry,
        bestTime: Math.max(existingEntry.bestTime, finalScore),
        bestCoins: Math.max(existingEntry.bestCoins, coinsEarned),
        bestTimeTimestamp: finalScore > existingEntry.bestTime ? currentTime : existingEntry.bestTimeTimestamp,
        bestCoinsTimestamp: coinsEarned > existingEntry.bestCoins ? currentTime : existingEntry.bestCoinsTimestamp,
        bestTimeSkin: finalScore > existingEntry.bestTime ? skinUsed : existingEntry.bestTimeSkin,
        bestCoinsSkin: coinsEarned > existingEntry.bestCoins ? skinUsed : existingEntry.bestCoinsSkin,
      };
      updatedLeaderboard[existingPlayerIndex] = updatedEntry;
    } else {
      // Create new player entry
      const newEntry: LeaderboardEntry = {
        id: Date.now().toString(),
        playerName,
        bestTime: finalScore,
        bestCoins: coinsEarned,
        bestTimeTimestamp: currentTime,
        bestCoinsTimestamp: currentTime,
        bestTimeSkin: skinUsed,
        bestCoinsSkin: skinUsed,
      };
      updatedLeaderboard.push(newEntry);
    }

    setGameState(prev => ({ ...prev, leaderboard: updatedLeaderboard }));
    saveLeaderboard(updatedLeaderboard);
  };

  const switchLeaderboardCategory = (category: LeaderboardCategory) => {
    setGameState(prev => ({ ...prev, leaderboardCategory: category }));
  };

  // Store functions
  const purchaseSkinWithCoins = (skinId: string) => {
    const skin = BALL_SKINS.find(s => s.id === skinId);
    if (skin && gameState.collectedCoins >= skin.coinPrice && !gameState.unlockedSkins.includes(skinId)) {
      const newUnlockedSkins = [...gameState.unlockedSkins, skinId];
      setGameState(prev => ({
        ...prev,
        collectedCoins: prev.collectedCoins - skin.coinPrice,
        unlockedSkins: newUnlockedSkins,
        selectedSkin: skinId,
      }));
      saveCoins(gameState.collectedCoins - skin.coinPrice);
      saveUnlockedSkins(newUnlockedSkins);
      saveSelectedSkin(skinId);
    }
  };

  const selectSkin = (skinId: string) => {
    if (gameState.unlockedSkins.includes(skinId)) {
      setGameState(prev => ({ ...prev, selectedSkin: skinId }));
      saveSelectedSkin(skinId);
    }
  };

  // Mock cash purchase function (would integrate with real payment system)
  const purchaseSkinWithCash = (skinId: string) => {
    // In real app, this would trigger payment flow
    alert('Cash purchase would integrate with App Store/Google Play billing');
    // For demo, just unlock the skin
    const newUnlockedSkins = [...gameState.unlockedSkins, skinId];
    setGameState(prev => ({
      ...prev,
      unlockedSkins: newUnlockedSkins,
      selectedSkin: skinId,
    }));
    saveUnlockedSkins(newUnlockedSkins);
    saveSelectedSkin(skinId);
  };

  // Handle game over and high score
  useEffect(() => {
    if (gameState.currentScreen === 'gameOver') {
      const finalScore = Math.floor(gameState.score / 60);
      const coinsThisRound = gameState.collectedCoins;

      // Submit to leaderboard
      submitScore(finalScore, coinsThisRound);

      // Update high score
      if (finalScore > gameState.highScore) {
        setGameState(prev => ({ ...prev, highScore: finalScore }));
        saveHighScore(finalScore);
      }

      // Update achievements
      updateAchievementProgress('survive_60s', finalScore);
      updateAchievementProgress('survive_120s', finalScore);
      updateAchievementProgress('collect_50_coins', coinsThisRound);
      updateAchievementProgress('collect_100_one_game', coinsThisRound);
      updateAchievementProgress('collect_3_skins', gameState.unlockedSkins.length);
    }
  }, [gameState.currentScreen, gameState.score, gameState.highScore]);

  const getObstacleColor = (type: string) => {
    switch (type) {
      case 'cone': return '#FF6B35';
      case 'goalpost': return '#FFD23F';
      case 'defender': return '#FF4081';
      default: return '#FF6B35';
    }
  };

  const getCurrentSkinEmoji = () => {
    const skin = BALL_SKINS.find(s => s.id === gameState.selectedSkin);
    return skin ? skin.emoji : '⚽';
  };

  // Menu Screen Component
  const renderMenuScreen = () => (
    <View style={{ flex: 1, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' }}>
      {/* Coins display */}
      <View style={{ position: 'absolute', top: 50, left: 20 }}>
        <Text style={{ fontSize: 18, color: 'white', fontWeight: 'bold' }}>
          🪙 {gameState.collectedCoins}
        </Text>
      </View>

      <Text style={{ fontSize: 48, fontWeight: 'bold', color: 'white', marginBottom: 10, textAlign: 'center' }}>
        {getCurrentSkinEmoji()} JUGGLE JAM
      </Text>
      <Text style={{ fontSize: 16, color: 'white', marginBottom: 40, textAlign: 'center', opacity: 0.8 }}>
        Soccer Ball Flappy Bird Adventure
      </Text>

      {gameState.highScore > 0 && (
        <Text style={{ fontSize: 20, color: 'white', marginBottom: 30 }}>
          High Score: {gameState.highScore}s
        </Text>
      )}

      <TouchableOpacity
        onPress={startGame}
        style={{
          backgroundColor: 'white',
          paddingHorizontal: 40,
          paddingVertical: 15,
          borderRadius: 30,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#4CAF50' }}>
          START GAME
        </Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        <TouchableOpacity
          onPress={goToStore}
          style={{
            backgroundColor: '#FFD700',
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 25,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>
            🛍️ STORE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToLeaderboard}
          style={{
            backgroundColor: '#FF6B35',
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 25,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: 'white' }}>
            🏆 LEADERBOARD
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToAchievements}
          style={{
            backgroundColor: '#9C27B0',
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 25,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: 'white' }}>
            🎯 ACHIEVEMENTS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Daily Rewards Section */}
      {gameState.currentStreak > 0 && (
        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 30, padding: 15, borderRadius: 15, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 10 }}>
            🎁 Daily Rewards - Day {gameState.currentStreak}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 5 }}>
            <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 5 }}>
              {gameState.dailyRewards.map((reward, index) => {
                const day = index + 1;
                const isAvailable = day <= gameState.currentStreak;
                const isClaimed = reward.claimed;
                const canClaim = isAvailable && !isClaimed;

                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => canClaim && claimDailyReward(day)}
                    disabled={!canClaim}
                    style={{
                      backgroundColor: isClaimed ? '#4CAF50' : isAvailable ? '#FFD700' : 'rgba(255,255,255,0.3)',
                      padding: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      minWidth: 60,
                      borderWidth: 2,
                      borderColor: isClaimed ? '#4CAF50' : isAvailable ? '#FFD700' : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: isAvailable ? '#333' : 'white' }}>
                      Day {day}
                    </Text>
                    <Text style={{ fontSize: 10, color: isAvailable ? '#333' : 'white' }}>
                      🪙 {reward.coins}
                    </Text>
                    {isClaimed && <Text style={{ fontSize: 16, color: '#4CAF50' }}>✅</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      <Text style={{ fontSize: 14, color: 'white', textAlign: 'center', marginTop: 20, opacity: 0.7 }}>
        Tap left/right of the ball to steer{'\n'}
        Every tap makes the ball go up!
      </Text>
    </View>
  );

  // Game Over Screen Component
  const renderGameOverScreen = () => (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Text style={{ fontSize: 36, fontWeight: 'bold', color: 'white', marginBottom: 20 }}>
        Game Over!
      </Text>
      <Text style={{ fontSize: 24, color: 'white', marginBottom: 10 }}>
        Score: {Math.floor(gameState.score / 60)}s
      </Text>
      {Math.floor(gameState.score / 60) === gameState.highScore && gameState.highScore > 0 && (
        <Text style={{ fontSize: 18, color: '#FFD700', marginBottom: 20 }}>
          🏆 NEW HIGH SCORE! 🏆
        </Text>
      )}
      <Text style={{ fontSize: 16, color: 'white', marginBottom: 30 }}>
        High Score: {gameState.highScore}s
      </Text>

      {/* Watch Ad to Continue Button */}
      {gameState.canWatchAdToContinue && (
        <TouchableOpacity
          onPress={watchAdToContinue}
          style={{
            backgroundColor: '#FF6B35',
            paddingHorizontal: 30,
            paddingVertical: 15,
            borderRadius: 25,
            marginBottom: 15,
          }}
        >
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
            📺 Watch Ad to Continue
          </Text>
        </TouchableOpacity>
      )}

      <View style={{ flexDirection: 'row', gap: 20 }}>
        <TouchableOpacity
          onPress={restartGame}
          style={{
            backgroundColor: '#4CAF50',
            paddingHorizontal: 30,
            paddingVertical: 15,
            borderRadius: 25,
          }}
        >
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
            Play Again
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={returnToMenu}
          style={{
            backgroundColor: '#666',
            paddingHorizontal: 30,
            paddingVertical: 15,
            borderRadius: 25,
          }}
        >
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
            Menu
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Store Screen Component
  const renderStoreScreen = () => (
    <View style={{ flex: 1, backgroundColor: '#4CAF50' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={returnToMenu}
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 20 }}
        >
          <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>🛍️ STORE</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>🪙 {gameState.collectedCoins}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 18, color: 'white', fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>
          Ball Skins
        </Text>

        {BALL_SKINS.map((skin) => {
          const isUnlocked = gameState.unlockedSkins.includes(skin.id);
          const isSelected = gameState.selectedSkin === skin.id;
          const canAfford = gameState.collectedCoins >= skin.coinPrice;

          return (
            <View
              key={skin.id}
              style={{
                backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                marginBottom: 15,
                borderRadius: 15,
                padding: 15,
                borderWidth: isSelected ? 2 : 0,
                borderColor: 'white',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 40, marginRight: 15 }}>{skin.emoji}</Text>
                  <View>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>{skin.name}</Text>
                    {isSelected && <Text style={{ color: '#FFD700', fontSize: 14 }}>✓ Selected</Text>}
                    {isUnlocked && !isSelected && <Text style={{ color: '#90EE90', fontSize: 14 }}>Owned</Text>}
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  {isUnlocked ? (
                    isSelected ? (
                      <View style={{ backgroundColor: '#FFD700', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 }}>
                        <Text style={{ color: '#333', fontWeight: 'bold' }}>Selected</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => selectSkin(skin.id)}
                        style={{ backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 }}
                      >
                        <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>Select</Text>
                      </TouchableOpacity>
                    )
                  ) : (
                    <View>
                      {skin.coinPrice > 0 && (
                        <TouchableOpacity
                          onPress={() => purchaseSkinWithCoins(skin.id)}
                          disabled={!canAfford}
                          style={{
                            backgroundColor: canAfford ? '#FFD700' : '#666',
                            paddingHorizontal: 15,
                            paddingVertical: 8,
                            borderRadius: 20,
                            marginBottom: 5,
                          }}
                        >
                          <Text style={{ color: canAfford ? '#333' : '#ccc', fontWeight: 'bold' }}>
                            🪙 {skin.coinPrice}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {skin.cashPrice > 0 && (
                        <TouchableOpacity
                          onPress={() => purchaseSkinWithCash(skin.id)}
                          style={{
                            backgroundColor: '#4CAF50',
                            paddingHorizontal: 15,
                            paddingVertical: 8,
                            borderRadius: 20,
                          }}
                        >
                          <Text style={{ color: 'white', fontWeight: 'bold' }}>
                            ${(skin.cashPrice / 100).toFixed(2)}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );

  // Leaderboard Screen Component
  const renderLeaderboardScreen = () => {
    // Sort leaderboard based on current category
    const sortedLeaderboard = [...gameState.leaderboard].sort((a, b) => {
      if (gameState.leaderboardCategory === 'time') {
        return b.bestTime - a.bestTime;
      } else {
        return b.bestCoins - a.bestCoins;
      }
    }).slice(0, 10); // Top 10

    return (
      <View style={{ flex: 1, backgroundColor: '#4CAF50' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={returnToMenu}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 20 }}
          >
            <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>🏆 LEADERBOARD</Text>

          <View style={{ width: 60 }} />
        </View>

        {/* Category Tabs */}
        <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 25, padding: 4 }}>
          <TouchableOpacity
            onPress={() => switchLeaderboardCategory('time')}
            style={{
              flex: 1,
              backgroundColor: gameState.leaderboardCategory === 'time' ? 'white' : 'transparent',
              paddingVertical: 12,
              borderRadius: 20,
              alignItems: 'center',
            }}
          >
            <Text style={{
              color: gameState.leaderboardCategory === 'time' ? '#4CAF50' : 'white',
              fontWeight: 'bold',
              fontSize: 16,
            }}>
              ⏱️ Best Time
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => switchLeaderboardCategory('coins')}
            style={{
              flex: 1,
              backgroundColor: gameState.leaderboardCategory === 'coins' ? 'white' : 'transparent',
              paddingVertical: 12,
              borderRadius: 20,
              alignItems: 'center',
            }}
          >
            <Text style={{
              color: gameState.leaderboardCategory === 'coins' ? '#4CAF50' : 'white',
              fontWeight: 'bold',
              fontSize: 16,
            }}>
              🪙 Most Coins
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
          {sortedLeaderboard.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
              <Text style={{ fontSize: 18, color: 'white', textAlign: 'center', opacity: 0.7 }}>
                No scores yet!{'\n'}Play a game to get on the leaderboard.
              </Text>
            </View>
          ) : (
            sortedLeaderboard.map((entry, index) => {
              const isPlayerScore = entry.playerName === gameState.playerName;
              const currentCategory = gameState.leaderboardCategory;
              const score = currentCategory === 'time' ? entry.bestTime : entry.bestCoins;
              const skinEmoji = BALL_SKINS.find(s => s.id === (currentCategory === 'time' ? entry.bestTimeSkin : entry.bestCoinsSkin))?.emoji || '⚽';
              const timeAgo = new Date(currentCategory === 'time' ? entry.bestTimeTimestamp : entry.bestCoinsTimestamp).toLocaleDateString();

              return (
                <View
                  key={entry.id}
                  style={{
                    backgroundColor: isPlayerScore ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)',
                    marginBottom: 12,
                    borderRadius: 15,
                    padding: 15,
                    borderWidth: isPlayerScore ? 2 : 0,
                    borderColor: '#FFD700',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={{
                        width: 35,
                        height: 35,
                        borderRadius: 17.5,
                        backgroundColor: index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#666',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 15,
                      }}>
                        <Text style={{
                          color: index < 3 ? '#333' : 'white',
                          fontWeight: 'bold',
                          fontSize: 16,
                        }}>
                          {index + 1}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                          <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white', marginRight: 8 }}>
                            {entry.playerName}
                          </Text>
                          <Text style={{ fontSize: 16 }}>{skinEmoji}</Text>
                          {isPlayerScore && (
                            <Text style={{ fontSize: 12, color: '#FFD700', marginLeft: 8, fontWeight: 'bold' }}>
                              (YOU)
                            </Text>
                          )}
                        </View>
                        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                          {timeAgo} • {currentCategory === 'time' ? `${entry.bestCoins} coins` : `${entry.bestTime}s survived`}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>
                        {currentCategory === 'time' ? `${score}s` : `${score} 🪙`}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  };

  // Achievements Screen Component
  const renderAchievementsScreen = () => (
    <View style={{ flex: 1, backgroundColor: '#4CAF50' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={returnToMenu}
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 20 }}
        >
          <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>🎯 ACHIEVEMENTS</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>🪙 {gameState.collectedCoins}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
        {gameState.achievements.map((achievement) => {
          const progressPercentage = Math.min((achievement.progress / achievement.requirement) * 100, 100);
          const isCompleted = achievement.completed;

          return (
            <View
              key={achievement.id}
              style={{
                backgroundColor: isCompleted ? 'rgba(76,175,80,0.3)' : 'rgba(255,255,255,0.1)',
                marginBottom: 15,
                borderRadius: 15,
                padding: 15,
                borderWidth: isCompleted ? 2 : 0,
                borderColor: '#4CAF50',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 30, marginRight: 15 }}>{achievement.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>{achievement.title}</Text>
                    {isCompleted && <Text style={{ color: '#4CAF50', fontSize: 20 }}>✅</Text>}
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 3 }}>
                    {achievement.description}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={{ marginBottom: 10 }}>
                <View style={{
                  height: 8,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 4,
                  overflow: 'hidden'
                }}>
                  <View style={{
                    height: '100%',
                    width: `${progressPercentage}%`,
                    backgroundColor: isCompleted ? '#4CAF50' : '#FFD700',
                    borderRadius: 4
                  }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                    {achievement.progress} / {achievement.requirement}
                  </Text>
                  <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: 'bold' }}>
                    🪙 {achievement.reward}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );

  // Game Screen Component
  const renderGameScreen = () => (
    <TouchableWithoutFeedback onPress={handleScreenPress}>
      <View style={{ flex: 1, backgroundColor: '#4CAF50' }}>
      {/* Ball */}
      <View
        style={{
          position: 'absolute',
          left: gameState.ball.position.x - BASE_CONFIG.ballRadius,
          top: gameState.ball.position.y - BASE_CONFIG.ballRadius,
          width: BASE_CONFIG.ballRadius * 2,
          height: BASE_CONFIG.ballRadius * 2,
          borderRadius: BASE_CONFIG.ballRadius,
          backgroundColor: 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: BASE_CONFIG.ballRadius * 1.5 }}>
          {getCurrentSkinEmoji()}
        </Text>
      </View>

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

      {/* Coins */}
      {gameState.coins.map((coin) => (
        <View
          key={coin.id}
          style={{
            position: 'absolute',
            left: coin.position.x - coin.radius,
            top: coin.position.y - coin.radius,
            width: coin.radius * 2,
            height: coin.radius * 2,
            borderRadius: coin.radius,
            backgroundColor: '#FFD700',
            borderWidth: 2,
            borderColor: '#FFA500',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: coin.radius, fontWeight: 'bold', color: '#B8860B' }}>
            {coin.value === 1 ? '🪙' : '💰'}
          </Text>
        </View>
      ))}

      {/* Score and Difficulty */}
      <View style={{ position: 'absolute', top: 50, left: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
          Score: {Math.floor(gameState.score / 60)}s
        </Text>
        <Text style={{ fontSize: 16, color: 'white', marginTop: 5 }}>
          Speed: {getDifficultyMultiplier(gameState.score).speedMultiplier.toFixed(1)}x
        </Text>
      </View>

      {/* Coins display during gameplay */}
      <View style={{ position: 'absolute', top: 50, right: 20 }}>
        <Text style={{ fontSize: 18, color: 'white', fontWeight: 'bold' }}>
          🪙 {gameState.collectedCoins}
        </Text>
      </View>

      </View>
    </TouchableWithoutFeedback>
  );

  // Main render logic
  return (
    <View style={{ flex: 1 }}>
      {gameState.currentScreen === 'menu' && renderMenuScreen()}
      {gameState.currentScreen === 'store' && renderStoreScreen()}
      {gameState.currentScreen === 'leaderboard' && renderLeaderboardScreen()}
      {gameState.currentScreen === 'achievements' && renderAchievementsScreen()}
      {gameState.currentScreen === 'playing' && renderGameScreen()}
      {gameState.currentScreen === 'gameOver' && (
        <>
          {renderGameScreen()}
          {renderGameOverScreen()}
        </>
      )}
    </View>
  );
};