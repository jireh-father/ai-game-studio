# Peel It! Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "Peel It!" — a zen ASMR film-peeling mobile game (Phaser 3 + Capacitor Android) ready for Play release under the pending org account, per the approved spec `docs/superpowers/specs/2026-07-02-peel-it-design.md`.

**Architecture:** Static `www/` (plain JS globals, no bundler) rendered by Phaser 3, wrapped by Capacitor 6 for Android — the exact ZAP TAP pipeline. Core peel is a pure-logic `PeelModel` (unit-testable) driving crop-based film rendering in `GameScene`. No server, no Firebase; progress in `localStorage`.

**Tech Stack:** Phaser 3.60 (vendored), Capacitor 6 (`@capacitor-community/admob`, `@capacitor/haptics`, splash/status-bar), Web Audio (synthesized SFX), Python Pillow (icons), Gradle/JDK21 (AAB).

## Global Constraints

- All code, comments, and docs in **English** (project English-Only Rule). Game UI copy: English.
- Project folder: `games-for-release/peel-it-mobile/` — **gitignored by the parent repo**. Task 1 creates a **local git repo inside the folder**; all "commit" steps target that local repo. Only `CLAUDE.md` (status-doc table row) and this plan are committed to the main repo.
- Package `com.represen.peelit`, app name `Peel It!`, versionCode `1` / versionName `1.0.0`.
- AdMob: Google **TEST** IDs everywhere during development; `USE_TEST_ADS: true`. Real units (new app under publisher `pub-7114194646987493`, account `happyirelim@gmail.com`) are created manually at release prep — AdMob console does not work under CDP.
- **NEVER** touch Play Console. **No automatic browser testing** (user global rule) — verification = `node --check`, `node --test`, build checks; browser/device checks are reported as "ready for you to test".
- Script load order in `index.html`: `main.js` **always last**.
- Temp files → `./tmp/` inside the project folder, never in any root.
- Known Phaser bug rules apply (no `addBase64` outside BootScene, no `timeScale=0`+`delayedCall`, resize handler, HUD init from state not literals, no double state increments).
- Design resolution 720×1280 portrait, `Phaser.Scale.FIT`.

## File Map

| File | Responsibility |
|---|---|
| `www/index.html` | Shell, script order (config → catalog → save → peel-model → sfx → haptics → effects → ads → game → ui → main) |
| `www/css/style.css` | Fullscreen container, safe-area, landscape warning |
| `www/lib/phaser.min.js` | Vendored Phaser 3.60 (offline-capable) |
| `www/js/config.js` | `CONFIG`: colors, peel tuning, economy, ad policy |
| `www/js/catalog.js` | `CATALOG`: 24 object defs (SVG body, film panels, costs) |
| `www/js/save.js` | `SaveManager`: localStorage persistence (injectable storage) |
| `www/js/peel-model.js` | `PeelModel`: pure peel/stress/tear math |
| `www/js/sfx.js` | `Sfx`: Web Audio synth (crackle loop, rip, chime, coin) |
| `www/js/haptics.js` | `Haptic`: Capacitor Haptics wrapper (throttled ticks) |
| `www/js/effects.js` | `Effects`: confetti, sparkle reveal, coin fly |
| `www/js/ads.js` | `AdsManager`: port of ZAP TAP ads.js, Peel It! placements |
| `www/js/game.js` | `GameScene`: object render, film crop, curl, input, awards |
| `www/js/ui.js` | `MenuScene`, `ShowroomScene`, in-game HUD & popups |
| `www/js/main.js` | `BootScene` (texture generation), Phaser init — LAST |
| `tests/*.test.js` | `node --test` unit tests (model, save, economy, catalog) |
| `scripts/gen_icons.py` | Pillow launcher-icon generator |
| `RELEASE_STATUS.md` | Live status doc (ZAP TAP convention) |

Pure-logic files (`config.js`, `catalog.js`, `save.js`, `peel-model.js`) end with a Node export guard so `node --test` can import them:

```js
if (typeof module !== 'undefined') module.exports = { PeelModel };
```

---

### Task 1: Project scaffold + Capacitor Android shell

**Files:**
- Create: `games-for-release/peel-it-mobile/{package.json, capacitor.config.ts, .gitignore, RELEASE_STATUS.md}`
- Create: `www/index.html`, `www/css/style.css`, `www/lib/phaser.min.js`, empty `www/js/*.js` stubs, `tests/`, `tmp/`
- Create (generated): `android/` via `npx cap add android`, then signing config

**Interfaces:**
- Produces: runnable shell (`npm run serve` on port **8101**), Android project that builds a signed AAB, local git repo.

- [ ] **Step 1: Folder + local git + package.json**

```bash
mkdir -p games-for-release/peel-it-mobile/{www/js,www/css,www/lib,tests,scripts,tmp}
cd games-for-release/peel-it-mobile && git init
```

`.gitignore` (local repo): `node_modules/`, `android/app/build/`, `android/.gradle/`, `tmp/`, `*.log`.

`package.json` — copy ZAP TAP's, with: name `peel-it-mobile`, description "Peel It! - zen ASMR film peeling game", deps **without** `firebase`, `@capacitor/filesystem`, `@capacitor/share`, `@capacitor/ios`; `serve` script → port `8101`. Keep `@capacitor-community/admob@^6.0.0`, `@capacitor/android@^6.2.0`, `@capacitor/core@^6.2.0`, `@capacitor/haptics@^6.0.2`, `@capacitor/splash-screen@^6.0.2`, `@capacitor/status-bar@^6.0.2`; devDeps `@capacitor/cli@^6.2.0`, `http-server`, `typescript`.

- [ ] **Step 2: `npm install`** — expect clean install, no firebase in tree.

- [ ] **Step 3: capacitor.config.ts**

Same shape as ZAP TAP's but: `appId: 'com.represen.peelit'`, `appName: 'Peel It!'`, SplashScreen backgroundColor `'#101418'`, StatusBar backgroundColor `'#101418'`, AdMob plugin block:

```ts
AdMob: {
  androidAppId: 'ca-app-pub-3940256099942544~3347511713', // Google TEST app ID — swap at release
  iosAppId: 'ca-app-pub-3940256099942544~1458002511',
  initializeForTesting: true
}
```

- [ ] **Step 4: Vendor Phaser** — download `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js` to `www/lib/phaser.min.js` (≈1.1 MB). Verify first line contains `Phaser v3.60`.

- [ ] **Step 5: index.html + style.css + JS stubs**

`index.html`: viewport meta identical to ZAP TAP (user-scalable=no, viewport-fit=cover), title `Peel It!`, `<div id="game-container">`, landscape-warning div, then scripts in this exact order: `lib/phaser.min.js`, `js/config.js`, `js/catalog.js`, `js/save.js`, `js/peel-model.js`, `js/sfx.js`, `js/haptics.js`, `js/effects.js`, `js/ads.js`, `js/game.js`, `js/ui.js`, `js/main.js` (LAST). **No Firebase, no gtag.**

`style.css`: body margin 0, background `#101418`, `#game-container` 100dvh flex-center, landscape-warning hidden by default + `@media (orientation: landscape)` show (copy pattern from ZAP TAP css).

Each `www/js/*.js` stub: a one-line comment header so `node --check` passes.

- [ ] **Step 6: `npx cap add android`** — generates `android/`. Then:
  - Copy keystore: `cp ../sequence-lock-mobile/android/sequence-lock-release.keystore android/peel-it-release.keystore` (same key material, alias `sequence-lock` — spec §7 says reuse).
  - Port the `signingConfigs`/`buildTypes.release` block from `../sequence-lock-mobile/android/app/build.gradle` into `android/app/build.gradle`, changing only the storeFile name to `../peel-it-release.keystore` (keep alias + `SL_STORE_PASSWORD`/`SL_KEY_PASSWORD` env-override pattern).
  - Set `versionCode 1`, `versionName "1.0.0"`.
  - Add AdMob meta-data to `android/app/src/main/AndroidManifest.xml` inside `<application>`:
    ```xml
    <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID"
               android:value="ca-app-pub-3940256099942544~3347511713"/>
    ```

- [ ] **Step 7: Verify shell**

```bash
npx cap sync android            # expect: web assets copied, 4 plugins listed
node --check www/js/main.js     # all stubs pass
```

- [ ] **Step 8: RELEASE_STATUS.md (initial)** — sections: App Identity (package/name/version/keystore/AdMob-TEST note), Status (IN DEVELOPMENT), Release gates (org account D-U-N-S pending; AdMob real app creation = manual normal-Chrome step), Progress Log table. Follow ZAP TAP's doc structure.

- [ ] **Step 9: Commit (local repo)** — `git add -A && git commit -m "chore: scaffold Peel It! Capacitor project"`

---

### Task 2: CONFIG + SaveManager (economy & persistence) — TDD

**Files:**
- Create: `www/js/config.js`, `www/js/save.js`
- Test: `tests/economy.test.js`, `tests/save.test.js`

**Interfaces:**
- Produces:
  - `CONFIG.PEEL = { safeSpeed:900, tearSpeed:2600, maxSpeed:3200, stressRate:4.0, stressDecay:1.6, warnAt:0.55, grabRadius:90 }`
  - `CONFIG.ECONOMY = { perfectMult:3, replayMult:0.5, dailyMult:2 }`
  - `CONFIG.ADS = { interstitialEveryObjects:3, interstitialCooldownMs:60000 }`
  - `CONFIG.COLORS = { bg:0x101418, film:0x9fd8ff, filmAlpha:0.38, shine:0xffffff, curlLight:0xf4f9ff, curlShadow:0x7fa8c8, coin:0xffd54a, perfect:0x7dffb2 }`
  - `CONFIG.award(baseCoins, {perfect, replay, daily})` → integer coins: `round(base * (perfect?3:1) * (replay?0.5:1) * (daily?2:1))`
  - `SaveManager.init(storage?)`, `.state` = `{ coins:0, unlocked:['phone'], perfect:{}, dailyDate:'', dailyId:'', adObjectCounter:0, totalPeeledPanels:0 }`, `.addCoins(n)`, `.spend(n)`→bool, `.unlock(id)`, `.isUnlocked(id)`, `.setPerfect(id)`, `.persist()`, `.reset()`. Storage injectable (defaults `window.localStorage`), key `peelit_save_v1`, JSON, corrupted data → fresh state.

- [ ] **Step 1: Write failing tests** — `tests/economy.test.js`: award math (base 40 perfect→120; replay perfect daily → 40*3*0.5*2=120; plain replay 40→20); config sanity (safeSpeed < tearSpeed ≤ maxSpeed). `tests/save.test.js`: fresh state has phone unlocked & 0 coins; addCoins/spend (spend fails when poor, returns false, coins unchanged); unlock idempotent; roundtrip through a stub storage `{getItem,setItem}` map; corrupted JSON → fresh state. Use `node:test` + `assert`, `require('../www/js/config.js')` etc.

- [ ] **Step 2: Run** `node --test tests/` → expect FAIL (undefined exports).

- [ ] **Step 3: Implement `config.js` and `save.js`** exactly per the Produces block (plain global objects + module export guard).

- [ ] **Step 4: Run** `node --test tests/` → all PASS.

- [ ] **Step 5: Commit** — `feat: config + save manager with economy tests`

---

### Task 3: PeelModel (pure peel/stress/tear math) — TDD

**Files:**
- Create: `www/js/peel-model.js`
- Test: `tests/peel-model.test.js`

**Interfaces:**
- Produces:

```js
const PeelModel = {
  create(len, t) { // t = CONFIG.PEEL-shaped tuning
    return { len, front: 0, stress: 0, tears: 0, grabbed: false, done: false, t };
  },
  grab(m)    { if (!m.done) m.grabbed = true; },
  release(m) { m.grabbed = false; },
  // Advance toward targetFront (px along peel axis). dt in SECONDS.
  // Returns { event: null|'tear'|'done', speed }
  update(m, targetFront, dt) {
    if (m.done || !m.grabbed || dt <= 0) return { event: null, speed: 0 };
    const want = Math.max(m.front, Math.min(targetFront, m.len));
    const maxAdv = m.t.maxSpeed * dt;
    const next = Math.min(want, m.front + maxAdv);       // physical speed cap
    const speed = (next - m.front) / dt;
    m.front = next;
    if (speed > m.t.safeSpeed) {
      const over = Math.min((speed - m.t.safeSpeed) / (m.t.tearSpeed - m.t.safeSpeed), 3);
      m.stress += over * m.t.stressRate * dt;
    } else {
      m.stress = Math.max(0, m.stress - m.t.stressDecay * dt);
    }
    if (m.front >= m.len) { m.done = true; m.grabbed = false; m.stress = 0; return { event: 'done', speed }; }
    if (m.stress >= 1)    { m.stress = 0; m.tears++; m.grabbed = false; return { event: 'tear', speed }; }
    return { event: null, speed };
  }
};
```

- [ ] **Step 1: Write failing tests** (`tests/peel-model.test.js`, tuning = Task 2's `CONFIG.PEEL`, len 2000, dt 0.016):
  - slow peel (target = front+8 each tick ≈500 px/s) → after 120 ticks: `tears===0`, `stress===0`, front ≈960.
  - flick (target = len every tick) → loop until event ≠ null: event is `'tear'` (not `'done'`), `tears===1`, `grabbed===false`, `front < len`, `stress===0`.
  - front is monotonic: feeding target 0 after front>0 never decreases front.
  - completion: len 300, slow ticks → eventually `'done'`, `done===true`; further updates return `{event:null}` even after re-grab attempt (`grab` on done model leaves `grabbed=false`).
  - no update while released: `update` without `grab` → speed 0, front 0.
  - stress decays: push stress to ~0.5 with fast ticks, then slow ticks → stress reaches 0 within 1 s.

- [ ] **Step 2: Run → FAIL.**  **Step 3: Implement** (code above verbatim).  **Step 4: Run → PASS.**

- [ ] **Step 5: Commit** — `feat: PeelModel with stress/tear tension math`

---

### Task 4: Catalog — 24 objects with SVG art + panels — TDD (schema)

**Files:**
- Create: `www/js/catalog.js`
- Test: `tests/catalog.test.js`

**Interfaces:**
- Produces: `CATALOG` = ordered array of:

```js
{
  id: 'phone',            // unique slug
  name: 'Smartphone',     // display (English)
  unlockCost: 0,          // coins; first object 0
  baseCoins: 15,          // TOTAL per full peel, split evenly across panels
  w: 360, h: 640,         // body sprite size at design scale
  panels: [ { x: 30, y: 40, w: 300, h: 560 } ],  // film rects, LOCAL coords, peel dir = DOWN
  svg: '<svg …>…</svg>'   // clean body art, viewBox = `0 0 w h`
}
```

- Object order & numbers (unlockCost / baseCoins / panels#):
  1 phone 0/15/1 · 2 tablet 60/22/1 · 3 laptop 130/36/2 · 4 monitor 220/52/2 · 5 tv 340/70/2 · 6 microwave 500/95/2 · 7 fridge 700/125/3 · 8 washing-machine 950/160/3 · 9 vending-machine 1250/200/3 · 10 piano 1600/250/4 · 11 sofa 2000/310/4 · 12 phone-booth 2500/380/4 · 13 car 3100/460/5 · 14 food-truck 3800/560/5 · 15 bus 4600/680/6 · 16 subway-car 5500/810/6 · 17 yacht 6600/960/6 · 18 airplane 7900/1150/7 · 19 dinosaur-statue 9400/1350/7 · 20 gold-bar 11000/1600/2 · 21 moai 13000/1900/4 · 22 rocket 15000/2250/6 · 23 eiffel-tower 17500/2650/8 · 24 the-moon 20000/3100/8
- SVG style guide: flat 2-3 tone shapes + 1 highlight, dark outline `#1b2430` @ 6px, palette per object, no text, no gradients over 2 stops. Author each by hand following the phone example; keep each SVG ≤ 40 lines.

- [ ] **Step 1: Write failing schema tests** (`tests/catalog.test.js`): 24 entries; ids unique; costs strictly increasing with `CATALOG[0].unlockCost===0`; every panel rect inside `0..w × 0..h`; panel count matches the table above; every `svg` string starts with `<svg` and contains `viewBox="0 0 ${w} ${h}"`; `baseCoins/panels.length ≥ 3`.

- [ ] **Step 2: Run → FAIL.**  **Step 3: Implement** — write all 24 entries with hand-drawn SVGs (phone example below; keep the same quality bar for the rest):

```js
svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640">
  <rect x="14" y="10" width="332" height="620" rx="48" fill="#232b3a" stroke="#1b2430" stroke-width="6"/>
  <rect x="30" y="40" width="300" height="560" rx="18" fill="#2f89ff"/>
  <rect x="30" y="40" width="300" height="560" rx="18" fill="url(#none)" opacity="0"/>
  <circle cx="180" cy="615" r="9" fill="#141a26"/>
  <rect x="140" y="20" width="80" height="8" rx="4" fill="#141a26"/>
  <rect x="52" y="70" width="90" height="200" rx="12" fill="#66b0ff" opacity=".55"/>
</svg>`
```

- [ ] **Step 4: Run → PASS.**  **Step 5: Commit** — `feat: 24-object catalog with SVG art`

---

### Task 5: BootScene + GameScene core peel (render, curl, input)

**Files:**
- Create: `www/js/main.js`, `www/js/game.js` (core; awards flow lands in Task 6)

**Interfaces:**
- Consumes: `CONFIG`, `CATALOG`, `PeelModel`, `SaveManager`.
- Produces:
  - `BootScene`: registers every catalog SVG as texture `obj-{id}` via `addBase64` (once, with `btoa(unescape(encodeURIComponent(svg)))`), generates procedural textures: `film-tex` (256×256: translucent `CONFIG.COLORS.film` fill + 3 diagonal white shine streaks alpha .18 + sparse noise dots), `curl-tex` (256×48 horizontal roll: 5 stacked gradient bands light→shadow), `jagged-tex` (256×12 zigzag strip), `scrap-tex` (96×72 crumpled polygon), `spark-tex`, `coin-tex`, `confetti-tex` (8×14 rect). All via `Graphics.generateTexture`. On complete → `scene.start('MenuScene')`.
  - `PeelItGame.start(objectId, {replay})` global helper → starts `GameScene` with data.
  - `GameScene` (`create(data)`): draws body sprite centered (scaled to fit 84% width / 70% height), then for each panel (design coords mapped through the same scale): film sprite = `film-tex` stretched to panel size with `setCrop` used to hide the peeled part, curl sprite at the peel front, lifted-tab bounce tween on the active panel. One `PeelModel` per panel, panels peeled sequentially (`this.activePanel` index).
  - Input: `pointerdown` within `CONFIG.PEEL.grabRadius` (screen px, scale-adjusted) of the curl center → `PeelModel.grab`; `pointermove` → `targetFront = (pointer.y - panelTopScreenY) / scale`; `pointerup` → release. `update(time, delta)` calls `PeelModel.update(m, targetFront, delta/1000)` and then syncs visuals: `film.setCrop(0, front, panel.w, panel.h - front)` (crop in texture-frame coords), curl `y = panelTopScreenY + front*scale`, curl tint lerps `curlLight→white` and scaleY `1→1.25` as `stress` rises past `warnAt`.
  - Resize handler registered (scale refit), pause-safe (no timers needed for core peel).

- [ ] **Step 1: Implement BootScene texture generation + Phaser config** (`main.js`): `new Phaser.Game({ type: AUTO, parent:'game-container', width:720, height:1280, scale:{mode:FIT, autoCenter:CENTER_BOTH}, backgroundColor:CONFIG.COLORS.bg, scene:[BootScene, MenuScene, ShowroomScene, GameScene] })`. MenuScene/ShowroomScene are stubs in `ui.js` until Task 9 — create placeholder classes there now (title text + "TAP TO PEEL" → `PeelItGame.start('phone')`).

- [ ] **Step 2: Implement GameScene per Produces block.** Peel-front visual order (depth): body(0) → sheen(1, Task 6) → film(2) → jagged(3) → curl(4) → HUD(10).

- [ ] **Step 3: Syntax + smoke check** — `node --check` on `main.js`, `game.js`, `ui.js`; `npm run serve` and report "browser check ready at http://localhost:8101 — grab the tab, peel slowly = smooth follow; flick = (tear lands next task)". Do NOT auto-open a browser.

- [ ] **Step 4: Commit** — `feat: boot textures + core peel scene (crop render, curl, input)`

---

### Task 6: Tear, PERFECT, coins, completion flow

**Files:**
- Modify: `www/js/game.js`

**Interfaces:**
- Consumes: `Sfx`/`Haptic`/`Effects` (Task 7-8) — call through a null-safe facade `Feel = { peelSpeed(v){}, tear(){}, perfect(){}, coin(){}, done(){} }` defined at top of `game.js`, implemented as no-ops now, wired in Task 7-8.
- Produces:
  - On `'tear'` event: spawn 1-2 `scrap-tex` sprites at curl position with random velocity (vx ±160, vy -420..-260, angular ±540°/s, gravity 1400, fade+destroy 900 ms — plain tween/arcade-free manual update is fine), overlay `jagged-tex` strip at the new front line, curl flash white, small camera shake (2, 80 ms), re-show lifted-tab hint after 400 ms.
  - Panel done: `perfect = (model.tears === 0)`; coins = `CONFIG.award(base=obj.baseCoins/panels.length, {perfect, replay, daily})`; sparkle band sweeps the revealed panel; `SaveManager.addCoins`; floating `+N` text (gold, `perfect` also shows "PERFECT!" in `CONFIG.COLORS.perfect` with pop tween).
  - Object done (all panels): if every panel had 0 tears AND not yet → `SaveManager.setPerfect(id)`; completion panel (dark overlay): object name, total coins, buttons `NEXT OBJECT` (or `UNLOCK NEXT — {cost}🪙` if next is locked and affordable) / `2× COINS (AD)` rewarded hook (calls `AdsManager.showRewarded('double_coins')`, on success adds the same amount again) / `SHOWROOM`. `SaveManager.state.adObjectCounter++` then `AdsManager.onObjectComplete()` (Task 8 defines behavior; call is placed now via the null-safe `window.AdsManager?.onObjectComplete?.()` guard).
  - `daily` flag: `data.objectId === SaveManager.state.dailyId`.

- [ ] **Step 1: Implement all of the above.**
- [ ] **Step 2: Extend `tests/economy.test.js`** with the exact panel-award numbers used by GameScene for `laptop` (baseCoins 36, 2 panels → base 18/panel; perfect panel = 54). Run `node --test` → PASS.
- [ ] **Step 3: `node --check www/js/game.js`** → PASS. Report browser-check readiness.
- [ ] **Step 4: Commit** — `feat: tear scraps, PERFECT awards, completion flow`

---

### Task 7: Sfx (Web Audio synth) + Haptics

**Files:**
- Create: `www/js/sfx.js`, `www/js/haptics.js`
- Modify: `www/js/game.js` (wire `Feel` facade)

**Interfaces:**
- Produces:
  - `Sfx.unlockAudio()` (call on first pointerdown; creates/resumes `AudioContext`).
  - `Sfx.peelStart()` / `Sfx.peelSpeed(v01)` / `Sfx.peelStop()` — crackle loop: looped 2 s white-noise buffer → bandpass (freq 1200 + 2600·v01 Hz, Q 1.2) → gain (0 → 0.02+0.16·v01, 60 ms ramps); plus adhesive "ticks": every frame while peeling, probability `0.02+0.3·v01` → 8 ms noise burst through highpass 2.5 kHz, gain 0.12.
  - `Sfx.rip()` — 180 ms noise burst, bandpass sweep 3.2 kHz→600 Hz, gain 0.5→0.
  - `Sfx.perfect()` — sine arpeggio E5-G5-B5-E6, 70 ms apart, triangle osc, 0.18 gain, 300 ms release. `Sfx.coin()` — square blip 1320→1760 Hz 80 ms. `Sfx.unlockJingle()` — perfect() + low sine root.
  - `Haptic.tick(v01)` — native only: `Haptics.impact({style:'LIGHT'})` throttled to `max(40, 140-120·v01)` ms min-interval; `Haptic.heavy()` — `impact({style:'HEAVY'})`; `Haptic.isNative` via `window.Capacitor?.isNativePlatform?.()`. All calls wrapped in try/catch, no-ops in browser.
  - `Feel` facade in `game.js` now maps: peelSpeed→`Sfx.peelSpeed`+`Haptic.tick`, tear→`Sfx.rip`+`Haptic.heavy`, perfect→`Sfx.perfect`, coin→`Sfx.coin`, done→`Sfx.peelStop`.  `v01 = clamp(speed / CONFIG.PEEL.tearSpeed, 0, 1)`.

- [ ] **Step 1: Implement both files + wiring.**
- [ ] **Step 2: Verify** — `node --check` all three files; confirm `Sfx` creates no AudioContext at load time (grep: `new AudioContext` only inside `unlockAudio`). Report browser-check readiness ("peel slow vs fast — pitch/density must follow finger speed").
- [ ] **Step 3: Commit** — `feat: synthesized peel ASMR audio + native haptics`

---

### Task 8: Effects (juice) + Ads port

**Files:**
- Create: `www/js/effects.js`
- Create: `www/js/ads.js` (port from `../sequence-lock-mobile/www/js/ads.js`)
- Modify: `www/js/game.js`, `www/js/ui.js` (banner calls)

**Interfaces:**
- Produces:
  - `Effects.confetti(scene, x, y)` — 40 `confetti-tex` particles, explode+gravity, 1.2 s.
  - `Effects.sparkle(scene, rect)` — white sheen band tween across rect + 12 `spark-tex` twinkles.
  - `Effects.coinFly(scene, from, to, n, onEach)` — n coin sprites staggered 40 ms, quad-ease to HUD counter, `Sfx.coin()` per arrival via onEach.
  - `AdsManager` port, changes ONLY: remove Firebase/analytics/continue logic; `AD_IDS` → Google TEST units (banner `ca-app-pub-3940256099942544/6300978111`, interstitial `/1033173712`, rewarded `/5224354917`); `USE_TEST_ADS: true`; replace stage-based policy with `onObjectComplete()` → show interstitial when `SaveManager.state.adObjectCounter % CONFIG.ADS.interstitialEveryObjects === 0 && now - lastInterstitialTime > CONFIG.ADS.interstitialCooldownMs`; `showRewarded(tag)` kept as-is (promise<boolean>); banner shown ONLY in MenuScene/ShowroomScene (`AdsManager.showBanner()` on scene create, `hideBanner()` on scene shutdown — **never** in GameScene).

- [ ] **Step 1: Implement effects.js; wire into game.js** (confetti on PERFECT, sparkle on panel done, coinFly on award).
- [ ] **Step 2: Port ads.js per the diff list.** `node --check` both.
- [ ] **Step 3: Grep-verify policy** — `grep -n "showBanner" www/js/*.js` → hits only in `ui.js`; `grep -n "USE_TEST_ADS" www/js/ads.js` → `true`.
- [ ] **Step 4: Commit** — `feat: juice effects + AdMob port with zen-safe placements`

---

### Task 9: Menu, Showroom, HUD, unlock & daily

**Files:**
- Modify: `www/js/ui.js` (replace Task 5 stubs)

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `MenuScene`: logo text "PEEL IT!", bouncing film-tab, coin balance, buttons: `PEEL` (→ current = first locked-1 … i.e. last unlocked object, or daily if unclaimed), `SHOWROOM`, sound on/off toggle (persist `muted` in save; `Sfx.setMuted(b)` — add this tiny setter to sfx.js). Banner ON.
  - `ShowroomScene`: vertical-scroll shelf grid (2 columns) of all 24 objects: unlocked = full-color body sprite (tap → replay via `PeelItGame.start(id, {replay:true})`), gold-badge overlay if `perfect[id]`; locked = dark silhouette (tint 0x0a0e14) + `{cost}🪙` + `UNLOCK` button (enabled when affordable, `SaveManager.spend`) + `AD` early-unlock button on ONLY the next locked object (rewarded → `unlock(id)` free). Daily object gets a pulsing `2×` ribbon. Back button. Banner ON. Camera drag-scroll with clamp.
  - Daily selection (in `main.js` boot, after SaveManager.init): `const today = new Date().toISOString().slice(0,10);` if `state.dailyDate !== today` → `dailyDate = today; dailyId = unlocked[dateHash(today) % unlocked.length]` where `dateHash` = sum of char codes; persist.
  - HUD (GameScene, depth 10): coin counter top-right (init **from `SaveManager.state.coins`**, never literal), object name top-left, panel dots (○/●/⭐ = pending/done/perfect), back button (top-left corner, → MenuScene, `Sfx.peelStop()` on exit).

- [ ] **Step 1: Implement all scenes/HUD.**
- [ ] **Step 2: Add `tests/daily.test.js`** — extract `dateHash` into `config.js` (`CONFIG.dateHash(str)`): deterministic, different for '2026-07-02' vs '2026-07-03'. Run `node --test` → PASS.
- [ ] **Step 3: `node --check www/js/ui.js`**; grep no `setDepth` on interactive text above buttons without both interactive (bug rule #4). Report browser-check readiness (menu → peel → showroom → unlock loop).
- [ ] **Step 4: Commit** — `feat: menu, showroom shelf, unlock/daily, HUD`

---

### Task 10: Launcher icons + full test pass + web build check

**Files:**
- Create: `scripts/gen_icons.py`
- Modify: `android/app/src/main/res/mipmap-*` PNGs

**Interfaces:**
- Produces: peel-themed launcher icon on device + 512 px store icon at `tmp/store-icon-512.png`.

- [ ] **Step 1: Write `scripts/gen_icons.py` (Pillow)** — draws: rounded dark-navy squircle bg `#101418`; centered light-blue film sheet `#9fd8ff` with bottom-right corner peeled back (white curl triangle with `#7fa8c8` shadow) revealing a mint sparkle `#7dffb2`. Outputs: legacy `ic_launcher.png` + `ic_launcher_round.png` at 48/72/96/144/192 into `mipmap-{m,h,xh,xxh,xxxh}dpi/`, adaptive `ic_launcher_foreground.png` at 108/162/216/324/432 (66% safe zone), solid bg PNG, and `tmp/store-icon-512.png`. Do NOT touch splash resources.
- [ ] **Step 2: Run it** — `python scripts/gen_icons.py` → lists every file written; verify with `ls android/app/src/main/res/mipmap-xxxhdpi/`.
- [ ] **Step 3: Full test pass** — `node --test tests/` all green; `node --check` every `www/js/*.js`.
- [ ] **Step 4: Commit** — `feat: launcher icons + green test suite`

---

### Task 11: Android AAB build + verification

**Files:**
- Modify: none (build outputs only)

- [ ] **Step 1: Sync** — `npx cap sync android` → confirm `android/app/src/main/assets/public/js/main.js` exists and `grep -c "PeelModel" android/app/src/main/assets/public/js/peel-model.js` ≥ 1 (synced copy is what ships).
- [ ] **Step 2: Build (PowerShell)**

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"; & "android\gradlew.bat" -p android bundleRelease
```

Expected: `BUILD SUCCESSFUL`, output `android/app/build/outputs/bundle/release/app-release.aab` (~5-7 MB).

- [ ] **Step 3: Verify AAB** — `grep -a "com.represen.peelit" app-release.aab` hits; `grep -a "1.0.0"` hits; keystore signature present (`jarsigner -verify` or gradle's signing report). Also build `assembleDebug` APK for the user's device test and report its path.
- [ ] **Step 4: Commit (local)** — `chore: first signed AAB build v1 (1.0.0)`

---

### Task 12: Status docs + main-repo registration + release checklist

**Files:**
- Modify: `games-for-release/peel-it-mobile/RELEASE_STATUS.md`
- Modify: `D:\source\ai-game-studio\CLAUDE.md` (status-doc table — tracked, main repo)

- [ ] **Step 1: Update RELEASE_STATUS.md** — status "BUILD READY — waiting on org account"; document: AdMob TODO (create app "Peel It!" + 3 units under `pub-7114194646987493` in a NORMAL Chrome — console dead under CDP; then swap IDs in `ads.js`, `capacitor.config.ts`, `AndroidManifest.xml`, set `USE_TEST_ADS:false`, rebuild, verify new ID in AAB); org-account gate (D-U-N-S → Play org signup → app listing `com.represen.peelit`); explicit "publishing is user-gated" rule; Progress Log rows for every task.
- [ ] **Step 2: Add CLAUDE.md status-doc table row** — effort "Peel It! — zen ASMR peel game (org-account release)", doc path, one-line note. Commit to MAIN repo: `git add CLAUDE.md && git commit -m "Register Peel It! status doc in status-doc table"`.
- [ ] **Step 3: Final report to user (Korean)** — what's built, test results, AAB path, debug APK path for device feel-testing, and the two human gates left (AdMob app creation, org account).

---

## Self-Review Notes (done at write time)

- Spec coverage: §2 core loop → Tasks 3/5/6 · §3 content 24+ objects → Task 4 · §4 meta (coins/showroom/daily/badges) → Tasks 2/9 · §5 sound/haptics → Task 7 · §6 ads placements/test-ids → Task 8 · §7 stack/no-Firebase/status-doc → Tasks 1/12 · §8 release path → Tasks 11/12 · §9 exclusions respected (no film types, no leaderboard, no iOS, no idle) · §10 success criteria → Tasks 10/11 verifications + user device test.
- Type consistency: `PeelModel.update(m, targetFront, dtSeconds)` used identically in Tasks 3/5; `CONFIG.award` signature identical in Tasks 2/6; `adObjectCounter` name identical in Tasks 2/6/8.
- Known deviation from skill defaults: no TDD for Phaser scene code (not node-testable without heavy mocking) — covered by `node --check`, schema/economy tests, and user device testing; frequent commits satisfied via the project-local git repo because the folder is gitignored by the parent.
