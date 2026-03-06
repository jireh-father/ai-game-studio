# Game Design Document: Pipe Paradox

**Slug**: `pipe-paradox`
**One-Liner**: Route flows through pipes where the RULES of flow change every 5 seconds.
**Core Mechanic**: Tap grid cells to place/rotate pipe segments connecting sources to drains. Every 5 seconds a flow-rule mutates (gravity flips, T-junctions become dead ends, flow reverses). Build networks robust enough to survive rule shifts. 3 overflows = game over.
**Target Session Length**: 3-5 minutes
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Pipe Paradox is a real-time puzzle game where players place pipe segments on a grid to route flow from sources to drains. The twist: every 5 seconds, a fundamental flow rule mutates. Water might suddenly flow upward instead of down, T-junctions might become dead ends, or the entire flow direction might reverse. Players cannot change pipes already placed -- they must think ahead and build networks resilient enough to survive unpredictable rule shifts.

The game creates a unique tension between the calm deliberation of pipe-routing puzzles and the panic of a ticking clock. Each rule shift forces players to re-evaluate their entire network in an instant. Unrouted flow builds pressure in pipes, and if pressure reaches maximum on any pipe, it overflows. Three overflows end the game.

What makes this genuinely original is the meta-layer: you are not just solving a puzzle, you are solving a puzzle whose definition keeps changing. The "paradox" is that the optimal pipe layout under one ruleset becomes catastrophic under another.

### 1.2 Target Audience

Casual mobile gamers aged 16-45 who enjoy puzzle games with time pressure. Players who like Tetris, pipe-dream classics, or flow-connect games but want something that feels fresh and unpredictable. Play context: short bursts during commutes, breaks, or waiting -- each session is self-contained and intense.

### 1.3 Core Fantasy

You are a panicking engineer trying to keep a plumbing system alive as the laws of physics keep changing around you. The satisfaction comes from building a network that survives a rule shift you did not expect, or from the frantic last-second pipe placement that saves you from overflow.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 3-5 minutes |
| Day 1 Retention | 40%+ |
| Day 7 Retention | 20%+ |
| Average Stages per Session | 3-8 rule cycles survived |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Flow starts from source] --> [Place/rotate pipes to route flow] --> [Rule shift countdown]
       ^                                                                       |
       |                                                          [Rule mutates!]
       |                                                                       |
       +--- [Adapt network / place new pipes] <--- [Survive or overflow] ------+
                                                          |
                                                   [3 overflows = GAME OVER]
```

**Moment-to-moment**: The player sees flow emitting from source nodes. They tap empty grid cells to cycle through pipe types (straight, elbow, T-junction, cross). Flow travels through connected pipes toward drain nodes. A countdown timer (top of screen) shows seconds until the next rule shift. When it hits zero, a new rule activates -- the flow behavior changes immediately. The player must quickly assess whether their existing network still works and place/rotate pipes to fix any breaks. If flow has nowhere to go, pressure builds in the blocked pipe. At max pressure, that pipe overflows (1 of 3 allowed).

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Place pipe | Tap empty cell | Cycles through pipe types: straight-H, straight-V, elbow-1, elbow-2, elbow-3, elbow-4, T-up, T-down, T-left, T-right, cross |
| Rotate pipe | Tap existing pipe | Rotates the pipe 90 degrees clockwise |
| Remove pipe | Long press (400ms) | Removes pipe from cell, returns to empty |

**Control Philosophy**: Single-finger tap-only controls. No dragging, no multi-touch. Every interaction is a quick tap. Speed of placement matters because flow is always moving. The pipe type cycles on each tap so players can quickly get the piece they need (max 4 taps for any rotation of any piece).

**Touch Area Map**:
```
+-------------------------------+
| Score: 1250   Rule: NORMAL  3 |  <-- HUD bar (48px height)
| [?]  Timer: 4s   Overflows: 1 |
+-------------------------------+
|   |   |   |   |   |   |       |
|---+---+---+---+---+---+       |  <-- Grid area (6 columns x 8 rows)
|   | S |   |   |   |   |       |      Each cell: ~56x56px on 390px wide screen
|---+---+---+---+---+---+       |      S = source, D = drain
|   |   |   |   |   |   |       |
|---+---+---+---+---+---+       |
|   |   |   |   | D |   |       |
|---+---+---+---+---+---+       |
|   |   |   |   |   |   |       |
|---+---+---+---+---+---+       |
|   |   |   |   |   |   |       |
|---+---+---+---+---+---+       |
|   |   |   |   |   |   |       |
|---+---+---+---+---+---+       |
|   |   |   |   |   |   |       |
+-------------------------------+
| [Upcoming Rule Card]    [||]  |  <-- Bottom bar (64px) with rule preview + pause
+-------------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Flow reaches drain | +100 | x1.5 if routed through 6+ pipes |
| Survive rule shift | +50 per active connection | x2 if zero pressure buildup during shift |
| Clear all drains simultaneously | +500 | x2 if done within 3s of rule shift |
| Combo: survive consecutive shifts without overflow | +25 per streak | Streak count acts as multiplier (streak x 25) |

**Combo System**: Each consecutive rule shift survived without overflow increments a streak counter. The streak multiplier applies to the "survive rule shift" bonus. Streak resets on overflow. Max display: "x10 STREAK!" at which point bonus is capped at 250 per shift.

**High Score**: Stored in `localStorage` as `pipe_paradox_high_score`. Displayed on menu and game over screen. New high score triggers celebration animation.

### 2.4 Progression System

The game is endless -- there are no discrete stages. Difficulty increases continuously based on time survived (measured in rule-shift cycles completed).

**Progression Milestones**:

| Cycle Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-3 | 1 source, 1 drain. Rules from basic pool (3 rules). Flow speed slow. | Easy -- learn placement |
| 4-8 | 2 sources, 1-2 drains. Rule pool expands to 5. Flow speed +20%. | Medium -- manage multiple flows |
| 9-15 | 2-3 sources, 2-3 drains. Rule pool expands to 7. Rule timer drops to 4s. | Hard -- network complexity |
| 16-25 | 3 sources, 3 drains. Full rule pool (9 rules). Rule timer drops to 3s. | Very Hard -- constant adaptation |
| 26+ | Sources/drains may relocate on rule shift. Compound rules (2 active at once). Timer 3s. | Extreme -- survival mode |

### 2.5 Lives and Failure

The game uses an **overflow system** instead of traditional lives.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Pipe reaches max pressure (flow blocked for 3s) | 1 overflow counted. Pipe explodes, cell becomes empty. | Watch ad to remove 1 overflow (once per game) |
| 3 overflows total | Game over | Watch ad to continue with 1 overflow removed |
| Inactivity for 8 seconds | Pressure builds rapidly on ALL sources (2x rate) | Tap anything to resume normal pressure rate |

**Inactivity Death Guarantee**: If the player does nothing, sources build pressure at 2x rate after 8s idle. With base pressure filling in 5s, a completely idle player will overflow within 13s from game start (8s idle threshold + 5s pressure fill). First overflow at ~13s, second at ~18s, third (death) at ~23s. Well under 30s.

---

## 3. Stage Design

### 3.1 Infinite Stage System (Continuous Mode)

There are no discrete stages. The game runs as a continuous session. The grid persists across rule shifts. Difficulty parameters are recalculated after each rule-shift cycle.

**Generation Algorithm**:
```
After each rule shift cycle:
- cycleNumber += 1
- flowSpeed = BASE_FLOW_SPEED * (1 + cycleNumber * 0.08)  // 8% faster each cycle, capped at 3x
- ruleTimerDuration = max(3.0, 5.0 - cycleNumber * 0.15)  // 5s down to 3s floor
- activeRulePoolSize = min(9, 3 + floor(cycleNumber / 3))  // 3 rules at start, +1 every 3 cycles
- sourceCount = min(3, 1 + floor(cycleNumber / 4))         // +1 source every 4 cycles, max 3
- drainCount = min(3, 1 + floor(cycleNumber / 5))          // +1 drain every 5 cycles, max 3
- compoundRules = cycleNumber >= 26                         // 2 rules active simultaneously
- relocateSources = cycleNumber >= 26                       // sources/drains move on shift
```

### 3.2 Rule System Design

**The Rule Pool** (9 total rules, unlocked progressively):

| # | Rule Name | Effect | Unlock Cycle |
|---|-----------|--------|-------------|
| 1 | **Reverse Flow** | Flow moves from drains toward sources. Sources become drains and vice versa visually. | 1 (always available) |
| 2 | **Gravity Pull** | Flow ignores pipe direction and always moves downward when possible. Horizontal pipes still work. | 1 (always available) |
| 3 | **Anti-Gravity** | Flow always moves upward when possible. | 1 (always available) |
| 4 | **T-Junction Blockade** | All T-junction pipes become dead ends (flow cannot pass through them). | 4 |
| 5 | **Cross Collapse** | Cross (+) pipes become elbows (only one path survives, randomly chosen). | 7 |
| 6 | **Speed Surge** | Flow speed doubles for this cycle. | 10 |
| 7 | **Pressure Wave** | All pipes start at 50% pressure. Must route flow fast or overflow. | 13 |
| 8 | **Fog of Flow** | Flow particles become invisible. Players must track flow mentally. Only pressure meters visible. | 16 |
| 9 | **Mirror Flip** | The entire grid flips horizontally. All pipe connections mirror. Sources/drains swap sides. | 19 |

**Rule Rotation Logic**:
- Each cycle, one rule is randomly selected from the unlocked pool.
- The same rule cannot appear twice in a row.
- At cycle 26+, two rules are active simultaneously (randomly paired, no contradictions -- e.g., Gravity Pull and Anti-Gravity cannot co-occur).
- Rule is announced 2 seconds before activation via the rule preview card at screen bottom.
- Current active rule is displayed in the HUD bar with an icon and name.

**NORMAL rule**: Between rule shifts, there is always a brief "NORMAL" period (the first cycle, and any cycle where the random selection produces no-rule). During NORMAL, standard flow physics apply: flow follows pipe direction.

### 3.3 Flow Simulation Mechanics

**Grid**: 6 columns x 8 rows = 48 cells. Each cell is 56x56px.

**Pipe Types** (5 base types, rotations create 11 visual variants):

| Type | Symbol | Connections | Rotations |
|------|--------|-------------|-----------|
| Straight | `--` | Left-Right | 2 (H, V) |
| Elbow | `L` | connects two adjacent sides at 90 degrees | 4 (each corner) |
| T-Junction | `T` | connects three sides | 4 (open side varies) |
| Cross | `+` | connects all four sides | 1 (symmetric) |
| Empty | `.` | no connections | N/A |

**Flow Behavior**:
1. Flow emits from source nodes at `flowSpeed` pixels per second.
2. Flow travels through connected pipe openings. If pipe A's right opening connects to pipe B's left opening, flow transfers.
3. Flow takes 800ms (at base speed) to traverse one pipe segment.
4. When flow reaches a junction (T or cross), it splits equally into all available paths.
5. When flow reaches a drain, it is consumed. Score event triggered.
6. When flow reaches a dead end (unconnected opening), pressure builds on that pipe.

**Pressure System**:
- Each pipe has a pressure meter: 0% to 100%.
- Pressure increases at 20% per second when flow is blocked (dead end or no connected pipe).
- At 100% pressure, the pipe OVERFLOWS: explosion animation, pipe removed, overflow counter +1.
- Pressure decreases at 10% per second when flow is properly routed away.
- Visual: pressure shown as pipe color shifting from normal copper (#B87333) to warning orange (#FF8C00) at 50% to critical red (#FF0000) at 80%+.
- Pressure meter: thin bar below each pipe cell, fills from left to right.

### 3.4 Source and Drain Placement

- Sources and drains are placed on the grid edges (row 0, row 7, col 0, col 5) to ensure routing requires traversing the grid.
- New sources/drains appear at the start of the cycle where they are introduced (cycles 4, 5, 8, 9, etc.).
- At cycle 26+, sources and drains may relocate to new edge positions on each rule shift.
- Sources pulse with flow animation. Drains have a suction swirl animation.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Blueprint/schematic aesthetic. Dark blue background resembling engineering blueprints. White grid lines. Copper and steel pipes with metallic gradients. Animated flow particles (glowing cyan dots) moving through pipes.

**Aesthetic Keywords**: Blueprint, Industrial, Schematic, Metallic, Technical

**Reference Palette**: Think engineering drawing on dark paper -- precise, clean, slightly retro-industrial.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Dark Blueprint Blue | #0A1628 | Game background |
| Grid Lines | Blueprint Cyan | #1A3A5C | Grid lines and cell borders |
| Pipe Normal | Copper | #B87333 | Pipe segments at 0% pressure |
| Pipe Warning | Orange | #FF8C00 | Pipe segments at 50%+ pressure |
| Pipe Critical | Red | #FF0000 | Pipe segments at 80%+ pressure |
| Flow Particles | Cyan Glow | #00E5FF | Animated flow dots in pipes |
| Source | Green | #00E676 | Source nodes |
| Drain | Amber | #FFD600 | Drain nodes |
| UI Text | White | #FFFFFF | Score, labels, menus |
| UI Accent | Steel Blue | #4FC3F7 | Buttons, highlights |
| Rule Card BG | Dark Slate | #1E2D3D | Rule preview card background |
| Danger Flash | Red | #FF1744 | Overflow flash, danger indicators |
| Streak Text | Gold | #FFD700 | Combo/streak counter |

### 4.3 SVG Specifications

All game graphics rendered as SVG textures registered in BootScene via `textures.addBase64()`.

**Pipe Straight Horizontal**:
```svg
<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="20" width="56" height="16" rx="3" fill="#B87333" stroke="#8B5A2B" stroke-width="2"/>
  <rect x="0" y="24" width="56" height="8" fill="#CD853F" opacity="0.4"/>
</svg>
```

**Pipe Elbow (top-right)**:
```svg
<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg">
  <path d="M28 0 L28 28 L56 28" stroke="#B87333" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M28 0 L28 28 L56 28" stroke="#CD853F" stroke-width="8" fill="none" opacity="0.4" stroke-linecap="round"/>
</svg>
```

**Pipe T-Junction (open bottom)**:
```svg
<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="20" width="56" height="16" rx="3" fill="#B87333" stroke="#8B5A2B" stroke-width="2"/>
  <rect x="20" y="28" width="16" height="28" rx="3" fill="#B87333" stroke="#8B5A2B" stroke-width="2"/>
  <rect x="24" y="24" width="8" height="32" fill="#CD853F" opacity="0.4"/>
</svg>
```

**Pipe Cross**:
```svg
<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="20" width="56" height="16" rx="3" fill="#B87333" stroke="#8B5A2B" stroke-width="2"/>
  <rect x="20" y="0" width="16" height="56" rx="3" fill="#B87333" stroke="#8B5A2B" stroke-width="2"/>
  <circle cx="28" cy="28" r="10" fill="#A0522D"/>
</svg>
```

**Source Node**:
```svg
<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg">
  <circle cx="28" cy="28" r="20" fill="#00E676" opacity="0.3"/>
  <circle cx="28" cy="28" r="14" fill="#00E676"/>
  <circle cx="28" cy="28" r="8" fill="#FFFFFF" opacity="0.6"/>
  <text x="28" y="33" text-anchor="middle" fill="#0A1628" font-size="14" font-weight="bold">S</text>
</svg>
```

**Drain Node**:
```svg
<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg">
  <circle cx="28" cy="28" r="20" fill="#FFD600" opacity="0.3"/>
  <circle cx="28" cy="28" r="14" fill="#FFD600"/>
  <circle cx="28" cy="28" r="8" fill="#0A1628"/>
  <text x="28" y="33" text-anchor="middle" fill="#FFD600" font-size="14" font-weight="bold">D</text>
</svg>
```

**Flow Particle** (animated in code, not static SVG):
```svg
<svg width="8" height="8" xmlns="http://www.w3.org/2000/svg">
  <circle cx="4" cy="4" r="4" fill="#00E5FF"/>
</svg>
```

**Design Constraints**:
- All SVG elements use basic shapes (rect, circle, path) -- max 6 elements per SVG.
- Pipe rotations handled via Phaser `setAngle()` on base textures, not separate SVGs.
- Only 6 base SVG textures needed: straight, elbow, t-junction, cross, source, drain, flow-particle.
- Pressure color shift applied via `setTint()` in Phaser.

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Grid pulse | Rule shift | All grid lines flash #4FC3F7 at full opacity for 200ms, fade back to 30% over 300ms |
| Pipe glow | Pipe placed | White outline glow (additive blend) on placed pipe, 150ms duration |
| Flow particles | Active flow | 3-5 cyan circles moving along pipe path at flowSpeed, looping |
| Pressure color | Pressure > 0% | Pipe tint lerps: copper (#B87333) -> orange (#FF8C00) at 50% -> red (#FF0000) at 80% |
| Overflow explosion | Pressure hits 100% | 20 particles burst outward, pipe sprite scales to 1.5x then fades, cell cleared |
| Rule shift flash | Rule changes | Full-screen white flash at 40% opacity for 100ms, rule card slides up with bounce |
| Source pulse | Always (source active) | Source circle scales 1.0-1.15x, sinusoidal, 1s period |
| Drain swirl | Always (drain active) | Inner circle rotates 360 degrees per 2s |

---

## 5. Audio Design

### 5.1 Sound Effects

All sounds generated via Web Audio API oscillators (no external audio files).

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Pipe place | Short metallic click-snap. Square wave 800Hz->400Hz sweep | 80ms | High |
| Pipe rotate | Quick ratchet click. Triangle wave 600Hz->500Hz | 60ms | Medium |
| Pipe remove | Hollow pop. Sine wave 300Hz->150Hz | 120ms | Medium |
| Flow connect | Satisfying water gurgle. White noise filtered through bandpass 200-600Hz | 200ms | High |
| Rule shift warning | Rising alarm. Sawtooth 400Hz->1200Hz, 2 pulses | 500ms | High |
| Rule shift activate | Dramatic whoosh. White noise with high-pass sweep 100Hz->8000Hz | 300ms | High |
| Pressure warning | Low rumble pulse. Sine wave 80Hz, amplitude modulated at 4Hz | Looping while pressure > 60% | Medium |
| Overflow | Splash + crash. White noise burst + sine 200Hz->50Hz | 400ms | High |
| Game over | Descending tone cascade. Sine 800->600->400->200Hz, staggered | 800ms | High |
| Score popup | Bright ding. Sine 1200Hz, quick decay | 100ms | Low |
| Streak increment | Ascending chime. Sine pitch = 800 + (streak * 100)Hz, capped at 1600Hz | 150ms | Medium |
| Combo text | Ascending three-note: 800, 1000, 1200 Hz | 200ms | Medium |

### 5.2 Music Concept

No background music. The game's audio landscape is built entirely from dynamic sound effects -- the gurgling flow, clicking pipes, warning alarms, and whooshing rule shifts create an emergent soundscape that intensifies with gameplay. This keeps the JS budget tight and avoids audio library dependencies.

---

## 6. UI/UX

### 6.1 Screen Flow

```
+------------+     +------------+     +------------+
|   Boot     |---->|   Menu     |---->|   Game     |
|  (BootScene|     | (MenuScene)|     |(GameScene) |
|   textures)|     +-----+------+     +------+-----+
+------------+        |     |              |     |
                 +----+     +----+    +----+     +----+
                 |               |    |               |
            +----+----+   +-----+--+ +-----+---+ +---+------+
            |  Help   |   |Settings| | Pause   | | Game Over|
            |How2Play |   |Overlay | | Overlay | |(UIScene) |
            |(HelpScn)|   +--------+ +----+----+ +----+-----+
            +---------+                   |            |
                                     +----+----+  +----+-----+
                                     |  Help   |  | Ad/      |
                                     |How2Play |  | Continue |
                                     +---------+  +----------+
```

### 6.2 HUD Layout

```
+-------------------------------+  y=0
| Score: 1250    NORMAL    x3   |  HUD top bar, 48px height
| [?]   Timer ====--  OOo      |  ? = help, timer bar, O = overflow indicators
+-------------------------------+  y=48
|  .  .  .  .  .  .            |
|  .  S  .  .  .  .            |  Grid: 6x8, each cell 56x56
|  .  .  |  .  .  .            |  Grid area: 336x448px
|  .  .  |  .  D  .            |  Centered horizontally
|  .  .  .  .  .  .            |
|  .  .  .  .  .  .            |
|  .  .  .  .  .  .            |
|  .  .  .  .  .  .            |
+-------------------------------+  y=496
| Next: [REVERSE FLOW]   [||]  |  Bottom bar: 64px, rule preview + pause
+-------------------------------+  y=560
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left (x:10, y:8) | Current score, white, 20px bold | Every score event |
| Active Rule | Top-center (x:195, y:8) | Current rule name, #4FC3F7, 16px | On rule shift |
| Streak | Top-right (x:350, y:8) | "x{N}" in gold (#FFD700), 18px bold | On streak change |
| Help button | Below score (x:10, y:30) | "?" circle, 28px diameter, #4FC3F7 | Static |
| Timer bar | Bottom of HUD (x:50, y:34) | Horizontal bar, fills left-to-right, turns red at <2s | Every frame |
| Overflow indicators | Right of timer (x:300, y:30) | 3 circles: empty = #1A3A5C, filled = #FF1744 | On overflow |
| Rule preview card | Bottom bar (x:10, y:504) | "Next: [RULE NAME]" on #1E2D3D bg, 14px | 2s before shift |
| Pause button | Bottom-right (x:340, y:504) | "||" icon, 40x40px, #4FC3F7 | Static |

### 6.3 Menu Structure

**Main Menu (MenuScene)**:
- Game title "PIPE PARADOX" -- large blueprint-style font, 32px, #FFFFFF, centered at y=180
- Subtitle "Route the flow. Survive the shift." -- 14px, #4FC3F7, centered at y=220
- **PLAY** button -- large rounded rect (200x60px), #4FC3F7 fill, centered at y=320, text "PLAY" 24px white
- **How to Play "?"** -- circle button (44x44px), #4FC3F7 outline, at (x:60, y:420), text "?" 22px
- **High Score display** -- "Best: {score}" at y=400, 16px, #FFD700
- **Sound toggle** -- speaker icon (44x44px) at (x:330, y:420)

**Pause Overlay** (semi-transparent #0A1628 at 80% opacity):
- **Resume** -- 180x50px button, #4FC3F7, centered at y=220
- **How to Play** -- 180x50px button, #4FC3F7 outline, centered at y=290
- **Restart** -- 180x50px button, #FF8C00, centered at y=360
- **Quit to Menu** -- 180x50px button, #FF1744, centered at y=430

**Game Over Screen (rendered via UIScene overlay)**:
- "GAME OVER" -- 28px, #FF1744, centered at y=140
- Final Score -- 48px, #FFFFFF, centered at y=200, with scale punch animation
- "NEW BEST!" -- 20px, #FFD700, shown only if new high score, centered at y=240
- Rule cycles survived -- 16px, #4FC3F7, centered at y=270
- **"Watch Ad: Remove Overflow"** -- 200x50px, #FFD600 fill, centered at y=340 (once per game)
- **"Play Again"** -- 200x50px, #4FC3F7 fill, centered at y=410
- **"Menu"** -- 200x50px, #1E2D3D fill with #4FC3F7 border, centered at y=480

**Help / How to Play Scene (HelpScene)**:
- Title: "HOW TO PLAY" -- 24px, #FFFFFF, y=40
- **Control diagram 1**: SVG illustration showing a finger tapping a grid cell, with arrow showing pipe appearing. Caption: "TAP empty cell to place a pipe" -- 14px
- **Control diagram 2**: SVG illustration showing a finger tapping an existing pipe with rotation arrow. Caption: "TAP pipe to ROTATE 90 degrees" -- 14px
- **Control diagram 3**: SVG illustration showing finger holding on pipe with X appearing. Caption: "HOLD to REMOVE a pipe" -- 14px
- **Rules section**:
  - "Route flow from GREEN sources to YELLOW drains"
  - "Every few seconds, a RULE SHIFT changes how flow works"
  - "If flow gets blocked, PRESSURE builds. At max = OVERFLOW"
  - "3 overflows = GAME OVER"
- **Tips**:
  - "Build redundant paths -- T-junctions and crosses survive more rule shifts"
  - "Watch the rule preview card at the bottom to prepare"
  - "Remove pipes that become dangerous under the new rule"
- **"Got it!"** button -- 160x50px, #4FC3F7, centered at y=520
- Scrollable if content exceeds viewport. Background matches game palette (#0A1628).

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Remove 1 overflow (continue) | Every game over | Always (optional) |
| Rewarded | Double final score | Game over screen | Always (optional) |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Overflow Removal | Watch rewarded ad after death | Remove 1 overflow, continue playing | Once per game |
| Score Doubler | Watch rewarded ad at game over | 2x final score for high score purposes | Once per session |

### 7.3 Session Economy

Players average 3-5 minutes per session. Expected 2-3 sessions per sitting. Interstitial frequency (every 3rd game over) ensures ~1 interstitial per 10-minute sitting. Rewarded ads are always optional and provide meaningful but non-essential benefits.

**Session Flow with Monetization**:
```
[Play] --> [Overflow #3] --> [Rewarded Ad: Remove overflow?]
                                   | Yes --> [Continue with 2 overflows]
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
games/pipe-paradox/
+-- index.html              # Entry point, loads Phaser CDN + local scripts
+-- css/
|   +-- style.css           # Responsive layout, mobile-first, portrait lock
+-- js/
    +-- config.js           # Constants: colors, grid params, rule definitions, difficulty tables, SVG strings
    +-- main.js             # BootScene (register textures), Phaser config, scene array, global state
    +-- game.js             # GameScene: grid logic, flow simulation, pipe placement, pressure system, rule shifts
    +-- stages.js           # Difficulty scaling, source/drain placement, rule pool management, rule selection
    +-- ui.js               # MenuScene, UIScene (HUD + game over overlay), pause overlay, settings
    +-- help.js             # HelpScene: illustrated how-to-play with control diagrams
    +-- ads.js              # Ad integration hooks, reward callbacks
```

**Script load order in index.html**:
```
config.js -> stages.js -> ads.js -> help.js -> ui.js -> game.js -> main.js (LAST)
```

### 8.2 Module Responsibilities

**config.js** (~80 lines):
- `COLORS` object: all hex color constants
- `GRID` object: `{ cols: 6, rows: 8, cellSize: 56 }`
- `DIFFICULTY` object: base flow speed, pressure rate, timer duration, scaling factors
- `RULES` array: rule definitions `[{ id, name, icon, description, effect }]`
- `PIPE_TYPES` enum: straight, elbow, t-junction, cross
- `SVG_STRINGS` object: all SVG source strings for texture registration
- `SCORE` object: point values for each event
- Exported as global `CONFIG` object

**main.js** (~60 lines):
- `BootScene`: reads `CONFIG.SVG_STRINGS`, calls `textures.addBase64()` for each, listens for all loaded, then starts MenuScene
- Phaser.Game config: `{ type: AUTO, width: 390, height: 560, backgroundColor: '#0A1628', scene: [BootScene, MenuScene, GameScene, UIScene, HelpScene] }`
- `GameState` global: `{ score, highScore, overflows, streak, cycleNumber, gamesPlayed, settings }`
- LocalStorage read/write helpers

**game.js** (~280 lines):
- `GameScene.create()`: build grid (6x8 array of cell objects), place initial source/drain, init flow simulation, start rule timer
- `GameScene.update()`: advance flow particles along pipes, update pressure per pipe, check overflow, check rule timer countdown
- `handleCellTap(row, col)`: cycle pipe type or rotate existing pipe
- `handleCellLongPress(row, col)`: remove pipe
- `simulateFlow()`: BFS from each source through connected pipes, spawn/move flow particles, detect dead ends
- `applyRule(ruleId)`: modify flow behavior based on active rule
- `checkOverflow()`: iterate all pipes, if pressure >= 100%, trigger overflow
- `triggerOverflow(row, col)`: explosion effect, increment overflow counter, check game over
- `onRuleShift()`: select new rule, apply, update HUD, trigger visual effects

**stages.js** (~100 lines):
- `calculateDifficulty(cycleNumber)`: returns `{ flowSpeed, ruleTimer, poolSize, sourceCount, drainCount, compound, relocate }`
- `selectRule(pool, lastRule)`: random selection excluding last used rule
- `placeSources(grid, count)`: place source nodes on grid edges
- `placeDrains(grid, count, sources)`: place drain nodes ensuring minimum distance from sources (at least 3 cells Manhattan distance)
- `getUnlockedRules(cycleNumber)`: returns subset of RULES based on cycle
- `validatePlacement(sources, drains)`: ensures at least one valid path exists

**ui.js** (~250 lines):
- `MenuScene`: render title, play button, help button, sound toggle, high score
- `UIScene`: launched parallel to GameScene
  - HUD rendering: score, rule name, streak, timer bar, overflow indicators
  - Pause overlay: resume, help, restart, quit buttons
  - Game over overlay: final score, high score check, action buttons
  - `updateHUD(gameState)`: called by GameScene events
  - `showGameOver(finalScore, cyclesSurvived)`: display game over with animation
- Settings toggle handlers (sound on/off stored in GameState.settings)

**help.js** (~80 lines):
- `HelpScene`: full-screen overlay scene
- Renders control diagrams using game's own pipe SVG textures with annotation text
- Three illustrated sections: Place, Rotate, Remove
- Rules summary and tips
- "Got it!" button returns to calling scene (menu or pause)

**ads.js** (~50 lines):
- Placeholder ad hooks: `showInterstitial()`, `showRewarded(callback)`, `showBanner()`
- Frequency tracking: `interstitialCounter`, increments on game over, fires every 3rd
- Reward callbacks: `onOverflowRemoved()`, `onScoreDoubled()`
- No actual ad SDK -- stubs for future integration

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No Howler.js needed -- all audio via Web Audio API oscillators in game.js (keeps dependency count minimal and JS size small).

---

## 9. Juice Specification

### 9.1 Player Input Feedback (applied to every tap)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Tapped cell | Count: 8, Direction: radial outward, Color: #4FC3F7, Lifespan: 300ms, Speed: 80px/s |
| Scale punch | Placed/rotated pipe | Scale: 1.3x, Recovery: 120ms (ease-out) |
| Sound | -- | Metallic click-snap, 800Hz->400Hz square wave, 80ms |
| Grid cell flash | Tapped cell | White (#FFFFFF) fill at 50% opacity, fade to 0% over 150ms |

### 9.2 Core Action Additional Feedback (pipe placement -- most frequent)

| Effect | Values |
|--------|--------|
| Particles | Count: 12 copper-colored (#B87333) sparks, radial, lifespan 400ms |
| Scale punch | Pipe scales 1.0->1.35->1.0 over 150ms, elastic ease |
| Connection flash | When pipe connects to adjacent pipe: both pipes flash cyan (#00E5FF) for 200ms |
| Combo escalation | Consecutive placements within 1s: particle count +3 per chain (8, 11, 14...), capped at 20 |
| Flow connect sound | Gurgling noise pitch increases +5% per consecutive connection |

### 9.3 Rule Shift Feedback (signature moment)

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 6px, Duration: 200ms, frequency: 30Hz |
| Full-screen flash | White at 40% opacity, 100ms |
| Rule card animation | Slides up from bottom with bounce (overshoot 10px, settle in 300ms) |
| Grid pulse | All grid lines flash #4FC3F7 at 100% opacity, fade to 30% over 400ms |
| Sound | Whoosh: white noise high-pass sweep 100->8000Hz, 300ms |
| Active pipes | All pipes briefly glow with active rule color for 500ms |

### 9.4 Death/Failure Effects (Overflow)

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 10px, Duration: 400ms |
| Overflow explosion | 20 particles: mixed cyan (#00E5FF) + red (#FF1744), radial burst, speed 150px/s, lifespan 600ms |
| Pipe destruction | Overflowing pipe scales to 1.5x over 200ms, then fades to 0% opacity over 300ms |
| Screen flash | Red (#FF1744) at 30% opacity, 150ms |
| Sound | Splash + crash: white noise burst 200ms + sine 200->50Hz 200ms |
| Overflow indicator | Corresponding circle fills red with scale punch 1.4x, recovery 200ms |
| Camera zoom (on 3rd overflow / game over) | Zoom to 1.05x on grid center, hold 500ms, then transition to game over |

### 9.5 Game Over Effects

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 12px, Duration: 500ms |
| Screen desaturation | All game elements desaturate to 30% over 400ms |
| Sound | Descending cascade: 800->600->400->200Hz sines, 100ms each, 800ms total |
| Effect -> UI delay | 800ms (shake + desaturation finish, then game over overlay appears) |
| Death -> restart | **Under 2 seconds** (800ms effect + 200ms transition + instant restart = ~1.5s total) |

### 9.6 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{N}", Color: #FFD700, Start at scored pipe position, float up 50px, fade over 600ms, font 18px bold |
| Score HUD punch | Scale 1.3x, recovery 150ms |
| Streak text | "x{N} STREAK!" appears center-screen at 28px, gold (#FFD700), scale punch 1.5x->1.0x over 300ms, fade after 1s |
| High score beat | If score > highScore: score text flashes #FFD700 for 200ms, returns to white |

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
- **Prevent Default**: Prevent pull-to-refresh, pinch-to-zoom, double-tap-to-zoom via CSS `touch-action: none`
- **Orientation**: Lock to portrait via CSS media query. On landscape detection, show "Please rotate" overlay.
- **Resize handler**: `window.addEventListener('resize', ...)` recalculates grid position and scales game
- **Cell tap targets**: 56x56px cells exceed the 44px minimum touch target guideline
- **Long press detection**: 400ms threshold with visual feedback (cell darkens at 200ms to indicate hold is registering)

### 10.3 Flow Simulation Performance

- **Grid is a 2D array** (6x8 = 48 cells). Flow simulation is BFS from each source -- O(48) per source per frame. With max 3 sources = O(144) per frame. Trivially fast.
- **Flow particles**: Pool of 30 particle sprites, reused. No dynamic allocation during gameplay.
- **Pressure updates**: Only computed for pipes with active flow dead-ends. Tracked via a `blockedPipes` set updated on flow simulation.
- **Rule application**: Precomputed connection maps per rule. On rule shift, swap the active connection map. No per-frame rule evaluation.

### 10.4 Critical Implementation Patterns

1. **Texture registration**: ALL SVGs registered in BootScene via `addBase64()` ONCE. Pipe rotations via `setAngle()`, NOT separate textures.
2. **Pipe type cycling**: Cell stores `pipeType` (0-4) and `rotation` (0-3). Tap increments type; if type > 4, wraps to 0 (empty). Second tap on same type rotates instead.
3. **Flow as state machine**: Each cell has `flowState`: `EMPTY | FLOWING | BLOCKED | OVERFLOWING`. Updated each frame based on BFS result.
4. **Rule shift timer**: Use `this.time.addEvent({ delay: ruleTimerDuration * 1000, callback: onRuleShift, loop: true })`. On rule shift, recalculate delay for next cycle.
5. **Inactivity detection**: Track `lastInputTime`. In `update()`, if `Date.now() - lastInputTime > 8000`, set pressure rate to 2x. Reset on any input.
6. **Game over -> restart**: GameScene `shutdown()` clears all state. `scene.restart()` reinitializes. Total time < 2s guaranteed by minimal state.
7. **Parallel UIScene**: UIScene runs parallel to GameScene. Communication via Phaser events (`this.events.emit / scene.get('UIScene').events`). All event handlers null-guarded.
8. **Script load order**: `main.js` MUST load LAST. It references MenuScene, GameScene, UIScene, HelpScene which are defined in ui.js, game.js, help.js.
9. **No `Body.setStatic()` usage**: Game uses no physics engine (pure grid-based). No Matter.js pitfalls apply.
10. **HUD init from state**: Score text initialized as `GameState.score` (not literal `'0'`), ensuring correct display on restart.

### 10.5 Edge Cases

| Edge Case | Handling |
|-----------|---------|
| All paths blocked simultaneously | Pressure builds on all blocked pipes. Multiple overflows can trigger in same frame -- each processed sequentially. |
| Rule shift while flow mid-pipe | Flow instantly re-evaluates path under new rule. If path now invalid, flow stops and pressure builds from current position. |
| Place pipe during rule shift animation | Input accepted. Pipe placed immediately. Visual effects do not block input. |
| Rapid tapping same cell | Each tap registered with 100ms debounce. Type/rotation cycles correctly. |
| Source and drain adjacent | Valid configuration. Flow connects in 1 pipe. Easy points but rare in generation. |
| Resize during gameplay | Game pauses, grid recalculates, resumes. No state loss. |
| Tab/app background | `document.addEventListener('visibilitychange', ...)` pauses game timer and flow. |

### 10.6 Testing Checkpoints

1. **Grid renders**: 6x8 grid visible with correct cell sizes on 390px wide viewport.
2. **Pipe placement works**: Tap cycles through pipe types. Visual matches type. Rotation works.
3. **Flow simulation**: Flow particles move from source through connected pipes to drain. Score increases.
4. **Pressure system**: Blocked flow builds pressure. Color changes visible. Overflow at 100%.
5. **Rule shifts**: Timer counts down. Rule changes. Flow behavior updates immediately. Rule name in HUD.
6. **Inactivity death**: No input for 8s -> pressure accelerates. Death within 30s guaranteed.
7. **Game over -> restart**: Under 2 seconds from death to playable state.
8. **Help scene**: Accessible from menu and pause. Control diagrams render. "Got it!" returns correctly.
9. **Overflow indicators**: Visual correctly shows 0/3, 1/3, 2/3, 3/3 states.
10. **Rule preview**: Upcoming rule shown 2s before shift. Card animates in.

### 10.7 Local Storage Schema

```json
{
  "pipe_paradox_high_score": 0,
  "pipe_paradox_games_played": 0,
  "pipe_paradox_best_cycles": 0,
  "pipe_paradox_settings": {
    "sound": true
  },
  "pipe_paradox_total_score": 0
}
```
