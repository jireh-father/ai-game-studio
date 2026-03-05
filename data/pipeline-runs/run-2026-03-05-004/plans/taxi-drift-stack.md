# Game Design Document: Taxi Drift Stack

**Slug**: `taxi-drift-stack`
**One-Liner**: Hold to drift a taxi around corners, release to fling passengers onto rooftop targets
**Core Mechanic**: Hold screen to drift taxi around tight corners. Release at right moment to launch passengers to rooftop targets. Score based on landing accuracy. Curves tighten + speed increases 5%/stage. Miss-timing = crash.
**Target Session Length**: 60-120 seconds
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Taxi Drift Stack is a one-finger timing game where the player controls a taxi speeding through a city of tight corners. Holding the screen initiates a drift around each curve — the taxi slides sideways, building centrifugal force. Releasing at the precise moment flings a passenger off the roof, arcing through the air toward a rooftop landing target. Land the passenger on the bullseye for maximum points; miss the building entirely and lose a life.

The feel is a mashup of drift racing tension and Angry Birds launch satisfaction. Each corner is a micro-puzzle: hold too long and the taxi spins out into a wall (crash, lose life). Release too early and the passenger undershoots. The sweet spot shrinks as speed increases 5% per stage and curves tighten. By stage 20, the player is threading needles at breakneck speed — pure flow state.

What makes this addictive is the dual satisfaction loop: the drift itself feels great (tire screech particles, camera shake, speed lines), and the passenger launch payoff is a separate dopamine hit (arc trail, landing impact, score pop). Two juicy moments per corner, every 3-4 seconds.

### 1.2 Target Audience

Casual mobile gamers aged 13-35. Perfect for short bursts on commutes, in queues, or on the couch. Players who enjoyed Sling Drift, Drift n Run, or any hold-to-charge mechanic will instantly understand the input. Zero learning curve — hold and release is the entire vocabulary.

### 1.3 Core Fantasy

The player is a reckless taxi driver pulling impossible drift stunts through a neon city, flinging passengers onto rooftops like a human catapult. It is absurd, physical, and satisfying. The fantasy is precision-under-pressure — threading a drift at impossible speed and nailing the perfect passenger launch.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 90 seconds |
| Day 1 Retention | 42%+ |
| Day 7 Retention | 20%+ |
| Average Stages per Session | 8-15 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Enter Corner] --> [HOLD to Drift] --> [RELEASE to Launch Passenger]
      ^                                          |
      |              +--- MISS TARGET -----------+--- HIT TARGET ---+
      |              |                                               |
      |              v                                               v
      |       [Lose 1 Life]                                  [Score + Next Corner]
      |              |                                               |
      |     [Lives > 0? Continue]                                    |
      |              |                                               |
      +-------- YES -+-----------------------------------------------+
                     |
                [Lives = 0]
                     |
              [Game Over Screen]
```

Moment-to-moment: The taxi auto-drives forward along a road. As it approaches a corner, the player holds the screen. The taxi begins drifting — sliding sideways around the curve with visible skid marks and tire smoke. While holding, the launch power meter fills (shown as a glowing arc indicator on the passenger). Releasing the screen simultaneously straightens the taxi and flings the current passenger toward the nearest rooftop target. The passenger arcs through the air with a trail effect, landing (or missing) the target zone. A new passenger immediately appears on the taxi roof for the next corner.

**Over-drift crash**: If the player holds too long (past the curve exit), the taxi spins out and slams into the wall. This costs 1 life. The taxi respawns at the next corner after a 0.8s delay.

**Inactivity death**: If the player does not hold at all for 4 seconds, the taxi drives straight into the next wall and crashes. All lives lost (instant game over).

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Drift | Hold anywhere | Taxi enters drift state, sliding around curve. Longer hold = more drift angle + more launch power |
| Launch Passenger | Release hold | Passenger flings toward rooftop target at current power level. Taxi straightens. |
| (Inactivity) | No input for 4s | Taxi crashes into wall, instant game over |

**Control Philosophy**: One finger, one gesture. Hold = drift, release = launch. The entire game is controlled by touch duration. No tapping, no swiping, no dual-touch. This maps perfectly to the physical feeling of "gripping" and "releasing" — intuitive even for first-time players.

**Touch Area Map**:
```
+-----------------------------+
|   Score    Stage    Lives   |  <- Top HUD 50px
+-----------------------------+
|                             |
|      ROAD + TAXI VIEW       |  <- Top-down city view
|      (auto-scrolling)       |
|                             |
|      [DRIFT ARC METER]      |  <- Power indicator on taxi
|                             |
|      [ROOFTOP TARGET]       |  <- Landing zone visible ahead
|                             |
+-----------------------------+
|  ENTIRE SCREEN = HOLD ZONE  |  <- Full screen touch input
+-----------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Bullseye landing (center zone) | 150 | x combo multiplier |
| Good landing (inner ring) | 100 | x combo multiplier |
| OK landing (outer ring) | 50 | x combo multiplier |
| Near miss (hit building edge) | 20 | No multiplier |
| Total miss (off building) | 0 | Combo reset, lose 1 life |
| Perfect drift (held exactly to curve end) | +30 bonus | Added to landing score |
| Stage clear | 200 | + 50 per current combo |

**Combo System**: Consecutive Good or Bullseye landings increment the combo counter. A miss or OK landing resets combo to 0. Combo multiplier = 1 + (combo x 0.15), capped at 3.5x at combo 17.

**High Score**: Stored in localStorage as `taxi-drift-stack_high_score`. Displayed on Game Over screen with animated "NEW RECORD!" flash if beaten.

### 2.4 Progression System

Each stage is one corner + one passenger launch. Speed increases 5% per stage. Curves tighten. Target buildings get smaller or further away.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-5 | Wide curves, large targets, slow speed | Tutorial — learn hold/release timing |
| 6-10 | Medium curves, targets offset further from road | Easy — build accuracy |
| 11-20 | Tight curves, smaller targets, speed noticeable | Medium — precision under speed |
| 21-35 | S-curves (double drift), moving targets | Hard — multi-phase corners |
| 36-50 | Hairpin turns, tiny targets, wind drift on passenger | Very Hard — expert timing |
| 51+ | Random mix of all elements, speed caps at 250% | Extreme — survival endurance |

### 2.5 Lives and Failure

Player starts with 3 lives displayed as taxi icons.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Passenger misses building entirely | Lose 1 life | None (POC) |
| Over-drift (hold past curve exit) | Lose 1 life, taxi wall crash | None (POC) |
| 4 seconds no input (inactivity) | Instant game over (all lives lost) | None |
| All 3 lives lost | Game over screen | Retry from stage 1 |

Death -> Game Over screen in under 1.5 seconds.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each stage is a single road corner with a rooftop target. Road geometry, curve tightness, target position, and target size are procedurally generated from stage number. The view is top-down, auto-scrolling — the taxi always moves forward.

**Generation Algorithm**:
```
Stage Generation Parameters:
- speed: BASE_SPEED * (1 + stage * 0.05), capped at BASE_SPEED * 2.5
- curveAngle: clamp(60 + stage * 2, 60, 150)         // degrees, 60 = gentle, 150 = hairpin
- curveRadius: max(80, 200 - stage * 3)                // px, smaller = tighter
- targetDistance: clamp(120 + stage * 4, 120, 320)      // px from road edge to target center
- targetRadius: max(18, 40 - stage * 0.5)              // px, bullseye zone
- windDrift: stage > 35 ? randomRange(-15, 15) : 0     // px horizontal offset on passenger arc
- isSCurve: stage > 20 && stage % 4 === 0              // double-corner stages
- isMovingTarget: stage > 20 && stage % 5 === 0        // target slides left-right
```

### 3.2 Difficulty Curve

```
Speed (% of base)
    |
250 |                                          ------------ (cap)
    |                                    /
200 |                              /
    |                        /
150 |                  /
    |            /
120 |      /
    |  /
100 |/
    |
    +------------------------------------------ Stage
    0    10    20    30    40    50    60    70+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-5 | Stage 6-15 | Stage 16-30 | Stage 31-50 | Stage 51+ |
|-----------|-----------|------------|-------------|-------------|-----------|
| Speed | 100-125% | 130-175% | 180-250% | 250% | 250% |
| Curve Angle | 60-70 deg | 72-90 deg | 92-120 deg | 122-150 deg | Random 80-150 |
| Curve Radius | 200-185 px | 182-155 px | 152-110 px | 107-80 px | 80 px |
| Target Distance | 120-140 px | 144-180 px | 184-240 px | 244-320 px | Random 150-320 |
| Target Radius | 40-38 px | 37-33 px | 32-25 px | 24-18 px | 18 px |
| New Mechanic | None | Offset targets | Tight + fast | S-curves, moving | Wind + all |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every curve is completable. The drift window (time the player can hold before over-drift) is always at least 400ms even at max speed. Target is always reachable from the release point.
2. **Variety Threshold**: Consecutive stages must differ in at least 2 of: curve direction (left/right), curve tightness, target position (left/right of road), target size.
3. **Difficulty Monotonicity**: Speed never decreases. Curve angle never decreases between stages (local rest variation allowed).
4. **Rest Stages**: Every 8 stages, curve radius increases by 40px and target radius increases by 10px for one stage (breathing room).
5. **Boss Stages**: Every 10 stages (10, 20, 30...), a special S-curve stage with a golden target worth 3x points. Visual: gold particle trail on taxi.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Top-down neon city at night. Flat geometric buildings with glowing edges. Road is dark asphalt with bright lane markings. The taxi is a bold yellow rectangle with headlights. Everything pops against the dark background — drift trails, passenger arcs, and landing impacts are the visual highlights.

**Aesthetic Keywords**: Neon, Night City, Top-Down, Bold, Punchy

**Reference Palette Mood**: Midnight city streets lit by neon signs. Dark blues and purples for background, vivid yellow taxi, bright accent colors for effects and targets.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Deep Night Blue | #0A0E1A | City background, road surface |
| Road Surface | Dark Asphalt | #1A1E2E | Road fill |
| Road Markings | Bright White | #E8E8E8 | Lane lines, road edges |
| Taxi Body | Taxi Yellow | #FFD600 | Player taxi fill |
| Taxi Outline | Dark Gold | #B8960A | Taxi border stroke |
| Building Fill | Slate Blue | #2A3050 | Building rooftops (non-target) |
| Target Building | Neon Cyan | #00E5FF | Active landing target building |
| Bullseye Zone | Hot Pink | #FF2D7B | Center bullseye ring on target |
| Inner Ring | Warm Orange | #FF8C00 | Good landing zone |
| Outer Ring | Muted Teal | #4DB6AC | OK landing zone |
| Passenger | Bright White | #FFFFFF | Passenger dot/figure on taxi roof |
| Drift Trail | Orange Glow | #FF6B00 | Tire smoke / skid marks |
| Danger Flash | Red | #FF1744 | Screen flash on crash/miss |
| Score Text | White | #FFFFFF | HUD score, floating score text |
| Combo Text | Gold | #FFD700 | Combo counter glow |
| UI Overlay | Dark Semi-Trans | #000000CC | Menu backgrounds, pause overlay |

### 4.3 SVG Specifications

All graphics rendered as inline SVG textures registered once in BootScene via `textures.addBase64()`.

**Taxi** (40x24px bounding box, top-down view):
```svg
<svg width="40" height="24" viewBox="0 0 40 24">
  <!-- Body -->
  <rect x="2" y="2" width="36" height="20" rx="4" fill="#FFD600" stroke="#B8960A" stroke-width="2"/>
  <!-- Windshield -->
  <rect x="6" y="4" width="12" height="8" rx="2" fill="#4DB6AC" opacity="0.7"/>
  <!-- Rear window -->
  <rect x="22" y="4" width="12" height="8" rx="2" fill="#4DB6AC" opacity="0.5"/>
  <!-- Headlights -->
  <circle cx="4" cy="6" r="2" fill="#FFFFFF"/>
  <circle cx="4" cy="18" r="2" fill="#FFFFFF"/>
  <!-- Taxi sign on roof -->
  <rect x="16" y="8" width="8" height="8" rx="2" fill="#FF8C00"/>
</svg>
```

**Passenger** (12x12px, simple person icon top-down):
```svg
<svg width="12" height="12" viewBox="0 0 12 12">
  <!-- Head -->
  <circle cx="6" cy="4" r="3" fill="#FFFFFF" stroke="#CCCCCC" stroke-width="1"/>
  <!-- Body -->
  <rect x="3" y="7" width="6" height="5" rx="2" fill="#FF2D7B"/>
</svg>
```

**Rooftop Target** (80x80px, concentric rings):
```svg
<svg width="80" height="80" viewBox="0 0 80 80">
  <!-- Building rooftop base -->
  <rect x="0" y="0" width="80" height="80" rx="4" fill="#2A3050" stroke="#00E5FF" stroke-width="2"/>
  <!-- Outer ring (OK zone) -->
  <circle cx="40" cy="40" r="35" fill="#4DB6AC" opacity="0.4"/>
  <!-- Inner ring (Good zone) -->
  <circle cx="40" cy="40" r="22" fill="#FF8C00" opacity="0.5"/>
  <!-- Bullseye (center) -->
  <circle cx="40" cy="40" r="10" fill="#FF2D7B"/>
</svg>
```

**Building** (generic non-target, 60x60px):
```svg
<svg width="60" height="60" viewBox="0 0 60 60">
  <rect x="0" y="0" width="60" height="60" rx="2" fill="#2A3050" stroke="#3A4060" stroke-width="1"/>
  <!-- Windows -->
  <rect x="8" y="8" width="8" height="8" fill="#1A1E2E"/>
  <rect x="24" y="8" width="8" height="8" fill="#445080"/>
  <rect x="44" y="8" width="8" height="8" fill="#1A1E2E"/>
  <rect x="8" y="24" width="8" height="8" fill="#445080"/>
  <rect x="24" y="24" width="8" height="8" fill="#1A1E2E"/>
  <rect x="44" y="24" width="8" height="8" fill="#445080"/>
</svg>
```

**Design Constraints**:
- Max 8 elements per SVG object
- Use rect, circle, line, polygon only — no complex paths
- All animations via Phaser tweens, not SVG animate
- Taxi rotation handled by Phaser sprite rotation, not SVG transform

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Drift smoke trail | While holding (drifting) | 10 small circles per second, #FF6B00 at 0.6 alpha, spawn at rear wheels, fade over 400ms, drift outward |
| Skid marks | While drifting | Dark gray lines drawn on road surface behind taxi, persist for 2 seconds |
| Speed lines | Speed > 150% | Thin white lines moving backward past the taxi, count = speed/50, 200ms lifespan |
| Passenger arc trail | Passenger in flight | 8 fading copies of passenger sprite along arc path, alpha 1.0 -> 0.1, 300ms total |
| Landing impact burst | Passenger lands on target | 25 particles, color matches zone hit (pink/orange/teal), radial burst, 350ms fade |
| Bullseye star burst | Bullseye landing | 15 star-shaped particles + camera flash white 60ms + score text 2x size |
| Crash explosion | Wall crash / over-drift | 20 particles (yellow + orange), camera shake 10px 300ms, taxi sprite spins 360deg |
| Miss indicator | Passenger off building | Red X appears at miss point, 400ms fade, screen flash red 100ms |
| Combo fire | Combo >= 5 | Taxi gets trailing flame particles (3/frame, orange-red, behind taxi) |

---

## 5. Audio Design

### 5.1 Sound Effects

All sounds via Web Audio API oscillator synthesis. No external audio files.

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Drift start | Low rumble + rising pitch (tire screech) | Sustained while holding | High |
| Drift hold | Continuous mid-freq buzz, pitch rises with power | Sustained | High |
| Passenger launch | Sharp upward whoosh (rising sine sweep 200->800Hz) | 200ms | High |
| Bullseye landing | Bright 3-note ascending chime + bass impact | 350ms | High |
| Good landing | 2-note chime + softer thud | 250ms | Medium |
| OK landing | Single dull thud | 150ms | Medium |
| Miss / off building | Descending buzz + flat splat | 300ms | High |
| Wall crash | Heavy low crunch + glass shatter (white noise burst) | 400ms | High |
| Combo milestone (x5, x10) | Ascending chime sting, higher pitch per milestone | 200ms | Medium |
| Stage clear | Quick ascending 4-note phrase | 500ms | Medium |
| Game over | Low descending 2-note, reverb tail | 800ms | High |
| Menu tap | Subtle click | 80ms | Low |

### 5.2 Music Concept

**Background Music**: Minimal synthwave loop via Web Audio API. Pulsing bass note + hi-hat pattern. BPM starts at 100, increases by 3 BPM every 5 stages, caps at 160 BPM at stage 30+. Creates urgency matching the increasing speed.

**Music State Machine**:
| Game State | Music Behavior |
|-----------|---------------|
| Menu | 80 BPM ambient pulse, muted bass |
| Early Stages (1-10) | 100 BPM, bass + hi-hat |
| Mid Stages (11-25) | 115-145 BPM, add synth stab layer |
| Late Stages (26+) | 150-160 BPM, full intensity, driving pulse |
| Game Over | Music cuts, single low bass note fade 1.5s |
| Pause | Volume ducked to 15% |

**Audio Implementation**: Web Audio API directly. `AudioContext` created on first user interaction (pointerdown on menu). No Howler.js dependency.

---

## 6. UI/UX

### 6.1 Screen Flow

```
+-----------+     +-----------+     +-----------+
|  Boot /   |---->|   Menu    |---->|   Game    |
|  Splash   |     |  Screen   |     |  Screen   |
+-----------+     +-----+-----+     +-----+-----+
                    |   |                 |
                    |   |            +----+----+
                    |   |            |  Pause  |
                    |   |            | Overlay |
                    |   |            +----+----+
               +----+----+               |
               | Settings |         +----+----+
               | Overlay  |         | Game    |
               +----------+         | Over    |
                                    | Screen  |
                                    +----+----+
                                         |
                                    [Play Again / Menu]
```

### 6.2 HUD Layout

```
+-------------------------------+
| 12,450    STAGE 7    TTT      |  <- Top bar 48px (score left, stage center, taxi-lives right)
+-------------------------------+
|                               |
|     [BUILDINGS]               |
|          [TARGET]             |  <- Rooftop target visible ahead
|                               |
|     [ROAD CURVE]              |
|          [TAXI >>]            |  <- Taxi with drift trail
|          [POWER ARC]          |  <- Drift power indicator
|                               |
|     [BUILDINGS]               |
|                               |
+-------------------------------+
|          COMBO x5             |  <- Combo display, bottom center
+-------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left (12px margin) | Current score, animated punch on change | Every score event |
| Stage | Top-center | "STAGE N" with star icon | On stage transition |
| Lives | Top-right | 3 mini taxi icons (yellow=alive, gray=lost) | On life change |
| Combo | Bottom-center, 80px from bottom | "x5" large text with gold glow, fades when combo=0 | Every landing |
| Power Arc | Around taxi during drift | Circular arc 0-270 degrees, cyan glow, fills as drift progresses | Continuous during hold |
| Floating Score | At passenger landing point | "+150" text, floats up 60px, fades 600ms | On each landing |

### 6.3 Menu Structure

**Main Menu**:
- "TAXI DRIFT STACK" title (large, bold, neon glow effect, centered)
- Taxi SVG driving in a loop animation in background
- "TAP TO PLAY" button (full-width, pulsing scale 1.0 -> 1.05 -> 1.0, 1.5s loop)
- High Score display: "BEST: 12,450 | STAGE 15"
- Settings gear icon top-right (44x44px touch target)

**Pause Menu** (overlay, 80% black semi-transparent):
- "PAUSED" title
- Resume (primary button, large)
- Restart (secondary)
- Menu (tertiary, smaller)

**Game Over Screen**:
- "GAME OVER" (large, red flash in, shakes 200ms)
- Stage reached: "STAGE 12"
- Final score (animated counter tally from 0 to final, 1.5s)
- "NEW RECORD!" flash if high score beaten (gold pulse)
- "PLAY AGAIN" primary button (large, neon cyan border)
- "MENU" secondary button (smaller, white text)

**Settings Screen** (overlay):
- Sound Effects: On/Off toggle
- Music: On/Off toggle
- Vibration: On/Off toggle

---

## 7. Monetization

### 7.1 Ad Placements (POC -- placeholder only, no real ads)

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after death | Every game over | Always optional |

### 7.2 Reward System (POC placeholder)

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Life | Watch rewarded ad | +1 life (resume from current stage) | Once per game |

### 7.3 Session Economy

No real ad SDK for POC. `ads.js` contains stub callbacks only. All `showAd()` calls immediately invoke `onAdRewarded()` for testing continuity.

**Session Flow with Monetization**:
```
[Play Free] -> [Death] -> [Lives > 0? Continue auto]
                              |
                         [Lives = 0]
                              |
                    [Game Over Screen]
                              |
                    [Interstitial Ad (every 3rd)]
                              |
                    [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/taxi-drift-stack/
+-- index.html              # Entry point
|   +-- CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js
|   +-- Local CSS            # css/style.css
|   +-- Local JS (ordered)   # config -> stages -> ads -> effects -> ui -> game -> main (LAST)
+-- css/
|   +-- style.css            # Portrait lock, safe areas, touch-action: none
+-- js/
    +-- config.js            # Constants, palette, difficulty tables, SVG strings
    +-- stages.js            # Stage generation, curve params, target placement
    +-- ads.js               # Stub ad hooks, Web Audio synth utility
    +-- effects.js           # Particle systems, screen shake, visual juice helpers
    +-- ui.js                # MenuScene, GameOverScene, HUD, PauseOverlay
    +-- game.js              # GameScene: drift physics, launch mechanics, collision
    +-- main.js              # BootScene (register textures), Phaser init, scene array
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `GAME_WIDTH = 360`, `GAME_HEIGHT = 640`
- `PALETTE` object with all hex color values
- `DIFFICULTY` table: speed multiplier, curveAngle, curveRadius, targetDistance, targetRadius per stage range
- `SCORE` object: BULLSEYE=150, GOOD=100, OK=50, NEAR_MISS=20, PERFECT_DRIFT_BONUS=30, STAGE_CLEAR=200
- `BASE_SPEED = 120` (px/s)
- `INACTIVITY_DEATH_MS = 4000`
- `OVERDRIFT_MARGIN_MS = 200` (grace before wall crash)
- `COMBO_CAP = 17`, `COMBO_MULT_PER = 0.15`
- SVG strings: `SVG_TAXI`, `SVG_PASSENGER`, `SVG_TARGET`, `SVG_BUILDING`

**main.js** (max 300 lines):
- `BootScene extends Phaser.Scene`: registers all SVG textures via `textures.addBase64(key, btoa(svgString))`
- `new Phaser.Game({ type: Phaser.AUTO, width: 360, height: 640, backgroundColor: '#0A0E1A', scene: [BootScene, MenuScene, GameScene, GameOverScene] })`
- Global `GameState` object: `{ score, stage, lives, combo, highScore, settings }`
- localStorage read on init, write on game over
- Orientation resize handler

**game.js** (max 300 lines):
- `GameScene extends Phaser.Scene`
- `create()`: draw road, place taxi sprite, register `pointerdown`/`pointerup` events, start inactivity timer
- `update(time, delta)`: move taxi forward, update drift angle while holding, check over-drift threshold, update power arc indicator, animate speed lines
- `startDrift()`: on pointerdown — set drifting=true, begin curve rotation, start drift sound, spawn smoke particles
- `releaseDrift()`: on pointerup — calculate launch power from drift duration, fling passenger with arc tween, straighten taxi
- `resolvePassengerLanding(x, y)`: distance from target center -> bullseye/good/ok/miss -> score + juice
- `handleCrash(reason)`: over-drift or inactivity -> lose life, explosion particles, respawn or game over
- Inactivity timer: reset on every `pointerdown`, fires `handleCrash('inactivity')` after 4000ms

**stages.js** (max 300 lines):
- `generateStage(stageNum)`: returns `{ speed, curveAngle, curveRadius, curveDirection, targetX, targetY, targetRadius, windDrift, isSCurve, isMovingTarget, isBoss }`
- `getCurveParams(stageNum)`: compute angle + radius from stage number
- `getTargetParams(stageNum)`: compute distance + radius from stage number
- `isRestStage(stageNum)`: returns true every 8 stages (easier params)
- `isBossStage(stageNum)`: returns true every 10 stages (golden target, 3x score)
- `getSpeed(stageNum)`: `Math.min(BASE_SPEED * 2.5, BASE_SPEED * (1 + stageNum * 0.05))`
- Road segment geometry helpers: generateCurvePoints(angle, radius, direction)

**ui.js** (max 300 lines):
- `MenuScene extends Phaser.Scene`: title with neon glow, tap to play button, high score, settings gear
- `GameOverScene extends Phaser.Scene`: score tally animation, stage display, new record flash, play again / menu buttons
- `HUD` class (used as overlay in GameScene): score display, stage label, life icons, combo counter
- `PauseOverlay`: resume/restart/menu buttons
- `SettingsOverlay`: sound/music/vibration toggles

**effects.js** (max 300 lines):
- `spawnDriftSmoke(scene, x, y)`: 10 orange circles, drift outward, 400ms fade
- `spawnLandingBurst(scene, x, y, color, count)`: radial particle burst at landing point
- `spawnCrashExplosion(scene, x, y)`: 20 yellow/orange particles, spin taxi sprite
- `spawnArcTrail(scene, positions)`: fading passenger copies along flight arc
- `showFloatingScore(scene, x, y, text, color)`: "+150" float up 60px, fade 600ms
- `shakeCamera(scene, intensity, duration)`: camera shake wrapper
- `flashCamera(scene, color, duration, alpha)`: camera flash wrapper

**ads.js** (max 300 lines):
- `AudioSynth` class: Web Audio API wrappers
  - `playDriftLoop()`, `stopDriftLoop()`: sustained low rumble during drift
  - `playLaunch()`, `playLanding(quality)`, `playCrash()`, `playComboMilestone(level)`
  - `playGameOver()`, `playMenuTap()`
  - Music loop: `startMusic(bpm)`, `stopMusic()`, `setBPM(bpm)`
- Stub ad functions: `showInterstitial(cb)`, `showRewarded(cb)` -> immediately call `cb(true)`

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | 3.60.0 | `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js` | Game engine |

No Howler.js. Audio via Web Audio API directly.

---

## 9. Juice Specification

### 9.1 Player Input Feedback (every hold/release)

| Effect | Target | Values |
|--------|--------|--------|
| Drift smoke particles | Taxi rear wheels | Count: 10/sec while holding, Color: #FF6B00 at alpha 0.6, Lifespan: 400ms, Size: 4-8px circles, Direction: outward from curve |
| Camera subtle shake | Camera | Intensity: 2px continuous while drifting, stops on release |
| Power arc glow | Arc indicator around taxi | Fills 0-270deg while holding, Color: #00E5FF, Stroke: 3px, Glow pulse alpha 0.5-1.0 at 300ms period |
| Drift sound | AudioSynth | Sustained low rumble 80Hz, pitch rises to 200Hz over drift duration |
| Taxi tilt | Taxi sprite | Rotation toward curve: 0 -> 25deg over drift, snaps back to 0 on release in 100ms |

### 9.2 Core Action Additional Feedback (passenger launch + landing)

| Effect | Values |
|--------|--------|
| Launch whoosh particles | 8 white streaks behind passenger, directional (along arc), 200ms fade |
| Arc trail | 8 fading copies of passenger at 40ms intervals, alpha 1.0 -> 0.1 |
| Bullseye landing burst | Count: 30 particles, Color: #FF2D7B (pink), Direction: radial, Lifespan: 350ms, Size: 3-6px |
| Good landing burst | Count: 20 particles, Color: #FF8C00 (orange), Direction: radial, Lifespan: 300ms |
| OK landing burst | Count: 12 particles, Color: #4DB6AC (teal), Direction: radial, Lifespan: 250ms |
| Hit-stop on bullseye | 35ms physics pause, camera zoom 1.0 -> 1.04 -> 1.0 over 200ms |
| Camera flash on bullseye | White #FFFFFF, 60ms, alpha 0.5 |
| Combo escalation | Particle count +3 per combo level; drift smoke color shifts #FF6B00 -> #FF2D7B at combo 10+ |

### 9.3 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Crash screen shake | Intensity: 10px, Duration: 300ms |
| Miss screen shake | Intensity: 5px, Duration: 150ms |
| Red flash on miss | Camera flash #FF1744, alpha 0.4, 100ms |
| Crash explosion | 20 particles (yellow #FFD600 + orange #FF6B00), radial burst, 400ms fade |
| Taxi spin on crash | 360deg rotation over 400ms, scale 1.0 -> 0.6 |
| Sound on crash | Heavy low crunch 120Hz + white noise burst 400ms |
| Effect -> UI delay | 600ms after crash animation before respawn or game over screen |
| Death -> restart | Tap "Play Again" -> game restarts in **under 1.5 seconds** |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating score text | "+150" at landing point, Color: Bullseye=#FF2D7B, Good=#FF8C00, OK=#4DB6AC; floats up 60px over 600ms, fade last 200ms |
| Score HUD punch | Scale 1.0 -> 1.35 -> 1.0, Recovery: 150ms, color flash to gold #FFD700 then back |
| Combo text pulse | Scale 1.0 -> 1.2 -> 1.0, 100ms ease-out-back on each increment |
| Combo text size escalation | Base 32px, +3px per 5 combos, max 50px |
| Stage clear celebration | 25 gold #FFD700 particles + 15 white particles, camera zoom 1.0 -> 1.05 -> 1.0 over 400ms |
| New record flash | "NEW RECORD!" text, gold, scale 0 -> 1.2 -> 1.0, 500ms, glow pulse 3 times |

---

## 10. Implementation Notes

### 10.1 Drift Physics Model

The drift is NOT real physics simulation. It is a scripted rotation + position offset.

```javascript
// In game.js update() while drifting:
const driftProgress = (holdTime / maxDriftTime); // 0.0 to 1.0
const currentAngle = curveDirection * curveAngle * driftProgress; // degrees
taxi.setRotation(Phaser.Math.DegToRad(currentAngle));
// Taxi position follows arc: center + radius * cos/sin(angle)
taxi.x = curveCenter.x + curveRadius * Math.cos(Phaser.Math.DegToRad(startAngle + currentAngle));
taxi.y = curveCenter.y + curveRadius * Math.sin(Phaser.Math.DegToRad(startAngle + currentAngle));

// Over-drift check:
if (driftProgress > 1.0 + OVERDRIFT_MARGIN) {
  handleCrash('overdrift');
}
```

### 10.2 Passenger Launch Arc

```javascript
// In game.js releaseDrift():
const launchPower = driftProgress; // 0.0 to 1.0
const launchAngle = taxi.rotation + (curveDirection * Math.PI / 4); // perpendicular to drift
const targetX = currentTarget.x;
const targetY = currentTarget.y;
const arcHeight = 80 + launchPower * 60; // px above straight line

// Quadratic bezier tween:
scene.tweens.add({
  targets: passenger,
  x: targetX,
  y: { value: targetY, ease: 'Sine.easeIn' },
  duration: 500 + (1 - launchPower) * 300, // faster = shorter flight
  onUpdate: () => { /* spawn arc trail copies */ },
  onComplete: () => { resolvePassengerLanding(passenger.x, passenger.y); }
});
```

### 10.3 Inactivity Death

```javascript
// In game.js create():
this.inactivityTimer = this.time.delayedCall(4000, () => {
  this.handleCrash('inactivity'); // instant game over, all lives = 0
});

// In startDrift():
this.inactivityTimer.remove();
this.inactivityTimer = null;

// In releaseDrift() after landing resolution:
this.inactivityTimer = this.time.delayedCall(4000, () => {
  this.handleCrash('inactivity');
});
```

### 10.4 Performance Targets

| Metric | Target | Method |
|--------|--------|--------|
| Frame Rate | 60fps stable | Phaser `game.loop.actualFps` |
| Load Time | <2s on 4G | No external assets except Phaser CDN |
| Memory | <80MB | Chrome DevTools memory snapshot |
| JS total | <400KB (excl. CDN) | File size sum of 7 JS files |
| First interaction | <1s after load | window onload timing |

### 10.5 Mobile Optimization

- `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- `document.addEventListener('touchmove', e => e.preventDefault(), { passive: false })` — prevents pull-to-refresh
- `touch-action: none` on game container in CSS
- Portrait CSS lock: `@media (orientation: landscape) { body { transform: rotate(-90deg); } }`
- Background tab: `document.addEventListener('visibilitychange', ...)` — pause game when hidden
- `AudioContext` created only on first `pointerdown` in MenuScene

### 10.6 Local Storage Schema

```json
{
  "taxi-drift-stack_high_score": 0,
  "taxi-drift-stack_games_played": 0,
  "taxi-drift-stack_highest_stage": 0,
  "taxi-drift-stack_settings": {
    "sound": true,
    "music": true,
    "vibration": true
  },
  "taxi-drift-stack_total_score": 0
}
```

### 10.7 Known Risk Areas

1. **Drift feel vs. simplicity**: The drift is scripted (not physics-based), so it must FEEL physical through juice (shake, smoke, sound, rotation). If it feels stiff, add more screen shake and faster smoke particle spawn rate.
2. **Passenger arc readability**: The launch arc must be clearly visible. Use bright white passenger + thick trail. Consider a brief slow-motion (0.5x speed for 200ms) on launch for dramatic effect.
3. **Inactivity at 4s is aggressive**: This is intentional — the game is about constant engagement. The taxi is always moving, so 4s of no input = certain wall crash. First-time players should see a "HOLD TO DRIFT!" prompt on stage 1.
4. **Over-drift detection**: Must feel fair. Add a visual warning (taxi flashes red, screen border glows red) at 90% of max drift before the crash triggers. Give 200ms grace period past curve exit.
5. **Top-down camera follow**: Camera must smoothly follow taxi along the road. Use `Phaser.Cameras.Scene2D.Camera.startFollow(taxi, true, 0.08, 0.08)` for smooth lerp.
6. **AudioContext autoplay**: Create AudioContext on first pointerdown in MenuScene. Store reference globally.
7. **Script load order**: config -> stages -> ads -> effects -> ui -> game -> main. main.js MUST load last (registers BootScene which references all other scene classes).
