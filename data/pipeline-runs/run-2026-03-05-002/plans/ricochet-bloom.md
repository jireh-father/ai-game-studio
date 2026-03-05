# Game Design Document: Ricochet Bloom

**Slug**: `ricochet-bloom`
**One-Liner**: Flick a ball and watch it bloom into a chain of perfect ricochets that paint the screen
**Core Mechanic**: Single flick triggering exponential ricochet chains
**Target Session Length**: 3-5 minutes
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Ricochet Bloom is a flick-based chain-reaction game where you launch a ball into a field of bumpers. Each bounce splits the ball into two, creating an exponential cascade of ricochets that paint the screen with watercolor-like trails. Your score depends on how many unique bumpers you hit before all balls come to rest.

The skill lies in reading the bumper layout and choosing the perfect flick angle and power. Bumpers decay on second contact — hit one twice and it shatters, leaving a dead zone. But where balls "bloom" (split), new bumpers grow from the impact point, creating emergent patterns that reward careful aim over random flicking.

The result is a game that feels like creating art through physics — each flick produces a unique, beautiful cascade that you authored with a single gesture.

### 1.2 Target Audience

Casual mobile gamers aged 16-35 who enjoy satisfying physics interactions and visual spectacle. Play context: short bursts during commutes, breaks, or idle moments. Low skill floor (anyone can flick), high skill ceiling (mastering angle prediction across splits). Appeals to both "zen" players who enjoy watching cascades and competitive players chasing high scores.

### 1.3 Core Fantasy

You are an artist whose brush is physics itself. One flick creates a blooming cascade of color that paints the screen. The fantasy is mastery through simplicity — a single, perfectly-aimed gesture that triggers a beautiful chain reaction. The satisfaction of watching your single input cascade into dozens of simultaneous events.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 3-5 minutes |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 22%+ |
| Average Flicks per Session | 8-15 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Aim & Flick] --> [Ball Bounces & Splits] --> [Chain Cascade Plays Out] --> [Score Tallied]
      ^                                                                          |
      |                                                                          v
      +---- [New Bumpers Grow] <--- [Bloom Points Created] <--- [Stage Clear / Death]
                                                                          |
                                                                    [Flick Timer Resets]
```

**Moment-to-moment**: The player sees a field of colored bumpers. They drag from the ball to set angle and power (slingshot mechanic), then release. The ball launches, hits a bumper, splits into two. Each child ball continues bouncing and splitting (up to the 64-ball cap). The player watches the cascade unfold — every bumper hit adds to score, every trail paints the canvas. When all balls stop or leave bounds, the round ends. New bumpers grow at bloom points, decayed bumpers are removed, and the player has 5 seconds to flick again or die.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Aim | Drag from ball | Slingshot aiming — drag opposite to launch direction. Dotted line shows trajectory of first 2 bounces |
| Adjust Power | Drag distance | Longer drag = more power. Power meter fills as drag extends. Max drag = 120px |
| Launch | Release | Ball launches in aimed direction at set power |

**Control Philosophy**: Slingshot drag is the most intuitive mobile gesture for aiming — used in Angry Birds, golf games, etc. The aiming guide (dotted prediction line showing first 2 bounces) addresses Dr. Loop's skill-vs-luck concern by making outcomes predictable and learnable. Power is naturally mapped to drag distance.

**Touch Area Map**:
```
+-------------------------------+
|  Score    Stage    Timer      |  <- HUD (non-interactive)
+-------------------------------+
|                               |
|        Bumper Field           |
|                               |
|     [Bumpers scattered]       |
|                               |
|                               |
|                               |
|         (O) Ball              |  <- Ball position (bottom-center area)
|                               |
+-------------------------------+
|    Drag anywhere to aim       |  <- Full screen is drag zone
+-------------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Bumper Hit (unique) | 100 | +50 per consecutive unique hit in same cascade |
| Bumper Hit (chain bonus) | 100 x chain_depth | chain_depth = number of splits deep (1st gen = 1x, 2nd = 2x, etc.) |
| Bumper Shatter (2nd hit) | 25 | No multiplier (penalty for waste) |
| Bloom Point (split) | 50 | +25 per split beyond the 4th in one cascade |
| Full Clear Bonus | 500 | All bumpers hit in one flick |
| Perfect Flick | 300 | All balls hit at least one bumper (no wasted splits) |

**Combo System**: Chain depth acts as the combo multiplier. First-generation balls score 1x, second-generation 2x, third 3x, up to 6x (max split depth before 64-ball cap). This rewards angles that create deep chains rather than shallow wide ones.

**High Score**: Stored in localStorage as `ricochet_bloom_high_score`. Displayed on menu and game-over screen. New high score triggers celebratory particle burst and "NEW BEST!" text.

### 2.4 Progression System

The game is an infinite flick-based structure. Each "stage" is a bumper field layout. After each flick resolves, the field evolves: hit bumpers decay, bloom points spawn new bumpers, and the layout shifts.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-3 | Static bumpers only, generous spacing, aim guide shows 3 bounces | Easy — learn flicking |
| 4-8 | Moving bumpers (slow drift), aim guide shows 2 bounces | Medium — timing matters |
| 9-15 | Glass bumpers (shatter on first hit, big points), aim guide shows 1 bounce | Hard — precision aim |
| 16-25 | Magnet bumpers (attract nearby balls), no aim guide preview | Very Hard — read the field |
| 26+ | All bumper types, faster movement, smaller bumpers | Extreme — pure mastery |

### 2.5 Lives and Failure

The player has 1 life per run (no lives system — death is instant restart).

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Flick timer expires (5s) | Instant death | Watch ad to get one more flick |
| Zero bumpers hit on a flick | Instant death (wasted flick = death) | Watch ad to retry that flick |
| All balls exit bounds without hitting anything | Same as zero hit | Same as above |

**Death Philosophy**: Death comes from inaction (timer) or incompetence (missing everything). This creates tension during the aim phase — you can't deliberate forever — while the cascade phase is pure spectacle. The 5s timer addresses Cash's concern about ad frequency by creating more death events than the original 12s.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each "stage" is a bumper field configuration. The field is a 360x640 area (portrait). Bumpers are placed procedurally.

**Generation Algorithm**:
```
Stage Generation Parameters:
- Seed: stage_number * 7919 + session_salt
- Bumper Count: min(8 + stage_number * 2, 40)
- Bumper Size: max(40 - stage_number * 0.5, 20) pixels radius
- Moving Bumpers: floor(stage_number / 4) count, speed: 0.3 + stage_number * 0.05 px/frame (cap 2.0)
- Glass Bumpers: floor((stage_number - 8) / 3) count (min 0)
- Magnet Bumpers: floor((stage_number - 15) / 5) count (min 0)
- Ball Start Position: bottom-center with slight random horizontal offset (+/- 30px)
- Minimum bumper spacing: 60px between centers
- Exclusion zone: 80px radius around ball start (no bumpers too close)
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

| Parameter | Stage 1-3 | Stage 4-8 | Stage 9-15 | Stage 16-25 | Stage 26+ |
|-----------|-----------|-----------|------------|-------------|-----------|
| Bumper Count | 8-12 | 14-20 | 22-30 | 32-38 | 40 |
| Bumper Radius | 38-40px | 34-38px | 28-34px | 22-28px | 20px |
| Moving Bumpers | 0 | 1-2 | 2-3 | 3-5 | 5+ |
| Move Speed | 0 | 0.3-0.5 | 0.6-1.0 | 1.0-1.5 | 1.5-2.0 |
| Glass Bumpers | 0 | 0 | 1-2 | 2-3 | 3+ |
| Aim Guide Bounces | 3 | 2 | 1 | 0 | 0 |
| Flick Timer | 5s | 5s | 5s | 5s | 5s |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every generated field must have at least one bumper reachable from the ball's start position via direct line of sight. Validate by raycasting in 36 directions (every 10 degrees) and confirming at least 3 bumpers are hittable.
2. **Variety Threshold**: At least 3 bumpers must change position between consecutive stages. Bloom-spawned bumpers ensure natural variety.
3. **Difficulty Monotonicity**: Overall bumper count and move speed never decrease. Local difficulty dips come from favorable bumper placement (emergent).
4. **Rest Stages**: Every 5th stage, bumpers are larger (+10px radius) and stationary — a visual reward stage that produces beautiful cascades.
5. **Special Stages**: Every 10th stage is a "Galaxy" layout — bumpers arranged in a spiral pattern, producing visually stunning cascades.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Watercolor-on-paper aesthetic. Clean white canvas background that gets "painted" by ball trails. Bumpers are soft, organic shapes with watercolor fills. The overall feel is a physics coloring book.

**Aesthetic Keywords**: Watercolor, bloom, organic, generative art, pastel

**Reference Palette**: Soft pastels on cream paper. Think botanical watercolor illustrations meets pinball.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Canvas | Warm White | #FFF8F0 | Game background — the "paper" |
| Ball | Deep Rose | #E84855 | Player ball, primary accent |
| Bumper 1 | Soft Violet | #9B72CF | Standard bumper fill |
| Bumper 2 | Ocean Teal | #3CBBB1 | Standard bumper alternate |
| Bumper 3 | Warm Gold | #EDB458 | Standard bumper alternate |
| Glass Bumper | Ice Blue | #C2E7F0 | Glass bumpers (shatter on first hit) |
| Magnet Bumper | Deep Indigo | #4A3F8C | Magnet bumpers |
| Trail | Varies | Per-ball color | Ball trails — inherit parent color with 40% opacity |
| Bloom Burst | Pink-White | #FFD6E0 | Bloom/split point particle burst |
| Danger/Timer | Coral Red | #FF6B6B | Timer warning, death flash |
| UI Text | Charcoal | #2D2D2D | Score, stage number, menu text |
| UI Background | Soft Gray | #F0EDE8 | Overlay backgrounds at 90% opacity |

### 4.3 SVG Specifications

**Ball (Player)**:
```svg
<circle cx="16" cy="16" r="14" fill="#E84855" opacity="0.9"/>
<circle cx="12" cy="12" r="4" fill="#FFB3BA" opacity="0.6"/>
<!-- Soft highlight for watercolor feel -->
```
Size: 32x32px. Phaser circle with gradient shader approximation.

**Standard Bumper**:
```svg
<circle cx="20" cy="20" r="18" fill="{bumper_color}" opacity="0.75"/>
<circle cx="20" cy="20" r="18" fill="none" stroke="{bumper_color}" stroke-width="2" opacity="0.4"/>
<circle cx="15" cy="15" r="5" fill="#FFFFFF" opacity="0.3"/>
<!-- Watercolor blob effect: slightly irregular edge via noise displacement -->
```
Size: varies by stage (40-20px radius). Colors cycle through Violet, Teal, Gold.

**Glass Bumper**:
```svg
<circle cx="20" cy="20" r="18" fill="#C2E7F0" opacity="0.4"/>
<circle cx="20" cy="20" r="18" fill="none" stroke="#C2E7F0" stroke-width="1.5" stroke-dasharray="4,3"/>
<circle cx="14" cy="14" r="6" fill="#FFFFFF" opacity="0.5"/>
```
Translucent appearance with dashed outline suggests fragility.

**Magnet Bumper**:
```svg
<circle cx="20" cy="20" r="18" fill="#4A3F8C" opacity="0.8"/>
<circle cx="20" cy="20" r="28" fill="none" stroke="#4A3F8C" stroke-width="1" opacity="0.2" stroke-dasharray="2,4"/>
<!-- Outer ring = magnetic field indicator -->
```
Visible "field" ring around the bumper pulses slowly.

**Trail Segment**:
Rendered as a series of overlapping circles with decreasing opacity along the ball's path, creating a watercolor brush stroke effect. Each trail circle: radius 6px, opacity from 0.4 to 0.0 over 30 frames.

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Trail painting | Ball movement | Spawn circle at ball position every 2 frames, opacity 0.35, fade to 0 over 800ms, color = ball's inherited color |
| Bloom burst | Ball splits | 20 tiny circles (r=3px) explode radially from split point, colors = parent + child colors, lifespan 400ms |
| Bumper hit flash | Ball contacts bumper | Bumper scales to 1.3x over 50ms then back to 1.0x over 100ms, emits 8 colored circles |
| Bumper shatter | 2nd hit on bumper | Bumper breaks into 6 triangular fragments that fly outward with gravity, fade over 600ms |
| Glass shatter | 1st hit on glass bumper | 12 shard particles (elongated rectangles) spray outward with rotation, sparkle effect |
| Screen shake | Death | Camera offset random +-8px for 300ms, decreasing intensity |
| Canvas fill | Stage clear | All trails pulse brightness +20% for 200ms, then settle — the "painting" is complete |
| Timer warning | 2s remaining | Ball pulses red glow, screen edges tint coral with increasing opacity |

---

## 5. Audio Design

### 5.1 Sound Effects

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Flick launch | Soft whoosh with satisfying pop | 200ms | High |
| Bumper hit | Bright marimba note (pitch varies by bumper color) | 150ms | High |
| Ball split (bloom) | Crystalline chime, ascending | 250ms | High |
| Glass shatter | Delicate tinkling glass break | 300ms | Medium |
| Chain combo (5+) | Ascending harp arpeggio overlay | 500ms | Medium |
| Timer tick (last 2s) | Soft heartbeat pulse | 200ms per beat | High |
| Death | Low reverb thud + glass crack | 500ms | High |
| Stage clear | Warm chord resolution + sparkle | 800ms | High |
| New high score | Ascending bell sequence + shimmer | 1.5s | High |
| UI tap | Soft click | 80ms | Low |

### 5.2 Music Concept

**Background Music**: No traditional BGM. Instead, the game creates its own music through gameplay. Each bumper hit plays a tuned note (pentatonic scale), so cascades produce emergent melodies. The faster and more complex the cascade, the richer the sound. This reinforces the "art through physics" fantasy.

**Music State Machine**:
| Game State | Audio Behavior |
|-----------|---------------|
| Menu | Soft ambient pad, C major, very quiet |
| Aiming | Ambient pad continues, slight tension build |
| Cascade Active | Bumper hits create pentatonic melody (C, D, E, G, A) |
| Stage Clear | Resolution chord (C major 7th) |
| Death | All audio ducks, reverb tail, silence |
| Game Over | Soft ambient returns |

**Audio Implementation**: Web Audio API (built into browser, no external library needed). Synth tones generated procedurally for bumper hits. Howler.js for pre-recorded UI sounds only.

---

## 6. UI/UX

### 6.1 Screen Flow

```
+----------+     +----------+     +----------+
|  Title   |---->|   Menu   |---->|   Game   |
|  Screen  |     |  Screen  |     |  Screen  |
+----------+     +----------+     +----------+
                      |                |
                      |           +----+----+
                      |           |  Pause  |
                      |           | Overlay |
                      |           +----+----+
                      |                |
                      |           +----+----+
                 +----+----+     |  Game   |
                 |Settings |     |  Over   |
                 | Overlay |     | Screen  |
                 +---------+     +----+----+
                                      |
                                 +----+----+
                                 | Ad/     |
                                 |Continue |
                                 | Prompt  |
                                 +---------+
```

### 6.2 HUD Layout

```
+-------------------------------+
| 12,450pts     Stage 7    5s  |  <- Score (left), Stage (center), Timer (right)
+-------------------------------+
|                               |
|     o        O                |  <- Bumper field
|          o       O            |
|   O          o                |
|       o  O        o           |
|                               |
|  O       o    O               |
|       O          o            |
|                               |
|          (*)                  |  <- Ball (bottom-center area)
|                               |
+-------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left | Current score, punch animation on increase | Every score event |
| Stage | Top-center | "Stage N" with subtle glow | On stage transition |
| Flick Timer | Top-right | Countdown "5s" → "4s" etc, turns red at 2s | Every second during aim phase |
| Chain Counter | Center (floating) | "x3 CHAIN!" appears during cascade, fades | During cascade |
| Ball Count | Below timer | Small counter showing active balls "x12" | During cascade |

### 6.3 Menu Structure

**Title/Menu Screen**:
- Game title "Ricochet Bloom" in watercolor-style text
- Play button (large, centered, pulsing gently)
- High Score display below play button
- Settings icon (gear, top-right)
- Sound toggle (speaker icon, top-left)

**Pause Menu** (overlay, semi-transparent cream background):
- Resume
- Restart
- Quit to Menu

**Game Over Screen**:
- "Your Painting" — final canvas with all trails visible as the background
- Final Score (large, animated count-up)
- High Score indicator ("NEW BEST!" if applicable)
- Stage Reached
- Bumpers Hit / Total stat
- "Extra Flick" button (rewarded ad — get one more flick to continue)
- "Play Again" button
- "Menu" button

**Settings Screen** (overlay):
- Sound Effects: On/Off toggle
- Music: On/Off toggle
- Vibration: On/Off toggle

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | "Extra Flick" after death | Every game over | Always (optional) |
| Rewarded | "Double Score" at game over | Every game over | Always (optional) |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Flick | Watch rewarded ad after death | Resume game with 1 flick + 5s timer reset | Once per game |
| Double Score | Watch rewarded ad at game over | 2x final score (for high score purposes too) | Once per session |

### 7.3 Session Economy

With the 5s flick timer creating frequent deaths for new players (expected 5-8 flicks before death at early stages), ad opportunities appear every 20-40 seconds of play. The "Extra Flick" rewarded ad is high-value because players can see their painting in progress and want to continue it.

**Session Flow with Monetization**:
```
[Aim & Flick] --> [Cascade] --> [Score] --> [Aim Again (5s timer)]
                                                    |
                                              [Timer expires / Miss]
                                                    |
                                              [Death Screen]
                                                    |
                                         [Rewarded Ad: Extra Flick?]
                                              | Yes --> [Resume with 1 flick]
                                              | No  --> [Game Over Screen]
                                                              |
                                                    [Interstitial (every 3rd)]
                                                              |
                                                    [Rewarded Ad: Double Score?]
                                                              |
                                                    [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/ricochet-bloom/
+-- index.html              # Entry point, CDN imports, script loading
+-- css/
|   +-- style.css           # Responsive layout, mobile-first, safe areas
+-- js/
    +-- config.js           # Constants, difficulty tables, colors, scoring values
    +-- main.js             # Phaser init, scene registration, global state, localStorage
    +-- game.js             # GameScene: ball physics, bumper field, cascade logic, splitting
    +-- stages.js           # Stage generation, bumper placement, difficulty scaling, bloom growth
    +-- ui.js               # MenuScene, GameOverScene, HUD, pause overlay, settings
    +-- ads.js              # Ad hooks, rewarded ad flow, interstitial timing
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- Game dimensions: 360x640 base, Phaser Scale.FIT
- Color palette hex constants
- Difficulty curve tables (bumper count, size, speed per stage range)
- Score values and multiplier rules
- Physics constants: ball speed range (200-600), friction 0.98, bounce restitution 0.85
- Ball split cap: 64 max balls, max split depth: 6
- Timer: 5000ms flick timer
- Trail settings: spawn interval 2 frames, fade duration 800ms

**main.js** (max 300 lines):
- Phaser.Game config with Arcade physics
- Scene registration: MenuScene, GameScene, GameOverScene
- Global state: highScore, gamesPlayed, settings
- localStorage read/write with `ricochet_bloom_` prefix
- Orientation handling and viewport meta

**game.js** (max 300 lines):
- GameScene: create(), update()
- Ball creation and flick input (drag → aim → release → launch)
- Aim guide rendering (dotted line, 1-3 bounce prediction via raycasting)
- Ball-bumper collision: score, split logic, decay tracking
- Ball splitting: on collision, spawn 2 child balls at 30-degree spread, inherit 80% velocity
- Cascade management: track all active balls, detect when all stopped/out-of-bounds
- Flick timer: 5s countdown, death on expiry
- Death sequence and transition to GameOverScene

**stages.js** (max 300 lines):
- `generateStage(stageNumber)`: returns array of bumper configs (position, type, color, size)
- Seeded random using stage number
- Bumper type distribution based on stage range
- Bloom growth: place new bumpers at split points from previous cascade
- Bumper decay: mark bumpers hit twice, remove on next stage
- Solvability validation: raycast check from ball position
- Special stage layouts (every 10th: spiral galaxy)

**ui.js** (max 300 lines):
- MenuScene: title text, play button, high score, settings toggle
- GameOverScene: score display with count-up animation, stats, action buttons
- HUD: score text, stage text, timer text (updated in GameScene)
- Pause overlay: resume/restart/quit buttons
- Floating score text: "+100" popups during cascade

**ads.js** (max 300 lines):
- Ad SDK placeholder initialization
- `showInterstitial()`: called every 3rd game over
- `showRewardedAd(callback)`: for extra flick and double score
- Frequency tracking via sessionStorage
- Fallback behavior when ads unavailable (skip gracefully)

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine, Arcade physics |

No Howler.js needed — using Web Audio API for procedural sound generation (bumper hit notes).

---

## 9. Juice Specification

### 9.1 Player Input Feedback (Flick Release)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Ball launch point | Count: 15, Direction: opposite to launch, Color: #FFD6E0, Lifespan: 300ms |
| Screen shake | Camera | Intensity: 3px, Duration: 100ms |
| Scale punch | Ball | Scale: 1.4x at moment of launch, Recovery: 100ms (shrinks as it flies) |
| Sound | -- | Whoosh + pop, Pitch: base |
| Haptic | Device | Single short vibration pulse 50ms |

### 9.2 Core Action Feedback (Bumper Hit + Split)

| Effect | Values |
|--------|--------|
| Bumper hit particles | Count: 8, Radial burst from impact point, Color: bumper's color, Lifespan: 250ms, Size: 3-6px |
| Bloom particles (split) | Count: 20, Radial explosion, Color: mix of parent + children colors (#FFD6E0 base), Lifespan: 400ms |
| Hit-stop | 30ms physics pause on FIRST hit of cascade only (subsequent hits don't pause to keep flow) |
| Bumper scale punch | 1.3x on hit, recovery 100ms, ease-out |
| Camera zoom | 1.02x on split, recovery 200ms |
| Combo escalation | Bumper hit sound pitch +5% per chain depth. Particle count +2 per chain depth. Trail opacity +5% per depth |
| Trail painting | Circle r=6px spawned at ball position every 2 frames, initial opacity 0.35, color = ball color, fades over 800ms |

### 9.3 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 10px, Duration: 300ms, Decreasing amplitude |
| Screen effect | Desaturation to 30% over 200ms, red vignette edge glow |
| Timer death | Ball cracks (radial lines drawn from center), then shatters into 12 fragments |
| Miss death | Ball deflates (scale 1.0 to 0.3 over 300ms) with sad descending tone |
| Sound | Low reverb impact 400ms + glass crack overlay |
| Effect-to-UI delay | 600ms between death animation end and game-over screen appearing |
| Death-to-restart | Under 1.5 seconds from "Play Again" tap to next flick ready |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{N}" at bumper hit position, Color: #2D2D2D, Float up 50px over 500ms, Fade from 1.0 to 0.0, Font: 18px bold |
| Score HUD punch | Scale 1.25x on update, recovery 120ms, ease-out-back |
| Chain text | "x{N} CHAIN!" at screen center when chain_depth >= 3, Font size: 24px + 4px per depth, Color: #E84855, Pulse scale 1.0-1.1, Fade after 800ms |
| Combo sounds | Pentatonic note pitch increases with chain: C4, D4, E4, G4, A4, C5 for depths 1-6 |
| Stage clear | All trails brighten +20% for 200ms, score does rapid count-up with tick sound per digit |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps with 64 balls active | Phaser FPS counter |
| Load Time | <2 seconds on 4G | Performance.timing API |
| Memory Usage | <80MB | Chrome DevTools |
| JS Bundle Size | <300KB total (excl. CDN) | File size check |
| First Interaction | <1 second after load | Time to interactive |

### 10.2 Ball Count Performance Strategy

The 64-ball cap is critical. Implementation:
- Object pool: pre-allocate 64 ball sprites at scene creation, activate/deactivate as needed
- Trail rendering: use a single RenderTexture for all trails (stamp circles onto it) rather than individual sprite objects
- Physics: Arcade physics (not Matter.js) — simpler collision detection, no need for complex shapes
- Split depth tracking: each ball stores its `depth` (0-6). At depth 6, balls no longer split
- Out-of-bounds culling: balls that exit the game area by >50px are immediately deactivated
- Collision optimization: bumpers are static bodies in a spatial grid, balls only check nearby cells

### 10.3 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser pointer events for drag aiming
- **Prevent Default**: Disable pull-to-refresh, pinch-zoom, double-tap-zoom
- **Orientation**: Portrait lock via CSS and screen.orientation API
- **Safe Areas**: CSS env(safe-area-inset-*) for notch devices
- **Background**: Pause game and timer on visibility change
- **Trail Texture**: Single RenderTexture avoids per-frame draw call explosion

### 10.4 Aim Guide Implementation

The aim guide (dotted prediction line) is key to making the game feel skill-based rather than random:
- Raycast from ball position in flick direction
- Find first bumper intersection using circle-line intersection math
- Draw dotted line from ball to first bounce point
- Calculate reflection angle, raycast again for second bounce
- At stages 1-3: show 3 bounces. Stages 4-8: 2 bounces. Stages 9-15: 1 bounce. Stage 16+: no guide
- Guide updates in real-time as player drags to adjust aim
- Guide does NOT account for ball splitting — only shows the primary ball's path

### 10.5 Edge Cases

- **Rapid flick**: If player flicks very quickly (drag <50ms), treat as tap — ignore (prevent accidental launches)
- **Ball stuck**: If a ball has velocity <0.5 for >2 seconds, force-deactivate it
- **All balls out simultaneously**: Detect via checking active ball count each frame, trigger stage end when count = 0
- **Split at boundary**: If split would place child ball out of bounds, only spawn the in-bounds child
- **Bumper overlap**: Generation algorithm enforces 60px minimum spacing; if bloom-spawned bumper would overlap, shift to nearest valid position
- **Timer during cascade**: Timer does NOT count down while balls are active — only starts when cascade resolves and player needs to aim next flick

### 10.6 Local Storage Schema

```json
{
  "ricochet_bloom_high_score": 0,
  "ricochet_bloom_games_played": 0,
  "ricochet_bloom_highest_stage": 0,
  "ricochet_bloom_settings": {
    "sound": true,
    "music": true,
    "vibration": true
  },
  "ricochet_bloom_total_score": 0,
  "ricochet_bloom_best_chain": 0
}
```
