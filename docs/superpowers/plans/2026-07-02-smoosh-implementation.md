# SMOOSH! Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "SMOOSH!" — an infinite-stage jelly tap-slaughter game with tap-RPG-lite upgrades (Phaser 3 + Capacitor Android), release-ready pending the org Play account, per spec `docs/superpowers/specs/2026-07-02-smoosh-design.md`.

**Architecture:** Clone the proven Peel It! project shape (`games-for-release/peel-it-mobile/` is the live template): static `www/` plain-JS globals + Phaser 3.60 vendored + Capacitor 6. New pure-logic core: `balance.js` (curves + greedy-buy simulation invariant), `spawner.js` (species mix), driven by `GameScene` with pooled monsters/particles.

**Tech Stack:** Phaser 3.60 (vendored copy from peel-it-mobile), Capacitor 6 (admob/haptics/splash/status-bar), Web Audio synth, node:test, Pillow icons, Gradle/JDK21.

## Global Constraints

- English-only code/comments/docs; game UI copy in English.
- Folder `games-for-release/smoosh-mobile/` — gitignored by parent; **own local git repo**; commits go there. Main repo gets only CLAUDE.md row + this plan/spec.
- Package `com.represen.smoosh`, app name `SMOOSH!`, versionCode 1 / versionName 1.0.0, portrait locked.
- AdMob **Google TEST IDs** + `USE_TEST_ADS: true` during build; real app created via Claude-in-Chrome at the end (Task 12), then IDs swapped + rebuild. NEVER touch Play Console.
- No Firebase; saves in `localStorage` key `smoosh_save_v1`.
- `main.js` LAST in `index.html`. All studio Phaser bug rules apply (textures registered once in BootScene, HUD init from state, no timeScale=0+delayedCall, pooled objects, resize refresh).
- **Balance invariant (spec §3):** greedy-cheapest-upgrade simulated player stays in the **1–5 expected-taps-per-mob band for stages 5..200**; constants may be tuned, the test owns the truth.
- Design resolution 720×1280; play field rect x∈[20,700], y∈[210,990]; upgrade bar y∈[1010,1180]; fever gauge strip y≈[1000,1010]+button.
- 60 fps with ≤24 active monsters → object pooling for monsters, damage texts (cap 20), gold pops, goo decals (cap 40), particles.

## File Map (www/js load order = this order, main.js last)

| File | Responsibility |
|---|---|
| `config.js` | `CONFIG`: colors, layout rects, upgrade defs, curves' constants, fever/ads policy |
| `balance.js` | Pure math: `mobHP(stage)`, `waveSize(stage)`, `goldPerMob(stage)`, upgrade cost/effect, expected-taps, greedy sim |
| `catalog.js` | `SPECIES`: 14 jelly defs (stats + idle/squash SVG art) |
| `spawner.js` | Pure: `composeWave(stage, rng)` → array of `{speciesId, hpMult, ...}` incl. specials gating & boss stages |
| `save.js` | `SaveManager` (port of peel-it save.js, SMOOSH state shape) |
| `sfx.js` | `Sfx` synth: squish/pop family, coin, crit, fever riser, boss boom (reuse peel-it architecture) |
| `haptics.js` | copy of peel-it haptics.js verbatim |
| `effects.js` | `Effects`: burst particles, goo decal pool, gold pop, damage text pool, confetti |
| `ads.js` | port of peel-it ads.js; `onStageClear()` policy: every 5th stage + 60 s cooldown |
| `monsters.js` | `Monster` pooled class: movement patterns, squash/burst visuals, special behaviors (split/shield/jackpot/boss) |
| `game.js` | `GameScene`: wave lifecycle, input/tap resolution (crit/splash), fever, combo, boss, settlement |
| `ui.js` | `MenuScene`, HUD (stage/gold/fever), upgrade bar (5 buttons), settlement panel |
| `main.js` | `BootScene` (textures), Phaser init, `SmooshGame` helper — LAST |

`tests/`: `balance.test.js`, `spawner.test.js`, `catalog.test.js`, `save.test.js`, `economy.test.js`.

---

### Task 1: Scaffold from the Peel It! template

**Files:** Create `games-for-release/smoosh-mobile/` (whole shell)

- [ ] Copy template pieces from `games-for-release/peel-it-mobile/`: `package.json` (rename `smoosh-mobile`, desc "SMOOSH! - infinite jelly tap-slaughter", serve port **8102**), `.gitignore`, `www/lib/phaser.min.js` (byte copy), `www/css/style.css` (bg `#141020`), `tests/` empty, `tmp/`, `scripts/`.
- [ ] `git init -b main`; `npm install`.
- [ ] `capacitor.config.ts`: appId `com.represen.smoosh`, appName `SMOOSH!`, Splash/StatusBar bg `#141020`, AdMob block with TEST app id `ca-app-pub-3940256099942544~3347511713`, `initializeForTesting: true`.
- [ ] `www/index.html`: Peel It!'s shell with title `SMOOSH!`, favicon = simple jelly blob SVG, scripts in File-Map order (`main.js` LAST). JS stubs (one-line comment) for all 13 files.
- [ ] `npx cap add android`; copy keystore `peel-it-mobile/android/peel-it-release.keystore` → `android/smoosh-release.keystore`; port signingConfigs block (storeFile `../smoosh-release.keystore`, alias `sequence-lock`, same env-override pattern); versionCode 1 / versionName "1.0.0"; copy `android/local.properties` from peel-it; AndroidManifest: AdMob TEST meta-data + `android:screenOrientation="portrait"`.
- [ ] Verify: `npx cap sync android` (4 plugins), `node --check` all stubs.
- [ ] `RELEASE_STATUS.md` (Peel It! structure: identity table incl. keystore/AdMob-TEST note, STATUS: IN DEVELOPMENT, gates = org account + AdMob app, build commands, progress log).
- [ ] Commit: `chore: scaffold SMOOSH! Capacitor project from Peel It! template`

### Task 2: CONFIG + SaveManager — TDD

**Files:** `www/js/config.js`, `www/js/save.js`; tests `tests/save.test.js`, `tests/economy.test.js`

**Interfaces (Produces):**
```js
CONFIG = {
  WIDTH: 720, HEIGHT: 1280,
  FIELD: { x: 20, y: 210, w: 680, h: 780 },
  COLORS: { bg:0x141020, hud:0xe8e6f5, gold:0xffd54a, fever:0xff5ec4, crit:0xfff06a, dim:0x5a5570 },
  UPGRADES: [   // order = UI order; ids referenced everywhere
    { id:'tap',    name:'Tap Power',  baseCost:10, costGrowth:1.18, icon:'💪' },
    { id:'crit',   name:'Critical',   baseCost:25, costGrowth:1.22, icon:'⚡', maxLevel:22 }, // 3%+1.5%/lvl → cap 36%? clamp 35
    { id:'splash', name:'Splash',     baseCost:40, costGrowth:1.30, icon:'💥', maxLevel:10 },
    { id:'fever',  name:'Fever Charge', baseCost:30, costGrowth:1.25, icon:'🔥' },
    { id:'gold',   name:'Gold Boost', baseCost:30, costGrowth:1.25, icon:'💰' }
  ],
  FEVER: { gaugeMax:30, durationMs:6000, damageMult:10, splashRadius:140, adRefillBelow:0.5 },
  ADS:   { interstitialEveryStages:5, interstitialCooldownMs:60000 },
  COMBO: { windowMs:1200, milestones:[10,25,50] },
  BOSS:  { every:10, hpMult:25, goldMult:15, slowMoMs:300 },
  dateHash(str)  // same as peel-it
}
SaveManager // peel-it port; state = { gold:0, stage:1, upgrades:{tap:0,crit:0,splash:0,fever:0,gold:0},
             //   feverGauge:0, muted:false, adStageCounter:0, totalKills:0, bestStage:1 }
             // API: init(storage?), persist(), addGold(n), spendGold(n)→bool, state
```
- [ ] Tests first (`save.test.js`: fresh state shape, addGold/spendGold, roundtrip, corrupt→fresh — mirror peel-it save tests; `economy.test.js`: UPGRADES array shape/ids unique/growths>1, FEVER/ADS/BOSS values as above). Run → FAIL.
- [ ] Implement both (save.js = peel-it port with new `_freshState`). Run → PASS. Commit `feat: config + save`.

### Task 3: balance.js — curves + THE invariant — TDD

**Files:** `www/js/balance.js`; test `tests/balance.test.js`

**Interfaces (Produces):**
```js
const Balance = {
  mobHP(stage)        { return Math.round(3 * Math.pow(1.14, stage)); },
  waveSize(stage)     { return Math.min(6 + Math.floor(stage * 0.8), 24); },
  goldPerMob(stage)   { return Math.max(1, Math.round(1.6 * Math.pow(1.135, stage))); },
  upgradeCost(id, level)   // baseCost * costGrowth^level, rounded
  tapDamage(level)    { return Math.pow(1.35, level); },            // level 0 → 1
  critChance(level)   { return Math.min(0.03 + 0.015 * level, 0.35); },
  splashRadius(level) { return 22 * level; },                        // px, level ≤ 10
  feverMult(level)    { return 1 + 0.12 * level; },
  goldMult(level)     { return 1 + 0.10 * level; },
  expectedDamage(up)  { return this.tapDamage(up.tap) * (1 + this.critChance(up.crit) * 4); },
  expectedTaps(stage, up) { return Math.ceil(this.mobHP(stage) / this.expectedDamage(up)); },
  // Greedy sim: play stages 1..n; per stage earn waveSize*goldPerMob*goldMult,
  // then repeatedly buy the cheapest affordable upgrade. Returns per-stage taps array.
  simulate(n)
};
```
- [ ] Failing tests: monotonic curves; waveSize caps at 24; `simulate(200)` → for stages 5..200 `1 <= taps <= 5`; also assert taps ≥ 2 for at least 30% of stages 20..200 (not trivially one-tap forever).
- [ ] Implement; if the band breaks, tune ONLY constants in balance.js (document final values in code comments) until green. Run → PASS. Commit `feat: balance curves + 200-stage invariant sim`.

### Task 4: Species catalog (14 jellies, idle+squash SVG) — TDD schema

**Files:** `www/js/catalog.js`; test `tests/catalog.test.js`

**Interfaces (Produces):** `SPECIES` array of:
```js
{ id:'blob', kind:'mob'|'splitter'|'shield'|'jackpot'|'boss',
  radius: 46,            // design px collision/visual radius (mobs 26..64, boss 240)
  hpMult: 1.0,           // × Balance.mobHP(stage); boss uses CONFIG.BOSS.hpMult
  speed: 70,             // px/s
  move: 'amble'|'zigzag'|'dash'|'flee'|'sleeper',
  goldMult: 1.0,
  svgIdle: '<svg …>', svgSquash: '<svg …>'   // viewBox 0 0 (2r) (2r), flat jelly + face
}
```
- 10 mobs: blob(1.0 amble), mini(0.5 zigzag fast), tank(4.0 slow amble big), zippy(0.8 dash), scaredy(1.0 flee), pudding(2.0 amble), drop(0.7 zigzag), blinky(1.2 sleeper), twins(0.9 amble), grumpy(1.6 dash slow-burst).
- Specials: splitter(kind splitter, children = mini at 0.5×hp), shieldy(kind shield), goldie(kind jackpot, speed 240 flee, despawnMs 6000), king(kind boss, radius 240).
- [ ] Failing tests: 14 entries, ids unique, exactly one boss/jackpot/shield/splitter, mobs=10; radius bounds (mob ≤ 70, boss ≥ 200); both SVGs start `<svg` with matching viewBox; speeds > 0; move ∈ allowed set.
- [ ] Implement with hand-drawn flat jelly art (2-tone body + shine + simple face; squash variant = flattened wider + ×_× eyes). Run → PASS. Commit `feat: 14-species jelly catalog`.

### Task 5: Spawner (wave composition) — TDD

**Files:** `www/js/spawner.js`; test `tests/spawner.test.js`

**Interfaces (Produces):**
```js
// rng: () => [0,1). Returns array of { speciesId } length Balance.waveSize(stage)
// Rules: boss stage (stage % 10 === 0) → exactly [ {speciesId:'king'} ] plus
//   floor(waveSize/3) escort mobs; splitter from stage ≥5 at 8%; shieldy from
//   stage ≥8 at 6%; goldie 2% any stage (max 1 per wave); remainder = random mobs
//   weighted toward smaller species early (stage <10 → no tank/grumpy).
const Spawner = { composeWave(stage, rng) };
```
- [ ] Failing tests (seeded deterministic rng helper): boss wave shape on stage 10/20; no splitter before 5, no shieldy before 8; ≤1 goldie; wave lengths match Balance.waveSize; stage 3 contains no tank/grumpy; with rng always 0.999 → all-plain-mob wave.
- [ ] Implement. Run → PASS. Commit `feat: wave spawner with special gating`.

### Task 6: BootScene + Monster class + GameScene core (spawn, move, tap-kill)

**Files:** `www/js/main.js`, `www/js/monsters.js`, `www/js/game.js` (core), `www/js/ui.js` (stub Menu + `SmooshGame.start()` hookup)

**Interfaces (Produces):**
- `BootScene`: SaveManager.init + `Sfx.setMuted`; register `sp-{id}-idle` / `sp-{id}-squash` textures from SPECIES (addBase64 once, width/height injected like peel-it main.js:46); procedural: `pop-tex`(soft circle), `goo-tex`(splat blob), `coin-tex`, `spark-tex`, `white-tex`, `confetti-tex`; → MenuScene.
- `Monster` (pooled, plain class over a Phaser Image): `spawn(scene, speciesDef, stage, pos)`, `update(dt, pointerPos)` (movement per `move` pattern: amble = random dir change every 0.5–1.5 s; zigzag = forward + sin sideways; dash = 0.4 s burst @3× every 1.6 s; flee = away from pointer within 200 px else amble; sleeper = still until first hit), `hit(dmg)` → `{dead, overkill}` with squash tween (scaleX 1.25/scaleY 0.7, 90 ms yoyo, swap to squash texture during), `burst()` → release to pool. Boss: same class, no wandering past field, HP bar drawn by GameScene.
- `GameScene`: `create()` builds field bounds gfx + HUD hooks (Task 9 fills UI), starts `this.startStage(SaveManager.state.stage)`; `startStage(n)`: wave = `Spawner.composeWave(n, Math.random)` spawned at random field points (bosses centered); `pointerdown` → topmost monster within `radius+24` forgiveness → `this.applyTap(m)`: dmg = `Balance.tapDamage(up.tap)` ×(crit roll ? 5 : 1) ×(fever ? CONFIG.FEVER.damageMult : 1); splash: radius = `Balance.splashRadius(up.splash)` (+`CONFIG.FEVER.splashRadius` in fever) hits all others in circle for same dmg; kills → gold drop `Balance.goldPerMob(n) × species.goldMult × Balance.goldMult(up.gold)`, `SaveManager.addGold`, combo++, fever gauge +1×`Balance.feverMult(up.fever)`; all monsters dead → `this.onStageClear()`.
- `onStageClear()` (core version): banner text pop 900 ms → `SaveManager.state.stage++`, `bestStage=max`, persist → next `startStage`. (Settlement/ads = Task 9/10.)
- [ ] Implement the three files (ui.js = minimal Menu with TAP TO SMOOSH → GameScene, like peel-it Task-5 stub).
- [ ] Verify: `node --check` each; `npm test` still green; report browser-check ready on **:8102** (do NOT auto-open).
- [ ] Commit `feat: boot textures, pooled monsters, core tap-kill loop`.

### Task 7: Specials + boss + fever + combo

**Files:** Modify `www/js/game.js`, `www/js/monsters.js`

- [ ] Splitter death → spawn 2 `mini` at 0.5× current-stage HP at ±30 px (children flagged `noSplit`).
- [ ] Shieldy: immune to non-crit single taps UNLESS 6 hits land within 1.5 s (rolling window on the monster) — crits always damage; visual = shell wobble + "clank" flash on blocked hits.
- [ ] Goldie: 6 s despawn timer (fade-out; does not block clear — stage-clear check counts only non-jackpot alive); death → gold ×10 mobs + coin fountain.
- [ ] Boss stage: HP bar top-center (Graphics, 560×26, drains left); boss death → `this.cameras.main.shake(220, 0.006)` + 300 ms timeScale... **NO timeScale freeze** (bug rule): slow-mo via `this.tweens.timeScale=0.3` + `this.time.delayedCall` replaced by `setTimeout` guard — simplest safe: 300 ms tween-based zoom punch instead of true slow-mo + goo explosion (40 pooled particles) + gold ≈15 mobs.
- [ ] Fever: gauge state in scene (`SaveManager.state.feverGauge` persisted on change); at `CONFIG.FEVER.gaugeMax` → auto-trigger 6 s: damage mult, universal splash, bg rainbow tint cycle, `Sfx.feverStart/feverEnd`; gauge→0 after.
- [ ] Combo: kills within `CONFIG.COMBO.windowMs` chain; HUD counter (Task 9 styles it); milestone pops at 10/25/50 (`Sfx` pitch climbs with combo count — pass combo to `Sfx.pop(combo)`).
- [ ] Verify `node --check` + tests green; commit `feat: specials, boss event, fever, combo`.

### Task 8: Sfx + haptics + effects

**Files:** `www/js/sfx.js`, `www/js/haptics.js` (verbatim copy of `peel-it-mobile/www/js/haptics.js`), `www/js/effects.js`; wire into game.js `Feel` facade (same pattern as peel-it game.js top)

**Interfaces (Produces):**
- `Sfx` (same unlockAudio/master/mute skeleton as peel-it sfx.js): `pop(combo)` — sine blip 300+min(combo,40)*18 Hz with 60 ms pitch-drop envelope + tiny noise click (the squish); `crit()` — dual-osc zap; `coin()`; `clank()` (shield block — metallic square blip); `splitPop()`; `jackpot()` (coin arpeggio); `feverStart()` (riser sweep 200→1200 Hz 400 ms) / `feverLoop` amplitude pulse via periodic pops / `feverEnd()`; `bossBoom()` (low sine 70 Hz + noise burst 300 ms); `stageClear()` (major triad).
- `Effects`: `burst(scene, x, y, tint, n=10)` pooled pop particles; `goo(scene, x, y, tint)` decal pool (cap 40, alpha-fade 4 s); `damageText(scene, x, y, str, color)` pool cap 20 (rise+fade 500 ms); `coinPop(scene, x, y, n, toHud)`; `confetti(scene, x, y)` (port from peel-it effects.js).
- `Feel` facade maps: kill→pop+tickHaptic, crit→crit+medium, shieldBlock→clank, boss→bossBoom+heavy, fever→riser, clear→stageClear.
- [ ] Implement; `node --check`; grep AudioContext only in unlockAudio; commit `feat: squish synth audio + haptics + pooled effects`.

### Task 9: HUD + upgrade bar + settlement + Menu

**Files:** `www/js/ui.js` (full), modify `www/js/game.js` (hooks)

- [ ] HUD (GameScene, depth 10): top bar — `STAGE n` center (from state), gold top-right **initialized from `SaveManager.state.gold`**, combo counter under stage; fever gauge strip (Graphics fill 0→1) above upgrade bar with `⚡AD` chip when gauge < 50% → `AdsManager.showRewarded('fever_refill')` → on true, gauge=max (triggers fever).
- [ ] Upgrade bar (always visible, y 1010–1180): 5 buttons (128×160 each): icon, name (10 px), `Lv.N`, cost; enabled iff affordable && !maxLevel; tap → `SaveManager.spendGold(cost)` → level++ persist → refresh labels + `Sfx.coin()` + button pop tween. Buttons = rect interactive + passive texts (bug rule). Costs live-refresh on every gold change (scene event `goldChanged`).
- [ ] Settlement every 5th stage clear (before next stage): dark panel — `STAGES x-y`, gold earned since last settlement, buttons `CONTINUE` and `2× GOLD (AD)` (`showRewarded('double_gold')` → add same amount, disable btn). On CONTINUE → `AdsManager.onStageClear()` interstitial hook → next stage.
- [ ] MenuScene (banner ON, `events.once('shutdown', hideBanner)`): logo `SMOOSH!` jelly-bounce tween, best stage + total kills from state, `SMOOSH! (STAGE n)` continue button, sound toggle (persist muted), `RESET PROGRESS` tiny link with confirm tap-twice. GameScene has back `<` → MenuScene.
- [ ] Verify: `node --check`; grep `showBanner` callers → ui.js only; tests green. Commit `feat: HUD, upgrade bar, settlement, menu`.

### Task 10: Ads port

**Files:** `www/js/ads.js` (port from `peel-it-mobile/www/js/ads.js`)

- [ ] Port with ONLY these diffs: header comment (SMOOSH policy); `onObjectComplete()` → `onStageClear()` using `SaveManager.state.adStageCounter++` internally (increment inside ads.js this time) with `CONFIG.ADS.interstitialEveryStages` + cooldown; rewarded types `'double_gold' | 'fever_refill'`; TEST unit IDs unchanged (`banner /6300978111, interstitial /1033173712, rewarded /5224354917`), `USE_TEST_ADS: true`.
- [ ] `node --check`; grep `USE_TEST_ADS` true; commit `feat: AdMob port with stage-clear policy`.

### Task 11: Icons + full pass + AAB build

**Files:** `scripts/gen_icons.py`; build outputs

- [ ] `gen_icons.py` (adapt peel-it script): dark-purple `#141020` squircle; big mint jelly `#7dffb2` with cute face being pressed by a white finger cursor from top-right, tiny pop stars. Same output set (legacy/adaptive/store-512 to `tmp/`). Run + verify files.
- [ ] `npm test` all green; `node --check` all www/js.
- [ ] `npx cap sync android`; verify synced assets contain `balance.js`.
- [ ] Build: `$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"; & "android\gradlew.bat" -p android bundleRelease assembleDebug` → BUILD SUCCESSFUL; verify AAB: `unzip -p … base/manifest/AndroidManifest.xml | grep -a -c "com.represen.smoosh"` ≥1, `"1.0.0"` present, `jarsigner -verify` → `jar verified.`
- [ ] Commit `chore: icons + first signed AAB v1`.

### Task 12: AdMob real app (Claude-in-Chrome) + ID swap + docs

- [ ] Via Claude-in-Chrome on `admob.google.com` (authuser `happyirelim@gmail.com`, proven flow): 앱 추가 → Android → 스토어 미등록 → name `SMOOSH!` → create; then 3 units named `Smoosh Banner` / `Smoosh Interstitial` / `Smoosh Rewarded`; record App ID (`~XXXXXXXXXX`) + 3 unit IDs from the wizard pages.
- [ ] Swap IDs: `ads.js AD_IDS.android`, `capacitor.config.ts androidAppId`, `AndroidManifest.xml` APPLICATION_ID (keep `USE_TEST_ADS: true` / `initializeForTesting: true`); `cap sync` + rebuild AAB+APK; verify new `~id` in AAB manifest and old TEST app id absent.
- [ ] `RELEASE_STATUS.md`: STATUS → BUILD READY, AdMob table row with all IDs, progress log rows for all tasks.
- [ ] Main repo `CLAUDE.md`: add SMOOSH! row to the Live Status Documents table; commit to main repo.
- [ ] Memory: add `project_smoosh_release.md` + MEMORY.md index line.
- [ ] Final Korean report + send debug APK + store icon.

---

## Self-Review Notes

- Spec coverage: §2 loop→T6, boss→T7 · §3 upgrades+invariant→T2/T3/T9 · §4 species→T4/T5/T7 · §5 fever→T7/T9 · §6 juice→T7/T8 · §7 ads→T9/T10/T12 · §8 stack/status-doc→T1/T11/T12 · §9 exclusions respected · §10 criteria→T3 test, T11 build, user device test.
- Type consistency: `Balance.*` signatures used identically in T3/T6/T9; `SaveManager.state` fields defined T2 and used T6/T7/T9/T10 (`adStageCounter` incremented ONLY inside `ads.js.onStageClear`); `Spawner.composeWave(stage, rng)` same in T5/T6; `Feel` facade names match T8 wiring.
- Deviation notes: frequent commits satisfied via local repo (parent gitignores folder); no TDD for Phaser scene code (covered by node --check + pure-logic tests + device test) — same accepted approach as Peel It!.
