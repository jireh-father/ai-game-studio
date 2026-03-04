# Game Design Document: Wrecking Swing

**Slug**: `wrecking-swing`
**One-Liner**: Tap to release a wrecking ball at the perfect moment to demolish the tower.
**Core Mechanic**: One-tap pendulum release for physics destruction of block towers
**Target Session Length**: 4–7 minutes
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Wrecking Swing is a one-tap physics destruction game. A steel wrecking ball swings back and forth on a crane arm suspended at the top of the screen. Below it, a tower of colored blocks is stacked on a platform. The player taps at the precise moment to release the wrecking ball, sending it crashing into the tower. The goal is to obliterate as many blocks as possible in a single swing, with bonus scores for chain reactions, full clears, and precision timing.

The core satisfaction loop is pure and primal: wait, aim, release, SMASH. Every successful hit detonates into a cascade of flying debris and screen shake that feels viscerally rewarding. The tower design escalates from simple stacks to interlocking structures and protected cores, keeping the timing challenge fresh while the destruction physics remain the star.

There are no lives — the player simply earns points based on destruction efficiency per swing. Each round gives the player 3 swings. If the tower is cleared with fewer swings, bonus points are awarded. Leftover blocks at the end are penalized. This creates session-level tension without frustrating failure gates.

### 1.2 Target Audience

Casual mobile gamers aged 13–45 who enjoy satisfying physics moments, destruction simulations, and one-touch timing games. Ideal for short bursts during commutes, waiting rooms, or couch downtime. No prior gaming skill required — the core action is a single tap — but mastery requires reading tower structure and predicting swing timing.

### 1.3 Core Fantasy

The player is a demolition master. They control a heavy wrecking ball with precise timing — the satisfaction of watching a perfectly-aimed swing collapse an entire tower in one hit is the core emotional payoff. Power and precision in equal measure.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 4–7 minutes |
| Day 1 Retention | 42%+ |
| Day 7 Retention | 22%+ |
| Average Rounds per Session | 6–10 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Stage Start] → [Tower Spawns] → [Ball Swings] → [Player Taps] → [Ball Flies] → [Blocks Destroyed]
      ↑                                                                                    │
      │                                                              ┌─────────────────────┘
      │                                              [Score Tallied → Swing 2/3 or Stage Clear]
      │                                                                        │
      └──────────────── [Retry / Next Stage] ←──────── [Stage Complete / All Swings Used]
```

The player has **3 swings per stage**. After each swing, remaining blocks fall/settle and a new ball is readied. After all 3 swings, if the tower is not fully cleared, partial points are given. If fully cleared, a "Perfect Clear" bonus multiplier is applied. The stage ends and the next stage loads immediately.

**Inactivity death**: If the player does not tap within 20 seconds of a ball being ready to swing, the ball auto-releases at a random (usually poor) angle and the idle penalty triggers. This prevents frozen games.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Release Ball | Single Tap (anywhere) | Releases the wrecking ball at the current pendulum angle |
| (No other inputs during gameplay) | — | The entire game is one-tap |

**Control Philosophy**: Absolute minimum friction. One finger, one action. The depth comes from timing judgement, not input complexity. The "wait and tap" rhythm creates deliberate pacing that makes each release feel weighty and consequential.

**Touch Area Map**:
```
┌─────────────────────────────┐
│   Crane arm + swinging ball │  ← Visual only (top 25%)
│                             │
│                             │
│      FULL SCREEN TAP ZONE   │  ← Entire screen = release ball
│                             │
│      Block Tower            │
│                             │
│      Ground Platform        │
└─────────────────────────────┘
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Block destroyed | 100 pts | Base |
| Block destroyed in air (mid-flight) | 150 pts | Block was not on ground when hit |
| Chain reaction hit (block hits block) | +50 pts per chain | Consecutive chain within 500ms |
| Stage Clear (all blocks gone) | 2000 pts | Only if all blocks destroyed |
| Perfect Clear (1 swing) | 5000 pts bonus | All blocks cleared in 1 swing |
| 2-Swing Clear | 1500 pts bonus | All blocks cleared in 2 swings |
| Idle penalty (20s no tap) | -500 pts | Applied on auto-release |
| Unused swing | 0 pts (neutral) | Remaining swings not penalized |

**Combo System**: Chain reactions within 500ms of each other escalate a "Wrecking Streak" counter. Each streak level multiplies chain hit bonus by 1 + (0.5 × streak). Max streak cap: 8x. Streak resets when physics settle (no block movement for 300ms).

**High Score**: Stored per-session as cumulative score across all stages. Tracked in localStorage. Best session score is displayed on the main menu with "Personal Best" label.

### 2.4 Progression System

Each stage is a procedurally generated tower. Towers grow taller, add protected block types, and introduce structural complexity as stages increase. The player progresses infinitely until they quit.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1–5 | Simple rectangular stacks, no special blocks | Easy — wide target, low and flat |
| 6–12 | Pyramid shapes, wider bases | Medium — center hits rewarded |
| 13–20 | Staggered layers, gaps between blocks | Medium-Hard — timing critical |
| 21–35 | Armored blocks (require 2 hits to destroy) | Hard — swing angle matters |
| 36–55 | Protected core structures (ball must penetrate) | Very Hard — precise aim required |
| 56+ | Multi-tower stages (2 towers, swing once at each) | Extreme — two-phase round |

### 2.5 Lives and Failure

There are no lives. The game never ends involuntarily — the player simply accumulates score across stages and decides when to stop. A round ends when 3 swings are used or the tower is cleared. The "death" condition is inactivity only.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| 20s idle with no tap | Auto-release at random angle, -500 pts, inactivity warning flash | None (prevents freeze) |
| All 3 swings used, blocks remain | Partial score awarded, next stage loads | None (intended) |

---

## 3. Stage Design

### 3.1 Infinite Stage System

Stages are procedurally generated using a deterministic seed based on stage number. Each stage generates a tower layout, selects block types, and configures the pendulum arc based on difficulty tier.

**Generation Algorithm**:
```
Stage Generation Parameters:
- Seed: stageNumber * 7919 + 31337 (deterministic)
- Difficulty Tier: floor(stageNumber / 5) capped at tier 10
- Tower Width: 3 blocks (stages 1–5) → 5 blocks (stages 6–20) → 7 blocks (stages 21+)
- Tower Height: 3 rows (stages 1–5) → 6 rows (stages 6–15) → 10 rows (stages 16–30) → 14 rows (stages 31+)
- Armored Block Chance: 0% (stages 1–20) → 15% (stages 21–35) → 30% (stages 36–55) → 45% (stages 56+)
- Gap Chance (missing blocks): 0% (stages 1–12) → 10% (stages 13–20) → 20% (stages 21+)
- Pendulum Arc Width: 120° (stages 1–10) → 100° (stages 11–25) → 80° (stages 26+)
- Pendulum Speed: 1.2s full arc (stages 1–10) → 1.0s (stages 11–25) → 0.8s (stages 26+)
```

### 3.2 Difficulty Curve

```
Difficulty
    │
100 │                                               ───────────── (cap tier 10)
    │                                         ╱
 80 │                                   ╱
    │                             ╱
 60 │                       ╱
    │                 ╱
 40 │           ╱
    │     ╱─────
 20 │╱
    │
  0 └────────────────────────────────────────── Stage
    0    10    20    30    40    50    60    70+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1–5 | Stage 6–15 | Stage 16–30 | Stage 31–55 | Stage 56+ |
|-----------|-----------|------------|-------------|-------------|-----------|
| Tower height (rows) | 3 | 6 | 10 | 14 | 14–18 |
| Tower width (cols) | 3 | 4–5 | 5–6 | 6–7 | 7 |
| Pendulum arc | 120° | 110° | 100° | 90° | 80° |
| Pendulum speed (s/arc) | 1.2 | 1.1 | 1.0 | 0.9 | 0.8 |
| Armored blocks % | 0% | 0% | 0% | 15–30% | 30–45% |
| Gap blocks % | 0% | 0% | 10% | 20% | 25% |
| New mechanic | None | Pyramid shape | Staggered layers | Armored blocks | Multi-tower |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every tower must be hittable by the wrecking ball at some point in its arc. No tower wider than 80% of screen width. Ball trajectory at peak swing always crosses the tower's horizontal bounds.
2. **Variety Threshold**: At least 2 parameters must differ between consecutive stages (height OR width OR gap density OR armor density).
3. **Difficulty Monotonicity**: Overall block count and structural complexity must not decrease across 5-stage windows. Local dips allowed for rest stages.
4. **Rest Stages**: Every 10 stages, insert a "demolition gift" stage — shorter tower, no armor, wide arc. Intended as a confidence-booster and score-buffer.
5. **Special Stages**: Every 15 stages, a "Skyscraper Challenge" — extra-tall tower (20 rows), single swing only available, massive bonus if toppled.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Bold geometric minimalism. Heavy industrial aesthetic — steel cables, concrete blocks, iron wrecking balls. High-contrast colors with satisfying destruction particles. Think construction site meets arcade cabinet.

**Aesthetic Keywords**: Industrial, Impactful, Bold, Satisfying, Crunchy

**Reference Palette Mood**: Dark sky background, warm orange/amber accent for UI, cool grey blocks, vibrant destruction particles.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary (ball) | Steel Silver | `#B0BEC5` | Wrecking ball, crane arm |
| Secondary (highlights) | Safety Orange | `#FF6F00` | UI accents, swing indicator arc |
| Background | Deep Indigo | `#1A1A2E` | Sky background |
| Block Normal | Concrete Grey | `#607D8B` | Standard destructible blocks |
| Block Armored | Rust Red | `#B71C1C` | Armored blocks (2 hits) |
| Block Cracked | Cracked Tan | `#A1887F` | Armored block after 1 hit |
| Ground Platform | Dark Steel | `#37474F` | Static base platform |
| Danger/Idle | Warning Yellow | `#FFD600` | Inactivity timer ring around ball |
| Reward/Score | Bright Amber | `#FFB300` | Score text, Perfect Clear banner |
| UI Text | Off-White | `#ECEFF1` | All UI text |
| UI Background | Near-Black | `#0D0D1A` | Overlay panels |
| Chain Particle | Electric Cyan | `#00E5FF` | Chain reaction particles |
| Destruction Particle | Orange Fire | `#FF6D00` | Block destruction burst |

### 4.3 SVG Specifications

All game graphics are rendered as SVG/Canvas elements generated in Phaser code. No external image assets.

**Wrecking Ball**:
```svg
<!-- 48x48px circle with metallic sheen -->
<circle cx="24" cy="24" r="22" fill="#607D8B" stroke="#455A64" stroke-width="3"/>
<circle cx="18" cy="16" r="6" fill="#B0BEC5" opacity="0.5"/>
<!-- Chain links rendered as small ellipses above ball -->
```

**Standard Block (36x24px)**:
```svg
<rect x="1" y="1" width="34" height="22" rx="2" fill="#607D8B" stroke="#455A64" stroke-width="2"/>
<!-- Top highlight -->
<rect x="3" y="3" width="30" height="4" fill="#78909C" opacity="0.6"/>
```

**Armored Block (36x24px)**:
```svg
<rect x="1" y="1" width="34" height="22" rx="2" fill="#B71C1C" stroke="#7F0000" stroke-width="2"/>
<!-- Rivets at corners -->
<circle cx="6" cy="6" r="3" fill="#D32F2F"/>
<circle cx="30" cy="6" r="3" fill="#D32F2F"/>
<circle cx="6" cy="18" r="3" fill="#D32F2F"/>
<circle cx="30" cy="18" r="3" fill="#D32F2F"/>
```

**Cracked Armored Block (36x24px)**:
```svg
<rect x="1" y="1" width="34" height="22" rx="2" fill="#A1887F" stroke="#6D4C41" stroke-width="2"/>
<!-- Crack lines -->
<line x1="10" y1="2" x2="18" y2="22" stroke="#4E342E" stroke-width="1.5"/>
<line x1="20" y1="2" x2="26" y2="15" stroke="#4E342E" stroke-width="1"/>
```

**Crane Arm**:
```svg
<!-- Vertical mast: rect x=14 y=0 width=8 height=80 fill=#455A64 -->
<!-- Horizontal jib: rect x=0 y=10 width=80 height=6 fill=#546E7A -->
<!-- Cable: line from jib tip to ball -->
```

**Design Constraints**:
- All SVG elements use basic shapes (rect, circle, line, polygon) only
- Maximum 6 elements per game object
- Particle effects use pooled circles (r=4–8) with alpha fade
- Phaser Graphics API for dynamic cable drawing each frame

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Screen shake | Ball hits tower | Camera shake, intensity 6px, duration 200ms, ease Out |
| Block destruction burst | Block destroyed | 12 orange particles, radial burst, speed 80–180px/s, lifespan 400ms |
| Chain reaction flash | Chain hit | Electric cyan ring flash on hit block, scale 1→2.5, alpha 1→0, 250ms |
| Dust cloud | Blocks land on ground | 8 grey circles, upward drift, alpha fade 600ms |
| Pendulum arc indicator | Ball swinging | Faint orange arc line showing 20° ahead of current position |
| Perfect Clear banner | All blocks cleared in 1 swing | "PERFECT!" text, scale punch 0.5→1.2→1.0, gold shimmer, 1200ms |
| Idle ring | 15s no tap | Yellow ring grows around ball, full circle = 20s → auto-release |
| Score pop | Score event | "+N" floating text, amber, rises 50px, fade 700ms |
| Ball trail | Ball in flight | 6 fading ghost images of ball at 30ms intervals, alpha 0.4→0 |
| Hit-stop | Ball first contact | 40ms physics freeze at moment of first block impact |

---

## 5. Audio Design

### 5.1 Sound Effects

All audio generated via Web Audio API (Tone.js or raw AudioContext). No external audio files.

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Ball release (tap) | Low thunk, cable tension release "clank" | 150ms | High |
| Ball whoosh (flight) | Doppler-style air rush, pitch rises as ball accelerates | 300ms | High |
| Block hit (single) | Dull concrete crunch, low frequency thud | 200ms | High |
| Block destroyed | Crunchy rubble collapse, slightly higher pitch | 250ms | High |
| Chain reaction | Each hit plays crunch + escalating pitch (+12% per chain) | 200ms each | High |
| Armored block hit (no destroy) | Heavy metal clang, reverb tail | 300ms | High |
| Armored block crack | Crack sound + metal groan | 200ms | Medium |
| Stage clear | Ascending 3-note chime (D-F#-A), bright | 600ms | High |
| Perfect clear | Full descending-then-ascending fanfare, 5 notes | 900ms | High |
| New high score | Celebratory ascending arpeggio, 4 notes | 1200ms | Medium |
| Idle warning (15s) | Low beeping pulse, 1 per second | Looping | Medium |
| Auto-release (idle) | Weak clang, disappointing tone | 200ms | High |
| UI tap | Subtle soft click | 80ms | Low |

### 5.2 Music Concept

**Background Music**: Driving, rhythmic industrial ambient. Layered percussive loops with a sense of machinery and momentum. Tempo mirrors pendulum swing cadence (approximately 60–80 BPM). Music intensity increases with stage number.

**Music State Machine**:
| Game State | Music Behavior |
|-----------|---------------|
| Menu | Slow industrial ambient, low volume (40%) |
| Stage 1–10 | Moderate industrial beat, 60 BPM |
| Stage 11–30 | Increased percussion, 70 BPM |
| Stage 31+ | Full driving beat, 80 BPM, extra layer |
| Stage Clear | Brief fanfare sting over music |
| Inactivity warning | Music lowers to 20% volume, tension drone added |
| Paused | Music volume drops to 15% |

**Audio Implementation**: Web Audio API with Phaser's built-in audio manager. All sounds synthesized procedurally using `AudioContext.createOscillator()` and `AudioContext.createGainNode()` to avoid audio file loading.

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Splash  │────→│   Menu   │────→│   Game   │
│  0.5s    │     │  Screen  │     │  Scene   │
└──────────┘     └──────────┘     └──────────┘
                      │                │
                      │           ┌────┴────┐
                      │           │  Pause  │
                      │           │ Overlay │
                      │           └────┬────┘
                      │                │
                      │           ┌────┴────────┐
                 ┌────┴────┐     │  Stage End   │
                 │Settings │     │  Score Tally │
                 │ Overlay │     └────┬─────────┘
                 └─────────┘          │
                                 ┌────┴────┐
                                 │  Game   │
                                 │  Over   │
                                 │ (Quit)  │
                                 └─────────┘
```

**Transition timings**:
- Splash → Menu: 500ms fade
- Menu → Game: 300ms slide-down
- Stage End tally: 800ms (score counting animation)
- Stage End → Next Stage: auto-advance after 1.5s OR immediate tap
- Game Over → Menu: 400ms fade

### 6.2 HUD Layout

```
┌─────────────────────────────────┐
│ ☰         STAGE 7       12,450 │  ← Top bar: hamburger | stage | score
├─────────────────────────────────┤
│    ○──────────────────────○    │  ← Crane + cable + ball (top 20%)
│              ⊙                 │
│                                 │
│     ████████████████████        │  ← Tower (center-bottom 50%)
│     ████████████████████        │
│     ████████████████████        │
│  ───────────────────────────   │  ← Ground platform
│                                 │
│  [●] [●] [○]   TAP TO SWING   │  ← Swing count indicators + hint
└─────────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-right | Cumulative session score, punch animation on change | Every score event |
| Stage | Top-center | "STAGE N" with level indicator | On stage transition |
| Hamburger Menu | Top-left (44×44px) | Opens pause overlay | On tap |
| Swing Indicators | Bottom-left | 3 circles: filled=remaining, empty=used | After each swing |
| Tap hint | Bottom-right | "TAP TO SWING" (fades after stage 3) | First 3 stages only |
| Chain Streak | Center (temporary) | "CHAIN x3!" escalating text | On chain event, 800ms display |
| Idle ring | On the ball | Yellow ring progress indicator | Each frame at 15–20s |

### 6.3 Menu Structure

**Main Menu**:
- Large "WRECKING SWING" title with steel texture treatment
- "PLAY" button (large, full-width, Safety Orange)
- "BEST: [score]" shown below Play button
- Settings gear icon (top-right, 44×44px)
- Sound toggle icon (top-left, 44×44px)

**Pause Menu** (overlay, 80% black semi-transparent):
- "PAUSED" header
- "RESUME" button (primary)
- "RESTART" button (secondary)
- "MENU" button (tertiary)

**Stage End Screen** (brief overlay, auto-advance):
- Stage number: "STAGE [N] CLEARED"
- Swing efficiency: "2/3 SWINGS USED"
- Stage score with count-up animation (600ms)
- "Perfect Clear" banner if applicable (gold shimmer)
- Tap anywhere or auto-advance after 1.5s

**Game Over Screen** (triggered only on quit from pause):
- "GAME OVER" header
- Final Score (large, count-up animation)
- "BEST: [high score]" — if new best, glows and shows "NEW BEST!"
- "Highest Stage: N"
- "PLAY AGAIN" button (primary, Safety Orange)
- "MENU" button (secondary)

**Settings Screen** (overlay):
- Sound Effects: On/Off toggle
- Music: On/Off toggle
- Vibration: On/Off toggle

---

## 7. Monetization

### 7.1 Ad Placements (POC: Placeholder Only)

**Note: POC build has no ad SDK integration. All ad slots are placeholder functions that fire console.log only.**

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After every 5th stage completed | Every 5 stages | After 5s |
| Rewarded | "Double your stage score?" prompt at stage end | Optional, once per stage | Always |
| Banner | Menu screen only | Always visible on menu | N/A |

### 7.2 Reward System (POC: Placeholder)

| Reward Type | Trigger | Value |
|-------------|---------|-------|
| Score Doubler | Watch rewarded ad at stage end | 2x stage score applied |
| Extra Swing | Watch rewarded ad mid-round | +1 swing this round (max once) |

### 7.3 Session Economy

Free-to-play with optional ad engagement. Core gameplay never paywalled. The score doubler creates a light monetization hook without frustrating the core loop.

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/wrecking-swing/
├── index.html              # Entry point, CDN imports, canvas setup
├── css/
│   └── style.css           # Mobile-first styles, portrait lock, safe areas
└── js/
    ├── config.js           # Constants, palette, difficulty tables, physics params
    ├── main.js             # Phaser.Game init, scene registration, localStorage
    ├── game.js             # GameScene: pendulum, ball physics, block generation, input
    ├── stages.js           # Stage generation algorithm, tower layout, difficulty calc
    ├── ui.js               # MenuScene, GameOverScene, HUD, Pause overlay, Stage end
    └── ads.js              # Ad placeholder hooks (console.log only for POC)
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `GAME_WIDTH = 360`, `GAME_HEIGHT = 640`
- `BLOCK_W = 36`, `BLOCK_H = 24`, `BLOCK_GAP = 2`
- `BALL_RADIUS = 22`, `CABLE_LENGTH_BASE = 160` (px)
- `PENDULUM_SPEED_BASE = 1.2` (seconds per half-arc)
- `SWING_COUNT = 3` (swings per stage)
- `IDLE_TIMEOUT = 20000` (ms)
- `IDLE_WARNING = 15000` (ms, when ring starts)
- Difficulty tables: `SPEED_BY_TIER[]`, `HEIGHT_BY_TIER[]`, `ARMOR_CHANCE_BY_TIER[]`
- Color palette constants (all hex values as listed in 4.2)
- Score values: `SCORE_BLOCK=100`, `SCORE_CHAIN=50`, `SCORE_CLEAR=2000`, `SCORE_PERFECT=5000`

**main.js** (max 300 lines):
- Phaser.Game config: `type: Phaser.AUTO`, `width: 360`, `height: 640`, `physics: { default: 'matter' }`
- Matter.js physics enabled (gravity 1.5, no air friction)
- Scene array: `[MenuScene, GameScene, StageEndScene, GameOverScene]`
- Global state: `window.WS = { score, stage, swingsLeft, highScore, settings }`
- localStorage read on init, write on score events
- Orientation: CSS locks portrait, meta viewport prevents zoom

**game.js** (max 300 lines):
- `GameScene extends Phaser.Scene`
- `create()`: Build crane graphics, spawn tower from stages.js, init Matter pendulum, bind tap input
- Pendulum: Phaser Tweens oscillate pivot angle ±(arc/2), `sin(t)` easing for natural swing
- Ball in flight: Disable tween, apply velocity based on release angle and speed, trail effect starts
- Block collision: Matter collision events → destroy block, spawn particles, update score, chain timer
- `update()`: Idle timer check, idle ring draw, physics settle detection (all blocks velocity <1), swing end logic
- Armored block: track hitCount per block body, destroy on second hit
- Chain detection: timestamp last hit, if next hit within 500ms → chain++

**stages.js** (max 300 lines):
- `generateTower(stageNumber)`: returns `{ blocks: [{x,y,type},...], pendulumArc, pendulumSpeed }`
- Deterministic RNG using seeded PRNG (mulberry32 algorithm, seed = stageNumber*7919+31337)
- Tower shapes: `flat`, `pyramid`, `staggered`, `castle` (with gap arches) — selected by stage tier
- `getDifficultyTier(stageNumber)`: returns 0–10
- `isRestStage(stageNumber)`: true if stageNumber % 10 === 0
- `isBossStage(stageNumber)`: true if stageNumber % 15 === 0
- Boss stage config: height×1.5, pendulumArc×0.7, `swingCount = 1`

**ui.js** (max 300 lines):
- `MenuScene extends Phaser.Scene`: title, play button, high score display, settings button
- `HUD class`: overlaid DOM elements (score div, stage div, swing dots) OR Phaser text objects on top of GameScene
- `PauseOverlay`: shown on hamburger tap, buttons: Resume/Restart/Menu
- `StageEndScene`: brief overlay showing stage score tally, auto-advance 1500ms
- `GameOverScene extends Phaser.Scene`: final score, high score check, play again/menu buttons
- All buttons minimum 44×44px touch targets, visual feedback on press (scale 0.9→1.0, 100ms)

**ads.js** (max 300 lines):
- `AdManager` class with methods: `showInterstitial()`, `showRewarded(callback)`, `showBanner()`, `hideBanner()`
- All methods are stubs for POC: `console.log('[Ad]', type, 'triggered')`, then call callback immediately
- `interstitialCounter`: increments each stage, triggers on count%5===0
- `rewardedPrompt`: shown after stage end score tally if `swingsUsed >= 2`

### 8.3 Physics Configuration

```javascript
// Matter.js config (in Phaser game config)
physics: {
  default: 'matter',
  matter: {
    gravity: { y: 2.0 },
    debug: false,
    positionIterations: 10,
    velocityIterations: 10
  }
}

// Block body config
{
  isStatic: false,
  restitution: 0.05,      // minimal bounce
  friction: 0.4,
  frictionAir: 0.02,
  density: 0.003,
  label: 'block'
}

// Ball body config
{
  isStatic: false,
  restitution: 0.1,
  friction: 0.1,
  frictionAir: 0.0,       // no air resistance mid-flight
  density: 0.05,           // heavy — punches through blocks
  label: 'ball',
  collisionFilter: { mask: 0 }  // disabled while swinging on crane
}

// Ground platform config
{
  isStatic: true,
  restitution: 0.0,
  friction: 0.8,
  label: 'ground'
}
```

**CRITICAL Physics Rules** (from project memory):
- **NEVER** remove bodies inside collision callbacks → use `this.time.delayedCall(0, () => this.matter.world.remove(body))` for all block removals
- **NEVER** use `Body.setStatic(false)` to convert static→dynamic → Ball body created dynamic from start with `collisionFilter: { mask: 0 }`, collision enabled only on tap (set mask to normal)

### 8.4 CDN Dependencies

| Library | CDN URL | Purpose |
|---------|---------|---------|
| Phaser 3.60 | `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js` | Game engine + Matter.js bundled |

No Howler.js needed — Web Audio API used directly.

---

## 9. Juice Specification

**This section specifies ALL feel-enhancing effects with exact numeric values.**

### 9.1 Player Input Feedback (every tap)

| Effect | Target | Values |
|--------|--------|--------|
| Scale punch | Wrecking ball | Scale 1.0 → 1.15 → 1.0, duration 120ms, ease OutBack |
| Sound | — | Release clank, 150ms, frequency 180Hz→120Hz |
| Cable snap visual | Cable line | 3-frame wobble animation, amplitude 8px, 200ms |
| Particle trail start | Ball | Trail begins immediately, 6 ghost frames |

### 9.2 Core Action (Ball-Tower Impact)

| Effect | Values |
|--------|--------|
| Hit-stop | 40ms physics pause at first block contact |
| Screen shake | Camera shake, intensity 7px, duration 220ms, ease OutQuad |
| Block burst particles | 14 particles per destroyed block, orange (#FF6D00), radial burst, speed 100–220px/s, lifespan 450ms, gravity affected |
| Chain reaction cyan flash | Per chained block: cyan ring (#00E5FF), scale 1.0→2.8, alpha 1.0→0, 250ms |
| Destruction sound escalation | Base crunch pitch +8% per chain level, max +64% at chain 8 |
| Ball trail | 6 ghost images, interval 25ms, alpha 0.35→0, scale matched |
| Camera zoom on perfect hit | 1.0 → 1.04 → 1.0, duration 300ms, ease OutQuad (triggers if >80% of blocks destroyed in one swing) |
| Dust cloud (blocks land) | 8 grey circles (#78909C), upward velocity 20–60px/s, lifespan 600ms |

### 9.3 Death/Failure Effects (Idle Auto-Release)

| Effect | Values |
|--------|--------|
| Idle warning ring | Yellow (#FFD600) ring around ball, grows 0→full over 5s (from 15s to 20s) |
| Warning pulse sound | 1Hz beep at 15s, 2Hz at 18s |
| Auto-release visual | Ball desaturated (grey filter), weak trajectory |
| Screen flash on idle fire | Red-orange flash, alpha 0.3, 300ms fade |
| "-500" penalty text | Red (#D32F2F), font 28px, center screen, rises 60px, fade 900ms |
| Penalty sound | Descending two-tone "bwong", 400ms |

### 9.4 Stage Clear Effects

| Effect | Values |
|--------|--------|
| Screen flash | Gold (#FFB300) full-screen flash, alpha 0.5→0, 300ms |
| Screen shake | Intensity 4px, duration 150ms |
| Perfect Clear particles | 40 gold particles, radial from screen center, speed 150–350px/s, lifespan 800ms |
| "PERFECT!" text (if 1 swing) | Font 52px bold, scale punch 0.3→1.3→1.0, duration 400ms, gold shimmer |
| "CLEARED!" text (normal) | Font 36px bold, scale punch 0.5→1.1→1.0, duration 300ms |
| Score count-up animation | 0 → final stage score, duration 600ms, easing OutExpo |
| Stage transition delay | 1500ms after clear (player can tap to skip) |

### 9.5 Score Increase Effects

| Effect | Values |
|--------|--------|
| Score HUD punch | Top-right score: scale 1.0→1.25→1.0, duration 150ms, ease OutBack |
| Floating "+N" text | Amber (#FFB300), font 20px, spawns at block position, rises 55px, alpha fade 700ms |
| Chain streak text | "CHAIN x2/3/.." font 24px→28px→32px (grows per chain), Electric Cyan, center-top, 800ms display |
| Streak combo escalation | Effect intensity +15% per streak level for screen shake and particle count |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter (show in dev mode only) |
| Load Time | <2 seconds | No assets to load, CDN Phaser only |
| Memory Usage | <80MB | Block objects pooled, particles recycled |
| JS Bundle Size | <250KB total (excl. CDN) | Sum of all js/ files |
| First Interaction | <1s after load | Time from page load to tap-ready state |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch events**: Phaser input manager, `pointer.on('pointerdown')`, handles both touch and mouse
- **Prevent defaults**: `event.preventDefault()` on touchstart to block pull-to-refresh and double-tap zoom
- **Orientation**: CSS `@media (orientation: landscape)` shows "please rotate" overlay
- **Safe areas**: `padding: env(safe-area-inset-top)` in CSS for notch devices
- **Background throttle**: `document.addEventListener('visibilitychange')` → pause game when hidden
- **Block pooling**: Pre-allocate 200 block Matter bodies, recycle between stages (avoid GC spikes)
- **Particle pooling**: Pre-allocate 100 Phaser Graphics objects for particles, reuse via `setVisible(false)` when expired

### 10.3 Pendulum Physics Implementation

The pendulum is NOT a Matter.js constraint. It is a Phaser Tween on an angle variable to ensure predictable, smooth oscillation:

```javascript
// In GameScene.create():
this.pendulumAngle = 0; // -1.0 = full left, +1.0 = full right
this.pendulumTween = this.tweens.add({
  targets: this,
  pendulumAngle: { from: -1.0, to: 1.0 },
  duration: pendulumSpeed * 1000, // ms per half-arc
  ease: 'Sine.easeInOut',
  yoyo: true,
  repeat: -1
});

// In update():
const angle = (this.pendulumAngle * arcDegrees / 2) * (Math.PI / 180);
const ballX = craneX + Math.sin(angle) * cableLength;
const ballY = craneY + Math.cos(angle) * cableLength;
// Draw cable line craneX,craneY → ballX,ballY
// Move ball sprite to ballX,ballY
```

On tap:
```javascript
onTap() {
  const angle = this.pendulumAngle * arcDegrees / 2;
  const speed = 420; // px/s base release speed
  const vx = Math.sin(angle * Math.PI/180) * speed;
  const vy = Math.cos(angle * Math.PI/180) * speed * 0.4;

  this.pendulumTween.stop();
  // Enable ball collision
  Phaser.Physics.Matter.Matter.Body.set(this.ball.body, 'collisionFilter', { mask: -1 });
  // Apply velocity
  this.matter.body.setVelocity(this.ball.body, { x: vx/60, y: vy/60 });
}
```

### 10.4 Block Removal Safety

**Always use deferred removal** to avoid Matter.js `_findSupports` crash:

```javascript
// In collision handler:
this.matter.world.on('collisionstart', (event) => {
  const pairs = event.pairs;
  pairs.forEach(pair => {
    if (pair.bodyA.label === 'ball' || pair.bodyB.label === 'ball') {
      const blockBody = pair.bodyA.label === 'block' ? pair.bodyA :
                        pair.bodyB.label === 'block' ? pair.bodyB : null;
      if (blockBody && !blockBody.toRemove) {
        blockBody.toRemove = true;
        this.time.delayedCall(0, () => {
          this.matter.world.remove(blockBody);
          this.destroyBlockSprite(blockBody.gameObject);
          this.spawnDestructionParticles(blockBody);
          this.addScore(100, blockBody.position);
        });
      }
    }
  });
});
```

### 10.5 Inactivity Detection

```javascript
// In GameScene.create():
this.lastTapTime = this.time.now;
this.idleRingGraphics = this.add.graphics();

// In update():
const elapsed = this.time.now - this.lastTapTime;
if (elapsed >= IDLE_WARNING) {
  const progress = (elapsed - IDLE_WARNING) / (IDLE_TIMEOUT - IDLE_WARNING);
  this.drawIdleRing(progress); // draws yellow arc on ball
  if (elapsed >= IDLE_TIMEOUT) {
    this.autoReleaseBall();
    this.addScore(-500, { x: GAME_WIDTH/2, y: 100 }); // negative score popup
    this.lastTapTime = this.time.now; // reset to allow next swing
  }
}
```

### 10.6 Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome Android | 80+ | Primary target |
| Safari iOS | 14+ | Test Web Audio unlock on first tap |
| Samsung Internet | 14+ | Test Matter.js performance |
| Firefox Android | 90+ | Secondary target |

### 10.7 Local Storage Schema

```json
{
  "wrecking-swing_high_score": 0,
  "wrecking-swing_games_played": 0,
  "wrecking-swing_highest_stage": 0,
  "wrecking-swing_settings": {
    "sound": true,
    "music": true,
    "vibration": true
  },
  "wrecking-swing_total_score": 0
}
```

### 10.8 Death→Restart Time Budget

Target: **Under 2 seconds** from idle auto-release (or quit) to playable next state.

| Step | Duration |
|------|----------|
| Auto-release ball animation | 300ms |
| Penalty text display | 600ms (overlaps) |
| Physics settle detection | Up to 500ms (blocks stop moving) |
| Stage end overlay appearance | 200ms fade-in |
| Auto-advance to next stage | 1500ms (skippable by tap) |
| **Quit → Game Over → Tap Play Again → Game Scene** | **Total: ~1.8s** |

For quit path: Game Over screen appears in 400ms, Play Again tap → new game starts in 300ms. Total: 700ms.
For idle path: Auto-release → penalty → next swing ready: 1200ms total (within 2s budget).
