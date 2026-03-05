# Game Design Document: Parkour Tap

**Slug**: `parkour-tap`
**One-Liner**: Tap to vault, slide, and wall-jump through a parkour course -- perfect timing chains into smooth flow
**Core Mechanic**: Runner auto-runs right. Tap at right moment for context-sensitive parkour move. Unnecessary taps = stumble. 3 stumbles = game over.
**Target Session Length**: 30-90 seconds
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

The player controls a parkour runner who auto-runs to the right through an endless urban obstacle course. Obstacles appear in sequence -- walls to vault over, bars to slide under, gaps to wall-jump across. The player's only input is a single tap, but WHEN they tap determines everything.

Each obstacle has a "sweet zone" indicated by a subtle glow as the runner approaches. Tap inside the zone and the runner performs a fluid context-sensitive move (vault, slide, or wall-jump) with motion trails and satisfying feedback. Tap outside any zone and the runner stumbles, losing one of three lives. Miss an obstacle entirely (no tap within 3 seconds of approach) and the runner crashes into it -- also losing a life.

The magic is in the FLOW. Perfect-timing taps chain into combos that make the runner move faster, trail effects intensify, the camera pulls out slightly, and the score multiplier climbs. The game becomes a rhythm of anticipation and execution -- tap, flow, tap, flow -- until the obstacles come so fast and the timing windows shrink so tight that even one mistimed tap breaks the chain.

### 1.2 Target Audience

Casual mobile gamers aged 13-35 who enjoy reflex-based games. Perfect for short bursts during commutes, waiting rooms, or between tasks. Low skill floor (just tap) but high skill ceiling (perfect timing chains). Appeals to the same audience as Subway Surfers, Crossy Road, and rhythm games.

### 1.3 Core Fantasy

You ARE a parkour master in flow state. Every vault is smooth, every slide is graceful, every wall-jump lands perfectly. The world blurs around you as you chain moves together. You don't think -- you react. The fantasy is effortless mastery through perfect timing.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 45-90 seconds |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 22%+ |
| Average Stages per Session | 8-20 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Auto-run] --> [Obstacle approaches] --> [Tap in sweet zone?]
     ^                                        |
     |                     YES: Fluid move + combo + score
     |                     NO (bad tap): Stumble (-1 life)
     |                     NO (no tap): Crash (-1 life)
     |                                        |
     |                              [Lives > 0?]
     |                         YES ---|--- NO --> [Game Over]
     |                                |
     [Continue running] <-------------+
```

Moment-to-moment: Watch runner approach obstacle -> identify obstacle type (visual cue) -> anticipate timing -> TAP -> feel the satisfying move -> repeat. The rhythm accelerates as stages progress.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Parkour Move | Single Tap (anywhere) | Context-sensitive: vault (wall), slide (bar), wall-jump (gap) |

**Control Philosophy**: One-tap-does-everything. The game reads context (which obstacle is next) and performs the right move. Player only needs to worry about WHEN, not WHAT. This keeps cognitive load minimal while maintaining high skill expression through timing precision.

**Touch Area Map**:
```
+-----------------------------+
|  Score    Stage    Lives    |  <- HUD (non-interactive)
|-----------------------------|
|                             |
|    TAP ANYWHERE IN THIS     |
|    ENTIRE AREA TO PERFORM   |
|    PARKOUR MOVE             |
|                             |
|   [Runner] --> [Obstacle]   |
|                             |
|                             |
+-----------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Perfect Move (within 80ms of center) | 150 | Combo multiplier applies |
| Good Move (within timing window) | 100 | Combo multiplier applies |
| Combo Bonus | +50 per combo level | Every 5 consecutive perfects |
| Stage Clear | 200 | x2 if zero stumbles in stage |

**Combo System**: Each successful move increments the combo counter. Perfect moves increment by 2. Stumbles reset combo to 0. Combo multiplier = 1 + floor(combo / 5) * 0.5, capped at 5x. At combo 10+ the runner gets motion trails. At combo 20+ the background shifts color. At combo 30+ particle density doubles.

**High Score**: Stored in localStorage as `parkour-tap_high_score`. Displayed on menu screen and game over screen. New high score triggers celebratory particles and "NEW BEST!" text.

### 2.4 Progression System

The game uses a continuous stage system. Each "stage" is a sequence of 5-8 obstacles. Completing all obstacles in a stage triggers a brief stage-clear flash and the next stage begins seamlessly (no loading, no pause).

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-3 | Walls only (vault) | Easy -- timing window +/-300ms, 1.5s between obstacles |
| 4-6 | Bars added (slide) | Medium -- timing window +/-250ms, 1.2s gap |
| 7-10 | Gaps added (wall-jump) | Medium-Hard -- timing +/-200ms, 1.0s gap |
| 11-20 | Mixed obstacle combos, speed ramps | Hard -- timing +/-150ms, 0.8s gap |
| 21-40 | Double obstacles (vault+slide in sequence), fake-outs | Very Hard -- timing +/-120ms, 0.6s gap |
| 41+ | Triple combos, minimal telegraph | Extreme -- timing +/-100ms, 0.5s gap |

### 2.5 Lives and Failure

The player has 3 lives (shown as runner silhouette icons in HUD). Lives are lost by:

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Stumble (tap outside sweet zone) | Lose 1 life, brief stumble animation (200ms), combo reset | Continue running |
| Crash (no tap, hit obstacle) | Lose 1 life, crash animation (300ms), combo reset | Continue running |
| 3s idle (no tap near approaching obstacle) | Crash into obstacle, lose 1 life | Continue running |
| 0 lives remaining | Game Over screen | Watch ad to continue (1 extra life, once per run) |

**Inactivity Death**: If the player does not tap for 3 seconds while an obstacle is within approach range, the runner crashes into it automatically. This prevents AFK exploitation.

**Death-to-restart time**: Under 1.5 seconds from game over screen to new run.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Stages are generated procedurally based on stage number. Each stage consists of a sequence of obstacles placed along the horizontal run path.

**Generation Algorithm**:
```
Stage Generation Parameters:
- stage_number: current stage (1+)
- obstacles_per_stage: 5 + min(stage_number, 10) (caps at 15)
- obstacle_types: ['wall', 'bar', 'gap'] (unlocked progressively)
- timing_window: max(100, 300 - stage_number * 5) ms (each side)
- obstacle_spacing: max(0.5, 1.5 - stage_number * 0.025) seconds
- speed_multiplier: min(2.5, 1.0 + stage_number * 0.04)
- fake_out_chance: min(0.3, max(0, (stage_number - 15) * 0.015))
- double_obstacle_chance: min(0.4, max(0, (stage_number - 18) * 0.02))
```

### 3.2 Difficulty Curve

```
Difficulty
    |
100 |                                          ------------ (cap)
    |                                    /
 80 |                              /
    |                        /
 60 |                  /
    |            /
 40 |      /
    |  /
 20 |/
    |
  0 +------------------------------------------ Stage
    0    10    20    30    40    50    60    70+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-3 | Stage 4-10 | Stage 11-20 | Stage 21-40 | Stage 41+ |
|-----------|-----------|------------|-------------|-------------|-----------|
| Run Speed (px/s) | 200 | 240-320 | 320-400 | 400-480 | 480-500 |
| Timing Window (ms) | +/-300 | +/-250 to +/-200 | +/-200 to +/-150 | +/-150 to +/-120 | +/-100 |
| Obstacle Gap (s) | 1.5 | 1.2-1.0 | 1.0-0.8 | 0.8-0.6 | 0.5 |
| Obstacles/Stage | 5 | 6-7 | 7-8 | 8-10 | 10-15 |
| Fake-outs | None | None | 5% | 15-25% | 30% |
| Double combos | None | None | None | 10-30% | 40% |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every obstacle has a valid timing window. Double obstacles always have enough gap between them (minimum 400ms) for two sequential taps.
2. **Variety Threshold**: No more than 3 identical obstacle types in a row. After 3 of the same type, force a different type.
3. **Difficulty Monotonicity**: Speed and timing windows only tighten with stage progression. Local obstacle density may vary within a stage for rhythm.
4. **Rest Beats**: Every stage includes at least one 2x-gap "rest beat" between obstacles (usually after the 3rd obstacle) to let the player breathe.
5. **Boss Stages**: Every 10th stage is a "flow stage" -- all obstacles are evenly spaced at tight timing, but if the player chains all perfects, a special reward animation plays. No new difficulty, just execution test.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Clean geometric minimalism with motion emphasis. The runner and obstacles are simple shapes with bold outlines. The focus is on motion effects -- trails, streaks, and blur -- that make movement feel fast and fluid.

**Aesthetic Keywords**: Flow, Speed, Urban, Clean, Dynamic

**Reference Palette**: Think Mirror's Edge minimalism meets Canabalt speed. White/light backgrounds with bold colored obstacles and a vibrant runner silhouette.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Runner | Electric Blue | #00B4D8 | Player character, motion trails |
| Wall Obstacle | Coral Red | #E63946 | Walls to vault over |
| Bar Obstacle | Amber | #F4A261 | Bars to slide under |
| Gap Marker | Teal | #2A9D8F | Gap edges for wall-jump |
| Background | Off-White | #F1FAEE | Main game background |
| Ground | Slate | #457B9D | Ground/platform surface |
| UI Text | Dark Navy | #1D3557 | Score, labels, HUD |
| Combo Glow | Gold | #FFD700 | Combo counter, perfect indicators |
| Stumble Flash | Warning Red | #FF0000 | Screen flash on stumble |

### 4.3 SVG Specifications

**Player Character (Runner)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48">
  <!-- Head -->
  <circle cx="16" cy="8" r="6" fill="#00B4D8"/>
  <!-- Body -->
  <rect x="12" y="14" width="8" height="16" rx="3" fill="#00B4D8"/>
  <!-- Leading leg (running pose) -->
  <rect x="8" y="30" width="6" height="14" rx="2" fill="#0096B7" transform="rotate(-20 11 30)"/>
  <!-- Trailing leg -->
  <rect x="18" y="30" width="6" height="14" rx="2" fill="#0096B7" transform="rotate(15 21 30)"/>
  <!-- Leading arm -->
  <rect x="6" y="16" width="5" height="10" rx="2" fill="#0096B7" transform="rotate(30 8 16)"/>
  <!-- Trailing arm -->
  <rect x="21" y="16" width="5" height="10" rx="2" fill="#0096B7" transform="rotate(-20 23 16)"/>
</svg>
```

**Wall Obstacle**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 40">
  <rect x="2" y="0" width="20" height="40" rx="2" fill="#E63946" stroke="#C1121F" stroke-width="2"/>
  <line x1="12" y1="4" x2="12" y2="36" stroke="#C1121F" stroke-width="1" opacity="0.3"/>
</svg>
```

**Bar Obstacle**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 8">
  <rect x="0" y="0" width="60" height="8" rx="4" fill="#F4A261" stroke="#E76F51" stroke-width="1.5"/>
  <!-- Support poles -->
  <rect x="2" y="8" width="4" height="20" fill="#E76F51"/>
  <rect x="54" y="8" width="4" height="20" fill="#E76F51"/>
</svg>
```

**Gap Marker**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 10">
  <!-- Left edge -->
  <rect x="0" y="0" width="10" height="10" fill="#2A9D8F"/>
  <!-- Right edge -->
  <rect x="50" y="0" width="10" height="10" fill="#2A9D8F"/>
  <!-- Gap indicator arrows -->
  <polygon points="20,5 25,2 25,8" fill="#2A9D8F" opacity="0.5"/>
  <polygon points="40,5 35,2 35,8" fill="#2A9D8F" opacity="0.5"/>
</svg>
```

**Design Constraints**:
- All SVG elements use basic shapes only (rect, circle, line, polygon) -- no complex paths
- Maximum 10 elements per SVG object
- Runner animation via Phaser tweens (rotate limbs, bob body), not SVG animate
- Motion trails: spawn faded copies of runner sprite at previous positions, alpha 0.3 decaying to 0 over 200ms

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Motion trail | Runner moving (always on, intensifies with combo) | 3-6 ghost sprites at previous positions, alpha 0.3->0, lifespan 200ms |
| Sweet zone glow | Obstacle enters approach range | Pulsing white glow circle behind obstacle, alpha 0.2-0.5, 400ms pulse cycle |
| Vault animation | Successful wall vault | Runner rotates 360deg over obstacle in 300ms arc tween |
| Slide animation | Successful bar slide | Runner squashes to 50% height, slides under, recovers in 200ms |
| Wall-jump animation | Successful gap jump | Runner kicks off left wall, arcs across gap, lands with dust particles |
| Stumble animation | Bad tap | Runner wobbles (x oscillation +/-5px, 3 cycles, 200ms), red flash overlay 100ms |
| Crash animation | Missed obstacle | Runner flattens against obstacle, squash to 30% width, screen shake 8px |
| Stage clear flash | All obstacles in stage cleared | White screen flash 100ms, stage number floats up center |
| Combo fire | Combo 15+ | Runner outline shifts to gold #FFD700, particle trail becomes flame-like |

---

## 5. Audio Design

### 5.1 Sound Effects

All audio generated via Web Audio API oscillators (no external audio files needed).

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Perfect move | Bright ascending two-tone chime (C5->E5) | 150ms | High |
| Good move | Single clean pop (G4) | 100ms | High |
| Stumble | Dull buzzer (low sawtooth 120Hz) | 200ms | High |
| Crash | Heavy thud (noise burst + low sine 80Hz) | 300ms | High |
| Combo milestone (5, 10, 15...) | Ascending arpeggio (3 notes, +2 semitones each) | 300ms | Medium |
| Stage clear | Quick ascending scale (4 notes) | 400ms | Medium |
| Game over | Descending minor triad | 600ms | High |
| New high score | Celebratory ascending major chord | 800ms | Medium |
| Menu tap | Soft click (short noise burst) | 50ms | Low |

### 5.2 Music Concept

**Background Music**: No background music track. The game's audio identity comes from the rhythmic sound effects of successful moves chaining together -- the player creates their own "music" through perfect play. This is a deliberate design choice: the tap sounds at combo 10+ become pitched progressively higher, creating an emergent melody from gameplay.

**Audio Implementation**: Web Audio API (built-in, no CDN needed). OscillatorNode for tones, noise buffer for impacts.

---

## 6. UI/UX

### 6.1 Screen Flow

```
+----------+     +----------+     +----------+
|  Menu    |---->|   Game   |---->| Game Over|
|  Screen  |     |  Screen  |     |  Screen  |
+----------+     +----+-----+     +-----+----+
     ^                |                  |
     |           +----+----+        +----+----+
     |           | Pause   |        | Continue|
     |           | Overlay |        | (Ad)    |
     |           +---------+        +---------+
     |                                   |
     +-----------------------------------+
```

### 6.2 HUD Layout

```
+-------------------------------+
| 1250    Stage 7      |||     |  <- Score (left), Stage (center), Lives (right)
|            x3 COMBO!          |  <- Combo (appears below HUD, fades)
|-------------------------------|
|                               |
|                               |
|  [Runner]=====> [Obstacle]    |  <- Game area (auto-scrolling)
|                               |
|  ========================     |  <- Ground line
|                               |
+-------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left, 24px bold | Current score, punches on increase | Every score event |
| Stage | Top-center, 20px | "Stage N" | On stage transition |
| Lives | Top-right | Runner silhouette icons (filled/empty) | On life change |
| Combo | Center, below HUD bar | "x3 COMBO!" in gold, size scales with combo level | On each successful move |
| Perfect | Center screen | "PERFECT!" floating text, 600ms fade-up | On perfect-timing move |

### 6.3 Menu Structure

**Main Menu**:
```
+-------------------------------+
|                               |
|      PARKOUR TAP              |  <- Title, 36px bold, blue
|                               |
|   [Runner silhouette running] |  <- Animated runner SVG loop
|                               |
|      [ PLAY ]                 |  <- Large button, 60x200px, blue fill
|                               |
|   Best: 12450                 |  <- High score display
|                               |
|   [?]                  [gear] |  <- Help (bottom-left), Settings (bottom-right)
+-------------------------------+
```

**Pause Menu** (overlay, 70% black background):
- Resume (large button)
- Restart
- Menu
- Sound toggle icon

**Game Over Screen**:
```
+-------------------------------+
|                               |
|       GAME OVER               |
|                               |
|    Score: 4250                 |  <- Large animated score count-up
|    Stage: 14                  |
|    Best Combo: x12            |
|                               |
|    NEW BEST!                  |  <- Only if new high score
|                               |
|  [ Watch Ad: +1 Life ]        |  <- Rewarded ad (once per run)
|  [    PLAY AGAIN     ]        |  <- Primary action
|  [      MENU         ]        |  <- Secondary action
+-------------------------------+
```

**Help / How to Play** (overlay):
- Title: "HOW TO PLAY"
- Visual: Animated SVG showing runner approaching wall with tap indicator
- Rule 1: "TAP when the runner reaches an obstacle" (with timing zone illustration)
- Rule 2: "Don't tap too early or too late -- you'll stumble!"
- Rule 3: "3 stumbles = Game Over"
- Rule 4: "Chain perfect taps for combo multiplier!"
- "GOT IT!" button

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after death | Every game over | Always (optional) |
| Rewarded | Double final score | Game over screen | Always (optional) |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Life | Watch rewarded ad after death | +1 life, resume from current obstacle | Once per run |
| Score Double | Watch rewarded ad at game over | 2x final score | Once per session |

### 7.3 Session Economy

Sessions are short (30-90s) so ad frequency must be carefully managed. Interstitials only every 3rd game over prevents fatigue. Rewarded ads are always optional and provide genuine value (continue run or double score). Expected 1-2 ad views per 5-minute play session.

**Session Flow with Monetization**:
```
[Play] --> [Death x3] --> [Rewarded: Continue? (+1 life)]
                               | Yes --> [Resume, interstitial after next death]
                               | No  --> [Game Over Screen]
                                              |
                                        [Interstitial (every 3rd)]
                                              |
                                        [Rewarded: Double Score?]
                                              | Yes --> [Score doubled, show]
                                              | No  --> [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/parkour-tap/
+-- index.html              # Entry point, CDN Phaser 3, script load order
+-- css/
|   +-- style.css           # Responsive layout, mobile-first
+-- js/
    +-- config.js           # Constants, colors, difficulty tables, SVG strings
    +-- stages.js           # Stage generation, obstacle sequencing, difficulty calc
    +-- ads.js              # Ad hooks, reward callbacks, frequency tracking
    +-- effects.js          # Particle systems, screen shake, motion trails, tweens
    +-- ui.js               # MenuScene, GameOverScene, HUD overlay, PauseOverlay, Help
    +-- game.js             # GameScene: core loop, input, runner, obstacles, scoring
    +-- main.js             # BootScene (textures), Phaser config, scene registration
```

**Script load order in index.html**: config -> stages -> ads -> effects -> ui -> game -> main (MAIN LAST)

### 8.2 Module Responsibilities

**config.js** (target ~80 lines):
- `COLORS` object with all hex values
- `DIFFICULTY_TABLE` array: [{stage_range, timing_window, speed, gap, obstacles_per_stage}]
- `SCORING` constants: PERFECT_POINTS=150, GOOD_POINTS=100, COMBO_BONUS=50, STAGE_CLEAR=200
- `COMBO_THRESHOLDS`: {TRAIL: 10, COLOR_SHIFT: 20, PARTICLE_DOUBLE: 30}
- `LIVES_MAX`: 3
- `INACTIVITY_TIMEOUT`: 3000 (ms)
- SVG strings for runner, wall, bar, gap, ground tile
- `RUNNER_SPEED_BASE`: 200 (px/s)

**main.js** (target ~50 lines):
- BootScene: register all SVG textures via `textures.addBase64()` once
- Phaser.Game config: AUTO renderer, 360x640 base, RESIZE scale mode
- Scene array: [BootScene, MenuScene, GameScene, UIScene, GameOverScene]
- Listen for `addtexture` events to sequence scene startup

**game.js** (target ~280 lines):
- GameScene: `create()` initializes runner, ground, obstacle spawner, input listener
- `update()`: move runner, scroll world, check obstacle proximity, evaluate tap timing
- `handleTap()`: determine nearest obstacle, check if within timing window, trigger move or stumble
- `performVault()`, `performSlide()`, `performWallJump()`: move-specific tweens
- `triggerStumble()`, `triggerCrash()`: failure handlers with life decrement
- Combo tracking, score calculation, stage progression
- Inactivity timer: 3s no-tap near obstacle = auto-crash

**stages.js** (target ~100 lines):
- `generateStage(stageNumber)`: returns array of obstacle objects [{type, x_offset, timing_window}]
- `getDifficultyParams(stageNumber)`: returns {speed, timing_window, gap, fake_out_chance}
- Obstacle type unlocking based on stage thresholds
- Variety enforcement (no 3+ same type in a row)
- Rest beat insertion logic

**ui.js** (target ~250 lines):
- MenuScene: title, play button, high score display, help/settings buttons
- GameOverScene: score display, stats, ad buttons, play again, menu
- UIScene (parallel overlay): HUD score/stage/lives, combo text, floating score text
- PauseOverlay: resume/restart/menu buttons
- HelpOverlay: illustrated how-to-play

**effects.js** (target ~120 lines):
- `spawnMotionTrail(scene, runner)`: ghost sprite with fade
- `screenShake(scene, intensity, duration)`: camera shake
- `scalePunch(gameObject, scale, duration)`: tween scale bounce
- `floatingText(scene, text, x, y, color)`: score popup that floats up and fades
- `perfectFlash(scene)`: white overlay flash
- `comboParticles(scene, x, y, count)`: radial particle burst
- `deathEffect(scene)`: desaturation + shake + slow-mo

**ads.js** (target ~60 lines):
- Placeholder ad SDK hooks
- `showInterstitial()`, `showRewarded(callback)`
- Game over counter for interstitial frequency
- Reward state tracking (continue used, double score used)

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No Howler.js needed -- audio via Web Audio API oscillators built into effects.js.

---

## 9. Juice Specification

### 9.1 Player Input Feedback (applied to every tap)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Runner position | Count: 8, Direction: radial burst, Color: #00B4D8, Lifespan: 300ms |
| Screen shake | Camera | Intensity: 2px, Duration: 80ms |
| Scale punch | Runner sprite | Scale: 1.2x, Recovery: 100ms |
| Sound | -- | Effect: pop/chime (see audio), Pitch: +3% per combo level |

### 9.2 Core Action Additional Feedback (successful parkour move)

| Effect | Values |
|--------|--------|
| Particles | Count: 20, Color: move-specific (vault=#E63946, slide=#F4A261, jump=#2A9D8F), Lifespan: 400ms |
| Hit-stop | 40ms physics pause on perfect timing only |
| Camera zoom | 1.03x on perfect, recovery 200ms |
| Motion trail | 4 ghost sprites, alpha 0.3->0, spaced 8px apart, 200ms lifespan |
| Floating text | "PERFECT!" at 28px gold #FFD700 (perfect) or "+100" at 20px white (good), float up 60px, fade 600ms |
| Combo escalation | Particle count +2 per combo level, screen shake +0.5px per 5 combos (cap at 6px), trail sprites +1 per 10 combos (cap at 8) |
| Vault specific | Runner rotates 360deg in 300ms arc, afterimage ring at vault point |
| Slide specific | Speed lines (4 horizontal rects) appear for 200ms, runner squash to 60% height |
| Wall-jump specific | Dust particles at kick-off point (6 particles), arc trail follows jump path |

### 9.3 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 10px, Duration: 300ms |
| Screen effect | Red flash overlay (#FF0000 at alpha 0.3), 150ms, then fade 200ms |
| Stumble wobble | Runner x-oscillation +/-5px, 3 cycles, 200ms total |
| Crash squash | Runner squashes to 30% width against obstacle, 200ms, then bounces back |
| Sound | Low buzzer 120Hz (stumble) or heavy thud 80Hz (crash), 200-300ms |
| Effect -> UI delay | 600ms pause before game over screen appears |
| Death -> restart | **Under 1.5 seconds** from game over tap to new run |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+150" (perfect) / "+100" (good), Color: #FFD700 / #FFFFFF, Movement: up 60px, Fade: 600ms |
| Score HUD punch | Scale 1.4x, Recovery: 120ms |
| Combo text | "x{N} COMBO!" at center, font size: 20px + combo*0.5px (cap 40px), gold color, 800ms visible then fade |
| Combo milestone (5, 10, 15...) | Screen flash white 50ms, particle burst 30 particles, arpeggio sound |
| Stage clear | Full-width white flash 100ms, "STAGE {N}" floats up center in 32px bold, 600ms |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | Minimal assets (SVG in code) |
| Memory Usage | <80MB | No external assets, particle pooling |
| JS Bundle Size | <50KB total (excl. CDN) | ~8 small JS files |
| First Interaction | <1 second after load | Instant -- no loading screen needed |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser pointer events, single-tap only, full-screen touch area
- **Prevent Default**: Disable pull-to-refresh, pinch-zoom, double-tap-zoom
- **Orientation**: Portrait mode enforced via CSS and resize handler
- **Resize Handler**: On orientation change, resize Phaser game to window dimensions, reposition HUD elements
- **Object Pooling**: Reuse obstacle sprites and particle objects to prevent GC spikes
- **Offscreen Cleanup**: Destroy obstacles and trails that scroll past left edge of screen

### 10.3 Critical Implementation Details

- **Timing Evaluation**: On tap, find the nearest obstacle within approach range. Calculate distance from runner to obstacle center. Convert to timing delta based on current speed. Compare against `timing_window` from difficulty params. If within window: success. If within 40% of center: PERFECT. If no obstacle in range: STUMBLE (unnecessary tap).
- **Auto-scroll**: World scrolls left (runner stays at x=25% of screen width). Obstacles spawn off-screen right and scroll left. Ground tiles tile and recycle.
- **Obstacle Approach Detection**: Each frame, check if any obstacle is within "approach range" (timing_window * speed * 2 pixels ahead of runner). If yes, start inactivity timer. If timer hits 3s without tap, trigger crash.
- **Combo State**: Global combo counter in GameScene. Incremented on success (+1 good, +2 perfect). Reset to 0 on stumble/crash. Drives visual intensity scaling.
- **Scene Communication**: UIScene runs parallel to GameScene. GameScene emits events ('score-update', 'combo-update', 'life-change', 'stage-clear') that UIScene listens to for HUD updates.

### 10.4 Local Storage Schema

```json
{
  "parkour-tap_high_score": 0,
  "parkour-tap_games_played": 0,
  "parkour-tap_highest_stage": 0,
  "parkour-tap_best_combo": 0,
  "parkour-tap_settings": {
    "sound": true
  }
}
```
