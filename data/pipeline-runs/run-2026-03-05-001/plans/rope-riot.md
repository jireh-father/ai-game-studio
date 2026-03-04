# Game Design Document: Rope Riot

**Slug**: `rope-riot`
**One-Liner**: Swing a rope to knock enemies into pits before they swarm you.
**Core Mechanic**: Drag-to-whip physics rope to knock enemies off platforms
**Target Session Length**: 3–6 minutes
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Rope Riot is a physics-driven mobile action game where the player wields a whip-like rope to fend off waves of enemies marching toward them across a series of floating platforms. The player anchors one end of the rope to their character and drags to aim, then releases to unleash a cracking whip that sends enemies tumbling into the void below.

The fantasy is simple and visceral: you are outnumbered, but your rope is a chaos engine. Every swing can chain through multiple enemies, bounce them off each other, and create spectacular ragdoll domino effects that feel impossible to plan but incredibly satisfying to witness. The unpredictability is the feature — not a bug.

The game runs as a relentless survival loop. Enemies respawn every wave, platforms shrink as the stage number rises, and the player must master whip timing and trajectory to survive. Death is fast, retries are instant, and each run teaches something new about rope physics.

### 1.2 Target Audience

Casual mobile gamers aged 16–35. Played in short bursts (commute, toilet, waiting room). Skill level: casual to mid-core. Players who enjoy satisfying physics feedback and quick retry loops — fans of games like Angry Birds, Stickman Hook, or Smash Hit.

### 1.3 Core Fantasy

You are the last defender on a crumbling platform arena. Your rope is your only weapon. Every crack of the whip is a chance to send a dozen enemies flying into oblivion. You are outnumbered. You are outrun. But your rope hits like a freight train.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 4–6 minutes |
| Day 1 Retention | 40%+ |
| Day 7 Retention | 20%+ |
| Average Stages per Session | 6–12 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Stage Start] → [Enemies Spawn & March] → [Player Drags to Aim Rope]
     ↑                                              │
     │                                    [Release: Rope Whips]
     │                                              │
     │                               [Enemies Hit → Fall in Pit]
     │                                              │
     │                          [All Enemies Cleared → Stage Clear]
     │                                              │
     └────── [Next Stage, Platform Shrinks] ←───────┘
                       │
               [Player Knocked Off / Timer Expires]
                       │
               [Game Over Screen → Retry]
```

**Moment-to-moment**: Player sees enemies advancing from the right side of the platform. They press-and-hold anywhere on the lower half of screen to aim the rope (shown as a stretched line with arrow indicator). On release the rope snaps outward in an arc. Enemies in the rope's swing path get launched with physics velocity. Enemies that fall off any platform edge are eliminated. Player survives the wave → stage clears → next stage loads with smaller platform and faster enemies.

**Core decisions**: Aim angle (hit many vs. hit hard), timing (wait for enemies to cluster vs. swing before they reach you), target priority (fast vs. tanky enemy types), positioning (stay near center vs. corner-trap enemies).

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Aim Rope | Press and hold anywhere | Rope stretches from player in direction of touch |
| Whip | Release finger | Rope snaps forward in an arc, applying force to hit enemies |
| Dodge Step | Quick tap (< 150ms) on left or right half | Player steps 40px in that direction instantly |
| None | No input for 12s | Inactivity death triggers |

**Control Philosophy**: One-handed, thumb-friendly. All actions use the bottom 60% of the screen so thumbs never obscure the action. The drag-to-aim is intuitive because it mimics pulling back a slingshot — a universally understood gesture. Quick tap dodge is a safety valve for advanced players without complicating core input.

**Touch Area Map**:
```
┌─────────────────────┐
│                     │
│   GAME ARENA        │  ← Enemies march here, platforms visible
│   (full width)      │
│                     │
├──────────┬──────────┤ ← 60% height line
│  TAP:    │  TAP:    │
│  DODGE   │  DODGE   │
│  LEFT    │  RIGHT   │
│  DRAG:   │  DRAG:   │
│  AIM &   │  AIM &   │
│  WHIP    │  WHIP    │
└──────────┴──────────┘
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Enemy knocked off | 100 | — |
| Multi-kill (2 enemies same whip) | 100 × 2 × combo_mult | Increases combo counter |
| Multi-kill (3+ enemies same whip) | 100 × 3 × combo_mult × 1.5 | Combo escalation |
| Wave cleared without dodge | +500 bonus | No dodge inputs this wave |
| Stage cleared | 200 × stage_number | — |
| Combo counter | ×1.0 → ×2.0 → ×3.0 | +0.25× per chain kill, resets on miss-whip |

**Combo System**: Each consecutive whip that hits at least one enemy increases combo multiplier by 0.25× (max 3×). A whip with zero hits resets combo to 1×. Combo counter shown as floating number near player, scales in size.

**High Score**: Stored in `localStorage["rope-riot_high_score"]`. Displayed on menu and game over screen with gold highlight animation if beaten.

### 2.4 Progression System

Stages are infinite. Each stage clears when all enemies in the wave are eliminated. Stage number drives all difficulty parameters.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1–3 | Basic walkers only, wide platform | Tutorial zone — 1 enemy type, slow speed |
| 4–7 | Fast runners introduced | Speed +30%, 2 enemy types |
| 8–12 | Platform edges narrower, jumper enemies | +1 pit per stage, enemies jump over rope |
| 13–20 | Shielded enemies (require 2 hits) | Increased HP, combo breaks on first hit |
| 21–35 | Splitter enemies (split into 2 on hit) | Wave size +50%, tactical targeting required |
| 36–50 | Charger enemies (rush player on whip) | Speed burst on player action |
| 51+ | All types mix, random platform shapes | Max chaos, no new mechanics — pure survival |

**Rest stages**: Every 10 stages, spawn 50% fewer enemies with 80% normal speed for one stage.

### 2.5 Lives and Failure

Player has 1 life per run. No checkpoints. Death restarts from stage 1.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Player knocked off platform edge | Instant death | None (POC — no ads) |
| Inactivity 12 seconds with no input | Instant death | None |
| All platform tiles destroyed (future mechanic) | Instant death | None |

**Death → Game Over → Restart total time: under 2 seconds.**
- Death effect plays: 400ms
- Game over screen appears: 200ms (no animation delay)
- Tap "Play Again": scene restarts immediately, no loading

---

## 3. Stage Design

### 3.1 Infinite Stage System

Stages are generated procedurally from a deterministic function of `stageNumber`. Same stage number always produces same layout.

**Generation Algorithm**:
```
Stage Generation Parameters:
- Seed: stageNumber (deterministic, no random salt)
- Platform width: max(160, 360 - stageNumber * 4) px, min 160px at stage 50
- Platform segments: 1 (stages 1–10), 2 (stages 11–25), 3 (stages 26+)
- Gap size between segments: 40px (stages 11–25), 60px (stages 26+)
- Enemy count: 3 + floor(stageNumber * 0.6), max 12
- Enemy speed: 40 + stageNumber * 3 px/s, max 140 px/s
- Enemy types: driven by stageNumber thresholds (see 2.4)
- Rope length: 180px (fixed), force multiplier scales with stageNumber
- Wave count: 1 wave per stage (all enemies at once)
```

### 3.2 Difficulty Curve

```
Difficulty
    │
100 │                                          ──────── (cap at stage 50+)
    │                                    ╱
 80 │                              ╱
    │                        ╱
 60 │                  ╱
    │          ╱─────╱   (rest stage dips every 10 stages)
 40 │    ╱───╱
    │╱──╱
 20 │
    │
  0 └────────────────────────────────────────── Stage
    0    10    20    30    40    50    60+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1–3 | Stage 4–10 | Stage 11–20 | Stage 21–35 | Stage 36–50 | Stage 51+ |
|-----------|-----------|------------|-------------|-------------|-------------|-----------|
| Platform Width | 340px | 280px | 240px | 200px | 180px | 160px |
| Enemy Count | 3–4 | 5–6 | 6–8 | 8–10 | 10–11 | 12 (max) |
| Enemy Speed (px/s) | 40 | 58–70 | 73–100 | 103–124 | 127–134 | 137–140 |
| Platform Segments | 1 | 1 | 2 | 2 | 3 | 3 |
| Enemy Types Active | Walker | +Runner | +Jumper | +Shielded | +Splitter | All |
| Rope Force Mult | 1.0× | 1.0× | 1.1× | 1.2× | 1.3× | 1.4× |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: All enemies must spawn at least 120px from the player. At stage start, a 2-second grace period where enemies walk but cannot reach player guarantees first swing opportunity.
2. **Variety Threshold**: Platform width, enemy count, and at least one enemy type parameter must differ from the previous stage.
3. **Difficulty Monotonicity**: Platform width never increases between stages (only decreases or holds). Enemy count never decreases (only increases or holds at max).
4. **Rest Stages**: Every 10th stage: enemy count × 0.5 (rounded up), speed × 0.8. Platform width unchanged.
5. **No Boss Stages in POC**: Simplicity over spectacle for first build.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Bold neon-on-dark geometric. Characters are simple rounded rectangles and circles. The rope is a bright glowing line. The arena is a black void with colored platform tiles. Inspired by neon arcade aesthetics.

**Aesthetic Keywords**: Neon, Punchy, Geometric, High-contrast, Electric

**Reference Palette**: Dark background makes neon colors pop. Enemy colors visually distinct from player and platform. Rope is the most visually prominent element at all times.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Player | Electric Cyan | `#00FFFF` | Player character body |
| Rope | Hot Yellow | `#FFE600` | Whip rope line |
| Platform | Slate Blue | `#3A4A6B` | Platform tiles |
| Platform Edge | Steel | `#6B7DA0` | Platform edge highlight |
| Enemy Walker | Coral Red | `#FF4444` | Basic walker enemy |
| Enemy Runner | Orange | `#FF8800` | Fast runner enemy |
| Enemy Jumper | Purple | `#AA44FF` | Jumping enemy |
| Enemy Shielded | Gray-Silver | `#AAAAAA` | Shielded (first hit) |
| Enemy Shielded Exposed | Dark Red | `#CC2222` | Shielded (second hit) |
| Enemy Splitter | Pink | `#FF44AA` | Splitter enemy |
| Background | Near Black | `#0A0A12` | Game background |
| Pit/Void | Pure Black | `#000000` | Gaps between platforms |
| UI Text | White | `#FFFFFF` | Score, labels |
| UI Accent | Gold | `#FFD700` | High score, stage number |
| Danger | Bright Red | `#FF0000` | Low health indicator (future) |
| Particle Hit | White-Yellow | `#FFFFAA` | Enemy hit particles |
| Particle Death | Cyan burst | `#00FFEE` | Player death particles |

### 4.3 SVG Specifications

All graphics are programmatically drawn using Phaser's Graphics API (equivalent to SVG shapes). No external image files.

**Player Character** (24×32px standing, pivot at feet center):
```
- Body: rounded rect 18×22px, fill #00FFFF, stroke #00AAAA 2px, cornerRadius 4
- Head: circle r=9px, fill #00FFFF, stroke #00AAAA 2px, centered above body
- Eyes: 2× circle r=2px, fill #003344, at head center ±4px x
- Rope anchor: small circle r=3px, fill #FFE600, at body center-right
```

**Enemy Walker** (20×28px):
```
- Body: rounded rect 14×18px, fill #FF4444, stroke #AA2222 2px, cornerRadius 3
- Head: circle r=8px, fill #FF4444, stroke #AA2222 2px
- Eyes: 2× circle r=2px, fill #440000
- Angry brow: line from (-4, -2) to (0, 0) and (0, 0) to (4, -2), stroke #440000 2px
```

**Enemy Runner** (18×24px, slightly slanted forward):
```
- Same as walker but taller/thinner: body 12×20px
- Fill #FF8800, stroke #AA5500 2px
- Transform: skewX(-10deg) to suggest forward lean
```

**Enemy Jumper** (22×22px, rounder):
```
- Body: circle r=11px, fill #AA44FF, stroke #6600CC 2px
- Eyes: 2× circle r=2.5px, fill #110022
- Spring legs: 2× zigzag line below body, stroke #AA44FF 2px
```

**Enemy Shielded** (24×28px):
```
- Same base as walker but:
- Shield overlay: rect 20×24px, fill none, stroke #AAAAAA 3px, cornerRadius 2
- Fill #AAAAAA when shielded, #CC2222 when exposed
```

**Enemy Splitter** (20×20px):
```
- Diamond shape: polygon 4 points (top, right, bottom, left), fill #FF44AA, stroke #AA0066 2px
```

**Rope** (dynamic, variable length):
```
- Line from player anchor to touch point / whip tip
- Stroke: #FFE600, lineWidth 3px
- Glow: second line same path, stroke #FFFF00, lineWidth 6px, alpha 0.4
- Whip arc: bezier curve during animation phase
```

**Platform Tile** (variable width × 24px height):
```
- Rect fill #3A4A6B, stroke #6B7DA0 2px
- Top edge highlight: line fill #8899BB 1px at top
- Subtle grid lines: vertical lines every 32px, stroke #2A3A5B 1px
```

**Design Constraints**:
- Max 6 shape elements per character
- Use only rect, circle, line, polygon — no complex paths
- All rendering via Phaser Graphics, redrawn per frame only when dirty

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Rope arc flash | Whip release | Yellow line arcs from origin with 120ms lifetime, alpha fade |
| Enemy hit flash | Enemy takes damage | Tint white #FFFFFF for 80ms, then back to original color |
| Enemy death burst | Enemy falls into pit | 12 particles (see Section 9) |
| Screen shake | Player death | Camera offset ±10px random, 300ms, 8 oscillations |
| Platform pulse | Stage clear | Platform tiles flash #8899BB for 200ms then return |
| Combo number | Multi-kill | Floating "+N×" text rises 60px in 500ms, fades out |
| Rope glow | On hold (aiming) | Rope line doubles width and adds yellow glow layer |

---

## 5. Audio Design

### 5.1 Sound Effects

All audio generated via Web Audio API (oscillator-based synthesis). No external audio files.

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Whip crack | Sharp high-freq burst (4000Hz spike → decay) | 150ms | High |
| Enemy hit | Mid-freq thud (400Hz, soft clip) | 120ms | High |
| Enemy falls in pit | Descending whistle (800→200Hz glide) | 300ms | Medium |
| Multi-kill | Ascending chord (3-note arpeggio, 200→400→600Hz) | 250ms | High |
| Stage clear | Rising fanfare (C-E-G-C, 16th notes at 160bpm) | 600ms | High |
| Player death | Low boom + silence (80Hz sine, fast attack slow decay) | 500ms | High |
| Rope stretch (aiming) | Subtle tension hum (120Hz, vol scales with drag distance) | Looping | Low |
| UI button press | Short click (1200Hz, 50ms) | 50ms | Low |
| Combo escalation | Each combo level raises pitch of whip crack +8% | — | High |

### 5.2 Music Concept

**Background Music**: Procedurally generated pulse loop using Web Audio API. 4-bar loop at 120bpm. Bass pulse on beat 1 and 3. Synth arpeggio fills between beats. No external audio files required.

**Music State Machine**:
| Game State | Music Behavior |
|-----------|---------------|
| Menu | Slow pulse loop at 90bpm, ambient |
| Stages 1–10 | 120bpm, light arpeggio |
| Stages 11–30 | 140bpm, additional high-hat layer |
| Stages 31+ | 160bpm, bass intensifies, rhythm tighter |
| Game Over | Music fades over 800ms |
| Pause | Music volume drops to 20%, tempo unchanged |

**Audio Implementation**: Web Audio API directly (no Howler.js needed — all synthesis, no file loading).

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Splash  │────→│   Menu   │────→│   Game   │
│ "ROPE    │     │  Screen  │     │  Screen  │
│  RIOT"   │     │          │     │          │
└──────────┘     └────┬─────┘     └────┬─────┘
  (1.5s auto)         │                │
                  ┌───┴──────┐    ┌────┴────┐
                  │ Settings │    │  Pause  │
                  │ Overlay  │    │ Overlay │
                  └──────────┘    └────┬────┘
                                       │
                                  ┌────┴────┐
                                  │  Game   │
                                  │  Over   │
                                  └─────────┘
```

### 6.2 HUD Layout

```
┌─────────────────────────────────┐
│ [≡] SCORE: 12450   STAGE: 7    │  ← Top bar 48px tall, semi-transparent black
├─────────────────────────────────┤
│                                 │
│   [ENEMIES SPAWN HERE →→→]      │
│                                 │
│   ████████████████ PLATFORM    │  ← Platform tiles
│   [PLAYER]                     │
│                                 │
│                                 │
├─────────────────────────────────┤
│  COMBO: ×2.5   [ROPE AIM ZONE] │  ← Combo indicator + input zone
└─────────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Size | Content | Update Frequency |
|---------|----------|------|---------|-----------------|
| Score | Top-left, 12px from edge | font 20px bold white | "SCORE: {N}" | Every kill |
| Stage | Top-right, 12px from edge | font 18px gold | "STAGE {N}" | On stage clear |
| Pause button | Top-center | 32×32px | "≡" white icon | Static |
| Combo counter | Center-bottom, above input zone | font 28px yellow | "×{N}" | Every kill, fades 1.5s after last kill |
| Inactivity warning | Bottom bar | font 16px red, flashing | "MOVE!" appears at 9s inactivity | Real-time |

### 6.3 Menu Structure

**Splash Screen** (1500ms auto-advance):
- Background: `#0A0A12` with animated rope swinging across screen
- Title: "ROPE RIOT" in 48px bold white with yellow shadow, center
- Sub: "Tap to start" pulsing at 1hz, 22px white

**Main Menu**:
- Title: "ROPE RIOT" 40px top-center
- PLAY button: 200×60px, fill `#00FFFF`, text black bold 24px, center-screen
- High Score: "BEST: {N}" 18px gold, below play button
- Settings icon: gear ⚙ 32×32px top-right corner

**Pause Menu** (overlay, `rgba(0,0,0,0.75)` background):
- "PAUSED" 32px white center-top of overlay
- RESUME button: 180×50px cyan
- RESTART button: 180×50px red
- MENU button: 180×50px gray

**Game Over Screen** (replaces game canvas):
- "GAME OVER" 36px red, center, with shake animation on appear
- "STAGE {N} REACHED" 22px white
- "SCORE: {N}" 28px white bold
- "BEST: {N}" 22px gold (pulses if new high score)
- PLAY AGAIN button: 200×60px cyan, prominent
- MENU button: 140×48px gray

**Settings Screen** (overlay):
- Sound FX: toggle (on/off)
- Music: toggle (on/off)
- Both stored in localStorage

---

## 7. Monetization

### 7.1 Ad Placements (POC — all placeholder/disabled)

No ads in POC build. `ads.js` contains stubbed hook functions only.

| Ad Type | Status in POC | Future Plan |
|---------|--------------|-------------|
| Interstitial on game over | Disabled | Every 3rd game over |
| Rewarded continue | Disabled | Once per run |
| Banner on menu | Disabled | Menu screen only |

### 7.2 Reward System (Future)

| Reward Type | Trigger | Value |
|-------------|---------|-------|
| Extra life | Watch rewarded ad after death | 1 continue from stage where died |
| Score multiplier | Watch rewarded ad at game over | 2× final score displayed |

### 7.3 Session Economy

POC is purely free-to-play, no monetization pressure. All ad hooks are stub functions that call callback immediately.

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/rope-riot/
├── index.html              # Entry point, CDN scripts, canvas container
├── css/
│   └── style.css           # Mobile-first responsive, portrait lock
└── js/
    ├── config.js           # Constants: colors, difficulty tables, physics params
    ├── main.js             # Phaser.Game init, scene registration, localStorage
    ├── game.js             # GameScene: physics, rope, enemies, collision, input
    ├── stages.js           # Stage generation, enemy wave config, difficulty calc
    ├── ui.js               # MenuScene, GameOverScene, PauseScene, HUD class
    └── ads.js              # Stub ad hooks (all no-ops in POC)
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
```javascript
const CONFIG = {
  WIDTH: 360,
  HEIGHT: 640,
  BG_COLOR: 0x0A0A12,
  COLORS: { PLAYER: 0x00FFFF, ROPE: 0xFFE600, ... },
  PHYSICS: {
    ROPE_LENGTH: 180,          // px
    ROPE_FORCE_BASE: 0.08,     // applied force multiplier
    ROPE_SEGMENTS: 12,         // point count for rope simulation
    ENEMY_MASS: 1.0,
    GRAVITY: 500,
    PLAYER_DODGE_DISTANCE: 40, // px per dodge tap
    PLAYER_DODGE_COOLDOWN: 400 // ms
  },
  DIFFICULTY: { /* stage range tables */ },
  SCORING: { KILL: 100, MULTIKILL_BONUS: 1.5, WAVE_NODODGE: 500 }
};
```

**main.js** (max 300 lines):
- `new Phaser.Game(config)` with WebGL renderer
- Scenes: SplashScene, MenuScene, GameScene, GameOverScene, PauseScene
- `window.GAME_STATE` object: `{ score, stage, highScore, settings, combos }`
- localStorage read on init, write on game over

**game.js** (max 300 lines):
- `create()`: Build platform from `stages.js`, spawn player, init rope simulation, register pointer events
- `update(time, delta)`: Step rope physics, move enemies, check kill conditions, check player fall, check inactivity timer
- `aimRope(pointer)`: Update rope endpoint to pointer position
- `releaseRope()`: Calculate whip arc, apply force to enemies in swing radius, trigger juice effects
- `checkEnemyFall()`: If enemy y > platformBottom + 60, count as killed
- `checkPlayerFall()`: If player x outside platform bounds, trigger death

**stages.js** (max 300 lines):
```javascript
function getStageConfig(stageNumber) {
  return {
    platformWidth: Math.max(160, 360 - stageNumber * 4),
    enemyCount: Math.min(12, 3 + Math.floor(stageNumber * 0.6)),
    enemySpeed: Math.min(140, 40 + stageNumber * 3),
    enemyTypes: getEnemyTypesForStage(stageNumber),
    isRestStage: stageNumber % 10 === 0,
    platformSegments: stageNumber < 11 ? 1 : stageNumber < 26 ? 2 : 3,
    gapSize: stageNumber < 11 ? 0 : stageNumber < 26 ? 40 : 60
  };
}
```

**ui.js** (max 300 lines):
- `MenuScene`: title, play button, high score display, settings icon
- `GameOverScene`: animated score reveal, play again / menu buttons
- `HUD` class (used inside GameScene): score text, stage text, combo text, inactivity warning
- `PauseOverlay`: semi-transparent overlay spawned in GameScene on pause tap

**ads.js** (max 300 lines, mostly stubs):
```javascript
const Ads = {
  showInterstitial(onComplete) { onComplete(); },   // stub
  showRewarded(onRewarded, onSkip) { onSkip(); },   // stub — no reward in POC
  init() {}
};
```

### 8.3 Rope Physics Implementation

**Approach**: Verlet integration chain (no Matter.js — avoid the `_findSupports` crash pattern from run-002).

```javascript
// ROPE: Array of N point masses
// Each point: { x, y, prevX, prevY }
// Constraints: each adjacent pair maintains SEGMENT_LENGTH distance
// Tip point follows pointer while held; base point anchored to player

function updateRope(dt) {
  // 1. Integrate positions (Verlet)
  for each point: integrate(point, GRAVITY, dt)
  // 2. Satisfy constraints (distance) × 3 iterations
  for (let i = 0; i < 3; i++) satisfyConstraints()
  // 3. Anchor base to player position
  rope[0] = playerAnchor
  // 4. If aiming: move tip toward pointer
  if (isAiming) rope[N-1] = pointerPos
}

function releaseRope() {
  // Calculate velocity of tip (prevPos - currentPos)
  // Find all enemies within 20px of any rope segment during swing arc
  // Apply impulse force to each hit enemy
  // Trigger hit effects
}
```

**Why not Matter.js**: Avoids the `_findSupports` crash when removing bodies in collision callbacks (pattern learned in run-002). Verlet rope is simpler and more controllable.

**Enemy Physics**: Enemies use Phaser Arcade Physics (AABB). On rope hit, enemy gets `setVelocity(vx, vy)` based on whip direction vector × force multiplier. After that, they are subject to gravity and fall off-screen. No Matter.js bodies.

### 8.4 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | 3.60.0 | `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js` | Game engine + Arcade Physics |

No Howler.js — all audio is Web Audio API synthesis.
No Matter.js — rope is Verlet, enemies are Arcade Physics.

### 8.5 Local Storage Schema

```json
{
  "rope-riot_high_score": 0,
  "rope-riot_games_played": 0,
  "rope-riot_highest_stage": 0,
  "rope-riot_settings": {
    "sound": true,
    "music": true
  }
}
```

---

## 9. Juice Specification

### 9.1 Rope Whip Release (Primary Action Feedback)

| Effect | Target | Values |
|--------|--------|--------|
| Whip arc line | Rope tip path | Bright yellow `#FFE600`, lineWidth 4px, lifetime 120ms, alpha 1.0→0 |
| Screen shake | Camera | Intensity: 4px, Duration: 120ms, oscillations: 3 |
| Scale punch (player) | Player sprite | Scale 1.0 → 1.25 → 1.0, duration 150ms, easeOut |
| Sound | — | Whip crack: 4000Hz spike, 150ms, volume 0.8 |
| Rope glow release | Rope | Extra glow layer flashes white `#FFFFFF` for 80ms then fades |

### 9.2 Enemy Hit Feedback

| Effect | Target | Values |
|--------|--------|--------|
| Hit flash | Enemy sprite | Tint to `#FFFFFF` for 80ms, restore original tint |
| Particles | Enemy position | Count: 8, Color: `#FFFFAA`, Size: 4px circles, Velocity: radial ±150px/s, Lifespan: 300ms, alpha fade |
| Hit-stop | Game speed | timeScale 0.1 for 40ms, then snap back to 1.0 |
| Screen shake | Camera | Intensity: 3px, Duration: 80ms |
| Sound | — | Thud: 400Hz, 120ms |

### 9.3 Multi-Kill Feedback (2+ enemies same whip)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Each hit enemy | Count: 16 per enemy, Color: `#FFFFAA`, Lifespan: 400ms, Velocity: ±200px/s |
| Screen shake | Camera | Intensity: 6px, Duration: 180ms |
| Combo text popup | Screen center-top | "+{N} KILL!" text, font 32px bold yellow, rises 80px, fades over 700ms |
| Hit-stop | Game speed | timeScale 0.05 for 60ms (more dramatic than single hit) |
| Camera zoom | Camera | Scale 1.0 → 1.04 → 1.0, duration 250ms |
| Sound | — | Arpeggio chord, 250ms, volume 1.0 |

### 9.4 Enemy Falls Into Pit

| Effect | Target | Values |
|--------|--------|--------|
| Velocity spin | Enemy sprite | rotationVelocity = hitForce × 0.02 rad/ms as it falls |
| Scream trail | Enemy path | 3 ghost copies of enemy at previous positions, alpha 0.3/0.2/0.1, 100ms |
| Pit impact particle | Pit bottom edge (off-screen visual) | Not shown — enemy disappears at y > HEIGHT + 40 |
| Score popup | Enemy last position on-screen | "+100" white text, rises 50px, fades 500ms |
| Sound | — | Descending whistle 800→200Hz glide, 300ms |

### 9.5 Death/Failure Effects

| Effect | Target | Values |
|--------|--------|--------|
| Screen shake | Camera | Intensity: 12px, Duration: 350ms, oscillations: 6 |
| Red flash overlay | Full screen | `rgba(255,0,0,0.4)` overlay, duration 300ms, alpha 0.4→0 |
| Player death particles | Player position | Count: 20, Color: `#00FFEE` (cyan), Size: 6px, Velocity: radial ±300px/s, Lifespan: 600ms |
| Player sprite destruction | Player | Scale 1.0 → 2.0 → 0 over 350ms with rotation |
| Slow-mo | Game speed | timeScale 0.3 for 250ms before full stop |
| Sound | — | Low boom: 80Hz sine, 500ms, volume 1.0 |
| Effect → Game Over screen | — | 400ms total death effect, then GameOver scene starts |
| **Death → Restart total** | — | **< 2 seconds** (400ms effects + 100ms transition + 0ms load) |

### 9.6 Stage Clear Effects

| Effect | Target | Values |
|--------|--------|--------|
| Platform flash | All platform tiles | Tint `#8899BB` for 200ms, return to `#3A4A6B` |
| Score bonus popup | Screen center | "STAGE CLEAR! +{N}" font 36px gold, rises 100px, fades 800ms |
| Particles | Screen center | Count: 30, Color: `#FFD700`, Size: 5px, Velocity: upward burst ±150px/s, Lifespan: 700ms |
| Camera zoom | Camera | Scale 1.0 → 1.06 → 1.0, duration 400ms |
| Sound | — | Rising fanfare C-E-G-C, 600ms |
| Stage transition | Scene | 300ms black fade-in/out |

### 9.7 Score HUD Feedback

| Effect | Target | Values |
|--------|--------|--------|
| Score text punch | Score HUD label | Scale 1.0 → 1.35 → 1.0, duration 180ms |
| Color flash | Score text | White `#FFFFFF` → Gold `#FFD700` → White, 300ms |
| Combo counter escalation | Combo text | Font size 24px at ×1, +6px per combo level, max 48px, color intensifies toward red |
| Floating score | Kill position | "+100" or "+{N×combo}", Color: `#FFFFAA`, Rise: 60px, Fade: 600ms |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser FPS counter (show debug in dev) |
| Load Time | <2 seconds on 4G | index.html has no external assets beyond CDN |
| Memory | <80MB | Chrome DevTools |
| JS Bundle Size | <50KB total (CDN excluded) | File size check |
| First Interaction | <500ms after CDN load | Manual timing |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Portrait lock**: CSS `body { orientation: portrait }` + JS orientation warning overlay
- **Touch events**: Phaser pointer input only. `touchstart`/`touchend` via Phaser's input system.
- **Prevent default**: Disable pull-to-refresh, pinch zoom, and context menu on canvas
- **Background pause**: `document.addEventListener('visibilitychange', ...)` pauses game + audio when tab hidden

### 10.3 Critical Implementation Rules (From run-002 Learnings)

1. **NEVER remove bodies inside collision callbacks**: Use `this.time.delayedCall(0, callback)` to defer. BUT: in this game we use Arcade Physics, not Matter.js, so collision callbacks are safe. Still, defer any destroy calls by 1 frame.

2. **NEVER use Matter.js in this game**: Rope = Verlet simulation. Enemies = Arcade Physics. Platform = static Arcade bodies. No Matter.js at all.

3. **Inactivity death at exactly 12 seconds**: Timer resets on ANY pointer input (`pointerdown`, `pointermove`). Show warning text at 9 seconds. Death at 12 seconds.

4. **Death → restart under 2 seconds**: GameScene stops in `destroy()` immediately after death effect begins. `time.delayedCall(500, () => scene.start('GameOver'))`. GameOver scene has no loading. Play Again restarts GameScene immediately.

5. **Rope must feel snappy, not floaty**: ROPE_FORCE_BASE × enemy mass must send enemies at minimum 400px/s velocity on hit. Test and tune in config.js.

### 10.4 Touch Controls — Exact Spec

- Pointer down on bottom 60% of screen → start aiming (rope appears, aiming sound)
- Pointer move while down → update rope tip to pointer position
- Pointer up → release whip (calculate force from drag distance, min 60px to trigger, max 180px)
- Tap (pointerdown + pointerup in < 150ms) on left half → dodge left 40px
- Tap (pointerdown + pointerup in < 150ms) on right half → dodge right 40px
- Tap on top 10% of screen → pause

### 10.5 Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome Android | 80+ | Primary target |
| Safari iOS | 14+ | Test Web Audio context unlock on first tap |
| Samsung Internet | 14+ | Common on Android |
| Firefox Android | 90+ | Secondary |

**Web Audio context unlock**: Must call `audioCtx.resume()` inside a user gesture handler (first tap). All audio synthesis suspended until then.

### 10.6 Enemy AI

All enemies use simple Arcade Physics + manual movement logic. No pathfinding.

| Enemy Type | Movement | Special Behavior |
|-----------|----------|-----------------|
| Walker | `setVelocityX(-speed)` toward player | None |
| Runner | `setVelocityX(-speed * 1.8)` | Stops 80px from player then charges |
| Jumper | `setVelocityX(-speed)` + periodic jump | Jumps over rope if whip detected nearby |
| Shielded | `setVelocityX(-speed * 0.7)` | First hit removes shield (tint change), second hit kills |
| Splitter | `setVelocityX(-speed)` | On hit: spawns 2 small versions at half speed |

**Jumper rope detection**: If any rope segment is within 60px of jumper and jumper is within 120px ahead, apply `setVelocityY(-300)` jump impulse. This creates fun "dodge the whip" moments.

### 10.7 Validation Checklist (Developer Must Verify)

- [ ] Player dies in ≤ 12 seconds of inactivity
- [ ] Death → Game Over screen appears in ≤ 400ms
- [ ] Game Over → Play Again → gameplay in ≤ 2000ms total
- [ ] Rope whip sends enemies visibly flying (≥ 400px/s)
- [ ] Multi-kills trigger combo text
- [ ] Platform shrinks each stage (verify at stage 10, 20, 30)
- [ ] Stage 10 is a rest stage (fewer enemies)
- [ ] Screen shake on death (visible)
- [ ] Score persists in localStorage across sessions
- [ ] Portrait lock active (landscape shows warning)
- [ ] 60fps on mid-range Android (no Matter.js = should be fine)
