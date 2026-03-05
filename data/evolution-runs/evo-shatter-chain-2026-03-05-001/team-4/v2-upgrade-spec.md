# Team 4 V2 Upgrade Spec — "Pressure Cooker"
## Focus: Mechanics + Urgency (Fusion Timer + Gravity Zones + Feel Polish)

### Selected Proposals (by composite score)
1. **Ball Personality** (75.2) — Squash/stretch, impact flatten, victory spin, idle bounce
2. **Glass Fusion Timer** (70.0) — Every 4s surviving panels within 50px fuse into stronger panels; fusion warning rings; fused panels drop more shards
3. **Gravity Flip Zones** (70.0) — Horizontal strips that invert vertical velocity of balls/shards passing through; appears wave 8+

### File Change Plan

#### config.js (add ~25 lines)
- Add FUSION_INTERVAL_MS=4000, FUSION_PROXIMITY=50, FUSION_WARNING_MS=2000, FUSION_SIZE_MULT=1.4, FUSION_SHARD_BONUS=3
- Add COLOR.FUSION_WARNING=0xFF8C00, COLOR.FUSED_GLOW=0xFF6347
- Add GRAV_ZONE_HEIGHT=16, GRAV_ZONE_BOUNCE=0.9, COLOR.GRAV_ZONE=0x9B59B6
- Add BALL_SQUASH/PERSONALITY constants

#### stages.js (add ~12 lines)
- In generateWave(), add gravityZones array: 1 zone at wave 8-15, 2 zones at wave 16+
- Position gravity zones at arena height fractions (1/3, 2/3)
- Return gravityZones in wave data

#### game.js (modify ~45 lines)
- Fusion timer: in create(), init fusionTimer. In update(), every FUSION_INTERVAL scan glassBodies pairs for proximity. Show warning rings 2s before. Execute fusion by removing both + creating new larger panel
- Gravity zones: in create(), draw gravity zone strips with chevron animation. In update(), check ball/shard y vs zone ranges, invert y-velocity on first crossing (track via _flippedZones)
- Ball personality: squash during drag, idle bounce after 3s

#### collision.js (modify ~15 lines)
- fusePanels(bodyA, bodyB): remove both, create new panel at midpoint with upgraded type/hp
- Fused panels: FUSION_SHARD_BONUS extra shards on shatter

#### effects.js (add ~35 lines)
- Add fusionWarning(panel): pulsing orange ring around panels about to fuse
- Add fusionMerge(x, y): particle trail as panels slide together
- Add gravFlipEffect(x, y): purple spark burst + whoosh sound
- Add ballSquash, ballImpact, ballCelebrate, ballIdle

### Preservation Checklist
- [x] File structure maintained
- [x] BootScene pattern preserved
- [x] Script load order: main.js LAST
- [x] Core mechanic unchanged
- [x] Death/timer mechanics unchanged
- [x] 30s inactivity death preserved
