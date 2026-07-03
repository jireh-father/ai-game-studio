// =============================================================================
// SMOOSH! - game.js
// GameScene: stage lifecycle, tap resolution (crit/splash/fever), kills,
// gold, combo, boss handling. Monsters live in a pool of Monster instances.
// =============================================================================

// Feel facade: single funnel for audio/haptic feedback from gameplay.
// v2.2.1: monsters have VOICES - dark-cute grunts sized to the jelly.
const Feel = {
    kill(combo, r) { Sfx.pop(combo); Sfx.monsterDeath(r || 40); Haptic.tick(0.5); },
    hit(r) { Sfx.hit(); Sfx.monsterHurt(r || 40); Haptic.tick(0.25); },
    crit() { Sfx.crit(); Haptic.medium(); },
    shieldBlock() { Sfx.clank(); Haptic.tick(0.8); },
    splitPop() { Sfx.splitPop(); },
    jackpot() { Sfx.jackpot(); Haptic.medium(); },
    bossRoar() { Sfx.bossRoar(); Haptic.heavy(); },
    bossBoom() { Sfx.bossBoom(); Sfx.bossRoar(); Haptic.heavy(); },
    feverStart() { Sfx.feverStart(); Haptic.heavy(); },
    feverEnd() { Sfx.feverEnd(); },
    stageClear() { Sfx.stageClear(); },
    coin() { Sfx.coin(); }
};

class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    create() {
        this.pool = [];
        this.active = [];
        this.combo = 0;
        this.comboLeft = 0;
        this.feverLeft = 0;
        this.stageGoldSinceSettle = 0;
        this.transitioning = false;
        this._lastPointer = null;

        // subtle field boundary
        const F = CONFIG.FIELD;
        this.add.rectangle(F.x + F.w / 2, F.y + F.h / 2, F.w, F.h, 0x1a1530)
            .setStrokeStyle(2, 0x2a2244).setDepth(0);

        this.buildHud();
        buildUpgradeBar(this);
        buildFeverGauge(this);
        this.wireInput();

        // v2.0: the nest we defend + our pet squad
        this.nest = new Nest(this);
        this.fieldPets = new FieldPets(this);

        this.startStage(SaveManager.state.stage);
    }

    // -------------------------------------------------------------------------
    // HUD (minimal core; polished/extended in Task 9)
    // -------------------------------------------------------------------------
    buildHud() {
        // stage pill (center)
        this.add.nineslice(CONFIG.WIDTH / 2, 60, 'pill-tex', 0, 240, 62, 18, 18, 16, 16)
            .setTint(0x201a33).setDepth(10);
        this.stageText = this.add.text(CONFIG.WIDTH / 2, 60,
            'S.' + SaveManager.state.stage + ' · Lv.' + SaveManager.state.level, {
            fontFamily: 'Arial, sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#e8e6f5'
        }).setOrigin(0.5).setDepth(11);

        // gold chip (right) - initialized FROM STATE, never a literal
        this.add.nineslice(CONFIG.WIDTH - 120, 60, 'pill-tex', 0, 190, 56, 18, 18, 16, 16)
            .setTint(0x201a33).setDepth(10);
        this.add.image(CONFIG.WIDTH - 186, 60, 'coin-tex').setDepth(11).setDisplaySize(30, 30);
        this.goldText = this.add.text(CONFIG.WIDTH - 162, 60, Balance.fmt(SaveManager.state.gold), {
            fontFamily: 'Arial, sans-serif', fontSize: '28px', fontStyle: 'bold', color: '#ffd54a'
        }).setOrigin(0, 0.5).setDepth(11);

        // --- live stats readout: attack, crit, splash, fever rate, gold gain ---
        this.add.nineslice(CONFIG.WIDTH / 2, 110, 'pill-tex', 0, CONFIG.WIDTH - 48, 44, 16, 16, 14, 14)
            .setTint(0x1c1631).setAlpha(0.9).setDepth(10);
        this._statEls = [];
        const statDefs = [
            { icon: 'up-tap',    color: 0x5aa9ff, get: () => Balance.fmt(Balance.effective(SaveManager.state).tapDmg) },
            { icon: 'up-crit',   color: 0xffe066, get: () => Math.round(Balance.effective(SaveManager.state).crit * 100) + '%' },
            { icon: 'up-splash', color: 0xff9a5a, get: (u) => Balance.splashRadius(u.splash) + '' },
            { icon: 'up-fever',  color: 0xff5ec4, get: (u) => '×' + Balance.feverMult(u.fever).toFixed(1) },
            { icon: 'up-gold',   color: 0xffd54a, get: () => '×' + Balance.effective(SaveManager.state).goldMult.toFixed(1) },
            { icon: 'gem-tex',   color: 0xffffff, get: () => Balance.fmt(SaveManager.state.gems) }
        ];
        const slotW = (CONFIG.WIDTH - 64) / statDefs.length;
        statDefs.forEach((sd, i) => {
            const x = 32 + i * slotW + 14;
            this.add.image(x, 110, sd.icon).setDepth(11)
                .setTint(sd.color).setDisplaySize(24, 24);
            const val = this.add.text(x + 18, 110, '', {
                fontFamily: 'Arial, sans-serif', fontSize: '21px', fontStyle: 'bold',
                color: '#e8e6f5'
            }).setOrigin(0, 0.5).setDepth(11);
            this._statEls.push({ val, get: sd.get });
        });
        this.refreshStats();
        this.events.on('goldChanged', () => this.refreshStats());

        this.comboText = this.add.text(CONFIG.WIDTH / 2, 148, '', {
            fontFamily: 'Arial, sans-serif', fontSize: '28px', fontStyle: 'bold',
            color: '#ff5ec4', stroke: '#141020', strokeThickness: 5
        }).setOrigin(0.5).setDepth(10);

        // round back button (left)
        this.add.nineslice(56, 60, 'pill-tex', 0, 64, 56, 18, 18, 16, 16)
            .setTint(0x201a33).setDepth(10);
        const back = this.add.text(56, 58, '‹', {
            fontFamily: 'Arial, sans-serif', fontSize: '44px', fontStyle: 'bold', color: '#8d86a8'
        }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });
        back.on('pointerdown', () => SmooshGame.goto('MenuScene'));

        // v2.3: in-game SHOP - pauses the fight, opens the shop as an overlay
        this.add.nineslice(136, 60, 'pill-tex', 0, 80, 56, 18, 18, 16, 16)
            .setTint(0x2fa86b).setDepth(10);
        const shopBtn = this.add.text(136, 60, '🛒', {
            fontFamily: 'Arial, sans-serif', fontSize: '28px'
        }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });
        shopBtn.on('pointerdown', () => {
            Feel.coin();
            this.scene.pause();
            this.scene.launch('ShopScene', { from: 'game' });
        });

        // returning from the in-game shop: refresh everything the shop touches
        this.events.on('resume', () => {
            this.refreshGold();               // gold/gems/stats + upgrade cards
            if (this.fieldPets) this.fieldPets.rebuild();  // new/leveled pets
            if (this.nest) this.nest.redraw();             // nest level changes
        });
    }

    refreshGold() {
        this.goldText.setText(Balance.fmt(SaveManager.state.gold));
        this.events.emit('goldChanged');
    }

    refreshStats() {
        const u = SaveManager.state.upgrades;
        for (const el of this._statEls) el.val.setText(el.get(u));
    }

    setCombo(n) {
        if (n < 2) { this.comboText.setText('').clearTint(); return; }
        this.comboText.setText('COMBO ×' + n);
        this.comboText.setScale(1.25 + Math.min(0.5, n * 0.01));
        // high combos go rainbow
        if (n >= 25) {
            const c = Phaser.Display.Color.HSVToRGB((n * 0.07) % 1, 0.6, 1);
            this.comboText.setTint(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
        } else {
            this.comboText.clearTint();
        }
        this.tweens.add({ targets: this.comboText, scale: 1, duration: 120, ease: 'Quad.easeOut' });
    }

    // -------------------------------------------------------------------------
    // Stage lifecycle
    // -------------------------------------------------------------------------
    startStage(n) {
        this.stageNum = n;
        this.isBossStage = n % CONFIG.BOSS.every === 0;
        this.stageText.setText('S.' + n + ' · Lv.' + SaveManager.state.level);
        this.transitioning = false;
        if (this.nest) this.nest.repair(); // fresh nest every stage

        const wave = Spawner.composeWave(n, Math.random);
        const F = CONFIG.FIELD;
        for (const entry of wave) {
            const def = SPECIES.find(s => s.id === entry.speciesId);
            const m = this.acquireMonster();
            const isBoss = !!entry.boss || def.kind === 'boss';
            const x = isBoss
                ? F.x + F.w / 2
                : F.x + def.radius + Math.random() * (F.w - def.radius * 2);
            const y = isBoss
                ? F.y + F.h / 2
                : F.y + def.radius + Math.random() * (F.h - def.radius * 2);
            m.spawn(def, n, x, y, { boss: entry.boss });
            this.active.push(m);
        }
        this.onWaveSpawned(); // hook (boss HP bar etc. in Task 7)
    }

    onWaveSpawned() {
        // Boss HP bar + name + floating crown
        if (this.bossBar) { this.bossBar.destroy(); this.bossBar = null; }
        if (this.bossName) { this.bossName.destroy(); this.bossName = null; }
        if (this.bossCrown) { this.bossCrown.destroy(); this.bossCrown = null; }
        this.boss = this.active.find(m => m.alive && m.isBoss) || null;
        if (this.boss) {
            this.bossBar = this.add.graphics().setDepth(11);
            this.bossName = this.add.text(CONFIG.WIDTH / 2, 181,
                'GIANT ' + this.boss.def.name.toUpperCase(), {
                fontFamily: 'Arial, sans-serif', fontSize: '17px', fontStyle: 'bold',
                color: '#ffffff', stroke: '#141020', strokeThickness: 4
            }).setOrigin(0.5).setDepth(12);
            // every boss wears the crown - it IS the promoted king of its kind
            this.bossCrown = this.add.image(this.boss.x, this.boss.y, 'crown-tex')
                .setDepth(5).setScale(1.4);
            Feel.bossRoar(); // the giant announces itself
            this.drawBossBar();
        }
    }

    drawBossBar() {
        if (!this.bossBar || !this.boss) return;
        const w = 560, h = 26;
        const x = (CONFIG.WIDTH - w) / 2, y = 168;
        const frac = Math.max(0, this.boss.hp / this.boss.maxHp);
        this.bossBar.clear();
        this.bossBar.fillStyle(0x0a0714, 0.8).fillRoundedRect(x - 3, y - 3, w + 6, h + 6, 15);
        this.bossBar.fillStyle(0x2a2244, 1).fillRoundedRect(x, y, w, h, 12);
        if (frac > 0) {
            const fw = Math.max(10, (w - 6) * frac);
            this.bossBar.fillStyle(0x8a4fd0, 1).fillRoundedRect(x + 3, y + 3, fw, h - 6, 9);
            this.bossBar.fillStyle(0xc990ff, 0.9)
                .fillRoundedRect(x + 3, y + 3, fw, (h - 6) * 0.45, { tl: 9, tr: 9, bl: 0, br: 0 });
        }
    }

    acquireMonster() {
        for (const m of this.pool) {
            if (!m.alive && !m.sprite.visible) return m;
        }
        const m = new Monster(this);
        this.pool.push(m);
        return m;
    }

    aliveBlocking() {
        // jackpot jellies never block stage clear
        return this.active.filter(m => m.alive && m.def.kind !== 'jackpot');
    }

    checkStageClear() {
        if (this.transitioning) return;
        if (this.aliveBlocking().length > 0) return;
        this.onStageClear();
    }

    onStageClear() {
        this.transitioning = true;
        Feel.stageClear();

        SaveManager.state.stage = this.stageNum + 1;
        SaveManager.state.bestStage = Math.max(SaveManager.state.bestStage, SaveManager.state.stage);

        // clear XP + milestone gems
        this.gainXp(this.stageNum);
        if (this.stageNum % CONFIG.GEMS.stageMilestoneEvery === 0) {
            SaveManager.state.gems += CONFIG.GEMS.stageMilestoneGems;
            if (typeof Effects !== 'undefined') {
                Effects.damageText(this, CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.5,
                    '+' + CONFIG.GEMS.stageMilestoneGems + ' 💎 MILESTONE!', '#7fd2ff');
            }
            this.events.emit('goldChanged');
        }
        SaveManager.persist();

        const banner = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.42, 'STAGE CLEAR!', {
            fontFamily: 'Arial, sans-serif', fontSize: '72px', fontStyle: 'bold',
            color: '#7dffb2', stroke: '#141020', strokeThickness: 10
        }).setOrigin(0.5).setDepth(20).setScale(0.3);
        this.tweens.add({ targets: banner, scale: 1, duration: 240, ease: 'Back.easeOut' });
        this.tweens.add({
            targets: banner, alpha: 0, delay: 650, duration: 250,
            onComplete: () => banner.destroy()
        });

        this.time.delayedCall(900, () => {
            this.active = this.active.filter(m => m.alive);
            this.afterStageClear(); // Task 9: settlement every 5th; default = next stage
        });
    }

    afterStageClear() {
        // Interstitial pacing is ads.js's decision - report every clear.
        if (typeof AdsManager !== 'undefined' && AdsManager.onStageClear) {
            AdsManager.onStageClear();
        }

        // Settlement every 5th stage (before the next wave)
        if (this.stageNum % 5 === 0) {
            const gold = this.stageGoldSinceSettle;
            this.stageGoldSinceSettle = 0;
            showSettlement(this, {
                from: this.stageNum - 4,
                to: this.stageNum,
                gold,
                onContinue: () => this.startStage(SaveManager.state.stage)
            });
            return;
        }
        this.startStage(SaveManager.state.stage);
    }

    // -------------------------------------------------------------------------
    // Input & damage
    // -------------------------------------------------------------------------
    wireInput() {
        this.input.on('pointerdown', (pointer) => {
            this._lastPointer = { x: pointer.x, y: pointer.y };
            if (this.transitioning) return;

            // topmost = latest spawned first; phased-out ghosts are untappable
            for (let i = this.active.length - 1; i >= 0; i--) {
                const m = this.active[i];
                if (m.alive && m.tappable !== false && m.contains(pointer.x, pointer.y, 24)) {
                    this.applyTap(m, pointer.x, pointer.y);
                    return;
                }
            }
        });
        this.input.on('pointermove', (pointer) => {
            this._lastPointer = { x: pointer.x, y: pointer.y };
        });
    }

    applyTap(m, x, y) {
        const up = SaveManager.state.upgrades;
        const eff = Balance.effective(SaveManager.state);
        const isCrit = Math.random() < eff.crit;
        let dmg = eff.tapDmg * (isCrit ? 5 : 1);
        if (this.feverLeft > 0) dmg *= CONFIG.FEVER.damageMult;

        if (isCrit) {
            Feel.crit();
            if (typeof Effects !== 'undefined') Effects.damageText(this, x, y - 40, 'CRIT!', '#fff06a');
        }

        this.damageMonster(m, dmg, isCrit, x, y);

        // splash: upgrade radius + universal fever splash
        let radius = Balance.splashRadius(up.splash);
        if (this.feverLeft > 0) radius = Math.max(radius, CONFIG.FEVER.splashRadius);
        if (radius > 0) {
            for (let i = this.active.length - 1; i >= 0; i--) {
                const other = this.active[i];
                if (other === m || !other.alive) continue;
                const dx = other.x - x, dy = other.y - y;
                if (dx * dx + dy * dy <= radius * radius) {
                    this.damageMonster(other, dmg, isCrit, other.x, other.y);
                }
            }
        }
    }

    // Central damage entry. source: undefined = player tap, 'pet:xxx', 'thorns'.
    damageMonster(m, dmg, isCrit, x, y, source) {
        if (!m.alive || m.tappable === false) return;

        // Freezy: the first hit only shatters the ice shell.
        if (m.iceOn) {
            m.iceOn = false;
            m.sprite.clearTint();
            Feel.shieldBlock();
            if (typeof Effects !== 'undefined') {
                Effects.burst(this, m.x, m.y - m.radius * 0.5, 0xbfe8ff, 8);
                Effects.damageText(this, m.x, m.y - m.radius - 8, 'CRACK!', '#bfe8ff');
            }
            return;
        }

        if (!this.shieldAllowsDamage(m, isCrit)) {
            Feel.shieldBlock();
            return;
        }
        // thorns tick silently (no floating text spam for continuous damage)
        if (source !== 'thorns' && typeof Effects !== 'undefined') {
            Effects.damageText(this, m.x, m.y - m.radius - 8,
                (isCrit ? '💥' : '') + Balance.fmt(dmg),
                isCrit ? '#fff06a' : '#e8e6f5', { crit: isCrit });
        }
        const died = m.hit(dmg);
        if (m === this.boss) this.drawBossBar();
        if (died) {
            this.onKill(m, source);
        } else if (source !== 'thorns') {
            if (!source) Feel.hit(m.r); // player taps talk back - sized voice
            if (typeof Effects !== 'undefined' && !source) {
                // hit sparks scale with the monster - boss taps throw big sparks
                const k = m.isBoss ? 1.6 : Math.min(1.2, m.r / 46);
                Effects.burst(this, x, y, m.def.color, m.isBoss ? 7 : 3, 0.5 * k + 0.3);
                if (isCrit) Effects.ring(this, x, y, 0xfff06a, 40 + m.r);
            }
            if (m.quirk === 'blink' && !source) m.blinkAway();
        }
    }

    // Shieldy: immune to casual taps. Crits always pierce; 6 rapid hits
    // within 1.5 s crack the shell for good (mash target).
    shieldAllowsDamage(m, isCrit) {
        if (m.def.kind !== 'shield' || m.shieldBroken) return true;
        if (isCrit) return true;
        const now = this.time.now;
        m.recentHits.push(now);
        m.recentHits = m.recentHits.filter(t => now - t <= 1500);
        if (m.recentHits.length >= 6) {
            m.shieldBroken = true;
            if (typeof Effects !== 'undefined') Effects.burst(this, m.x, m.y - m.radius, 0x8fb8d0);
            return true;
        }
        // blocked: wobble feedback
        this.tweens.add({
            targets: m.sprite, angle: (Math.random() < 0.5 ? -1 : 1) * 12,
            duration: 60, yoyo: true,
            onComplete: () => { if (m.sprite.active) m.sprite.setAngle(0); }
        });
        return false;
    }

    onKill(m, source) {
        // gold - boss reward scales with its HP ramp so hard bosses pay big
        const eff = Balance.effective(SaveManager.state);
        const goldBase = Balance.goldPerMob(this.stageNum);
        let mult = m.isBoss
            ? CONFIG.BOSS.goldMult * (Balance.bossHpMult(this.stageNum) / CONFIG.BOSS.hpMult)
            : m.def.goldMult;
        if (source === 'pet:leaf') mult *= 1.5; // leaf pets' golden touch
        const gold = Math.max(1, Math.round(goldBase * mult * eff.goldMult));
        SaveManager.state.totalKills++;
        SaveManager.addGold(gold);
        this.stageGoldSinceSettle += gold;
        this.refreshGold();

        // XP: every kill feeds the player level
        this.gainXp(1);

        // combo is FINGER skill - only player taps chain it
        if (!source) {
            this.combo++;
            this.comboLeft = CONFIG.COMBO.windowMs / 1000;
            this.setCombo(this.combo);
            Feel.kill(this.combo, m.r);
        } else {
            Sfx.monsterDeath(m.r); // pets' victims still cry out
        }
        Feel.coin();

        // combo milestones: the screen celebrates with you
        if (CONFIG.COMBO.milestones.indexOf(this.combo) !== -1 &&
            typeof Effects !== 'undefined') {
            Effects.screenFlash(this, 0xff5ec4, 0.18, 300);
            Effects.ring(this, CONFIG.WIDTH / 2, 148, 0xff5ec4, 220);
            Effects.confetti(this, CONFIG.WIDTH / 2, 200);
            Sfx.crit();
        }

        // fever gauge
        this.addFeverCharge(1);

        // death FX - scaled to the jelly's size
        if (typeof Effects !== 'undefined') {
            Effects.killFx(this, m, this.feverLeft > 0);
            Effects.damageText(this, m.x, m.y, '+' + Balance.fmt(gold), '#ffd54a');
        }

        // v2.3: random item drops - pick up = instant use
        if (!m.isBoss && Math.random() < CONFIG.DROPS.chance) this.spawnItemDrop(m.x, m.y);

        this.onSpecialDeath(m); // splitter/jackpot/boss consequences
        m.burst();
        this.checkStageClear();
    }

    _rollDropType() {
        const total = CONFIG.DROPS.weights.reduce((a, w) => a + w[1], 0);
        let roll = Math.random() * total;
        for (const [type, w] of CONFIG.DROPS.weights) {
            roll -= w;
            if (roll <= 0) return type;
        }
        return 'gold';
    }

    spawnItemDrop(x, y) {
        const type = this._rollDropType();
        const rarity = (type === 'gear' || type === 'necklace')
            ? Gacha._rollRarity(CONFIG.GACHA.rates, Math.random) : null;
        const tex = {
            gold: 'coin-tex', bomb: 'bomb-tex', heal: 'heart-tex',
            fever: 'up-fever', gear: 'up-tap', necklace: 'necklace-tex', gem: 'gem-tex'
        }[type];
        const tint = rarity ? RARITY_COLORS[rarity]
            : { fever: 0xff5ec4, gear: 0x5aa9ff }[type] || 0xffffff;

        const spr = this.add.image(x, y, tex)
            .setDepth(9).setDisplaySize(44, 44);
        if (tint !== 0xffffff) spr.setTint(tint);
        this.tweens.add({ targets: spr, y: y - 14, duration: 320, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
        if (typeof Effects !== 'undefined') Effects.ring(this, x, y, tint, 60);

        this.time.delayedCall(1000, () => {
            if (!spr.active) return;
            this.tweens.add({
                targets: spr, x: CONFIG.WIDTH / 2, y: 110, scale: 0.3, duration: 380,
                ease: 'Quad.easeIn',
                onComplete: () => { spr.destroy(); this.applyDrop(type, rarity, x, y); }
            });
        });
    }

    applyDrop(type, rarity, x, y) {
        const st = SaveManager.state;
        const eff = Balance.effective(st);
        let msg = '', color = '#e8e6f5';

        switch (type) {
            case 'gold': {
                const gold = Math.round(Balance.goldPerMob(this.stageNum) *
                    CONFIG.DROPS.goldMult * eff.goldMult);
                SaveManager.addGold(gold);
                this.refreshGold();
                msg = '+' + Balance.fmt(gold) + ' GOLD!'; color = '#ffd54a';
                if (typeof Effects !== 'undefined') Effects.coinPop(this, x, y, 6, { x: CONFIG.WIDTH - 120, y: 60 });
                break;
            }
            case 'bomb': {
                const dmg = eff.tapDmg * CONFIG.DROPS.bombMult;
                if (typeof Effects !== 'undefined') {
                    Effects.screenFlash(this, 0xffffff, 0.4, 350);
                    Effects.ring(this, CONFIG.WIDTH / 2, CONFIG.FIELD.y + CONFIG.FIELD.h / 2, 0xff9a5a, 700);
                }
                Sfx.bossBoom();
                this.cameras.main.shake(200, 0.006);
                for (const mo of this.active.slice()) {
                    if (mo.alive) this.damageMonster(mo, dmg, false, mo.x, mo.y, 'bomb');
                }
                msg = '💣 BOOM!'; color = '#ff9a5a';
                break;
            }
            case 'heal': {
                if (this.nest && !this.nest.broken) {
                    this.nest.hp = Math.min(this.nest.maxHp,
                        this.nest.hp + this.nest.maxHp * CONFIG.DROPS.healPct);
                    this.nest.redraw();
                    if (typeof Effects !== 'undefined') Effects.ring(this, CONFIG.NEST.x, CONFIG.NEST.y, 0xff6b8a, 140);
                }
                msg = '❤ NEST +' + Math.round(CONFIG.DROPS.healPct * 100) + '%'; color = '#ff6b8a';
                Sfx.coin();
                break;
            }
            case 'fever':
                this.addFeverCharge(CONFIG.DROPS.feverCharge);
                msg = '🔥 FEVER +' + CONFIG.DROPS.feverCharge; color = '#ff5ec4';
                Sfx.coin();
                break;
            case 'gem':
                st.gems += 1;
                SaveManager.persist();
                this.events.emit('goldChanged');
                msg = '+1 GEM!'; color = '#7fd2ff';
                Sfx.jackpot();
                break;
            case 'gear': {
                const slot = ['glove', 'ring', 'charm'][Math.floor(Math.random() * 3)];
                const cur = st.items[slot];
                if (!cur || Gacha.rarityRank(rarity) > Gacha.rarityRank(cur.rarity)) {
                    st.items[slot] = { rarity, level: cur ? cur.level : 0 };
                    msg = '⚔ ' + rarity.toUpperCase() + ' ' + slot.toUpperCase() + '!';
                } else {
                    const refund = Math.round(Balance.chestCost(st.bestStage) * 0.3);
                    st.gold += refund;
                    msg = '⚔ dupe → +' + Balance.fmt(refund) + ' gold';
                }
                color = '#' + RARITY_COLORS[rarity].toString(16).padStart(6, '0');
                SaveManager.persist();
                this.refreshGold();
                Sfx.jackpot();
                break;
            }
            case 'necklace': {
                const target = st.pets
                    .filter(p => !p.necklace || Gacha.rarityRank(p.necklace) < Gacha.rarityRank(rarity))
                    .sort((a, b) => b.level - a.level)[0];
                if (target) {
                    target.necklace = rarity;
                    const def = PET_SPECIES.find(p => p.id === target.species);
                    msg = '📿 ' + rarity.toUpperCase() + ' → ' + (def ? def.name : target.species);
                } else {
                    st.shards += 5;
                    msg = '📿 → +5 shards';
                }
                color = '#' + RARITY_COLORS[rarity].toString(16).padStart(6, '0');
                SaveManager.persist();
                if (this.fieldPets) this.fieldPets.rebuild();
                Sfx.jackpot();
                break;
            }
        }

        if (msg && typeof Effects !== 'undefined') {
            Effects.damageText(this, CONFIG.WIDTH / 2, 160, msg, color, { big: true });
        }
    }

    onSpecialDeath(m) {
        const kind = m.def.kind;

        if (m.isBoss) {
            // gems for boss kills (king pays triple)
            const gems = m.def.id === 'king' ? CONFIG.GEMS.kingKill : CONFIG.GEMS.bossKill;
            SaveManager.state.gems += gems;
            SaveManager.persist();
            this.events.emit('goldChanged'); // refresh gem readout
            if (typeof Effects !== 'undefined') {
                Effects.damageText(this, m.x, m.y - 120, '+' + gems + ' 💎', '#7fd2ff');
            }

            // === THE mega boss death: multi-stage explosion ===
            const bx = m.x, by = m.y;
            const tint = m.def.color || 0xb06fff;
            Feel.bossBoom();
            this.cameras.main.shake(420, 0.011);
            this.tweens.add({
                targets: this.cameras.main, zoom: 1.12,
                duration: CONFIG.BOSS.slowMoMs, yoyo: true, ease: 'Quad.easeOut'
            });

            if (typeof Effects !== 'undefined') {
                // stage 0: white blast + first wave
                Effects.screenFlash(this, 0xffffff, 0.5, 380);
                Effects.flash(this, bx, by, tint, 520);
                Effects.burst(this, bx, by, tint, 34, 2.4);
                Effects.ring(this, bx, by, 0xffffff, 460);
                for (let i = 0; i < 5; i++) {
                    Effects.goo(this, bx + Phaser.Math.Between(-160, 160),
                        by + Phaser.Math.Between(-120, 120), tint, 1.6);
                }
                // stage 1 + 2: echo explosions rolling outward
                this.time.delayedCall(150, () => {
                    Effects.burst(this, bx, by, 0xffffff, 22, 1.8);
                    Effects.ring(this, bx, by, tint, 620);
                    Effects.confetti(this, bx, by);
                    Sfx.bossBoom();
                });
                this.time.delayedCall(320, () => {
                    Effects.ring(this, bx, by, 0xffd54a, 760);
                    Effects.confetti(this, bx - 140, by - 60);
                    Effects.confetti(this, bx + 140, by - 60);
                    Effects.coinPop(this, bx, by, 16, { x: CONFIG.WIDTH - 120, y: 60 });
                });
            }

            // the crown flies off, spinning
            if (this.bossCrown) {
                const crown = this.bossCrown;
                this.bossCrown = null;
                this.tweens.add({
                    targets: crown, y: crown.y - 320, angle: 720, alpha: 0,
                    scale: 0.6, duration: 900, ease: 'Quad.easeOut',
                    onComplete: () => crown.destroy()
                });
            }

            if (this.bossBar) { this.bossBar.destroy(); this.bossBar = null; }
            if (this.bossName) { this.bossName.destroy(); this.bossName = null; }
            this.boss = null;
            return;
        }

        if (kind === 'splitter' && !m.noSplit) {
            Feel.splitPop();
            const childDef = SPECIES.find(s => s.id === m.def.childId);
            for (const dx of [-34, 34]) {
                const c = this.acquireMonster();
                c.spawn(childDef, this.stageNum, m.x + dx, m.y + Phaser.Math.Between(-16, 16));
                c.noSplit = true;
                this.active.push(c);
            }
        }

        if (kind === 'jackpot') {
            Feel.jackpot();
            if (typeof Effects !== 'undefined') {
                Effects.confetti(this, m.x, m.y);
                Effects.coinPop(this, m.x, m.y, 10, { x: CONFIG.WIDTH - 60, y: 60 });
            }
        }

    }

    gainXp(n) {
        const st = SaveManager.state;
        st.xp += n;
        let leveled = false;
        while (st.xp >= Balance.xpNeeded(st.level)) {
            st.xp -= Balance.xpNeeded(st.level);
            st.level++;
            leveled = true;
        }
        if (leveled) {
            SaveManager.persist();
            this.stageText.setText('S.' + this.stageNum + ' · Lv.' + st.level);
            this.events.emit('goldChanged'); // stats readout refresh
            Sfx.jackpot();
            if (typeof Effects !== 'undefined') {
                Effects.screenFlash(this, 0x7dffb2, 0.2, 350);
                Effects.confetti(this, CONFIG.WIDTH / 2, 200);
            }
            const t = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.35,
                'LEVEL UP!  Lv.' + st.level, {
                fontFamily: 'Arial, sans-serif', fontSize: '56px', fontStyle: 'bold',
                color: '#7dffb2', stroke: '#141020', strokeThickness: 9
            }).setOrigin(0.5).setDepth(20).setScale(0.3);
            this.tweens.add({ targets: t, scale: 1, duration: 260, ease: 'Back.easeOut' });
            this.tweens.add({
                targets: t, alpha: 0, delay: 900, duration: 300,
                onComplete: () => t.destroy()
            });
        }
    }

    onNestBroken() {
        if (this.transitioning) return;
        this.transitioning = true;
        Feel.bossBoom();

        // remaining monsters scatter (no gold)
        for (const m of this.active) {
            if (m.alive) { m.alive = false; m.burst(); }
        }
        if (this.bossBar) { this.bossBar.destroy(); this.bossBar = null; }
        if (this.bossName) { this.bossName.destroy(); this.bossName = null; }
        if (this.bossCrown) { this.bossCrown.destroy(); this.bossCrown = null; }
        this.boss = null;

        const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
        const items = [];
        items.push(this.add.rectangle(W / 2, H / 2, W, H, 0x0a0714, 0.8).setDepth(20).setInteractive());
        items.push(this.add.text(W / 2, H * 0.34, '💔 THE NEST BROKE!', {
            fontFamily: 'Arial, sans-serif', fontSize: '56px', fontStyle: 'bold',
            color: '#ff6b6b'
        }).setOrigin(0.5).setDepth(21));
        items.push(this.add.text(W / 2, H * 0.42, 'The babies are safe... but the stage is lost.', {
            fontFamily: 'Arial, sans-serif', fontSize: '24px', color: '#8d86a8'
        }).setOrigin(0.5).setDepth(21));
        const btn = makeUiButton(this, W / 2, H * 0.56, 480, 100, 'RETRY STAGE', 0xff5ec4, () => {
            items.forEach(o => o.destroy());
            btn.destroyAll();
            this.nest.repair();
            this.transitioning = false;
            this.active = [];
            this.startStage(this.stageNum);
        });
    }

    addFeverCharge(n) {
        const st = SaveManager.state;
        if (this.feverLeft > 0) return; // no charging while fever runs
        st.feverGauge = Math.min(CONFIG.FEVER.gaugeMax,
            st.feverGauge + n * Balance.feverMult(st.upgrades.fever));
        this.events.emit('feverChanged');
        if (st.feverGauge >= CONFIG.FEVER.gaugeMax) this.triggerFever();
    }

    triggerFever() {
        if (this.feverLeft > 0) return;
        this.feverLeft = CONFIG.FEVER.durationMs / 1000;
        Feel.feverStart();
        if (typeof Effects !== 'undefined') {
            Effects.screenFlash(this, 0xff5ec4, 0.3, 420);
            Effects.ring(this, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 0xff5ec4, 900);
        }

        const banner = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.3, 'FEVER!!', {
            fontFamily: 'Arial, sans-serif', fontSize: '96px', fontStyle: 'bold',
            color: '#ff5ec4', stroke: '#141020', strokeThickness: 12
        }).setOrigin(0.5).setDepth(20).setScale(0.2);
        this.tweens.add({ targets: banner, scale: 1, duration: 260, ease: 'Back.easeOut' });
        this.tweens.add({
            targets: banner, alpha: 0, delay: 800, duration: 300,
            onComplete: () => banner.destroy()
        });
    }

    // -------------------------------------------------------------------------
    update(time, delta) {
        const dt = delta / 1000;

        for (const m of this.active) {
            if (m.alive) m.update(dt, this._lastPointer);
        }

        // v2.0: nest defense + pet squad
        if (this.nest && !this.transitioning) {
            this.nest.update(dt, this.active.filter(m => m.alive && m.biting));
        }
        if (this.fieldPets) this.fieldPets.update(dt);

        // crown floats above the reigning giant
        if (this.boss && this.boss.alive && this.bossCrown) {
            this.bossCrown.setPosition(
                this.boss.x,
                this.boss.y - this.boss.r - 34 + Math.sin(time * 0.004) * 6);
        }

        if (this.comboLeft > 0) {
            this.comboLeft -= dt;
            if (this.comboLeft <= 0) {
                this.combo = 0;
                this.comboText.setText('');
            }
        }

        this.updateFever(dt); // Task 7
    }

    updateFever(dt) {
        if (this.feverLeft <= 0) return;
        this.feverLeft -= dt;

        // rainbow pulse on the field background
        this._feverHue = ((this._feverHue || 0) + dt * 0.8) % 1;
        const c = Phaser.Display.Color.HSVToRGB(this._feverHue, 0.45, 0.35);
        this.cameras.main.setBackgroundColor(
            Phaser.Display.Color.GetColor(c.r, c.g, c.b));

        if (this.feverLeft <= 0) {
            this.feverLeft = 0;
            SaveManager.state.feverGauge = 0;
            SaveManager.persist();
            this.cameras.main.setBackgroundColor(CONFIG.COLORS.bg);
            this.events.emit('feverChanged');
            Feel.feverEnd();
        }
    }

    onMonsterDespawned(m) {
        this.checkStageClear();
    }

    // =========================================================================
    // v2.4 - monster offense helpers (pets take hits, nest can be shelled)
    // =========================================================================

    // Area strike: damages every pet in the circle; optionally chips the nest.
    monsterStrikeArea(m, x, y, radius, dmg, canHitNest) {
        if (this.fieldPets) {
            for (const a of this.fieldPets.agents) {
                if (a.ko) continue;
                if ((a.sprite.x - x) ** 2 + (a.sprite.y - y) ** 2 <= radius * radius) {
                    this.fieldPets.damageAgent(a, dmg, m.def.color);
                }
            }
        }
        if (canHitNest && this.nest && !this.nest.broken) {
            if ((CONFIG.NEST.x - x) ** 2 + (CONFIG.NEST.y - y) ** 2 <= (radius + 70) ** 2) {
                this.damageNest(3 * (m.isBoss ? 3 : 1));
            }
        }
    }

    // Flat chip damage to the nest (ranged shells; nest HP is level-scaled).
    damageNest(flat) {
        if (!this.nest || this.nest.broken) return;
        this.nest.hp -= flat;
        this.nest.redraw();
        if (typeof Effects !== 'undefined') {
            Effects.burst(this, CONFIG.NEST.x, CONFIG.NEST.y - 30, 0xff6b6b, 5, 0.6);
        }
        if (this.nest.hp <= 0 && !this.nest.broken) {
            this.nest.broken = true;
            this.nest.sprite.setTint(0x555060).setAlpha(0.7);
            this.onNestBroken();
        }
    }

    // Spit / spray projectile. spreadAngle offsets the aim (radians).
    monsterProjectile(m, tx, ty, dmg, isNest, spreadAngle) {
        const ang = Math.atan2(ty - m.y, tx - m.x) + (spreadAngle || 0);
        const spr = this.add.image(m.x, m.y, 'pop-tex')
            .setDepth(7).setDisplaySize(26, 26).setTint(m.def.color);
        const dist = Math.hypot(tx - m.x, ty - m.y) + 40;
        const ex = m.x + Math.cos(ang) * dist, ey = m.y + Math.sin(ang) * dist;
        this.tweens.add({
            targets: spr, x: ex, y: ey,
            duration: dist / 0.45, // ~450 px/s
            ease: 'Linear',
            onComplete: () => {
                if (typeof Effects !== 'undefined') Effects.burst(this, ex, ey, m.def.color, 5, 0.6);
                this.monsterStrikeArea(m, ex, ey, 60, dmg, true);
                spr.destroy();
            }
        });
    }

    // Instant crackling bolt to the target.
    monsterZap(m, tx, ty, dmg, isNest) {
        const g = this.add.graphics().setDepth(8);
        g.lineStyle(4, 0xbfe8ff, 1);
        g.beginPath();
        g.moveTo(m.x, m.y);
        const steps = 4;
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            g.lineTo(
                m.x + (tx - m.x) * t + (i < steps ? Phaser.Math.Between(-22, 22) : 0),
                m.y + (ty - m.y) * t + (i < steps ? Phaser.Math.Between(-22, 22) : 0));
        }
        g.strokePath();
        this.tweens.add({
            targets: g, alpha: 0, duration: 180,
            onComplete: () => g.destroy()
        });
        if (typeof Effects !== 'undefined') Effects.flash(this, tx, ty, 0xbfe8ff, 60);
        this.monsterStrikeArea(m, tx, ty, 50, dmg, true);
    }

    // Charging monsters trample pets they touch (once per charge).
    monsterChargeCheck(m) {
        if (!this.fieldPets || !m.chargeHit) return;
        for (const a of this.fieldPets.agents) {
            if (a.ko || m.chargeHit.has(a)) continue;
            const reach = m.r + 40;
            if ((a.sprite.x - m.x) ** 2 + (a.sprite.y - m.y) ** 2 <= reach * reach) {
                m.chargeHit.add(a);
                this.fieldPets.damageAgent(a, m._chargeDmg || 0, m.def.color);
            }
        }
    }
}
