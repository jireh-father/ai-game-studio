// Blade Spin - UI Scenes
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    this.cameras.main.setBackgroundColor(COL_BG);
    this.add.text(GAME_W/2, 100, 'BLADE SPIN', {
      fontSize:'36px', fill:COL_SCORE, fontStyle:'bold', letterSpacing:4
    }).setOrigin(0.5);
    this.menuLog = this.add.image(GAME_W/2, 260, 'log').setScale(LOG_DISPLAY_SCALE);
    this.deco1 = this.add.image(0, 0, 'blade').setScale(0.8);
    this.deco2 = this.add.image(0, 0, 'blade').setScale(0.8);
    this.menuAngle = 0;
    // Play
    var playBg = this.add.rectangle(GAME_W/2, 460, 200, 60, 0xE8E8E8).setInteractive({useHandCursor:true});
    this.add.text(GAME_W/2, 460, 'PLAY', {fontSize:'24px',fill:COL_BG,fontStyle:'bold'}).setOrigin(0.5).disableInteractive();
    playBg.on('pointerdown', () => {
      SoundFX.resume(); SoundFX.uiClick();
      this.scene.stop('MenuScene'); this.scene.start('GameScene', {stage:1, score:0, continued:false});
    });
    // Help
    var helpBg = this.add.rectangle(GAME_W/2, 540, 200, 44, 0, 0).setStrokeStyle(2, 0xE8E8E8).setInteractive({useHandCursor:true});
    this.add.text(GAME_W/2, 540, '? HOW TO PLAY', {fontSize:'16px',fill:COL_SCORE}).setOrigin(0.5).disableInteractive();
    helpBg.on('pointerdown', () => {
      SoundFX.uiClick(); this.scene.pause('MenuScene'); this.scene.launch('HelpScene', {returnTo:'MenuScene'});
    });
    // High score
    var hs = localStorage.getItem('blade-spin_high_score') || 0;
    this.add.text(GAME_W/2, 620, 'BEST: ' + hs, {fontSize:'18px',fill:'#888888'}).setOrigin(0.5);
  }
  update() {
    this.menuAngle += 0.3;
    if (this.menuLog) this.menuLog.setAngle(this.menuAngle);
    var r = LOG_RADIUS * LOG_DISPLAY_SCALE;
    [[this.deco1, 45], [this.deco2, 200]].forEach(([d, off]) => {
      if (!d) return;
      var a = Phaser.Math.DegToRad(this.menuAngle + off);
      d.setPosition(GAME_W/2 + Math.cos(a)*r, 260 + Math.sin(a)*r);
      d.setAngle(this.menuAngle + off + 90);
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) {
    this.finalScore = data.score || 0;
    this.finalStage = data.stage || 1;
    this.isHighScore = data.isHighScore || false;
    this.canContinue = data.canContinue || false;
  }
  create() {
    this.cameras.main.setBackgroundColor(COL_BG);
    AdsManager.trackGameOver();
    this.add.text(GAME_W/2, 140, 'GAME OVER', {fontSize:'40px',fill:COL_DANGER,fontStyle:'bold'}).setOrigin(0.5);
    if (this.isHighScore) {
      this.add.text(GAME_W/2, 200, 'NEW BEST!', {fontSize:'20px',fill:COL_APPLE,fontStyle:'bold'}).setOrigin(0.5);
      SoundFX.highScore();
    }
    this.add.text(GAME_W/2, 240, ''+this.finalScore, {fontSize:'52px',fill:COL_SCORE,fontStyle:'bold'}).setOrigin(0.5);
    this.add.text(GAME_W/2, 310, 'Stage reached: '+this.finalStage, {fontSize:'22px',fill:'#888888'}).setOrigin(0.5);
    var hs = localStorage.getItem('blade-spin_high_score') || 0;
    this.add.text(GAME_W/2, 350, 'BEST: '+hs, {fontSize:'22px',fill:this.isHighScore?COL_APPLE:'#888888'}).setOrigin(0.5);
    var yOff = this.canContinue ? 0 : -35;
    if (this.canContinue) {
      var cBg = this.add.rectangle(GAME_W/2, 430, 240, 55, 0xFF9900).setInteractive({useHandCursor:true});
      this.add.text(GAME_W/2, 430, 'WATCH AD TO CONTINUE', {fontSize:'16px',fill:COL_BG,fontStyle:'bold'}).setOrigin(0.5).disableInteractive();
      cBg.on('pointerdown', () => {
        SoundFX.uiClick(); AdsManager.markContinueUsed();
        this.scene.stop('GameOverScene');
        this.scene.start('GameScene', {stage:this.finalStage, score:this.finalScore, continued:true});
      });
    }
    var rBg = this.add.rectangle(GAME_W/2, 500+yOff, 160, 50, 0, 0).setStrokeStyle(2, 0xE8E8E8).setInteractive({useHandCursor:true});
    this.add.text(GAME_W/2, 500+yOff, 'PLAY AGAIN', {fontSize:'18px',fill:COL_SCORE,fontStyle:'bold'}).setOrigin(0.5).disableInteractive();
    rBg.on('pointerdown', () => {
      SoundFX.uiClick(); AdsManager.resetRun();
      this.scene.stop('GameOverScene'); this.scene.start('GameScene', {stage:1, score:0, continued:false});
    });
    var mTxt = this.add.text(GAME_W/2, 565+yOff, 'MENU', {fontSize:'18px',fill:'#888888'}).setOrigin(0.5).setInteractive({useHandCursor:true});
    mTxt.on('pointerdown', () => {
      SoundFX.uiClick(); AdsManager.resetRun();
      this.scene.stop('GameOverScene'); this.scene.start('MenuScene');
    });
  }
}

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }
  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }
  create() {
    this.cameras.main.setBackgroundColor(COL_BG);
    var y = 50;
    this.add.text(GAME_W/2, y, 'HOW TO PLAY', {fontSize:'28px',fill:COL_SCORE,fontStyle:'bold'}).setOrigin(0.5);
    y += 50;
    // Tap diagram
    var g = this.add.graphics();
    g.fillStyle(0x7B4F2E); g.fillCircle(GAME_W/2, y+30, 35);
    g.fillStyle(0xE8E8E8);
    g.fillTriangle(GAME_W/2, y+70, GAME_W/2-4, y+100, GAME_W/2+4, y+100);
    g.lineStyle(2, 0xFFFFFF, 0.6);
    g.lineBetween(GAME_W/2, y+105, GAME_W/2, y+75);
    g.lineBetween(GAME_W/2-6, y+82, GAME_W/2, y+70);
    g.lineBetween(GAME_W/2+6, y+82, GAME_W/2, y+70);
    y += 120;
    this.add.text(GAME_W/2, y, 'TAP anywhere to throw a blade.\nBlades stick in the log.', {fontSize:'16px',fill:COL_SCORE,align:'center',lineSpacing:4}).setOrigin(0.5);
    y += 55;
    // Collision diagram
    var g2 = this.add.graphics();
    g2.fillStyle(0x7B4F2E); g2.fillCircle(GAME_W/2-60, y+25, 20); g2.fillCircle(GAME_W/2+60, y+25, 20);
    g2.fillStyle(0xE8E8E8);
    g2.fillTriangle(GAME_W/2-60,y, GAME_W/2-63,y+15, GAME_W/2-57,y+15);
    g2.fillTriangle(GAME_W/2-45,y+15, GAME_W/2-48,y+30, GAME_W/2-42,y+30);
    g2.fillTriangle(GAME_W/2+60,y, GAME_W/2+57,y+15, GAME_W/2+63,y+15);
    g2.fillTriangle(GAME_W/2+60,y+5, GAME_W/2+57,y+20, GAME_W/2+63,y+20);
    g2.lineStyle(2, 0x00FF00, 0.8); g2.strokeCircle(GAME_W/2-60, y+25, 25);
    g2.lineStyle(2, 0xFF2E2E, 0.8); g2.strokeCircle(GAME_W/2+60, y+25, 25);
    y += 60;
    this.add.text(GAME_W/2, y, "DON'T HIT other blades!", {fontSize:'16px',fill:COL_DANGER,fontStyle:'bold'}).setOrigin(0.5);
    this.add.text(GAME_W/2, y+22, 'One collision = game over.', {fontSize:'14px',fill:COL_DANGER}).setOrigin(0.5);
    y += 55;
    // Swipe
    var g3 = this.add.graphics();
    g3.lineStyle(3, 0xFFFFFF, 0.6);
    g3.lineBetween(GAME_W/2, y+45, GAME_W/2, y+5);
    g3.lineBetween(GAME_W/2-8, y+15, GAME_W/2, y+5);
    g3.lineBetween(GAME_W/2+8, y+15, GAME_W/2, y+5);
    this.add.text(GAME_W/2+30, y+20, 'SWIPE UP = double throw', {fontSize:'12px',fill:'#AAAAAA'});
    y += 55;
    // Apple
    this.add.image(GAME_W/2, y+10, 'golden-apple').setScale(0.7);
    y += 30;
    this.add.text(GAME_W/2, y, 'Hit GOLDEN APPLES for bonus!', {fontSize:'14px',fill:COL_APPLE,fontStyle:'bold'}).setOrigin(0.5);
    y += 30;
    // Tips
    this.add.text(GAME_W/2, y, '--- TIPS ---', {fontSize:'14px',fill:'#666666'}).setOrigin(0.5);
    y += 22;
    ['Throw quickly to build combos','Boss logs have metal shields','Wait 3s and a blade auto-fires!'].forEach((t) => {
      this.add.text(30, y, '* '+t, {fontSize:'13px',fill:'#AAAAAA',wordWrap:{width:300}});
      y += 20;
    });
    // GOT IT button
    var btnY = GAME_H - 60;
    var btnBg = this.add.rectangle(GAME_W/2, btnY, 200, 55, 0xE8E8E8).setInteractive({useHandCursor:true}).setDepth(300);
    this.add.text(GAME_W/2, btnY, 'GOT IT!', {fontSize:'20px',fill:COL_BG,fontStyle:'bold'}).setOrigin(0.5).setDepth(301).disableInteractive();
    var ret = this.returnTo;
    btnBg.on('pointerdown', () => {
      SoundFX.uiClick(); this.scene.stop();
      if (ret === 'GameScene') {
        var gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else { this.scene.resume('MenuScene'); }
    });
  }
}

class HUDScene extends Phaser.Scene {
  constructor() { super('HUDScene'); }
  create() {
    this.add.rectangle(GAME_W/2, 40, GAME_W, 80, parseInt(COL_HUD_BG.replace('#',''),16), 0.85);
    this.stageText = this.add.text(20, 25, '', {fontSize:'18px',fill:COL_STAGE,fontStyle:'bold'});
    this.scoreText = this.add.text(GAME_W/2, 25, '', {fontSize:'20px',fill:COL_SCORE,fontStyle:'bold'}).setOrigin(0.5, 0);
    var pb = this.add.text(GAME_W-20, 25, '\u23F8', {fontSize:'28px',fill:COL_SCORE}).setOrigin(1,0).setInteractive({useHandCursor:true});
    pb.on('pointerdown', () => { var gs = this.scene.get('GameScene'); if (gs) gs.togglePause(); });
    this.comboText = this.add.text(GAME_W/2, 105, '', {fontSize:'24px',fill:COL_COMBO,fontStyle:'bold'}).setOrigin(0.5).setAlpha(0);
    this.throwsText = this.add.text(GAME_W/2, 580, '', {fontSize:'16px',fill:'#888888'}).setOrigin(0.5);
  }
  update() {
    if (!window.GameState) return;
    var gs = window.GameState;
    this.stageText.setText('\u2605 Stage ' + gs.stage);
    this.scoreText.setText('' + gs.score);
    if (gs.combo >= 2) { this.comboText.setText('\u00D7'+gs.combo); this.comboText.setAlpha(1); }
    if (gs.throwsRemaining !== undefined) this.throwsText.setText('\u{1F5E1} '+gs.throwsRemaining+' remaining');
  }
  showComboAnim(c) {
    if (!this.comboText) return;
    var p = 1 + Math.min(c,8)*0.1 + 0.3;
    this.tweens.add({targets:this.comboText, scaleX:p, scaleY:p, duration:250, yoyo:true, ease:'Bounce.Out'});
  }
  hideCombo() { if (this.comboText) this.tweens.add({targets:this.comboText, alpha:0, duration:400}); }
  punchScore() { if (this.scoreText) this.tweens.add({targets:this.scoreText, scaleX:1.4, scaleY:1.4, duration:300, yoyo:true, ease:'Back.Out'}); }
}
