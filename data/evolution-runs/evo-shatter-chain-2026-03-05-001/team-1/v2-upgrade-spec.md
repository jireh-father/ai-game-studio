# Team 1 V2 Upgrade Spec — "Golden Chaos"
## Focus: Fun + Feel (Risk/Reward Gambling + Visual Spectacle)

### Selected Proposals (by composite score)
1. **Golden Panel Roulette** (79.2) — One golden panel per wave: hit it FIRST for 3x score multiplier on everything, miss it and it becomes an absorber that eats balls
2. **Screen Crack Overlay** (76.8) — Deep chain cascades (4+) crack the screen itself, escalating to full-screen shatter effect at 6+
3. **Ball Personality** (75.2) — Squash/stretch micro-animations, impact flatten, victory spin, idle bounce

### File Change Plan

#### config.js (add ~25 lines)
- Add GOLDEN_MULTIPLIER=3, GOLDEN_MOVE_START_WAVE=8, GOLDEN_MOVE_AMPLITUDE=40, GOLDEN_MOVE_PERIOD=2000
- Add COLOR.GOLDEN=0xFFD700, COLOR.GOLDEN_HEX='#FFD700', COLOR.ABSORBER=0x4A0A0A, COLOR.ABSORBER_HEX='#4A0A0A'
- Add CRACK_TIER1_DEPTH=4, CRACK_TIER2_DEPTH=5, CRACK_TIER3_DEPTH=6, CRACK_FADE_MS=250
- Add BALL_SQUASH_X_MIN=0.8, BALL_SQUASH_Y_MAX=1.2, BALL_IMPACT_MS=60, BALL_IDLE_MS=3000

#### stages.js (add ~10 lines)
- In generateWave(), after glass type assignment, select ONE random panel as golden (type='golden', hp=1, golden shimmer flag)
- On wave 8+, golden panel gets moving=true with specific amplitude/period

#### game.js (modify ~30 lines)
- Track `firstHitGolden` flag (reset per wave), `goldenMultiplierActive` flag
- In createGlassPanel(), handle type='golden' (gold color, shimmer tween) and type='absorber' (dark red, pulse)
- On first ball-panel collision: if golden panel → activate 3x multiplier; if not golden → convert golden to absorber
- Absorber collision: destroy ball on contact
- Ball personality: squash during drag (scale ball preview by drag ratio), idle bounce timer

#### collision.js (modify ~20 lines)
- In hitGlass(): check goldenMultiplierActive → score *= 3
- In onCollision(): detect ball-absorber collision → call onBallLost()
- Screen crack: call fx.screenCrack(chainDepth, x, y) when chainDepth >= 4

#### effects.js (add ~50 lines)
- Add screenCrack(depth, x, y): tier 1 (depth 4) = 5 crack lines, tier 2 (depth 5) = 12 cracks + chromatic offset, tier 3 (depth 6+) = full screen shatter reassemble
- Add goldenShimmer(panel): pulsing gold particles on golden panel
- Add absorberPulse(panel): dark red pulsing effect
- Add ballSquash(ball, ratio), ballImpact(ball), ballCelebrate(ball), ballIdle(ball)

#### ui.js (modify ~10 lines)
- Flash '3X GOLD RUSH!' text when golden panel hit first
- Show skull icon when golden converts to absorber

### Preservation Checklist
- [x] File structure: 8+ JS files, no new files needed
- [x] BootScene pattern: no new textures needed (all procedural)
- [x] Script load order: main.js LAST
- [x] Module responsibilities maintained
- [x] Core mechanic (drag-to-aim-launch) unchanged
- [x] Death/timer mechanics unchanged
- [x] 30s inactivity death preserved
