# Game Design Document: Mirror Logic

**Slug**: `mirror-logic`
**One-Liner**: Place and angle mirrors to bounce a laser through targets in the correct ORDER -- wrong sequence detonates the bomb.
**Core Mechanic**: Grid-based laser-mirror puzzle with ordered target sequence and bomb timer
**Target Session Length**: 1-3 minutes
**Date Created**: 2026-03-06
**Author**: Architect
**Creator**: spark
**Score**: 68.5 (brain track)

---

## 1. Overview

### 1.1 Concept Summary

Mirror Logic is a spatial puzzle game set in a dark laboratory environment. A laser emitter fires a continuous beam from a fixed position on the grid. The player places and rotates chrome mirrors on empty grid cells to redirect the laser beam, bouncing it through numbered target orbs in the correct ascending order (1, 2, 3...). Hitting targets out of sequence triggers an instant bomb detonation -- game over.

The core tension comes from planning the laser path under time pressure. Each stage has a bomb timer ticking down (starting at 25s, decreasing with stages). The player must visualize reflection angles, mentally trace the beam path, and place mirrors quickly. Early stages ease players in with 2-3 targets and simple layouts. Later stages introduce prisms that split beams into colors, color filters that only pass matching beams, one-way mirrors, and moving targets -- all while the timer ticks.

What makes it fun: the "aha!" moment when you figure out the correct mirror arrangement, the satisfying neon laser beam tracing through your solution, and the escalating panic as the timer counts down. Each stage is a mini-puzzle that takes 10-20 seconds to solve, creating tight feedback loops within 1-3 minute sessions.

**Exploit Prevention**: Random mirror placement will not work because targets must be hit in exact ascending order (1 -> 2 -> 3...). A randomly placed mirror is overwhelmingly likely to route the beam into a wrong-order target or miss targets entirely. The ORDER constraint is the anti-exploit: even if the beam accidentally hits targets, hitting them in the wrong sequence is instant death.

### 1.2 Target Audience

Casual mobile puzzle gamers aged 16-35. Players who enjoy spatial reasoning games (Cut the Rope, Where's My Water, Laser Maze board game). Play context: commute, waiting rooms, short breaks. Skill level: easy to understand (place mirrors, bounce laser), hard to master (multi-target paths under time pressure).

### 1.3 Core Fantasy

You are a bomb defusal expert in a high-tech lab. Each bomb can only be disarmed by routing a laser beam through its detonation nodes in the exact sequence. One wrong move and BOOM. The satisfaction of watching your perfectly-planned laser path trace through every target in order, followed by the bomb powering down -- that is the fantasy.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 1-3 minutes |
| Day 1 Retention | 40%+ |
| Day 7 Retention | 20%+ |
| Average Stages per Session | 5-12 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Stage Loads: Grid + Emitter + Targets + Bomb Timer]
    --> [Player Places/Rotates Mirrors on Grid]
    --> [Laser Fires: Beam Traces Reflections in Real-Time]
    --> [Targets Hit In Order? YES --> Stage Clear + Score]
    --> [Next Stage (harder)]
         |
         NO (wrong order / timer expires / laser hits wall bomb)
         |
    --> [EXPLOSION --> Death --> Game Over --> Retry]
```

**10-Second Experience**: You see a dark grid with a red laser beam shooting from the left edge. Three glowing green orbs labelled 1, 2, 3 are scattered across the grid. You tap an empty cell -- a chrome mirror appears. The laser bounces off it and shoots toward target 1 -- PING! It lights up gold. You tap another cell, place another mirror. The beam bounces to target 2 -- PING! Gold. The bomb timer shows 8 seconds left. One more mirror. You tap, rotate it -- the beam hits 3. STAGE CLEAR! White flash, chime, score flies up. Next stage loads with 4 targets and walls. The timer starts ticking again.

**Moment-to-moment**: The player sees a grid with an emitter on one edge, numbered target orbs scattered across cells, and some obstacle walls. The laser is always firing. Empty grid cells can receive a mirror. The player taps an empty cell to place a mirror (45-degree angle), then taps the placed mirror to rotate it (toggles between 45 and 135 degrees). The laser beam updates in real-time as mirrors are placed/rotated, showing the player exactly where the beam goes. When the beam hits targets 1, 2, 3... in correct ascending order, the stage clears. Hitting target 3 before target 1 = instant detonation.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Place Mirror | Tap empty grid cell | Places a 45-degree mirror (/) on that cell |
| Rotate Mirror | Tap placed mirror | Toggles mirror angle: 45 deg (/) <-> 135 deg (\) |
| Remove Mirror | Long press (400ms) placed mirror | Removes mirror from cell, returns to inventory |
| Fire Laser | Automatic | Laser fires continuously from emitter, updates path in real-time |

**Control Philosophy**: Single-tap for all primary actions. No drag-and-drop complexity. Tap to place, tap to rotate, long-press to remove. The grid cells are large enough (minimum 48x48px) for comfortable mobile interaction. Real-time laser tracing gives instant visual feedback on every mirror change.

**Touch Area Map**:
```
+-------------------------------+
| Score: 450   Stage 3   25s   |  <-- Top HUD bar (48px height)
+-------------------------------+
|                               |
|    [  ] [  ] [  ] [  ] [  ]  |
|    [  ] [EM] [  ] [  ] [T1]  |  <-- 6x8 Grid (main play area)
|    [  ] [  ] [  ] [WL] [  ]  |      EM=Emitter, T1-3=Targets
|    [  ] [  ] [  ] [  ] [  ]  |      WL=Wall, [  ]=Empty (tappable)
|    [T2] [  ] [WL] [  ] [  ]  |
|    [  ] [  ] [  ] [  ] [  ]  |
|    [  ] [  ] [  ] [T3] [  ]  |
|    [  ] [  ] [  ] [  ] [  ]  |
|                               |
+-------------------------------+
| Mirrors Left: 4    [?] [||]  |  <-- Bottom bar: inventory + help + pause
+-------------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Target hit (in order) | 100 per target | +50 bonus per consecutive hit without removing mirrors |
| Stage clear | 200 base | +10 per second remaining on timer |
| Perfect clear (no mirror removals) | 300 bonus | Only if zero removals used in stage |
| Speed bonus | 150 bonus | Clear stage with >15s remaining |
| Streak bonus | x1.5 after 3 consecutive stages, x2.0 after 5 | Resets on death |

**Combo System**: Clearing stages without dying builds a streak multiplier. 3 consecutive clears = 1.5x, 5 = 2.0x, 10 = 3.0x (cap). The multiplier applies to the total stage score. Dying resets the streak to 1.0x.

**High Score**: Stored in localStorage as `mirror_logic_high_score`. Displayed on menu and game over screen. New high score triggers celebration effect (particle burst + "NEW BEST!" text).

### 2.4 Progression System

The game uses infinite procedural stages. Each stage is generated based on stage number, introducing new mechanics at milestones.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-5 | Base mirrors only, 2-3 targets, 3 mirrors given | Tutorial -- learn place/rotate. Timer: 25s. Grid: 5x6 |
| 6-12 | Diagonal wall obstacles, 4 targets, 4 mirrors | Medium -- plan around walls. Timer: 25s. Grid: 5x7 |
| 13-20 | Prisms (split beam into 2 colors), color filters, 5 targets | Hard -- manage beam splitting. Timer: 22s. Grid: 6x7 |
| 21-30 | One-way mirrors (beam passes one direction only), 5-6 targets | Very Hard -- directional planning. Timer: 20s. Grid: 6x8 |
| 31+ | Moving targets (shift 1 cell every 5s), 6+ targets, mixed mechanics | Extreme -- dynamic solving. Timer: 18s. Grid: 6x8 |

### 2.5 Lives and Failure

The player has exactly 1 life per attempt. Any failure = game over. This creates high stakes on every stage.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Wrong-order target hit (e.g., hit #3 before #1) | Instant bomb detonation, game over | Retry from stage 1 (or watch ad to continue from current stage) |
| Timer reaches 0 | Bomb detonation, game over | Retry from stage 1 (or watch ad to continue) |
| Laser hits a wall-bomb (red wall) | Instant detonation, game over | Retry from stage 1 (or watch ad to continue) |
| Inactivity >25s (no taps) | Bomb timer expires naturally | Same as timer death |

**Inactivity Death**: The 25s bomb timer per stage guarantees death within 20-25s if the player is idle. No separate inactivity timer needed -- the bomb timer IS the inactivity killer. Even on the easiest stages, idle players will die before the timer expires. On later stages, the timer drops to 18s, ensuring death well within 20 seconds of inactivity.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Stages are procedurally generated using a deterministic algorithm seeded by stage number.

**Generation Algorithm**:
```
Stage Generation Parameters:
- Seed: stage_number * 7919 (prime multiplier for variety)
- Grid Size: 5x6 (stages 1-5), 5x7 (6-12), 6x7 (13-20), 6x8 (21+)
- Target Count: 2 + floor(stage / 5), capped at 7
- Mirror Count: targets + 1 (minimum mirrors needed to solve + 1 spare)
- Wall Count: floor(stage / 3), capped at 6
- Timer: max(15, 25 - floor(stage / 10))
- Prism Count: 0 (stages 1-12), 1 (13-20), 2 (21+)
- Filter Count: 0 (stages 1-12), 1 (13-20), 2 (21+)
- One-Way Mirror Count: 0 (stages 1-20), 1 (21-30), 2 (31+)
- Moving Target Count: 0 (stages 1-30), 1 (31-40), 2 (41+)
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

| Parameter | Stage 1-5 | Stage 6-12 | Stage 13-20 | Stage 21-30 | Stage 31+ |
|-----------|-----------|------------|-------------|-------------|-----------|
| Grid Size | 5x6 | 5x7 | 6x7 | 6x8 | 6x8 |
| Target Count | 2-3 | 3-4 | 4-5 | 5-6 | 6-7 |
| Mirror Budget | 3-4 | 4-5 | 5-6 | 6-7 | 7-8 |
| Wall Obstacles | 0-1 | 1-2 | 2-3 | 3-5 | 4-6 |
| Timer (seconds) | 25 | 25 | 22 | 20 | 18 |
| Special Elements | None | Walls | Prisms + Filters | One-way mirrors | Moving targets |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: The generator first places targets, then computes a valid mirror arrangement that routes the laser through all targets in order. It then removes all mirrors (giving them to the player as inventory). The solution must exist with the given mirror count. Generator validates by simulating the laser path.
2. **Variety Threshold**: Between consecutive stages, at least 2 of {emitter position, target positions, wall layout} must differ. Emitter rotates through 4 edges (top/right/bottom/left) every 4 stages.
3. **Difficulty Monotonicity**: Target count and wall count never decrease. Timer never increases between stages.
4. **Rest Stages**: Every 5th stage (5, 10, 15...) reduces target count by 1 and adds +5s to timer. Visual cue: green grid border instead of default.
5. **Boss Stages**: Every 10th stage (10, 20, 30...) features a special "master puzzle" with maximum targets for that range, minimum timer, and a gold border. Clearing a boss stage awards 500 bonus points.

### 3.4 Laser Reflection Algorithm

The laser path is computed on mirror state change using a ray-tracing approach:

```
function traceLaser(emitter, mirrors, targets, walls, grid):
    beam = { origin: emitter.position, direction: emitter.direction }
    path = [beam.origin]
    hitTargets = []
    maxBounces = 20  // hard cap to prevent infinite loops

    for bounce in 0..maxBounces:
        // March beam until hitting something
        hit = findFirstIntersection(beam, mirrors, targets, walls, gridBounds)

        if hit == null:
            path.push(beam.endAtGridEdge)
            break

        path.push(hit.point)

        if hit.type == 'target':
            hitTargets.push(hit.targetNumber)
            // Beam continues THROUGH targets (they don't block)
            continue

        if hit.type == 'wall' or hit.type == 'wall_bomb':
            if hit.type == 'wall_bomb':
                triggerExplosion()
            break

        if hit.type == 'mirror':
            // Reflect: 45-deg mirror (/) flips X/Y components
            // 135-deg mirror (\) negates then flips
            beam.direction = reflectDirection(beam.direction, hit.mirrorAngle)
            beam.origin = hit.point

        if hit.type == 'prism':
            // Split beam into 2 colored sub-beams
            // Each sub-beam continues independently (max 2 splits total)
            splitBeams = prismSplit(beam, hit.prismType)
            // Trace each sub-beam recursively (depth-limited to 1 split)

    return { path, hitTargets }
```

**Target Order Validation**: After tracing, check `hitTargets` array. If hitTargets[0] != 1 or any hitTargets[i] != hitTargets[i-1] + 1, trigger wrong-order detonation. All targets must be hit (hitTargets.length == totalTargets) for stage clear.

### 3.5 Prism and Filter Mechanics (Stage 13+)

**Prisms**: When the laser (white/red by default) hits a prism, it splits into 2 beams:
- Red beam continues at +45 degrees from incidence
- Blue beam continues at -45 degrees from incidence
- Hard cap: maximum 2 beams active at once (no recursive splitting)
- Both beams can independently hit targets

**Color Filters**: A filter block only allows a matching-color beam to pass through. Non-matching beams are absorbed (beam terminates).
- Red filter: only red beams pass
- Blue filter: only blue beams pass
- Targets behind a filter can only be hit by the correct color beam

**One-Way Mirrors (Stage 21+)**: Mirrors with an arrow indicator. Beam reflects only when hitting from the arrow side. Hitting from the back side = beam passes through without reflecting.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Dark sci-fi laboratory. Predominantly dark backgrounds with high-contrast neon laser beams. Chrome/metallic mirror surfaces. Glowing orb targets. Minimalist grid with subtle cell borders.

**Aesthetic Keywords**: Neon, Dark Lab, Chrome, Precision, Glow

**Reference Palette**: Think "Tron meets bomb defusal" -- dark environment lit primarily by the laser beam itself.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Deep Navy | #0A0E1A | Game background, grid fill |
| Grid Lines | Dark Blue-Gray | #1A2040 | Subtle grid cell borders |
| Laser (default) | Neon Red | #FF2244 | Primary laser beam |
| Laser (blue) | Neon Blue | #2288FF | Blue split beam from prism |
| Mirror Chrome | Silver | #C0C8D8 | Mirror rectangle fill |
| Mirror Edge | Bright White | #FFFFFF | Mirror highlight/border |
| Target Orb | Neon Green | #44FF88 | Target orbs (numbered) |
| Target Hit | Gold | #FFD700 | Target orb after correct hit |
| Wall | Dark Gray | #333344 | Standard wall obstacles |
| Wall Bomb | Danger Red | #FF4444 | Wall-bomb (laser = death) |
| Timer Normal | White | #FFFFFF | Timer text, normal state |
| Timer Warning | Orange | #FF8800 | Timer text when <8s remaining |
| Timer Critical | Red | #FF2244 | Timer text when <4s, pulsing |
| UI Text | Light Gray | #E0E4EC | Score, stage labels |
| Emitter | Bright Red | #FF0044 | Laser emitter device |
| Prism | Cyan | #00FFCC | Prism element |
| Filter Red | Red tint | #FF224480 | Red filter overlay |
| Filter Blue | Blue tint | #2288FF80 | Blue filter overlay |
| Success | Bright Green | #44FF88 | Stage clear flash |

### 4.3 SVG Specifications

All graphics rendered as inline SVG strings in config.js, registered as textures in BootScene via `textures.addBase64()`.

**Mirror (45-degree /)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <rect x="2" y="2" width="36" height="36" rx="3" fill="#1A2040" stroke="#333344" stroke-width="1"/>
  <line x1="6" y1="34" x2="34" y2="6" stroke="#C0C8D8" stroke-width="4" stroke-linecap="round"/>
  <line x1="8" y1="32" x2="32" y2="8" stroke="#FFFFFF" stroke-width="1" opacity="0.4"/>
</svg>
```

**Mirror (135-degree \)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <rect x="2" y="2" width="36" height="36" rx="3" fill="#1A2040" stroke="#333344" stroke-width="1"/>
  <line x1="6" y1="6" x2="34" y2="34" stroke="#C0C8D8" stroke-width="4" stroke-linecap="round"/>
  <line x1="8" y1="8" x2="32" y2="32" stroke="#FFFFFF" stroke-width="1" opacity="0.4"/>
</svg>
```

**Target Orb (numbered)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
  <circle cx="18" cy="18" r="14" fill="#44FF88" opacity="0.3"/>
  <circle cx="18" cy="18" r="10" fill="#44FF88" opacity="0.6"/>
  <circle cx="18" cy="18" r="6" fill="#44FF88"/>
  <text x="18" y="23" text-anchor="middle" fill="#0A0E1A" font-size="14" font-weight="bold">{N}</text>
</svg>
```
Note: Generate separate SVG per number (target_1, target_2, ... target_7).

**Target Hit (gold state)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
  <circle cx="18" cy="18" r="14" fill="#FFD700" opacity="0.4"/>
  <circle cx="18" cy="18" r="10" fill="#FFD700" opacity="0.7"/>
  <circle cx="18" cy="18" r="6" fill="#FFD700"/>
  <text x="18" y="23" text-anchor="middle" fill="#0A0E1A" font-size="14" font-weight="bold">OK</text>
</svg>
```

**Laser Emitter**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <rect x="4" y="8" width="32" height="24" rx="4" fill="#331122" stroke="#FF0044" stroke-width="2"/>
  <circle cx="32" cy="20" r="5" fill="#FF2244"/>
  <circle cx="32" cy="20" r="3" fill="#FF4466"/>
  <rect x="8" y="14" width="18" height="12" rx="2" fill="#220011"/>
</svg>
```

**Wall Block**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <rect x="2" y="2" width="36" height="36" rx="2" fill="#333344" stroke="#444466" stroke-width="1"/>
  <line x1="2" y1="14" x2="38" y2="14" stroke="#444466" stroke-width="1"/>
  <line x1="2" y1="26" x2="38" y2="26" stroke="#444466" stroke-width="1"/>
</svg>
```

**Wall Bomb (red)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <rect x="2" y="2" width="36" height="36" rx="2" fill="#441111" stroke="#FF4444" stroke-width="2"/>
  <line x1="10" y1="10" x2="30" y2="30" stroke="#FF4444" stroke-width="2"/>
  <line x1="30" y1="10" x2="10" y2="30" stroke="#FF4444" stroke-width="2"/>
</svg>
```

**Prism**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <polygon points="20,4 36,36 4,36" fill="#00FFCC" opacity="0.5" stroke="#00FFCC" stroke-width="2"/>
  <polygon points="20,10 30,32 10,32" fill="#00FFCC" opacity="0.3"/>
</svg>
```

**Empty Grid Cell**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <rect x="1" y="1" width="38" height="38" fill="#0A0E1A" stroke="#1A2040" stroke-width="1"/>
</svg>
```

**Bomb Timer Icon**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="14" r="9" fill="#441111" stroke="#FF4444" stroke-width="2"/>
  <line x1="12" y1="5" x2="12" y2="2" stroke="#FF8800" stroke-width="2" stroke-linecap="round"/>
  <circle cx="12" cy="14" r="3" fill="#FF2244"/>
</svg>
```

**Design Constraints**:
- All SVG elements use basic shapes only (rect, circle, line, polygon, text)
- Maximum 8 path/shape elements per SVG object
- Grid cell size: 48x48px minimum on smallest supported viewport (360px wide)
- Laser beam rendered as Phaser Graphics line with glow effect (not SVG)
- Animations via Phaser tweens, not SVG animate

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Laser glow | Always (beam visible) | Phaser Graphics: draw line with lineWidth 6 at alpha 0.3 (glow), then lineWidth 2 at alpha 1.0 (core). Color: #FF2244 |
| Mirror place flash | Mirror placed on grid | White circle flash at cell center, alpha 1.0 -> 0.0 over 150ms, scale 0.5 -> 1.5 |
| Target hit burst | Laser hits correct-order target | 12 particles from target center, colors #44FF88/#FFD700, speed 80-160px/s, lifespan 400ms. Target orb scale punch 1.0 -> 1.4 -> 1.0 over 200ms |
| Stage clear sweep | All targets hit in order | White horizontal line sweeps top-to-bottom over 300ms, all elements briefly flash white. Score text flies up. 400ms delay then next stage loads |
| Explosion (death) | Wrong order / timer / wall-bomb | Camera shake 12px for 400ms. Red-orange expanding circle from failure point, alpha 1.0 -> 0.0 over 500ms. 20 debris particles (orange/red), speed 100-200px/s, lifespan 600ms. Screen flashes red for 100ms |
| Timer pulse | Timer <4s | Timer text scales 1.0 -> 1.2 -> 1.0 every 500ms, color #FF2244 |
| Timer warning | Timer <8s | Timer text color transitions to #FF8800 |
| Mirror rotate | Mirror tapped to rotate | Mirror sprite rotates 90 degrees over 100ms with easeOutQuad |
| Grid cell hover | Tap on empty cell | Cell briefly highlights (#1A2040 -> #2A3060) for 100ms before mirror appears |
| Bomb timer tick | Timer <5s | Bomb icon pulses red glow, expanding ring at timer position every 1s |

---

## 5. Audio Design

### 5.1 Sound Effects

All sounds generated via Web Audio API oscillators (no external audio files). Phaser's `this.sound` with generated audio buffers.

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Mirror place | Metallic click-snap. Square wave 600Hz->300Hz sweep | 120ms | High |
| Mirror rotate | Short metallic scrape. Triangle wave 500Hz->400Hz ascending | 100ms | High |
| Mirror remove | Soft reverse click. Sine wave 300Hz->200Hz | 100ms | Medium |
| Laser bounce (on mirror) | Sharp high-pitched PING. Sine wave 1600Hz, quick decay 60ms | 80ms | High |
| Target hit (correct order) | Rising chime, pitch increases per target. Sine 880Hz * (1 + 0.15 * targetNumber) | 200ms | High |
| All targets complete | Harmonic major chord (C-E-G). Three sines: 523Hz, 659Hz, 784Hz | 800ms | High |
| Stage clear | Ascending arpeggio. Sine 523->659->784->1047Hz, 80ms each | 600ms | High |
| Wrong order hit | Dissonant buzz-clang. Sawtooth 150Hz + 173Hz | 300ms | Critical |
| Timer expire | Deep rumble. Sine 80Hz with amplitude modulation | 500ms | Critical |
| Explosion (death) | Heavy bass impact. White noise burst + sine 100Hz->40Hz | 600ms | Critical |
| Timer tick (last 5s) | Soft ticking. Square wave 800Hz, 15ms on, increasing tempo | 200ms per tick | Medium |
| UI button press | Subtle click. Square wave 1000Hz, 20ms | 80ms | Low |
| Laser hum | Low continuous hum. Sine 60Hz, very subtle -20dB, looping | Looping | Low |

### 5.2 Music Concept

**Background Music**: No continuous music track -- the game relies on ambient sound design. A low ominous drone plays during gameplay (generated dark synth pad via Web Audio API, looping 8s). Intensity subtly increases as timer drops below 10s (add pulsing bass). This keeps the atmosphere tense without distracting from puzzle-solving concentration.

**Music State Machine**:
| Game State | Music Behavior |
|-----------|---------------|
| Menu | Ambient synth pad, calm, looping 8s |
| Gameplay (timer >10s) | Low drone, subtle tension |
| Gameplay (timer <10s) | Drone + pulsing bass added |
| Gameplay (timer <5s) | Drone + bass + ticking percussion |
| Stage Clear | Brief triumphant sting, 600ms |
| Game Over | Drone cuts, somber descending tone, 1s fade |
| Pause | All audio volume to 20% |

**Audio Implementation**: Web Audio API via Phaser's built-in sound manager. No Howler.js dependency -- keeps bundle smaller and avoids extra CDN dependency.

---

## 6. UI/UX

### 6.1 Screen Flow

```
+----------+     +----------+     +----------+
|  Boot    |---->|   Menu   |---->|   Game   |
|  Scene   |     |  Screen  |     |  Screen  |
+----------+     +-----+----+     +----------+
                    |   |                |
               +----+   |           +---+----+
               |        |           |  Pause |-->+--------+
          +----+----+   |           | Overlay|   |  Help  |
          |  Help   |   |           +---+----+   |How2Play|
          |How 2Play|   |               |        +--------+
          +---------+   |          +----+----+
                        |          |  Game   |
                        |          |  Over   |
                        |          | Screen  |
                        |          +----+----+
                        |               |
                        |          +----+----+
                        |          | Ad /    |
                        |          |Continue |
                        |          | Prompt  |
                        |          +---------+
```

### 6.2 HUD Layout

```
+-------------------------------+
| Score: 450   Stg 3   [25s]   |  <-- Top bar (48px, always visible)
+-------------------------------+
|                               |
|    +--+--+--+--+--+          |
|    |  |EM|  |  |T1|          |
|    +--+--+--+--+--+          |
|    |  |  |  |WL|  |          |  <-- Grid area (centered)
|    +--+--+--+--+--+          |      Cell size: 48-56px
|    |T2|  |WL|  |  |          |      depending on viewport
|    +--+--+--+--+--+          |
|    |  |  |  |T3|  |          |
|    +--+--+--+--+--+          |
|    |  |  |  |  |  |          |
|    +--+--+--+--+--+          |
|                               |
+-------------------------------+
| Mirrors: 4/4    [?]    [||]  |  <-- Bottom bar (56px)
+-------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left | Current score with scale punch on change | Every score event |
| Stage | Top-center | "Stg {N}" | On stage transition |
| Timer | Top-right | Countdown seconds with bomb icon, color-coded | Every second (red flash <4s) |
| Mirror Inventory | Bottom-left | "Mirrors: {placed}/{total}" | On mirror place/remove |
| Help Button | Bottom-center-right | "?" circle icon, 44x44px | Always visible |
| Pause Button | Bottom-right | "||" icon, 44x44px | Always visible during gameplay |
| Combo/Streak | Below top bar, center | "x1.5 STREAK" text, fades in/out | On streak milestone |

### 6.3 Menu Structure

**Main Menu (MenuScene)**:
- Game title "MIRROR LOGIC" in large neon-glow text (centered, top third)
- Laser beam animation across title (decorative)
- **PLAY** button (large, centered, 200x64px, neon green border #44FF88, pulse animation)
- **How to Play [?]** button (below PLAY, 150x48px, visible and prominent)
- **High Score** display (bottom area, shows best score and best stage)
- **Sound toggle** (speaker icon, top-right, 44x44px)

**Pause Menu** (semi-transparent overlay, #0A0E1A at 80% opacity):
- **Resume** button (largest, centered)
- **How to Play [?]** button
- **Restart** button
- **Quit to Menu** button

**Game Over Screen**:
- "DETONATED!" text with explosion animation (or "TIME'S UP!" for timer death)
- Final Score (large, animated count-up)
- "NEW BEST!" indicator if applicable (gold text, particle burst)
- Stage Reached ("Stage {N}")
- "Watch Ad to Continue" button (if available, once per game)
- **Play Again** button (prominent, green)
- **Menu** button (smaller, gray)

**Help / How to Play Screen (HelpScene)** (full overlay):
- Title: "HOW TO PLAY"
- **Section 1 -- Controls** (with SVG diagrams):
  - Diagram showing grid with hand icon tapping empty cell -> mirror appears
  - Diagram showing hand tapping mirror -> mirror rotates
  - Diagram showing hand long-pressing mirror -> mirror removed
  - Text: "TAP empty cell = Place mirror | TAP mirror = Rotate | HOLD mirror = Remove"
- **Section 2 -- Rules**:
  - "Route the laser through targets IN ORDER: 1 -> 2 -> 3..."
  - "Wrong order = BOOM! Timer runs out = BOOM!"
  - SVG diagram: laser bouncing off mirror hitting target 1 then 2 (correct path shown in green)
  - SVG diagram: laser hitting target 2 first (wrong, shown with red X)
- **Section 3 -- Scoring**:
  - "Clear stages fast for time bonus"
  - "Chain stages without dying for streak multiplier"
  - "No mirror removals = Perfect bonus"
- **Section 4 -- Tips**:
  - "Tip 1: Trace the laser path mentally before placing mirrors"
  - "Tip 2: Start from the last target and work backwards"
  - "Tip 3: Tap mirrors to rotate -- sometimes / and \\ make all the difference"
- **"GOT IT!" button** (bottom, large, returns to previous scene)
- Scrollable if content exceeds viewport. Matches game color palette (dark bg, neon accents).

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | "Continue from current stage" after death | Every game over (optional) | Always (optional) |
| Rewarded | Double final score | Game over screen (optional) | Always (optional) |

**Note**: POC stage -- ad integration is placeholder hooks only. No actual ad SDK integrated.

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Continue | Watch rewarded ad after death | Resume from current stage with full timer reset | Once per game |
| Score Double | Watch rewarded ad at game over | 2x final score (for high score purposes) | Once per session |

### 7.3 Session Economy

**Session Flow with Monetization**:
```
[Play Free] --> [Death] --> [Rewarded Ad: Continue?]
                              | Yes --> [Resume current stage + Interstitial later]
                              | No  --> [Game Over Screen]
                                          |
                                    [Interstitial Ad (every 3rd game over)]
                                          |
                                    [Rewarded Ad: Double Score?]
                                          | Yes --> [Score doubled, new high score check]
                                          | No  --> [Play Again / Menu]
```

Expected: 1-2 rewarded ad views per session, 1 interstitial per 3 sessions. Player-friendly, non-intrusive.

---

## 8. Retention System

### 8.1 Meta Progression

**High Score Chase**: The primary retention driver. Best score and highest stage reached displayed prominently on the menu screen. Every session, the player tries to beat their personal best. The streak multiplier (up to 3.0x) creates exponential scoring potential for skilled players.

**Stage Milestone Unlocks**: New visual elements unlock as the player reaches milestones:
- Stage 5: Unlock silver mirror skin (cosmetic)
- Stage 10: Unlock gold laser beam color option
- Stage 20: Unlock "Expert" title on menu
- Stage 30: Unlock neon purple grid theme
- Stored in localStorage, displayed on menu

### 8.2 Daily Hook

**Daily Puzzle**: Each day (seeded by date), a hand-crafted "Daily Challenge" stage is available from the menu. Fixed layout, global-leaderboard scoring potential (time to solve). Completing the daily awards a "streak badge" -- consecutive days played.

**Daily Streak Counter**: "Day 3" shown on menu. Reaching 7 days unlocks a cosmetic. The counter resets if a day is missed.

### 8.3 Social Mechanic

**Score Sharing**: After game over, a "Share" button generates a text summary: "I reached Stage 14 with 2450 pts in Mirror Logic! Can you beat my laser path?" -- copyable to clipboard for social media.

**Ghost Replay**: localStorage saves the player's best run as a sequence of mirror placements. On the menu, a "Watch Best Run" button replays the laser path of their highest-scoring session as a satisfying visual.

---

## 9. Juice Specification

### 9.1 Player Input Feedback (applied to every tap on grid)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Tapped cell | Count: 6, Direction: radial outward, Color: #C0C8D8 (mirror chrome), Lifespan: 250ms, Speed: 40-80px/s |
| Scale punch | Placed/rotated mirror | Scale: 1.0 -> 1.3 -> 1.0, Recovery: 120ms, Ease: easeOutBack |
| Cell flash | Grid cell background | #1A2040 -> #3A4060 -> #1A2040 over 150ms |
| Sound | -- | Metallic click-snap, Pitch: base 440Hz +/- 10% random variation |
| Haptic | Device | navigator.vibrate(15) on supported devices |

### 9.2 Core Action Feedback: Target Hit (most satisfying moment)

| Effect | Values |
|--------|--------|
| Particles | Count: 15, Direction: radial burst from target center, Colors: #44FF88 + #FFD700, Lifespan: 400ms, Speed: 80-160px/s, Gravity: 50px/s2 |
| Hit-stop | 40ms freeze on all game objects (not timer -- timer keeps ticking for tension) |
| Camera zoom | 1.0 -> 1.04x centered on hit target, Recovery: 250ms, Ease: easeOutQuad |
| Target scale punch | 1.0 -> 1.5 -> 1.0 over 200ms |
| Target color shift | #44FF88 -> #FFD700 over 150ms (green to gold) |
| Floating text | "+100" in #FFD700, rises 50px, fades over 500ms |
| Sound | Rising chime, pitch: 440Hz * (1 + 0.15 * targetNumber). Target 1 = C5, Target 2 = D5, Target 3 = E5, etc. |
| Combo escalation | Each consecutive target hit in same stage: particle count +5, scale punch +0.1, sound pitch +100 cents |
| Laser beam flash | Beam segment from emitter to hit target flashes white (#FFFFFF) for 100ms, then returns to #FF2244 |

### 9.3 Stage Clear Effects

| Effect | Values |
|--------|--------|
| Screen flash | White flash, alpha 0.0 -> 0.6 -> 0.0 over 200ms |
| All targets pulse | Simultaneous gold pulse, scale 1.0 -> 1.3 -> 1.0 over 300ms |
| Harmonic chord | Major chord (C-E-G): sines at 523Hz, 659Hz, 784Hz, 600ms duration, volume 0.7 |
| Laser beam flash | Beam color #FF2244 -> #FFFFFF -> fade over 300ms |
| Score fly-up | Total stage score rises from center to top-left score position over 400ms |
| Camera shake | Gentle: 3px, 150ms (celebratory) |
| Transition delay | 500ms of celebration, then wipe to next stage |

### 9.4 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 12px, Duration: 400ms, Decay: linear |
| Explosion particles | Count: 25, Colors: #FF4444 / #FF8800 / #FFD700, Speed: 100-250px/s, Lifespan: 600ms, Gravity: 80px/s2 |
| Expanding blast circle | From failure point, radius 0 -> 200px over 400ms, color #FF4444 alpha 0.8 -> 0.0 |
| Screen flash | Red (#FF2244) at alpha 0.5, 100ms |
| Screen desaturation | Apply grayscale tween on camera over 300ms after explosion |
| Sound | Heavy bass impact (80Hz, 200ms) + crumbling debris (white noise filtered, 400ms) |
| Effect -> UI delay | 700ms (explosion plays, then game over screen slides in) |
| Death -> restart | **1.5 seconds** total (700ms effects + 800ms game over appear). "Play Again" tap = instant restart (<200ms to new stage 1). |

### 9.5 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{points}" in #FFD700, Font: 24px bold monospace, Movement: up 60px over 500ms, Fade: alpha 1.0 -> 0.0 over 500ms |
| Score HUD punch | Scale 1.0 -> 1.3 -> 1.0 over 150ms on score change |
| Streak text | "x{N} STREAK!" in #44FF88 at center, font 32px, scale punch 0.5 -> 1.2 -> 1.0 over 300ms, fade after 1000ms |
| High score text | "NEW BEST!" in #FFD700, persistent on game over screen, shimmer animation (alpha oscillate 0.7 - 1.0) |

### 9.6 Timer Juice

| Timer State | Effect |
|-------------|--------|
| Normal (>8s) | White text #FFFFFF, static, bomb icon steady |
| Warning (<8s) | Text color transitions to #FF8800, subtle scale pulse 1.0 -> 1.05 -> 1.0 per second, bomb icon starts pulsing |
| Critical (<4s) | Text color #FF2244, aggressive scale pulse 1.0 -> 1.2 -> 1.0 every 500ms, screen border faintly glows red (2px red border at alpha 0.3, pulsing) |
| Last second | Text flashes rapidly (100ms on/off), ticking sound accelerates, bomb icon shakes 2px |

### 9.7 Laser Beam Juice

| State | Effect |
|-------|--------|
| Default beam | Core: 2px line #FF2244 alpha 1.0. Glow: 6px line #FF2244 alpha 0.3. Subtle animated noise along beam (1px offset oscillation) |
| Beam on mirror bounce | Brief flash at bounce point: white circle 8px -> 0px over 100ms. PING sound. |
| Beam through target | Target glows brighter momentarily: alpha 0.6 -> 1.0 -> 0.6 over 200ms |
| Prism split | Rainbow flash at prism: 10 particles in spectrum colors, lifespan 300ms. Two beams emerge in #FF2244 (red) and #2288FF (blue) |

---

## 10. Technical Architecture

### 10.1 File Structure and Budget

```
games/mirror-logic/
+-- index.html              # Entry point (~20 lines)
|   +-- CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
|   +-- Local CSS           # css/style.css
|   +-- Local JS (ordered)  # config -> stages -> ads -> ui -> game -> main (LAST)
+-- css/
|   +-- style.css           # Responsive styles, mobile-first (~30 lines)
+-- js/
    +-- config.js           # Game constants, SVG strings, difficulty tables, color palette (~70 lines)
    +-- main.js             # BootScene, Phaser init, global state, scene registration (~55 lines)
    +-- game.js             # GameScene: grid, laser tracing, mirror placement, input, collision (~280 lines)
    +-- stages.js           # Stage generation algorithm, difficulty scaling, solvability check (~80 lines)
    +-- ui.js               # MenuScene, GameOverScene, HUD overlay, PauseOverlay, HelpScene (~250 lines)
    +-- ads.js              # Ad placeholder hooks, reward callbacks (~40 lines)
```

**File Budget Summary**:

| File | Target Lines | Max Lines | Responsibility |
|------|-------------|-----------|----------------|
| index.html | ~20 | 25 | Viewport meta, CDN Phaser, script load order |
| style.css | ~30 | 40 | Responsive layout, game container, portrait lock |
| config.js | ~70 | 80 | COLOR constants, NUMERIC parameters, SVG strings, difficulty tables |
| main.js | ~55 | 60 | BootScene (texture registration), Phaser config, GameState, scene array |
| game.js | ~280 | 300 | Core gameplay: grid, laser tracing, mirror placement, input, collision |
| stages.js | ~80 | 100 | Stage generation, difficulty scaling, solvability validation |
| ui.js | ~250 | 280 | MenuScene, GameOverScene, HUD, PauseOverlay, HelpScene |
| ads.js | ~40 | 50 | Ad placeholder hooks, reward callbacks |

**Script load order in index.html**: `config.js` -> `stages.js` -> `ads.js` -> `ui.js` -> `game.js` -> `main.js` (LAST -- mandatory, prevents "Scene not defined" errors).

### 10.2 Module Responsibilities

**config.js** (target: ~70 lines):
- `COLORS` object: all hex color constants from palette
- `GRID` object: cell sizes, grid dimensions per stage range
- `DIFFICULTY` object: target counts, wall counts, timer values, mirror budgets per stage range
- `SCORING` object: base points, multipliers, streak thresholds
- `SVG_STRINGS` object: all SVG markup as template literal strings (mirror_45, mirror_135, target_1..7, target_hit, emitter, wall, wall_bomb, prism, empty_cell, bomb_icon)
- `TIMER` object: base timer (25), warning threshold (8s), critical threshold (4s)

**main.js** (target: ~55 lines):
- `BootScene`: Register all SVG textures via `textures.addBase64()` (called once, never again on restart). Listen for `addtexture` events to sequence scene startup.
- Phaser.Game config: `{ type: Phaser.AUTO, width: 360, height: 640, scale: { mode: Phaser.Scale.FIT, parent: 'game-container' }, backgroundColor: '#0A0E1A', scene: [BootScene, MenuScene, GameScene, UIScene, HelpScene] }`
- `GameState` global: `{ score, highScore, stage, streak, gamesPlayed, settings }` -- initialized from localStorage
- localStorage read/write helpers

**game.js** (target: ~280 lines -- largest file):
- `GameScene.create()`: Build grid from stage data, place emitter/targets/walls, init input handlers, start timer
- `GameScene.update()`: Render cached laser path via Graphics, update timer display
- `traceLaser()`: Ray-march from emitter through grid, compute reflections on mirrors, detect target/wall intersections, return path array + hitTargets array. Called ONLY on mirror state change (not every frame).
- `reflectDirection(dir, mirrorAngle)`: Pure math -- flip direction vector based on mirror type (/ or \)
- `handleCellTap(pointer)`: Convert screen coords to grid coords, place/rotate/noop based on cell state
- `handleCellLongPress(pointer)`: Remove mirror from cell
- `checkTargetOrder(hitTargets)`: Validate sequence, trigger explosion or stage clear
- `triggerExplosion(point)`: Death effects, camera shake, transition to GameOverScene
- `triggerStageClear()`: Clear effects, score calculation, load next stage
- Mirror inventory tracking (placed vs available)

**stages.js** (target: ~80 lines):
- `generateStage(stageNumber)`: Returns `{ gridWidth, gridHeight, emitter: {x,y,dir}, targets: [{x,y,num}], walls: [{x,y,type}], prisms: [{x,y}], filters: [{x,y,color}], mirrorBudget, timer, onewayMirrors: [{x,y,dir}] }`
- `validateSolvability(stageData)`: Verify a valid solution path exists
- `getDifficultyParams(stageNumber)`: Returns difficulty tier parameters
- Seeded random number generator (deterministic per stage)

**ui.js** (target: ~250 lines):
- `MenuScene`: Title text with glow, PLAY button, help button, high score display, sound toggle
- `UIScene`: Launched parallel to GameScene (HUD overlay)
  - Score text, stage text, timer text, mirror inventory text
  - Updated via Phaser events from GameScene
- `GameOverScene`: Death type text, final score with count-up animation, high score check, Play Again / Continue (ad) / Menu buttons
- `HelpScene`: Full help overlay with SVG control diagrams, rules, tips, "GOT IT!" button
- `PauseOverlay`: Semi-transparent overlay within GameScene, Resume / Help / Restart / Quit buttons
- All button tap targets minimum 44x44px

**ads.js** (target: ~40 lines):
- `AdManager.showInterstitial(callback)`: Placeholder, immediately calls callback
- `AdManager.showRewarded(onReward, onSkip)`: Placeholder, immediately calls onReward
- `AdManager.shouldShowInterstitial()`: Returns true every 3rd game over
- Session tracking for ad frequency
- No actual ad SDK -- POC stage stubs only

### 10.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No Howler.js needed -- all audio via Web Audio API oscillators through Phaser's sound manager. Keeps dependency count minimal and JS size small.

### 10.4 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | Performance.timing API |
| Memory Usage | <80MB | Chrome DevTools Memory panel |
| JS Bundle Size | <150KB total (excl. CDN) | File size check |
| First Interaction | <1 second after load | Time to first meaningful paint |
| Laser trace computation | <2ms per call | Performance.now() around traceLaser() |

### 10.5 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Use Phaser's input system with `pointer` events (handles both touch and mouse)
- **Prevent Default**: CSS `touch-action: none` on game container. Prevent pull-to-refresh via `overscroll-behavior: none`
- **Orientation**: Portrait mode enforced. On landscape, show "Please rotate device" overlay via CSS `@media (orientation: landscape)`.
- **Safe Areas**: CSS `env(safe-area-inset-top)` etc. for notch handling
- **Background/Focus**: Phaser's `blur` event -> auto-pause game timer and laser. `focus` event -> show pause overlay.
- **Asset Loading**: All SVGs generated in code, registered once in BootScene. No external asset loading.
- **Grid Cell Sizing**: `cellSize = Math.min(Math.floor((viewportWidth - 40) / gridWidth), Math.floor((viewportHeight - 160) / gridHeight))`. Minimum 48px, maximum 64px. Grid centered horizontally.
- **Object Pooling**: Particle pool of 50 sprites, reused across all effects. Grid cell sprites pooled per board size (48 max).

### 10.6 Laser Trace Performance

- Laser path recomputed ONLY when mirror state changes (place/rotate/remove), NOT every frame
- Cache the computed path as array of line segments
- Render cached path each frame via `Phaser.GameObjects.Graphics` (clear + redraw is fast)
- Maximum 20 bounces hard cap prevents infinite loops
- Prism splits limited to 2 total beams maximum

### 10.7 Critical Implementation Patterns

1. **BootScene texture registration**: ALL SVG strings from config.js are converted via `btoa()` and registered with `textures.addBase64()` ONCE in BootScene. Never re-register on scene restart.
2. **Script load order**: index.html loads: config.js -> stages.js -> ads.js -> ui.js -> game.js -> main.js (LAST). main.js references all other scenes by class name.
3. **Grid coordinate system**: Grid stored as 2D array `grid[col][row]`. Screen position = `{ x: gridOffsetX + col * cellSize + cellSize/2, y: gridOffsetY + row * cellSize + cellSize/2 }`. Pointer-to-grid conversion: `col = Math.floor((pointer.x - gridOffsetX) / cellSize)`, same for row.
4. **Timer uses setTimeout, not Phaser time.delayedCall**: Avoids timeScale=0 freeze bug. Timer decrements via `setInterval(1000)`, cleared on stage clear or death. Pausing sets a flag that skips the decrement.
5. **No body removal in callbacks**: If using any physics (not expected for this puzzle game), defer removal with `this.time.delayedCall(0, ...)`.
6. **HUD initialization from GameState**: Timer text initializes from `stageData.timer`, score text from `GameState.score` -- never hardcoded literals. Prevents display bugs on scene restart.
7. **Resize handler**: On `resize` event, recalculate cellSize and gridOffset, reposition all grid elements. Debounce at 100ms.
8. **Parallel UIScene**: UIScene runs parallel to GameScene. Communication via Phaser events (`this.events.emit / scene.get('UIScene').events`). All event handlers null-guarded.
9. **Text depth vs button depth**: Ensure text objects at higher depth do not block button pointer events. Either make both interactive or disable text hit testing.
10. **No duplicate state updates**: Timer countdown handled by single setInterval only. Never also decrement in update() loop.

### 10.8 Edge Cases

| Scenario | Handling |
|----------|----------|
| Player taps outside grid | Ignore input, no response |
| Player taps occupied cell (wall/target/emitter) | Ignore input, brief red flash on cell |
| All mirrors placed, none left | Show "No mirrors left" text briefly. Player must remove one to place another. |
| Browser tab backgrounded | Pause timer via visibilitychange. Resume on return with pause overlay. |
| Rapid double-tap on cell | Debounce: 150ms cooldown between cell state changes |
| Landscape orientation | Show overlay "Rotate to Portrait" with phone icon. Pause game. |
| Prism creates >2 beams | Hard cap: only first 2 beams from prisms traced. Additional prism hits ignored. |
| Laser stuck in loop (mirrors facing each other) | 20-bounce hard cap terminates beam. Beam fades at termination point. |
| Stage generation fails solvability | Re-generate with seed+1 until solvable (max 10 attempts, then fallback to hand-crafted template) |
| Scene restart texture collision | All textures registered in BootScene only. GameScene restart never calls addBase64 again. |

### 10.9 Testing Checkpoints

1. **Checkpoint 1**: Grid renders correctly on 360px and 414px viewports. Cells are tappable. Emitter and targets display with correct numbers.
2. **Checkpoint 2**: Mirror placement works. Tap empty cell = mirror appears. Tap mirror = rotates. Long press = removes. Mirror inventory updates.
3. **Checkpoint 3**: Laser traces from emitter, reflects off mirrors correctly (/ and \ both work). Beam renders with glow effect.
4. **Checkpoint 4**: Target order validation works. Correct order = stage clear with effects. Wrong order = explosion + game over.
5. **Checkpoint 5**: Timer counts down. <8s = orange, <4s = red pulse. 0 = explosion death.
6. **Checkpoint 6**: Stage progression works. New elements appear at correct milestones (walls at 6+, prisms at 13+).
7. **Checkpoint 7**: Score system complete. Streak multiplier, time bonus, perfect bonus all calculate correctly.
8. **Checkpoint 8**: All screens navigate correctly. Menu -> Help -> Menu. Game -> Pause -> Help -> Pause -> Resume. Death -> Game Over -> Play Again.
9. **Checkpoint 9**: Death within 20-25s of inactivity (bomb timer). Death -> restart < 2 seconds.
10. **Checkpoint 10**: No console errors. Resize works. Portrait/landscape overlay works.

### 10.10 Local Storage Schema

```json
{
  "mirror_logic_high_score": 0,
  "mirror_logic_games_played": 0,
  "mirror_logic_highest_stage": 0,
  "mirror_logic_settings": {
    "sound": true,
    "vibration": true
  },
  "mirror_logic_total_score": 0,
  "mirror_logic_best_streak": 0,
  "mirror_logic_daily_streak": 0,
  "mirror_logic_last_daily_date": "",
  "mirror_logic_unlocks": []
}
```
