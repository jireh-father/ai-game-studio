# Team 5 V2 Upgrade Spec — "Risk & Reward"
## Focus: Fun Mechanics + Content + Progression

### Selected Proposals (by composite score)
1. **Golden Panel Roulette** (79.2) — One golden panel per wave: hit first for 3x multiplier, miss = absorber
2. **Bomb Glass & Ice Glass** (74.0) — Bomb glass AoE explosion; Ice glass freezes ball 1.5s
3. **Chain Milestone Achievements** (74.8) — 25 achievements + permanent score multiplier + streak counter

### File Change Plan

#### config.js (add ~35 lines)
- Add GOLDEN constants (GOLDEN_MULTIPLIER=3, GOLDEN_MOVE_START_WAVE=8, colors)
- Add BOMB_RADIUS=80, ICE_FREEZE_MS=1500, bomb/ice colors
- Add ACHIEVEMENTS array (10 key achievements), MULTIPLIER_PER_ACHIEVEMENT=0.1

#### main.js (add ~10 lines)
- Extend GameState with achievements map, score_multiplier, play_streak, last_play_date, cumulative stats

#### stages.js (add ~15 lines)
- Select ONE random panel as golden per wave (golden shimmer, moving on wave 8+)
- Roll for bomb (wave>=6) and ice (wave>=10) types

#### game.js (modify ~30 lines)
- Handle golden/bomb/ice panel creation with visuals
- Track firstHitGolden, goldenMultiplierActive flags
- Golden→absorber conversion on first non-golden hit
- Increment cumulative stat counters

#### collision.js (modify ~35 lines)
- Golden multiplier: if active, score *= 3
- Absorber: ball-absorber collision destroys ball
- Bomb: skip shards → AoE hitGlass within BOMB_RADIUS
- Ice: freeze ball velocity for ICE_FREEZE_MS
- Apply score_multiplier from achievements

#### effects.js (add ~30 lines)
- Add goldenShimmer, absorberPulse, bombBlast, freezeEffect
- Add achievementToast(title)

#### ui.js (modify ~30 lines)
- '3X GOLD RUSH!' flash text
- Skull icon on absorber conversion
- Achievement grid on menu
- Nearest-achievement progress bar on death screen
- Streak flame on HUD

### Preservation Checklist
- [x] File structure maintained
- [x] BootScene pattern preserved
- [x] Script load order: main.js LAST
- [x] Core mechanic unchanged
- [x] Death/timer mechanics unchanged
- [x] 30s inactivity death preserved
