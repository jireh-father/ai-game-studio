# Game Design Document: Conveyor Crunch

**Slug**: `conveyor-crunch`
**One-Liner**: Swipe items left or right on a conveyor belt into correct bins before they pile up
**Core Mechanic**: Conveyor belt sorting with speed escalation and color confusion
**Target Session Length**: 60-90 seconds
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Conveyor Crunch is a frantic sorting game where colored items scroll across a conveyor belt toward the player. Two bins flank the screen — each labeled with a color. The player must swipe each item left or right to toss it into the matching bin before it reaches the end of the belt and piles up.

The tension comes from two death clocks running simultaneously: miss-sorts (3 wrong = game over) and pile-ups (5 unsorted items = game over). The belt accelerates constantly, and later stages introduce 3-4 colors with deceptively similar shades, rotating items that hide their color until the last moment, and decoy items that must NOT be sorted (swipe up to discard).

The core satisfaction is the flow state of rapid-fire sorting decisions under mounting pressure — the same dopamine loop as assembly line games, but distilled to pure swipe reflexes.

### 1.2 Target Audience

Casual mobile gamers aged 16-45 playing during commutes, waiting rooms, or quick breaks. Low skill floor (swipe left/right), high skill ceiling (shade recognition at speed). Appeals to players who enjoy Fruit Ninja, Tinder-style swipe mechanics, and factory/sorting games.

### 1.3 Core Fantasy

You are the last worker on a chaotic factory line. Everything is speeding up, colors blur together, and one wrong toss means disaster. The fantasy is being the hyper-competent sorter who keeps up when the machine can't be stopped.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 60-90 seconds |
| Day 1 Retention | 40%+ |
| Day 7 Retention | 20%+ |
| Average Stages per Session | 8-15 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Item Appears on Belt] --> [Player Reads Color] --> [Swipe L/R to Bin]
        ^                                                  |
        |                                         [Correct? +Score]
        |                                         [Wrong? +Strike]
        |                                         [Missed? +Pile]
        |                                                  |
        +------ [Next Item / Belt Speeds Up] <-------------+
                          |
                   [3 Strikes OR 5 Pile = GAME OVER]
                          |
                   [Retry / Continue]
```

Moment-to-moment: Items slide in from the right side of the belt. The player has a shrinking window to identify the item's color and swipe it toward the matching bin. Correct sorts score points and build combos. Wrong sorts add a strike (shown as X marks). Unsorted items pile up at the belt's end. The belt never stops.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Sort Left | Swipe Left | Toss the frontmost item into the left bin |
| Sort Right | Swipe Right | Toss the frontmost item into the right bin |
| Discard (Stage 16+) | Swipe Up | Discard a decoy/trap item (no bin match) |

**Control Philosophy**: Binary left/right decisions mirror Tinder-style swipe UX — instantly learnable, zero tutorial needed. Swipe-up for decoys adds a third option in later stages without cluttering early play.

**Touch Area Map**:
```
+---------------------------+
|  [LEFT BIN]   [RIGHT BIN] |  <-- Bin indicators (top corners)
|                           |
|     <--- CONVEYOR --->    |  <-- Items scroll L-to-R
|        [ITEM HERE]        |  <-- Swipe zone (center)
|                           |
|  [PILE AREA]              |  <-- Unsorted items stack here (left end)
|                           |
| [Strikes: X X _] [Score]  |  <-- HUD bottom
+---------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Correct Sort | 100 | Base |
| Speed Bonus | +50 | Sort within 0.5s of item appearing |
| Combo Sort (2+) | 100 x combo | Consecutive correct sorts (max 10x) |
| Perfect Stage | +500 | Zero mistakes in a stage |
| Decoy Discard | 150 | Correctly swiped up a trap item |

**Combo System**: Each consecutive correct sort increments the combo counter (max 10x). Any wrong sort or pile-up resets combo to 0. Combo multiplier applies to the base 100 points. At combo 5+ the score text turns gold; at combo 10 it pulses with particle burst.

**High Score**: Stored in localStorage as `conveyor-crunch_high_score`. Displayed on menu and game over screen. New high score triggers celebration animation.

### 2.4 Progression System

The game uses a continuous stage system where each stage lasts 10 items. Completing a stage briefly flashes "STAGE X CLEAR" and immediately continues with increased difficulty.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-3 | 2 colors (Red, Blue), slow belt | Easy - learn swipe controls |
| 4-6 | Belt speed +30%, items closer together | Medium - build rhythm |
| 7-10 | 3rd color introduced (Green), bins rotate positions | Hard - read bin labels |
| 11-15 | Similar shades (Light Red vs Dark Red), belt speed +60% | Very Hard - color precision |
| 16-20 | Decoy items (gray, swipe up), 4 colors | Expert - three-way decisions |
| 21-30 | Items rotate/flip hiding color until close, speed +100% | Extreme - reaction speed |
| 31+ | All mechanics combined, speed caps at 2.5x | Survival - pure endurance |

### 2.5 Lives and Failure

The game uses a dual-threat system instead of traditional lives:

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Wrong sort (item in wrong bin) | +1 Strike (3 strikes = game over) | Watch ad to remove 1 strike |
| Item reaches belt end unsorted | +1 to pile (5 pile = game over) | Watch ad to clear pile |
| Inactivity for 3 seconds | Auto pile-up of current item + belt continues | None (belt doesn't wait) |

**Inactivity Death**: If player does nothing for 3 seconds, the frontmost item auto-piles. Items continue spawning. Within ~15 seconds of total inactivity, 5 items pile up = game over.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each stage consists of 10 items to sort. Stage parameters are deterministic based on stage number.

**Generation Algorithm**:
```
Stage Generation Parameters:
- Items per stage: 10 (constant)
- Belt speed: BASE_SPEED * (1 + stage * 0.08), capped at 2.5x at stage 31
- Item spawn interval: max(400ms, 1200ms - stage * 30ms)
- Color count: 2 (stages 1-6), 3 (stages 7-15), 4 (stages 16+)
- Similar shades: false (stages 1-10), true (stages 11+)
- Decoy chance: 0% (stages 1-15), 15% (stages 16-20), 25% (stages 21+)
- Rotation chance: 0% (stages 1-20), 30% (stages 21-25), 50% (stages 26+)
- Bin swap: false (stages 1-6), possible every stage transition (stages 7+)
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

| Parameter | Stage 1-3 | Stage 4-6 | Stage 7-15 | Stage 16-20 | Stage 21+ |
|-----------|-----------|-----------|------------|-------------|-----------|
| Belt Speed (px/s) | 60 | 78 | 96-120 | 130-150 | 150 (cap) |
| Spawn Interval (ms) | 1200 | 1080 | 960-780 | 720-660 | 600-400 |
| Colors | 2 | 2 | 3 | 4 | 4 |
| Decoy Chance | 0% | 0% | 0% | 15% | 25% |
| Rotation | No | No | No | No | Yes (30-50%) |
| Shade Confusion | No | No | No | Yes | Yes |
| Bin Swap | No | No | Yes (on stage transition) | Yes | Yes |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every item has exactly one correct bin (or discard for decoys). No ambiguous shades — even "similar" colors differ by at least 40 hue degrees.
2. **Variety Threshold**: Bin colors swap positions every 2-4 stages (randomized). No two consecutive items are the same color.
3. **Difficulty Monotonicity**: Belt speed and spawn rate only increase or stay constant between stages.
4. **Rest Stages**: Every 10th stage (10, 20, 30...) starts with 2 slow items before ramping, giving a brief breather.
5. **Boss/Special Stages**: Every 5th stage features a "RUSH" — 15 items instead of 10, all at current max speed. Clearing it awards 1000 bonus points.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Clean industrial/factory aesthetic with bold flat colors. Geometric shapes for items (circles, squares, triangles). Metallic gray conveyor belt with animated ridges. Bright colored bins with clear labels.

**Aesthetic Keywords**: Industrial, Bold, Clean, Satisfying, Kinetic

**Reference Palette**: Factory floor meets candy sorting — utilitarian layout with punchy, satisfying colors.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Belt | Steel Gray | #5C6370 | Conveyor belt surface |
| Belt Ridge | Dark Gray | #3E4451 | Belt animation ridges |
| Bin Left BG | Dark Slate | #2C3E50 | Left bin container |
| Bin Right BG | Dark Slate | #2C3E50 | Right bin container |
| Item Red | Bright Red | #E74C3C | Red sortable items |
| Item Blue | Bright Blue | #3498DB | Blue sortable items |
| Item Green | Emerald | #2ECC71 | Green sortable items (stage 7+) |
| Item Yellow | Sunflower | #F1C40F | Yellow sortable items (stage 16+) |
| Shade Red | Salmon | #E88E8E | Similar shade variant |
| Shade Blue | Light Blue | #85C1E9 | Similar shade variant |
| Decoy | Ash Gray | #95A5A6 | Trap items (swipe up) |
| Background | Dark Navy | #1A1A2E | Game background |
| UI Text | White | #FFFFFF | Score, labels, menus |
| Danger | Warning Red | #C0392B | Strike markers, pile warning |
| Reward | Gold | #F39C12 | Combo text, perfect stage |
| Success | Bright Green | #27AE60 | Correct sort flash |

### 4.3 SVG Specifications

**Sortable Item (Circle)**:
```svg
<svg viewBox="0 0 50 50">
  <circle cx="25" cy="25" r="22" fill="{ITEM_COLOR}" stroke="#FFF" stroke-width="2"/>
  <circle cx="18" cy="20" r="3" fill="rgba(255,255,255,0.4)"/>
</svg>
```

**Sortable Item (Square — stage 7+)**:
```svg
<svg viewBox="0 0 50 50">
  <rect x="5" y="5" width="40" height="40" rx="6" fill="{ITEM_COLOR}" stroke="#FFF" stroke-width="2"/>
  <rect x="10" y="10" width="12" height="8" rx="2" fill="rgba(255,255,255,0.3)"/>
</svg>
```

**Sortable Item (Triangle — stage 16+)**:
```svg
<svg viewBox="0 0 50 50">
  <polygon points="25,5 47,45 3,45" fill="{ITEM_COLOR}" stroke="#FFF" stroke-width="2"/>
</svg>
```

**Bin**:
```svg
<svg viewBox="0 0 80 100">
  <rect x="5" y="10" width="70" height="85" rx="8" fill="#2C3E50" stroke="{BIN_COLOR}" stroke-width="4"/>
  <rect x="10" y="0" width="60" height="20" rx="4" fill="{BIN_COLOR}"/>
  <text x="40" y="60" text-anchor="middle" fill="{BIN_COLOR}" font-size="30" font-weight="bold">{LABEL}</text>
</svg>
```

**Conveyor Belt Segment**:
```svg
<svg viewBox="0 0 400 60">
  <rect x="0" y="0" width="400" height="60" fill="#5C6370" rx="4"/>
  <line x1="0" y1="15" x2="400" y2="15" stroke="#3E4451" stroke-width="2" stroke-dasharray="20,10"/>
  <line x1="0" y1="45" x2="400" y2="45" stroke="#3E4451" stroke-width="2" stroke-dasharray="20,10"/>
</svg>
```

**Decoy Item (X-marked)**:
```svg
<svg viewBox="0 0 50 50">
  <circle cx="25" cy="25" r="22" fill="#95A5A6" stroke="#FFF" stroke-width="2"/>
  <line x1="15" y1="15" x2="35" y2="35" stroke="#FFF" stroke-width="3"/>
  <line x1="35" y1="15" x2="15" y2="35" stroke="#FFF" stroke-width="3"/>
</svg>
```

**Design Constraints**:
- All SVG elements use basic shapes only (circle, rect, polygon, line)
- Maximum 6 path/shape elements per SVG object
- No complex bezier paths — mobile 60fps guaranteed
- Item size: 50x50px logical, scaled to ~15% of screen width

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Belt scroll | Always | CSS translateX animation on belt ridges, continuous loop |
| Item slide | Item on belt | Phaser tween: x position decreasing at belt speed |
| Sort toss | Correct swipe | Tween: item arcs toward bin (parabolic path, 300ms), scale 1.0->0.6, alpha fade |
| Wrong toss | Wrong swipe | Item turns red, shakes 3x, then fades (200ms) |
| Pile stack | Missed item | Item slides to pile area, stacks vertically with slight random offset |
| Strike flash | Wrong sort | Red vignette flash on screen edges, 150ms |
| Combo glow | Combo 5+ | Score text glows gold, pulsing at 2Hz |
| Stage clear | Every 10 items | "STAGE X CLEAR" text zooms in from center, particles burst, 800ms |

---

## 5. Audio Design

### 5.1 Sound Effects

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Correct sort | Crisp "thunk" of item landing in bin | 150ms | High |
| Wrong sort | Buzzer/error tone | 200ms | High |
| Pile-up | Heavy metallic clang | 250ms | High |
| Combo increment | Ascending chime, pitch +5% per combo level | 100ms | Medium |
| Stage clear | Quick ascending 3-note fanfare | 600ms | High |
| Game over | Conveyor belt grinding halt sound | 800ms | High |
| Decoy discard | Whoosh/air sound | 150ms | Medium |
| Rush stage start | Factory alarm beep x2 | 400ms | High |
| New high score | Celebratory jingle | 1500ms | High |
| Button press | Subtle click | 80ms | Low |

### 5.2 Music Concept

**Background Music**: No background music — the game's tension comes from the mechanical sounds of the conveyor belt (ambient hum + rhythmic ridge clicks). This keeps the audio landscape clean and lets the sort/error sounds punch through clearly. The belt hum subtly increases in pitch as belt speed increases, creating organic audio tension.

**Audio Implementation**: Howler.js via CDN. All sounds generated as short oscillator tones via Web Audio API (no external audio files needed).

---

## 6. UI/UX

### 6.1 Screen Flow

```
+----------+     +----------+     +----------+
|  Menu    |---->|   Game   |---->| Game Over|
|  Screen  |     |  Screen  |     |  Screen  |
+----------+     +----------+     +----------+
     |                |                 |
     v                v                 v
+---------+     +---------+      +---------+
|  Help   |     |  Pause  |      | Continue|
|How2Play |     | Overlay |      |  (Ad)   |
+---------+     +---------+      +---------+
```

### 6.2 HUD Layout

```
+-------------------------------+
| [LEFT BIN]        [RIGHT BIN] |  <-- Top: color-coded bin indicators
|  (color label)   (color label)|
+-------------------------------+
|                               |
|   ===== CONVEYOR BELT =====  |  <-- Center: items scroll here
|   [ITEM]  [ITEM]  [ITEM]     |
|   ===========================|
|                               |
| [PILE: |||| ]                 |  <-- Left bottom: pile meter (5 bars)
+-------------------------------+
| X X _  |  Score: 2450  | S:7 |  <-- Bottom HUD: strikes, score, stage
| Combo: 4x               Best |
+-------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Left Bin | Top-left | Color swatch + label | On bin swap (stage transition) |
| Right Bin | Top-right | Color swatch + label | On bin swap (stage transition) |
| Score | Bottom-center | Current score with punch animation | Every sort event |
| Stage | Bottom-right | "S:{N}" stage counter | On stage transition |
| Strikes | Bottom-left | X icons (filled=used, empty=remaining) | On wrong sort |
| Pile Meter | Left side | Vertical bar showing pile count (0-5) | On pile-up |
| Combo | Bottom-center (below score) | "x{N}" combo counter, appears at 2+, fades at 0 | On every sort |

### 6.3 Menu Structure

**Main Menu**:
- Game title "CONVEYOR CRUNCH" with animated belt behind text
- PLAY button (large, center, green pulsing)
- High Score display below play button
- Help "?" button (top-left)
- Sound toggle (top-right, speaker icon)

**Pause Menu** (overlay, semi-transparent dark background):
- Resume (large button)
- Restart
- Help "?"
- Quit to Menu

**Game Over Screen**:
- "GAME OVER" with belt-stop animation
- Cause of death: "3 STRIKES!" or "BELT OVERFLOW!"
- Final Score (large, animated count-up)
- High Score indicator (if new record: gold "NEW BEST!" with particles)
- Stage Reached
- "Watch Ad to Continue" button (once per game)
- "Play Again" button
- "Menu" button

**Help / How to Play Screen** (overlay):
- Title: "HOW TO PLAY"
- Visual: SVG diagram of belt with item + left/right swipe arrows pointing to bins
- Rules: "Match item colors to bins!", "3 wrong = Game Over", "5 piled up = Game Over"
- Tips: "Swipe fast for speed bonus!", "Watch for bin swaps!"
- "GOT IT!" button to dismiss

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after death | Every game over | Always (optional) |
| Rewarded | Clear pile (remove 3 items) | Once per game | Always (optional) |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Continue | Watch ad after game over | Reset strikes to 0, clear pile, resume from current stage | Once per game |
| Pile Clear | Watch ad during gameplay (pile >= 3) | Remove 3 items from pile | Once per game |

### 7.3 Session Economy

Free play is fully viable — ads are optional recovery mechanics only. Expected 1 rewarded ad view per 3 sessions (continue on good runs), 1 interstitial per 3 sessions. No pay-to-win, no energy systems.

**Session Flow with Monetization**:
```
[Play Free] --> [Death] --> [Rewarded Ad: Continue?]
                                  | Yes --> [Resume + Interstitial later]
                                  | No  --> [Game Over Screen]
                                                  |
                                            [Interstitial (every 3rd)]
                                                  |
                                            [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/conveyor-crunch/
+-- index.html              # Entry point, CDN Phaser 3
+-- css/
|   +-- style.css           # Responsive layout, mobile-first
+-- js/
    +-- config.js           # Colors, difficulty tables, SVG strings, scoring values
    +-- stages.js           # Stage generation: color count, speed, decoy chance, bin assignments
    +-- ads.js              # Ad hooks (placeholder), reward callbacks
    +-- effects.js          # Particle systems, screen shake, tweens, juice helpers
    +-- ui.js               # MenuScene, GameOverScene, HelpScene, HUD overlay, pause
    +-- game.js             # GameScene: belt logic, item spawning, swipe detection, collision, scoring
    +-- main.js             # BootScene (SVG textures), Phaser config, scene registration (LOADED LAST)
```

**Script load order in index.html**: config -> stages -> ads -> effects -> ui -> game -> main

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- COLOR palette constants (item colors, shades, UI colors)
- DIFFICULTY table: array of {speed, spawnInterval, colorCount, decoyChance, rotationChance, shadeConfusion, binSwap} indexed by stage
- SVG template strings for all items, bins, belt, decoy
- SCORING constants: BASE_SORT=100, SPEED_BONUS=50, PERFECT_STAGE=500, RUSH_BONUS=1000, DECOY_BONUS=150
- GAME constants: MAX_STRIKES=3, MAX_PILE=5, ITEMS_PER_STAGE=10, RUSH_ITEMS=15, INACTIVITY_TIMEOUT=3000
- COMBO_MAX=10
- Grade thresholds for display

**main.js** (max 300 lines):
- BootScene: register all SVG textures via `textures.addBase64()` once
- Phaser.Game config: AUTO renderer, scale mode FIT, parent 'game-container'
- Scene array: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene]
- Responsive resize handler for orientation changes

**game.js** (max 300 lines):
- GameScene: create belt, bins, item queue
- Swipe detection: pointerdown -> pointermove -> pointerup, calculate dx/dy, threshold 30px
- Item spawning: timer-based using stage params from stages.js
- Belt animation: continuous tween on belt ridge group
- Sort logic: match item.color to bin[direction].color -> correct/wrong
- Pile management: array of unsorted items, stack visually
- Strike tracking: 0-3, game over on 3
- Combo tracking: increment on correct, reset on wrong/pile
- Stage progression: itemCount tracker, stage clear at 10 (or 15 for rush)
- Inactivity timer: 3s without swipe -> auto pile current item
- Game over trigger -> scene transition

**stages.js** (max 300 lines):
- `getStageParams(stageNum)`: returns difficulty object
- Color assignment: pick N colors from palette, assign to bins (randomized L/R)
- Bin swap logic: shuffle bin assignments on stage transition (stage 7+)
- Item queue generation: array of {color, shape, isDecoy, rotates} for the stage
- Rush stage detection: every 5th stage
- Rest stage detection: every 10th stage (first 2 items slower)
- Shade variant generation: pick confusable shade pairs

**ui.js** (max 300 lines):
- MenuScene: title, play button, high score, help button, sound toggle
- GameOverScene: score display, death cause, continue/retry/menu buttons
- HelpScene: illustrated instructions overlay
- HUD: score text, stage text, strike icons, pile meter, combo text
- Pause overlay: resume, restart, quit buttons
- All text styling, button creation helpers

**effects.js** (max 300 lines):
- Particle burst on correct sort (15 particles, item color)
- Screen shake on wrong sort and game over
- Scale punch on score change
- Floating score text (+100, +500, etc.)
- Combo escalation effects (glow, size increase)
- Stage clear celebration (text zoom + particles)
- Belt-stop animation on game over
- Item toss arc tween (parabolic to bin)
- Wrong sort: red flash + shake on item

**ads.js** (max 300 lines):
- Placeholder ad SDK hooks
- `showInterstitial()`: called every 3rd game over
- `showRewarded(callback)`: called for continue/pile-clear
- Game over counter tracking
- Ad event stubs: onAdLoaded, onAdClosed, onAdRewarded, onAdFailed

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

---

## 9. Juice Specification

### 9.1 Player Input Feedback (applied to every swipe)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Swiped item | Count: 15, Direction: toward bin (left or right), Color: item color hex, Lifespan: 400ms |
| Screen shake | Camera | Intensity: 3px, Duration: 100ms (correct) / 6px, 150ms (wrong) |
| Scale punch | Swiped item | Scale: 1.4x on swipe start, Recovery: 100ms (item then tweens to bin) |
| Sound | -- | Correct: "thunk" 150ms. Wrong: buzzer 200ms. Pitch: +3% per combo level |

### 9.2 Core Action Additional Feedback (correct sort — most frequent)

| Effect | Values |
|--------|--------|
| Particles | Count: 20, burst from bin opening, item color + white sparkles, Lifespan: 500ms |
| Item toss arc | Parabolic tween to bin center, 250ms, easeOutQuad, scale 1.0->0.5, alpha 1.0->0.3 |
| Bin bounce | Target bin scales 1.15x on catch, recovery 120ms, easeOutBounce |
| Combo escalation | Particle count +3 per combo level. At combo 5: gold sparkle overlay. At combo 10: screen flash white 50ms |

### 9.3 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 12px, Duration: 400ms |
| Screen effect | Red vignette overlay fading in over 300ms, desaturation tween 500ms |
| Belt stop | Belt ridges decelerate tween over 600ms (easeOutCubic), grinding sound |
| Sound | Low-frequency "crunch" + belt grind, 800ms total |
| Effect -> UI delay | 700ms (belt stops, shake settles, then game over screen slides up) |
| Death -> restart | **Under 1.5 seconds** (tap Play Again -> new game immediately) |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{N}", Color: #FFFFFF (normal) / #F39C12 (combo 5+), Movement: up 60px over 600ms, Fade: alpha 1.0->0.0 |
| Score HUD punch | Scale 1.3x, Recovery: 150ms, easeOutElastic |
| Combo text | "x{N}" text size: 24px base + 2px per combo level. At 10x: 44px with gold glow. Appears center-screen, fades after 800ms |
| Perfect stage | "PERFECT!" text: 48px gold, zoom from 0.5x to 1.2x to 1.0x over 500ms, 30 gold particles radial burst |
| Stage clear | "STAGE {N}" text: 36px white, slide in from right (matching belt direction), hold 400ms, slide out left |

### 9.5 Pile Warning Effects

| Effect | Values |
|--------|--------|
| Pile 3/5 | Pile meter turns orange, pulses at 2Hz |
| Pile 4/5 | Pile meter turns red, screen edges get subtle red glow, pulse at 3Hz |
| Item pile impact | Each piled item: small dust particles (8, gray), camera micro-shake 2px 80ms |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | Performance.timing API |
| Memory Usage | <80MB | Chrome DevTools Memory panel |
| JS Bundle Size | <50KB total (excl. CDN) | File size check |
| First Interaction | <1 second after load | Time to first meaningful paint |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser pointer events for swipe detection (pointerdown, pointermove, pointerup)
- **Prevent Default**: Disable pull-to-refresh, pinch-to-zoom, double-tap-to-zoom
- **Orientation**: Portrait mode preferred. On landscape: show "rotate device" overlay
- **Safe Areas**: CSS env(safe-area-inset-*) for notch devices
- **Throttling**: Pause game and belt on visibility change (document.hidden)
- **Swipe Dead Zone**: 15px minimum movement before registering as swipe (prevents accidental taps)

### 10.3 Swipe Detection Details

```
Swipe Recognition:
- pointerdown: record startX, startY, startTime
- pointermove: show drag indicator (subtle arrow hint)
- pointerup: calculate dx = endX - startX, dy = endY - startY
- Horizontal swipe: |dx| > 30px AND |dx| > |dy| * 1.5
  - dx < 0: LEFT swipe
  - dx > 0: RIGHT swipe
- Vertical swipe (stage 16+): |dy| > 30px AND dy < 0 AND |dy| > |dx| * 1.5
  - UP swipe: discard
- Input buffer: if swipe during item toss animation, queue for next item
- Max swipe time: 500ms (longer = not a swipe, ignored)
```

### 10.4 Local Storage Schema

```json
{
  "conveyor-crunch_high_score": 0,
  "conveyor-crunch_games_played": 0,
  "conveyor-crunch_highest_stage": 0,
  "conveyor-crunch_settings": {
    "sound": true
  },
  "conveyor-crunch_total_score": 0,
  "conveyor-crunch_ad_game_over_count": 0
}
```

### 10.5 Critical Implementation Warnings

1. **BootScene texture registration**: ALL SVG textures MUST be registered in BootScene via `addBase64()` ONCE. Never re-register on scene restart.
2. **Script load order**: main.js MUST load LAST in index.html. Order: config -> stages -> ads -> effects -> ui -> game -> main.
3. **Swipe vs tap distinction**: Require minimum 30px drag distance. Taps (< 30px movement) should be ignored during gameplay.
4. **Belt never stops during gameplay**: Belt animation and item spawning continue regardless of player state. Only stops on game over or pause.
5. **Item queue management**: Items are created off-screen right and tween leftward. Remove items from scene when they reach pile area or are sorted. Never accumulate > 8 items on screen.
6. **Inactivity enforcement**: 3-second timer resets on every valid swipe. On timeout, frontmost item auto-piles. Timer restarts immediately.
7. **Bin swap must be visually obvious**: On stage transition with bin swap, flash both bins 3x over 600ms with "SWAP!" text before resuming.
