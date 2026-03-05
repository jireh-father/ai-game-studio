# Game Design Document: Shockwave Hop

**Slug**: `shockwave-hop`
**One-Liner**: Tap to jump over expanding shockwave rings — each ring you clear sends a counter-shockwave that destroys nearby hazards
**Core Mechanic**: Tap-to-jump with 0.8s cooldown, dodge expanding rings, emit counter-shockwaves on successful clears
**Target Session Length**: 30-60 seconds
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

The player controls a small character standing on a platform at the bottom-center of the screen. Shockwave rings spawn from random points on screen and expand outward. The player must tap to jump at the right moment to hop over these rings as they pass through the character's position. A 0.8-second jump cooldown prevents spam-jumping, forcing precise timing.

The twist: every successful jump over a ring emits a counter-shockwave from the player that radiates outward, destroying any hazard orbs floating nearby. This creates a satisfying risk-reward loop — you WANT rings to come at you so you can clear hazards. But overlapping rings from multiple spawn points create complex timing puzzles where one jump can't dodge both. Ground hazards (spike strips) punish mistimed landings, adding a spatial awareness layer on top of the timing core.

The game escalates by increasing ring speed, spawn frequency, adding ground hazards, and introducing overlapping ring patterns. With 3 lives and a 4-second inactivity death timer, sessions are fast and lethal.

### 1.2 Target Audience

Casual mobile gamers aged 13-35 who play during short idle moments (commute, waiting, between tasks). Low skill floor (tap to jump) but high skill ceiling (reading overlapping ring patterns, optimizing counter-shockwave coverage). Appeals to rhythm-game fans who enjoy timing-based gameplay.

### 1.3 Core Fantasy

You are a shockwave surfer — every ring you dodge transforms you into a weapon. The satisfaction of jumping at the exact right moment, watching your counter-shockwave blast outward and obliterate hazards, creates a "flow state" power fantasy. You're not just surviving — you're fighting back.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 30-60 seconds |
| Day 1 Retention | 40%+ |
| Day 7 Retention | 20%+ |
| Average Stages per Session | 5-12 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Ring Spawns] → [Ring Expands Toward Player] → [Tap to Jump] → [Clear Ring]
       ↑                                                            │
       │                                              [Counter-shockwave emitted]
       │                                                            │
       │                                              [Hazard orbs destroyed]
       │                                                            │
       └──────── [Score + Next Ring] ←──── [Stage Progresses] ←────┘
                         │
                    [Miss Ring / Land on Spike]
                         │
                    [Lose Life → Game Over if 0]
```

Moment-to-moment: The player watches rings spawn and expand. They read the timing, tap to jump at the precise moment a ring passes their position. On success, a counter-shockwave blasts outward. They watch hazard orbs get destroyed for bonus points. They land, assess the next incoming ring(s), and time the next jump. The 0.8s cooldown means they must choose WHICH ring to jump if two overlap.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Jump | Tap (anywhere) | Character jumps upward, arc lasts 0.6s. 0.8s cooldown before next jump. |

**Control Philosophy**: One-tap simplicity. The entire game is about WHEN you tap, not WHERE. This makes the game instantly learnable but hard to master. The cooldown transforms it from a spam-fest into a precision timing game.

**Touch Area Map**:
```
┌─────────────────────────┐
│  Score    Stage    Lives │  ← HUD (non-interactive)
│                         │
│    [Ring spawn zone]    │
│                         │
│    [Hazard orbs float]  │
│                         │
│                         │
│  ──────[Player]──────   │  ← Platform (bottom 20%)
│                         │
│  [Entire screen = TAP]  │  ← Tap anywhere to jump
└─────────────────────────┘
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Ring cleared (jump over) | 100 | +50 per consecutive clear (combo) |
| Hazard orb destroyed by counter-shockwave | 50 per orb | x2 if 3+ orbs destroyed in one blast |
| Stage cleared | 200 | +100 per stage beyond stage 5 |
| Perfect clear (all orbs in stage destroyed) | 500 bonus | Only if zero orbs remain at stage end |

**Combo System**: Consecutive successful ring clears without taking damage build a combo counter. Each combo step adds +50 to ring clear points (100, 150, 200, 250...). Combo resets on hit. Counter-shockwave radius grows +10% per combo level (max +50% at combo 5+). Visual escalation: combo text grows larger, counter-shockwave color shifts from cyan to gold.

**High Score**: Stored in localStorage as `shockwave-hop_high_score`. Displayed on menu and game over screen. "NEW!" badge animates on new record.

### 2.4 Progression System

The game uses a continuous stage system. Each stage lasts until a set number of rings are cleared. Stage number increases ring count, speed, and introduces new mechanics.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-3 | Single rings, slow speed, no hazard orbs | Easy — learn jump timing |
| 4-7 | Hazard orbs appear, ring speed +20% | Medium — learn counter-shockwave |
| 8-12 | Overlapping rings (2 at once), ground spikes | Hard — choose which ring to jump |
| 13-20 | Fast rings, 3 simultaneous, dense orbs | Very Hard — precision + prioritization |
| 21+ | Max speed, 3-4 overlapping, spike patterns | Extreme — survival mastery |

### 2.5 Lives and Failure

3 lives. No way to earn extra lives during gameplay (keeps sessions short).

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Ring hits player (on ground, didn't jump) | Lose 1 life, 0.5s invincibility | None during play |
| Land on ground spike | Lose 1 life, 0.5s invincibility | None during play |
| Inactivity (4 seconds no tap) | Ring auto-spawns directly on player | Forces engagement |
| All 3 lives lost | Game over | Watch ad to continue (1 extra life, once per game) |

**Death-to-restart time**: Under 1.5 seconds. Game over screen appears after 600ms death animation, "Play Again" button immediately tappable.

**Inactivity death**: If 4 seconds pass with no tap, a ring spawns directly at the player's position with zero warning. This guarantees death for AFK players.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each stage requires clearing N rings to advance. Stage number determines all parameters.

**Generation Algorithm**:
```
Stage Generation Parameters:
- Rings to clear: 3 + floor(stageNumber * 0.5), capped at 8
- Ring speed: 80 + stageNumber * 8, capped at 200 px/s (expansion rate)
- Simultaneous rings: 1 (stages 1-7), 2 (stages 8-15), 3 (stages 16+)
- Ring spawn delay: max(1200 - stageNumber * 40, 500) ms between spawns
- Hazard orb count: max(0, stageNumber - 3), capped at 6
- Ground spike count: max(0, floor((stageNumber - 7) / 2)), capped at 3
- Ground spike width: 40px each, positioned randomly on platform (not under player start)
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
| Ring Speed (px/s) | 80-104 | 112-136 | 144-176 | 184-200 | 200 (cap) |
| Simultaneous Rings | 1 | 1 | 2 | 2-3 | 3 |
| Spawn Delay (ms) | 1160-1080 | 1040-920 | 880-720 | 680-500 | 500 (cap) |
| Hazard Orbs | 0 | 1-4 | 5-6 | 6 | 6 |
| Ground Spikes | 0 | 0 | 0-2 | 2-3 | 3 |
| Rings to Clear | 3-4 | 5-6 | 7 | 7-8 | 8 |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Rings never spawn closer than 0.8s apart (matching jump cooldown). If 2 rings overlap, at least one must be jumpable at a different timing window.
2. **Variety Threshold**: Ring spawn positions randomized each stage. Ground spike positions re-randomized.
3. **Difficulty Monotonicity**: Parameters only increase with stage number, never decrease.
4. **Rest Stages**: Every 5th stage (5, 10, 15...) has spawn delay +200ms, giving a brief breather.
5. **Boss/Special Stages**: Every 10th stage (10, 20, 30...) spawns one MEGA ring — extra large, slower, but worth 500 points. Visual: golden ring with particle trail.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Neon-geometric minimalism. Dark background with glowing neon elements. Rings are bright concentric circles. The player is a simple glowing figure. Everything pulses and radiates energy.

**Aesthetic Keywords**: Neon, Shockwave, Pulse, Electric, Minimal

**Reference Palette**: Cyberpunk arcade — dark void background with vivid cyan, magenta, and gold energy effects.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | Cyan | #00E5FF | Player character, counter-shockwave |
| Secondary | Magenta | #FF00E5 | Shockwave rings |
| Background | Deep Navy | #0A0E27 | Game background |
| Danger | Red-Orange | #FF3D00 | Hazard orbs, ground spikes, damage flash |
| Reward | Gold | #FFD700 | Score popups, combo text, perfect clear |
| UI Text | White | #FFFFFF | Score, stage, labels |
| UI Background | Dark Semi-transparent | #0A0E27CC | Menu overlays, game over |
| Platform | Slate Blue | #2A3A5C | Player platform |

### 4.3 SVG Specifications

**Player Character** (simple glowing humanoid):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48" width="32" height="48">
  <!-- Body -->
  <rect x="10" y="16" width="12" height="20" rx="4" fill="#00E5FF"/>
  <!-- Head -->
  <circle cx="16" cy="10" r="8" fill="#00E5FF"/>
  <!-- Eyes -->
  <circle cx="13" cy="9" r="2" fill="#0A0E27"/>
  <circle cx="19" cy="9" r="2" fill="#0A0E27"/>
  <!-- Legs -->
  <rect x="10" y="34" width="5" height="12" rx="2" fill="#00E5FF"/>
  <rect x="17" y="34" width="5" height="12" rx="2" fill="#00E5FF"/>
  <!-- Glow -->
  <circle cx="16" cy="24" r="20" fill="#00E5FF" opacity="0.1"/>
</svg>
```

**Shockwave Ring** (expanding circle, rendered via Phaser graphics — not static SVG):
- Drawn as `graphics.lineStyle(3, 0xFF00E5, alpha)` circle
- Alpha fades from 1.0 to 0.3 as ring expands
- Line width decreases from 3 to 1 as ring expands

**Hazard Orb**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
  <circle cx="10" cy="10" r="8" fill="#FF3D00"/>
  <circle cx="10" cy="10" r="5" fill="#FF6E40"/>
  <circle cx="8" cy="8" r="2" fill="#FFAB91"/>
</svg>
```

**Ground Spike**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20" width="40" height="20">
  <polygon points="0,20 10,2 20,20" fill="#FF3D00"/>
  <polygon points="10,20 20,0 30,20" fill="#FF3D00"/>
  <polygon points="20,20 30,2 40,20" fill="#FF3D00"/>
</svg>
```

**Platform**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 8" width="360" height="8">
  <rect x="0" y="0" width="360" height="8" rx="4" fill="#2A3A5C"/>
  <rect x="0" y="0" width="360" height="2" fill="#3A5A8C"/>
</svg>
```

**Design Constraints**:
- All SVG elements use basic shapes only (rect, circle, polygon)
- Maximum 8 path elements per SVG object
- Shockwave rings rendered via Phaser Graphics API (not SVG) for smooth scaling
- Counter-shockwave also via Graphics API with particle system

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Ring glow pulse | Ring expanding | Alpha oscillates 0.7-1.0 on 200ms cycle |
| Counter-shockwave burst | Successful jump over ring | Cyan circle expands from player, 15 particles radial |
| Hazard destroy flash | Orb hit by counter-shockwave | White flash 80ms, 8 orange particles scatter |
| Screen shake | Player hit | 6px intensity, 200ms duration |
| Death flash | Life lost | Screen flashes red (#FF3D0040) for 150ms |
| Platform pulse | Stage clear | Platform glows bright for 300ms, scale punch 1.05x |
| Combo glow | Combo 3+ | Player glow radius increases, color shifts toward gold |
| Landing squash | Player lands | ScaleY 0.7x for 80ms, recover to 1.0x |

---

## 5. Audio Design

### 5.1 Sound Effects

All sounds generated via Web Audio API (no external audio files needed for POC).

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Jump | Quick ascending whoosh | 150ms | High |
| Ring clear | Bright ping with reverb | 200ms | High |
| Counter-shockwave | Electric zap expanding outward | 300ms | High |
| Hazard destroyed | Crisp pop/crack | 150ms | Medium |
| Player hit | Low thud with distortion | 250ms | High |
| Stage clear | Ascending 3-note chime | 500ms | High |
| Game over | Descending chromatic tone | 800ms | High |
| Combo milestone (5+) | Metallic shimmer | 300ms | Medium |
| Menu tap | Subtle click | 80ms | Low |

### 5.2 Music Concept

**Background Music**: No music for POC. Sound effects carry the audio experience. The rhythmic whoosh-ping-zap of jumps and clears creates an emergent rhythm.

**Audio Implementation**: Web Audio API (built-in, no CDN needed for POC).

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Boot    │────→│   Menu   │────→│   Game   │
│  Scene   │     │  Screen  │     │  Screen  │
└──────────┘     └────┬─────┘     └──────────┘
                   │   │                │
              ┌────┘   │           ┌────┴────┐
              │        │           │  Pause  │
         ┌────┴────┐   │           │ Overlay │
         │  Help   │   │           └────┬────┘
         │How2Play │   │                │
         └─────────┘   │           ┌────┴────┐
                       │           │  Game   │
                       │           │  Over   │
                       │           │ Screen  │
                       │           └────┬────┘
                       │                │
                       │           ┌────┴────┐
                       │           │Continue │
                       │           │(Ad/Free)│
                       │           └─────────┘
                       │
                  ┌────┴────┐
                  │Settings │
                  │ Overlay │
                  └─────────┘
```

### 6.2 HUD Layout

```
┌─────────────────────────────────┐
│ Score: 1250   Stage 7   ♥♥♡    │  ← Top bar (always visible)
│          x3 COMBO!              │  ← Combo display (appears/fades)
├─────────────────────────────────┤
│                                 │
│      [Hazard orbs floating]    │
│                                 │
│         ◯ ← expanding ring     │
│                                 │
│     ◎ ← counter-shockwave     │
│                                 │
│  ═══════[Player]═══════════    │  ← Platform + character
│         ▲▲  ← ground spikes   │
├─────────────────────────────────┤
│        [Tap anywhere]          │  ← Implicit control zone
└─────────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left | Current score, punch animation on change | Every score event |
| Stage | Top-center | "Stage N" text | On stage transition |
| Lives | Top-right | Heart icons (filled cyan / empty outline) | On life change |
| Combo | Below top bar, center | "x3 COMBO!" text, grows with combo | On combo change, fades after 1.5s |
| Floating score | Near player | "+100" drifts upward | On each score event |

### 6.3 Menu Structure

**Main Menu**:
- Game title "SHOCKWAVE HOP" with pulsing neon glow
- "TAP TO PLAY" large button (cyan, pulsing)
- High Score display below title
- "?" help icon (top-left, 44x44px)
- Sound toggle (top-right, speaker icon, 44x44px)

**Pause Menu** (overlay, semi-transparent #0A0E27CC background):
- Resume (large button)
- Restart
- How to Play
- Menu

**Game Over Screen**:
- "GAME OVER" title
- Final Score (large, animated count-up)
- "NEW!" badge if high score
- Stage Reached
- "Continue (Watch Ad)" button — once per game
- "Play Again" button (prominent)
- "Menu" button (smaller)

**Help / How to Play Screen** (overlay):
- Title: "HOW TO PLAY"
- SVG illustration: player on platform, ring approaching, jump arrow
- "TAP to jump over shockwave rings"
- "Your jump sends a counter-shockwave!"
- SVG illustration: counter-shockwave destroying orbs
- "Avoid ground spikes when landing"
- "3 lives — don't get hit!"
- "Got it!" button

---

## 7. Monetization

### 7.1 Ad Placements

POC stage — no ad integration. Placeholder hooks only.

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after death | Every game over | Always (optional) |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Life | Watch rewarded ad after game over | 1 additional life, resume from current stage | Once per game |

### 7.3 Session Economy

Short sessions (30-60s) mean high game-over frequency. Interstitial every 3rd game over prevents fatigue. Rewarded continue is high-value (resume at current stage with 1 life) so conversion should be strong.

**Session Flow with Monetization**:
```
[Play Free] → [All Lives Lost] → [Rewarded Ad: Continue?]
                                        │ Yes → [Resume with 1 life]
                                        │ No  → [Game Over Screen]
                                                      │
                                                [Interstitial (every 3rd)]
                                                      │
                                                [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/shockwave-hop/
├── index.html              # Entry point, CDN Phaser 3, script load order
├── css/
│   └── style.css           # Responsive styles, mobile-first
└── js/
    ├── config.js           # Constants, colors, difficulty tables, SVG strings
    ├── stages.js           # Stage generation, difficulty parameters
    ├── ads.js              # Ad placeholder hooks
    ├── effects.js          # Particle systems, screen shake, juice effects
    ├── ui.js               # MenuScene, GameOverScene, HUD, Help, Pause
    ├── game.js             # GameScene: core mechanics, physics, input
    └── main.js             # BootScene, Phaser init, scene registration (LAST)
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- Color palette constants (COLORS object)
- Difficulty table: ring speed, spawn delay, orb count, spike count per stage range
- Jump parameters: height (120px), duration (600ms), cooldown (800ms)
- Counter-shockwave parameters: speed (300px/s), max radius (150px), orb destroy radius
- Scoring values: ring clear (100), orb destroy (50), stage clear (200), combo bonus (+50)
- Inactivity timeout: 4000ms
- SVG strings for player, hazard orb, ground spike, platform
- Lives: 3

**main.js** (max 300 lines — loads LAST):
- BootScene: register all SVG textures via `textures.addBase64()`
- Phaser.Game config: 360x640, CANVAS renderer, transparent background
- Scene registration: [BootScene, MenuScene, GameScene, UIScene]
- Resize handler for orientation changes

**game.js** (max 300 lines):
- GameScene: core gameplay
- `create()`: spawn player on platform, init ring pool, input handler, inactivity timer
- `update()`: expand active rings, check ring-player collision, check orb-counterwave collision, check spike-player collision, update inactivity timer
- Jump logic: on tap → if cooldown ready → player jumps (tween y), emit counter-shockwave on successful ring dodge
- Ring system: spawn rings at random positions, expand radius each frame, check if ring passes player y-position
- Counter-shockwave: expand from player position, check overlap with hazard orbs
- Life management: hit detection, invincibility frames (500ms), game over trigger

**stages.js** (max 300 lines):
- `generateStage(stageNumber)`: returns { ringCount, ringSpeed, spawnDelay, orbCount, spikeCount, spikePositions }
- Difficulty curve functions per the tables in Section 3
- Rest stage detection (every 5th)
- Boss stage detection (every 10th) — returns mega ring flag
- Orb position generation (random, not overlapping platform)
- Spike position generation (random on platform, min 60px apart, not at player start)

**ui.js** (max 300 lines):
- MenuScene: title, play button, high score, help button, sound toggle
- GameOverScene: score display, high score check, continue/play again/menu buttons
- UIScene (parallel overlay): HUD — score, stage, lives, combo counter
- HelpScene: illustrated instructions with game SVGs
- PauseOverlay: resume, restart, help, menu buttons
- All text uses Phaser BitmapText or built-in text with web-safe fonts

**effects.js** (max 300 lines):
- Particle emitter configs for counter-shockwave burst, hazard destroy, death
- Screen shake function (camera.shake)
- Scale punch function (tween scale)
- Floating score text function
- Combo text escalation
- Landing squash effect

**ads.js** (max 300 lines):
- Placeholder functions: `showInterstitial()`, `showRewarded(callback)`
- Game-over counter tracking for interstitial frequency
- Continue flag (once per game)
- All functions are no-ops for POC, structured for future SDK integration

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

### 8.4 Script Load Order in index.html

```html
<script src="js/config.js"></script>
<script src="js/stages.js"></script>
<script src="js/ads.js"></script>
<script src="js/effects.js"></script>
<script src="js/ui.js"></script>
<script src="js/game.js"></script>
<script src="js/main.js"></script>  <!-- MUST BE LAST -->
```

---

## 9. Juice Specification

### 9.1 Player Input Feedback (every tap/jump)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Player feet | Count: 8, Direction: downward fan, Color: #00E5FF, Lifespan: 300ms |
| Scale punch | Player | ScaleY: 1.3x stretch on jump start, recover 100ms |
| Landing squash | Player | ScaleY: 0.7x on land, ScaleX: 1.2x, recover 120ms |
| Sound | — | Ascending whoosh, Pitch: +5% per combo level |
| Platform ripple | Platform | Brief white flash line at player position, 100ms |

### 9.2 Core Action Feedback (ring clear + counter-shockwave)

| Effect | Values |
|--------|--------|
| Counter-shockwave ring | Cyan circle expands from player at 300px/s, alpha 0.8→0, line width 4→1 |
| Particles (radial burst) | Count: 20, Direction: radial from player, Color: #00E5FF→#FFD700, Lifespan: 400ms |
| Hit-stop | 40ms physics pause on ring clear moment |
| Camera zoom | 1.03x on clear, recover over 200ms |
| Combo escalation | Counter-shockwave radius +10% per combo (cap +50%), particle count +3 per combo |
| Screen flash | Subtle cyan overlay (#00E5FF15) for 60ms on clear |

### 9.3 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 10px, Duration: 250ms |
| Screen flash | Red overlay (#FF3D0040) for 150ms |
| Player knockback | Player bounces 30px in hit direction, alpha blinks 3x over 500ms (invincibility) |
| Sound | Low-frequency impact thud, 250ms |
| Hazard orb hit particles | 10 orange particles scatter from destroyed orb position |
| Death → UI delay | 600ms (death animation plays, then game over appears) |
| Death → restart | **Under 1.5 seconds** (600ms anim + instant UI) |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+100", Color: #FFD700, Movement: up 60px over 600ms, Fade: 400ms |
| Score HUD punch | Scale 1.4x, recover 150ms, color flash gold 200ms |
| Combo text | "x2 COMBO!" at center, font size 24 + (combo * 4)px, max 48px, Color: gold, Duration: 1.5s fade |
| Perfect clear | "PERFECT!" text 48px gold with 30 gold particles, 800ms display |
| Stage clear | "STAGE N CLEAR" slides in from right, 500ms display, platform glows |

### 9.5 Hazard Destroy Effects

| Effect | Values |
|--------|--------|
| Flash | White 80ms at orb position |
| Particles | 8 particles, Color: #FF6E40, Direction: radial scatter, Lifespan: 250ms |
| Scale | Orb scales to 1.5x then 0x over 150ms (pop effect) |
| Sound | Crisp pop/crack, pitch increases with orbs destroyed in same wave |
| Floating text | "+50" at orb position, Color: #FFAB91 |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | No external assets, SVG in code |
| Memory Usage | <80MB | Minimal object pooling for rings/particles |
| JS Bundle Size | <50KB total (excl. CDN) | 7 small files |
| First Interaction | <1 second after load | SVG textures register fast |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser pointer events, single-touch only
- **Prevent Default**: Disable pull-to-refresh, pinch-to-zoom, double-tap-to-zoom via CSS `touch-action: none`
- **Orientation**: CSS portrait lock, resize handler repositions all elements on orientation change
- **Object Pooling**: Ring objects and particles recycled (max 10 rings, max 50 particles active)
- **Graphics API**: Shockwave rings drawn via Phaser Graphics (no SVG scaling needed), cleared and redrawn each frame

### 10.3 Touch Controls

- **Touch Target Size**: All buttons minimum 48x48px
- **Gesture Recognition**: Tap only — no swipe, no hold, no multi-touch
- **Input Buffering**: If tap received during jump cooldown, buffer it and execute when cooldown expires (max 1 buffered input)
- **Dead Zone**: 100ms debounce after game over to prevent accidental button presses

### 10.4 Key Technical Decisions

1. **Rings via Graphics API, not sprites**: Shockwave rings expand smoothly using `graphics.clear()` + `graphics.strokeCircle()` each frame. More performant than scaling sprite textures.
2. **Collision detection for rings**: Check if ring radius is within ±15px of player distance from ring center while player is on ground (not jumping). Simple distance check, no physics engine needed.
3. **Counter-shockwave collision**: Expanding circle from player position. Each frame, check distance from counter-shockwave center to each hazard orb. If distance < counter-shockwave radius, orb is destroyed.
4. **No physics engine**: Pure Phaser tweens for jump arc (tween y position up then down). No Matter.js needed — game is timing-based, not physics-based.
5. **Jump arc**: `this.tweens.add({ targets: player, y: player.y - JUMP_HEIGHT, duration: JUMP_DURATION/2, ease: 'Sine.easeOut', yoyo: true })`

### 10.5 Local Storage Schema

```json
{
  "shockwave-hop_high_score": 0,
  "shockwave-hop_games_played": 0,
  "shockwave-hop_highest_stage": 0,
  "shockwave-hop_settings": {
    "sound": true
  },
  "shockwave-hop_total_score": 0
}
```

### 10.6 Critical Anti-Patterns to Avoid

1. **No Matter.js**: This game needs tweens, not physics. Do not add Matter.js.
2. **No `addBase64()` outside BootScene**: Register all textures once in BootScene. Scene restarts must not re-register.
3. **main.js loads LAST**: Script order in index.html must be config→stages→ads→effects→ui→game→main.
4. **No `timeScale=0` with `delayedCall()`**: Use `setTimeout()` for hit-stop if needed.
5. **Text depth vs button depth**: Ensure floating score text does not block tap input. Set text `setInteractive()` to false or use lower depth than game input zone.
6. **Ring spawn timing**: Never spawn 2 rings less than 800ms apart (matches jump cooldown) to guarantee solvability.
