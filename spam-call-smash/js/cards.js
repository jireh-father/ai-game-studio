// cards.js — Card visual creation, spawning, tutorial hints

const Cards = {
  spawn(scene, callData) {
    const activeCards = scene.cards.filter(c => c.active);
    const yPos = CONFIG.CARD_ZONE_TOP + 40 + activeCards.length * CONFIG.CARD_GAP;
    if (yPos > CONFIG.CARD_ZONE_BOT) return;
    const card = Cards.createVisual(scene, callData, CONFIG.WIDTH / 2, yPos);
    scene.cards.push(card);

    card.timerEvent = scene.time.addEvent({
      delay: callData.timeWindow,
      callback: () => scene.onCardTimeout(card)
    });

    // Tutorial hints stage 1
    if (scene.showTutorial && scene.cards.length <= 2) {
      const hint = callData.isSpam !== false ? 'TAP FAST!' : 'HOLD TO ANSWER';
      const hintTxt = scene.add.text(card.x, card.y + 50, hint, {
        fontSize: '13px', fontFamily: 'Arial, sans-serif', fill: '#FFD60A',
        backgroundColor: '#000000AA', padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setDepth(30);
      scene.tweens.add({ targets: hintTxt, alpha: 0, delay: 2000, duration: 500,
        onComplete: () => hintTxt.destroy() });
    }

    // Evolving card morph
    if (callData.type === 'EVOLVING') {
      scene.time.delayedCall(callData.timeWindow * 0.4, () => {
        if (!card.active) return;
        card.callData.isSpam = card.callData.evolveTarget;
        card.callData.action = card.callData.evolveTarget ? 'tap' : 'hold';
        const newCol = card.callData.isSpam ? CONFIG.COL_SPAM : CONFIG.COL_REAL;
        card.bg.setFillStyle(newCol, 0.15);
        card.bg.setStrokeStyle(2, newCol, 0.8);
        card.icon.setTint(newCol);
        scene.cameras.main.flash(100, 255, 200, 50);
      });
    }
  },

  createVisual(scene, callData, x, y) {
    const c = scene.add.container(x, y).setDepth(10).setScale(0.8).setAlpha(0);
    c.callData = callData;
    c.active = true;
    c.setSize(CONFIG.CARD_W, CONFIG.CARD_H);

    const bg = scene.add.rectangle(0, 0, CONFIG.CARD_W, CONFIG.CARD_H, callData.color, 0.12);
    bg.setStrokeStyle(2, callData.color, 0.7);
    c.bg = bg;

    // Icon
    const iconG = scene.add.graphics();
    const iconX = -CONFIG.CARD_W / 2 + 36;
    if (callData.isSpam !== false) {
      iconG.fillStyle(callData.color, 1);
      iconG.fillRoundedRect(iconX - 16, -16, 32, 32, 6);
      iconG.fillStyle(0xFFFFFF, 0.9);
      iconG.fillCircle(iconX - 4, -4, 3);
      iconG.fillCircle(iconX + 4, -4, 3);
      iconG.fillStyle(0xFFFFFF, 0.7);
      iconG.fillRect(iconX - 5, 6, 10, 2);
    } else {
      iconG.fillStyle(callData.contactColor || CONFIG.COL_REAL, 1);
      iconG.fillCircle(iconX, 0, 16);
      const initial = (callData.displayName || 'X')[0];
      const initTxt = scene.add.text(iconX, 0, initial, {
        fontSize: '16px', fontFamily: 'Arial, sans-serif', fill: '#FFFFFF', fontStyle: 'bold'
      }).setOrigin(0.5);
      c.add(initTxt);
    }
    c.icon = iconG;

    const nameTxt = scene.add.text(-CONFIG.CARD_W / 2 + 64, -14, callData.displayName, {
      fontSize: '15px', fontFamily: 'Arial, sans-serif', fill: '#E8E8F0', fontStyle: 'bold'
    });
    let sub = callData.isSpam !== false ? 'Incoming...' : 'Contact';
    if (callData.type === 'MULTI_TAP') sub = 'Tap ' + callData.taps + '\u00d7 to hang up';
    if (callData.type === 'SPOOFED') sub = 'Timer: -0:03';
    if (callData.type === 'SILENT') sub = '(vibrating...)';
    const subTxt = scene.add.text(-CONFIG.CARD_W / 2 + 64, 6, sub, {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', fill: '#888899'
    });

    const timerArc = scene.add.graphics();
    c.timerArc = timerArc;
    c.timerStartTime = scene.time.now;

    c.add([bg, iconG, nameTxt, subTxt, timerArc]);

    // Disguised pulsing outline
    if (callData.type === 'DISGUISED') {
      scene.time.delayedCall(500, () => {
        if (!c.active) return;
        const pulse = scene.add.rectangle(0, 0, CONFIG.CARD_W + 4, CONFIG.CARD_H + 4)
          .setStrokeStyle(2, CONFIG.COL_DISGUISED, 0.6).setFillStyle(0, 0);
        c.add(pulse);
        scene.tweens.add({ targets: pulse, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
      });
    }

    // Interactive
    bg.setInteractive(new Phaser.Geom.Rectangle(
      -CONFIG.CARD_W / 2, -CONFIG.CARD_H / 2, CONFIG.CARD_W, CONFIG.CARD_H
    ), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerdown', (ptr) => scene.onCardDown(c, ptr));
    bg.on('pointerup', (ptr) => scene.onCardUp(c, ptr));

    // Entry animation
    scene.tweens.add({
      targets: c, scaleX: 1, scaleY: 1, alpha: 1,
      duration: CONFIG.CARD_ENTRY_MS, ease: 'Back.easeOut'
    });

    scene.cardContainer.add(c);
    return c;
  },

  reposition(scene) {
    const active = scene.cards.filter(c => c.active);
    active.forEach((c, i) => {
      const targetY = CONFIG.CARD_ZONE_TOP + 40 + i * CONFIG.CARD_GAP;
      scene.tweens.add({ targets: c, y: targetY, duration: 200, ease: 'Power2' });
    });
    scene.cards = scene.cards.filter(c => c.active);
  }
};
