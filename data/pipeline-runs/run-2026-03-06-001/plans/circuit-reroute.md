# Game Design Document: Circuit Reroute

**Slug**: `circuit-reroute`
**One-Liner**: Drag wire segments to complete circuits before the power surge reaches the dead end and fries everything.
**Core Mechanic**: Real-time electricity pathfinding on a tile grid with drag-to-rotate wire tiles.
**Target Session Length**: 3-6 minutes
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Circuit Reroute is a real-time puzzle game where electricity flows from a source node across a grid of wire tiles. The player must frantically rotate and reposition wire segments to guide the current toward a target light bulb before the surge hits a dead end and short-circuits everything. The moment-to-moment tension comes from watching the bright yellow glow inch across the board while you scramble to connect the path ahead of it.

The game starts on a simple 4x4 grid where paths are nearly complete and only 2-3 tiles need rotation. As stages advance, grids grow to 6x6, current speed increases, locked tiles block easy solutions, multiple source nodes split the current, and bonus tiles vanish on timers. Every stage is solvable but demands faster pattern recognition and spatial reasoning under escalating pressure.

What makes it unique is the real-time pressure: unlike turn-based pipe puzzles, the electricity never waits. You can see it coming, glowing brighter as it nears a dead end. The panic of racing a visible, advancing threat through your own half-built circuit creates genuine tension that pure puzzle games lack.

### 1.2 Target Audience

Casual mobile gamers aged 16-40 who enjoy puzzle games with time pressure. Players who like pipe-puzzle mechanics but want adrenaline. Play context: short commute sessions, waiting rooms, quick brain-stimulation breaks. Low skill floor (rotate tiles to connect paths) but high skill ceiling (multi-source routing under speed pressure).

### 1.3 Core Fantasy

You are a frantic electrician racing against a live power surge. One wrong connection and the whole board explodes in sparks. The satisfaction comes from watching your completed circuit light up in a cascade of neon glow, knowing the surge was milliseconds from frying everything.

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
[Stage Start: Grid revealed with tiles]
    → [Electricity begins flowing from source]
    → [Player taps tiles to rotate wire paths]
    → [Current reaches bulb = Stage Clear!]
    → [Score + bonus for time remaining]
    → [Next stage (harder)]
         |
    OR: [Current hits dead end = SHORT CIRCUIT = Explosion = Lose Life]
         |
    → [Lives remaining?] → YES → [Retry same stage]
                          → NO  → [Game Over → Retry / Menu]
```

**Moment-to-moment**: The player sees the grid, identifies the source (left edge, pulsing green node) and target bulb (right edge, dim yellow). Wire tiles are scattered in wrong orientations. Electricity begins flowing immediately. The player taps tiles to rotate them 90 degrees clockwise, building a connected path from source to bulb. The current advances in real-time along connected segments. If it reaches a tile with no valid exit (dead end), the board short-circuits and the player loses a life.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Rotate Tile | Tap | Taps a wire tile to rotate it 90 degrees clockwise. Instant response. |
| Quick-Rotate | Double-Tap | Rotates tile 180 degrees (two quick taps within 300ms). |
| Pause | Tap pause icon | Opens pause overlay (top-right corner, 48x48px). |

**Control Philosophy**: Single-tap is the only mechanic. No dragging, no swiping, no multi-touch. This keeps the interaction ultra-fast and prevents accidental gestures. The challenge is cognitive (which tile to rotate) not motor (how to rotate it). Every tile on the grid is a valid tap target.

**Touch Area Map**:
```
┌─────────────────────────────────┐
│  Score    Stage N    [||] ♥♥♥  │  ← HUD bar (60px height)
├─────────────────────────────────┤
│                                 │
│  [S]─[tile][tile][tile]         │
│      [tile][tile][tile]         │  ← Grid area (centered)
│      [tile][tile][tile][B]      │     Each tile: tap to rotate
│      [tile][tile][tile]         │
│                                 │
├─────────────────────────────────┤
│     Time bonus bar (optional)   │  ← Bottom info (40px)
└─────────────────────────────────┘
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Stage Clear | 100 base | +50 per stage number (stage 5 = 350) |
| Time Bonus | 10 per second remaining | Remaining countdown seconds x10 |
| Perfect Clear | 200 bonus | Complete stage without any dead-end hits |
| Speed Bonus | 150 bonus | Clear stage in under 3 seconds |
| Streak Bonus | x1.5 / x2.0 / x3.0 | 3 / 5 / 10 consecutive clears without dying |

**Combo System**: Streak counter tracks consecutive stage clears without losing a life. At 3 clears the score multiplier becomes x1.5, at 5 it becomes x2.0, at 10 it becomes x3.0. Dying resets the streak to 0.

**High Score**: Stored in `localStorage` as `circuit_reroute_high_score`. Displayed on menu screen and game over screen. New high score triggers celebratory particle burst and "NEW BEST!" text.

### 2.4 Progression System

The game is infinite stages with procedural grid generation. Progression comes from increasing grid size, faster current speed, and new tile mechanics.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-5 | Straight + Elbow tiles only, 4x4 grid | Easy: current 1 tile/sec, 15s countdown, 2-3 tiles need rotation |
| 6-10 | T-junction tiles added, grid grows to 5x5 | Medium: current 1.5 tiles/sec, 13s countdown, 4-5 tiles rotated |
| 11-20 | Cross tiles + Locked tiles (cannot rotate) | Hard: current 2 tiles/sec, 11s countdown, 5-7 tiles rotated, 1-2 locked |
| 21-30 | Multiple source nodes (2 sources, 1 bulb) | Very Hard: current 2.5 tiles/sec, 9s countdown, 6x6 grid |
| 31-50 | Multiple bulbs (1 source, 2 bulbs, both must light) | Expert: current 3 tiles/sec, 8s countdown, 2-3 locked tiles |
| 51+ | Timed vanishing tiles + all mechanics combined | Extreme: current 3.5 tiles/sec, 7s countdown, random mix |

### 2.5 Lives and Failure

The player starts with **3 lives** (displayed as heart icons). Lives cannot be earned through gameplay.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Current hits dead end (no valid exit from tile) | Lose 1 life, board explodes, retry same stage | Watch rewarded ad for +1 life (once per game) |
| Countdown timer reaches 0 | Lose 1 life, surge overloads, retry same stage | Same as above |
| Inactivity >4 seconds on 4x4 grid | Current naturally reaches dead end (no special penalty) | N/A (natural death) |
| All 3 lives lost | Game Over screen | Watch ad to continue with 1 life (once per game) |

**Inactivity Death Guarantee**: On stage 1 (4x4 grid), if the player does nothing, the electricity travels from the source node along whatever default path exists. With 2-3 tiles in wrong orientation, the current will hit a dead end within 4 seconds (4 tiles at 1 tile/sec). By stage 10+, current speed of 1.5+ tiles/sec means death in ~3 seconds of inactivity.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each stage is a grid of wire tiles procedurally generated with a guaranteed solution path.

**Generation Algorithm**:
```
Stage Generation Parameters:
- Grid Size: 4x4 (stages 1-5), 5x5 (stages 6-20), 6x6 (stages 21+)
- Source Position: Left edge, random row
- Bulb Position: Right edge, random row (different from source row for stages 6+)
- Solution Path: Random walk from source to bulb (no backtracking, min Manhattan distance)
- Tile Types Available: Based on stage range (see progression table)
- Scramble Count: Number of solution-path tiles to randomly rotate = 2 + floor(stage / 3), capped at gridSize^2 * 0.6
- Locked Tile Count: 0 (stages 1-10), 1 (11-20), 2 (21-30), 3 (31+)
- Extra Sources: 0 (stages 1-20), 1 (stages 21-30), 2 (stages 31+)
- Extra Bulbs: 0 (stages 1-30), 1 (stages 31+)
- Vanishing Tiles: 0 (stages 1-50), 1-2 (stages 51+), vanish after 5 seconds
- Current Speed: 1.0 + (stage - 1) * 0.1, capped at 3.5 tiles/sec
- Countdown: max(7, 15 - floor(stage / 5)) seconds
```

**Step-by-step generation**:
1. Create empty grid of target size.
2. Place source node on left edge at random row.
3. Place bulb on right edge at random row.
4. Generate solution path via constrained random walk: start at source, move right/up/down (never left, never revisit), reach bulb. Each step picks a random valid direction weighted 60% right, 20% up, 20% down.
5. For each cell on the solution path, assign the correct wire tile type (straight horizontal, straight vertical, elbow, T-junction, or cross) based on which neighbors connect.
6. Fill remaining empty cells with random wire tiles in random orientations (these are decoys / distractors).
7. Rotate `scramble_count` tiles on the solution path to random wrong orientations.
8. Mark `locked_count` tiles as locked (these are on the solution path, already in correct orientation, and display a lock icon).
9. Validate: confirm that rotating scrambled tiles back to correct orientation creates a connected path from source to bulb.

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
| Grid Size | 4x4 | 5x5 | 5x5 | 6x6 | 6x6 |
| Current Speed (tiles/sec) | 1.0 | 1.5 | 2.0 | 2.5-3.0 | 3.0-3.5 |
| Countdown (sec) | 15 | 13 | 11 | 9 | 7 |
| Scrambled Tiles | 2-3 | 4-5 | 5-7 | 7-10 | 10-15 |
| Locked Tiles | 0 | 0 | 1-2 | 2-3 | 3 |
| Tile Types | Straight, Elbow | +T-junction | +Cross | +Multi-source | +Vanishing |
| New Mechanic | None | T-junctions | Cross + Locked | Multiple Sources | Vanishing Tiles |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: The generation algorithm starts from a valid solution path and scrambles tiles. The solution always exists by construction. The validation step confirms at least one rotation configuration connects source to bulb.
2. **Variety Threshold**: Consecutive stages must differ in at least 2 of: source row, bulb row, path shape, scramble positions. The random walk ensures this naturally.
3. **Difficulty Monotonicity**: Current speed and scramble count never decrease. Grid size only increases at thresholds.
4. **Rest Stages**: Every 10th stage (10, 20, 30...) is a "breather" with 2 fewer scrambled tiles than normal and +3 seconds on the countdown.
5. **Boss Stages**: Every 15th stage features a unique visual treatment (red-tinted grid border, pulsing danger glow) with +2 extra scrambled tiles and -2 seconds on countdown.

### 3.4 Wire Tile Types

**Tile Catalog** (all tiles are square, fit one grid cell):

| Tile Type | Connections | Rotation States | Stage Introduced |
|-----------|-------------|-----------------|------------------|
| Straight | 2 opposite edges (left-right OR top-bottom) | 2 unique (0, 90) | Stage 1 |
| Elbow | 2 adjacent edges (e.g., bottom-right) | 4 unique (0, 90, 180, 270) | Stage 1 |
| T-Junction | 3 edges (e.g., left-right-bottom) | 4 unique (0, 90, 180, 270) | Stage 6 |
| Cross | All 4 edges | 1 unique (always connected, cannot be wrong) | Stage 11 |

**Connection Logic**: Each tile has openings on 0-4 edges (top, right, bottom, left). Two adjacent tiles are "connected" if the shared edge has an opening on both tiles. Electricity flows through connected openings.

### 3.5 Electricity Pathfinding Algorithm

```
Every frame (at 60fps):
1. Track currentPosition = {tile, entryEdge, progress (0.0 to 1.0)}
2. Advance progress by (currentSpeed * delta / 1000) where delta is frame time in ms
   - currentSpeed = tiles per second (see difficulty table)
3. When progress >= 1.0:
   a. Determine exitEdge = opposite of entryEdge for Straight,
      or clockwise-adjacent for Elbow, or branching for T/Cross
   b. Find neighbor tile on exitEdge side
   c. If neighbor exists AND has opening on shared edge:
      - Move current to neighbor tile with entryEdge = opposite of exitEdge
      - Reset progress to 0.0
   d. If neighbor does NOT exist OR does NOT have matching opening:
      - DEAD END → trigger short circuit explosion → lose life
4. When current reaches the Bulb tile:
   - Stage clear → score + effects
5. For T-junctions: current splits into 2 branches (both must reach valid destinations)
   - Each branch tracked independently
   - If ANY branch hits dead end → short circuit
6. For multiple sources: each source starts its own current simultaneously
   - All currents must reach a bulb
```

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Dark PCB (printed circuit board) aesthetic with neon glow effects. Clean geometric shapes on a dark green background. Wire traces rendered as chunky copper-colored paths with bright glow when electrified. Minimalist but high-contrast for readability.

**Aesthetic Keywords**: PCB-neon, copper-glow, dark-tech, circuit-punk, electric-minimal

**Reference Palette**: Think Tron meets electronics workbench. Dark backgrounds with vivid glowing traces.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | PCB Dark Green | #0A1F0A | Game background, grid area |
| Grid Lines | Dark Teal | #1A3A2A | Grid cell borders |
| Wire (inactive) | Copper | #B87333 | Unelectrified wire paths on tiles |
| Wire (active/electrified) | Bright Yellow | #FFE44D | Wire segments the current has passed through |
| Current Glow | White-Yellow | #FFFFAA | The advancing electricity front glow |
| Source Node | Neon Green | #00FF88 | Source node pulsing indicator |
| Bulb (unlit) | Dim Yellow | #665522 | Target bulb before completion |
| Bulb (lit) | Bright Gold | #FFD700 | Target bulb on stage clear |
| Locked Tile | Steel Gray | #778899 | Locked tile overlay / lock icon |
| Danger/Explosion | Hot Orange | #FF6622 | Short circuit sparks, explosion particles |
| UI Text | White | #FFFFFF | Score, stage, labels |
| UI Accent | Cyan | #00DDFF | Buttons, highlights, selection outlines |
| Lives Heart | Red | #FF3344 | Heart icons |

### 4.3 SVG Specifications

All graphics rendered as SVG, encoded as base64 in `config.js`, registered once in BootScene.

**Wire Tile - Straight Horizontal** (64x64):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0D2B0D" stroke="#1A3A2A" stroke-width="1"/>
  <rect x="0" y="24" width="64" height="16" rx="3" fill="#B87333"/>
  <rect x="0" y="28" width="64" height="8" rx="2" fill="#D4924A" opacity="0.5"/>
</svg>
```

**Wire Tile - Elbow (Bottom-Right)** (64x64):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0D2B0D" stroke="#1A3A2A" stroke-width="1"/>
  <path d="M32 64 L32 32 L64 32" stroke="#B87333" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M32 64 L32 32 L64 32" stroke="#D4924A" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
</svg>
```

**Wire Tile - T-Junction (Left-Right-Bottom)** (64x64):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0D2B0D" stroke="#1A3A2A" stroke-width="1"/>
  <path d="M0 32 L64 32 M32 32 L32 64" stroke="#B87333" stroke-width="16" fill="none" stroke-linecap="round"/>
  <path d="M0 32 L64 32 M32 32 L32 64" stroke="#D4924A" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.5"/>
</svg>
```

**Wire Tile - Cross** (64x64):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0D2B0D" stroke="#1A3A2A" stroke-width="1"/>
  <path d="M0 32 L64 32 M32 0 L32 64" stroke="#B87333" stroke-width="16" fill="none" stroke-linecap="round"/>
  <path d="M0 32 L64 32 M32 0 L32 64" stroke="#D4924A" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.5"/>
</svg>
```

**Source Node** (64x64):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0D2B0D"/>
  <circle cx="32" cy="32" r="20" fill="#00FF88" opacity="0.3"/>
  <circle cx="32" cy="32" r="14" fill="#00FF88"/>
  <circle cx="32" cy="32" r="8" fill="#AAFFCC"/>
  <text x="32" y="38" text-anchor="middle" fill="#003311" font-size="16" font-weight="bold">S</text>
</svg>
```

**Bulb (unlit)** (64x64):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0D2B0D"/>
  <circle cx="32" cy="28" r="16" fill="#665522" stroke="#998833" stroke-width="2"/>
  <rect x="26" y="44" width="12" height="8" fill="#998833" rx="2"/>
  <line x1="28" y1="47" x2="36" y2="47" stroke="#665522" stroke-width="1"/>
</svg>
```

**Bulb (lit)** (64x64):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0D2B0D"/>
  <circle cx="32" cy="28" r="22" fill="#FFD700" opacity="0.2"/>
  <circle cx="32" cy="28" r="16" fill="#FFD700" stroke="#FFEE88" stroke-width="2"/>
  <circle cx="32" cy="28" r="8" fill="#FFFFCC"/>
  <rect x="26" y="44" width="12" height="8" fill="#FFEE88" rx="2"/>
</svg>
```

**Lock Icon Overlay** (64x64):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="20" y="30" width="24" height="18" rx="3" fill="#778899" opacity="0.8"/>
  <path d="M26 30 L26 24 Q26 16 32 16 Q38 16 38 24 L38 30" fill="none" stroke="#778899" stroke-width="3" opacity="0.8"/>
  <circle cx="32" cy="40" r="3" fill="#AABBCC"/>
</svg>
```

**Design Constraints**:
- All SVG elements use basic shapes (rect, circle, path, line) only
- Max 8 path elements per SVG object
- Tile size: 64x64 base, scaled to fit grid in viewport
- Actual rendered tile size = `min(gameWidth, gameHeight - 120) / gridSize` (ensures grid fits with HUD)

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Current Glow Trail | Electricity advancing | Yellow-white circle (r=6px) follows current position, trailing 3 fading copies at 80%/50%/20% alpha |
| Tile Rotate Snap | Player taps tile | Tile sprite rotates 90deg over 80ms with easeOut, brief white outline flash (50ms) |
| Stage Clear Cascade | Current reaches bulb | All wire tiles on solution path flash bright gold sequentially (50ms delay per tile), bulb scales 1.0→1.4→1.0 over 300ms |
| Short Circuit Explosion | Dead end reached | 20 orange particles burst from dead-end tile, random velocity 50-150px/s, fade over 400ms. Screen shake 6px for 200ms. Dead-end tile flashes red 3 times over 300ms. |
| Countdown Warning | Timer < 3 seconds | Timer text pulses red, scales 1.0→1.2→1.0 every 500ms |
| Streak Counter | 3+ consecutive clears | "x1.5!" / "x2.0!" / "x3.0!" text appears center screen, gold color, scales 0→1.5→1.0 over 400ms, fades after 800ms |
| Source Pulse | Idle animation | Source node glows brighter/dimmer in 1.5s sine cycle |
| Grid Appear | Stage start | Tiles fade in from 0 to 1 alpha over 300ms with 20ms stagger per tile (top-left to bottom-right) |

---

## 5. Audio Design

### 5.1 Sound Effects

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Tile Rotate | Crisp click-snap, like a switch toggle | 80ms | High |
| Current Advance | Soft electrical hum tick per tile | 100ms | Medium |
| Current Flow (loop) | Low buzzing hum, pitch rises as current nears end | Looping | Low |
| Stage Clear | Bright ascending ZAP with chime finish | 600ms | High |
| Short Circuit | Crackling explosion, sharp static burst | 400ms | High |
| Timer Warning | Rapid ticking beep every 500ms | 100ms per beep | Medium |
| Bulb Light Up | Warm "fwoom" power-on sound | 300ms | High |
| Streak Achieved | Quick ascending triple-note jingle | 400ms | Medium |
| Game Over | Descending electrical fade-out, somber buzz | 800ms | High |
| UI Button | Subtle soft click | 60ms | Low |
| New High Score | Celebratory ascending sparkle cascade | 1200ms | High |
| Locked Tile Tap | Dull metallic clunk (no rotation) | 100ms | Medium |

### 5.2 Music Concept

**Background Music**: No background music track. The ambient electrical hum and sound effects create the atmosphere. This keeps the file size minimal and avoids audio loading complexity.

**Audio Implementation**: All sounds generated via Web Audio API (Phaser's built-in sound manager) using simple oscillator-based synthesis. No external audio files needed. Each sound is a short synthesized tone:
- Click-snap: 800Hz square wave, 80ms, quick decay
- ZAP: 200→2000Hz frequency sweep, 600ms
- Explosion: White noise burst, 400ms, sharp attack/decay
- Hum: 120Hz sine wave, continuous, volume modulated

---

## 6. UI/UX

### 6.1 Screen Flow

```
+----------+     +----------+     +----------+
|  Boot    |---->|   Menu   |---->|   Game   |
|  Scene   |     |  Screen  |     |  Screen  |
+----------+     +-----+----+     +-----+----+
                    |   |               |
               +----+   |         +----+----+
               |        |         |  Pause  |-->+---------+
          +----+----+   |         | Overlay |   |  Help   |
          |  Help   |   |         +----+----+   |How2Play |
          |How2Play |   |              |        +---------+
          +---------+   |         +----+----+
                   +----+----+    |  Game   |
                   |Settings |    |  Over   |
                   | Overlay |    | Screen  |
                   +---------+    +----+----+
                                       |
                                  +----+----+
                                  | Ad /    |
                                  |Continue |
                                  | Prompt  |
                                  +---------+
```

### 6.2 HUD Layout

```
+---------------------------------+
| Score: 1250   Stage 7   [||]***|  <- Top bar (60px)
+---------------------------------+
|  [S]=[==]=[/=][==]              |
|     [==]=[==][/=][==]           |  <- Grid area (centered, square)
|     [T=]=[==][==][==][B]        |     Touch any tile to rotate
|     [==]=[/=][==][==]           |
|                                 |
+---------------------------------+
|    Timer: 11s    Streak: x1.5   |  <- Bottom bar (40px)
+---------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left (16px, 30px) | Current score, white, 24px font | On score change |
| Stage | Top-center | "Stage N", white, 20px font | On stage transition |
| Pause Button | Top-right (gameWidth-48, 8px) | "||" icon, 44x44px tap target | Always visible |
| Lives | Top-right (right of pause) | 3 heart icons, 20px each | On life change |
| Timer | Bottom-center | Countdown seconds, green→red under 3s, 22px | Every second |
| Streak | Bottom-right | "x1.5" multiplier text, gold, 18px | On streak change |

### 6.3 Menu Structure

**Main Menu** (MenuScene):
- Game title "CIRCUIT REROUTE" in neon cyan (#00DDFF), 32px, centered at y=25%
- Subtitle "Route the current. Save the circuit." in white, 14px, y=33%
- **PLAY** button: Large cyan rounded rect (200x60px), centered at y=55%, white text 28px
- **How to Play** button: "?" circle icon (44x44px), positioned at y=70%, left of center
- **High Score** display: Trophy icon + score value, y=70%, right of center
- **Sound Toggle**: Speaker icon (44x44px), top-right corner (gameWidth-52, 8px)

**Pause Menu** (overlay, semi-transparent #000000 at 70% opacity):
- "PAUSED" text, white, 28px, centered at y=25%
- Resume button (180x50px), y=40%
- How to Play button (180x50px), y=52%
- Restart button (180x50px), y=64%
- Quit to Menu button (180x50px), y=76%

**Game Over Screen** (GameOverScene):
- "SHORT CIRCUIT!" or "GAME OVER" text, orange (#FF6622), 30px, y=15%
- Final Score: large white text, 40px, y=30%, with scale punch animation
- "NEW BEST!" indicator if high score, gold text, 20px, pulsing
- Stage Reached: "Stage N", white, 20px, y=40%
- Streak: "Best Streak: N", white, 18px, y=47%
- "Continue (Ad)" button: green (200x50px), y=58% (if not used yet)
- "Play Again" button: cyan (200x50px), y=68%
- "Menu" button: gray (140x40px), y=80%

**Help / How to Play Screen** (overlay or HelpScene):
- Title: "HOW TO PLAY", cyan, 26px, y=8%
- **Visual diagram 1**: SVG illustration showing a 3x3 mini-grid with source on left, bulb on right, arrow pointing to a tile with curved rotation arrow. Caption: "TAP tiles to ROTATE them 90 degrees"
- **Visual diagram 2**: SVG showing electricity glow advancing along connected path. Caption: "Guide the CURRENT from SOURCE to BULB"
- **Visual diagram 3**: SVG showing dead-end tile with explosion sparks. Caption: "Dead ends = SHORT CIRCUIT = lose a life!"
- **Rules section**:
  - "Complete stages to earn points + time bonus"
  - "Clear stages in a row for streak multipliers (x1.5, x2.0, x3.0)"
  - "3 lives per game. Lose a life on dead end or timeout."
- **Tips**:
  - "Start from the bulb and work backwards!"
  - "Cross tiles connect all 4 sides and never need rotation"
  - "Watch the timer - later stages get faster!"
- **"Got it!" button**: cyan (160x50px), bottom center, returns to previous screen
- Scrollable if content exceeds viewport height

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after death (game over) | Every game over | Always (optional) |
| Rewarded | Double final score | After game over score display | Always (optional) |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Life | Watch rewarded ad at game over | +1 life, continue from current stage | Once per game session |
| Score Doubler | Watch rewarded ad at score screen | 2x final score | Once per game session |

### 7.3 Session Economy

The game is designed for quick sessions (3-6 minutes). Average player reaches stage 8-12 before game over. Expected 2-3 game overs per session (6-15 minutes total). Interstitial ads trigger every 3rd game over (~1 per session). Rewarded ads are always optional.

**Session Flow with Monetization**:
```
[Play Free] -> [Death x3] -> [Game Over] -> [Rewarded Ad: Continue?]
                                                 | Yes -> [+1 life, resume]
                                                 | No  -> [Score Screen]
                                                              |
                                                     [Interstitial (every 3rd)]
                                                              |
                                                     [Rewarded Ad: 2x Score?]
                                                              | Yes -> [Score doubled]
                                                              | No  -> [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/circuit-reroute/
+-- index.html              # Entry point
|   +-- CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
|   +-- Local CSS           # css/style.css
|   +-- Local JS (ordered)  # config -> stages -> ads -> effects -> ui -> game -> main (LAST)
+-- css/
|   +-- style.css           # Responsive styles, mobile-first
+-- js/
    +-- config.js           # Colors, difficulty tables, SVG strings, tile definitions
    +-- main.js             # BootScene, Phaser init, scene registration (loads LAST)
    +-- game.js             # GameScene: grid rendering, input, electricity simulation
    +-- stages.js           # Stage generation algorithm, difficulty scaling
    +-- ui.js               # MenuScene, GameOverScene, HUD overlay, pause, help, settings
    +-- ads.js              # Ad integration hooks, reward callbacks
```

**Script load order in index.html** (critical):
1. `js/config.js`
2. `js/stages.js`
3. `js/ads.js`
4. `js/ui.js`
5. `js/game.js`
6. `js/main.js` **(MUST be LAST)**

### 8.2 Module Responsibilities

**config.js** (~80 lines):
- `COLORS` object: all hex color constants
- `DIFFICULTY` table: per-stage-range parameters (grid size, speed, countdown, scramble count, locked count)
- `TILE_TYPES` enum: STRAIGHT=0, ELBOW=1, T_JUNCTION=2, CROSS=3
- `TILE_CONNECTIONS` map: for each tile type and rotation (0/90/180/270), which edges have openings [top, right, bottom, left]
- `SVG_STRINGS` object: all SVG markup as template literal strings
- `SCORE_VALUES` object: stage clear base, time bonus multiplier, perfect bonus, speed bonus, streak thresholds
- `GAME_CONFIG` object: initial lives (3), max streak multiplier (3.0), inactivity timeout constants

**main.js** (~60 lines):
- `BootScene`: extends Phaser.Scene. In `preload()`: encode all SVG strings from `config.js` via `btoa()`, call `this.textures.addBase64()` for each. In `create()`: listen for all `addtexture` events, start MenuScene when all loaded.
- Phaser.Game config: type AUTO, scale mode FIT, parent 'game-container', backgroundColor COLORS.BACKGROUND, scene array [BootScene, MenuScene, GameScene, GameOverScene, HelpScene]
- `GameState` global: { score, stage, lives, highScore, streak, settings }
- localStorage read/write for high score and settings

**game.js** (~280 lines):
- `GameScene` extends Phaser.Scene
- `create()`: Generate stage via `StageGenerator.generate(stageNumber)`. Render grid of tile sprites. Set up tap input on each tile. Initialize electricity state (position, progress, speed). Start countdown timer. Start current advancement in `update()`.
- `update(time, delta)`: Advance electricity position. Check for dead ends. Check for bulb reached. Update current glow position. Update timer display.
- `rotateTile(row, col)`: Rotate tile 90 degrees clockwise. Update sprite angle. Update connection data. Play click sound + scale punch.
- `advanceElectricity(delta)`: Move current along connected path. Handle T-junction splits. Detect dead ends. Trigger effects.
- `onDeadEnd(tile)`: Explosion particles, screen shake, lose life, retry or game over.
- `onStageComplete()`: Score calculation, cascade light-up effect, transition to next stage.
- `checkConnections(row, col)`: Returns which edges of tile at (row,col) connect to valid neighbor openings.

**stages.js** (~120 lines):
- `StageGenerator.generate(stageNumber)`: Returns grid 2D array of {tileType, rotation, locked, isPath, hasSource, hasBulb}.
- `_buildSolutionPath(gridSize, sourceRow, bulbRow)`: Random walk algorithm from source to bulb.
- `_assignTileTypes(path, gridSize)`: Determine correct tile type for each path cell based on neighbor connections.
- `_scrambleTiles(grid, count)`: Randomly rotate `count` solution-path tiles to wrong orientations.
- `_fillDecoys(grid)`: Fill empty cells with random tile types in random orientations.
- `_getDifficultyParams(stageNumber)`: Returns {gridSize, speed, countdown, scrambleCount, lockedCount} from difficulty table.

**ui.js** (~280 lines):
- `MenuScene`: Title text, play button, help button, high score display, sound toggle. Button handlers start GameScene or HelpScene.
- `GameOverScene`: Score display, high score check, continue/play-again/menu buttons. Ad trigger hooks.
- `HelpScene`: Illustrated how-to-play with SVG diagrams, rules, tips, "Got it!" button. Receives `returnScene` parameter to know where to go back.
- `HUDOverlay`: Created as parallel scene launched from GameScene. Displays score, stage, lives, timer, streak. Updated via Phaser events.
- `PauseOverlay`: Semi-transparent overlay with resume/help/restart/quit buttons.
- `SettingsOverlay`: Sound on/off toggle.

**ads.js** (~40 lines):
- `AdManager.showInterstitial()`: Placeholder hook for interstitial ad display.
- `AdManager.showRewarded(callback)`: Placeholder hook for rewarded ad with success callback.
- `AdManager.shouldShowInterstitial()`: Tracks game-over count, returns true every 3rd.
- `AdManager.canContinue()`: Returns true if continue not yet used this session.

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No Howler.js needed (using Phaser's built-in Web Audio for synthesized sounds).

---

## 9. Juice Specification

### 9.1 Player Input Feedback (Tile Rotation - every tap)

| Effect | Target | Values |
|--------|--------|--------|
| Rotation Animation | Tapped tile sprite | Rotate 90deg clockwise, 80ms duration, Ease.Quadratic.Out |
| Scale Punch | Tapped tile sprite | Scale 1.0 -> 1.15 -> 1.0, 100ms recovery |
| White Outline Flash | Tapped tile sprite | 2px white (#FFFFFF) border, 50ms, then fade |
| Sound | -- | 800Hz square wave click, 80ms, pitch +5% per consecutive tap within 500ms |
| Particles | Tapped tile center | Count: 6, Color: #00DDFF (cyan), Direction: radial outward, Speed: 40px/s, Lifespan: 200ms, Size: 3px circles |

### 9.2 Core Action Additional Feedback (Electricity Advancement)

| Effect | Values |
|--------|--------|
| Current Glow | 8px radius yellow-white (#FFFFAA) circle at current position, alpha 1.0 |
| Glow Trail | 3 trailing circles at previous positions, alpha 0.6/0.3/0.1, 5px radius |
| Wire Color Change | Tile wire path changes from copper (#B87333) to electrified yellow (#FFE44D) over 200ms as current passes |
| Buzzing Pitch Rise | Continuous 120Hz hum rises +20Hz per tile advanced, resets each stage |
| Camera Micro-shake | 1px random offset when current enters new tile, 50ms, subtle urgency feel |

### 9.3 Stage Clear Effects

| Effect | Values |
|--------|--------|
| Cascade Light-up | Solution path tiles flash gold (#FFD700) sequentially, 50ms per tile |
| Bulb Scale Punch | Bulb sprite scales 1.0 -> 1.4 -> 1.0, 300ms, Ease.Bounce.Out |
| Bulb Glow Burst | 15 yellow (#FFD700) particles from bulb, radial, speed 80px/s, lifespan 500ms |
| Screen Flash | White overlay alpha 0 -> 0.15 -> 0, 150ms |
| Score Float | "+{score}" text, gold (#FFD700), floats up 60px from grid center, fades over 600ms, 24px font |
| ZAP Sound | 200Hz -> 2000Hz frequency sweep, 600ms duration |
| Stage Transition | 400ms fade-to-black, new grid fades in over 300ms with tile stagger (20ms each) |

### 9.4 Death/Failure Effects (Short Circuit)

| Effect | Values |
|--------|--------|
| Screen Shake | Intensity: 8px random offset, Duration: 250ms, Decay: linear to 0 |
| Explosion Particles | Count: 20, Color: #FF6622 (orange) + #FF3344 (red), Speed: 50-150px/s random radial, Lifespan: 400ms, Size: 4-8px |
| Dead-End Tile Flash | Red (#FF3344) tint, flash 3 times over 300ms |
| Screen Desaturation | Pipeline postFX: saturation 1.0 -> 0.3 over 200ms, hold 300ms |
| Sound | White noise burst (explosion), 400ms, sharp attack |
| Effect -> UI Delay | 600ms after explosion before showing retry/game-over UI |
| Death -> Restart | **Under 1.5 seconds** (600ms effect + 400ms fade + 500ms new grid appear) |

### 9.5 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating Text | "+{N}" where N is points earned, Color: #FFD700 (gold), Float up 60px, Fade over 600ms, Font: 22px bold |
| Score HUD Punch | Score text scales 1.0 -> 1.3 -> 1.0, 150ms recovery |
| Streak Text | "x1.5!" / "x2.0!" / "x3.0!", Center screen, scales 0 -> 1.5 -> 1.0 over 400ms, gold, 30px, fades after 800ms |
| Time Bonus Text | "+{N} TIME BONUS", smaller (16px), appears below main score float, cyan (#00DDFF) |

### 9.6 Timer Warning Effects

| Effect | Values |
|--------|--------|
| Timer Color | Green (#00FF88) -> Yellow (#FFE44D) at 5s -> Red (#FF3344) at 3s |
| Timer Pulse | At <3s: scale 1.0 -> 1.2 -> 1.0 every 500ms |
| Tick Sound | At <3s: 1200Hz square wave beep, 60ms, every 500ms |
| Grid Border Glow | At <3s: red (#FF3344) border glow pulses around grid, 4px width |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | No external assets, SVG generated in code |
| Memory Usage | <80MB | Minimal sprites, no large textures |
| JS Bundle Size | <60KB total (excl. CDN) | 6 files, all under 300 lines |
| First Interaction | <1 second after load | SVG base64 encoding is fast |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser pointer events on each tile sprite. Min tap target: 44x44px (tiles are 64x64 base, scaled to grid).
- **Orientation**: Portrait lock via CSS. On landscape, show "Please rotate your device" overlay.
- **Resize Handler**: `window.addEventListener('resize', () => game.scale.refresh())` in main.js. Grid recalculates tile size on resize.
- **Prevent Default**: Disable pull-to-refresh, pinch-zoom, double-tap-zoom via CSS `touch-action: manipulation` on game container.
- **Background/Focus**: Listen for `visibilitychange` event. Pause game timer and electricity when app is backgrounded.
- **Safe Areas**: Use `env(safe-area-inset-*)` in CSS for game container padding.

### 10.3 Grid Rendering Strategy

- Calculate tile pixel size: `tileSize = Math.floor(Math.min(gameWidth - 20, gameHeight - 120) / gridSize)`
- Grid origin X: `(gameWidth - gridSize * tileSize) / 2`
- Grid origin Y: `70` (below HUD bar)
- Each tile is a Phaser.GameObjects.Sprite positioned at `(originX + col * tileSize + tileSize/2, originY + row * tileSize + tileSize/2)`
- Rotation applied via `sprite.setAngle(rotation * 90)`
- Tile sprites are interactive: `sprite.setInteractive()` with `pointerdown` listener

### 10.4 Electricity State Machine

```
States:
  IDLE       - Before stage starts (brief 500ms delay for grid appear animation)
  FLOWING    - Current advancing through connected tiles
  SPLIT      - Current has branched at T-junction (multiple heads tracked)
  DEAD_END   - Current hit dead end (trigger failure)
  COMPLETE   - Current reached bulb (trigger success)
  PAUSED     - Game paused (freeze all advancement)

Transitions:
  IDLE -> FLOWING: After grid appear animation completes
  FLOWING -> SPLIT: Current enters T-junction tile
  FLOWING -> DEAD_END: Current exits tile with no valid neighbor connection
  FLOWING -> COMPLETE: Current enters bulb tile
  SPLIT -> DEAD_END: Any branch hits dead end
  SPLIT -> COMPLETE: All branches reach bulbs
  ANY -> PAUSED: Pause button pressed
  PAUSED -> previous: Resume pressed
```

### 10.5 Tile Connection Data Structure

```javascript
// Each tile stores connections as [top, right, bottom, left] booleans
// Rotation shifts the array: 90deg CW = [left, top, right, bottom]
TILE_CONNECTIONS = {
  STRAIGHT: { 0: [false, true, false, true], 90: [true, false, true, false] },
  ELBOW:    { 0: [false, true, true, false], 90: [false, false, true, true],
              180: [true, false, false, true], 270: [true, true, false, false] },
  T_JUNC:   { 0: [false, true, true, true], 90: [true, false, true, true],
              180: [true, true, false, true], 270: [true, true, true, false] },
  CROSS:    { 0: [true, true, true, true] }
};
```

### 10.6 Edge Cases

- **Tile tapped while current is on it**: Allow rotation. If rotation disconnects the path behind the current, the current continues forward from its position (no retroactive death). If rotation creates a dead end ahead, current will hit it naturally.
- **Multiple rapid taps on same tile**: Debounce at 100ms. Queue rotations if tapped during rotation animation.
- **Current at T-junction with one branch already solved**: Track each branch head independently. Stage completes only when ALL branches reach valid endpoints (bulbs or each other via cross tiles).
- **Browser tab backgrounded**: Pause electricity advancement and countdown timer. Resume on focus.
- **Resize during gameplay**: Recalculate tile sizes and reposition all sprites. Electricity position recalculated relative to new grid coordinates.
- **Locked tile tapped**: Play "clunk" sound, shake tile 3px horizontally for 100ms, no rotation occurs.

### 10.7 Testing Checkpoints

1. **Boot**: All SVG textures load without "Texture key already in use" errors
2. **Menu**: Play, Help, Sound toggle all functional. High score displays from localStorage.
3. **Grid Generation**: Stages 1, 6, 11, 21, 31, 51 all generate valid grids with correct tile types per difficulty table
4. **Tile Rotation**: Tap rotates tile 90deg with animation. Double-tap rotates 180deg. Locked tiles reject input.
5. **Electricity Flow**: Current advances at correct speed. Follows connected path. Splits at T-junctions.
6. **Dead End Detection**: Current reaching unconnected edge triggers explosion + life loss
7. **Stage Clear**: Current reaching bulb triggers cascade + score + next stage
8. **Inactivity Death**: Idle player dies within 4 seconds on stage 1
9. **Death -> Restart**: Under 2 seconds from explosion to new grid playable
10. **Game Over Flow**: 3 lives lost -> game over screen -> play again returns to stage 1
11. **Pause/Resume**: All timers and electricity freeze on pause, resume correctly
12. **Orientation**: Portrait works, landscape shows rotate message
13. **High Score**: Persists across sessions via localStorage

### 10.8 Local Storage Schema

```json
{
  "circuit_reroute_high_score": 0,
  "circuit_reroute_games_played": 0,
  "circuit_reroute_highest_stage": 0,
  "circuit_reroute_best_streak": 0,
  "circuit_reroute_settings": {
    "sound": true
  }
}
```
