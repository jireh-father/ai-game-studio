# Game Design Document: Grid Quarantine

**Slug**: `grid-quarantine`
**One-Liner**: Build walls to contain spreading infections before they reach the grid edges.
**Core Mechanic**: Infections spawn and spread across a grid. Player taps empty cells to place wall segments that block spread. Contain ALL infections before they reach grid edges. Limited wall supply forces strategic placement. Mutations evolve infection behavior each run for maximum replayability.
**Target Session Length**: 3-6 minutes
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Grid Quarantine is a real-time strategic containment puzzle where the player battles an ever-spreading infection on a grid. Infections spawn at random interior cells and spread to adjacent cells on a ticking timer. The player's only weapon: tapping empty cells to slam down wall segments that block the spread. The tension is electric -- every second the infection creeps closer to the edges, and every wall placed is one fewer in the dwindling supply.

The genius is in the resource pressure. Players start each stage with a limited wall budget. Place too many walls early and you have nothing left when the infection mutates direction. Place too few and the infection breaches the perimeter. The sweet spot -- containing an outbreak with minimum walls -- triggers a satisfying containment bonus with combo escalation. The feeling is pandemic commander meets Tetris-level spatial reasoning under time pressure.

Starting from Stage 6, infections evolve with mutations: diagonal spread, jumping (skipping cells), and splitting on wall contact. Each run shuffles which mutations appear and when, so no two sessions feel identical. This mutation system directly addresses the replay concern -- players must adapt strategies to unpredictable infection behaviors every single run.

### 1.2 Target Audience

Casual mobile gamers aged 16-40 who enjoy quick-thinking puzzle games. Play context: commute, waiting room, bathroom break. Players who liked Minesweeper's spatial logic but want real-time pressure. No complex controls -- single-tap only. Accessible to newcomers (Stage 1-5 is tutorial-gentle) but deep enough for strategy addicts chasing efficiency scores.

### 1.3 Core Fantasy

You are the last quarantine officer. The infection is spreading and you are the only thing standing between containment and total outbreak. Every wall you slam down is a decisive, satisfying act of control. When you box in an infection cluster with surgical precision using minimum walls, you feel like a genius tactician. When it breaches and you scramble to build a second perimeter, the panic is real.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 3-6 minutes |
| Day 1 Retention | 42%+ |
| Day 7 Retention | 22%+ |
| Average Stages per Session | 6-12 |
| Crash Rate | <1% |
| Replay Rate (immediate Play Again) | 55%+ |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Stage Start: Infection(s) spawn] --> [Infection spreads on tick timer]
         ^                                       |
         |                                       v
[Next Stage / Death]  <--  [Player taps to place walls]
         ^                                       |
         |                                       v
[Stage Complete: All infections contained] <-- [Score + Containment Bonus]
```

**Moment-to-moment**: The player watches infection cells pulse and spread. They tap empty cells to place walls. The infection hits walls and redirects. The player reads the spread pattern, predicts the next tick, and places walls to close gaps. When every infection cell is surrounded by walls or grid edges with no open adjacent cells to spread into, the stage is cleared. If ANY infection cell reaches a grid edge cell, the player loses 1 life. Lose all 3 lives = game over.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Place Wall | Single Tap on empty cell | Instantly places a wall segment on the tapped grid cell. Costs 1 from wall supply. |
| Remove Wall (Stage 6+) | Double Tap on own wall | Reclaims 1 wall (returns to supply). 500ms cooldown. Only works on walls placed this stage. |
| Pause | Tap pause icon (top-right) | Pauses infection spread, shows pause overlay. |

**Control Philosophy**: Single-tap-only for primary action. No swipes, no drags, no holds. The game is about WHERE you tap, not HOW you tap. This keeps cognitive load on strategy, not dexterity. The grid cells are large enough (44px minimum) for confident fat-finger tapping on mobile.

**Touch Area Map**:
```
+-------------------------------+
| Score    Stage XX   [P] ♥♥♥  |  <- HUD bar (48px height)
+-------------------------------+
|                               |
|   +---------------------+    |
|   |                     |    |
|   |    8x8 GRID AREA    |    |
|   |   (tappable cells)  |    |
|   |                     |    |
|   +---------------------+    |
|                               |
+-------------------------------+
| Walls: ██████░░░░  12/20     |  <- Wall supply bar (52px height)
+-------------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Wall Placed | 0 | No points for placing walls |
| Infection Cell Contained (no open neighbors) | +10 per cell | -- |
| Stage Clear (all infections contained) | +100 base | x1.5 if cleared before 50% timer, x2.0 if cleared before 25% timer |
| Efficiency Bonus | +20 per unused wall | Walls remaining in supply at stage clear |
| Perfect Containment | +200 flat | Used <= minimum required walls (calculated per stage) |
| Mutation Survived | +50 flat | First time containing a new mutation type in a run |
| Combo Containment | +50 per chain | Containing 2+ separate infection clusters within 2s of each other |
| Edge Breach (penalty) | -50 per breach | Each infection cell that reaches a grid edge |

**Combo System**: When the player contains multiple separate infection clusters in rapid succession (within 2000ms), each subsequent containment awards +50 combo bonus. Combo counter displays at center: "x2!", "x3!", etc. Combo resets after 2000ms with no containment event.

**High Score**: Stored in localStorage. Displayed on menu screen and game over screen. New high score triggers celebration animation (confetti particles + "NEW BEST!" text).

### 2.4 Progression System

The game uses infinite stage progression. Grid size and infection behavior escalate. Mutation types shuffle each run for replayability.

**Mutation Pool** (shuffled per run -- order randomized):
- **Basic Spread**: 4-directional (up/down/left/right)
- **Diagonal Spread**: 8-directional (adds diagonals)
- **Jumper**: Skips 1 cell in spread direction (leaps over walls)
- **Splitter**: When hitting a wall, spawns a new infection source 2 cells perpendicular
- **Accelerator**: Spread interval decreases by 100ms each tick (minimum 400ms)
- **Dormant**: Appears inert for 3 ticks, then explodes in all 8 directions simultaneously

**Progression Milestones**:

| Stage Range | Grid Size | Infections | Walls Given | Spread Interval | Mutations Active | New Element |
|------------|-----------|------------|-------------|----------------|-----------------|-------------|
| 1-3 | 6x6 | 1 | 16 | 2000ms | Basic only | Tutorial: learn wall placement |
| 4-5 | 6x6 | 1-2 | 14 | 1800ms | Basic only | Multiple infection sources |
| 6-8 | 8x8 | 2 | 18 | 1600ms | Basic + 1st mutation | First mutation introduced |
| 9-10 | 8x8 | 2-3 | 16 | 1500ms | Basic + 1st mutation | Wall reclaim (double-tap) |
| 11-15 | 8x8 | 3 | 16 | 1400ms | Basic + 1st + 2nd mutation | Second mutation layer |
| 16-20 | 10x10 | 3-4 | 22 | 1300ms | Basic + 3 mutations | Grid expansion |
| 21-30 | 10x10 | 4 | 20 | 1200ms | Basic + 4 mutations | Reduced wall supply |
| 31-40 | 12x12 | 4-5 | 28 | 1100ms | All mutations possible | Maximum grid |
| 41+ | 12x12 | 5 | 26 | 1000ms (min) | All mutations, random combos | Survival mode |

**Rest Stages**: Every 5th stage (5, 10, 15...) is a "Breather" -- only 1 infection source, +4 extra walls, spread interval +300ms slower than current tier.

### 2.5 Lives and Failure

The player starts with **3 lives** (displayed as biohazard icons in HUD).

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Infection reaches ANY edge cell | Lose 1 life. Stage restarts with new layout. | Watch rewarded ad for +1 life (once per game) |
| All 3 lives lost | Game Over. Final score displayed. | Watch rewarded ad to continue with 1 life (once per game) |
| Inactivity for 8 seconds | Infection spreads unchecked. Edges reached in ~10s total. | Auto-death via edge breach (standard life loss) |

**Inactivity Death Mechanic**: If the player places no walls for 8000ms, infection spread guarantees edge breach within ~10 seconds from stage start. No special inactivity timer needed -- the infection's natural spread handles it. On an 6x6 grid with spread interval 2000ms, infection starting at center reaches edge in 3 ticks (6s). On 8x8, 4 ticks (6.4s). This satisfies the 30s death requirement with margin.

**Death-to-Restart**: Stage restart transition takes exactly 1200ms (600ms death effect + 600ms new stage setup). Under 2 seconds.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Stages are procedurally generated based on stage number and a per-run random seed.

**Generation Algorithm**:
```
Stage Generation Parameters:
- runSeed: Math.random() * 999999 (set once per game session)
- stageSeed: runSeed + stageNumber * 7919 (prime multiplier for distribution)
- gridSize: lookup from progression table (6/8/10/12)
- infectionCount: lookup from progression table
- wallSupply: lookup from progression table
- spreadInterval: lookup from progression table (ms)
- activeMutations: determined by run's shuffled mutation order + stage range
- infectionSpawnZone: interior cells only (min 2 cells from any edge)
- wallMinimum: calculated as BFS shortest containment path length (for Perfect Containment bonus)
```

**Infection Spawn Rules**:
1. Infection sources spawn at random interior cells (row >= 2 && row <= gridSize-3, col >= 2 && col <= gridSize-3)
2. Minimum distance between infection sources: 3 cells (Manhattan distance)
3. No infection spawns adjacent to another infection source
4. Spawn positions determined by seeded RNG for reproducibility

### 3.2 Difficulty Curve

```
Difficulty
    |
100 |                                          ------------ (cap at stage 41+)
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
    0    5   10   15   20   25   30   35   40+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-3 | Stage 4-8 | Stage 9-15 | Stage 16-30 | Stage 31+ |
|-----------|-----------|-----------|------------|-------------|-----------|
| Grid Size | 6x6 | 6x6 to 8x8 | 8x8 | 10x10 | 10x10 to 12x12 |
| Infection Sources | 1 | 1-2 | 2-3 | 3-4 | 4-5 |
| Spread Interval (ms) | 2000 | 1800-1600 | 1500-1400 | 1300-1200 | 1100-1000 |
| Wall Supply | 16 | 14-18 | 16 | 22-20 | 28-26 |
| Wall Surplus (over minimum) | +8 | +6 | +5 | +4 | +3 |
| Mutations Active | 0 | 0-1 | 1-2 | 2-4 | 4-6 |
| Reaction Time Available (approx.) | 6s | 5s | 4s | 3.5s | 3s |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every stage is solvable. The algorithm first places infections, then runs BFS to calculate the minimum wall count needed to contain all infections before they reach edges. Wall supply is always set to `minWalls + surplus` (surplus from table above). If BFS says minimum is 12, supply = 12 + surplus.
2. **Variety Threshold**: At least 2 of these must differ between consecutive non-rest stages: infection count, grid size, mutation set, spawn positions.
3. **Difficulty Monotonicity**: Spread interval never increases between stages (except rest stages). Wall surplus never increases between tiers.
4. **Rest Stages**: Every 5th stage. 1 infection source, surplus +4, spread interval +300ms slower. Visual cue: grid border glows green.
5. **Mutation Introduction Stages**: When a new mutation first appears (determined by run's shuffled order), the first infected cell with that mutation pulses with a unique color for 3 ticks as a visual warning. A brief text label appears: "MUTATION: DIAGONAL!" (500ms display).

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Clinical-neon. Clean grid lines on dark background, with biohazard-themed neon colors. Think disease control center monitor aesthetic. Minimal detail, maximum clarity. Every cell state is instantly readable.

**Aesthetic Keywords**: Clinical, Neon, Urgent, Sterile, Biohazard

**Reference Palette**: Dark lab monitor with glowing green/red indicators. The contrast between the calm dark grid and the angry pulsing infection creates visual urgency without visual clutter.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Deep Navy | #0A0E1A | Game background, empty space |
| Grid Lines | Dim Slate | #1E2A3A | Grid cell borders |
| Empty Cell | Dark Blue-Gray | #141E2E | Empty tappable cells |
| Empty Cell Hover | Lighter Slate | #2A3A4E | Cell under pointer/finger |
| Wall | Cyan-White | #00E5FF | Placed wall segments |
| Wall Glow | Cyan (30% opacity) | #00E5FF4D | Wall cell glow/aura |
| Infection (Basic) | Toxic Green | #39FF14 | Basic spreading infection |
| Infection (Diagonal) | Acid Yellow | #FFD600 | Diagonal mutation |
| Infection (Jumper) | Electric Purple | #B388FF | Jumping mutation |
| Infection (Splitter) | Hot Pink | #FF1744 | Splitting mutation |
| Infection (Accelerator) | Neon Orange | #FF6D00 | Speed mutation |
| Infection (Dormant) | Dull Gray-Green | #4E6E58 | Dormant (pre-explosion) |
| Danger/Edge Warning | Red | #FF1744 | Edge cells when infection is 2 cells away |
| HUD Text | White | #FFFFFF | Score, stage, labels |
| HUD Secondary | Silver | #B0BEC5 | Secondary info text |
| Success/Contained | Bright Green | #00E676 | Stage clear flash, containment confirm |
| Life Icon Active | Neon Red | #FF1744 | Active biohazard life icons |
| Life Icon Empty | Dim Red | #4A1A1A | Lost life icons |
| Supply Bar Fill | Cyan | #00E5FF | Remaining wall supply |
| Supply Bar Empty | Dark Gray | #263238 | Used wall supply |
| UI Button | Cyan | #00E5FF | Button outlines and text |
| UI Button Pressed | White | #FFFFFF | Button press state |
| Overlay Background | Black 80% | #000000CC | Pause/GameOver overlay bg |

### 4.3 SVG Specifications

All graphics are SVG strings defined in `config.js` and registered as base64 textures in BootScene.

**Empty Cell** (36x36 viewBox):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
  <rect x="1" y="1" width="34" height="34" rx="3" fill="#141E2E" stroke="#1E2A3A" stroke-width="1"/>
</svg>
```

**Wall Cell** (36x36 viewBox):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
  <rect x="1" y="1" width="34" height="34" rx="3" fill="#00E5FF" stroke="#00E5FF" stroke-width="1" opacity="0.9"/>
  <rect x="4" y="4" width="28" height="28" rx="2" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.3"/>
  <!-- inner cross pattern for wall texture -->
  <line x1="12" y1="1" x2="12" y2="35" stroke="#FFFFFF" stroke-width="0.5" opacity="0.15"/>
  <line x1="24" y1="1" x2="24" y2="35" stroke="#FFFFFF" stroke-width="0.5" opacity="0.15"/>
  <line x1="1" y1="12" x2="35" y2="12" stroke="#FFFFFF" stroke-width="0.5" opacity="0.15"/>
  <line x1="1" y1="24" x2="35" y2="24" stroke="#FFFFFF" stroke-width="0.5" opacity="0.15"/>
</svg>
```

**Infection Cell (Basic)** (36x36 viewBox):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
  <rect x="1" y="1" width="34" height="34" rx="3" fill="#39FF14" opacity="0.8"/>
  <circle cx="18" cy="18" r="8" fill="#39FF14" opacity="0.5"/>
  <!-- biohazard dot cluster -->
  <circle cx="18" cy="12" r="3" fill="#1B5E20"/>
  <circle cx="13" cy="21" r="3" fill="#1B5E20"/>
  <circle cx="23" cy="21" r="3" fill="#1B5E20"/>
</svg>
```

**Infection Cell (Diagonal/Yellow variant)**: Same structure, fill="#FFD600", dot fill="#F57F17".

**Infection Cell (Jumper/Purple variant)**: Same structure, fill="#B388FF", dot fill="#4A148C". Add dashed circle ring: `<circle cx="18" cy="18" r="14" fill="none" stroke="#B388FF" stroke-width="1" stroke-dasharray="4,3"/>`.

**Infection Cell (Splitter/Pink variant)**: Same structure, fill="#FF1744", dot fill="#B71C1C". Add split arrow: `<line x1="10" y1="18" x2="26" y2="18" stroke="#FFFFFF" stroke-width="1.5"/><polygon points="8,18 13,14 13,22" fill="#FFFFFF"/><polygon points="28,18 23,14 23,22" fill="#FFFFFF"/>`.

**Biohazard Life Icon** (24x24 viewBox):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
  <circle cx="12" cy="12" r="3" fill="currentColor"/>
  <circle cx="12" cy="5" r="2.5" fill="currentColor"/>
  <circle cx="6" cy="16" r="2.5" fill="currentColor"/>
  <circle cx="18" cy="16" r="2.5" fill="currentColor"/>
</svg>
```
(Use `#FF1744` for active, `#4A1A1A` for lost.)

**Edge Warning Overlay** (per-cell, 36x36):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
  <rect x="0" y="0" width="36" height="36" fill="#FF1744" opacity="0.2"/>
  <rect x="1" y="1" width="34" height="34" rx="3" fill="none" stroke="#FF1744" stroke-width="2" stroke-dasharray="6,3"/>
</svg>
```

**Design Constraints**:
- Maximum 8 path/shape elements per SVG object
- Use basic shapes (rect, circle, line, polygon) only -- no complex paths
- Infection cell pulsing animation via Phaser tween (scale 1.0 to 1.08 to 1.0, duration 600ms, yoyo, repeat -1)
- Wall placement animation via Phaser tween (scale 0.0 to 1.15 to 1.0, duration 150ms, ease 'Back.easeOut')

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Wall Slam | Wall placed | Cell scales from 0 to 1.15 to 1.0 (150ms, Back.easeOut). 6 cyan particles burst radially, lifespan 300ms, speed 40-80px/s. Flash cell white for 50ms. |
| Infection Pulse | Every spread tick | All infection cells scale to 1.08 then back to 1.0 (300ms, Sine.easeInOut). Glow ring expands from r=8 to r=16 and fades (400ms). |
| Infection Spread | Cell becomes infected | New cell scales from 0.3 to 1.0 (200ms). Color fills from center outward (radial tween). |
| Edge Warning | Infection 2 cells from edge | Edge cells flash red overlay (opacity 0 to 0.3, 500ms pulse loop). |
| Edge Breach | Infection reaches edge | Screen shake 8px for 300ms. Red flash overlay 150ms. Breached edge cell explodes with 12 red particles. Camera briefly zooms to 1.03x (200ms). |
| Stage Clear | All infections contained | All wall cells pulse bright white simultaneously (100ms). Green flash overlay (100ms). Contained infection cells shrink to 0 over 400ms. "+CLEAR!" floating text. Confetti: 20 cyan/green particles from top, gravity fall 600ms. |
| Life Lost | Edge breach confirmed | Biohazard icon shakes (4px, 200ms). Icon scales down to 0.5x then to 0 (300ms). Turns from #FF1744 to #4A1A1A. |
| Game Over | All lives lost | Full screen red tint (200ms). All cells darken (opacity to 0.3, 400ms). "QUARANTINE FAILED" text scales up from 0 to 1.0 (400ms, elastic). 600ms delay before Game Over UI appears. |
| Containment Combo | 2+ clusters contained in 2s | "x2 COMBO!" text at center, scales from 0.5 to 1.2 to 1.0 (200ms), color cycling cyan-white. Text size +4px per combo level. |
| Perfect Containment | Minimum walls used | Gold star icon drops from top with bounce (300ms). "PERFECT!" text in gold (#FFD600), scale punch 1.0 to 1.4 to 1.0 (250ms). |
| Mutation Warning | New mutation first appears | Pulsing exclamation mark above infected cell (scale 0.8 to 1.2, 400ms loop). Text label: "MUTATION: [TYPE]!" slides in from right (300ms), stays 1500ms, slides out. |

---

## 5. Audio Design

### 5.1 Sound Effects

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Wall Place | Sharp mechanical click-snap, satisfying latch sound | 80ms | High |
| Wall Place (low supply) | Same click but with subtle warning undertone (lower pitch) | 100ms | High |
| Infection Spread Tick | Wet organic squelch, quiet, ambient | 120ms | Low |
| Infection Spread (close to edge) | Same squelch but with rising pitch urgency | 150ms | Medium |
| Edge Breach | Deep thud + glass crack impact | 250ms | High |
| Life Lost | Low descending tone, alarm-like | 400ms | High |
| Stage Clear | Ascending 3-note chime (C-E-G), bright and clean | 600ms | High |
| Perfect Containment | Stage clear chime + sparkle overlay | 800ms | High |
| Combo Hit | Quick ascending ping, pitch +15% per combo level | 150ms | Medium |
| Game Over | Deep reverb drone descending, somber | 1000ms | High |
| New High Score | Celebratory ascending arpeggio | 1500ms | High |
| Mutation Warning | Distorted beep-beep alert | 300ms | Medium |
| Button Tap | Soft UI click | 60ms | Low |
| Wall Reclaim | Reverse click-snap (softer) | 80ms | Medium |
| Pause | Low tone fade-out | 200ms | Low |

### 5.2 Music Concept

**Background Music**: No persistent BGM track. Instead, ambient procedural tension layer. A low drone hum increases in intensity (volume from 0.1 to 0.4) as infections spread closer to edges. Staccato rhythmic pulses sync with the infection spread timer. This creates an organic audio tension curve without requiring music composition.

**Music State Machine**:

| Game State | Audio Behavior |
|-----------|---------------|
| Menu | Ambient low hum at 0.15 volume, slow pulse every 3s |
| Early Stages (1-5) | Quiet drone 0.1 volume, spread-synced tick |
| Mid Stages (6-15) | Drone rises to 0.2, tick frequency increases with spread speed |
| Late Stages (16+) | Drone at 0.3, urgent pulsing, proximity-based pitch rise |
| Danger (infection 2 cells from edge) | Drone spikes to 0.4, rapid heartbeat-like pulse |
| Stage Clear | Drone drops to 0.05 for 1s (relief moment), then resets for next stage |
| Game Over | Drone descends in pitch over 1s, then silence |
| Pause | All audio volume to 0.05 |

**Audio Implementation**: Web Audio API (built into Phaser 3). No external audio library needed -- Phaser's `this.sound.add()` with generated tones using AudioContext oscillators for the drone/pulse layer, and short synthesized sounds for effects.

---

## 6. UI/UX

### 6.1 Screen Flow

```
+------------+     +------------+     +------------+
|   Boot     |---->|    Menu    |---->|    Game    |
|   Scene    |     |   Scene    |     |   Scene    |
+------------+     +------+-----+     +------+-----+
                      |     |              |
                 +----+  +--+---+    +-----+------+
                 |       |      |    |   Pause    |
            +----+---+ +-+----+ |   |  Overlay   |--->[Help]
            |  Help  | |Stats | |   +-----+------+
            |How2Play| |Scene | |         |
            +--------+ +------+ |   +-----+------+
                                |   |  Game Over |
                           +----+---+   Scene    |
                           |Settings|   +---+----+
                           |Overlay |       |
                           +--------+ +-----+------+
                                      | Ad/Continue|
                                      |  Prompt    |
                                      +------------+
```

### 6.2 HUD Layout

```
+-------------------------------+
| 1250   Stage 7    [P]  ☣☣☣  |  <- Top HUD bar (48px height)
+-------------------------------+
|  +-------------------------+  |
|  |  .  .  .  .  .  .  .  .|  |
|  |  .  .  W  W  .  .  .  .|  |
|  |  .  .  W  I  W  .  .  .|  |  <- Grid area (centered, fills available space)
|  |  .  .  W  W  W  .  .  .|  |     Cell size = (screenWidth - 40px) / gridSize
|  |  .  .  .  .  .  .  .  .|  |     Min cell size: 32px, Max: 48px
|  |  .  .  .  .  .  .  .  .|  |
|  |  .  .  .  .  .  .  .  .|  |
|  |  .  .  .  .  .  .  .  .|  |
|  +-------------------------+  |
|                               |
+-------------------------------+
| Walls: ████████░░░░  12/20   |  <- Supply bar (52px height)
+-------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left, x=16, y=12 | Current score, 24px bold font, #FFFFFF | Every score event (with scale punch) |
| Stage | Top-center, x=center, y=12 | "Stage {N}", 20px font, #B0BEC5 | On stage transition |
| Pause Button | Top-right, x=screenW-48, y=8 | [P] icon, 32x32px tap target (48x48px hitbox) | Static |
| Lives | Top-right, x=screenW-16 (right-aligned), y=12 | 3 biohazard icons, 20x20px each, 4px gap | On life change |
| Wall Supply Bar | Bottom bar, centered | Filled bar (cyan) + empty (gray), 200px wide, 16px tall | On wall place/reclaim |
| Wall Count Text | Bottom bar, right of bar | "{remaining}/{total}", 18px, #B0BEC5 | On wall place/reclaim |
| Combo Text | Center of grid, floating | "x{N} COMBO!", 28px+, #00E5FF, fades after 1000ms | On combo event |
| Mutation Label | Below HUD bar, centered | "MUTATION: {TYPE}!", 16px, mutation color, slides in/out | On new mutation intro |

### 6.3 Menu Structure

**Main Menu (MenuScene)**:
- Game Title: "GRID QUARANTINE" -- 32px bold, #00E5FF, centered, y=25%
- Subtitle: "Contain the outbreak" -- 16px, #B0BEC5, centered, y=32%
- Animated background: Slow infection spread simulation on a dim 6x6 grid (decorative, non-interactive)
- **PLAY** button: 200x56px, centered, y=50%. Cyan border 2px, text "PLAY" 24px #00E5FF. On press: fill cyan, text white.
- **How to Play [?]** button: 48x48px circle, bottom-left corner (x=40, y=screenH-60). "?" text 24px.
- **Stats [trophy]** icon: 48x48px, bottom-center (x=center, y=screenH-60). Shows high score and stages reached.
- **Sound toggle [speaker]**: 48x48px, top-right (x=screenW-40, y=24). Toggles all audio.
- High Score display: Below title if exists. "BEST: {score}" 16px, #B0BEC5.

**Pause Menu (overlay, #000000CC background)**:
- "PAUSED" text, 28px, #FFFFFF, centered, y=30%
- Resume button: 180x48px, y=45%
- How to Play: 180x48px, y=55%
- Restart: 180x48px, y=65%
- Quit to Menu: 180x48px, y=75%
- All buttons: cyan border, cyan text, press-fill style

**Game Over Screen (GameOverScene)**:
- "QUARANTINE FAILED" text, 28px, #FF1744, centered, y=20%, scale-in animation
- Final Score: 40px bold, #FFFFFF, centered, y=33%, count-up animation (0 to final over 800ms)
- "NEW BEST!" text: 20px, #FFD600, y=40% (only if new high score, bounce animation)
- Stage Reached: "Stage {N}", 20px, #B0BEC5, y=45%
- Efficiency: "Walls saved: {N}", 16px, #B0BEC5, y=50%
- **Continue (Ad)** button: 180x48px, y=60%. "Watch Ad for +1 Life" text. Green border (#00E676). Only shown once per game, only if lives < 3.
- **Play Again** button: 180x48px, y=70%. Cyan border.
- **Menu** button: 180x48px, y=80%. Dim white border (#B0BEC5).

**Help / How to Play Screen (HelpScene -- overlay or scene)**:
- Title: "HOW TO PLAY", 24px, #00E5FF, y=8%
- **Section 1 - Goal** (y=15%): "Contain the infection before it reaches the edges!" + SVG diagram showing a 4x4 mini-grid with infection in center, walls surrounding it, green checkmark.
- **Section 2 - Controls** (y=35%): "TAP empty cells to place walls" + SVG hand icon tapping a cell, wall appearing with cyan flash. "DOUBLE-TAP your walls to reclaim (Stage 6+)" + SVG diagram.
- **Section 3 - Watch Out** (y=55%): Visual icons for each mutation type with 1-line description:
  - Green blob + "Basic: spreads up/down/left/right"
  - Yellow blob + "Diagonal: spreads in 8 directions"
  - Purple blob + "Jumper: leaps over walls"
  - Pink blob + "Splitter: splits when hitting walls"
- **Section 4 - Tips** (y=78%):
  - "Start walls near edges to create barriers"
  - "Save walls -- efficiency bonus for unused walls!"
  - "Watch for mutation warnings!"
- **"GOT IT!" button**: 160x48px, centered, y=90%. Returns to previous screen.
- Scrollable via Phaser camera drag if content exceeds viewport.
- Background: #0A0E1A with 0.95 opacity.

**Stats Screen (overlay)**:
- High Score, Highest Stage, Total Games Played, Total Infections Contained
- All values from localStorage
- "CLOSE" button at bottom

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over (before Play Again) | Every 3rd game over | After 5 seconds |
| Rewarded | "Continue with +1 Life" on game over | Every game over (once per game) | Always (optional) |
| Rewarded | "Quarantine Supply: +5 extra walls" between stages | Every 5 stages (stage 5, 10, 15...) | Always (optional) |
| Rewarded | "Double Score" on game over | Every game over | Always (optional) |
| Banner | Menu screen bottom | Always visible on menu | N/A |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Life | Watch rewarded ad after death | +1 life, resume current stage | Once per game session |
| Quarantine Supply | Watch rewarded ad between stages | +5 walls added to next stage supply | Every 5 stages (offer appears) |
| Double Score | Watch rewarded ad at game over | Final score x2 | Once per session |

### 7.3 Session Economy

The game is generous with free play. First 5 stages require no ads. The quarantine supply ad is a soft nudge every 5 stages -- entirely optional, the game is balanced without it. The continue ad is high-value (emotional: "I was on Stage 22!"). The double-score ad is low-pressure end-of-session monetization.

**Session Flow with Monetization**:
```
[Play Free: Stage 1-4]
    |
[Stage 5 Clear] --> [Rewarded Ad: +5 Walls?]
    | Yes --> +5 walls next stage       | No --> continue normally
    v
[Play: Stage 6+, mutations begin]
    |
[Edge Breach --> Life Lost]
    |
[All Lives Lost --> Game Over]
    |
[Rewarded Ad: Continue +1 Life?]
    | Yes --> Resume current stage      | No --> Game Over Screen
                                              |
                                        [Interstitial (every 3rd game over)]
                                              |
                                        [Score Display]
                                              |
                                        [Rewarded Ad: Double Score?]
                                              | Yes --> Score x2
                                              | No  --> [Play Again / Menu]
```

**Expected ad views per session**: ~1.5 (continue ad has ~40% take rate, supply ad ~25%, double score ~20%).

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/grid-quarantine/
|-- index.html              # Entry point, CDN + script load order
|   |-- CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
|   |-- Local CSS           # css/style.css
|   |-- Local JS (ordered)  # config -> stages -> ads -> help -> ui -> game -> main (LAST)
|-- css/
|   |-- style.css           # Responsive layout, mobile-first, dark theme
|-- js/
    |-- config.js           # Constants, colors, SVGs, difficulty tables, mutation definitions
    |-- main.js             # BootScene, Phaser init, scene registration, global state (LOADS LAST)
    |-- game.js             # GameScene: grid logic, infection spread, wall placement, containment check
    |-- stages.js           # Stage generation, difficulty params, mutation scheduling, solvability BFS
    |-- ui.js               # MenuScene, GameOverScene, HUD overlay, pause overlay, stats overlay
    |-- help.js             # HelpScene: illustrated how-to-play with SVG diagrams
    |-- ads.js              # Ad hooks, reward callbacks, frequency tracking
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `COLORS` object: all hex values from color palette (Section 4.2)
- `GRID` object: `{ SIZES: [6, 8, 10, 12], CELL_MIN_PX: 32, CELL_MAX_PX: 48, PADDING: 20 }`
- `DIFFICULTY` array: progression table (Section 2.4) as lookup objects per stage range
- `MUTATIONS` object: enum of mutation types with spread behavior descriptors
- `SCORING` object: all point values from Section 2.3
- `TIMING` object: `{ SPREAD_BASE: 2000, SPREAD_MIN: 1000, WALL_PLACE_ANIM: 150, DEATH_DELAY: 600, STAGE_TRANSITION: 600, COMBO_WINDOW: 2000, INACTIVITY_WARN: 6000 }`
- `JUICE` object: all tween/particle values from Section 9
- `SVG_STRINGS` object: all SVG template strings (empty cell, wall, infection variants, life icon, edge warning)
- `AUDIO` object: frequency/duration definitions for synthesized sounds
- `STORAGE_KEYS` object: localStorage key names

**main.js** (max 300 lines -- LOADS LAST):
- `BootScene`: Register ALL SVG textures via `textures.addBase64()` once. Listen for `addtexture` events. Start MenuScene when all textures loaded.
- Phaser.Game config: `{ type: Phaser.AUTO, width: 360, height: 640, backgroundColor: COLORS.BACKGROUND, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene] }`
- `GameState` global: `{ score: 0, stage: 1, lives: 3, highScore: 0, gamesPlayed: 0, highestStage: 0, wallsRemaining: 0, wallsTotal: 0, runSeed: 0, mutationOrder: [], settings: { sound: true, vibration: true }, adContinueUsed: false, adSupplyUsed: false }`
- localStorage read/write helpers: `saveState()`, `loadState()`
- Orientation change handler: resize game on orientation change, maintain portrait

**game.js** (max 300 lines):
- `GameScene.create()`: Build grid as 2D array of cell objects `{ row, col, state: 'empty'|'wall'|'infected'|'edge', mutation: null, sprite: null }`. Place infection sources per stage params. Start spread timer. Set up tap input handler on grid area.
- `GameScene.update()`: Check inactivity timer. Update edge warning visuals. Check win condition (all infection cells have no empty neighbors).
- `placeWall(row, col)`: Validate cell is empty and wallsRemaining > 0. Set cell state to 'wall'. Decrement wallsRemaining. Play wall slam animation + sound. Check containment.
- `spreadInfection()`: For each infected cell, calculate spread targets based on mutation type. For each valid target (empty cell, not wall, not already infected), infect it. Check edge breach. Schedule next spread tick.
- `checkContainment()`: BFS from each infected cell. If no infected cell can reach an empty cell, stage is cleared. Trigger stage clear sequence.
- `checkEdgeBreach()`: If any infected cell is on row 0, row max, col 0, or col max, trigger life loss.
- `loseLife()`: Decrement lives. Play breach effects. If lives == 0, transition to GameOverScene. Else restart current stage.
- `clearStage()`: Calculate score (containment + efficiency + perfect + combo). Play clear animation. After 1200ms, advance to next stage.
- `reclaimWall(row, col)`: If cell is 'wall' and was placed this stage, return to empty, increment wallsRemaining.
- Input handler: `this.input.on('pointerdown', (pointer) => { ... })` -- convert pointer x,y to grid row,col. Check cell state. Single tap = placeWall. Track double-tap timing (< 300ms between taps on same cell) for reclaim.

**stages.js** (max 300 lines):
- `generateStage(stageNumber, runSeed)`: Returns `{ gridSize, infectionSources: [{row, col}], wallSupply, spreadInterval, mutations: [string], isRest: bool, minWalls: int }`.
- `getStageParams(stageNumber)`: Lookup difficulty table, return raw params.
- `placeInfections(gridSize, count, seed)`: Seeded RNG to place infections in interior zone. Enforce minimum distance.
- `calculateMinWalls(gridSize, infections)`: BFS flood fill from each infection. Find minimum wall count needed to prevent any infection path from reaching edge. Used for Perfect Containment bonus threshold.
- `shuffleMutations(runSeed)`: Fisher-Yates shuffle of mutation pool using seeded RNG. Returns ordered array determining which mutation appears at which stage tier.
- `getMutationsForStage(stageNumber, mutationOrder)`: Based on progression table, return active mutation types for this stage.
- `seededRandom(seed)`: Simple seeded PRNG (mulberry32 or similar). Returns function that produces deterministic random values.
- `validateSolvability(gridSize, infections, wallSupply)`: Verify wallSupply >= minWalls. Always true by construction, but serves as assertion.

**ui.js** (max 300 lines):
- `MenuScene`: Render menu layout (Section 6.3). Animated background grid. Button handlers. High score display from GameState.
- `GameOverScene`: Score display with count-up animation. High score check + celebration. Ad prompt buttons. Play Again / Menu buttons.
- `HUDOverlay` (launched as parallel scene from GameScene): Score text, stage text, lives icons, wall supply bar. Update methods called from GameScene events.
- `PauseOverlay`: Semi-transparent overlay. Resume/Restart/Help/Quit buttons. Pauses GameScene spread timer.
- `StatsOverlay`: High score, highest stage, games played display.

**help.js** (max 300 lines):
- `HelpScene`: Full-screen or overlay scene with illustrated instructions.
- SVG diagram rendering: mini-grid examples showing infection + walls + containment.
- Mutation type visual gallery with colored icons and 1-line descriptions.
- Touch control illustration: hand icon + tap target + wall appearance.
- Tips section with beginner advice.
- "GOT IT!" button returns to calling scene (menu or pause).
- Scrollable camera if content exceeds viewport height.

**ads.js** (max 300 lines):
- `AdManager` object/class: tracks game over count, ad cooldowns, reward states.
- `showInterstitial()`: Placeholder. Called every 3rd game over.
- `showRewardedContinue(callback)`: Placeholder. Calls `callback(true)` on reward, `callback(false)` on skip.
- `showRewardedSupply(callback)`: Placeholder. Awards +5 walls.
- `showRewardedDouble(callback)`: Placeholder. Doubles final score.
- `canShowContinueAd()`: Returns true if not used this game.
- `canShowSupplyAd(stageNumber)`: Returns true if stage % 5 === 0 and not used this set of 5.
- Ad event stubs: `onAdLoaded`, `onAdClosed`, `onAdRewarded`, `onAdFailed`.

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No additional CDN dependencies. Audio is synthesized via Web Audio API (Phaser built-in).

---

## 9. Juice Specification

### 9.1 Player Input Feedback (Wall Placement -- every tap)

| Effect | Target | Values |
|--------|--------|--------|
| Scale Punch | Wall cell sprite | Scale: 0.0 -> 1.15 -> 1.0, Duration: 150ms, Ease: Back.easeOut |
| Particles | Wall cell position | Count: 6, Direction: radial 360deg, Color: #00E5FF, Speed: 40-80px/s, Lifespan: 300ms, Size: 3px circles, Fade: alpha 1.0 -> 0.0 |
| Flash | Wall cell | Tint: #FFFFFF for 50ms, then revert to #00E5FF |
| Screen Shake | Camera | Intensity: 1.5px, Duration: 60ms (subtle, not disruptive) |
| Sound | -- | Mechanical click-snap, 80ms, base pitch 800Hz. When wallsRemaining < 5: pitch drops to 500Hz (warning feel) |
| Haptic | Device | navigator.vibrate(15) on supported devices |

### 9.2 Core Action Additional Feedback (Containment -- most satisfying moment)

| Effect | Values |
|--------|--------|
| Wall Glow Pulse | All walls in containment ring pulse brightness 1.0 -> 1.5 -> 1.0, Duration: 200ms |
| Infection Shrink | Contained infection cells shrink scale 1.0 -> 0.0, Duration: 400ms, Ease: Cubic.easeIn |
| Particles (containment burst) | Count: 20, Colors: [#00E5FF, #00E676], Direction: radial from center of contained area, Speed: 60-120px/s, Lifespan: 500ms, Size: 2-5px |
| Hit-stop | 40ms physics pause (spread timer paused), grid cells freeze |
| Camera Zoom | Zoom to 1.03x centered on containment area, Recovery: 200ms ease back to 1.0x |
| Combo Escalation | Each successive containment within 2000ms: particles +5 count, shake +0.5px intensity, combo text size +4px, sound pitch +15% |
| Score Float | "+{points}" text, Color: #00E676, Size: 20px, Float up 60px over 600ms, Alpha: 1.0 -> 0.0 |

### 9.3 Death/Failure Effects (Edge Breach)

| Effect | Values |
|--------|--------|
| Screen Shake | Intensity: 8px, Duration: 300ms, Decay: linear |
| Red Flash | Full-screen overlay #FF1744 opacity 0 -> 0.4 -> 0, Duration: 200ms |
| Breach Explosion | At breached edge cell: 12 particles, Color: #FF1744, Speed: 80-150px/s, Lifespan: 400ms, Size: 3-6px |
| Camera Zoom | Zoom to 1.03x on breach point, Hold: 150ms, Recovery: 200ms |
| Sound | Deep thud 250ms (200Hz base) + glass crack layered |
| Grid Darken (game over only) | All cells alpha -> 0.3 over 400ms |
| Slow Motion (game over only) | Time scale 0.3x for 400ms (use Phaser timeScale on spread timer, NOT global timeScale) |
| Effect -> UI Delay | 600ms from death effect start to Game Over UI appearing |
| Death -> Restart | Total: 600ms effects + 600ms stage rebuild = 1200ms (under 2 seconds) |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating Text | "+{N}" text, Color: #00E676 (normal) / #FFD600 (bonus/perfect), Start: at event position, Movement: float up 60px, Duration: 600ms, Alpha fade: 1.0 -> 0.0 over last 300ms |
| Score HUD Punch | Scale: 1.0 -> 1.3 -> 1.0, Duration: 150ms, Ease: Quad.easeOut |
| Combo Text | "x{N} COMBO!", Position: grid center, Size: 28px base + 4px per combo level (max 48px), Color: #00E5FF, Scale punch: 0.5 -> 1.2 -> 1.0 (200ms), Hold: 800ms, Fade: 200ms |
| Perfect Text | "PERFECT!", Position: grid center, Size: 36px, Color: #FFD600, Scale: 0 -> 1.4 -> 1.0 (250ms, elastic ease), Hold: 1000ms, Fade: 300ms |
| Stage Clear Text | "+CLEAR!", Position: grid center, Size: 32px, Color: #00E676, Scale punch 1.0 -> 1.2 -> 1.0 (150ms), Hold: 600ms |

### 9.5 Ambient Juice (Always Running)

| Effect | Values |
|--------|--------|
| Infection Pulse | All infected cells: scale 1.0 -> 1.08 -> 1.0, Duration: 600ms, Ease: Sine.easeInOut, Loop: infinite, Stagger: 50ms between cells |
| Infection Glow Ring | Per infected cell: circle ring r=8 -> r=16, alpha 0.5 -> 0.0, Duration: 400ms, Triggered each spread tick |
| Edge Warning Pulse | Edge cells within 2 cells of infection: overlay opacity 0 -> 0.3 -> 0, Duration: 500ms, Loop: infinite while threat active |
| Wall Idle Shimmer | Placed walls: subtle brightness oscillation 0.9 -> 1.0 -> 0.9, Duration: 2000ms, Loop: infinite (barely noticeable, adds life) |
| Supply Bar Urgency | When wallsRemaining <= 3: bar color shifts #00E5FF -> #FF6D00 (orange), pulses scale 1.0 -> 1.02 -> 1.0 every 500ms |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | Performance.timing API |
| Memory Usage | <80MB | Chrome DevTools Memory panel |
| JS Bundle Size | <120KB total (excl. CDN) | File size check |
| First Interaction | <500ms after load | Time to first meaningful paint |
| Grid Render Time | <16ms for full 12x12 redraw | Performance.now() delta |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser's `pointer` input system. Single pointerdown for wall placement.
- **Prevent Default**: Prevent pull-to-refresh (`touch-action: none` on canvas), pinch-to-zoom (viewport meta), double-tap-to-zoom (viewport meta).
- **Orientation**: CSS media query locks to portrait. On landscape: show "Please rotate" overlay with rotation icon. Game pauses in landscape.
- **Safe Areas**: `env(safe-area-inset-top)` etc. applied to HUD positioning. Grid area respects safe-area-inset-bottom.
- **Throttling**: `document.addEventListener('visibilitychange')` -- pause spread timer and game when tab/app backgrounded.
- **Asset Loading**: Zero external assets. All SVGs generated in code. No loading screen needed.
- **Object Pooling**: Infection cells and particles use Phaser Groups with `maxSize` to prevent GC spikes. Max particles: 50 simultaneous. Max infection cells: 144 (12x12 grid).
- **Grid Rendering**: Use Phaser `RenderTexture` for the static grid lines. Only update changed cells (dirty flag per cell) instead of full grid redraw.

### 10.3 Touch Controls

- **Touch Target Size**: Each grid cell minimum 32px (on 12x12 grid at 360px width). For 6x6 and 8x8 grids, cells are 48px+ (well above 44px minimum).
- **Tap Detection**: `pointerdown` event only. No drag gestures. Tap position snaps to nearest grid cell center.
- **Double-Tap Detection**: Two taps on same cell within 300ms. First tap places wall; if second tap within 300ms on same cell AND cell is a wall placed this stage, reclaim it. Implementation: store `lastTapCell` and `lastTapTime`.
- **Feedback Latency**: Wall appears within 1 frame (16ms) of tap. Animation is cosmetic overlay on already-placed wall.
- **Accidental Tap Prevention**: 100ms cooldown between wall placements (prevent multi-cell spam from jittery fingers). Does NOT apply to double-tap reclaim.
- **Input Buffering**: If player taps during stage transition animation, buffer the tap and apply it when new stage grid is ready.

### 10.4 Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome (Android) | 80+ | Primary target |
| Safari (iOS) | 14+ | Test Web Audio API autoplay restrictions (require user gesture before first sound) |
| Samsung Internet | 14+ | Popular on Samsung devices |
| Firefox (Android) | 90+ | Secondary target |

### 10.5 Local Storage Schema

```json
{
  "gq_high_score": 0,
  "gq_games_played": 0,
  "gq_highest_stage": 0,
  "gq_total_infections_contained": 0,
  "gq_total_walls_placed": 0,
  "gq_perfect_stages": 0,
  "gq_settings": {
    "sound": true,
    "vibration": true
  }
}
```

All keys prefixed with `gq_` to avoid collision with other games on same domain. Read on BootScene init. Write on game over and settings change. Use `try/catch` around all localStorage calls (private browsing mode may throw).

### 10.6 Known Pitfalls and Guards

1. **Spread timer must use Phaser TimerEvent, not setInterval**: Ensures pause/resume works correctly with scene lifecycle.
2. **Never modify grid array during spread iteration**: Clone infection list before iterating. Spread targets are collected first, then applied in batch after iteration completes.
3. **Splitter mutation wall check**: When splitter infection hits a wall, new infection spawns 2 cells perpendicular. Must validate target cell is within grid bounds AND is empty. If no valid perpendicular cell exists, splitter is simply blocked (no crash).
4. **Jumper mutation bounds check**: Jumper skips 1 cell. Target cell = current + 2*direction. Must check both the skipped cell (can be anything) and the target cell (must be in-bounds and empty to infect).
5. **Double-tap vs rapid placement**: Track `lastTapCell` coordinates. If second tap is on a DIFFERENT cell within 300ms, treat as two separate wall placements (no reclaim). Only reclaim if same cell tapped twice.
6. **Stage transition race condition**: Disable input during stage clear animation (1200ms). Re-enable only after new grid is fully built and rendered.
7. **CSS display:none kills Phaser canvas**: If hiding game container for any overlay, use `visibility: hidden; height: 0; overflow: hidden` instead of `display: none`.
8. **Texture key collision on restart**: All SVG textures registered once in BootScene. GameScene restart does NOT re-register textures. Use `textures.exists(key)` guard.
9. **HUD score text initialization**: Always initialize score display from `GameState.score`, never hardcode `'0'`. On scene restart, read from GameState to display correct value.
10. **Wall supply bar must read from GameState.wallsRemaining**: Not from a local variable. Prevents desync on scene restart or ad-reward wall addition.
