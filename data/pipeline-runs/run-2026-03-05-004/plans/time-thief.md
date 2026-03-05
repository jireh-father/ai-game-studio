# Game Design Document: Time Thief

**Slug**: `time-thief`
**One-Liner**: STEAL seconds from obstacles to add to your countdown timer -- every enemy is also your lifeline
**Core Mechanic**: 10-second countdown = your life. Timer always drains. Obstacles approach with visible time values. Swipe THROUGH obstacle at right moment to steal time. Miss timing = damage + lose 2s. Unstolen obstacles stack on right side, compressing play area. Time bombs SUBTRACT seconds. Boss obstacles need 3 perfect swipes.
**Target Session Length**: 30-90 seconds
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Time Thief is a relentless survival game where your countdown timer is both your life and your score. You start with 10 seconds on the clock that constantly drains at 1s/second. Obstacles scroll from right to left, each carrying a visible time value (+2s, +3s, +5s). Swipe through an obstacle at the right moment to steal its time and add it to your clock. Miss the timing window and you take damage, losing 2 seconds instead.

The twist: obstacles you fail to steal don't just disappear. They stack on the right edge of the screen, compressing your play area. As the play area shrinks, you have less reaction time and obstacles arrive faster relative to your shrinking space. Red-glowing time bombs appear that SUBTRACT seconds if you accidentally swipe them -- you must dodge these by tapping to quick-dodge vertically. Boss obstacles (every 10 stages) require 3 consecutive perfect swipes to crack open and yield massive +8s rewards.

The result is a game where every obstacle is simultaneously a threat and a lifeline. You can never play it safe -- you MUST steal to survive, but stealing carelessly kills you faster.

### 1.2 Target Audience

Casual mobile gamers aged 16-35 who play during commutes, waiting rooms, or short breaks. Players who enjoy reflex-based games with simple controls but deep risk/reward decisions. Fans of games like Fruit Ninja, Jetpack Joyride, and other one-thumb survival games.

### 1.3 Core Fantasy

You are a time thief -- a rogue who survives by stealing seconds from the very things trying to kill you. Every swipe is a heist. Every stolen second is a victory against the clock. The fantasy is living on borrowed time and loving it.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 30-90 seconds |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 22%+ |
| Average Stages per Session | 3-8 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Timer Starts: 10s] --> [Obstacles Approach] --> [Swipe to Steal / Tap to Dodge]
       ^                                                    |
       |                                         [Time Added or Lost]
       |                                                    |
       |                                         [Unstolen Stack / Area Compress]
       |                                                    |
       +------------- [Stage Clear / Timer Hits 0 = Death] -+
```

Moment-to-moment: the player watches obstacles scroll left, reads their time values, decides whether to swipe-steal or tap-dodge (for bombs), and manages their shrinking play area. The timer is always visible and always draining, creating constant urgency. Every 10 successful steals = stage clear with a brief 1s celebration.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Steal Time | Horizontal Swipe (left) | Swipe through an obstacle to steal its time value. Must be timed within the steal window (obstacle in center 40% of play area) |
| Quick Dodge | Tap (anywhere) | Player character hops vertically to dodge time bombs. 200ms hop duration, cannot steal during dodge |
| Boss Crack | Triple Swipe | Swipe through boss obstacle 3 times in rapid succession (within 1.5s window) |

**Control Philosophy**: One-thumb gameplay. Horizontal swipe is the primary action (stealing), vertical tap is the safety valve (dodging). The tension between "I need to swipe to survive" and "I need to dodge this bomb" creates split-second decisions.

**Touch Area Map**:
```
+-----------------------------+
| [Timer: 07.3s]  [Stage: 3] |  <- HUD (non-interactive)
+-----------------------------+
|                             |
|   [Play Area - Full Width]  |  <- Swipe left anywhere = steal
|   [Player]  <-- [Obstacles] |  <- Tap anywhere = dodge hop
|                             |
|              [Stacked Wall] |  <- Compressed zone (right side)
+-----------------------------+
|      [Score: 1250]          |  <- Bottom HUD
+-----------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Time Steal (normal) | 100 x time_value | Consecutive steals without miss: 2x at 3 chain, 3x at 6 chain, 5x at 10 chain |
| Time Steal (perfect -- center 15%) | 200 x time_value | Same chain multiplier + 1.5x perfect bonus |
| Bomb Dodge | 50 | No multiplier |
| Boss Crack | 500 | Fixed bonus, no chain requirement |
| Stage Clear | 300 x stage_number | No multiplier |

**Combo System**: Consecutive successful steals build a chain counter. Chain resets on miss or bomb hit. Chain thresholds: 3 (2x), 6 (3x), 10 (5x). Visual: chain counter pulses larger with each tier, text color shifts from white to yellow to orange to red.

**High Score**: Stored in localStorage as `time_thief_high_score`. Displayed on menu and game over screen. New high score triggers confetti particles + "NEW BEST!" text bounce.

### 2.4 Progression System

The game uses a stage-based infinite progression. Each stage = 10 successful steals. Stage number determines difficulty parameters.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-3 | Basic obstacles (+2s, +3s) only, generous steal window | Easy -- learn swiping |
| 4-6 | Time bombs introduced (red glow), smaller steal window | Medium -- learn dodging |
| 7-10 | Mixed time values (+1s to +5s), faster scroll speed | Hard -- prioritize targets |
| 11-15 | Boss obstacles every 10 steals, area compression accelerates | Very Hard -- precision + management |
| 16+ | All mechanics active, speed cap, random bomb clusters | Extreme -- pure survival |

### 2.5 Lives and Failure

There are NO lives. The timer IS your life. Death conditions:

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Timer reaches 0.0s | Instant death, game over screen | Watch rewarded ad to revive with +5s (once per run) |
| Play area compressed to <15% width | Crush death, game over screen | Watch rewarded ad to clear wall + revive with +5s (once per run) |
| Inactivity for 5s (no swipe or tap) | Timer drain doubles (2s/s) until input. Dies at 0. | None -- forced engagement |

**Inactivity Death**: If the player does nothing for 5 consecutive seconds, timer drain rate doubles to 2s/second. Since starting timer is 10s, idle player dies within 10s guaranteed. Active player who stops mid-game dies even faster.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Stages are generated procedurally based on stage number. Each stage = 10 steals to clear. Obstacles are spawned from the right edge at intervals determined by difficulty.

**Generation Algorithm**:
```
Stage Generation Parameters:
- stage_number: current stage (1+)
- base_spawn_interval: 1200ms (stage 1) -> decreases by 40ms per stage, min 500ms
- obstacle_speed: 120px/s (stage 1) -> increases by 8px/s per stage, max 280px/s
- steal_window: 300ms (stage 1) -> decreases by 10ms per stage, min 150ms
- bomb_chance: 0% (stage 1-3) -> 15% (stage 4-6) -> 25% (stage 7-10) -> 35% (stage 11+), max 40%
- time_values: [2,3] (stage 1-3) -> [1,2,3] (stage 4-6) -> [1,2,3,5] (stage 7+)
- boss_at: every 10th steal within a stage (steal #10 is boss if stage >= 11)
- wall_growth: 3px per unstolen obstacle (compresses play area from right)
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
    0    3    6    9    12    15    18    21+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-3 | Stage 4-6 | Stage 7-10 | Stage 11-15 | Stage 16+ |
|-----------|-----------|------------|-------------|-------------|-----------|
| Obstacle Speed | 120px/s | 152px/s | 184px/s | 216px/s | 280px/s (cap) |
| Spawn Interval | 1200ms | 1080ms | 920ms | 760ms | 500ms (cap) |
| Steal Window | 300ms | 270ms | 240ms | 200ms | 150ms (cap) |
| Bomb Chance | 0% | 15% | 25% | 35% | 40% (cap) |
| Time Values | +2, +3 | +1, +2, +3 | +1, +2, +3, +5 | +1, +2, +3, +5 | +1, +2, +3, +5 |
| Wall Growth/miss | 3px | 4px | 5px | 6px | 8px |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: At least 60% of spawned obstacles in any stage must be stealable (non-bomb). No two bombs spawn consecutively in stages 4-6.
2. **Variety Threshold**: Consecutive obstacles must differ in time value or type (bomb vs normal). No 3 identical obstacles in a row.
3. **Difficulty Monotonicity**: Speed and bomb chance never decrease between stages. Spawn interval never increases.
4. **Rest Beats**: After every boss obstacle, next 3 obstacles are guaranteed non-bomb with +3s or higher values.
5. **Boss Stages**: Boss obstacles appear as steal #10 in stages 11+. Boss yields +8s on successful triple-swipe. Boss has 3 health pips shown visually.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Dark, neon-cyberpunk minimal. Black background with glowing neon elements. Timer rendered as a prominent glowing bar. Obstacles are geometric shapes with pulsing time values. The aesthetic evokes "hacking time" -- digital, urgent, stylish.

**Aesthetic Keywords**: Neon, Dark, Urgent, Digital, Sleek

**Reference Palette**: Think TRON meets a heist movie countdown sequence. Dark backgrounds make neon elements pop and keep visual focus on gameplay.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary (Player) | Cyan | #00F5FF | Player character, timer bar when healthy (>5s) |
| Warning | Amber | #FFB300 | Timer bar when low (2-5s), steal window indicator |
| Critical | Red | #FF1744 | Timer bar when critical (<2s), time bombs, damage flash |
| Time Steal | Green | #00E676 | Successful steal particles, +time floating text |
| Time Value | White | #FFFFFF | Time value labels on obstacles |
| Background | Near Black | #0A0A1A | Game background |
| Wall/Stack | Dark Purple | #2D1B69 | Compressed wall zone |
| Boss | Gold | #FFD700 | Boss obstacle glow, boss crack effect |
| UI Text | Light Gray | #E0E0E0 | Score, stage labels |

### 4.3 SVG Specifications

**Player Character** (Time Thief -- hooded figure silhouette):
```svg
<svg viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
  <!-- Hood -->
  <path d="M10,20 Q20,2 30,20 L28,25 L12,25 Z" fill="#00F5FF" opacity="0.9"/>
  <!-- Body -->
  <rect x="14" y="25" width="12" height="18" rx="3" fill="#00F5FF" opacity="0.7"/>
  <!-- Eyes (glowing) -->
  <circle cx="17" cy="18" r="2" fill="#FFFFFF"/>
  <circle cx="23" cy="18" r="2" fill="#FFFFFF"/>
  <!-- Swipe trail hand -->
  <rect x="26" y="28" width="10" height="3" rx="1" fill="#00F5FF" opacity="0.5"/>
</svg>
```

**Normal Obstacle** (time crystal with value):
```svg
<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
  <!-- Crystal body -->
  <polygon points="25,5 45,25 25,45 5,25" fill="none" stroke="#00E676" stroke-width="2"/>
  <polygon points="25,10 40,25 25,40 10,25" fill="#00E676" opacity="0.2"/>
  <!-- Inner glow -->
  <circle cx="25" cy="25" r="8" fill="#00E676" opacity="0.3"/>
</svg>
```

**Time Bomb** (red pulsing hexagon):
```svg
<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
  <!-- Hex body -->
  <polygon points="25,5 43,15 43,35 25,45 7,35 7,15" fill="#FF1744" opacity="0.3" stroke="#FF1744" stroke-width="2"/>
  <!-- Danger icon -->
  <text x="25" y="30" text-anchor="middle" fill="#FF1744" font-size="18" font-weight="bold">-</text>
</svg>
```

**Boss Obstacle** (large golden diamond):
```svg
<svg viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg">
  <!-- Outer diamond -->
  <polygon points="35,5 65,35 35,65 5,35" fill="none" stroke="#FFD700" stroke-width="3"/>
  <!-- Inner layers (3 health pips) -->
  <polygon points="35,15 55,35 35,55 15,35" fill="#FFD700" opacity="0.15"/>
  <polygon points="35,22 48,35 35,48 22,35" fill="#FFD700" opacity="0.15"/>
  <polygon points="35,28 42,35 35,42 28,35" fill="#FFD700" opacity="0.3"/>
</svg>
```

**Design Constraints**:
- All SVG elements use max 8 path/shape elements
- Basic shapes only (polygon, circle, rect, text)
- No gradients or filters for mobile performance
- Animations via Phaser tweens, not SVG animate

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Steal flash | Successful time steal | Green (#00E676) radial particle burst from obstacle position, 15 particles, 400ms lifespan |
| Timer pulse | Time added | Timer bar scales 1.1x for 150ms, green glow flash |
| Damage flash | Missed steal / bomb hit | Screen red overlay (#FF1744, 30% opacity), 200ms fade out |
| Screen shake | Miss timing | Camera offset random 4px, 150ms duration |
| Death shake | Timer hits 0 | Camera offset random 12px, 400ms duration |
| Wall grow | Obstacle stacks | Purple block slides in from right, 200ms ease-out |
| Boss crack | Each boss hit | Gold particle burst, boss shrinks 15%, crack line appears |
| Neon trail | Player dodge hop | 3 fading copies of player at 60%, 40%, 20% opacity, 300ms |
| Combo glow | Chain 3+ | Player outline glow intensifies: yellow (3), orange (6), red (10) |

---

## 5. Audio Design

### 5.1 Sound Effects

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Time Steal | Bright digital "ching" + ascending tone | 150ms | High |
| Perfect Steal | Same as steal + harmonic overtone | 200ms | High |
| Bomb Dodge | Quick whoosh/air sound | 100ms | Medium |
| Miss/Damage | Low digital buzz + impact thud | 200ms | High |
| Boss Hit | Heavy metallic clang + crack | 250ms | High |
| Boss Defeat | Ascending chime cascade | 500ms | High |
| Stage Clear | Quick celebratory sting (3 ascending notes) | 400ms | High |
| Timer Critical (<2s) | Rapid ticking pulse, accelerating | Loop | High |
| Game Over | Descending digital tone + flatline | 800ms | High |
| Wall Compress | Low rumble/grinding | 150ms | Low |
| Chain Milestone | Pitch rises with chain tier (+10% per tier) | 100ms | Medium |

### 5.2 Music Concept

**Background Music**: No traditional music. Instead, a procedural ambient pulse that syncs with the timer. Low bass drone that increases in tempo as timer decreases. Creates a heartbeat-like rhythm that naturally produces urgency.

**Music State Machine**:
| Game State | Music Behavior |
|-----------|---------------|
| Menu | Ambient electronic hum, slow pulse |
| Timer > 5s | Low bass pulse at 60 BPM |
| Timer 2-5s | Bass pulse increases to 120 BPM, higher pitch |
| Timer < 2s | Rapid pulse 180 BPM + alarm tone overlay |
| Stage Clear | Brief silence (0.5s) then reset to calm pulse |
| Game Over | All audio fades, flatline tone |

**Audio Implementation**: Howler.js via CDN

---

## 6. UI/UX

### 6.1 Screen Flow

```
+-----------+     +----------+     +----------+
|  Boot     |---->|  Menu    |---->|  Game    |
|  Scene    |     |  Screen  |     |  Screen  |
+-----------+     +----+-----+     +----+-----+
                    |   |               |
               +----+   |          +----+----+
               |        |          |  Pause  |
          +----+----+   |          | Overlay |
          |  Help   |   |          +----+----+
          |How 2Play|   |               |
          +---------+   |          +----+----+
                   +----+----+     | Game    |
                   |Settings |     | Over    |
                   | Overlay |     | Screen  |
                   +---------+     +----+----+
                                        |
                                   +----+----+
                                   | Rewarded|
                                   | Ad Offer|
                                   +---------+
```

### 6.2 HUD Layout

```
+-----------------------------------+
| [07.3s ========---]  Stage 3  x5  |  <- Timer bar (color-coded) + stage + chain
+-----------------------------------+
|                                   |
|  [@]          [+3] -->            |  <- Player left, obstacles scroll left
|            [+2] -->               |
|        [-2!] -->                  |  <- Bomb (red, pulsing)
|                            [####]|  <- Stacked wall (purple, right side)
|                            [####]|
+-----------------------------------+
|        Score: 1,250               |  <- Bottom score display
+-----------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Timer Bar | Top-left, 60% width | Colored bar (cyan >5s, amber 2-5s, red <2s) + numeric display | Every frame (60fps) |
| Stage Number | Top-center-right | "Stage N" text | On stage clear |
| Chain Counter | Top-right | "xN" with color tier | On every steal/miss |
| Score | Bottom-center | Numeric score with comma formatting | On score event |
| Floating +Time | At obstacle position | "+Ns" green text, floats up and fades | On successful steal |
| Floating -Time | At player position | "-2s" red text, shakes and fades | On miss/bomb hit |

### 6.3 Menu Structure

**Main Menu**:
- Game title "TIME THIEF" in cyan neon text with subtle glow animation
- Play button (large, cyan border, pulsing glow)
- How to Play / "?" (top-left corner)
- High Score display (below title)
- Sound toggle (speaker icon, top-right)

**Pause Menu** (overlay, 70% black background):
- Resume
- How to Play
- Restart
- Quit to Menu

**Game Over Screen**:
- "TIME'S UP" header (red, with shake-in animation)
- Final Score (large, counting up animation)
- High Score indicator ("NEW BEST!" bounce animation if applicable)
- Stage Reached + Total Time Stolen stat
- "Steal +5s" rewarded ad button (green, prominent -- once per run)
- "Play Again" button (cyan)
- "Menu" button (gray)

**Help / How to Play Screen** (overlay):
- Title: "HOW TO STEAL TIME"
- Visual 1: Swipe arrow through crystal SVG -> "+3s" text (steal demo)
- Visual 2: Tap arrow on player -> player hops over red hex (dodge demo)
- Visual 3: Timer bar draining with arrows showing steal refills it
- Rules: "Swipe obstacles to steal time. Dodge red bombs. Timer = your life."
- Tips: "Chain steals for score multipliers!" / "Unstolen obstacles compress your space!"
- "GOT IT!" button returns to previous screen

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
| Rewarded | "Steal +5s" revive after death | Every game over (once per run) | Always optional |
| Rewarded | Double final score | Game over screen | Always optional |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Time Revive | Watch rewarded ad after death | +5 seconds added, resume play | Once per run |
| Score Double | Watch rewarded ad at game over | 2x final score | Once per session |

### 7.3 Session Economy

Sessions are naturally short (30-90s), driving high game-over frequency and thus high ad impression potential. The rewarded ad revive is extremely compelling because losing at 45 seconds of play with a high chain feels devastating -- the +5s offer feels like a genuine lifeline.

**Session Flow with Monetization**:
```
[Play Free 30-90s] --> [Timer = 0 / Crush Death]
                              |
                    [Rewarded Ad: Steal +5s?]
                         | Yes --> [Resume + 5s, play continues]
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
games/time-thief/
+-- index.html              # Entry point, CDN loads, script order
+-- css/
|   +-- style.css           # Responsive styles, timer bar, neon glow
+-- js/
    +-- config.js           # Constants, difficulty tables, colors, SVGs
    +-- stages.js           # Stage generation, obstacle spawning params
    +-- ads.js              # Ad hooks, reward callbacks
    +-- effects.js          # Particle system, screen shake, juice effects
    +-- ui.js               # MenuScene, GameOverScene, HUD, Help, Pause
    +-- game.js             # GameScene: core loop, stealing, dodging, timer
    +-- main.js             # BootScene, Phaser init, scene registration (LAST)
```

**Script load order in index.html**: config -> stages -> ads -> effects -> ui -> game -> main

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `COLORS` object: all hex values
- `DIFFICULTY` table: speed, spawn interval, steal window, bomb chance per stage range
- `SCORING` object: base points, chain thresholds, multipliers
- `TIMER` object: start=10, drain=1, inactivity_drain=2, revive_bonus=5
- `WALL` object: growth_per_miss=3, crush_threshold=0.15
- `SVG_STRINGS` object: player, obstacle, bomb, boss SVG markup
- `GRADE_TABLE`: grade thresholds for score display

**main.js** (max 300 lines):
- BootScene: load all SVGs via `textures.addBase64()` once
- Phaser.Game config: 360x640 canvas, CANVAS renderer, transparent false
- Scene array: [BootScene, MenuScene, GameScene, UIScene, GameOverScene]
- Orientation/resize handler
- localStorage read/write helpers

**game.js** (max 300 lines):
- GameScene create(): init player, timer, obstacle group, wall tracker, input handlers
- GameScene update(): drain timer (delta-based), move obstacles, check steal windows, check death conditions
- Swipe detection: pointerdown -> pointermove -> pointerup, track deltaX > 50px = swipe
- Steal logic: check if obstacle in steal zone (center 40% of remaining play area), check timing window
- Dodge logic: on tap (deltaX < 10px), player tween y-offset -60px then back, 200ms
- Boss logic: track boss hit count, 3 hits = crack + reward
- Wall management: increment wall width on unstolen obstacle pass, check crush threshold
- Death: emit 'player-death' event, transition to GameOverScene

**stages.js** (max 300 lines):
- `generateStageParams(stageNum)`: returns { speed, spawnInterval, stealWindow, bombChance, timeValues, hasBoss }
- `spawnObstacle(scene, params)`: create obstacle sprite with random time value, set velocity
- `spawnBomb(scene, params)`: create bomb sprite with subtract value
- `spawnBoss(scene, params)`: create boss sprite with 3 health, larger hitbox
- Obstacle pool recycling for performance
- Solvability check: ensure bomb_chance leaves >= 60% stealable

**ui.js** (max 300 lines):
- MenuScene: title text with glow tween, play button, help button, high score display
- GameOverScene: score count-up animation, high score check, ad offer buttons, play again
- HUD overlay (UIScene running parallel to GameScene): timer bar, stage text, chain counter, score
- Timer bar: `graphics.fillRect()` with color lerp based on remaining time
- Pause overlay: semi-transparent black + resume/restart/menu buttons
- Help overlay: SVG illustrations + instruction text

**effects.js** (max 300 lines):
- `stealParticles(scene, x, y, color, count)`: radial particle burst
- `damageFlash(scene)`: red overlay tween
- `screenShake(scene, intensity, duration)`: camera shake
- `scalePunch(target, scale, duration)`: scale tween bounce
- `floatingText(scene, x, y, text, color)`: text float up + fade
- `deathEffect(scene)`: heavy shake + desaturation + slow-mo feel
- `comboGlow(scene, player, tier)`: outline color change based on chain tier
- `bosscrack(scene, boss, hitNum)`: crack line + gold particles

**ads.js** (max 300 lines):
- Placeholder ad SDK hooks
- `showInterstitial()`: tracks game_over_count, shows every 3rd
- `showRewarded(callback)`: offers revive or score double
- `onAdRewarded(type)`: dispatches reward (revive: add 5s, score: multiply 2x)
- `onAdClosed()`, `onAdFailed()`: fallback handlers

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |
| Howler.js | 2.x | `https://cdn.jsdelivr.net/npm/howler@2/dist/howler.min.js` | Audio playback |

---

## 9. Juice Specification

### 9.1 Player Input Feedback (applied to every swipe/tap)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Swipe trail | Count: 8, Direction: horizontal left, Color: #00F5FF, Lifespan: 300ms |
| Scale punch | Player character | Scale: 1.2x, Recovery: 100ms |
| Haptic | Device | 10ms vibration on swipe, 5ms on tap |

### 9.2 Core Action: Time Steal Feedback

| Effect | Values |
|--------|--------|
| Particles | Count: 20, Radial burst from obstacle center, Color: #00E676, Lifespan: 400ms |
| Hit-stop | 40ms physics pause (all obstacles freeze, timer freezes) |
| Camera zoom | 1.03x snap, Recovery: 200ms ease-out |
| Timer bar flash | Green glow pulse, 150ms |
| Floating text | "+Ns" at obstacle pos, Color: #00E676, Float up 60px, Fade: 500ms |
| Sound pitch | Base pitch + 5% per chain level (chain 5 = +25% pitch) |
| Combo escalation | Particle count +5 per chain tier (20/25/30/35), shake intensity +1px per tier |

### 9.3 Death/Failure Effects

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 12px, Duration: 400ms |
| Screen effect | Red flash (#FF1744, 40% opacity, 300ms) then desaturation tween to grayscale over 500ms |
| Sound | Low-frequency digital flatline, Duration: 800ms |
| Timer visual | Timer bar shatters (splits into 5 pieces that fly off screen), 400ms |
| Effect -> UI delay | 600ms (let death effects play before showing game over) |
| Death -> restart | **Under 1.5 seconds** (tap Play Again -> gameplay in <1.5s) |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+N pts", Color: #FFFFFF, Movement: up 50px, Fade: 500ms |
| Score HUD punch | Scale 1.3x, Recovery: 120ms |
| Combo text | "x3!" / "x5!" / "x10!" centered screen, Size: 48px base + 8px per tier, Color shifts: #FFFFFF -> #FFB300 -> #FF6D00 -> #FF1744 |
| Chain milestone | Screen border flash (gold for x3, orange for x6, red for x10), 200ms |

### 9.5 Damage Effects (Miss/Bomb Hit)

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 5px, Duration: 150ms |
| Red flash | Overlay #FF1744, 25% opacity, 150ms fade |
| Floating text | "-2s" at player position, Color: #FF1744, Shake horizontally 3px, Fade: 600ms |
| Timer bar | Shrink animation with red flash, 200ms |
| Chain counter | "x0" flash and fade, chain reset visual |
| Player flinch | Player sprite flashes white 3 times over 300ms |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | Minimal assets (SVG only) |
| Memory Usage | <80MB | Object pooling for obstacles |
| JS Bundle Size | <50KB total (excl. CDN) | 7 small JS files |
| First Interaction | <1 second after load | Boot -> Menu immediate |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser pointer events for swipe detection (pointerdown/move/up)
- **Prevent Default**: Disable pull-to-refresh, pinch-to-zoom
- **Orientation**: Portrait lock via CSS + resize handler (reposition elements on orientation change)
- **Object Pooling**: Recycle obstacle sprites instead of create/destroy to prevent GC stutters
- **Throttling**: Pause timer and game on `visibilitychange` event

### 10.3 Swipe Detection Algorithm

```
onPointerDown: record startX, startY, startTime
onPointerMove: track currentX for visual feedback
onPointerUp:
  deltaX = currentX - startX
  deltaY = currentY - startY
  deltaTime = now - startTime

  if (abs(deltaX) > 50 && abs(deltaX) > abs(deltaY) * 2 && deltaTime < 500ms):
    -> SWIPE detected -> attempt steal
  elif (abs(deltaX) < 10 && abs(deltaY) < 10 && deltaTime < 200ms):
    -> TAP detected -> dodge hop
  else:
    -> ignored (ambiguous gesture)
```

### 10.4 Timer Precision

Timer must use Phaser's `delta` time (ms) for frame-rate-independent countdown:
```
update(time, delta) {
  this.timer -= (delta / 1000) * this.drainRate;  // drainRate = 1.0 normally, 2.0 on inactivity
  if (this.timer <= 0) { this.playerDeath(); }
}
```

### 10.5 Local Storage Schema

```json
{
  "time_thief_high_score": 0,
  "time_thief_games_played": 0,
  "time_thief_highest_stage": 0,
  "time_thief_total_time_stolen": 0,
  "time_thief_settings": {
    "sound": true,
    "music": true,
    "vibration": true
  }
}
```

### 10.6 Critical Implementation Warnings

1. **BootScene texture registration**: All SVGs must be registered via `addBase64()` ONCE in BootScene. Never re-register on scene restart.
2. **main.js loads LAST**: Script order in index.html must be config -> stages -> ads -> effects -> ui -> game -> main.
3. **Timer never pauses in gameplay**: Timer drain is constant. Only pause on actual pause overlay or `visibilitychange`.
4. **Hit-stop uses setTimeout, NOT Phaser delayedCall**: `timeScale=0` + `delayedCall()` = permanent freeze bug. Use `setTimeout(resume, 40)`.
5. **Obstacle removal**: Never remove sprites inside collision callbacks. Use `this.time.delayedCall(0, () => sprite.destroy())`.
6. **Orientation resize**: Handle `resize` event to reposition all UI elements. This must be in the base game template.
