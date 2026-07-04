// =============================================================================
// SMOOSH! - nestscene.js
// v3.5 Task 4: the LIVING NEST - a cozy hangout scene, separate from nest.js
// (the battle NEST defend-target) and from FieldPets (the combat roam AI).
// Every owned pet ambles around a pastel field, naps, chases a friend, or
// bounces on a toy; tap one for a jump + hearts reaction. My-nest mode also
// lets you place/remove owned decor on a 6x4 grid (Decor.canPlace, Task 3).
//
// Pure half (NestAI) is exported first so tests/nest.test.js can require()
// this file from plain Node - same dual-mode pattern as stagemap.js/dex.js.
// =============================================================================

const NestAI = {
    STATES: ['wander', 'nap', 'chase', 'play'],

    // Per-state dwell time (seconds) once a state is entered.
    DWELL_MIN: 2,
    DWELL_MAX: 6,

    // Pure transition table. current = the state an agent is LEAVING;
    // rng() -> [0,1); hasToys = at least one placed decor item with
    // cat==='toy' exists in the nest right now.
    //
    // Legal next states from ANY current state:
    //   wander - always
    //   chase  - always
    //   nap    - any time EXCEPT immediately after another nap (an agent
    //            that just woke up doesn't fall right back asleep)
    //   play   - only when hasToys
    //
    // Weighted (not uniform) so wander reads as the "default" behavior and
    // nap/play feel like occasional beats - but every legal state still
    // gets a real, reachable slice of the roll (verified by tests/nest.test.js
    // sweeping rng across [0,1)).
    nextState(current, rng, hasToys) {
        const WEIGHT = { wander: 0.40, chase: 0.25, nap: 0.20, play: 0.15 };
        const legal = ['wander', 'chase'];
        if (current !== 'nap') legal.push('nap');
        if (hasToys) legal.push('play');

        const total = legal.reduce((sum, k) => sum + WEIGHT[k], 0);
        let roll = rng() * total;
        for (const k of legal) {
            roll -= WEIGHT[k];
            if (roll <= 0) return k;
        }
        return legal[legal.length - 1]; // float rounding fallback
    },

    dwell(rng) {
        return this.DWELL_MIN + rng() * (this.DWELL_MAX - this.DWELL_MIN);
    }
};

if (typeof module !== 'undefined') module.exports = { NestAI };

// =============================================================================
// NestScene - roam field + touch reactions + my-nest edit mode. Guarded so
// this file stays require()-able (and side-effect-free) from plain Node
// tests - see the CROSS-SCRIPT SCOPING RULE note in stagemap.js: a `class`
// declared directly inside this `if` block would be block-scoped and
// invisible to main.js's `scene: [...]` array, so the class EXPRESSION is
// assigned to the outer `let NestScene` binding instead.
// =============================================================================
let NestScene; // eslint-disable-line no-unused-vars

if (typeof Phaser !== 'undefined') {

    const NEST_GRID_X0 = 42, NEST_GRID_Y0 = 268, NEST_CELL_W = 106, NEST_CELL_H = 138;
    const NEST_ROAM = { x: 30, y: 190, w: 660, h: 700 }; // pets wander/chase/play within this box
    const NEST_MAX_MINE = 20, NEST_MAX_VISIT_SIDE = 10;
    const NEST_TRAY_PER_PAGE = 8;

    NestScene = class NestScene extends Phaser.Scene {
        constructor() { super({ key: 'NestScene' }); }

        init(data) {
            this.visit = (data && data.visit) || null;
            this.editMode = false;
            this.editHeldId = null;
            this.trayPage = 0;
        }

        create() {
            const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;

            this.add.rectangle(W / 2, H / 2, W, H, CONFIG.COLORS.bg).setDepth(0);
            // pastel field ground - same "subtle boundary" styling GameScene
            // uses for its play field (game.js create()), reused here so the
            // nest reads as a cozy corner of the same world.
            this.add.rectangle(NEST_ROAM.x + NEST_ROAM.w / 2, NEST_ROAM.y + NEST_ROAM.h / 2,
                NEST_ROAM.w, NEST_ROAM.h, 0x1a1530)
                .setStrokeStyle(2, 0x2a2244).setDepth(0);
            for (const [bx, by, br, c] of [[90, 260, 90, 0x201a33], [630, 320, 70, 0x1c1631],
                [110, 800, 80, 0x1c1631], [610, 840, 100, 0x201a33]]) {
                this.add.circle(bx, by, br, c).setDepth(0);
            }

            this.decorViews = [];
            this.gridCells = [];
            this.agents = [];
            this._toast = null;

            this.buildHeader();
            this.workingPlaced = (SaveManager.state.decorPlaced || []).slice();
            this.buildDecorLayer();
            this.buildAgents();

            if (!this.visit) this.buildEditToggle();

            this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.hideToast(true));
        }

        // -------------------------------------------------------------------
        // Header
        // -------------------------------------------------------------------
        buildHeader() {
            const W = CONFIG.WIDTH;
            this.add.rectangle(W / 2, 76, W, 152, CONFIG.COLORS.bg).setDepth(5);
            const back = this.add.text(44, 56, '‹', {
                fontFamily: 'Arial, sans-serif', fontSize: '48px', fontStyle: 'bold', color: '#8d86a8'
            }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
            back.on('pointerdown', () => SmooshGame.goto('MenuScene'));

            this.add.text(W / 2, 56, I18n.t('nest.title'), {
                fontFamily: 'Arial, sans-serif', fontSize: '40px', fontStyle: 'bold', color: '#7dffb2'
            }).setOrigin(0.5).setDepth(10);

            if (this.visit) {
                this.add.text(W / 2, 104, I18n.t('nest.visiting', { name: this.visit.nickname || '???' }), {
                    fontFamily: 'Arial, sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffd54a'
                }).setOrigin(0.5).setDepth(10);
            }
        }

        // -------------------------------------------------------------------
        // Decor layer (static art; interactive taps only handled in edit mode)
        // -------------------------------------------------------------------
        cellCenter(gx, gy) {
            return {
                x: NEST_GRID_X0 + gx * NEST_CELL_W + NEST_CELL_W / 2,
                y: NEST_GRID_Y0 + gy * NEST_CELL_H + NEST_CELL_H / 2
            };
        }

        // source: array of {id,gx,gy} - mine's workingPlaced, or the
        // visited player's frozen decor snapshot.
        buildDecorLayer() {
            this.decorViews.forEach(v => v.sprite.destroy());
            this.decorViews = [];
            const placed = this.visit ? (this.visit.decor || []) : this.workingPlaced;
            for (const p of placed) {
                const def = Decor.byId(p.id);
                if (!def) continue;
                // Visit decor comes from a REMOTE snapshot (another player's
                // save via Social.getUser) - never trust its gx/gy shape.
                // Skip anything non-finite or out of the 6x4 grid silently.
                if (!Number.isFinite(p.gx) || !Number.isFinite(p.gy) ||
                    p.gx < 0 || p.gx >= Decor.GRID.cols || p.gy < 0 || p.gy >= Decor.GRID.rows) continue;
                const c = this.cellCenter(p.gx, p.gy);
                const sprite = this.add.image(c.x, c.y, 'decor-' + p.id).setDepth(1).setDisplaySize(76, 76);
                this.decorViews.push({ id: p.id, gx: p.gx, gy: p.gy, sprite });
            }
        }

        hasToys() {
            const placed = this.visit ? (this.visit.decor || []) : this.workingPlaced;
            return placed.some(p => { const d = Decor.byId(p.id); return d && d.cat === 'toy'; });
        }

        toyCells() {
            const placed = this.visit ? (this.visit.decor || []) : this.workingPlaced;
            return placed.filter(p => { const d = Decor.byId(p.id); return d && d.cat === 'toy'; });
        }

        // -------------------------------------------------------------------
        // Pet agents
        // -------------------------------------------------------------------
        buildAgents() {
            this.agents.forEach(a => { a.sprite.destroy(); if (a.badge) a.badge.destroy(); });
            this.agents = [];

            const mine = SaveManager.state.pets.slice(0, this.visit ? NEST_MAX_VISIT_SIDE : NEST_MAX_MINE);
            for (const p of mine) this.agents.push(this.spawnAgent(p.species, true));

            if (this.visit) {
                const theirs = (this.visit.petIds || []).slice(0, NEST_MAX_VISIT_SIDE);
                for (const sp of theirs) this.agents.push(this.spawnAgent(sp, false));
            }
        }

        spawnAgent(speciesId, isMine) {
            const def = PET_SPECIES.find(p => p.id === speciesId) || PET_SPECIES[0];
            const x = Phaser.Math.Between(NEST_ROAM.x + 40, NEST_ROAM.x + NEST_ROAM.w - 40);
            const y = Phaser.Math.Between(NEST_ROAM.y + 40, NEST_ROAM.y + NEST_ROAM.h - 40);
            const size = 52;
            const sprite = this.add.image(x, y, 'pet-' + def.id).setDepth(4).setDisplaySize(size, size)
                .setInteractive({ useHandCursor: true });
            if (!isMine) sprite.setAlpha(0.88); // subtle "guest" tell
            const badge = this.add.text(x, y - size * 0.72, '', {
                fontFamily: 'Arial, sans-serif', fontSize: '18px'
            }).setOrigin(0.5).setDepth(5);

            const agent = {
                def, isMine, sprite, badge, size,
                state: 'wander', stateT: NestAI.dwell(Math.random),
                tx: x, ty: y, // wander/chase movement target
                chaseTarget: null,
                toyCell: null
            };
            this.pickWanderTarget(agent);
            sprite.on('pointerdown', () => this.tapAgent(agent));
            return agent;
        }

        pickWanderTarget(a) {
            a.tx = Phaser.Math.Between(NEST_ROAM.x + 40, NEST_ROAM.x + NEST_ROAM.w - 40);
            a.ty = Phaser.Math.Between(NEST_ROAM.y + 40, NEST_ROAM.y + NEST_ROAM.h - 40);
        }

        enterState(a, state) {
            a.state = state;
            a.stateT = NestAI.dwell(Math.random);
            a.badge.setText(state === 'nap' ? '💤' : '');
            a.sprite.setAlpha(state === 'nap' ? 0.55 : (a.isMine ? 1 : 0.88));
            if (state === 'wander') {
                this.pickWanderTarget(a);
            } else if (state === 'chase') {
                const others = this.agents.filter(o => o !== a);
                a.chaseTarget = others.length ? Phaser.Utils.Array.GetRandom(others) : null;
                if (!a.chaseTarget) { a.state = 'wander'; this.pickWanderTarget(a); }
            } else if (state === 'play') {
                const toys = this.toyCells();
                if (toys.length) {
                    const t = Phaser.Utils.Array.GetRandom(toys);
                    a.toyCell = this.cellCenter(t.gx, t.gy);
                } else {
                    a.state = 'wander';
                    this.pickWanderTarget(a);
                }
            }
        }

        update(time, delta) {
            if (this.editMode) return; // pets freeze in place while the grid/tray overlay is up
            const dt = Math.min(0.05, delta / 1000);
            const toys = this.hasToys();

            for (const a of this.agents) {
                a.stateT -= dt;
                if (a.stateT <= 0) this.enterState(a, NestAI.nextState(a.state, Math.random, toys));

                if (a.state === 'wander') {
                    this.moveToward(a, a.tx, a.ty, 60, dt);
                } else if (a.state === 'chase' && a.chaseTarget) {
                    this.moveToward(a, a.chaseTarget.sprite.x, a.chaseTarget.sprite.y, 90, dt);
                } else if (a.state === 'play' && a.toyCell) {
                    const arrived = this.moveToward(a, a.toyCell.x, a.toyCell.y, 90, dt);
                    if (arrived) {
                        a._bounceT = (a._bounceT || 0) + dt * 6;
                        a.sprite.y = a.toyCell.y - Math.abs(Math.sin(a._bounceT)) * 14;
                    }
                } else if (a.state === 'nap') {
                    // stays put; only the zzz badge's alpha breathes
                    a._bobT = (a._bobT || 0) + dt;
                    a.badge.setAlpha(0.6 + 0.4 * Math.sin(a._bobT * 3));
                }
                a.badge.setPosition(a.sprite.x, a.sprite.y - a.size * 0.72);
            }
        }

        // Returns true once within arrival radius of (tx,ty).
        moveToward(a, tx, ty, speed, dt) {
            const dx = tx - a.sprite.x, dy = ty - a.sprite.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 6) return true;
            const step = Math.min(dist, speed * dt);
            a.sprite.x += (dx / dist) * step;
            a.sprite.y += (dy / dist) * step;
            return false;
        }

        // -------------------------------------------------------------------
        // Touch reactions
        // -------------------------------------------------------------------
        tapAgent(a) {
            // Defense in depth: enterEdit() already disableInteractive()s
            // every agent sprite, so this listener can't actually fire while
            // editing - but guard anyway in case that ever changes.
            if (this.editMode) return;
            this.tweens.add({
                targets: a.sprite, y: a.sprite.y - 20, duration: 110, yoyo: true, ease: 'Quad.easeOut'
            });
            if (typeof Effects !== 'undefined') {
                Effects.burst(this, a.sprite.x, a.sprite.y - a.size * 0.4, 0xff6b8a, 8, 0.7);
            }
            Sfx.petYelp(a.def.element);
            Haptic.tick(1);
        }

        // -------------------------------------------------------------------
        // Edit mode (my nest only)
        // -------------------------------------------------------------------
        buildEditToggle() {
            const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
            this.editBtn = makeUiButton(this, W / 2, H - 70, 260, 76,
                I18n.t('nest.edit'), 0x2f89ff, () => this.enterEdit());
        }

        enterEdit() {
            this.editMode = true;
            this.editHeldId = null;
            this.trayPage = 0;
            this.editBtn.destroyAll();
            this.editBtn = null;
            // Pets freeze AND lose interactivity while editing - a wandering
            // pet can never sit on top of a grid cell and steal its tap.
            this.agents.forEach(a => { a.sprite.disableInteractive(); a.sprite.setAlpha(0.5); });
            this.buildGridOverlay();
            this.buildTray();
            this.buildSaveButton();
        }

        exitEdit(persisted) {
            this.editMode = false;
            this.editHeldId = null;
            this.destroyGridOverlay();
            this.destroyTray();
            if (this.saveBtn) { this.saveBtn.destroyAll(); this.saveBtn = null; }
            if (persisted) this.buildDecorLayer();
            else this.workingPlaced = (SaveManager.state.decorPlaced || []).slice();
            this.agents.forEach(a => {
                a.sprite.setInteractive({ useHandCursor: true });
                a.sprite.setAlpha(a.state === 'nap' ? 0.55 : (a.isMine ? 1 : 0.88));
            });
            this.buildEditToggle();
        }

        buildGridOverlay() {
            this.gridCells = [];
            for (let gy = 0; gy < Decor.GRID.rows; gy++) {
                for (let gx = 0; gx < Decor.GRID.cols; gx++) {
                    const c = this.cellCenter(gx, gy);
                    const rect = this.add.rectangle(c.x, c.y, NEST_CELL_W - 8, NEST_CELL_H - 8, 0xffffff, 0.05)
                        .setStrokeStyle(2, 0x342a52, 0.7).setDepth(2).setInteractive({ useHandCursor: true });
                    rect.on('pointerdown', () => this.tapCell(gx, gy));
                    this.gridCells.push({ gx, gy, rect });
                }
            }
        }

        destroyGridOverlay() {
            this.gridCells.forEach(c => c.rect.destroy());
            this.gridCells = [];
        }

        placedAt(gx, gy) {
            return this.workingPlaced.find(p => p.gx === gx && p.gy === gy) || null;
        }

        tapCell(gx, gy) {
            const existing = this.placedAt(gx, gy);
            if (existing) {
                // tap a placed item -> remove it, freeing up that copy again.
                this.workingPlaced = this.workingPlaced.filter(p => p !== existing);
                this.buildDecorLayer();
                this.refreshTray();
                return;
            }
            if (!this.editHeldId) return;
            const shim = { decorOwned: SaveManager.state.decorOwned, decorPlaced: this.workingPlaced };
            if (!Decor.canPlace(shim, this.editHeldId, gx, gy)) return;
            this.workingPlaced.push({ id: this.editHeldId, gx, gy });
            this.buildDecorLayer();
            this.refreshTray();
        }

        ownedDecorList() {
            const owned = SaveManager.state.decorOwned || {};
            return DECOR_ITEMS.filter(d => (owned[d.id] || 0) > 0);
        }

        buildTray() {
            this.trayParts = [];
            this.refreshTray();
        }

        destroyTray() {
            (this.trayParts || []).forEach(o => (o.destroyAll ? o.destroyAll() : o.destroy()));
            this.trayParts = [];
        }

        refreshTray() {
            this.destroyTray();
            const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
            const list = this.ownedDecorList();
            const pages = Math.max(1, Math.ceil(list.length / NEST_TRAY_PER_PAGE));
            this.trayPage = Math.min(this.trayPage, pages - 1);
            const pageItems = list.slice(this.trayPage * NEST_TRAY_PER_PAGE,
                this.trayPage * NEST_TRAY_PER_PAGE + NEST_TRAY_PER_PAGE);

            const trayY = H - 210, cols = 4, cellW = 86, cellH = 96;
            const startX = W / 2 - (cols - 1) * cellW / 2;

            this.trayParts.push(this.add.rectangle(W / 2, H - 160, W, 220, 0x141020, 0.92).setDepth(9));
            this.trayParts.push(this.add.text(W / 2, H - 258, I18n.t('nest.tray'), {
                fontFamily: 'Arial, sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#8d86a8'
            }).setOrigin(0.5).setDepth(10));

            pageItems.forEach((def, i) => {
                const col = i % cols, row = Math.floor(i / cols);
                const x = startX + col * cellW, y = trayY + row * cellH;
                const owned = SaveManager.state.decorOwned[def.id] || 0;
                const placedCount = this.workingPlaced.filter(p => p.id === def.id).length;
                const heldTint = this.editHeldId === def.id ? 0x342a52 : 0x201a33;

                const bg = this.add.nineslice(x, y, 'btn-tex', 0, cellW - 8, cellH - 8, 14, 14, 14, 14)
                    .setTint(heldTint).setDepth(10).setInteractive({ useHandCursor: true });
                const icon = this.add.image(x, y - 12, 'decor-' + def.id).setDisplaySize(44, 44).setDepth(11);
                const count = this.add.text(x, y + 28, (placedCount) + '/' + owned, {
                    fontFamily: 'Arial, sans-serif', fontSize: '14px', fontStyle: 'bold',
                    color: owned > placedCount ? '#7dffb2' : '#5a5570'
                }).setOrigin(0.5).setDepth(11);
                bg.on('pointerdown', () => {
                    this.editHeldId = this.editHeldId === def.id ? null : def.id;
                    this.refreshTray();
                });
                this.trayParts.push(bg, icon, count);
            });

            if (!list.length) {
                this.trayParts.push(this.add.text(W / 2, trayY + 20, I18n.t('nest.trayEmpty'), {
                    fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#5a5570'
                }).setOrigin(0.5).setDepth(10));
            }

            if (pages > 1) {
                const py = H - 100;
                const prev = makeUiButton(this, W / 2 - 150, py, 90, 48, '◀', 0x39424f, () => {
                    this.trayPage = (this.trayPage - 1 + pages) % pages;
                    this.refreshTray();
                });
                const label = this.add.text(W / 2, py, (this.trayPage + 1) + ' / ' + pages, {
                    fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#8d86a8'
                }).setOrigin(0.5).setDepth(10);
                const next = makeUiButton(this, W / 2 + 150, py, 90, 48, '▶', 0x39424f, () => {
                    this.trayPage = (this.trayPage + 1) % pages;
                    this.refreshTray();
                });
                this.trayParts.push(prev, label, next);
            }
        }

        buildSaveButton() {
            const W = CONFIG.WIDTH;
            this.saveBtn = makeUiButton(this, W / 2, 168, 220, 64,
                I18n.t('nest.save'), 0x2fa86b, () => this.commitSave());
        }

        commitSave() {
            SaveManager.state.decorPlaced = this.workingPlaced.slice();
            SaveManager.persist();
            if (typeof Social !== 'undefined' && Social.syncProfile) {
                Social.syncProfile({ decor: SaveManager.state.decorPlaced }).catch(() => {});
            }
            this.showToast(I18n.t('nest.saved'));
            this.exitEdit(true);
        }

        // -------------------------------------------------------------------
        // Toast
        // -------------------------------------------------------------------
        showToast(msg) {
            this.hideToast(true);
            this._toast = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 300, msg, {
                fontFamily: 'Arial, sans-serif', fontSize: '26px', fontStyle: 'bold',
                color: '#ffffff', backgroundColor: '#342a52', padding: { x: 18, y: 10 }
            }).setOrigin(0.5).setDepth(40);
            this._toastTween = this.tweens.add({
                targets: this._toast, alpha: 0, delay: 1400, duration: 300,
                onComplete: () => this.hideToast(false)
            });
        }

        hideToast(killTween) {
            if (killTween && this._toastTween) this._toastTween.remove();
            if (this._toast) { this._toast.destroy(); this._toast = null; }
        }
    };
}
