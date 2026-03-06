# Game Design Document: Gravity Flip Maze

**Slug**: `gravity-flip-maze`
**One-Liner**: Flip gravity in four directions to slide a ball through living, shifting mazes -- leave ghost trails that boost your speed when crossed.
**Core Mechanic**: Swipe up/down/left/right to flip gravity. Ball slides until hitting a wall. Maze walls pulse and shift on timers. Collect gems for star rating. Avoid spikes. Cross your own ghost trail for speed boosts. Time limit per maze shrinks as you progress.
**Target Session Length**: 3-6 minutes
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Gravity Flip Maze is a fast-paced spatial puzzle where players swipe in four directions to flip gravity, sending a neon ball sliding through procedurally generated mazes. Unlike static maze games, these mazes are ALIVE -- walls pulse with energy, some walls phase in/out on timers (visible countdown rings), and spike hazards lurk at dead ends. The player must collect up to 3 gems per maze while racing a shrinking time limit.

The signature mechanic is "Gravity Echoes." Every gravity flip leaves a translucent ghost trail showing the ball's previous path. When the ball crosses its own ghost trail on a subsequent move, it gains a temporary speed boost (1.8x for 500ms). This creates a risk/reward tension: crossing ghost trails near spikes means faster movement = less reaction time, but it also means faster maze completion for better star ratings. Advanced players chain ghost trail crossings for massive speed, turning careful puzzles into adrenaline runs.

The neon cyberpunk aesthetic (dark backgrounds, glowing trails, pulsing walls) differentiates this from the hundreds of bland gravity maze games. Combined with the living maze mechanic and ghost trail system, this is not "yet another maze game" -- it is a spatial action-puzzle with a unique identity.

### 1.2 Target Audience

Casual mobile gamers aged 14-35 who enjoy spatial puzzles with a twist. Players who liked games like "Tomb of the Mask" or "Gravity Guy" but want something more cerebral. Play context: commute, waiting rooms, short breaks. No prior puzzle game experience required -- the first 5 mazes teach all mechanics naturally.

### 1.3 Core Fantasy

You are a hacker navigating a digital labyrinth that fights back. Every swipe rewires gravity itself. The maze shifts and pulses like living circuitry. Your ghost trail is your digital fingerprint -- use it to move faster, or let it betray you near hazards. Master the maze before the system locks you out (timer).

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 3-6 minutes |
| Day 1 Retention | 40%+ |
| Day 7 Retention | 20%+ |
| Average Mazes per Session | 8-15 |
| Crash Rate | <1% |
| 3-Star Completion Rate (Maze 1-5) | 60%+ |
| Ghost Trail Usage Rate | 50%+ of moves by maze 10 |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Start Maze] --> [Swipe to Flip Gravity] --> [Ball Slides to Wall]
      ^                                            |
      |                                   [Collect Gem? / Hit Spike?]
      |                                            |
      |                                    [Reach Exit? / Timer Out?]
      |                                            |
      |                              YES: [Star Rating + Score] --> [Next Maze]
      |                              NO:  [Death] --> [Retry / Game Over]
      |                                                     |
      +-----------------------------------------------------+
```

**Moment-to-moment**: Player sees the maze. Walls are pulsing. Some walls have countdown rings (they will disappear/appear soon). The player swipes RIGHT -- gravity flips, ball slides right until hitting a wall. A ghost trail appears where the ball traveled. Player swipes DOWN -- ball slides down. It crosses the ghost trail from the previous move -- SPEED BOOST activates (screen flashes cyan, ball glows brighter, 1.8x speed for 500ms). Player sees a gem below a phasing wall that will reappear in 2 seconds. They swipe down to grab it just in time. Three gems collected, exit reached -- 3-star rating with a burst of particles.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Flip Gravity Up | Swipe Up (>40px, <300ms) | Ball slides upward until hitting a wall or maze edge |
| Flip Gravity Down | Swipe Down (>40px, <300ms) | Ball slides downward until hitting a wall or maze edge |
| Flip Gravity Left | Swipe Left (>40px, <300ms) | Ball slides left until hitting a wall or maze edge |
| Flip Gravity Right | Swipe Right (>40px, <300ms) | Ball slides right until hitting a wall or maze edge |
| Pause | Tap pause icon (top-right, 44x44px) | Opens pause overlay |

**Control Philosophy**: Swipe gestures map naturally to the direction of gravity -- swipe the way you want the ball to fall. The entire screen is the swipe zone (no dead zones except the 44x44px pause button). Swipe detection uses distance threshold (40px minimum) and time threshold (<300ms) to distinguish from accidental touches. Diagonal swipes resolve to the dominant axis (larger delta). Input is buffered during ball movement animation -- the next swipe queues and executes when the ball stops.

**Touch Area Map**:
```
+-------------------------------+
| Score    Maze#    [||] 44x44  |  <-- Top HUD bar (60px height)
+-------------------------------+
|                               |
|                               |
|    FULL SCREEN SWIPE ZONE     |
|    (entire game area)         |
|                               |
|    Swipe anywhere in any      |
|    cardinal direction         |
|                               |
|                               |
+-------------------------------+
| Timer Bar (full width, 8px)   |  <-- Bottom timer bar
+-------------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Reach maze exit | 100 | +50 per star earned (max +150) |
| Collect gem | 50 | x2 if collected while speed-boosted |
| Ghost trail speed boost | 25 | +10 per consecutive boost in same maze |
| Under-par moves bonus | 75 | Only if completed in fewer moves than par |
| Time bonus | 1 per remaining second | Remaining seconds x1 point |
| Phasing wall dodge | 30 | Pass through a wall gap within 500ms of it closing |
| Perfect maze (3 stars + under par) | 200 | Flat bonus, no multiplier |

**Combo System**: Ghost trail crossings within the same maze chain. First crossing = 25 pts, second = 35, third = 45, etc. (+10 per chain). The chain resets when you complete or fail the maze. Visual feedback: combo counter appears center-screen with escalating glow intensity.

**High Score**: Total cumulative score across all mazes in a session. Stored in localStorage. Displayed on game over screen and main menu. New high score triggers a special animation (gold particle burst + "NEW BEST!" text).

### 2.4 Progression System

The game is an infinite maze runner. Each maze is procedurally generated with increasing difficulty. Progression hooks:

1. **Star Rating**: Each maze awards 1-3 stars. 1 star = reach exit. 2 stars = collect all 3 gems. 3 stars = complete under par moves. Stars accumulate -- total stars shown on main menu.
2. **Ball Skins**: Unlock new ball visuals at star milestones (purely cosmetic, stored in localStorage).
3. **Maze Themes**: Every 10 mazes, background color palette shifts (cyberpunk pink -> matrix green -> deep ocean blue -> solar gold -> void purple). Cycles after 50.
4. **Best Maze Reached**: Displayed prominently on menu. Social proof / personal record.

**Ball Skin Unlocks**:

| Total Stars | Unlock | Visual Description |
|------------|--------|-------------------|
| 0 | Default Ball | Cyan circle with white core glow |
| 15 | Pulse Ball | Orange circle with pulsing ring |
| 40 | Plasma Ball | Green circle with rotating particle orbit |
| 75 | Nova Ball | Pink circle with starburst trail |
| 120 | Void Ball | Purple circle with dark center, inverted glow |
| 200 | Prismatic Ball | Rainbow cycle (hue shift 360deg over 2000ms) |

**Progression Milestones**:

| Maze Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-3 | Static walls only, 2 gems, no spikes | Tutorial -- learn swipe controls |
| 4-7 | Spikes introduced (static), 3 gems | Easy -- learn hazard avoidance |
| 8-12 | Phasing walls (3s on / 3s off cycle) | Medium -- timing required |
| 13-20 | Moving spikes (patrol a row/column at 40px/s) | Hard -- spatial + timing |
| 21-30 | Faster phasing walls (2s/2s cycle), maze size increases to 9x9 | Very Hard -- precision |
| 31-50 | Combo walls (chains of phasing walls in sequence), moving spikes at 60px/s | Expert |
| 51+ | All mechanics combined, random special modifiers, maze size up to 11x11 | Extreme -- survival |

### 2.5 Lives and Failure

The player has 1 life per maze attempt. Death is instant on spike contact or timer expiry.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Ball hits spike | Instant death, maze resets | Retry same maze (free, unlimited) |
| Timer reaches 0 | Death, maze resets | Retry same maze (free, unlimited) |
| Inactivity (10s no input) | Spike walls close in from all 4 edges at 20px/s, death in ~5s | Swipe to resume play, spikes retract |
| 3 deaths on same maze | Game Over | Watch ad to continue OR restart from maze 1 |

**Death-to-restart flow**: Death animation plays (500ms), then maze instantly resets with ball at start position. Total death-to-playable time: under 1500ms. After 3 deaths on the same maze, game over screen appears. Player can watch a rewarded ad to get 3 more attempts on that maze, or return to menu / restart from maze 1.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Mazes are generated procedurally using a recursive backtracker algorithm on a grid, then modified with game-specific features (gems, spikes, phasing walls, entry/exit).

**Generation Algorithm**:
```
Stage Generation Parameters:
- Grid Size: 7x7 (maze 1-20), 9x9 (maze 21-40), 11x11 (maze 41+)
- Cell Size: floor(GAME_WIDTH / gridCols) px (auto-scales to fit screen)
- Wall Thickness: 4px
- Seed: hash(mazeNumber + sessionSalt)
- Gem Count: 2 (maze 1-3), 3 (maze 4+)
- Spike Count: 0 (maze 1-3), 2 (maze 4-7), 3 (maze 8-15), 4 (maze 16-30), 5 (maze 31+)
- Phasing Wall Count: 0 (maze 1-7), 2 (maze 8-12), 3 (maze 13-20), 4 (maze 21-30), 5 (maze 31+)
- Moving Spike Count: 0 (maze 1-12), 1 (maze 13-20), 2 (maze 21-30), 3 (maze 31+)
- Timer: 30s (maze 1-5), 25s (maze 6-15), 20s (maze 16-30), 18s (maze 31-50), 15s (maze 51+)
- Par Moves: optimal_path_length + 2 (calculated by BFS after generation)
- Entry: always top-left cell
- Exit: always bottom-right cell (marked with glowing portal)
```

**Maze Generation Steps**:
1. Initialize NxN grid with all walls present
2. Run recursive backtracker from random cell to carve passages (guarantees full connectivity)
3. Remove 15% + (mazeNumber * 0.5)% additional random walls (capped at 35%) to create multiple paths and open areas
4. Place entry (top-left) and exit (bottom-right)
5. Run BFS from entry to exit to find optimal path length -> set par = optimal + 2
6. Place gems: randomly in cells NOT on the optimal path (forces exploration)
7. Place spikes: randomly in cells that are on at least one non-optimal path (reachable but dangerous)
8. Place phasing walls: replace existing walls with phasing variants (cycle timer based on difficulty)
9. Place moving spikes: assign to rows/columns that don't block the optimal path at t=0
10. Validate: BFS confirms entry->exit path exists AND all gems are reachable. If not, regenerate.

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
  0 +------------------------------------------ Maze
    0    10    20    30    40    50    60    70+
```

**Difficulty Parameters by Maze Range**:

| Parameter | Maze 1-3 | Maze 4-7 | Maze 8-12 | Maze 13-20 | Maze 21-30 | Maze 31-50 | Maze 51+ |
|-----------|----------|----------|-----------|------------|------------|------------|----------|
| Grid Size | 7x7 | 7x7 | 7x7 | 7x7 | 9x9 | 9x9 | 11x11 |
| Timer (s) | 30 | 30 | 25 | 25 | 20 | 18 | 15 |
| Static Spikes | 0 | 2 | 3 | 3 | 4 | 4 | 5 |
| Phasing Walls | 0 | 0 | 2 | 3 | 4 | 5 | 5 |
| Phasing Cycle (ms) | -- | -- | 3000/3000 | 2500/2500 | 2000/2000 | 1500/1500 | 1200/1200 |
| Moving Spikes | 0 | 0 | 0 | 1 | 2 | 2 | 3 |
| Moving Spike Speed (px/s) | -- | -- | -- | 40 | 50 | 60 | 70 |
| Extra Walls Removed (%) | 25 | 20 | 18 | 15 | 15 | 12 | 10 |
| Ball Slide Speed (px/s) | 400 | 400 | 450 | 450 | 500 | 500 | 550 |
| Ghost Boost Multiplier | 1.8x | 1.8x | 1.8x | 2.0x | 2.0x | 2.2x | 2.2x |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: After generation, BFS from entry to exit MUST find a valid path. All 3 gems MUST be reachable. If validation fails, discard and regenerate (max 10 attempts, then fall back to a handcrafted template for that grid size).
2. **Variety Threshold**: At least 3 of these parameters must differ between consecutive mazes: gem positions, spike positions, phasing wall positions, wall removal pattern, grid size.
3. **Difficulty Monotonicity**: Overall difficulty score (weighted sum of spike count, timer, grid size) never decreases between mazes. Local variation exists within maze layouts.
4. **Rest Mazes**: Every 10th maze (10, 20, 30...) is a "breather" -- grid size stays the same but spike count drops by 1, timer adds 5s, and a bonus gem worth 100pts spawns. Visually marked with a calming blue-white color shift.
5. **Milestone Mazes**: Every 25th maze (25, 50, 75...) is a "Labyrinth" -- double grid size for that maze only (14x14 or 18x18), double timer, double gems (6). Completing it awards 500 bonus points. Background pulses gold.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Neon cyberpunk with clean geometric shapes. Dark backgrounds with bright, glowing game elements. Walls have a subtle pulse animation. The ball leaves a glowing trail. Everything feels like navigating inside a circuit board or digital grid.

**Aesthetic Keywords**: Neon, Cyberpunk, Glowing, Geometric, Digital

**Reference Palette**: Think Tron Legacy meets Monument Valley -- dark voids with precise, luminous geometry. High contrast between background (near-black) and interactive elements (vivid neon).

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary (Ball) | Neon Cyan | #00F5FF | Player ball, ghost trails, speed boost effects |
| Secondary (Walls) | Electric Blue | #1E3A5F | Maze walls (base), wall pulse glow |
| Wall Glow | Bright Blue | #4A9EFF | Wall pulse highlight (oscillates with base) |
| Background | Deep Navy | #0A0E1A | Game background, creates depth |
| Grid Lines | Dim Blue | #152238 | Subtle grid pattern on background |
| Danger (Spikes) | Hot Pink | #FF1493 | Spike hazards, death flash |
| Danger Glow | Neon Red | #FF3366 | Spike glow aura |
| Reward (Gems) | Neon Gold | #FFD700 | Gem collectibles |
| Gem Glow | Warm Yellow | #FFEA80 | Gem glow aura |
| Exit Portal | Neon Green | #39FF14 | Exit marker |
| Phasing Wall Active | Electric Purple | #9B30FF | Phasing walls when solid |
| Phasing Wall Fading | Dim Purple | #4A1570 | Phasing walls when disappearing |
| Timer Bar Full | Neon Green | #39FF14 | Timer at 100% |
| Timer Bar Mid | Neon Yellow | #FFD700 | Timer at 30-60% |
| Timer Bar Low | Hot Pink | #FF1493 | Timer below 30% |
| UI Text | White | #FFFFFF | Score, maze number, labels |
| UI Text Shadow | Cyan Glow | #00F5FF40 | Text shadow for neon effect |
| Ghost Trail | Cyan 40% | #00F5FF66 | Ghost trail (semi-transparent) |
| Speed Boost Aura | Bright Cyan | #00FFFF | Ball glow when speed-boosted |
| Inactivity Warning | Red | #FF0000 | Closing spike walls during inactivity |

### 4.3 SVG Specifications

All game graphics are rendered as SVG elements generated in code. No external image assets.

**Player Ball** (24x24px base, scaled by cell size):
```svg
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <!-- Outer glow ring -->
  <circle cx="12" cy="12" r="11" fill="none" stroke="#00F5FF" stroke-width="1" opacity="0.4"/>
  <!-- Main ball body -->
  <circle cx="12" cy="12" r="8" fill="#00F5FF"/>
  <!-- Inner core highlight -->
  <circle cx="10" cy="10" r="3" fill="#FFFFFF" opacity="0.6"/>
</svg>
```

**Gem** (20x20px):
```svg
<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
  <!-- Diamond shape -->
  <polygon points="10,1 19,10 10,19 1,10" fill="#FFD700" stroke="#FFEA80" stroke-width="1"/>
  <!-- Inner highlight -->
  <polygon points="10,5 15,10 10,15 5,10" fill="#FFEA80" opacity="0.5"/>
</svg>
```

**Spike** (20x20px):
```svg
<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
  <!-- Four-pointed star spike -->
  <polygon points="10,0 12,8 20,10 12,12 10,20 8,12 0,10 8,8" fill="#FF1493" stroke="#FF3366" stroke-width="0.5"/>
  <!-- Center dot -->
  <circle cx="10" cy="10" r="2" fill="#FF3366" opacity="0.8"/>
</svg>
```

**Exit Portal** (28x28px):
```svg
<svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
  <!-- Outer ring -->
  <circle cx="14" cy="14" r="12" fill="none" stroke="#39FF14" stroke-width="2" opacity="0.6"/>
  <!-- Inner ring (rotates via CSS) -->
  <circle cx="14" cy="14" r="8" fill="none" stroke="#39FF14" stroke-width="1.5" stroke-dasharray="4 4"/>
  <!-- Center glow -->
  <circle cx="14" cy="14" r="4" fill="#39FF14" opacity="0.5"/>
</svg>
```

**Wall Segment** (rendered as rectangles, not SVG textures):
- Horizontal wall: `rect` with width = cellSize, height = 4px, fill = #1E3A5F, stroke = #4A9EFF (1px)
- Vertical wall: `rect` with width = 4px, height = cellSize, fill = #1E3A5F, stroke = #4A9EFF (1px)
- Phasing wall: same but fill = #9B30FF, with alpha oscillation (0.3 -> 1.0 over cycle)

**Moving Spike** (same SVG as static spike, with patrol arrow indicator):
```svg
<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
  <polygon points="10,0 12,8 20,10 12,12 10,20 8,12 0,10 8,8" fill="#FF1493" stroke="#FF3366" stroke-width="0.5"/>
  <circle cx="10" cy="10" r="2" fill="#FF3366"/>
  <!-- Small direction arrow, rotated based on patrol direction -->
  <polygon points="10,0 13,4 7,4" fill="#FFFFFF" opacity="0.5"/>
</svg>
```

**Design Constraints**:
- All SVG elements use max 6 path/shape elements per object
- Use basic shapes (circle, rect, polygon) exclusively -- no complex paths
- Animations via Phaser tweens, not SVG animate
- Cell-based rendering: each cell is `floor(gameWidth / gridCols)` px square
- Max game objects per maze: 7*7 + spikes + gems + phasing walls < 100 sprites

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Wall pulse | Constant (every wall) | Phaser tween: wall stroke alpha oscillates 0.3 -> 0.8 -> 0.3, duration 2000ms, yoyo, repeat -1 |
| Ghost trail | After each ball slide | Semi-transparent cyan line (4px wide, alpha 0.4) drawn from start to end position. Fades over 8000ms. |
| Speed boost flash | Ball crosses ghost trail | Screen-wide cyan overlay (alpha 0.15) flashes for 100ms. Ball scale punches 1.4x for 120ms. |
| Gem collect burst | Ball reaches gem cell | 12 particles (4x4px squares, #FFD700), radial burst, speed 100-200px/s, lifespan 400ms, fade out |
| Spike death shatter | Ball hits spike | Ball splits into 8 triangular fragments, each flies outward at 150-300px/s with rotation, fade over 600ms. Screen flash red (#FF1493, alpha 0.3, 150ms). Camera shake 6px, 300ms. |
| Timer death collapse | Timer hits 0 | All walls flash red simultaneously (150ms), ball dissolves (scale 1.0 -> 0.0 over 400ms with rotation). |
| Exit portal reached | Ball enters exit cell | Portal rings scale up 1.0 -> 2.0 and fade, ball scales 1.0 -> 0.0 (sucked into portal), 15 green particles spiral inward, 500ms total. |
| Phasing wall phase-in | Wall becomes solid | Wall fades from alpha 0.0 -> 1.0 over 300ms with scale punch 1.1x |
| Phasing wall phase-out | Wall becomes passable | Wall fades alpha 1.0 -> 0.0 over 300ms, brief purple particle puff (6 particles) |
| Inactivity spikes | 10s no input | Red spike walls appear at all 4 edges, advance inward at 20px/s. Pulsing red vignette overlay. |
| Star award | Maze complete | 1-3 star SVGs fly in from bottom with bounce easing, each delayed 200ms. Gold particles on 3-star. |
| Maze theme shift | Every 10 mazes | Background color lerps to new palette over 1000ms during transition screen. |

---

## 5. Audio Design

### 5.1 Sound Effects

All sounds generated via Web Audio API (no external audio files). Synthesized tones and noise bursts.

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Gravity flip (swipe) | Short whoosh -- white noise burst with pitch sweep down (800Hz -> 200Hz) | 150ms | High |
| Ball hitting wall | Soft thud -- sine wave at 120Hz with quick decay | 80ms | High |
| Gem collect | Bright ascending chime -- sine 523Hz -> 784Hz -> 1047Hz (C5-G5-C6) | 250ms | High |
| Ghost trail boost | Electric zap -- sawtooth 200Hz with rapid pitch wobble | 200ms | High |
| Spike death | Crunch + buzz -- noise burst + square wave 80Hz descending | 400ms | High |
| Timer warning (5s left) | Tick -- sine 440Hz, 30ms, repeats every 1000ms | 30ms each | Medium |
| Timer death | Flatline tone -- sine 220Hz sustained then cut | 600ms | High |
| Exit reached | Ascending arpeggio -- sine C5-E5-G5-C6 rapid (60ms each note) | 240ms | High |
| Phasing wall toggle | Soft click -- noise burst at 2000Hz, very short | 50ms | Low |
| Star awarded | Chime -- sine 880Hz with reverb tail | 300ms | Medium |
| New high score | Celebratory fanfare -- ascending chord C-E-G-C (300ms per note) | 1200ms | High |
| Menu button tap | Subtle UI click -- sine 600Hz, sharp decay | 40ms | Low |
| Inactivity warning | Low alarm pulse -- square 100Hz, 200ms on / 200ms off | 200ms | Medium |

### 5.2 Music Concept

**Background Music**: No music file -- ambient generative audio. A low pad drone (sine wave at 55Hz, very low volume 0.05) provides subtle atmosphere. The drone pitch shifts up by 5Hz every 10 mazes to create subconscious tension. This keeps file size at zero and avoids music licensing issues.

**Music State Machine**:

| Game State | Audio Behavior |
|-----------|---------------|
| Menu | Ambient drone at 55Hz, volume 0.03 |
| Early Mazes (1-10) | Drone at 55Hz, volume 0.05 |
| Mid Mazes (11-30) | Drone at 60Hz, volume 0.06 |
| Late Mazes (31+) | Drone at 65Hz, volume 0.07, subtle LFO wobble |
| Timer < 5s | Tick overlay added on top of drone |
| Death | Drone cuts, silence for 300ms, then resumes |
| Pause | Drone volume fades to 0.02 |
| Game Over | Drone fades out over 1000ms |

**Audio Implementation**: Web Audio API (built into all browsers). No CDN dependency needed. AudioContext created on first user interaction (tap to start). All sounds are synthesized oscillators + noise generators.

---

## 6. UI/UX

### 6.1 Screen Flow

```
+------------+     +------------+     +------------+
|   Boot     |---->|    Menu    |---->|    Game    |
|  (BootScene)|    | (MenuScene)|     |(GameScene) |
+------------+     +-----+------+     +------+-----+
                     |    |                  |
                +----+    +----+        +----+----+
                |              |        |  Pause  |---> +----------+
           +----+----+   +----+----+   | Overlay |     |   Help   |
           |   Help  |   |  Skins  |   +---------+     |(HelpScene)|
           |(HelpScene)  | Overlay |        |           +----------+
           +----------+  +---------+   +----+----+
                                       |  Game   |
                                       |  Over   |
                                       |(UIScene)|
                                       +----+----+
                                            |
                                       +----+----+
                                       | Ad/     |
                                       |Continue |
                                       | Prompt  |
                                       +---------+
```

### 6.2 HUD Layout

```
+-------------------------------+
| 1250  Maze 14  [gems] [||]   |  <-- Top bar (48px height, semi-transparent #0A0E1A CC)
+-------------------------------+
|                               |
|                               |
|       +---+---+---+---+      |
|       |   |   |   |   |      |
|       +---+---+---+---+      |
|       | * |   | # |   |      |  <-- Maze grid (centered, fills available space)
|       +---+---+---+---+      |
|       |   |   |   |   |      |
|       +---+---+---+---+      |
|       |   |   |   | E |      |
|       +---+---+---+---+      |
|                               |
|  Moves: 4 / Par: 8           |  <-- Move counter (bottom-left, 20px font)
+-------------------------------+
| [====timer bar (gradient)===] |  <-- Timer bar (8px height, full width)
+-------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Font / Size | Update Frequency |
|---------|----------|---------|-------------|-----------------|
| Score | Top-left, x=16, y=24 | Current total score | Bold 22px, #FFFFFF, shadow #00F5FF40 | On every score event |
| Maze Number | Top-center, x=center, y=24 | "Maze {N}" | Bold 18px, #FFFFFF | On maze transition |
| Gem Counter | Top-right offset, x=width-80, y=24 | 3 gem icons (filled=collected, outline=remaining) | 16x16px SVG icons | On gem collect |
| Pause Button | Top-right, x=width-32, y=24 | "||" icon in circle | 44x44px touch target, 20px icon | Static |
| Move Counter | Bottom-left, x=16, y=height-28 | "Moves: {N} / Par: {P}" | 16px, #FFFFFF80 | On each swipe |
| Timer Bar | Bottom edge, full width | Gradient bar shrinking left-to-right | 8px height, color gradient by % | Every frame (60fps) |
| Combo Counter | Center-top, y=80 | "x{N} ECHO!" | 28px + 4px per chain, #00F5FF | On ghost trail cross, fades 1000ms |
| Star Preview | Below maze, centered | 3 star outlines, fill as earned | 24x24px each, 8px gap | On gem collect / maze complete |

### 6.3 Menu Structure

**Main Menu (MenuScene)**:
```
+-------------------------------+
|                               |
|     GRAVITY FLIP MAZE         |  <-- Title: 32px bold, #00F5FF, glow effect
|     [animated ball icon]      |  <-- Ball SVG bouncing gently (tween y +/-8px, 1500ms)
|                               |
|     +-----------------------+ |
|     |       PLAY            | |  <-- 200x56px, #1E3A5F fill, #00F5FF border 2px, 24px text
|     +-----------------------+ |
|                               |
|     +-----------+ +---------+ |
|     | HOW TO    | | SKINS   | |  <-- 96x48px each, same style, 16px text
|     | PLAY  [?] | | [ball]  | |
|     +-----------+ +---------+ |
|                               |
|  Best: Maze 14   Hi: 4250    |  <-- 14px, #FFFFFF80
|  Stars: 28                    |
|                               |
|  [speaker icon]    [gear]     |  <-- 32x32px icons, bottom corners
+-------------------------------+
```

**Pause Menu** (overlay, #0A0E1A with alpha 0.85):
- Resume (prominent, 200x48px)
- How to Play (120x40px)
- Restart Maze (120x40px)
- Quit to Menu (120x40px)
- Sound toggle (icon, 44x44px)

**Game Over Screen** (overlay on GameScene):
- "GAME OVER" (36px, #FF1493, screen shake on appear)
- Final Score (48px, #FFD700, count-up animation from 0 over 1000ms)
- "NEW BEST!" if applicable (24px, #39FF14, bounce tween)
- Maze Reached: "Maze {N}" (20px, #FFFFFF)
- Stars Earned This Run: star icons (24px)
- "Watch Ad for 3 More Tries" button (200x48px, #9B30FF border, only if ad available)
- "Play Again" button (200x48px, #00F5FF border)
- "Menu" button (120x40px, #1E3A5F border)

**Help / How to Play Screen (HelpScene)**:
- Title: "HOW TO PLAY" (24px, #00F5FF)
- **Swipe diagram**: 4 arrows (up/down/left/right) around a ball SVG, with directional labels. Animated: ball slides in swipe direction on loop.
- **Rules section**:
  - "Swipe to flip gravity. Ball slides until hitting a wall."
  - "Collect all 3 gems for 3 stars."
  - "Avoid pink spikes -- instant death!"
  - "Purple walls phase in/out -- watch the countdown ring."
  - "Cross your ghost trail for a speed boost!"
  - "Complete under par moves for a bonus star."
- **Tips**:
  - "Plan 2-3 moves ahead before swiping."
  - "Ghost trail boosts are risky near spikes -- use wisely."
  - "Rest mazes appear every 10 levels -- catch your breath."
- "GOT IT!" button (160x48px, #39FF14 border, returns to previous scene)
- Scrollable if content exceeds viewport height (Phaser camera scroll or DOM overlay)
- Color palette matches game theme (dark background, neon text)

**Skin Selection Overlay**:
- Grid of 6 ball skins (3x2 grid, 80x80px each)
- Locked skins shown with lock icon + "Need {N} stars" text
- Currently selected skin has #00F5FF border glow
- "BACK" button bottom (120x40px)
- Stored in localStorage: `gravity-flip-maze_selected_skin`

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over (3 deaths on a maze) | Every 2nd game over | After 5 seconds |
| Rewarded | "3 More Tries" on game over screen | Every game over | Always (optional) |
| Rewarded | "Double Score" on game over screen | Every game over | Always (optional) |
| Banner | Menu screen bottom | Always visible on menu | N/A |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Tries | Watch rewarded ad at game over | 3 more attempts on current maze | Once per game over |
| Score Doubler | Watch rewarded ad at game over | 2x final score (for high score purposes) | Once per session |

### 7.3 Session Economy

The game is fully playable without ads. Ads are optional boosters that help players push further or improve their high score. No paywalls, no energy systems. The interstitial frequency (every 2nd game over) is light enough to avoid frustration.

**Session Flow with Monetization**:
```
[Play Mazes] --> [3 Deaths on Maze N] --> [Game Over Screen]
                                               |
                                    +----------+-----------+
                                    |                      |
                          [Rewarded Ad:              [No Ad]
                           3 More Tries?]                 |
                              |                    [Interstitial
                         YES: Resume                (every 2nd GO)]
                         at Maze N                        |
                              |                    [Score Doubler
                              |                     Ad Prompt]
                              |                      |    |
                              |                   YES:  NO:
                              |                   2x    Normal
                              |                   Score Score
                              |                      |    |
                              +-------> [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/gravity-flip-maze/
+-- index.html              # Entry point (~20 lines)
|   +-- CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
|   +-- Local CSS           # css/style.css
|   +-- Local JS (ordered)  # config -> stages -> ads -> help -> ui -> game -> main (LAST)
+-- css/
|   +-- style.css           # Responsive styles, mobile-first (~40 lines)
+-- js/
    +-- config.js           # Constants, colors, difficulty tables, SVG strings (~120 lines)
    +-- stages.js           # Maze generation, BFS validation, difficulty scaling (~250 lines)
    +-- ads.js              # Ad hooks, reward callbacks, frequency tracking (~60 lines)
    +-- help.js             # HelpScene with illustrated instructions (~80 lines)
    +-- ui.js               # MenuScene, GameOverScene overlay, HUD, pause, skins (~280 lines)
    +-- game.js             # GameScene: maze rendering, physics, input, ghost trails, scoring (~290 lines)
    +-- main.js             # BootScene, Phaser config, scene registration, global state (~100 lines)
```

### 8.2 Module Responsibilities

**config.js** (max 120 lines):
- `COLORS` object: all hex color constants from palette
- `DIFFICULTY` table: arrays indexed by maze range for all parameters (grid size, timer, spike count, phasing wall count, speeds, etc.)
- `SCORING` object: point values for all score events
- `BALL_SKINS` array: skin definitions (name, SVG string, stars_required)
- `SVG_STRINGS` object: all SVG markup as const strings (ball, gem, spike, exit, star)
- `GAME_CONFIG` object: swipe thresholds, inactivity timeout, ghost trail duration, boost multiplier, death animation durations
- `PAR_BONUS` constant: extra moves beyond optimal path

**main.js** (max 100 lines, loads LAST):
- `BootScene`: registers all SVG textures via `textures.addBase64()` (one-time, never repeated)
- Listens for all `addtexture` events before starting MenuScene
- Phaser.Game initialization: `{ type: Phaser.AUTO, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 390, height: 700 } }`
- Scene registration: `[BootScene, MenuScene, GameScene, HelpScene]` (UIScene not a separate scene -- game over is overlay within GameScene)
- `GameState` global object: `{ score, highScore, currentMaze, lives, totalStars, gamesPlayed, selectedSkin, settings: { sound, vibration } }`
- localStorage read on boot, write on state change
- Orientation change handler: resize game, re-layout HUD

**game.js** (max 290 lines):
- `GameScene.create()`: render maze grid from `stages.js` output, place ball/gems/spikes/exit, init ghost trail array, start timer, bind swipe input
- `GameScene.update(time, delta)`: update timer bar, animate phasing walls, move moving spikes, check inactivity timer, update ghost trail fading
- Swipe detection: `pointerdown` records start position/time, `pointerup` calculates delta. If delta > 40px and duration < 300ms, determine dominant axis direction. Queue input if ball is moving.
- Ball movement: on valid swipe, flip gravity direction. Ball tweens from current cell to destination cell (calculated by iterating grid in direction until wall/edge). Speed = `DIFFICULTY[range].ballSpeed` px/s. On arrival, check: gem? spike? exit? ghost trail crossing?
- Ghost trail system: array of `{startCell, endCell, timestamp}`. On ball movement, push new trail. On arrival, check if current path segment intersects any existing trail. If yes: apply speed boost (multiply tween speed by boost multiplier for 500ms), emit boost particles, play zap sound, increment combo counter.
- Gem collection: on ball entering gem cell, remove gem sprite, play chime, emit 12 gold particles, increment gem counter, add score, punch score HUD.
- Spike collision: on ball entering spike cell, trigger death sequence: ball shatter (8 fragments), camera shake 6px/300ms, red flash, 500ms delay, then reset maze (re-render, ball to start, timer reset, move counter reset, increment death counter). If death counter >= 3, trigger game over.
- Exit reached: on ball entering exit cell, calculate stars (1 base + 1 if all gems + 1 if under par), play exit animation (portal expand + ball shrink), add score with bonuses, show star award overlay for 1500ms, then generate next maze.
- Inactivity: `lastInputTime` tracked. If `Date.now() - lastInputTime > 10000`, spawn red spike walls at all 4 edges, advancing inward at 20px/s. If ball is touched by inactivity spikes, death. Any swipe input resets timer and retracts spikes.
- Timer: starts at `DIFFICULTY[range].timer` seconds. Decremented in update(). At 5s, start tick sound. At 0, trigger timer death.

**stages.js** (max 250 lines):
- `generateMaze(mazeNumber, gridCols, gridRows)`: recursive backtracker algorithm. Returns `{ grid[][], walls[], entry, exit }`.
- `removeExtraWalls(grid, percentage)`: randomly removes percentage of walls to create openness.
- `placeFeaturesOnMaze(maze, mazeNumber)`: places gems, spikes, phasing walls, moving spikes based on difficulty table. Returns `{ gems[], spikes[], phasingWalls[], movingSpikes[] }`.
- `findOptimalPath(grid, entry, exit)`: BFS returning shortest path length.
- `validateMaze(grid, entry, exit, gems)`: BFS confirms exit reachable AND all gems reachable. Returns boolean.
- `getDifficultyParams(mazeNumber)`: looks up difficulty table, returns parameter object.
- `isRestMaze(mazeNumber)`: returns true if mazeNumber % 10 === 0.
- `isMilestoneMaze(mazeNumber)`: returns true if mazeNumber % 25 === 0.
- Grid representation: 2D array where each cell stores `{ northWall, southWall, eastWall, westWall, visited, content }`. Content can be: null, 'gem', 'spike', 'phasingWall', 'movingSpike', 'entry', 'exit'.

**ui.js** (max 280 lines):
- `MenuScene`: render title, play button, how-to-play button, skins button, stats display, sound toggle. Button handlers start GameScene or launch HelpScene/skin overlay.
- Game Over overlay (rendered within GameScene as a group of sprites/text): score count-up animation, high score check, buttons for ad/retry/menu. Appears on top of frozen game state.
- HUD creation (called by GameScene): score text, maze number text, gem counter icons, pause button, move counter, timer bar graphics. All positioned absolutely within game canvas.
- Pause overlay: semi-transparent background, resume/restart/help/quit buttons.
- Skin selection overlay: grid of ball previews, lock states, selection handler.
- Star award overlay: 1-3 stars animate in with bounce easing, auto-dismiss after 1500ms.
- Utility: `createButton(scene, x, y, width, height, text, color, callback)` helper for consistent button creation.

**help.js** (max 80 lines):
- `HelpScene`: full-screen scene with dark background.
- Animated swipe diagram: ball SVG at center, 4 arrow SVGs around it, ball tweens in each direction on a loop (2s per direction, cycles).
- Rules text: 6 bullet points with gem/spike/wall icons inline.
- Tips text: 3 tips in lighter color.
- "GOT IT!" button at bottom, returns to previous scene via `this.scene.stop('HelpScene'); this.scene.resume(previousScene)`.
- Camera scroll enabled if content height > viewport height.

**ads.js** (max 60 lines):
- Placeholder ad SDK initialization (no real SDK in POC).
- `showInterstitial(callback)`: simulates interstitial (logs to console, calls callback after 100ms).
- `showRewarded(callback)`: simulates rewarded ad (logs, calls callback with reward after 100ms).
- `shouldShowInterstitial()`: returns true every 2nd game over (tracks count in GameState).
- `onAdRewarded(type)`: handles reward -- 'continue' restores 3 lives, 'double' doubles score.
- `canShowAd()`: always returns true in POC.

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No Howler.js needed -- audio via Web Audio API synthesis.

---

## 9. Juice Specification

### 9.1 Player Input Feedback (applied to every swipe)

| Effect | Target | Values |
|--------|--------|--------|
| Directional particles | Ball start position | Count: 8, Direction: opposite of swipe, Color: #00F5FF, Speed: 80-150px/s, Lifespan: 300ms, Size: 3x3px |
| Screen shake | Camera | Intensity: 2px, Duration: 80ms |
| Ball stretch | Ball sprite | Scale in movement axis: 1.3x, perpendicular axis: 0.8x, Recovery: 100ms (squash-and-stretch) |
| Sound | -- | Whoosh (white noise sweep 800->200Hz), 150ms |
| Haptic | Device | navigator.vibrate(15) if enabled |

### 9.2 Core Action Additional Feedback

**Gem Collection** (most satisfying recurring event):

| Effect | Values |
|--------|--------|
| Particles | Count: 12, Radial burst, Color: #FFD700, Speed: 100-200px/s, Lifespan: 400ms, Size: 4x4px |
| Scale punch | Gem sprite scales 1.6x then disappears over 150ms |
| Camera zoom | 1.03x, Recovery: 200ms ease-out |
| Score float | "+50" text, Color: #FFD700, 20px font, floats up 60px, fades over 600ms |
| Sound | Ascending chime C5-G5-C6, 250ms |
| Gem counter | Collected gem icon pulses 1.3x, 120ms recovery |

**Ghost Trail Speed Boost** (unique mechanic feedback):

| Effect | Values |
|--------|--------|
| Screen flash | Full-screen #00FFFF overlay, alpha 0.15, duration 100ms |
| Ball glow | Ball tint shifts to #00FFFF, outer ring radius doubles, persists 500ms |
| Particles | Count: 20, Trail behind ball during boost, Color: #00FFFF, Lifespan: 200ms |
| Scale punch | Ball 1.4x, Recovery: 120ms |
| Combo text | "x{N} ECHO!" at screen center-top, font: 28px + (4 * chainCount)px, Color: #00F5FF, glow shadow, floats up 40px, fades 1000ms |
| Speed lines | 6 horizontal lines across screen (alpha 0.2, #00F5FF), persist during boost duration |
| Sound | Electric zap (sawtooth 200Hz + wobble), 200ms |
| Combo escalation | Every additional chain in same maze: particle count +5, scale punch +0.1x, text size +4px, screen flash alpha +0.05 (capped at 0.4) |

### 9.3 Death/Failure Effects

**Spike Death**:

| Effect | Values |
|--------|--------|
| Ball shatter | 8 triangular fragments, radial velocity 150-300px/s, rotation: random 180-720deg/s, fade over 600ms |
| Screen shake | Intensity: 8px, Duration: 300ms |
| Screen flash | Color: #FF1493, alpha 0.3, Duration: 150ms |
| Chromatic aberration | RGB channel offset 3px for 200ms (via tinted duplicate sprites offset) |
| Sound | Crunch + buzz (noise burst + square 80Hz descending), 400ms |
| Haptic | navigator.vibrate([50, 30, 80]) |
| Effect -> UI delay | 500ms (death animation plays fully before maze resets) |
| Death -> playable | Under 1500ms total (500ms death anim + 200ms fade + 800ms maze re-render) |

**Timer Death**:

| Effect | Values |
|--------|--------|
| Wall flash | All walls flash #FF0000 simultaneously, 150ms |
| Ball dissolve | Scale 1.0 -> 0.0 with 360deg rotation over 400ms |
| Screen fade | Overlay #0A0E1A fades to alpha 0.6 over 400ms |
| Sound | Flatline sine 220Hz, 600ms, then silence |
| Death -> playable | Under 1500ms total |

**Inactivity Death**:

| Effect | Values |
|--------|--------|
| Warning phase (10s idle) | Red vignette overlay pulses alpha 0.0 -> 0.2 -> 0.0, 1000ms cycle. Spike walls appear at edges. |
| Spike wall advance | 4 red walls (#FF0000) advance inward at 20px/s from each edge |
| Death on contact | Same as spike death effects |
| Total idle-to-death time | ~15s (10s warning trigger + ~5s wall advance to center) |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{N}", Color: #FFD700 (gems) / #00F5FF (boost) / #FFFFFF (completion), Font: 20px bold, Movement: float up 60px, Fade: 600ms |
| Score HUD punch | Scale 1.3x, Recovery: 150ms, Color flash to #FFD700 for 200ms then back to #FFFFFF |
| Combo text | Size escalation: base 28px + 4px per combo chain level (capped at 52px) |
| High score beat | If score > highScore at any point: score text permanently glows #FFD700, subtle pulse 1.0->1.05->1.0, 2000ms repeat |
| Maze complete score dump | All bonuses (time, par, gems, completion) appear as separate floating texts staggered 200ms apart, then merge into score with swoosh |

### 9.5 Maze Transition Effects

| Effect | Values |
|--------|--------|
| Exit animation | Portal rings scale 1.0 -> 2.5x and fade over 500ms. Ball scales 1.0 -> 0.0 over 300ms (pulled into portal). 15 green (#39FF14) particles spiral inward. |
| Star award | 1-3 star SVGs fly up from bottom with Bounce.Out easing, staggered 200ms. On 3-star: 20 gold particles burst from stars. |
| Star display duration | 1500ms hold, then auto-dismiss |
| Maze transition | Current maze fades out (alpha 1.0->0.0, 300ms). New maze fades in (alpha 0.0->1.0, 300ms). Ball appears at entry with scale 0.0->1.0 bounce, 200ms. |
| Total transition time | ~2300ms (500ms exit + 1500ms stars + 300ms new maze) |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | No external assets, SVG generated in code |
| Memory Usage | <80MB | Recycle sprite pools, destroy ghost trails after fade |
| JS Bundle Size | <80KB total (excl. CDN) | All 7 JS files combined |
| First Interaction | <500ms after load | BootScene registers textures synchronously |
| Max Sprites per Maze | <120 | Grid cells + walls + features + particles |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser's `pointer` input system (unified touch/mouse)
- **Prevent Default**: CSS `touch-action: none` on game container. Prevent pull-to-refresh via `overscroll-behavior: none`.
- **Orientation**: Portrait-locked via CSS. On landscape detection, show "Please rotate" overlay (visibility:hidden pattern, NOT display:none which kills Phaser canvas).
- **Safe Areas**: `env(safe-area-inset-top)` padding on HUD bar.
- **Throttling**: `visibilitychange` event pauses game timer and physics when tab/app backgrounded.
- **Asset Loading**: Zero external assets. All SVGs generated as base64 data URIs in BootScene.
- **Sprite Pooling**: Ghost trail lines reuse a pool of 20 line graphics. Oldest trail recycled when pool full.
- **Particle Cleanup**: All particle emitters have `maxParticles` set. Particles auto-destroy on lifespan end.

### 10.3 Touch Controls

- **Swipe Detection Zone**: Full screen minus 48px top HUD bar and 8px bottom timer bar.
- **Swipe Thresholds**: Minimum distance 40px, maximum time 300ms. Dead zone: 15px (movement under 15px ignored to prevent accidental swipes).
- **Diagonal Resolution**: Compare abs(deltaX) vs abs(deltaY). Dominant axis wins. If within 10% of each other, ignore (ambiguous swipe).
- **Input Buffering**: If ball is mid-slide, the next swipe is queued. Only 1 queued input at a time. Queued input executes immediately when ball stops.
- **Touch Target Sizes**: All buttons minimum 44x44px. Pause button has 44x44px hit area even if icon is smaller.
- **Feedback Latency**: From swipe detection to ball movement start: <16ms (1 frame).
- **Multi-touch Prevention**: Only first pointer tracked. Subsequent pointers ignored during swipe.

### 10.4 Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome (Android) | 80+ | Primary target |
| Safari (iOS) | 14+ | AudioContext requires user interaction to start |
| Samsung Internet | 14+ | Test touch event handling |
| Firefox (Android) | 90+ | Secondary target |

### 10.5 Local Storage Schema

```json
{
  "gravity-flip-maze_high_score": 0,
  "gravity-flip-maze_games_played": 0,
  "gravity-flip-maze_highest_maze": 0,
  "gravity-flip-maze_total_stars": 0,
  "gravity-flip-maze_selected_skin": "default",
  "gravity-flip-maze_settings": {
    "sound": true,
    "vibration": true
  },
  "gravity-flip-maze_game_over_count": 0
}
```

### 10.6 Critical Implementation Warnings

1. **Script load order**: `index.html` must load `main.js` LAST. Order: config.js -> stages.js -> ads.js -> help.js -> ui.js -> game.js -> main.js.
2. **Texture registration**: All SVGs registered via `textures.addBase64()` in BootScene ONCE. Never re-register on scene restart.
3. **Phasing wall visibility**: Use `sprite.setAlpha(0)` and disable collision body, NOT `display:none` or `setVisible(false)` with active body.
4. **Timer implementation**: Use `this.time.addEvent()` for game timer, NOT `setTimeout()`. Respects scene pause state.
5. **Ghost trail memory**: Cap ghost trail array at 20 entries. Remove oldest when full. Each trail fades alpha over 8000ms then is destroyed.
6. **Maze generation timeout**: If `validateMaze()` fails 10 times, use a hardcoded fallback maze template for that grid size to guarantee playability.
7. **Inactivity spike walls**: These are separate from maze spikes. Created as 4 rect sprites at screen edges. Advanced via `update()` delta time. Destroyed when player swipes.
8. **Scene transitions**: Use `this.scene.start()` for menu<->game. Use overlay groups (not separate scenes) for pause/game-over to preserve game state.
9. **HUD text initialization**: Always initialize score text from `GameState.score`, never from literal `'0'`. Prevents display reset on scene restart.
10. **Orientation handler**: On resize, recalculate cell size = `floor(min(gameWidth, gameHeight - 56) / gridCols)` and re-render maze grid. Use `visibility:hidden` for rotate prompt, never `display:none`.
