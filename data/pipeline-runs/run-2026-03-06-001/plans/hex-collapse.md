# Game Design Document: Hex Collapse

**Slug**: `hex-collapse`
**One-Liner**: Place numbered hexagons to trigger cascading collapses — but only if the math adds up.
**Core Mechanic**: Place numbered hex tiles (1-6) onto a hexagonal grid. Adjacent groups summing to exactly 10 collapse, score, and trigger gravity shifts that cascade into more collapses. Board fills up = game over.
**Target Session Length**: 3-6 minutes
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Hex Collapse is a number-puzzle game played on a hexagonal grid. The player receives numbered hex tiles (1-6) one at a time and must place them onto empty cells. Whenever a connected group of adjacent hexagons sums to exactly 10, that group collapses — the hexes shatter into triangular fragments, score points, and disappear. Remaining hexes then slide inward toward the board center due to hex-gravity, potentially forming new sum-10 groups that cascade into additional collapses.

The tension comes from the shrinking board space: every placement that does NOT trigger a collapse fills the board further. Random play fills the board by roughly stage 5, forcing the player to think fast about number placement. Higher stages introduce larger boards, higher numbers appearing more frequently, and special hex types (bomb, mirror, void) that add strategic depth.

The satisfaction loop is the cascade — a single clever placement can trigger a chain of 3-4 collapses as gravity reshuffles the board, accompanied by escalating pitch sounds and screen-shaking visual effects. This "one move clears the board" fantasy is the core emotional hook.

### 1.2 Target Audience

Casual puzzle gamers aged 16-45 who enjoy number games (2048, Threes, Tetris). Play context: commute, waiting room, short breaks. Low skill floor (just tap to place) but high skill ceiling (planning cascades). Appeals to players who enjoy "aha moment" chain reactions.

### 1.3 Core Fantasy

You are a hex-grid engineer orchestrating controlled demolitions. Every tile placement is a calculated bet — will this trigger a beautiful cascade, or push you one step closer to a full board? The fantasy is the perfectly planned chain reaction: place one tile, watch the whole board reorganize.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 3-6 minutes |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 22%+ |
| Average Stages per Session | 3-8 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Receive Tile] → [Place on Grid] → [Check Sum-10 Groups] → [Collapse + Score] → [Gravity Shift]
      ↑                                                                                │
      │                                                          [Check Cascades] ←────┘
      │                                                                │
      │                                                     (No more collapses)
      │                                                                │
      └────────────── [Next Tile] ←────────────────────────────────────┘
                           │
                   (Board Full?) → [Game Over] → [Retry]
```

**Moment-to-moment**: Player sees the current tile (number 1-6) and a preview of the next tile. They tap an empty hex cell to place the current tile. The game instantly checks all connected groups for sum-10 matches. Matching groups collapse with particle effects, gravity pulls remaining tiles inward, and cascade checks repeat until no more matches exist. Then the next tile appears.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Place Tile | Tap empty hex cell | Places the current numbered tile onto the tapped cell |
| Preview Hover | Drag over grid | Shows ghost of current tile on hovered cell (opacity 0.4) |
| Pause | Tap pause icon (top-right) | Opens pause overlay |

**Control Philosophy**: Single-tap placement for speed. No drag-and-drop (too slow for the pace required). Ghost preview on drag gives feedback without committing. The entire screen is the game area — no separate control zone needed.

**Touch Area Map**:
```
┌─────────────────────────────┐
│ Score    Stage    [?] [||]  │  ← Top HUD bar (48px height)
├─────────────────────────────┤
│                             │
│     ┌─────────────────┐    │
│     │                 │    │
│     │   Hex Grid      │    │  ← Main game area (centered)
│     │   (tap cells)   │    │
│     │                 │    │
│     └─────────────────┘    │
│                             │
├─────────────────────────────┤
│  [Current Tile]  [Next →]   │  ← Preview bar (80px height)
└─────────────────────────────┘
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Single collapse (sum-10 group) | 10 * tiles_in_group | Base score |
| Cascade chain (2nd collapse) | 10 * tiles * 2 | 2x multiplier |
| Cascade chain (3rd collapse) | 10 * tiles * 3 | 3x multiplier |
| Cascade chain (Nth collapse) | 10 * tiles * N | Nx multiplier (uncapped) |
| Perfect clear (board empty) | 500 bonus | Flat bonus |
| Bomb hex collapse | 50 flat | No multiplier |

**Combo System**: Each consecutive collapse in a single cascade chain increments the chain multiplier. Chain 1 = 1x, Chain 2 = 2x, Chain 3 = 3x, etc. The multiplier resets when the cascade ends and the next tile is drawn.

**High Score**: Stored in localStorage as `hex_collapse_high_score`. Displayed on menu screen and game-over screen. New high score triggers golden floating text "NEW BEST!" with 1.5x scale punch.

### 2.4 Progression System

The game uses a **stage system** where each stage expands the board and introduces new elements. Advancing to the next stage requires clearing a target number of collapses.

**Progression Milestones**:

| Stage Range | Board Size (hex radius) | Hex Cells | Collapses to Advance | New Element | Numbers Available |
|------------|------------------------|-----------|---------------------|-------------|-------------------|
| 1-3 | Radius 2 (19 cells) | 19 | 5, 7, 10 | Base mechanics | 1-4 |
| 4-6 | Radius 2 (19 cells) | 19 | 12, 15, 18 | Numbers 5-6 introduced | 1-6 |
| 7-10 | Radius 3 (37 cells) | 37 | 20, 22, 25, 28 | Bomb hex (clears ring) | 1-6 |
| 11-15 | Radius 3 (37 cells) | 37 | 30+ | Mirror hex (copies adjacent) | 1-6 + specials |
| 16-20 | Radius 3 (37 cells) | 37 | 35+ | Void hex (wildcard number) | 1-6 + specials |
| 21+ | Radius 3 (37 cells) | 37 | 40+ | All specials, speed increase | 1-6 + specials |

### 2.5 Lives and Failure

The game has **no lives system** — it is a single-life puzzle game. Board filling up is game over.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| All hex cells occupied (no empty cell for placement) | Game Over | Watch ad to remove 3 random tiles, or Play Again |
| Inactivity for 30 seconds | Board auto-fills one random tile per 2s until death | Resume playing to stop auto-fill |

**Inactivity Death**: If the player does not place a tile within 30 seconds, the game begins auto-placing random tiles every 2 seconds. A visible countdown timer ("IDLE: 30s") appears at 30s, turns red at 10s. This ensures death within ~30s of inactivity on a 19-cell board.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Stages are milestone-based, not level-based. The player plays on a continuous board, and advancing a stage means hitting the collapse target. The board does NOT reset between stages — it carries over, but may expand (radius 2 → radius 3 at stage 7).

**Generation Algorithm**:
```
Stage Generation Parameters:
- Board radius: stage < 7 ? 2 : 3
- Total cells: radius=2 → 19, radius=3 → 37
- Collapse target: 5 + (stage * 3), capped at 50
- Number pool: stage < 4 ? [1,2,3,4] : [1,2,3,4,5,6]
- Number weights: lower numbers weighted heavier early (1-3: 60%, 4-6: 40% at stage 1; equalizes by stage 10)
- Special hex chance: stage < 7 ? 0% : min(15%, (stage - 6) * 3)%
- Idle timeout: 30 seconds (constant)
- Auto-fill interval on idle: max(1000, 3000 - stage * 100)ms
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
    0    5    10    15    20    25    30    35+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-3 | Stage 4-6 | Stage 7-10 | Stage 11-20 | Stage 21+ |
|-----------|-----------|-----------|------------|-------------|-----------|
| Board Radius | 2 | 2 | 3 | 3 | 3 |
| Number Range | 1-4 | 1-6 | 1-6 | 1-6 | 1-6 |
| Special Hex % | 0% | 0% | 3-9% | 12-15% | 15% |
| Collapse Target | 5-10 | 12-18 | 20-28 | 30-40 | 40-50 |
| Auto-fill Interval (idle) | 3000ms | 2700ms | 2400ms | 2000ms | 1500ms |
| Number Weight Bias (low #s) | 60% | 50% | 45% | 40% | 33% (even) |

### 3.3 Stage Generation Rules

1. **Solvability**: Not applicable per-stage (continuous board). However, the number distribution ensures at least 2 valid sum-10 combinations exist in any pool of 5 consecutive tiles.
2. **Variety**: Number weights shift each stage to vary gameplay feel. Special hexes rotate introduction order.
3. **Difficulty Monotonicity**: Collapse targets only increase. Number pools only expand. Board only grows.
4. **Rest Moments**: After every cascade chain of 3+, a 1-second "cascade pause" lets the player breathe and appreciate the chain.
5. **Board Expansion Event**: At stage 7, the board visually grows from radius 2 to radius 3 with an expanding animation (500ms). New cells appear empty with a subtle glow.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Clean geometric minimalism. White hexagons on a dark charcoal background. Bold colored numbers centered in each hex. No textures, no gradients — flat color with crisp edges. Collapse effects use triangular fragment particles (each hex shatters into 6 triangles).

**Aesthetic Keywords**: Geometric, Clean, Mathematical, Satisfying, Precise

**Reference Palette**: Think Monument Valley meets 2048 — serene but with punchy color accents.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Dark Charcoal | #1A1A2E | Game background |
| Hex Fill | White | #FFFFFF | Empty/base hex fill |
| Hex Stroke | Light Gray | #3A3A5C | Hex border outlines |
| Number 1 | Soft Blue | #4A9EFF | Number "1" text |
| Number 2 | Teal | #2EC4B6 | Number "2" text |
| Number 3 | Lime Green | #7BC950 | Number "3" text |
| Number 4 | Warm Yellow | #FFD166 | Number "4" text |
| Number 5 | Orange | #FF8C42 | Number "5" text |
| Number 6 | Hot Pink | #FF4081 | Number "6" text |
| Bomb Hex | Red | #E63946 | Bomb special hex fill |
| Mirror Hex | Silver | #C0C0C0 | Mirror special hex fill |
| Void Hex | Purple | #7B2FBE | Void special hex fill |
| Collapse Flash | Gold | #FFD700 | Flash on sum-10 match |
| UI Text | White | #FFFFFF | Score, labels |
| UI Accent | Cyan | #00E5FF | Buttons, highlights |
| Danger/Idle | Red | #FF1744 | Idle timer warning |

### 4.3 SVG Specifications

All graphics are SVG strings defined in `config.js`, registered as base64 textures in BootScene.

**Hex Tile (pointy-top orientation)**:

Hex geometry: **Pointy-top** hexagons. For a hex with circumradius `R`:
- Width = `R * sqrt(3)` = `R * 1.732`
- Height = `R * 2`
- Horizontal spacing = `R * sqrt(3)`
- Vertical spacing = `R * 1.5`
- Offset: odd rows shift right by `R * sqrt(3) / 2`

Cell size: `R = 28px` for radius-2 board (19 cells), `R = 22px` for radius-3 board (37 cells). This fits a 360px-wide viewport with margins.

```svg
<!-- Hex tile: pointy-top, R=28 -->
<svg width="50" height="56" viewBox="0 0 50 56" xmlns="http://www.w3.org/2000/svg">
  <!-- Hex shape: 6 vertices for pointy-top -->
  <polygon points="25,0 48.3,14 48.3,42 25,56 1.7,42 1.7,14"
    fill="#FFFFFF" stroke="#3A3A5C" stroke-width="2"/>
  <!-- Number rendered as Phaser text overlay, not in SVG -->
</svg>
```

Pointy-top vertex formula (center cx, cy, radius R):
```
vertex[i] = (cx + R * cos(60*i - 30), cy + R * sin(60*i - 30))  for i = 0..5
```

**Hex Ghost (preview)**:
Same as hex tile but fill opacity 0.3, stroke dashed.

**Bomb Hex**:
```svg
<svg width="50" height="56" viewBox="0 0 50 56" xmlns="http://www.w3.org/2000/svg">
  <polygon points="25,0 48.3,14 48.3,42 25,56 1.7,42 1.7,14"
    fill="#E63946" stroke="#3A3A5C" stroke-width="2"/>
  <circle cx="25" cy="28" r="10" fill="#1A1A2E"/>
  <line x1="25" y1="10" x2="25" y2="18" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/>
</svg>
```

**Triangle Fragment (collapse particle)**:
```svg
<svg width="16" height="14" viewBox="0 0 16 14" xmlns="http://www.w3.org/2000/svg">
  <polygon points="8,0 16,14 0,14" fill="#FFFFFF" opacity="0.9"/>
</svg>
```

**Design Constraints**:
- Max 6 path/shape elements per SVG
- Use polygon and circle only (no complex paths)
- All hex tiles are the same SVG; numbers are Phaser text objects overlaid at hex center
- Animations via Phaser tweens, not SVG animate

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Hex placement pop | Tile placed | Hex scales from 0 → 1.2 → 1.0 over 150ms (ease: Back.easeOut) |
| Sum-10 flash | Group detected | All matching hexes flash gold (#FFD700) for 200ms |
| Hex shatter | Collapse | Each hex splits into 6 triangle particles flying outward with random velocity (100-300px/s), rotate 0-360deg, fade alpha 1→0 over 400ms |
| Gravity slide | After collapse | Remaining hexes tween toward center over 250ms (ease: Cubic.easeInOut) |
| Cascade ripple | Chain 2+ | Background pulses with a subtle radial glow from collapse center, 300ms |
| Board expansion | Stage 7 transition | New cells grow from scale 0→1 over 500ms with staggered 50ms delay per cell |
| Idle warning | 30s no input | Screen edges pulse red, intensity increases as timer approaches 0 |

---

## 5. Audio Design

### 5.1 Sound Effects

All sounds generated via Web Audio API (no external audio files). Phaser's `this.sound` with generated audio buffers.

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Tile placement | Soft wooden tap (200Hz sine, 50ms decay) | 80ms | High |
| Sum-10 detected | Bright chime (880Hz + 1100Hz sine, 100ms) | 150ms | High |
| Hex collapse | Glass shatter (white noise burst, 80ms, band-pass 2000-6000Hz) | 120ms | High |
| Cascade chain (each step) | Same shatter but pitched up +100Hz per chain step | 120ms | High |
| Chain 4+ | Deep bass boom (60Hz sine, 200ms decay) layered with shatter | 250ms | High |
| Board full / Game Over | Descending tone (440→110Hz over 500ms) | 600ms | High |
| Perfect clear | Ascending arpeggio (C5-E5-G5-C6, 80ms each) | 350ms | High |
| UI button press | Subtle click (1000Hz square wave, 20ms) | 30ms | Low |
| Idle warning tick | Metronome tick (800Hz, 10ms) every second | 15ms | Medium |
| Stage advance | Bright ascending sweep (200→800Hz, 300ms) | 350ms | Medium |

### 5.2 Music Concept

**Background Music**: No music. The game relies on satisfying SFX cascades as its audio identity. The rising-pitch chain sounds effectively CREATE dynamic music during gameplay. Silence between placements builds tension.

**Audio Implementation**: Web Audio API via Phaser's built-in sound manager. No Howler.js dependency needed — keeps bundle smaller.

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
                        │           │  Game   │
                        │           │  Over   │
                        │           │ Screen  │
                        │           └────┬────┘
                        │                │
                        │           ┌────┴────┐
                        │           │Continue │
                        │           │(Ad Opt) │
                        │           └─────────┘
```

### 6.2 HUD Layout

```
┌─────────────────────────────────┐
│ Score: 1250   Stage 4   [?] [||]│  ← Top bar (48px, semi-transparent #1A1A2E at 80%)
├─────────────────────────────────┤
│                                 │
│         ⬡ ⬡ ⬡                  │
│        ⬡ ⬡ ⬡ ⬡                │
│       ⬡ ⬡ ⬡ ⬡ ⬡              │  ← Hex grid (centered, radius-2 shown)
│        ⬡ ⬡ ⬡ ⬡                │
│         ⬡ ⬡ ⬡                  │
│                                 │
│    Chain: x3 !!!               │  ← Chain counter (appears during cascades)
│                                 │
├─────────────────────────────────┤
│  ┌──────┐        ┌──────┐      │
│  │  4   │  Next: │  2   │      │  ← Preview bar (80px)
│  │(curr)│        │(next)│      │
│  └──────┘        └──────┘      │
├─────────────────────────────────┤
│ Collapses: 7/12  ████████░░░░  │  ← Progress bar to next stage (32px)
└─────────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left (16px, 12px) | Current score, 24px bold white | Every score event |
| Stage | Top-center | "Stage N", 20px white | On stage advance |
| Help Button | Top-right - 56px | "?" circle icon, 36px tap target | Static |
| Pause Button | Top-right - 8px | "||" icon, 36px tap target | Static |
| Current Tile | Bottom-left (80px from left, centered in bar) | Hex with number, 56px tall | After each placement |
| Next Tile | Bottom-right (160px from left) | Smaller hex with number, 40px tall | After each placement |
| Chain Counter | Center (below grid) | "x3" with escalating size, gold text | During cascades |
| Progress Bar | Bottom strip | Filled bar showing collapses/target | Every collapse |
| Idle Timer | Center (above grid) | "IDLE: 25s" countdown, red when <10s | When idle >0s |

### 6.3 Menu Structure

**Main Menu (MenuScene)**:
- Game title "HEX COLLAPSE" (48px, white, centered, y=25%)
- Subtitle one-liner (16px, #3A3A5C, y=33%)
- "PLAY" button (200x60px, #00E5FF fill, centered, y=55%)
- "?" Help button (44x44px circle, top-right corner)
- High Score display (24px, gold, y=70%): "Best: 12450"
- Sound toggle (speaker icon, 44x44px, bottom-right)

**Pause Overlay** (semi-transparent #1A1A2E at 85%):
- "PAUSED" title (36px white)
- "Resume" button (180x50px, #00E5FF)
- "How to Play" button (180x50px, #3A3A5C)
- "Restart" button (180x50px, #3A3A5C)
- "Quit to Menu" button (180x50px, #3A3A5C)

**Game Over Screen (overlay on game scene)**:
- "GAME OVER" (40px, #FF1744)
- Final Score (56px, white, scale-punch animation)
- "NEW BEST!" (if high score, 24px gold, bouncing)
- Stage Reached (20px, #3A3A5C)
- Best Chain (20px, #3A3A5C)
- "Continue (remove 3 tiles)" button (rewarded ad, 200x50px, #FFD700)
- "Play Again" button (200x50px, #00E5FF)
- "Menu" button (140x40px, #3A3A5C)

**Help / How to Play Screen (HelpScene)**:
- Title: "HOW TO PLAY" (32px, white)
- **Visual diagram 1**: SVG illustration showing a finger tapping an empty hex cell, with arrow pointing to placed tile. Caption: "Tap an empty hex to place your tile"
- **Visual diagram 2**: SVG illustration showing 3 adjacent hexes with numbers 4+3+3=10, with golden glow. Caption: "Adjacent hexes summing to 10 collapse!"
- **Visual diagram 3**: SVG showing gravity arrows pointing inward after collapse. Caption: "Tiles slide inward — cascading new matches"
- **Rules**:
  - "Fill the board = Game Over"
  - "Chain collapses for score multipliers (x2, x3...)"
  - "30s idle = auto-fill starts"
- **Tips**:
  - "Place low numbers (1-2) next to high numbers (5-6) for easy 10s"
  - "Plan for cascades — leave gaps near the center"
  - "Bomb hexes clear an entire ring — save them for emergencies"
- "GOT IT!" button (180x50px, #00E5FF) → returns to previous scene
- Scrollable container if content exceeds viewport

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after board-full (remove 3 tiles) | Every game over (optional) | Always optional |
| Rewarded | Double final score | End of session (optional) | Always optional |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Continue (remove 3 tiles) | Watch rewarded ad after board-full | Removes 3 random tiles, resume play | Once per game |
| Score Doubler | Watch rewarded ad at game over | 2x final score for high-score purposes | Once per session |

### 7.3 Session Economy

Players average 2-4 games per session (3-6 min each = 6-24 min total session). Expected ad views: 1 interstitial per session (every 3rd game over), 0.5 rewarded ads per session (50% opt-in rate). Monetization is light — the game hooks through replayability, not ad pressure.

**Session Flow with Monetization**:
```
[Play] → [Board Full] → [Rewarded Ad: Remove 3 tiles?]
                              │ Yes → [Resume play → eventual 2nd death]
                              │ No  → [Game Over Screen]
                                          │
                                    [Interstitial (every 3rd game over)]
                                          │
                                    [Rewarded Ad: Double Score?]
                                          │ Yes → [Score doubled, saved]
                                          │ No  → [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/hex-collapse/
├── index.html              # Entry point, viewport meta, CDN Phaser, script load order
│   ├── CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
│   ├── Local CSS           # css/style.css
│   └── Local JS (ordered)  # config → stages → ads → effects → ui → game → main (LAST)
├── css/
│   └── style.css           # Responsive styles, mobile-first, portrait lock
└── js/
    ├── config.js           # Constants, colors, hex math, SVG strings, difficulty tables
    ├── main.js             # BootScene (texture registration), Phaser config, scene list (LOADS LAST)
    ├── game.js             # GameScene: hex grid, placement, sum-10 detection, gravity, cascades
    ├── stages.js           # Stage progression, difficulty scaling, number pool generation
    ├── ui.js               # MenuScene, GameOverScene, HUD overlay, pause overlay, HelpScene
    └── ads.js              # Ad integration hooks, reward callbacks
```

### 8.2 Module Responsibilities

**config.js** (target ~80 lines):
- `CONFIG` object: game dimensions (360x640 base), hex radius values, colors palette
- `DIFFICULTY_TABLE`: array of stage parameters (board radius, number pool, special hex %, collapse target)
- `NUMBER_COLORS`: mapping of numbers 1-6 to hex color codes
- `SVG_STRINGS`: all SVG template strings (hex tile, bomb hex, mirror hex, void hex, triangle fragment)
- `SCORE_VALUES`: points per collapse, chain multiplier formula
- Hex math constants: `HEX_WIDTH_FACTOR = Math.sqrt(3)`, `HEX_HEIGHT_FACTOR = 2`, `HEX_VERT_SPACING = 1.5`

**main.js** (target ~60 lines):
- `BootScene`: loads all SVG strings via `textures.addBase64()`, waits for all `addtexture` events, then starts MenuScene
- Phaser.Game config: type AUTO, width 360, height 640, scale mode FIT, parent 'game-container', backgroundColor '#1A1A2E'
- Scene registration: [BootScene, MenuScene, GameScene, HelpScene]
- `GameState` global: { score, highScore, stage, collapses, chainCount, gamesPlayed, settings }
- localStorage read/write helpers

**game.js** (target ~280 lines):
- `GameScene.create()`: Build hex grid data structure (axial coordinates), render hex sprites, set up input handlers, initialize tile queue
- `GameScene.update()`: Idle timer check, auto-fill logic
- `placeTile(q, r)`: Place current tile at axial coord (q, r), trigger `checkCollapses()`
- `checkCollapses()`: BFS/flood-fill to find all connected groups, test each group's sum, collapse matching groups, apply gravity, recurse
- `applyGravity()`: For each non-empty hex, compute shortest path toward center (q=0, r=0), slide if adjacent cell toward center is empty
- `spawnNextTile()`: Pull from queue, generate new tile for queue
- Hex grid utilities: `axialToPixel(q, r)`, `pixelToAxial(x, y)`, `getNeighbors(q, r)`, `findConnectedGroups(grid)`

**Hex Grid Math (axial coordinates, pointy-top)**:
```
Axial to Pixel (pointy-top):
  x = R * sqrt(3) * (q + r/2) + centerX
  y = R * 1.5 * r + centerY

Pixel to Axial (for tap detection):
  q_frac = (x * sqrt(3)/3 - y/3) / R
  r_frac = (y * 2/3) / R
  → cube_round(q_frac, r_frac) to snap to nearest hex

Neighbors of (q, r):
  [(q+1,r), (q-1,r), (q,r+1), (q,r-1), (q+1,r-1), (q-1,r+1)]

Board cells for radius N (axial):
  All (q, r) where |q| <= N, |r| <= N, |q+r| <= N
  Radius 2: 19 cells, Radius 3: 37 cells
```

**Sum-10 Group Detection Algorithm**:
```
1. After placement, get all non-empty cells on board
2. Build adjacency graph (each cell → list of adjacent non-empty cells)
3. Find ALL connected subsets that sum to exactly 10:
   - For each cell, run DFS/BFS expanding to neighbors
   - Track running sum; prune branches where sum > 10
   - When sum == 10, mark all cells in that group for collapse
4. Optimization: since max number is 6 and min is 1, max group size for sum-10 is 10 tiles (all 1s), min is 2 tiles (4+6 or 5+5)
5. Practical approach: For each cell, BFS outward up to depth 6, check all connected subgroups via backtracking
6. SIMPLIFIED APPROACH (recommended for 300-line limit):
   - Check all pairs, triples, and quads of connected cells for sum=10
   - Pairs: O(cells * 6) = ~222 checks
   - Triples: O(cells * 6 * 5) = ~1110 checks
   - Quads: O(cells * 6 * 5 * 4) = ~4440 checks
   - This covers the most common cases (2-4 tile groups)
   - Groups of 5+ are rare and can be checked with bounded BFS
```

**Gravity/Collapse Mechanics**:
```
1. Mark all cells in sum-10 groups for removal
2. Play collapse animation (shatter particles, 400ms)
3. Remove marked cells from grid data
4. Apply gravity toward center:
   - For each non-empty cell, compute direction vector toward (0,0) in axial space
   - Find the neighbor closest to center that is empty
   - Move the tile there (tween 250ms)
   - Repeat until no more moves possible (stable state)
5. After gravity settles, re-run checkCollapses() for cascade
6. If cascade found, increment chainCount, repeat from step 1
7. If no cascade, reset chainCount, spawn next tile
```

**stages.js** (target ~80 lines):
- `getStageConfig(stageNum)`: Returns { boardRadius, numberPool, numberWeights, specialHexChance, collapseTarget, autoFillInterval }
- `generateTile(stageConfig)`: Returns random number/special based on weights
- `advanceStage(currentStage)`: Checks if collapses >= target, returns new stage config
- Stage transition animation trigger

**ui.js** (target ~250 lines):
- `MenuScene`: Title text, play button, help button, high score display, sound toggle
- `HelpScene`: Illustrated how-to-play with SVG diagrams, rules, tips, "Got it!" button
- `GameOverOverlay`: Score display, high score check, continue/play again/menu buttons
- `PauseOverlay`: Resume, help, restart, quit buttons
- `HUD`: Score text, stage text, chain counter, progress bar, idle timer, current/next tile preview
- All button tap targets minimum 44x44px

**ads.js** (target ~40 lines):
- `AdManager`: Placeholder hooks for interstitial and rewarded ads
- `showInterstitial(callback)`: Simulates ad display, calls callback after
- `showRewarded(onReward, onSkip)`: Simulates rewarded ad, calls appropriate callback
- `shouldShowInterstitial(gamesPlayed)`: Returns true every 3rd game over
- No actual ad SDK — POC stage

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No Howler.js — audio via Web Audio API through Phaser's sound manager.

---

## 9. Juice Specification

### 9.1 Player Input Feedback (tile placement — every tap)

| Effect | Target | Values |
|--------|--------|--------|
| Scale punch | Placed hex tile | Scale: 0→1.2→1.0, Duration: 150ms, Ease: Back.easeOut |
| Particles | Placement point | Count: 8, Type: tiny circles (4px), Color: number's color, Direction: radial outward, Speed: 80-150px/s, Lifespan: 300ms, Fade: alpha 1→0 |
| Sound | — | 200Hz sine tap, 80ms, slight pitch variation (+/-20Hz random) |
| Haptic | Device | navigator.vibrate(15) on supported devices |

### 9.2 Core Action Additional Feedback (sum-10 collapse — the money moment)

| Effect | Values |
|--------|--------|
| Flash | All matching hexes flash gold (#FFD700) for 200ms before shattering |
| Particles | Count: 6 triangles per hex (so 12-24 total for a 2-4 tile group), Direction: outward from group center, Speed: 100-300px/s, Rotation: random 0-720deg over 400ms, Color: white fading to number color, Lifespan: 400ms |
| Screen shake | Intensity: 3px (chain 1), +2px per chain step (max 15px), Duration: 150ms |
| Hit-stop | 40ms physics pause before collapse animation begins |
| Camera zoom | 1.03x zoom toward collapse center, Recovery: 200ms ease-out |
| Sound | Glass shatter + pitch up 100Hz per chain step. Chain 4+: add 60Hz bass boom |
| Chain text | "x2", "x3", "x4"... appears at collapse center, size: 24px + 6px per chain, color: gold, float up 40px over 500ms, fade out |
| Combo escalation | Every chain step: particle count +4, shake +2px, sound pitch +100Hz, text size +6px |

### 9.3 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 12px, Duration: 400ms, Decay: exponential |
| Screen effect | Desaturation to 60% over 300ms, red vignette overlay at 20% opacity |
| Sound | Descending tone 440→110Hz, 600ms duration |
| Board visual | All hexes briefly flash red (#FF1744) for 200ms |
| Effect → UI delay | 700ms (shake + desaturation plays, then game over overlay fades in over 300ms) |
| Death → restart | **1.5 seconds** total (700ms effects + 300ms overlay fade + 500ms "Play Again" tap → instant restart) |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{N}" at collapse center, Color: gold (#FFD700), Size: 20px (+4px per chain), Movement: float up 60px over 600ms, Fade: alpha 1→0 over 600ms |
| Score HUD punch | Scale 1.0→1.3→1.0, Duration: 150ms, Ease: Quad.easeOut |
| Chain text | "CHAIN x{N}!" below floating score, Size: 28px, Color: gold, Pulse scale 1.0→1.1→1.0 repeating during chain |
| Perfect clear | "PERFECT!" 48px gold text, screen flash white at 30% opacity for 200ms, 500 bonus floats up separately |
| Stage advance | "STAGE {N}!" 36px cyan (#00E5FF) text, scales from 2.0→1.0 over 500ms (dramatic entrance), fades after 1500ms |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | No external assets (all SVG inline) |
| Memory Usage | <80MB | Max 37 hex sprites + 100 pooled particles |
| JS Bundle Size | <150KB total (excl. CDN) | 6 files, ~300 lines each max |
| First Interaction | <1 second after load | BootScene → MenuScene immediate |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser pointer events (handles touch + mouse). `this.input.on('pointerdown')` for hex cell taps
- **Prevent Default**: CSS `touch-action: none` on game container. Prevent pull-to-refresh via `overscroll-behavior: none`
- **Orientation**: Portrait lock via CSS `@media (orientation: landscape)` showing "Please rotate" message
- **Safe Areas**: 16px padding from viewport edges for HUD elements
- **Background/Focus**: Phaser's `blur` event → auto-pause game, `focus` event → show pause overlay
- **Object Pooling**: Particle pool of 100 triangle sprites, reused across all collapse effects. Hex sprites pooled per board size (37 max).

### 10.3 Hex Grid Implementation Details

**Coordinate System**: Axial coordinates (q, r) with cube coordinate constraint (q + r + s = 0, s = -q-r).

**Board Data Structure**:
```javascript
// Grid stored as Map with string keys "q,r"
this.grid = new Map();  // key: "q,r", value: { number: 1-6, type: 'normal'|'bomb'|'mirror'|'void', sprite: Phaser.GameObjects.Image }

// Initialize board cells (radius 2 example):
for (let q = -2; q <= 2; q++) {
  for (let r = Math.max(-2, -q-2); r <= Math.min(2, -q+2); r++) {
    this.grid.set(`${q},${r}`, null);  // null = empty cell
  }
}
```

**Tap-to-Hex Conversion**: Convert pixel (x, y) to axial (q, r) using fractional hex coordinates, then round to nearest hex center using cube_round algorithm.

**Connected Group Finding (Simplified for 300-line limit)**:
```
For efficiency, use iterative subset enumeration:
1. Start from each occupied cell
2. BFS expand to adjacent occupied cells
3. At each expansion step, check if current subset sums to 10
4. If sum > 10, prune (stop expanding this path)
5. If sum == 10, record this group
6. Maximum search depth: 5 (since min number is 1, max group for sum-10 is 10 tiles, but practically 5-6 for numbers 1-6)
```

### 10.4 Edge Cases

- **Resize/Orientation**: On resize, Phaser scale manager handles FIT mode. Landscape shows overlay message.
- **Background/Tab Switch**: Game auto-pauses. Idle timer freezes. On return, pause overlay shown.
- **Rapid Tapping**: Input locked during collapse animation (400ms) and gravity animation (250ms). Input buffer stores one tap, applied after animations complete.
- **Empty Board After Cascade**: Award "Perfect Clear" bonus, continue with next tile on empty board.
- **Board Expansion (Stage 7)**: New cells (radius 3 ring) appear empty. Existing tiles stay in place. Grid data structure expanded. 500ms growth animation.
- **No Valid Placement**: If somehow all cells are full before game-over triggers (shouldn't happen due to board-full check after each placement), force game over.

### 10.5 Testing Checkpoints

1. **Boot**: BootScene loads, all SVG textures registered, MenuScene displays
2. **Menu**: Play button works, Help button opens HelpScene, sound toggle persists to localStorage
3. **Grid Rendering**: All 19 hex cells visible and tappable (radius 2), proper pointy-top alignment
4. **Placement**: Tap empty cell → tile appears with pop animation, tap occupied cell → nothing happens
5. **Sum-10 Detection**: Place tiles summing to 10 → group highlights gold → collapses with particles
6. **Gravity**: After collapse, tiles slide toward center correctly
7. **Cascades**: Gravity-shifted tiles form new sum-10 → auto-collapse with chain multiplier
8. **Game Over**: Fill all cells → game over screen appears within 700ms, "Play Again" restarts within 2s
9. **Idle Death**: Wait 30s → auto-fill begins → board fills → game over
10. **Stage Advance**: Hit collapse target → stage number increments, progress bar resets
11. **Board Expansion**: Reach stage 7 → board grows from 19 to 37 cells with animation
12. **Pause/Resume**: Pause button → overlay → Resume returns to exact game state
13. **High Score**: Beat high score → "NEW BEST!" text → persisted in localStorage
14. **Orientation**: Rotate to landscape → "Please rotate" overlay → back to portrait → game intact

### 10.6 Local Storage Schema

```json
{
  "hex_collapse_high_score": 0,
  "hex_collapse_games_played": 0,
  "hex_collapse_highest_stage": 0,
  "hex_collapse_best_chain": 0,
  "hex_collapse_settings": {
    "sound": true,
    "vibration": true
  },
  "hex_collapse_total_score": 0
}
```
