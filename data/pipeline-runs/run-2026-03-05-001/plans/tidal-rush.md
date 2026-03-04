# Game Design Document: Tidal Rush

**Slug**: `tidal-rush`
**One-Liner**: Surf ahead of a rising tide by jumping platforms that the water destroys from below.
**Core Mechanic**: Auto-running platform leap ahead of rising water
**Target Session Length**: 3–5 minutes
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Tidal Rush is a one-touch auto-runner where the player rides the panic of an ever-rising ocean. The player character runs automatically left-to-right across procedurally generated floating platforms. Every platform the player stands on begins sinking 0.5s after first contact, and the water level rises continuously — lagging even 2 seconds means the platforms beneath you are already gone. The player taps anywhere on screen to jump; the urgency of the rising tide creates relentless forward momentum and natural escalating tension.

The key insight is danger-from-below rather than danger-from-ahead. Traditional runners ask "can you dodge the obstacle in front of you?" Tidal Rush asks "can you outrun the floor disappearing under your feet?" This creates a fundamentally different emotional arc: not reflexive dodging, but desperate forward momentum with split-second jump timing.

Death occurs if the player touches the water, falls into a gap, or stands still for 10 seconds. Every run ends with a precise score tied to distance and height gain, giving players a concrete number to chase. The loop is: jump → land → sink begins → jump again or die.

### 1.2 Target Audience

Casual mobile gamers aged 14–35. Players who enjoy endless runners (Temple Run, Subway Surfers) but want vertical skill expression. Play context: commute, 2–5 minute idle moments, quick sessions. Skill expectation: beginner-friendly in first 5 stages; mastery curve peaks around stage 20 where gap widths and sink rates demand near-perfect timing.

### 1.3 Core Fantasy

The player is a surfer outrunning the apocalyptic flood — impossibly agile, always one step ahead of the ocean eating the world. The fantasy is *barely making it*: landing on a platform with 0.1 seconds to spare before the last one sinks feels heroic. The game rewards the player who commits to the jump rather than hesitating.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 3–5 minutes |
| Day 1 Retention | 40%+ |
| Day 7 Retention | 20%+ |
| Average Stages Reached per Session | 8+ |
| Crash Rate | <1% |
| Death→Restart Time | <2 seconds |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Stage Start] → [Platforms Generate Ahead] → [Player Auto-Runs]
     ↑                                               │
     │                                    [Player Taps → Jumps]
     │                                               │
     │                               [Lands on Platform → Sinks Timer]
     │                                               │
     │                           [Water Rises / Platforms Behind Sink]
     │                                               │
     │                        [Stage Distance Reached → Stage Clear +100 pts]
     │                                               │
     └──────────── [Score tallied → Next Stage] ←───┘
                                │
                         [Fell in water / gap → Game Over]
                                │
                    [Game Over Screen: score, stage, retry]
```

**Moment-to-moment**: The player watches the character auto-run and taps to jump over gaps. The platform they just left starts to sink (visual: tilting and descending). The water rises from below at a set rate. The player must commit to jumps — holding tap gives a higher jump arc (up to 1.5x height). The tension comes from *not waiting*: the hesitant player dies; the committed player thrives.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Short Jump | Tap (< 200ms press) | Launches player at 70% max jump height, covers ~1.5 platform widths horizontally |
| High Jump | Hold (> 200ms press) | Launches player at 100% max jump height, covers ~2.2 platform widths horizontally |
| No Action | None | Player auto-runs forward; will run off platform edge and fall |

**Control Philosophy**: Single touch, zero learning curve. The depth is in *timing* the tap relative to platform edge and *holding* vs *tapping* to control arc. No swipes, no double-taps. One finger, one decision: when to jump and for how long.

**Touch Area Map**:
```
┌─────────────────────────────────┐
│  [HUD: Score | Stage | Water%]  │  ← Top 60px, non-interactive
├─────────────────────────────────┤
│                                 │
│        FULL SCREEN TAP          │
│           ZONE                  │  ← Entire remaining screen = jump input
│     (tap or hold to jump)       │
│                                 │
│  ~~~ WATER RISES FROM HERE ~~~  │
└─────────────────────────────────┘
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Each platform landed | 10 pts | — |
| Stage completed | 100 pts | × stage number (e.g., stage 5 = 500 pts) |
| Near-miss land (< 0.1s before platform fully sinks) | 25 bonus pts | — |
| Consecutive perfect landings (edge of platform) | 15 pts each | × combo count (max 8×) |
| Water level survived (each 10% risen) | 5 pts | — |

**Combo System**: "Perfect Land" combo activates when player lands within 20% of platform edge. Each consecutive perfect land adds 1 to combo multiplier (capped at 8×). Combo resets on center land, gap-jump, or death.

**High Score**: Local storage key `tidal-rush_high_score`. Displayed on main menu and game over screen. Animated counter on new record.

### 2.4 Progression System

The game is infinite. Stages are procedurally generated with increasing difficulty. Each stage has a fixed number of platforms (15–30 depending on stage). Completing a stage means traversing all platforms without dying.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1–3 | Basic platforms, slow water, wide gaps | Tutorialease — learn tap vs hold |
| 4–8 | Sink speed increases; shorter platforms introduced | Medium — must time jumps |
| 9–15 | Moving platforms (horizontal oscillation, ±40px/s) | Hard — anticipate movement |
| 16–25 | Crumble platforms (crack animation, only 0.3s before sinking) | Very Hard — immediate jump required |
| 26–40 | Bouncy platforms (launch 1.5× height, double-jump zone) | Expert — control arc mid-air |
| 41+ | Mixed: all types, random narrow/wide gaps, max water rise speed | Survival — pure reflex |

### 2.5 Lives and Failure

No lives system. Single life per run. Death triggers immediate game over.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Character touches water | Instant death → Game Over screen | Tap "Play Again" |
| Character falls into gap (no platform below) | Instant death → Game Over screen | Tap "Play Again" |
| No tap for 10 consecutive seconds | Water surges +200px in 0.5s, almost certainly kills | Tap before 10s inactivity — death is fair |
| Inactivity death (hard cutoff) | Game Over forced at 10s | Tap "Play Again" |

Death→restart pipeline: death detected → 0ms: screen shake + red flash → 300ms: character sinks animation → 500ms: game over overlay fades in → player taps "Play Again" → 200ms fade out → new game initialized. **Total under 2 seconds guaranteed.**

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each stage is a sequence of floating platforms generated left-to-right in a scrolling world. The game uses a seeded pseudo-random generator (`stage_number * 7919 + salt`) so the same stage always generates identically. The world scrolls right as the player advances.

**Generation Algorithm**:
```
Stage Generation Parameters:
- Seed: stage_number * 7919 + 42 (fixed salt)
- Platform Count: 15 + Math.floor(stage_number / 3) capped at 30
- Platform Width: random in range [minWidth, maxWidth] (see table below)
- Gap Width: random in range [minGap, maxGap] (see table below)
- Platform Type Weights: see stage-type probability table
- Water Rise Rate: baseRate + (stage_number * incrementRate)
- Sink Speed: baseSink + (stage_number * sinkIncrement)
- Moving Platform Frequency: 0% stages 1-8, then +5% per stage up to 60%
- Crumble Platform Frequency: 0% stages 1-15, then +5% per stage up to 50%
```

**Platform height variation**: Platforms are placed at heights ±60px from a baseline, randomly, to create vertical interest without requiring double-jump mechanics.

### 3.2 Difficulty Curve

```
Difficulty
    │
100 │                                          ──────── (cap at stage 41+)
    │                                    ╱
 80 │                              ╱
    │                        ╱
 60 │                  ╱
    │           ╱─────/ (plateau 16-25: crumble introduction)
 40 │      ╱
    │  ╱
 20 │╱ (gentle tutorial 1-3)
    │
  0 └────────────────────────────────────────── Stage
    0    5    10    15    20    25    30    40+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1–3 | Stage 4–8 | Stage 9–15 | Stage 16–25 | Stage 41+ |
|-----------|-----------|-----------|-----------|-------------|-----------|
| Auto-run speed (px/s) | 120 | 160 | 200 | 220 | 260 |
| Platform min width (px) | 80 | 65 | 55 | 45 | 36 |
| Platform max width (px) | 140 | 120 | 100 | 85 | 70 |
| Gap min width (px) | 40 | 55 | 65 | 70 | 80 |
| Gap max width (px) | 70 | 90 | 110 | 130 | 150 |
| Water rise rate (px/s) | 12 | 20 | 30 | 40 | 60 |
| Sink speed after land (ms to full sink) | 1200 | 900 | 700 | 400 | 300 |
| Moving platform % | 0% | 0% | 30% | 40% | 60% |
| Crumble platform % | 0% | 0% | 0% | 25% | 50% |
| Reaction time required (ms) | 800 | 600 | 450 | 350 | 250 |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: First 3 platforms of every stage always use max width and min gap — guaranteed reachable even without holding tap.
2. **Variety Threshold**: At least 3 of 8 difficulty parameters differ between consecutive stages.
3. **No Consecutive Crumble+Moving**: A crumble platform is never immediately preceded or followed by a moving platform — prevents unfair chained uncertainty.
4. **Rest Stages**: Every 10 stages, one "breather" stage with difficulty reduced by 20% from current baseline. Signals: platform tint turns teal, water rise halted for 5 seconds at start.
5. **Boss Stages**: Every 15 stages, a "surge" stage: water rise speed doubles for 10 seconds mid-stage, then resets. Player must survive the surge. Signals: red sky tint for boss stage.
6. **Platform Minimum Count**: Every stage must have at least 15 reachable platforms. Generation re-rolls if solvability check fails.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Clean geometric minimalism. Bold flat shapes, strong color contrast, no gradients except on water. The world feels like a clean illustration — bold outlines, pure colors, expressive shapes.

**Aesthetic Keywords**: Urgent, Aquatic, Kinetic, Bold, Clean

**Reference Palette**: Vibrant ocean blue against sandy-orange platforms. The player character is a bright white silhouette to pop against all backgrounds. Water is deep navy with animated foam.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary (Player) | Pure White | `#FFFFFF` | Player character silhouette |
| Platform Normal | Warm Sand | `#F4A261` | Standard platforms |
| Platform Moving | Sky Teal | `#2EC4B6` | Moving platforms |
| Platform Crumble | Pale Ochre | `#E9C46A` | Crumble platforms (cracks show) |
| Platform Sinking | Dark Rust | `#C1440E` | Platforms mid-sink (tint shift) |
| Water Surface | Ocean Blue | `#0077B6` | Water top layer |
| Water Body | Deep Navy | `#023E8A` | Water body below surface |
| Water Foam | White-Blue | `#ADE8F4` | Animated foam on water surface |
| Background Sky | Dusk Orange | `#FF6B35` | Scrolling sky gradient (2 colors) |
| Background Sky 2 | Deep Amber | `#F7931E` | Bottom of sky gradient |
| Danger Alert | Alert Red | `#E63946` | Low water warning, boss stages |
| Score/HUD Text | Pure White | `#FFFFFF` | All HUD text |
| HUD Background | Black 60% | `rgba(0,0,0,0.6)` | HUD top bar background |
| Combo Text | Gold | `#FFD700` | Combo counter floating text |

### 4.3 SVG Specifications

All graphics generated as SVG in code. No external image files.

**Player Character** (24×32px bounding box):
```svg
<!-- Surfer: simplified human silhouette in crouch-jump pose -->
<g id="player">
  <!-- Body -->
  <ellipse cx="12" cy="20" rx="5" ry="8" fill="#FFFFFF"/>
  <!-- Head -->
  <circle cx="12" cy="9" r="5" fill="#FFFFFF"/>
  <!-- Left arm (forward reach) -->
  <line x1="7" y1="18" x2="1" y2="13" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Right arm (back) -->
  <line x1="17" y1="18" x2="21" y2="22" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Left leg (bent, landing pose) -->
  <line x1="9" y1="26" x2="5" y2="32" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
  <!-- Right leg -->
  <line x1="15" y1="26" x2="19" y2="32" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
</g>
```

**Normal Platform** (variable width × 18px height):
```svg
<!-- Platform: rounded rect with subtle top highlight line -->
<g id="platform-normal">
  <rect x="0" y="0" width="{w}" height="18" rx="4" ry="4" fill="#F4A261"/>
  <rect x="3" y="2" width="{w-6}" height="3" rx="2" fill="#FFBA80" opacity="0.6"/>
</g>
```

**Crumble Platform** (variable width × 18px, with crack lines):
```svg
<g id="platform-crumble">
  <rect x="0" y="0" width="{w}" height="18" rx="4" ry="4" fill="#E9C46A"/>
  <!-- Crack lines (drawn procedurally) -->
  <line x1="{w*0.3}" y1="0" x2="{w*0.25}" y2="18" stroke="#C07A1A" stroke-width="1.5" opacity="0.8"/>
  <line x1="{w*0.65}" y1="0" x2="{w*0.7}" y2="18" stroke="#C07A1A" stroke-width="1.5" opacity="0.8"/>
</g>
```

**Moving Platform** (variable width × 18px, with arrow hint):
```svg
<g id="platform-moving">
  <rect x="0" y="0" width="{w}" height="18" rx="4" ry="4" fill="#2EC4B6"/>
  <!-- Directional arrows -->
  <polygon points="4,9 10,5 10,13" fill="#1A8A84" opacity="0.7"/>
  <polygon points="{w-4},9 {w-10},5 {w-10},13" fill="#1A8A84" opacity="0.7"/>
</g>
```

**Water Surface Layer** (full width × 24px):
```svg
<g id="water-surface">
  <!-- Animated wave via JS-controlled path -->
  <path id="wave-path" d="M0,12 Q{w/4},0 {w/2},12 Q{3w/4},24 {w},12 L{w},24 L0,24 Z" fill="#0077B6"/>
  <!-- Foam dots (3–5 circles at random x, animated bobbing) -->
  <circle cx="{x1}" cy="4" r="3" fill="#ADE8F4" opacity="0.8"/>
  <circle cx="{x2}" cy="8" r="2" fill="#ADE8F4" opacity="0.6"/>
  <circle cx="{x3}" cy="3" r="4" fill="#ADE8F4" opacity="0.7"/>
</g>
```

**Background**: Two-layer parallax. Sky: static `#FF6B35` to `#F7931E` gradient rectangle. Distant silhouette elements (3–5 simplified SVG cloud ovals, white at 20% opacity) scroll at 0.2× player speed.

**Design Constraints**:
- Maximum 8 path/polygon elements per platform SVG
- Use rect, circle, ellipse, line, polygon — avoid complex cubic bezier paths for platforms
- Water wave animated via `update()` modifying a single SVG path d attribute
- Player has 2 animation frames: run (default) and airborne (arms up, legs extend)

### 4.4 Visual Effects

| Effect | Trigger | Implementation | Duration |
|--------|---------|---------------|----------|
| Platform sink tilt | 0.5s after landing | Phaser tween: rotation +8° + y +80px | 800–1200ms (based on stage sink speed) |
| Water foam wave | Continuous | sin() wave on foam circle y positions, 2Hz | Loop |
| Player jump squash | On jump input | Scale Y 0.6 → 1.2, X 1.3 → 0.8, recover | 80ms down, 60ms up |
| Player land stretch | On landing | Scale X 1.4, Y 0.7, recover to 1,1 | 100ms |
| Water spray particles | On player landing near water | 8–12 blue/white circles, radial, y-up | 400ms fade |
| Platform crack particles | Crumble platform first contact | 4–6 small rect debris, fall down | 600ms |
| Near-miss flash | Land < 0.1s before sink | Platform flashes white once, 150ms | 150ms |
| Screen shake (death) | On player hitting water | Camera offset random ±12px x, ±8px y | 350ms |
| Red vignette flash (death) | Simultaneous with shake | Full-screen red rect, opacity 0.6, fade | 400ms |
| Water danger tint | Water < 60px below player | HUD bar pulses red, 1Hz | Until safe |
| Combo text pop | Combo > 2 | "+COMBO ×N" text, gold, scale punch | 800ms total |
| Stage clear burst | Stage complete | 20 gold star particles, radial | 600ms |
| Boss surge flash | Boss stage water surge | Full-screen orange flash, 0.3s | 300ms |

---

## 5. Audio Design

### 5.1 Sound Effects

All audio generated via Web Audio API's oscillator and buffer synthesis (no asset files required).

| Event | Sound Description | Duration | Priority | Synthesis |
|-------|------------------|----------|----------|-----------|
| Jump (short) | Short pluck: sine wave 440→880Hz sweep | 120ms | High | OscillatorNode sweep |
| Jump (hold) | Deeper pluck: 280→620Hz with slight reverb | 180ms | High | OscillatorNode + delay |
| Land | Soft thud: white noise burst + low 120Hz thump | 80ms | High | BufferSource noise |
| Platform sink | Creaking groan: 200Hz sine, vibrato, fade | 400ms | Medium | OscillatorNode + FM |
| Near-miss | High ping: 1200Hz sine, sharp decay | 60ms | High | OscillatorNode |
| Combo +1 | Rising chime: current pitch + 100Hz step | 100ms | Medium | Pitch table |
| Stage clear | Ascending fanfare: 3-note chord (C E G) | 600ms | High | 3× OscillatorNodes |
| Death (water) | Splash + descending glide: 600→80Hz | 700ms | High | Noise + sweep |
| Boss surge | Deep rumble: 60Hz sine, 0.8s, rising | 800ms | Medium | OscillatorNode |
| UI tap | Subtle click: 1000Hz, 30ms, sharp decay | 30ms | Low | OscillatorNode |
| Water ambient | Continuous: pink noise, low volume (0.1) | Loop | Low | BufferSource loop |

### 5.2 Music Concept

**Background Music**: Procedural drum-free ambient beat. Four sine oscillators at C3, G3, E4, B4, each with independent LFO panning (0.1Hz) and amplitude envelope cycling every 4 bars. Creates a constant "underwater pulse" feel without distracting from gameplay.

**Music State Machine**:
| Game State | Music Behavior |
|-----------|---------------|
| Menu | Calm ocean ambient, major key, 0.15 master volume |
| Stage 1–8 | Upbeat pulse tempo 90bpm, add high-frequency arpeggios |
| Stage 9–25 | Add driving bassline 120bpm, increase LFO rates |
| Stage 26+ | Intense: all voices at full, tempo 140bpm equivalent pulses |
| Boss Stage | Add minor-key overtone, reduce bass volume, increase tension |
| Game Over | Immediate volume duck to 0 over 600ms, then silence |
| Pause | Volume reduce to 0.05 over 200ms |

**Audio Implementation**: Web Audio API directly (no Howler.js needed for synthesis). `AudioContext` created on first user tap to comply with autoplay policy.

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  Title   │────→│   Menu   │────→│  Game Scene  │
│  Screen  │     │  Screen  │     │  (gameplay)  │
│ 1.5s    │     │          │     │              │
└──────────┘     └──────────┘     └──────┬───────┘
                      │                  │
                      │           ┌──────┴───────┐
                      │           │    Pause     │
                      │           │   Overlay    │
                      │           └──────┬───────┘
                      │                  │ Resume/Restart/Menu
                      │           ┌──────┴───────┐
                 ┌────┴────┐     │   Game Over  │
                 │Settings │     │   Screen     │
                 │Overlay  │     │ (<2s appear) │
                 └─────────┘     └──────┬───────┘
                                        │
                                 [Play Again → Game Scene]
                                 [Menu → Menu Screen]
```

### 6.2 HUD Layout (360px wide, portrait)

```
┌─────────────────────────────────────┐  y=0
│ [SCORE: 12450]  [STAGE 7]  [⚡10s] │  ← 50px HUD bar, rgba(0,0,0,0.6) bg
├─────────────────────────────────────┤  y=50
│                                     │
│      ~~~ PARALLAX CLOUDS ~~~        │
│                                     │
│   [PLAYER]  ←→ auto-runs right      │
│                                     │
│   [=====PLATFORM=====]              │
│                                     │
│     [=PLAT=]      [==PLAT==]        │
│                                     │
│   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~│  ← Water surface (animated)
│  ≋≋≋≋≋≋≋≋ WATER BODY ≋≋≋≋≋≋≋≋≋≋≋≋ │  ← Rising
└─────────────────────────────────────┘  y=700 (game height)
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left, x=10, y=10 | "SCORE: NNNNN" white bold 14px | Every +10 pts event |
| Stage | Top-center, x=180, y=10 | "STAGE N" white bold 14px | On stage transition |
| Inactivity timer | Top-right, x=350, y=10 | "⚡Ns" yellow, flashes red when <4s | Every second (only visible <7s idle) |
| Combo text | Center screen, y=120 | "×N COMBO!" gold, large 28px, fades | On combo event, 1000ms TTL |
| Floating score | Above player | "+NN" white, floats up 50px, fades | On every score event |
| Water warning | Bottom of game area | "WATER RISING!" text pulse in red | When water < 100px below player |

### 6.3 Screen Specifications

**Title Screen** (1500ms display):
- Background: game colors, water animation running
- Text: "TIDAL RUSH" center, 48px bold white, letter-spacing 6px
- Sub-text: "TAP TO PLAY" 18px white, pulsing opacity (0.5→1.0, 0.8Hz)
- Auto-advance to Menu after 1500ms OR on tap

**Main Menu** (360×700px):
- Background: animated game scene at 30% opacity (running idle demo)
- Title text: "TIDAL RUSH" top-center, y=120, 40px bold white
- PLAY button: center, x=80, y=300, width=200, height=56, `#F4A261` fill, white text "PLAY" 22px bold, border-radius 28px
- Best Score: below play button, y=380, "BEST: NNNNN" white 16px
- Sound toggle: bottom-right, 44×44px speaker icon

**Game Over Screen** (overlay, appears <500ms after death):
- Dark overlay: `rgba(0,0,20,0.85)` full screen, 300ms fade-in
- "GAME OVER" text: center, y=200, 36px bold white
- Score: y=260, "SCORE: NNNNN" 28px gold, animated count-up over 800ms
- Stage reached: y=310, "STAGE N" 18px white
- New High Score: y=350, "NEW BEST!" 20px gold, only if new record, scale-pulse animation
- PLAY AGAIN button: y=430, 200×52px `#F4A261`, "PLAY AGAIN" 18px bold
- MENU button: y=500, 140×44px `rgba(255,255,255,0.2)`, "MENU" 16px white

**Pause Overlay**:
- Semi-transparent `rgba(0,0,20,0.75)` overlay
- "PAUSED" text center y=220 28px white
- RESUME button: y=300, `#2EC4B6`
- RESTART button: y=370, `#F4A261`
- MENU button: y=440, transparent/white

---

## 7. Monetization

### 7.1 Ad Placements (POC: No Ads)

This is a POC build. All ad placements are defined as hooks but do not display real ads.

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial (disabled) | After game over | Every 3rd | After 5s |
| Rewarded (disabled) | Continue after death | On demand | Always |
| Banner (disabled) | Menu screen | Always | N/A |

### 7.2 Reward System (Placeholder)

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Life (future) | Watch rewarded ad | 1 resume from death | Once per game |
| Score Boost (future) | Watch rewarded ad | 1.5× final score | Once per session |

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/tidal-rush/
├── index.html              # Entry point, CDN imports
├── css/
│   └── style.css           # Mobile-first responsive, portrait lock
└── js/
    ├── config.js           # Constants: dimensions, difficulty tables, colors, score values
    ├── main.js             # Phaser.Game init, scene registration, local storage
    ├── game.js             # GameScene: create/update, player, platforms, water, input
    ├── stages.js           # Stage generation, difficulty params, platform type logic
    ├── ui.js               # MenuScene, GameOverScene, HUD, PauseOverlay, TitleScene
    └── ads.js              # Ad hooks (all stubs for POC)
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
```javascript
// Key exports:
const CONFIG = {
  WIDTH: 360,
  HEIGHT: 700,
  GRAVITY: 980,
  PLAYER_RUN_SPEED: { /* by stage range */ },
  WATER_RISE_RATE: { /* by stage range */ },
  SINK_SPEED_MS: { /* by stage range */ },
  PLATFORM_WIDTH_RANGE: { /* by stage range */ },
  GAP_WIDTH_RANGE: { /* by stage range */ },
  MOVING_PLATFORM_CHANCE: { /* by stage range */ },
  CRUMBLE_PLATFORM_CHANCE: { /* by stage range */ },
  COLORS: { /* all hex values */ },
  SCORE: { PLATFORM_LAND: 10, STAGE_CLEAR: 100, NEAR_MISS: 25, PERFECT_LAND: 15 },
  INACTIVITY_DEATH_SECONDS: 10
};
```

**main.js** (max 300 lines):
- `new Phaser.Game(config)` with scenes: TitleScene, MenuScene, GameScene, GameOverScene
- `scaleManager` with FIT mode, portrait orientation
- `localStorage` read/write: high score, settings, games played
- Global `GameState` object shared across scenes via `game.registry`

**game.js** (max 300 lines):
- `GameScene extends Phaser.Scene`
- `create()`: create player sprite (SVG graphics object), initialize water body (rectangle + wave path), spawn first 8 platforms ahead, set up pointer input, configure Phaser Arcade physics
- `update(delta)`: move player rightward at run speed, check platform collisions, check water collision, advance water level, trigger inactivity timer, update wave animation
- Platform pool: reuse platform objects via object pool (max 15 active at once)
- Inactivity: track `lastTapTime`; if `Date.now() - lastTapTime > 10000` → die

**stages.js** (max 300 lines):
- `generateStage(stageNumber)`: returns array of platform descriptors `{x, y, width, type, sinkDelay, moveSpeed, moveRange}`
- `getDifficultyParams(stageNumber)`: returns difficulty object from config tables
- `validateSolvability(platforms)`: check all gaps ≤ max jump distance at that stage's run speed
- `isBossStage(n)`: `n % 15 === 0`
- `isRestStage(n)`: `n % 10 === 0 && !isBossStage(n)`
- Platform types: `'normal'`, `'moving'`, `'crumble'`, `'bouncy'`

**ui.js** (max 300 lines):
- `TitleScene`: 1500ms splash, tap-to-skip
- `MenuScene`: main menu with best score display
- `GameOverScene`: score display, count-up animation, play again / menu buttons
- `HUDManager` class: creates Phaser text/graphics objects overlaid on GameScene; update methods called from game.js
- `PauseOverlay`: toggle show/hide, bind Escape key and pause button

**ads.js** (max 300 lines):
- All methods are no-ops for POC
- `AdManager.showInterstitial(callback)`: calls `callback()` immediately (POC)
- `AdManager.showRewarded(rewardCallback, skipCallback)`: calls `skipCallback()` immediately (POC)
- Structure ready for real ad network insertion

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | 3.60.0 | `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js` | Game engine |

No Howler.js — audio via Web Audio API directly.

### 8.4 Physics Setup

Using Phaser Arcade Physics (not Matter.js — simpler, no crash risk for auto-runner):
- World gravity: `{ y: 980 }`
- Player: dynamic body, 24×32px
- Platforms: static bodies (or kinematic for moving platforms via manual velocity)
- Water: not a physics body — rectangle checked via `player.y + player.height >= waterY`
- Collision groups: player vs platforms (Arcade collider), player vs water (manual overlap check)
- **No Matter.js** — avoids the `_findSupports` crash bug documented in memory

### 8.5 Platform Object Pool

```javascript
// Pool design: pre-create 15 platform graphics objects at scene create
// Activate/deactivate as platforms enter/leave view
class PlatformPool {
  constructor(scene, size = 15) { /* create pool */ }
  spawn(x, y, width, type) { /* get inactive, configure, activate */ }
  recycle(platform) { /* deactivate, return to pool */ }
}
// Recycle platforms that scroll > 60px off left edge of screen
```

---

## 9. Juice Specification

**MANDATORY — Every effect listed here must be implemented. Plan judges will FAIL any build missing these.**

### 9.1 Player Jump Input Feedback (every tap)

| Effect | Target | Values |
|--------|--------|--------|
| Squash | Player sprite | Scale: X=1.3/Y=0.6 at tap frame, recover to 1/1 over 80ms |
| Stretch | Player sprite | On leaving platform: X=0.8/Y=1.2, recover over 60ms |
| Jump sound | Audio | Sine sweep 440→880Hz (short) or 280→620Hz (hold), 120–180ms |
| Dust particles | Under feet | 6 white circles r=2–4, velocity ±40px/s x, −80px/s y, fade 300ms |
| Input haptic | Device | `navigator.vibrate(20)` — 20ms short pulse |

### 9.2 Landing Feedback

| Effect | Target | Values |
|--------|--------|--------|
| Land stretch | Player sprite | Scale: X=1.4/Y=0.7, recover to 1/1 over 100ms |
| Land sound | Audio | White noise burst + 120Hz thump, 80ms |
| Platform flash | Landed platform | Flash white (opacity 0.8) then back, 100ms |
| Platform particles | 4 debris rects | Size 3×6px, `#C07A1A`, velocity ±60px/s x, +100px/s y, 400ms fade |
| Score float | Above player | "+10" white text, float up 50px over 600ms, fade last 200ms |

### 9.3 Near-Miss Landing (< 0.1s before full sink)

| Effect | Values |
|--------|--------|
| Near-miss sound | High ping: 1200Hz, 60ms, very sharp decay |
| Platform white flash | Full platform white, 150ms, then normal |
| Score float | "+25 CLOSE!" in gold, scale punch 1.4× on appear, float 60px, 800ms |
| Screen micro-shake | ±3px x-only, 150ms, 2 oscillations |
| Haptic | `navigator.vibrate(40)` — 40ms pulse |

### 9.4 Combo System Feedback (consecutive perfect landings)

| Combo Level | Audio Pitch | Visual Text Size | Particle Count |
|-------------|-------------|-----------------|----------------|
| ×2 | +100Hz from base | 22px | 8 |
| ×3 | +200Hz | 26px | 12 |
| ×4 | +300Hz | 30px | 16 |
| ×5+ | +400Hz (capped) | 34px | 20 |
| Reset | Low tick sound | fade out 300ms | 4 gray particles |

Combo text position: center-screen, y=140. Each new combo value animates: scale punch 1.5× recover over 150ms.

### 9.5 Death Effects

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: ±12px x, ±8px y, Duration: 350ms, 4 oscillations |
| Red vignette | Full-screen `#E63946` rect, opacity 0.6, fade to 0 over 400ms |
| Player sink | Player tween: y +80px, opacity 0→0 over 500ms after death |
| Death sound | Noise burst (80ms) + 600→80Hz sine sweep (500ms) simultaneously |
| Slow time effect | `this.physics.world.timeScale = 0.3` for 300ms, then 0 (freeze) |
| Time freeze to UI | 300ms slow + 200ms hold → game over overlay begins 500ms after death |
| Death → Overlay | Game over overlay visible by 500ms. Fully interactive by 1000ms. **Total <2s.** |

### 9.6 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating score text | "+NN" white 16px bold, spawns at player position, floats up 50px over 600ms, fade last 200ms |
| Score HUD punch | Score text scale 1.3×, recover over 150ms, on every score event |
| Stage clear burst | 20 gold star particles (`★` chars), radial velocity 120–200px/s, 600ms fade |
| Stage clear sound | C4+E4+G4 sine chord, 600ms, gentle envelope |

### 9.7 Water Danger Feedback

| Water Distance | Feedback |
|----------------|----------|
| < 200px below player | Water ambient volume +50% |
| < 100px below player | "WATER RISING!" HUD text pulse 1Hz, red |
| < 50px below player | Camera shake micro ±2px continuous |
| < 20px below player | Screen red tint pulse 0.5 opacity, 2Hz |
| Boss surge start | Full orange flash + "SURGE!" center text, 500ms |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Frame Rate | 60fps stable | Phaser FPS display in dev mode |
| Load Time | <2 seconds (no assets) | Browser network tab |
| Memory Usage | <80MB | Chrome DevTools Memory |
| JS Bundle Size | <300KB total | File size, all 6 JS files |
| Death → Restart | <2 seconds | Measured via gameplay test |
| First Interaction | <500ms after load | No loading screen needed |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch**: Phaser pointer events; `event.preventDefault()` on all touch start/end
- **Orientation**: CSS `@media (orientation: landscape)` shows "rotate your phone" overlay
- **Safe Areas**: Padding `env(safe-area-inset-top)` for HUD on notched devices
- **Background throttle**: `document.addEventListener('visibilitychange', ...)` → `game.pause()` / `game.resume()`
- **No external assets**: All graphics SVG-generated in code → zero network requests after HTML loads

### 10.3 Phaser Scene Boot Sequence

```
Boot order:
1. TitleScene (preload: create Web Audio context on first interaction)
2. MenuScene
3. GameScene (create: build platform pool, initialize water, register input)
4. GameOverScene
```

### 10.4 Critical Bug Avoidance

- **Do NOT use Matter.js** — use Phaser Arcade Physics only (avoids `_findSupports` crash from memory)
- **Do NOT destroy physics bodies mid-frame** — use object pool with deactivate/activate pattern
- **Web Audio API**: Create `AudioContext` lazily on first user gesture — never auto-create (Safari blocks)
- **Platform scrolling**: Move the camera (Phaser `camera.scrollX`) not the world — prevents float precision drift on long runs
- **Inactivity timer**: Reset on `pointerdown` event, not on `pointerup` — prevents held-tap exploit

### 10.5 Local Storage Schema

```json
{
  "tidal-rush_high_score": 0,
  "tidal-rush_games_played": 0,
  "tidal-rush_highest_stage": 0,
  "tidal-rush_settings": {
    "sound": true,
    "music": true,
    "vibration": true
  },
  "tidal-rush_total_score": 0
}
```

### 10.6 Inactivity Death Implementation

```javascript
// In GameScene.create():
this.lastInputTime = this.time.now;
this.input.on('pointerdown', () => { this.lastInputTime = this.time.now; });

// In GameScene.update():
const idleSeconds = (this.time.now - this.lastInputTime) / 1000;
if (idleSeconds >= 10) {
  this.triggerDeath('inactivity');
}
// Show idle warning when idleSeconds >= 7:
if (idleSeconds >= 7) {
  this.hud.showInactivityWarning(10 - idleSeconds);
}
```

### 10.7 Water Rise Implementation

```javascript
// Water starts at y=650 (50px below screen bottom)
// Rises toward y=50 (just below HUD)
// waterY tracked in GameScene state

// In update():
const difficulty = getDifficultyParams(this.currentStage);
this.waterY -= difficulty.waterRiseRate * (delta / 1000);
this.waterSurface.setY(this.waterY);

// Death check:
if (this.player.y + this.player.height >= this.waterY) {
  this.triggerDeath('water');
}
```

### 10.8 Auto-Runner Player Movement

```javascript
// Player never jumps without input — gravity pulls naturally
// Player always moves right at runSpeed
// Platform collision handled by Arcade Physics overlap

// In update():
this.player.body.setVelocityX(difficulty.runSpeed);

// Jump on input:
this.input.on('pointerdown', () => {
  this.jumpStartTime = this.time.now;
  this.isHolding = true;
});
this.input.on('pointerup', () => {
  const holdMs = this.time.now - this.jumpStartTime;
  const jumpPower = holdMs > 200 ? MAX_JUMP : SHORT_JUMP;  // −800 or −560 velocity
  if (this.player.body.touching.down) {
    this.player.body.setVelocityY(jumpPower);
  }
  this.isHolding = false;
});
```
