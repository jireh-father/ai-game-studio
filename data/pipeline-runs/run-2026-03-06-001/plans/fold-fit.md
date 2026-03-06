# Game Design Document: Fold Fit

**Slug**: `fold-fit`
**One-Liner**: Fold a flat shape along dotted lines to make it fit perfectly into a 3D silhouette — origami meets Tetris.
**Core Mechanic**: Swipe along dotted fold lines on a flat 2D paper shape to fold it into the correct configuration that matches a target silhouette.
**Target Session Length**: 3-6 minutes
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Fold Fit presents players with a flat 2D paper shape displayed on screen, marked with dotted fold lines. A target silhouette floats nearby showing the desired folded shape. The player must swipe along the correct fold lines in the correct order to transform the flat shape into one that matches the target exactly. Early stages teach single folds on simple rectangles. Later stages introduce multi-fold sequences where order matters, distractor lines that look like valid folds but lead to wrong shapes, and tear lines that punish wrong choices.

The satisfaction comes from spatial reasoning — mentally rotating and folding in your head, then executing with confident swipes. Each successful fold triggers a crisp paper-crease animation and snap sound. A perfect match floods the screen with an origami crane celebration. The timer creates urgency, and the 3-wrong-folds-and-tear mechanic creates tension without being punishing early on.

The game occupies a unique niche: origami puzzle meets speed challenge. The Japanese-inspired minimal aesthetic sets it apart visually from the cluttered hyper-casual market.

### 1.2 Target Audience

Casual puzzle gamers aged 16-45 who enjoy spatial reasoning challenges. Play context: commute, waiting room, break time. Players who like Tetris, tangram puzzles, or paper-folding apps but want faster-paced mobile sessions. Low skill floor (stage 1 is a single obvious fold) but high skill ceiling (stage 21+ requires planning multi-fold sequences under time pressure).

### 1.3 Core Fantasy

You are an origami master. Raw paper arrives, and you see the folds before they happen. Your fingers crease with precision and speed. Each perfect match is a moment of elegant mastery — the paper snaps into shape exactly as you envisioned.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 3-6 minutes |
| Day 1 Retention | 40%+ |
| Day 7 Retention | 20%+ |
| Average Stages per Session | 8-15 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Show Stage: Paper + Target] → [Player Swipes Fold Line] → [Paper Folds with Animation]
        ↑                              │
        │                     [Match Check: Does folded shape = target?]
        │                              │
        │                   ┌──── YES ─┴── NO ────┐
        │                   │                       │
        │            [Stage Clear!]          [Wrong Fold Count +1]
        │            [Score + Bonus]         [3 wrongs? → Paper Tears → Game Over]
        │                   │                       │
        │            [Next Stage]            [Continue (folds left)]
        │                   │
        └───────────────────┘

[Timer expires] → [Game Over]
[Inactivity 20s] → [Game Over]
```

**Moment-to-moment gameplay**: The player sees a flat paper shape (polygon) with dotted lines across it. A smaller target silhouette in the top-right shows what the final folded shape should look like. The player studies the shape, identifies which fold line to swipe first, and swipes along it. The paper animates folding along that axis. If the fold was correct (progresses toward the target), the fold locks in. If wrong, the paper briefly shows a crumple warning and the wrong-fold counter increments. After all required folds are completed correctly, the shape snaps into the target silhouette with a satisfying match animation.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Fold | Swipe across a dotted line | Finger swipes perpendicular to a fold line to fold the paper along that axis. Swipe direction determines fold direction (toward/away). |
| Undo (stages 1-10 only) | Two-finger tap | Undoes the last fold. Training wheels removed after stage 10. |
| Pause | Tap pause icon (top-left) | Opens pause overlay |

**Control Philosophy**: Folding paper is a tactile, directional action. Swiping across a fold line mirrors the physical gesture of creasing paper. The perpendicular swipe direction is intuitive — you push the paper over the fold line. Swipe direction matters: swiping from left-to-right across a vertical fold line folds the left side over to the right.

**Fold Line Detection Algorithm**:
1. Player touches screen and drags (swipe gesture detected when drag distance > 30px)
2. System calculates swipe vector (start point → end point)
3. For each fold line on the paper, calculate perpendicular distance from swipe midpoint to fold line
4. If distance < 40px AND swipe angle is within 45 degrees of perpendicular to fold line → fold triggered
5. Fold direction = which side of the line the swipe started from (that side folds over)
6. Minimum swipe length: 60px (prevents accidental taps from triggering folds)
7. Detection zone: 40px either side of fold line (80px total width — mobile-friendly)

**Touch Area Map**:
```
┌─────────────────────────────┐
│ [||] Stage 7    Score: 450  │  ← Top bar (40px height)
│      Timer: 15s   ♦♦♦      │  ← Wrong fold indicators (diamonds)
├─────────────────────────────┤
│  ┌─────┐                    │
│  │Target│  ← Target silhouette (120x120px, top-right area)
│  │Shape │                    │
│  └─────┘                    │
│                              │
│    ┌─────────────────┐      │
│    │                  │      │
│    │   PAPER SHAPE    │      │  ← Main paper (centered, 240-320px wide)
│    │  with fold lines │      │
│    │   - - - - - -    │      │
│    │                  │      │
│    └─────────────────┘      │
│                              │
│                              │
├─────────────────────────────┤
│  Swipe across lines to fold │  ← Hint text (fades after stage 3)
└─────────────────────────────┘
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Correct fold | 50 | +10 per consecutive correct fold in stage |
| Stage clear | 100 | x1.5 if zero wrong folds ("Perfect Fold") |
| Speed bonus | 0-100 | Linear: 100 points if cleared in <5s, 0 if >15s |
| Combo (consecutive perfect stages) | — | Combo multiplier: x1 base, +0.5 per consecutive perfect stage (max x4) |

**Combo System**: Consecutive stages cleared with zero wrong folds build a combo multiplier. Combo resets on any wrong fold. Combo multiplier applies to stage clear score only. Visual: combo counter appears center-screen with escalating size and glow.

**High Score**: Stored in localStorage as `fold_fit_high_score`. Displayed on menu screen and game over screen. New high score triggers golden particle burst and "NEW BEST!" text.

### 2.4 Progression System

The game uses infinite procedural stages. Each stage generates a paper shape, fold lines, and a target silhouette based on the stage number.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-5 | Rectangle with 1 fold line. Single fold to match. Tutorial hints visible. | Timer: 20s. Easy — learn controls. |
| 6-10 | 2 fold lines, order doesn't matter. L-shapes and T-shapes introduced. | Timer: 18s. Medium — apply spatial reasoning. |
| 11-20 | 3 fold lines, ORDER MATTERS. 1 distractor line (looks valid but leads to wrong shape). | Timer: 16s. Hard — plan sequence. |
| 21-30 | 4 fold lines, 2 distractor lines. Irregular polygon shapes. "Stamp alignment" — final shape must also be positioned correctly. | Timer: 14s. Very Hard — precision + planning. |
| 31-50 | 4+ fold lines, tear lines (folding along one = instant wrong fold). Complex polygons. | Timer: 12s. Expert — avoid traps. |
| 51+ | Random mix of all elements. Timer: 12s. Shapes become increasingly complex with up to 6 fold lines and 3 distractors. | Timer: 12s (floor). Extreme — survival mode. |

### 2.5 Lives and Failure

The game uses a "wrong fold" system instead of traditional lives:

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Wrong fold (fold doesn't progress toward target) | Wrong fold counter +1, paper crumple warning | Continue playing (folds left) |
| 3 wrong folds total (across entire run) | Paper tears animation → Game Over | Watch ad for +1 wrong fold allowance (once per run) |
| Timer expires (per stage) | Paper disintegrates → Game Over | Watch ad to continue from same stage |
| Inactivity 20s (no touch input) | Paper yellows and crumbles → Game Over | Restart from stage 1 |

**Key design**: Wrong folds are cumulative across the entire run, not per-stage. This creates mounting tension — an early mistake costs you for the rest of the run. Players become more careful as their wrong fold count rises.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each stage is procedurally generated from the stage number using a deterministic algorithm.

**Shape Representation**:
- Paper shape = array of 2D polygon vertices (4-8 vertices)
- Fold lines = line segments defined by two points on the polygon boundary
- Each fold line has a `type`: `"valid"` (needed for solution), `"distractor"` (looks plausible but wrong), `"tear"` (instant wrong fold)
- Target silhouette = the polygon after applying all valid folds in correct order

**Generation Algorithm**:
```
Stage Generation Parameters:
- Seed: stage_number * 7919 (prime) + 31337
- Shape complexity: min(4 + floor(stage_number / 10), 8) vertices
- Valid fold lines: min(1 + floor(stage_number / 5), 6)
- Distractor lines: floor(max(0, stage_number - 10) / 10) (max 3)
- Tear lines: floor(max(0, stage_number - 30) / 20) (max 2)
- Timer: max(12, 20 - floor(stage_number / 5))
- Order matters: stage_number >= 11
```

**Fold Mechanics — How Folding Works on 2D Grid**:

1. **Paper state**: The paper is represented as a stack of polygon layers. Initially, one layer = the original shape.
2. **Fold operation**: When folding along line L:
   - Split the polygon along line L into two halves: "stationary" side and "folding" side
   - The folding side (determined by swipe direction) reflects across line L
   - The reflected polygon is added as a new layer on top of the stationary side
   - Visually: the folding side animates rotating 180 degrees around the fold line axis
3. **Shape after fold**: The combined bounding shape of all layers = the new paper outline
4. **Multi-fold**: Each subsequent fold operates on the current combined shape (all layers fold together along the new line)

**Target Silhouette Matching Algorithm**:
1. After all valid folds applied in correct order, compute the resulting polygon vertices
2. The target silhouette = this resulting polygon, displayed at 40% scale in the preview area
3. Match check after each fold: compare current folded polygon vertices to the intermediate target state
4. A fold is "correct" if the resulting shape matches the expected intermediate shape (within 2px tolerance)
5. Final match: all vertices of folded shape match target vertices (order-independent, within 2px tolerance)

**Distractor Fold Line Design**:
- Distractors are placed at plausible positions (parallel to valid lines, bisecting the shape symmetrically)
- A distractor fold produces a shape that does NOT match any intermediate target state
- Distractors are visually identical to valid fold lines (same dotted pattern)
- Players must mentally simulate the fold to distinguish valid from distractor

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
    0    10    20    30    40    50    60    70+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-5 | Stage 6-10 | Stage 11-20 | Stage 21-30 | Stage 31-50 | Stage 51+ |
|-----------|-----------|------------|-------------|-------------|-------------|-----------|
| Timer (seconds) | 20 | 18 | 16 | 14 | 12 | 12 |
| Fold lines (valid) | 1 | 2 | 3 | 3-4 | 4 | 4-6 |
| Distractor lines | 0 | 0 | 1 | 2 | 2-3 | 3 |
| Tear lines | 0 | 0 | 0 | 0 | 1 | 1-2 |
| Shape vertices | 4 | 4-5 | 5-6 | 6-7 | 6-8 | 6-8 |
| Order matters | No | No | Yes | Yes | Yes | Yes |
| Undo available | Yes | Yes | No | No | No | No |
| New Mechanic | Base fold | Multi-fold | Order + distractor | Stamp alignment | Tear lines | Random mix |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every stage is generated by starting with the target shape, then computing reverse-folds (unfolds) to produce the flat paper. This guarantees a valid solution always exists.
2. **Variety Threshold**: Consecutive stages must differ in at least 2 of: shape type, fold line count, fold line angles, shape size. The seed-based generator ensures variety.
3. **Difficulty Monotonicity**: Timer decreases and complexity increases monotonically. Rest stages every 5 stages (stage 5, 10, 15...) use simpler shapes with generous timers (+4s bonus).
4. **Rest Stages**: Every 5th stage is a "rest stage" — fewer fold lines, no distractors, +4s timer bonus. Visual: paper has a subtle golden tint.
5. **Shape Templates**: Stages use base shape templates (rectangle, L-shape, T-shape, cross, pentagon, hexagon, irregular) selected by `stage_number % template_count`, with fold lines procedurally placed.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Clean, minimal, Japanese-inspired paper craft aesthetic. Flat design with subtle paper texture (achieved via SVG noise filter). Soft shadows under paper to create depth. Muted warm tones with occasional accent color pops on successful actions.

**Aesthetic Keywords**: Washi, minimal, origami, zen, precision

**Reference Palette**: Warm neutral backgrounds evoking a wooden desk surface. White/cream paper shapes. Ink-black fold lines. Accent colors from traditional Japanese prints — indigo, vermillion, gold.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Paper | Warm White | #F5F0E8 | Paper shape fill |
| Paper Shadow | Warm Gray | #D4CFC7 | Paper drop shadow, fold crease shade |
| Fold Line (valid) | Indigo | #2C3E6B | Dotted fold lines |
| Fold Line (distractor) | Indigo | #2C3E6B | Same as valid (indistinguishable visually) |
| Fold Line (tear) | Crimson | #C0392B | Tear lines (stages 31+), jagged dotted pattern |
| Target Silhouette | Soft Teal | #5CA4A9 | Target shape outline (translucent fill #5CA4A933) |
| Background | Warm Tan | #E8DCC8 | Game background (wood desk) |
| Success | Gold | #D4A935 | Perfect fold glow, stage clear particles |
| Danger/Wrong | Coral Red | #E74C3C | Wrong fold flash, timer warning |
| UI Text | Dark Charcoal | #2C2C2C | Score, stage, timer text |
| UI Secondary | Muted Brown | #8B7355 | Secondary labels, hint text |
| Menu BG | Deep Indigo | #1A2744 | Menu background |

### 4.3 SVG Specifications

All graphics are SVG strings defined in `config.js` and registered as base64 textures in BootScene.

**Paper Shape** (dynamic — generated per stage, not a static SVG):
```
Rendered as Phaser Graphics polygon:
- Fill: #F5F0E8
- Stroke: #2C2C2C, width 2px
- Drop shadow: #D4CFC7, offset (3px, 3px), blur via duplicate polygon offset
- Size: 240-320px wide, centered on screen
```

**Fold Line** (rendered as Phaser Graphics dashed line):
```
- Stroke: #2C3E6B
- Width: 3px
- Dash pattern: [8, 6] (8px line, 6px gap)
- Glow on hover proximity (within 40px of touch): strokeAlpha pulses 0.6→1.0 over 300ms
```

**Tear Line** (rendered as Phaser Graphics jagged dashed line):
```
- Stroke: #C0392B
- Width: 3px
- Dash pattern: [4, 4] with 2px perpendicular jitter on each segment
- Subtle red glow aura (4px spread)
```

**Target Silhouette**:
```svg
<svg width="120" height="120" viewBox="0 0 120 120">
  <polygon points="{computed}" fill="#5CA4A933" stroke="#5CA4A9" stroke-width="2" stroke-dasharray="4,3"/>
</svg>
```

**Wrong Fold Indicator (Diamond)**:
```svg
<svg width="24" height="24" viewBox="0 0 24 24">
  <polygon points="12,2 22,12 12,22 2,12" fill="#E74C3C" stroke="#2C2C2C" stroke-width="1"/>
</svg>
```

**Wrong Fold Indicator (Empty Diamond)**:
```svg
<svg width="24" height="24" viewBox="0 0 24 24">
  <polygon points="12,2 22,12 12,22 2,12" fill="none" stroke="#8B7355" stroke-width="1.5"/>
</svg>
```

**Origami Crane (celebration)**:
```svg
<svg width="64" height="64" viewBox="0 0 64 64">
  <polygon points="32,4 48,28 56,20 52,36 64,32 48,44 52,60 32,48 12,60 16,44 0,32 12,36 8,20 16,28" fill="#D4A935" stroke="#2C2C2C" stroke-width="1.5"/>
  <line x1="32" y1="4" x2="32" y2="48" stroke="#2C2C2C" stroke-width="0.5"/>
</svg>
```

**Pause Button**:
```svg
<svg width="32" height="32" viewBox="0 0 32 32">
  <rect x="8" y="6" width="6" height="20" rx="2" fill="#2C2C2C"/>
  <rect x="18" y="6" width="6" height="20" rx="2" fill="#2C2C2C"/>
</svg>
```

**Design Constraints**:
- All SVG elements use basic shapes (polygon, rect, circle, line) — no complex paths
- Maximum 8 path/polygon elements per SVG object
- Paper shape rendered via Phaser Graphics API (not SVG) for real-time fold animation
- Animations via Phaser tweens, not SVG animate

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Fold crease shadow | Correct fold | Linear gradient darkening along fold line, 200ms fade-in. Shadow polygon rendered at fold axis. |
| Paper flip animation | Any fold | The folding half rotates 180deg around fold axis over 350ms, easeInOutQuad. Scale x from 1→0→1 (simulates 3D flip). |
| Wrong fold crumple | Wrong fold | Paper shape wobbles (rotation +-3deg, 3 oscillations, 400ms). Red tint overlay flashes 150ms. |
| Paper tear | 3 wrong folds | Paper splits along last fold line, two halves drift apart (100px over 600ms) with rotation, fade to 0. Screen shake 10px, 300ms. |
| Stage clear match | Shape matches target | Paper slides and scales to overlap target silhouette (300ms). Gold particle burst (20 particles). Target outline glows gold 500ms. |
| Perfect fold crown | Stage clear with 0 wrongs | Small origami crane SVG descends from top, lands on paper, sparkle particles (10 gold dots). |
| Timer warning | Timer < 5s | Timer text color transitions to #E74C3C. Text pulses scale 1.0→1.15 each second. |
| Timer expire | Timer = 0 | Paper yellows (#F5F0E8 → #E8D5A0 over 500ms), then crumbles (polygon vertices collapse to center over 400ms). |

---

## 5. Audio Design

### 5.1 Sound Effects

All sounds generated via Web Audio API (no external audio files). Defined as oscillator/noise configurations in `config.js`.

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Fold crease | Crisp paper crease — white noise burst with high-pass filter, quick attack | 150ms | High |
| Fold snap (correct) | Satisfying click — short sine wave pop at 800Hz with fast decay | 80ms | High |
| Wrong fold | Paper crumple — low-frequency noise burst with bandpass, longer decay | 300ms | High |
| Paper tear (death) | Extended ripping — noise sweep from high to low frequency | 500ms | High |
| Stage clear | Ascending two-note chime — sine 523Hz→784Hz (C5→G5) | 400ms | High |
| Perfect fold bonus | Ascending three-note arpeggio — 523→659→784Hz (C5→E5→G5) | 600ms | High |
| Timer tick (< 5s) | Soft metronome tick — sine 1000Hz, very short | 30ms | Medium |
| Timer expire | Descending tone — sine 400Hz→200Hz sweep | 400ms | High |
| UI button press | Subtle tap — sine 600Hz, minimal | 50ms | Low |
| Combo milestone (x2, x3, x4) | Rising power chord — layered sines at intervals | 300ms | Medium |

### 5.2 Music Concept

**Background Music**: No background music track. The game relies on ambient silence with paper sound effects to maintain the zen/origami atmosphere. This is a deliberate design choice — the satisfying fold sounds ARE the audio experience.

**Ambient Layer**: Subtle low-volume white noise (amplitude 0.02) simulating room tone. Filtered to warm frequencies. Creates a sense of calm focus.

**Audio Implementation**: Web Audio API (built-in browser). No external audio libraries needed. Sound generation functions defined in `config.js` as oscillator parameter objects.

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
               │        │           │  Pause  │──→┌─────────┐
          ┌────┴────┐   │           │ Overlay │   │  Help   │
          │  Help   │   │           └────┬────┘   │How 2Play│
          │How 2Play│   │                │        └─────────┘
          └─────────┘   │           ┌────┴────┐
                   ┌────┴────┐     │  Game   │
                   │Settings │     │  Over   │
                   │ Overlay │     │ Screen  │
                   └─────────┘     └────┬────┘
                                        │
                                   ┌────┴────┐
                                   │ Ad/     │
                                   │Continue │
                                   │ Prompt  │
                                   └─────────┘
```

### 6.2 HUD Layout

```
┌─────────────────────────────────┐
│ [||]  Stage 7    Score: 450     │  ← Top bar (44px height)
│       Timer: 15s   ◆◇◇         │  ← Wrong fold indicators (filled = used)
├─────────────────────────────────┤
│                    ┌───────┐    │
│                    │ TARGET│    │  ← Target silhouette (120x120px)
│                    │  ◇    │    │     Top-right with 16px margin
│                    └───────┘    │
│                                 │
│       ┌───────────────┐         │
│       │ ╌╌╌╌╌╌╌╌╌╌╌  │         │
│       │               │         │  ← Paper shape (centered)
│       │   ╌╌╌╌╌╌╌╌╌  │         │     240-320px wide
│       │               │         │
│       └───────────────┘         │
│                                 │
│         x2 COMBO                │  ← Combo text (appears when active)
│                                 │
│   Swipe across lines to fold    │  ← Hint (stages 1-3 only, fades)
└─────────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-right | Current score, white text 20px | Every score event |
| Stage | Top-center | "Stage N", white text 18px | On stage transition |
| Timer | Below stage label | "15s" countdown, 24px bold | Every second |
| Wrong Fold Indicators | Below timer, right-aligned | 3 diamond icons (filled=used, empty=remaining) | On wrong fold |
| Combo Counter | Center-bottom area | "x2 COMBO" / "x3 COMBO" etc., gold text | On combo change |
| Pause Button | Top-left | Pause icon (32x32px), 44x44px touch target | Always visible |
| Hint Text | Bottom center | "Swipe across lines to fold", 14px, #8B7355 | Stages 1-3 only |

### 6.3 Menu Structure

**Main Menu** (MenuScene):
- Game title "FOLD FIT" (large, 48px, #F5F0E8, centered, with subtle paper texture)
- Origami crane SVG decorative element below title
- "PLAY" button (large, 200x60px, centered, #5CA4A9 bg, #F5F0E8 text, 24px)
- "?" Help button (44x44px, circle, top-right, #8B7355 border)
- Sound toggle (speaker icon, 44x44px, top-left)
- High Score display (below play button, "BEST: 1450", 16px, #8B7355)
- Background: #1A2744

**Pause Menu** (overlay, semi-transparent #1A274499 background):
- "PAUSED" title (32px, centered)
- Resume button (160x48px, #5CA4A9)
- "?" Help button (44x44px)
- Restart button (160x48px, #8B7355)
- Menu button (160x48px, #8B7355)

**Game Over Screen** (GameOverScene, overlay):
- "PAPER TORN!" or "TIME'S UP!" title (28px, #E74C3C)
- Final Score (48px, #D4A935, with count-up animation from 0)
- "NEW BEST!" indicator (if applicable, gold glow animation)
- Stage Reached ("Stage 12", 18px)
- "Watch Ad to Continue" button (if available, 200x48px, #5CA4A9)
- "PLAY AGAIN" button (200x48px, #D4A935)
- "MENU" button (120x40px, #8B7355)

**Help / How to Play Screen** (HelpScene, overlay):
- Title: "HOW TO PLAY" (28px, #F5F0E8)
- **Visual 1**: SVG diagram showing a rectangle with a dotted line, an arrow showing swipe direction, and the resulting folded shape. Caption: "Swipe across dotted lines to fold the paper."
- **Visual 2**: SVG showing a flat shape and a target silhouette with an arrow between them. Caption: "Match the folded paper to the target shape."
- **Visual 3**: SVG showing 3 diamond indicators with one filled red. Caption: "3 wrong folds = paper tears! Game over."
- **Rules section**:
  - "Fold the paper to match the target silhouette"
  - "Each stage has a timer — fold before time runs out!"
  - "Wrong folds are permanent across your entire run"
  - "Later stages have distractor lines and order matters"
- **Tips**:
  - "Tip 1: Mentally trace the fold before swiping"
  - "Tip 2: Swipe direction matters — it determines which side folds over"
  - "Tip 3: On early stages, use two-finger tap to undo mistakes"
- "GOT IT!" button (160x48px, #5CA4A9, returns to previous screen)
- Scrollable if content exceeds viewport height
- Matches game color palette (#1A2744 bg, #F5F0E8 text)

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after death (wrong folds) | Every game over | Always (optional) |
| Rewarded | Continue after timer death | Every game over | Always (optional) |

**Note**: POC stage — no ad integration. Ad hooks are placeholder functions only.

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra wrong fold | Watch rewarded ad after 3-wrong-fold death | +1 wrong fold allowance (total 4) | Once per run |
| Time extend | Watch rewarded ad after timer death | +10s added, resume same stage | Once per run |

### 7.3 Session Economy

Players get 3 wrong folds per run. Average run lasts 8-15 stages (3-6 minutes). Most deaths occur from wrong folds (70%) or timer (30%). One rewarded ad opportunity per death. Expected ad views: 0.5-1 per session.

**Session Flow with Monetization**:
```
[Play Free] → [3 Wrong Folds / Timer Death] → [Rewarded Ad: Continue?]
                                                       │ Yes → [+1 fold / +10s]
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
games/fold-fit/
├── index.html              # Entry point
│   ├── CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
│   ├── Local CSS           # css/style.css
│   └── Local JS (ordered)  # config → stages → ads → effects → ui → game → main (LAST)
├── css/
│   └── style.css           # Responsive styles, mobile-first
└── js/
    ├── config.js           # Constants, colors, SVG strings, difficulty tables, sound params
    ├── main.js             # BootScene, Phaser init, scene array, global state (LOADS LAST)
    ├── game.js             # GameScene: paper rendering, fold detection, fold animation, matching
    ├── stages.js           # Stage generation: shapes, fold lines, targets, difficulty scaling
    ├── ui.js               # MenuScene, GameOverScene, HelpScene, HUD overlay, pause
    └── ads.js              # Ad placeholder hooks
```

### 8.2 Module Responsibilities

**config.js** (target: ~80 lines):
- `COLORS` object: all hex color constants
- `DIFFICULTY` table: timer, folds, distractors, tears by stage range
- `SCORING` constants: points per fold, stage clear, speed bonus formula
- `SIZES` constants: paper dimensions, touch targets, UI element sizes
- `SVG_STRINGS` object: all SVG markup for crane, diamonds, pause icon
- `SOUND_PARAMS` object: oscillator frequency/duration/type for each sound event
- `SHAPE_TEMPLATES` array: base polygon vertex arrays for stage generation

**main.js** (target: ~60 lines):
- `BootScene`: Register all SVG textures via `textures.addBase64()` once
- Phaser.Game config: 390x700 portrait, CANVAS renderer, transparent bg
- Scene array: `[BootScene, MenuScene, GameScene, GameOverScene, HelpScene]`
- `GameState` global object: `{ score, stage, highScore, wrongFolds, combo, settings }`
- localStorage read/write helpers

**game.js** (target: ~250 lines):
- `GameScene.create()`: Render paper polygon, fold lines, target silhouette, HUD, timer
- `GameScene.update()`: Timer countdown, inactivity check
- `handleSwipe(pointer)`: Detect which fold line was swiped, determine fold direction
- `executeFold(lineIndex, direction)`: Animate fold, update paper state, check match
- `checkMatch()`: Compare current folded polygon to target polygon
- `onWrongFold()`: Increment counter, play crumple effect, check game over
- `onStageComplete()`: Score calculation, combo update, transition to next stage
- `onGameOver(reason)`: Death effects, transition to GameOverScene
- Paper state management: vertex arrays, layer stack, fold history

**stages.js** (target: ~200 lines):
- `generateStage(stageNumber)`: Returns `{ shape, foldLines, target, timer, params }`
- `generateShape(seed, complexity)`: Create base polygon from template + variation
- `generateFoldLines(shape, count, seed)`: Place valid fold lines on shape
- `generateDistractors(shape, validLines, count, seed)`: Place distractor lines
- `generateTearLines(shape, validLines, count, seed)`: Place tear lines
- `computeTarget(shape, foldLines, foldOrder)`: Apply folds to compute target silhouette
- `isRestStage(stageNumber)`: Returns true every 5th stage
- Seeded random number generator (deterministic from stage number)

**ui.js** (target: ~250 lines):
- `MenuScene`: Title, play button, help button, sound toggle, high score
- `GameOverScene`: Score display, buttons, ad prompt
- `HelpScene`: Illustrated instructions with SVG diagrams, tips, "Got it!" button
- HUD overlay rendering (created as UIScene parallel to GameScene)
- Pause overlay
- Settings overlay (sound toggle)
- Score floating text, combo text

**ads.js** (target: ~30 lines):
- `showInterstitial()`: Placeholder — logs "Interstitial ad" to console
- `showRewarded(callback)`: Placeholder — immediately calls callback(true)
- `shouldShowInterstitial()`: Frequency check (every 3rd game over)
- `adState` tracking object

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No Howler.js needed — audio via Web Audio API.

### 8.4 Script Load Order in index.html

```html
<script src="js/config.js"></script>
<script src="js/stages.js"></script>
<script src="js/ads.js"></script>
<script src="js/ui.js"></script>
<script src="js/game.js"></script>
<script src="js/main.js"></script>  <!-- MUST BE LAST -->
```

---

## 9. Juice Specification

### 9.1 Player Input Feedback (applied to every swipe/fold attempt)

| Effect | Target | Values |
|--------|--------|--------|
| Fold line highlight | Nearest fold line | Stroke alpha pulses 0.6→1.0 over 200ms when touch is within 40px proximity |
| Haptic feedback | Device | `navigator.vibrate(15)` on fold trigger |
| Touch trail | Swipe path | 6 small circles (#5CA4A966) along swipe vector, fade over 300ms, radius 4px |

### 9.2 Core Action — Correct Fold Feedback

| Effect | Values |
|--------|--------|
| Fold animation | Folding half scales X from 1→0→1 over 350ms (easeInOutQuad), simulating 3D rotation |
| Crease shadow | Dark line (#D4CFC7) appears along fold axis, width 3px, opacity 0→0.6 over 200ms |
| Particles | Count: 8, Type: small rectangles (4x2px, #F5F0E8), Direction: perpendicular to fold line, Speed: 80-150px/s, Lifespan: 400ms, Fade: alpha 1→0 |
| Scale punch | Paper shape: scale 1.0→1.04→1.0 over 150ms |
| Sound | Paper crease (150ms) + snap click (80ms, 50ms delay) |
| Combo escalation | Particle count +3 per consecutive correct fold in stage. Snap pitch +5% per combo level. |

### 9.3 Stage Clear — Match Effects

| Effect | Values |
|--------|--------|
| Shape slide | Folded paper slides to overlap target silhouette position over 300ms (easeOutBack) |
| Gold glow | Target outline color transitions #5CA4A9→#D4A935 over 200ms |
| Particles | Count: 20, Type: circles (3px radius), Color: #D4A935, Direction: radial from target center, Speed: 100-200px/s, Lifespan: 600ms |
| Screen flash | Background flashes #D4A93522 for 100ms |
| Score float | "+150" text, color #D4A935, 24px, floats up 60px over 600ms, alpha 1→0 |
| Score HUD punch | Score text scales 1.0→1.3→1.0 over 150ms |
| Perfect fold bonus | If 0 wrong folds: origami crane descends from top (200ms), 10 gold sparkle particles, crane scales 0→1 with bounce |
| Camera zoom | 1.0→1.03→1.0 over 400ms on perfect fold |
| Hit-stop | 40ms pause before next stage loads |
| Stage transition | 400ms delay, paper fades out (200ms), new paper fades in (200ms) |

### 9.4 Wrong Fold Effects

| Effect | Values |
|--------|--------|
| Paper wobble | Rotation oscillation: 0→3deg→-3deg→2deg→-2deg→0 over 400ms |
| Red tint flash | Paper overlay #E74C3C44, 150ms, fade to 0 |
| Screen shake | Intensity: 4px, Duration: 150ms, 3 oscillations |
| Diamond fill | Wrong fold indicator diamond fills from empty to #E74C3C over 200ms |
| Sound | Paper crumple noise burst, 300ms |
| Haptic | `navigator.vibrate([30, 20, 30])` |

### 9.5 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Paper tear (3 wrong folds) | Paper splits along last fold line: two halves drift 80px apart over 500ms with +-8deg rotation, alpha 1→0. White particle confetti (15 pieces, random tumble). |
| Timer expire | Paper color shifts #F5F0E8→#E8D5A0 over 400ms, then vertices collapse to center point over 300ms (crumble). |
| Inactivity death | Paper slowly yellows over 3s warning, then crumbles as timer expire. |
| Screen shake | Intensity: 10px, Duration: 300ms |
| Screen desaturation | Game area desaturates to 30% over 300ms via tint |
| Sound | Paper tear: 500ms ripping noise. Timer: descending 400Hz→200Hz, 400ms. |
| Effect → UI delay | 700ms (death animation plays fully before game over screen appears) |
| Death → restart | **Under 1.5 seconds** (tap "Play Again" → new stage 1 in <1.5s) |

### 9.6 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{N}" text, Color: #D4A935, Size: 22px, Movement: up 60px over 600ms, Fade: alpha 1→0 over 600ms |
| Score HUD punch | Scale 1.0→1.3→1.0, Duration: 150ms, easeOutBack |
| Combo text | "x{N} COMBO!" centered, Size: 28px + 4px per combo level (max 44px), Color: #D4A935, Fade: 800ms |
| Speed bonus text | "+{N} SPEED!", Color: #5CA4A9, 18px, appears below score float |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | Performance.timing API |
| Memory Usage | <80MB | Chrome DevTools Memory panel |
| JS Bundle Size | <50KB total (excl. CDN) | File size check |
| First Interaction | <1 second after load | Time to first meaningful paint |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Use Phaser's pointer events (pointerdown, pointermove, pointerup) for swipe detection
- **Prevent Default**: Prevent pull-to-refresh and pinch-to-zoom via CSS `touch-action: none` on game container
- **Orientation**: Lock to portrait. On landscape, show rotate device overlay.
- **Resize Handler**: `window.addEventListener('resize', ...)` to recalculate game scale. Phaser Scale.RESIZE mode.
- **Safe Areas**: Account for notch via CSS `env(safe-area-inset-top)` padding on HUD

### 10.3 Fold Rendering Technical Details

**Polygon Representation**:
- Paper shape stored as array of `{x, y}` vertices in clockwise order
- Fold line stored as `{x1, y1, x2, y2, type}` where type = "valid" | "distractor" | "tear"
- Fold state tracked as array of applied folds: `[{lineIndex, direction}]`

**Fold Animation Implementation**:
1. When fold triggered, split polygon into two halves along fold line using Sutherland-Hodgman clipping
2. "Stationary" half remains in place
3. "Folding" half: create separate Phaser Graphics object
4. Animate folding half: `scaleX` tween 1→0 over 175ms (half disappears into fold line), then reflect vertices across fold line, then `scaleX` tween 0→1 over 175ms (reappears on other side)
5. Total animation: 350ms
6. After animation complete, merge into single polygon state and redraw

**Match Checking**:
- Normalize both polygons (translate centroid to origin, sort vertices by angle)
- Compare each vertex pair: if all within 4px Euclidean distance → match
- For intermediate checks: compare against expected state after N folds applied to solution sequence

### 10.4 Edge Cases

- **Resize during fold animation**: Complete animation immediately, then resize
- **Background/focus loss**: Pause game, stop timer
- **Rapid swipes**: Ignore new swipe input while fold animation is playing (350ms lockout)
- **Swipe on no fold line**: No action (ignore)
- **Swipe ambiguity (near two lines)**: Select line closest to swipe midpoint
- **Undo after correct fold**: Revert polygon state, no wrong fold penalty (stages 1-10 only)

### 10.5 Local Storage Schema

```json
{
  "fold_fit_high_score": 0,
  "fold_fit_games_played": 0,
  "fold_fit_highest_stage": 0,
  "fold_fit_settings": {
    "sound": true,
    "vibration": true
  },
  "fold_fit_total_score": 0
}
```

### 10.6 Testing Checkpoints

1. **Boot**: BootScene loads, all SVG textures registered, MenuScene displays without errors
2. **Menu**: Play, Help, Sound toggle all functional. High score displays from localStorage.
3. **Stage 1**: Rectangle with 1 fold line renders. Swipe triggers fold animation. Match detected. Score awarded.
4. **Stage 6**: 2 fold lines, both work. Order doesn't matter.
5. **Stage 11**: 3 fold lines + 1 distractor. Wrong fold on distractor increments counter. Order enforcement works.
6. **Death by wrong folds**: 3 wrong folds → tear animation → game over screen in <2s
7. **Death by timer**: Timer reaches 0 → crumble animation → game over screen
8. **Death by inactivity**: 20s no input → yellowing → crumble → game over
9. **Combo system**: Consecutive perfect stages increase multiplier, wrong fold resets
10. **Game over**: Score display, play again returns to stage 1, menu returns to menu
11. **Help screen**: Accessible from menu and pause, displays correctly, "Got it!" returns to previous
12. **Orientation**: Landscape shows rotate overlay, portrait resumes correctly
13. **Performance**: 60fps maintained during fold animations on mobile device
