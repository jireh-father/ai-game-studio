# Game Design Document: Toilet Unclogger

**Slug**: `toilet-unclogger`
**One-Liner**: Frantically plunge toilets before they overflow — each clog is weirder than the last
**Core Mechanic**: Rhythmic rapid-tap with variable tempo matching
**Target Session Length**: 2-4 minutes
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Toilets keep clogging with increasingly absurd objects — rubber ducks, pizza slices, alarm clocks, a whole watermelon. The player grabs a plunger and taps to unclog, but each object demands a different plunging rhythm. A rubber duck needs quick rapid taps. A brick needs slow, heavy plunges. A spaghetti ball needs an alternating fast-slow-fast pattern.

The twist: water rises constantly. Each correct-rhythm plunge pushes water down. Off-rhythm plunges barely move it. Stop tapping and water surges up. Overflow = game over. As stages progress, multiple toilets appear on screen and the player must swipe between them, managing 2-3 rising water levels simultaneously. The humor of bizarre clog objects combined with the panic of rising water creates a "gross but I can't stop" compulsion loop.

### 1.2 Target Audience

Casual mobile gamers aged 13-35 who enjoy gross humor and reflex games. Play context: short bursts during commutes, waiting rooms, bathroom breaks (the irony sells itself). Low skill floor (just tap), high skill ceiling (rhythm mastery + multi-toilet management). The gross-out humor drives viral sharing — players screenshot the weirdest clogs and share them.

### 1.3 Core Fantasy

You are the world's most desperate plumber. Every toilet is a ticking time bomb. The satisfaction comes from the frantic plunging rhythm locking in perfectly, the water dropping just in time, and the absurd reveal of what was clogging the toilet. It's panic + relief + gross laughter in a 30-second loop.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 2-4 minutes |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 22%+ |
| Average Stages per Session | 8-15 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[New Clog Appears] --> [Read Rhythm Indicator] --> [Tap to Plunge in Rhythm]
        ^                                                  |
        |                                          [Water Drops / Clog Progress]
        |                                                  |
        |                                          [Clog Cleared!]
        |                                                  |
        └──────── [Next Clog / Add Toilet] <───────────────┘
                          |
                    [Overflow = Game Over]
                          |
                    [Retry / Continue]
```

Moment-to-moment: The player sees a toilet with rising water and a rhythm indicator (falling beat markers, like Guitar Hero notes). They tap the plunger area in time with the beats. Each on-beat tap pushes water down and fills the clog progress bar. Off-beat taps push water down slightly but don't fill progress. Missing beats causes water to surge. When the progress bar fills, the clog object pops out with a satisfying splash and the next clog drops in. At higher stages, a second and third toilet slide onto screen and the player must swipe between them.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Plunge | Tap (anywhere on active toilet) | Push plunger down. Timing relative to beat indicator determines effectiveness |
| Switch Toilet | Swipe Left/Right | Slide view to adjacent toilet (stages 6+). Snap animation, 150ms |
| Hold Plunge | Hold + Release | For "heavy" clog types — hold until beat marker fills, release on beat |

**Control Philosophy**: The primary action is tapping — the most natural mobile gesture. The rhythm element transforms mindless mashing into a skill expression. Swiping between toilets adds spatial awareness without complex controls. Hold-release adds variety for specific clog types without changing the core input.

**Touch Area Map**:
```
+-------------------------------+
| Score    Stage    Water Level |  <-- Top HUD (non-interactive)
+-------------------------------+
|                               |
|     [Beat Indicator Zone]     |  <-- Falling beat markers (visual only)
|     (top 30% of play area)   |
|                               |
+-------------------------------+
|                               |
|     [Toilet + Plunger]        |  <-- Main visual area
|     (middle 40%)              |
|                               |
+-------------------------------+
|                               |
|     [TAP ZONE]                |  <-- Full-width tap target
|     (bottom 30%)              |  <-- Also responds to taps on toilet
|                               |
+-------------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Perfect Beat Hit | 100 | Within 50ms of beat center |
| Good Beat Hit | 50 | Within 120ms of beat center |
| Off-Beat Tap | 10 | Any tap not on beat |
| Clog Cleared | 500 + (stage * 50) | Bonus x2 if no missed beats |
| Multi-toilet Clear | 200 per extra toilet | Clearing 2+ toilets within 3s of each other |
| Streak Bonus | +10% per 10 consecutive perfects | Resets on miss |

**Combo System**: Consecutive perfect/good hits build a combo counter. Every 5 combos, plunger effectiveness increases by 10% (water drops faster per tap). At 20 combo, the plunger glows gold and all taps count as perfect for 3 seconds. Combo resets on any missed beat.

**High Score**: Stored in localStorage as `toilet_unclogger_high_score`. Displayed on menu screen and game over screen. New high score triggers confetti particles and "NEW RECORD" text.

### 2.4 Progression System

The game is infinite with stage-based progression. Each stage = one set of clogs to clear. Difficulty ramps through clog complexity, water rise speed, and number of active toilets.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-3 | Single toilet, simple rhythms (steady 2 BPM tap) | Tutorial — slow water, forgiving timing |
| 4-7 | Varied rhythms (syncopation, speed changes) | Water rises 20% faster, timing window shrinks 15% |
| 8-12 | Second toilet appears, hold-release clogs | Must manage 2 toilets, water rises 40% faster |
| 13-20 | Complex rhythms (triplets, offbeats), urgent clogs | Third toilet at stage 16, timing window shrinks 30% |
| 21-35 | Mixed clog types per toilet, speed-up events | Water rises 60% faster, beat patterns randomized |
| 36+ | Endless survival — all mechanics combined, random spikes | Water rise 80% faster, maximum chaos |

### 2.5 Lives and Failure

The game uses a single-life system with water level as health. Each toilet has its own water level (0-100%). At 100%, that toilet overflows and the game is over. There are no extra lives — one overflow ends the run.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Water reaches 100% (overflow) | Immediate game over | Watch rewarded ad to drain water to 50% and continue |
| Idle for 6 seconds | Water surges to overflow | None — auto game-over |

**Continue System**: After first death, player is offered one rewarded ad continue. Water drains to 50% on all toilets and gameplay resumes from the same stage. Only one continue per run.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each stage consists of 1-4 clogs per active toilet. The player must clear all clogs on all active toilets to advance. Clog selection is procedural based on stage number and difficulty tier.

**Generation Algorithm**:
```
Stage Generation Parameters:
- Seed: stage_number * 7919 + session_salt
- Active Toilets: 1 (stages 1-7), 2 (stages 8-15), 3 (stages 16+)
- Clogs Per Toilet: min(1 + floor(stage / 5), 4)
- Clog Pool: filtered by difficulty tier (see clog table)
- BPM Range: 60 + stage * 4, capped at 180
- Water Rise Rate: 2 + stage * 0.3 (% per second), capped at 12%/s
- Beat Timing Window: max(150 - stage * 2, 80) ms (perfect), max(250 - stage * 2, 140) ms (good)
- Hold Duration (hold clogs): 400 + random(0, 200) ms
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
| BPM | 60-72 | 76-88 | 92-108 | 112-140 | 144-172 | 172-180 |
| Water Rise (%/s) | 2.0-2.9 | 3.2-4.1 | 4.4-5.6 | 5.9-8.0 | 8.3-12.0 | 12.0 |
| Perfect Window (ms) | 150-144 | 142-136 | 134-126 | 124-112 | 110-92 | 80 |
| Active Toilets | 1 | 1 | 2 | 2-3 | 3 | 3 |
| Clogs Per Toilet | 1 | 1-2 | 2 | 2-3 | 3-4 | 4 |
| Clog Types Available | Basic | Basic + Varied | + Hold | + Complex | + Urgent | All |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Water rise rate and BPM are balanced so a player hitting 80%+ of beats on rhythm will never overflow. The math: each perfect tap reduces water by `(100 / beats_to_clear)` percent, and rise rate never exceeds drainable rate at 80% accuracy.
2. **Variety Threshold**: Consecutive clogs on the same toilet must differ in rhythm type. No two identical clog objects in a row.
3. **Difficulty Monotonicity**: BPM and water rise rate only increase between stages (never decrease). Within a stage, different toilets may have different BPMs.
4. **Rest Stages**: Every 5th stage (5, 10, 15...) is a "breather" — single toilet, simple rhythm, slow water. Gives the player a moment to relax.
5. **Boss Clogs**: Every 10th stage (10, 20, 30...) features a "mega clog" — an absurdly large object (toilet full of rubber ducks, a whole couch) that requires 3x normal beats to clear with a unique rhythm pattern.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Cartoon gross-out with bright, saturated colors. Think clean vector art with exaggerated proportions — big chunky toilets, oversized plunger, cartoony water splashes. The grossness is humorous, not realistic. Objects are drawn cute-ugly (a smiling fish, a derpy rubber duck).

**Aesthetic Keywords**: Gross-cute, saturated, chunky, slapstick, bathroom

**Reference Palette**: Bright bathroom whites and blues contrasted with gross greens and browns. Pop of color from each clog object. High contrast for readability on mobile.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary (Porcelain) | Clean White | #F5F0E8 | Toilet bowl, background |
| Secondary (Water) | Toilet Blue | #4FC3F7 | Clean water, UI accents |
| Danger (Rising Water) | Warning Brown-Green | #8D6E3F | Dirty rising water |
| Critical | Overflow Red | #FF5252 | Water above 80%, danger flash |
| Plunger | Rubber Red | #E53935 | Plunger cup and handle |
| Beat Marker | Neon Green | #76FF03 | Perfect beat zone |
| Good Zone | Soft Yellow | #FFD740 | Good timing zone |
| Background | Tile Blue | #E3F2FD | Bathroom tile background |
| UI Text | Dark Slate | #263238 | Score, stage text |
| Score Pop | Gold | #FFD600 | Floating score text |

### 4.3 SVG Specifications

All graphics are generated programmatically via Phaser Graphics API (no external SVG files).

**Toilet**:
```
- Base: Rounded rectangle (w:140, h:180), fill #F5F0E8, stroke #BDBDBD 3px
- Bowl: Ellipse inside (w:120, h:80), y-offset from top 60px
- Water fill: Clipped rectangle inside bowl, color transitions from #4FC3F7 (low) to #8D6E3F (mid) to #FF5252 (high)
- Lid: Arc behind bowl top, fill #F5F0E8
- Handle: Small rectangle + circle on left side
```

**Plunger**:
```
- Handle: Rectangle (w:12, h:80), fill #795548 (wood brown)
- Cup: Half-circle (r:30) at bottom, fill #E53935
- Animation: Y-translate -20px on tap, spring back 100ms
```

**Beat Indicators** (Guitar Hero style falling notes):
```
- Track: Vertical strip (w:60) with subtle grid lines
- Beat markers: Circle (r:14), fill #76FF03, falling from top
- Hit zone: Horizontal bar at bottom of track, glows on correct hit
- Perfect zone: 6px tall bar, Good zone: 12px tall bar surrounding it
```

**Clog Objects** (30+ objects, each simple shapes):
```
Rubber Duck: Yellow ellipse body + orange triangle beak + dot eye (6 shapes max)
Pizza Slice: Triangle + red circles (pepperoni) + yellow fill
Brick: Rectangle with line grid pattern, fill #B71C1C
Watermelon: Green ellipse + dark green stripes + pink interior on clear
Fish: Ellipse body + triangle tail + dot eye, fill #42A5F5
Alarm Clock: Circle + two small circles on top + rectangle legs
Sock: L-shaped rounded rectangle, striped pattern
Tennis Ball: Circle with curved line, fill #C6FF00
Phone: Rounded rectangle with inner rectangle screen
Teddy Bear: Circle head + ellipse body + small circle ears
Spaghetti: Wavy lines cluster, fill #FFD54F
Shoe: Irregular polygon, fill #5D4037
Book: Rectangle with spine line, fill #1565C0
Banana: Curved thick line, fill #FDD835
Cactus: Rectangle + small rectangles (arms), fill #4CAF50
```

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Water Ripple | Every beat hit | Sine wave distortion on water surface, 200ms |
| Splash Particles | Clog cleared | 20 blue circles (#4FC3F7) burst upward, gravity pull, fade 600ms |
| Plunger Squash | On tap | ScaleX 1.3, ScaleY 0.7 for 80ms, spring back |
| Water Glow | Water > 80% | Red (#FF5252) pulsing glow around toilet rim, 500ms cycle |
| Object Pop | Clog cleared | Object flies upward with rotation, scales to 0, 400ms |
| Beat Hit Flash | Perfect hit | White flash circle at hit zone, scale 0 to 2x, fade 150ms |
| Screen Tint | Water > 90% | Screen edges tint red, opacity pulsing |
| Combo Fire | Combo > 10 | Small flame particles on plunger, intensify with combo |
| Overflow Burst | Game over | Brown water particles burst from toilet, 40 particles, 800ms |

---

## 5. Audio Design

### 5.1 Sound Effects

All sounds generated via Web Audio API oscillators (no audio files needed).

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Perfect Plunge | Satisfying "sploosh" — low sine wave + white noise burst | 150ms | High |
| Good Plunge | Softer "splsh" — quieter version of perfect | 120ms | High |
| Off-Beat Tap | Dull thud — low frequency square wave | 80ms | Medium |
| Beat Miss | Quick descending tone — "bwoop" | 100ms | Medium |
| Clog Cleared | Ascending "pop-splash" — rising sine + noise burst | 300ms | High |
| Water Warning | Rapid bubbling — noise oscillation at 8Hz | Loops while > 80% | High |
| Overflow (Death) | Deep gurgling burst — low sine sweep + heavy noise | 600ms | High |
| Toilet Switch | Quick woosh — filtered noise sweep | 100ms | Low |
| Combo Milestone (5, 10, 20) | Ascending chime — three quick sine tones | 200ms | Medium |
| Stage Clear | Triumphant flush — descending then ascending sweep | 500ms | High |
| Menu Tap | Light click — high sine blip | 50ms | Low |

### 5.2 Music Concept

**Background Music**: Funky bassline loop generated with Web Audio API. 4-bar repeating pattern with quantized bass notes. Tempo syncs to the current stage BPM, creating a dynamic soundtrack that speeds up as difficulty increases.

**Music State Machine**:

| Game State | Music Behavior |
|-----------|---------------|
| Menu | Chill lo-fi bass loop, 80 BPM, low-pass filtered |
| Early Stages (1-7) | Funky bass, matches stage BPM (60-88), clean tone |
| Mid Stages (8-20) | Added percussion layer (hi-hat from noise), BPM 92-140 |
| Late Stages (21+) | Full groove — bass + percussion + synth stabs, BPM 144+ |
| Water > 80% | Music pitch bends up slightly, added urgency filter |
| Game Over | Music cuts, reverb tail fades 1.5s |
| Pause | Music volume to 20%, low-pass filter engaged |

**Audio Implementation**: Web Audio API only (no Howler.js needed for this game — all sounds are synthesized).

---

## 6. UI/UX

### 6.1 Screen Flow

```
+------------+     +------------+     +------------+
|   Title    |---->|    Menu    |---->|    Game    |
|   Screen   |     |   Screen   |     |   Screen   |
+------------+     +------------+     +------------+
                        |                   |
                        |              +----+----+
                        |              |  Pause  |
                        |              | Overlay |
                        |              +----+----+
                        |                   |
                   +----+----+         +----+----+
                   | Settings|         |  Game   |
                   | Overlay |         |  Over   |
                   +---------+         +----+----+
                                            |
                                       +----+----+
                                       |Continue |
                                       | Prompt  |
                                       +---------+
```

### 6.2 HUD Layout

```
+-------------------------------+
| Score: 4250   Stage 7  x15   |  <-- Top bar (score left, stage center, combo right)
+-------------------------------+
|  [Beat Track]                 |
|  | o |        TOILET 1        |  <-- Beat markers fall down track
|  | o |     +----------+      |
|  |   |     |  ~~~~~~  |      |  <-- Water level visible in bowl
|  | o |     | [OBJECT] |      |
|  |===|     |  ~~~~~~  |      |  <-- Hit zone bar
|  |   |     +----++----+      |
|  |   |          ||           |
|  |   |     [PLUNGER]        |
+-------------------------------+
| WATER: [=========>  ] 72%    |  <-- Water level bar (color-coded)
+-------------------------------+
|                               |
|      [ TAP TO PLUNGE! ]      |  <-- Tap zone hint (fades after stage 1)
|                               |
+-------------------------------+
```

**Multi-Toilet Layout (Stages 8+)**:
```
+-------------------------------+
| Score: 12800  Stage 12  x8   |
+-------------------------------+
|                               |
|  [T1]    [T2 ACTIVE]   [T3]  |  <-- Active toilet centered, others dimmed at edges
|   dim    full-size      dim   |
|                               |
| <- Swipe                  -> |
+-------------------------------+
| WATER: T1[===] T2[======] T3[=] |
+-------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left | Current score, punch animation on increase | Every score event |
| Stage | Top-center | "Stage N" with star icon | On stage transition |
| Combo | Top-right | "xN" combo counter, scales with combo | Every beat hit |
| Beat Track | Left of active toilet | Falling beat markers with hit zone | Every frame (60fps) |
| Water Bar | Below play area | Colored progress bar per toilet | Every frame |
| Clog Object | Inside toilet bowl | Current clog object visual | On new clog |
| Plunger | Below toilet | Animated plunger, bounces on tap | On player tap |

### 6.3 Menu Structure

**Title Screen** (auto-transitions after 2s or on tap):
- Game title "TOILET UNCLOGGER" in chunky block letters
- Animated toilet with plunger bouncing
- "TAP TO START" pulsing text

**Main Menu**:
- PLAY button (large, center, toilet-shaped)
- High Score display below play button
- Settings gear icon (top-right)
- Sound toggle (top-left, speaker icon)

**Pause Menu** (overlay, 70% opacity dark background):
- Resume (large button)
- Restart
- Quit to Menu

**Game Over Screen**:
- "OVERFLOW!" title with splash animation
- Clog object that killed you (displayed large)
- Final Score (large, animated count-up)
- High Score indicator (if new record — "NEW RECORD!" with confetti)
- Stage Reached
- "Watch Ad to Continue" button (drain icon, pulsing — only on first death)
- "Play Again" button (plunger icon)
- "Menu" button (small, bottom)

**Settings Screen** (overlay):
- Sound Effects: On/Off toggle
- Music: On/Off toggle
- Vibration: On/Off toggle

---

## 7. Monetization

Note: This is a POC build. Ad integration uses placeholder hooks only — no actual ad SDK.

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after overflow | Every game over (once per run) | Always (optional) |
| Rewarded | Emergency Drain (drain 30% water mid-game) | Once per run, prompted at 85% water | Always (optional) |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Continue | Watch rewarded ad after overflow | Drain all toilets to 50%, resume same stage | Once per run |
| Emergency Drain | Watch rewarded ad at 85%+ water | Drain active toilet by 30% | Once per run |

### 7.3 Session Economy

The 6-second death timer ensures very short sessions for struggling players, creating frequent game-over screens and ad opportunities. Skilled players have longer sessions but still hit interstitials every 3rd death. The emergency drain rewarded ad hits at peak frustration (85% water) when the player is most desperate — high conversion moment.

**Session Flow with Monetization**:
```
[Play] --> [Water Rising] --> [85% Water?] --> [Emergency Drain Ad?]
                |                                    | Yes --> [Drain 30%]
                |                                    | No  --> [Continue]
                v
          [Overflow] --> [Rewarded Ad: Continue?]
                              | Yes --> [Resume at 50% water]
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
games/toilet-unclogger/
+-- index.html              # Entry point, CDN imports, script loading
+-- css/
|   +-- style.css           # Responsive layout, portrait lock, safe areas
+-- js/
    +-- config.js           # Constants, difficulty tables, clog definitions, colors
    +-- main.js             # Phaser init, scene registration, global state, localStorage
    +-- game.js             # GameScene: core loop, beat system, water physics, input
    +-- stages.js           # Stage generation, clog selection, difficulty scaling, toilets
    +-- ui.js               # MenuScene, GameOverScene, HUD, pause overlay, settings
    +-- ads.js              # Ad placeholder hooks, reward callbacks, frequency tracking
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- Game dimensions (360x640 base, Phaser RESIZE scale mode)
- Color palette constants (all hex values from Section 4.2)
- Clog object definitions: `{ id, name, rhythmType, bpmModifier, beatsToClean, tier }`
- 30+ clog objects organized by difficulty tier (basic, varied, hold, complex, urgent)
- Difficulty curve tables: BPM, water rise rate, timing windows per stage range
- Scoring values and combo thresholds
- Beat timing constants (perfect window, good window)

**main.js** (max 300 lines):
- Phaser.Game initialization: `{ type: Phaser.AUTO, scale: { mode: Phaser.Scale.RESIZE } }`
- Scene registration: TitleScene, MenuScene, GameScene, GameOverScene
- Global state: `highScore`, `gamesPlayed`, `settings`, `sessionData`
- localStorage read/write with `toilet_unclogger_` prefix
- Web Audio API context initialization (on first user tap)
- Orientation warning overlay for landscape

**game.js** (max 300 lines):
- GameScene extending Phaser.Scene
- `create()`: Initialize toilet(s), plunger, beat track, water system, input handlers
- `update(time, delta)`: Advance beat markers, update water levels, check overflow, check idle timer
- Beat system: spawn beat markers at top of track, move downward at BPM-derived speed
- Hit detection: on tap, check nearest beat marker distance to hit zone
- Water physics: rise rate per frame, reduction on hit, surge on miss
- Toilet switching: swipe detection, slide animation, active toilet tracking
- Idle detection: 6-second inactivity timer, water surge to 100% on trigger
- Plunger animation: squash-stretch on tap, spring physics

**stages.js** (max 300 lines):
- `generateStage(stageNum)`: Returns `{ toilets: [{ clogs: [...] }], bpm, waterRiseRate }`
- Clog selection algorithm: filter by tier, weighted random, no consecutive duplicates
- Difficulty parameter calculation from stage number
- Active toilet count calculation
- Rest stage detection (every 5th) and boss stage detection (every 10th)
- Stage transition: clear animation, "STAGE N" text, new stage setup
- Clog queue management per toilet

**ui.js** (max 300 lines):
- TitleScene: Title text, animated toilet, tap-to-start
- MenuScene: Play button, high score display, settings icon, sound toggle
- GameOverScene: Score display, animated count-up, high score check, continue/retry/menu buttons
- HUD: Score text (with punch tween), stage text, combo counter, water level bars
- Pause overlay: Resume, restart, quit buttons
- Settings overlay: Sound, music, vibration toggles
- Floating score text system: "+100" that floats up and fades

**ads.js** (max 300 lines):
- Placeholder ad SDK hooks: `showInterstitial()`, `showRewarded(callback)`
- Interstitial frequency tracker (every 3rd game over)
- Rewarded ad state: `continueUsed`, `emergencyDrainUsed` per run
- Mock ad behavior: 2-second delay simulating ad, then callback
- Ad event logging for analytics

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No Howler.js needed — all audio is synthesized via Web Audio API.

---

## 9. Juice Specification

### 9.1 Player Input Feedback (every plunge tap)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Hit zone | Count: 8, Direction: upward fan, Color: #4FC3F7 (water), Lifespan: 300ms |
| Plunger Squash | Plunger sprite | ScaleX: 1.3, ScaleY: 0.7, Recovery: 100ms (spring ease) |
| Water Ripple | Water surface | Sine displacement: 4px amplitude, 3 waves, Duration: 200ms |
| Vibration | Device | Duration: 30ms (light tap) |
| Sound | -- | "Sploosh" oscillator, Pitch: +3% per combo level |

### 9.2 Perfect Beat Hit (core action, most frequent)

| Effect | Values |
|--------|--------|
| Particles | Count: 15, Color: #76FF03 (neon green) + #4FC3F7 (water), burst radial, Lifespan: 400ms |
| Hit-stop | 40ms game pause (water and beats freeze momentarily) |
| Beat Marker Flash | White circle scale 0 to 2x at hit zone, fade 150ms |
| Camera shake | Intensity: 2px, Duration: 80ms |
| Combo escalation | Every 5 combos: particle count +5, shake intensity +1px, plunger glow brightens 10% |
| Score float | "+100" in #FFD600, float up 60px, fade 500ms |

### 9.3 Death/Failure Effects (Overflow)

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 12px, Duration: 400ms, Decay: exponential |
| Water Burst | 40 brown (#8D6E3F) particles burst upward from toilet, gravity 300, Lifespan: 800ms |
| Screen flash | White flash 100ms, then red tint fade 300ms |
| Toilet shake | Toilet sprite vibrates 8px horizontal, 300ms |
| Sound | Deep gurgling burst, 600ms, descending frequency sweep 200Hz to 40Hz |
| Slow motion | TimeScale 0.3 for 500ms during overflow animation |
| Death to UI delay | 800ms (overflow animation plays, then game over screen slides up) |
| Death to restart | Under 1.5 seconds (tap "Play Again" immediately available) |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+N" in #FFD600 (gold), float up 60px over 500ms, fade out last 200ms |
| Score HUD punch | Scale 1.4x on update, spring back 150ms |
| Combo text | "x5!" / "x10!" / "x20 FIRE!" — size escalation: base 24px + 2px per 5 combos |
| Combo milestone | At x5, x10, x20: screen-wide horizontal light streak, 200ms |
| Clog clear bonus | Object flies up with spin (720deg/s), score text "+500" extra large (36px), green flash |

### 9.5 Stage Transition Effects

| Effect | Values |
|--------|--------|
| Clear flash | White screen flash 150ms, toilet sparkles (8 star particles) |
| Stage text | "STAGE N" drops from top with bounce ease, holds 800ms, fades 300ms |
| Water reset | Water animates draining from current level to 20% over 500ms |
| New clog drop | Object drops into toilet bowl from above with squash on land, 300ms |
| Boss stage | "MEGA CLOG!" text in red, toilet shakes, dramatic pause 500ms before start |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | No external assets, all code-generated |
| Memory Usage | <80MB | Minimal textures, particle pooling |
| JS Bundle Size | <50KB total (excl. CDN) | All code, no assets |
| First Interaction | <500ms after load | Immediate — no asset loading phase |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser pointer events for tap and swipe detection
- **Prevent Default**: Disable pull-to-refresh, pinch-to-zoom, double-tap-to-zoom
- **Orientation**: Portrait lock via CSS `@media (orientation: landscape)` warning overlay
- **Safe Areas**: `env(safe-area-inset-*)` padding for notched devices
- **Background Detection**: Pause game on `visibilitychange` event
- **Particle Pooling**: Pre-allocate particle pool of 100 objects, reuse on emit

### 10.3 Touch Controls

- **Tap Detection**: Any pointer down event in game area triggers plunge
- **Swipe Detection**: Horizontal delta > 50px within 300ms = toilet switch. Vertical swipes ignored.
- **Touch Target**: Entire bottom 70% of screen is tap zone (well above 44x44px minimum)
- **Input Buffering**: Buffer last input during hit-stop frames, process on resume
- **Multi-touch**: Ignore second finger — single-touch only to prevent confusion

### 10.4 Beat System Technical Details

- Beat markers are spawned at top of track and move downward at `trackHeight / (60 / bpm)` pixels per second
- Hit zone is a fixed horizontal line near bottom of beat track
- On tap, find nearest beat marker to hit zone. Distance < perfectWindow = perfect, < goodWindow = good, else = off-beat
- Consumed beat markers are removed from active list and play clear animation
- Unplayed beat markers that pass below hit zone by goodWindow ms are counted as misses
- Beat timing is frame-independent using `time` parameter from Phaser `update()`

### 10.5 Clog Object Definitions (30 objects)

| Tier | Objects | BPM Modifier | Beats to Clear | Rhythm Type |
|------|---------|-------------|----------------|-------------|
| Basic (1-3) | Rubber Duck, Sock, Tennis Ball, Banana, Soap Bar | x1.0 | 8 | Steady quarter notes |
| Basic (1-3) | Sponge, Toy Car, Apple, Flip Flop, Hair Ball | x1.0 | 8 | Steady quarter notes |
| Varied (4-7) | Pizza Slice, Fish, Phone, Book, Teddy Bear | x1.1 | 10 | Syncopated (offbeats) |
| Varied (4-7) | Alarm Clock, Shoe, Cactus, Pineapple, Baseball | x1.1 | 10 | Alternating fast-slow |
| Hold (8-12) | Brick, Watermelon, Bowling Ball, Dumbbell, Rock | x0.8 | 6 | Hold-and-release |
| Complex (13-20) | Spaghetti, Rope, Garden Hose, Chain, Seaweed | x1.2 | 12 | Triplet patterns |
| Complex (13-20) | Octopus Toy, Spring, Rubber Chicken, Noodles, Yarn | x1.2 | 14 | Mixed rhythm |
| Urgent (21+) | Whole Couch (boss), Toilet in a Toilet (boss), Kitchen Sink (boss) | x1.0 | 24 | Complex polyrhythm |

### 10.6 Water Physics

- Base rise rate: `(2 + stage * 0.3)` percent per second, capped at 12%
- On perfect hit: water drops by `(100 / beatsToClean) * 1.2` percent
- On good hit: water drops by `(100 / beatsToClean) * 0.8` percent
- On off-beat tap: water drops by `(100 / beatsToClean) * 0.2` percent
- On missed beat: water surges by `2%` instantly
- 6-second idle: water instantly set to 100% (overflow)
- Continue (ad reward): all toilets drain to 50% over 500ms animation

### 10.7 Edge Cases

- **Rapid double-tap**: Debounce at 50ms — ignore taps within 50ms of previous
- **Tab switch during gameplay**: Pause game immediately via `visibilitychange`
- **Audio context**: Web Audio API requires user gesture to start — init on first tap at title screen
- **Stage 16+ three toilets on small screen**: Scale toilets to 70% size, stack info vertically
- **Combo reset timing**: Combo resets only on missed beat, not on off-beat taps (off-beat still counts as "trying")
- **localStorage unavailable**: Graceful fallback — game works without persistence, no high score saving
- **Performance degradation**: If FPS drops below 45, reduce particle count by 50%

### 10.8 Local Storage Schema

```json
{
  "toilet_unclogger_high_score": 0,
  "toilet_unclogger_games_played": 0,
  "toilet_unclogger_highest_stage": 0,
  "toilet_unclogger_settings": {
    "sound": true,
    "music": true,
    "vibration": true
  },
  "toilet_unclogger_total_score": 0
}
```
