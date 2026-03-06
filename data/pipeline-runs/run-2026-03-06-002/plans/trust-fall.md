# Game Design Document: Trust Fall

**Slug**: `trust-fall`
**One-Liner**: One tap, two characters, opposite directions -- keep them BOTH alive.
**Core Mechanic**: Two linked characters stand on parallel platforms. Tapping makes Character A jump LEFT and Character B jump RIGHT simultaneously. Obstacles approach from both sides on staggered timings. The player must find the precise moment where a single tap dodges hazards for BOTH characters. Miss the timing and one (or both) gets hit.
**Target Session Length**: 2-4 minutes
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Trust Fall is a one-tap dual-character survival game where every input controls two characters in opposite directions simultaneously. Character A (blue, left side) and Character B (orange, right side) stand on parallel horizontal lanes. When the player taps, A jumps LEFT and B jumps RIGHT -- always opposite, always together, always a leap of faith.

Obstacles (spikes, walls, projectiles) scroll inward from both edges of the screen toward the characters. The core challenge: obstacles arrive at different timings on each side, so the player must find the narrow window where a single tap clears BOTH hazards. Early stages have synchronized obstacles (same timing both sides), but as difficulty ramps, obstacles become asymmetric -- forcing the player to calculate overlapping dodge windows. A combo counter rewards consecutive perfect dodges (clearing both obstacles in a single tap with tight timing), creating an addictive rhythm of tension and release.

The "trust" theme is reinforced visually: the two characters are connected by a glowing thread. When a tap saves both, the thread pulses brightly. When only one is saved, the thread flickers and dims. When idle too long, the platforms crumble and both characters fall into a void (inactivity death in 5 seconds). The emotional hook: you can't protect them individually -- you must trust that your one action will save both.

### 1.2 Target Audience

Casual mobile gamers aged 13-40 who enjoy reflex-based timing games with a twist. Perfect for commute sessions, waiting rooms, and quick breaks. Appeals to players who like rhythm games (timing windows), dual-task challenges, and games with emotional resonance (protecting two characters). Low skill floor (just tap) but high skill ceiling (reading asymmetric obstacle patterns and finding overlapping dodge windows).

### 1.3 Core Fantasy

You are the unseen force binding two souls together. They leap apart on your command, trusting that you've chosen the right moment. Every tap is a shared act of faith. When you nail the timing, both soar past danger in perfect synchrony -- an exhilarating rush. When you fail, the bond between them weakens. The fantasy is being the perfect guardian -- the one who always finds the moment where a single choice saves everyone.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 2-4 minutes |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 22%+ |
| Average Stages per Session | 8-20 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Obstacles Approach] --> [Player Reads Both Lanes] --> [Tap to Dodge]
         ^                                                  |
         |                                         [Both Clear? Score!]
         |                                                  |
         |                                          [Combo Check]
         |                                                  |
         |                               [Stage Complete after N waves?]
         |                                        |                |
         |                                       Yes              No
         |                                        |                |
         |                               [Next Stage]    [Next Wave]
         |                                        |                |
         +------ [New Obstacles Spawn] <----------+----------------+
                        |
                  [Hit = Lose Life]
                  [0 Lives = Game Over]
                  [5s Idle = Fall Death]
```

**Moment-to-moment gameplay:**
1. Two characters stand on their respective platforms (A on left half, B on right half).
2. Obstacles scroll inward from both screen edges toward the characters at varying speeds.
3. The player watches both lanes and taps when the dodge window overlaps for both characters.
4. On tap: Character A hops 60px LEFT (away from right-side obstacles), Character B hops 60px RIGHT (away from left-side obstacles). Both are airborne for 400ms.
5. If both characters clear their respective obstacles, the player scores points + combo increments.
6. If either character is hit, the player loses 1 life, the combo resets, and the hit character flashes red.
7. After N waves per stage (starting at 4, increasing to 8), a stage-clear banner appears and difficulty increments.
8. If the player does not tap for 5000ms, both platforms crumble and characters fall (inactivity death).

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Dodge | Tap (anywhere) | Both characters jump in opposite directions simultaneously. A jumps LEFT 60px, B jumps RIGHT 60px. Airborne for 400ms. |
| Pause | Tap pause icon (top-right, 44x44px) | Pauses game, shows pause overlay. |

**Control Philosophy**: Single-tap universality. The entire screen is the tap zone (except the 44x44px pause button). One finger, one action, two consequences. This maps perfectly to the "trust" theme -- you don't choose WHO to save, you choose WHEN to act, and both fates are sealed by that single decision.

**Touch Area Map**:
```
+-------------------------------+
| Score  |  Stage  | [||] 44px |  <-- HUD bar (y: 0-50px)
+-------------------------------+
| Combo counter (appears/fades) |  <-- Combo overlay (y: 50-90px)
+-------------------------------+
|              |                |
|   LANE A     |    LANE B     |
|   (Char A)   |    (Char B)   |
|              |                |
|   <--Obs     |     Obs-->    |  <-- Obstacle approach directions
|              |                |
|   [A]=====thread=====[B]     |  <-- Characters at y: 480px
|              |                |
+-------------------------------+
|     Lives: [heart][heart]     |  <-- Lives bar (y: 700-740px)
+-------------------------------+
|                               |
|   ENTIRE SCREEN = TAP ZONE   |  <-- Touch input area (full screen)
|                               |
+-------------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Both dodge (normal) | 10 | Base score, no combo |
| Both dodge (perfect -- within 80ms of optimal) | 25 | Requires tap within 80ms window of ideal overlap |
| Combo bonus | +5 per combo level | Consecutive successful dodges without miss |
| Stage clear bonus | 50 + (stage_number * 10) | Awarded on completing all waves in a stage |
| Survival bonus | 1 per 1000ms alive | Passive score for staying alive |
| Near-miss bonus | 5 | Obstacle passes within 8px of character without hitting |

**Combo System**: Each consecutive successful dodge (both characters clear) increments the combo counter by 1. The combo multiplier applies as: `score = base_points + (combo_level * 5)`. At combo 5, 10, 15, 20, special visual milestones trigger (see Juice Specification). Combo resets to 0 on any hit. Maximum combo display: 99.

**Combo Milestones** (address Loop score 68 -- "one more round" hook):

| Combo Level | Milestone Name | Visual Reward |
|-------------|---------------|---------------|
| 5 | "In Sync" | Thread glows cyan, +flash |
| 10 | "Soul Bond" | Thread becomes double-width, particle trail |
| 15 | "Perfect Trust" | Both characters gain golden outline |
| 20 | "Unbreakable" | Screen border pulses gold, text scales 2x |
| 25+ | "Legendary" | Rainbow thread, camera subtle zoom 1.03x |

**High Score**: Stored in localStorage as `trust_fall_high_score`. Displayed on menu screen and game over screen. New high score triggers special celebration animation (confetti particles, "NEW BEST!" text).

### 2.4 Progression System

The game uses an infinite stage system. Each stage consists of N waves of obstacles. Completing all waves in a stage advances to the next stage with increased difficulty. Visible progression milestones create "just one more stage" pull.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-3 | Synchronized obstacles only (same timing both sides) | Easy -- learn tap timing. Obstacle speed: 1.5px/frame. Waves per stage: 4. Gap between waves: 2000ms. |
| 4-7 | Staggered obstacles (offset timing, player must find overlap window) | Medium -- obstacle speed: 2.0px/frame. Waves per stage: 5. Gap: 1600ms. |
| 8-12 | Fast obstacles (red-tinted, 2.5x speed) mixed with normal | Hard -- obstacle speed mix: 2.0 + 3.5px/frame. Waves: 6. Gap: 1400ms. |
| 13-20 | Double obstacles (two obstacles per side per wave) | Very Hard -- must dodge two per side with single tap. Speed: 2.5px/frame. Waves: 7. Gap: 1200ms. |
| 21-35 | Asymmetric jump heights (A jumps 60px, B jumps 45px or vice versa, announced per stage) | Expert -- must account for different dodge ranges. Speed: 3.0px/frame. Waves: 8. Gap: 1000ms. |
| 36+ | All elements combined, random mixing, obstacle speed variance +/-0.5px/frame | Extreme -- survival mode. Speed: 3.0-3.5px/frame. Waves: 8. Gap: 800ms. |

**Stage Announce**: Each new stage flashes stage number center-screen for 1200ms with scale-in animation (0 to 1.0 over 300ms, hold 600ms, fade 300ms).

### 2.5 Lives and Failure

Players start with 3 lives (displayed as heart icons at bottom of screen).

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Character A or B hit by obstacle | Lose 1 life, combo reset, 800ms invincibility | Watch rewarded ad for +1 life (once per game) |
| Both characters hit same tap | Lose 1 life (NOT 2 -- single-event penalty) | Same as above |
| 0 lives remaining | Game over screen | Watch rewarded ad to continue with 1 life (once per game) |
| 5000ms without tapping (inactivity) | Platforms crumble, both fall -- instant game over (all lives lost) | No recovery -- forces engagement |

**Invincibility Window**: After taking a hit, both characters flash with 50% alpha for 800ms. During this window, obstacles pass through without dealing damage. This prevents frustrating chain-deaths from clustered obstacles.

**Death Animation**: Hit character flashes red (3 cycles of 100ms on/off), knockback 20px away from obstacle, 300ms. Thread between characters dims to 30% opacity for 500ms before recovering.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Stages are procedurally generated using the stage number as a seed input. Each stage consists of a sequence of obstacle waves. Each wave defines one or more obstacles per lane with specific timing offsets.

**Generation Algorithm**:
```
Stage Generation Parameters:
- stage_number: integer (1+)
- waves_per_stage: min(4 + floor(stage_number / 3), 8)
- obstacle_speed: min(1.5 + stage_number * 0.1, 3.5) px/frame
- wave_gap: max(2000 - stage_number * 60, 800) ms
- sync_chance: max(1.0 - stage_number * 0.05, 0.15) (probability obstacles are synchronized)
- double_chance: min(max(0, (stage_number - 12) * 0.06), 0.5) (probability of double obstacles)
- fast_chance: min(max(0, (stage_number - 7) * 0.05), 0.4) (probability of fast obstacle)
- asymmetric_jump: stage_number >= 21 ? true : false
- jump_A: asymmetric_jump ? random([45, 50, 55, 60]) : 60 px
- jump_B: asymmetric_jump ? random([45, 50, 55, 60]) : 60 px
```

**Wave Generation** (per wave within a stage):
```
1. Roll sync_chance. If synchronized:
   - Both obstacles spawn at same frame, same speed, same distance from character.
2. If not synchronized:
   - Left obstacle offset: random(0, wave_gap * 0.4) ms
   - Right obstacle offset: random(0, wave_gap * 0.4) ms
   - Ensure overlap window >= 150ms (solvability guarantee)
3. Roll fast_chance per obstacle independently.
   - Fast obstacles: speed * 2.0, tinted red (#FF4444), slightly smaller (80% size).
4. Roll double_chance per lane independently.
   - Double obstacles: two obstacles in same lane, separated by 300ms.
   - Both must be clearable with the single jump (jump height covers both).
5. Obstacle y-position: character_y (480px), approaching horizontally.
   - Left lane obstacles spawn at x: -40px, move RIGHT toward Character A at x: 100px.
   - Right lane obstacles spawn at x: GAME_WIDTH + 40px, move LEFT toward Character B at x: GAME_WIDTH - 100px.
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
    0    5    10    15    20    25    30    36+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-3 | Stage 4-7 | Stage 8-12 | Stage 13-20 | Stage 21-35 | Stage 36+ |
|-----------|-----------|-----------|------------|-------------|-------------|-----------|
| Obstacle Speed (px/frame) | 1.5 | 2.0 | 2.0-3.5 mix | 2.5 | 3.0 | 3.0-3.5 |
| Waves per Stage | 4 | 5 | 6 | 7 | 8 | 8 |
| Wave Gap (ms) | 2000 | 1600 | 1400 | 1200 | 1000 | 800 |
| Sync Chance | 100% | 80% | 60% | 35% | 20% | 15% |
| Double Obstacle Chance | 0% | 0% | 0% | 18% | 35% | 50% |
| Fast Obstacle Chance | 0% | 0% | 20% | 30% | 40% | 40% |
| Asymmetric Jump | No | No | No | No | Yes | Yes |
| Dodge Window (ms) | 600+ | 400+ | 300+ | 250+ | 200+ | 150+ |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every wave MUST have an overlap window of at least 150ms where a single tap clears both lanes. The generator calculates approach timing for both obstacles and verifies the dodge windows overlap by >= 150ms. If not, it re-rolls the offsets (max 5 retries, then forces synchronization).
2. **Variety Threshold**: No two consecutive waves within a stage can have identical sync/fast/double configurations. At least 1 parameter must differ.
3. **Difficulty Monotonicity**: Overall difficulty (composite of speed + gap + sync_chance) never decreases between stages. Within a stage, individual waves may vary.
4. **Rest Waves**: Every 5th stage (stage 5, 10, 15...), the first 2 waves are deliberately synchronized and at 80% speed -- a breather before ramping back up.
5. **Boss Stages**: Every 10th stage (stage 10, 20, 30...), a "Gauntlet" -- 10 waves instead of normal count, but completing it grants +1 life (max 5 lives). The thread between characters turns gold during boss stages.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Minimalist geometric with a soft neon glow aesthetic. Clean backgrounds with subtle gradients. Characters are simple rounded shapes with expressive features (dot eyes, slight curves for emotion). The connecting thread is the visual centerpiece -- it glows, pulses, and changes color based on game state.

**Aesthetic Keywords**: Ethereal, Connected, Minimalist, Glow, Trust

**Reference Palette**: Night sky with warm and cool contrasts. Think Firewatch meets Monument Valley -- soft gradients with striking accent colors.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Character A (Blue) | Cerulean | #4FC3F7 | Character A body, left lane accents |
| Character B (Orange) | Warm Amber | #FFB74D | Character B body, right lane accents |
| Thread (Normal) | Soft White | #E0E0E0 | Connecting thread default state |
| Thread (Combo 5+) | Cyan Glow | #00E5FF | Thread at combo milestone |
| Thread (Combo 20+) | Gold Glow | #FFD740 | Thread at high combo |
| Background Top | Deep Navy | #0D1B2A | Gradient top |
| Background Bottom | Dark Teal | #1B3A4B | Gradient bottom |
| Platform | Slate Gray | #546E7A | Character standing platforms |
| Obstacle (Normal) | Crimson | #EF5350 | Standard obstacles (spikes) |
| Obstacle (Fast) | Hot Red | #FF1744 | Fast obstacles (brighter, menacing) |
| Danger Flash | Red | #F44336 | Screen flash on hit |
| Reward/Score | Lime Green | #76FF03 | Score popups, combo text |
| UI Text | White | #FFFFFF | Score, stage, menu text |
| UI Background | Dark Overlay | #000000CC | Menu/pause overlay (80% opacity) |
| Heart (Full) | Rose | #FF5252 | Full life heart |
| Heart (Empty) | Dark Gray | #424242 | Empty life heart |

### 4.3 SVG Specifications

All game graphics are rendered as SVG elements generated in code via `textures.addBase64()` in BootScene.

**Character A (Blue -- left side)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
  <!-- Body: rounded rectangle -->
  <rect x="4" y="12" width="32" height="28" rx="10" fill="#4FC3F7"/>
  <!-- Head: circle -->
  <circle cx="20" cy="10" r="10" fill="#4FC3F7"/>
  <!-- Left eye -->
  <circle cx="15" cy="9" r="2.5" fill="#0D1B2A"/>
  <!-- Right eye -->
  <circle cx="25" cy="9" r="2.5" fill="#0D1B2A"/>
  <!-- Feet -->
  <rect x="8" y="40" width="10" height="8" rx="4" fill="#4FC3F7"/>
  <rect x="22" y="40" width="10" height="8" rx="4" fill="#4FC3F7"/>
</svg>
```
Size: 40x48px. Simple rounded body with dot eyes. Color: #4FC3F7.

**Character B (Orange -- right side)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
  <!-- Body: rounded rectangle -->
  <rect x="4" y="12" width="32" height="28" rx="10" fill="#FFB74D"/>
  <!-- Head: circle -->
  <circle cx="20" cy="10" r="10" fill="#FFB74D"/>
  <!-- Left eye -->
  <circle cx="15" cy="9" r="2.5" fill="#0D1B2A"/>
  <!-- Right eye -->
  <circle cx="25" cy="9" r="2.5" fill="#0D1B2A"/>
  <!-- Feet -->
  <rect x="8" y="40" width="10" height="8" rx="4" fill="#FFB74D"/>
  <rect x="22" y="40" width="10" height="8" rx="4" fill="#FFB74D"/>
</svg>
```
Size: 40x48px. Identical shape to A but orange. Color: #FFB74D.

**Obstacle (Spike -- Normal)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
  <!-- Spike body -->
  <polygon points="16,0 32,40 0,40" fill="#EF5350"/>
  <!-- Inner highlight -->
  <polygon points="16,10 26,36 6,36" fill="#FF8A80" opacity="0.4"/>
</svg>
```
Size: 32x40px. Triangle spike pointing in approach direction (flipped horizontally for right-side obstacles via scaleX: -1).

**Obstacle (Fast Spike)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="26" height="32" viewBox="0 0 26 32">
  <!-- Smaller, more angular spike -->
  <polygon points="13,0 26,32 0,32" fill="#FF1744"/>
  <!-- Speed lines -->
  <line x1="4" y1="12" x2="0" y2="14" stroke="#FF1744" stroke-width="2" opacity="0.6"/>
  <line x1="4" y1="18" x2="0" y2="20" stroke="#FF1744" stroke-width="2" opacity="0.6"/>
</svg>
```
Size: 26x32px (80% of normal). Brighter red with speed lines.

**Platform**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="16" viewBox="0 0 120 16">
  <rect x="0" y="0" width="120" height="16" rx="6" fill="#546E7A"/>
  <rect x="4" y="2" width="112" height="4" rx="2" fill="#78909C" opacity="0.5"/>
</svg>
```
Size: 120x16px. Rounded rectangle with subtle highlight.

**Heart (Full)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="22" viewBox="0 0 24 22">
  <path d="M12 21 C12 21 1 13 1 6.5 C1 3 4 0 7.5 0 C9.5 0 11 1.5 12 3 C13 1.5 14.5 0 16.5 0 C20 0 23 3 23 6.5 C23 13 12 21 12 21Z" fill="#FF5252"/>
</svg>
```
Size: 24x22px.

**Heart (Empty)**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="22" viewBox="0 0 24 22">
  <path d="M12 21 C12 21 1 13 1 6.5 C1 3 4 0 7.5 0 C9.5 0 11 1.5 12 3 C13 1.5 14.5 0 16.5 0 C20 0 23 3 23 6.5 C23 13 12 21 12 21Z" fill="#424242"/>
</svg>
```
Size: 24x22px.

**Thread**: Rendered as a Phaser Graphics line (not SVG) between Character A and Character B positions. Width: 2px default, 4px at combo 10+. Color transitions smoothly using Phaser tween on tint.

**Design Constraints**:
- All SVG elements use max 6 path/shape elements per object
- Use basic shapes (rect, circle, polygon, line) only -- no complex bezier paths
- All animations via Phaser tweens, not SVG animate elements
- Total unique textures: 8 (charA, charB, obstacle, fastObstacle, platform, heartFull, heartEmpty, pauseIcon)

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Thread pulse | Successful dodge (both clear) | Thread alpha tween: 0.6 -> 1.0 -> 0.6 over 300ms. Width tween: 2px -> 4px -> 2px over 300ms. |
| Thread dim | Character hit | Thread alpha tween to 0.3 over 200ms, recover to 0.8 over 600ms. |
| Character jump arc | Tap input | Tween y: -60px (or jump height) over 200ms ease-out, then +60px over 200ms ease-in. Squash on land: scaleX 1.2, scaleY 0.8 for 100ms. |
| Obstacle destroy | Obstacle passes screen edge (dodged) | Scale to 0 over 150ms + 6 small particles (3px circles, obstacle color) burst radially, fade over 300ms. |
| Hit flash | Character collides with obstacle | Character tint red (#F44336) for 100ms, then flash alpha 0.5/1.0 three times over 300ms. Screen tint red overlay alpha 0.15 for 200ms. |
| Platform crumble | Inactivity death (5s idle) | Platform splits into 6 rect fragments, each falls with gravity (accel 0.3px/frame^2) + random x velocity (-2 to 2px/frame), fade alpha over 800ms. Characters fall downward at 3px/frame, fade over 1000ms. |
| Stage clear | All waves in stage completed | Flash white overlay alpha 0.2 for 150ms. Stage number text scales from 0 to 1.5 over 200ms, settles to 1.0 over 150ms. 20 particles burst from center. |
| Combo milestone | Hitting combo 5/10/15/20/25 | Thread color change tween 300ms. Milestone text ("IN SYNC!") appears center screen, scale 0->1.2->1.0 over 400ms, fade out over 600ms. |
| Near miss | Obstacle within 8px of character | Brief white flash on character (50ms). Small "+5" floating text. Speed lines (2 white lines) from obstacle to character, fade 200ms. |

---

## 5. Audio Design

### 5.1 Sound Effects

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Tap/Jump | Short airy whoosh with soft pop | 150ms | High |
| Both dodge success | Bright dual-tone chime (ascending 5th interval) | 200ms | High |
| Perfect dodge | Higher-pitch chime + sparkle tail | 300ms | High |
| Combo milestone | Ascending arpeggio (3 notes) | 500ms | High |
| Character hit | Low thud with crack | 250ms | High |
| Obstacle approach warning | Subtle low hum, volume increases as obstacle nears | 800ms | Low |
| Platform crumble | Crumbling stone/gravel sound | 600ms | High |
| Stage clear | Triumphant ascending chord | 800ms | High |
| Game over | Descending minor chord, somber | 1000ms | High |
| New high score | Celebratory 4-note jingle | 1500ms | Medium |
| UI button tap | Soft click | 80ms | Low |
| Near miss | Quick whoosh/whistle | 120ms | Medium |

### 5.2 Music Concept

**Background Music**: Ambient electronic with a steady pulse that mirrors the heartbeat/trust theme. The tempo subtly increases with stage number. Procedural layering: base loop always plays, additional melodic layers fade in at higher stages.

**Music State Machine**:

| Game State | Music Behavior |
|-----------|---------------|
| Menu | Soft ambient pad, 70 BPM, gentle pulse, loop |
| Stage 1-5 | Base beat layer + soft synth melody, 90 BPM |
| Stage 6-15 | Add percussive layer, 100 BPM |
| Stage 16-30 | Add bass layer + intensity filter sweep, 110 BPM |
| Stage 31+ | Full layers, 120 BPM, slight distortion filter |
| Boss Stage | Distinct motif, driving beat, 120 BPM |
| Pause | Volume reduce to 20%, low-pass filter |
| Game Over | All layers fade out over 1500ms, somber sting |

**Audio Implementation**: Web Audio API via Phaser's built-in sound manager. No external audio library needed (Phaser handles Web Audio). All sounds generated programmatically using oscillators and noise (no external audio files).

---

## 6. UI/UX

### 6.1 Screen Flow

```
+------------+     +------------+     +------------+
|   Boot     |---->|   Menu     |---->|   Game     |
|  (BootScene|     | (MenuScene)|     |(GameScene) |
|  textures) |     +-----+------+     +------+-----+
+------------+        |     |                |
                 +----+     +----+      +----+----+
                 |               |      | Pause   |--->[HelpScene]
            +----+----+    +----+----+  | Overlay |
            |  Help   |    |Settings |  +---------+
            |HelpScene|    | Overlay |       |
            +---------+    +---------+  +----+----+
                                        |Game Over|
                                        |GameOver |
                                        |Scene    |
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
| 1250     Stage 7     [||]                 |  <-- Top HUD bar (y: 8-42px)
|  score    stage#     pause 44x44px        |
+-------------------------------------------+
|                                           |
|          x5 COMBO!                        |  <-- Combo display (y: 50-80px, fades)
|                                           |
|     <--[spike]          [spike]-->        |  <-- Obstacles approach
|                                           |
|                                           |
|                                           |
|    [A]============thread============[B]   |  <-- Characters at y: 480px
|   (blue)                          (orange)|
|  [====platform====] [====platform====]    |  <-- Platforms at y: 504px
|                                           |
|                                           |
+-------------------------------------------+
|          [heart][heart][heart]            |  <-- Lives at y: 710px
+-------------------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left (x: 16, y: 16) | Current score, white, 24px bold | Every score event, punch animation |
| Stage | Top-center (x: center, y: 16) | "Stage N", white, 20px | On stage transition |
| Pause Button | Top-right (x: GAME_WIDTH - 38, y: 24) | "||" icon, 44x44px hit area | Always visible |
| Combo Counter | Center-top (x: center, y: 60) | "xN COMBO!", lime green (#76FF03), 28px bold | On combo change, fades after 1500ms if no new combo |
| Lives | Bottom-center (x: center, y: 710) | Heart icons spaced 32px apart | On life change |
| Near-miss text | Near character position | "+5", white, 16px, floats up 40px + fades 500ms | On near-miss event |
| Perfect text | Center screen | "PERFECT!", gold (#FFD740), 32px | On perfect dodge, scale punch + fade 600ms |

### 6.3 Menu Structure

**Main Menu (MenuScene)**:
- Game title "TRUST FALL" -- large text (40px), centered, white with soft glow shadow
- Two character silhouettes with connecting thread animation (idle sway)
- "TAP TO PLAY" -- pulsing text (scale 1.0 to 1.05, 800ms loop), 28px, centered at y: 400px
- High Score display: "BEST: {score}" at y: 460px, 18px, #B0BEC5
- "?" Help button -- bottom-left, 44x44px circle, white outline
- Gear Settings icon -- bottom-right, 44x44px circle, white outline
- Sound toggle -- bottom-right offset, 44x44px, speaker icon

**Pause Menu** (overlay, #000000CC background):
- "PAUSED" title, 32px, white, centered
- "RESUME" button -- 200x50px, #4FC3F7 background, centered at y: 300px
- "HOW TO PLAY" button -- 200x50px, #546E7A background, y: 370px
- "RESTART" button -- 200x50px, #546E7A background, y: 440px
- "QUIT" button -- 200x50px, #EF5350 background, y: 510px

**Game Over Screen (GameOverScene)**:
- "GAME OVER" title, 36px, white, y: 120px
- Final score, 48px, #76FF03, y: 200px (count-up animation from 0 over 1000ms)
- "NEW BEST!" if high score, 20px, #FFD740, pulsing, y: 250px
- "Stage {N}" reached, 20px, white, y: 280px
- "Best Combo: {N}x" display, 18px, #B0BEC5, y: 310px
- "CONTINUE (AD)" button -- 220x50px, #FFB74D, y: 400px (once per game)
- "PLAY AGAIN" button -- 220x50px, #4FC3F7, y: 470px
- "MENU" button -- 220x50px, #546E7A, y: 540px

**Help / How to Play (HelpScene)**:
- Title: "HOW TO PLAY", 28px, white, y: 40px
- Illustration 1: Two character SVGs with thread, arrows showing opposite jump directions, label "TAP = Both jump opposite!" at y: 100-200px
- Illustration 2: Obstacle approaching from left, character dodging, label "Dodge obstacles from both sides" at y: 220-320px
- Illustration 3: Combo counter example, label "Chain dodges for combos!" at y: 340-420px
- Rules text (16px, #B0BEC5):
  - "Tap anywhere to make both characters jump"
  - "Character A jumps LEFT, Character B jumps RIGHT"
  - "Time your taps so BOTH dodge obstacles"
  - "3 lives -- lose one when either gets hit"
  - "Stay active! Idle for 5 seconds = game over"
- Tips (16px, #76FF03):
  - "TIP: Watch for the overlap -- the moment both are safe"
  - "TIP: Perfect timing (+25 pts) when you dodge within 80ms"
  - "TIP: Combo milestones change the thread color!"
- "GOT IT!" button -- 180x50px, #4FC3F7, bottom-center, y: 680px
- Scrollable if content exceeds viewport

**Settings Overlay**:
- Sound Effects: On/Off toggle (default: On)
- Music: On/Off toggle (default: On)
- Vibration: On/Off toggle (default: On)

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after death (game over) | Once per game session | Always (optional) |
| Rewarded | Double final score | After game over screen | Always (optional) |
| Banner | Menu screen only | Always visible on menu | N/A |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Continue | Watch rewarded ad at game over | Resume with 1 life, keep score + combo | Once per game |
| Score Doubler | Watch rewarded ad at game over | Final score x2 for high score purposes | Once per session |

### 7.3 Session Economy

The game is generous with free play. Average session: 3-5 games at 2-4 minutes each. Interstitial ads show only every 3rd game over, so a typical session sees 1-2 interstitials. Rewarded ads are always optional and provide meaningful but not essential benefits.

**Session Flow with Monetization**:
```
[Play Free] --> [Death] --> [Lives > 0? Continue playing]
                    |
                    v (Lives = 0)
              [Game Over Screen]
                    |
           [Rewarded Ad: Continue?] (once per game)
                 |           |
                Yes          No
                 |           |
           [Resume +1 life]  |
                             v
                    [Show Final Score]
                             |
                    [Rewarded Ad: Double Score?] (once per session)
                             |
                    [Interstitial Ad (every 3rd game over)]
                             |
                    [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/trust-fall/
+-- index.html              # Entry point, CDN links, script load order
|   +-- CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
|   +-- Local CSS            # css/style.css
|   +-- Local JS (ordered)   # config -> stages -> ads -> help -> ui -> game -> main (LAST)
+-- css/
|   +-- style.css            # Responsive layout, mobile-first, safe areas
+-- js/
    +-- config.js            # Constants, colors, difficulty tables, SVG strings
    +-- main.js              # BootScene, Phaser init, scene registration (loads LAST)
    +-- game.js              # GameScene: core gameplay, physics, input, obstacles
    +-- stages.js            # Stage generation, wave creation, difficulty scaling
    +-- ui.js                # MenuScene, GameOverScene, HUD overlay, pause, settings
    +-- help.js              # HelpScene: illustrated how-to-play screen
    +-- ads.js               # Ad hooks, reward callbacks, frequency tracking
```

**Script Load Order in index.html** (CRITICAL: main.js LAST):
```html
<script src="js/config.js"></script>
<script src="js/stages.js"></script>
<script src="js/ads.js"></script>
<script src="js/help.js"></script>
<script src="js/ui.js"></script>
<script src="js/game.js"></script>
<script src="js/main.js"></script>
```

### 8.2 Module Responsibilities

**config.js** (target: ~80 lines, max 300):
- `COLORS` object: all hex color constants from palette
- `GAME` object: WIDTH (390), HEIGHT (740), character positions, platform positions
- `DIFFICULTY` table: arrays indexed by stage range for speed, wave_gap, sync_chance, etc.
- `SCORING` object: base points, perfect bonus, combo multiplier, stage clear bonus formula
- `JUMP` object: default height (60px), duration (400ms), min asymmetric height (45px)
- `SVG_STRINGS` object: all SVG markup strings for BootScene texture registration
- `INACTIVITY_TIMEOUT`: 5000 (ms)
- `INVINCIBILITY_DURATION`: 800 (ms)
- `LIVES_START`: 3
- `LIVES_MAX`: 5

**main.js** (target: ~60 lines, max 300):
- BootScene class: register ALL textures via `textures.addBase64()` from `SVG_STRINGS`
- Phaser.Game config: type AUTO, width 390, height 740, backgroundColor #0D1B2A, scale mode FIT
- Scene array: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene]
- `GameState` global: high_score, games_played, highest_stage, settings (loaded from localStorage)
- Orientation resize handler: `window.addEventListener('resize', ...)`

**game.js** (target: ~280 lines, max 300):
- GameScene class extending Phaser.Scene
- `create()`: spawn characters A and B at positions, spawn platforms, init thread graphics, init input handler (tap anywhere), init obstacle group, init HUD overlay scene, reset lives/score/combo, start first stage
- `update(time, delta)`: move obstacles, check collisions (AABB: obstacle rect overlaps character rect), check dodge success (obstacle passed character x without hit), update thread visual, check inactivity timer, update combo display
- `handleTap()`: trigger jump tweens for both characters (A: x-=60 arc, B: x+=60 arc), reset inactivity timer, play tap sound
- `spawnObstacle(lane, speed, type)`: create obstacle sprite from pool, set velocity
- `checkCollision(character, obstacle)`: AABB overlap check, 32x40 obstacle vs 40x48 character hitbox (with 4px grace on each side = effective 32x40 vs 32x40)
- `onHit(character)`: lose life, flash effect, invincibility timer, combo reset
- `onDodge(obstacle)`: score increment, combo increment, check perfect timing, near-miss check
- `onInactivityDeath()`: platform crumble animation, character fall, game over after 1000ms delay
- `gameOver()`: stop all tweens, play death effect, transition to GameOverScene after 800ms

**stages.js** (target: ~120 lines, max 300):
- `generateStage(stageNumber)`: returns { waves: [], wavesPerStage, obstacleSpeed, jumpA, jumpB, isBoss }
- `generateWave(stageNumber, waveIndex, params)`: returns { leftObstacle: {delay, speed, type}, rightObstacle: {delay, speed, type} }
- `calculateDifficultyParams(stageNumber)`: returns { speed, waveGap, syncChance, doubleChance, fastChance, asymmetric }
- `validateSolvability(wave, jumpA, jumpB)`: ensures overlap window >= 150ms, re-rolls if not
- `isRestWave(stageNumber, waveIndex)`: returns true for first 2 waves of every 5th stage
- `isBossStage(stageNumber)`: returns true for every 10th stage

**ui.js** (target: ~250 lines, max 300):
- MenuScene class: title text, tap-to-play, high score, help/settings buttons, idle character animation
- GameOverScene class: score display with count-up animation, high score check, buttons (continue ad, play again, menu)
- HUD overlay: created as a Phaser scene running parallel to GameScene; displays score, stage, combo, lives
- Pause overlay: semi-transparent background, resume/restart/help/quit buttons
- Settings overlay: sound/music/vibration toggles with localStorage persistence
- Button factory: `createButton(scene, x, y, width, height, text, color, callback)` -- consistent 44px+ touch targets

**help.js** (target: ~100 lines, max 300):
- HelpScene class: illustrated how-to-play screen
- Uses game SVG assets for visual diagrams
- Scroll support for overflow content
- "GOT IT!" button returns to previous scene (menu or pause)

**ads.js** (target: ~60 lines, max 300):
- `AdManager` singleton: tracks games_played_since_ad, continue_used, doubler_used
- `showInterstitial()`: placeholder, called every 3rd game over
- `showRewarded(type, callback)`: placeholder, calls callback(true) on reward
- `showBanner()`: placeholder, menu screen only
- `canContinue()`: returns !continue_used
- `canDouble()`: returns !doubler_used

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No additional CDN dependencies needed. Audio generated via Phaser's Web Audio support.

---

## 9. Juice Specification

### 9.1 Player Input Feedback (every tap)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Both characters | Count: 8 per character (16 total), Direction: radial burst from feet, Color: character color (#4FC3F7 for A, #FFB74D for B), Size: 3px circles, Lifespan: 400ms, Velocity: random 40-80px/s outward, Alpha: 1.0 -> 0 over lifespan |
| Screen shake | Camera | Intensity: 2px random offset x/y, Duration: 80ms, Easing: linear decay |
| Scale punch (characters) | Both character sprites | ScaleY: 0.7 on jump start (squash, 60ms), then ScaleY: 1.2 + ScaleX: 0.85 at peak (stretch, held during airtime), then ScaleY: 0.8 + ScaleX: 1.15 on land (squash, 80ms), then return to 1.0/1.0 over 100ms |
| Thread snap | Thread graphics line | Width: 2 -> 4px over 50ms, return to 2px over 200ms. Alpha: 0.8 -> 1.0 -> 0.8 over 300ms |
| Sound | -- | Airy whoosh, 150ms. Pitch: base + (combo_level * 2)% (max +40%). Pan: slight stereo spread (-0.2 for A, +0.2 for B) |
| Haptic | Device | navigator.vibrate(15) on supported devices |

### 9.2 Core Action Additional Feedback (successful dodge)

| Effect | Values |
|--------|--------|
| Particles (dodge) | Count: 12 per dodged obstacle, Direction: radial from obstacle position, Color: #76FF03 (lime), Size: 2px, Lifespan: 350ms, Velocity: 60-120px/s |
| Thread pulse | Width tween: 2 -> 5px over 100ms, return 200ms. Brightness flash: tint white (#FFFFFF) for 50ms, return to current combo color over 250ms |
| Hit-stop | 40ms physics pause (all obstacle movement freezes, characters complete jump). Implemented via `scene.time.timeScale = 0` with `setTimeout(40, () => scene.time.timeScale = 1)` -- using setTimeout, NOT delayedCall |
| Camera zoom | Scale: 1.0 -> 1.02 over 60ms, return to 1.0 over 200ms easing |
| Combo escalation | Every 5 combo: particle count +4 (caps at 28 at combo 20). Every 5 combo: screen shake intensity +1px (caps at 5px at combo 15). Thread glow radius +1px every 5 combo (caps at 6px). |
| Perfect dodge bonus | Additional: 20 gold particles (#FFD740), "PERFECT!" text center screen 32px bold, scale 0 -> 1.3 over 150ms -> 1.0 over 100ms, fade out over 400ms |
| Near miss | 4 white speed-line particles from obstacle edge toward character, 200ms. Character brief white tint 50ms. "+5" floating text 16px white, rise 40px + fade 500ms |

### 9.3 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 10px, Duration: 300ms, Frequency: 30ms per shake step, Decay: linear |
| Screen flash | Red overlay (#F44336) alpha 0.25, flash in 50ms, fade out 300ms |
| Hit character | Tint #F44336 for 100ms, then flash alpha 0.5/1.0 three cycles at 100ms each (total 600ms), knockback 20px away from obstacle over 200ms |
| Thread reaction | Alpha tween to 0.2 over 150ms, color shift to #F44336 for 300ms, recover to normal color at alpha 0.8 over 500ms |
| Sound | Low thud + crack, 250ms, slight reverb tail |
| Haptic | navigator.vibrate([30, 20, 50]) (burst pattern) |
| Effect -> UI delay (game over only) | 800ms from death animation start to GameOverScene transition |
| Death -> restart | **Under 2 seconds**: 800ms death animation + 200ms transition + instant GameScene create = ~1000ms total |
| Inactivity death special | Platform fragments: 6 pieces per platform (12 total), gravity accel 0.4px/frame^2, random horizontal velocity -2 to 2px/frame, alpha fade 0 over 800ms. Characters: fall downward at 3px/frame accelerating, shrink to 0.3 scale over 1000ms. Thread: stretches then snaps (alpha 0 at 400ms). Total animation: 1000ms before game over transition. |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{N}", Color: #76FF03 (lime), Font: 18px bold, Spawn: at midpoint between characters (x: center, y: 460px), Movement: rise 60px over 600ms, Alpha: 1.0 -> 0 over 600ms, Easing: ease-out |
| Perfect floating text | "+25 PERFECT", Color: #FFD740 (gold), Font: 22px bold, Same movement as above but rises 80px |
| Score HUD punch | Scale: 1.0 -> 1.4 over 80ms, return to 1.0 over 120ms. Color flash: white for 80ms then return to normal |
| Combo text | Base font: 28px. Size escalation: +2px per 5 combo levels (28 -> 30 -> 32 -> 34 -> 36 cap). Color: #76FF03 base, shifts to #FFD740 at combo 15+. Alpha: appears at 1.0, fades to 0 over 1500ms if no new combo. Scale punch on increment: 1.0 -> 1.3 -> 1.0 over 200ms |
| Stage clear text | "STAGE {N} CLEAR!", 32px, white, center screen. Scale: 0 -> 1.5 over 200ms (bounce ease), settle to 1.0 over 150ms. 20 particles burst from text position: 10 blue (#4FC3F7) + 10 orange (#FFB74D), radial, 300ms lifespan. Fade out over 500ms. |

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
- **Touch Events**: Use Phaser's `this.input.on('pointerdown', ...)` for tap detection (handles both touch and mouse)
- **Prevent Default**: CSS `touch-action: none` on game container. Prevent pull-to-refresh via `overscroll-behavior: none`.
- **Orientation**: Portrait lock via CSS `@media (orientation: landscape)` showing rotate prompt. Resize handler recalculates scale on orientation change.
- **Safe Areas**: `env(safe-area-inset-top)` padding for notch devices. HUD positioned below safe area.
- **Background State**: `document.addEventListener('visibilitychange', ...)` -- pause game when tab/app hidden.
- **Object Pooling**: Obstacle sprites recycled from a pool of 20 pre-created sprites. No runtime `new` calls during gameplay.
- **Particle Management**: Max 60 active particles at any time. Oldest particles killed when limit reached.

### 10.3 Touch Controls

- **Touch Target Size**: All buttons minimum 44x44px (Apple HIG). Pause button: 44x44px with 8px padding.
- **Tap Detection**: `pointerdown` event only (not pointerup) for instant response. No gesture recognition needed -- single tap only.
- **Input Buffering**: If a tap occurs during jump animation (400ms airborne), buffer it and execute on landing. Max 1 buffered input.
- **Tap Cooldown**: Minimum 100ms between registered taps to prevent accidental double-taps.
- **Feedback**: Visual (squash/stretch + particles), audio (whoosh), haptic (15ms vibrate) on every tap.

### 10.4 Collision Detection

- **Method**: AABB (Axis-Aligned Bounding Box) -- no physics engine needed.
- **Character hitbox**: 32x40px (4px grace inset from 40x48px sprite on each side).
- **Obstacle hitbox**: 28x36px (2px grace inset from 32x40px sprite).
- **Check frequency**: Every frame in `update()`.
- **Dodge detection**: Obstacle's leading edge passes character's trailing edge without overlap = successful dodge. Trigger score immediately.
- **Near-miss detection**: Obstacle's closest approach was within 8px of character hitbox edge but did not overlap.

### 10.5 Local Storage Schema

```json
{
  "trust_fall_high_score": 0,
  "trust_fall_games_played": 0,
  "trust_fall_highest_stage": 0,
  "trust_fall_best_combo": 0,
  "trust_fall_settings": {
    "sound": true,
    "music": true,
    "vibration": true
  },
  "trust_fall_total_score": 0,
  "trust_fall_ad_free_until": null
}
```

### 10.6 Known Anti-Patterns to Avoid

1. **NEVER** use `scene.time.timeScale = 0` with `scene.time.delayedCall()` for hit-stop. Use `setTimeout()` instead (Phaser timers freeze at timeScale 0).
2. **NEVER** call `textures.addBase64()` outside BootScene or on scene restart. Register all textures ONCE in BootScene.
3. **NEVER** use `CSS display:none` on Phaser canvas. Use `visibility:hidden; height:0; overflow:hidden` if hiding.
4. **NEVER** place text at higher depth than buttons without making text non-interactive (`text.disableInteractive()` or `text.setInteractive()` with passthrough).
5. **NEVER** load `main.js` before other scene files. Load order: config -> stages -> ads -> help -> ui -> game -> main (LAST).
6. **NEVER** emit events in `create()` before parallel scenes finish initializing. Null-guard all event handlers.
7. **ALWAYS** init HUD text from `GameState` values, not string literals like `'0'`, to prevent display reset on scene restart.
8. **ALWAYS** guard stage transitions with a `stageTransitioning` flag to prevent multiple calls when timer <= 0 in update loop.
9. **ALWAYS** handle resize/orientation events to recalculate game scale and reposition elements.
10. **Input buffer guard**: Do not allow taps during death animation or stage transition (set `inputEnabled = false` flag).
