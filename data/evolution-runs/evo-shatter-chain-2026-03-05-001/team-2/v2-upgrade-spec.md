# Team 2 V2 Upgrade Spec — "Content Explosion"
## Focus: Content + Spectacle (New Glass Types + Ragdoll Chains)

### Selected Proposals (by composite score)
1. **Glass Explosion Ragdoll** (76.0) — Chain cascades 5+ send shards flying back at ball rack, causing bonus ricochets; "DEMOLITION" title on full clear
2. **Bomb Glass & Ice Glass** (74.0) — Bomb glass explodes in AoE radius destroying nearby panels; Ice glass freezes ball for 1.5s
3. **Game Over Stats Dashboard** (68.0) — Score breakdown, personal bests per category, contextual challenge text

### File Change Plan

#### config.js (add ~25 lines)
- Add BOMB_RADIUS=80, ICE_FREEZE_MS=1500
- Add COLOR.BOMB=0xFF6B35, COLOR.BOMB_HEX='#FF6B35', COLOR.ICE=0x88DDFF, COLOR.ICE_HEX='#88DDFF'
- Add SHARD_KICKBACK_SPEED=12, SHARD_KICKBACK_COUNT=4, DEMOLITION_CHAIN_THRESHOLD=5, DEMOLITION_BONUS=500
- Add GAMEOVER_BREAKDOWN_Y=320, GAMEOVER_LINE_H=24, GAMEOVER_STAT_FADE_MS=200

#### stages.js (add ~15 lines)
- In glass type assignment: after armored check, roll for bomb (wave>=6, ratio 0.08) and ice (wave>=10, ratio 0.12)
- Bomb: type='bomb', hp=1, w=42, h=32; Ice: type='ice', hp=1

#### game.js (modify ~25 lines)
- In createGlassPanel(): handle bomb type (orange-red, fuse dot, pulsing tween) and ice type (cyan-white, shimmer)
- Track totalPanelsDestroyed, bestSingleLaunchPanels, totalChainsTriggered for stats
- Detect DEMOLITION: if shard kickback ricochets clear remaining panels, set flag

#### collision.js (modify ~40 lines)
- In shatterPanel(): if type==='bomb', skip normal shards → call bombExplode(x, y) that iterates glassBodies within BOMB_RADIUS and calls hitGlass on each
- In hitGlass(): if type==='ice' and impactor is ball, freeze ball (setVelocity 0,0 + delayed restore after ICE_FREEZE_MS), flag _frozenThisLaunch
- Shard kickback: when chain depth >= DEMOLITION_CHAIN_THRESHOLD, spawn kickback shards aimed at ball rack area

#### effects.js (add ~35 lines)
- Add bombBlast(x, y): expanding orange ring + 20 orange sparks + heavy shake
- Add freezeEffect(x, y): blue radial frost overlay, ice crystal particles
- Add demolitionTitle(): 'DEMOLITION!' title card with screen-shatter wipe transition

#### flow.js (modify ~15 lines)
- Pass extended stats to GameOverScene: totalPanelsDestroyed, totalChains, bestLaunchPanels, fastestWaveClear

#### ui.js (modify ~40 lines)
- Rewrite GameOverScene with stat breakdown (panels × base pts, chain bonuses, wave bonuses)
- Add personal best tracking per category (wave, chain, launch panels, speed clear)
- Add contextual challenge text: "SO CLOSE! Just {diff} more!" or "TIP: Chain reactions multiply score!"
- Show new PB badges with gold flash

### Preservation Checklist
- [x] File structure maintained
- [x] BootScene pattern preserved
- [x] Script load order: main.js LAST
- [x] Core mechanic unchanged
- [x] Death/timer mechanics unchanged
- [x] 30s inactivity death preserved
