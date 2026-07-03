# SMOOSH! v3 — Design Spec (2026-07-03)

One spec, three implementation phases. Each phase ends with: all tests green,
AAB build verified, local git commit (the game's own repo inside
`games-for-release/smoosh-mobile/`), RELEASE_STATUS.md progress row.

- **Phase A (v3.0.0)** — local gameplay: click-collect drops, starter pet,
  ever-growing waves, skill system, expanded element chart, stage map, dex,
  USD prices, remove-ads IAP, ko/en i18n.
- **Phase B (v3.5.0)** — Firebase social nest: anonymous accounts, friends,
  nest visits, gifts, nest decoration.
- **Phase C (v4.0.0)** — full art overhaul of all monsters/pets (painter
  upgrade).

User decisions captured in the interview are marked **[user]**.

---

## Phase A — Local gameplay (v3.0.0)

### A1. Click-to-collect item drops
Today `spawnItemDrop` tweens the drop and auto-applies it. Change to:
- Drop lands near the kill point, bounces once, then idles with a sparkle.
- **Lifetime 8 s; final 2 s blinking; then despawns unclaimed** [user].
- Tap/click collects and applies instantly (existing `applyDrop` effects).
  Hit area ≥ 48 px. Missed drops are simply lost — tension is the point.
- On stage clear, uncollected drops despawn (no auto-vacuum).

### A2. Starter pet
- Grant **one permanent copy of the weakest common animal pet** (first entry
  of the common tier in `catalog.js`) on first launch **and retroactively to
  existing saves** (idempotent save-migration flag).
- The species stays in the gacha pool; duplicates convert to shards as usual.

### A3. Monster count strictly increases every stage [user]
- `Balance.waveSize(stage) = 8 + floor(stage * 1.1)` — **remove the 32 cap**.
  Total per stage is strictly increasing (+1 or +2 every stage).
- **Concurrent on-screen cap ~28**: the wave spawns in batches; as monsters
  die, the next batch trickles in until the stage total is exhausted.
- Rebalance: update the 200-stage balance-invariant simulation (it uses
  `waveSize`) and re-tune gold/HP expectations so the invariant suite passes.

### A4. Skill system (LoL-inspired variety) [user]
- New module `skills.js`: a library of **~22 skill archetypes**: stun, slow,
  knockback, taunt, shield, heal, lifesteal, poison DoT, burn, freeze, chain
  lightning, execute (low-HP kill), crit aura, gold aura, stealth, clone,
  summon, rage (low-HP attack-speed), revive, dash, AoE slam, buff aura.
- Each archetype = data (cooldown, magnitude, radius, duration) + one effect
  hook + one visual/sfx cue. Species reference archetypes by id with
  per-species parameter overrides.
- **Monsters (24 species)**: keep the six v2.4 attack styles; add one skill
  per species that fits its personality (e.g., shieldy→shield, freezy→freeze,
  cloney→clone, king→AoE slam...).
- **Pets (50 species)**: one auto-cast skill each (cooldown-driven, clear
  effect + sound so it reads on screen).
- **Representative pet ultimate** [user]: only the representative pet builds
  an ultimate gauge (fills from its normal attacks + player taps); when full,
  an on-screen button lets the player fire a big signature ultimate manually.
  All other skills are fully automatic.
- Dex shows each species' skill (icon + name + one-line description).

### A5. Expanded element chart (attack AND defense ratios) [user]
- Grow from the current 3-element counter (fire>leaf>water, electric neutral)
  to **8 elements: Fire, Water, Leaf, Wind, Electric, Ice, Light, Dark**.
- Full 8×8 type chart; damage = base × `CHART[attacker.elem][defender.elem]`.
  Multipliers: **1.5 (strong), 1.0 (neutral), 0.7 (weak)** — applied on every
  hit in BOTH directions (pets→monsters and monster attacks→pets/nest), so
  attack and defense are relative ratios of the same chart.
  - Chart (replaces the old fire>leaf>water triangle): 5-cycle
    Fire>Ice>Wind>Leaf>Water>Fire; Electric→Water 1.5 and Electric→Wind 1.5,
    while Leaf→Electric 1.5 (Electric's weakness); Light→Dark 1.5 AND
    Dark→Light 1.5 (mutual); Light/Dark are neutral vs all other elements.
    Everything unlisted is 1.0. The chart lives in `balance.js` as a literal
    8×8 table + invariant test: every element has ≥1 strength and ≥1
    weakness.
- Every monster and pet species gets an element (extend catalogs; today only
  pets attack "by element"). Hit feedback shows effectiveness (color + "Super!"
  / "Resisted" damage text tint).
- Balance sim: assume neutral distribution on average; add a test that the
  chart is zero-sum-ish (mean multiplier across the chart ≈ 1.0 ± 0.05).

### A6. Stage map page (StageMapScene)
- **Zigzag node map** [user], vertical scroll, procedurally generated from the
  stage number (deterministic — no stored layout), boss nodes every 10th stage
  visually bigger/crowned, current position marked by the representative pet.
- Tap any cleared node → replay that stage. **Replay rewards: 30% gold, 100%
  item drops** [user]. The "highest stage" progression pointer never moves
  backwards; after a replay the Play button still resumes the frontier stage.
- Entry: from MenuScene and from the settlement panel.

### A7. Dex pages (DexScene) — monsters + pets [user]
- Two tabs: Monster Dex (24 + boss variants), Pet Dex (50).
- Unlock: monster = killed at least once (else silhouette card); pet = owned
  at least once (else silhouette).
- Cute pastel card grid; tapping a card opens a detail view: big render,
  name, **short witty backstory (1–2 sentences)** [user], element badge,
  skill (icon/name/description), stats, personal kill count (monsters) /
  copies+level (pets).
- Entry: MenuScene + pause-overlay shop nav.
- All dex text goes through i18n (A9).

### A8. Monetization changes
- **Gem packs re-priced in USD** [user]: `$0.99 / 120 gems`, `$4.99 / 700`,
  `$9.99 / 2000` (labels only — IAP stays a dormant facade until Play IAP is
  wired for real).
- **New non-consumable `smoosh_remove_ads` at $0.99** [user]: removes banner +
  interstitials permanently; **rewarded ads (double-gold, fever refill) stay
  available** [user]. Persisted in save + restore-purchases path in the facade.
  Shop shows "Ads removed ✓" state after purchase.

### A9. i18n (ko/en) [user]
- New `i18n.js`: string table `{ key: { en, ko } }`; locale = device language
  (`navigator.language`, Capacitor fallback) — **Korean devices get Korean,
  everyone else gets English** [user]. No in-game language toggle in v3
  (follow OS), fallback = en.
- Scope: ALL new text (dex lore ×74, skill names/descriptions ×~22, stage
  map/nest/social UI) authored bilingually; existing UI strings migrated to
  the table as they are touched.

### A10. PvP team selection — up to 5 pets [user]
- `CONFIG.PVP.teamSize` 3 → **5 (upper bound)**. Before a PvP match the player
  **picks up to 5 owned pets** in a picker overlay (tap cards to toggle;
  an AUTO button fills the top 5 by power; at least 1 required).
- Last team persists in `save.pvpTeam` (species ids), validated against
  currently-owned pets on load (missing ones drop out).
- The bot team mirrors the player's picked count (fair fight); the existing
  ±15% power jitter is unchanged.

---

## Phase B — Firebase social nest (v3.5.0)

### B1. Infrastructure
- **New dedicated Firebase project** under `happyirelim@gmail.com` [user]
  (precedent: ZAP TAP's project was fully set up via browser automation).
  Firestore (asia-northeast3) + Anonymous Auth. Android app id
  `com.represen.smoosh`, plus web config for dev testing.
- **Anonymous auth + auto nickname** [user]: first launch signs in silently,
  generates a cute nickname ("Bouncy Mochi #4821" style, editable in nest
  page). Account is device-bound for now (Google link-up is future work).
- Offline/failure degradation: social pages show a friendly "offline" state;
  the core game NEVER blocks on Firebase.

### B2. Data model (Firestore)
```
users/{uid}:    nickname, createdAt, lastActiveAt, repPetId,
                petIds[] (owned species for visit rendering),
                decor[] {itemId, x, y}, stats {stage, kills}
friendReqs/{id}: from, to, status: pending|accepted|declined, ts
gifts/{id}:      from, to, kind: gold|gems|decor, amount|itemId,
                 status: sent|claimed, ts
```
- Security rules: a user writes only their own `users/{uid}`; friend requests
  writable by `from` (create) and `to` (status change); gifts creatable by
  `from` with field validation (caps below), claimable only by `to`.
  Balances themselves stay in the LOCAL save (casual-game trust model) —
  claiming a gift adds to the local balance and marks the doc claimed.

### B3. My nest (NestScene)
- Pets roam freely with idle AI: wander, nap, chase each other, play with toy
  items placed in the nest. **Tapping a pet makes it react** (jump + hearts +
  voice) [user].
- Edit mode: place/move/remove decoration items on a grid.

### B4. Nest decoration items
- 5 categories: floor, background, furniture, toys, special.
- Sources: shop (gold or gems) **and random monster-kill drops** [user] — a
  `decor` entry is added to the Phase A drop table (small weight).
- Owned decor is local save; the *placed layout* syncs to `users/{uid}.decor`
  so visitors see it.

### B5. Visiting other nests — snapshot model [user]
- User list page: ~20 recently-active users (query on `lastActiveAt`) +
  friends list on top.
- Visiting reads the target's snapshot (nickname, decor, petIds) and renders
  their nest locally; **my pets all come along** and mingle/play with the
  host's pets via the same idle AI (pairwise chase/bounce picked at random)
  [user]. The host does not need to be online (no realtime sync) [user].

### B6. Friends & gifts
- **Request → accept** friendship [user]. Friend list with online-ish state
  (lastActiveAt bucket).
- **Gifts (friends only)** [user]: gold ≤ 50,000 per gift, gems ≤ 30 per
  gift, or 1 decor item; **max 5 outgoing gifts per day** (client-enforced +
  rules-validated daily counter). Inbox with claim buttons.

---

## Phase C — Art overhaul (v4.0.0)

- **Whole-game pastel art direction** [user]: define a global pastel palette
  token set in `config.js` (soft backgrounds, muted saturations, creamy
  accents) and apply it across EVERY surface — menu, HUD, battle field,
  settlement, shop, stage map, dex, nest, buttons/panels/toasts — not just
  characters. One consistent pastel identity end to end.
- **Parametric painter surgery** [user] (no hand-drawn asset pipeline):
  - Signature-part system: per-species ears/horns/tails/patterns/hats/props
    parameters so every one of the 24 monsters + boss variants + 50 pets has
    a distinct silhouette and personality — cuter AND more differentiated
    [user].
  - Palette redesign (harmonized pastel ramps per element), consistent
    outline + soft shading, bigger sparkly eyes baseline from v2.5 kept.
  - Must hold up at large sizes (dex detail view, nest close-ups).
- Regenerate any cached textures; dex/nest render through the same painters.

---

## Testing

- Keep the existing 62-test suite green; extend:
  - waveSize strictly increasing, concurrent cap respected (batch spawner).
  - Replay reward = 30% gold / 100% drops.
  - Drop lifetime/blink/collect state machine (pure logic).
  - Skill archetype cooldown/effect math; ultimate gauge fill/reset.
  - Element chart: every element ≥1 strong/≥1 weak; mean multiplier ≈1.0;
    both-direction application.
  - Dex unlock predicates; i18n table completeness (every key has en+ko).
  - Gift caps + daily limit logic (pure); Firestore rules via emulator tests
    (best-effort; otherwise documented manual checklist).
  - Balance sim re-tuned and passing at 200 stages.

## Versioning / rollout

- A=3.0.0 → B=3.5.0 → C=4.0.0; versionCode +1 each build; AAB built and
  manifest-verified per phase. Web demo at
  `https://jireh-father.github.io/ai-game-studio/smoosh/` refreshed after
  each phase ships (Firebase features degrade gracefully on web).

## Out of scope (explicitly)

- Real IAP wiring to Play Billing (facade stays dormant; prices are labels).
- Google account linking / cross-device saves.
- Realtime co-presence in nests; chat of any kind.
- Server-authoritative balances / anti-cheat beyond gift caps.
