// juice.js — Visual effects, particles, screen shake, floating text

const Juice = {
  smash(scene, card) {
    SoundFX.play(scene, 'smash', scene.combo);
    scene.cameras.main.shake(80, 0.004);
    const colors = [0xFF3B3B, 0xFF6644, 0xFFAA33];
    for (let i = 0; i < 8; i++) {
      const p = scene.add.circle(
        card.x + Phaser.Math.Between(-20, 20),
        card.y + Phaser.Math.Between(-10, 10),
        Phaser.Math.Between(2, 5),
        Phaser.Math.RND.pick(colors)
      ).setDepth(30);
      scene.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-100, 100),
        y: p.y + Phaser.Math.Between(-120, -30),
        alpha: 0, duration: 400,
        onComplete: () => p.destroy()
      });
    }
    if (navigator.vibrate) navigator.vibrate(50);
  },

  answer(scene, card) {
    SoundFX.play(scene, 'answer');
    scene.cameras.main.flash(100, 52, 200, 90);
    for (let i = 0; i < 6; i++) {
      const p = scene.add.circle(
        card.x + Phaser.Math.Between(-20, 20),
        card.y, Phaser.Math.Between(2, 4), 0x34C85A
      ).setDepth(30);
      scene.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-60, 60),
        y: p.y - Phaser.Math.Between(30, 80),
        alpha: 0, duration: 500,
        onComplete: () => p.destroy()
      });
    }
    if (navigator.vibrate) navigator.vibrate(30);
  },

  mistake(scene) {
    scene.tweens.add({ targets: scene.vignette, alpha: 0.5, duration: 150, yoyo: true });
    scene.tweens.add({
      targets: scene.pBar, x: 16 + 8, duration: 50, yoyo: true, repeat: 3,
      onComplete: () => scene.pBar.setX(16)
    });
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
  },

  floatingScore(scene, x, y, pts, isSmash) {
    const label = isSmash ? '+' + pts + ' SMASHED!' : '+' + pts + ' ANSWERED!';
    const col = isSmash ? '#FFD700' : '#34C85A';
    const txt = scene.add.text(x, y, label, {
      fontSize: '18px', fontFamily: 'Arial Black, sans-serif', fill: col,
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(60);
    scene.tweens.add({
      targets: txt, y: y - 60, alpha: 0, duration: 600,
      onComplete: () => txt.destroy()
    });
  },

  combo(scene) {
    const level = Math.min(scene.combo, 5);
    const cols = ['#FFFFFF', '#FFFFFF', '#FFD60A', '#FF8C42', '#FF3B3B', '#FF3B3B'];
    const semitones = [0, 0, 0, 2, 4, 6];
    scene.comboTxt.setText('COMBO x' + scene.combo + '!');
    scene.comboTxt.setColor(cols[level]);
    scene.comboTxt.setAlpha(1).setScale(1.2 + level * 0.1);
    scene.tweens.add({ targets: scene.comboTxt, scaleX: 1, scaleY: 1, duration: 400, ease: 'Power2' });
    scene.tweens.add({ targets: scene.comboTxt, alpha: 0, delay: 600, duration: 400 });
    SoundFX.play(scene, 'combo', semitones[level]);
  },

  stageClear(scene) {
    SoundFX.play(scene, 'stageClear');
    scene.cameras.main.flash(200, 255, 255, 255);
    const cols = [0xFF3B3B, 0x34C85A, 0xFFD60A, 0x4FC3F7, 0xBA68C8, 0xFF8C42];
    for (let i = 0; i < 24; i++) {
      const p = scene.add.circle(
        Phaser.Math.Between(20, CONFIG.WIDTH - 20),
        Phaser.Math.Between(-20, CONFIG.HEIGHT / 3),
        Phaser.Math.Between(3, 6),
        Phaser.Math.RND.pick(cols)
      ).setDepth(100);
      scene.tweens.add({
        targets: p,
        y: CONFIG.HEIGHT + 20,
        x: p.x + Phaser.Math.Between(-40, 40),
        duration: Phaser.Math.Between(800, 1200),
        ease: 'Quad.easeIn',
        onComplete: () => p.destroy()
      });
    }
  },

  gameOver(scene) {
    SoundFX.play(scene, 'gameOver');
    scene.cameras.main.shake(300, 0.01);
    scene.tweens.add({ targets: scene.cameras.main, zoom: 1.08, duration: 400 });
  }
};
