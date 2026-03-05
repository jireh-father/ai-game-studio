# Team 2 v2 Upgrade Spec: Belt Progression + Environment Themes

## Selected Proposals (scored 65+)
1. **Belt Rank Progression System** (t2-p1, composite: 78) - Dojo belt ranks with visual changes
2. **Environment Themes Every 10 Stages** (t2-p2, composite: 74) - Background color/atmosphere changes
3. **Rage Meter — Unleash Special Move** (t2-p6, composite: 80) - Fill meter, unleash special
4. **Directional Swipe Trails** (t2-p3, composite: 71) - Visual swipe feedback

## Changes by File

### config.js
- Add BELT_RANKS = [{name:'White',minStage:0,color:'#FFFFFF',outline:'#CCCCCC'}, {name:'Yellow',minStage:5,color:'#FFD700',outline:'#B8860B'}, {name:'Green',minStage:10,color:'#00FF88',outline:'#008844'}, {name:'Blue',minStage:15,color:'#00BFFF',outline:'#0077AA'}, {name:'Brown',minStage:25,color:'#8B4513',outline:'#5C2D00'}, {name:'Black',minStage:40,color:'#1A1A1A',outline:'#FFD700'}]
- Add ENVIRONMENTS = [{stageRange:[1,9],bgColor:'#0D0F1A',particleColor:0x4444FF,name:'Training Dojo'}, {stageRange:[10,19],bgColor:'#1A0D00',particleColor:0xFF8800,name:'Forest Temple'}, {stageRange:[20,29],bgColor:'#1A0000',particleColor:0xFF4444,name:'Mountain Shrine'}, {stageRange:[30,39],bgColor:'#0D001A',particleColor:0xAA44FF,name:'Volcano Forge'}, {stageRange:[40,999],bgColor:'#000D1A',particleColor:0x00FFFF,name:'Cloud Palace'}]
- Add RAGE_METER = {maxValue: 100, fillPerPerfect: 25, fillPerGood: 12, fillPerLate: 0, decayPerSecond: 5, specialDamage: 3, specialDuration: 500, cooldownMs: 3000}
- Add SWIPE_TRAIL = {segments: 12, width: 5, fadeMs: 250}

### main.js / BootScene
- Generate belt-colored player SVGs at boot (one per belt rank) and register as textures
- Use current belt to select player texture

### stages.js
- No changes needed (environment is cosmetic)

### game.js
- Add rageMeter state (0-100), fill on blocks, decay over time
- On rageMeter full: trigger special move (deal 3 damage to enemy, screen flash, massive particles)
- Add rageMeter cooldown after use
- Track highest stage reached → determine belt rank → set player texture accordingly
- On stage change: lerp background color to new environment palette
- Add ambient environment particles (slow floating, environment-colored)
- Draw swipe trail: capture pointer positions, draw colored polyline, fade out

### effects.js
- Add _rageSpecialEffect(): white screen flash, radial particle burst (50 particles), camera zoom 1.1 snap back
- Add _environmentTransition(newEnv): tween camera background color, change ambient particle color
- Add _beltRankUpEffect(): when belt changes, golden flash, player scale-bounce, "RANK UP: [belt] BELT!" text

### ui.js
- Show belt name + colored indicator on HUD (small, left side below lives)
- Show rage meter bar below enemy HP bar (fills from left, glows when full)
- "SPECIAL READY!" pulsing text when meter full
- Show environment name on stage transition ("ENTERING: FOREST TEMPLE")
- On GameOverScene: show belt rank achieved with colored belt icon
