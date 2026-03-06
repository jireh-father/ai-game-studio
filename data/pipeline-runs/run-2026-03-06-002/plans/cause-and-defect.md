# Game Design Document: Cause & Defect

**Slug**: `cause-and-defect`
**One-Liner**: A Rube Goldberg machine is breaking -- trace the chaos back to its CAUSE and fix it before everything explodes.
**Core Mechanic**: Side-scrolling Rube Goldberg machine view. Failure cascade propagates left-to-right. Player swipes right to scroll backward, finds the root cause (first broken component), taps it, and chooses the correct fix from 3 options. Wrong fixes make things worse. Time pressure: cascade reaches the end = explosion.
**Target Session Length**: 2-5 minutes
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Cause & Defect is a deduction-under-pressure game where the player watches a whimsical steampunk Rube Goldberg machine fall apart in real time. A chain of failures propagates visibly from left to right -- gears grinding, levers jamming, balls rolling the wrong way, springs snapping. The player must scroll backward through the machine (swipe right) to trace the cascade to its ROOT CAUSE: the single component where the failure originated.

Once the player finds the broken component, they tap it to reveal 3 possible fixes (e.g., "Tighten Gear", "Oil Joint", "Replace Spring"). Choosing correctly repairs the entire section with a deeply satisfying cascade repair animation -- gears re-engage, levers snap back, dominoes stand up. Choosing wrong makes the failure spread FASTER and costs a life (3 lives total). The core tension is a race: the failure cascade marches toward the right edge of the machine, and if it reaches the end, everything explodes (game over for that stage).

Each stage presents a new, longer, more complex machine. Stage 1 has 5 components; by stage 15+ machines have 15+ components with branching paths, hidden root causes behind decoy failures, and compound breakdowns requiring multiple fixes. A par timer and 3-star rating system drives replayability: beat the par time for 3 stars, earn speed bonuses for fast fixes. Inactivity kills: if the player does nothing for 12 seconds, the cascade auto-completes and the machine explodes.

### 1.2 Target Audience

Casual mobile gamers aged 14-40 who enjoy quick-thinking puzzle games with time pressure. Perfect for commuters and break-time players. Appeals to fans of "spot the difference", escape rooms, and deduction games. The whimsical steampunk aesthetic and Rube Goldberg theme attracts curiosity-driven players. Low skill floor (scroll and tap) but high skill ceiling (pattern recognition, speed, deduction under pressure).

### 1.3 Core Fantasy

You are a frantic engineer racing against catastrophe. Your magnificent machine is falling apart and you're the only one who can save it. You're not just fixing symptoms -- you're a detective tracing chaos back to its origin, then a surgeon applying the precise fix. The satisfaction of watching an entire machine cascade back to life after you find the root cause is the core emotional payoff.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 3-5 minutes |
| Day 1 Retention | 42%+ |
| Day 7 Retention | 20%+ |
| Average Stages per Session | 4-8 |
| Crash Rate | <1% |
| 3-Star Completion Rate | 15-25% of attempts |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Stage Start: Machine Running] --> [Failure Cascade Begins (left-to-right)]
         ^                                         |
         |                                  [Player Scrolls Back (swipe right)]
         |                                         |
         |                                  [Find Root Cause Component]
         |                                         |
         |                                  [Tap Component --> 3 Fix Options]
         |                                         |
         |                          [Correct Fix]        [Wrong Fix]
         |                              |                     |
         |                     [Cascade Repair      [Cascade Speeds Up]
         |                      Animation]          [Lose 1 Life]
         |                              |                     |
         |                     [Score + Stars]        [Try Again on same
         |                              |              component if lives > 0]
         |                              |                     |
         +-------- [Next Stage] <-------+            [0 Lives = Game Over]
                                                     [Cascade Reaches End = Explode]
```

**Moment-to-moment gameplay:**
1. Stage begins: a Rube Goldberg machine is displayed, scrolling automatically to show its full length (2-4 seconds intro pan).
2. The failure cascade ignites at the leftmost component and begins propagating right. Each component takes `cascadeSpeed` ms to fail (starts at 2000ms per component, decreases with difficulty).
3. The player swipes RIGHT to scroll the viewport backward (left) through the machine to find the root cause.
4. The root cause component has a distinct visual tell: a subtle pulsing glow (#FF6B35 at 40% opacity, 800ms pulse cycle) that distinguishes it from symptomatic failures.
5. Player taps the suspected root cause component. If it IS the root cause, 3 fix options appear as buttons below the component. If it's NOT the root cause (a symptom), the component flashes red and a "Not the cause!" toast appears (costs 1.5s of time but no life).
6. Player selects one of 3 fix options. One is correct; one is plausible-wrong (makes cascade 50% faster); one is absurd-wrong (makes cascade 100% faster + lose 1 life).
7. Correct fix: cascade repair animation plays right-to-left. Score awarded based on time remaining and components saved.
8. Stage complete: star rating shown. Next stage loads.
9. If cascade reaches the rightmost component: explosion animation, lose 1 life, stage restarts.
10. If 0 lives: game over screen.
11. Inactivity death: if no touch input for 12 seconds, cascade speed doubles every 2s until explosion.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Scroll Machine | Swipe Left/Right | Swipe horizontally to scroll viewport across the machine. Swipe right = scroll left (toward root cause). Swipe left = scroll right (toward cascade front). Momentum-based scrolling with 0.92 friction decay per frame. |
| Inspect Component | Tap | Tap any component to inspect it. If it's the root cause, fix options appear. If not, red flash + "Not the cause!" feedback. |
| Select Fix | Tap Button | Tap one of 3 fix option buttons that appear below the inspected root cause component. Buttons are 140x50px with 12px spacing. |
| Pause | Tap Pause Icon | Tap the pause button (top-right, 44x44px) to pause the cascade timer. |

**Control Philosophy**: Horizontal swiping maps naturally to scrolling through a machine that extends left-to-right. Tapping maps to "investigating" and "fixing" -- direct, tactile interaction with the machine components. The controls are intentionally simple (swipe + tap) so all cognitive load goes to the deduction puzzle, not the controls.

**Touch Area Map**:
```
+-------------------------------+
| Score  Stage  Timer  [||]Pause|  <-- HUD Bar (y: 0-48px)
+-------------------------------+
|  Lives: *** | Par: 15s        |  <-- Status Bar (y: 48-80px)
+-------------------------------+
|                               |
|                               |
|     MACHINE VIEWPORT          |  <-- Scrollable Machine View (y: 80-640px)
|     (horizontally scrollable) |      Components rendered here
|                               |      Swipe left/right to scroll
|     [Gear]-[Lever]-[Ramp]... |
|                               |
|                               |
+-------------------------------+
|                               |
|   [Fix Option A]              |  <-- Fix Options Zone (y: 640-760px)
|   [Fix Option B]              |      Appears only when root cause tapped
|   [Fix Option C]              |      Each button: 300x50px, centered
|                               |
+-------------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Correct Fix (base) | 100 | -- |
| Time Bonus | +5 per second remaining on par timer | Only if completed under par |
| Components Saved Bonus | +15 per unfailed component | Components that hadn't failed yet when fix applied |
| Streak Bonus | +25 per consecutive correct first-try fix | Resets on wrong fix or wrong component tap |
| Speed Fix (under 5s) | 2.0x stage score | Applied after all other bonuses |
| Perfect Stage (no wrong taps, first fix correct, under par) | 3.0x stage score | Replaces Speed Fix if both qualify |
| Wrong Component Tap | -0 points (time penalty only) | Costs ~1.5s animation time |
| Wrong Fix (plausible) | -0 points, cascade 50% faster | No point penalty, but time pressure increases |
| Wrong Fix (absurd) | -50 points, lose 1 life | Direct score penalty + life loss |

**Combo System**: The streak bonus tracks consecutive stages completed with correct first-try fixes (no wrong taps, no wrong fix selections). Streak counter displayed on HUD. Each streak stage adds +25 to the base Streak Bonus pool. Streak of 5 = +125 bonus per stage. Streak resets to 0 on any mistake. Visual escalation: streak 3+ adds golden particle trail on scroll; streak 5+ adds screen border glow (#FFD700 at 30% opacity).

**High Score**: Total cumulative score across all stages in a session. Stored in localStorage. Displayed on menu screen and game over screen. High score beat triggers confetti + "NEW RECORD!" text with scale punch animation.

### 2.4 Progression System

The game uses infinite stage progression with escalating machine complexity, component variety, and time pressure. Each stage introduces new challenges to keep the experience fresh.

**Progression Milestones**:

| Stage Range | Components | New Element Introduced | Cascade Speed (ms/component) | Par Time (s) |
|------------|-----------|----------------------|------------------------------|-------------|
| 1-3 | 5 | Base mechanics: gears, levers, ramps. Single linear path. Root cause always leftmost. | 2000 | 20 |
| 4-6 | 6-7 | Springs and dominoes added. Root cause can be 2nd or 3rd from left. One decoy failure (looks broken but isn't the cause). | 1700 | 18 |
| 7-10 | 8-9 | Pendulums and pulleys added. Branching paths (machine splits into 2 parallel tracks). Root cause can be on either branch. | 1400 | 16 |
| 11-15 | 10-12 | Conveyor belts and funnels. Triple fix difficulty: plausible-wrong option becomes very convincing. Decoy failures increase to 2. | 1200 | 14 |
| 16-20 | 12-14 | Hidden components (must scroll past visual obstruction to find). Compound breakdowns: 2 components fail simultaneously (only one is root cause). | 1000 | 13 |
| 21-30 | 14-15 | All component types mixed. Cascade speed continues dropping. Rest stage every 5th stage (simpler machine, generous par). | 900 | 12 |
| 31+ | 15 (cap) | Randomized mix of all mechanics. Cascade speed floor at 700ms. Par time floor at 10s. Boss stages every 10th (special golden machine, 2x score). | 700 (floor) | 10 (floor) |

### 2.5 Lives and Failure

The player starts each session with **3 lives**, represented as wrench icons in the HUD.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Absurd-wrong fix selected | Lose 1 life + cascade 100% faster | Continue on same stage with remaining lives |
| Cascade reaches rightmost component (explosion) | Lose 1 life + stage restarts | Retry same stage with remaining lives |
| Inactivity (12s no input) | Cascade doubles speed every 2s until explosion | Touch screen to resume normal cascade speed |
| 0 lives remaining | Game Over | Watch rewarded ad for +1 life (once per session) OR restart from stage 1 |

**Life Recovery**: No natural life recovery during gameplay. The rewarded ad continue is the only recovery mechanism (once per session). This creates meaningful tension around each life.

**Death-to-restart timing**: Game Over screen appears 800ms after final death animation. "Play Again" button is tappable immediately. New game loads within 1.2s of tap. Total death-to-gameplay: under 2 seconds.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each stage procedurally generates a Rube Goldberg machine. The generation algorithm ensures every machine is solvable (exactly one root cause, exactly one correct fix per root cause, and the root cause is always reachable by scrolling).

**Generation Algorithm**:
```
Stage Generation Parameters:
- Seed: stageNumber * 7919 + sessionSalt (sessionSalt = Date.now() % 10000)
- Component Count: min(5 + floor(stageNumber * 0.7), 15)
- Component Pool: filtered by stageNumber (see progression table)
- Cascade Speed: max(2000 - stageNumber * 80, 700) ms per component
- Par Time: max(20 - stageNumber * 0.5, 10) seconds
- Root Cause Position: random index from 0 to floor(componentCount * 0.6)
  (always in the left 60% of the machine to require scrolling)
- Branching: stageNumber >= 7 ? random(0,1) : 0
  (branch point at component index floor(componentCount * 0.4))
- Decoy Count: floor(stageNumber / 4), capped at 3
- Hidden Component: stageNumber >= 16 ? random(0,1) : 0
```

**Component Types** (unlocked progressively):

| Component | SVG Shape | Failure Visual | Unlock Stage |
|-----------|-----------|---------------|-------------|
| Gear | Circle with teeth (24px radius) | Teeth jam, sparks particle | 1 |
| Lever | Rectangle on pivot (40x8px) | Stuck at angle, vibrates | 1 |
| Ramp | Angled rectangle (50x6px) | Cracks appear, ball stuck | 1 |
| Spring | Zigzag line (16px wide, 30px tall) | Compressed flat, bounces wrong | 4 |
| Domino | Thin tall rectangle (8x24px) | Falls wrong direction | 4 |
| Pendulum | Circle on line (12px radius, 40px arm) | Swings erratically | 7 |
| Pulley | Two circles with line (10px radius each) | Rope snaps visual | 7 |
| Conveyor | Rectangle with arrows (50x12px) | Arrows reverse, jams | 11 |
| Funnel | Trapezoid shape (30px top, 10px bottom) | Clogged, overflow particles | 11 |

**Fix Option Generation**:
Each root cause component type has a bank of 6+ possible fixes. For each stage, 1 correct fix and 2 wrong fixes (1 plausible, 1 absurd) are selected randomly from the bank.

Example fix banks:
- **Gear**: Correct: ["Tighten bolts", "Replace teeth", "Realign axle"]. Plausible-wrong: ["Oil surface", "Spin faster", "Add weight"]. Absurd-wrong: ["Kick it", "Paint it", "Ignore it"].
- **Lever**: Correct: ["Reset pivot", "Adjust fulcrum", "Clear obstruction"]. Plausible-wrong: ["Push harder", "Shorten arm", "Flip over"]. Absurd-wrong: ["Sit on it", "Remove it", "Yell at it"].
- **Spring**: Correct: ["Replace spring", "Adjust tension", "Reattach hook"]. Plausible-wrong: ["Stretch it", "Compress more", "Heat it"]. Absurd-wrong: ["Eat it", "Freeze it", "Sing to it"].

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

| Parameter | Stage 1-3 | Stage 4-6 | Stage 7-10 | Stage 11-15 | Stage 16-20 | Stage 21-30 | Stage 31+ |
|-----------|-----------|-----------|------------|-------------|-------------|-------------|-----------|
| Components | 5 | 6-7 | 8-9 | 10-12 | 12-14 | 14-15 | 15 |
| Cascade Speed (ms) | 2000 | 1700 | 1400 | 1200 | 1000 | 900 | 700 |
| Par Time (s) | 20 | 18 | 16 | 14 | 13 | 12 | 10 |
| Decoy Failures | 0 | 1 | 1 | 2 | 2-3 | 3 | 3 |
| Branching | No | No | Yes (2 paths) | Yes | Yes | Yes | Yes |
| Hidden Components | No | No | No | No | Yes (1) | Yes (1-2) | Yes (2) |
| Root Cause Depth | Leftmost | Top 40% | Top 50% | Top 55% | Top 60% | Top 60% | Top 60% |
| Component Types | 3 | 5 | 7 | 9 | 9 | 9 | 9 |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every machine has exactly 1 root cause. The root cause is always a reachable component (never obscured without a scroll path). The correct fix is always among the 3 options. The cascade always starts from the component immediately RIGHT of the root cause and propagates rightward.
2. **Variety Threshold**: Consecutive stages must differ in at least 2 of: root cause component type, root cause position (different index), machine layout (component sequence), and total component count. The seeded RNG ensures deterministic but varied generation.
3. **Difficulty Monotonicity**: Cascade speed never increases between stages. Component count never decreases. Par time never increases. Local difficulty may vary (rest stages are easier in component count but maintain cascade speed).
4. **Rest Stages**: Every 5th stage (5, 10, 15, 20...) is a rest stage: component count reduced by 2, par time increased by 3s, no decoy failures, no branching. Visually marked with a calming blue-tinted background (#1A3A4A).
5. **Boss Stages**: Every 10th stage (10, 20, 30...) is a boss stage: a special golden machine (#FFD700 component tint) with maximum complexity for that difficulty tier but 2x score multiplier. Boss machines have a unique animated background (slowly rotating gears in the background layer).

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Whimsical steampunk with a hand-drawn feel. Brass, copper, and iron tones dominate the machine components. Background is a dark workshop with subtle wood-grain texture patterns. Components have visible bolts, rivets, and mechanical details rendered in simple SVG. The overall feel is "charming workshop chaos" -- think Wallace & Gromit meets a clock repair shop.

**Aesthetic Keywords**: Steampunk, Whimsical, Brass, Mechanical, Workshop

**Reference Palette**: Warm industrial tones against a dark workshop backdrop. Failure states use angry reds and oranges. Repair states use satisfying greens and golds. The machine itself feels tactile and physical.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Brass (Primary) | Warm brass | #C8963E | Machine components (healthy state), primary UI elements |
| Copper (Secondary) | Copper accent | #B87333 | Component details, rivets, bolts, secondary accents |
| Iron (Tertiary) | Dark iron | #4A4A4A | Component outlines, structural elements, connectors |
| Background | Dark workshop | #1A1A2E | Game background base |
| Workshop Wood | Dark wood | #2D1F11 | Background texture panel |
| Failure Red | Angry red | #E63946 | Failed components, wrong fix flash, danger indicators |
| Failure Orange | Warning orange | #FF6B35 | Root cause glow pulse, cascade front indicator |
| Success Green | Repair green | #2ECC71 | Correct fix flash, cascade repair animation |
| Gold Reward | Bright gold | #FFD700 | Star ratings, streak indicators, boss stage tint, score popups |
| UI Text | Cream white | #F5E6CC | Score, labels, menus, HUD text |
| UI Background | Dark overlay | #0D0D1AE6 | Menu overlays (90% opacity), pause screen |
| Button Primary | Teal | #1ABC9C | Play button, positive action buttons |
| Button Danger | Muted red | #C0392B | Wrong fix buttons after selection, quit buttons |

### 4.3 SVG Specifications

All game graphics are rendered as SVG elements generated in code. No external image assets.

**Gear Component (Healthy)**:
```svg
<svg width="48" height="48" viewBox="0 0 48 48">
  <!-- Outer gear teeth (8 teeth) -->
  <circle cx="24" cy="24" r="20" fill="#C8963E" stroke="#4A4A4A" stroke-width="2"/>
  <circle cx="24" cy="24" r="12" fill="#B87333" stroke="#4A4A4A" stroke-width="1.5"/>
  <!-- Center axle -->
  <circle cx="24" cy="24" r="4" fill="#4A4A4A"/>
  <!-- Gear teeth rendered as 8 small rectangles rotated around center -->
  <!-- rect x="22" y="0" width="4" height="8" fill="#C8963E" transform="rotate(0,24,24)" -->
  <!-- rect x="22" y="0" width="4" height="8" fill="#C8963E" transform="rotate(45,24,24)" -->
  <!-- ... repeated for 8 teeth at 45-degree intervals -->
</svg>
```

**Gear Component (Failed)**:
```svg
<!-- Same as healthy but with: -->
<!-- fill changed to #E63946 (failure red) -->
<!-- Added crack line: line x1="14" y1="14" x2="34" y2="34" stroke="#1A1A2E" stroke-width="2" -->
<!-- Spark particles: 4 small circles at random offsets, fill="#FF6B35" -->
```

**Lever Component (Healthy)**:
```svg
<svg width="56" height="40" viewBox="0 0 56 40">
  <!-- Pivot base -->
  <polygon points="24,36 32,36 28,28" fill="#4A4A4A"/>
  <!-- Lever arm -->
  <rect x="4" y="18" width="48" height="6" rx="2" fill="#C8963E" stroke="#4A4A4A" stroke-width="1.5" transform="rotate(-5,28,21)"/>
  <!-- Pivot bolt -->
  <circle cx="28" cy="21" r="3" fill="#B87333" stroke="#4A4A4A" stroke-width="1"/>
</svg>
```

**Ramp Component**:
```svg
<svg width="60" height="32" viewBox="0 0 60 32">
  <polygon points="0,30 60,10 60,18 0,38" fill="#C8963E" stroke="#4A4A4A" stroke-width="1.5"/>
  <!-- Surface rivets -->
  <circle cx="15" cy="28" r="1.5" fill="#B87333"/>
  <circle cx="30" cy="22" r="1.5" fill="#B87333"/>
  <circle cx="45" cy="16" r="1.5" fill="#B87333"/>
</svg>
```

**Spring Component**:
```svg
<svg width="24" height="40" viewBox="0 0 24 40">
  <polyline points="4,4 20,10 4,16 20,22 4,28 20,34" fill="none" stroke="#C8963E" stroke-width="3" stroke-linecap="round"/>
  <!-- Top/bottom caps -->
  <rect x="2" y="0" width="20" height="4" rx="1" fill="#4A4A4A"/>
  <rect x="2" y="36" width="20" height="4" rx="1" fill="#4A4A4A"/>
</svg>
```

**Domino Component**:
```svg
<svg width="16" height="32" viewBox="0 0 16 32">
  <rect x="2" y="2" width="12" height="28" rx="2" fill="#C8963E" stroke="#4A4A4A" stroke-width="1.5"/>
  <!-- Dots -->
  <circle cx="8" cy="10" r="2" fill="#4A4A4A"/>
  <circle cx="8" cy="22" r="2" fill="#4A4A4A"/>
</svg>
```

**Connector Pipes** (between components):
```svg
<svg>
  <!-- Horizontal pipe connecting two components -->
  <rect x="0" y="0" width="{gap}" height="6" rx="2" fill="#4A4A4A"/>
  <!-- Bolts at each end -->
  <circle cx="3" cy="3" r="2" fill="#B87333"/>
  <circle cx="{gap-3}" cy="3" r="2" fill="#B87333"/>
</svg>
```

**Explosion Effect** (game over):
```svg
<!-- Starburst shape -->
<polygon points="center calculation for 12-point star" fill="#E63946"/>
<!-- Debris: 8-12 small random rectangles scattered outward -->
<!-- Smoke: 3 circles with gradient opacity, expanding radius -->
```

**Wrench (Life Icon)**:
```svg
<svg width="20" height="20" viewBox="0 0 20 20">
  <path d="M4,16 L10,10 L8,4 L12,4 L14,10 L16,8 L16,12 L10,14 Z" fill="#C8963E" stroke="#4A4A4A" stroke-width="1"/>
</svg>
```

**Star (Rating Icon)**:
```svg
<svg width="24" height="24" viewBox="0 0 24 24">
  <polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="#FFD700" stroke="#B87333" stroke-width="1"/>
</svg>
```

**Design Constraints**:
- All SVG elements use basic shapes (rect, circle, polygon, polyline, line) -- no complex bezier paths
- Maximum 12 path/shape elements per SVG object
- Component SVGs are pre-rendered to Phaser textures via `textures.addBase64()` in BootScene
- Animations via Phaser tweens, not SVG animate elements
- All components fit within a 60x48px bounding box for consistent machine layout

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Failure Cascade Glow | Component fails in cascade | Component tint transitions from #C8963E to #E63946 over 300ms. Red pulse glow (Phaser tween alpha 0.3→0.8→0.3, 600ms loop). |
| Root Cause Pulse | Root cause component (always visible) | Orange glow ring (#FF6B35, 40% opacity) pulses scale 0.9→1.1 over 800ms, looping. Subtle enough to require attention. |
| Spark Particles | Component fails | 6 particles, color #FF6B35, radius 2px, velocity 40-80px/s radial, lifespan 400ms, gravity 120px/s². |
| Cascade Repair Wave | Correct fix applied | Green wave (#2ECC71) sweeps right-to-left at 200px/s. Each component it passes transitions from #E63946 back to #C8963E over 200ms with scale punch 1.2x. |
| Repair Particles | Each component repaired in cascade | 10 particles, color #2ECC71 + #FFD700 mix, radius 3px, velocity 60-100px/s upward, lifespan 500ms. |
| Wrong Fix Flash | Wrong fix selected | Screen border flashes #E63946 at 80% opacity, 150ms on, 150ms off, 2 cycles. Component shakes 4px horizontal, 200ms. |
| Explosion | Cascade reaches end / game over | Screen shake 12px, 400ms. Starburst SVG scales from 0 to 2.0x over 200ms. 20 debris particles fly outward. Screen desaturates over 300ms. |
| Scroll Momentum | Player swipes to scroll | Machine viewport scrolls with momentum. Friction: velocity *= 0.92 per frame. Elastic bounce at edges (100ms, 20px overshoot). |
| Star Award | Stage complete | Stars scale from 0 to 1.0 sequentially (200ms each, 150ms delay between). Gold particle burst on each star (8 particles). |
| Streak Fire | Streak 3+ | Golden particle trail follows scroll viewport edges. 4 particles/frame, color #FFD700, lifespan 300ms, velocity upward 30px/s. |
| Component Hover Highlight | Player finger near component | Component brightness increases 20% when touch position is within 30px. Helps with selection accuracy on mobile. |

---

## 5. Audio Design

### 5.1 Sound Effects

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Component Fail | Metallic clank + grinding | 200ms | High |
| Root Cause Tap (correct) | Satisfying mechanical "click-clunk" | 150ms | High |
| Wrong Component Tap | Dull buzz/error tone | 200ms | Medium |
| Correct Fix Selected | Ratchet wrench sound + ascending chime | 300ms | High |
| Wrong Fix (plausible) | Metal stress creak + warning buzz | 250ms | High |
| Wrong Fix (absurd) | Comedic spring boing + crash | 350ms | High |
| Cascade Repair (per component) | Quick mechanical "tick" ascending in pitch | 80ms | Medium |
| Cascade Repair Complete | Triumphant brass fanfare sting | 600ms | High |
| Explosion | Low boom + glass shatter + metal debris | 500ms | High |
| Star Earned | Bright chime, pitch ascending per star (+200 cents per star) | 200ms | Medium |
| Scroll | Soft mechanical whir (looping while scrolling) | Loop | Low |
| Stage Start | Workshop ambient + machine startup whir | 800ms | Medium |
| Inactivity Warning | Ticking clock, accelerating tempo | Loop (starts at 8s idle) | High |
| Game Over | Descending brass, somber workshop bell | 800ms | High |
| New High Score | Celebratory gear-chime jingle | 1200ms | High |
| Button Tap | Soft metallic click | 80ms | Low |
| Life Lost | Heavy thud + glass crack | 300ms | High |

### 5.2 Music Concept

**Background Music**: No continuous background music -- the game's soundscape IS the machine. Ambient workshop sounds (distant clanking, steam hisses, ticking) create atmosphere. This keeps the audio space clear for gameplay-critical sounds (failure cascade, repair cascade). Intensity builds through sound effect density rather than music.

**Music State Machine**:

| Game State | Audio Behavior |
|-----------|---------------|
| Menu | Soft ambient workshop loop (steam hisses, distant clanks, clock ticking). Volume: 40%. |
| Stage Intro | Machine startup whir layered over ambient. Volume: 50%. |
| Active Gameplay | Ambient workshop base + cascade sounds (metallic failing sounds propagate with cascade). Volume: 60%. |
| Cascade Nearing End (last 3 components) | Ambient pitch shifts up. Ticking clock sound added at 2x speed. Volume: 80%. |
| Correct Fix / Repair | Repair cascade sounds dominate. Ambient returns to calm. Volume: 60%. |
| Game Over | All sounds fade. Single workshop bell toll. Silence for 500ms. Then somber ambient. Volume: 30%. |
| Pause | All sounds muted except soft ambient at 15% volume. |

**Audio Implementation**: Web Audio API via Phaser's built-in sound manager. All sounds are procedurally generated using oscillators and noise (no external audio files needed). Tone.js-style synthesis for metallic sounds.

---

## 6. UI/UX

### 6.1 Screen Flow

```
+------------+     +------------+     +------------+
|   Boot     |---->|   Menu     |---->|   Game     |
|  (textures)|     |   Screen   |     |   Scene    |
+------------+     +-----+------+     +------+-----+
                     |   |                   |
                +----+   +----+         +----+----+
                |             |         |  Pause  |---->+---------+
           +----+----+  +----+----+    | Overlay |     |  Help   |
           |  Help   |  |Settings |    +----+----+     |How2Play |
           |How2Play |  | Overlay |         |          +---------+
           +---------+  +---------+    +----+----+
                                       | Game    |
                                       |  Over   |
                                       | Screen  |
                                       +----+----+
                                            |
                                       +----+----+
                                       |Continue |
                                       |Ad Prompt|
                                       +---------+
```

### 6.2 HUD Layout

```
+-------------------------------------------+
| 1250   Stage 7  ***  14.2s   [||]        |  <-- Top HUD (y: 0-48px)
| Score  StageNum Lives Timer   Pause       |
+-------------------------------------------+
| Streak: 4x          Par: 15s    *** Stars |  <-- Sub-HUD (y: 48-76px)
+-------------------------------------------+
|                                           |
|  [Gear]--[Lever]--[Ramp]--[Spring]--     |
|                                           |  <-- Machine Viewport (y: 76-600px)
|    <<< scroll left   scroll right >>>     |      Full horizontal scroll area
|                                           |
|  Machine extends 800-2400px wide          |
|  Viewport shows ~360px at a time          |
|                                           |
+-------------------------------------------+
|                                           |
|  [ Tighten Bolts  ]  (300x50px)          |  <-- Fix Options (y: 600-760px)
|  [ Oil Surface    ]  (300x50px)          |      Visible only when root
|  [ Kick It        ]  (300x50px)          |      cause is tapped
|                                           |
+-------------------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Font/Size | Update Frequency |
|---------|----------|---------|-----------|-----------------|
| Score | Top-left (x:12, y:14) | Current session score, animated on change | 20px bold, #F5E6CC | Every score event |
| Stage Number | Top-center (x:center, y:14) | "Stage {N}" with gear icon prefix | 18px bold, #F5E6CC | On stage transition |
| Lives | Top-center-right (x:center+60, y:14) | Wrench icons (filled=#C8963E, empty=#4A4A4A) | 16px icon, 3 slots | On life change |
| Timer | Top-right (x:right-80, y:14) | Countdown seconds with 1 decimal. Turns #E63946 under 5s. | 18px bold, #F5E6CC/#E63946 | Every frame |
| Pause Button | Top-right corner (x:right-16, y:14) | "||" icon, 44x44px hit area | -- | Static |
| Streak Counter | Sub-HUD left (x:12, y:56) | "Streak: {N}x" -- visible only when streak >= 2 | 14px, #FFD700 | On stage complete |
| Par Time | Sub-HUD center (x:center, y:56) | "Par: {N}s" | 14px, #F5E6CC | On stage start |
| Star Rating | Sub-HUD right (x:right-60, y:56) | 3 star outlines, fill on earn | 16px star icons | On stage complete |
| Cascade Progress | Bottom of machine viewport | Thin bar showing cascade front position (red fill, left-to-right) | 4px height, full width | Every frame |

### 6.3 Menu Structure

**Main Menu**:
```
+-------------------------------------------+
|                                           |
|         [Gear Logo Animation]             |
|                                           |
|        CAUSE  &  DEFECT                   |
|     "Fix the machine before it blows!"    |
|                                           |
|         [ >>> PLAY <<< ]                  |  280x60px, #1ABC9C, centered
|                                           |
|      [?] How to Play     [Trophy] Best    |  44x44px icons, y: 500
|                                           |
|      [Gear] Settings     [Sound] On/Off   |  44x44px icons, y: 560
|                                           |
|         High Score: 12450                 |  16px, #FFD700, y: 640
|         Best Stage: 23                    |  14px, #F5E6CC, y: 662
|                                           |
+-------------------------------------------+
```

**Pause Menu** (overlay, #0D0D1A at 90% opacity):
- Resume (280x50px, #1ABC9C)
- How to Play (280x50px, #C8963E)
- Restart Stage (280x50px, #C8963E)
- Quit to Menu (280x50px, #C0392B)
- Sound toggle (icon, top-right of overlay)

**Game Over Screen**:
```
+-------------------------------------------+
|                                           |
|           MACHINE EXPLODED!               |  28px bold, #E63946
|                                           |
|        Final Score: 3,450                 |  32px bold, #FFD700 (animated count-up)
|        Stage Reached: 12                  |  18px, #F5E6CC
|        Best Streak: 5                     |  16px, #F5E6CC
|                                           |
|        >>> NEW RECORD! <<<                |  (if applicable, #FFD700, pulsing)
|                                           |
|        Stars Earned: ** (14/36)           |  16px, star icons
|                                           |
|   [Watch Ad: +1 Life & Continue]          |  280x50px, #FFD700 (once per session)
|                                           |
|   [     Play Again      ]                 |  280x50px, #1ABC9C
|   [     Main Menu       ]                 |  280x50px, #C8963E
|                                           |
+-------------------------------------------+
```

**Help / How to Play Screen** (overlay, scrollable):
```
+-------------------------------------------+
|        HOW TO PLAY              [X Close] |
+-------------------------------------------+
|                                           |
|  [SVG: Machine with arrow pointing left]  |
|  "Swipe RIGHT to scroll back through     |
|   the machine and find the ROOT CAUSE"    |
|                                           |
|  [SVG: Finger tapping glowing component]  |
|  "TAP the glowing broken part to          |
|   inspect it"                             |
|                                           |
|  [SVG: 3 fix option buttons]             |
|  "Choose the CORRECT fix from 3 options. |
|   Wrong fixes make things WORSE!"         |
|                                           |
|  [SVG: Cascade repair animation frames]   |
|  "Fix the cause and watch the machine    |
|   repair itself in a satisfying cascade!" |
|                                           |
|  TIPS:                                    |
|  - Look for the ORANGE GLOW - that's     |
|    the root cause!                        |
|  - Absurd fixes (like "Kick It") cost    |
|    you a LIFE. Be careful!               |
|  - Fix under par time for 3 STARS        |
|                                           |
|         [ Got It! ]                       |  280x50px, #1ABC9C
+-------------------------------------------+
```
- Visual diagrams use the game's own SVG component art
- Scrollable via touch if content exceeds viewport
- Matches game color palette (#1A1A2E background, #F5E6CC text)
- "Got it!" returns to previous screen (menu or pause)

**Settings Screen** (overlay):
- Sound Effects: On/Off toggle (default: On)
- Music/Ambient: On/Off toggle (default: On)
- Vibration: On/Off toggle (default: On, if supported)
- All toggles: 60x30px, #1ABC9C (on) / #4A4A4A (off)

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Interstitial | After stage 10, 20, 30... | Every 10 stages | After 5 seconds |
| Rewarded | Continue after game over (+1 life) | Every game over (once per session max) | Always optional |
| Rewarded | Engineer's Toolkit (highlights root cause for 3s) | Once per stage, available from stage 5+ | Always optional |
| Banner | Menu screen bottom | Always visible on menu only | N/A |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Life (Continue) | Watch rewarded ad after game over | +1 life, resume from current stage | Once per session |
| Engineer's Toolkit | Watch rewarded ad during gameplay (button appears after 5s on a stage) | Root cause component highlighted with bright arrow for 3s | Once per stage, max 3 per session |
| Double Score | Watch rewarded ad at game over | 2x final session score (for high score purposes) | Once per session |

### 7.3 Session Economy

The game balances free play with natural ad touchpoints. A typical session lasts 3-5 minutes (4-8 stages). Players encounter an interstitial roughly every 3 minutes of play. Rewarded ads are purely optional and provide meaningful but not game-breaking advantages.

**Session Flow with Monetization**:
```
[Play Stage 1-9 Free] --> [Stage 10: Interstitial Ad]
         |                          |
   [Continue Playing]  <------------+
         |
   [Death / Game Over]
         |
   [Rewarded Ad: +1 Life?] --Yes--> [Resume + Continue]
         |No                              |
   [Game Over Screen]              [Eventually Die Again]
         |                              |
   [Interstitial (every 3rd GO)]  [Game Over Screen]
         |                              |
   [Rewarded Ad: 2x Score?]            |
         |                              |
   [Play Again / Menu]  <--------------+

Optional during gameplay:
[Stuck on Stage 5+] --> [Engineer's Toolkit Button Appears]
         |
   [Rewarded Ad: Highlight Root Cause 3s?] --Yes--> [Root cause arrow shown]
         |No
   [Continue unaided]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/cause-and-defect/
+-- index.html              # Entry point, CDN loads, script order
|   +-- CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
|   +-- Local CSS            # css/style.css
|   +-- Local JS (ordered):  # config -> stages -> ads -> help -> ui -> game -> main (LAST)
+-- css/
|   +-- style.css            # Responsive styles, mobile-first, game container
+-- js/
    +-- config.js            # Constants, colors, difficulty tables, SVG strings, fix banks
    +-- game.js              # GameScene: machine rendering, cascade logic, scroll, fix selection
    +-- stages.js            # Stage generation algorithm, component placement, difficulty calc
    +-- ui.js                # MenuScene, GameOverScene, HUD overlay, pause overlay, settings
    +-- help.js              # HelpScene: illustrated how-to-play with SVG diagrams
    +-- ads.js               # Ad integration hooks, reward callbacks, toolkit logic
    +-- main.js              # BootScene (texture registration), Phaser config, scene array, global state (LOADS LAST)
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `COLORS` object: all hex codes from color palette
- `DIFFICULTY_TABLE`: array of objects keyed by stage range, containing componentCount, cascadeSpeed, parTime, decoyCount, branchingEnabled, hiddenCount, rootCauseDepthPercent
- `COMPONENT_TYPES`: array of {name, svgHealthy, svgFailed, width, height, unlockStage, fixBank}
- `FIX_BANKS`: object keyed by component type, containing correct[], plausibleWrong[], absurdWrong[] arrays
- `SCORING`: object with BASE_FIX=100, TIME_BONUS_PER_SEC=5, COMPONENT_SAVED=15, STREAK_BONUS=25, SPEED_MULTIPLIER=2.0, PERFECT_MULTIPLIER=3.0, ABSURD_PENALTY=-50
- `JUICE`: object with all particle counts, shake intensities, timing values
- `SVG_STRINGS`: all SVG markup as template literal strings
- `GAME_SETTINGS`: lives=3, inactivityDeathMs=12000, inactivityWarningMs=8000, cascadeSpeedBoostWrong=0.5, cascadeSpeedBoostAbsurd=1.0

**game.js** (max 300 lines):
- `GameScene extends Phaser.Scene`
- `create()`: Initialize machine from stage data, set up scroll input (pointer drag), place components, start cascade timer, init lives/score/timer
- `update()`: Update cascade progression, check inactivity timer, update timer display, check game-over conditions (cascade complete, 0 lives)
- `handleScroll(pointer)`: Momentum-based horizontal scrolling with friction (0.92/frame) and elastic edge bounce
- `handleComponentTap(component)`: Check if tapped component is root cause. If yes, show fix options. If no, red flash + time penalty.
- `handleFixSelection(fixType)`: Process correct/plausible-wrong/absurd-wrong fix. Trigger appropriate cascade repair or speed-up.
- `playCascadeRepair()`: Animate repair wave right-to-left, restoring each component with green flash and particles
- `playExplosion()`: Death animation sequence, life deduction, stage restart or game over
- `checkInactivity()`: If no input for 12s, double cascade speed every 2s. Warning sound at 8s.
- Event emitters for UI updates (score change, life change, timer update, stage complete)

**stages.js** (max 300 lines):
- `generateStage(stageNumber, sessionSalt)`: Returns stage object with component array, root cause index, layout data, par time, cascade speed
- `getDifficultyParams(stageNumber)`: Lookup difficulty table, interpolate values
- `placeComponents(components, canvasWidth)`: Calculate x,y positions for each component in the machine. Handle branching paths (Y-split at branch point).
- `generateFixOptions(rootCauseType)`: Select 1 correct, 1 plausible-wrong, 1 absurd-wrong from fix banks. Shuffle order.
- `isRestStage(stageNumber)`: Returns true for stages divisible by 5
- `isBossStage(stageNumber)`: Returns true for stages divisible by 10
- `generateConnectors(components)`: Create pipe/connection SVG data between adjacent components
- Seeded PRNG function using stage number + session salt for deterministic generation

**ui.js** (max 300 lines):
- `MenuScene extends Phaser.Scene`: Title, Play button, How to Play button, Settings, High Score display
- `GameOverScene extends Phaser.Scene`: Final score (animated count-up over 1.5s), stage reached, streak, star count, action buttons (continue ad, play again, menu)
- `HUDScene extends Phaser.Scene` (runs parallel to GameScene): Score display, stage number, lives (wrench icons), timer, pause button, streak counter, par time, star outlines, cascade progress bar
- `PauseOverlay`: Semi-transparent overlay with resume/restart/help/quit buttons
- `SettingsOverlay`: Sound/ambient/vibration toggles
- Button factory function: creates consistent styled buttons (rect + text, pointer events, scale punch on press)

**help.js** (max 300 lines):
- `HelpScene extends Phaser.Scene`: Illustrated how-to-play screen
- Renders 4 instruction panels with SVG diagrams showing: scrolling, tapping root cause, fix selection, repair cascade
- Tips section with game-specific advice
- "Got It!" button returns to previous scene
- Scrollable content area for small screens
- Uses game's own component SVGs for visual consistency

**ads.js** (max 300 lines):
- `AdManager` class (singleton)
- `showInterstitial(callback)`: Placeholder for interstitial ad. Tracks game-over count, shows every 3rd.
- `showRewarded(type, callback)`: Placeholder for rewarded ad. Types: 'continue', 'toolkit', 'doubleScore'. Tracks usage per session.
- `showToolkit(gameScene)`: Triggers Engineer's Toolkit -- highlights root cause component with arrow overlay for 3000ms.
- `onAdComplete(type, success)`: Callback handler. Dispatches reward to game scene.
- `canShowToolkit()`: Returns true if stage >= 5 and toolkit uses < 3 this session.
- `canShowContinue()`: Returns true if not yet used this session.
- Banner display/hide logic for menu screen.

**main.js** (max 300 lines) -- **LOADS LAST**:
- `BootScene extends Phaser.Scene`: Reads all SVG strings from config.js, encodes via `btoa()`, registers via `textures.addBase64()`. Listens for all texture-added events before starting MenuScene.
- `GameState` global object: highScore, gamesPlayed, highestStage, settings, currentScore, currentStage, lives, streak, sessionSalt, adUsage
- Phaser.Game initialization: type AUTO, width 360, height 760, backgroundColor #1A1A2E, scale mode FIT, autoCenter CENTER_BOTH
- Scene registration: [BootScene, MenuScene, HelpScene, GameScene, HUDScene, GameOverScene]
- LocalStorage read/write functions for persistence
- Orientation change handler (resize callback)
- `window.GameState` exposed globally for cross-scene access

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No additional CDN dependencies. Audio is handled via Phaser's built-in Web Audio support. No Howler.js needed since sounds are procedurally generated.

---

## 9. Juice Specification

### 9.1 Player Input Feedback (applied to every tap on a component)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Tapped component | Count: 8, Direction: radial, Color: #C8963E, Radius: 2px, Velocity: 50-90px/s, Lifespan: 350ms, Gravity: 0 |
| Scale punch | Tapped component | Scale: 1.25x, Recovery: 100ms ease-out |
| Brightness flash | Tapped component | Tint: 0xFFFFFF (white flash), Duration: 60ms, then restore original tint |
| Haptic | Device | navigator.vibrate(15) on tap |

### 9.2 Core Action: Correct Fix Selection (most satisfying moment)

| Effect | Values |
|--------|--------|
| Hit-stop | 40ms physics/cascade pause (all tweens pause, timer pauses) |
| Camera zoom | 1.04x zoom on root cause component, hold 300ms, ease back to 1.0x over 200ms |
| Screen shake | Intensity: 3px, Duration: 100ms (subtle, positive shake) |
| Repair Cascade Particles (per component restored) | Count: 10, Color: #2ECC71 (60%) + #FFD700 (40%), Radius: 3px, Velocity: 60-100px/s upward, Lifespan: 500ms, Gravity: 80px/s² |
| Repair Wave | Green tint wave (#2ECC71 at 50% opacity) sweeps right-to-left at 200px/s. Each component: scale punch 1.2x over 120ms. |
| Combo escalation | Streak 2+: particle count +3 per streak level. Streak 4+: screen shake intensity +1px per level. Streak 6+: repair wave speed +50px/s per level above 5. |
| Score popup | "+{N}" floating text, Color: #FFD700, Font: 24px bold, Rise: 60px upward over 600ms, Fade: alpha 1.0→0.0 over 600ms |

### 9.3 Core Action: Wrong Fix Selection

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 6px (plausible-wrong) / 10px (absurd-wrong), Duration: 250ms |
| Screen flash | Border flash #E63946 at 80% opacity, 2 cycles of 150ms on / 150ms off |
| Component reaction | Wrong component shakes 4px horizontal oscillation, 200ms, then tint to #E63946 |
| Cascade speed visual | All currently-failing components pulse faster (existing red pulse cycle halved from 600ms to 300ms) |
| Life lost (absurd only) | Wrench icon in HUD: scale 1.5x, tint red, fade to empty (gray) over 300ms. Camera shake 8px for 200ms. |

### 9.4 Cascade Failure Propagation (each component failing)

| Effect | Values |
|--------|--------|
| Spark particles | Count: 6, Color: #FF6B35 (70%) + #E63946 (30%), Radius: 2px, Velocity: 40-80px/s radial, Lifespan: 400ms, Gravity: 120px/s² |
| Component tint transition | Healthy #C8963E to Failed #E63946, Tween duration: 300ms |
| Component vibration | Horizontal oscillation: 2px amplitude, 80ms period, 3 cycles then stop |
| Connector pipe crack | Dark crack line appears on connector, 100ms draw animation |
| Cascade front indicator | Pulsing red arrow above the cascade front component, bob up/down 4px, 400ms cycle |

### 9.5 Death/Failure Effects (Explosion -- cascade reaches end)

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 12px random offset (both axes), Duration: 400ms, Decay: linear |
| Explosion starburst | Scale from 0 to 2.0x over 200ms at rightmost component position, Color: #E63946 core + #FF6B35 outer |
| Debris particles | Count: 20, Shapes: small rectangles (4x2px), Color: #C8963E + #4A4A4A + #B87333 random, Velocity: 100-200px/s radial, Lifespan: 800ms, Gravity: 150px/s², Rotation: random 0-360 degrees |
| Screen desaturation | Phaser pipeline or tint: saturation fades to 30% over 300ms |
| Slow motion | Time scale: 0.3x for 400ms before explosion resolves (using Phaser scene time scale, NOT global) |
| Sound | Low boom 500ms |
| Effect-to-UI delay | 800ms from explosion start to game-over overlay appearing |
| Death-to-restart | **Under 2 seconds** (800ms effect + tappable "retry" immediately on game-over screen, stage reload: 400ms) |

### 9.6 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{N}" at fix location, Color: #FFD700, Font: 24px bold, Movement: rise 60px, Fade: 600ms |
| Score HUD punch | Scale 1.3x, Recovery: 150ms ease-out |
| Time bonus text | "+{N}s bonus" separate float, Color: #2ECC71, Font: 18px, Rise: 40px, Fade: 500ms, Offset: 20px right of score float |
| Combo/streak text | "STREAK x{N}!" center screen, Font: 28px + 2px per streak level, Color: #FFD700, Scale punch 1.4x, Fade: 800ms |

### 9.7 Stage Transition Effects

| Effect | Values |
|--------|--------|
| Star award sequence | Stars scale from 0→1.0 sequentially, 200ms each, 150ms stagger. Each star: 8 gold particles (#FFD700), 3px radius, 60px/s upward, 400ms lifespan. |
| Stage number announcement | "STAGE {N}" center screen, Font: 36px bold, Color: #F5E6CC, Scale from 1.5x→1.0x over 400ms, Hold 600ms, Fade 300ms |
| Machine intro pan | Camera auto-scrolls from left to right across full machine width at 300px/s, then snaps back to rightmost view (where cascade starts). Total: 2-4s depending on machine length. |
| Boss stage intro | Golden flash (#FFD700 at 40% opacity, full screen), 200ms. "BOSS MACHINE" text with gear icon, 36px, golden, 800ms display. |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | Performance.timing API |
| Memory Usage | <80MB | Chrome DevTools Memory panel |
| JS Bundle Size | <400KB total (excl. CDN) | File size check |
| First Interaction | <1 second after load | Time to first meaningful paint |
| Max Particles On Screen | 60 simultaneous | Object pool with recycling |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Use Phaser's input system with `pointer` events (handles both touch and mouse)
- **Prevent Default**: Prevent pull-to-refresh via `touch-action: none` on game container. Prevent pinch-to-zoom and double-tap-to-zoom.
- **Orientation**: Lock to portrait mode via CSS. On landscape detection, show "Please rotate" overlay using `visibility:hidden; height:0; overflow:hidden` pattern (NEVER `display:none` on Phaser canvas).
- **Safe Areas**: Account for notch/cutout safe areas via `env(safe-area-inset-top)` CSS.
- **Throttling**: Detect `visibilitychange` event, pause game scene and cascade timer when backgrounded.
- **Asset Loading**: All SVG generated in code, registered as base64 textures in BootScene. No loading screen needed. Total texture count: ~20 (9 component types x healthy/failed + icons).
- **Particle Pool**: Pre-allocate particle pool of 60 objects. Recycle oldest particles when pool exhausted.
- **Scroll Performance**: Machine components outside viewport +/- 100px are set to `visible=false` to reduce draw calls. Re-enable on scroll.

### 10.3 Touch Controls

- **Touch Target Size**: All interactive components have minimum 44x44px hit areas (even if visual is smaller, the interactive zone is padded).
- **Gesture Recognition**: Horizontal swipe (drag) for scrolling. Tap (pointerup within 200ms of pointerdown and <10px movement) for component selection. No complex multi-touch.
- **Feedback**: Visual brightness flash + haptic vibrate(15) on every tap. Scroll has momentum physics feedback.
- **Dead Zones**: Vertical swipe movements >30px cancel horizontal scroll (prevents accidental scroll while trying to tap).
- **Input Buffering**: If player taps a component while fix options are animating in, buffer the tap and process after animation completes (150ms max buffer).
- **Anti-Random-Tap Protection**: Tapping wrong components costs ~1.5s in animation time. Tapping absurd fixes costs a life. This makes spam-tapping a losing strategy -- deliberate deduction is always faster.

### 10.4 Local Storage Schema

```json
{
  "cause_and_defect_high_score": 0,
  "cause_and_defect_games_played": 0,
  "cause_and_defect_highest_stage": 0,
  "cause_and_defect_total_stars": 0,
  "cause_and_defect_best_streak": 0,
  "cause_and_defect_settings": {
    "sound": true,
    "ambient": true,
    "vibration": true
  },
  "cause_and_defect_total_score": 0,
  "cause_and_defect_ad_continue_used": false,
  "cause_and_defect_toolkit_uses_session": 0
}
```

Session-scoped values (`ad_continue_used`, `toolkit_uses_session`) reset on page load / new session. All other values persist across sessions.

### 10.5 Critical Implementation Warnings

1. **NEVER use `display:none` on Phaser canvas** -- use `visibility:hidden; height:0; overflow:hidden` for hiding game container (orientation overlay, etc.).
2. **Register ALL textures in BootScene ONLY** -- never call `addBase64()` on scene restart. Use `textures.exists(key)` guard.
3. **main.js loads LAST** in script order. Load order: config.js -> stages.js -> ads.js -> help.js -> ui.js -> game.js -> main.js.
4. **Cascade timer uses `this.time.addEvent()`** not `setTimeout()`. On pause, Phaser timers auto-pause. On scene restart, timers auto-clean.
5. **Scene time scale for slow-mo**: Use `this.time.timeScale` for death slow-mo, NOT global `game.loop.timeScale`. Restore to 1.0 in cleanup.
6. **Stage transition flag**: Use `this.stageTransitioning = true` guard to prevent `update()` from processing cascade/input during stage transitions. Reset on new stage `create()`.
7. **Fix options zone**: Fix option buttons must have higher depth than machine components AND be interactive. Use `setInteractive()` on both text and background rect.
8. **HUD as parallel scene**: Run HUDScene via `this.scene.launch('HUDScene')` from GameScene. Communicate via events (`this.events.emit`). Null-guard all event handlers.
9. **Inactivity timer reset**: Reset inactivity timer on ANY pointer event (down, move, up). Not just pointerdown.
10. **Seeded RNG**: Implement simple seeded PRNG (mulberry32 or similar) to ensure deterministic stage generation from seed. Do NOT use `Math.random()` for stage generation.
