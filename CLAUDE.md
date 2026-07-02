# AI Game Studio

## Core Goal: Continuous Self-Evolution

The #1 goal of this entire system is to **continuously evolve and improve itself with every run**. Every pipeline execution — whether `/game-studio` or `/evolve-game` — MUST leave the system better than it found it. This means:

- **Agents improve**: Retrospective phases (Phase 9) evaluate every agent, adjust prompts, hire/fire agents, and restructure teams based on performance data.
- **Quality ratchets up**: Lessons learned from each run are encoded into agent prompts, scoring thresholds, and pipeline rules — never repeated mistakes.
- **Process optimizes**: Bottlenecks discovered in one run are eliminated in the next. Scoring calibration, timing budgets, and gate thresholds adapt.
- **The pipeline is a living system, not a static tool.** Treat every run as training data for the next run.

---

Agent-team-based automated game production pipeline.
"Make N games" → Ideation → Validation → Planning → Development → Testing (Playwright) → Bug Fix → gh-pages Deployment → Slack Notification — fully automated end-to-end.

## How to Run

Run `/game-studio` slash command, then request e.g. "Make 5 games".
Full orchestration logic: `.claude/agents/game-studio.md`.

Run `/evolve-game {slug}` to evolve an existing shipped game.
Evolution pipeline logic: `.claude/agents/evolve-game.md`.

## Project Structure

```
.claude/agents/                 ← All agents (YAML frontmatter, official agent format)
  game-studio.md                ← Pipeline orchestrator (/game-studio)
  evolve-game.md                ← Evolution pipeline orchestrator (/evolve-game)
  spark.md, oddball.md, ...     ← 5 ideators
  professor-ludus.md, ...       ← 5 idea judges
  architect.md                  ← Game planner (GDD author)
  builder.md, joy.md, profit.md ← 3 plan judges
  developer.md                  ← Game developer (opus model)
  player-one.md, bugcatcher.md, replay-tester.md ← 3 testers
  shipper.md                    ← Deployer
  director.md, producer.md, meta-critic.md ← 3 meta leaders
  game-analyzer.md              ← Game analysis agent
  *-evolver.md (6)              ← Evolver agents
  casual-critic.md, ... (6)     ← Evolution reviewers
  speed-runner.md, ... (3)      ← Evolution testers
  upgrader.md                   ← Upgrader (opus model)
docs/                           ← Pipeline docs, scoring specs, templates
data/                           ← Ideas DB, agent performance, pipeline run data
games/                          ← Generated games (games/{slug}/)
```

## Available Tools

- **Agent Teams**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` enabled
- **Playwright**: MCP plugin enabled (for testing)
- **Slack**: MCP plugin enabled (for notifications)

## CRITICAL: No Temporary Files in Project Root

**NEVER create temporary files (screenshots, test scripts, images, logs, etc.) in the project root directory.**

All temporary/intermediate files MUST go to their designated locations:
- **Screenshots**: `./tmp/{slug}-{context}.png` (create `./tmp/` if missing)
- **Test scripts**: `./tmp/` or `./test-results/`
- **Any other temp files**: `./tmp/`

This rule applies to ALL agents (testers, developers, deployers, etc.). The project root must contain only tracked project files. Violations of this rule create massive git noise with hundreds of untracked files.

## Screenshot Rule

All test/deploy screenshots MUST be saved to `./tmp/` directory (create if missing). Never save screenshots to the project root. Filename pattern: `./tmp/{slug}-{context}.png`.

## Live Status Documents (single source of truth per ongoing work)

Some long-running, multi-session efforts have a dedicated `*_STATUS.md` file that
serves as the live source of truth — read it FIRST and update it AFTER every
meaningful action. Never re-derive state from scratch when one of these exists.

| Effort | Status doc | Notes |
|---|---|---|
| **ZAP TAP** (formerly "Sequence Lock") — Play Store release (Firebase + AdMob + Play Console) | `games-for-release/sequence-lock-mobile/RELEASE_STATUS.md` | **THIS is the game currently in active release preparation** — the Capacitor Android project at `games-for-release/sequence-lock-mobile/` (in-store brand **ZAP TAP**, package `com.ruelstudio.sequencelock`). Any "the game we're releasing / 출시 준비 중인 게임" refers here. gitignored (whole `games-for-release/` is); read this status doc at the start of any session that touches this work, and append to its Progress Log on every action. **Release Google account: `happyirelim@gmail.com`** (Play Console + Firebase `sequence-lock-5b5b9` + new AdMob; the old `seoilgun@gmail.com` Firebase/AdMob stack is abandoned). **STATUS: publicly LIVE on Play production (v47 / 1.0.46, worldwide) since 2026-07-01.** The status doc now also tracks post-launch work — AdMob `app-ads.txt` (§3.4), and User Acquisition: Google Ads campaigns + the Google Ads API automation (§11). |
| **Peel It!** — zen ASMR film-peeling game, Play release under the pending ORG account | `games-for-release/peel-it-mobile/RELEASE_STATUS.md` | New Capacitor Android project (package `com.represen.peelit`), built 2026-07-02. Phaser 3 + Capacitor 6, no Firebase, AdMob TEST IDs (`USE_TEST_ADS:true`). **STATUS: BUILD READY** — signed AAB + debug APK built, 34/34 tests green. Release gates: (1) org Play account (D-U-N-S pending, shared with the ZAP TAP org re-release), (2) AdMob real app creation in a normal Chrome under `happyirelim` pub `pub-7114194646987493`. Spec/plan: `docs/superpowers/{specs,plans}/2026-07-02-peel-it-*.md`. Has its own LOCAL git repo inside the folder (parent repo gitignores it). |
| **SMOOSH!** — infinite-stage jelly tap-slaughter (tap-RPG-lite), Play release under the pending ORG account | `games-for-release/smoosh-mobile/RELEASE_STATUS.md` | New Capacitor Android project (package `com.represen.smoosh`), built 2026-07-02. Phaser 3 + Capacitor 6, no Firebase. **STATUS: BUILD READY** — signed AAB with REAL AdMob IDs (app `~5373653709` under `pub-7114194646987493`, `USE_TEST_ADS:true`), 30/30 tests incl. a 200-stage balance-invariant sim. Only gate left: the org Play account (same D-U-N-S wait as ZAP TAP org + Peel It!). Spec/plan: `docs/superpowers/{specs,plans}/2026-07-02-smoosh-*.md`. Own LOCAL git repo inside the folder. |

When adding a new long-running effort that spans sessions, create a status doc
in the relevant project folder and add a row here.

## Android App Build & Release (Capacitor → Google Play)

Applies to the Capacitor-wrapped mobile games under `games-for-release/` (e.g.
`sequence-lock-mobile`, in-store brand **ZAP TAP**, package
`com.ruelstudio.sequencelock`). Full live state is in that project's
`RELEASE_STATUS.md` — read it first.

> **📖 Release how-to manual:** `games-for-release/sequence-lock-mobile/RELEASE_MANUAL.md`
> — the step-by-step playbook for building the AAB and publishing to the Internal
> and Closed (Alpha) tracks via agent-browser (browser/login setup, the reliable
> AAB-upload trick, versionCode-uniqueness gotcha, release-notes/modals helpers,
> exact Korean Play Console button sequence). `RELEASE_STATUS.md` = live *state*;
> `RELEASE_MANUAL.md` = the *how-to*. Both live in the gitignored release folder.

> **⚠️ ZAP TAP is NOT 어코다 (accorda).** This release = **ZAP TAP only** —
> Play developer `ruel studio` (dev ID `5002108034377040260`), app ID
> `4972587762744655721`, Google account `happyirelim@gmail.com`. `어코다`/accorda
> is a *separate* app (dev ID `5571509079345214998`, app ID
> `4975492542726202014`) living in its own repo `D:\source\accorda\` with its own
> local memory — never act on it from this project. The shared login Chrome on
> CDP port 9222 often defaults to 어코다's page; always navigate to the ZAP TAP
> app dashboard and confirm the page title reads **ZAP TAP** before any Play
> Console action. Full identity table: `RELEASE_STATUS.md` → "⚠️ APP IDENTITY".

### CRITICAL: Never publish to Play Console unless explicitly told to

**Do NOT upload, create releases, submit for review, or publish to Google Play
Console unless the user gives a direct, explicit instruction to do so in the
current request** (e.g. "출시해줘", "스토어에 올려줘", "submit to Play Console",
"deploy to the closed track"). Building an AAB locally is fine when asked to
build; **pushing it to any Play track (internal/closed/production) is a
separate, gated action that requires its own explicit go-ahead.** When in doubt,
build + report that it's ready and ask before touching the Console.

### Build steps (local AAB)

1. **Bump version** in `android/app/build.gradle`: `versionCode` (+1) and
   `versionName`. Also update the footer strings in `www/js/ui.js` (two
   `v1.0.xx` literals — menu footer + settings/about).
2. **Sync web → native**: `npx cap sync android` (copies `www/` into
   `android/app/src/main/assets/public/`, updates plugins). Always run after any
   `www/js/*` change — the AAB ships the *synced* copy, not `www/` directly.
3. **Build**: set `JAVA_HOME` to the Android Studio JBR (JDK 21) and run
   `gradlew -p android bundleRelease`:
   - PowerShell: `$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"; & "android\gradlew.bat" -p android bundleRelease`
   - Output: `android/app/build/outputs/bundle/release/app-release.aab` (~6 MB),
     signed by the release keystore (`android/sequence-lock-release.keystore`,
     alias `sequence-lock`; passwords default-embedded in `build.gradle`, override
     via `SL_STORE_PASSWORD` / `SL_KEY_PASSWORD`).
4. **Verify before reporting done**: `node --check` each edited JS file;
   confirm the new `versionName` is present (and the old one absent) in the AAB's
   `base/manifest/AndroidManifest.xml`; `grep` the synced assets to confirm the
   code change actually made it in.

### Toolchain notes (Windows)

- **No ImageMagick**: Windows `convert` is the disk utility, and `magick` is
  absent. Use **Python Pillow** (installed) for image generation/resizing.
- **`@capacitor/assets` is NOT installed** — launcher icons are edited by hand.
  Launcher icon = adaptive `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher*.xml`
  (`@mipmap/ic_launcher_foreground` + `_background`) plus per-density PNGs in
  `mipmap-{m,h,xh,xxh,xxxh}dpi/`. This is **separate** from the 512px Play store
  listing icon — both must be updated for the on-device icon to match the store.
- **Do NOT touch** the 11 `splash.png` files or unrelated `res/` resources when
  changing icons.

### Publishing flow (ONLY when explicitly instructed)

Via Playwright on `play.google.com/console`: closed-test "Alpha" track
(id `4698443016258763224`) → 새 버전 만들기 → upload AAB → release notes →
다음 → 저장 → 게시 개요 → "검토를 위해 변경사항 전송" → confirm. Managed publishing
is OFF, so an approved review auto-publishes. Production is hard-gated (≥12
testers × 14 continuous days first). Opt-in links and full step log live in
`RELEASE_STATUS.md`.

## Post-launch: AdMob revenue + User Acquisition (ZAP TAP)

ZAP TAP is publicly LIVE on Play production. Full live state = `RELEASE_STATUS.md`
(§3.4 app-ads.txt, §11 User Acquisition + Google Ads API). Key facts:

- **AdMob revenue**: the app ships REAL ads (`www/js/ads.js` `USE_TEST_ADS:false`).
  `app-ads.txt` (`google.com, pub-7114194646987493, DIRECT, f08c47fec0942fa0`) is hosted
  at `https://jireh-father.github.io/app-ads.txt` and the Play "developer website"
  (스토어 설정 → 연락처 세부정보) points there so AdMob can verify authorized sellers.
- **Google Ads (User Acquisition, NOT AdMob)**: account `114-582-4462` (happyirelim). Two
  campaigns — KR/한국어 + WW/English, "순발력 테스트 / reflex-test" angle — are spec'd in
  `RELEASE_STATUS.md §11.6` (ready to launch manually in a normal browser).
- **Google Ads API automation** — `games-for-release/sequence-lock-mobile/google-ads-api/`
  (gitignored): Python scripts + `google-ads.yaml` (holds creds — never commit) to create
  app-install campaigns programmatically. All auth is set up (OAuth client + refresh token,
  MCC "Ruel Studio MCC" `629-246-6541`, and a developer token — **all secret values live
  ONLY in the gitignored `google-ads.yaml`, never in this tracked file**); **waiting on
  Google's Basic-access review (~3 business days)**. After approval: `python
  create_app_campaign.py campaigns.json KR|WW`. See that folder's `README.md`.

### Driving Google AD consoles under agent-browser (CDP) — CRITICAL technique

`ads.google.com` and `console.cloud.google.com` DO render under the debug-port browser,
but they IGNORE programmatic `.click()` (the ads "Turn off ad blockers" banner is a false
positive that blocks *programmatic* clicks only, not the port). **Use real CDP
`Input.dispatchMouseEvent` (trusted mouse gestures at the element's center) + `Input.insertText`
for typing** — this drove the ENTIRE Google Ads MCC signup + developer-token application
automatically. Only **reCAPTCHA** and **phone 2FA** are genuinely human-only. **AdMob
`admob.google.com` is the exception: its main panel never hydrates under CDP (stays blank),
so AdMob steps must be done in a normal Chrome.** Capture OAuth client secrets via CDP
`Network.getResponseBody` on the create-call (the new Cloud console hides them + blocks
downloads). Full detail: user memory `reference_agent_browser_google_login_workaround.md`.

## Agent Self-Report System (added run-008)

Every agent MUST write a `## Self-Report` section at the end of their output. The orchestrator saves these to `{run_id}/retrospective/agent-reports/`. Phase 9 meta-leaders use these self-reports as primary input for the retrospective. See `game-studio.md` → "Agent Self-Report Protocol" for full spec.

## CRITICAL: English-Only Rule for All Prompts

**ALL agent prompts, orchestrator prompts, system instructions, GDD templates, and pipeline documents MUST be written entirely in English.** This includes:

- Agent `.md` files in `.claude/agents/`
- Pipeline documentation in `docs/`
- GDD templates and scoring specs
- Retrospective reports and self-reports
- Comments and instructions within code

Korean is ONLY allowed in:
- User-facing example strings (e.g., "게임 3개 만들어줘")
- README.md (user documentation)
- Slack notification messages to users

No exceptions. Any agent that produces non-English prompts or documentation must be corrected immediately.
