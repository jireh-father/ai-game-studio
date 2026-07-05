// =============================================================================
// SMOOSH! - main.js  (ALWAYS the LAST script in index.html)
// BootScene: registers ALL textures exactly once (28 jelly SVGs + procedural),
// then starts MenuScene.
// =============================================================================

class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    create() {
        I18n.detect();
        SaveManager.init();
        if (typeof Sfx !== 'undefined' && Sfx.setMuted) Sfx.setMuted(SaveManager.state.muted);

        if (typeof AdsManager !== 'undefined' && AdsManager.init) {
            AdsManager.init().catch(() => {});
        }

        // Fire-and-forget: the live "smoosh" Firebase project is wired via
        // FB_CONFIG (Phase B Task 7). Social still degrades to offline mode
        // with zero UI impact if init ever fails (no network, etc.).
        if (typeof Social !== 'undefined' && Social.init) {
            Social.init().catch(() => {});
        }

        this._makeProceduralTextures();
        this._loadSpeciesTextures(() => this.scene.start('MenuScene'));
    }

    // All SVG art -> base64 textures, registered ONCE here.
    _loadSpeciesTextures(onReady) {
        const jobs = [];
        // v5.0 RETRO ARCADE Task 3: character/decor art bakes to a SMALL
        // fixed raster (CONFIG.PIXEL) instead of its natural display size -
        // see config.js CONFIG.PIXEL doc comment for why/sizing rationale.
        // `pixel: true` marks jobs that must additionally get the NEAREST
        // filter once loaded (below); the viewBox-based SVG still scales
        // its content correctly to whatever width/height the <svg> tag is
        // given, so this is a pure resolution cut - no painter changes.
        const BAKE = CONFIG.PIXEL.bake;
        const BAKE_DECOR = CONFIG.PIXEL.bakeDecor || BAKE;
        for (const sp of SPECIES) {
            jobs.push({ key: 'sp-' + sp.id + '-idle', svg: sp.svgIdle, size: BAKE, pixel: true });
            jobs.push({ key: 'sp-' + sp.id + '-squash', svg: sp.svgSquash, size: BAKE, pixel: true });
        }
        for (const p of PET_SPECIES) {
            jobs.push({ key: 'pet-' + p.id, svg: p.svg, size: BAKE, pixel: true });
        }
        // v3.5 Task 3: nest decor - one texture per catalog item (shop grid +
        // future placement), keyed 'decor-{id}'.
        for (const d of DECOR_ITEMS) {
            jobs.push({ key: 'decor-' + d.id, svg: d.svg, size: BAKE_DECOR, pixel: true });
        }
        jobs.push({ key: 'nest-tex', svg: NEST_SVG, size: 220, h: 150 });
        const pending = new Set(jobs.map(j => j.key));
        const pixelKeys = new Set(jobs.filter(j => j.pixel).map(j => j.key));
        const onAdd = (key) => {
            pending.delete(key);
            // Explicit per-texture NEAREST: render.pixelArt (main.js Task 2)
            // already forces this game-wide, but character/decor textures
            // set it directly too so the blocky bake survives even if the
            // global render flag is ever loosened for some other reason.
            if (pixelKeys.has(key)) {
                const tex = this.textures.get(key);
                if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
            }
            if (pending.size === 0) {
                this.textures.off('addtexture', onAdd);
                onReady();
            }
        };
        this.textures.on('addtexture', onAdd);
        for (const j of jobs) {
            if (this.textures.exists(j.key)) { onAdd(j.key); continue; }
            // Explicit width/height: viewBox-only SVGs rasterize at 300x150
            // in some browsers. For pixel jobs this is also *the* bake step -
            // the browser rasterizes the (much larger) viewBox content down
            // to this small width/height when decoding the data URI image,
            // which is what gives the low-res/blocky source texture.
            const svg = j.svg.replace('<svg ', `<svg width="${j.size}" height="${j.h || j.size}" `);
            const b64 = btoa(unescape(encodeURIComponent(svg)));
            this.textures.addBase64(j.key, 'data:image/svg+xml;base64,' + b64);
        }
    }

    _makeProceduralTextures() {
        let g;

        // pop-tex: soft round particle
        g = this.add.graphics();
        g.fillStyle(0xffffff, 1); g.fillCircle(12, 12, 8);
        g.fillStyle(0xffffff, 0.4); g.fillCircle(12, 12, 12);
        g.generateTexture('pop-tex', 24, 24);
        g.destroy();

        // goo-tex: splat blob (tinted at runtime)
        g = this.add.graphics();
        g.fillStyle(0xffffff, 0.5);
        g.fillCircle(32, 30, 18);
        g.fillCircle(16, 40, 9);
        g.fillCircle(48, 42, 7);
        g.fillCircle(40, 14, 6);
        g.generateTexture('goo-tex', 64, 56);
        g.destroy();

        // coin-tex v2.1: embossed star coin with rim ticks + gloss
        g = this.add.graphics();
        g.fillStyle(0xb8811c, 1); g.fillCircle(24, 26, 21);          // under-shadow
        g.fillStyle(0xffd54a, 1); g.fillCircle(24, 23, 21);          // face
        g.lineStyle(3, 0xb8811c, 1); g.strokeCircle(24, 23, 17);     // inner rim
        for (let i = 0; i < 12; i++) {                               // rim ticks
            const a = i * Math.PI / 6;
            g.lineBetween(24 + Math.cos(a) * 18, 23 + Math.sin(a) * 18,
                24 + Math.cos(a) * 20.5, 23 + Math.sin(a) * 20.5);
        }
        g.fillStyle(0xe8b232, 1);                                    // embossed star
        g.fillPoints([
            { x: 24, y: 11 }, { x: 27, y: 19 }, { x: 35, y: 19 }, { x: 29, y: 24 },
            { x: 31, y: 32 }, { x: 24, y: 27 }, { x: 17, y: 32 }, { x: 19, y: 24 },
            { x: 13, y: 19 }, { x: 21, y: 19 }
        ], true);
        g.fillStyle(0xffffff, 0.55);                                 // gloss arc
        g.fillEllipse(18, 13, 16, 7);
        g.generateTexture('coin-tex', 48, 48);
        g.destroy();

        // spark-tex: 4-point star
        g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillPoints([
            { x: 12, y: 0 }, { x: 15, y: 9 }, { x: 24, y: 12 }, { x: 15, y: 15 },
            { x: 12, y: 24 }, { x: 9, y: 15 }, { x: 0, y: 12 }, { x: 9, y: 9 }
        ], true);
        g.generateTexture('spark-tex', 24, 24);
        g.destroy();

        // white-tex: generic quad
        g = this.add.graphics();
        g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 8, 8);
        g.generateTexture('white-tex', 8, 8);
        g.destroy();

        // btn-tex: white rounded rect for NineSlice buttons/panels (tinted at use)
        g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillRoundedRect(0, 0, 96, 96, 24);
        g.generateTexture('btn-tex', 96, 96);
        g.destroy();

        // pill-tex: slimmer rounded pill for chips/labels
        g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillRoundedRect(0, 0, 64, 36, 18);
        g.generateTexture('pill-tex', 64, 36);
        g.destroy();

        // crown-tex: the boss crown
        g = this.add.graphics();
        g.fillStyle(0xffd54a, 1);
        g.fillPoints([
            { x: 6, y: 44 }, { x: 10, y: 12 }, { x: 26, y: 30 }, { x: 40, y: 6 },
            { x: 54, y: 30 }, { x: 70, y: 12 }, { x: 74, y: 44 }
        ], true);
        g.fillStyle(0xe8b82e, 1); g.fillRect(6, 44, 68, 10);
        g.fillStyle(0xff5ec4, 1); g.fillCircle(40, 22, 5);
        g.generateTexture('crown-tex', 80, 56);
        g.destroy();

        this._makeUpgradeIcons();
    }

    // Hand-drawn white upgrade icons (tinted per upgrade color in the UI).
    _makeUpgradeIcons() {
        let g;

        // up-tap: clenched fist (knuckles + folded fingers + thumb) - reads
        // as "attack power / punch" at a glance. v7 Task 3 redraw (v6 Task 4
        // had made this a sword; the fist is more immediately readable as
        // "power"). Reuse contexts are unchanged from the sword version -
        // this texture is used far beyond the Tap Power upgrade card: the
        // live stats readout tints it the same upgrade blue (game.js
        // ~L128), but spawnItemDrop's 'gear' field drop AND shop.js's GLOVE
        // gear listing tint it per-RARITY (common/rare/epic/legendary, 4
        // different hues - see game.js spawnItemDrop / shop.js
        // RARITY_COLORS). So, same convention as every sibling up-* icon in
        // this function: a PURE WHITE silhouette only - baking in a fixed
        // skin-tone color would multiply-blend into muddy off-hues under
        // those other 3 tint contexts. Shape definition instead comes from
        // tint-neutral black-alpha finger-crease lines + a thumb edge stroke
        // (same trick as up-gold's stroked ellipses below).
        g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillRoundedRect(15, 30, 18, 16, 3);           // wrist
        g.fillRoundedRect(8, 15, 32, 22, 9);            // fist body (folded fingers)
        g.fillCircle(12, 15, 6.5);                      // knuckle 1
        g.fillCircle(20, 15, 6.5);                      // knuckle 2
        g.fillCircle(28, 15, 6.5);                      // knuckle 3
        g.fillCircle(36, 15, 6.5);                      // knuckle 4
        const upTapThumb = [
            { x: 4, y: 26 }, { x: 13, y: 17 }, { x: 19, y: 22 }, { x: 17, y: 31 }, { x: 9, y: 34 }
        ];
        g.fillPoints(upTapThumb, true);                 // thumb wrapping the front
        g.lineStyle(2, 0x000000, 0.22);
        g.strokePoints(upTapThumb, true, true);         // define thumb edge
        g.fillStyle(0x000000, 0.16);
        g.fillRect(15, 16, 2, 18);                      // finger crease
        g.fillRect(23, 16, 2, 18);                      // finger crease
        g.fillRect(31, 16, 2, 18);                      // finger crease
        g.fillRect(15, 31, 18, 2);                      // wrist crease
        g.generateTexture('up-tap', 48, 48);
        g.destroy();

        // up-crit: lightning bolt
        g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillPoints([
            { x: 30, y: 2 }, { x: 10, y: 26 }, { x: 21, y: 26 },
            { x: 16, y: 46 }, { x: 38, y: 19 }, { x: 26, y: 19 }
        ], true);
        g.generateTexture('up-crit', 48, 48);
        g.destroy();

        // up-splash: center dot + 8 burst rays
        g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillCircle(24, 24, 7);
        for (let i = 0; i < 8; i++) {
            const a = i * Math.PI / 4;
            const x1 = 24 + Math.cos(a) * 12, y1 = 24 + Math.sin(a) * 12;
            const x2 = 24 + Math.cos(a) * 21, y2 = 24 + Math.sin(a) * 21;
            const px = Math.cos(a + Math.PI / 2) * 2.6, py = Math.sin(a + Math.PI / 2) * 2.6;
            g.fillTriangle(x1 + px, y1 + py, x1 - px, y1 - py, x2, y2);
        }
        g.generateTexture('up-splash', 48, 48);
        g.destroy();

        // up-fever: flame (outer teardrop + inner cutout feel via notch)
        g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillPoints([
            { x: 24, y: 2 }, { x: 34, y: 14 }, { x: 40, y: 26 }, { x: 38, y: 36 },
            { x: 30, y: 44 }, { x: 18, y: 44 }, { x: 10, y: 36 }, { x: 8, y: 26 },
            { x: 14, y: 16 }, { x: 18, y: 22 }, { x: 22, y: 12 }
        ], true);
        g.generateTexture('up-fever', 48, 48);
        g.destroy();

        // up-gold: coin stack
        g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillEllipse(24, 36, 34, 14);
        g.fillEllipse(24, 28, 34, 14);
        g.fillEllipse(24, 20, 34, 14);
        g.lineStyle(3, 0x000000, 0.25);
        g.strokeEllipse(24, 28, 34, 14);
        g.strokeEllipse(24, 36, 34, 14);
        g.generateTexture('up-gold', 48, 48);
        g.destroy();

        // confetti-tex
        g = this.add.graphics();
        g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 10, 16);
        g.generateTexture('confetti-tex', 10, 16);
        g.destroy();

        // ring-tex: expanding shockwave ring (tinted at use)
        g = this.add.graphics();
        g.lineStyle(6, 0xffffff, 1);
        g.strokeCircle(32, 32, 27);
        g.lineStyle(2, 0xffffff, 0.5);
        g.strokeCircle(32, 32, 22);
        g.generateTexture('ring-tex', 64, 64);
        g.destroy();

        // egg-tex: gacha egg with spots
        g = this.add.graphics();
        g.fillStyle(0xfff7e0, 1);
        g.fillEllipse(40, 54, 72, 92);
        g.lineStyle(5, 0x221a38, 1);
        g.strokeEllipse(40, 54, 72, 92);
        g.fillStyle(0xffd54a, 1); g.fillCircle(30, 38, 7);
        g.fillStyle(0x7fd2ff, 1); g.fillCircle(52, 62, 6);
        g.fillStyle(0xff9ad5, 1); g.fillCircle(34, 76, 5);
        g.generateTexture('egg-tex', 80, 104);
        g.destroy();

        // gem-tex v2.1: brilliant-cut sapphire with crown facets + glints
        g = this.add.graphics();
        g.fillStyle(0x2a7fd0, 1);                                    // base body
        g.fillPoints([
            { x: 12, y: 10 }, { x: 36, y: 10 }, { x: 44, y: 20 },
            { x: 24, y: 44 }, { x: 4, y: 20 }
        ], true);
        g.fillStyle(0x5ab0f0, 1);                                    // crown table
        g.fillPoints([{ x: 16, y: 13 }, { x: 32, y: 13 }, { x: 36, y: 19 }, { x: 12, y: 19 }], true);
        g.fillStyle(0x8fd0ff, 1);                                    // left facet
        g.fillPoints([{ x: 12, y: 10 }, { x: 16, y: 13 }, { x: 12, y: 19 }, { x: 4, y: 20 }], true);
        g.fillStyle(0x1c5ea8, 1);                                    // right shade
        g.fillPoints([{ x: 36, y: 10 }, { x: 44, y: 20 }, { x: 36, y: 19 }, { x: 32, y: 13 }], true);
        g.fillStyle(0xbfe8ff, 1);                                    // pavilion shine
        g.fillPoints([{ x: 12, y: 19 }, { x: 24, y: 44 }, { x: 18, y: 20 }], true);
        g.lineStyle(3, 0x221a38, 1);
        g.strokePoints([
            { x: 12, y: 10 }, { x: 36, y: 10 }, { x: 44, y: 20 },
            { x: 24, y: 44 }, { x: 4, y: 20 }
        ], true, true);
        g.fillStyle(0xffffff, 0.95);                                 // star glint
        g.fillPoints([
            { x: 15, y: 6 }, { x: 16.5, y: 10 }, { x: 20, y: 11.5 }, { x: 16.5, y: 13 },
            { x: 15, y: 17 }, { x: 13.5, y: 13 }, { x: 10, y: 11.5 }, { x: 13.5, y: 10 }
        ], true);
        g.generateTexture('gem-tex', 48, 48);
        g.destroy();

        // bomb-tex: item drop - round bomb with a spark fuse
        g = this.add.graphics();
        g.fillStyle(0x2a2a34, 1); g.fillCircle(24, 28, 16);
        g.fillStyle(0x4a4a58, 1); g.fillCircle(19, 23, 6);
        g.lineStyle(4, 0x8a6a4e, 1);
        g.beginPath(); g.moveTo(28, 14); g.lineTo(34, 6); g.strokePath();
        g.fillStyle(0xffd54a, 1);
        g.fillPoints([
            { x: 36, y: 2 }, { x: 38, y: 5 }, { x: 41, y: 6 }, { x: 38, y: 8 },
            { x: 36, y: 11 }, { x: 34, y: 8 }, { x: 31, y: 6 }, { x: 34, y: 5 }
        ], true);
        g.generateTexture('bomb-tex', 48, 48);
        g.destroy();

        // heart-tex: nest heal drop
        g = this.add.graphics();
        g.fillStyle(0xff6b8a, 1);
        g.fillCircle(16, 18, 10); g.fillCircle(32, 18, 10);
        g.fillTriangle(7, 24, 41, 24, 24, 42);
        g.fillStyle(0xffffff, 0.5); g.fillEllipse(14, 14, 8, 5);
        g.generateTexture('heart-tex', 48, 48);
        g.destroy();

        // necklace-tex: pet accessory field drop
        g = this.add.graphics();
        g.lineStyle(4, 0xffffff, 1);
        g.beginPath(); g.arc(24, 18, 14, Math.PI * 0.15, Math.PI * 0.85, false); g.strokePath();
        g.fillStyle(0xffffff, 1);                                    // heart pendant
        g.fillCircle(20, 32, 5); g.fillCircle(28, 32, 5);
        g.fillTriangle(14.5, 34, 33.5, 34, 24, 44);
        g.generateTexture('necklace-tex', 48, 48);
        g.destroy();

        // decor-tex: field item drop icon - a small gift box with a bow
        // (the specific decor item itself is revealed via the toast/msg;
        // this generic icon just marks "a decor drop", like necklace-tex).
        g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillRoundedRect(8, 20, 32, 24, 4);
        g.fillRect(8, 16, 32, 8);
        g.fillRect(21, 16, 6, 28);
        g.fillStyle(0xffffff, 0.65);
        g.fillCircle(16, 12, 6); g.fillCircle(32, 12, 6);
        g.generateTexture('decor-tex', 48, 48);
        g.destroy();
    }
}

// Global scene-switch helper.
const SmooshGame = {
    _game: null,
    goto(sceneKey) {
        const sm = this._game.scene;
        sm.getScenes(true).forEach(s => sm.stop(s.scene.key));
        sm.start(sceneKey);
    }
};

window.addEventListener('load', () => {
    // v5.0 Task 2 review fix: Press Start 2P is a TRUE 1.0em/char monospace
    // font. If Phaser boots before the webfont finishes loading, EVERY Text
    // object bakes its FIRST render against the fallback ('monospace') at
    // whatever metrics that font happens to have - and Phaser never
    // re-measures/re-bakes existing Text objects when the real font swaps in
    // later, so cold boots would permanently mis-size text (including every
    // makeUiButton auto-shrink measurement in ui.js, which reads .width at
    // creation time). Gate the boot on the font being ready, but never hang
    // it past 3s (worst case: first frame renders in the fallback font,
    // exactly like before this fix, instead of the game never starting).
    function boot() {
        SmooshGame._game = new Phaser.Game({
            type: Phaser.AUTO,
            parent: 'game-container',
            width: CONFIG.WIDTH,
            height: CONFIG.HEIGHT,
            backgroundColor: CONFIG.COLORS.bg,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            // v5.0 RETRO ARCADE Task 2: pixelArt forces NEAREST-neighbor texture
            // filtering + rounds pixel positions (crisp blocky look, also keeps
            // the vendored pixel font's edges sharp instead of anti-aliased
            // mush). Phaser's pixelArt flag always wins over antialias, so
            // antialias is explicitly false here too rather than left stale.
            render: { pixelArt: true, antialias: false },
            scene: [BootScene, MenuScene, StageMapScene, DexScene, NestScene, GameScene, ShopScene, PvpScene, FriendsScene]
        });

        window.addEventListener('resize', () => {
            if (SmooshGame._game) SmooshGame._game.scale.refresh();
        });

        // Browser autoplay policy: audio starts on the first user gesture.
        document.addEventListener('pointerdown', () => {
            if (typeof Sfx !== 'undefined' && Sfx.unlockAudio) Sfx.unlockAudio();
        }, { passive: true });
    }

    if (document.fonts && document.fonts.load) {
        // v5 final-review fix: document.fonts.load() can REJECT (corrupt/
        // undecodable font file) instead of just being slow - a rejection
        // here used to propagate through the race and skip boot() entirely
        // (permanent black screen, no 3s-timeout fallback ever fires because
        // Promise.race already settled to the rejected branch). Two
        // independent guards: .catch(()=>{}) so a rejected font-load still
        // resolves the race, AND .then(boot, boot) so even if something else
        // makes the race itself reject, boot() still runs either way.
        Promise.race([
            document.fonts.load("16px 'Press Start 2P'").then(() => document.fonts.ready).catch(() => {}),
            new Promise(r => setTimeout(r, 3000))   // never hang boot > 3s
        ]).then(boot, boot);
    } else {
        boot();
    }
});
