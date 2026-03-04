// effects.js — Juice effects: particles, screen shake, hit-stop, visual feedback

const Effects = {
  createTextures(scene) {
    // Particle texture
    if (!scene.textures.exists('particle')) {
      const pg = scene.make.graphics({ add: false });
      pg.fillStyle(0xFFFFFF, 1);
      pg.fillCircle(4, 4, 4);
      pg.generateTexture('particle', 8, 8);
      pg.destroy();
    }

    // Slap star texture
    if (!scene.textures.exists('slapstar')) {
      const sg = scene.make.graphics({ add: false });
      sg.fillStyle(0xF5C518, 1);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? 20 : 10;
        const px = 20 + Math.cos(a) * r;
        const py = 20 + Math.sin(a) * r;
        if (i === 0) sg.moveTo(px, py); else sg.lineTo(px, py);
      }
      sg.closePath(); sg.fillPath();
      sg.generateTexture('slapstar', 40, 40);
      sg.destroy();
    }
  },

  slapEffect(scene, alarm, tapX, tapY, combo, isSmash) {
    const spr = alarm.sprite;
    if (!spr || !spr.active) { scene.removeAlarm(alarm); return; }

    const starColor = alarm.type === CONFIG.ALARM_TYPES.MUFFLER ? 0x88DDFF :
      (alarm.type >= CONFIG.ALARM_TYPES.SLOW_MOVER ? 0xFF6B00 : 0xF5C518);

    // Slap star
    const star = scene.add.image(alarm.x, alarm.y, 'slapstar').setTint(starColor)
      .setScale(0.1).setDepth(40);
    const starSize = 1.4 + combo * 0.04;
    scene.tweens.add({
      targets: star, scaleX: starSize, scaleY: starSize, duration: 60,
      onComplete: () => {
        scene.tweens.add({ targets: star, alpha: 0, duration: 180, onComplete: () => star.destroy() });
      }
    });

    // Particles
    const pCount = 20 + Math.floor(combo / 5) * 2;
    for (let i = 0; i < pCount; i++) {
      const angle = (i / pCount) * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      const p = scene.add.circle(alarm.x, alarm.y, 3, starColor, 1).setDepth(35);
      scene.tweens.add({
        targets: p, x: alarm.x + Math.cos(angle) * speed,
        y: alarm.y + Math.sin(angle) * speed, alpha: 0,
        duration: 400, onComplete: () => p.destroy(),
      });
    }

    // Hit-stop then fly-off
    const flyAngle = Math.atan2(alarm.y - tapY, alarm.x - tapX);
    scene.time.delayedCall(40, () => {
      if (!spr.active) { scene.removeAlarm(alarm); return; }
      scene.tweens.add({
        targets: spr, x: alarm.x + Math.cos(flyAngle) * 300,
        y: alarm.y + Math.sin(flyAngle) * 300,
        angle: Phaser.Math.Between(-720, 720), scaleX: 0, scaleY: 0, alpha: 0,
        duration: 300, onComplete: () => scene.removeAlarm(alarm),
      });
    });

    // Ring arc cleanup
    if (alarm.ringArc) { alarm.ringArc.destroy(); alarm.ringArc = null; }
  },

  mufflerRipple(scene, alarm) {
    const ripple = scene.add.circle(alarm.x, alarm.y, 10, 0x88DDFF, 0.6).setDepth(30);
    scene.tweens.add({
      targets: ripple, radius: 80, alpha: 0, duration: 400,
      onUpdate: (t) => { ripple.setRadius(10 + t.progress * 70); },
      onComplete: () => ripple.destroy(),
    });
  },

  ringCompleteShockwave(scene, alarm) {
    const ring = scene.add.circle(alarm.x, alarm.y, 40, 0xFF2222, 0).setDepth(30);
    ring.setStrokeStyle(3, 0xFF2222, 0.8);
    scene.tweens.add({
      targets: ring, radius: 80, alpha: 0, duration: 400,
      onUpdate: (t) => ring.setRadius(40 + t.progress * 40),
      onComplete: () => ring.destroy(),
    });
  },

  floatingScore(scene, x, y, pts, combo) {
    const color = combo >= 5 ? '#FFD700' : '#FFFFFF';
    const size = Math.min(32, 20 + Math.floor(combo / 5) * 2);
    const ft = scene.add.text(x, y, `+${pts}`, {
      fontSize: `${size}px`, fontFamily: 'Arial', fontStyle: 'bold',
      fill: color, stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(45);
    scene.tweens.add({
      targets: ft, y: y - 60, alpha: 0, duration: 600,
      onComplete: () => ft.destroy(),
    });
  },

  stageClearFlash(scene, stageNum) {
    const flash = scene.add.rectangle(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2,
      CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT, 0xFFFFFF, 0).setDepth(60);
    scene.tweens.add({
      targets: flash, alpha: 0.6, duration: 150,
      yoyo: true, onComplete: () => flash.destroy(),
    });

    const clearText = scene.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2,
      `STAGE ${stageNum} CLEAR!`, {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold',
      fill: '#FFD700', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(61).setScale(0.5);
    scene.tweens.add({
      targets: clearText, scaleX: 1.1, scaleY: 1.1, duration: 150,
      yoyo: true, hold: 300,
      onComplete: () => {
        scene.tweens.add({ targets: clearText, alpha: 0, duration: 400, onComplete: () => clearText.destroy() });
      }
    });
  },

  deathEffects(scene) {
    scene.cameras.main.shake(500, 0.01);

    const redFlash = scene.add.rectangle(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2,
      CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT, 0xFF0000, 0).setDepth(70);
    scene.tweens.add({
      targets: redFlash, alpha: 0.45, duration: 150,
      yoyo: true, hold: 150,
    });

    for (const alarm of scene.alarms) {
      if (!alarm.dead && alarm.sprite && alarm.sprite.active) {
        alarm.sprite.setTint(0xFF0000);
      }
    }
  },

  restStageBanner(scene) {
    const zzz = scene.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 60, 'ZZZ', {
      fontSize: '64px', fontFamily: 'Arial', fontStyle: 'bold',
      fill: '#88DDFF', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(55).setAlpha(0.7);
    scene.tweens.add({
      targets: zzz, alpha: 0, y: CONFIG.GAME_HEIGHT / 2 - 100,
      duration: 2000, onComplete: () => zzz.destroy(),
    });
  },

  stormBanner(scene) {
    const storm = scene.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2, 'ALARM STORM!', {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold',
      fill: '#FF4444', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(55);
    scene.tweens.add({
      targets: storm, scaleX: 1.1, scaleY: 1.1, alpha: 0,
      duration: 1500, onComplete: () => storm.destroy(),
    });
  },

  createHUD(scene) {
    const W = CONFIG.GAME_WIDTH;
    scene.add.rectangle(W / 2, CONFIG.HUD_TOP_HEIGHT / 2, W, CONFIG.HUD_TOP_HEIGHT, 0x0D0D1A, 0.85).setDepth(50);
    scene.add.text(8, CONFIG.HUD_TOP_HEIGHT / 2, 'NOISE', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#AAAAAA',
    }).setOrigin(0, 0.5).setDepth(51);
    scene.noiseBarBg = scene.add.rectangle(60 + 100, CONFIG.HUD_TOP_HEIGHT / 2, 200, 18, 0x333333, 1).setDepth(51);
    scene.noiseBarFill = scene.add.rectangle(60, CONFIG.HUD_TOP_HEIGHT / 2, 0, 16, 0x44CC44, 1)
      .setOrigin(0, 0.5).setDepth(52);
    scene.stageText = scene.add.text(W - 8, CONFIG.HUD_TOP_HEIGHT / 2, `S.${scene.stage}`, {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#FFFFFF',
    }).setOrigin(1, 0.5).setDepth(51);
    const botY = CONFIG.GAME_HEIGHT - CONFIG.HUD_BOTTOM_HEIGHT / 2;
    scene.add.rectangle(W / 2, botY, W, CONFIG.HUD_BOTTOM_HEIGHT, 0x0D0D1A, 0.85).setDepth(50);
    scene.scoreText = scene.add.text(12, botY, `SCORE: ${scene.score}`, {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#FFFFFF',
    }).setOrigin(0, 0.5).setDepth(51);
    scene.comboText = scene.add.text(W - 12, botY, '', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#FFD700',
    }).setOrigin(1, 0.5).setDepth(51).setAlpha(0);
    scene.timerBar = scene.add.rectangle(0, CONFIG.HUD_TOP_HEIGHT, 0, 3, 0x44AAFF, 1)
      .setOrigin(0, 0).setDepth(53);
    const pauseBtn = scene.add.text(W - 36, CONFIG.HUD_TOP_HEIGHT + 12, 'II', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#FFFFFF',
      backgroundColor: '#33333388', padding: { x: 8, y: 4 },
    }).setDepth(60).setInteractive();
    pauseBtn.on('pointerdown', () => scene.togglePause());
  },

  showPauseOverlay(scene) {
    const W = CONFIG.GAME_WIDTH, H = CONFIG.GAME_HEIGHT;
    scene.pauseOverlay = scene.add.container(0, 0).setDepth(100);
    scene.pauseOverlay.add(scene.add.rectangle(W/2, H/2, W, H, 0x0D0D1A, 0.85));
    scene.pauseOverlay.add(scene.add.text(W/2, H/2-80, 'PAUSED', {
      fontSize:'36px',fontFamily:'Arial',fontStyle:'bold',fill:'#FFFFFF'}).setOrigin(0.5));
    const mkBtn = (y,lbl,col,cb) => {
      const b = scene.add.rectangle(W/2,y,180,50,col,1).setInteractive();
      const t = scene.add.text(W/2,y,lbl,{fontSize:'22px',fontFamily:'Arial',fontStyle:'bold',fill:'#FFFFFF'}).setOrigin(0.5);
      b.on('pointerdown',cb); scene.pauseOverlay.add(b); scene.pauseOverlay.add(t);
    };
    mkBtn(H/2-10,'RESUME',0x44AA44,()=>scene.togglePause());
    mkBtn(H/2+50,'RESTART',0xFF8800,()=>{scene.pauseOverlay.destroy();AudioManager.resumeAll();scene.scene.restart();});
    mkBtn(H/2+110,'MENU',0x444444,()=>{scene.pauseOverlay.destroy();AudioManager.resumeAll();AudioManager.stopMusic();scene.scene.start('MenuScene');});
  },
};
