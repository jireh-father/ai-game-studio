# Game Design Document: Valve Panic

**Slug**: `valve-panic`
**One-Liner**: Tap-and-hold valves to release pressure from overloading pipes -- let go too early and pressure rebuilds, too late and you miss the next pipe
**Core Mechanic**: Multiple pipes fill with pressure (colored liquid rising). Tap and hold a valve to release. Release too early = pressure bounces 30% higher. Only ONE valve at a time. Pipes fill at different rates. Any pipe at max = BURST = game over.
**Target Session Length**: 30-90 seconds
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Valve Panic is a frantic pressure-management game where the player must juggle multiple pipes filling with colored liquid. Each pipe fills at its own rate, and the player can only operate ONE valve at a time by tapping and holding. While holding a valve, that pipe drains -- but every other pipe keeps filling. The core tension comes from the single-valve constraint: you are always neglecting something.

The twist that elevates this beyond simple whack-a-mole is the PUNISHMENT for early release. If you panic and let go of a valve before the pipe is sufficiently drained (below 30%), the pressure SURGES back 30% higher than when you grabbed it. This creates a genuine hold-or-release dilemma every single moment. Hold too long and another pipe bursts. Release too early and THIS pipe surges toward explosion. The game starts with 2 pipes and adds a new one every 10 seconds, scaling to 6 pipes maximum, making the juggling increasingly impossible.

The feel is one of mounting panic -- you are a frantic maintenance worker desperately trying to keep a failing system alive. Every second you survive feels like a miracle.

### 1.2 Target Audience

Casual mobile gamers ages 16-35 who enjoy quick-reflex games during commutes, breaks, or waiting rooms. Players who enjoy the "spinning plates" feeling of games like Fruit Ninja or Piano Tiles. Low skill floor (tap and hold) but high skill ceiling (optimal drain timing, pipe prioritization).

### 1.3 Core Fantasy

You are the last engineer in a failing factory. Pipes are overloading everywhere. You sprint between valves, desperately venting pressure before catastrophic failure. Every second you keep the system alive is a personal victory against chaos.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 45-90 seconds |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 22%+ |
| Average Survival Time | 35-50 seconds |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Pipes Filling] --> [Choose Most Urgent Pipe] --> [Tap & Hold Valve]
      ^                                                |
      |                                          [Drain Pressure]
      |                                                |
      |                              [Release: Drained enough? or Too early?]
      |                                       |                    |
      |                              [Pressure drops]    [SURGE +30%!]
      |                                       |                    |
      +---------------------------------------+--------------------+
      |
[Any pipe hits 100%?] --> YES --> [BURST! Game Over]
                      --> NO  --> [Continue + New pipe every 10s]
```

Moment-to-moment: The player scans 2-6 pipes, each with liquid rising at different speeds. They must decide which pipe is most critical, tap and hold its valve to drain it, then decide when to release. Releasing below 30% fill is safe. Releasing above 30% triggers a 30% surge penalty. The player constantly switches between pipes, creating a frantic juggling rhythm.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Open Valve | Tap & Hold on pipe | Begins draining that pipe's pressure. Liquid visibly drops while holding. |
| Close Valve | Release touch | Stops draining. If pipe > 30% fill, SURGE penalty (+30% of current level). |
| Switch Pipe | Lift + Tap another | Must release current valve before grabbing another. No multi-touch. |

**Control Philosophy**: The single-touch constraint is the entire game. By forcing one-valve-at-a-time, every moment is a triage decision. The hold duration creates genuine tension -- do you fully drain this pipe or rush to save the one about to burst? The surge penalty punishes panic, rewarding calm judgment under pressure.

**Touch Area Map**:
```
+-------------------------------+
| Score        Time    HI:xxxxx |  <-- HUD (non-interactive)
+-------------------------------+
|                               |
|  [PIPE] [PIPE] [PIPE] [PIPE] |  <-- Each pipe is a tap target
|  [    ] [    ] [    ] [    ] |      (full height, ~60px wide)
|  [    ] [    ] [    ] [    ] |
|  [    ] [    ] [    ] [    ] |
|  [VLVE] [VLVE] [VLVE] [VLVE] |  <-- Valve at bottom of each pipe
|                               |
+-------------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Per-second survival | +10/sec | Base score, always ticking |
| Clean drain (release < 30%) | +50 | +25 bonus per consecutive clean drain |
| Emergency save (pipe > 90% drained to < 30%) | +200 | Pipe was visually flashing red |
| New pipe survived | +100 | Awarded when new pipe appears and player is still alive |
| Surge penalty | -25 | Deducted on early release surge |

**Combo System**: Consecutive clean drains (releasing pipes below 30%) build a combo counter. Each combo level adds +25 bonus points. Combo resets on surge penalty or death. Combo counter displayed with escalating text size.

**High Score**: Stored in localStorage as `valve_panic_high_score`. Displayed on menu and game over screen. New high score triggers celebration particles and "NEW BEST!" text.

### 2.4 Progression System

The game progresses by adding pipes over time, creating an ever-escalating challenge:

**Progression Milestones**:

| Time | Pipes | New Element | Difficulty |
|------|-------|------------|------------|
| 0-10s | 2 | Base mechanics, slow fill rates | Easy -- learn hold/release |
| 10-20s | 3 | Third pipe, slightly faster fills | Medium -- first real juggling |
| 20-30s | 4 | Fourth pipe, fill rate variance increases | Hard -- triage decisions matter |
| 30-40s | 5 | Fifth pipe, linked pipes introduced (stage 10+) | Very Hard -- cascading pressure |
| 40s+ | 6 | Maximum pipes, fastest fill rates | Extreme -- survival mode |

**Linked Pipes** (from 30s onward): Two pipes become "linked" (shown by a glowing connector). When a linked pipe surges, its partner gets +15% pressure too. This creates cascading failure chains.

### 2.5 Lives and Failure

The game uses a single-life system. One pipe bursting = instant game over. This creates maximum tension.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Any pipe reaches 100% | Pipe BURSTS, game over | Watch ad to continue (pressure reset to 60% on all pipes) |
| 5 seconds of no input | Fastest pipe auto-bursts | None -- inactivity = death |
| Surge causes pipe > 100% | Immediate burst | None -- surge overflow is fatal |

**Inactivity Death**: If no valve is touched for 5 seconds, the pipe with the highest fill rate immediately bursts. This prevents idle play and enforces constant engagement.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Valve Panic uses a continuous time-based system rather than discrete stages. The "stage" equivalent is the number of active pipes, which increases every 10 seconds.

**Generation Algorithm**:
```
Pipe Parameters (per pipe):
- Fill Rate: base_rate * (1 + time_elapsed * 0.02) * random(0.7, 1.3)
- base_rate: 8% per second at time 0, scaling to 15% at 60s
- Drain Rate: fixed 25% per second while holding valve
- Surge Penalty: current_fill * 0.30 added back on early release
- Color: assigned from PIPE_COLORS array in config
- Link Partner: random pipe after 30s (20% chance per new pipe)
```

### 3.2 Difficulty Curve

```
Difficulty
    |
100 |                                          ------------ (cap at 6 pipes)
    |                                    /
 80 |                              /
    |                        /
 60 |                  /
    |            /
 40 |      /
    |  /
 20 |/
    |
  0 +------------------------------------------ Time (seconds)
    0    10    20    30    40    50    60    70+
```

**Difficulty Parameters by Time**:

| Parameter | 0-10s | 10-20s | 20-30s | 30-40s | 40s+ |
|-----------|-------|--------|--------|--------|------|
| Active Pipes | 2 | 3 | 4 | 5 | 6 |
| Base Fill Rate | 8%/s | 10%/s | 12%/s | 13%/s | 15%/s |
| Fill Rate Variance | +/-10% | +/-15% | +/-20% | +/-25% | +/-30% |
| Drain Rate | 25%/s | 25%/s | 22%/s | 20%/s | 18%/s |
| Linked Pipes | No | No | No | Yes (1 pair) | Yes (2 pairs) |
| New Mechanic | Base | 3rd pipe | Rate variance | Linked pipes | Max chaos |

### 3.3 Stage Generation Rules

1. **Survivability Guarantee**: When a new pipe spawns, all existing pipes are temporarily slowed by 20% for 2 seconds, giving the player time to assess.
2. **Fill Rate Variance**: No two adjacent pipes should have fill rates within 5% of each other -- visual differentiation matters.
3. **Difficulty Monotonicity**: Fill rates only increase over time, never decrease. Base rate formula: `8 + (elapsed_seconds * 0.12)` capped at 15.
4. **Breathing Moments**: After each new pipe spawn, there is a 2-second "grace period" where the new pipe fills at 50% speed.
5. **Linked Pipe Rules**: Linked pipes are always non-adjacent visually to force eye movement. Links shown by a glowing line between pipe bases.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Industrial-meets-cartoon. Chunky pipes with rivets, round valve wheels, bubbly liquid animations. Bright, saturated colors against a dark metallic background. Think "cute factory disaster."

**Aesthetic Keywords**: Industrial, Bubbly, Frantic, Colorful, Chunky

**Reference Palette**: Bright hazard colors (warning yellows, alarm reds) against gunmetal grays. Liquid colors are vivid and distinct per pipe.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Dark Steel | #2D3436 | Main game background |
| Pipe Body | Gunmetal | #636E72 | Pipe structure |
| Liquid 1 | Hot Red | #FF6B6B | First pipe liquid |
| Liquid 2 | Electric Blue | #4ECDC4 | Second pipe liquid |
| Liquid 3 | Toxic Green | #A8E6CF | Third pipe liquid |
| Liquid 4 | Warning Orange | #FFB347 | Fourth pipe liquid |
| Liquid 5 | Neon Purple | #DDA0DD | Fifth pipe liquid |
| Liquid 6 | Acid Yellow | #FDFD96 | Sixth pipe liquid |
| Danger | Alarm Red | #FF4444 | Pipe at >80% fill, flashing |
| Valve Active | Bright White | #FFFFFF | Valve being held |
| Valve Idle | Dim Gray | #95A5A6 | Valve not active |
| UI Text | Clean White | #FFFFFF | Score, labels |
| Surge Flash | Hot Pink | #FF69B4 | Surge penalty visual |
| HUD BG | Dark Overlay | #000000AA | Semi-transparent HUD bar |

### 4.3 SVG Specifications

**Pipe with Valve**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 200">
  <!-- Pipe body -->
  <rect x="10" y="0" width="40" height="180" rx="4" fill="#636E72" stroke="#2D3436" stroke-width="2"/>
  <!-- Pipe interior (liquid fills from bottom) -->
  <rect x="14" y="20" width="32" height="156" fill="#2D3436"/>
  <!-- Rivets -->
  <circle cx="14" cy="20" r="3" fill="#95A5A6"/>
  <circle cx="46" cy="20" r="3" fill="#95A5A6"/>
  <circle cx="14" cy="170" r="3" fill="#95A5A6"/>
  <circle cx="46" cy="170" r="3" fill="#95A5A6"/>
  <!-- Valve wheel at bottom -->
  <circle cx="30" cy="190" r="10" fill="#95A5A6" stroke="#636E72" stroke-width="2"/>
  <line x1="22" y1="190" x2="38" y2="190" stroke="#636E72" stroke-width="2"/>
  <line x1="30" y1="182" x2="30" y2="198" stroke="#636E72" stroke-width="2"/>
</svg>
```

**Liquid Fill** (dynamic rectangle inside pipe):
```svg
<!-- Rendered dynamically: height = fill_percentage * max_height -->
<!-- Positioned from bottom of pipe interior -->
<rect x="14" y="{top}" width="32" height="{fill_height}" fill="{pipe_color}" opacity="0.9"/>
<!-- Bubble particles inside liquid (2-3 small circles, animated upward) -->
<circle cx="{rand}" cy="{rand}" r="2" fill="#FFFFFF" opacity="0.4"/>
```

**Burst Effect** (pipe explosion):
```svg
<!-- 8 fragments radiating outward from pipe center -->
<polygon points="0,-8 4,0 0,8 -4,0" fill="{pipe_color}" transform="rotate({angle})"/>
<!-- Repeated 8x with 45-degree rotation increments -->
```

**Link Connector** (between linked pipes):
```svg
<line x1="{pipe_a_x}" y1="180" x2="{pipe_b_x}" y2="180" stroke="#FFD700" stroke-width="3" stroke-dasharray="6,3" opacity="0.7"/>
```

**Design Constraints**:
- All SVG elements use basic shapes only (rect, circle, line, polygon)
- Maximum 12 path elements per pipe SVG
- Liquid fill animated via Phaser tween on rect height/y
- Bubble particles are simple circles with upward tween + fade

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Liquid bubbling | While pipe filling | 2-3 small white circles rising inside liquid rect, looping tween |
| Valve spin | While holding valve | Valve circle rotates continuously (360deg/s) |
| Danger flash | Pipe > 80% fill | Pipe border flashes red, 200ms on/200ms off |
| Surge pulse | Early release surge | Liquid rect flashes hot pink, scale punch 1.1x on pipe, 150ms |
| Burst explosion | Pipe hits 100% | 8 colored fragments fly outward, screen shake 10px 400ms, background flash red |
| Clean drain sparkle | Release below 30% | 10 white particles burst from valve, +50 floating text |
| Emergency save glow | Drain from >90% to <30% | Golden glow around pipe for 500ms, +200 floating text |
| New pipe slide-in | New pipe spawns | Pipe slides up from bottom, 300ms ease-out |
| Combo text scale | Combo increases | Text size: 24px + (combo * 4px), max 48px |

---

## 5. Audio Design

### 5.1 Sound Effects

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Valve open (touch) | Metallic clank + hiss start | 200ms | High |
| Draining (hold) | Continuous steam hiss, pitch rises as pipe empties | Looping | Medium |
| Valve close (release) | Short metal clunk | 100ms | High |
| Surge penalty | Wet gurgling + warning buzz | 400ms | High |
| Clean drain | Satisfying pressure release "psshh" + chime | 300ms | High |
| Emergency save | Dramatic whoosh + triumphant ding | 500ms | High |
| Danger warning | Rhythmic alarm beep (pipe > 80%) | Looping 200ms | Medium |
| Pipe burst | Explosive pop + glass shatter + liquid splash | 800ms | Critical |
| New pipe appear | Industrial clang + hydraulic hiss | 400ms | Medium |
| Combo milestone | Ascending pitch chime per combo level | 200ms | Medium |
| Game over | Low rumble + descending tone | 1000ms | Critical |
| Score tick | Soft click per 100 points | 50ms | Low |

### 5.2 Music Concept

**Background Music**: No traditional music. Instead, an ambient industrial soundscape that intensifies with pipe count. The pipes themselves create a rhythmic "music" through their filling sounds, alarm beeps, and drain hisses. This procedural audio becomes more complex and frantic as pipes are added, creating emergent tension without a composed track.

**Audio State Machine**:
| Game State | Audio Behavior |
|-----------|---------------|
| Menu | Low ambient hum, occasional distant pipe clank |
| 2 pipes | Calm industrial ambience, slow rhythm |
| 3-4 pipes | Added metallic percussion, heartbeat-like pulse |
| 5-6 pipes | Full alarm soundscape, overlapping hisses, frantic |
| Game Over | All sound cuts except burst SFX, then silence, then somber tone |
| Pause | Audio volume to 20%, ambient only |

**Audio Implementation**: Howler.js via CDN (`https://cdn.jsdelivr.net/npm/howler@2/dist/howler.min.js`)

---

## 6. UI/UX

### 6.1 Screen Flow

```
+----------+     +----------+     +----------+
|  Title   |---->|   Menu   |---->|   Game   |
|  Screen  |     |  Screen  |     |  Screen  |
+----------+     +-----+----+     +-----+----+
                    |   |               |
               +----+   |          +----+----+
               |        |          |  Pause  |
          +----+----+   |          | Overlay |
          |  Help   |   |          +----+----+
          |How2Play |   |               |
          +---------+   |          +----+----+
                   +----+----+     | Game    |
                   |Settings |     | Over    |
                   | Overlay |     | Screen  |
                   +---------+     +----+----+
                                        |
                                   +----+----+
                                   | Ad /    |
                                   |Continue |
                                   | Prompt  |
                                   +---------+
```

### 6.2 HUD Layout

```
+-------------------------------+
| Score: 1250   TIME: 32s  BEST |  <-- Top bar (always visible)
+-------------------------------+
|  x3 COMBO!                    |  <-- Combo (appears/fades)
|                               |
| [PIPE] [PIPE] [PIPE] [PIPE]  |  <-- Pipes (main game area)
| [||||] [||  ] [||| ] [|    ] |      Liquid fills shown
| [||||] [||  ] [||| ] [|    ] |
| [||||] [||  ] [||| ] [|    ] |
| [VLVE] [VLVE] [VLVE] [VLVE]  |  <-- Valves (touch targets)
|                               |
+-------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left | Current score, punch animation on change | Every score event |
| Timer | Top-center | Survival time in seconds | Every second |
| Best | Top-right | High score indicator | On load |
| Combo | Below HUD bar, center | "x3 COMBO!" text, scales with combo | On combo change |
| Pipe Pressure % | Above each pipe | Small percentage text | Every frame |
| Drain indicator | On held valve | Spinning valve + drain particles | While holding |

### 6.3 Menu Structure

**Main Menu**:
- Game title "VALVE PANIC" in bold industrial font (SVG text)
- Animated pipes in background (2 pipes slowly filling and auto-draining for visual appeal)
- PLAY button (large, red, pulsing glow -- 120x50px minimum)
- How to Play "?" button (top-left, 44x44px)
- Settings gear icon (top-right, 44x44px)
- High Score display (below title)
- Sound toggle (speaker icon, bottom-right)

**Pause Menu** (overlay, semi-transparent #000000CC background):
- RESUME (large button)
- How to Play "?"
- RESTART
- QUIT TO MENU

**Game Over Screen**:
- "BURST!" title with explosion animation
- Survival Time (large, animated count-up)
- Final Score (with combo breakdown)
- High Score indicator ("NEW BEST!" if beaten, with celebration particles)
- Pipes Managed (max pipes reached)
- "Watch Ad to Continue" button (resets all pipes to 60%, once per game)
- "Play Again" button (prominent)
- "Menu" button (smaller)

**Help / How to Play Screen** (overlay):
- Title: "HOW TO PLAY"
- Visual 1: SVG pipe with arrow showing "TAP & HOLD to drain" with animated liquid dropping
- Visual 2: SVG pipe with red flash showing "Release too early = SURGE!" with +30% indicator
- Visual 3: SVG pipe at 100% with explosion showing "Pipe bursts = GAME OVER"
- Rule: "Only ONE valve at a time!"
- Rule: "New pipe every 10 seconds"
- Tips: "Drain below 30% for clean drain bonus", "Watch the fastest-filling pipe"
- "GOT IT!" button at bottom

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
| Rewarded | Continue after burst | Every game over | Always (optional) |
| Rewarded | Double final score | End of session | Always (optional) |
| Banner | Menu screen only | Always visible on menu | N/A |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Continue | Watch ad after burst | All pipes reset to 60%, resume play | Once per game |
| Score Doubler | Watch ad at game over | 2x final score | Once per session |

### 7.3 Session Economy

The game's short session length (30-90s) means frequent game overs and frequent ad opportunities. The continue mechanic is powerful (full pressure reset) but limited to once per game, creating genuine value for the rewarded ad.

**Session Flow with Monetization**:
```
[Play Free] --> [Pipe Bursts] --> [Rewarded Ad: Continue? Reset all to 60%]
                                       | Yes --> [Resume + Interstitial after next death]
                                       | No  --> [Game Over Screen]
                                                      |
                                                [Interstitial (every 3rd game over)]
                                                      |
                                                [Rewarded Ad: Double Score?]
                                                      | Yes --> [Score doubled, shown]
                                                      | No  --> [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/valve-panic/
+-- index.html              # Entry point
|   +-- CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
|   +-- CDN: Howler.js      # https://cdn.jsdelivr.net/npm/howler@2/dist/howler.min.js
|   +-- Local CSS           # css/style.css
|   +-- Local JS (ordered)  # config -> stages -> ads -> effects -> ui -> game -> main
+-- css/
|   +-- style.css           # Responsive styles, mobile-first
+-- js/
    +-- config.js           # Constants, colors, difficulty tables, SVG strings
    +-- stages.js           # Pipe generation, difficulty scaling, linked pipe logic
    +-- ads.js              # Ad hooks, reward callbacks, frequency tracking
    +-- effects.js          # Particle systems, screen shake, juice effects
    +-- ui.js               # MenuScene, GameOverScene, HUD, Help, Pause, Settings
    +-- game.js             # GameScene: pipe management, valve input, scoring, death
    +-- main.js             # BootScene, Phaser init, scene registration (LOADED LAST)
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- PIPE_COLORS array (6 hex colors for each pipe)
- DIFFICULTY_TABLE: base_fill_rate, drain_rate, surge_multiplier, link_chance by elapsed time
- SCORING: points per event, combo bonus formula
- SVG_STRINGS: pipe body, valve, burst fragments, link connector
- TIMING: new_pipe_interval (10s), inactivity_timeout (5s), grace_period (2s)
- UI: colors, font sizes, animation durations

**main.js** (max 300 lines):
- BootScene: register all SVG textures via `textures.addBase64()` once
- Phaser.Game config: 360x640, CANVAS renderer, scale mode FIT
- Scene array: [BootScene, MenuScene, GameScene, UIScene, GameOverScene]
- Responsive resize handler for orientation changes
- localStorage read/write for high scores and settings

**game.js** (max 300 lines):
- GameScene.create(): initialize pipes array, start with 2 pipes, set up timers
- GameScene.update(): update fill levels per frame, check burst conditions, update visuals
- Pipe management: add/remove pipes, update fill rates, handle linked pipes
- Valve input: pointerdown on pipe -> start draining, pointerup -> stop + check surge
- Single-valve enforcement: only one active drain at a time
- Death detection: any pipe >= 100% -> burst sequence -> game over
- Inactivity timer: 5s no input -> auto-burst fastest pipe
- Score tracking: survival time score, event bonuses, combo counter

**stages.js** (max 300 lines):
- `generatePipeParams(elapsed_time, pipe_index)`: returns fill_rate, color, position
- `getDifficultyMultiplier(elapsed_time)`: returns difficulty scaling factor
- `shouldAddPipe(elapsed_time, current_count)`: returns boolean (every 10s, max 6)
- `createLinkedPair(pipes)`: randomly links two non-adjacent pipes after 30s
- Fill rate formula: `base * (1 + elapsed * 0.02) * random(0.7, 1.3)`
- Drain rate formula: `25 - (elapsed * 0.12)` capped at minimum 18%/s
- Grace period logic: new pipes fill at 50% rate for first 2 seconds

**ui.js** (max 300 lines):
- MenuScene: title, animated background pipes, play button, help/settings buttons
- GameOverScene: burst animation, score display, high score check, continue/retry/menu buttons
- HUD overlay (UIScene running parallel to GameScene): score, timer, combo, pipe pressure labels
- PauseOverlay: resume, restart, quit buttons
- HelpOverlay: illustrated SVG instructions with pipe diagrams
- SettingsOverlay: sound/music/vibration toggles

**ads.js** (max 300 lines):
- Ad SDK initialization placeholder
- Interstitial tracking: show every 3rd game over
- Rewarded continue: reset all pipes to 60%, resume GameScene
- Rewarded score doubler: multiply final score by 2
- Ad callbacks: onLoaded, onClosed, onRewarded, onFailed
- Banner show/hide on menu

**effects.js** (max 300 lines):
- `burstEffect(pipe)`: fragment particles + screen shake + red flash
- `surgeEffect(pipe)`: pink flash + pipe scale punch
- `cleanDrainEffect(pipe)`: white sparkle particles + floating "+50"
- `emergencySaveEffect(pipe)`: golden glow + floating "+200"
- `comboTextEffect(combo_count)`: escalating text size and color
- `screenShake(intensity, duration)`: camera shake utility
- `floatingScore(x, y, text, color)`: rising + fading score text

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |
| Howler.js | 2.x | `https://cdn.jsdelivr.net/npm/howler@2/dist/howler.min.js` | Audio playback |

---

## 9. Juice Specification

### 9.1 Player Input Feedback (every valve tap)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Valve | Count: 8, Direction: radial from valve center, Color: #FFFFFF, Lifespan: 300ms |
| Screen shake | Camera | Intensity: 2px, Duration: 80ms |
| Scale punch | Valve circle | Scale: 1.4x, Recovery: 100ms |
| Sound | -- | Effect: metallic clank + hiss start, Pitch: base |
| Haptic | Device | Short vibration: 30ms |

### 9.2 Core Action Additional Feedback (drain hold)

| Effect | Values |
|--------|--------|
| Particles | Steam particles from valve: Count 3/frame, white, rising, fade over 400ms |
| Valve rotation | Continuous 360deg/s spin while holding |
| Liquid animation | Smooth tween down, small bubbles rise inside liquid (2-3 circles) |
| Drain sound | Continuous hiss loop, pitch rises from 0.8x to 1.2x as pipe empties |
| Camera zoom | None during drain (would obscure other pipes) |
| Combo escalation | Clean drain combo: particle count +5 per combo level, text size +4px per combo |

### 9.3 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 12px, Duration: 400ms |
| Screen effect | Red flash overlay (#FF0000, opacity 0.4, fade 300ms) + brief desaturation |
| Burst particles | 12 colored fragments from burst pipe, velocity 200-400px/s, gravity, fade 800ms |
| Liquid splash | 8 droplets in pipe color, arc downward, fade 600ms |
| Sound | Explosive pop (200ms) + glass shatter (300ms) + low rumble (500ms) |
| Effect to UI delay | 700ms (let burst animation play before showing game over) |
| Death to restart | **1.5 seconds** (tap Play Again -> immediate new game) |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+50" / "+200", Color: #FFD700 (gold), Movement: up 60px, Fade: 600ms |
| Score HUD punch | Scale 1.3x, Recovery: 150ms, Color flash to gold then back to white |
| Combo text | "x{N} COMBO!" Size: 24px + (combo * 4px), max 48px, Color cycles through pipe colors |
| Surge penalty text | "-25", Color: #FF69B4 (hot pink), Movement: down 30px, Fade: 400ms |
| Emergency save | "+200 SAVE!", Color: #FFD700, Size: 36px, Golden ring effect around pipe for 500ms |

### 9.5 Surge Penalty Feedback

| Effect | Values |
|--------|--------|
| Pipe flash | Hot pink (#FF69B4) flash, 3 pulses over 300ms |
| Scale punch | Pipe body: 1.08x horizontal stretch, 120ms recovery |
| Liquid jump | Liquid rect instantly jumps up by 30% with overshoot tween (bounce easing) |
| Sound | Wet gurgling (200ms) + warning buzz (200ms) |
| Combo reset | Combo counter text shrinks to 0 and fades, 200ms |
| Screen shake | Intensity: 4px, Duration: 150ms |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable with 6 pipes | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | Performance.timing API |
| Memory Usage | <80MB | Chrome DevTools Memory panel |
| JS Bundle Size | <400KB total (excl. CDN) | File size check |
| First Interaction | <1 second after load | Time to first meaningful paint |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Use Phaser's input system with `pointer` events
- **Prevent Default**: Prevent pull-to-refresh, pinch-to-zoom, double-tap-to-zoom
- **Orientation**: Portrait lock via CSS and meta tags
- **Safe Areas**: Account for notch/cutout with CSS env(safe-area-inset-*)
- **Throttling**: Detect background state via visibilitychange, pause game
- **Pipe Layout**: Pipes dynamically sized and spaced based on screen width (min 44px per pipe touch target)
- **Max 6 Pipes**: At 360px width, 6 pipes at 50px each + 10px gaps = 360px, fits perfectly

### 10.3 Touch Controls

- **Touch Target Size**: Each pipe valve is minimum 50x50px
- **Single Touch Only**: Enforce single pointer -- ignore multi-touch to prevent cheating
- **Hold Detection**: pointerdown starts drain, pointerup stops drain, pointermove tracked to detect finger drift off valve (cancel drain if finger leaves pipe bounds)
- **Input Buffering**: None needed -- continuous hold mechanic
- **Visual Feedback**: Immediate valve spin on touch, no input latency

### 10.4 Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome (Android) | 80+ | Primary target |
| Safari (iOS) | 14+ | Test audio autoplay restrictions |
| Samsung Internet | 14+ | Popular on Samsung devices |
| Firefox (Android) | 90+ | Secondary target |

### 10.5 Local Storage Schema

```json
{
  "valve_panic_high_score": 0,
  "valve_panic_best_time": 0,
  "valve_panic_games_played": 0,
  "valve_panic_max_pipes": 0,
  "valve_panic_settings": {
    "sound": true,
    "music": true,
    "vibration": true
  },
  "valve_panic_total_score": 0,
  "valve_panic_best_combo": 0
}
```

### 10.6 Key Implementation Details

- **Pipe fill update**: Run in `update()` loop, `fill += rate * delta / 1000` per pipe per frame
- **Single valve enforcement**: Global `activePipe` index, set on pointerdown, cleared on pointerup
- **Surge calculation**: On pointerup, if `pipes[activePipe].fill > 0.30`, then `pipes[activePipe].fill *= 1.30` (capped at 1.0 which triggers burst)
- **Linked pipe propagation**: On surge, linked partner gets `fill += surge_amount * 0.5`
- **Inactivity timer**: Reset on any pointerdown. If timer reaches 5000ms, trigger burst on highest-fill pipe
- **New pipe timer**: `this.time.addEvent({ delay: 10000, callback: addPipe, loop: true })`
- **Burst check**: Every frame, if any `pipe.fill >= 1.0`, trigger burst sequence and transition to GameOver after 700ms delay
