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
