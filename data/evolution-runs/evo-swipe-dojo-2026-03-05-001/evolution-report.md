# Swipe Dojo Evolution Report

**Run ID**: evo-swipe-dojo-2026-03-05-001
**Date**: 2026-03-05
**Original Game**: swipe-dojo (1329 lines)
**Teams**: 5 parallel teams, each producing v2

## Summary

All 5 teams successfully evolved Swipe Dojo with distinct upgrade directions. Every version passed automated Playwright testing with zero console errors (score 80, verdict: ship).

## Team Rankings

| Rank | Team | Focus | Score | Verdict | Total Lines | Key Features |
|------|------|-------|-------|---------|-------------|--------------|
| 1 | T1 | Mechanic Depth | 80 | ship | 1439 | Distinct enemy behaviors (fast/tank/tricky/boss), rage mode, swipe trail, intensity music |
| 2 | T4 | Risk/Reward | 80 | ship | 1421 | Counter-attack system, power-up drops, perfect streak healing, stage choice |
| 3 | T3 | Combo Spectacle | 80 | ship | 1403 | Last-stand mode (2x score + comeback), finishing blows, announcer text, overkill bonus |
| 4 | T5 | Audio/Visual | 80 | ship | 1313 | Swipe trail particles, multi-arrow bursts, bass drop, arrow approach animation, reactive music |
| 5 | T2 | Belt Progression | 80 | ship | 1145 | Belt rank system (White→Black), environment themes, rage meter, swipe trails |

## Evolution Details

### Team 1: Mechanic Depth (1439 lines)
- **Distinct Enemy Behaviors**: Fast enemies (shorter windows, telegraph earlier), Tank (requires 2 swipes per arrow), Tricky (direction changes mid-attack), Boss (multi-directional combos)
- **Rage Mode**: Every 10 stages, brief invincibility where all blocks are perfect
- **Swipe Trail**: Colored trails with particle effects matching swipe direction
- **Intensity Scaling**: Music and effects ramp with combo/stage progress

### Team 2: Belt Progression (1145 lines)
- **Belt Rank System**: White→Yellow→Green→Blue→Brown→Black belt progression with visual changes
- **Environment Themes**: Background changes every 10 stages (dojo→forest→mountain→volcano→clouds)
- **Rage Meter**: Fills on perfect blocks, unleashes special move at full
- **Swipe Trails**: Visual feedback for swipe direction

### Team 3: Combo Spectacle (1403 lines)
- **Last-Stand Mode**: At 1HP → 2x score multiplier, heartbeat effect, red borders. Defeating enemy heals +1 HP with "COMEBACK!" text
- **Dramatic Finishing Blow**: Hitstop, zoom, 45-particle burst on enemy last HP
- **Combo Announcer**: NICE!(5x)→AMAZING!(10x)→INCREDIBLE!(15x)→UNBELIEVABLE!(20x)→LEGENDARY!(25x)→GODLIKE!(30x)
- **Overkill Bonus**: Perfect kill = +500 score, 3x particles

### Team 4: Risk/Reward (1421 lines)
- **Counter-Attack**: After perfect block, 600ms window to swipe for bonus damage + 300 score
- **Power-Up Drops**: Shield (absorb 1 hit), Slow-Time (double attack window 8s), Double-Points (2x score 10s)
- **Perfect Streak Healing**: 10 consecutive perfects = +1 HP (max 3)
- **Stage Choice**: Between stages, choose "SAFE" (normal) or "DOUBLE OR NOTHING" (faster but 2x score)

### Team 5: Audio/Visual (1313 lines)
- **Swipe Trail Particles**: Colored trails with particle spawning along path
- **Multi-Arrow Bursts**: Stage 8+, 15% chance of 2-3 rapid arrows requiring fast sequential swipes
- **Bass Drop**: Silence gap then 60Hz hit on stage clear
- **Arrow Approach Animation**: Arrows fly in with depth illusion (scale 0.3→1.0)
- **Reactive Music**: Layers add at combo 10/20/30 (melody→synth→arpeggio)

## Original vs Evolved Comparison

| Metric | Original | T1 | T2 | T3 | T4 | T5 |
|--------|----------|----|----|----|----|-----|
| Lines | 1329 | 1439 (+8%) | 1145 (-14%) | 1403 (+6%) | 1421 (+7%) | 1313 (-1%) |
| Enemy Variety | Cosmetic only | Distinct behaviors | Belt-themed | Same + spectacle | Same + power-ups | Same + multi-arrow |
| Progression | High score only | Stage + rage | Belt ranks | Combo milestones | Choices + streaks | Music layers |
| Risk/Reward | None | Rage mode | Rage meter | Last-stand 2x | Stage choice | Multi-arrow bonus |
| Audio | Basic synth | Intensity scaling | Theme music | Combo SFX | Same | Reactive layers |

## Deployment

All 5 versions deployed to gh-pages:
- T1: https://jireh-father.github.io/ai-game-studio/swipe-dojo-t1-v2/
- T2: https://jireh-father.github.io/ai-game-studio/swipe-dojo-t2-v2/
- T3: https://jireh-father.github.io/ai-game-studio/swipe-dojo-t3-v2/
- T4: https://jireh-father.github.io/ai-game-studio/swipe-dojo-t4-v2/
- T5: https://jireh-father.github.io/ai-game-studio/swipe-dojo-t5-v2/
