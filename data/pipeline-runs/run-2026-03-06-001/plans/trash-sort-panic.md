# Game Design Document: Trash Sort Panic

**Slug**: `trash-sort-panic`
**One-Liner**: Sort garbage into the right bins before your apartment gets condemned
**Core Mechanic**: Drag-to-categorize under time pressure
**Target Session Length**: 3-5 minutes
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Trash Sort Panic is a fast-paced drag-and-sort game where garbage items fall from the top of the screen and the player must drag each item into the correct bin before it hits the floor. Four bins line the bottom of the screen: Recycle (blue), Compost (green), Trash (gray), and Hazardous (orange). Each bin is a chunky cartoon character with a face that chomps happily on correct sorts and spits out wrong ones.

The tension comes from three simultaneous pressure systems: items fall faster each stage, ambiguous "trick items" appear that look like they belong in one bin but actually belong in another, and the bins themselves start moving and swapping positions. Three wrong sorts and the health inspector condemns your apartment -- game over. Items that hit the floor without being sorted also count as wrong sorts. The apartment background visibly degrades as mistakes accumulate, adding visceral stakes to every decision.

The game delivers instant decision-making satisfaction from frame one. There is no warm-up, no tutorial level -- garbage is falling and you sort it or die. The core fantasy is the panicked satisfaction of making split-second correct decisions under mounting chaos.

### 1.2 Target Audience

Casual mobile gamers aged 16-35 who play during commutes, breaks, or idle moments. Players who enjoy quick-reflex sorting/categorization games (e.g., Fruit Ninja meets recycling). Low skill floor (drag items to bins) but high skill ceiling (trick items, moving bins, speed). No gaming experience required.

### 1.3 Core Fantasy

You are the last line of defense between your apartment and total condemnation. Garbage is raining down and only your lightning-fast sorting reflexes can save your home. Every correct sort feels like a small victory; every combo streak feels like you are a trash-sorting god. The mounting chaos of faster items, trick objects, and swapping bins creates the "one more try" addiction of barely-controlled panic.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 3-5 minutes |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 22%+ |
| Average Stages per Session | 5-12 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Items Fall] --> [Drag to Bin] --> [Correct? +Score/Combo] --> [Stage Timer Ends]
     ^                |                                             |
     |          [Wrong? Strike+1]                            [Next Stage]
     |                |                                      (faster/harder)
     |          [3 Strikes?] --> [CONDEMNED - Game Over]            |
     |                                    |                        |
     └────────── [Play Again] <───────────┴────────────────────────┘
```

**Moment-to-moment**: Items appear at random X positions along the top of the screen and fall downward at a constant speed (per stage). The player touches an item, drags it to one of 4 bins at the bottom, and releases. The bin reacts immediately (chomp or spit). A new item spawns shortly after the previous one is sorted or hits the floor. Multiple items can be falling simultaneously in later stages.

**Decision density**: Every item requires a categorization decision. Ambiguous items (e.g., a pizza box -- recycle or compost?) force genuine thought under time pressure. Trick items (e.g., a battery that looks like a AA cell but is labeled "compostable") punish autopilot.

**Stage structure**: Each stage lasts 15 seconds. The player must sort all items that fall during that window. Surviving a stage advances to the next with increased difficulty. Between stages, a 1.5-second "Stage Clear!" celebration plays.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Grab Item | Touch & hold on item | Item attaches to finger, stops falling, follows touch position |
| Sort Item | Drag to bin & release | Item drops into bin. Bin evaluates correctness. |
| Quick Flick | Swipe item toward bin | Item flies toward nearest bin in swipe direction (advanced technique) |

**Control Philosophy**: Drag-to-sort is the most intuitive mobile gesture for categorization. The physical act of "putting trash in a bin" maps directly to the game fantasy. Quick-flick rewards skilled players who can aim without precise placement.

**Touch Area Map**:
```
┌─────────────────────────────┐
│  Score    Stage    Strikes  │  <- HUD (top 50px, non-interactive)
├─────────────────────────────┤
│                             │
│     ITEM FALL ZONE          │  <- Items spawn here (top 15%)
│                             │
│                             │
│     DRAG ZONE               │  <- Main play area (middle 55%)
│     (full screen draggable) │
│                             │
│                             │
├─────────────────────────────┤
│  [RECYCLE] [COMPOST]        │  <- Bin zone (bottom 30%)
│  [TRASH]  [HAZARD]         │     4 bins in 2x2 grid
└─────────────────────────────┘
```

**Bin Layout**: 4 bins arranged in a 2x2 grid at the bottom of the screen. Each bin is approximately 160x100px (fits comfortably in 360px width with 10px gaps). Bins have a 20px overlap tolerance zone -- dropping an item within 20px of a bin's edge counts as a sort into that bin.

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Correct sort | 100 | Base |
| Quick sort (< 1.5s from spawn) | 150 | Speed bonus |
| Combo sort (3+ consecutive correct) | 100 * combo_count | Combo multiplier |
| Perfect stage (0 mistakes) | 500 bonus | End-of-stage bonus |
| Trick item sorted correctly | 200 | Difficulty bonus |
| Ambiguous item sorted correctly | 150 | Knowledge bonus |

**Combo System**: Every consecutive correct sort increments a combo counter. The combo multiplier applies to the base score: `points = base_points * min(combo_count, 10)`. Combo resets on any wrong sort or floor drop. Visual combo counter appears center-screen and grows with each chain. At combo 5+, the background pulses with the bin's color. At combo 10 (max multiplier), the screen border glows gold.

**High Score**: Stored in localStorage as `trash_sort_panic_high_score`. Displayed on menu screen and game over screen. New high score triggers a special celebration animation (confetti particles + "NEW BEST!" text).

### 2.4 Progression System

The game uses an infinite stage system. Each stage lasts 15 seconds. Difficulty increases via multiple axes simultaneously.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-3 | 3 bins only (Recycle, Compost, Trash). Clear items (bottle, banana peel, wrapper). 1 item at a time. | Easy -- learn sorting |
| 4-6 | 4th bin unlocked (Hazardous). Items fall 20% faster. 2 items can fall simultaneously. | Medium -- 4-way decisions |
| 7-10 | Ambiguous items introduced (pizza box, juice carton). Fall speed +40% from base. | Hard -- knowledge test |
| 11-15 | Trick items appear (mislabeled, deceptive visuals). Bins start slowly sliding left/right. | Very Hard -- read carefully |
| 16-25 | Bins swap positions every 8 seconds. 3 simultaneous items. Fall speed +80%. | Expert -- spatial tracking |
| 26-40 | Bins swap every 5 seconds. Random "blackout" moments (bins hide labels for 2s). 4 simultaneous items. | Extreme -- memory + reflexes |
| 41+ | All mechanics active. Speed capped at 2.5x base. Swap frequency capped at 3s. Max 5 simultaneous items. | Survival -- how long can you last? |

### 2.5 Lives and Failure

The game uses a "strike" system instead of lives. The player gets 3 strikes total per run.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Wrong bin sort | +1 strike, bin spits item, apartment degrades | None (strikes are permanent) |
| Item hits floor (not sorted) | +1 strike, splat effect, apartment degrades | None |
| 3 strikes accumulated | CONDEMNED -- game over | Watch ad to remove 1 strike and continue |
| 15s inactivity (no touch input) | Health inspector arrives -- instant game over | None (anti-AFK) |

**Apartment Degradation Visual**:
- 0 strikes: Clean apartment background (light walls, tidy)
- 1 strike: Stain appears on wall, slight mess on floor
- 2 strikes: Cracks in wall, garbage pile visible, cockroach crawls across
- 3 strikes: CONDEMNED stamp slams down, screen shakes violently

**Inactivity Death**: If the player does not touch the screen for 15 seconds during gameplay, a health inspector character slides in from the right side, slaps a "CONDEMNED" notice on the screen, and the game ends immediately. This cannot be recovered via ad continue.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each stage is a 15-second timed round. Items spawn at intervals determined by the current stage number. The stage ends when the timer expires, regardless of how many items were sorted.

**Generation Algorithm**:
```
Stage Generation Parameters:
- stage_number: current stage (1-based)
- fall_speed: 80 + (stage_number * 12) px/sec, capped at 280 px/sec
- spawn_interval: max(800, 2000 - (stage_number * 80)) ms between items
- max_simultaneous: min(5, 1 + floor(stage_number / 4))
- item_pool: expanded at milestone stages (see 2.4)
- bin_count: 3 for stages 1-3, 4 for stages 4+
- bin_movement: none for stages 1-10, slide for 11-15, swap for 16+
- bin_swap_interval: max(3000, 10000 - (stage_number * 200)) ms
- trick_item_chance: min(0.4, max(0, (stage_number - 10) * 0.04))
- ambiguous_item_chance: min(0.3, max(0, (stage_number - 6) * 0.03))
- blackout_chance: stage_number >= 26 ? min(0.15, (stage_number - 25) * 0.015) : 0
```

### 3.2 Difficulty Curve

```
Difficulty
    |
100 |                                          ──────────── (cap at stage 41)
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
    0    5    10    15    20    25    30    41+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-3 | Stage 4-6 | Stage 7-10 | Stage 11-15 | Stage 16-25 | Stage 26-40 | Stage 41+ |
|-----------|-----------|-----------|------------|-------------|-------------|-------------|-----------|
| Fall Speed (px/s) | 92-116 | 128-152 | 164-200 | 212-260 | 272-280 | 280 | 280 |
| Spawn Interval (ms) | 1920-1760 | 1680-1520 | 1440-1200 | 1120-800 | 800 | 800 | 800 |
| Max Simultaneous | 1 | 2 | 2 | 3 | 3-4 | 4-5 | 5 |
| Bin Count | 3 | 4 | 4 | 4 | 4 | 4 | 4 |
| Bins Move? | No | No | No | Slide | Swap | Swap+Blackout | All |
| Trick Items | No | No | No | Yes (16%) | Yes (24-60%) | Yes (40%) | Yes (40%) |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every item has exactly one correct bin. The item pool is curated so each item maps unambiguously to one category (even trick items have a definitive correct answer). Spawn intervals guarantee enough time to drag each item if the player reacts within 1 second.
2. **Variety Threshold**: No two consecutive items may be the same. Each stage's item pool is shuffled, and the same item cannot appear more than twice per stage.
3. **Difficulty Monotonicity**: Fall speed, spawn interval, and mechanic complexity never decrease between stages. Each stage is at least as hard as the previous.
4. **Rest Stages**: Every 5th stage (5, 10, 15, 20...) reduces spawn interval by 30% for that stage only (breather). Visual cue: apartment background briefly cleans up slightly.
5. **Boss/Special Stages**: Every 10th stage (10, 20, 30...) is a "Trash Avalanche" -- items fall 50% faster but are all worth double points. Visual cue: screen border flashes red, dramatic music sting.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Chunky cartoon SVG with bold outlines. Think "sanitation poster art meets mobile game." Characters (bins) have exaggerated expressions. Items are simple, instantly recognizable silhouettes with minimal detail. The apartment background is a flat-color wall with simple furniture outlines.

**Aesthetic Keywords**: Chunky, Expressive, Bold, Gross-Cute, Panic

**Reference Palette**: Saturday morning cartoon meets municipal recycling campaign. Bright, saturated colors with thick black outlines (3px stroke on all game objects).

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Recycle Bin | Blue | #2196F3 | Recycle bin body, recycle-related UI |
| Compost Bin | Green | #4CAF50 | Compost bin body, organic items highlight |
| Trash Bin | Gray | #757575 | Trash bin body, general waste |
| Hazardous Bin | Orange | #FF9800 | Hazardous bin body, warning elements |
| Background (Clean) | Cream | #FFF8E1 | Apartment wall (0 strikes) |
| Background (Dirty) | Dingy Yellow | #E8D5A3 | Apartment wall (1-2 strikes) |
| Background (Condemned) | Dark Brown | #5D4037 | Apartment wall (3 strikes / game over) |
| Floor | Wood Brown | #8D6E63 | Floor area behind bins |
| Danger/Strike | Red | #F44336 | Strike markers, wrong-sort flash, condemned stamp |
| Reward/Combo | Gold | #FFD700 | Combo text, perfect stage, high score |
| UI Text | Dark Gray | #212121 | Score, stage number, labels |
| UI Background | Semi-transparent Black | rgba(0,0,0,0.7) | Menu overlays, pause screen |
| Item Outline | Black | #000000 | 3px stroke on all items and bins |

### 4.3 SVG Specifications

All SVGs use viewBox coordinates. Rendered as Phaser textures via base64-encoded SVG in BootScene.

**Recycle Bin** (representative -- other bins follow same template with color swap):
```svg
<svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg">
  <!-- Body -->
  <rect x="5" y="15" width="70" height="50" rx="8" fill="#2196F3" stroke="#000" stroke-width="3"/>
  <!-- Lid (mouth flap) -->
  <rect x="3" y="10" width="74" height="12" rx="4" fill="#1976D2" stroke="#000" stroke-width="3"/>
  <!-- Eyes -->
  <circle cx="28" cy="35" r="8" fill="white" stroke="#000" stroke-width="2"/>
  <circle cx="52" cy="35" r="8" fill="white" stroke="#000" stroke-width="2"/>
  <circle cx="30" cy="35" r="4" fill="#000"/>
  <circle cx="54" cy="35" r="4" fill="#000"/>
  <!-- Mouth (happy default) -->
  <path d="M 25 50 Q 40 60 55 50" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round"/>
  <!-- Recycling symbol -->
  <text x="40" y="48" text-anchor="middle" font-size="10" fill="white" font-weight="bold">&#9851;</text>
</svg>
```

**Trash Items** (6 base items, expandable):
```svg
<!-- Plastic Bottle (Recycle) -->
<svg viewBox="0 0 30 50" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="0" width="10" height="8" rx="2" fill="#81D4FA" stroke="#000" stroke-width="2"/>
  <rect x="5" y="8" width="20" height="38" rx="6" fill="#29B6F6" stroke="#000" stroke-width="2"/>
  <text x="15" y="32" text-anchor="middle" font-size="8" fill="#0277BD">PET</text>
</svg>

<!-- Banana Peel (Compost) -->
<svg viewBox="0 0 40 35" xmlns="http://www.w3.org/2000/svg">
  <path d="M 5 30 Q 10 5 25 8 Q 35 10 38 25" fill="#FFEB3B" stroke="#000" stroke-width="2"/>
  <path d="M 8 28 Q 12 15 22 12" fill="#F9A825" stroke="none"/>
  <circle cx="12" cy="22" r="2" fill="#795548"/>
</svg>

<!-- Chip Bag (Trash) -->
<svg viewBox="0 0 35 45" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="5" width="29" height="35" rx="3" fill="#E53935" stroke="#000" stroke-width="2"/>
  <polygon points="3,5 17,0 32,5" fill="#C62828" stroke="#000" stroke-width="2"/>
  <rect x="8" y="15" width="19" height="12" rx="2" fill="#FFCDD2"/>
  <text x="17" y="24" text-anchor="middle" font-size="7" fill="#B71C1C">CHIPS</text>
</svg>

<!-- Battery (Hazardous) -->
<svg viewBox="0 0 20 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="0" width="8" height="4" fill="#9E9E9E" stroke="#000" stroke-width="1.5"/>
  <rect x="2" y="4" width="16" height="32" rx="2" fill="#FF9800" stroke="#000" stroke-width="2"/>
  <text x="10" y="18" text-anchor="middle" font-size="10" fill="#000" font-weight="bold">+</text>
  <text x="10" y="30" text-anchor="middle" font-size="10" fill="#000" font-weight="bold">-</text>
</svg>
```

**Trick Items** (appear from stage 11+):
```svg
<!-- Pizza Box (looks like Trash but is Recycle -- cardboard) -->
<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="41" height="41" rx="3" fill="#8D6E63" stroke="#000" stroke-width="2"/>
  <circle cx="23" cy="23" r="14" fill="#FFC107"/>
  <circle cx="17" cy="18" r="3" fill="#D32F2F"/>
  <circle cx="28" cy="26" r="3" fill="#D32F2F"/>
  <!-- Small recycling hint -->
  <text x="40" y="10" text-anchor="end" font-size="6" fill="#4CAF50">&#9851;</text>
</svg>

<!-- "Eco" Wipes (looks Compost but is Trash -- non-biodegradable) -->
<svg viewBox="0 0 35 25" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="31" height="21" rx="4" fill="#A5D6A7" stroke="#000" stroke-width="2"/>
  <text x="17" y="10" text-anchor="middle" font-size="6" fill="#1B5E20">ECO</text>
  <text x="17" y="18" text-anchor="middle" font-size="5" fill="#424242">wipes</text>
</svg>
```

**Apartment Background**: Generated programmatically in game.js. A cream-colored rectangle (#FFF8E1) with simple brown lines for a shelf and window outline. Degradation overlays (stains, cracks, cockroach) are separate sprites toggled by strike count.

**Condemned Stamp**:
```svg
<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="5" width="190" height="70" rx="8" fill="none" stroke="#F44336" stroke-width="6"/>
  <text x="100" y="52" text-anchor="middle" font-size="32" fill="#F44336" font-weight="bold" font-family="Impact, sans-serif" transform="rotate(-8, 100, 40)">CONDEMNED</text>
</svg>
```

**Design Constraints**:
- All SVG elements use basic shapes (rect, circle, path, polygon, text) -- no complex gradients or filters
- Maximum 12 path elements per SVG object
- All items must be visually distinguishable at 30x40px minimum render size
- 3px black stroke on all game objects for readability
- Bins are 80x70px (display size ~160x140px on screen with 2x scale)

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Bin Chomp | Correct sort | Bin lid rotates open 30deg (100ms), snaps shut (50ms). Bin scales 1.2x then 1.0x (150ms). |
| Bin Spit | Wrong sort | Item flies back upward 80px with spin (200ms). Bin shakes side-to-side 4px for 300ms. Angry eyes swap in. |
| Floor Splat | Item hits floor | Item squashes to 1.5x width, 0.3x height (80ms). Brown splash particles (8 particles, radial). |
| Apartment Degrade | Each strike | Camera shake 6px 300ms. Stain/crack sprite fades in over 500ms. |
| Condemned Slam | 3rd strike / game over | Stamp scales from 3.0x to 1.0x with bounce ease (400ms). Screen shake 12px 500ms. Red flash overlay 200ms. |
| Stage Clear | Stage timer ends (survived) | All bins do a happy bounce (jump 15px, 200ms). "+Stage Clear!" text scales in center. Green flash 100ms. |
| Combo Glow | Combo 5+ | Screen border pulses with current bin color, 400ms cycle. Intensity grows with combo count. |
| Item Grab | Touch on item | Item scales to 1.15x (60ms). Shadow appears beneath (offset 4px, 50% opacity). |
| Item Release | Drop on bin | Item shrinks to 0.5x and fades (150ms) as it "enters" bin. |
| Health Inspector | 15s inactivity | Character slides in from right (500ms). Clipboard in hand. Slaps condemned notice. |

---

## 5. Audio Design

### 5.1 Sound Effects

All sounds generated via Web Audio API (no external audio files). Synthesized using oscillators and noise buffers.

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Correct sort | Bright crunch/chomp -- short percussive pop with high-frequency chirp | 150ms | High |
| Wrong sort | Low buzzer -- square wave descending tone (400Hz to 200Hz) | 300ms | High |
| Floor splat | Wet thud -- noise burst with low-pass filter | 200ms | Medium |
| Combo increment | Ascending chime -- pitch increases with combo count (+50 cents per combo) | 100ms | Medium |
| Perfect stage | Quick fanfare -- 3-note ascending arpeggio (C-E-G) | 500ms | High |
| Condemned (game over) | Deep impact slam + descending brass-like tone | 800ms | High |
| Item grab | Soft pop -- very short sine burst at 800Hz | 50ms | Low |
| Stage transition | Whoosh -- filtered noise sweep high-to-low | 300ms | Medium |
| Health inspector | Doorbell ding-dong + stamp sound | 600ms | High |
| New high score | Celebratory jingle -- ascending 5-note arpeggio with shimmer | 1200ms | High |
| UI button press | Subtle click -- impulse at 1000Hz | 40ms | Low |
| Bin swap (stage 16+) | Sliding whoosh -- stereo panned left-to-right | 200ms | Medium |

### 5.2 Music Concept

**Background Music**: No persistent background music (keeps file size minimal and avoids audio fatigue in short sessions). Instead, use a "tension muzak" system:

**Music State Machine**:
| Game State | Audio Behavior |
|-----------|---------------|
| Menu | Ambient hum -- low sine drone at 60Hz with gentle wobble, barely perceptible |
| Stage 1-5 | Silence with SFX only. Clean, focused. |
| Stage 6-10 | Subtle metronome tick at 120 BPM. Tempo sets pace expectation. |
| Stage 11-20 | Metronome speeds to 150 BPM. Add bass pulse on downbeat. |
| Stage 21+ | Metronome at 180 BPM. Bass pulse + hi-hat noise on offbeat. Creates urgency. |
| Combo 5+ | Layer in ascending arpeggio loop that pitches up with combo count |
| Game Over | All audio cuts. 200ms silence. Then condemned slam sound. |
| Pause | All audio muted |

**Audio Implementation**: Web Audio API only (no Howler.js dependency needed -- reduces CDN load). All sounds synthesized in `config.js` as function definitions.

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Boot    │────>│   Menu   │────>│   Game   │
│  Scene   │     │  Screen  │     │  Scene   │
└──────────┘     └─────┬────┘     └──────┬───┘
                   |   |                 |
              ┌────┘   └────┐      ┌─────┴─────┐
              |             |      │   Pause    │──>┌─────────┐
         ┌────┴────┐   ┌────┴──┐   │  Overlay   │   │  Help   │
         │  Help   │   │Settings│   └─────┬─────┘   │  Scene  │
         │  Scene  │   │Overlay │         |         └─────────┘
         └─────────┘   └───────┘   ┌─────┴─────┐
                                   │ Game Over  │
                                   │  Screen    │
                                   └─────┬─────┘
                                         |
                                   ┌─────┴─────┐
                                   │ Ad/Continue│
                                   │  Prompt    │
                                   └────────────┘
```

### 6.2 HUD Layout

```
┌─────────────────────────────────────┐
│ SCORE: 2450   Stage 7    X X .     │  <- Top bar (48px height)
│                                     │     X=strike filled, .=empty
├─────────────────────────────────────┤
│          ┌──────────┐               │
│          │ x5 COMBO!│               │  <- Combo counter (appears on combo 3+)
│          └──────────┘               │
│                                     │
│        [falling items]              │  <- Item fall zone (middle area)
│                                     │
│           ⬇  ⬇  ⬇                 │
│                                     │
├─────────────────────────────────────┤
│  ┌─────────┐   ┌─────────┐        │
│  │ RECYCLE  │   │ COMPOST │        │  <- Bin zone (bottom 200px)
│  │  (blue)  │   │ (green) │        │     2x2 grid layout
│  └─────────┘   └─────────┘        │
│  ┌─────────┐   ┌─────────┐        │
│  │  TRASH   │   │ HAZARD  │        │
│  │  (gray)  │   │(orange) │        │
│  └─────────┘   └─────────┘        │
└─────────────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left (x:10, y:8) | "SCORE: {n}" white text, 20px bold | Every sort event |
| Stage | Top-center (x:center, y:8) | "Stage {n}" white text, 18px | On stage transition |
| Strikes | Top-right (x:right-10, y:8) | 3 X icons (red=used, gray=available) | On strike event |
| Combo | Center (x:center, y:180) | "x{n} COMBO!" gold text, scales with count | On combo event, fades after 1s |
| Stage Timer | Below top bar (x:center, y:52) | Thin progress bar, width decreases over 15s | Every frame |

### 6.3 Menu Structure

**Main Menu (MenuScene)**:
- Game title "TRASH SORT PANIC" (large, 28px, bouncing animation)
- Subtitle: "Sort garbage before you get condemned!" (14px, cream)
- **PLAY** button (large, 200x60px, green #4CAF50, center screen, prominent)
- **"?" Help** button (circular, 44x44px, top-right corner, blue #2196F3)
- **High Score** display (below play button, "Best: {n}", 16px gold)
- **Sound toggle** (speaker icon, 44x44px, bottom-right, toggles all audio)
- Animated bins at bottom doing idle bounce animation

**Pause Overlay** (semi-transparent black background, rgba(0,0,0,0.7)):
- "PAUSED" title (24px, white)
- **Resume** button (180x50px, green)
- **"?" How to Play** button (180x50px, blue)
- **Restart** button (180x50px, orange)
- **Quit to Menu** button (180x50px, gray)

**Game Over Screen (part of UIScene overlay)**:
- "CONDEMNED!" title with red stamp effect (28px, red, slight rotation)
- **Final Score** (large, 36px, white, animated count-up from 0)
- **"NEW BEST!"** indicator (if high score, gold pulsing text)
- **Stage Reached** ("Stage {n}", 18px, white)
- **"Watch Ad to Continue"** button (200x50px, gold, appears only once per run)
- **"Play Again"** button (200x50px, green)
- **"Menu"** button (120x40px, gray, bottom)

**Help / How to Play Scene (HelpScene)**:
- Title: "HOW TO PLAY" (24px, white)
- **Visual diagram 1**: SVG illustration showing a finger dragging a bottle to the blue recycle bin with an arrow path. Caption: "Drag items to the correct bin!"
- **Visual diagram 2**: Four bins in a row with labels and example items beneath each:
  - Recycle (blue): bottles, cans, cardboard
  - Compost (green): food scraps, leaves
  - Trash (gray): wrappers, wipes, mixed waste
  - Hazardous (orange): batteries, chemicals, paint
- **Rules section**:
  - "3 wrong sorts = CONDEMNED (Game Over)"
  - "Items on the floor count as wrong!"
  - "15 seconds of no sorting = Health Inspector!"
- **Tips**:
  - "Watch out for TRICK items that look like they belong in the wrong bin!"
  - "Sort quickly for speed bonus points!"
  - "Bins start MOVING in later stages -- stay alert!"
- **"Got it!"** button (180x50px, green, returns to previous scene)
- Scrollable if content exceeds viewport height
- Uses game's color palette and SVG assets

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after condemned | Every game over (max 1 per run) | Always (optional) |
| Rewarded | Double final score | Game over screen | Always (optional) |

**Note**: This is POC stage -- ad hooks are placeholder functions only. No actual ad SDK integrated.

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra chance | Watch rewarded ad after condemned | Remove 1 strike, continue from current stage | Once per run |
| Score Doubler | Watch rewarded ad at game over | 2x final score (applied to high score check) | Once per session |

### 7.3 Session Economy

The game is designed to be fully playable without ads. Ad prompts are non-intrusive and always optional.

**Session Flow with Monetization**:
```
[Play Free] --> [3 Strikes = Condemned] --> [Rewarded Ad: Continue?]
                                                  | Yes --> [Remove 1 strike, resume]
                                                  | No  --> [Game Over Screen]
                                                                    |
                                              [Interstitial (every 3rd game over)]
                                                                    |
                                              [Rewarded Ad: Double Score?]
                                                  | Yes --> [Score doubled, show result]
                                                  | No  --> [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/trash-sort-panic/
├── index.html              # Entry point
│   ├── CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
│   ├── Local CSS           # style.css
│   └── Local JS (ordered)  # config → stages → ads → effects → ui → game → main (LAST)
├── style.css               # Responsive styles, mobile-first
├── config.js               # Game constants, colors, SVG strings, difficulty tables, item database
├── main.js                 # BootScene, Phaser init, scene registration (LOADS LAST)
├── game.js                 # GameScene: core drag-and-sort mechanics, bin logic, strike system
├── stages.js               # Stage generation, difficulty parameter calculation, item pool management
├── ui.js                   # MenuScene, HelpScene, game over overlay, HUD, pause overlay
└── ads.js                  # Ad placeholder hooks, reward callbacks
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `COLORS` object: all hex codes from palette
- `DIFFICULTY` object: speed tables, spawn intervals, mechanic unlock stages
- `ITEMS` array: item definitions `{ id, name, category, svg, isTrick, isAmbiguous, unlockStage }`
- `SCORING` object: point values, combo rules, multiplier caps
- `SVG_STRINGS` object: all SVG markup for bins, items, UI elements, condemned stamp
- `GAME_CONFIG` object: canvas dimensions (360x640 base), strike limit (3), stage duration (15000ms), inactivity timeout (15000ms)

**main.js** (max 300 lines):
- `BootScene`: Load all SVG textures via `textures.addBase64()` once on startup
- Phaser.Game initialization: `type: Phaser.AUTO`, responsive scaling config
- Scene registration: `[BootScene, MenuScene, GameScene, HelpScene]`
- `GameState` global object: `{ score, stage, strikes, combo, highScore, gamesPlayed, settings }`
- localStorage read/write helpers: `saveState()`, `loadState()`
- Orientation change handler: resize game canvas on viewport change

**game.js** (max 300 lines):
- `GameScene` extending `Phaser.Scene`
- `create()`: Initialize bins, spawn timer, input handlers, stage timer, apartment background
- `update()`: Check inactivity timer, update falling items, check floor collisions
- `spawnItem()`: Select random item from current pool, create draggable sprite at random X
- `onDrop(item, bin)`: Evaluate correctness, trigger chomp/spit animation, update strikes/score/combo
- `onFloorHit(item)`: Item reached bottom without sort -- +1 strike, splat effect
- `advanceStage()`: Increment stage, recalculate difficulty parameters, possibly move/swap bins
- `checkInactivity()`: If no input for 15s, trigger health inspector game over
- Drag-and-drop input: `this.input.on('drag', ...)` with bin overlap detection (20px tolerance)

**stages.js** (max 300 lines):
- `calculateDifficulty(stageNumber)`: Returns `{ fallSpeed, spawnInterval, maxSimultaneous, binMovement, trickChance, ambiguousChance }`
- `getItemPool(stageNumber)`: Returns filtered ITEMS array based on unlock stage and trick/ambiguous chances
- `getBinLayout(stageNumber)`: Returns bin positions (static, sliding, or swapping)
- `isRestStage(stageNumber)`: Returns true for every 5th stage
- `isBossStage(stageNumber)`: Returns true for every 10th stage
- `generateBinSwapSequence(stageNumber)`: Returns array of swap events with timing

**ui.js** (max 300 lines):
- `MenuScene`: Title screen with play button, help button, high score, sound toggle
- `HelpScene`: Illustrated how-to-play with SVG diagrams, rules, tips, "Got it!" button
- `GameOverOverlay`: Death screen with score, stage, continue/play-again/menu buttons
- `PauseOverlay`: Pause menu with resume, help, restart, quit
- `HUD`: Score text, stage text, strike icons, combo counter, stage timer bar
- `createButton(scene, x, y, width, height, text, color, callback)`: Reusable button factory

**ads.js** (max 300 lines):
- `AdManager` object with placeholder methods
- `showInterstitial(callback)`: Placeholder -- calls callback immediately
- `showRewarded(onReward, onSkip)`: Placeholder -- calls onReward immediately (for testing)
- `shouldShowInterstitial()`: Returns true every 3rd game over
- `canContinue()`: Returns true if player hasn't used continue this run
- Track ad frequency state: `gameOverCount`, `continueUsed`

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No Howler.js needed -- audio is synthesized via Web Audio API.

---

## 9. Juice Specification

### 9.1 Player Input Feedback (applied to every touch/grab)

| Effect | Target | Values |
|--------|--------|--------|
| Scale punch | Grabbed item | Scale: 1.15x, Recovery: 60ms, Ease: back.out |
| Shadow | Grabbed item | Offset: 4px down, Color: rgba(0,0,0,0.3), Size: 1.1x item |
| Sound | -- | Soft pop, 800Hz sine, 50ms duration |
| Haptic | Device | navigator.vibrate(15) on grab |

### 9.2 Core Action Feedback: Correct Sort

| Effect | Values |
|--------|--------|
| Particles | Count: 12, Direction: radial burst from bin mouth, Colors: matching bin color + white, Lifespan: 400ms, Size: 4-8px circles |
| Bin chomp | Lid rotates open 30deg (100ms ease-in), snaps shut (50ms ease-out). Bin body scales 1.2x then 1.0x over 150ms |
| Screen shake | Intensity: 3px, Duration: 100ms |
| Item shrink | Scale 1.0x to 0.3x over 120ms, fade alpha to 0 |
| Floating text | "+{points}", Color: bin color, Movement: up 60px, Fade: 600ms, Font: 18px bold |
| Sound | Crunch/chomp, pitched up +50 cents per combo level |
| Combo escalation | Particle count +3 per combo level (max 30). Shake intensity +1px per 3 combos (max 8px). Floating text font +2px per combo (max 32px). |

### 9.3 Core Action Feedback: Wrong Sort

| Effect | Values |
|--------|--------|
| Bin spit | Item flies back upward 80px with 360deg spin over 200ms. Bin shakes horizontally 4px for 300ms. |
| Bin face | Eyes swap to angry (X eyes) for 500ms, then return to normal |
| Screen shake | Intensity: 6px, Duration: 300ms |
| Red flash | Full-screen red overlay at 0.3 alpha, fades over 200ms |
| Strike marker | Strike icon pulses red (scale 1.5x then 1.0x, 200ms) |
| Sound | Low buzzer, 400Hz→200Hz descending square wave, 300ms |
| Haptic | navigator.vibrate(100) |

### 9.4 Death/Failure Effects (Condemned -- 3rd Strike)

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 12px, Duration: 500ms |
| Condemned stamp | Scales from 3.0x to 1.0x with bounce ease (400ms). Rotation: starts at -15deg, settles at -8deg |
| Red flash | Full-screen red overlay at 0.5 alpha, fades over 400ms |
| Background | Apartment instantly switches to condemned color (#5D4037) |
| Sound | Deep slam impact (80Hz + noise burst), 800ms |
| Haptic | navigator.vibrate([100, 50, 200]) |
| Effect → UI delay | 800ms (stamp animation plays, then game over overlay fades in) |
| Death → restart | **Under 2 seconds** (tap "Play Again" → new game in <500ms) |

### 9.5 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{points}", Color: current bin's hex, Movement: up 60px over 600ms, Fade: alpha 1→0 over 600ms |
| Score HUD punch | Scale 1.3x, Recovery: 150ms, Ease: back.out |
| Combo text | "x{n} COMBO!" at screen center, Size: 20px base + 2px per combo level (max 36px), Color: #FFD700, Fade: 1000ms |
| Perfect stage | "PERFECT!" text center screen, 32px, gold, with 20 confetti particles (random colors from palette, lifespan 1200ms, gravity 200px/s) |

### 9.6 Floor Impact (Item Missed)

| Effect | Values |
|--------|--------|
| Item squash | ScaleX: 1.5x, ScaleY: 0.3x over 80ms, then fade out 200ms |
| Splat particles | Count: 8, Direction: radial from impact point, Color: #8D6E63 (brown), Lifespan: 300ms, Size: 3-6px |
| Screen shake | Intensity: 4px, Duration: 150ms |
| Sound | Wet thud -- noise burst with low-pass filter at 500Hz, 200ms |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | Performance.timing API |
| Memory Usage | <80MB | Chrome DevTools Memory panel |
| JS Bundle Size | <200KB total (excl. CDN) | File size check |
| First Interaction | <500ms after load | Time to first meaningful paint |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Use Phaser's input system with `pointer` events. Enable drag on all item sprites via `this.input.setDraggable(item)`.
- **Prevent Default**: Prevent pull-to-refresh via CSS `touch-action: none` on game container and `overscroll-behavior: none` on body.
- **Orientation**: Lock to portrait mode. On landscape detection, show "Please rotate your device" overlay.
- **Safe Areas**: Account for notch/cutout with `env(safe-area-inset-top)` padding.
- **Throttling**: Listen for `visibilitychange` event -- pause game and mute audio when backgrounded.
- **Asset Loading**: All assets are inline SVG strings in config.js. No network requests for game assets. No loading screen needed.
- **Object Pooling**: Reuse item sprites instead of creating/destroying. Maintain pool of 8 item sprites, reset properties on reuse.
- **Particle Pooling**: Reuse particle objects. Max 40 particles at any time.

### 10.3 Touch Controls (Drag System)

- **Touch Target Size**: All items render at minimum 44x44px (Apple HIG). Bins are 160x140px minimum.
- **Drag Detection**: `this.input.on('dragstart', 'drag', 'dragend')` events on each item sprite.
- **Drop Zone Detection**: On `dragend`, check if item center overlaps any bin's bounds (expanded by 20px tolerance on each side). If overlapping multiple bins, use closest center.
- **No Drop Zone**: If item is released outside all bin zones, item resumes falling from release position.
- **Input Buffering**: If player taps a new item while dragging another, the dragged item drops in place and new item is grabbed.
- **Quick Flick**: If drag velocity > 800px/s on release, item continues in drag direction. If it enters a bin zone, auto-sort to that bin.

### 10.4 Edge Cases

| Scenario | Handling |
|----------|----------|
| Resize / orientation change | Recalculate bin positions, item positions proportionally. Pause game briefly. |
| Tab backgrounded | Pause game, mute audio. Resume on foreground with pause overlay. |
| Multiple items overlapping | Items have stacking order based on spawn time. Topmost item is grabbed first. |
| Drag item off screen | Clamp item position to game bounds. |
| Bin swap during drag | If player is dragging when bins swap, the drag continues -- the target bin may have moved. This is intentional difficulty. |
| Very fast stage transitions | Ensure all falling items are cleared (splat or sort) before next stage items spawn. 500ms gap minimum. |
| localStorage unavailable | Gracefully degrade -- high score and settings not persisted, game still fully playable. |

### 10.5 Item Database (for config.js)

Complete item list with categories:

| Item | Category | Unlock Stage | Trick? | Ambiguous? |
|------|----------|-------------|--------|------------|
| Plastic bottle | Recycle | 1 | No | No |
| Banana peel | Compost | 1 | No | No |
| Chip bag | Trash | 1 | No | No |
| Newspaper | Recycle | 1 | No | No |
| Apple core | Compost | 2 | No | No |
| Used napkin | Trash | 2 | No | No |
| Soda can | Recycle | 3 | No | No |
| Egg shells | Compost | 3 | No | No |
| Styrofoam cup | Trash | 3 | No | No |
| Battery | Hazardous | 4 | No | No |
| Paint can | Hazardous | 5 | No | No |
| Light bulb | Hazardous | 6 | No | No |
| Pizza box | Recycle | 7 | No | Yes |
| Juice carton | Recycle | 7 | No | Yes |
| Tea bag | Compost | 8 | No | Yes |
| Coffee cup (paper+plastic) | Trash | 9 | No | Yes |
| Greasy paper towel | Compost | 10 | No | Yes |
| "Eco" wipes | Trash | 11 | Yes | No |
| Broken ceramic mug | Trash | 12 | Yes | No |
| Aerosol can | Hazardous | 13 | Yes | No |
| Glossy magazine | Recycle | 14 | Yes | No |
| Compostable fork (actually plastic) | Trash | 15 | Yes | No |
| Motor oil bottle | Hazardous | 16 | Yes | No |
| Dryer sheets | Trash | 18 | Yes | No |
| "Recyclable" chip bag | Trash | 20 | Yes | No |

### 10.6 Local Storage Schema

```json
{
  "trash_sort_panic_high_score": 0,
  "trash_sort_panic_games_played": 0,
  "trash_sort_panic_highest_stage": 0,
  "trash_sort_panic_settings": {
    "sound": true,
    "vibration": true
  },
  "trash_sort_panic_total_score": 0
}
```

### 10.7 Testing Checkpoints

1. **Boot**: BootScene loads all SVG textures without errors. No "Texture key already in use" warnings.
2. **Menu**: All buttons clickable. Help scene accessible and returns correctly. Sound toggle works.
3. **Gameplay Start**: Items spawn and fall. Drag-and-drop works on first touch. Bins react to drops.
4. **Sorting Logic**: Each item sorts correctly to exactly one bin. Wrong sorts increment strikes. Correct sorts increment score.
5. **Combo System**: Consecutive correct sorts build combo. Wrong sort resets combo. Points multiply correctly.
6. **Strike System**: 3 wrong sorts trigger condemned game over. Visual degradation matches strike count.
7. **Inactivity Death**: 15 seconds of no input triggers health inspector and game over.
8. **Stage Progression**: Stage advances after 15 seconds. Difficulty parameters increase. New items unlock at correct stages.
9. **Bin Movement**: Bins slide starting stage 11. Bins swap starting stage 16. Positions update correctly.
10. **Game Over Flow**: Score displays correctly. "Play Again" restarts in <2 seconds. Menu button returns to menu. High score saves.
11. **Orientation**: Game pauses on landscape. Resumes on portrait. No layout breakage.
12. **Performance**: 60fps with 5 simultaneous items + particle effects on mid-range Android device.
