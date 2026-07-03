# SMOOSH! v3.5 Phase B (Firebase Social Nest) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship SMOOSH! v3.5.0 — anonymous accounts with cute nicknames, a living pet nest (idle AI + touch reactions + decoration), snapshot visits to other players' nests, friend requests, and capped gifting — all Firebase-backed but never blocking the core game.

**Architecture:** One service layer (`www/js/fb.js`, global `Social`) wraps ALL Firebase usage (compat SDK, vendored). Every Social method resolves gracefully when Firebase is unconfigured/offline (`Social.ready === false` → social pages show an offline card; the tap game never waits on it). New scenes: `NestScene` (my nest / visit mode) and `FriendsScene` (user list + friends + inbox). Decor is a local catalog + save fields; only the PLACED layout syncs to the profile doc. Firebase project creation is the LAST infra task (user 2FA touchpoint), after all code is merged and testable offline.

**Tech Stack:** Phaser 3.60 (vendored), Capacitor 6, Firebase JS compat SDK v10 (vendored files, no bundler), Firestore + Anonymous Auth, `node --test`.

## Global Constraints

- Project root: `D:\source\ai-game-studio\games-for-release\smoosh-mobile\` (own git repo, branch `v3-phase-b` off main; commit there).
- The core game NEVER blocks on Firebase: no awaits in GameScene flows; social entry points check `Social.ready` and render an offline state otherwise.
- All user-visible strings via `I18n.t` (en+ko both). All code/comments English.
- Script load order: vendored firebase libs BEFORE `fb.js`; `fb.js` after `config.js`/`i18n.js`; new scene files before `ui.js`; `main.js` LAST.
- Phaser-guard scoping: scene classes use the PROVEN `let SceneName;` top-level + class-expression-inside-guard pattern (see stagemap.js / dex.js).
- Dual-mode export guards on every new module; pure logic testable in Node with fake Firestore objects (no network in tests).
- Suite green at every commit (96 baseline); `node --check` every touched file.
- Firestore is NEVER trusted for balances: gold/gems stay in the local save; gifts add locally on claim (casual trust model per spec §B2).
- Version bump to 3.5.0 only in the final ship task.

## File Structure

- Create: `www/js/fb.js` (Social service: init/auth/profile/list/friends/gifts/nest-sync; ~all Firebase touchpoints), `www/js/nicknames.js` (pure generator), `www/js/decor.js` (catalog + pure placement validation + painter), `www/js/nest.js` → EXTENDED (idle-AI agents reused for nest), new scenes `www/js/nestscene.js`, `www/js/friends.js`, `firebase/firestore.rules`, `www/js/fbconfig.js` (web config; committed — Firebase web configs are public by design; starts as `const FB_CONFIG = null;`).
- Vendor: `www/lib/firebase-app-compat.js`, `firebase-auth-compat.js`, `firebase-firestore-compat.js` (from `npm i firebase@^10`, copy the 3 compat bundles).
- Modify: `save.js` (decorOwned/decorPlaced/nestName? no — nickname lives server-side; add `social: { uid: null, nickname: null }` cache), `config.js` (DECOR drop weight + GIFT caps), `game.js` (decor drop type), `shop.js` (DECOR tab), `ui.js` (NEST/FRIENDS menu buttons), `main.js`, `index.html`, `i18n.js` (all new keys).

---

### Task 1: Nickname generator + gift-cap pure logic

**Files:** Create `www/js/nicknames.js`, extend `www/js/config.js`, extend `www/js/balance.js`, Create `tests/social.test.js`.

**Interfaces:**
- Produces: `Nicknames.generate(rng)` → `'Bouncy Mochi #4821'` style (adjective + noun + #1000-9999) from ≥12 adjectives × ≥12 nouns (English, cute, family-safe); `Nicknames.valid(name)` → bool (3-24 chars, no angle brackets/control chars).
- `CONFIG.GIFT = { maxGoldPerGift: 50000, maxGemsPerGift: 30, maxDecorPerGift: 1, dailySendLimit: 5 }`.
- `Balance.giftAllowed(kind, amount, sentTodayCount)` → `{ ok, reason? }` pure validation (kind: 'gold'|'gems'|'decor'; enforces caps + daily limit).

- [ ] **Step 1: failing tests** (`tests/social.test.js`):

```js
const test = require('node:test');
const assert = require('node:assert');
globalThis.CONFIG = require('../www/js/config.js').CONFIG;
const { Balance } = require('../www/js/balance.js');
const { Nicknames } = require('../www/js/nicknames.js');

test('nickname format Adjective Noun #NNNN, deterministic under seeded rng', () => {
    let calls = 0; const rng = () => [0.1, 0.5, 0.42][calls++ % 3];
    const n = Nicknames.generate(rng);
    assert.match(n, /^[A-Z][a-z]+ [A-Z][a-z]+ #\d{4}$/);
    assert.ok(Nicknames.valid(n));
    assert.strictEqual(Nicknames.valid('ab'), false);
    assert.strictEqual(Nicknames.valid('x'.repeat(25)), false);
    assert.strictEqual(Nicknames.valid('hey<script>'), false);
});

test('gift caps and daily limit', () => {
    assert.deepStrictEqual(Balance.giftAllowed('gold', 50000, 0), { ok: true });
    assert.strictEqual(Balance.giftAllowed('gold', 50001, 0).ok, false);
    assert.strictEqual(Balance.giftAllowed('gems', 31, 0).ok, false);
    assert.deepStrictEqual(Balance.giftAllowed('gems', 30, 4), { ok: true });
    assert.strictEqual(Balance.giftAllowed('gems', 1, 5).ok, false);   // daily limit
    assert.strictEqual(Balance.giftAllowed('decor', 1, 0).ok, true);
    assert.strictEqual(Balance.giftAllowed('decor', 2, 0).ok, false);
    assert.strictEqual(Balance.giftAllowed('wat', 1, 0).ok, false);
});
```

- [ ] Step 2: run → FAIL. Step 3: implement (nicknames.js word lists + generate/valid; CONFIG.GIFT; `Balance.giftAllowed` returning `{ok:false, reason:'cap'|'daily'|'kind'}` variants — tests only pin `.ok`). Step 4: green + `node --check`. Step 5: commit `feat(v3.5): nickname generator + gift-cap validation`.

---

### Task 2: Vendored Firebase + Social service layer (offline-first)

**Files:** Vendor 3 compat bundles into `www/lib/`; Create `www/js/fbconfig.js` (`const FB_CONFIG = null; if (typeof module!=='undefined') module.exports={FB_CONFIG};`), `www/js/fb.js`; Modify `www/index.html` (lib scripts + fbconfig + fb.js after i18n.js), `www/js/save.js` (`social: { uid: null, nickname: null }` in fresh state); Test additions in `tests/social.test.js`.

**Interfaces (the whole social API — later tasks call ONLY these):**
- `Social.ready` (bool): true only after successful `init()` with non-null config AND anonymous sign-in.
- `Social.init()` → Promise<bool>; no-throw; uses `firebase.initializeApp(FB_CONFIG)`, anonymous auth, ensures `users/{uid}` doc exists (nickname from `Nicknames.generate(Math.random)` on first run, cached in `SaveManager.state.social`).
- `Social.setNickname(name)`, `Social.syncProfile(fields)` (merge-writes lastActiveAt/repPetId/petIds/stats/decor), `Social.listRecent(limit=20)`, `Social.getUser(uid)`, `Social.sendFriendReq(toUid)`, `Social.myRequests()`, `Social.respond(reqId, accept)`, `Social.friends()`, `Social.sendGift(toUid, kind, payload)` (client-checks `Balance.giftAllowed` + own balance; deducts locally THEN writes gift doc; on write failure refunds locally), `Social.inbox()`, `Social.claimGift(giftId)` (marks claimed, returns payload; caller credits local save).
- EVERY method: if `!Social.ready` → resolves `{ offline: true }` (or `[]`), never rejects. All Firestore calls wrapped in try/catch with the same fallback.
- **Testability:** `Social._db` is injectable; pure helpers `Social._profileDoc(state, pets)` (builds the users/{uid} payload: nickname, petIds[] species, repPetId, decor[], stats{stage,kills}, lastActiveAt=serverTimestampSentinel-or-now) and `Social._todayKey(now)` (UTC yyyy-mm-dd for the daily gift counter `sent_{todayKey}`) are unit-tested with plain objects.

- [ ] Step 1: failing tests — `_profileDoc` shape (petIds from save.pets species, decor passthrough, stats), `_todayKey('2026-07-04T23:59Z')==='2026-07-04'`, offline fallbacks (`Social.ready===false` fresh; `await Social.listRecent()` deep-equals `[]`; `await Social.sendGift(...)` → `{offline:true}`).
- [ ] Step 2: RED. Step 3: `npm i firebase@^10` (devDependency fine), copy `node_modules/firebase/firebase-{app,auth,firestore}-compat.js` → `www/lib/`; write fb.js per the interface (guard `typeof firebase !== 'undefined' && FB_CONFIG`); index.html order: 3 lib scripts + fbconfig.js right after `lib/phaser.min.js`, `fb.js` after `i18n.js`. `Social.init()` called fire-and-forget from main.js boot (`.then(...)` no await).
- [ ] Step 4: green; `node --check` fb.js/fbconfig.js. Step 5: commit `feat(v3.5): offline-first Social service layer + vendored Firebase compat`.

---

### Task 3: Decor catalog + drops + shop tab

**Files:** Create `www/js/decor.js`; Modify `www/js/config.js` (DROPS.weights add `['decor', 4]`), `www/js/save.js` (`decorOwned: {}` id→count, `decorPlaced: []` [{id,gx,gy}]), `www/js/game.js` (applyDrop 'decor' case → random unowned-weighted decor grant + toast), `www/js/shop.js` (DECOR tab: grid of catalog items, buy with gold/gems, owned badge), `www/js/i18n.js`; Test `tests/decor.test.js`.

**Interfaces:**
- `DECOR_ITEMS`: ≥20 items across 5 categories `floor|background|furniture|toy|special`, each `{ id, name:{en,ko}, cat, price:{kind:'gold'|'gems', amount}, svg }` — svg from a small parametric painter in the same file (pastel props: rug, pond, mushroom, swing, ball, bed, lamp, fence, flower, statue...). Toys matter: nest idle AI targets `cat==='toy'` items.
- `Decor.byId(id)`, `Decor.grantRandom(save, rng)` (weights unowned 3×), `Decor.canPlace(placed, id, gx, gy)` pure (grid 6×4, one item per cell, must own more than placed count of that id).
- Grid: `Decor.GRID = { cols: 6, rows: 4 }` mapping to nest area coordinates.

- [ ] Step 1: failing tests — catalog integrity (≥20, 5 cats each ≥3, bilingual names, unique ids, positive prices), `canPlace` (occupied cell false, unowned false, valid true), `grantRandom` respects rng and returns an id. Step 2: RED. Step 3: implement. Step 4: green. Step 5: wire drop type + shop tab + i18n keys (`decor.title`, `decor.owned`, per-cat labels). Step 6: full suite + `node --check`; commit `feat(v3.5): decor catalog, monster drops, shop tab`.

---

### Task 4: NestScene — living nest (idle AI, touch, edit mode)

**Files:** Create `www/js/nestscene.js`; Modify `www/js/main.js` (register), `www/js/ui.js` (NEST menu button), `www/index.html`, `www/js/i18n.js`; reuse pet textures + `PET_SPECIES`.

**Interfaces:**
- `NestScene.init({ visit })` — `visit` absent = MY nest (edit enabled); `visit = { nickname, petIds, decor }` snapshot = visit mode (Task 6 supplies it).
- Idle AI (self-contained in this scene, NOT FieldPets): each pet agent cycles states `wander → nap → chase(other) → play(toy)` on weighted timers; toys = placed decor with `cat==='toy'`; ≤ 20 pets rendered (owned order), spirits never appear (they're not in save.pets).
- Touch a pet → jump tween + hearts burst + `Sfx.petYelp` + haptic. Touch during visit mode: same (their pets react too).
- Edit mode (my nest only): EDIT button → grid overlay (6×4), tap owned-decor tray item → tap cell to place (uses `Decor.canPlace`), tap placed item → remove; SAVE persists `decorPlaced` + fire-and-forget `Social.syncProfile({decor})`.
- Pure part for tests: `NestAI.nextState(current, rng, hasToys)` transition table in `www/js/nestscene.js`'s top (exported) — test the distribution/legality (`nap` can't chain to `nap`, `play` only when `hasToys`).

- [ ] Step 1: failing tests (`tests/nest.test.js`): NestAI transition legality + play-requires-toys + all states reachable under seeded rng. Step 2: RED → implement pure half → green. Step 3: scene (scoping pattern!), idle AI, touch, edit mode. Step 4: suite + `node --check`; commit `feat(v3.5): living nest scene with idle AI, touch reactions, decor editing`.

---

### Task 5: FriendsScene — user list, friend requests, inbox UI

**Files:** Create `www/js/friends.js` (scene); Modify `main.js`, `ui.js` (FRIENDS button), `index.html`, `i18n.js`.

**Interfaces:**
- Three tabs: **Players** (Social.listRecent → rows: nickname, stage, VISIT + ADD buttons), **Friends** (Social.friends → rows: nickname, VISIT + GIFT buttons; pending requests section with ACCEPT/DECLINE), **Inbox** (Social.inbox → gift rows with CLAIM; claiming credits the LOCAL save via the payload and toasts).
- GIFT flow: modal — kind picker (gold/gems/decor), amount stepper clamped by `Balance.giftAllowed` + current balance, SEND → `Social.sendGift` (which deducts locally first, refunds on failure).
- Offline state: if `!Social.ready`, all three tabs render one centered card `I18n.t('social.offline')` — no spinners, no retries in a loop (a single RETRY button re-calls `Social.init()`).
- VISIT → `Social.getUser(uid)` → `scene.start('NestScene', { visit: {...} })`.

- [ ] Steps: no new pure logic beyond what Tasks 1-2 test — UI wiring only; i18n keys (`social.players/friends/inbox/offline/visit/add/gift/claim/sent/accept/decline` + gift modal strings, en+ko). Full suite + `node --check`; manual-verification note in report; commit `feat(v3.5): friends scene - players list, requests, gifts inbox`.

---

### Task 6: Firestore security rules + rules test checklist

**Files:** Create `firebase/firestore.rules`, `firebase/RULES_CHECKLIST.md`.

Complete rules (write them exactly; tune only if the emulator disproves):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    match /users/{uid} {
      allow read: if signedIn();
      allow create, update: if signedIn() && request.auth.uid == uid
        && request.resource.data.nickname is string
        && request.resource.data.nickname.size() >= 3
        && request.resource.data.nickname.size() <= 24;
      allow delete: if false;
    }
    match /friendReqs/{id} {
      allow read: if signedIn() && (resource.data.from == request.auth.uid || resource.data.to == request.auth.uid);
      allow create: if signedIn() && request.resource.data.from == request.auth.uid
        && request.resource.data.status == 'pending' && request.resource.data.to != request.auth.uid;
      allow update: if signedIn() && resource.data.to == request.auth.uid
        && request.resource.data.status in ['accepted', 'declined']
        && request.resource.data.from == resource.data.from && request.resource.data.to == resource.data.to;
      allow delete: if false;
    }
    match /gifts/{id} {
      allow read: if signedIn() && (resource.data.from == request.auth.uid || resource.data.to == request.auth.uid);
      allow create: if signedIn() && request.resource.data.from == request.auth.uid
        && request.resource.data.status == 'sent' && request.resource.data.to != request.auth.uid
        && request.resource.data.kind in ['gold', 'gems', 'decor']
        && (request.resource.data.kind != 'gold' || (request.resource.data.amount is int && request.resource.data.amount > 0 && request.resource.data.amount <= 50000))
        && (request.resource.data.kind != 'gems' || (request.resource.data.amount is int && request.resource.data.amount > 0 && request.resource.data.amount <= 30));
      allow update: if signedIn() && resource.data.to == request.auth.uid
        && request.resource.data.status == 'claimed'
        && request.resource.data.kind == resource.data.kind
        && request.resource.data.amount == resource.data.amount
        && request.resource.data.from == resource.data.from && request.resource.data.to == resource.data.to;
      allow delete: if false;
    }
  }
}
```

- [ ] RULES_CHECKLIST.md: 10 manual emulator/console probes (stranger writing my user doc → deny; gift over cap → deny; claiming someone else's gift → deny; sender "claiming" own gift → deny; accepted-req field tamper → deny; etc.). If `firebase-tools` emulator is installable quickly, run the checklist against it and record results; otherwise mark "pending live project" — do NOT block the branch on the emulator. Commit `feat(v3.5): firestore security rules + verification checklist`.

---

### Task 7: Firebase project creation + live wiring (USER-GATED — controller runs this one, not a code subagent)

- Create Firebase project `smoosh` (happyirelim, CDP browser; user taps phone 2FA when prompted), Firestore asia-northeast3, Anonymous Auth ON, Android app `com.represen.smoosh` + Web app; deploy `firebase/firestore.rules`; paste web config into `www/js/fbconfig.js` (replace `null`); `google-services.json` NOT needed (JS SDK only).
- Smoke: `npm run serve` on TWO browser profiles → two anon users; profile docs appear; friend req + gift round-trip; visit renders the other nest. (Controller/user smoke — code agents stay out of browsers.)
- Commit `feat(v3.5): live Firebase config (project smoosh)`.

### Task 8: Ship v3.5.0

- Full suite; `node --check` all; i18n sweep of new files; versionCode +1 / versionName 3.5.0; `npx cap sync android`; AAB build + manifest verify; RELEASE_STATUS.md v3.5 row; commit `release: v3.5.0 - Phase B (social nest/friends/gifts/decor)`; merge `v3-phase-b` → main; refresh web demo.

## Self-Review Notes
- Spec coverage: B1→T2+T7, B2→T2+T6, B3→T4, B4→T3, B5→T4(visit)+T5(list), B6→T1+T5+T6. Offline degradation is a Global Constraint enforced in T2's API contract.
- Deliberate sequencing: all code (T1-T6) lands and tests offline BEFORE the user-gated infra (T7); T7 is a controller task because it needs interactive browser + 2FA, not a sandboxed code agent.
- Gift trust model: local balances + rules field-validation only (spec §B2); daily limit client-enforced via `sent_{todayKey}` counter on the sender's user doc (best effort, accepted).
