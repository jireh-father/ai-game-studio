# Game Design Document: Num Collapse

**Slug**: `num-collapse`
**One-Liner**: Merge adjacent same-numbers on a hex grid before the board fills up -- but merging shifts ALL neighbors, creating chain reactions or disasters.
**Core Mechanic**: Numbers 1-6 spawn on honeycomb grid. Tap two adjacent matching numbers to merge into their sum. Neighbors collapse inward toward gap. Cascading shifts can align new matches (chain!) or create unmergeable clusters. New numbers spawn every 5 seconds. Board full = game over.
**Target Session Length**: 60-180 seconds
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Num Collapse is a fast-paced puzzle survival game played on a compact hexagonal grid. Numbers between 1 and 6 appear in honeycomb cells, and the player must tap two adjacent cells with matching numbers to merge them into a single cell showing their sum. The merged cell stays; the other cell vanishes, and all neighbors of the empty cell collapse inward to fill the gap. This collapse can cascade -- shifted numbers may land next to new matches, enabling chain reactions that clear huge swaths of the board.

The twist is that collapse is unpredictable. When neighbors shift inward, they might create beautiful chains worth massive points, or they might cluster incompatible numbers together, creating dead zones. The player must think spatially about hex adjacency while under constant time pressure: every 5 seconds, a new number spawns in a random empty cell. If the board fills completely with no adjacent matches remaining, the game is over. Inactivity guarantees death within 15-20 seconds as spawns overwhelm the grid.

The result is a game that feels like controlled demolition. Every merge is a calculated bet -- will the collapse help or hurt? Skilled players read the board 2-3 moves ahead, setting up chain reactions. Casual players enjoy the satisfying crunch of numbers collapsing and the dopamine of unexpected chains. The Threes/2048 DNA is clear, but the hex grid + physics collapse + time pressure make it feel fresh and urgent.

### 1.2 Target Audience

Casual mobile gamers aged 14-40 who play during commutes, breaks, or idle moments. Fans of number puzzle games (2048, Threes, Drop Merge) who want something faster and more tactile. Players who enjoy the satisfaction of chain reactions and spatial reasoning under pressure.

### 1.3 Core Fantasy

You are a number alchemist dissolving chaos into order. Each merge feels like defusing a bomb -- collapse the right numbers and the board breathes; collapse the wrong ones and the grid chokes. The fantasy is mastery over an ever-filling grid, turning spawn pressure into chain reaction fuel.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 60-180 seconds |
| Day 1 Retention | 42%+ |
| Day 7 Retention | 20%+ |
| Average Merges per Session | 15-40 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Numbers Spawn on Grid] --> [Scan for Adjacent Matches] --> [Tap Cell A then Cell B]
        ^                                                           |
        |                                                   [Merge: A+B = Sum]
        |                                                           |
        |                                                   [Neighbors Collapse Inward]
        |                                                           |
        |                                                   [Chain Detection: New Matches?]
        |                                                           |   Yes --> [Auto-Merge Chains]
        |                                                           |   No  --> [Wait for Next Input]
        |                                                           |
        +---------------- [Board Full + No Matches = DEATH] -------+
```

Moment-to-moment: the player scans the hex grid for adjacent pairs of matching numbers, taps the first cell (it highlights), taps an adjacent matching cell to merge. The merge animation plays, the gap collapses, and the player watches for chain reactions. Meanwhile, every 5 seconds a new number pops into a random empty cell with a subtle bounce. The spawn timer is visible as a circular progress ring around the grid border. As spawns accumulate, urgency builds. The player must merge faster or die.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Select Cell | Tap | Tap a hex cell to select it. Cell highlights with a glow ring. Tap same cell to deselect. |
| Merge | Tap Adjacent Match | With a cell selected, tap an adjacent cell with the same number to merge them. Invalid taps (non-adjacent, non-matching) flash red and deselect. |
| Quick Merge | Swipe | Swipe from one cell to an adjacent matching cell to select+merge in one gesture. Faster for experienced players. |

**Control Philosophy**: Tap-tap is the primary input -- dead simple, zero learning curve. Swipe-merge is an advanced shortcut that rewards dexterity. Both are single-thumb friendly. The hex grid is the entire interaction surface; no separate control zone needed.

**Touch Area Map**:
```
+-------------------------------+
| [Score: 4280]   [Best: 12400]|  <- Top HUD bar (40px)
| [Chain: x3]        [?] [||]  |  <- Sub-HUD (30px)
+-------------------------------+
|                               |
|         HONEYCOMB GRID        |  <- Full hex grid (tap any cell)
|        /  \  /  \  /  \      |     All cells are tap targets
|       | 3  || 3  || 5  |     |     Min cell tap area: 48x48px
|        \  /  \  /  \  /      |
|       | 1  || 6  || 2  |     |
|        \  /  \  /  \  /      |
|       | 4  || 2  || 4  |     |
|        \  /  \  /  \  /      |
|                               |
+-------------------------------+
| [Spawn Timer Ring]            |  <- Bottom area (spawn countdown)
| [Wave: 3]                    |
+-------------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Basic Merge (1+1=2) | 10 x sum_value | Chain multiplier applies |
| Basic Merge (2+2=4) | 10 x sum_value = 40 | Chain multiplier applies |
| Basic Merge (3+3=6) | 10 x sum_value = 60 | Chain multiplier applies |
| Basic Merge (4+4=8) | 80 | Chain multiplier applies |
| Basic Merge (5+5=10) | 100 | Chain multiplier applies |
| Basic Merge (6+6=12) | 120 | Chain multiplier applies |
| Chain Bonus | +50 per chain step | Stacks: chain 2 = +50, chain 3 = +100, chain 4 = +150 |
| High-Number Merge (sum >= 8) | 1.5x base points | Stacks with chain multiplier |
| Board Clear Bonus | 500 | If grid reaches 0 occupied cells (extremely rare) |

**Combo System**: When a collapse triggers an automatic match (chain), a chain counter increments. Chain multiplier = 1 + (chain_count * 0.5). So chain 1 = 1.5x, chain 2 = 2.0x, chain 3 = 2.5x, etc. Chain counter resets after cascade settles. Visual: chain counter text grows larger and shifts color from white (#FFFFFF) to yellow (#FFD700) at chain 2, to orange (#FF8C00) at chain 3, to red (#FF4444) at chain 4+.

**High Score**: Stored in localStorage as `num_collapse_high_score`. Displayed on menu and game over screen. New high score triggers gold particle burst + "NEW BEST!" bounce text.

### 2.4 Progression System

The game uses a wave-based difficulty system. Each wave lasts 30 seconds of real time. Wave number determines spawn rate, number pool, and special cell introduction.

**Progression Milestones**:

| Wave | Duration | New Element | Spawn Interval | Number Pool |
|------|----------|-------------|----------------|-------------|
| 1 | 0-30s | Base mechanics. Numbers 1-3 only. | 5.0s | 1, 2, 3 |
| 2 | 30-60s | Numbers 4 introduced. | 4.5s | 1, 2, 3, 4 |
| 3 | 60-90s | Numbers 5 introduced. | 4.0s | 1, 2, 3, 4, 5 |
| 4 | 90-120s | Numbers 6 introduced. | 3.5s | 1, 2, 3, 4, 5, 6 |
| 5 | 120-150s | Frozen cells appear (10% chance). | 3.0s | 1-6 |
| 6 | 150-180s | Frozen cell rate 20%. Spawn rate faster. | 2.5s | 1-6 |
| 7+ | 180s+ | Wild cells (5% chance). Bomb cells (5% chance). | 2.0s (floor) | 1-6 + specials |

**Special Cells**:
- **Frozen Cell**: Spawns with a number but cannot be selected or merged. Thaws after 15 seconds, becoming a normal cell. Blocks collapse paths. Visual: ice-blue overlay with frost SVG.
- **Wild Cell**: Shows a "?" symbol. Matches ANY adjacent number. On merge, takes the value of the matched cell. Visual: rainbow gradient border, pulsing glow.
- **Bomb Cell**: Shows a bomb icon. If it sits for 10 seconds without being adjacent-merged, it explodes and fills 2 random empty cells with high numbers (5 or 6). Can be defused by merging any adjacent pair that causes the bomb cell to collapse. Visual: red pulsing circle with countdown number overlay.

### 2.5 Lives and Failure

The game has a single-life design. There is no lives system -- the board state IS your health.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Board full (all cells occupied) + no adjacent matches exist | Game Over | Watch ad to remove 3 random cells (once per game) |
| Inactivity: 3 consecutive spawns with no player merge | Warning flash at spawn 2; game over at spawn 3 if still idle | Tap any merge to reset inactivity counter |

**Death Timing**: Spawn interval starts at 5.0s. With 19 hex cells and initial 4 filled, 15 empty cells / 5s per spawn = 75 seconds max if player does nothing. But from wave 2+ with 4.5s spawns and fewer empties, inactivity death occurs within 15-20 seconds. The 3-spawn inactivity rule guarantees death within 15s even at the slowest spawn rate (3 x 5s = 15s).

---

## 3. Stage Design

### 3.1 Hex Grid Layout

The game uses a flat-top hexagonal grid with an axial coordinate system.

**Grid Dimensions** (optimized for 360-428px viewport width):

```
Grid Configuration:
- Grid type: Flat-top hexagons, axial coordinates (q, r)
- Grid radius: 2 rings around center = 19 total cells
  - Ring 0 (center): 1 cell
  - Ring 1: 6 cells
  - Ring 2: 12 cells
  - Total: 19 cells
- Hex cell radius: 32px (center to vertex)
- Hex cell width: 64px (vertex to vertex, flat-top)
- Hex cell height: 55.4px (2 * radius * sin(60deg) = 55.4px)
- Horizontal spacing: 48px (width * 0.75, flat-top overlap)
- Vertical spacing: 55.4px
- Grid total width: 5 columns * 48px + 16px padding = 256px
- Grid total height: 5 rows * 55.4px = 277px
- Grid center: (viewport_width / 2, viewport_height * 0.45)
- Min tap target: 48px diameter (inner circle of hex) -- meets 44px minimum
```

**Axial Coordinate Map**:
```
        (0,-2)  (1,-2)
      (-1,-1) (0,-1) (1,-1)
    (-2,0) (-1,0) (0,0) (1,0) (2,0)
      (-1,1) (0,1) (1,1) (2,1)
        (0,2)  (1,2)

   -- Wait, for radius-2 hex grid with flat-top --

   Ring 0: (0,0)
   Ring 1: (1,0),(0,1),(-1,1),(-1,0),(0,-1),(1,-1)
   Ring 2: (2,0),(1,1),(0,2),(-1,2),(-2,2),(-2,1),
           (-2,0),(-1,-1),(0,-2),(1,-2),(2,-2),(2,-1)
```

**Pixel Position Calculation (flat-top hex)**:
```javascript
// Axial to pixel (flat-top):
pixelX = centerX + hexRadius * (3/2 * q);
pixelY = centerY + hexRadius * (sqrt(3)/2 * q + sqrt(3) * r);
```

**Adjacency (6 neighbors per cell)**:
```
Flat-top hex neighbors of (q, r):
  (q+1, r), (q-1, r),      // East, West
  (q, r+1), (q, r-1),      // SE, NW
  (q+1, r-1), (q-1, r+1)   // NE, SW
```

### 3.2 Merge + Collapse Algorithm

**Step 1: Selection Validation**
```
1. Player taps cell A at (q1, r1) -- highlight it
2. Player taps cell B at (q2, r2)
3. Validate:
   a. B is adjacent to A (one of 6 hex neighbors)
   b. A.value === B.value
   c. Neither A nor B is frozen
4. If invalid: flash red on B, deselect A, return
```

**Step 2: Merge Execution**
```
1. New value = A.value + B.value
2. Cell A becomes the merge target: A.value = new_value
3. Cell B becomes empty (removed from grid)
4. Play merge animation on A (scale punch 1.4x, particle burst)
5. Award score: 10 * new_value * chain_multiplier
6. Show floating score text at A position
```

**Step 3: Collapse (Gravity Fill)**
```
1. After cell B is removed, find all cells adjacent to B's position
2. For each neighbor N of the empty position (B):
   a. If N is on the OPPOSITE side of B from A (i.e., farther from A):
      - N slides toward B's former position
      - N's old position becomes empty
      - Animate slide: 150ms ease-out
3. If multiple neighbors qualify, they all slide simultaneously
4. Process cascading empties: repeat step 2 for any newly created gaps
   (max depth: 3 to prevent infinite loops)
5. After all slides complete (150ms per step, max 450ms total):
   proceed to chain detection
```

**Simplified Collapse Rule**: When cell B is removed, the neighbor of B that is diametrically opposite to A slides into B's position. If that cell had a neighbor behind it, that neighbor slides forward too. This creates a single-direction collapse line from the far edge toward the merge point.

**Step 4: Chain Detection**
```
1. After collapse settles, scan all occupied cells
2. For each cell, check all 6 neighbors for matching values
3. If any adjacent pair matches:
   a. Increment chain_counter
   b. Auto-merge the pair (always merge toward center of grid)
   c. Repeat collapse (Step 3)
   d. Repeat chain detection (Step 4)
4. If no matches found: chain ends, reset chain_counter
5. Max chain depth: 8 (safety cap to prevent runaway)
```

**Chain Cascade Timing**:
- Merge animation: 200ms
- Collapse slide: 150ms per step
- Chain detection delay: 100ms (let player see the board)
- Total per chain step: ~450ms
- Max cascade time: 8 * 450ms = 3.6s (rare, exciting)

### 3.3 Spawn System

```
Spawn Algorithm:
1. Timer: spawnInterval (starts 5000ms, decreases per wave)
2. On timer fire:
   a. Find all empty cells
   b. If no empty cells: check for adjacent matches
      - If no matches: GAME OVER
      - If matches exist: skip this spawn (grace)
   c. Pick random empty cell
   d. Pick random number from current wave's pool
      - Wave 1-2: weighted toward low numbers (1: 40%, 2: 35%, 3: 25%)
      - Wave 3-4: uniform distribution across pool
      - Wave 5+: weighted toward high numbers (5: 30%, 6: 25%, rest: 45%/count)
   e. Special cell chance (wave 5+):
      - Frozen: 10% (wave 5), 20% (wave 6+)
      - Wild: 5% (wave 7+)
      - Bomb: 5% (wave 7+)
   f. Spawn cell with pop-in animation (scale 0 -> 1.1 -> 1.0, 200ms)
   g. Reset spawn timer
```

**Initial Board Setup**:
- Wave 1 starts with 4 random cells pre-filled (numbers 1-3)
- At least 1 adjacent matching pair guaranteed in initial setup
- Cells placed in ring 1 positions for balanced start

### 3.4 Game Over Detection

```
Game Over Check (runs after every spawn):
1. Count empty cells
2. If empty_cells > 0: NOT game over, return
3. If empty_cells === 0:
   a. For each occupied cell, check all 6 neighbors
   b. If ANY adjacent pair has matching values: NOT game over (player can still merge)
   c. If NO adjacent pairs match: GAME OVER
4. Trigger death sequence
```

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Clean, minimalist number puzzle aesthetic. Flat design with subtle gradients on hex cells. Inspired by Threes and 2048 but with a honeycomb twist. Soft pastel numbers on white/light cells with a dark background for contrast.

**Aesthetic Keywords**: Clean, Pastel, Geometric, Satisfying, Modern

**Reference Palette**: Think Threes! meets a modern fintech app -- rounded corners, generous whitespace (within cells), bold number typography, soft shadows.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Dark Slate | #1A1A2E | Game background behind grid |
| Grid Border | Soft Indigo | #16213E | Hex cell borders, grid outline |
| Cell Empty | Charcoal | #2D2D44 | Empty hex cell fill |
| Number 1 | Coral | #FF6B6B | Cell fill for value 1 |
| Number 2 | Teal | #4ECDC4 | Cell fill for value 2 |
| Number 3 | Amber | #FFE66D | Cell fill for value 3 |
| Number 4 | Lavender | #A8A4FF | Cell fill for value 4 |
| Number 5 | Hot Pink | #FF6B9D | Cell fill for value 5 |
| Number 6 | Mint | #45B7AA | Cell fill for value 6 |
| High Sum (7+) | Gold | #FFD700 | Cell fill for merged sums >= 7 |
| Mega Sum (10+) | Bright White | #FFFFFF | Cell fill for merged sums >= 10 |
| Text Primary | White | #FFFFFF | Score, numbers on dark cells |
| Text Dark | Dark Navy | #0F0F23 | Numbers on light cells (3, high sums) |
| Selected | Cyan Glow | #00E5FF | Selection highlight ring |
| Danger | Red | #FF4444 | Invalid tap flash, bomb cells |
| Frozen | Ice Blue | #87CEEB | Frozen cell overlay |
| Wild | Rainbow | linear gradient | Wild cell border |
| UI Panel | Semi-Black | #000000CC | Overlay backgrounds |
| Button Primary | Bright Teal | #4ECDC4 | Play, retry buttons |
| Button Text | Dark Navy | #0F0F23 | Button label text |

### 4.3 SVG Specifications

All graphics are generated as base64-encoded SVGs in config.js, registered once in BootScene.

**Hex Cell (empty)**:
```svg
<svg viewBox="0 0 64 56" xmlns="http://www.w3.org/2000/svg">
  <polygon points="16,0 48,0 64,28 48,56 16,56 0,28"
           fill="#2D2D44" stroke="#16213E" stroke-width="2"/>
</svg>
```

**Hex Cell (numbered) -- template per number 1-6**: Same hex shape, fill color from palette, centered bold number text:
```svg
<svg viewBox="0 0 64 56" xmlns="http://www.w3.org/2000/svg">
  <polygon points="16,0 48,0 64,28 48,56 16,56 0,28"
           fill="{NUMBER_COLOR}" stroke="#16213E" stroke-width="2"/>
  <text x="32" y="34" text-anchor="middle" font-family="Arial Black"
        font-size="24" font-weight="bold" fill="#FFFFFF">{N}</text>
</svg>
```

**Frozen Overlay**:
```svg
<svg viewBox="0 0 64 56" xmlns="http://www.w3.org/2000/svg">
  <polygon points="16,0 48,0 64,28 48,56 16,56 0,28"
           fill="#87CEEB44" stroke="#87CEEB" stroke-width="2" stroke-dasharray="4,2"/>
  <line x1="20" y1="14" x2="44" y2="42" stroke="#FFFFFF66" stroke-width="1"/>
  <line x1="44" y1="14" x2="20" y2="42" stroke="#FFFFFF66" stroke-width="1"/>
</svg>
```

**Bomb Cell**:
```svg
<svg viewBox="0 0 64 56" xmlns="http://www.w3.org/2000/svg">
  <polygon points="16,0 48,0 64,28 48,56 16,56 0,28"
           fill="#FF4444" stroke="#CC0000" stroke-width="2"/>
  <circle cx="32" cy="28" r="14" fill="#222222"/>
  <circle cx="32" cy="28" r="10" fill="#FF4444"/>
  <line x1="32" y1="10" x2="36" y2="4" stroke="#FFD700" stroke-width="2"/>
  <circle cx="36" cy="3" r="3" fill="#FFD700"/>
</svg>
```

**Wild Cell**:
```svg
<svg viewBox="0 0 64 56" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wild" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B6B"/>
      <stop offset="25%" style="stop-color:#FFE66D"/>
      <stop offset="50%" style="stop-color:#4ECDC4"/>
      <stop offset="75%" style="stop-color:#A8A4FF"/>
      <stop offset="100%" style="stop-color:#FF6B9D"/>
    </linearGradient>
  </defs>
  <polygon points="16,0 48,0 64,28 48,56 16,56 0,28"
           fill="#2D2D44" stroke="url(#wild)" stroke-width="3"/>
  <text x="32" y="36" text-anchor="middle" font-family="Arial Black"
        font-size="28" font-weight="bold" fill="url(#wild)">?</text>
</svg>
```

**Design Constraints**:
- Max 8 path/shape elements per SVG
- All SVGs use basic shapes (polygon, circle, line, text)
- Cell SVGs are 64x56px viewBox
- Number text is dynamically rendered via Phaser text objects on top of hex sprite (not baked into SVG) for flexibility
- Animations via Phaser tweens, never SVG animate elements

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Selection glow | Cell tapped | Cyan (#00E5FF) stroke ring, 3px, pulsing alpha 0.6-1.0 over 400ms loop |
| Invalid flash | Bad tap | Red (#FF4444) fill flash, 120ms, then revert |
| Merge crunch | Successful merge | Target cell scales 1.0->1.4->1.0 over 200ms. Source cell scales 1.0->0 over 150ms. |
| Collapse slide | Gap fill | Cell image slides to new position over 150ms, ease-out |
| Chain flash | Auto-merge in chain | White flash overlay on merging pair, 80ms. Screen border pulse teal. |
| Spawn pop | New number spawns | Scale 0->1.1->1.0 over 200ms with 20ms bounce |
| Spawn warning | 1s before spawn | Empty cells briefly flash dim yellow (#FFE66D22), 200ms |
| Frozen shimmer | Frozen cell exists | Slow alpha oscillation 0.7-1.0 over 2000ms on frost overlay |
| Bomb pulse | Bomb countdown | Scale pulse 1.0-1.08-1.0, 500ms loop, red glow intensifies as timer drops |
| Board fill warning | >= 16/19 cells filled | Background shifts to #2A1A1A (subtle red tint), hex borders pulse red |

---

## 5. Audio Design

### 5.1 Sound Effects

All sounds generated via Web Audio API oscillators (no external audio files).

| Event | Sound Description | Duration | Implementation |
|-------|------------------|----------|----------------|
| Cell select | Short click, 800Hz square wave | 50ms | Square wave, 800Hz, gain 0.3, 50ms decay |
| Merge | Satisfying pop, ascending pitch based on sum | 150ms | Sine wave, freq = 400 + (sum * 40)Hz, gain 0.4, 150ms decay |
| Chain merge (auto) | Higher-pitched pop, +100Hz per chain step | 150ms | Sine wave, freq = 600 + (chain * 100)Hz, gain 0.5 |
| Chain x3+ | Musical chord (3 stacked tones) | 300ms | Three sine waves: base, base*1.25, base*1.5 simultaneously |
| Invalid tap | Low buzz | 100ms | Sawtooth wave, 200Hz, gain 0.2, 100ms |
| Spawn | Soft bubble pop | 80ms | Sine wave, 500Hz->300Hz sweep, gain 0.15, 80ms |
| Bomb warning | Bass pulse, 2Hz rhythm | 500ms loop | Sine wave, 80Hz, gain oscillates 0-0.3 at 2Hz |
| Bomb explode | Low crunch + scatter | 300ms | Noise burst + sine 100Hz, gain 0.5, 300ms decay |
| Board full warning | Tense high-pitched whine | 1000ms loop | Sine 1200Hz, gain 0.1, tremolo at 8Hz |
| Game over | Descending tone cascade | 600ms | Sine sweep 600Hz->100Hz, gain 0.4, 600ms |
| New high score | Ascending arpeggio (C-E-G-C) | 800ms | Four sine tones at 523, 659, 784, 1047Hz, 200ms each staggered |
| Button press | UI click | 60ms | Square wave, 600Hz, gain 0.2, 60ms |

### 5.2 Music Concept

**Background Music**: No persistent background music. The game's audio identity comes from the merge sounds creating an emergent musical texture. Successful chains produce ascending harmonic sequences that feel like music. This rewards skilled play with better-sounding audio.

**Ambient Drone**: A very low-volume (gain 0.05) ambient pad plays during gameplay -- a warm sine wave at 220Hz (A3) with slow LFO modulation. This provides subtle atmosphere without competing with merge sounds.

| Game State | Audio Behavior |
|-----------|---------------|
| Menu | Silent, button clicks only |
| Early Game (wave 1-2) | Ambient drone, normal merge sounds |
| Mid Game (wave 3-4) | Ambient drone pitch rises to 247Hz (B3), merge sounds normal |
| Late Game (wave 5+) | Ambient drone at 262Hz (C4), gain 0.08, adds urgency |
| Board Almost Full | Drone + high tension whine overlay |
| Game Over | All audio fades, death sound plays |
| Pause | All audio muted |

---

## 6. UI/UX

### 6.1 Screen Flow

```
+------------+     +------------+     +------------+
|   Boot     |---->|   Menu     |---->|   Game     |
|  (textures)|     |  Screen    |     |  Screen    |
+------------+     +-----+------+     +------+-----+
                     |    |                   |
                +----+    +----+         +----+----+
                |              |         |  Pause  |-->+----------+
           +----+----+   +----+----+    | Overlay |   |  Help    |
           |  Help   |   | Settings|    +----+----+   |How 2 Play|
           |How 2Play|   | Overlay |         |        +----------+
           +---------+   +---------+    +----+----+
                                        |  Game   |
                                        |  Over   |
                                        +----+----+
                                             |
                                        +----+----+
                                        | Ad/     |
                                        |Continue |
                                        +---------+
```

### 6.2 HUD Layout

```
+-------------------------------+  <- y=0
| Score: 4280      Best: 12400  |  <- Top bar: y=0, h=36px
| Chain: x3  Wave: 4    [?][||] |  <- Sub bar: y=36, h=28px
+-------------------------------+  <- y=64
|                               |
|                               |
|        HONEYCOMB GRID         |  <- Grid area: y=80 to y=440
|       19 hex cells            |     Grid centered horizontally
|       Radius-2 layout         |     ~360px tall including padding
|                               |
|                               |
|                               |
+-------------------------------+  <- y=440
|                               |
|  [====SPAWN TIMER BAR====]   |  <- Spawn bar: y=450, h=8px, full width
|                               |
|  [Next: 3]    Score: +120     |  <- Info bar: y=470, h=30px
+-------------------------------+  <- y=500 (safe within 640px height)
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left (x=10, y=10) | Current score, 20px bold white | Every merge |
| Best | Top-right (x=right-10, y=10) | High score, 16px gray | On load, on new best |
| Chain Counter | Left (x=10, y=40) | "Chain: xN", appears on chain>=2, gold text | During cascades |
| Wave | Center (x=center, y=40) | "Wave: N", 14px white | Every 30s |
| Help Button | Right (x=right-60, y=36) | "?" in circle, 28px tap target | Static |
| Pause Button | Right (x=right-20, y=36) | "||" icon, 28px tap target | Static |
| Spawn Timer | Bottom (y=450) | Horizontal bar, teal fill, drains left to right | Every frame |
| Next Number | Bottom-left (x=10, y=470) | "Next: {N}" with color preview circle | On spawn |

### 6.3 Menu Structure

**Main Menu** (MenuScene):
- Title "NUM COLLAPSE" -- large bold text, 36px, white, centered at y=120
- Subtitle "Merge. Collapse. Chain." -- 14px, #4ECDC4, centered at y=155
- **PLAY** button -- 180x56px, rounded rect, fill #4ECDC4, text "PLAY" 24px bold #0F0F23, centered at y=280
- **How to Play "?"** button -- 44x44px circle, top-right (x=right-30, y=20), stroke #4ECDC4, text "?" 20px
- **Settings gear** button -- 44x44px, top-left (x=30, y=20)
- **High Score display** -- "BEST: {score}" 16px, #FFD700, centered at y=340
- **Games Played** -- "Games: {count}" 12px, #888888, centered at y=370

**Pause Overlay** (semi-transparent #000000BB):
- "PAUSED" text, 28px, white, centered
- Resume button: 160x48px, #4ECDC4, "RESUME"
- How to Play: 160x48px, outline #4ECDC4, "HOW TO PLAY"
- Restart: 160x48px, outline #FF6B6B, "RESTART"
- Quit to Menu: 120x36px, text-only, #888888, "MENU"

**Game Over Screen** (overlay, fades in over 500ms):
- "GAME OVER" text, 32px, #FF6B6B, centered at y=100
- Final Score: large 48px, white, scale-punch entrance, centered at y=180
- "NEW BEST!" if applicable: 18px, #FFD700, bounce animation
- Wave Reached: "Wave {N}" 16px, #888888, y=230
- Best Chain: "Best Chain: x{N}" 14px, #4ECDC4, y=255
- **Continue (Ad)**: 180x48px, #FFD700, "CONTINUE (-3 cells)" -- only shown once per game
- **Play Again**: 180x48px, #4ECDC4, "PLAY AGAIN" -- y=350
- **Menu**: 120x36px, text-only, #888888, "MENU" -- y=410

**Help / How to Play Screen** (HelpScene, overlay):
- Title: "HOW TO PLAY" 24px bold white, y=40
- **Section 1 -- Controls** (y=80):
  - SVG illustration: two adjacent hex cells with same number, arrow showing tap-tap gesture
  - Text: "Tap two adjacent cells with the same number to merge them"
- **Section 2 -- Collapse** (y=180):
  - SVG illustration: hex grid before/after with arrow showing neighbor sliding into gap
  - Text: "Neighbors collapse inward. This can create chain reactions!"
- **Section 3 -- Scoring** (y=280):
  - "Merge score = 10 x sum value"
  - "Chains multiply score: x1.5, x2.0, x2.5..."
  - Chain counter icon with escalating colors
- **Section 4 -- Death** (y=360):
  - "Board full + no matches = Game Over"
  - "New numbers spawn every few seconds -- don't fall behind!"
  - Spawn timer bar illustration
- **Section 5 -- Tips** (y=440):
  - "1. Merge near the edges to create collapse chains toward center"
  - "2. Keep at least 3 empty cells as buffer"
  - "3. Higher-number merges score more -- let low numbers build up strategically"
- **"GOT IT!" button**: 160x48px, #4ECDC4, centered at y=520
- Scrollable if viewport height < 560px

### 6.4 Transitions

| Transition | Animation | Duration |
|-----------|-----------|----------|
| Menu -> Game | Grid cells pop in one by one (staggered 40ms each, 19 cells = 760ms total) | 800ms |
| Game -> Game Over | Grid cells gray out (200ms), overlay fades in (300ms) | 500ms total |
| Game Over -> Game | Overlay fades out (200ms), grid resets with pop-in (760ms) | ~1000ms |
| Game Over -> Menu | Overlay fades out (200ms), menu fades in (200ms) | 400ms |
| Any -> Help | Help overlay slides in from right, 250ms ease-out | 250ms |
| Help -> Previous | Help overlay slides out to right, 200ms | 200ms |
| Death -> Restart | **Under 2 seconds**: 500ms death effect + 500ms overlay + tap = instant grid reset (760ms pop-in) = ~1760ms worst case |

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after death (remove 3 cells) | Every game over (once per game) | Always optional |
| Rewarded | Double final score | After game over screen | Always optional |
| Banner | Menu screen only | Always visible on menu | N/A |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Continue | Watch ad after game over | Remove 3 random non-matching cells from full board | Once per game |
| Score Double | Watch ad on game over screen | Final score x2 | Once per session |

### 7.3 Session Economy

Average session: 60-180 seconds of gameplay + 15s between games (menus, ads). Expected 3-5 games per session (5-15 minutes total).

**Session Flow with Monetization**:
```
[Play Free] --> [Board Full = Death] --> [Rewarded Ad: Continue?]
                                              | Yes --> [3 Cells Removed, Resume Play]
                                              | No  --> [Game Over Screen]
                                                              |
                                                        [Interstitial (every 3rd death)]
                                                              |
                                                        [Rewarded Ad: Double Score?]
                                                              | Yes --> [Score Doubled]
                                                              | No  --> [Play Again / Menu]
```

Expected ads per session: 1-2 interstitials + 1-3 rewarded = 2-5 total ad views per 10-minute session.

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/num-collapse/
+-- index.html              # Entry point, loads CDN + local scripts
|   +-- CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
|   +-- Local CSS            # css/style.css
|   +-- Local JS (ordered)   # config -> stages -> ads -> effects -> ui -> game -> main (LAST)
+-- css/
|   +-- style.css            # Responsive layout, mobile-first
+-- js/
    +-- config.js            # Colors, grid math, difficulty tables, SVG strings
    +-- game.js              # GameScene: hex grid, merge logic, collapse, chain detection
    +-- stages.js            # Wave progression, spawn system, special cell logic
    +-- ui.js                # MenuScene, GameOverScene, HUD overlay, pause, settings
    +-- help.js              # HelpScene: illustrated how-to-play with SVG diagrams
    +-- ads.js               # Ad integration hooks, reward callbacks
    +-- main.js              # BootScene (texture registration), Phaser config, scene array [Boot, Menu, Game, UI, Help, GameOver] -- LOADS LAST
```

### 8.2 Module Responsibilities

**config.js** (~120 lines):
- `COLORS` object: all hex color values from palette
- `HEX` object: `{ radius: 32, width: 64, height: 55.4, hSpacing: 48, vSpacing: 55.4 }`
- `GRID` object: `{ rings: 2, totalCells: 19, centerX: 'viewport/2', centerY: 'viewport*0.45' }`
- `GRID_CELLS` array: all 19 axial coordinates `[{q, r}, ...]`
- `ADJACENCY_OFFSETS`: `[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]]`
- `WAVES` array: difficulty parameters per wave (spawn interval, number pool, special chances)
- `SCORING` object: `{ baseMultiplier: 10, chainBonus: 50, highSumThreshold: 8, highSumMultiplier: 1.5, boardClearBonus: 500 }`
- `TIMING` object: `{ mergeAnim: 200, collapseSlide: 150, chainDelay: 100, spawnPop: 200, deathToRestart: 1760 }`
- `SVG_STRINGS` object: all SVG template strings for hex cells, frozen overlay, bomb, wild
- `JUICE` object: all juice values (shake, punch, particles -- see Section 9)

**game.js** (~280 lines):
- `GameScene extends Phaser.Scene`
- `create()`: Build hex grid from GRID_CELLS, place initial numbers, start spawn timer, register input handlers
- `update()`: Check board-full condition, update spawn timer bar, update bomb countdowns, update frozen cell timers
- `selectCell(q, r)`: Handle first tap (highlight) or second tap (validate + merge)
- `executeMerge(cellA, cellB)`: Merge animation, score award, trigger collapse
- `collapseGap(emptyPos, mergeDirection)`: Slide neighbors toward gap, max depth 3
- `detectChains()`: Scan all cells for adjacent matches, auto-merge if found
- `spawnNumber()`: Called by timer, picks cell + number + special type
- `checkGameOver()`: Board full + no matches = death
- `triggerDeath()`: Death effects, transition to game over
- Helper: `axialToPixel(q, r)`, `getNeighbors(q, r)`, `isAdjacent(a, b)`, `findMatchingPairs()`

**stages.js** (~100 lines):
- `getWaveParams(waveNumber)`: Returns `{ spawnInterval, numberPool, frozenChance, wildChance, bombChance }` from WAVES table with interpolation for waves > 7
- `pickSpawnNumber(pool, weights)`: Weighted random selection from number pool
- `pickSpecialType(params)`: Roll for frozen/wild/bomb based on wave chances
- `generateInitialBoard(cells)`: Place 4 starting numbers with guaranteed match
- `updateWave(elapsedTime)`: Check if wave should advance (every 30s)
- `getBombCountdown(wave)`: Returns bomb timer (10s base, -0.5s per wave after 7, floor 6s)

**ui.js** (~280 lines):
- `MenuScene extends Phaser.Scene`: Title, play button, best score, help button, settings
- `GameOverScene extends Phaser.Scene`: Score display, high score check, continue/retry/menu buttons
- `UIScene extends Phaser.Scene` (parallel overlay): HUD rendering -- score, chain, wave, spawn bar, pause button, help button
- `PauseOverlay`: Resume, help, restart, quit buttons
- `SettingsOverlay`: Sound/vibration toggles
- Score floating text helper, chain counter display helper
- All buttons minimum 44x44px touch targets

**help.js** (~120 lines):
- `HelpScene extends Phaser.Scene`
- Renders illustrated how-to-play with SVG diagrams of hex merging
- Control illustrations: tap-tap on matching cells, swipe shortcut
- Rules: scoring formula, chain multipliers, death condition
- Tips: 3 beginner strategies
- "GOT IT!" button returns to previous scene (tracks `returnScene` in scene data)
- Scrollable container if content exceeds viewport

**ads.js** (~60 lines):
- `AdManager` singleton
- `showInterstitial(callback)`: Placeholder hook, calls callback after mock delay
- `showRewarded(rewardType, callback)`: Placeholder, calls callback with reward
- `showBanner()` / `hideBanner()`: Menu-only banner control
- `shouldShowInterstitial()`: Returns true every 3rd game over
- `trackGameOver()`: Increments game over counter

**main.js** (~80 lines):
- `BootScene extends Phaser.Scene`: Reads all SVG_STRINGS from config, encodes to base64, calls `this.textures.addBase64()` for each. Listens for all texture load events, then starts MenuScene.
- Phaser.Game config: `{ type: Phaser.AUTO, width: 390, height: 640, backgroundColor: '#1A1A2E', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: [BootScene, MenuScene, GameScene, UIScene, HelpScene, GameOverScene] }`
- Global state: `window.GameState = { score: 0, highScore: localStorage..., gamesPlayed: 0, wave: 1, settings: { sound: true, vibration: true } }`
- Orientation / resize handler
- **LOADS LAST in index.html** (after all other js files)

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No Howler.js needed -- all audio via Web Audio API oscillators (lighter, no extra dependency).

### 8.4 Script Load Order in index.html

```html
<script src="js/config.js"></script>
<script src="js/stages.js"></script>
<script src="js/ads.js"></script>
<script src="js/help.js"></script>
<script src="js/ui.js"></script>
<script src="js/game.js"></script>
<script src="js/main.js"></script>  <!-- ALWAYS LAST -->
```

---

## 9. Juice Specification

### 9.1 Player Input Feedback (every tap on a cell)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Tapped cell | Count: 6, Direction: radial outward, Color: cell's number color, Lifespan: 300ms, Size: 3px circles, Speed: 60px/s |
| Scale punch | Tapped cell | Scale: 1.15x, Recovery: 100ms ease-out |
| Sound | -- | Square wave click, 800Hz, 50ms, gain 0.3 |
| Haptic | Device | navigator.vibrate(10) if enabled |

### 9.2 Core Action Feedback (merge -- most frequent meaningful input)

| Effect | Values |
|--------|--------|
| Particles (merge target) | Count: 15, Direction: radial burst, Color: merged sum's color, Lifespan: 400ms, Size: 4px, Speed: 120px/s |
| Particles (merge source disappearing) | Count: 8, Direction: toward target cell, Color: source number color, Lifespan: 200ms |
| Scale punch (merge target) | Scale: 1.0 -> 1.4 -> 1.0, Duration: 200ms, Ease: back.out |
| Scale shrink (merge source) | Scale: 1.0 -> 0, Duration: 150ms, Ease: cubic.in |
| Screen shake | Intensity: 3px, Duration: 100ms |
| Sound | Sine wave pop, freq = 400 + (sum * 40)Hz, 150ms, gain 0.4, +5% pitch per chain step |
| Haptic | navigator.vibrate(20) |
| Floating score text | "+{points}", Color: #FFD700, Size: 18px, Move: up 50px over 500ms, Fade: alpha 1->0 over 500ms |

### 9.3 Chain Cascade Feedback (auto-merges from collapse)

| Effect | Values |
|--------|--------|
| Particles | Count: 20 + (chain_step * 5), Color shifts: white->yellow->orange->red per chain depth |
| Screen shake | Intensity: 2 + (chain_step * 2)px, Duration: 80ms per step |
| Camera zoom | Scale: 1.0 + (chain_step * 0.01), Recovery: 300ms after chain ends |
| Chain counter text | Appears center-screen, "x{N}", Size: 24 + (chain_step * 4)px, Color: white->yellow->orange->red |
| Sound | Ascending pitch: base 600Hz + (chain_step * 100Hz), gain 0.5. At chain >= 3: chord (3 stacked tones) |
| Screen border pulse | Teal (#4ECDC4) border glow, width 4px, alpha pulse 0->0.8->0, 200ms per chain step |
| Combo escalation rule | Every chain step: particle count +5, shake +2px, pitch +100Hz, text size +4px |

### 9.4 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 12px, Duration: 400ms, decreasing amplitude |
| Screen desaturation | All game objects tween to grayscale over 300ms (Phaser postFX or tint #888888) |
| Red vignette flash | Border overlay red (#FF444488), 200ms, fades to transparent |
| Sound | Descending sine sweep 600Hz->100Hz, 600ms, gain 0.4 |
| Cell scatter | All cells do micro-random-offset (2-4px) then settle, 200ms |
| Effect -> UI delay | 500ms (death effects play, then game over overlay fades in) |
| Death -> restart | **1760ms max**: 500ms death FX + tap "Play Again" + 760ms grid pop-in + 500ms buffer = well under 2000ms |
| Haptic | navigator.vibrate([50, 30, 50]) -- double pulse |

### 9.5 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{points}", Color: #FFD700, Size: 18px bold, Movement: up 50px, Fade: 500ms |
| Score HUD punch | Scale: 1.3x, Recovery: 150ms, Ease: back.out |
| High-sum bonus text | "+{points} x1.5!" if sum >= 8, Color: #FFFFFF, Size: 22px |
| Chain bonus text | "CHAIN x{N}!", Color escalates white->gold->orange->red, Size: 24 + N*4 px |
| New high score | "NEW BEST!" text, 28px, #FFD700, bounces 3 times (y -20px each), gold particle burst (30 particles, radial, 600ms) |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Frame Rate | 60fps stable | Phaser FPS counter |
| Load Time | <2 seconds on 4G | Performance.timing |
| Memory | <80MB | Chrome DevTools |
| JS Total | <1800 lines across 7 files | Line count |
| Per-File Max | 300 lines | Strict limit |
| First Interaction | <1s after load | No loading screen needed (SVG only) |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch**: Phaser pointer events. All interactive cells use `setInteractive()` with hex-shaped hit area (polygon hit area matching hex shape)
- **Hit area**: Each hex cell registers a polygon hit area using the 6 vertex points for precise tap detection on hex shapes
- **Prevent default**: CSS `touch-action: none` on canvas, prevent pull-to-refresh
- **Orientation**: Portrait lock via CSS. On landscape detection, show "Please rotate" overlay
- **Safe areas**: Grid centered with 20px minimum padding from edges
- **Background/focus**: Pause game on visibility change (`document.addEventListener('visibilitychange')`)
- **Responsive scaling**: Phaser Scale.FIT + CENTER_BOTH. Base resolution 390x640. Scales to fit 360-428px viewports.

### 10.3 Hex Grid Performance

- **Object pooling**: Pre-create all 19 hex cell sprites + 19 text objects in BootScene. Reuse on reset -- never destroy/recreate.
- **Batch rendering**: All hex cells in a single Phaser Container for efficient draw calls
- **Collapse animation**: Use Phaser tweens (not manual position updates in update loop)
- **Chain detection**: Simple O(19 * 6) = O(114) neighbor check per scan -- negligible cost
- **Particle system**: Use Phaser particle emitter with pool of 50 particles, reused across all effects

### 10.4 Critical Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Tap during collapse animation | Input locked during collapse/chain cascade. `inputEnabled` flag set false during animations, re-enabled after cascade settles. |
| Tap during chain cascade | Same as above -- all input blocked until cascade complete |
| Rapid double-tap same cell | Second tap deselects (toggle behavior). No merge with self. |
| Swipe that exits grid | Swipe must start AND end on valid hex cells. If end point is off-grid, treat as cancel. |
| Merge creates value > 12 | Cap display at 12. Values 7-9 use gold color, 10-12 use white. No cells above 12 exist (6+6=12 is max single merge). |
| Frozen cell in collapse path | Frozen cells are immovable. Collapse skips frozen cells -- gap remains or collapse redirects around. |
| Wild cell merge | Wild takes the value of its merge partner. Wild(?) + 4 = 4+4 = 8. Wild counts as matching anything. |
| Bomb explodes during chain | Bomb explosion happens after chain settles. Queue bomb detonations, process after cascade. |
| All cells same number | Extremely unlikely but valid. Player can merge any adjacent pair. No special handling needed. |
| Browser tab hidden mid-game | Pause game, stop spawn timer. Resume on visibility. No "catch-up" spawns. |
| Resize / orientation change | Recalculate grid center position, reposition all cells via `axialToPixel()` with new center. 100ms debounce on resize. |
| Game over during chain | Chain always completes before game-over check. Even if board fills during chain, chain may clear cells and prevent death. |
| localStorage unavailable | Catch error, use in-memory fallback. High score lost on refresh but game still playable. |

### 10.5 Testing Checkpoints

1. **Grid renders correctly**: 19 hex cells visible, properly spaced, centered on 390px viewport
2. **Tap selection works**: Tap highlights cell, second tap on adjacent match triggers merge
3. **Invalid tap feedback**: Non-adjacent or non-matching tap flashes red, deselects
4. **Merge animation plays**: Source shrinks, target scale-punches, particles burst
5. **Collapse works**: After merge, neighbor slides into gap over 150ms
6. **Chain detection fires**: Collapse that creates new match triggers auto-merge
7. **Scoring accurate**: Points = 10 * sum * chain_multiplier, floating text appears
8. **Spawn timer works**: New number appears every N seconds per wave
9. **Wave progression**: Wave advances every 30s, spawn rate increases, new numbers appear
10. **Game over triggers**: Board full + no matches = death sequence
11. **Death -> restart < 2s**: Time from death trigger to playable new game under 2000ms
12. **Special cells (wave 5+)**: Frozen cells block merges, thaw after 15s. Wild matches anything. Bombs count down and explode.
13. **Help screen complete**: All illustrations render, scrollable, "Got it!" returns to previous screen
14. **Pause works**: Spawn timer stops, input blocked, resume restores state
15. **High score persists**: localStorage save/load verified across page refreshes
16. **No console errors**: Zero errors on fresh load, during gameplay, on death, on restart

### 10.6 Local Storage Schema

```json
{
  "num_collapse_high_score": 0,
  "num_collapse_games_played": 0,
  "num_collapse_best_wave": 0,
  "num_collapse_best_chain": 0,
  "num_collapse_settings": {
    "sound": true,
    "vibration": true
  },
  "num_collapse_total_merges": 0
}
```
