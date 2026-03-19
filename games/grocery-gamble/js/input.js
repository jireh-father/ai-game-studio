// Grocery Gamble - Input Handling (mixed into GameScene)
const InputMixin = {
    onPointerDown(pointer) {
        if (this.gameOver || this.paused) return;
        this.lastInputTime = Date.now();

        for (let i = this.beltItems.length - 1; i >= 0; i--) {
            const bi = this.beltItems[i];
            if (!bi.sprite || !bi.sprite.onBelt) continue;
            const bounds = bi.sprite.getBounds();
            if (bounds.contains(pointer.x, pointer.y)) {
                this.pickUpItem(bi, pointer);
                return;
            }
        }
    },

    pickUpItem(beltItem, pointer) {
        this.isDragging = true;
        this.dragItem = beltItem;
        beltItem.sprite.onBelt = false;

        this.tweens.add({
            targets: beltItem.sprite, scaleX: 1.15, scaleY: 1.15, duration: 80, yoyo: true
        });

        if (this.particleGold) {
            const particles = this.add.particles(pointer.x, pointer.y, 'particle', {
                speed: { min: 80, max: 120 }, lifespan: 350, quantity: 6,
                scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 }
            });
            this.time.delayedCall(400, () => particles.destroy());
        }

        this.dragWobble = this.tweens.add({
            targets: beltItem.sprite, angle: 8, duration: 120, yoyo: true, repeat: -1
        });
        this.idleTimer = 0;
    },

    onPointerMove(pointer) {
        if (!this.isDragging || !this.dragItem || this.gameOver || this.paused) return;
        this.lastInputTime = Date.now();

        const sprite = this.dragItem.sprite;
        sprite.setPosition(pointer.x, pointer.y);
        sprite.setDepth(10);

        if (this.dragItem.data.isRush && this.dragItem.sprite.rushIndicator) {
            this.dragItem.sprite.rushIndicator.setPosition(pointer.x, pointer.y);
        }

        if (pointer.y > 350) {
            const trueWeight = this.dragItem.data.trueWeight;
            const meterTop = 130, meterBottom = 330, range = 700;
            const targetY = meterTop + ((1 - trueWeight / range) * (meterBottom - meterTop));
            const oscillation = 5 * Math.sin(this.time.now * 0.008);
            this.needleTargetY = Phaser.Math.Clamp(targetY + oscillation, meterTop, meterBottom);
        }

        this.scaleDisplay.setText(this.dragItem.data.label);
    },

    onPointerUp(pointer) {
        if (!this.isDragging || !this.dragItem || this.gameOver) return;
        this.lastInputTime = Date.now();

        if (this.dragWobble) { this.dragWobble.stop(); this.dragItem.sprite.setAngle(0); }

        const sprite = this.dragItem.sprite;
        const data = this.dragItem.data;

        if (this.scaleZone.contains(pointer.x, pointer.y)) {
            this.placeOnScale(sprite, data, pointer);
        } else {
            sprite.onBelt = true;
            sprite.setPosition(100, 200).setDepth(6);
            if (data.isRush && sprite.rushIndicator) {
                sprite.rushIndicator.setPosition(100, 200);
            }
        }

        this.isDragging = false;
        this.dragItem = null;
        this.scaleDisplay.setText('');
    },

    placeOnScale(sprite, data, pointer) {
        const trueWeight = data.trueWeight;
        const meterTop = 130, meterBottom = 330, range = 700;
        const targetNeedleY = meterTop + ((1 - data.targetWeight / range) * (meterBottom - meterTop));
        const playerNeedleY = meterTop + ((1 - trueWeight / range) * (meterBottom - meterTop));

        const dropHeight = Math.max(0, this.scaleZone.y - pointer.y);
        if (data.isFragile && dropHeight > 80) {
            this.shatterItem(sprite, data);
            return;
        }

        // Player agency: needle position influenced by pointer Y during drag
        // Map pointer position relative to scale meter to weight offset
        const pointerInfluence = (pointer.y - (meterTop + meterBottom) / 2) * 0.15;
        let errorOffset = pointerInfluence;
        if (dropHeight > 100) {
            errorOffset += (Math.random() - 0.5) * 30;
        }

        const adjustedNeedleY = playerNeedleY + errorOffset;
        const zoneHalf = this.greenZone.height / 2;
        const distance = Math.abs(adjustedNeedleY - this.greenZoneCenter);

        this.needle.setY(adjustedNeedleY);
        this.tweens.add({
            targets: this.needle, y: adjustedNeedleY + 8, duration: 100, yoyo: true, ease: 'Bounce.Out'
        });

        const windowPx = zoneHalf;
        const perfectZone = windowPx * 0.3;
        const goodZone = windowPx * 0.7;

        if (distance <= windowPx) {
            let points, tier;
            if (distance <= perfectZone) {
                points = SCORING.perfect + (GameState.combo * SCORING.perfectBonus);
                tier = 'perfect';
            } else if (distance <= goodZone) {
                points = SCORING.good;
                tier = 'good';
            } else {
                points = SCORING.accepted;
                tier = 'accepted';
            }

            if (data.isFragile) points += SCORING.fragileBonus;

            GameState.combo++;
            let mult = 1.0;
            if (GameState.combo >= 8) mult = SCORING.comboMultipliers[2];
            else if (GameState.combo >= 5) mult = SCORING.comboMultipliers[1];
            else if (GameState.combo >= 3) mult = SCORING.comboMultipliers[0];
            points = Math.round(points * mult);

            GameState.score += points;
            GameState.suspicion = Math.max(0, GameState.suspicion - SUSPICION_DRAIN_ON_HIT);

            this.successJuice(sprite, tier, points);
            this.events.emit('updateScore');
            this.events.emit('updateSuspicion');
            this.events.emit('updateCombo');
            this.events.emit('floatScore', { x: 170, y: 400, value: points });
        } else {
            this.triggerAlarm(sprite);
        }

        this.removeItem(sprite, data);
    }
};
