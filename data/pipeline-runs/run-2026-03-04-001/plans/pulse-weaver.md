# Game Design Document: Pulse Weaver

**Slug**: `pulse-weaver`
**One-Liner**: Draw shockwave paths through a living ecosystem where every ripple transforms what it touches.
**Core Mechanic**: Drag-to-draw shockwave path with sequential transformation
**Target Session Length**: 1-3 min
**Date Created**: 2026-03-04
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Pulse Weaver is a touch-based mobile puzzle game where players draw a shockwave path across an organic, cell-like stage. The player drags a finger to trace a glowing line, and as the pulse travels along that path, every element it touches transforms based on the order of contact. A fire block hit before a water block creates steam that reveals hidden bridges; hitting a water block first extinguishes fire entirely and blocks the path. The transformation order is the puzzle.

The game distinguishes itself through tactile immediacy: the act of drawing is satisfying regardless of outcome, and the bioluminescent trail gives every attempt a visual payoff. Players who fail still see a beautiful cascade of elemental reactions. Success emerges from understanding the grammar of the ecosystem — the rules of which elements transform into what — and then drawing paths that exploit that grammar.

The world framing is that of a bioluminescent deep-ocean ecosystem. The player is a "Weaver" — a mysterious force that can send pulses through the living cells of the world. The narrative is light but present: each element type has a living personality (fire cells are aggressive and expand, water cells are passive and flow), and the player is learning to speak the language of the ecosystem.

### 1.2 Target Audience

**Primary**: Casual-to-midcore mobile puzzle gamers, ages 18–35, who enjoy games like Monument Valley, Cut the Rope, or Alto's Odyssey. They play during commutes, waiting rooms, or short breaks of 2–5 minutes.

**Secondary**: Puzzle enthusiasts who appreciate emergent mechanics and systems thinking. They will push into later stages seeking to discover all elemental combo recipes.

**Skill Expectation**: Minimal onboarding friction. New players should complete Stage 1 without reading any instructions. Advanced players should still be challenged at Stage 30+.

**Play Context**: One-handed, portrait orientation, seated or standing, in environments with or without audio.

### 1.3 Core Fantasy

The player is an invisible force of nature — a god-like intelligence that can perceive and reshape a living world with a single gesture. The fantasy is one of elegant efficiency: drawing the perfect path that triggers a cascade of transformations resulting in complete stage clearance. The "aha" moment — when a 3-element combo fires and the stage dissolves in a harmonic chord — is the emotional peak the game is designed to deliver repeatedly.

Secondary fantasy: discovery and collection. The Combo Recipe Book fills as players discover new combinations, creating a satisfying completionist arc alongside the core puzzle loop.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 3–5 minutes |
| Day 1 Retention | 40%+ |
| Day 7 Retention | 20%+ |
| Average Stages per Session | 5–10 |
| Crash Rate | <1% |
| Combo Discovery Rate (Stage 1–10) | 80%+ players discover at least 1 combo |
| Recipe Book Fill Rate (Day 7) | 30%+ players unlock 5+ recipes |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Stage Load] → [Observe Stage Layout] → [Plan Path] → [Draw Pulse Path]
      ↑                                                        │
      │                                              [Pulse Travels Path]
      │                                                        │
      │                                         [Elements Transform Sequentially]
      │                                                        │
      │                                    [Cascade Reactions (combos trigger)]
      │                                                        │
      │                          ┌─────── [All Targets Hit?] ──────────┐
      │                          │ YES                                  │ NO
      │                    [Stage Complete]                     [Pulse Ends / Fades]
      │                          │                                      │
      │                  [Score + Recipe Discovery]           [Analyze failure]
      │                          │                                      │
      └──── [Next Stage] ────────┘                     [Retry same stage]
```

**Moment-to-Moment Description**: The player sees a stage populated with organic cell-like elements scattered across the screen. They can tap an element to see its type label (fire, water, ice, etc.) and a small tooltip showing what it becomes when pulsed in different contexts. The player then drags a finger from any point on the screen to draw a glowing path. On finger-lift, the pulse launches from the start of the drawn path and travels the line at a fixed speed. Each element the pulse touches transforms, potentially triggering a secondary reaction that affects adjacent cells. The player watches to see if all required targets (marked with a soft pulsing ring) are cleared.

**Decision Layer**: The primary puzzle is path geometry — what order does the pulse hit elements? The secondary layer is path length — late-stage time-limited pulses fade if the path is too long, so players must find compact solutions that still hit elements in the correct order.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Draw Pulse Path | Press and drag | Player draws a freeform line starting anywhere on the game area. A glowing trail appears beneath the finger. Line is continuous. Minimum draw length: 50px. |
| Tap Element (info) | Single tap on element | Shows element type label and transformation hints overlay for 2 seconds. Does not consume an attempt. |
| Cancel Drawing | Lift finger before 50px | No pulse fires. Path disappears. |
| Launch Pulse | Lift finger (after 50px+ path) | Pulse travels drawn path from start to end at 200px/s. |
| Pause | Tap pause icon (top-right, 44x44px) | Opens pause overlay. |
| Dismiss Info | Tap anywhere else | Closes element info tooltip. |

**Control Philosophy**: The entire game is operated with one finger. Drawing is primary; everything else is secondary or automatic. The drawn path should feel like sketching — loose and expressive, not pixel-precise. Path smoothing is applied (Catmull-Rom spline) to transform a rough drag into a fluid line.

**Path Constraints**:
- Maximum path length: 800px (increased by upgrades in later meta-systems)
- Minimum segment angle change: paths can cross themselves (creates loops that pulse passes through twice)
- Path is sampled at 10px intervals for element collision detection

**Touch Area Map**:
```
┌─────────────────────────────────────┐
│ [⚙] ← 44x44px    Stage 7    [❓] → │  ← 56px top bar
├─────────────────────────────────────┤
│                                     │
│                                     │
│           Game Play Area            │  ← 560px (portrait 360×680 total)
│    (organic elements scattered)     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  Score: 12450    Combos: ×3   🔴🔴  │  ← 64px bottom HUD
└─────────────────────────────────────┘
```

### 2.3 Scoring System

| Score Event | Base Points | Multiplier Condition |
|------------|-------------|---------------------|
| Element transformed | 100 | ×2 if part of a 2-element combo |
| 2-element combo triggered | 500 | ×1.5 per additional combo in same pulse |
| 3-element combo triggered | 1500 | ×2 if first time this combo discovered |
| All targets cleared | 1000 | ×(stage_number × 0.5), min ×1 |
| Speed bonus | 0–500 | Linear scale: 500pts if cleared in <3s, 0pts at >10s |
| No-retry bonus | 200 | If stage cleared on first attempt |
| Compact path bonus | 0–300 | 300pts if path ≤30% of max length, scales to 0 at 80% |

**Combo System**: When a pulse hits 2+ elements in rapid succession (within 500ms of each other on the path), a combo ring explodes at the midpoint. 3-element combos trigger a full-screen bioluminescent flash and harmonic chord. Combo multipliers stack within a single pulse: a pulse that triggers 3 separate 2-element combos gets ×1.5³ = ×3.375 multiplier on the base combo score.

**Recipe Discovery Bonus**: First time a specific combo is discovered, the score for that combo is tripled and a "New Recipe!" banner flies across the screen for 1500ms.

**High Score**: Tracked per-session as cumulative score. Stored in localStorage as `pulse-weaver_high_score`. Top score displayed on main menu and game over screen. No leaderboard (offline-first).

**Stage Mastery Stars**:
- 1 Star: Stage cleared (any attempt)
- 2 Stars: Stage cleared with no-retry + compact path bonus earned
- 3 Stars: Stage cleared on first attempt + speed bonus ≥200pts + all combos in stage discovered

### 2.4 Progression System

The player advances through numbered stages with no lives lost — failure just means retry the same stage. Stages never expire; the player can always go back to earn more stars.

**Element Unlock Cadence**:

| Stage Range | New Element | Total Element Types | Combo Recipes Available |
|------------|-------------|---------------------|------------------------|
| 1–5 | Fire, Water (tutorial) | 2 | 1 (fire+water = steam) |
| 6–10 | Ice introduced | 3 | 3 |
| 11–15 | Lightning introduced | 4 | 6 |
| 16–20 | Void introduced | 5 | 10 |
| 21–25 | Earth introduced | 6 | 15 |
| 26–30 | Wind introduced | 7 | 21 |
| 31–35 | Crystal introduced | 8 | 28 |
| 36+ | All 8 elements + moving targets | 8 | 28 + special |

**Moving Targets**: Starting at Stage 31, some elements move along fixed tracks. The player must draw a path that will intercept the element at the right position, requiring predictive drawing.

**Meta-Progression: Combo Recipe Book**: A persistent collection UI accessible from the main menu. Each discovered combo adds an illustrated recipe card. The Recipe Book has 28 slots (all possible 2+3 element combos). Progress persists across sessions. No gameplay advantage — purely cosmetic/completionist.

**Element Mastery**: Each element type tracks total transformations across all sessions. At 10, 50, 100, and 500 transformations, a mastery badge unlocks (displayed as a small pip on the element's icon in the Recipe Book). No gameplay effect, but displayed on results screen.

**Progression Milestones**:

| Stage Range | Mechanic Introduced | Difficulty Modifier |
|------------|---------------------|---------------------|
| 1–5 | Single-path, obvious solution | Tutorial — 0 retries expected |
| 6–10 | First combo opportunities | Low — 1–2 retries average |
| 11–20 | Cancellation elements (water cancels fire AND vice versa depending on order) | Medium — 3–5 retries |
| 21–35 | Time-limited pulses (fade after 4000ms of travel time) | Hard — 5–10 retries |
| 36–50 | Moving targets, 3-element required combos | Very Hard — precision required |
| 51+ | All mechanics + randomized element positions | Extreme — mastery test |

### 2.5 Lives and Failure

There are no lives. Failure is free — the player simply retries the stage. The fail state is the pulse ending without clearing all required targets. Failed attempts are tracked only for the no-retry bonus.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Pulse ends, not all targets cleared | Stage resets, retry prompt shown | Tap anywhere to retry instantly |
| Time-limited pulse fades (stage 21+) | Path disappears, stage resets | Auto-retry after 1000ms fade |
| Path drawn but no elements hit | Pulse fires harmlessly, stage resets | Tap anywhere to retry |

**Retry Counter**: Displayed subtly in bottom-left corner of gameplay. Shows current attempt number. Resets when stage completes.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Stages are pre-authored for Stages 1–50 (ensuring perfect puzzle design and combo discoverability). Stage 51+ are procedurally generated using the following algorithm.

**Generation Algorithm**:
```
Stage Generation Parameters (Stage N, N > 50):
- Seed: SHA256(N + "pulse-weaver-v1") % 2^32
- Grid: 6×8 virtual cells on a 360×560px canvas
  Each cell center: x = 30 + (col × 50), y = 70 + (row × 60)
  Elements placed with ±15px random jitter from cell center
- Element Count: 6 + floor((N-50) / 10), max 16
- Required Targets: floor(element_count × 0.6), min 4
- Element Distribution:
    All 8 element types eligible
    Weights: fire=20, water=20, ice=15, lightning=15, void=10, earth=10, wind=5, crystal=5
- Moving Targets: floor((N-50)/15) elements move, max 4 moving
- Time Limit: present if N > 65; duration = max(2500, 5000 - (N-65)*50) ms
- Solvability Check: BFS from each possible start point to verify ≥1 valid path exists
  that clears all required targets without triggering a cancellation chain
```

**Element Placement Rules**:
1. No two elements of opposite cancellation type placed adjacent (within 60px) in Stage 1–10
2. At least 1 valid combo opportunity guaranteed in every stage from Stage 6+
3. Required targets are never placed such that they can only be reached by passing through a cancellation element first (unless that is intentional puzzle design in hand-authored stages)

### 3.2 Difficulty Curve

```
Difficulty
    │
100 │                                           ──────────── (proc-gen plateau)
    │                                     ╱
 80 │                              ╱──────
    │                        ╱ ╲  (hard stages)
 60 │                  ╱──────
    │            ╱ ╲  (medium stages)
 40 │      ╱──────
    │  ╱ ╲ (tutorial bump)
 20 │╱
    │
  0 └────────────────────────────────────────────── Stage
    0    10    20    30    40    50   60   70+

The ╲ dips are every-5th "rest stage" — one obvious solution path.
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1–5 | Stage 6–15 | Stage 16–30 | Stage 31–50 | Stage 51+ |
|-----------|-----------|------------|-------------|-------------|-----------|
| Element Count | 4–6 | 6–8 | 8–10 | 10–14 | 14–16 |
| Required Targets | 2–3 | 3–5 | 5–7 | 7–10 | 10–12 |
| Pulse Speed | 200px/s | 200px/s | 200px/s | 200px/s | 200px/s |
| Path Length Limit | none | none | none | 600px | 400–600px |
| Time Limit | none | none | none | 4000ms | 2500–4000ms |
| Moving Elements | 0 | 0 | 0 | 1–2 | 2–4 |
| Cancellation Risk | none | low | medium | high | high |
| Required Combos | 0 | 0–1 | 1–2 | 2–3 | 2–4 |
| New Mechanic | Tutorial | Ice intro | Lightning+Void | Earth+Wind | Crystal+all |

**Rest Stages**: Every 5th stage (Stage 5, 10, 15...) is designed with one immediately obvious solution path. No new elements. Lower element count than surrounding stages. Visually, rest stages use a lighter background tint (#F8FBFF instead of #F0F4FF).

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: BFS validation runs after generation. If no valid path found in 100ms, regenerate with new seed (seed += 1). Max 10 retries before falling back to a hand-authored bonus stage.
2. **Variety Threshold**: Between consecutive procedural stages, at least 3 of the following must differ: element count, element type distribution, required target set, grid layout region (top/bottom/spread), presence of moving elements.
3. **Difficulty Monotonicity**: Rolling average over 5 stages must not decrease. Individual stage difficulty can vary ±15% for rest stage rhythm.
4. **Rest Stage Frequency**: Every 5th stage from Stage 5 onward.
5. **Special Stages**: Every 10th stage from Stage 10 onward is a "Symphony Stage" — all elements are the same type, and the player must use a single 3-element combo to clear the entire stage. Visual treatment: monochrome stage with single accent color.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Organic bioluminescence. Cell-like SVG shapes on a pale, softly-lit background. Elements are irregular blob shapes (not circles or squares). The shockwave pulse is a glowing filament, like a neural signal or deep-sea creature's lure. Colors bleed and blend at edges as elements transform — achieved via SVG filter blur transitions.

**Aesthetic Keywords**: Bioluminescent, Organic, Living, Fluid, Precise

**Reference Mood**: Deep-ocean ecosystem at night — dark-but-glowing, soft-edged, scientifically beautiful. Not cute, not aggressive. Quietly alien.

### 4.2 Color Palette

| Role | Color Name | Hex | Usage |
|------|------------|-----|-------|
| Background | Deep Pearl | #F0F4FF | Main game background — off-white with blue tint |
| Background Alt (rest stages) | Soft Sky | #F8FBFF | Rest stage background |
| Pulse Line | Bioluminescent White | #FFFFFF | Drawn path glow, inner color |
| Pulse Glow | Pulse Cyan | #7FFFD4 | Drawn path outer glow (blur filter) |
| Fire Element | Ember Orange | #FF6B35 | Fire cells, fill |
| Fire Element Shape | Flare | Triangle/star with 5 points | Colorblind differentiator |
| Fire Glow | Amber | #FFB347 | Fire cell outer glow |
| Water Element | Ocean Blue | #4FC3F7 | Water cells, fill |
| Water Element Shape | Wave | Smooth ellipse with wave indent | Colorblind differentiator |
| Water Glow | Aqua | #81D4FA | Water cell outer glow |
| Ice Element | Frost White | #E3F2FD | Ice cells, fill |
| Ice Element Shape | Crystal | Hexagonal blob | Colorblind differentiator |
| Ice Glow | Pale Blue | #B3E5FC | Ice cell outer glow |
| Lightning Element | Electric Yellow | #FFD600 | Lightning cells, fill |
| Lightning Shape | Bolt | Jagged irregular blob | Colorblind differentiator |
| Lightning Glow | Lemon | #FFF176 | Lightning cell outer glow |
| Void Element | Deep Violet | #4A148C | Void cells, fill |
| Void Shape | Void | Irregular circle with notch | Colorblind differentiator |
| Void Glow | Dark Purple | #7B1FA2 | Void cell outer glow |
| Earth Element | Terracotta | #795548 | Earth cells, fill |
| Earth Shape | Mound | Low wide blob | Colorblind differentiator |
| Earth Glow | Warm Brown | #A1887F | Earth cell outer glow |
| Wind Element | Pale Mint | #B2DFDB | Wind cells, fill |
| Wind Shape | Curl | Spiral-edge blob | Colorblind differentiator |
| Wind Glow | Seafoam | #80CBC4 | Wind cell outer glow |
| Crystal Element | Rose Quartz | #F8BBD0 | Crystal cells, fill |
| Crystal Shape | Shard | Elongated angular blob | Colorblind differentiator |
| Crystal Glow | Pink | #F48FB1 | Crystal cell outer glow |
| Required Target Ring | Signal White | #FFFFFF | Pulsing ring around targets |
| Required Target Ring Glow | Pulse Cyan | #7FFFD4 | Target ring outer glow |
| Transformation Burst | Element Color | (varies) | Burst particle color matches new element |
| Steam (combo result) | Steam Gray | #CFD8DC | Fire+Water combo transformation color |
| Plasma (combo result) | Electric Violet | #9C27B0 | Lightning+Fire combo transformation color |
| Blizzard (combo result) | Icy Cyan | #00BCD4 | Ice+Wind combo transformation color |
| UI Text | Charcoal | #263238 | Score, labels, menus |
| UI Background | Deep Navy | #1A237E | Menu background overlay |
| UI Accent | Pulse Cyan | #7FFFD4 | Buttons, interactive elements |
| Score Text | Warm White | #ECEFF1 | Score on dark backgrounds |
| Combo Badge | Gold | #FFD700 | Combo counter badge background |

### 4.3 SVG Specifications

All game graphics generated programmatically via Phaser 3's Graphics API and SVG-to-Canvas rendering. No external image assets.

**Element Cell Base Shape** (generated per element type using Perlin noise seed based on element ID):
```
// Blob shape algorithm — run once per element on stage load
// N = 8 points around circle, radius varies by ±20% using seeded noise
function generateBlobPath(cx, cy, baseRadius, seed) {
  // baseRadius: 28px for all elements
  // Output: SVG path string for Phaser Graphics
  const points = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const noise = seededRandom(seed + i) * 0.4 + 0.8; // 0.8–1.2 range
    const r = baseRadius * noise;
    points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  return cubicSplineThrough(points); // smooth closed path
}
```

**Element Type Shape Overlay** (rendered on top of blob, 16×16px, centered):
```
Fire:    5-pointed star, stroke #FF6B35, fill none, strokeWidth 2px
Water:   Sine wave ~20px wide, stroke #4FC3F7, fill none, strokeWidth 2px
Ice:     Hexagon outline, stroke #E3F2FD, fill none, strokeWidth 2px
Lightning: Zigzag bolt 12×18px, stroke #FFD600, fill none, strokeWidth 2px
Void:    Circle with 1/4 sector removed, stroke #4A148C, fill none, strokeWidth 2px
Earth:   Three horizontal lines, stroke #795548, fill none, strokeWidth 2px
Wind:    Spiral (1.5 turns), stroke #B2DFDB, fill none, strokeWidth 2px
Crystal: Diamond with vertical line, stroke #F8BBD0, fill none, strokeWidth 2px
```

**Required Target Indicator**:
```
// Pulsing ring around target elements
// Outer ring: 36px radius, stroke #FFFFFF, opacity 0.8, strokeWidth 2px
// Alpha animation: sin(time * 3) * 0.3 + 0.7, period ~2100ms
// Scale animation: sin(time * 3) * 0.1 + 1.0 (scale 0.9–1.1)
```

**Pulse Path Rendering**:
```
// As player drags:
// - Inner line: 2px, #FFFFFF, opacity 1.0
// - Outer glow: 8px, #7FFFD4, opacity 0.4 (Phaser blendMode ADD)
// - Path is sampled every 10px using Catmull-Rom spline smoothing
// - Fade-in: first 100ms of drawing, opacity ramps 0→1

// After finger lift (pulse traveling):
// - Pulse head: circle 10px radius, #FFFFFF, blur 4px
// - Pulse head glow: circle 20px radius, #7FFFD4, opacity 0.6, blendMode ADD
// - Tail fade: path segments behind pulse head fade out over 500ms
// - Pulse speed: 200px/s (moves along spline using arc-length parameterization)
```

**Transformation Effect** (when pulse hits element):
```
// Duration: 400ms total
// Phase 1 (0–150ms): Element scale 1.0 → 1.4, opacity 1.0 → 0.5
// Phase 2 (150–300ms): Element color lerps from old color to new color
// Phase 3 (300–400ms): Element scale 1.4 → 1.0, opacity 0.5 → 1.0
// Particle burst: 8 small circles (6px radius each), emit from element center
//   Initial velocity: random direction, speed 80–120px/s
//   Fade out over 500ms, color = new element color
```

**Combo Burst Effect**:
```
// 2-element combo:
//   Ring expand: 0px → 60px radius, opacity 1.0 → 0, duration 600ms
//   Color: combo result color (see palette)
//   Stroke 4px

// 3-element combo:
//   Full-screen radial flash: center burst 0→screen_width radius
//   Duration 800ms, opacity 0.7 → 0
//   Followed by: all elements briefly glow (200ms pulse)
//   Color: combo result color
//   Accompanied by harmonic chord (see Audio)
```

**Background Elements** (decorative, non-interactive):
```
// 8 ghost cells scattered in background, 50% opacity
// Sizes: 10–20px radius, color: #7FFFD4 with opacity 0.08
// Slow drift animation: each moves in a circle 20px radius, period 8–15s (varied)
// Do not interfere with game elements (z-index below all game objects)
```

**Design Constraints**:
- Maximum 8 path control points per blob shape
- Maximum 16 active elements on screen simultaneously
- Particle systems: maximum 64 active particles total at any time
- All animations via requestAnimationFrame delta-time, not fixed timing
- No SVG `animate` elements — all animation in JS update loop

### 4.4 Visual Effects

| Effect | Trigger | Implementation | Duration |
|--------|---------|----------------|----------|
| Element transform | Pulse hits element | Scale bounce + color lerp + 8 particles | 400ms |
| 2-element combo | Combo detected | Ring expand at midpoint | 600ms |
| 3-element combo | Combo detected | Full-screen radial flash + all-element glow | 800ms |
| Stage complete | All targets cleared | Cascade: all remaining elements burst outward + confetti-like dots | 1200ms |
| Pulse path fade | Path traveled | Tail segments alpha decay 1→0 over 500ms | 500ms |
| New Recipe | First discovery | Banner slides in from top, holds 1200ms, slides out | 1800ms total |
| Target ring pulse | Always on required targets | Sine wave scale/opacity animation | Continuous |
| Stage fail | Pulse ends, targets remain | Remaining targets briefly shake (CSS keyframe, ±3px, 3 cycles) | 400ms |

---

## 5. Audio Design

### 5.1 Sound Effects

All audio generated via Web Audio API (Tone.js via CDN, or fallback to raw AudioContext). No audio file assets.

| Event | Sound Description | Frequency Range | Duration | Priority |
|-------|------------------|-----------------|----------|----------|
| Draw start | Soft hiss, sine wave fade-in | 200–400 Hz | 100ms fade-in | High |
| Pulse travel (continuous) | Sine tone, frequency shifts with element proximity | 300–800 Hz | Duration of travel | High |
| Fire transform | Brassy buzz, harmonics at 3x and 5x fundamental | 150 Hz base | 300ms | High |
| Water transform | Fluid gurgle, frequency sweep down | 400→200 Hz | 350ms | High |
| Ice transform | High crystal ping, fast decay | 1200 Hz | 150ms | High |
| Lightning transform | Electric crackle (white noise burst + 800Hz sine) | 800 Hz + noise | 200ms | High |
| Void transform | Subharmonic rumble, -1 octave down | 80 Hz | 400ms | High |
| Earth transform | Deep thud, 80Hz + harmonics | 80 Hz | 250ms | Medium |
| Wind transform | Airy whoosh, high freq sweep | 600→1400 Hz | 300ms | Medium |
| Crystal transform | Bell tone, sine with quick decay | 1600 Hz | 200ms | Medium |
| 2-element combo | Ascending two-note chord (perfect fifth) | Varies by combo | 500ms | High |
| 3-element combo | Full harmonic chord (major triad) + reverb tail | Varies by combo | 1200ms | High |
| Stage complete | Ascending arpeggio, 4 notes, major key | 400–800–1200–1600 Hz | 1000ms | High |
| Stage fail | Descending tone, detuned | 400→200 Hz | 600ms | High |
| New Recipe discovered | Cheerful 3-note jingle | 600–800–1000 Hz | 800ms | Medium |
| Button tap | Short click, 1000 Hz sine, 50ms decay | 1000 Hz | 50ms | Low |
| Pause | Muffled thud (low-pass filter on all audio) | — | 100ms transition | Medium |

**Combo Chord Assignments** (each combo has a unique key/chord):
```
Fire + Water (Steam):    C Major (C4-E4-G4), bright and resolved
Fire + Lightning (Plasma): D# Major (D#4-G4-A#4), intense
Ice + Water (Blizzard):  A Minor (A3-C4-E4), cool and mysterious
Water + Wind (Mist):     G Major (G3-B3-D4), airy
Ice + Lightning (Surge): F# Major (F#4-A#4-C#5), electric tension
Void + Fire (Inferno):   C# Minor (C#4-E4-G#4), dramatic
Earth + Water (Mud):     F Major (F3-A3-C4), grounded
(3-element combos):      Full 4-note chord + reverb tail (unique per combination)
```

### 5.2 Music Concept

**Background Music**: Procedurally generated ambient underscore using Web Audio OscillatorNode. No looped audio files. The music is a slowly evolving pad sound using 3–4 oscillators detuned slightly, filtered with a low-pass filter whose cutoff responds to gameplay state.

**Music State Machine**:
| Game State | Music Behavior | Filter Cutoff |
|-----------|----------------|---------------|
| Menu | C Minor pad, slow LFO vibrato, soft | 800 Hz |
| Stage 1–10 | G Major pad, slightly brighter | 1200 Hz |
| Stage 11–25 | A Minor pad, moderate intensity | 1600 Hz |
| Stage 26–50 | E Minor pad, high intensity, faster LFO | 2400 Hz |
| Stage 51+ | D Minor pad, maximum intensity | 3200 Hz |
| Drawing pulse | Music volume reduces to 40%, pulse travel sound prominent | (state filter) |
| Combo triggered | Music ducks to 20% for 800ms, then returns | (state filter) |
| Stage complete | Music brightens (filter to 4000 Hz) for 1500ms, then transitions to next state | 4000 Hz |
| Game over | Music fades to 0 over 1000ms | → 0 |
| Pause | Music volume reduces to 20%, low-pass at 400 Hz (muffled) | 400 Hz |

**Audio Implementation**: Web Audio API via raw AudioContext. No external library required. All synthesis in `ads.js` audio section or dedicated `audio.js` if module count allows.

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌────────────────┐
│  Splash Screen  │ → 1500ms logo + title → auto-advance
└───────┬────────┘
        ↓
┌────────────────┐     ┌──────────────────┐
│  Main Menu     │────→│  Recipe Book      │ (slide-in from right)
│  - Play        │     │  (28 recipe cards)│
│  - Recipe Book │←────│                  │
│  - Settings    │     └──────────────────┘
│  - Stage Select│
└───────┬────────┘     ┌──────────────────┐
        │              │  Settings Overlay │
        │─────────────→│  Sound/Music/Vibe │
        │              └──────────────────┘
        ↓
┌────────────────┐
│  Stage Intro   │ → 800ms: stage number + element type icons shown → auto-dismiss
│  (brief flash) │
└───────┬────────┘
        ↓
┌────────────────┐     ┌──────────────────┐
│  Game Screen   │────→│  Pause Overlay   │
│  (active play) │←────│  Resume/Restart/ │
│                │     │  Settings/Quit   │
└───────┬────────┘     └──────────────────┘
        │
        ├─── [Stage Complete] ───→ ┌──────────────────┐
        │                          │  Results Screen  │
        │                          │  Score + Stars   │
        │                          │  New Recipe?     │
        │                          │  → Next Stage    │
        │                          │  → Menu          │
        │                          └──────────────────┘
        │
        └─── [Fail/Retry] ──────→ Instant retry (no screen, just stage reset)
```

**Stage Select**: Grid of stage buttons (5 per row), showing star count (0–3). Locked stages shown as dim circles. Accessible from main menu after Stage 1 complete.

### 6.2 HUD Layout

```
┌─────────────────────────────────────────┐  360px wide
│ [❚❚] 44×44    Stage 7    Score: 12,450  │  ← 56px top bar, bg: rgba(26,35,126,0.85)
├─────────────────────────────────────────┤
│                                         │
│     [ghost bg elements drift slowly]    │
│                                         │
│  ◯fire  ⬡ice  ◯water  ◯lightning       │  ← Elements scattered, 56px diameter each
│                                         │
│     ◯void    ◯fire(target*)            │
│                                         │
│  ◯water(target*)   ◯ice               │
│                                         │
│           [drawn pulse path]            │
│                                         │
├─────────────────────────────────────────┤
│  Attempt: 1        Combos: ×0    🔴🔴  │  ← 56px bottom bar, bg: rgba(26,35,126,0.85)
└─────────────────────────────────────────┘
  *target = pulsing ring indicator
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Pause button | Top-left, 44×44px | ❚❚ icon, tap to pause | Static |
| Stage indicator | Top-center | "Stage 7" text, 16px, #ECEFF1 | On stage transition |
| Score | Top-right, 12px padding | "12,450" text, 18px bold, #ECEFF1 | On every score event (animated count-up) |
| Attempt counter | Bottom-left | "Attempt: 3" text, 12px, #90A4AE | On each retry |
| Combo badge | Bottom-center | "Combo ×3" badge, hidden unless active | Fades in on combo, 2000ms hold, fade out |
| Pulse indicator | Bottom-right | Two red circles = 2 retries threshold for hint | On 3rd retry, subtle hint icon appears |

**Info Tooltip** (on element tap):
```
Appears as rounded rect 120×60px, centered above tapped element
Background: rgba(26,35,126,0.9), border-radius: 8px
Line 1: Element type name, 14px bold, element color
Line 2: "Transforms to: [type] alone" 12px, #B0BEC5
Line 3: "Combos: [icons of combinable types]" if applicable
Auto-dismiss after 2000ms or on any drag start
```

**Hint System** (after 5 failed attempts on same stage):
```
A semi-transparent arrow appears over the correct path start region
Arrow is 40px, color #7FFFD4, opacity 0.6
Tapping the hint area shows a 1-second "ghost pulse" replay of an optimal solution
Hint resets if player clears the stage
Hint is always available via the "?" button (top-right, 44×44px)
```

### 6.3 Menu Structure

**Main Menu** (full screen, deep navy gradient: #1A237E → #283593):
- Title: "PULSE WEAVER" — 32px, letter-spacing 4px, color #7FFFD4, centered at y=120
- Subtitle: "Draw. Transform. Cascade." — 14px, #B0BEC5, centered at y=160
- Play Button: 240×56px, bg #7FFFD4, text "PLAY" 20px bold #1A237E, centered at y=280, rounded 28px
- Recipe Book Button: 160×44px, bg transparent, border 2px #7FFFD4, text "Recipes" 16px #7FFFD4, centered at y=360
- Stage Select Button: 160×44px, same style as Recipe Book, centered at y=420 (visible after Stage 1 complete)
- Settings icon: gear icon 32×32px, top-right 16px margin, color #90A4AE
- Background: 3 slow-drifting ghost elements for visual life

**Pause Menu** (overlay, bg rgba(0,0,0,0.7), centered panel 280×240px, bg #1A237E, rounded 16px):
- "PAUSED" label, 20px bold, #ECEFF1, top of panel
- Resume: 220×48px button, #7FFFD4, "RESUME" 16px #1A237E
- Restart: 220×48px button, transparent, border #7FFFD4, "RESTART" 16px #7FFFD4
- Settings: 220×48px button, same as Restart, "SETTINGS"
- Menu: 220×48px button, same as Restart, "QUIT TO MENU"

**Results Screen** (slide-up from bottom, panel 360×480px):
- "STAGE COMPLETE" / "STAGE [N]" title
- Star display: 3 stars (filled gold #FFD700 / unfilled #37474F), 48px each
- Score display: large animated count-up to final score, 36px bold
- "NEW RECIPE!" banner (conditional, slides in if discovery)
- Combo count: "Combos found: X/Y this stage"
- Next Stage button: prominent, 240×56px, #7FFFD4
- Menu button: secondary, transparent

**Settings Screen** (overlay, same panel style as Pause):
- Sound FX: toggle switch, label 14px #ECEFF1
- Music: toggle switch
- Vibration: toggle switch
- Done: close button, 44×44px

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After Game Over (quit to menu) | Every 3rd quit-to-menu | After 5 seconds |
| Interstitial | Stage 10, 20, 30... (every 10th stage complete) | Each milestone, max 1/session | After 5 seconds |
| Rewarded | "Watch ad to see optimal path" (hint upgrade) | Any time after 5 failed attempts | Always optional |
| Rewarded | "Watch ad to unlock Recipe hint" | Once per undiscovered recipe | Always optional |
| Banner | Main menu and Results screen only | Always while on those screens | N/A |

**Ad-Free Zones**: No ads during active gameplay, during Stage Intro flash, or during Stage Complete animation.

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Hint path reveal | Watch rewarded ad | Full ghost-pulse replay of optimal path | Once per stage |
| Recipe unlock hint | Watch rewarded ad | Shows 2 of 3 elements in an undiscovered combo | Once per undiscovered recipe |
| Score multiplier | Watch rewarded ad at Results screen | 1.5× session score | Once per session |

### 7.3 Session Economy

The game is free with ad revenue. No in-app purchases. The session economy prioritizes zero friction for core gameplay — failure is free, retries are instant, and no artificial gates exist.

**Monetization philosophy**: Players are never blocked. Ads are presented as optional enhancements (hints, score boost). The rewarded ad for "hint path" has genuine value and does not feel punitive.

**Session Flow with Monetization**:
```
[Play Free] → [Draw Pulse] → [Stage Complete/Fail]
                                    │
                      [Stage Complete] → [Results Screen]
                                         ├ [Rewarded: ×1.5 Score?] (optional)
                                         └ [Next Stage or Menu]
                                                    │
                                          [Every 10th stage: Interstitial]

[Fail 5× same stage] → [Hint icon appears]
                              │
                      [Optional: Watch ad → Ghost path shown]
                              │
                      [Continue playing freely]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/pulse-weaver/
├── index.html              # Entry point, CDN imports, canvas mount
├── css/
│   └── style.css           # Mobile-first responsive layout, touch prevention
└── js/
    ├── config.js           # Constants, palettes, element definitions, difficulty tables
    ├── main.js             # Phaser init, scene registration, localStorage, state
    ├── game.js             # GameScene: draw input, pulse, transformations, combos
    ├── stages.js           # Stage data (1-50 hand-authored), proc-gen (51+), solvability
    ├── ui.js               # MenuScene, ResultsScene, PauseOverlay, HUD, RecipeBook
    └── ads.js              # Ad hooks, reward callbacks, audio synthesis (Web Audio)
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
```javascript
// GAME_WIDTH = 360, GAME_HEIGHT = 680
// TOP_BAR_HEIGHT = 56, BOTTOM_BAR_HEIGHT = 56
// PLAY_AREA: y=56 to y=624 (568px tall)
// PULSE_SPEED = 200 // px per second
// MAX_PATH_LENGTH = 800 // px, default
// TIME_LIMITED_PATH_LENGTH = 400–600 // by stage range
// ELEMENT_RADIUS = 28 // base blob radius px
// ELEMENT_TYPES: array of {id, name, color, glowColor, shapeType, audioFreq}
// COMBO_RECIPES: array of {elements: [id, id], result: {name, color, chord}}
// DIFFICULTY_TABLE: array of {stageRange, elementCount, targetCount, pathLimit, timeLimit, movingCount}
// SCORE_VALUES: {transform, combo2, combo3, stageComplete, speedBonus, noRetry, compactPath}
// REST_STAGE_INTERVAL = 5
// SPECIAL_STAGE_INTERVAL = 10
// HINT_TRIGGER_ATTEMPTS = 5
```

**main.js** (max 300 lines):
```javascript
// Phaser.Game config: type AUTO, width 360, height 680, backgroundColor #F0F4FF
// Scene list: SplashScene, MenuScene, GameScene, ResultsScene
// Global state object: { currentStage, highScore, gamesPlayed, settings,
//   recipesDiscovered: Set, elementMastery: {[elementId]: count},
//   sessionScore, sessionStartTime }
// localStorage key: 'pulse-weaver-state' (JSON serialized global state)
// loadState() / saveState() functions
// Orientation: CSS locks portrait; JS warns if landscape
```

**game.js** (max 300 lines):
```javascript
// GameScene extends Phaser.Scene
// create():
//   - Load stage from stages.js (getStage(stageNumber))
//   - Render elements as Phaser Graphics blobs + shape overlays
//   - Render target rings with animate loop
//   - Setup pointer input: pointerdown → startDraw, pointermove → extendDraw, pointerup → launchPulse
//   - Path smoothing: sample every 10px, apply Catmull-Rom spline
//   - HUD: top bar, bottom bar via ui.js HUD overlay
// update():
//   - Advance pulse head along spline path (arc-length parameterization)
//   - Collision: check pulse head proximity (≤32px) to each element
//   - On collision: triggerTransform(element, pulseContext)
//     pulseContext tracks last 3 transformed elements for combo detection
//   - Combo check: after transform, check if (prev, current) in COMBO_RECIPES
//   - Stage complete check: all required targets cleared?
//   - Pulse end: if pulse head reaches path end → check completion → reset or complete
// triggerTransform(element, context):
//   - Animate element (scale bounce, color lerp, particles)
//   - Update element type in state
//   - Check combo with context.lastTransformed
//   - Add to context.lastTransformed (keep last 3)
//   - Fire audio event
// launchPulse(path):
//   - Validate path length ≥50px
//   - If time-limited stage: set pulse TTL = timeLimit (ms)
//   - Begin pulse animation
```

**stages.js** (max 300 lines):
```javascript
// HAND_AUTHORED_STAGES: array of 50 stage objects
//   Each: { id, elements: [{id, type, x, y, isTarget, moveTrack?}], requiredTargetIds, hint? }
// getStage(n): returns hand-authored if n≤50, else generateStage(n)
// generateStage(n):
//   - Seed from n
//   - Place elements on 6×8 grid with jitter
//   - Select required targets (60% of elements)
//   - Validate solvability (BFS, max 10 retries with seed++)
//   - Apply moving element logic if n>30
//   - Return stage object
// validateSolvability(stage):
//   - BFS: try all possible start points (16x8 grid of draw starts)
//   - For each: simulate pulse traveling straight lines through all elements
//   - Return true if any start → end path clears all required targets
// isRestStage(n): return n % REST_STAGE_INTERVAL === 0
// isSpecialStage(n): return n % SPECIAL_STAGE_INTERVAL === 0 && n > 0
```

**ui.js** (max 300 lines):
```javascript
// SplashScene: Phaser.Scene, 1500ms logo display, then start MenuScene
// MenuScene: full-screen menu, buttons via Phaser GameObjects.Text + interactive
// ResultsScene: slide-up panel, star calculation, score display, recipe announcement
// HUD class (not a Scene, managed by GameScene):
//   - createHUD(scene): create top/bottom bar graphics and text objects
//   - updateScore(score): animate score count-up using Phaser tweens
//   - updateCombo(multiplier): show/hide combo badge
//   - showHint(): show hint arrow indicator
// RecipeBookScene: grid of 28 recipe cards, slide-in from right
// PauseOverlay: overlay rendered on top of GameScene, semi-transparent
```

**ads.js** (max 300 lines):
```javascript
// Ad SDK placeholders (replace with AdMob/IronSource SDK calls in production)
// InterstitialAd: { trigger(context), onClosed(), cooldown tracking }
// RewardedAd: { showForHint(callback), showForRecipe(callback), showForScore(callback) }
// AudioEngine (housed here if no separate audio.js needed):
//   - init(): create AudioContext, master gain node
//   - playTransform(elementType): synthesize transform sound
//   - playCombo(chordNotes): synthesize combo chord
//   - playMusic(gameState): update ambient pad oscillators
//   - crossfadeMusic(fromState, toState, duration)
// Ad timing: interstitialCount tracked in localStorage, rewarded per-session
```

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | 3.80.1 | `https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js` | Game engine, rendering, input |

**No additional CDN libraries required.** Audio via native Web Audio API. No Howler.js or Tone.js — raw AudioContext provides sufficient control and avoids additional load.

**index.html script order**:
```html
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
<script src="js/config.js"></script>
<script src="js/stages.js"></script>
<script src="js/ads.js"></script>
<script src="js/ui.js"></script>
<script src="js/game.js"></script>
<script src="js/main.js"></script>
```

---

## 9. Implementation Notes

### 9.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter (dev mode) |
| Load Time | <2 seconds on 4G | Performance.timing — no heavy assets to load |
| Memory Usage | <60MB | Chrome DevTools — SVG-free approach limits memory |
| JS Bundle Size | <150KB total (excl. Phaser CDN) | File size sum of all local JS |
| First Interaction | <500ms after load | Time from page load to first touchstart response |
| Particle Count | <64 simultaneous | Enforced in particle system cap |

### 9.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Canvas Scaling**: Phaser ScaleManager mode FIXED, centered in viewport. 360×680 fixed canvas.
- **Touch Prevention**: `document.addEventListener('touchmove', e => e.preventDefault(), { passive: false })` on canvas
- **Orientation**: CSS `@media (orientation: landscape)` shows "rotate device" overlay
- **Background Pause**: `document.addEventListener('visibilitychange')` — pauses game, suspends AudioContext, stops RAF
- **Safe Areas**: canvas wrapper uses `padding: env(safe-area-inset-top) env(safe-area-inset-right)...`
- **Rendering**: Phaser AUTO type (WebGL preferred, Canvas fallback). Blob shapes use Graphics API (GPU-accelerated in WebGL)

### 9.3 Touch Controls

- **Touch Target Size**: All interactive elements minimum 44×44px (Apple HIG)
- **Draw Gesture**: pointerdown on canvas → begin path recording. pointermove → append point if distance from last point ≥5px. pointerup → launch pulse
- **Path Smoothing**: Catmull-Rom spline applied to sampled points. Tension = 0.5. Re-evaluated every frame during travel.
- **Multi-touch**: Only track first pointer (index 0). Additional touches ignored during draw.
- **Tap vs Draw**: If pointerup fires with total path length <50px → treated as tap (info tooltip), not draw.
- **Accidental Cancel Prevention**: If pointer leaves canvas bounds during draw, continue tracking as if still on canvas (no cancel on exit).
- **Haptic Feedback**: `navigator.vibrate(20)` on: pulse launch, combo trigger (50ms), stage complete (100ms pattern: [50,30,50]). Gated by settings.vibration.

### 9.4 Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome (Android) | 80+ | Primary target. Web Audio + WebGL fully supported. |
| Safari (iOS) | 14+ | AudioContext must be resumed on first touch interaction. `playAudio()` only callable inside touch handler. |
| Samsung Internet | 14+ | Test pointer events — some versions require `touch-action: none` on canvas. |
| Firefox (Android) | 90+ | Secondary target. Verify Phaser WebGL renderer on older devices. |

**iOS Audio Fix**:
```javascript
// In main.js, on first pointerdown:
if (audioContext.state === 'suspended') {
  audioContext.resume();
}
```

### 9.5 Combo System Implementation

**Element Transformation Grammar** (complete table for developers):

| Pulse Sequence | Result | Notes |
|---------------|--------|-------|
| Fire alone | Converted to Ember (dormant fire, non-target) | |
| Water alone | Converted to Mist (evaporates, removes cell) | |
| Ice alone | Converted to Frost (stays, blocks path) | Pulse cannot pass through Frost |
| Lightning alone | Converted to Charge (stays, boosts next combo) | |
| Void alone | Converted to Null (removed from stage) | |
| Earth alone | Converted to Stone (stays, stable) | |
| Wind alone | Converted to Breeze (stays, deflects path ±30°) | |
| Crystal alone | Converted to Shard (stays, splits pulse into 2 paths) | |
| Fire → Water | Steam (target counts as cleared, opens adjacent hidden cells) | Order: Fire first |
| Water → Fire | Cancelled (both removed, no effect, no score) | Order: Water first |
| Fire → Lightning | Plasma (AOE: clears all elements within 60px radius) | |
| Ice → Water | Blizzard (freezes all water elements on stage) | |
| Water → Ice | Melt (removes all ice elements on stage) | |
| Lightning → Void | Singularity (reverses direction of next pulse segment) | |
| Void → Fire | Inferno (fire expands to fill adjacent cells) | |
| Earth → Water | Mud (slows pulse speed to 80px/s for remainder of path) | |
| Wind → Ice | Blizzard Storm (moving elements freeze in place) | |
| Crystal → Lightning | Prism (splits pulse into 4 paths, each at 90°) | |
| Fire → Water → Earth | Magma Flow (lava bridge appears, creates new traversal surface) | 3-element |
| Ice → Water → Wind | Arctic Storm (all targets cleared regardless of pulse contact) | 3-element |
| Lightning → Crystal → Void | Collapse (stage resets with all elements converted to targets) | 3-element |

**Pulse Path Split Handling** (for Crystal/Prism combos):
- When a pulse splits, each sub-pulse continues independently
- Sub-pulses share the same combo context (sequential transforms still chain)
- Maximum split depth: 2 (a split pulse cannot trigger another split)
- Sub-pulses terminate when they reach a stage edge or 200px from split point

### 9.6 Local Storage Schema

```json
{
  "pulse-weaver-state": {
    "highScore": 0,
    "gamesPlayed": 0,
    "highestStage": 0,
    "sessionScore": 0,
    "settings": {
      "sound": true,
      "music": true,
      "vibration": true
    },
    "recipesDiscovered": [],
    "elementMastery": {
      "fire": 0, "water": 0, "ice": 0, "lightning": 0,
      "void": 0, "earth": 0, "wind": 0, "crystal": 0
    },
    "stageStars": {},
    "interstitialCount": 0,
    "adFreeUntil": null,
    "hintUsedStages": []
  }
}
```

### 9.7 Accessibility

**Colorblind Support**: Every element type is differentiated by both color AND shape symbol (see Section 4.2). Shape overlays are high-contrast strokes on the blob background. Element name is always available via tap-tooltip.

**Reduce Motion**: `prefers-reduced-motion` media query detected. If active:
- Particle effects replaced by a brief opacity flash
- Pulse travel speed increased to 400px/s (less motion time on screen)
- Background drift animations disabled
- Screen flash effects reduced to 30% opacity

**Text Size**: All UI text minimum 12px. Score uses 18px. Stage labels use 16px. All text respects system font size scaling where feasible within Phaser.

**One-Handed Play**: Entire game is playable with one thumb. No two-hand gestures required. HUD elements never overlap the center play area.

---

## Appendix: Hand-Authored Stage Reference (Stages 1–5)

### Stage 1 (Tutorial — Fire + Water Intro)
```
Elements: fire(x:120, y:200), water(x:240, y:350)
Required targets: both
Optimal path: start left edge → through fire → through water
Result: Fire transforms, Water transforms. Both clear.
No combo required. Teaches: "pulse touches elements in draw order"
Background hint text (first play only): "Draw a line through the elements"
```

### Stage 2 (Tutorial — Order Matters)
```
Elements: fire(x:180, y:180), water(x:180, y:380), fire2(x:90, y:280)
Required targets: fire, water (not fire2)
Trap: Drawing water before fire cancels both → stage not clearable
Correct: Draw fire → water path (Steam combo triggers bonus)
Teaches: "fire before water = steam. water before fire = cancel"
```

### Stage 3 (Tutorial — Multiple Paths)
```
Elements: fire(x:90,y:200), water(x:270,y:200), fire2(x:90,y:400), water2(x:270,y:400)
Required targets: fire, water2
Non-required: water, fire2
Solution A: Draw diagonal fire(top-left) → water2(bottom-right) — direct, no combo
Solution B: Draw fire → water → fire2 → water2 — long path, 2 combos, higher score
Teaches: "not every element needs to be hit, but combos give more points"
```

### Stage 4 (Introduction to 3 elements — Ice revealed)
```
Elements: fire(x:120,y:160), ice(x:240,y:250), water(x:180,y:400)
Required targets: fire, water
ice is NOT a target
Trap: hitting ice before water creates Frost (blocks path)
Optimal: fire → water (direct diagonal, ignoring ice)
Discovery opportunity: fire → ice → water = "Fire heats ice → water → Steam" (unique triple)
Teaches: element avoidance, path geometry choice
```

### Stage 5 (Rest Stage — Open playground)
```
Elements: fire(x:100,y:200), water(x:260,y:200), fire2(x:180,y:380)
Required targets: fire only
Everything else optional
Intended for player to experiment freely with combos before Stage 6 introduces Ice properly
Background tint: #F8FBFF (rest stage lighter background)
```
