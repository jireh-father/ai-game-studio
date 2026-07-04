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
    // v6 Task 7: the fever BGM loop rides the same funnel as the existing
    // one-shot riser/descend stingers - feverMusicStart/Stop (sfx.js) are
    // self-guarding (no-op muted/unlocked-audio/already-in-that-state), so
    // this stays a plain unconditional call exactly like every other Feel
    // entry here.
    feverStart() { Sfx.feverStart(); Sfx.feverMusicStart(); Haptic.heavy(); },
    feverEnd() { Sfx.feverEnd(); Sfx.feverMusicStop(); },
    stageClear() { Sfx.stageClear(); },
    coin() { Sfx.coin(); }
};

class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    // v3.0 Task 10: stage-map REPLAY. { replayStage: N } from StageMapScene
    // plays stage N without touching SaveManager.state.stage/bestStage; gold
    // pays Balance.replayGoldMult (see stageGoldMult() below), drops stay 100%.
    init(data) {
        this.replayStage = (data && data.replayStage) || null;
    }

    create() {
        this.pool = [];
        this.active = [];
        this.pendingWave = [];     // v3.0: not-yet-spawned wave entries (batch stream)
        this.trickleEvent = null;  // v3.0: reinforcement loop timer
        this.liveDrops = [];       // v3.0: on-field, uncollected item-drop sprites
        this.dropTickEvent = null; // v3.0: shared lifetime/blink timer for liveDrops
        this.combo = 0;
        this.comboLeft = 0;
        this.feverLeft = 0;
        this.stageGoldSinceSettle = 0;
        this.transitioning = false;
        this._lastPointer = null;

        // v3.0 Task 9: team-wide auras a PET casts (buffaura/critaura/
        // goldaura) live here - {stat: {add, until}} - see teamBuffAdd().
        // The representative-pet ultimate gauge: +Balance.ultGain per kill.
        this.teamBuffs = {};
        this.ultGauge = 0;
        this._ultReadyToasted = false;

        // v3.0: kill the trickle loop (and any uncollected drops) if the scene
        // is torn down mid-stage (back to menu / restart) so nothing leaks or
        // fires late.
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.stopTrickle();
            this.clearDrops();
            // v6 Task 7: leaving the scene (back to menu, replay-clear ->
            // StageMapScene, etc.) mid-fever must never leave the overlay or
            // the looping BGM running past this scene's lifetime - neither
            // is tied to Phaser's update loop (the music runs on the
            // AudioContext's own clock), so both need an explicit stop here
            // regardless of whether updateFever()'s natural countdown ever
            // got to fire Feel.feverEnd() itself.
            this.stopFeverEffects();
        });

        // subtle field boundary
        const F = CONFIG.FIELD;
        this.add.rectangle(F.x + F.w / 2, F.y + F.h / 2, F.w, F.h, CONFIG.PASTEL.bgField)
            .setStrokeStyle(2, CONFIG.PASTEL.ink).setDepth(0);

        this.buildHud();
        buildUpgradeBar(this);
        buildFeverGauge(this);
        buildUltButton(this);
        this.wireInput();

        // v2.0: the nest we defend + our pet squad
        this.nest = new Nest(this);
        this.fieldPets = new FieldPets(this);

        this.startStage(this.replayStage || SaveManager.state.stage);
    }

    // v3.0 Task 10: the SINGLE funnel every gold credit routes through so a
    // future credit site can't forget the replay nerf. 1 outside replay;
    // Balance.replayGoldMult (0.3) while replaying an already-cleared stage.
    // Item DROP RATES are untouched by design - only gold amounts shrink.
    stageGoldMult() {
        return this.replayStage ? Balance.replayGoldMult : 1;
    }

    // -------------------------------------------------------------------------
    // HUD (minimal core; polished/extended in Task 9)
    // -------------------------------------------------------------------------
    buildHud() {
        // stage pill (center)
        this.add.nineslice(CONFIG.WIDTH / 2, 60, 'pill-tex', 0, 240, 62, 18, 18, 16, 16)
            .setTint(CONFIG.PASTEL.panel).setDepth(10);
        // v5.0 Task 2: 30->22 - "S.999 · Lv.99" at 30px pixel-font crowds the
        // 240px stage pill.
        this.stageText = this.add.text(CONFIG.WIDTH / 2, 60,
            'S.' + SaveManager.state.stage + ' · Lv.' + SaveManager.state.level, {
            fontFamily: CONFIG.FONT, fontSize: '22px', color: Balance.hex(CONFIG.PASTEL.ink)
        }).setOrigin(0.5).setDepth(11);
        // v5.0 Task 2 review fix: Press Start 2P is 1.0em/char, not ~0.6em -
        // infinite stages + levels mean this can outgrow the 240px pill.
        fitToWidth(this.stageText, 224);

        // gold chip (right) - initialized FROM STATE, never a literal
        this.add.nineslice(CONFIG.WIDTH - 120, 60, 'pill-tex', 0, 190, 56, 18, 18, 16, 16)
            .setTint(CONFIG.PASTEL.panel).setDepth(10);
        this.add.image(CONFIG.WIDTH - 186, 60, 'coin-tex').setDepth(11).setDisplaySize(30, 30);
        // v5.0 Task 2: 28->22 - same pixel-font headroom reasoning as the
        // stage pill above (large late-game gold amounts in a 190px pill).
        this.goldText = this.add.text(CONFIG.WIDTH - 162, 60, Balance.fmt(SaveManager.state.gold), {
            fontFamily: CONFIG.FONT, fontSize: '22px', color: Balance.hex(CONFIG.PASTEL.goldText)
        }).setOrigin(0, 0.5).setDepth(11);
        // v5.0 Task 2 review fix: defensive fitToWidth - the 190px gold pill
        // wasn't flagged as overflowing, but late-game gold amounts only grow.
        fitToWidth(this.goldText, 174);

        // --- live stats readout: attack, crit, splash, fever rate, gold gain ---
        this.add.nineslice(CONFIG.WIDTH / 2, 110, 'pill-tex', 0, CONFIG.WIDTH - 48, 44, 16, 16, 14, 14)
            .setTint(CONFIG.PASTEL.panel).setAlpha(0.9).setDepth(10);
        this._statEls = [];
        // v4.0 Phase C Task 2: these 5 icon tints intentionally mirror
        // CONFIG.UPGRADES[].color (config.js, out of scope for this sweep) so
        // each stat stays keyed to its upgrade-card color; only the 6th
        // (gem, a plain "no tint" white) is a themed pastel token.
        const statDefs = [
            { icon: 'up-tap',    color: 0x5aa9ff, get: () => Balance.fmt(Balance.effective(SaveManager.state).tapDmg) },
            { icon: 'up-crit',   color: 0xffe066, get: () => Math.round(Balance.effective(SaveManager.state).crit * 100) + '%' },
            { icon: 'up-splash', color: 0xff9a5a, get: (u) => Balance.splashRadius(u.splash) + '' },
            { icon: 'up-fever',  color: 0xff5ec4, get: (u) => '×' + Balance.feverMult(u.fever).toFixed(1) },
            { icon: 'up-gold',   color: 0xffd54a, get: () => '×' + Balance.effective(SaveManager.state).goldMult.toFixed(1) },
            { icon: 'gem-tex',   color: CONFIG.PASTEL.white, get: () => Balance.fmt(SaveManager.state.gems) }
        ];
        const slotW = (CONFIG.WIDTH - 64) / statDefs.length;
        // v5.0 Task 2 review fix: width a value may occupy before it reaches
        // the next slot's icon. fever/gold upgrades have no maxLevel, so their
        // '×N.N' readout keeps growing - clamp each value in refreshStats().
        this._statFitW = slotW - 30;
        statDefs.forEach((sd, i) => {
            const x = 32 + i * slotW + 14;
            this.add.image(x, 110, sd.icon).setDepth(11)
                .setTint(sd.color).setDisplaySize(24, 24);
            // v5.0 Task 2: 21->17 - 6 stat slots share the 720px HUD strip
            // (~131px/slot minus the icon); the wider pixel font needed the
            // extra headroom so late-game values (e.g. "1.2M") don't crowd
            // into the next icon.
            const val = this.add.text(x + 18, 110, '', {
                fontFamily: CONFIG.FONT, fontSize: '17px', color: Balance.hex(CONFIG.PASTEL.ink)
            }).setOrigin(0, 0.5).setDepth(11);
            this._statEls.push({ val, get: sd.get });
        });
        this.refreshStats();
        this.events.on('goldChanged', () => this.refreshStats());

        this.comboText = this.add.text(CONFIG.WIDTH / 2, 148, '', {
            fontFamily: CONFIG.FONT, fontSize: '24px', color: Balance.hex(CONFIG.PASTEL.accent), stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 5
        }).setOrigin(0.5).setDepth(10);

        // round back button (left)
        this.add.nineslice(56, 60, 'pill-tex', 0, 64, 56, 18, 18, 16, 16)
            .setTint(CONFIG.PASTEL.panel).setDepth(10);
        const back = this.add.text(56, 58, '‹', {
            fontFamily: CONFIG.FONT, fontSize: '44px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
        }).setOrigin(0.5).setDepth(11);
        // v6 Task 4: the in-game SHOP shortcut sits ~44px to the right
        // (glyph-to-glyph, well past the 2*14 both-sides-padded threshold),
        // nothing else nearby - safe to pad on every side.
        padTapArea(back);
        back.on('pointerdown', () => SmooshGame.goto('MenuScene'));

        // v2.3: in-game SHOP - pauses the fight, opens the shop as an overlay
        this.add.nineslice(136, 60, 'pill-tex', 0, 80, 56, 18, 18, 16, 16)
            .setTint(CONFIG.PASTEL.accent).setDepth(10);
        const shopBtn = this.add.text(136, 60, '🛒', {
            fontFamily: CONFIG.FONT, fontSize: '28px'
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
        fitToWidth(this.goldText, 174);
        this.events.emit('goldChanged');
    }

    refreshStats() {
        const u = SaveManager.state.upgrades;
        for (const el of this._statEls) {
            el.val.setText(el.get(u));
            fitToWidth(el.val, this._statFitW);
        }
    }

    // v3.0 Task 9: current +add from a live pet-cast team aura (buffaura/
    // critaura/goldaura), or 0 if none is active. See Effects._skillBuff
    // (effects.js) for how a pet's cast populates this.teamBuffs.
    teamBuffAdd(stat) {
        const b = this.teamBuffs && this.teamBuffs[stat];
        return (b && this.time.now < b.until) ? b.add : 0;
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
        fitToWidth(this.stageText, 224);
        this.transitioning = false;
        if (this.nest) this.nest.repair(); // fresh nest every stage
        // v3.0 review fix: single funnel for BOTH normal stage-clear
        // progression and the nest-break retry path - resets the revive
        // passive's once-per-stage flag and purges any clone/summon spirits
        // left over from the previous stage (see FieldPets.onStageStart).
        if (this.fieldPets) this.fieldPets.onStageStart();

        // v3.0: waves grow forever, so we queue the FULL composed wave and only
        // ever keep CONFIG.SPAWN.concurrentMax alive at once. The boss is always
        // entry 0 (spawner.js), so it lands in the very first batch.
        const wave = Spawner.composeWave(n, Math.random);
        this.pendingWave = wave.slice();
        this.fillFromQueue();  // first batch (<= concurrentMax, boss included)
        this.startTrickle();   // stream reinforcements as slots open
        this.onWaveSpawned();  // hook (boss HP bar etc.)
    }

    // Spawn a single queued wave entry into the field.
    spawnEntry(entry) {
        const F = CONFIG.FIELD;
        let def = SPECIES.find(s => s.id === entry.speciesId);
        // v3.0.2: a skill-spawned clone/summon (Effects._skillSpawn, effects.js)
        // that got cap-queued (field already full) carries a downscale hint so it
        // spawns at the SAME radius x0.6 / hp x0.3 it would have gotten immediately.
        if (entry.scale) {
            def = Object.assign({}, def, {
                radius: Math.max(14, Math.round(def.radius * entry.scale.r)),
                hpMult: def.hpMult * entry.scale.hp
            });
        }
        const m = this.acquireMonster();
        const isBoss = !!entry.boss || def.kind === 'boss';
        const x = isBoss
            ? F.x + F.w / 2
            : F.x + def.radius + Math.random() * (F.w - def.radius * 2);
        const y = isBoss
            ? F.y + F.h / 2
            : F.y + def.radius + Math.random() * (F.h - def.radius * 2);
        m.spawn(def, this.stageNum, x, y, { boss: entry.boss, noSkill: entry.noSkill });
        if (entry.noSplit) m.noSplit = true; // v3.0.1: cap-queued splitter children stay noSplit
        this.active.push(m);
        return m;
    }

    // v3.0.1: single point of truth for "m is no longer on the field". Dead
    // monsters MUST be spliced out of this.active the instant they die/despawn -
    // otherwise acquireMonster() can recycle the pooled instance while its OLD
    // slot is still sitting in this.active, producing a duplicate reference
    // (alive-count double-counts it, update() ticks it twice/frame). Safe to
    // call from onKill() (fresh call stack from input) and onMonsterDespawned()
    // (called from inside Monster.update(), which itself is only ever invoked
    // over a SNAPSHOT copy of this.active - see update() below - so splicing
    // the real array here never corrupts an in-flight forward iteration).
    removeActive(m) {
        const idx = this.active.indexOf(m);
        if (idx !== -1) this.active.splice(idx, 1);
    }

    // v3.0: top the field back up to concurrentMax from the pending queue.
    // Called at stage start, on every kill/despawn, and on the trickle timer.
    fillFromQueue() {
        if (this.transitioning || !this.pendingWave) return;
        let alive = this.active.filter(m => m.alive).length;
        while (this.pendingWave.length > 0 && alive < CONFIG.SPAWN.concurrentMax) {
            this.spawnEntry(this.pendingWave.shift());
            alive++;
        }
    }

    startTrickle() {
        this.stopTrickle(); // never stack trickle timers across stages
        this.trickleEvent = this.time.addEvent({
            delay: CONFIG.SPAWN.trickleDelayMs,
            loop: true,
            callback: () => this.fillFromQueue()
        });
    }

    stopTrickle() {
        if (this.trickleEvent) { this.trickleEvent.remove(false); this.trickleEvent = null; }
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
                fontFamily: CONFIG.FONT, fontSize: '17px', color: Balance.hex(CONFIG.PASTEL.white), stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 4
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
        // v4.0 Phase C Task 2: same meter-rail convention as buildFeverGauge
        // (ui.js) - ink frame + panel track so the accent fill still pops.
        this.bossBar.fillStyle(CONFIG.PASTEL.ink, 0.8).fillRoundedRect(x - 3, y - 3, w + 6, h + 6, 15);
        this.bossBar.fillStyle(CONFIG.PASTEL.panel, 1).fillRoundedRect(x, y, w, h, 12);
        if (frac > 0) {
            const fw = Math.max(10, (w - 6) * frac);
            this.bossBar.fillStyle(CONFIG.PASTEL.accent, 1).fillRoundedRect(x + 3, y + 3, fw, h - 6, 9);
            this.bossBar.fillStyle(CONFIG.PASTEL.white, 0.9)
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
        // v3.0: not clear until the whole wave has streamed in AND the field is empty
        if (this.pendingWave && this.pendingWave.length > 0) return;
        if (this.aliveBlocking().length > 0) return;
        this.onStageClear();
    }

    onStageClear() {
        this.transitioning = true;
        this.stopTrickle(); // no reinforcements during the clear animation
        // v6: uncollected drops now persist into the next stage (they still
        // despawn on their own 8s lifetime via tickDrops/despawnDrop) - see
        // task-3-brief.md A4. clearDrops() stays for SHUTDOWN and
        // onNestBroken(), where the stage really is over.
        Feel.stageClear();

        // v3.0 Task 10: a REPLAY clear never advances the map pointer - the
        // player is re-running an already-cleared stage, not progressing.
        if (!this.replayStage) {
            SaveManager.state.stage = this.stageNum + 1;
            SaveManager.state.bestStage = Math.max(SaveManager.state.bestStage, SaveManager.state.stage);
        }

        // clear XP + milestone gems
        this.gainXp(this.stageNum);
        // Milestone gems are a one-time "first time reaching this stage"
        // reward (premium currency) - gated off replay so re-clearing a
        // stage%25==0 stage can't be farmed for infinite free gems.
        if (!this.replayStage && this.stageNum % CONFIG.GEMS.stageMilestoneEvery === 0) {
            SaveManager.state.gems += CONFIG.GEMS.stageMilestoneGems;
            if (typeof Effects !== 'undefined') {
                Effects.damageText(this, CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.5,
                    '+' + CONFIG.GEMS.stageMilestoneGems + ' 💎 MILESTONE!', Balance.hex(CONFIG.PASTEL.accent));
            }
            this.events.emit('goldChanged');
        }
        SaveManager.persist();

        // v5.0 Task 2: 72->56 - the single most-seen banner in the game;
        // pixel-font headroom + a slightly more restrained arcade-marquee size.
        const banner = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.42, 'STAGE CLEAR!', {
            fontFamily: CONFIG.FONT, fontSize: '56px', color: Balance.hex(CONFIG.PASTEL.good), stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 10
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
        // v3.0 Task 10 note: left UNCONDITIONAL for replay clears too - the
        // adStageCounter is interstitial-cadence pacing, not stage progress,
        // and there's no reason a replayed clear should be ad-exempt.
        if (typeof AdsManager !== 'undefined' && AdsManager.onStageClear) {
            AdsManager.onStageClear();
        }

        // v3.0 Task 10: replay clears ALWAYS settle (single stage, tagged
        // REPLAY) and return to the map - they never fall through to the
        // normal "every 5th stage" cadence or auto-continue to a next stage.
        if (this.replayStage) {
            const gold = this.stageGoldSinceSettle;
            this.stageGoldSinceSettle = 0;
            showSettlement(this, {
                from: this.stageNum,
                to: this.stageNum,
                gold,
                replay: true,
                onContinue: () => this.scene.start('StageMapScene')
            });
            return;
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
        this.input.on('pointerdown', (pointer, currentlyOver) => {
            // v3.0 Task 9: the ULT button floats over the field's bottom-right
            // corner (ui.js buildUltButton) - a tap on it must never ALSO
            // smoosh whatever monster happens to sit underneath. Phaser hands
            // every hit-tested interactive object under the pointer here.
            if (currentlyOver && this._ultButtonBody && currentlyOver.indexOf(this._ultButtonBody) !== -1) return;

            this._lastPointer = { x: pointer.x, y: pointer.y };
            if (this.transitioning) return;

            // v3.0: drops render above monsters and get first claim on a tap -
            // collecting a drop must never ALSO smoosh a monster sitting under
            // it. Checked (and consumed, via `return`) before the monster loop
            // below runs at all, so the two can never both fire off one tap.
            for (let i = this.liveDrops.length - 1; i >= 0; i--) {
                const spr = this.liveDrops[i];
                if (spr.active && this.dropContains(spr, pointer.x, pointer.y)) {
                    this.collectDrop(spr, i);
                    return;
                }
            }

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
        // v3.0 Task 9: a pet-cast critaura (unicorn/toucan) adds straight onto
        // the player's own crit chance while it's active.
        // v6 Task 1: this 0.6 hard ceiling already stopped critaura stacking
        // from pushing live tap-time crit toward ~99% - kept as-is (eff.crit's
        // own ceiling was separately lowered 0.6 -> 0.5 in Balance.effective()).
        const critChance = Math.min(0.6, eff.crit + this.teamBuffAdd('crit'));
        const isCrit = Math.random() < critChance;
        let dmg = eff.tapDmg * (isCrit ? 5 : 1);
        if (this.feverLeft > 0) dmg *= CONFIG.FEVER.damageMult;

        if (isCrit) {
            Feel.crit();
            if (typeof Effects !== 'undefined') Effects.damageText(this, x, y - 40, 'CRIT!', Balance.hex(CONFIG.PASTEL.crit));
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

        // Freezy: the first hit only shatters the ice shell (an ICE-element
        // mechanic - color follows PASTEL.elements.ice.base).
        if (m.iceOn) {
            m.iceOn = false;
            m.sprite.clearTint();
            Feel.shieldBlock();
            if (typeof Effects !== 'undefined') {
                Effects.burst(this, m.x, m.y - m.radius * 0.5, CONFIG.PASTEL.elements.ice.base, 8);
                Effects.damageText(this, m.x, m.y - m.radius - 8, 'CRACK!', Balance.hex(CONFIG.PASTEL.elements.ice.base));
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
                Balance.hex(isCrit ? CONFIG.PASTEL.crit : CONFIG.PASTEL.ink), { crit: isCrit });
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
                if (isCrit) Effects.ring(this, x, y, CONFIG.PASTEL.crit, 40 + m.r);
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
            // generic mechanic FX (not element-tied) - neutral inkSoft.
            if (typeof Effects !== 'undefined') Effects.burst(this, m.x, m.y - m.radius, CONFIG.PASTEL.inkSoft);
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
        // v3.0.1: take m off the roster THE INSTANT it's confirmed dead, before
        // any of the below (onSpecialDeath / fillFromQueue) can trigger a pool
        // reuse that would otherwise push this same reference back in as a dupe.
        this.removeActive(m);

        // gold - boss reward scales with its HP ramp so hard bosses pay big
        const eff = Balance.effective(SaveManager.state);
        const goldBase = Balance.goldPerMob(this.stageNum);
        let mult = m.isBoss
            ? CONFIG.BOSS.goldMult * (Balance.bossHpMult(this.stageNum) / CONFIG.BOSS.hpMult)
            : m.def.goldMult;
        if (source === 'pet:leaf') mult *= 1.5; // leaf pets' golden touch
        // v3.0 Task 9: a pet-cast goldaura (duck/sheep) adds straight onto
        // the player's own gold multiplier while it's active.
        const goldBuff = 1 + this.teamBuffAdd('gold');
        const gold = Math.max(1, Math.round(goldBase * mult * eff.goldMult * goldBuff * this.stageGoldMult()));
        SaveManager.state.totalKills++;
        // v3.0 Task 11: per-species kill counter for the Dex (Dex.monsterUnlocked).
        // No dedicated persist - piggybacks the existing settlement persist.
        const kills = SaveManager.state.kills || (SaveManager.state.kills = {});
        kills[m.def.id] = (kills[m.def.id] || 0) + 1;
        SaveManager.addGold(gold);
        this.stageGoldSinceSettle += gold;
        this.refreshGold();

        // XP: every kill feeds the player level
        this.gainXp(1);

        // v3.0 Task 9: representative-pet ultimate gauge, +2/kill (clamped)
        this.ultGauge += Balance.ultGain(this.ultGauge);
        this.events.emit('ultChanged');

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

        // combo milestones: the screen celebrates with you (same accent as
        // the live COMBO x N readout - not literally "fever", just excitement)
        if (CONFIG.COMBO.milestones.indexOf(this.combo) !== -1 &&
            typeof Effects !== 'undefined') {
            Effects.screenFlash(this, CONFIG.PASTEL.accent, 0.18, 300);
            Effects.ring(this, CONFIG.WIDTH / 2, 148, CONFIG.PASTEL.accent, 220);
            Effects.confetti(this, CONFIG.WIDTH / 2, 200);
            Sfx.crit();
        }

        // fever gauge
        this.addFeverCharge(1);

        // death FX - scaled to the jelly's size
        if (typeof Effects !== 'undefined') {
            Effects.killFx(this, m, this.feverLeft > 0);
            Effects.damageText(this, m.x, m.y, '+' + Balance.fmt(gold), Balance.hex(CONFIG.PASTEL.gold));
        }

        // v2.3: random item drops - pick up = instant use.
        // v6: the stage-clearing kill used to skip this roll (a drop that
        // spawned then got wiped by onStageClear()'s clearDrops() in the same
        // call stack was an invisible loss) - onStageClear() no longer clears
        // drops, so the final kill rolls exactly like any other now.
        if (!m.isBoss && Math.random() < CONFIG.DROPS.chance) this.spawnItemDrop(m.x, m.y);

        this.onSpecialDeath(m); // splitter/jackpot/boss consequences
        m.burst();
        this.fillFromQueue();   // v3.0: a slot opened - stream in reinforcements
        this.checkStageClear();
    }

    _rollDropType() {
        // v3 Task 10: during replay, exclude 'gem' drops (no dead pickups).
        // Non-replay probability mass redistributes proportionally across remaining types.
        const weights = this.replayStage
            ? CONFIG.DROPS.weights.filter(w => w[0] !== 'gem')
            : CONFIG.DROPS.weights;
        const total = weights.reduce((a, w) => a + w[1], 0);
        let roll = Math.random() * total;
        for (const [type, w] of weights) {
            roll -= w;
            if (roll <= 0) return type;
        }
        return 'gold';
    }

    // v3.0: click-to-collect - the drop lands and STAYS on the field until the
    // player taps it (applies) or it times out (Balance.dropPhase - despawns
    // uncollected). Replaces the old v2.3 auto-apply-on-tween-complete flow.
    spawnItemDrop(x, y) {
        const type = this._rollDropType();
        // v5 final-review fix: gear/necklace field drops roll on the
        // item-economy DROP_RATES table, not the pet-gacha GACHA.rates table
        // (which is gold-egg-legendary-zeroed per Task 4 - that zero must not
        // leak into gear/necklace rarity). See config.js CONFIG.DROP_RATES.
        const rarity = (type === 'gear' || type === 'necklace')
            ? Gacha._rollRarity(CONFIG.DROP_RATES, Math.random) : null;
        const tex = {
            gold: 'coin-tex', bomb: 'bomb-tex', heal: 'heart-tex', fever: 'up-fever',
            gear: 'up-tap', necklace: 'necklace-tex', gem: 'gem-tex', decor: 'decor-tex'
        }[type];
        // v4.0 Phase C Task 2: 'gear'/'necklace' always roll a rarity above
        // (RARITY_COLORS branch), so the 'gear' entry here is unreachable in
        // practice - kept (as CONFIG.PASTEL.accent) only so the fallback map
        // has no missing key.
        const tint = rarity ? RARITY_COLORS[rarity]
            : { fever: CONFIG.PASTEL.fever, gear: CONFIG.PASTEL.accent, decor: CONFIG.PASTEL.accent }[type] || CONFIG.PASTEL.white;

        // depth 9 keeps drops rendered above every monster part (sprite=3,
        // shadow=7, face=8) so a drop is always visibly - and tap-priority -
        // on top of whatever it landed on.
        const spr = this.add.image(x, y - 26, tex)
            .setDepth(9).setDisplaySize(44, 44);
        if (tint !== CONFIG.PASTEL.white) spr.setTint(tint);
        if (typeof Effects !== 'undefined') Effects.ring(this, x, y, tint, 60);

        spr.dropType = type;
        spr.dropRarity = rarity;
        spr.dropX = x;
        spr.dropY = y;
        spr.spawnTime = this.time.now;

        // small bounce landing, then a gentle sparkle pulse loop (scale only -
        // alpha is reserved for the blink-to-despawn lifetime cue below, so
        // the two visual effects can never fight over the same property).
        this.tweens.add({ targets: spr, y, duration: 340, ease: 'Bounce.easeOut' });
        this.tweens.add({
            targets: spr, scale: spr.scale * 1.16, duration: 460,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // Interactive purely for the hand-cursor affordance / hit-area intent
        // (>=48x48px, matching the native 48x48 drop textures) - actual tap
        // collection is resolved centrally in wireInput() (see dropContains/
        // collectDrop) so a drop-tap can deterministically take priority over
        // a monster underneath it without depending on Phaser's game-object-
        // vs-scene pointerdown event ordering.
        spr.setInteractive({ useHandCursor: true });
        const hitSize = Math.max(48, spr.width);
        spr.input.hitArea.setSize(hitSize, hitSize);

        this.liveDrops.push(spr);
        this.startDropTick();
    }

    // Circular hit-test, same style as Monster.contains(), sized to at least
    // a 48px-diameter tap target regardless of the sprite's display size.
    dropContains(spr, x, y) {
        const r = Math.max(24, spr.displayWidth / 2, spr.displayHeight / 2);
        const dx = x - spr.x, dy = y - spr.y;
        return dx * dx + dy * dy <= r * r;
    }

    // Player tapped a live drop: apply its effect, destroy the sprite, tick.
    collectDrop(spr, idx) {
        this.liveDrops.splice(idx, 1);
        this.tweens.killTweensOf(spr);
        const { dropType, dropRarity, dropX, dropY } = spr;
        spr.destroy();
        Haptic.tick(0.3);
        this.applyDrop(dropType, dropRarity, dropX, dropY);
    }

    // Shared 150ms lifetime timer for every live drop - lazily started on the
    // first drop, stopped once none remain (mirrors startTrickle/stopTrickle).
    startDropTick() {
        if (this.dropTickEvent) return;
        this.dropTickEvent = this.time.addEvent({
            delay: 150, loop: true, callback: () => this.tickDrops()
        });
    }

    stopDropTick() {
        if (this.dropTickEvent) { this.dropTickEvent.remove(false); this.dropTickEvent = null; }
    }

    tickDrops() {
        const now = this.time.now;
        for (let i = this.liveDrops.length - 1; i >= 0; i--) {
            const spr = this.liveDrops[i];
            if (!spr.active) { this.liveDrops.splice(i, 1); continue; }
            const phase = Balance.dropPhase(now - spr.spawnTime);
            if (phase === 'gone') {
                this.liveDrops.splice(i, 1);
                this.despawnDrop(spr);
            } else if (phase === 'blink') {
                spr.alpha = (spr.alpha > 0.6) ? 0.25 : 1;
            }
        }
        if (this.liveDrops.length === 0) this.stopDropTick();
    }

    // Lifetime ran out uncollected: fade out and destroy WITHOUT applying.
    despawnDrop(spr) {
        this.tweens.killTweensOf(spr);
        const x = spr.x, y = spr.y;
        this.tweens.add({
            targets: spr, alpha: 0, duration: 220, ease: 'Quad.easeIn',
            onComplete: () => spr.destroy()
        });
        if (typeof Effects !== 'undefined') {
            Effects.damageText(this, x, y - 10, I18n.t('drop.despawned'), Balance.hex(CONFIG.PASTEL.inkSoft));
        }
    }

    // Wipe every uncollected drop with no effect applied. v6 final-review fix:
    // stage CLEAR is no longer a wipe path (T3 made drops persist across a
    // clean stage clear) - only nest-broken (stage retry) and scene SHUTDOWN
    // still mean "this stage is over, whatever's still sitting on the field
    // doesn't carry over."
    clearDrops() {
        for (const spr of this.liveDrops) {
            this.tweens.killTweensOf(spr);
            if (spr.active) spr.destroy();
        }
        this.liveDrops.length = 0;
        this.stopDropTick();
    }

    applyDrop(type, rarity, x, y) {
        const st = SaveManager.state;
        const eff = Balance.effective(st);
        let msg = '', color = Balance.hex(CONFIG.PASTEL.ink);

        switch (type) {
            case 'gold': {
                // v3.0 Task 10: the gold pouch drop is also gold FROM this
                // stage, so it pays the same replay nerf as kills - only the
                // AMOUNT shrinks, the 6% drop CHANCE itself is untouched.
                const gold = Math.round(Balance.goldPerMob(this.stageNum) *
                    CONFIG.DROPS.goldMult * eff.goldMult * this.stageGoldMult());
                SaveManager.addGold(gold);
                this.refreshGold();
                msg = '+' + Balance.fmt(gold) + ' GOLD!'; color = Balance.hex(CONFIG.PASTEL.gold);
                if (typeof Effects !== 'undefined') Effects.coinPop(this, x, y, 6, { x: CONFIG.WIDTH - 120, y: 60 });
                break;
            }
            case 'bomb': {
                const dmg = eff.tapDmg * CONFIG.DROPS.bombMult;
                if (typeof Effects !== 'undefined') {
                    Effects.screenFlash(this, CONFIG.PASTEL.white, 0.4, 350);
                    // fire-element explosion tint (matches the fire ramp hue).
                    Effects.ring(this, CONFIG.WIDTH / 2, CONFIG.FIELD.y + CONFIG.FIELD.h / 2, CONFIG.PASTEL.elements.fire.base, 700);
                }
                Sfx.bossBoom();
                this.cameras.main.shake(200, 0.006);
                for (const mo of this.active.slice()) {
                    if (mo.alive) this.damageMonster(mo, dmg, false, mo.x, mo.y, 'bomb');
                }
                msg = '💣 BOOM!'; color = Balance.hex(CONFIG.PASTEL.elements.fire.base);
                break;
            }
            case 'heal': {
                if (this.nest && !this.nest.broken) {
                    this.nest.hp = Math.min(this.nest.maxHp,
                        this.nest.hp + this.nest.maxHp * CONFIG.DROPS.healPct);
                    this.nest.redraw();
                    if (typeof Effects !== 'undefined') Effects.ring(this, CONFIG.NEST.x, CONFIG.NEST.y, CONFIG.PASTEL.good, 140);
                }
                msg = '❤ NEST +' + Math.round(CONFIG.DROPS.healPct * 100) + '%'; color = Balance.hex(CONFIG.PASTEL.good);
                Sfx.coin();
                break;
            }
            case 'fever':
                this.addFeverCharge(CONFIG.DROPS.feverCharge);
                msg = '🔥 FEVER +' + CONFIG.DROPS.feverCharge; color = Balance.hex(CONFIG.PASTEL.fever);
                Sfx.coin();
                break;
            case 'gem':
                // v3.0 Task 10 review fix: field gem drops are also gem
                // currency FROM this stage, so they need the same replay
                // gate as milestone/boss gems - otherwise replaying any
                // node farms free gems via the 2% drop-table weight.
                // NOTE: unreachable in replay (_rollDropType excludes 'gem'),
                // guard kept defensively.
                if (!this.replayStage) {
                    st.gems += 1;
                    SaveManager.persist();
                    this.events.emit('goldChanged');
                    msg = '+1 GEM!'; color = Balance.hex(CONFIG.PASTEL.accent);
                    Sfx.jackpot();
                }
                break;
            case 'gear': {
                const slot = ['glove', 'ring', 'charm'][Math.floor(Math.random() * 3)];
                const cur = st.items[slot];
                if (!cur || Gacha.rarityRank(rarity) > Gacha.rarityRank(cur.rarity)) {
                    st.items[slot] = { rarity, level: cur ? cur.level : 0 };
                    msg = '⚔ ' + rarity.toUpperCase() + ' ' + slot.toUpperCase() + '!';
                } else {
                    // v3.0 Task 10 review fix: this refund is stage gold too,
                    // priced off bestStage (frontier pricing is correct for
                    // normal runs) - it still needs the replay nerf so an
                    // easy replay node can't cash out late-game-priced gold.
                    const refund = Math.round(Balance.chestCost(st.bestStage) * 0.3 * this.stageGoldMult());
                    st.gold += refund;
                    msg = '⚔ dupe → +' + Balance.fmt(refund) + ' gold';
                }
                color = Balance.hex(RARITY_COLORS[rarity]);
                SaveManager.persist();
                this.refreshGold();
                Sfx.jackpot();
                break;
            }
            case 'decor': {
                // v3.5 Task 3: grantRandom mutates st.decorOwned and picks
                // unowned-weighted (3x) - REMAINS available in replay (see
                // _rollDropType: only 'gem' is excluded there), because decor
                // drops are the whole point of replay-farming per spec.
                const id = Decor.grantRandom(st, Math.random);
                const def = Decor.byId(id);
                const name = def ? (def.name[I18n.locale] || def.name.en) : id;
                msg = '🎀 ' + I18n.t('decor.dropped', { name });
                color = Balance.hex(CONFIG.PASTEL.accent);
                SaveManager.persist();
                Sfx.coin();
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
                color = Balance.hex(RARITY_COLORS[rarity]);
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
            // gems for boss kills (king pays triple) - v3.0 Task 10 review fix:
            // gated off replay so re-clearing an already-cleared boss node
            // can't be farmed for infinite free gems (mirrors the milestone-
            // gem gate above). Kill FX/gold below stay unconditional - only
            // the gem credit itself is skipped.
            if (!this.replayStage) {
                const gems = m.def.id === 'king' ? CONFIG.GEMS.kingKill : CONFIG.GEMS.bossKill;
                SaveManager.state.gems += gems;
                SaveManager.persist();
                this.events.emit('goldChanged'); // refresh gem readout
                if (typeof Effects !== 'undefined') {
                    Effects.damageText(this, m.x, m.y - 120, '+' + gems + ' 💎', Balance.hex(CONFIG.PASTEL.accent));
                }
            }

            // === THE mega boss death: multi-stage explosion ===
            const bx = m.x, by = m.y;
            const tint = m.def.color || CONFIG.PASTEL.accent;
            Feel.bossBoom();
            this.cameras.main.shake(420, 0.011);
            this.tweens.add({
                targets: this.cameras.main, zoom: 1.12,
                duration: CONFIG.BOSS.slowMoMs, yoyo: true, ease: 'Quad.easeOut'
            });

            if (typeof Effects !== 'undefined') {
                // stage 0: white blast + first wave
                Effects.screenFlash(this, CONFIG.PASTEL.white, 0.5, 380);
                Effects.flash(this, bx, by, tint, 520);
                Effects.burst(this, bx, by, tint, 34, 2.4);
                Effects.ring(this, bx, by, CONFIG.PASTEL.white, 460);
                for (let i = 0; i < 5; i++) {
                    Effects.goo(this, bx + Phaser.Math.Between(-160, 160),
                        by + Phaser.Math.Between(-120, 120), tint, 1.6);
                }
                // stage 1 + 2: echo explosions rolling outward
                this.time.delayedCall(150, () => {
                    Effects.burst(this, bx, by, CONFIG.PASTEL.white, 22, 1.8);
                    Effects.ring(this, bx, by, tint, 620);
                    Effects.confetti(this, bx, by);
                    Sfx.bossBoom();
                });
                this.time.delayedCall(320, () => {
                    Effects.ring(this, bx, by, CONFIG.PASTEL.gold, 760);
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
            // v3.0.1: m is already off this.active (removeActive() ran at the
            // top of onKill), so this.active's alive count is the TRUE field
            // count. Children only skip the cap if there's real room; otherwise
            // they queue at the FRONT of pendingWave as reinforcements instead
            // of bypassing concurrentMax - stage clear still requires them.
            for (const dx of [-34, 34]) {
                const trueAlive = this.active.filter(x => x.alive).length;
                if (trueAlive < CONFIG.SPAWN.concurrentMax) {
                    const c = this.acquireMonster();
                    c.spawn(childDef, this.stageNum, m.x + dx, m.y + Phaser.Math.Between(-16, 16));
                    c.noSplit = true;
                    this.active.push(c);
                } else {
                    this.pendingWave.unshift({ speciesId: m.def.childId, noSplit: true });
                }
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
            fitToWidth(this.stageText, 224);
            this.events.emit('goldChanged'); // stats readout refresh
            Sfx.jackpot();
            if (typeof Effects !== 'undefined') {
                Effects.screenFlash(this, CONFIG.PASTEL.good, 0.2, 350);
                Effects.confetti(this, CONFIG.WIDTH / 2, 200);
            }
            const t = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.35,
                // v5.0 Task 2: 56->44 - "LEVEL UP!  Lv.999" headroom in the
                // wider pixel font (no wordWrap/panel to catch overflow here).
                'LEVEL UP!  Lv.' + st.level, {
                fontFamily: CONFIG.FONT, fontSize: '44px', color: Balance.hex(CONFIG.PASTEL.good), stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 9
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
        this.stopTrickle();      // v3.0: stop reinforcements - the stage is lost
        this.pendingWave = [];   // discard the rest of the broken stage's queue
        this.clearDrops();       // v3.0: uncollected drops don't survive a retry
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
        // modal dim-scrim - same near-black exception as showSettlement (ui.js).
        items.push(this.add.rectangle(W / 2, H / 2, W, H, 0x0a0714, 0.8).setDepth(20).setInteractive());
        // v5.0 Task 2: 56->44 - pixel-font headroom for this un-wrapped title.
        items.push(this.add.text(W / 2, H * 0.34, '💔 THE NEST BROKE!', {
            fontFamily: CONFIG.FONT, fontSize: '44px', color: Balance.hex(CONFIG.PASTEL.danger)
        }).setOrigin(0.5).setDepth(21));
        items.push(this.add.text(W / 2, H * 0.42, 'The babies are safe... but the stage is lost.', {
            // v5 final-review fix: this text sits directly on the near-black
            // dim scrim (no panel under it). The v4 note below chose
            // panelLight as the "light-text-on-dark-scrim" pick, but v5's
            // palette flip made panelLight itself a DARK panel token (deep
            // purple) - dark-on-near-black is ~1.4:1, unreadable. `ink`
            // (bright near-white) is the correct bright-on-dark choice now,
            // same convention as every other scrim text (nest-broken title,
            // pvp result screen) - verified >=4.5:1 in tests/pastel.test.js.
            fontFamily: CONFIG.FONT, fontSize: '24px', color: Balance.hex(CONFIG.PASTEL.ink)
        }).setOrigin(0.5).setDepth(21));
        const btn = makeUiButton(this, W / 2, H * 0.56, 480, 100, 'RETRY STAGE', CONFIG.PASTEL.accent, () => {
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

    // v6 Task 7: single funnel to tear down BOTH the persistent screen
    // overlay and the looping BGM - called from updateFever()'s natural
    // end-of-fever branch AND unconditionally from SHUTDOWN (see create()),
    // so every exit path converges here. Safe to call when fever isn't
    // active at all (both halves are already null-safe/idempotent).
    stopFeverEffects() {
        if (this._feverOverlay) {
            Effects.clearFeverOverlay(this._feverOverlay);
            this._feverOverlay = null;
        }
        if (typeof Sfx !== 'undefined' && Sfx.feverMusicStop) Sfx.feverMusicStop();
    }

    triggerFever() {
        if (this.feverLeft > 0) return;
        this.feverLeft = CONFIG.FEVER.durationMs / 1000;
        Feel.feverStart();
        if (typeof Effects !== 'undefined') {
            Effects.screenFlash(this, CONFIG.PASTEL.fever, 0.3, 420);
            Effects.ring(this, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.PASTEL.fever, 900);
            // v6 Task 7: the persistent whole-screen spectacle - lives until
            // updateFever()'s natural end (or an earlier scene SHUTDOWN)
            // calls stopFeverEffects() above.
            this._feverOverlay = Effects.feverOverlay(this);
        }

        const banner = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.3, 'FEVER!!', {
            fontFamily: CONFIG.FONT, fontSize: '96px', color: Balance.hex(CONFIG.PASTEL.fever), stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 12
        }).setOrigin(0.5).setDepth(20).setScale(0.2);
        this.tweens.add({ targets: banner, scale: 1, duration: 260, ease: 'Back.easeOut' });
        this.tweens.add({
            targets: banner, alpha: 0, delay: 800, duration: 300,
            onComplete: () => banner.destroy()
        });
    }

    // =========================================================================
    // v3.0 Task 9 - the representative-pet ULTIMATE. Manual, one press per
    // full gauge: the rep pet (SaveManager.state.repPet, or the first owned
    // pet until Phase B's nest UI lets the player pick one) casts its own
    // personality skill at x4 magnitude, then the gauge resets to 0.
    //
    // v3.0 review fix: the fallback target search only ever lands on a
    // CASTABLE pet (FieldPets.isUltCastable - any non-passive archetype,
    // clone/summon included now that both spawn real spirit agents). A
    // passive-only rep pet (rage/revive) is treated the same as "KO'd" and
    // skipped. If literally no standing pet is castable, the press is a
    // total no-op: gauge is NOT spent, only a small button shake + haptic
    // fire. This replaces the old behavior where a passive/no-op rep pet
    // would still eat the full flash/SFX/gauge-reset for zero effect.
    // =========================================================================
    castUltimate() {
        if (this.ultGauge < Balance.ULT_MAX || this.transitioning) return;
        if (!this.fieldPets || !this.fieldPets.agents.length) return;

        const st = SaveManager.state;
        const repId = st.repPet || (st.pets[0] && st.pets[0].species);
        const castable = a => !a.ko && this.fieldPets.isUltCastable(a);

        // v3.0 review fix: the explicitly-chosen rep pet might be standing
        // but carry a passive skill (rage/revive - can't be "cast" by a
        // button press) - that's a guaranteed whiff, not a valid target, so
        // fall through to the standing-pet search below exactly as if the
        // rep pet were KO'd/undeployed.
        let rep = this.fieldPets.agents.find(a => !a.ko && a.pet.species === repId);
        if (rep && !castable(rep)) rep = null;
        if (!rep) rep = this.fieldPets.agents.find(castable); // first standing, castable pet steps up
        if (!rep) {
            // v3.0 review fix: nobody on the field can actually DO anything
            // with a press right now (whole squad KO'd, or every standing
            // pet's skill is passive) - never consume a full gauge on a
            // guaranteed whiff. Small button shake says "not yet"; gauge
            // stays exactly as charged as it was.
            if (this._ultButtonBody) {
                this.tweens.add({
                    targets: this._ultButtonBody, angle: 8, duration: 45, yoyo: true, repeat: 3,
                    onComplete: () => { if (this._ultButtonBody.active) this._ultButtonBody.setAngle(0); }
                });
            }
            Haptic.tick(0.3);
            return;
        }

        const now = this.time.now;
        const A = Skills.ARCHETYPES[rep.def.skill];
        const ally = Monsters.ALLY_SKILLS.has(rep.def.skill) || Monsters.SPAWN_SKILLS.has(rep.def.skill);
        const ctx = Object.assign(
            ally ? this.fieldPets._allySkillCtx(rep, now) : this.fieldPets._enemySkillCtx(rep, now), { mult: 4 });
        const eff = Skills.cast(rep.def.skill, ctx);

        // Task 7 ruling (binding): x4 ultimate caps STATUS durationMs at 2x
        // the archetype's base duration - damage/heal/shield scale fully.
        if (eff && eff.kind === 'status' && eff.durationMs) {
            eff.durationMs = Math.min(eff.durationMs, A.durationMs * 2);
        }

        // The gauge always resets on press - a manual activation is "spent"
        // even if this particular cast whiffed (e.g. execute finds no prey).
        this.ultGauge = 0;
        this._ultReadyToasted = false;
        this.events.emit('ultChanged');

        Effects.screenFlash(this, CONFIG.PASTEL.white, 0.7, 120);
        Sfx.jackpot();
        Haptic.heavy();
        if (eff) {
            Effects.applySkillEffect(this, 'pet', rep, eff);
            Effects.ring(this, rep.sprite.x, rep.sprite.y, rep.def.color, rep.size * 2.4);
        }
    }

    // -------------------------------------------------------------------------
    update(time, delta) {
        const dt = delta / 1000;

        // v3.0.1: iterate a SNAPSHOT, not the live array. Monster.update() can
        // synchronously despawn itself (goldie lifetime -> onMonsterDespawned
        // -> removeActive splices the REAL this.active). Splicing the array a
        // forward for-of is actively iterating over would skip the next
        // element; iterating a copy sidesteps that while still letting
        // removeActive() mutate the real array immediately (dedup takes effect
        // right away, not just at end of frame).
        for (const m of this.active.slice()) {
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

        // v6 Task 7: drive the whole-screen overlay (border/tint/scanline/
        // embers) every frame this fever is live - this keeps running
        // through stage-clear/nest-broken transitions too, since update()
        // calls updateFever(dt) unconditionally regardless of
        // this.transitioning (see update() above), which is exactly why
        // those paths need no fever-specific handling of their own.
        if (this._feverOverlay) this._feverOverlay.update(dt);

        if (this.feverLeft <= 0) {
            this.feverLeft = 0;
            SaveManager.state.feverGauge = 0;
            SaveManager.persist();
            this.cameras.main.setBackgroundColor(CONFIG.COLORS.bg);
            this.events.emit('feverChanged');
            this.stopFeverEffects(); // v6 Task 7: overlay + BGM teardown
            Feel.feverEnd();
        }
    }

    onMonsterDespawned(m) {
        // v3.0.1: same reasoning as onKill() - remove m before anything can
        // reuse it via the pool. This runs from inside Monster.update(), which
        // update() below only ever calls over a SNAPSHOT of this.active, so
        // splicing the real array here is safe mid-frame.
        this.removeActive(m);
        this.fillFromQueue();   // v3.0: freed a slot - top up reinforcements
        this.checkStageClear();
    }

    // =========================================================================
    // v2.4 - monster offense helpers (pets take hits, nest can be shelled)
    // =========================================================================

    // v3.0: elemental type effectiveness for a monster attack landing on a
    // pet (species.elem vs pet's element). Shows Super!/Resisted feedback.
    // NEST damage (damageNest) is untouched - it stays neutral by design.
    _petElemHit(m, a, dmg) {
        const { dmg: edmg, mult } = Balance.applyElement(dmg, m.def.elem, a.def.element);
        if (mult !== 1 && typeof Effects !== 'undefined') {
            Effects.damageText(this, a.sprite.x, a.sprite.y - 68,
                mult > 1 ? 'Super!' : 'Resisted',
                Balance.hex(mult > 1 ? CONFIG.PASTEL.gold : CONFIG.PASTEL.inkSoft));
        }
        return edmg;
    }

    // Area strike: damages every pet in the circle; optionally chips the nest.
    monsterStrikeArea(m, x, y, radius, dmg, canHitNest) {
        if (this.fieldPets) {
            for (const a of this.fieldPets.agents) {
                if (a.ko) continue;
                if ((a.sprite.x - x) ** 2 + (a.sprite.y - y) ** 2 <= radius * radius) {
                    this.fieldPets.damageAgent(a, this._petElemHit(m, a, dmg), m.def.color);
                }
            }
        }
        if (canHitNest && this.nest && !this.nest.broken) {
            if ((CONFIG.NEST.x - x) ** 2 + (CONFIG.NEST.y - y) ** 2 <= (radius + 70) ** 2) {
                // v6 Task 2 (A3): this flat nest-shell chip was previously
                // stage-independent (always 3, or 9 for a boss) - multiply by
                // monsterAtkMult(m.stage) so nest shelling scales with the
                // rest of monster offense.
                this.damageNest(3 * (m.isBoss ? 3 : 1) * Balance.monsterAtkMult(m.stage));
            }
        }
    }

    // Flat chip damage to the nest (ranged shells; nest HP is level-scaled).
    damageNest(flat) {
        if (!this.nest || this.nest.broken) return;
        this.nest.hp -= flat;
        this.nest.redraw();
        if (typeof Effects !== 'undefined') {
            Effects.burst(this, CONFIG.NEST.x, CONFIG.NEST.y - 30, CONFIG.PASTEL.danger, 5, 0.6);
        }
        if (this.nest.hp <= 0 && !this.nest.broken) {
            this.nest.broken = true;
            // grayed-out/disabled look, not a danger flash - inkSoft.
            this.nest.sprite.setTint(CONFIG.PASTEL.inkSoft).setAlpha(0.7);
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

    // Instant crackling bolt to the target - an ELECTRIC attack, colored off
    // PASTEL.elements.electric.base (was a hardcoded ice-cyan reuse before
    // the v4.0 pastel sweep).
    monsterZap(m, tx, ty, dmg, isNest) {
        const g = this.add.graphics().setDepth(8);
        g.lineStyle(4, CONFIG.PASTEL.elements.electric.base, 1);
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
        if (typeof Effects !== 'undefined') Effects.flash(this, tx, ty, CONFIG.PASTEL.elements.electric.base, 60);
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
                this.fieldPets.damageAgent(a, this._petElemHit(m, a, m._chargeDmg || 0), m.def.color);
            }
        }
    }
}
