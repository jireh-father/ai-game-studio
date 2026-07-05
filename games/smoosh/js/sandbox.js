// =============================================================================
// SMOOSH! - sandbox.js
// v7 Task 10: combat test / sandbox scene. Lets a tester freely pick ANY pet
// or monster from the full catalog, drive a possessed "avatar" pet with a
// joystick + ATTACK button (the REAL elemental _attack() code path), and beat
// on a huge-HP practice dummy ("허수아비") with a live DPS readout - all
// without ever touching real save data (gold/XP/gems/kills/pets/persist).
//
// SAVE-SAFETY (the whole point of this file existing instead of just reusing
// GameScene): GameScene.onKill() unconditionally mutates SaveManager.state
// (gold/XP/gems/kills[]/drops) and calls SaveManager.persist() on every kill.
// SandboxScene.damageMonster()/onKill() below are a PARALLEL, SAVE-FREE clone
// - FX + HP math only. They reuse Monster.hit()/FieldPets.damageAgent()/
// Effects.*/Feel.* exactly like the real funnel, but never call
// SaveManager.addGold/persist, never touch kills[]/xp/gems, never spawn item
// drops. The squad itself is a scene-local array (`this.squad`), never
// `SaveManager.state.pets` - toggling any catalog pet in/out of the squad
// never mutates a real save. See tests/sandbox.test.js for a static source
// scan enforcing this file never grows a forbidden SaveManager write call.
//
// Guarded like dex.js/stagemap.js (CROSS-SCRIPT SCOPING RULE): the class
// EXPRESSION is assigned to the outer `let SandboxScene` so it stays a normal
// script-global main.js's `scene: [...]` array can see, while the pure
// `SandboxMath` half stays require()-able from plain Node tests.
// =============================================================================

const SandboxMath = {
    // Rolling-window used by both the DPS readout and its own pruning pass.
    ROLLING_WINDOW_MS: 3000,

    // Sum of `hit.dmg` for every hit still inside the window, expressed as a
    // per-second rate. Pure - no Phaser, no scene, just an array of
    // {t, dmg} and a "now" timestamp (both in ms).
    rollingDps(hits, nowMs, windowMs) {
        const w = windowMs || SandboxMath.ROLLING_WINDOW_MS;
        let sum = 0;
        for (const h of hits) {
            if (nowMs - h.t <= w) sum += h.dmg;
        }
        return sum / (w / 1000);
    },

    // Drops hits older than the window - called once/frame so the log never
    // grows unbounded across a long test session.
    prune(hits, nowMs, windowMs) {
        const w = windowMs || SandboxMath.ROLLING_WINDOW_MS;
        return hits.filter(h => nowMs - h.t <= w);
    },

    // The practice dummy's core safety invariant: a hit can never bring it
    // below 1 HP (no death FX/onKill loop, ever). Returns the ACTUAL damage
    // applied (<=dmg, and 0 once the dummy is already floored) plus the
    // resulting hp - both pure so the "never reaches 0" guarantee is
    // unit-testable without spinning up a Monster/Phaser scene.
    clampDummyDamage(hp, dmg) {
        const dealt = Math.max(0, Math.min(dmg, hp - 1));
        return { dealt, newHp: hp - dealt };
    },

    // Joystick-driven avatar movement: integrate a unit-ish vector at `speed`
    // px/s for `dt` seconds, then clamp to the field's playable rect (minus
    // half the sprite's own footprint so it never walks off-field). Mirrors
    // the branch pets.js's FieldPets.update() runs for a `manual:true` agent
    // - kept here too, pulled out pure, so the position math has a seam a
    // Node test can hit directly.
    clampManualMove(x, y, vx, vy, speed, dt, half, field) {
        let nx = x + vx * speed * dt;
        let ny = y + vy * speed * dt;
        nx = Math.max(field.x + half, Math.min(field.x + field.w - half, nx));
        ny = Math.max(field.y + half, Math.min(field.y + field.h - half, ny));
        return { x: nx, y: ny };
    }
};

if (typeof module !== 'undefined') module.exports = { SandboxMath };

// =============================================================================
// SandboxScene - Phaser half. No-op (require()-able) outside a browser.
// =============================================================================
let SandboxScene; // eslint-disable-line no-unused-vars

if (typeof Phaser !== 'undefined') {

    const SANDBOX = {
        DUMMY_HP: 5000000,
        DUMMY_POS: { x: 360, y: 460 },
        DEFAULT_LEVEL: 15,
        AVATAR_SPEED: 260,       // same constant every pet already walks at (pets.js has no per-species speed stat)
        ATTACK_RANGE_PAD: 46,    // matches pets.js's own target-in-range formula (target.r + 46)
        JOY_BASE: { x: 130, y: 1120 },
        JOY_RADIUS: 80,
        ATTACK_BTN: { x: 590, y: 1120, r: 92 },
        RETALIATE_CYCLE: ['none', 'melee', 'spit', 'slam', 'zap'],
        SB_COLS: 4, SB_CARD: 140, SB_GAP: 14
    };
    SANDBOX.SB_ROW_H = SANDBOX.SB_CARD + SANDBOX.SB_GAP;

    SandboxScene = class SandboxScene extends Phaser.Scene {
        constructor() { super({ key: 'SandboxScene' }); }

        create() {
            const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;

            // ---- state -----------------------------------------------------
            this.pool = [];
            this.active = [];
            this.transitioning = false; // Monster._updateAttack/_updateSkill read this
            // v7 final-review fix: a monster clone/summon skill cast while the
            // field is at concurrentMax falls through to effects.js _skillSpawn's
            // `scene.pendingWave.unshift(...)` branch (see game.js/infinitegame.js
            // - both keep a real pendingWave queue). SandboxScene has no stage
            // queue concept at all, so without this array the cast would throw a
            // TypeError and crash the scene. This is a pure crash-guard: the
            // queue intentionally never drains (no fillFromQueue here) since the
            // sandbox has no wave/stage system to feed from.
            this.pendingWave = [];
            this._lastPointer = null;

            this.stage = Phaser.Math.Clamp(SaveManager.state.bestStage || 1, 1, 999);

            this.joyVec = { x: 0, y: 0 };
            this.joyPointerId = null;
            this._dragPointerId = null;

            this.dummyHits = [];
            this.dummyTotalDamage = 0;
            this.dummyHitCount = 0;
            this._dummyAtFloor = false;

            this.drawerOpen = false;
            this.pickerTab = 'PETS';

            // ---- backdrop + field -------------------------------------------
            this.add.rectangle(W / 2, H / 2, W, H, CONFIG.PASTEL.bg).setDepth(-1);
            const F = CONFIG.FIELD;
            this.add.rectangle(F.x + F.w / 2, F.y + F.h / 2, F.w, F.h, CONFIG.PASTEL.bgField, 1)
                .setStrokeStyle(2, CONFIG.PASTEL.ink).setDepth(0);

            this.buildHeader();
            this.buildTabs();
            this.buildDrawer();
            this.spawnDummy();

            // ---- squad: OWN scene-local array, never SaveManager.state.pets --
            this.squad = this.buildDefaultSquad();
            this.fieldPets = new FieldPets(this);
            // Sole "new glue" needed to reuse FieldPets wholesale: swap its
            // pet-source from the real save to this scene's own squad array.
            // Every other FieldPets method (agent build, _attack, skills, KO/
            // revive, damageAgent) runs completely unmodified.
            this.fieldPets.activePets = () => this.squad.slice().sort((a, b) => b.level - a.level);
            this.fieldPets.rebuild();
            this.assignAvatar(this.squad[0] || null);

            this.buildAvatarMarker();
            this.buildJoystick();
            this.buildAttackButton();
            this.wireSceneInput();
        }

        // -------------------------------------------------------------------
        // Header: back / title / DPS readout / dummy RESET / stage stepper
        // -------------------------------------------------------------------
        buildHeader() {
            const W = CONFIG.WIDTH;

            this.add.nineslice(56, 50, 'pill-tex', 0, 64, 56, 18, 18, 16, 16)
                .setTint(CONFIG.PASTEL.panel).setDepth(10);
            const back = this.add.text(56, 48, '‹', {
                fontFamily: CONFIG.FONT, fontSize: '44px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
            }).setOrigin(0.5).setDepth(11);
            padTapArea(back);
            back.on('pointerdown', () => SmooshGame.goto('SubMainScene')); // v7 T14: back -> the hub

            this.add.text(W / 2, 42, '🧪 SANDBOX', {
                fontFamily: CONFIG.FONT, fontSize: '24px', color: Balance.hex(CONFIG.PASTEL.good)
            }).setOrigin(0.5).setDepth(10);

            this.dpsText = this.add.text(W / 2, 84, '', {
                fontFamily: CONFIG.FONT, fontSize: '14px', color: Balance.hex(CONFIG.PASTEL.inkSoft),
                align: 'center', wordWrap: { width: 600 }
            }).setOrigin(0.5).setDepth(10);

            this.resetBtn = makeUiButton(this, W - 96, 50, 150, 56, '↺ RESET', CONFIG.PASTEL.accent,
                () => this.resetDummy(), undefined, { pad: 8 });

            // stage stepper - feeds Balance.mobHP/monsterAtkMult for anything
            // spawned from the MONSTERS picker (does not retroactively rescale
            // monsters already on the field). Kept snug (y<=150, pad:6) so its
            // padded hit-areas stay clear of the picker tabs row right below
            // it (nineslice buttons, y=192, top edge 168).
            this.add.text(150, 116, 'STAGE', {
                fontFamily: CONFIG.FONT, fontSize: '13px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
            }).setOrigin(0.5).setDepth(10);
            this.stageValText = this.add.text(150, 140, String(this.stage), {
                fontFamily: CONFIG.FONT, fontSize: '20px', color: Balance.hex(CONFIG.PASTEL.ink)
            }).setOrigin(0.5).setDepth(10);
            const stageMinus = this.add.text(96, 140, '−', {
                fontFamily: CONFIG.FONT, fontSize: '28px', color: Balance.hex(CONFIG.PASTEL.accent)
            }).setOrigin(0.5).setDepth(10);
            padTapArea(stageMinus, 6);
            stageMinus.on('pointerdown', () => this.bumpStage(-1));
            const stagePlus = this.add.text(204, 140, '+', {
                fontFamily: CONFIG.FONT, fontSize: '28px', color: Balance.hex(CONFIG.PASTEL.accent)
            }).setOrigin(0.5).setDepth(10);
            padTapArea(stagePlus, 6);
            stagePlus.on('pointerdown', () => this.bumpStage(1));

            this.refreshDpsText();
        }

        bumpStage(delta) {
            this.stage = Phaser.Math.Clamp(this.stage + delta, 1, 999);
            this.stageValText.setText(String(this.stage));
        }

        refreshDpsText() {
            const dps = SandboxMath.rollingDps(this.dummyHits, this.time.now, SandboxMath.ROLLING_WINDOW_MS);
            this.dpsText.setText('DUMMY DPS ' + Balance.fmt(Math.round(dps)) +
                '  ·  TOTAL ' + Balance.fmt(Math.round(this.dummyTotalDamage)) +
                '  ·  HITS ' + this.dummyHitCount);
        }

        // -------------------------------------------------------------------
        // Picker tabs (🐾 PETS / 👹 MONSTERS) - toggle the slide-up drawer.
        // -------------------------------------------------------------------
        buildTabs() {
            const W = CONFIG.WIDTH, tabW = 220, tabH = 48, gap = 16;
            this.tabPets = this.buildTabButton(W / 2 - (tabW + gap) / 2, 192, tabW, tabH, '🐾 PETS', 'PETS');
            this.tabMonsters = this.buildTabButton(W / 2 + (tabW + gap) / 2, 192, tabW, tabH, '👹 MONSTERS', 'MONSTERS');
        }

        buildTabButton(x, y, w, h, label, key) {
            const bg = this.add.nineslice(x, y, 'pill-tex', 0, w, h, 16, 16, 14, 14)
                .setTint(CONFIG.PASTEL.panel).setDepth(24).setInteractive({ useHandCursor: true });
            const txt = this.add.text(x, y, label, {
                fontFamily: CONFIG.FONT, fontSize: '15px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
            }).setOrigin(0.5).setDepth(25);
            fitToWidth(txt, w - 16);
            bg.on('pointerdown', () => this.toggleDrawer(key));
            return { bg, txt, key };
        }

        toggleDrawer(key) {
            if (this.drawerOpen && this.pickerTab === key) { this.closeDrawer(); return; }
            this.pickerTab = key;
            this.openDrawer();
        }

        openDrawer() {
            this.drawerOpen = true;
            [this.tabPets, this.tabMonsters].forEach(t => {
                const on = t.key === this.pickerTab;
                t.bg.setTint(on ? CONFIG.PASTEL.panelLight : CONFIG.PASTEL.panel);
                t.txt.setColor(Balance.hex(on ? CONFIG.PASTEL.ink : CONFIG.PASTEL.inkSoft));
            });
            this.buildDrawerGrid();
            this.drawerBg.setVisible(true);
            this.drawerContainer.setVisible(true);
            this.setDrawerContextVisible(true);
        }

        closeDrawer() {
            this.drawerOpen = false;
            this.drawerBg.setVisible(false);
            this.drawerContainer.setVisible(false);
            this.setDrawerContextVisible(false);
            [this.tabPets, this.tabMonsters].forEach(t => {
                t.bg.setTint(CONFIG.PASTEL.panel);
                t.txt.setColor(Balance.hex(CONFIG.PASTEL.inkSoft));
            });
        }

        // -------------------------------------------------------------------
        // Drawer: 4-wide scrollable grid over the field, ported from
        // DexScene's drag-scroll pattern - every card always "unlocked"
        // (sandbox catalog access is the whole point).
        // -------------------------------------------------------------------
        buildDrawer() {
            const W = CONFIG.WIDTH;
            this.drawerTop = 214;
            this.drawerBottom = 986;
            // depth 15/16: above every field entity (monsters=3, pets=4-5,
            // dummy label=6) but below the header/tab chrome (10+/24-25) so
            // drawerContextBg/drawerContextTxt (depth 20/21, below) still
            // render on top of the scrim+grid.
            // NOT interactive: this is a pure visual scrim. Making it
            // interactive would make Phaser report it as the (topOnly)
            // `currentlyOver` hit for every tap inside the drawer, including
            // taps meant for a card underneath - which would silently break
            // both card-tap resolution and drag-scroll below (both gate on
            // `currentlyOver` being empty, mirroring DexScene's wireScroll).
            this.drawerBg = this.add.rectangle(W / 2, (this.drawerTop + this.drawerBottom) / 2,
                W - 8, this.drawerBottom - this.drawerTop, CONFIG.PASTEL.panel, 0.98)
                .setDepth(15).setVisible(false);
            this.drawerScrollMax = this.drawerTop + 40;
            this.drawerContainer = this.add.container(0, this.drawerScrollMax).setDepth(16).setVisible(false);

            // Built manually (not via makeUiButton) - that helper's returned
            // object doesn't expose its shadow/gloss parts, so toggling just
            // rect/txt visibility would leave a floating shadow+gloss blob
            // on screen while the drawer is "closed". A plain nineslice+text
            // pair gives full setVisible()/interactive control.
            this.drawerContextBg = this.add.nineslice(W / 2, this.drawerTop + 20, 'pill-tex', 0, 260, 48, 16, 16, 14, 14)
                .setTint(CONFIG.PASTEL.danger).setDepth(20).setVisible(false)
                .setInteractive({ useHandCursor: true });
            this.drawerContextBg.input.enabled = false;
            this.drawerContextBg.on('pointerdown', () => this.onDrawerContext());
            this.drawerContextTxt = this.add.text(W / 2, this.drawerTop + 20, 'RESET SQUAD', {
                fontFamily: CONFIG.FONT, fontSize: '16px', color: Balance.hex(CONFIG.PASTEL.bg)
            }).setOrigin(0.5).setDepth(21).setVisible(false);
        }

        setDrawerContextVisible(visible) {
            this.drawerContextBg.setVisible(visible);
            this.drawerContextBg.input.enabled = visible;
            this.drawerContextTxt.setVisible(visible);
        }

        buildDrawerGrid() {
            this.drawerContainer.removeAll(true);
            this.drawerCardViews = [];
            const list = this.pickerTab === 'PETS' ? PET_SPECIES : SPECIES;
            const { SB_COLS, SB_CARD, SB_GAP, SB_ROW_H } = SANDBOX;
            const W = CONFIG.WIDTH;
            const startX = (W - (SB_COLS * SB_CARD + (SB_COLS - 1) * SB_GAP)) / 2 + SB_CARD / 2;

            list.forEach((sp, i) => {
                const col = i % SB_COLS, row = Math.floor(i / SB_COLS);
                const x = startX + col * (SB_CARD + SB_GAP);
                const y = SB_CARD / 2 + row * SB_ROW_H;
                const tex = this.pickerTab === 'PETS' ? 'pet-' + sp.id : 'sp-' + sp.id + '-idle';

                const card = this.add.nineslice(x, y, 'btn-tex', 0, SB_CARD, SB_CARD, 18, 18, 18, 18)
                    .setTint(CONFIG.PASTEL.panelLight);
                const spr = this.add.image(x, y - 14, tex).setDisplaySize(76, 76);
                const label = this.add.text(x, y + 48, sp.name, {
                    fontFamily: CONFIG.FONT, fontSize: '14px', color: Balance.hex(CONFIG.PASTEL.ink)
                }).setOrigin(0.5);
                fitToWidth(label, SB_CARD - 12);

                const inSquad = this.pickerTab === 'PETS' && this.squad.some(p => p.species === sp.id);
                const check = this.add.text(x + SB_CARD / 2 - 18, y - SB_CARD / 2 + 18, '✓', {
                    fontFamily: CONFIG.FONT, fontSize: '20px', color: Balance.hex(CONFIG.PASTEL.good)
                }).setOrigin(0.5).setVisible(inSquad);

                this.drawerContainer.add([card, spr, label, check]);
                this.drawerCardViews.push({ x, y, r: SB_CARD / 2, sp });
            });

            const rows = Math.max(1, Math.ceil(list.length / SB_COLS));
            this.drawerContentH = rows * SB_ROW_H;
            this.drawerScrollMin = Math.min(this.drawerScrollMax, this.drawerBottom - 20 - this.drawerContentH);

            this.drawerContextTxt.setText(this.pickerTab === 'PETS' ? 'RESET SQUAD' : 'CLEAR FIELD');
        }

        // -------------------------------------------------------------------
        // Unified pointer routing: drawer drag-scroll+tap, joystick drag,
        // ATTACK button (handled via its own interactive object below). Two
        // independent scene-level drags (drawer / joystick) are tracked by
        // POINTER ID so a thumb on the stick and a thumb browsing the drawer
        // (or an ATTACK tap) never fight over the same gesture.
        // -------------------------------------------------------------------
        wireSceneInput() {
            // Guard against re-adding pointers on repeated scene entry - Phaser's
            // pointer pool is global to the game, not per-scene.
            const have = this.input.manager.pointersTotal;
            if (have < 3) this.input.addPointer(3 - have);

            this.input.on('pointerdown', (pointer, currentlyOver) => {
                this._lastPointer = { x: pointer.x, y: pointer.y };
                const overUi = !!(currentlyOver && currentlyOver.length);

                if (this.drawerOpen && pointer.y >= this.drawerTop && pointer.y <= this.drawerBottom && !overUi) {
                    this._dragPointerId = pointer.id;
                    this._dragStartY = pointer.y;
                    this._dragScrollStartY = this.drawerContainer.y;
                    this._dragMoved = false;
                    return;
                }
                if (!this.drawerOpen && this.joyPointerId === null && this._inJoyZone(pointer)) {
                    this.joyPointerId = pointer.id;
                    this._joyUpdateFromPointer(pointer);
                }
            });

            this.input.on('pointermove', (pointer) => {
                this._lastPointer = { x: pointer.x, y: pointer.y };
                if (this._dragPointerId === pointer.id) {
                    const dy = pointer.y - this._dragStartY;
                    if (Math.abs(dy) > 6) this._dragMoved = true;
                    this.drawerContainer.y = Phaser.Math.Clamp(
                        this._dragScrollStartY + dy, this.drawerScrollMin, this.drawerScrollMax);
                }
                if (this.joyPointerId === pointer.id) this._joyUpdateFromPointer(pointer);
            });

            this.input.on('pointerup', (pointer) => {
                if (this._dragPointerId === pointer.id) {
                    if (!this._dragMoved) this.handleDrawerTap(pointer.x, pointer.y);
                    this._dragPointerId = null;
                }
                if (this.joyPointerId === pointer.id) this._joyRelease();
            });
        }

        handleDrawerTap(x, y) {
            const worldY = y - this.drawerContainer.y;
            for (const v of this.drawerCardViews) {
                if (Math.abs(x - v.x) <= v.r && Math.abs(worldY - v.y) <= v.r) {
                    this.onCardTapped(v.sp);
                    return;
                }
            }
        }

        onCardTapped(sp) {
            if (this.pickerTab === 'PETS') this.togglePetInSquad(sp.id);
            else this.spawnMonsterFromPicker(sp.id);
        }

        onDrawerContext() {
            if (!this.drawerOpen) return; // defensive: never act on a stale/hidden press
            if (this.pickerTab === 'PETS') {
                this.squad = this.buildDefaultSquad();
                this.rebuildSquad(this.squad[0] || null);
            } else {
                this.clearField();
            }
            this.refreshDrawerGridKeepScroll();
        }

        refreshDrawerGridKeepScroll() {
            const keepY = this.drawerContainer.y;
            this.buildDrawerGrid();
            this.drawerContainer.y = Phaser.Math.Clamp(keepY, this.drawerScrollMin, this.drawerScrollMax);
        }

        // -------------------------------------------------------------------
        // Squad management (own scene-local array - never SaveManager.state.pets)
        // -------------------------------------------------------------------
        buildDefaultSquad() {
            // Persona 3 (zero-friction toybox): the player's own 3 highest-
            // level owned pets if they have any, else 3 random catalog pets -
            // scene opens pre-populated, no mandatory setup screen.
            const owned = SaveManager.state.pets || [];
            if (owned.length) {
                return owned.slice().sort((a, b) => b.level - a.level).slice(0, 3)
                    .map(p => Object.assign({}, p));
            }
            const picks = Phaser.Utils.Array.Shuffle(PET_SPECIES.slice()).slice(0, 3);
            return picks.map(p => ({ species: p.id, level: SANDBOX.DEFAULT_LEVEL, rarity: 'common', necklace: null }));
        }

        togglePetInSquad(id) {
            const idx = this.squad.findIndex(p => p.species === id);
            if (idx !== -1) {
                const removingAvatar = this.squad[idx] === this.avatarPetRef;
                this.squad.splice(idx, 1);
                this.rebuildSquad(removingAvatar ? (this.squad[0] || null) : this.avatarPetRef);
            } else {
                // Read-only lookup - copies the owned pet's real level/rarity/
                // necklace for fidelity if the player owns one, but NEVER
                // writes back to SaveManager.state.pets.
                const owned = (SaveManager.state.pets || []).find(p => p.species === id);
                const entry = owned ? Object.assign({}, owned)
                    : { species: id, level: SANDBOX.DEFAULT_LEVEL, rarity: 'common', necklace: null };
                this.squad.push(entry);
                this.rebuildSquad(this.avatarPetRef || entry);
            }
            this.refreshDrawerGridKeepScroll();
        }

        rebuildSquad(avatarRef) {
            this.fieldPets.rebuild();
            this.assignAvatar(avatarRef);
        }

        // Flags exactly one agent `manual:true` + gives it the shared joystick
        // vector object - see the matching FieldPets.update() branch in pets.js.
        assignAvatar(petRef) {
            this.avatarPetRef = petRef;
            this.avatarAgent = null;
            for (const a of this.fieldPets.agents) {
                a.manual = !!petRef && a.pet === petRef;
                if (a.manual) {
                    a.manualVector = this.joyVec;
                    this.avatarAgent = a;
                }
            }
        }

        // -------------------------------------------------------------------
        // Monster spawn (picker) / field management
        // -------------------------------------------------------------------
        spawnMonsterFromPicker(id) {
            const def = SPECIES.find(s => s.id === id);
            if (!def) return;
            const F = CONFIG.FIELD;
            const m = this.acquireMonster();
            const x = F.x + def.radius + Math.random() * (F.w - def.radius * 2);
            const y = F.y + def.radius + Math.random() * (F.h - def.radius * 2);
            m.spawn(def, this.stage, x, y, {});
            this.active.push(m);
            if (typeof Effects !== 'undefined') Effects.ring(this, x, y, def.color, 60);
        }

        clearField() {
            for (const m of this.active) {
                if (m === this.dummy) continue;
                m.alive = false;
                m.burst();
            }
            this.active = this.active.filter(m => m === this.dummy);
        }

        acquireMonster() {
            for (const m of this.pool) {
                if (!m.alive && !m.sprite.visible) return m;
            }
            const m = new Monster(this);
            this.pool.push(m);
            return m;
        }

        removeActive(m) {
            const idx = this.active.indexOf(m);
            if (idx !== -1) this.active.splice(idx, 1);
        }

        // -------------------------------------------------------------------
        // The dummy ("허수아비"): a real Monster, HP fixed huge + floor-clamped
        // at 1 via a per-instance hit() override (never dies, no death FX/
        // onKill loop). PASSIVE (attackType 'none') / RETALIATE (cycles the
        // real ATTACK_DEFS styles) toggle reuses Monster._updateAttack unmodified.
        // -------------------------------------------------------------------
        spawnDummy() {
            const def = SPECIES.find(s => s.id === 'blob');
            const m = this.acquireMonster();
            m.spawn(def, this.stage, SANDBOX.DUMMY_POS.x, SANDBOX.DUMMY_POS.y, {});
            m.speedBase = 0;   // amble + speed 0 = perfectly stationary practice target
            m.noSkill = true;  // no personality-skill casts while playing dummy
            m.attackType = 'none'; // starts PASSIVE
            m.maxHp = SANDBOX.DUMMY_HP;
            m.hp = SANDBOX.DUMMY_HP;
            this.installDummyOverride(m);
            this.dummy = m;
            this.active.push(m);

            this.dummyLabel = this.add.text(m.x, m.y - m.r - 34, '🎯 DUMMY', {
                fontFamily: CONFIG.FONT, fontSize: '16px', color: Balance.hex(CONFIG.PASTEL.ink),
                stroke: Balance.hex(CONFIG.PASTEL.bg), strokeThickness: 4
            }).setOrigin(0.5).setDepth(6);

            this.dummyModeBtn = makeUiButton(this, m.x, m.y + m.r + 60, 240, 56,
                'MODE: PASSIVE', CONFIG.PASTEL.panelLight, () => this.cycleDummyMode(), undefined, { pad: 8 });
        }

        // Shadows Monster.prototype.hit for THIS instance only - every other
        // Monster (spawned test monsters) keeps the real hit()/death behavior.
        installDummyOverride(m) {
            const scene = this;
            m.isDummy = true;
            m.hit = function (dmg) {
                const { dealt, newHp } = SandboxMath.clampDummyDamage(this.hp, dmg);
                if (dealt > 0) {
                    this.hp = newHp;
                    scene.recordDummyDamage(dealt);
                    const s = this.sprite;
                    if (!this._squashing) {
                        this._squashing = true;
                        s.setTexture('sp-' + this.def.id + '-squash');
                        scene.tweens.add({
                            targets: s, scaleX: this._baseScaleX * 1.25, scaleY: this._baseScaleY * 0.7,
                            duration: 55, yoyo: true, ease: 'Quad.easeOut',
                            onComplete: () => {
                                this._squashing = false;
                                if (s.active) s.setTexture('sp-' + this.def.id + '-idle');
                            }
                        });
                    }
                    this.updateHpBar();
                }
                const atFloor = this.hp <= 1;
                if (atFloor && !scene._dummyAtFloor) {
                    scene._dummyAtFloor = true;
                    scene.dummyFloorBounce(this);
                } else if (!atFloor) {
                    scene._dummyAtFloor = false;
                }
                return false; // the dummy NEVER dies
            };
        }

        recordDummyDamage(dmg) {
            this.dummyHits.push({ t: this.time.now, dmg });
            this.dummyTotalDamage += dmg;
            this.dummyHitCount++;
        }

        // Persona 3: hitting the floor reads as "phew!", not a kill.
        dummyFloorBounce(m) {
            if (typeof Effects !== 'undefined') {
                Effects.ring(this, m.x, m.y, CONFIG.PASTEL.good, 90);
                Effects.damageText(this, m.x, m.y - m.r - 20, 'phew!', Balance.hex(CONFIG.PASTEL.good), { big: true });
            }
            this.tweens.add({
                targets: m.sprite, scaleY: m._baseScaleY * 1.3, scaleX: m._baseScaleX * 0.85,
                duration: 120, yoyo: true, ease: 'Quad.easeOut'
            });
        }

        resetDummy() {
            if (!this.dummy) return;
            this.dummy.hp = SANDBOX.DUMMY_HP;
            this.dummy.alive = true;
            this.dummyHits = [];
            this.dummyTotalDamage = 0;
            this.dummyHitCount = 0;
            this._dummyAtFloor = false;
            this.dummy.updateHpBar();
            this.refreshDpsText();
            if (typeof Effects !== 'undefined') Effects.ring(this, this.dummy.x, this.dummy.y, CONFIG.PASTEL.accent, 120);
        }

        cycleDummyMode() {
            const cycle = SANDBOX.RETALIATE_CYCLE;
            const next = cycle[(cycle.indexOf(this.dummy.attackType) + 1) % cycle.length];
            this.dummy.attackType = next;
            this.dummy.attackCd = 0.6; // fire soon so the toggle feels responsive
            this.dummyModeBtn.setLabel('MODE: ' + (next === 'none' ? 'PASSIVE' : next.toUpperCase()));
        }

        // -------------------------------------------------------------------
        // Joystick (bottom-left) - drives the avatar via a.manualVector.
        // -------------------------------------------------------------------
        buildJoystick() {
            const { x, y } = SANDBOX.JOY_BASE, R = SANDBOX.JOY_RADIUS;
            this.add.text(x, y - R - 22, 'MOVE', {
                fontFamily: CONFIG.FONT, fontSize: '13px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
            }).setOrigin(0.5).setDepth(25);
            this.joyBase = this.add.circle(x, y, R, CONFIG.PASTEL.panel, 0.85)
                .setStrokeStyle(3, CONFIG.PASTEL.inkSoft).setDepth(25);
            this.joyKnob = this.add.circle(x, y, R * 0.45, CONFIG.PASTEL.accent, 0.95).setDepth(26);
        }

        _inJoyZone(pointer) {
            const b = SANDBOX.JOY_BASE;
            const dx = pointer.x - b.x, dy = pointer.y - b.y;
            return dx * dx + dy * dy <= (SANDBOX.JOY_RADIUS * 1.7) ** 2;
        }

        _joyUpdateFromPointer(pointer) {
            const b = SANDBOX.JOY_BASE, R = SANDBOX.JOY_RADIUS;
            let dx = pointer.x - b.x, dy = pointer.y - b.y;
            const dist = Math.hypot(dx, dy);
            if (dist > R) { dx = dx / dist * R; dy = dy / dist * R; }
            this.joyKnob.setPosition(b.x + dx, b.y + dy);
            this.joyVec.x = dist > 4 ? dx / R : 0;
            this.joyVec.y = dist > 4 ? dy / R : 0;
        }

        _joyRelease() {
            this.joyPointerId = null;
            this.joyVec.x = 0; this.joyVec.y = 0;
            this.joyKnob.setPosition(SANDBOX.JOY_BASE.x, SANDBOX.JOY_BASE.y);
        }

        // -------------------------------------------------------------------
        // ATTACK button (bottom-right) - force-fires the avatar's REAL
        // elemental FieldPets._attack() against the nearest in-range target.
        // -------------------------------------------------------------------
        buildAttackButton() {
            const { x, y, r } = SANDBOX.ATTACK_BTN;
            this.add.text(x, y - r - 18, 'ATTACK', {
                fontFamily: CONFIG.FONT, fontSize: '13px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
            }).setOrigin(0.5).setDepth(25);
            const body = this.add.circle(x, y, r, CONFIG.PASTEL.danger, 0.9)
                .setStrokeStyle(3, CONFIG.PASTEL.ink).setDepth(26);
            body.setInteractive(new Phaser.Geom.Circle(r, r, r + 14), Phaser.Geom.Circle.Contains);
            body.input.cursor = 'pointer';
            const label = this.add.text(x, y, '⚔', {
                fontFamily: CONFIG.FONT, fontSize: '40px'
            }).setOrigin(0.5).setDepth(27);
            body.on('pointerdown', () => this.pressAttack());
            this.attackBody = body;
            this.attackLabel = label;
        }

        pressAttack() {
            this.tweens.add({ targets: [this.attackBody, this.attackLabel], scale: 0.88, duration: 70, yoyo: true });
            const a = this.avatarAgent;
            if (!a || a.ko) return;
            const target = this.nearestTargetInRange(a);
            if (!target) { Sfx.clank(); return; }
            a.cooldown = 0;
            this.fieldPets._attack(a, target);
            a.cooldown = this.fieldPets._cooldownFor(a.def.element);
        }

        nearestTargetInRange(a) {
            let best = null, bestD = Infinity;
            for (const m of this.active) {
                if (!m.alive || m.tappable === false) continue;
                const dx = m.x - a.sprite.x, dy = m.y - a.sprite.y;
                const d2 = dx * dx + dy * dy;
                const range = m.r + SANDBOX.ATTACK_RANGE_PAD;
                if (d2 <= range * range && d2 < bestD) { bestD = d2; best = m; }
            }
            return best;
        }

        buildAvatarMarker() {
            this.avatarMarker = this.add.text(0, 0, '⭐', {
                fontFamily: CONFIG.FONT, fontSize: '20px'
            }).setOrigin(0.5).setDepth(6).setVisible(false);
        }

        // =========================================================================
        // SAVE-FREE damage funnel (mirrors GameScene.damageMonster/onKill's FX
        // exactly, but never calls SaveManager.addGold/persist and never touches
        // kills[]/xp/gems/drops). FieldPets._attack() calls `scene.damageMonster`
        // - since `scene` is THIS SandboxScene, every pet/avatar hit automatically
        // routes through here instead of the real game's save-mutating funnel.
        // =========================================================================
        damageMonster(m, dmg, isCrit, x, y, source) {
            if (!m.alive || m.tappable === false) return;

            if (m.iceOn) {
                m.iceOn = false;
                m.sprite.clearTint();
                Sfx.clank(); Haptic.tick(0.8);
                if (typeof Effects !== 'undefined') {
                    Effects.burst(this, m.x, m.y - m.radius * 0.5, CONFIG.PASTEL.elements.ice.base, 8);
                    Effects.damageText(this, m.x, m.y - m.radius - 8, 'CRACK!', Balance.hex(CONFIG.PASTEL.elements.ice.base));
                }
                return;
            }

            if (!this.shieldAllowsDamage(m, isCrit)) {
                Sfx.clank(); Haptic.tick(0.8);
                return;
            }

            if (source !== 'thorns' && typeof Effects !== 'undefined') {
                Effects.damageText(this, m.x, m.y - m.radius - 8,
                    (isCrit ? '💥' : '') + Balance.fmt(dmg),
                    Balance.hex(isCrit ? CONFIG.PASTEL.crit : CONFIG.PASTEL.ink), { crit: isCrit });
            }

            const died = m.hit(dmg);
            if (died) {
                this.onKill(m, source);
            } else if (source !== 'thorns') {
                if (typeof Effects !== 'undefined') {
                    const k = m.isBoss ? 1.6 : Math.min(1.2, m.r / 46);
                    Effects.burst(this, x, y, m.def.color, m.isBoss ? 7 : 3, 0.5 * k + 0.3);
                    if (isCrit) Effects.ring(this, x, y, CONFIG.PASTEL.crit, 40 + m.r);
                }
                if (m.quirk === 'blink' && !source) m.blinkAway();
            }
        }

        // Same shieldy-kind gate as GameScene (6 rapid hits crack the shell) -
        // copied rather than shared since it's a few lines with zero save
        // coupling, and keeping SandboxScene self-contained here avoids ever
        // needing to touch GameScene for sandbox-only behavior.
        shieldAllowsDamage(m, isCrit) {
            if (m.def.kind !== 'shield' || m.shieldBroken) return true;
            if (isCrit) return true;
            const now = this.time.now;
            m.recentHits = m.recentHits || [];
            m.recentHits.push(now);
            m.recentHits = m.recentHits.filter(t => now - t <= 1500);
            if (m.recentHits.length >= 6) {
                m.shieldBroken = true;
                if (typeof Effects !== 'undefined') Effects.burst(this, m.x, m.y - m.radius, CONFIG.PASTEL.inkSoft);
                return true;
            }
            this.tweens.add({
                targets: m.sprite, angle: (Math.random() < 0.5 ? -1 : 1) * 12, duration: 60, yoyo: true,
                onComplete: () => { if (m.sprite.active) m.sprite.setAngle(0); }
            });
            return false;
        }

        // Save-free kill: FX only, no gold/xp/gems/kills[]/drops/persist. A
        // spawned test monster just dies cleanly - splitter/jackpot/boss chain
        // reactions (child spawns, confetti, the mega boss sequence) are
        // GameScene.onSpecialDeath's real-progression spectacle and are
        // deliberately not reproduced here (see report for scoping rationale).
        onKill(m, source) {
            this.removeActive(m);
            Feel.kill(0, m.r);
            if (typeof Effects !== 'undefined') Effects.killFx(this, m, false);
            m.burst();
        }

        // -------------------------------------------------------------------
        // Monster offense helpers - identical to GameScene's (zero SaveManager
        // coupling in any of these), reused so RETALIATE-mode dummy attacks and
        // spawned monsters' own attacks/skills work exactly like real combat.
        // `canHitNest`/`isNest` params are accepted for signature parity but are
        // inert here: this.nest is never set, so the nest-shelling branch never
        // fires (no Nest exists in the sandbox by design).
        // -------------------------------------------------------------------
        _petElemHit(m, a, dmg) {
            const { dmg: edmg, mult } = Balance.applyElement(dmg, m.def.elem, a.def.element);
            if (mult !== 1 && typeof Effects !== 'undefined') {
                Effects.damageText(this, a.sprite.x, a.sprite.y - 68,
                    mult > 1 ? 'Super!' : 'Resisted',
                    Balance.hex(mult > 1 ? CONFIG.PASTEL.gold : CONFIG.PASTEL.inkSoft));
            }
            return edmg;
        }

        monsterStrikeArea(m, x, y, radius, dmg) {
            if (!this.fieldPets) return;
            for (const a of this.fieldPets.agents) {
                if (a.ko) continue;
                if ((a.sprite.x - x) ** 2 + (a.sprite.y - y) ** 2 <= radius * radius) {
                    this.fieldPets.damageAgent(a, this._petElemHit(m, a, dmg), m.def.color);
                }
            }
        }

        monsterProjectile(m, tx, ty, dmg, isNest, spreadAngle) {
            const ang = Math.atan2(ty - m.y, tx - m.x) + (spreadAngle || 0);
            const spr = this.add.image(m.x, m.y, 'pop-tex').setDepth(7).setDisplaySize(26, 26).setTint(m.def.color);
            const dist = Math.hypot(tx - m.x, ty - m.y) + 40;
            const ex = m.x + Math.cos(ang) * dist, ey = m.y + Math.sin(ang) * dist;
            this.tweens.add({
                targets: spr, x: ex, y: ey, duration: dist / 0.45, ease: 'Linear',
                onComplete: () => {
                    if (typeof Effects !== 'undefined') Effects.burst(this, ex, ey, m.def.color, 5, 0.6);
                    this.monsterStrikeArea(m, ex, ey, 60, dmg);
                    spr.destroy();
                }
            });
        }

        monsterZap(m, tx, ty, dmg) {
            const g = this.add.graphics().setDepth(8);
            g.lineStyle(4, CONFIG.PASTEL.elements.electric.base, 1);
            g.beginPath(); g.moveTo(m.x, m.y);
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
            this.monsterStrikeArea(m, tx, ty, 50, dmg);
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

        onMonsterDespawned(m) {
            this.removeActive(m); // goldie's own despawn timer (jackpot flee)
        }

        // -------------------------------------------------------------------
        update(time, delta) {
            const dt = Math.min(0.05, delta / 1000);

            for (const m of this.active.slice()) {
                if (m.alive) m.update(dt, this._lastPointer);
            }
            if (this.fieldPets) this.fieldPets.update(dt);

            if (this.avatarAgent && !this.avatarAgent.ko) {
                const a = this.avatarAgent;
                this.avatarMarker.setPosition(a.sprite.x, a.sprite.y - a.size * 0.95).setVisible(true);
            } else {
                this.avatarMarker.setVisible(false);
            }

            const now = this.time.now;
            this.dummyHits = SandboxMath.prune(this.dummyHits, now, SandboxMath.ROLLING_WINDOW_MS);
            this.refreshDpsText();

            const a = this.avatarAgent;
            const ready = !!a && !a.ko && a.cooldown <= 0;
            this.attackBody.setAlpha(ready ? 1 : 0.5);
        }
    };
}
