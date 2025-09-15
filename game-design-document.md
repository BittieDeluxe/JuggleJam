# 📝 Game Design Document — Soccer Juggling Master (Working Title)

## 🎮 Core Concept
An arcade "tap-to-juggle" game inspired by Flappy Bird mechanics but with soccer juggling gameplay. The player taps to keep a soccer ball in the air, fighting gravity to achieve the highest consecutive juggle count. Pure skill-based gameplay with realistic ball physics.

---

## 🕹 Gameplay Loop
- Game starts with ball dropping from center screen
- **Tap anywhere** → ball gets kicked upward with slight random angle
- **Gravity** constantly pulls ball downward
- Keep ball in air by timing taps perfectly
- **Score = consecutive successful juggles**
- **Game Over** → ball touches the ground  

---

## 🏃 Player Character
- **Default**: Classic black/white soccer ball.  
- **Animation**: Subtle spin, glowing trail.  
- **Tap FX**: Ball “pops” slightly with kick sound.  
- **Variants/Skins**:  
  - Gold ball  
  - Flame trail ball  
  - Country flag balls  
  - Retro leather ball  

---

## 🚧 Challenges & Difficulty
- **Primary Challenge**: Fighting gravity - ball constantly falls
- **Secondary Challenge**: Ball drifts horizontally with each kick
- **Progressive Difficulty:**
  - Gravity slightly increases every 25 juggles
  - Wind effects add horizontal drift after juggle 50
  - Ball size shrinks slightly at higher juggle counts
- **Boundaries**: Ball touching ground = game over  

---

## 🌆 Background & Environment
- **Stationary Background** (no scrolling)
- **Default Training Ground:**
  - Grass field at bottom (the "danger zone")
  - Soccer goals and training equipment in background
  - Subtle stadium/training facility atmosphere
- **Player Character**: Static soccer player at bottom center doing kick animations
- **Optional Alternates (updates/skins):**
  - Professional stadium with crowds
  - Street court with urban elements
  - Backyard/park setting  

---

## 📊 Scoring & HUD
- **Counter**: Top center → Juggles: `47`
- **Units**: Simple count of consecutive successful touches
- **Feedback:**
  - Every 10 juggles → crowd cheer + visual celebration
  - Major milestones (25, 50, 100) → bigger celebrations
  - End screen → "You juggled the ball 47 times!"  

---

## 🎵 Audio
- **Tap (kick):** Satisfying ball contact sound
- **Successful juggle:** Subtle positive feedback sound
- **Milestones (10, 25, 50, etc.):** Crowd cheers and celebration sounds
- **Game Over:** Ball hitting ground + disappointed crowd sound
- **Background loop:** Subtle training ground ambience  

---

## 📈 Monetization / Retention
- **Cosmetic unlocks**: Different balls, player characters, backgrounds
- **Achievement system**: Milestone rewards (first 25 juggles, 100 juggles, etc.)
- **Leaderboard**: Highest juggle count competitions
- **Seasonal events**: Special themed content (World Cup, local tournaments)  

---

## ✅ MVP Checklist
- [ ] Tap controls & ball physics tuned (realistic, responsive)
- [ ] Ground collision detection (game over trigger)
- [ ] Static training ground background
- [ ] Juggle counter + end screen
- [ ] Ball spin animation and trail effects
- [ ] Player character kick animations
- [ ] Ground impact sound + visual feedback  

---

## ⚡ End Result
A quick, addictive soccer juggling game that uses **Flappy Bird's proven mechanics** but creates a **legally distinct, skill-based experience** focused on realistic ball physics and timing precision.

---

## 📋 Related Documents
- **[Technical Conversion Guide](technical-conversion.md)**: Detailed implementation roadmap for converting Flappy Bird code to Soccer Juggling mechanics
