// Permission Denied - Challenge Renderers

// Helper: create dialog header (bg + title bar + title text)
function dialogHeader(scene, c, w, h, cy, title) {
    const bg = scene.add.rectangle(180, cy, w, h, COLORS.WINDOW_BG).setStrokeStyle(1, COLORS.BUTTON_SHADOW);
    const tb = scene.add.rectangle(180, cy - h / 2 + 12, w, 24, COLORS.TITLE_BAR);
    const ttl = scene.add.text(40, cy - h / 2 + 4, title, { fontSize: '11px', fontFamily: 'Courier New, monospace', color: '#FFF' });
    c.add([bg, tb, ttl]);
}

function initChallengeRenderers() {

    GameScene.prototype.renderMovingButton = function(params) {
        const c = this.challengeContainer;
        dialogHeader(this, c, 300, 200, 300, 'Permission Request');
        const bodyTxt = this.add.text(180, 260, `Allow Permission Denied\nto access your ${params.noun}?`, {
            fontSize: '12px', fontFamily: 'Courier New, monospace', color: COLORS.TEXT_PRIMARY, align: 'center', lineSpacing: 4
        }).setOrigin(0.5);
        c.add(bodyTxt);
        const decBtn = createBevelButton(this, 120, 360, 100, 36, 'Decline', COLORS.DANGER_RED);
        decBtn.label.setColor('#FFF');
        decBtn.on('pointerdown', () => { this.playTone(150, 'square', 200); this.triggerDeath(); });
        c.add(decBtn);
        const btnW = Math.max(params.btnSize, DIFFICULTY.MIN_HIT_ZONE);
        const acceptBtn = createBevelButton(this, params.waypoints[0].x, params.waypoints[0].y, btnW, 36, 'Accept', COLORS.ACCEPT_GREEN);
        acceptBtn.label.setColor('#FFF');
        acceptBtn.on('pointerdown', () => this.onChallengeComplete(acceptBtn.x, acceptBtn.y));
        c.add(acceptBtn);
        const tweenTargets = params.waypoints.slice(1).map(w => ({ x: w.x, y: w.y }));
        tweenTargets.push({ x: params.waypoints[0].x, y: params.waypoints[0].y });
        const timeline = this.tweens.createTimeline();
        const dur = (300 / params.speed) * 1000;
        tweenTargets.forEach(wp => { timeline.add({ targets: acceptBtn, x: wp.x, y: wp.y, duration: dur, ease: 'Sine.easeInOut' }); });
        timeline.loop = -1; timeline.play();
    };

    GameScene.prototype.renderPopupChain = function(params) {
        this.popupDepth = params.depth;
        this.popupMessages = params.messages;
        this.spawnPopup(0, 180, 300);
    };

    GameScene.prototype.spawnPopup = function(index, baseX, baseY) {
        const c = this.challengeContainer;
        const x = baseX + index * 15 - 20, y = baseY + index * 20 - 30;
        const w = 260, h = 160;
        const popup = this.add.container(x, y).setAlpha(0);
        const bg = this.add.rectangle(0, 0, w, h, COLORS.WINDOW_BG).setStrokeStyle(2, COLORS.BUTTON_SHADOW);
        const tb = this.add.rectangle(0, -h / 2 + 12, w, 24, COLORS.TITLE_BAR);
        const title = this.add.text(-w / 2 + 8, -h / 2 + 4, 'System Message', { fontSize: '10px', fontFamily: 'Courier New, monospace', color: '#FFF' });
        const warn = this.add.graphics();
        warn.fillStyle(0xFFCC00); warn.fillTriangle(-20, 10, 0, -10, 20, 10);
        warn.fillStyle(0x333333); warn.fillRect(-2, -4, 4, 8); warn.fillRect(-2, 7, 4, 3);
        warn.setPosition(0, -15);
        const msg = this.add.text(0, 20, this.popupMessages[index] || 'Error: Error', {
            fontSize: '11px', fontFamily: 'Courier New, monospace', color: COLORS.TEXT_PRIMARY, align: 'center', wordWrap: { width: w - 20 }
        }).setOrigin(0.5);
        popup.add([bg, tb, title, warn, msg]);
        if (index < this.popupDepth) {
            const xBtn = this.add.rectangle(w / 2 - 14, -h / 2 + 12, 18, 18, COLORS.DANGER_RED).setInteractive({ useHandCursor: true });
            const xTxt = this.add.text(w / 2 - 14, -h / 2 + 12, 'X', { fontSize: '11px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold' }).setOrigin(0.5);
            popup.add([xBtn, xTxt]);
            xBtn.on('pointerdown', () => { this.playTone(440, 'triangle', 120); this.spawnPopup(index + 1, baseX, baseY); popup.destroy(); });
        } else {
            const okBtn = createBevelButton(this, 0, h / 2 - 30, 100, 32, 'OK', COLORS.ACCEPT_GREEN);
            okBtn.label.setColor('#FFF');
            okBtn.on('pointerdown', () => this.onChallengeComplete(x, y));
            popup.add(okBtn);
        }
        c.add(popup);
        this.tweens.add({ targets: popup, alpha: 1, scaleX: { from: 0.95, to: 1 }, scaleY: { from: 0.95, to: 1 }, duration: 150 });
        this.playTone(440, 'triangle', 120);
    };

    GameScene.prototype.renderHoldConfirm = function(params) {
        const c = this.challengeContainer;
        dialogHeader(this, c, 280, 200, 300, 'Confirmation Required');
        const txt = this.add.text(180, 260, 'Are you absolutely sure?\nHold to confirm.', {
            fontSize: '12px', fontFamily: 'Courier New, monospace', color: COLORS.TEXT_PRIMARY, align: 'center', lineSpacing: 4
        }).setOrigin(0.5);
        const barBg = this.add.rectangle(180, 340, 200, 16, 0x999999);
        const barFill = this.add.rectangle(80, 332, 0, 16, COLORS.ACCEPT_GREEN).setOrigin(0, 0);
        const pctText = this.add.text(180, 340, '0%', { fontSize: '10px', fontFamily: 'Arial', color: '#FFF' }).setOrigin(0.5);
        const holdBtn = createBevelButton(this, 180, 380, 160, 40, "Yes, I'm Sure", COLORS.ACCEPT_GREEN);
        holdBtn.label.setColor('#FFF').setFontSize('12px');
        c.add([txt, barBg, barFill, pctText, holdBtn]);
        let holdProgress = 0, holding = false, holdInterval = null;
        const tickMs = 50;
        holdBtn.on('pointerdown', () => {
            holding = true;
            holdInterval = setInterval(() => {
                if (!holding || this.gameOver) { clearInterval(holdInterval); return; }
                holdProgress += tickMs;
                const pct = Math.min(holdProgress / params.holdDuration, 1);
                barFill.setDisplaySize(200 * pct, 16);
                pctText.setText(Math.floor(pct * 100) + '%');
                if (Math.floor(pct * 10) > Math.floor((holdProgress - tickMs) / params.holdDuration * 10)) {
                    this.playTone(660, 'sine', 40);
                    this.tweens.add({ targets: barFill, scaleY: 1.08, duration: 40, yoyo: true });
                }
                if (holdProgress >= params.holdDuration) {
                    clearInterval(holdInterval); pctText.setText('Verifying...');
                    this.cameras.main.shake(80, 0.003);
                    this.time.delayedCall(300, () => this.onChallengeComplete(180, 340));
                }
            }, tickMs);
        });
        const release = () => {
            if (holding && holdProgress < params.holdDuration) {
                holding = false; if (holdInterval) clearInterval(holdInterval);
                holdProgress = 0; barFill.setDisplaySize(0, 16); pctText.setText('0%');
                this.timerRemaining -= 500; this.cameras.main.shake(60, 0.003);
            }
        };
        holdBtn.on('pointerup', release); holdBtn.on('pointerout', release);
        if (params.showCancel) {
            this.time.delayedCall(params.holdDuration / 2, () => {
                if (this.gameOver) return;
                const cancelBtn = createBevelButton(this, 180, 430, 120, 32, 'Cancel', COLORS.DANGER_RED);
                cancelBtn.label.setColor('#FFF').setFontSize('11px'); c.add(cancelBtn);
                this.tweens.add({ targets: cancelBtn, scaleX: 1.05, scaleY: 1.05, duration: 400, yoyo: true, repeat: -1 });
                cancelBtn.on('pointerdown', () => this.triggerDeath());
            });
        }
    };

    GameScene.prototype.renderTosScroll = function(params) {
        const c = this.challengeContainer;
        dialogHeader(this, c, 300, 380, 310, 'Terms of Service');
        const tosText = this.add.text(40, 160, params.lines.join('\n'), {
            fontSize: '10px', fontFamily: 'Courier New, monospace', color: COLORS.TEXT_PRIMARY, wordWrap: { width: 280 }, lineSpacing: 4
        });
        c.add(tosText);
        const maskShape = this.make.graphics(); maskShape.fillRect(30, 145, 300, 310);
        tosText.setMask(maskShape.createGeometryMask());
        let scrollY = 160, jumped = false;
        const maxScroll = -(tosText.getBounds().height - 300);
        this.input.on('pointermove', (pointer) => {
            if (!pointer.isDown || this.gameOver) return;
            scrollY += pointer.velocity.y * 0.02;
            scrollY = Phaser.Math.Clamp(scrollY, maxScroll + 160, 160);
            tosText.setY(scrollY);
            if (params.jumpBack && !jumped && scrollY < maxScroll * 0.5 + 160) {
                jumped = true; scrollY += 150; tosText.setY(scrollY);
                const notice = this.add.text(180, 300, 'Our terms have been updated!', {
                    fontSize: '11px', fontFamily: 'Courier New, monospace', color: COLORS.DANGER_RED_HEX, fontStyle: 'bold'
                }).setOrigin(0.5); c.add(notice);
                this.tweens.add({ targets: notice, alpha: 0, duration: 1500, onComplete: () => notice.destroy() });
            }
        });
        const acceptBtn = createBevelButton(this, 180, 480, 140, 36, 'I Accept', COLORS.ACCEPT_GREEN);
        acceptBtn.label.setColor('#FFF'); acceptBtn.setAlpha(0.3); acceptBtn.disableInteractive(); c.add(acceptBtn);
        this.tosCheckEvent = this.time.addEvent({ delay: 100, loop: true, callback: () => {
            const pct = (160 - scrollY) / (160 - (maxScroll + 160));
            if (pct >= 0.9) {
                acceptBtn.setAlpha(1);
                acceptBtn.setInteractive(new Phaser.Geom.Rectangle(-70, -18, 140, 36), Phaser.Geom.Rectangle.Contains);
                acceptBtn.on('pointerdown', () => this.onChallengeComplete(180, 480));
            }
        }});
    };

    GameScene.prototype.renderCaptcha = function(params) {
        const c = this.challengeContainer;
        dialogHeader(this, c, 300, 320, 300, 'CAPTCHA Verification');
        const prompt = this.add.text(180, 185, `Select all tiles containing\n${params.category}`, {
            fontSize: '11px', fontFamily: 'Courier New, monospace', color: COLORS.TEXT_PRIMARY, align: 'center'
        }).setOrigin(0.5); c.add(prompt);
        const gs = params.gridSize, tileSize = gs === 3 ? 70 : 55, gap = 4;
        const gridW = gs * tileSize + (gs - 1) * gap;
        const startX = 180 - gridW / 2 + tileSize / 2, startY = 220;
        const selected = new Set(), correctSet = new Set(params.correctIndices);
        for (let r = 0; r < gs; r++) for (let col = 0; col < gs; col++) {
            const idx = r * gs + col, tx = startX + col * (tileSize + gap), ty = startY + r * (tileSize + gap);
            const tile = this.add.rectangle(tx, ty, tileSize, tileSize, 0xDDDDDD).setStrokeStyle(2, 0xBBBBBB).setInteractive({ useHandCursor: true });
            const isCorrect = correctSet.has(idx);
            const icon = this.add.text(tx, ty, isCorrect ? getCaptchaIcon(params.category) : getRandomIcon(), { fontSize: (tileSize * 0.5) + 'px' }).setOrigin(0.5);
            tile.on('pointerdown', () => {
                this.lastInputTime = Date.now();
                if (isCorrect) {
                    selected.add(idx); tile.setFillStyle(COLORS.ACCEPT_GREEN, 0.3); tile.setStrokeStyle(2, COLORS.ACCEPT_GREEN);
                    this.playTone(880, 'sine', 80); this.tweens.add({ targets: tile, scaleX: 1.1, scaleY: 1.1, duration: 80, yoyo: true });
                } else { tile.setFillStyle(0xDD2222, 0.3); this.playTone(150, 'square', 200); this.triggerDeath(); }
            });
            c.add([tile, icon]);
        }
        const verifyY = startY + gs * (tileSize + gap) + 20;
        const verifyBtn = createBevelButton(this, 180, verifyY, 140, 36, 'Verify', COLORS.TITLE_BAR);
        verifyBtn.label.setColor('#FFF');
        verifyBtn.on('pointerdown', () => { selected.size === correctSet.size ? this.onChallengeComplete(180, verifyY) : this.triggerDeath(); });
        c.add(verifyBtn);
    };

    GameScene.prototype.renderLoadingBar = function(params) {
        const c = this.challengeContainer;
        dialogHeader(this, c, 300, 140, 300, 'System Update');
        const label = this.add.text(180, 280, 'Preparing your experience...', { fontSize: '11px', fontFamily: 'Courier New, monospace', color: COLORS.TEXT_PRIMARY }).setOrigin(0.5);
        const barBg = this.add.rectangle(180, 310, 240, 18, 0x333333);
        const barFill = this.add.rectangle(60, 301, 0, 18, COLORS.TIMER_GREEN).setOrigin(0, 0);
        const pct = this.add.text(180, 310, '0%', { fontSize: '10px', fontFamily: 'Arial', color: '#FFF' }).setOrigin(0.5);
        c.add([label, barBg, barFill, pct]);
        let progress = 0, interrupted = false;
        const speed = params.interrupt ? 240 / 4000 : 240 / 5000;
        const ev = this.time.addEvent({ delay: 50, loop: true, callback: () => {
            if (this.gameOver) return;
            progress += speed * 50;
            if (params.interrupt && !interrupted && progress >= 192) { interrupted = true; progress = 0; label.setText('Update required. Starting over.'); this.cameras.main.shake(80, 0.003); }
            progress = Math.min(progress, 240); barFill.setDisplaySize(progress, 18);
            pct.setText(Math.floor(progress / 240 * 100) + '%');
            if (progress >= 240) { ev.remove(); this.onChallengeComplete(180, 310); }
        }});
        if (params.showCancelBtn) {
            const cancelBtn = createBevelButton(this, 180, 350, 120, 30, 'Cancel Update', COLORS.DANGER_RED);
            cancelBtn.label.setColor('#FFF').setFontSize('10px');
            cancelBtn.on('pointerdown', () => this.triggerDeath()); c.add(cancelBtn);
        }
    };

    GameScene.prototype.renderSlider = function(params) {
        const c = this.challengeContainer;
        dialogHeader(this, c, 300, 200, 300, 'Age Verification');
        const label = this.add.text(180, 250, 'Please confirm your age:', { fontSize: '12px', fontFamily: 'Courier New, monospace', color: COLORS.TEXT_PRIMARY }).setOrigin(0.5);
        c.add(label);
        const trackX = 60, trackY = 310, trackW = 240;
        const track = this.add.rectangle(180, trackY, trackW, 8, 0xBBBBBB);
        const zMin = params.targetMin / params.sliderMax, zMax = params.targetMax / params.sliderMax;
        const zoneX = trackX + zMin * trackW, zoneW = (zMax - zMin) * trackW;
        const zone = this.add.rectangle(zoneX + zoneW / 2, trackY, zoneW, 12, COLORS.ACCEPT_GREEN, 0.3);
        const handle = this.add.circle(trackX, trackY, 14, COLORS.TITLE_BAR).setInteractive({ draggable: true, useHandCursor: true });
        const valText = this.add.text(180, 340, '0', { fontSize: '14px', fontFamily: 'Courier New, monospace', color: COLORS.TEXT_PRIMARY }).setOrigin(0.5);
        c.add([track, zone, handle, valText]);
        let currentMin = params.targetMin, shrunk = false;
        handle.on('drag', (pointer, dragX) => {
            const nx = Phaser.Math.Clamp(dragX, trackX, trackX + trackW);
            handle.setX(nx);
            const val = Math.round(((nx - trackX) / trackW) * params.sliderMax);
            valText.setText(val.toString());
            if (params.shrink && !shrunk && val > 50) {
                shrunk = true; currentMin = params.shrinkMin;
                const nzMin = currentMin / params.sliderMax, nzX = trackX + nzMin * trackW, nzW = (zMax - nzMin) * trackW;
                zone.setPosition(nzX + nzW / 2, trackY); zone.setDisplaySize(nzW, 12);
                const notice = this.add.text(180, 370, 'Must also be >= 21', { fontSize: '11px', fontFamily: 'Courier New, monospace', color: COLORS.DANGER_RED_HEX, fontStyle: 'bold' }).setOrigin(0.5);
                c.add(notice);
            }
        });
        const confirmBtn = createBevelButton(this, 180, 380, 120, 32, 'Confirm', COLORS.ACCEPT_GREEN);
        confirmBtn.label.setColor('#FFF');
        confirmBtn.on('pointerdown', () => {
            const val = Math.round(((handle.x - trackX) / trackW) * params.sliderMax);
            val >= currentMin && val <= params.targetMax ? this.onChallengeComplete(180, 380) : this.triggerDeath();
        });
        c.add(confirmBtn);
    };
}

function getCaptchaIcon(category) {
    const icons = { 'fire hydrants': '🔴', 'crosswalks': '🚶', 'traffic lights': '🔵', 'bicycles': '🚲', 'boats': '⛵', 'ambiguity': '❓', 'regret': '😔', 'the concept of free time': '⏰' };
    return icons[category] || '✓';
}
function getRandomIcon() {
    const pool = ['🌲', '🚗', '🏠', '☁️', '🐕', '📱', '🎵', '⭐'];
    return pool[Math.floor(Math.random() * pool.length)];
}

initChallengeRenderers();
