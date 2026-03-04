# Game Design Document: {Title}

**Slug**: `{slug}`
**One-Liner**: {one_liner}
**Core Mechanic**: {core_mechanic}
**Target Session Length**: {target_session_length}
**Date Created**: {date}
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

{A 2-3 paragraph description of the game concept. Explain what the player does, why it is fun, and what makes it unique. This should expand on the elevator pitch from the idea phase.}

### 1.2 Target Audience

{Describe the target audience: casual mobile gamers, age range, play context (commute, waiting room, couch), skill level expectations.}

### 1.3 Core Fantasy

{What fantasy does the player experience? What role do they inhabit? What power or satisfaction does the game deliver?}

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | {3-8 minutes} |
| Day 1 Retention | {40%+} |
| Day 7 Retention | {20%+} |
| Average Stages per Session | {5-15} |
| Crash Rate | {<1%} |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
{Describe the core gameplay loop as a cycle diagram}

Example:
[Start Stage] → [Play Action] → [Score/Progress] → [Stage Complete] → [Next Stage/Death]
     ↑                                                                        │
     └────────────────────── [Retry / Continue] ←─────────────────────────────┘
```

{Detailed description of the core loop: what the player does moment-to-moment, what decisions they make, what feedback they receive.}

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| {Primary Action} | {Tap / Swipe / Hold} | {What happens when the player performs this action} |
| {Secondary Action} | {Tap / Swipe / Hold} | {What happens when the player performs this action} |
| {Tertiary Action} | {Tap / Swipe / Hold} | {What happens when the player performs this action} |

**Control Philosophy**: {Explain the control design philosophy. Why these specific gestures? How do they map to the game's feel?}

**Touch Area Map**:
```
┌─────────────────────┐
│                     │
│    {Game Area}      │
│                     │
│                     │
├─────────────────────┤
│  {Control Zone}     │
│                     │
└─────────────────────┘
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| {Event 1} | {base points} | {condition for multiplier} |
| {Event 2} | {base points} | {condition for multiplier} |
| {Event 3} | {base points} | {condition for multiplier} |

**Combo System**: {Describe any combo or chain mechanics that multiply scores.}

**High Score**: {Describe how high scores are tracked and displayed. Local storage persistence.}

### 2.4 Progression System

{Describe how the player progresses through the game. What unlocks? What changes? What keeps them coming back?}

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-5 | {Base mechanics only} | {Easy - learn controls} |
| 6-10 | {New obstacle/mechanic} | {Medium - apply skills} |
| 11-20 | {Advanced mechanics} | {Hard - master timing} |
| 21-50 | {Expert challenges} | {Very Hard - precision required} |
| 51+ | {Endless variation} | {Extreme - survival mode} |

### 2.5 Lives and Failure

{Describe the death/failure system. How many lives? How are they earned? What happens on game over?}

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| {Condition 1} | {Lose life / Stage restart} | {Watch ad for extra life} |
| {Condition 2} | {Game over} | {Watch ad to continue} |

---

## 3. Stage Design

### 3.1 Infinite Stage System

{Describe the procedural generation system that creates infinite stages. How are stages constructed? What parameters vary?}

**Generation Algorithm**:
```
Stage Generation Parameters:
- Seed: {based on stage number + random salt}
- Difficulty: {function of stage number}
- Length: {base_length + stage_number * growth_factor, capped at max}
- Obstacle Density: {function of difficulty}
- Reward Density: {inverse function of difficulty}
- Special Event Chance: {percentage based on stage number}
```

### 3.2 Difficulty Curve

```
Difficulty
    │
100 │                                          ──────────── (cap)
    │                                    ╱
 80 │                              ╱
    │                        ╱
 60 │                  ╱
    │            ╱
 40 │      ╱
    │  ╱
 20 │╱
    │
  0 └────────────────────────────────────────── Stage
    0    10    20    30    40    50    60    70+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-5 | Stage 6-15 | Stage 16-30 | Stage 31-50 | Stage 51+ |
|-----------|-----------|------------|-------------|-------------|-----------|
| Speed | {value} | {value} | {value} | {value} | {value} |
| Obstacle Count | {value} | {value} | {value} | {value} | {value} |
| Safe Zone Size | {value} | {value} | {value} | {value} | {value} |
| Reaction Time Required | {value} | {value} | {value} | {value} | {value} |
| New Mechanic Introduced | {None} | {Mechanic A} | {Mechanic B} | {Mechanic C} | {Random Mix} |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every generated stage must be completable. The generation algorithm must validate that a path exists from start to finish.
2. **Variety Threshold**: No two consecutive stages should feel identical. At least {N} parameters must differ between consecutive stages.
3. **Difficulty Monotonicity**: Overall difficulty must never decrease between stages (local variations are allowed within a stage).
4. **Rest Stages**: Every {N} stages, insert a deliberately easier "rest stage" to prevent fatigue and create rhythm.
5. **Boss/Special Stages**: Every {N} stages, generate a special challenge stage with unique mechanics or visual treatment.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: {Describe the overall visual style: minimalist, pixel art, geometric, cartoon, neon, etc.}

**Aesthetic Keywords**: {3-5 keywords that capture the visual feel}

**Reference Palette**: {Describe the mood and feel the visuals should evoke}

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | {color name} | {#XXXXXX} | {Player character, primary UI elements} |
| Secondary | {color name} | {#XXXXXX} | {Secondary game elements, accents} |
| Background | {color name} | {#XXXXXX} | {Game background} |
| Danger | {color name} | {#XXXXXX} | {Obstacles, hazards, warnings} |
| Reward | {color name} | {#XXXXXX} | {Collectibles, power-ups, positive feedback} |
| UI Text | {color name} | {#XXXXXX} | {Score, labels, menus} |
| UI Background | {color name} | {#XXXXXX} | {Menu backgrounds, overlays} |

### 4.3 SVG Specifications

All game graphics are rendered as SVG elements generated in code. No external image assets are used.

**Player Character**:
```svg
{SVG code for the player character, with comments explaining each part}
```

**Obstacle Type A**:
```svg
{SVG code for obstacle type A}
```

**Collectible / Reward**:
```svg
{SVG code for collectible items}
```

**Background Elements**:
```svg
{SVG code for background decorative elements}
```

**Design Constraints**:
- All SVG elements must be simple enough to render at 60fps on mobile devices
- Maximum {N} path elements per SVG object
- Use basic shapes (rect, circle, ellipse, line, polygon) over complex paths where possible
- Animations via CSS transforms or requestAnimationFrame, not SVG animate elements

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| {Screen shake} | {Player death} | {CSS transform with random offset, 300ms duration} |
| {Flash} | {Collectible pickup} | {Background color flash, 100ms} |
| {Particle burst} | {Stage complete} | {N small SVG circles with random velocity, fade out over 500ms} |
| {Trail} | {Player movement} | {Fading copies of player SVG at previous positions} |

---

## 5. Audio Design

### 5.1 Sound Effects

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| {Player action} | {Short, satisfying click/pop} | {<200ms} | {High} |
| {Collectible pickup} | {Bright, ascending chime} | {<300ms} | {Medium} |
| {Obstacle hit} | {Dull thud with crunch} | {<300ms} | {High} |
| {Stage complete} | {Ascending fanfare} | {<1s} | {High} |
| {Game over} | {Descending tone, somber} | {<1s} | {High} |
| {UI button press} | {Subtle click} | {<100ms} | {Low} |
| {High score} | {Celebratory jingle} | {<2s} | {Medium} |

### 5.2 Music Concept

**Background Music**: {Describe the style, tempo, mood of the background music. Is it dynamic (changes with gameplay state)? Is it procedurally generated or a static loop?}

**Music State Machine**:
| Game State | Music Behavior |
|-----------|---------------|
| Menu | {Calm, ambient loop} |
| Early Stages (1-10) | {Upbeat, moderate tempo} |
| Mid Stages (11-30) | {Increased intensity, faster tempo} |
| Late Stages (31+) | {High intensity, driving beat} |
| Game Over | {Music fade out, somber sting} |
| Pause | {Music volume reduced to 30%} |

**Audio Implementation**: Howler.js via CDN (`https://cdn.jsdelivr.net/npm/howler@2/dist/howler.min.js`)

---

## 6. UI/UX

### 6.1 Screen Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Splash  │────→│   Menu   │────→│   Game   │
│  Screen  │     │  Screen  │     │  Screen  │
└──────────┘     └──────────┘     └──────────┘
                      │                │
                      │           ┌────┴────┐
                      │           │  Pause  │
                      │           │ Overlay │
                      │           └────┬────┘
                      │                │
                      │           ┌────┴────┐
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
│ Score: 12450    ★ Stage 7   ♥♥♥│  ← Top bar (always visible)
├─────────────────────────────────┤
│                                 │
│                                 │
│         Game Play Area          │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
├─────────────────────────────────┤
│   {Control area if needed}      │  ← Bottom area (context-dependent)
└─────────────────────────────────┘
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left | Current score with animation on change | Every score event |
| Stage | Top-center | Current stage number with star icon | On stage transition |
| Lives | Top-right | Heart icons (filled/empty) | On life change |
| Combo | Center-top (below bar) | Combo counter, appears on combo, fades | On combo event |
| {Custom element} | {Position} | {Content} | {Frequency} |

### 6.3 Menu Structure

**Main Menu**:
- Play (large, prominent button)
- Settings (gear icon, top-right corner)
- High Scores (trophy icon)
- {Sound toggle (speaker icon)}

**Pause Menu** (overlay, semi-transparent background):
- Resume
- Restart
- Settings
- Quit to Menu

**Game Over Screen**:
- Final Score (large, animated)
- High Score indicator (if new record)
- Stage Reached
- "Watch Ad to Continue" button (if lives remain in rewarded continue system)
- "Play Again" button
- "Menu" button
- Share button (captures score screenshot)

**Settings Screen** (overlay):
- Sound Effects: On/Off toggle
- Music: On/Off toggle
- Vibration: On/Off toggle (if supported)

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every {N}th game over | After 5 seconds |
| Interstitial | After stage {N} complete | Every {N} stages | After 5 seconds |
| Rewarded | Continue after death | Every game over | Always (optional) |
| Rewarded | Double score bonus | End of session | Always (optional) |
| Banner | Menu screen only | Always visible on menu | N/A |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra Life | Watch rewarded ad after death | 1 additional life | Once per game |
| Score Multiplier | Watch rewarded ad at game over | 2x final score | Once per session |
| {Custom reward} | {Trigger} | {Value} | {Cooldown} |

### 7.3 Session Economy

{Describe the overall session economy: how does the game balance free play with monetization pressure? What is the expected revenue per session?}

**Session Flow with Monetization**:
```
[Play Free] → [Death] → [Rewarded Ad: Continue?]
                              │ Yes → [Resume + Interstitial later]
                              │ No  → [Game Over Screen]
                                          │
                                    [Interstitial Ad (every Nth game over)]
                                          │
                                    [Rewarded Ad: Double Score?]
                                          │ Yes → [Score doubled]
                                          │ No  → [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/{slug}/
├── index.html              # Entry point
│   ├── CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
│   ├── CDN: Howler.js      # https://cdn.jsdelivr.net/npm/howler@2/dist/howler.min.js
│   ├── Local CSS           # css/style.css
│   └── Local JS (ordered)  # config → main → game → stages → ui → ads
├── css/
│   └── style.css           # Responsive styles, mobile-first
└── js/
    ├── config.js           # Game constants, difficulty tables, color palette
    ├── main.js             # Phaser game init, scene registration, global state
    ├── game.js             # Main game scene (create, update, core mechanics)
    ├── stages.js           # Stage generation, difficulty scaling, procedural content
    ├── ui.js               # Menu scene, game over scene, HUD overlay, settings
    └── ads.js              # Ad integration hooks, reward callbacks, ad timing logic
```

### 8.2 Module Responsibilities

**config.js** (max 300 lines):
- Game dimensions and responsive scaling configuration
- Difficulty curve parameters (speed tables, obstacle counts, timing values)
- Color palette constants
- Score values and multiplier rules
- Stage generation parameters
- Audio asset definitions

**main.js** (max 300 lines):
- Phaser.Game initialization with responsive config
- Scene registration (MenuScene, GameScene, GameOverScene)
- Global game state management (high scores, settings, session data)
- Local storage read/write for persistence
- Orientation lock and viewport configuration

**game.js** (max 300 lines):
- Main GameScene extending Phaser.Scene
- `create()`: Initialize game objects, input handlers, physics
- `update()`: Main game loop, collision detection, score updates
- Player character creation and control
- Obstacle spawning and movement
- Collectible spawning and pickup
- Death detection and life management

**stages.js** (max 300 lines):
- Stage generation algorithm
- Difficulty parameter calculation based on stage number
- Procedural content generation (obstacle patterns, layouts)
- Stage transition logic and animations
- Special stage generation (boss stages, rest stages)
- Solvability validation

**ui.js** (max 300 lines):
- MenuScene: Main menu rendering, button handlers
- GameOverScene: Score display, high score check, action buttons
- HUD overlay: Score, stage, lives display during gameplay
- Pause overlay: Pause menu rendering and handlers
- Settings overlay: Sound, music, vibration toggles
- Share functionality: Score screenshot capture

**ads.js** (max 300 lines):
- Ad SDK initialization (placeholder hooks for ad network)
- Interstitial ad trigger logic (frequency tracking, timing)
- Rewarded ad trigger logic (continue prompt, score multiplier prompt)
- Ad event callbacks (onAdLoaded, onAdClosed, onAdRewarded, onAdFailed)
- Banner ad display/hide logic
- Ad analytics event tracking

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |
| Howler.js | 2.x | `https://cdn.jsdelivr.net/npm/howler@2/dist/howler.min.js` | Audio playback |
| PixiJS | 7.x (optional) | `https://cdn.jsdelivr.net/npm/pixi.js@7/dist/pixi.min.js` | Alternative renderer |

---

## 9. Implementation Notes

### 9.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <3 seconds on 4G | Performance.timing API |
| Memory Usage | <100MB | Chrome DevTools Memory panel |
| JS Bundle Size | <500KB total (excl. CDN) | File size check |
| First Interaction | <1 second after load | Time to first meaningful paint |

### 9.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Use Phaser's input system with `pointer` events (handles both touch and mouse)
- **Prevent Default**: Prevent pull-to-refresh, pinch-to-zoom, and double-tap-to-zoom
- **Orientation**: Lock to portrait mode via CSS and meta tags where supported
- **Safe Areas**: Account for notch/cutout safe areas on modern phones
- **Throttling**: Detect background state and pause game to prevent battery drain
- **Asset Loading**: Minimal assets (SVG generated in code), no loading screen needed

### 9.3 Touch Controls

- **Touch Target Size**: Minimum 44x44px for all interactive elements (Apple HIG guideline)
- **Gesture Recognition**: Simple gestures only (tap, swipe, hold). No complex multi-touch required.
- **Feedback**: Visual and haptic (vibration API where supported) feedback on every touch interaction
- **Dead Zones**: Implement small dead zones on swipe gestures to prevent accidental activation
- **Input Buffering**: Buffer the most recent input during animations to prevent input loss

### 9.4 Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome (Android) | 80+ | Primary target |
| Safari (iOS) | 14+ | Test audio autoplay restrictions |
| Samsung Internet | 14+ | Popular on Samsung devices |
| Firefox (Android) | 90+ | Secondary target |

### 9.5 Local Storage Schema

```json
{
  "{slug}_high_score": 0,
  "{slug}_games_played": 0,
  "{slug}_highest_stage": 0,
  "{slug}_settings": {
    "sound": true,
    "music": true,
    "vibration": true
  },
  "{slug}_total_score": 0,
  "{slug}_ad_free_until": null
}
```
