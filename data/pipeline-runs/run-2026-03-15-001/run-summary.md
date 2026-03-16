# Pipeline Run Summary: run-2026-03-15-001

## Overview
- **Date**: 2026-03-15
- **Requested**: 3 brain/puzzle games
- **Shipped**: 3/3
- **Genre Focus**: Brain/puzzle/strategy

## Shipped Games

| # | Game | Creator | Idea Score | Test Score | Status |
|---|------|---------|-----------|------------|--------|
| 1 | Bureaucrat Panic | oddball | 76.3 | 71 | SHIPPED |
| 2 | Suspect Sudoku | oddball | 73.3 | 69 | SHIPPED |
| 3 | Sequence Lock | trendsetter | 66.5 | 72 | SHIPPED |

**Average Idea Score**: 72.0
**Average Test Score**: 70.7

## Pipeline Stats
- **Ideas Generated**: 10 (spark:2, oddball:2, trendsetter:2, puzzler:2, visionary:2)
- **Ideas Passed Validation**: 2 (+ 1 top-3 selection)
- **Ideas Vetoed**: 1 (Liar's Manual - double veto)
- **Plans Created**: 3/3
- **Plans Passed**: 3/3
- **Dev Complete**: 3/3
- **Fix Rounds**: 1 (all 3 games had major bugs fixed)
- **Games Deployed**: 3/3

## Bug Fix Summary
| Game | Bugs Found | Major | Fixed |
|------|-----------|-------|-------|
| Bureaucrat Panic | 6 | 1 (deterministic RNG) | 2 (RNG entropy + idle timing) |
| Suspect Sudoku | 6 | 2 (SVG sizing + restart card) | 2 (SVG width/height + shutdown handler) |
| Sequence Lock | 4 | 2 (hitArea coords + btnY closure) | 2 (local coords + closure capture) |

## Key Learnings
1. **SVG width/height is mandatory**: Missing explicit dimensions causes 300x150 default rendering
2. **Phaser hitArea uses local coordinates**: Custom hit areas must be relative to zone origin
3. **Closure capture in delayedCall**: Variables mutated between scheduling and execution need snapshot
4. **Deterministic RNG kills replayability**: Always include session entropy in stage generation
5. **Brain games score lower on replay**: Average RT score lower than action games (~65 vs ~70)
6. **5 new ideator roles validated**: puzzler and visionary contributed 4 ideas each, but scored lowest
7. **Devil veto effective**: Caught 1 unloseable design (Liar's Manual) and 1 exponential overflow (Signal Lock)

## Deployment URLs
- Bureaucrat Panic: https://jireh-father.github.io/ai-game-studio/bureaucrat-panic/
- Suspect Sudoku: https://jireh-father.github.io/ai-game-studio/suspect-sudoku/
- Sequence Lock: https://jireh-father.github.io/ai-game-studio/sequence-lock/
- Game Catalog: https://jireh-father.github.io/ai-game-studio/
