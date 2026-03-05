# Game Design Document: Shrink Panic

**Slug**: `shrink-panic`
**One-Liner**: Your game screen PHYSICALLY SHRINKS every second — tap targets before your viewport disappears completely
**Core Mechanic**: Shrinking viewport with tap targets
**Target Session Length**: 30-60 seconds
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

The player's visible game area starts at full screen and continuously shrinks inward from all edges at a steady rate. Colorful targets spawn across the FULL original play area, but only those within the shrinking viewport are visible and tappable. The player must frantically tap targets to earn "expand energy" and occasionally reclaim lost viewport space via double-tap. Missing 3 targets triggers an instant 20% viewport collapse. If idle for 2 seconds, shrink speed triples. The game ends when the viewport shrinks to zero.

The brilliance is the PHYSICAL PANIC: the player literally watches their screen disappear. Every second feels urgent. The shrinking border creates a natural difficulty curve — as space shrinks, targets become harder to reach in time, creating escalating tension without artificial difficulty spikes.

### 1.2 Target Audience

Casual mobile gamers aged 13-35. Ideal for short sessions during commutes, waiting rooms, or quick breaks. The "shrinking screen" gimmick is instantly shareable on social media. Low skill floor (just tap targets) but high skill ceiling (managing expand energy, anticipating off-screen targets via audio cues).

### 1.3 Core Fantasy

You are fighting against the void consuming your world. Every tap is a desperate act of resistance. The satisfaction comes from reclaiming space with a well-timed double-tap expansion, watching your viewport BURST back outward — then immediately feeling the dread as it starts shrinking again.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 30-60 seconds |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 22%+ |
| Average Score per Session | 800-2000 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Viewport Shrinking] → [Targets Appear] → [Tap Target] → [+Score, +Expand Energy]
       ↑                                                           │
       │                    [Double-Tap → Expand Viewport]  ←──────┘
       │
       └──── [Miss 3 → 20% Collapse] ──→ [Viewport = 0 → GAME OVER]
```

Moment-to-moment: The viewport border creeps inward. Targets (colored circles) pop up at random positions across the original full area. Visible ones pulse to attract attention. The player taps them before they expire (2.5s lifespan). Each successful tap gives +1 expand energy (shown as a fill bar). When the bar reaches 5, the player can double-tap anywhere to trigger a viewport expansion burst (+15% viewport recovery). Missed targets (expired or outside shrinking viewport) increment the miss counter. At 3 misses, 20% of current viewport is instantly removed with a violent screen shake.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Hit Target | Single Tap | Tap a visible target to destroy it, earn points and expand energy |
| Expand Viewport | Double Tap (anywhere) | Spend 5 expand energy to recover 15% viewport size |
| — | — | No other controls needed — pure tap game |

**Control Philosophy**: Single-tap is the dominant action (95% of inputs). Double-tap for expansion is the strategic decision — do you expand now or save energy for a bigger crisis? The entire screen is the tap zone. No buttons, no UI interaction during gameplay except tapping targets and double-tapping to expand.

**Touch Area Map**:
```
┌─────────────────────────┐
│ Score    Energy Bar  ♥♥♥│  ← HUD (non-interactive, top 40px)
├─────────────────────────┤
│                         │
│  ┌───────────────────┐  │
│  │                   │  │  ← SHRINKING VIEWPORT (visible area)
│  │   [Target]  [T]   │  │     Targets only visible/tappable here
│  │        [T]        │  │
│  │   [T]             │  │
│  └───────────────────┘  │
│                         │  ← VOID ZONE (dark, targets hidden here)
│                         │
└─────────────────────────┘
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Target tap (normal) | 100 | Base score |
| Target tap (edge — within 20px of viewport border) | 200 | Risk bonus for tapping near the edge |
| Target tap (combo, consecutive within 0.8s) | 100 + 50 per chain | Combo chain: +50 per consecutive hit |
| Expand burst | 300 | Bonus for using expansion |
| Survival bonus | +10 per second alive | Accumulates continuously |

**Combo System**: Consecutive taps within 0.8 seconds of each other build a combo chain. Each chain link adds +50 points (100, 150, 200, 250...). Combo resets if 0.8s passes without a tap. Combo counter displayed as floating text that grows larger with each chain.

**High Score**: Stored in localStorage under `shrink_panic_high_score`. Displayed on menu and game over screen. New high score triggers confetti particles and "NEW BEST!" text.

### 2.4 Progression System

The game is endless with a single continuous session. "Stages" are implicit — every 10 seconds alive is a new difficulty tier. The game gets harder naturally as the viewport shrinks, and explicitly through faster target spawn, shorter target lifespan, and new target types.

**Progression Milestones**:

| Time Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 0-10s | Normal targets only (large, 48px) | Shrink: 3px/sec per edge. Target lifespan: 2.5s |
| 10-20s | Small targets (32px) mixed in | Shrink: 4px/sec. Target lifespan: 2.2s |
| 20-30s | Decoy targets (red, -1 energy if tapped) | Shrink: 5px/sec. Target lifespan: 2.0s |
| 30-45s | Fleeting targets (1.2s lifespan, worth 250pts) | Shrink: 6px/sec. Target lifespan: 1.8s |
| 45s+ | All types mixed, maximum chaos | Shrink: 7px/sec. Target lifespan: 1.5s |

### 2.5 Lives and Failure

There are no traditional lives. The viewport IS the life bar. Failure conditions:

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Viewport shrinks to 0 (< 30px) | Game Over | Watch ad to restore viewport to 30% |
| Miss 3 targets (cumulative) | 20% instant viewport collapse, miss counter resets | No recovery — earn it back via expand |
| Idle > 2 seconds | Shrink speed triples (3x) until next tap | Tap anything to restore normal speed |

**Inactivity Death**: If idle for 2s, shrink speed goes from normal to 3x. At 3x speed, viewport collapses from full to zero in ~8 seconds. This ensures death within 10-12s of total inactivity (well under 30s requirement).

---

## 3. Stage Design

### 3.1 Infinite Stage System

There are no discrete stages — the game runs as one continuous shrinking session. Target spawning is the procedural system.

**Generation Algorithm**:
```
Target Spawn Parameters:
- Spawn interval: max(400ms, 1200ms - (elapsed_seconds * 25ms))
- Position: random (x, y) within FULL original game area (not just viewport)
- Size: weighted random — 70% normal (48px), 20% small (32px), 10% decoy (after 20s)
- Lifespan: max(1500ms, 2500ms - (elapsed_seconds * 30ms))
- Fleeting targets: 15% chance after 30s (lifespan 1200ms, 250pts)
- Max simultaneous targets: min(8, 3 + floor(elapsed_seconds / 10))
```

### 3.2 Difficulty Curve

```
Difficulty
    │
100 │                                          ──────── (cap at 45s)
    │                                    ╱
 80 │                              ╱
    │                        ╱
 60 │                  ╱
    │            ╱
 40 │      ╱
    │  ╱
 20 │╱
    │
  0 └──────────────────────────────────────── Time (s)
    0     10    20    30    40    50    60
```

**Difficulty Parameters by Time**:

| Parameter | 0-10s | 10-20s | 20-30s | 30-45s | 45s+ |
|-----------|-------|--------|--------|--------|------|
| Shrink rate (px/sec/edge) | 3 | 4 | 5 | 6 | 7 |
| Target lifespan (ms) | 2500 | 2200 | 2000 | 1800 | 1500 |
| Spawn interval (ms) | 1200 | 950 | 700 | 550 | 400 |
| Max targets on screen | 3 | 4 | 5 | 6 | 8 |
| Target types | Normal | Normal+Small | +Decoy | +Fleeting | All mixed |

### 3.3 Stage Generation Rules

1. **Visibility Guarantee**: At least 40% of spawned targets must appear within the current viewport (not all hidden in void).
2. **Fairness Buffer**: No target spawns within 200ms of another at the same position.
3. **Decoy Spacing**: Decoy targets never spawn adjacent to normal targets (minimum 80px distance).
4. **Audio Cues**: Targets spawning outside viewport trigger a directional audio ping (left/right pan based on position).
5. **Mercy Spawn**: If viewport < 25%, next 2 spawns are guaranteed inside viewport.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Neon-minimalist with a dark void aesthetic. The shrinking viewport has a glowing border. The void zone outside is deep black with subtle static/noise. Targets are bright, saturated circles that pulse. The contrast between the bright active zone and the consuming darkness creates visceral tension.

**Aesthetic Keywords**: Neon, Void, Panic, Glow, Collapse

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Viewport Border | Electric Cyan | #00FFFF | Glowing viewport edge |
| Background (active) | Deep Navy | #0A0E27 | Inside viewport |
| Void Zone | Pure Black | #000000 | Outside viewport (with noise texture) |
| Normal Target | Bright Green | #39FF14 | Standard tappable target |
| Small Target | Hot Pink | #FF1493 | Smaller, harder targets |
| Decoy Target | Crimson Red | #DC143C | Trap targets (don't tap!) |
| Fleeting Target | Gold | #FFD700 | High-value quick targets |
| Expand Energy | Electric Blue | #00BFFF | Energy bar fill |
| Score Text | White | #FFFFFF | HUD score display |
| Danger Flash | Red | #FF0000 | Miss penalty, collapse warning |

### 4.3 SVG Specifications

**Normal Target** (48px):
```svg
<svg width="48" height="48" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="20" fill="#39FF14" opacity="0.9"/>
  <circle cx="24" cy="24" r="12" fill="#0A0E27"/>
  <circle cx="24" cy="24" r="6" fill="#39FF14"/>
</svg>
```

**Small Target** (32px):
```svg
<svg width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="14" fill="#FF1493" opacity="0.9"/>
  <circle cx="16" cy="16" r="7" fill="#0A0E27"/>
</svg>
```

**Decoy Target** (48px):
```svg
<svg width="48" height="48" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="20" fill="#DC143C" opacity="0.9"/>
  <line x1="14" y1="14" x2="34" y2="34" stroke="#0A0E27" stroke-width="4"/>
  <line x1="34" y1="14" x2="14" y2="34" stroke="#0A0E27" stroke-width="4"/>
</svg>
```

**Fleeting Target** (40px):
```svg
<svg width="40" height="40" viewBox="0 0 40 40">
  <polygon points="20,2 25,15 39,15 28,24 32,38 20,30 8,38 12,24 1,15 15,15" fill="#FFD700"/>
</svg>
```

**Expand Energy Icon**:
```svg
<svg width="24" height="24" viewBox="0 0 24 24">
  <polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="#00BFFF"/>
</svg>
```

**Design Constraints**:
- All SVG elements use basic shapes (circle, line, polygon) — no complex paths
- Maximum 6 elements per SVG object
- Pulse animation via Phaser tween (scale 1.0 → 1.15 → 1.0, 400ms loop)
- Target spawn: scale from 0 → 1 over 150ms (pop-in effect)

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Viewport glow pulse | Continuous | Viewport border alpha oscillates 0.7-1.0, 800ms cycle |
| Target pop-in | Target spawn | Scale 0→1 over 150ms with bounce ease |
| Target burst | Target tapped | 12 small particles radiate outward, match target color, fade over 400ms |
| Collapse flash | Miss 3 penalty | Viewport border flashes red (#FF0000) 3 times over 300ms, screen shake |
| Expand burst | Double-tap expand | Viewport border pulses outward with cyan wave, 8 star particles |
| Void creep | Continuous | Subtle animated noise/static in void zone (dark particles drifting inward) |
| Death spiral | Game over | Viewport collapses to center point over 600ms, white flash |

---

## 5. Audio Design

### 5.1 Sound Effects

All audio generated via Web Audio API oscillators (no external audio files needed).

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Target tap (normal) | Bright pop — sine wave 800Hz→1200Hz | 80ms | High |
| Target tap (small) | Higher pop — sine 1000Hz→1600Hz | 60ms | High |
| Target tap (combo) | Pop with rising pitch (+100Hz per chain) | 80ms | High |
| Decoy tap | Harsh buzz — square wave 200Hz | 150ms | High |
| Fleeting tap | Sparkle chime — triangle 1200Hz→2000Hz | 120ms | High |
| Miss penalty (3 misses) | Low rumble — sawtooth 80Hz→40Hz | 300ms | High |
| Expand burst | Whoosh — noise sweep up 200Hz→800Hz | 250ms | High |
| Off-screen target cue | Soft ping — sine 600Hz, stereo panned | 100ms | Medium |
| Viewport shrink warning (< 30%) | Heartbeat pulse — sine 60Hz, repeating | 400ms per beat | Medium |
| Game over | Descending tone — sine 400Hz→100Hz | 500ms | High |
| New high score | Ascending arpeggio — sine 400,600,800,1200Hz | 600ms | Medium |

### 5.2 Music Concept

**Background Music**: No traditional music. The "soundtrack" is the ambient tension of the shrinking viewport — the heartbeat pulse at low viewport, the increasingly frantic target spawn pings, and the combo chain rising pitches. This creates an emergent audio landscape that escalates with gameplay intensity.

**Audio State Machine**:
| Game State | Audio Behavior |
|-----------|---------------|
| Menu | Soft ambient hum (sine 120Hz, low volume) |
| Game (viewport > 50%) | Target pings only, calm |
| Game (viewport 25-50%) | Target pings + subtle tension drone (sine 80Hz) |
| Game (viewport < 25%) | Heartbeat pulse + tension drone + faster pings |
| Expand burst | Brief silence (100ms) then whoosh — audio "relief" moment |
| Game Over | All audio cuts, descending tone |

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Menu    │────→│   Game   │────→│ Game Over│
│  Screen  │     │  Screen  │     │  Screen  │
└──────────┘     └──────────┘     └──────────┘
     │                │                │
     │           ┌────┴────┐          │
     │           │  Pause  │          │
     │           │ Overlay │          │
     │           └─────────┘          │
     │                                │
     └──────── [Play Again] ←─────────┘
```

### 6.2 HUD Layout

```
┌─────────────────────────────────┐
│ SCORE: 1250   ⚡⚡⚡⚡⚡  ♥♥♥ │  ← Top bar: score, energy (5 icons), miss counter (3 hearts)
├─────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ░░┌────────────────────────┐░░░│
│ ░░│                        │░░░│  ← Shrinking viewport with glowing cyan border
│ ░░│    ●    ◆         ●   │░░░│     ● = targets, ◆ = fleeting
│ ░░│         ●    ✕        │░░░│     ✕ = decoy
│ ░░│    ●              ●   │░░░│
│ ░░└────────────────────────┘░░░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  ← Void zone (dark with noise)
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left | Current score with scale punch on change | Every score event |
| Energy Bar | Top-center | 5 star icons, fill cyan when charged | On energy gain/spend |
| Miss Counter | Top-right | 3 heart icons, deplete on miss | On target miss |
| Combo Text | Center (floating) | "x3!", "x5!" — grows with chain length | On combo chain |
| Viewport % | Below score | "78%" viewport remaining indicator | Every 500ms |
| Timer | Top-center-right | Seconds survived | Every second |

### 6.3 Menu Structure

**Main Menu**:
- Game title "SHRINK PANIC" with pulsing glow effect
- "TAP TO PLAY" (large, pulsing text — tapping anywhere starts)
- High Score display below title
- Sound toggle (speaker icon, top-right)
- How to Play / "?" (bottom-right)

**Pause Menu** (overlay, tap top-left pause icon during game):
- Resume
- How to Play
- Restart
- Quit to Menu

**Game Over Screen**:
- Final Score (large, animated count-up)
- "NEW BEST!" if high score (with confetti)
- Time Survived
- Targets Hit count
- Best Combo count
- "Watch Ad to Continue" button (restores viewport to 30%)
- "Play Again" button (large, prominent)
- "Menu" button (smaller)

**Help / How to Play Screen** (overlay):
- Visual diagram showing shrinking viewport concept
- SVG illustrations: tap target → burst, double-tap → expand
- Rules: "Miss 3 = 20% collapse", "Idle = 3x shrink", "Fill 5 stars → double-tap to expand"
- Tips: "Prioritize edge targets for 2x points", "Save expansion for emergencies"
- "Got it!" button

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after death | Every game over | Always (optional) |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Continue | Watch rewarded ad after death | Viewport restored to 30%, miss counter reset | Once per game |

### 7.3 Session Economy

Short sessions (30-60s) mean high game-over frequency. Interstitial every 3rd death balances revenue with player patience. Rewarded continue is compelling because viewport restoration gives a genuine second chance.

**Session Flow with Monetization**:
```
[Play] → [Death (viewport=0)] → [Rewarded Ad: Continue?]
                                       │ Yes → [Viewport 30%, resume play]
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
games/shrink-panic/
├── index.html              # Entry point, CDN Phaser 3, script load order
├── css/
│   └── style.css           # Responsive styles, void zone styling
└── js/
    ├── config.js           # Colors, difficulty tables, SVG strings, scoring values
    ├── stages.js           # Target spawn algorithm, difficulty scaling by time
    ├── ads.js              # Ad integration hooks (placeholder)
    ├── effects.js          # Particle systems, screen shake, viewport glow
    ├── ui.js               # MenuScene, GameOverScene, HUD overlay, pause, help
    ├── game.js             # GameScene: viewport shrink logic, target management, input, scoring
    └── main.js             # BootScene (register SVG textures), Phaser config, scene array
```

**Script load order in index.html**: config → stages → ads → effects → ui → game → main (MAIN LAST)

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- All color hex constants (COLORS object)
- Difficulty table: shrink rates, target lifespans, spawn intervals by time bracket
- SVG strings for all target types, energy icon
- Scoring values (BASE_SCORE, EDGE_BONUS, COMBO_INCREMENT, EXPAND_BONUS)
- Gameplay constants (EXPAND_COST=5, EXPAND_RECOVERY=0.15, MISS_PENALTY=0.20, IDLE_THRESHOLD=2000, IDLE_MULTIPLIER=3)
- Target type definitions with sizes, colors, point values

**main.js** (max 300 lines):
- BootScene: register all SVG textures from config.js via `textures.addBase64()`
- Phaser.Game config: Canvas renderer, responsive scaling (FIT mode), transparent=false
- Scene array: [BootScene, MenuScene, GameScene, GameOverScene]
- Global state: highScore, gamesPlayed from localStorage

**game.js** (max 300 lines):
- GameScene: core gameplay
- `create()`: Initialize viewport rect (Graphics object), target group, input handlers, timers
- `update()`: Shrink viewport each frame (delta-based), check viewport bounds, update target visibility
- Viewport management: shrinkViewport(), expandViewport(), collapseViewport()
- Target spawn timer (time event, interval from difficulty table)
- Tap detection: check if tap is within viewport AND on a target
- Double-tap detection: two taps within 300ms = expand trigger
- Miss tracking: target.lifespan expires → increment miss counter
- Idle detection: track lastTapTime, if > 2s → shrink multiplier = 3

**stages.js** (max 300 lines):
- `getSpawnParams(elapsedSeconds)`: returns { interval, lifespan, maxTargets, types[], sizes[] }
- `generateTargetPosition(gameWidth, gameHeight, viewportRect)`: ensures 40% inside viewport
- `getTargetType(elapsedSeconds)`: weighted random based on time bracket
- Difficulty interpolation between time brackets (smooth, not stepped)
- Mercy spawn logic when viewport < 25%

**ui.js** (max 300 lines):
- MenuScene: title text with glow, "TAP TO PLAY", high score, sound toggle, help button
- GameOverScene: score display, stats (time, targets hit, best combo), buttons
- HUD (as UIScene running parallel to GameScene): score, energy bar, miss hearts, combo text, viewport %
- PauseOverlay: resume, restart, help, quit
- HelpOverlay: illustrated instructions with SVG diagrams

**effects.js** (max 300 lines):
- `burstParticles(x, y, color, count)`: radial particle burst on target hit
- `expandWave(viewportRect)`: cyan wave pulse on expand
- `collapseShake(camera)`: screen shake on miss penalty
- `deathSpiral(viewportRect, camera)`: viewport collapse animation on game over
- `comboText(x, y, comboCount)`: floating combo counter with size escalation
- `scorePopup(x, y, points)`: floating "+100" text

**ads.js** (max 300 lines):
- Placeholder ad hooks (interstitial, rewarded)
- `showInterstitial()`: called every 3rd game over
- `showRewarded(callback)`: called on "Continue" button, callback restores viewport
- Game-over counter tracking

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No Howler.js needed — audio via Web Audio API oscillators (generated in effects.js).

---

## 9. Juice Specification

### 9.1 Player Input Feedback (every target tap)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Tapped target position | Count: 12, Direction: radial, Color: match target color, Lifespan: 400ms |
| Screen shake | Camera | Intensity: 3px, Duration: 100ms |
| Scale punch | Energy bar icon (latest filled) | Scale: 1.4x, Recovery: 120ms |
| Sound | — | Sine pop 800→1200Hz, 80ms. Pitch: +100Hz per combo chain |
| Haptic | Device | `navigator.vibrate(30)` on supported devices |

### 9.2 Core Action Additional Feedback (tap — most frequent input)

| Effect | Values |
|--------|--------|
| Target pop | Target scales 1.3x over 50ms then explodes into particles |
| Floating score text | "+100" (or bonus) rises 60px, fades over 500ms, color matches target |
| Combo escalation | Combo text size: 24px + (4px * comboCount), max 48px. Color shifts green→gold at 5+ chain |
| Hit-stop | 30ms freeze (game.scene.time.timeScale via setTimeout, NOT delayedCall) |
| Camera zoom | 1.02x on tap, recovery over 150ms |

### 9.3 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Miss penalty (3 misses) | Screen shake: 10px intensity, 300ms. Viewport border flashes red 3x. Rumble sound 80Hz→40Hz, 300ms |
| Idle warning (2s) | Viewport border turns orange, pulse speed doubles. Warning tone |
| Game over (viewport=0) | Viewport spiral-collapses to center over 600ms. White flash 100ms. Descending tone 400→100Hz. Camera shake 12px, 400ms |
| Death → restart delay | 800ms (collapse animation 600ms + flash 200ms), then game over screen |
| Game over → play again | Instant (< 1 second to restart from game over screen) |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{N}", Color: #FFFFFF (normal) / #FFD700 (bonus), Movement: up 60px, Fade: 500ms |
| Score HUD punch | Scale 1.3x, Recovery: 150ms, color flash to #39FF14 on increase |
| Combo text | "x{N}!" at tap position. Size: 24px base + 4px per chain. Fade: 600ms |
| Edge bonus text | "EDGE!" in #00FFFF, 32px, above floating score text |
| Expand ready | All 5 energy icons pulse simultaneously, "EXPAND READY" text flashes 3x |

### 9.5 Viewport Expand Effects (double-tap)

| Effect | Values |
|--------|--------|
| Expand wave | Cyan ring emanates from viewport border outward, fades over 300ms |
| Viewport growth | Animated expansion over 200ms (not instant) with ease-out |
| Star particles | 8 star particles burst from viewport corners, cyan, fade 500ms |
| Sound | Whoosh sweep 200→800Hz, 250ms |
| Camera | Zoom 1.05x → 1.0 over 300ms (breathing room feeling) |
| Screen flash | Brief cyan tint overlay, 80ms |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds (no external assets) | Performance.timing API |
| Memory Usage | <80MB | Minimal — SVG textures + particles only |
| JS Bundle Size | <50KB total | All JS files combined |
| First Interaction | <500ms after load | SVG textures register near-instantly |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser pointer events, handle both touch and mouse
- **Prevent Default**: Prevent pull-to-refresh, pinch-to-zoom, double-tap-to-zoom via CSS `touch-action: none`
- **Orientation**: Support both portrait and landscape. Viewport shrinks relative to current canvas size. Handle resize events.
- **Particle Limit**: Max 60 active particles at any time (recycle oldest)
- **Target Limit**: Max 8 targets on screen (enforced by spawn algorithm)

### 10.3 Viewport Shrink Implementation

The viewport is implemented as a Phaser Graphics mask:
1. Full canvas is rendered (all targets exist at their positions)
2. A rectangular Graphics object defines the "visible area"
3. Apply as camera mask — only content within the rectangle is rendered
4. Shrink the rectangle each frame: `x += shrinkRate * delta, y += shrinkRate * delta, w -= 2*shrinkRate * delta, h -= 2*shrinkRate * delta`
5. Void zone: draw black rectangles in the margin areas, with subtle animated noise overlay
6. Viewport border: separate Graphics rectangle with stroke, glow via alpha tween

**Critical**: Use camera mask (not manual visibility toggling per target) for performance. Targets check `viewport.contains(target.x, target.y)` for tap validation.

### 10.4 Double-Tap Detection

```
lastTapTime = 0
DOUBLE_TAP_THRESHOLD = 300ms

onPointerDown:
  currentTime = Date.now()
  if (currentTime - lastTapTime < DOUBLE_TAP_THRESHOLD):
    if (expandEnergy >= EXPAND_COST):
      triggerExpand()
      return  // consume the double-tap, don't process as target tap
  else:
    checkTargetHit(pointer)
  lastTapTime = currentTime
```

### 10.5 Local Storage Schema

```json
{
  "shrink_panic_high_score": 0,
  "shrink_panic_games_played": 0,
  "shrink_panic_best_time": 0,
  "shrink_panic_best_combo": 0,
  "shrink_panic_settings": {
    "sound": true,
    "vibration": true
  }
}
```

### 10.6 Known Phaser Pitfalls (from project history)

- **NEVER** use `this.time.timeScale = 0` with `delayedCall()` — use `setTimeout()` for hit-stop
- **NEVER** call `textures.addBase64()` outside BootScene — register all textures once on boot
- **Text depth > button depth** blocks pointer events — make text non-interactive or set `text.setInteractive()` passthrough
- **main.js must load LAST** in index.html script order
- **Orientation resize**: listen for `resize` event in game scene, recalculate viewport bounds relative to new canvas size
