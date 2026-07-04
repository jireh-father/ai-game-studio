// =============================================================================
// SMOOSH! - stagemap.js
// v3.0 zigzag stage map. Pure layout + the StageMapScene (vertical scroll,
// tap a cleared node to REPLAY: 30% gold, 100% drops - Balance.replayGoldMult).
// =============================================================================

const StageMap = {
    LANES: [130, 250, 360, 470, 590],
    STEP_Y: 150,

    // Pure + deterministic: same (centerStage, count) always produces the same
    // array, so the scene can safely rebuild it on every create() without
    // needing to persist node positions anywhere.
    layout(centerStage, count) {
        const startStage = Math.max(1, centerStage - Math.floor(count / 2));
        const nodes = [];
        for (let i = 0; i < count; i++) {
            const stage = startStage + i;
            nodes.push({
                stage,
                x: this.LANES[CONFIG.dateHash('node' + stage) % this.LANES.length],
                y: -i * this.STEP_Y,   // scene offsets; higher stage = higher up
                boss: stage % CONFIG.BOSS.every === 0
            });
        }
        return nodes;
    }
};

if (typeof module !== 'undefined') module.exports = { StageMap };

// =============================================================================
// StageMapScene - vertical drag/wheel-scrollable zigzag path. Guarded so this
// file stays require()-able (and side-effect-free) from plain Node tests.
// `let` (not `class ... {}`) at script scope: a `class` declared directly
// inside the if-block below would be block-scoped to that block and
// invisible to main.js's `scene: [...]` array - the class EXPRESSION is
// assigned to this outer binding instead so it stays a normal script-global.
// =============================================================================
let StageMapScene; // eslint-disable-line no-unused-vars

if (typeof Phaser !== 'undefined') {

    const STAGEMAP_NODE_COUNT = 40;
    const STAGEMAP_R = 34;

    StageMapScene = class StageMapScene extends Phaser.Scene {
        constructor() { super({ key: 'StageMapScene' }); }

        create() {
            const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
            this.viewTop = 150;
            this.viewBottom = H - 20;

            this.add.rectangle(W / 2, H / 2, W, H, CONFIG.COLORS.bg).setDepth(0);

            const st = SaveManager.state;
            this.currentStage = st.stage;
            this.nodes = StageMap.layout(this.currentStage, STAGEMAP_NODE_COUNT);

            // --- scrollable world: dotted path + node markers ---
            this.mapContainer = this.add.container(0, 0).setDepth(1);
            this.pathGfx = this.add.graphics();
            this.mapContainer.add(this.pathGfx);
            this.drawPath();

            this.nodeViews = this.nodes.map(n => this.buildNode(n));

            // --- fixed header (always covers scrolled-past nodes) ---
            this.add.rectangle(W / 2, 72, W, 144, CONFIG.COLORS.bg).setDepth(5);
            const back = this.add.text(44, 56, '‹', {
                fontFamily: 'Arial, sans-serif', fontSize: '48px', fontStyle: 'bold', color: Balance.hex(CONFIG.PASTEL.inkSoft)
            }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
            back.on('pointerdown', () => SmooshGame.goto('MenuScene'));

            // v4.0 Phase C Task 3: title is on-bg (not on-panel) but still a
            // gold/good hue text - goodText reads even better here since bg
            // (0xf6f1fb) is lighter than the panel goodText was tuned against.
            this.add.text(W / 2, 56, I18n.t('map.title'), {
                fontFamily: 'Arial, sans-serif', fontSize: '40px', fontStyle: 'bold', color: Balance.hex(CONFIG.PASTEL.goodText)
            }).setOrigin(0.5).setDepth(10);
            this.add.text(W / 2, 100, I18n.t('map.replayReward'), {
                fontFamily: 'Arial, sans-serif', fontSize: '20px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
            }).setOrigin(0.5).setDepth(10);

            // --- scroll bounds + initial position centered on the frontier node ---
            this.scrollMin = this.viewBottom;
            this.scrollMax = this.viewTop + (STAGEMAP_NODE_COUNT - 1) * StageMap.STEP_Y;
            const frontierIdx = Math.max(0, this.nodes.findIndex(n => n.stage === this.currentStage));
            const frontierScreenY = (this.viewTop + this.viewBottom) / 2;
            this.scrollY = this.clampScroll(frontierScreenY - this.nodes[frontierIdx].y);
            this.applyScroll();

            this.wireScroll();

            this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.hideReplayConfirm());
        }

        clampScroll(v) { return Phaser.Math.Clamp(v, this.scrollMin, this.scrollMax); }
        applyScroll() { this.mapContainer.y = this.scrollY; }

        drawPath() {
            const g = this.pathGfx;
            g.clear();
            g.fillStyle(CONFIG.PASTEL.inkSoft, 0.55);
            const DOTS_PER_SEGMENT = 8;
            for (let i = 0; i < this.nodes.length - 1; i++) {
                const a = this.nodes[i], b = this.nodes[i + 1];
                for (let s = 1; s < DOTS_PER_SEGMENT; s++) {
                    const t = s / DOTS_PER_SEGMENT;
                    g.fillCircle(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 3);
                }
            }
        }

        buildNode(n) {
            const isCleared = n.stage < this.currentStage;
            const isFrontier = n.stage === this.currentStage;
            const isFuture = n.stage > this.currentStage;
            const r = STAGEMAP_R * (n.boss ? 1.4 : 1) * (isFrontier ? 1.15 : 1);

            const c = this.add.container(n.x, n.y);
            this.mapContainer.add(c);

            // v4.0 Phase C Task 3: cleared = element-neutral pastel panel fill
            // + ink number; future = dimmed inkSoft; frontier (next playable)
            // keeps a vivid accent highlight so it still pops as the "next
            // step". Boss nodes get a gold ring on top of whichever of the
            // three states they're in (a boss can be cleared/future/frontier).
            const fill = isFuture ? CONFIG.PASTEL.inkSoft : (isFrontier ? CONFIG.PASTEL.accent : CONFIG.PASTEL.panel);
            const strokeColor = n.boss ? CONFIG.PASTEL.gold : (isFuture ? CONFIG.PASTEL.inkSoft : CONFIG.PASTEL.white);
            const circle = this.add.circle(0, 0, r, fill, isFuture ? 0.45 : 1)
                .setStrokeStyle(n.boss ? 5 : 3, strokeColor, isFuture ? 0.35 : 0.9);
            c.add(circle);

            const numColor = isFuture ? CONFIG.PASTEL.inkSoft : CONFIG.PASTEL.ink;
            const num = this.add.text(0, 0, String(n.stage), {
                fontFamily: 'Arial, sans-serif', fontSize: (isFrontier ? '24px' : '20px'),
                fontStyle: 'bold', color: Balance.hex(numColor)
            }).setOrigin(0.5);
            c.add(num);

            if (n.boss) {
                const crown = this.add.image(0, -r - 16, 'crown-tex').setDisplaySize(32, 22);
                c.add(crown);
            }

            if (isFrontier) {
                const st = SaveManager.state;
                const repId = st.repPet || (st.pets[0] && st.pets[0].species);
                if (repId && this.textures.exists('pet-' + repId)) {
                    num.setVisible(false);
                    const pet = this.add.image(0, -4, 'pet-' + repId).setDisplaySize(r * 1.3, r * 1.3);
                    c.add(pet);
                }
                // frontier bounces to draw the eye - the node's LOGICAL position
                // (n.x/n.y, used for hit-testing) never changes, only this tween.
                this.tweens.add({
                    targets: c, y: n.y - 12, duration: 460,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }

            return { node: n, container: c, r, isCleared, isFrontier, isFuture };
        }

        wireScroll() {
            this.dragging = false;
            this.dragMoved = false;
            this.dragStartY = 0;
            this.scrollStartY = 0;
            this._downOverUi = false;

            this.input.on('pointerdown', (pointer, currentlyOver) => {
                this._downOverUi = !!(currentlyOver && currentlyOver.length > 0);
                this.dragging = true;
                this.dragMoved = false;
                this.dragStartY = pointer.y;
                this.scrollStartY = this.scrollY;
            });
            this.input.on('pointermove', (pointer) => {
                if (!this.dragging) return;
                const dy = pointer.y - this.dragStartY;
                if (Math.abs(dy) > 6) this.dragMoved = true;
                this.scrollY = this.clampScroll(this.scrollStartY + dy);
                this.applyScroll();
            });
            this.input.on('pointerup', (pointer) => {
                this.dragging = false;
                // A tap that started/ended over a UI element (back button, the
                // confirm chip's own button) is handled by that element's own
                // pointerdown - never ALSO resolve it as a node tap here.
                if (!this.dragMoved && !this._downOverUi) this.handleTap(pointer.x, pointer.y);
            });
            this.input.on('wheel', (pointer, gameObjects, dx, dy) => {
                this.scrollY = this.clampScroll(this.scrollY - dy * 0.6);
                this.applyScroll();
            });
        }

        handleTap(x, y) {
            const worldY = y - this.scrollY;
            for (const v of this.nodeViews) {
                const dx = x - v.node.x, dy = worldY - v.node.y;
                if (dx * dx + dy * dy <= v.r * v.r) {
                    this.onNodeTapped(v);
                    return;
                }
            }
            this.hideReplayConfirm();
        }

        onNodeTapped(v) {
            // Any node tap - including a future/frontier one - dismisses a
            // confirm chip left open from a PREVIOUS cleared-node tap.
            this.hideReplayConfirm();
            if (v.isFuture) return; // dimmed, non-interactive by design
            if (v.isFrontier) {
                this.scene.start('GameScene');
                return;
            }
            // cleared -> confirm chip before committing to a replay run
            this.showReplayConfirm(v.node.stage);
        }

        showReplayConfirm(stageNum) {
            this.hideReplayConfirm();
            const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
            const y = H - 100;

            const bg = this.add.nineslice(W / 2, y, 'btn-tex', 0, W - 40, 140, 24, 24, 24, 24)
                .setTint(CONFIG.PASTEL.panel).setDepth(20);
            const label = this.add.text(W / 2, y - 32, I18n.t('map.stageN', { n: stageNum }), {
                fontFamily: 'Arial, sans-serif', fontSize: '26px', fontStyle: 'bold', color: Balance.hex(CONFIG.PASTEL.ink)
            }).setOrigin(0.5).setDepth(21);
            this._confirmParts = [bg, label];

            this._confirmBtn = makeUiButton(this, W / 2, y + 28, 380, 68,
                I18n.t('map.replay'), CONFIG.PASTEL.accent, () => {
                    this.hideReplayConfirm();
                    this.scene.start('GameScene', { replayStage: stageNum });
                });
        }

        hideReplayConfirm() {
            if (this._confirmParts) { this._confirmParts.forEach(o => o.destroy()); this._confirmParts = null; }
            if (this._confirmBtn) { this._confirmBtn.destroyAll(); this._confirmBtn = null; }
        }
    };
}
