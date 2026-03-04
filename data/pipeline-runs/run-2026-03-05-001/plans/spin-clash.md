# Game Design Document: Spin Clash

**Slug**: `spin-clash`
**One-Liner**: Flick to spin your top and smash opponents off the platform before yours slows down.
**Core Mechanic**: Flick-to-dash momentum combat on circular platform, spinning tops knock opponents off
**Target Session Length**: 3-6 minutes
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Spin Clash is a physics-based combat game where the player controls a spinning top on a circular platform. The player flicks the screen to launch their top in a direction, using momentum and spin energy to smash AI-controlled opponent tops off the edge of the platform. The core thrill is the satisfying *crack* of collision — tops bouncing, wobbling, and flying off the edge in slow-motion when hit hard enough.

The tension comes from a dual resource: your top's spin energy slowly depletes over time (like a real Beyblade), so every flick must count. Knock out all opponents before your top slows to a wobble and dies. Each stage introduces more opponents, smaller platforms, and faster enemies that actively hunt the player.

The fantasy is pure kinetic dominance — you are the most powerful spinning thing in the arena, and every launch should feel like a precision strike or a desperate lunge. The Beyblade nostalgia hook is strong: physical spinning top battles are emotionally resonant for anyone who played with them as a child.

### 1.2 Target Audience

Casual mobile gamers aged 15-35 who grew up with Beyblade or similar physical battling toys. Play context: short sessions (commute, waiting room), ideally 2-5 minutes each. Skill expectation: low barrier to entry (one-finger flick), but mastery comes from precise directional flicks and timing. Appeals to the "just one more round" loop driven by quick death and restart.

### 1.3 Core Fantasy

The player IS the champion top — the arena bully. They crash into opponents with satisfying violence, watching them spin off the edge in slow-motion. The power fantasy: you are unstoppable while spinning fast, but vulnerable when slowing down. This creates urgency and drama in every round.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 3-6 minutes |
| Day 1 Retention | 40%+ |
| Day 7 Retention | 20%+ |
| Average Rounds per Session | 4-8 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Round Start] → [Flick to Launch] → [Collision / Miss] → [Spin Depletes] → [All Opponents Out?]
      ↑                                                                              │
      │                                                         ┌────────────────────┤
      │                                           YES: [Round Clear + Score + Next]  │
      │                                           NO:  [Player Falls or Spin Dies]   │
      └─────────────────── [Death → Restart <2s] ←─────────────────────────────────┘
```

Moment-to-moment: Player sees their top in the arena center. They aim with a drag gesture (showing arrow/arc) and release to launch. The top zooms across the platform, collides with enemy tops, causing physics knockback. Player watches the chaos, then repositions by flicking again. Spin energy bar drains constantly — if it hits zero, the player's top wobbles and falls off, triggering game over. Success = knocking all enemies off before spin dies.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Launch / Dash | Drag anywhere on screen, release | Draws an aim arrow from player top; on release, top dashes in that direction with velocity proportional to drag length |
| No secondary action | — | One-gesture design. All gameplay from single flick mechanic. |

**Control Philosophy**: The game is deliberately one-gesture to maximize accessibility. The drag-and-release maps perfectly to the physical act of launching a Beyblade (the pull-back and release of the ripcord). Drag distance = launch power, so short taps = gentle nudges, long drags = powerful dashes. Aim precision improves with practice, rewarding skilled players without punishing beginners who can still win with lucky hits.

**Touch Area Map**:
```
┌─────────────────────────┐
│                         │
│   ┌─────────────────┐   │
│   │                 │   │
│   │   Circular      │   │
│   │   Arena         │   │
│   │   (drag here    │   │
│   │    to aim)      │   │
│   │                 │   │
│   └─────────────────┘   │
│                         │
│  [SPIN BAR ──────────]  │  ← Bottom: spin energy indicator
│                         │
└─────────────────────────┘
```

**Drag Direction**: Drag FROM any position in the full screen toward a target. The arrow visualizer shows where the top will fly on release.

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Enemy knocked off edge | 100 | × combo multiplier |
| Last enemy knocked off (stage clear) | 500 | — |
| Speed kill (enemy off in <2s of contact) | +50 bonus | — |
| Stage cleared with >50% spin remaining | +200 bonus | — |
| Chain: 2 enemies knocked off one dash | +300 bonus | — |

**Combo System**: Combo counter increments for each enemy knocked off without the player's top returning to the center rest zone. Combo multiplier: 1× (1 kill), 1.5× (2 kills), 2× (3 kills), 3× (4+ kills). Combo resets when player's top stops or player is knocked near the edge (within 30px of rim).

**High Score**: Stored in localStorage as `spin-clash_high_score`. Displayed on game over screen with "NEW RECORD" animation if beaten. Running score shown in top-left HUD during gameplay.

### 2.4 Progression System

Rounds are infinite. Each round the platform may get slightly smaller and enemies get more aggressive. Every 5 stages: new enemy behavior introduced.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-3 | 1-2 passive enemies (drift slowly, don't chase) | Easy — learn flick mechanic |
| 4-7 | 2-3 enemies, one "chaser" that tracks player | Medium — timing needed |
| 8-12 | 3-4 enemies, platform shrinks 10% | Hard — precision flicks |
| 13-20 | 4-5 enemies, one "heavy" enemy (needs 2 hits) | Very Hard — target priority |
| 21+ | 5+ enemies, mixed types, fast platform rim | Extreme — survival |

**Enemy Types**:
- **Drifter** (stages 1+): Slow random movement. Easily bumped off. Spin energy: 100%.
- **Chaser** (stages 4+): Actively moves toward player. Aggressive but light. Spin: 80%.
- **Heavy** (stages 13+): Large radius, requires 2 strong hits to knock off. Spin: 60%. Moves slowly but predictably.
- **Bouncer** (stages 8+): High restitution — deflects player top back. Mid-weight.

### 2.5 Lives and Failure

One life per round. No continue system in POC.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Player top falls off platform edge | Round over, game over screen | Tap to restart |
| Player spin energy hits 0% | Top wobbles 1s then falls — game over | Tap to restart |
| 15 seconds of no flick input (inactivity) | Instant game over (death test) | Tap to restart |

**Death → Restart time**: Game over animation 500ms → fade to black 200ms → new round initialized 200ms → fade in 500ms = **1.4 seconds total** (well under 2s requirement).

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each stage is defined by: platform radius, enemy count, enemy type composition, enemy aggression level, and spin energy drain rate. No procedural layout — the arena is always circular. Variety comes from enemy behavior and count.

**Stage Parameters**:
```
Stage Generation Parameters:
- Platform radius: 180px (stage 1) → minimum 120px (stage 20+), shrinks by 3px per stage
- Enemy count: ceil(1 + stage * 0.4), capped at 6
- Chaser ratio: 0 (stage 1-3), 0.25 (stage 4-7), 0.5 (stage 8-12), 0.75 (stage 13+)
- Heavy enemy: introduced at stage 13, 1 per stage 13-17, 2 per stage 18+
- Spin drain rate: 8%/s (stage 1-5), 10%/s (stage 6-10), 12%/s (stage 11-20), 15%/s (stage 21+)
- Enemy speed multiplier: 1.0 + (stage * 0.05), capped at 2.0
```

### 3.2 Difficulty Curve

```
Difficulty
    │
100 │                                          ──────────── (cap at stage 30+)
    │                                    ╱
 80 │                              ╱
    │                     ╱──────╱  (step at stage 13: heavy enemy)
 60 │               ╱────╱
    │         ╱────╱  (step at stage 8: platform shrinks)
 40 │   ╱────╱
    │  ╱  (step at stage 4: chaser intro)
 20 │╱
    │
  0 └────────────────────────────────────────── Stage
    0    5    10   15   20   25   30+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-3 | Stage 4-7 | Stage 8-12 | Stage 13-20 | Stage 21+ |
|-----------|-----------|------------|-------------|-------------|-----------|
| Enemy Count | 1-2 | 2-3 | 3-4 | 4-5 | 5-6 |
| Platform Radius | 180px | 170px | 155px | 135px | 120px |
| Spin Drain | 8%/s | 9%/s | 11%/s | 13%/s | 15%/s |
| Enemy Speed | 1.0x | 1.2x | 1.4x | 1.6x | 2.0x |
| Chaser % | 0% | 25% | 50% | 75% | 75% |
| Heavy Enemies | None | None | None | 1 | 2 |

### 3.3 Stage Generation Rules

1. **Always Solvable**: Minimum spin energy at stage start (100%) is always sufficient to knock all enemies off if the player lands direct hits. Validated: spin drain × estimated time-to-clear < 100% for all stages.
2. **Spawn Safety**: Enemies always spawn at platform edge positions, player top always spawns at center. No immediate overlaps.
3. **Rest Stages**: Every 5 stages, spin drain reduced by 3%/s for that stage only (breathing room).
4. **Enemy Spacing**: Enemies always spawned at least 60° apart around the rim to prevent clustering at start.
5. **No Stage Identical**: Enemy positions randomized via `stage_number + Math.random()` seed each play.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Neon geometric. Dark background with glowing tops that leave light trails. Think Tron disc battle but with spinning tops. Clean, readable, visually spectacular collisions.

**Aesthetic Keywords**: Neon, kinetic, glowing, arcade, retro-future

**Reference Palette**: Dark arena floor with grid lines, glowing top bodies, particle bursts on collision

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Player Top | Cyan | `#00E5FF` | Player top body, trails |
| Enemy Drifter | Pink | `#FF4081` | Drifter enemy tops |
| Enemy Chaser | Orange | `#FF6D00` | Chaser enemy tops |
| Enemy Heavy | Purple | `#AA00FF` | Heavy enemy tops (larger) |
| Background | Dark Navy | `#0A0E1A` | Arena background |
| Platform | Dark Blue | `#1A2340` | Circular platform surface |
| Platform Edge | White | `#FFFFFF` | Platform rim glow line |
| Spin Bar (full) | Cyan | `#00E5FF` | Spin energy bar high |
| Spin Bar (low) | Red | `#FF1744` | Spin energy bar <30% |
| Score Text | White | `#FFFFFF` | HUD score |
| Combo Text | Gold | `#FFD600` | Combo counter |
| UI Background | Dark Overlay | `#0A0E1A` at 85% | Menu/overlay backgrounds |

### 4.3 SVG Specifications

All graphics are SVG generated in JavaScript, no external assets.

**Player Top** (cyan, 28px radius):
```svg
<!-- Player top: layered circles with rotation ring -->
<circle cx="0" cy="0" r="18" fill="#00E5FF" opacity="0.9"/>
<circle cx="0" cy="0" r="10" fill="#FFFFFF" opacity="0.6"/>
<circle cx="0" cy="0" r="4" fill="#00E5FF"/>
<!-- Spin ring (rotates in CSS) -->
<ellipse cx="0" cy="0" rx="22" ry="6" fill="none" stroke="#00E5FF" stroke-width="2" opacity="0.7"/>
```

**Enemy Drifter** (pink, 22px radius):
```svg
<circle cx="0" cy="0" r="16" fill="#FF4081" opacity="0.9"/>
<circle cx="0" cy="0" r="8" fill="#FFFFFF" opacity="0.5"/>
<ellipse cx="0" cy="0" rx="20" ry="5" fill="none" stroke="#FF4081" stroke-width="2" opacity="0.7"/>
```

**Enemy Heavy** (purple, 34px radius):
```svg
<circle cx="0" cy="0" r="26" fill="#AA00FF" opacity="0.9"/>
<circle cx="0" cy="0" r="14" fill="#FFFFFF" opacity="0.4"/>
<circle cx="0" cy="0" r="5" fill="#AA00FF"/>
<ellipse cx="0" cy="0" rx="30" ry="8" fill="none" stroke="#AA00FF" stroke-width="3" opacity="0.7"/>
```

**Platform**:
```svg
<!-- Dark circular platform with grid -->
<circle cx="0" cy="0" r="180" fill="#1A2340"/>
<circle cx="0" cy="0" r="180" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.8"/>
<!-- Inner grid lines: 4 lines crossing center -->
<line x1="-180" y1="0" x2="180" y2="0" stroke="#FFFFFF" stroke-width="0.5" opacity="0.15"/>
<line x1="0" y1="-180" x2="0" y2="180" stroke="#FFFFFF" stroke-width="0.5" opacity="0.15"/>
```

**Collision Burst Particle**:
```svg
<!-- Small glowing dot, 4px radius, color matches top that was hit -->
<circle cx="0" cy="0" r="4" fill="{color}" opacity="1.0"/>
```

**Design Constraints**:
- All SVG generated as Phaser GameObjects using `scene.add.graphics()`
- Maximum 6 draw commands per top (circle fill + ring ellipse + center dot)
- Trails: 6 fading ghost copies at previous positions (opacity 0.1 to 0.6)
- Platform drawn once and cached as texture
- Animations via `scene.tweens` — no SVG animate elements

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Hit spark burst | Top collision | 20 particles radially from impact point, random velocities 60-200px/s, lifespan 300ms, fade out |
| Player trail | Player top movement | 6 ghost copies at prev positions every 30ms, opacity 0.6→0.05, lifespan 180ms |
| Screen shake | Player takes knockback (within 30px of edge) | Camera offset ±6px, 150ms, decreasing amplitude |
| Slow-mo effect | Enemy knocked off edge | Time scale → 0.3 for 400ms while enemy falls, then resumes normal |
| Spin ring rotation | Always (idle and moving) | Player ring rotates at `spinEnergy * 20` deg/s, enemy rings at fixed 12 deg/s |
| Spin bar pulse | Spin energy <30% | Bar color → red, scale pulse 1.1× every 500ms |
| Stage clear flash | All enemies knocked off | White flash overlay, opacity 0→0.8→0, 300ms total |
| Death wobble | Spin energy hits 0% | Player top scale oscillates 0.9×-1.1× at 8Hz for 800ms before falling |

---

## 5. Audio Design

### 5.1 Sound Effects

All sounds generated via Web Audio API (no external files required). `AudioContext` oscillator synthesis.

| Event | Sound Description | Duration | Synthesis |
|-------|------------------|----------|-----------|
| Flick launch | High-pitched whoosh, rising pitch | 150ms | Oscillator sweep 200Hz→800Hz |
| Top collision | Sharp crack + metallic ring | 250ms | Sawtooth burst at 440Hz + decay |
| Enemy off edge | Descending whistle + splash | 500ms | Sine sweep 600Hz→100Hz |
| Stage clear | Ascending 3-note fanfare | 600ms | Oscillator C4-E4-G4 sequence |
| Game over | Low descending thud | 800ms | Triangle wave 200Hz→50Hz |
| Spin dying (low energy) | Low wobble hum | Looping | Oscillator at 80Hz, wobble LFO at 4Hz |
| Chain kill bonus | Rising ping | 200ms | Sine 880Hz + harmonics |
| UI tap | Subtle click | 80ms | White noise burst, 80ms |
| New stage number | Bright ding | 200ms | Sine 1047Hz (C6) |

### 5.2 Music Concept

**Background Music**: Generated procedurally via Web Audio API. Layered drone: bass note (root), mid pulse (rhythm), high shimmer (ambience). Dynamic: rhythm pulse speed increases with stage number. No loops, no external files.

**Music State Machine**:
| Game State | Music Behavior |
|-----------|---------------|
| Menu | Slow bass drone, 60bpm shimmer pulse |
| Stage 1-5 | Bass + 90bpm rhythm pulse |
| Stage 6-15 | Bass + 120bpm pulse, added high shimmer |
| Stage 16-30 | Faster pulse 140bpm, more harmonics |
| Stage 31+ | 160bpm, intense layer |
| Game Over | Music fade over 1000ms |
| Pause | All audio gain → 0.1 over 200ms |

**Audio Implementation**: Native Web Audio API. `AudioContext` created on first user gesture (iOS compatibility). No external CDN required.

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Title       │────→│   Menu       │────→│   Game       │
│  (500ms      │     │  Screen      │     │  Scene       │
│   fade-in)   │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
                           │                     │
                      ┌────┘                ┌────┴────┐
                      │                     │  Pause  │
                      │                     │ Overlay │
                      │                     └────┬────┘
                      │                          │
                      │                     ┌────┴────┐
                 ┌────┴────┐               │  Game   │
                 │Settings │               │  Over   │
                 │ Overlay │               │ Screen  │
                 └─────────┘               └─────────┘
```

**Title screen**: Visible for 500ms on first load. Shows spinning top animation and title "SPIN CLASH" in neon font. Auto-transitions to Menu. Skip on tap.

### 6.2 HUD Layout

```
┌──────────────────────────────┐
│ Score: 1250    Stage: 4      │  ← Top bar (44px height)
├──────────────────────────────┤
│                              │
│                              │
│       ○ ● ● ● ●             │  ← Arena with tops
│       (circular platform)   │
│                              │
│                              │
├──────────────────────────────┤
│ [SPIN ████████████░░░░░░░░]  │  ← Spin energy bar (36px height)
│  ↑ Cyan → Red when low       │
└──────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left, 16px from edge | Numeric score, white bold 20px | Every score event |
| Stage | Top-right, 16px from edge | "Stage N" white 16px | On stage transition |
| Spin Bar | Bottom full-width, 36px | Gradient fill, cyan→red at 30% | Every frame |
| Combo Text | Center-screen below arena | "×2 COMBO!" gold, 28px | Appears on combo, fades 1200ms |
| Floating Score | Impact point | "+100" rising text, 20px | Per kill |
| Aim Arrow | From player to drag target | Cyan dashed line, arrowhead | Every drag frame |

### 6.3 Menu Structure

**Main Menu**:
- "SPIN CLASH" title with spinning top animation (top center)
- "PLAY" button (large, 240×64px, neon cyan border)
- "BEST: {score}" below play button (white 16px)
- Settings gear icon (top-right, 44×44px tap area)

**Pause Menu** (overlay, `#0A0E1A` at 85% opacity):
- "PAUSED" title
- "RESUME" button
- "RESTART" button
- "MENU" button

**Game Over Screen** (full overlay fade-in 300ms):
- "GAME OVER" in red 32px
- Final score (40px white, scale punch animation)
- "BEST: {high score}" (18px gold if new record: "NEW RECORD!" animation)
- "Stage Reached: N" (16px)
- "PLAY AGAIN" button (primary, cyan)
- "MENU" button (secondary, outline)

**Settings Screen** (overlay):
- Sound Effects: On/Off toggle
- Music: On/Off toggle

---

## 7. Monetization (Placeholder — POC: No Ads)

### 7.1 Ad Placements (future)

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue once per session | Per game over | Always optional |
| Banner | Menu screen only | Always | N/A |

### 7.2 POC Note

**POC builds have zero ad integration**. `ads.js` exists as stub file with empty function hooks. All ad triggers are stubbed to `return null`. This is intentional per pipeline policy.

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/spin-clash/
├── index.html              # Entry point, Phaser CDN, scene scripts
├── css/
│   └── style.css           # Mobile-first, portrait lock, safe areas
└── js/
    ├── config.js           # Constants: colors, sizes, difficulty tables, physics
    ├── main.js             # Phaser.Game init, scene registration, localStorage, global state
    ├── game.js             # GameScene: arena, tops, collision, spin bar, flick input
    ├── stages.js           # Stage parameters, enemy spawn, difficulty scaling
    ├── ui.js               # MenuScene, GameOverScene, HUD, PauseOverlay
    └── ads.js              # Stub file, empty hooks for future ad integration
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `COLORS`: All hex color constants
- `PLATFORM`: `{ BASE_RADIUS: 180, MIN_RADIUS: 120, SHRINK_PER_STAGE: 3 }`
- `PLAYER_TOP`: `{ RADIUS: 18, MASS: 1.0, MAX_SPEED: 600, TRAIL_COUNT: 6 }`
- `ENEMY_TYPES`: `{ DRIFTER, CHASER, HEAVY, BOUNCER }` with radius, mass, speed, hp
- `DIFFICULTY`: Stage range → parameter table
- `SCORE_VALUES`: Kill=100, StageBonus=500, SpeedKill=50, SpinBonus=200, Chain=300
- `SPIN`: `{ START: 100, DRAIN_BY_STAGE: [8,8,8,9,9,9,10,10,11,11,...], DEATH_THRESHOLD: 0 }`
- `JUICE`: Screen shake intensities, particle counts, animation durations

**main.js** (max 300 lines):
- `Phaser.Game` init with config: `{ type: Phaser.AUTO, width: 360, height: 640, physics: { default: 'arcade' } }`
- Responsive scale: `ScaleManager` with `FIT` and `CENTER_BOTH`
- Scene registration: `MenuScene`, `GameScene`, `GameOverScene`
- Global state object: `window.GAME_STATE = { score, stage, highScore, settings }`
- LocalStorage: `loadState()` and `saveState()` functions
- Audio context initialization on first user gesture

**game.js** (max 300 lines):
- `GameScene extends Phaser.Scene`
- `create()`: Draw circular platform (graphics cache), spawn player top, spawn enemies, set up flick input (pointerdown/pointerup), initialize spin bar, start inactivity timer
- `update(time, delta)`: Update spin energy (drain), check death conditions, update trails, rotate spin rings, check inactivity
- `onPointerDown(pointer)`: Record start position and time, show aim arrow
- `onPointerMove(pointer)`: Update aim arrow direction and length indicator
- `onPointerUp(pointer)`: Calculate velocity vector from drag delta, apply to player top via `physics.velocityFromAngle`
- `checkCollision()`: Phaser arcade `overlap` between player top and each enemy. On collision: apply knockback physics, trigger hit spark juice, check if enemy is beyond platform radius
- `checkPlatformEdge()`: Each frame, any top (player or enemy) with distance from center > platform radius triggers off-edge logic
- `knockEnemyOff(enemy)`: Remove enemy, add score, trigger slow-mo, check if stage cleared
- `playerDeath()`: Stop input, wobble animation, 500ms delay, emit `stage-failed` event
- `inactivityTimer`: 15-second Phaser timer; reset on any flick; on expire: call `playerDeath()`

**stages.js** (max 300 lines):
- `getStageConfig(stageNumber)`: Returns `{ platformRadius, enemyCount, enemies: [{type, x, y}], spinDrain, restStage }`
- `getEnemyMix(stageNumber)`: Returns array of enemy type strings based on difficulty formula
- `spawnEnemies(scene, config)`: Creates enemy game objects with correct type properties
- `getEnemyBehavior(enemy, player, delta)`: AI movement logic per enemy type
  - Drifter: `velocity += random(-0.5, 0.5) * speed` — Brownian motion, bounces off rim
  - Chaser: `velocity = normalize(player.pos - enemy.pos) * speed` — direct pursuit
  - Heavy: slow Drifter pattern, ignores knockback under threshold
  - Bouncer: Drifter + high restitution multiplier on collision

**ui.js** (max 300 lines):
- `MenuScene`: Renders title, play button, best score, settings button, spinning top decoration
- `GameOverScene`: Receives `{ score, stage, isHighScore }` from scene data; renders game over overlay with animations; "Play Again" → starts `GameScene`; "Menu" → starts `MenuScene`
- `HUD` class: `update(score, stage, spinEnergy, comboCount)` — updates text objects, animates combo, updates spin bar fill
- `PauseOverlay`: Toggle visibility on pause button tap. Buttons: resume, restart, menu.
- `AimArrow`: Graphics object updated every drag frame — dashed line from player center to target, max length 160px (clipped), arrowhead triangle at end

**ads.js** (max 300 lines — stub):
- All functions defined but return `null` immediately
- `showInterstitial()`, `showRewarded(callback)`, `showBanner()`, `hideBanner()` — all stubs
- No external SDK loaded in POC builds

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | 3.60.0 | `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js` | Game engine |

**No Howler.js** — all audio via Web Audio API (native, no CDN needed).

### 8.4 Physics Model (Phaser Arcade)

- Player top: `arcadeBody`, `setCircle(18)`, `maxVelocity: 600`, `drag: 80` (natural slowdown)
- Enemy tops: `arcadeBody`, `setCircle(radius)`, `drag: 60`
- Collision: `physics.add.collider(playerTop, enemies)` — elastic collision with restitution factor
- Platform boundary: Not a physics body. Checked manually in `update()`: `distance(top, center) > platformRadius` triggers off-edge
- Flick velocity: `body.setVelocity(dragDx * LAUNCH_POWER, dragDy * LAUNCH_POWER)` where `LAUNCH_POWER = 4.5`, max drag delta clamped to 120px
- Knockback on enemy hit: `enemy.body.setVelocity(knockVx * 1.8, knockVy * 1.8)` where knock vector = normalize(enemy.pos - player.pos) * 450

---

## 9. Juice Specification

**MANDATORY SECTION — Builder and Joy will FAIL plans missing specific numeric values.**

### 9.1 Player Flick Feedback (every launch)

| Effect | Target | Values |
|--------|--------|--------|
| Trail spawn | Player top | 6 ghost copies, opacity 0.6→0.05, decay over 180ms, 30ms between each |
| Launch sound | Audio | Oscillator sweep 200Hz→800Hz, 150ms, gain 0.4 |
| Aim arrow hide | Arrow graphics | Instant hide on release (0ms) |
| Top glow pulse | Player top | Scale 1.0→1.15→1.0 over 120ms on launch |

### 9.2 Collision Feedback (impact moment — most satisfying event)

| Effect | Values |
|--------|--------|
| Hit spark particles | 20 particles at impact point, radial burst, velocities 60-200px/s, colors from both tops, lifespan 300ms, size 4px |
| Hit-stop | 50ms — freeze all physics (set timeScale=0 for 50ms), then resume |
| Screen shake | Intensity: ±5px x+y, Duration: 120ms, decreasing amplitude (3 oscillations) |
| Camera zoom | 1.04× zoom centered on impact, recovery over 250ms |
| Impact sound | Sawtooth burst 440Hz, 250ms decay, gain 0.6 |
| Floating score | "+100" gold text at impact point, rises 60px over 600ms, fades last 200ms |
| Combo escalation | Each subsequent hit in combo: particle count +5 (max 40), sound pitch +10% |

### 9.3 Enemy Off-Edge Effect

| Effect | Values |
|--------|--------|
| Slow motion | timeScale → 0.3 for 400ms while enemy exits platform, then timeScale back to 1.0 over 100ms |
| Off-edge trail | Enemy leaves 10-particle trail as it falls (opacity 0.8→0 over 500ms) |
| Sound | Descending whistle 600Hz→100Hz over 500ms |
| Stage clear check | If last enemy: white flash (opacity 0→0.8→0, 300ms), stage number bump animation |

### 9.4 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Spin dying warning | Bar turns red at 30%, pulses 1.1× scale every 500ms, wobble sound loops at 80Hz |
| Spin hit 0% wobble | Player top oscillates scale 0.9×-1.1× at 8Hz for 800ms |
| Death screen shake | Intensity: ±12px, Duration: 300ms, camera shake |
| Death desaturation | Screen CSS filter `saturate(0)` animates over 400ms |
| Death sound | Triangle wave 200Hz→50Hz, 800ms |
| Effect → UI delay | 600ms between death animation start and Game Over screen appearance |
| Death → restart | Total < 1400ms (animation 600ms + fade 200ms + init 200ms + fade-in 400ms) |

### 9.5 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{N}" gold text, 20px bold, rises 60px, duration 600ms, fade last 200ms |
| Score HUD punch | Score text scale 1.0→1.3→1.0 over 150ms, tween easeOut |
| Combo text spawn | "×{N} COMBO" center-screen, 28px gold, appears with scale 0.5→1.2→1.0 over 200ms, fades after 1200ms |
| Combo escalation | Each combo level: font size +4px (28→32→36→40px), particle burst at combo display position, 10 gold particles |
| Chain kill special | "CHAIN!" text purple 36px, screen edge flash purple for 200ms |

### 9.6 Stage Clear Effects

| Effect | Values |
|--------|--------|
| White flash | opacity 0→0.8→0 over 300ms |
| Stage number bump | "Stage N" text scale 1.0→1.5→1.0 over 400ms, golden color for 500ms |
| Fanfare sound | C4-E4-G4 oscillator sequence, 200ms each note, gain 0.5 |
| Brief pause | 500ms before new enemies spawn (let player see cleared arena) |
| Spin energy refill | Spin bar animates from current% → 100% over 600ms with flash effect |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS display (debug mode) |
| Load Time | <2 seconds | DevTools Network tab |
| Memory Usage | <80MB | Chrome DevTools Memory |
| JS Bundle Size | <200KB total (excl. CDN) | File size check |
| First Interaction | <500ms after load | Immediate — no loading screen |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Portrait Lock**: `<meta name="screen-orientation" content="portrait">` + CSS `@media (orientation: landscape)` shows rotate prompt
- **Touch Events**: Phaser `pointer` events — handles both touch and mouse seamlessly
- **Prevent Default**: `event.preventDefault()` on touchstart/touchmove to prevent scroll/zoom
- **Safe Areas**: `padding: env(safe-area-inset-top)` on HUD top bar
- **Background Pause**: `document.addEventListener('visibilitychange')` → pause game on hidden
- **Drag Threshold**: 8px minimum drag before aim arrow appears (prevents accidental activations on tap)
- **Tap = Short Flick**: Tap (release < 8px from press) = short flick in last known direction or random forward nudge

### 10.3 Critical Implementation Warnings

**Phaser Arcade Physics — Platform Edge Check**:
- Do NOT use physics bodies for platform boundary. Use manual distance check in `update()`.
- `const dist = Phaser.Math.Distance.Between(top.x, top.y, CENTER_X, CENTER_Y);`
- `if (dist > platformRadius + top.body.radius) triggerOffEdge(top);`

**Hit-Stop Implementation**:
- Use `this.physics.world.timeScale = 0` for 50ms, then reset to 1.
- Guard: do not chain hit-stops if two collisions occur within 100ms.
- `let lastHitStop = 0; if (time - lastHitStop > 100) { doHitStop(); lastHitStop = time; }`

**Slow-Motion Enemy Off-Edge**:
- `this.physics.world.timeScale = 0.3` for 400ms only affects physics bodies.
- Visual: Phaser tweens run in real time unless `useFrames: true` — use `useFrames: false` so tweens feel correct during slo-mo.

**Inactivity Timer**:
- Reset timer on `pointerdown` event only (not move/up).
- `Phaser.Time.TimerEvent` with `delay: 15000`, `callback: playerDeath`.
- Call `inactivityTimer.reset(config)` on each pointerdown to restart countdown.

**Spin Energy Drain**:
- Drain: `spinEnergy -= DRAIN_RATE * (delta / 1000)` per frame.
- Stop drain during hit-stop (timeScale=0 pauses physics but update() still calls — check for hit-stop state).

**SVG Rendering via Phaser Graphics**:
- Use `scene.add.graphics()` for all tops and platform.
- For trails: maintain array of `{ x, y, timestamp }` positions. Draw as fading circles in `update()`.
- Top spin ring: rotate via `scene.tweens.add({ targets: ring, angle: 360, duration: ringDuration, repeat: -1 })` where duration decreases with spin energy.

### 10.4 Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome (Android) | 80+ | Primary target, full Web Audio API |
| Safari (iOS) | 14+ | AudioContext requires user gesture; create on first tap |
| Samsung Internet | 14+ | Test drag precision |
| Firefox (Android) | 90+ | Secondary target |

### 10.5 Local Storage Schema

```json
{
  "spin-clash_high_score": 0,
  "spin-clash_games_played": 0,
  "spin-clash_highest_stage": 0,
  "spin-clash_settings": {
    "sound": true,
    "music": true
  }
}
```

### 10.6 Key Variables Reference

```javascript
// config.js constants (critical for developer)
const CENTER_X = 180;          // 360px wide canvas, center
const CENTER_Y = 300;          // 640px tall canvas, arena center
const LAUNCH_POWER = 4.5;      // multiplier for drag delta → velocity
const MAX_DRAG_PX = 120;       // cap on drag distance used for velocity calc
const PLAYER_RADIUS = 18;      // player top collision radius (px)
const DRIFTER_RADIUS = 16;     // drifter enemy radius
const HEAVY_RADIUS = 26;       // heavy enemy radius
const KNOCKBACK_MULTIPLIER = 1.8; // velocity multiplier applied to enemy on hit
const HIT_STOP_MS = 50;        // hit-stop freeze duration
const SLOW_MO_SCALE = 0.3;     // timeScale during enemy-off-edge slow-mo
const SLOW_MO_DURATION = 400;  // ms of slow-mo per enemy off edge
const INACTIVITY_DEATH_MS = 15000; // 15s idle → death
const DEATH_ANIM_MS = 600;     // death animation before Game Over screen
const SPIN_REFILL_MS = 600;    // spin bar refill animation on stage clear
```
