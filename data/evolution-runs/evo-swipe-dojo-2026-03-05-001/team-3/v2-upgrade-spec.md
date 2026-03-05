# Team 3 v2 Upgrade Spec: Combo Spectacle + Dramatic Moments

## Selected Proposals (scored 65+)
1. **Dramatic Last-Stand Mode at 1 HP** (t3-p10, composite: 82) - Intense near-death experience
2. **Dramatic Finishing Blow** (t3-p2, composite: 80) - Epic last-hit kills
3. **Combo Announcer Text** (t3-p6, composite: 74) - Escalating hype text at milestones
4. **Overkill Bonus System** (t3-p13, composite: 73) - Perfect kill bonuses

## Changes by File

### config.js
- Add LAST_STAND = {scoreMultiplier: 2, heartbeatMs: 800, cameraZoom: 1.05, desaturation: 0.5, comebackHeal: 1, borderColor: 0xFF0000, borderAlpha: 0.6}
- Add FINISHING_BLOW = {hitstopMs: 350, zoom: 1.08, shakeAmplitude: 6, particleCount: 45, criticalBonusScore: 500}
- Add ANNOUNCER = [{threshold:5,text:'NICE!',color:'#FFFFFF',size:36,anim:'bounce'}, {threshold:10,text:'AMAZING!',color:'#FFD700',size:42,anim:'slam'}, {threshold:15,text:'INCREDIBLE!',color:'#FF8800',size:48,anim:'spin'}, {threshold:20,text:'UNBELIEVABLE!',color:'#FF4444',size:54,anim:'shake'}, {threshold:25,text:'LEGENDARY!',color:'#AA44FF',size:60,anim:'scale'}, {threshold:30,text:'GODLIKE!',color:'#FF00FF',size:66,anim:'rainbow'}]
- Add OVERKILL = {bonusScore: 500, particleMultiplier: 3, delayNextEnemyMs: 500}

### game.js
- Add lastStandActive flag: activate when lives === 1
  - Apply 2x score multiplier to all block scores
  - On enemy defeated while in lastStand: heal +1 HP, deactivate lastStand, show "COMEBACK!" text
- Detect finishing blow: enemy HP === 1 and block resolves
  - Extended hitstop (350ms via setTimeout), camera zoom to 1.08, heavy shake
  - If perfect timing: add CRITICAL bonus score, trigger "CRITICAL FINISH" text
- Detect overkill: perfect block + enemy dies
  - +500 bonus, 3x particles, delay next enemy spawn by 500ms
  - Track overkill count for game over display
- Check combo milestones for announcer text triggers

### effects.js
- Add _finishingBlowEffect(isPerfect): extended hitstop, zoom, 45-particle burst, gold screen border flash
- Add _lastStandHeartbeat(): red border rectangles on screen edges, pulse alpha with heartbeat rhythm
- Add _lastStandDeactivate(): green flash, border removal, zoom reset
- Add _overkillStamp(): "OVERKILL" text slams in with rotation, red color, fades after 500ms

### ui.js
- Add announcer text system: showAnnouncerText(config) with animations:
  - bounce: scale 0→1.3→1.0 with easeOut
  - slam: y from top, scale 2.0→1.0
  - spin: rotation 360° with scale in
  - shake: rapid x oscillation on arrival
  - scale: scale from 3.0→1.0
  - rainbow: color cycling tween (hue rotation)
- Show "LAST STAND" text when entering last stand mode (red, pulsing)
- Show "COMEBACK!" text on last-stand heal (green, bounce animation)
- Show overkill count on GameOverScene stats
- Show "CRITICAL FINISH" rainbow text on perfect finishing blows
