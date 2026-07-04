# SMOOSH! v5.0 "RETRO ARCADE" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Re-skin SMOOSH! to an 80s arcade neon/CRT look (neon palette, pixel font, CRT overlay, pixel-art sprites via low-res bake), force all-English UI, make legendary pets gem-only, and add rarity-tiered card frames to the dex + gacha.

**Architecture:** Leverage the v4 CONFIG.PASTEL token system — re-theming = changing token VALUES, so every already-swept scene auto-retheme with no re-sweep. Pixel look = neon token values + a vendored pixel font (fontFamily sweep) + a CSS CRT overlay + NEAREST texture filter with a small bake size. Gacha + frames are localized changes. Structural facts verified by tests; the arcade aesthetic gates through code review + the user's demo smoke.

**Tech Stack:** unchanged (Phaser 3.60, Capacitor 6, node --test) + one vendored OFL pixel font.

## Global Constraints
- Repo `D:\source\ai-game-studio\games-for-release\smoosh-mobile\`, branch `v5-retro` off main; commit there.
- NO gameplay/balance logic changes except the gacha RATE change (R4). The 200-stage balance sim test stays untouched + green.
- Suite green at every commit (baseline 170); `node --check` every touched JS file.
- Token KEYS unchanged (only values re-themed) so v4 sweeps keep working.
- All user-visible strings via I18n.t; runtime locale forced to 'en'. English code/comments.
- No external CDN/network at runtime — font vendored locally (build-time fetch OK).
- Phaser-guard scoping pattern for any new scene-side class (`let X;` + expression).

## File Structure
- Modify: `www/js/config.js` (token values + CONFIG.FONT + CONFIG.PIXEL + GACHA rates), `www/js/i18n.js` (force en + copy), `www/js/main.js` (BootScene NEAREST filter + bake size), `www/css/style.css` (@font-face, CRT overlay, pixelated rendering), `www/index.html` (#crt div + font preload), `www/js/gacha.js` + `www/js/shop.js` (legendary gem-only + labels), `www/js/dex.js` + `www/js/gacha.js`/reveal (frames), text-style `fontFamily` sweep across scene files.
- Create: `www/fonts/` (vendored TTF/woff2), `www/js/frames.js`, `tests/frames.test.js`; extend `tests/pastel.test.js`, `tests/gacha.test.js`, `tests/catalog.test.js`.

---

### Task 1: Retro neon palette + forced-English + dark-theme contrast tests
**Files:** Modify `config.js` (CONFIG.PASTEL values), `i18n.js` (force en), `www/css/style.css` (body bg); extend `tests/pastel.test.js`.

- Repoint all CONFIG.PASTEL token values to the neon-CRT palette per spec R1 (dark bg, neon accents, 8 element neon ramps {base,soft,deep} luminance-ordered). Keep every KEY (incl. goldText/goodText/dangerText/gemText — now light-on-dark variants). CONFIG.COLORS re-pointed to match.
- `i18n.js`: `detect()` unconditionally sets `locale='en'` (leave `_localeFrom` for tests); keep STRINGS.
- style.css body/bg → dark neon bg hex.
- Update `tests/pastel.test.js` for the DARK theme: `ink` vs `bg` ≥4.5 (now light-on-dark); the 4 *Text tokens vs `panel`/`panelLight` ≥4.5 (recompute for dark panels); element-base pairwise ≥48; ramp ordering soft>base>deep by luminance. Tune neon hues until green.
- [ ] TDD the contrast expectations → repoint values → green; `node --check`; commit `feat(v5): retro neon palette + forced-English + dark-theme contrast tests`.

### Task 2: Pixel font + CRT overlay
**Files:** vendor font into `www/fonts/`; Modify `style.css` (@font-face + CRT + pixelated), `index.html` (#crt div), `config.js` (CONFIG.FONT), text-style sweep across `ui.js, game.js, shop.js, stagemap.js, dex.js, nestscene.js, friends.js, pvp.js, effects.js` (+ any `fontFamily`/default font in main.js Phaser config).

- Vendor an OFL pixel font (Press Start 2P or similar) — build-time: `npm i @fontsource/press-start-2p` then copy its ttf/woff2 to `www/fonts/`, OR curl the OFL file; include the OFL license text in `www/fonts/`. `@font-face` in style.css.
- `CONFIG.FONT = "'Press Start 2P', monospace"`; sweep every Phaser text `fontFamily` (and any Text default) to `CONFIG.FONT`. Pixel fonts render wide → drop font sizes ~15-25% and shorten/uppercase clipping labels (arcade style). Grep for remaining hardcoded font families; justify any left.
- CRT overlay: `#crt` div (index.html, after game container) + style.css (scanline `repeating-linear-gradient`, radial vignette, subtle flicker `@keyframes`, `pointer-events:none`, high z-index); `image-rendering: pixelated` on canvas + container.
- [ ] Suite green; `node --check`; visual note in report; commit `feat(v5): pixel font + CRT scanline overlay + pixelated rendering`.

### Task 3: Pixelate character sprites (low-res bake + NEAREST)
**Files:** Modify `config.js` (CONFIG.PIXEL {bake, filter}), `main.js` (BootScene texture registration: bake size + `texture.setFilter(Phaser.Textures.FilterMode.NEAREST)` for sp-*/pet-*/decor-*), extend `tests/catalog.test.js` (bake-floor + a config assertion).

- BootScene: when registering character/decor textures, bake at `CONFIG.PIXEL.bake` (≈40) and set NEAREST filter so upscale is blocky. Ensure dex (150px display), nest, gacha reveal all inherit (same texture keys). Confirm signature parts survive at the bake size — bump to 48 if a structural check shows parts collapsing.
- Test: `CONFIG.PIXEL.bake >= 32`, filter === 'NEAREST'; (pure config + a note that visual survives — the r=90 painter path is unaffected, this is a raster/display concern).
- [ ] Suite green; `node --check`; sample-render note; commit `feat(v5): pixel-art sprites via low-res bake + nearest-neighbor`.

### Task 4: Gacha — legendary gem-only
**Files:** Modify `config.js` (GACHA.rates/gemRates), `gacha.js` (pity: gold→epic guarantee), `shop.js` (egg labels), `i18n.js` (labels); extend `tests/gacha.test.js`.

- `CONFIG.GACHA.rates` gold: `legendary: 0`, redistribute 0.03 → common/rare/epic (sum 1). `gemRates` keep legendary (sum 1). Gold-egg pity guarantees epic; gem-egg pity unchanged.
- shop.js egg panels: gem egg "★ LEGENDARY CHANCE", gold egg "UP TO EPIC" (i18n keys en+ko).
- Tests: gold rates sum 1 && legendary===0; gem rates sum 1 && legendary>0; seeded roll over gold table never yields legendary (many samples); pity path on gold yields ≤epic.
- [ ] TDD → implement → green; `node --check`; commit `feat(v5): legendary pets are gem-egg only (gold caps at epic)`.

### Task 5: Rarity card frames (dex + gacha)
**Files:** Create `www/js/frames.js` + `tests/frames.test.js`; Modify `dex.js` (cards + detail), `gacha.js`/reveal render + `shop.js` (gacha result), `main.js` (register frames.js script before ui.js in index.html), `i18n.js` if copy.

- `Frames`: `Frames.RECIPES = { common, rare, epic, legendary }` (pure descriptors — border style/color-token/ornament flags, distinct per tier, tested); `Frames.draw(scene, x, y, w, h, rarity)` Phaser-guarded (returns a container; legendary adds pulsing stroke tween + sparkle corners). Colors from CONFIG.PASTEL neon tokens (rare=accent/cyan, epic=fever/magenta, legendary=gold, common=inkSoft).
- Dex: wrap each pet card + the detail render in `Frames.draw(...rarity)`; monsters use a flat/elem frame (they have no rarity — use a neutral tier or elem-tinted common frame).
- Gacha reveal: the pulled pet appears inside its rarity frame; legendary → extra flash + sparkle (reuse Effects).
- Tests: 4 recipes exist, pairwise distinct; legendary flagged animated; draw is Phaser-guarded (pure part loads in Node).
- [ ] TDD pure part → implement → green; `node --check`; script order (frames.js before ui.js); commit `feat(v5): rarity-tiered card frames on dex + gacha reveal`.

### Task 6: Ship v5.0.0
- Full suite; `node --check` all; i18n check (forced en); versionCode +1 / versionName "5.0.0"; footer literals; `npx cap sync android`; AAB build + manifest verify (5.0.0 present / 4.0.0 absent; fonts + frames.js in synced assets; CONFIG neon values present); RELEASE_STATUS.md v5.0 row + §1/§2; commit `release: v5.0.0 - Phase RETRO (neon/CRT, pixel sprites, gem-only legendary, rarity frames)`; merge to main (controller); refresh web demo (controller).

## Self-Review Notes
- Spec coverage: R1→T1, R2→T2, R3→T3, R4→T4, R5→T5, ship→T6.
- Token re-theme is the big leverage — T1 re-themes all v4-swept scenes for free; the only sweep in v5 is the fontFamily sweep (T2).
- Biggest risks: (a) contrast tests must FLIP to dark-theme correctly (T1) or text goes unreadable; (b) pixel font overflow (T2 audit); (c) pixel bake losing signature-part legibility (T3 floor). All have test/audit gates.
- Font licensing: OFL font, bundle the license file. No runtime network.
