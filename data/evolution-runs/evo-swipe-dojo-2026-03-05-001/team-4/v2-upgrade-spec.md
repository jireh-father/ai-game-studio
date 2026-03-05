# Team 4 v2 Upgrade Spec: Power-ups + Counter-Attack + Risk/Reward

## Selected Proposals (scored 65+)
1. **Counter-Attack System** (composite: 78) - After perfect block, brief window to swipe for bonus damage
2. **Power-up Drops from Enemies** (composite: 75) - Shield, slow-time, double-points
3. **Life Recovery via Perfect Streaks** (composite: 76) - 10 consecutive perfects = +1 HP
4. **Score Multiplier Choice at Stage Clear** (composite: 72) - Risk/reward between stages

## Changes by File

### config.js
- Add COUNTER_ATTACK = {windowMs: 600, damageBonus: 2, scoreBonus: 300, particleCount: 35}
- Add POWER_UPS = [{type:'shield',chance:0.15,duration:0,effect:'absorb_1_hit',color:0x00BFFF,icon:'🛡'}, {type:'slow_time',chance:0.10,duration:8000,effect:'double_attack_window',color:0x00FF88,icon:'⏳'}, {type:'double_pts',chance:0.12,duration:10000,effect:'2x_score',color:0xFFD700,icon:'💎'}]
- Add PERFECT_STREAK_HEAL = {requiredStreak: 10, maxLives: 3}
- Add STAGE_CHOICE = {doubleSpeedIncrease: 0.25, doubleScoreMult: 2, choiceTimerMs: 3000}

### game.js
- Counter-attack: after perfect block, set counterWindowActive=true for 600ms. If player swipes any direction during window → deal 2 bonus damage to enemy + 300 bonus score + particles
- Power-up drops: on enemy defeat, random chance to spawn a power-up icon that floats down for 2s. Tap to collect.
  - Shield: set shieldActive=true, next damage absorbed instead of losing HP
  - Slow-time: multiply all attack windows by 2 for 8 seconds
  - Double-pts: all scores 2x for 10 seconds
- Track perfectStreak: increment on perfect, reset on good/late/miss. At 10: heal +1 HP, reset streak
- Stage choice: on stageClear, show choice overlay. "SAFE" = normal. "DOUBLE OR NOTHING" = faster attacks but 2x score for next stage

### effects.js
- Add _counterAttackEffect(): blue slash across enemy, particles, screen flash
- Add _powerUpCollect(type): icon scale-up, color burst particles, status indicator on HUD
- Add _healEffect(): green flash, heart particle floats up, life icon pulse
- Add _shieldBreakEffect(): blue barrier shatter particles when shield absorbs hit

### ui.js
- Show counter-attack indicator: brief "COUNTER!" text flash after perfect block
- Show active power-up icons with timer bar on HUD (below lives)
- Show perfect streak counter (small, near combo display): "PERFECT x7"
- Show stage choice overlay: two large buttons ("SAFE ✓" green, "DOUBLE 🔥" gold), 3s countdown ring
- Show shield icon next to lives when shield active
