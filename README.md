# AI Game Studio for Claude Code CLI

Agent-team-based automated game production pipeline. Just say "Make N games" and it handles everything end-to-end: ideation, validation, planning, development, testing, bug fixing, deployment, and Slack notification — fully automated.

## Usage

### Create Games (from scratch)
```
/game-studio
> Make 5 games
```

### Evolve Games (upgrade existing)
```
/evolve-game alarm-slap
```

## How It Works

A 10-phase pipeline executes sequentially:

```
Phase 0: Setup          — Initialize environment, clean up ports
Phase 1: Ideation       — 5 ideators generate ideas in parallel
Phase 2: Validation     — 5 judges score with weighted evaluation (75+ to pass)
Phase 3: Planning       — Architect writes GDD (Game Design Document)
Phase 4: Plan Review    — 3 judges validate the plan (70+ to pass)
Phase 5: Development    — Developer (Opus) builds games in parallel (Phaser 3 + SVG)
Phase 6: Testing        — Playwright-based automated testing (BC+PO+RT)
Phase 7: Bug Fix        — Fix failures → retest (max 2 rounds)
Phase 8: Deployment     — Deploy to gh-pages + Slack notification
Phase 9: Retrospective  — 3 meta leaders evaluate agent performance → improve prompts
```

## Agents (42)

### Meta Leaders — Pipeline Self-Improvement
| Agent | Role |
|-------|------|
| **Director** | Creative/quality oversight |
| **Producer** | Efficiency/schedule management |
| **Meta-Critic** | Review/improvement analysis |

### Ideators — Idea Generation (parallel)
| Agent | Style |
|-------|-------|
| **Spark** | Physics-based innovative mechanics |
| **Oddball** | Humor/meme-driven quirky concepts |
| **Trendsetter** | Viral trend exploitation |
| **Visionary** | Experimental creative concepts |
| **Puzzler** | Action + puzzle hybrids |

### Idea Judges — Idea Validation (weighted scoring)
| Agent | Focus | Weight |
|-------|-------|--------|
| **Professor Ludus** | Game mechanic depth | 0.25 |
| **Dr. Loop** | Addiction/replayability | 0.20 |
| **Devil** | Exploit/balance testing | 0.25 |
| **Cash** | Monetization potential | 0.15 |
| **Scout** | Marketability | 0.15 |

### Plan Judges — Plan Validation
| Agent | Focus |
|-------|-------|
| **Builder** | Technical feasibility |
| **Joy** | Fun/juice factor |
| **Profit** | Business viability |

### Core Pipeline
| Agent | Role |
|-------|------|
| **Architect** | GDD authoring (game design) |
| **Developer** | Game development (Opus model) |
| **Shipper** | gh-pages deployment |

### Testers — Playwright Automated Testing
| Agent | Focus | Weight |
|-------|-------|--------|
| **Bugcatcher** | Bug detection (blocker/major/minor) | 0.40 |
| **Player One** | Fun experience (10-item Fun Heuristic) | 0.35 |
| **Replay Tester** | Replay value assessment | 0.25 |
| **AdCheck** | Ad integration verification | — |

### Evolution Agents — Game Evolution
| Agent | Role |
|-------|------|
| **Game Analyzer** | Analyze existing games |
| **Mechanic Evolver** | New input mechanics/combos |
| **Content Evolver** | Enemies/bosses/hazards |
| **Design Evolver** | Game modes/challenges |
| **Feel Evolver** | Power-ups/collectibles |
| **Fun Evolver** | Super moves/fever modes/bosses |
| **Meta Evolver** | Skill trees/unlock systems |
| **Upgrader** | Execute code modifications (Opus model) |

### Evolution Reviewers — Evolution Proposal Evaluation
| Agent | Perspective |
|-------|-------------|
| **Casual Critic** | Casual player perspective |
| **Core Critic** | Core gamer perspective |
| **Kid Critic** | Child player perspective |
| **Dopamine Analyst** | Reward/dopamine loop |
| **Loop Doctor** | Game loop completeness |
| **Retention Expert** | Retention/engagement |

### Evolution Testers — Evolution Quality Testing
| Agent | Focus |
|-------|-------|
| **Speed Runner** | Speedrun optimization testing |
| **Explorer** | Exploration/hidden element testing |
| **Stress Tester** | Stress/load testing |

## Game Tech Spec

- **Engine**: Phaser 3 (CDN)
- **Graphics**: SVG (generated in-code)
- **Target**: Mobile web (360-428px, touch-only)
- **Structure**: index.html + modular JS (max 300 lines/file), no build step

## Project Structure

```
.claude/agents/          ← All agent prompts (42)
  game-studio.md         ← Production pipeline orchestrator
  evolve-game.md         ← Evolution pipeline orchestrator
docs/                    ← Pipeline docs, scoring specs, templates
data/                    ← Ideas DB, run history, agent performance
games/                   ← Generated games (games/{slug}/)
```

## Scoring System

| Gate | Threshold | Retry |
|------|-----------|-------|
| Idea | 75+ to pass | Top-N selection |
| Plan | 70+ to pass | Feedback revision, max 2 rounds |
| Test | 70+ to ship | Bug fix + retest, max 2 rounds |
