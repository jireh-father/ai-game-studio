# Game Design Document: Fridge Tetris

**Slug**: `fridge-tetris`
**One-Liner**: You are a leftover container fighting for survival in a fridge that keeps filling up with new groceries.
**Core Mechanic**: Drag-to-rearrange items in a grid to keep your container visible in the front row
**Target Session Length**: 1-3 min
**Date Created**: 2026-03-04
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Fridge Tetris is a grid-based puzzle survival game played from the perspective of a sentient leftover tupperware container. The player occupies a cutaway-view fridge and must strategically rearrange surrounding food items to stay visible in the front row. Every few seconds, a grocery shopping wave deposits new items into the fridge, threatening to push the player deeper into the back — the dreaded "forgotten zone" where food goes to die.

The game blends tactile drag-and-rearrange satisfaction with time-pressure decision-making. Each wave increases in size and complexity, introducing special item interactions (hot items melt frozen ones, heavy items crush fragile ones) and unlocking new fridge sections like the freezer and door shelf. The core loop is: survive the wave, reorganize strategically, dread the next bag of groceries.

Victory is defined as lasting long enough to be noticed by the human — eventually getting eaten, which is a triumphant win state. This comedic inversion of a typical "escape" narrative gives the game a unique emotional signature and encourages repeat play.

### 1.2 Target Audience

Casual mobile gamers aged 18-35 who enjoy puzzle games with humor and personality. The game suits short play sessions during commutes, breaks, or waiting contexts. Players should expect an easy entry curve with satisfying depth emerging from item interaction systems. No prior puzzle game mastery required.

### 1.3 Core Fantasy

The player experiences the fantasy of being a clever, resourceful survivor in a chaotic domestic ecosystem. They are small, squishy, and overlooked — but through wit and spatial reasoning, they outwit the entropy of grocery day. The satisfaction comes from finding the perfect rearrangement: squeezing the player container into a prime front-row slot just before the new wave drops.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 2-4 minutes |
| Day 1 Retention | 42%+ |
| Day 7 Retention | 22%+ |
| Average Waves Survived per Session | 6-10 |
| Crash Rate | <1% |
| Ad Completion Rate (Rewarded) | 70%+ |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Wave Announced] → [Player Drags/Rearranges Items] → [Wave Drops New Groceries]
        ↑                                                         │
        │                                              [Check: Player in Front Row?]
        │                                              │ Yes → Score Points, Next Wave
        │                                              │ No  → Smell Meter Rises
        │                                              │ Back Row 3+ turns → GAME OVER
        └──────────────────────── [Survive] ←──────────────────────────────────────────┘
```

**Moment-to-moment play**: The player sees the fridge grid and a countdown timer (3000ms between waves, shrinking by 100ms each stage). They drag food items around the grid to position themselves in the front row (column 0). Items have physical properties — heavy items resist being dragged to the top, slippery items drift, hot items affect adjacent frozen ones. Each successful wave survival scores points based on speed and front-row position.

**Key decisions**: Do I push the milk aside (risking a domino effect) or rotate items to find an alternate path? Do I sacrifice an expiring item's slot to buy time? Do I burn my Power-Up now or wait?

**Feedback loop**: Every drag gives a satisfying squish/slide sound. Front-row placement triggers a green glow pulse on the player container. Back-row placement triggers a red danger pulse and rising "Smell Meter" indicator.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Move Item | Drag (press and hold, then drag) | Pick up any food item and drag it to an adjacent empty slot. Items cannot occupy the same cell. |
| Swap Items | Drag onto occupied cell | If dragged onto an occupied cell, items swap positions in 200ms animation. |
| Inspect Item | Tap (no drag) | Shows item name, expiry state, and special properties tooltip for 1500ms. |
| Use Power-Up | Tap power-up icon (bottom bar) | Activates the current stored power-up (Fridge Shuffle, Time Freeze, Smell Blocker). |
| Dismiss Tooltip | Tap anywhere | Hides any open tooltip immediately. |

**Control Philosophy**: All gameplay is single-finger touch. Drag-to-rearrange maps intuitively to the physical act of moving items around a fridge. Swapping (drag-onto-occupied) is discoverable through accidental usage, creating a "eureka" moment. No buttons or joysticks — the game world IS the control surface.

**Touch Area Map**:
```
┌─────────────────────────────────┐
│ [Score]    [Stage]    [Smell⚗] │  ← Top HUD bar (48px height)
├─────────────────────────────────┤
│                                 │
│   ┌─────┬─────┬─────┬─────┐    │
│   │Front│ Col │ Col │Back │    │
│   │ Row │  1  │  2  │ Row │    │
│   │  0  │     │     │  3  │    │
│   ├─────┼─────┼─────┼─────┤    │
│   │     │     │     │     │    │
│   │  Fridge Grid (drag zone)   │
│   │     │     │     │     │    │
│   ├─────┼─────┼─────┼─────┤    │
│   │     │     │     │     │    │
│   └─────┴─────┴─────┴─────┘    │
│                                 │
├─────────────────────────────────┤
│ [PowerUp]  [Timer]  [Lives♥♥♥] │  ← Bottom action bar (56px height)
└─────────────────────────────────┘
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Survive Wave (front row) | 100 | x2 if player in column 0 with no adjacent occupied cells |
| Survive Wave (column 1) | 50 | x1.5 if survived within first 1000ms of timer |
| Survive Wave (column 2) | 20 | No multiplier |
| Item Expiry Cleared | 30 | x2 if 3+ expiring items cleared in one wave |
| Smell Meter Defused | 75 | Activated when Smell Meter drops from >75% to <25% in one wave |
| Speed Bonus | +10 per 500ms remaining | Timer remaining at wave completion |
| Interaction Trigger | 15 | Successfully triggering a hot→melt or heavy→crush interaction to clear a path |
| Combo Chain | Base x combo_count | Each consecutive wave survived from front row; resets if player drops to column 2+ |

**Combo System**: Front-row consecutive survival builds a combo multiplier (1x, 1.5x, 2x, 2.5x, 3x cap). Combo counter displayed center-screen on each wave completion, fades after 1200ms.

**High Score**: Stored in localStorage as `fridge-tetris_high_score`. Displayed on Game Over screen with a pulsing gold animation if new record achieved.

### 2.4 Progression System

The game uses an infinite wave system with unlockable meta-progression (container skins, fridge upgrades). Each run progresses through wave stages. Persistent currency ("Fridge Points") earned each session unlocks cosmetics and power-up slots.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-5 | Base grid mechanics, basic food items (milk, yogurt, juice), 3s timer | Tutorial zone — learn drag/swap |
| 6-10 | Condiment armies on door shelf, expiry timer on items, Smell Meter introduced | Medium — manage expiry + position |
| 11-15 | Freezer section unlocked (slippery: items slide 1 extra cell), hot items introduced | Hard — physics interactions |
| 16-20 | Heavy items (watermelon, pumpkin) added — crush fragile items below | Hard+ — crush chain management |
| 21-30 | Meal prep wave: 80% fill in one wave, door shelf + main shelf simultaneous | Very Hard — split attention |
| 31-50 | Second fridge appears requiring touch-toggle to switch between fridge views | Expert — parallel survival |
| 51+ | Random mix of all mechanics, wave timer shrinks to 1200ms minimum | Extreme — pure reflex |

**Meta-Progression (Persistent)**:

| Unlock | Cost (Fridge Points) | Effect |
|--------|---------------------|--------|
| Container Skin: Fancy Bento | 500 | Visual only |
| Container Skin: Cracked Lid | 800 | Visual only |
| Container Skin: Royal Tupperware | 1500 | Visual + golden sparkle trail |
| Fridge Theme: Retro Fridge | 600 | Visual reskin of fridge |
| Fridge Theme: Smart Fridge | 1200 | UI readout overlay (item names always visible) |
| Power-Up Slot +1 | 300 | Hold 2 power-ups instead of 1 |
| Power-Up Slot +2 | 800 | Hold 3 power-ups max |
| Daily Challenge Access | 200 (one-time) | Unlock daily seeded challenge mode |

**Daily Challenges**: Fixed-seed 5-wave scenarios with a unique modifier (e.g., "Frozen Friday: all items slippery", "Mega Meal Prep: waves are 50% larger"). Leaderboard position tracked by score. Reset every 24 hours UTC.

### 2.5 Lives and Failure

The player has 3 lives per run. A life is lost when the player container is pushed to column 3 (back row) AND remains there when the next wave drops.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Player in back row (col 3) at wave drop | Lose 1 life, Smell Meter resets, dramatic "PUSHED BACK!" animation plays | Watch ad to restore 1 life (once per run) |
| Player in back row for 3 consecutive wave drops | Immediate game over even with lives remaining (the human gave up looking) | Watch rewarded ad to continue from wave N-3 |
| Lives reach 0 | Game over screen | Watch rewarded ad to resurrect with 1 life |

**Loss State Emotional Impact**: When pushed to the back row, the following sequence plays over 1200ms:
1. Screen dims 40% (rgba overlay, 200ms transition)
2. Player container face shifts to "horrified" SVG expression (eyes wide, mouth O-shape)
3. Dramatic slowdown: items fly into back wall in slow motion (50% timescale over 400ms)
4. Camera shake: 3 pulses of ±8px horizontal offset, 100ms each
5. Faint audio cue: "noooo" voice clip (150ms), followed by fridge hum resuming
6. Red vignette appears around screen edges (persists while in back row)
7. Text overlay: "YOU'VE BEEN PUSHED BACK..." (24px, #FF4444, fade in over 300ms)

When lives reach 0, full Game Over plays with a 2-second "The human forgot about you... forever." text.

---

## 3. Stage Design

### 3.1 Infinite Wave System

Each wave represents one grocery shopping trip. The fridge grid is 4 columns × 5 rows (20 cells). Player container occupies exactly 1 cell at all times. Items placed in the grid have sizes (1×1, 1×2, 2×1, 2×2) affecting spatial puzzles.

**Wave Generation Parameters**:
```
Wave Generation Parameters:
- Wave Number: Determines base difficulty tier (see table below)
- Item Count: base_count + floor(wave / 3), capped at 16 (leaves 4 cells free minimum)
- Item Size Mix: 70% 1×1, 20% 1×2 or 2×1, 10% 2×2 (increases % of large items with wave)
- Timer Duration: max(1200, 3000 - (wave * 100)) ms
- Special Item Chance: 5% base + 2% per wave tier
- Expiry Items: 0 until wave 6, then floor((wave - 5) / 2) items have expiry timers
- Wave Transition: 800ms smooth animation (items slide in from top of fridge)
```

**Inter-Wave Pacing (smooth transitions)**:
- Wave END: Completed items flash green, score tally animates (400ms)
- PRE-WAVE: "GROCERY RUN!" banner slides down from top (300ms), grocery bag shakes
- ITEM DROP: New items cascade in from the top, 80ms stagger between each item drop
- PLAYER DRAG WINDOW: Timer starts only after all items have settled (last item + 200ms delay)
- This sequence creates a 1200-1600ms "breathing moment" between waves — players feel waves as events, not hard cuts.

### 3.2 Difficulty Curve

```
Difficulty
    │
100 │                                          ─────────── (cap at wave 51+)
    │                                    ╱
 80 │                              ╱
    │                        ╱
 60 │                  ╱
    │     ╱──────╱
 40 │   ╱  rest  ╱  (rest dips every 5 waves)
    │  ╱
 20 │╱
    │
  0 └────────────────────────────────────────── Wave
    0    10    20    30    40    50    60+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Wave 1-5 | Wave 6-15 | Wave 16-30 | Wave 31-50 | Wave 51+ |
|-----------|-----------|------------|-------------|-------------|-----------|
| Timer (ms) | 3000 | 2000-2500 | 1600-2000 | 1200-1600 | 1200 |
| Item Count | 3-5 | 6-10 | 10-14 | 14-17 | 16-18 |
| Large Items (%) | 0% | 15% | 25% | 35% | 40% |
| Expiry Items | 0 | 1-2 | 2-4 | 3-5 | 4-6 |
| Smell Meter Rate | Inactive | Slow (+5%/turn) | Medium (+10%/turn) | Fast (+15%/turn) | Max (+20%/turn) |
| New Mechanic | None | Expiry + Condiments | Freezer + Hot items | Heavy items + Crush | Random mix |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every generated wave configuration must have at least 1 valid path to place the player container in column 0. If generation produces a mathematically unsolvable layout, re-seed and regenerate (max 3 attempts, then force a clear column 0).
2. **Variety Threshold**: Consecutive waves must differ by at least 2 item types. Track last 3 wave item type sets and avoid repeats.
3. **Difficulty Monotonicity**: Timer duration never increases between waves. Item count never decreases between waves (local ±1 variation allowed).
4. **Rest Waves**: Every 5th wave is a "Mini Fridge" wave — 30% fewer items, +500ms timer, labeled "Quick Run 🛒" in UI.
5. **Special Waves**: Every 10th wave is a "Bulk Shopping" boss wave — 20% more items than normal tier, new special item debuts, unique BGM sting plays.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Clean cartoon cutaway. Think a cross between a children's picture book and a cozy mobile game. The fridge interior is bright, readable, and welcoming — which makes the stakes feel funny rather than threatening.

**Aesthetic Keywords**: Cozy, Whimsical, Cluttered, Expressive, Domestic

**Reference Palette**: Warm whites and cool blues of a real fridge interior, offset by the vivid colors of food packaging. Characters (food items) have expressive cartoon faces — large eyes, simple mouths.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Fridge Interior | Pale Ice White | #F0F8FF | Fridge background and shelves |
| Fridge Accent | Cool Steel | #B0C4DE | Shelf dividers, fridge walls, door trim |
| Player Container | Warm Amber | #FF8C42 | Tupperware protagonist body |
| Player Accent | Translucent Orange | #FFB27333 | Tupperware lid (semi-transparent) |
| Safe Zone (front row) | Soft Green Glow | #90EE9033 | Background tint on column 0 |
| Danger Zone (back row) | Soft Red Glow | #FF444433 | Background tint on column 3 |
| Smell Meter Fill | Sickly Yellow-Green | #ADFF2F | Smell meter bar fill |
| Smell Meter BG | Muted Gray | #3A3A3A | Smell meter background bar |
| Timer Bar Fill | Vibrant Cyan | #00CED1 | Countdown timer bar |
| Timer Urgent Fill | Hot Red | #FF2020 | Timer bar when <30% remaining |
| Expiry Indicator | Dull Orange | #FF6B35 | Flashing ring around expiring items |
| Score Text | Dark Navy | #1A1A2E | Score and stage numbers |
| UI Background | Warm Cream | #FFF8E7 | Menu and overlay backgrounds |
| UI Accent | Bright Red (ketchup) | #E63946 | Primary action buttons |
| UI Secondary | Mustard Yellow | #F4A261 | Secondary buttons, highlights |
| Food: Dairy | Cream White | #FFFDD0 | Milk, yogurt containers |
| Food: Produce | Bright Green | #52B788 | Vegetables |
| Food: Condiments | Tomato Red | #C1121F | Ketchup, hot sauce |
| Food: Frozen | Icy Blue | #ADE8F4 | Frozen items in freezer |
| Food: Heavy | Earthy Brown | #8B5E3C | Watermelon, pumpkin |

### 4.3 SVG Specifications

All game graphics are rendered as SVG elements generated in JavaScript. No external image assets are used.

**Player Container (Tupperware Protagonist)**:
```svg
<!-- Player Container: 60x60px bounding box -->
<g class="player-container" transform="translate(0,0)">
  <!-- Body: rounded rectangle -->
  <rect x="4" y="10" width="52" height="44" rx="8" ry="8" fill="#FF8C42" stroke="#CC6A1A" stroke-width="2"/>
  <!-- Lid: semi-transparent rounded top -->
  <rect x="2" y="4" width="56" height="14" rx="6" ry="6" fill="#FFB273" fill-opacity="0.6" stroke="#FF8C42" stroke-width="1.5"/>
  <!-- Lid tabs (left and right) -->
  <rect x="0" y="7" width="6" height="8" rx="2" fill="#CC6A1A"/>
  <rect x="54" y="7" width="6" height="8" rx="2" fill="#CC6A1A"/>
  <!-- Left eye (googly) -->
  <circle cx="20" cy="32" r="9" fill="white" stroke="#333" stroke-width="1.5"/>
  <circle cx="22" cy="33" r="4" fill="#1A1A2E"/>
  <circle cx="24" cy="31" r="1.5" fill="white"/>
  <!-- Right eye (googly) -->
  <circle cx="40" cy="32" r="9" fill="white" stroke="#333" stroke-width="1.5"/>
  <circle cx="42" cy="33" r="4" fill="#1A1A2E"/>
  <circle cx="44" cy="31" r="1.5" fill="white"/>
  <!-- Worried mouth (default expression) -->
  <path d="M 23 46 Q 30 42 37 46" stroke="#1A1A2E" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Content visible through lid (food texture lines) -->
  <line x1="14" y1="20" x2="46" y2="20" stroke="#CC6A1A" stroke-width="1" stroke-opacity="0.4"/>
  <line x1="14" y1="24" x2="46" y2="24" stroke="#CC6A1A" stroke-width="1" stroke-opacity="0.3"/>
</g>
```

**Generic 1x1 Food Item (Milk Carton)**:
```svg
<!-- Milk Carton: 60x60px bounding box -->
<g class="item-milk">
  <!-- Carton body -->
  <rect x="8" y="12" width="44" height="44" rx="4" fill="#FFFDD0" stroke="#DDD8B8" stroke-width="2"/>
  <!-- Carton top (pointed) -->
  <polygon points="8,12 30,2 52,12" fill="#F0EAB0" stroke="#DDD8B8" stroke-width="1.5"/>
  <!-- Cow logo circle -->
  <circle cx="30" cy="34" r="12" fill="#EEE" stroke="#CCC" stroke-width="1"/>
  <!-- Simple cow spots -->
  <ellipse cx="26" cy="32" rx="4" ry="5" fill="#555" opacity="0.5"/>
  <ellipse cx="35" cy="35" rx="3" ry="4" fill="#555" opacity="0.5"/>
  <!-- "MILK" label -->
  <text x="30" y="50" text-anchor="middle" font-size="8" fill="#888" font-family="sans-serif">MILK</text>
</g>
```

**Expiring Item Indicator (overlay on any item)**:
```svg
<!-- Expiry Ring: animated, overlaid on item -->
<circle cx="30" cy="30" r="28" fill="none" stroke="#FF6B35" stroke-width="3"
  stroke-dasharray="8 4" opacity="0.85">
  <animateTransform attributeName="transform" type="rotate"
    from="0 30 30" to="360 30 30" dur="2s" repeatCount="indefinite"/>
</circle>
```

**Freezer Frost Overlay (applied to frozen items)**:
```svg
<!-- Frost Texture: overlaid on frozen items -->
<g class="frost-overlay" opacity="0.4">
  <line x1="10" y1="15" x2="50" y2="45" stroke="#ADE8F4" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="15" y1="10" x2="45" y2="50" stroke="#ADE8F4" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="50" y1="15" x2="10" y2="45" stroke="#ADE8F4" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="30" cy="30" r="18" fill="#ADE8F4" fill-opacity="0.15" stroke="none"/>
</g>
```

**Design Constraints**:
- All SVG elements must render at 60fps on mid-range Android (Snapdragon 665 equivalent)
- Maximum 12 path/shape elements per food item SVG
- Player container maximum 16 elements (higher detail as protagonist)
- Use basic shapes (rect, circle, ellipse, line, polygon) over complex paths
- No SVG `<animate>` elements in game objects — use CSS transforms or JS-driven transforms
- Grid cell size: 72px × 72px on 360px wide screens; 80px × 80px on 428px wide screens

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Item drag lift | Drag start | Scale item 1.0→1.1 in 100ms, add drop shadow (filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3))) |
| Item drop snap | Drag release to valid cell | Scale 1.1→0.95→1.0 in 200ms (bounce ease), play squish sound |
| Swap flash | Two items swap | Brief #FFD700 flash on both cells (opacity 0→0.5→0 in 200ms) |
| Front-row safe pulse | Player enters column 0 | Green ring pulse on player: stroke #90EE90, radius 28→40→28, 400ms |
| Back-row danger pulse | Player pushed to column 3 | Red vignette appears (screen edges), camera shake 3x ±8px horizontal |
| Smell meter spike | Meter crosses 75% | Yellow-green shimmer animation on meter bar, pulsing every 800ms |
| Human inspection event | Smell meter reaches 100% | Screen whites out 80% opacity for 600ms, fridge "opens" (scale 1.0→1.05 ease) |
| Wave drop cascade | Items entering fridge | Each item falls from y=-80 to resting position, 80ms stagger, ease-out-bounce |
| Expiry pop | Item expires | Item shudders (±3px horizontal, 4 times, 50ms each), fades to 30% opacity, then disappears |
| Score pop | Points scored | Floating "+N" text at score position, moves up 20px over 600ms, fades out |
| Combo counter | Consecutive front-row survival | Center-screen combo badge: scales 0.5→1.2→1.0 in 300ms |
| Game over screen | All lives lost | Items "melt" downward (y+40px, opacity 0 over 800ms), screen dims, game over text scales in |

---

## 5. Audio Design

### 5.1 Sound Effects

All audio is synthesized via the Web Audio API (no external audio files). No Howler.js dependency — reduces load time for a no-asset game.

| Event | Sound Description | Duration | Priority | Web Audio Implementation |
|-------|------------------|----------|----------|--------------------------|
| Item drag start | Soft rubbery squeak (250Hz sine, slight pitch wobble) | 120ms | High | OscillatorNode: 250→280Hz, exponential decay |
| Item snap/drop | Satisfying thud + brief reverb (110Hz sine + white noise burst) | 180ms | High | Two oscillators: low thud + noise burst |
| Item swap | Whoosh + double click (sine sweep 200→400Hz) | 150ms | Medium | OscillatorNode: 200→400Hz sweep |
| Front-row victory pulse | Bright ascending chime (C5-E5-G5 arpeggio) | 350ms | High | Three OscillatorNodes, 100ms stagger, triangle wave |
| Wave approaching fanfare | Grocery bag rustle + sting (crinkle noise + 440Hz swell) | 600ms | High | White noise filtered at 2000-8000Hz + sine swell |
| Back-row push horror | Dramatic descending tone + "noooo" (bass drop 200→80Hz) | 800ms | High | OscillatorNode: 200→80Hz sweep, extended decay |
| Expiry warning | Ticking clock sound (sharp 800Hz click, 0.5s intervals) | Looped until resolved | Medium | OscillatorNode: 800Hz click, short attack/decay |
| Smell meter spike | Sour bubble pop (400Hz popping burst) | 100ms | Medium | OscillatorNode: 400Hz, very sharp attack |
| Human inspection | Dramatic door creak (sweep noise 100-300Hz) | 1200ms | High | White noise + bandpass filter sweep |
| Power-up activate | Magical shimmer (rising glissando 400-1200Hz) | 400ms | Medium | OscillatorNode: 400→1200Hz, triangle wave |
| Stage rest (every 5th) | Cheerful mini-jingle (C4-E4-G4-C5) | 500ms | Medium | Four OscillatorNodes in sequence |
| Game over | Mournful descending phrase (G4-E4-C4-A3) | 1500ms | High | Four OscillatorNodes, slow decay |
| New high score | Triumphant fanfare (C5-E5-G5-C6) | 2000ms | Medium | OscillatorNodes + vibrato effect |
| UI button press | Subtle click (1000Hz, very short) | 40ms | Low | OscillatorNode: 1000Hz, 5ms attack, 35ms decay |

### 5.2 Music Concept

**Background Music**: Procedurally generated ambient music using Web Audio API. A looping bass drone with randomized melodic fragments that shift intensity based on game state. No static audio file — all generated in real time from a small JS music engine in `game.js`.

**Music State Machine**:
| Game State | Music Behavior |
|-----------|---------------|
| Menu | Calm, slow-tempo kitchen ambience loop (fridge hum + occasional drip) |
| Wave 1-5 | Light, upbeat ukulele-esque plucks (GainNode modulated sine at C/E/G) |
| Wave 6-15 | Faster tempo base, added percussion layer (rhythmic noise bursts) |
| Wave 16-30 | Full intensity: chord stabs + faster bass, tension rises |
| Wave 31+ | Driving, urgent beat — syncopated rhythm, high-pitched lead |
| Danger State (back row) | Music pitch-shifts up 3 semitones instantly (playbackRate * 1.189) |
| Rest Wave | Music softens 50% (GainNode 0.5), slower tempo |
| Game Over | Music fades out over 1200ms (GainNode exponential decay) |
| Pause | Music drops to 20% volume (GainNode 0.2), reverb increases |

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Splash  │────→│   Menu   │────→│   Game   │
│ (800ms)  │     │  Screen  │     │  Screen  │
└──────────┘     └──────────┘     └──────────┘
                      │                │
                 ┌────┴────┐      ┌────┴────┐
                 │Settings │      │  Pause  │
                 │ Overlay │      │ Overlay │
                 └─────────┘      └────┬────┘
                      │                │
                 ┌────┴────┐      ┌────┴────┐
                 │  Daily  │      │  Game   │
                 │Challenge│      │  Over   │
                 └─────────┘      │ Screen  │
                                  └────┬────┘
                                       │
                                  ┌────┴────┐
                                  │ Ad/     │
                                  │Continue │
                                  │ Prompt  │
                                  └─────────┘
```

### 6.2 HUD Layout

```
┌─────────────────────────────────────┐
│ [Score: 12,450] [Wave 7] [Smell:60%]│  ← Top HUD (48px, #1A1A2E bg)
│ [Timer: ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░] │  ← Timer bar (8px height, #00CED1 fill)
├─────────────────────────────────────┤
│  FRONT              BACK            │
│  ┌────┬────┬────┬────┐  ← Fridge   │
│  │ 0  │ 1  │ 2  │ 3  │   Column    │
│  │[ME]│    │    │    │   Labels    │
│  ├────┼────┼────┼────┤             │
│  │    │    │    │    │             │
│  ├────┼────┼────┼────┤             │
│  │    │    │    │    │             │
│  ├────┼────┼────┼────┤             │
│  │    │    │    │    │             │
│  ├────┼────┼────┼────┤             │
│  │    │    │    │    │             │
│  └────┴────┴────┴────┘             │
│  ← Grid is 4×5 cells, 72px each →  │
├─────────────────────────────────────┤
│ [⚡ Power-Up]  [WAVE 7]  [♥ ♥ ♥]  │  ← Bottom bar (56px)
└─────────────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Size | Content | Update Frequency |
|---------|----------|------|---------|-----------------|
| Score | Top-left | 100px wide, 28px font | Current score, animates +N floats | Every score event |
| Wave Number | Top-center | 80px wide, 20px font | "WAVE N" with wave icon | On wave transition |
| Smell Meter | Top-right | 80px wide, 20px bar | Colored fill bar with % label | Every 500ms |
| Timer Bar | Below top HUD | Full width, 8px | Colored progress bar | Every frame (rAF) |
| Power-Up Icon | Bottom-left | 44×44px | Current power-up icon or empty slot | On pickup/use |
| Lives | Bottom-right | 88px wide | 3 heart icons (♥ filled, ♡ empty) | On life change |
| Combo Badge | Center (floating) | 120px wide | "xN COMBO!" fades after 1200ms | On consecutive survival |

### 6.3 Menu Structure

**Main Menu**:
- Fridge Tetris logo (animated: fridge door swings open revealing title, 600ms on load)
- PLAY button (large, 280×64px, #E63946 red, 18px white bold text)
- DAILY CHALLENGE button (240×52px, #F4A261 amber, shows today's modifier name)
- High Score display (gold trophy icon + score number, 16px)
- Settings gear icon (top-right, 44×44px tap target)
- Fridge Points display (top-left, ♦ icon + count)
- SHOP button (bottom-center, opens meta-progression shop overlay)

**Pause Menu** (overlay: semi-transparent #1A1A2E at 70% opacity):
- RESUME (280×56px, #52B788 green)
- RESTART (240×48px, #F4A261 amber)
- SETTINGS (240×48px, #B0C4DE gray)
- QUIT TO MENU (200×44px, outline style, #FFFFFF)

**Game Over Screen**:
- "THE HUMAN FORGOT YOU..." (24px, #F0F8FF, fade in over 600ms)
- Final Score (48px bold, #FFD700 gold, scale-in animation 0.5→1.0 over 400ms)
- "NEW RECORD!" badge if new high score (pulsing gold, 20px)
- Wave Reached stat (18px, #B0C4DE)
- "WATCH AD TO CONTINUE" (280×56px, #52B788, only if 1 continue remains for session)
- "PLAY AGAIN" (280×56px, #E63946)
- "MENU" (200×44px, outline style)
- Fridge Points earned this run (bottom, 16px, ♦ icon)

**Shop Screen** (overlay):
- Container Skins carousel (horizontal scroll, 120×140px per item)
- Fridge Themes grid (2×N grid, 140×100px per item)
- Power-Up Slot upgrades (list view, 280×60px per item)
- Current Fridge Points balance (top-right)
- CLOSE button (top-right X, 44×44px)

**Settings Screen** (overlay):
- Sound Effects: On/Off toggle (#52B788 / #888)
- Music: On/Off toggle
- Vibration: On/Off toggle
- Reset Progress button (destructive, outlined red, confirmation dialog required)

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Interstitial | After rest wave (every 5th) | Every 2 rest waves | After 5 seconds |
| Rewarded | Continue after death | Every game over (optional) | Always (player-initiated) |
| Rewarded | Double Fridge Points at end | Game over screen | Always (player-initiated) |
| Rewarded | Unlock today's Daily Challenge | Once per day | Always (player-initiated) |
| Banner | Menu screen only | Always on menu | N/A (non-intrusive, bottom 60px) |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Life (Continue) | Watch rewarded ad after death | 1 life, resume from same wave | Once per run |
| Double Fridge Points | Watch rewarded ad at game over | 2x Fridge Points for session | Once per session |
| Daily Challenge Access | Watch rewarded ad (or 200 FP unlock) | Access that day's seeded challenge | Resets daily |
| Smell Blocker Power-Up | Watch rewarded ad mid-game (once per 10 waves) | Smell Meter frozen for 3 waves | Every 10 waves |

### 7.3 Session Economy

The game monetizes through ad completion (rewarded + interstitial) and soft currency (Fridge Points) purchases for cosmetics. The session economy is balanced so free players can unlock all gameplay-affecting upgrades (power-up slots) within 10-15 hours of play, while cosmetics remain aspirational.

**Fridge Points Earn Rate**:
- Waves 1-10: +5 FP per wave survived
- Waves 11+: +8 FP per wave survived
- Daily Challenge completion: +50 FP bonus
- Watch "Double FP" ad: 2x multiplier on session total

**Session Flow with Monetization**:
```
[Play Free] → [Death / Lives = 0]
                      │
              [WATCH AD TO CONTINUE?]
                      │ Yes → [Resume, Interstitial ad shown after next death]
                      │ No  → [Game Over Screen]
                                    │
                  [Interstitial Ad (every 3rd game over)]
                                    │
                  [DOUBLE FRIDGE POINTS? Watch ad]
                                    │ Yes → [FP × 2, shown on screen]
                                    │ No  → [Normal FP total shown]
                                    │
                  [Play Again / Menu]
```

**IAP Story (Future)**:
- "No Ads Pack": $2.99 — removes interstitials, keeps rewarded ads as optional
- "Starter Pack": $0.99 — 2000 Fridge Points + 3 exclusive skins
- "Fridge Collector Bundle": $4.99 — All current skins + themes unlocked

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/fridge-tetris/
├── index.html              # Entry point, CDN includes, canvas mount
├── css/
│   └── style.css           # Responsive layout, touch prevention, safe areas
└── js/
    ├── config.js           # Constants, difficulty tables, color palette, SVG templates
    ├── main.js             # Phaser init, scene registration, localStorage, global state
    ├── game.js             # GameScene: grid logic, drag/swap, item interactions, wave management
    ├── stages.js           # Wave generation, difficulty scaling, item spawning, solvability check
    ├── ui.js               # MenuScene, GameOverScene, HUD overlay, Pause, Shop, Settings
    └── ads.js              # Ad hooks, interstitial/rewarded logic, FP doubler, frequency tracking
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `GRID_COLS = 4`, `GRID_ROWS = 5`, `CELL_SIZE = 72` (360px) / `80` (428px)
- `WAVE_TIMER_BASE = 3000`, `WAVE_TIMER_MIN = 1200`, `WAVE_TIMER_DECAY = 100` (ms per wave)
- `DIFFICULTY_TIERS`: array of objects `{ waveMin, waveMax, itemCount, largeItemPct, expiryCount, smellRate }`
- `COLOR`: object with all hex palette constants (see §4.2)
- `SVG_TEMPLATES`: JS functions that return SVG string for each item type (milk, yogurt, condiment, frozen, heavy, vegetable, player)
- `SCORE_VALUES`: `{ waveFront: 100, waveMid: 50, waveBack: 20, expiryClear: 30, smellDefuse: 75, speedBonusPerHalfSec: 10, interactionBonus: 15 }`
- `FRIDGE_POINTS_RATE`: `{ earlyWave: 5, lateWave: 8, dailyBonus: 50 }`
- `META_SHOP_ITEMS`: array of unlock definitions

**main.js** (max 300 lines):
- `Phaser.Game` initialization: width 360 (scales to 428 on larger screens), height 640, renderer AUTO
- Scene registration: `MenuScene`, `GameScene`, `GameOverScene`
- `GlobalState` object: `{ highScore, wavesReached, gamesPlayed, fridgePoints, settings, unlockedSkins, adCooldown }`
- `loadState()` / `saveState()`: reads/writes to localStorage key `fridge-tetris_state`
- `orientationCheck()`: alerts user to rotate if landscape
- `scaleManager`: Phaser ScaleManager set to FIT mode with 360×640 base

**game.js** (max 300 lines):
- `GameScene extends Phaser.Scene`: `create()`, `update()`, `shutdown()`
- `this.grid`: 2D array `[col][row]` of item objects `{ type, size, properties, svgElement, expiry }`
- `createGrid()`: renders 4×5 SVG cells with column labels (FRONT/BACK)
- `spawnPlayer()`: places player container at `grid[0][2]` on scene start
- `handleDragStart(pointer, item)`: lifts item, applies drag shadow
- `handleDragMove(pointer)`: snaps to nearest valid cell (highlight candidate cell)
- `handleDragEnd(pointer)`: attempts place/swap, plays sound, updates grid state
- `processItemInteractions()`: checks hot→melt, heavy→crush adjacency rules after each move
- `checkPlayerPosition()`: returns player column (0-3), triggers danger/safe states
- `smellMeterUpdate(deltaMs)`: increments smell meter by tier rate, triggers human inspection at 100%
- `endWave()`: scores wave, plays animation sequence, calls `stages.generateNextWave()`
- `loseLife()`: decrements lives, triggers back-row push animation, checks game over

**stages.js** (max 300 lines):
- `WaveGenerator` class
- `generateWave(waveNumber)`: returns array of `ItemPlacement { col, row, type, properties }`
- `getDifficultyTier(waveNumber)`: returns config tier object
- `selectItemTypes(tier)`: picks item types based on wave constraints (no 3 same types in a row)
- `validateSolvability(layout)`: BFS from player position, confirms at least 1 path to col 0 exists via swaps
- `applyItemProperties(item, waveNumber)`: attaches `{ isHot, isFrozen, isHeavy, isFragile, expiryTurns }` based on wave tier and item type
- `generateRestWave(waveNumber)`: returns a deliberately easy layout (fewer items, no specials)
- `generateBossWave(waveNumber)`: returns a max-difficulty layout with debut special item
- `animateWaveDrop(items, scene)`: staggers item placement animations (80ms between each item)

**ui.js** (max 300 lines):
- `MenuScene extends Phaser.Scene`: logo animation, play/challenge/shop/settings buttons
- `GameOverScene extends Phaser.Scene`: score display, high score check, ad prompt, FP summary
- `HUD` class: creates/updates Phaser DOM elements for score, wave, smell meter, timer bar, lives, combo
- `PauseOverlay`: modal overlay with resume/restart/settings/quit buttons
- `ShopOverlay`: skin carousel, theme grid, power-up slot upgrades, FP balance
- `SettingsOverlay`: toggles for sound, music, vibration; reset progress
- `ComboDisplay`: floating badge, scale animation, auto-fade after 1200ms

**ads.js** (max 300 lines):
- `AdManager` singleton
- `init()`: initializes ad network SDK (placeholder hook: `window.adNetwork?.init()`)
- `showInterstitial(callback)`: checks frequency (every 3rd game over), shows ad if due, calls `callback` on close
- `showRewardedContinue(onRewarded, onDeclined)`: prompts and plays rewarded ad
- `showRewardedDoublePoints(onRewarded, onDeclined)`: end-of-session FP doubler
- `showRewardedSmellBlocker(onRewarded, onDeclined)`: mid-game power-up reward
- `showBanner(show: boolean)`: shows/hides banner on menu screen
- `trackAdEvent(eventName, params)`: sends analytics event (placeholder)
- `gameOverCount`: session counter for interstitial frequency
- `continueUsedThisRun`: boolean flag

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | 3.60.0 | `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js` | Game engine, scene management, input |

No Howler.js — audio handled entirely by Web Audio API in `game.js` and `config.js`. No PixiJS — Phaser's renderer is sufficient for SVG-based game at this scale.

---

## 9. Implementation Notes

### 9.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable on mid-range Android | Phaser built-in FPS counter (debug mode) |
| Load Time | <2 seconds on 4G | `performance.timing.loadEventEnd - performance.timing.navigationStart` |
| Memory Usage | <80MB | Chrome DevTools Memory panel |
| JS Bundle Size | <120KB total (excl. CDN) | `ls -lh games/fridge-tetris/js/` |
| First Interaction | <1 second after DOMContentLoaded | `PerformanceObserver` FID measurement |

### 9.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Use Phaser's `input.on('pointerdown', ...)` — handles unified touch+mouse events
- **Prevent Default**: `document.addEventListener('touchmove', e => e.preventDefault(), { passive: false })` prevents pull-to-refresh and scroll during drag
- **Orientation**: CSS `@media (orientation: landscape) { body { display: none; } }` + overlay message "Please rotate your phone"
- **Safe Areas**: CSS `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)` on game container
- **Background Throttle**: `document.addEventListener('visibilitychange', () => game.scene.pause/resume)` prevents wasted CPU
- **SVG Performance**: All food SVG elements created once and cached in a DOM pool; repositioned via `transform: translate()` rather than recreated

### 9.3 Touch Controls

- **Touch Target Size**: All interactive elements (buttons, grid cells) minimum 44×44px (Apple HIG compliant)
- **Grid Cell Touch**: 72px cells exceed minimum — full cell area is draggable
- **Drag Threshold**: 8px minimum movement before drag mode activates (prevents accidental drags on taps)
- **Snap Distance**: Item snaps to nearest cell center if pointer is within 40px of center
- **Cancel Zone**: Drag item off-grid (outside fridge bounds) returns item to origin with bounce animation
- **Haptic Feedback**: `navigator.vibrate(20)` on item snap (if vibration enabled in settings)
- **Input Buffer**: Last drag direction stored for 100ms; if new valid move starts within buffer window, previous move completes first

### 9.4 Grid Drag System Implementation

The grid drag system is the core technical challenge. Key implementation details:

```javascript
// Cell coordinate system
function gridToScreen(col, row) {
  const startX = (GAME_WIDTH - GRID_COLS * CELL_SIZE) / 2;
  const startY = 60; // below HUD
  return {
    x: startX + col * CELL_SIZE + CELL_SIZE / 2,
    y: startY + row * CELL_SIZE + CELL_SIZE / 2
  };
}

function screenToGrid(x, y) {
  const startX = (GAME_WIDTH - GRID_COLS * CELL_SIZE) / 2;
  const startY = 60;
  return {
    col: Math.floor((x - startX) / CELL_SIZE),
    row: Math.floor((y - startY) / CELL_SIZE)
  };
}

// Swap logic: O(1) — just swap grid references and update SVG positions
function swapItems(col1, row1, col2, row2) {
  const temp = grid[col1][row1];
  grid[col1][row1] = grid[col2][row2];
  grid[col2][row2] = temp;
  // Animate both items to new positions
  animateMoveToCell(grid[col1][row1].svgElement, col1, row1);
  animateMoveToCell(grid[col2][row2].svgElement, col2, row2);
}
```

### 9.5 Item Interaction Rules

| Interaction | Condition | Effect |
|------------|-----------|--------|
| Hot → Frozen | Hot item placed adjacent to frozen item | Frozen item melts in 2 waves: becomes slippery for 1 wave, then disappears, clearing its cell |
| Heavy → Fragile | Heavy item (2×2 or 2×1) dropped above fragile item | Fragile item "crushed": replaced with crumbs item (1×1, easily moved), score +15 |
| Expiry timeout | Item `expiryTurns` reaches 0 | Item self-destructs (shudder animation), cell cleared. If player container expires: instant life loss |
| Smell Meter 100% | Human inspection | All items in row 0 (front row) are checked. Items with expiry <2 turns get removed by "human hand" (animated arm from top). If player container expiry <2: game over. |
| Slippery slide | Frozen-then-melted items | When moved, item slides 1 additional cell in drag direction unless blocked |

### 9.6 Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome (Android) | 80+ | Primary target — all features supported |
| Safari (iOS) | 14+ | Web Audio context must be resumed on user gesture; use `audioCtx.resume()` on first tap |
| Samsung Internet | 14+ | Vibration API supported; test drag-and-drop thoroughly |
| Firefox (Android) | 90+ | Secondary target; vibration API may require prefix |

### 9.7 Local Storage Schema

```json
{
  "fridge-tetris_state": {
    "highScore": 0,
    "gamesPlayed": 0,
    "highestWave": 0,
    "fridgePoints": 0,
    "totalFridgePoints": 0,
    "unlockedSkins": ["default"],
    "unlockedThemes": ["classic"],
    "activeSkin": "default",
    "activeTheme": "classic",
    "powerUpSlots": 1,
    "dailyChallengeLastPlayed": null,
    "dailyChallengeUnlocked": false,
    "adFreeUntil": null,
    "continueUsedToday": false,
    "settings": {
      "sound": true,
      "music": true,
      "vibration": true
    }
  }
}
```

All state persisted under a single key `fridge-tetris_state` as a JSON object. Max estimated size: ~2KB (well within 5MB localStorage limit).

### 9.8 Wave Timer Implementation

The wave timer is a critical UX element. Implementation:

```javascript
// In game.js update() — called every frame
update(time, delta) {
  if (this.waveActive) {
    this.waveTimeRemaining -= delta; // delta in ms
    const pct = this.waveTimeRemaining / this.waveDuration;

    // Update timer bar width (full-width bar below HUD)
    this.timerBar.width = GAME_WIDTH * pct;
    this.timerBar.fillColor = pct < 0.3 ? COLOR.TIMER_URGENT : COLOR.TIMER_FILL;

    // Pulse timer bar when urgent
    if (pct < 0.3 && !this.urgentPulseActive) {
      this.startUrgentPulse(); // CSS animation on timer bar
    }

    if (this.waveTimeRemaining <= 0) {
      this.endWave();
    }
  }
}
```

Timer bar uses CSS transition for smooth color change: `transition: fill 300ms ease`. The bar itself is a Phaser Graphics object updated every frame for pixel-perfect smoothness.
