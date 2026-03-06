# Game Design Document: Sabotage Chef

**Slug**: `sabotage-chef`
**One-Liner**: Sabotage the recipe WITHOUT the judge catching you -- sneak in wrong ingredients while acting normal.
**Core Mechanic**: Stealth drag-and-drop ingredient sabotage under a patrolling judge's vision cone
**Target Session Length**: 45-90 seconds
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Sabotage Chef is a stealth-cooking hybrid where you play a contestant on a live cooking show secretly trying to ruin every dish. A conveyor belt scrolls ingredients across the bottom of the screen. You drag ingredients up to 4 recipe slots on a cooking station. Normal ingredients complete the recipe correctly (boring, low points). Sabotage ingredients (subtly marked with a tiny skull icon and a slight green tint) ruin the dish spectacularly -- and earn massive bonus points.

The catch: a Judge character patrols horizontally across the screen with a visible vision cone. If the Judge's cone overlaps your drag path the moment you DROP a sabotage ingredient into a slot, you are CAUGHT -- lose a life, the ingredient is rejected, and the Judge speeds up temporarily. The core tension is timing: watch the Judge's patrol pattern, wait for the cone to face away, then quickly drag the sabotage ingredient into the slot. Consecutive undetected sabotages build a Sneaky Combo multiplier that escalates rewards exponentially.

Each completed dish (all 4 slots filled) advances to the next stage. The Judge gets faster, the vision cone widens, and sabotage ingredients appear less frequently on the belt -- making each successful sabotage more precious and risky. If the player idles for 8 seconds without placing any ingredient, the recipe timer expires and the dish burns (lose a life). This ensures constant pressure and prevents passive play.

### 1.2 Target Audience

Casual mobile gamers aged 13-40. Ideal for short sessions: commutes, waiting rooms, bathroom breaks. The stealth-timing mechanic appeals to players who enjoy outsmarting systems. The cooking-show humor (ridiculous sabotage ingredients like "rubber chicken", "soap", "glitter") provides broad comedic appeal. Low skill floor (just drag ingredients) but high skill ceiling (combo optimization, Judge pattern reading).

### 1.3 Core Fantasy

You are a secret saboteur on a prestigious cooking show. The audience has no idea. The Judge patrols with suspicion, but you smile and cook like nothing is wrong -- while sneaking rubber ducks and hot sauce into the souffl. The thrill of getting away with it, the panic when the Judge turns your way mid-drag, the triumphant combo counter climbing -- this is the fantasy of the perfect prankster.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 45-90 seconds |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 22%+ |
| Average Dishes per Session | 4-10 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[New Recipe Appears (4 empty slots)] --> [Belt scrolls ingredients] --> [Drag ingredient to slot]
        ^                                                                      |
        |                                                       [Normal?] --- [Sabotage?]
        |                                                          |               |
        |                                                     [+10 pts]    [Judge watching?]
        |                                                          |          |          |
        |                                                          |     [YES: CAUGHT]  [NO: SNEAK!]
        |                                                          |     [-1 Life]      [+50 pts * combo]
        |                                                          |          |          |
        |                                                     [All 4 slots filled?]
        |                                                          |
        |                                                     [Dish Complete --> Next Stage]
        |                                                          |
        └──────────────────────── [3 Lives Lost --> Game Over] <───┘
```

**Moment-to-moment**: The screen shows a cooking station (top 55%) with 4 ingredient slots arranged in a 2x2 grid. Below the station, a conveyor belt (bottom 25%) scrolls ingredients leftward. The player drags ingredients from the belt upward into empty slots. A Judge character patrols horizontally across the middle zone, with a triangular vision cone projecting downward and to one side (the direction the Judge faces). The player must time sabotage placements to when the Judge's cone does NOT overlap the target slot. Normal ingredients can be placed freely at any time.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Pick up ingredient | Touch & hold on belt ingredient | Lifts ingredient from conveyor, ingredient follows finger |
| Place ingredient | Drag to slot & release | Drops ingredient into recipe slot; triggers Judge detection check on release |
| Cancel drag | Release outside any slot | Ingredient returns to belt (no penalty) |
| Pause | Tap pause icon (top-right corner) | Pauses gameplay, shows pause overlay |

**Control Philosophy**: Single-gesture drag-and-drop. The drag creates physical commitment -- your finger is visible on screen, moving through the Judge's potential vision zone. The release moment is the critical decision point: if you release a sabotage ingredient while the Judge's cone overlaps that slot, you are caught. This creates a visceral tension during every sabotage drag.

**Touch Area Map**:
```
┌─────────────────────────────┐
│ Score  Dish#  Combo    ♥♥♥  │  <- HUD (top 8%, y: 0-50px)
├─────────────────────────────┤
│  ┌──────┐    ┌──────┐       │
│  │Slot 1│    │Slot 2│       │  <- Cooking Station (y: 50-200px)
│  └──────┘    └──────┘       │     2x2 grid, slots 80x80px
│  ┌──────┐    ┌──────┐       │     centered horizontally
│  │Slot 3│    │Slot 4│       │
│  └──────┘    └──────┘       │
├─────────────────────────────┤
│  👨‍🍳 JUDGE PATROL ZONE        │  <- Judge patrols here (y: 200-340px)
│  ◄────── ▶ vision cone      │     Judge: 40x60px, cone: 120px wide
├─────────────────────────────┤
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │  <- Conveyor Belt (y: 340-480px)
│  │🥚│ │☠🧈│ │🥛│ │🧅│ │☠🦆│  │     Ingredients: 50x50px each
│  └──┘ └──┘ └──┘ └──┘ └──┘  │     Scroll speed: 40px/s base
│  ◄──── belt scrolls left    │
├─────────────────────────────┤
│        Recipe Timer Bar     │  <- Timer bar (y: 480-500px)
└─────────────────────────────┘     8s countdown, red when <3s
```

### 2.3 Scoring System

| Score Event | Base Points | Multiplier Condition |
|------------|-------------|---------------------|
| Place normal ingredient | 10 | None (1.0x) |
| Place sabotage (undetected) | 50 | Sneaky Combo multiplier (see below) |
| Complete dish (0 sabotage) | 20 | None |
| Complete dish (1 sabotage) | 80 | 1.5x |
| Complete dish (2 sabotages) | 160 | 2.0x |
| Complete dish (3 sabotages) | 300 | 3.0x |
| Complete dish (4 sabotages -- "Full Sabotage!") | 500 | 5.0x |
| Close call (Judge cone <30px from slot on sabotage drop) | +25 bonus | Flat bonus, stacks with combo |

**Combo System**: Sneaky Combo tracks consecutive undetected sabotage placements across dishes. Each consecutive sabotage multiplies the sabotage placement score:
- 1st sabotage: 1.0x (50 pts)
- 2nd consecutive: 1.5x (75 pts)
- 3rd consecutive: 2.0x (100 pts)
- 4th consecutive: 2.5x (125 pts)
- 5th+ consecutive: 3.0x cap (150 pts)

Getting CAUGHT resets the Sneaky Combo to 0. Placing a normal ingredient does NOT reset the combo (only caught resets it). This rewards aggressive sabotage play.

**High Score**: Stored in localStorage as `sabotage_chef_high_score`. Displayed on Menu and Game Over screens. New high score triggers confetti burst + "NEW RECORD!" floating text.

### 2.4 Progression System

Each completed dish (all 4 slots filled) advances the stage counter. The game is infinite -- stages escalate until the player loses all 3 lives.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-3 | Base mechanics: 1 Judge, slow patrol, wide belt, 50% sabotage ingredients | Easy -- learn drag & timing |
| 4-7 | Judge speeds up (1.3x), cone widens by 15px, sabotage frequency drops to 40% | Medium -- tighter windows |
| 8-12 | Judge patrol pattern becomes irregular (random pauses, direction changes), 35% sabotage | Hard -- unpredictable Judge |
| 13-20 | Second vision cone appears briefly every 5s (Judge "glances back"), 30% sabotage | Very Hard -- dual threat |
| 21+ | Judge speed 2.0x base, cone 180px wide, 25% sabotage, random speed bursts | Extreme -- survival mode |

**Rest Dishes**: Every 5th dish is a "Commercial Break" -- Judge leaves screen for 3 seconds at dish start, giving free sabotage time. Creates rhythm and relief.

### 2.5 Lives and Failure

The player starts with 3 lives (displayed as chef hats in HUD).

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Caught by Judge (sabotage in vision cone) | Lose 1 life, ingredient rejected, Judge flashes red | Watch ad for extra life (once per game) |
| Recipe timer expires (8s inactivity) | Lose 1 life, dish burns (fire animation), advance to next dish | None -- punishes idle play |
| 3 lives lost | Game Over screen | Watch ad to continue with 1 life (once per game) |

**Inactivity Death**: A recipe timer bar at the bottom counts down from 8 seconds. Every ingredient placement resets the timer to 8s. If the timer reaches 0, the dish catches fire, the player loses a life, and a new dish appears. This ensures death within 8 seconds of inactivity, well under the 30-second requirement.

**Death to Restart**: Game over screen appears after 500ms death animation. "Play Again" button immediately visible. Tap to restart = new game in under 1.5 seconds.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each "stage" is one dish (4 ingredient slots to fill). Stages are generated procedurally based on the stage number.

**Generation Algorithm**:
```
Stage Generation Parameters:
- stage_number: integer, starting at 1
- judge_speed: 60 + (stage_number * 8), capped at 180 px/s
- cone_width: 100 + (stage_number * 4), capped at 200 px
- cone_length: 120 + (stage_number * 3), capped at 200 px
- belt_speed: 40 + (stage_number * 3), capped at 100 px/s
- sabotage_ratio: max(0.20, 0.50 - (stage_number * 0.025))
- ingredient_spacing: max(70, 100 - stage_number * 2) px between belt items
- judge_patrol_irregularity: min(1.0, stage_number * 0.05) (0 = perfectly regular, 1 = very erratic)
- recipe_timer: max(5.0, 8.0 - (stage_number * 0.1)) seconds
- glance_back_chance: stage_number >= 13 ? min(0.4, (stage_number - 12) * 0.05) : 0
```

### 3.2 Difficulty Curve

```
Difficulty
    |
100 |                                          ──────────── (cap)
    |                                    /
 80 |                              /
    |                        /
 60 |                  /
    |            /
 40 |      /
    |  /
 20 |/
    |
  0 └────────────────────────────────────────── Stage
    0    5    10    15    20    25    30    35+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-3 | Stage 4-7 | Stage 8-12 | Stage 13-20 | Stage 21+ |
|-----------|-----------|-----------|------------|-------------|-----------|
| Judge Speed (px/s) | 68-84 | 92-116 | 124-156 | 164-180 | 180 (cap) |
| Cone Width (px) | 104-112 | 116-128 | 132-148 | 152-180 | 184-200 |
| Belt Speed (px/s) | 43-49 | 52-61 | 64-76 | 79-100 | 100 (cap) |
| Sabotage Ratio | 50%-44% | 40%-33% | 30%-25% | 23%-20% | 20% (cap) |
| Recipe Timer (s) | 7.7-7.9 | 7.3-7.6 | 6.8-7.2 | 5.7-6.7 | 5.0 (cap) |
| Judge Irregularity | 0.05-0.15 | 0.20-0.35 | 0.40-0.60 | 0.65-1.0 | 1.0 (cap) |
| Glance Back | None | None | None | 5%-40% | 40% (cap) |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every dish is completable with only normal ingredients. Sabotage is always optional (but low-scoring). The belt always contains at least 2 normal ingredients visible at any time.
2. **Variety Threshold**: Belt ingredient order is randomized each dish. Judge starting position and initial direction alternate. At least 2 parameters must differ between consecutive stages.
3. **Difficulty Monotonicity**: Judge speed, cone width, and belt speed never decrease between stages. Sabotage ratio never increases.
4. **Rest Stages**: Every 5th dish (5, 10, 15...) is a "Commercial Break" dish where the Judge exits screen for 3 seconds at dish start.
5. **Boss Dishes**: Every 10th dish (10, 20, 30...) features a "Head Chef" Judge with 1.5x speed and a second forward-facing cone. Completing a Boss Dish awards a 500-point flat bonus.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Bright, cartoonish cooking-show aesthetic with bold outlines. Simple flat-color SVG characters and objects. Exaggerated proportions for comedy (huge Judge head, tiny legs). Clean, readable silhouettes.

**Aesthetic Keywords**: Cartoon, Bright, Comedic, Clean, Expressive

**Reference Palette**: Saturday morning cartoon cooking show -- think bright studio lights, stainless steel counters, colorful ingredients. Playful, not realistic.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Station/Counter | Light Steel | #B0C4DE | Cooking station background, slot borders |
| Belt | Dark Gray | #3A3A3A | Conveyor belt background |
| Normal Ingredient | Warm Yellow | #FFD93D | Normal ingredient highlight/border |
| Sabotage Ingredient | Toxic Green | #7FFF00 | Subtle tint on sabotage ingredients |
| Judge Body | Navy Blue | #1B3A5C | Judge character body |
| Judge Vision Cone | Alert Red (30% alpha) | #FF4444 | Vision cone fill (semi-transparent) |
| Background | Cream White | #FFF8E7 | Kitchen studio background |
| HUD Text | Dark Charcoal | #2C2C2C | Score, stage, combo text |
| Danger/Caught | Bright Red | #FF2D2D | Caught flash, timer danger zone |
| Success/Sneak | Electric Green | #00E676 | Successful sabotage flash, combo text |
| Combo Gold | Gold | #FFD700 | Combo counter, high score text |
| Life Icon | Chef White | #FFFFFF | Chef hat life icons |
| Slot Empty | Light Gray | #E0E0E0 | Empty slot background |
| Slot Filled | Pale Green | #C8E6C9 | Filled slot background |

### 4.3 SVG Specifications

All game graphics are rendered as SVG elements generated in code. No external image assets.

**Judge Character** (40x60px):
```svg
<svg width="40" height="60" viewBox="0 0 40 60">
  <!-- Body (navy rectangle with rounded top) -->
  <rect x="8" y="20" width="24" height="35" rx="4" fill="#1B3A5C"/>
  <!-- Head (circle) -->
  <circle cx="20" cy="14" r="12" fill="#FFDAB9"/>
  <!-- Chef hat -->
  <rect x="10" y="0" width="20" height="10" rx="3" fill="#FFFFFF"/>
  <rect x="8" y="8" width="24" height="5" rx="1" fill="#FFFFFF"/>
  <!-- Eyes (direction-aware: flip based on patrol direction) -->
  <circle cx="16" cy="13" r="2" fill="#2C2C2C"/>
  <circle cx="24" cy="13" r="2" fill="#2C2C2C"/>
  <!-- Suspicious eyebrow -->
  <line x1="13" y1="9" x2="19" y2="11" stroke="#2C2C2C" stroke-width="2"/>
  <line x1="21" y1="11" x2="27" y2="9" stroke="#2C2C2C" stroke-width="2"/>
  <!-- Legs -->
  <rect x="12" y="55" width="6" height="5" rx="1" fill="#1B3A5C"/>
  <rect x="22" y="55" width="6" height="5" rx="1" fill="#1B3A5C"/>
</svg>
```

**Vision Cone** (rendered as Phaser triangle polygon):
```
Points: [judgeX, judgeY+30], [judgeX - coneWidth/2, judgeY + coneLength], [judgeX + coneWidth/2, judgeY + coneLength]
Fill: #FF4444, alpha: 0.25
Stroke: #FF4444, alpha: 0.4, width: 1px
Direction: cone always projects downward from Judge toward the cooking station
Rotation: cone pivots based on Judge facing direction (left/right offset by 20px)
```

**Normal Ingredient** (50x50px, example: egg):
```svg
<svg width="50" height="50" viewBox="0 0 50 50">
  <ellipse cx="25" cy="28" rx="16" ry="20" fill="#FFF5E1" stroke="#FFD93D" stroke-width="2"/>
  <ellipse cx="25" cy="25" rx="10" ry="8" fill="#FFD93D" opacity="0.3"/>
</svg>
```

**Sabotage Ingredient** (50x50px, example: rubber duck):
```svg
<svg width="50" height="50" viewBox="0 0 50 50">
  <ellipse cx="25" cy="30" rx="16" ry="16" fill="#FFE44D" stroke="#7FFF00" stroke-width="2"/>
  <circle cx="20" cy="24" r="8" fill="#FFE44D"/>
  <ellipse cx="16" cy="28" rx="6" ry="3" fill="#FF8C00"/>
  <circle cx="22" cy="22" r="2" fill="#2C2C2C"/>
  <!-- Tiny skull marker (subtle) -->
  <circle cx="38" cy="10" r="6" fill="#7FFF00" opacity="0.7"/>
  <text x="35" y="14" font-size="8" fill="#2C2C2C">x</text>
</svg>
```

**Cooking Station Slot** (80x80px):
```svg
<svg width="80" height="80" viewBox="0 0 80 80">
  <rect x="2" y="2" width="76" height="76" rx="8" fill="#E0E0E0" stroke="#B0C4DE" stroke-width="3" stroke-dasharray="8,4"/>
  <!-- "?" placeholder when empty -->
  <text x="40" y="50" text-anchor="middle" font-size="28" fill="#B0C4DE" font-family="Arial">?</text>
</svg>
```

**Conveyor Belt** (full width, 140px height):
```svg
<svg width="360" height="140" viewBox="0 0 360 140">
  <rect x="0" y="10" width="360" height="120" fill="#3A3A3A" rx="6"/>
  <!-- Belt lines (animated via tween) -->
  <line x1="0" y1="40" x2="360" y2="40" stroke="#555" stroke-width="1"/>
  <line x1="0" y1="70" x2="360" y2="70" stroke="#555" stroke-width="1"/>
  <line x1="0" y1="100" x2="360" y2="100" stroke="#555" stroke-width="1"/>
</svg>
```

**Design Constraints**:
- All SVG elements max 12 path/shape elements per object
- Use basic shapes (rect, circle, ellipse, line, polygon) exclusively
- Animations via Phaser tweens, not SVG animate
- All elements must render at 60fps on mid-range mobile (2019+ devices)

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Slot glow pulse | Ingredient dragged near slot | Slot border color tween to #00E676, alpha 0.5->1.0->0.5, 400ms loop |
| Sabotage sparkle | Sabotage ingredient placed undetected | 12 small circles (4px radius) burst radially from slot, color #7FFF00, lifespan 400ms, gravity 80px/s |
| Caught flash | Judge catches sabotage | Screen border flashes #FF2D2D for 200ms, Judge scale punch 1.4x for 150ms |
| Vision cone pulse | Judge changes direction | Cone alpha 0.25->0.5->0.25 over 300ms |
| Dish fire | Recipe timer expires | 8 orange/red particles (#FF4500, #FF6347) rising from station, wobble 3px, lifespan 800ms |
| Dish complete slide | All 4 slots filled | Station slides left off screen (300ms ease-in), new station slides in from right (300ms ease-out) |
| Combo counter pop | Combo increments | Combo text scales 1.0->1.8->1.0 over 200ms, color cycles #FFD700->#FF4444->#FFD700 |
| Belt scroll | Continuous | Belt line pattern offset by belt_speed * delta, seamless tile |
| Judge patrol | Continuous | Judge sprite moves left/right with easeInOut, eyes flip direction on turn |
| Close call text | Sabotage placed <30px from cone | "CLOSE CALL!" text appears at slot, floats up 40px, fades over 500ms, color #FFD700 |

---

## 5. Audio Design

### 5.1 Sound Effects

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Ingredient pickup | Soft pop/pluck | 80ms | Medium |
| Normal ingredient placed | Gentle thud | 100ms | Medium |
| Sabotage placed (undetected) | Sneaky slide + quiet evil chuckle | 250ms | High |
| Caught by Judge | Harsh buzzer + whistle blow | 350ms | High |
| Dish complete | Ding-ding bell + sizzle | 400ms | High |
| Full Sabotage dish | Evil laugh + explosion | 600ms | High |
| Close call | Quick gasp | 150ms | Medium |
| Recipe timer warning (<3s) | Ticking clock, accelerating | Loops until timer reset or expire | Medium |
| Dish burns (timer expire) | Fire whoosh + sad trombone | 500ms | High |
| Game over | Descending brass sting | 800ms | High |
| Combo increment | Ascending chime, pitch +10% per combo level | 150ms | Medium |
| New high score | Triumphant fanfare | 1200ms | High |
| UI button tap | Crisp click | 60ms | Low |
| Commercial break start | TV static burst | 200ms | Medium |

### 5.2 Music Concept

**Background Music**: Upbeat jazzy kitchen music. Light percussion and bass groove. Tempo increases subtly with stage progression. No lyrics. Loop-friendly 16-bar phrase.

**Music State Machine**:

| Game State | Music Behavior |
|-----------|---------------|
| Menu | Calm kitchen ambience, gentle jazz loop at 100 BPM |
| Early Stages (1-5) | Upbeat swing, 110 BPM, light instrumentation |
| Mid Stages (6-15) | Faster tempo 120 BPM, added percussion layers |
| Late Stages (16+) | Intense 130 BPM, driving bass, tension strings |
| Caught (momentary) | Music dips volume to 30% for 500ms, dissonant hit |
| Game Over | Music fades out over 1000ms, somber sting |
| Pause | Music volume reduced to 20% |
| Commercial Break | Brief TV jingle (300ms), then resume normal music |

**Audio Implementation**: Web Audio API via Phaser's built-in sound manager. No Howler.js dependency needed.

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Boot    │────>│   Menu   │────>│   Game   │
│  Scene   │     │  Screen  │     │  Screen  │
└──────────┘     └─────┬────┘     └──────────┘
                    |   |                |
               ┌────┘   |           ┌────┴────┐
               |        |           │  Pause  │──>┌─────────┐
          ┌────┴────┐   |           │ Overlay │   │  Help   │
          │  Help   │   |           └────┬────┘   │How 2Play│
          │How 2Play│   |                |        └─────────┘
          └─────────┘   |           ┌────┴────┐
                   ┌────┴────┐     │  Game   │
                   │Settings │     │  Over   │
                   │ Overlay │     │ Screen  │
                   └─────────┘     └────┬────┘
                                        |
                                   ┌────┴────┐
                                   │ Ad/     │
                                   │Continue │
                                   │ Prompt  │
                                   └─────────┘
```

### 6.2 HUD Layout

```
┌─────────────────────────────────┐
│ 🏆1250  Dish#4  x3🔥     🎩🎩🎩│  <- Top bar (50px, always visible)
├─────────────────────────────────┤
│                                 │
│   ┌────┐  ┌────┐               │  <- Cooking Station (150px)
│   │ S1 │  │ S2 │               │     4 slots in 2x2 grid
│   └────┘  └────┘               │
│   ┌────┐  ┌────┐               │
│   │ S3 │  │ S4 │               │
│   └────┘  └────┘               │
│                                 │
├─────────────────────────────────┤
│  👨‍🍳──────>  [vision cone ▼]    │  <- Judge Zone (140px)
├─────────────────────────────────┤
│  [🥚] [☠🧈] [🥛] [🧅] [☠🦆]    │  <- Conveyor Belt (140px)
│  ◄──── scrolling left           │
├─────────────────────────────────┤
│  ████████████░░░░  Recipe Timer │  <- Timer Bar (20px)
└─────────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left (x:10, y:10) | Current score, 24px bold font, #2C2C2C | Every score event |
| Dish Counter | Top-center (x:center, y:10) | "Dish #N", 18px font, #2C2C2C | On dish transition |
| Sneaky Combo | Top-center-right (x:center+60, y:10) | "xN" + fire emoji when active, 20px bold, #FFD700 | On combo change |
| Lives | Top-right (x:right-10, y:10) | Chef hat icons (filled=#FFF, empty=#666), 20x20px each | On life change |
| Recipe Timer | Bottom bar (full width, y:bottom-20) | Horizontal bar, green->yellow->red as time decreases | Every frame |
| Floating Score | At placement slot position | "+N" text, 20px, floats up 60px, fades 600ms | On score event |
| "CAUGHT!" text | Screen center | Large red text, 36px bold, shakes, fades 800ms | On caught event |
| "SNEAK!" text | At slot position | Green text, 24px, scale punch 1.5x, fades 500ms | On undetected sabotage |
| "FULL SABOTAGE!" | Screen center | 40px gold text with particle burst, fades 1200ms | On 4/4 sabotage dish |

### 6.3 Menu Structure

**Main Menu** (MenuScene):
- Game title "SABOTAGE CHEF" (40px bold, #2C2C2C, centered, y:120)
- Animated Judge character patrolling behind title (decorative)
- "PLAY" button (200x60px, fill #00E676, text "PLAY" 28px bold white, centered, y:300)
- "?" Help button (44x44px circle, top-left, #FFD700 fill)
- Settings gear icon (44x44px, top-right)
- High Score display ("BEST: {score}", 18px, #FFD700, y:380)
- Sound toggle (speaker icon, 44x44px, bottom-right)

**Pause Menu** (overlay, #000000 at 60% alpha background):
- "PAUSED" title (32px bold, white, centered)
- Resume button (180x50px, #00E676, "RESUME" 22px bold)
- How to Play "?" button (180x50px, #FFD700, "HOW TO PLAY" 18px)
- Restart button (180x50px, #FF4444, "RESTART" 22px bold)
- Quit to Menu button (180x50px, #888, "MENU" 22px)
- Buttons stacked vertically, 15px gap

**Game Over Screen** (overlay, #000000 at 70% alpha):
- "GAME OVER" title (36px bold, #FF2D2D, centered, y:80)
- Final Score (48px bold, #FFD700, centered, y:140, scale punch animation)
- "NEW RECORD!" (24px, #FFD700, y:180, only if new high score, with confetti)
- Dishes Completed ("Dishes: {N}", 20px, white, y:210)
- Best Combo ("Best Combo: x{N}", 20px, #00E676, y:240)
- Sabotages Landed ("{N} sneaky!", 20px, #7FFF00, y:270)
- "Continue?" button (200x50px, #FFD700, "WATCH AD TO CONTINUE" 16px, y:320, once per game)
- "PLAY AGAIN" button (200x50px, #00E676, 22px bold, y:390)
- "MENU" button (120x40px, #888, 18px, y:450)

**Help / How to Play Screen** (HelpScene, full overlay):
- Title: "HOW TO PLAY" (28px bold, centered)
- Visual diagram 1: SVG showing drag gesture from belt to slot with arrow
- Caption: "Drag ingredients from the belt to the cooking station" (16px)
- Visual diagram 2: SVG showing Judge with vision cone, sabotage ingredient with green border and skull icon
- Caption: "Sneak SABOTAGE ingredients (green border, skull icon) past the Judge for BONUS POINTS!" (16px)
- Visual diagram 3: SVG showing the vision cone overlapping a slot with a red X
- Caption: "Don't drop sabotage when the Judge is watching -- you'll get CAUGHT!" (16px)
- Tips box (rounded rect, #FFF8E7 fill):
  - "Build Sneaky Combos for huge multipliers!"
  - "Fill ALL 4 slots with sabotage for 5x bonus!"
  - "Place ingredients quickly -- the timer is ticking!"
- "GOT IT!" button (200x50px, #00E676, 22px bold, bottom-center)
- Scrollable if content exceeds viewport height

**Settings Screen** (overlay):
- Sound Effects: On/Off toggle (default On)
- Music: On/Off toggle (default On)
- Vibration: On/Off toggle (default On)

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after death (all lives lost) | Every game over | Always (optional) |
| Rewarded | Double final score | Game over screen button | Always (optional) |
| Banner | Menu screen only | Always visible on menu | N/A |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Life (Continue) | Watch rewarded ad after game over | Resume with 1 life, keep score | Once per game |
| Score Doubler | Watch rewarded ad at game over | 2x final score for high score | Once per session |

### 7.3 Session Economy

Average session: 4-10 dishes across 45-90 seconds of play. Player typically dies 3 times in this window. Session flow optimized for fast retry loop -- game over to new game in under 2 seconds encourages "one more try" without ad fatigue.

**Session Flow with Monetization**:
```
[Play Free] --> [Death 1] --> [Continue playing with 2 lives]
                                    |
                              [Death 2] --> [Continue with 1 life]
                                    |
                              [Death 3 -- Game Over]
                                    |
                              [Rewarded Ad: Continue with 1 life?]
                                    | Yes --> [Resume play]
                                    | No  --> [Game Over Screen]
                                                    |
                                              [Interstitial Ad (every 3rd game over)]
                                                    |
                                              [Rewarded Ad: Double Score?]
                                                    | Yes --> [Score doubled, show result]
                                                    | No  --> [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/sabotage-chef/
├── index.html              # Entry point (20 lines)
│   ├── CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
│   ├── Local CSS           # css/style.css
│   └── Local JS (ordered)  # config -> game -> stages -> ui -> help -> ads -> main (LAST)
├── css/
│   └── style.css           # Responsive styles, mobile-first
└── js/
    ├── config.js           # Constants, colors, difficulty tables, SVG strings
    ├── game.js             # GameScene: core gameplay, Judge AI, drag-drop, scoring
    ├── stages.js           # Stage generation, difficulty parameter calculation
    ├── ui.js               # MenuScene, GameOverScene, HUD overlay, pause
    ├── help.js             # HelpScene: illustrated how-to-play
    ├── ads.js              # Ad integration hooks, reward callbacks
    └── main.js             # BootScene, Phaser init, scene registration (loads LAST)
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `COLORS` object: all hex color constants from Section 4.2
- `SCORING` object: point values, combo multipliers, bonus thresholds
- `DIFFICULTY` object: base values and per-stage scaling formulas for judge_speed, cone_width, belt_speed, sabotage_ratio, recipe_timer, irregularity, glance_back_chance
- `DIMENSIONS` object: slot size (80px), ingredient size (50px), judge size (40x60px), belt height (140px), station y-range, judge patrol y, cone base angles
- `SVG_STRINGS` object: all SVG markup strings for judge, ingredients (6 normal types, 6 sabotage types), slots, belt
- `INGREDIENT_TYPES` array: [{name, svg_key, is_sabotage}] for all ingredient varieties
- `JUDGE_PATROL` object: base speed, direction change interval, pause duration range

**game.js** (max 300 lines):
- `GameScene` extending Phaser.Scene
- `create()`: Initialize cooking station (4 slot sprites), conveyor belt, Judge character + vision cone, ingredient spawner, recipe timer, input handlers
- `update()`: Judge patrol movement (with irregularity), belt scrolling, ingredient spawning, recipe timer countdown, vision cone position update, collision check (cone vs slot on sabotage drop)
- `handleDragStart(pointer, ingredient)`: Lift ingredient from belt, attach to pointer
- `handleDrag(pointer, ingredient, dragX, dragY)`: Move ingredient with finger
- `handleDragEnd(pointer, ingredient)`: Check if over a slot -> check if sabotage -> check if Judge cone overlaps slot -> award/penalize
- `checkJudgeVision(slotX, slotY)`: Returns true if Judge vision cone polygon contains the slot center point
- `awardSabotage(slot, ingredient)`: Score + combo + particles + sound
- `catchSabotage(slot, ingredient)`: Lose life + flash + Judge reaction + combo reset
- `completeDish()`: Check sabotage count, award dish bonus, transition to next stage
- `handleInactivityDeath()`: Fire animation, lose life, advance dish
- Game state: `{score, lives, stage, combo, slots_filled, sabotage_count, recipe_timer, is_dragging, game_over}`

**stages.js** (max 300 lines):
- `generateStageParams(stageNumber)`: Returns object with all difficulty parameters for the given stage
- `generateBeltIngredients(stageParams)`: Returns array of ingredient objects for the belt, randomized with correct sabotage ratio
- `getJudgePatrolPattern(stageParams)`: Returns patrol config (speed, direction changes, pauses, irregularity factor)
- `isRestStage(stageNumber)`: Returns true for every 5th stage (Commercial Break)
- `isBossStage(stageNumber)`: Returns true for every 10th stage (Head Chef)
- `getBossModifiers(stageParams)`: Returns modified params for boss stages (1.5x speed, dual cone)
- Ingredient pool management: ensure minimum normal ingredients always available

**ui.js** (max 300 lines):
- `MenuScene`: Title, Play button, high score display, settings icon, help icon, decorative Judge animation
- `GameOverScene`: Score display with animation, stats (dishes, combos, sabotages), action buttons (continue ad, play again, menu), new high score detection + confetti
- HUD overlay (run as parallel scene during GameScene): Score text, dish counter, combo display, lives (chef hats), recipe timer bar
- Pause overlay: Semi-transparent background, resume/restart/help/menu buttons
- Settings overlay: Sound/music/vibration toggles with localStorage persistence
- `updateScore(newScore)`: Animate score text with punch effect
- `updateLives(livesCount)`: Update chef hat icons
- `updateCombo(comboCount)`: Show/hide combo display with scale animation
- `updateTimer(timeRemaining, maxTime)`: Update timer bar width and color

**help.js** (max 300 lines):
- `HelpScene`: Full-screen illustrated how-to-play
- 3 visual instruction panels with SVG diagrams and captions
- Tips section in styled box
- "GOT IT!" dismiss button
- Scroll support for small screens
- Reuses game SVG assets from config.js for consistency

**ads.js** (max 300 lines):
- `AdManager` class (placeholder hooks):
  - `showInterstitial(callback)`: Triggers interstitial ad, calls callback on close
  - `showRewarded(type, callback)`: Triggers rewarded ad (continue/doubleScore), calls callback with reward
  - `showBanner()` / `hideBanner()`: Menu screen banner control
  - `shouldShowInterstitial()`: Checks game-over count against frequency (every 3rd)
  - `canContinue()`: Returns true if player hasn't used continue this game
  - `canDoubleScore()`: Returns true if not used this session
- Tracking: `gamesPlayedThisSession`, `continueUsed`, `doubleScoreUsed`

**main.js** (max 300 lines, loads LAST):
- `BootScene`: Register all SVG textures from `SVG_STRINGS` via `textures.addBase64(key, btoa(svg))`
- Listen for all `addtexture` events before starting MenuScene
- `Phaser.Game` config: type AUTO, width 360, height 640 (scale mode FIT, autoCenter CENTER_BOTH)
- Scene array: [BootScene, MenuScene, GameScene, HelpScene, GameOverScene]
- `GameState` global: {highScore, gamesPlayed, settings} loaded from localStorage on boot
- Orientation change handler: resize game to fit viewport
- Visibility change handler: pause game when tab hidden

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

---

## 9. Juice Specification

### 9.1 Player Input Feedback (applied to every ingredient drag)

| Effect | Target | Values |
|--------|--------|--------|
| Scale bounce on pickup | Dragged ingredient | Scale: 1.0->1.2x on pickup, 80ms tween |
| Shadow on drag | Dragged ingredient | Drop shadow: 4px offset, #00000033, appears during drag |
| Slot highlight on hover | Target slot | Border color tween #E0E0E0->#00E676, 200ms, pulses at 2Hz while hovering |
| Haptic feedback | Device | 10ms vibration on pickup, 20ms on valid drop |
| Sound | -- | Pickup: soft pop (80ms). Drop: thud (100ms). Invalid drop: quiet buzz (60ms) |

### 9.2 Core Action: Sabotage Placement (most satisfying moment)

| Effect | Values |
|--------|--------|
| Particles | Count: 12, Direction: radial burst from slot center, Color: #7FFF00, Size: 4px circles, Lifespan: 400ms, Speed: 80-160px/s random |
| Scale punch on slot | Slot scale: 1.0->1.3->1.0, Duration: 150ms, Ease: back.out |
| Screen shake | Intensity: 3px, Duration: 100ms, Direction: random XY |
| "SNEAK!" floating text | Text: "SNEAK!", Size: 24px bold, Color: #00E676, Position: slot center, Movement: up 50px over 500ms, Fade: alpha 1->0 over 500ms |
| Combo escalation | Each consecutive combo: particle count +3 (cap 30), shake intensity +1px (cap 8px), "SNEAK!" text size +4px (cap 40px) |
| Camera zoom | Scale: 1.0->1.03, Recovery: 200ms ease-out |
| Sound | Sneaky slide + chuckle (250ms), pitch +8% per combo level |

### 9.3 Caught by Judge (punishment must feel dramatic)

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 10px, Duration: 300ms, Direction: horizontal |
| Screen border flash | Color: #FF2D2D, Width: 8px border, Duration: 200ms on, 100ms off, 2 cycles |
| Judge reaction | Judge scale: 1.0->1.4->1.0, Duration: 200ms. Eyes widen (pupil radius 2->4px for 300ms). Exclamation "!" appears above head, floats up 20px, fades 500ms |
| Ingredient rejection | Sabotage ingredient flies back to belt: tween 300ms with arc (quadratic bezier, peak 40px above), rotation 720deg |
| "CAUGHT!" text | Size: 36px bold, Color: #FF2D2D, Position: screen center, Shake: 3px random offset for 400ms, Fade: over 800ms |
| Hit-stop | 40ms physics pause (freeze Judge + belt), then resume |
| Combo reset text | If combo was >0: "x{N} COMBO LOST!" in #FF4444, 20px, fades 600ms |
| Sound | Harsh buzzer + whistle (350ms) |
| Death -> UI delay | 400ms from caught to life icon removal animation (chef hat cracks + falls) |

### 9.4 Death Effects (inactivity timer expire / final life lost)

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 12px, Duration: 400ms |
| Dish fire (timer death) | 8 particles: colors [#FF4500, #FF6347, #FFD700], size 6-10px, rise speed 60px/s, wobble 4px, lifespan 800ms |
| Desaturation | Game area desaturates to 40% over 300ms |
| Sound | Timer death: fire whoosh + sad trombone (500ms). Final death: descending brass (800ms) |
| Death -> Game Over delay | 600ms from final death effect to Game Over overlay appearing |
| Death -> restart | **Under 1.8 seconds** (600ms death anim + tap "Play Again" = instant) |

### 9.5 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text (normal) | "+10", Color: #2C2C2C, Size: 18px, Movement: up 60px, Fade: 600ms |
| Floating text (sabotage) | "+{N}", Color: #00E676, Size: 22px + 2px per combo, Movement: up 70px, Fade: 700ms |
| Floating text (dish complete) | "+{N} DISH BONUS!", Color: #FFD700, Size: 26px, Movement: up 80px, Fade: 900ms |
| Score HUD punch | Scale 1.0->1.3->1.0, Duration: 150ms, Ease: back.out |
| Combo counter | Scale 1.0->1.8->1.0, Duration: 200ms, Color flash: #FFD700->#FF4444->#FFD700 cycle |
| Full Sabotage dish | Screen flash #7FFF00 at 20% alpha for 150ms, 30 particles radial burst from station center, "FULL SABOTAGE!" 40px gold text with 2px text stroke #2C2C2C, floats up 100px, fades 1200ms |

### 9.6 Stage Transition Effects

| Effect | Values |
|--------|--------|
| Dish complete slide-out | Current station tweens x: center -> -400px, Duration: 300ms, Ease: cubic.in |
| New dish slide-in | New station tweens x: 400px -> center, Duration: 300ms, Ease: cubic.out, 100ms delay after slide-out |
| "Dish #{N}!" text | Size: 28px bold, Color: #2C2C2C, Appears center, scale 0->1 over 200ms, holds 400ms, fades 300ms |
| Commercial Break | "COMMERCIAL BREAK!" text in #FFD700, 32px, TV static effect (random pixel noise overlay for 200ms), Judge walks off screen right (300ms tween) |
| Boss Dish | "HEAD CHEF!" text in #FF2D2D, 36px bold, screen border pulses red 3 times over 600ms, Judge replaced with larger sprite (1.3x scale) |

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

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Use Phaser's input system with `pointer` events. Drag via `this.input.setDraggable(ingredient)` + drag event listeners.
- **Prevent Default**: Prevent pull-to-refresh via CSS `touch-action: none` on game container, and `overscroll-behavior: none` on body.
- **Orientation**: Lock to portrait mode via CSS. On landscape detection, show "Please rotate your device" overlay using `visibility:hidden; height:0; overflow:hidden` pattern (NEVER `display:none` on Phaser canvas).
- **Safe Areas**: Account for notch/cutout with `env(safe-area-inset-top)` CSS padding.
- **Throttling**: Listen for `visibilitychange` event, pause GameScene when tab is hidden.
- **Asset Loading**: All assets are inline SVG strings converted to base64 textures in BootScene. Zero network requests for assets.

### 10.3 Touch Controls

- **Touch Target Size**: All interactive elements minimum 44x44px (ingredients 50x50px, buttons 120x50px+).
- **Drag Mechanics**: On pointerdown over belt ingredient -> attach to pointer. On pointermove -> update ingredient position. On pointerup -> check if over valid empty slot (within 40px of slot center). If valid -> place. If not -> return ingredient to belt with 200ms tween.
- **Drag Feedback**: Ingredient scales to 1.2x during drag. Valid slot highlights green. Invalid position = no highlight.
- **Input Buffering**: If player taps "Play Again" during death animation, buffer the tap and execute on animation complete.
- **Multi-touch Prevention**: Only allow one active drag at a time. Ignore additional pointers during an active drag.

### 10.4 Judge AI Implementation

- **Patrol**: Judge moves left-right between x:30 and x:330. Base speed from stage params. At each edge, pause for 200-600ms (random, scaled by irregularity), then reverse.
- **Irregularity**: At irregularity > 0.3, Judge may randomly pause mid-patrol for 300-800ms. At irregularity > 0.6, Judge may randomly reverse direction before reaching edge.
- **Vision Cone**: Rendered as a Phaser polygon (triangle). Points calculated each frame based on Judge position and facing direction. Cone projects downward and slightly in the facing direction. Collision check uses point-in-polygon test on slot center coordinates.
- **Glance Back** (stage 13+): Every 5 seconds, glance_back_chance% to briefly (400ms) show a second cone facing the opposite direction. Visual cue: Judge head briefly rotates 180deg (150ms tween).
- **Boss Judge** (every 10th stage): Larger sprite (1.3x), 1.5x speed, second permanent forward cone (narrower, 60% width of main cone).

### 10.5 Conveyor Belt Implementation

- **Spawning**: New ingredients spawn off-screen right (x: 400) at intervals of `ingredient_spacing / belt_speed` seconds.
- **Movement**: All belt ingredients move left at `belt_speed` px/s. When an ingredient reaches x: -60 (off-screen left), it is destroyed and a new one spawns on the right.
- **Sabotage Selection**: Each spawned ingredient has `sabotage_ratio` chance of being a sabotage type. At least 1 of every 5 consecutive ingredients must be normal (solvability guarantee).
- **Visual Distinction**: Sabotage ingredients have a subtle #7FFF00 border (2px stroke) and a tiny skull icon (6px circle) in the top-right corner. This is subtle enough to require attention but visible enough to be fair.

### 10.6 Local Storage Schema

```json
{
  "sabotage_chef_high_score": 0,
  "sabotage_chef_games_played": 0,
  "sabotage_chef_highest_dish": 0,
  "sabotage_chef_best_combo": 0,
  "sabotage_chef_total_sabotages": 0,
  "sabotage_chef_settings": {
    "sound": true,
    "music": true,
    "vibration": true
  }
}
```

### 10.7 Known Anti-Patterns to Avoid

1. **NEVER use `display:none` on Phaser canvas** -- use `visibility:hidden; height:0; overflow:hidden` for hiding.
2. **NEVER remove physics bodies inside collision callbacks** -- use `this.time.delayedCall(0, () => ...)`.
3. **NEVER call `addBase64()` outside BootScene** -- register all textures once on boot.
4. **NEVER use `timeScale=0` with `delayedCall()`** -- use `setTimeout()` for time-independent delays.
5. **main.js must load LAST** in index.html script tags.
6. **Initialize HUD text from GameState values**, not string literals like `'0'`.
7. **Guard against duplicate state updates** -- recipe timer should only decrement in `update()`, not also in a separate timer callback.
8. **Stage transition flag** -- set `this.stageTransitioning = true` before dish transition animation, check flag in `update()` to prevent double-advance.
