# SMOOSH! v6 — Design Spec (2026-07-04)

A large gameplay + content + juice update. Built on the v5.0 RETRO ARCADE
(neon/CRT, pixel font+sprites, gem-only legendary, rarity frames) baseline.

**Investigation-corrected framing (important):** a runtime audit found that
monster melee attacks, monster/pet skills, and all-pets-deploy ALREADY work and
deal real damage — they just read as absent because (a) melee/skills use the same
subtle ring FX as a normal hit, (b) skill cooldowns are long, and (c) pet HP/KO
persists across stages instead of resetting. So the relevant work is JUICE +
new mechanics + reset-on-stage, not "add melee/skills."

Order of work below = the requested order, grouped A (balance/behavior) → B
(combat feel) → C (content) → D (juice/art). Values are documented + tunable.

---

## A. Balance & behavior

### A1. Crit chance climbs slower
- `Balance.critChance(level)` = `Math.min(0.03 + 0.015*level, 0.35)` today; effective
  capped at 0.6 with ring (`effective()`), and team `buff_crit` auras can push the
  tap-path crit higher (perceived "99%"). Change: **halve the per-level slope and
  clamp the effective crit**: `critChance(level) = Math.min(0.02 + 0.007*level, 0.22)`;
  in `effective()` clamp `crit` to ≤ 0.5; and clamp the tap-time crit (buff auras
  included) to ≤ 0.6 so it can't approach 99%. Retune the 200-stage sim if the
  expectedDamage crit term shifts the taps band (crit only affects `expectedDamage`
  via `1 + crit*4`).

### A2. Splash climbs slower, max radius up to ~2× wider
- `Balance.splashRadius(level) = 22*level`, splash upgrade `maxLevel: 10` (→220px max).
  Change: **slower per level, higher ceiling ≈2× old**: `splashRadius(level) = 14*level`
  and raise the splash upgrade `maxLevel` to `32` → max ≈ 448px (≈2.04× the old 220).
  Fever universal splash (`CONFIG.FEVER.splashRadius`) bumped proportionally.

### A3. Monster attack + defense scale more steeply per stage
- Today: `mobHP = 3*1.25^stage`; monster attack dmg = flat `ATTACK_DEFS[style].dmg`
  fraction of the pet's tap damage (no per-stage growth on the attack side).
  Change: **steeper HP** (`3*1.30^stage`) AND **per-stage monster attack scaling** —
  add `Balance.monsterAtkMult(stage) = 1 + 0.03*stage` (cap ~6×) applied to every
  monster→pet/nest damage; boss ramp (`bossHpMult`) steepened too. This makes late
  stages genuinely threatening. MUST retune the economy/sim: the 200-stage invariant
  test may need its taps band / gold curve re-tuned (raise `goldPerMob` base or tap
  dmg growth) so progression stays playable — the invariant test owns truth; document
  the final constants. Combined with A5 (full heal each stage) the net difficulty is
  intended to rise but stay fair.

### A4. Item drops persist across stage clear (despawn only on lifetime)
- Remove `this.clearDrops()` from `onStageClear()` (`game.js:378`) so uncollected drops
  keep their 8 s lifetime into the next stage. Keep `clearDrops()` on scene SHUTDOWN
  and the nest-broken retry path. Also remove the `stageWouldClear` drop-roll skip
  (`game.js:669-675`) — the final kill's drop now simply persists like any other.

### A5. All pets reset to full & redeploy at each stage start
- `FieldPets.onStageStart()` currently only resets the revive flag + purges temp
  agents; HP/KO persist. Change: on stage start, **restore every agent to full HP,
  clear status, revive any KO'd pet** (call `rebuild()` or an explicit heal-all so
  every pet marches into each new stage fresh). This is exactly the requested
  "스테이지 클리어하면 펫 전부 초기화해서 싸울 수 있게."

### A6. Buttons easier to tap
- `makeUiButton` uses the default hit area = exact button rect (no padding), so
  near-misses fail on mobile. Change: set an explicit padded hit area (+14px each
  side) on the button body via `setInteractive(new Phaser.Geom.Rectangle(...),
  Phaser.Geom.Rectangle.Contains)` sized `w+28 × h+28`. Do the same for the other
  primary tappables (menu nav, shop tabs, ULT button) where a padded target helps.

### A7. Attack-power icon → intuitive sword/knife
- The "Tap Power" upgrade icon (`up-tap`, drawn in `main.js` procedural icon maker)
  is currently abstract. Redraw it as a simple, readable **sword/blade** shape
  (blade + crossguard + hilt), pixel-friendly. Update the icon texture only.

---

## B. Combat feel & skills

### B1. Melee attack juice
- Melee (`monsters.js` `case 'melee'`) lands damage but has weak FX. Add a distinct
  **bite/chomp impact**: a quick pinch-scale on the monster, a small radial impact
  flash + 2-3 spark particles at the strike point, and a crunch SFX — so melee reads
  clearly vs slam/charge. Purely additive FX at the existing strike callback.

### B2. Skills far more visible + distinct + a new PULL archetype
- Make every skill cast unmistakable: a **cast telegraph** (brief wind-up flash on the
  caster in the archetype's color), a **larger unique effect** per archetype (not the
  generic hit-ring), and a small **skill-name popup** (e.g. "FREEZE!", "CHAIN!") in
  the pixel font. Shorten cooldowns modestly (e.g. ×0.75) so skills fire often enough
  to feel present, and skip the cooldown charge on a fully-whiffed (no-target) cast so
  they don't feel wasted.
- **New `pull` archetype** in `skills.js` (the frog-tongue): grabs the nearest enemy
  and drags it toward the caster (tween the target's position toward the caster, then a
  small damage tick). Wire it into a few thematic species (e.g. the `frog` pet, a new
  chameleon/anteater-style monster) so the "혀 쭉 내밀어 끌어오기" reads.
- **More per-species signature identity**: audit the 24 monster + 50 pet skill
  assignments so the roster feels like "each one has its own LoL-style kit" — reassign
  where a species' skill doesn't match its personality; ensure archetype variety
  (incl. the new `pull`). Distinctness/coverage stays test-enforced.

### B3. Fever mode = whole-screen spectacle + exciting BGM
- Current fever = flash + ring + "FEVER!!" banner. Upgrade to a **full-screen
  spectacle**: animated neon gradient/scanline pulse overlay for the fever duration,
  rainbow field tint, denser particles, a persistent glowing border, screen-edge
  chevrons — clearly "the whole screen changes."
- **Exciting BGM**: there is currently NO background music (sfx.js is pure synth).
  Add a synthesized **upbeat chiptune loop** in `sfx.js` that plays only during fever
  (fast arpeggio + driving bass), started in `feverStart()` and stopped in
  `feverEnd()`, respecting the mute flag. (Optionally a calm base menu/game loop later
  — out of scope; fever loop is the ask.)

---

## C. Content

### C1. +40 monster species (48 → 64 total; distinctive & characterful)
- Append **40 new** `species({...}, {...})` entries to `SPECIES`. The painter
  `paintJelly` is fully parametric (radius + ears/horns/tail/pattern/hat/aura/face),
  so no painter rewrite — but each new species must be personality-driven: a distinct
  recipe (pairwise ≥2-field distinct, ≥2 non-none signature parts — test-enforced), a
  fitting `elem`, a `skill` (spread across archetypes incl. the new `pull`), an
  `attack` style, and tuned `radius/hpMult/speed/goldMult/move` (+`quirk` where fun).
  Give them character: names + dex-worthy silhouettes (spiky, blobby, horned, winged,
  regal, tiny-swarm, etc.). Add new heavy/tricky ids to `Spawner.HEAVY_IDS`/`TRICKY_IDS`
  for pacing where appropriate. Boss rotation absorbs them automatically.
- (Monster dex has no per-id lore requirement — skills desc is generic — but add a
  short bilingual-safe lore line per new monster for polish, matching pet dex depth.)

### C2. Nest: finer grid, pets USE furniture, far more everyday decor
- **Finer grid**: `Decor.GRID` 6×4 → **12×8** (96 cells) so items place on a much
  smaller grid; retune decor render sizes to the smaller cell.
- **Many more decor items**: expand `DECOR_ITEMS` from 24 to **~60** with everyday-life
  objects across the 5 categories (furniture: sofa, bed, table, chair, bookshelf,
  fridge, TV, lamp, rug, clock, plant pot, dresser, mirror; toys: ball, yarn, ring
  toss, plushie, scratching post, tunnel; special/floor/background variety). Parametric
  `paintDecor` gains the new shapes.
- **Pets use furniture**: extend NestScene idle AI beyond toys — pets seek and
  interact with furniture (sit on chair/sofa, sleep in bed with zzz, watch TV, eat by
  fridge), each furniture category mapping to a small pet animation. This makes the
  nest feel alive.

---

## D. Juice & art

### D1. Main menu — much cuter, player's own pets frolicking
- Redesign MenuScene: a cozy nest-yard backdrop, and the **player's actual owned pets**
  (from `state.pets`, reusing the NestAI idle) roaming/playing on the menu instead of 3
  static monster jellies. Add gentle motion, decorations placed from the nest, warm
  lighting — a "home you want to return to." Keep buttons but make the whole screen
  inviting.

### D2. Gacha reveal — much flashier / more impactful
- Build on the existing ceremony: longer anticipation build-up (charging glow +
  rising pitch), light rays/beams bursting from the egg, a rarity-colored full-screen
  wash, more/denser particles, and a dramatically bigger **legendary** treatment
  (slowed time, gold god-rays, extra confetti + shake, a "LEGENDARY!" title). Multi-pull
  keeps the staggered grid but each cell gets a pop + rarity beam.

### D3. Pet/monster cards — fancier, refined, cute
- Upgrade the rarity `Frames` + card layout (dex + gacha): richer neon frames with
  inner glow, subtle holo shimmer, rarity gem/badge, a soft drop-shadow, rounded
  "trading-card" proportions, the pet/monster centered with a little pedestal, name
  plate + element/skill chips. Cute + premium, consistent with the retro-neon look.

---

## Testing
- Keep the suite green; migrate any test pinning changed balance values
  (crit/splash/mobHP curves, the 200-stage sim). Add: new `pull` archetype cast test;
  40-new-species recipe distinctness + field validity + skill/elem coverage; decor
  catalog ≥60 items / finer grid math; drops-persist-across-clear logic; pets-full-on-
  stage-start; fever BGM start/stop respects mute (pure guard).
- The 200-stage balance-invariant sim is the load-bearing gate for A1/A2/A3 — retune
  constants until it passes; document final values.

## Out of scope
- Full always-on background music (only the fever loop).
- Real IAP wiring; account/cross-device.
