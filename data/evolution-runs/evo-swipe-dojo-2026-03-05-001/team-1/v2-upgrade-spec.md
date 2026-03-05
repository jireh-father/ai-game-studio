# Team 1 v2 Upgrade Spec: Mechanic Depth + Distinct Enemies

## Selected Proposals (scored 65+)
1. **Distinct Enemy Behaviors** (t1-p4, composite: 82) - Each variant gets unique behavior
2. **Enemy Rage Mode** (t1-p11, composite: 78) - Every 10th stage rage barrage
3. **Swipe Trail Afterimage** (t1-p8, composite: 72) - Visual feedback on swipes
4. **Impact Intensity Scaling** (t1-p7, composite: 76) - Effects grow with combo

## Changes by File

### config.js
- Add ENEMY_BEHAVIORS object:
  - basic: {speedMod: 1.0, hpMod: 1.0, special: 'none'}
  - fast: {speedMod: 0.7, hpMod: 0.8, special: 'telegraph_early', telegraphMs: 200}
  - tank: {speedMod: 1.3, hpMod: 1.5, special: 'double_swipe'} (requires 2 swipes per arrow)
  - tricky: {speedMod: 1.0, hpMod: 1.0, special: 'direction_switch', switchDelay: 300}
  - boss: {speedMod: 0.85, hpMod: 2.0, special: 'multi_combo', comboLength: 3}
- Add RAGE_EVENT = {interval: 10, arrowCount: 5, arrowGapMs: 150, bonusPerArrow: 500}
- Add TRAIL_CONFIG = {fadeMs: 200, width: 4, colors: {perfect: '#FFD700', good: '#FFFFFF', late: '#FF4444'}}
- Add INTENSITY_SCALE = [{combo: 10, shakeMultiplier: 1.5, particleMultiplier: 1.5}, {combo: 20, shakeMultiplier: 2.0, particleMultiplier: 2.0}, {combo: 30, shakeMultiplier: 2.5, particleMultiplier: 3.0}]

### stages.js
- Modify generateStage(): apply ENEMY_BEHAVIORS speed/HP modifiers based on variant
- Add double_swipe flag to attack sequence for tank enemies
- Add direction_switch behavior for tricky enemies (arrow changes direction after switchDelay)

### game.js
- Handle tank double-swipe: require 2 matching swipes to resolve a single arrow
- Handle tricky direction-switch: arrow changes direction mid-display, player must react to final direction
- Handle boss multi_combo: spawn 3 arrows in rapid sequence (200ms gap) that must all be blocked
- Add rageMode state: at stages 10/20/30/etc, trigger 5-arrow barrage at 150ms gap
- Add swipe trail: on pointerdown, store trail points; on pointermove, draw colored trail line; fade after 200ms
- Scale effect intensity with combo: multiply shake amplitude and particle count by intensity tier

### effects.js
- Add _drawSwipeTrail(points, color): draw polyline on graphics layer with fade tween
- Modify _blockJuice: multiply shake and particle count by intensity tier from INTENSITY_SCALE
- Add _rageModeBurst(): red screen flash, dramatic particles on rage arrow survival

### ui.js
- Show "RAGE MODE!" text at rage event start (red, pulsing, large font)
- Show enemy behavior hint text on first encounter of each variant type ("WATCH THE SWITCH!" for tricky)
- Show rage survival counter during rage events
