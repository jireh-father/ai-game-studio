# Game Design Document: Reverse Mirror

**Slug**: `reverse-mirror`
**One-Liner**: Your reflection controls YOU — swipe to fight against your own mirrored movements
**Core Mechanic**: Split-screen mirror navigation — player controls the reflection, real character moves in reverse
**Target Session Length**: 30-60 seconds
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Reverse Mirror is a brain-bending navigation game where the screen is split by a mirror line. The player sees two bodies: a "reflection" (which they control directly) and a "real" character (which moves in the opposite direction). Swipe right on the reflection side and the real character goes left. Swipe up and the real character goes down.

The challenge is navigating BOTH bodies simultaneously through gaps in obstacles approaching from both sides of the mirror. The player must think in reverse — planning moves that keep both bodies alive. As stages progress, the mirror axis rotates (vertical to diagonal to horizontal), the obstacle speed increases, and the gap patterns become tighter. The cognitive dissonance between intended and actual movement creates hilarious fail moments and deeply satisfying mastery when the player finally "gets it."

What makes it uniquely addictive is the escalating mirror rotation. Just when the player masters vertical mirror movement, the axis tilts 45 degrees and their brain short-circuits again. Every rotation resets the learning curve, creating repeated "aha!" moments.

### 1.2 Target Audience

Casual mobile gamers aged 14-30 who enjoy brain-teaser reflex games. Perfect for short commute sessions or waiting rooms. Players who enjoyed games like "Duet" (dual body navigation) or "Brain Dots" (spatial reasoning) will find the mirror mechanic immediately intriguing. The shareability of fail clips (swiping confidently in the wrong mirrored direction) targets social media virality.

### 1.3 Core Fantasy

The player is trapped in a mirror dimension where their reflection has taken control. Every movement is reversed, every instinct is wrong. The fantasy is overcoming your own brain — rewiring your reflexes in real-time to master an alien control scheme. When you finally navigate both bodies through a tight gap sequence, you feel like a cognitive superhero.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 45 seconds (with rapid retries adding up to 3-5 minutes) |
| Day 1 Retention | 42%+ |
| Day 7 Retention | 20%+ |
| Average Stages per Session | 4-8 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Stage Start] --> [Obstacles approach from both sides]
      ^                        |
      |              [Player swipes on reflection side]
      |                        |
      |              [Reflection moves in swipe direction]
      |              [Real character moves OPPOSITE]
      |                        |
      |            +--- HIT ---+--- SAFE ---+
      |            |                        |
      |     [Lose 1 life]          [Score + continue]
      |     [Screen shake]         [Combo builds]
      |            |                        |
      |     [Lives > 0?]          [All obstacles cleared?]
      |       NO -> [Game Over]       YES -> [Stage Clear]
      |       YES -> [Continue]              |
      +--------------------------------------+
```

Moment-to-moment: obstacles scroll toward both bodies. The player reads the gap positions for BOTH sides, calculates a single swipe that threads both bodies through their respective gaps, and executes. The core tension is that the "correct" swipe for one body is always "wrong" for the other — finding the sweet spot is the game.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Move horizontally | Swipe left/right | Reflection moves in swipe direction; real character moves opposite |
| Move vertically | Swipe up/down | Reflection moves in swipe direction; real character moves opposite |
| Quick dodge | Tap (no swipe) | Both bodies stay in place (useful when gaps are aligned) |

**Control Philosophy**: Single-finger swipe only. The mechanical simplicity is critical — the challenge is entirely cognitive (reverse-mapping), not dexterity. Minimum swipe distance: 25px. Swipe direction locked to 4-way (up/down/left/right) with 45-degree dead zones to prevent ambiguous inputs.

**Touch Area Map**:
```
+-----------------------------+
|   Score    Stage    Lives   |  <- Top bar 56px
+-----------------------------+
|                             |
|   [Real Character]          |  <- Top half (real side)
|   Obstacles -->             |
|                             |
|- - - MIRROR LINE - - - - - |  <- Mirror axis (visual divider)
|                             |
|   <-- Obstacles             |
|   [Reflection]              |  <- Bottom half (reflection side)
|                             |
+-----------------------------+
   Entire screen = swipe zone
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Obstacle pair survived | 50 | x combo multiplier |
| Perfect center (both bodies within 10px of gap center) | 150 | x combo multiplier |
| Stage clear | 300 | + 50 per combo at clear |
| No-damage stage clear | 500 | Flat bonus |
| Mirror rotation survived (first obstacle after rotation) | 200 | Flat bonus |

**Combo System**: Each consecutive obstacle pair survived without taking damage increments the combo counter by 1. A hit resets the combo to 0. Combo multiplier = 1 + (combo x 0.15), capped at 3.0x at combo 14.

**High Score**: Stored in localStorage as `reverse-mirror_high_score`. Displayed on Game Over with animated "NEW RECORD" flash if beaten.

### 2.4 Progression System

Stages are defined by obstacle sets. Each stage has 6-10 obstacle pairs. Clearing all pairs in a stage advances to the next stage.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-3 | Vertical mirror only, wide gaps (100px), slow speed (1.5px/frame) | Tutorial — learn reverse movement |
| 4-7 | Gaps narrow to 80px, speed 2px/frame, asymmetric gap positions | Easy — build reverse intuition |
| 8-12 | Mirror axis rotates to HORIZONTAL (up=down, left=left), gaps 70px, speed 2.5px/frame | Medium — brain reset, relearn |
| 13-20 | Mirror axis rotates to 45-degree DIAGONAL, gaps 65px, speed 3px/frame | Hard — full spatial confusion |
| 21-30 | Mirror rotation every 3 obstacle pairs, gaps 55px, speed 3.5px/frame | Expert — constant adaptation |
| 31+ | Random rotation, gaps 50px min, speed 4px/frame cap | Endless survival |

### 2.5 Lives and Failure

Player starts with 3 lives represented as mirror shards.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Either body hits an obstacle | Lose 1 life, bodies reset to center | None (POC) |
| 8 seconds inactivity during gameplay | Immediate death, all lives lost | None |
| All 3 lives lost | Game over | Retry from stage 1 |

Death -> Game Over screen in under 1.8 seconds.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each stage generates a set of obstacle pairs. Each pair consists of one wall-with-gap approaching from the real character's side and one wall-with-gap approaching from the reflection's side. Gap positions are computed to ensure solvability.

**Generation Algorithm**:
```
Stage Generation Parameters:
- obstacleCount: 6 + min(floor(stage / 3), 6)         // 6 at start, max 12
- gapWidth: max(50, 100 - stage * 2.5)                 // 100px start, 50px floor
- scrollSpeed: min(4.0, 1.5 + stage * 0.1)             // 1.5 start, 4.0 cap
- mirrorAxis: stage <= 3 ? 'vertical' : stage <= 7 ? 'vertical' : stage <= 12 ? 'horizontal' : 'diagonal'
- rotationFreq: stage < 21 ? 0 : max(3, 8 - floor((stage-21)/3))  // obstacles between rotations
- gapOffset: random within [-maxOffset, +maxOffset] where maxOffset = (gameWidth/2 - gapWidth) * 0.8
- pairSpacing: max(120, 200 - stage * 3)               // pixels between obstacle pairs
```

### 3.2 Difficulty Curve

```
Scroll Speed (px/frame)
    |
4.0 |                                          ------------ (cap)
    |                                    /
3.5 |                              /
    |                        /
3.0 |                  /
    |            /
2.5 |      /
    |  /
1.5 |/
    |
    +------------------------------------------ Stage
    0    5    10    15    20    25    30    35+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-3 | Stage 4-7 | Stage 8-12 | Stage 13-20 | Stage 21-30 | Stage 31+ |
|-----------|-----------|-----------|------------|-------------|-------------|-----------|
| Speed (px/frame) | 1.5 | 2.0 | 2.5 | 3.0 | 3.5 | 4.0 |
| Gap Width | 100px | 80px | 70px | 65px | 55px | 50px |
| Mirror Axis | Vertical | Vertical | Horizontal | Diagonal (45) | Rotating | Random |
| Obstacles/Stage | 6 | 7 | 8 | 9-10 | 10-11 | 12 |
| Pair Spacing | 200px | 180px | 160px | 140px | 130px | 120px |
| Rotation Freq | None | None | None | None | Every 5 pairs | Every 3 pairs |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: For every obstacle pair, there must exist at least one swipe direction that places BOTH bodies within their respective gaps. The generator computes valid gap positions by: (a) picking reflection gap position randomly, (b) computing where real character gap must be (mirror of reflection gap along current axis), (c) verifying both positions are within screen bounds.
2. **Variety Threshold**: Consecutive obstacle pairs must have gap positions differing by at least 30px. No two consecutive stages use identical gap patterns.
3. **Difficulty Monotonicity**: Speed and gap narrowing never decrease between stages. Mirror axis complexity never regresses.
4. **Rest Stages**: Every 5 stages, gap width increases by 15px and speed drops by 0.3 for one stage (breathing room).
5. **Boss Stages**: Every 5 stages (5, 10, 15...), the stage has 2 extra obstacle pairs, a unique mirror rotation mid-stage, and a brief stage-clear celebration on completion.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Clean geometric minimalism with a mirror/glass aesthetic. Sharp reflective lines, translucent overlays, cool color palette evoking glass and chrome. The mirror line itself is the visual centerpiece — glowing, animated, and always prominent.

**Aesthetic Keywords**: Reflective, Clean, Cerebral, Neon-Glass, Symmetric

**Reference Palette Mood**: Dark slate background with cyan/magenta neon accents. The mirror line glows white-blue. Real character is warm-toned, reflection is cool-toned — visual reminder of which is which.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Deep Slate | #0A0E1A | Game background |
| Mirror Line | Ice Blue | #88DDFF | Animated mirror divider line |
| Mirror Glow | Soft Cyan | #44AADD40 | Glow aura around mirror line |
| Real Character | Warm Coral | #FF6B6B | Real body fill |
| Real Outline | Deep Red | #CC3333 | Real body stroke |
| Reflection | Cool Cyan | #6BDFFF | Reflection body fill |
| Reflection Outline | Deep Blue | #3399CC | Reflection body stroke |
| Obstacle Wall | Steel Grey | #445566 | Obstacle fill |
| Obstacle Edge | Light Steel | #667788 | Obstacle stroke highlight |
| Gap Indicator | Soft Green | #66FF9940 | Subtle glow where gap is |
| Danger Flash | Hot Red | #FF2020 | Screen flash on hit |
| Perfect Flash | Pure White | #FFFFFF | Flash on perfect center navigation |
| UI Text | Off White | #EEEEFF | Score, labels, stage text |
| UI Background | Dark Overlay | #0A0E1A99 | Menu overlays |
| Combo Glow | Electric Magenta | #FF44CC | Combo counter glow |
| Lives Full | Mirror Cyan | #88DDFF | Filled life shard |
| Lives Empty | Dark Grey | #334455 | Empty life shard |

### 4.3 SVG Specifications

All graphics rendered as Phaser Graphics or inline SVG textures via base64 in BootScene.

**Real Character** (30x30px bounding box):
```svg
<!-- Warm-colored diamond shape representing the "real" body -->
<svg width="30" height="30" viewBox="0 0 30 30">
  <polygon points="15,2 28,15 15,28 2,15" fill="#FF6B6B" stroke="#CC3333" stroke-width="2.5"/>
  <circle cx="15" cy="15" r="5" fill="#FFFFFF" opacity="0.6"/>
</svg>
```

**Reflection Character** (30x30px bounding box):
```svg
<!-- Cool-colored diamond shape representing the "reflection" body -->
<svg width="30" height="30" viewBox="0 0 30 30">
  <polygon points="15,2 28,15 15,28 2,15" fill="#6BDFFF" stroke="#3399CC" stroke-width="2.5"/>
  <circle cx="15" cy="15" r="5" fill="#FFFFFF" opacity="0.6"/>
  <!-- Reflection shimmer lines -->
  <line x1="10" y1="10" x2="12" y2="12" stroke="#FFFFFF" stroke-width="1" opacity="0.4"/>
  <line x1="18" y1="10" x2="20" y2="12" stroke="#FFFFFF" stroke-width="1" opacity="0.4"/>
</svg>
```

**Obstacle Wall** (full width x 20px height, gap cut out dynamically):
```svg
<!-- Steel wall segment, drawn as Phaser Graphics rectangle -->
<svg width="360" height="20" viewBox="0 0 360 20">
  <rect x="0" y="0" width="360" height="20" fill="#445566" stroke="#667788" stroke-width="1.5"/>
</svg>
```

**Mirror Line** (full width x 4px, animated glow):
```svg
<!-- Glowing mirror divider -->
<svg width="360" height="4" viewBox="0 0 360 4">
  <rect x="0" y="0" width="360" height="4" fill="#88DDFF" rx="2"/>
</svg>
```

**Life Shard** (16x20px):
```svg
<!-- Diamond-shaped life indicator -->
<svg width="16" height="20" viewBox="0 0 16 20">
  <polygon points="8,0 16,10 8,20 0,10" fill="#88DDFF" stroke="#44AADD" stroke-width="1"/>
</svg>
```

**Design Constraints**:
- Max 5 shape elements per SVG object
- Use polygon, rect, circle, line only — no complex paths
- Characters are 30x30px for crisp rendering at mobile scale
- Obstacle walls drawn as Phaser Graphics fillRect calls (not SVG) for performance
- Mirror line uses Phaser tween for glow pulse animation

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Mirror line pulse | Continuous | Phaser tween: alpha 0.6 -> 1.0 -> 0.6, 1200ms loop |
| Mirror rotation | Axis changes | 400ms tween rotating the divider line + all obstacle approach angles |
| Gap highlight | Obstacle approaching | Subtle green glow (#66FF9940) at gap position, fades as obstacle passes |
| Trail ghost | Character movement | 3 fading copies of character at previous positions, alpha 0.4/0.2/0.1, 150ms lifetime |
| Perfect center sparkle | Both bodies centered | 10 white spark particles, radial burst, 200ms |
| Hit flash red | Body hits obstacle | Camera flash #FF2020, 120ms, alpha 0.5 |
| Combo counter glow | Combo >= 5 | Magenta outline glow around score text, intensity scales with combo |
| Stage clear sweep | All obstacles cleared | Mirror line flashes bright white, 300ms, then returns to normal |

---

## 5. Audio Design

### 5.1 Sound Effects

All sounds synthesized via Web Audio API. No external audio files.

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Swipe input | Soft whoosh, directional pitch shift | 80ms | Medium |
| Obstacle survived | Quick ascending chime | 100ms | Medium |
| Perfect center | Bright crystalline ping + shimmer tail | 200ms | High |
| Body hit obstacle | Dull glass crack + low thud | 180ms | High |
| Life lost | Descending glass shatter sting | 300ms | High |
| Game over | Low reverberant glass break, somber | 700ms | High |
| Stage clear | 3-note ascending crystal fanfare | 500ms | High |
| Mirror rotation | Deep whooshing sweep, spatial pan | 400ms | High |
| Combo milestone (x5, x10) | Ascending bell chime, higher per milestone | 200ms | Medium |
| Inactivity warning (6s) | Subtle ticking pulse | 100ms repeating | Low |

### 5.2 Music Concept

**Background Music**: Ambient electronic loop via Web Audio API. Minimal synth pad with subtle rhythmic pulse. Base tempo 100 BPM, increases by 3 BPM every 5 stages, caps at 140 BPM. Glass-like bell tones layered over soft bass drone.

**Music State Machine**:
| Game State | Music Behavior |
|-----------|---------------|
| Menu | Slow ambient pad, 80 BPM, sparse bell hits |
| Early Stages (1-7) | 100 BPM, pad + light rhythm |
| Mid Stages (8-20) | 115-130 BPM, added percussive pulse |
| Late Stages (21+) | 130-140 BPM, dense rhythm, bass emphasis |
| Game Over | Music cuts, single deep glass tone fade |
| Pause | Music volume to 15% |

**Audio Implementation**: Web Audio API directly. `AudioContext` created on first user interaction.

---

## 6. UI/UX

### 6.1 Screen Flow

```
+----------+     +----------+     +----------+
|  Boot    |---->|   Menu   |---->|   Game   |
|  Scene   |     |  Screen  |     |  Screen  |
+----------+     +----------+     +----------+
                      |                |
                      |           +----+----+
                      |           |  Pause  |
                      |           | Overlay |
                      |           +----+----+
                      |                | Resume
                 +----+----+     +----------+
                 |Settings |     | Game Over|
                 | Overlay |     |  Screen  |
                 +---------+     +----+-----+
                                      |
                                [Play Again / Menu]
```

### 6.2 HUD Layout

```
+-------------------------------+
| Lives: <><<>  STAGE 5  1,250 |  <- Top bar 52px
+-------------------------------+
|                               |
|     [Real Character]          |
|     <-- Obstacle walls        |
|                               |
|- - - - MIRROR LINE - - - - - |  <- Animated glowing divider
|                               |
|     Obstacle walls -->        |
|     [Reflection]              |
|                               |
|         [x7 COMBO]           |  <- Combo counter, bottom center
+-------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Lives | Top-left (8px margin) | Diamond shard icons, filled/empty | On life change |
| Stage | Top-center | "STAGE N" text, 20px bold | On stage transition |
| Score | Top-right (8px margin) | Numeric with punch animation | Every score event |
| Combo | Bottom-center (80px from bottom) | "xN" large text, magenta glow, fades when combo=0 | On obstacle survive |
| Mirror axis indicator | Near mirror line | Small icon showing current axis orientation | On rotation |

### 6.3 Menu Structure

**Main Menu**:
- "REVERSE MIRROR" title (large, centered, mirror-effect shimmer animation)
- Mirror line divides title (top half normal, bottom half reflected/inverted)
- "TAP TO PLAY" button (full-width, pulsing, 56px height)
- High Score display ("BEST: 1,250 | STAGE 8")
- Settings gear icon top-right (44x44px)

**Pause Menu** (overlay, 85% dark semi-transparent):
- "PAUSED" title
- Resume (primary button)
- Restart (secondary)
- Menu (tertiary)

**Game Over Screen**:
- "GAME OVER" (large, white, glass-shatter entrance animation)
- Stage reached: "STAGE 8"
- Final score (animated counter tally up)
- "NEW RECORD" flash if high score beaten (cyan animated)
- "PLAY AGAIN" primary button (56px height)
- "MENU" secondary button (44px height)

**Settings Screen** (overlay):
- Sound Effects: On/Off toggle
- Music: On/Off toggle
- Vibration: On/Off toggle

---

## 7. Monetization

### 7.1 Ad Placements (POC -- placeholder only, no real ads)

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after death | Every game over | Always optional |

### 7.2 Reward System (POC placeholder)

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Life | Watch rewarded ad | +1 life (one-time per session) | Once per game |

### 7.3 Session Economy

No real ad SDK for POC. `ads.js` contains stub callbacks only. All `showAd()` calls immediately invoke `onAdRewarded()` for testing continuity.

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/reverse-mirror/
+-- index.html              # Entry point
|   +-- CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js
|   +-- Local CSS           # css/style.css
|   +-- Local JS (ordered)  # config -> stages -> ads -> effects -> ui -> game -> main (MAIN LAST)
+-- css/
|   +-- style.css           # Portrait lock, safe areas, touch prevention
+-- js/
    +-- config.js           # Constants, palette, difficulty tables, SVG strings
    +-- stages.js           # Obstacle pair generation, gap computation, mirror axis logic
    +-- ads.js              # Stub ad hooks, Web Audio synth utility
    +-- effects.js          # Particle systems, screen shake, trail effects
    +-- ui.js               # MenuScene, GameOverScene, HUD overlay, PauseOverlay
    +-- game.js             # GameScene: swipe detection, mirror logic, collision, movement
    +-- main.js             # BootScene (texture registration), Phaser init, scene array
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `GAME_WIDTH = 360`, `GAME_HEIGHT = 640`
- `PALETTE` object with all hex values from color palette
- `DIFFICULTY` table: speed, gapWidth, mirrorAxis, obstacleCount per stage range
- `SCORE` object: OBSTACLE_SURVIVED=50, PERFECT_CENTER=150, STAGE_CLEAR=300, NO_DAMAGE_CLEAR=500, ROTATION_SURVIVED=200
- `SWIPE_MIN_DIST = 25` (px), `INACTIVITY_DEATH_MS = 8000`
- `COMBO_MULTIPLIER_CAP = 3.0`, `COMBO_MULTIPLIER_STEP = 0.15`
- SVG strings for all game assets (characters, life shards, mirror line)

**main.js** (max 300 lines):
- BootScene: read SVG strings from config, `btoa()` encode, `textures.addBase64()` once
- Listen for `addtexture` events to sequence scene startup
- `new Phaser.Game({ type: AUTO, width: 360, height: 640, backgroundColor: '#0A0E1A', scene: [BootScene, MenuScene, GameScene, GameOverScene] })`
- Portrait orientation meta tag applied
- Global `GameState`: `{ score, stage, lives, combo, highScore, settings }`
- localStorage read on init, write on game over

**game.js** (max 300 lines):
- `GameScene extends Phaser.Scene`
- `create()`: draw characters, mirror line, register pointer events, start stage 1
- `update(time, delta)`: move obstacles, check collisions, inactivity timer, animate trails
- `onSwipe(direction)`: compute mirrored direction based on current axis, move both bodies
- `moveCharacters(reflectionDir)`: move reflection in `reflectionDir`, compute real character direction via mirror transform
- `checkCollision(body, obstacles)`: AABB check against obstacle walls, accounting for gap positions
- `onHit()`: lose life, flash, shake, reset positions
- `onObstaclePassed()`: score, combo increment, check stage completion
- `rotateMirror(newAxis)`: tween mirror line rotation, update movement transform matrix

**stages.js** (max 300 lines):
- `generateStage(stageNum)`: returns `{ obstacles: [{gapPosReal, gapPosReflection, y}], axis, speed, gapWidth }`
- `computeGapPositions(axis, gapWidth)`: ensures solvability by computing mirrored-valid positions
- `getMirrorAxis(stageNum)`: returns 'vertical'|'horizontal'|'diagonal' based on stage range
- `getScrollSpeed(stageNum)`: `Math.min(4.0, 1.5 + stageNum * 0.1)`
- `getGapWidth(stageNum)`: `Math.max(50, 100 - stageNum * 2.5)`
- `isRestStage(stageNum)`: returns true every 5 stages
- `isBossStage(stageNum)`: returns true every 5 stages (5, 10, 15...)

**ui.js** (max 300 lines):
- `MenuScene`: title with mirror-shimmer effect, play button, best score, settings
- `GameOverScene`: animated score tally, stage display, play again/menu buttons
- `HUD` class: score, stage, lives, combo display, mirror axis indicator
- `PauseOverlay`: resume/restart/menu
- `SettingsOverlay`: sound/music/vibration toggles

**effects.js** (max 300 lines):
- `ParticleManager`: spawn/manage particle bursts for perfect center, hit, stage clear
- `TrailEffect`: ghost copies of characters at previous positions
- `ScreenEffects`: camera shake, flash, zoom utilities
- `MirrorLineEffect`: pulse animation, rotation tween, bright flash on stage clear

**ads.js** (max 300 lines):
- `AudioSynth` class: Web Audio API wrappers for all SFX
  - `playSwipe()`, `playSurvive()`, `playPerfect()`, `playHit()`, `playDeath()`, `playStageClear()`, `playRotation()`
  - Ambient music loop start/stop/setBPM
- Stub ad functions: `showInterstitial(cb)`, `showRewarded(cb)` — immediately call `cb(true)`

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | 3.60.0 | `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js` | Game engine |

No Howler.js — audio via Web Audio API directly.

---

## 9. Juice Specification

### 9.1 Player Input Feedback (every swipe)

| Effect | Target | Values |
|--------|--------|--------|
| Character move tween | Both characters | Duration: 80ms, ease: Quad.Out, distance based on gap spacing |
| Trail ghost | Both characters | 3 copies, alpha 0.4/0.2/0.1, lifespan 150ms each |
| Swipe whoosh sound | AudioSynth | 80ms, pitch varies by direction (UP=high, DOWN=low) |
| Scale punch | Swiped character | Scale 1.0 -> 1.15 -> 1.0, Recovery: 80ms ease-out |

### 9.2 Core Action Additional Feedback (obstacle survived)

| Effect | Values |
|--------|--------|
| Survive chime | 100ms ascending tone, pitch +5% per combo level |
| Score float text | "+50/+150", white/cyan, floats up 50px, fade 500ms |
| Gap highlight flash | Green glow at gap brightens to alpha 0.8 then fades in 200ms |
| Combo escalation | Combo text size: base 24px +3px every 5 combos, max 42px. Glow radius +1px per combo. Color shifts warm at 10+ combo |
| Camera micro-zoom | 1.0 -> 1.01x on each survive, resets on hit. Max 1.04x |

### 9.3 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Screen shake on hit | Intensity: 5px, Duration: 150ms |
| Screen shake on death | Intensity: 12px, Duration: 350ms |
| Red screen flash | Camera flash #FF2020, alpha 0.5 on hit, alpha 0.8 on death, 120ms/250ms |
| Character shatter | Hit character breaks into 6 triangle fragments, scatter radially, 400ms fade |
| Mirror line crack | Brief jagged distortion on mirror line, 200ms |
| Sound | Glass crack on hit (180ms), full shatter on death (700ms) |
| Effect -> UI delay | 600ms after death animation before Game Over screen |
| Death -> restart | Tap "Play Again" -> game restarts in under 1.5 seconds |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating score text | "+N" at character position, Color: survive=#EEEEFF, perfect=#88DDFF; floats up 50px over 500ms, fade out last 150ms |
| Score HUD punch | Scale 1.0 -> 1.3 -> 1.0, Recovery: 120ms, color flash cyan then back |
| Combo text pulse | Scale 1.0 -> 1.2 -> 1.0 on each increment, 80ms |
| Perfect center burst | 10 white spark particles + 8 cyan particles, radial burst, 250ms fade |
| Stage clear celebration | Mirror line flashes white 300ms, 20 cyan + 15 magenta particles, camera zoom 1.0 -> 1.04 -> 1.0 over 400ms |

### 9.5 Mirror Rotation Juice

| Effect | Values |
|--------|--------|
| Rotation tween | Mirror line rotates to new axis over 400ms, ease: Sine.InOut |
| Whoosh sound | Deep spatial sweep, 400ms, pans left-to-right |
| Screen desaturation | Brief 200ms desaturate pulse during rotation |
| Both characters pulse | Scale 1.0 -> 0.9 -> 1.0 during rotation (anticipation) |
| Rotation survived bonus | "+200" large cyan text, camera flash white 80ms |

---

## 10. Implementation Notes

### 10.1 Mirror Transform Logic

The core mechanic relies on a transform matrix based on the current mirror axis:

```javascript
// In game.js:
getMirroredDirection(swipeDir, axis) {
  const transforms = {
    vertical:   { LEFT: 'RIGHT', RIGHT: 'LEFT', UP: 'UP', DOWN: 'DOWN' },
    horizontal: { LEFT: 'LEFT', RIGHT: 'RIGHT', UP: 'DOWN', DOWN: 'UP' },
    diagonal:   { LEFT: 'DOWN', RIGHT: 'UP', UP: 'RIGHT', DOWN: 'LEFT' }
  };
  return transforms[axis][swipeDir];
}
```

The reflection moves in the swiped direction. The real character moves in the mirrored direction.

### 10.2 Swipe Detection

```javascript
// In game.js create():
this.input.on('pointerdown', (ptr) => { swipeStart = { x: ptr.x, y: ptr.y, time: ptr.downTime }; });
this.input.on('pointerup', (ptr) => {
  const dx = ptr.x - swipeStart.x;
  const dy = ptr.y - swipeStart.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist < SWIPE_MIN_DIST) return; // tap = stay in place
  const absDx = Math.abs(dx), absDy = Math.abs(dy);
  const dir = absDx > absDy
    ? (dx > 0 ? 'RIGHT' : 'LEFT')
    : (dy > 0 ? 'DOWN' : 'UP');
  this.onSwipe(dir);
});
```

### 10.3 Collision Detection

Both bodies use simple AABB collision against obstacle wall segments. Each obstacle is a full-width wall with a gap. Collision = body overlaps wall AND body is NOT within gap bounds.

```javascript
// In game.js:
checkCollision(bodyX, bodyY, bodySize, obstacle) {
  const halfBody = bodySize / 2;
  const inYRange = bodyY + halfBody > obstacle.y && bodyY - halfBody < obstacle.y + obstacle.height;
  if (!inYRange) return false;
  const inGap = bodyX > obstacle.gapX && bodyX < obstacle.gapX + obstacle.gapWidth;
  return !inGap; // collision if NOT in gap
}
```

### 10.4 Performance Targets

| Metric | Target | Method |
|--------|--------|--------|
| Frame Rate | 60fps stable | Phaser game.loop.actualFps |
| Load Time | <2s on 4G | No external assets except Phaser CDN |
| Memory | <70MB | Minimal object count, recycle obstacle objects |
| JS total | <350KB (excl. CDN) | 7 files within 300 lines each |
| First interaction | <1s after load | Inline SVG, no loading screen needed |

### 10.5 Mobile Optimization

- `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- `document.addEventListener('touchmove', e => e.preventDefault(), { passive: false })` — prevents pull-to-refresh
- Portrait CSS lock: `@media (orientation: landscape) { body { transform: rotate(-90deg); } }`
- Background tab: `document.addEventListener('visibilitychange', () => { if hidden -> scene.scene.pause() })`
- `AudioContext` created only on first `pointerdown` to satisfy autoplay policy
- Obstacle object pooling: reuse obstacle graphics objects instead of creating/destroying each stage

### 10.6 Local Storage Schema

```json
{
  "reverse-mirror_high_score": 0,
  "reverse-mirror_games_played": 0,
  "reverse-mirror_highest_stage": 0,
  "reverse-mirror_settings": {
    "sound": true,
    "music": true,
    "vibration": true
  },
  "reverse-mirror_total_score": 0
}
```

### 10.7 Known Risk Areas

1. **Mirror axis confusion**: Diagonal axis transform is the hardest to reason about. Must validate solvability extra carefully for diagonal stages — the `computeGapPositions` function must account for the non-orthogonal relationship.
2. **Swipe vs. scroll conflict**: Prevent default on touchmove. Swipe dead zone of 25px prevents micro-swipes.
3. **AudioContext autoplay**: Created on first user gesture in menu screen.
4. **Inactivity death at 8s**: Phaser `delayedCall` reset on every valid `pointerdown`. 2-second warning pulse at 6s.
5. **Obstacle pooling**: With 12 obstacle pairs per stage at high levels, ensure old obstacles are recycled, not destroyed/recreated, to avoid GC pauses.
6. **Mirror rotation mid-stage**: The rotation tween (400ms) must pause obstacle scrolling during the transition to prevent unfair deaths. Resume scrolling after rotation completes.
