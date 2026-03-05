# Retrospective — run-2026-03-05-001

## Summary
- **Date**: March 5, 2026
- **Request**: 10 games
- **Result**: 10/10 shipped (100% ship rate)
- **Bugs found post-ship**: 3 (all fixed)

## What Went Well

1. **100% ship rate** — First run to ship every game requested. Pipeline overhaul from run-001/002 paid off.
2. **Parallel development** — 10 opus developer agents ran concurrently, each producing a complete game.
3. **Diverse game types** — Physics (Magma Flow, Spin Clash, Wrecking Swing), reflex (Swipe Dojo, Spam Call Smash), humor (Escalator Chaos, Noodle Lasso, Flip Burger), survival (Tidal Rush, Rope Riot).
4. **Plan quality high** — All 10 plans passed validation with scores ranging 74.8–84.3. Builder judge had especially high confidence.
5. **Creator balance** — Spark 4, Trendsetter 4, Oddball 2. Good variety of styles.

## What Went Wrong

1. **Testing at scale failed** — 30 tester agents (3 per game × 10 games) overwhelmed resources. Full Playwright testing only completed for 2/10 games. Remaining 8 got smoke tests only (HTTP + file validation).
2. **Bugs shipped to production** — Swipe Dojo freeze bug and Flip Burger RETRY blocker were found by testers but NOT fixed before deployment. Pipeline needs a fix-before-ship gate.
3. **Playwright shared browser conflicts** — Multiple test agents navigating the same browser caused interference. Each tester needs isolated browser instances.
4. **Context window exhaustion** — Pipeline ran out of context mid-execution, requiring session continuation. With 10 games, the orchestrator context fills up fast.

## Bugs Analysis

| Bug | Game | Severity | Root Cause | Pattern |
|-----|------|----------|------------|---------|
| timeScale freeze | Swipe Dojo | Critical | `delayedCall` doesn't fire at `timeScale=0` | Phaser timer gotcha |
| RETRY blocked | Flip Burger | Critical | Text depth > button depth intercepts events | UI layering mistake |
| stageText null | Flip Burger | Moderate | Event emitted before listener scene creates text | Race condition |

**New rule to add**: When using `timeScale=0` for hit-stop effects, ALWAYS use `setTimeout()` instead of Phaser's `delayedCall()`.

**New rule to add**: Interactive UI buttons must have text as non-interactive decoration OR both button and text must be interactive.

## Recommendations for Next Run

1. **Testing strategy**: For runs with 5+ games, use tiered testing:
   - Tier 1 (top 3 by plan score): Full Playwright with 3 testers
   - Tier 2 (remaining): Smoke test + single code-review tester
2. **Fix-before-ship gate**: Tester findings must be applied BEFORE deployment. Add a bug-fix phase between testing and deployment.
3. **Isolated browser contexts**: Each tester agent must launch its own browser instance, not share one.
4. **Context management**: For 10+ games, consider splitting into two batches of 5 to avoid context exhaustion.
5. **Developer rules update**: Add the timeScale/setTimeout pattern and UI depth rules to developer.md.

## Agent Performance Notes

- **Spark**: Consistently high idea quality. Magma Flow (77.9) was top idea score. Physics games well-executed.
- **Trendsetter**: Good plan scores (Flip Burger 84.3 top plan). Swipe Dojo had the freeze bug though — may need better effects patterns.
- **Oddball**: Only 2 games passed (Escalator Chaos, Spam Call Smash). Oddball ideas tend to score lower on Scout (novelty paradox — too weird for market fit).
- **Builder judge**: Highest variance judge (71–92 range). Very good at distinguishing buildable from risky plans.
- **Player One tester**: Scored Swipe Dojo 35/100, correctly identifying the freeze as game-breaking. Good calibration.

## Score Distributions

- Idea scores: 69.6 – 77.9 (avg 72.5)
- Plan scores: 74.8 – 84.3 (avg 79.2)
- Ship rate: 100%
