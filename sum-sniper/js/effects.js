// Sum Sniper - Juice Effects (mixin for GameScene)
const GameEffects = {
    cellTapEffect(cellSprite) {
        if (!cellSprite || !cellSprite.active) return;
        this.tweens.add({
            targets: cellSprite,
            scaleX: 1.15, scaleY: 1.15,
            duration: 60, yoyo: true, ease: 'Quad.easeInOut'
        });
    },

    explosionEffect(cells, gridX, gridY) {
        const cx = cells.reduce((a, c) => a + (gridX + c.col * (GRID.CELL_SIZE + GRID.GAP) + GRID.CELL_SIZE / 2), 0) / cells.length;
        const cy = cells.reduce((a, c) => a + (gridY + c.row * (GRID.CELL_SIZE + GRID.GAP) + GRID.CELL_SIZE / 2), 0) / cells.length;

        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 150;
            const tex = i % 2 === 0 ? 'particle' : 'particleGold';
            const p = this.add.image(cx, cy, tex).setScale(0.8).setDepth(50);
            this.tweens.add({
                targets: p,
                x: cx + Math.cos(angle) * speed,
                y: cy + Math.sin(angle) * speed,
                alpha: 0, scaleX: 0.1, scaleY: 0.1,
                duration: 400, ease: 'Quad.easeOut',
                onComplete: () => p.destroy()
            });
        }

        if (cells.length >= 4) {
            this.cameras.main.shake(200, 0.004);
        }
    },

    cellBurstEffect(cellSprite) {
        if (!cellSprite || !cellSprite.active) return;
        this.tweens.add({
            targets: cellSprite,
            scaleX: 1.4, scaleY: 1.4, alpha: 0,
            duration: 180, ease: 'Quad.easeIn',
            onComplete: () => { if (cellSprite.active) cellSprite.setVisible(false); }
        });
    },

    missFlashEffect() {
        const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFF0000, 0.4).setDepth(80);
        this.tweens.add({
            targets: flash, alpha: 0, duration: 200,
            onComplete: () => flash.destroy()
        });
        this.cameras.main.shake(300, 0.006);
    },

    floatingScoreText(x, y, points, chainLen) {
        let color = COLORS.UI_TEXT;
        if (chainLen >= 5) color = COLORS.SCORE_GOLD;
        else if (chainLen >= 3) color = COLORS.SELECTED;

        const txt = this.add.text(x, y, '+' + points, {
            fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold',
            color: color, stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(60);

        this.tweens.add({
            targets: txt, y: y - 40, alpha: 0,
            duration: 600, ease: 'Quad.easeOut',
            onComplete: () => txt.destroy()
        });
    },

    comboEffect(combo) {
        if (combo < 2) return;
        let fontSize = 22;
        if (combo >= 4) fontSize = 34;
        else if (combo >= 3) fontSize = 28;

        const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'COMBO x' + combo + '!', {
            fontSize: fontSize + 'px', fontFamily: 'Arial', fontStyle: 'bold',
            color: COLORS.COMBO, stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(70);

        this.tweens.add({
            targets: txt, y: txt.y - 60, alpha: 0,
            duration: 700, ease: 'Quad.easeOut',
            onComplete: () => txt.destroy()
        });

        if (combo >= 3) {
            for (let i = 0; i < 6; i++) {
                const px = GAME_WIDTH / 2 + (Math.random() - 0.5) * 100;
                const p = this.add.image(px, 60, 'particleGold').setScale(0.5).setDepth(60);
                this.tweens.add({
                    targets: p, y: p.y - 50, alpha: 0,
                    duration: 500, delay: i * 30,
                    onComplete: () => p.destroy()
                });
            }
        }

        if (combo >= 4) {
            const ring = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 10, 0x00D4FF, 0.8).setDepth(55);
            this.tweens.add({
                targets: ring, radius: 120, alpha: 0,
                duration: 400, ease: 'Quad.easeOut',
                onComplete: () => ring.destroy()
            });
        }
    },

    strikePunchEffect(strikeIcon) {
        if (!strikeIcon || !strikeIcon.active) return;
        this.tweens.add({
            targets: strikeIcon,
            scaleX: 1.5, scaleY: 1.5,
            duration: 100, yoyo: true, ease: 'Quad.easeInOut'
        });
    },

    gameOverEffect(callback) {
        this.cameras.main.shake(500, 0.012);
        const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x333333, 0).setDepth(90);
        this.tweens.add({
            targets: overlay, alpha: 0.8,
            duration: 300
        });
        setTimeout(() => { if (callback) callback(); }, 400);
    },

    speedBonusText() {
        const txt = this.add.text(GAME_WIDTH / 2, 100, '+SPEED!', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold',
            color: COLORS.SELECTED, stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(60);
        this.tweens.add({
            targets: txt, y: 60, alpha: 0,
            duration: 600, ease: 'Quad.easeOut',
            onComplete: () => txt.destroy()
        });
    },

    stageMilestoneFlash() {
        const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x00D4FF, 0.2).setDepth(80);
        this.tweens.add({
            targets: flash, alpha: 0, duration: 300,
            onComplete: () => flash.destroy()
        });
    },

    dropAnimation(sprite, fromY, toY, delay) {
        sprite.y = fromY;
        this.tweens.add({
            targets: sprite, y: toY,
            duration: 250, delay: delay || 0,
            ease: 'Bounce.easeOut'
        });
    },

    newHighScoreEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = -Math.PI + Math.random() * Math.PI;
            const speed = 60 + Math.random() * 120;
            const tex = i % 2 === 0 ? 'particleGold' : 'particle';
            const p = this.add.image(x, y, tex).setScale(0.6).setDepth(55);
            this.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0, scaleX: 0.1, scaleY: 0.1,
                duration: 600, delay: i * 20,
                onComplete: () => p.destroy()
            });
        }
    }
};
