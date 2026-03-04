# Game Design Document: Magma Flow

**Slug**: magma-flow
**Version**: 1.0
**Date**: 2026-03-05
**Score**: 77.9

---

## 1. Overview

### Concept
Magma Flow is a real-time physics puzzle game where the player draws temporary walls to redirect flowing lava into target zones before it cools and hardens. Each stage spawns a lava source and one or more glowing target cauldrons. The player finger-draws wall segments on screen; lava obeys gravity and bounces off walls. If lava misses all targets and pools on the floor, or if the player idles for 10 seconds, it's game over.

### Core Fantasy
"I am a pyromaniac engineer channeling liquid destruction with my fingertip." The player feels godlike control over chaos — drawing a wall just in time to catch a lava stream feels like cracking a whip.

### Target Audience
Casual mobile players aged 16–35 who enjoy one-touch satisfying mechanics with escalating chaos. Fans of Doodle God, Agar.io, and Line Rider.

### Success Metrics
- First death occurs within 30 seconds of first session (death test enforced)
- Session length ≥ 3 minutes average
- Stage clear rate: 60% on stages 1–5, declining to 20% by stage 20
- Juice events fire on every meaningful action (no silent actions)

---

## 2. Game Mechanics

### Core Loop
1. Stage loads — lava source appears at top of screen, target cauldron(s) appear at bottom/sides
2. Lava begins flowing from source after a **1000ms** countdown ("3-2-1-FLOW!")
3. Player draws walls by dragging finger across screen
4. Lava hits walls, redirects, flows toward targets
5. Stage clears when **100% of lava** drains into target cauldron(s) within time limit
6. Stage fails when: lava hardens (stops moving for **3000ms**), or player idles **10 seconds**, or timer expires
7. Score tallied, next stage loads with **800ms** transition

### Controls — Touch Zones

```
┌─────────────────────────────┐  ← 428px wide
│  [SCORE]        [TIMER]     │  ← 0–60px HUD bar
│                             │
│   [LAVA SOURCE AREA]        │  ← 60–160px from top
│                             │
│   ← DRAW ZONE →             │  ← 160–680px (main play area)
│                             │
│   [TARGET CAULDRONS]        │  ← 620–720px from top
│                             │
└─────────────────────────────┘  ← 720px tall (360×720 base)
```

**Drawing**: Single-finger drag anywhere in DRAW ZONE creates a wall segment.
- Wall appears immediately as finger drags (real-time rendering)
- Wall segment: 6px wide, up to **200px** maximum length per segment
- Maximum **5 walls active** simultaneously; oldest wall removed when 6th is drawn
- Wall fades out after **5000ms** (animated opacity 1.0→0 over last 1000ms)

**No buttons in play area** — all UI is top HUD bar only.

### Scoring
- **Base score per stage**: `100 × stage_number`
- **Speed bonus**: If cleared in < 50% of time limit: `+50 × stage_number`
- **Efficiency bonus**: If cleared using ≤ 2 walls: `+30 × stage_number`
- **Combo multiplier**: Consecutive stage clears without dying: `×1.0, ×1.2, ×1.5, ×2.0, ×2.0 (cap)`
- Score displayed as integer, animates upward (counter roll) on gain

### Progression Milestones
| Stage | Time Limit | Lava Volume | Targets | Special |
|-------|-----------|-------------|---------|---------|
| 1–3   | 20s       | 1 stream    | 1       | None |
| 4–6   | 18s       | 1 stream    | 1       | Moving target (oscillates 40px at 0.5Hz) |
| 7–10  | 16s       | 2 streams   | 2       | Walls have 3000ms TTL instead of 5000ms |
| 11–15 | 14s       | 2 streams   | 2       | Lava flow rate +30%; rock obstacles appear |
| 16–20 | 12s       | 3 streams   | 2       | Rock obstacles; one target moves vertically |
| 21+   | 10s       | 3 streams   | 3       | All modifiers active; random obstacle layout |

### Lives / Failure
- **No lives system** — single attempt per stage
- On failure: death animation plays (1200ms), then immediate restart of same stage
- After **3 consecutive failures** on same stage: "Skip?" prompt appears (player can skip for 0 score or retry)
- 10-second inactivity detection: if player has not drawn a wall in 10s and lava is still flowing → game over (not stage fail — full session reset)

---

## 3. Stage Design

### Infinite Generation Algorithm

Every stage is procedurally generated using `stage_number` as seed:

```javascript
function generateStage(stageNum) {
  const rng = seededRandom(stageNum * 7919); // prime seed

  // Source positions (top zone: y=80, x varies)
  const sourceCount = stageNum <= 6 ? 1 : stageNum <= 15 ? 2 : 3;
  const sources = Array.from({length: sourceCount}, (_, i) => ({
    x: 60 + (i * (300 / sourceCount)) + rng() * 80,
    y: 90,
    flowRate: 12 + stageNum * 0.8  // px/frame equivalent
  }));

  // Target positions (bottom zone: y=660–700)
  const targetCount = stageNum <= 6 ? 1 : 2 + (stageNum >= 21 ? 1 : 0);
  const targets = Array.from({length: targetCount}, (_, i) => ({
    x: 80 + (i * (280 / targetCount)) + rng() * 60,
    y: 670,
    width: Math.max(60, 80 - stageNum * 1.5),  // shrinks with difficulty
    moving: stageNum >= 4
  }));

  // Obstacles (stage 11+)
  const obstacles = stageNum >= 11 ? generateObstacles(rng, stageNum) : [];

  return { sources, targets, obstacles, timeLimit: Math.max(10, 20 - stageNum * 0.4) };
}
```

### Difficulty Curve (Numeric Parameters)
| Parameter | Stage 1 | Stage 10 | Stage 20 | Stage 30+ |
|-----------|---------|----------|----------|-----------|
| Time limit | 20s | 16s | 12s | 10s |
| Lava speed (px/s) | 120 | 180 | 240 | 280 |
| Target width | 80px | 65px | 50px | 40px |
| Max walls allowed | 5 | 5 | 4 | 3 |
| Wall TTL | 5000ms | 4000ms | 3000ms | 2500ms |
| Obstacle count | 0 | 0 | 2 | 4 |

### Stage Rules
- Lava is simulated as particle stream: **20 particles/second** emitted per source
- Each particle: circle radius **8px**, gravity **400px/s²**, velocity inherited from source direction (straight down)
- Particle collides with walls using circle-vs-segment collision detection
- Particle "hardens" (turns dark gray, stops) if velocity < **10px/s** for **500ms**
- Stage clears when **≥95% of emitted particles** have entered target zones (5% tolerance for splatter)
- Stage timer resets on each new stage load

---

## 4. Visual Design

### Color Palette
| Element | Color | Hex |
|---------|-------|-----|
| Background | Deep volcanic rock | `#1A0A00` |
| Background gradient top | Dark gray-black | `#0D0D0D` |
| Lava (hot) | Bright orange-red | `#FF4500` |
| Lava (warm) | Orange | `#FF8C00` |
| Lava (cooling) | Dark red-brown | `#8B0000` |
| Lava (hardened) | Dark gray | `#444444` |
| Wall (player drawn) | Cyan glow | `#00FFFF` |
| Wall (fading) | Dim cyan | `#004444` |
| Target cauldron | Gold rim | `#FFD700` |
| Target cauldron interior | Dark orange | `#CC4400` |
| Target active (lava inside) | Bright orange glow | `#FF6600` |
| Rock obstacle | Dark brown-gray | `#5C4033` |
| HUD background | Semi-transparent black | `rgba(0,0,0,0.7)` |
| Score text | White | `#FFFFFF` |
| Timer (normal) | White | `#FFFFFF` |
| Timer (warning <5s) | Red | `#FF3333` |
| Combo text | Yellow | `#FFFF00` |

### SVG Specs — Exact Shapes

**Lava Source** (rendered at spawn point):
```
SVG: circle r=20px, fill=#FF4500, stroke=#FFD700 stroke-width=3px
     inner circle r=12px, fill=#FF8C00, animated pulse scale 1.0→1.3 at 600ms loop
     drip SVG path: M 0,20 Q -5,35 0,45 Q 5,35 0,20 fill=#FF4500
```

**Target Cauldron**:
```
SVG: trapezoid (wider top) — points: (-40,0) (40,0) (28,50) (-28,50)
     fill=#5C4033 (pot body)
     top rim: rect width=88px height=8px y=-4px fill=#FFD700 rx=3
     interior: ellipse rx=32 ry=12 fill=#CC4400 (dark when empty)
     When lava fills: interior fill animates to #FF6600, add glow filter
```

**Player Wall**:
```
SVG: line with stroke=#00FFFF stroke-width=6px stroke-linecap=round
     outer glow: duplicate line stroke=#00FFFF stroke-width=10px opacity=0.3
     When fading: opacity transition 1000ms linear to 0
```

**Rock Obstacle**:
```
SVG: irregular polygon (8 vertices) random offsets ±10px from 30×20 base rect
     fill=#5C4033, stroke=#3D2B1F stroke-width=2px
     inner shadow: offset polygon +2px fill=#3D2B1F
```

**Lava Particle**:
```
SVG: circle r=8px
     Color: lerp from #FF4500 (fast/hot) to #8B0000 (slow/cooling) based on velocity
     Glow: radial gradient center #FFAA00 opacity=0.8, edge transparent
     Hardened: fill=#444444, no glow, r shrinks to 6px over 300ms
```

### Animations
| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Stage start countdown pulse | 333ms per count | ease-out | Stage load |
| Lava particle glow pulse | 400ms loop | sine | Always on hot particles |
| Target cauldron fill glow | 200ms | ease-in | Lava enters target |
| Wall draw trail sparkles | 100ms each | linear | During finger drag |
| Stage clear flash | 300ms | ease-out | All lava captured |
| Death lava hardening | 1200ms | ease-in | Stage fail |

### Screen Layout (360×720px base, scales to 428px wide)

```
y=0   ┌─────────────────────────┐
      │ STAGE: 1   SCORE: 0   │ 50px HUD
y=50  ├─────────────────────────┤
      │    [TIMER BAR] ████░░  │ 10px progress bar
y=60  ├─────────────────────────┤
      │                         │
      │  🔥 LAVA SOURCE(S)      │ 100px source zone
      │                         │
y=160 ├─────────────────────────┤
      │                         │
      │   ← DRAW / PLAY ZONE →  │ 460px play area
      │                         │
y=620 ├─────────────────────────┤
      │  🏺 TARGET CAULDRONS    │ 100px target zone
      │                         │
y=720 └─────────────────────────┘
```

---

## 5. Audio Design

### Sound Effects
| Event | Sound Description | Duration | Volume |
|-------|------------------|----------|--------|
| Lava flow (loop) | Low rumbling bubbling | Loop | 0.4 |
| Wall draw | Whoosh/sizzle | 300ms | 0.6 |
| Lava hits wall | Splat + sizzle | 200ms | 0.5 |
| Lava enters target | Satisfying glug/pour | 400ms | 0.7 |
| Stage clear | Triumphant ding + rumble | 600ms | 0.8 |
| Stage fail / harden | Dull thud + crack | 800ms | 0.7 |
| Countdown beeps | High-pitched beep | 100ms each | 0.6 |
| Combo achieved | Ascending chime | 300ms | 0.7 |
| 10s idle warning | Alarm pulse | 200ms repeat | 0.8 |

### Music Concept
- Dynamic tension loop: percussion-heavy, primal drumming pattern
- Tempo increases as timer drops below 8 seconds (140bpm → 180bpm)
- For POC: no music implemented; sound effects only via Web Audio API oscillator synthesis

---

## 6. UI/UX

### Screen Flow
```
[TITLE SCREEN]
    ↓ TAP TO PLAY
[STAGE 1 LOAD] → 3-2-1 countdown (1000ms) → [GAMEPLAY]
    ↓ STAGE CLEAR                              ↓ STAGE FAIL
[SCORE TALLY] (1500ms)              [DEATH ANIM] (1200ms)
    ↓                                           ↓
[NEXT STAGE LOAD]                   [RETRY SAME STAGE] — auto after 800ms
    ↓
(loop)
    ↓ (10s idle OR session end)
[GAME OVER SCREEN] → TAP TO RESTART → [STAGE 1 LOAD]
```

### HUD Layout (top 60px bar)
```
┌──────────────────────────────────────┐
│ Stage 1    🔥 MAGMA FLOW    1234    │  ← 50px
└──────────────────────────────────────┘
│ ████████████████░░░░░░░░░░░░░░░░░░  │  ← 10px timer bar
```

- Stage label: left-aligned, 16px font, `#FFFFFF`
- Title: center, 18px bold font, `#FF4500`
- Score: right-aligned, 20px bold font, `#FFFFFF`
- Timer bar: full width, height 8px, color `#FF4500` → `#FF0000` (flashes when <5s), no numeric timer shown (visual tension)
- Combo text: appears center-screen, 28px bold `#FFFF00`, fades in 200ms, held 600ms, fades out 400ms

### Title Screen
- Full-screen: background `#1A0A00`, animated lava drip SVG flowing down screen
- Title text: "MAGMA FLOW" in 42px bold `#FF4500` with orange glow filter
- Subtitle: "Draw walls. Guide lava. Don't wait." 16px `#FFD700`
- Tap-to-play zone: entire screen (no button)
- High score displayed: 14px `#FFFFFF` "BEST: 0"

### Game Over Screen
- Slides up from bottom over 400ms
- Shows: "GAME OVER", total score, stage reached, best score
- "TAP TO RESTART" text pulses (opacity 1.0↔0.5 at 800ms)
- Auto-restarts after 8 seconds if no input

---

## 7. Monetization

POC stage: No ad implementation. Placeholder hooks only.

```javascript
// ads.js — placeholder stubs for POC
const Ads = {
  showInterstitial: (onComplete) => { onComplete(); },  // no-op
  showRewarded: (onReward, onSkip) => { onSkip(); },    // no-op
  showBanner: () => {},                                  // no-op
};
```

**Intended ad placements** (for post-POC):
- Interstitial: after every 5th stage clear
- Rewarded: on "Skip Stage?" prompt (watch ad to skip)
- Banner: below game canvas on title screen only

---

## 8. Technical Architecture

### File Structure
```
games/magma-flow/
├── index.html          ← single HTML, loads all scripts via CDN + local
├── css/
│   └── style.css       ← canvas centering, full-height mobile layout
└── js/
    ├── config.js       ← constants (colors, physics params, stage formulas)
    ├── main.js         ← Phaser.Game init, scene registry
    ├── game.js         ← GameScene: lava simulation, wall drawing, collision
    ├── stages.js       ← stage generation algorithm, obstacle layouts
    ├── ui.js           ← UIScene (HUD, overlays, title, game over)
    └── ads.js          ← placeholder ad stubs
```

### Module Responsibilities

**config.js** (~40 lines)
- All magic numbers: `GRAVITY`, `LAVA_RADIUS`, `WALL_TTL`, `MAX_WALLS`, `PARTICLE_RATE`, etc.
- Color constants: `COL_LAVA_HOT`, `COL_WALL`, etc.
- Stage formula functions: `getTimeLimit(n)`, `getFlowRate(n)`

**main.js** (~50 lines)
- Phaser.Game config: `{ type: Phaser.AUTO, width: 360, height: 720, scene: [UIScene, GameScene] }`
- Scale config: `{ mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }`
- No game logic

**game.js** (~280 lines)
- `GameScene extends Phaser.Scene`
- Lava particle pool (max 200 particles, reuse on harden)
- Wall drawing: `pointerdown → pointermove → pointerup` events
- Physics: manual integration (no Matter.js) — update loop moves particles, checks wall collisions
- Collision: circle-vs-segment for each particle against each wall
- Target detection: particle center inside cauldron bounding box
- 10-second idle timer: reset on every `pointerdown` event
- Stage clear / fail detection each frame

**stages.js** (~80 lines)
- `generateStage(stageNum)` → `{ sources, targets, obstacles, timeLimit }`
- Seeded RNG: `function seededRandom(seed)` returning 0–1 sequence
- Obstacle generation: `generateObstacles(rng, stageNum)` → array of polygon vertex arrays

**ui.js** (~200 lines)
- `UIScene extends Phaser.Scene` (runs in parallel with GameScene)
- Title screen rendering and tap detection
- HUD: stage number, score, timer bar
- Stage clear overlay: score tally animation
- Game over screen: slide-up panel, best score
- Combo text: center-screen flash
- Listens to `this.scene.get('GameScene')` events: `'stageClear'`, `'stageFail'`, `'scoreUpdate'`

**ads.js** (~20 lines)
- Stub implementations only

### CDN Dependencies
```html
<!-- Phaser 3.60.0 -->
<script src="https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js"></script>
```
No other external dependencies.

### Physics — Manual (No Matter.js)
Lava uses manual Verlet-style integration to avoid Matter.js bugs with dynamic body creation:
- Each particle: `{ x, y, vx, vy, age, state }`
- Each frame: `vy += GRAVITY * delta; x += vx * delta; y += vy * delta`
- Wall collision: project particle onto segment, resolve penetration, reflect velocity
- No physics engine — pure math in game.js update loop

---

## 9. Juice Specification (MANDATORY)

### 9.1 Input Feedback — Wall Drawing
| Event | Effect | Values |
|-------|--------|--------|
| Finger down | Cyan spark burst at touch point | 8 particles, radius 20px, 200ms lifetime, `#00FFFF` |
| Finger drag | Trail sparkles along wall path | 1 spark per 10px of drag, 150ms lifetime, `#00FFFF` opacity 0.6 |
| Wall placed | Screen micro-shake | amplitude 3px, duration 150ms, 2 cycles |
| Wall placed | Wall flash to white | 80ms flash `#FFFFFF` → `#00FFFF` on wall segment |
| Wall limit hit (6th wall) | Old wall shatter effect | 6 small gray particles burst from removed wall, 300ms, gravity |

### 9.2 Core Action — Lava Hits Wall
| Event | Effect | Values |
|-------|--------|--------|
| Lava particle hits wall | Splat particles | 4 orange particles at impact point, spread ±45°, 250ms, `#FF4500` |
| Lava particle hits wall | Wall segment sizzle flash | 100ms brightness boost on hit segment, `#44FFFF` → `#00FFFF` |
| Multiple hits in 500ms | Heat burst visual | Radial gradient flash at wall midpoint, radius 30px, 300ms, `#FF8C00` opacity 0.7→0 |

### 9.3 Lava Enters Target
| Event | Effect | Values |
|-------|--------|--------|
| First particle enters target | Cauldron rim glow pulse | 200ms scale 1.0→1.15→1.0, `#FFD700` glow radius 15px |
| Each particle entering | Cauldron interior brightness bump | +20% brightness per particle, cumulative, max 100% |
| Target 50% full | Screen edge vignette glow | Orange vignette, 300ms ease-in, opacity 0.2 |
| Target 100% full | Full screen flash + cauldron explode-expand | Flash: `#FF8C00` 150ms opacity 0→0.6→0; cauldron scale 1.0→1.4→1.0 over 400ms |

### 9.4 Stage Clear
| Event | Effect | Values |
|-------|--------|--------|
| Stage clear trigger | Hit-stop | All lava particles freeze for **120ms** |
| Hit-stop end | Camera zoom-in | Scale 1.0→1.1 over 200ms, then zoom-out 1.1→1.0 over 400ms |
| Score numbers | Counter roll animation | Score ticks up from previous to new score over 800ms at variable speed (fast→slow) |
| Score bonus (speed/efficiency) | Floating +text | "+SPEED BONUS! +150" yellow text, float upward 40px over 600ms, fade out |
| Combo multiplier gained | Combo badge flash | Badge scale 1.0→1.6→1.0 over 300ms, color flash `#FFFF00`→`#FF8C00` |

### 9.5 Stage Fail / Death
| Event | Effect | Values |
|-------|--------|--------|
| Lava hardening starts | Color shift | All active particles shift to `#8B0000` over 500ms |
| Lava fully hardened | Screen desaturate | Full-screen grayscale filter overlaid, opacity 0→0.6 over 700ms |
| Death finalized | Screen crack effect | 3 SVG crack lines from bottom, 400ms draw animation, `#333333` |
| Death shake | Camera shake | amplitude 8px, 600ms duration, 4 cycles, decaying |
| 10s idle warning (8s mark) | Pulsing red vignette | Red edge vignette, opacity 0→0.4→0 cycling at 1Hz |
| 10s idle warning (9s mark) | Screen flash | Full-screen red flash, 150ms, opacity 0.3 |

### 9.6 Combo Escalation
| Combo Count | Visual | Effect |
|-------------|--------|--------|
| ×1.2 (2 clears) | Text: "NICE ×1.2" | White, 22px, 600ms float |
| ×1.5 (3 clears) | Text: "HOT ×1.5" | Orange, 26px, 700ms float, small particle burst |
| ×2.0 (4+ clears) | Text: "INFERNO ×2.0" | Red→yellow gradient, 32px, 800ms float, 12-particle burst, screen edge glow |

---

## 10. Implementation Notes

### Mobile Optimization
- Canvas size: base 360×720, scaled via Phaser Scale Manager to fill viewport without letterboxing
- Touch events: use Phaser's built-in pointer events (unifies touch and mouse)
- `{ autoFocus: false }` on Phaser.Game to prevent keyboard pop-up on mobile
- `{ backgroundColor: '#1A0A00' }` set in game config (avoids flash before canvas render)
- CSS: `body { margin: 0; overflow: hidden; background: #1A0A00; }`
- `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`

### Touch Controls — Implementation
```javascript
// game.js
this.input.on('pointerdown', (ptr) => {
  this.idleTimer = 0;                    // reset 10s idle counter
  this.isDrawing = true;
  this.wallStart = { x: ptr.x, y: ptr.y };
  this.currentWall = null;
  this.spawnInputSpark(ptr.x, ptr.y);    // Section 9.1 juice
});

this.input.on('pointermove', (ptr) => {
  if (!this.isDrawing) return;
  this.updateCurrentWall(this.wallStart, { x: ptr.x, y: ptr.y });
});

this.input.on('pointerup', (ptr) => {
  this.isDrawing = false;
  this.finalizeWall();                   // add to active walls array
  this.triggerWallPlaceJuice();          // Section 9.1 micro-shake
});
```

### Performance Targets
- Target: **60fps** on mid-range mobile (Snapdragon 660 equivalent)
- Particle pool: pre-allocate 200 particle objects, reuse (no GC pressure)
- Wall rendering: use Phaser Graphics object, `graphics.clear()` + redraw each frame (≤5 walls = fast)
- SVG shapes for source/target/obstacles: rendered as Phaser GameObjects once on stage load, not redrawn each frame
- Particle rendering: use Phaser Graphics batch draw — single `graphics.fillCircle()` loop per frame
- Max particles visible simultaneously: 120 (20/s × ~6s flight time)
- `requestAnimationFrame` throttle: none — trust Phaser's game loop
- Memory: no asset loading, no textures — pure code graphics only

### Wall Drawing Precision (Mobile Concern Mitigation)
- Wall segments snap to nearest 8px grid for endpoints (reduces precision demand)
- Wall collision hitbox is wall-width + **12px tolerance** (lava will bounce even near-misses)
- Visual wall width: 6px; collision width: 18px effective
- Minimum wall length: **20px** (shorter drags ignored — prevents accidental walls)

### Death Condition Implementation
```javascript
// In update loop:
this.idleTimer += delta;
if (this.idleTimer >= 10000) {
  this.triggerGameOver('idle');    // 10s no input → full game over
}

// Harden detection per particle:
if (particle.velocity < 10 && particle.state === 'flowing') {
  particle.hardenTimer += delta;
  if (particle.hardenTimer >= 3000) particle.state = 'hardened';
}

// Stage fail: if all particles hardened and not in targets:
const unharvested = this.particles.filter(p => p.state === 'hardened' && !p.inTarget);
if (unharvested.length > 0 && this.allParticlesSettled()) {
  this.triggerStageFail();
}
```

### Restart Speed — Under 2 Seconds
- On death: death animation **1200ms** → stage resets immediately (no loading screen)
- All game objects destroyed and recreated in `create()` — Phaser scene restart: `this.scene.restart()`
- `scene.restart()` target: **< 200ms** (pure code, no asset loading)
- Total death → playable: **1400ms** (well under 2s target)

---

*End of Game Design Document — Magma Flow v1.0*
