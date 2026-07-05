// =============================================================================
// SMOOSH! - nestscene.js
// v3.5 Task 4: the LIVING NEST - a cozy hangout scene, separate from nest.js
// (the battle NEST defend-target) and from FieldPets (the combat roam AI).
// Every owned pet ambles around a pastel field, naps, chases a friend, or
// bounces on a toy; tap one for a jump + hearts reaction. My-nest mode also
// lets you place/remove owned decor on a grid (Decor.canPlace, Task 3).
//
// v6 Task 9: grid went from 6x4 to 12x8 (NEST_CELL_W/H exactly halved - see
// the constants below) and pets now also seek out `use`-tagged furniture
// (sit/sleep/watch/eat), not just cat==='toy' items - see hasFurniture()/
// furnitureCells() and the sit/sleep/watch/eat branches in enterState()/update().
//
// Pure half (NestAI) is exported first so tests/nest.test.js can require()
// this file from plain Node - same dual-mode pattern as stagemap.js/dex.js.
// =============================================================================

const NestAI = {
    STATES: ['wander', 'nap', 'chase', 'play', 'sit', 'sleep', 'watch', 'eat'],

    // Per-state dwell time (seconds) once a state is entered.
    DWELL_MIN: 2,
    DWELL_MAX: 6,

    // Pure transition table. current = the state an agent is LEAVING;
    // rng() -> [0,1); hasToys = at least one placed decor item with
    // cat==='toy' exists in the nest right now; hasFurniture = optional
    // { sit, sleep, watch, eat } booleans (v6 Task 9) - each true when at
    // least one placed decor item whose `use` tag matches exists in the
    // nest right now (sofa/chair/stool->sit, bed->sleep, tv->watch,
    // fridge->eat - see decor.js DECOR_ITEMS and nestscene.js hasFurniture()).
    // Omitting hasFurniture entirely behaves exactly like pre-Task-9 code
    // (none of the 4 furniture states are ever legal).
    //
    // Legal next states from ANY current state:
    //   wander - always
    //   chase  - always
    //   nap    - any time EXCEPT immediately after another nap (an agent
    //            that just woke up doesn't fall right back asleep)
    //   play   - only when hasToys
    //   sit    - only when hasFurniture.sit (mirrors play: no self-chain guard)
    //   watch  - only when hasFurniture.watch (mirrors play: no self-chain guard)
    //   eat    - only when hasFurniture.eat (mirrors play: no self-chain guard)
    //   sleep  - only when hasFurniture.sleep, and NOT immediately after
    //            another sleep (mirrors nap's anti-self-chain rule - sleep
    //            IS a nap, just on a bed instead of in place)
    //
    // Weighted (not uniform) so wander reads as the "default" behavior and
    // the rest feel like occasional beats - but every legal state still
    // gets a real, reachable slice of the roll (verified by tests/nest.test.js
    // sweeping rng across [0,1)).
    nextState(current, rng, hasToys, hasFurniture) {
        const f = hasFurniture || {};
        const WEIGHT = {
            wander: 0.30, chase: 0.18, nap: 0.14, play: 0.10,
            sit: 0.10, sleep: 0.08, watch: 0.06, eat: 0.04
        };
        const legal = ['wander', 'chase'];
        if (current !== 'nap') legal.push('nap');
        if (hasToys) legal.push('play');
        if (f.sit) legal.push('sit');
        if (f.watch) legal.push('watch');
        if (f.eat) legal.push('eat');
        if (f.sleep && current !== 'sleep') legal.push('sleep');

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

    // v6 Task 9: 6x4 (106x138 cells) -> 12x8 (53x69 cells) - both axes
    // exactly halved (12=6*2, 8=4*2; 106/2=53, 138/2=69), so the grid's
    // outer footprint (42..678 x, 268..820 y) is pixel-identical to before;
    // it's just subdivided finer. See Decor.GRID in decor.js.
    const NEST_GRID_X0 = 42, NEST_GRID_Y0 = 268, NEST_CELL_W = 53, NEST_CELL_H = 69;
    const NEST_ROAM = { x: 30, y: 190, w: 660, h: 700 }; // pets wander/chase/play within this box
    const NEST_MAX_MINE = 20, NEST_MAX_VISIT_SIDE = 10;
    const NEST_TRAY_PER_PAGE = 8;
    // v6 Task 9: per-state badge glyph. nap (in-place) keeps its original
    // 💤; sleep/sit/watch/eat (furniture-targeted) get distinct emoji so a
    // glance at the nest tells you WHY a pet stopped moving.
    const NEST_BADGE = { nap: '💤', sleep: '😴', sit: '😌', watch: '👀', eat: '🍖' };

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
                NEST_ROAM.w, NEST_ROAM.h, CONFIG.PASTEL.bgField)
                .setStrokeStyle(2, CONFIG.PASTEL.ink).setDepth(0);
            // soft decorative blobs - one notch deeper than the page bg, same
            // convention as MenuScene's blobs (ui.js).
            for (const [bx, by, br] of [[90, 260, 90], [630, 320, 70],
                [110, 800, 80], [610, 840, 100]]) {
                this.add.circle(bx, by, br, CONFIG.PASTEL.bgField).setDepth(0);
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
                fontFamily: CONFIG.FONT, fontSize: '48px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
            }).setOrigin(0.5).setDepth(10);
            // v6 Task 4: isolated corner glyph - nearest interactive element
            // (the decor grid) starts at y=268, far clear of any padding here.
            padTapArea(back);
            back.on('pointerdown', () => SmooshGame.goto('SubMainScene')); // v7 T14: back -> the hub

            // v5.0 Task 2: 40->34 - header-title trim (pixel-font headroom).
            this.add.text(W / 2, 56, I18n.t('nest.title'), {
                fontFamily: CONFIG.FONT, fontSize: '34px', color: Balance.hex(CONFIG.PASTEL.goodText)
            }).setOrigin(0.5).setDepth(10);

            if (this.visit) {
                // v5.0 Task 2: 22->18 + wordWrap - "Visiting {generated
                // nickname}'s nest" (up to ~40 chars, see nicknames.js) had no
                // overflow guard at all in the pixel font; wrap as a backstop.
                this.add.text(W / 2, 104, I18n.t('nest.visiting', { name: this.visit.nickname || '???' }), {
                    fontFamily: CONFIG.FONT, fontSize: '18px', color: Balance.hex(CONFIG.PASTEL.goldText),
                    align: 'center', wordWrap: { width: W - 80 }
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
                // Skip anything non-finite or out of the 12x8 grid silently.
                if (!Number.isFinite(p.gx) || !Number.isFinite(p.gy) ||
                    p.gx < 0 || p.gx >= Decor.GRID.cols || p.gy < 0 || p.gy >= Decor.GRID.rows) continue;
                const c = this.cellCenter(p.gx, p.gy);
                // v6 Task 9: 76->38 (halved with the cell size, see NEST_CELL_W/H).
                const sprite = this.add.image(c.x, c.y, 'decor-' + p.id).setDepth(1).setDisplaySize(38, 38);
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

        // v6 Task 9: furniture equivalent of hasToys()/toyCells() above -
        // keyed by decor.js's `use` tag instead of `cat`. Returns
        // { sit, sleep, watch, eat } booleans, fed straight into
        // NestAI.nextState()'s hasFurniture param.
        hasFurniture() {
            const placed = this.visit ? (this.visit.decor || []) : this.workingPlaced;
            const out = { sit: false, sleep: false, watch: false, eat: false };
            for (const p of placed) {
                const d = Decor.byId(p.id);
                if (d && d.use && Object.prototype.hasOwnProperty.call(out, d.use)) out[d.use] = true;
            }
            return out;
        }

        furnitureCells(useKind) {
            const placed = this.visit ? (this.visit.decor || []) : this.workingPlaced;
            return placed.filter(p => { const d = Decor.byId(p.id); return d && d.use === useKind; });
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
                fontFamily: CONFIG.FONT, fontSize: '18px'
            }).setOrigin(0.5).setDepth(5);

            const agent = {
                def, isMine, sprite, badge, size,
                state: 'wander', stateT: NestAI.dwell(Math.random),
                tx: x, ty: y, // wander/chase movement target
                chaseTarget: null,
                // v6 Task 9: actionCell is the shared "walk here and use it"
                // target cell for play/sit/sleep/watch/eat (was `toyCell`,
                // play-only, before this task). settled tracks whether a
                // travel-then-dim state (currently just 'sleep') has
                // actually arrived yet - nap never travels so it's always
                // settled the instant it's entered. Used by exitEdit() to
                // restore the correct alpha for a pet frozen mid-walk-to-bed.
                actionCell: null,
                settled: false
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
            a.actionCell = null;
            a.settled = (state === 'nap'); // nap is "settled" immediately; sleep settles on arrival (see update())
            a.badge.setText(NEST_BADGE[state] || '');
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
                    a.actionCell = this.cellCenter(t.gx, t.gy);
                } else {
                    a.state = 'wander';
                    this.pickWanderTarget(a);
                }
            } else if (state === 'sit' || state === 'sleep' || state === 'watch' || state === 'eat') {
                const cells = this.furnitureCells(state);
                if (cells.length) {
                    const t = Phaser.Utils.Array.GetRandom(cells);
                    a.actionCell = this.cellCenter(t.gx, t.gy);
                } else {
                    // Defense in depth: NestAI only offers these states when
                    // hasFurniture says one exists, but fall back safely if
                    // the nest changed underneath the agent (e.g. removed
                    // mid-edit) anyway - same pattern as chase/play above.
                    a.state = 'wander';
                    this.pickWanderTarget(a);
                }
            }
        }

        update(time, delta) {
            if (this.editMode) return; // pets freeze in place while the grid/tray overlay is up
            const dt = Math.min(0.05, delta / 1000);
            const toys = this.hasToys();
            const furniture = this.hasFurniture(); // v6 Task 9: { sit, sleep, watch, eat }

            for (const a of this.agents) {
                a.stateT -= dt;
                if (a.stateT <= 0) this.enterState(a, NestAI.nextState(a.state, Math.random, toys, furniture));

                if (a.state === 'wander') {
                    this.moveToward(a, a.tx, a.ty, 60, dt);
                } else if (a.state === 'chase' && a.chaseTarget) {
                    this.moveToward(a, a.chaseTarget.sprite.x, a.chaseTarget.sprite.y, 90, dt);
                } else if (a.state === 'play' && a.actionCell) {
                    const arrived = this.moveToward(a, a.actionCell.x, a.actionCell.y, 90, dt);
                    if (arrived) {
                        a._bounceT = (a._bounceT || 0) + dt * 6;
                        a.sprite.y = a.actionCell.y - Math.abs(Math.sin(a._bounceT)) * 14;
                    }
                } else if (a.state === 'eat' && a.actionCell) {
                    // v6 Task 9: quick nibble-bounce at the fridge - same
                    // idea as play's toy bounce but faster/smaller (a chew,
                    // not a hop).
                    const arrived = this.moveToward(a, a.actionCell.x, a.actionCell.y, 90, dt);
                    if (arrived) {
                        a._bounceT = (a._bounceT || 0) + dt * 9;
                        a.sprite.y = a.actionCell.y - Math.abs(Math.sin(a._bounceT)) * 6;
                    }
                } else if ((a.state === 'sit' || a.state === 'watch') && a.actionCell) {
                    // v6 Task 9: walk to the sofa/chair/stool or the TV and
                    // settle - stays put once arrived, badge breathes like nap.
                    const arrived = this.moveToward(a, a.actionCell.x, a.actionCell.y, 90, dt);
                    if (arrived) {
                        a.sprite.y = a.actionCell.y;
                        a._bobT = (a._bobT || 0) + dt;
                        a.badge.setAlpha(0.6 + 0.4 * Math.sin(a._bobT * 3));
                    }
                } else if (a.state === 'sleep' && a.actionCell) {
                    // v6 Task 9: walk to the bed, THEN go dim+still like nap
                    // (nap dims immediately since it never travels).
                    const arrived = this.moveToward(a, a.actionCell.x, a.actionCell.y, 90, dt);
                    if (arrived) {
                        a.settled = true;
                        a.sprite.setAlpha(0.55);
                        a._bobT = (a._bobT || 0) + dt;
                        a.badge.setAlpha(0.6 + 0.4 * Math.sin(a._bobT * 3));
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
                Effects.burst(this, a.sprite.x, a.sprite.y - a.size * 0.4, CONFIG.PASTEL.fever, 8, 0.7);
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
                I18n.t('nest.edit'), CONFIG.PASTEL.accent, () => this.enterEdit());
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
                // v6 Task 9: a 'sleep' agent only dims once it has actually
                // arrived at its bed (a.settled) - otherwise it was frozen
                // mid-walk and should resume at normal alpha, same as any
                // other in-transit state.
                const dimmed = a.state === 'nap' || (a.state === 'sleep' && a.settled);
                a.sprite.setAlpha(dimmed ? 0.55 : (a.isMine ? 1 : 0.88));
            });
            this.buildEditToggle();
        }

        buildGridOverlay() {
            this.gridCells = [];
            for (let gy = 0; gy < Decor.GRID.rows; gy++) {
                for (let gx = 0; gx < Decor.GRID.cols; gx++) {
                    const c = this.cellCenter(gx, gy);
                    // v6 Task 9: margin 8->4 (halved with the cell size) so
                    // the 53x69 cells still leave a decent tap target (49x65).
                    const rect = this.add.rectangle(c.x, c.y, NEST_CELL_W - 4, NEST_CELL_H - 4, CONFIG.PASTEL.white, 0.05)
                        .setStrokeStyle(1.5, CONFIG.PASTEL.inkSoft, 0.7).setDepth(2).setInteractive({ useHandCursor: true });
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

            this.trayParts.push(this.add.rectangle(W / 2, H - 160, W, 220, CONFIG.PASTEL.panel, 0.92).setDepth(9));
            this.trayParts.push(this.add.text(W / 2, H - 258, I18n.t('nest.tray'), {
                fontFamily: CONFIG.FONT, fontSize: '20px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
            }).setOrigin(0.5).setDepth(10));

            pageItems.forEach((def, i) => {
                const col = i % cols, row = Math.floor(i / cols);
                const x = startX + col * cellW, y = trayY + row * cellH;
                const owned = SaveManager.state.decorOwned[def.id] || 0;
                const placedCount = this.workingPlaced.filter(p => p.id === def.id).length;
                // v4.0 Phase C Task 3: held/selected item pops with panelLight,
                // same "affordable/selected" convention as the upgrade bar.
                const heldTint = this.editHeldId === def.id ? CONFIG.PASTEL.panelLight : CONFIG.PASTEL.panel;

                const bg = this.add.nineslice(x, y, 'btn-tex', 0, cellW - 8, cellH - 8, 14, 14, 14, 14)
                    .setTint(heldTint).setDepth(10).setInteractive({ useHandCursor: true });
                const icon = this.add.image(x, y - 12, 'decor-' + def.id).setDisplaySize(44, 44).setDepth(11);
                const count = this.add.text(x, y + 28, (placedCount) + '/' + owned, {
                    fontFamily: CONFIG.FONT, fontSize: '14px', color: Balance.hex(owned > placedCount ? CONFIG.PASTEL.goodText : CONFIG.PASTEL.inkSoft)
                }).setOrigin(0.5).setDepth(11);
                bg.on('pointerdown', () => {
                    this.editHeldId = this.editHeldId === def.id ? null : def.id;
                    this.refreshTray();
                });
                this.trayParts.push(bg, icon, count);
            });

            if (!list.length) {
                this.trayParts.push(this.add.text(W / 2, trayY + 20, I18n.t('nest.trayEmpty'), {
                    fontFamily: CONFIG.FONT, fontSize: '18px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
                }).setOrigin(0.5).setDepth(10));
            }

            if (pages > 1) {
                const py = H - 100;
                const prev = makeUiButton(this, W / 2 - 150, py, 90, 48, '◀', CONFIG.PASTEL.accent, () => {
                    this.trayPage = (this.trayPage - 1 + pages) % pages;
                    this.refreshTray();
                });
                const label = this.add.text(W / 2, py, (this.trayPage + 1) + ' / ' + pages, {
                    fontFamily: CONFIG.FONT, fontSize: '18px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
                }).setOrigin(0.5).setDepth(10);
                const next = makeUiButton(this, W / 2 + 150, py, 90, 48, '▶', CONFIG.PASTEL.accent, () => {
                    this.trayPage = (this.trayPage + 1) % pages;
                    this.refreshTray();
                });
                this.trayParts.push(prev, label, next);
            }
        }

        buildSaveButton() {
            const W = CONFIG.WIDTH;
            this.saveBtn = makeUiButton(this, W / 2, 168, 220, 64,
                I18n.t('nest.save'), CONFIG.PASTEL.accent, () => this.commitSave());
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
            // v4.0 Phase C Task 3 / v5.0 carry-over fix: toast chip stays a
            // dark pill with white text regardless of theme - same "always-
            // dark floating chip" exception as makeUiButton's drop shadow /
            // modal scrims. v5.0 flipped `ink` to bright near-white, so the
            // pill fill moved to `panel` (still a dark surface) to keep the
            // white text readable - see tests/pastel.test.js.
            this._toast = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 300, msg, {
                fontFamily: CONFIG.FONT, fontSize: '26px', color: Balance.hex(CONFIG.PASTEL.white), backgroundColor: Balance.hex(CONFIG.PASTEL.panel), padding: { x: 18, y: 10 }
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
