# Game Design Document: Traffic Light Conductor

**Slug**: `traffic-light-conductor`
**One-Liner**: Control every traffic light at an increasingly chaotic intersection -- one wrong green and cars collide spectacularly.
**Core Mechanic**: Top-down 4-way intersection. Cars approach from N/S/E/W. Player taps traffic lights to toggle green/red. Perpendicular greens cause crashes. Cars vary (sedans, trucks, ambulances). Crashes produce absurd cartoon debris. 3 crashes = game over. Inactivity = pileup chain-crash death in 8s.
**Target Session Length**: 2-5 minutes
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Traffic Light Conductor puts you in charge of every traffic light at an increasingly chaotic intersection. Cars roll in from all four directions -- north, south, east, west -- and you must tap the traffic lights to toggle them green or red, keeping perpendicular streams from colliding. One wrong green and BOOM: a spectacular cartoonish crash sends rubber ducks, pizza boxes, and toilet seats flying across the screen.

The core tension is juggling multiple streams of traffic simultaneously. Early stages have one lane per direction with slow cars. By stage 10, you're managing dual lanes, speed-demon sports cars, lumbering trucks that block intersections, and ambulances that ignore red lights entirely. The game rewards smooth flow management with combo bonuses -- every car that passes safely without you stopping traffic extends the combo. But the moment you panic and green two perpendicular lanes, the combo shatters along with the cars.

What makes this game unique is the HUMOR. Crashes are not punishing -- they are HILARIOUS. Every collision triggers an over-the-top explosion with absurd debris items, screen shake, and a satisfying crunch. Players will deliberately cause crashes just to see what flies out. This is the oddball hook: the failure state is as entertaining as success, creating a "one more round" loop where players chase high scores but secretly enjoy the carnage.

### 1.2 Target Audience

Casual mobile gamers aged 12-40 who play during commutes, breaks, or waiting rooms. Appeals to fans of time-management games (Diner Dash), traffic puzzles (Traffic Run), and slapstick humor. Low skill floor (tap to toggle lights) but high skill ceiling (managing 8 lanes, special vehicles, combo optimization). The humor hook appeals to younger players (12-18) who share funny crash screenshots.

### 1.3 Core Fantasy

You are a frazzled traffic controller at the world's most chaotic intersection. Every car is your responsibility. When traffic flows smoothly, you feel like a genius conductor orchestrating a symphony of motion. When it all goes wrong, you are the helpless witness to the most spectacular, absurd pileups ever seen. Either way, you're entertained.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 2-5 minutes |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 22%+ |
| Average Stages per Session | 5-12 |
| Crash Rate (technical) | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Cars Spawn from Edges] --> [Player Reads Traffic State] --> [Tap Light to Toggle Green/Red]
         ^                                                            |
         |                                                   [Cars Flow or Stop]
         |                                                            |
         |                                                   [Safe Pass = Points + Combo]
         |                                                            |
         |                                              [Collision? = Crash + Lose Life]
         |                                                            |
         +--------- [More Cars Spawn (faster)] <---------------------+
                              |
                     [3 Crashes = Game Over]
                     [8s Inactivity = Chain Crash Death]
```

**Moment-to-moment gameplay:**
1. Cars spawn at the edges of the screen, approaching the intersection from 4 directions.
2. Each direction has a traffic light the player can tap to toggle between green (cars flow) and red (cars stop).
3. The player must ensure no two perpendicular directions are green simultaneously (N/S can both be green since they don't cross; E/W can both be green; but N+E, N+W, S+E, S+W are collision pairs).
4. Every car that passes through the intersection safely scores points. Consecutive safe passes without any direction being red build the Flow Combo.
5. If two perpendicular green streams have cars in the intersection simultaneously, a crash occurs: spectacular cartoon explosion, lose 1 life.
6. Special vehicles (ambulances) ignore red lights and barrel through -- the player must create gaps for them.
7. After every stage-clear threshold (X cars passed), stage advances: more lanes, faster cars, new vehicle types.
8. If the player does nothing for 8 seconds, cars pile up at all 4 red lights, then all lights malfunction to green simultaneously, causing a massive 4-way chain crash (instant game over).

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Toggle Light | Tap | Tap any of the 4 traffic light buttons to toggle that direction green/red. Min touch target 60x60px. |
| Emergency Stop All | Double-tap center | Double-tap the intersection center to set ALL lights to red. 3-second cooldown. Safety panic button. |

**Control Philosophy**: Single-tap is the only mechanic because the cognitive load is in DECISION-MAKING, not dexterity. The player's hands are free to tap rapidly between lights. The challenge is reading traffic patterns and timing toggles, not performing complex gestures. The emergency stop adds a strategic safety valve for overwhelmed players.

**Touch Area Map**:
```
         [N Light: 60x60px]
              |
┌─────────────────────────┐
│         ROAD N          │
│    ┌──────────────┐     │
│    │              │     │
[W]──│ INTERSECTION │──[E Light: 60x60px]
[60x │   (center)   │  60]
[60] │  dbl-tap zone │    │
│    │   80x80px     │    │
│    └──────────────┘     │
│         ROAD S          │
└─────────────────────────┘
              |
         [S Light: 60x60px]
```

The 4 traffic light buttons are positioned OUTSIDE the intersection at the edge of each road, clearly separated from gameplay to prevent mis-taps. The center intersection zone (80x80px) is the emergency stop double-tap target.

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Car passes safely (sedan) | 10 | x Flow Combo multiplier |
| Car passes safely (truck) | 15 | x Flow Combo multiplier (trucks are harder to manage) |
| Car passes safely (sports car) | 20 | x Flow Combo multiplier (fast = risky) |
| Ambulance safe passage | 50 | x Flow Combo multiplier (hardest) |
| Stage clear bonus | 100 x stage_number | Flat bonus, no multiplier |
| Perfect stage (0 crashes) | 200 x stage_number | Bonus for flawless stage |
| Near-miss bonus | 25 | Two cars pass within 20px without colliding |

**Combo System -- Flow Combo**:
- Every safe car pass increments the Flow Combo counter by 1.
- Flow Combo multiplier = `1 + floor(combo / 5) * 0.5` (so combo 5 = 1.5x, combo 10 = 2.0x, combo 15 = 2.5x, capped at 5.0x at combo 40+).
- The combo resets to 0 when: (a) a crash occurs, OR (b) the player sets ALL directions to red simultaneously for more than 2 seconds (punishes over-cautious play).
- Combo counter displays prominently at the top-center of the HUD with escalating visual effects.

**High Score**: Stored in localStorage as `traffic_light_conductor_high_score`. Displayed on menu screen and game over screen. New high score triggers confetti particle burst (40 particles, gold #FFD700, 1200ms lifespan).

### 2.4 Progression System

The game uses a stage-based infinite progression. Each stage requires N cars to pass safely (or N total cars to spawn) before advancing.

**Progression Milestones**:

| Stage Range | Cars to Clear | New Element Introduced | Difficulty Modifier |
|------------|--------------|----------------------|-------------------|
| 1-3 | 10 cars | 1 lane per direction, sedans only, speed 1.0px/frame | Tutorial -- learn controls |
| 4-6 | 15 cars | Trucks introduced (slower, wider, block intersection longer) | Easy -- manage mixed speeds |
| 7-10 | 20 cars | Sports cars (speed 2.5px/frame), spawn rate +30% | Medium -- speed pressure |
| 11-15 | 25 cars | Ambulances (ignore red lights), dual lanes on N/S | Hard -- uncontrollable vehicles |
| 16-20 | 30 cars | Dual lanes on all 4 directions, pedestrian crossings | Very hard -- 8 lanes to manage |
| 21-30 | 35 cars | Random light malfunctions (1 light stuck for 3s), speed +50% | Expert -- adapt to chaos |
| 31+ | 40 cars | All mechanics active, spawn rate continues increasing every 5 stages | Endless survival |

### 2.5 Lives and Failure

The player has **3 lives** (displayed as car icons in the HUD). Each crash costs 1 life.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Two perpendicular green lanes have cars collide in intersection | Lose 1 life, crash animation plays | Watch rewarded ad for +1 life (once per game) |
| 3 crashes total | Game over | Watch ad to continue with 1 life (once per game) |
| 8 seconds of no input (inactivity) | ALL lights go green, massive 4-way chain crash, instant game over | None -- inactivity = immediate death |
| Ambulance crashes into stopped traffic | Lose 1 life (ambulance always moves, player must clear path) | Same as normal crash |

**Inactivity Death Detail**: A visible "MALFUNCTION" warning bar fills over 8 seconds (100px wide bar, fills at 12.5px/s). At 6 seconds, the bar turns red and flashes (200ms on/off). At 8 seconds, all lights flash green, all queued cars rush the intersection, and a spectacular multi-car pileup occurs with 3x the normal debris. This is instant game over regardless of remaining lives.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Stages are not level-designed but parameter-driven. Each stage adjusts spawn rates, vehicle mix, speed, and special events based on the stage number.

**Generation Algorithm**:
```
Stage Generation Parameters:
- stage_number: integer, starts at 1
- cars_to_clear: 10 + (stage_number - 1) * 2.5, capped at 40
- spawn_interval_ms: max(600, 2000 - stage_number * 80)
- base_car_speed: 1.0 + stage_number * 0.08, capped at 3.5 px/frame
- vehicle_mix: see Vehicle Mix Table below
- lane_count: 1 per direction for stages 1-10, 2 per direction for stages 11+
- special_event_chance: min(0.15, stage_number * 0.01)
- malfunction_chance: 0 for stages 1-20, min(0.10, (stage_number - 20) * 0.02) for 21+
```

**Vehicle Mix Table** (probability weights per stage range):

| Stage Range | Sedan | Truck | Sports Car | Ambulance |
|------------|-------|-------|------------|-----------|
| 1-3 | 1.0 | 0.0 | 0.0 | 0.0 |
| 4-6 | 0.7 | 0.3 | 0.0 | 0.0 |
| 7-10 | 0.5 | 0.2 | 0.3 | 0.0 |
| 11-15 | 0.4 | 0.2 | 0.2 | 0.2 |
| 16-20 | 0.3 | 0.2 | 0.3 | 0.2 |
| 21+ | 0.25 | 0.2 | 0.3 | 0.25 |

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

| Parameter | Stage 1-3 | Stage 4-6 | Stage 7-10 | Stage 11-15 | Stage 16-20 | Stage 21+ |
|-----------|-----------|-----------|------------|-------------|-------------|-----------|
| Car Speed (px/frame) | 1.0 | 1.3 | 1.6 | 2.0 | 2.5 | 3.0-3.5 |
| Spawn Interval (ms) | 2000 | 1680 | 1360 | 1040 | 800 | 600 |
| Lanes per Direction | 1 | 1 | 1 | 2 (N/S) | 2 (all) | 2 (all) |
| Vehicle Types | Sedan | +Truck | +Sports | +Ambulance | All | All+Malfunction |
| Cars to Clear | 10 | 15 | 20 | 25 | 30 | 40 |
| Malfunction Chance | 0% | 0% | 0% | 0% | 0% | 2-10% |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: The spawn algorithm never spawns cars from all 4 directions simultaneously. At least 1 direction always has a minimum 1500ms gap between spawns, giving the player a "safe" direction to keep green. The spawn scheduler enforces this by reserving one direction as "cool" for each spawn cycle.
2. **Variety Threshold**: The spawn direction is pseudo-random but weighted to avoid 3+ consecutive spawns from the same direction. Each spawn picks the direction with the highest "pressure" (most time since last spawn from that direction).
3. **Difficulty Monotonicity**: Speed and spawn rate never decrease between stages. Vehicle mix only adds types, never removes them.
4. **Rest Beats**: Every 5th stage (5, 10, 15, 20...) starts with a 3-second grace period where no cars spawn, letting the player breathe and read the "Stage X" announcement.
5. **Boss Stages**: Every 10th stage (10, 20, 30...) triggers a "Rush Hour" event: 5-second burst where spawn rate doubles and all directions are active. Surviving the rush clears the stage with a 500-point Rush Hour Bonus.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Flat, bold, cartoonish top-down view with thick outlines and exaggerated proportions. Inspired by Crossy Road's chunky aesthetic but viewed from above. Vehicles are simplified blocky shapes with personality (trucks have angry eyes, sports cars have flames). The intersection is a clean grid with bright road markings.

**Aesthetic Keywords**: Chunky, Colorful, Slapstick, Clean, Exaggerated

**Reference Palette**: Playful urban -- bright roads against dark asphalt, neon traffic lights, candy-colored cars. The mood is "Saturday morning cartoon traffic chaos."

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Road Surface | Dark Asphalt | #2D2D2D | Road background |
| Road Lines | White/Yellow | #FFFFFF / #FFD700 | Lane markings, crosswalks |
| Sidewalk | Light Gray | #B8B8B8 | Sidewalk borders around intersection |
| Grass/Border | Muted Green | #4CAF50 | Corner areas outside intersection |
| Traffic Green | Bright Green | #00E676 | Green light state |
| Traffic Red | Bright Red | #FF1744 | Red light state |
| Traffic Yellow | Amber | #FFD600 | Light transition flash (200ms) |
| Sedan Body | Sky Blue | #42A5F5 | Default sedan color |
| Truck Body | Orange | #FF9800 | Truck color |
| Sports Car Body | Hot Pink | #E91E63 | Sports car color |
| Ambulance Body | White+Red | #FFFFFF / #D32F2F | Ambulance with red cross |
| Crash Explosion | Bright Orange | #FF6D00 | Explosion flash |
| Crash Debris BG | Yellow | #FFEB3B | Debris particle base |
| UI Text | White | #FFFFFF | Score, stage, labels |
| UI Background | Dark Overlay | #000000CC | Menu/pause overlays (80% opacity) |
| Combo Text | Gold | #FFD700 | Combo counter |
| Danger Warning | Pulsing Red | #FF1744 | Malfunction bar, inactivity warning |
| HUD Bar BG | Semi-transparent | #00000066 | Top bar background |

### 4.3 SVG Specifications

All game graphics are SVG strings defined in `config.js`, registered as base64 textures in BootScene.

**Sedan (top-down, 24x40px viewBox)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 40">
  <rect x="2" y="4" width="20" height="32" rx="6" fill="#42A5F5" stroke="#1565C0" stroke-width="2"/>
  <rect x="5" y="6" width="14" height="8" rx="2" fill="#90CAF9"/>
  <rect x="5" y="26" width="14" height="6" rx="2" fill="#90CAF9"/>
  <circle cx="6" cy="4" r="2" fill="#FFD600"/>
  <circle cx="18" cy="4" r="2" fill="#FFD600"/>
  <circle cx="6" cy="36" r="2" fill="#FF1744"/>
  <circle cx="18" cy="36" r="2" fill="#FF1744"/>
</svg>
```

**Truck (top-down, 28x48px viewBox)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 48">
  <rect x="2" y="2" width="24" height="44" rx="4" fill="#FF9800" stroke="#E65100" stroke-width="2"/>
  <rect x="4" y="4" width="20" height="10" rx="2" fill="#FFE0B2"/>
  <rect x="4" y="18" width="20" height="26" rx="1" fill="#F57C00"/>
  <circle cx="6" cy="2" r="2.5" fill="#FFD600"/>
  <circle cx="22" cy="2" r="2.5" fill="#FFD600"/>
  <circle cx="8" cy="46" r="3" fill="#333"/>
  <circle cx="20" cy="46" r="3" fill="#333"/>
</svg>
```

**Sports Car (top-down, 22x36px viewBox)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 36">
  <rect x="2" y="2" width="18" height="32" rx="8" fill="#E91E63" stroke="#880E4F" stroke-width="2"/>
  <rect x="5" y="5" width="12" height="7" rx="3" fill="#F48FB1"/>
  <rect x="5" y="24" width="12" height="5" rx="2" fill="#F48FB1"/>
  <line x1="4" y1="16" x2="18" y2="16" stroke="#880E4F" stroke-width="1"/>
  <circle cx="5" cy="2" r="1.5" fill="#FFD600"/>
  <circle cx="17" cy="2" r="1.5" fill="#FFD600"/>
</svg>
```

**Ambulance (top-down, 26x44px viewBox)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 44">
  <rect x="2" y="2" width="22" height="40" rx="5" fill="#FFFFFF" stroke="#D32F2F" stroke-width="2"/>
  <rect x="8" y="16" width="10" height="3" fill="#D32F2F"/>
  <rect x="11" y="13" width="4" height="9" fill="#D32F2F"/>
  <rect x="4" y="4" width="18" height="8" rx="2" fill="#BBDEFB"/>
  <circle cx="6" cy="6" r="2" fill="#2196F3"/>
  <circle cx="20" cy="6" r="2" fill="#FF1744"/>
</svg>
```

**Traffic Light Button (single direction, 60x60px viewBox)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
  <rect x="5" y="5" width="50" height="50" rx="10" fill="#333333" stroke="#555555" stroke-width="3"/>
  <circle cx="30" cy="20" r="10" fill="${red_active ? '#FF1744' : '#4A0000'}"/>
  <circle cx="30" cy="42" r="10" fill="${green_active ? '#00E676' : '#003300'}"/>
</svg>
```
(Active color is swapped dynamically via tint or by switching between two pre-registered textures: `light_red` and `light_green`.)

**Crash Debris Items** (individual SVGs, 16x16px viewBox each):

Rubber Duck:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <ellipse cx="8" cy="10" rx="6" ry="5" fill="#FFD600"/>
  <circle cx="8" cy="5" r="4" fill="#FFD600"/>
  <circle cx="6" cy="4" r="1" fill="#333"/>
  <polygon points="10,5 14,4 10,6" fill="#FF9800"/>
</svg>
```

Pizza Slice:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <polygon points="8,1 1,15 15,15" fill="#FFD54F" stroke="#F57F17" stroke-width="1"/>
  <circle cx="6" cy="10" r="1.5" fill="#D32F2F"/>
  <circle cx="10" cy="11" r="1.5" fill="#D32F2F"/>
  <circle cx="8" cy="7" r="1.5" fill="#D32F2F"/>
</svg>
```

Toilet Seat:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <ellipse cx="8" cy="9" rx="6" ry="5" fill="none" stroke="#ECEFF1" stroke-width="3"/>
  <rect x="5" y="2" width="6" height="4" rx="1" fill="#ECEFF1"/>
</svg>
```

Banana Peel:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <path d="M4,14 Q2,8 6,4 Q8,2 10,4 Q14,8 12,14 Z" fill="#FFD600" stroke="#F9A825" stroke-width="1"/>
  <path d="M6,12 Q5,8 7,5" fill="none" stroke="#FFF9C4" stroke-width="1"/>
</svg>
```

Coffee Cup:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect x="4" y="4" width="8" height="10" rx="1" fill="#795548"/>
  <rect x="5" y="2" width="6" height="3" rx="1" fill="#8D6E63"/>
  <ellipse cx="8" cy="4" rx="4" ry="1.5" fill="#4E342E"/>
  <path d="M12,7 Q15,7 14,10 Q13,12 12,11" fill="none" stroke="#795548" stroke-width="1.5"/>
</svg>
```

**Design Constraints**:
- All SVG elements use basic shapes (rect, circle, ellipse, polygon, line, path) -- max 10 elements per SVG
- Cars are rotated via Phaser's `setAngle()` based on travel direction (0=North/up, 90=East/right, 180=South/down, 270=West/left)
- Debris SVGs are small (16x16) and spawned as physics-free sprites with random velocity and rotation

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Light toggle flash | Player taps traffic light | Light button scales to 1.3x over 80ms, back to 1.0x over 80ms. Brief yellow flash (200ms) between red/green transition. |
| Car passing glow | Car exits intersection safely | Thin green trail (3px wide, 40px long) behind car, fades over 300ms. |
| Near-miss spark | Two cars pass within 20px | 8 yellow spark particles (#FFD600) burst from near-miss point, lifespan 400ms, radial spread 60px. |
| Crash explosion | Two cars collide | See Juice Specification Section 9 for full detail. |
| Combo counter pulse | Combo increases | Combo text scales 1.4x over 100ms, returns to 1.0x over 100ms. At combo 10+: text color cycles gold/white every 150ms. At combo 20+: glow effect (text shadow 0 0 8px #FFD700). |
| Stage transition | Stage cleared | "STAGE X" text flies in from top (y: -50 to center over 400ms, ease: bounce), holds 1500ms, fades over 300ms. All cars pause during announcement. |
| Malfunction warning | Inactivity > 3s | Red border vignette pulses at edges of screen (opacity 0 to 0.4, 500ms cycle). "MALFUNCTION" bar fills top of screen. |
| Rush Hour flash | Boss stage begins | Screen border flashes orange 3 times (150ms on, 150ms off). "RUSH HOUR!" text shakes violently (random offset +/-4px every 50ms for 800ms). |

---

## 5. Audio Design

### 5.1 Sound Effects

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Light toggle | Satisfying mechanical click-clunk | 120ms | High |
| Car passes safely | Quick whoosh (pitch varies by car speed) | 200ms | Low |
| Near-miss | Tire screech + horn honk | 350ms | High |
| Crash (normal) | Crunchy metal impact + glass shatter + cartoon boing | 500ms | High |
| Crash (chain/inactivity) | Extended crash with multiple impacts cascading | 1200ms | High |
| Combo milestone (every 5) | Ascending chime, pitch +10% per 5 combo | 300ms | Medium |
| Stage clear | Triumphant 3-note fanfare | 600ms | High |
| Rush Hour start | Air raid siren (short) | 800ms | High |
| Game over | Descending trombone "wah wah wah" | 1000ms | High |
| Ambulance approach | Siren wail (looping while on screen) | Loop | Medium |
| Emergency stop (double-tap) | Heavy brake slam | 250ms | High |
| Malfunction warning | Electrical buzzing, intensifies over 8s | Loop | Medium |
| UI button press | Soft click | 80ms | Low |
| New high score | Celebratory jingle with confetti pop | 1500ms | High |

### 5.2 Music Concept

**Background Music**: No continuous BGM -- the game's audio landscape is built from the layered sounds of traffic (engine hums, honks, screeches) that intensify with difficulty. This creates an emergent "music" from gameplay itself and avoids audio fatigue in short sessions.

**Music State Machine**:

| Game State | Audio Behavior |
|-----------|---------------|
| Menu | Low ambient traffic hum loop, 4s duration |
| Stage 1-5 | Sparse traffic sounds, occasional distant honk |
| Stage 6-15 | Denser traffic layer, engine hum undertone |
| Stage 16+ | Full chaos: overlapping honks, screeches, engine roar |
| Rush Hour | All traffic audio pitches up 20%, additional urgency tone |
| Game Over | All traffic fades out over 500ms, somber sting plays |
| Pause | Audio volume drops to 20% |

**Audio Implementation**: Phaser's built-in audio manager. No Howler.js needed -- keeps CDN dependencies minimal. All sounds are generated procedurally using Web Audio API oscillators for simple effects (clicks, chimes, whooshes) defined as functions in `config.js`.

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Boot    │----→│   Menu   │----→│   Game   │
│  Scene   │     │  Screen  │     │  Screen  │
└──────────┘     └─────┬────┘     └──────────┘
                    │   │                │
               ┌────┘   │           ┌────┴────┐
               │        │           │  Pause  │──→┌─────────┐
          ┌────┴────┐   │           │ Overlay │   │  Help   │
          │  Help   │   │           └────┬────┘   │How 2Play│
          │How 2Play│   │                │        └─────────┘
          └─────────┘   │           ┌────┴────┐
                   ┌────┴────┐      │  Game   │
                   │Settings │      │  Over   │
                   │ Overlay │      │ Screen  │
                   └─────────┘      └────┬────┘
                                         │
                                    ┌────┴────┐
                                    │ Ad/     │
                                    │Continue │
                                    │ Prompt  │
                                    └─────────┘
```

### 6.2 HUD Layout

```
┌─────────────────────────────────┐
│ Score: 2450  x7 COMBO  ♥♥♥     │  ← Top HUD bar (40px height, #00000066 bg)
├─────────────────────────────────┤
│              [N]                │  ← N traffic light button (60x60)
│               |                 │
│               |                 │
│  [W]----[INTERSECTION]----[E]  │  ← Game area (intersection centered)
│               |                 │
│               |                 │
│              [S]                │  ← S traffic light button (60x60)
│                                 │
│        Stage 7                  │  ← Stage indicator (bottom-left)
│           [MALFUNCTION BAR]     │  ← Inactivity warning (bottom, hidden until active)
└─────────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left (x:10, y:8) | "Score: {N}" white 20px font | Every score event |
| Combo | Top-center (x:center, y:8) | "x{N} COMBO" gold 18px font, hidden when combo=0 | Every safe car pass |
| Lives | Top-right (x:right-10, y:8) | 3 car icons (filled=#42A5F5, empty=#555) 20x20px each | On crash |
| Stage | Bottom-left (x:10, y:bottom-30) | "Stage {N}" white 16px font | On stage change |
| Malfunction Bar | Bottom-center (y:bottom-12) | Red bar, 100px wide, fills over 8s | Every frame during inactivity |
| Light buttons | Outside intersection edges | 60x60px traffic light icons | On toggle |
| Emergency Stop indicator | Center of intersection | Small circular icon, grayed when on cooldown | On use / cooldown end |

### 6.3 Menu Structure

**Main Menu**:
- Game title "TRAFFIC LIGHT CONDUCTOR" (bold 28px, white, with slight text shadow)
- Subtitle one-liner in smaller text (14px, #B0BEC5)
- "PLAY" button (200x60px, green #00E676 bg, white text, rounded 12px corners, center of screen)
- "?" Help button (44x44px circle, top-right, #42A5F5 bg)
- Settings gear icon (44x44px, top-left, #78909C)
- High Score display (below play button, "Best: {N}", gold #FFD700, 16px)
- Sound toggle (speaker icon, bottom-right, 44x44px)
- Background: animated mini-intersection with cars slowly crossing (decorative, non-interactive)

**Pause Menu** (overlay, #000000CC background):
- "PAUSED" title (32px, white)
- Resume button (180x50px, green #00E676)
- "?" How to Play button (180x50px, blue #42A5F5)
- Restart button (180x50px, orange #FF9800)
- Quit to Menu button (180x50px, gray #78909C)
- Buttons stacked vertically with 16px gap

**Game Over Screen** (overlay, #000000CC background):
- "GAME OVER" title (36px, white, drops in from top over 400ms)
- Crash cause text (16px, #B0BEC5, e.g., "3 crashes!" or "MALFUNCTION!")
- Final Score (48px, white, counts up from 0 over 800ms)
- High Score indicator ("NEW BEST!" flashing gold if applicable)
- Stage Reached ("Stage {N}", 18px, #B0BEC5)
- Cars Passed stat ("Cars Saved: {N}", 16px)
- Best Combo stat ("Best Combo: x{N}", 16px)
- "Watch Ad to Continue" button (200x50px, gold #FFD700 bg, if available)
- "Play Again" button (200x50px, green #00E676)
- "Menu" button (200x50px, gray #78909C)
- Buttons at bottom with 12px gap

**Help / How to Play Screen** (full overlay scene):
- Title: "HOW TO PLAY" (24px, white)
- Section 1 -- Visual diagram: SVG illustration of intersection with arrows showing car flow, tap indicators on traffic lights, green checkmark on parallel flow, red X on perpendicular conflict
- Section 2 -- Rules:
  - "Tap traffic lights to toggle GREEN/RED"
  - "Cars on GREEN flow through the intersection"
  - "Never let perpendicular cars cross at the same time!"
  - "N+S can be green together (parallel)"
  - "N+E, N+W, S+E, S+W = CRASH!"
- Section 3 -- Scoring:
  - "Each safe pass = points"
  - "Keep traffic flowing for COMBO bonus"
  - "3 crashes = Game Over"
- Section 4 -- Tips:
  - "Double-tap center for EMERGENCY STOP"
  - "Watch out for ambulances -- they ignore red lights!"
  - "Don't idle! Lights malfunction after 8 seconds"
- "GOT IT!" button (180x50px, green #00E676, bottom)
- Scrollable if content exceeds viewport
- Uses game's color palette and includes miniature SVG car/light assets

**Settings Screen** (overlay):
- Sound Effects: On/Off toggle
- Vibration: On/Off toggle

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after death (restore 1 life) | Every game over | Always (optional) |
| Rewarded | Double final score | End of session (game over screen) | Always (optional) |
| Banner | Menu screen only | Always visible on menu | N/A |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Life | Watch rewarded ad after game over | +1 life, resume from current stage | Once per game session |
| Score Doubler | Watch rewarded ad at game over screen | 2x final score (affects high score) | Once per game session |

### 7.3 Session Economy

The game balances free play with light monetization. Average session: 3 minutes of gameplay, 1-2 game overs. Player sees at most 1 interstitial per session. Rewarded ads are purely optional and provide meaningful but not game-breaking benefits.

**Session Flow with Monetization**:
```
[Play Free] --> [3 Crashes] --> [Game Over]
                                     |
                          [Rewarded Ad: Continue? (+1 life)]
                                │ Yes --> [Resume, Interstitial queued]
                                │ No  --> [Game Over Screen]
                                               |
                                    [Interstitial (every 3rd game over)]
                                               |
                                    [Rewarded Ad: Double Score?]
                                          │ Yes --> [Score doubled, save high score]
                                          │ No  --> [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/traffic-light-conductor/
├── index.html              # Entry point, CDN Phaser 3, script load order
│   ├── CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
│   ├── Local CSS           # css/style.css
│   └── Local JS (ordered)  # config → game → stages → ads → help → ui → main (LAST)
├── css/
│   └── style.css           # Responsive styles, mobile-first, portrait lock
└── js/
    ├── config.js           # Colors, SVG strings, difficulty tables, scoring constants
    ├── game.js             # GameScene: intersection, cars, lights, collisions, input
    ├── stages.js           # Stage generation params, vehicle mix, difficulty scaling
    ├── ads.js              # Ad SDK hooks, reward callbacks, frequency tracking
    ├── help.js             # HelpScene: illustrated how-to-play with SVG diagrams
    ├── ui.js               # MenuScene, GameOverScene, HUD overlay, pause, settings
    └── main.js             # BootScene (register textures), Phaser.Game init, scene array (LOADS LAST)
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `COLORS` object: all hex codes from color palette
- `SCORING` object: point values, combo multiplier formula, cap
- `DIFFICULTY` object: stage parameter tables (speed, spawn interval, vehicle mix, lane count)
- `VEHICLES` object: type definitions (sedan, truck, sports_car, ambulance) with speed multipliers, widths, SVG keys
- `SVG_STRINGS` object: all SVG source strings for vehicles, lights, debris items
- `DEBRIS_ITEMS` array: list of debris SVG keys and funny names
- `TIMING` object: inactivity_death_ms (8000), malfunction_warning_ms (6000), light_transition_ms (200), emergency_stop_cooldown_ms (3000)
- `LAYOUT` object: intersection position, road widths, light button positions, HUD positions

**game.js** (max 300 lines):
- `GameScene` extends `Phaser.Scene`
- `create()`: Draw intersection (roads, markings), create 4 traffic light buttons with tap handlers, initialize car spawn timers, set up collision detection zones, register inactivity timer
- `update()`: Move all active cars based on their speed and direction, check intersection collision zones (perpendicular cars overlapping = crash), remove cars that exit screen, update malfunction bar, check stage clear condition
- `toggleLight(direction)`: Toggle specified direction green/red. If toggling to green, check if perpendicular direction is also green -- if so, allow it (collision will be detected when cars actually overlap, not on toggle). Flash yellow for 200ms transition.
- `spawnCar(direction, vehicleType)`: Create car sprite at edge, set velocity based on direction and speed. Trucks: speed x0.6. Sports cars: speed x1.8. Ambulances: speed x1.0, ignore red (always move).
- `checkCollision()`: For each car in intersection zone, check if any car from a perpendicular direction is also in the zone. If overlap detected (bounding box intersection with 8px tolerance), trigger crash.
- `triggerCrash(car1, car2)`: Play crash effects (see Juice spec), spawn debris, decrement lives, reset combo. If lives=0, transition to GameOverScene.
- `resetInactivityTimer()`: Called on every tap. Resets 8s countdown.
- Input: `this.input.on('pointerdown', ...)` on light button sprites.

**stages.js** (max 300 lines):
- `getStageParams(stageNumber)`: Returns object with cars_to_clear, spawn_interval_ms, base_car_speed, vehicle_mix_weights, lane_count, malfunction_chance, is_rush_hour
- `getVehicleMix(stageNumber)`: Returns weighted random vehicle type based on stage
- `getSpawnDirection(recentSpawns)`: Returns next spawn direction using pressure-weighted algorithm (avoids 3+ consecutive same direction, ensures 1 direction always has gap)
- `isRushHour(stageNumber)`: Returns true for stages divisible by 10
- `advanceStage(scene)`: Increments stage counter, shows stage announcement, applies rest beat for every 5th stage. Uses `stageTransitioning` flag to prevent double-advance.

**ui.js** (max 300 lines):
- `MenuScene`: Title, play button, high score display, help/settings buttons, decorative background intersection
- `GameOverScene`: Score count-up animation, stats display, high score check, continue/play-again/menu buttons
- `HUDOverlay`: Score text, combo display, lives icons, stage indicator -- all created as GameScene UI layer elements
- `PauseOverlay`: Semi-transparent overlay with resume/restart/help/quit buttons
- `SettingsOverlay`: Sound and vibration toggles with localStorage persistence
- Button factory: `createButton(scene, x, y, width, height, text, color, callback)` -- standardized button creation with 44px min touch target

**help.js** (max 300 lines):
- `HelpScene`: Full-screen overlay with illustrated instructions
- SVG diagram of intersection with animated arrows showing safe (parallel) and dangerous (perpendicular) light combinations
- Visual touch indicators on traffic light positions
- Rule list with icons
- Tips section
- "GOT IT!" dismiss button
- Accessible from both MenuScene and PauseOverlay

**ads.js** (max 300 lines):
- `AdManager` class: tracks game_over_count, last_interstitial_time
- `showInterstitial()`: Placeholder -- called every 3rd game over
- `showRewarded(type, callback)`: Placeholder -- type is 'continue' or 'double_score', callback receives reward
- `showBanner()` / `hideBanner()`: Placeholder -- menu screen only
- All methods are no-ops in POC (no actual ad SDK integrated)

**main.js** (max 300 lines -- LOADS LAST):
- `BootScene`: Reads all SVG strings from `CONFIG.SVG_STRINGS`, encodes to base64, calls `this.textures.addBase64()` for each. Listens for all `addtexture` events, starts MenuScene when all textures loaded.
- Phaser.Game config: type AUTO, scale mode FIT, parent 'game-container', backgroundColor '#2D2D2D', scene array [BootScene, MenuScene, HelpScene, GameScene, GameOverScene]
- `GameState` global: score, highScore, stage, lives, combo, gamesPlayed, settings. Loaded from localStorage on boot.

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No additional CDN dependencies. Audio via Web Audio API (Phaser built-in).

---

## 9. Juice Specification

### 9.1 Player Input Feedback (every traffic light tap)

| Effect | Target | Values |
|--------|--------|--------|
| Scale punch | Tapped light button | Scale: 1.3x, Duration: 80ms out + 80ms back (160ms total), Ease: Quad.easeOut |
| Light transition flash | Light circle | Yellow (#FFD600) flash for 200ms before switching to new color |
| Particles | Light button position | Count: 6, Color: #FFD600 (yellow sparks), Direction: radial, Speed: 40-80px/s, Lifespan: 300ms, Size: 3px circles |
| Haptic | Device | `navigator.vibrate(15)` -- 15ms micro-vibration |
| Sound | -- | Mechanical click-clunk, 120ms |

### 9.2 Core Action Feedback -- Safe Car Pass

| Effect | Values |
|--------|--------|
| Score float text | "+{N}" at car exit position, Color: #00E676, Size: 16px, Float up 50px over 500ms, Fade from 1.0 to 0.0 over last 200ms |
| Car exit trail | Green trail (#00E676), 3px wide, 40px long behind car, fades over 300ms |
| Combo counter punch | Combo text scales 1.4x over 100ms, returns 1.0x over 100ms |
| Combo milestone (every 5) | At combo 5/10/15/etc: combo text flashes white 3 times (80ms on/off), ascending chime at pitch = base_pitch * (1 + combo*0.02) |
| Combo 10+ glow | Text shadow: `0 0 8px #FFD700`, persistent until combo resets |
| Combo 20+ shake | Combo text random offset +/-2px every 80ms (excitement shake) |

### 9.3 Core Action Feedback -- Near Miss

| Effect | Values |
|--------|--------|
| Spark particles | Count: 8, Color: #FFD600, Direction: radial from near-miss point, Speed: 80-120px/s, Lifespan: 400ms, Size: 4px |
| Score float text | "+25 CLOSE!" at near-miss point, Color: #FFD600, Size: 20px (larger than normal), Float up 60px over 600ms |
| Camera shake | Intensity: 2px, Duration: 100ms (subtle warning shake) |
| Sound | Tire screech + horn honk, 350ms |
| Haptic | `navigator.vibrate(25)` |

### 9.4 Crash Effects (the HUMOR hook -- make this spectacular)

| Effect | Values |
|--------|--------|
| Hit-stop | 60ms physics pause (all cars freeze). Use `setTimeout()` NOT `delayedCall()` to resume. |
| Camera shake | Intensity: 12px, Duration: 400ms, Decay: exponential |
| Screen flash | Full-screen white overlay (#FFFFFF), opacity 0.8 to 0.0 over 150ms |
| Explosion sprite | Orange circle (#FF6D00) at crash point, scales from 0.5x to 2.5x over 200ms, fades over 300ms |
| Debris spawn | Count: 8-12 random debris items (rubber duck, pizza, toilet seat, banana, coffee cup), spawn at crash point, random velocity 100-250px/s in random directions, random rotation speed 180-720 deg/s, gravity pull down at 200px/s^2, lifespan 1200ms, fade out over last 300ms |
| Car destruction | Both crashed cars scale to 1.5x over 100ms, tint red (#FF1744), then fade to 0 over 400ms |
| Smoke puffs | 4 gray (#9E9E9E) circles at crash point, scale from 8px to 24px over 600ms, opacity 0.6 to 0.0, drift upward at 30px/s |
| Sound | Crunchy metal + glass shatter + cartoon boing, 500ms |
| Haptic | `navigator.vibrate([30, 20, 50])` -- two-pulse heavy vibration |
| Combo reset | Combo text (if active) shatters: splits into 4 fragments flying outward, 400ms |
| Life icon | Lost life icon shakes (4px, 200ms), then grays out (#555) with scale-down to 0.8x |
| Effect-to-resume delay | Total crash sequence: 800ms before gameplay resumes (60ms hitstop + 400ms shake + 340ms settle) |

### 9.5 Chain Crash / Inactivity Death (the BIG spectacle)

| Effect | Values |
|--------|--------|
| Malfunction sequence | All 4 lights flash green simultaneously 3 times (150ms on/off) over 900ms |
| Multi-crash | All queued cars rush intersection, 4+ crashes trigger in rapid sequence (200ms apart) |
| Each crash | Same as normal crash effects but debris count doubled (16-24 items per crash) |
| Final explosion | After last crash: massive white flash, 15px camera shake for 600ms, all debris lingers on screen |
| Slow-motion | Last 500ms of chain crash plays at 0.3x speed (use Phaser timeScale on physics group only, NOT scene timeScale) |
| Sound | Extended multi-impact crash cascade, 1200ms |
| Screen tint | Gradual red tint overlay, opacity 0.0 to 0.3 over 1000ms, holds through game over transition |
| Transition delay | 1500ms from chain crash start to game over screen |

### 9.6 Death/Failure to Game Over

| Effect | Values |
|--------|--------|
| Final crash effects | As described in 9.4 (normal) or 9.5 (chain) |
| Screen desaturation | Game area desaturates to 40% over 500ms (CSS filter or Phaser pipeline) |
| Game over text entry | "GAME OVER" drops from y:-50 to center over 400ms, ease: Bounce.easeOut |
| Score count-up | Score counts from 0 to final over 800ms (increment = finalScore / 48 per frame at 60fps) |
| Death to restart | **Under 2 seconds** -- "Play Again" button appears at 1200ms after death, tap immediately restarts |

### 9.7 Stage Clear Effects

| Effect | Values |
|--------|--------|
| All cars clear | Remaining cars accelerate to 3x speed and exit screen over 500ms |
| Stage text | "STAGE {N}" text, 36px bold white, enters from top (y:-40 to center over 400ms, ease: Bounce.easeOut) |
| Background flash | Intersection briefly flashes bright (#4CAF50 green tint) for 200ms |
| Sound | Triumphant 3-note fanfare, 600ms |
| Perfect bonus | If 0 crashes in stage: golden particle burst (30 particles, #FFD700, radial, 1000ms lifespan), "+{N} PERFECT!" text in gold |
| Rest beat | 3-second pause before next stage begins (every 5th stage) |
| Rush Hour intro | "RUSH HOUR!" text in red (#FF1744), 40px, shakes +/-4px every 50ms for 800ms, siren sound |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | Performance.timing API |
| Memory Usage | <80MB | Chrome DevTools Memory panel |
| JS Bundle Size | <200KB total (excl. CDN) | File size check |
| Max Active Sprites | <60 simultaneously | Object pool reuse |
| First Interaction | <1 second after load | Time to first paint |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser `pointer` events for cross-device compatibility
- **Prevent Default**: Disable pull-to-refresh, pinch-zoom, double-tap-zoom via CSS `touch-action: none` on game container
- **Orientation**: Portrait lock via CSS. On landscape detection, show "Please rotate" overlay using `visibility:hidden; height:0; overflow:hidden` pattern (NEVER `display:none` on Phaser canvas)
- **Safe Areas**: `env(safe-area-inset-top)` padding for notch devices
- **Background Detection**: `document.addEventListener('visibilitychange', ...)` to pause game and mute audio when backgrounded
- **Object Pooling**: Car sprites reused from pool (max 20 cars). Debris sprites pooled (max 30). Particles use Phaser emitter with pool.
- **SVG Textures**: All SVGs registered once in BootScene via `addBase64()`. NEVER re-register on scene restart.

### 10.3 Touch Controls

- **Touch Target Size**: All buttons minimum 44x44px. Traffic light buttons 60x60px.
- **Gesture Recognition**: Single tap only. Double-tap on center intersection (80x80px zone) for emergency stop. No swipes, no holds, no multi-touch.
- **Feedback**: Every tap produces visual (scale punch), audio (click), and haptic (vibrate) feedback. No silent taps.
- **Input Buffering**: If player taps during crash animation (800ms lock), buffer the tap and execute on resume.
- **Dead Zone**: 8px dead zone around each light button to prevent accidental adjacent button taps.
- **Tap Debounce**: 100ms debounce per light button to prevent double-toggle on single tap.

### 10.4 Collision Detection

- **Intersection Zone**: A rectangular zone at the center of the screen (width: road_width x 2, height: road_width x 2). Cars are "in the intersection" when their center point is within this zone.
- **Collision Check**: Every frame, iterate all cars in the intersection zone. For each car, check if any car from a perpendicular direction is also in the zone. Two cars collide if their bounding boxes overlap with an 8px shrink tolerance (prevents edge-case pixel-perfect misses -- addresses Devil judge feedback about tight collision).
- **Ambulance Exception**: Ambulances are always moving. If an ambulance enters the intersection while a perpendicular car is also there, it counts as a crash (the player should have cleared the perpendicular direction before the ambulance arrived).
- **No Phase-Through**: Cars stop at red lights at a fixed stop line position (50px before intersection edge). Cars never enter the intersection on red. This prevents any exploit where cars "phase through" during light transitions. The 200ms yellow transition period sets the light to red immediately (cars stop) while the visual transitions.

### 10.5 Local Storage Schema

```json
{
  "traffic_light_conductor_high_score": 0,
  "traffic_light_conductor_games_played": 0,
  "traffic_light_conductor_highest_stage": 0,
  "traffic_light_conductor_best_combo": 0,
  "traffic_light_conductor_total_cars_saved": 0,
  "traffic_light_conductor_total_crashes": 0,
  "traffic_light_conductor_settings": {
    "sound": true,
    "vibration": true
  }
}
```

### 10.6 Critical Implementation Guards

1. **Stage transition flag**: Use `this.stageTransitioning = true` flag in `advanceStage()` to prevent double-advance when timer/counter hits threshold on consecutive frames.
2. **Game over flag ordering**: Set `this.gameOver = true` BEFORE triggering crash animation sequence. All update() logic checks `if (this.gameOver) return;` at top.
3. **Inactivity timer reset**: Reset timer on EVERY `pointerdown` event, not just successful light toggles. Prevents death during crash animations when input is locked.
4. **Texture registration**: All `addBase64()` calls in BootScene only. GameScene `create()` never registers textures. On restart, `scene.restart()` does not re-run BootScene.
5. **Car cleanup**: Cars that exit the screen are immediately destroyed and returned to pool. Never accumulate off-screen cars.
6. **Score display init**: Always initialize score text with `GameState.score` variable, never with literal `'0'` string. Prevents stale display on restart.
7. **Perpendicular check on toggle**: When player toggles a light to green, do NOT auto-red the perpendicular direction. Let the player manage it. But DO prevent the same light from being toggled during the 200ms yellow transition (debounce).
8. **Emergency stop cooldown**: Track `lastEmergencyStopTime`. Disable double-tap zone during 3000ms cooldown. Show cooldown indicator (gray overlay on center zone, radial fill animation).
