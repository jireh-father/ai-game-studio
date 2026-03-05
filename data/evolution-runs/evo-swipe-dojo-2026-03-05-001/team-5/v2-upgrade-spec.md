# Team 5 v2 Upgrade Spec: Audio/Visual Evolution + Multi-Arrow

## Selected Proposals (scored 65+)
1. **Swipe Trail with Particle Effects** (composite: 78) - Visible colored trails on swipes
2. **Multi-Arrow Rapid Sequences** (composite: 76) - Multiple arrows requiring fast sequential swipes
3. **Bass Drop on Stage Clear** (composite: 74) - Audio silence gap then bass hit on clears
4. **Arrow Approach Animation** (composite: 71) - Arrows fly in with depth illusion
5. **Reactive Music System** (composite: 73) - Music changes with combo/intensity

## Changes by File

### config.js
- Add SWIPE_TRAIL = {maxPoints: 15, lineWidth: 5, fadeMs: 300, particleRate: 3, colors: {UP:0x00F5FF, DOWN:0xFF00AA, LEFT:0x39FF14, RIGHT:0xFF6B00}}
- Add MULTI_ARROW = {startStage: 8, chance: 0.15, maxArrows: 3, gapMs: 250, bonusPerArrow: 50}
- Add BASS_DROP = {silenceMs: 150, freq: 60, decayMs: 200, filterSweepMs: 200}
- Add ARROW_APPROACH = {startScale: 0.3, approachMs: 350, ease: 'Back.easeOut'}
- Add REACTIVE_MUSIC = {comboTiers: [{combo:0,melody:false},{combo:10,melody:true,melodyFreq:440},{combo:20,melody:true,melodyFreq:554,addSynth:true},{combo:30,melody:true,melodyFreq:660,addSynth:true,addArp:true}]}

### game.js
- Swipe trail: on pointerdown, create trailGraphics. On pointermove, store points array (max 15). Draw polyline colored by detected direction. On pointerup, fade trail with alpha tween over 300ms. Spawn 3 small particles per trail segment.
- Multi-arrow: at stage 8+, 15% chance attack sequence contains a "burst" — 2-3 arrows spawned rapidly (250ms gap) that must all be swiped correctly. Bonus score for completing full burst.
- Arrow approach: instead of instant appearance, arrows start at center screen scale 0.3, tween to target position and scale 1.0 over 350ms with Back.easeOut. Attack window starts AFTER approach completes.
- Modify _spawnArrow for approach animation timing

### ads.js (AudioSynth)
- Add bassDrop method: silence master gain for 150ms, then 60Hz sine oscillator with exponential decay 200ms
- Add reactive music layers: at combo 10+ add melody oscillator (triangle wave), at combo 20+ add synth pad, at combo 30+ add arpeggio. Remove layers when combo drops below threshold.
- Call bassDrop() on stage clear instead of playStageClear()

### effects.js
- Add _drawSwipeTrail(graphics, points, color): polyline with lineWidth 5, glow effect
- Add _trailParticles(points, color): small particles along trail path
- Modify _drawArrow: start at center, tween to position with approach animation
- Add _directionalVignette(direction): red gradient on screen edge matching arrow direction when time running low

### ui.js
- Show multi-arrow burst indicator: "BURST x3" text when burst sequence starts
- Show music intensity indicator (subtle): small equalizer bars near pause button that pulse with beat
