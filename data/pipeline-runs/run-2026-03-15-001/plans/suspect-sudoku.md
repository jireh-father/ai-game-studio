# Game Design Document: Suspect Sudoku

**Slug**: `suspect-sudoku`
**One-Liner**: You have 15 seconds to solve a crime — yes, every single crime.
**Core Mechanic**: Read icon-based clue tags on 2-5 suspects, mentally intersect constraints to find the one guilty party, and tap them before the timer expires.
**Target Session Length**: 4-7 minutes
**Date Created**: 2026-03-15
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Suspect Sudoku is a speed-deduction mobile game where every 8-15 seconds the player must solve a tiny logic puzzle: a handful of cartoon suspects each wearing icon clue tags, exactly one of whom is guilty of a ridiculous crime. The player reads the clue tags, mentally crosses off the innocent parties, and taps the culprit before the countdown bar hits zero. A wrong tap costs a life; a timeout also costs a life. Three lost badges end the run.

The game is built on a single supremely satisfying loop: the "it must be the hamster" moment of certainty, delivered dozens of times per session. Each case lasts under 15 seconds from presentation to verdict, which means a two-minute session produces a dozen of these deduction highs. Cases escalate in complexity — more suspects, tighter time limits, red-herring clues, and eventually rule-inversion clues that flip constraints — but the core satisfaction of confident elimination never changes.

Tone is deliberately absurd: crimes include "Stole the remote," "Ate the birthday cake," and "Forwarded a chain email." Suspects are a rotating cast of animal icons (cat, dog, hamster, parrot, goldfish, turtle). This humor transforms each case into a joke setup and verdict into a punchline, making wrong guesses funny rather than frustrating and generating strong social-sharing impulse.

### 1.2 Target Audience

Casual mobile gamers aged 16-40 who enjoy word puzzles, trivia, and light logic games. Play context: commute, waiting rooms, toilet, short breaks. Skill expectation: no prior puzzle experience needed; early stages teach all mechanics through play. Players who enjoyed Wordle, Mini Crossword, or Among Us deduction will feel immediately at home.

### 1.3 Core Fantasy

You are a hotshot detective who cracks cases in seconds flat. Every tap of the guilty suspect is a mic-drop verdict — no deliberation, just clean logic. The fantasy is effortless genius: you see what others miss, and you do it under pressure.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 4-7 minutes |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 22%+ |
| Average Cases per Session | 12-20 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[New Case Appears] → [Read Crime Icon + Clue Tags] → [Eliminate Suspects] → [Tap Guilty Party]
        ↑                                                                           │
        │                                                              ┌────────────┴────────────┐
        │                                                              │ Correct → Score + Streak│
        │                                                              │ Wrong   → Lose Badge    │
        │                                                              │ Timeout → Lose Badge    │
        │                                                              └────────────┬────────────┘
        │                                                                           │
        └──────────────────────────────── [Next Case / Game Over if 0 badges] ─────┘
```

**Moment-to-moment description:**

1. The case header flies in from the top: a crime icon (e.g., birthday cake with a bite taken out) plus a short title ("The Case of the Eaten Cake"). The timer bar — full width, bright green — begins draining immediately.

2. Two to five suspect cards animate in from the bottom, each showing a cartoon animal icon and 2-3 clue tags (colored icon badges on their card). Clue tag examples: red footprint icon (was near the scene), clock icon showing "3 PM" (active at time of crime), fish icon (has motive — loves fish), crossed-out alibi scroll icon (alibi failed).

3. The player reads the clues and mentally eliminates suspects. Exactly one suspect satisfies all non-red-herring clues. The player taps that suspect's card.

4. Feedback fires immediately: correct tap triggers a rubber GUILTY stamp animation on the card with confetti; wrong tap triggers a grey INNOCENT stamp with a sad sound. Either way, a short score/consequence animation plays and the next case begins within 600ms.

5. The streak counter in the top bar updates. If the player reaches 3 wrong verdicts total (across the entire run), the game ends.

**Decision structure:** Every case is a constraint intersection. There is always exactly one valid answer. The player's task is pattern matching: "needs to match ALL highlighted clues." Red herrings are clues that look relevant but belong to a category that was explicitly exonerated by another clue (e.g., "the thief had muddy paws — the suspect has muddy paws BUT the thief was seen at 9 AM and this suspect has a 'sleeping' tag at 9 AM").

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Select suspect | Tap suspect card | Registers verdict — immediately shows GUILTY or INNOCENT stamp |
| Pause | Tap pause icon (top-right) | Opens pause overlay, timer freezes |
| Open help | Tap "?" button | Opens How to Play from menu or pause overlay |

**Control Philosophy**: The game requires exactly one gesture — a confident tap. There are no swipes, no drags, no holds. This maps perfectly to the "decisive verdict" fantasy. The entire screen below the HUD bar is split into equally-sized suspect cards, making each tap target enormous and forgiving.

**Touch Area Map**:
```
┌─────────────────────────────────┐  ← 360-428px wide
│ [🔍Score] [Case 7] [⭐streak] [⏸]│  ← Top HUD bar: 56px tall
├─────────────────────────────────┤
│ ████ CRIME HEADER ████████████ │  ← Crime icon + title: 72px tall
│ [🎂] The Case of the Eaten Cake │
├─────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░ │  ← Timer bar: 12px tall, green→red
├─────────────────────────────────┤
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │  [CAT]   │  │  [DOG]   │    │  ← Suspect cards: fill remaining height
│  │  🐾 🕐  │  │  🐾 🎂  │    │     Each card ≥ 140px wide, ≥ 160px tall
│  └──────────┘  └──────────┘    │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │ [HAMSTR] │  │ [PARROT] │    │
│  │  🎂 ❌  │  │  🕐 🐾  │    │
│  └──────────┘  └──────────┘    │
│                                 │
└─────────────────────────────────┘
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Correct verdict | 100 base | × streak multiplier (see below) |
| Speed bonus | +10 per second remaining | No multiplier |
| Perfect case (no hesitation, solved in top 25% of time) | +50 bonus | Applied before streak multiplier |
| Wrong verdict | 0 points, lose badge | Resets streak multiplier to ×1 |
| Timeout | 0 points, lose badge | Resets streak multiplier to ×1 |

**Streak Multiplier**:
- Streak 1-4: ×1.0
- Streak 5-9: ×1.5 (display: "×1.5 HOT STREAK")
- Streak 10-14: ×2.0 (display: "×2 ON FIRE")
- Streak 15+: ×3.0 (display: "×3 GENIUS MODE")
- Wrong verdict or timeout: resets streak to 0 and multiplier to ×1.0

**High Score**: Tracked as total score in localStorage under `suspect-sudoku_high_score`. Displayed on game over screen with "NEW RECORD!" animation if beaten. Also track `suspect-sudoku_highest_streak` for bragging rights.

### 2.4 Progression System

The player progresses through numbered cases. The case number equals the stage number. Difficulty ramps on a smooth curve — each new batch of 5 cases introduces one new element.

**Progression Milestones**:

| Case Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-5 | 2 suspects, 2 clues each, 15s timer, no red herrings | Tutorial — any player should pass |
| 6-10 | 3 suspects, 1 red herring clue per case, 13s timer | Easy — light elimination required |
| 11-20 | 3-4 suspects, 2 red herrings, 11s timer | Medium — careful reading needed |
| 21-35 | 4 suspects, 3 red herrings, 9s timer | Hard — speed-reading under pressure |
| 36-50 | 4-5 suspects, rule-inversion clues introduced, 9s timer | Very Hard — inversion forces re-reading |
| 51+ | 5 suspects, mixed clue types, 8s timer, rare double-inversion | Extreme — only expert deducers survive |

**Rest Stages**: Every 10th case (10, 20, 30…) is a "slam dunk" case — 2 suspects, only 1 obvious clue, 15 seconds. Provides a breather and a guaranteed streak-continuation opportunity.

**Milestone banners**: At cases 5, 10, 20, 30, 50 a congratulatory banner flashes for 800ms ("Case 10 Cracked! Detective Level Up!") before the next case begins. These do not pause the session — they overlay briefly.

### 2.5 Lives and Failure

The player has 3 detective badges (lives). Each wrong verdict or timeout removes one badge. When all 3 badges are gone, the run ends.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Tapping an innocent suspect | Lose 1 badge; INNOCENT stamp appears | Watch rewarded ad to restore 1 badge (once per run) |
| Timer expires before tapping | Lose 1 badge; TIMEOUT banner flashes | Watch rewarded ad to restore 1 badge (once per run) |
| 3rd badge lost | Game over; run ends | Watch ad to continue with 1 badge restored |

Badges are displayed in the top-right corner of the HUD as detective badge icons — filled (gold) when held, cracked-and-grey when lost.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Every case is procedurally generated at runtime using a deterministic seeded algorithm. The generation guarantees exactly one correct answer per case.

**Generation Algorithm**:
```
Case Generation Parameters:
  Input:  caseNumber (integer, 1..∞)

  Step 1: Compute difficulty tier
    tier = getDifficultyTier(caseNumber)
    → suspectCount  : 2-5 (from tier table)
    → clueCount     : 2-4 clues per suspect (from tier table)
    → redHerrings   : 0-3 (from tier table)
    → timerSeconds  : 15 down to 8 (from tier table)
    → inversionClues: false until case 36+

  Step 2: Pick the crime
    crimeIndex = (caseNumber * 7 + sessionSalt) % CRIMES.length
    crime = CRIMES[crimeIndex]
    → crime has: icon (SVG key), title string, requiredClueCategory[]

  Step 3: Pick guilty suspect
    guiltyIndex = seededRandom(caseNumber, 0) % suspectCount
    guiltyAnimal = pickAnimal(suspectCount, guiltyIndex)

  Step 4: Assign clues to guilty suspect
    For each requiredClueCategory in crime.requiredClueCategories (2-3):
      guiltyClues.push(pickClue(category, "matching"))
    → Guilty suspect's clues all point toward guilt

  Step 5: Assign clues to innocent suspects
    For each innocent suspect:
      For each clue slot:
        if (redHerringBudget > 0 && seededRandom() > 0.5):
          assign a "matching" clue from a requiredCategory (red herring)
          redHerringBudget--
        else:
          assign a "non-matching" clue that differs in at least one category
    → Ensure each innocent suspect fails to match on at least ONE required category

  Step 6: Validation pass
    Verify: exactly one suspect matches ALL required categories
    If validation fails: increment salt and regenerate (max 3 retries)

  Step 7: Shuffle suspect card order
    finalOrder = fisherYates(suspects, seed=caseNumber * 13 + sessionSalt)
```

**Clue Tag Pool** (used across all cases):

| Category | Icon | Meaning |
|----------|------|---------|
| Location | footprint SVG | Was near the scene |
| Time | clock SVG | Active at crime time |
| Motive | heart-with-item SVG | Has desire for crime target |
| Alibi | scroll-with-X SVG | Alibi verified/failed |
| Evidence | magnifying glass SVG | Physical evidence found |
| Inversion (stage 36+) | red-X over any icon | Suspect was NOT at location / NOT at time / etc. |

**Crime Pool** (minimum 30 entries, expandable):
Examples: Eaten Birthday Cake, Stolen TV Remote, Knocked Over the Plant, Forwarded Chain Email, Drank the Last Coffee, Sat on the Laptop Keyboard, Hid the Car Keys, Used All the Hot Water, Spoiled Movie Ending, Ate the Last Cookie.

Each crime has 2-3 required clue categories that the guilty party must satisfy.

### 3.2 Difficulty Curve

```
Time Pressure (lower = harder)
    │
15s │●●●●●
12s │     ●●●●●
10s │          ●●●●●●●●●●
 9s │                    ●●●●●●●●●●●●●●●
 8s │                                   ●●●●●●●…
    └──────────────────────────────────────────── Case #
     1   6   11  21  36  51+

Suspect Count
    │
 5  │                              ●●●●●●●●●…
 4  │               ●●●●●●●●●●●●●
 3  │     ●●●●●●●●●
 2  │●●●●●
    └──────────────────────────────────────────── Case #
     1   6   11  21  36
```

**Difficulty Parameters by Stage Range**:

| Parameter | Case 1-5 | Case 6-15 | Case 16-30 | Case 31-50 | Case 51+ |
|-----------|----------|-----------|------------|------------|----------|
| Timer (seconds) | 15 | 13 | 11 | 9 | 8 |
| Suspect Count | 2 | 3 | 3-4 | 4 | 4-5 |
| Clues per Suspect | 2 | 2-3 | 3 | 3 | 3-4 |
| Red Herrings | 0 | 1 | 2 | 2-3 | 3 |
| Inversion Clues | No | No | No | Rare (1/5) | Common (1/3) |
| Rest Stage Every | — | Every 10 | Every 10 | Every 10 | Every 10 |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: The validation pass in Step 6 of the algorithm ensures exactly one suspect matches all required clue categories. If generation produces zero or two valid answers, the salt is incremented and generation retries (max 3 attempts before logging a warning and simplifying the case).

2. **Variety Threshold**: Consecutive cases must use different crimes (crimeIndex advances by prime step 7) and must not have the same animal in the guilty position twice in a row.

3. **Difficulty Monotonicity**: Timer can only stay equal or decrease as case number increases. Suspect count can only stay equal or increase. Red herring count can only stay equal or increase.

4. **Rest Stages**: Every 10th case uses the Stage 1-5 parameters regardless of actual case number. Timer resets to 15s, suspects drop to 2, no red herrings. This is visually marked with a "EASY CASE" ribbon.

5. **Boss/Special Stages**: Every 25th case (25, 50, 75…) is a "Grand Jury" case: 5 suspects, 4 red herrings, 8s timer, guaranteed inversion clue. Marked with a golden border and special crime title ("The Grand Jury of the Missing Leftovers").

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Clean, flat-design cartoon. Bold outlines (3px stroke), rounded corners everywhere, saturated pastel fills. Inspired by board game card aesthetics — each suspect card looks like a physical playing card held in a judge's hand.

**Aesthetic Keywords**: Cozy, absurd, playful, legible, punchy

**Reference Palette Mood**: Think Clue board game meets Among Us character cards — friendly, colorful, instantly readable at a glance.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Soft cream | #FFF8EE | Game scene background |
| Card face | White | #FFFFFF | Suspect card background |
| Card border (neutral) | Warm grey | #CCBBAA | Default suspect card border |
| Card border (guilty flash) | Verdict red | #E84040 | GUILTY stamp overlay color |
| Card border (innocent flash) | Slate grey | #888888 | INNOCENT stamp overlay color |
| Timer bar (full) | Fresh green | #4ECB71 | Timer bar start color |
| Timer bar (mid) | Amber | #F5A623 | Timer bar at ~50% |
| Timer bar (danger) | Alarm red | #E84040 | Timer bar below 25% |
| HUD background | Deep navy | #1A2340 | Top HUD bar |
| HUD text | Off-white | #F0EAD6 | Score, case number, streak |
| Badge gold (live) | Bright gold | #FFD700 | Active detective badge icon |
| Badge broken (lost) | Cracked grey | #777777 | Lost detective badge icon |
| Streak accent | Hot orange | #FF6B35 | Streak counter, multiplier text |
| Crime header bg | Warm yellow | #FFF0C0 | Crime title banner background |
| Correct green | Verdict green | #27AE60 | GUILTY stamp, confetti base |
| Accent purple | Highlight | #7B5EA7 | Milestone banners, special borders |

### 4.3 SVG Specifications

All graphics are inline SVG strings defined in `config.js`, registered as base64 textures in BootScene.

**Suspect Animal Icons** (6 total, each 80×80px viewBox):

CAT icon (`'suspect-cat'`):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <!-- Body: rounded orange circle -->
  <circle cx="40" cy="45" r="28" fill="#F4A261" stroke="#333" stroke-width="3"/>
  <!-- Head: slightly offset circle -->
  <circle cx="40" cy="30" r="20" fill="#F4A261" stroke="#333" stroke-width="3"/>
  <!-- Left ear: triangle -->
  <polygon points="24,16 20,4 32,12" fill="#F4A261" stroke="#333" stroke-width="2.5"/>
  <!-- Right ear: triangle -->
  <polygon points="56,16 60,4 48,12" fill="#F4A261" stroke="#333" stroke-width="2.5"/>
  <!-- Eyes: two black dots -->
  <circle cx="34" cy="28" r="3.5" fill="#222"/>
  <circle cx="46" cy="28" r="3.5" fill="#222"/>
  <!-- Nose: small pink triangle -->
  <polygon points="40,33 37,37 43,37" fill="#FF8FA3"/>
  <!-- Whiskers: 4 lines -->
  <line x1="20" y1="35" x2="36" y2="34" stroke="#555" stroke-width="1.5"/>
  <line x1="20" y1="38" x2="36" y2="37" stroke="#555" stroke-width="1.5"/>
  <line x1="44" y1="34" x2="60" y2="35" stroke="#555" stroke-width="1.5"/>
  <line x1="44" y1="37" x2="60" y2="38" stroke="#555" stroke-width="1.5"/>
</svg>
```

DOG icon (`'suspect-dog'`): Same structure, fill `#C68642`, floppy ears (rounded rect each side), no whiskers, wider nose `<ellipse cx="40" cy="36" rx="5" ry="3" fill="#A0522D"/>`.

HAMSTER icon (`'suspect-hamster'`): Fill `#E8C49A`, round chubby cheeks (`<ellipse cx="29" cy="34" rx="10" ry="8" fill="#F0D0B0"/>` both sides), tiny round ears.

PARROT icon (`'suspect-parrot'`): Fill `#56A95E` (green body), yellow beak `<polygon points="40,34 36,40 44,40" fill="#FFD700"/>`, red head crest `<path d="M40 14 C38 8 34 6 36 14" fill="#E84040"/>`.

GOLDFISH icon (`'suspect-goldfish'`): Fill `#FF8C42`, horizontal oval body `<ellipse cx="40" cy="42" rx="24" ry="14" fill="#FF8C42"/>`, fan tail `<polygon points="64,32 78,24 78,60 64,52" fill="#FF6B1A"/>`.

TURTLE icon (`'suspect-turtle'`): Fill `#6BAF6B` (shell), `#4A8A4A` (shell pattern hexagons), `#8BCB6B` (head/limbs).

**Clue Tag Icons** (8 types, each 24×24px viewBox, used as small badges on suspect cards):

Footprint (`'clue-footprint'`): `<ellipse cx="12" cy="16" rx="5" ry="7" fill="#7B5EA7"/>` plus 4 small toe ovals above.

Clock (`'clue-clock'`): `<circle cx="12" cy="12" r="10" fill="#FFF" stroke="#333" stroke-width="2"/>`, clock hands `<line x1="12" y1="12" x2="12" y2="6"/>` + `<line x1="12" y1="12" x2="16" y2="14"/>`.

Heart-with-cake (`'clue-motive'`): `<path d="M12 20 C6 14 2 10 6 6 C10 2 12 6 12 6 C12 6 14 2 18 6 C22 10 18 14 12 20Z" fill="#E84040"/>`.

Scroll-with-X (alibi failed) (`'clue-alibi-fail'`): Scroll rectangle `<rect x="4" y="6" width="16" height="12" rx="2" fill="#FFF8DC" stroke="#888" stroke-width="1.5"/>`, red X `<line x1="8" y1="10" x2="16" y2="14" stroke="#E84040" stroke-width="2.5"/>` + `<line x1="16" y1="10" x2="8" y2="14" stroke="#E84040" stroke-width="2.5"/>`.

Magnifying glass (`'clue-evidence'`): `<circle cx="10" cy="10" r="7" fill="none" stroke="#F5A623" stroke-width="2.5"/>`, `<line x1="15" y1="15" x2="21" y2="21" stroke="#F5A623" stroke-width="2.5"/>`.

Red-X inversion overlay (`'clue-inversion'`): Full 24×24 red X on transparent background. Applied on top of any other clue icon to signal inversion.

**GUILTY Stamp** (`'stamp-guilty'`, 120×60px):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60">
  <rect x="2" y="2" width="116" height="56" rx="8" fill="none" stroke="#E84040" stroke-width="5" stroke-dasharray="4 2" opacity="0.9"/>
  <text x="60" y="40" font-family="Arial Black, sans-serif" font-size="26" font-weight="900" fill="#E84040" text-anchor="middle" letter-spacing="4" opacity="0.9">GUILTY</text>
</svg>
```

**INNOCENT Stamp** (`'stamp-innocent'`, 140×60px): Same structure, text "INNOCENT", stroke and fill color `#888888`.

**TIMEOUT Stamp** (`'stamp-timeout'`, 140×60px): Text "TIMEOUT", color `#F5A623`.

**Detective Badge** (`'badge-active'`, 40×40px):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
  <polygon points="20,2 25,14 38,14 28,22 32,36 20,28 8,36 12,22 2,14 15,14" fill="#FFD700" stroke="#C9A800" stroke-width="2"/>
  <circle cx="20" cy="19" r="7" fill="#1A2340"/>
  <text x="20" y="23" font-family="Arial" font-size="9" fill="#FFD700" text-anchor="middle">🔍</text>
</svg>
```

**Detective Badge Broken** (`'badge-lost'`, 40×40px): Same star shape, fill `#777777`, crack lines `<path d="M18 12 L22 22 L17 28" stroke="#555" stroke-width="1.5" fill="none"/>`.

**Design Constraints**:
- All SVG elements must be simple enough to render at 60fps on mobile devices
- Maximum 12 path elements per SVG object
- Use basic shapes (rect, circle, ellipse, polygon, line) over complex paths
- SVG strings defined in config.js as string constants; encoded to base64 in BootScene only once

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| GUILTY stamp splat | Correct tap | Stamp image appears at scale 2.0, tweens to scale 1.0 in 120ms with slight rotation (−5 to +5 degrees random), alpha 0→1 in 60ms |
| INNOCENT stamp | Wrong tap | Stamp appears same as above but grey; card shakes 3px left-right 3 times over 150ms |
| Confetti burst | Correct tap | 20 colored circles (8px radius each, random from palette) spray outward from tap point, travel 60-120px in random directions, fade out over 500ms |
| Timer bar color shift | Continuous | Linear interpolation from #4ECB71 at full → #F5A623 at 50% → #E84040 at 25%; transitions smoothly each frame |
| Timer pulse | Last 5 seconds | Timer bar pulses scale 1.0→1.05→1.0 every 600ms, intensifying to every 300ms at last 2 seconds |
| Suspect card bounce-in | Case start | Each card tweens from y+120px off-screen to final position, staggered by 80ms per card, using Phaser easeOutBack (overshoot) |
| Crime header drop | Case start | Header slides from y−80px to final position in 250ms, easeOutCubic |
| Streak fire | Streak ≥ 5 | Streak number shows orange glow pulse (Phaser glow FX, intensity 1.0→2.0→1.0, period 800ms) |
| Wrong verdict badge crack | Badge lost | Badge icon shakes 2px for 200ms, then swaps to broken sprite with particle debris (4 grey shards fly outward 20px, fade in 300ms) |
| Milestone banner | Every 10 cases | Full-width purple banner slides down from top, holds 600ms, slides back up in 200ms. No pause to gameplay. |
| Rest case ribbon | Every 10th case | Green ribbon badge "EASY CASE" on crime header, 500ms bounce-in animation |
| Grand Jury gold border | Every 25th case | All suspect cards get animated gold border (dashed stroke that rotates via stroke-dashoffset animation, speed 8px/frame) |

---

## 5. Audio Design

### 5.1 Sound Effects

All audio implemented as Web Audio API tones generated procedurally (no external audio files). Uses Howler.js for cross-browser compatibility, with synthesized buffers.

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Correct verdict (GUILTY tap) | Deep rubber-stamp THUD — low-frequency thud (80Hz), sharp attack 5ms, decay 200ms | 220ms | High |
| Wrong verdict (INNOCENT tap) | Sad trombone descend — three descending sine tones (440→330→220Hz), 80ms each | 280ms | High |
| Timer tick | Soft metronome click — 1200Hz triangle wave, 20ms duration | 20ms | Low (plays every second) |
| Timer danger tick | Louder, higher click — 1600Hz, 25ms, plays every 500ms below 5s remaining | 25ms | Medium |
| Timer expire (timeout) | Buzzer — 200Hz square wave, 400ms, with pitch slide down to 100Hz | 400ms | High |
| Streak milestone (×1.5) | Rising chime — 523→659Hz, 100ms each | 200ms | Medium |
| Streak milestone (×2.0) | Double chime — 523→659→784Hz, 80ms each | 280ms | Medium |
| Streak milestone (×3.0) | Triple fanfare — 523→659→784→1047Hz | 360ms | High |
| Streak break | Short deflating sound — 600→200Hz sweep, 300ms | 300ms | Medium |
| Badge lost | Crack sound — white noise burst 30ms + low tone 120Hz 200ms | 230ms | High |
| Game over | Descending scale — 440→330→247→185Hz, 120ms each, then 150ms silence, then low drone 120Hz 600ms | 1200ms | High |
| Case start sting | Upbeat two-note pickup — 784→1047Hz, 60ms each | 130ms | Medium |
| Milestone banner | Short ascending flourish — 4 notes rising, 60ms each | 250ms | Low |
| Button tap | Light click — 800Hz sine, 30ms | 30ms | Low |
| Score float | Brief sparkle — 1200Hz + 1600Hz + 2000Hz simultaneously, 80ms | 80ms | Low |

### 5.2 Music Concept

**Background Music**: Upbeat jazz-detective loop, procedurally generated from a short chord progression (Cmaj7 → Am7 → Dm7 → G7) played on a synthesized piano/bass pattern. Tempo: 128 BPM during gameplay, 96 BPM on menu.

**Music State Machine**:
| Game State | Music Behavior |
|-----------|---------------|
| Menu | Relaxed 96 BPM jazz loop, volume 0.5 |
| Case 1-10 | 128 BPM loop, volume 0.6 |
| Case 11-30 | Same loop + subtle hi-hat layer, volume 0.65 |
| Case 31+ | Faster variation 140 BPM, volume 0.7 |
| Last 5s of timer | Music pitch shifts up +15 cents, volume 0.8 |
| Wrong verdict / timeout | Music volume dips to 0.3 for 500ms, restores |
| Game over | Music fades out over 1000ms |
| Pause | Music volume reduces to 0.2 |

**Audio Implementation**: Howler.js via CDN (`https://cdn.jsdelivr.net/npm/howler@2/dist/howler.min.js`). Audio buffers synthesized via Web Audio API, loaded into Howler sprites. If Howler fails to load, game continues silently (non-blocking).

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌──────────┐     ┌──────────┐     ┌───────────────┐
│  Title   │────→│   Menu   │────→│  Game Screen  │
│  Screen  │     │  Screen  │     │ (GameScene +  │
│(2s anim) │     │          │     │  HUD overlay) │
└──────────┘     └────┬─────┘     └───────┬───────┘
                      │                   │
                  ┌───┴───┐          ┌────┴────┐
                  │  Help │          │  Pause  │──→┌──────────┐
                  │  Page │          │ Overlay │   │  Help    │
                  └───────┘          └────┬────┘   │  Page    │
                                         │        └──────────┘
                                    ┌────┴────┐
                                    │  Game   │
                                    │  Over   │
                                    │ Screen  │
                                    └────┬────┘
                                         │
                                    ┌────┴────────────┐
                                    │ Continue? (Ad)  │
                                    │ [Watch Ad] [No] │
                                    └────┬────────────┘
                                         │
                                    ┌────┴────┐
                                    │ Play    │
                                    │ Again / │
                                    │  Menu   │
                                    └─────────┘
```

### 6.2 HUD Layout

```
┌─────────────────────────────────┐  360px wide
│ [🔍 1,250] [Case 7 🔎] [⭐×1.5] [⏸]│  ← HUD bar: 56px, navy #1A2340
│ ██ Badge ██ Badge ██ Badge      │  ← Badges row: 20px, directly below HUD
├─────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░ │  ← Timer bar: 12px, color-shifting
│ ┌──────────────────────────────┐│
│ │ [🎂] The Case of Eaten Cake  ││  ← Crime header: 68px, cream #FFF0C0
│ └──────────────────────────────┘│
│                                 │
│  ┌──────────┐  ┌──────────┐    │  ← Suspect cards grid (2-5 cards)
│  │ [ANIMAL] │  │ [ANIMAL] │    │    Each: 140×160px for 2-3 suspects
│  │ [clue1]  │  │ [clue1]  │    │    Shrinks to 110×140px for 4-5
│  │ [clue2]  │  │ [clue2]  │    │
│  └──────────┘  └──────────┘    │
│                                 │
└─────────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left of HUD bar | "🔍 {score}" with icon, right-justified in 120px zone | Every correct verdict, scale punch on update |
| Case number | Top-center of HUD bar | "Case {N}" with magnifying glass icon | On case transition |
| Streak/Multiplier | Top-center-right | "⭐×{multiplier}" or streak count; glow effect at 5+ | On every verdict |
| Pause button | Top-right of HUD bar | "⏸" icon, 40×40px tap zone | Tap opens pause overlay |
| Badges | Row directly below HUD bar | 3 badge icons left-aligned, 36px each with 8px gap | On badge state change |
| Timer bar | Below badge row | Full-width color-shifting bar, 12px tall | Every frame (rAF) |
| Crime header | Below timer bar | Crime icon (32px) + title text, cream background | On new case |
| Combo/streak popup | Center of gameplay area | "+50 SPEED BONUS!" or "×2 ON FIRE!", floats up 40px, fades in 700ms | On qualifying events |

### 6.3 Menu Structure

**Title Screen** (2-second animation on first load):
- Detective silhouette walks across screen L→R
- Title "SUSPECT SUDOKU" drops in letter by letter over 800ms
- Subtitle "Crack the case. Before time's up." fades in
- Automatically transitions to Main Menu after 2s, or on any tap

**Main Menu**:
- Game title (top, 32px bold)
- High score display: "Best: {score} | Record Streak: {streak}" (subtle, grey)
- PLAY button (large, 280×60px, green #4ECB71, rounded, centered)
- "?" How to Play button (64×64px circular, purple #7B5EA7, bottom-left)
- Settings gear icon (40×40px, top-right)
- Trophy/high scores icon (40×40px, top-right, adjacent to gear)

**Pause Menu** (semi-transparent overlay #1A2340 at 80% opacity):
- "PAUSED" header text (white, 28px bold)
- RESUME button (large green)
- "?" How to Play button (purple, secondary size)
- RESTART button (orange, secondary size — with 1-tap confirm: button turns red and says "Confirm?" for 1.5s)
- QUIT TO MENU button (grey, small)

**Game Over Screen** (full scene transition, 600ms slide-up from bottom):
- Detective icon with slumped posture (sad variant)
- "CASE CLOSED" header (large, dark red)
- Score: animated count-up from 0 to final score over 1200ms
- "Case #{N} reached" subtext
- "Best Streak: {N}" subtext
- NEW RECORD! banner (if high score broken) — gold, pulsing
- "Watch Ad to Continue" button (if no prior ad this run): shows 1 badge icon reward, large
- "Play Again" button (large green)
- "Menu" button (small grey)

**Help / How to Play Screen** (full overlay from either menu or pause):
See Section 6.4 below.

**Settings Screen** (small modal overlay, 280×200px centered):
- "Sound Effects" row: label + toggle switch (On/Off), default On
- "Music" row: label + toggle switch, default On
- Background tap or X button closes overlay

### 6.4 Help / How to Play Page (Mandatory)

Accessible from: Main Menu "?" button AND Pause overlay "?" button.
Returns to previous screen via "GOT IT!" button.

**Layout** (full screen, navy background #1A2340, scrollable if needed):

```
┌─────────────────────────────────┐
│       HOW TO PLAY               │  ← White title, 24px bold
│       Suspect Sudoku            │  ← Purple subtitle
├─────────────────────────────────┤
│  THE CRIME                      │  ← Section header (gold)
│  ┌──────────────────────────┐   │
│  │ [🎂 icon]  A crime icon  │   │  ← SVG illustration: crime header
│  │ appears with a funny     │   │     matching actual in-game art
│  │ case title               │   │
│  └──────────────────────────┘   │
├─────────────────────────────────┤
│  THE SUSPECTS                   │  ← Section header (gold)
│  ┌──────────────────────────┐   │
│  │ [CAT][DOG][HAMSTER]      │   │  ← SVG illustration: 3 suspect cards
│  │  🐾  🎂   🕐             │     with clue badges visible
│  │ Each suspect has clues   │   │
│  └──────────────────────────┘   │
├─────────────────────────────────┤
│  FIND THE GUILTY ONE            │  ← Section header (gold)
│  ┌──────────────────────────┐   │
│  │ Tap the suspect who      │   │
│  │ matches ALL the clues    │   │
│  │ for the crime.           │   │
│  │                          │   │
│  │ [CLUE 1: footprint] ──→  │   │  ← SVG arrows connecting clue
│  │ [CLUE 2: clock]    ──→  │   │     icons to matching suspect
│  │                  [CAT ✓]│   │
│  └──────────────────────────┘   │
├─────────────────────────────────┤
│  TIMER                          │
│  [████████░░░░░░░] ← drain bar  │  ← SVG timer bar diagram
│  15 seconds. Runs out = 1 badge │
├─────────────────────────────────┤
│  BADGES (LIVES)                 │
│  [⭐][⭐][⭐] → lose 3 = game over│  ← SVG badge row illustration
├─────────────────────────────────┤
│  SCORING                        │
│  • Correct verdict: 100 pts     │
│  • Speed bonus: +10 per second  │
│  • Streak ×1.5 → ×2 → ×3       │
│  • Wrong tap = lose badge       │
├─────────────────────────────────┤
│  TIPS                           │
│  💡 Red herrings match 1 clue   │
│     but not ALL of them.        │
│  💡 Elimination works: if 2     │
│     clues cross off 3 suspects, │
│     the 4th must be guilty.     │
│  💡 Streak multiplier is worth  │
│     more than speed bonus early.│
├─────────────────────────────────┤
│     ┌─────────────────────┐     │
│     │     GOT IT!         │     │  ← Green button, returns to
│     └─────────────────────┘     │     previous screen
└─────────────────────────────────┘
```

All suspect icons, clue tag icons, and timer bar in the help page use the same SVG textures as the actual game. The "GOT IT!" button is 280×52px, color #4ECB71, centered, 20px from bottom.

### 6.5 Transitions

| Transition | Implementation | Duration |
|------------|---------------|----------|
| Menu → Game | Fade out menu (200ms), fade in game (200ms) | 400ms total |
| Case end → Next case | Verdict animation completes, cards slide off bottom, new cards slide in from bottom | 600ms |
| Game → Pause | Overlay slides down from top, timer visually freezes | 250ms |
| Game → Game Over | Game Over screen slides up from bottom | 500ms |
| Game Over → Play Again | Fade out (150ms), scene restart (instant), fade in (150ms) | 300ms total — must complete in under 2 seconds |
| Any → Help | Help overlay slides in from right | 300ms |
| Help → Previous | Help overlay slides out to right | 200ms |

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over screen closes | Every 3rd game over | After 5 seconds |
| Rewarded | Continue prompt after 3rd badge lost | Every game over (optional) | Always optional |
| Rewarded | "Restore 1 badge" during gameplay after first badge lost | Once per run | Always optional |
| Banner | Menu screen only | Always visible at bottom of menu | N/A |

Note: POC stage — all ad placements are hooks/placeholders. No live ad network integrated. `ads.js` provides stub functions that log to console and call reward callbacks immediately for testing.

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Continue (badge restore) | Watch rewarded ad at game over | Restore 1 badge, resume from same case | Once per run |
| Mid-game badge restore | Watch rewarded ad after losing badge 1 | Restore 1 badge immediately | Once per run |
| Score multiplier | Watch rewarded ad at game over screen | Final score ×2 (applied after display count-up) | Once per session |

### 7.3 Session Economy

A typical session: player dies after ~15 cases (4-6 minutes). Two game-overs per session on average. One rewarded ad opportunity (continue) per game-over. Interstitial every 3rd game-over = roughly once every 1.5 sessions.

```
[Play Free] → [3rd Badge Lost] → [Rewarded Ad: Continue? (restore 1 badge)]
                                       │ Yes → [Resume case, play continues]
                                       │ No  → [Game Over Screen]
                                                     │
                               [Interstitial (every 3rd game-over)]
                                                     │
                               [Rewarded Ad: Double your score?]
                                                     │ Yes → [Score ×2]
                                                     │ No  → [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/suspect-sudoku/
├── index.html              ← Entry point, meta viewport, CDN scripts, load order
├── css/
│   └── style.css           ← Mobile-first layout, game container, HUD overlay z-index
└── js/
    ├── config.js           ← Constants: colors, difficulty tables, SVG strings, crime/clue pools
    ├── stages.js           ← Case generation: pickCase(caseNum, salt) → CaseData object
    ├── ads.js              ← Ad hooks: showInterstitial(), showRewarded(callback), banner show/hide
    ├── ui.js               ← MenuScene, GameOverScene, PauseOverlay, HUD, transitions
    ├── help.js             ← HelpScene: illustrated instructions, Got It button
    ├── game.js             ← GameScene: case rendering, timer loop, tap handling, verdict logic
    └── main.js             ← BootScene (texture registration), Phaser.Game init, localStorage API
```

**Script load order in index.html** (MUST be this order — main.js LAST):
```html
<script src="js/config.js"></script>
<script src="js/stages.js"></script>
<script src="js/ads.js"></script>
<script src="js/ui.js"></script>
<script src="js/help.js"></script>
<script src="js/game.js"></script>
<script src="js/main.js"></script>
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `COLORS` object: all hex codes keyed by semantic name (BACKGROUND, CARD_FACE, TIMER_GREEN, etc.)
- `DIFFICULTY` array: indexed by tier (0-5), each entry has `{ suspectCount, timerSeconds, redHerrings, inversionEnabled }`
- `getDifficultyTier(caseNumber)`: returns tier index 0-5
- `SVG_STRINGS` object: all SVG markup strings keyed by texture name (e.g., `SVG_STRINGS['suspect-cat']`, `SVG_STRINGS['clue-footprint']`)
- `CRIMES` array: 30+ crime objects `{ id, icon, title, requiredCategories[] }`
- `CLUE_POOL` object: keyed by category, each entry is array of clue descriptors `{ icon, label, category, value }`
- `SCORE_VALUES`: `{ BASE_CORRECT: 100, SPEED_BONUS_PER_SEC: 10, PERFECT_BONUS: 50 }`
- `STREAK_THRESHOLDS`: `[{ min: 5, multiplier: 1.5 }, { min: 10, multiplier: 2.0 }, { min: 15, multiplier: 3.0 }]`

**stages.js** (max 300 lines):
- `generateCase(caseNumber, sessionSalt)`: main entry point → returns `CaseData`
- `CaseData` shape: `{ caseNumber, crime, suspects[], guiltySuspectIndex, timerSeconds, tier }`
- `Suspect` shape: `{ animalKey, clues[], isGuilty }`
- `Clue` shape: `{ iconKey, label, category, isRedHerring }`
- `validateCase(caseData)`: verifies exactly one suspect matches all non-redherring crime categories; returns bool
- `seededRandom(seed, index)`: deterministic random (LCG) for reproducible generation
- `getRestStageParams()`: returns Stage 1-5 parameters regardless of case number
- `isRestStage(caseNumber)`: `caseNumber % 10 === 0`
- `isBossStage(caseNumber)`: `caseNumber % 25 === 0`

**ads.js** (max 300 lines):
- `AdsManager` singleton
- `init()`: initialize ad SDK (stub in POC)
- `showInterstitial(onClosed)`: show interstitial, call onClosed when dismissed
- `showRewarded(onRewarded, onSkipped)`: show rewarded ad, call appropriate callback
- `showBanner()` / `hideBanner()`: banner display control
- `trackGameOver()`: increment game-over counter, trigger interstitial every 3rd
- `canShowRewarded()`: returns bool (has ad loaded, not on cooldown)
- POC behavior: all show functions call reward callback immediately after 500ms delay, log to console

**ui.js** (max 300 lines):
- `MenuScene extends Phaser.Scene`: title, high score display, Play/Help/Settings buttons
- `GameOverScene extends Phaser.Scene`: receives score/case data via `scene.start('GameOver', data)`, renders count-up, buttons, ad prompt
- `HUDManager` class (used inside GameScene): creates/updates DOM overlay elements for score, case, streak, badges, timer bar
  - `update(gameState)`: called every frame to sync timer bar width/color
  - `showStreakPopup(text)`: floating text popup
  - `badgeLostAnimation(index)`: trigger crack animation on badge N
- `PauseOverlay` class: show/hide pause menu DOM layer
- `SettingsOverlay` class: show/hide settings DOM layer
- All non-Phaser overlays (HUD, pause, settings) built as HTML/CSS layers positioned over canvas with `position: absolute; z-index: 10`. Using `visibility: hidden` (NOT `display: none`) when inactive — see Critical Bug note.

**help.js** (max 300 lines):
- `HelpScene extends Phaser.Scene`: full help screen
- `create(data)`: receives `{ returnScene: 'Menu' | 'Game' }` to know where Got It goes
- Builds all help content using Phaser GameObjects (Text + Image) — NOT DOM
- Uses same texture keys as game (`'suspect-cat'`, `'clue-footprint'`, etc.) for authentic illustrations
- Draws annotated case example: shows 3 mini suspect cards with clue badges, arrows pointing to correct answer
- Scrollable via swipe if content height > game height (Phaser camera scroll)
- "GOT IT!" button: `this.scene.start(data.returnScene)` on tap

**game.js** (max 300 lines):
- `GameScene extends Phaser.Scene`
- `create()`:
  - Initialize `gameState`: `{ score, caseNumber, streak, multiplier, badges: 3, sessionSalt, active: false }`
  - Create HUDManager instance
  - Start first case via `startNewCase()`
- `startNewCase()`:
  - Call `generateCase(gameState.caseNumber, gameState.sessionSalt)` from stages.js
  - Animate crime header in (250ms slide from top)
  - Animate suspect cards in (staggered 80ms each from bottom)
  - Set `timerRemaining = caseData.timerSeconds`
  - Set `gameState.active = true`
  - Start timer countdown
- `update(time, delta)`:
  - If `!gameState.active` return early
  - `timerRemaining -= delta / 1000`
  - Update HUD timer bar: `hud.update({ timerFraction: timerRemaining / caseData.timerSeconds })`
  - If `timerRemaining <= 0`: call `handleTimeout()`
  - If `timerRemaining <= 5`: trigger danger tick sound and timer pulse
- `handleSuspectTap(suspectIndex)`:
  - Set `gameState.active = false` immediately (prevent double-tap)
  - If correct: call `handleCorrectVerdict(suspectIndex)`
  - If incorrect: call `handleWrongVerdict(suspectIndex)`
- `handleCorrectVerdict(idx)`:
  - Show GUILTY stamp on card at idx
  - Trigger confetti burst (20 particles)
  - Calculate score: `base + speedBonus + perfectBonus`, apply multiplier
  - Update streak, recalculate multiplier
  - Update score in HUD with scale punch
  - After 600ms: clear case, `gameState.caseNumber++`, call `startNewCase()`
- `handleWrongVerdict(idx)`:
  - Show INNOCENT stamp on tapped card
  - Shake card 3× over 150ms
  - `gameState.badges--`, update badge HUD with crack animation
  - Reset streak to 0
  - If `gameState.badges === 0`: after 700ms call `handleGameOver()`
  - Else: after 700ms call `startNewCase()` (same case number — player retries same case)
- `handleTimeout()`:
  - Flash "TIMEOUT" banner over case area
  - `gameState.badges--`, update badge HUD
  - Reset streak
  - If `gameState.badges === 0`: after 700ms call `handleGameOver()`
  - Else: after 700ms call `startNewCase()` (retry same case)
- `handleGameOver()`:
  - Play game over sound
  - Save high score to localStorage if beaten
  - After 500ms: `this.scene.start('GameOver', { score: gameState.score, caseNumber: gameState.caseNumber, streak: bestStreakThisRun })`
- Tap handling: `this.input.on('pointerdown', pointer => { /* hit test each card rect, call handleSuspectTap(idx) */ })`
- Cards stored as array of `{ x, y, width, height, container }` for hit testing

**main.js** (max 300 lines):
- `BootScene extends Phaser.Scene`:
  - `preload()`: nothing (all assets generated programmatically)
  - `create()`:
    - Iterate over `SVG_STRINGS` entries
    - For each: `const b64 = 'data:image/svg+xml;base64,' + btoa(svgString)`
    - Call `this.textures.addBase64(key, b64)`
    - Listen for `addtexture-{key}` events; count completions
    - When all textures loaded: `this.scene.start('Menu')`
- `Phaser.Game` config:
  - `type: Phaser.AUTO`
  - `width: 360, height: 640` (base size; CSS scales to fit)
  - `backgroundColor: '#FFF8EE'`
  - `scene: [BootScene, MenuScene, GameScene, HelpScene, GameOverScene]`
  - `input: { activePointers: 1 }` (single touch)
  - `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }`
- `GameState` global object: `{ highScore, highestStreak, gamesPlayed, settings }`
- `loadState()`: read from localStorage, populate GameState
- `saveState()`: write GameState to localStorage
- `localStorage` keys: `suspect-sudoku_high_score`, `suspect-sudoku_highest_streak`, `suspect-sudoku_games_played`, `suspect-sudoku_settings`

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | 3.60.0 | `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js` | Game engine, scene management, input, tweens |
| Howler.js | 2.2.4 | `https://cdn.jsdelivr.net/npm/howler@2.2.4/dist/howler.min.js` | Cross-browser audio |

No other dependencies. No npm, no build step, no bundler.

### 8.4 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in `game.loop.actualFps` |
| Load Time | <2s on 4G | `performance.timing.loadEventEnd - performance.timing.navigationStart` |
| Memory Usage | <80MB | Chrome DevTools Memory panel |
| JS Total Size | <120KB (excl. CDN) | Sum of js/*.js file sizes |
| First Tap Possible | <1.5s after load | Time from navigation to BootScene complete |

---

## 9. Juice Specification (mandatory)

### 9.1 Player Input Feedback (applied to every tap on a suspect card)

| Effect | Target | Values |
|--------|--------|--------|
| Scale punch | Tapped suspect card container | Scale 1.0 → 1.15 → 1.0, total duration 120ms (60ms expand, 60ms recover), Phaser.Tweens with ease "Quad.easeOut" |
| Particles (correct) | Tapped card position | Count: 20, Shapes: circles 8px radius, Colors: random from `['#4ECB71','#FFD700','#FF6B35','#7B5EA7','#56A95E']`, Direction: radial (all 360°), Speed: 80-160px/s, Lifespan: 500ms, gravity: 0 |
| Particles (wrong) | Tapped card position | Count: 8, Color: `#888888`, Direction: radial, Speed: 40-80px/s, Lifespan: 300ms |
| Screen shake (wrong tap) | Camera | Intensity: 4px horizontal offset, Duration: 150ms, 3 oscillations |
| Sound (correct) | — | Rubber THUD 80Hz, sharp attack 5ms, decay 200ms, pitch variation: none |
| Sound (wrong) | — | Sad trombone 440→330→220Hz descend, 80ms per step, no pitch variation |
| Stamp splat (correct) | GUILTY image | Scale 2.5→1.0 in 120ms, slight random rotation −5° to +5°, alpha 0→1 in 50ms |
| Stamp splat (wrong) | INNOCENT image | Scale 2.0→1.0 in 100ms, rotation 0°, alpha 0→1 in 50ms, grey color |

### 9.2 Core Action Additional Feedback (correct verdict — most frequent satisfying input)

| Effect | Values |
|--------|--------|
| Particles | Count: 20 radial burst (detailed in 9.1 above) |
| Hit-stop | 40ms physics pause implemented via `gameState.active = false` for 40ms before processing score; visually: all card tweens freeze for 40ms |
| Camera zoom | Scale 1.0 → 1.03 → 1.0, duration 180ms, Phaser Camera zoom tween, easeInOut |
| Combo escalation | Streak 1-4: no escalation. Streak 5-9: particle count +5 (25 total), card scale punch to 1.2× instead of 1.15×. Streak 10-14: particles 30 total, scale punch 1.25×, camera zoom to 1.05×. Streak 15+: particles 40 total, scale punch 1.3×, camera zoom 1.08×, screen flash white alpha 0.15 for 60ms |
| Streak popup text | "+STREAK!" floats from card top, font-size 18px bold, color #FF6B35, moves up 50px, fades over 600ms; at milestone (5/10/15) font-size 24px, color #FFD700 |
| Score floating text | "+{points}" in white, font 16px bold, rises from card center 60px upward over 600ms, then alpha 0 |

### 9.3 Death/Failure Effects

**Per wrong verdict / timeout (badge lost, not game over):**

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 6px, Duration: 200ms, 3 oscillations left-right |
| Badge crack animation | Target badge icon: scale punch 1.3× in 60ms, then swap to `badge-lost` texture; 4 grey particle shards fly from badge 20px outward over 300ms |
| Card shake (wrong tap only) | Tapped card: moves ±4px left-right 3 times over 150ms |
| Sound | 3-tone sad trombone 440→330→220Hz per step |
| Effect → next case delay | 700ms total hold before clearing case and starting new one |
| Screen desaturation | CSS filter `grayscale(0%) → grayscale(50%)` on canvas wrapper over 200ms, then back to `grayscale(0%)` over 400ms (subtle, not full) |

**Game Over (all 3 badges lost):**

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 12px, Duration: 350ms, Phaser camera shake |
| Red flash | Canvas wrapper CSS: `background-color: #E84040`, alpha 0 → 0.25 in 80ms, then 0.25 → 0 in 300ms |
| Music fade | Volume 0.7 → 0 over 1000ms |
| Sound | Game-over descending scale (see Section 5.1), starts 200ms after last badge crack |
| Screen desaturation | CSS `grayscale(0%) → grayscale(80%)` over 400ms, holds for 200ms, then Game Over scene begins |
| Effect → Game Over UI | 500ms hold after badge crack before transitioning to GameOverScene |
| Death → restart maximum | 1800ms total (500ms hold + 300ms transition anim + instant scene create + 1000ms score count-up). Player can tap "Play Again" during count-up to skip to 0ms. **Must be under 2 seconds from tap.** |

### 9.4 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating score text | "+{calculated points}", white `#FFFFFF`, font "Arial Black" 16px bold, appears at center of verdict card, moves up 60px over 600ms, fades alpha 1→0 over last 200ms of movement |
| Speed bonus text | If speed bonus applies: "+{N} SPEED!" in yellow `#FFD700`, 14px, appears 20px below main score float, same movement |
| Score HUD punch | Score display: scale 1.0 → 1.35 → 1.0, duration 150ms (80ms expand, 70ms recover), color briefly flashes #FFD700 for 120ms |
| Streak multiplier display | Streak text in HUD: scale 1.0 → 1.4 → 1.0 over 200ms when multiplier changes; text color shifts from #F0EAD6 → #FF6B35 → #FFD700 as multiplier rises (1.5→2.0→3.0) |
| Perfect bonus | "+50 PERFECT!" in #FFD700 with 1px white text-shadow, 18px bold, rises 80px from card center, fades over 800ms |
| Milestone popup | At case 5/10/20/30/50: "CASE {N} CRACKED! 🔍" purple banner (#7B5EA7), slides down from top of game area 40px, holds 600ms, slides back up; font 20px bold white |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser `game.loop.actualFps` (log if below 55 for 3 consecutive seconds) |
| Load Time | <2s on 4G | `performance.now()` at BootScene complete vs navigation start |
| Memory Usage | <80MB | Chrome DevTools Memory panel at case 50 |
| JS Bundle Size | <120KB total (excl. CDN) | Sum of all js/*.js sizes |
| First Tap Possible | <1.5s after load | Time from navigation to MenuScene interactive |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Use Phaser `pointer` events throughout; never add raw DOM `touchstart` listeners in game logic
- **Prevent Default**: Add `touchmove` and `touchstart` `preventDefault()` on canvas to block pull-to-refresh and tap highlight
- **Orientation**: CSS `@media (orientation: landscape)` shows a "Please rotate your device" overlay; game is portrait-only
- **Safe Areas**: Top HUD has `padding-top: env(safe-area-inset-top, 0px)` via CSS for notch-equipped phones
- **Background Pause**: `document.addEventListener('visibilitychange', ...)` — when hidden, set `game.scene.pause('Game')` and freeze timer; resume on visible
- **Asset Loading**: All assets are inline SVG strings in config.js — zero network requests beyond CDN scripts

### 10.3 Critical Bug Prevention

Based on project-wide lessons:

1. **NEVER use `display: none` on canvas wrapper or parent** — permanently kills Phaser rendering. Use `visibility: hidden; height: 0; overflow: hidden` instead for all hide operations.
2. **Texture registration once in BootScene only** — `addBase64()` must not be called on scene restart. All 14 SVG textures registered in BootScene.create(), never again.
3. **Script load order is fixed** — config → stages → ads → ui → help → game → **main LAST**. main.js references MenuScene, GameScene, HelpScene, GameOverScene which must all be defined first.
4. **Timer guard flag** — `gameState.active` boolean prevents `handleTimeout()` from firing after a tap has already been registered. Always check `if (!gameState.active) return` at top of update() timer decrement.
5. **No body removal in callbacks** — not applicable here (no Matter.js physics), but noted for future modifications.
6. **Double-tap prevention** — `handleSuspectTap()` sets `gameState.active = false` as first action. Any subsequent taps during verdict animation have no effect.
7. **Hit-stop via flag not timeScale** — the 40ms hit-stop uses a `hitStopActive` flag checked in update(), not `this.time.timeScale = 0`, to avoid Phaser timer freeze bug.

### 10.4 Edge Cases

| Scenario | Handling |
|----------|----------|
| App goes to background during countdown | `visibilitychange` pauses game, freezes timer at current value, resumes on foreground |
| Screen resize / orientation change | Phaser Scale Manager handles FIT mode; portrait-only overlay shown for landscape |
| Rapid tap spam on verdict animation | `gameState.active = false` after first tap; all subsequent taps ignored during 700ms verdict window |
| localStorage unavailable (private browsing) | Wrap all storage access in try/catch; game continues without persistence, high score shown as 0 |
| Case generation validation failure (3 retries exhausted) | Fall back to a hardcoded simple 2-suspect, 2-clue case as final fallback |
| Ad fails to load | `showRewarded()` skips immediately to `onSkipped` callback; game continues normally |
| Audio context blocked (iOS) | First tap on Play button triggers `AudioContext.resume()`; Howler handles this automatically |
| Very long crime title (>25 chars) | Crime title text uses `wordWrap: { width: 280, useAdvancedWrap: true }` in Phaser Text config |
| 5 suspects on narrow device (360px) | 5-card layout uses 2+3 grid (2 top row, 3 bottom row) at 100×140px each |

### 10.5 Testing Checkpoints

| Checkpoint | What to Verify |
|------------|---------------|
| 1. Boot | BootScene registers all 14 SVG textures, no console errors, transitions to Menu |
| 2. Menu | All buttons visible and tappable (min 44px), high score shows "0" on fresh install |
| 3. Case 1 | 2 suspects appear, timer bar drains 15s, correct tap shows GUILTY stamp + confetti |
| 4. Wrong tap | INNOCENT stamp, card shake, badge decrements, same case reloads |
| 5. Timeout | Timer hits 0 while active, TIMEOUT banner shows, badge decrements |
| 6. Game over | 3rd badge lost → GameOver scene transitions in <2 seconds total |
| 7. Streak | 5 consecutive correct → streak shows ×1.5, particles increase |
| 8. Rest stage | Case 10 loads with green "EASY CASE" ribbon, 15s timer, 2 suspects |
| 9. Help page | Accessible from Menu and Pause; shows illustrated case example; Got It returns correctly |
| 10. Orientation | Landscape shows rotate overlay, portrait restores full game state |
| 11. Pause | Pause freezes timer exactly; resume continues with correct remaining time |
| 12. Score persistence | High score saved to localStorage; survives page reload |
| 13. Case 25 (boss) | Grand Jury case: 5 suspects, gold border, 8s timer |
| 14. Idle death | Leave game active without tapping for 15s → badge lost. Leave for 45s (3 timeouts) → game over |

### 10.6 Local Storage Schema

```json
{
  "suspect-sudoku_high_score": 0,
  "suspect-sudoku_highest_streak": 0,
  "suspect-sudoku_games_played": 0,
  "suspect-sudoku_highest_case": 0,
  "suspect-sudoku_settings": {
    "sound": true,
    "music": true
  }
}
```
