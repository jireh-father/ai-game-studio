# Game Design Document: Glass Walk

**Slug**: `glass-walk`
**One-Liner**: Pick the safe glass panel to step on — wrong choice shatters beneath your feet
**Core Mechanic**: Squid Game-inspired glass bridge with skill-based visual cue reading
**Target Session Length**: 30-60 seconds
**Date Created**: 2026-03-05
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Glass Walk is a tension-filled decision game where players must cross a bridge of glass panels, tapping the safe one in each row to advance. Every row presents 2-3 panels — one is tempered (safe), the rest are fragile (deadly). The core skill is READING VISUAL CUES: subtle differences in crack patterns, transparency, color tint, and surface texture that distinguish safe glass from fake glass.

This is NOT a guessing game. Each row briefly flashes the correct answer (0.8s at stage 1, shrinking to 0.2s by stage 20), training players to build pattern recognition and visual memory. Safe panels have consistent "tells" within each difficulty tier — players who learn the visual language progress faster. A 6-second standing timer on each row forces quick decisions under pressure, creating the core tension loop: observe, decide, commit.

Wrong choices produce spectacular shattering effects (the core juice moment). Players get 3 lives. The game escalates through visual cue subtlety (stages 1-10), panel count increase to 3 (stages 10+), weight-based cracking after 3s standing (stages 15+), and appearance-shifting panels (stages 20+).

### 1.2 Target Audience

Casual mobile gamers aged 16-35 who enjoy quick-decision games. High cultural recognition from Squid Game franchise. Play context: short breaks, commute, waiting rooms. Low skill floor (tap a panel) but high skill ceiling (reading subtle cues under time pressure).

### 1.3 Core Fantasy

You are a contestant on the glass bridge. One wrong step and you plummet. The fantasy is surviving against the odds — the relief of a correct choice, the dread of each new row, the growing confidence as you learn to "see" which panel is real. Every successful crossing feels earned through skill, not luck.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 30-60 seconds |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 22%+ |
| Average Stages per Session | 6-12 rows |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[New Row Appears] → [Brief Flash: correct panel highlighted 0.8-0.2s]
       ↓
[Read Visual Cues + Standing Timer 6s counting down]
       ↓
[Tap a Panel]
       ↓
  ┌─ SAFE: Step animation + score + advance to next row
  └─ WRONG: Shatter + fall + lose life
       ↓
  ┌─ Lives > 0: Restart from SAME row (no progress lost)
  └─ Lives = 0: Game Over
       ↓
[Retry / Continue (ad)]
```

**Moment-to-moment**: A new row of panels slides into view. For a brief flash, the safe panel glows — but only for a fraction of a second. The player must observe the remaining visual cues (crack lines, color tint, transparency, surface shimmer) to identify the safe panel before the 6-second standing timer runs out. Tap to commit. The tension builds with every row as cues become subtler and time pressure mounts.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Select Panel | Tap | Tap a glass panel to step on it. Irreversible — no take-backs. |
| Start Game | Tap | Tap "Play" on menu screen |

**Control Philosophy**: Single-tap only. The game's complexity comes from OBSERVATION and DECISION, not motor skill. One tap per row. Simple input, deep reading.

**Touch Area Map**:
```
┌─────────────────────────┐
│ Score    Stage    ♥♥♥   │  ← HUD (non-interactive)
├─────────────────────────┤
│                         │
│   Player character      │  ← Visual only
│   standing on bridge    │
│                         │
│  ┌──────┐  ┌──────┐    │
│  │Panel │  │Panel │    │  ← 2 panels (stages 1-9)
│  │  A   │  │  B   │    │     3 panels (stages 10+)
│  └──────┘  └──────┘    │
│                         │
│   [Standing Timer: 6s]  │  ← Countdown bar
│                         │
└─────────────────────────┘
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Safe step (correct panel) | 100 | Base |
| Quick decision (<2s) | +50 bonus | Decided within 2 seconds |
| Speed streak (3+ quick) | x1.5 multiplier | 3 consecutive quick decisions |
| Perfect row (first try, <1s) | +100 bonus | No hesitation, instant read |
| Stage milestone (every 5) | +200 bonus | Reaching stage 5, 10, 15, etc. |

**Combo System**: Consecutive correct choices without losing a life build a streak counter. Streak of 3+ adds x1.5 multiplier. Streak of 6+ adds x2.0. Streak of 10+ adds x3.0. Any life lost resets streak to 0.

**High Score**: Stored in localStorage (`glass-walk_high_score`). Displayed on menu screen and game over screen. New high score triggers celebratory particle burst + "NEW BEST!" text.

### 2.4 Progression System

The game escalates through VISUAL CUE DIFFICULTY, not mechanical complexity. Players learn to read increasingly subtle tells.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-5 | 2 panels per row. Obvious cues: safe panel has NO crack lines, slightly blue tint. Flash duration 0.8s. | Tutorial — learn the mechanic |
| 6-9 | Crack lines appear on BOTH panels but fake has MORE cracks (5 vs 2). Flash 0.6s. Tint difference reduced. | Medium — read crack density |
| 10-14 | 3 panels per row. Cue: safe panel has faint inner glow. Flash 0.5s. Color difference minimal. | Hard — more choices, subtler cues |
| 15-19 | Weight mechanic: standing on ANY panel for 3s causes visible stress cracks. Must decide faster. Flash 0.4s. | Pressure — time squeeze |
| 20-24 | Panels shift appearance: fake panels briefly mimic safe panel's glow, then revert. Flash 0.3s. | Expert — distinguish real from mimicry |
| 25+ | All mechanics combined. Flash 0.2s. Panels shift every 1.5s. Weight timer 2.5s. Cues are micro-subtle. | Extreme — mastery required |

### 2.5 Lives and Failure

Players start with **3 lives** (displayed as heart icons, top-right HUD).

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Tap wrong panel | Shatter animation + lose 1 life. Restart SAME row. | Watch ad for +1 life (once per game) |
| Standing timer expires (6s) | Panel cracks beneath you. Lose 1 life. Restart same row. | N/A — same as wrong choice |
| All 3 lives lost | Game Over screen | Watch ad to continue with 1 life (once per game) |
| Inactivity on menu (30s) | N/A | N/A |

**Critical**: Wrong panel = restart SAME row (not sent back). This prevents frustration while still costing a life. The punishment is life economy, not progress loss.

**Inactivity Death**: If player is in-game and takes no action for 30 seconds (well beyond the 6s standing timer), force game over. This covers edge cases where standing timer somehow fails.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each "stage" is one row of the glass bridge. The bridge extends infinitely upward (or forward, depending on camera angle). Rows are generated procedurally based on stage number.

**Generation Algorithm**:
```
Stage Generation Parameters:
- panel_count: 2 (stages 1-9), 3 (stages 10+)
- safe_index: random(0, panel_count-1)
- flash_duration: max(0.2, 0.8 - stage * 0.03) seconds
- cue_type: determined by stage tier (crack_density | inner_glow | shimmer_frequency)
- cue_strength: max(0.15, 1.0 - stage * 0.035) — 1.0 = obvious, 0.15 = barely visible
- weight_timer: stage >= 15 ? max(2.5, 3.5 - (stage-15) * 0.05) : null
- shift_enabled: stage >= 20
- shift_interval: stage >= 20 ? max(1.5, 2.5 - (stage-20) * 0.05) : null
```

### 3.2 Difficulty Curve

```
Difficulty
    │
100 │                                          ──────────── (cap)
    │                                    /
 80 │                              /
    │                        /
 60 │                  /
    │            /
 40 │      /
    │  /
 20 │/
    │
  0 └────────────────────────────────────────── Stage
    0    5    10    15    20    25    30+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-5 | Stage 6-9 | Stage 10-14 | Stage 15-19 | Stage 20-24 | Stage 25+ |
|-----------|-----------|-----------|-------------|-------------|-------------|-----------|
| Panel Count | 2 | 2 | 3 | 3 | 3 | 3 |
| Flash Duration | 0.8s | 0.6s | 0.5s | 0.4s | 0.3s | 0.2s |
| Cue Strength | 1.0-0.8 | 0.75-0.6 | 0.55-0.45 | 0.4-0.3 | 0.28-0.2 | 0.18-0.15 |
| Standing Timer | 6s | 6s | 6s | 3.5-3.0s (weight) | 3.0-2.5s | 2.5s |
| Panel Shifting | No | No | No | No | Yes (2.5s) | Yes (1.5s) |
| Primary Cue | No cracks vs cracks | Crack density | Inner glow | Glow + weight stress | Glow + shifting | All combined |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every row has exactly ONE safe panel. The safe panel always has at least one distinguishable visual cue (even at max difficulty, cue_strength never drops below 0.15).
2. **Variety Threshold**: Safe panel position must not repeat more than 2 consecutive rows in the same slot.
3. **Difficulty Monotonicity**: Cue strength decreases monotonically. Flash duration decreases monotonically.
4. **Rest Stages**: Every 8th row is a "rest row" with cue_strength boosted by +0.2 (capped at 0.8) and flash duration +0.2s. Gives breathing room.
5. **Milestone Feedback**: Every 5th row triggers a "STAGE X!" text burst with particles. Brief celebration moment.

### 3.4 Skill-Based Cue System (CRITICAL — addresses Ludus concern)

The game MUST be skill-based, not luck-based. Here is the complete cue system:

**Tier 1 (Stages 1-5): Obvious Tells**
- Safe panel: clean surface, slight blue-white tint (#E8F0FE), no crack lines
- Fake panel: visible crack lines (3-5 lines), slightly yellow tint (#FFF8E1), hairline fractures
- Flash: safe panel pulses bright white for 0.8s at row start

**Tier 2 (Stages 6-9): Crack Density Reading**
- Both panels have crack lines, but safe has 1-2 thin lines, fake has 4-6 thick lines
- Safe panel has uniform transparency; fake has slight opacity variation (cloudy patches)
- Flash reduced to 0.6s

**Tier 3 (Stages 10-14): Inner Glow Detection**
- 3 panels. Safe panel has a faint inner glow (radial gradient, subtle)
- Fake panels have flat coloring — no depth
- Crack lines on all panels (red herring). Glow is the real tell.
- Flash 0.5s

**Tier 4 (Stages 15-19): Pressure Reading**
- Weight mechanic: all panels develop stress cracks over 3s. But safe panel's stress cracks are SYMMETRICAL (radiating from center), fakes crack ASYMMETRICALLY (random directions)
- Player must read crack PATTERNS, not just presence
- Inner glow still present but dimmer

**Tier 5 (Stages 20+): Pattern Persistence**
- Fake panels briefly mimic safe panel's glow (shifting), but the mimicry flickers — it's not steady
- Safe panel's glow is CONSTANT and smooth
- Observant players spot the flicker vs steady distinction
- Flash 0.2s, but the steady-vs-flicker tell is always readable

**Key Design Principle**: Each tier introduces a NEW type of cue, not just "harder to see" versions of the same cue. This creates a LEARNING CURVE, not a LUCK CURVE. Players who master crack reading, glow detection, symmetry analysis, and flicker spotting can consistently identify safe panels even at high stages.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Clean, minimalist, high-contrast. Glass panels are the star — everything else is muted. Night-time industrial aesthetic with dramatic lighting. Think Squid Game bridge scene: dark void below, spotlight on panels.

**Aesthetic Keywords**: Transparent, sharp, tense, clinical, dramatic

**Reference Palette**: Dark backgrounds with glowing glass panels. High contrast between safe (cool blue-white) and dangerous (warm amber warning).

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Safe Glass | Ice Blue | #E8F0FE | Safe panel base tint |
| Safe Glow | Soft Cyan | #80D8FF | Inner glow on safe panels |
| Fake Glass | Warm Amber | #FFF8E1 | Fake panel base tint (subtle) |
| Crack Lines | Dark Gray | #455A64 | Fracture lines on panels |
| Background | Deep Navy | #0D1B2A | Bridge void / background |
| Bridge Frame | Steel Gray | #37474F | Bridge structure |
| Danger | Bright Red | #FF1744 | Wrong choice flash, life lost |
| Reward | Gold | #FFD600 | Score popups, milestones |
| UI Text | White | #FFFFFF | Score, stage, labels |
| Timer Bar | Orange-Red | #FF6D00 | Standing timer countdown |
| UI Overlay | Dark Semi | #000000CC | Menu/gameover overlay background |

### 4.3 SVG Specifications

**Player Character** (simple stick figure on bridge):
```svg
<svg viewBox="0 0 30 50" xmlns="http://www.w3.org/2000/svg">
  <!-- Head -->
  <circle cx="15" cy="8" r="6" fill="#ECEFF1" stroke="#37474F" stroke-width="1.5"/>
  <!-- Body -->
  <line x1="15" y1="14" x2="15" y2="32" stroke="#ECEFF1" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Arms -->
  <line x1="15" y1="20" x2="6" y2="26" stroke="#ECEFF1" stroke-width="2" stroke-linecap="round"/>
  <line x1="15" y1="20" x2="24" y2="26" stroke="#ECEFF1" stroke-width="2" stroke-linecap="round"/>
  <!-- Legs -->
  <line x1="15" y1="32" x2="8" y2="45" stroke="#ECEFF1" stroke-width="2" stroke-linecap="round"/>
  <line x1="15" y1="32" x2="22" y2="45" stroke="#ECEFF1" stroke-width="2" stroke-linecap="round"/>
</svg>
```

**Glass Panel (Safe)**:
```svg
<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="safeGlow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#80D8FF" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#E8F0FE" stop-opacity="0.1"/>
    </radialGradient>
  </defs>
  <rect x="2" y="2" width="116" height="76" rx="4" fill="#E8F0FE" fill-opacity="0.6" stroke="#B0BEC5" stroke-width="2"/>
  <rect x="8" y="8" width="104" height="64" rx="2" fill="url(#safeGlow)"/>
  <!-- Subtle reflection line -->
  <line x1="15" y1="15" x2="50" y2="12" stroke="#FFFFFF" stroke-opacity="0.4" stroke-width="1"/>
</svg>
```

**Glass Panel (Fake — with cracks)**:
```svg
<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="116" height="76" rx="4" fill="#FFF8E1" fill-opacity="0.5" stroke="#B0BEC5" stroke-width="2"/>
  <!-- Crack lines (generated procedurally - example) -->
  <line x1="30" y1="10" x2="55" y2="40" stroke="#455A64" stroke-width="1" stroke-opacity="0.6"/>
  <line x1="55" y1="40" x2="45" y2="55" stroke="#455A64" stroke-width="0.8" stroke-opacity="0.5"/>
  <line x1="55" y1="40" x2="75" y2="50" stroke="#455A64" stroke-width="0.8" stroke-opacity="0.5"/>
  <line x1="80" y1="20" x2="70" y2="45" stroke="#455A64" stroke-width="1" stroke-opacity="0.6"/>
  <line x1="70" y1="45" x2="90" y2="65" stroke="#455A64" stroke-width="0.7" stroke-opacity="0.4"/>
</svg>
```

**Shatter Particle** (generated in code, multiple small triangular shards):
```svg
<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
  <polygon points="0,6 6,0 12,8" fill="#E8F0FE" fill-opacity="0.8" stroke="#B0BEC5" stroke-width="0.5"/>
</svg>
```

**Heart (Life Icon)**:
```svg
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FF1744"/>
</svg>
```

**Design Constraints**:
- All SVG elements use basic shapes (rect, circle, line, polygon)
- Maximum 10 path elements per SVG object
- Crack lines generated procedurally via code (random within constraints)
- Shatter particles: 15-25 small triangles with random rotation and velocity

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Panel flash | Row start | Safe panel glows white (#FFFFFF, alpha 0.8→0), duration = flash_duration |
| Correct step | Tap safe panel | Panel pulses cyan, scale 1.05x, player steps forward with bounce |
| Glass shatter | Tap wrong panel | Panel explodes into 20 triangular shards with physics. Screen shake 8px 300ms. Red flash 150ms. |
| Player fall | After shatter | Player drops downward with rotation, fades out over 400ms |
| Timer pulse | Timer < 2s | Timer bar pulses red, panels subtly vibrate (1px shake) |
| Weight cracks | Standing 3s (stage 15+) | Radial crack lines grow outward from center of current panel |
| Panel shift | Stage 20+ | Fake panels briefly glow (mimicking safe), then flicker and revert |
| Score popup | Correct step | "+100" floats up from panel, gold color, fades over 500ms |
| Streak fire | Streak 3+ | Small flame particles trail behind player character |
| Milestone | Every 5 rows | "STAGE X!" center screen, particles burst, text scales 2x→1x |

---

## 5. Audio Design

### 5.1 Sound Effects

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Correct step | Crisp glass "ting" — high-pitched, satisfying | <150ms | High |
| Wrong step (shatter) | Explosive glass breaking — crunch + scatter | <400ms | High |
| Player fall | Whoosh downward + distant impact | <600ms | High |
| Timer tick (last 2s) | Tense metronome tick, increasing tempo | <100ms each | Medium |
| Panel flash | Soft chime/sparkle | <200ms | Low |
| Streak milestone | Rising chime sequence (3-note) | <300ms | Medium |
| Game over | Low descending tone + glass crumble | <800ms | High |
| New high score | Triumphant 4-note jingle | <1.5s | High |
| Button press | Subtle click | <80ms | Low |
| Weight crack forming | Quiet stress creak | <300ms | Low |

### 5.2 Music Concept

**Background Music**: No persistent background music. The game relies on SILENCE and ambient tension. Quiet wind/atmosphere loop creates dread. Sound design carries the emotional weight — the satisfying "ting" of a safe step vs. the jarring shatter of a wrong one.

**Music State Machine**:
| Game State | Audio Behavior |
|-----------|---------------|
| Menu | Quiet ambient drone, mysterious |
| Gameplay (early) | Ambient wind, quiet. Heartbeat SFX every 2s. |
| Gameplay (stage 15+) | Heartbeat tempo increases. Subtle tension drone. |
| Timer critical (<2s) | Rapid ticking overlays everything |
| Game Over | Silence → somber tone |
| High Score | Brief celebratory sting |

**Audio Implementation**: Web Audio API (built into Phaser). No Howler.js needed — keep dependencies minimal.

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
              │        │           │  Timer  │
         ┌────┴────┐   │           │ Running │
         │  Help   │   │           └────┬────┘
         │How2Play │   │                │
         └─────────┘   │           ┌────┴────┐
                  ┌────┴────┐     │  Game   │
                  │Settings │     │  Over   │
                  │ Overlay │     │ Screen  │
                  └─────────┘     └────┬────┘
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
│ Score: 1250   Row 7    ♥♥♡     │  ← Top bar
├─────────────────────────────────┤
│         Streak: x5              │  ← Streak (appears on 3+)
│                                 │
│       [Player Character]        │
│       standing on bridge        │
│                                 │
│  ┌─────────┐   ┌─────────┐     │
│  │ Panel A │   │ Panel B │     │  ← Panels (tap targets)
│  │         │   │         │     │     Min 80x60px each
│  └─────────┘   └─────────┘     │
│                                 │
│  ████████████░░░░  [4.2s]      │  ← Standing timer bar
│                                 │
└─────────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left | Current score, animates on change | Every correct step |
| Row Number | Top-center | "Row X" with stage icon | Every new row |
| Lives | Top-right | Heart icons (filled red / empty gray) | On life change |
| Streak | Below top bar, center | "x5" streak counter, flames at 6+ | On correct step |
| Timer Bar | Below panels | Orange-red bar shrinking left to right | Continuous (60fps) |
| Timer Text | Right of bar | Seconds remaining "4.2s" | Continuous |

### 6.3 Menu Structure

**Main Menu**:
- Game title "GLASS WALK" in bold white, glass texture effect
- "PLAY" button (large, center, glass-styled with subtle glow)
- High Score display below play button
- "?" help icon (top-left)
- Sound toggle (top-right, speaker icon)

**Help / How to Play Screen** (overlay):
- Visual diagram: two panels side by side, one with crack lines labeled "FAKE", one clean labeled "SAFE"
- Arrow pointing to subtle cue differences
- "Read the glass. Spot the safe panel. Step carefully."
- "Quick decisions earn bonus points!"
- Timer bar illustration: "Don't stand too long!"
- Lives illustration: 3 hearts
- "Got it!" button to dismiss

**Game Over Screen**:
- Dark overlay with glass-shard border effect
- "GAME OVER" title
- Final Score (large, animated count-up)
- "Row X Reached"
- High Score indicator (if new record: "NEW BEST!" with particles)
- "Continue?" button (watch ad for +1 life) — once per game
- "Play Again" button
- "Menu" button

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after all lives lost | Every game over (player choice) | Always optional |
| Rewarded | Double final score | Game over screen | Always optional |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Life | Watch ad after game over | +1 life, resume same row | Once per game |
| Score Double | Watch ad on game over screen | 2x final score | Once per session |

### 7.3 Session Economy

Short sessions (30-60s) mean high game-over frequency = good ad impression rate. The "continue" rewarded ad is high-value because players are invested in their streak/progress.

**Session Flow with Monetization**:
```
[Play] → [Death x3] → [Game Over]
                           │
                    [Rewarded Ad: Continue with 1 life?]
                           │ Yes → [Resume + play more → eventual death → Game Over]
                           │ No  → [Game Over Screen]
                                        │
                                  [Interstitial (every 3rd)]
                                        │
                                  [Rewarded: Double Score?]
                                        │
                                  [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/glass-walk/
├── index.html              # Entry point, loads Phaser CDN + local scripts
├── css/
│   └── style.css           # Responsive layout, mobile-first
└── js/
    ├── config.js           # Colors, difficulty tables, SVG strings, cue parameters
    ├── stages.js           # Row generation, cue strength calc, safe panel selection
    ├── ads.js              # Ad hooks (placeholder), reward callbacks
    ├── effects.js          # Shatter particles, screen shake, score popups, juice
    ├── ui.js               # MenuScene, GameOverScene, HelpScene, HUD overlay
    ├── game.js             # GameScene: panel rendering, input, timer, lives, scoring
    └── main.js             # BootScene, Phaser config, scene registration (LOADS LAST)
```

**Script load order in index.html**: config → stages → ads → effects → ui → game → main

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- Color palette constants (COLORS object)
- Difficulty curve tables (DIFFICULTY object with stage ranges)
- SVG string constants for all game graphics (player, panels, hearts, shards)
- Cue system parameters per tier (crack counts, glow intensity, shift intervals)
- Score values and multiplier thresholds
- Timer durations, flash durations per stage
- Grade table for end-game rating

**stages.js** (max 300 lines):
- `generateRow(stageNumber)`: Returns { panelCount, safeIndex, cueStrength, flashDuration, weightTimer, shiftEnabled, shiftInterval }
- `getCueType(stageNumber)`: Returns which visual cue tier to use
- `getRestStageBonus(stageNumber)`: Returns bonus cue strength for rest rows (every 8th)
- Safe panel position anti-repeat logic (no 3+ consecutive same position)
- Solvability guarantee: cue_strength floor at 0.15

**game.js** (max 300 lines):
- GameScene class extending Phaser.Scene
- `create()`: Initialize bridge, player, first row, timer, input handlers
- `update()`: Timer countdown, weight mechanic, panel shifting animation
- `createRow()`: Generate panels with visual cues based on stage parameters
- `onPanelTap(index)`: Handle tap — check safe, trigger correct/shatter, update lives/score
- `applyCues(panel, isSafe, cueType, cueStrength)`: Render visual differences
- Panel flash at row start
- Standing timer management with visual countdown bar
- Life management, streak tracking
- Transition to game over on 0 lives

**effects.js** (max 300 lines):
- `shatterPanel(panel)`: Create 20 triangular shards with physics velocity, fade, rotate
- `screenShake(intensity, duration)`: Camera shake effect
- `redFlash(duration)`: Red overlay flash on wrong choice
- `scorePopup(x, y, text)`: Floating "+100" text animation
- `playerFall()`: Player drops with rotation animation
- `playerStep()`: Player hops forward to next row
- `streakFire(player)`: Flame trail particles at streak 3+
- `milestoneText(stage)`: "STAGE X!" center burst
- `timerPulse()`: Timer bar pulsing when critical

**ui.js** (max 300 lines):
- MenuScene: Title, play button, high score, help icon, sound toggle
- GameOverScene: Score display, row reached, new high score, continue/retry/menu buttons
- HelpScene: Visual instructions with panel diagrams
- HUD overlay: Score, row, lives, streak display (as Phaser UI scene running parallel)
- Settings: Sound on/off toggle

**ads.js** (max 300 lines):
- Placeholder ad hooks (no real SDK for POC)
- `showInterstitial()`: Mock interstitial with callback
- `showRewarded(onReward)`: Mock rewarded with callback
- Ad frequency tracking (every 3rd game over for interstitial)
- Continue-once-per-game flag

**main.js** (max 300 lines):
- BootScene: Register ALL SVG textures via `textures.addBase64()` once
- Generate panel textures procedurally (safe variants, fake variants, shards)
- Phaser.Game config: AUTO renderer, responsive scaling, scene array
- Scene registration: [BootScene, MenuScene, HelpScene, GameScene, UIScene, GameOverScene]
- LocalStorage read/write helpers for high score, settings
- Orientation change handler

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No additional dependencies. Audio via Phaser's built-in Web Audio.

---

## 9. Juice Specification

### 9.1 Player Input Feedback (every panel tap)

| Effect | Target | Values |
|--------|--------|--------|
| Scale punch | Tapped panel | Scale: 0.95x (press down), Recovery: 80ms |
| Haptic | Device | navigator.vibrate(30) on tap |
| Sound | — | Soft glass "tap" sound on any panel touch |

### 9.2 Correct Step Feedback (core positive action)

| Effect | Values |
|--------|--------|
| Panel glow pulse | Cyan (#80D8FF) glow expands outward, alpha 0.8→0, 300ms |
| Player hop | Player sprite jumps 20px up, lands on next row with squash (scaleY 0.8→1.0, 100ms) |
| Score popup | "+100" (or "+150" with speed bonus) floats up 60px, gold (#FFD600), fades 500ms |
| Streak text | "x3!" / "x6!" appears center, scales 1.5x→1.0x, 200ms |
| Sound | Glass "ting" — pitch increases +5% per streak level |
| Camera | Slight upward pan to reveal next row (200ms ease) |
| Combo escalation | At streak 6+: screen edge subtle cyan glow. At streak 10+: panels have faint particle aura |

### 9.3 Death/Failure Effects (wrong panel — THE MONEY MOMENT)

| Effect | Values |
|--------|--------|
| Glass shatter | 20 triangular shards explode outward, random velocity 100-300px/s, rotate 180-720deg, fade over 600ms |
| Screen shake | Intensity: 10px, Duration: 300ms, Decay: exponential |
| Red flash | Full-screen red overlay alpha 0→0.4→0, Duration: 150ms |
| Player fall | Drop 200px downward, rotate 90deg, alpha 1→0 over 400ms |
| Sound | Glass shatter crash (layered: initial crack + scatter + distant impact) |
| Haptic | navigator.vibrate([50, 30, 100]) — burst pattern |
| Slow motion | Time scale 0.3x for 200ms during initial shatter, then normal |
| Heart loss | Heart icon in HUD: scale 1.5x → explode into 5 small particles, empty heart remains |
| Effect → UI delay | 800ms after shatter before "row reset" or "game over" appears |
| Death → restart | **1.5 seconds** from shatter to playable (new row attempt) |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+100", Color: #FFD600, Movement: up 60px, Fade: 500ms |
| Score HUD punch | Scale 1.3x, Recovery: 150ms, Color flash white→gold |
| Speed bonus text | "+50 QUICK!" in smaller font, appears below main score popup |
| Milestone text | "STAGE 10!" font size 48→32px, particles burst (15 gold circles), 800ms |
| High score flash | "NEW BEST!" rainbow color cycle, persists 2s, particles |

### 9.5 Timer Tension Effects

| Effect | Values |
|--------|--------|
| Timer bar color | Green (#66BB6A) → Yellow (#FFC107) at 3s → Red (#FF1744) at 2s |
| Timer pulse | At <2s: bar pulses scale 1.0→1.05 at 2Hz |
| Panel vibrate | At <2s: panels shake 1px randomly at 10Hz |
| Heartbeat SFX | At <3s: "thump-thump" at increasing tempo |
| Weight cracks | At stage 15+: radial lines grow from panel center, 1 line per 0.5s |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | Performance.timing API |
| Memory Usage | <80MB | Chrome DevTools Memory panel |
| JS Bundle Size | <200KB total (excl. CDN) | File size check |
| First Interaction | <1 second after load | Time to first meaningful paint |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser pointer events (handles touch + mouse)
- **Prevent Default**: No pull-to-refresh, no pinch-zoom, no double-tap-zoom
- **Orientation**: Portrait lock via CSS. On landscape, show "Please rotate" overlay.
- **Safe Areas**: Account for notch with `env(safe-area-inset-top)`
- **Panel Touch Targets**: Minimum 80x60px per panel (well above 44x44 minimum)
- **Background Pause**: `visibilitychange` event → pause game, pause timer

### 10.3 Touch Controls

- **Touch Target Size**: Panels minimum 80x60px. Buttons minimum 48x48px.
- **No Multi-touch**: Single tap only. Ignore simultaneous touches.
- **Input Lock**: After tapping a panel, disable input until animation completes (prevent double-tap on same row)
- **Feedback**: Visual scale + haptic on every touch

### 10.4 Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome (Android) | 80+ | Primary target |
| Safari (iOS) | 14+ | Test Web Audio autoplay |
| Samsung Internet | 14+ | Test touch events |
| Firefox (Android) | 90+ | Secondary |

### 10.5 Local Storage Schema

```json
{
  "glass-walk_high_score": 0,
  "glass-walk_high_row": 0,
  "glass-walk_games_played": 0,
  "glass-walk_settings": {
    "sound": true,
    "vibration": true
  },
  "glass-walk_total_score": 0,
  "glass-walk_ad_continue_used": false
}
```

### 10.6 Critical Implementation Warnings

1. **Texture registration**: ALL SVG textures in BootScene via `addBase64()` ONCE. Never re-register on scene restart.
2. **Script load order**: main.js MUST load LAST in index.html.
3. **No timeScale=0**: Use `setTimeout()` for hit-stop, not Phaser timeScale.
4. **Panel generation**: Crack lines generated procedurally in code (random line endpoints within panel bounds), not hardcoded SVG.
5. **Input locking**: Disable panel tap during animations to prevent race conditions.
6. **Timer management**: Use `this.time.addEvent()` for standing timer, but clear on panel tap to prevent ghost timers.
7. **Orientation handler**: Listen for resize event, reposition all UI elements dynamically.
8. **Death restart**: Shatter animation (800ms) + brief pause (200ms) + new row fade-in (500ms) = 1.5s total. MUST be under 2 seconds.
