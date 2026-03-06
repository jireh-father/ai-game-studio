# Game Design Document: Rule Thief

**Slug**: `rule-thief`
**One-Liner**: The rules are hidden. Make moves, observe what's legal, deduce the secret rule -- then exploit it before it changes.
**Core Mechanic**: A 4x4 grid of colored/shaped tiles. A SECRET RULE governs which tiles can be tapped. Players experiment, observe feedback, deduce the rule, then exploit it for points before the rule changes. Wrong guesses cost lives. Timer pressure forces action.
**Target Session Length**: 2-4 minutes
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Rule Thief is a deduction puzzle game played on a 4x4 grid of colored, shaped tiles. Each round, a SECRET RULE determines which tiles are "legal" to tap. The player does not know the rule -- they must experiment by tapping tiles and observing the feedback. A correct tap glows green and awards points. An incorrect tap flashes red and costs one of three lives. After the player demonstrates mastery by landing 5 correct taps in a row (a "crack"), the rule changes and a new round begins with a fresh secret rule.

The brilliance is in the "aha!" moment. The first tap or two are pure guesses. By the third, the player starts forming hypotheses: "Is it only circles? Only red? Only tiles next to blue?" Each correct or incorrect tap narrows the possibility space. When the player finally cracks it and starts confidently tapping correct tiles in rapid succession, the game delivers a massive dopamine hit through escalating juice effects. Then the rule changes, the uncertainty returns, and the cycle repeats.

A countdown timer per rule (starting at 15s, shrinking with stage) creates urgency. If the timer expires, the player dies -- this is the inactivity death mechanic. Rules start simple (color-only or shape-only) and progress to compound rules ("red AND circle", "adjacent to blue AND NOT triangle"), creating a beautiful difficulty curve from accessible to brain-melting.

### 1.2 Target Audience

Casual-to-mid-core mobile gamers aged 16-40 who enjoy brain teasers, pattern recognition, and "eureka" moments. Perfect for commute or waiting-room play. Appeals to fans of Wordle (deduction from feedback), Mastermind (hypothesis testing), and brain-training apps. Low skill floor (tap tiles, watch colors) but high skill ceiling (speed-reading compound rules, streak optimization).

### 1.3 Core Fantasy

You are a code-breaker, a detective of logic. The universe hides its rules from you, and you must crack them through observation and deduction alone. Each rule you crack makes you feel like a genius. The clock is ticking, the stakes are rising, and only your wits stand between you and oblivion.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 2-4 minutes |
| Day 1 Retention | 42%+ |
| Day 7 Retention | 20%+ |
| Average Rules Cracked per Session | 4-10 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[New Rule Generated (hidden)] --> [Timer Starts (15s)] --> [Player Taps Tile]
         ^                                                       |
         |                                          [Correct? Green glow, +points]
         |                                          [Wrong? Red flash, -1 life]
         |                                                       |
         |                                          [5 Correct in a Row?]
         |                                            |YES            |NO
         |                                     [RULE CRACKED!]   [Keep guessing]
         |                                     [Big juice burst]      |
         |                                     [Next rule]            |
         +------------------------------------------------------------+
                          |
                   [0 Lives = Game Over]
                   [Timer Expires = Game Over]
```

**Moment-to-moment gameplay:**
1. A 4x4 grid (16 tiles) is displayed. Each tile has a COLOR (red, blue, green, yellow) and a SHAPE (circle, triangle, square, diamond).
2. A secret rule is active but NOT shown to the player. Example: "Only red tiles are legal."
3. The player taps a tile. If it matches the secret rule, it glows green, plays a satisfying chime, awards points, and increments the streak counter. If it does not match, it flashes red, plays a buzz, and costs 1 life.
4. The player uses the feedback to deduce the rule. After 5 correct taps in a row (without any wrong tap breaking the streak), the rule is "cracked."
5. On crack: big celebration effect, bonus points, rule text is revealed briefly (500ms), then a new rule is generated and the grid reshuffles.
6. The timer counts down. If it reaches 0, the player dies (game over).
7. After each crack, the timer for the next rule is shorter and the rule is more complex.
8. 0 lives = game over. Timer expiry = game over.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Tap Tile | Single Tap | Tap any tile on the 4x4 grid to test if it matches the secret rule |
| Pause | Tap Pause Icon | Tap the pause button (top-right, 44x44px) to pause game and timer |
| Use Hint | Tap Hint Icon | Tap the hint icon (bottom-right, 44x44px) to reveal one property of the current rule (costs 1 hint charge) |

**Control Philosophy**: Single-tap only. The game is entirely cerebral -- the challenge is in THINKING, not in dexterity. One-tap controls keep the barrier minimal and the focus on deduction. No swipes, no holds, no complex gestures.

**Touch Area Map**:
```
+-------------------------------+
| Score: 1250  Stage 4   <3<3<3 |  <-- HUD Bar (y: 0-50px)
| Timer: |||||||||||             |  <-- Timer Bar (y: 50-70px)
+-------------------------------+
|         RULE HINT             |  <-- Hint Display Area (y: 70-110px)
|   "???" (revealed on crack)   |      Shows "???" during deduction
+-------------------------------+
|                               |
|   [T] [T] [T] [T]            |
|                               |  <-- 4x4 Tile Grid (y: 120-520px)
|   [T] [T] [T] [T]            |      Each tile ~80x80px with 10px gap
|                               |      Centered horizontally
|   [T] [T] [T] [T]            |
|                               |
|   [T] [T] [T] [T]            |
|                               |
+-------------------------------+
| Streak: ***..  [Hint]  [||]  |  <-- Bottom Bar (y: 530-580px)
|  Correct: 3/5   hint   pause |      Streak dots + hint + pause
+-------------------------------+
```

### 2.3 Scoring System

| Score Event | Base Points | Multiplier Condition |
|------------|-------------|---------------------|
| Correct Tap | 50 | x(1 + 0.5 * currentStreak). Streak 0 = 50pts, streak 4 = 150pts |
| Rule Cracked (5 in a row) | 500 | x(stageNumber). Stage 3 = 1500pts |
| Perfect Crack (0 wrong guesses) | 300 bonus | Flat bonus, no multiplier |
| Speed Bonus (crack with >50% timer left) | 200 | x(timerRemaining / timerTotal). Full timer = 200pts |
| First-Guess Correct | 100 bonus | Only awarded if the very first tap on a new rule is correct |
| Wrong Tap | -25 penalty | Deducted from score (score cannot go below 0) |

**Combo System**: The "Rule Streak" counter tracks how many consecutive rules the player cracks without dying (losing all 3 lives resets it, but losing 1 life does NOT reset rule streak). Rule Streak multiplies the Rule Cracked bonus: streak 1 = x1, streak 2 = x1.5, streak 3 = x2, streak 4+ = x2.5 (cap). This is the primary "one more round" hook.

**High Score**: Stored in localStorage under `rule_thief_high_score`. Displayed on menu screen and game over screen. New high score triggers special celebration animation (gold particle burst, "NEW BEST!" text).

### 2.4 Progression System

The game progresses through "stages" where each stage = one secret rule to crack. Stage number increases monotonically. Difficulty scales via rule complexity, timer duration, and wrong-tap penalty.

**Progression Milestones**:

| Stage Range | Rule Complexity | Timer (seconds) | Wrong Tap Penalty | New Element |
|------------|----------------|-----------------|-------------------|-------------|
| 1-3 | Single property: color only ("Only red") | 15s | -1 life | Base mechanics, learn feedback colors |
| 4-6 | Single property: shape only ("Only circles") | 14s | -1 life | Shape-based rules introduced |
| 7-10 | Single property: position ("Only top row", "Only corners") | 13s | -1 life | Position-based rules |
| 11-15 | Neighbor-based ("Adjacent to blue", "Not next to triangle") | 12s | -1 life | Spatial reasoning required |
| 16-20 | Compound AND rules ("Red AND circle") | 11s | -1 life | Two-property deduction |
| 21-30 | Compound OR rules ("Red OR circle") | 10s | -1 life | OR logic (more tiles valid = harder to narrow) |
| 31-40 | Negation rules ("NOT red", "NOT adjacent to green") | 9s | -1 life | Negation logic |
| 41-50 | Complex compound ("Red AND NOT circle", "Corner AND blue") | 8s | -1 life | Multi-property + negation |
| 51+ | Random mix of all categories, minimum 2 properties | 7s (floor) | -1 life | Survival mode, all rule types |

**Unlockable Rule Sets** (stored in localStorage, progression hook for Loop score):
- "Rookie" rule set: Stages 1-10 rules only. Unlocked by default.
- "Detective" rule set: Stages 1-20 rules. Unlocked after cracking 20 rules total (cumulative across sessions).
- "Mastermind" rule set: All rules. Unlocked after cracking 50 rules total.
- Each unlock shows a one-time toast notification on menu screen.

### 2.5 Lives and Failure

The player starts each game with **3 lives** (displayed as magnifying glass icons in the HUD). Lives are lost by tapping an incorrect tile. Lives do NOT regenerate between rules -- they persist for the entire game session.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Wrong Tap | Lose 1 life, red flash on tile, screen shake | None (irreversible) |
| 0 Lives Remaining | Immediate game over | Watch rewarded ad for 1 extra life (once per game) |
| Timer Expires | Immediate game over (inactivity death) | Watch rewarded ad for +5s bonus time (once per game) |

**Inactivity Death Guarantee**: Timer starts at 15s for stage 1 and decreases to 7s floor. If the player does nothing, they die within 15s on stage 1 (well under the 30s requirement). Even if a player taps but cannot crack the rule, the timer ensures death.

**Death-to-Restart Flow**: Game over screen appears after 600ms death effect. "Play Again" button is immediately tappable. Tapping "Play Again" resets state and starts a new game within 800ms. Total death-to-gameplay: under 1.5 seconds.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each "stage" is one secret rule. The game generates an infinite sequence of rules with increasing complexity. The 4x4 grid is reshuffled (new random color/shape assignments) after each rule crack to prevent memorization.

**Generation Algorithm**:
```
Stage Generation Parameters:
- Stage Number: sequential (1, 2, 3, ...)
- Rule Category: determined by stage range (see Progression table)
- Rule Selection: random within category, guaranteed at least 3 valid tiles and at most 12 valid tiles
- Grid Shuffle: 16 tiles, each assigned random color (4 options) and random shape (4 options)
- Timer Duration: max(7, 16 - floor(stageNumber / 3)) seconds
- Solvability Constraint: rule must match 3-12 of the 16 tiles (ensures deduction is possible but not trivial)
- Variety Constraint: new rule must differ from previous rule in at least 1 property dimension
```

**Grid Generation**:
1. Generate 16 tiles with random (color, shape) pairs from: colors = [red, blue, green, yellow], shapes = [circle, triangle, square, diamond].
2. Each tile gets a position in the 4x4 grid (row 0-3, col 0-3).
3. Select a rule from the appropriate category for the current stage.
4. Validate: count how many tiles satisfy the rule. If <3 or >12, regenerate grid (reshuffle colors/shapes) up to 10 attempts, then pick a different rule.
5. Store the valid tile indices internally for checking taps.

### 3.2 Difficulty Curve

```
Difficulty (cognitive load)
    |
100 |                                          ------------ (cap: complex compound)
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
| Timer (s) | 15 | 13-14 | 11-12 | 9-10 | 7-8 |
| Rule Properties | 1 (color) | 1 (color/shape/pos) | 1 (neighbor) | 2 (compound) | 2-3 (compound+negation) |
| Valid Tile Count | 6-10 (easy) | 4-10 | 3-8 | 3-7 | 3-6 |
| Deduction Difficulty | Trivial (1-2 taps) | Easy (2-3 taps) | Medium (3-4 taps) | Hard (3-5 taps) | Very Hard (4-5 taps) |
| Grid Reshuffle | Full random | Full random | Weighted (more variety) | Weighted (edge cases) | Adversarial (minimal clues) |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every generated rule must have 3-12 valid tiles out of 16. This ensures the player can always find correct tiles through experimentation, and that wrong taps provide meaningful narrowing information.
2. **Variety Threshold**: No two consecutive rules may be from the same sub-category. If rule N is "Only red", rule N+1 cannot be "Only blue" -- it must be a different property dimension (shape, position, etc.) or a compound rule.
3. **Difficulty Monotonicity**: Rule complexity category never decreases. A player who reaches compound rules will never see a simple color-only rule again (except in "rest" stages).
4. **Rest Stages**: Every 8th stage (stage 8, 16, 24, ...), the rule is one complexity tier easier than the current range, and the timer gets +3s bonus. This prevents cognitive fatigue and creates breathing room.
5. **Information Sufficiency**: The grid must contain at least 2 tiles that differ from valid tiles in exactly 1 property. This ensures the player can isolate the rule dimension through comparison (e.g., if "only red" is the rule, there must be non-red tiles of the same shape as a red tile, so shape alone can be ruled out).

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Clean, modern, minimalist with bold geometric shapes. Inspired by detective/noir aesthetics -- dark background with bright, saturated tile colors that pop. When a rule is cracked, the screen momentarily floods with light (the "eureka flash").

**Aesthetic Keywords**: Sleek, Cerebral, Bold, Noir-Detective, Satisfying

**Reference Palette**: Dark surfaces with jewel-toned tiles. Think a detective's desk with colorful evidence cards under a single lamp.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Dark Navy | #0D1B2A | Game background, base canvas |
| Surface | Dark Slate | #1B2838 | Grid background, card backs |
| Tile Red | Crimson | #E63946 | Red tiles |
| Tile Blue | Azure | #457B9D | Blue tiles |
| Tile Green | Emerald | #2A9D8F | Green tiles |
| Tile Yellow | Gold | #E9C46A | Yellow tiles |
| Correct Feedback | Bright Green | #06D6A0 | Correct tap glow, streak dots filled |
| Wrong Feedback | Hot Red | #FF006E | Wrong tap flash, life lost |
| UI Text | Off-White | #EDF2F4 | Score, stage number, labels |
| UI Accent | Pale Blue | #A8DADC | Timer bar, hint text, secondary UI |
| Crack Burst | Pure White | #FFFFFF | Rule cracked celebration flash |
| HUD Background | Semi-Dark | #0D1B2A CC (80% opacity) | Top/bottom bar overlays |

### 4.3 SVG Specifications

All game graphics are SVG elements generated as base64 data URIs in config.js and registered once in BootScene.

**Circle Tile** (80x80px):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <rect x="2" y="2" width="76" height="76" rx="12" fill="{TILE_BG}" stroke="{TILE_COLOR}" stroke-width="3"/>
  <circle cx="40" cy="40" r="22" fill="{TILE_COLOR}" opacity="0.9"/>
</svg>
```

**Triangle Tile** (80x80px):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <rect x="2" y="2" width="76" height="76" rx="12" fill="{TILE_BG}" stroke="{TILE_COLOR}" stroke-width="3"/>
  <polygon points="40,16 62,60 18,60" fill="{TILE_COLOR}" opacity="0.9"/>
</svg>
```

**Square Tile** (80x80px):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <rect x="2" y="2" width="76" height="76" rx="12" fill="{TILE_BG}" stroke="{TILE_COLOR}" stroke-width="3"/>
  <rect x="20" y="20" width="40" height="40" rx="4" fill="{TILE_COLOR}" opacity="0.9"/>
</svg>
```

**Diamond Tile** (80x80px):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <rect x="2" y="2" width="76" height="76" rx="12" fill="{TILE_BG}" stroke="{TILE_COLOR}" stroke-width="3"/>
  <polygon points="40,14 64,40 40,66 16,40" fill="{TILE_COLOR}" opacity="0.9"/>
</svg>
```

**Life Icon (Magnifying Glass)** (24x24px):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <circle cx="10" cy="10" r="7" fill="none" stroke="#EDF2F4" stroke-width="2"/>
  <line x1="15" y1="15" x2="21" y2="21" stroke="#EDF2F4" stroke-width="2" stroke-linecap="round"/>
</svg>
```

**Hint Icon (Lightbulb)** (44x44px):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
  <circle cx="22" cy="18" r="10" fill="#E9C46A" opacity="0.8"/>
  <rect x="18" y="28" width="8" height="6" rx="2" fill="#E9C46A" opacity="0.6"/>
  <line x1="22" y1="6" x2="22" y2="2" stroke="#E9C46A" stroke-width="1.5"/>
  <line x1="32" y1="10" x2="35" y2="7" stroke="#E9C46A" stroke-width="1.5"/>
  <line x1="12" y1="10" x2="9" y2="7" stroke="#E9C46A" stroke-width="1.5"/>
</svg>
```

**Streak Dot (filled)** (12x12px):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><circle cx="6" cy="6" r="5" fill="#06D6A0"/></svg>
```

**Streak Dot (empty)** (12x12px):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><circle cx="6" cy="6" r="5" fill="none" stroke="#A8DADC" stroke-width="1.5"/></svg>
```

**Design Constraints**:
- All SVG elements use basic shapes only (rect, circle, polygon, line). No complex paths.
- Maximum 6 elements per SVG.
- Tile SVGs are pre-generated for each (color, shape) combination at boot time: 4 colors x 4 shapes = 16 texture keys.
- Animations via Phaser tweens, never SVG animate elements.

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Correct Glow | Correct tap | Tile border color changes to #06D6A0, scale punch to 1.2x over 80ms then back to 1.0 over 120ms. Green particle ring (8 particles) expands outward from tile center, radius 0→60px over 300ms, fade alpha 1→0. |
| Wrong Flash | Wrong tap | Tile turns fully #FF006E for 150ms, then fades back over 100ms. Tile shakes horizontally: x offset +-6px, 3 oscillations over 200ms. |
| Rule Cracked Burst | 5th correct tap in a row | Full-screen white flash (alpha 0→0.6→0 over 400ms). 40 particles burst from grid center, random velocities (100-300px/s), random colors from tile palette, lifespan 600ms. Camera zoom to 1.05x over 150ms, back to 1.0 over 300ms. Rule text revealed at center in 32px bold white for 800ms then fades. |
| Timer Urgency | Timer < 4s remaining | Timer bar pulses red (#FF006E), scale oscillates 1.0→1.05→1.0 at 2Hz. Background subtly pulses darker. |
| Life Lost | Wrong tap causes life loss | Life icon shatters: splits into 4 fragments flying outward over 300ms. Screen shake 4px intensity, 200ms. Red vignette flash at screen edges, 200ms. |
| Death | 0 lives or timer expiry | Screen shake 10px intensity, 400ms. Desaturation tween (saturation 1→0 over 300ms). Grid tiles fall downward with gravity (each tile y += random 200-800px over 500ms, rotation += random 90-360deg). 600ms delay before game over screen. |
| Grid Reshuffle | After rule cracked | All 16 tiles scale down to 0 over 200ms (staggered, 20ms delay per tile from top-left), then new tiles scale up from 0 to 1.0 over 200ms (same stagger). Total animation: ~600ms. |
| New High Score | Score exceeds stored high score | Gold particle fountain (30 particles) from score text, upward velocity 200px/s, lifespan 800ms. "NEW BEST!" text pulses at 3Hz in gold #E9C46A for 1500ms. |
| Streak Dot Fill | Each correct tap in streak | Corresponding dot scales from 0 to 1.0 with bounce ease (overshoot 1.3x) over 150ms. Color fills from center outward. |

---

## 5. Audio Design

### 5.1 Sound Effects

All audio is generated programmatically using the Web Audio API (no Howler.js needed -- reduces CDN dependency). Sounds are simple oscillator-based tones.

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Correct Tap | Ascending major third (C5→E5), sine wave, quick attack | 150ms | High |
| Wrong Tap | Low buzzer, sawtooth wave at 100Hz, sharp attack/decay | 200ms | High |
| Rule Cracked | Ascending arpeggio C5→E5→G5→C6, sine wave, each note 80ms | 320ms | High |
| Perfect Crack | Same as Rule Cracked + high shimmer (triangle wave 2000Hz tremolo) | 500ms | High |
| Life Lost | Descending minor second (C4→B3), square wave | 250ms | High |
| Timer Warning | Short tick at 800Hz, sine wave, plays every 500ms when timer <4s | 60ms per tick | Medium |
| Game Over | Descending chromatic run C5→C4 over 6 notes, sine wave | 600ms | High |
| UI Button Press | Soft click, noise burst filtered at 4000Hz | 50ms | Low |
| Hint Used | Gentle chime, triangle wave at 1200Hz | 180ms | Medium |
| Streak Dot Fill | Pitch-ascending pop: 600Hz + (streak * 100Hz), sine wave | 80ms | Medium |
| New High Score | Fanfare: C5→E5→G5→C6 held, with tremolo | 1200ms | High |

### 5.2 Music Concept

**Background Music**: No continuous music. The game's tension comes from silence punctuated by feedback sounds. The ticking timer warning provides rhythmic tension in late-rule moments. This keeps the cerebral/detective atmosphere and avoids audio fatigue in short sessions.

**Music State Machine**:
| Game State | Audio Behavior |
|-----------|---------------|
| Menu | Ambient low drone (filtered noise at 200Hz, very quiet) |
| Gameplay (timer > 4s) | Silence (only tap feedback sounds) |
| Gameplay (timer < 4s) | Ticking sound every 500ms, increasing in pitch |
| Rule Cracked | Celebratory arpeggio + brief silence before next rule |
| Game Over | Descending chromatic run, then silence |
| Pause | All audio muted |

**Audio Implementation**: Web Audio API (AudioContext). Oscillator nodes created on demand, no external audio files.

---

## 6. UI/UX

### 6.1 Screen Flow

```
+------------+     +------------+     +------------+
|   Boot     |---->|   Menu     |---->|   Game     |
|  (textures)|     |  Screen    |     |  Screen    |
+------------+     +-----+------+     +------+-----+
                     |   |                   |
                +----+   +----+         +----+----+
                |             |         |  Pause  |---->+----------+
           +----+----+   +---+---+     | Overlay |     |   Help   |
           |  Help   |   |Unlock |     +----+----+     |How 2 Play|
           |How 2Play|   | Toast |          |          +----------+
           +---------+   +-------+     +----+----+
                                       |  Game   |
                                       |  Over   |
                                       | Screen  |
                                       +----+----+
                                            |
                                       +----+----+
                                       |Rewarded |
                                       |Ad Prompt|
                                       +---------+
```

### 6.2 HUD Layout

```
+-------------------------------+  (width: 360-428px)
| Score: 1250  Stage 7  [?][?][?]|  <-- Top HUD (y: 0-50px)
|  magnifying glasses = lives    |
+-------------------------------+
| [====Timer Bar (green→red)===] |  <-- Timer Bar (y: 50-68px, height 18px)
+-------------------------------+
|   Rule: "???"                  |  <-- Rule Hint Area (y: 70-108px)
|   (shows partial hint if used) |      Font: 16px, color #A8DADC
+-------------------------------+
|                                |
|   [T1] [T2] [T3] [T4]        |  <-- 4x4 Grid (y: 120-490px)
|                                |      Tiles: 80x80px, gap: 10px
|   [T5] [T6] [T7] [T8]        |      Grid total: 350x350px
|                                |      Centered: x = (screenW-350)/2
|   [T9] [T10][T11][T12]       |
|                                |
|   [T13][T14][T15][T16]       |
|                                |
+-------------------------------+
| Streak: [*][*][*][o][o]       |  <-- Bottom HUD (y: 510-560px)
|  3/5 correct    [Hint] [||]  |      Streak dots + hint btn + pause btn
+-------------------------------+
| Rule Streak: 4 rules in a row |  <-- Rule Streak Counter (y: 562-590px)
+-------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left (x:16, y:16) | Current score, 20px bold, #EDF2F4 | Every score event |
| Stage | Top-center (x:center, y:16) | "Stage N", 16px, #A8DADC | On rule crack |
| Lives | Top-right (x:right-80, y:12) | 3 magnifying glass icons, 24x24px each, 4px gap | On life change |
| Timer Bar | Below HUD (x:16, y:52, width: screenW-32, height:14px) | Filled rectangle, green→yellow→red gradient as time decreases | Every frame |
| Rule Display | Center-top (y:78) | "???" initially, partial hint if hint used, full rule on crack | On hint/crack |
| Tile Grid | Center (y:120) | 4x4 grid of 80x80px tiles, 10px gaps | On grid reshuffle |
| Streak Dots | Bottom-left (x:16, y:520) | 5 dots (filled=correct, empty=remaining), 12px each, 6px gap | On correct/wrong tap |
| Hint Button | Bottom-right (x:right-100, y:516) | Lightbulb icon, 44x44px, shows remaining hints count | On hint use |
| Pause Button | Bottom-right (x:right-50, y:516) | "||" icon, 44x44px | Never (static) |
| Rule Streak | Bottom-center (y:566) | "Rule Streak: N", 14px, #E9C46A, only visible if streak >= 2 | On rule crack |

### 6.3 Menu Structure

**Main Menu**:
- Game title "RULE THIEF" in 36px bold, color #EDF2F4, centered at y:120
- Subtitle "Crack the code." in 16px italic, #A8DADC, y:160
- **Play** button: 200x60px, centered, y:280, bg #2A9D8F, text "PLAY" 24px bold white, rounded 12px
- **How to Play** button: "?" icon 44x44px, positioned at (right-60, top+16)
- **High Score** display: "Best: {N}" at y:360, 18px, #E9C46A
- **Rules Cracked** display: "Total Rules Cracked: {N}" at y:390, 14px, #A8DADC
- **Rule Set** display: "{Rookie/Detective/Mastermind}" at y:420, 14px, #A8DADC (shows currently unlocked tier)
- **Sound Toggle**: Speaker icon 36x36px, bottom-left (x:20, y:bottom-56)

**Pause Menu** (overlay, bg #0D1B2A at 85% opacity):
- "PAUSED" text 28px bold, #EDF2F4, centered at y:180
- **Resume** button: 180x50px, y:260, bg #2A9D8F, text "Resume" 20px
- **How to Play** button: 180x50px, y:330, bg #457B9D, text "How to Play" 20px
- **Restart** button: 180x50px, y:400, bg #E63946, text "Restart" 20px
- **Menu** button: 180x50px, y:470, bg #1B2838, border #A8DADC, text "Menu" 20px

**Game Over Screen** (overlay, bg #0D1B2A at 90% opacity, appears after 600ms death delay):
- "GAME OVER" text 32px bold, #FF006E, centered at y:100
- Final Score: large 48px bold, #EDF2F4, y:160, with count-up animation (0 to final over 800ms)
- High Score indicator: "NEW BEST!" if applicable, 20px, #E9C46A, y:210, pulsing
- Rules Cracked this game: "Rules Cracked: {N}", 18px, #A8DADC, y:240
- Best Rule Streak: "Best Streak: {N}", 18px, #E9C46A, y:270
- Stage Reached: "Stage {N}", 18px, #A8DADC, y:300
- **Continue (Ad)** button: 200x50px, y:360, bg #E9C46A, text "Watch Ad for Extra Life" 16px, dark text. Only shown once per game, only if lives == 0.
- **Play Again** button: 200x50px, y:430, bg #2A9D8F, text "Play Again" 20px white
- **Menu** button: 200x50px, y:500, bg #1B2838, border #A8DADC, text "Menu" 20px

**Help / How to Play Screen** (full scene overlay, scrollable):
- Title: "HOW TO PLAY" 24px bold, #EDF2F4, y:40
- **Section 1 - The Grid**: Visual diagram showing the 4x4 grid with labeled tile examples. Text: "Tap tiles to test the SECRET RULE." 14px, #A8DADC.
- **Section 2 - Feedback**: Two tile examples side by side. Left tile with green glow labeled "CORRECT - matches the rule". Right tile with red flash labeled "WRONG - doesn't match, costs 1 life". SVG illustrations using actual game tile assets.
- **Section 3 - Crack the Rule**: Streak dots illustration. Text: "Get 5 correct in a row to CRACK the rule and advance!" 14px.
- **Section 4 - Rule Types**: Icon examples: color swatch (color rules), shape icon (shape rules), grid position diagram (position rules), arrow between tiles (neighbor rules). Text: "Rules get harder as you progress." 14px.
- **Section 5 - Hints**: Lightbulb icon. Text: "Tap the hint button to reveal one property of the rule. 1 hint per rule." 14px.
- **Section 6 - Tips**: Bullet list: "Start with tiles that differ in only one property." / "Use wrong taps to eliminate possibilities." / "Watch the timer -- guess faster under pressure!" 14px.
- **"Got it!" button**: 160x50px, bottom-center, y: bottom-80, bg #2A9D8F, text "Got it!" 20px

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after death (extra life) | Every game over (once per game) | Always (optional) |
| Rewarded | Rule Hint refill (get 1 extra hint) | Once per game session | Always (optional) |
| Banner | Menu screen only | Always visible on menu | N/A |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Life | Watch rewarded ad after death (0 lives) | +1 life, resume from current stage | Once per game |
| Time Bonus | Watch rewarded ad after timer death | +5 seconds on current rule's timer | Once per game |
| Hint Refill | Watch rewarded ad during gameplay | +1 hint charge | Once per session |
| Score Doubler | Watch rewarded ad at game over | 2x final score (for high score purposes) | Once per session |

### 7.3 Session Economy

The game is fully playable without ads. Ads provide second chances and convenience, never gatekeeping core content. Average session sees 1 game over every 2-4 minutes. Interstitials appear every 3rd game over (~8-12 min of play). Rewarded ads are optional and clearly beneficial.

**Session Flow with Monetization**:
```
[Play Free] --> [Death (0 lives or timer)]
                    |
              [Rewarded Ad: Extra Life / +5s?]
                    | Yes --> [Resume play + schedule interstitial]
                    | No  --> [Game Over Screen]
                                   |
                             [Interstitial (every 3rd game over)]
                                   |
                             [Rewarded Ad: Double Score?]
                                   | Yes --> [Score doubled, shown on screen]
                                   | No  --> [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/rule-thief/
+-- index.html              # Entry point, viewport meta, CDN Phaser, script load order
|   +-- CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
|   +-- Local CSS            # css/style.css
|   +-- Local JS (ordered)   # config -> stages -> ads -> help -> ui -> game -> main (LAST)
+-- css/
|   +-- style.css            # Responsive styles, mobile-first, safe areas
+-- js/
    +-- config.js            # Colors, SVG strings, rule definitions, difficulty tables
    +-- main.js              # BootScene (register textures), Phaser config, scene array (LOADS LAST)
    +-- game.js              # GameScene: grid, tile taps, rule checking, timer, streak, scoring
    +-- stages.js            # Rule generation, grid shuffling, difficulty scaling, rule categories
    +-- ui.js                # MenuScene, GameOverScene, HUD overlay, pause overlay
    +-- help.js              # HelpScene: illustrated how-to-play
    +-- ads.js               # Ad hooks, reward callbacks, interstitial frequency tracking
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `COLORS` object: { RED: '#E63946', BLUE: '#457B9D', GREEN: '#2A9D8F', YELLOW: '#E9C46A', BG: '#0D1B2A', ... }
- `SHAPES` array: ['circle', 'triangle', 'square', 'diamond']
- `TILE_COLORS` array: ['red', 'blue', 'green', 'yellow']
- `SVG_STRINGS` object: 16 tile SVGs (4 colors x 4 shapes) + UI icons (life, hint, streak dots)
- `DIFFICULTY_TABLE`: array of { stageMin, stageMax, ruleCategory, timerDuration, validTileRange }
- `SCORING`: { correctTap: 50, ruleCracked: 500, perfectCrack: 300, speedBonus: 200, firstGuess: 100, wrongPenalty: -25 }
- `RULE_CATEGORIES`: { COLOR: 'color', SHAPE: 'shape', POSITION: 'position', NEIGHBOR: 'neighbor', COMPOUND_AND: 'compound_and', COMPOUND_OR: 'compound_or', NEGATION: 'negation', COMPLEX: 'complex' }
- `UNLOCK_THRESHOLDS`: { detective: 20, mastermind: 50 }

**main.js** (max 300 lines, loads LAST):
- `BootScene`: reads all `SVG_STRINGS` from config.js, encodes to base64, calls `textures.addBase64()` once per key. Listens for all texture load events, then starts MenuScene.
- Phaser.Game config: type AUTO, width 400, height 700, scale mode FIT, autoCenter CENTER_BOTH, backgroundColor '#0D1B2A', scene array [BootScene, MenuScene, HelpScene, GameScene, UIScene, GameOverScene].
- `GameState` global: { score: 0, highScore: 0, lives: 3, stage: 1, ruleStreak: 0, bestRuleStreak: 0, totalRulesCracked: 0, gamesPlayed: 0, hintsRemaining: 1, settings: { sound: true } }
- localStorage load/save functions for persistence.

**game.js** (max 300 lines):
- `GameScene` extending Phaser.Scene
- `create()`: Initialize 4x4 grid of tile sprites (positioned per HUD layout), set up input handlers (tile tap), request first rule from stages.js, start timer, launch UIScene in parallel.
- `update()`: Update timer bar, check timer expiry, pulse timer if <4s.
- `handleTileTap(tile)`: Check if tile index is in valid set (from stages.js). If correct: play correct feedback, increment streak, award points, check if streak == 5 (crack). If wrong: play wrong feedback, decrement life, reset streak, check if lives == 0 (game over).
- `crackRule()`: Trigger celebration effects, reveal rule text, increment stage, call stages.js for next rule, reshuffle grid, reset streak.
- `gameOver(reason)`: Play death effects, 600ms delay, transition to GameOverScene.
- `reshuffleGrid()`: Reassign random (color, shape) to each of 16 tiles, update textures, animate scale in/out.
- `useHint()`: If hintsRemaining > 0, reveal one property of current rule in hint display area, decrement hints.

**stages.js** (max 300 lines):
- `generateRule(stageNumber)`: Determine rule category from DIFFICULTY_TABLE, generate specific rule within category, return { ruleText: string, checkFunction: (tile) => boolean, validIndices: number[], category: string }.
- Rule generators per category:
  - `generateColorRule()`: Pick random color, return rule matching that color.
  - `generateShapeRule()`: Pick random shape.
  - `generatePositionRule()`: Pick "top row" / "bottom row" / "left column" / "right column" / "corners" / "center 4" / "diagonals".
  - `generateNeighborRule()`: Pick "adjacent to {color}" or "not adjacent to {shape}".
  - `generateCompoundRule(operator)`: Combine two single-property rules with AND or OR.
  - `generateNegationRule()`: Wrap a single rule with NOT.
  - `generateComplexRule()`: Combine compound + negation.
- `generateGrid()`: Return array of 16 { color, shape, row, col } objects with random assignments.
- `validateRule(grid, rule)`: Count valid tiles, return true if count is 3-12.
- `getTimerDuration(stageNumber)`: `Math.max(7, 16 - Math.floor(stageNumber / 3))`.
- `getHintText(rule)`: Return a partial description of one property dimension of the rule.
- `isRestStage(stageNumber)`: `stageNumber % 8 === 0`.

**ui.js** (max 300 lines):
- `MenuScene`: Render title, play button, high score, rule set tier, sound toggle. Play button starts GameScene.
- `UIScene` (parallel overlay during gameplay): Render score, stage, lives, timer bar, streak dots, hint button, pause button. Listen for game events to update.
- `GameOverScene`: Render game over stats, buttons (continue/play again/menu), score count-up animation.
- `PauseOverlay`: Semi-transparent overlay with resume/restart/help/menu buttons. Pauses GameScene physics and timer.

**help.js** (max 300 lines):
- `HelpScene`: Full-screen overlay with illustrated how-to-play content. Uses game tile SVG assets for visual examples. Scrollable content container. "Got it!" button returns to previous scene.

**ads.js** (max 300 lines):
- Placeholder ad SDK hooks.
- `showInterstitial()`: Track game over count, show every 3rd.
- `showRewarded(type, callback)`: Show rewarded ad, call callback on completion.
- `AdState`: { gameOverCount: 0, extraLifeUsed: false, hintRefillUsed: false, scoreDoubleUsed: false }.

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No Howler.js needed -- audio is Web Audio API based (oscillator tones generated in code).

---

## 9. Juice Specification

### 9.1 Player Input Feedback (every tile tap)

| Effect | Target | Values |
|--------|--------|--------|
| Scale Punch (correct) | Tapped tile | Scale: 1.0 -> 1.2x over 80ms (ease: Quad.Out), recover to 1.0 over 120ms (ease: Bounce.Out) |
| Scale Punch (wrong) | Tapped tile | Scale: 1.0 -> 0.85x over 60ms, recover to 1.0 over 100ms |
| Horizontal Shake (wrong) | Tapped tile | x offset: 0 -> +6px -> -6px -> +4px -> -4px -> 0, duration 200ms |
| Particles (correct) | Tapped tile center | Count: 8, Type: small circles 4px radius, Color: #06D6A0, Direction: radial outward, Speed: 80-150px/s, Lifespan: 300ms, Alpha: 1.0 -> 0 |
| Particles (wrong) | Tapped tile center | Count: 6, Type: small Xs (two crossed lines), Color: #FF006E, Direction: radial outward, Speed: 60-100px/s, Lifespan: 250ms, Alpha: 1.0 -> 0 |
| Color Flash (correct) | Tile border | Border stroke color: current -> #06D6A0, hold 200ms, fade back 150ms |
| Color Flash (wrong) | Tile fill | Fill tint: full #FF006E for 150ms, fade back over 100ms |
| Sound (correct) | -- | Sine wave: C5 (523Hz) -> E5 (659Hz) glide, 150ms, volume 0.4. Pitch shifts up +50Hz per streak position (streak 3 = base + 150Hz) |
| Sound (wrong) | -- | Sawtooth wave: 100Hz, sharp attack 10ms, decay 190ms, volume 0.5 |

### 9.2 Core Action Feedback: Rule Cracked (5th correct tap triggers this)

| Effect | Values |
|--------|--------|
| Screen Flash | Full-screen white rectangle, alpha: 0 -> 0.6 over 100ms -> 0 over 300ms |
| Particle Burst | Count: 40, Origin: grid center (x:200, y:305), Speed: 100-300px/s radial, Colors: random from [#E63946, #457B9D, #2A9D8F, #E9C46A, #06D6A0], Size: 3-8px circles, Lifespan: 600ms, Gravity: 150px/s^2 downward, Alpha: 1.0 -> 0 over lifespan |
| Camera Zoom | Zoom: 1.0 -> 1.05x over 150ms (ease: Quad.Out), recover to 1.0 over 300ms (ease: Sine.InOut) |
| Rule Reveal Text | Center screen (x:200, y:305), text: full rule string in quotes, font: 28px bold, color: #FFFFFF, alpha: 0 -> 1.0 over 100ms, hold 600ms, alpha: 1.0 -> 0 over 200ms. Total: 900ms |
| Sound | Ascending arpeggio: C5 (523Hz, 80ms) -> E5 (659Hz, 80ms) -> G5 (784Hz, 80ms) -> C6 (1047Hz, 80ms), sine wave, volume 0.5. Total: 320ms |
| Score Popup | "+{crackBonus}" text at grid center, 32px bold, color: #E9C46A, float upward 80px over 600ms, alpha: 1.0 -> 0. If perfect crack, additional "+300 PERFECT!" text in #06D6A0 below, 24px |
| Streak Escalation | Each subsequent rule crack in a streak: particle count +10 per streak level (streak 3 = 60 particles), zoom intensity +0.01x per streak (streak 3 = 1.08x), arpeggio pitch base shifts up 100Hz per streak |

### 9.3 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Screen Shake (life lost) | Intensity: 4px random offset, Duration: 200ms, Decay: linear |
| Screen Shake (game over) | Intensity: 10px random offset, Duration: 400ms, Decay: exponential |
| Red Vignette (life lost) | Red gradient overlay at screen edges, alpha 0 -> 0.4 -> 0 over 300ms |
| Desaturation (game over) | Pipeline: saturation 1.0 -> 0.0 over 300ms via Phaser postFX or tint all sprites gray |
| Tile Cascade (game over) | Each tile: delay = (row * 4 + col) * 30ms, then y += 600px over 400ms with rotation += random(90, 360)deg, ease: Quad.In (accelerating fall) |
| Life Icon Shatter (life lost) | Icon splits into 4 triangular fragments, each flies outward 60px in diagonal direction over 300ms, alpha 1.0 -> 0, rotation += 180deg |
| Sound (life lost) | Square wave: C4 (262Hz) -> B3 (247Hz) descending, 250ms, volume 0.4 |
| Sound (game over) | Sine wave: descending chromatic C5 -> B4 -> Bb4 -> A4 -> Ab4 -> G4, each note 100ms, volume 0.5. Total: 600ms |
| Effect -> UI delay | 600ms from death trigger to GameOverScene display |
| Death -> restart | **Total under 1.5 seconds**: 600ms death effect + immediate GameOverScene. "Play Again" tap -> 800ms transition to fresh GameScene. |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating Text (correct tap) | "+{N}" where N = points awarded, Color: #06D6A0, Font: 18px bold, Start: tile center, Movement: float up 60px over 500ms, Alpha: 1.0 -> 0 over 500ms, ease: Quad.Out |
| Floating Text (crack bonus) | "+{N}" where N = crack bonus, Color: #E9C46A, Font: 28px bold, Start: grid center, Movement: float up 80px over 700ms, Alpha: fade after 400ms |
| Score HUD Punch | Scale: 1.0 -> 1.3x over 80ms, recover to 1.0 over 150ms, ease: Back.Out |
| Combo Text (streak) | After 3+ streak: "STREAK x{N}" appears below score, 16px bold, #E9C46A, pulsing alpha 0.7-1.0 at 2Hz, disappears on streak break |
| Score Counter Animation | Score text counts up rapidly from old value to new value over 200ms (not instant jump) |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | Performance.timing API |
| Memory Usage | <50MB | Chrome DevTools Memory panel |
| JS Bundle Size | <200KB total (excl. CDN) | File size check |
| First Interaction | <500ms after load | Time to first meaningful paint |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Use Phaser's input system with `pointer` events (handles both touch and mouse)
- **Prevent Default**: Prevent pull-to-refresh, pinch-to-zoom, and double-tap-to-zoom via CSS `touch-action: none` on canvas
- **Orientation**: Portrait lock via CSS. On landscape detection, show "Please rotate" overlay using `visibility:hidden; height:0; overflow:hidden` pattern (NEVER `display:none` on Phaser canvas)
- **Safe Areas**: `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)` on game container
- **Throttling**: Detect `visibilitychange` event, pause game timer and audio when backgrounded
- **Asset Loading**: All SVGs generated in code, no network requests for assets. Minimal boot time.
- **Resize Handler**: `window.addEventListener('resize', ...)` recalculates game dimensions. Phaser Scale Manager handles canvas resize.

### 10.3 Touch Controls

- **Touch Target Size**: All tiles are 80x80px (well above 44px minimum). All buttons minimum 44x44px.
- **Gesture Recognition**: Single tap only. No swipe, hold, or multi-touch needed.
- **Feedback**: Visual (color flash + scale punch) and audio (oscillator tone) on every tap. Haptic vibration via `navigator.vibrate(30)` on correct tap, `navigator.vibrate([50, 30, 50])` pattern on wrong tap (if vibration setting enabled).
- **Input Buffering**: During tile animation (correct glow / wrong flash, ~200ms), buffer one tap. Process buffered tap after animation completes.
- **Debounce**: Ignore taps on the same tile within 300ms to prevent double-tap accidents.
- **Dead Zone**: No dead zones needed (no swipe gestures).

### 10.4 Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome (Android) | 80+ | Primary target |
| Safari (iOS) | 14+ | Web Audio API requires user gesture to start AudioContext |
| Samsung Internet | 14+ | Test touch event handling |
| Firefox (Android) | 90+ | Secondary target |

### 10.5 Local Storage Schema

```json
{
  "rule_thief_high_score": 0,
  "rule_thief_games_played": 0,
  "rule_thief_highest_stage": 0,
  "rule_thief_total_rules_cracked": 0,
  "rule_thief_best_rule_streak": 0,
  "rule_thief_unlocked_tier": "rookie",
  "rule_thief_settings": {
    "sound": true,
    "vibration": true
  },
  "rule_thief_ad_state": {
    "game_over_count": 0
  }
}
```

### 10.6 Rule Engine Implementation Notes

**Rule Representation**: Each rule is an object `{ text: string, check: (tile) => boolean, hintText: string, category: string }`. The `check` function receives a tile object `{ color, shape, row, col, neighbors }` and returns true/false.

**Neighbor Calculation**: For each tile at (row, col), neighbors are the tiles at (row-1,col), (row+1,col), (row,col-1), (row,col+1) -- orthogonal only (not diagonal). Edge/corner tiles have 2-3 neighbors.

**Rule Examples by Category**:
- COLOR: `{ text: "Only RED tiles", check: t => t.color === 'red' }`
- SHAPE: `{ text: "Only CIRCLES", check: t => t.shape === 'circle' }`
- POSITION: `{ text: "Only TOP ROW", check: t => t.row === 0 }`
- POSITION: `{ text: "Only CORNERS", check: t => (t.row === 0 || t.row === 3) && (t.col === 0 || t.col === 3) }`
- NEIGHBOR: `{ text: "Adjacent to BLUE", check: t => t.neighbors.some(n => n.color === 'blue') }`
- COMPOUND_AND: `{ text: "RED and CIRCLE", check: t => t.color === 'red' && t.shape === 'circle' }`
- COMPOUND_OR: `{ text: "RED or CIRCLE", check: t => t.color === 'red' || t.shape === 'circle' }`
- NEGATION: `{ text: "NOT triangles", check: t => t.shape !== 'triangle' }`
- COMPLEX: `{ text: "RED and NOT circle", check: t => t.color === 'red' && t.shape !== 'circle' }`

**Stage Transitioning Guard**: Use a `stageTransitioning` boolean flag set to true during grid reshuffle animation (~600ms). While true, all tile taps are ignored. Reset to false after reshuffle completes. This prevents the duplicate-state-increment bug pattern from run-007.

**GameOver Flag Ordering**: Set `gameOver = true` BEFORE triggering death effects. Check `if (this.gameOver) return;` at the top of `handleTileTap()`, `update()`, and timer callback to prevent post-death interactions.

### 10.7 Known Anti-Patterns to Avoid

1. **CSS `display:none` on Phaser canvas**: Use `visibility:hidden; height:0; overflow:hidden` instead (run-007 bug).
2. **`addBase64()` on scene restart**: Register ALL textures once in BootScene only. Tile visual changes use `setTexture(key)` to swap pre-registered textures.
3. **Text blocking buttons**: All buttons use `setInteractive()`. Text overlays on buttons either share the same interactive zone or have `input.enabled = false`.
4. **Timer + `timeScale = 0`**: For pause, stop the timer via `this.timerEvent.paused = true` or use a manual delta-time accumulator. Never use `this.time.timeScale = 0`.
5. **Script load order**: index.html must load `main.js` LAST (after config, stages, ads, help, ui, game).
6. **HUD literal init**: Score text must initialize from `GameState.score`, not hardcoded `'0'`.
7. **Event race in `create()`**: UIScene listens for game events. Guard all event handlers with null checks on referenced objects.
