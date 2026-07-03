# SMOOSH! v3 Phase A (v3.0.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship SMOOSH! v3.0.0 — click-collect drops, starter pet, ever-growing waves, 8-element type chart, 22-archetype skill system with a manual ultimate, stage map with replay, monster/pet dex with bilingual lore, USD gem prices, $0.99 remove-ads, ko/en i18n.

**Architecture:** All-new logic lands in four new pure modules (`i18n.js`, `skills.js`, `stagemap.js`, `dex.js`) + surgical edits to `balance.js`, `catalog.js`, `spawner.js` consumers, `game.js`, `monsters.js`, `pets.js`, `iap.js`, `ads.js`, `shop.js`, `ui.js`, `main.js`. Pure logic is unit-tested with `node --test`; Phaser scenes are verified via `npm run serve` + the existing suite stays green.

**Tech Stack:** Phaser 3.60 (vendored), Capacitor 6, vanilla JS modules with the `if (typeof module !== 'undefined') module.exports` dual-mode pattern, `node --test` for tests.

## Global Constraints

- Project root: `D:\source\ai-game-studio\games-for-release\smoosh-mobile\` (own local git repo — commit THERE, not the parent repo).
- All code/comments/docs in English. All user-visible strings go through `I18n.t(key)` (en + ko).
- Script load order in `www/index.html`: new files load AFTER `config.js`/`balance.js`/`catalog.js` and BEFORE `game.js`; `main.js` stays LAST.
- Every JS module ends with the dual-mode export guard exactly like `balance.js:188-195` (inject missing globals via `globalThis.X = require(...)`).
- Tests: `npm test` (= `node --test "tests/*.test.js"`). Existing 62 tests MUST stay green; sim invariant in `tests/balance.test.js` owns the economy truth.
- Never remove Matter/Phaser bodies inside collision callbacks; never `addBase64` outside BootScene (existing project rules).
- After any `www/` change that ships: `node --check` each edited file.
- Versioning at the end of the phase only: `versionName 3.0.0`, `versionCode +1` in `android/app/build.gradle`.

---

### Task 1: i18n module

**Files:**
- Create: `www/js/i18n.js`
- Create: `tests/i18n.test.js`
- Modify: `www/index.html` (add `<script src="js/i18n.js"></script>` right after `config.js`)

**Interfaces:**
- Produces: global `I18n` with `I18n.locale` (`'en'|'ko'`), `I18n.detect()`, `I18n.t(key, vars?)` returning the string for the active locale with `{name}`-style interpolation, and `I18n.STRINGS` table `{ key: { en, ko } }`. Later tasks add keys to `I18n.STRINGS` and MUST add both languages (test enforces).

- [ ] **Step 1: Write the failing test**

```js
// tests/i18n.test.js
const test = require('node:test');
const assert = require('node:assert');
const { I18n } = require('../www/js/i18n.js');

test('every string key has non-empty en and ko', () => {
    for (const [key, v] of Object.entries(I18n.STRINGS)) {
        assert.ok(v.en && v.en.trim().length > 0, key + ' missing en');
        assert.ok(v.ko && v.ko.trim().length > 0, key + ' missing ko');
    }
});

test('t() returns locale string and falls back to en', () => {
    I18n.locale = 'ko';
    assert.strictEqual(I18n.t('map.title'), I18n.STRINGS['map.title'].ko);
    I18n.locale = 'en';
    assert.strictEqual(I18n.t('map.title'), I18n.STRINGS['map.title'].en);
    assert.strictEqual(I18n.t('__nope__'), '__nope__'); // unknown key echoes
});

test('t() interpolates vars', () => {
    I18n.STRINGS['__test.hi'] = { en: 'Hi {name}!', ko: '안녕 {name}!' };
    I18n.locale = 'en';
    assert.strictEqual(I18n.t('__test.hi', { name: 'Mochi' }), 'Hi Mochi!');
    delete I18n.STRINGS['__test.hi'];
});

test('detect() picks ko only for Korean locales', () => {
    assert.strictEqual(I18n._localeFrom('ko-KR'), 'ko');
    assert.strictEqual(I18n._localeFrom('ko'), 'ko');
    assert.strictEqual(I18n._localeFrom('en-US'), 'en');
    assert.strictEqual(I18n._localeFrom('ja-JP'), 'en');
    assert.strictEqual(I18n._localeFrom(undefined), 'en');
});
```

- [ ] **Step 2: Run test to verify it fails** — `npm test` → FAIL (`Cannot find module '../www/js/i18n.js'`).

- [ ] **Step 3: Write minimal implementation**

```js
// =============================================================================
// SMOOSH! - i18n.js
// Two-locale string table (en/ko). Locale follows the DEVICE language:
// Korean devices get Korean, everyone else gets English (spec §A9).
// =============================================================================

const I18n = {
    locale: 'en',

    _localeFrom(tag) {
        return (typeof tag === 'string' && tag.toLowerCase().startsWith('ko'))
            ? 'ko' : 'en';
    },

    detect() {
        const tag = (typeof navigator !== 'undefined' && navigator.language) || 'en';
        this.locale = this._localeFrom(tag);
        return this.locale;
    },

    t(key, vars) {
        const entry = this.STRINGS[key];
        let s = entry ? (entry[this.locale] || entry.en) : key;
        if (vars) for (const k of Object.keys(vars)) {
            s = s.split('{' + k + '}').join(String(vars[k]));
        }
        return s;
    },

    // Every entry MUST have both en and ko (tests/i18n.test.js enforces).
    STRINGS: {
        'map.title':        { en: 'STAGE MAP',        ko: '스테이지 맵' },
        'map.replay':       { en: 'REPLAY',            ko: '재도전' },
        'map.replayReward': { en: 'Replay: 30% gold, full drops', ko: '재도전: 골드 30%, 드롭 100%' },
        'dex.title':        { en: 'DEX',               ko: '도감' },
        'dex.monsters':     { en: 'MONSTERS',          ko: '몬스터' },
        'dex.pets':         { en: 'PETS',              ko: '펫' },
        'dex.locked':       { en: '???',               ko: '???' },
        'dex.kills':        { en: 'Kills: {n}',        ko: '처치: {n}' },
        'dex.skill':        { en: 'Skill',             ko: '스킬' },
        'shop.removeAds':   { en: 'Remove Ads',        ko: '광고 제거' },
        'shop.adsRemoved':  { en: 'Ads removed ✓',     ko: '광고 제거됨 ✓' },
        'ult.ready':        { en: 'ULT READY!',        ko: '궁극기 준비!' },
        'drop.despawned':   { en: 'Lost...',           ko: '놓쳤다...' }
    }
};

if (typeof module !== 'undefined') module.exports = { I18n };
```

- [ ] **Step 4: Run tests** — `npm test` → all PASS. `node --check www/js/i18n.js`.

- [ ] **Step 5: Add to index.html** — insert `<script src="js/i18n.js"></script>` on its own line directly after the `config.js` script tag. In `main.js`, inside the game boot (before scene start), call `I18n.detect()`.

- [ ] **Step 6: Commit** — `git add www/js/i18n.js tests/i18n.test.js www/index.html www/js/main.js && git commit -m "feat(v3): i18n module (en/ko, device-locale)"`

---

### Task 2: 8-element type chart

**Files:**
- Modify: `www/js/balance.js` (replace `elementMult` at lines 67-75)
- Modify: `www/js/catalog.js` (add `elem` to every monster `species({...})` def; remap pet elements to 8)
- Create: `tests/elements.test.js`

**Interfaces:**
- Consumes: `SPECIES` (monsters, field `kind: 'mob'|...'`), `PET_SPECIES` (field `element`).
- Produces: `Balance.ELEMENTS = ['fire','water','leaf','wind','electric','ice','light','dark']`; `Balance.elementMult(attackerElem, defenderElem)` → `1.5 | 1.0 | 0.7` (KEEP the existing function name — `pets.js` already calls it); every monster species gains `elem`, every pet keeps `element`, both drawn from `Balance.ELEMENTS`.

- [ ] **Step 1: Write the failing test**

```js
// tests/elements.test.js
const test = require('node:test');
const assert = require('node:assert');
globalThis.CONFIG = require('../www/js/config.js').CONFIG;
const { Balance } = require('../www/js/balance.js');
const { SPECIES, PET_SPECIES } = require('../www/js/catalog.js');

const E = Balance.ELEMENTS;

test('8 elements exist', () => {
    assert.deepStrictEqual(E, ['fire','water','leaf','wind','electric','ice','light','dark']);
});

test('exact strong pairs (1.5) and their 0.7 inverses', () => {
    const strong = [
        ['fire','ice'], ['ice','wind'], ['wind','leaf'], ['leaf','water'],
        ['water','fire'], ['electric','water'], ['electric','wind'],
        ['leaf','electric'], ['light','dark'], ['dark','light']
    ];
    for (const [a, d] of strong) {
        assert.strictEqual(Balance.elementMult(a, d), 1.5, a + '>' + d);
        if (!(a === 'light' || a === 'dark')) {
            assert.strictEqual(Balance.elementMult(d, a), 0.7, d + '<' + a);
        }
    }
    // old v2.1 pair fire>leaf is NEUTRAL in the new chart (wind>leaf covers leaf)
    assert.strictEqual(Balance.elementMult('fire', 'leaf'), 1.0);
    assert.strictEqual(Balance.elementMult('light', 'fire'), 1.0);
});

test('every element has >=1 strength and >=1 weakness', () => {
    for (const x of E) {
        assert.ok(E.some(d => Balance.elementMult(x, d) === 1.5), x + ' has no strength');
        assert.ok(E.some(a => Balance.elementMult(a, x) === 1.5), x + ' has no weakness');
    }
});

test('chart mean ~= 1.0 (zero-sum-ish)', () => {
    let sum = 0, n = 0;
    for (const a of E) for (const d of E) { sum += Balance.elementMult(a, d); n++; }
    assert.ok(Math.abs(sum / n - 1) <= 0.05, 'mean=' + (sum / n));
});

test('every monster has a valid elem, every pet a valid element', () => {
    for (const s of SPECIES) assert.ok(E.includes(s.elem), 'monster ' + s.id);
    for (const p of PET_SPECIES) assert.ok(E.includes(p.element), 'pet ' + p.id);
});

test('each element has >=4 pets (gacha variety)', () => {
    for (const x of E) {
        const c = PET_SPECIES.filter(p => p.element === x).length;
        assert.ok(c >= 4, x + ' has only ' + c + ' pets');
    }
});
```

- [ ] **Step 2: Run to verify it fails** — `npm test` → FAIL (no `Balance.ELEMENTS`).

- [ ] **Step 3: Implement the chart in balance.js** (replace lines 67-75):

```js
    // v3.0 - 8-element chart. 1.5 strong / 0.7 weak / 1.0 neutral, applied on
    // EVERY hit in both directions (pets->monsters AND monster attacks->pets).
    // 5-cycle fire>ice>wind>leaf>water>fire; electric>water+wind, leaf>electric;
    // light<->dark mutual 1.5 (no 0.7 between them). Everything else 1.0.
    ELEMENTS: ['fire','water','leaf','wind','electric','ice','light','dark'],
    _STRONG: {
        fire: ['ice'], ice: ['wind'], wind: ['leaf'], leaf: ['water','electric'],
        water: ['fire'], electric: ['water','wind'], light: ['dark'], dark: ['light']
    },
    elementMult(attacker, defender) {
        const mutual = (attacker === 'light' && defender === 'dark') ||
                       (attacker === 'dark' && defender === 'light');
        if (mutual) return 1.5;
        if ((this._STRONG[attacker] || []).includes(defender)) return 1.5;
        if ((this._STRONG[defender] || []).includes(attacker)) return 0.7;
        return 1;
    },
```

- [ ] **Step 4: Assign monster elems in catalog.js.** Add `elem` to each monster `species({...})` def object (exact table — all 24):
  blob=leaf, mini=wind, tank=water, zippy=electric, grumpy=fire, rocky=leaf, orbity=light, bubbly=water, freezy=ice, drop=water, blinky=electric, ghosty=dark, cloney=dark, scaredy=wind, shysh=leaf, goldie=light, pudding=fire, chunky=leaf, shieldy=light, king=dark, twins=wind, hoppy=wind, lovey=light, splitter=water.
  (If any id above doesn't match `catalog.js`, map by nearest theme and keep the coverage test green — it enforces every entry.)

- [ ] **Step 5: Remap pet elements to 8.** `PET_SPECIES` currently uses 4 elements in the `animal(id, name, element, ...)` third argument. Reassign by theme so each of the 8 elements has ≥4 pets: ice → penguin/polarbear/seal/walrus-type entries; wind → bird/bat/butterfly/dragonfly-types; light → chick/sheep/unicorn/hamster-types; dark → bat/crow/wolf/raccoon-types; keep fire/water/leaf/electric for the rest where thematic. The distribution test owns the truth.

- [ ] **Step 6: Run tests** — `npm test` → PASS (fix any id mismatches the coverage test reports). `node --check` both files.

- [ ] **Step 7: Commit** — `git commit -am "feat(v3): 8-element type chart + full species element coverage"`

---

### Task 3: Apply elements to combat both ways + hit feedback

**Files:**
- Modify: `www/js/pets.js` (`_attack`, ~line 186 — it already multiplies by `Balance.elementMult(pet.element, monster elem?)`; wire it to `species.elem` and add feedback)
- Modify: `www/js/monsters.js` (every monster→pet damage call goes through `damageAgent`; multiply by `Balance.elementMult(species.elem, pet.element)`; nest damage stays neutral)
- Test: extend `tests/elements.test.js`

**Interfaces:**
- Consumes: `Balance.elementMult`, monster `species.elem`, pet `PET_SPECIES[i].element`.
- Produces: `Balance.applyElement(baseDmg, atkElem, defElem)` → `{ dmg, mult }` (rounded up, never 0) used by BOTH `pets.js` and `monsters.js`; damage-text tint: 1.5 → `#fff06a` + "Super!", 0.7 → `#8d86a8` + "Resisted".

- [ ] **Step 1: Failing test** (append to `tests/elements.test.js`):

```js
test('applyElement scales and floors at 1', () => {
    assert.deepStrictEqual(Balance.applyElement(10, 'fire', 'ice'), { dmg: 15, mult: 1.5 });
    assert.deepStrictEqual(Balance.applyElement(10, 'ice', 'fire'), { dmg: 7, mult: 0.7 });
    assert.deepStrictEqual(Balance.applyElement(10, 'fire', 'fire'), { dmg: 10, mult: 1 });
    assert.strictEqual(Balance.applyElement(1, 'ice', 'fire').dmg, 1); // floor
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** in `balance.js` right under `elementMult`:

```js
    applyElement(base, atkElem, defElem) {
        const mult = this.elementMult(atkElem, defElem);
        return { dmg: Math.max(1, Math.round(base * mult)), mult };
    },
```

- [ ] **Step 4: Wire pets.js.** In `_attack` (line ~186-190), replace the raw damage computation's element factor with `Balance.applyElement(base, a.pet.elementOf?, target.species.elem)`; concretely: look up the pet's element via its species entry (`PET_SPECIES.find(p => p.id === a.pet.species).element` — pets.js already resolves species for art; reuse that lookup) and the target monster's `m.species.elem`. On `mult === 1.5` show existing damage text in `#fff06a` with `'Super! ' + dmg`; on `0.7` tint `#8d86a8`.

- [ ] **Step 5: Wire monsters.js.** Every attack style lands via `Pets.damageAgent(a, dmg, tint)` (see `pets.js:99`) or nest damage. Before each `damageAgent` call multiply through `Balance.applyElement(dmg, this.species.elem, petElement)`. Nest shelling stays unmultiplied.

- [ ] **Step 6: Run** — `npm test` green; `node --check` all touched files; `npm run serve` → play stage 1-3, confirm "Super!"/"Resisted" texts appear.

- [ ] **Step 7: Commit** — `git commit -am "feat(v3): elemental damage applied both directions with hit feedback"`

---

### Task 4: Waves grow forever + concurrent batch spawning

**Files:**
- Modify: `www/js/balance.js` (`waveSize` line 19-21)
- Modify: `www/js/game.js` (wave spawn site: it currently spawns the whole `Spawner.composeWave(...)` array at stage start — find via `composeWave` call; add a pending-queue)
- Modify: `tests/balance.test.js` + `tests/spawner.test.js` expectations if they assert the 32 cap
- Test: append to `tests/balance.test.js`

**Interfaces:**
- Produces: `Balance.waveSize(stage)` uncapped (strictly increasing); `CONFIG.SPAWN = { concurrentMax: 28, trickleDelayMs: 350 }` in `config.js`; GameScene keeps `this.pendingWave` (array) and spawns from it whenever `aliveCount < CONFIG.SPAWN.concurrentMax`.

- [ ] **Step 1: Failing tests** (append to `tests/balance.test.js`):

```js
test('waveSize strictly increases every stage, no cap', () => {
    for (let s = 1; s <= 500; s++) {
        assert.ok(Balance.waveSize(s + 1) > Balance.waveSize(s), 'stage ' + s);
    }
    assert.ok(Balance.waveSize(200) > 32); // the old cap is gone
});
```

- [ ] **Step 2: Run** → FAIL (cap at 32). **Step 3: Implement**:

```js
    waveSize(stage) {
        return 8 + Math.floor(stage * 1.1);   // v3.0: no cap — every stage adds mobs
    },
```

- [ ] **Step 4: Fix any test that asserted the cap** (`grep -n "32" tests/balance.test.js tests/spawner.test.js tests/economy.test.js`) — update expectations to the uncapped formula. Re-run the 200-stage sim test: the sim's income already uses `waveSize`, so income GROWS vs v2.x; if the taps-band invariant (1-6 taps) breaks, retune is NOT allowed here — instead cap the SIM's income realism by noting mobs beyond concurrent cap still die and pay out (income model unchanged). If the band still breaks, bump `CONFIG.UPGRADES` tap `costGrowth` in steps of +0.002 until `npm test` passes, and record the final value in the commit message.

- [ ] **Step 5: Add to config.js** (after `DROPS`): `SPAWN: { concurrentMax: 28, trickleDelayMs: 350 },`

- [ ] **Step 6: Batch spawning in game.js.** At stage start, instead of instantiating every wave entry, store `this.pendingWave = wave.slice()` and spawn only the first `CONFIG.SPAWN.concurrentMax`. On every monster death (the existing kill handler that already checks stage-clear) and on a `time.addEvent` loop every `trickleDelayMs`, spawn from `pendingWave` while `this.monsters.filter(m => m.alive).length < CONFIG.SPAWN.concurrentMax && this.pendingWave.length > 0`. Stage-clear condition changes from "all spawned dead" to "pendingWave empty AND all spawned dead".

- [ ] **Step 7: Verify** — `npm test` green; `npm run serve`, use the dev stage-skip (or set `SaveManager.state.stage = 40` in console) and confirm ≤28 concurrent, continuous reinforcements, stage clears.

- [ ] **Step 8: Commit** — `git commit -am "feat(v3): endless wave growth with 28-concurrent batch spawning"`

---

### Task 5: Click-to-collect item drops

**Files:**
- Modify: `www/js/config.js` (`DROPS`: add `lifetimeMs: 8000, blinkFromMs: 6000`)
- Modify: `www/js/balance.js` (add pure `dropPhase`)
- Modify: `www/js/game.js` (`spawnItemDrop` ~line 477 and `applyDrop` ~line 504)
- Test: append to `tests/balance.test.js`

**Interfaces:**
- Produces: `Balance.dropPhase(elapsedMs)` → `'idle' | 'blink' | 'gone'`; drops become interactive sprites; `applyDrop(type, rarity, x, y)` unchanged signature (called on tap now).

- [ ] **Step 1: Failing test**:

```js
test('dropPhase: idle -> blink at 6s -> gone at 8s', () => {
    assert.strictEqual(Balance.dropPhase(0), 'idle');
    assert.strictEqual(Balance.dropPhase(5999), 'idle');
    assert.strictEqual(Balance.dropPhase(6000), 'blink');
    assert.strictEqual(Balance.dropPhase(7999), 'blink');
    assert.strictEqual(Balance.dropPhase(8000), 'gone');
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** in `balance.js`:

```js
    dropPhase(elapsedMs) {
        if (elapsedMs >= CONFIG.DROPS.lifetimeMs) return 'gone';
        if (elapsedMs >= CONFIG.DROPS.blinkFromMs) return 'blink';
        return 'idle';
    },
```

and in `config.js` DROPS: `lifetimeMs: 8000, blinkFromMs: 6000,`.

- [ ] **Step 4: Rework `spawnItemDrop` in game.js.** Current code tweens then auto-calls `applyDrop` on complete. Replace with: sprite lands with a small bounce tween, then stays; `spr.setInteractive({ useHandCursor: true })` with a hit area ≥ 48×48 px (`spr.input.hitArea.setSize(Math.max(48, spr.width), ...)`); sparkle pulse tween loop. `spr.once('pointerdown', ...)` → `applyDrop(type, rarity, spr.x, spr.y)`, destroy sprite, haptic tick. A scene timer checks `Balance.dropPhase(now - spawnTime)`: `'blink'` → toggle `spr.alpha` 1/0.25 every 150 ms; `'gone'` → fade-out + destroy WITHOUT applying (show `I18n.t('drop.despawned')` faint text). On stage clear, destroy all uncollected drop sprites.

- [ ] **Step 5: Verify** — `npm test` green; serve-play: kill mobs until a drop lands, tap it (applies), let one expire (blinks then vanishes).

- [ ] **Step 6: Commit** — `git commit -am "feat(v3): drops are click-to-collect with 8s lifetime"`

---

### Task 6: Starter pet + save migration

**Files:**
- Modify: `www/js/save.js` (grant in `init` migration block)
- Test: append to `tests/save.test.js`

**Interfaces:**
- Produces: every save (fresh AND existing) contains ≥1 pet: `{ species: PET_SPECIES[0].id /* 'cat' */, rarity: 'common', level: 1, necklace: null }`; flag `state.starterGranted = true` makes it idempotent; gacha duplicates of the starter behave exactly like any dupe (shards) — no gacha change needed.

- [ ] **Step 1: Failing test** (append to `tests/save.test.js`, following its existing fake-storage pattern):

```js
test('starter pet granted on fresh save and old saves, idempotently', () => {
    const mem = {};
    const storage = {
        getItem: k => mem[k] || null,
        setItem: (k, v) => { mem[k] = v; }
    };
    let st = SaveManager.init(storage);
    assert.strictEqual(st.pets.length, 1);
    assert.strictEqual(st.pets[0].rarity, 'common');
    assert.ok(st.starterGranted);

    // old save without the flag and without pets
    mem[SaveManager.KEY] = JSON.stringify({ gold: 99, pets: [] });
    st = SaveManager.init(storage);
    assert.strictEqual(st.pets.length, 1);
    assert.strictEqual(st.gold, 99);

    // re-init must NOT duplicate
    SaveManager.persist();
    st = SaveManager.init(storage);
    assert.strictEqual(st.pets.length, 1);
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** in `save.js` `init()`, after the v2.1 RENAME block (and also for the fresh path — put it just before `return this.state`):

```js
        // v3.0: starter pet — everyone owns the first common animal.
        if (!this.state.starterGranted) {
            const starterId = (typeof PET_SPECIES !== 'undefined' && PET_SPECIES[0])
                ? PET_SPECIES[0].id : 'cat';
            if (!this.state.pets.some(p => p.species === starterId)) {
                this.state.pets.push({ species: starterId, rarity: 'common', level: 1, necklace: null });
            }
            this.state.starterGranted = true;
            this.persist();
        }
```

Also add `starterGranted: false` to `_freshState()`. In the test file header, inject `globalThis.PET_SPECIES = require('../www/js/catalog.js').PET_SPECIES;` before requiring save.js if not already present.

- [ ] **Step 4: Run** — `npm test` green. **Step 5: Commit** — `git commit -am "feat(v3): starter pet granted to all saves (idempotent migration)"`

---

### Task 7: Skill archetype library (skills.js)

**Files:**
- Create: `www/js/skills.js`
- Create: `tests/skills.test.js`
- Modify: `www/index.html` (script after `catalog.js`, before `battle.js`)

**Interfaces:**
- Produces: global `Skills`:
  - `Skills.ARCHETYPES`: map of 22 ids → `{ id, cd (ms), mag, radius?, durationMs?, desc: {en, ko} }`. Ids exactly: `stun, slow, knockback, taunt, shield, heal, lifesteal, poison, burn, freeze, chain, execute, critaura, goldaura, stealth, clone, summon, rage, revive, dash, slam, buffaura`.
  - `Skills.ready(entity, nowMs)` → bool (checks `entity.skillCdUntil`).
  - `Skills.cast(archetypeId, ctx)` → effect descriptor object (PURE — no Phaser): e.g. `{ kind:'status', status:'stun', durationMs, targets }`, `{ kind:'damage', amount, targets }`, `{ kind:'heal', amount, targets }`, `{ kind:'spawn', what }`, `{ kind:'buff', stat, mult, durationMs, side }`. `ctx = { self:{hp,maxHp,dmg,elem,x,y}, targets:[{id,hp,maxHp,x,y,dist}], now, mult? }`.
  - `Skills.STATUS`: semantics table consumed by engines: `stun/freeze` (no move/attack), `slow` (speed ×0.5), `taunt` (forced target), `shield` (absorb pool), `poison/burn` (DoT per second = mag), `stealth` (untargetable), `rage` (attack interval ×0.6 below 30% hp), `critaura/goldaura/buffaura` (team multipliers).
- Consumed by Tasks 8-9 (engines translate descriptors into Phaser effects).

- [ ] **Step 1: Failing tests**:

```js
// tests/skills.test.js
const test = require('node:test');
const assert = require('node:assert');
const { Skills } = require('../www/js/skills.js');

test('22 archetypes, each with cd/mag/bilingual desc', () => {
    const ids = ['stun','slow','knockback','taunt','shield','heal','lifesteal',
        'poison','burn','freeze','chain','execute','critaura','goldaura',
        'stealth','clone','summon','rage','revive','dash','slam','buffaura'];
    assert.strictEqual(Object.keys(Skills.ARCHETYPES).length, 22);
    for (const id of ids) {
        const a = Skills.ARCHETYPES[id];
        assert.ok(a, id + ' missing');
        assert.ok(a.cd >= 1000, id + ' cd');
        assert.ok(a.desc && a.desc.en && a.desc.ko, id + ' desc i18n');
    }
});

test('cooldown gate', () => {
    const e = { skillCdUntil: 5000 };
    assert.strictEqual(Skills.ready(e, 4999), false);
    assert.strictEqual(Skills.ready(e, 5000), true);
    assert.strictEqual(Skills.ready({}, 0), true);
});

test('execute only fires below threshold', () => {
    const ctx = (hpPct) => ({
        self: { hp: 100, maxHp: 100, dmg: 10, x: 0, y: 0 },
        targets: [{ id: 't', hp: hpPct * 100, maxHp: 100, x: 0, y: 0, dist: 10 }],
        now: 0
    });
    assert.strictEqual(Skills.cast('execute', ctx(0.5)), null);        // too healthy
    const eff = Skills.cast('execute', ctx(0.1));
    assert.strictEqual(eff.kind, 'damage');
    assert.ok(eff.amount >= 9999 * 10 || eff.execute === true);
});

test('chain hits up to mag targets, nearest first', () => {
    const ctx = {
        self: { hp: 1, maxHp: 1, dmg: 10, x: 0, y: 0 },
        targets: [
            { id: 'a', hp: 5, maxHp: 5, x: 0, y: 0, dist: 5 },
            { id: 'b', hp: 5, maxHp: 5, x: 0, y: 0, dist: 15 },
            { id: 'c', hp: 5, maxHp: 5, x: 0, y: 0, dist: 25 },
            { id: 'd', hp: 5, maxHp: 5, x: 0, y: 0, dist: 99 }
        ], now: 0
    };
    const eff = Skills.cast('chain', ctx);
    assert.strictEqual(eff.kind, 'damage');
    assert.strictEqual(eff.targets.length, Math.min(Skills.ARCHETYPES.chain.mag, 4));
    assert.strictEqual(eff.targets[0], 'a');
});

test('ultimate multiplier scales magnitude', () => {
    const ctx = {
        self: { hp: 1, maxHp: 1, dmg: 10, x: 0, y: 0 },
        targets: [{ id: 'a', hp: 5, maxHp: 5, x: 0, y: 0, dist: 5 }],
        now: 0, mult: 4
    };
    const eff = Skills.cast('slam', ctx);
    assert.strictEqual(eff.kind, 'damage');
    assert.strictEqual(eff.amount, Math.round(10 * Skills.ARCHETYPES.slam.mag * 4));
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement `www/js/skills.js`** — complete file:

```js
// =============================================================================
// SMOOSH! - skills.js
// v3.0 skill archetype library (LoL-inspired). PURE: cast() returns effect
// descriptors; monsters.js / pets.js translate them into Phaser reality.
// =============================================================================

const Skills = {

    // Status semantics (engines implement): see spec §A4.
    STATUS: {
        stun:    { blocksMove: true,  blocksAttack: true },
        freeze:  { blocksMove: true,  blocksAttack: true, tint: 0xbfe8ff },
        slow:    { speedMult: 0.5 },
        taunt:   { forcedTarget: true },
        shield:  { absorbs: true },
        poison:  { dotPerSec: true, tint: 0x9dff70 },
        burn:    { dotPerSec: true, tint: 0xff9a5a },
        stealth: { untargetable: true, alpha: 0.35 },
        rage:    { attackIntervalMult: 0.6 }
    },

    ARCHETYPES: {
        stun:     { id: 'stun',     cd: 9000,  mag: 1,   durationMs: 1500, desc: { en: 'Stuns the target briefly.',            ko: '대상을 잠시 기절시킨다.' } },
        slow:     { id: 'slow',     cd: 7000,  mag: 0.5, durationMs: 2500, desc: { en: 'Slows nearby enemies.',                 ko: '주변 적을 느리게 만든다.' } },
        knockback:{ id: 'knockback',cd: 6000,  mag: 90,  radius: 120,      desc: { en: 'Shoves enemies away.',                  ko: '적을 밀쳐낸다.' } },
        taunt:    { id: 'taunt',    cd: 8000,  mag: 1,   durationMs: 2000, radius: 200, desc: { en: 'Forces foes to attack me.', ko: '적들이 나만 공격하게 도발한다.' } },
        shield:   { id: 'shield',   cd: 10000, mag: 2.0,                   desc: { en: 'Gains a damage-absorbing shield.',      ko: '피해를 흡수하는 보호막을 얻는다.' } },
        heal:     { id: 'heal',     cd: 8000,  mag: 0.25,                  desc: { en: 'Heals the most wounded ally.',          ko: '가장 다친 아군을 치유한다.' } },
        lifesteal:{ id: 'lifesteal',cd: 5000,  mag: 0.5,                   desc: { en: 'Bites and drinks health.',              ko: '물어뜯어 체력을 흡수한다.' } },
        poison:   { id: 'poison',   cd: 7000,  mag: 0.4, durationMs: 4000, desc: { en: 'Poisons the target.',                   ko: '대상을 중독시킨다.' } },
        burn:     { id: 'burn',     cd: 7000,  mag: 0.5, durationMs: 3000, desc: { en: 'Sets the target on fire.',              ko: '대상을 불태운다.' } },
        freeze:   { id: 'freeze',   cd: 11000, mag: 1,   durationMs: 1800, desc: { en: 'Freezes the target solid.',             ko: '대상을 꽁꽁 얼린다.' } },
        chain:    { id: 'chain',    cd: 8000,  mag: 3,                     desc: { en: 'Lightning arcs to 3 foes.',             ko: '번개가 적 3명에게 튄다.' } },
        execute:  { id: 'execute',  cd: 6000,  mag: 9999, threshold: 0.15, desc: { en: 'Finishes off weakened prey.',           ko: '빈사의 사냥감을 처형한다.' } },
        critaura: { id: 'critaura', cd: 12000, mag: 0.10, durationMs: 5000, desc: { en: 'Team crit chance up.',                 ko: '팀 치명타 확률 증가.' } },
        goldaura: { id: 'goldaura', cd: 12000, mag: 0.15, durationMs: 5000, desc: { en: 'Team gold gain up.',                   ko: '팀 골드 획득 증가.' } },
        stealth:  { id: 'stealth',  cd: 10000, mag: 1,   durationMs: 2500, desc: { en: 'Vanishes from sight.',                  ko: '시야에서 사라진다.' } },
        clone:    { id: 'clone',    cd: 14000, mag: 1,                     desc: { en: 'Splits off a copy.',                    ko: '분신을 만들어낸다.' } },
        summon:   { id: 'summon',   cd: 13000, mag: 2,                     desc: { en: 'Calls tiny helpers.',                   ko: '꼬마 부하들을 소환한다.' } },
        rage:     { id: 'rage',     cd: 1,     mag: 0.6, passive: true,    desc: { en: 'Attacks faster when hurt.',             ko: '다치면 공격이 빨라진다.' } },
        revive:   { id: 'revive',   cd: 1,     mag: 0.5, passive: true, once: true, desc: { en: 'Rises once from KO.',          ko: '쓰러져도 한 번 다시 일어난다.' } },
        dash:     { id: 'dash',     cd: 5000,  mag: 1.5,                   desc: { en: 'Dashes to strike.',                     ko: '돌진해 공격한다.' } },
        slam:     { id: 'slam',     cd: 9000,  mag: 2.5, radius: 160,      desc: { en: 'Ground-pounds an area.',                ko: '지면을 내리쳐 광역 피해.' } },
        buffaura: { id: 'buffaura', cd: 12000, mag: 0.20, durationMs: 5000, desc: { en: 'Team attack up.',                      ko: '팀 공격력 증가.' } }
    },

    ready(entity, nowMs) {
        return !entity.skillCdUntil || nowMs >= entity.skillCdUntil;
    },

    // Returns an effect descriptor or null (no valid target / condition unmet).
    // ctx: { self:{hp,maxHp,dmg,elem,x,y}, targets:[{id,hp,maxHp,x,y,dist}], now, mult? }
    cast(id, ctx) {
        const a = this.ARCHETYPES[id];
        if (!a) return null;
        const mult = ctx.mult || 1;
        const near = (ctx.targets || []).slice().sort((p, q) => p.dist - q.dist);
        const first = near[0];
        switch (id) {
            case 'stun': case 'freeze':
                return first ? { kind: 'status', status: id, durationMs: a.durationMs * mult, targets: [first.id] } : null;
            case 'slow':
                return near.length ? { kind: 'status', status: 'slow', durationMs: a.durationMs * mult, targets: near.slice(0, 4).map(t => t.id) } : null;
            case 'taunt':
                return { kind: 'status', status: 'taunt', durationMs: a.durationMs * mult, targets: near.filter(t => t.dist <= a.radius).map(t => t.id), source: true };
            case 'stealth':
                return { kind: 'status', status: 'stealth', durationMs: a.durationMs * mult, targets: ['self'] };
            case 'poison': case 'burn':
                return first ? { kind: 'status', status: id, durationMs: a.durationMs * mult, dotPerSec: Math.round(ctx.self.dmg * a.mag * mult), targets: [first.id] } : null;
            case 'shield':
                return { kind: 'shield', amount: Math.round(ctx.self.maxHp * a.mag * mult) / 2, targets: ['self'] };
            case 'heal':
                return { kind: 'heal', amount: Math.round(ctx.self.maxHp * a.mag * mult), targets: ['ally-lowest'] };
            case 'lifesteal':
                return first ? { kind: 'damage', amount: Math.round(ctx.self.dmg * mult), heal: a.mag, targets: [first.id] } : null;
            case 'chain':
                return near.length ? { kind: 'damage', amount: Math.round(ctx.self.dmg * mult), targets: near.slice(0, a.mag).map(t => t.id), chain: true } : null;
            case 'execute': {
                const prey = near.find(t => t.hp / t.maxHp <= a.threshold);
                return prey ? { kind: 'damage', amount: Math.round(ctx.self.dmg * a.mag * mult), execute: true, targets: [prey.id] } : null;
            }
            case 'knockback':
                return { kind: 'knockback', distance: a.mag * mult, targets: near.filter(t => t.dist <= a.radius).map(t => t.id) };
            case 'critaura':
                return { kind: 'buff', stat: 'crit', add: a.mag * mult, durationMs: a.durationMs, side: 'ally' };
            case 'goldaura':
                return { kind: 'buff', stat: 'gold', add: a.mag * mult, durationMs: a.durationMs, side: 'ally' };
            case 'buffaura':
                return { kind: 'buff', stat: 'dmg', add: a.mag * mult, durationMs: a.durationMs, side: 'ally' };
            case 'clone':
                return { kind: 'spawn', what: 'clone', count: Math.round(a.mag * mult) };
            case 'summon':
                return { kind: 'spawn', what: 'minion', count: Math.round(a.mag * mult) };
            case 'dash':
                return first ? { kind: 'damage', amount: Math.round(ctx.self.dmg * a.mag * mult), dash: true, targets: [first.id] } : null;
            case 'slam':
                return { kind: 'damage', amount: Math.round(ctx.self.dmg * a.mag * mult), radius: a.radius, targets: near.filter(t => t.dist <= a.radius).map(t => t.id) };
            case 'rage': case 'revive':
                return null; // passives — engines check ARCHETYPES directly
            default:
                return null;
        }
    }
};

if (typeof module !== 'undefined') module.exports = { Skills };
```

- [ ] **Step 4: Run** — `npm test` green. Add `<script src="js/skills.js"></script>` after `catalog.js` in index.html. `node --check www/js/skills.js`.

- [ ] **Step 5: Commit** — `git commit -am "feat(v3): 22-archetype skill library (pure, LoL-inspired)"`

---

### Task 8: Monster skills (24 assignments + engine)

**Files:**
- Modify: `www/js/catalog.js` (add `skill` to every monster def)
- Modify: `www/js/monsters.js` (skill tick in `_updateAttack` area; status handling in monster update)
- Test: append to `tests/catalog.test.js`

**Interfaces:**
- Consumes: `Skills.ready/cast/ARCHETYPES/STATUS`.
- Produces: every monster `species.skill` ∈ ARCHETYPES; monster entities carry `skillCdUntil`, `status` (map `statusId -> {until, dotPerSec?}`); a shared helper `Monsters.applyEffect(scene, self, eff)` that translates descriptors (damage→`Pets.damageAgent`/nest, status→`status` map, spawn clone/minion→spawn scaled-down copies (radius ×0.6, hp ×0.3, no further skills)).

- [ ] **Step 1: Failing test** (append to `tests/catalog.test.js`):

```js
test('every monster has a valid skill archetype', () => {
    const { Skills } = require('../www/js/skills.js');
    for (const s of SPECIES) {
        assert.ok(Skills.ARCHETYPES[s.skill], 'monster ' + s.id + ' skill=' + s.skill);
    }
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Assign** (exact table; personality-matched):
  blob=slow, mini=dash, tank=shield, zippy=chain, grumpy=burn, rocky=slam, orbity=buffaura, bubbly=poison, freezy=freeze, drop=knockback, blinky=stun, ghosty=stealth, cloney=clone, scaredy=dash, shysh=heal, goldie=goldaura, pudding=taunt, chunky=knockback, shieldy=shield, king=summon, twins=clone, hoppy=slow, lovey=heal, splitter=summon. (Nearest-theme rule + the coverage test own the truth if ids differ.)

- [ ] **Step 4: Engine wiring in monsters.js.** In the per-monster update (where `_updateAttack` cadence already runs): if `Skills.ready(m, now)` and a skill target exists, build `ctx` from live pets (`targets` = alive pet agents as `{id, hp, maxHp, x, y, dist}`) — for ally-type skills (heal/shield/auras) run with monster allies instead; `const eff = Skills.cast(m.species.skill, ctx)`; if eff, `m.skillCdUntil = now + Skills.ARCHETYPES[m.species.skill].cd`, apply via `Monsters.applyEffect`, flash a small colored ring + `Sfx.monsterAttack`-style bark. Status handling in the monster/pet update loops: `stun/freeze` skip movement+attacks; `slow` multiplies speed; DoT statuses tick 1×/sec via accumulated delta. Keep clone/summon spawns EXCLUDED from `pendingWave` accounting but INCLUDED in the alive-count for stage clear.

- [ ] **Step 5: Verify** — `npm test` green; serve-play stages 1-12: see monster skill rings/effects, no console errors.

- [ ] **Step 6: Commit** — `git commit -am "feat(v3): every monster species casts a personality skill"`

---

### Task 9: Pet skills + representative-pet ultimate

**Files:**
- Modify: `www/js/catalog.js` (add 4th-positional or named `skill` to all 50 `animal(...)` entries)
- Modify: `www/js/pets.js` (auto-cast in agent update; same `applyEffect` pattern against monsters)
- Modify: `www/js/game.js` + `www/js/ui.js` (ultimate gauge + button)
- Modify: `www/js/save.js` (`repPet: null` in fresh state — species id of the representative pet; default = starter)
- Test: append to `tests/catalog.test.js`

**Interfaces:**
- Consumes: `Skills.*`, Task 8's status conventions (pets get the same `status` map).
- Produces: `PET_SPECIES[i].skill` valid for all 50; `GameScene.ultGauge` 0-100 (`+2` per monster kill, persisted per-run only); when 100, UI shows a pulsing ULT button; pressing it casts the rep pet's skill with `ctx.mult = 4` + screen flash + gauge reset. `SaveManager.state.repPet` (species id) — settable later in nest UI (Phase B); until then rep = first owned pet.

- [ ] **Step 1: Failing test**:

```js
test('every pet has a valid skill archetype', () => {
    const { Skills } = require('../www/js/skills.js');
    for (const p of PET_SPECIES) {
        assert.ok(Skills.ARCHETYPES[p.skill], 'pet ' + p.id + ' skill=' + p.skill);
    }
});

test('ult gauge math', () => {
    const { Balance } = require('../www/js/balance.js');
    assert.strictEqual(Balance.ultGain(0), 2);
    assert.strictEqual(Balance.ultGain(99), 1);   // clamps to 100
    assert.strictEqual(Balance.ultGain(100), 0);  // full
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3:** Add to `balance.js`:

```js
    ULT_MAX: 100, ULT_PER_KILL: 2,
    ultGain(current) {
        return Math.max(0, Math.min(this.ULT_PER_KILL, this.ULT_MAX - current));
    },
```

- [ ] **Step 4: Assign pet skills.** Update `animal(id, name, element, ...)` to accept a `skill` argument (extend the factory signature: `animal(id, name, element, skill, body, ...)` and update ALL 50 call sites in one pass). Distribute so every archetype is used by ≥1 pet and no archetype by >4 pets (add that as a test assertion too). Personality-match (cat=dash, dog=taunt, rabbit=heal, bear=slam, panda=shield, fox=stealth, etc.); the two tests own the truth.

- [ ] **Step 5: Engine in pets.js.** Mirror Task 8: in the agent update, `Skills.ready(a, now)` → build ctx with alive monsters as targets (ally skills use pet agents / the nest as heal target) → cast → apply. Reuse ONE shared translator: extract Task 8's `applyEffect` into `www/js/battlefx.js`? NO — keep it simple: implement `applySkillEffect(scene, casterSide, self, eff)` ONCE in `www/js/skills.js` guarded behind `typeof Phaser !== 'undefined'`? Also no (keeps skills.js pure). Put the shared translator in `www/js/effects.js` as `Effects.applySkillEffect(scene, side, self, eff)` — both monsters.js and pets.js call it; it routes damage to `Pets.damageAgent` (side=monster) or the monster `takeDamage` path (side=pet), statuses into `entity.status`, spawns via the scene's existing spawn helpers.

- [ ] **Step 6: Ultimate UI in game.js/ui.js.** GameScene: `this.ultGauge = 0`; on each monster kill `this.ultGauge += Balance.ultGain(this.ultGauge)`; HUD ring/button bottom-right (above the fever bar): grayscale while <100, pulsing gold + `I18n.t('ult.ready')` toast once at 100; `pointerdown` → find rep pet agent (`SaveManager.state.repPet` or first owned), `Skills.cast(repSkill, {..., mult: 4})`, apply, white 120 ms screen flash, `ultGauge = 0`.

- [ ] **Step 7: Verify** — `npm test` green; serve-play: kill 50 mobs → ULT button lights → press → big effect, gauge resets.

- [ ] **Step 8: Commit** — `git commit -am "feat(v3): pet skills for all 50 species + manual rep-pet ultimate"`

---

### Task 10: Stage map page with replay

**Files:**
- Create: `www/js/stagemap.js` (pure layout + StageMapScene)
- Create: `tests/stagemap.test.js`
- Modify: `www/index.html` (script before `ui.js`), `www/js/main.js` (register scene), `www/js/ui.js` (MAP button in MenuScene), `www/js/game.js` (replay mode)

**Interfaces:**
- Produces: `StageMap.layout(centerStage, count)` → array of `{ stage, x, y, boss }` for a zigzag column (PURE, deterministic: x alternates between 5 fixed lanes via `CONFIG.dateHash('node'+stage) % 5`, y descends 150 px per node); `GameScene` accepts `this.scene.start('GameScene', { replayStage: N })` → plays stage N with `this.replayMode = true`; gold payouts ×0.3 (`Balance.replayGoldMult = 0.3`) while drops roll at 100%; on clear, returns to StageMapScene and does NOT advance `state.stage`/`bestStage`.

- [ ] **Step 1: Failing tests**:

```js
// tests/stagemap.test.js
const test = require('node:test');
const assert = require('node:assert');
globalThis.CONFIG = require('../www/js/config.js').CONFIG;
globalThis.Balance = require('../www/js/balance.js').Balance;
const { StageMap } = require('../www/js/stagemap.js');

test('layout is deterministic and zigzags', () => {
    const a = StageMap.layout(10, 20);
    const b = StageMap.layout(10, 20);
    assert.deepStrictEqual(a, b);
    assert.strictEqual(a.length, 20);
    assert.ok(a.every(n => n.x >= 90 && n.x <= 630));
    assert.ok(a.some((n, i) => i > 0 && n.x !== a[i - 1].x), 'no zigzag');
});

test('boss nodes every 10th stage', () => {
    const nodes = StageMap.layout(5, 30);
    for (const n of nodes) assert.strictEqual(n.boss, n.stage % 10 === 0, 'stage ' + n.stage);
});

test('replay gold multiplier', () => {
    assert.strictEqual(Balance.replayGoldMult, 0.3);
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement `stagemap.js`** — pure part:

```js
// =============================================================================
// SMOOSH! - stagemap.js
// v3.0 zigzag stage map. Pure layout + the StageMapScene (vertical scroll,
// tap a cleared node to REPLAY: 30% gold, 100% drops - Balance.replayGoldMult).
// =============================================================================

const StageMap = {
    LANES: [130, 250, 360, 470, 590],
    STEP_Y: 150,

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
```

Add `replayGoldMult: 0.3,` to `balance.js` (top level of the object).

- [ ] **Step 4: StageMapScene** (same file, guarded `if (typeof Phaser !== 'undefined')`): vertical-scroll camera (drag + wheel), draws a soft dotted path between consecutive nodes, node circles (cleared = filled pastel + stage number; frontier = bigger, bouncing, rep-pet sprite standing on it; future = dimmed, not interactive; boss = crown icon + 1.4× radius). Tap cleared node → confirm chip `I18n.t('map.replay')` → `scene.start('GameScene', { replayStage: n })`. Tap frontier → normal `scene.start('GameScene')`. Title `I18n.t('map.title')`, subtitle `I18n.t('map.replayReward')`, back button → MenuScene.

- [ ] **Step 5: GameScene replay mode.** In `init(data)`: `this.replayStage = data && data.replayStage || null`. Stage source: `this.replayStage || SaveManager.state.stage`. Everywhere gold is credited from kills/clear settlement multiply by `this.replayStage ? Balance.replayGoldMult : 1`. On stage clear in replay mode: skip `state.stage++`/`bestStage` update, settlement panel shows "REPLAY" tag, continue button returns to StageMapScene.

- [ ] **Step 6: Register + entry.** `main.js`: add `StageMapScene` to the scene array (after MenuScene). `ui.js` MenuScene: add a MAP button (map-pin icon) next to the existing nav buttons → `scene.start('StageMapScene')`. index.html: `<script src="js/stagemap.js"></script>` right before `ui.js`.

- [ ] **Step 7: Verify** — `npm test` green; serve: map scrolls, replay an old stage → 30% gold shown, progress pointer intact.

- [ ] **Step 8: Commit** — `git commit -am "feat(v3): zigzag stage map with 30%-gold replay"`

---

### Task 11: Dex (monsters + pets) with bilingual lore

**Files:**
- Create: `www/js/dex.js` (lore data + unlock predicates + DexScene)
- Create: `tests/dex.test.js`
- Modify: `www/js/save.js` (`kills: {}` per-species counters), `www/js/game.js` (count kills per species id), `www/js/main.js` (register scene), `www/js/ui.js` (DEX button), `www/js/shop.js` (nav entry), `www/index.html`

**Interfaces:**
- Produces: `Dex.LORE = { [id]: { en, ko } }` covering EVERY monster id and pet id; `Dex.monsterUnlocked(id, save)` (= `(save.kills[id]||0) > 0`), `Dex.petUnlocked(id, save)` (= owned now or ever: `save.pets.some(...) || (save.petsSeen||[]).includes(id)`); `save.kills` map + `save.petsSeen` array maintained by game/gacha code.

- [ ] **Step 1: Failing tests**:

```js
// tests/dex.test.js
const test = require('node:test');
const assert = require('node:assert');
globalThis.CONFIG = require('../www/js/config.js').CONFIG;
const { SPECIES, PET_SPECIES } = require('../www/js/catalog.js');
const { Dex } = require('../www/js/dex.js');

test('every species (monster + pet) has bilingual lore, 20-160 chars en', () => {
    for (const s of [...SPECIES, ...PET_SPECIES]) {
        const l = Dex.LORE[s.id];
        assert.ok(l, 'lore missing: ' + s.id);
        assert.ok(l.en.length >= 20 && l.en.length <= 160, s.id + ' en length');
        assert.ok(l.ko.trim().length >= 10, s.id + ' ko');
    }
});

test('unlock predicates', () => {
    const save = { kills: { blob: 3 }, pets: [{ species: 'cat' }], petsSeen: ['dog'] };
    assert.strictEqual(Dex.monsterUnlocked('blob', save), true);
    assert.strictEqual(Dex.monsterUnlocked('tank', save), false);
    assert.strictEqual(Dex.petUnlocked('cat', save), true);
    assert.strictEqual(Dex.petUnlocked('dog', save), true);
    assert.strictEqual(Dex.petUnlocked('fox', save), false);
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement `dex.js`.** Pure half: `Dex.LORE` — author ALL ~74 entries (short, witty, personality-true; e.g. `blob: { en: 'The original jelly. Zero ambitions, maximum bounce. Dreams of being left alone.', ko: '원조 젤리. 야망 제로, 통통함 최대. 꿈은 그냥 가만히 있는 것.' }`) — the length test enforces completeness and effort; `monsterUnlocked/petUnlocked` exactly as the test defines. Scene half (Phaser-guarded): two tabs (`I18n.t('dex.monsters')` / `I18n.t('dex.pets')`), pastel card grid 4-wide scrollable; locked card = dark silhouette (existing texture tinted 0x221a38) + `I18n.t('dex.locked')`; unlocked card tap → detail overlay: big sprite, name, element badge (colored chip), skill icon + `Skills.ARCHETYPES[skill].desc[I18n.locale]`, lore, stats (monster: hpMult/speed/goldMult + `I18n.t('dex.kills', {n})`; pet: copies/level/element), close button.

- [ ] **Step 4: Tracking.** `save.js` fresh state: `kills: {}, petsSeen: []`. `game.js` kill handler: `st.kills[m.species.id] = (st.kills[m.species.id]||0) + 1` (no persist-per-kill — piggyback the existing settlement persist). `gacha.js` grant path: push species id into `petsSeen` if absent.

- [ ] **Step 5: Register + entries** — scene in `main.js`; DEX buttons in MenuScene (`ui.js`) and the pause-shop nav (`shop.js`, follow its existing tab/nav pattern); script tag before `ui.js`.

- [ ] **Step 6: Verify** — `npm test` green; serve: dex opens from menu + pause shop, silhouettes for unmet monsters, detail popups show lore in en (switch `I18n.locale='ko'` in console → ko).

- [ ] **Step 7: Commit** — `git commit -am "feat(v3): monster+pet dex with bilingual lore and skill cards"`

---

### Task 12: USD prices + $0.99 remove-ads

**Files:**
- Modify: `www/js/iap.js` (PRODUCTS + remove-ads grant), `www/js/ads.js` (gating), `www/js/save.js` (`adsRemoved: false`), `www/js/shop.js` (gem-shop rows)
- Test: create `tests/iap.test.js`

**Interfaces:**
- Produces: `IapManager.PRODUCTS` = `smoosh_gems_small $0.99/120`, `smoosh_gems_medium $4.99/700`, `smoosh_gems_large $9.99/2000`, plus `{ id: 'smoosh_remove_ads', type: 'noads', label: '🚫 Ads', priceLabel: '$0.99' }`; `AdsManager.adsRemoved` getter reads `SaveManager.state.adsRemoved`; `showBanner()` and the interstitial trigger early-return when true; rewarded flow untouched.

- [ ] **Step 1: Failing tests**:

```js
// tests/iap.test.js
const test = require('node:test');
const assert = require('node:assert');
const { IapManager } = require('../www/js/iap.js');

test('gem packs are USD-labeled', () => {
    const labels = IapManager.PRODUCTS.map(p => p.priceLabel);
    assert.deepStrictEqual(labels, ['$0.99', '$4.99', '$9.99', '$0.99']);
});

test('remove-ads product grants the flag, not gems', () => {
    const { SaveManager } = require('../www/js/save.js');
    globalThis.PET_SPECIES = globalThis.PET_SPECIES || require('../www/js/catalog.js').PET_SPECIES;
    globalThis.SaveManager = SaveManager;
    SaveManager.init({ getItem: () => null, setItem: () => {} });
    const p = IapManager.PRODUCTS.find(x => x.id === 'smoosh_remove_ads');
    assert.ok(p && p.type === 'noads');
    const gemsBefore = SaveManager.state.gems;
    IapManager._grant(p);
    assert.strictEqual(SaveManager.state.adsRemoved, true);
    assert.strictEqual(SaveManager.state.gems, gemsBefore);
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** `iap.js` PRODUCTS:

```js
    PRODUCTS: [
        { id: 'smoosh_gems_small',  gems: 120,  label: '💎 120',  priceLabel: '$0.99' },
        { id: 'smoosh_gems_medium', gems: 700,  label: '💎 700',  priceLabel: '$4.99' },
        { id: 'smoosh_gems_large',  gems: 2000, label: '💎 2000', priceLabel: '$9.99' },
        { id: 'smoosh_remove_ads',  type: 'noads', label: '🚫 Ads', priceLabel: '$0.99' }
    ],
```

`_grant`: `if (product.type === 'noads') { SaveManager.state.adsRemoved = true; } else { SaveManager.state.gems += product.gems; } SaveManager.persist();`. `save.js` fresh state: `adsRemoved: false`. `ads.js`: `get adsRemoved() { return !!(typeof SaveManager !== 'undefined' && SaveManager.state && SaveManager.state.adsRemoved); }`; first line of `showBanner()` → `if (this.adsRemoved) return;`; first line of the interstitial-show path (`onStageClear`/`maybeShowInterstitial`) → same guard. Rewarded methods untouched.

- [ ] **Step 4: Shop UI.** In the gem shop panel (`shop.js`): render the remove-ads row from PRODUCTS like gems rows; if `SaveManager.state.adsRemoved`, replace the buy button with static `I18n.t('shop.adsRemoved')`; else button label `I18n.t('shop.removeAds') + ' $0.99'`.

- [ ] **Step 5: Verify** — `npm test` green; serve: buy remove-ads in dev-store confirm → row flips to "Ads removed ✓", banner never shows on menu.

- [ ] **Step 6: Commit** — `git commit -am "feat(v3): USD gem prices + $0.99 remove-ads (rewarded ads kept)"`

---

### Task 13: PvP team picker (up to 5 pets)

**Files:**
- Modify: `www/js/config.js` (`PVP.teamSize: 3` → `5`)
- Modify: `www/js/balance.js` (add `pvpValidTeam`, `pvpAutoTeam`)
- Modify: `www/js/save.js` (`pvpTeam: []` in `_freshState()`)
- Modify: `www/js/pvp.js` (team picker overlay before the match; bot team mirrors picked count)
- Modify: `www/js/i18n.js` (add keys `pvp.pickTeam` en:'PICK YOUR TEAM (max 5)' ko:'팀 선택 (최대 5마리)', `pvp.auto` en:'AUTO' ko:'자동', `pvp.fight` en:'FIGHT!' ko:'싸우자!')
- Create: `tests/pvpteam.test.js`

**Interfaces:**
- Consumes: `Balance.petDamage(level, tapLevel, rarity, necklace)`, `SaveManager.state.pets` (`{species, rarity, level, necklace}`), existing pvp.js match flow + `CONFIG.PVP.botPowerJitter`.
- Produces: `Balance.pvpValidTeam(teamIds, ownedPets)` → owned-only, deduped, capped at `CONFIG.PVP.teamSize`; `Balance.pvpAutoTeam(ownedPets, tapLevel)` → top-N species ids by `petDamage`; `save.pvpTeam` (species ids) persisted after each picker confirm; bot team size = player team size.

- [ ] **Step 1: Write the failing tests**

```js
// tests/pvpteam.test.js
const test = require('node:test');
const assert = require('node:assert');
globalThis.CONFIG = require('../www/js/config.js').CONFIG;
const { Balance } = require('../www/js/balance.js');

test('PvP team size cap is 5', () => {
    assert.strictEqual(CONFIG.PVP.teamSize, 5);
});

test('pvpValidTeam keeps owned only, dedupes, caps at 5', () => {
    const owned = [
        { species: 'cat' }, { species: 'dog' }, { species: 'fox' },
        { species: 'bear' }, { species: 'panda' }, { species: 'rabbit' }
    ];
    const team = Balance.pvpValidTeam(
        ['cat', 'cat', 'ghost-notowned', 'dog', 'fox', 'bear', 'panda', 'rabbit'], owned);
    assert.deepStrictEqual(team, ['cat', 'dog', 'fox', 'bear', 'panda']);
    assert.deepStrictEqual(Balance.pvpValidTeam(null, owned), []);
});

test('pvpAutoTeam picks top 5 by damage (rarity beats level here)', () => {
    const owned = [
        { species: 'a', rarity: 'common',    level: 1, necklace: null },
        { species: 'b', rarity: 'legendary', level: 1, necklace: null },
        { species: 'c', rarity: 'rare',      level: 1, necklace: null },
        { species: 'd', rarity: 'epic',      level: 1, necklace: null },
        { species: 'e', rarity: 'common',    level: 9, necklace: null },
        { species: 'f', rarity: 'common',    level: 1, necklace: null }
    ];
    const team = Balance.pvpAutoTeam(owned, 5);
    assert.strictEqual(team.length, 5);
    assert.strictEqual(team[0], 'b');            // legendary first
    assert.ok(!team.includes('f') || !team.includes('a')); // one weakest common left out
});
```

- [ ] **Step 2: Run** — `npm test` → FAIL. **Step 3: Implement.** `config.js`: `teamSize: 5`. `balance.js`:

```js
    // v3.0 PvP: player picks up to teamSize pets; AUTO = top damage.
    pvpValidTeam(teamIds, ownedPets) {
        const owned = new Set((ownedPets || []).map(p => p.species));
        const seen = new Set();
        const out = [];
        for (const id of (teamIds || [])) {
            if (owned.has(id) && !seen.has(id)) { seen.add(id); out.push(id); }
            if (out.length >= CONFIG.PVP.teamSize) break;
        }
        return out;
    },
    pvpAutoTeam(ownedPets, tapLevel) {
        return (ownedPets || []).slice()
            .sort((a, b) => this.petDamage(b.level, tapLevel, b.rarity, b.necklace)
                          - this.petDamage(a.level, tapLevel, a.rarity, a.necklace))
            .slice(0, CONFIG.PVP.teamSize)
            .map(p => p.species);
    },
```

`save.js` fresh state: `pvpTeam: []`.

- [ ] **Step 4: Picker UI in pvp.js.** Where the match currently auto-builds the player team, insert a picker overlay first: title `I18n.t('pvp.pickTeam')`; grid of owned-pet cards (existing pet card rendering pattern in shop.js); tap toggles selection (max `CONFIG.PVP.teamSize`, golden ring on selected); AUTO button (`I18n.t('pvp.auto')`) → `Balance.pvpAutoTeam(...)`; FIGHT button (`I18n.t('pvp.fight')`) enabled when ≥1 selected → saves `state.pvpTeam`, persists, starts the match with exactly those pets. Initial selection = `Balance.pvpValidTeam(state.pvpTeam, state.pets)`, or AUTO if empty. Bot team generation: same count as the player's picked team.

- [ ] **Step 5: Verify** — `npm test` green; `node --check` touched files; serve: PvP shows picker, AUTO fills, fight runs with picked pets, bot count matches.

- [ ] **Step 6: Commit** — `git commit -am "feat(v3): PvP team picker - choose up to 5 pets"`

---

### Task 14: Ship v3.0.0

**Files:**
- Modify: `android/app/build.gradle` (versionCode +1, versionName "3.0.0"), any version literals in `www/js/ui.js`
- Modify: `games-for-release/smoosh-mobile/RELEASE_STATUS.md` (progress row + version log)

**Steps:**

- [ ] **Step 1:** Full suite: `npm test` → ALL green (existing 62 + new). `node --check` every touched `www/js/*.js`.
- [ ] **Step 2:** i18n sweep: grep new scenes for hardcoded user-visible strings (`grep -n "'[A-Z][a-z].*'" www/js/stagemap.js www/js/dex.js` etc.) — route stragglers through `I18n.t`.
- [ ] **Step 3:** Manual smoke via `npm run serve`: menu → map → play frontier stage → drops clickable → ult fires → dex unlocks → shop shows USD + remove-ads.
- [ ] **Step 4:** Bump `versionName "3.0.0"`, `versionCode` +1; update any `v2.x` footer literals in `ui.js`.
- [ ] **Step 5:** `npx cap sync android`; then `$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"; & "android\gradlew.bat" -p android bundleRelease` → verify `android/app/build/outputs/bundle/release/app-release.aab` exists and its manifest contains 3.0.0.
- [ ] **Step 6:** Update `RELEASE_STATUS.md` (v3.0 row: what shipped, test count, AAB verified). Commit: `git commit -am "release: v3.0.0 - Phase A (drops/starter/waves/skills/elements/map/dex/USD/no-ads/i18n)"`.

---

## Self-Review Notes

- Spec coverage: A1→Task 5, A2→Task 6, A3→Task 4, A4→Tasks 7-9, A5→Tasks 2-3, A6→Task 10, A7→Task 11, A8→Task 12, A9→Task 1 (+sweep in 14), A10→Task 13. Phase B/C get their own plans after A ships.
- Type consistency: `Balance.elementMult` name kept (existing caller in pets.js); `applyEffect` consolidated into `Effects.applySkillEffect` (Task 9 Step 5 supersedes Task 8's local helper — Task 8 may implement it in monsters.js first, Task 9 extracts to effects.js and updates both call sites).
- Content-scale items (50 pet skill assignments, ~74 lore entries, pet element remap) are enforced by completeness/distribution tests rather than inline tables where the exact catalog ids must win over this document.
