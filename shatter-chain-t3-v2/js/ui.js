// Shatter Chain - UI Scenes (Menu, GameOver, Boot)

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    // Generate SVG textures
    const ballSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <defs><radialGradient id="bg" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#E8E8F0"/>
        <stop offset="60%" stop-color="#C0C0C8"/>
        <stop offset="100%" stop-color="#808090"/>
      </radialGradient></defs>
      <circle cx="14" cy="14" r="13" fill="url(#bg)" stroke="#888890" stroke-width="1.5"/>
      <ellipse cx="9" cy="8" rx="4" ry="2.5" fill="white" opacity="0.5"/>
    </svg>`;

    const glassSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30">
      <rect width="40" height="30" rx="2" fill="#A8D8EA" opacity="0.85" stroke="#D4EFFA" stroke-width="1.5"/>
      <line x1="2" y1="2" x2="38" y2="2" stroke="#FFF" stroke-width="1" opacity="0.5"/>
    </svg>`;

    const textures = {
      ball: `data:image/svg+xml;base64,${btoa(ballSVG)}`,
      glass: `data:image/svg+xml;base64,${btoa(glassSVG)}`,
    };

    let pending = 0;
    const total = Object.keys(textures).length;
    for (const [key, src] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once(`addtexture-${key}`, () => {
          if (--pending === 0) this.scene.start('MenuScene');
        });
        this.textures.addBase64(key, src);
      }
    }
    if (pending === 0) this.scene.start('MenuScene');
  }
}

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    this.cameras.main.setBackgroundColor(CFG.COLOR.BG);
    const gs = window.GameState;

    const g = this.add.graphics(); g.lineStyle(1, 0x1E1E35, 0.15);
    for (let r = 0; r < 30; r++) for (let c = 0; c < 15; c++) g.strokeCircle(c*52+(r%2?26:0), r*45, 15);
    for (let i = 0; i < 8; i++) { const px=40+Math.random()*(CFG.WIDTH-80), py=200+Math.random()*300; const p=this.add.rectangle(px,py,40,30,CFG.COLOR.GLASS,0.3).setDepth(1); this.tweens.add({targets:p, y:py-20+Math.random()*40, alpha:0.1, duration:2000+Math.random()*2000, yoyo:true, repeat:-1, ease:'Sine.easeInOut'}); }

    this.add.text(CFG.WIDTH/2, 180, 'SHATTER\nCHAIN', { fontSize:'52px', fontFamily:'Arial', fontStyle:'bold', color:CFG.COLOR.WHITE_HEX, align:'center', stroke:'#16213E', strokeThickness:4, lineSpacing:8 }).setOrigin(0.5).setDepth(10);
    this.add.text(CFG.WIDTH/2, 280, 'One flick. Total destruction.', { fontSize:'16px', fontFamily:'Arial', color:'#8899AA' }).setOrigin(0.5).setDepth(10);

    const playBg = this.add.rectangle(CFG.WIDTH/2, 400, 200, 60, CFG.COLOR.GLASS).setDepth(10).setInteractive({useHandCursor:true});
    this.add.text(CFG.WIDTH/2, 400, 'PLAY', { fontSize:'28px', fontFamily:'Arial', fontStyle:'bold', color:CFG.COLOR.BG_HEX }).setOrigin(0.5).setDepth(11);
    this.tweens.add({ targets:[playBg], scaleX:1.03, scaleY:1.03, duration:800, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });
    playBg.on('pointerdown', () => { playClick(); getAudioCtx(); gs.score=0; gs.waveNumber=1; gs.sessionSeed=Date.now(); gs.is_daily_challenge=false; AdManager.reset(); this.cameras.main.fade(200,0,0,0); this.time.delayedCall(200,()=>this.scene.start('GameScene')); });
    const bestScore = gs.highScore||0, bestWave = parseInt(localStorage.getItem('shatter-chain_highest_wave')||'0');
    if (bestScore > 0) this.add.text(CFG.WIDTH/2, 520, `BEST: ${bestScore.toLocaleString()}  |  WAVE ${bestWave}`, { fontSize:'14px', fontFamily:'Arial', color:'#666' }).setOrigin(0.5).setDepth(10);
    const settingsBtn = this.add.text(CFG.WIDTH-15, 15, '\u2699', { fontSize:'32px', color:'#667788' }).setOrigin(1,0).setDepth(10).setInteractive({useHandCursor:true});
    settingsBtn.on('pointerdown', () => { playClick(); this.showSettings(); });

    // Trophy button (achievements)
    const trophyBtn = this.add.text(15, 15, '\uD83C\uDFC6', {
      fontSize: '28px',
    }).setDepth(10).setInteractive({ useHandCursor: true });
    trophyBtn.on('pointerdown', () => { playClick(); this.showAchievements(); });

    // Daily challenge button
    const dailyDone = MetaProgress.getDailyResult();
    const dailyBg = this.add.rectangle(CFG.WIDTH / 2, 470, 160, 44, 0x663300).setDepth(10).setInteractive({ useHandCursor: true });
    const dailyTxt = this.add.text(CFG.WIDTH / 2, 470, dailyDone ? 'DAILY \u2713' : 'DAILY', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFD700',
    }).setOrigin(0.5).setDepth(11);
    dailyBg.on('pointerdown', () => { playClick(); this.showDailyOverlay(); });

    // Decorative ball
    const ball = this.add.circle(80, 640, 20, CFG.COLOR.BALL).setDepth(5);
    ball.setStrokeStyle(2, 0x888890);
    this.tweens.add({
      targets: ball, x: CFG.WIDTH - 80, duration: 3000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  showSettings() {
    const gs = window.GameState;
    const overlay = this.add.rectangle(CFG.WIDTH / 2, CFG.HEIGHT / 2, CFG.WIDTH, CFG.HEIGHT, 0x0A0A1E, 0.9).setDepth(100).setInteractive();
    const title = this.add.text(CFG.WIDTH / 2, 120, 'SETTINGS', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: CFG.COLOR.WHITE_HEX,
    }).setOrigin(0.5).setDepth(110);

    const items = [];
    const makeToggle = (label, key, y) => {
      const txt = this.add.text(60, y, label, {
        fontSize: '18px', fontFamily: 'Arial', color: '#AAA',
      }).setDepth(110);
      const val = gs.settings[key];
      const btn = this.add.text(CFG.WIDTH - 60, y, val ? 'ON' : 'OFF', {
        fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold',
        color: val ? CFG.COLOR.CLEAR_HEX : CFG.COLOR.DANGER_HEX,
      }).setOrigin(1, 0).setDepth(110).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        gs.settings[key] = !gs.settings[key];
        btn.setText(gs.settings[key] ? 'ON' : 'OFF');
        btn.setColor(gs.settings[key] ? CFG.COLOR.CLEAR_HEX : CFG.COLOR.DANGER_HEX);
        localStorage.setItem('shatter-chain_settings', JSON.stringify(gs.settings));
        playClick();
      });
      items.push(txt, btn);
    };

    makeToggle('Sound Effects', 'sound', 220);
    makeToggle('Music', 'music', 280);
    makeToggle('Vibration', 'vibration', 340);

    const closeBtn = this.add.text(CFG.WIDTH / 2, 460, 'CLOSE', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: CFG.COLOR.GLASS_HI,
      backgroundColor: '#16213E', padding: { x: 30, y: 10 },
    }).setOrigin(0.5).setDepth(110).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      playClick();
      [overlay, title, closeBtn, ...items].forEach(o => o.destroy());
    });
  }

  showAchievements() {
    const el = [], d = MetaProgress.data, p = (o) => { el.push(o); return o; };
    p(this.add.rectangle(CFG.WIDTH/2, CFG.HEIGHT/2, CFG.WIDTH, CFG.HEIGHT, 0x0A0A1E, 0.95).setDepth(200).setInteractive());
    p(this.add.text(CFG.WIDTH/2, 50, 'ACHIEVEMENTS', { fontSize:'24px', fontFamily:'Arial', fontStyle:'bold', color:'#FFD700' }).setOrigin(0.5).setDepth(210));
    p(this.add.text(CFG.WIDTH/2, 78, `Multiplier: x${MetaProgress.getScoreMultiplier().toFixed(1)}`, { fontSize:'13px', fontFamily:'Arial', color:'#AAA' }).setOrigin(0.5).setDepth(210));
    ACHIEVEMENTS.forEach((a, i) => {
      const y = 105+i*52, u = d.unlocked.includes(a.id), v = Math.min(d[a.stat]||0, a.target);
      p(this.add.text(20, y, (u?'\u2605 ':'\u2606 ')+a.title, { fontSize:'13px', fontFamily:'Arial', fontStyle:'bold', color:u?'#FFD700':'#666' }).setDepth(210));
      p(this.add.text(CFG.WIDTH-20, y, v+'/'+a.target, { fontSize:'11px', fontFamily:'Arial', color:'#888' }).setOrigin(1,0).setDepth(210));
      p(this.add.rectangle(20, y+18, 260, 6, 0x333355).setOrigin(0,0.5).setDepth(210));
      p(this.add.rectangle(20, y+18, 260*Math.min(v/a.target,1), 6, u?0xFFD700:0x4488AA).setOrigin(0,0.5).setDepth(211));
    });
    const cb = p(this.add.text(CFG.WIDTH/2, CFG.HEIGHT-40, 'CLOSE', { fontSize:'18px', fontFamily:'Arial', fontStyle:'bold', color:'#A8D8EA', backgroundColor:'#16213E', padding:{x:30,y:8} }).setOrigin(0.5).setDepth(210).setInteractive({useHandCursor:true}));
    cb.on('pointerdown', () => { playClick(); el.forEach(o=>o.destroy()); });
  }

  showDailyOverlay() {
    const el = [], p = (o) => { el.push(o); return o; }, mod = MetaProgress.getDailyMod(), result = MetaProgress.getDailyResult();
    p(this.add.rectangle(CFG.WIDTH/2, CFG.HEIGHT/2, CFG.WIDTH, CFG.HEIGHT, 0x0A0A1E, 0.95).setDepth(200).setInteractive());
    p(this.add.text(CFG.WIDTH/2, 50, 'DAILY CHALLENGE', { fontSize:'22px', fontFamily:'Arial', fontStyle:'bold', color:'#FFD700' }).setOrigin(0.5).setDepth(210));
    p(this.add.text(CFG.WIDTH/2, 78, 'Modifier: '+mod.label, { fontSize:'14px', fontFamily:'Arial', color:'#FF9900' }).setOrigin(0.5).setDepth(210));
    const tierLabels = ['Bronze: Wave '+CFG.DAILY_BRONZE_WAVE, 'Silver: Wave '+CFG.DAILY_SILVER_WAVE+' \u2264'+CFG.DAILY_SILVER_MAX_BALLS+' balls', 'Gold: Wave '+CFG.DAILY_GOLD_WAVE+' <90s'];
    tierLabels.forEach((t, i) => { const done = result&&result.tiers&&result.tiers[i]; p(this.add.text(40, 115+i*36, (done?'\u2605':'\u2606')+' '+t, { fontSize:'13px', fontFamily:'Arial', color:done?'#FFD700':'#888' }).setDepth(210)); });
    p(this.add.text(CFG.WIDTH/2, 240, 'Stars: '+MetaProgress.data.daily_stars, { fontSize:'14px', fontFamily:'Arial', color:'#FFD700' }).setOrigin(0.5).setDepth(210));
    p(this.add.text(CFG.WIDTH/2, 270, 'Last 7 Days', { fontSize:'12px', fontFamily:'Arial', color:'#AAA' }).setOrigin(0.5).setDepth(210));
    MetaProgress.getLast7Days().forEach((d, i) => { const x = 50+i*40; p(this.add.circle(x, 296, 8, d.result?0xFFD700:0x333355).setDepth(210)); p(this.add.text(x, 312, d.date, { fontSize:'8px', fontFamily:'Arial', color:'#666' }).setOrigin(0.5).setDepth(210)); });
    if (!result) {
      const pb = p(this.add.text(CFG.WIDTH/2, 360, 'PLAY DAILY', { fontSize:'20px', fontFamily:'Arial', fontStyle:'bold', color:'#000', backgroundColor:'#FFD700', padding:{x:24,y:10} }).setOrigin(0.5).setDepth(210).setInteractive({useHandCursor:true}));
      pb.on('pointerdown', () => { playClick(); const gs = window.GameState; gs.score=0; gs.waveNumber=1; gs.sessionSeed=MetaProgress.getDailySeed(); gs.is_daily_challenge=true; gs._dailyMod=mod; gs._daily_balls_used=0; gs._daily_start_time=Date.now(); AdManager.reset(); el.forEach(o=>o.destroy()); this.cameras.main.fade(200,0,0,0); this.time.delayedCall(200, ()=>this.scene.start('GameScene')); });
    } else { p(this.add.text(CFG.WIDTH/2, 360, 'COMPLETED!', { fontSize:'16px', fontFamily:'Arial', color:'#39FF14' }).setOrigin(0.5).setDepth(210)); }
    const cb = p(this.add.text(CFG.WIDTH/2, 420, 'CLOSE', { fontSize:'18px', fontFamily:'Arial', fontStyle:'bold', color:'#A8D8EA', backgroundColor:'#16213E', padding:{x:30,y:8} }).setOrigin(0.5).setDepth(210).setInteractive({useHandCursor:true}));
    cb.on('pointerdown', () => { playClick(); el.forEach(o=>o.destroy()); });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create(data) {
    this.cameras.main.setBackgroundColor(CFG.COLOR.BG);
    const gs = window.GameState;

    // Title
    this.add.text(CFG.WIDTH / 2, 100, 'GAME OVER', {
      fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold',
      color: CFG.COLOR.WHITE_HEX, stroke: '#16213E', strokeThickness: 3,
    }).setOrigin(0.5);

    // Score count-up
    const finalScore = data.score || 0;
    const scoreText = this.add.text(CFG.WIDTH / 2, 200, '0', {
      fontSize: '56px', fontFamily: 'Arial', fontStyle: 'bold',
      color: CFG.COLOR.SCORE_HEX,
    }).setOrigin(0.5);

    this.tweens.addCounter({
      from: 0, to: finalScore, duration: 800, ease: 'Power2',
      onUpdate: (tween) => { scoreText.setText(Math.floor(tween.getValue()).toLocaleString()); }
    });

    // Wave reached
    this.add.text(CFG.WIDTH / 2, 270, `Wave ${data.wave || 1}`, {
      fontSize: '20px', fontFamily: 'Arial', color: '#AAA',
    }).setOrigin(0.5);

    // Best chain
    this.add.text(CFG.WIDTH / 2, 305, `Best Chain: x${Math.pow(2, Math.min(data.chainDepth || 0, 3))}`, {
      fontSize: '16px', fontFamily: 'Arial', color: '#888',
    }).setOrigin(0.5);

    // New high score badge
    if (data.isNewHigh && finalScore > 0) {
      const badge = this.add.text(CFG.WIDTH / 2, 155, 'NEW HIGH SCORE!', {
        fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold',
        color: CFG.COLOR.SCORE_HEX, stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5);
      this.tweens.add({
        targets: badge, scaleX: 1.1, scaleY: 1.1, duration: 400,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }

    // Daily challenge results
    if (data.is_daily) {
      const w = data.daily_wave||1, bu = data.daily_balls_used||0, el = data.daily_elapsed||999999;
      const tiers = [w>=CFG.DAILY_BRONZE_WAVE, w>=CFG.DAILY_SILVER_WAVE&&bu<=CFG.DAILY_SILVER_MAX_BALLS, w>=CFG.DAILY_GOLD_WAVE&&el<CFG.DAILY_GOLD_MAX_TIME];
      let earned = 0; tiers.forEach((t,i) => { if(t) earned += [1,2,3][i]; });
      if (!MetaProgress.getDailyResult()) MetaProgress.saveDailyResult(earned, tiers);
      ['Bronze','Silver','Gold'].forEach((l,i) => this.add.text(CFG.WIDTH/2, 340+i*22, `${tiers[i]?'\u2605':'\u2606'} ${l}`, { fontSize:'13px', fontFamily:'Arial', color:tiers[i]?'#FFD700':'#555' }).setOrigin(0.5));
      window.GameState.is_daily_challenge = false;
    }
    // Nearest achievement
    const nextAch = MetaProgress.getNextAchievement();
    if (nextAch) {
      const v = Math.min(MetaProgress.data[nextAch.stat]||0, nextAch.target), pct = v/nextAch.target, ay = data.is_daily?420:340;
      this.add.text(CFG.WIDTH/2, ay, `Next: ${nextAch.title}`, { fontSize:'12px', fontFamily:'Arial', color:'#888' }).setOrigin(0.5);
      this.add.rectangle(CFG.WIDTH/2-80, ay+18, 160, 6, 0x333355).setOrigin(0,0.5);
      this.add.rectangle(CFG.WIDTH/2-80, ay+18, 160*pct, 6, 0x4488AA).setOrigin(0,0.5);
      this.add.text(CFG.WIDTH/2+90, ay+18, v+'/'+nextAch.target, { fontSize:'10px', fontFamily:'Arial', color:'#666' }).setOrigin(0,0.5);
    }

    // Double score button
    if (AdManager.canDoubleScore()) {
      const dblBtn = this.add.text(CFG.WIDTH/2, 400, 'WATCH AD - 2x SCORE', { fontSize:'16px', fontFamily:'Arial', fontStyle:'bold', color:'#000', backgroundColor:CFG.COLOR.SCORE_HEX, padding:{x:20,y:10} }).setOrigin(0.5).setInteractive({useHandCursor:true});
      dblBtn.on('pointerdown', () => { AdManager.useDoubleScore(); AdManager.showRewarded('double_score', () => { gs.score=finalScore*2; if(gs.score>gs.highScore){gs.highScore=gs.score;localStorage.setItem('shatter-chain_high_score',gs.highScore);} scoreText.setText(gs.score.toLocaleString()); dblBtn.destroy(); }); });
    }
    // Play Again
    const playBtn = this.add.text(CFG.WIDTH/2, 480, 'PLAY AGAIN', { fontSize:'22px', fontFamily:'Arial', fontStyle:'bold', color:CFG.COLOR.BG_HEX, backgroundColor:'#A8D8EA', padding:{x:30,y:12} }).setOrigin(0.5).setInteractive({useHandCursor:true});
    playBtn.on('pointerdown', () => { playClick(); gs.score=0; gs.waveNumber=1; gs.sessionSeed=Date.now(); gs.is_daily_challenge=false; AdManager.reset(); AdManager.shouldShowInterstitial() ? AdManager.showInterstitial(()=>this.scene.start('GameScene')) : this.scene.start('GameScene'); });
    // Menu
    const menuBtn = this.add.text(CFG.WIDTH/2, 535, 'MENU', { fontSize:'16px', fontFamily:'Arial', color:'#888', padding:{x:20,y:8} }).setOrigin(0.5).setInteractive({useHandCursor:true});
    menuBtn.on('pointerdown', () => { playClick(); gs.score=0; gs.waveNumber=1; this.scene.start('MenuScene'); });
  }
}
