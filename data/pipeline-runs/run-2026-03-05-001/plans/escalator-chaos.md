# Game Design Document: Escalator Chaos

- **Title**: Escalator Chaos
- **Slug**: escalator-chaos
- **Version**: 1.0
- **Date**: 2026-03-05
- **Score**: 71.3

---

## 1. Overview

**Tagline**: Shove commuters onto the right escalator before the rush hour collapses civilization.

**Genre**: Frantic swipe/sort arcade
**Platform**: Mobile browser, portrait 360–428px, touch-only
**Session Length**: 60–120 seconds per run
**Core Fantasy**: You are the one exhausted station attendant trying to prevent a subway riot by physically shoving commuters onto the correct escalator before the crowd overflows.

**Why It's Fun**:
Commuters shuffle in from the top. Each has a visible destination icon (Up arrow / Down arrow, or colored zone: Red/Blue). You swipe them left or right into the correct escalator lane. Wrong lane = angry commuter blocks the lane. Too slow = overflow. Correct streaks reward you with crowd clears and score multipliers. The chaos escalates — faster spawns, confused commuters who shuffle around, tourists who stop to take photos. Schadenfreude of the relatable commute hell is the emotional hook.

---

## 2. Game Mechanics

### 2.1 Core Loop

1. Commuters spawn from the top-center queue, 1–3 at a time.
2. Player swipes a commuter LEFT (Down escalator) or RIGHT (Up escalator).
3. Correct swipe → commuter walks onto escalator, score increases, streak increments.
4. Wrong swipe → commuter blocks lane, angry icon appears, score multiplier resets.
5. Commuter reaches bottom of screen without being swiped → overflow count +1.
6. Overflow count reaches 5 → Game Over.
7. Every 10 correct swipes → Stage Clear bonus, difficulty increases.

### 2.2 Controls

- **Swipe Left**: Route commuter to LEFT escalator (Down lane).
- **Swipe Right**: Route commuter to RIGHT escalator (Up lane).
- **Swipe Up**: (Power move, unlocks at streak ×5) Clear the front commuter and send them home — removes without scoring, resets streak but clears a blocker.
- **Tap**: No action (prevents accidental taps triggering swipes).
- Touch detection threshold: ≥30px horizontal drag = swipe, ≥50px vertical drag = swipe up.

### 2.3 Scoring

| Action | Base Points |
|---|---|
| Correct swipe | 10 pts |
| Correct swipe (streak ×2) | 20 pts |
| Correct swipe (streak ×3) | 30 pts |
| Correct swipe (streak ×5+) | 50 pts |
| Stage Clear (every 10 correct) | 100 pts bonus |
| Wrong lane | 0 pts, streak reset |
| Overflow commuter | -20 pts |

**Streak multiplier**: streak_count / 5, floored to integer, max ×5.
**Score display**: Live score top-center, streak counter top-right.

### 2.4 Progression

Difficulty increases every 10 correct swipes (Stage N):

| Stage | Spawn Rate | Max Queue | Special Events |
|---|---|---|---|
| 1–2 | 1 commuter / 2.0s | 3 | None |
| 3–5 | 1 commuter / 1.5s | 4 | Tourist (stops 1.5s) |
| 6–9 | 1 commuter / 1.2s | 5 | Tourist, Confused (50% chance wrong icon) |
| 10–14 | 1 commuter / 1.0s | 6 | Tourist, Confused, Double spawn |
| 15+ | 1 commuter / 0.8s | 7 | All events + Sprint commuter (0.5s window) |

### 2.5 Failure Conditions

- **Overflow**: 5 commuters reach bottom without being sorted → Game Over.
- **Inactivity Death**: No player input for 12 consecutive seconds → Game Over (crowd overflows instantly, 5 angry commuters swarm screen).
- **Overflow bar**: Visual bar top of screen, fills with each overflow. At 5 overflows, flashes red 3 times, then Game Over.

### 2.6 Commuter Types

| Type | Visual | Behavior |
|---|---|---|
| Normal | Suit with arrow | Walks at standard speed, clear destination icon |
| Tourist | Camera around neck | Pauses 1.5s mid-queue, taking photo flash |
| Confused | Question mark above head | Icon flips direction 1× during approach |
| Sprint | Running shoes | Moves 2× speed, only 0.5s swipe window |
| VIP | Briefcase + tie | Worth ×3 points if correct, -50 pts if wrong |

---

## 3. Stage Design

### 3.1 Infinite Stage Generation

Stages are procedurally generated. Each stage = 10 correct swipes to clear.

**Difficulty Parameters per Stage N**:
```
spawnInterval = max(0.6, 2.0 - (N * 0.09)) seconds
maxQueueSize = min(7, 3 + floor(N / 2))
touristChance = min(0.4, N * 0.025)
confusedChance = min(0.35, max(0, (N - 4) * 0.04))
sprintChance = min(0.25, max(0, (N - 10) * 0.03))
vipChance = min(0.15, max(0, (N - 5) * 0.02))
doubleSpawnChance = min(0.3, max(0, (N - 8) * 0.035))
```

**Stage Intro**: Stage number displayed center-screen for 600ms with scale-in animation before commuters begin spawning.

### 3.2 Queue Layout

- Queue area: top 40% of screen (y: 80–280px in 360px wide view).
- Commuters stack vertically, each occupying 60×60px area.
- Max 7 visible in queue; overflow bar fills when queue exceeds max.
- Two escalator zones at bottom: LEFT (x: 0–170px) and RIGHT (x: 190–360px), 10px gap between.

---

## 4. Visual Design

### 4.1 Color Palette

| Element | Hex |
|---|---|
| Background | `#1A1A2E` (deep navy) |
| Escalator Left (Down) | `#E94560` (red-pink) |
| Escalator Right (Up) | `#0F3460` (deep blue) with `#16213E` |
| Escalator steps | `#533483` (purple) |
| Normal Commuter skin | `#F4A261` |
| Normal Commuter suit | `#2D6A4F` (green) |
| Tourist suit | `#E9C46A` (yellow) |
| Confused commuter | `#E76F51` (orange) |
| Sprint commuter | `#90E0EF` (cyan) |
| VIP commuter | `#FFD700` (gold) |
| Correct flash | `#57CC99` |
| Wrong flash | `#FF6B6B` |
| UI text | `#EAEAEA` |
| Score background | `rgba(0,0,0,0.6)` |
| Overflow bar fill | `#E94560` |
| Overflow bar bg | `#16213E` |

### 4.2 SVG Character Specs

All characters are inline SVG, 48×60px viewBox.

**Normal Commuter** (SVG structure):
- Head: circle cx=24 cy=10 r=10, fill=`#F4A261`
- Body: rect x=14 y=22 w=20 h=24, fill=suit color (varies by type)
- Left arm: rect x=8 y=24 w=6 h=16, fill=suit color
- Right arm: rect x=34 y=24 w=6 h=16, fill=suit color
- Left leg: rect x=14 y=46 w=8 h=14, fill=`#2C3E50`
- Right leg: rect x=26 y=46 w=8 h=14, fill=`#2C3E50`
- Destination icon: text at top of character, 12px, bold

**Destination Icons** (rendered as emoji/SVG text above character):
- Up escalator: "▲" in `#57CC99`
- Down escalator: "▼" in `#E94560`

**Escalator Visual**:
- Two side-by-side rectangles, each 165×200px
- Diagonal step lines at 45°, stroke `#533483`, stroke-width 2
- Arrow indicator at top (Up) and bottom (Down) of each escalator
- Moving animation: step lines scroll at 40px/s

### 4.3 UI Elements

- **Score**: Top-center, 24px bold white, drop shadow
- **Streak**: Top-right, "×N" format, 20px, color shifts: white→yellow→orange→red at ×2/×3/×5
- **Overflow Bar**: Top-left, 80px wide × 12px tall, red fill, 5 tick marks
- **Stage Banner**: Center-screen, 200×60px rect, 32px bold text, appears 600ms then fades
- **Game Over Screen**: Full-screen darkened overlay, "GAME OVER" 40px centered, score, best score, RESTART button

---

## 5. Audio

**No audio required for POC** (placeholder stubs in ads.js).

For future implementation:
- Correct swipe: short "swoosh" SFX
- Wrong swipe: "thud" SFX
- Overflow: crowd groan
- Streak ×5: triumphant chime
- Game Over: chaos ambience peak then cut

---

## 6. UI/UX

### 6.1 Screen Flow

```
[Title Screen] → TAP TO PLAY → [Gameplay] → [Game Over] → RESTART → [Gameplay]
```

- **Title Screen**: Game logo, escalator animation looping, "TAP TO PLAY" pulsing text
- **Gameplay HUD**: Score, streak, overflow bar, stage indicator (bottom-right, small)
- **Game Over**: Score, Best Score, RESTART button (large, touch-friendly 160×50px)
- **No pause screen** (POC)

### 6.2 Death → Restart Flow

- Game Over trigger → 300ms screen shake → overlay fades in 200ms → total transition ≤500ms
- RESTART button → clears state, re-initializes scene in ≤300ms
- Total Death→Restart < 2s (target: <800ms)

### 6.3 Touch UX

- Hit area for swipe: entire character bounding box + 15px padding
- Swipe begins on touchstart of any commuter
- Accidental vertical scroll disabled during gameplay (preventDefault on touchmove)
- Portrait lock enforced via CSS

---

## 7. Monetization

**POC Stage — No ads implemented.**

Placeholder stubs in `js/ads.js`:
- `showInterstitial()` → no-op, logs to console
- `showRewarded(callback)` → immediately calls `callback(true)`

Future monetization hooks (post-POC):
- Interstitial after every 3 game-overs
- Rewarded: continue with cleared overflow (1 time per run)

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/escalator-chaos/
├── index.html          (Phaser 3 CDN, canvas setup, meta viewport)
├── css/
│   └── style.css       (body reset, canvas centering, portrait lock)
└── js/
    ├── config.js       (Phaser config, constants, difficulty params)
    ├── main.js         (Phaser Game init, scene registration)
    ├── game.js         (GameScene: core loop, input, physics — ≤300 lines)
    ├── stages.js       (Stage generator, commuter spawn logic — ≤300 lines)
    ├── ui.js           (HUD, title screen, game over screen — ≤300 lines)
    └── ads.js          (Monetization stubs — ≤50 lines)
```

### 8.2 Phaser 3 Configuration

```javascript
// config.js
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const CONFIG = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1A1A2E',
  parent: 'game-container',
  scene: [TitleScene, GameScene, UIScene]
};
```

### 8.3 Key Data Structures

```javascript
// Commuter object
{
  id: uuid,
  type: 'normal' | 'tourist' | 'confused' | 'sprint' | 'vip',
  destination: 'left' | 'right',  // correct escalator
  displayedDestination: 'left' | 'right',  // may differ for Confused type
  x: number, y: number,
  speed: number,  // px per second, descends toward player
  svgKey: string,  // preloaded SVG texture key
  gameObject: Phaser.GameObjects.Image
}

// GameState
{
  score: number,
  bestScore: number,  // localStorage
  streak: number,
  overflowCount: number,  // 0–5
  stage: number,
  lastInputTime: number,  // for 12s inactivity check
  commuters: Commuter[],
  spawnTimer: Phaser.Time.TimerEvent
}
```

### 8.4 Scene Architecture

- **TitleScene**: Logo, tap-to-start, escalator background animation
- **GameScene**: Core gameplay. Manages commuter queue, input, scoring, difficulty escalation
- **UIScene**: Runs in parallel with GameScene (additive). Renders HUD overlay (score, streak, overflow bar)

### 8.5 Input Handling

```javascript
// Touch swipe detection in GameScene
this.input.on('pointerdown', (ptr) => {
  swipeStart = { x: ptr.x, y: ptr.y };
  swipeTarget = getCommuterAtPosition(ptr.x, ptr.y);
});
this.input.on('pointerup', (ptr) => {
  const dx = ptr.x - swipeStart.x;
  const dy = ptr.y - swipeStart.y;
  if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
    handleSwipe(swipeTarget, dx > 0 ? 'right' : 'left');
  } else if (dy < -50 && swipeTarget && streak >= 5) {
    handlePowerSwipe(swipeTarget);
  }
  updateLastInputTime();
});
```

### 8.6 Inactivity Death Implementation

```javascript
// In GameScene update()
const now = this.time.now;
if (now - gameState.lastInputTime > 12000) {
  triggerInactivityDeath();
}

function triggerInactivityDeath() {
  // Spawn 5 angry commuters simultaneously, all overflow instantly
  for (let i = 0; i < 5; i++) spawnAngryCommuter(i * 60);
  this.time.delayedCall(600, () => triggerGameOver('inactivity'));
}
```

---

## 9. Juice Specification

**This section is mandatory. All values are concrete and numeric.**

### 9.1 Correct Swipe Feedback

| Effect | Specification |
|---|---|
| Character fly-out animation | Commuter scales from 1.0 to 0.0 over 200ms, moves 120px toward target escalator |
| Screen flash | White rect full-screen, alpha 0.3 → 0, duration 80ms |
| Particle burst | 8 circle particles, radius 4px, color `#57CC99`, spread 60px radius, duration 300ms |
| Score pop | Score delta text (+10, +20, etc.) spawns at character position, moves up 40px, fades over 400ms, scale 1.0→1.4→0 |
| Streak glow | Streak counter text scale 1.0→1.3→1.0, duration 150ms |
| Hit-stop | Game speed multiplier 0.0 for 30ms, then resume |

### 9.2 Wrong Lane Feedback

| Effect | Specification |
|---|---|
| Screen shake | Camera offset: random ±8px x/y, 5 oscillations over 250ms |
| Character bounce | Commuter bounces back 30px from escalator, scale 1.0→1.2→1.0 over 200ms |
| Red flash | Full-screen red rect, alpha 0.25 → 0, duration 120ms |
| Streak break particles | 6 particles, color `#FF6B6B`, explode from streak counter, 200ms |
| Wrong sound cue | (placeholder) |
| Multiplier reset animation | Streak counter drops from current to 0 with scale 1.3→0.7→1.0 over 200ms |

### 9.3 Overflow Event

| Effect | Specification |
|---|---|
| Commuter fall-off | Commuter moves to bottom at 2× speed, scale 1.0→0.7, alpha 1.0→0, 400ms |
| Overflow bar fill | Bar segment fills with shake animation: bar shakes ±3px x, 3 oscillations, 150ms |
| Screen shake (at 4 overflow) | ±12px x/y, 6 oscillations, 300ms |
| Screen shake (at 5 overflow) | ±20px x/y, 8 oscillations, 400ms |

### 9.4 Stage Clear Bonus

| Effect | Specification |
|---|---|
| Stage clear banner | Scale from 0.5→1.2→1.0 over 400ms, hold 600ms, fade out 200ms |
| Confetti burst | 20 particles, 5 colors (`#57CC99`, `#FFD700`, `#E94560`, `#90E0EF`, `#EAEAEA`), spread 200px, duration 800ms |
| Score bonus pop | "+100" text, 40px bold, center screen, moves up 60px, fades 600ms |
| Background flash | Background color flashes `#533483` → `#1A1A2E` over 300ms |

### 9.5 Game Over Effects

| Effect | Specification |
|---|---|
| Final screen shake | ±20px x/y, 10 oscillations, 500ms |
| Overlay fade-in | Black overlay alpha 0→0.85 over 200ms |
| "GAME OVER" text | Scale 0→1.2→1.0 over 400ms, red color `#E94560` |
| Score tally | Score counts up from 0 to final score over 600ms |
| Commuter scatter | All remaining commuters scatter: random velocity ±300px/s, rotate ±720°, fade out 600ms |

### 9.6 Streak Milestone Effects

| Streak | Effect |
|---|---|
| ×2 | Score text turns yellow, brief 100ms scale pulse |
| ×3 | Score text turns orange, 150ms scale 1.0→1.2→1.0, screen edge glow orange |
| ×5 | Score text turns red, 200ms scale 1.0→1.5→1.0, full screen edge glow red pulse, "COMBO!" text center 500ms |
| ×10 | "UNSTOPPABLE!" text center-screen 800ms, rainbow color cycle on score text 1s |

### 9.7 VIP Commuter

| Effect | Specification |
|---|---|
| Spawn announcement | Golden ring appears around VIP commuter, scale 0→1.3→1.0 over 300ms |
| Correct routing | Gold coin burst: 12 particles, radius 6px, color `#FFD700`, spread 80px, 400ms |
| Wrong routing | VIP gets angry red face, angry particles (red, 8 particles), -50pts penalty shown 600ms |

---

## 10. Implementation Notes

### 10.1 Critical Implementation Rules

1. **No Matter.js** — use Phaser tweens and manual position updates only. No physics engine needed.
2. **SVG rendering**: Create SVG strings in JS, convert to Phaser textures via `this.textures.addBase64()` or draw directly to Graphics objects. Do not use external SVG files.
3. **Commuter movement**: Update y position in `update()` loop. `commuter.y += commuter.speed * delta / 1000`. Speed in px/s.
4. **Queue management**: Commuters descend from y=80 toward y=400 (swipe zone). Below y=480 = overflow.
5. **Swipe zone**: Commuter is swiped-able while its y is between 280–420px (player's "reach zone").
6. **Touch preventDefault**: `this.input.addPointer(1)` for multi-touch; call `event.preventDefault()` on touchmove to prevent scroll.

### 10.2 Performance Constraints

- Max 10 active commuter GameObjects at once (pool and reuse).
- SVG textures generated once at scene create, cached by type.
- Particle effects use Phaser's built-in ParticleEmitter, max 30 particles total active.
- Target 60fps on mid-range mobile (Snapdragon 660 equivalent).

### 10.3 State Reset on Restart

```javascript
function restartGame() {
  gameState.score = 0;
  gameState.streak = 0;
  gameState.overflowCount = 0;
  gameState.stage = 1;
  gameState.lastInputTime = Date.now();
  clearAllCommuters();
  this.scene.restart();  // full scene restart ≤300ms
}
```

### 10.4 localStorage Best Score

```javascript
const bestScore = parseInt(localStorage.getItem('escalator-chaos-best') || '0');
if (score > bestScore) localStorage.setItem('escalator-chaos-best', score);
```

### 10.5 Portrait Lock

```css
/* style.css */
@media (orientation: landscape) {
  body::before {
    content: 'Please rotate your device';
    display: flex;
    /* ... */
  }
  canvas { display: none; }
}
```

### 10.6 Known Gotchas

- **Swipe on wrong commuter**: Only the front-of-queue commuter (lowest y, closest to player) is swiped. Tapping behind them does nothing.
- **Confused commuter icon flip**: Store `trueDestination` separately. At a random time between spawn and y=320, flip `displayedDestination`. Visual icon updates. Correct answer is always `trueDestination`.
- **Tourist pause**: Set commuter speed to 0 for 1500ms, show camera flash (white flash on commuter, 100ms), then resume normal speed.
- **Sprint commuter**: Speed 160px/s (vs normal 60px/s). Swipe window is the same zone (y 280–420) but time to traverse it is ~0.5s. Display visual indicator (wind streaks).

### 10.7 Minimum Viable Loop Checklist

- [ ] Commuters spawn and descend
- [ ] Swipe left/right routes correctly
- [ ] Score and streak update
- [ ] Wrong swipe bounces back with red flash
- [ ] Overflow counter increments, game ends at 5
- [ ] 12s inactivity triggers death
- [ ] Game Over → Restart in < 2s
- [ ] Stage advances every 10 correct swipes
- [ ] Juice effects fire on all events

---

*GDD v1.0 — Ready for Developer handoff.*
