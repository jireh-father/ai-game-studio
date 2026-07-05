// =============================================================================
// SMOOSH! - infinitegame.js  (v7 T12 - INFINITE mode)
// InfiniteScene: endless survival, distinct from the campaign stage ladder.
// Precedent: PvpScene (pvp.js) - "a new self-contained Scene class reusing
// shared systems, isolated from GameScene". This scene reuses Monster/
// FieldPets/Nest/Effects/Feel/Spawner/Balance EXACTLY as GameScene does -
// only the STAGE STATE MACHINE differs (a continuous waveIndex ramp replaces
// startStage/checkStageClear/afterStageClear). The small set of methods
// Monster.js calls INTO the scene (monsterStrikeArea/damageNest/
// monsterProjectile/monsterZap/monsterChargeCheck/damageMonster) are
// necessarily duplicated here verbatim from game.js, the same way PvpScene
// implements its own combat loop rather than importing GameScene's - there
// is no mixin mechanism in this codebase's plain-class convention, so this
// is the non-invasive way to satisfy that "scene contract" without editing
// monsters.js/pets.js/nest.js at all.
//
// All ramp/score/reward MATH lives in infiniteBalance.js (InfiniteBalance) -
// see tests/infinite.test.js. This file is Phaser orchestration only.
// =============================================================================

class InfiniteScene extends Phaser.Scene {
    constructor() { super({ key: 'InfiniteScene' }); }

    create() {
        this.pool = [];
        this.active = [];
        this.pendingWave = [];
        this.trickleEvent = null;
        this.waveEvent = null;
        this.liveDrops = [];
        this.dropTickEvent = null;
        this.combo = 0;
        this.comboLeft = 0;
        this.feverLeft = 0;
        // v7 T12 economy-safety fix: Infinite's fever gauge is SCENE-LOCAL
        // and NEVER reads/writes the shared SaveManager.state.feverGauge
        // (that field belongs to campaign only - see game.js addFeverCharge/
        // updateFever). Without this isolation, a player could pre-charge
        // fever cheaply here (easy wave-1 kills, feverChargeMult 1.5x) then
        // enter campaign for a near-free Fever, or vice versa. Always starts
        // at 0 on every run (fresh per attempt, exactly like feverLeft above)
        // - it never inherits whatever the campaign gauge happens to hold.
        this.infFeverGauge = 0;
        this.transitioning = false; // flips true once (and only once) the run ends
        this._lastPointer = null;
        this.teamBuffs = {};

        this.waveIndex = 0;
        this.virtualStage = 0;
        this.score = 0;
        this.runMult = 1.0;
        this.runGoldEarned = 0;
        this.runStartAt = this.time.now;
        this.miniBoss = null;

        // v7 T12: borrows nest.js's EXISTING "don't persist this session's
        // nest HP into the shared save field" guard (shouldPersistNestHpFrac
        // checks scene.replayStage truthily - see nest.js) instead of
        // touching nest.js itself. Semantically this isn't a stage-map
        // replay, but the requirement is identical: Infinite's nest damage
        // must never clobber the campaign's persisted nestHpFrac. No other
        // file reads scene.replayStage (grepped: only game.js/nest.js do,
        // and this scene never calls any of game.js's methods), so this is
        // a safe, minimal reuse of the existing flag.
        this.replayStage = true;

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.stopTrickle();
            this.stopWaveTimer();
            this.clearDrops();
            this.stopFeverEffects();
            Backgrounds.destroy(this);
        });

        const F = CONFIG.FIELD;
        this.add.rectangle(F.x + F.w / 2, F.y + F.h / 2, F.w, F.h, CONFIG.PASTEL.bgField, 0)
            .setStrokeStyle(2, CONFIG.PASTEL.ink).setDepth(0);
        Backgrounds.render(this, 1);

        // --- daily payout eligibility, decided AND CONSUMED at run START
        // (see InfiniteBalance.consumePayoutSlotAtStart's doc comment) - a
        // payout slot is spent the instant a rewarded run begins, not when
        // it ends, so the HUD back button (or an app kill) can never dodge
        // the daily cap by exiting before onNestBroken()/endRun() fires. ---
        const st = SaveManager.state;
        const today = Social._todayKey(new Date());
        st.infiniteRunsToday = InfiniteBalance.runsTodayFor(st.infiniteRunsDate, st.infiniteRunsToday, today);
        st.infiniteRunsDate = today;
        const slot = InfiniteBalance.consumePayoutSlotAtStart(st.infiniteRunsToday);
        this.payoutRun = slot.payoutRun;
        st.infiniteRunsToday = slot.runsToday;
        SaveManager.persist();

        this.buildHud();
        buildFeverGauge(this);
        this.wireInput();

        // v2.0 systems, reused verbatim - full campaign carry-in (loadout,
        // pets, nest level), per the ideation's Persona C ruling.
        this.nest = new Nest(this);
        this.nest.repair(); // Infinite always starts with a full, undamaged nest
        this.fieldPets = new FieldPets(this);

        this.refreshHud();

        // continuous ramp: a new wave every waveIntervalMs, forever - no
        // "wait for the field to clear" gate (Persona B: no turtling).
        this.waveEvent = this.time.addEvent({
            delay: CONFIG.INFINITE.waveIntervalMs, loop: true,
            callback: () => this.advanceWave()
        });
        this.advanceWave(); // wave 1 starts immediately
    }

    // -------------------------------------------------------------------------
    // HUD - a dedicated top bar (large score, wave chip, run-mult badge,
    // combo readout) replacing the campaign stage-pill, per the ideation's
    // Persona D ("the mode needs its OWN top bar so the two modes read as
    // distinct at a glance").
    // -------------------------------------------------------------------------
    buildHud() {
        this.add.nineslice(56, 60, 'pill-tex', 0, 64, 56, 18, 18, 16, 16)
            .setTint(CONFIG.PASTEL.panel).setDepth(10);
        const back = this.add.text(56, 58, '‹', {
            fontFamily: CONFIG.FONT, fontSize: '44px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
        }).setOrigin(0.5).setDepth(11);
        padTapArea(back);
        back.on('pointerdown', () => SmooshGame.goto('SubMainScene')); // v7 T14: back -> the hub

        // live wallet feedback - same chip convention as campaign.
        this.add.nineslice(CONFIG.WIDTH - 120, 60, 'pill-tex', 0, 190, 56, 18, 18, 16, 16)
            .setTint(CONFIG.PASTEL.panel).setDepth(10);
        this.add.image(CONFIG.WIDTH - 186, 60, 'coin-tex').setDepth(11).setDisplaySize(30, 30);
        this.goldText = this.add.text(CONFIG.WIDTH - 162, 60, Balance.fmt(SaveManager.state.gold), {
            fontFamily: CONFIG.FONT, fontSize: '22px', color: Balance.hex(CONFIG.PASTEL.goldText)
        }).setOrigin(0, 0.5).setDepth(11);
        fitToWidth(this.goldText, 174);

        // SCORE - "the number going up IS the game" (Persona A).
        this.scoreText = this.add.text(CONFIG.WIDTH / 2, 100, '0', {
            fontFamily: CONFIG.FONT, fontSize: '40px', color: Balance.hex(CONFIG.PASTEL.accent),
            stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 8
        }).setOrigin(0.5).setDepth(11);
        fitToWidth(this.scoreText, CONFIG.WIDTH - 80);

        this.waveText = this.add.text(CONFIG.WIDTH / 2 - 150, 136, 'WAVE 0', {
            fontFamily: CONFIG.FONT, fontSize: '18px', color: Balance.hex(CONFIG.PASTEL.inkSoft),
            stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 4
        }).setOrigin(0.5).setDepth(11);
        // the ratcheting run-multiplier badge MUST be visibly climbing
        // (Persona D) - juice is wasted if the player can't feel it grow.
        this.multText = this.add.text(CONFIG.WIDTH / 2 + 150, 136, '×1.00', {
            fontFamily: CONFIG.FONT, fontSize: '18px', color: Balance.hex(CONFIG.PASTEL.goldText),
            stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 4
        }).setOrigin(0.5).setDepth(11);

        this.comboText = this.add.text(CONFIG.WIDTH / 2, 168, '', {
            fontFamily: CONFIG.FONT, fontSize: '22px', color: Balance.hex(CONFIG.PASTEL.accent),
            stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 5
        }).setOrigin(0.5).setDepth(10);
    }

    refreshHud() {
        this.scoreText.setText(Balance.fmt(Math.round(this.score)));
        fitToWidth(this.scoreText, CONFIG.WIDTH - 80);
        this.goldText.setText(Balance.fmt(SaveManager.state.gold));
        fitToWidth(this.goldText, 174);
        this.waveText.setText('WAVE ' + this.waveIndex);
        this.multText.setText('×' + this.runMult.toFixed(2));
    }

    setCombo(n) {
        if (n < 2) { this.comboText.setText('').clearTint(); return; }
        this.comboText.setText('COMBO ×' + n);
        this.comboText.setScale(1.25 + Math.min(0.5, n * 0.01));
        if (n >= 25) {
            const c = Phaser.Display.Color.HSVToRGB((n * 0.07) % 1, 0.6, 1);
            this.comboText.setTint(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
        } else {
            this.comboText.clearTint();
        }
        this.tweens.add({ targets: this.comboText, scale: 1, duration: 120, ease: 'Quad.easeOut' });
    }

    // v7 T12: current +add from a live pet-cast team aura (buffaura/critaura/
    // goldaura) - twin of GameScene.teamBuffAdd, required because FieldPets/
    // Effects.applySkillEffect write into scene.teamBuffs unconditionally.
    teamBuffAdd(stat) {
        const b = this.teamBuffs && this.teamBuffs[stat];
        return (b && this.time.now < b.until) ? b.add : 0;
    }

    // -------------------------------------------------------------------------
    // Wave ramp - replaces GameScene's startStage/checkStageClear/
    // afterStageClear entirely. Continuous: a new wave every
    // CONFIG.INFINITE.waveIntervalMs regardless of field state.
    // -------------------------------------------------------------------------
    advanceWave() {
        this.waveIndex++;
        let stage = Math.max(1, Math.round(InfiniteBalance.virtualStage(this.waveIndex)));
        // never let the compressed stage land exactly on a campaign boss
        // multiple - Spawner.composeWave would otherwise splice in ITS OWN
        // king/giant-boss branch on top of this scene's independent
        // mini-boss schedule (isMiniBossWave). Nudge by +1 (harmless - the
        // curves/species pool at n+1 are indistinguishable from n at this
        // scale) so the two schedules never collide.
        if (stage % CONFIG.BOSS.every === 0) stage += 1;
        this.virtualStage = stage;

        const modifier = InfiniteBalance.rollModifier(Math.random);
        const modMult = InfiniteBalance.modifierMult(modifier);

        const entries = Spawner.composeWave(stage, Math.random);
        if (modMult.forceElite) {
            const idx = entries.findIndex(e => {
                const d = SPECIES.find(s => s.id === e.speciesId);
                return d && d.kind === 'mob';
            });
            if (idx !== -1 && stage >= Spawner.SPLITTER_FROM) {
                entries[idx] = {
                    speciesId: (stage >= Spawner.SHIELD_FROM && Math.random() < 0.5) ? 'shieldy' : 'splitter'
                };
            }
        }
        for (const e of entries) e.modScale = modMult;

        const isMiniBossWave = InfiniteBalance.isMiniBossWave(this.waveIndex);
        if (isMiniBossWave) {
            entries.unshift({ speciesId: Spawner.bossSpecies(stage), boss: true, miniBoss: true });
        }

        for (const e of entries) this.pendingWave.push(e);
        this.fillFromQueue();
        this.restartTrickle(modMult.trickleMult);
        this.showModifierBanner(modifier, isMiniBossWave);
        if (isMiniBossWave) this.onMiniBossSpawned();
        this.refreshHud();
    }

    restartTrickle(trickleMult) {
        this.stopTrickle();
        const base = InfiniteBalance.trickleDelayMs(this.waveIndex);
        const delay = Math.max(CONFIG.INFINITE.trickleMinMs, Math.round(base * (trickleMult || 1)));
        this.trickleEvent = this.time.addEvent({ delay, loop: true, callback: () => this.fillFromQueue() });
    }

    stopTrickle() {
        if (this.trickleEvent) { this.trickleEvent.remove(false); this.trickleEvent = null; }
    }

    stopWaveTimer() {
        if (this.waveEvent) { this.waveEvent.remove(false); this.waveEvent = null; }
    }

    showModifierBanner(modifier, isMiniBossWave) {
        const label = {
            swarm: '🌊 SWARM!', tanky: '🛡 TANKY!', glassRush: '💨 GLASS RUSH!', elite: '⭐ ELITE!'
        }[modifier] || modifier.toUpperCase();
        const banner = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.34, label, {
            fontFamily: CONFIG.FONT, fontSize: '32px', color: Balance.hex(CONFIG.PASTEL.accent),
            stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 8
        }).setOrigin(0.5).setDepth(20).setScale(0.3);
        this.tweens.add({ targets: banner, scale: 1, duration: 220, ease: 'Back.easeOut' });
        this.tweens.add({ targets: banner, alpha: 0, delay: 850, duration: 260, onComplete: () => banner.destroy() });

        if (isMiniBossWave) {
            this.time.delayedCall(260, () => {
                const bb = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.34 + 46, '⚠ MINI-BOSS INCOMING', {
                    fontFamily: CONFIG.FONT, fontSize: '20px', color: Balance.hex(CONFIG.PASTEL.dangerText),
                    stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 6
                }).setOrigin(0.5).setDepth(20).setScale(0.3);
                this.tweens.add({ targets: bb, scale: 1, duration: 220, ease: 'Back.easeOut' });
                this.tweens.add({ targets: bb, alpha: 0, delay: 850, duration: 260, onComplete: () => bb.destroy() });
            });
        }
    }

    onMiniBossSpawned() {
        if (this.miniBossBar) { this.miniBossBar.destroy(); this.miniBossBar = null; }
        if (this.miniBossName) { this.miniBossName.destroy(); this.miniBossName = null; }
        if (this.miniBossCrown) { this.miniBossCrown.destroy(); this.miniBossCrown = null; }
        this.miniBoss = this.active.find(m => m.alive && m._miniBoss) || null;
        if (!this.miniBoss) return;
        this.miniBossBar = this.add.graphics().setDepth(11);
        this.miniBossName = this.add.text(CONFIG.WIDTH / 2, 190, 'MINI-BOSS ' + this.miniBoss.def.name.toUpperCase(), {
            fontFamily: CONFIG.FONT, fontSize: '15px', color: Balance.hex(CONFIG.PASTEL.white),
            stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 4
        }).setOrigin(0.5).setDepth(12);
        this.miniBossCrown = this.add.image(this.miniBoss.x, this.miniBoss.y, 'crown-tex').setDepth(5).setScale(1.1);
        Feel.bossRoar();
        this.drawMiniBossBar();
    }

    drawMiniBossBar() {
        if (!this.miniBossBar || !this.miniBoss) return;
        const w = 480, h = 16;
        const x = (CONFIG.WIDTH - w) / 2, y = 204;
        const frac = Math.max(0, this.miniBoss.hp / this.miniBoss.maxHp);
        this.miniBossBar.clear();
        this.miniBossBar.fillStyle(CONFIG.PASTEL.ink, 0.8).fillRoundedRect(x - 3, y - 3, w + 6, h + 6, 10);
        this.miniBossBar.fillStyle(CONFIG.PASTEL.panel, 1).fillRoundedRect(x, y, w, h, 8);
        if (frac > 0) {
            const fw = Math.max(8, (w - 6) * frac);
            this.miniBossBar.fillStyle(CONFIG.PASTEL.danger, 1).fillRoundedRect(x + 3, y + 3, fw, h - 6, 6);
        }
    }

    // -------------------------------------------------------------------------
    // Pool / spawn queue - same shape as GameScene's, minus the "stage clear"
    // concept (there is nothing to clear - the field is fed forever).
    // -------------------------------------------------------------------------
    spawnEntry(entry) {
        const F = CONFIG.FIELD;
        let def = SPECIES.find(s => s.id === entry.speciesId);
        const isBoss = !!entry.boss || def.kind === 'boss';
        // campaign's EXISTING cap-queued clone/summon downscale hint
        // (effects.js _skillSpawn falls back to `scene.pendingWave.unshift(
        // {..., scale: Monsters.CLONE_SCALE})` when the field is full) -
        // reused verbatim, independent of this scene's own modScale below.
        // Without this, a monster's clone/summon skill firing on a full
        // Infinite field would spawn its child at FULL size/HP instead of
        // the intended shrunk clone scale.
        if (entry.scale) {
            def = Object.assign({}, def, {
                radius: Math.max(14, Math.round(def.radius * entry.scale.r)),
                hpMult: def.hpMult * entry.scale.hp
            });
        }
        // wave-modifier HP scaling (SWARM/TANKY/GLASS RUSH/ELITE) - a
        // per-entry def override, the SAME non-invasive technique campaign
        // uses for the downscale above - never a change to monsters.js/catalog.js.
        if (!isBoss && entry.modScale && entry.modScale.hp !== 1) {
            def = Object.assign({}, def, { hpMult: def.hpMult * entry.modScale.hp });
        }
        const m = this.acquireMonster();
        const x = isBoss ? F.x + F.w / 2 : F.x + def.radius + Math.random() * (F.w - def.radius * 2);
        const y = isBoss ? F.y + F.h / 2 : F.y + def.radius + Math.random() * (F.h - def.radius * 2);
        // noSkill: entry.noSkill - a cap-queued clone/summon must never
        // re-cast its own spawn skill again (campaign's own snowball guard,
        // see effects.js _skillSpawn's `noSkill: true`).
        m.spawn(def, this.virtualStage, x, y, { boss: entry.boss, noSkill: entry.noSkill });
        if (entry.noSplit) m.noSplit = true;

        // post-spawn adjustments Monster.spawn() itself has no concept of -
        // tweaking the ALREADY-SPAWNED pooled instance's own fields, never a
        // monsters.js change (mirrors game.js's own entry.scale pattern).
        m._miniBoss = !!entry.miniBoss;
        if (m._miniBoss) {
            // dial the boss-ramp HP down to "a tough one", not a full
            // campaign king - see InfiniteBalance.miniBossHpMult's doc.
            m.maxHp = Math.max(1, Math.round(m.maxHp * CONFIG.INFINITE.miniBossHpFrac));
            m.hp = m.maxHp;
        } else if (entry.modScale && entry.modScale.speed !== 1) {
            m.speedBase *= entry.modScale.speed; // GLASS RUSH: +50% speed
        }
        this.active.push(m);
        return m;
    }

    acquireMonster() {
        for (const m of this.pool) if (!m.alive && !m.sprite.visible) return m;
        const m = new Monster(this);
        this.pool.push(m);
        return m;
    }

    removeActive(m) {
        const idx = this.active.indexOf(m);
        if (idx !== -1) this.active.splice(idx, 1);
    }

    fillFromQueue() {
        if (this.transitioning || !this.pendingWave) return;
        let alive = this.active.filter(m => m.alive).length;
        while (this.pendingWave.length > 0 && alive < CONFIG.SPAWN.concurrentMax) {
            this.spawnEntry(this.pendingWave.shift());
            alive++;
        }
    }

    onMonsterDespawned(m) {
        this.removeActive(m);
        this.fillFromQueue();
    }

    // -------------------------------------------------------------------------
    // Input & damage - identical shape to GameScene's (tap resolution, splash,
    // shield mash, crit) - portable as-is, no stage-lifecycle dependency.
    // -------------------------------------------------------------------------
    wireInput() {
        this.input.on('pointerdown', (pointer) => {
            this._lastPointer = { x: pointer.x, y: pointer.y };
            if (this.transitioning) return;

            let nearestIdx = -1, nearestDistSq = Infinity;
            for (let i = this.liveDrops.length - 1; i >= 0; i--) {
                const spr = this.liveDrops[i];
                if (!spr.active || !this.dropContains(spr, pointer.x, pointer.y)) continue;
                const dx = pointer.x - spr.x, dy = pointer.y - spr.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < nearestDistSq) { nearestDistSq = distSq; nearestIdx = i; }
            }
            if (nearestIdx !== -1) { this.collectDrop(this.liveDrops[nearestIdx], nearestIdx); return; }

            for (let i = this.active.length - 1; i >= 0; i--) {
                const m = this.active[i];
                if (m.alive && m.tappable !== false && m.contains(pointer.x, pointer.y, 24)) {
                    this.applyTap(m, pointer.x, pointer.y);
                    return;
                }
            }
        });
        this.input.on('pointermove', (pointer) => { this._lastPointer = { x: pointer.x, y: pointer.y }; });
    }

    applyTap(m, x, y) {
        const up = SaveManager.state.upgrades;
        const eff = Balance.effective(SaveManager.state);
        const critChance = Math.min(Balance.CRIT_MAX, eff.crit + this.teamBuffAdd('crit'));
        const isCrit = Math.random() < critChance;
        let dmg = eff.tapDmg * (isCrit ? 5 : 1);
        if (this.feverLeft > 0) dmg *= CONFIG.FEVER.damageMult;

        if (isCrit) {
            Feel.crit();
            if (typeof Effects !== 'undefined') Effects.damageText(this, x, y - 40, 'CRIT!', Balance.hex(CONFIG.PASTEL.crit));
        }

        this.damageMonster(m, dmg, isCrit, x, y);

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

    damageMonster(m, dmg, isCrit, x, y, source) {
        if (!m.alive || m.tappable === false) return;

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

        if (!this.shieldAllowsDamage(m, isCrit)) { Feel.shieldBlock(); return; }

        if (source !== 'thorns' && typeof Effects !== 'undefined') {
            Effects.damageText(this, m.x, m.y - m.radius - 8,
                (isCrit ? '💥' : '') + Balance.fmt(dmg),
                Balance.hex(isCrit ? CONFIG.PASTEL.crit : CONFIG.PASTEL.ink), { crit: isCrit });
        }
        const died = m.hit(dmg);
        if (m === this.miniBoss) this.drawMiniBossBar();
        if (died) {
            this.onKill(m, source);
        } else if (source !== 'thorns') {
            if (!source) Feel.hit(m.r);
            if (typeof Effects !== 'undefined' && !source) {
                const k = m.isBoss ? 1.6 : Math.min(1.2, m.r / 46);
                Effects.burst(this, x, y, m.def.color, m.isBoss ? 7 : 3, 0.5 * k + 0.3);
                if (isCrit) Effects.ring(this, x, y, CONFIG.PASTEL.crit, 40 + m.r);
            }
            if (m.quirk === 'blink' && !source) m.blinkAway();
        }
    }

    shieldAllowsDamage(m, isCrit) {
        if (m.def.kind !== 'shield' || m.shieldBroken) return true;
        if (isCrit) return true;
        const now = this.time.now;
        m.recentHits.push(now);
        m.recentHits = m.recentHits.filter(t => now - t <= 1500);
        if (m.recentHits.length >= 6) {
            m.shieldBroken = true;
            if (typeof Effects !== 'undefined') Effects.burst(this, m.x, m.y - m.radius, CONFIG.PASTEL.inkSoft);
            return true;
        }
        this.tweens.add({
            targets: m.sprite, angle: (Math.random() < 0.5 ? -1 : 1) * 12,
            duration: 60, yoyo: true,
            onComplete: () => { if (m.sprite.active) m.sprite.setAngle(0); }
        });
        return false;
    }

    // -------------------------------------------------------------------------
    // Kill resolution - score is the mode's core reward (always credited);
    // gold is gated by the daily payout cap; NO xp/level, NO milestone gems,
    // NO gear/necklace/decor drops - see InfiniteBalance's reward-guardrail
    // doc comments for why.
    // -------------------------------------------------------------------------
    onKill(m, source) {
        this.removeActive(m);

        // score - independent of monster HP/gold, per InfiniteBalance.scoreForKill.
        this.score += InfiniteBalance.scoreForKill(this.waveIndex, this.combo, this.runMult);

        // gold - gated by the daily payout cap (0 or CONFIG.INFINITE.goldMult,
        // never a partial nerf).
        const goldMult = InfiniteBalance.goldMultFor(this.payoutRun);
        if (goldMult > 0) {
            const eff = Balance.effective(SaveManager.state);
            const goldBase = Balance.goldPerMob(this.virtualStage);
            let mult = m._miniBoss
                ? CONFIG.BOSS.goldMult * CONFIG.INFINITE.miniBossHpFrac
                : m.def.goldMult;
            if (source === 'pet:leaf') mult *= 1.5;
            const goldBuff = 1 + this.teamBuffAdd('gold');
            const gold = Math.max(1, Math.round(goldBase * mult * eff.goldMult * goldBuff * goldMult));
            SaveManager.addGold(gold);
            this.runGoldEarned += gold;
            if (typeof Effects !== 'undefined') {
                Effects.damageText(this, m.x, m.y, '+' + Balance.fmt(gold), Balance.hex(CONFIG.PASTEL.gold));
            }
        }

        // harmless completionist stats only - no XP/level (would leak
        // permanent campaign power via Balance.levelDamageMult) and no
        // milestone gems (economy-gated to personal-best runs only).
        SaveManager.state.totalKills++;
        const kills = SaveManager.state.kills || (SaveManager.state.kills = {});
        kills[m.def.id] = (kills[m.def.id] || 0) + 1;

        if (!source) {
            this.combo++;
            this.comboLeft = CONFIG.COMBO.windowMs / 1000;
            this.setCombo(this.combo);
            Feel.kill(this.combo, m.r);
            if (CONFIG.COMBO.milestones.indexOf(this.combo) !== -1) {
                this.runMult = InfiniteBalance.runMultAfterComboMilestone(this.runMult);
                if (typeof Effects !== 'undefined') {
                    Effects.screenFlash(this, CONFIG.PASTEL.accent, 0.18, 300);
                    Effects.ring(this, CONFIG.WIDTH / 2, 168, CONFIG.PASTEL.accent, 220);
                    Effects.confetti(this, CONFIG.WIDTH / 2, 200);
                }
                Sfx.crit();
            }
        } else {
            Sfx.monsterDeath(m.r);
        }
        Feel.coin();

        this.addFeverCharge(1);

        if (typeof Effects !== 'undefined') Effects.killFx(this, m, this.feverLeft > 0);

        if (!m.isBoss && Math.random() < CONFIG.DROPS.chance) this.spawnItemDrop(m.x, m.y);

        this.onSpecialDeath(m);
        m.burst();
        this.fillFromQueue();
        this.refreshHud();
    }

    onSpecialDeath(m) {
        const kind = m.def.kind;

        if (m._miniBoss) {
            this.runMult = InfiniteBalance.runMultAfterMiniBossKill(this.runMult);
            const bx = m.x, by = m.y;
            const tint = m.def.color || CONFIG.PASTEL.accent;
            Feel.bossBoom();
            this.cameras.main.shake(CONFIG.BOSS.slowMoMs + 100, 0.01);
            this.tweens.add({
                targets: this.cameras.main, zoom: 1.1,
                duration: CONFIG.BOSS.slowMoMs, yoyo: true, ease: 'Quad.easeOut'
            });
            if (typeof Effects !== 'undefined') {
                Effects.screenFlash(this, CONFIG.PASTEL.white, 0.4, 320);
                Effects.flash(this, bx, by, tint, 420);
                Effects.burst(this, bx, by, tint, 24, 2.0);
                Effects.ring(this, bx, by, CONFIG.PASTEL.white, 380);
                Effects.confetti(this, bx, by);
            }
            if (this.miniBossCrown) {
                const c = this.miniBossCrown;
                this.miniBossCrown = null;
                this.tweens.add({
                    targets: c, y: c.y - 260, angle: 720, alpha: 0, duration: 700,
                    ease: 'Quad.easeOut', onComplete: () => c.destroy()
                });
            }
            if (this.miniBossBar) { this.miniBossBar.destroy(); this.miniBossBar = null; }
            if (this.miniBossName) { this.miniBossName.destroy(); this.miniBossName = null; }
            this.miniBoss = null;
            return;
        }

        if (kind === 'splitter' && !m.noSplit) {
            Feel.splitPop();
            const childDef = SPECIES.find(s => s.id === m.def.childId);
            for (const dx of [-34, 34]) {
                const trueAlive = this.active.filter(x => x.alive).length;
                if (trueAlive < CONFIG.SPAWN.concurrentMax) {
                    const c = this.acquireMonster();
                    c.spawn(childDef, this.virtualStage, m.x + dx, m.y + Phaser.Math.Between(-16, 16));
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

    // -------------------------------------------------------------------------
    // Fail state - single life, instant end (no stage-retry, unlike campaign).
    // -------------------------------------------------------------------------
    onNestBroken() {
        if (this.transitioning) return;
        this.transitioning = true;
        this.stopTrickle();
        this.stopWaveTimer();
        this.pendingWave = [];
        this.clearDrops();
        Feel.bossBoom();

        for (const m of this.active) { if (m.alive) { m.alive = false; m.burst(); } }
        if (this.miniBossBar) { this.miniBossBar.destroy(); this.miniBossBar = null; }
        if (this.miniBossName) { this.miniBossName.destroy(); this.miniBossName = null; }
        if (this.miniBossCrown) { this.miniBossCrown.destroy(); this.miniBossCrown = null; }
        this.miniBoss = null;

        this.endRun();
    }

    endRun() {
        const survivalSec = (this.time.now - this.runStartAt) / 1000;
        this.score = Math.round(this.score + InfiniteBalance.endBonus(this.waveIndex, survivalSec));

        const st = SaveManager.state;
        const prevBestScore = st.scoreBest.infinite;
        const isBest = InfiniteBalance.isNewPersonalBest(prevBestScore, this.score);

        st.infiniteBest.wave = Math.max(st.infiniteBest.wave || 0, this.waveIndex);
        if (isBest) {
            st.scoreBest.infinite = this.score;
            st.infiniteBest.score = this.score;
        }

        // NOTE: the daily payout-slot counter (st.infiniteRunsToday) is NO
        // LONGER incremented here - it was already consumed at run START
        // (see create()'s InfiniteBalance.consumePayoutSlotAtStart call) so
        // the back-button/app-kill bypass can't skip it by never reaching
        // this function at all.
        let gemsAwarded = 0;
        if (this.payoutRun && isBest) {
            gemsAwarded = CONFIG.INFINITE.gemsOnPersonalBest;
            st.gems += gemsAwarded;
        }
        SaveManager.persist();

        // v7 T13 leaderboard - offline-safe, fire-and-forget, NEVER blocks
        // the summary screen. Only ever called on a new local best, mirroring
        // Leaderboard's own contract note ("callers only invoke on a NEW
        // LOCAL best") - exactly how game.js's checkStageTimeRecord gates
        // reportStageRecord.
        let pending = null;
        if (isBest && typeof Leaderboard !== 'undefined') {
            pending = Leaderboard.reportScoreRecord('infinite', this.score).catch(() => ({ offline: true }));
        }

        showInfiniteSummary(this, {
            score: this.score, wave: this.waveIndex, survivalSec,
            isBest, gemsAwarded, goldEarned: this.runGoldEarned,
            payoutRun: this.payoutRun, pending
        });
    }

    // -------------------------------------------------------------------------
    // Fever - tuned to fill CONFIG.INFINITE.feverChargeMult (1.5x) faster than
    // campaign, the mode's signature "release valve" beat (Persona D).
    // Everything else (Effects.feverOverlay, Feel, the damage/splash bonus in
    // applyTap above) is byte-for-byte reused from campaign.
    //
    // v7 T12 economy-safety fix: charges/reads this.infFeverGauge (SCENE-
    // LOCAL) instead of the shared SaveManager.state.feverGauge that
    // game.js's addFeverCharge uses - see the isolation note on this.
    // infFeverGauge's init in create(). Balance.feverMult(upgrades.fever) is
    // still read from SaveManager.state because it's a permanent player
    // UPGRADE level, not the mutable gauge itself - reading it doesn't leak
    // anything (campaign can't change mid-Infinite-run).
    // -------------------------------------------------------------------------
    addFeverCharge(n) {
        if (this.feverLeft > 0) return;
        const st = SaveManager.state;
        this.infFeverGauge = Math.min(CONFIG.FEVER.gaugeMax,
            this.infFeverGauge + n * Balance.feverMult(st.upgrades.fever) * CONFIG.INFINITE.feverChargeMult);
        this.events.emit('feverChanged');
        if (this.infFeverGauge >= CONFIG.FEVER.gaugeMax) this.triggerFever();
    }

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
            this._feverOverlay = Effects.feverOverlay(this);
        }
        const banner = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.3, 'FEVER!!', {
            fontFamily: CONFIG.FONT, fontSize: '96px', color: Balance.hex(CONFIG.PASTEL.fever),
            stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 12
        }).setOrigin(0.5).setDepth(20).setScale(0.2);
        this.tweens.add({ targets: banner, scale: 1, duration: 260, ease: 'Back.easeOut' });
        this.tweens.add({ targets: banner, alpha: 0, delay: 800, duration: 300, onComplete: () => banner.destroy() });
    }

    updateFever(dt) {
        if (this.feverLeft <= 0) return;
        this.feverLeft -= dt;
        this._feverHue = ((this._feverHue || 0) + dt * 0.8) % 1;
        const c = Phaser.Display.Color.HSVToRGB(this._feverHue, 0.45, 0.35);
        this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
        if (this._feverOverlay) this._feverOverlay.update(dt);
        if (this.feverLeft <= 0) {
            this.feverLeft = 0;
            // v7 T12 economy-safety fix: reset the SCENE-LOCAL gauge only -
            // never SaveManager.state.feverGauge (that would both leak a
            // reset the campaign never asked for AND, prior to this fix, was
            // the same shared field Infinite had been charging up in the
            // first place). No SaveManager.persist() needed - this field
            // never lived in the save.
            this.infFeverGauge = 0;
            this.cameras.main.setBackgroundColor(CONFIG.COLORS.bg);
            this.events.emit('feverChanged');
            this.stopFeverEffects();
            Feel.feverEnd();
        }
    }

    // -------------------------------------------------------------------------
    // Item drops - v7 T12 economy rule: ONLY non-economic drops (heal/fever/
    // bomb) plus gold (economy-gated by the daily cap, same as per-kill
    // gold). NO gear/necklace/decor/gem drops in Infinite mode at all - those
    // are campaign's progression-defining items; letting Infinite also mint
    // them would make it a strictly-better farm (ideation Persona C).
    // -------------------------------------------------------------------------
    _rollDropType() {
        const allow = { gold: true, bomb: true, heal: true, fever: true };
        const weights = CONFIG.DROPS.weights.filter(w => allow[w[0]]);
        const total = weights.reduce((a, w) => a + w[1], 0);
        let roll = Math.random() * total;
        for (const [type, w] of weights) {
            roll -= w;
            if (roll <= 0) return type;
        }
        return 'gold';
    }

    spawnItemDrop(x, y) {
        const type = this._rollDropType();
        const tex = { gold: 'coin-tex', bomb: 'bomb-tex', heal: 'heart-tex', fever: 'up-fever' }[type];
        const tint = { fever: CONFIG.PASTEL.fever }[type] || CONFIG.PASTEL.white;

        const spr = this.add.image(x, y - 26, tex).setDepth(9).setDisplaySize(44, 44);
        if (tint !== CONFIG.PASTEL.white) spr.setTint(tint);
        if (typeof Effects !== 'undefined') Effects.ring(this, x, y, tint, 60);

        spr.dropType = type;
        spr.dropX = x;
        spr.dropY = y;
        spr.spawnTime = this.time.now;

        this.tweens.add({ targets: spr, y, duration: 340, ease: 'Bounce.easeOut' });
        this.tweens.add({
            targets: spr, scale: spr.scale * 1.16, duration: 460,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        spr.setInteractive({ useHandCursor: true });
        const hitSize = Math.max(48, spr.width);
        spr.input.hitArea.setSize(hitSize, hitSize);

        this.liveDrops.push(spr);
        this.startDropTick();
    }

    dropContains(spr, x, y) {
        const r = Math.max(CONFIG.DROPS.tapRadius, spr.displayWidth / 2, spr.displayHeight / 2);
        const dx = x - spr.x, dy = y - spr.y;
        return dx * dx + dy * dy <= r * r;
    }

    collectDrop(spr, idx) {
        this.liveDrops.splice(idx, 1);
        this.tweens.killTweensOf(spr);
        const { dropType, dropX, dropY } = spr;
        spr.destroy();
        Haptic.tick(0.3);
        this.applyDrop(dropType, dropX, dropY);
    }

    startDropTick() {
        if (this.dropTickEvent) return;
        this.dropTickEvent = this.time.addEvent({ delay: 150, loop: true, callback: () => this.tickDrops() });
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

    clearDrops() {
        for (const spr of this.liveDrops) {
            this.tweens.killTweensOf(spr);
            if (spr.active) spr.destroy();
        }
        this.liveDrops.length = 0;
        this.stopDropTick();
    }

    applyDrop(type, x, y) {
        const eff = Balance.effective(SaveManager.state);
        let msg = '', color = Balance.hex(CONFIG.PASTEL.ink);

        switch (type) {
            case 'gold': {
                const goldMult = InfiniteBalance.goldMultFor(this.payoutRun);
                if (goldMult > 0) {
                    const gold = Math.round(Balance.goldPerMob(this.virtualStage) * CONFIG.DROPS.goldMult * eff.goldMult * goldMult);
                    SaveManager.addGold(gold);
                    this.runGoldEarned += gold;
                    this.refreshHud();
                    msg = '+' + Balance.fmt(gold) + ' GOLD!'; color = Balance.hex(CONFIG.PASTEL.gold);
                    if (typeof Effects !== 'undefined') Effects.coinPop(this, x, y, 6, { x: CONFIG.WIDTH - 120, y: 60 });
                } else {
                    msg = 'DAILY CAP REACHED'; color = Balance.hex(CONFIG.PASTEL.inkSoft);
                }
                break;
            }
            case 'bomb': {
                const dmg = eff.tapDmg * CONFIG.DROPS.bombMult;
                if (typeof Effects !== 'undefined') {
                    Effects.screenFlash(this, CONFIG.PASTEL.white, 0.4, 350);
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
                    this.nest.hp = Math.min(this.nest.maxHp, this.nest.hp + this.nest.maxHp * CONFIG.DROPS.healPct);
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
        }

        if (msg && typeof Effects !== 'undefined') {
            Effects.damageText(this, CONFIG.WIDTH / 2, 160, msg, color, { big: true });
        }
    }

    // -------------------------------------------------------------------------
    // Monster-offense scene contract - Monster._updateAttack/_updateStatus
    // call these directly (see monsters.js melee/slam/charge/spit/spray/zap
    // cases + the poison/burn DoT tick). Byte-for-byte copies of GameScene's
    // own implementations (game.js) - no change to monsters.js/pets.js.
    // -------------------------------------------------------------------------
    _petElemHit(m, a, dmg) {
        const { dmg: edmg, mult } = Balance.applyElement(dmg, m.def.elem, a.def.element);
        if (mult !== 1 && typeof Effects !== 'undefined') {
            Effects.damageText(this, a.sprite.x, a.sprite.y - 68,
                mult > 1 ? 'Super!' : 'Resisted',
                Balance.hex(mult > 1 ? CONFIG.PASTEL.gold : CONFIG.PASTEL.inkSoft));
        }
        return edmg;
    }

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
                this.damageNest(3 * (m.isBoss ? 3 : 1) * Balance.monsterAtkMult(m.stage));
            }
        }
    }

    damageNest(flat) {
        if (!this.nest || this.nest.broken) return;
        this.nest.hp -= flat;
        this.nest.redraw();
        if (typeof Effects !== 'undefined') {
            Effects.burst(this, CONFIG.NEST.x, CONFIG.NEST.y - 30, CONFIG.PASTEL.danger, 5, 0.6);
        }
        if (this.nest.hp <= 0 && !this.nest.broken) {
            this.nest.broken = true;
            this.nest.sprite.setTint(CONFIG.PASTEL.inkSoft).setAlpha(0.7);
            this.onNestBroken();
        }
    }

    monsterProjectile(m, tx, ty, dmg, isNest, spreadAngle) {
        const ang = Math.atan2(ty - m.y, tx - m.x) + (spreadAngle || 0);
        const spr = this.add.image(m.x, m.y, 'pop-tex').setDepth(7).setDisplaySize(26, 26).setTint(m.def.color);
        const dist = Math.hypot(tx - m.x, ty - m.y) + 40;
        const ex = m.x + Math.cos(ang) * dist, ey = m.y + Math.sin(ang) * dist;
        this.tweens.add({
            targets: spr, x: ex, y: ey,
            duration: dist / 0.45,
            ease: 'Linear',
            onComplete: () => {
                if (typeof Effects !== 'undefined') Effects.burst(this, ex, ey, m.def.color, 5, 0.6);
                this.monsterStrikeArea(m, ex, ey, 60, dmg, true);
                spr.destroy();
            }
        });
    }

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
        this.tweens.add({ targets: g, alpha: 0, duration: 180, onComplete: () => g.destroy() });
        if (typeof Effects !== 'undefined') Effects.flash(this, tx, ty, CONFIG.PASTEL.elements.electric.base, 60);
        this.monsterStrikeArea(m, tx, ty, 50, dmg, true);
    }

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

    // -------------------------------------------------------------------------
    update(time, delta) {
        const dt = delta / 1000;

        for (const m of this.active.slice()) {
            if (m.alive) m.update(dt, this._lastPointer);
        }

        if (this.nest) this.nest.update(dt, this.active.filter(m => m.alive && m.biting));
        if (this.fieldPets) this.fieldPets.update(dt);

        if (this.miniBoss && this.miniBoss.alive && this.miniBossCrown) {
            this.miniBossCrown.setPosition(
                this.miniBoss.x, this.miniBoss.y - this.miniBoss.r - 30 + Math.sin(time * 0.004) * 6);
        }

        if (this.comboLeft > 0) {
            this.comboLeft -= dt;
            if (this.comboLeft <= 0) { this.combo = 0; this.comboText.setText(''); }
        }

        this.updateFever(dt);
    }
}

// =============================================================================
// End-of-run summary - styled after ui.js's showSettlement() (dim scrim +
// panel + banner scale-in), per the ideation's Persona D ("should mirror the
// existing showSettlement() visual language rather than invent a new visual
// grammar"). Score/wave/survival-time/new-best badge, reward line (or "daily
// cap reached"), then a rank preview that fills in once the fire-and-forget
// Leaderboard submit resolves (mirrors ui.js's showRecordPopup pattern).
// =============================================================================
function showInfiniteSummary(scene, opts) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const items = [];

    items.push(scene.add.rectangle(W / 2, H / 2, W, H, 0x0a0714, 0.82).setDepth(30).setInteractive());
    items.push(scene.add.nineslice(W / 2, H * 0.42, 'btn-tex', 0, 600, 620, 24, 24, 24, 24)
        .setTint(CONFIG.PASTEL.panel).setDepth(30));

    items.push(scene.add.text(W / 2, H * 0.2, '💀 RUN OVER', {
        fontFamily: CONFIG.FONT, fontSize: '28px', color: Balance.hex(CONFIG.PASTEL.dangerText)
    }).setOrigin(0.5).setDepth(31));

    const scoreT = scene.add.text(W / 2, H * 0.27, Balance.fmt(opts.score), {
        fontFamily: CONFIG.FONT, fontSize: '48px', color: Balance.hex(CONFIG.PASTEL.accent),
        stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 8
    }).setOrigin(0.5).setDepth(31).setScale(0.3);
    items.push(scoreT);
    scene.tweens.add({ targets: scoreT, scale: 1, duration: 260, ease: 'Back.easeOut' });

    if (opts.isBest) {
        items.push(scene.add.text(W / 2, H * 0.335, '🏅 ' + I18n.t('infinite.newBest'), {
            fontFamily: CONFIG.FONT, fontSize: '18px', color: Balance.hex(CONFIG.PASTEL.goodText)
        }).setOrigin(0.5).setDepth(31));
    }

    items.push(scene.add.text(W / 2, H * 0.39,
        'WAVE ' + opts.wave + '   ·   ' + Math.floor(opts.survivalSec) + 's', {
        fontFamily: CONFIG.FONT, fontSize: '17px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
    }).setOrigin(0.5).setDepth(31));

    let rewardLine = I18n.t('infinite.dailyCapReached');
    let rewardColor = CONFIG.PASTEL.inkSoft;
    if (opts.payoutRun) {
        rewardLine = '+' + Balance.fmt(opts.goldEarned) + ' GOLD' + (opts.gemsAwarded ? '   +' + opts.gemsAwarded + ' 💎' : '');
        rewardColor = CONFIG.PASTEL.goldText;
    }
    items.push(scene.add.text(W / 2, H * 0.45, rewardLine, {
        fontFamily: CONFIG.FONT, fontSize: '17px', color: Balance.hex(rewardColor), align: 'center', wordWrap: { width: 520 }
    }).setOrigin(0.5).setDepth(31));

    const rankText = scene.add.text(W / 2, H * 0.5, opts.pending ? I18n.t('infinite.checkingRank') : '', {
        fontFamily: CONFIG.FONT, fontSize: '15px', color: Balance.hex(CONFIG.PASTEL.inkSoft),
        align: 'center', wordWrap: { width: 520 }
    }).setOrigin(0.5).setDepth(31);
    items.push(rankText);

    if (opts.pending && typeof opts.pending.then === 'function') {
        opts.pending.then(res => {
            if (!res || res.offline) { rankText.setText(''); return; }
            const topLine = res.globalBest
                ? ' · #1 ' + (res.globalBest.nickname || '???') + ' ' + Balance.fmt(res.globalBest.score) : '';
            rankText.setText(I18n.t('infinite.globalRank', { rank: res.rank }) + topLine);
            fitToWidth(rankText, 520);
            scene.cameras.main.flash(200, 0, 229, 255);
        }).catch(() => rankText.setText(''));
    }

    const again = makeUiButton(scene, W / 2, H * 0.6, 480, 92, I18n.t('infinite.playAgain'), CONFIG.PASTEL.accent, () => {
        scene.scene.restart();
    }, undefined, { pad: 10 });
    const menu = makeUiButton(scene, W / 2, H * 0.6 + 112, 480, 92, I18n.t('common.menu'), CONFIG.PASTEL.accent, () => {
        SmooshGame.goto('SubMainScene'); // v7 T14: back -> the hub, not the splash
    }, undefined, { pad: 10 });

    if (typeof Effects !== 'undefined' && opts.isBest) Effects.confetti(scene, W / 2, H * 0.3);
}
