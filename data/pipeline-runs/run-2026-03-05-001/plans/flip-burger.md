# Game Design Document: Flip Burger

**Version**: 1.0
**Date**: 2026-03-05
**Slug**: flip-burger
**Status**: Planning

---

## 1. Overview

**Title**: Flip Burger
**Genre**: Precision Timing / Rhythm Action
**Platform**: Mobile Web (360-428px portrait, touch-only)
**One-liner**: Flip patties with perfect timing to cook them exactly right — burnt or raw and the customer walks.
**Core Differentiator**: Unlike Overcooked (task management chaos), Flip Burger is a **rhythm game dressed as a burger joint**. Every flip is a beat. The grill is your drum kit. Miss the timing window and feel the sting.

**Session Length**: 90–180 seconds per run
**Death Condition**: 15 seconds of no flip input → grill fires → game over
**Restart Time**: < 2 seconds (instant restart, no loading screen)

---

## 2. Game Mechanics

### 2.1 Core Loop

1. Patties appear on grills (1 grill at stage 1, up to 4 grills at stage 5+)
2. Each patty has a **Cook Timer** — a visual arc/ring that fills over time
3. Player must tap the patty when the timer hits the **Flip Zone** (green arc segment)
4. First tap = flip (raw side down → cooked side up)
5. Second tap in Flip Zone = plate (done)
6. Miss the Flip Zone = patty state degrades (undercooked → burnt)

### 2.2 Flip Zones

| Zone | Arc Position | Result |
|------|-------------|--------|
| Early (red) | 0–30% | Raw / slimy — customer rejects |
| Perfect (green) | 30–70% | Perfectly cooked — bonus points |
| Late (yellow) | 70–90% | Slightly overdone — accepted, no bonus |
| Burnt (red) | 90–100% | Burnt — customer angry, life lost |

**Flip Zone Width** shrinks as stages progress:
- Stage 1: 40% arc width (forgiving)
- Stage 3: 30% arc width
- Stage 5: 22% arc width
- Stage 8+: 18% arc width (expert only)

### 2.3 Timing Grades

- **PERFECT**: Tap within center 20% of green zone → +20 pts, golden sizzle effect
- **GOOD**: Tap anywhere in green zone → +10 pts, normal sizzle
- **EARLY/LATE**: Tap in yellow zone → +3 pts, dull thud
- **MISS**: Tap in red zone → -1 life, smoke puff
- **BURNT**: No tap, timer expires → -1 life, flame burst + screen shake

### 2.4 Multi-Grill Management

- **Stage 1–2**: 1 grill, 1 patty at a time
- **Stage 3–4**: 2 grills, patties added every 8s
- **Stage 5–6**: 3 grills, patties added every 6s
- **Stage 7+**: 4 grills, patties added every 5s, some grills run faster (heat variant)

Each grill has a **unique cook speed** — player must track multiple rhythms simultaneously. This is the rhythm game core: reading multiple timers like a polyrhythm.

### 2.5 Lives System

- Start with 3 lives (shown as burger icons)
- Lose a life: burnt patty or raw patty served
- Extra life: 5 consecutive PERFECT flips → +1 life (max 5)
- **0 lives = game over**

### 2.6 Inactivity Death

- Timer starts after any flip (or game start)
- 15 seconds with no flip input: all grills ignite → instant game over with fire animation
- Visual warning: grill edges glow orange at 10s, red at 13s, screaming animation at 15s

### 2.7 Customer System

- 1 customer per grill visible in queue (simple face above grill)
- Customer patience bar: 10 seconds after "plate ready" before they leave angry (no points)
- Each customer served = score + combo multiplier maintained
- Customer leaves without burger = combo reset

---

## 3. Stage Design

### Stage Progression Formula

- Each stage = serve N burgers correctly to advance
- Stage target: `5 + (stage_number * 2)` correct serves
- Cook time per patty decreases: `base_time = 8 - (stage * 0.4)` seconds (minimum 3.5s)

### Stage Breakdown

| Stage | Grills | Cook Time | Flip Zone | Target | New Element |
|-------|--------|-----------|-----------|--------|-------------|
| 1 | 1 | 8s | 40% | 5 | Tutorial: one patty at a time |
| 2 | 1 | 7s | 38% | 7 | Double patty (2 flips needed) |
| 3 | 2 | 6.5s | 35% | 9 | Two grills introduced |
| 4 | 2 | 6s | 33% | 11 | Hot grill (1.3× speed) |
| 5 | 3 | 5.5s | 28% | 13 | Three grills, patty combos |
| 6 | 3 | 5s | 26% | 15 | Cheese drop (tap to add before plating) |
| 7 | 4 | 4.5s | 22% | 17 | Four grills, overlapping rhythms |
| 8 | 4 | 4s | 20% | 19 | Speed rush: all grills run at 1.2× |
| 9+ | 4 | 3.5s | 18% | 22+ | Infinite: difficulty steps every 3 stages |

### Double Patty Mechanic (Stage 2+)

- Some patties require 2 flips: flip at 50%, flip again at 80–95% of cook time
- Visual indicator: double arc ring on timer
- Both flips must be in green zone for PERFECT grade

### Hot Grill Variant (Stage 4+)

- Hot grill shown with red grill bars (instead of black)
- Cooks at 1.3× speed — same visual timer, faster fill
- Player learns to read visual cues, not just time in head

---

## 4. Visual Design

### 4.1 Palette

| Element | Color | Hex |
|---------|-------|-----|
| Background | Warm kitchen cream | #FDF6E3 |
| Grill surface | Dark iron | #2C2C2C |
| Grill bars | Gunmetal | #444444 |
| Hot grill bars | Ember red | #CC3300 |
| Raw patty | Pink-beige | #E8A080 |
| Cooked patty (side 1) | Medium brown | #8B4513 |
| Cooked patty (side 2) | Dark brown | #5C2A00 |
| Burnt patty | Near-black | #1A0A00 |
| Perfect zone arc | Bright green | #44CC44 |
| Late zone arc | Amber | #FFAA00 |
| Burnt zone arc | Danger red | #DD2222 |
| Score text | Dark brown | #3A1A00 |
| UI background | Paper white | #FFFBF0 |
| Combo text | Gold | #FFD700 |

### 4.2 SVG Assets (all inline, no external files)

**Patty (raw)**:
- Ellipse 70×22px, fill #E8A080
- Irregular edge via SVG path (bumpy texture)
- Small pink speckles (raw meat texture)

**Patty (cooked side)**:
- Same ellipse, fill #8B4513
- Grill marks: 4 diagonal lines, stroke #5C2A00, width 3px

**Grill**:
- Rectangle 110×140px rounded corners (r=8)
- Fill #2C2C2C
- 5 horizontal bars across center, stroke #444444, width 4px
- Subtle glow filter for hot variant

**Cook Timer Arc**:
- SVG `<circle>` with stroke-dasharray/dashoffset animation
- Outer ring: 52px radius, stroke 8px
- Color changes: #44CC44 (green zone) → #FFAA00 (late) → #DD2222 (burnt)
- Inner circle shows patty

**Customer Face**:
- Circle 28px, face with 2 dot eyes
- Happy: mouth curve up (#44CC44 cheeks)
- Impatient: straight mouth (#FFAA00 cheeks)
- Angry: mouth curve down (#DD2222 cheeks)

**Life Icon (burger)**:
- Stacked SVG: bun top, patty, lettuce, bun bottom
- Full: colored normally; Empty: grey #CCCCCC

### 4.3 Layout (360px portrait)

```
┌─────────────────────────────┐  ← 360px wide
│  [♥♥♥]   SCORE: 0   [STG 1] │  ← 48px header
│                             │
│   [Customer] [Customer]     │  ← 60px customer row
│                             │
│  ┌──────┐        ┌──────┐   │
│  │GRILL │        │GRILL │   │  ← Grill 200px tall each
│  │  ○   │        │  ○   │   │  ← Patty centered in grill
│  │      │        │      │   │
│  └──────┘        └──────┘   │
│                             │
│  ┌──────┐        ┌──────┐   │
│  │GRILL │        │GRILL │   │
│  │  ○   │        │  ○   │   │
│  └──────┘        └──────┘   │
│                             │
│  [COMBO x3]  [ORDERS: 7/9]  │  ← 40px footer bar
└─────────────────────────────┘
```

- 1 grill: centered, 200×200px
- 2 grills: side by side, 160×180px each, 20px gap
- 3 grills: 2 top, 1 bottom centered, 140×160px
- 4 grills: 2×2 grid, 140×160px each, 16px gaps

---

## 5. Audio

**No external audio files** — all Web Audio API generated.

| Event | Sound Description | Frequency/Duration |
|-------|------------------|-------------------|
| Patty on grill | Sizzle (white noise burst) | 80ms, filtered noise |
| PERFECT flip | High-pitched ping | 880Hz, 120ms, sine |
| GOOD flip | Mid ping | 660Hz, 100ms, sine |
| LATE flip | Dull thud | 220Hz, 80ms, triangle |
| MISS/Burnt | Low buzzer | 110Hz, 200ms, sawtooth |
| Combo milestone | Rising arpeggio | C4→E4→G4→C5, 30ms each |
| Customer happy | Short jingle | G4→B4→D5, 50ms each |
| Customer angry | Descending notes | G4→E4→C4, 50ms each |
| Stage clear | Fanfare | 4-note chord, 300ms |
| Game over | Wah-wah descend | 400Hz→200Hz, 600ms |
| Fire/Inactivity | Crackle noise | 500ms burst, looping |

All audio created via `AudioContext.createOscillator()` and `createBuffer()`.

---

## 6. UI/UX

### 6.1 Screens

**Title Screen**:
- Large burger SVG (animated bounce, 4px up/down, 800ms loop)
- "FLIP BURGER" text, font-size 36px, #3A1A00, bold
- "TAP TO START" pulsing text, 1s fade loop
- Best score displayed: "BEST: 0"
- Tap anywhere to start Stage 1

**Gameplay HUD**:
- Top bar: lives (burger icons, 24px each), score (right), stage (center)
- Bottom bar: combo multiplier (left), orders remaining (right)
- No pause button — flow state is the goal; 15s inactivity kills anyway

**Grade Popup**:
- Appears over tapped patty, disappears after 600ms
- PERFECT: gold text, 32px, scale 1.0→1.4→0, 400ms
- GOOD: white text, 24px, scale 1.0→1.2→0, 300ms
- MISS: red text, 24px, shake + fade, 300ms

**Stage Clear Screen**:
- "STAGE X CLEAR!" text slides in from top, 300ms
- Shows: Perfect count, Good count, Miss count, Bonus pts
- Auto-advances after 1500ms (no tap needed)

**Game Over Screen**:
- Red tint overlay, 200ms fade
- "GAME OVER" 40px bold
- Final score, best score
- "RETRY" button — large touch target 200×60px
- Restart < 2s from tap

### 6.2 Feedback Design

**Touch Ripple**: White ripple circle on tap, 200ms expand+fade
**Grill Shake**: On burnt patty, grill shakes 4px left-right, 3 cycles, 200ms
**Score Pop**: Score number animates +N in gold, floats up 30px, 500ms
**Combo Counter**: Scale pulse on each combo increment, 1.0→1.15→1.0, 150ms
**Life Lost**: Red flash full screen, 100ms
**New Life**: Green flash, heart icon floats up from bottom, 500ms

### 6.3 Tutorial (Stage 1 only)

- Arrow pointing to patty: "TAP IN THE GREEN ZONE"
- Green zone highlighted with pulsing border
- First 3 patties: timer runs at 0.6× speed
- After 3 correct flips: tutorial dismissed, normal speed

---

## 7. Monetization

**POC Stage — No Ads**

Placeholder architecture for future:
- Interstitial slot: after game over (every 3rd death)
- Rewarded video slot: "Continue with 3 lives" on game over screen
- `js/ads.js` exports `showInterstitial()` and `showRewarded()` — both NO-OP in POC

---

## 8. Technical Architecture

### File Structure

```
games/flip-burger/
├── index.html          ← Phaser 3 CDN, canvas mount, meta tags
├── css/
│   └── style.css       ← Body reset, canvas centering, touch-action none
└── js/
    ├── config.js       ← Phaser config, SVG asset defs, game constants
    ├── main.js         ← Phaser.Game init, scene registration
    ├── game.js         ← GameScene: grills, patties, timers, flip logic
    ├── stages.js       ← Stage data table, progression logic
    ├── ui.js           ← UIScene: HUD, grade popups, screens
    └── ads.js          ← No-op ad stubs
```

### Line Budget

| File | Target Lines | Content |
|------|-------------|---------|
| index.html | ~40 | Boilerplate, CDN script tags |
| style.css | ~30 | Reset + centering |
| config.js | ~60 | Constants, SVG strings, Phaser config obj |
| main.js | ~30 | Scene registration, game init |
| game.js | ~290 | Core gameplay (largest file) |
| stages.js | ~60 | Stage data + helper functions |
| ui.js | ~180 | All UI rendering and effects |
| ads.js | ~15 | No-op stubs |

**Total**: ~705 lines (each file stays ≤300 lines)

### Key Technical Decisions

**Patty Timer Implementation**:
```javascript
// Each patty object tracks cook progress 0.0–1.0
patty.cookProgress += delta / (patty.cookTime * 1000);
// SVG arc updated via Graphics object
const arcStart = -Math.PI / 2;
const arcEnd = arcStart + (Math.PI * 2 * patty.cookProgress);
graphics.beginPath();
graphics.arc(x, y, 52, arcStart, arcEnd);
```

**Flip Zone Detection**:
```javascript
function getFlipResult(progress) {
  if (progress < 0.30) return 'EARLY';
  if (progress < 0.70) return 'PERFECT';  // center 20% = PERFECT bonus
  if (progress < 0.90) return 'LATE';
  return 'BURNT';
}
```

**Inactivity Timer**:
```javascript
// Reset on every flip tap
this.lastFlipTime = this.time.now;
// Check every frame
if (this.time.now - this.lastFlipTime > 15000) {
  this.triggerFireDeath();
}
```

**Grill SVG via Phaser Graphics**:
- All visuals drawn with `scene.add.graphics()`
- No image assets loaded — pure procedural SVG-style drawing
- Patty states managed via tint/fillStyle changes

**Scene Architecture**:
- `GameScene`: Logic, physics-free (no Matter.js needed — pure timer-based)
- `UIScene`: Overlaid HUD, runs parallel to GameScene
- Communication via Phaser event emitter: `this.events.emit('scoreChange', pts)`

**Mobile Touch**:
- All interaction via `setInteractive()` + `on('pointerdown')` on grill zones
- Touch target minimum 80×80px per grill (even for 4-grill layout)
- `style.css`: `touch-action: none; user-select: none;` on canvas

**Performance**:
- Target 60fps on mid-range Android (Pixel 4 equivalent)
- No particle systems — manual tween-based effects only
- Graphics objects recycled (not created/destroyed per frame)

---

## 9. Juice Specification

### Mandatory Juice Elements (all must be implemented)

| Element | Trigger | Effect | Duration | Intensity |
|---------|---------|--------|----------|-----------|
| **Flip Snap** | Any flip tap | Patty scales 1.0→0.85→1.1→1.0 | 200ms | Spring feel |
| **PERFECT Flash** | PERFECT grade | Gold radial burst from patty, 40px radius | 300ms | Bright, satisfying |
| **Grill Sizzle** | Patty placed on grill | White noise + steam particles (4 dots rise, fade) | 400ms | Ambient feel |
| **Combo Pulse** | Each combo +1 | Combo counter scales 1.0→1.3→1.0, color shifts gold | 150ms | Escalating |
| **Burnt Shake** | Patty burnt | Full grill shakes ±6px horizontal, 4 cycles | 250ms | Punishing |
| **Score Float** | Score gained | "+N" text floats up 40px, gold color, fade | 500ms | Rewarding |
| **Life Lost Flash** | Life lost | Full-screen red vignette, 50% opacity | 120ms | Shocking |
| **Fire Warning** | 10s inactivity | Grill edges pulse orange, 1Hz | Ongoing | Urgent |
| **Fire Death** | 15s inactivity | Flame sprite over all grills, screen shake ±8px | 600ms | Dramatic |
| **Stage Clear Burst** | Stage complete | Confetti burst (12 colored squares, scatter 80px) | 800ms | Celebratory |
| **Customer Happy Bounce** | Burger served | Customer face bounces up 8px, cheeks go pink | 300ms | Charming |
| **New Life Pop** | +1 life gained | Heart icon scales 0→1.5→1.0 from bottom | 400ms | Satisfying |
| **Combo Break** | Miss after combo | Combo counter shakes then resets, flash red | 200ms | Punishing |
| **Speed Rush Pulse** | Stage 8+ begins | All grills pulse orange tint, 0.5s period | Ongoing | Tense |
| **Double Patty Reveal** | Double patty lands | Two-ring indicator animates in with pop | 250ms | Clear signal |

### Feel Targets

- Every tap must feel **snappy** — no lag, instant visual response
- PERFECT feels **juicy** — the golden burst is the dopamine hit
- Burnt feels **painful** — screen shake, red flash, audio sting
- Combo building feels **rhythmic** — the sounds form a melody as combo increases
- Inactivity warning must feel **urgent** — player should panic slightly at 13s

### Screen Shake Budget

| Event | Shake Magnitude | Duration |
|-------|----------------|----------|
| Burnt patty | ±4px | 200ms |
| Life lost | ±6px | 250ms |
| Fire death | ±8px | 600ms |
| Stage clear | ±3px | 150ms |

---

## 10. Implementation Notes

### Priority Order for Developer

1. **Core timer loop** (patty cook progress, arc visualization) — nothing works without this
2. **Flip zone detection + grade system** — the game's entire feel depends on this being precise
3. **1-grill stage 1 playable** — get core loop working before adding grills
4. **Juice spec items 1-3** (Flip Snap, Perfect Flash, Sizzle) — these make the game feel alive
5. **Multi-grill expansion** — add grills 2→4 after single grill is fun
6. **Inactivity death system** — must ship with this, it's the death condition
7. **Remaining juice** (combo, score float, etc.) — add all before final testing
8. **Stage clear flow** — auto-advance, no tap needed
9. **Game over + restart** — must be < 2s restart

### Anti-Overcooked Checklist

- [ ] No task lists, no orders queue beyond "customer waiting at grill"
- [ ] No ingredient fetching — patty appears automatically on grill
- [ ] No movement — player stays stationary, just taps
- [ ] Difficulty via TIMING PRECISION only — narrower flip zones, not more tasks
- [ ] Single mechanic: tap at the right moment. That's it.

### Common Pitfalls to Avoid

- **Don't make flip zones too tight on stage 1** — 40% arc width is intentional, let the player feel good first
- **Don't use setTimeout for game timers** — use Phaser's `this.time.addEvent()` for pause-ability
- **Don't create DOM elements for effects** — all effects via Phaser Tweens and Graphics
- **Touch events must not propagate** — prevent `preventDefault()` on pointerdown to avoid scrolling
- **Inactivity timer resets on flip, not on ANY tap** — tapping empty grill doesn't count

### Stage Clear Condition

```javascript
// Stage advances when N correct serves achieved
if (this.correctServes >= this.stageTarget) {
  this.scene.get('UIScene').events.emit('stageClear');
  this.time.delayedCall(1500, () => this.advanceStage());
}
```

### Scoring Formula

```
base_score = grade_points (PERFECT=20, GOOD=10, LATE=3)
combo_multiplier = Math.min(Math.floor(combo / 3) + 1, 5)  // max 5×
final_score += base_score * combo_multiplier
```

### Responsive Grill Sizing

```javascript
const grillLayouts = {
  1: [{ x: 180, y: 320, w: 200, h: 200 }],
  2: [{ x: 90, y: 310, w: 160, h: 180 }, { x: 270, y: 310, w: 160, h: 180 }],
  3: [{ x: 90, y: 260, w: 140, h: 160 }, { x: 270, y: 260, w: 140, h: 160 },
      { x: 180, y: 460, w: 140, h: 160 }],
  4: [{ x: 90, y: 240, w: 140, h: 160 }, { x: 270, y: 240, w: 140, h: 160 },
      { x: 90, y: 430, w: 140, h: 160 }, { x: 270, y: 430, w: 140, h: 160 }]
};
```

### Dependency Notes

- Phaser 3.60+ via CDN (specific version pinned in index.html)
- Zero npm dependencies — pure CDN + vanilla JS
- No build step — serve static files directly

---

*GDD complete. All sections contain concrete numeric values. Ready for Developer implementation.*
