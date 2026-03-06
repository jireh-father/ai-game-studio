# Game Design Document: Fuse Network

**Slug**: `fuse-network`
**One-Liner**: Bombs are counting down across a fuse network — tap to cut and redirect fuses so explosions miss your base.
**Core Mechanic**: Real-time fuse-cutting on a node-and-line network graph with strategic path redirection under time pressure.
**Target Session Length**: 3-6 minutes
**Date Created**: 2026-03-06
**Author**: Architect

---

## 1. Overview

### 1.1 Concept Summary

Fuse Network is a real-time strategy-action game where the player defends a base at the bottom of the screen from incoming explosions traveling along a network of fuse lines. Lit fuses burn from bomb nodes at the top of the screen downward through a branching network of connected nodes. The player taps on fuse segments to CUT them, severing the fire's path and forcing it to dead-end harmlessly or redirect through safe detonation zones along the screen edges.

The core tension is visible and immediate: you can SEE the sparking flame crawling toward your base, and every cut you make reshapes the network in real time. Cut too early and you might redirect fire down an even worse path. Cut at the last possible second — when the flame is within 40px of the cut point — and you earn a massive 3x score multiplier. This risk/reward mechanic is the heartbeat of the game: safe cuts earn modest points, but clutch last-second cuts feel incredible and rack up huge scores.

As stages progress, the network grows denser, multiple bombs ignite simultaneously, and new fuse types appear: fast fuses that burn at 2x speed, delayed fuses that pause mid-burn then sprint, and split fuses that branch into two paths. The player's base has 3 hit points — lose them all and it's game over. Inactivity is fatal: with no cuts, all fuses reach the base within 8-10 seconds.

### 1.2 Target Audience

Casual mobile gamers aged 14-40 who enjoy quick-reflex puzzle games with visible consequences. Players who like the spatial reasoning of tower defense but want faster, more visceral gameplay. Play context: commute breaks, waiting rooms, quick dopamine sessions. Low skill floor (tap to cut a line) but high skill ceiling (optimal cut ordering, last-second timing, network path prediction).

### 1.3 Core Fantasy

You are a bomb squad technician racing against burning fuses. Sparks fly, fuses hiss, and every cut you make is a life-or-death decision. The satisfaction comes from watching a flame die inches from your base after a perfectly timed last-second cut, the screen erupting in particles and the score multiplier flashing "3x!" in gold.

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Average Session Length | 3-6 minutes |
| Day 1 Retention | 42%+ |
| Day 7 Retention | 22%+ |
| Average Stages per Session | 8-18 |
| Crash Rate | <1% |

---

## 2. Game Mechanics

### 2.1 Core Loop

```
[Stage Start: Network revealed, bombs ignite]
    -> [Fuses begin burning toward base]
    -> [Player taps fuse segments to CUT them]
    -> [Fire redirects or dead-ends at cut points]
    -> [All bombs neutralized = Stage Clear!]
    -> [Score + time bonus + last-second bonus]
    -> [Next stage (harder, more bombs, new fuse types)]
         |
    OR: [Fire reaches base node = EXPLOSION = Lose 1 HP]
         |
    -> [HP remaining?] -> YES -> [Continue same stage, remaining bombs still active]
                        -> NO  -> [Game Over -> Retry / Menu]
```

**Moment-to-moment**: The player sees a network of nodes connected by fuse lines. Bomb nodes at the top glow red and ignite fuses that burn downward. The player scans the network to identify which paths lead to their base (bottom-center node). They tap fuse segments to sever them — a satisfying snip with sparks flying from the cut point. The fire reaches the severed end and dies. But cutting one path may force fire down a branch that also leads to the base, so the player must think ahead. The stage clears when all bomb fires are neutralized (dead-ended or routed to edge safe zones). The player is constantly balancing speed (cut before fire reaches base) with strategy (cut the RIGHT segment) and greed (wait for last-second bonus).

### 2.2 Controls

| Action | Touch Gesture | Description |
|--------|--------------|-------------|
| Cut Fuse | Tap on fuse segment | Severs the fuse line at the tapped point. Fire can no longer pass through. Instant visual/audio feedback. |
| Use Defusal Kit | Tap power-up icon | Activates bomb defusal kit (freezes all fuses for 3 seconds). Rewarded ad power-up. |
| Pause | Tap pause icon | Opens pause overlay (top-right corner, 48x48px). |

**Control Philosophy**: Single-tap only. The entire game area is the interaction zone. Every fuse segment is a valid tap target. The challenge is cognitive (which fuse to cut, when to cut) not motor. Tap targets are generous — any tap within 30px of a fuse segment registers as a cut on that segment. When segments overlap or are close, the nearest segment to the tap point is selected.

**Touch Area Map**:
```
+----------------------------------+
| Score  Stage N  [Kit]  [||] ooo  |  <- HUD bar (56px height)
+----------------------------------+
|  [BOMB]----[node]----[BOMB]      |
|      \       |       /           |
|   [node]--[node]--[node]         |  <- Network area (full game area)
|      |    /    \    |            |     Tap ANY fuse segment to cut
|   [node]--[node]--[node]         |
|      \       |       /           |
|        \  [BASE]  /              |
+----------------------------------+
|   Safe Zone  |  Safe Zone        |  <- Edge detonation zones
+----------------------------------+
```

### 2.3 Scoring System

| Score Event | Points | Multiplier Condition |
|------------|--------|---------------------|
| Fuse Cut (normal) | 50 | Base points for any cut |
| Fuse Cut (last-second) | 150 (3x) | Fire is within 40px of cut point when cut |
| Fuse Cut (close call) | 100 (2x) | Fire is within 80px of cut point when cut |
| Stage Clear | 200 base | +100 per stage number (stage 5 = 700) |
| Time Bonus | 15 per second remaining | Remaining stage timer seconds x 15 |
| Perfect Clear | 300 bonus | No base HP lost during stage |
| Flawless Clear | 500 bonus | All cuts were last-second (3x) cuts |
| Safe Zone Redirect | 75 | Fire routed to edge safe zone instead of dead-ending |

**Combo System**: Consecutive last-second cuts (3x) within a single stage build a combo counter. Each consecutive 3x cut adds +25 bonus points on top of the 150. So: 1st 3x = 150, 2nd consecutive 3x = 175, 3rd = 200, etc. The combo counter displays prominently and resets if the player makes a normal (1x) cut or takes base damage. Visual escalation: combo text grows +2px per combo level, particles increase by +3 per level.

**High Score**: Stored in `localStorage` as `fuse_network_high_score`. Displayed on menu screen and game over screen. New high score triggers gold particle burst and "NEW BEST!" pulsing text.

### 2.4 Progression System

The game has infinite procedurally generated stages. Each stage introduces a new network layout with increasing complexity. Progression comes from more bombs, denser networks, faster fuses, and new fuse types.

**Progression Milestones**:

| Stage Range | New Element Introduced | Difficulty Modifier |
|------------|----------------------|-------------------|
| 1-3 | 1 bomb, simple linear paths (3-4 nodes), normal fuses only | Tutorial: slow burn 60px/s, 15s timer, network has obvious cuts |
| 4-8 | 2 bombs, branching paths (5-7 nodes), first network branches | Easy: burn 80px/s, 13s timer, 1-2 branches per path |
| 9-15 | Fast fuses introduced (burn at 2x = 160px/s, colored orange) | Medium: burn 100px/s base, 11s timer, 2-3 branches |
| 16-25 | Delayed fuses (pause 1.5s mid-path, then sprint at 3x), 3 bombs | Hard: burn 120px/s base, 10s timer, denser network 8-10 nodes |
| 26-40 | Split fuses (branch into 2 paths at split node), 3-4 bombs | Very Hard: burn 140px/s base, 9s timer, 10-12 nodes |
| 41+ | All types combined, 4-5 bombs, maximum network density | Extreme: burn 160px/s base, 8s timer, 12-14 nodes, all fuse types |

### 2.5 Lives and Failure

The player's base has **3 HP** (displayed as shield icons). HP cannot be earned through gameplay (only via rewarded ad power-up).

| Failure Condition | Consequence | Recovery Option |
|------------------|-------------|-----------------|
| Fire reaches base node | Lose 1 HP, explosion at base, stage continues with remaining bombs | None during stage |
| All 3 HP lost | Game Over screen | Watch rewarded ad for +1 HP (once per game) |
| Inactivity (no taps for 8s) | Fuses naturally reach base — lose HP rapidly | N/A (natural death from inaction) |
| Stage timer expires | All remaining active fuses instantly sprint to endpoints at 5x speed | Must cut frantically or take damage |

**Inactivity Death Guarantee**: On stage 1, one bomb ignites a fuse that burns at 60px/s toward the base ~480px away = reaches base in 8 seconds. By stage 4+, with 2 bombs and 80px/s speed, inactivity causes first base hit in ~6 seconds and game over within 10 seconds. No player can survive 30 seconds of inactivity at any stage.

---

## 3. Stage Design

### 3.1 Infinite Stage System

Each stage generates a network graph of nodes connected by fuse segments, with bomb nodes at top and a base node at bottom.

**Generation Algorithm**:
```
Stage Generation Parameters:
- Node Count: 5 + floor(stage * 0.6), capped at 14
- Bomb Count: 1 (stages 1-3), 2 (stages 4-15), 3 (stages 16-25), 4 (stages 26-40), 5 (stages 41+)
- Fuse Burn Speed: 60 + (stage - 1) * 5, capped at 160 px/s
- Stage Timer: max(8, 15 - floor(stage / 5)) seconds
- Network Density: edges = nodes * 1.3 (stages 1-8), nodes * 1.5 (stages 9-25), nodes * 1.7 (stages 26+)
- Fast Fuse Chance: 0% (stages 1-8), 20% (9-15), 35% (16-25), 50% (26+)
- Delayed Fuse Chance: 0% (stages 1-15), 15% (16-25), 30% (26+)
- Split Fuse Chance: 0% (stages 1-25), 20% (26-40), 35% (41+)
- Safe Zone Count: 2 (always, left and right screen edges)
```

**Step-by-step generation**:
1. Place base node at bottom-center (x=gameWidth/2, y=gameHeight-100).
2. Place bomb nodes across top area (y=80 to y=140), evenly spaced horizontally with 40px random jitter.
3. Generate intermediate nodes in a grid-like distribution across the play area (y=160 to y=gameHeight-160), with 30px random jitter to prevent perfect grid look.
4. For each bomb node, create a guaranteed path to the base node through 2-4 intermediate nodes using shortest-path-biased random walk (preferring downward movement, 60% down, 20% left, 20% right).
5. Add branch edges: for each intermediate node on a base-path, 30-50% chance to connect to a nearby non-path node (creates branches and alternate routes).
6. Connect some branch endpoints to safe zone nodes (left edge x=20, right edge x=gameWidth-20) at random y positions.
7. Assign fuse types to each edge based on stage difficulty parameters (random roll against fast/delayed/split chances).
8. Validate: every bomb has at least one path to the base (guaranteed by step 4). At least one cut exists per bomb-to-base path that can neutralize it.
9. Calculate minimum cuts needed to protect base. If < bomb_count, add an extra branch to increase required cuts.

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
    0    10    20    30    40    50    60    70+
```

**Difficulty Parameters by Stage Range**:

| Parameter | Stage 1-3 | Stage 4-8 | Stage 9-15 | Stage 16-25 | Stage 26-40 | Stage 41+ |
|-----------|-----------|-----------|------------|-------------|-------------|-----------|
| Burn Speed (px/s) | 60 | 80 | 100 | 120 | 140 | 160 |
| Bomb Count | 1 | 2 | 2 | 3 | 3-4 | 4-5 |
| Node Count | 5-6 | 7-8 | 8-10 | 10-12 | 11-13 | 12-14 |
| Timer (sec) | 15 | 13 | 12 | 10 | 9 | 8 |
| Fast Fuses | No | No | 20% | 35% | 50% | 50% |
| Delayed Fuses | No | No | No | 15% | 30% | 30% |
| Split Fuses | No | No | No | No | 20% | 35% |
| Min Cuts to Survive | 1 | 2 | 2-3 | 3-4 | 4-5 | 5-6 |
| New Mechanic | None | Branches | Fast fuses | Delayed fuses | Split fuses | All mixed |

### 3.3 Stage Generation Rules

1. **Solvability Guarantee**: Every stage is solvable. The generation algorithm guarantees that for every bomb-to-base path, at least one edge can be cut to sever it. The validation step in generation confirms that a set of cuts exists that blocks all bomb paths to the base simultaneously.
2. **Variety Threshold**: Consecutive stages must differ in at least 2 of: bomb positions, node layout, branch structure, fuse type distribution. The random jitter on node positions and random walk paths ensure this naturally.
3. **Difficulty Monotonicity**: Burn speed and bomb count never decrease between stages. Timer only decreases.
4. **Rest Stages**: Every 10th stage (10, 20, 30...) is a "breather" with -1 bomb and +3 seconds on timer. Network is slightly sparser (density multiplier reduced by 0.2).
5. **Boss Stages**: Every 15th stage features a "mega bomb" visual treatment: one bomb is 2x size, burns at 1.5x speed, and the base node pulses red as warning. Clearing a boss stage awards 2x the normal stage clear bonus.

### 3.4 Fuse Types

| Fuse Type | Visual | Burn Speed | Special Behavior | Stage Introduced |
|-----------|--------|-----------|-----------------|------------------|
| Normal | White-yellow (#FFE0A0) line, 3px wide | Base speed (60-160px/s by stage) | Burns steadily from source to endpoint | Stage 1 |
| Fast | Orange (#FF8C00) line, 4px wide, dashed | 2x base speed | Burns at double speed, brighter sparks | Stage 9 |
| Delayed | Cyan (#00CED1) line, 3px wide, dotted | Pauses 1.5s at midpoint, then 3x base speed | Pauses with pulsing glow, then sprints | Stage 16 |
| Split | Magenta (#FF00FF) line, 3px wide, double-line | Base speed until split node, then branches into 2 normal-speed paths | At marked split node, fire divides into 2 separate fronts | Stage 26 |

### 3.5 Network Layout Algorithm

```
Layout zones (portrait screen ~390x700 play area):

Top Zone (y: 80-140):     Bomb nodes placed here
                           Evenly spaced, 40px jitter

Upper Mid (y: 180-300):   First layer of intermediate nodes
                           2-4 nodes per row

Lower Mid (y: 320-460):   Second layer of intermediate nodes
                           2-4 nodes per row

Bottom Zone (y: 500-580): Final intermediate layer before base
                           1-3 nodes

Base (y: 620):             Single base node, centered

Safe Zones:                Left edge (x: 20, y: 200-500)
                           Right edge (x: gameWidth-20, y: 200-500)
                           2-3 safe nodes per edge
```

Node placement uses a force-directed relaxation pass (3 iterations) to prevent overlapping: nodes repel each other if closer than 60px, pushed apart by 10px per iteration.

---

## 4. Visual Design

### 4.1 Style Guide

**Art Direction**: Dark industrial/demolition aesthetic with neon-glow fuse lines on a dark slate background. Bombs are bold red circles with timer displays. The base is a reinforced bunker shape. Nodes are small junction points. The overall feel is tense and tactical — like defusing a bomb in a dark room lit only by burning fuses.

**Aesthetic Keywords**: dark-industrial, neon-fuse, bomb-squad, tension-glow, tactical-minimal

**Reference Palette**: Think Bomb Squad meets Tron. Dark backgrounds with vivid burning fuse lines creating a web of light.

### 4.2 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Dark Slate | #1A1A2E | Game background |
| Network Lines (unlit) | Dim Gray | #3A3A4E | Unburned fuse segments |
| Fuse Fire (normal) | Warm Yellow | #FFE44D | Active burning flame on normal fuses |
| Fuse Fire (fast) | Hot Orange | #FF8C00 | Active flame on fast fuses |
| Fuse Fire (delayed) | Electric Cyan | #00CED1 | Active flame on delayed fuses (paused state) |
| Fuse Fire (split) | Neon Magenta | #FF00FF | Active flame on split fuses |
| Bomb Node | Danger Red | #FF2D2D | Bomb circles |
| Bomb Timer | White | #FFFFFF | Countdown text on bombs |
| Base Node | Shield Blue | #4488FF | Player's base |
| Base Damaged | Warning Orange | #FF6B35 | Base after taking damage |
| Safe Zone | Muted Green | #2ECC71 | Edge safe detonation nodes |
| Node Junction | Light Gray | #AAAACC | Intermediate network nodes |
| Cut Mark | Bright Red | #FF4444 | X mark where fuse was cut |
| Score Text | Gold | #FFD700 | Floating score numbers |
| UI Text | White | #FFFFFF | HUD labels, menu text |
| UI Accent | Electric Blue | #00AAFF | Buttons, highlights |
| UI Background | Dark Overlay | #000000CC | Menu/overlay backgrounds |
| HP Shield | Cyan | #44DDFF | Shield icons (full) |
| HP Empty | Dark Gray | #333344 | Shield icons (empty) |

### 4.3 SVG Specifications

All graphics rendered as SVG, encoded as base64 in `config.js`, registered once in BootScene.

**Bomb Node** (48x48):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="24" cy="26" r="18" fill="#FF2D2D"/>
  <circle cx="24" cy="26" r="14" fill="#CC1111"/>
  <circle cx="24" cy="26" r="8" fill="#FF4444" opacity="0.6"/>
  <rect x="20" y="4" width="8" height="10" rx="2" fill="#888888"/>
  <line x1="24" y1="4" x2="24" y2="0" stroke="#FFE44D" stroke-width="2" stroke-linecap="round"/>
</svg>
```

**Base Node (Shield)** (56x56):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56">
  <path d="M28 4 L48 16 L48 36 Q48 48 28 54 Q8 48 8 36 L8 16 Z" fill="#4488FF" stroke="#66AAFF" stroke-width="2"/>
  <path d="M28 12 L40 20 L40 34 Q40 42 28 46 Q16 42 16 34 L16 20 Z" fill="#2266CC" opacity="0.6"/>
  <text x="28" y="36" text-anchor="middle" fill="#FFFFFF" font-size="16" font-weight="bold">B</text>
</svg>
```

**Base Node Damaged** (56x56):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56">
  <path d="M28 4 L48 16 L48 36 Q48 48 28 54 Q8 48 8 36 L8 16 Z" fill="#FF6B35" stroke="#FF8855" stroke-width="2"/>
  <path d="M28 12 L40 20 L40 34 Q40 42 28 46 Q16 42 16 34 L16 20 Z" fill="#CC4400" opacity="0.6"/>
  <line x1="18" y1="18" x2="38" y2="42" stroke="#FFE44D" stroke-width="2" opacity="0.4"/>
  <line x1="22" y1="40" x2="36" y2="14" stroke="#FFE44D" stroke-width="1.5" opacity="0.3"/>
</svg>
```

**Junction Node** (24x24):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="8" fill="#3A3A4E" stroke="#AAAACC" stroke-width="2"/>
  <circle cx="12" cy="12" r="4" fill="#666688"/>
</svg>
```

**Safe Zone Node** (32x32):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect x="2" y="2" width="28" height="28" rx="6" fill="#1A3A2E" stroke="#2ECC71" stroke-width="2"/>
  <path d="M10 16 L14 20 L22 12" stroke="#2ECC71" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Cut Mark (X)** (28x28):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">
  <line x1="4" y1="4" x2="24" y2="24" stroke="#FF4444" stroke-width="4" stroke-linecap="round"/>
  <line x1="24" y1="4" x2="4" y2="24" stroke="#FF4444" stroke-width="4" stroke-linecap="round"/>
</svg>
```

**Shield Icon (HP Full)** (20x20):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
  <path d="M10 1 L18 5 L18 12 Q18 17 10 19 Q2 17 2 12 L2 5 Z" fill="#44DDFF" stroke="#66EEFF" stroke-width="1"/>
</svg>
```

**Shield Icon (HP Empty)** (20x20):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
  <path d="M10 1 L18 5 L18 12 Q18 17 10 19 Q2 17 2 12 L2 5 Z" fill="#333344" stroke="#555566" stroke-width="1"/>
</svg>
```

**Defusal Kit Icon** (36x36):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
  <rect x="4" y="10" width="28" height="20" rx="3" fill="#2A5A2A" stroke="#44AA44" stroke-width="2"/>
  <line x1="12" y1="5" x2="12" y2="10" stroke="#44AA44" stroke-width="2"/>
  <line x1="24" y1="5" x2="24" y2="10" stroke="#44AA44" stroke-width="2"/>
  <rect x="8" y="14" width="20" height="12" rx="2" fill="#1A3A1A"/>
  <text x="18" y="24" text-anchor="middle" fill="#44FF44" font-size="10" font-weight="bold">KIT</text>
</svg>
```

**Design Constraints**:
- All SVG elements use basic shapes (rect, circle, path, line, text) only
- Max 8 path/shape elements per SVG object
- Fuse lines drawn via Phaser Graphics (not sprites) for dynamic rendering
- Fire particles rendered as Phaser particle emitters for performance
- Nodes rendered as sprites placed at graph node coordinates

### 4.4 Visual Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Fuse Burn Trail | Fire advancing along fuse | 4px yellow (#FFE44D) circle at fire position, trailing 5 fading sparks (3px, alpha 0.8/0.6/0.4/0.2/0.1) behind it. Sparks jitter +/-2px randomly. |
| Cut Sparks | Player taps to cut fuse | 12 white-yellow (#FFFFAA) particles burst from cut point, radial, speed 60-120px/s, lifespan 300ms, size 2-4px. Red X mark appears at cut point. |
| Last-Second Cut | Cut with fire within 40px | All cut spark effects + screen flash white alpha 0.2 for 80ms + "3x!" gold text at cut point + camera shake 3px for 100ms |
| Base Hit | Fire reaches base | 25 orange (#FF6B35) + red (#FF2D2D) particles from base, speed 80-160px/s, lifespan 500ms. Screen shake 10px for 300ms. Base sprite flashes red 3 times over 400ms. Screen red vignette flash 200ms. |
| Stage Clear | All bombs neutralized | All remaining fuse lines flash gold sequentially (30ms stagger). Safe zone nodes pulse green. 20 gold (#FFD700) particles from base, celebratory radial burst. Base shield glows bright blue 500ms. |
| Bomb Ignite | Stage start | Each bomb pulses red 1.0->1.4 scale over 200ms with 8 red sparks. Sequential ignition with 150ms delay between bombs. |
| Delayed Fuse Pause | Delayed fuse reaches midpoint | Cyan (#00CED1) pulse ring expands from pause point, r=0->30px, alpha 1->0 over 1000ms. Fuse glows brighter cyan during pause. |
| Split Fuse Branch | Fire reaches split node | Magenta (#FF00FF) flash at split point 100ms. 8 magenta particles. Two new fire fronts emerge. |
| Safe Detonation | Fire reaches safe zone node | 10 green (#2ECC71) particles, small pop effect, safe node briefly scales 1.0->1.2->1.0 over 200ms |
| Network Appear | Stage start | Nodes fade in from alpha 0->1 over 200ms with 30ms stagger (top to bottom). Fuse lines draw from node to node over 150ms each. |
| Timer Warning | Timer < 3 seconds | Timer text turns red (#FF2D2D), pulses scale 1.0->1.15->1.0 every 400ms. Subtle red border glow around play area. |

---

## 5. Audio Design

### 5.1 Sound Effects

| Event | Sound Description | Duration | Priority |
|-------|------------------|----------|----------|
| Fuse Cut | Sharp snip/clip sound, metallic scissors feel | 100ms | High |
| Last-Second Cut | Snip + dramatic reverb whoosh | 200ms | High |
| Fuse Burning (loop) | Soft crackling hiss, pitch rises as fire nears base | Looping per fire | Low |
| Bomb Ignite | Deep thump + sizzle start | 200ms | High |
| Base Hit | Heavy explosion thud + glass crack | 400ms | High |
| Stage Clear | Ascending triumphant chime, 3 quick notes | 500ms | High |
| Delayed Fuse Pause | Eerie charge-up hum | 1500ms (during pause) | Medium |
| Delayed Fuse Sprint | Rapid sizzle acceleration | 300ms | Medium |
| Split Fuse Branch | Quick electrical split zap | 150ms | Medium |
| Safe Detonation | Soft pop with muffled boom | 200ms | Low |
| Timer Warning Tick | Sharp beep every 400ms | 80ms per beep | Medium |
| Game Over | Low descending rumble + somber tone | 800ms | High |
| New High Score | Celebratory ascending sparkle cascade | 1200ms | High |
| UI Button Press | Subtle click | 60ms | Low |
| Defusal Kit Activate | Power-up whoosh + freeze crackle | 300ms | High |
| Combo Increment | Quick ascending "ding", pitch +8% per combo | 80ms | Medium |

### 5.2 Music Concept

**Background Music**: No background music track. The ambient burning-fuse crackling and sound effects create a tense atmosphere. This keeps file size minimal and avoids audio loading complexity.

**Audio Implementation**: All sounds generated via Web Audio API (Phaser's built-in sound manager) using synthesized tones:
- Snip: 2000Hz square wave, 100ms, sharp decay
- Explosion: White noise burst, 400ms, low-pass filtered at 800Hz
- Hiss: Pink noise, continuous, volume proportional to number of active fires
- Chime: 880Hz->1760Hz sine sweep, 500ms
- Beep: 1200Hz square wave, 80ms

---

## 6. UI/UX

### 6.1 Screen Flow

```
+----------+     +----------+     +----------+
|  Boot    |---->|   Menu   |---->|   Game   |
|  Scene   |     |  Screen  |     |  Screen  |
+----------+     +-----+----+     +-----+----+
                    |   |               |
               +----+   |         +----+----+
               |        |         |  Pause  |-->+---------+
          +----+----+   |         | Overlay |   |  Help   |
          |  Help   |   |         +----+----+   |How2Play |
          |How2Play |   |              |        +---------+
          +---------+   |         +----+----+
                   +----+----+    |  Game   |
                   |Settings |    |  Over   |
                   | Overlay |    | Screen  |
                   +---------+    +----+----+
                                       |
                                  +----+----+
                                  | Ad /    |
                                  |Continue |
                                  | Prompt  |
                                  +---------+
```

### 6.2 HUD Layout

```
+---------------------------------+
| Score: 2450   Stage 7  [K][||]ooo|  <- Top bar (56px)
+---------------------------------+
|                                  |
|     [BOMB]------[node]           |
|         \         |              |
|      [node]----[node]----[BOMB]  |  <- Network play area
|         |      /     \     |     |     Tap fuse segments to cut
|      [node]--[node]  [node]      |
|           \    |     /           |
|            [  BASE  ]            |
|  [safe]                  [safe]  |
+---------------------------------+
|  Timer: 9s  Combo: x3 (+200)    |  <- Bottom bar (36px)
+---------------------------------+
```

**HUD Elements**:

| Element | Position | Content | Update Frequency |
|---------|----------|---------|-----------------|
| Score | Top-left (12px, 28px) | Current score, white, 22px bold font | On score change |
| Stage | Top-center | "Stage N", white, 18px font | On stage transition |
| Defusal Kit Icon | Top-right area (gameWidth-110, 8px) | Kit icon 36x36px, grayed if unavailable | On kit use/gain |
| Pause Button | Top-right (gameWidth-56, 8px) | "||" icon, 44x44px tap target | Always visible |
| HP Shields | Top-right (right of pause) | 3 shield icons 20px each, 4px gap | On HP change |
| Timer | Bottom-left (12px, gameHeight-28px) | Countdown seconds, white -> red under 3s, 20px | Every 100ms |
| Combo Counter | Bottom-right | "Combo: xN (+pts)", gold (#FFD700), 16px | On combo change |
| Last-Second Text | Near cut point | "3x!" gold text, floats up and fades | On last-second cut |

### 6.3 Menu Structure

**Main Menu** (MenuScene):
- Game title "FUSE NETWORK" in electric blue (#00AAFF), 30px bold, centered at y=22%
- Subtitle: "Cut the fuse. Save the base." in white, 14px, y=30%
- Animated background: 3 faint fuse lines slowly burning across screen (decorative, non-interactive)
- **PLAY** button: Large blue rounded rect (200x56px), centered at y=52%, white text "PLAY" 26px bold
- **How to Play** button: "?" circle icon (44x44px), y=66%, left of center by 60px
- **High Score** display: Trophy icon + score value, y=66%, right of center by 60px
- **Sound Toggle**: Speaker icon (44x44px), top-right corner (gameWidth-52, 8px)
- Best stage display: "Best: Stage N" in gray, 14px, y=74%

**Pause Menu** (overlay, #000000 at 75% opacity):
- "PAUSED" text, white, 28px, centered at y=25%
- Resume button (180x48px), y=40%
- How to Play button (180x48px), y=52%
- Restart button (180x48px), y=64%
- Quit to Menu button (180x48px), y=76%

**Game Over Screen** (GameOverScene):
- "BASE DESTROYED!" text, red (#FF2D2D), 28px, y=12%
- Final Score: large white text, 38px, y=26%, with scale punch animation
- "NEW BEST!" indicator if high score, gold text, 20px, pulsing
- Stage Reached: "Stage N", white, 18px, y=36%
- Best Combo: "Best Combo: xN", gold, 16px, y=42%
- "Continue (Watch Ad)" button: green (200x48px), y=54% — grants +1 HP and resumes from current stage (once per game)
- "Defusal Kit (Watch Ad)" button: orange (200x48px), y=64% — adds kit for next game (once per session)
- "Play Again" button: blue (200x48px), y=74%
- "Menu" button: gray (140x40px), y=86%

**Help / How to Play Screen** (HelpScene overlay):
- Title: "HOW TO PLAY", electric blue, 24px, y=6%
- **Visual diagram 1**: SVG illustration showing a mini network with bomb at top, base at bottom, arrow pointing to a fuse segment with a tap finger icon and scissors. Caption: "TAP fuse segments to CUT them"
- **Visual diagram 2**: SVG showing fire burning along a fuse, reaching a cut point and dying with sparks. Caption: "Cut fuses to STOP fire from reaching your BASE"
- **Visual diagram 3**: SVG showing fire very close to cut point with "3x!" text. Caption: "Cut at the LAST SECOND for 3x points!"
- **Fuse type guide**: 4 small colored line samples with labels:
  - Yellow line = "Normal fuse"
  - Orange dashed = "Fast fuse (2x speed)"
  - Cyan dotted = "Delayed fuse (pauses then sprints)"
  - Magenta double = "Split fuse (branches into 2)"
- **Rules**:
  - "Protect your base (3 HP shield)"
  - "Route fire to green safe zones for bonus points"
  - "Build combos with consecutive last-second cuts"
- **Tips**:
  - "Prioritize fast fuses — they reach your base first!"
  - "Watch for delayed fuses — they look slow but sprint suddenly"
  - "Sometimes NOT cutting lets fire reach a safe zone for bonus points"
- **"Got it!" button**: blue (160x48px), bottom center at y=92%, returns to previous screen
- Scrollable if content exceeds viewport height

---

## 7. Monetization

### 7.1 Ad Placements

| Ad Type | Trigger Point | Frequency | Skippable |
|---------|--------------|-----------|-----------|
| Interstitial | After game over | Every 3rd game over | After 5 seconds |
| Rewarded | Continue after game over (+1 HP) | Every game over | Always (optional) |
| Rewarded | Bomb Defusal Kit power-up | Game over screen | Always (optional), once per session |
| Rewarded | Double final score | After game over score display | Always (optional) |

### 7.2 Reward System

| Reward Type | Trigger | Value | Cooldown |
|-------------|---------|-------|----------|
| Extra HP (Continue) | Watch rewarded ad at game over | +1 HP, resume from current stage | Once per game session |
| Bomb Defusal Kit | Watch rewarded ad at game over | Freezes all fuses for 3s, usable once next game | Once per session |
| Score Doubler | Watch rewarded ad at score screen | 2x final score | Once per game session |

### 7.3 Session Economy

The game targets quick sessions of 3-6 minutes. Average player reaches stage 8-12 before game over. Expected 2-3 game overs per session. Interstitial ads trigger every 3rd game over (~1 per session). Rewarded ads are always optional but the Defusal Kit provides a tangible advantage that drives engagement with the ad format.

**Session Flow with Monetization**:
```
[Play Free] -> [Base HP = 0] -> [Game Over]
                                      |
                            [Rewarded Ad: Continue? (+1 HP)]
                                  | Yes -> [Resume from current stage]
                                  | No  -> [Score Screen]
                                                |
                                       [Rewarded Ad: Defusal Kit?]
                                                |
                                       [Interstitial (every 3rd game over)]
                                                |
                                       [Rewarded Ad: 2x Score?]
                                           | Yes -> [Score doubled]
                                           | No  -> [Play Again / Menu]
```

---

## 8. Technical Architecture

### 8.1 File Structure

```
games/fuse-network/
+-- index.html              # Entry point
|   +-- CDN: Phaser 3       # https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js
|   +-- Local CSS           # css/style.css
|   +-- Local JS (ordered)  # config -> stages -> ads -> help -> ui -> game -> main (LAST)
+-- css/
|   +-- style.css           # Responsive styles, mobile-first
+-- js/
    +-- config.js           # Colors, difficulty tables, SVG strings, score values
    +-- main.js             # BootScene, Phaser init, scene registration (loads LAST)
    +-- game.js             # GameScene: network rendering, input, fire simulation, cut logic
    +-- stages.js           # Network generation algorithm, difficulty scaling, fuse type assignment
    +-- ui.js               # MenuScene, GameOverScene, HUD overlay, pause
    +-- help.js             # HelpScene: illustrated how-to-play with fuse type guide
    +-- ads.js              # Ad integration hooks, reward callbacks
```

**Script load order in index.html** (critical):
1. `js/config.js`
2. `js/stages.js`
3. `js/ads.js`
4. `js/help.js`
5. `js/ui.js`
6. `js/game.js`
7. `js/main.js` **(MUST be LAST)**

### 8.2 Module Responsibilities

**config.js** (~90 lines):
- `COLORS` object: all hex color constants from palette
- `DIFFICULTY` table: per-stage-range parameters (burn speed, bomb count, node count, timer, fuse type chances)
- `FUSE_TYPES` enum: NORMAL=0, FAST=1, DELAYED=2, SPLIT=3
- `FUSE_VISUAL` map: for each fuse type, color hex, line width, dash pattern
- `SVG_STRINGS` object: all SVG markup as template literal strings (bomb, base, node, safe zone, cut mark, shields, kit icon)
- `SCORE_VALUES` object: cut base (50), last-second multiplier (3), close-call multiplier (2), stage clear base (200), time bonus per sec (15), perfect bonus (300), flawless bonus (500), safe redirect (75), combo increment (25)
- `GAME_CONFIG` object: initial HP (3), last-second threshold (40px), close-call threshold (80px), defusal kit duration (3000ms), inactivity timeout (8000ms)
- `LAYOUT` object: top zone y range, bottom zone y, base position, safe zone positions, HUD height (56px), bottom bar height (36px)

**main.js** (~55 lines):
- `BootScene`: extends Phaser.Scene. In `preload()`: encode all SVG strings from `config.js` via `btoa()`, call `this.textures.addBase64()` for each. In `create()`: listen for all `addtexture` events, start MenuScene when all loaded.
- Phaser.Game config: type AUTO, scale mode FIT, parent 'game-container', backgroundColor COLORS.BACKGROUND, scene array [BootScene, MenuScene, GameScene, GameOverScene, HelpScene]
- `GameState` global: { score, stage, hp, highScore, bestStage, bestCombo, hasKit, settings }
- localStorage read/write for high score, best stage, and settings

**game.js** (~290 lines):
- `GameScene` extends Phaser.Scene
- `create()`: Call `StageGenerator.generate(stageNumber)` to get network graph. Render nodes as sprites. Draw fuse lines via Phaser Graphics. Set up tap input on fuse segments (pointer detection within 30px of line). Initialize fire state for each bomb. Start stage timer. Start fire advancement in `update()`.
- `update(time, delta)`: Advance all active fires along fuse paths. Check for fire reaching cut points (dead-end). Check for fire reaching base (damage). Check for fire reaching safe zones (bonus). Check for all fires neutralized (stage clear). Update fire visual positions. Update timer.
- `cutFuse(segment)`: Sever fuse segment at tapped point. Calculate distance from nearest fire to cut point — if <40px: last-second (3x), if <80px: close-call (2x), else normal (1x). Play cut effects. Place cut mark sprite. Update combo counter. Recalculate active fire paths.
- `advanceFire(fireObj, delta)`: Move fire along connected fuse segments. Handle delayed fuse pause/sprint. Handle split fuse branching. Check for endpoint conditions (cut, base, safe zone, dead end).
- `onBaseHit(fireObj)`: Base damage effects, lose 1 HP, check game over.
- `onStageClear()`: Score calculation, cascade effect, transition to next stage.
- `activateKit()`: If hasKit, freeze all fires for 3000ms (set fireObj.frozen = true, skip advancement). Visual: blue tint on all fuse lines, ice particles.
- `checkInactivity()`: Track lastTapTime. If now - lastTapTime > 8000ms and any fire active, fires continue naturally (no special penalty — natural death occurs).

**stages.js** (~200 lines):
- `StageGenerator.generate(stageNumber)`: Returns { nodes: [{x, y, type, id}], edges: [{from, to, fuseType, length}], bombs: [nodeIds], base: nodeId, safeZones: [nodeIds] }.
- `_placeBombs(count, gameWidth)`: Place bomb nodes at top zone with even spacing + jitter.
- `_placeBase(gameWidth, gameHeight)`: Place base node at bottom center.
- `_placeIntermediateNodes(count, gameWidth, gameHeight)`: Distribute nodes in layered zones with jitter.
- `_placeSafeZones(gameWidth, gameHeight)`: Place 2-3 nodes per screen edge.
- `_buildPaths(bombs, base, intermediateNodes)`: For each bomb, create guaranteed path to base via random walk.
- `_addBranches(nodes, edges, density)`: Add branch edges connecting non-path nodes.
- `_connectSafeZones(nodes, edges, safeZones)`: Connect some branches to safe zone nodes.
- `_assignFuseTypes(edges, stageNumber)`: Assign fuse types based on difficulty parameters.
- `_relaxLayout(nodes, iterations)`: Force-directed relaxation to prevent overlapping (3 iterations, 60px min distance).
- `_validate(graph)`: Confirm every bomb has path to base, and cuttable.
- `_getDifficultyParams(stageNumber)`: Returns full difficulty parameter set.

**ui.js** (~280 lines):
- `MenuScene`: Title text, subtitle, animated background fuses, play button, help button, high score display, best stage display, sound toggle. Button handlers start GameScene or HelpScene.
- `GameOverScene`: "BASE DESTROYED!" text, score display with punch animation, high score check, stage reached, best combo, continue/kit/play-again/menu buttons. Ad trigger hooks.
- `HUDOverlay`: Created as parallel scene launched from GameScene. Displays score, stage, HP shields, timer, combo counter, kit button. Updated via Phaser events (`score-update`, `hp-change`, `combo-change`, `timer-tick`, `kit-use`).
- `PauseOverlay`: Semi-transparent overlay with resume/help/restart/quit buttons.

**help.js** (~120 lines):
- `HelpScene`: Full illustrated how-to-play screen.
- Renders 3 SVG tutorial diagrams using game sprites.
- Fuse type color guide with sample lines.
- Rules and tips text sections.
- "Got it!" button returns to previous screen (receives `returnScene` data).
- Scrollable content via drag gesture if exceeds viewport.

**ads.js** (~40 lines):
- `AdManager.showInterstitial()`: Placeholder hook for interstitial ad display.
- `AdManager.showRewarded(rewardType, callback)`: Placeholder hook for rewarded ad with type-specific callback ('continue', 'kit', 'doubleScore').
- `AdManager.shouldShowInterstitial()`: Tracks game-over count, returns true every 3rd.
- `AdManager.canContinue()`: Returns true if continue not yet used this game session.
- `AdManager.canGetKit()`: Returns true if kit not yet earned this session.

### 8.3 CDN Dependencies

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Phaser 3 | Latest | `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` | Game engine |

No Howler.js needed (using Phaser's built-in Web Audio for synthesized sounds).

---

## 9. Juice Specification

### 9.1 Player Input Feedback (Fuse Cut - every tap)

| Effect | Target | Values |
|--------|--------|--------|
| Particles | Cut point on fuse | Count: 12, Color: #FFFFAA (white-yellow), Direction: radial outward, Speed: 60-120px/s, Lifespan: 300ms, Size: 2-4px circles |
| Screen Shake | Camera | Intensity: 2px random offset, Duration: 80ms |
| Cut Mark | Cut point | Red X sprite (#FF4444) appears at cut point, scales 0->1.0 over 60ms, persists until stage end |
| Fuse Snap | Cut fuse line | Two halves of fuse retract 8px from cut point over 100ms (rubber-band snap feel) |
| Sound | -- | 2000Hz square wave snip, 100ms, sharp decay. Pitch +5% per consecutive cut within 400ms |
| Haptic | Device | 10ms vibration pulse (if supported) |

### 9.2 Core Action Additional Feedback (Last-Second Cut - fire within 40px)

| Effect | Values |
|--------|--------|
| Particles | Count: 20 (vs 12 normal), Color: #FFD700 (gold) + #FFFFAA, Speed: 80-160px/s |
| Screen Flash | White overlay alpha 0->0.2->0 over 80ms |
| Camera Shake | Intensity: 4px (vs 2px normal), Duration: 120ms |
| Multiplier Text | "3x!" gold (#FFD700) text at cut point, 28px bold, scales 0->1.4->1.0 over 200ms, floats up 40px and fades over 500ms |
| Sound | Snip + reverb whoosh tail, 200ms, pitch raised +15% |
| Combo Escalation | Each consecutive 3x: particle count +3, multiplier text +2px font size, shake +0.5px intensity. Caps at 10th combo. |
| Score Float | "+150" (or "+175" etc with combo) gold text, floats up 60px, fades 600ms, appears offset 20px right of multiplier text |

### 9.3 Close-Call Cut Feedback (fire within 80px)

| Effect | Values |
|--------|--------|
| Particles | Count: 16, Color: #FFE44D (warm yellow) |
| Multiplier Text | "2x!" white (#FFFFFF) text, 24px, scales 0->1.2->1.0 over 180ms, floats up 30px, fades 400ms |
| Sound | Snip + slight reverb, pitch +8% |
| Score Float | "+100" white text, floats up 50px, fades 500ms |

### 9.4 Death/Failure Effects (Base Hit)

| Effect | Values |
|--------|--------|
| Screen Shake | Intensity: 10px random offset, Duration: 300ms, Decay: exponential to 0 |
| Explosion Particles | Count: 25, Colors: #FF6B35 (orange) + #FF2D2D (red) mixed, Speed: 80-160px/s random radial from base, Lifespan: 500ms, Size: 4-8px |
| Base Flash | Base sprite tint #FF2D2D, flash 3 times over 400ms (100ms on, 33ms off) |
| Screen Red Vignette | Red (#FF000033) radial gradient overlay from edges, alpha 0->0.3->0 over 300ms |
| HP Shield Shatter | Lost shield icon: scales 1.0->1.5 over 100ms, shatters into 6 fragments flying outward, fade 400ms |
| Sound | White noise burst + 200Hz sine thud, 400ms total |
| Camera Desaturation | Saturation 1.0->0.4 over 150ms, hold 200ms, recover 300ms |
| Effect -> Continue Delay | 500ms after explosion effects before gameplay resumes (if HP > 0) |

### 9.5 Game Over Effects (HP = 0)

| Effect | Values |
|--------|--------|
| All base hit effects above PLUS: | |
| Screen Shake | Intensity: 15px, Duration: 500ms |
| Base Destruction | Base sprite cracks (overlay crack SVG), scales 1.0->0.0 over 600ms with rotation +30deg |
| Full Screen Flash | Red overlay alpha 0->0.4->0 over 400ms |
| Sound | Heavy explosion, 800ms, low-frequency rumble |
| Effect -> UI Delay | 800ms after destruction before showing game over UI |
| Death -> Restart | **Under 1.8 seconds** (800ms effect + 300ms fade + 700ms new stage appear) |

### 9.6 Stage Clear Effects

| Effect | Values |
|--------|--------|
| Fuse Line Flash | All remaining fuse lines flash gold (#FFD700) simultaneously, alpha 1.0->0.5->1.0 over 200ms |
| Base Glow | Base sprite adds outer glow: blue (#4488FF) circle, r=40px, alpha 0->0.5->0 over 500ms |
| Celebratory Particles | 20 gold (#FFD700) particles from base, radial upward, speed 60-120px/s, lifespan 600ms |
| Score Float | "+{total}" gold text, 26px, center screen, floats up 70px, fades 800ms |
| Sound | 880Hz->1760Hz sine sweep chime, 500ms |
| Stage Transition | 300ms: network fades out (alpha 1->0). 200ms black. 400ms: new network fades in with node stagger (30ms per node, top to bottom). Total: 900ms. |

### 9.7 Score Increase Effects

| Effect | Values |
|--------|--------|
| Floating Text | "+{N}" where N is points earned, Color: #FFD700 (gold), Float up 60px from event point, Fade over 600ms, Font: 20px bold |
| Score HUD Punch | Score text scales 1.0->1.25->1.0, 120ms recovery, easeOut |
| Combo Text | "COMBO xN" at bottom-right, gold, size 16px + (combo * 2)px, max 30px. Pulses on increment (scale 1.0->1.15->1.0, 100ms). |
| High Score Beat | When current score > high score during play: brief gold border flash around score text, 200ms |

---

## 10. Implementation Notes

### 10.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60fps stable | Phaser built-in FPS counter |
| Load Time | <2 seconds on 4G | No external assets, SVG generated in code |
| Memory Usage | <80MB | Minimal sprites, Graphics objects redrawn per stage |
| JS Bundle Size | <70KB total (excl. CDN) | 7 files, all under 300 lines |
| First Interaction | <1 second after load | SVG base64 encoding is fast |

### 10.2 Mobile Optimization

- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- **Touch Events**: Phaser pointer events. Fuse segment hit detection via distance-from-line calculation (point-to-line-segment distance < 30px). Min effective tap target: 44px wide zone around each fuse segment.
- **Orientation**: Portrait lock via CSS. On landscape, show "Please rotate your device" overlay with phone icon.
- **Resize Handler**: `window.addEventListener('resize', () => game.scale.refresh())` in main.js. Network recalculates node positions proportionally on resize.
- **Prevent Default**: Disable pull-to-refresh, pinch-zoom, double-tap-zoom via CSS `touch-action: manipulation` on game container.
- **Background/Focus**: Listen for `visibilitychange` event. Pause all fire advancement and stage timer when app is backgrounded. Resume on focus.
- **Safe Areas**: Use `env(safe-area-inset-*)` in CSS for game container padding.

### 10.3 Network Rendering Strategy

- **Nodes**: Phaser.GameObjects.Sprite, positioned at graph node coordinates. Interactive: false (nodes are not tap targets).
- **Fuse Lines**: Phaser.GameObjects.Graphics. Each fuse drawn as a line between two node positions. Line style varies by fuse type (color, width, dash). Redrawn when cut (split into two shorter lines with gap at cut point).
- **Fire Particles**: Phaser.GameObjects.Particles.ParticleEmitter. One emitter per active fire front. Position updated each frame to follow fire along fuse path. Emitter config: frequency 30ms, lifespan 200ms, speed 10-30px/s, tint matches fuse type color.
- **Cut Marks**: Phaser.GameObjects.Sprite using cut mark SVG texture. Placed at cut point coordinates.

### 10.4 Fire Simulation State

```
FireState = {
  id: number,              // unique fire ID
  currentEdge: EdgeRef,    // which fuse segment fire is on
  progress: number,        // 0.0 to 1.0 along current edge
  speed: number,           // px/s (base + fuse type modifier)
  fuseType: FuseType,      // NORMAL, FAST, DELAYED, SPLIT
  frozen: boolean,         // true when defusal kit active
  delayedPaused: boolean,  // true during delayed fuse pause phase
  delayedTimer: number,    // countdown for delayed pause (1500ms)
  children: FireState[],   // child fires from split fuses
  active: boolean          // false when dead-ended, reached safe zone, or cut
}

Per frame:
1. Skip if frozen or !active
2. If delayedPaused: decrement delayedTimer by delta. If <= 0: set delayedPaused=false, speed *= 3.
3. Advance progress by (speed * delta / 1000) / edgeLength
4. Calculate world position: lerp(nodeA.pos, nodeB.pos, progress)
5. If progress >= 1.0:
   a. Reached endpoint node.
   b. If node is base: trigger onBaseHit()
   c. If node is safeZone: trigger onSafeDetonation(), set active=false
   d. If edge is cut at progress point: trigger dead-end, set active=false
   e. If node is split point and fuseType=SPLIT: spawn 2 child FireStates on outgoing edges
   f. If node is delayed midpoint and fuseType=DELAYED: set delayedPaused=true, delayedTimer=1500
   g. Else: move to next connected edge (pick edge leading toward base, biased by graph structure)
6. Update particle emitter position
```

### 10.5 Fuse Segment Tap Detection

```
On pointer down at (px, py):
1. For each active (uncut) fuse segment (edge):
   a. Calculate point-to-line-segment distance:
      - Line from (ax, ay) to (bx, by) = the two node positions of the edge
      - Project (px, py) onto line segment
      - Clamp projection to segment bounds
      - Distance = euclidean distance from (px, py) to closest point on segment
   b. If distance < 30px: candidate segment
2. If multiple candidates: select the one with smallest distance
3. If no candidates: do nothing (tap missed)
4. Call cutFuse(selectedSegment, closestPoint)
```

### 10.6 Edge Cases

- **Tap on already-cut fuse**: Ignore. Cut marks are visual-only; underlying edge is already flagged as cut.
- **Fire reaches cut point**: Fire traveling along a fuse that was cut ahead of it: fire reaches the cut point, triggers dead-end (small spark, fire dies). No damage to base.
- **Multiple fires on same fuse**: Each fire tracked independently. Cutting a fuse stops ALL fires on that segment.
- **Split fuse cut before fire reaches split**: Both downstream paths are preemptively blocked. Fire dead-ends at the cut point before splitting.
- **Defusal Kit activation with fires frozen mid-path**: Fires resume from exact position after 3s. Visual: blue ice tint on all fuse lines, ice crystal particles along frozen fire positions.
- **Browser tab backgrounded**: Pause all fire advancement and countdown timer. Resume on focus.
- **Resize during gameplay**: Recalculate node positions proportionally. Fuse lines redrawn. Fire positions recalculated relative to new node positions.
- **Tap near node junction**: If tap is equidistant to two fuse segments, cut the one closer to an active fire (prioritize urgent cuts).
- **Stage with no taps needed**: Never generated. Validation step ensures every bomb has at least one path to base requiring at least one cut.
- **All bombs routed to safe zones without cuts**: Not possible by construction — generation ensures direct paths to base exist.

### 10.7 Testing Checkpoints

1. **Boot**: All SVG textures load without "Texture key already in use" errors
2. **Menu**: Play, Help, Sound toggle all functional. High score displays from localStorage.
3. **Network Generation**: Stages 1, 4, 9, 16, 26, 41 all generate valid networks with correct parameters per difficulty table
4. **Fuse Cut**: Tap on fuse segment within 30px registers cut. Cut mark appears. Fuse visually severs.
5. **Fire Advancement**: Fire burns along fuses at correct speed per stage. Visual trail follows.
6. **Last-Second Detection**: Cut within 40px of fire = 3x multiplier text + effects. Cut within 80px = 2x.
7. **Base Damage**: Fire reaching base = explosion + HP loss. 3 hits = game over.
8. **Inactivity Death**: Idle player takes first base hit within 8 seconds on stage 1, game over within 15 seconds.
9. **Death -> Restart**: Under 2 seconds from game over to new game playable.
10. **Fast Fuses**: Orange fuses burn at 2x speed from stage 9+.
11. **Delayed Fuses**: Cyan fuses pause 1.5s then sprint from stage 16+.
12. **Split Fuses**: Magenta fuses branch into 2 from stage 26+.
13. **Defusal Kit**: Freezes all fires for 3 seconds. Visual ice effect. Fires resume correctly.
14. **Safe Zone Routing**: Fire reaching safe zone = green particles + bonus points. Not counted as base damage.
15. **Combo System**: Consecutive 3x cuts increment combo counter. Normal cut resets combo.
16. **Pause/Resume**: All fires and timer freeze on pause, resume correctly.
17. **Orientation**: Portrait works, landscape shows rotate message.
18. **High Score**: Persists across sessions via localStorage.
19. **Stage Clear**: All fires neutralized triggers clear effects + score + transition.
20. **Boss Stage (15, 30, 45...)**: Visual treatment (larger bomb), increased difficulty, 2x clear bonus.

### 10.8 Local Storage Schema

```json
{
  "fuse_network_high_score": 0,
  "fuse_network_games_played": 0,
  "fuse_network_best_stage": 0,
  "fuse_network_best_combo": 0,
  "fuse_network_total_cuts": 0,
  "fuse_network_settings": {
    "sound": true
  }
}
```
