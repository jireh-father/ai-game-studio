# Game Design Document: Spam Call Smash

**Slug**: spam-call-smash
**Version**: 1.0
**Date**: 2026-03-05
**Score**: 70.8

---

## 1. Overview

**Title**: Spam Call Smash
**One-liner**: Hang up on spam callers faster than your patience runs out
**Genre**: Reflex / Pattern Recognition
**Platform**: Mobile (360–428px portrait, touch-only)
**Session Length**: 60–120 seconds
**Core Fantasy**: The visceral satisfaction of slamming the phone on a spam caller — universally relatable rage turned into a game

**Elevator Pitch**: Calls flood in. Some are spam (tap to hang up fast), some are real (hold to answer). But as you progress, spam calls disguise themselves, caller IDs lie, and real calls need multi-tap codes before you answer. One wrong move destroys your patience meter. The rage-quit fantasy made playable.

---

## 2. Game Mechanics

### 2.1 Core Loop

Each round = 60 seconds of incoming calls. Calls arrive as phone card pop-ups from bottom of screen. Player must:
- **SPAM**: Tap quickly (within time window) to hang up
- **REAL**: Hold finger down (≥0.6s) to answer

Patience meter (top of screen) drains on mistakes:
- Answering spam: -20 patience
- Hanging up on real call: -30 patience
- Missing a call (timeout): -10 patience

Patience meter fills on successes:
- Correct spam hangup: +2 patience
- Correct real answer: +5 patience

**Game Over**: Patience reaches 0, OR 15s of zero interactions.

### 2.2 Call Types (Escalating Complexity)

#### Tier 1 — Basic (Stages 1–3)
| Type | Signal | Action | Time Window |
|------|--------|---------|-------------|
| Obvious Spam | Red skull icon, "Unknown Number" | Tap once | 2.5s |
| Real Call | Green phone icon, named contact | Hold 0.6s | 3.0s |

#### Tier 2 — Disguised (Stages 4–7)
| Type | Signal | Action | Time Window |
|------|--------|---------|-------------|
| Disguised Spam | Looks like real contact, flickers subtly | Tap | 2.0s |
| Spam Robocall | Shows local area code (+1 555-xxx) but has static noise indicator | Tap | 1.8s |
| Real Urgent | Flashes urgently, contact name in CAPS | Hold 1.0s | 2.5s |
| Fake Real | Shows contact name from your list, but profile pic is slightly off (different tint) | Tap | 2.2s |

#### Tier 3 — Combo (Stages 8–12)
| Type | Signal | Action | Time Window |
|------|--------|---------|-------------|
| Multi-tap Spam | Shows "Spam? 3×" badge — must tap 3× rapidly | Tap ×3 within 1.0s | 2.0s |
| Code Answer | Real call requiring PIN input (3-digit tap sequence shown briefly) | Memorize + tap sequence | 3.5s |
| Spoofed Contact | Caller ID matches contact but call timer shows negative seconds | Tap | 2.0s |
| Conference Spam | Two simultaneous cards — both spam | Tap both within 1.5s | 2.0s |

#### Tier 4 — Chaos (Stages 13+)
| Type | Signal | Action | Time Window |
|------|--------|---------|-------------|
| Evolving Caller | Starts as spam, switches to real mid-ring (or vice versa) — color shifts | Adapt action | 1.8s |
| Silent Real | No ringtone, only subtle vibration icon | Hold 0.8s | 2.0s |
| Caller Puzzle | Caller ID is math problem (e.g., "5+3 area code") — solve mentally | Tap (spam) or Hold (real) | 2.5s |
| Rapid Burst | 4 calls arrive simultaneously, mixed spam/real | Sort and act all within 2.5s | 2.5s |

### 2.3 Patience Meter
- Starts at 100
- Visual: horizontal bar at top, color shifts green → yellow → red
- At 25%: screen edges pulse red every second
- At 10%: controller vibration + "YOUR PATIENCE IS CRITICAL" text flash
- Drain modifiers by stage: each stage tier increases drain by +5% per mistake

### 2.4 Score System
- Base points per correct action: Spam hangup = 10pts, Real answer = 15pts
- Speed bonus: Action within first 50% of time window = ×1.5 multiplier
- Combo multiplier: consecutive correct actions = ×1 → ×1.5 → ×2 → ×2.5 (max)
- Combo breaks on any mistake or missed call
- Stage clear bonus: 50 × stage number

---

## 3. Stage Design

### Stage Progression Table

| Stage | Duration | Calls/min | Spam% | Disguised% | Multi-tap% | Simultaneous | New Mechanic |
|-------|----------|-----------|-------|-----------|-----------|-------------|-------------|
| 1 | 30s | 8 | 70% | 0% | 0% | 0 | Tutorial: obvious spam vs real |
| 2 | 35s | 10 | 65% | 0% | 0% | 0 | Add urgent real calls |
| 3 | 40s | 12 | 60% | 0% | 0% | 0 | Speed window tightens to 2.2s |
| 4 | 40s | 14 | 60% | 20% | 0% | 0 | Introduce disguised spam |
| 5 | 45s | 16 | 55% | 30% | 0% | 0 | Add fake real (profile tint) |
| 6 | 45s | 16 | 55% | 35% | 10% | 0 | Introduce multi-tap spam |
| 7 | 50s | 18 | 50% | 35% | 15% | 0 | Spoofed contact calls |
| 8 | 50s | 18 | 50% | 30% | 20% | 1 | Conference spam (2 simultaneous) |
| 9 | 55s | 20 | 50% | 30% | 20% | 1 | Code answer mechanic |
| 10 | 55s | 22 | 45% | 35% | 20% | 2 | Evolving caller |
| 11 | 60s | 24 | 45% | 35% | 20% | 2 | Silent real calls |
| 12 | 60s | 24 | 45% | 35% | 25% | 2 | Caller puzzle (math) |
| 13+ | 60s | 26+ | 40% | 40% | 25% | 3 | Rapid burst mode |

### Stage Clear Condition
- Survive the timer without patience reaching 0
- Bonus: "Perfect Stage" if no mistakes at all → patience +15, score ×2 bonus

### Difficulty Ramp
- Every 3 stages: time windows tighten by 0.1s
- Every 5 stages: patience drain increases by 5%
- Endless mode starts at stage 13+ with randomized call sequences

---

## 4. Visual Design

### 4.1 Color Palette
| Element | Hex | Usage |
|---------|-----|-------|
| Background | #0A0A0F | Dark phone screen feel |
| Spam Card | #FF3B3B | Obvious spam |
| Disguised Spam | #FF8C42 | Suspicious orange tint |
| Real Call | #34C85A | Safe green |
| Fake Real | #34C85A tinted → #7B9E87 | Subtle gray-green shift |
| Patience Full | #34C85A | Green bar |
| Patience Mid | #FFD60A | Yellow bar |
| Patience Low | #FF3B3B | Red bar, pulsing |
| UI Text | #E8E8F0 | Light on dark |
| Card Shadow | #000000 60% opacity | Depth |

### 4.2 Call Card Design (SVG, 320×80px)
```
[ICON 48×48px] [NAME 160px wide] [TIMER ARC]
[SUBTAG 12px]  [NUMBER 120px]    [ACTION HINT]
```

- Icon: SVG phone emoji variants (different per call type)
  - Obvious spam: red phone with skull (24px skull overlay)
  - Real: green phone with contact initial circle
  - Disguised spam: green phone, but icon has 2px orange outline pulsing at 1Hz
  - Fake real: green phone, profile circle is slightly desaturated (85% saturation)
- Timer arc: circular SVG arc around icon, shrinks as time runs out (stroke-dashoffset animation)
- Card border radius: 16px
- Card width: 340px, height: 88px
- Card entry animation: slides in from bottom-right at 45° angle, 200ms ease-out
- Card exit (hangup): flies off screen top-left in 150ms with rotation +30°
- Card exit (answer): slides off screen right in 200ms, green flash

### 4.3 Screen Layout (360×640px baseline)
```
[STAGE LABEL]          [SCORE]
[=========PATIENCE BAR==========] ← 12px tall, full width
                                   ← 16px gap
[CALL CARDS STACK ZONE]           ← 380px height, scrollable
  Card 1 (active)
  Card 2 (queued -40px below)
  Card 3 (queued -80px below)
                                   ← 16px gap
[HOLD INSTRUCTION HINT]           ← 40px, shows briefly
```

### 4.4 Animations
- Card spawn: scale 0.8 → 1.0, 150ms ease-out spring
- Correct hangup: card shakes 3× (±4px, 50ms each) then flies off
- Wrong action: screen red flash (200ms), patience bar shake animation
- Combo text: "+COMBO ×2!" appears center screen, scale 1.5 → 1.0, 400ms, fades out over 600ms
- Stage clear: all cards fly off simultaneously, confetti particle burst (20 particles, SVG circles)
- Game over: screen slow-motion zoom to darkness (scale 1.0 → 1.05, opacity 1.0 → 0, 800ms)

### 4.5 SVG Assets Required
- phone-spam.svg (red phone + skull)
- phone-real.svg (green phone + contact circle)
- phone-disguised.svg (orange-outlined phone)
- phone-silent.svg (phone with vibration lines, no sound waves)
- patience-bar.svg (segmented bar with 10 segments)
- particle.svg (small circle for confetti)
- background-grid.svg (subtle grid pattern for background)

---

## 5. Audio

### 5.1 Sound Design (All procedural/synthesized)
| Sound | Trigger | Description | Duration |
|-------|---------|-------------|----------|
| spam-ring | Spam card appears | Aggressive buzzing ring, 440Hz square wave | loop until action |
| real-ring | Real card appears | Pleasant melodic ring, sine wave | loop until action |
| hangup-hit | Correct spam tap | Satisfying "smash" — low thud + glass creak | 0.3s |
| answer-pick | Correct real hold | Warm "click" sound, rising tone | 0.4s |
| wrong-action | Mistake | Harsh buzz + patience drain visual | 0.5s |
| combo-up | Combo increases | Ascending chime, pitch +1 semitone per level | 0.2s |
| patience-critical | Patience < 25% | Low heartbeat pulse, 1Hz | loop |
| stage-clear | Stage complete | Triumphant 3-note jingle | 1.0s |
| game-over | Patience = 0 | Deflating "wah-wah" descending | 1.5s |

### 5.2 Implementation Note
Use Phaser 3 Web Audio API synthesis (no external files). Generate tones via `AudioContext.createOscillator()`.

---

## 6. UI/UX

### 6.1 Screen Flow
```
Title Screen
    ↓ TAP TO PLAY
Stage Intro (0.5s flash: "STAGE 1")
    ↓ auto-start
Gameplay
    ↓ patience=0 OR 15s idle
Game Over Screen (< 2s to display)
    ↓ TAP TO RETRY (instant)
Stage Intro
```

### 6.2 Title Screen
- Title: "SPAM CALL SMASH" in bold 36px, white on dark
- Subtitle: "Hang up faster than your patience runs out" 14px, gray
- Animated: 3 incoming call cards cycle past in background (loop)
- "TAP TO PLAY" button: 200×60px, green, pulsing scale 1.0 → 1.05 → 1.0 at 1.5Hz
- High score display: "BEST: 0" below button

### 6.3 HUD During Gameplay
- Top bar: Stage number (left), Score (right), both 14px
- Patience bar: full width, 12px tall, below top bar
- Patience label: "PATIENCE" 10px above bar, left-aligned
- Combo indicator: center of screen, appears only when combo ≥2

### 6.4 Tutorial Hints (Stage 1 only)
- First spam card: arrow pointing down + "TAP FAST!" tooltip, fades after 2s
- First real card: finger-hold icon + "HOLD TO ANSWER" tooltip, fades after 2s
- Hints disappear permanently after stage 1

### 6.5 Game Over Screen
- Large text: "OUT OF PATIENCE" 28px bold, red
- Score: "SCORE: 1240" 24px white
- Best: "BEST: 1240" 18px yellow (if new high score: "NEW BEST!" animated)
- Stage reached: "MADE IT TO STAGE 4" 16px gray
- Retry button: "PLAY AGAIN" 200×60px green, appears instantly (< 500ms from game over trigger)
- Social share button placeholder (disabled in POC)

### 6.6 Accessibility
- All tap targets ≥ 44×44px
- High contrast: all text ≥ 4.5:1 contrast ratio
- No audio-only information — all audio cues have visual equivalents

---

## 7. Monetization (Placeholder — POC Stage, No Ads)

### 7.1 Future Ad Placements (not implemented)
- Interstitial: between stages 3, 6, 9, 12
- Rewarded: "Watch ad to restore 50 patience" on game over
- Banner: below call card zone (32px)

### 7.2 POC Configuration
- `ADS_ENABLED = false` in config.js
- All ad functions are no-ops that immediately callback

---

## 8. Technical Architecture

### 8.1 File Structure
```
games/spam-call-smash/
├── index.html          (HTML shell, CDN imports, canvas mount)
├── css/
│   └── style.css       (mobile viewport, canvas centering, font)
└── js/
    ├── config.js       (constants: PATIENCE_MAX, STAGE_DATA, CALL_TYPES, etc.)
    ├── main.js         (Phaser game init, scene registration)
    ├── game.js         (GameScene: core gameplay loop, call spawning, input handling)
    ├── stages.js       (StageManager: stage data, progression, clear conditions)
    ├── ui.js           (UIScene: HUD elements, patience bar, combo display)
    └── ads.js          (AdManager: no-op stubs for POC)
```

### 8.2 Phaser 3 Configuration
```javascript
// config.js
const GAME_CONFIG = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  backgroundColor: '#0A0A0F',
  parent: 'game-container',
  scene: [BootScene, TitleScene, GameScene, UIScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 320, height: 480 },
    max: { width: 428, height: 926 }
  }
};
```

### 8.3 Call Object Schema
```javascript
{
  id: string,           // unique call ID
  type: 'spam'|'real'|'disguised'|'fake-real'|'multi-tap'|'code'|'spoofed'|'evolving'|'silent'|'puzzle',
  displayName: string,  // shown caller ID
  action: 'tap'|'hold'|'multi-tap'|'sequence',
  taps: number,         // for multi-tap type
  sequence: number[],   // for code type (e.g. [2,7,4])
  timeWindow: number,   // ms to act
  patience: { wrong: number, miss: number, right: number }, // delta values
  score: number,        // base score for correct action
  spawnTime: number,    // timestamp
  disguiseDelay: number // ms before visual hint of disguise appears
}
```

### 8.4 Input Handling
```javascript
// Touch events only (no mouse for POC)
// Hold detection: pointerdown timestamp → pointerup delta
// Multi-tap: track tap count within 1000ms window per card
// Simultaneous cards: each card has independent touch tracking
```

### 8.5 Performance Targets
- 60fps on mid-range Android (Snapdragon 660+)
- Max 20 SVG elements on screen simultaneously
- Call card pool: pre-create 10 card objects, reuse via object pool
- No external network calls during gameplay

### 8.6 State Machine (GameScene)
```
IDLE → SPAWNING → ACTIVE → EVALUATING → STAGE_CLEAR | GAME_OVER
                ↑_______↓ (loop within stage)
```

---

## 9. Juice Specification

**Philosophy**: Every interaction must feel viscerally satisfying. The core fantasy — slamming the phone on a spammer — must be felt in every tap.

### 9.1 Tap Feedback (Spam Hangup)
| Element | Value | Notes |
|---------|-------|-------|
| Screen shake | ±3px, 80ms, 3 cycles | X-axis only for phone smash feel |
| Card rotation on exit | +35° over 150ms | Tumbling away feel |
| Card exit velocity | 800px/s toward top-left | Aggressive throw |
| Sound | 60Hz thud + 2kHz creak, 0.3s | Bone-shaking hang-up |
| Particle burst | 6 particles, red/orange, 200px radius | Anger explosion |
| Haptic | 50ms strong pulse | Via navigator.vibrate() |
| Score popup | "+10 SMASHED!" 20px bold, rises 60px, fades 600ms | Positioned at card center |

### 9.2 Hold Feedback (Real Answer)
| Element | Value | Notes |
|---------|-------|-------|
| Hold progress ring | Circular arc filling over 0.6s, green | Clear hold progress indicator |
| Card glow | 0 → 8px green box-shadow over 0.6s | Building positive energy |
| Completion flash | Entire card white flash, 100ms | Satisfying completion |
| Sound | 800Hz sine rise over 0.4s | Warm welcoming tone |
| Score popup | "+15 ANSWERED!" green, rises 60px | Positive reinforcement |
| Haptic | 30ms gentle pulse | Softer than hangup |

### 9.3 Mistake Feedback
| Element | Value | Notes |
|---------|-------|-------|
| Screen edge vignette | Red, opacity 0 → 0.6 → 0, 400ms | Danger signal |
| Patience bar shake | ±8px horizontal, 3 cycles, 60ms each | Physical drain |
| Patience bar flash | White → red → normal, 200ms | Draw attention |
| Wrong sound | 200Hz buzz, 0.5s | Uncomfortable frequency |
| Haptic | 100ms double pulse | Punishment pattern |
| Card color flash | Red overlay on card, 200ms | Error on card itself |

### 9.4 Combo Feedback
| Combo | Visual | Sound |
|-------|--------|-------|
| ×2 | "+COMBO ×2" white, scale 1.5→1.0, 400ms | Chime +0 semitones |
| ×3 | "+COMBO ×3" yellow, scale 1.6→1.0, 400ms | Chime +2 semitones |
| ×4 | "+COMBO ×4" orange, scale 1.7→1.0, 400ms | Chime +4 semitones |
| ×5+ | "+COMBO ×5!" red + screen edge glow, scale 1.8→1.0, 400ms | Chime +6 semitones + reverb |

### 9.5 Stage Clear Juice
| Element | Value |
|---------|-------|
| All remaining cards | Fly off screen simultaneously in 300ms burst |
| Screen flash | White → transparent, 200ms |
| Confetti particles | 24 particles, 6 colors, physics arc, 1200ms |
| Stage complete text | "STAGE X CLEAR!" slides in from top, 300ms ease-out |
| Score tally | Numbers count up rapidly over 800ms |
| Pause before next | 1500ms of celebration before stage intro |

### 9.6 Critical Patience (< 25%) Juice
| Element | Frequency | Value |
|---------|-----------|-------|
| Screen edge pulse | 1Hz | Red vignette, opacity 0 → 0.3 → 0 |
| Background color shift | Continuous | #0A0A0F → #1A0505 gradient transition |
| Phone ring sounds | Slightly distorted | Pitch bend -10% (panic distortion) |
| HUD patience text | Every 2s | "LOSING PATIENCE..." flashes |

### 9.7 Game Over Juice
| Element | Value |
|---------|-------|
| Trigger to screen | < 500ms |
| Screen transition | Zoom-blur: scale 1.0 → 1.08, blur 0 → 4px, opacity fade, 400ms |
| "OUT OF PATIENCE" text | Slams in from top, bounces once on arrival, 300ms |
| Score reveal | Counts up from 0 in 600ms |
| Retry button | Slides in from bottom 400ms after score reveal |

---

## 10. Implementation Notes

### 10.1 Critical Implementation Rules (NO EXCEPTIONS)

1. **No setTimeout/setInterval for game logic** — use Phaser `time.delayedCall()` and `time.addEvent()`
2. **Touch only** — implement via Phaser `pointer` events, not DOM touch events
3. **Object pooling** — pre-allocate 10 call card containers, reuse them
4. **SVG via Phaser** — create all graphics using Phaser Graphics objects, no external SVG files
5. **Hold detection** — track `pointerdown` timestamp, measure delta on `pointerup`; cancel hold if pointer moves > 10px
6. **Death timer reset** — reset 15s death timer on EVERY interaction (tap, hold attempt, etc.)

### 10.2 Multi-tap Implementation
```javascript
// Track taps per card within 1000ms window
handleCardTap(card) {
  if (card.type === 'multi-tap') {
    card.tapCount = (card.tapCount || 0) + 1;
    if (card.tapCount >= card.requiredTaps) {
      this.resolveCard(card, 'correct');
    } else {
      // Show progress: "2/3" badge on card
      this.updateTapProgress(card);
      // Reset tap count if 1000ms passes without another tap
      this.time.delayedCall(1000, () => {
        if (card.tapCount < card.requiredTaps) card.tapCount = 0;
      });
    }
  }
}
```

### 10.3 Evolving Caller Implementation
```javascript
// Call starts as one type, switches partway through time window
spawnEvolvingCall(card) {
  card.currentType = 'spam'; // or 'real'
  card.targetType = card.currentType === 'spam' ? 'real' : 'spam';
  // Schedule switch at 40% of time window
  this.time.delayedCall(card.timeWindow * 0.4, () => {
    this.morphCard(card, card.targetType);
  });
}
```

### 10.4 Patience System Precision
```javascript
// PATIENCE_MAX = 100
// Never allow patience < 0 or > 100 (clamp)
// Game over triggers at patience <= 0
// Update HUD every frame for smooth bar animation
adjustPatience(delta) {
  this.patience = Phaser.Math.Clamp(this.patience + delta, 0, PATIENCE_MAX);
  this.events.emit('patienceChanged', this.patience);
  if (this.patience <= 0) this.triggerGameOver();
}
```

### 10.5 Simultaneous Cards Layout
```
Single card:  centered, y=300
Two cards:    y=260 and y=360, x offset ±20px
Three cards:  y=220, y=320, y=420
Four cards:   y=180, y=260, y=340, y=420
```
Each card occupies its own touch zone — no touch event conflicts.

### 10.6 Death Timer Implementation
```javascript
// 15s inactivity = game over
// Reset on ANY player interaction
resetDeathTimer() {
  if (this.deathTimer) this.deathTimer.remove();
  this.deathTimer = this.time.delayedCall(15000, () => {
    this.triggerGameOver('inactivity');
  });
}
```

### 10.7 Code Answer Sequence
- Show 3-digit sequence for 1.5s, then hide it
- Player must tap 3 numbered buttons (1–9) in order
- Buttons appear as overlay on real call card
- 3.5s total time window from card spawn

### 10.8 Stage Transition
- Stage clear: immediately pause all card timers, run stage clear juice, 1500ms
- Stage intro: flash "STAGE N" for 500ms, then resume spawning
- Total transition: < 2s

### 10.9 Lines Budget per File
| File | Target | Max |
|------|--------|-----|
| index.html | 30 | 50 |
| style.css | 60 | 80 |
| config.js | 80 | 100 |
| main.js | 40 | 60 |
| game.js | 220 | 300 |
| stages.js | 120 | 180 |
| ui.js | 100 | 150 |
| ads.js | 20 | 30 |

### 10.10 Known Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Binary mechanic feels shallow | Tier 2+ call types create genuine cognitive load; disguised spam requires attention not just reflex |
| Multi-touch conflicts on simultaneous cards | Assign unique card IDs to touch tracking; use Phaser's multi-pointer support |
| Hold detection misfire on swipe | Cancel hold if pointer moves > 10px from start |
| Performance on low-end devices | Object pool all cards; limit particles to 24 max; no tween overlap |
| 15s death timer too punishing | Reset on any touch, not just correct action — exploration/hesitation counts |
| Code sequence too hard | Show hint (dim sequence replay) if player fails code twice in same stage |
