# SMOOSH! v5.0 "RETRO ARCADE" — Design Spec (2026-07-04)

A whole-game re-skin from the v4.0 pastel look to an **80s arcade neon / CRT**
aesthetic, plus an all-English UI, a gacha economy change (legendary pets are
gem-only), and rarity-tiered card frames on the dex and gacha reveal.

User decisions (interview) are marked **[user]**.

## Design pillars
- **80s arcade neon / CRT** [user]: dark backdrop, neon accents (cyan / magenta /
  hot-pink / lime / amber), CRT scanlines + vignette + subtle flicker, chunky
  pixel font, glowing card frames.
- **Characters become pixel art** [user] — achieved by **low-res texture bake +
  nearest-neighbor upscaling** (NOT rewriting the 74 parametric painters): bake
  each character SVG small (≈32–40 px) and render with NEAREST filter +
  `image-rendering: pixelated`, so they read as authentic chunky pixel sprites
  while preserving the signature-part recipes, distinctness tests, and cuteness
  from v4.0. (Controller's tractable interpretation of "characters as pixel art";
  a full hand-pixeled redraw is explicitly out of scope for v5.0.)
- **English everywhere** [user]: force `I18n.locale = 'en'` always (arcade UIs are
  classically all-English); i18n infra kept, Korean rendering disabled. Uppercase
  arcade styling where it fits. (This overrides Phase A's "Korean on Korean
  devices" — the user's latest instruction wins.)

---

## R1. Retro neon palette (re-theme the tokens)
- Repoint every `CONFIG.PASTEL` token VALUE to a neon-CRT palette (keep the token
  KEYS + structure so all v4 scene sweeps auto-retheme — no re-sweep needed):
  - `bg` deep near-black indigo (~`0x0d0221`), `bgField`/`panel`/`panelLight`
    darker-to-mid violet/navy layers, `ink` bright near-white cyan-tint, `inkSoft`
    muted lavender, `accent` neon cyan, `gold` neon amber, `good` neon lime,
    `danger` neon red-pink, `fever`/`crit` hot magenta/yellow, `white` pure.
  - `elements[8]` ramps → neon hues (fire=hot-red, water=cyan, leaf=lime,
    wind=pale-teal, electric=yellow, ice=ice-blue, light=white-gold, dark=violet),
    each `{base, soft, deep}` still ordered by luminance.
- **Contrast tests flip direction** (dark theme): update `tests/pastel.test.js` —
  body text (`ink`) vs `bg` ≥ 4.5; on-panel text tokens re-derived for a DARK
  panel (the v4 `goldText`/`goodText`/`dangerText`/`gemText` dark variants become
  LIGHT-on-dark variants; recompute so each still clears ≥4.5 vs `panel`/
  `panelLight`). Element-base pairwise distinctness ≥48 kept.
- CRT-friendly: neon tokens are saturated + bright so glow reads on the dark bg.

## R2. Pixel font + CRT overlay
- **Pixel font**: vendor an OFL pixel typeface (e.g. *Press Start 2P*,
  SIL Open Font License — bundle the TTF/woff2 locally under `www/fonts/`, load
  via `@font-face` in `style.css`; NO external CDN). Add `CONFIG.FONT =
  "'Press Start 2P', monospace"` and route Phaser text styles through it (a
  `fontFamily` sweep of the text-creation sites + helpers). Pixel fonts are wide —
  audit for overflow, shrink font sizes where labels clip (retro UIs use short
  ALL-CAPS words; abbreviate long labels).
- **CRT overlay**: a full-screen CSS overlay (`#crt` div in index.html + style.css)
  = repeating scanline gradient + radial vignette + very subtle flicker animation,
  `pointer-events:none`, above the canvas. Tunable/removable via one class.
- **All text English**: `I18n.detect()` → force `'en'`; keep the table.

## R3. Pixelate character sprites
- Global switch in `BootScene`: bake character textures at a small base size
  (add `CONFIG.PIXEL = { bake: 40, filter: 'NEAREST' }`), set the Phaser texture
  filter mode to `NEAREST` for all `sp-*`, `pet-*`, `decor-*` textures so upscaling
  is blocky, and add `image-rendering: pixelated` to the canvas/container CSS.
- Verify legibility: at the bake size the signature parts (ears/horns/props) must
  still be distinguishable — if 40 px loses them, bump to 48; a structural test
  asserts the bake size ≥ a floor and that NEAREST is applied.
- Decor + nest + dex + gacha renders all inherit the pixel look automatically
  (same textures).

## R4. Gacha — legendary is gem-only [user]
- `CONFIG.GACHA.rates` (gold egg): set `legendary: 0`, redistribute its 0.03 mass
  into common/rare/epic (keep sum = 1). `CONFIG.GACHA.gemRates` (gem egg): keep
  `legendary` (raise slightly if desired, still summing to 1).
- Pity: gold-egg pity guarantees **epic** (not legendary) since legendary can't
  drop from gold; gem-egg pity unchanged (epic+ which includes legendary).
- UI: egg-buy panels label the gem egg "★ LEGENDARY CHANCE" and the gold egg
  "UP TO EPIC"; dex/gacha copy in English.
- Tests: gold rates sum to 1 with `legendary === 0`; gem rates sum to 1 with
  `legendary > 0`; a legendary can never be produced by a gold-egg roll (seeded
  roll test over the gold table).

## R5. Rarity card frames (dex + gacha)
- A shared `Frames` helper (new `www/js/frames.js`, pure geometry + a Phaser
  draw fn) producing a card frame per rarity:
  - `common` — thin flat neon-gray border.
  - `rare` — double neon-cyan border.
  - `epic` — ornate neon-magenta border + corner pips.
  - `legendary` — animated glowing neon-gold frame (pulsing stroke + sparkle
    corners + subtle rotation shimmer).
- Applied in: **Dex** pet/monster cards + detail view (frame by the entry's
  rarity — monsters use an elem-derived tier or a flat frame; pets use pet
  rarity), and **gacha reveal** (the pulled pet flips up inside its rarity frame,
  legendary gets an extra flourish + screen flash).
- Pure part tested (frame recipe per rarity exists, distinct per tier); the Phaser
  draw is Phaser-guarded.

## R6. Ship v5.0.0
- versionCode +1, versionName "5.0.0"; `npx cap sync`; AAB build + manifest verify;
  RELEASE_STATUS.md v5.0 row; merge to main; refresh web demo.

## Testing
- Keep the 170-test suite green; migrate the Phase C contrast tests to the dark
  theme (intent-preserving); add: gacha gold-no-legendary, gem-has-legendary,
  frame-recipe-per-rarity, pixel-bake floor + NEAREST applied, i18n forced-en.
- No gameplay/balance logic changes (R1-R5 are skin + gacha-rate + one font/filter
  switch); the 200-stage balance sim stays untouched and green.

## Out of scope
- Hand-drawn per-sprite pixel redraws (using low-res bake instead).
- Chiptune audio rework (sfx.js synth stays; could be a v5.1).
- Dropping Korean strings from the table (just force en at runtime).
