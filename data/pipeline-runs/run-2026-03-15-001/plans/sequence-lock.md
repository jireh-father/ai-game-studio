# Game Design Document: Sequence Lock

**Slug**: `sequence-lock`
**One-Liner**: Crack the data vault — tap scrambled numbers in ascending order before the security breach timer expires.
**Core Mechanic**: Visual-search number-tap with draining timer, color-coded categories, streak multiplier, power tiles, and escalating stage modifiers.
**Target Session Length**: 4–7 minutes
**Date Created**: 2026-03-15
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Sequence Lock casts the player as a rogue hacker infiltrating a series of encrypted data vaults. Each vault contains a grid of glowing "data nodes" — circuit-board tiles marked with scrambled numbers. The player must crack the vault by tapping the nodes in ascending numerical order (1, 2, 3 … N) while a "SECURITY BREACH" countdown bar empties toward lockout. Tap the correct next number and the node shatters in a burst of neon particles while the timer refills slightly. Tap wrong and the alarm spikes — a red flash and a time penalty push the player closer to failure.

The game addresses the Scout and Ludus concern (shallow generic number-tap) through three differentiating layers. First, tiles belong to color-coded security categories; clearing a full same-color sequence within a stage earns a Category Bonus that feeds a persistent streak multiplier. Second, scattered Power Tiles (Overload Bomb, Cryofreeze, Neural Reveal) introduce split-second tactical decisions — do you tap the power tile now or detour around it to preserve your streak? Third, from stage 10 onward, random Challenge Modifiers (MIRROR, ROTATION, GHOST tiles, DECOY nodes) mutate each stage visually, ensuring no two stages above the tutorial band feel the same.

The result is a game that starts as pure reflexive visual-search and graduates into a rapid pattern-recognition puzzle where veteran players develop genuine expertise: recognizing number clusters by color zone, stockpiling Cryofreeze power tiles at critical moments, and routing sequences to maximize same-color chains. The cyberpunk hacker aesthetic — dark circuit-board background, neon cyan/green nodes, "LOCK CRACKED" fanfares, and matrix-rain transitions — gives the experience a strong visual identity that cleanly separates it from generic Brain Age clones.

### 1.2 Target Audience

Casual mobile gamers aged 16–35 who enjoy light cognitive challenge with explosive visual feedback. Ideal play context: commute, waiting room, or couch. Players do not need prior puzzle experience — stage 1 teaches everything in under 20 seconds. The cyberpunk theme skews slightly older than typical number games, attracting fans of sci-fi aesthetics. Session length of 4–7 minutes fits a standard transit segment. One-handed portrait play is fully supported.

### 1.3 Core Fantasy

The player is a legendary hacker who cracks digital vaults at superhuman speed. The fantasy is cognitive superiority: scanning a chaotic grid of numbers and instantly recognizing the correct sequence faster than an AI security system can respond. Each correct tap is a "got it" micro-triumph. A perfect same-color chain run feels like executing a flawless algorithm. The "SYSTEM LOCKOUT" death screen reinforces the tension — the machine finally caught up with you.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 5 minutes |
| Day 1 Retention | 40%+ |
| Day 7 Retention | 20%+ |
| Average Stages per Session | 8–12 |
| Death within 30s idle | 100% (enforced by draining timer) |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Stage Start]
    │
    ▼
[Grid of N numbered tiles appears — timer starts draining]
    │
    ▼
[Player scans grid → taps lowest remaining number]
    │
    ├── CORRECT TAP ──→ [Tile shatters + green particles + small timer refill]
    │                        │
    │                        ├── [Same-color as last tap?] → [Streak +1]
    │                        └── [Power Tile?] → [Activate power effect]
    │
    └── WRONG TAP ───→ [Red flash + time penalty -1.5s + streak reset]
    │
    ▼
[All tiles cleared OR timer empties]
    │
    ├── ALL CLEARED ──→ ["LOCK CRACKED" fanfare + score tally + next stage]
    └── TIMER EMPTY ──→ ["SYSTEM LOCKOUT" screen + game over]
         │
         └── [Watch ad to continue? → Refill timer at 50%, same stage]
```

Moment-to-moment: the player visually scans the grid searching for the next lowest number. The tile layout is random each stage, so the scan is genuinely effortful at high tile counts. Each correct tap removes a tile, shrinking the search space. The timer creates a "beat the clock" pressure that accelerates the cognitive load. A visible streak counter above the grid rewards same-color consecutive taps with escalating multipliers, creating an optional metagame layer: instead of finding numbers in raw ascending order, expert players route their taps through color clusters.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Tap tile | Single tap anywhere on a tile | Registers a number selection. Correct: tile shatters. Wrong: penalty. |
| (No swipe) | — | All interaction is tap-only. No swipes or holds required. |
| Pause | Tap "II" button (top-right of HUD) | Pauses game, shows pause overlay. |
| Resume | Tap "RESUME" button in pause overlay | Unpauses and resumes timer countdown. |
| Help | Tap "?" button (menu or pause) | Opens How to Play screen. |

**Control Philosophy**: Single-tap-only design keeps cognitive load entirely on visual scanning and decision-making, not on gesture execution. Every player interaction is a deliberate choice: which tile to tap next. There is no accidental swipe-to-die. Touch targets are sized to be tappable under rush conditions.

**Touch Area Map**:
```
┌─────────────────────────────┐  ← 360px wide
│  SCORE       STAGE   [II]   │  ← 56px top HUD bar
├─────────────────────────────┤
│  [STREAK x3]  [TIMER BAR]   │  ← 40px streak/timer strip
├─────────────────────────────┤
│                             │
│   ┌───┬───┬───┬───┬───┐    │
│   │ 7 │ 2 │14 │ 9 │ 5 │    │  ← Grid of tiles
│   ├───┼───┼───┼───┼───┤    │     Each tile min 60x60px (3x3 grid)
│   │ 1 │11 │ 4 │17 │12 │    │     or min 52x52px (5x5 grid on 360px)
│   ├───┼───┼───┼───┼───┤    │
│   │ 8 │ 3 │16 │ 6 │10 │    │
│   ├───┼───┼───┼───┼───┤    │
│   │13 │20 │ 2 │15 │18 │    │
│   ├───┼───┼───┼───┼───┤    │
│   │19 │ 7 │11 │ 1 │ 4 │    │
│   └───┴───┴───┴───┴───┘    │
│                             │
│   "NEXT: 1"  hint label     │  ← 32px hint strip (fades after stage 5)
└─────────────────────────────┘  ← 760px total height on 360x760 viewport
```

**Grid sizing constraints**:
- 3x3 grid: tiles 80x80px, 4px gap → grid 248px wide, centered
- 4x4 grid: tiles 72x72px, 4px gap → grid 296px wide, centered
- 5x5 grid: tiles 60x60px, 4px gap → grid 316px wide, centered (minimum 44px touch target met with 60px tile)

### 2.3 Scoring System

| Score Event | Base Points | Multiplier Condition |
|------------|-------------|---------------------|
| Correct tap | 100 | × current streak multiplier |
| Same-color consecutive tap | +50 bonus | Stacks with streak multiplier |
| Stage cleared (all tiles tapped) | 500 × stage_number | × current streak multiplier at clear moment |
| Category Bonus (full same-color sequence in one stage) | 1000 | Only if all tiles in a color group tapped consecutively |
| Power Tile: Overload Bomb activated | 200 (auto-clears 4 adj tiles) | Each auto-cleared tile earns 50 pts flat (no multiplier) |
| Power Tile: Neural Reveal activated | 0 pts | Strategic value only |
| Power Tile: Cryofreeze activated | 0 pts | Strategic value only |
| Wrong tap penalty | −0 pts | But timer −1.5s and streak resets to ×1 |
| Perfect Stage (zero wrong taps) | +1000 flat bonus | Applied after stage clear |

**Streak Multiplier System**:
- Start of game and after any wrong tap: streak = 0, multiplier = ×1.0
- After 3 consecutive correct taps: streak = "HOT", multiplier = ×1.5
- After 6 consecutive correct taps: streak = "CHAIN", multiplier = ×2.0
- After 10 consecutive correct taps: streak = "OVERLOAD", multiplier = ×3.0
- After 15+ consecutive correct taps: streak = "GOD MODE", multiplier = ×5.0
- Multiplier resets to ×1.0 on any wrong tap
- Multiplier persists across stage transitions (carry your streak forward)
- Streak counter displayed as glowing number above grid, color shifts from cyan → yellow → orange → red as multiplier escalates

**Same-Color Category Bonus**: Each tile has a color tag (cyan, green, orange, purple, red). If the player taps a consecutive run of same-color tiles without tapping any differently-colored tile in between, the run earns a +50 bonus per tile in the run. A full color category sweep (all tiles of one color in a stage cleared in a single uninterrupted run) earns the 1000-pt Category Bonus.

**High Score**: Stored in localStorage as `sequence-lock_high_score`. Displayed on Game Over screen with "NEW RECORD" neon flash if beaten. Best stage also stored as `sequence-lock_highest_stage`.

### 2.4 Progression System

The player moves through infinite stages. Each stage increases in tile count, time pressure, visual complexity, and modifier frequency. There are no unlocks or meta-progression systems — replayability comes entirely from score chasing and streak mastery.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1–4 | Tutorial band: 3x3 grid, 9 tiles, 10s timer. Single color (cyan). "NEXT:" hint visible. | Easy. Learn the scan-and-tap loop. |
| 5–9 | 4x4 grid, 16 tiles, 9s timer. Two color categories (cyan + green). Streak multiplier UI appears. | Medium. Introduce color routing. |
| 10–12 | First Power Tiles appear (1–2 per stage). Colors: 3 categories. | Medium+. Power tile decision-making. |
| 13–18 | 5x5 grid, 25 tiles, 8s timer. All 5 color categories. MIRROR modifier introduced (stage 13). | Hard. Visual search complexity peaks. |
| 19–25 | ROTATION modifier introduced (stage 19, random). Decoy tiles appear (stage 22). Ghost tiles (stage 25). | Very Hard. Multiple simultaneous modifiers. |
| 26+ | Drifting tiles (tiles slowly shift position during stage). Face-down flip mechanic (tiles briefly hide number). 2–3 modifiers per stage chosen randomly. | Extreme. Survival demands mastery. |
| Every 5th stage | Rest stage: 3x3 grid, single color, 12s timer, no modifiers. | Deliberate breather before next escalation. |
| Every 10th stage | Challenge stage: double tile count for grid size, bonus 2000 pts for clearing, unique NEON SURGE visual effect. | Milestone marker with bonus reward. |

### 2.5 Lives and Failure

**Death condition**: The "SECURITY BREACH" timer bar reaches zero during an active stage. The timer drains continuously at a rate determined by the current stage. There is no "lives" pool — every run is a single-life session. One timer depletion = run over.

**Wrong tap consequence**: Immediate time penalty of −1.5 seconds (visible as timer bar jumping left). Streak resets. At high stages this alone can be nearly fatal — two consecutive wrong taps at stage 25+ is a ~3.0s penalty when total time may only be 7s. This is the "two consecutive wrong taps are nearly fatal" design intent.

**Inactivity death**: The timer drains whether or not the player taps. Standing still for ~8–10 seconds (depending on stage) will always empty the timer. Death within 30s of inactivity is guaranteed at all stages.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Timer bar reaches zero | SYSTEM LOCKOUT — game over screen | Watch rewarded ad to continue (once per run, refills timer to 50%) |
| Wrong tap at critical low timer | Likely game over (cascading time penalty) | None — avoid wrong taps |

---

## 3. Stage Design

### 3.1 Infinite Stage Generation

Each stage is generated fresh using a seeded pseudorandom shuffle. The number sequence (1 to N where N = tile count for current grid size) is shuffled and placed on the grid. Color assignments follow a weighted random distribution that guarantees at least 2 tiles per active color category, enabling viable same-color chain strategies.

**Generation Algorithm**:
```
Stage Generation Parameters:
  stage_number        → integer, 1 to infinity
  grid_size           → getGridSize(stage_number) → 3, 4, or 5
  tile_count          → grid_size × grid_size (9, 16, or 25)
  time_budget_ms      → getTimeBudget(stage_number) → see difficulty table
  active_colors       → getColorCount(stage_number) → 1, 2, 3, 4, or 5
  power_tile_count    → getPowerTileCount(stage_number) → 0, 1, 2, or 3
  modifier_flags      → getModifiers(stage_number) → array of 0–3 modifiers
  is_rest_stage       → (stage_number % 5 === 0)
  is_challenge_stage  → (stage_number % 10 === 0 && stage_number > 0)

  Number placement:
    numbers = shuffle([1 … tile_count])  using seeded RNG (seed = stage_number × 7919)
    place numbers[i] at grid position i in reading order

  Color assignment:
    For each tile i:
      base_color = floor(i / (tile_count / active_colors))  [even distribution]
      apply ±1 random shuffle among neighbors               [prevents obvious color blocks]

  Power tile placement (if power_tile_count > 0):
    power_positions = random sample of power_tile_count positions from tile array
    assign power types: weight Cryofreeze 40%, Overload 40%, Neural Reveal 20%
    power tiles have their number replaced by an icon glyph
    power tiles count as "any number" — tapping them activates effect immediately
    they do NOT need to be tapped in sequence order (player chooses when)

  Modifier application:
    MIRROR: all tile numbers reflected left-right visually (not shuffled — same layout, mirrored)
    ROTATION: grid rotated 90° or 180° (randomly chosen)
    GHOST: 20% of tiles are face-down at stage start, flip face-up after 1.2s
    DECOY: 2 tiles show plausible wrong numbers (e.g., showing "3" when correct next is "4")
           Decoy tile flashes wrong color briefly when tapped; counts as wrong tap
    DRIFT: tiles move slowly (8px/s) in random directions, bouncing off grid boundaries
```

### 3.2 Difficulty Curve

```
Difficulty (composite)
    │
100 │                                                    ──────── (cap at 95)
    │                                              ╱─╲
 85 │                                        ╱────╯   rest dips
    │                                   ╱───╯
 70 │                             ╱────╯
    │                       ╱────╯
 55 │                 ╱────╯
    │           ╱────╯
 40 │     ╱────╯
    │  ╱─╯
 25 │╱  (tutorial band)
    │
  0 └──────────────────────────────────────────────── Stage
    0    5    10    15    20    25    30    40    50+
    ↑         ↑          ↑          ↑         ↑
  Tutorial  Power     5x5 grid  Drift+Flip  Extreme
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1–4 | Stage 5–12 | Stage 13–25 | Stage 26–50 | Stage 51+ |
|-----------|-----------|------------|-------------|-------------|-----------|
| Grid size | 3x3 (9 tiles) | 4x4 (16 tiles) | 5x5 (25 tiles) | 5x5 (25 tiles) | 5x5 (25 tiles) |
| Timer budget | 10,000ms | 9,000ms | 8,000ms | 7,500ms | 7,000ms |
| Timer drain rate | 1,000ms/s | 1,000ms/s | 1,125ms/s | 1,333ms/s | 1,500ms/s |
| Timer refill per correct tap | 600ms | 500ms | 400ms | 350ms | 300ms |
| Wrong tap penalty | −1,500ms | −1,500ms | −1,500ms | −1,750ms | −2,000ms |
| Active color categories | 1 | 2–3 | 3–5 | 5 | 5 |
| Power tile count | 0 | 1 | 1–2 | 2–3 | 3 |
| Modifiers per stage | 0 | 0 | 1 | 1–2 | 2–3 |
| Rest stage override | — | — | Every 5th | Every 5th | Every 5th |

**Rest Stage Override**: When `stage_number % 5 === 0`, regardless of stage range: 3x3 grid, 12,000ms timer, no modifiers, 1 color category, 0 power tiles. This creates a rhythmic breathing pattern.

**getGridSize(n)**:
- n < 5 → 3
- n < 13 → 4
- n ≥ 13 → 5

**getTimeBudget(n)**:
- n < 5 → 10000ms
- n < 13 → 9000ms
- n < 26 → 8000ms
- n < 51 → 7500ms
- n ≥ 51 → 7000ms
(Rest stages always return 12000ms)

**getColorCount(n)**:
- n < 5 → 1
- n < 8 → 2
- n < 11 → 3
- n < 16 → 4
- n ≥ 16 → 5

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every number 1–N appears exactly once. The grid always has a valid solution (tapping 1, 2, 3 … N in order). Power tiles do not occupy a number position — they are extra tiles that expand the grid only on stages where power tiles exist (they appear as additional nodes surrounding the core grid, highlighted with a glowing border).

2. **Variety Threshold**: Consecutive non-rest stages must differ in at least 2 of: layout seed, color assignment, modifier combination, power tile types. Since the seed is `stage_number × 7919`, consecutive layouts are always different.

3. **Difficulty Monotonicity**: Timer budget only decreases across stages (with rest-stage exceptions). Grid size only increases. Modifier count only increases. No parameter regresses except at intentional rest stages.

4. **Rest Stages**: Every 5th stage is a rest stage (stages 5, 10, 15, 20 …). Visual treatment: rest stages use a warmer amber/gold palette overlay, slightly slower matrix-rain background, "VAULT SECURED" clear message instead of "LOCK CRACKED".

5. **Challenge Stages**: Every 10th stage (stages 10, 20, 30 …) overrides rest-stage logic. Challenge stages: 5x5 grid even if normally 3x3 or 4x4, timer +2s bonus over normal, special NEON SURGE visual effect (all tiles pulse in sequence before stage begins), +2000 pts clear bonus. Visual treatment: golden border around entire grid.

6. **Power Tile Placement Safety**: Power tiles are never placed at grid positions 1 or 2 of the shuffled sequence (i.e., never hiding the very first number the player needs). This prevents instant-frustration situations where the player must immediately navigate around a power tile.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Cyberpunk circuit-board hacker aesthetic. Dark backgrounds with glowing neon elements. Grid tiles resemble electronic circuit nodes with subtle PCB trace lines connecting them. Numbers are rendered in monospace digital font styling. Particle effects use sharp angular shards rather than soft circles — every shattered tile looks like exploding data.

**Aesthetic Keywords**: Neon noir, data matrix, circuit breach, digital shard, synthetic glow

**Reference Palette Mood**: Dark navy-black base with electric cyan and acid green primaries. Accent colors (orange, purple, red) for tile categories. Everything should feel illuminated from within, as though tiles are lit data modules.

### 4.2 Color Palette

| Role | Color Name | Hex | Usage |
|------|-----------|-----|-------|
| Background | Void Black | `#050A0F` | Game canvas background |
| Grid Background | Deep Circuit | `#0A1628` | Behind tile grid, PCB texture layer |
| Circuit Traces | Dark Teal | `#0D2137` | Decorative PCB lines between tiles |
| Tile Base | Matrix Panel | `#0E2240` | Default tile fill (unactivated) |
| Tile Border | Cyan Glow | `#00E5FF` | Primary tile category — default/cyan |
| Category Green | Acid Green | `#39FF14` | Color category 2 — green tiles |
| Category Orange | Plasma Orange | `#FF6B00` | Color category 3 — orange tiles |
| Category Purple | Volt Purple | `#B24BF3` | Color category 4 — purple tiles |
| Category Red | Alert Red | `#FF1744` | Color category 5 — red tiles (danger feel) |
| Correct Flash | Flash White | `#E0FFFF` | Brief tile flash on correct tap |
| Wrong Flash | Error Red | `#FF1744` | Brief tile flash on wrong tap |
| Timer Bar Full | Breach Cyan | `#00E5FF` | Timer bar fill when high |
| Timer Bar Critical | Critical Red | `#FF1744` | Timer bar fill when below 25% |
| Timer Bar Background | Dark Slate | `#112233` | Timer bar background track |
| HUD Text | Terminal White | `#E0F7FA` | Score, stage number labels |
| HUD Accent | Neon Cyan | `#00E5FF` | Score value, active state indicators |
| Streak Multiplier | Hot Orange | `#FF9100` | Streak counter when active |
| Streak Overload | God Gold | `#FFD700` | Streak at ×5 (GOD MODE) |
| Stage Clear Text | Lime Flash | `#CCFF00` | "LOCK CRACKED" text |
| Game Over Text | Alarm Red | `#FF1744` | "SYSTEM LOCKOUT" text |
| Power Tile Border | Power Gold | `#FFD700` | Border for all power tile types |
| Menu Background | Black Panel | `#070D17` | Menu screen background |
| Button Fill | Cyber Blue | `#0D2F5A` | Menu/UI button fill |
| Button Border | Glow Cyan | `#00E5FF` | Menu/UI button border |
| Button Text | Terminal White | `#E0F7FA` | Button labels |

### 4.3 SVG Specifications

All SVG strings are defined as `const` in `config.js`, then registered once in BootScene via `textures.addBase64()`. Phaser scenes reference textures by key string only.

**Standard Tile (Cyan Category)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <!-- Outer border with glow -->
  <rect x="1" y="1" width="58" height="58" rx="4" fill="#0E2240" stroke="#00E5FF" stroke-width="2"/>
  <!-- Corner circuit notches -->
  <rect x="0" y="0" width="8" height="2" fill="#00E5FF" rx="1"/>
  <rect x="0" y="0" width="2" height="8" fill="#00E5FF" rx="1"/>
  <rect x="52" y="0" width="8" height="2" fill="#00E5FF" rx="1"/>
  <rect x="58" y="0" width="2" height="8" fill="#00E5FF" rx="1"/>
  <rect x="0" y="58" width="8" height="2" fill="#00E5FF" rx="1"/>
  <rect x="0" y="52" width="2" height="8" fill="#00E5FF" rx="1"/>
  <rect x="52" y="58" width="8" height="2" fill="#00E5FF" rx="1"/>
  <rect x="58" y="52" width="2" height="8" fill="#00E5FF" rx="1"/>
  <!-- Inner panel -->
  <rect x="8" y="8" width="44" height="44" rx="2" fill="#071624" opacity="0.8"/>
  <!-- Number placeholder — rendered by Phaser text, not SVG -->
</svg>
```

**Power Tile (Gold Border Variant)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <!-- Gold outer border -->
  <rect x="1" y="1" width="58" height="58" rx="4" fill="#1A1400" stroke="#FFD700" stroke-width="2.5"/>
  <!-- Corner notches in gold -->
  <rect x="0" y="0" width="10" height="2" fill="#FFD700" rx="1"/>
  <rect x="0" y="0" width="2" height="10" fill="#FFD700" rx="1"/>
  <rect x="50" y="0" width="10" height="2" fill="#FFD700" rx="1"/>
  <rect x="58" y="0" width="2" height="10" fill="#FFD700" rx="1"/>
  <rect x="0" y="58" width="10" height="2" fill="#FFD700" rx="1"/>
  <rect x="0" y="50" width="2" height="10" fill="#FFD700" rx="1"/>
  <rect x="50" y="58" width="10" height="2" fill="#FFD700" rx="1"/>
  <rect x="58" y="50" width="2" height="10" fill="#FFD700" rx="1"/>
  <!-- Inner panel darker gold tint -->
  <rect x="8" y="8" width="44" height="44" rx="2" fill="#1A1000" opacity="0.9"/>
</svg>
```

**Face-Down Tile (Ghost Modifier)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <!-- Same structure as standard tile but number replaced with scan-line pattern -->
  <rect x="1" y="1" width="58" height="58" rx="4" fill="#0E2240" stroke="#00E5FF" stroke-width="2" opacity="0.6"/>
  <!-- Scan lines to indicate hidden content -->
  <line x1="10" y1="20" x2="50" y2="20" stroke="#00E5FF" stroke-width="1" opacity="0.4"/>
  <line x1="10" y1="28" x2="50" y2="28" stroke="#00E5FF" stroke-width="1" opacity="0.4"/>
  <line x1="10" y1="36" x2="50" y2="36" stroke="#00E5FF" stroke-width="1" opacity="0.4"/>
  <line x1="10" y1="44" x2="50" y2="44" stroke="#00E5FF" stroke-width="1" opacity="0.4"/>
  <!-- Question mark glyph -->
  <text x="30" y="38" text-anchor="middle" font-family="monospace" font-size="20" fill="#00E5FF" opacity="0.5">?</text>
</svg>
```

**Overload Bomb Power Tile Icon**:
```svg
<!-- This is overlaid on the Power Tile SVG base above -->
<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <!-- Lightning bolt icon centered -->
  <polygon points="33,10 24,32 30,32 26,52 38,28 32,28" fill="#FFD700" stroke="#FF9100" stroke-width="1"/>
</svg>
```

**Cryofreeze Power Tile Icon**:
```svg
<!-- Overlaid on Power Tile base -->
<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <!-- Snowflake / freeze symbol -->
  <line x1="30" y1="12" x2="30" y2="48" stroke="#00E5FF" stroke-width="3"/>
  <line x1="12" y1="30" x2="48" y2="30" stroke="#00E5FF" stroke-width="3"/>
  <line x1="17" y1="17" x2="43" y2="43" stroke="#00E5FF" stroke-width="3"/>
  <line x1="43" y1="17" x2="17" y2="43" stroke="#00E5FF" stroke-width="3"/>
  <!-- Crystal tips -->
  <circle cx="30" cy="12" r="3" fill="#00E5FF"/>
  <circle cx="30" cy="48" r="3" fill="#00E5FF"/>
  <circle cx="12" cy="30" r="3" fill="#00E5FF"/>
  <circle cx="48" cy="30" r="3" fill="#00E5FF"/>
</svg>
```

**Neural Reveal Power Tile Icon**:
```svg
<!-- Overlaid on Power Tile base -->
<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <!-- Eye icon for "reveal" -->
  <ellipse cx="30" cy="30" rx="18" ry="10" fill="none" stroke="#FFD700" stroke-width="2"/>
  <circle cx="30" cy="30" r="5" fill="#FFD700"/>
  <circle cx="30" cy="30" r="2" fill="#1A1000"/>
  <!-- Scan lines radiating from eye -->
  <line x1="30" y1="14" x2="30" y2="18" stroke="#FFD700" stroke-width="1.5"/>
  <line x1="30" y1="42" x2="30" y2="46" stroke="#FFD700" stroke-width="1.5"/>
</svg>
```

**Background Circuit Decoration (tile at grid background level)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="640" viewBox="0 0 360 640">
  <!-- PCB trace lines — subtle background texture -->
  <line x1="0" y1="120" x2="360" y2="120" stroke="#0D2137" stroke-width="1"/>
  <line x1="0" y1="240" x2="360" y2="240" stroke="#0D2137" stroke-width="1"/>
  <line x1="180" y1="0" x2="180" y2="640" stroke="#0D2137" stroke-width="1"/>
  <!-- Corner node dots at intersections -->
  <circle cx="180" cy="120" r="4" fill="#0D2137"/>
  <circle cx="180" cy="240" r="4" fill="#0D2137"/>
</svg>
```

**Design Constraints**:
- All SVG tiles use only: `rect`, `circle`, `line`, `polygon`, `text` — no complex paths
- Maximum 12 elements per tile SVG (lightweight for 25-tile grids)
- Tile number text rendered by Phaser `this.add.text()`, not embedded in SVG (allows color/scale animation independently)
- Background circuit texture is static, generated once in BootScene

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Tile shatter | Correct tap | Tile image splits into 6–8 angular shard sprites (triangles), each assigned random velocity vector (angle: random, speed: 80–200px/s), fade alpha 1→0 over 400ms |
| Green particle burst | Correct tap | 12 circular particles (radius 3px, color `#39FF14` or tile's color), scatter radially from tap point, lifespan 350ms |
| Wrong tap red flash | Wrong tap | Tile background flashes `#FF1744` for 120ms then returns to base color `#0E2240` |
| Timer critical pulse | Timer below 25% | Timer bar pulses scale 1.0→1.05→1.0 every 400ms, color shifts to `#FF1744` |
| Streak counter scale | Streak increment | Streak text scales 1.0→1.4→1.0 over 200ms, color brightens toward `#FFD700` at high streaks |
| Stage clear explosion | All tiles cleared | All remaining shard particles play simultaneously over 600ms — grid-wide explosion of colored shards |
| "LOCK CRACKED" text | Stage clear | Large text drops from above at y=−80 → y=center (350ms ease-out), stays 800ms, fades 300ms |
| "SYSTEM LOCKOUT" text | Game over | Red flash fills screen (50ms), text slams in with screen shake, stays until transition |
| Matrix rain | Menu + transitions | Columns of falling green `0`/`1` characters, speed 40px/s, opacity 0.15, behind all UI |
| Tile drift | Stage 26+ modifier | Tile container has x += sin(time * 0.5) * 4px, y += cos(time * 0.7) * 3px per update |
| Challenge stage pulse | Challenge stage start | All tiles pulse 1.0→1.15→1.0 in sequence (staggered 60ms per tile) over 1,500ms before timer starts |
| Cryofreeze effect | Cryofreeze tile tap | Timer bar overlaid with ice-blue frost overlay (semi-transparent `#B3E5FC` at 40% alpha), timer briefly turns blue |
| Neural Reveal flash | Neural Reveal tap | All face-down tiles briefly flip face-up for 1,200ms with a cyan scan-line sweep animation |

---

## 5. Audio Design

### 5.1 Sound Effects

All audio uses the Web Audio API via Phaser's built-in audio system. No external audio files — tones are synthesized procedurally using `AudioContext.createOscillator()` and `createGainNode()`. This keeps the game to zero external audio assets.

| Event | Sound Description | Duration | Priority | Synthesis Parameters |
|-------|-----------------|----------|----------|---------------------|
| Correct tap (base) | Short crisp electronic "blip" — ascending minor second | 150ms | High | Sine wave, 440Hz→550Hz, volume envelope: 0→0.6→0 |
| Streak 3+ tap | Same blip, pitch +10% | 150ms | High | 484Hz→605Hz |
| Streak 6+ tap | Blip + harmonic overtone | 150ms | High | 528Hz→660Hz + 1056Hz at 30% volume |
| Streak 10+ tap | Blip + chord arpeggio up | 180ms | High | Three-note ascending chord |
| Streak 15+ (GOD MODE) | Blip + full musical run | 220ms | High | 5-note ascending scale at 80ms/note |
| Wrong tap | Harsh buzzer, descending | 200ms | High | Square wave, 200Hz→80Hz, hard cutoff |
| Power tile tap (Bomb) | Low explosion thud | 300ms | High | Sine wave 60Hz→20Hz, slow decay |
| Power tile tap (Freeze) | Ice crystallize tinkle | 250ms | High | High sine 1200Hz, tremolo 40Hz, fast decay |
| Power tile tap (Reveal) | Radar sweep tone | 400ms | Medium | Sine wave 300→600→300Hz sweep |
| Stage clear ("LOCK CRACKED") | 4-note ascending fanfare | 700ms | High | Sine arpeggiated: C5→E5→G5→C6 |
| Challenge stage clear | Fanfare + extra flourish | 1,000ms | High | Same fanfare + descending echo |
| Game over ("SYSTEM LOCKOUT") | Low drone + alarm pulse | 900ms | High | Sawtooth 55Hz + pulse every 200ms |
| Timer critical (<25%) | Repeating alarm beep | Looping | Medium | Short sine 880Hz beep every 400ms (stops on stage clear) |
| UI button press | Soft click | 80ms | Low | Sine 800Hz, minimal sustain |
| Streak reset (wrong tap) | Short descending whistle | 180ms | Medium | Sine 600Hz→300Hz |

### 5.2 Music Concept

**Background Music**: Procedurally generated ambient electronic loop built from Web Audio API `OscillatorNode` and `BiquadFilterNode`. No audio files required.

The music is a layered drone system: a bass drone (55Hz sine, constant), a mid harmonic layer (110Hz triangle at 40% volume, slow LFO tremolo at 0.3Hz), and a high shimmer layer (880Hz sine at 15% volume, slow vibrato at 0.8Hz). Together they produce a tense, pulsing ambient soundtrack that evokes a hacking sequence without being distracting.

**Music State Machine**:
| Game State | Music Behavior |
|-----------|---------------|
| Menu | Bass drone only, slow matrix-rain ambiance. Volume: 30%. |
| Stage 1–10 | Bass + mid layer. Tempo stable. Volume: 40%. |
| Stage 11–25 | All three layers active. Mid LFO rate increases to 0.5Hz. Volume: 50%. |
| Stage 26+ | High shimmer layer volume increases to 25%. LFO rate 0.8Hz. Volume: 55%. |
| Timer critical | All layers volume +20%, mid LFO rate jumps to 2.0Hz (tension spike). |
| Stage clear | Brief silence (200ms) → resume music with new stage parameters. |
| Game over | All layers fade to 0 over 600ms. Replaced by game-over sting (see SFX above). |
| Pause | All layers reduced to 15% volume. |

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌──────────────┐
│  Title/Splash │  (500ms, matrix rain, game logo assembles from digits)
└──────┬───────┘
       │ auto-advance after 500ms (or tap to skip)
       ▼
┌──────────────┐     ┌─────────────────┐
│  Main Menu   │────→│  How to Play    │ (from "?" button)
│              │     │  (HelpScene)    │
│  [PLAY]      │     │  [GOT IT!]──────┘
│  [?] [🏆]    │     └─────────────────┘
│  [SOUND]     │
└──────┬───────┘
       │ PLAY button
       ▼
┌──────────────┐     ┌─────────────────┐
│  Game Scene  │────→│  Pause Overlay  │ (tap "II" button)
│  (GameScene) │     │  [RESUME]       │
│              │     │  [?] How2Play   │
│              │     │  [MENU]         │
└──────┬───────┘     └────────┬────────┘
       │ timer empties        │ RESUME
       ▼                      └───────→ (back to GameScene)
┌──────────────┐
│  Game Over   │
│  (overlay)   │
│              │
│  [AD: CONTINUE?]  (once per run — watch ad to refill timer 50%)
│  [PLAY AGAIN]
│  [MENU]
└──────┬───────┘
       │ PLAY AGAIN
       ▼
┌──────────────┐
│  GameScene   │  (fresh stage 1)
│  (restarted) │
└──────────────┘
```

### 6.2 HUD Layout

```
┌───────────────────────────────────────────┐ ← 360px wide
│ SCORE: 00000   ★ STAGE 01        [II]    │ ← 56px HUD bar
│         top-left  top-center   top-right   │
├───────────────────────────────────────────┤
│ ████████████████████████░░░░░░░░ BREACH   │ ← 28px timer bar
│ color: #00E5FF → #FF1744 when <25%        │
│ label "SECURITY BREACH TIMER" 9px grey    │
├───────────────────────────────────────────┤
│ STREAK ×1.5 🔥  (hidden at ×1.0)         │ ← 28px streak strip
│ text #FF9100, pulses on increment          │
├───────────────────────────────────────────┤
│                                           │
│   ┌──────────────────────────────────┐   │
│   │                                  │   │  ← Tile grid, centered
│   │   [TILE][TILE][TILE][TILE][TILE] │   │     auto-positioned based on grid size
│   │   [TILE][TILE][TILE][TILE][TILE] │   │
│   │   [TILE][TILE][TILE][TILE][TILE] │   │
│   │   [TILE][TILE][TILE][TILE][TILE] │   │
│   │   [TILE][TILE][TILE][TILE][TILE] │   │
│   │                                  │   │
│   └──────────────────────────────────┘   │
│                                           │
│  NEXT: [3]  (hint — visible stages 1–4)  │ ← 36px hint strip
│  tap to find the lowest number            │   (fades permanently after stage 5)
│                                           │
└───────────────────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Size | Content | Update Frequency |
|---------|----------|------|---------|-----------------|
| Score | Top-left | 18px font, 120px wide zone | Numeric score with "SCORE:" label | Every correct tap |
| Stage number | Top-center | 16px font | "STAGE XX" with star prefix | On stage transition |
| Pause button | Top-right | 44x44px touch target | "II" icon, `#00E5FF` | On tap |
| Timer bar | Below HUD | 8px height, full width | Filled rect shrinking left-to-right | Every frame |
| Timer label | Below timer bar | 9px font, right-aligned | "SECURITY BREACH TIMER" | Static |
| Streak display | Below timer | 20px font, center | "STREAK ×N 🔥" (hidden at N=1) | On streak change |
| Modifier badge | Top of grid | 14px font, center | "MIRROR" / "GHOST" / etc. active modifier | On stage start |
| Hint | Below grid | 16px font, center | "NEXT: [N]" | Every tap (stages 1–4 only) |
| Combo floating text | Tap position | 22px font | "+100", "+150×2" | Every correct tap |

### 6.3 Menu Structure

**Main Menu** (MenuScene, `#070D17` background, matrix rain animation behind):
- Game title: "SEQUENCE LOCK" — large neon cyan letters (40px), glowing drop shadow `#00E5FF 0 0 20px`
- Sub-title: "CRACK THE VAULT" — 14px green text below title
- [PLAY] button: `#0D2F5A` fill, `#00E5FF` border, 200px wide, 56px tall, centered at canvas 50%, y=420
- [?] button: circular, 44px diameter, `#0D2F5A` fill, `#00E5FF` border, text "?", positioned at canvas 50%−60px, y=496
- [TROPHY] button: circular, 44px diameter, positioned at canvas 50%+60px, y=496 — shows high score overlay
- [SOUND] button: circular, 44px diameter, positioned at canvas 50%+140px, y=340 (top-right area) — toggles mute
- High score display: "BEST: 000000" in terminal white, 14px, centered below [?] and [TROPHY] buttons

**High Score Overlay** (triggered by TROPHY button):
- Dim background overlay `rgba(5,10,15,0.92)`
- "BEST SCORE: XXXXXX" in 28px neon cyan
- "BEST STAGE: XX" in 20px acid green
- [CLOSE] button 44x44px

**Pause Overlay** (semi-transparent, triggered by "II" button during game):
- Dim overlay `rgba(5,10,15,0.85)` over game canvas
- "// PAUSED //" text, 24px terminal white, centered
- [RESUME] button: 180px wide, 48px, `#0D2F5A` fill, `#00E5FF` border
- [?] How to Play button: 180px wide, 48px, same style
- [MENU] button: 180px wide, 48px, `#1A0D00` fill, `#FF9100` border (warning color — exits run)
- Timer is paused while overlay is visible

**Game Over Screen** (shown after timer depletes):
- Full canvas overlay `rgba(5,10,15,0.95)`
- "SYSTEM LOCKOUT" text: 32px, `#FF1744`, centered, slams in with shake
- "SECURITY BREACH DETECTED" sub-line: 14px grey, fades in 300ms after title
- Score: "SCORE: XXXXXX" in 26px neon cyan, centered
- Stage reached: "STAGE REACHED: XX" in 16px green
- New high score banner: "NEW RECORD!" in 20px `#FFD700` with pulse animation (visible only if beaten)
- Separator line: 1px `#1A3A5C`
- [WATCH AD TO CONTINUE] button: 260px wide, 52px tall, `#1A1400` fill, `#FFD700` border (once per run; disabled if already used)
- [PLAY AGAIN] button: 200px wide, 52px tall, `#0D2F5A` fill, `#00E5FF` border
- [MENU] button: 120px wide, 44px tall, `#070D17` fill, `#334455` border
- All buttons appear with 500ms staggered fade-in after death effects resolve

### 6.4 Help Screen (HelpScene — mandatory)

**Access**: "?" button on Main Menu and "?" button in Pause Overlay. Both navigate to HelpScene with a `from` parameter (`'menu'` or `'pause'`). "GOT IT!" button returns to the originating screen.

**Layout**:
```
┌─────────────────────────────────┐
│  // HOW TO CRACK A VAULT //     │ ← 20px neon cyan title
├─────────────────────────────────┤
│                                 │
│  [CONTROL DIAGRAM — SVG]        │ ← See below
│                                 │
├─────────────────────────────────┤
│  RULES                          │ ← 14px section header, green
│  • Tap numbers 1→2→3… in order  │
│  • Timer refills +0.4s on hit   │
│  • Wrong tap costs -1.5 seconds │
│  • Same-color chain = bonus pts │
│                                 │
│  POWER TILES                    │
│  ⚡ OVERLOAD  — clears 4 nearby  │
│  ❄  CRYOFREEZE — freezes timer  │
│  👁  NEURAL    — reveals hidden  │
│                                 │
│  TIPS                           │
│  1. Scan the full grid before   │
│     tapping — find 1,2,3 first  │
│  2. Same-color runs earn bonus  │
│     score — plan your route     │
│  3. Save Cryofreeze for when    │
│     the timer bar turns red     │
│                                 │
│  [          GOT IT!          ]  │ ← large button, #00E5FF border
└─────────────────────────────────┘
```

**Control Diagram SVG** (embedded in HelpScene, dimensions 340x160px):
```
┌──────────────────────────────────────────┐
│                                          │
│   ┌────┐  ┌────┐  ┌────┐                │
│   │ 3  │  │ 1  │  │ 5  │   ← grid of   │
│   └────┘  └────┘  └────┘      tiles     │
│   ┌────┐  ┌────┐  ┌────┐                │
│   │ 7  │  │ 2  │  │ 9  │                │
│   └────┘  └────┘  └────┘                │
│   ┌────┐  ┌────┐  ┌────┐                │
│   │ 6  │  │ 4  │  │ 8  │                │
│   └────┘  └────┘  └────┘                │
│                                          │
│  ☝ TAP "1" FIRST → then "2" → then "3"  │  (tap-finger icon over tile "1")
│                                          │
│  [TIMER BAR ████████████░░░]            │
│   drains constantly — find them fast!   │
└──────────────────────────────────────────┘
```

The diagram is rendered using Phaser `Graphics` and `Text` objects — small tiles drawn with `graphics.fillRect()` and `graphics.strokeRect()`, numbers as Phaser text. A finger icon (triangle + circle SVG registered as texture) points at tile "1". The timer bar is a filled rectangle below the diagram with a label. This ensures the diagram uses the game's actual visual style (cyan borders on dark background).

**HelpScene is scrollable**: if total content height exceeds canvas height (760px), enable Phaser `setScrollFactor` on a container or use a masked scrollable zone. Typically fits without scrolling on 760px canvas.

### 6.5 Transitions

| From → To | Transition Type | Duration |
|-----------|----------------|----------|
| Splash → Menu | Matrix rain assembles into menu | 500ms |
| Menu → Game | Grid tiles slide in from center with stagger | 400ms |
| Game → Pause | Dim overlay fades in | 200ms |
| Pause → Game | Dim overlay fades out | 200ms |
| Stage N → Stage N+1 | "LOCK CRACKED" text + shard explosion + brief black flash (150ms) + new grid assembles | 800ms total |
| Game → Game Over | Screen shake + red flash + overlay fades in | 600ms |
| Game Over → Game (retry) | Overlay fades out + new grid assembles | 600ms total — under 1.2s |
| Any → Help | Slide up from bottom | 300ms |
| Help → Previous | Slide down to bottom | 300ms |

**Total death-to-playable time**: screen shake (300ms) + effect-to-UI delay (500ms) + buttons fade in (500ms staggered, first button at 500ms) + tap play again + grid assembles (400ms) = worst case 1.7s before first tap on new grid. **Under 2 seconds from death to first tap.**

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over (tracked in session) | After 5 seconds |
| Rewarded | "WATCH AD TO CONTINUE" button on game over screen | Once per run, always optional | Always optional — player taps button voluntarily |
| Rewarded | "WATCH AD FOR SHIELD" (extra 3s timer refill) | Available after stage 10 on pause screen | Always optional |
| Banner | Main menu screen only | Persistent on menu (bottom 50px zone) | N/A |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Continue | Watch rewarded ad after death | Resume same stage, timer refilled to 50% | Once per run |
| Time Shield | Watch rewarded ad from pause menu (stage 10+) | +3,000ms added to current timer immediately | Once per stage |
| Score Doubler | Not implemented (POC stage per user preference) | — | — |

**Note**: Per project preference, this is a POC build — no ad SDK integration. All ad triggers are placeholder hooks in `ads.js` that call `console.log('AD_TRIGGER:', type)` and immediately invoke the reward callback as if the ad completed successfully.

### 7.3 Session Economy

**Expected session flow**: Average player reaches stage 8 on first attempt (~4 minutes), dies, optionally uses "continue" once, reaches stage 12, dies again. Total session: ~6 minutes, 2 game-over screens. Interstitial fires on second game over (every 3rd). One rewarded ad opportunity per session.

**Session Economy Math**:
```
Average game-overs per session:       2
Interstitial fires per session:       ~0.67 (every 3rd death)
Rewarded ad impressions per session:  0–1 (player choice)
Sessions per day (typical casual):    2–3
Total ads per day:                    ~2 interstitial + ~1–2 rewarded
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/sequence-lock/
├── index.html              ← Entry point, CDN scripts, load order
├── css/
│   └── style.css           ← Responsive layout, body background, canvas centering
└── js/
    ├── config.js           ← All constants: colors, tile sizes, difficulty tables, SVG strings
    ├── stages.js           ← getStageParams(), generateGrid(), getModifiers(), PRNG utility
    ├── ads.js              ← Ad trigger hooks, reward callbacks (all POC placeholders)
    ├── ui.js               ← MenuScene, GameOverScene (overlay), HUD overlay class, pause overlay
    ├── help.js             ← HelpScene with illustrated control diagram
    ├── game.js             ← GameScene: create(), update(), tile tap handlers, timer, streak
    └── main.js             ← BootScene (SVG → textures), Phaser.Game init, localStorage I/O
```

**Script load order in index.html** (CRITICAL — main.js must load LAST):
```html
<script src="js/config.js"></script>
<script src="js/stages.js"></script>
<script src="js/ads.js"></script>
<script src="js/ui.js"></script>
<script src="js/help.js"></script>
<script src="js/game.js"></script>
<script src="js/main.js"></script>   <!-- ALWAYS LAST -->
```

### 8.2 Module Responsibilities

**config.js** (target: ~150 lines, max 300):
- `const COLORS = { BG, GRID_BG, TILE_BASE, ... }` — all hex values from palette
- `const TILE_SIZES = { 3: 80, 4: 72, 5: 60 }` — tile px by grid size
- `const TILE_GAP = 4` — px gap between tiles
- `const DIFFICULTY_TABLE` — array indexed by stage_number range, containing `{ gridSize, timeBudget, drainRate, refillPerTap, wrongPenalty, colorCount, powerTileCount }`
- `const STREAK_THRESHOLDS = [3, 6, 10, 15]` with `const STREAK_MULTIPLIERS = [1.5, 2.0, 3.0, 5.0]`
- `const SCORE_VALUES = { correctTap: 100, sameColorBonus: 50, stageClear: 500, ... }`
- `const SVG_STRINGS = { tileCyan, tileGreen, tileOrange, tilePurple, tileRed, tilePower, tileFaceDown, bombIcon, freezeIcon, revealIcon }` — raw SVG strings for BootScene
- `const MODIFIER_TYPES = ['MIRROR', 'ROTATION', 'GHOST', 'DECOY', 'DRIFT']`
- `const CANVAS_WIDTH = 360`, `const CANVAS_HEIGHT = 760`

**stages.js** (target: ~180 lines, max 300):
- `function seededRandom(seed)` — simple LCG PRNG returning 0–1 sequence
- `function shuffleSeeded(array, seed)` — Fisher-Yates shuffle using seededRandom
- `function getStageParams(stageNumber)` — reads DIFFICULTY_TABLE, returns full params object including isRest, isChallenge flags
- `function generateGrid(stageNumber)` — returns array of tile objects: `{ id, number, colorCategory, isPowerTile, powerType, isFaceDown, x, y }`
- `function assignColors(tiles, colorCount, seed)` — assigns color categories ensuring ≥2 tiles per active color
- `function selectModifiers(stageNumber)` — returns array of 0–3 modifier strings based on stage range, seeded random
- `function getGridLayout(gridSize, canvasWidth)` — returns `{ startX, startY, tileSize, gap }` for centering grid

**ads.js** (target: ~40 lines, max 300):
- `const AdsManager = { gamesPlayed: 0, interstitialEvery: 3, ... }`
- `AdsManager.onGameOver()` — increments counter, fires interstitial if counter % 3 === 0
- `AdsManager.showRewarded(type, rewardCallback)` — POC: logs trigger, calls `rewardCallback()` immediately
- `AdsManager.showBanner()` / `AdsManager.hideBanner()` — POC: no-ops with console.log
- Export: `window.AdsManager = AdsManager`

**ui.js** (target: ~220 lines, max 300):
- `class MenuScene extends Phaser.Scene` — main menu with matrix rain animation, buttons, high score display
- `class HUDOverlay` — NOT a scene, a plain JS class that creates HUD text/graphics objects within GameScene's scene (passed `scene` reference in constructor)
  - `HUDOverlay.create(scene)` — adds score text (x=10, y=10), stage text (centered, y=18), pause button (top-right, 44x44px)
  - `HUDOverlay.updateScore(val)` — updates text, triggers scale punch 1.3x over 150ms
  - `HUDOverlay.updateStage(val)` — updates text
  - `HUDOverlay.updateStreak(val)` — updates streak display, animates color shift
  - `HUDOverlay.updateTimer(pct)` — updates timer bar fill from 0.0–1.0, changes color at 0.25
- `class GameOverOverlay` — rendered inside GameScene, shows game over screen with buttons
  - `GameOverOverlay.show(scene, score, stage, isHighScore, canContinue)` — builds overlay DOM
  - `GameOverOverlay.hide()` — removes overlay
- `class PauseOverlay` — rendered inside GameScene, pause menu
- `function showMatrixRain(scene)` — spawns falling digit text objects, used in MenuScene and transitions

**help.js** (target: ~100 lines, max 300):
- `class HelpScene extends Phaser.Scene` — dedicated scene
- `create(data)` — `data.from` is `'menu'` or `'pause'`
- Renders title, control diagram (SVG-style using Phaser Graphics + Text), rules text, power tile icons, tips text, GOT IT button
- GOT IT button: if `data.from === 'menu'` → `this.scene.start('MenuScene')`; if `'pause'` → `this.scene.stop()` (returns to paused GameScene)
- All text uses game font stack: `'Courier New', Courier, monospace`

**game.js** (target: ~270 lines, max 300):
- `class GameScene extends Phaser.Scene`
- `create()`:
  - Initialize HUDOverlay
  - Call `stages.generateGrid(this.stageNumber)` → build tile sprites and text objects
  - Register pointer input on each tile: `tile.sprite.on('pointerdown', this.onTileTap, this)`
  - Start timer countdown loop via `this.time.addEvent({ delay: 16, loop: true, callback: this.tickTimer })`
  - Initialize game state: `{ score, stageNumber, streak, nextExpected, timerMs, isGameOver, isPaused }`
- `update()`:
  - Check `isGameOver` or `isPaused` → early return
  - Update timer bar via `this.hud.updateTimer(this.timerMs / this.stageParams.timeBudget)`
  - Check timer critical → trigger pulsing behavior
- `onTileTap(pointer, tile)`:
  - If `isGameOver` or `isPaused` → return
  - If tile.isPowerTile → `activatePowerTile(tile)` → return
  - If tile.number === this.nextExpected → `onCorrectTap(tile)`
  - Else → `onWrongTap(tile)`
- `onCorrectTap(tile)`:
  - Remove tile sprite from scene
  - Update score, streak, timer
  - Spawn shard particles at tile position (12 shards, angular velocity)
  - Spawn floating score text "+100" (or with multiplier) at tap position
  - Play correct tap sound (pitch varies by streak level)
  - this.nextExpected++
  - Check if all tiles cleared → `onStageClear()`
- `onWrongTap(tile)`:
  - Flash tile red for 120ms
  - Apply timer penalty: `this.timerMs -= this.stageParams.wrongPenalty`
  - Reset streak to 0, multiplier to ×1.0
  - Play wrong tap buzzer sound
  - Screen shake: intensity 4px, duration 150ms
- `onStageClear()`:
  - Show "LOCK CRACKED" text
  - Trigger grid-wide shard explosion
  - Play stage clear fanfare
  - After 800ms: `this.stageNumber++`, call `loadNextStage()`
- `loadNextStage()`:
  - Clear all tile objects
  - Call `stages.generateGrid(this.stageNumber)`
  - Rebuild tile sprites with stagger entrance animation (each tile flies in 60ms apart)
  - Reset timer to new budget
  - Update HUD stage number
- `onTimerExpired()`:
  - Set `this.isGameOver = true`
  - Trigger SYSTEM LOCKOUT effects (screen shake 12px/300ms, red flash)
  - After 500ms: show GameOverOverlay
  - Call `AdsManager.onGameOver()`
- `activatePowerTile(tile)`:
  - Remove power tile sprite
  - Switch on tile.powerType: bomb/freeze/reveal effects
  - Bomb: find 4 nearest tiles (by grid position), auto-remove them with shard animations, add 200+50×4=400 pts flat
  - Freeze: pause timerMs decrement for 3,000ms, apply ice overlay to timer bar
  - Reveal: flip all face-down tiles face-up for 1,200ms

**main.js** (target: ~80 lines, max 300):
- `class BootScene extends Phaser.Scene` — registers all SVG textures as base64 exactly once
  - `create()`: iterate `SVG_STRINGS` object, call `this.textures.addBase64(key, 'data:image/svg+xml;base64,' + btoa(svgString))` for each
  - Listen for all `addtexture` events, count completions, start MenuScene only when all textures loaded
- `const config = { type: Phaser.AUTO, width: 360, height: 760, backgroundColor: '#050A0F', scene: [BootScene, MenuScene, HelpScene, GameScene], ... }`
- `const game = new Phaser.Game(config)`
- LocalStorage I/O:
  - `function loadHighScore()` → `parseInt(localStorage.getItem('sequence-lock_high_score') || '0')`
  - `function saveHighScore(score)` → `localStorage.setItem(...)`
  - `function loadHighStage()` / `saveHighStage(stage)` → same pattern
  - `function loadSettings()` / `saveSettings(obj)` → JSON parse/stringify
- Export: attach all to `window` global for cross-file access

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | 3.60.0 | `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js` | Game engine, rendering, input |

No other external dependencies. Audio via Web Audio API (built into browser). No Howler.js needed.

**index.html structure**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>Sequence Lock</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="game-container"></div>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js"></script>
  <script src="js/config.js"></script>
  <script src="js/stages.js"></script>
  <script src="js/ads.js"></script>
  <script src="js/ui.js"></script>
  <script src="js/help.js"></script>
  <script src="js/game.js"></script>
  <script src="js/main.js"></script>  <!-- LAST -->
</body>
</html>
```

**css/style.css**:
- `body { margin: 0; background: #050A0F; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }`
- `#game-container canvas { display: block; }` — NEVER `display: none` on Phaser canvas (kills rendering permanently)
- `* { touch-action: none; }` — prevents browser default pan/zoom on touch
- `body { -webkit-user-select: none; user-select: none; }` — prevent text selection on tap

### 8.4 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Frame Rate | 60fps stable | Phaser FPS counter (debug mode only) |
| Load Time | <2s on 4G | Performance.timing in browser DevTools |
| Memory Usage | <80MB | Chrome DevTools Memory panel |
| JS Bundle Size | <100KB total (excl. CDN) | `wc -c js/*.js` |
| Max tile objects on screen | 25 tiles × 2 objects (sprite + text) = 50 objects | Well within Phaser budget |

---

## 9. Juice Specification

### 9.1 Player Input Feedback (every tap on any tile)

| Effect | Target | Values |
|--------|--------|--------|
| Shard particles | Tapped tile position | Count: 8 shards, Direction: radial burst (each shard: random angle 0–360°), Speed: 80–200px/s (random per shard), Color: tile's category color, Lifespan: 380ms with alpha fade 1.0→0.0 |
| Scale punch (correct) | Tapped tile image | Scale 1.0→1.5→0.0 (tile is destroyed, so punch plays during tile removal), Recovery: N/A (tile gone). On-screen tiles near tapped tile: scale 1.0→1.05→1.0 over 80ms (sympathetic vibration) |
| Scale punch (wrong) | Tapped tile image | Scale 1.0→0.85→1.0 over 120ms (recoil instead of punch — tile stays) |
| Screen shake (correct) | Camera | Intensity: 2px, Duration: 80ms, Direction: horizontal ±2px random, Decay: linear |
| Screen shake (wrong) | Camera | Intensity: 5px, Duration: 150ms, Direction: random, Decay: linear |
| Color flash (correct) | Tile background | Flash tile to `#E0FFFF` (white-cyan) for 40ms then it shatters |
| Color flash (wrong) | Tile background | Flash tile to `#FF1744` (alarm red) for 120ms then return to `#0E2240` |
| Sound (correct) | — | Sine oscillator 440→550Hz, 150ms, pitch +10% per streak level (max +50%) |
| Sound (wrong) | — | Square wave 200→80Hz, 200ms, no pitch variation |
| Haptic feedback | Device | `navigator.vibrate(30)` on correct, `navigator.vibrate([50,20,50])` on wrong (if supported) |

### 9.2 Core Action Additional Feedback (most frequent input: correct tile tap)

| Effect | Values |
|--------|--------|
| Shard particles | Count: 8 angular shards, Colors: category color, Speed: 80–200px/s, Lifespan: 380ms |
| Hit-stop | 30ms physics pause on correct tap — achieved via `this.physics.world.pause()` + `setTimeout(() => this.physics.world.resume(), 30)` (use setTimeout NOT Phaser delayedCall to avoid timeScale freeze bug) |
| Floating score text | "+100" (or "+100×2.0" with multiplier shown), font 18px monospace, color `#39FF14` (or `#FFD700` on streak ×3+), spawns at tap position, moves up 70px over 550ms, fades alpha 1.0→0.0 from 200ms to 550ms |
| Score HUD punch | Score text scales 1.0→1.35→1.0 over 180ms on every score increment |
| Streak counter punch | Streak display scales 1.0→1.5→1.0 over 200ms on streak increment, color shifts: ×1.5=`#FF9100`, ×2.0=`#FF6B00`, ×3.0=`#FF3D00`, ×5.0=`#FFD700` with glow effect |
| Combo escalation | At streak ×1.5: shard count +2 (total 10); at ×2.0: shard speed +30% (max 260px/s); at ×3.0: screen shake intensity doubles (4px); at ×5.0 (GOD MODE): all effects at max intensity + brief gold screen edge vignette (4px gold border pulse for 300ms) |
| Same-color chain bonus pop | "+50 CHAIN" text in tile's category color, larger font 22px, spawns at tile center, same movement as score float |
| Category Bonus activation | "+1000 CATEGORY BONUS!" text in `#FFD700`, 28px, center screen, moves up 100px over 800ms, screen-wide brief gold flash (50ms, 20% opacity) |

### 9.3 Death/Failure Effects (timer reaches zero)

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 12px, Duration: 350ms, Direction: random XY, Decay: ease-out |
| Red screen flash | Full-canvas red overlay `#FF1744` at 60% alpha, duration 80ms, then fades to 0% over 250ms |
| Timer bar death animation | Timer bar rapidly flickers red/dark at 20Hz for 200ms before going to 0 |
| Grid tiles | All remaining tiles simultaneously flash red, scale 1.0→0.8 over 300ms, then fade alpha to 0 over 200ms |
| Sound | Sawtooth wave 55Hz with +alarm pulse (880Hz sine every 200ms), total duration 900ms |
| "SYSTEM LOCKOUT" text | Appears 500ms after timer hits zero (during shake/flash), slams in from y=−60 to y=center in 200ms ease-in, stays at full opacity |
| Effect → UI delay | 500ms after timer zero before game over overlay begins fading in |
| Death → restart max time | Screen shake 350ms + effect overlay 500ms + PLAY AGAIN button fade-in 500ms + tap + grid assemble 400ms = **1.75s worst case, well under 2 seconds** |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating +score text | "+N" or "+N×M", font: 18px `'Courier New' monospace`, color: `#39FF14` base, `#FFD700` at streak ×3+, spawns at exact tap position, moves up 70px over 550ms, fades from 200ms mark, destroyed at 550ms |
| Wrong tap penalty text | "−1.5s" in `#FF1744`, 16px, spawns at timer bar position, moves left 30px + up 20px, fades over 400ms |
| Score HUD scale punch | Score Phaser text object: scale 1.0→1.35→1.0, tween duration 80ms up + 100ms recovery (180ms total) |
| Stage clear score banner | "STAGE CLEAR +XXXXX" in 24px `#CCFF00`, slides in from top over 300ms, holds 500ms, slides back up out over 200ms |
| Perfect stage bonus pop | "+1000 PERFECT" in 26px `#FFD700`, center screen, stays 700ms |
| Streak reset visual | Streak counter flashes `#FF1744`, shrinks 1.0→0.6→1.0 over 200ms (recoil shrink not scale punch) |

---

## 10. Implementation Notes

### 10.1 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">` prevents accidental pinch-zoom during fast tapping
- **Touch events**: Phaser's `pointer.on('pointerdown')` handles both touch and mouse. Register on individual tile sprites, not the global canvas, to avoid misfires.
- **Prevent default scroll**: `* { touch-action: none; }` in CSS prevents pull-to-refresh interrupting gameplay
- **Canvas visibility**: NEVER use `display: none` on the Phaser canvas or its parent — this permanently kills the WebGL context. Use `visibility: hidden; height: 0; overflow: hidden` if hiding is needed.
- **Orientation**: Game is portrait-only (360×760). On landscape: show "PLEASE ROTATE" message overlay via CSS `@media (orientation: landscape)` — do not attempt to resize Phaser canvas dynamically.
- **Safe area insets**: Pad HUD top bar by `env(safe-area-inset-top, 0px)` via CSS to avoid notch overlap
- **Background tab**: Listen for `document.addEventListener('visibilitychange')` — if `document.hidden`, call `game.scene.pause('GameScene')` to prevent timer drain while backgrounded

### 10.2 Performance Tips

- **Tile object pooling**: Keep all 25 tile sprite objects in a pool array. On stage transition, do NOT destroy and recreate — reset texture, position, alpha, and visible flag. This avoids GC spikes.
- **Text object pooling**: Same for tile number text objects. Change `.setText()` rather than creating new Text objects each stage.
- **Shard particles**: Use Phaser's `Particles.ParticleEmitter` with a pre-allocated pool of 200 particles (25 tiles × 8 shards = 200 max simultaneous). Set `maxParticles: 200` on emitter creation.
- **Matrix rain**: Cap matrix rain columns to 12. Each column is a single Text object with repeating `setTimeout` updates — not 100 individual objects.
- **No Phaser.Physics needed**: This game has no physics (tiles are tapped, not physically simulated — drift is a CSS-style position sine wave). Use `Phaser.Scene` without enabling arcade or matter physics. Set `physics: { default: 'arcade', arcade: { debug: false } }` only if drift simulation becomes complex.
- **SVG textures**: All SVGs are small (60×60px tile + a few icons). Total base64 payload is under 8KB. Register all in BootScene, keep them in Phaser's texture cache for the game's lifetime.

### 10.3 Known Edge Cases

| Edge Case | Behavior |
|-----------|----------|
| Rapid multi-tap same tile | `onTileTap` guard: if `tile.isTapped` flag is set, ignore subsequent taps. Set `tile.isTapped = true` in `onCorrectTap` before removing sprite. |
| Timer expires during stage transition | `onTimerExpired` guard: if `this.isTransitioning` flag is set, ignore timer expiry. Set flag during `onStageClear` animation, clear it in `loadNextStage`. |
| Power tile tapped before any number | Power tile tap order is unrestricted. Power tiles have `number = null` and are excluded from the `nextExpected` sequence entirely. |
| Wrong tap at 0ms timer | Timer check happens every 16ms tick. If wrong penalty brings timer to ≤0, trigger `onTimerExpired()` immediately in `onWrongTap`. |
| Orientation change during play | CSS media query shows rotate prompt. GameScene is paused via `visibilitychange` listener equivalent. On returning to portrait, resume if game was not already game-over. |
| Resize event | Phaser canvas is fixed 360×760 with `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }` — Phaser handles fit automatically. No manual resize code needed. |
| localStorage unavailable | Wrap all localStorage calls in try/catch. Fall back to in-memory object. Never block game start on storage failure. |
| All tiles same color (stage 1) | Only 1 color category in stages 1–4. Category Bonus for "all tiles in one color cleared consecutively" fires trivially since all tiles are cyan. Stage 1 Category Bonus is intentionally easy — introduces the mechanic with positive feedback. |
| Decoy tile tapped | Decoy tile flashes wrong color (category color ≠ display number color), plays wrong-tap sound and penalty. The decoy tile itself is NOT removed — only correct taps remove tiles. The player must tap the real correct tile to continue. |

### 10.4 Testing Checkpoints

| Checkpoint | What to Verify |
|------------|----------------|
| After config.js | `DIFFICULTY_TABLE[0]` returns correct params; `SVG_STRINGS.tileCyan` is valid SVG string; all `COLORS` hex values present |
| After stages.js | `generateGrid(1)` returns 9 tile objects with numbers 1–9, all colorCategory = 0; `generateGrid(13)` returns 25 tiles with 3+ colors; modifiers array for stage 26 has length 1–3 |
| After main.js BootScene | All 10 texture keys present in `this.textures.list`; no "Texture key already in use" errors in console; MenuScene starts after all textures ready |
| After ui.js MenuScene | PLAY button visible, "?" button visible, trophy button visible; clicking "?" transitions to HelpScene; PLAY button starts GameScene |
| After help.js HelpScene | Control diagram renders (tiles visible, finger icon visible, timer bar visible); "GOT IT!" button returns to menu; accessible from pause overlay too |
| After game.js Stage 1 | 3×3 grid of cyan tiles renders centered; timer bar visible and draining; tapping tile "1" removes it with particles; tapping wrong tile shows red flash and timer penalty |
| After game.js Stage 5+ | 4×4 grid; streak multiplier UI visible after 3 consecutive correct; streak resets on wrong tap |
| After game.js Stage 13+ | 5×5 grid; modifier badge shows active modifier; GHOST tiles show "?" face and flip after 1.2s |
| Game over flow | Timer depletion triggers screen shake + red flash + SYSTEM LOCKOUT overlay within 500ms; PLAY AGAIN restarts fresh stage 1 within 2s total |
| Death within 30s idle | Starting a game and doing nothing: timer empties and game over fires within 10s (stage 1: 10s budget). Confirmed inactivity death < 30s at all stages. |
| Power tiles | All three power types activate on tap with correct visual/audio; Bomb clears 4 adjacent; Freeze pauses timer 3s; Reveal shows face-down tiles 1.2s |
| High score persistence | Score > previous high score → "NEW RECORD" shows; value persists after page reload |
| Orientation | Landscape shows rotate prompt; portrait restores gameplay correctly |
