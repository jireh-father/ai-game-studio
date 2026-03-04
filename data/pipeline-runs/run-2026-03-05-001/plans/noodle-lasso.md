# Game Design Document: Noodle Lasso

**Slug**: `noodle-lasso`
**One-Liner**: Swing a stretchy noodle to catch falling ingredients before they hit the floor.
**Core Mechanic**: Elastic whip-catch — tap to extend a stretchy noodle lasso that snaps back, catching ingredients mid-air
**Target Session Length**: 3–6 minutes
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Noodle Lasso puts the player in control of a chef character who wields a magical spaghetti lasso. Ingredients fall from the top of the screen in random patterns. The player taps to launch the elastic noodle upward — it extends, bends toward the nearest ingredient in range, then snaps back with a satisfying THWAP, dragging the ingredient into a bowl at the bottom. The noodle behaves like a rubber-band whip: it stretches, wiggles, and recoils with physical snap.

The fun comes from the elastic whip snap feel and the split-second decision of "do I lasso now or wait for a better cluster?" Miss three ingredients and it's game over. The pace escalates from leisurely catch-training to a frantic ingredient blizzard that demands precise timing and snap reflexes.

What makes it unique is the stretchy noodle physics — the lasso doesn't travel in a straight line. It curves and wobbles as it extends, requiring players to lead their shots. High-combo catches trigger the noodle to briefly turn into a wide net, rewarding smart play.

### 1.2 Target Audience

Casual mobile gamers, ages 14–45. Played during commutes, waiting rooms, or on the couch. No prior gaming skill required; the game teaches itself in the first 10 seconds. The food theme gives it broad, universal appeal. Session length is naturally 3–6 minutes with easy retry.

### 1.3 Core Fantasy

The player is a master chef with a magical lasso noodle. They command a whip that obeys their timing, snapping ingredients out of the air with satisfying precision. The fantasy is: "I have perfect reflexes and a cool, whippy superpower."

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 4 minutes |
| Day 1 Retention | 40%+ |
| Day 7 Retention | 20%+ |
| Average Stages per Session | 6–10 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Stage Start] → [Ingredients fall] → [Tap to lasso] → [Catch or Miss]
      ↑              │                                       │
      │         [Ingredient hits floor → miss count +1]     │
      │                                                      ▼
      └──── [3 misses → Game Over] ←── [Catch → Score + Combo]
                                              │
                                     [Stage quota met → Stage Clear]
                                              │
                                     [Next Stage: faster + more types]
```

The player must catch a required number of ingredients per stage (displayed as a progress bar). Letting 3 ingredients hit the floor ends the game. Catching ingredients in quick succession builds a combo multiplier. After clearing the stage quota, a "STAGE CLEAR" flash plays and the next stage begins immediately with higher speed and new ingredient types.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Launch Lasso | Tap anywhere | Fires noodle upward from chef; direction biased toward nearest ingredient within 200px |
| Aim Lasso | Tap X position | Horizontal tap position (-180 to +180px from center) biases lasso left/right at ±30° |
| Hold for Wide Net | Hold >400ms | After 3-combo, holding transforms noodle into wide net (80px radius catch zone) |

**Control Philosophy**: Single-tap simplicity. The lasso auto-aims with a bias to nearest ingredient, so new players feel successful immediately. Expert play involves precise tap timing to catch ingredient clusters and delay for combo chains. Horizontal tap position provides directional control without requiring players to think about it explicitly.

**Touch Area Map**:
```
┌─────────────────────┐
│   [ ingredients ]   │  ← Falling zone (full width)
│  ● ●     ●          │
│        ●   ●        │
│                     │
│    TAP ANYWHERE     │  ← Entire screen is tap zone
│    to launch lasso  │
│                     │
│        🍜           │  ← Chef character (bottom-center)
│    [====BOWL====]   │  ← Catch bowl (visual only)
└─────────────────────┘
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Single catch | 100 | Base |
| 2-combo catch | 100 | ×1.5 |
| 3-combo catch | 100 | ×2.0 |
| 4+ combo catch | 100 | ×3.0 (max) |
| Multi-catch (2 ingredients one lasso) | 200 | ×combo multiplier |
| Stage clear bonus | stage_number × 500 | — |
| Speed catch (<0.5s after ingredient appears) | +50 bonus | — |

**Combo System**: Catch consecutive ingredients without a miss. Combo resets on any miss. Combo counter displayed center-screen, fades after 2s of no catch. At 3+ combo, lasso turns gold and catch zone widens +20px.

**High Score**: Stored in localStorage as `noodle-lasso_high_score`. Displayed on game over screen with "NEW RECORD!" animation if beaten.

### 2.4 Progression System

Each stage has a catch quota (number of ingredients to catch to advance). Missing 3 ingredients in total (across the whole game, not per stage) ends the game.

**Progression Milestones**:

| Stage Range | New Element Introduced | Catch Quota | Difficulty Modifier |
|------------|----------------------|-------------|-------------------|
| 1–3 | Tomatoes only, slow fall | 8 per stage | Speed: 1.0x, 1 ingredient at a time |
| 4–7 | Add mushrooms (faster fall) | 10 per stage | Speed: 1.3x, up to 2 simultaneous |
| 8–12 | Add fish (zigzag fall pattern) | 12 per stage | Speed: 1.6x, up to 3 simultaneous |
| 13–20 | Add peppers (fast + bouncy) | 14 per stage | Speed: 2.0x, up to 4 simultaneous |
| 21–35 | Add eggs (fragile — explode on floor hit, splash zone causes extra miss) | 15 per stage | Speed: 2.3x, up to 5 simultaneous |
| 36–50 | Gold ingredient (×5 score, rare) | 16 per stage | Speed: 2.6x, up to 6 simultaneous |
| 51+ | Infinite — random mix, speed caps at 3.0x | 18 per stage | Endless survival |

### 2.5 Lives and Failure

The player has 3 misses total (not per stage). Each missed ingredient (hits floor without being caught) costs 1 miss. At 3 misses, game over.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Ingredient hits floor | Miss counter +1 (shown as heart lost) | None per miss |
| 3rd miss | Game over immediately | Play Again button |
| 12 seconds idle (no tap) | Game over — inactivity death | Play Again button |

Death → restart must be under 2 seconds (game over screen auto-clears after 1.8s if player taps Play Again).

---

## 3. Stage Design

### 3.1 Infinite Stage System

Stages are generated procedurally using the stage number as seed. Each stage defines: ingredient types allowed, fall speed, simultaneous count, spawn interval, and special events.

**Generation Algorithm**:
```
Stage Generation Parameters:
- Speed multiplier: min(1.0 + (stage * 0.06), 3.0)
- Simultaneous ingredients: min(1 + floor(stage / 4), 6)
- Spawn interval: max(2400 - (stage * 40), 600)ms
- Catch quota: min(8 + stage, 18)
- Ingredient types: unlock table (see 2.4)
- Special event chance: stage > 5 ? floor(stage/10) * 5% : 0
- Rest stage: every 10th stage — speed reduced 20%, quota -3
- Special stage: every 15th stage — golden ingredient shower (all gold, ×3 quota score)
```

### 3.2 Difficulty Curve

```
Difficulty
    │
100 │                                          ──────────── (speed cap 3.0x)
    │                                    ╱
 80 │                              ╱
    │                        ╱
 60 │                  ╱  (rest dips every 10 stages)
    │            ╱ ‾╲╱
 40 │      ╱ ‾╲╱
    │  ╱ ‾╲╱
 20 │╱
    │
  0 └────────────────────────────────────────── Stage
    0    10    20    30    40    50    60    70+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1–5 | Stage 6–15 | Stage 16–30 | Stage 31–50 | Stage 51+ |
|-----------|-----------|------------|-------------|-------------|-----------|
| Fall Speed | 1.0× | 1.4× | 1.9× | 2.4× | 3.0× (cap) |
| Simultaneous Count | 1 | 2–3 | 3–4 | 4–5 | 5–6 |
| Spawn Interval | 2400ms | 1800ms | 1200ms | 900ms | 600ms |
| Catch Quota | 8 | 10–12 | 13–14 | 15–16 | 18 |
| Reaction Window | 2.0s | 1.5s | 1.2s | 1.0s | 0.8s |
| New Mechanic | None | Mushroom/Fish | Pepper | Egg/Gold | Random mix |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Minimum spawn interval ensures player always has enough time to lasso one ingredient before the next falls out of reach. Spawn interval ≥ lasso animation time (400ms) × simultaneous count.
2. **Variety Threshold**: Every 3 stages, at least 1 new ingredient type or pattern variation must appear.
3. **Difficulty Monotonicity**: Base speed never decreases stage-to-stage except on rest stages (every 10th).
4. **Rest Stages**: Every 10th stage — speed -20%, quota -3, no new types. Visual: warm sepia tint.
5. **Special Stages**: Every 15th stage — Gold Rush: only golden ingredients fall, count ×2, score ×3. Visual: golden shimmer background.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Flat cartoon with bold outlines. Cheerful kitchen aesthetic. Characters are simple rounded SVG shapes with expressive "eyes." Ingredients are chunky and recognizable at 32px.

**Aesthetic Keywords**: Chunky, Bouncy, Warm, Kitchen, Cartoon

**Reference Palette**: Think bright food photography — reds, yellows, greens on a warm cream background.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | Tomato Red | #E63946 | Chef hat, lasso noodle base color, UI accents |
| Secondary | Saffron Yellow | #FFB703 | Score text, combo counter, golden ingredients |
| Background | Warm Cream | #FFF8F0 | Game background |
| Floor/Danger | Slate Blue | #457B9D | Floor line, miss warning tint |
| Reward | Lime Green | #2DC653 | Catch confirmation flash, stage clear |
| UI Text | Dark Charcoal | #1D1D1B | All text |
| UI Background | Soft Peach | #FDDBB4 | Menu backgrounds, overlays |
| Noodle Lasso | Warm Beige | #F4A261 | Noodle body (animated color shift to gold on combo) |
| Danger Flash | Signal Red | #E63946 | Miss flash overlay |

### 4.3 SVG Specifications

All graphics are SVG generated in code. No external assets.

**Chef Character** (60×70px, bottom-center at y=520):
```svg
<!-- Chef body: white apron + red hat -->
<g id="chef">
  <!-- Body -->
  <ellipse cx="30" cy="55" rx="22" ry="18" fill="#FFFFFF" stroke="#1D1D1B" stroke-width="2"/>
  <!-- Head -->
  <circle cx="30" cy="30" r="18" fill="#FDDBB4" stroke="#1D1D1B" stroke-width="2"/>
  <!-- Chef hat -->
  <rect x="14" y="8" width="32" height="6" rx="2" fill="#E63946"/>
  <rect x="18" y="2" width="24" height="10" rx="4" fill="#FFFFFF" stroke="#1D1D1B" stroke-width="1.5"/>
  <!-- Eyes -->
  <circle cx="24" cy="28" r="3" fill="#1D1D1B"/>
  <circle cx="36" cy="28" r="3" fill="#1D1D1B"/>
  <!-- Smile -->
  <path d="M24 36 Q30 41 36 36" stroke="#1D1D1B" stroke-width="2" fill="none" stroke-linecap="round"/>
</g>
```

**Noodle Lasso** (dynamic, drawn per-frame):
```
Rendered as a Phaser Graphics object using bezier curves.
- Base: 4px stroke, color #F4A261
- Elastic stretch: cubic bezier from chef tip to target, control points wobble ±15px via sine wave
- Snap-back: tweened in 150ms, overshoot ±8px then settle
- Combo gold: color transitions to #FFB703 at 3+ combo, stroke width +1px
- Catch zone: circle at lasso tip, radius 24px (baseline), +20px at 3+ combo
```

**Ingredient — Tomato** (32×32px):
```svg
<g id="tomato">
  <circle cx="16" cy="18" r="13" fill="#E63946" stroke="#1D1D1B" stroke-width="2"/>
  <path d="M12 8 Q16 2 20 8" stroke="#2DC653" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- stem -->
  <line x1="16" y1="5" x2="16" y2="9" stroke="#2DC653" stroke-width="2"/>
</g>
```

**Ingredient — Mushroom** (32×32px):
```svg
<g id="mushroom">
  <ellipse cx="16" cy="14" rx="13" ry="10" fill="#C77DFF" stroke="#1D1D1B" stroke-width="2"/>
  <rect x="12" y="14" width="8" height="12" rx="2" fill="#FFF8F0" stroke="#1D1D1B" stroke-width="2"/>
  <circle cx="11" cy="12" r="3" fill="#FFFFFF" opacity="0.5"/>
</g>
```

**Ingredient — Gold Star** (32×32px, special):
```svg
<g id="gold-star">
  <polygon points="16,2 19,11 29,11 21,17 24,26 16,20 8,26 11,17 3,11 13,11"
           fill="#FFB703" stroke="#E63946" stroke-width="2"/>
</g>
```

**Miss Counter Heart** (24×24px, filled / empty):
```svg
<!-- Filled heart -->
<path d="M12 21 C12 21 2 14 2 8 C2 4.7 4.7 2 8 2 C9.7 2 11.3 2.8 12 4 C12.7 2.8 14.3 2 16 2 C19.3 2 22 4.7 22 8 C22 14 12 21 12 21Z"
      fill="#E63946" stroke="#1D1D1B" stroke-width="1.5"/>
```

**Background Elements** (decorative, static):
```
- Checkered floor tiles: 40×40px white/cream pattern, bottom 60px
- Floating steam wisps: 3 sinusoidal white curves behind chef, CSS opacity animation 0→0.3→0 at 2s loop
- Recipe card corner decorations: static SVG flourishes, 20px, corners of game area
```

**Design Constraints**:
- Max 6 path elements per ingredient SVG
- Max 10 simultaneous ingredient objects on screen
- Use basic shapes over complex paths
- Lasso drawn as Phaser Graphics (not SVG) for per-frame update performance

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Lasso snap recoil | Catch/miss | Tween bezier control points: overshoot 8px → settle, 150ms |
| Ingredient catch pop | Successful catch | Scale 1.0 → 1.4 → 0 over 200ms, move toward bowl |
| Ingredient miss splat | Hits floor | Scale punch 1.3× then spread flat, 300ms, then fade |
| Screen flash green | Catch | Background color flash #2DC653 at 15% opacity, 80ms |
| Screen flash red | Miss | Background color flash #E63946 at 25% opacity, 120ms |
| Screen shake | 3rd miss / game over | Camera offset: random ±10px, 8 frames, 300ms |
| Combo burst | 3+ combo | 20 particles from chef position, color #FFB703, 400ms radial burst |
| Stage clear fireworks | Stage clear | 30 particles in 3 bursts, colors: #E63946 #FFB703 #2DC653, 600ms |
| Floating score text | Every catch | "+100×{multiplier}" text, float up 60px, fade over 600ms |
| Noodle gold shimmer | 3+ combo active | Noodle color tweens to #FFB703, stroke width 4→5px |
| Heart crack | Miss | Heart icon scales 1.2× then cracks: split into 2 halves, fall off screen |

---

## 5. Audio Design

### 5.1 Sound Effects

All audio generated via Web Audio API (no files needed).

| Event | Sound Description | Duration | Priority | Web Audio Generation |
|-------|------------------|----------|----------|---------------------|
| Lasso launch | Short whoosh, rising pitch | 150ms | High | Sine sweep 200→800Hz |
| Catch | Satisfying "thwap" snap + pop | 200ms | High | White noise burst 80ms + sine 600Hz pop |
| Miss splat | Wet splat thud | 200ms | High | Low sine 120Hz + noise burst |
| Combo ping | Ascending chime per combo level | 100ms | Medium | Sine 440→880→1320Hz stepped |
| Stage clear | 3-note fanfare | 600ms | High | Sine 523+659+784Hz arpeggiated |
| Game over | Descending trombone wah | 800ms | High | Sine 400→200Hz with wobble |
| Idle warning (10s) | Ticking clock sound | 2s loop | Medium | Square wave 2Hz at 800Hz carrier |
| Gold catch | Sparkling shimmer | 300ms | Medium | Sine 1200→2400Hz with reverb |
| UI tap | Subtle click | 60ms | Low | Sine 800Hz, fast decay |

### 5.2 Music Concept

**Background Music**: Upbeat kitchen jazz loop. Playful, medium tempo (110 BPM). Generated via Web Audio API using repeating note patterns.

**Music State Machine**:
| Game State | Music Behavior |
|-----------|---------------|
| Menu | Slow, warm melody, 90 BPM |
| Stages 1–10 | Upbeat kitchen jazz, 110 BPM |
| Stages 11–30 | Increased percussion, 120 BPM |
| Stages 31+ | Fast, energetic, 135 BPM |
| Game Over | Music stops, single descending note |
| Pause | Music volume reduced to 20% |
| Stage Clear | Brief fanfare overlay, then resume next stage music |

**Audio Implementation**: Web Audio API only — no CDN dependency for audio. All sounds synthesized in `js/config.js` as AudioContext calls.

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Title   │────→│   Menu   │────→│   Game   │
│  Screen  │     │  Screen  │     │  Screen  │
│ (0.8s)   │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘
                      │                │
                      │           ┌────┴────┐
                      │           │  Pause  │
                      │           │ Overlay │
                      │           └────┬────┘
                      │                │
                 ┌────┴────┐      ┌────┴────┐
                 │Settings │      │  Game   │
                 │ Overlay │      │  Over   │
                 └─────────┘      │ Screen  │
                                  └────┬────┘
                                       │
                                  ┌────┴────┐
                                  │ Play    │
                                  │ Again   │
                                  └─────────┘
```

Title screen shows for 0.8s (logo animation) then auto-transitions to Menu. No loading screen needed (SVG assets generated in code).

### 6.2 HUD Layout

```
┌─────────────────────────────────┐  ← 360px wide
│ Score: 12450   Stage 7   ♥♥♥   │  ← Top bar 44px, always visible
├─────────────────────────────────┤
│                                 │
│   [Ingredients falling here]    │
│                                 │
│     ●   ●      ●               │
│         ×3 COMBO!               │  ← Combo text, center, fades
│                                 │
│   [Lasso active during tap]     │
│                                 │
│         🍜                     │  ← Chef, bottom-center y=480
│  [== Catch Progress Bar ==]     │  ← Progress bar 8/12 style, y=530
└─────────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left, x=12 y=14 | "Score: XXXXX" with punch anim on change | Every catch |
| Stage | Top-center | "Stage X" | On stage transition |
| Miss hearts | Top-right, x=300 y=14 | 3 heart icons, crack animation on miss | On miss |
| Combo text | Center x=180 y=200 | "×N COMBO!" size scales with N | On consecutive catch |
| Catch progress | Bottom x=20 y=555 | Progress bar, 8/12 filled segments | Every catch |
| Idle warning | Center overlay | "WAKE UP!" red text at 10s idle | On idle timer |

### 6.3 Menu Structure

**Title Screen** (0.8s auto-transition):
- Logo: "NOODLE LASSO" in chunky rounded font, noodle wraps around letters
- Chef character bouncing animation
- Auto-transitions to Main Menu after 0.8s (or on tap)

**Main Menu**:
- "PLAY" button (large, 200×60px, red #E63946, centered at y=320)
- High Score display: "BEST: XXXXX" (below play button)
- Settings gear icon (top-right corner, 44×44px tap target)
- Game title top-center

**Pause Menu** (overlay, #1D1D1B at 60% opacity):
- "PAUSED" text (centered, large)
- Resume (green button)
- Restart (yellow button)
- Menu (gray button)
- Triggered by: tap chef character during gameplay

**Game Over Screen** (replaces game canvas, appears 500ms after death):
- "GAME OVER" (large, animated drop-in)
- Final score (large, punch animation)
- "NEW RECORD!" badge if high score beaten (yellow burst)
- Stage reached: "Made it to Stage X"
- "PLAY AGAIN" button (large, prominent, red)
- "MENU" button (smaller, below)

**Settings Screen** (overlay):
- Sound Effects toggle (default: ON)
- Music toggle (default: ON)
- Vibration toggle (default: ON)

---

## 7. Monetization

### 7.1 Ad Placements

POC build — no real ads. Placeholder hooks only.

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after 3rd miss | Every game over | Always (optional) |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra miss | Watch rewarded ad after 3rd miss | Restore 1 miss (play continues) | Once per game |

### 7.3 Session Economy

POC: no monetization pressure. Rewarded ad continue prompt shown but marked "Coming Soon" in POC build. All ad functions are empty stubs in `js/ads.js`.

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/noodle-lasso/
├── index.html              # Entry point, CDN links, canvas container
├── css/
│   └── style.css           # Mobile-first responsive layout, portrait lock
└── js/
    ├── config.js           # Constants, palette, difficulty tables, audio params
    ├── main.js             # Phaser.Game init, scene list, localStorage helpers
    ├── game.js             # GameScene: create/update, lasso physics, ingredient spawning
    ├── stages.js           # Stage generation, difficulty calc, quota tracking
    ├── ui.js               # MenuScene, GameOverScene, PauseOverlay, HUD
    └── ads.js              # Stub ad functions (empty for POC)
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `PALETTE` object with all hex colors
- `DIFFICULTY` table: speed/count/interval per stage
- `INGREDIENT_TYPES` array: id, color, points, fallPattern
- `STAGE_QUOTAS` function: (stageNum) => catchCount
- `AUDIO_PARAMS` for Web Audio API synthesis
- `LASSO_CONFIG`: baseRadius=24, comboRadius=44, stretchSpeed=800px/s, snapDuration=150ms

**main.js** (max 300 lines):
- `Phaser.Game` config: width=360, height=640, portrait lock, transparent background
- Scene registration: MenuScene, GameScene, GameOverScene
- `GameState` global: score, stage, misses, combo, highScore
- localStorage read/write: `noodleLasso_highScore`, `noodleLasso_settings`
- Web Audio context initialization

**game.js** (max 300 lines):
- `create()`: chef sprite, lasso Graphics object, floor boundary, input pointer handler
- `update()`: per-frame lasso bezier update, ingredient position update, idle timer check
- `launchLasso(x)`: aim calculation, extend tween, collision check at peak, snap-back tween
- `spawnIngredient()`: type selection from current stage config, random x, start fall tween
- `onIngredientCatch(ingredient)`: score update, combo increment, particle burst, ingredient destroy
- `onIngredientMiss(ingredient)`: miss counter increment, heart crack, splat effect
- **CRITICAL**: Never remove physics bodies inside collision callbacks — use `this.time.delayedCall(0, () => destroy())`

**stages.js** (max 300 lines):
- `StageManager` class
- `startStage(n)`: calculate params from difficulty table, begin spawn timer
- `getStageParams(n)`: returns {speed, count, interval, quota, types, isRest, isGold}
- `onCatch()`: increment progress, check quota completion
- `onStageComplete()`: flash, score bonus, call `startStage(n+1)`
- Spawn timer: `this.time.addEvent({delay: interval, callback: spawnNext, loop: true})`

**ui.js** (max 300 lines):
- `MenuScene`: logo tween, play button, high score text, settings button
- `GameOverScene`: score display, new record badge, play again / menu buttons
- `HUDManager` class (not a scene — overlaid on GameScene):
  - `updateScore(val)`: text + scale punch tween
  - `updateMisses(count)`: heart crack animation
  - `showCombo(multiplier)`: floating combo text
  - `updateProgress(caught, total)`: progress bar fill
- `PauseOverlay`: semi-transparent overlay, resume/restart/menu buttons

**ads.js** (max 300 lines):
- All functions are stubs for POC
- `showInterstitial(onClose)`: immediately calls `onClose()` in POC
- `showRewarded(onReward, onSkip)`: immediately calls `onSkip()` in POC
- Comment: `// TODO: integrate ad SDK here`

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | 3.60.0 | `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js` | Game engine |

No Howler.js needed — audio via Web Audio API only.

### 8.4 Lasso Physics Implementation

The lasso is NOT a physics body. It is a visual curve (Phaser.GameObjects.Graphics) updated per-frame:

```
State machine:
  IDLE     → tap → EXTENDING
  EXTENDING → peak reached or ingredient in radius → CATCHING / MISSING
  CATCHING  → snap tween complete → IDLE (with caught ingredient traveling to bowl)
  MISSING   → snap tween complete → IDLE

Bezier control points:
  P0 = chef tip (x=180, y=480)
  P1 = P0 + (0, -lassoPct * 250) + wobble (±15px sine)
  P2 = target + (0, +60)
  P3 = target position

Catch detection:
  At EXTENDING peak: check all active ingredients within lassoRadius px of P3
  If ingredient found: tween it to bowl position, trigger onCatch
  If none found: trigger MISSING state
```

---

## 9. Juice Specification

### 9.1 Player Input Feedback (applied to every tap)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Lasso tip | Count: 6, Direction: radial burst, Color: #F4A261, Lifespan: 200ms |
| Scale punch | Chef character | Scale: 0.95 → 1.05 → 1.0, Duration: 80ms |
| Sound | — | Whoosh: sine sweep 200→800Hz, 150ms |
| Lasso wobble | Graphics curve | Control point offset ±15px sine, applied for 300ms |

### 9.2 Core Action Feedback — Successful Catch

| Effect | Values |
|--------|--------|
| Particles | Count: 20, radial burst from catch point, colors match ingredient, Lifespan: 400ms |
| Hit-stop | 40ms physics pause (all ingredient tweens pause via `scene.tweens.pauseAll()` for 40ms) |
| Camera zoom | 1.03× scale on chef, Recovery: 180ms ease-out |
| Snap sound | "Thwap" + pop: white noise 80ms + sine 600Hz, 200ms total |
| Screen flash | #2DC653 at 15% opacity, 80ms |
| Catch particle trail | Ingredient scales 1.4× then flies to bowl position with curved tween, 300ms |
| Combo escalation | Each combo level: particle count +5, sound pitch +15%, flash opacity +5% (max combo 4×) |

### 9.3 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Miss flash | #E63946 at 25% opacity, 120ms per miss |
| Heart crack | Heart scale 1.2× then split animation: 2 halves fall off screen, 400ms |
| 3rd miss: screen shake | Intensity: 10px, Duration: 300ms, 8 offset frames |
| 3rd miss: slow-mo | Game time scale tweens 1.0 → 0.3 → 0 over 500ms |
| 3rd miss: sound | Descending sine 400→200Hz with wobble, 800ms |
| 3rd miss: splat overlay | All ingredients on screen do splat animation simultaneously |
| Effect → UI delay | 500ms after last effect before game over screen appears |
| Death → restart | Under 2 seconds: game over screen tap → instant scene restart |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating score text | "+100×{N}", Color: #FFB703, Font: bold 20px, Move up 60px, Fade over 600ms |
| Score HUD punch | Scale 1.3× recovery 150ms ease-out |
| Combo text | Appears center-screen: "×2 COMBO!" at 28px bold, "×3 COMBO!" at 34px, "×4 COMBO!" at 42px |
| Combo burst | At 3+ combo: 20 particles #FFB703 radial burst from chef, 400ms |
| Noodle gold | At 3+ combo: lasso color tweens to #FFB703, stroke width 4→5px, 200ms transition |
| Stage clear text | "STAGE CLEAR!" drops in from top, bounces, scale punch 1.5×, color #2DC653, 600ms |

### 9.5 Idle Warning Effects

| Effect | Values |
|--------|--------|
| Idle warning at 10s | "WAKE UP!" red text pulses at screen center, 400ms interval, 2 pulses |
| Idle death at 12s | Full death sequence (see 9.3) |
| Warning sound | Ticking: square wave 2Hz at 800Hz, 2s leading up to death |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS debug overlay (disable in prod) |
| Load Time | <2 seconds | No external assets needed |
| Memory Usage | <80MB | Keep ingredient pool ≤10 objects |
| JS Bundle Size | <200KB total | File size check (no heavy deps) |
| First Interaction | <0.5 seconds after load | Time from page load to tap ready |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser pointer events — `scene.input.on('pointerdown', handler)`
- **Prevent Default**: Prevent pull-to-refresh and pinch-zoom in CSS: `body { touch-action: none; overflow: hidden; }`
- **Orientation**: Lock to portrait. CSS: `@media (orientation: landscape) { #game { display: none; } #rotate-msg { display: block; } }`
- **Safe Areas**: Top bar padded 44px minimum to avoid notch overlap
- **Object Pool**: Ingredient objects pooled — max 10 active, reuse via `setActive(false)` + `setVisible(false)` on catch/miss

### 10.3 Critical Bug Prevention

Based on project patterns from prior runs:

1. **NEVER remove Phaser game objects inside collision/overlap callbacks.** Use deferred removal:
   ```js
   // WRONG:
   scene.children.remove(ingredient);
   // CORRECT:
   scene.time.delayedCall(0, () => ingredient.destroy());
   ```

2. **Lasso is a Graphics object, not a physics body.** Draw per-frame in `update()`. Do not use Matter.js for the lasso.

3. **Ingredient fall tweens** must be paused during hit-stop, not cancelled. Use `tween.pause()` / `tween.resume()`.

4. **Inactivity death**: track `lastTapTime` in `update()`. If `scene.time.now - lastTapTime > 12000` → trigger death sequence.

5. **Stage transition**: destroy all active ingredient objects before calling `startStage(n+1)`. Clear spawn timer with `spawnTimer.destroy()` before creating new one.

### 10.4 Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome (Android) | 80+ | Primary target |
| Safari (iOS) | 14+ | Test Web Audio context — must be created on user gesture |
| Samsung Internet | 14+ | Test touch events |
| Firefox (Android) | 90+ | Secondary target |

**Web Audio on iOS**: AudioContext must be created or resumed inside a user gesture handler (`pointerdown`). Initialize on first tap, not on `create()`.

### 10.5 Local Storage Schema

```json
{
  "noodle-lasso_high_score": 0,
  "noodle-lasso_games_played": 0,
  "noodle-lasso_highest_stage": 0,
  "noodle-lasso_settings": {
    "sound": true,
    "music": true,
    "vibration": true
  },
  "noodle-lasso_total_score": 0
}
```

### 10.6 Implementation Priority Order

Build in this order to ensure testable milestones:

1. `index.html` + `css/style.css` — canvas centered, portrait lock, background color
2. `config.js` — palette, difficulty table, lasso config constants
3. `main.js` — Phaser init, MenuScene stub, GameScene stub
4. `game.js` — chef render, lasso draw/launch/snap, ingredient spawn/fall/catch/miss
5. `stages.js` — StageManager, quota tracking, stage clear detection
6. `ui.js` — HUD, GameOver screen, Pause overlay, Menu
7. Juice pass — add all effects from Section 9
8. `ads.js` — stub functions only
9. Manual play-test: verify death in 12s idle, 60fps, clean stage transitions
