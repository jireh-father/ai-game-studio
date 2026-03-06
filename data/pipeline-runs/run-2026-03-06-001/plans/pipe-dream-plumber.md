# Game Design Document: Pipe Dream Plumber

**Slug**: `pipe-dream-plumber`
**One-Liner**: Route water through a house of increasingly insane plumbing before everything floods
**Core Mechanic**: Tap grid cells to place/rotate pipe segments while water is already flowing. Connect the source to the drain before the room floods. Special absurd pipes (toilet, coffee machine, goldfish bowl) add chaos. Water speed increases each stage.
**Target Session Length**: 1-3 minutes
**Date Created**: 2026-03-06
**Author**: Architect
**Creator**: oddball
**Validation Score**: 71.4 (brain track)

---

## 1. Overview

### 1.1 Concept Summary

Pipe Dream Plumber is a frantic puzzle-action game where you race to connect water pipes in a house full of increasingly absurd plumbing. Each stage presents a grid representing a room -- kitchen, bathroom, basement, attic. A water source sits on one side, a drain on the other. The twist: water starts flowing the MOMENT the stage begins. There is no planning phase. You are placing pipes with water already rushing toward you.

The humor is the star. Stage 1 connects a faucet to a sink -- normal enough. By stage 10, you are routing water from a goldfish bowl through a toilet, past a washing machine, into a shower head on the opposite side of the room. The pipe pieces themselves are absurd: the Coffee Pipe slows water to a drip (caffeine makes everything slow-motion, obviously), the Toilet Pipe reverses water direction (flush physics), and the Sprinkler Pipe splits one flow into two (lawn care gone wrong). Room descriptions pop up at stage start as one-line jokes: "The upstairs neighbor's aquarium is leaking into your kitchen. Again."

What differentiates this from Pipe Paradox (which focuses on rule mutations and abstract flow physics): Pipe Dream Plumber is about SPEED and HUMOR. There are no rule shifts. The rules are simple and consistent -- water flows through connected pipes. The challenge is pure speed: water is already moving, the grid is bigger, and the pipe pieces in your tray are increasingly weird. The comedy of connecting a toilet to a kitchen sink while water rushes toward you IS the game feel.

### 1.2 Target Audience

Casual mobile gamers aged 14-40 who play during commutes, breaks, or idle moments. Players who enjoy puzzle games with time pressure (Tetris, Pipe Mania, Mini Motorways). The humor and absurd plumbing scenarios appeal to a broad audience including non-gamers. Low skill floor (tap to place pipes) but high skill ceiling (speed, path optimization, special pipe exploitation).

### 1.3 Core Fantasy

You are an incompetent but determined plumber desperately trying to save a house from flooding. Every room is more ridiculous than the last. The fantasy is chaotic problem-solving under pressure -- the satisfaction of watching water flow through your hastily assembled pipe network, and the hilarious disaster when it all goes wrong. You are not a skilled engineer; you are a panicking idiot with a wrench, and that is what makes it fun.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 1-3 minutes |
| Day 1 Retention | 42%+ |
| Day 7 Retention | 20%+ |
| Average Stages per Session | 3-8 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop (10-Second Experience)

```
[Stage Start: Water Already Flowing!] --> [Frantically Place/Rotate Pipes]
       ^                                              |
       |                                    [Water Reaches Drain? = CLEAR!]
       |                                    [Water Hits Dead End? = FLOOD!]
       |                                              |
       |                              [Flood Reaches Ceiling = GAME OVER]
       |                                              |
       +--- [Next Stage (harder/funnier)] <-----------+
```

**Moment-to-moment**: The stage begins. Water is already flowing from the source. The player has a tray of 5 pipe pieces at the bottom of the screen. They tap a pipe in the tray to select it, then tap a grid cell to place it. Tapping an already-placed pipe rotates it 90 degrees. The water advances tile-by-tile through connected pipes. If water reaches a dead end (no connected pipe ahead), the room starts flooding from the bottom up. The flood fills the room in 15 seconds -- if it reaches the ceiling, game over. If the player successfully connects source to drain, the stage clears with a satisfying gush animation and a funny room description for the next stage.

**Decision density**: Every tap is a decision. Place THIS pipe HERE, or wait for a better piece? Rotate to connect left-right or top-bottom? Use the Coffee Pipe to buy time, or save it for a harder junction? The water is always advancing, so hesitation is death.

**Core action**: Tap to place pipe. Tap to rotate pipe. That is it. Two gestures, infinite depth.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Select Pipe | Tap (tray area) | Tap a pipe piece in the bottom tray to select it. Selected piece gets a white glow border. |
| Place Pipe | Tap (grid cell) | Tap an empty grid cell to place the currently selected pipe. Pipe appears with bounce animation. |
| Rotate Pipe | Tap (placed pipe) | Tap an already-placed pipe to rotate it 90 degrees clockwise. Quick mechanical click feel. |
| Remove Pipe | Double-tap (placed pipe) | Double-tap (300ms+ gap) to remove a pipe back to tray. Cannot remove pipes water has entered. |

**Control Philosophy**: All interactions are single-finger taps. No swipes, no drags, no holds. This keeps controls dead simple for the frantic pace. The two-step process (select from tray, then place on grid) prevents accidental placements.

**Touch Area Map**:
```
+-------------------------------+
| Score: 450   Stage 3   [||]  |  <- Top HUD bar (40px height)
+-------------------------------+
|                               |
|        GRID PLAY AREA         |  <- Main grid (variable size)
|     [Source] ... [Drain]      |  <- 60% of screen height
|                               |
|   [Furniture] [Pipes] [...]   |
|                               |
+-------------------------------+
| FLOOD WATER LEVEL (rises up)  |  <- Flood overlay (0-100% height)
+-------------------------------+
| [====Timer: 07s==========]   |  <- Timer bar (24px, shows water progress)
+-------------------------------+
|  [ | ] [_L_] [ T ] [+] [Mug] |  <- Pipe tray (90px height)
|   Str   Bend  Tee  Cross Cof |     5 slots, selected = white border
+-------------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Water reaches drain | 200 x stage_number | Pipes used <= optimal: 1.5x efficiency bonus |
| Pipe placed | 10 | None |
| Special pipe activated | 50 | None |
| Stage clear (all connected) | 500 x stage_number | Time bonus: +100 per second of water travel remaining |
| Speed bonus | 100 x seconds_early | Water reaches drain extra fast |
| No-flood clear | 300 | Stage completed with zero flooding |

**Combo System**: Consecutive no-flood stage clears build a streak counter. 2 clears = 1.5x, 4 clears = 2x, 6 clears = 3x (capped). Streak resets on any flood event. Visual: wrench icon with number badge pulses on increment.

**High Score**: Stored in localStorage as `pipe_dream_plumber_high_score`. Displayed on menu and game over. New high score triggers wrench-spin animation + "NEW RECORD!" bouncing text.

### 2.4 Stage Progression (Infinite)

Each stage = one room to plumb. Stage number determines grid size, water speed, source count, timer, and available special pipes.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-3 | Straight + L-bend pipes only. 4x4 grid. 1 source, 1 drain. Rooms: "Kitchen sink to dishwasher. Easy Monday." | 10s before flood kills, water speed 600ms/tile |
| 4-6 | T-junction pipe added. 1-2 furniture obstacles. | 5x5 grid. 9s flood timer. Water 550ms/tile. |
| 7-10 | Coffee Pipe (special). 5x5 grid. 2 sources, 2 drains. Rooms: "Goldfish bowl to shower. Do not ask." | 8s flood. Water 500ms/tile. 2-3 obstacles. |
| 11-15 | Toilet Pipe (reverses flow). Color-matching: blue source to blue drain. | 5x6 grid. 7s flood. Water 450ms/tile. 3-4 obstacles. |
| 16-20 | Sprinkler Pipe (splits flow). 3 sources, 3 drains. Rooms: "Aquarium to dishwasher to toilet to garden hose. Tuesday." | 6x6 grid. 6s flood. Water 400ms/tile. |
| 21-30 | All pipes. Cross-connections. Rooms get increasingly insane. | 6x7 grid. 5s flood. Water 350ms/tile. 5+ obstacles. |
| 31+ | Boss rooms every 10 stages with 4 sources. Random mix. Water speed capped at 300ms/tile. | 6x8 grid max. "The entire house is one pipe system. Godspeed." |

### 2.5 Lives and Failure

**Death Mechanic**: One flood = one game over. Maximum tension, minimum forgiveness.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Flood reaches ceiling (water level 100%) | Game over | Watch ad to drain flood 50% and continue (once per game) |
| Inactivity for 10 seconds (no taps) | Water speed doubles to 2x immediately | None (forces engagement) |
| Inactivity for 20 seconds total | Flood starts at 5x rate regardless of pipe state | Guaranteed death within 23s if idle |

**Inactivity Death Guarantee**: If the player does nothing from stage start: water flows at normal speed for 10s, then doubles. With 600ms/tile base speed on a 4x4 grid, water traverses ~6 tiles in 10s, hits a dead end (no pipes placed), flood starts. Flood fills in 15s at normal rate but 10s idle triggers 2x speed water which accelerates dead-end arrival. Complete idle player dies within 20-25 seconds on stage 1.

**Exploit Check -- Random Tapping**: If the player taps randomly, they place pipes in random cells with random rotations. On a 4x4 grid with 1 source and 1 drain, the probability of accidentally creating a valid 4+ tile connected path is approximately 0.3%. Random tapping will almost certainly create dead ends, triggering floods. The tray-then-grid two-step placement also means random taps alternate between tray selection and grid placement, halving effective placement rate. Random play is not viable -- the player must think about connections.

**Death to Restart**: Game over screen appears 800ms after flood reaches ceiling. Tap "Play Again" = new game in under 1.5 seconds total.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each stage generates a grid with guaranteed solvability. The generation algorithm places source(s) and drain(s), adds obstacles, then verifies at least one valid pipe path exists using BFS pathfinding.

**Generation Algorithm**:
```
Stage Generation Parameters:
- gridCols: min(4 + floor(stage / 3), 6)
- gridRows: min(4 + floor(stage / 4), 8)
- sourceCount: min(1 + floor(stage / 7), 3), max 4 on boss stages
- drainCount: equal to sourceCount
- obstacleCount: min(floor(stage / 3), 6)
- waterSpeed: max(300, 600 - stage * 10) ms per tile
- floodTimer: max(5, 11 - floor(stage / 3)) seconds before flood kills
- specialPipeChance: min(20 + stage * 2, 60)% of tray slots
- colorMatching: stage >= 11
- trayRefillDelay: max(0.8, 1.5 - stage * 0.03) seconds
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
    0    5    10    15    20    25    30    35+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-3 | Stage 4-6 | Stage 7-15 | Stage 16-30 | Stage 31+ |
|-----------|-----------|-----------|------------|-------------|-----------|
| Grid Size | 4x4 | 5x5 | 5x5 to 5x6 | 6x6 to 6x7 | 6x8 |
| Sources | 1 | 1 | 2 | 3 | 3-4 |
| Water Speed (ms/tile) | 600 | 550 | 450-500 | 350-400 | 300 |
| Flood Timer (s) | 10 | 9 | 7-8 | 5-6 | 5 |
| Obstacles | 0 | 1-2 | 2-3 | 4-5 | 6+ |
| Special Pipes | None | None | Coffee | Coffee+Toilet | All |
| Color Matching | No | No | No | Yes | Yes |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: After placing sources, drains, and obstacles, run BFS from each source to its matching drain. If no path exists with available pipe types, regenerate obstacle placement. Max 10 retries before reducing obstacles by 1.
2. **Source/Drain Placement**: Sources on left column or top row. Drains on right column or bottom row. Minimum Manhattan distance: grid_width + 2.
3. **Obstacle Placement**: Cannot be adjacent to sources or drains. Themed per room (fridge in kitchen, bathtub in bathroom, workbench in basement).
4. **Variety Threshold**: Consecutive stages must differ in at least 2 parameters (grid size, source count, obstacle layout, room theme).
5. **Rest Stages**: Every 5th stage (5, 10, 15...) is a "broom closet" -- 4x4 grid, 1 source, 12s timer. "Even plumbers need a break. This closet has ONE pipe to connect."
6. **Boss Stages**: Every 10th stage (10, 20, 30...) is a "whole house" -- max grid, 4 sources, 5s timer. 1000 bonus points. "The ENTIRE plumbing system. This is your final form."

### 3.4 Room Humor System

Each stage displays a one-line room description at stage start (1.5s overlay, then fades). Descriptions escalate in absurdity:

| Stage | Example Room Description |
|-------|------------------------|
| 1 | "Kitchen. Faucet to sink. You trained for this." |
| 3 | "Bathroom. Shower to drain. Still normal. Enjoy it while it lasts." |
| 7 | "Goldfish bowl to kitchen sink. The fish did not consent to this." |
| 11 | "Toilet to shower. Do NOT think about it." |
| 15 | "Aquarium to dishwasher. Your landlord has questions." |
| 20 | "Washing machine to swimming pool. This house makes no sense." |
| 25 | "Toilet to kitchen faucet. Health code violations: 47." |
| 30+ | "The architect was clearly on something. Connect everything to everything." |

### 3.5 Pipe Types

**Standard Pipes**:

| Pipe Type | Connections | Rotation States |
|-----------|-------------|-----------------|
| Straight | 2 opposite sides | 2 (horizontal, vertical) |
| L-Bend | 2 adjacent sides | 4 (BR, BL, TL, TR) |
| T-Junction | 3 sides | 4 (no-top, no-right, no-bottom, no-left) |
| Cross | All 4 sides | 1 (symmetric) |

**Special Pipes**:

| Pipe Type | Behavior | Visual | Unlock |
|-----------|----------|--------|--------|
| Coffee Pipe | Water moves at 0.5x speed for 2 tiles after exit | Brown pipe with coffee mug, steam particles | Stage 7 |
| Toilet Pipe | Reverses water flow direction (enters and exits same side -- bounces back) | White porcelain with flush handle | Stage 11 |
| Sprinkler Pipe | Splits single flow into 2 outputs. Max 2 per stage. | Green pipe with sprinkler head, droplet particles | Stage 16 |

**Connection Rules**:
- Pipe connects to adjacent cell if both have openings facing each other.
- Water flows from entry opening to all other openings of that pipe.
- Dead end (no connected pipe ahead) triggers flood.
- Cross pipe allows two independent flows to cross without mixing (critical for color-matching).

**Pipe Tray**:
- 5 pipe slots at screen bottom.
- Random assortment weighted by stage: early = mostly straight/L-bend, late = more special pipes.
- Placed pipe slot refills after `trayRefillDelay` seconds (1.5s at stage 1, decreasing).

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Chunky cartoon cross-section house view. Think "Where's Waldo" house cutaway meets plumbing chaos. Thick outlines (3px), bold colors, exaggerated proportions. Pipes are oversized and colorful. Rooms have recognizable but simplified details (tiles, appliances). Flood water is vivid blue that dramatically overtakes the screen.

**Aesthetic Keywords**: Chunky, Colorful, Chaotic, Cartoon, Slapstick

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Pipe Metal | Silver-Gray | #B0BEC5 | Standard pipe body |
| Pipe Outline | Dark Gray | #37474F | Pipe outlines, grid lines |
| Background (Kitchen) | Warm Cream | #FFF8E1 | Kitchen rooms |
| Background (Bathroom) | Light Cyan | #E0F7FA | Bathroom rooms |
| Background (Basement) | Cool Gray | #ECEFF1 | Basement rooms |
| Water | Bright Blue | #4FC3F7 | Water flow, flood fill |
| Danger/Flood | Red | #EF5350 | Flood warning, dead end flash |
| Success | Green | #66BB6A | Connected drain, stage clear |
| UI Text | Dark Navy | #1A237E | Score, stage, timer |
| UI Background | White | #FFFFFF | Menu backgrounds, overlays |
| Accent/Gold | Amber | #FFB300 | High score, streak, specials |
| Tray Background | Light Blue-Gray | #CFD8DC | Pipe tray area |
| Obstacle | Warm Brown | #8D6E63 | Furniture obstacles |
| Coffee Pipe | Brown | #795548 | Coffee pipe body |
| Toilet Pipe | Porcelain | #FAFAFA | Toilet pipe body |
| Sprinkler Pipe | Garden Green | #4CAF50 | Sprinkler pipe body |

### 4.3 SVG Specifications

All SVGs defined as strings in config.js, registered as base64 textures in BootScene.

**Straight Pipe (Horizontal)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect x="0" y="16" width="48" height="16" fill="#B0BEC5" stroke="#37474F" stroke-width="2" rx="2"/>
  <rect x="0" y="20" width="48" height="8" fill="#90A4AE" opacity="0.5"/>
</svg>
```

**L-Bend Pipe (Bottom-Right)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <path d="M24,48 L24,24 L48,24" fill="none" stroke="#B0BEC5" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M24,48 L24,24 L48,24" fill="none" stroke="#37474F" stroke-width="18" fill="none" opacity="0.2" stroke-linecap="round"/>
</svg>
```

**T-Junction Pipe (No-Top)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect x="0" y="16" width="48" height="16" fill="#B0BEC5" stroke="#37474F" stroke-width="2"/>
  <rect x="16" y="16" width="16" height="32" fill="#B0BEC5" stroke="#37474F" stroke-width="2"/>
</svg>
```

**Cross Pipe**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect x="0" y="16" width="48" height="16" fill="#B0BEC5" stroke="#37474F" stroke-width="2"/>
  <rect x="16" y="0" width="16" height="48" fill="#B0BEC5" stroke="#37474F" stroke-width="2"/>
</svg>
```

**Coffee Pipe**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect x="0" y="16" width="48" height="16" fill="#795548" stroke="#37474F" stroke-width="2" rx="2"/>
  <ellipse cx="24" cy="12" rx="6" ry="4" fill="#8D6E63"/>
  <path d="M20,12 Q24,4 28,12" fill="none" stroke="#BCAAA4" stroke-width="1.5" opacity="0.7"/>
</svg>
```

**Toilet Pipe**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect x="0" y="16" width="48" height="16" fill="#FAFAFA" stroke="#37474F" stroke-width="2" rx="4"/>
  <ellipse cx="24" cy="24" rx="10" ry="7" fill="#E0E0E0" stroke="#37474F" stroke-width="1"/>
  <rect x="22" y="10" width="4" height="8" fill="#90A4AE" rx="1"/>
</svg>
```

**Sprinkler Pipe**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect x="0" y="20" width="48" height="12" fill="#4CAF50" stroke="#37474F" stroke-width="2" rx="2"/>
  <circle cx="24" cy="14" r="5" fill="#66BB6A" stroke="#37474F" stroke-width="1.5"/>
  <line x1="24" y1="9" x2="20" y2="4" stroke="#4FC3F7" stroke-width="1.5"/>
  <line x1="24" y1="9" x2="28" y2="4" stroke="#4FC3F7" stroke-width="1.5"/>
</svg>
```

**Water Source**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect x="0" y="8" width="20" height="32" fill="#1565C0" stroke="#37474F" stroke-width="2" rx="3"/>
  <polygon points="20,16 32,24 20,32" fill="#4FC3F7"/>
</svg>
```

**Drain**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect x="28" y="8" width="20" height="32" fill="#37474F" stroke="#263238" stroke-width="2" rx="3"/>
  <circle cx="38" cy="24" r="6" fill="#263238"/>
  <path d="M35,21 Q38,24 35,27 M38,20 Q41,24 38,28" fill="none" stroke="#546E7A" stroke-width="1"/>
</svg>
```

**Furniture Obstacle**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect x="4" y="4" width="40" height="40" fill="#8D6E63" stroke="#5D4037" stroke-width="2" rx="4"/>
  <line x1="12" y1="4" x2="12" y2="44" stroke="#5D4037" stroke-width="1" opacity="0.3"/>
  <line x1="36" y1="4" x2="36" y2="44" stroke="#5D4037" stroke-width="1" opacity="0.3"/>
</svg>
```

**Design Constraints**:
- All SVG elements use basic shapes only (rect, circle, ellipse, line, path, polygon)
- Maximum 8 elements per SVG
- Grid cell size: 48x48px base, scaled to fit screen width
- Pipe rotation handled by Phaser `setAngle()` -- one SVG per pipe type

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Water fill | Water enters pipe | Blue rect grows inside pipe from entry to exit, 200ms tween with sine wobble (2px, 3Hz) |
| Flood rise | Dead end hit | Blue semi-transparent rect rises from screen bottom with floating furniture debris (small brown rects bobbing) |
| Pipe place | Place on grid | Scale from 0.5 to 1.0 over 100ms with bounce ease |
| Pipe rotate | Tap to rotate | 90deg rotation tween, 150ms, slight overshoot + settle |
| Stage clear | All drains connected | Green flash on connected pipes (300ms), white screen flash (100ms), confetti burst (20 particles) |
| Dead end splash | Water hits dead end | 8 blue circle particles burst radially, lifespan 400ms, gravity pull down |
| Source pulse | Continuous | Source icon pulses scale 1.0-1.15 at 2Hz, faster at <3s |
| Timer urgency | Timer < 3s | Timer text turns red, shakes 2px at 4Hz |
| Room description | Stage start | Text slides in from top, holds 1.5s, fades out 300ms. White on semi-transparent black bar. |
| Coffee slow | Water enters coffee pipe | 3 white steam circle particles rise, 500ms lifespan |
| Toilet reverse | Water enters toilet pipe | Blue swirl particle rotation effect + flush sound |
| Sprinkler split | Water enters sprinkler | 4 blue droplet particles spray upward, 300ms |

---

## 5. Audio Design

### 5.1 Sound Effects

All sounds procedurally generated via Web Audio API oscillators (no external audio files).

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Pipe place | Metallic clank -- short noise burst, mid frequency | 80ms | High |
| Pipe rotate | Mechanical click -- short square wave pop | 60ms | Medium |
| Pipe remove | Reverse clank -- descending pitch | 100ms | Medium |
| Water flow (per tile) | Gurgle -- low sine wave with tremolo | 150ms | Low |
| Water reach drain | Satisfying drain swoosh -- descending sine sweep | 300ms | High |
| Dead end splash | Splash -- white noise burst with LP filter | 200ms | High |
| Flood rising | Continuous low rumble -- brown noise, fades in | Looping | Medium |
| Flood warning | Alarm beep -- square wave 800Hz, 2Hz pulse | Looping | High |
| Stage clear | Ascending chime -- 3-note major arpeggio (C-E-G) | 500ms | High |
| Game over | Descending sad trombone -- 3-note descending minor | 800ms | High |
| Timer tick (<3s) | Very short click at 1kHz | 30ms | Medium |
| Coffee pipe | Bubbly gurgle -- sine tremolo, low pitch | 200ms | Low |
| Toilet pipe | Flush whoosh -- descending noise sweep | 300ms | Medium |
| Sprinkler pipe | Spray hiss -- HP filtered noise | 200ms | Low |
| UI button press | Soft click -- sine blip 600Hz | 50ms | Low |
| New high score | Victory jingle -- 5-note ascending fanfare | 1000ms | High |

### 5.2 Music Concept

No background music. The game's audio landscape is built from water sounds, pipe clinks, and flood rumbles that create an emergent soundscape intensifying with danger. The rising flood sound IS the music -- it gets louder and more urgent as the water level climbs. This keeps JS budget tight and avoids audio library dependencies.

---

## 6. UI/UX

### 6.1 Screen Flow

```
+------------+     +------------+     +------------+
|   Boot     |---->|   Menu     |---->|   Game     |
|   Scene    |     |   Scene    |     |   Scene    |
+------------+     +-----+------+     +------+-----+
                     |   |                   |
                +----+   +----+         +----+----+
                |             |         |  Pause  |-->+----------+
           +----+----+  +----+----+    | Overlay |   |  Help    |
           |  Help   |  |Settings |    +----+----+   |How 2 Play|
           |Overlay  |  | Overlay |         |        +----------+
           +---------+  +---------+    +----+----+
                                       |  Game   |
                                       |  Over   |
                                       | Overlay |
                                       +----+----+
                                            |
                                       +----+----+
                                       | Ad/     |
                                       |Continue |
                                       +---------+
```

### 6.2 HUD Layout

```
+-------------------------------+
| Score: 1250   Stage 5   [||] |  <- Top bar (40px, dark overlay)
+-------------------------------+
|  [S]->  [ ][ ][ ][ ]         |
|         [ ][ ][X][ ]         |  <- Grid (centered, variable size)
|         [ ][ ][ ][ ]  ->[D]  |     X = furniture obstacle
|         [ ][ ][ ][ ]         |     S = source, D = drain
+-------------------------------+
|  ~~~~ FLOOD LEVEL ~~~~        |  <- Flood overlay (rises from bottom)
+-------------------------------+
| [====Water Progress Bar====] |  <- Timer/progress bar (24px)
+-------------------------------+
| [ | ] [_L_] [ T ] [+] [Mug]  |  <- Pipe tray (90px height)
|  Str   Bend  Tee Cross Coffee |     Selected = white border glow
+-------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left (x:10, y:10) | Current score, 22px bold white text with shadow | Every score event |
| Stage | Top-center | "Stage N" 18px white | On stage transition |
| Pause | Top-right (x:width-50, y:10) | "||" icon, 40x40px | Always visible |
| Timer/Progress Bar | Below grid, full width | Green-to-red gradient bar showing water progress | Every 100ms |
| Pipe Tray | Bottom 90px | 5 pipe slots, 56x56px each, centered | On pipe place/refill |
| Flood Level | Full screen overlay from bottom | Semi-transparent blue (#4FC3F7 at 60% opacity) | Every 100ms during flood |
| Streak Counter | Top-right below pause | Wrench icon + number, 16px amber | On streak change |
| Room Description | Center screen overlay | Funny one-liner, 16px white on dark bar | Stage start only (1.5s) |

### 6.3 Menu Structure

**Main Menu (MenuScene)**:
- Game title "PIPE DREAM PLUMBER" (bold, 28px, #1A237E, with dripping water animation on letters)
- Subtitle "The house is flooding. Again." (14px, #4FC3F7)
- **PLAY** button (200x60px, green #66BB6A, centered)
- **"?" Help** button (circle, 50x50px, top-right, #FFB300)
- **High Score** display (trophy icon + score, below play button, 16px gold)
- **Sound toggle** (speaker icon, top-left, 40x40px)

**Pause Overlay** (semi-transparent black at 60% opacity):
- **Resume** (180x50px, green)
- **How to Play** (180x50px, amber)
- **Restart** (180x50px, gray)
- **Quit to Menu** (180x50px, red)

**Game Over Screen** (overlay):
- "FLOODED!" title (36px, red, with shake animation)
- Final Score (44px, amber, scale-in over 300ms)
- "NEW RECORD!" if applicable (bouncing amber text)
- Stage Reached (20px, white)
- **"Watch Ad to Drain 50%"** button (200x50px, blue) -- once per game
- **"Play Again"** button (200x50px, green)
- **"Menu"** button (140x40px, gray)

**Help / How to Play** (overlay, accessible from menu and pause):
- Title: "HOW TO PLAY" (24px, #1A237E)
- **Section 1**: SVG illustration of finger tapping tray then grid cell. "Tap a pipe, then tap a cell to place it."
- **Section 2**: SVG of pipe rotating with curved arrow. "Tap a placed pipe to rotate it."
- **Section 3**: SVG of source -> 3 pipes -> drain with blue water. "Connect source to drain before water floods!"
- **Section 4**: Three small SVG icons (coffee/toilet/sprinkler) with one-line humor descriptions.
- **Rules**: "Water starts flowing IMMEDIATELY. Dead ends cause floods. Room floods = Game Over."
- **Tips**: "Build from drain backward." / "Coffee pipes near the source buy time." / "Do not panic. Actually, do panic."
- **"Got it!"** button (180x50px, green)
- Scrollable if needed

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Drain flood 50% (continue) | Every game over (once per game) | Always (optional) |
| Rewarded | Double final score | Game over screen | Always (optional) |

**Note**: POC stage -- ad hooks are placeholder functions only. No actual ad SDK integrated.

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Flood Drain | Watch ad after game over | Flood level reduced 50%, resume play | Once per game |
| Score Double | Watch ad on game over | Final score x2 | Once per session |

### 7.3 Session Economy

```
[Play Free] --> [Flood = Death] --> [Rewarded Ad: Drain 50%?]
                                         | Yes --> [Resume playing]
                                         | No  --> [Game Over Screen]
                                                        |
                                                  [Interstitial (every 3rd)]
                                                        |
                                                  [Rewarded: Double Score?]
                                                        | Yes --> [Score doubled]
                                                        | No  --> [Play Again / Menu]
```

---

## 8. Retention System

### 8.1 Meta Progression

**Plumber Rank**: Total lifetime score accumulates into a rank system displayed on the menu screen. Ranks provide cosmetic bragging rights and unlock increasingly absurd room description pools.

| Rank | Total Score Required | Title | Unlock |
|------|---------------------|-------|--------|
| 1 | 0 | Apprentice Plumber | Base game |
| 2 | 5,000 | Journeyman Plumber | Funnier room descriptions pool 2 |
| 3 | 20,000 | Master Plumber | Room descriptions pool 3 (absurd tier) |
| 4 | 50,000 | Pipe Wizard | Gold pipe color variant |
| 5 | 100,000 | Pipe Dream Legend | Rainbow water effect (cosmetic) |

**Stage Record Board**: Highest stage reached is tracked and displayed on the menu. Beating your own record triggers a special animation. This creates a persistent "beat my best" motivation beyond score.

### 8.2 Daily Hook

**Daily Plumbing Challenge**: Each day (based on local date), a specific seed generates a fixed sequence of 5 stages with predetermined grid layouts, obstacles, and pipe trays. All players get the same challenge. The player's best score on the daily challenge is stored separately.

- Displayed on menu as "TODAY'S CHALLENGE" button (appears after first game completion)
- Fixed 5-stage run with curated room descriptions
- Separate high score: "Daily Best: {score}"
- Resets at midnight local time
- Creates "I need to beat yesterday's score" loop

### 8.3 Social Mechanic

**Score Screenshot**: Game over screen includes a "Share" button that captures a styled screenshot of the score + stage + rank + funniest room description encountered. The screenshot is designed to be shareable (includes game title, score, room quote). Uses Canvas API to render a share-ready image.

**Room Quote Collection**: Each unique room description seen is logged in localStorage. Menu shows "Rooms Discovered: X / Y" counter. Completionists will replay to see all humor text, especially higher-stage absurd descriptions they have not reached yet.

---

## 9. Juice Specification

### 9.1 Player Input Feedback (applied to every tap)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Tapped grid cell | Count: 6, Direction: radial outward, Color: #B0BEC5, Lifespan: 300ms, Size: 3px circles |
| Scale punch | Placed/rotated pipe | Scale: 1.25x, Recovery: 100ms, Ease: bounce |
| Sound | -- | Place: metallic clank (noise burst 200Hz-2kHz, 80ms). Rotate: click (square wave 800Hz, 60ms) |
| Haptic | Device | navigator.vibrate(20) on place, navigator.vibrate(10) on rotate |

### 9.2 Core Action Feedback: Pipe Placement (most frequent)

| Effect | Values |
|--------|--------|
| Particles | 6 gray sparks on place. When water enters: 4 blue droplets at entry point, lifespan 300ms |
| Scale punch | Pipe: 1.25x for 100ms. Adjacent connected pipes: 1.08x sympathetic pulse for 80ms |
| Connection flash | When pipe connects to adjacent pipe: both pipes flash white (#FFFFFF at 40%) for 150ms |
| Sound escalation | Place pitch increases +5% per consecutive rapid placement (resets after 1s gap) |
| Grid highlight | Valid cells glow faintly (#E8F5E9) when pipe selected, 200ms fade-in |

### 9.3 Water Flow Feedback (continuous)

| Effect | Values |
|--------|--------|
| Water fill animation | Blue rect grows inside pipe from entry to exit over 200ms. Sine wobble: 2px amplitude, 3Hz |
| Flow particles | 2 small blue circles trail behind water front, lifespan 200ms, size 3px |
| Drain connection | Green flash (tint 0x66BB6A, 300ms), 12 green particles burst radially, drain gulps (scale 1.3x, 150ms) |
| Sound | Per-tile gurgle: sine 120Hz with 8Hz tremolo, 150ms. Pitch +2% per tile in current path |

### 9.4 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 10px, Duration: 400ms, Decay: linear |
| Red flash | Full screen #EF5350 at 30% opacity, flashes 3x over 600ms |
| Flood surge | Flood level jumps +10% instantly on dead end, then resumes 5%/s |
| Sound | Dead end: splash (white noise, 200ms). Game over: sad descending 3-note (400->300->200Hz, 800ms) |
| Haptic | navigator.vibrate([50, 30, 100]) on game over |
| Effect to UI delay | 800ms after flood reaches 100% before game over overlay |
| Death to restart | **Under 2 seconds**: 800ms death + 200ms fade + tap Play Again = 700ms transition |

### 9.5 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+N", Color: #FFB300 (amber), Size: 22px bold, Movement: up 60px over 600ms, Fade: alpha 1.0->0.0 |
| Score HUD punch | Scale 1.3x, Recovery: 150ms, Ease: bounce |
| Stage clear | Connected pipes flash green (300ms). White screen flash (100ms). "+STAGE BONUS" float (28px, #66BB6A). 20 confetti particles (multi-color 4px squares, 800ms lifespan, gravity fall). 500ms delay before next stage. |
| Streak text | "STREAK x{N}!" center screen, 32px, #FFB300, scale 0->1.2->1.0 over 400ms, hold 600ms, fade 300ms |
| No-flood bonus | "CLEAN RUN! +300" text, 24px, #66BB6A, same float behavior |

### 9.6 Special Pipe Activation Effects

| Pipe | Effect | Values |
|------|--------|--------|
| Coffee | Steam particles | 3 white circles (4px), rise 30px, lifespan 500ms. Water tints brown (#795548 at 20%) for 2 tiles. |
| Toilet | Swirl + reverse | Blue rotating circle (12px, 360deg/300ms). Water reverses direction. Flush sound. Screen shake 3px, 150ms. |
| Sprinkler | Spray burst | 4 blue droplets (3px) spray upward 20px, 300ms. Flow splits into 2 with brief white flash at junction. |

---

## 10. Technical Architecture

### 10.1 File Structure and Budget

```
games/pipe-dream-plumber/
+-- index.html              # Entry point (~20 lines)
+-- style.css               # Responsive styles (~30 lines)
+-- config.js               # Constants, colors, SVG strings, difficulty tables (~80 lines)
+-- main.js                 # BootScene, Phaser init, GameState, localStorage (~55 lines)
+-- game.js                 # GameScene: grid, pipe placement, water flow, input, flood (~280 lines)
+-- stages.js               # Grid generation, BFS solvability, difficulty, tray logic (~80 lines)
+-- ui.js                   # MenuScene, HelpOverlay, HUD, PauseOverlay, GameOverOverlay (~250 lines)
+-- ads.js                  # Ad placeholder hooks, reward callbacks (~40 lines)
```

**Script load order in index.html**: config.js -> stages.js -> ads.js -> ui.js -> game.js -> main.js (LAST)

### 10.2 Module Responsibilities

**config.js** (~80 lines):
- `COLORS` object: all hex color constants from palette
- `DIFFICULTY` table: stage-indexed parameters (grid size, timer, water speed, source count, obstacles)
- `PIPE_TYPES` enum: STRAIGHT, L_BEND, T_JUNCTION, CROSS, COFFEE, TOILET, SPRINKLER
- `PIPE_CONNECTIONS` map: per pipe type and rotation, which sides have openings (bitmask: TOP=1, RIGHT=2, BOTTOM=4, LEFT=8)
- `SCORING` object: point values for all score events
- `SVG_STRINGS` object: all SVG markup strings
- `ROOMS` array: room description strings by stage range
- `GAME_CONFIG`: canvas base (390x640), flood rate (5%/s = 0.05), inactivity timeout (10000ms), tray size (5)

**main.js** (~55 lines):
- `BootScene`: reads CONFIG.SVG_STRINGS, calls `textures.addBase64()` once per texture, starts MenuScene on complete
- Phaser.Game config: type AUTO, scale FIT, parent 'game-container', scenes [BootScene, MenuScene, GameScene, UIScene]
- `GameState` global: `{ score, highScore, stage, streak, floodLevel, gamesPlayed, totalScore, rank, dailySeed, settings }`
- localStorage read/write helpers: `saveState()`, `loadState()`
- Orientation/visibility change handlers

**game.js** (~280 lines):
- `GameScene` extends Phaser.Scene
- `create()`: init grid via stages.js, place sources/drains/obstacles, create pipe tray, start water flow immediately, init flood state, setup input, launch UIScene parallel
- `update(time, delta)`: advance water flow, update flood level, check win/lose, check inactivity timeout
- `handleCellTap(row, col)`: if empty + pipe selected -> place; if has pipe -> rotate; if double-tap -> remove
- `handleTrayTap(index)`: select pipe, highlight
- `advanceWater()`: process flow fronts tile-by-tile. BFS through connected pipes. Dead end -> triggerFlood()
- `checkConnection(row, col, entryDir)`: validate pipe opening matches entry direction
- `triggerFlood(row, col)`: start flood, splash particles, flood rise begins
- `updateFlood(delta)`: increase flood level at 5%/s (or 2x if inactivity), check game over at 100%
- `clearStage()`: all drains connected -> score calc -> next stage transition
- `gameOver()`: death effects -> event to UIScene
- `resetInactivityTimer()`: called on every tap
- Grid state: 2D array `grid[row][col] = { pipeType, rotation, hasWater, waterColor, isSource, isDrain, isObstacle }`

**stages.js** (~80 lines):
- `generateStage(stageNumber)`: returns `{ gridCols, gridRows, sources[], drains[], obstacles[], waterSpeed, floodTimer, specialPipesEnabled, roomDescription }`
- `placeSources(cols, rows, count)`: edge positions
- `placeDrains(cols, rows, count, sources)`: opposite edge, min Manhattan distance
- `placeObstacles(cols, rows, count, sources, drains)`: random non-adjacent to source/drain
- `validateSolvability(grid, sources, drains)`: BFS returns boolean
- `generateTray(stageNumber)`: returns array of 5 pipe types, weighted by stage
- `getRoomDescription(stageNumber)`: returns funny one-liner from ROOMS array
- `isRestStage(n)`, `isBossStage(n)`: multiples of 5 and 10

**ui.js** (~250 lines):
- `MenuScene` extends Phaser.Scene: title, play button, help button, high score, sound toggle, rank display, daily challenge button
- `UIScene` extends Phaser.Scene: launched parallel to GameScene
  - HUD: score text, stage text, pause button, timer bar, streak counter
  - Room description overlay (1.5s at stage start)
  - Pause overlay: resume, help, restart, quit
  - Help overlay: illustrated how-to-play with pipe SVG diagrams
  - Game over overlay: score, high score, stage, continue/play-again/menu buttons
  - `updateHUD(gameState)`: called via Phaser events from GameScene
  - `showGameOver(finalScore, stage)`: animated game over display
- Button factory: `createButton(scene, x, y, w, h, text, color, callback)`

**ads.js** (~40 lines):
- `AdManager` object with placeholder methods
- `showInterstitial(callback)`: calls callback immediately (stub)
- `showRewarded(onReward, onSkip)`: calls onReward immediately (testing stub)
- `shouldShowInterstitial()`: returns true every 3rd game over
- `canContinue()`: returns true if not yet used this game
- Track state: `gameOverCount`, `continueUsed`

### 10.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | 3.80+ | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No other dependencies. Audio via Web Audio API (built into Phaser).

### 10.4 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser pointer system for unified touch/mouse
- **Prevent Default**: CSS `touch-action: none`, `overscroll-behavior: none`
- **Orientation**: Portrait lock. Landscape shows "Please rotate" overlay.
- **Grid Cell Sizing**: `cellSize = Math.min(Math.floor((screenWidth - 20) / gridCols), Math.floor((screenHeight - 240) / gridRows), 60)`. Minimum 36px (44px tap target with padding).
- **Safe Areas**: CSS `env(safe-area-inset-*)` for notch devices
- **Visibility**: Pause game on `visibilitychange`. Resume with pause overlay on return.
- **Object Pooling**: Reuse flow particle sprites. Max 20 active particles.

### 10.5 Grid and Flow Implementation

- Grid stored as 2D array: `grid[row][col] = { pipeType, rotation, hasWater, waterColor, isSource, isDrain, isObstacle }`
- Pipe connections encoded as bitmask: TOP=1, RIGHT=2, BOTTOM=4, LEFT=8. Straight-H=10, L-bend-BR=6. Rotation shifts bits.
- Connection check: `grid[r][c].connections & dirBit !== 0 AND grid[r+dr][c+dc].connections & oppositeBit !== 0`
- Flow fronts array: `[{ row, col, entryDir, color, speed, coffeeSlowRemaining }]`
- Each frame: accumulate delta per front. When >= waterSpeed, advance to next tile.
- Multiple fronts process independently. Sprinkler creates 2 new fronts.
- Flow front removed on: drain reached (success), dead end (flood), or loop (already-watered same-source cell).

### 10.6 Critical Implementation Patterns

1. **Texture registration**: ALL SVGs in BootScene via `addBase64()` ONCE. Rotations via `setAngle()`.
2. **Script load order**: main.js LAST. References MenuScene, GameScene, UIScene defined in ui.js and game.js.
3. **Parallel UIScene**: Communication via Phaser events. All event handlers null-guarded.
4. **HUD init from state**: Score text initialized as `GameState.score`, not literal '0'.
5. **No physics engine**: Pure grid-based. No Matter.js. No `Body.setStatic()` pitfalls.
6. **Inactivity detection**: Track `lastInputTime` in `update()`. If gap > 10s, water speed 2x. If > 20s, flood rate 5x.
7. **Game over -> restart**: `scene.restart()` reinitializes all state. Total time < 2s.

### 10.7 Edge Cases

| Edge Case | Handling |
|-----------|---------|
| Resize/orientation | Recalculate cellSize, reposition grid/HUD/tray. Pause during transition. |
| Tab hidden during flow | Pause water flow and flood timer. Resume on visibility with pause overlay. |
| Rapid double-tap grid | First tap = place, second (within 300ms) = rotate not remove. Remove needs 300ms+ gap. |
| Place pipe on watered cell | Blocked if water already in cell. Cell flashes red 100ms. |
| Remove pipe with water | Blocked. Pipe shakes 3px for 100ms (rejection). |
| Tray empty | Player waits for refill. Slots show circular loading indicator. |
| All sources connected mid-flood | Flood stops immediately. Water drains at 10%/s. Stage clear. |
| Sprinkler max (2 exist) | Sprinkler in tray shows red X. Tap shows "MAX 2" toast (18px, red, 800ms). |
| Color mismatch at drain (stage 11+) | Water rejected. Splash in water color. Drain flashes red. Front continues looking for path. |
| localStorage unavailable | Graceful degrade. High score/settings not persisted. Game fully playable. |

### 10.8 Testing Checkpoints

1. **Boot + Menu**: BootScene loads all SVG textures. Menu shows title, play, help, high score. All tappable.
2. **Grid Generation**: Stage 1 = 4x4, 1 source (left), 1 drain (right), 0 obstacles.
3. **Pipe Placement**: Select from tray, place on cell, rotate by tapping. Remove by double-tap. Selected = white glow.
4. **Water Flow**: Water advances tile-by-tile immediately on stage start. Visual fill animation. Reaches drain = clear.
5. **Dead End / Flood**: Dead end triggers flood. Blue water rises. Ceiling = game over. ~15s for full flood.
6. **Special Pipes**: Coffee slows water. Toilet reverses. Sprinkler splits. All visually distinct.
7. **Inactivity Death**: No taps 10s = 2x water speed. No taps 20s = 5x flood. Death within 25s guaranteed.
8. **Stage Progression**: Grid grows, water speeds up, special pipes unlock at correct stages.
9. **Game Over -> Restart**: Under 2 seconds. High score persists. Streak resets.
10. **Room Descriptions**: Funny one-liner displays at stage start. Different each stage.
11. **Help Screen**: Accessible from menu and pause. Illustrations render. "Got it!" returns.
12. **Mobile Portrait**: Fits 360x640. All targets >= 44px. No overflow.

### 10.9 Local Storage Schema

```json
{
  "pipe_dream_plumber_high_score": 0,
  "pipe_dream_plumber_games_played": 0,
  "pipe_dream_plumber_highest_stage": 0,
  "pipe_dream_plumber_total_score": 0,
  "pipe_dream_plumber_best_streak": 0,
  "pipe_dream_plumber_rank": 1,
  "pipe_dream_plumber_rooms_seen": [],
  "pipe_dream_plumber_daily_best": 0,
  "pipe_dream_plumber_daily_date": "",
  "pipe_dream_plumber_settings": {
    "sound": true,
    "vibration": true
  }
}
```
