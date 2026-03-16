# Game Design Document: Bureaucrat Panic

**Slug**: `bureaucrat-panic`
**One-Liner**: You are the world's most important paper-pusher and you have 12 seconds per form.
**Core Mechanic**: Read an icon-based permit form, check it against pinned rules, swipe RIGHT to APPROVE or LEFT to DENY before time runs out.
**Target Session Length**: 4–7 minutes
**Date Created**: 2026-03-15
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Bureaucrat Panic drops the player into the chair of a beleaguered civil-service desk clerk whose inbox never stops. Each form is a permit application represented entirely through recognizable icons — an animal icon for the applicant type, an object icon for what they're requesting, a clock icon for the requested time, and color/shape badges for special attributes. Two to four "Active Rules" are pinned at the top of the screen, also rendered as icon combinations. The player must cross-reference the form against those rules in under twelve seconds and swipe the form right to APPROVE it or left to DENY it.

Getting it wrong costs a strike. Three strikes and the player is FIRED. Idle for twelve seconds and the system auto-submits the wrong answer, which also costs a strike. The rules themselves change every few stages — new rules slide in, old ones slide out — so the player can never rely on memorized patterns. By stage five the player is juggling three rules simultaneously while processing a werewolf's noise-exemption permit, which is both mentally engaging and genuinely funny.

The game's humor lives entirely in the absurdist icon combinations: a ghost applying for a haunting license, a robot requesting overtime on a Sunday, a dragon seeking a flame-display permit. This content variety keeps sessions fresh across many playthroughs while the core swipe mechanic remains unchanged, delivering the "one more round" compulsion Loop judged at 81.

### 1.2 Target Audience

Casual mobile gamers aged 16–35 who enjoy light cognitive challenges. Ideal play context is commuting, waiting rooms, or short couch sessions. Players who enjoyed Papers Please or Reigns will recognize the design lineage but the icon-first accessibility and 4–7 minute session length lower the barrier significantly. No reading required — all content is icon-based.

### 1.3 Core Fantasy

The player is the most important bureaucrat alive. The entire fate of an absurd fantasy city rests on whether they correctly process each form. There is power in the rubber stamp — THWACK — and shame in the shredder. The fantasy is competence under pressure: the feeling of rapidly parsing complex information and making the correct call before the clock runs out.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 4–7 minutes |
| Day 1 Retention | 40%+ |
| Day 7 Retention | 20%+ |
| Average Forms Processed per Session | 20–40 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[New Form Slides In] → [Player Reads Icon Fields]
         ↑                        │
         │              [Check Against Active Rules]
         │                        │
         │            [Swipe RIGHT=Approve / LEFT=Deny]
         │                   OR [Timer Hits 0]
         │                        │
         │             [Correct → Score + Stage Progress]
         │             [Wrong or Timeout → Strike]
         │                        │
         │          [3 Strikes → FIRED → Game Over]
         │                        │
         └──────── [Retry / New Session] ←────────────┘
```

The moment-to-moment loop is: scan the form's four icon fields top-to-bottom, glance at the pinned rule cards, reach a decision, swipe. The decision window creates sustained low-level tension. Correct decisions earn points and progress toward the next rule-set rotation. Wrong decisions or timeouts fill the stress meter (three strikes = fired). The rules change at fixed stage milestones, forcing the player to re-learn the ruleset just as they become comfortable — this is the primary escalation mechanism.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Approve form | Swipe RIGHT (≥80px horizontal) | Form flies to the right into the OUT tray with a rubber-stamp THWACK |
| Deny form | Swipe LEFT (≥80px horizontal) | Form slides to the left into a shredder with a crunch sound |
| Drag preview | Drag left/right (any distance) | Form rotates and translates with finger; shows green APPROVE overlay when tilted right >15°, red DENY overlay when tilted left >15° |
| Release without decision | Release with drag <80px | Form snaps back to center with a springy ease |
| Pause | Tap the pause button (top-right, 48×48px) | Opens pause overlay |

**Control Philosophy**: The Tinder-swipe interaction is immediately legible to any smartphone user. There is no tutorial needed for the input itself — only for the ruleset. The drag-preview with color overlay makes the decision visible and reversible right up until the release threshold, which reduces accidental wrong swipes and makes the gesture feel considered rather than panicked. The snap-back on short drags provides a physical "no, wait" action.

**Touch Area Map**:
```
┌─────────────────────────────────┐  y=0
│  [RULES BAR — pinned rules]     │  y=0..120px   (rule cards, read-only)
├─────────────────────────────────┤  y=120
│  Timer bar (full width)         │  y=120..132px
├─────────────────────────────────┤  y=132
│                                 │
│        FORM CARD                │  y=132..560px
│   (full swipe interaction zone) │
│   — drag anywhere in this area  │
│   — 80px threshold to commit    │
│                                 │
├─────────────────────────────────┤  y=560
│  [Score left] [Strikes right]   │  y=560..600px  (HUD bar)
└─────────────────────────────────┘  y=600
  Screen width: 360px reference
```

### 2.3 Scoring System

| Score Event | Base Points | Multiplier Condition |
|-------------|-------------|---------------------|
| Correct ruling | 100 | ×1.0 base |
| Correct ruling, time remaining >8s | 150 | Bonus for speed |
| Correct ruling, time remaining 4–8s | 100 | Standard |
| Correct ruling, time remaining <4s | 200 | Clutch bonus (narrow escape) |
| Correct ruling, combo chain | 100 × combo_multiplier | ×1.5 at 3 chain, ×2.0 at 5 chain, ×3.0 at 8+ chain |
| Wrong ruling / timeout | 0, strike added | — |
| Stage cleared (all forms in stage processed) | 500 | — |

**Combo System**: Consecutive correct rulings without any mistake build a combo chain. The combo counter is displayed under the form card. At chain ≥3 the multiplier activates. The chain resets to 0 on any wrong ruling or timeout. The combo counter pulses visually on each increment.

**High Score**: Saved to localStorage under key `bureaucrat-panic_high_score`. Displayed on game over screen and main menu. A "NEW BEST!" banner appears on game over if the session score exceeds the stored high score.

### 2.4 Progression System

The game is organized into stages. Each stage contains a fixed batch of forms (count increases with stage number). After the batch is processed the stage ends, new/modified rules may be introduced, and the next stage begins.

**Progression Milestones**:

| Stage Range | New Element Introduced | Decision Window | Active Rules |
|-------------|----------------------|-----------------|--------------|
| 1–2 | Single rule, basic icon set (4 applicant types, 3 request types) | 12s | 1 rule |
| 3–4 | Second rule added, expanded icon set (6 applicant types, 5 request types) | 10s | 2 rules |
| 5–7 | Third rule added, RULE FLIP (one rule inverts mid-stage) | 9s | 3 rules |
| 8–11 | Fourth rule, OVERRIDE STAMP introduced (special rare form that ignores one rule) | 8s | 4 rules |
| 12–19 | Contradicting rules possible (two rules conflict for edge cases — player must identify priority) | 7s | 4 rules + priority tag |
| 20+ | All elements active, random rule rotation every 4 forms | 6s | 4 rules, rotating |

**Forms per stage**: `4 + floor(stage / 2)`, capped at 12 forms per stage.

### 2.5 Lives and Failure

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Wrong ruling (swipe incorrect direction) | +1 strike, stress meter fills one segment | None (no recovery per strike) |
| Timer expires (12s idle or slow) | Auto-wrong-answer applied, +1 strike | None |
| 3 strikes accumulated | FIRED — game over sequence plays | Watch rewarded ad to continue from current stage with 0 strikes |

The stress meter is three segments displayed as a crumpling paper icon in the top-right HUD. Each strike turns one segment red. At three red segments the desk-clear animation plays and the game over screen appears.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Stages are generated procedurally from a deterministic seed derived from the stage number. The form generator selects applicant icon, request icon, time-of-day icon, and modifier badge from weighted pools that expand as the stage number increases. The rule generator selects rule cards from a master rule library using the stage number as an index into a difficulty-weighted selection function.

**Generation Algorithm**:
```
Stage Generation Parameters:
  seed          = stageNumber * 7919 (prime salt)
  formCount     = min(4 + floor(stageNumber / 2), 12)
  ruleCount     = min(1 + floor(stageNumber / 2), 4)  [hard cap: 4]
  decisionWindow = max(12 - floor(stageNumber * 0.4), 6) seconds
  ruleFlipChance = stageNumber >= 5 ? 0.25 per stage : 0
  overrideChance = stageNumber >= 8 ? 0.10 per form  : 0
  iconPoolSize   = min(4 + stageNumber, 12) applicant types
  requestPoolSize = min(3 + floor(stageNumber / 1.5), 10) request types

Form Construction:
  1. Roll applicant icon from current pool (seeded random)
  2. Roll request icon from current pool
  3. Roll time-of-day icon: DAWN / DAY / DUSK / NIGHT
  4. Roll modifier badge: NONE (70%) / URGENT (15%) / RESTRICTED (10%) / OVERRIDE (5%, stage 8+)
  5. Determine correct ruling by evaluating form against active rules in priority order

Rule Construction:
  1. Select ruleCount rules from stage-appropriate rule library subset
  2. Ensure at least one rule is evaluable against the current form batch
  3. Stage 5+: mark one rule as FLIPPABLE (inverts halfway through stage)
  4. Stage 12+: allow one CONFLICT pair where rule A and rule B give opposite answers
     for specific icon combos — player must use the priority tag to resolve
```

### 3.2 Difficulty Curve

```
Difficulty
    │
100 │                                          ─────────── (cap at stage 20)
    │                                    ╱
 80 │                              ╱
    │                       ╱  rule
 60 │                  ╱   contradictions
    │         ╱   overrides
 40 │    ╱   rule flips
    │  ╱
 20 │╱  1-2 rules, 12s window
    │
  0 └────────────────────────────────────────── Stage
    0    4     8    12    16    20    24+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1–2 | Stage 3–7 | Stage 8–11 | Stage 12–19 | Stage 20+ |
|-----------|-----------|-----------|------------|-------------|-----------|
| Decision window | 12s | 10–9s | 8s | 7s | 6s |
| Active rules | 1 | 2–3 | 4 | 4 | 4 rotating |
| Forms per stage | 4–5 | 5–7 | 6–9 | 8–11 | 12 |
| Icon pool size | 4 applicants, 3 requests | 6, 5 | 8, 7 | 10, 9 | 12, 10 |
| Rule flip | No | Stage 5+ (25%) | Yes | Yes | Yes |
| Override stamp | No | No | 10% | 10% | 15% |
| Contradicting rules | No | No | No | Yes (1 pair) | Yes (multiple) |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every form in a stage must have exactly one correct answer derivable from the active rules. The generator evaluates all forms after construction and regenerates any form that produces an ambiguous answer (unless the stage intentionally introduces contradiction mechanics, in which case the priority tag must resolve the ambiguity).
2. **Variety Threshold**: No two consecutive forms in a stage may share the same applicant icon AND the same request icon.
3. **Difficulty Monotonicity**: Decision window never increases between stages. Rule count never decreases between stages.
4. **Rest Stages**: Every 5 stages, one form in the stage is a trivially obvious form where the applicant and request obviously satisfy the sole most-prominent rule. This is the "easy one" that lets the player breathe.
5. **Rule Introduction Stages**: On stages 3, 5, 8, and 12, a new rule slides in with a 3-second "NEW RULE!" highlight animation before the first form of that stage appears.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Clean government-office aesthetic with a hint of comedy. Flat design, bold outlines, desaturated paper tones for form backgrounds, vivid icon colors. Think a 1970s DMV form meets a modern emoji set. All game objects are SVG-based.

**Aesthetic Keywords**: Bureaucratic, absurdist, flat, bold, legible

**Reference Palette Mood**: Aged manila paper, government-blue ink, red rubber-stamp ink, fluorescent-tube white office lighting

### 4.2 Color Palette

| Role | Color Name | Hex | Usage |
|------|-----------|-----|-------|
| Primary | Government Blue | #2B4C8C | Rule card borders, approve overlay tint, HUD accents |
| Secondary | Stamp Red | #C0392B | Deny overlay tint, strike indicators, FIRED text |
| Background | Office Cream | #F5F0E8 | Game area background, form card base color |
| Approved Accent | Rubber-stamp Green | #27AE60 | Approve tint overlay on swipe right, correct feedback flash |
| Denied Accent | Shredder Red | #E74C3C | Deny tint overlay on swipe left, wrong feedback flash |
| Timer Fill | Deadline Orange | #E67E22 | Timer bar fill, turns red in final 3 seconds |
| Timer Danger | Alert Red | #E74C3C | Timer bar color when <3s remaining |
| UI Text | Ink Black | #1A1A2E | All labels, form text, HUD text |
| Rule Card Background | Pale Blue | #EBF5FB | Active rule card backgrounds |
| Disabled / Empty | Paper Gray | #BDC3C7 | Empty strike segments, inactive elements |
| Combo Text | Gold | #F39C12 | Combo counter text, score floating popups |
| Background Shadow | Warm Gray | #D5CFC4 | Desk surface texture behind form card |

### 4.3 SVG Specifications

All graphics are SVG strings defined in `config.js`, encoded via `btoa()` in BootScene, and referenced by texture key.

**Form Card** (360×280px canvas, registered as texture `'form-card'`):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="280" viewBox="0 0 360 280">
  <!-- Card background: manila paper with subtle ruled lines -->
  <rect width="360" height="280" rx="8" ry="8" fill="#F5F0E8" stroke="#C8B99A" stroke-width="2"/>
  <!-- Top header band: government blue bar -->
  <rect x="0" y="0" width="360" height="44" rx="8" ry="8" fill="#2B4C8C"/>
  <!-- Header continues as rectangle below rounded top -->
  <rect x="0" y="22" width="360" height="22" fill="#2B4C8C"/>
  <!-- Ruled lines on paper -->
  <line x1="20" y1="80" x2="340" y2="80" stroke="#D5CFC4" stroke-width="1"/>
  <line x1="20" y1="120" x2="340" y2="120" stroke="#D5CFC4" stroke-width="1"/>
  <line x1="20" y1="160" x2="340" y2="160" stroke="#D5CFC4" stroke-width="1"/>
  <line x1="20" y1="200" x2="340" y2="200" stroke="#D5CFC4" stroke-width="1"/>
  <!-- Form number stamp area top-right -->
  <rect x="290" y="50" width="54" height="22" rx="3" fill="#EBF5FB" stroke="#2B4C8C" stroke-width="1"/>
</svg>
```

**Applicant Icons** (48×48px each, one SVG per type, registered as `'icon-human'`, `'icon-ghost'`, `'icon-robot'`, `'icon-werewolf'`, `'icon-dragon'`, `'icon-wizard'`, `'icon-vampire'`, `'icon-alien'`, `'icon-skeleton'`, `'icon-golem'`, `'icon-mermaid'`, `'icon-phoenix'`):
```svg
<!-- Example: ghost applicant (icon-ghost) -->
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <ellipse cx="24" cy="22" rx="14" ry="16" fill="#FFFFFF" stroke="#1A1A2E" stroke-width="2"/>
  <rect x="10" y="28" width="28" height="12" fill="#FFFFFF" stroke="#1A1A2E" stroke-width="2"/>
  <!-- wavy bottom -->
  <path d="M10 40 Q16 44 22 40 Q28 36 34 40 Q40 44 38 40" fill="#FFFFFF" stroke="#1A1A2E" stroke-width="2"/>
  <!-- eyes -->
  <circle cx="19" cy="22" r="3" fill="#1A1A2E"/>
  <circle cx="29" cy="22" r="3" fill="#1A1A2E"/>
</svg>
```

**Request Icons** (48×48px each, registered as `'req-noise'`, `'req-flame'`, `'req-overtime'`, `'req-haunting'`, `'req-flight'`, `'req-magic'`, `'req-parking'`, `'req-demolition'`, `'req-loud'`, `'req-transform'`):
```svg
<!-- Example: noise permit (req-noise) -->
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <!-- speaker cone -->
  <polygon points="12,18 22,18 30,10 30,38 22,30 12,30" fill="#2B4C8C" stroke="#1A1A2E" stroke-width="2"/>
  <!-- sound waves -->
  <path d="M33 16 Q39 24 33 32" fill="none" stroke="#2B4C8C" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M36 12 Q44 24 36 36" fill="none" stroke="#2B4C8C" stroke-width="2" stroke-linecap="round"/>
</svg>
```

**Time-of-Day Icons** (36×36px each, registered as `'time-dawn'`, `'time-day'`, `'time-dusk'`, `'time-night'`):
```svg
<!-- Example: night (time-night) -->
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
  <circle cx="18" cy="18" r="16" fill="#1A1A2E" stroke="#2B4C8C" stroke-width="2"/>
  <!-- crescent moon -->
  <path d="M22 10 A12 12 0 1 0 22 26 A8 8 0 1 1 22 10 Z" fill="#F5F0E8"/>
</svg>
```

**Modifier Badge Icons** (32×32px, registered as `'badge-urgent'`, `'badge-restricted'`, `'badge-override'`):
```svg
<!-- Example: OVERRIDE badge -->
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <polygon points="16,2 30,28 2,28" fill="#E67E22" stroke="#1A1A2E" stroke-width="2"/>
  <text x="16" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#1A1A2E">!</text>
</svg>
```

**Rubber Stamp APPROVED** (120×60px, registered as `'stamp-approved'`):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60">
  <rect width="120" height="60" rx="4" fill="none" stroke="#27AE60" stroke-width="4"/>
  <text x="60" y="40" text-anchor="middle" font-size="22" font-weight="900"
        fill="#27AE60" font-family="monospace" letter-spacing="2">APPROVED</text>
</svg>
```

**Rubber Stamp DENIED** (120×60px, registered as `'stamp-denied'`):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60">
  <rect width="120" height="60" rx="4" fill="none" stroke="#C0392B" stroke-width="4"/>
  <text x="60" y="40" text-anchor="middle" font-size="22" font-weight="900"
        fill="#C0392B" font-family="monospace" letter-spacing="2">DENIED</text>
</svg>
```

**Rule Card** (160×80px per card, registered as `'rule-card'`):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80" viewBox="0 0 160 80">
  <rect width="160" height="80" rx="6" fill="#EBF5FB" stroke="#2B4C8C" stroke-width="2"/>
  <!-- Title band -->
  <rect x="0" y="0" width="160" height="24" rx="6" ry="6" fill="#2B4C8C"/>
  <rect x="0" y="12" width="160" height="12" fill="#2B4C8C"/>
  <text x="80" y="17" text-anchor="middle" font-size="10" fill="#FFFFFF"
        font-family="monospace" letter-spacing="1">RULE</text>
</svg>
```

**Design Constraints**:
- All SVG elements use basic shapes only (rect, circle, ellipse, line, polygon, path with simple arc commands)
- Maximum 8 elements per SVG icon
- No `<animate>` elements — all animation via Phaser tweens and transforms
- Icons must be legible at 32×32px on a mobile display (thick strokes ≥2px, high-contrast fills)

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Form card tilt | Drag begin | Phaser tween: rotation follows drag delta, max ±25° at ±160px horizontal drag |
| APPROVE overlay | Drag right >15° rotation | Green tinted overlay rect fades in from 0 to 0.6 alpha as rotation increases; shows `stamp-approved` texture |
| DENY overlay | Drag left >15° rotation | Red tinted overlay rect fades in from 0 to 0.6 alpha; shows `stamp-denied` texture |
| Card fly-out right | Commit approve | Phaser tween: card flies to x=700 with rotation=+30° over 250ms, then destroyed |
| Card shred left | Commit deny | Phaser tween: card flies to x=-340 with rotation=−30° and scaleX shrinks to 0 over 280ms |
| Card snap back | Release <80px | Phaser tween: card returns to center (x=180, y=346) with spring ease over 200ms, rotation=0 |
| New form slide in | Card committed | Next form slides in from right: x=700→180 over 300ms with ease-out |
| Rule card slide in | Stage transition | New rule slides down from y=−80 over 400ms, existing rules animate to accommodate |
| Rule flip flash | Rule-flip event | Affected rule card flashes with orange border pulse 3 times over 600ms, icon inverts |
| Timer bar drain | Every frame | Width = (timeRemaining / maxTime) × 320px, color transitions Orange→Red at 3s remaining |
| Screen flash correct | Correct ruling | Full-screen green rect, alpha 0.3 → 0 over 150ms |
| Screen flash wrong | Wrong ruling | Full-screen red rect, alpha 0.4 → 0 over 200ms |
| Strike icon fill | Strike added | Strike segment animates: scale 1.0→1.6→1.0 over 300ms, color fills to red |
| Desk-clear animation | 3rd strike (game over) | Desk items (pencil cup, plant, nameplate SVGs) fly off screen in sequence over 800ms |

---

## 5. Audio Design

### 5.1 Sound Effects

All audio is synthesized via the Web Audio API (no external files). Phaser's `this.sound` system is used for scheduling. All synthesis code lives in `config.js` as AudioContext-based helper functions.

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Swipe commit approve | Rubber stamp THWACK — sharp percussive low-mid thud with ink-splat high transient | 180ms | High |
| Swipe commit deny | Paper shredder crunch — descending buzzy grind with paper-tear texture | 220ms | High |
| Timer ticking (last 3s) | Metronome tick — clean sine-wave click at 880Hz, 20ms | 20ms | Medium |
| Correct ruling | Short ascending two-note chime (C5→E5), clean sine wave | 200ms | High |
| Wrong ruling / timeout | Buzzer — descending square-wave blat, 200Hz→120Hz | 250ms | High |
| Combo increment | Pitched tick, rises +50 cents per combo step | 80ms | Medium |
| Combo break | Descending stutter, 3 rapid low clicks | 120ms | Medium |
| New rule announcement | Three ascending office-bell dings (D5, F5, A5) | 400ms | High |
| Rule flip | Descending-then-ascending whoosh, 400Hz sine sweep | 300ms | High |
| Stage complete | Short fanfare — 4-note ascending pattern, bright sawtooth | 600ms | High |
| Game over / FIRED | Sad slide trombone glide from D4 down to A3 | 800ms | High |
| UI button tap | Soft click — 1200Hz sine, 40ms decay | 40ms | Low |
| Card snap back | Elastic pluck — 600Hz triangle with fast decay | 80ms | Low |

### 5.2 Music Concept

**Background Music**: Procedurally generated using the Web Audio API. A looping 4-bar ostinato in a minor-mode bureaucratic jazz feel. Tempo: 90 BPM. Instrumentation: bass drone on low C, sparse piano-like chords (triangle wave, soft attack), occasional vibraphone-like melody (sine with slight FM). The music intensity increases with stage number by adding rhythmic elements.

**Music State Machine**:

| Game State | Music Behavior |
|-----------|---------------|
| Menu | Slow, sleepy office loop, 80 BPM, single bass line |
| Early Stages (1–4) | 90 BPM, bass + sparse chords, lazy feel |
| Mid Stages (5–11) | 100 BPM, full ostinato, slight urgency |
| Late Stages (12+) | 110 BPM, added hi-hat pulse, driven feel |
| Final 3s of timer | Music pitch-shifts +15 cents, adds tension |
| Game Over | Music stops instantly, replaced by sad sting |
| Pause | Music volume drops to 20% over 200ms |

**Audio Implementation**: Web Audio API directly (no Howler.js required since all sounds are synthesized). A single `AudioContext` is created once in `config.js` and shared globally. This avoids any CDN dependency for audio and guarantees mobile compatibility without autoplay restrictions on synthesized sounds.

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌──────────────┐
│  Title Screen │ ← splash, auto-advances after 1.5s OR tap
└──────┬───────┘
       │
┌──────▼───────┐
│  Main Menu   │ ← PLAY, "?" (help), HIGH SCORES, sound toggle
└──────┬───────┘
       │ PLAY
┌──────▼───────┐          ┌─────────────┐
│   Game Scene │──PAUSE──▶│ Pause Overlay│
│              │          │ Resume / ?  │
│              │          │ Restart/Menu│
└──────┬───────┘          └──────┬──────┘
       │ 3 strikes                │ "?" →
       │                    ┌─────▼──────┐
       │                    │ Help Screen │
       │                    │ "Got it!"  │
       │                    └────────────┘
┌──────▼───────┐
│  FIRED Screen│ ← desk-clear animation, then score/options
│ (Game Over)  │
│  Score       │
│  High Score  │
│  CONTINUE?   │ ← rewarded ad prompt (once per session)
│  PLAY AGAIN  │
│  MENU        │
└──────────────┘
```

### 6.2 HUD Layout

```
┌─────────────────────────────────────────┐  y=0
│  [RULE 1 card]   [RULE 2 card]  [RULE 3]│  y=0..120px   — rule bar
├─────────────────────────────────────────┤  y=120
│  ████████████████████░░░░░░░░░░░░  ⏱12s │  y=120..132px — timer bar + seconds label
├─────────────────────────────────────────┤  y=132
│                                         │
│         FORM CARD (swipe zone)          │  y=132..548px
│         applicant icon (top-left)       │
│         request icon (top-right)        │
│         time-of-day icon (bottom-left)  │
│         modifier badge (bottom-right)   │
│                                         │
├─────────────────────────────────────────┤  y=548
│  SCORE: 4250 ×1.5  │  ▐▌▌ COMBO 3  │ ⚠⚠○ │  y=548..600px — bottom HUD
└─────────────────────────────────────────┘  y=600
  Reference width: 360px
  Reference height: 600px (Phaser canvas)
  Actual viewport fills device screen via CSS scaling
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Rule bar | x=0, y=0, full width, h=120px | 1–4 rule cards (each 160×80px with icon pair), slides in on stage change | On stage transition |
| Timer bar | x=20, y=122, w=320px, h=8px | Fill rect drains left-to-right each second; color orange→red at 3s | Every frame |
| Timer label | x=340, y=130 | "12s" countdown, right-aligned, 14px bold | Every second |
| Score | x=16, y=574 | "SCORE: 4250" in 16px monospace | On each correct ruling |
| Multiplier | x=130, y=574 | "×1.5" gold text, hidden when multiplier=1 | On combo change |
| Combo counter | x=210, y=574 | "COMBO 3" in gold, fades out after 2s of no increment | On combo change |
| Strikes | x=305, y=568 | Three crumpled-paper icons (⚠), filled=red, empty=gray, each 22px | On strike |
| Pause button | x=328, y=8 (top-right) | "⏸" 32×32px tappable area (48×48px touch target) | — |

### 6.3 Menu Structure

**Main Menu** (full Phaser scene — `MenuScene`):
- Game title "BUREAUCRAT PANIC" in bold government-blue stencil font, centered at y=140
- Subtitle "You have 12 seconds per form." in gray, y=185
- PLAY button: center, y=300, 200×56px, blue fill, white text "PLAY ▶", large touch target
- "?" button: x=300, y=540, 48×48px circle, government-blue border — opens HelpScene
- Trophy icon: x=60, y=540, 48×48px — shows high score overlay
- Sound toggle: x=300, y=490, speaker icon, toggles music/SFX on/off

**Pause Menu** (semi-transparent overlay over GameScene, rendered in `ui.js`):
- Dim overlay: full screen, rgba(0,0,0,0.65)
- "PAUSED" label, y=200, white, 28px bold
- RESUME button: y=280, 160×48px
- "?" button: y=340, 160×48px — opens HelpScene with returnTo='pause'
- RESTART button: y=400, 160×48px
- MENU button: y=460, 160×48px

**Game Over / FIRED Screen** (Phaser scene `GameOverScene`):
- Red "FIRED." stamp text, large, centered, y=120, animated stamp-down effect on enter (scale 2.0→1.0 over 200ms)
- Desk-clear animation plays first (800ms), then screen fades to cream
- "STAGE REACHED: X" in ink black, y=220
- "YOUR SCORE: XXXXX" in large monospace, y=270
- "BEST: XXXXX" below, y=310, gold if new high score, gray if not
- "NEW BEST!" banner if new record (gold ribbon, scale-punch animation)
- "CONTINUE? Watch Ad →" button: y=380, orange, 240×52px (only shown once per session)
- "PLAY AGAIN" button: y=450, blue, 240×52px
- "MENU" button: y=510, outline-only, 160×44px

**Help / How to Play Screen** (`HelpScene`):

Full scene with `returnTo` parameter (either `'menu'` or `'pause'`).

Layout (scrollable if needed, 360×600px canvas):

```
┌────────────────────────────────────────┐
│  HOW TO PLAY                  [×close] │  y=0..48
├────────────────────────────────────────┤
│  YOUR JOB                              │  y=60
│  Process permit forms before time's up │
│                                        │
│  THE FORM                              │  y=110
│  ┌──────────────────────────────────┐  │
│  │ [ghost icon] │ [noise icon]      │  │  applicant | request
│  │ [moon icon]  │ [urgent badge]    │  │  time-of-day | modifier
│  └──────────────────────────────────┘  │
│                                        │
│  THE RULES (at top of screen)          │  y=220
│  ┌────────────┐ ┌────────────┐         │
│  │ RULE       │ │ RULE       │         │  rule card examples
│  │ [icon=icon]│ │ [icon≠icon]│         │
│  └────────────┘ └────────────┘         │
│                                        │
│  SWIPE RIGHT → APPROVE                 │  y=320
│  ←──── [form card SVG diagram] ────→   │
│  SWIPE LEFT  ← DENY                    │
│                                        │
│  SCORING                               │  y=400
│  ✓ Correct = 100 pts                   │
│  ⚡ Clutch (<4s left) = 200 pts        │
│  🔥 Combo ×3 chain = ×1.5             │
│                                        │
│  TIPS                                  │  y=470
│  • Scan the FORM top-left first        │
│  • Rules change every few stages       │
│  • 3 mistakes = FIRED!                 │
│                                        │
│  ┌────────────────────────────────┐    │
│  │           GOT IT!              │    │  y=550
│  └────────────────────────────────┘    │
└────────────────────────────────────────┘
```

The control diagram SVG (swipe illustration) shows a form card centered with a right-arrow labeled "APPROVE" in green and a left-arrow labeled "DENY" in red, with a hand/finger icon at the bottom of the card.

```svg
<!-- Swipe diagram SVG inline in HelpScene -->
<svg width="280" height="80" viewBox="0 0 280 80">
  <!-- Left arrow: DENY -->
  <polygon points="30,40 55,25 55,35 100,35 100,45 55,45 55,55" fill="#E74C3C"/>
  <text x="15" y="70" font-size="11" fill="#E74C3C" font-family="monospace">DENY</text>
  <!-- Form card outline -->
  <rect x="110" y="15" width="60" height="50" rx="4" fill="#F5F0E8" stroke="#C8B99A" stroke-width="2"/>
  <!-- Right arrow: APPROVE -->
  <polygon points="250,40 225,25 225,35 180,35 180,45 225,45 225,55" fill="#27AE60"/>
  <text x="238" y="70" font-size="11" fill="#27AE60" font-family="monospace">OK</text>
</svg>
```

**Settings Screen** (small overlay, accessible from main menu gear icon — not implemented in POC; note for post-launch):
- Sound Effects: On/Off toggle
- Music: On/Off toggle

### 6.4 Transitions

| Transition | From | To | Method |
|-----------|------|----|--------|
| Title → Menu | Splash auto-dismiss | Main Menu | Phaser scene.start('MenuScene'), fade 200ms |
| Menu → Game | Play button tap | GameScene | Camera fade-out 200ms, scene.start('GameScene') |
| Stage end → Next stage | Last form committed | Same GameScene, new rules | Rule-update animation plays in-place (no scene change) |
| Game → FIRED screen | 3rd strike | GameOverScene | Desk-clear animation (800ms), then camera fade 300ms, scene.start('GameOverScene') |
| Any → Help | "?" tap | HelpScene (overlay-style via scene.launch with 'returnTo' param) | Slide up 250ms |
| Help → Return | "Got it!" tap | Previous scene | Slide down 250ms |
| FIRED → Play Again | Button tap | GameScene | Camera fade 200ms, scene.start('GameScene') |
| FIRED → Menu | Menu button | MenuScene | Camera fade 200ms |

---

## 7. Monetization

### 7.1 Ad Placements

Note: POC stage — ad hooks are placeholder functions only. No live ad SDK is integrated.

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Rewarded | "Continue?" prompt on FIRED screen | Once per session | Always (player choice) |
| Interstitial | After FIRED screen, before Play Again, every 3rd game over | Every 3rd death | After 5 seconds |
| Banner | Main menu only, bottom 60px | Always on menu | N/A |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Continue | Watch rewarded ad on FIRED screen | Strikes reset to 0, resume current stage | Once per game session |
| Score boost | Watch rewarded ad on FIRED screen (secondary option) | Final score ×2, post-game only | Once per session |

### 7.3 Session Economy

Expected session: 4–7 minutes, ~20–40 forms processed, 1–3 deaths per session. The rewarded continue ad targets the natural frustration peak (just got fired). The interstitial cadence (every 3rd death) keeps monetization pressure low enough for a casual audience while ensuring revenue from engaged players.

```
[Play Free] → [FIRED — 3 strikes] → [CONTINUE? Watch Ad]
                    │ Yes → [Resume stage, 0 strikes] → [More play] → [Interstitial on next death]
                    │ No  → [FIRED Screen]
                               │
                    [Interstitial (every 3rd death)]
                               │
                    [PLAY AGAIN / MENU]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/bureaucrat-panic/
├── index.html              # Entry point, loads all scripts in order
├── css/
│   └── style.css           # Responsive layout, canvas scaling, mobile-first
└── js/
    ├── config.js           # Constants, SVG strings, rule library, icon pools, difficulty tables
    ├── stages.js           # Stage generation algorithm, form construction, rule selection
    ├── ads.js              # Ad trigger hooks (placeholder), reward callbacks
    ├── ui.js               # MenuScene, GameOverScene, HUD overlay, pause overlay
    ├── help.js             # HelpScene with illustrated swipe diagrams
    ├── game.js             # GameScene: input, form card physics, timer, strike logic
    └── main.js             # BootScene (texture registration), Phaser.Game init — LOADS LAST
```

**Script load order in index.html** (config FIRST, main LAST):
```html
<script src="js/config.js"></script>
<script src="js/stages.js"></script>
<script src="js/ads.js"></script>
<script src="js/ui.js"></script>
<script src="js/help.js"></script>
<script src="js/game.js"></script>
<script src="js/main.js"></script>   <!-- MUST BE LAST -->
```

### 8.2 Module Responsibilities

**config.js** (target ~220 lines):
- `COLORS` object: all hex values
- `DIMS` object: `{ width: 360, height: 600, rulesBarHeight: 120, formY: 340, formW: 320, formH: 220 }`
- `DIFFICULTY` table: array indexed by stage range with `{ decisionWindow, ruleCount, formCount, ruleFlipChance, overrideChance }`
- `SCORE_VALUES`: `{ correct: 100, clutchBonus: 100, stageBonus: 500, comboThresholds: [3,5,8], comboMultipliers: [1.5, 2.0, 3.0] }`
- `SVG_STRINGS` object: all SVG source strings keyed by texture name
- `RULE_LIBRARY`: array of rule objects `{ id, applicantTag, requestTag, timeTag, verdict, labelIcon1, labelIcon2 }`
- `ICON_APPLICANTS`: ordered array of applicant type keys, expanded by stage
- `ICON_REQUESTS`: ordered array of request type keys, expanded by stage
- `createAudioContext()`: factory for shared Web Audio context
- `synthStamp()`, `synthShred()`, `synthBuzz()`, `synthChime()`, `synthCombo(n)`: audio synthesis functions

**stages.js** (target ~200 lines):
- `generateStage(stageNumber)` → `{ forms: FormData[], rules: RuleData[], decisionWindow: number }`
- `generateForm(ruleSet, seed)` → `FormData { applicant, request, timeOfDay, modifier, correctVerdict }`
- `selectRules(stageNumber, seed)` → `RuleData[]`
- `evaluateForm(form, rules)` → `'approve' | 'deny'`
- `getDecisionWindow(stageNumber)` → seconds (number)
- `getDifficultyParams(stageNumber)` → params from DIFFICULTY table

**ads.js** (target ~60 lines):
- `AdsManager` singleton
- `AdsManager.onGameOver(deathCount)`: checks if interstitial should show (every 3rd)
- `AdsManager.showRewardedContinue(onRewarded, onDismissed)`: placeholder, calls onRewarded immediately in POC
- `AdsManager.showInterstitial(onClosed)`: placeholder, calls onClosed immediately in POC
- `AdsManager.showBanner()` / `hideBanner()`: placeholder

**ui.js** (target ~280 lines):
- `MenuScene extends Phaser.Scene`: title, play button, help button, high score display
- `GameOverScene extends Phaser.Scene`: FIRED animation, score display, continue/play-again/menu buttons, ad trigger
- `HUDManager`: not a scene — a helper class instantiated inside GameScene; manages score text, timer bar, strike icons, combo counter; exposes `updateScore(n)`, `updateStrikes(n)`, `updateCombo(n)`, `updateTimer(pct, secondsLeft)`, `stageTransition(newRules)`

**help.js** (target ~140 lines):
- `HelpScene extends Phaser.Scene`
- `init(data)`: reads `data.returnTo` ('menu' or 'pause')
- `create()`: renders all help content with SVG diagrams, scrollable container if height >560px
- "Got it!" button calls `this.scene.stop('HelpScene')` and resumes the return-to scene

**game.js** (target ~290 lines):
- `GameScene extends Phaser.Scene`
- `create()`: spawns first stage via `generateStage(1)`, creates form card group, registers pointer events, starts timer, initializes HUDManager
- `update(time, delta)`: drains timer each frame; if timer hits 0, calls `onTimeout()`
- `onPointerDown(pointer)`: records drag start position
- `onPointerMove(pointer)`: updates form card position and rotation; shows/hides approve/deny overlay
- `onPointerUp(pointer)`: commits or snaps back based on horizontal distance
- `commitDecision(verdict)`: evaluates correctness, awards points, adds strike if wrong, calls juice effects, queues next form
- `onCorrect()`: score update, combo increment, juice sequence (stamp sound, screen flash, float text, scale punch)
- `onWrong()`: strike add, shake, red flash, buzz sound; if strike 3 → `onFired()`
- `onTimeout()`: treated identically to `onWrong()`
- `onFired()`: stops timer, plays desk-clear animation, transitions to GameOverScene after 1100ms
- `startNextForm()`: slides in next form card from right; if stage batch exhausted, calls `advanceStage()`
- `advanceStage()`: increments stage counter, calls `generateStage()`, animates rule bar update, sets `stageTransitioning` flag to prevent double-advance (CRITICAL: clear flag after transition completes)
- `applyRuleFlip(ruleIndex)`: animates the rule card flip and inverts its verdict

**main.js** (target ~70 lines):
- `BootScene extends Phaser.Scene`: iterates `SVG_STRINGS` object, calls `this.textures.addBase64(key, 'data:image/svg+xml;base64,' + btoa(svgString))` for each; waits for all `addtexture` events before calling `this.scene.start('MenuScene')`
- `Phaser.Game` config: `{ type: Phaser.AUTO, width: 360, height: 600, backgroundColor: '#F5F0E8', scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene], scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH } }`
- Global state: `window.GameState = { highScore: 0, gamesPlayed: 0, sessionDeaths: 0, continuedThisSession: false }`; loaded from localStorage in BootScene

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | 3.60.0 | `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js` | Game engine, rendering, input, scenes |

No Howler.js needed — all audio is Web Audio API synthesis in `config.js`.

### 8.4 Performance Targets

| Metric | Target | Measurement |
|--------|--------|------------|
| Frame rate | 60fps stable | Phaser FPS counter |
| Load time | <2s on 4G | Performance.timing |
| Memory | <80MB | Chrome DevTools |
| JS bundle | <120KB total (no CDN) | File size check |
| Time to first interaction | <1s after load | Splice after BootScene completes |

---

## 9. Juice Specification

### 9.1 Player Input Feedback (every swipe commit)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Form card center | Count: 12, Direction: radial burst, Color: #27AE60 (approve) or #E74C3C (deny), Lifespan: 400ms, Speed: 80–160px/s, Scale: 4px circles shrinking to 0 |
| Screen flash | Camera/full-screen overlay | Correct: green #27AE60 alpha 0.3→0 over 150ms; Wrong: red #E74C3C alpha 0.4→0 over 200ms |
| Scale punch | Form card (just before fly-out) | Scale 1.0→1.25→fly-out, punch over 80ms before commit tween begins |
| Sound | — | Correct: rubber stamp THWACK (180ms percussive); Wrong: shredder crunch (220ms buzzy) |
| Haptic | Device vibration | Correct: 30ms vibration pulse; Wrong: 60ms double-pulse (30ms on, 15ms off, 30ms on) via `navigator.vibrate()` |

### 9.2 Core Action Additional Feedback (swipe-to-approve — most frequent correct action)

| Effect | Values |
|--------|--------|
| Rubber stamp drop | "APPROVED" stamp texture drops onto form from y−80 with scale 1.5→1.0 over 100ms before card flies away |
| Hit-stop | 40ms physics/tween pause (achieved via `setTimeout(() => resumeTweens(), 40)` — NEVER use `timeScale=0` + `delayedCall()`) |
| Score float text | "+100" text spawns at form center, rises 70px upward, fades out over 600ms, color #F39C12 gold, font-size 24px bold |
| Score HUD punch | Score text container scales 1.0→1.4→1.0 over 200ms |
| Combo escalation | At combo 3: particles increase to 18, stamp-drop scale 1.8→1.0; At combo 5: particles 24, gold screen edge vignette flashes; At combo 8+: particles 32, stamp text pulses 2× before fly-out, score float "+CLUTCH COMBO" banner |

### 9.3 Death/Failure Effects (on 3rd strike — FIRED)

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 12px, Duration: 350ms, Decay: linear, random X+Y offset each frame |
| Red screen vignette | Full-screen radial gradient overlay (transparent center → #C0392B at edges), alpha 0.0→0.5 over 200ms, holds for 400ms, then fades |
| Sound | Sad trombone slide, D4→A3, 800ms, immediately on 3rd strike |
| Desk-clear animation | After 300ms: pencil cup slides off left (200ms), plant flies up-right (250ms, 300ms delay), nameplate flips down (150ms, 500ms delay) — total 800ms |
| Effect → UI display delay | 1100ms total from 3rd strike to GameOverScene appearing |
| Death → restart maximum time | Tap "PLAY AGAIN" → GameScene visible within **1.8 seconds** (under 2s hard limit) |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating score text | "+100" or "+200 CLUTCH!", Color: #F39C12, Font: 24px bold monospace, Spawns at form card center (x=180, y=340), Moves up 70px over 600ms, Fades alpha 1.0→0 starting at 300ms |
| Score HUD punch | `scoreText` container: scale 1.0→1.4→1.0 over 200ms using Phaser tween with `ease: 'Back.easeOut'` |
| Combo text animation | Combo text base font-size 16px; at combo 3: 18px; at combo 5: 22px gold; at combo 8+: 26px gold with outline; each increment: scale punch 1.0→1.3→1.0 over 120ms |
| Stage bonus float | "+500 STAGE CLEAR" floats from center of screen upward 90px over 800ms on stage completion |

---

## 10. Implementation Notes

### 10.1 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`
- **Touch Events**: Use Phaser pointer events only (`this.input.on('pointerdown'/'pointermove'/'pointerup')`). Do not add raw `addEventListener` touch handlers.
- **Prevent Defaults**: Add `touch-action: none` via CSS on `#game-container` and `canvas`. Add `document.addEventListener('touchmove', e => e.preventDefault(), { passive: false })` in index.html to suppress pull-to-refresh.
- **Orientation**: Portrait-only. CSS `@media (orientation: landscape)` shows a "Please rotate your device" overlay. The Phaser canvas does NOT resize — the overlay covers it.
- **Safe Areas**: Canvas container uses `padding-top: env(safe-area-inset-top)` in CSS to avoid notch overlap on iOS.
- **Visibility Change**: `document.addEventListener('visibilitychange', () => { if (document.hidden) scene.scene.pause() })` in GameScene.

### 10.2 Critical Bug Prevention

The following bugs from prior pipeline runs MUST NOT appear in this game:

1. **CSS display:none kills Phaser canvas** — NEVER use `display:none` on the canvas or its parent. Use `visibility: hidden; height: 0; overflow: hidden` for hiding elements.
2. **Stage timer guard missing** — `advanceStage()` must set a `stageTransitioning = true` flag immediately and only clear it after the full rule-bar animation completes. The `update()` loop must check `if (this.stageTransitioning) return` before processing any stage-advance logic.
3. **Static→Dynamic body conversion** — Not applicable (no physics engine in this game — form card movement is pure Phaser tweens, no Matter.js).
4. **Hit-stop via timeScale=0** — NEVER use `this.time.timeScale = 0`. The 40ms hit-stop is achieved via `setTimeout()` pausing tween objects manually.
5. **Texture key collision on restart** — All textures are registered ONCE in BootScene. GameScene.create() must NEVER call `textures.addBase64()`.
6. **Script load order** — `main.js` MUST load last. Any scene class defined in `ui.js`, `game.js`, or `help.js` must already be defined before `main.js` runs the `Phaser.Game` constructor.
7. **Text blocking buttons** — All text overlaid on buttons must have `setInteractive(false)` or be placed at a lower depth than the button's interactive zone.

### 10.3 Edge Cases

| Scenario | Expected Behavior |
|---------|-----------------|
| Rapid swipe before previous form exits | Input locked from commit until `startNextForm()` slide-in completes (200ms lock) |
| Swipe during rule-flip animation | Input locked for 600ms duration of rule-flip animation; timer pauses during lock |
| App backgrounded during timer | `visibilitychange` handler pauses GameScene; timer does not drain while hidden |
| Device rotated to landscape | Landscape overlay appears immediately; game loop pauses; resuming portrait un-pauses |
| Very fast swipe (fling velocity >1200px/s) | Treat as committed swipe in the fling direction regardless of 80px threshold |
| Timer expires on first form ever | Counts as wrong, strike 1; first-form tutorial hint shows: "Swipe to decide!" for 1.5s |
| High score in localStorage corrupted | `parseInt()` with fallback to 0; corrupted values default to 0 |
| Override badge on form | Timer displays "OVERRIDE" label; correct ruling is always APPROVE regardless of rules; player must recognize the badge |

### 10.4 Performance Tips

- Form card is a single Phaser Image object with a Graphics mask — no per-frame SVG rendering.
- Rule cards are pre-rendered to Phaser RenderTextures at stage start, not redrawn each frame.
- Particle bursts use Phaser's built-in `ParticleEmitter` with a simple circle texture (8×8px white circle registered in BootScene).
- Maximum active tweens at any moment: 4 (form card, score float, strike fill, combo counter).
- Desk-clear animation uses 3 pre-positioned Image objects (pencil-cup, plant, nameplate SVGs) that exist throughout gameplay at depth 0, invisible, made visible only during the game-over sequence.

### 10.5 Testing Checkpoints

| Checkpoint | What to Verify |
|------------|---------------|
| After BootScene | All texture keys registered, no console errors, MenuScene loads cleanly |
| After first form | Form card appears at correct position, icons visible, timer bar drains, pointer events fire |
| After first correct swipe | Score increments, particles burst, THWACK sound plays, new form slides in |
| After first wrong swipe | Strike counter increments, red flash, buzz sound |
| After 3rd strike | Desk-clear animation plays, GameOverScene loads within 1.1s |
| Stage 3 | Second rule appears in rule bar with slide-in animation |
| Stage 5 | Rule flip triggers mid-stage, rule card pulses orange |
| Idle 12s | Timer expires, auto-wrong triggers identical to manual wrong swipe |
| Continue ad | Rewarded ad hook fires, strikes reset to 0 on reward |
| Landscape rotation | Overlay appears, game pauses, portrait restore unpauses |
| Restart from GameOver | New game starts within 1.8s of tapping PLAY AGAIN |
| Help from menu | HelpScene slides up, all diagrams visible, "Got it!" returns to menu |
| Help from pause | HelpScene slides up, "Got it!" returns to pause overlay (not menu) |

---

## Appendix A: Rule Library (Master List)

Rules are stored as objects with two icon conditions and a verdict. The `condition` field specifies which form attributes trigger the rule and what the verdict must be.

| Rule ID | Natural Language | Icon 1 | Icon 2 | Verdict |
|---------|-----------------|--------|--------|---------|
| R01 | Ghosts may not apply for noise permits | `icon-ghost` | `req-noise` | DENY |
| R02 | All daytime permits for dragons are approved | `icon-dragon` | `time-day` | APPROVE |
| R03 | Flame permits are only for dragons | `req-flame` (non-dragon) | — | DENY |
| R04 | Robots cannot work overtime on Sundays | `icon-robot` + `req-overtime` | `time-night` | DENY |
| R05 | Haunting permits only valid at night | `req-haunting` + NOT `time-night` | — | DENY |
| R06 | Wizards get magic permits automatically | `icon-wizard` | `req-magic` | APPROVE |
| R07 | URGENT forms skip all rules | `badge-urgent` | — | APPROVE |
| R08 | Vampires denied any daytime permit | `icon-vampire` + `time-day` | — | DENY |
| R09 | Werewolves need noise exemption at dusk only | `icon-werewolf` + `req-noise` + `time-dusk` | — | APPROVE |
| R10 | Restricted forms require supervisor — deny all | `badge-restricted` | — | DENY |
| R11 | Aliens approved for flight permits anytime | `icon-alien` | `req-flight` | APPROVE |
| R12 | Skeletons denied demolition permits | `icon-skeleton` | `req-demolition` | DENY |
| R13 | No parking permits at night for anyone | `req-parking` + `time-night` | — | DENY |
| R14 | Golems approved for all construction work | `icon-golem` | `req-demolition` | APPROVE |
| R15 | Mermaids denied all overtime applications | `icon-mermaid` | `req-overtime` | DENY |
| R16 | Phoenixes get flame permits at dawn only | `icon-phoenix` + `req-flame` + NOT `time-dawn` | — | DENY |
| R17 | Loud permits denied after dusk | `req-loud` + (`time-dusk` OR `time-night`) | — | DENY |
| R18 | OVERRIDE badge: approve regardless of rules | `badge-override` | — | APPROVE (ignore rules) |

Rules R01–R06 are available from stage 1. R07–R12 unlock from stage 5. R13–R18 unlock from stage 10. The generator selects from the available pool to ensure rules are evaluable against the current icon pool.

---

## Appendix B: Icon-to-Texture Key Mapping

| Display Name | Texture Key | Used In |
|-------------|------------|---------|
| Human | `icon-human` | Form applicant field |
| Ghost | `icon-ghost` | Form applicant field |
| Robot | `icon-robot` | Form applicant field |
| Werewolf | `icon-werewolf` | Form applicant field |
| Dragon | `icon-dragon` | Form applicant field |
| Wizard | `icon-wizard` | Form applicant field |
| Vampire | `icon-vampire` | Form applicant field |
| Alien | `icon-alien` | Form applicant field |
| Skeleton | `icon-skeleton` | Form applicant field |
| Golem | `icon-golem` | Form applicant field |
| Mermaid | `icon-mermaid` | Form applicant field |
| Phoenix | `icon-phoenix` | Form applicant field |
| Noise Permit | `req-noise` | Form request field |
| Flame Permit | `req-flame` | Form request field |
| Overtime | `req-overtime` | Form request field |
| Haunting | `req-haunting` | Form request field |
| Flight | `req-flight` | Form request field |
| Magic | `req-magic` | Form request field |
| Parking | `req-parking` | Form request field |
| Demolition | `req-demolition` | Form request field |
| Loud Permit | `req-loud` | Form request field |
| Transform | `req-transform` | Form request field |
| Dawn | `time-dawn` | Form time field |
| Day | `time-day` | Form time field |
| Dusk | `time-dusk` | Form time field |
| Night | `time-night` | Form time field |
| Urgent Badge | `badge-urgent` | Form modifier field |
| Restricted Badge | `badge-restricted` | Form modifier field |
| Override Badge | `badge-override` | Form modifier field |
| Form Card | `form-card` | Form background |
| Rule Card | `rule-card` | Rule bar |
| Stamp Approved | `stamp-approved` | Approve overlay |
| Stamp Denied | `stamp-denied` | Deny overlay |
| Particle | `particle-dot` | Juice particle emitter |
| Pencil Cup | `deco-pencilcup` | Desk-clear animation |
| Plant | `deco-plant` | Desk-clear animation |
| Nameplate | `deco-nameplate` | Desk-clear animation |
