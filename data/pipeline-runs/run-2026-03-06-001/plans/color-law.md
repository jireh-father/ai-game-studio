# Game Design Document: Color Law

**Slug**: `color-law`
**One-Liner**: Sort colors into zones -- but the sorting RULES change mid-puzzle and you must adapt instantly.
**Core Mechanic**: Colored shapes fall into a staging area. Swipe them into sorting zones. The current LAW dictates which shapes go where. Laws rotate every N shapes, and shapes already placed that violate the new law explode. Anticipate, adapt, survive.
**Target Session Length**: 2-5 minutes
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Color Law is a fast-paced sorting puzzle where players swipe colored shapes into designated zones based on the current "law" -- a rule that dictates where each shape belongs. The twist: the law changes every few shapes, and any previously placed shapes that now violate the new law explode, costing the player penalty points toward game over.

The core tension comes from the split-second decision making. Do you place the red circle in the left zone because the current law says "Red goes LEFT"? Or do you notice the next law preview says "Circles go TOP" and hold it in the staging area a moment longer? This creates a constant push-pull between speed (shapes pile up and overflow if you wait) and anticipation (placing shapes that will survive the next law change).

The game starts simple with color-only laws and 3 zones, then escalates by introducing shape-based laws, size-based laws, compound laws, more zones, and faster law rotation. The cognitive load ramps beautifully -- players feel like genius judges at first, then scramble like overwhelmed bureaucrats by stage 20.

### 1.2 Target Audience

Casual mobile gamers aged 14-45 who enjoy quick-reflex puzzle games. Perfect for short sessions during commutes, waiting rooms, or breaks. Appeals to players who like pattern recognition and mental agility challenges (fans of games like Fruit Sort, Color Switch, or brain-training apps). Low skill floor (swipe shapes into zones) but high skill ceiling (law anticipation, zone optimization).

### 1.3 Core Fantasy

You are a cosmic judge enforcing ever-changing laws of color and form. The universe sends shapes your way, and you must sort them according to the current decree. But the laws are fickle -- they shift without warning, and past judgments may suddenly become violations. You are the last line of order in a chaotic, shape-filled world.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 2-5 minutes |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 22%+ |
| Average Laws Survived per Session | 5-12 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Shape Appears in Staging] --> [Read Current Law] --> [Swipe Shape to Zone]
         ^                                                    |
         |                                              [Score Points]
         |                                                    |
         |                                          [Law Change Check]
         |                                                    |
         |                                     [Violations Explode (penalty)]
         |                                                    |
         +-------- [New Shape Spawns] <-----------------------+
                          |
                   [5 Explosions = Game Over]
                   [Staging Overflow = Game Over]
```

**Moment-to-moment gameplay:**
1. A colored shape appears in the staging area at the bottom of the screen.
2. The player reads the current law displayed at the top (e.g., "RED -> LEFT, BLUE -> RIGHT, GREEN -> CENTER").
3. The player swipes the shape toward the correct zone.
4. The shape lands in the zone. If correct per current law, +10 points. If wrong, immediate explosion (+1 penalty).
5. After every N shapes placed (starts at 8, decreases over time), the law changes.
6. When the law changes, ALL shapes already in zones are re-evaluated against the new law. Any violations explode simultaneously.
7. The player earns anticipation bonus points for shapes that survive a law change.
8. New shapes keep spawning. If 4+ shapes pile up in the staging area, the bottom shape falls off (overflow death penalty).
9. 5 total explosions = game over.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Sort Shape | Swipe (any direction) | Swipe a shape from the staging area toward a zone. The shape flies to the nearest zone in the swipe direction. |
| Quick Sort | Tap Zone | Tap a zone directly to send the frontmost staging shape to that zone. |
| Hold Shape | Long Press (300ms+) | Hold a shape in staging area to prevent auto-overflow. Max 1 held shape at a time. |

**Control Philosophy**: Swiping is the primary mechanic because it maps intuitively to "sending" something to a location. Tap-to-zone provides a faster alternative for experienced players. The hold mechanic adds strategic depth -- hold a shape you think will fit the NEXT law.

**Touch Area Map**:
```
+-------------------------------+
|  CURRENT LAW: [Rule Text]     |  <-- Law Display (y: 0-80px)
|  NEXT LAW: [Ghost Preview]    |  <-- Next Law Preview (y: 80-120px)
+-------------------------------+
|          |         |          |
|  ZONE A  | ZONE B  |  ZONE C |  <-- Sorting Zones (y: 120-520px)
|  (LEFT)  |(CENTER) | (RIGHT) |      Each zone ~120px wide
|          |         |          |
|          |         |          |
+-------------------------------+
| [Explosion Counter: X/5]      |  <-- Penalty HUD (y: 520-560px)
+-------------------------------+
|                               |
|     STAGING AREA              |  <-- Staging Area (y: 560-740px)
|  [shape] [shape] [shape] [sh] |      Max 4 shapes before overflow
|                               |
+-------------------------------+
|  Score: 1234    Hi: 5678      |  <-- Bottom HUD (y: 740-800px)
+-------------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Correct placement | 10 | +5 per consecutive correct (max +25) |
| Shape survives law change | 25 | +10 per shape surviving in same zone |
| Perfect law (all shapes survive) | 100 bonus | Only if 3+ shapes placed during that law |
| Wrong placement (explosion) | -5 | No multiplier |
| Combo (5+ consecutive correct) | x1.5 score | Resets on any explosion |
| Streak (3+ perfect laws) | x2.0 score | Resets on any explosion during law change |

**Combo System**: Consecutive correct placements build a combo counter. At 5+, all point gains are multiplied by 1.5x. At 10+, 2.0x. At 15+, 2.5x (cap). Any explosion resets the combo to 0.

**High Score**: Stored in localStorage under `color_law_high_score`. Displayed on menu and game over screen. New high score triggers celebration animation.

### 2.4 Progression System

The game is endless with increasing difficulty. "Stages" are measured by law changes -- each new law is a new stage.

**Progression Milestones**:

| Stage (Law #) | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-3 | Color laws only (Red/Blue/Green), 3 zones | Easy: 8 shapes per law, 1 shape at a time in staging |
| 4-6 | Shape laws introduced (Circle/Square/Triangle) | Medium: 7 shapes per law, shapes spawn faster (1.5s -> 1.2s) |
| 7-10 | 4th zone added (TOP zone above existing 3) | Hard: 6 shapes per law, 2 shapes can be in staging |
| 11-15 | Size laws (Big/Small), compound laws appear | Very Hard: 5 shapes per law, spawn rate 1.0s |
| 16-20 | 5th zone, pattern laws (Striped/Solid) | Expert: 4 shapes per law, spawn rate 0.8s |
| 21+ | All law types random, compound laws frequent | Extreme: 4 shapes per law, spawn rate 0.6s |

### 2.5 Lives and Failure

The game uses an explosion counter instead of lives. Each explosion adds 1 to the counter. At 5 explosions, game over.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Wrong zone placement | +1 explosion, shape destroyed | None (immediate) |
| Law change violation | +1 explosion per violating shape | Anticipate laws to prevent |
| Staging overflow (4+ shapes) | Bottom shape falls off = +1 explosion | Sort faster or hold shapes |
| Inactivity (8 seconds no swipe) | Shapes auto-pile, overflow triggers | Resume swiping |
| 5 total explosions | Game Over | Watch ad to clear 2 explosions and continue |

**Inactivity Death**: If no input for 8 seconds, shapes continue spawning at accelerated rate (every 0.5s). Within 8-12 seconds of inactivity, staging area overflows, causing rapid explosions. Game over within 16-20 seconds of total inactivity. Well under the 30-second requirement.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Stages are defined by law changes. Each "stage" is one law period (the time a single law is active). Stage generation determines: (a) what type of law, (b) how many shapes until next law, (c) what shapes spawn during this law.

**Generation Algorithm**:
```
Stage Generation Parameters:
- law_type: selected from law_pool[stage_number] (pool expands with stage)
- shapes_per_law: max(4, 8 - floor(stage_number / 3))
- spawn_interval_ms: max(600, 1500 - stage_number * 50)
- zone_count: 3 (stages 1-6), 4 (stages 7-15), 5 (stages 16+)
- shape_properties: selected based on available law types
- compound_law_chance: min(0.6, max(0, (stage_number - 10) * 0.05))
```

### 3.2 Law System Design

**Law Types** (unlocked progressively):

| Law Type | Unlock Stage | Example Rule | Properties Used |
|----------|-------------|--------------|-----------------|
| Color | 1 | "Red -> LEFT, Blue -> RIGHT, Green -> CENTER" | shape.color |
| Shape | 4 | "Circles -> LEFT, Squares -> RIGHT, Triangles -> CENTER" | shape.type |
| Size | 11 | "Big -> LEFT, Small -> RIGHT" | shape.size |
| Pattern | 16 | "Striped -> LEFT, Solid -> RIGHT" | shape.pattern |
| Compound | 11 | "Red Circles -> LEFT, Blue Squares -> RIGHT, else -> CENTER" | color + type |

**Law Pool by Stage**:
- Stages 1-3: [Color]
- Stages 4-6: [Color, Shape]
- Stages 7-10: [Color, Shape] + 4th zone
- Stages 11-15: [Color, Shape, Size, Compound(color+shape)]
- Stages 16-20: [Color, Shape, Size, Pattern, Compound(any two)]
- Stages 21+: [All types, Compound(any two), triple compounds rare]

**Law Rotation Schedule**:
- The NEXT law is always previewed (ghosted at reduced opacity) above the current law.
- When shapes_per_law shapes have been placed, a 2-second warning plays (siren sound, law text flashes red).
- After 2-second warning, law changes instantly. All zones are re-evaluated.

**Law Change Evaluation**:
```
on_law_change(new_law):
  for each zone in zones:
    for each shape in zone.shapes:
      correct_zone = new_law.evaluate(shape)
      if correct_zone != zone:
        shape.explode()  // +1 explosion counter
        spawn_explosion_particles(shape.position)
      else:
        shape.glow()     // +25 survival bonus
        spawn_survival_particles(shape.position)
```

### 3.3 Shape Types and Properties

**Colors** (4 total):
| Color | Hex | Unlock |
|-------|-----|--------|
| Red | #FF4444 | Stage 1 |
| Blue | #4488FF | Stage 1 |
| Green | #44DD44 | Stage 1 |
| Yellow | #FFCC00 | Stage 7 |

**Shape Types** (3 total):
| Shape | SVG | Unlock |
|-------|-----|--------|
| Circle | 30px radius circle | Stage 1 |
| Square | 50x50px rect | Stage 4 |
| Triangle | 50px equilateral triangle polygon | Stage 4 |

**Sizes** (2 total):
| Size | Dimension | Unlock |
|------|-----------|--------|
| Big | 1.5x base size (75px) | Stage 11 |
| Small | 0.7x base size (35px) | Stage 11 |

**Patterns** (2 total):
| Pattern | Visual | Unlock |
|---------|--------|--------|
| Solid | Filled shape | Stage 1 (default) |
| Striped | 3 horizontal lines through shape | Stage 16 |

Each spawned shape gets random properties from the currently unlocked pool. The law always uses only currently unlocked properties.

### 3.4 Zone Layout

**3-Zone Layout (Stages 1-6)**:
```
+----------+----------+----------+
|          |          |          |
|   LEFT   |  CENTER  |  RIGHT   |
|  Zone A  |  Zone B  |  Zone C  |
|          |          |          |
+----------+----------+----------+
```
Zone width: 120px each (360px total game width)
Zone height: 400px

**4-Zone Layout (Stages 7-15)**:
```
+------+----------+----------+------+
|      |          |          |      |
| FAR  |   LEFT   |  RIGHT   | FAR  |
| LEFT |  Zone B  |  Zone C  |RIGHT |
|Zone A|          |          |ZoneD |
+------+----------+----------+------+
```
Zone width: 90px each (360px total)

**5-Zone Layout (Stages 16+)**:
```
+---------+---------+---------+
|  ZONE A |  ZONE B |  ZONE C |
|  (72px) |  (72px) |  (72px) |
+---------+---------+---------+
|    ZONE D    |    ZONE E    |
|   (108px)    |   (108px)    |
+---------+---------+---------+
```
Top row: 3 zones at 120px wide, bottom row: 2 zones at 180px wide. Total game width: 360px.

### 3.5 Difficulty Curve

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
  0 +------------------------------------------ Law #
    0    5    10    15    20    25    30+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-3 | Stage 4-6 | Stage 7-10 | Stage 11-15 | Stage 16+ |
|-----------|-----------|-----------|------------|-------------|-----------|
| Shapes per law | 8 | 7 | 6 | 5 | 4 |
| Spawn interval (ms) | 1500 | 1200 | 1000 | 800 | 600 |
| Zone count | 3 | 3 | 4 | 4 | 5 |
| Law types available | 1 | 2 | 2 | 4 | 5 |
| Compound law chance | 0% | 0% | 0% | 25% | 60% |
| Max staging shapes | 4 | 4 | 4 | 3 | 3 |

### 3.6 Stage Generation Rules

1. **Solvability Guarantee**: Every law must have at least one valid zone for every possible shape property combination currently in play. The generator verifies no "impossible" sortings exist.
2. **Variety Threshold**: Consecutive laws must differ in type OR in zone assignments. No two identical laws in a row.
3. **Difficulty Monotonicity**: spawn_interval and shapes_per_law never improve (get easier) between stages.
4. **Rest Laws**: Every 5th law (stages 5, 10, 15...) uses a simple color-only law regardless of current pool, giving the player a breather.
5. **Fairness Rule**: When a law changes, at least 50% of the currently placed shapes must be valid under the new law. The generator re-rolls if >50% would explode (prevents unfair mass-explosion wipes).

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Bold flat design with thick outlines. Shapes are clean geometric primitives with strong primary colors against a dark background. Zones are large, clearly delineated colored rectangles. The law text uses a "legal decree" aesthetic -- bold, serif-inspired (rendered as Phaser text with weight).

**Aesthetic Keywords**: Bold, Judicial, Clean, Urgent, Pop

**Reference Palette**: Courtroom meets candy -- authoritative structure with playful color. Think a fun judge's desk covered in colorful building blocks.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Dark Slate | #1A1A2E | Main game background |
| Zone A (Left) | Soft Red | #E84855 | Left sorting zone fill (20% opacity) |
| Zone B (Center) | Soft Blue | #4B8BBE | Center sorting zone fill (20% opacity) |
| Zone C (Right) | Soft Green | #5FAD56 | Right sorting zone fill (20% opacity) |
| Zone D (Far/Top) | Soft Purple | #9B59B6 | 4th zone fill (20% opacity) |
| Zone E (Bottom) | Soft Orange | #E67E22 | 5th zone fill (20% opacity) |
| Zone Border | White | #FFFFFF | Zone border lines (2px) |
| Staging BG | Dark Gray | #2D2D44 | Staging area background |
| Law Text | Gold | #FFD700 | Current law display |
| Next Law Text | Dim Gold | #FFD70050 | Next law preview (50% opacity) |
| Explosion | Bright Orange | #FF6B35 | Explosion particles |
| Success | Bright Cyan | #00E5FF | Survival glow |
| HUD Text | White | #FFFFFF | Score, counter text |
| Warning | Red | #FF0000 | Law change warning flash |
| Penalty Counter | Crimson | #DC143C | Explosion counter text |
| Shape Red | Red | #FF4444 | Red game shapes |
| Shape Blue | Blue | #4488FF | Blue game shapes |
| Shape Green | Green | #44DD44 | Green game shapes |
| Shape Yellow | Yellow | #FFCC00 | Yellow game shapes |
| Shape Outline | Dark | #111111 | Shape outlines (3px) |

### 4.3 SVG Specifications

All game graphics are rendered as SVG elements generated in code. No external image assets.

**Circle Shape** (base size 50px diameter):
```svg
<svg width="50" height="50" viewBox="0 0 50 50">
  <circle cx="25" cy="25" r="22" fill="{COLOR}" stroke="#111111" stroke-width="3"/>
</svg>
```

**Square Shape** (base size 50x50px):
```svg
<svg width="50" height="50" viewBox="0 0 50 50">
  <rect x="3" y="3" width="44" height="44" rx="4" fill="{COLOR}" stroke="#111111" stroke-width="3"/>
</svg>
```

**Triangle Shape** (base size 50px):
```svg
<svg width="50" height="50" viewBox="0 0 50 50">
  <polygon points="25,3 47,47 3,47" fill="{COLOR}" stroke="#111111" stroke-width="3"/>
</svg>
```

**Striped Overlay** (applied on top of any shape):
```svg
<!-- 3 horizontal white lines at 30% opacity -->
<line x1="8" y1="15" x2="42" y2="15" stroke="#FFFFFF" stroke-width="2" opacity="0.4"/>
<line x1="8" y1="25" x2="42" y2="25" stroke="#FFFFFF" stroke-width="2" opacity="0.4"/>
<line x1="8" y1="35" x2="42" y2="35" stroke="#FFFFFF" stroke-width="2" opacity="0.4"/>
```

**Gavel Icon** (for law change):
```svg
<svg width="40" height="40" viewBox="0 0 40 40">
  <rect x="15" y="2" width="10" height="22" rx="2" fill="#8B7355" stroke="#111" stroke-width="2"/>
  <rect x="5" y="22" width="30" height="8" rx="3" fill="#A0845C" stroke="#111" stroke-width="2"/>
  <rect x="12" y="32" width="16" height="6" rx="2" fill="#666" stroke="#111" stroke-width="1"/>
</svg>
```

**Explosion Particle** (8px circle, random color from shape):
```svg
<svg width="8" height="8"><circle cx="4" cy="4" r="4" fill="{COLOR}"/></svg>
```

**Design Constraints**:
- All SVG elements use basic shapes only (circle, rect, polygon, line)
- Maximum 6 path elements per SVG object
- Shapes rendered via Phaser `textures.addBase64()` in BootScene
- Animations via Phaser tweens, not SVG animate

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Shape land | Shape reaches zone | Scale bounce: 1.0 -> 1.2 -> 1.0 over 150ms, zone flash at 30% opacity for 100ms |
| Law warning | 2s before law change | Law text color cycles red/gold at 200ms intervals, gavel icon shakes |
| Law change | New law activates | Screen flash white at 20% opacity for 100ms, gavel slam animation (scale 1.5 -> 1.0, 200ms) |
| Explosion | Shape violates law | 12 particles burst radially, shape scales to 1.5x then fades in 300ms, zone flashes red 150ms |
| Survival glow | Shape survives law change | Cyan outline pulses 3x over 600ms, +25 text floats up |
| Staging warning | 3+ shapes in staging | Staging area border pulses red at 500ms intervals |
| Overflow | Shape falls off staging | Shape falls downward with gravity (500ms), explosion at bottom |
| Perfect law | All shapes survive | Rainbow flash across all zones (300ms), large "PERFECT!" text |

---

## 5. Audio Design

### 5.1 Sound Effects

All sounds generated via Web Audio API (oscillator-based, no external files).

| Event | Sound Description | Duration | Implementation |
|-------|------------------|----------|----------------|
| Swipe shape | Short whoosh (white noise sweep high->low) | 150ms | Noise oscillator, freq sweep 2000->200Hz |
| Zone placement | Satisfying click-thud (sine pop) | 100ms | Sine 440Hz, 50ms decay |
| Wrong placement | Harsh buzz (square wave) | 200ms | Square 150Hz, 200ms |
| Law warning siren | Rising siren tone | 500ms (loops 4x over 2s) | Sine sweep 300->800Hz |
| Law change gavel | Deep thud with reverb | 300ms | Sine 80Hz + noise, fast decay |
| Explosion | Pop-crackle | 250ms | Noise burst + sine 200Hz, fast decay |
| Survival ding | Bright ascending chime | 200ms | Sine 880->1320Hz, clean |
| Perfect law | Ascending 3-note fanfare | 600ms | Sine 440->660->880Hz, 200ms each |
| Combo milestone | Rising pitch click | 100ms | Sine at 440 + combo*40 Hz |
| Game over | Descending 3-note somber | 800ms | Sine 440->330->220Hz, 250ms each |
| Overflow warning | Low pulse | 300ms (repeats) | Sine 100Hz, pulsing |
| UI button | Subtle click | 80ms | Sine 600Hz, sharp decay |

### 5.2 Music Concept

**Background Music**: No background music. The game relies on its dense sound effect palette for audio atmosphere. The rapid succession of swooshes, clicks, sirens, and gavels creates a rhythmic soundscape that intensifies naturally with gameplay speed.

**Audio Implementation**: Web Audio API (built-in). No external audio library needed. All sounds synthesized via `AudioContext`, `OscillatorNode`, and `GainNode`.

---

## 6. UI/UX

### 6.1 Screen Flow

```
+------------+     +------------+     +------------+
|   Boot     |---->|   Menu     |---->|   Game     |
|  Scene     |     |   Scene    |     |   Scene    |
+------------+     +-----+------+     +------+-----+
                      |     |                |
                 +----+     +----+      +----+----+
                 |               |      | Pause   |-->+----------+
            +----+----+    +----+----+  | Overlay |   |  Help    |
            |  Help   |    |Settings |  +----+----+   |How 2 Play|
            |How2 Play|    | Overlay |       |        +----------+
            +---------+    +---------+  +----+----+
                                        | Game    |
                                        | Over    |
                                        | Screen  |
                                        +----+----+
                                             |
                                        +----+----+
                                        | Ad /    |
                                        |Continue |
                                        | Prompt  |
                                        +---------+
```

### 6.2 HUD Layout

```
+-----------------------------------+
| LAW: Red->L  Blue->R  Green->C   |  y: 0-50px   (current law, gold text, 18px bold)
| NEXT: Circles->L  Squares->R ... |  y: 50-80px  (next law, dim gold, 14px)
+-----------------------------------+
|           |           |           |
|  ZONE A   |  ZONE B   |  ZONE C  |  y: 80-480px (sorting zones)
|  [shapes] |  [shapes] |  [shapes]|
|           |           |           |
+-----------------------------------+
| Explosions: X X X X X  (5 slots) |  y: 480-520px (penalty counter, skull icons)
+-----------------------------------+
|                                   |
|       STAGING AREA                |  y: 520-700px (incoming shapes)
|   [shape] [shape] [shape]        |
|                                   |
+-----------------------------------+
| Score: 1234        Best: 5678     |  y: 700-740px (score bar)
| [II] Pause              Stage: 7 |  y: 740-780px (controls bar)
+-----------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Current Law | Top (0-50px), full width | Law text in gold, 18px bold | On law change |
| Next Law | Below current (50-80px) | Next law ghosted at 50% opacity, 14px | On law change |
| Zone Labels | Inside each zone, top | Zone letter (A/B/C...), 14px white | On zone layout change |
| Explosion Counter | Below zones (480-520px) | 5 skull icons, filled red on explosion | On explosion |
| Staging Area | Lower section (520-700px) | Shows queued shapes in a row | On shape spawn/sort |
| Score | Bottom-left (700-720px) | "Score: {N}" white 16px | On score change |
| High Score | Bottom-right (700-720px) | "Best: {N}" white 14px | On game start |
| Pause Button | Bottom-left (740-780px) | "||" icon, 40x40px | Always visible |
| Stage Counter | Bottom-right (740-780px) | "Law #{N}" white 14px | On law change |
| Combo Counter | Center, above staging (500px) | "x{N} COMBO!" yellow, 24px, appears/fades | On combo event |

### 6.3 Menu Structure

**Main Menu (MenuScene)**:
- Game title "COLOR LAW" (48px, gold, with gavel icon)
- Tagline "Sort by the rules... before they change!" (16px, white)
- **PLAY** button (200x60px, centered, gold background #FFD700, black text, 24px bold)
- **How to Play / "?"** button (50x50px, top-right, white circle with "?" in black)
- **Sound toggle** (40x40px, bottom-left, speaker icon)
- **High Score** display (bottom-center, "BEST: {N}")
- Background: #1A1A2E with subtle floating shape silhouettes

**Pause Menu** (overlay, semi-transparent #00000099 background):
- "PAUSED" title (36px, white)
- **Resume** button (180x50px, gold bg)
- **How to Play / "?"** button (180x50px, white bg)
- **Restart** button (180x50px, gray bg)
- **Quit to Menu** button (180x50px, dark bg)
- Sound toggle (40x40px, bottom corner)

**Game Over Screen** (overlay):
- "GAME OVER" (40px, #DC143C)
- Gavel slam animation
- **Final Score** (48px, gold, scale-punch animation)
- "NEW BEST!" if new high score (flashing gold/white)
- "Laws Survived: {N}" (18px, white)
- "Best Combo: {N}" (16px, white)
- **"Watch Ad: Clear 2 Explosions"** button (200x50px, green #5FAD56) -- only if ad available
- **"Play Again"** button (200x50px, gold #FFD700, prominent)
- **"Menu"** button (120x40px, gray, smaller)

**Help / How to Play Screen** (overlay, scrollable):
- Title: "HOW TO PLAY" (30px, gold)
- **Section 1 - Controls**:
  - SVG diagram showing swipe gesture from staging area to zones
  - Arrow illustrations pointing from shape to each zone
  - "Swipe shapes to the correct zone!" caption
  - Tap-zone diagram: "Or tap a zone to send the front shape there"
- **Section 2 - The Law**:
  - Example law text with arrow to zone illustration
  - "The LAW tells you where each shape goes"
  - "Laws CHANGE -- watch the NEXT LAW preview!"
  - SVG showing shapes exploding with X marks
  - "Shapes that violate the new law EXPLODE!"
- **Section 3 - Rules**:
  - "5 Explosions = Game Over"
  - "Don't let shapes pile up in staging!"
  - "Shapes that survive law changes = BONUS POINTS"
- **Section 4 - Tips**:
  - Tip 1: "Watch the NEXT LAW preview to plan ahead"
  - Tip 2: "Hold a shape (long press) if it fits the next law better"
  - Tip 3: "Place shapes that match BOTH current and next law first"
- **"Got it!"** button (180x50px, gold, returns to previous screen)
- Matches game color palette (#1A1A2E background, gold accents)
- Scrollable via Phaser camera or container mask if content exceeds viewport

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after death | Every game over | Always (optional) |
| Rewarded | Double final score | Game over screen | Always (optional) |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Continue | Watch rewarded ad after game over | Clear 2 explosions, resume play | Once per game |
| Score Double | Watch rewarded ad at game over | 2x final score | Once per session |

### 7.3 Session Economy

**NOTE: POC stage -- no ad integration implemented. Ad hooks are placeholder only.**

Expected session: 2-5 minutes. Player dies, sees game over, can optionally continue once via ad. Expected 1-2 ad views per session. Session flow:

```
[Play Free] --> [5 Explosions] --> [Rewarded Ad: Clear 2 & Continue?]
                                          | Yes --> [Resume with 3/5 explosions]
                                          | No  --> [Game Over Screen]
                                                        |
                                                  [Interstitial (every 3rd)]
                                                        |
                                                  [Rewarded: Double Score?]
                                                        | Yes --> [Score doubled]
                                                        | No  --> [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/color-law/
+-- index.html              # Entry point, loads CDN + local scripts
+-- css/
|   +-- style.css           # Responsive layout, mobile-first
+-- js/
    +-- config.js           # Game constants, law definitions, colors, difficulty tables
    +-- main.js             # Phaser init, BootScene (SVG textures), global state
    +-- game.js             # GameScene: core gameplay, input, law system, explosions
    +-- stages.js           # Law generation, difficulty scaling, shape spawning
    +-- ui.js               # MenuScene, GameOverScene, HUD overlay, pause
    +-- help.js             # HelpScene: illustrated how-to-play
    +-- ads.js              # Ad integration hooks (placeholder)
```

**Script load order in index.html**:
```html
<!-- CDN -->
<script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>
<!-- Local (ORDER MATTERS: main.js MUST be LAST) -->
<script src="js/config.js"></script>
<script src="js/stages.js"></script>
<script src="js/ads.js"></script>
<script src="js/help.js"></script>
<script src="js/ui.js"></script>
<script src="js/game.js"></script>
<script src="js/main.js"></script>
```

### 8.2 Module Responsibilities

**config.js** (~80 lines):
- `GAME_WIDTH = 360`, `GAME_HEIGHT = 780`
- Color palette constants (all hex values from Section 4.2)
- Shape SVG strings (circle, square, triangle for each color)
- Law type definitions: `LAW_TYPES = { COLOR: 0, SHAPE: 1, SIZE: 2, PATTERN: 3, COMPOUND: 4 }`
- Difficulty table: `DIFFICULTY[stage]` -> `{ shapesPerLaw, spawnInterval, zoneCount, lawPool, compoundChance }`
- Score values: `SCORE_CORRECT = 10`, `SCORE_SURVIVE = 25`, `SCORE_PERFECT = 100`, `SCORE_WRONG = -5`
- Explosion cap: `MAX_EXPLOSIONS = 5`
- Combo thresholds: `COMBO_TIERS = [{ at: 5, mult: 1.5 }, { at: 10, mult: 2.0 }, { at: 15, mult: 2.5 }]`
- Inactivity timeout: `INACTIVITY_MS = 8000`
- Staging max: `MAX_STAGING = 4` (decreases to 3 at stage 11+)

**main.js** (~60 lines):
- BootScene: register all SVG textures via `textures.addBase64()` once
- Phaser.Game config: `type: Phaser.AUTO`, `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }`
- Scene array: `[BootScene, MenuScene, HelpScene, GameScene]`
- Global `GameState` object: `{ score, highScore, explosions, combo, stage, gamesPlayed }`
- localStorage read/write for persistence
- Orientation/resize handler

**game.js** (~280 lines):
- GameScene extending Phaser.Scene
- `create()`: Initialize zones, staging area, law system, input handlers, HUD overlay scene
- `update()`: Check inactivity timer, check staging overflow, update spawn timer
- `spawnShape()`: Create random shape from current property pool, add to staging
- `handleSwipe(pointer)`: Detect swipe direction, calculate target zone, move shape
- `handleTapZone(zone)`: Send frontmost staging shape to tapped zone
- `placeShape(shape, zone)`: Validate against current law, award points or trigger explosion
- `changeLaw()`: Generate new law, evaluate all placed shapes, trigger explosions/survivals
- `explodeShape(shape)`: Increment explosion counter, spawn particles, check game over
- `checkGameOver()`: If explosions >= 5, transition to game over
- Input: `this.input.on('pointerdown/pointermove/pointerup')` for swipe detection
- Swipe threshold: 40px minimum distance, direction determined by largest axis delta

**stages.js** (~120 lines):
- `generateLaw(stage)`: Returns law object `{ type, rules: [{ match: {}, zone: 'A' }], fallback: 'B' }`
- `getDifficulty(stage)`: Returns difficulty params from table
- `generateShapeProperties(lawPool)`: Returns random `{ color, type, size, pattern }`
- `validateLaw(law, shapes)`: Ensures >50% of placed shapes survive new law
- `getZoneLayout(zoneCount)`: Returns zone positions and dimensions for 3/4/5 zones
- `evaluateShape(shape, law)`: Returns correct zone ID for a shape under a law
- Rest stage detection: `isRestStage(stage)` returns true every 5th stage

**ui.js** (~250 lines):
- MenuScene: Title, play button, help button, sound toggle, high score display
- GameOver overlay (rendered as Phaser container in GameScene): Score, buttons, ad prompts
- HUD elements: Law display text, explosion counter icons, score text, combo text, pause button
- Pause overlay: Resume, help, restart, quit buttons
- `updateLawDisplay(currentLaw, nextLaw)`: Format law text for HUD
- `updateExplosionCounter(count)`: Update skull icons
- `showCombo(count)`: Display combo text with scale animation
- `showFloatingScore(x, y, points)`: Animate "+N" text floating upward
- `showPerfectLaw()`: Rainbow flash animation

**help.js** (~100 lines):
- HelpScene extending Phaser.Scene
- Illustrated swipe diagram using game shape textures
- Law explanation with example graphics
- Rules and tips text
- "Got it!" button returning to previous scene (stored in `this.scene.settings.data.returnScene`)
- Scrollable content via camera bounds

**ads.js** (~40 lines):
- Placeholder ad hooks
- `showInterstitial(callback)`: Immediately calls callback (no real ad)
- `showRewarded(callback)`: Immediately calls callback with reward (no real ad)
- `shouldShowInterstitial()`: Returns true every 3rd game over
- `onAdRewarded(type)`: Handle reward (clear explosions or double score)

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No Howler.js needed -- audio via Web Audio API built into browser.

### 8.4 Performance Targets

| Metric | Target |
|--------|--------|
| Frame Rate | 60fps stable |
| Load Time | <2 seconds |
| Memory | <80MB |
| JS Total | <500KB (excl. CDN) |
| Max simultaneous shapes | 25 (5 zones x 5 shapes max per zone) |
| Max particles | 50 (auto-destroy after 500ms) |

---

## 9. Juice Specification

### 9.1 Player Input Feedback (applied to every swipe/tap sort)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Sorted shape | Count: 8, Direction: radial burst from shape center, Color: shape's color hex, Lifespan: 400ms |
| Screen shake | Camera | Intensity: 2px, Duration: 80ms |
| Scale punch | Target zone | Scale: 1.08x, Recovery: 120ms (zone rectangle briefly swells) |
| Scale punch | Sorted shape | Scale: 1.3x on arrival -> 1.0x over 150ms (bounce-land) |
| Sound | -- | Whoosh on swipe start, click-thud on landing. Pitch: +20Hz per combo level |
| Zone flash | Target zone | Zone background opacity: 20% -> 40% -> 20% over 100ms |

### 9.2 Core Action Additional Feedback (swipe-to-sort, most frequent input)

| Effect | Values |
|--------|--------|
| Swipe trail | 6 fading copies of shape along swipe path, opacity 0.8 -> 0.0 over 200ms |
| Hit-stop | 30ms physics pause on shape landing in zone |
| Combo text | "x{N}!" text at combo position, size 20px + 2px per combo level (cap 36px) |
| Combo escalation | Particle count +2 per combo level (8 base, max 20). Screen shake +0.5px per combo (max 5px). Landing scale punch +0.05 per combo (max 1.6x). |
| Streak glow | At 3+ perfect laws, all zone borders glow cyan pulse (200ms cycle) |

### 9.3 Law Change Effects

| Effect | Values |
|--------|--------|
| Warning siren | Siren sound loops 4x over 2 seconds before change |
| Law text flash | Current law text alternates gold/red at 200ms intervals for 2 seconds |
| Gavel slam | Gavel icon scales 0 -> 1.5x -> 1.0x over 200ms, with screen shake 4px for 150ms |
| Screen flash | White overlay at 25% opacity, 80ms fade-out |
| Explosion cascade | Each violating shape explodes with 100ms delay between them (staggered, not simultaneous) |
| Survival pulse | Surviving shapes get cyan outline that pulses 3x (scale 1.0 -> 1.1 -> 1.0 each pulse, 200ms each) |
| Zone re-color | Zones smoothly tween to new law-assigned colors over 300ms |

### 9.4 Death/Failure Effects (Explosion)

| Effect | Values |
|--------|--------|
| Particles | Count: 15, Direction: radial explosion, Color: shape color + #FF6B35 orange mix, Lifespan: 500ms, Gravity: slight downward (50px/s) |
| Screen shake | Intensity: 6px, Duration: 200ms |
| Shape destruction | Shape scales to 1.5x over 100ms, then fades opacity 1.0 -> 0.0 over 200ms |
| Zone flash | Affected zone flashes #FF000040 for 150ms |
| Sound | Pop-crackle explosion, 250ms |
| Explosion counter | New skull icon scales from 2.0x -> 1.0x over 200ms (dramatic stamp) |
| Combo break | If combo > 0, "COMBO BROKEN" text flashes red, 400ms fade |

### 9.5 Game Over Effects

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 12px, Duration: 400ms |
| Screen effect | Desaturation tween over 500ms (Phaser pipeline or overlay) |
| Sound | Descending 3-note somber tone, 800ms |
| 5th explosion | Extra large: 25 particles, 8px shake, 300ms |
| Effect -> UI delay | 800ms (let the final explosion register before showing game over) |
| Death -> restart | **Under 2 seconds** (Play Again -> new game in <1.5s) |
| Gavel slam (final) | Large gavel drops from top of screen, lands with 10px shake |

### 9.6 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{N}", Color: #FFD700 (gold), Movement: float up 50px over 600ms, Fade: opacity 1.0 -> 0.0 over 600ms, Font: 18px bold |
| Score HUD punch | Scale 1.3x, Recovery: 150ms |
| Survival bonus text | "+25 SAFE!", Color: #00E5FF (cyan), Size: 20px, floats up from surviving shape |
| Perfect law text | "PERFECT LAW!", Color: #FFD700, Size: 32px, center screen, scale 0 -> 1.2 -> 1.0 over 400ms, fade over 600ms |
| High score break | "NEW BEST!" flashes gold/white alternating at 300ms, 3 cycles |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | Performance.timing API |
| Memory Usage | <80MB | Chrome DevTools Memory panel |
| JS Bundle Size | <400KB total (excl. CDN) | File size check |
| Shape pool | Max 25 active shapes | Object pool with recycling |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser pointer events (handles both touch and mouse)
- **Prevent Default**: Disable pull-to-refresh, pinch-to-zoom, double-tap-to-zoom via CSS `touch-action: none`
- **Orientation**: Portrait lock via CSS. On landscape, show "Please rotate" overlay.
- **Safe Areas**: `env(safe-area-inset-top)` padding for notched devices
- **Background/Focus**: Pause game on `visibilitychange` event. Resume on return.
- **Asset Loading**: All SVG generated in code. No loading screen needed.

### 10.3 Touch Controls Implementation

- **Swipe Detection**: Record `pointerdown` position. On `pointerup`, calculate delta. If delta > 40px, it is a swipe. Direction = axis with largest absolute delta.
- **Tap Zone Detection**: If delta < 15px (essentially a tap), check if the tap landed inside a zone rectangle. If yes, send frontmost staging shape there.
- **Long Press**: If pointer held > 300ms without movement > 10px, mark shape as "held" (prevent overflow).
- **Touch Target Size**: All buttons minimum 44x44px.
- **Input Buffering**: Buffer latest input during law-change animation (300ms). Process after animation completes.
- **Dead Zones**: 15px dead zone on swipes to prevent accidental sorts.

### 10.4 Critical Implementation Warnings

1. **Texture Registration**: ALL SVG textures MUST be registered in BootScene via `addBase64()` ONCE. Never re-register on scene restart. Generate all color/shape combinations at boot (4 colors x 3 shapes x 2 patterns = 24 textures max).
2. **Script Load Order**: `main.js` MUST load LAST in index.html. Loading before `ui.js` or `game.js` causes "Scene is not defined" errors.
3. **Shape Removal Timing**: Never remove game objects during law evaluation loop. Collect shapes to remove, then remove after loop completes via `this.time.delayedCall(0, () => { ... })`.
4. **HUD Initialization**: Score text MUST initialize from `GameState.score` (not literal `'0'`), so it displays correctly on restart.
5. **No timeScale Freezing**: Do not use `this.time.timeScale = 0` for hit-stop. Use `setTimeout()` instead, as Phaser timers don't advance at timeScale 0.
6. **Text vs Button Depth**: If score/law text has higher depth than buttons, it blocks pointer events. Either make text non-interactive (`text.setInteractive()` not called) or ensure buttons have higher depth.
7. **Object Pooling**: Reuse shape and particle objects. Cap active particles at 50 to prevent mobile performance drops.
8. **Inactivity Timer Reset**: Reset inactivity timer on ANY pointer event (down, move, up), not just successful sorts.

### 10.5 Testing Checkpoints

| Checkpoint | What to Verify |
|------------|---------------|
| Boot | All 24 shape textures registered, no console errors |
| Menu | Play button works, Help opens and closes, sound toggle persists |
| Basic Gameplay | Shapes spawn, swipe sorts to correct zone, score increases |
| Law Changes | Law changes after N shapes, next law preview visible, warning plays |
| Explosions | Wrong placement explodes, law violations cascade, counter updates |
| Game Over | 5 explosions triggers game over, score displayed, restart works |
| Inactivity | No input for 8s -> shapes pile up -> overflow -> explosions -> death within 20s |
| Restart Speed | Play Again -> new game active in under 2 seconds |
| Help Page | Opens from menu and pause, shows illustrations, Got It returns correctly |
| Pause | Pause stops game, resume continues, all overlay buttons work |
| Progression | Stage 4+ shows shape laws, stage 7+ has 4 zones, stage 11+ has size/compound |
| Combo | Combo counter appears at 5+, multiplier applies, resets on explosion |
| Survival Bonus | Shapes surviving law change show glow and +25 text |
| Perfect Law | All shapes surviving triggers PERFECT bonus and animation |
| Portrait/Landscape | Game stays portrait, landscape shows rotate message |
| Performance | 60fps with 20+ shapes on screen, no memory leaks on restart |

### 10.6 Local Storage Schema

```json
{
  "color_law_high_score": 0,
  "color_law_games_played": 0,
  "color_law_highest_stage": 0,
  "color_law_settings": {
    "sound": true
  },
  "color_law_best_combo": 0
}
```

### 10.7 Edge Cases

- **Rapid swipe spam**: Queue swipes, process one per frame. Don't allow sorting the same shape twice.
- **Swipe during law change animation**: Buffer the input, process after 300ms animation completes.
- **Zone overflow**: Each zone can hold max 8 shapes. If full, shape bounces back to staging with a "thud" sound.
- **All zones explode on law change**: If >50% would explode, generator re-rolls law (Section 3.6 fairness rule). But if 3+ explode after the fairness cap, that is intentional difficulty.
- **Tab background**: `document.addEventListener('visibilitychange', ...)` pauses game. Spawning stops, timers freeze.
- **Resize**: `window.addEventListener('resize', ...)` triggers Phaser scale manager recalculation. No manual handling needed with `Phaser.Scale.FIT`.
- **Double-tap prevention**: CSS `-webkit-user-select: none` and `touch-action: manipulation` on game container.
