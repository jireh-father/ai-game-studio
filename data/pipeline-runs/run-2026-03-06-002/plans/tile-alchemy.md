# Game Design Document: Tile Alchemy

**Slug**: `tile-alchemy`
**One-Liner**: Merge adjacent element tiles by tapping pairs — valid combinations create powerful new elements, wrong combos spawn toxic tiles that spread.
**Core Mechanic**: Tap two adjacent element tiles on a 5x5 grid to attempt an alchemical merge. Valid combos produce new elements and trigger chain reactions; invalid combos spawn toxic Void tiles that spread every 3 seconds, devouring the board.
**Target Session Length**: 3-5 minutes
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Tile Alchemy is a strategic puzzle game played on a 5x5 grid of element tiles. The player taps two adjacent tiles to attempt an alchemical merge. If the combination is valid according to the Alchemy Table (e.g., Fire + Earth = Magma, Water + Air = Ice), both tiles are consumed and replaced by a single new, more powerful element at the first tile's position. The second tile's cell becomes empty, and gravity pulls tiles downward to fill gaps. If the newly created element is adjacent to another tile that forms a valid pair, a chain reaction auto-fires — cascading merges with escalating visual spectacle and score multipliers.

The twist that differentiates Tile Alchemy from generic match games: **wrong combinations punish you**. Tapping an invalid pair doesn't just fail — it spawns a Toxic Void tile that replaces one of the two tiles. Void tiles spread to one adjacent non-Void tile every 3 seconds, consuming the board like a virus. The only cure is a rare Pure Crystal tile (appears every 5 successful merges) which, when merged with any adjacent Void tile, cleanses ALL connected Void tiles in a satisfying chain purge. When 75% of the board (19+ cells) is Void, the game ends.

The core emotional hook is the cascade chain reaction — a single clever merge triggers 2, 3, 4 automatic follow-up merges as new elements land next to valid partners. Each chain step escalates particle effects, screen shake, pitch, and score multiplier. The counter-tension is the spreading Void — hesitate or make mistakes and the board decays. Speed and knowledge of the Alchemy Table are both rewarded.

### 1.2 Target Audience

Casual puzzle gamers aged 14-40. Play context: commute, waiting room, short breaks. Low skill floor (tap two tiles) but high skill ceiling (memorize the 10-entry Alchemy Table, plan multi-step chain reactions, manage Void containment). Appeals to players who enjoy creation over destruction — you're building new elements, not just clearing tiles.

### 1.3 Core Fantasy

You are an alchemist transmuting base elements into powerful compounds. Every successful merge is a miniature scientific breakthrough. Chain reactions feel like discovering a formula that transforms the entire board. The Void is entropy — the universe punishing careless alchemy. Mastering the Alchemy Table makes you feel like a genius wizard-scientist.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 3-5 minutes |
| Day 1 Retention | 42%+ |
| Day 7 Retention | 20%+ |
| Average Rounds per Session | 3-6 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Scan Board] --> [Tap Tile A] --> [Tap Adjacent Tile B] --> [Check Alchemy Table]
      ^                                                          |
      |                                    [Valid] -------> [Merge: New Element Created]
      |                                       |                  |
      |                                  [Chain Check] <---------+
      |                                       |
      |                              (Adjacent valid pair?)
      |                                 Yes        No
      |                                  |          |
      |                            [Auto-Merge] [Gravity Fill + Next Turn]
      |                                  |          |
      |                                  +----------+
      |                                             |
      |                                    [Void Spreads (every 3s)]
      |                                             |
      |                                    (Board 75%+ Void?)
      |                                      Yes        No
      |                                       |          |
      |                                  [Game Over]     |
      +--------------------------------------------------+

[Invalid Combo] --> [Void Tile Spawns] --> [Resume scanning]
```

**Moment-to-moment**: Player scans the 5x5 grid for valid adjacent pairs. They tap Tile A (it highlights with a glow border), then tap an adjacent Tile B. If the combo is in the Alchemy Table, both tiles merge into a new element with particle effects. If not, a Void tile appears. Meanwhile, Void tiles on the board spread every 3 seconds, creating urgency. Pure Crystal tiles appear every 5 successful merges, offering Void cleansing. The player must balance offense (chaining merges for score) with defense (cleansing Void before it consumes the board).

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Select first tile | Tap | Highlights the tapped element tile with a golden glow border (3px, #FFD700). Only non-Void tiles can be selected. |
| Select second tile (merge attempt) | Tap adjacent tile | If adjacent to selected tile, attempts merge. If not adjacent, re-selects this tile as new first tile. |
| Deselect | Tap selected tile again | Removes highlight, cancels selection. |
| Pause | Tap pause icon (top-right) | Opens pause overlay, freezes Void spread timer. |

**Control Philosophy**: Two-tap selection is deliberate — the player chooses both tiles, making every merge a conscious decision. No drag (too imprecise on a tight 5x5 grid). No swipe (conflicts with scrolling). The two-tap pattern also creates a moment of tension between taps: "Am I sure this is valid?"

**Touch Area Map**:
```
+-------------------------------+
| Score     Stage    [?]  [||]  |  <-- Top HUD (48px)
+-------------------------------+
|                               |
|   +---+---+---+---+---+      |
|   | F | W | E | A | L |      |
|   +---+---+---+---+---+      |
|   | E | F | W | A | F |      |
|   +---+---+---+---+---+      |
|   | L | A | * | E | W |      |  <-- 5x5 Grid (centered, 300x300px)
|   +---+---+---+---+---+      |     Each cell: 56x56px + 4px gap
|   | W | F | E | L | A |      |     * = Pure Crystal
|   +---+---+---+---+---+      |
|   | A | E | W | F | E |      |
|   +---+---+---+---+---+      |
|                               |
+-------------------------------+
| Void: 3/25  [====----] 12%   |  <-- Void meter (40px)
+-------------------------------+
| Next Pure in: 3 merges        |  <-- Info bar (32px)
+-------------------------------+
```

### 2.3 Scoring System

| Score Event | Base Points | Multiplier Condition |
|------------|-------------|---------------------|
| Valid merge (Tier 1 result) | 50 | Base |
| Valid merge (Tier 2 result) | 100 | Result is a Tier 2 element |
| Valid merge (Tier 3 result) | 200 | Result is a Tier 3 element |
| Chain merge (2nd in chain) | base * 2 | 2x multiplier |
| Chain merge (3rd in chain) | base * 3 | 3x multiplier |
| Chain merge (Nth in chain) | base * N | Nx multiplier (uncapped) |
| Void cleanse (per Void tile purged) | 30 per tile | Flat per tile cleansed |
| Mass cleanse (5+ Void tiles at once) | 30 * tiles + 200 bonus | Flat bonus for large cleanse |
| Board survival bonus | 10 per turn with 0 Void on board | Awarded each merge if no Void exists |
| Stage clear bonus | 500 | Flat bonus on stage advance |

**Combo System**: Each consecutive auto-chain merge in a single cascade increments the chain multiplier: Chain 1 = 1x, Chain 2 = 2x, Chain 3 = 3x, etc. Multiplier resets when the cascade ends. Chain text ("x2!", "x3!") appears at merge location with escalating size and golden color.

**High Score**: Stored in localStorage as `tile_alchemy_high_score`. Displayed on menu and game-over screens. New high score triggers "NEW BEST!" in gold (#FFD700) with 1.5x scale punch animation.

### 2.4 Progression System

The game uses an **Alchemy Tier** system. As the player advances stages, higher-tier elements become available on the board and in the Alchemy Table, creating deeper merge chains.

**Element Tiers**:

| Tier | Elements | Appearance |
|------|----------|------------|
| Tier 0 (Base) | Fire, Water, Earth, Air, Lightning | Always present |
| Tier 1 (Compound) | Magma, Ice, Storm, Mud, Steam | Created by merging Tier 0 pairs |
| Tier 2 (Advanced) | Obsidian, Blizzard, Tornado | Created by merging Tier 1 pairs (Stage 6+) |
| Tier 3 (Legendary) | Philosopher's Stone | Created by merging Tier 2 pairs (Stage 11+) |

**Alchemy Table** (defined in config.js):

| Input A | Input B | Result | Tier |
|---------|---------|--------|------|
| Fire | Earth | Magma | 1 |
| Water | Air | Ice | 1 |
| Fire | Air | Storm | 1 |
| Earth | Water | Mud | 1 |
| Fire | Water | Steam | 1 |
| Lightning | Water | Storm | 1 |
| Lightning | Earth | Magma | 1 |
| Magma | Ice | Obsidian | 2 |
| Storm | Mud | Tornado | 2 |
| Ice | Storm | Blizzard | 2 |
| Obsidian | Blizzard | Philosopher's Stone | 3 |
| Obsidian | Tornado | Philosopher's Stone | 3 |
| Pure Crystal | Void | (Cleanse) | Special |

**Note**: All merges are commutative (A+B = B+A). Any pair not in the table is INVALID and spawns a Void tile.

**Progression Milestones**:

| Stage Range | Merges to Advance | Board Composition | New Element Introduced | Void Spread Interval |
|------------|-------------------|-------------------|----------------------|---------------------|
| 1-3 | 8, 10, 12 | 100% Tier 0 elements | Base 5 elements only | 4000ms |
| 4-6 | 14, 16, 18 | 80% Tier 0, 20% Tier 1 spawns | Tier 1 on board (can chain into Tier 2) | 3500ms |
| 7-10 | 20, 22, 24, 26 | 60% Tier 0, 30% Tier 1, 10% Tier 2 | Tier 2 appears on board | 3000ms |
| 11-15 | 28, 30, 32, 34, 36 | 50% T0, 30% T1, 15% T2, 5% T3 possible | Tier 3 (Philosopher's Stone) achievable | 2500ms |
| 16+ | 38+ (capped at 40) | 40% T0, 30% T1, 20% T2, 10% T3 | All tiers, max speed | 2000ms |

### 2.5 Lives and Failure

The game has **no lives** — it is a single-life endurance game. The board state IS your health bar.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Board reaches 75% Void (19+ of 25 tiles are Void) | Game Over | Watch ad to cleanse 5 random Void tiles and resume |
| Inactivity for 12 seconds | Void spread accelerates to 500ms per tick (rapid board decay) | Resume tapping to restore normal spread rate |
| No valid merges possible AND no Pure Crystal available | Game Over (board deadlock) | Watch ad to shuffle board (randomize all non-Void tiles) |

**Inactivity Death Mechanism**: After 12 seconds of no taps, a warning flashes ("WAKE UP, ALCHEMIST!") and Void spread accelerates from its current interval to 500ms per tick. On a board with any Void, this fills the board to 75% in approximately 8-15 seconds. On a board with zero Void, a random tile converts to Void first (at 12s idle), then rapid spread begins. Total time from idle start to guaranteed death: **12s warning + ~12s rapid spread = ~24s** (under the 30s maximum).

**Anti-Cheese Mechanics** (addressing Devil judge feedback):
1. **No undo**: Once you tap a pair, the merge or Void spawn is permanent.
2. **Void spread is real-time**: Pausing freezes spread, but you cannot study the board while Void is ticking in gameplay.
3. **Invalid merge Void placement**: The Void always replaces the HIGHER-tier tile of the pair (punishing reckless merges of valuable tiles). If same tier, random selection.
4. **Pure Crystal cooldown**: Pure Crystal appears every 5 successful merges, not every 5 attempts. Failed merges don't count toward the Pure Crystal timer.
5. **Diminishing cleanse**: Each Pure Crystal cleanses ALL connected Void tiles, but only Void tiles orthogonally connected to the Crystal's placement. Isolated Void clusters require separate Crystals.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Stages are milestone-based. The board does NOT reset between stages — it carries over. Advancing a stage means hitting the merge target. On stage advance, empty cells are filled with new tiles from the expanded element pool, and Void spread interval decreases.

**Generation Algorithm**:
```
Stage Generation Parameters:
- Board size: 5x5 (constant, 25 cells)
- Merge target: min(40, 8 + stage * 2)
- Tier 0 weight: max(40, 100 - stage * 6)%
- Tier 1 weight: min(30, stage * 4)%
- Tier 2 weight: min(20, max(0, (stage - 6) * 3))%
- Tier 3 weight: min(10, max(0, (stage - 10) * 2))%
- Void spread interval: max(2000, 4000 - stage * 200)ms
- Pure Crystal frequency: every 5 successful merges (constant)
- Idle timeout: 12 seconds (constant)
- Idle rapid-spread interval: 500ms (constant)
- Board refill on stage advance: fill all empty cells with weighted random elements
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
    0    3    6    9    12    15    18    21+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-3 | Stage 4-6 | Stage 7-10 | Stage 11-15 | Stage 16+ |
|-----------|-----------|-----------|------------|-------------|-----------|
| Void Spread Interval | 4000ms | 3500ms | 3000ms | 2500ms | 2000ms |
| Merge Target | 8-12 | 14-18 | 20-26 | 28-36 | 38-40 |
| Element Pool Complexity | 5 base elements | +5 Tier 1 | +3 Tier 2 | +1 Tier 3 | All 14 |
| Board Tier Mix (T0/T1/T2/T3) | 100/0/0/0 | 80/20/0/0 | 60/30/10/0 | 50/30/15/5 | 40/30/20/10 |
| Valid Merge Pairs Available | 7 | 7 | 10 | 12 | 12 |
| Avg Valid Combos on Board | ~8 | ~6 | ~5 | ~4 | ~3 |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: On board refill (stage advance or game start), the algorithm guarantees at least 3 valid adjacent merge pairs exist. After placing random elements, scan the board; if fewer than 3 valid pairs found, swap random non-adjacent tiles until 3+ pairs exist.
2. **Variety**: Each stage advance shuffles the element weights. No two consecutive stages have the same Tier weight distribution.
3. **Difficulty Monotonicity**: Void spread interval only decreases. Merge targets only increase. Element pool only expands.
4. **Rest Moments**: After completing a stage, a 1.5-second celebration pause plays (stage clear animation, score bonus), giving the player a brief rest.
5. **Boss Stages**: Every 5th stage (5, 10, 15, 20...) starts with 3 Void tiles pre-placed on the board, creating immediate pressure.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Dark mystical alchemy aesthetic. Deep purple/indigo backgrounds with golden accents. Element tiles use bold, saturated colors on dark rounded-square backgrounds. Glowing particle effects on merges. Void tiles are jet black with pulsing purple edges. The overall feel is "mystical laboratory" — elegant, dark, but with vivid bursts of color on every successful merge.

**Aesthetic Keywords**: Mystical, Alchemical, Dark-Elegant, Vivid, Satisfying

**Reference Palette**: Think Darkest Dungeon meets 2048 — moody atmosphere with punchy, readable game elements.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Deep Indigo | #0D0B1E | Game background |
| Grid Cell BG | Dark Purple | #1A1435 | Empty cell fill |
| Grid Cell Stroke | Muted Lavender | #3D2E6B | Cell borders |
| Fire | Bright Orange | #FF6B2B | Fire element tile |
| Water | Ocean Blue | #2B9DFF | Water element tile |
| Earth | Forest Green | #4CAF50 | Earth element tile |
| Air | Sky Cyan | #80DEEA | Air element tile |
| Lightning | Electric Yellow | #FFD740 | Lightning element tile |
| Magma | Deep Red-Orange | #E64A19 | Magma (Tier 1) tile |
| Ice | Frost White-Blue | #B3E5FC | Ice (Tier 1) tile |
| Storm | Violet | #9C27B0 | Storm (Tier 1) tile |
| Mud | Brown | #795548 | Mud (Tier 1) tile |
| Steam | Light Gray | #CFD8DC | Steam (Tier 1) tile |
| Obsidian | Jet Black w/ Purple | #1A0033 | Obsidian (Tier 2) tile |
| Blizzard | White w/ Blue tint | #E8F5FE | Blizzard (Tier 2) tile |
| Tornado | Dark Teal | #006064 | Tornado (Tier 2) tile |
| Philosopher's Stone | Gold | #FFD700 | Legendary (Tier 3) tile |
| Void | Jet Black | #0A0A0A | Void tile fill |
| Void Pulse | Toxic Purple | #8B00FF | Void tile pulsing edge |
| Pure Crystal | Diamond White | #F0F0FF | Pure Crystal tile |
| Selection Glow | Gold | #FFD700 | Selected tile highlight |
| UI Text | Off-White | #E8E0F0 | Score, labels, menus |
| UI Accent | Royal Gold | #FFB300 | Buttons, highlights |
| Danger | Crimson | #FF1744 | Void meter, warnings |
| Success | Emerald | #00E676 | Valid merge flash |

### 4.3 SVG Specifications

All graphics are SVG strings defined in `config.js`, registered as base64 textures in BootScene.

**Element Tile (base template — 56x56px, rounded square)**:
```svg
<!-- Base tile shape, color varied per element -->
<svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="52" height="52" rx="8" ry="8"
    fill="{ELEMENT_COLOR}" stroke="#3D2E6B" stroke-width="2"/>
  <!-- Element symbol rendered as Phaser text overlay, not in SVG -->
</svg>
```

**Element Symbols** (rendered as Phaser text at tile center, 22px bold):

| Element | Symbol | Font Size |
|---------|--------|-----------|
| Fire | (flame emoji drawn as text) | 22px |
| Water | (droplet) | 22px |
| Earth | (mountain) | 22px |
| Air | (wind swirl) | 22px |
| Lightning | (bolt) | 22px |
| Magma | (volcano) | 20px |
| Ice | (snowflake) | 20px |
| Storm | (tornado) | 20px |
| Mud | (splat) | 20px |
| Steam | (cloud) | 20px |
| Obsidian | (gem) | 18px |
| Blizzard | (ice crystal) | 18px |
| Tornado | (cyclone) | 18px |
| Philosopher's Stone | (star) | 24px |
| Void | (skull) | 22px |
| Pure Crystal | (diamond) | 22px |

**Implementation note**: Element symbols will use unicode characters rendered by Phaser text (e.g., Fire = "\u{1F525}", Water = "\u{1F4A7}", etc.) OR simple SVG shapes (triangle for fire, circle for water, square for earth, wavy lines for air, zigzag for lightning). Developer should use simple geometric shapes if unicode rendering is inconsistent across devices:

**Fire SVG Symbol** (inside tile):
```svg
<svg width="24" height="28" viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 0 C12 0, 24 14, 18 22 C16 25, 8 25, 6 22 C0 14, 12 0, 12 0Z"
    fill="#FFF3E0" opacity="0.9"/>
</svg>
```

**Water SVG Symbol**:
```svg
<svg width="20" height="26" viewBox="0 0 20 26" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 0 C10 0, 20 14, 10 24 C0 14, 10 0, 10 0Z"
    fill="#E3F2FD" opacity="0.9"/>
</svg>
```

**Earth SVG Symbol**:
```svg
<svg width="24" height="20" viewBox="0 0 24 20" xmlns="http://www.w3.org/2000/svg">
  <polygon points="12,0 24,20 0,20" fill="#E8F5E9" opacity="0.9"/>
</svg>
```

**Air SVG Symbol**:
```svg
<svg width="24" height="16" viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 12 C4 8, 8 4, 12 8 C16 12, 20 4, 24 0" fill="none"
    stroke="#E0F7FA" stroke-width="3" stroke-linecap="round"/>
</svg>
```

**Lightning SVG Symbol**:
```svg
<svg width="18" height="28" viewBox="0 0 18 28" xmlns="http://www.w3.org/2000/svg">
  <polygon points="10,0 0,16 8,16 6,28 18,10 10,10" fill="#FFF9C4" opacity="0.9"/>
</svg>
```

**Void Tile**:
```svg
<svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="52" height="52" rx="8" ry="8"
    fill="#0A0A0A" stroke="#8B00FF" stroke-width="2"/>
  <circle cx="20" cy="22" r="5" fill="#8B00FF" opacity="0.6"/>
  <circle cx="36" cy="22" r="5" fill="#8B00FF" opacity="0.6"/>
  <path d="M16 38 C22 32, 34 32, 40 38" fill="none"
    stroke="#8B00FF" stroke-width="2" opacity="0.6"/>
</svg>
```

**Pure Crystal Tile**:
```svg
<svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="52" height="52" rx="8" ry="8"
    fill="#F0F0FF" stroke="#FFD700" stroke-width="3"/>
  <polygon points="28,8 36,20 36,36 28,48 20,36 20,20"
    fill="#E8EAF6" stroke="#B388FF" stroke-width="1.5"/>
</svg>
```

**Empty Cell**:
```svg
<svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="52" height="52" rx="8" ry="8"
    fill="#1A1435" stroke="#3D2E6B" stroke-width="1.5"/>
</svg>
```

**Design Constraints**:
- Max 6 path/shape elements per SVG
- Use basic shapes (rect, circle, polygon, path) only
- All tile SVGs are 56x56px
- Symbols are separate SVG textures centered on tiles via Phaser
- Animations via Phaser tweens, not SVG animate

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Selection glow | Tile A tapped | 3px golden (#FFD700) animated border, pulsing opacity 0.6-1.0 over 600ms loop |
| Valid merge flash | Successful merge | Both tiles flash emerald (#00E676) for 150ms, then particle burst |
| Merge particle burst | After flash | 20 small circles (4px) in result element's color, radial outward, speed 120-250px/s, lifespan 400ms |
| Element transmutation | New element appears | Scale from 0 to 1.3 to 1.0 over 200ms, golden sparkle ring expands outward 80px, fades in 300ms |
| Invalid merge Void spawn | Bad combo | Both tiles shake 6px for 200ms, one darkens to black over 300ms (Void), toxic purple particles (10, lifespan 500ms) |
| Void spread pulse | Void infects neighbor | Void tile flashes bright purple (#8B00FF) for 100ms, dark tentacle line extends to target tile over 400ms, target darkens |
| Void cleanse wave | Pure Crystal used | White shockwave ring expands outward from crystal position, 150px radius, 400ms. Each cleansed Void tile bursts into 8 white particles |
| Chain cascade glow | Chain merge 2+ | Board background briefly brightens per chain (alpha += 0.05 per step, max 0.3), golden border pulses around grid |
| Gravity fall | Tiles drop after merge | Tiles tween downward to fill gaps, duration 180ms, ease Bounce.easeOut |
| Idle warning | 12s no input | Screen edges pulse crimson (#FF1744), intensity 0.1 to 0.4 alpha, 800ms cycle |
| Stage clear | Merge target reached | All tiles briefly glow gold for 500ms, "STAGE N!" text scales in from 2.0 to 1.0 |
| Philosopher's Stone creation | Tier 3 merge | Full-screen golden flash at 30% opacity, 300ms. 40 golden particles. Camera zoom 1.08x, 500ms recovery |

---

## 5. Audio Design

### 5.1 Sound Effects

All sounds generated via Web Audio API through Phaser's built-in sound manager. No external audio files.

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Tile select | Soft crystal tap (600Hz sine, 40ms decay) | 60ms | High |
| Valid merge | Satisfying alchemical chime (440Hz + 660Hz + 880Hz chord, 120ms decay) | 150ms | High |
| Invalid merge | Discordant buzz (100Hz sawtooth + 150Hz, 200ms) | 250ms | High |
| Chain merge (each step) | Same merge chime but pitch +80Hz per chain step | 150ms | High |
| Chain 4+ | Deep mystical resonance (80Hz sine, 300ms decay) layered with chime | 350ms | High |
| Void spread | Low ominous hiss (white noise, band-pass 200-800Hz, 150ms) | 180ms | Medium |
| Void cleanse (per tile) | Bright ping (1200Hz sine, 50ms) pitched up +50Hz per tile cleansed | 70ms | High |
| Mass cleanse | Cascading ascending pings + final bell (880Hz, 200ms) | 500ms | High |
| Pure Crystal appears | Crystalline sparkle (1600Hz + 2000Hz, 100ms, subtle) | 120ms | Medium |
| Game Over | Descending dark tone (330Hz to 80Hz over 600ms, with reverb-like tail) | 800ms | High |
| Stage advance | Triumphant ascending sweep (200Hz to 1000Hz, 400ms) | 450ms | High |
| UI button press | Subtle click (1000Hz square wave, 20ms) | 30ms | Low |
| Idle warning tick | Ominous metronome (400Hz, 15ms) every 1000ms | 20ms | Medium |
| Philosopher's Stone creation | Grand chord (C4+E4+G4+C5, 500ms, slow decay) | 600ms | High |

### 5.2 Music Concept

**Background Music**: No background music. The game relies on its richly layered SFX to create an emergent audio landscape. The rising-pitch chain reaction sounds, the ominous Void hiss, and the crystalline cleanse pings create a dynamic audio experience that responds to gameplay state. Silence between actions builds tension.

**Audio Implementation**: Web Audio API via Phaser's built-in sound manager. No Howler.js dependency.

---

## 6. UI/UX

### 6.1 Screen Flow

```
+----------+     +----------+     +----------+
|  Boot    |---->|   Menu   |---->|   Game   |
|  Scene   |     |  Screen  |     |  Screen  |
+----------+     +-----+----+     +----------+
                    |   |                |
               +----+   |           +----+----+
               |        |           |  Pause  |---->+---------+
          +----+----+   |           | Overlay |     |  Help   |
          |  Help   |   |           +----+----+     |How 2Play|
          |How 2Play|   |                |          +---------+
          +---------+   |           +----+----+
                        |           |  Game   |
                        |           |  Over   |
                        |           | Screen  |
                        |           +----+----+
                        |                |
                        |           +----+----+
                        |           |Continue |
                        |           |(Ad Opt) |
                        |           +---------+
```

### 6.2 HUD Layout

```
+-------------------------------+
| 1250      Stage 4     [?] [||]|  <-- Top bar (48px, #0D0B1E at 85% alpha)
+-------------------------------+
|                               |
|   +---+---+---+---+---+      |
|   |   |   |   |   |   |      |
|   +---+---+---+---+---+      |
|   |   |   |   |   |   |      |
|   +---+---+---+---+---+      |
|   |   |   |   |   |   |      |  <-- 5x5 Grid (centered)
|   +---+---+---+---+---+      |
|   |   |   |   |   |   |      |
|   +---+---+---+---+---+      |
|   |   |   |   |   |   |      |
|   +---+---+---+---+---+      |
|                               |
|     Chain: x3!                |  <-- Chain counter (appears during cascades)
|                               |
+-------------------------------+
| Void: 3  [======------] 12%  |  <-- Void meter bar (36px)
+-------------------------------+
| Pure in: 3 merges     Hi:4200|  <-- Info bar (28px)
+-------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left (16px, 14px) | Current score, 24px bold #E8E0F0 | Every score event |
| Stage | Top-center | "Stage N", 20px #E8E0F0 | On stage advance |
| Help Button | Top-right - 56px | "?" circle icon (44x44px tap target), #FFB300 | Static |
| Pause Button | Top-right - 8px | "||" icon (44x44px tap target), #E8E0F0 | Static |
| Chain Counter | Below grid, centered | "x3!" with escalating gold text, 28px + 6px per chain | During cascades only |
| Void Meter | Below grid area | Bar fill: green (0-30%), yellow (30-60%), red (60-75%). Text: "Void: N" + percentage | On Void change |
| Pure Crystal Timer | Bottom-left | "Pure in: N merges", 16px #B388FF | After each merge |
| High Score | Bottom-right | "Hi: NNNN", 14px #FFB300 | Static (updates on new best) |
| Idle Warning | Center overlay | "WAKE UP!" 32px #FF1744, pulsing | When idle > 12s |

### 6.3 Menu Structure

**Main Menu (MenuScene)**:
- Game title "TILE ALCHEMY" (44px, #FFB300, centered, y=22%)
- Subtitle "Merge elements. Master the table. Chain reactions." (14px, #8B7FBB, y=30%)
- Decorative: animated floating element symbols rotating slowly behind title
- "PLAY" button (200x56px, #FFB300 fill, #0D0B1E text, centered, y=50%)
- "?" Help button (44x44px circle, #3D2E6B fill with #FFB300 "?", top-right)
- High Score display (22px, #FFD700, y=65%): "Best: 12450"
- Games Played (16px, #8B7FBB, y=72%): "Games: 47"
- Sound toggle (speaker icon, 44x44px, bottom-right)

**Pause Overlay** (semi-transparent #0D0B1E at 88%):
- "PAUSED" title (36px #E8E0F0)
- "Resume" button (180x50px, #FFB300)
- "How to Play" button (180x50px, #3D2E6B)
- "Restart" button (180x50px, #3D2E6B)
- "Quit to Menu" button (180x50px, #3D2E6B)
- Void spread timer FROZEN during pause

**Game Over Screen** (overlay on game scene, #0D0B1E at 90%):
- "TRANSMUTATION FAILED" (32px, #FF1744)
- Final Score (48px, #E8E0F0, scale-punch animation 1.0 to 1.4 to 1.0 over 300ms)
- "NEW BEST!" (if high score, 24px #FFD700, bouncing)
- Stage Reached (18px, #8B7FBB)
- Best Chain (18px, #8B7FBB)
- Void tiles at death (18px, #8B7FBB)
- "Cleanse 5 Void (Watch Ad)" button (rewarded ad, 200x50px, #FFD700 border)
- "Play Again" button (200x50px, #FFB300)
- "Menu" button (140x40px, #3D2E6B)

**Help / How to Play Screen (HelpScene)**:
- Title: "HOW TO PLAY" (32px, #FFB300)
- **Visual diagram 1**: SVG illustration showing two adjacent tiles (Fire + Earth) with a tap finger icon, arrow pointing to result (Magma). Caption: "Tap two adjacent elements to merge them"
- **Visual diagram 2**: SVG showing an invalid pair (Fire + Fire) with red X and Void tile spawning. Caption: "Wrong combos create toxic Void tiles!"
- **Visual diagram 3**: SVG showing Void tiles with clock icon and spreading arrows. Caption: "Void spreads every few seconds. Don't let it reach 75%!"
- **Visual diagram 4**: SVG showing Pure Crystal adjacent to Void, with cleansing wave. Caption: "Pure Crystals cleanse connected Void tiles"
- **Alchemy Table Quick Reference** (condensed):
  - Fire+Earth=Magma, Water+Air=Ice, Fire+Air=Storm
  - Earth+Water=Mud, Fire+Water=Steam
  - Magma+Ice=Obsidian, Storm+Mud=Tornado, Ice+Storm=Blizzard
- **Tips**:
  - "Memorize the Alchemy Table — wrong combos are punishing!"
  - "Plan merges near Void clusters to set up Crystal cleanses"
  - "Chain reactions multiply your score — think one step ahead"
- "GOT IT!" button (180x50px, #FFB300) — returns to previous scene
- Scrollable container if content exceeds viewport
- Background: #0D0B1E, consistent with game palette

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue (cleanse 5 Void tiles) | Every game over (optional) | Always optional |
| Rewarded | Board shuffle (deadlock recovery) | On deadlock (optional) | Always optional |
| Rewarded | Double final score | End of session (optional) | Always optional |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Void Cleanse | Watch ad after 75% Void game over | Removes 5 random Void tiles, resume play | Once per game |
| Board Shuffle | Watch ad on deadlock | Randomize all non-Void tile elements | Once per game |
| Score Doubler | Watch ad at game over | 2x final score for high-score | Once per session |

### 7.3 Session Economy

Players average 3-5 games per session (3-5 min each = 9-25 min total). Expected ad views: ~1 interstitial per session (every 3rd game over), ~0.4 rewarded ads per session (40% opt-in on continue). Monetization is light — game hooks through replayability and Alchemy Table mastery, not ad pressure.

**Session Flow with Monetization**:
```
[Play] --> [75% Void / Deadlock] --> [Rewarded Ad: Cleanse 5 Void / Shuffle?]
                                           | Yes --> [Resume play --> eventual 2nd death]
                                           | No  --> [Game Over Screen]
                                                          |
                                                    [Interstitial (every 3rd game over)]
                                                          |
                                                    [Rewarded Ad: Double Score?]
                                                          | Yes --> [Score doubled, saved]
                                                          | No  --> [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/tile-alchemy/
+-- index.html              # Entry point, viewport meta, CDN Phaser, script load order
|   +-- CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
|   +-- Local CSS           # css/style.css
|   +-- Local JS (ordered)  # config -> stages -> ads -> help -> ui -> game -> main (LAST)
+-- css/
|   +-- style.css           # Responsive styles, mobile-first, portrait lock
+-- js/
    +-- config.js           # Constants, colors, alchemy table, SVG strings, difficulty tables
    +-- main.js             # BootScene (texture registration), Phaser config, scene list (LOADS LAST)
    +-- game.js             # GameScene: grid, tile placement, merge logic, Void spread, cascades
    +-- stages.js           # Stage progression, difficulty scaling, element pool generation
    +-- ui.js               # MenuScene, GameOverScene, HUD overlay, pause overlay
    +-- help.js             # HelpScene with illustrated alchemy instructions
    +-- ads.js              # Ad integration hooks, reward callbacks
```

### 8.2 Module Responsibilities

**config.js** (target ~120 lines):
- `CONFIG` object: game dimensions (360x640 base), grid size (5x5), cell size (56px), gap (4px), colors palette object
- `ALCHEMY_TABLE`: array of { inputA, inputB, result, tier } entries (12 recipes + Pure Crystal cleanse)
- `ELEMENT_DEFS`: map of element name to { color, symbol, svgKey, tier }
- `DIFFICULTY_TABLE`: array of stage parameters (voidInterval, mergeTarget, tierWeights)
- `SVG_STRINGS`: all SVG template strings for tiles, symbols, empty cell, void tile, pure crystal
- `SCORE_VALUES`: merge base points per tier, chain multiplier formula, cleanse points, bonuses

**main.js** (target ~60 lines):
- `BootScene`: loads all SVG strings via `textures.addBase64()`, waits for all `addtexture` events, starts MenuScene
- Phaser.Game config: type AUTO, width 360, height 640, scale mode FIT, parent 'game-container', backgroundColor '#0D0B1E'
- Scene registration: [BootScene, MenuScene, GameScene, HelpScene]
- `GameState` global: { score, highScore, stage, mergesThisStage, chainCount, gamesPlayed, voidCount, settings }
- localStorage read/write helpers

**game.js** (target ~290 lines):
- `GameScene.create()`: Build 5x5 grid (2D array), populate with random elements, render tile sprites + symbol overlays, start Void spread timer, set up input handlers
- `GameScene.update()`: Idle timer check, Void spread tick (real-time via Phaser timer event), cascade state machine
- `selectTile(row, col)`: Highlight tile, store selection. If second tile selected AND adjacent, call `attemptMerge()`
- `attemptMerge(tileA, tileB)`: Look up pair in ALCHEMY_TABLE. If found, call `executeMerge()`. If not, call `spawnVoid()`
- `executeMerge(tileA, tileB, result)`: Remove both tiles, create result element at tileA position, apply gravity, increment merge counter, check Pure Crystal spawn, call `checkChainReaction()`
- `checkChainReaction()`: Scan board for any adjacent pair that forms a valid merge where one tile is the newly created result. If found, auto-merge with incremented chain counter. Recurse until no more chains.
- `spawnVoid(tile)`: Replace the higher-tier tile with Void. Play error effects.
- `applyGravity()`: For each column, scan bottom-up. If empty cell found below a tile, tween tile down. Duration 180ms, ease Bounce.easeOut.
- `spreadVoid()`: Called on timer. For each Void tile, pick one random adjacent non-Void tile and convert it to Void. Check 75% threshold.
- `usePureCrystal(crystalTile, voidTile)`: BFS from voidTile through connected Void tiles. Cleanse all found. Play cleanse wave effect.
- `checkGameOver()`: If voidCount >= 19, trigger game over. If no valid merges and no Pure Crystal, trigger deadlock game over.
- Grid utilities: `isAdjacent(r1,c1,r2,c2)`, `getAdjacentCells(r,c)`, `findValidMerges()`, `countVoid()`

**stages.js** (target ~80 lines):
- `getStageConfig(stageNum)`: Returns { voidSpreadInterval, mergeTarget, tierWeights, bossVoidCount }
- `generateElement(tierWeights)`: Returns random element name based on tier weight distribution
- `fillEmptyCells(grid, tierWeights)`: Fills all null cells with random elements, guarantees 3+ valid pairs
- `advanceStage(currentStage, mergesThisStage)`: Checks if merges >= target, returns new config if so
- `guaranteeSolvability(grid)`: Scans for valid adjacent pairs; if < 3, swaps random tiles until 3+ exist

**ui.js** (target ~250 lines):
- `MenuScene`: Title, subtitle, play button, help button, high score, sound toggle
- `GameOverOverlay`: Final score display, high score check, continue/play again/menu buttons
- `HUD`: Score text, stage text, chain counter, void meter bar, pure crystal timer, idle warning
- `PauseOverlay`: Resume, help, restart, quit buttons
- All button tap targets minimum 44x44px
- Void meter bar: 280x20px bar at y=530, fill color transitions green->yellow->red based on void%

**help.js** (target ~120 lines):
- `HelpScene`: Illustrated how-to-play with SVG diagrams showing merge process, void danger, crystal cleanse
- Alchemy Table quick reference (condensed visual grid)
- Tips section
- "GOT IT!" button returning to previous scene
- Scrollable container for content exceeding viewport

**ads.js** (target ~40 lines):
- `AdManager`: Placeholder hooks for interstitial and rewarded ads
- `showInterstitial(callback)`: Simulates ad, calls callback
- `showRewarded(onReward, onSkip)`: Simulates rewarded ad
- `shouldShowInterstitial(gamesPlayed)`: Returns true every 3rd game over
- No actual ad SDK — POC stage

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No Howler.js — audio via Web Audio API through Phaser's sound manager.

---

## 9. Juice Specification

### 9.1 Player Input Feedback (tile selection — every tap)

| Effect | Target | Values |
|--------|--------|--------|
| Scale punch | Tapped tile | Scale: 1.0 to 1.15 to 1.0, Duration: 120ms, Ease: Quad.easeOut |
| Selection glow | Selected tile | 3px border, Color: #FFD700, Opacity pulse: 0.6 to 1.0, Cycle: 600ms |
| Sound | -- | Crystal tap: 600Hz sine, 40ms decay, slight pitch variation +/-30Hz random |
| Haptic | Device | navigator.vibrate(10) on supported devices |

### 9.2 Core Action Additional Feedback (valid merge — the money moment)

| Effect | Values |
|--------|--------|
| Flash | Both merging tiles flash #00E676 (emerald) for 150ms before dissolving |
| Particles | Count: 20 small circles (4px), Color: result element's color, Direction: radial outward from merge center, Speed: 120-250px/s, Lifespan: 400ms, Fade: alpha 1 to 0 |
| Transmutation pop | New element scales 0 to 1.3 to 1.0 over 200ms, Ease: Back.easeOut |
| Golden sparkle ring | Expanding ring from merge center, radius 0 to 80px over 300ms, color #FFD700, alpha 0.8 to 0, stroke 2px |
| Screen shake | Intensity: 2px (chain 1), +2px per chain step (max 14px), Duration: 120ms |
| Hit-stop | 35ms freeze (this.time.paused equivalent via delayedCall) before merge animation |
| Camera zoom | 1.02x toward merge center (chain 1), +0.01x per chain step (max 1.08x), Recovery: 250ms ease-out |
| Sound | Alchemical chord: 440+660+880Hz, 150ms. Chain pitch: +80Hz per step. Chain 4+: add 80Hz bass resonance |
| Chain text | "x2!", "x3!", "x4!"... at merge center, Size: 24px + 6px per chain, Color: #FFD700, Float up 50px over 500ms, Fade: alpha 1 to 0 |
| Combo escalation | Every chain step: particle count +6, shake intensity +2px, sound pitch +80Hz, text size +6px, zoom +0.01x |
| Philosopher's Stone creation (Tier 3) | Full-screen gold flash at 30% opacity for 300ms, 40 gold particles, camera zoom 1.08x with 500ms recovery, grand chord sound |

### 9.3 Invalid Merge Feedback (wrong combo — punishing but clear)

| Effect | Values |
|--------|--------|
| Tile shake | Both tiles shake horizontally: offset +/-6px, 3 oscillations over 200ms |
| Sound | Discordant buzz: 100Hz + 150Hz sawtooth, 200ms |
| Void spawn | Tile darkens from element color to #0A0A0A over 300ms. 10 toxic purple particles (#8B00FF, 3px), lifespan 500ms |
| Screen shake | Intensity: 4px, Duration: 150ms |
| Haptic | navigator.vibrate([30, 20, 30]) (double buzz) |

### 9.4 Void Spread Feedback (ambient threat)

| Effect | Values |
|--------|--------|
| Void flash | Spreading Void tile flashes #8B00FF at full opacity for 100ms |
| Tentacle line | Dark purple line (#5A007F) extends from Void to target tile over 400ms, width 3px |
| Target conversion | Target tile desaturates over 300ms, then snaps to Void appearance |
| Sound | Low hiss: white noise band-pass 200-800Hz, 180ms, volume 0.3 (subtle) |
| Void meter update | Meter bar width tweens to new fill, color transitions if threshold crossed |

### 9.5 Void Cleanse Feedback (satisfying reversal)

| Effect | Values |
|--------|--------|
| Shockwave ring | White (#F0F0FF) ring expands from crystal, radius 0 to 150px over 400ms, alpha 0.8 to 0, stroke 3px |
| Per-tile cleanse | Each cleansed Void bursts: 8 white particles (3px), radial outward, speed 100-200px/s, lifespan 350ms |
| Stagger delay | Each Void tile cleanses 80ms after the previous (wave effect) |
| Sound | Ascending pings: 1200Hz + 50Hz per tile cleansed, 50ms each. Final bell: 880Hz, 200ms |
| Screen flash | Brief white flash at 15% opacity for 100ms on mass cleanse (5+ tiles) |

### 9.6 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 12px, Duration: 400ms, Decay: exponential |
| Screen effect | Desaturation to 50% over 400ms, purple vignette overlay (#8B00FF) at 25% opacity |
| Sound | Descending dark tone: 330Hz to 80Hz over 600ms |
| Board visual | All non-Void tiles briefly flash #FF1744 for 200ms |
| Void pulse | All Void tiles pulse simultaneously: scale 1.0 to 1.1 to 1.0, 300ms |
| Effect to UI delay | 700ms (effects play, then game over overlay fades in over 300ms) |
| Death to restart | **1.5 seconds** total (700ms effects + 300ms overlay fade + 500ms "Play Again" tap to instant restart) |

### 9.7 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{N}" at merge location, Color: #FFD700, Size: 18px (+4px per chain step), Movement: float up 60px over 600ms, Fade: alpha 1 to 0 |
| Score HUD punch | Scale 1.0 to 1.3 to 1.0, Duration: 150ms, Ease: Quad.easeOut |
| Chain text | "CHAIN x{N}!" below floating score, Size: 28px + 6px per chain, Color: #FFD700, Pulse: scale 1.0 to 1.1 to 1.0 repeating |
| Cleanse bonus text | "+{N}" in white (#F0F0FF) at cleanse center, Size: 20px |
| Stage advance | "STAGE {N}!" 36px #FFB300 text, scales from 2.0 to 1.0 over 500ms, fades after 1500ms. "+500" bonus floats up separately |
| New high score | "NEW BEST!" 28px #FFD700, bouncing animation (y offset: sine wave, amplitude 8px, period 800ms), persists for 2000ms |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | No external assets (all SVG inline) |
| Memory Usage | <60MB | Max 25 tile sprites + 25 symbol sprites + 120 pooled particles |
| JS Bundle Size | <120KB total (excl. CDN) | 7 files, each under 300 lines |
| First Interaction | <1 second after load | BootScene to MenuScene immediate |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser pointer events. `this.input.on('pointerdown')` for tile taps. Hit areas on each tile sprite (56x56px, minimum 44x44px guideline exceeded).
- **Prevent Default**: CSS `touch-action: none` on game container. `overscroll-behavior: none` to prevent pull-to-refresh.
- **Orientation**: Portrait lock via CSS `@media (orientation: landscape)` showing "Please rotate your device" message with a rotation icon.
- **Safe Areas**: 16px padding from viewport edges for HUD elements.
- **Background/Focus**: Phaser `blur` event auto-pauses game and freezes Void spread timer. `focus` event shows pause overlay.
- **Object Pooling**: Particle pool of 120 circle sprites (reused across merge/cleanse/void effects). Tile sprites: 25 tile backgrounds + 25 symbol overlays (reused by changing texture key and tint).

### 10.3 Grid Implementation Details

**Data Structure**:
```javascript
// Grid stored as 2D array [row][col]
this.grid = [];  // 5x5, each cell: { element: 'fire'|'water'|...|'void'|'pure'|null, sprite: Image, symbol: Text }

// Initialize board:
for (let r = 0; r < 5; r++) {
  this.grid[r] = [];
  for (let c = 0; c < 5; c++) {
    this.grid[r][c] = { element: randomElement(), sprite: null, symbol: null };
  }
}
```

**Grid to Pixel Conversion**:
```
cellSize = 56px, gap = 4px, totalCellStep = 60px
gridWidth = 5 * 60 - 4 = 296px
gridOffsetX = (360 - 296) / 2 = 32px
gridOffsetY = 80px (below HUD)

pixelX(col) = gridOffsetX + col * 60 + 28  (center of cell)
pixelY(row) = gridOffsetY + row * 60 + 28  (center of cell)
```

**Tap to Grid Conversion**:
```
col = Math.floor((pointerX - gridOffsetX) / 60)
row = Math.floor((pointerY - gridOffsetY) / 60)
if (col >= 0 && col < 5 && row >= 0 && row < 5) -> valid cell
```

**Adjacency Check**:
```
isAdjacent(r1, c1, r2, c2):
  return (Math.abs(r1-r2) + Math.abs(c1-c2)) === 1
  // Only orthogonal (up/down/left/right), NOT diagonal
```

**Alchemy Table Lookup**:
```
lookupMerge(elementA, elementB):
  for each recipe in ALCHEMY_TABLE:
    if (recipe.inputA === elementA && recipe.inputB === elementB) ||
       (recipe.inputA === elementB && recipe.inputB === elementA):
      return recipe.result
  return null  // invalid combo
```

**Chain Reaction Algorithm**:
```
1. After merge creates new element at (r, c):
2. Check all 4 adjacent cells of (r, c)
3. For each adjacent cell with a non-null, non-void element:
   a. Look up merge(newElement, adjacentElement) in ALCHEMY_TABLE
   b. If valid, queue this merge as next chain step
4. If queue is non-empty:
   a. Wait 300ms (let player see the board state)
   b. Execute first queued merge (same merge logic)
   c. Increment chainCount
   d. Recurse from step 1 with the newly created element
5. If queue is empty, chain ends. Reset chainCount.

NOTE: If multiple valid chain merges exist, execute the one producing the HIGHEST tier result.
Priority: Tier 3 > Tier 2 > Tier 1. If tied, pick the first found (left/top/right/bottom scan order).
```

**Gravity Algorithm**:
```
For each column c (0 to 4):
  writePos = 4  // bottom of column
  for readPos = 4 downto 0:
    if grid[readPos][c].element !== null:
      if readPos !== writePos:
        // Move tile from readPos to writePos
        grid[writePos][c] = grid[readPos][c]
        grid[readPos][c] = { element: null, ... }
        // Tween sprite from old Y to new Y, 180ms, Bounce.easeOut
      writePos--
  // Remaining cells (0 to writePos) are now empty (null)
```

**Void Spread Algorithm**:
```
spreadVoid():
  voidCells = all cells where element === 'void'
  for each voidCell in voidCells:
    adjacents = getAdjacentCells(voidCell.r, voidCell.c)
    nonVoidAdjacents = adjacents.filter(a => a.element !== 'void' && a.element !== null)
    if nonVoidAdjacents.length > 0:
      target = random pick from nonVoidAdjacents
      // Only spread to ONE adjacent per Void tile per tick
      convertToVoid(target)
      break  // Only ONE spread event per tick globally (prevents instant board wipe)

  // IMPORTANT: Only ONE Void tile spreads per tick, chosen randomly from all Void tiles.
  // This prevents exponential Void growth (2 voids spreading = 4, 4 = 8, etc.)

  updateVoidCount()
  if voidCount >= 19:  // 75% of 25
    gameOver()
```

### 10.4 Edge Cases

- **Resize/Orientation**: On resize, Phaser scale manager handles FIT mode. Landscape shows "Please rotate" overlay with `visibility:hidden; height:0; overflow:hidden` on game canvas (NOT `display:none` per run-007 lesson).
- **Background/Tab Switch**: Game auto-pauses. Void spread timer frozen. On return, pause overlay shown.
- **Rapid Tapping**: Input locked during merge animation (200ms) and gravity animation (180ms) and chain cascade. Input buffer stores one tap, applied after animations complete.
- **Void occupies all adjacents of a tile**: That tile is effectively trapped. Player can still tap other parts of the board. Tile will eventually be consumed by Void spread.
- **Pure Crystal + Non-Void merge**: Pure Crystal can ONLY be used on Void tiles. Tapping Pure Crystal + any non-Void tile is treated as an invalid merge (spawns Void). This is intentional — it creates strategic tension about when to use the Crystal.
- **Board completely empty**: Theoretically possible after a massive cascade. Refill all 25 cells with weighted random elements per current stage config.
- **Stage advance during chain**: Stage advance check happens AFTER chain completes, not mid-chain. Merge counter increments per chain step but stage advance waits.
- **stageTransitioning flag**: Set `this.stageTransitioning = true` when advancing stage. Check this flag in update() to prevent duplicate `advanceStage()` calls (run-007 trash-sort-panic bug pattern).
- **GameOver flag ordering**: Set `this.gameOver = true` BEFORE triggering death effects, not after. All input handlers check `if (this.gameOver) return` at the top (run-007 pattern).

### 10.5 Testing Checkpoints

1. **Boot**: BootScene loads, all SVG textures registered, MenuScene displays with title and play button
2. **Menu**: Play button starts GameScene, Help button opens HelpScene, sound toggle persists to localStorage
3. **Grid Rendering**: All 25 cells visible with element symbols, proper 5x5 alignment with 4px gaps
4. **Tile Selection**: Tap tile -> golden glow border appears. Tap again -> deselects. Tap non-adjacent tile -> reselects new tile.
5. **Valid Merge**: Fire + Earth -> Magma appears with particle burst, flash, and transmutation pop
6. **Invalid Merge**: Fire + Fire -> Void spawns on one tile with error shake and buzz sound
7. **Gravity**: After merge creates empty cell, tiles above fall down with bounce
8. **Chain Reaction**: Create element adjacent to a valid partner -> auto-merge fires with chain counter and escalating effects
9. **Void Spread**: Wait and observe Void tile spreading to one adjacent tile per tick interval
10. **Void Cleanse**: Merge Pure Crystal with adjacent Void -> all connected Void cleansed with wave effect
11. **Game Over (Void)**: Let Void reach 75% -> game over screen in 700ms, Play Again restarts in under 2s
12. **Inactivity Death**: Wait 12s -> "WAKE UP!" warning -> Void accelerates -> board fills -> game over within 24s total
13. **Stage Advance**: Hit merge target -> "STAGE N!" text, bonus scored, empty cells refilled
14. **Pause/Resume**: Pause button -> overlay (Void frozen) -> Resume returns to exact state
15. **High Score**: Beat high score -> "NEW BEST!" text -> persisted in localStorage
16. **Orientation**: Rotate to landscape -> "Please rotate" message -> back to portrait -> game intact
17. **Deadlock**: Engineer state with no valid merges and no Pure Crystal -> game over triggers
18. **Boss Stage**: Reach stage 5 -> 3 Void tiles pre-placed on board at start

### 10.6 Local Storage Schema

```json
{
  "tile_alchemy_high_score": 0,
  "tile_alchemy_games_played": 0,
  "tile_alchemy_highest_stage": 0,
  "tile_alchemy_best_chain": 0,
  "tile_alchemy_total_merges": 0,
  "tile_alchemy_settings": {
    "sound": true,
    "vibration": true
  }
}
```
