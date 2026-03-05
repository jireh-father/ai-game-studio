# Team 3 V2 Upgrade Spec — "Meta Progression"
## Focus: Retention + Meta (Achievements + Daily Challenges + Visual Spectacle)

### Selected Proposals (by composite score)
1. **Screen Crack Overlay** (76.8) — Deep chain cascades crack the screen, escalating to full shatter at 6+
2. **Chain Milestone Achievements** (74.8) — 25 lifetime achievements, permanent score multiplier per unlock, play streak counter
3. **Daily Shatter Challenge** (70.8) — Date-seeded daily wave with 3 tiers (Bronze/Silver/Gold), star points toward trail cosmetic unlocks

### File Change Plan

#### config.js (add ~40 lines)
- Add CRACK constants (tier depths 4/5/6, fade MS, chromatic offset)
- Add ACHIEVEMENTS array (10 key achievements with stat, target, title)
- Add MULTIPLIER_PER_ACHIEVEMENT=0.1
- Add DAILY_TIERS: {bronze_wave:3, silver_wave:5, gold_wave:8, gold_max_seconds:90}
- Add DAILY_MODIFIERS array (5 modifiers with name + param overrides)

#### main.js (add ~15 lines)
- Extend GameState with: achievements map, score_multiplier, play_streak, last_play_date, daily_stars_total, daily_log, is_daily_challenge, cumulative stats (total_shards, total_cascades, total_waves, total_games, max_chain)
- Add checkStreak() that compares last_play_date to today

#### game.js (modify ~20 lines)
- Increment cumulative stat counters during gameplay
- Apply score_multiplier to score calculation in collision.js
- Track balls_used and elapsed_time for daily mode

#### collision.js (modify ~15 lines)
- In shatterPanel(): apply score_multiplier to pts calculation
- Call fx.screenCrack(chainDepth, x, y) when chainDepth >= 4

#### effects.js (add ~45 lines)
- Add screenCrack(depth, x, y) with 3 tiers (crack lines, chromatic offset, full shatter)
- Add achievementToast(title) — top screen notification, 1.5s auto-dismiss

#### stages.js (modify ~5 lines)
- Accept daily seed parameter for deterministic generation
- Apply daily modifier param overrides when is_daily_challenge

#### ui.js (modify ~50 lines)
- Add 'Daily Challenge' button on MenuScene with overlay (tiers, calendar dots)
- Add achievement grid overlay accessible from menu icon
- Add nearest-achievement progress bar on death screen
- Add streak flame icon on HUD (16×16, non-intrusive)
- Add tier completion popup during daily mode

### Preservation Checklist
- [x] File structure maintained
- [x] BootScene pattern preserved
- [x] Script load order: main.js LAST
- [x] Core mechanic unchanged
- [x] Death/timer mechanics unchanged
- [x] 30s inactivity death preserved
- [x] All meta UI between sessions only (menu/death screen)
