# AI Game Studio

Agent-team-based automated game production pipeline. Say "게임 N개 만들어줘" and the system automatically generates ideas, validates, plans, develops, tests (with Playwright), fixes bugs, deploys to gh-pages, and notifies via Slack.

## Architecture

### Meta Leaders (3)
- **Director** - Creative/quality oversight
- **Producer** - Schedule/efficiency management
- **Critic** - Review/improvement analysis

### Pipeline Agents (16+)
- **Ideators** (3): Spark, Oddball, Trendsetter
- **Idea Judges** (4): Professor Ludus, Dr. Loop, Cash, Scout
- **Planner** (1): Architect
- **Plan Judges** (3): Builder, Joy, Profit
- **Developer** (1): Developer
- **Testers** (3): Player One, Bugcatcher, AdCheck
- **Deployer** (1): Shipper

### Pipeline Flow

```
Idea Generation (parallel) → Idea Validation (weighted scoring)
→ Planning → Plan Validation → Development
→ Testing + Bug Fix Loop (Playwright) → Deployment (gh-pages)
```

## Scoring System

- **Idea Gate**: 70/100+ to proceed
- **Plan Gate**: 70/100+ to develop (50-69 gets feedback revision, max 2 rounds)
- **Test Gate**: 70/100+ to ship (50-69 gets bug fix + retest, max 2 rounds)

## Game Tech Spec

- **Engine**: Phaser 3 (CDN), optional PixiJS or vanilla Canvas
- **Graphics**: SVG generated in-code
- **Target**: Mobile web (360-428px, touch-only)
- **Structure**: index.html + modular JS (max 300 lines/file), no build step

## Usage

```
/game-studio
> 게임 3개 만들어줘
```

## Project Structure

```
.claude/agents/game-studio.md   # Entry point slash command
agents/                         # Agent prompt templates (19+)
docs/                           # Pipeline docs & templates
data/                           # Ideas DB, performance tracking
games/                          # Generated games
```
