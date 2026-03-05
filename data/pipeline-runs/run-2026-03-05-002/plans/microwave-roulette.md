# Game Design Document: Microwave Roulette

**Slug**: `microwave-roulette`
**One-Liner**: Stop the microwave at the perfect second before your food explodes -- but every item has a different sweet spot
**Core Mechanic**: Precision tap timing on a spinning countdown with multi-zone stops and boss items
**Target Session Length**: 4-7 minutes
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

You are a reckless microwave chef nuking increasingly absurd items -- from frozen burritos to live grenades to an entire laptop. A circular countdown timer spins on the microwave display. Each item has a green "sweet spot" zone on the timer ring. Tap to stop the timer when the needle is in the green zone: too early and the food is raw/frozen, too late and it EXPLODES spectacularly.

The twist: as stages progress, items require multi-zone stops (stop once for defrost, again for cook, again for crisp), green zones shrink and move, reverse timers appear, and boss items demand entirely different input patterns (hold to slow-cook, rapid-tap to thaw). A combo system rewards consecutive perfect stops with escalating score multipliers and visual fireworks. The collection "Cookbook" tracks every item you have successfully microwaved, driving completionist replay.

### 1.2 Target Audience

Casual mobile gamers aged 13-35. Play context: commute, waiting room, quick break. Low skill floor (just tap), high skill ceiling (multi-zone precision + combos). Humor-driven appeal attracts shareable social media moments (explosion screenshots).

### 1.3 Core Fantasy

You are a chaotic kitchen daredevil pushing the microwave to its absolute limits. The satisfaction comes from the razor-thin margin between a perfectly heated meal and a catastrophic explosion. Every successful stop feels like defusing a bomb.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 4-7 minutes |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 22%+ |
| Average Stages per Session | 8-18 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Item Appears in Microwave] --> [Timer Starts Spinning] --> [Tap to Stop in Green Zone]
        ^                                                          |
        |                                          [Perfect / Good / Miss?]
        |                                           |         |         |
        |                                     [Combo+1]  [Combo=0]  [EXPLODE!]
        |                                           |         |         |
        |                                     [Score++]  [Score+]  [Lose Life]
        |                                           |         |         |
        |                                     [Next Item] [Next Item]  |
        |                                                          [Continue?]
        |                                                     Yes/     |No
        └──────────────────────────────────────────────────────┘  [Game Over]
```

**Moment-to-moment**: The player watches a circular timer needle sweep around the microwave display. The green zone is visible on the ring. The player must tap at precisely the right moment. Visual distractions (steam, sparks, shaking) obscure the timer at higher stages. Multi-zone items require the player to stop the needle multiple times in sequence, with each zone appearing only after the previous stop succeeds.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Stop Timer | Tap (anywhere) | Stop the spinning needle at the current position |
| Slow-Cook (Boss) | Hold | Hold finger down to slow the needle through a narrow zone |
| Rapid Thaw (Boss) | Rapid Tap | Tap rapidly N times within a shrinking window |

**Control Philosophy**: Single-tap dominance keeps the game instantly accessible. The entire screen is the tap zone -- no aiming required. The skill expression is purely temporal: WHEN you tap, not WHERE. Boss items introduce hold and rapid-tap as surprise variations that break monotony.

**Touch Area Map**:
```
+---------------------------------+
|  Score / Stage / Lives  (HUD)   |
+---------------------------------+
|                                 |
|     [Microwave Display]         |
|     [Circular Timer Ring]       |
|     [Item Visual Center]        |
|                                 |
|   TAP ANYWHERE TO STOP          |
|                                 |
|     [Item Name + Hint]          |
|                                 |
+---------------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Perfect Stop (needle center of green) | 300 | Combo multiplier applies |
| Good Stop (needle in green, off-center) | 150 | Combo multiplier applies |
| Near Miss (just outside green) | 50 | Resets combo |
| Multi-Zone Bonus (all stops perfect) | +500 per zone | Stacks with combo |
| Boss Item Clear | 1000 | Fixed, no multiplier |
| New Item Discovered | +200 | One-time bonus |

**Combo System**: Consecutive perfect/good stops increment a combo counter. Score multiplier = 1 + (combo * 0.25), capped at 5x at combo 16. Combo resets on miss or explosion. Visual and audio escalation accompany rising combos (screen border glow intensifies, pitch rises).

**High Score**: Stored in localStorage. Displayed on menu screen and game over screen. New high score triggers celebration animation.

### 2.4 Progression System

Items progress from mundane food to absurd objects. Every 5 stages, a new item category unlocks. The Cookbook screen (accessible from menu) shows silhouettes of undiscovered items, driving completionist replay.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-5 | Single green zone, large (90deg arc), common food items | Tutorial -- generous timing |
| 6-10 | Green zone shrinks (60deg), zone position randomized | Medium -- must watch carefully |
| 11-15 | Multi-zone items (2 stops required), steam distraction | Hard -- sequential precision |
| 16-25 | Moving green zones (zone slides around ring), sparks distraction | Very Hard -- tracking + timing |
| 26-35 | Reverse timer (needle spins backward), 3-stop items | Expert -- brain twist |
| 36-50 | Boss items every 10 stages (hold/rapid-tap), zone shrinks to 25deg | Master |
| 51+ | Random mix of all mechanics, zone shrinks to 15deg minimum, speed increases | Endless survival |

### 2.5 Lives and Failure

Players start with 3 lives (3 hearts). Explosion (missing the green zone entirely) costs 1 life. Near-miss does NOT cost a life but gives minimal points and resets combo.

**Inactivity Death**: If the player does not tap within 8 seconds of the timer starting, the item auto-explodes (lose 1 life).

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Explosion (tap outside green + near-miss) | Lose 1 life, combo reset | None (continue playing) |
| Inactivity (8s no input) | Lose 1 life, item auto-explodes | None |
| All lives lost | Game over | Watch ad to gain 1 extra life and continue |

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each stage is one item to microwave. The stage number determines all parameters procedurally.

**Generation Algorithm**:
```
Stage Generation Parameters:
- Item: selected from item pool based on stage range (pool expands every 5 stages)
- Timer Speed: base 1.0 rev/sec + (stage * 0.015), capped at 2.5 rev/sec at stage 100
- Green Zone Arc: max(15, 90 - stage * 1.5) degrees
- Green Zone Position: random angle on ring (0-360)
- Zone Count: 1 for stages 1-10, 2 for 11-25, 3 for 26+, with random variation
- Zone Movement: none for 1-15, speed = stage * 0.3 deg/frame for 16+, capped at 3 deg/frame
- Reverse Timer: 0% chance stages 1-25, 30% stages 26-35, 50% stages 36+
- Distraction Level: none 1-5, steam 6-15, steam+sparks 16-30, steam+sparks+shake 31+
- Boss Stage: every 10th stage starting at stage 10 (10, 20, 30...)
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
    0    10    20    30    40    50    60    70+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-5 | Stage 6-15 | Stage 16-30 | Stage 31-50 | Stage 51+ |
|-----------|-----------|------------|-------------|-------------|-----------|
| Timer Speed (rev/s) | 1.0 | 1.1-1.2 | 1.25-1.45 | 1.5-1.75 | 1.8-2.5 |
| Green Zone Arc (deg) | 90-82 | 81-67 | 66-45 | 44-25 | 24-15 |
| Zone Count | 1 | 1 | 1-2 | 2-3 | 2-3 |
| Zone Movement | None | None | Slow (0.5-1.5 d/f) | Medium (1.5-2.5 d/f) | Fast (2.5-3 d/f) |
| Distractions | None | Steam | Steam + Sparks | All + Shake | All + Speed Warp |
| New Mechanic | None | Shrinking zone | Multi-zone, moving zone | Reverse timer, boss | Random mix |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Green zone is always at least 15 degrees wide. Timer speed never exceeds 2.5 rev/s. Human reaction time of ~200ms always allows a valid window.
2. **Variety Threshold**: Consecutive items cannot be from the same category. At least 2 parameters must differ between consecutive stages.
3. **Difficulty Monotonicity**: Overall difficulty index (composite of speed, arc, zones) never decreases. Local ease spikes from rest stages are the exception.
4. **Rest Stages**: Every 8th stage is a deliberately easier "palate cleanser" -- larger green zone (+20deg), slower speed (-0.2 rev/s), single zone.
5. **Boss Stages**: Every 10th stage features a boss item with unique input pattern (hold or rapid-tap). Boss items are visually distinct (glowing border, unique animation).

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Cartoon-retro kitchen aesthetic. Bold outlines, exaggerated proportions, vibrant colors. The microwave itself is the central visual anchor -- large, chunky, with an expressive digital display.

**Aesthetic Keywords**: Chunky, Cartoon, Retro-Kitchen, Explosive, Juicy

**Reference Palette**: 1950s diner meets modern pop art. Bright, saturated colors with heavy black outlines. The feeling of a cartoon cooking show gone horribly wrong.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | Microwave Teal | #00BFA5 | Microwave body, primary UI |
| Secondary | Timer Orange | #FF6D00 | Timer needle, active elements |
| Background | Kitchen Cream | #FFF8E1 | Game background |
| Danger/Explosion | Hot Red | #FF1744 | Explosion effects, danger zones |
| Success/Green Zone | Fresh Green | #00E676 | Green zone on timer ring |
| Perfect Zone | Bright Gold | #FFD600 | Center of green zone (perfect stop) |
| UI Text | Charcoal | #263238 | Score, labels, menus |
| UI Background | Warm Gray | #ECEFF1 | Menu backgrounds, overlays |

### 4.3 SVG Specifications

All game graphics are rendered as SVG elements generated in code. No external image assets.

**Microwave Body**:
```svg
<!-- Rounded rectangle body with door window -->
<rect x="40" y="100" width="280" height="220" rx="18" fill="#00BFA5" stroke="#263238" stroke-width="4"/>
<!-- Door window (circular) -->
<circle cx="160" cy="210" r="80" fill="#1A237E" stroke="#263238" stroke-width="3"/>
<!-- Inner glow -->
<circle cx="160" cy="210" r="72" fill="#283593" opacity="0.6"/>
<!-- Control panel (right side) -->
<rect x="260" y="110" width="50" height="200" rx="4" fill="#B2DFDB"/>
<!-- Timer display (digital readout) -->
<rect x="268" y="120" width="34" height="20" rx="2" fill="#000" />
<text x="285" y="136" fill="#00E676" font-family="monospace" font-size="14" text-anchor="middle">0:30</text>
```

**Timer Ring (overlay on microwave window)**:
```svg
<!-- Outer ring track -->
<circle cx="160" cy="210" r="65" fill="none" stroke="#37474F" stroke-width="12" opacity="0.3"/>
<!-- Green zone arc (dynamic, positioned via transform) -->
<path d="M160,145 A65,65 0 0,1 220,190" fill="none" stroke="#00E676" stroke-width="12" stroke-linecap="round"/>
<!-- Perfect center of green zone (gold highlight) -->
<path d="M185,152 A65,65 0 0,1 200,165" fill="none" stroke="#FFD600" stroke-width="12" stroke-linecap="round"/>
<!-- Timer needle -->
<line x1="160" y1="210" x2="160" y2="150" stroke="#FF6D00" stroke-width="4" stroke-linecap="round"/>
<!-- Needle pivot dot -->
<circle cx="160" cy="210" r="6" fill="#FF6D00"/>
```

**Food Item (example: Burrito)**:
```svg
<!-- Simple burrito shape -->
<ellipse cx="160" cy="210" rx="35" ry="15" fill="#FFAB40" stroke="#263238" stroke-width="2"/>
<line x1="130" y1="210" x2="190" y2="210" stroke="#263238" stroke-width="1" stroke-dasharray="4,3"/>
<!-- Foil wrap lines -->
<path d="M130,205 Q160,195 190,205" fill="none" stroke="#E0E0E0" stroke-width="1.5"/>
```

**Explosion Effect (triggered on miss)**:
```svg
<!-- Starburst shape -->
<polygon points="160,150 170,190 210,180 180,210 210,240 170,225 160,265 150,225 110,240 140,210 110,180 150,190"
  fill="#FF1744" stroke="#FFD600" stroke-width="2"/>
<!-- Inner flash -->
<circle cx="160" cy="210" r="30" fill="#FFFF00" opacity="0.8"/>
```

**Design Constraints**:
- Maximum 8 path elements per SVG object
- Use basic shapes (rect, circle, ellipse, line, polygon) over complex paths
- Animations via Phaser tweens, not SVG animate elements
- All items fit within 80x80px bounding box inside the microwave window

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Needle pulse | Timer running | Needle glows brighter as it approaches green zone (tween alpha 0.6->1.0) |
| Steam particles | Stage 6+ distraction | 8-12 white circles rising from microwave, random drift, fade over 800ms |
| Spark particles | Stage 16+ distraction | 6 yellow/orange circles bursting from sides, lifespan 400ms |
| Microwave shake | Stage 31+ distraction | Microwave body oscillates +/-3px, 100ms period |
| Explosion burst | Miss (tap outside green) | 20 particles radial burst, red/orange/yellow, scale down + fade 500ms |
| Perfect flash | Perfect stop | White overlay flash 80ms, green ring pulses 1.4x scale 150ms |
| Combo glow | Combo 3+ | Screen edge border glow, intensity scales with combo count |
| Item freeze | Too early stop | Item turns blue tint, ice crystal overlay, 300ms |

---

## 5. Audio Design

### 5.1 Sound Effects

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Timer tick | Rhythmic mechanical tick synced to needle position | ~50ms per tick | Medium |
| Perfect stop | Bright "DING!" microwave bell, satisfying | 300ms | High |
| Good stop | Softer chime, slightly muted | 250ms | High |
| Near miss | Dull buzz, warning tone | 200ms | High |
| Explosion | Deep boom + shattering glass + sizzle | 600ms | High |
| Frozen (too early) | Ice cracking / crystallization sound | 300ms | High |
| Combo increment | Ascending ping, pitch +8% per combo level | 150ms | Medium |
| Boss appear | Dramatic low rumble + alert siren | 800ms | High |
| Boss clear | Triumphant fanfare, brass hit | 1s | High |
| New item discovered | Unlock jingle, sparkle sound | 500ms | Medium |
| Game over | Descending tone, fire extinguisher hiss | 1s | High |
| UI button press | Microwave button beep | 80ms | Low |

### 5.2 Music Concept

**Background Music**: Upbeat lo-fi kitchen funk. Syncopated bass with kitchen-sound samples (chopping, sizzling). Tempo increases subtly with stage progression.

**Music State Machine**:

| Game State | Music Behavior |
|-----------|---------------|
| Menu | Relaxed kitchen ambiance, gentle loop, 90 BPM |
| Early Stages (1-10) | Upbeat funk groove, 110 BPM |
| Mid Stages (11-30) | Added percussion layers, 120 BPM |
| Late Stages (31+) | Intense driving beat, distorted bass, 135 BPM |
| Boss Stage | Unique boss loop, dramatic tension |
| Game Over | Music cuts to low drone, fade out |
| Pause | Music volume reduced to 20% |

**Audio Implementation**: Howler.js via CDN (`https://cdn.jsdelivr.net/npm/howler@2/dist/howler.min.js`). All sounds generated procedurally using Web Audio API oscillators for zero-asset footprint.

---

## 6. UI/UX

### 6.1 Screen Flow

```
+------------+     +------------+     +------------+
|   Splash   |---->|    Menu    |---->|    Game    |
|   Screen   |     |   Screen   |     |   Screen   |
+------------+     +------------+     +------------+
                        |                   |
                   +---------+         +---------+
                   |Cookbook  |         |  Pause  |
                   |Overlay  |         | Overlay |
                   +---------+         +---------+
                                            |
                                       +---------+
                                       |  Game   |
                                       |  Over   |
                                       | Screen  |
                                       +----+----+
                                            |
                                       +---------+
                                       |Continue |
                                       |Ad Prompt|
                                       +---------+
```

### 6.2 HUD Layout

```
+---------------------------------+
| Score: 12450  Stage 7   <3<3<3  |  <- Top bar (always visible)
| Combo x4                        |  <- Combo (appears on combo 2+, fades)
+---------------------------------+
|                                 |
|        [MICROWAVE BODY]         |
|     +-------------------+       |
|     |  [Timer Ring]     |       |
|     |  [Food Item]      |       |
|     +-------------------+       |
|                                 |
|     "Frozen Burrito"            |  <- Item name
|     "TAP to stop!"             |  <- Instruction hint (fades after stage 3)
|                                 |
+---------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left | Current score, scale punch on change | Every score event |
| Stage | Top-center | "Stage N" with item icon | On stage transition |
| Lives | Top-right | Heart icons (filled=alive, empty=lost) | On life change |
| Combo | Below top bar, center | "x{N}" with glow, appears at combo 2+ | On combo event |
| Item Name | Below microwave | Current item name in quotes | On stage transition |
| Hint Text | Below item name | "TAP to stop!" -- hidden after stage 3 | Stages 1-3 only |
| Digital Timer | Microwave control panel | Countdown digits synced to needle | Every frame |

### 6.3 Menu Structure

**Main Menu**:
- Title: "MICROWAVE ROULETTE" in retro microwave LCD font
- Play button (large, pulsing, center -- shaped like a microwave START button)
- Cookbook button (book icon, bottom-left -- shows collected items)
- Sound toggle (speaker icon, top-right)
- High Score display (below title)

**Pause Menu** (overlay, semi-transparent dark background):
- Resume
- Restart
- Sound On/Off
- Quit to Menu

**Game Over Screen**:
- "KITCHEN DISASTER!" or "MASTER CHEF!" header (based on stage reached)
- Final Score (large, animated count-up)
- High Score indicator (golden crown if new record)
- Stage Reached + Items Cooked count
- "Watch Ad for Extra Life" button (if available, pulsing)
- "Play Again" button
- "Menu" button
- Items discovered this run (small icons)

**Cookbook Screen** (overlay from menu):
- Grid of item icons (colored if discovered, silhouette if not)
- Item name + stage range shown on tap
- Collection progress: "23/50 Items Discovered"
- Categories: Common Food, Weird Food, Non-Food, Boss Items

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after final death | Every game over (optional) | Always (player chooses) |
| Rewarded | Double final score | End of session (optional) | Always (player chooses) |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Life | Watch rewarded ad after all lives lost | +1 life, resume from current stage | Once per game |
| Score Doubler | Watch rewarded ad at game over | 2x final score (affects high score) | Once per session |

### 7.3 Session Economy

The game is generous with free play -- 3 lives means most players reach stage 8-15 before game over. The continue-after-explosion ad feels urgent because players have invested time reaching that stage and don't want to lose progress. The score doubler is a low-pressure upsell at game over.

**Session Flow with Monetization**:
```
[Play Free with 3 Lives] --> [All Lives Lost] --> [Rewarded Ad: Extra Life?]
                                                       | Yes --> [Resume + 1 Life]
                                                       | No  --> [Game Over Screen]
                                                                      |
                                                                [Interstitial (every 3rd)]
                                                                      |
                                                                [Rewarded Ad: 2x Score?]
                                                                      | Yes --> [Score doubled]
                                                                      | No  --> [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/microwave-roulette/
+-- index.html              # Entry point
|   +-- CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
|   +-- CDN: Howler.js      # https://cdn.jsdelivr.net/npm/howler@2/dist/howler.min.js
|   +-- Local CSS           # css/style.css
|   +-- Local JS (ordered)  # config -> main -> game -> stages -> ui -> ads
+-- css/
|   +-- style.css           # Responsive styles, mobile-first
+-- js/
    +-- config.js           # Game constants, difficulty tables, color palette, item database
    +-- main.js             # Phaser game init, scene registration, global state
    +-- game.js             # Main game scene: timer ring, needle, tap detection, combo logic
    +-- stages.js           # Stage generation, item selection, difficulty scaling, boss logic
    +-- ui.js               # Menu, game over, HUD overlay, cookbook, pause, settings
    +-- ads.js              # Ad integration hooks, reward callbacks, ad timing
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- Game dimensions (360x640 base, scale mode RESIZE)
- Color palette hex constants
- Difficulty curve tables (speed, arc, zones per stage range)
- Score values and combo multiplier formula
- Item database: array of {name, category, stageRange, svgKey, zones, specialType}
- Distraction parameters per stage range
- Inactivity timeout (8000ms)

**main.js** (max 300 lines):
- Phaser.Game initialization with responsive config (scale mode FIT, autoCenter CENTER_BOTH)
- Scene registration: MenuScene, GameScene, GameOverScene
- Global state: highScore, gamesPlayed, cookbookUnlocks (Set), settings
- localStorage read/write for persistence
- Orientation handling (portrait lock via CSS)

**game.js** (max 300 lines):
- GameScene extending Phaser.Scene
- `create()`: Draw microwave SVG, initialize timer ring, spawn first item, set up tap input
- `update()`: Rotate needle, check inactivity timer, update distractions, move green zones
- Tap handler: calculate needle angle vs green zone(s), determine perfect/good/miss
- Multi-zone logic: track completed zones per item, advance to next zone on success
- Boss item logic: detect hold duration or rapid-tap count
- Life management: decrement on explosion, trigger game over at 0
- Combo tracking and score calculation

**stages.js** (max 300 lines):
- `generateStage(stageNumber)`: returns {item, speed, greenZoneArc, greenZoneAngle, zoneCount, zoneMovement, reverseTimer, distractionLevel, isBoss, bossType}
- Item selection from filtered pool based on stage range
- Difficulty parameter calculation using formulas from config
- Boss stage detection (every 10th) and boss type assignment
- Rest stage detection (every 8th) and parameter easing
- Cookbook unlock tracking

**ui.js** (max 300 lines):
- MenuScene: title, play button, cookbook button, high score, sound toggle
- GameOverScene: score display with count-up animation, high score check, action buttons
- HUD: score text, stage text, life hearts, combo counter -- created as overlay in GameScene
- Pause overlay: semi-transparent background, resume/restart/quit buttons
- Cookbook overlay: grid of item icons, progress counter, category tabs

**ads.js** (max 300 lines):
- Ad SDK initialization (placeholder hooks)
- Interstitial trigger: track game over count, show every 3rd
- Rewarded ad: continue prompt (extra life), score doubler prompt
- Callbacks: onAdRewarded grants life or doubles score
- Ad state management (loading, showing, completed, failed)

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |
| Howler.js | 2.x | `https://cdn.jsdelivr.net/npm/howler@2/dist/howler.min.js` | Audio playback |

---

## 9. Juice Specification

### 9.1 Player Input Feedback (applied to every tap)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Needle tip | Count: 12, Direction: radial, Color: #FF6D00 + #FFD600, Lifespan: 400ms |
| Screen shake | Camera | Intensity: 3px, Duration: 100ms |
| Scale punch | Microwave body | Scale: 1.05x, Recovery: 120ms |
| Sound | -- | Microwave beep, Pitch: +4% per combo level |

### 9.2 Core Action Additional Feedback (Perfect Stop)

| Effect | Values |
|--------|--------|
| Particles | Count: 25, Color: #00E676 + #FFD600, radial burst from needle, Lifespan: 500ms |
| Hit-stop | 40ms freeze (all tweens pause) |
| Camera zoom | 1.03x snap, Recovery: 200ms ease-out |
| Flash overlay | White, alpha 0.4, Duration: 80ms |
| Green zone pulse | Scale 1.4x, Recovery: 150ms, Color flash to #FFD600 |
| Combo escalation | Every combo: particle count +3, shake intensity +0.5px (cap at 8px), pitch +4% |

### 9.3 Death/Failure Effects (Explosion)

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 12px, Duration: 350ms, Decay: exponential |
| Screen flash | Red (#FF1744) overlay, alpha 0.5, Duration: 150ms |
| Explosion particles | Count: 40, Colors: #FF1744/#FF6D00/#FFD600/#263238, radial, Lifespan: 600ms, Gravity: 200 |
| Microwave door | Flies open (rotate 90deg, 200ms), bounces back |
| Food debris | 6-8 item-colored fragments scatter with physics, fade 800ms |
| Sound | Deep boom (80Hz, 200ms) + glass shatter (white noise burst, 150ms) |
| Slow motion | timeScale 0.3 for 400ms, then snap back (use setTimeout, NOT delayedCall) |
| Effect to UI delay | 700ms before game over overlay appears |
| Death to restart | Under 1.5 seconds from tap to next stage or game over screen |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{N}", Color: #00E676 (perfect) / #FFD600 (good), Float up 60px, Fade: 500ms |
| Score HUD punch | Scale 1.4x, Recovery: 150ms, ease: bounce |
| Combo text | "x{N}" appears center-screen, Size: 32px + (combo * 2px), capped at 56px, Color: #FFD600, Duration: 800ms |
| Combo milestone (x5, x10, x15) | Full-screen radial particle burst, 50 particles, celebratory chime |

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
- **Touch Events**: Use Phaser's input system with `pointer` events (handles both touch and mouse)
- **Prevent Default**: Prevent pull-to-refresh, pinch-to-zoom, double-tap-to-zoom
- **Orientation**: Lock to portrait mode via CSS and Phaser scale config
- **Safe Areas**: Account for notch/cutout with CSS env(safe-area-inset-*)
- **Background Detection**: Pause game on visibility change to prevent battery drain
- **Asset Loading**: Zero external assets -- all SVG generated in code, procedural audio via Web Audio API

### 10.3 Touch Controls

- **Touch Target Size**: Entire screen is the tap target during gameplay -- no precision aiming needed
- **Input Buffering**: Buffer one tap during hit-stop/freeze frames to prevent input loss
- **Tap Detection**: Use `pointerdown` event (not `pointerup`) for instant response feel
- **Hold Detection**: For boss items, track pointer down duration. Hold threshold: 500ms minimum
- **Rapid Tap Detection**: For boss items, count taps within 2-second window. Target: 8+ taps

### 10.4 Edge Cases

- **Double-tap prevention**: Ignore taps within 100ms of previous tap (except during rapid-tap boss)
- **Backgrounding**: Pause timer and game state on `visibilitychange` event
- **Resize/Rotation**: Phaser RESIZE scale mode handles viewport changes. Re-center all elements on resize
- **localStorage unavailable**: Graceful fallback -- game plays fine without persistence, just no saved high scores
- **Audio autoplay**: Unlock audio context on first user tap (required for iOS Safari)
- **Slow-motion timing**: Use `setTimeout()` for delayed calls during timeScale changes, NOT `this.time.delayedCall()` (Phaser bug: delayedCall freezes when timeScale=0)

### 10.5 Item Database (Sample)

| Stage Range | Category | Items |
|-------------|----------|-------|
| 1-5 | Common Food | Frozen Burrito, Leftover Pizza, Cup Noodles, Popcorn, Hot Dog |
| 6-10 | Odd Food | Entire Watermelon, Frozen Turkey, 3-Day-Old Sushi, Mystery Leftovers |
| 11-20 | Non-Food | Smartphone, Tin Foil Ball, CD Collection, Rubber Duck, Soap Bar |
| 21-35 | Absurd | Live Grenade, Laptop, Fish Tank, Bowling Ball, Lava Lamp |
| 36-50 | Legendary | The Sun (miniature), Black Hole Nugget, Antimatter Sandwich, Time Crystal |
| Boss | Boss | Golden Egg (hold to slow-cook), Ice Block (rapid-tap to thaw), Dynamite Bundle (precision triple-stop) |

### 10.6 Local Storage Schema

```json
{
  "microwave-roulette_high_score": 0,
  "microwave-roulette_games_played": 0,
  "microwave-roulette_highest_stage": 0,
  "microwave-roulette_cookbook": [],
  "microwave-roulette_settings": {
    "sound": true,
    "music": true,
    "vibration": true
  },
  "microwave-roulette_total_score": 0
}
```
