# SMOOSH! v4.0 Phase C (Whole-Game Pastel Art Overhaul) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship SMOOSH! v4.0.0 — one consistent pastel identity across every screen, plus a parametric-painter overhaul that makes all 24 monsters (+ boss variants) and 50 pets cuter AND visually distinct (signature parts, element-tinted pastel ramps, consistent outline/shading), holding up at dex/nest close-up sizes.

**Architecture:** A single `CONFIG.PASTEL` token set (config.js) becomes the only source of UI color; scenes/helpers swap hex literals for tokens in two sweeps. The painters (`paintJelly`, `paintAnimal` in catalog.js) gain a signature-part parameter system; species art defs are re-authored against it. Structural integrity is unit-tested (token completeness, contrast floors, part coverage, silhouette-recipe uniqueness); aesthetic quality gates through code review reading the actual SVG recipes + the user's demo smoke.

**Tech Stack:** unchanged (Phaser 3.60 vendored, Capacitor 6, node --test).

## Global Constraints

- Repo: `D:\source\ai-game-studio\games-for-release\smoosh-mobile\`, branch `v4-phase-c` off main; commit there.
- NO gameplay/balance/logic changes — Phase C touches colors, SVG painters, and style only. The 142-test suite must stay green untouched except tests ADDED by this plan (and color-literal expectations if any test pins one — migrate intent-preserving).
- All new code/comments English; any new user-visible string via I18n (there should be none).
- Painters stay parametric (no hand-drawn asset files); textures still registered ONCE in BootScene; texture keys unchanged (`sp-{id}-idle/squash`, `pet-{id}`, `decor-{id}`).
- Do not touch `www/lib/`, fb.js/firebase, android/ (except the final version bump).
- `node --check` every touched file; suite green at every commit.

## File Structure

- Modify: `www/js/config.js` (PASTEL tokens + COLORS re-pointed), `www/js/catalog.js` (painters + all art defs), `www/js/decor.js` (paintDecor palette alignment), `www/css/style.css` (page bg), and hex-literal sweeps in `ui.js, game.js, shop.js, stagemap.js, dex.js, nestscene.js, friends.js, effects.js, monsters.js, pets.js, pvp.js, battle.js, main.js` (only color values — no logic).
- Create: `tests/pastel.test.js`, extend `tests/catalog.test.js`.

---

### Task 1: Pastel token system + contrast tests

**Files:** Modify `www/js/config.js`, `www/css/style.css`; Create `tests/pastel.test.js`.

**Interfaces:**
- `CONFIG.PASTEL = { bg, bgField, panel, panelLight, ink, inkSoft, accent, gold, danger, good, fever, crit, white, elements: { fire, water, leaf, wind, electric, ice, light, dark } }` — every value a 0xRRGGBB int; `elements[e] = { base, soft, deep }` 3-step pastel ramp per element (8×3).
- `CONFIG.COLORS.*` keys KEPT (existing consumers) but re-pointed to pastel values (bg → soft cream/lavender ~0xf3eef8-family, panel → soft, ink → readable deep plum ~0x4a4258 instead of near-black).
- Pure luminance helper for tests: `Balance.relLuminance(hex)` (WCAG formula) — tests enforce: ink vs bg contrast ratio ≥ 4.5; inkSoft vs panel ≥ 3.0; every element `base` distinct (pairwise ΔRGB ≥ 48 manhattan); ramps ordered (soft lighter than base, deep darker than base by luminance).

- [ ] Step 1: failing tests (token completeness incl. 8×3 ramps as ints; contrast floors via relLuminance; ramp ordering; element distinctness). Step 2: RED. Step 3: implement tokens (author the actual palette — soft cream base, pastel per-element hues: fire=coral, water=babyblue, leaf=mint, wind=pale sage-sky, electric=butter yellow, ice=powder cyan, light=vanilla, dark=dusty lilac), relLuminance in balance.js, re-point CONFIG.COLORS, style.css body/bg update. Step 4: green (fix any test pinning old colors — check tests grep 0x141020 etc.). Step 5: commit `feat(v4): pastel token system with contrast-tested palette`.

---

### Task 2: UI sweep A — core game surfaces

**Files:** `www/js/ui.js` (MenuScene, HUD, settlement, makeUiButton/makeChip/toast helpers), `www/js/game.js` (field bg, upgrade bar, fever bar, ult button, damage-text palette), `www/js/effects.js` (ring/burst/confetti default tints), `www/js/main.js` (Phaser backgroundColor).

Replace every hex color literal with the matching `CONFIG.PASTEL`/`CONFIG.COLORS` token (map by role, not by nearest hue — e.g. all panel fills → panel, all body text → ink). Damage-text conventions keep semantic colors but pastel-tuned: crit `PASTEL.crit`, Super! `PASTEL.gold`, Resisted `PASTEL.inkSoft`, KO `PASTEL.danger`. NO layout/logic edits. Grep-verify zero remaining `0x`-hex literals in the touched files EXCEPT inside catalog/decor painters and any legally-semantic constant you document in the report. Suite green; commit `feat(v4): pastel sweep - menu/HUD/battle/settlement/effects`.

### Task 3: UI sweep B — feature scenes

**Files:** `www/js/shop.js, stagemap.js, dex.js, nestscene.js, friends.js, pvp.js, battle.js` — same token-mapping rules as Task 2 (stage-map path/nodes, dex cards/silhouette tint (keep 0x221a38? NO → `PASTEL.ink` deep variant), nest field, friends rows/modal, pvp arena). Same grep-verification. Commit `feat(v4): pastel sweep - shop/map/dex/nest/friends/pvp`.

---

### Task 4: Monster painter surgery (24 + bosses)

**Files:** `www/js/catalog.js` (paintJelly + SPECIES art defs); extend `tests/catalog.test.js`.

**Interfaces:**
- `paintJelly(r, state, opts)` gains signature-part params (all optional, default 'none'): `ears: none|round|pointy|long|stub`, `horns: none|nub|curved|spike`, `tail: none|nub|curly|spike`, `pattern: none|spots|stripes|belly-star|freckles`, `hat: none|crown|leaf|bow|helmet|halo`, `aura: none|frost|spark|shadow|gleam` — each rendered as an SVG fragment scaled by r, stroke-consistent (same stroke color/width rules as body).
- Every monster def's art gains `elem`-derived pastel ramp usage: body = `PASTEL.elements[elem].base`-family hex (painters can't read CONFIG at paint time if catalog loads before config? IT LOADS AFTER config in index.html — verified order config→…→catalog — so painters MAY read CONFIG.PASTEL; do it).
- **Distinctness contract (tested):** each of the 24 species has a UNIQUE recipe tuple (ears,horns,tail,pattern,hat,aura,face) — pairwise distinct in ≥2 fields; every species uses ≥2 non-none signature parts; king keeps crown; bosses get `paintJelly` boss variant flag (bigger crown/aura + deeper ramp).

- [ ] Step 1: failing tests — recipe uniqueness (≥2-field pairwise difference), ≥2 non-none parts each, svg output contains part markers (`data-part="ears-pointy"` attributes emitted by each fragment — cheap structural hook), all 24 still produce valid `<svg` strings for idle+squash. Step 2: RED. Step 3: rewrite painter + re-author all 24 art defs (personality-true: tank=helmet+stub tail, freezy=frost aura+long ears, ghosty=shadow aura+none ears, goldie=halo+gleam...). Step 4: green + `node --check`. Step 5: commit `feat(v4): monster painter surgery - signature parts, pastel element ramps`.

### Task 5: Pet painter surgery (50)

**Files:** `www/js/catalog.js` (paintAnimal + PET_SPECIES art defs); extend `tests/catalog.test.js`. Same pattern: paintAnimal gains `pattern: none|spots|stripes|patch|mask|star`, `prop: none|bow|scarf|flower|leaf|goggles|bell`, `tailStyle: none|puff|curly|long|fin|feather`; recipe-uniqueness test across 50 (≥2-field pairwise difference vs same-element peers, ≥1 non-none prop or pattern each); keep v2.5 big sparkly eyes; element-ramp bodies where thematic (natural fur colors allowed — test only enforces recipe distinctness, not color). Data-part markers + valid svg tests. Commit `feat(v4): pet painter surgery - props, patterns, distinct silhouettes`.

### Task 6: Close-up quality + decor palette alignment

**Files:** `www/js/catalog.js` (stroke/detail scaling), `www/js/decor.js` (paintDecor → PASTEL tokens), `www/js/dex.js`/`nestscene.js` (render sizes only if needed).
- Painters: stroke width and eye/detail radii already scale with r — verify at r=90 (dex detail) via a structural test that generated svg at r=90 keeps stroke ≥3 and ≤ r*0.12; decor painter swaps its hardcoded pastels for PASTEL tokens.
- Commit `feat(v4): close-up scaling + decor palette alignment`.

### Task 7: Ship v4.0.0

- Full suite; `node --check` all www/js; versionCode 3→4, versionName "4.0.0"; `npx cap sync android`; AAB build + manifest verify (4.0.0 present, 3.5.0 absent); RELEASE_STATUS.md v4.0 row + §1/§2 update; commit `release: v4.0.0 - Phase C (whole-game pastel art overhaul)`; merge to main; refresh web demo (controller).

## Self-Review Notes
- Spec C coverage: pastel tokens+all surfaces → T1-T3; painter surgery+distinctness → T4-T5; close-up quality → T6. Aesthetics beyond structure gate through reviews reading SVG recipes + the user's demo smoke after T7.
- Biggest risk: color-literal sweeps regressing readability — mitigated by contrast-floor tests (T1) and role-based (not hue-based) mapping rules (T2/T3).
