# Peel It! — Game Design Spec

**Date:** 2026-07-02
**Status:** Approved by user (brainstorming session)
**Target:** Google Play release under the pending Organization account (`com.represen.*`)

## 1. Concept

A zen ASMR mobile game that bottles the universal pleasure of peeling the
protective film off a brand-new phone — and loops it forever. No fail state,
no death, no timer. Only the peel.

- **Genre:** Zen / satisfying / fidget (hyper-casual)
- **Loop philosophy:** infinite mindless repetition (zen), NOT score-rush.
  Tension comes from a light tear-risk system, never from failure.
- **Name:** Peel It! (필 잇!) — used throughout development; may only be
  renamed by an explicit user decision at store-listing time.

## 2. Core Mechanic — Peel with Tear Tension

1. A shiny new object appears with a film layer on top; one corner tab is
   slightly lifted.
2. Player grabs the tab and drags. The film peels following the finger with a
   rolling curl at the peel front. The revealed surface underneath is
   sparkling clean.
3. **Tear tension:** dragging too fast builds stress in the film. Past a
   threshold the film **tears** — the held piece detaches and flies off as a
   physics scrap, leaving a jagged edge with a new lifted tab to continue
   from. Tearing is NOT failure; it only reduces the reward.
4. Peeling the entire panel in one unbroken piece = **PERFECT** — coins ×3,
   special chime, confetti.
5. Object complete → coins awarded → next object.

Design intent: the "slowly… carefully…" self-imposed restraint IS the
dopamine. Zen base + light skill expression, zero punishment.

### Tuning notes

- Stress = f(drag speed, film type). Base film forgiving; later films vary.
- Tear leaves a jagged edge rendered on the film boundary.
- Coins are earned per area peeled regardless of tears; PERFECT is a bonus
  multiplier, so fast-and-messy is always viable (zen preserved).

## 3. Content — Object Escalation

Objects escalate in size and absurdity (humor + shareability):

phone → tablet → laptop → TV → microwave → refrigerator → piano → car →
bus → airplane → gold bar → landmark-scale absurdities…

- v1 scope: **24 objects minimum** (target 30), sequentially unlocked with
  coins.
- Asset cost per object: 2 SVG layers (clean body + film texture overlay) —
  intentionally cheap to author so content can grow post-launch.
- Large objects are split into multiple film panels (e.g., a car has several
  wrap sections), each panel peel-able and PERFECT-able independently.

## 4. Meta Layer — Light Collection/Unlock

- **Coins** earned by peeling; spent to unlock the next object.
- **Showroom (shelf):** peeled objects displayed shiny; objects fully cleared
  with all-PERFECT panels get a gold badge.
- **Daily object:** one featured object per day grants 2× coins (light
  retention hook).
- Film-type unlocks (tempered glass, hologram, vinyl wrap — different sound,
  feel, tear threshold) are deferred to **v1.5**.
- No leaderboard, no server meta. All progress in `localStorage`.

## 5. Sound & Haptics (the heart of the game)

- **Peel sound:** Web Audio–synthesized continuous crackle (adhesive-release
  granular noise); pitch and density modulate in real time with drag speed.
- **Tear:** sharp rip sound + one heavy haptic hit.
- **While peeling:** Capacitor Haptics micro-ticks at a rate proportional to
  peel speed — this is the "touch feel" on device.
- **PERFECT:** sparkle chime.
- All SFX synthesized (no large audio assets) unless quality demands samples.

## 6. Monetization — Real AdMob from Day 1 (ZAP TAP model)

- **Interstitial:** after every 3rd completed object, minimum 60 s apart —
  minimal disruption of the zen flow.
- **Rewarded:** "double coins" on object completion; "unlock next object
  early."
- **Banner:** NEVER during gameplay (zen must not be broken); menu/showroom
  screens only.
- AdMob: register a NEW app under the existing publisher
  `pub-7114194646987493` (account `happyirelim@gmail.com`), same as the
  ZAP TAP org-release pattern. Use test ads during development
  (`USE_TEST_ADS: true`), flip to real units at release.

## 7. Technical Architecture

- **Stack:** Phaser 3 + vanilla JS `www/` + Capacitor Android wrapper — the
  proven ZAP TAP pipeline, reused as-is (build steps, keystore, gradle flow).
- **Peel rendering:** film = overlay layer; peeled region erased via
  mask/RenderTexture; a curl sprite (rolled film cylinder) tracks the peel
  front under the finger. Tear scraps are lightweight physics sprites.
- **Project folder:** `games-for-release/peel-it-mobile/` (gitignored, like
  the other release projects). Reuse the existing release keystore.
- **No Firebase.** No login, no server. Progress = `localStorage`
  (mirrored through Capacitor Preferences if needed for reliability).
- **Status doc:** create `games-for-release/peel-it-mobile/RELEASE_STATUS.md`
  from day 1 (live source of truth, ZAP TAP convention) and register it in
  the project CLAUDE.md status-doc table.
- Standard studio file structure (config/main/game/ui/… , `main.js` loads
  LAST), all known Phaser bug rules from the pipeline memory apply.

## 8. Release Path

- **Package:** `com.represen.peelit` — org-account namespace.
- **Gate:** wait for the Organization Play Console account (D-U-N-S currently
  under manual D&B verification). Org accounts are exempt from the 14-day
  closed-test requirement → straight to production when ready.
- **Until then:** local AAB/APK builds for real-device testing; optionally a
  gh-pages web build for fast feel-tuning iterations.
- Publishing to any Play track remains a user-gated explicit action (project
  rule).

## 9. Out of Scope (v1)

- Film-type variety (v1.5)
- Leaderboards / any server backend
- iOS build
- Skins/cosmetics store beyond the object unlock chain
- Offline/idle earnings (rejected: dilutes the zen-fidget identity)

## 10. Success Criteria

- The peel feels good enough that testers replay with no instruction —
  session length > 3 min in playtests.
- 60 fps peel interaction on a mid-range Android device.
- Zero console errors; PERFECT/tear/unlock loop fully functional.
- Ready-to-upload AAB with real AdMob IDs, waiting only on the org account.
