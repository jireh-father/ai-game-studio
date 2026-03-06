# Game Design Document: Shadow Match

**Slug**: `shadow-match`
**One-Liner**: Drag and rotate pieces to fill moving shadow silhouettes before they drift off-screen.
**Core Mechanic**: Speed tangram -- drag geometric pieces from a tray into a drifting shadow silhouette. Tap pieces to rotate 90 degrees. Shadow moves across the screen; complete the puzzle before it escapes. Pieces snap to a grid (no pixel-perfect). Wrong placements bounce back with a time penalty. Consecutive perfect completions build a Shadow Streak multiplier.
**Target Session Length**: 2-5 minutes
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Shadow Match is a speed-tangram puzzle where players race against drifting shadow silhouettes. Each stage presents a shadow shape slowly gliding across the screen from left to right. The player must drag geometric pieces from a bottom tray and place them onto the shadow's grid cells to complete the silhouette before it escapes off the right edge.

The unique twist -- the "Shadow Thief" mechanic -- is that the shadow is always moving. Early stages drift slowly (0.3 px/frame), giving ample time to think. By stage 20+, shadows race across the screen, demanding instant spatial recognition and muscle-memory placement. This transforms a traditionally cerebral puzzle into an adrenaline-pumping reflex challenge.

Wrong placements (piece doesn't fit the remaining shadow cells) bounce the piece back to the tray with a 1.5-second timer penalty (the shadow lurches forward). Consecutive perfect completions (zero wrong placements in a stage) build a "Shadow Streak" that multiplies score. The streak resets on any wrong placement. This creates a risk/reward tension: rush for speed or be deliberate for streak bonuses. Inactivity causes the shadow to escape off-screen (death). The warm sunset/golden hour visual theme makes shadows thematic and visually cohesive.

### 1.2 Target Audience

Casual mobile gamers aged 14-45 who enjoy spatial puzzles with a time-pressure twist. Perfect for commute sessions, waiting rooms, or quick breaks. Appeals to tangram/jigsaw fans who want faster pacing, and reflex-game fans who want more cognitive depth. Low skill floor (drag shapes into obvious slots) but high skill ceiling (fast pattern recognition under extreme drift speed, streak optimization).

### 1.3 Core Fantasy

You are a Shadow Catcher -- mysterious silhouettes drift through your world like fleeting memories. You must capture them by filling them with solid pieces before they vanish forever. Each captured shadow adds to your collection, and perfect captures build a supernatural streak that amplifies your power. The golden-hour aesthetic evokes the magic hour when shadows are longest and most dramatic.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 2-5 minutes |
| Day 1 Retention | 42%+ |
| Day 7 Retention | 20%+ |
| Average Stages per Session | 8-15 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Shadow Appears (drifting right)] --> [Scan Shape + Pick Piece from Tray]
         ^                                         |
         |                                   [Drag to Shadow Grid]
         |                                         |
         |                              [Piece Fits?]----NO--->[Bounce Back + 1.5s Penalty]
         |                                   YES   |                        |
         |                                   |     +------------------------+
         |                            [Piece Snaps In]
         |                                   |
         |                          [Shadow Complete?]---NO--->[Continue Placing]
         |                                  YES                       |
         |                                   |                        |
         |                            [Score + Streak Check]          |
         |                                   |                        |
         +------[Next Shadow Spawns] <-------+                        |
                        |                                             |
                 [Shadow Escapes Off-Screen = Death]                  |
                 [Inactivity 10s = Shadow Lurches to Edge = Death]    |
```

**Moment-to-moment gameplay:**
1. A shadow silhouette appears on the left side of the screen and begins drifting right at the current stage's drift speed.
2. The player sees 3-7 geometric pieces in the bottom tray.
3. The player drags a piece from the tray upward into the shadow zone. The shadow area is overlaid with a snap grid (cell size: 40x40px).
4. If the piece's cells align with unfilled shadow cells, it snaps into place with a satisfying pop. If not, it bounces back to the tray and the shadow lurches 60px forward (time penalty).
5. The player continues placing pieces until the entire shadow is filled.
6. On completion: score awarded, streak incremented (if no wrong placements), next shadow spawns.
7. If the shadow's rightmost edge passes x=428 (screen right), the shadow escapes -- game over.
8. If the player does nothing for 10 seconds, the shadow accelerates to 8 px/frame and escapes within 3-5 seconds (inactivity death within 15s total).

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Pick Up Piece | Touch & hold on tray piece | Piece lifts from tray, follows finger. Ghost outline shows on shadow grid. |
| Place Piece | Release over shadow grid | If valid placement (all piece cells overlap unfilled shadow cells), piece snaps in. Otherwise bounces back. |
| Rotate Piece | Tap piece in tray | Rotates piece 90 degrees clockwise. Rotation animates in 120ms. |
| Cancel Drag | Drag back to tray area (y > 520px) | Piece returns to its tray slot without penalty. |

**Control Philosophy**: Drag-and-drop is the most intuitive spatial mapping for "put shape into hole." Tap-to-rotate keeps rotation fast and distinct from drag. No swipe gestures to avoid conflict with drag. Cancel by dragging back prevents accidental placements.

**Touch Area Map**:
```
+-------------------------------+
| Score: 1250   Stage 7   x3   |  <-- HUD Bar (y: 0-50px)
+-------------------------------+
|                               |
|                               |
|     SHADOW ZONE               |  <-- Shadow + Grid Area (y: 50-480px)
|     (shadow drifts L->R)      |      Shadow rendered as dark silhouette
|     [snap grid 40x40px]       |      Grid visible when piece is held
|                               |
|                               |
+-------------------------------+
| DRIFT PROGRESS BAR            |  <-- Drift indicator (y: 480-500px)
| [=====>               ]      |      Shows shadow's x-position
+-------------------------------+
|                               |
|  [piece] [piece] [piece]      |  <-- Piece Tray (y: 510-700px)
|  [piece] [piece]              |      3-7 pieces per stage
|                               |
|  tap to rotate, drag to place |
+-------------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Piece placed correctly | 50 | x streak multiplier |
| Shadow completed | 200 + (pieces_count * 30) | x streak multiplier |
| Perfect completion (0 wrong placements) | +150 bonus | Streak incremented |
| Speed bonus (completed before shadow reaches midpoint) | +100 | Only if also perfect |
| Wrong placement | -0 points (no point loss) | Streak resets to x1 |

**Combo System -- Shadow Streak**:
- Starts at x1. Each perfect stage completion increments streak by 1 (x1 -> x2 -> x3 ...).
- Streak multiplier applies to ALL score events for the next stage.
- Any wrong placement in a stage resets streak to x1 after that stage completes.
- Streak caps at x10. At x10, score text turns gold and pulses.
- Streak counter displayed prominently in HUD as "x{N}" with flame icon at x5+.

**High Score**: Stored in localStorage as `shadow_match_high_score`. Displayed on menu screen and game over screen. New high score triggers celebration effect (gold particles + "NEW BEST!" text).

### 2.4 Progression System

The game uses infinite procedural stages. Each stage generates a new shadow silhouette and piece set. Difficulty increases through shadow complexity, drift speed, and piece count.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-5 | Basic shapes (L, T, square, line). 3 pieces per shadow. | Drift: 0.3 px/frame. Simple rectangular silhouettes. |
| 6-10 | Irregular silhouettes. 4 pieces per shadow. | Drift: 0.5 px/frame. Silhouettes use diagonal edges. |
| 11-15 | Compound shapes (U, Z, cross). 5 pieces. | Drift: 0.7 px/frame. Some pieces only fit in one orientation. |
| 16-20 | Distractor pieces (1 extra piece that doesn't fit). 5+1 pieces. | Drift: 0.9 px/frame. Must identify the decoy. |
| 21-30 | Complex silhouettes (animals, objects). 6 pieces. 1 distractor. | Drift: 1.1 px/frame. Tight grid constraints. |
| 31-50 | 7 pieces, 2 distractors. Mirror/flip pieces introduced. | Drift: 1.3 px/frame. Some pieces need specific rotation. |
| 51+ | Max complexity. Drift: 1.5 px/frame (capped). Random mix of all mechanics. | Drift capped at 1.5. Piece count capped at 7+2 distractors. |

**Piece Collection (addiction mechanic)**: Every 5 stages, a new piece shape is "unlocked" and added to a visual collection grid on the menu screen. 30 unique shapes to collect. Collection progress shown as "{N}/30" with silhouette previews of locked shapes. This addresses the low Loop score.

**Daily Challenge (addiction mechanic)**: One unique hand-designed silhouette per day. Completing it awards a special "Daily Shadow" badge. Consecutive daily completions build a "Daily Streak" counter (separate from in-game streak). Displayed on menu screen. Missing a day resets the counter. This addresses the low Loop score by creating return motivation.

### 2.5 Lives and Failure

The game uses a single-life system. One death = game over. This creates high stakes and short, intense sessions.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Shadow escapes off-screen (x > 428px) | Immediate game over | Watch rewarded ad to rewind shadow to midpoint (once per run) |
| Inactivity (10s no input) | Shadow accelerates to 8 px/frame, escapes in 3-5s | Resume touching to cancel acceleration (if caught within 2s) |

**Death Flow**: Shadow reaches screen edge -> shadow shatters into fragments (400ms animation) -> screen darkens (200ms) -> game over screen slides up (total: under 1.5 seconds from death to restart option).

**Inactivity Death Detail**:
- 0-10s no input: normal drift speed continues.
- 10s mark: warning pulse on shadow (3 red flashes, 100ms each). HUD text "SHADOW ESCAPING!" appears.
- 10-12s: shadow drift speed ramps to 8 px/frame.
- 12-15s: shadow exits screen. Game over.
- If player touches screen during 10-12s window, acceleration cancels and drift returns to normal stage speed.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each stage generates a shadow silhouette and a matching set of pieces algorithmically. The system guarantees solvability and visual variety.

**Generation Algorithm**:
```
Stage Generation Parameters:
- Seed: stage_number * 7919 + daily_salt (ensures reproducibility for daily challenge)
- piece_count: min(3 + floor(stage / 3), 7)
- distractor_count: stage < 16 ? 0 : (stage < 31 ? 1 : 2)
- grid_size: 8x8 cells (each cell 40x40px = 320x320px shadow area)
- shadow_cells: piece_count * avg_piece_size (each piece is 3-5 cells)
- drift_speed: min(0.3 + (stage - 1) * 0.04, 1.5) px/frame
- shadow_start_x: -40 (just off left edge)
- shadow_escape_x: 428 (right edge of 428px viewport)
- time_budget: (428 + 40) / drift_speed / 60 seconds

Silhouette Generation:
1. Start with a random seed cell near grid center.
2. Grow silhouette using random adjacent cell selection (up/down/left/right).
3. Add cells until shadow_cells count reached.
4. Validate silhouette is contiguous (BFS check).
5. Run piece decomposition: split silhouette into piece_count non-overlapping polyominos.
6. Each piece: 3-5 cells, must be a valid polyomino (contiguous).
7. Assign random initial rotation (0/90/180/270) to each piece.
8. Generate distractor pieces: valid polyominos of 3-5 cells that do NOT fit remaining shadow.
9. Shuffle piece order in tray.
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

| Parameter | Stage 1-5 | Stage 6-15 | Stage 16-30 | Stage 31-50 | Stage 51+ |
|-----------|-----------|------------|-------------|-------------|-----------|
| Drift Speed (px/frame) | 0.3-0.46 | 0.5-0.86 | 0.9-1.26 | 1.3-1.5 | 1.5 (cap) |
| Piece Count | 3 | 4-5 | 5 | 6-7 | 7 |
| Distractor Count | 0 | 0 | 1 | 2 | 2 |
| Cells per Piece (avg) | 3 | 3-4 | 4 | 4-5 | 4-5 |
| Shadow Total Cells | 9 | 12-20 | 20-25 | 24-35 | 28-35 |
| Rotation Variety | 0/90 only | 0/90/180 | 0/90/180/270 | All + mirrors | All + mirrors |
| Time Budget (seconds) | ~26s | ~9-15s | ~5-8s | ~4-5s | ~4s |
| New Mechanic | None | Irregular outlines | Decoy pieces | Mirror pieces | Random mix |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: The silhouette is literally composed of the solution pieces. Decomposition produces pieces first, then the silhouette is their union. Solvability is guaranteed by construction.
2. **Variety Threshold**: Consecutive silhouettes must differ in at least 60% of cell positions. The seed algorithm ensures this via prime-based hashing.
3. **Difficulty Monotonicity**: Drift speed never decreases. Piece count never decreases. Distractor count never decreases.
4. **Rest Stages**: Every 10th stage (10, 20, 30...) is a "Golden Shadow" -- the shadow drifts 30% slower than the current difficulty would dictate, and the silhouette is a recognizable shape (star, heart, arrow). Completing it awards 500 bonus points.
5. **Boss Stages**: Every 15th stage (15, 30, 45...) is a "Giant Shadow" -- uses a 10x10 grid instead of 8x8, with 8+ pieces. The shadow drifts at normal speed. Completing it awards 1000 bonus points and unlocks a special collection piece.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Warm minimalist with a golden-hour sunset aesthetic. The game world is bathed in amber and deep orange tones, with shadows rendered as deep indigo/charcoal silhouettes. Pieces are warm-toned geometric shapes with subtle gradients. The overall feel is calm yet urgent -- a beautiful sunset you're racing against.

**Aesthetic Keywords**: Golden hour, silhouette, warm minimalism, geometric, twilight

**Reference Palette**: Evokes the last 30 minutes of daylight -- long shadows, warm sky, deep contrasts. Think Monument Valley meets tangram puzzles.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Sky Gradient Top | Warm Amber | #F4A460 | Background gradient top |
| Sky Gradient Bottom | Deep Orange | #E8651A | Background gradient bottom |
| Shadow Silhouette | Charcoal Indigo | #2C2137 | The shadow shape to fill |
| Shadow Grid | Soft Lavender | #9B8EC4 | Grid lines visible when dragging a piece |
| Piece Fill (default) | Sunset Gold | #FFB347 | Piece body fill color |
| Piece Fill (placed) | Warm Coral | #FF6B6B | Piece after snapping into shadow |
| Piece Outline | Deep Brown | #5C3A21 | 2px stroke on all pieces |
| Streak Fire | Bright Gold | #FFD700 | Streak counter text, flame particles |
| HUD Text | Cream White | #FFF8E7 | Score, stage, labels |
| HUD Background | Dark Plum | #1A0A2E | Semi-transparent top bar bg (alpha 0.7) |
| Danger/Warning | Hot Red | #FF3B3B | Inactivity warning flashes, escape warning |
| Success/Perfect | Emerald Green | #2ECC71 | Perfect completion flash, speed bonus |
| Drift Bar BG | Dark Gray | #333333 | Progress bar background |
| Drift Bar Fill | Sunset Orange | #FF8C42 | Progress bar fill (shadow position) |

### 4.3 SVG Specifications

All game graphics are rendered as SVG elements generated in code via `textures.addBase64()` in BootScene.

**Piece Shapes** (polyominos rendered dynamically):
```svg
<!-- Example: L-shaped piece (3 cells). Each cell is 38x38px with 1px gap. -->
<svg xmlns="http://www.w3.org/2000/svg" width="78" height="118" viewBox="0 0 78 118">
  <!-- Cell (0,0) -->
  <rect x="1" y="1" width="36" height="36" rx="4" fill="#FFB347" stroke="#5C3A21" stroke-width="2"/>
  <!-- Cell (0,1) -->
  <rect x="1" y="41" width="36" height="36" rx="4" fill="#FFB347" stroke="#5C3A21" stroke-width="2"/>
  <!-- Cell (1,1) -->
  <rect x="41" y="41" width="36" height="36" rx="4" fill="#FFB347" stroke="#5C3A21" stroke-width="2"/>
  <!-- Inner highlight for depth -->
  <rect x="4" y="4" width="30" height="30" rx="2" fill="none" stroke="#FFE0A0" stroke-width="1" opacity="0.5"/>
  <rect x="4" y="44" width="30" height="30" rx="2" fill="none" stroke="#FFE0A0" stroke-width="1" opacity="0.5"/>
  <rect x="44" y="44" width="30" height="30" rx="2" fill="none" stroke="#FFE0A0" stroke-width="1" opacity="0.5"/>
</svg>
```
Note: Pieces are generated dynamically from cell arrays. The SVG is constructed at runtime from the piece's cell configuration. Each cell is a 38x38 rounded rect with 2px gap between cells. Developer generates SVG string per piece shape programmatically -- no hardcoded piece SVGs.

**Shadow Silhouette**:
```svg
<!-- Shadow is a single filled polygon covering all shadow cells. -->
<!-- Generated dynamically from cell array. Example: 9-cell shadow. -->
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <path d="M0,0 L120,0 L120,40 L160,40 L160,120 L120,120 L120,80 L40,80 L40,120 L0,120 Z"
        fill="#2C2137" opacity="0.85"/>
  <!-- Subtle inner glow for depth -->
  <path d="M2,2 L118,2 L118,38 L158,38 L158,118 L118,118 L118,78 L38,78 L38,118 L2,118 Z"
        fill="none" stroke="#9B8EC4" stroke-width="1" opacity="0.3"/>
</svg>
```
Note: Shadow outline is computed from the cell array using a marching-squares-like contour algorithm to produce a single path. Developer implements `generateShadowSVG(cells)` function.

**Background Gradient**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="428" height="760" viewBox="0 0 428 760">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F4A460"/>
      <stop offset="60%" stop-color="#E8651A"/>
      <stop offset="100%" stop-color="#1A0A2E"/>
    </linearGradient>
  </defs>
  <rect width="428" height="760" fill="url(#sky)"/>
  <!-- Decorative sun disc at top -->
  <circle cx="214" cy="60" r="30" fill="#FFD700" opacity="0.4"/>
</svg>
```

**Tray Background**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="428" height="200" viewBox="0 0 428 200">
  <rect width="428" height="200" rx="16" fill="#1A0A2E" opacity="0.8"/>
  <rect x="2" y="2" width="424" height="196" rx="14" fill="none" stroke="#9B8EC4" stroke-width="1" opacity="0.3"/>
</svg>
```

**Streak Flame Icon** (used at x5+ streak):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
  <path d="M12,0 C12,0 4,10 4,18 C4,24 8,28 12,32 C16,28 20,24 20,18 C20,10 12,0 12,0Z"
        fill="#FFD700" stroke="#FF8C42" stroke-width="1"/>
  <path d="M12,8 C12,8 8,14 8,20 C8,24 10,26 12,28 C14,26 16,24 16,20 C16,14 12,8 12,8Z"
        fill="#FF6B6B" opacity="0.7"/>
</svg>
```

**Design Constraints**:
- All SVG elements use basic shapes (rect, circle, path) only -- no filters, no feBlur, no clipPath.
- Maximum 20 path elements per SVG object.
- Pieces generated dynamically from cell arrays (max 5 cells = max 10 rects per piece SVG).
- Shadow silhouette is a single `<path>` element with inner glow stroke.
- All animations via Phaser tweens, not SVG `<animate>`.

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Grid reveal | Player picks up a piece | Shadow grid lines fade in (alpha 0 -> 0.6, 150ms). Grid lines are 1px #9B8EC4 at 40px intervals within shadow bounds. |
| Ghost preview | Piece held over shadow | Semi-transparent (alpha 0.3) copy of piece rendered at nearest snap position. Green tint (#2ECC71) if valid, red tint (#FF3B3B) if invalid. |
| Snap pop | Piece placed correctly | Piece scales 1.0 -> 1.15 -> 1.0 (80ms). 8 small particles (4px circles, #FFD700) burst radially from piece center, lifespan 300ms. |
| Bounce back | Wrong placement | Piece shakes horizontally (offset +/-8px, 3 cycles, 200ms total), then tweens back to tray slot (150ms). Shadow lurches 60px right (200ms tween). |
| Shadow complete | All cells filled | All placed pieces flash white (alpha overlay 0 -> 0.8 -> 0, 200ms). Shadow dissolves into 20 particles rising upward (lifespan 600ms). Score floats up. |
| Perfect completion | Stage done with 0 wrong placements | Green flash across screen (full-width rect, alpha 0 -> 0.3 -> 0, 150ms). "PERFECT!" text scales up from 0 -> 1.2 -> 1.0 at screen center (300ms). Streak counter pulses. |
| Shadow escape warning | Shadow x > 300px | Shadow silhouette pulses red (tint cycle #2C2137 <-> #FF3B3B, 200ms per cycle). Drift bar turns red. |
| Inactivity warning | 10s no input | Screen edges flash red (3 pulses, 100ms each). "SHADOW ESCAPING!" text appears center-screen in #FF3B3B, 28px bold. |
| Shadow shatter (death) | Shadow exits screen | Shadow breaks into 12 triangular fragments that fly outward with random velocities and spin (400ms). Screen tint darkens to alpha 0.6 (200ms). |
| New high score | Score > stored high | Gold particle fountain (30 particles, rising, lifespan 1200ms). "NEW BEST!" text pulses gold at game over screen. |

---

## 5. Audio Design

### 5.1 Sound Effects

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Piece pick up | Soft wooden click, mid-pitch | 80ms | Medium |
| Piece rotate | Quick ratchet/click, ascending pitch | 100ms | Medium |
| Piece snap (correct) | Satisfying pop/thunk, like puzzle piece clicking in | 150ms | High |
| Wrong placement (bounce) | Dull thud + short buzz | 200ms | High |
| Shadow complete | Ascending 3-note chime (C5-E5-G5) | 400ms | High |
| Perfect completion | Bright fanfare with shimmer (C5-E5-G5-C6) | 600ms | High |
| Streak milestone (x5, x10) | Rising whoosh + sparkle | 500ms | Medium |
| Shadow escape warning | Low pulsing alarm tone | 300ms (loops) | High |
| Shadow shatter (death) | Glass breaking + low reverb impact | 500ms | High |
| Game over | Descending tone (G4-E4-C4), somber | 800ms | High |
| UI button press | Subtle soft click | 60ms | Low |
| Speed bonus | Quick ascending arpeggio | 300ms | Medium |
| Collection unlock | Magical chime with sparkle | 700ms | Medium |

### 5.2 Music Concept

**Background Music**: No continuous music (keeps file size minimal and avoids audio fatigue in short sessions). Instead, ambient atmospheric hum that shifts with game state. Implemented as looping Phaser audio with crossfade.

**Music State Machine**:
| Game State | Music Behavior |
|-----------|---------------|
| Menu | Warm ambient pad, slow pulse, volume 0.3 |
| Early Stages (1-10) | Same ambient pad, volume 0.2 (unobtrusive) |
| Mid Stages (11-30) | Ambient pad pitch shifts up slightly, volume 0.25 |
| Late Stages (31+) | Ambient pad gains subtle rhythmic pulse, volume 0.3 |
| Shadow at >70% across | Tension drone added, volume ramps 0.0 -> 0.4 over 2s |
| Game Over | All audio fades out over 500ms, somber sting plays |
| Pause | Volume reduced to 0.1 |

**Audio Implementation**: Web Audio API via Phaser's built-in sound manager. All sounds generated programmatically using oscillators and noise buffers (no external audio files). Sounds defined as frequency/duration/envelope configurations in config.js.

---

## 6. UI/UX

### 6.1 Screen Flow

```
+------------+     +------------+     +------------+
|   Boot     |---->|   Menu     |---->|   Game     |
|   Scene    |     |   Scene    |     |   Scene    |
+------------+     +-----+------+     +------+-----+
                      |     |                |
                 +----+  +--+--+        +----+----+
                 |       |     |        | Pause   |---->+----------+
            +----+---+ +-+--+  |        | Overlay |    |  Help    |
            |  Help  | |Coll|  |        +---------+    |How 2 Play|
            |How2Play| |ectn|  |             |         +----------+
            +--------+ +----+  |        +----+----+
                          +----+---+    | Game    |
                          |Settings|    | Over    |
                          | Overlay|    | Screen  |
                          +--------+    +----+----+
                                             |
                                        +----+----+
                                        | Ad /    |
                                        |Continue |
                                        | Prompt  |
                                        +---------+
```

### 6.2 HUD Layout

```
+-------------------------------+
| 1250  Stage 7         x3     |  <-- Top bar (y: 0-50px, bg: #1A0A2E @ 0.7 alpha)
+-------------------------------+
|                               |
|     [Shadow silhouette        |  <-- Shadow Zone (y: 50-480px)
|      drifting right -->]      |      Shadow: #2C2137 on gradient bg
|                               |      Grid: shown when piece held
|     [placed pieces inside]    |
|                               |
+-------------------------------+
| [========>              ]     |  <-- Drift Bar (y: 480-500px, 8px tall)
+-------------------------------+
|                               |
|  [ L ] [ T ] [ [] ] [ I ]    |  <-- Piece Tray (y: 510-700px)
|                               |      Dark bg (#1A0A2E @ 0.8)
|          [ Z ] [ + ]         |      Pieces arranged in rows
|                               |
+-------------------------------+
|      ||  (pause)              |  <-- Bottom nav (y: 700-740px)
+-------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left (x: 16, y: 16) | Current score, 24px bold, #FFF8E7 | Every score event (animates: punch 1.3x) |
| Stage | Top-center (x: center, y: 16) | "Stage {N}", 18px, #FFF8E7 | On stage transition |
| Streak | Top-right (x: right-16, y: 16) | "x{N}" + flame icon at x5+, 22px bold, #FFD700 | On streak change (animates: pulse) |
| Drift Bar | Below shadow zone (y: 488) | Horizontal bar showing shadow x-position as % | Every frame (smooth fill) |
| Combo Float | Center of placed piece | "+{N}" text, rises 60px, fades 600ms | On each piece placement |
| Warning Text | Screen center | "SHADOW ESCAPING!", 28px bold, #FF3B3B | On inactivity trigger |
| Pause Button | Bottom-center (y: 710) | "||" icon, 44x44px touch target | Always visible during gameplay |

### 6.3 Menu Structure

**Main Menu**:
- Game title "SHADOW MATCH" (40px, #FFF8E7, subtle shadow effect, y: 80px)
- Shadow silhouette animation behind title (decorative, slow drift)
- **PLAY** button (200x60px, centered, y: 280px, bg: #FFB347, text: #1A0A2E, 28px bold, rounded 12px)
- **DAILY CHALLENGE** button (180x50px, centered, y: 360px, bg: #2ECC71, text: #FFF8E7, 20px, shows daily streak count)
- **COLLECTION** button (trophy icon + "{N}/30", y: 430px, 160x44px, bg: #9B8EC4, text: #FFF8E7)
- **How to Play "?"** button (44x44px circle, top-right, x: 384, y: 16, bg: #9B8EC4)
- **Settings gear** icon (44x44px, top-left, x: 16, y: 16)
- **High Score** display (bottom-center, y: 660px, "BEST: {N}", 18px, #FFD700)
- **Daily Streak** counter (next to daily challenge button, "{N} days", #FFD700)

**Pause Menu** (overlay, #1A0A2E @ alpha 0.85):
- "PAUSED" title (32px, #FFF8E7, y: 200px)
- Resume button (180x50px, y: 300px, #FFB347)
- How to Play "?" button (180x50px, y: 370px, #9B8EC4)
- Restart button (180x50px, y: 440px, #FF6B6B)
- Quit to Menu button (180x50px, y: 510px, #5C3A21, text: #FFF8E7)

**Game Over Screen** (overlay, slides up from bottom, 400ms):
- "SHADOW ESCAPED!" title (28px, #FF3B3B, y: 160px)
- Final Score (48px bold, #FFD700, y: 230px, scale-in animation)
- "NEW BEST!" indicator (if applicable, 20px, #2ECC71, pulses)
- Stage Reached ("Stage {N}", 20px, #FFF8E7, y: 290px)
- Shadow Streak Best ("Best Streak: x{N}", 18px, #FFB347, y: 320px)
- Pieces Collected this session ("{N} new shapes!", 16px, #9B8EC4, y: 350px, only if >0)
- "CONTINUE" button -- rewarded ad (180x50px, y: 420px, #2ECC71, "Watch ad to rewind shadow")
- "PLAY AGAIN" button (180x50px, y: 490px, #FFB347)
- "MENU" button (180x50px, y: 560px, #5C3A21, text: #FFF8E7)

**Help / How to Play Screen** (overlay, scrollable):
- Title: "HOW TO PLAY" (28px, #FFF8E7, y: 40px)
- **Visual 1**: SVG diagram showing a hand dragging a piece from tray to shadow, with arrow. Caption: "DRAG pieces from the tray into the shadow" (16px)
- **Visual 2**: SVG diagram showing tap gesture on a piece with rotation arrow. Caption: "TAP a piece to ROTATE it 90 degrees" (16px)
- **Visual 3**: SVG diagram showing shadow drifting right with arrow. Caption: "Complete the shadow before it escapes!" (16px)
- **Visual 4**: SVG diagram showing "x3" streak counter with fire. Caption: "Perfect stages (no wrong placements) build your STREAK multiplier!" (16px)
- **Rules box** (bg: #1A0A2E @ 0.5, rounded 8px, padding 16px):
  - "Wrong placement = piece bounces back + shadow lurches forward"
  - "Shadow escapes off-screen = Game Over"
  - "Don't idle! Shadow accelerates after 10 seconds"
- **Tips** (18px, #FFD700):
  - "Tip 1: Rotate pieces in the tray BEFORE dragging"
  - "Tip 2: Watch for decoy pieces that don't fit (stage 16+)"
  - "Tip 3: Speed bonus for completing before shadow reaches midpoint"
- **"GOT IT!" button** (180x50px, centered, y: bottom-60px, #FFB347)
- Scrollable container if content exceeds viewport

**Collection Screen** (overlay):
- Title: "SHADOW COLLECTION" (24px, #FFF8E7)
- 6x5 grid of piece silhouettes (each 50x50px cell)
- Unlocked pieces shown in #FFB347, locked shown as dark outlines (#333333)
- "{N}/30 Collected" counter at top
- "BACK" button (44x44px, top-left)

**Settings Screen** (overlay):
- Sound Effects: On/Off toggle (default: On)
- Music: On/Off toggle (default: On)
- Vibration: On/Off toggle (default: On, if supported)
- "BACK" button

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after death (rewind shadow) | Every game over (optional) | Always (optional) |
| Rewarded | Double final score | Game over screen (optional) | Always (optional) |
| Banner | Menu screen only | Always visible on menu | N/A |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Shadow Rewind | Watch rewarded ad after death | Shadow rewinds to x=160 (midpoint), game resumes | Once per run |
| Score Doubler | Watch rewarded ad at game over | Final score x2 (applied before high score check) | Once per session |

### 7.3 Session Economy

The game is free-to-play with optional ads. Core gameplay is never paywalled. The rewarded ad for continue is a strong revenue driver because single-life death creates high motivation to continue, especially at high stages/streaks.

**Session Flow with Monetization**:
```
[Play Free] --> [Shadow Escapes (Death)]
                        |
                  [Rewarded Ad: Rewind Shadow?]
                        | Yes --> [Resume from midpoint + interstitial later]
                        | No  --> [Game Over Screen]
                                        |
                                  [Interstitial (every 3rd game over)]
                                        |
                                  [Rewarded Ad: Double Score?]
                                        | Yes --> [Score doubled, shown]
                                        | No  --> [Play Again / Menu]
```

**Expected ad views per session**: 0.8-1.5 (high continue motivation due to single-life + streak loss).

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/shadow-match/
+-- index.html              # Entry point (~20 lines)
|   +-- CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
|   +-- Local CSS           # css/style.css
|   +-- Local JS (ordered)  # config -> stages -> ads -> help -> ui -> game -> main (LAST)
+-- css/
|   +-- style.css           # Responsive styles, mobile-first
+-- js/
    +-- config.js           # Game constants, colors, difficulty tables, SVG templates
    +-- main.js             # BootScene, Phaser init, scene registration (loads LAST)
    +-- game.js             # GameScene: core gameplay, drag/drop, snap logic, shadow drift
    +-- stages.js           # Shadow + piece generation algorithm, difficulty scaling
    +-- ui.js               # MenuScene, GameOverScene, HUD, pause overlay, collection screen
    +-- help.js             # HelpScene: illustrated how-to-play with SVG diagrams
    +-- ads.js              # Ad integration hooks, reward callbacks, ad timing
```

**Script load order in index.html** (CRITICAL -- main.js MUST be last):
```html
<script src="js/config.js"></script>
<script src="js/stages.js"></script>
<script src="js/ads.js"></script>
<script src="js/help.js"></script>
<script src="js/ui.js"></script>
<script src="js/game.js"></script>
<script src="js/main.js"></script>
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `COLORS` object: all hex codes from palette (sky gradient, shadow, pieces, HUD, etc.)
- `DIFFICULTY` table: arrays indexed by stage range for drift_speed, piece_count, distractor_count, cells_per_piece
- `GRID` constants: CELL_SIZE=40, GRID_COLS=8, GRID_ROWS=8, GRID_OFFSET_X, GRID_OFFSET_Y
- `SCORING` object: PIECE_PLACED=50, SHADOW_COMPLETE=200, PER_PIECE_BONUS=30, PERFECT_BONUS=150, SPEED_BONUS=100
- `TIMING` object: BOUNCE_DURATION=200, SNAP_DURATION=80, SHADOW_LURCH=60, INACTIVITY_THRESHOLD=10000, INACTIVITY_ACCEL=8, ROTATE_DURATION=120
- `PIECE_DEFS`: array of polyomino definitions (cell offset arrays for all 30 collectible shapes)
- `SVG_TEMPLATES`: background SVG string, tray SVG string, flame icon SVG string
- `COLLECTION_TOTAL`: 30
- `STREAK_CAP`: 10
- `REST_STAGE_INTERVAL`: 10
- `BOSS_STAGE_INTERVAL`: 15

**main.js** (max 300 lines -- loads LAST):
- `BootScene`: register all static SVG textures via `textures.addBase64()` (background, tray, flame icon, UI elements)
- Phaser.Game config: type AUTO, width 428, height 760, backgroundColor #1A0A2E, scene array [BootScene, MenuScene, HelpScene, GameScene, UIScene]
- `GameState` global object: score, highScore, stage, streak, bestStreak, gamesPlayed, collection[], settings{}, dailyStreak, lastDailyDate
- localStorage read/write functions: `saveState()`, `loadState()`
- Orientation change handler: resize game to fit viewport, maintain aspect ratio

**game.js** (max 300 lines):
- `GameScene` extends Phaser.Scene
- `create()`: initialize shadow, pieces, grid, drag handlers, drift timer, inactivity timer
- `update()`: move shadow by drift_speed per frame, check escape condition, update drift bar, check inactivity
- `generateStage(stageNum)`: calls stages.js `generateShadow()` and `generatePieces()`, creates game objects
- Drag handlers: `pointerdown` on pieces (pick up), `pointermove` (follow finger + ghost preview), `pointerup` (snap or bounce)
- `snapPiece(piece, gridX, gridY)`: validate placement, mark cells filled, apply snap effect, check completion
- `bouncePiece(piece)`: return to tray, apply lurch penalty
- `checkCompletion()`: all shadow cells filled? -> score, streak, next stage
- `triggerDeath()`: shadow shatter effect, transition to game over
- `handleInactivity()`: track last input time, trigger warning at 10s, accelerate at 12s
- Piece rotation: `rotatePiece(piece)` -- update cell offsets by 90 degrees CW, rebuild SVG texture

**stages.js** (max 300 lines):
- `generateShadow(stageNum, seed)`: procedural silhouette generation
  - Seed-based RNG (linear congruential generator)
  - Cell growth algorithm: start center, expand to adjacent cells
  - Returns: array of {col, row} cell positions
- `decomposeShadow(cells, pieceCount)`: split cell array into pieceCount contiguous groups
  - BFS-based decomposition ensuring each group is a valid polyomino
  - Returns: array of piece definitions [{cells: [{col,row},...], shape_id}]
- `generateDistractors(shadowCells, count, seed)`: create pieces that don't fit
  - Generate random polyominos, verify they don't match any unfilled region
- `getDifficultyParams(stageNum)`: returns {driftSpeed, pieceCount, distractorCount, cellsPerPiece} from DIFFICULTY table
- `generateRestStage(stageNum)`: predefined recognizable shapes (star, heart, arrow, diamond, house)
- `generateBossStage(stageNum)`: 10x10 grid, 8+ pieces
- `seededRandom(seed)`: deterministic RNG for reproducible stages and daily challenges
- `getDailySeed()`: returns seed based on current date (YYYYMMDD as integer)

**ui.js** (max 300 lines):
- `MenuScene` extends Phaser.Scene: title, play button, daily challenge button, collection button, help button, settings, high score display
- `UIScene` extends Phaser.Scene (runs parallel to GameScene): HUD bar (score, stage, streak), drift bar, pause button, combo float text, warning text
- Game over overlay: final score, stage, streak, continue/play again/menu buttons
- Pause overlay: resume, help, restart, quit buttons
- Collection overlay: 6x5 grid of piece silhouettes, unlock count
- Settings overlay: sound/music/vibration toggles
- Scene event listeners: `updateScore`, `updateStage`, `updateStreak`, `showWarning`, `showGameOver`, `showPerfect`

**help.js** (max 300 lines):
- `HelpScene` extends Phaser.Scene
- Scrollable container with illustrated instructions
- 4 SVG instruction diagrams (hand drag, tap rotate, shadow drift, streak)
- Rules text block
- Tips text block
- "GOT IT!" return button
- Tracks calling scene (menu or pause) for proper return navigation

**ads.js** (max 300 lines):
- `AdManager` singleton object
- `showInterstitial()`: placeholder -- logs "interstitial shown", calls callback after 1s delay
- `showRewarded(callback)`: placeholder -- logs "rewarded ad shown", calls callback with reward after 1s delay
- `shouldShowInterstitial()`: returns true every 3rd game over (tracks count in GameState)
- `showBanner()` / `hideBanner()`: placeholder for menu banner
- All functions are no-ops in POC stage (per user preference: no real ad integration)

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No Howler.js needed -- audio generated via Web Audio API through Phaser's sound manager, or omitted for POC.

---

## 9. Juice Specification

### 9.1 Player Input Feedback (applied to every drag start)

| Effect | Target | Values |
|--------|--------|--------|
| Scale punch | Picked-up piece | Scale: 1.0 -> 1.15x, Recovery: 100ms ease-out |
| Shadow lift | Picked-up piece | y offset: -4px while held (floats above finger) |
| Tray dim | Remaining tray pieces | Alpha: 1.0 -> 0.6, Duration: 100ms (focus on held piece) |
| Sound | -- | Wooden click, 80ms, pitch: 440Hz base |
| Vibration | Device | 10ms pulse (if enabled) |

### 9.2 Core Action: Piece Snap (most frequent positive feedback)

| Effect | Values |
|--------|--------|
| Scale punch | Piece: 1.0 -> 1.15 -> 1.0, Duration: 80ms |
| Particles | Count: 8, Type: 4px circles, Color: #FFD700, Direction: radial burst from piece center, Speed: 80-160 px/s random, Lifespan: 300ms, Fade: alpha 1.0 -> 0 over lifespan |
| Camera shake | Intensity: 2px, Duration: 60ms |
| Hit-stop | 30ms physics pause (shadow drift pauses) |
| Piece color shift | Fill transitions #FFB347 -> #FF6B6B over 150ms (placed color) |
| Sound | Pop/thunk, 150ms, pitch: 520Hz + (streak * 40Hz), so higher pitch at higher streaks |
| Vibration | 15ms pulse |
| Combo escalation | At streak x3+: particles count +4 per streak level (max 32 at x10). At streak x5+: camera shake intensity +1px per level (max 7px at x10). At streak x7+: hit-stop increases to 50ms. |

### 9.3 Core Action: Wrong Placement (bounce back)

| Effect | Values |
|--------|--------|
| Piece shake | Horizontal oscillation: +/-8px, 3 cycles, 200ms total, ease-in-out |
| Piece return | Tween to tray slot position, 150ms, ease: Back.easeIn |
| Shadow lurch | Shadow x += 60px over 200ms, ease: Cubic.easeOut. Drift bar jumps. |
| Screen flash | Full-screen red overlay (#FF3B3B), alpha 0 -> 0.15 -> 0, 120ms |
| Sound | Dull thud + buzz, 200ms, pitch: 220Hz |
| Vibration | 30ms pulse |
| Streak text | If streak > 1: "STREAK LOST!" text at screen center, #FF3B3B, 22px, fades up 40px in 500ms |

### 9.4 Shadow Complete (stage clear)

| Effect | Values |
|--------|--------|
| Flash | All placed pieces flash white overlay, alpha 0 -> 0.8 -> 0, 200ms |
| Dissolve particles | 20 particles from shadow position, rising upward at 60-120 px/s, random x drift +/-30px, color: #9B8EC4, size: 6px, lifespan: 600ms |
| Score float | "+{total}" text, 28px bold, #FFD700, starts at shadow center, rises 60px, fades over 600ms |
| Camera zoom | 1.0 -> 1.03 -> 1.0, duration: 300ms, ease: Sine.InOut |
| Sound | Ascending 3-note chime, 400ms |
| Delay before next | 500ms pause before next shadow spawns (lets player absorb the satisfaction) |

### 9.5 Perfect Completion (0 wrong placements)

| Effect | Values |
|--------|--------|
| Green flash | Full-screen #2ECC71 overlay, alpha 0 -> 0.25 -> 0, 150ms |
| "PERFECT!" text | Screen center, 36px bold, #2ECC71, scale 0 -> 1.2 -> 1.0 over 300ms, then fades over 400ms |
| Streak counter pulse | Streak HUD text scales 1.0 -> 1.5 -> 1.0, 200ms. If x5+, flame icon particles burst (6 particles, #FFD700). |
| Speed bonus text | If shadow x < 214 (midpoint): "+100 SPEED BONUS" text, 20px, #FFD700, below PERFECT text, fades 500ms |
| Sound | Bright fanfare with shimmer, 600ms |

### 9.6 Death/Failure Effects (Shadow Escape)

| Effect | Values |
|--------|--------|
| Shadow shatter | Shadow breaks into 12 triangular fragments. Each fragment: random velocity 100-300 px/s, random spin 180-720 deg/s, alpha 1.0 -> 0 over 400ms. |
| Screen shake | Intensity: 10px, Duration: 300ms, Decay: exponential |
| Screen darken | Full-screen #1A0A2E overlay, alpha 0 -> 0.6, Duration: 200ms (starts 200ms after shatter begins) |
| Sound | Glass breaking + low impact, 500ms |
| Vibration | 50ms pulse |
| Effect -> UI delay | 600ms from death trigger to game over screen appearance |
| Death -> restart | Game over screen appears at 600ms. "PLAY AGAIN" tap -> new game starts. Total: under 1.5 seconds from tap to gameplay. |

### 9.7 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{N}" at event position, Color: #FFD700, Size: 22px bold, Movement: rise 60px over 600ms, Fade: alpha 1.0 -> 0 over 600ms |
| Score HUD punch | Scale 1.0 -> 1.3 -> 1.0, Duration: 150ms, ease: Back.easeOut |
| Combo text escalation | Font size: 22px base + (streak * 2)px per streak level (max 42px at x10). At x5+ streak: text color shifts to #FFD700 with glow effect (shadow). |
| High score beat | When score passes high score mid-game: "NEW BEST!" banner flashes once (24px, #FFD700, 800ms), HUD score text permanently turns gold for rest of run. |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | Performance.timing API |
| Memory Usage | <80MB | Chrome DevTools Memory panel |
| JS Bundle Size | <200KB total (excl. CDN) | File size check |
| First Interaction | <1 second after load | Time to first meaningful paint |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Use Phaser's input system with `pointer` events (handles both touch and mouse)
- **Prevent Default**: Prevent pull-to-refresh, pinch-to-zoom, and double-tap-to-zoom via CSS `touch-action: none` on game container
- **Orientation**: Lock to portrait mode via CSS. On landscape, show "Please rotate your device" overlay using `visibility:hidden; height:0; overflow:hidden` pattern (NEVER `display:none` on Phaser canvas -- kills rendering permanently)
- **Safe Areas**: `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)`
- **Throttling**: Detect `visibilitychange` event, pause game when tab/app backgrounds
- **Asset Loading**: All SVG generated in code. No external images. No loading screen needed.
- **Drag performance**: Limit ghost preview recalculation to every 2 frames during drag to avoid jank on low-end devices

### 10.3 Touch Controls

- **Touch Target Size**: All buttons minimum 44x44px. Tray pieces minimum 50x50px touch area (even if visual is smaller).
- **Drag Threshold**: 8px movement from pointerdown before drag initiates (prevents accidental drags on tap-to-rotate).
- **Snap Magnetism**: When dragging piece within 20px of a valid grid position, ghost preview snaps to that position (assists imprecise finger placement).
- **Input Buffering**: If player taps a piece while another piece is animating back to tray, buffer the tap and execute after animation completes (max buffer: 1 input, 300ms timeout).
- **Rotation during drag**: NOT allowed (too complex for mobile). Must tap to rotate in tray, then drag.
- **Multi-touch**: Ignored. Only first active pointer tracked. Prevents confusion.

### 10.4 Grid Snap System (Critical Implementation Detail)

The snap grid is the core technical challenge. Implementation rules:
1. Grid is 8x8 (or 10x10 for boss stages), cell size 40x40px.
2. Grid position is relative to the SHADOW's current x-position (grid moves with shadow).
3. When player holds a piece, calculate nearest grid-aligned position for the piece's origin cell.
4. Ghost preview renders at that grid position. Check all piece cells against shadow's unfilled cells.
5. On release: if ALL piece cells overlap unfilled shadow cells, snap. Otherwise, bounce.
6. **No "close enough" tolerance** -- every cell must match exactly. This prevents the exploit the Devil judge flagged.
7. Shadow cells are tracked as a boolean 2D array `shadowGrid[row][col]`. Placing a piece sets cells to `filled=true`.

### 10.5 Piece Rotation Implementation

- Each piece is defined as an array of cell offsets: `[{dx: 0, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: 1}]` (L-shape).
- Rotation 90 degrees CW: `{dx, dy}` becomes `{dx: -dy, dy: dx}`. Then normalize to positive offsets.
- After rotation, rebuild the piece's SVG texture via `textures.addBase64()` with a rotation-specific key (e.g., `piece_3_rot90`).
- **Critical**: Use unique texture keys per piece instance + rotation to avoid "Texture key already in use" error. Key pattern: `piece_{stageNum}_{pieceIndex}_r{rotation}`.

### 10.6 Local Storage Schema

```json
{
  "shadow_match_high_score": 0,
  "shadow_match_games_played": 0,
  "shadow_match_highest_stage": 0,
  "shadow_match_best_streak": 0,
  "shadow_match_collection": [],
  "shadow_match_daily_streak": 0,
  "shadow_match_last_daily": "",
  "shadow_match_settings": {
    "sound": true,
    "music": true,
    "vibration": true
  },
  "shadow_match_total_score": 0,
  "shadow_match_game_over_count": 0
}
```

### 10.7 Known Anti-Patterns to Avoid

1. **NEVER use `display:none` on the Phaser canvas** -- use `visibility:hidden; height:0; overflow:hidden` for orientation overlays.
2. **NEVER call `textures.addBase64()` outside BootScene for static assets** -- dynamic piece textures use unique keys per stage to avoid key collision.
3. **NEVER remove physics bodies inside collision callbacks** -- use `this.time.delayedCall(0, ...)`.
4. **main.js MUST load LAST** in script order.
5. **HUD text must initialize from GameState values**, not literal '0' -- prevents display reset on scene restart.
6. **Stage transition flag**: use `stageTransitioning` boolean to prevent `checkCompletion()` from firing multiple times per frame.
7. **Inactivity timer**: reset `lastInputTime` on ANY pointer event (down, move, up), not just pointerdown.
8. **Score text depth**: if score text is above a button, make the text non-interactive (`text.disableInteractive()`) to prevent pointer event blocking.

---

## Appendix A: Piece Shape Catalog (30 Collectible Shapes)

Pieces are polyominos (connected cell groups). Each piece is 3-5 cells.

**3-Cell Pieces (Trominoes)** -- 2 shapes:
1. I-3: `[(0,0),(1,0),(2,0)]` -- straight line
2. L-3: `[(0,0),(1,0),(1,1)]` -- L-shape

**4-Cell Pieces (Tetrominoes)** -- 7 shapes:
3. I-4: `[(0,0),(1,0),(2,0),(3,0)]` -- straight line
4. O-4: `[(0,0),(1,0),(0,1),(1,1)]` -- square
5. T-4: `[(0,0),(1,0),(2,0),(1,1)]` -- T-shape
6. S-4: `[(1,0),(2,0),(0,1),(1,1)]` -- S-shape
7. Z-4: `[(0,0),(1,0),(1,1),(2,1)]` -- Z-shape
8. L-4: `[(0,0),(1,0),(2,0),(2,1)]` -- L-shape
9. J-4: `[(0,0),(1,0),(2,0),(0,1)]` -- J-shape

**5-Cell Pieces (Pentominoes)** -- 21 shapes:
10-30: F, I, L, N, P, T, U, V, W, X, Y, Z pentominoes and their distinct rotations/mirrors. Standard pentomino set. Each defined as 5-cell offset arrays.

Shapes are unlocked sequentially: shapes 1-2 unlock at stages 1-5, shapes 3-9 unlock at stages 6-15, shapes 10-30 unlock one per 5 stages from stage 16 onward.
