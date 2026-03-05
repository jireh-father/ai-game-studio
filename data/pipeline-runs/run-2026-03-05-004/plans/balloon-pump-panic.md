# Game Design Document: Balloon Pump Panic

**Slug**: `balloon-pump-panic`
**One-Liner**: Rapid-tap to inflate balloons — pop for points but push too far and it flies away
**Core Mechanic**: Push-your-luck balloon inflation with random pop thresholds
**Target Session Length**: 45-90 seconds
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Balloon Pump Panic is a push-your-luck tapping game where players rapidly tap to inflate balloons. Each balloon has a hidden pop threshold — inflate past it and the balloon explodes, costing a life. Stop pumping and tap the balloon to bank it for points, but only balloons inflated past 70% earn the score multiplier. The tension between greed and caution creates an addictive "one more pump" loop.

The game presents balloons one at a time (early stages) or multiple simultaneously (later stages). Each balloon has a randomized safe inflation zone. Players must read visual stress cues (color shifts, wobble intensity, sweat drops) to judge when to stop pumping. Banking early is safe but low-scoring; pushing for the multiplier risks explosion. Idle for 5 seconds and the current balloon escapes — also costing a life.

The core fantasy is the thrill of a carnival balloon game combined with gambling tension. Every tap could be the last safe one. The satisfying POP of a successfully banked balloon, the confetti burst, the score climbing — all drive the "just one more balloon" compulsion.

### 1.2 Target Audience

Casual mobile gamers aged 13-45. Ideal for short bursts: commutes, waiting rooms, commercial breaks. No skill floor — anyone can tap. High skill ceiling in reading visual cues and risk management. Appeals to both thrill-seekers (push to max) and conservative players (bank early, survive longer).

### 1.3 Core Fantasy

You are a carnival balloon artist racing the clock. Each balloon you successfully pop earns tickets. The crowd gasps as balloons stretch to their limits. You are a risk-taker, a daredevil — and the scoreboard proves it.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 45-90 seconds |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 22%+ |
| Average Balloons per Session | 8-20 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[New Balloon Appears] → [Tap to Pump] → [Decide: Keep Pumping or Bank?]
        ↑                                        │
        │                              ┌─────────┴──────────┐
        │                         [Tap Balloon]        [Keep Pumping]
        │                         [to Bank/Pop]              │
        │                              │              [Explodes? → Lose Life]
        │                              │              [Escapes? → Lose Life]
        │                         [Score!]                   │
        │                              │                     │
        └──────────────────────────────┴─────────────────────┘
                                       │
                                [3 Lives Lost → Game Over]
```

**Moment-to-moment**: A balloon appears center screen. Player taps the pump area (bottom 40% of screen) rapidly to inflate it. The balloon grows visually, color shifts from calm to stressed, wobble increases. A fill meter on the side shows approximate inflation percentage (but NOT the pop threshold). Player must decide: tap the balloon itself to pop/bank it for points, or keep pumping for higher multiplier. If inflation exceeds the hidden threshold, balloon EXPLODES — lose a life. If player stops tapping for 5 seconds, balloon floats away — lose a life.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Pump Air | Tap (bottom 40% of screen) | Each tap inflates the balloon by 3-6% (decreasing as balloon grows) |
| Bank/Pop Balloon | Tap the balloon itself | Stops inflation, pops balloon, awards score based on inflation level |
| Pause | Tap pause icon (top-right) | Pauses gameplay, shows pause overlay |

**Control Philosophy**: Two-zone tap design. Bottom = pump (rapid, mindless tapping). Top/center = balloon (deliberate, risky decision point). The physical separation between "pump zone" and "bank zone" creates a micro-moment of commitment when the player moves their finger up to pop the balloon.

**Touch Area Map**:
```
┌─────────────────────────┐
│  Score    Stage    ♥♥♥  │  ← HUD (top 10%)
├─────────────────────────┤
│                         │
│      🎈 BALLOON         │  ← Balloon Zone (middle 50%)
│      (tap to bank)      │     Tap balloon to pop & score
│                         │
│   [inflation meter]     │
│                         │
├─────────────────────────┤
│                         │
│    ⬆ PUMP ZONE ⬆       │  ← Pump Zone (bottom 40%)
│    (tap rapidly)        │     Each tap = more air
│                         │
└─────────────────────────┘
```

### 2.3 Scoring System

| Score Event | Base Points | Multiplier Condition |
|------------|-------------|---------------------|
| Bank balloon (0-49% inflation) | 10 | None (1.0x) |
| Bank balloon (50-69% inflation) | 25 | 1.5x |
| Bank balloon (70-89% inflation) | 50 | 2.0x — "RISKY!" zone |
| Bank balloon (90-99% inflation) | 100 | 3.0x — "DANGER!" zone |
| Perfect pop (95-99% inflation) | 150 | 5.0x — "PERFECT!" |
| Consecutive bank streak | +10 per streak | Streak bonus: +10 per consecutive bank without explosion |

**Combo System**: Each consecutively banked balloon without an explosion increases the streak counter. Streak bonus adds +10 points per streak level to the base score. Streak resets on explosion or escape. Visual: streak counter appears below score as "x3 STREAK!" with growing text size.

**High Score**: Stored in localStorage as `balloon-pump-panic_high_score`. Displayed on menu screen and game over screen. New high score triggers celebratory confetti + "NEW BEST!" text.

### 2.4 Progression System

The game uses an infinite stage system. Each "stage" consists of a set number of balloons to process. Completing all balloons in a stage without losing all lives advances to the next stage.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-3 | Single balloon, wide safe zone (60-95%) | Learn pump + bank mechanic |
| 4-6 | Narrower safe zones (50-90%), faster escape timer (4s) | Apply risk reading |
| 7-10 | "Speed balloons" (deflate slowly if you pause pumping) | Urgency pressure added |
| 11-15 | Dual balloons (two at once, tap to select which to pump) | Multitasking begins |
| 16-25 | Triple balloons, tighter zones (40-80%), escape timer 3s | Master zone management |
| 26+ | Random mix of all types, narrowest zones (35-75%), 3s escape | Survival endurance |

### 2.5 Lives and Failure

Players start with **3 lives** (displayed as balloon icons in HUD). Lives are lost when:

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Balloon explodes (over-inflation) | Lose 1 life, screen shake, explosion particles | — |
| Balloon escapes (5s idle / no tap) | Lose 1 life, balloon floats up off screen | — |
| All 3 lives lost | Game Over screen | Watch rewarded ad for +1 life (once per game) |

**Inactivity Death**: If the player does not tap for 5 seconds during active gameplay, the current balloon escapes (floats upward with a sad deflation sound). This costs 1 life. Timer resets on each tap.

**Death-to-restart**: Under 1.5 seconds from game over to new game start.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each stage presents N balloons (determined by stage number). The player must bank or lose balloons to advance. Stage completion requires processing all balloons (banked or exploded). The stage number advances continuously.

**Generation Algorithm**:
```
Stage Generation Parameters:
- Balloons per stage: min(3 + floor(stageNum / 3), 8)
- Pop threshold range: [minThreshold, maxThreshold] per balloon
  - minThreshold = max(35, 60 - stageNum * 1.5)
  - maxThreshold = max(55, 95 - stageNum * 0.8)
  - Actual threshold = random(minThreshold, maxThreshold)
- Inflation per tap: max(2, 6 - stageNum * 0.15) percent
- Escape timer: max(3.0, 5.0 - stageNum * 0.1) seconds
- Speed balloon chance: min(40, max(0, (stageNum - 6) * 5)) percent
- Dual balloon chance: min(50, max(0, (stageNum - 10) * 5)) percent
- Deflation rate (speed balloons): 2 + stageNum * 0.3 percent per second
```

### 3.2 Difficulty Curve

```
Difficulty
    │
100 │                                          ──────────── (cap)
    │                                    ╱
 80 │                              ╱
    │                        ╱
 60 │                  ╱
    │            ╱
 40 │      ╱
    │  ╱
 20 │╱
    │
  0 └────────────────────────────────────────── Stage
    0    5    10    15    20    25    30+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-3 | Stage 4-6 | Stage 7-10 | Stage 11-15 | Stage 16+ |
|-----------|-----------|-----------|------------|-------------|-----------|
| Balloons per stage | 3-4 | 4-5 | 5-6 | 6-7 | 7-8 |
| Pop threshold range | 60-95% | 50-90% | 45-85% | 40-80% | 35-75% |
| Inflation per tap | 5-6% | 4-5% | 3-4% | 3% | 2-3% |
| Escape timer | 5.0s | 4.0s | 3.5s | 3.0s | 3.0s |
| Speed balloons | None | None | 20% chance | 30% chance | 40% chance |
| Multi-balloon | None | None | None | Dual (30%) | Dual/Triple |
| New Mechanic | Base only | Tighter zones | Speed balloons | Dual balloons | Triple + all |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every balloon's pop threshold is at minimum 35%, meaning players can always bank before it pops if they stop early enough.
2. **Variety Threshold**: Consecutive balloons within a stage must have pop thresholds differing by at least 10%.
3. **Difficulty Monotonicity**: Overall difficulty increases with stage number. Within a stage, balloon order is randomized.
4. **Rest Stages**: Every 5th stage is a "bonus round" — all balloons have wide safe zones (70-95%) and are worth 2x points. Visual cue: golden balloon color.
5. **Boss/Special Stages**: Every 10th stage features a single giant balloon that requires 30+ taps to reach max, with a very narrow safe zone (45-55%). Worth 10x points if successfully banked.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Bright, cartoonish carnival/party aesthetic. Bold colors, rounded shapes, exaggerated physics (balloon wobble, stretchy pump animation). Clean, minimal UI that stays out of the way.

**Aesthetic Keywords**: Carnival, Bouncy, Bright, Playful, Tension

**Reference Palette**: County fair balloon pop game meets mobile arcade energy. Saturated pastels with neon accents for danger states.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary (Calm Balloon) | Sky Blue | #4FC3F7 | Balloon at 0-49% inflation |
| Warning Balloon | Sunset Orange | #FF8A65 | Balloon at 50-69% inflation |
| Danger Balloon | Hot Red | #EF5350 | Balloon at 70-89% inflation |
| Critical Balloon | Deep Red | #C62828 | Balloon at 90%+ inflation |
| Background | Soft Cream | #FFF8E1 | Game background |
| Background Gradient | Light Lavender | #E8EAF6 | Background bottom gradient |
| Pump Zone | Warm Gray | #ECEFF1 | Bottom tap zone background |
| Success/Pop | Bright Green | #66BB6A | Successful bank particles, "+score" text |
| Explosion | Fiery Orange | #FF6D00 | Explosion particles |
| Escape | Sad Blue | #90CAF9 | Escaped balloon trail |
| UI Text | Dark Charcoal | #263238 | Score, stage labels |
| UI Accent | Deep Purple | #7E57C2 | Buttons, highlights |
| Streak Text | Gold | #FFD600 | Streak counter display |

### 4.3 SVG Specifications

All game graphics are rendered as SVG elements generated in code. No external image assets.

**Balloon (base shape)**:
```svg
<!-- 60x80 balloon, colors change dynamically based on inflation % -->
<svg width="60" height="100" viewBox="0 0 60 100">
  <!-- Balloon body: ellipse, fill changes with inflation state -->
  <ellipse cx="30" cy="35" rx="25" ry="32" fill="#4FC3F7" stroke="#29B6F6" stroke-width="2"/>
  <!-- Highlight reflection -->
  <ellipse cx="20" cy="22" rx="8" ry="12" fill="rgba(255,255,255,0.3)" transform="rotate(-15,20,22)"/>
  <!-- Knot at bottom -->
  <polygon points="27,66 30,72 33,66" fill="#29B6F6"/>
  <!-- String -->
  <path d="M30,72 Q28,82 32,92 Q28,97 30,100" fill="none" stroke="#90A4AE" stroke-width="1.5"/>
</svg>
```

**Pump**:
```svg
<!-- 80x60 hand pump at bottom of screen -->
<svg width="80" height="60" viewBox="0 0 80 60">
  <!-- Pump cylinder -->
  <rect x="25" y="10" width="30" height="40" rx="4" fill="#78909C" stroke="#546E7A" stroke-width="2"/>
  <!-- Pump handle (animates down on tap) -->
  <rect x="20" y="0" width="40" height="12" rx="3" fill="#B0BEC5" stroke="#78909C" stroke-width="2"/>
  <!-- Nozzle/tube -->
  <rect x="36" y="48" width="8" height="12" fill="#546E7A"/>
  <!-- Air puff indicator (shown on tap) -->
  <circle cx="40" cy="55" r="4" fill="rgba(255,255,255,0.6)"/>
</svg>
```

**Explosion Particle**:
```svg
<!-- 12x12 triangle shard, rotated randomly -->
<svg width="12" height="12" viewBox="0 0 12 12">
  <polygon points="6,0 12,12 0,12" fill="#FF6D00" opacity="0.9"/>
</svg>
```

**Confetti Piece** (for successful pop):
```svg
<!-- 8x8 square, random color from palette -->
<svg width="8" height="8" viewBox="0 0 8 8">
  <rect x="0" y="0" width="8" height="8" rx="1" fill="#66BB6A"/>
</svg>
```

**Life Icon (balloon-shaped heart)**:
```svg
<!-- 20x28 mini balloon for lives display -->
<svg width="20" height="28" viewBox="0 0 20 28">
  <ellipse cx="10" cy="10" rx="9" ry="11" fill="#EF5350"/>
  <polygon points="8,20 10,24 12,20" fill="#C62828"/>
</svg>
```

**Design Constraints**:
- All SVG elements use basic shapes (ellipse, rect, polygon, path) — no complex paths
- Maximum 6 path elements per SVG object
- Balloon scale animation via Phaser tween on `scaleX`/`scaleY` (not SVG animate)
- Wobble via Phaser tween on `rotation` with sine easing

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Balloon grow | Each pump tap | Scale tween: current → current + inflatePerTap, 80ms, Bounce.Out |
| Color shift | Inflation crosses threshold | Tint tween: smooth lerp between zone colors over 200ms |
| Wobble increase | Inflation > 50% | Rotation oscillation: amplitude = inflation% * 0.08 rad, period 200ms |
| Sweat drops | Inflation > 80% | 2 small white circles near top of balloon, oscillate Y ±3px |
| Pump squash | Each pump tap | Pump handle moves down 8px over 60ms, bounces back 100ms |
| Air puff | Each pump tap | Small white circle at pump nozzle, scale 1→2, fade 0→1→0, 150ms |

---

## 5. Audio Design

### 5.1 Sound Effects

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Pump tap | Short air puff "pssh" | 80ms | High |
| Balloon bank/pop | Satisfying "POP" — bright, rubbery | 200ms | High |
| Balloon explode | Loud "BANG" + rubber snap | 300ms | High |
| Balloon escape | Sad deflation "pffft" ascending pitch | 500ms | Medium |
| Score increase | Quick ascending chime "ding" | 150ms | Medium |
| Streak milestone (5, 10) | Ascending triple chime | 400ms | Medium |
| Stage complete | Short fanfare — 4 ascending notes | 800ms | High |
| Game over | Descending trombone "wah wah" | 1000ms | High |
| New high score | Celebratory jingle with sparkle | 1500ms | High |
| Warning (80%+ inflation) | Subtle rubber stretching creak | 300ms, loops | Low |
| UI button press | Soft click | 60ms | Low |

### 5.2 Music Concept

**Background Music**: No persistent background music. The game's tension comes from silence punctuated by pump sounds and warning creaks. This amplifies the anxiety of each pump tap.

**Ambient State Machine**:
| Game State | Audio Behavior |
|-----------|---------------|
| Menu | Soft carnival music loop, 100bpm, major key |
| Gameplay (calm, <50%) | Pump sounds only, ambient silence |
| Gameplay (tense, 50-80%) | Low drone starts fading in |
| Gameplay (danger, >80%) | Rubber creak sound loops, heartbeat-like pulse |
| Bank/Pop | Satisfying pop + chime, tension sounds cut |
| Game Over | Music fade, trombone wah |

**Audio Implementation**: Web Audio API via Phaser's built-in sound manager. No external audio library needed — all sounds synthesized or use short base64-encoded audio sprites.

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Boot    │────→│   Menu   │────→│   Game   │
│  Scene   │     │  Screen  │     │  Screen  │
└──────────┘     └─────┬────┘     └──────────┘
                    │   │                │
               ┌────┘   │           ┌────┴────┐
               │        │           │  Pause  │
          ┌────┴────┐   │           │ Overlay │
          │  Help   │   │           └────┬────┘
          │How 2Play│   │                │
          └─────────┘   │           ┌────┴────┐
                   ┌────┴────┐     │  Game   │
                   │Settings │     │  Over   │
                   │ Overlay │     │ Screen  │
                   └─────────┘     └────┬────┘
                                        │
                                   ┌────┴────┐
                                   │ Continue│
                                   │ Prompt  │
                                   └─────────┘
```

### 6.2 HUD Layout

```
┌─────────────────────────────────┐
│ 🏆 1250    Stage 4    🎈🎈🎈   │  ← Top bar (8% height)
├─────────────────────────────────┤
│            x3 STREAK!           │  ← Streak (appears when active)
│                                 │
│         ┌─────────────┐         │
│         │             │         │
│         │   BALLOON   │  ░░░░   │  ← Balloon + inflation meter (right side)
│         │             │  ░░░░   │     Meter: 8px wide, fills upward
│         │             │  ████   │     Green < 50%, Orange < 80%, Red > 80%
│         └─────────────┘  ████   │
│                          ████   │
├─────────────────────────────────┤
│                                 │
│        ⬆ TAP TO PUMP ⬆         │  ← Pump Zone (40% height)
│          [PUMP IMG]             │     Pump graphic centered
│                                 │
└─────────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left, 16px from edges | Current score, 32px bold font | Every score event (punch anim) |
| Stage | Top-center | "Stage N", 24px font | On stage transition |
| Lives | Top-right, 16px from edge | 3 mini balloon icons (filled/empty) | On life change |
| Streak | Center-top, below HUD bar | "xN STREAK!", gold, 28px, grows with streak | On each bank |
| Inflation Meter | Right side of balloon, 8px wide | Vertical fill bar, color-coded | Every pump tap |
| Zone Label | Above balloon | "SAFE" / "RISKY!" / "DANGER!" / "PERFECT!" | On zone threshold cross |
| Escape Timer | Near balloon (subtle) | Circular countdown, appears after 2s idle | Continuous when idle |

### 6.3 Menu Structure

**Main Menu**:
- Game title "BALLOON PUMP PANIC" — large, bouncy text with balloon accent
- "PLAY" button — large round purple button (#7E57C2), 180x60px, center screen
- "?" help icon — top-left, 44x44px circular
- Sound toggle — top-right speaker icon, 44x44px
- High Score display — below play button, "BEST: 12450"

**Pause Menu** (overlay, semi-transparent #263238 at 70% opacity):
- "RESUME" button — large, center
- "HOW TO PLAY" — below resume
- "RESTART" — below how to play
- "QUIT" — bottom, smaller text

**Game Over Screen**:
- "GAME OVER" title — 40px, red (#EF5350)
- Final Score — 56px, animated count-up from 0, center
- "NEW BEST!" label — gold (#FFD600), only if new record, scale pulse animation
- Stage Reached — "Stage 12", 24px, below score
- Balloons Banked — "14 Popped!", 20px
- "PLAY AGAIN" button — large purple, 180x60px
- "MENU" button — smaller, below play again, 120x44px
- Continue prompt (if first death): "Watch Ad for +1 Life" button, green (#66BB6A)

**Help / How to Play Screen** (overlay):
- Title: "HOW TO PLAY" — 32px bold
- Visual 1: Animated SVG showing tap zone at bottom with arrow + "TAP TO PUMP"
- Visual 2: SVG balloon with tap icon + "TAP BALLOON TO POP & SCORE"
- Visual 3: Color-coded inflation meter showing zones: Safe (blue), Risky (orange), Danger (red)
- Rules list:
  - "Inflate past 70% for score multiplier!"
  - "Push too far and it EXPLODES — lose a life!"
  - "Stop tapping for 5s and it escapes!"
  - "3 lives — use them wisely!"
- Tips:
  - "Watch for wobble and color — they warn you!"
  - "Every 5th stage is a bonus round — go big!"
- "GOT IT!" button — bottom center, 160x50px purple

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after final death | Every game over (once per game) | Always optional |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Life | Watch rewarded ad at game over | +1 life, resume from current stage | Once per game |

### 7.3 Session Economy

The game is free-to-play with minimal ad pressure. Interstitial ads appear only every 3rd game over to avoid frustration. The rewarded continue is genuinely useful — one extra life often means 2-4 more stages.

**Session Flow with Monetization**:
```
[Play Free] → [All Lives Lost] → [Rewarded Ad: +1 Life?]
                                        │ Yes → [Resume Stage + Continue]
                                        │ No  → [Game Over Screen]
                                                      │
                                                [Interstitial (every 3rd)]
                                                      │
                                                [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/balloon-pump-panic/
├── index.html              # Entry point, CDN Phaser, script load order
│   ├── CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
│   ├── Local CSS           # css/style.css
│   └── Local JS (ordered)  # config → stages → ads → effects → ui → game → main (LAST)
├── css/
│   └── style.css           # Responsive styles, mobile-first
└── js/
    ├── config.js           # Colors, difficulty tables, SVG strings, scoring constants
    ├── stages.js           # Stage generation, balloon threshold calculation, difficulty scaling
    ├── ads.js              # Ad integration hooks, reward callbacks
    ├── effects.js          # Particle systems, screen shake, juice functions
    ├── ui.js               # MenuScene, GameOverScene, HelpScene, HUD overlay, pause
    ├── game.js             # GameScene: balloon inflate/pop/explode, input, lives, state
    └── main.js             # BootScene (register SVG textures), Phaser config, scene array [Boot, Menu, Game, UI] — LOADS LAST
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `COLORS` object: all hex codes for balloon states, UI, background
- `DIFFICULTY` table: per-stage-range parameters (threshold ranges, inflate rate, escape timer, speed balloon chance)
- `SCORING` object: base points per zone, multipliers, streak bonus
- `SVG_STRINGS` object: all SVG markup as template literal strings (balloon, pump, particles, life icon)
- `GAME_CONFIG` object: canvas dimensions (360x640 base), lives count (3), idle timeout (5000ms)

**stages.js** (max 300 lines):
- `generateStage(stageNum)`: returns array of balloon configs `{ popThreshold, isSpeedBalloon, deflateRate }`
- `getDifficultyParams(stageNum)`: returns `{ minThreshold, maxThreshold, inflatePerTap, escapeTimer, speedChance, dualChance }`
- `isBonusStage(stageNum)`: returns true for every 5th stage
- `isBossStage(stageNum)`: returns true for every 10th stage
- Balloon threshold randomization with variety guarantee (10% min difference between consecutive)

**ads.js** (max 300 lines):
- `initAds()`: placeholder for ad SDK initialization
- `showInterstitial(callback)`: trigger interstitial with game-over counter check (every 3rd)
- `showRewarded(callback)`: trigger rewarded ad for continue, call reward callback on completion
- `onAdEvent(type, data)`: event handler stubs for ad lifecycle
- Game-over counter tracking in memory

**effects.js** (max 300 lines):
- `popEffect(scene, x, y, color)`: confetti burst — 20 particles, radial, 400ms
- `explodeEffect(scene, x, y)`: explosion — 30 triangle shards, outward velocity, 500ms
- `escapeEffect(scene, x, y)`: balloon floats up trail — 10 circles, upward, fade 600ms
- `screenShake(scene, intensity, duration)`: camera shake via `scene.cameras.main.shake()`
- `scalePunch(gameObject, scale, duration)`: scale tween with bounce-back
- `floatingText(scene, x, y, text, color, size)`: floating score text, drift up 60px, fade 600ms

**ui.js** (max 300 lines):
- `MenuScene`: title text, play button, help button, sound toggle, high score display
- `GameOverScene`: final score count-up, new record check, play again / menu buttons, continue prompt
- `HelpScene`: visual how-to-play with SVG illustrations, rules, tips, "GOT IT!" button
- HUD overlay (launched as parallel scene): score, stage, lives, streak display
- Pause overlay: resume, restart, quit buttons
- All buttons minimum 44x44px touch targets

**game.js** (max 300 lines):
- `GameScene.create()`: initialize balloon sprite, pump sprite, input zones, stage data, lives
- `GameScene.update()`: check idle timer, update wobble/color based on inflation, handle speed balloon deflation
- `onPumpTap()`: increment inflation, check against pop threshold, trigger juice effects
- `onBalloonTap()`: bank balloon, calculate score with multiplier and streak, spawn next balloon
- `onExplode()`: lose life, explosion effect, shake, spawn next balloon after delay
- `onEscape()`: lose life, escape effect, spawn next balloon
- `checkGameOver()`: if lives <= 0, transition to GameOverScene
- Idle timer: 5000ms `setTimeout`, reset on each tap, triggers `onEscape()`

**main.js** (max 300 lines):
- `BootScene.create()`: register all SVG textures from `SVG_STRINGS` via `textures.addBase64()`
- `BootScene.preload()`: set up load events, wait for all textures
- Phaser.Game config: type AUTO, width/height from GAME_CONFIG, scene array [BootScene, MenuScene, GameScene, UIScene, GameOverScene, HelpScene]
- Global state: `highScore`, `gamesPlayed`, `settings` — read/write localStorage
- Orientation change handler: resize game on portrait/landscape switch
- **CRITICAL**: main.js loads LAST in index.html script order

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

---

## 9. Juice Specification

### 9.1 Player Input Feedback (every pump tap)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Pump nozzle | Count: 3, Direction: upward fan (±30deg), Color: #FFFFFF, Lifespan: 150ms |
| Scale punch | Balloon | Scale: 1.0 → 1.0 + inflatePerTap, Recovery: 80ms, Ease: Bounce.Out |
| Scale punch | Pump handle | ScaleY: 1.0 → 0.7 → 1.0, Duration: 60ms down + 100ms up |
| Sound | — | Air puff "pssh", Pitch: base + (inflation% * 0.5)% (higher pitch as fuller) |
| Haptic | Device | 10ms vibration pulse (if supported) |

### 9.2 Core Action — Balloon Bank/Pop (most satisfying moment)

| Effect | Values |
|--------|--------|
| Particles | Count: 20 confetti pieces, Radial burst, Colors: random from [#66BB6A, #4FC3F7, #FFD600, #FF8A65, #7E57C2], Lifespan: 400ms, Gravity: 200 |
| Hit-stop | 40ms physics pause — balloon freezes mid-pop |
| Screen shake | Intensity: 4px, Duration: 120ms |
| Scale punch | Balloon scales to 1.4x over 40ms then disappears (alpha 0 over 60ms) |
| Camera zoom | 1.03x, Recovery: 200ms, Ease: Sine.Out |
| Floating text | "+{score}", Color: #66BB6A (or #FFD600 for PERFECT), Size: 28px + (streak * 2px), Rise: 60px up, Fade: 600ms |
| Combo escalation | Particle count +5 per streak level, shake +1px per streak, text size +2px per streak |

### 9.3 Balloon Explosion (failure — punishing but exciting)

| Effect | Values |
|--------|--------|
| Particles | Count: 30 triangle shards, Radial burst, Colors: [#FF6D00, #EF5350, #C62828], Lifespan: 500ms, Gravity: 300 |
| Screen shake | Intensity: 10px, Duration: 300ms |
| Screen flash | Red (#EF5350) overlay at 30% opacity, flash 100ms on → 200ms fade off |
| Sound | "BANG" — low freq impact, 300ms |
| Camera zoom | 1.06x snap, Recovery: 400ms |
| Life icon | Lost life icon shrinks to 0 + fades over 300ms |
| Effect → next balloon delay | 600ms |
| Streak reset | Streak text scales down to 0 + fades, 200ms |

### 9.4 Balloon Escape (idle failure — sad, not punishing)

| Effect | Values |
|--------|--------|
| Balloon movement | Float upward 400px over 800ms, slight horizontal wobble ±20px sine wave |
| Particles | Count: 8 small circles trailing below balloon, Color: #90CAF9, Lifespan: 300ms |
| Sound | Sad deflation "pffft", ascending pitch over 500ms |
| Screen effect | Slight desaturation (0.7 saturation) for 500ms |
| Life icon | Lost life fades out over 300ms |
| Effect → next balloon delay | 500ms |

### 9.5 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{N}", Color: #66BB6A (normal) / #FFD600 (streak 3+) / #FF6D00 (PERFECT), Rise: 60px, Fade: 600ms |
| Score HUD punch | Scale 1.3x, Recovery: 150ms, Ease: Back.Out |
| Combo text | "x{N} STREAK!" at 28px base, +2px per streak level, max 48px. Color: #FFD600. Pulse scale 1.0→1.15→1.0 every 400ms |
| Zone label | "RISKY!" (orange, 24px) / "DANGER!" (red, 28px, shake ±2px) / "PERFECT!" (gold, 32px, rainbow tint cycle) |

### 9.6 Stage Transition Effects

| Effect | Values |
|--------|--------|
| Stage complete text | "STAGE {N} CLEAR!" — 36px, white, center screen, scale 0→1.2→1.0 over 400ms |
| Confetti rain | 40 particles falling from top, random colors, 1200ms duration |
| Background flash | Brief white flash 80ms |
| Next stage delay | 1000ms total (400ms celebration + 600ms new balloon spawn) |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | All assets are inline SVG, minimal load |
| Memory Usage | <50MB | No bitmap assets, SVG only |
| JS Bundle Size | <150KB total (excl. CDN) | 7 files, each ≤300 lines |
| First Interaction | <500ms after load | SVG textures register fast |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser pointer events handle both touch and mouse
- **Prevent Default**: Disable pull-to-refresh, pinch-zoom, double-tap-zoom via CSS `touch-action: none`
- **Orientation**: Portrait preferred. On landscape, show "rotate device" overlay
- **Safe Areas**: Top HUD bar offset by `env(safe-area-inset-top)` for notched phones
- **Background Detection**: `visibilitychange` event pauses game, prevents battery drain
- **Tap Responsiveness**: No input debounce on pump zone — every tap counts. Balloon tap zone has 100ms debounce to prevent accidental double-pop

### 10.3 Touch Controls

- **Pump Zone**: Bottom 40% of canvas. Minimum touch target is the entire zone (no precision needed). Each `pointerdown` event = one pump.
- **Balloon Tap Zone**: Hit area is the balloon sprite bounds + 15px padding (generous touch target, minimum 60x80px)
- **Pause Button**: Top-right corner, 44x44px, 16px from edges
- **Input Buffering**: If player taps balloon during pump animation, buffer the tap and execute after animation completes
- **Gesture Recognition**: Tap only — no swipe, hold, or multi-touch needed
- **Haptic Feedback**: `navigator.vibrate(10)` on pump tap, `navigator.vibrate(50)` on explosion (if supported)

### 10.4 Edge Cases

- **Rapid tapping**: Pump inflation capped at 1 tap per 50ms minimum (prevents 100+ taps/sec exploit)
- **Tap between zones**: If tap Y coordinate is ambiguous (within 20px of zone boundary), classify as pump zone (safer default)
- **Balloon at 100%**: If inflation reaches 100% without hitting threshold, auto-pop as explosion (guaranteed death at 100%)
- **Tab switch mid-game**: Pause game on `visibilitychange`, resume on return
- **Orientation change**: Resize canvas, reposition all elements, do not reset game state
- **Multiple simultaneous balloons (stage 11+)**: Only the "active" balloon inflates. Tap a different balloon to switch active target. Non-active balloons still have escape timers running.
- **localStorage unavailable**: Fallback to in-memory storage, high scores lost on refresh

### 10.5 Local Storage Schema

```json
{
  "balloon-pump-panic_high_score": 0,
  "balloon-pump-panic_games_played": 0,
  "balloon-pump-panic_highest_stage": 0,
  "balloon-pump-panic_settings": {
    "sound": true,
    "vibration": true
  },
  "balloon-pump-panic_total_balloons_popped": 0
}
```

### 10.6 Critical Implementation Warnings

1. **Script load order**: `main.js` MUST load last in `index.html`. Order: config → stages → ads → effects → ui → game → main
2. **SVG texture registration**: All `textures.addBase64()` calls happen ONCE in BootScene. Never re-register on scene restart.
3. **Idle timer**: Use `setTimeout()` not Phaser `delayedCall()` for the 5s escape timer — Phaser timers pause with `timeScale=0`
4. **Scene management**: GameScene and UIScene run in parallel. UIScene overlays GameScene for HUD. Communication via Phaser events.
5. **Balloon state machine**: States are INFLATING → BANKED / EXPLODED / ESCAPED. Never process input during transitions.
6. **No physics engine needed**: Pure tween-based animation. Do not use Phaser Arcade or Matter.js — balloon movement is cosmetic only.
