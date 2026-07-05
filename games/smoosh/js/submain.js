// =============================================================================
// SMOOSH! - submain.js  (v7 T14 - "Smoosh Neon Midway" sub-main hub)
// SubMainScene sits BETWEEN MenuScene (now PLAY-only) and every destination
// scene: a static (non-scrolling) neon-carnival boardwalk with 9 distinct
// "attraction" nodes, one per destination (including the now-shipped
// INFINITE/SANDBOX modes, both ACTIVE - no locked/"SOON" state needed).
// Synthesizes docs/superpowers/ideation/2026-07-05-smoosh-v7-t14-submain-
// hub.md's recommended design: Marisol's Neon Midway theme, hardened with
// Ozzie's uniform-hit-rect tap-safety discipline (the v6 Task 4 mis-tap
// regression class), Pemberly's pet/decor personalization (buildMenuPets/
// buildMenuYard reuse), and StageMap's dotted-path visual language.
//
// Pure half (SubMain: NODES table + hit-rect math) is exported first so
// tests/submain.test.js can require() this file from plain Node - same
// dual-mode pattern as stagemap.js/dex.js/nestscene.js.
// =============================================================================

const SubMain = {
    NODE_HIT: 170,   // uniform padded hit-rect size for EVERY node, regardless
                      // of that node's actual art footprint - same "art can
                      // vary, hit-radius stays predictable" precedent as
                      // stagemap.js's STAGEMAP_R boss-node scaling. This is
                      // Ozzie's tap-safety discipline layered on top of
                      // Marisol's varied-silhouette attractions (ideation
                      // doc's synthesis).
    NODE_CORE: 140,  // visual "base plate" size every node renders its
                      // silhouette/label against.
    NODE_PAD: 15,    // (140 + 2*15 = 170) - same makeUiButton padding math
                      // (ui.js), just computed once here instead of passed
                      // as an opts.pad override.

    // Design-space coordinates, screen-fixed (720x1280), no scroll - reuses
    // StageMap-style x lanes (150/360/570) for visual consistency with the
    // existing map scene. Row y-spacing is authored so every SAME-COLUMN
    // pair clears NODE_HIT vertically (the only axis where two nodes ever
    // share a coordinate) - see tests/submain.test.js's exhaustive pairwise
    // non-overlap assertion, which is the actual guard against regressions
    // here (this comment just explains the intent).
    NODES: [
        { id: 'stagemap', label: 'STAGE MAP', x: 360, y: 225,  target: 'StageMapScene', shape: 'gate',    accent: CONFIG.PASTEL.accent },
        { id: 'friends',  label: 'FRIENDS',   x: 150, y: 370,  target: 'FriendsScene',  shape: 'hut',     accent: CONFIG.PASTEL.gemText },
        { id: 'infinite', label: 'INFINITE',  x: 570, y: 370,  target: 'InfiniteScene', shape: 'tower',   accent: CONFIG.PASTEL.crit },
        { id: 'pvp',      label: 'PVP ARENA', x: 360, y: 515,  target: 'PvpScene',      shape: 'arena',   accent: CONFIG.PASTEL.danger },
        { id: 'nest',     label: 'NEST',      x: 150, y: 665,  target: 'NestScene',     shape: 'cottage', accent: CONFIG.PASTEL.good },
        { id: 'sandbox',  label: 'SANDBOX',   x: 570, y: 665,  target: 'SandboxScene',  shape: 'shed',    accent: CONFIG.PASTEL.inkSoft },
        { id: 'shop',     label: 'SHOP',      x: 150, y: 885,  target: 'ShopScene',     shape: 'stall',   accent: CONFIG.PASTEL.gold },
        { id: 'dex',      label: 'DEX',       x: 570, y: 885,  target: 'DexScene',      shape: 'tent',    accent: CONFIG.PASTEL.elements.dark.soft },
        { id: 'play',     label: 'PLAY',      x: 360, y: 1065, target: 'GameScene',     shape: 'castle',  accent: CONFIG.PASTEL.accent, big: true }
    ],

    // AABB for a node's padded hit-rect, centered on (x,y) - pure + testable.
    hitRect(node, size) {
        const h = (size || this.NODE_HIT) / 2;
        return { x0: node.x - h, y0: node.y - h, x1: node.x + h, y1: node.y + h };
    },

    rectsOverlap(a, b) {
        return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
    },

    // v6 Task 4 mis-tap regression class, as a real assertion: true iff every
    // pair of nodes' padded hit-rects are disjoint (touching edges - equal
    // coordinates, zero overlap area - are NOT a violation).
    allDisjoint() {
        for (let i = 0; i < this.NODES.length; i++) {
            for (let j = i + 1; j < this.NODES.length; j++) {
                if (this.rectsOverlap(this.hitRect(this.NODES[i]), this.hitRect(this.NODES[j]))) return false;
            }
        }
        return true;
    }
};

if (typeof module !== 'undefined') module.exports = { SubMain };

// =============================================================================
// SubMainScene - Phaser-guarded so this file stays require()-able from plain
// Node tests. `let` (not `class ... {}`) at script scope: see the CROSS-
// SCRIPT SCOPING RULE note in stagemap.js - a class declared directly inside
// this `if` block would be block-scoped and invisible to main.js's
// `scene: [...]` array.
// =============================================================================
let SubMainScene; // eslint-disable-line no-unused-vars

if (typeof Phaser !== 'undefined') {

    // v7 T14: hub pet-roam layer, adapted from ui.js's MenuScene buildMenuPets/
    // spawnMenuPet (same NestAI-driven wander/chase/nap idle AI). A bigger cap
    // than the menu's MENU_PET_CAP=6 since the hub's roam band covers most of
    // the 720x1280 screen instead of one band - still cheap (no per-frame
    // physics, just lerp-toward-target + occasional tweened hops).
    const HUB_PET_CAP = 8;
    const HUB_PET_SIZE = 54;
    // Roam band excludes the header (y<150) and stays inside the screen -
    // pets render at depth 2-4, strictly BELOW every node's base (depth 9),
    // silhouette (depth 10) and label (depth 11), so a wandering pet can
    // never visually or input-wise compete with a hub node's tap target
    // (same depth discipline as v6 Task 10's MenuScene pets).
    const HUB_ROAM = { x: 50, y: 165, w: 620, h: 1075 };

    // Per-shape Graphics silhouette - one bespoke primitive combo per
    // attraction (BootScene._makeUpgradeIcons' hand-drawn recipe, just drawn
    // live instead of baked to a shared texture, since each shape is used
    // exactly once). All primitives are sized relative to SubMain.NODE_CORE
    // so they read as "sitting on" the node's base plate.
    function drawHubShape(g, shape, cx, cy, color) {
        switch (shape) {
            case 'gate': // Stage Map - neon arch over a road stub
                g.lineStyle(7, color, 1);
                g.beginPath(); g.arc(cx, cy + 10, 44, Math.PI, 0, false); g.strokePath();
                g.fillStyle(color, 1);
                g.fillRect(cx - 50, cy + 4, 9, 36);
                g.fillRect(cx + 41, cy + 4, 9, 36);
                break;
            case 'hut': // Friends - picnic-bench hut + two flag pennants
                g.fillStyle(color, 1);
                g.fillTriangle(cx - 42, cy - 2, cx + 42, cy - 2, cx, cy - 42);
                g.fillStyle(color, 0.5);
                g.fillRect(cx - 30, cy - 2, 60, 34);
                g.fillStyle(color, 1);
                g.fillTriangle(cx - 46, cy - 28, cx - 30, cy - 28, cx - 38, cy - 44);
                g.fillTriangle(cx + 30, cy - 28, cx + 46, cy - 28, cx + 38, cy - 44);
                break;
            case 'tower': // Infinite - spiraling tower, tapering blocks
                g.fillStyle(color, 1);
                g.fillRect(cx - 34, cy + 12, 68, 20);
                g.fillRect(cx - 26, cy - 12, 52, 20);
                g.fillRect(cx - 18, cy - 36, 36, 20);
                g.fillRect(cx - 10, cy - 56, 20, 18);
                g.fillCircle(cx, cy - 62, 8);
                break;
            case 'arena': // PvP - colosseum ring + crossed swords
                g.lineStyle(8, color, 1);
                g.strokeCircle(cx, cy, 40);
                g.lineStyle(5, color, 1);
                g.lineBetween(cx - 24, cy - 24, cx + 24, cy + 24);
                g.lineBetween(cx + 24, cy - 24, cx - 24, cy + 24);
                break;
            case 'cottage': // Nest - triangle roof + round window
                g.fillStyle(color, 1);
                g.fillTriangle(cx - 44, cy - 2, cx + 44, cy - 2, cx, cy - 44);
                g.fillStyle(color, 0.55);
                g.fillRoundedRect(cx - 34, cy - 2, 68, 40, 6);
                g.fillStyle(color, 1);
                g.fillCircle(cx, cy + 14, 10);
                break;
            case 'shed': // Sandbox - tucked-away workshop + wrench glyph
                g.fillStyle(color, 0.7);
                g.fillRoundedRect(cx - 30, cy - 18, 60, 46, 6);
                g.fillStyle(color, 1);
                g.fillRect(cx - 30, cy - 22, 60, 10);
                g.lineStyle(5, color, 1);
                g.lineBetween(cx - 12, cy + 12, cx + 12, cy - 12);
                g.strokeCircle(cx - 14, cy + 14, 7);
                g.strokeCircle(cx + 14, cy - 14, 7);
                break;
            case 'stall': // Shop - striped awning + counter
                for (let i = -3; i <= 2; i++) {
                    g.fillStyle(i % 2 === 0 ? color : CONFIG.PASTEL.white, i % 2 === 0 ? 1 : 0.85);
                    g.fillTriangle(cx + i * 15, cy - 18, cx + i * 15 + 15, cy - 18, cx + i * 15 + 7.5, cy - 32);
                }
                g.fillStyle(color, 0.5);
                g.fillRect(cx - 40, cy - 18, 80, 34);
                break;
            case 'tent': // Dex - curiosity tent + dark entrance flap
                g.fillStyle(color, 1);
                g.fillTriangle(cx - 44, cy + 14, cx + 44, cy + 14, cx, cy - 40);
                g.fillStyle(CONFIG.PASTEL.bg, 1);
                g.fillTriangle(cx - 12, cy + 14, cx + 12, cy + 14, cx, cy - 4);
                break;
            case 'castle': // Play - biggest silhouette, crenellated keep
                g.fillStyle(color, 1);
                g.fillRoundedRect(cx - 60, cy - 26, 120, 58, 8);
                for (let i = -2; i <= 2; i++) g.fillRect(cx + i * 22 - 8, cy - 46, 16, 22);
                break;
        }
    }

    SubMainScene = class SubMainScene extends Phaser.Scene {
        constructor() { super({ key: 'SubMainScene' }); }

        create() {
            const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
            this._navigating = false;   // guards a double-tap from firing two fades/gotos
            this._tweenTargets = [];    // every repeat:-1 tween target, killed on shutdown

            // v7 final-review fix: T14 made this hub the player's real "home"
            // (MenuScene is now just a transient PLAY-only splash), so the
            // menu-only banner convention (ads.js) left every non-paying
            // player with NO banner surface at all once past the splash.
            // Mirrors MenuScene's own show/hide exactly (AdsManager already
            // early-returns when adsRemoved via the T2 gem IAP).
            if (typeof AdsManager !== 'undefined') {
                AdsManager.showBanner();
            }

            this.add.rectangle(W / 2, H / 2, W, H, CONFIG.PASTEL.bg).setDepth(0);
            // ambient blobs - one notch lighter than bg, same convention as
            // every other scene's backdrop (menu/nest/stagemap).
            for (const [bx, by, br] of [[90, 300, 140], [640, 520, 110],
                [110, 960, 130], [610, 1160, 150]]) {
                this.add.circle(bx, by, br, CONFIG.PASTEL.bgField).setDepth(0);
            }

            this.drawPath();          // depth 1 - dotted neon boardwalk
            this.buildDecorScatter(); // depth 1 - sampled decor near NEST
            this.buildHubPets();      // depth 2-4 - roaming owned pets, non-interactive

            this.nodeViews = SubMain.NODES.map(n => this.buildNode(n));

            this.buildHeader();       // depth 9-10 - wallet + title band
            this.buildSoundToggle();  // depth 10 - ported from MenuScene, hub-reachable now

            this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
                this.tweens.killTweensOf(this._tweenTargets);
                // mirrors MenuScene's own hideBanner-on-shutdown
                if (typeof AdsManager !== 'undefined') AdsManager.hideBanner();
            });
        }

        // -------------------------------------------------------------------
        // Header: wallet chips, same convention/values as MenuScene's own.
        // -------------------------------------------------------------------
        buildHeader() {
            const W = CONFIG.WIDTH;
            const st = SaveManager.state;
            this.add.rectangle(W / 2, 60, W, 120, CONFIG.PASTEL.bg).setDepth(9);
            this.add.image(70, 56, 'coin-tex').setDisplaySize(28, 28).setDepth(10);
            this.goldText = this.add.text(92, 56, Balance.fmt(st.gold), {
                fontFamily: CONFIG.FONT, fontSize: '22px', color: Balance.hex(CONFIG.PASTEL.goldText)
            }).setOrigin(0, 0.5).setDepth(10);
            this.add.image(240, 56, 'gem-tex').setDisplaySize(26, 26).setDepth(10);
            this.gemText = this.add.text(260, 56, Balance.fmt(st.gems), {
                fontFamily: CONFIG.FONT, fontSize: '22px', color: Balance.hex(CONFIG.PASTEL.accent)
            }).setOrigin(0, 0.5).setDepth(10);
            const title = this.add.text(W / 2, 56, 'SMOOSH! MIDWAY', {
                fontFamily: CONFIG.FONT, fontSize: '18px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
            }).setOrigin(0.5).setDepth(10);
            fitToWidth(title, 300);
        }

        // -------------------------------------------------------------------
        // v7 final-review fix: sound (mute) toggle, ported from MenuScene
        // (ui.js) - RESET PROGRESS stays MenuScene-only (destructive, fine to
        // leave one level up), but mute needs to be reachable from the
        // player's actual home now that PLAY drops them here instead of back
        // through the menu. Same st.muted state + Sfx.setMuted call as the
        // original (not forked), wrapped in padTapArea (v6 Task 4 convention)
        // for a forgiving corner hit-box. Sits at the header's far-right
        // corner (y<=83 padded), well clear of every node's 170x170 padded
        // hit-rect (nearest node, STAGE MAP, has its top edge at y=140 - see
        // SubMain.NODES/allDisjoint above).
        // -------------------------------------------------------------------
        buildSoundToggle() {
            const W = CONFIG.WIDTH;
            const st = SaveManager.state;
            const soundLabel = () => st.muted ? 'SOUND OFF' : 'SOUND ON';
            const toggle = this.add.text(W - 36, 56, soundLabel(), {
                fontFamily: CONFIG.FONT, fontSize: '22px', color: Balance.hex(st.muted ? CONFIG.PASTEL.inkSoft : CONFIG.PASTEL.goodText)
            }).setOrigin(1, 0.5).setDepth(10);
            padTapArea(toggle);
            toggle.on('pointerdown', () => {
                st.muted = !st.muted;
                SaveManager.persist();
                Sfx.setMuted(st.muted);
                toggle.setText(soundLabel());
                toggle.setColor(Balance.hex(st.muted ? CONFIG.PASTEL.inkSoft : CONFIG.PASTEL.goodText));
            });
        }

        // -------------------------------------------------------------------
        // Dotted boardwalk: a center spine (stagemap -> pvp -> play) with
        // left<->right rungs at each shared row - reads as a loose S-curve
        // without needing StageMapScene's full scroll machinery (9 static
        // nodes fit one screen). Same fillCircle-along-segment dot technique
        // as StageMap.drawPath.
        // -------------------------------------------------------------------
        drawPath() {
            const g = this.add.graphics().setDepth(1);
            g.fillStyle(CONFIG.PASTEL.accent, 0.35);
            const DOTS = 10;
            const dotLine = (a, b) => {
                for (let s = 1; s < DOTS; s++) {
                    const t = s / DOTS;
                    g.fillCircle(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 3);
                }
            };
            const byId = {};
            SubMain.NODES.forEach(n => { byId[n.id] = n; });
            dotLine(byId.stagemap, byId.pvp);
            dotLine(byId.pvp, byId.play);
            dotLine(byId.friends, byId.infinite);
            dotLine(byId.nest, byId.sandbox);
            dotLine(byId.shop, byId.dex);
        }

        // -------------------------------------------------------------------
        // Ground clutter: up to 2 sampled decorPlaced items near the NEST
        // node (mirrors buildMenuYard's decor sampling - ties the hub
        // visually back to the player's actual save data). Non-interactive,
        // depth 1 (below pets/nodes).
        // -------------------------------------------------------------------
        buildDecorScatter() {
            const placed = SaveManager.state.decorPlaced || [];
            if (!placed.length || typeof Decor === 'undefined') return;
            const nestNode = SubMain.NODES.find(n => n.id === 'nest');
            const spots = [
                { x: nestNode.x - 66, y: nestNode.y + 66 },
                { x: nestNode.x + 66, y: nestNode.y + 66 }
            ];
            const sample = Phaser.Utils.Array.Shuffle(placed.slice()).slice(0, spots.length);
            sample.forEach((p, i) => {
                if (!Decor.byId(p.id)) return;
                this.add.image(spots[i].x, spots[i].y, 'decor-' + p.id)
                    .setDisplaySize(40, 40).setAlpha(0.85).setDepth(1);
            });
        }

        // -------------------------------------------------------------------
        // Hub node: glow ring + base plate (the interactive body) + bespoke
        // silhouette + label. PLAY additionally shows the current stage
        // number + rep pet portrait (same repPet fallback as StageMap's
        // frontier node).
        // -------------------------------------------------------------------
        buildNode(n) {
            const isBig = !!n.big;

            // idle glow ring - looping alpha 0.3<->0.7 over 1.6-2.4s,
            // randomized phase/period so nodes don't pulse in lockstep.
            const glow = this.add.image(n.x, n.y, 'ring-tex').setDepth(8)
                .setTint(n.accent).setAlpha(0.3).setDisplaySize(isBig ? 216 : 178, isBig ? 216 : 178);
            this.tweens.add({
                targets: glow, alpha: 0.7, duration: Phaser.Math.Between(1600, 2400),
                delay: Phaser.Math.Between(0, 1500), yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
            this._tweenTargets.push(glow);

            // Base plate - the ONLY interactive object for this node. Visual
            // footprint (NODE_CORE=140) is independent of the node's actual
            // silhouette (which can bleed past it, e.g. PLAY's castle/pet) -
            // the padded hit rect is always NODE_HIT (170x170), computed off
            // this same 140-core + 15-pad math regardless of `big`, so PLAY
            // never grows a bigger hit box than its neighbors (SubMain.
            // allDisjoint() / tests/submain.test.js enforce this holds for
            // every pair at the coordinates above).
            const coreSize = SubMain.NODE_CORE, pad = SubMain.NODE_PAD;
            const base = this.add.nineslice(n.x, n.y, 'btn-tex', 0, coreSize, coreSize, 24, 24, 24, 24)
                .setTint(CONFIG.PASTEL.panelLight).setDepth(9);
            base.setInteractive(
                new Phaser.Geom.Rectangle(-pad, -pad, coreSize + pad * 2, coreSize + pad * 2),
                Phaser.Geom.Rectangle.Contains
            );
            base.input.cursor = 'pointer';
            base.on('pointerdown', () => this.tapNode(n));

            const gfx = this.add.graphics().setDepth(10);
            drawHubShape(gfx, n.shape, n.x, n.y, n.accent);

            const label = this.add.text(n.x, n.y + coreSize / 2 + 24, n.label, {
                fontFamily: CONFIG.FONT, fontSize: isBig ? '20px' : '15px', color: Balance.hex(CONFIG.PASTEL.ink)
            }).setOrigin(0.5).setDepth(11);
            fitToWidth(label, coreSize + 40);

            let stageText = null, petImg = null;
            if (n.id === 'play') {
                const st = SaveManager.state;
                stageText = this.add.text(n.x, n.y + 8, 'STAGE ' + st.stage, {
                    fontFamily: CONFIG.FONT, fontSize: '14px', color: Balance.hex(CONFIG.PASTEL.bg)
                }).setOrigin(0.5).setDepth(11);
                fitToWidth(stageText, coreSize - 16);
                const repId = st.repPet || (st.pets[0] && st.pets[0].species);
                if (repId && this.textures.exists('pet-' + repId)) {
                    petImg = this.add.image(n.x, n.y - 28, 'pet-' + repId).setDisplaySize(54, 54).setDepth(12);
                }
            }

            return { node: n, base, glow, gfx, label, stageText, petImg };
        }

        // -------------------------------------------------------------------
        // Navigation: short camera fade (reads as "walking through the
        // gate") then SmooshGame.goto(). _navigating guards a double-tap
        // from queuing two fades/gotos - harmless in practice (goto() stops
        // every running scene) but this keeps a single, predictable
        // transition regardless of how fast someone taps.
        // -------------------------------------------------------------------
        tapNode(n) {
            if (this._navigating) return;
            this._navigating = true;
            this.cameras.main.fadeOut(160, 13, 2, 33); // CONFIG.PASTEL.bg as r/g/b
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                SmooshGame.goto(n.target);
            });
        }

        // -------------------------------------------------------------------
        // v7 T14: owned pets roaming the hub - adapted from ui.js MenuScene's
        // buildMenuPets/spawnMenuPet/update (same NestAI-driven wander/chase/
        // nap idle AI, fed hasToys=false exactly like the menu). Kept as its
        // own copy (not a shared helper) - same precedent as NestScene's
        // buildAgents/update being its own separate implementation of a
        // similar idea.
        // -------------------------------------------------------------------
        buildHubPets() {
            const owned = (SaveManager.state.pets && SaveManager.state.pets.length)
                ? SaveManager.state.pets
                : [{ species: (typeof PET_SPECIES !== 'undefined' && PET_SPECIES[0]) ? PET_SPECIES[0].id : 'cat' }];
            const sample = Phaser.Utils.Array.Shuffle(owned.slice()).slice(0, Math.min(HUB_PET_CAP, owned.length));
            this.hubPets = sample.map(p => this.spawnHubPet(p.species));
        }

        spawnHubPet(speciesId) {
            const def = (typeof PET_SPECIES !== 'undefined') ? PET_SPECIES.find(p => p.id === speciesId) : null;
            const key = 'pet-' + (def ? def.id : speciesId);
            const x = Phaser.Math.Between(HUB_ROAM.x + 30, HUB_ROAM.x + HUB_ROAM.w - 30);
            const y = Phaser.Math.Between(HUB_ROAM.y + 30, HUB_ROAM.y + HUB_ROAM.h - 30);
            // Non-interactive by design (v6 Task 10 review precedent) AND
            // depth 2-4, strictly below every node's base/silhouette/label
            // (depth 9-11) - a wandering pet can never eat a node's tap or
            // visually bury its icon/label.
            const shadow = this.add.ellipse(x, y + HUB_PET_SIZE * 0.42, HUB_PET_SIZE * 0.8, HUB_PET_SIZE * 0.26, 0x000000, 0.22).setDepth(2);
            const sprite = this.add.image(x, y, key).setDisplaySize(HUB_PET_SIZE, HUB_PET_SIZE).setDepth(3);
            const badge = this.add.text(x, y - HUB_PET_SIZE * 0.72, '', {
                fontFamily: CONFIG.FONT, fontSize: '15px'
            }).setOrigin(0.5).setDepth(4);
            const agent = {
                sprite, shadow, badge, x, y, tx: x, ty: y,
                baseScale: sprite.scaleX,
                state: 'wander', stateT: NestAI.dwell(Math.random),
                chaseTarget: null, bobPhase: Math.random() * Math.PI * 2,
                hopT: Phaser.Math.FloatBetween(2.5, 5)
            };
            this.pickHubWanderTarget(agent);
            return agent;
        }

        pickHubWanderTarget(a) {
            a.tx = Phaser.Math.Between(HUB_ROAM.x + 30, HUB_ROAM.x + HUB_ROAM.w - 30);
            a.ty = Phaser.Math.Between(HUB_ROAM.y + 30, HUB_ROAM.y + HUB_ROAM.h - 30);
        }

        // Returns true once within arrival radius of (tx,ty). Moves the
        // agent's LOGICAL x/y only - update() layers a bob offset on top for
        // the displayed sprite position (same split as MenuScene's own pets).
        moveHubPet(a, tx, ty, speed, dt) {
            const dx = tx - a.x, dy = ty - a.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 6) return true;
            const step = Math.min(dist, speed * dt);
            a.x += (dx / dist) * step;
            a.y += (dy / dist) * step;
            if (Math.abs(dx) > 2) a.sprite.flipX = dx < 0;
            return false;
        }

        update(time, delta) {
            if (!this.hubPets || !this.hubPets.length) return;
            const dt = Math.min(0.05, delta / 1000);
            for (const a of this.hubPets) {
                a.stateT -= dt;
                if (a.stateT <= 0) {
                    a.state = NestAI.nextState(a.state, Math.random, false, undefined);
                    a.stateT = NestAI.dwell(Math.random);
                    a.sprite.setScale(a.baseScale);
                    if (a.state === 'wander') {
                        this.pickHubWanderTarget(a);
                    } else if (a.state === 'chase') {
                        const others = this.hubPets.filter(o => o !== a);
                        a.chaseTarget = others.length ? Phaser.Utils.Array.GetRandom(others) : null;
                        if (!a.chaseTarget) { a.state = 'wander'; this.pickHubWanderTarget(a); }
                    }
                }

                if (a.state === 'wander') {
                    this.moveHubPet(a, a.tx, a.ty, 46, dt);
                } else if (a.state === 'chase' && a.chaseTarget) {
                    this.moveHubPet(a, a.chaseTarget.x, a.chaseTarget.y, 70, dt);
                }

                if (a.state !== 'nap') {
                    a.hopT -= dt;
                    if (a.hopT <= 0) {
                        a.hopT = Phaser.Math.FloatBetween(3, 6);
                        this.tweens.add({
                            targets: a.sprite, scaleX: a.baseScale * 0.82, scaleY: a.baseScale * 1.18,
                            duration: 110, yoyo: true, ease: 'Quad.easeOut'
                        });
                    }
                    a.sprite.setAlpha(1);
                    a.sprite.y = a.y + Math.sin(time / 260 + a.bobPhase) * 4;
                    a.badge.setText('');
                } else {
                    a.sprite.setAlpha(0.6);
                    a.sprite.y = a.y;
                    a.sprite.setScale(a.baseScale * (1 + Math.sin(time / 500 + a.bobPhase) * 0.03));
                    a.badge.setText('💤').setAlpha(0.6 + 0.4 * Math.sin(time / 400 + a.bobPhase));
                }
                a.sprite.x = a.x;
                a.shadow.setPosition(a.x, a.y + HUB_PET_SIZE * 0.42);
                a.badge.setPosition(a.x, a.sprite.y - HUB_PET_SIZE * 0.72);
            }
        }
    };
}
