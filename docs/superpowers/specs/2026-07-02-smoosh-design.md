# SMOOSH! — Game Design Spec

**Date:** 2026-07-02
**Status:** Approved by user (brainstorming session)
**Target:** Google Play release under the pending Organization account (`com.represen.*`), same pipeline as Peel It!

## 1. Concept

An infinite-stage, zero-fail tap-slaughter hyper-casual: squishy jelly
monsters swarm and wander across the screen; you smash them with your finger.
Numbers go up (tap-RPG-lite upgrades), stages never end, and the squish is
the product.

- **Genre:** tap arcade + idle-RPG-lite progression
- **Name:** SMOOSH! (스무시!) — used throughout development; renamed only by
  explicit user decision at store-listing time.
- **Loop philosophy:** mindless repetition with a clear-rhythm pulse. No fail
  state, no timer pressure. Tension comes from big-number growth and fever
  peaks, never from losing.

## 2. Core Loop (one stage ≈ 20–40 s)

1. Stage N starts → a wave of jelly monsters pours in and wanders (patterns:
   amble, zigzag, dash, flee-from-finger).
2. Tap = damage. Small mobs pop in 1–2 taps with a splat; bigger ones squash
   and rebound per tap until they burst.
3. Kill everything → **STAGE CLEAR** banner (~1 s) → next stage immediately.
   Stages are infinite; monster HP and count scale up.
4. Monsters drop gold → spend on upgrades → weaker stages become one-tap
   massacres again.
5. **Every 10th stage: BOSS** — a half-screen giant jelly with an HP bar;
   mash it down for a full-screen goo explosion and a gold shower.

Monsters never hurt the player, and none leave the stage except the jackpot
jelly (§4), which despawns if ignored and does NOT block stage clear — clear
requires killing every non-jackpot monster. Idling just means the stage
doesn't clear.

## 3. Progression — Tap-RPG-Lite (5 upgrades)

| Upgrade | Effect | Start | Growth per level |
|---|---|---|---|
| Tap Power | damage per tap | 1 dmg | ×1.35 dmg, cost 10 × 1.18^L |
| Critical | chance of ×5 dmg + flash | 3% | +1.5%/level (cap 35%), cost 25 × 1.22^L |
| Splash | AoE radius around each tap | 0 px | +22 px/level (cap 10 levels), cost 40 × 1.30^L |
| Fever Charge | fever gauge fill rate | ×1.0 | +12%/level, cost 30 × 1.25^L |
| Gold Boost | gold drop multiplier | ×1.0 | +10%/level, cost 30 × 1.25^L |

Mob HP scales `round(3 × 1.14^stage)`; wave size `min(6 + floor(stage × 0.8), 24)`.

**Balance invariant (unit-tested):** a simulated player who always buys the
cheapest affordable upgrade stays within a **1–5 taps-per-mob band** across at
least 200 stages (no permanent hard wall, no permanent trivial one-tap-forever).
Constants above are starting values; tests own the truth and constants may be
tuned to keep the invariant.

No prestige/rebirth, no offline earnings in v1 (explicitly out of scope).

## 4. Monsters — 14 jelly species

- **10 regular mobs**, differentiated by stats only (all die to taps): size,
  HP multiplier (0.5×–4× of stage base), speed, movement pattern (amble /
  zigzag / dash / flee-from-finger / sleeper that wakes when tapped), gold
  multiplier. Colorful flat-SVG jellies with faces — cute enough that mass
  slaughter stays charming and all-ages safe.
- **4 special species:**
  - **Splitter** (from stage 5, ~8% of spawns): bursts into 2 half-size
    children (one split generation max — children don't split again).
  - **Shield jelly** (from stage 8, ~6%): a wobbling shell that only cracks
    on critical hits OR after 6 rapid taps within 1.5 s — a mash target.
  - **Jackpot jelly** (~2%, any stage): golden, flees fast, despawns after
    6 s if untouched (the ONLY monster that can leave); killing it rains
    gold worth ~10 mobs.
  - **Boss jelly** (every 10th stage): huge, HP ≈ 25× stage mob HP, HP bar
    at top, squashes deeper as HP drops; death = slow-mo 0.3 s + screen
    shake + goo explosion + gold ≈ 15 mobs.

Asset cost: 2 SVG states per species (idle, squashed) + shared particle/goo
textures — same hand-drawn flat style and authoring pipeline as Peel It!'s
catalog.

## 5. Fever Mode (the dopamine peak)

- Each kill adds 1 point (× Fever Charge multiplier) to a gauge of 30.
- Full gauge → **FEVER!** auto-triggers: 6 s of ×10 damage, every tap gains
  a 140 px splash, rainbow background pulse, music/SFX pitch rises, kills
  chain-pop. Gauge resets after.
- Rewarded ad can fill the gauge instantly (see §7).

## 6. Juice (per-tap satisfaction is the product)

- Squash-and-rebound scale tween on every tap; burst = pop particles + a goo
  splat decal that fades over ~4 s (max ~40 decals pooled).
- Combo counter: kills within 1.2 s chain a combo; SFX pitch climbs with
  combo; combo text pops at 10/25/50.
- Gold pops fly to the HUD counter.
- Haptics: light tick per kill, medium on crit/special, heavy + shake on boss
  death.
- All audio synthesized with Web Audio (squish/pop/pong family, coin blips,
  fever riser) — zero audio assets, reusing the Peel It! Sfx architecture.
- 60 fps target on mid-range Android with ≤ 24 active monsters + pooled
  particles/decals (object pooling mandatory).

## 7. Monetization — real AdMob from day 1 (ZAP TAP model)

- **Interstitial:** after every 5th stage clear, minimum 60 s apart.
- **Rewarded:** "2× gold" on stage-clear settlement; "instant FEVER" button
  next to the gauge (usable when gauge < 50%).
- **Banner:** NEVER during gameplay; menu/upgrade screens only.
- AdMob: new app under publisher `pub-7114194646987493` (happyirelim),
  created via Claude-in-Chrome (proven flow); Google TEST creatives
  (`USE_TEST_ADS: true`) until production.

## 8. Technical Architecture

- Clone the Peel It! project shape: Phaser 3.60 (vendored) + vanilla JS
  `www/` + Capacitor 6 wrapper at `games-for-release/smoosh-mobile/`
  (gitignored; own local git repo). Reuse the release keystore.
- **No Firebase.** Progress in `localStorage` (gold, upgrade levels, stage
  reached, fever gauge, muted).
- Pure-logic modules unit-tested in Node (`node --test`): balance curves +
  the §3 invariant simulation, economy, spawner composition (species mix per
  stage), save manager.
- Phaser modules: BootScene (all SVG → base64 textures once + procedural
  particles), GameScene (spawner, monster pool, input, fever), UpgradeScene/HUD,
  MenuScene. `main.js` loads last; all pipeline bug rules apply.
- Package `com.represen.smoosh`, versionCode 1 / versionName 1.0.0, portrait.
- `RELEASE_STATUS.md` from day 1, registered in the project CLAUDE.md table.

## 9. Out of Scope (v1)

- Prestige/rebirth, offline earnings
- Monster collection book / skins
- Gesture kills (swipe/hold) — taps only
- Trap/penalty monsters (nothing punishes tapping)
- Leaderboards, any server backend, iOS

## 10. v1.1 Update (2026-07-02, user-requested after playtest)

- **+10 species** (24 total, 20 mobs): ghosty (phases untappable), hoppy
  (bunny hops), orbity (Saturn-ring orbit), lovey (chases your finger),
  rocky (ricochet), bubbly (floats up, wraps), shysh (shrinks near finger),
  cloney (blinks away on non-fatal hits), freezy (ice shell absorbs first
  hit), chunky (6× HP bruiser). Quirk jellies gate at stage 12, heavies at 10.
- **Harder**: mob HP growth 1.14→**1.15**; waves **8 + 1.1·stage, cap 32**
  (was 6+0.8n cap 24); retuned equilibrium tap costGrowth **1.31** / damage
  growth **1.28**; invariant band widened to **1–6 taps**, ≥45% of stages
  need 2+ taps, average ≥1.8.
- **Boss rotation**: every boss stage promotes the next regular mob (catalog
  order) to a crowned giant; every 10th boss (stage 100, 200…) is King Jelly.
  Boss HP mult ramps `25 × (1 + (bossIndex−1)·0.5)` (stage 100 ≈ ×137 mob
  HP); boss gold scales with the same ramp.
- **Refined UI**: hand-drawn tinted upgrade icons (fist/bolt/burst/flame/coins)
  replace emoji; rounded NineSlice cards/buttons with drop shadows + gloss,
  affordability glow, level pills, HUD stage pill + gold chip, gradient boss
  bar with name label, combo pop animation, menu mascot parade.

## 11. v2.0 "Guardian" Update (2026-07-03, user-requested)

- **The Nest** (the defend-target): bottom-center; from stage 3, 25% of plain
  mobs raid it (2 HP/s bite each). One nest level drives max HP / regen /
  thorns / pet slots (1→3). **Nest broken = stage failed → retry** (the
  game's first true fail state; nest auto-repairs each stage).
- **Pets**: gacha eggs hatch 4 element species (fire flare / electric zappy /
  water aqua / leaf clover); they roam the field auto-attacking (heavy /
  chain-2 / splash / 1.5×-gold kills). Level via gold feed or 8 shards;
  one necklace slot (+dmg by rarity). Max one pet per species; better-rarity
  dupes upgrade it, others convert to shards.
- **Gacha**: gold egg C60/R25/E12/L3 vs gem egg C40/R30/E20/L10; pity ≤ 40
  rolls to epic+; 10+1 pulls; hatch ceremony with rarity pillars.
- **Equipment**: glove(+tap%)/ring(+crit)/charm(+gold%), rarity ×1/2/4/8,
  enhance levels; chests (gold/gem) drop gear or pet necklaces, dupes refund.
- **Gems**: earned free (boss +1, king +3, every 25 stages +5, PvP win +2);
  spent on premium gacha. **IAP facade pre-implemented but dormant** — 3 gem
  packages, dev-simulated purchases in browser, `IapManager._nativePurchase`
  is the documented plugin swap-in point at release.
- **PvP (bot phase)**: pure `Battle.sim` (element counters fire>leaf>water>
  fire, zappy neutral; clover heals) + replay scene; bots scale to my team
  ±15%; rating/W-L, rewards. Architecture is async-PvP-ready: replace
  `Battle.botTeam` with a downloaded rival snapshot (Firebase RTDB, ZAP TAP
  pattern) and nothing else changes.
- **Player level**: XP per kill + per clear; +2% damage per level.
- All prices progress-indexed via `goldPerMob(bestStage)`. Save schema v2
  with automatic v1 migration. 59 unit tests.

## 12. v2.1–v2.5 Updates (2026-07-03, rapid user-driven iterations)

- **v2.1**: 50 parametric ANIMAL pets replace the 4 element-jellies (element
  fixed per animal, one pet per animal, global shards, save migration);
  monsters damage pets (KO 6s → respawn); HP growth ×3 (later reverted);
  field necklace drops; PvP uses ALL owned pets; juicier damage text;
  redesigned coin/gem icons.
- **v2.2**: shop currency emoji → texture icons (🪙 rendered as a globe on
  some fonts); HP growth halved to 1.25^n (economy resweep: gold 1.22^n,
  tap costGrowth 1.352); **PvP reworked to a LIVE battle on the same stage
  field** (armies roam & fight like field pets); gold egg price fixed.
- **v2.2.1**: synthesized monster VOICES (size-scaled dark-cute grunts, 3
  variants/event), boss roars on spawn/death, element-pitched pet yelps.
- **v2.3**: in-game pause-overlay shop (buy/equip mid-stage, ▶ resumes);
  7-type instant-use item drops (gold/bomb/heal/fever/gear/necklace/gem,
  6%/kill).
- **v2.4**: per-species monster ATTACKS — 6 styles (melee lunge, slam AoE,
  charge ram, spit, 3-way spray, zap bolt); pets take explicit hits
  (passive contact damage removed); ranged monsters shell the nest; bosses
  ×2.5 dmg. Pacifists: scaredy/shysh/goldie.
- **v2.5**: ALL owned pets deploy every stage (slot gating removed);
  cuteness pass on both painters (bigger sparkly eyes, dual glints, blush,
  sitting paws).

## 13. Success Criteria

- A first-time player understands everything with zero instructions.
- Balance invariant test green over 200 simulated stages.
- 60 fps with a full 24-monster wave + fever splashes on a mid-range device.
- Boss kill feels like an event (slow-mo + shake + gold shower).
- Signed AAB with real AdMob IDs, waiting only on the org Play account.
