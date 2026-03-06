# Game Design Document: Password Panic

**Slug**: `password-panic`
**One-Liner**: Create passwords that satisfy increasingly insane security requirements before you get locked out
**Core Mechanic**: Tap word/number/symbol tiles on a custom keyboard to build passwords satisfying compounding absurd rules. Timer drains, wrong submissions cost 5s, timeout = ACCOUNT LOCKED = game over.
**Target Session Length**: 30-90 seconds
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Password Panic is a frantic constraint-satisfaction puzzle disguised as the worst login experience ever created. You need to log into increasingly absurd fictional websites (TotallySecureBank.biz, UltraSafeEmail.net, MegaLegit.gov). Each site demands a password that satisfies a growing pile of security requirements. Rules start normal ("must contain a number") and escalate to unhinged ("digits must sum to 25", "must contain a prime number", "must include a country bordering France").

Instead of a clunky QWERTY keyboard, players tap pre-built TILES on a custom keyboard. Tiles contain words ("SPAIN", "HELLO"), numbers ("7", "13", "42"), and symbols ("!", "@", "#"). Players combine tiles to construct passwords that satisfy ALL active rules simultaneously. Each tap adds a tile's content to the growing password string displayed above. A session timeout bar constantly drains. Wrong submissions cost 5 seconds. Timeout means ACCOUNT LOCKED -- game over.

The genius is in the compounding rules. Old rules NEVER go away (until a password reset event). By stage 8, you might need a password that: has 12+ characters, contains uppercase, contains a prime number, includes a country bordering France, has digits summing to 25, and contains an animal. Finding a combination of tiles that satisfies everything simultaneously under time pressure is the core thrill.

### 1.2 Target Audience

Casual mobile gamers aged 16-40 who play during commutes, breaks, or downtime. Anyone who has ever been frustrated by absurd real-world password requirements will immediately understand and relate to this game. Particularly strong appeal to social media users who will screenshot and share ridiculous rule combinations.

### 1.3 Core Fantasy

You are a desperate user trying to log into the most absurdly secure website on the internet. Every password you create is a small victory against an insane system. The fantasy is the satisfaction of solving an impossible puzzle under pressure -- and the shared comedy of "this is literally what real websites feel like."

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 30-90 seconds |
| Day 1 Retention | 45%+ |
| Day 7 Retention | 25%+ |
| Average Stages per Session | 3-8 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[New Stage: Website + Rules] --> [Tap Tiles to Build Password] --> [Submit]
        ^                                                            |
        |                                            [All Rules Satisfied?]
        |                                             YES /         \ NO
        |                                      [Stage Clear!]   [-5s Penalty]
        |                                            |               |
        +---------- [Add New Rules] <--------+       +--------->-----+
                                             |
                                      [Timer = 0 --> ACCOUNT LOCKED --> Game Over]
```

Moment-to-moment: the player reads the active rules (displayed as sticky notes), scans the tile keyboard for useful tiles, taps tiles to build a password string, then hits Submit. If the password satisfies ALL rules, the stage clears with a satisfying cascade of green checkmarks. If not, violated rules flash red, -5s penalty, and the password clears for another attempt. New rules are added each stage while old rules persist.

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Add Tile | Tap tile | Appends tile content to password string. Tile briefly depresses and grays out (used). |
| Delete Last Tile | Tap backspace button | Removes the last added tile from password. Tile returns to keyboard. |
| Clear All | Tap clear button (X) | Removes all tiles from password. All tiles return to keyboard. |
| Submit | Tap Submit button | Validates password against all rules. Success = stage clear. Fail = -5s + rule feedback. |
| Scroll Rules | Swipe rules area | Scroll through active rules when they exceed visible area (stage 6+). |

**Control Philosophy**: No typing. No QWERTY. Every interaction is a single tap on a large, clearly labeled tile. This eliminates mobile text input friction entirely. The challenge is THINKING (which tiles satisfy all rules), not TYPING.

**Touch Area Map**:
```
+-------------------------------+
| TotallySecureBank.biz         |  <- Website name (decorative)
| [====== TIMER BAR ======----] |  <- Session timeout (color-coded)
+-------------------------------+
| Rule: Must contain a number   |  <- Rules area (sticky notes)
| Rule: 8+ characters           |     Scrollable when 5+ rules
| Rule: Contains a prime number |
+-------------------------------+
| Password: [SPAIN][13][!]      |  <- Built password display
|                    [<-] [CLR] |  <- Backspace + Clear buttons
+-------------------------------+
| [HELLO] [SPAIN]  [GERMANY]   |  <- Tile keyboard (3 rows)
| [CAT]   [MOON]   [FIRE]      |     6 word tiles
| [7]  [13]  [42]  [99]  [3]   |     5 number tiles
| [!]  [@]  [#]  [A]  [Z]      |     5 symbol/letter tiles
|        [ SUBMIT ]             |  <- Submit button (large)
+-------------------------------+
| Score: 1250    Stage: 4       |  <- Bottom HUD
+-------------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Stage Clear (first try) | 500 x stage_number | Perfect bonus: 1.5x if no wrong submissions this stage |
| Stage Clear (2nd+ try) | 300 x stage_number | No multiplier |
| Rule Satisfied (per rule) | 50 per active rule | Streak bonus: +10 per consecutive stage cleared first-try |
| Speed Bonus | (remaining_seconds / max_seconds) x 200 | Only on stage clear |
| Password Reset Survived | 250 | Flat bonus for clearing a reset stage |

**Combo System**: "First Try Streak" -- clearing consecutive stages on the first submission attempt builds a streak counter. Streak multiplier: 1x (streak 0), 1.5x (streak 3), 2x (streak 5), 3x (streak 8). Streak resets on any wrong submission. Visual: streak counter burns brighter with each tier.

**High Score**: Stored in localStorage as `password_panic_high_score`. Displayed on menu and game over screen. New high score triggers confetti particles + "NEW RECORD!" text with bounce animation.

### 2.4 Progression System

Each stage introduces 1-2 new rules from a pool of 25+ rule types. Rules compound -- old rules persist across stages. Every 5 stages, a "PASSWORD RESET" event clears the 2 oldest rules but adds 3 new harder ones.

**Tile Keyboard Refresh**: The 16 tiles on the keyboard refresh each stage with a new randomized selection. The generator guarantees at least one valid combination exists among the available tiles.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-2 | Basic rules only (length, contains number, uppercase) | Easy -- 2 rules, generous tiles, 20s timer |
| 3-5 | Category rules (country, animal, color) | Medium -- 3-4 rules, timer starts at 18s |
| 6-8 | Math rules (digit sum, prime), meta rules (palindrome substring) | Hard -- 5-6 rules, timer 15s |
| 9-12 | Compound rules (country bordering X, animal with 3 letters), first PASSWORD RESET at stage 10 | Very Hard -- 6-8 rules, timer 13s |
| 13+ | Insane rules (must NOT contain letter E, exactly N vowels), resets every 5 stages | Extreme -- 7-10 rules, timer 12s (cap) |

### 2.5 Lives and Failure

There are NO lives. The timer IS your life.

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Timer reaches 0 | ACCOUNT LOCKED -- game over screen | Watch rewarded ad for +8s (once per run) |
| Wrong submission | -5s from timer, violated rules flash red, password clears | Immediate retry with remaining time |
| Inactivity 8s (no tap) | Timer drain doubles (2s/sec) until next tap | Tap any tile to restore normal drain |

**Inactivity Death**: If the player does nothing for 8 consecutive seconds, timer drain rate doubles to 2s/second. With a starting timer of 20s, an idle player dies within 18s guaranteed. An active player who stops mid-stage with 10s left dies within 10s.

**Death -> Restart**: Under 1.5 seconds from tapping "Try Again" to gameplay start.

---

## 3. Stage Design

### 3.1 Rule System (25 Rule Types)

**Category A -- Basic (stages 1-2)**:
1. `LENGTH_MIN` -- "Password must be {8/10/12/15}+ characters"
2. `CONTAINS_NUMBER` -- "Must contain a number"
3. `CONTAINS_UPPERCASE` -- "Must contain an uppercase letter"
4. `CONTAINS_SYMBOL` -- "Must contain a special character (!@#)"
5. `LENGTH_MAX` -- "Password must be under {20/16/14} characters"

**Category B -- Content (stages 3-5)**:
6. `CONTAINS_COUNTRY` -- "Must include a country name" (valid: SPAIN, GERMANY, FRANCE, ITALY, JAPAN, BRAZIL, CHINA, INDIA, PERU, CHAD)
7. `CONTAINS_ANIMAL` -- "Must include an animal" (valid: CAT, DOG, BAT, OWL, RAM, EEL, YAK, BEE, ANT, FOX)
8. `CONTAINS_COLOR` -- "Must include a color" (valid: RED, BLUE, GOLD, PINK, TAN)
9. `CONTAINS_FOOD` -- "Must include a food" (valid: PIE, HAM, JAM, NUT, FIG, YAM)
10. `CONTAINS_ELEMENT` -- "Must include an element" (valid: GOLD, IRON, ZINC, NEON, TIN)

**Category C -- Numeric (stages 6-8)**:
11. `DIGIT_SUM` -- "Digits must sum to exactly {N}" (N = 7, 10, 13, 15, 20, 25)
12. `CONTAINS_PRIME` -- "Must contain a prime number" (valid tiles: 3, 7, 13, 42 is NOT prime)
13. `CONTAINS_EVEN` -- "Must contain an even number"
14. `CONTAINS_ODD` -- "Must contain an odd number"
15. `DIGIT_COUNT` -- "Must contain exactly {2/3/4} digits"

**Category D -- Pattern (stages 6-8)**:
16. `STARTS_WITH` -- "Must start with letter {A-Z}"
17. `ENDS_WITH` -- "Must end with {letter/number/symbol}"
18. `NO_REPEAT_CHARS` -- "No character may repeat"
19. `CONTAINS_DOUBLE` -- "Must contain a double letter (AA, BB, etc.)"
20. `PALINDROME_SUB` -- "Must contain a 3+ letter palindrome (ABA, MOM, etc.)"

**Category E -- Insane (stages 9+)**:
21. `BORDERS_FRANCE` -- "Must include a country that borders France" (valid: SPAIN, GERMANY, ITALY, BELGIUM -- BELGIUM tile appears in stage 9+)
22. `THREE_LETTER_ANIMAL` -- "Must include a 3-letter animal" (CAT, DOG, BAT, OWL, RAM, EEL, YAK, BEE, ANT, FOX)
23. `VOWEL_COUNT` -- "Must contain exactly {N} vowels"
24. `NO_LETTER_E` -- "Must NOT contain the letter E"
25. `EXACT_LENGTH` -- "Must be EXACTLY {N} characters"

**Category F -- Meta (stages 11+)**:
26. `TILE_COUNT_MIN` -- "Must use at least {N} tiles"
27. `TILE_COUNT_MAX` -- "Must use at most {N} tiles"
28. `NO_NUMBERS` -- "Must NOT contain any numbers" (conflicts with CONTAINS_NUMBER if both active -- PASSWORD RESET resolves)
29. `MUST_RHYME` -- "Last tile must rhyme with {WORD}" (simplified: ends with same 2 letters)

### 3.2 Tile Keyboard Generation

Each stage, the keyboard refreshes with 16 tiles:
- 6 word tiles (randomly selected from word pool, guaranteed to include at least 1 that satisfies each active content rule)
- 5 number tiles (randomly selected, guaranteed to include at least 1 satisfying each active numeric rule)
- 5 symbol/letter tiles (always includes !, @, #, plus 2 random uppercase letters)

**Word Pool** (40 words):
SPAIN, GERMANY, FRANCE, ITALY, JAPAN, BRAZIL, CHINA, INDIA, PERU, CHAD, BELGIUM, CAT, DOG, BAT, OWL, RAM, EEL, YAK, BEE, ANT, FOX, RED, BLUE, GOLD, PINK, TAN, PIE, HAM, JAM, NUT, FIG, YAM, IRON, ZINC, NEON, TIN, MOON, FIRE, HELLO, MOM

**Number Pool** (12 numbers):
3, 5, 7, 11, 13, 2, 4, 6, 8, 42, 99, 100

**Solvability Guarantee**: The tile generator runs a constraint solver before presenting tiles. It brute-force checks all combinations of 3-6 tiles (from the 16 available) and confirms at least one combination satisfies all active rules. If no solution exists, it swaps one word tile for one that creates a valid path.

### 3.3 Difficulty Curve

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
    0    3    5    8    10    13    16    20+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-2 | Stage 3-5 | Stage 6-8 | Stage 9-12 | Stage 13+ |
|-----------|-----------|------------|-------------|-------------|-----------|
| Active Rules | 2 | 3-4 | 5-6 | 6-8 | 7-10 (cap) |
| Timer Start | 20s | 18s | 15s | 13s | 12s (cap) |
| Wrong Penalty | -5s | -5s | -5s | -5s | -5s |
| Rule Categories | A only | A+B | A+B+C+D | A-E | A-F |
| Tile Refresh | Full random | Slightly constrained | Tighter constraints | Minimal slack | Exactly 1-2 valid combos |
| Website Absurdity | Normal banks | Suspicious sites | Government parodies | Alien databases | Existential crisis portals |

### 3.4 Stage Generation Rules

1. **Solvability Guarantee**: Every stage must have at least 1 valid tile combination. Generator validates before presenting.
2. **No Contradictions**: Rule generator checks for logical contradictions (e.g., LENGTH_MIN 15 + LENGTH_MAX 10). If conflict detected, skip the conflicting rule.
3. **Difficulty Monotonicity**: Rule count never decreases between stages (except PASSWORD RESET events which replace 2 old with 3 new).
4. **PASSWORD RESET Events**: At stages 5, 10, 15, 20... the 2 oldest rules are removed and 3 new harder-category rules are added. Visual: old sticky notes crumple and fly off, new ones slam down.
5. **Rest Beats**: After a PASSWORD RESET, the first new stage has +3s bonus timer as a brief breather.
6. **Website Progression**: Website names get increasingly absurd:
   - Stage 1-2: "SecureBank.com", "SafeEmail.net"
   - Stage 3-5: "TotallyLegitBank.biz", "Def-Not-A-Scam.org"
   - Stage 6-8: "Area51Files.gov", "IlluminatiPortal.io"
   - Stage 9-12: "AlienTaxReturns.space", "TimeTravelBooking.quantum"
   - Stage 13+: "ExistentialDread.void", "PasswordInception.pw"

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Clean corporate UI aesthetic that progressively gets more absurd. Flat design login forms, sticky note rules, corporate blue/gray base that gets invaded by increasingly chaotic colors as stages progress. Think: a normal banking website slowly losing its mind.

**Aesthetic Keywords**: Corporate, Clean, Absurdist, Sticky-Notes, Login-Form

**Reference Palette**: LinkedIn meets Sticky Notes meets "this website was designed by a madman." Professional blues and grays for the base, with warm yellows for sticky notes and neon accents for feedback.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary (Corporate Blue) | Blue | #1565C0 | Submit button, header bar, website name |
| Secondary (Tile) | Light Gray | #ECEFF1 | Tile keyboard background, tile faces |
| Background | Off-White | #FAFAFA | Game background, login form |
| Sticky Note | Warm Yellow | #FFF176 | Rule sticky notes |
| Rule Satisfied | Green | #4CAF50 | Checkmark on satisfied rule, success flash |
| Rule Violated | Red | #F44336 | X on violated rule, error flash, penalty text |
| Timer Healthy | Teal | #00897B | Timer bar when >50% |
| Timer Warning | Orange | #FF9800 | Timer bar when 25-50% |
| Timer Critical | Red | #D32F2F | Timer bar when <25%, pulsing |
| Password Text | Dark Gray | #212121 | Password string display |
| Score/UI Text | Medium Gray | #616161 | Score, stage labels |
| Tile Text | Dark Blue | #0D47A1 | Text on keyboard tiles |
| Tile Pressed | Medium Blue | #90CAF9 | Tile feedback on tap |

### 4.3 SVG Specifications

**Sticky Note (Rule Display)**:
```svg
<svg viewBox="0 0 180 40" xmlns="http://www.w3.org/2000/svg">
  <!-- Note body with slight rotation for organic feel -->
  <rect x="2" y="2" width="176" height="36" rx="2" fill="#FFF176" stroke="#FBC02D" stroke-width="1"/>
  <!-- Tape strip at top -->
  <rect x="70" y="0" width="40" height="6" rx="1" fill="#E0E0E0" opacity="0.7"/>
  <!-- Shadow -->
  <rect x="4" y="38" width="176" height="2" rx="1" fill="#000000" opacity="0.1"/>
</svg>
```

**Keyboard Tile (Word/Number/Symbol)**:
```svg
<svg viewBox="0 0 80 36" xmlns="http://www.w3.org/2000/svg">
  <!-- Tile shadow -->
  <rect x="2" y="3" width="76" height="32" rx="6" fill="#CFD8DC"/>
  <!-- Tile face -->
  <rect x="1" y="1" width="76" height="32" rx="6" fill="#ECEFF1" stroke="#B0BEC5" stroke-width="1"/>
</svg>
```

**Submit Button**:
```svg
<svg viewBox="0 0 200 44" xmlns="http://www.w3.org/2000/svg">
  <!-- Button shadow -->
  <rect x="2" y="3" width="196" height="40" rx="8" fill="#0D47A1"/>
  <!-- Button face -->
  <rect x="1" y="1" width="196" height="40" rx="8" fill="#1565C0"/>
</svg>
```

**Lock Icon (Game Over)**:
```svg
<svg viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg">
  <!-- Lock shackle -->
  <path d="M15,30 L15,18 Q15,5 30,5 Q45,5 45,18 L45,30" fill="none" stroke="#D32F2F" stroke-width="4" stroke-linecap="round"/>
  <!-- Lock body -->
  <rect x="10" y="30" width="40" height="30" rx="4" fill="#D32F2F"/>
  <!-- Keyhole -->
  <circle cx="30" cy="42" r="5" fill="#FAFAFA"/>
  <rect x="28" y="42" width="4" height="10" rx="1" fill="#FAFAFA"/>
</svg>
```

**Checkmark (Rule Satisfied)**:
```svg
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" fill="#4CAF50"/>
  <polyline points="7,12 10,16 17,8" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**X Mark (Rule Violated)**:
```svg
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" fill="#F44336"/>
  <line x1="8" y1="8" x2="16" y2="16" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="16" y1="8" x2="8" y2="16" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
</svg>
```

**Design Constraints**:
- All SVG elements use max 8 path/shape elements
- Basic shapes only (rect, circle, line, polyline, path)
- No gradients or filters for mobile performance
- Animations via Phaser tweens, not SVG animate

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Rule checkmark cascade | Stage clear (all rules satisfied) | Each sticky note gets a green checkmark sequentially (80ms stagger), note scales 1.1x then back |
| Rule violation shake | Wrong submission | Violated rule sticky notes shake horizontally 4px for 300ms, X mark appears |
| Tile depress | Tile tapped | Tile y-offset +2px for 80ms (pressed look), color shifts to #90CAF9 |
| Timer pulse | Timer <25% | Timer bar pulses scale 1.05x at 2Hz, color #D32F2F |
| Password grow | Tile added | New tile in password slides in from below (100ms ease-out), slight bounce |
| Submit success | Correct password | Green flash overlay (#4CAF50, 20% opacity, 200ms), all rule notes cascade green |
| Submit fail | Wrong password | Red flash overlay (#F44336, 25% opacity, 150ms), screen shake 3px for 150ms |
| Lock slam | Game over | Large lock icon slams down from top (300ms ease-bounce), "ACCOUNT LOCKED" text types out character by character (50ms/char) |
| Password Reset | Every 5 stages | Old sticky notes crumple (scale to 0 with rotation tween, 300ms), new notes slam in from sides (200ms ease-out with bounce) |
| Website transition | Stage change | Website name types out like a URL bar (30ms/char), progress bar fills beneath |

---

## 5. Audio Design

### 5.1 Sound Effects

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Tile tap | Soft keyboard click (mechanical key sound) | 80ms | High |
| Tile add to password | Short ascending pop | 100ms | Medium |
| Backspace | Short descending click | 80ms | Medium |
| Submit (success) | Bright ascending 3-note chime + "ding" | 400ms | High |
| Submit (fail) | Buzzer/error tone (low) | 250ms | High |
| Rule satisfied | Small bell ding (pitch increases per rule in cascade) | 150ms | Medium |
| Rule violated | Quick thud/bonk | 100ms | Medium |
| Timer warning (<25%) | Ticking clock loop, accelerating | Loop | High |
| Timer critical (<10%) | Rapid heartbeat pulse | Loop | High |
| Game over (locked) | Heavy metal lock "CLANK" + descending tone | 600ms | High |
| Password Reset event | Paper crumple + paper slap sounds | 400ms | High |
| Stage clear | Satisfying "password accepted" chime | 500ms | High |
| New high score | Celebratory fanfare (5 ascending notes) | 800ms | Medium |
| Streak milestone | Pitch-shifted ding (+8% per streak level) | 100ms | Medium |

### 5.2 Music Concept

**Background Music**: No traditional music. Instead, ambient corporate hold music that gets progressively more distorted and intense as the timer drops. Think: elevator music slowly becoming a panic attack.

**Music State Machine**:
| Game State | Music Behavior |
|-----------|---------------|
| Menu | Calm corporate hold music loop, soft piano |
| Timer > 50% | Hold music continues, neutral tempo (80 BPM) |
| Timer 25-50% | Hold music pitch shifts up slightly, tempo increases to 100 BPM |
| Timer < 25% | Music becomes discordant, tempo 130 BPM, added synth urgency layer |
| Stage Clear | Music resolves to pleasant chord (0.5s), resets to calm |
| Game Over | Music cuts abruptly, replaced by dial tone, fades out |
| Password Reset | Brief static burst, music resets |

**Audio Implementation**: Howler.js via CDN (`https://cdn.jsdelivr.net/npm/howler@2/dist/howler.min.js`)

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
               |        |          |  Pause  |---> +--------+
          +----+----+   |          | Overlay |     |  Help  |
          |  Help   |   |          +----+----+     +--------+
          |How 2Play|   |               |
          +---------+   |          +----+----+
                   +----+----+     | Game    |
                   |Settings |     | Over    |
                   | Overlay |     | (Locked)|
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
|  TotallySecureBank.biz        [||]|  <- Website name + pause button
|  [========= TIMER =========--]    |  <- Timer bar (color shifts)
+-----------------------------------+
|  [note] Must contain a number  [v]|  <- Rule sticky notes
|  [note] 8+ characters         [v]|     [v] = checkmark when satisfied
|  [note] Contains a prime      [x]|     [x] = X when violated
|  [note] Includes a country    [?]|     [?] = unknown (not yet checked)
+-----------------------------------+
|  Password: [SPAIN][13][!]         |  <- Built password display
|                       [<-] [CLR]  |  <- Backspace + Clear
+-----------------------------------+
|  [HELLO] [SPAIN]  [GERMANY]      |  <- Word tiles row 1
|  [CAT]   [MOON]   [FIRE]         |  <- Word tiles row 2
|  [7]  [13]  [42]  [99]  [3]      |  <- Number tiles
|  [!]  [@]  [#]  [A]  [Z]         |  <- Symbol/letter tiles
|          [ SUBMIT ]               |  <- Submit button
+-----------------------------------+
|  Score: 1250   Stage 4   x3      |  <- Score + Stage + Streak
+-----------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Website Name | Top-left | Current fictional website URL | On stage change |
| Pause Button | Top-right | "||" icon | Always visible |
| Timer Bar | Below website name, full width | Color-coded bar (teal >50%, orange 25-50%, red <25%) + numeric seconds | Every frame (60fps) |
| Rule Notes | Below timer, scrollable area (max 4 visible, scroll for more) | Sticky note per rule with status icon | On submit attempt |
| Password Display | Center | Tiled password string with backspace/clear | On tile tap/backspace/clear |
| Tile Keyboard | Below password, 4 rows | 16 tappable tiles (6 word + 5 number + 5 symbol) | On stage change (refresh) |
| Submit Button | Below keyboard | Large blue button | Always visible |
| Score | Bottom-left | Current score with comma formatting | On score event |
| Stage | Bottom-center | "Stage N" | On stage clear |
| Streak Counter | Bottom-right | "xN" streak display with color tier | On submit result |

### 6.3 Menu Structure

**Main Menu**:
- Game title "PASSWORD PANIC" in corporate blue, with a lock icon that jiggles
- Subtitle: "Can you log in?" in gray
- Play button (large, blue, pulsing border glow) -- styled as a "LOG IN" button
- How to Play / "?" (top-left corner, styled as info icon)
- High Score display (below subtitle, styled as "Last Session Score")
- Sound toggle (speaker icon, top-right)
- Fake "Terms of Service" and "Privacy Policy" text at bottom (decorative, non-functional, adds comedy)

**Pause Menu** (overlay, 70% white background with blur):
- Resume (styled as "Continue Logging In")
- How to Play
- Restart (styled as "Try Different Browser")
- Quit to Menu (styled as "Give Up")

**Game Over Screen** (styled as "ACCOUNT LOCKED" page):
- Large red lock icon with slam-in animation
- "ACCOUNT LOCKED" header in red with typewriter effect
- "Reason: Session Expired" subtext
- Final Score (large, counting up animation)
- High Score indicator ("NEW RECORD!" bounce if applicable)
- Stage Reached + Rules Cleared stats
- "Appeal Lock" rewarded ad button (green, once per run, gives +8s)
- "Try Again" button (blue, styled as "Create New Account")
- "Menu" button (gray, styled as "Leave Website")

**Help / How to Play Screen** (overlay, styled as a "FAQ" page):
- Title: "HOW TO LOG IN"
- Visual 1: Animated tile tap -> tile appears in password field (tap demo)
- Visual 2: Rule sticky note with checkmark vs X (rule system explanation)
- Visual 3: Timer bar draining with "-5s" penalty on wrong submit
- Rules: "Tap tiles to build a password. Satisfy ALL rules. Submit before time runs out!"
- Tips: "Read all rules before building!" / "Number tiles help with digit-sum rules!" / "Password Resets remove old rules every 5 stages!"
- "GOT IT!" button (styled as "I AGREE TO TERMS") returns to previous screen

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
| Rewarded | "Appeal Lock" revive after death | Every game over (once per run) | Always optional |
| Rewarded | Double final score | Game over screen | Always optional |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Time Revive | Watch rewarded ad after account lock | +8 seconds added, resume play | Once per run |
| Score Double | Watch rewarded ad at game over | 2x final score | Once per session |

### 7.3 Session Economy

Sessions are naturally short (30-90s) due to the compounding rule pressure and constant timer drain. Players who enjoy the puzzle will replay immediately, generating high game-over frequency. The rewarded ad revive ("Appeal Lock") is compelling because players invest mental effort solving rules and don't want to lose progress.

**Session Flow with Monetization**:
```
[Play Free 30-90s] --> [Timer = 0 / Account Locked]
                              |
                    [Rewarded Ad: Appeal Lock +8s?]
                         | Yes --> [Resume + 8s, play continues]
                         | No  --> [Game Over Screen]
                                        |
                                  [Interstitial (every 3rd game over)]
                                        |
                                  [Rewarded Ad: Double Score?]
                                        | Yes --> [Score doubled, shown]
                                        | No  --> [Try Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/password-panic/
+-- index.html              # Entry point, CDN loads, script order
+-- css/
|   +-- style.css           # Responsive styles, tile layout, sticky note aesthetic
+-- js/
    +-- config.js           # Constants, rules DB, tile pools, colors, SVGs, difficulty tables
    +-- stages.js           # Rule generation, tile selection, solvability validator
    +-- ads.js              # Ad hooks, reward callbacks
    +-- effects.js          # Particles, screen shake, cascading checkmarks, lock slam
    +-- ui.js               # MenuScene, GameOverScene, HUD, Help, Pause, rule display
    +-- game.js             # GameScene: tile keyboard, password building, rule validation, timer
    +-- main.js             # BootScene, Phaser init, scene registration (LAST)
```

**Script load order in index.html**: config -> stages -> ads -> effects -> ui -> game -> main

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- `COLORS` object: all 13 hex values
- `RULES_DB` array: 29 rule type definitions with id, category, textTemplate, validationFn name, difficulty tier
- `WORD_POOL` array: 40 words with metadata tags (country, animal, color, food, element)
- `NUMBER_POOL` array: 12 numbers with metadata (prime, even, odd, digit_sum)
- `SYMBOL_POOL` array: symbols and uppercase letters
- `DIFFICULTY` table: rules count, timer start, tile slack per stage range
- `SCORING` object: base points, streak thresholds, multipliers
- `TIMER` object: start_by_stage=[20,20,18,18,18,15,15,15,13,13,13,13,12], drain=1, penalty=5, inactivity_drain=2, revive_bonus=8
- `SVG_STRINGS` object: sticky note, tile, submit button, lock, checkmark, x-mark SVG markup
- `WEBSITE_NAMES` array: 20+ fictional website URLs grouped by stage range
- `GRADE_TABLE`: grade thresholds for endgame display

**main.js** (max 300 lines):
- BootScene: load all SVGs via `textures.addBase64()` once
- Phaser.Game config: 360x640 canvas, CANVAS renderer, background #FAFAFA
- Scene array: [BootScene, MenuScene, GameScene, UIScene, GameOverScene]
- Orientation/resize handler
- localStorage read/write helpers
- Global state: `GameState = { score, stage, streak, highScore, rules[], password[], tiles[], timer, gamesPlayed }`

**game.js** (max 300 lines):
- GameScene create(): init timer, generate rules for current stage, generate tiles, create tile keyboard, create password display area, create submit button, set up input handlers
- GameScene update(): drain timer (delta-based), check inactivity timer, update timer bar color, check death condition
- Tile tap handler: append tile content to password array, update display, mark tile as used (gray out)
- Backspace handler: remove last tile from password, restore tile on keyboard
- Clear handler: remove all tiles from password, restore all tiles on keyboard
- Submit handler: call `validatePassword(password, rules)` from stages.js, handle success (stage clear) or failure (penalty + feedback)
- Stage clear: increment stage, call stages.js for new rules + tiles, reset password, fire success effects
- Death: emit 'player-death' event, transition to GameOverScene

**stages.js** (max 300 lines):
- `generateRulesForStage(stageNum, existingRules)`: returns updated rules array (adds 1-2 new, handles PASSWORD RESET at stage 5/10/15...)
- `generateTilesForStage(rules)`: returns 16 tiles (6 word + 5 number + 5 symbol) guaranteed solvable
- `validatePassword(passwordString, rules)`: returns `{ valid: boolean, results: [{ruleId, satisfied: boolean}] }`
- `checkSolvability(tiles, rules)`: brute-force checks combinations of 2-6 tiles for at least 1 valid password
- Rule validation functions: `checkLength(pw, min)`, `checkContainsNumber(pw)`, `checkDigitSum(pw, target)`, `checkContainsCategory(pw, category)`, etc.
- `getWebsiteName(stageNum)`: returns random website name for stage range

**ui.js** (max 300 lines):
- MenuScene: title text, fake login form aesthetic, LOG IN button, help button, high score
- GameOverScene: ACCOUNT LOCKED display, score count-up, high score check, ad offer buttons, retry/menu
- HUD overlay (UIScene parallel to GameScene): website name, timer bar, rule sticky notes (scrollable), score/stage/streak
- Timer bar: `graphics.fillRect()` with color based on percentage (teal >50%, orange 25-50%, red <25%)
- Rule display: sticky note sprites with status icons (checkmark/X/question), scrollable container
- Pause overlay: semi-transparent white + resume/restart/menu buttons
- Help overlay: illustrated FAQ page with tap demos

**effects.js** (max 300 lines):
- `ruleCheckCascade(scene, ruleSprites)`: sequential green checkmark animation (80ms stagger)
- `ruleViolationShake(scene, ruleSprites, violatedIds)`: shake violated notes + red X
- `tileDepress(scene, tile)`: y-offset +2px press effect
- `submitSuccess(scene)`: green flash + checkmark cascade
- `submitFail(scene)`: red flash + screen shake
- `lockSlam(scene)`: lock icon drops from top with bounce
- `timerPulse(scene, timerBar)`: pulsing scale effect for low timer
- `passwordResetEffect(scene, oldNotes, newNotes)`: crumple old + slam new
- `floatingText(scene, x, y, text, color)`: text float up + fade
- `screenShake(scene, intensity, duration)`: camera shake
- `scalePunch(target, scale, duration)`: scale tween bounce
- `confetti(scene, x, y, count)`: celebration particles

**ads.js** (max 300 lines):
- Placeholder ad SDK hooks
- `showInterstitial()`: tracks game_over_count, shows every 3rd
- `showRewarded(callback)`: offers revive or score double
- `onAdRewarded(type)`: dispatches reward (revive: add 8s, score: multiply 2x)
- `onAdClosed()`, `onAdFailed()`: fallback handlers

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |
| Howler.js | 2.x | `https://cdn.jsdelivr.net/npm/howler@2/dist/howler.min.js` | Audio playback |

---

## 9. Juice Specification

### 9.1 Player Input Feedback (applied to every tile tap)

| Effect | Target | Values |
|--------|--------|--------|
| Tile depress | Tapped tile | Y-offset: +2px, Duration: 80ms, Color shift: #ECEFF1 -> #90CAF9 |
| Scale punch | Tapped tile | Scale: 0.92x (press in), Recovery: 80ms |
| Password tile slide | Password display | New tile slides in from below: y+20px -> y, Duration: 100ms, easeOut |
| Sound | -- | Mechanical keyboard click, Pitch: +2% per tile in current password |
| Haptic | Device | 8ms vibration on tap |

### 9.2 Core Action: Submit Password (Success) Feedback

| Effect | Values |
|--------|--------|
| Green flash | Overlay #4CAF50, 20% opacity, 200ms fade |
| Rule checkmark cascade | Each rule note: green checkmark appears + note scales 1.08x, 80ms stagger between rules |
| Screen shake (positive) | Intensity: 2px, Duration: 100ms (subtle celebration shake) |
| Camera zoom | 1.02x snap, Recovery: 250ms ease-out |
| Password text | Entire password string pulses green (#4CAF50), scales 1.15x, Recovery: 200ms |
| Floating text | "+{score}" at password position, Color: #4CAF50, Float up 60px, Fade: 600ms |
| Sound | Ascending 3-note chime, pitch base +5% per streak level |
| Combo escalation | At streak 3+: checkmark cascade speed increases (80ms -> 50ms), particle count increases (+5 per streak tier) |

### 9.3 Core Action: Submit Password (Failure) Feedback

| Effect | Values |
|--------|--------|
| Red flash | Overlay #F44336, 25% opacity, 150ms fade |
| Screen shake | Intensity: 4px, Duration: 200ms |
| Rule violation | Violated rule notes shake horizontally 4px for 300ms, red X slams in with scale 1.3x -> 1.0x |
| Password clear | Password tiles scatter (random direction 30px, 200ms, fade out) |
| Timer penalty | "-5s" floating text at timer bar, Color: #F44336, shakes horizontally 3px, Fade: 500ms |
| Timer bar | Red flash + shrink animation, 200ms |
| Sound | Low buzzer tone + each violated rule gets a "bonk" sound (50ms stagger) |
| Streak reset | If streak > 0: streak counter shatters (splits into 3 pieces flying off), 300ms |

### 9.4 Death/Failure Effects (Account Locked)

| Effect | Values |
|--------|--------|
| Screen shake | Intensity: 10px, Duration: 400ms |
| Screen effect | Red flash (#F44336, 30% opacity, 300ms) then desaturation tween to grayscale over 400ms |
| Lock slam | Lock icon drops from y=-100 to center, Duration: 300ms, easeOutBounce |
| "ACCOUNT LOCKED" text | Typewriter effect: 50ms per character, Color: #D32F2F, scale 1.0x |
| Sound | Heavy metallic "CLANK" + descending digital tone, Duration: 600ms |
| Timer bar | Timer bar shatters (splits into 4 pieces that fly off screen), 300ms |
| Effect -> UI delay | 700ms (let lock slam + text typewriter play before showing game over UI) |
| Death -> restart | **Under 1.5 seconds** (tap Try Again -> gameplay in <1.5s) |

### 9.5 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating text | "+{N}", Color: #4CAF50, Movement: up 60px, Fade: 600ms |
| Score HUD punch | Scale 1.3x, Recovery: 150ms |
| Combo text | Streak milestone "x3!" / "x5!" / "x8!" centered screen, Size: 40px base + 6px per tier, Color: #1565C0 -> #FF9800 -> #D32F2F |
| Speed bonus text | "SPEED BONUS +{N}" at timer bar position, Color: #00897B, Float up 40px, Fade: 500ms |

### 9.6 Timer Effects

| Effect | Values |
|--------|--------|
| Timer healthy (>50%) | Bar color: #00897B, no pulse, steady |
| Timer warning (25-50%) | Bar color: #FF9800, gentle pulse: scale 1.02x at 1Hz |
| Timer critical (<25%) | Bar color: #D32F2F, aggressive pulse: scale 1.05x at 3Hz, border glow red |
| Timer penalty animation | Bar shrinks by penalty amount with red flash highlight, 200ms |
| Timer gain animation | Bar grows by gained amount with green flash highlight, 150ms |
| Inactivity warning | After 5s idle: timer bar border starts flashing orange at 2Hz. After 8s: drain doubles |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | Minimal assets (SVG only) |
| Memory Usage | <80MB | No physics engine needed, simple sprite management |
| JS Bundle Size | <60KB total (excl. CDN) | 7 small JS files |
| First Interaction | <1 second after load | Boot -> Menu immediate |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser pointer events for tile taps (pointerdown/up)
- **Prevent Default**: Disable pull-to-refresh, pinch-to-zoom, double-tap-to-zoom
- **Orientation**: Portrait lock via CSS + resize handler (reposition all elements on orientation change)
- **Tile Sizing**: Minimum 60x32px per tile (exceeds 44x44px Apple HIG when accounting for padding). Word tiles 80x36px, number tiles 50x36px, symbol tiles 50x36px.
- **Throttling**: Pause timer and game on `visibilitychange` event
- **No Physics**: This game requires no physics engine. Pure UI interactions + timer logic. Phaser used for rendering, tweens, and scene management only.

### 10.3 Rule Validation Algorithm

```
validatePassword(passwordString, activeRules):
  results = []
  for each rule in activeRules:
    switch(rule.type):
      case 'LENGTH_MIN': satisfied = passwordString.length >= rule.value
      case 'CONTAINS_NUMBER': satisfied = /\d/.test(passwordString)
      case 'CONTAINS_UPPERCASE': satisfied = /[A-Z]/.test(passwordString)
      case 'CONTAINS_SYMBOL': satisfied = /[!@#$%^&*]/.test(passwordString)
      case 'LENGTH_MAX': satisfied = passwordString.length <= rule.value
      case 'CONTAINS_COUNTRY': satisfied = COUNTRIES.some(c => passwordString.includes(c))
      case 'CONTAINS_ANIMAL': satisfied = ANIMALS.some(a => passwordString.includes(a))
      case 'DIGIT_SUM': satisfied = sumOfDigits(passwordString) === rule.value
      case 'CONTAINS_PRIME': satisfied = extractNumbers(passwordString).some(isPrime)
      case 'STARTS_WITH': satisfied = passwordString.startsWith(rule.value)
      case 'ENDS_WITH': satisfied = passwordString.endsWith(rule.value)
      case 'NO_REPEAT_CHARS': satisfied = new Set(passwordString).size === passwordString.length
      case 'VOWEL_COUNT': satisfied = countVowels(passwordString) === rule.value
      case 'NO_LETTER_E': satisfied = !passwordString.includes('E')
      // ... etc for all 29 types
    results.push({ ruleId: rule.id, satisfied })
  return { valid: results.every(r => r.satisfied), results }
```

### 10.4 Tile Keyboard Layout Algorithm

```
generateTilesForStage(activeRules):
  // 1. Identify required content categories from active rules
  requiredCategories = rules.map(r => r.requiredCategory).filter(Boolean)

  // 2. Select 6 word tiles
  wordTiles = []
  for each category in requiredCategories:
    wordTiles.push(randomFromPool(WORD_POOL, category))  // guarantee coverage
  fill remaining slots with random words (no duplicates)

  // 3. Select 5 number tiles
  numberTiles = []
  if rules.has('CONTAINS_PRIME'): numberTiles.push(randomPrime())
  if rules.has('DIGIT_SUM'): numberTiles.push(numberHelpingSum(targetSum))
  fill remaining with random numbers

  // 4. Select 5 symbol/letter tiles
  symbolTiles = ['!', '@', '#'] + 2 random uppercase letters
  if rules.has('STARTS_WITH'): replace one letter with required letter
  if rules.has('ENDS_WITH'): ensure required char present

  // 5. Validate solvability
  allTiles = wordTiles + numberTiles + symbolTiles
  if !checkSolvability(allTiles, activeRules):
    swap one word tile for one that creates valid path (retry up to 10 times)

  return allTiles
```

### 10.5 Timer Precision

Timer must use Phaser's `delta` time (ms) for frame-rate-independent countdown:
```
update(time, delta) {
  if (this.paused) return;
  const drain = this.inactivityActive ? 2.0 : 1.0;
  this.timer -= (delta / 1000) * drain;
  if (this.timer <= 0) {
    this.timer = 0;
    this.accountLocked();
  }
  this.updateTimerBar();
  this.checkInactivity(time);
}
```

### 10.6 Local Storage Schema

```json
{
  "password_panic_high_score": 0,
  "password_panic_games_played": 0,
  "password_panic_highest_stage": 0,
  "password_panic_total_rules_cleared": 0,
  "password_panic_settings": {
    "sound": true,
    "music": true,
    "vibration": true
  }
}
```

### 10.7 Critical Implementation Warnings

1. **BootScene texture registration**: All SVGs must be registered via `addBase64()` ONCE in BootScene. Never re-register on scene restart.
2. **main.js loads LAST**: Script order in index.html must be config -> stages -> ads -> effects -> ui -> game -> main.
3. **Timer never pauses in gameplay**: Timer drain is constant. Only pause on actual pause overlay or `visibilitychange`.
4. **Hit-stop uses setTimeout, NOT Phaser delayedCall**: `timeScale=0` + `delayedCall()` = permanent freeze bug. Use `setTimeout(resume, duration)`.
5. **No physics engine**: Do NOT initialize Matter.js or Arcade physics. This game is pure UI. Use `physics: { default: false }` in Phaser config or omit physics entirely.
6. **Orientation resize**: Handle `resize` event to reposition all UI elements. Tile keyboard must reflow on resize.
7. **Tile text rendering**: Use Phaser text objects on top of tile sprites. Do NOT embed text in SVG (Phaser can't update SVG text dynamically).
8. **Rule scroll container**: When rules exceed 4, use a masked container with swipe-to-scroll. Phaser's `setMask()` + input drag on the container.
9. **HUD literal initialization**: Score text must initialize from `GameState.score`, not `'0'` literal, to survive scene restarts.
10. **Password string concatenation**: Store password as array of tile objects `[{text: 'SPAIN', type: 'word'}, {text: '13', type: 'number'}]`. Concatenate `.text` values for validation. This preserves tile identity for backspace.
11. **Solvability validation timeout**: The brute-force solvability check must have a 500ms timeout. If it exceeds, relax one constraint (remove newest rule temporarily from check) and retry.
