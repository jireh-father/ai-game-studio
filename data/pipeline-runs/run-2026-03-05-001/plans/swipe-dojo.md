# Game Design Document: Swipe Dojo

**Slug**: `swipe-dojo`
**One-Liner**: Swipe in exact directions to block and counter enemy attacks in split-second rhythmic combat.
**Core Mechanic**: Directional swipe rhythm combat — swipe matching directions to block/counter attacks
**Target Session Length**: 3–6 minutes
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Swipe Dojo is a split-second reflex game where the player faces a continuous stream of directional attacks. Each attack telegraphs a direction (up, down, left, right) with a brief, bright arrow indicator on the enemy's body. The player must swipe that exact direction to block and counter — land it perfectly and the enemy recoils with a satisfying hit-stop flash; miss or swipe the wrong way and the player takes a hit.

The game is not about memorizing patterns. It is about reading the immediate signal and reacting with muscle memory. Attacks come faster and with shorter telegraph windows as stages progress. By stage 10 the player is sweeping their thumb in rapid-fire directional bursts; by stage 30 they feel like an actual martial arts master.

What sets it apart from generic rhythm games is the *opponent* model: enemies have personality, health bars, and escalating attack sequences. Killing an enemy with a perfect counter chain triggers a short "finish" animation. This makes every bout feel like a real fight, not a button-press drill.

### 1.2 Target Audience

Casual-to-mid-core mobile gamers aged 14–35. Ideal for commute or waiting-room sessions of 2–8 minutes. Players who enjoyed Fruit Ninja, Timberman, or Guitar Hero will find the input style immediately legible. No prior rhythm game experience required — the first 5 stages are a soft tutorial.

### 1.3 Core Fantasy

The player is a dojo master, reading opponents' telegraphed strikes and deflecting them with perfect precision. Every successful counter chain builds a feeling of untouchable flow. The fantasy is *perfect reaction* — not luck, not random button mashing, but pure trained reflex made manifest by the thumb.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 4 minutes |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 22%+ |
| Average Stages per Session | 8–12 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Stage Start] → [Enemy Telegraphs Attack Direction] → [Player Swipes Direction]
      ↑                                                         │
      │              ┌────── MISS / WRONG ──────────────────────┤
      │              │                                          │
      │              ▼                                          ▼
      │       [Player takes hit]                        [Perfect Block +
      │       [Screen flash red]                         Counter hit on enemy]
      │              │                                          │
      │     [Lives > 0? Continue]                   [Enemy HP reaches 0?]
      │                                                         │
      │                                              ┌──── YES ─┴─── NO ──┐
      │                                              ▼                     ▼
      │                                       [Stage Clear]        [Next attack wave]
      │                                              │
      └──────────────────────────────────────────────┘
                                                     │
                                              [Lives = 0]
                                                     │
                                            [Game Over Screen]
```

The core moment-to-moment loop is: **see arrow → swipe direction → impact**. Each full enemy fight is one "stage". Stages escalate attack speed, sequence complexity, and enemy variety.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Block/Counter | Swipe in indicated direction | Primary action — match enemy's arrow to block and deal damage |
| None / Idle penalty | No swipe within window | Inactivity for 15 seconds triggers death (at menu: instant) |

**Control Philosophy**: Single gesture type, four directions only. The simplicity is the point — the challenge comes from reading correctly and reacting quickly, not from learning a complex input vocabulary. Swipe detection uses start→end delta; minimum swipe distance is 30px to avoid accidental triggers.

**Touch Area Map**:
```
┌─────────────────────┐
│   Stage / Score HUD │  ← Top bar 60px
├─────────────────────┤
│                     │
│   Enemy + Arrows    │  ← Top 40% of play area
│                     │
│  ─────────────────  │
│                     │
│   Player Avatar     │  ← Bottom 40% of play area
│                     │
├─────────────────────┤
│  Entire screen is   │  ← Full-screen swipe zone
│  the swipe zone     │     (no fixed button zones)
└─────────────────────┘
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Perfect Block (swipe within first 40% of window) | 100 | × combo multiplier |
| Good Block (swipe within 40–80% of window) | 60 | × combo multiplier |
| Late Block (swipe within 80–100% of window) | 30 | No multiplier bonus |
| Enemy Defeated (full HP drained) | 200 | + 50 per current combo |
| Stage Clear (all enemies in stage beaten) | 500 | + 100 per current combo |
| Perfect Stage Clear (no hits taken) | 1000 | Flat bonus |

**Combo System**: Consecutive Perfect or Good blocks increment the combo counter. A miss or Late block resets the combo to 0. Combo multiplier = 1 + (combo × 0.1), capped at 4.0× at combo 30.

**High Score**: Stored in localStorage as `swipe-dojo_high_score`. Displayed on Game Over screen with animated "NEW RECORD" flash if beaten.

### 2.4 Progression System

Enemies gain more HP, faster attack speed, and introduce multi-direction sequences as stages increase.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1–5 | Single attack direction, long telegraph (800ms window) | Tutorial — learn controls |
| 6–10 | Two-attack sequences, telegraph 600ms | Easy — build muscle memory |
| 11–20 | Three-attack sequences, fake-out pauses (enemy hesitates) | Medium — read rhythm |
| 21–30 | Four-attack sequences, telegraph 400ms | Hard — react under pressure |
| 31–50 | Random sequence length 2–5, telegraph 300ms | Expert — pure reflex |
| 51+ | Sequence length 3–6, telegraph 220ms minimum | Endless endurance |

### 2.5 Lives and Failure

Player starts with 3 lives represented as dojo shields.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Wrong direction swipe | Lose 1 life, enemy counter-attacks visual | None (for POC) |
| Miss (no swipe before window closes) | Lose 1 life | None (for POC) |
| 15 seconds inactivity in gameplay | Immediate death, all lives lost | None |
| All 3 lives lost | Game over | Retry from stage 1 |

Death → Game Over screen in under 2 seconds.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each stage is a single enemy fight. Enemy parameters (HP, attack sequence length, attack speed, direction distribution) are computed from stage number. No pre-authored stages — fully procedural.

**Generation Algorithm**:
```
Stage Generation Parameters:
- enemyHP: 3 + floor(stage / 5)                  // 3 at stage 1, grows slowly
- attackWindowMs: max(220, 800 - stage * 10)      // shrinks per stage, floor 220ms
- sequenceLength: clamp(1 + floor(stage / 6), 1, 6)
- fakeoutChance: min(0 + (stage - 10) * 0.02, 0.25)  // starts at stage 11, max 25%
- directionBias: uniform at early stages, weighted toward "weaknesses" at late
- enemyVariant: stage % 5 determines visual skin (0=Basic, 1=Fast, 2=Tank, 3=Tricky, 4=Boss)
```

### 3.2 Difficulty Curve

```
Attack Window (ms)
    │
800 │╲
    │  ╲
600 │    ╲
    │      ╲
400 │        ╲───
    │             ╲───
300 │                  ╲──────────
220 │                             ──────────── (floor)
    │
    └────────────────────────────────────── Stage
    0    10    20    30    40    50    60    70+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1–5 | Stage 6–15 | Stage 16–30 | Stage 31–50 | Stage 51+ |
|-----------|-----------|------------|-------------|-------------|-----------|
| Attack Window | 800ms | 600ms | 450ms | 320ms | 220ms |
| Sequence Length | 1 | 2 | 3 | 4–5 | 5–6 |
| Enemy HP | 3 | 4–5 | 5–7 | 6–8 | 7–10 |
| Fakeout Chance | 0% | 0% | 5–15% | 15–25% | 25% |
| New Mechanic | None | 2-sequence | Fakeout pause | Long combos | Mixed all |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every generated sequence is solvable — directions are drawn from the set {UP, DOWN, LEFT, RIGHT}; no impossible inputs.
2. **Variety Threshold**: Consecutive stages will not have identical direction sequences. At minimum the sequence length or at least 1 direction must differ.
3. **Difficulty Monotonicity**: Attack window never increases between consecutive stages. Sequence length never decreases after stage 5.
4. **Rest Stages**: Every 10 stages, enemy HP is reduced by 2 and window is extended by 100ms for one stage only (no announcement — feels like a small natural breath).
5. **Boss Stages**: Every 5 stages (stage 5, 10, 15...) the enemy variant is "Boss" skin with +2 HP and 10% shorter window. Victory triggers a brief stage-clear celebration (see Juice spec).

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Bold flat geometric shapes. Hard ink outlines (3px stroke) on all characters. No gradients except directional arrow glow. Think aggressive mobile fighting game crossed with minimal icon design.

**Aesthetic Keywords**: Bold, Fast, Punchy, Martial, Neon-accented

**Reference Palette Mood**: Dark dojo background (near-black deep blue), vivid neon accent colors for attack arrows, white/cream player character, red enemy outlines.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Deep Dojo Blue | #0D0F1A | Game background, stage backdrop |
| Player | Cream White | #F0EDE0 | Player avatar fill |
| Player Outline | Warm Gold | #D4A017 | Player character outline, headband |
| Enemy Base | Crimson Red | #C0392B | Enemy fill color |
| Enemy Outline | Dark Red | #7B241C | Enemy border stroke |
| Arrow UP | Electric Cyan | #00F5FF | Directional arrow — up |
| Arrow DOWN | Hot Magenta | #FF00AA | Directional arrow — down |
| Arrow LEFT | Lime Green | #39FF14 | Directional arrow — left |
| Arrow RIGHT | Solar Orange | #FF6B00 | Directional arrow — right |
| Danger Flash | Pure Red | #FF0000 | Screen flash on hit taken |
| Success Flash | Pure White | #FFFFFF | Screen flash on perfect block |
| UI Text | Off White | #F5F5F5 | Score, labels |
| UI Background | Dark Overlay | #00000088 | Menu overlays, semi-transparent |
| Combo Glow | Gold | #FFD700 | Combo counter glow aura |
| HP Bar Full | Neon Green | #00FF88 | Enemy HP bar fill |
| HP Bar Low | Danger Red | #FF3030 | Enemy HP bar when ≤ 1 HP remaining |

### 4.3 SVG Specifications

All game graphics rendered as Phaser Graphics objects or inline SVG textures created at runtime.

**Player Character** (60×90px bounding box):
```svg
<!-- Simplified martial artist in fighting stance -->
<svg width="60" height="90" viewBox="0 0 60 90">
  <!-- Body -->
  <rect x="18" y="30" width="24" height="36" rx="4" fill="#F0EDE0" stroke="#D4A017" stroke-width="3"/>
  <!-- Head -->
  <circle cx="30" cy="20" r="14" fill="#F0EDE0" stroke="#D4A017" stroke-width="3"/>
  <!-- Headband -->
  <rect x="16" y="16" width="28" height="6" rx="2" fill="#D4A017"/>
  <!-- Left arm extended (fighting stance) -->
  <line x1="18" y1="42" x2="4" y2="36" stroke="#F0EDE0" stroke-width="6" stroke-linecap="round"/>
  <!-- Right arm guard -->
  <line x1="42" y1="42" x2="54" y2="48" stroke="#F0EDE0" stroke-width="6" stroke-linecap="round"/>
  <!-- Legs -->
  <line x1="24" y1="66" x2="18" y2="88" stroke="#F0EDE0" stroke-width="6" stroke-linecap="round"/>
  <line x1="36" y1="66" x2="42" y2="88" stroke="#F0EDE0" stroke-width="6" stroke-linecap="round"/>
</svg>
```

**Enemy Character** (60×80px bounding box, parametric fill based on variant):
```svg
<!-- Aggressive stance, triangle body for menace -->
<svg width="60" height="80" viewBox="0 0 60 80">
  <!-- Body (triangular for aggression) -->
  <polygon points="30,30 10,70 50,70" fill="#C0392B" stroke="#7B241C" stroke-width="3"/>
  <!-- Head (slightly oversized, intimidating) -->
  <circle cx="30" cy="18" r="16" fill="#C0392B" stroke="#7B241C" stroke-width="3"/>
  <!-- Eyes (glowing white slits) -->
  <rect x="20" y="14" width="8" height="4" rx="1" fill="#FFFFFF"/>
  <rect x="32" y="14" width="8" height="4" rx="1" fill="#FFFFFF"/>
  <!-- Arms (extended, ready to strike) -->
  <line x1="10" y1="50" x2="0" y2="38" stroke="#C0392B" stroke-width="7" stroke-linecap="round"/>
  <line x1="50" y1="50" x2="60" y2="38" stroke="#C0392B" stroke-width="7" stroke-linecap="round"/>
</svg>
```

**Directional Arrow Indicator** (80×80px, colored by direction):
```svg
<!-- Example: UP arrow — cyan, pulsing glow applied via CSS animation -->
<svg width="80" height="80" viewBox="0 0 80 80">
  <!-- Arrow shaft -->
  <rect x="34" y="30" width="12" height="32" fill="#00F5FF"/>
  <!-- Arrow head -->
  <polygon points="40,8 20,34 60,34" fill="#00F5FF"/>
  <!-- Glow ring (filter blur applied in Phaser) -->
  <circle cx="40" cy="40" r="36" fill="none" stroke="#00F5FF" stroke-width="3" opacity="0.4"/>
</svg>
```

**Enemy HP Bar** (200×12px):
```svg
<svg width="200" height="12" viewBox="0 0 200 12">
  <!-- Background track -->
  <rect width="200" height="12" rx="6" fill="#1A1A2E"/>
  <!-- Fill (width dynamic) -->
  <rect width="140" height="12" rx="6" fill="#00FF88"/>
  <!-- Border -->
  <rect width="200" height="12" rx="6" fill="none" stroke="#444466" stroke-width="1.5"/>
</svg>
```

**Design Constraints**:
- Max 6 path/polygon elements per character SVG
- Use rect, circle, line, polygon exclusively — no complex paths
- All Phaser Graphics drawn with `lineStyle` + `fillStyle` calls; no external SVG files loaded
- Arrow indicator uses Phaser tweens for scale pulse (not SVG animate)

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Arrow pulse scale | Arrow appears | Phaser tween: 0.6 → 1.0 scale over 150ms ease-out |
| Arrow shake | Window closing (<20% time left) | Phaser tween: x ±4px rapid oscillation, 80ms period |
| Hit flash white | Perfect block | Phaser camera flash: #FFFFFF, 80ms, alpha 0.6 |
| Hit flash red | Player takes damage | Phaser camera flash: #FF0000, 150ms, alpha 0.5 |
| Hit-stop freeze | Any block (perfect/good) | Game speed = 0 for 40ms, then resume |
| Screen shake | Player takes damage | camera.shake(200, 0.006) |
| Death shake | All lives lost | camera.shake(400, 0.015) |
| Counter particles | Perfect block | 20 small rects, enemy-color, burst outward, 300ms fade |
| Combo glow | Combo ≥ 5 | Player avatar gold outline glow, scales with combo |
| Enemy death burst | Enemy HP = 0 | 30 circles, enemy-color, radial burst, 400ms |
| Stage clear pulse | Stage complete | Camera zoom 1.0 → 1.04 → 1.0 over 400ms |
| Floating score text | Any block | "+100" text floats up 60px, fades over 600ms |

---

## 5. Audio Design

### 5.1 Sound Effects

All sounds synthesized via Web Audio API (no external audio files). Implemented in `ads.js` as an `AudioSynth` utility (or inline in `game.js` if simpler).

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Perfect Block | Sharp high-pitch crack + deep resonant thud (martial clap) | 120ms | High |
| Good Block | Softer thud, less crack | 100ms | High |
| Late Block | Dull flat thud | 80ms | Medium |
| Wrong direction / miss | Low descending buzz, dissonant | 200ms | High |
| Enemy takes damage | Grunt-like mid-frequency impact | 150ms | Medium |
| Enemy defeated | Short ascending 3-note fanfare | 400ms | High |
| Stage clear | 4-note victory phrase | 600ms | High |
| Player loses life | Descending impact + lower register thud | 250ms | High |
| Game over | Low 2-note descend, reverb tail | 800ms | High |
| Combo milestone (×5, ×10, ×20) | Ascending chime sting, pitch rises per milestone | 200ms | Medium |
| Attack incoming (arrow appears) | Subtle swoosh, direction-coded pitch (UP=high, DOWN=low, LEFT/RIGHT=mid) | 80ms | Low |

### 5.2 Music Concept

**Background Music**: Procedural percussive rhythm loop using Web Audio API. Base BPM starts at 90, increases by 2 BPM every 5 stages, caps at 150 BPM at stage 30+. Built from kick, hi-hat, and bass synth layers. No melody — pure percussive drive to complement swipe rhythm.

**Music State Machine**:
| Game State | Music Behavior |
|-----------|---------------|
| Menu | Slow 70 BPM ambient loop, sparse percussion |
| Early Stages (1–10) | 90 BPM, kick + hi-hat pattern |
| Mid Stages (11–30) | 110–130 BPM, added bass hit layer |
| Late Stages (31+) | 140–150 BPM, dense percussion |
| Game Over | Music stops, single low gong fade |
| Pause | Music volume ducked to 20% |

**Audio Implementation**: Web Audio API directly (no Howler.js dependency — no external audio files needed). `AudioContext` created on first user interaction to comply with browser autoplay policy.

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Splash  │────→│   Menu   │────→│   Game   │
│  0.5s    │     │  Screen  │     │  Screen  │
└──────────┘     └──────────┘     └──────────┘
                      │                │
                      │           ┌────┴────┐
                      │           │  Pause  │
                      │           │ Overlay │
                      │           └────┬────┘
                      │                │ Resume
                      │                ▼
                 ┌────┴────┐     ┌────────────┐
                 │Settings │     │  Game Over │
                 │ Overlay │     │  Screen    │
                 └─────────┘     └────┬───────┘
                                      │
                                 [Play Again / Menu]
```

### 6.2 HUD Layout

```
┌─────────────────────────────────┐
│ ♥♥♥    STAGE 7    12,450  ⏸    │  ← Top bar 56px
├─────────────────────────────────┤
│                                 │
│    ┌─────────────────────┐      │
│    │   ENEMY NAME        │      │  ← Enemy name 24px below top bar
│    │ [████████░░░] HP    │      │  ← HP bar 200×12px centered
│    │                     │      │
│    │   [Enemy Avatar]    │      │  ← Enemy sprite 80×80px
│    │   [⬆ ARROW GLOW]   │      │  ← Direction arrow 80×80px, centered on enemy
│    └─────────────────────┘      │
│                                 │
│         [COMBO ×8]              │  ← Combo text, center, animated
│                                 │
│    ┌─────────────────────┐      │
│    │   [Player Avatar]   │      │  ← Player sprite 60×90px
│    └─────────────────────┘      │
│                                 │
└─────────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Lives | Top-left (8px margin) | 3 shield icons, filled/broken | On life change |
| Stage | Top-center | "STAGE N" text | On stage transition |
| Score | Top-right (before pause) | Numeric, animated punch on change | Every score event |
| Pause button | Top-right corner (44×44px) | ⏸ icon | Always |
| Combo counter | Center, below midline | "×N" large text with glow, fades if combo=0 | On every swipe event |
| Enemy HP bar | Upper play area, centered | Green/red fill bar with label | On every hit |

### 6.3 Menu Structure

**Main Menu**:
- "SWIPE DOJO" title (large, bold, centered)
- Animated idle dojo background (subtle particle drift)
- "TAP TO PLAY" button (large, full-width, pulsing)
- High Score display below button ("BEST: 12,450 | STAGE 7")
- Settings gear icon top-right (44×44px touch target)

**Pause Menu** (overlay, 88% black semi-transparent):
- "PAUSED" title
- Resume (primary button)
- Restart (secondary)
- Menu (tertiary, smaller)

**Game Over Screen**:
- "GAME OVER" (large, red, shakes in)
- Stage reached: "STAGE 12"
- Final score (large animated counter tally)
- "NEW RECORD" flash if high score beaten (gold animated)
- "PLAY AGAIN" primary button
- "MENU" secondary button

**Settings Screen** (overlay):
- Sound Effects: On/Off toggle
- Music: On/Off toggle
- Vibration: On/Off toggle

---

## 7. Monetization

### 7.1 Ad Placements (POC — placeholder only, no real ads)

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
games/swipe-dojo/
├── index.html              # Entry point
│   ├── CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
│   ├── Local CSS           # css/style.css
│   └── Local JS (ordered)  # config → main → game → stages → ui → ads
├── css/
│   └── style.css           # Portrait lock, safe areas, touch prevent defaults
└── js/
    ├── config.js           # Constants, palette, difficulty tables, score values
    ├── main.js             # Phaser init, scene registry, localStorage schema
    ├── game.js             # GameScene: enemy AI, swipe detection, combat loop
    ├── stages.js           # Stage generation, enemy parameters, sequence builder
    ├── ui.js               # MenuScene, GameOverScene, HUD, PauseOverlay
    └── ads.js              # Stub ad hooks, Web Audio synth utility
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `GAME_WIDTH = 360`, `GAME_HEIGHT = 640`
- `PALETTE` object with all hex values
- `DIFFICULTY` table: attackWindow, sequenceLength, enemyHP per stage range
- `SCORE` object: PERFECT_BLOCK=100, GOOD_BLOCK=60, LATE_BLOCK=30, ENEMY_DEFEAT=200, STAGE_CLEAR=500
- `SWIPE_MIN_DIST = 30` (px), `INACTIVITY_DEATH_MS = 15000`

**main.js** (max 300 lines):
- `new Phaser.Game({ type: AUTO, width: 360, height: 640, scene: [MenuScene, GameScene, GameOverScene] })`
- `GameState` object: `{ score, stage, lives, combo, highScore, settings }`
- localStorage read on init, write on game over
- Portrait orientation lock via CSS

**game.js** (max 300 lines):
- `GameScene extends Phaser.Scene`
- `create()`: draw player/enemy SVG graphics, register pointer events, start first stage
- `update(time, delta)`: inactivity timer check, arrow timeout check, animate combo glow
- `onSwipe(direction)`: compare to `expectedDirection`, resolve hit/miss, trigger juice
- `spawnArrow(direction)`: draw arrow indicator on enemy, start countdown timer
- `resolveBlock(quality)`: apply score, combo, hit-stop, particles, sound
- `takeDamage()`: decrement lives, flash red, camera shake, check game over

**stages.js** (max 300 lines):
- `generateStage(stageNum)`: returns `{ enemyHP, sequence: [{dir, windowMs}], variant, name }`
- `getAttackWindow(stageNum)`: `Math.max(220, 800 - stageNum * 10)`
- `getSequenceLength(stageNum)`: `Math.min(6, 1 + Math.floor(stageNum / 6))`
- `buildSequence(length, windowMs, fakeoutChance)`: array of direction+window objects
- `ENEMY_NAMES` array for flavor text (30 names cycling)
- `ENEMY_VARIANTS = ['basic','fast','tank','tricky','boss']`

**ui.js** (max 300 lines):
- `MenuScene`: title, play button, best score, settings gear
- `GameOverScene`: animated score tally, stage display, play again / menu buttons
- `HUD` class (used inside GameScene): score, stage, lives, combo display
- `PauseOverlay`: resume/restart/menu buttons, shown on pause
- `SettingsOverlay`: sound/music/vibration toggles

**ads.js** (max 300 lines):
- `AudioSynth` class: Web Audio API wrappers for all sound effects
  - `playBlock(quality)`, `playMiss()`, `playEnemyDeath()`, `playStageClear()`, `playDeath()`
  - Percussion music loop start/stop/setBPM
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
| Hit-stop | Game speed | speed = 0 for 40ms on Perfect/Good, 20ms on Late |
| Flash | Camera | Perfect: white flash 80ms alpha 0.6; Good: white flash 50ms alpha 0.3 |
| Particles | Enemy position | Count: 20, Color: direction-specific arrow color, Direction: radial burst, Lifespan: 300ms, Size: 4–8px rects |
| Scale punch | Enemy avatar | Scale 1.0 → 1.2 → 1.0, Recovery: 100ms ease-out-back |
| Sound | AudioSynth | Perfect: high crack+thud; Good: softer thud; Pitch: +8% per 5 combos |
| Floating text | Score text at block point | "+100/+60/+30", white/yellow/orange, floats up 60px, fade 600ms |

### 9.2 Combo Escalation Feedback

| Effect | Trigger | Values |
|--------|---------|--------|
| Combo text size | Combo ≥ 1 | Base 28px, +4px every 5 combos, max 52px |
| Combo glow | Combo ≥ 5 | Player outline glow, radius: 4 + combo*0.3 px, color #FFD700 |
| Particles | Combo milestone ×5/×10/×20 | Extra burst: 30 gold particles, lifespan 400ms |
| BPM nudge | Combo ≥ 10 | Music BPM +5 above base (resets on miss) |
| Camera zoom | Combo ≥ 20 | zoom 1.0 → 1.03, sustained until miss |

### 9.3 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Screen shake on damage | Intensity: 6px, Duration: 200ms, on each life lost |
| Screen shake on death | Intensity: 15px, Duration: 400ms |
| Red screen flash | Full camera flash #FF0000, alpha 0.5, 150ms on hit; alpha 0.8, 250ms on death |
| Player avatar red tint | 400ms red tint, pulses 2× |
| Music stop | Immediate cut on last life, single low gong sting |
| Effect → UI delay | 700ms after death animation before Game Over screen appears |
| Death → restart | Tap "Play Again" → game restarts in **≤1.5 seconds** |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating score text | "+N" at swipe location, color: Perfect=#FFD700, Good=#FFFFFF, Late=#AAAAAA; floats up 60px over 600ms, fade out last 200ms |
| Score HUD punch | Scale 1.0 → 1.35 → 1.0, Recovery: 150ms, color flash to gold then back |
| Combo text pulse | Scale 1.0 → 1.15 → 1.0 on each increment, 80ms |
| Stage clear celebration | All particles fire simultaneously: 30 gold + 20 white, camera zoom 1.0 → 1.05 → 1.0 over 500ms, stage complete sound |

### 9.5 Arrow Telegraph Juice

| Effect | Values |
|--------|--------|
| Arrow spawn scale | 0.4 → 1.0, ease-out, 150ms |
| Arrow glow pulse | Continuous alpha 0.4 → 0.9 → 0.4 loop, 400ms period |
| Arrow urgency shake | Activates at 20% window remaining; x ±4px oscillation, 60ms period |
| Arrow color lock | Each direction always same color — builds instant recognition |
| Sound cue | Directional pitch (UP=880Hz, DOWN=220Hz, LEFT=440Hz, RIGHT=660Hz) 80ms on arrow spawn |

---

## 10. Implementation Notes

### 10.1 Swipe Detection

Swipe is calculated from `pointerdown` to `pointerup` events on the Phaser input system.

```javascript
// In game.js create():
this.input.on('pointerdown', (ptr) => { swipeStart = { x: ptr.x, y: ptr.y }; });
this.input.on('pointerup', (ptr) => {
  const dx = ptr.x - swipeStart.x;
  const dy = ptr.y - swipeStart.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist < SWIPE_MIN_DIST) return; // ignore micro-swipes
  const absDx = Math.abs(dx), absDy = Math.abs(dy);
  const dir = absDx > absDy
    ? (dx > 0 ? 'RIGHT' : 'LEFT')
    : (dy > 0 ? 'DOWN' : 'UP');
  this.onSwipe(dir);
});
```

### 10.2 Hit-Stop Implementation

```javascript
// In game.js resolveBlock():
this.physics.pause(); // or set timeScale = 0
this.time.delayedCall(40, () => { this.physics.resume(); }); // or timeScale = 1
```

No Matter.js used — this game uses Phaser Arcade physics (or no physics at all, since movement is scripted).

### 10.3 Web Audio Percussion Loop

```javascript
// In ads.js AudioSynth:
scheduleBeat(time, type) {
  const osc = this.ctx.createOscillator();
  const env = this.ctx.createGain();
  osc.connect(env); env.connect(this.ctx.destination);
  if (type === 'kick') {
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);
    env.gain.setValueAtTime(1, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
  }
  // similar for hihat, bass
  osc.start(time); osc.stop(time + 0.3);
}
```

### 10.4 Performance Targets

| Metric | Target | Method |
|--------|--------|--------|
| Frame Rate | 60fps stable | Phaser `game.loop.actualFps` check in debug |
| Load Time | <2s on 4G | No external assets except Phaser CDN |
| Memory | <80MB | Chrome DevTools memory snapshot |
| JS total | <400KB (excl. CDN) | File size sum |
| First interaction | <1s after load | window onload timing |

### 10.5 Mobile Optimization

- `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- `document.addEventListener('touchmove', e => e.preventDefault(), { passive: false })` — prevents pull-to-refresh
- Portrait CSS lock: `@media (orientation: landscape) { body { transform: rotate(-90deg); } }`
- Background tab: `document.addEventListener('visibilitychange', () => { if hidden → scene.scene.pause() })`
- `AudioContext` created only on first `pointerdown` to satisfy autoplay policy

### 10.6 Local Storage Schema

```json
{
  "swipe-dojo_high_score": 0,
  "swipe-dojo_games_played": 0,
  "swipe-dojo_highest_stage": 0,
  "swipe-dojo_settings": {
    "sound": true,
    "music": true,
    "vibration": true
  },
  "swipe-dojo_total_score": 0
}
```

### 10.7 Known Risk Areas

1. **Swipe vs. scroll conflict**: Prevent default on touchmove to stop page scroll interfering with gameplay — implemented in `css/style.css` and JS.
2. **AudioContext autoplay**: Must be created in response to a user gesture. Initialize in `pointerdown` handler on menu screen.
3. **Arrow direction recognition speed**: Swipe delta calculation must run synchronously in `pointerup` — no async operations.
4. **Inactivity death at 15s**: Use a Phaser timer reset on every valid `pointerdown`. Death triggered by Phaser `delayedCall` — clear previous call on each input.
5. **Hit-stop + Phaser scene**: `scene.physics.pause()` pauses all physics bodies. Since this game has minimal physics, this is safe. Alternatively use `scene.time.timeScale = 0` with `scene.tweens.timeScale = 0` to freeze tweens too, restore after 40ms.
